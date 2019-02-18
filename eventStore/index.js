const dynamodb = require('./dynamodb');
const testdb = require('./testdb');

const Property = implem.Property;

const dbs = {
    dynamodb,
    testdb,
};

module.exports = dbs;
