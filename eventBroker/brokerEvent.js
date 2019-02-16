const Event = require('../event');

class BrokerEvent extends Event {
    constructor(streamId, eventId, message, payload, sequenceNumber) {
        super(streamId, eventId, message, payload);
        this.sequenceNumber = sequenceNumber;
    }
    
    static fromObject(obj) {
        const e = super.fromObject(obj);
        let sequenceNumber = obj.sequenceNumber;
        if (sequenceNumber === undefined || sequenceNumber === null)
            sequenceNumber = obj.SequenceNumber;
        
        return new BrokerEvent(e.streamId, e.eventId, e.message, e.payload, sequenceNumber);
    }
}

module.exports = BrokerEvent;
