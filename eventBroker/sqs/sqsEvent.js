const Event = require('../../event');

class SqsEvent extends Event {
    constructor(streamId, eventId, message, payload, sequenceNumber, receiptHandle, messageId) {
        super(streamId, eventId, message, payload, sequenceNumber);
        this.receiptHandle = receiptHandle;
        this.messageId = messageId;
    }
    
    static fromObject(obj) {
        const e = super.fromObject(obj);
        const receiptHandle = obj.receiptHandle || obj.ReceiptHandle;
        const messageId = obj.messageId || obj.MessageId;
        
        const sqsEv = new SqsEvent(e.streamId, e.eventId, e.message, e.payload, e.sequenceNumber, receiptHandle, messageId);
        sqsEv.createdAt = e.createdAt;
        return sqsEv;
    }
}

module.exports = SqsEvent;
