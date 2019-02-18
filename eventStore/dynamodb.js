const ddbConfig = require('@danver97/aws-config')().ddb;
const DynamoDataTypes = require('dynamodb-data-types');
const Promisify = require('promisify-cb');
const Event = require('../event');
const EventStoreHandler = require('./EventStoreHandler');

const dynamoAttr = DynamoDataTypes.AttributeValue;

let dynamoDb = ddbConfig.ddb;
let microserviceName = process.env.MICROSERVICE_NAME;
const snapshotTag = 'Snapshot';

function getTableName(microserviceName) {
    return `${microserviceName}EventStreamTable`;
}

function getSnapshotTableName(microserviceName) {
    return `${microserviceName}SnapshotTable`;
}

async function init(msName) {
    console.log('DynamoDb: init');
    let tableName = `${microserviceName}EventStreamTable`;
    if (msName) {
        microserviceName = msName;
        tableName = `${msName}EventStreamTable`;
    }
    if (!microserviceName)
        throw new Error('DynamoDb: microservice name not specified on initialization.');
    const tableParams = {
        AttributeDefinitions: [
            {
                AttributeName: 'StreamId',
                AttributeType: 'S',
            },
            {
                AttributeName: 'EventId',
                AttributeType: 'N',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'StreamId',
                KeyType: 'HASH',
            },
            {
                AttributeName: 'EventId',
                KeyType: 'RANGE',
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
        TableName: tableName,
        StreamSpecification: {
            StreamEnabled: true,
            StreamViewType: 'NEW_IMAGE', // 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY',
        },
    };
    try {
        await dynamoDb.createTable(tableParams).promise();
    } catch (e) {
        if (e.code === 'ResourceInUseException')
            console.log('DynamoDb table already created.');
        else {
            console.log(e);
            throw e;
        }
    }
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

function save(streamId, eventId, message, payload, cb) {
    return saveUtility(getTableName(microserviceName), streamId, eventId, message, payload, cb);
}

function getStream(streamId, cb) {
    return getStreamUtility(getTableName(microserviceName), streamId, cb)
}

function saveSnapshot(aggregateId, revisionId, payload, cb) {
    return saveSnapshotUtility(getSnapshotTableName(microserviceName), aggregateId, revisionId, payload, cb);
}

function getSnapshot(aggregateId, cb) {
    return getSnapshotUtility(getSnapshotTableName(microserviceName), aggregateId, cb);
}

class DynamoDBESHandler extends EventStoreHandler {
    constructor(eventStoreName) {
        super(eventStoreName);
        this.tableName = getTableName(this.eventStoreName);
        this.snapshotsTableName = getSnapshotTableName(this.eventStoreName);
    }

    save(streamId, eventId, message, payload, cb) {
        return saveUtility(this.tableName, streamId, eventId, message, payload, cb);
    }

    saveSnapshot(aggregateId, revisionId, payload, cb) {
        return saveSnapshotUtility(this.snapshotsTableName, aggregateId, revisionId, payload, cb);
    }

    getStream(streamId, cb) {
        return getStreamUtility(this.tableName, streamId, cb);
    }

    getSnapshot(aggregateId, cb) {
        return getSnapshotUtility(this.snapshotsTableName, aggregateId, cb);
    }
}

/* Utility functions */

function saveUtility(table, streamId, eventId, message, payload, cb) {
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
            TableName: table,
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

function saveSnapshotUtility(table, aggregateId, revisionId, payload, cb) {
    return Promisify(async () => {
        const attrValues = dynamoAttr.wrap({
            ':revisionId': revisionId,
            ':payload': payload,
        });
        removeEmptySetsOrStrings(attrValues);
        const params = {
            TableName: table,
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

function getStreamUtility(table, streamId, cb) {
    return Promisify(async () => {
        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':start': 0, ':now': Number.MAX_SAFE_INTEGER }),
            KeyConditionExpression: 'StreamId = :streamId AND EventId BETWEEN :start AND :now',
            TableName: table,
        };
        const reply = await dynamoDb.query(params).promise();
        const results = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Event.fromObject(e));
        return results;
    }, cb);
}

function getSnapshotUtility(table, aggregateId, cb) {
    return Promisify(async () => {
        const params = {
            ConsistentRead: true,
            ExpressionAttributeValues: dynamoAttr.wrap({ ':streamId': streamId, ':snapshot': snapshotTag }),
            KeyConditionExpression: 'StreamId = :streamId AND EventId = :snapshot',
            TableName: table,
        };
        const reply = await dynamoDb.query(params).promise();
        const results = reply.Items.map(i => dynamoAttr.unwrap(i)).map(e => Event.fromObject(e));
        return results;
    }, cb);
}

module.exports = {
    DynamoDBESHandler,
    dynamoDb,
    save,
    getStream,
    saveSnapshot,
    getSnapshot,
};
