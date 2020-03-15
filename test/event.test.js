const assert = require('assert');
const Event = require('../event');
const EventError = require('../event.error');

describe('Event class unit test', function () {
    const eventObj = { streamId: 'aioaoida', eventId: 1, message: 'provaEvent', payload: { field: 'value1' } };

    it('check constructor works', function () {
        assert.throws(() => new Event(), EventError);
        assert.throws(() => new Event(1), EventError);
        assert.throws(() => new Event('s'), EventError);
        assert.throws(() => new Event('s', 'a'), EventError);
        assert.throws(() => new Event('s', 1), EventError);
        assert.throws(() => new Event('s', 1, 1), EventError);
        assert.throws(() => new Event('s', 1, 'msg'), EventError);
        assert.throws(() => new Event('s', 1, 'msg', 'payload'), EventError);
        assert.throws(() => new Event('s', undefined, 'msg', {}), EventError);
        assert.throws(() => new Event('s', null, 'msg', {}), EventError);
        assert.doesNotThrow(() => new Event('s', 0, 'msg', {}), EventError);

        const e = new Event(eventObj.streamId, eventObj.eventId, eventObj.message, eventObj.payload);

        assert.strictEqual(e.streamId, eventObj.streamId);
        assert.strictEqual(e.eventId, eventObj.eventId);
        assert.strictEqual(e.message, eventObj.message);
        assert.deepStrictEqual(e.payload, eventObj.payload);
    });

    it('check fromObject works', function () {
        assert.throws(() => Event.fromObject(), EventError);

        const e = Event.fromObject(eventObj);

        assert.ok(e instanceof Event);
        assert.strictEqual(e.streamId, eventObj.streamId);
        assert.strictEqual(e.eventId, eventObj.eventId);
        assert.strictEqual(e.message, eventObj.message);
        assert.deepStrictEqual(e.payload, eventObj.payload);
    });
});
