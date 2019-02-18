const ddbConfig = require('@danver97/aws-config')().ddb;
const DynamoDataTypes = require('dynamodb-data-types');
const Promisify = require('promisify-cb');
const Event = require('../event');
const EventStoreHandler = require('./EventStoreHandler');
const Snapshot = require('./Snapshot');

const dynamoAttr = DynamoDataTypes.AttributeValue;

let dynamoDb = ddbConfig.ddb;
let microserviceName = process.env.MICROSERVICE_NAME;
const snapshotTag = 'Snapshot';

function getTableName(microserviceName) {
    return `${microserviceName}EventStreamTable`;
}

function getSnapshotTableName(microserviceName) {
    return `${microserviceName}EventStreamTable`;
}

function removeEmptySetsOrStrings(attrValues) {
    Object.keys(attrValues).forEach(k => {
        if (typeof attrValues[k] !== 'object')
            return;
        if (attrValues[k].S !== undefined && attrValues[k].S === '')
            delete attrValues[k];
        if (attrValues[k].NS && attrValues[k].NS.length === 0)
            delete attrValues[k];
        if (attrValues[k] && attrValues[k].M)
            removeEmptySetsOrStrings(attrValues[k].M);
    });
}

class DynamoDBESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.tableName = getTableName(this.eventStoreName);
        this.snapshotsTableName = getSnapshotTableName(this.eventStoreName);
    }

    save(streamId, eventId, message, payload, cb) {
        return Promisify(async () => {
            let eId = eventId || payload._revisionId || 0;
            eId++;
            delete payload._revisionId;
            const event = new Event(streamId, eId, message, Object.assign({}, payload));
            const attrValues = dynamoAttr.wrap({
                ':sid': streamId,
                ':eid': eId, /* 1 */ // OCCHIO QUIIIII!
                ':message': message,
                ':payload': payload,
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
                },
                ExpressionAttributeValues: attrValues,
                UpdateExpression: 'SET #MSG = :message, #PL = :payload',
                ConditionExpression: '#SID <> :sid AND #EID <> :eid', // 'attribute_not_exists(StreamId) AND attribute_not_exists(EventId)',
                ReturnValues: 'ALL_NEW',
                ReturnItemCollectionMetrics: 'SIZE',
                ReturnConsumedCapacity: 'INDEXES',
            };
            // console.log(JSON.stringify(params.ExpressionAttributeValues));
            await dynamoDb.updateItem(params).promise();
            return event;
        }, cb);
    }

    getStream(streamId, cb) {
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

    saveSnapshot(aggregateId, revisionId, payload, cb) {
        return Promisify(async () => {
            const attrValues = dynamoAttr.wrap({
                ':revisionId': revisionId,
                ':payload': payload,
            });
            removeEmptySetsOrStrings(attrValues);
            const params = {
                TableName: this.snapshotsTableName,
                Key: dynamoAttr.wrap({ StreamId: streamId, EventId: snapshotTag /* 1 */ }), // OCCHIO QUIIIII!
                ExpressionAttributeNames: {
                    '#REV': 'RevisionId',
                    '#PL': 'Payload',
                },
                ExpressionAttributeValues: attrValues,
                UpdateExpression: 'SET #REV = :revisionId, #PL = :payload',
                ReturnValues: 'ALL_NEW',
                ReturnItemCollectionMetrics: 'SIZE',
                ReturnConsumedCapacity: 'INDEXES',
            };
            await dynamoDb.updateItem(params).promise();
        }, cb);
    }

    getSnapshot(aggregateId, cb) {
        return Promisify(async () => {
            const params = {
                TableName: table,
                ConsistentRead: true,
                ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':snapshot': snapshotTag }),
                KeyConditionExpression: 'StreamId = :streamId AND EventId = :snapshot',
            };
            const reply = await dynamoDb.query(params).promise();
            const result = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Snapshot.fromObject(e))[0];
            return result;
        }, cb);
    }
}

/* Utility functions */
/*
function saveUtility(table, streamId, eventId, message, payload, cb) {
    return Promisify(async () => {
        let eId = eventId || payload._revisionId || 0;
        eId++;
        delete payload._revisionId;
        const event = new Event(streamId, eId, message, Object.assign({}, payload));
        const attrValues = dynamoAttr.wrap({
            ':sid': streamId,
            ':eid': eId,
            ':message': message,
            ':payload': payload,
        });
        removeEmptySetsOrStrings(attrValues);
        const params = {
            TableName: table,
            Key: dynamoAttr.wrap({ StreamId: streamId, EventId: eId }), // OCCHIO QUIIIII!
            ExpressionAttributeNames: {
                '#SID': 'StreamId',
                '#EID': 'EventId',
                '#MSG': 'Message',
                '#PL': 'Payload',
            },
            ExpressionAttributeValues: attrValues,
            UpdateExpression: 'SET #MSG = :message, #PL = :payload',
            ConditionExpression: '#SID <> :sid AND #EID <> :eid', // 'attribute_not_exists(StreamId) AND attribute_not_exists(EventId)',
            ReturnValues: 'ALL_NEW',
            ReturnItemCollectionMetrics: 'SIZE',
            ReturnConsumedCapacity: 'INDEXES',
        };
        // console.log(JSON.stringify(params.ExpressionAttributeValues));
        await dynamoDb.updateItem(params).promise();
        return event;
    }, cb);
}

function saveSnapshotUtility(table, aggregateId, revisionId, payload, cb) {
    return Promisify(async () => {
        const attrValues = dynamoAttr.wrap({
            ':revisionId': revisionId,
            ':payload': payload,
        });
        removeEmptySetsOrStrings(attrValues);
        const params = {
            TableName: table,
            Key: dynamoAttr.wrap({ StreamId: streamId, EventId: snapshotTag }), // OCCHIO QUIIIII!
            ExpressionAttributeNames: {
                '#REV': 'RevisionId',
                '#PL': 'Payload',
            },
            ExpressionAttributeValues: attrValues,
            UpdateExpression: 'SET #REV = :revisionId, #PL = :payload',
            ReturnValues: 'ALL_NEW',
            ReturnItemCollectionMetrics: 'SIZE',
            ReturnConsumedCapacity: 'INDEXES',
        };
        await dynamoDb.updateItem(params).promise();
    }, cb);
}

function getStreamUtility(table, streamId, cb) {
    return Promisify(async () => {
        const params = {
            TableName: table,
            ConsistentRead: true,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':start': 0, ':now': Number.MAX_SAFE_INTEGER }),
            KeyConditionExpression: 'StreamId = :streamId AND EventId BETWEEN :start AND :now',
        };
        const reply = await dynamoDb.query(params).promise();
        const results = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Event.fromObject(e));
        return results;
    }, cb);
}

function getSnapshotUtility(table, aggregateId, cb) {
    return Promisify(async () => {
        const params = {
            TableName: table,
            ConsistentRead: true,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':snapshot': snapshotTag }),
            KeyConditionExpression: 'StreamId = :streamId AND EventId = :snapshot',
        };
        const reply = await dynamoDb.query(params).promise();
        const results = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Event.fromObject(e));
        return results;
    }, cb);
}
*/

const defaultHandler = new DynamoDBESHandler(microserviceName);
defaultHandler.EsHandler = DynamoDBESHandler;

module.exports = defaultHandler;
