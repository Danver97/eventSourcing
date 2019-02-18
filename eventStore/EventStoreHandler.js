class EventStoreHandler {
    constructor(eventStoreName) {
        this.eventStoreName = eventStoreName;
    }

    save(streamId, eventId, message, payload, cb) {
        throw new Error('EventStoreHandler: save() not implemented');
    }

    saveSnapshot(aggregateId, payload, cb) {
        throw new Error('EventStoreHandler: saveSnapshot() not implemented');
    }

    getStream(streamId, cb) {
        throw new Error('EventStoreHandler: getStream() not implemented');
    }

    getSnapshot(aggregateId, cb) {
        throw new Error('EventStoreHandler: getSnapshot() not implemented');
    }
}

module.exports = EventStoreHandler;
