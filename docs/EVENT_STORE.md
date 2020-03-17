# Event store (v3.x)
Provides common interface for manage an event store. Easily expandable, provides two implementations:
- `testdb`: a basic implementation of an in-memory event store.
- `dynamodb`: an event store implementation backed by AWS DynamoDB.

[Documentation for version 2.x](./EVENT_STORE_v2.x.md)

## Usage
```js
const EventStore = require('@danver97/event-sourcing/eventStore')[type];
const eventStore = new EventStore();
```
`type` is a string between `'testdb'` and `'dynamodb'`.

`eventStore` is an object with three functions:
- `save(streamId, revisionId, message, payload, cb)`
- `saveEvent(event, cb)`
- `saveEvents(events, cb)`
- `startTransaction()`
- `saveEventsTransactionally(events, cb)`
- `commitTransaction(transaction, cb)`
- `getStream(streamId, cb)`
- `saveSnapshot(streamId, revisionId, payload, cb)`
- `getSnapshot(streamId, cb)`

### constructor(options)
`options` is an object with the following properties
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `eventStoreName` | string | Yes | The event store name |
| `tableName` | string | No | The DynamoDB table name where events are saved. If not provided it defaults to `${eventStoreName}EventStreamTable` |
| `snapshotsTableName` | string | No | The DynamoDB table name where snapshots are saved. If not provided it defaults to `${eventStoreName}SnapshotTable` |

### save(streamId, revisionId, message, payload, cb)
Creates an event with the same `streamId`, `message` and `payload` and eventId equal to `revisionId + 1`.
If the indicated stream with id `streamId`, already has an event with `eventId` bigger than `revisionId + 1`, throws an error.

| Parameter | Type | Description |
| --- | --- | --- |
| `streamId` | string | The stream's streamId |
| `revisionId` | string | The stream revisionId: corresponds to the eventId of the last event saved. |
| `message` | string | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `save()`. Uses the following signature `cb(err, event)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `save()`. If everything is ok is `null` |
| `event` | object | The saved event |

### saveEvent(event, cb)
Saves the provided event into the stream with id equal to `event.eventId`. If that stream already has an event with the same `eventId`, throws an error.

| Parameter | Type | Description |
| --- | --- | --- |
| `event` | [Event](./EVENT.md) | The event to be saved |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `saveEvent()`. Uses the following signature `cb(err)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `saveEvent()`. If everything is ok is `null` |

### saveEvents(event, cb)
Saves the provided events.  
**Note**: this operation **IS NOT** atomic. If some events can't be save the function throws an error, but the successful operations are committed.

| Parameter | Type | Description |
| --- | --- | --- |
| `events` | [Event](./EVENT.md)[] | The events to be saved |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `saveEvents()`. Uses the following signature `cb(err)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `saveEvents()`. If everything is ok is `null` |

### startTransaction()
Returns a new [Transaction](./TRANSACTION.md) object.

### saveEventsTransactionally(events, cb)
Saves the provided events.  
**Note**: this operation **IS** atomic.

| Parameter | Type | Description |
| --- | --- | --- |
| `events` | [Event](./EVENT.md)[] | The events to be saved |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `saveEventsTransactionally()`. Uses the following signature `cb(err)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `saveEventsTransactionally()`. If everything is ok is `null` |

### commitTransaction(transaction, cb)
Commits the provided transaction.

| Parameter | Type | Description |
| --- | --- | --- |
| `transaction` | [Transaction](./TRANSACTION.md) | The transaction to commit |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `commitTransaction()`. Uses the following signature `cb(err)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `commitTransaction()`. If everything is ok is `null` |


### getStream(streamId, cb)
Get the stream of events with the given `streamId`.

| Parameter | Type | Description |
| --- | --- | --- |
| `streamId` | string | The stream's streamId |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `getStream()`. Uses the following signature `cb(err, stream)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `getStream()`. If everything is ok is `null` |
| `stream` | [Event](./EVENT.md)[] | The stream of events; an array of Event instances |

### saveSnapshot(streamId, revisionId, payload, cb)
Get the snapshot with the given `streamId`. (Available from 1.1)

| Parameter | Type | Description |
| --- | --- | --- |
| `streamId` | string | The id of the stream the snapshot refers to |
| `revisionId` | function | The id of the last event taken into account while building the snapshot |
| `payload` | function | The actual snapshot |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `saveSnapshot()`. Uses the following signature `cb(err, snapshot)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `saveSnapshot()`. If everything is ok is `null` |
| `snapshot` | object | The snapshot |

### getSnapshot(streamId, cb)
Get the snapshot with the given `streamId`. (Available from 1.1)

| Parameter | Type | Description |
| --- | --- | --- |
| `streamId` | string | The id of the stream the snapshot refers to |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.

#### Callback
It's called at the end of `getSnapshot()`. Uses the following signature `cb(err, snapshot)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `getSnapshot()`. If everything is ok is `null` |
| `snapshot` | object | The snapshot |


## Full examples

```js
/*
A user is modeled as a single stream.
Each update operation on the user corresponds to a new event to be created.
*/

const EventStore = require('@danver97/event-sourcing/eventStore')['dynamodb'];
const Event = require('@danver97/event-sourcing/event');

const eventStore = new EventStore({ eventStoreName: 'test' });
// The two tables used will be:
// - testEventStreamTable
// - testSnapshotTable

function recomputeUserAggregate(stream) {
  const user = {};
  // Apply the events in order, and recomputes the user state
  return user;
}

async function runExample() {
  const userId = 'userId1';
  const stream = await eventStore.getStream(userId);
  const streamRevisionId = stream[stream.length-1].eventId;
  const user = recomputeUserAggregate(stream);
  if (user.canChangeName()){
    const nameChangedEvent = new Event(userId, streamRevisionId +1, 'nameChanged', { name: 'newname' });
    await eventStore.saveEvent(nameChangedEvent);
  }
}

runExample();
```
## Single function examples

### save()
```js
save(event.streamId, event.eventId, event.message, event.payload, (err, event) >= {
  if (!err)
    console.log("Event saved correctly!");
  else {
    console.log("Error on save!");
    throw err;
  }
});
// or
const eventSaved = await save(event.streamId, event.eventId, event.message, event.payload);

// another way
const event = new Event("1", "1", "eventSaved", { foo: "bar" });

saveEvent(event, cb); 
// or
const eventSaved = await save(event);
```

### getStream()
```js
getStream("1", (err, stream) >= {
  if (!err)
    console.log("Stream retrieved correctly!");
  else {
    console.err("Error on getting stream!");
    throw err;
  }
});
// or
const stream = await getStream("1");
```

### getSnapshot()
```js
getSnapshot("1", (err, snapshot) >= {
  if (!err)
    console.log("Snapshot retrieved correctly!");
  else {
    console.err("Error on getting snapshot!");
    throw err;
  }
});
// or
const snapshot = await getSnapshot("1");
```
