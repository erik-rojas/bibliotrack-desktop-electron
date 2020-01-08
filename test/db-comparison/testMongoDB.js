import moment from 'moment';
const MongoClient = require('mongodb').MongoClient;

const config = require('./config.json');

// Increase Sort memory usage limit to 256MB:
// db.adminCommand({ setParameter: 1, internalQueryExecMaxBlockingSortBytes: 268435456 })

const run = () => {
  console.log('===== Running MongoDB test... =====');

  MongoClient.connect(`mongodb://${config.mongo.host}:${config.mongo.port}`, (err, client) => {
    if (err) {
      console.log(err);
    } else {
      const db = client.db(config.mongo.database);
      const collection = db.collection('ebay_data_completed');
      const funcs = [];

      const promiseSerial = funcs =>
        funcs.reduce((promise, func) =>
            promise.then(result => func().then(Array.prototype.concat.bind(result))),
          Promise.resolve([]));

      for (let index = 1; index <= config.test.attempts; index++) {
        funcs.push(() => fetchResult(index, collection));
      }

      return promiseSerial(funcs)
        .then(data => {
            console.log('MongoDB average time: ' + data.reduce((acc, val) => acc + val ) / data.length + 'ms');
            console.log('===================================')
        })
        .catch(e => {
          console.log(e.message);
          console.log('===================================');
        })
        .then(() => client.close());
    }
  });
};

const fetchResult = (index, collection) => {
  const startTime = moment(new Date());
  let query = {
    book: null,
    is_fake: { $in: [false, null] },
    is_spam: { $in: [false, null] },
    'image.contentType': { $ne: null }
  };

  if (config.test.textSearch !== '') {
    query.$text = {
      $search: config.test.conditionBetweenWords === 'AND'
        ? `"${config.test.textSearch}"`
        : config.test.textSearch
    }
  }

  return new Promise((resolve, reject) => {
    collection.find(query)
    .sort({ created_at: -1 })
    .skip(config.test.pageSize * (config.test.page - 1))
    .limit(config.test.pageSize)
    .toArray((err, docs) => {
      if (err) {
        reject(err);
      } else if (docs.length === 0) {
        reject(new Error('Error: Table is empty.'));
      } else {
        resolve(docs);
      }
    })
  })
  .then(() => new Promise((resolve, reject) => {
    query.is_fake = null;
    query.is_spam = null;

    collection.find(query)
    .count((e, count) => {
      if (e) reject(e);
      else {
        query.is_fake = false;
        query.is_spam = false;

        collection.find(query)
        .count((e_, c) => {
          if (e_) reject(e_);
          else {
            resolve(count + c);
          }
        });
      }
    });
  }))
  .then(count => new Promise((resolve) => {
    const endTime = moment(new Date());
    const finalTime = endTime.diff(startTime, 'ms');

    console.log(`MongoDB time (attempt #${index}): ` + finalTime + 'ms');
    console.log('Amount of items: ' + count);

    resolve(finalTime);
  }));
};

run();
