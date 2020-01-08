import moment from 'moment';
import { Sequelize } from 'sequelize';

import EbayDataCompleted from '../../app/models/EbayDataCompleted';

const Op = Sequelize.Op;
const config = require('./config.json');

const run = () => {
  console.log('====== Running MySQL test... ======');

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

  const EbayDataCompletedModel = EbayDataCompleted(mysqlClient, Sequelize.DataTypes);
  const funcs = [];

  const promiseSerial = funcs =>
    funcs.reduce((promise, func) =>
        promise.then(result => func().then(Array.prototype.concat.bind(result))),
      Promise.resolve([]));

  for (let index = 1; index <= config.test.attempts; index++) {
    funcs.push(() => fetchResult(index, mysqlClient, { EbayDataCompleted: EbayDataCompletedModel }));
  }

  return promiseSerial(funcs)
  .then(data => {
    console.log('MySQL average time: ' + data.reduce((acc, val) => acc + val ) / data.length + 'ms');
    console.log('===================================')
  })
  .catch(e => {
    console.log(e.message);
    console.log('===================================');
  })
  .then(() => mysqlClient.close());
};

const fetchResult = (index, sqlClient, sqlModels) => {
  const startTime = moment(new Date());
  let query = {
    where: {
      book: null,
      is_fake: {
        [Op.or]: [0, null]
      },
      is_spam: {
        [Op.or]: [0, null]
      },
      image_content_type: {
        [Op.ne]: null
      }
    },
    offset: config.test.pageSize * (config.test.page - 1),
    limit: config.test.pageSize
  };

  if (config.test.textSearch !== '') {
    query.where.where = Sequelize.literal(`MATCH (title) AGAINST('${config.test.conditionBetweenWords === 'AND'
      ? '"' + config.test.textSearch + '"' : config.test.textSearch}' IN NATURAL LANGUAGE MODE)`);
  }

  return sqlModels.EbayDataCompleted.findAndCountAll(query)
  .then(result => new Promise((resolve, reject) => {
    if (result.count === 0) {
      reject(new Error('Error: Result is empty.'));
    }

    const countEnd = moment(new Date());
    const finalTime = countEnd.diff(startTime, 'ms');

    console.log(`MySQL time (attempt #${index}): ` + finalTime + 'ms');
    console.log('Amount of items: ' + result.count);

    resolve(finalTime);
  }))
};

run();
