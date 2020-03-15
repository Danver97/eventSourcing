const EventBrokerError = require('./errors/event_broker.error');

class EventBrokerHandler {
    constructor(eventBrokerName) {
        this.eventBrokerName = eventBrokerName;
    }

    getEvent(options, cb) {
        throw new EventBrokerError('get() not implemented');
    }

    hide(e, cb) {
        throw new EventBrokerError('hide() not implemented');
    }

    publish(e, cb) {
        throw new EventBrokerError('publish() not implemented');
    }

    remove(e, cb) {
        throw new EventBrokerError('remove() not implemented');
    }

    subscribe(topic, cb) {
        throw new EventBrokerError('subscribe() not implemented');
    }


    startPoll(options, eventHandler, ms) {
        this.pollId = setInterval(() => this.getEvent(options, eventHandler), ms || 10000);
        return this.pollId;
    }

    stopPoll(id) {
        clearInterval(id || this.pollId);
        if (!id || this.pollId === id)
            this.pollId = null;
    }

    ignoreEvent(e, cb) {
        return this.hide(e, cb);
    }

    destroyEvent(e, cb) {
        return this.remove(e, cb);
    }
}

module.exports = EventBrokerHandler;
