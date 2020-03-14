module.exports = class Event {
    /**
     * @constructor
     * @param {string} streamId Stream Id
     * @param {number} eventId Event id
     * @param {string} message Event name
     * @param {object} payload Event payload
     */
    constructor(streamId, eventId, message, payload) {
        this._checkParams(streamId, eventId, message, payload);

        this.streamId = streamId;
        this.eventId = eventId;
        this.message = message;
        this.payload = payload;
    }

    _checkParams(streamId, eventId, message, payload) {
        if (!streamId || eventId === undefined || eventId === null || !message || !payload) {
            throw new Error(`Event: missing the following parameters 
                ${!streamId ? 'streamId, ' : ''}${(eventId === undefined || eventId === null) ? 'eventId, ' : ''}
                ${!message ? 'message, ' : ''}${!payload ? 'payload' : ''}.`);
        }
        if (typeof streamId !== 'string')
            throw new Error('\'streamId\' must be a string');
        if (typeof eventId !== 'number')
            throw new Error('\'eventId\' must be a number');
        if (typeof message !== 'string')
            throw new Error('\'message\' must be a string');
        if (typeof payload !== 'object')
            throw new Error('\'payload\' must be a object');
    }
    
    /**
     * Creates an Event instance from a plain object
     * @param {object} obj 
     * @param {string} obj.streamId Stream Id
     * @param {number} obj.eventId Event id
     * @param {string} obj.message Event name
     * @param {object} obj.payload Event payload
     * @returns {Event}
     */
    static fromObject(obj) {
        if (!obj)
            throw new Error('Missing parameter: obj');
        const streamId = obj.streamId || obj.StreamId;
        let eventId = obj.eventId;
        if (eventId === undefined || eventId === null)
            eventId = obj.EventId;
        const message = obj.message || obj.Message;
        const payload = obj.payload || obj.Payload;
        return new Event(streamId, eventId, message, payload);
    }
};
