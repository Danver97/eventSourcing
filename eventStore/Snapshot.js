const SnapshotError = require('./errors/snapshot.error');

class Snapshot {
    /**
     * @constructor
     * @param {string} streamId Stream Id
     * @param {number} revisionId Stream revision id
     * @param {object} payload Snapshot payload
     */
    constructor(streamId, revisionId, payload) {
        this._checkParams(streamId, revisionId, payload);

        this.streamId = streamId;
        this.revisionId = revisionId;
        this.payload = payload;
    }

    _checkParams(streamId, revisionId, payload) {
        if (!streamId || revisionId === undefined || revisionId === null || !payload) {
            throw SnapshotError.paramError(`Event: missing the following parameters 
                ${!streamId ? 'streamId, ' : ''}${(revisionId === undefined || revisionId === null) ? 'eventId, ' : ''}${!payload ? 'payload' : ''}.`);
        }
        if (typeof streamId !== 'string')
            throw SnapshotError.paramError('\'streamId\' must be a string');
        if (typeof revisionId !== 'number')
            throw SnapshotError.paramError('\'eventId\' must be a number');
        if (typeof payload !== 'object')
            throw SnapshotError.paramError('\'payload\' must be a object');
    }

    /**
     * Creates an Snapshot instance from a plain object
     * @param {object} obj 
     * @param {string} obj.streamId Stream Id
     * @param {number} obj.revisionId Stream revision id
     * @param {object} obj.payload Snapshot payload
     * @returns {Event}
     */
    static fromObject(obj) {
        if (!obj)
            throw SnapshotError.paramError('Missing parameter: obj');
        const streamId = obj.streamId || obj.StreamId;
        const revisionId = obj.revisionId || obj.RevisionId;
        const payload = obj.payload || obj.Payload;
        return new Snapshot(streamId, revisionId, payload);
    }
}

module.exports = Snapshot;
