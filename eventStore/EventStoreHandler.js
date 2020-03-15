const Event = require('../event');
const EventStoreError = require('./errors/event_store.error');
const Transaction = require('./transaction.class');

class EventStoreHandler {
    constructor(eventStoreName) {
        this.eventStoreName = eventStoreName;
    }

    _checkSaveParams(streamId, revisionId, message, payload) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        if ((!revisionId && revisionId !== 0) || typeof revisionId !== 'number')
            throw EventStoreError.paramError(`'revisionId' must be a number. Found: ${typeof revisionId}`);
        if (!message || typeof message !== 'string')
            throw EventStoreError.paramError(`'message' must be a number. Found: ${typeof message}`);
        if (!payload)
            throw EventStoreError.paramError(`Missing 'payload' parameter`);
    }

    _checkEvent(event) {
        if (!(event instanceof Event))
            throw EventStoreError.paramError('Parameter \'event\' must be an instance of Event class');
    }

    _checkArrayOfEvents(events) {
        if (!Array.isArray(events))
            throw EventStoreError.paramError('\'events\' must be an array of Event instances');
        events.forEach((e, i) => {
            try {
                this._checkEvent(e)
            } catch (err) {
                if (err instanceof EventStoreError && err.code === EventStoreError.paramErrorCode)
                    throw EventStoreError.paramError(`event in position ${i} is not an instance of Event class`);
                throw err;
            }
        });
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
     * Saves an event into the event store
     * @param {Event} event The event to be saved
     * @param {function} cb Asynchronous callback
     */
    saveEvent(event, cb) {
        throw new EventStoreError('saveEvent() not implemented');
    }

    /**
     * Saves multiple events into the event store, in a non-transactional way.
     * @param {Event[]} events The event to be saved
     * @param {function} cb Asynchronous callback
     */
    saveEvents(events, cb) {
        throw new EventStoreError('saveEvents() not implemented');
    }

    /**
     * Starts a new transaction returning a new transaction handler
     * @returns {Transaction} The transaction handler
     */
    startTransaction() {
        return new Transaction(this);
    }

    /**
     * Commits the given transaction
     * @param {Transaction} transaction The transaction to commit
     * @param {function} cb Asynchronous callback
     */
    commitTransaction(transaction, cb) {
        throw new EventStoreError('commitTransaction() not implemented');
    }

    get transactionMaxSize() {
        throw new EventStoreError('getter transactionMaxSize not implemented');
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
    saveSnapshot(streamId, revisionId, payload, cb) {
        throw new EventStoreError('saveSnapshot() not implemented');
    }

    /**
     * Retrieves the snapshot of the provided event stream
     * @param {string} streamId The stream id of which the snapshot belongs
     * @param {function} cb Asynchronous callback
     * @returns {Snapshot}
     */
    getSnapshot(streamId, cb) {
        throw new EventStoreError('getSnapshot() not implemented');
    }
}

module.exports = EventStoreHandler;
