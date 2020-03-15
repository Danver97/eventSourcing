const assert = require('assert');
const broker = require('../../eventBroker')['testbroker'];
const testdb = require('../../eventStore')['testdb'];
const BrokerEvent = require('../../eventBroker/brokerEvent');
const EventBrokerError = require('../../eventBroker/errors/event_broker.error');

const waitAsync = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitSync = ms => {
    const date = new Date();
    let curDate = new Date();
    while (curDate - date < ms)
        curDate = new Date();
};

describe('Event broker unit test', function () {
    let publishedEvent = new BrokerEvent('1', 1, 'provaEvent', { message: 'Prova evento' });

    before(async function () {
        await broker.subscribe('microservice-test');
    });

    this.beforeEach(() => {
        publishedEvent = new BrokerEvent('1', 1, 'provaEvent', { message: 'Prova evento' });
        broker.reset();
    });

    it('check publish works', async function () {
        assert.throws(() => broker.publish(), EventBrokerError);
        assert.throws(() => broker.publish('event'), EventBrokerError);
        assert.throws(() => broker.publish({}), EventBrokerError);

        await broker.publish(publishedEvent);

        assert.deepStrictEqual(broker.queue[0], publishedEvent);
    });

    it('check getEvent works', async function () {
        broker.queue = [publishedEvent];

        const events = await broker.getEvent({ number: 10 });

        events.forEach(e => delete e._timeoutId);

        assert.deepStrictEqual(events, [publishedEvent]);
    });

    it('check remove works', async function () {
        assert.throws(() => broker.remove(), EventBrokerError);
        assert.throws(() => broker.remove('event'), EventBrokerError);
        assert.throws(() => broker.remove({}), EventBrokerError);

        
        broker.queue = [publishedEvent];

        let events = await broker.getEvent({ number: 10 });
        await Promise.all(events.map(e => broker.remove(e)));

        events = await broker.getEvent({ number: 10 });

        assert.deepStrictEqual(events, []);
    });

    it('check destroyEvent works', async function () {
        assert.throws(() => broker.destroyEvent(), EventBrokerError);
        assert.throws(() => broker.destroyEvent('event'), EventBrokerError);
        assert.throws(() => broker.destroyEvent({}), EventBrokerError);

        
        broker.queue = [publishedEvent];

        let events = await broker.getEvent({ number: 10 });
        await Promise.all(events.map(e => broker.destroyEvent(e)));

        events = await broker.getEvent({ number: 10 });

        assert.deepStrictEqual(events, []);
    });

    it('check subscribe works', async function () {
        await broker.subscribe('microservice-test');

        await testdb.save(publishedEvent.streamId, publishedEvent.eventId-1, publishedEvent.message, publishedEvent.payload);

        const events = await broker.getEvent({ number: 10 });
        events.forEach(e => delete e._timeoutId);
        assert.deepStrictEqual(events, [publishedEvent])
    });
});
