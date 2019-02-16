# BrokerEvent
Provide a more specialized class for an event extending `Event` class. Depending on the implementation of the event broker using it, it could be more specialized extending this class.

For more information about `Event` class please visit [Event](./EVENT.md).

## Inheritance tree
- [`Event`](./EVENT.md)
  - `BrokerEvent`

## Subclasses
- `SqsEvent` - For more information please visit [SqsEvent](./SQS_EVENT.md).

## Methods

### constructor(streamId, eventId, message, payload, sequenceNumber)

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `streamId` | string | Yes | The stream's streamId |
| `eventId` | string | Yes | The event's eventId |
| `message` | string | Yes | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | Yes | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |
| `sequenceNumber` | number | Yes | Defines an order within events using the same broker |

### static fromObject(obj)

Helps deserializing an event. Take an object and returns an instance of `BrokerEvent`.

`obj` is an object with the following keys

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `streamId` | string | Yes | The stream's streamId |
| `eventId` | string | Yes | The event's eventId |
| `message` | string | Yes | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | Yes | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |
| `sequenceNumber` | number | Yes | Defines an order within events using the same broker |

#### Return
Returns a new instance of `BrokerEvent`.
