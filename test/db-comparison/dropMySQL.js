import { Sequelize } from 'sequelize';


const config = require('./config.json');

const run = () => {
  const mysqlClient = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    port: config.mysql.port,
    database: config.mysql.database,

    dialect: 'mysql',
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

  return mysqlClient.query('DROP DATABASE ' + config.mysql.database)
    .then(() => {
      console.log('MySQL database dropped.');
      return mysqlClient.close();
    })
    .catch(e => {
      console.log('MySQL database dropping error: ' + e.message);
      return mysqlClient.close();
    });
};

run();
