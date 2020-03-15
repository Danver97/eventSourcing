const ExtendableError = require('./lib/extendable_error');

const errorCodes = {
    paramError: {
        name: 'paramError',
        code: 'paramError',
    },
}

class EventError extends ExtendableError {

    static paramError(msg) {
        return new EventError(msg, EventError.paramErrorCode);
    }

    static get paramErrorCode() {
        return errorCodes.paramError.code;
    }
}

module.exports = EventError;
