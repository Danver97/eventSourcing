const AWSinit = require('@danver97/aws-config')();
const Promisify = require('promisify-cb');
const EventBrokerHandler = require('../eventBrokerHandler');
const Event = require('../../event');
const SqsEvent = require('./sqsEvent');

const snsConfig = AWSinit.sns;
const sqsConfig = AWSinit.sqs;
const sqs = sqsConfig.sqs;

const microserviceName = process.env.MICROSERVICE_NAME;

function checkIfEvent(e) {
    if (!(e instanceof Event))
        throw new Error('Event Broker: provided object is not an instance of Event');
}

function checkIfSqsEvent(e) {
    if (!(e instanceof SqsEvent))
        throw new Error('Event Broker: provided object is not an instance of SqsEvent');
}

function queueName(name) {
    return `${name}Queue`;
}

// Broker methods implementation

/* function publish(event, cb) {
    checkIfEvent(event);
    return Promisify(async () => {
        const url = await sqsConfig.getQueueUrl();
        const params = {
            MessageBody: JSON.stringify(event),
            QueueUrl: url,
            DelaySeconds: 0,
            MessageAttributes: {
                StreamId: {
                    DataType: 'String',
                    StringValue: event.streamId,
                },
                EventId: {
                    DataType: 'String',
                    StringValue: event.eventId,
                },
                Message: {
                    DataType: 'String',
                    StringValue: event.message,
                },
            },
        };
        await sqs.sendMessage(params).promise();
    });
}

function get(options, cb) {
    return Promisify(async () => {
        const url = await sqsConfig.getQueueUrl();
        const params = {
            QueueUrl: url,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
        };
        if (options.visibilityTimeout) // && Math.floor(options.visibilityTimeout / 1000) != 0
            params.VisibilityTimeout = Math.floor(options.visibilityTimeout / 1000);
        const response = await sqs.receiveMessage(params).promise();
        return response.Messages.map(m => {
            const event = JSON.parse(m.Body);
            event.MessageId = m.MessageId;
            event.ReceiptHandle = m.ReceiptHandle;
            return SqsEvent.fromObject(event);
        });
    }, cb);
}

function hide(e, cb) {
    checkIfSqsEvent(e);
    return Promisify(() => {}, cb);
}

function remove(e, cb) {
    checkIfSqsEvent(e);
    return Promisify(async () => {
        const url = await sqsConfig.getQueueUrl();
        const params = {
            QueueUrl: url,
            ReceiptHandle: e.receiptHandle,
        };
        await sqs.deleteMessage(params).promise();
    }, cb);
}

function subscribe(topic, cb) {
    return Promisify(async () => {
        const arns = await Promise.all([snsConfig.getTopicArn(topic), sqsConfig.getQueueArn()]);
        const topicArn = arns[0]; // await snsConfig.getTopicArn(topic);
        const sqsQueueArn = arns[1]; // await sqsConfig.getQueueArn();
        await snsConfig.subscribe(topicArn, { Endpoint: sqsQueueArn });
    }, cb);
} */

class SqsBrokerHandler extends EventBrokerHandler {
    constructor(eventBrokerName) {
        super(eventBrokerName);
        this.queueName = queueName(eventBrokerName);
    }

    publish(event, cb) {
        checkIfEvent(event);
        return Promisify(async () => {
            const url = await sqsConfig.getQueueUrl(this.queueName);
            const params = {
                MessageBody: JSON.stringify(event), /* required */
                QueueUrl: url, /* required */
                DelaySeconds: 0,
                MessageAttributes: {
                    StreamId: {
                        DataType: 'String',
                        StringValue: event.streamId,
                    },
                    EventId: {
                        DataType: 'String',
                        StringValue: event.eventId,
                    },
                    Message: {
                        DataType: 'String',
                        StringValue: event.message,
                    },
                },
            };
            await sqs.sendMessage(params).promise();
        });
    }

    get(options, cb) {
        return Promisify(async () => {
            const url = await sqsConfig.getQueueUrl(this.queueName);
            const params = {
                QueueUrl: url,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20,
            };
            if (options.visibilityTimeout) // && Math.floor(options.visibilityTimeout / 1000) != 0
                params.VisibilityTimeout = Math.floor(options.visibilityTimeout / 1000);
            const response = await sqs.receiveMessage(params).promise();
            return response.Messages.map(m => {
                const event = JSON.parse(m.Body);
                event.MessageId = m.MessageId;
                event.ReceiptHandle = m.ReceiptHandle;
                return SqsEvent.fromObject(event);
            });
        }, cb);
    }

    hide(e, cb) {
        checkIfSqsEvent(e);
        return Promisify(() => {}, cb);
    }

    remove(e, cb) {
        checkIfSqsEvent(e);
        return Promisify(async () => {
            const url = await sqsConfig.getQueueUrl(this.queueName);
            const params = {
                QueueUrl: url,
                ReceiptHandle: e.receiptHandle,
            };
            await sqs.deleteMessage(params).promise();
        }, cb);
    }

    subscribe(topic, cb) {
        return Promisify(async () => {
            const arns = await Promise.all([snsConfig.getTopicArn(topic), sqsConfig.getQueueArn(this.queueName)]);
            const topicArn = arns[0]; // await snsConfig.getTopicArn(topic);
            const sqsQueueArn = arns[1]; // await sqsConfig.getQueueArn();
            await snsConfig.subscribe(topicArn, { Endpoint: sqsQueueArn });
        }, cb);
    }
}

const defaultHandler = new SqsBrokerHandler(microserviceName);
defaultHandler.EbHandler = SqsBrokerHandler;

module.exports = defaultHandler;
