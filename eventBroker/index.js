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

implem.checkImplementation(interf, sqs);
implem.checkImplementation(interf, testbroker);


let pollId = null;

function startPoll(options, eventHandler, ms) {
    pollId = setInterval(() => broker.get(options, eventHandler), ms || 10000);
    return pollId;
}

function stopPoll(id) {
    clearInterval(id || pollId);
    if (!id || pollId === id)
        pollId = null;
}

function ignoreEvent(e, cb) {
    return broker.hide(e, cb);
}

function destroyEvent(e, cb) {
    return broker.remove(e, cb);
}

const eventBrokers = {
    sqs: Object.assign({ startPoll, stopPoll, ignoreEvent, destroyEvent }, sqs),
    testbroker: Object.assign({ startPoll, stopPoll, ignoreEvent, destroyEvent }, testbroker),
};

module.exports = eventBrokers;
