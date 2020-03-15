const assert = require('assert');
const uuid = require('uuid').v4
const attr = require('dynamodb-data-types').AttributeValue;
const AWSinit = require('@danver97/aws-config')();
const SQS = require('aws-sdk/clients/sqs');
const SqsBroker = require('../../eventBroker/sqs').EbHandler;
const SqsEvent = require('../../eventBroker/sqs/sqsEvent');
const BrokerEvent = require('../../eventBroker/brokerEvent');
const EventBrokerError = require('../../eventBroker/errors/event_broker.error');

const AssertionError = assert.AssertionError;
const sqsConfig = AWSinit.sqs;
const sqs = new SQS();
const queueName = 'Test';
const broker = new SqsBroker(queueName);

const waitAsync = ms => new Promise(resolve => setTimeout(resolve, ms));

const testEvent = { "Payload": { "Field": "Field!" }, "Message": "New event!", "StreamId": "1", "EventId": 1, "SequenceNumber": "111" };
// console.log(JSON.stringify({Message: JSON.stringify(attr.wrap(testEvent))}));
const snsEvent = {
    Type: "Notification",
    MessageId: "df114bbb-1b90-5d8a-9fce-1daa29ff8213",
    TopicArn: "arn:aws:sns:eu-west-2:901546846327:testTopic",
    Message: JSON.stringify(attr.wrap(testEvent)),
    Timestamp: "2019-10-04T11:42:39.295Z",
    SignatureVersion: "1",
    Signature: "if4fkJj9aQpgIsLR5Zl3ApkZZkqu0WVCUKxaw2yZUTSucC3dA6/P+2+Fu9uRIKEDYO7SIAzAJforkyB9ToNVpUtv0BpEvzGZZ8GxSawmIVp71MIzCLPZ78+ifI/rbML+jTYAZGTWfDejtvoc03cp65EJMW0L7kAjPOUPrtJy9618KDqn3Aj0N5B2Gr/MvCfdjTNIDYbotcEzoNfCcO7iME7qzEnRfzOt+ujtPFcmGNKAzlZuq8aAyYTtkIsgVmFNpcxFms2nhWJ/HY4X7lvp5sEH1w8tjdj5SpAHiukN0S4Ut09WINO2iKRQ9yr9EVAYxqHlx9rGuOqkfGXCwg1rew==",
    SigningCertURL: "https://sns.eu-west-2.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem",
    UnsubscribeURL: "https://sns.eu-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-2:901546846327:testTopic:445c112e-d9d1-41bb-9220-a0f27c463b03",
    MessageAttributes: {
        StreamId: { Type: "String", Value: "1" },
        Message: { Type: "String", Value: "New event!" },
        SequenceNumber: { Type: "String", Value: "111" },
        EventId: { Type: "String", Value: "1" }
    }
};

function createSnsEvent(event) {
    return {
        Type: "Notification",
        MessageId: "df114bbb-1b90-5d8a-9fce-1daa29ff8213",
        TopicArn: "arn:aws:sns:eu-west-2:901546846327:testTopic",
        Message: JSON.stringify(attr.wrap(event)),
        Timestamp: "2019-10-04T11:42:39.295Z",
        SignatureVersion: "1",
        Signature: "if4fkJj9aQpgIsLR5Zl3ApkZZkqu0WVCUKxaw2yZUTSucC3dA6/P+2+Fu9uRIKEDYO7SIAzAJforkyB9ToNVpUtv0BpEvzGZZ8GxSawmIVp71MIzCLPZ78+ifI/rbML+jTYAZGTWfDejtvoc03cp65EJMW0L7kAjPOUPrtJy9618KDqn3Aj0N5B2Gr/MvCfdjTNIDYbotcEzoNfCcO7iME7qzEnRfzOt+ujtPFcmGNKAzlZuq8aAyYTtkIsgVmFNpcxFms2nhWJ/HY4X7lvp5sEH1w8tjdj5SpAHiukN0S4Ut09WINO2iKRQ9yr9EVAYxqHlx9rGuOqkfGXCwg1rew==",
        SigningCertURL: "https://sns.eu-west-2.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem",
        UnsubscribeURL: "https://sns.eu-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-2:901546846327:testTopic:445c112e-d9d1-41bb-9220-a0f27c463b03",
        MessageAttributes: {
            StreamId: { Type: "String", Value: `${event.streamId}` },
            EventId: { Type: "String", Value: `${event.eventId}` },
            Message: { Type: "String", Value: `${event.message}` },
            SequenceNumber: { Type: "String", Value: `${event.sequenceNumber}` },
        }
    };
}

const assertIsSqsEvent = (event) => {
    if (!(event instanceof SqsEvent))
        throw new AssertionError({
            message: 'Given event is not instance of SqsEvent',
            expected: SqsEvent.name,
            actual: event.constructor.name,
            operator: 'instanceof',
        });
}

const assertIsBrokerEvent = (event) => {
    if (!(event instanceof BrokerEvent))
        throw new AssertionError({
            message: 'Given event is not instance of BrokerEvent',
            expected: BrokerEvent.name,
            actual: event.constructor.name,
            operator: 'instanceof',
        });
}

const assertContainsSameInfo = (actual, expected) => {
    assert.deepStrictEqual(BrokerEvent.fromObject(actual), BrokerEvent.fromObject(expected))
}

function toJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

