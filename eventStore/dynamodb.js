const ddbConfig = require('@danver97/aws-config')().ddb;
const DynamoDataTypes = require('dynamodb-data-types');
const Promisify = require('promisify-cb');
const stringHash = require("string-hash");
const Event = require('../event');
const EventStoreHandler = require('./EventStoreHandler');
const EventStoreError = require('./errors/event_store.error');
const Snapshot = require('./Snapshot');
const emitter = require('../lib/bus');

const dynamoAttr = DynamoDataTypes.AttributeValue;

let dynamoDb = ddbConfig.ddb;
let microserviceName = process.env.MICROSERVICE_NAME;
const snapshotTag = 'Snapshot';

function emit(message, payload) {
    emitter.emit(message, payload);
}

function getTableName(microserviceName) {
    return `${microserviceName}EventStreamTable`;
}

function getSnapshotTableName(microserviceName) {
    return `${microserviceName}SnapshotTable`;
}

function removeEmptySetsOrStrings(attrValues) {
    Object.keys(attrValues).forEach(k => {
        if (typeof attrValues[k] !== 'object')
            return;
        if (attrValues[k].S !== undefined && attrValues[k].S === '')
            delete attrValues[k];
        else if (attrValues[k].NS && attrValues[k].NS.length === 0)
            delete attrValues[k];
        else if (attrValues[k] && attrValues[k].M)
            removeEmptySetsOrStrings(attrValues[k].M);
    });
}

class DynamoDBESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.tableName = getTableName(this.eventStoreName);
        this.snapshotsTableName = getSnapshotTableName(this.eventStoreName);
    }

    /**
     * Saves an event into the event store
     * @param {string} streamId Event stream id to which write the event
     * @param {number} revisionId The current revision the stream is believed to be
     * @param {string} message The event name
     * @param {object} payload Payload of the event
     * @param {function} cb Asynchronous callback
     */
    save(streamId, revisionId, message, payload, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        if ((!revisionId && revisionId !== 0) || typeof revisionId !== 'number')
            throw EventStoreError.paramError(`'revisionId' must be a number. Found: ${typeof revisionId}`);
        if (!message || typeof message !== 'string')
            throw EventStoreError.paramError(`'message' must be a number. Found: ${typeof message}`);
        if (!payload)
            throw EventStoreError.paramError(`Missing 'payload' parameter`);
        return Promisify(async () => {
            let eId = revisionId || payload._revisionId || 0;
            eId++;
            delete payload._revisionId;
            const event = new Event(streamId, eId, message, Object.assign({}, payload));
            const attrValues = dynamoAttr.wrap({
                ':sid': streamId,
                ':eid': eId, /* 1 */ // OCCHIO QUIIIII!
                ':message': message,
                ':payload': payload,
                ':rsid': stringHash(streamId) % 5,
                ':rssortkey': `${streamId}:${eId}`,
            });
            removeEmptySetsOrStrings(attrValues);
            const params = {
                TableName: this.tableName,
                Key: dynamoAttr.wrap({ StreamId: streamId, EventId: eId /* 1 */ }), // OCCHIO QUIIIII!
                ExpressionAttributeNames: {
                    '#SID': 'StreamId',
                    '#EID': 'EventId',
                    '#MSG': 'Message',
                    '#PL': 'Payload',
                    '#RSID': 'ReplayStreamId',
                    '#RSSK': 'RSSortKey',
                },
                ExpressionAttributeValues: attrValues,
                UpdateExpression: 'SET #MSG = :message, #PL = :payload, #RSID = :rsid, #RSSK = :rssortkey',
                ConditionExpression: '#SID <> :sid AND #EID <> :eid', // 'attribute_not_exists(StreamId) AND attribute_not_exists(EventId)',
                ReturnValues: 'ALL_NEW',
                ReturnItemCollectionMetrics: 'SIZE',
                ReturnConsumedCapacity: 'INDEXES',
            };
            // console.log(JSON.stringify(params.ExpressionAttributeValues));
            try {
                await dynamoDb.updateItem(params).promise();
            } catch (err) {
                if (err.code === 'ConditionalCheckFailedException')
                    throw EventStoreError.eventAlreadyExistsError('Stream revision not syncronized.');
                throw err;
            }
            emit('microservice-test', event);
            return event;
        }, cb);
    }

    /**
     * Return the stream of events written to the specified event stream
     * @param {string} streamId The stream id
     * @param {function} cb Asynchronous callback
     * @returns {Event[]}
     */
    getStream(streamId, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        return Promisify(async () => {
            const params = {
                TableName: this.tableName,
                ConsistentRead: true,
                ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':start': 0, ':now': Number.MAX_SAFE_INTEGER }),
                KeyConditionExpression: 'StreamId = :streamId AND EventId BETWEEN :start AND :now',
            };
            const reply = await dynamoDb.query(params).promise();
            const results = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Event.fromObject(e));
            return results;
        }, cb);
    }

    /**
     * Saves a snapshot of the provided event stream
     * @param {string} streamId The stream id of which this snapshot belongs
     * @param {number} revisionId The last processed event in computing this aggregate
     * @param {object} payload Payload of snapshot
     * @param {function} cb Asynchronous callback
     */
    saveSnapshot(streamId, revisionId, payload, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        if ((!revisionId && revisionId !== 0) || typeof revisionId !== 'number')
            throw EventStoreError.paramError(`'revisionId' must be a number. Found: ${typeof revisionId}`);
        if (!payload)
            throw EventStoreError.paramError(`Missing 'payload' parameter`);
        return Promisify(async () => {
            const attrValues = dynamoAttr.wrap({
                ':payload': payload,
            });
            removeEmptySetsOrStrings(attrValues);
            const params = {
                TableName: this.snapshotsTableName,
                Key: dynamoAttr.wrap({ StreamId: streamId, RevisionId: revisionId /* 1 */ }), // OCCHIO QUIIIII!
                ExpressionAttributeNames: {
                    '#PL': 'Payload',
                },
                ExpressionAttributeValues: attrValues,
                UpdateExpression: 'SET #PL = :payload',
                ReturnValues: 'ALL_NEW',
                ReturnItemCollectionMetrics: 'SIZE',
                ReturnConsumedCapacity: 'INDEXES',
            };
            await dynamoDb.updateItem(params).promise();
        }, cb);
    }

    /**
     * Retrieves the snapshot of the provided event stream
     * @param {string} streamId The stream id of which the snapshot belongs
     * @param {function} cb Asynchronous callback
     * @returns {Snapshot}
     */
    getSnapshot(streamId, cb) {
        if (!streamId || typeof streamId !== 'string')
            throw EventStoreError.paramError(`'streamId' must be a string. Found: ${typeof streamId}`);
        return Promisify(async () => {
            const params = {
                TableName: this.snapshotsTableName,
                ConsistentRead: true,
                ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':first': 0, ':last': Number.MAX_SAFE_INTEGER }),
                KeyConditionExpression: 'StreamId = :streamId AND RevisionId BETWEEN :first AND :last',
            };
            const reply = await dynamoDb.query(params).promise();
            const result = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Snapshot.fromObject(e))[0];
            return result;
        }, cb);
    }
}

const defaultHandler = new DynamoDBESHandler(microserviceName);
defaultHandler.EsHandler = DynamoDBESHandler;

module.exports = defaultHandler;
