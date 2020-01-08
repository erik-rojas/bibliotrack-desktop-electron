// @flow
import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import storage from 'electron-json-storage';
import * as amazon from 'amazon-product-api';

import EbayAPI from './EbayAPI';
import getSettingsDir from '../utils/getSettingsDir';

const MongoClient = require('mongodb').MongoClient;

const getConnection = (callback: (error: any, mongoose: any, amazonClient: any, ebayClient: any,
                                  useLog: any, nativeClient: any, databaseName: any, fakePeriod: any,
                                  sequelize: any) => void) => {
  storage.setDataPath(getSettingsDir());
  storage.get('settings', (error, data) => {
    if (error) callback(error, null, null, null, true, null, null, 30);
    else {
      // mongoose.Promise = global.Promise;
      // const mongooseClient = mongoose.createConnection(
      //   data.host, data.databaseName, 27017,
      //   {
      //     promiseLibrary: global.Promise,
      //     useMongoClient: true,
      //     server: { socketOptions: { keepAlive: 20, connectTimeoutMS: 30000 } }
      //   }
      // );

      const sequelize = new Sequelize(null, null, null, {
        host: 'localhost',
        dialect: 'sqlite',
        operatorsAliases: false,

        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },

        storage: 'app/db/main.sqlite'
      });

      // const amazonClient = amazon.createClient({
      //   awsId: data.accessKey,
      //   awsSecret: data.secretKey,
      //   awsTag: data.associateTag
      // });

      const ebayClient = new EbayAPI({
        appName: data.appId
      });

      callback(error, null, null, ebayClient, 
        data.useLog === null || data.useLog === undefined
                ? false
                : data.useLog, 
                null, data.databaseName, data.ebayFakePeriod, 
                sequelize);

      // const url = `mongodb://${data.host}:27017`;

      // MongoClient.connect(url, (err, client) => {
      //   if (err) {
      //     callback(
      //       null, mongooseClient, amazonClient, ebayClient,
      //       data.useLog === null || data.useLog === undefined
      //         ? false
      //         : data.useLog,
      //       null, null
      //     );
      //   } else {
      //     callback(
      //       null, mongooseClient, amazonClient, ebayClient,
      //       data.useLog === null || data.useLog === undefined
      //         ? false
      //         : data.useLog,
      //       client, data.databaseName, data.ebayFakePeriod,
      //       sequelize
      //     );
      //   }
      // });
    }
  });
};

export default getConnection;
