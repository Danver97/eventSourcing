# Event Sourcing
A javascript module developed to easily manage event sourcing.

It's compose of two sub-modules:
- `eventStore`
- `eventBroker`

The blueprint of the infrastructure is based on push notifications of the event store towards every event broker that must work as a persistent queue.
Basically each new event that is stored in the event store, is published into each subscribed event broker.

## New: Event Store transaction support!
Starting from v3.0.0 some major stability improvements were made.  
A part from that it's great to announce transaction support for the supported Event Store implementations.

Now you case save multiple events belonging to the same or different event streams in a transactional way.
For more information visit the dedicated documentation.

## Event
Provide a base class of an event. Depending on the sub-module using it, it could be more specialized extending this as a base class.

For more information please visit [Event](./docs/EVENT.md).

## Event Store
Provide common interface for manage an event store. Easily expandable, provides two implementations:
- `testdb`: a basic implementation of an in-memory event store.
- `dynamodb`: an event store implementation backed by AWS DynamoDB.

For more information please visit [Event Store](./docs/EVENT_STORE.md).

## Event Broker
Provide a common interface for getting events from a event broker. Easily expandable, provides two implementations:
- `testbroker`: a basic implementation of an in-memory event broker.
- `sqs`: an event broker implementation backed by AWS SQS.

For more information please visit [Event Broker](./docs/EVENT_BROKER.md).
