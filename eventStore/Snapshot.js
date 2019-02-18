class Snapshot {
    constructor(streamId, revisionId, payload) {
        this.streamId = streamId;
        this.revisionId = revisionId;
        this.payload = payload;
    }

    static fromObject(obj) {
        const streamId = obj.streamId || obj.StreamId;
        const revisionId = obj.revisionId || obj.RevisionId;
        const payload = obj.payload || obj.Payload;
        return new Snapshot(streamId, revisionId, payload);
    }
}

module.exports = Snapshot;
