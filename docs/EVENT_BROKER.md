# Event broker (v3.x)
Provides a common interface for getting events from a event broker. Easily expandable, provides two implementations:
- `testbroker`: a basic implementation of an in-memory event broker.
- `sqs`: an event broker implementation backed by AWS SQS.

[Documentation for version 2.x](./EVENT_BROKER_v2.x.md)

## Usage
```js
const eventBroker = require('@danver97/event-sourcing/eventBroker')[type];
const eventBroker = new EventBroker();
```
`type` is a string between `'testbroker'` and `'sqs'`.

`eventBroker` is an object with five functions:
- `getEvent(options, cb)`
- `publish(e, cb)`
- `remove(e, cb)`


### constructor(options)
`options` is an object with the following properties
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `eventBrokerName` | string | Yes | The event broker name |
| `tableName` | string | No | The SQS queue name used as broker. If not provided it defaults to `${eventBrokerName}Queue` |

### getEvent(options, cb)
Gets a batch of events from the broker.

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | object | See below |
| `cb` | function | Callback function |

##### Options
`options` is an object with the following allowed keys.

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `number` | number | No | The number of events to be retrieved. Depending on the implementation this could be ignored. |
| `visibilityTimeout` | number | No | Milliseconds during which the event wont be available, in order to not be processed twice simultaneously. |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.
#### Callback
It's called at the end of `getEvent()`. Uses the following signature `cb(err, events)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `getEvent()`. If everything is ok is `null` |
| `events` | [Event](./EVENT.md)[] | The events pulled from the broker. **Note**: the events won't be automatically removed from it |

### publish(event, cb)
Publish an event to the broker.

| Parameter | Type | Description |
| --- | --- | --- |
| `event` | [Event](./EVENT.md) | The event to publish |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.
#### Callback
It's called at the end of `publish()`. Uses the following signature `cb(err, events)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `publish()`. If everything is ok is `null` |

### remove(event, cb)
Remove the event to the broker.

| Parameter | Type | Description |
| --- | --- | --- |
| `event` | [Event](./EVENT.md) | The event to remove |
| `cb` | function | Callback function |

#### Return
If no callback is provided, returns a `Promise`.
Otherwise returns `null`.
#### Callback
It's called at the end of `publish()`. Uses the following signature `cb(err, events)`.

| Parameter | Type | Description |
| --- | --- | --- |
| `err` | object | Provide error information in case of a failed `publish()`. If everything is ok is `null` |
