const AWS = require('aws-sdk/global');
const SNS = require('aws-sdk/clients/sns');

/* if (process.env.AWS_DEFAULT_REGION)
    AWS.config = new AWS.Config({ region: process.env.AWS_DEFAULT_REGION }); */

const snsParams = { apiVersion: '2010-03-31' };
if (process.env.LOCALSTACK_HOSTNAME)
    snsParams.endpoint = new AWS.Endpoint(`http://${process.env.LOCALSTACK_HOSTNAME}:4569`);
else if (process.env.SNS_URL)
    snsParams.endpoint = new AWS.Endpoint(process.env.SNS_URL);
const sns = new SNS(snsParams);


function unwrap(o) {
    if (typeof o !== 'object')
        return o;
    if (o.S)
        return o.S;
    if (o.M)
        return o.M;
    if (o.SS)
        return o.SS;
    if (o.N)
        return o.N;
    return o;
}

exports.toSNS = async function (event) {
    console.log('toSNS start');
    const records = event.Records.filter(r => r.eventName === 'INSERT').map(r => {
        const image = r.dynamodb.NewImage;
        image.SequenceNumber = { S: r.dynamodb.SequenceNumber }; // image._sequenceNumber = r.dynamodb.SequenceNumber;
        return image;
    });
    const promises = [];
    console.log(records.length);
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const params = {
            Message: JSON.stringify(r),
            MessageAttributes: {
                StreamId: {
                    DataType: 'String',
                    StringValue: unwrap(r.StreamId).toString(),
                },
                EventId: {
                    DataType: 'String',
                    StringValue: unwrap(r.EventId).toString(),
                },
                Message: {
                    DataType: 'String',
                    StringValue: unwrap(r.Message).toString(),
                },
                SequenceNumber: {
                    DataType: 'String',
                    StringValue: r.SequenceNumber.toString(),
                },
            },
            TopicArn: process.env.TOPIC_ARN,
        };
        promises.push(sns.publish(params).promise());
    }
    try {
        await Promise.all(promises);
    } catch (e) {
        console.log(e);
        throw e;
    }
    console.log(`SUCCESS -> Received: ${records.length}; Sent: ${promises.length}`);
    // return;
};
