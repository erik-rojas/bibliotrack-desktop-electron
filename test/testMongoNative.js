const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'bibliotrack';

// Use connect method to connect to the server
MongoClient.connect(url, (err, client) => {
  assert.equal(null, err);
  console.log('Connected successfully to server!');

  const db = client.db(dbName);
  const ebayDataCompletedCollection = db.collection('ebay_data_completed');

  ebayDataCompletedCollection.find({}).skip(72000).limit(100).toArray((e, docs) => {
    assert.equal(e, null);
    console.log('Found the following records (max 100):');
    console.log(docs);

    client.close();
  });
});
