const ExtendableError = require('../../lib/extendable_error');

class EventStoreError extends ExtendableError {}

module.exports = EventStoreError;
