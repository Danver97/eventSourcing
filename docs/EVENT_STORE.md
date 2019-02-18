# Event store
Provides common interface for manage an event store. Easily expandable, provides two implementations:
- `testdb`: a basic implementation of an in-memory event store.
- `dynamodb`: an event store implementation backed by AWS DynamoDB.

## Usage
```js
const eventStore = require('eventSourcing/eventStore');
```
`eventStore` is an object with three functions:
- `save(streamId, eventId, message, payload, cb)`
- `getStream(streamId, cb)`
- `saveSnapshot(aggregateId, revisionId, payload, cb)` (Available from 1.1)
- `getSnapshot(aggregateId, cb)` (Available from 1.1)
- `EsHandler` (Available from 1.1)

## EsHandler
`EsHandler` is a class and `eventStore` is an instance of that class. Using different instances of that class is possible to manage different event stores everyone for a single entity type. For example with dynamodb you can use different tables of different entities' event store. Otherwise you can choose to use the already defined `eventStore` to write to a default event store for the microservice.

### constructor(eventStoreName)
| Parameter | Type | Description |
| --- | --- | --- |
| `eventStoreName` | string | This will be used to target a different event store from another |

### save(streamId, eventId, message, payload, cb)
Save the event with `eventId` to the event store under the stream with the provided `streamId`. If an event with same `eventId` under the same stream is already present throws an error. If the `eventId` is bigger that the last saved event's `eventId` + 1 throws an error.

| Parameter | Type | Description |
| --- | --- | --- |
| `streamId` | string | The stream's streamId |
| `eventId` | string | The event's eventId |
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
| `stream` | array[object] | The stream of events; an array of Events |

### saveSnapshot(aggregateId, revisionId, payload, cb)
Get the snapshot with the given `aggregateId`. (Available from 1.1)

| Parameter | Type | Description |
| --- | --- | --- |
| `aggregateId` | string | The snapshot's aggregateId |
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

### getSnapshot(aggregateId, cb)
Get the snapshot with the given `aggregateId`. (Available from 1.1)

| Parameter | Type | Description |
| --- | --- | --- |
| `aggregateId` | string | The snapshot's aggregateId |
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

## Examples

### save()
```js
save(event.streamId, event.eventId, event.message, event.payload, (err, event) >= {
  if (!err)
    console.log("Event saved correctly!");
  else {
    console.err("Error on save!");
    throw err;
  }
});
// or
const eventSaved = await save(event.streamId, event.eventId, event.message, event.payload);

// another way
const event = new Event("1", "1", "eventSaved", { foo: "bar" });

save(event, cb);
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
