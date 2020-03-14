const assert = require('assert');
const Snapshot = require('../../eventStore/Snapshot');

describe('Event class unit test', function () {
    const snapObj = { streamId: 'aioaoida', revisionId: 1, payload: { field: 'value1' } };

    it('check constructor works', function () {
        assert.throws(() => new Snapshot(), Error);
        assert.throws(() => new Snapshot(1), Error);
        assert.throws(() => new Snapshot('s'), Error);
        assert.throws(() => new Snapshot('s', 'a'), Error);
        assert.throws(() => new Snapshot('s', 1), Error);
        assert.throws(() => new Snapshot('s', 1, 1), Error);
        assert.throws(() => new Snapshot('s', 1, 'payload'), Error);
        assert.throws(() => new Snapshot('s', undefined, {}), Error);
        assert.throws(() => new Snapshot('s', null, {}), Error);
        assert.doesNotThrow(() => new Snapshot('s', 0, {}), Error);

        const e = new Snapshot(snapObj.streamId, snapObj.revisionId, snapObj.payload);

        assert.strictEqual(e.streamId, snapObj.streamId);
        assert.strictEqual(e.revisionId, snapObj.revisionId);
        assert.deepStrictEqual(e.payload, snapObj.payload);
    });

    it('check fromObject works', function () {
        assert.throws(() => Snapshot.fromObject(), Error);

        const e = Snapshot.fromObject(snapObj);

        assert.ok(e instanceof Snapshot);
        assert.strictEqual(e.streamId, snapObj.streamId);
        assert.strictEqual(e.revisionId, snapObj.revisionId);
        assert.deepStrictEqual(e.payload, snapObj.payload);
    });
});
