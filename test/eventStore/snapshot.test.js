const assert = require('assert');
const Snapshot = require('../../eventStore/Snapshot');
const SnapshotError = require('../../eventStore/errors/snapshot.error');

describe('Snapshot class unit test', function () {
    const snapObj = { streamId: 'aioaoida', revisionId: 1, payload: { field: 'value1' } };

    it('check constructor works', function () {
        assert.throws(() => new Snapshot(), SnapshotError);
        assert.throws(() => new Snapshot(1), SnapshotError);
        assert.throws(() => new Snapshot('s'), SnapshotError);
        assert.throws(() => new Snapshot('s', 'a'), SnapshotError);
        assert.throws(() => new Snapshot('s', 1), SnapshotError);
        assert.throws(() => new Snapshot('s', 1, 1), SnapshotError);
        assert.throws(() => new Snapshot('s', 1, 'payload'), SnapshotError);
        assert.throws(() => new Snapshot('s', undefined, {}), SnapshotError);
        assert.throws(() => new Snapshot('s', null, {}), SnapshotError);
        assert.doesNotThrow(() => new Snapshot('s', 0, {}), SnapshotError);

        const e = new Snapshot(snapObj.streamId, snapObj.revisionId, snapObj.payload);

        assert.strictEqual(e.streamId, snapObj.streamId);
        assert.strictEqual(e.revisionId, snapObj.revisionId);
        assert.deepStrictEqual(e.payload, snapObj.payload);
    });

    it('check fromObject works', function () {
        assert.throws(() => Snapshot.fromObject(), SnapshotError);

        const e = Snapshot.fromObject(snapObj);

        assert.ok(e instanceof Snapshot);
        assert.strictEqual(e.streamId, snapObj.streamId);
        assert.strictEqual(e.revisionId, snapObj.revisionId);
        assert.deepStrictEqual(e.payload, snapObj.payload);
    });
});
