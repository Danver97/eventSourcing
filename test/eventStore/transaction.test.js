const assert = require('assert');
const Transaction = require('../../eventStore/transaction.class');
const Event = require('../../event');
const EventStoreHandler = require('../../eventStore/EventStoreHandler');
const EventStoreTestDB = require('../../eventStore')['testdb'];
const EventStoreDynamoDB = require('../../eventStore')['dynamodb'];
const EventStoreError = require('../../eventStore/errors/event_store.error');

const esTestB = new EventStoreTestDB();
const esDDB = new EventStoreDynamoDB();


describe('Transaction class unit test', function () {
    const event1 = new Event('sid1', 1, 'provaEvent1', { field: 'value1' });
    const event2 = new Event('sid2', 2, 'provaEvent2', { field: 'value2' });

    it('check constructor works', function () {
        assert.throws(() => new Transaction(), EventStoreError);
        assert.throws(() => new Transaction({}), EventStoreError);

        const t1 = new Transaction(esTestB);
        assert.deepStrictEqual(t1.buffer, []);
        assert.strictEqual(t1.size, 0);
        assert.strictEqual(t1.maxSize, Number.MAX_SAFE_INTEGER);

        const t2 = new Transaction(esDDB);
        assert.deepStrictEqual(t2.buffer, []);
        assert.strictEqual(t2.size, 0);
        assert.strictEqual(t2.maxSize, 25);
    });

    it('check saveEvent works', function () {
        const t = new Transaction(esTestB);
        assert.throws(() => t.saveEvent(), EventStoreError);
        assert.throws(() => t.saveEvent({}), EventStoreError);

        t.saveEvent(event1);
        assert.deepStrictEqual(t.buffer, [event1]);
        assert.strictEqual(t.size, 1);
        t.saveEvent(event2);
        assert.deepStrictEqual(t.buffer, [event1, event2]);
        assert.strictEqual(t.size, 2);
    });

    it('check saveEvents works', function () {
        const t = new Transaction(esTestB);
        assert.throws(() => t.saveEvents(), EventStoreError);
        assert.throws(() => t.saveEvents({}), EventStoreError);
        assert.throws(() => t.saveEvents([{}]), EventStoreError);
        
        t.saveEvents([event1, event2]);
        assert.deepStrictEqual(t.buffer, [event1, event2]);
        assert.strictEqual(t.size, 2);
    });

    it('check commit works', function (done) {
        const testESH = new EventStoreHandler({ eventStoreName: 'prova' });
        const t = new Transaction(testESH);
        testESH.commitTransaction = (transaction, cb) => {
            let err;
            try {
                assert.ok(transaction instanceof Transaction);
                assert.deepStrictEqual(transaction, t);
            } catch (e) {
                err = e;
            }
            done(err);
        }
        t.commit();

    });
});
