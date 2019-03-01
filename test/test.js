const broker = require('../eventBroker')['testbroker'];
const store = require('../eventStore')['testdb'];
const Event = require('../eventBroker/brokerEvent');

let pollId = null;

describe('', function () {
    before(async () => {
        await broker.subscribe('microservice-test');
        pollId = broker.startPoll({ visibilityTimeout: 5 }, (err, e) => {
            console.log(e);
        }, 10);
    });
    it('', async function () {
        const payload = {
            restId: 'asdf',
            owner: 'Giucas Casella',
        };
        const e = new Event('asdf', 1, 'restaurantCreated', payload);
        await store.save(e.streamId, e.eventId, e.message, e.payload);
        broker.log();
        broker.log();
        broker.log();
        broker.log();
    });

    after(() => {
        broker.stopPoll(pollId);
    });
});
