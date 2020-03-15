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
    },
    transactionSizeExcededError: {
        name: 'transactionSizeExcededError',
        code: 'transactionSizeExcededError',
    },
    transactionFailedError: {
        name: 'transactionFailedError',
        code: 'transactionFailedError',
    },
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

    static transactionSizeExcededError(msg) {
        return new EventStoreError(msg, EventStoreError.transactionSizeExcededErrorCode);
    }

    static transactionFailedError(msg) {
        return new EventStoreError(msg, EventStoreError.transactionFailedErrorCode);
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

    static get transactionSizeExcededErrorCode() {
        return errorCodes.transactionSizeExcededError.code;
    }

    static get transactionFailedErrorCode() {
        return errorCodes.transactionFailedError.code;
    }

    static get errors() {
        return errorCodes;
    }
}

module.exports = EventStoreError;
