const assert = require('assert');
const ENV = require('../src/env');
const AWS = require('../lib/AWS');
const broker = require('../lib/eventSourcing/eventBroker');
const BrokerEvent = require('../lib/eventSourcing/eventBroker/brokerEvent');
const delayedTestAsync = require('../lib/utils').delayedTestAsync;

const timeout = 10;
const visibilityTimeout = 1000;
const pollInterval = 500;
const waitAsync = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitSync = ms => {
    const date = new Date();
    let curDate = new Date();
    while (curDate - date < ms) 
        curDate = new Date();
};

const assertEventEqual = (actual, expected) => {
    assert.strictEqual(actual.streamId, expected.streamId);
    assert.strictEqual(actual.eventId, expected.eventId);
    assert.strictEqual(actual.message, expected.message);
    assert.strictEqual(JSON.stringify(actual.payload), JSON.stringify(expected.payload));
    assert.strictEqual(actual.sequenceNumber, expected.sequenceNumber);
};

describe('Event broker unit test', function () {
    const publishedEvent = new BrokerEvent('1', '1', 'provaEvent', { message: 'Prova evento' }, 1);
    let receivedEvent = null;
    let totalEventsLenght = null;
    
    before(async function () {
        this.timeout(10000);
        await AWS.init();
    });
    
    it('Publish event', async function () {
        try {
            await broker.publish(publishedEvent);
        } catch (e) {
            console.log(e);
            throw e;
        }
    });
    
    it('poll', function (done) {
        this.timeout(5000);
        waitSync(timeout);
        
        const options = { visibilityTimeout };
        broker.startPoll(options, (err, e) => {
            receivedEvent = e[0];
            let errorFlag = false;
            try {
                assertEventEqual(receivedEvent, publishedEvent);
            } catch (error) {
                console.log(error);
                errorFlag = true;
            }
            broker.stopPoll();
            if (!errorFlag)
                done();
        }, pollInterval);
    });
    
    /* it('ignoreEvent', delayedTestAsync(async () => {
        await broker.ignoreEvent(receivedEvent);
    }, visibilityTimeout + timeout)); */
    
    it('ignoreEvent', function (done) {
        this.timeout(visibilityTimeout + timeout + 2000);
        setTimeout(async () => {
            await broker.ignoreEvent(receivedEvent);
            
            const options = { visibilityTimeout };
            broker.startPoll(options, (err, e) => {
                totalEventsLenght = e.length;
                let errorFlag = false;
                try {
                    assertEventEqual(e[0], publishedEvent);
                } catch (error) {
                    console.log(error);
                    errorFlag = true;
                }
                broker.stopPoll();
                if (!errorFlag)
                    done();
            }, pollInterval);
        }, visibilityTimeout + timeout);
    });
    
    it('destroyEvent', function (done) {
        this.timeout(visibilityTimeout + timeout + 2000);
        setTimeout(async () => {
            await broker.destroyEvent(receivedEvent);
            done();
        }, visibilityTimeout + timeout);
    });
});
