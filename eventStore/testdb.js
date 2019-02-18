const EventEmitter = require('events');
const uuidv1 = require('uuid/v1');
const Event = require('../event');
const Promisify = require('promisify-cb');

let eventStore = {};
let snapshots = {};
const emitter = new EventEmitter();

function save(streamId, eventId, message, payload, cb) {
    return Promisify(() => {
        delete payload._revisionId;
        if (!streamId)
            streamId = uuidv1();
        if (!eventStore[streamId])
            eventStore[streamId] = { streamId, revision: 0, events: [] };
        const revision = eventStore[streamId].revision;
        
        const event = new Event(streamId, eventId || eventStore[streamId].events.length, message, Object.assign({}, payload));
        if (revision === eventStore[streamId].revision) {
            eventStore[streamId].events.push(event);
            eventStore[streamId].revision++;
        } else
            throw new Error('Stream revision not syncronized.');
        emit(`${event.message}`, payload);
        return event;
    }, cb);
}

function emit(message, payload) {
    emitter.emit(message, payload);
}

function on(message, cb) {
    emitter.on(message, cb);
}

function getStream(streamId, cb) {
    return Promisify(() => eventStore[streamId].events.map(e => Event.fromObject(e)));
}

function getSnapshot(aggregateId, cb) {
    return Promisify(() => snapshots[aggregateId]);
}

function reset() {
    eventStore = {};
    snapshots = {};
}

function resetEmitter() {
    emitter.eventNames().forEach(e => emitter.removeAllListeners(e));
}

class TestDbESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.eventStore = {};
        this.snapshots = {};
    }

    save(streamId, eventId, message, payload, cb) {
        const self = this;
        return Promisify(() => {
            delete payload._revisionId;
            if (!streamId)
                streamId = uuidv1();
            if (!self.eventStore[streamId])
                self.eventStore[streamId] = { streamId, revision: 0, events: [] };
            const revision = self.eventStore[streamId].revision;

            const event = new Event(streamId, eventId || self.eventStore[streamId].events.length, message, Object.assign({}, payload));
            if (revision === self.eventStore[streamId].revision) {
                self.eventStore[streamId].events.push(event);
                self.eventStore[streamId].revision++;
            } else
                throw new Error('Stream revision not syncronized.');
            emit(`${event.message}`, payload);
            return event;
        }, cb);
    }

    saveSnapshot(aggregateId, payload, cb) {
        throw new Error('EventStoreHandler: saveSnapshot() not implemented');
    }

    getStream(streamId, cb) {
        const self = this;
        return Promisify(() => self.eventStore[streamId].events.map(e => Event.fromObject(e)));
    }

    getSnapshot(aggregateId, cb) {
        const self = this;
        return Promisify(() => self.snapshots[aggregateId]);
    }

    reset() {
        this.eventStore = {};
        this.snapshots = {};
    }

    resetEmitter() {
        emitter.eventNames().forEach(e => emitter.removeAllListeners(e));
    }
}

module.exports = {
    save,
    getStream,
    reset,
    // emit,
    // on,
    // getSnapshot,
    // resetEmitter,
};
