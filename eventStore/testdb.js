const uuidv1 = require('uuid/v1');
const Promisify = require('promisify-cb');
const Event = require('../event');
const Snapshot = require('./Snapshot');
const EventStoreHandler = require('./EventStoreHandler');
const Transaction = require('./transaction.class');
const EventStoreError = require('./errors/event_store.error');
const emitter = require('../lib/bus');

let microserviceName = process.env.MICROSERVICE_NAME;
const defaultEventStore = {
    eventStore: {},
    snapshots: {},
};

function emit(message, payload) {
    emitter.emit(message, payload);
}

function on(message, cb) {
    emitter.on(message, cb);
}

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

class TestDbESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.eventStore = {};
        this.snapshots = {};
    }

    /**
     * Saves an event into the event store
     * @param {string} streamId Event stream id to which write the event
     * @param {number} revisionId The current revision the stream is believed to be
     * @param {string} message The event name
     * @param {object} payload Payload of the event
     * @param {function} cb Asynchronous callback
     */
    save(streamId, revisionId, message, payload, cb) {
        this._checkSaveParams(streamId, revisionId, message, payload);
        let eId = revisionId || payload._revisionId || 0;
        eId++;
        delete payload._revisionId;
        const event = new Event(streamId, eId, message, toJSON(payload));
        return this.saveEvent(event, cb);
        
        /* return Promisify(() => {
            let eId = revisionId || payload._revisionId || 0;
            eId++;
            delete payload._revisionId;
            if (!streamId)
                streamId = uuidv1();
            if (!this.eventStore[streamId])
                this.eventStore[streamId] = { streamId, revision: 0, events: [] };
            const revision = this.eventStore[streamId].revision;

            const event = new Event(streamId, eId, message, toJSON(payload));
            if (revision + 1 === eId) {
                this.eventStore[streamId].events.push(event);
                this.eventStore[streamId].revision++;
            } else
                throw EventStoreError.eventAlreadyExistsError('Stream revision not syncronized.');
            emit('microservice-test', event);
            return event;
        }, cb); */
    }

    _saveEvent(event) {
        this._checkEvent(event);
        if (!this.eventStore[event.streamId])
            this.eventStore[event.streamId] = { streamId: event.streamId, revision: 0, events: [] };
        const revision = this.eventStore[event.streamId].revision;
        if (revision + 1 === event.eventId) {
            this.eventStore[event.streamId].events.push(event);
            this.eventStore[event.streamId].revision++;
        } else
            throw EventStoreError.eventAlreadyExistsError('Stream revision not syncronized.');
        emit('microservice-test', event);
        return event;
    }

    /**
     * Saves an event into the event store
     * @param {Event} event The event to be saved
     * @param {function} cb Asynchronous callback
     */
    saveEvent(event, cb) {
        this._checkEvent(event);
        return Promisify(() => {
            this._saveEvent(event);
            return event;
        }, cb);
    }

    /**
     * Saves multiple events into the event store, in a non-transactional way.
     * @param {Event[]} events The event to be saved
     * @param {function} cb Asynchronous callback
     */
    saveEvents(events, cb) {
        this._checkArrayOfEvents(events);
        return Promisify(() => {
            events.forEach(e => this._saveEvent(e));
            return events;
        }, cb);
    }
    
    /**
     * 
     * @param {Transaction} transaction The transaction to commit
     * @param {function} cb Asynchronous callback
     */
    commitTransaction(transaction, cb) {
        if (!(transaction instanceof Transaction))
            throw EventStoreError.paramError('\'transaction\' parameter must be an instance of Transaction class');
        return Promisify(() => {
            throw new EventStoreError('commitTransaction() not implemented');
        }, cb);
    }

    get transactionMaxSize() {
        return Number.MAX_SAFE_INTEGER;
    }

    /**
     * Return the stream of events written to the specified event stream
     * @param {string} streamId The stream id
     * @param {function} cb Asynchronous callback
     * @returns {Event[]}
     */
    getStream(streamId, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        return Promisify(() => {
            if(!this.eventStore[streamId])
                return [];
            return this.eventStore[streamId].events.map(e => Event.fromObject(toJSON(e)));
        }, cb);
    }

    /**
     * Saves a snapshot of the provided event stream
     * @param {string} streamId The stream id of which this snapshot belongs
     * @param {number} revisionId The last processed event in computing this aggregate
     * @param {object} payload Payload of snapshot
     * @param {function} cb Asynchronous callback
     */
    saveSnapshot(streamId, revisionId, payload, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        if ((!revisionId && revisionId !== 0) || typeof revisionId !== 'number')
            throw EventStoreError.paramError(`'revisionId' must be a number. Found: ${typeof revisionId}`);
        if (!payload)
            throw EventStoreError.paramError(`Missing 'payload' parameter`);
        return Promisify(() => {
            const snapshot = new Snapshot(streamId, revisionId, toJSON(payload));
            this.snapshots[streamId] = snapshot;
        }, cb);
    }

    /**
     * Retrieves the snapshot of the provided event stream
     * @param {string} streamId The stream id of which the snapshot belongs
     * @param {function} cb Asynchronous callback
     * @returns {Snapshot}
     */
    getSnapshot(streamId, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        return Promisify(() => {
            if (!this.snapshots[streamId])
                return null;
            return Snapshot.fromObject(this.snapshots[streamId]);
        }, cb);
    }

    reset() {
        this.eventStore = {};
        this.snapshots = {};
    }

    resetEmitter() {
        emitter.eventNames().forEach(e => emitter.removeAllListeners(e));
    }
}

const defaultHandler = new TestDbESHandler(microserviceName);
defaultHandler.EsHandler = TestDbESHandler;

module.exports = defaultHandler;
