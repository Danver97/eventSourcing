const Promisify = require('promisify-cb');
const BrokerEvent = require('./brokerEvent');
const EventBrokerHandler = require('./eventBrokerHandler');
const emitter = require('../lib/bus');

const microserviceName = process.env.MICROSERVICE_NAME;

const visibilityTimeout = 15000;


function checkIfEvent(e) {
    if (!(e instanceof BrokerEvent))
        throw new Error('Event Broker: provided object is not an instance of Event');
}

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

    getEvent(options, cb) {
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
            emitter.on(topic, e => this.enqueueEvent(e));
        }, cb);
    }
}

const defaultHandler = new TestBrokerHandler(microserviceName);
defaultHandler.EbHandler = TestBrokerHandler;

module.exports = defaultHandler;
