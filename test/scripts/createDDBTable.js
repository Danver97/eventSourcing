const AWS = require('aws-sdk');
const DDBUtils = require('../../deployScripts/libs/dynamoUtils.class');

const region = process.env.AWS_DEFAULT_REGION || 'eu-west-2';
const credentials = {
    accessKeyId: process.env.DEPLOY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DEPLOY_AWS_SECRET_ACCESS_KEY,
};

AWS.config = new AWS.Config({ region, credentials });
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const ddbUtils = new DDBUtils({ microserviceName: 'EventSourcing', environment: 'dev', client: ddb });

async function run() {
    await ddbUtils.buildEventStreamTable('provaMicroserviceEventStreamTable');
    await ddbUtils.buildSnapshotTable('provaMicroserviceSnapshotTable');
    console.log('tables created successfully');
}

run();
