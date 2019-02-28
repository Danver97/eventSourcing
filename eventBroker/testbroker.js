const BrokerEvent = require('./brokerEvent');
const Promisify = require('promisify-cb');
const emitter = require('../lib/bus');

let queue = [];
const visibilityTimeout = 15000;

function log(silent) {
    if (!silent)
        console.log(queue);
    return queue;
}

function enqueueEvent(e) {
    queue.push(e);
}

function dequeueEvent(timeout) {
    const e = queue.shift();
    if (!e)
        return e;
    setTimeout(() => queue.splice(0, 0, e), timeout || visibilityTimeout);
    return BrokerEvent.fromObject(e);
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
    return Promisify(() => { queue = queue.filter(ev => ev.id !== e.id); }, cb);
}

function publish(e, cb) {
    checkIfEvent(e);
    return Promisify(() => enqueueEvent(e), cb);
}

function subscribe(topic, cb) {
    return Promisify(() => {
        emitter.on(topic, enqueueEvent);
    }, cb);
}

subscribe('microservice-test');

module.exports = {
    log,
    get,
    hide,
    publish,
    remove,
    subscribe,
};
