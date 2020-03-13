const ExtendableError = require('../../lib/extendable_error');

const errorCodes = {
    paramError: {
        name: 'paramError',
        code: 'paramError',
    },
    streamRevisionNotSyncError: {
        name: 'streamRevisionNotSyncError',
        code: 'streamRevisionNotSyncError',
    },
    eventAlreadyExistsError: {
        name: 'eventAlreadyExistsError',
        code: 'eventAlreadyExistsError',
    }
}

class EventStoreError extends ExtendableError {

    static paramError(msg) {
        return new EventStoreError(msg, EventStoreError.paramErrorCode);
    }

    static streamRevisionNotSyncError(msg) {
        return new EventStoreError(msg, EventStoreError.streamRevisionNotSyncErrorCode);
    }

    static eventAlreadyExistsError(msg) {
        return new EventStoreError(msg, EventStoreError.eventAlreadyExistsErrorCode);
    }

    static get paramErrorCode() {
        return errorCodes.paramError.code;
    }

    static get streamRevisionNotSyncErrorCode() {
        return errorCodes.streamRevisionNotSyncError.code;
    }

    static get eventAlreadyExistsErrorCode() {
        return errorCodes.eventAlreadyExistsError.code;
    }
}

module.exports = EventStoreError;
