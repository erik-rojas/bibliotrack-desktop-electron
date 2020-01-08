import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

import Models from '../models';
import ModelsSqlite from '../models/index_sqlite';

mongoose.Promise = global.Promise;
const mongooseClient = mongoose.createConnection(
  'localhost', 'bibliotrack', 27017,
  {
    promiseLibrary: global.Promise,
    useMongoClient: true,
    server: { socketOptions: { keepAlive: 20, connectTimeoutMS: 30000 } }
  }
);
const mongoModels = Models(mongooseClient);

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

  storage: 'main.sqlite'
});
const sqliteModels = ModelsSqlite(sequelize);

const fillTables = (mongoModels, sqliteModels) => {

  let amazonChannelsIDs = [];
  let amazonSearchesIDs = [];

  return new Promise((resolve, reject) => { // ### amazon_channels
    mongoModels.AmazonChannelSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    });

  }).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        name: item.name,
        url: item.url
      };

      amazonChannelsIDs[item._id.toString()] = index;
    });

    resolve(sqliteModels.AmazonChannel.bulkCreate(parsed, ['id', 'name', 'url'])); // ###

  })).then(() => new Promise((resolve, reject) => { // ### amazon_searches AND amazon_search_channels
    mongoModels.AmazonSearchSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let parsedChannels = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        name: item.name,
        is_asin: item.is_asin,
        searched_count: item.searched_count,
        searched_at: item.searched_at
      };

      amazonSearchesIDs[item._id.toString()] = index;

      item.channels.forEach(channel => {
        parsedChannels.push([ index, amazonChannelsIDs[channel.toString()], new Date(), new Date() ])
      });
    });

    resolve(sqliteModels.AmazonSearch.bulkCreate(parsed, ['id', 'name', 'is_asin',
      'searched_count', 'searched_at']).then(() => {
        return sqliteModels.sequelize.query('INSERT INTO amazon_search_channels (amazon_search_id, amazon_channel_id, created_at, updated_at) VALUES '
          + (parsedChannels.map(() => '(?)').join(', ')) + ';', {
          replacements: parsedChannels,
          type: Sequelize.QueryTypes.INSERT
        });
      })
    ); // ###

  })).then(() => new Promise((resolve, reject) => { // ### amazon_search_jobs
    mongoModels.AmazonSearchJobSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        isbn_asin: item.isbn_asin,
        status: item.status,
        status_code: item.status_code,
        created_at: item.created_at,
        updated_at: item.updated_at,
        amazon_search_id: amazonSearchesIDs[item.search.toString()],
        amazon_channel_id: amazonChannelsIDs[item.channel.toString()]
      };
    });

    resolve(sqliteModels.AmazonSearchJob.bulkCreate(parsed, ['id', 'isbn_asin', 'status',
      'status_code', 'created_at', 'updated_at', 'amazon_search_id', 'amazon_channel_id'])); // ###

  })).then(() => new Promise((resolve, reject) => { // ### amazon_search_items
    mongoModels.AmazonSearchItemSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        isbn_asin: item.isbn_asin,
        created_at: item.created_at,
        updated_at: item.updated_at,
        amazon_search_id: amazonSearchesIDs[item.search.toString()]
      };
    });

    resolve(sqliteModels.AmazonSearchItem.bulkCreate(parsed, ['id', 'isbn_asin',
      'created_at', 'updated_at', 'amazon_search_id'])); // ###

  })).then(() => new Promise((resolve, reject) => { // ### amazon_data
    mongoModels.AmazonDataSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        title: item.title,
        author: item.author === null ? 'None' : item.author,
        isbn_asin: item.isbn_asin,
        language: item.language,
        rank: item.rank,
        currency_code: item.currency_code,
        new_lowest_price: item.new_lowest_price.toString(),
        used_lowest_price: item.used_lowest_price.toString(),
        new_count: item.new_count,
        used_count: item.used_count,
        search_number: item.search_number,
        created_at: item.created_at,
        updated_at: item.updated_at,
        amazon_search_id: amazonSearchesIDs[item.search.toString()],
        amazon_channel_id: amazonChannelsIDs[item.channel.toString()]
      };
    });

    resolve(sqliteModels.AmazonData.bulkCreate(parsed, ['id', 'title', 'author', 'isbn_asin', 'language',
      'rank', 'currency_code', 'new_lowest_price', 'used_lowest_price', 'new_count',
      'used_count', 'search_number', 'created_at', 'updated_at',
      'amazon_search_id', 'amazon_channel_id'])); // ###

  })).then(() => new Promise((resolve, reject) => { // ### ebay_channels
    mongoModels.EbayChannelSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        name: item.name,
        url: item.url
      };
    });

    resolve(sqliteModels.EbayChannel.bulkCreate(parsed, ['id', 'name', 'url'])); // ###

  })).then(() => new Promise((resolve, reject) => { // ### ebay_categories
    mongoModels.EbayCategorySchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        name: item.name,
        ebay_id: item.ebay_id
      };
    });

    resolve(sqliteModels.EbayCategory.bulkCreate(parsed, ['id', 'name', 'ebay_id'])); // ###

  })).then(() => new Promise((resolve, reject) => { // ### book_languages
    mongoModels.BookLanguageSchema.find({}, (err, items) => {
      if (err) reject(err);
      else resolve(items);
    })

  })).then(items => new Promise((resolve) => {
    let parsed = [];
    let index = 0;

    items.forEach(item => {
      index++;

      parsed[index - 1] = {
        id: index,
        short_code: item.short_code,
        name: item.name
      };
    });

    resolve(sqliteModels.BookLanguage.bulkCreate(parsed, ['id', 'short_code', 'name'])); // ###

  }));
};

Promise.resolve(fillTables(mongoModels, sqliteModels))
  .then(() => mongoModels.mongoose.close())
  .then(() => sqliteModels.sequelize.close());
