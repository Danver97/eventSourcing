/* const uuidv4 = require('uuid/v4');
const ENV = require('../src/env');
const persistence = require('../infrastructure/repository/eventSourcing/persistence');
const RestaurantEvents = require('../lib/restaurant-events');
const Restaurant = require('../domain/models/restaurant');
const assertStrictEqual = require('../lib/utils').assertStrictEqual;

const waitAsync = ms => new Promise(resolve => setTimeout(() => resolve(), ms));
const waitAsyncTimeout = 10;

describe('Event store unit test', function () {
    const rest = new Restaurant(uuidv4(), 'Name', 'Owner');
    
    before(async () => {
        if (ENV.node_env !== 'test' && ENV.event_broker !== ENV.event_store)
            await persistence.broker().subscribe(RestaurantEvents.topic); 
    });
    
    it('check event is written on db', async function () {
        / * await persistence.restaurantCreated(rest);
        await waitAsync(waitAsyncTimeout);
        const result = await persistence.getRestaurant(rest.id);
        // assert.strictEqual(JSON.stringify(result), JSON.stringify(rest));
        assertStrictEqual(result, rest); * /
    });
}); */
