const EventEmitter = require('events');
const uuidv1 = require('uuid/v1');
const Promisify = require('promisify-cb');
const EventStoreHandler = require('./EventStoreHandler');
const Event = require('../event');

const defaultEventStore = {
    eventStore: {},
    snapshots: {},
};
const emitter = new EventEmitter();

function emit(message, payload) {
    emitter.emit(message, payload);
}

function on(message, cb) {
    emitter.on(message, cb);
}

class TestDbESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.eventStore = {};
        this.snapshots = {};
    }

    save(streamId, eventId, message, payload, cb) {
        return Promisify(() => {
            delete payload._revisionId;
            if (!streamId)
                streamId = uuidv1();
            if (!this.eventStore[streamId])
                this.eventStore[streamId] = { streamId, revision: 0, events: [] };
            const revision = this.eventStore[streamId].revision;

            const event = new Event(streamId, eventId || this.eventStore[streamId].events.length, message, Object.assign({}, payload));
            if (revision === this.eventStore[streamId].revision) {
                this.eventStore[streamId].events.push(event);
                this.eventStore[streamId].revision++;
            } else
                throw new Error('Stream revision not syncronized.');
            emit(`${event.message}`, payload);
            return event;
        }, cb);
    }

    getStream(streamId, cb) {
        return Promisify(() => this.eventStore[streamId].events.map(e => Event.fromObject(e)));
    }

    saveSnapshot(aggregateId, revisionId, payload, cb) {
        return Promisify(() => {
            this.snapshots[aggregateId] = { revision: revisionId, payload };
        });
    }

    getSnapshot(aggregateId, cb) {
        return Promisify(() => this.snapshots[aggregateId]);
    }

    reset() {
        this.eventStore = {};
        this.snapshots = {};
    }

    resetEmitter() {
        emitter.eventNames().forEach(e => emitter.removeAllListeners(e));
    }
}

/* Utility functions */
/*
function saveUtility(es, streamId, eventId, message, payload, cb) {
    return Promisify(() => {
        delete payload._revisionId;
        if (!streamId)
            streamId = uuidv1();
        if (!es.eventStore[streamId])
            es.eventStore[streamId] = { streamId, revision: 0, events: [] };
        const revision = es.eventStore[streamId].revision;

        const event = new Event(streamId, eventId || es.eventStore[streamId].events.length, message, Object.assign({}, payload));
        if (revision === es.eventStore[streamId].revision) {
            es.eventStore[streamId].events.push(event);
            es.eventStore[streamId].revision++;
        } else
            throw new Error('Stream revision not syncronized.');
        emit(`${event.message}`, payload);
        return event;
    }, cb);
}

function getStreamUtility(es, streamId, cb) {
    return Promisify(() => es.eventStore[streamId].events.map(e => Event.fromObject(e)));
}

function saveSnapshotUtility(es, aggregateId, revisionId, payload, cb) {
    return Promisify(() => {
        es.snapshots[aggregateId] = { revision: revisionId, payload };
    });
}

function getSnapshotUtility(es, aggregateId, cb) {
    return Promisify(() => es.snapshots[aggregateId]);
}

function resetUtility(es) {
    es.eventStore = {};
    es.snapshots = {};
}

function resetEmitterUtility() {
    emitter.eventNames().forEach(e => emitter.removeAllListeners(e));
}
*/

const defaultHandler = new TestDbESHandler(microserviceName);
defaultHandler.EsHandler = TestDbESHandler;

module.exports = defaultHandler;
