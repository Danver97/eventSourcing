const ExtendableError = require('./extendable_error');

class EventStoreError extends ExtendableError {}

module.exports = EventStoreError;
