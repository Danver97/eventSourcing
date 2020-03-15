const ExtendableError = require('../../lib/extendable_error');

const errorCodes = {
    paramError: {
        name: 'paramError',
        code: 'paramError',
    },
}

class EventBrokerError extends ExtendableError {

    static paramError(msg) {
        return new EventBrokerError(msg, EventBrokerError.paramErrorCode);
    }

    static get paramErrorCode() {
        return errorCodes.paramError.code;
    }
}

module.exports = EventBrokerError;
