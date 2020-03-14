const assert = require('assert');
const broker = require('../../eventBroker')['testbroker'];
const testdb = require('../../eventStore')['testdb'];
const BrokerEvent = require('../../eventBroker/brokerEvent');

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
        assert.throws(() => broker.publish(), Error);
        assert.throws(() => broker.publish('event'), Error);
        assert.throws(() => broker.publish({}), Error);

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
        assert.throws(() => broker.remove(), Error);
        assert.throws(() => broker.remove('event'), Error);
        assert.throws(() => broker.remove({}), Error);

        
        broker.queue = [publishedEvent];

        let events = await broker.getEvent({ number: 10 });
        await Promise.all(events.map(e => broker.remove(e)));

        events = await broker.getEvent({ number: 10 });

        assert.deepStrictEqual(events, []);
    });

    it('check destroyEvent works', async function () {
        assert.throws(() => broker.destroyEvent(), Error);
        assert.throws(() => broker.destroyEvent('event'), Error);
        assert.throws(() => broker.destroyEvent({}), Error);

        
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
