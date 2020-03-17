# Event broker (v2.x)
Provides a common interface for getting events from a event broker. Easily expandable, provides two implementations:
- `testbroker`: a basic implementation of an in-memory event broker.
- `sqs`: an event broker implementation backed by AWS SQS.

## Types
This interface defines a new class called `BrokerEvent`. It extends `Events` and provides some additional attributes. Some implementation extends `BrokerEvent` in order to provide more attributes that are used internally without lack of compatibility with the interface.

For more information please visit [BrokerEvent](./BROKER_EVENT.md).

## Usage
```js
const eventBroker = require('eventSourcing/eventBroker');
```
`eventBroker` is an object with five functions:
- `startPoll(options, eventHandler, ms)`
- `stopPoll(id)`
- `ignoreEvent(e, cb)`
- `destroyEvent(e, cb)`

### startPoll(options, eventHandler, ms)
Starts polling the broker every `ms` milliseconds.

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | object | Config options for the polling session |
| `eventHandler` | function | Handler function |
| `ms` | number | Milliseconds from one call to the other |

##### Options
`options` is an object with the following allowed keys.

| Key | Type | Optional | Description |
| --- | --- | --- | --- |
| `number` | number | Yes | The number of events to be retrieved. Depending on the implementation this could be ignored. |
| `visibilityTimeout` | number | Yes | Milliseconds of the visibilityTimeout, optional. |

##### Handler function
`eventHandler` is a function with the following signature `eventHandler(err, events)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Config options for the polling session |
| `events` | function | Polled events. Please note that `events` could be a single BrokerEvent or an array of object of the same class. |

#### Return
Returns an integer referring the polling session. If multiple polling session are started the different `pollId` returned must be saved in order to stop them.

### stopPoll(id)
Stops polling the broker. If multiple polling session are started, stops the polling session with the gived `id`.

### ignoreEvent(e, cb)
Ignores the event. Different brokers when getting an event start a "visibility timeout" during which the event becomes "invisible" so that the event is processed by only one consumer. After the "visibility timeout" the event becomes visible so that if the consumer crashed before processing it, the event is delivered again. Sometimes is useful to ignore an event for certain time, so that is processed later (for example the event is out of order). This function allow the event handler to do it.

| Parameter | Type | Description |
| --- | --- | --- |
| `e` | BrokerEvent | The event |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.
#### Callback
It's called at the end of `ignoreEvent()`. Uses the following signature `cb(err)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `ignoreEvent()`. If everything is ok is `null` |


### destroyEvent(e, cb)
Deques the event from the broker so that it's never delivered again.

| Parameter | Type | Description |
| --- | --- | --- |
| `e` | BrokerEvent | The event |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.
#### Callback
It's called at the end of `destroyEvent()`. Uses the following signature `cb(err)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `destroyEvent()`. If everything is ok is `null` |
