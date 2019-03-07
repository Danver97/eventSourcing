const EventBrokerError = require('./errors/event_broker_error');

class EventBrokerHandler {
    constructor(eventBrokerName) {
        this.eventBrokerName = eventBrokerName;
    }

    getEvent(options, cb) {
        throw new EventStoreError('get() not implemented');
    }

    hide(e, cb) {
        throw new EventStoreError('hide() not implemented');
    }

    publish(e, cb) {
        throw new EventStoreError('publish() not implemented');
    }

    remove(e, cb) {
        throw new EventStoreError('remove() not implemented');
    }

    subscribe(topic, cb) {
        throw new EventStoreError('subscribe() not implemented');
    }
}

module.exports = EventBrokerHandler;
