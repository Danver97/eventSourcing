const assert = require('assert');
const attr = require('dynamodb-data-types').AttributeValue;
const AWSinit = require('@danver97/aws-config')();
const SQS = require('aws-sdk/clients/sqs');
const SqsBroker = require('../../eventBroker/sqs').EbHandler;
const SqsEvent = require('../../eventBroker/sqs/sqsEvent');
const BrokerEvent = require('../../eventBroker/brokerEvent');

const AssertionError = assert.AssertionError;
const sqsConfig = AWSinit.sqs;
const sqs = new SQS();
const queueName = 'Test';
const broker = new SqsBroker(queueName);

const waitAsync = ms => new Promise(resolve => setTimeout(resolve, ms));

const testEvent = { "Payload": { "Field": "Field!" }, "Message": "New event!", "StreamId": "1", "EventId": 1, "SequenceNumber": "111" };
// console.log(JSON.stringify({Message: JSON.stringify(attr.wrap(testEvent))}));
const snsEvent = {
    "Type": "Notification",
    "MessageId": "df114bbb-1b90-5d8a-9fce-1daa29ff8213",
    "TopicArn": "arn:aws:sns:eu-west-2:901546846327:testTopic",
    "Message": JSON.stringify(attr.wrap(testEvent)),
    "Timestamp": "2019-10-04T11:42:39.295Z",
    "SignatureVersion": "1",
    "Signature": "if4fkJj9aQpgIsLR5Zl3ApkZZkqu0WVCUKxaw2yZUTSucC3dA6/P+2+Fu9uRIKEDYO7SIAzAJforkyB9ToNVpUtv0BpEvzGZZ8GxSawmIVp71MIzCLPZ78+ifI/rbML+jTYAZGTWfDejtvoc03cp65EJMW0L7kAjPOUPrtJy9618KDqn3Aj0N5B2Gr/MvCfdjTNIDYbotcEzoNfCcO7iME7qzEnRfzOt+ujtPFcmGNKAzlZuq8aAyYTtkIsgVmFNpcxFms2nhWJ/HY4X7lvp5sEH1w8tjdj5SpAHiukN0S4Ut09WINO2iKRQ9yr9EVAYxqHlx9rGuOqkfGXCwg1rew==",
    "SigningCertURL": "https://sns.eu-west-2.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem",
    "UnsubscribeURL": "https://sns.eu-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-2:901546846327:testTopic:445c112e-d9d1-41bb-9220-a0f27c463b03",
    "MessageAttributes": {
        "StreamId": { "Type": "String", "Value": "1" },
        "Message": { "Type": "String", "Value": "New event!" },
        "SequenceNumber": { "Type": "String", "Value": "111" },
        "EventId": { "Type": "String", "Value": "1" }
    }
};


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

describe('Sqs Broker test', () => {


    it('getEvent()', async function () {
        this.slow(22000);
        this.timeout(30000);
        assert.strictEqual((await broker.getEvent({})).length, 0);
        const queueUrl = await sqsConfig.getQueueUrl(queueName + "Queue");
        let params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(snsEvent),
        };
        await sqs.sendMessage(params).promise();
        // await waitAsync(2000);
        const event = (await broker.getEvent({}))[0];
        assertIsSqsEvent(event);
        assertIsBrokerEvent(event);
        assertContainsSameInfo(event, testEvent);
        params = {
            QueueUrl: queueUrl,
            ReceiptHandle: event.receiptHandle,
        };
        await sqs.deleteMessage(params).promise();
    });

    it('remove()', async function () {
        this.slow(11000);
        this.timeout(13000);
        const queueUrl = await sqsConfig.getQueueUrl(queueName + "Queue");
        let params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(snsEvent),
        };
        await sqs.sendMessage(params).promise();
        params = {
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 5,
        };
        const response = await sqs.receiveMessage(params).promise();
        const mapFn = m => {
            const message = JSON.parse(m.Body);
            const dbEvent = JSON.parse(message.Message);
            const event = attr.unwrap(dbEvent);
            event.MessageId = m.MessageId;
            event.ReceiptHandle = m.ReceiptHandle;
            return SqsEvent.fromObject(event);
        };
        const event = response.Messages.map(mapFn)[0];
        assertIsSqsEvent(event);
        assertIsBrokerEvent(event);
        await broker.remove(event);
        const response2 = await sqs.receiveMessage(params).promise();
        assert.ok(!response2.Messages);
    })
});