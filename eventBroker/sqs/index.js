const AWSinit = require('@danver97/aws-config')();
const Promisify = require('promisify-cb');
const attr = require('dynamodb-data-types').AttributeValue;
const EventBrokerHandler = require('../eventBrokerHandler');
const EventBrokerError = require('../errors/event_broker.error');
const Event = require('../../event');
const SqsEvent = require('./sqsEvent');

const snsConfig = AWSinit.sns;
const sqsConfig = AWSinit.sqs;
const sqs = sqsConfig.sqs;

const microserviceName = process.env.MICROSERVICE_NAME;

function checkIfEvent(e) {
    if (!(e instanceof Event))
        throw EventBrokerError.paramError('Provided object is not an instance of Event');
}

function checkIfSqsEvent(e) {
    if (!(e instanceof SqsEvent))
        throw EventBrokerError.paramError('Provided object is not an instance of SqsEvent');
}

function queueName(name) {
    return `${name}Queue`;
}

class SqsBrokerHandler extends EventBrokerHandler {
    /**
     * @constructor
     * @param {object} options 
     * @param {string} options.eventBrokerName The broker name
     * @param {string} [options.queueName] The broker queue name
     */
    constructor(options = { eventBrokerName: microserviceName }) {
        super(options);
        this.queueName = options.queueName || queueName(eventBrokerName);
    }

    _openMessageEnvelope(messageBody) {
        const obj = JSON.parse(messageBody);
        if (obj.Message)
            return JSON.parse(obj.Message);
        return obj;
    }

    _unwrap(obj) {
        try {
            return attr.unwrap(obj);
        } catch (err) {
            return obj;
        }
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
                        DataType: 'Number',
                        StringValue: `${event.eventId}`,
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

    getEvent(options, cb) {
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
            if (!response.Messages)
                return [];
            return response.Messages.map(m => {
                // const message = JSON.parse(m.Body);
                const dbEvent = this._openMessageEnvelope(m.Body); // JSON.parse(message.Message);
                if (dbEvent.SequenceNumber && !dbEvent.SequenceNumber.S)
                    dbEvent.SequenceNumber = { S: dbEvent.SequenceNumber };
                const event = this._unwrap(dbEvent);
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

/* const defaultHandler = new SqsBrokerHandler(microserviceName);
defaultHandler.EbHandler = SqsBrokerHandler;

module.exports = defaultHandler; */
module.exports = SqsBrokerHandler;
