const EventStoreError = require('./errors/event_store_error');

class EventStoreHandler {
    constructor(eventStoreName) {
        this.eventStoreName = eventStoreName;
    }

    save(streamId, eventId, message, payload, cb) {
        throw new EventStoreError('save() not implemented');
    }

    saveSnapshot(aggregateId, revisionId, payload, cb) {
        throw new EventStoreError('saveSnapshot() not implemented');
    }

    getStream(streamId, cb) {
        throw new EventStoreError('getStream() not implemented');
    }

    getSnapshot(aggregateId, cb) {
        throw new EventStoreError('getSnapshot() not implemented');
    }
}

module.exports = EventStoreHandler;
