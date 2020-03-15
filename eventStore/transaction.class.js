const Event = require('../event');
const EventStoreHandler = require('./EventStoreHandler');
const EventStoreError = require('./errors/event_store.error');

class Transaction {
    /**
     * @constructor
     * @param {EventStoreHandler} eventStore 
     */
    constructor(eventStore) {
        if (!(eventStore instanceof EventStoreHandler))
            throw new Error('\'eventStore\' must be an instance of EventStoreHandler');
        this.eventStore = eventStore;
        this.buffer = [];
    }

    /**
     * 
     * @param {Event} event 
     */
    _checkEvent(event) {
        if (!(event instanceof Event))
            throw EventStoreError.paramError('Parameter \'event\' must be an instance of Event class');
    }

    /**
     * 
     * @param {Event[]} events 
     */
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
     * 
     * @param {Event[]} events 
     */
    _checkTransactionSize(events) {
        if (this.size + events.length > this.eventStore.transactionMaxSize)
            throw EventStoreError.transactionSizeExcededError(`The chosen event store support a trasaction up to a maximum of ${this.eventStore.transactionMaxSize} events.
            The current transaction is asked to be ${this.buffer.length + events.length} events big.`);
    }

    /**
     * 
     * @param {Event} event The event to be added to the transaction
     * @returns {number} The trasaction size
     */
    saveEvent(event) {
        this._checkEvent(event);
        this._checkTransactionSize([event]);
        this.buffer.push(event);
        return this.size;
    }

    /**
     * 
     * @param {Event[]} events The events to be added into the transaction
     * @returns {number} The trasaction size
     */
    saveEvents(events) {
        this._checkArrayOfEvents(events);
        this._checkTransactionSize(events);
        this.buffer = this.buffer.concat(events);
        return this.size;
    }

    /**
     * 
     * @param {function} cb Asynchronous callback
     */
    commit(cb) {
        return this.eventStore.commitTransaction(this, cb);
    }

    get size() {
        return this.buffer.length;
    }
}

module.exports = Transaction;
