const AWS = require('aws-sdk');
const SQSUtils = require('../../deployScripts/libs/sqsUtils.class');

const region = process.env.AWS_DEFAULT_REGION || 'eu-west-2';
const credentials = {
    accessKeyId: process.env.DEPLOY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DEPLOY_AWS_SECRET_ACCESS_KEY,
};

AWS.config = new AWS.Config({ region, credentials });
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const sqsUtils = new SQSUtils({ microserviceName: 'EventSourcing', environment: 'dev', client: sqs });

async function run() {
    const queueUrl = await sqsUtils.getQueueUrl('TestQueue');
    await sqsUtils.deleteQueue(queueUrl);
    console.log('queue deleted successfully');
}

run();
