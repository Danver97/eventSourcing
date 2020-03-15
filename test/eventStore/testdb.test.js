process.env.MICROSERVICE_NAME = 'provaMicroservice';
const assert = require('assert');
const EventStore = require('../../eventStore')['testdb'];
const Event = require('../../event');
const Snapshot = require('../../eventStore/Snapshot');
const Transaction = require('../../eventStore/transaction.class');
const EventStoreError = require('../../eventStore/errors/event_store.error');
const emitter = require('../../lib/bus');

const es = new EventStore();

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

describe('Event store unit test', async function () {
    const event1 = new Event('ae9efe', 1, 'event1', { name: 'event1' });
    const event2 = new Event('ae9efe', 2, 'event2', { name: 'event2' });
    const snapshot = new Snapshot('abcdef', 15, { name: 'snapshot1' });

    this.beforeEach(() => es.reset());

    it('check save works', async function () {
        assert.throws(() => es.save(), EventStoreError);
        assert.throws(() => es.save('as'), EventStoreError);
        assert.throws(() => es.save('as', 1), EventStoreError);
        assert.throws(() => es.save('as', 1, 'failure'), EventStoreError);

        let nodeEventPublished = false;
        emitter.on('microservice-test', () => {
            nodeEventPublished = true;
        })

        await es.save(event1.streamId, event1.eventId - 1, event1.message, event1.payload);
        const stream = es.eventStore[event1.streamId].events;
        assert.deepStrictEqual(stream, [event1]);
        assert.ok(nodeEventPublished);

        await assert.rejects(() => es.save(event1.streamId, event1.eventId - 1, event1.message, event1.payload), EventStoreError);
        try {
            await es.save(event1.streamId, event1.eventId - 1, event1.message, event1.payload);
        } catch (err) {
            assert.strictEqual(err.code, EventStoreError.eventAlreadyExistsErrorCode);
        }
    });

    it('check saveEvent works', async function () {
        assert.throws(() => es.saveEvent(), EventStoreError);
        assert.throws(() => es.saveEvent({}), EventStoreError);
        let nodeEventPublished = false;
        emitter.on('microservice-test', () => {
            nodeEventPublished = true;
        });
        
        await es.saveEvent(event1);
        const stream = es.eventStore[event1.streamId].events;
        assert.deepStrictEqual(stream, [event1]);
        assert.ok(nodeEventPublished);
        
        await assert.rejects(() => es.saveEvent(event1), EventStoreError);
        try {
            await es.saveEvent(event1);
        } catch (err) {
            assert.strictEqual(err.code, EventStoreError.eventAlreadyExistsErrorCode);
        }
    });

    it('check saveEvents works', async function () {
        assert.throws(() => es.saveEvents(), EventStoreError);
        assert.throws(() => es.saveEvents({}), EventStoreError);
        assert.throws(() => es.saveEvents([{}]), EventStoreError);
        let nodeEventPublished = false;
        emitter.on('microservice-test', () => {
            nodeEventPublished = true;
        });
        
        await es.saveEvents([event1, event2]);
        const stream = es.eventStore[event1.streamId].events;
        assert.deepStrictEqual(stream, [event1, event2]);
        assert.ok(nodeEventPublished);
        
        await assert.rejects(() => es.saveEvents([event1]), EventStoreError);
        try {
            await es.saveEvents([event1]);
        } catch (err) {
            assert.strictEqual(err.code, EventStoreError.eventAlreadyExistsErrorCode);
        }
    });

    it('check startTransaction works', function () {
        const t = es.startTransaction();
        assert.ok(t instanceof Transaction);
        assert.deepStrictEqual(t.eventStore, es);
    });

    it('check commitTransaction works', async function () {
        let t = es.startTransaction();
        t.saveEvent(event2);
        try {
            await es.commitTransaction(t);
        } catch (err) {
            assert.ok(err instanceof EventStoreError);
            assert.strictEqual(err.code, EventStoreError.transactionFailedErrorCode);
        }
        
        t = es.startTransaction();
        t.saveEvents([event1, event2]);
        await es.commitTransaction(t);
        const stream = es.eventStore[event1.streamId].events;
        assert.deepStrictEqual(stream, [event1, event2]);
    });

    it('check getStream works', async function () {
        assert.throws(() => es.getStream(), EventStoreError);

        es.eventStore[event1.streamId] = {};
        es.eventStore[event1.streamId].events = [event1];
        const stream = await es.getStream(event1.streamId);
        assert.deepStrictEqual(stream, [event1]);
        stream.forEach(e => {
            assert.ok(e instanceof Event);
        });
    });

    it('check saveSnapshot works', async function () {
        assert.throws(() => es.saveSnapshot(), EventStoreError);
        assert.throws(() => es.saveSnapshot('ass'), EventStoreError);
        assert.throws(() => es.saveSnapshot('ass', 1), EventStoreError);

        await es.saveSnapshot(snapshot.streamId, snapshot.revisionId, snapshot.payload);
        const snap = es.snapshots[snapshot.streamId];
        assert.deepStrictEqual(snap, snapshot);
    });

    it('check getSnapshot works', async function () {
        assert.throws(() => es.getSnapshot(), EventStoreError);

        es.snapshots[snapshot.streamId] = snapshot;
        const snap = await es.getSnapshot(snapshot.streamId);
        assert.deepStrictEqual(snap, snapshot);
        assert.ok(snap instanceof Snapshot);
    });
});
