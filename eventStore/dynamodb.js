const ddbConfig = require('@danver97/aws-config')().ddb;
const DynamoDataTypes = require('dynamodb-data-types');
const Promisify = require('promisify-cb');
const stringHash = require("string-hash");
const Event = require('../event');
const Snapshot = require('./Snapshot');
const EventStoreHandler = require('./EventStoreHandler');
const Transaction = require('./transaction.class');
const EventStoreError = require('./errors/event_store.error');
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

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
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

const replayStreamsNumber = 5;

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
        this._checkSaveParams(streamId, revisionId, message, payload);
        let eId = revisionId || payload._revisionId || 0;
        eId++;
        delete payload._revisionId;
        const event = new Event(streamId, eId, message, toJSON(payload));
        return saveEvent(event, cb);
    }

    /**
     * Saves an event into the event store
     * @param {Event} event The event to be saved
     * @param {function} cb Asynchronous callback
     */
    saveEvent(event, cb) {
        this._checkEvent(event);
        return Promisify(async () => {
            const attrValues = dynamoAttr.wrap({
                ':sid': event.streamId,
                ':eid': event.eventId, /* 1 */ // OCCHIO QUIIIII!
                ':message': event.message,
                ':payload': event.payload,
                ':rsid': stringHash(event.streamId) % replayStreamsNumber,
                ':rssortkey': `${event.streamId}:${event.eventId}`,
            });
            removeEmptySetsOrStrings(attrValues);
            const params = {
                TableName: this.tableName,
                Key: dynamoAttr.wrap({ StreamId: event.streamId, EventId: event.eventId /* 1 */ }), // OCCHIO QUIIIII!
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
     * Saves multiple events into the event store, in a non-transactional way.
     * @param {Event[]} events The event to be saved
     * @param {function} cb Asynchronous callback
     */
    saveEvents(events, cb) {
        this._checkArrayOfEvents(events);
        return Promisify(async () => {
            await Promise.all(events.map(e => this.saveEvent(e)));
        }, cb);
    }
    
    /**
     * 
     * @param {Transaction} transaction The transaction to commit
     * @param {function} cb Asynchronous callback
     */
    commitTransaction(transaction, cb) {
        if (!(transaction instanceof Transaction))
            throw EventStoreError.paramError('\'transaction\' parameter must be an instance of Transaction class');
        if (transaction.size > this.transactionMaxSize)
            throw EventStoreError.transactionSizeExcededError(`'transaction' is too big. A maximum of ${this.transactionMaxSize} events per transaction are allowed.`);
        return Promisify(async () => {
            const transactItems = transaction.buffer.map(e => {
                const attrValues = dynamoAttr.wrap({
                    ':sid': e.streamId,
                    ':eid': e.eventId, /* 1 */ // OCCHIO QUIIIII!
                    ':message': e.message,
                    ':payload': e.payload,
                    ':rsid': stringHash(e.streamId) % replayStreamsNumber,
                    ':rssortkey': `${e.streamId}:${e.eventId}`,
                });
                return {
                    Update: {
                        TableName: this.tableName,
                        Key: dynamoAttr.wrap({ StreamId: e.streamId, EventId: e.eventId /* 1 */ }), // OCCHIO QUIIIII!
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
                    }
                };
            });
            await dynamoDb.transactWriteItems({ TransactItems: transactItems });
        }, cb);
    }

    get transactionMaxSize() {
        return 25;
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
