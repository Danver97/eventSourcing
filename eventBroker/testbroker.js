const Promisify = require('promisify-cb');
const BrokerEvent = require('./brokerEvent');
const EventBrokerHandler = require('./eventBrokerHandler');
const emitter = require('../lib/bus');

const microserviceName = process.env.MICROSERVICE_NAME;

const visibilityTimeout = 15000;
/* let queue = [];

function log(silent) {
    if (!silent)
        console.log(queue);
    return queue;
}

function enqueueEvent(e) {
    queue.push(e);
}

function dequeueEvent(timeout) {
    let e = queue.shift();
    if (!e)
        return e;
    e = BrokerEvent.fromObject(e);
    e._timeoutId = setTimeout(() => queue.splice(0, 0, e), timeout || visibilityTimeout);
    return e;
}

function dequeueEvents(number, timeout) {
    if (!number)
        return [dequeueEvent(timeout)];
    const events = [];
    for (let i = 0; i < number; i++)
        events.push(dequeueEvent(timeout));
    return events;
}

function checkIfEvent(e) {
    if (!(e instanceof BrokerEvent))
        throw new Error('Event Broker: provided object is not an instance of Event');
}

// Broker methods implementation

function get(options, cb) {
    return Promisify(() => dequeueEvents(options.number, options.visibilityTimeout), cb);
}

function hide(e, cb) {
    checkIfEvent(e);
    return Promisify(() => {}, cb);
}

function remove(e, cb) {
    checkIfEvent(e);
    return Promisify(() => {
        queue = queue.filter(ev => ev.streamId !== e.streamId && ev.eventId !== e.eventId);
        clearTimeout(e._timeoutId);
    }, cb);
}

function publish(e, cb) {
    checkIfEvent(e);
    return Promisify(() => enqueueEvent(e), cb);
}

function subscribe(topic, cb) {
    return Promisify(() => {
        emitter.on(topic, enqueueEvent);
    }, cb);
} */

class TestBrokerHandler extends EventBrokerHandler {
    constructor(eventBrokerName) {
        super(eventBrokerName);
        this.queue = [];
    }

    log(silent) {
        if (!silent)
            console.log(this.queue);
        return this.queue;
    }

    enqueueEvent(e) {
        this.queue.push(e);
    }

    dequeueEvent(timeout) {
        let e = this.queue.shift();
        if (!e)
            return e;
        e = BrokerEvent.fromObject(e);
        e._timeoutId = setTimeout(() => this.queue.splice(0, 0, e), timeout || visibilityTimeout);
        return e;
    }

    dequeueEvents(number, timeout) {
        if (!number)
            return [this.dequeueEvent(timeout)];
        const events = [];
        for (let i = 0; i < number; i++)
            events.push(this.dequeueEvent(timeout));
        return events;
    }

    // Broker methods implementation

    get(options, cb) {
        return Promisify(() => this.dequeueEvents(options.number, options.visibilityTimeout), cb);
    }

    hide(e, cb) {
        checkIfEvent(e);
        return Promisify(() => {}, cb);
    }

    remove(e, cb) {
        checkIfEvent(e);
        return Promisify(() => {
            this.queue = this.queue.filter(ev => ev.streamId !== e.streamId && ev.eventId !== e.eventId);
            clearTimeout(e._timeoutId);
        }, cb);
    }

    publish(e, cb) {
        checkIfEvent(e);
        return Promisify(() => this.enqueueEvent(e), cb);
    }

    subscribe(topic, cb) {
        return Promisify(() => {
            emitter.on(topic, this.enqueueEvent);
        }, cb);
    }
}

const defaultHandler = new TestBrokerHandler(microserviceName);
defaultHandler.EbHandler = TestBrokerHandler;

module.exports = defaultHandler;
