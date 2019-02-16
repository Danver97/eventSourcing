# SqsEvent
Provide a more specialized class for an event extending `BrokerEvent` class used by the broker implementation using AWS SQS.

For more information about `BrokerEvent` class please visit [BrokerEvent](./BROKER_EVENT.md).

## Inheritance tree
- [`Event`](./EVENT.md)
  - [`BrokerEvent`](./BROKER_EVENT.md)
    - `SqsEvent`

## Methods

### constructor(streamId, eventId, message, payload, sequenceNumber, receiptHandle, messageId)

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `streamId` | string | Yes | The stream's streamId |
| `eventId` | string | Yes | The event's eventId |
| `message` | string | Yes | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | Yes | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |
| `sequenceNumber` | number | Yes | Defines an order within events using the same broker |
| `receiptHandle` | number | Yes | It's used by AWS SQS to identify a single instance of the same message. It's used internally to destroy an event in a SQS queue. |
| `messageId` | number | Yes | The id of the message carrying the event. |

### static fromObject(obj)

Helps deserializing an event. Take an object and returns an instance of `SqsEvent`.

`obj` is an object with the following keys

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `streamId` | string | Yes | The stream's streamId |
| `eventId` | string | Yes | The event's eventId |
| `message` | string | Yes | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | Yes | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |
| `sequenceNumber` | number | Yes | Defines an order within events using the same broker |
| `receiptHandle` | number | Yes | It's used by AWS SQS to identify a single instance of the same message. It's used internally to destroy an event in a SQS queue. |
| `messageId` | number | Yes | The id of the message carrying the event. |

#### Return
Returns a new instance of `SqsEvent`.