describe('Sqs Broker test', function () {
    this.timeout(4000);
    this.slow(1000);

    let QueueUrl;
    let publishedEvent = new BrokerEvent(uuid(), 1, 'provaEvent', { message: 'Prova evento' });

    before(async () => {
        QueueUrl = (await sqs.getQueueUrl({ QueueName: `${queueName}Queue` }).promise()).QueueUrl;
    });
    beforeEach(() => {
        publishedEvent = new BrokerEvent(uuid(), 1, 'provaEvent', { message: 'Prova evento' });
        console.log('new event:', publishedEvent.streamId);
    });
    afterEach(async function () {
        this.timeout(25000);
        await waitAsync(3500);
        const messages = (await sqs.receiveMessage({
            QueueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
        }).promise()).Messages;
        if (messages)
            await Promise.all(messages.map(m => {
                console.log('Msg cleaned:', JSON.parse(m.Body).streamId || JSON.parse(JSON.parse(m.Body).Message).streamId);
                return sqs.deleteMessage({ QueueUrl, ReceiptHandle: m.ReceiptHandle }).promise();
            }));
    });

    it('check remove works (~30s)', async function () {
        this.timeout(36000);
        this.slow(26000);
        assert.throws(() => broker.remove(), EventBrokerError);
        assert.throws(() => broker.remove('event'), EventBrokerError);
        assert.throws(() => broker.remove({}), EventBrokerError);

        await sqs.sendMessage({
            QueueUrl,
            MessageBody: JSON.stringify(publishedEvent),
        }).promise();
        await waitAsync(3500);

        let events = await broker.getEvent({ number: 10 });
        await Promise.all(events.map(e => {
            console.log(e.streamId)
            return broker.remove(e);
        }));
        // await waitAsync(3000);

        await sqs.sendMessage({
            QueueUrl,
            MessageBody: JSON.stringify(createSnsEvent(publishedEvent)),
        }).promise();

        events = await broker.getEvent({ number: 10 });
        await Promise.all(events.map(e => {
            console.log(e.streamId)
            return broker.remove(e);
        }));
        // await waitAsync(3000);

        // Check there are no more events
        events = await broker.getEvent({ number: 10 });
        assert.deepStrictEqual(events, []);
    });

    it('check destroyEvent works (~20s)', async function () {
        this.timeout(25000);
        this.slow(21000);
        assert.throws(() => broker.destroyEvent(), EventBrokerError);
        assert.throws(() => broker.destroyEvent('event'), EventBrokerError);
        assert.throws(() => broker.destroyEvent({}), EventBrokerError);

        await sqs.sendMessage({
            QueueUrl,
            MessageBody: JSON.stringify(createSnsEvent(publishedEvent)),
        }).promise();

        let events = await broker.getEvent({ number: 10 });
        await Promise.all(events.map(e => broker.destroyEvent(e)));

        events = await broker.getEvent({ number: 10 });

        assert.deepStrictEqual(events, []);
    });

    it('check publish works', async function () {
        assert.throws(() => broker.publish(), EventBrokerError);
        assert.throws(() => broker.publish('event'), EventBrokerError);
        assert.throws(() => broker.publish({}), EventBrokerError);

        await broker.publish(publishedEvent);

        const response = await sqs.receiveMessage({
            QueueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 5,
        }).promise();
        
        const events = response.Messages.map(m => {
            const body = JSON.parse(m.Body);
            try {
                return attr.unwrap(body);
            } catch (err) {
                return body;
            }
        });
        assert.deepStrictEqual(events, [toJSON(publishedEvent)]);
    });

    it('check getEvent works', async function () {
        this.slow(2500);
        await sqs.sendMessage({
            QueueUrl,
            MessageBody: JSON.stringify(publishedEvent),
        }).promise();

        let events = await broker.getEvent({ number: 10 });

        assert.strictEqual(events.length, 1);
        let actualEvent = events[0];
        assertIsSqsEvent(actualEvent);
        assertContainsSameInfo(actualEvent, publishedEvent);
        assert.strictEqual(typeof actualEvent.messageId, 'string');
        assert.notStrictEqual(actualEvent.messageId, '');
        assert.strictEqual(typeof actualEvent.receiptHandle, 'string');
        assert.notStrictEqual(actualEvent.receiptHandle, '');

        await sqs.sendMessage({
            QueueUrl,
            MessageBody: JSON.stringify(createSnsEvent(publishedEvent)),
        }).promise();

        events = await broker.getEvent({ number: 10 });

        assert.strictEqual(events.length, 1);
        actualEvent = events[0];
        assertIsSqsEvent(actualEvent);
        assertContainsSameInfo(actualEvent, publishedEvent);
        assert.strictEqual(typeof actualEvent.messageId, 'string');
        assert.notStrictEqual(actualEvent.messageId, '');
        assert.strictEqual(typeof actualEvent.receiptHandle, 'string');
        assert.notStrictEqual(actualEvent.receiptHandle, '');
    });

    it.skip('check subscribe works', async function () {
        await broker.subscribe('microservice-test');

        await testdb.save(publishedEvent.streamId, publishedEvent.eventId-1, publishedEvent.message, publishedEvent.payload);

        const events = await broker.getEvent({ number: 10 });
        events.forEach(e => delete e._timeoutId);
        assert.deepStrictEqual(events, [publishedEvent])
    });
});