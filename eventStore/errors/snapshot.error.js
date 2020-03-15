const ExtendableError = require('../../lib/extendable_error');

const errorCodes = {
    paramError: {
        name: 'paramError',
        code: 'paramError',
    },
}

class SnapshotError extends ExtendableError {

    static paramError(msg) {
        return new SnapshotError(msg, SnapshotError.paramErrorCode);
    }

    static get paramErrorCode() {
        return errorCodes.paramError.code;
    }
}

module.exports = SnapshotError;
