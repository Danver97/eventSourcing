# Event
Provide a base class of an event. Depending on the sub-module using it, it could be more specialized extending this as a base class.

## Subclasses
- `BrokerEvent` - For more information please visit [BrokerEvent](./BROKER_EVENT.md).

## Methods

### constructor(streamId, eventId, message, payload)

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `streamId` | string | Yes | The stream's streamId |
| `eventId` | string | Yes | The event's eventId |
| `message` | string | Yes | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | Yes | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |

### static fromObject(obj)

Helps deserializing an event. Take an object and returns an instance of `Event`.

`obj` is an object with the following keys

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `streamId` | string | Yes | The stream's streamId |
| `eventId` | string | Yes | The event's eventId |
| `message` | string | Yes | The message of the event, for example: 'orderConfirmed' |
| `payload` | object | Yes | The event payload, for example: `{ orderId: 15, status: 'confirmed' }` |

#### Return
Returns a new instance of `Event`.
