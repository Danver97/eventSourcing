const assert = require('assert');
const Event = require('../event');

describe('Event class unit test', function () {
    const eventObj = { streamId: 'aioaoida', eventId: 1, message: 'provaEvent', payload: { field: 'value1' } };

    it('check constructor works', function () {
        assert.throws(() => new Event(), Error);
        assert.throws(() => new Event(1), Error);
        assert.throws(() => new Event('s'), Error);
        assert.throws(() => new Event('s', 'a'), Error);
        assert.throws(() => new Event('s', 1), Error);
        assert.throws(() => new Event('s', 1, 1), Error);
        assert.throws(() => new Event('s', 1, 'msg'), Error);
        assert.throws(() => new Event('s', 1, 'msg', 'payload'), Error);
        assert.throws(() => new Event('s', undefined, 'msg', {}), Error);
        assert.throws(() => new Event('s', null, 'msg', {}), Error);
        assert.doesNotThrow(() => new Event('s', 0, 'msg', {}), Error);

        const e = new Event(eventObj.streamId, eventObj.eventId, eventObj.message, eventObj.payload);

        assert.strictEqual(e.streamId, eventObj.streamId);
        assert.strictEqual(e.eventId, eventObj.eventId);
        assert.strictEqual(e.message, eventObj.message);
        assert.deepStrictEqual(e.payload, eventObj.payload);
    });

    it('check fromObject works', function () {
        assert.throws(() => Event.fromObject(), Error);

        const e = Event.fromObject(eventObj);

        assert.ok(e instanceof Event);
        assert.strictEqual(e.streamId, eventObj.streamId);
        assert.strictEqual(e.eventId, eventObj.eventId);
        assert.strictEqual(e.message, eventObj.message);
        assert.deepStrictEqual(e.payload, eventObj.payload);
    });
});
