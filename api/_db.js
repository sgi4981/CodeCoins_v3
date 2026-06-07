const { MongoClient } = require('mongodb');
let client = null;

async function getDb() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
    }
    return client.db('codeCoinsDB');
}

module.exports = { getDb };
