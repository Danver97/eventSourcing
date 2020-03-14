const EventStoreError = require('./errors/event_store.error');

class EventStoreHandler {
    constructor(eventStoreName) {
        this.eventStoreName = eventStoreName;
    }

    /**
     * Saves an event into the event store
     * @param {string} streamId Event stream id to which write the event
     * @param {number} revisionId The current revision the stream is believed to be
     * @param {string} message The event name
     * @param {object} payload Payload of the event
     * @param {function} cb Asynchronous callback
     */
    save(streamId, eventId, message, payload, cb) {
        throw new EventStoreError('save() not implemented');
    }

    /**
     * Return the stream of events written to the specified event stream
     * @param {string} streamId The stream id
     * @param {function} cb Asynchronous callback
     * @returns {Event[]}
     */
    getStream(streamId, cb) {
        throw new EventStoreError('getStream() not implemented');
    }

    /**
     * Saves a snapshot of the provided event stream
     * @param {string} streamId The stream id of which this snapshot belongs
     * @param {number} revisionId The last processed event in computing this aggregate
     * @param {object} payload Payload of snapshot
     * @param {function} cb Asynchronous callback
     */
    saveSnapshot(aggregateId, revisionId, payload, cb) {
        throw new EventStoreError('saveSnapshot() not implemented');
    }

    /**
     * Retrieves the snapshot of the provided event stream
     * @param {string} streamId The stream id of which the snapshot belongs
     * @param {function} cb Asynchronous callback
     * @returns {Snapshot}
     */
    getSnapshot(aggregateId, cb) {
        throw new EventStoreError('getSnapshot() not implemented');
    }
}

module.exports = EventStoreHandler;
