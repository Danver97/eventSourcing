process.env.MICROSERVICE_NAME = 'provaMicroservice';
const assert = require('assert');
const es = require('../eventStore')['testdb'];
const Event = require('../event');

describe('Event store unit test', async function () {
    const event = new Event('ae9efe', '1', 'event1', { name: 'event1' });
    const snapshot = {streamId: 'abcdef', revisionId: '15', payload: { name: 'snapshot1' } };

    it('check event is written on db', async function () {
        await es.save(event.streamId, event.eventId, event.message, event.payload);
        const stream = await es.getStream(event.streamId);
        assert.strictEqual(JSON.stringify(stream[0]), JSON.stringify(event));
    });
    it('check snapshot is written on db', async function () {
        await es.saveSnapshot(snapshot.streamId, snapshot.revisionId, snapshot.payload);
        const snap = await es.getSnapshot(snapshot.streamId);
        assert.strictEqual(JSON.stringify(snap), JSON.stringify(snapshot));
    });
});
