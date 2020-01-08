// @flow
import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import storage from 'electron-json-storage';

import initDatabase from '../utils/initDatabase_sqlite';
import getSettingsDir from '../utils/getSettingsDir';
import create_sqlitedb from '../db/create_db';    // added by Andrius
import ModelsSqlite from '../models/index_sqlite';

const initConfig = async () => {
    const defaultSettings = {
        host: 'localhost',
        databaseName: 'bibliotrack',
        login: 'root',
        password: '',
        associateTag: 'jo8th6-21',
        accessKey: 'AKIAJ2J4ROC4GYIWCMMQ',
        secretKey: '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',
        appId: 'MauroUrr-Base-PRD-138c4f481-a44fac72',
        useLog: false,
        ebayFakePeriod: 30
      };
    
      storage.setDataPath(getSettingsDir());
      storage.has('settings', (error, hasKey) => {
        // mongoose.Promise = global.Promise;
        // const mongooseClient = mongoose.createConnection(
        //   defaultSettings.host, defaultSettings.databaseName, 27017,
        //   {
        //     promiseLibrary: global.Promise,
        //     useMongoClient: true,
        //     server: { socketOptions: { keepAlive: 20, connectTimeoutMS: 30000 } }
        //   }
        // );
        const sequelize = new Sequelize(defaultSettings.databaseName, defaultSettings.login, '', {
          host: defaultSettings.host,
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
      
        const models = ModelsSqlite(sequelize);
      
        if (!hasKey) {
          models.sequelize.sync({ force: true }).then(() => {
            console.log('Checking for config file...');

            console.log('No config file found!');
            storage.set('settings', defaultSettings, () => {
              console.log(`Config file added to: ${getSettingsDir()}`);
      
            initDatabase(sequelize, (err) => !err);
            });
          });
        } else {
          console.log(`Config file directory: ${getSettingsDir()}`);
        }
      });
};

export default initConfig;
