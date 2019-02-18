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

function save(streamId, eventId, message, payload, cb) {
    return saveUtility(defaultEventStore, streamId, eventId, message, payload, cb)
}

function getStream(streamId, cb) {
    return getStreamUtility(defaultEventStore, streamId, cb);
}

function saveSnapshot(aggregateId, revisionId, payload, cb) {
    return saveSnapshotUtility(defaultEventStore, aggregateId, revisionId, payload, cb);
}

function getSnapshot(aggregateId, cb) {
    return getSnapshotUtility(defaultEventStore, aggregateId, cb);
}

function reset() {
    resetUtility(defaultEventStore);
}

function resetEmitter() {
    resetEmitterUtility();
}

class TestDbESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.eventStore = {};
        this.snapshots = {};
    }

    save(streamId, eventId, message, payload, cb) {
        return saveUtility(this, streamId, eventId, message, payload, cb);
    }

    getStream(streamId, cb) {
        return getStreamUtility(this, streamId, cb);
    }

    saveSnapshot(aggregateId, revisionId, payload, cb) {
        return saveSnapshotUtility(this, aggregateId, revisionId, payload, cb);
    }

    getSnapshot(aggregateId, cb) {
        return getSnapshotUtility(this, aggregateId, cb);
    }

    reset() {
        resetUtility(this);
    }

    resetEmitter() {
        resetEmitterUtility();
    }
}

/* Utility functions */

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

function emit(message, payload) {
    emitter.emit(message, payload);
}

function on(message, cb) {
    emitter.on(message, cb);
}

module.exports = {
    TestDbESHandler,
    save,
    getStream,
    saveSnapshot,
    getSnapshot,
    reset,
};
