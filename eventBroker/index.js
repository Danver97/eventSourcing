const sqs = require('./sqs');
const testbroker = require('./testbroker');
const implem = require('implemented');

const Property = implem.Property;

const interf = {
    get: new Property('function', 2),
    hide: new Property('function', 2),
    publish: new Property('function', 2),
    remove: new Property('function', 2),
    subscribe: new Property('function', 2),
};

let pollId = null;

function startPoll(options, eventHandler, ms) {
    pollId = setInterval(() => this.getEvent(options, eventHandler), ms || 10000);
    return pollId;
}

function stopPoll(id) {
    clearInterval(id || pollId);
    if (!id || pollId === id)
        pollId = null;
}

function ignoreEvent(e, cb) {
    return this.hide(e, cb);
}

function destroyEvent(e, cb) {
    return this.remove(e, cb);
}

function assignMethods(broker) {
    broker.startPoll = startPoll.bind(broker);
    broker.stopPoll = stopPoll.bind(broker);
    broker.ignoreEvent = ignoreEvent.bind(broker);
    broker.destroyEvent = destroyEvent.bind(broker);
    return broker
}

const eventBrokers = {
    sqs: assignMethods(sqs),
    testbroker: assignMethods(testbroker),
};

module.exports = eventBrokers;
