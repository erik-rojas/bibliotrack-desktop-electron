import { Sequelize } from 'sequelize';

import ModelsSqlite from '../models/index_sqlite';

const create_sqlitedb = () => { // added by Andrius
  const sequelize = new Sequelize('bibliotrack', 'root', '', {
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

  const models = ModelsSqlite(sequelize);

  models.sequelize.sync({ force: true });
};

export default create_sqlitedb;  // added by Andrius