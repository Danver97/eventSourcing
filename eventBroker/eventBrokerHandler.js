const EventBrokerError = require('./errors/event_broker_error');

class EventBrokerHandler {
    constructor(eventBrokerName) {
        this.eventBrokerName = eventBrokerName;
    }

    get(streamId, eventId, message, payload, cb) {
        throw new EventStoreError('get() not implemented');
    }

    hide(aggregateId, revisionId, payload, cb) {
        throw new EventStoreError('hide() not implemented');
    }

    publish(streamId, cb) {
        throw new EventStoreError('publish() not implemented');
    }

    remove(aggregateId, cb) {
        throw new EventStoreError('remove() not implemented');
    }

    subscribe() {
        throw new EventStoreError('subscribe() not implemented');
    }
}

module.exports = EventBrokerHandler;
