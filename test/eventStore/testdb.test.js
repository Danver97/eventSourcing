process.env.MICROSERVICE_NAME = 'provaMicroservice';
const assert = require('assert');
const es = require('../../eventStore')['testdb'];
const Event = require('../../event');
const Snapshot = require('../../eventStore/Snapshot');
const EventStoreError = require('../../eventStore/errors/event_store.error');
const emitter = require('../../lib/bus');

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

describe('Event store unit test', async function () {
    const event = new Event('ae9efe', 1, 'event1', { name: 'event1' });
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

        await es.save(event.streamId, event.eventId - 1, event.message, event.payload);
        const stream = es.eventStore[event.streamId].events;
        assert.deepStrictEqual(stream, [event]);
        assert.ok(nodeEventPublished);

        await assert.rejects(() => es.save(event.streamId, event.eventId - 1, event.message, event.payload), EventStoreError);
        try {
            await es.save(event.streamId, event.eventId - 1, event.message, event.payload);
        } catch (err) {
            assert.strictEqual(err.code, EventStoreError.eventAlreadyExistsErrorCode);
        }
    });

    it('check getStream works', async function () {
        assert.throws(() => es.getStream(), EventStoreError);

        es.eventStore[event.streamId] = {};
        es.eventStore[event.streamId].events = [event];
        const stream = await es.getStream(event.streamId);
        assert.deepStrictEqual(stream, [event]);
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
