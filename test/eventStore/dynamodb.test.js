process.env.MICROSERVICE_NAME = 'provaMicroservice';
const uuid = require('uuid').v4;
const assert = require('assert');
const AWS = require('aws-sdk');
const stringHash = require('string-hash');
const EventStore = require('../../eventStore')['dynamodb'];
const Event = require('../../event');
const Snapshot = require('../../eventStore/Snapshot');
const EventStoreError = require('../../eventStore/errors/event_store.error');
const emitter = require('../../lib/bus');
const DynamoDataTypes = require('dynamodb-data-types');

const dynamoAttr = DynamoDataTypes.AttributeValue;

const region = process.env.AWS_DEFAULT_REGION || 'eu-west-2';
const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

AWS.config = new AWS.Config({ region, credentials });
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const eventStreamTable = `${process.env.MICROSERVICE_NAME}EventStreamTable`;
const snapshotTable = `${process.env.MICROSERVICE_NAME}SnapshotTable`;

const es = new EventStore();

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

describe('Event store unit test', async function () {
    this.timeout(5000);
    this.slow(1000);
    let event;
    let snapshot;

    this.beforeEach(() => {
        const streamId = uuid();
        event = new Event(streamId, 1, 'event1', { name: 'event1', emptyArray: [], emptyString: '', emptyMap: {} });
        snapshot = new Snapshot(streamId, 15, { name: 'snapshot1', emptyArray: [], emptyString: '', emptyMap: {} });
    });

    this.afterEach(async () => {
        await ddb.deleteItem({ TableName: eventStreamTable, Key: dynamoAttr.wrap({ StreamId: event.streamId, EventId: event.eventId }) });
        await ddb.deleteItem({ TableName: snapshotTable, Key: dynamoAttr.wrap({ StreamId: snapshot.streamId, RevisionId: snapshot.revisionId }) });
    })

    it('check save works', async function () {
        assert.throws(() => es.save(), EventStoreError);
        assert.throws(() => es.save('as'), EventStoreError);
        assert.throws(() => es.save('as', 1), EventStoreError);
        assert.throws(() => es.save('as', 1, 'failure'), EventStoreError);

        let nodeEventPublished = false;
        emitter.on('microservice-test', () => {
            nodeEventPublished = true;
        });

        await es.save(event.streamId, event.eventId - 1, event.message, event.payload);
        const response = await ddb.query({
            TableName: eventStreamTable,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': event.streamId, ':first': 0, ':last': Number.MAX_SAFE_INTEGER }),
            KeyConditionExpression: 'StreamId = :streamId AND EventId BETWEEN :first AND :last',
        }).promise();

        const stream = response.Items.map(i => dynamoAttr.unwrap(i)).map(e => Event.fromObject(e));

        delete event.payload.emptyArray;
        delete event.payload.emptyString;
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

        delete event.payload.emptyArray;
        delete event.payload.emptyString;
        await ddb.updateItem({
            TableName: eventStreamTable,
            Key: dynamoAttr.wrap({ StreamId: event.streamId, EventId: event.eventId /* 1 */ }), // OCCHIO QUIIIII!
            ExpressionAttributeNames: {
                '#SID': 'StreamId',
                '#EID': 'EventId',
                '#MSG': 'Message',
                '#PL': 'Payload',
                '#RSID': 'ReplayStreamId',
                '#RSSK': 'RSSortKey',
            },
            ExpressionAttributeValues: dynamoAttr.wrap({
                ':sid': event.streamId,
                ':eid': event.eventId, /* 1 */ // OCCHIO QUIIIII!
                ':message': event.message,
                ':payload': event.payload,
                ':rsid': stringHash(event.streamId) % 5,
                ':rssortkey': `${event.streamId}:${event.eventId}`,
            }),
            UpdateExpression: 'SET #MSG = :message, #PL = :payload, #RSID = :rsid, #RSSK = :rssortkey',
            ConditionExpression: '#SID <> :sid AND #EID <> :eid', // 'attribute_not_exists(StreamId) AND attribute_not_exists(EventId)',
            ReturnValues: 'ALL_NEW',
            ReturnItemCollectionMetrics: 'SIZE',
            ReturnConsumedCapacity: 'INDEXES',
        }).promise();

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
        const response = await ddb.query({
            TableName: snapshotTable,
            ConsistentRead: true,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': snapshot.streamId, ':start': 0, ':now': Number.MAX_SAFE_INTEGER }),
            KeyConditionExpression: 'StreamId = :streamId AND RevisionId BETWEEN :start AND :now',
        }).promise();
        
        const snap = response.Items.map(i => dynamoAttr.unwrap(i)).map(e => Snapshot.fromObject(e))[0];

        delete snapshot.payload.emptyArray;
        delete snapshot.payload.emptyString;
        assert.deepStrictEqual(snap, snapshot);
    });

    it('check getSnapshot works', async function () {
        assert.throws(() => es.getSnapshot(), EventStoreError);

        delete snapshot.payload.emptyArray;
        delete snapshot.payload.emptyString;
        await ddb.updateItem({
            TableName: snapshotTable,
            Key: dynamoAttr.wrap({ StreamId: snapshot.streamId, RevisionId: snapshot.revisionId /* 1 */ }), // OCCHIO QUIIIII!
            ExpressionAttributeNames: { '#PL': 'Payload' },
            ExpressionAttributeValues: dynamoAttr.wrap({ ':payload': snapshot.payload }),
            UpdateExpression: 'SET #PL = :payload',
            ReturnValues: 'ALL_NEW',
            ReturnItemCollectionMetrics: 'SIZE',
            ReturnConsumedCapacity: 'INDEXES',
        }).promise();

        const snap = await es.getSnapshot(snapshot.streamId);
        assert.deepStrictEqual(snap, snapshot);
        assert.ok(snap instanceof Snapshot);
    });
});
