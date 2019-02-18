const dynamodb = require('./dynamodb');
const testdb = require('./testdb');

const dbs = {
    dynamodb,
    testdb,
};

module.exports = dbs;
