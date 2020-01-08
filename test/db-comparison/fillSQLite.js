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
  const sqliteClient = new Sequelize(null, null, null, {
    storage: config.sqlite.database,

    dialect: 'sqlite',
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
  const EbayDataCompletedModel = EbayDataCompleted(sqliteClient, Sequelize.DataTypes);

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

      console.log('======== Filling SQLite... ========');
      console.log('Items amount: ' + count);
      console.log('Pages to process: ' + pages);

      for (let i = 1; i <= pages; i++) {
        funcs.push(() => fetchData(mongoClient, mongoModels, sqliteClient,
          { EbayDataCompleted: EbayDataCompletedModel }, i));
      }

      return new Promise((resolve) => {
        console.log('Creating virtual table...');
        resolve(sqliteClient.query('CREATE VIRTUAL TABLE ebay_data_completed_index USING fts5(title, tokenize=porter)'));
      })
      .then(() => {
        console.log('Virtual table added.');
        console.log('Creating table...');
        return sqliteClient.sync();
      })
      .then(() => {
        console.log('Adding triggers...');
        return sqliteClient.query(
          'CREATE TRIGGER after_ebay_data_completed_insert AFTER INSERT ON ebay_data_completed BEGIN\n' +
          '  INSERT INTO ebay_data_completed_index (\n' +
          '    rowid,\n' +
          '    title\n' +
          '  )\n' +
          '  VALUES(\n' +
          '    new.id,\n' +
          '    new.title\n' +
          '  );\n' +
          'END;'
        );
      })
      .then(() => sqliteClient.query(
        'CREATE TRIGGER after_ebay_data_completed_update UPDATE OF title ON ebay_data_completed BEGIN\n' +
        '  UPDATE ebay_data_completed_index SET title = new.title WHERE rowid = old.id;\n' +
        'END;'
      ))
      .then(() => sqliteClient.query(
        'CREATE TRIGGER after_ebay_data_completed_delete AFTER DELETE ON ebay_data_completed BEGIN\n' +
        '    DELETE FROM ebay_data_completed_index WHERE rowid = old.id;\n' +
        'END;'
      ))
      .then(() => {
        console.log('Triggers added.');
      })
      .then(() => promiseSerial(funcs))
      .then(() => {
        console.log('Table added.');
      })
      .then(() => {
        console.log('Creating indexes...');
        return sqliteClient.query('CREATE INDEX data_index ON ebay_data_completed (book, image_content_type, is_fake, is_spam);');
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
        return sqliteClient.close();
      });
    }
  });
};

run();
