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

    static get paramErrorCode() {
        return errorCodes.paramError.code;
    }

    static get streamRevisionNotSyncErrorCode() {
        return errorCodes.streamRevisionNotSyncError.code;
    }

    static get eventAlreadyExistsErrorCode() {
        return errorCodes.eventAlreadyExistsError.code;
    }

    static get eventAlreadyExistsErrorCode() {
        return errorCodes.transactionSizeExcededError.code;
    }
}

module.exports = EventStoreError;
