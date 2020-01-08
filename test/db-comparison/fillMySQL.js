import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';

import fetchData from './utils/fetchData'
import Models from '../../app/models/index';
import EbayDataCompleted from '../../app/models/EbayDataCompleted';

const config = require('./config.json');

const run = () => {
  mongoose.Promise = global.Promise;
  const mongoClient = mongoose.createConnection(
    config.mongo.host, config.mongo.database, config.mongo.port,
    {
      promiseLibrary: global.Promise,
      useMongoClient: true,
      server: { socketOptions: { keepAlive: 20, connectTimeoutMS: 30000 } }
    }
  );
  const mysqlClient = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    port: config.mysql.port,
    database: config.mysql.database,

    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 100000
    },
    operatorsAliases: false,
    logging: false,

    dialectOptions: {
      charset: 'utf8mb4',
    }
  });

  const mongoModels = Models(mongoClient);
  const EbayDataCompletedModel = EbayDataCompleted(mysqlClient, Sequelize.DataTypes);

  return mongoModels.EbayDataCompletedSchema.count({}, (err, count) => {
    if (err) {
      console.log(err.message);
      console.log('===================================');
    } else {
      const promiseSerial = funcs =>
        funcs.reduce((promise, func) =>
            promise.then(result => func().then(Array.prototype.concat.bind(result))),
          Promise.resolve([]));

      const pages = Math.ceil(count / config.itemsPerFillQuery);
      const funcs = [];

      console.log('======== Filling MySQL... =========');
      console.log('Items amount: ' + count);
      console.log('Pages to process: ' + pages);

      for (let i = 1; i <= pages; i++) {
        funcs.push(() => fetchData(mongoClient, mongoModels, mysqlClient,
          { EbayDataCompleted: EbayDataCompletedModel }, i));
      }

      console.log('Creating table...');
      return promiseSerial(funcs)
      .then(() => {
        console.log('Table added.');
      })
      .then(() => {
        console.log('Creating indexes...');
        return mysqlClient.query('ALTER TABLE ebay_data_completed ADD FULLTEXT INDEX search (title)');
      })
      .then(() => {
        console.log('Indexes added.');
      })
      .then(() => {
        console.log('Database filled!');
        console.log('===================================');
      })
      .catch(e => {
        console.log(e.message);
        console.log('===================================');
      })
      .then(() => {
        mongoClient.close();
        return mysqlClient.close();
      });
    }
  });
};

run();
