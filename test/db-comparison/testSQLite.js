import moment from 'moment';
import { Sequelize } from 'sequelize';

const config = require('./config.json');

const run = () => {
  console.log('====== Running SQLite test... =====');

  const sqliteClient = new Sequelize(null, null, null, {
    storage: config.sqlite.database,

    dialect: 'sqlite',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    operatorsAliases: false,
    logging: false,

    dialectOptions: {
      charset: 'utf8mb4',
    }
  });

  const funcs = [];

  const promiseSerial = funcs =>
    funcs.reduce((promise, func) =>
        promise.then(result => func().then(Array.prototype.concat.bind(result))),
      Promise.resolve([]));

  for (let index = 1; index <= config.test.attempts; index++) {
    funcs.push(() => fetchResult(index, sqliteClient));
  }

  return promiseSerial(funcs)
  .then(data => {
    console.log('SQLite average time: ' + data.reduce((acc, val) => acc + val ) / data.length + 'ms');
    console.log('===================================')
  })
  .catch(e => {
    console.log(e.message);
    console.log('===================================');
  })
  .then(() => sqliteClient.close());
};

const fetchResult = (index, sqlClient) => {
  const startTime = moment(new Date());
  const textSearchQuery = config.test.textSearch !== ''
   ? 'AND id IN (SELECT rowid ' +
     'FROM ebay_data_completed_index ' +
     `WHERE ebay_data_completed_index MATCH 'title:${config.test.conditionBetweenWords === 'AND'
       ? '"' + config.test.textSearch + '"' : config.test.textSearch}') `
   : '';
  const queryBody = 'WHERE book IS NULL AND image_content_type IS NOT NULL ' +
    'AND is_fake IN (0, NULL) AND is_spam IN (0, NULL) ' +
    textSearchQuery;

  return new Promise((resolve, reject) => {
    sqlClient.query('SELECT * FROM ebay_data_completed ' + queryBody +
      `LIMIT ${config.test.pageSize} OFFSET ${config.test.pageSize * (config.test.page - 1)}`,
      { type: Sequelize.QueryTypes.SELECT })
    .then(result => {
      if (result.length === 0) {
        reject(new Error('Error: Result is empty.'));
      } else {
        return resolve(sqlClient.query('SELECT COUNT() as count FROM ebay_data_completed ' + queryBody,
          { type: Sequelize.QueryTypes.SELECT }));
      }
    })
  })
  .then(result => new Promise((resolve) => {
    const countEnd = moment(new Date());
    const finalTime = countEnd.diff(startTime, 'ms');

    console.log(`SQLite time (attempt #${index}): ` + finalTime + 'ms');
    console.log('Amount of items: ' + result[0].count);

    resolve(finalTime);
  }));
};

run();
