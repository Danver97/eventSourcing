const assert = require('assert');
const Event = require('../event');
const EventError = require('../event.error');

function assertSimilarDates(actual, expected) {
    assert.ok(actual instanceof Date);
    assert.strictEqual(actual.getUTCFullYear(), expected.getUTCFullYear());
    assert.strictEqual(actual.getUTCMonth(), expected.getUTCMonth());
    assert.strictEqual(actual.getUTCDate(), expected.getUTCDate());
    assert.strictEqual(actual.getUTCHours(), expected.getUTCHours());
    assert.strictEqual(actual.getUTCMinutes(), expected.getUTCMinutes());
    assert.strictEqual(actual.getUTCSeconds(), expected.getUTCSeconds());

}

describe('Event class unit test', function () {
    const eventObj = { streamId: 'aioaoida', eventId: 1, message: 'provaEvent', payload: { field: 'value1' }, createdAt: (new Date).toISOString() };

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

        assertSimilarDates(e.createdAt, new Date());
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
        assert.deepStrictEqual(e.createdAt, new Date(eventObj.createdAt));
    });

    it('check toJSON works', function () {
        const e = new Event(eventObj.streamId, eventObj.eventId, eventObj.message, eventObj.payload);

        const json = e.toJSON();
        assert.strictEqual(json.streamId, e.streamId);
        assert.strictEqual(json.eventId, e.eventId);
        assert.strictEqual(json.message, e.message);
        assert.deepStrictEqual(json.payload, e.payload);
        assert.deepStrictEqual(json.createdAt, e.createdAt.toISOString());
    });
});
