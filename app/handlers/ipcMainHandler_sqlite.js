/* eslint-disable no-param-reassign,no-underscore-dangle */
import { ipcMain, dialog } from 'electron';
import request from 'request';
import * as Excel from 'exceljs';
import moment from 'moment';
import storage from 'electron-json-storage';

import amazonJobHandler from './amazonJobHandler_sqlite';
import ebayJobHandler from './ebayJobHandler_sqlite';
import ebayScheduler from './ebayScheduler_sqlite';
import getConnection from '../utils/getConnection';
import Models from '../models/index';
import ModelsSqlite from '../models/index_sqlite';
import isDomestic from '../utils/isDomestic';
import getSettingsDir from '../utils/getSettingsDir';
import { model } from 'mongoose';
import AmazonSearchItem from '../models/AmazonSearchItem';

const Sequelize = require('sequelize');

const imageRequest = request.defaults({ encoding: null, timeout: 5000 });

function imageRequestPromise(url) {
  return new Promise((resolve) => {
    imageRequest(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        // eslint-disable-next-line no-buffer-constructor
        const image = new Buffer(body).toString('base64');

        if (image !== '') {
          resolve({
            data: `base64,${image}`,
            contentType: `image/${url.substr(url.length - 3)}`,
            url
          });
        } else {
          resolve({
            isCorrupted: true
          });
        }
      } else {
        resolve({
          isFailed: true
        });
      }
    });
  });
}

const ipcMainHandler = async (app) => {
  app.on('window-all-closed', () => {
    ebayScheduler.emit('stop');
    ebayScheduler.emit('stop-handler');

    amazonJobHandler.emit('stop');

    setTimeout(() => {
      console.log('Closed!');
      app.quit();
    }, 6000);
  });

  ipcMain.on('amazon-handle-searches', (event, debug = false) => {
    if (debug) {
      amazonJobHandler.emit('handle', event);
    } else {
      amazonJobHandler.emit('start', event);
    }
  });

  ipcMain.on('amazon-stop-handling-searches', () => {
    amazonJobHandler.emit('stop');
  });

  ipcMain.on('ebay-schedule-searches', (event) => {
    ebayScheduler.emit('start', event, ebayJobHandler);
  });

  ipcMain.on('ebay-start-handling-searches', (event) => {
    ebayScheduler.emit('start-handler', event, ebayJobHandler);
  });

  ipcMain.on('ebay-stop-handling-searches', (event) => {
    ebayScheduler.emit('stop-handler', event);
  });

  ipcMain.on('ebay-stop-scheduling-searches', (event) => {
    ebayScheduler.emit('stop', event);
  });

  ipcMain.on('load-settings', (event) => {
    storage.setDataPath(getSettingsDir());
    storage.get('settings', (error, data) => {
      if (error) return event.sender.send('settings-loading-error', error);
      return event.sender.send('settings-loaded', data);
    });
  });

  ipcMain.on('save-settings', (event, settings) => {
    storage.setDataPath(getSettingsDir());
    storage.set('settings', settings, (error) => {
      if (error) return event.sender.send('settings-saving-error', error);
      return event.sender.send('settings-saved');
    });
  });

  ipcMain.on('load-searches', (event) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
                   sequelize) => {
      if (error) return event.sender.send('searches-loading-error', error);
      const models = ModelsSqlite(sequelize);

      return models.sequelize.query("SELECT S.id, S.name, S.is_asin, S.searched_count, S.searched_at, S.created_at,\n" +
        "COUNT(SI.id) AS items_count, COUNT(SI.id) - COUNT(DISTINCT SI.isbn_asin) AS items_count_duplicates\n" +
        "FROM amazon_searches S\n" +
        "LEFT JOIN amazon_search_items SI ON (S.id = SI.amazon_search_id)\n" +
        "GROUP BY S.id, S.name", { type: sequelize.QueryTypes.SELECT })
        .then(searches_with_items => {

          models.sequelize.query("SELECT S.id, COUNT(SJ.id) AS jobs_count,\n" +
            "COUNT(case when SJ.status = 'Queued' then 1 else null end) AS jobs_count_queued,\n" +
            "COUNT(case when SJ.status = 'Finished' then 1 else null end) AS jobs_count_finished,\n" +
            "COUNT(case when SJ.status = 'Failed' then 1 else null end) AS jobs_count_failed\n" +
            "FROM amazon_searches S\n" +
            "LEFT JOIN amazon_search_jobs SJ ON (S.id = SJ.amazon_search_id)\n" +
            "GROUP BY S.id", { type: sequelize.QueryTypes.SELECT })
            .then(searches_with_jobs => {

              const filtered = [];

              searches_with_items.forEach((search, index) => {
                const job = searches_with_jobs[index];

                filtered.push({
                  key: search.id,
                  id: search.id,
                  name: search.name,
                  channels: [{ id: 1, name: 'amazon.it' }], // TODO: channels ??
                  type: search.is_asin === 1 ? 'ASINs' : 'ISBNs',
                  total: search.items_count,
                  duplicates: search.items_count_duplicates,
                  queued: job.jobs_count,
                  inQueue: job.jobs_count_queued,
                  finished: job.jobs_count_finished,
                  failed: job.jobs_count_failed,
                  createdAt: search.created_at,
                  searchedAt: search.searched_at,
                  searchedCount: search.searched_count,
                  visible: true
                });
              });

              return event.sender.send('searches-loaded', filtered);
            });
        })
        .catch(err => { console.log(err); event.sender.send('searches-loading-error', err); })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('add-search', (event, data) => {
    const amazonItems = data.isbnsOrAsins.split(/(\n|\r\n|\s|,|;|\.)+/ig)
    .map(item => item.trim().replace(/-+/ig, ''))
    .filter(item => item !== '');

    var channels_item = [];

    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('search-adding-error', error);
      const models = ModelsSqlite(sequelize);
      
      return new Promise((resolve, reject) => {
        models.AmazonChannel.findAll().then(channels => {
          resolve(channels);
        });
      })
      .then(channels => new Promise((resolve, reject) => { 
        channels_item = channels.filter(item => data.channels.includes(item.name)).map(item => item.id);
        models.AmazonSearch.create({
            name: data.name,
            is_asin: data.isAsins,
            searched_at: new Date()
          }).then(search => {
            resolve( search.get({ plain: true }) );
          })
      }))
      // ---------- insert values into 'amazon_search_items' ----------
      .then(search => {
        const selectedItems = amazonItems.map(value => ({
          isbn_asin: value,
          amazon_search_id: search.id
        }));
        return models.AmazonSearchItem.bulkCreate(selectedItems)
          .then(searchItems => new Promise((resolve, reject) => {
            resolve(search);
          }));
      })
      // -----------------------------------------------------------------
      // ---------- insert values into 'amazon_search_channels' ----------
      .then(search => {
        const selectedChannels = channels_item.map(value => ({
          amazon_search_id: search.id,
          amazon_channel_id: value
        }));
        return models.AmazonSearchChannel.bulkCreate(selectedChannels)
          .then(searchItems => new Promise((resolve, reject) => {
            resolve(null);
          }));
      })
      // -----------------------------------------------------------------
      .then(() => event.sender.send('search-added'))
      .catch(err => {
        console.log(err);
        event.sender.send('search-adding-error', err);
      })
      .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('delete-search', (event, id) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('search-adding-error', error);
      const models = ModelsSqlite(sequelize);

      return models.AmazonSearchJob.destroy({ where: { amazon_search_id: id }})
        .then(() => models.AmazonSearchItem.destroy({ where: { amazon_search_id: id }}))
        .then(() => models.AmazonData.destroy({ where: { amazon_search_id: id }}))
        .then(() => new Promise((resolve, reject) => 
          models.AmazonSearch.destroy({ where: { id: id }})
          .then(affectedRows => { resolve(null); })))
        .then(() => event.sender.send('search-deleted', id))
        .catch(err => {
          console.log(err);
          return event.sender.send('search-deletion-error', err);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('start-search', (event, id) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('search-adding-error', error);
      const models = ModelsSqlite(sequelize);

      return models.AmazonSearchJob.destroy({ where: { amazon_search_id: id }})
        .then(() => models.AmazonData.destroy({ where: { amazon_search_id: id }}))
        .then(() => {
          return models.sequelize.query("SELECT AM_SE.name, AM_SE.is_asin, AM_SE.searched_count, AM_SE.searched_at, AM_S_IT.isbn_asin, AM_CH.name channels, AM_CH.url FROM amazon_searches AS AM_SE \n" + 
          "LEFT JOIN amazon_search_items AS AM_S_IT ON AM_SE.id = AM_S_IT.amazon_search_id \n" + 
          "LEFT JOIN (SELECT name, url, amazon_search_id FROM amazon_channels AS AM_CH \n" + 
          "LEFT JOIN amazon_search_channels AS AM_S_CH \n" + 
          "ON AM_CH.id = AM_S_CH.amazon_channel_id) AS AM_CH ON AM_SE.id = AM_CH.amazon_search_id \n" + 
          "WHERE AM_SE.id = ?", { replacements: { id }, type: sequelize.QueryTypes.SELECT })
          .then(search => new Promise((resolve, reject) => {
            console.log(search);
            resolve(search);
          }
        ))
        .then(search => {
          // const jobs = search.channels.map((channel) => {
          //   const duplicates = {};

          //   return search.search_items.map((item) => ({
          //     isbn_asin: item.isbn_asin, 
          //     search: search.id.toString(), 
          //     channel: channel.id.toString()
          //   })).filter(value => {
          //     if (duplicates[value.isbn_asin] === value.search) {
          //       return false;
          //     }

          //     duplicates[value.isbn_asin] = value.search;
          //     return true;
          //   });
          // })
        })
      })
    });
  });

  ipcMain.on('export-searches-data', (event, ids) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('searches-data-exporting-error', error);
      const models = ModelsSqlite(sequelize);

      return new Promise((resolve, reject) => {
        if (ids === 'all') {
          models.sequelize.query("SELECT AM_DA.id, AM_CH.name channel, language, title, author, AM_SE.is_asin, isbn_asin, currency_code, new_count, new_lowest_price, used_count, used_lowest_price, rank, AM_DA.updated_at, AM_SE.name search FROM amazon_data AS AM_DA \n" + 
          "LEFT JOIN amazon_searches AS AM_SE ON AM_SE.id = AM_DA.amazon_search_id \n" + 
          "LEFT JOIN amazon_channels AS AM_CH ON AM_CH.id = AM_DA.amazon_channel_id \n", { type: sequelize.QueryTypes.SELECT })
          .then(users => {
            resolve(users);
          })
        } else {
          var search_ids = ids.toString();
          models.sequelize.query('SELECT AM_DA.id, AM_CH.name channel, language, title, author, AM_SE.is_asin, isbn_asin, currency_code, new_count, new_lowest_price, used_count, used_lowest_price, rank, AM_DA.updated_at, AM_SE.name search FROM amazon_data AS AM_DA \n' + 
          'LEFT JOIN amazon_searches AS AM_SE ON AM_SE.id = AM_DA.amazon_search_id \n' + 
          'LEFT JOIN amazon_channels AS AM_CH ON AM_CH.id = AM_DA.amazon_channel_id \n' + 
          'WHERE AM_DA.amazon_search_id IN (' + search_ids + ')', { type: sequelize.QueryTypes.SELECT })
          .then(users => {
            resolve(users);
          })
        }
      })
      .then(data => {
        if (data.length > 0) {
          const rows = data.map(item => ({
            ID: item.id.toString(),
            Channel: item.channel,
            'Domestic/Imported': isDomestic(item.channel, item.language) ? 'Domestic' : 'Imported',
            Language: item.language,
            Title: item.title,
            Author: item.author,
            'IS ASIN?': item.search.is_asin === true ? 'Yes' : 'No',
            'ISBN/ASIN': item.isbn_asin,
            Currency: item.currency_code,
            'Sellers New': Number(item.new_count),
            'Lowest Price New': Number(item.new_lowest_price.toString()),
            'Sellers Used': Number(item.used_count),
            'Lowest Price Used': Number(item.used_lowest_price.toString()),
            Rank: Number(item.rank),
            Date: new Date(item.updated_at),
            Search: item.search.name
          }));

          console.log(rows);

          const workbook = new Excel.Workbook();
          workbook.creator = 'Bibliotrack';
          workbook.created = new Date();
          workbook.properties.date1904 = true;

          const worksheet = workbook.addWorksheet('Amazon data');

          worksheet.columns = [
            {
              header: 'ID', key: 'ID', width: 27
            },
            {
              header: 'Domestic/Imported', key: 'Domestic/Imported', width: 20, style: { numFmt: '@' }
            },
            {
              header: 'Channel', key: 'Channel', width: 13, style: { numFmt: '@' }
            },
            {
              header: 'Language', key: 'Language', width: 15, style: { numFmt: '@' }
            },
            {
              header: 'Title', key: 'Title', width: 60, style: { numFmt: '@' }
            },
            {
              header: 'Author', key: 'Author', width: 30, style: { numFmt: '@' }
            },
            {
              header: 'Is ASIN?', key: 'Is ASIN?', width: 10, style: { numFmt: '@' }
            },
            {
              header: 'ISBN/ASIN', key: 'ISBN/ASIN', width: 15, style: { numFmt: '@' }
            },
            {
              header: 'Currency', key: 'Currency', width: 10, style: { numFmt: '@' }
            },
            {
              header: 'Sellers New', key: 'Sellers New', width: 16, style: { numFmt: '0' }
            },
            {
              header: 'Lowest Price New', key: 'Lowest Price New', width: 22, style: { numFmt: '0.00' }
            },
            {
              header: 'Sellers Used', key: 'Sellers Used', width: 16, style: { numFmt: '0' }
            },
            {
              header: 'Lowest Price Used', key: 'Lowest Price Used', width: 22, style: { numFmt: '0.00' }
            },
            {
              header: 'Rank', key: 'Rank', width: 12, style: { numFmt: '0' }
            },
            { 
              header: 'Date', key: 'Date', width: 13 
            },
            {
              header: 'Search', key: 'Search', width: 22, style: { numFmt: '@' }
            }
          ];

          worksheet.views = [
            { state: 'frozen', ySplit: 1 }
          ];

          worksheet.addRows(rows);

          worksheet.getRow(1).font = { bold: true };
          worksheet.getRow(1).alignment = { horizontal: 'center' };
          worksheet.getCell('A1').alignment = { horizontal: 'right' };

          return dialog.showSaveDialog(
            { defaultPath: 'amazon-data.xlsx' },
            (filename) => {
              if (filename !== undefined) {
                return workbook.xlsx.writeFile(filename)
                  .then(() => event.sender.send('searches-data-exported'))
                  .catch((err) => console.log(err));
              }

              return event.sender.send('searches-data-export-cancelled');
            }
          );
        }
        return event.sender.send('searches-data-export-no-data');
      }).catch(err => {
        console.log(err);
        return event.sender.send('searches-data-exporting-error', err);
      })
      .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('load-failed-items', (event, searchId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('failed-items-loading-error', error);
      const models = ModelsSqlite(sequelize);

      return new Promise((resolve, reject) => {
        models.sequelize.query("SELECT AM_JO.id, AM_CH.name channel, isbn_asin, status, AM_SE.is_asin, status_code, AM_SE.id search_id search FROM amazon_search_jobs AS AM_JO \n" + 
        "LEFT JOIN amazon_searches AS AM_SE ON AM_SE.id = AM_JO.amazon_search_id \n" + 
        "LEFT JOIN amazon_channels AS AM_CH ON AM_CH.id = AM_JO.amazon_channel_id \n" + 
        "WHERE AM_JO.amazon_search_id = ? AND status = 0", { replacement: { searchId }, type: sequelize.QueryTypes.SELECT })
        .then(jobs => {
          resolve(jobs);
        })
        .then(jobs => {
          const items = jobs.map(job => ({
            isbn_asin: job.isbn_asin,
            channel_name: job.channel,
            search_id: job.search_id.toString(),
            key: job.id.toString(),
            status_code: job.status_code
          }));

          return event.sender.send('failed-items-loaded', items);
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('failed-items-loading-error', err);
        })
        .then(() => models.sequelize.close());
      });
    });
  });

  ipcMain.on('restart-failed-items', (event, searchId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('failed-items-loading-error', error);
      const models = ModelsSqlite(sequelize);

      return models.AmazonSearchJob.update(
        { status: 1, status_code: '' },
        { where: { amazon_search_id: searchId, status: 0 } }
      )
      .catch( err => event.sender.send('failed-items-restarting-error', err) )
      .then(() => {
        event.sender.send('failed-items-restarted');

        return new Promise((resolve, reject) => {
          models.sequelize.query("SELECT A.id id, name, is_asin, searched_count, searched_at, isbn_asin, search_item_length, status_queued + status_finished + status_failed search_job_length, status_queued, status_finished, status_failed, created_at, channel FROM \n" + 
          "(SELECT AM_SCH.amazon_search_id id, AM_CH.name channel FROM amazon_channels AS AM_CH \n" + 
          "LEFT JOIN amazon_search_channels AS AM_SCH ON AM_CH.id = AM_SCH.amazon_channel_id \n" + 
          "WHERE AM_SCH.amazon_search_id = :search_id) AS B \n" + 
          "LEFT JOIN \n" + 
          "(SELECT id, name, is_asin, searched_count, searched_at, isbn_asin, search_item_length, status_queued, status_finished, status_failed, created_at FROM \n" +  
          "(SELECT AM_SE.id, AM_SE.name, AM_SE.is_asin, AM_SE.searched_count, AM_SE.searched_at, AM_SIT.isbn_asin, COUNT(isbn_asin) search_item_length, status_queued, status_finished, status_failed, AM_SE.created_at FROM amazon_searches AS AM_SE \n" + 
          "LEFT JOIN amazon_search_items AS AM_SIT ON AM_SE.id = AM_SIT.amazon_search_id \n" + 
          "LEFT JOIN \n" + 
          "(SELECT AM_SE.id, COUNT(AM_SJO.status) status_queued, 0 status_finished, 0 status_failed FROM amazon_searches AS AM_SE \n" + 
          "LEFT JOIN amazon_search_jobs AS AM_SJO ON AM_SJO.amazon_search_id = AM_SE.id \n" + 
          "WHERE AM_SJO.status = 0 \n" + 
          "UNION \n" + 
          "SELECT AM_SE.id, 0 status_queued, COUNT(AM_SJO.status) status_finished, 0 status_failed FROM amazon_searches AS AM_SE \n" + 
          "LEFT JOIN amazon_search_jobs AS AM_SJO ON AM_SJO.amazon_search_id = AM_SE.id \n" + 
          "WHERE AM_SJO.status = 1 \n" + 
          "UNION \n" + 
          "SELECT AM_SE.id, 0 status_queued, 0 status_finished, COUNT(AM_SJO.status) status_failed FROM amazon_searches AS AM_SE \n" + 
          "LEFT JOIN amazon_search_jobs AS AM_SJO ON AM_SJO.amazon_search_id = AM_SE.id \n" + 
          "WHERE AM_SJO.status = 2) AS AM_SJO ON AM_SE.id = AM_SJO.id \n" + 
          "WHERE AM_SE.id = :search_id) AS AM_SJO_SE) AS A ON A.id = B.id", { replacements: { search_id: searchId }, type: sequelize.QueryTypes.SELECT })
          .then(data => {
            resolve(data);
          })
        });
      })
      .then(updatedSearch => {
        const uniqueSearchItems = {};

        updatedSearch.search_items.forEach(item => {
          uniqueSearchItems[item.isbn_asin] = true;
        });
        return event.sender.send('search-started', {
          key: updatedSearch.id.toString(), 
          id: updatedSearch.id.toString(), 
          name: updatedSearch.name,
          channels: updatedSearch.channels.map(channel =>
            ({ id: channel._id.toString(), name: channel.name })),
          type: updatedSearch.is_asin ? 'ASINs' : 'ISBNs',
          total: updatedSearch.search_items_length,
          duplicates: updatedSearch.search_items_length - Object.keys(uniqueSearchItems).length,
          queued: updatedSearch.search_job_length,
          inQueue: updatedSearch.status_queued,
          finished: updatedSearch.status_finished,
          failed: updatedSearch.status_failed,
          createdAt: updatedSearch.created_at,
          searchedAt: updatedSearch.searched_at,
          searchedCount: updatedSearch.searched_count
        });
      })
      .catch(err => {
        console.log(err);
        return event.sender.send('failed-items-loading-error', err);
      })
      .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('load-ebay-data-table', (event, options, type) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-data-table-loading-error', error);
      const models = ModelsSqlite(sequelize);
      const page = options.current > 0 ? options.current - 1 : 0;
      let order = { created_at: -1 };
      let findQuery = {};
      const start = moment(new Date());

      if (type === 'Fake') {
        findQuery.is_fake = true;
      } else if (type === 'Spam') {
        findQuery.is_spam = true;
      } else if (type === 'No image') {
        findQuery['image.contentType'] = null;
      } else {
        findQuery.book = null;
        findQuery.is_fake = { $in: [false, null] };
        findQuery.is_spam = { $in: [false, null] };
        findQuery['image.contentType'] = { $ne: null };
      }

      if (options.filterTitle !== '') {
        findQuery.$text = { $search: `${options.filterTitle}` };
      }

      if (options.filterSellerName !== '') {
        findQuery.seller_name = new RegExp(options.filterSellerName, 'i');
      }

      if (options.sortField !== '' && options.sortOrder !== '') {
        let orderSymbol = -1;

        if (options.sortOrder === 'descend') {
          orderSymbol = -1;
        } else if (options.sortOrder === 'ascend') {
          orderSymbol = 1;
        }

        if (options.sortField === 'cover') {
          order = { 'image.contentType': orderSymbol };
        } else if (options.sortField === 'price') {
          order = { price: orderSymbol };
        } else if (options.sortField === 'title') {
          order = { title: orderSymbol };
        } else if (options.sortField === 'channel') {
          order = { channel: orderSymbol };
        } else if (options.sortField === 'category') {
          order = { category: orderSymbol };
        } else if (options.sortField === 'seller_name') {
          order = { seller_name: orderSymbol };
        }
      }

      return new Promise((resolve, reject) => {
        models.EbayChannel.findAll().then(channels => {
          const data = { channels: channels };
          resolve(data);
        })
      })
      .then(data => new Promise((resolve, reject) => {
        models.EbayCategory.findAll().then(categories => {
          data.category = { category: categories };
          resolve(data);
        })
      }))
      .then(prepared => new Promise((resolve, reject) => {
        if (options.filterCategory !== '') {
          findQuery = {
            ...findQuery,
            category: prepared.categories.filter(item => 
              item.ebay_id === options.filterCategory)[0]._id
          };
        }
        if (options.filterCategory !== '') {
          findQuery = {
            ...findQuery,
            channel: prepared.channels.filter(item => 
              item.name === options.filterCategory)[0]._id
          };
        }
        console.log("findQuery = ", findQuery);

        const dbName = 'bibliotrack';
        return new Promise((resolve, reject) => {
          if (nativeClient === null) {
            reject(new Error('No connection'));
          } else {
            const db = nativeClient.db(dbName);
            const collection = db.collection('ebay_data_completed');

            collection.find(findQuery)
              .sort(order)
              .skip(options.pageSize * page)
              .limit(options.pageSize)
              .toArray((e, docs) => {
                if (e) reject(e);
                else {
                  resolve(docs);
                }
              });
          }
        })
        .then(docs => {
          docs.forEach((item, index, array) => {
            array[index].channel = {
              _id: item.channel,
              name: prepared.channels.filter(i =>
                i._id.toString() === item.channel.toString())[0].name
            };

            array[index].category = {
              _id: item.category,
              name: prepared.categories.filter(i =>
                i._id.toString() === item.category.toString())[0].name
            };
          });

          return docs;
        })
        .then(docs => {
          const preparedData = docs.map(item => ({
            // eslint-disable-next-line no-underscore-dangle
            key: item._id.toString(),
            ebay_id: item.ebay_id,
            search_keyword: item.search_keyword,
            title: item.title,
            currency_code: item.currency_code,
            price: parseFloat(item.price.toString()).toFixed(2),
            listing_type: item.listing_type,
            seller_name: item.seller_name,
            seller_feedback: item.seller_feedback,
            channel: item.channel.name,
            category: item.category.name,
            cover: item.image.data === null ? null : item.image.data.toString(),
            image_url: item.image.url,
            image_type: item.image.contentType,
            view_url: item.view_url
          }));
          const docsEnd = moment(new Date());
          console.log('Docs fetched: ' + docsEnd.diff(start, 'ms') + 'ms');

          const db = nativeClient.db(dbName);
          const collection = db.collection('ebay_data_completed');

          return new Promise((resolve, reject) => {
            if (type === 'Default') {
              const firstQuery = {...findQuery};
              const secondQuery = {...findQuery};

              firstQuery.is_fake = null;
              firstQuery.is_spam = null;

              secondQuery.is_fake = false;
              secondQuery.is_spam = false;

              console.log(firstQuery);
              console.log(secondQuery);

              collection.find(firstQuery)
              .count((e, count) => {
                if (e) reject(e);
                else {
                  collection.find(secondQuery)
                  .count((e_, c) => {
                    if (e_) reject(e_);
                    else {
                      resolve(count + c);
                    }
                  });
                }
              });
            } else {
              collection.find(findQuery)
              .count((e, count) => {
                if (e) reject(e);
                else {
                  resolve(count);
                }
              });
            }
          })
          .then(count => new Promise((resolve, reject) => {
            return models.EbaySearchJob.findAll({ where: { status: 'Queued' } })
            .then(jobs => {
              const countEnd = moment(new Date());
              console.log('Count fetched: ' + countEnd.diff(start, 'ms') + 'ms');

              resolve(event.sender.send(
                'ebay-data-table-loaded',
                preparedData,
                {
                  pageSize: options.pageSize,
                  current: options.current,
                  total: count,
                  sortField: options.sortField,
                  sortOrder: options.sortOrder,
                  filterChannel: options.filterChannel,
                  filterCategory: options.filterCategory,
                  filterSellerName: options.filterSellerName,
                  filterTitle: options.filterTitle
                },
                jobs.length > 0
              ));
            })
          }))
        })
      }))
      .catch(err => console.log(err))
      .then(() => models.sequelize.close())
      .then(() => (nativeClient !== null ? nativeClient.close() : null));
    });
  });

  ipcMain.on('load-ebay-searches-table', (event) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-searches-table-loading-error', error);
        const models = ModelsSqlite(sequelize);

        models.EbaySearch.findAll({
          include: [{ model: models.EbaySearchJob }, 
                    { model: models.EbayCategory, as: 'EbaySearchCategories' }, 
                    { model: models.EbayChannel, as: 'EbaySearchChannels' }]
        })
        .then(searches => {
          const preparedSearches = [];

          searches.forEach(search => {
            const prepared = {
              key: search.id.toString(),
              id: search.id.toString(),
              isActive: search.is_active,
              keywords: search.keywords,
              type: search.type,
              searchPeriod: search.search_period,
              useExtendedInitial: search.use_extended_initial,
              useSmartStop: search.use_smart_stop,
              // minPrice: search.ebay_search_job.min_price !== null
              //   ? parseFloat(search.ebay_search_job.min_price.toString())
              //   : null,
              // maxPrice: search.ebay_search_job.max_price !== null
              //   ? parseFloat(search.ebay_search_job.max_price.toString())
              //   : null,
              categories: search.EbaySearchCategories.map(category =>
                ({
                  id: category.id.toString(),
                  name: category.name,
                  ebay_id: category.ebay_id
                })),
              channels: search.EbaySearchChannels.map(channel =>
                ({ 
                  id: channel.id.toString(), 
                  name: channel.name 
                })),
              lastSearch: search.last_search_date === null
                ? ''
                : moment(new Date(search.last_search_date)).format('hh:mm MM/DD/YYYY'),
              resultsFetched: search.total_results_fetched,
              duplicatesFetched: search.total_duplicates_fetched
            };
//            const jobs = search.ebay_search_job.map(job => job.status);
            const jobs = [];
            if (search.ebay_search_job !== null) 
              jobs.push('job', search.ebay_search_job.status);
            else
              jobs.push('job', null);

            if (prepared.categories.length > 0
              && prepared.channels.length > 0
              && jobs.length > 0
              && jobs.includes('Queued')) {
              prepared.status = 'Searching';
            } else if (prepared.isActive) {
              prepared.status = 'Waiting';
            } else {
              prepared.status = 'Disabled';
            }

            preparedSearches.push(prepared);
          });

          return preparedSearches;
        })
        .then(prepared => new Promise((resolve, reject) => {
          models.EbayDataCompleted.count().then(count => {
              resolve(event.sender.send('ebay-searches-table-loaded', prepared, count));
            })
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-searches-table-loading-error', err);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('add-ebay-search', (event, search) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-search-adding-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.EbaySearch.create({
            type: search.type,
            is_active: search.isActive,
            keywords: search.keywords,
            search_period: search.searchPeriod,
            use_smart_stop: search.useSmartStop,
            use_extended_initial: search.useExtendedInitial,
            min_price: search.minPrice !== '' ? search.minPrice : null,
            max_price: search.maxPrice !== '' ? search.maxPrice : null
          }).then(ebaysearch => new Promise((resolve, reject) => {
            const search_id = { id: ebaysearch.get({ plain: true}).id };
            resolve(search_id);
          }))
          .then(data => new Promise((resolve, reject) => {
            models.EbayChannel.findAll().then(channels => {
              const toAdd = [];
              data.channel = { channel: channels.filter(item => search.channels.includes(item.name)).map(item => item.id)};
              data.channel.channel.forEach( channel => {
                toAdd.push({ 
                  ebay_search_id: data.id,
                  ebay_channel_id: channel 
                })
              });
              models.EbaySearchChannel.bulkCreate(toAdd).then(channels => {
                resolve(data);
              })
            })
          }))
          .then(data => new Promise((resolve, reject) => {
            models.EbayCategory.findAll().then(categories => {
              const toAdd = [];
              data.category = { category: categories.filter(item => search.categories.includes(item.ebay_id)).map(item => item.id)};
              data.category.category.forEach( category => {
                toAdd.push({ 
                  ebay_search_id: data.id,
                  ebay_category_id: category 
                })
              });
              models.EbaySearchCategory.bulkCreate(toAdd).then(categories => {
                resolve(event.sender.send('ebay-search-added'));
              })
            })
          }))
          .then(() => (search.isActive === true ? ebayScheduler.emit('run', event) : null))
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-search-adding-error', err);
          })
          .then(() => models.sequelize.close());
        })
      });
    });

  ipcMain.on('update-ebay-search', (event, search) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-search-adding-error', error);
        const models = ModelsSqlite(sequelize);

        models.EbaySearch.update({
          is_active: search.isActive,
          keywords: search.keywords,
          search_period: search.searchPeriod ? parseInt(search.searchPeriod, 10) : 0,
          use_smart_stop: search.useSmartStop,
          use_extended_initial: search.useExtendedInitial,
          is_initial: true,
          searched_at: null
        }, { where: { id: search.id } });

        return new Promise((resolve, reject) => {
          models.EbayCategory.findAll().then(categories => {
            const newCategoryId = categories
            .filter(item => search.categories.includes(item.ebay_id))
            .map(item => item.id);

            models.EbaySearchCategory.destroy({ where: { ebay_search_id: search.id } });
            const toAdd = [];
            newCategoryId.forEach(CategoryId => {
              toAdd.push({ 
                ebay_search_id: search.id,  
                ebay_category_id: CategoryId });
            })

            models.EbaySearchCategory.bulkCreate(toAdd).then(categories => {
              resolve(categories);
            })
          })
        })
        .then(data => new Promise((resolve, reject) => {
          models.EbayChannel.findAll().then(channels => {
            const newChannelId = channels
            .filter(item => search.channels.includes(item.ebay_id))
            .map(item => item.id);

            models.EbaySearchChannel.destroy({ where: { ebay_search_id: search.id } });
            const toAdd = [];
            newChannelId.forEach(newChannelId => {
              toAdd.push({ 
                ebay_search_id: search.id,  
                ebay_channel_id: newChannelId });
            })

            models.EbaySearchChannel.bulkCreate(toAdd).then(channels => {
              resolve(channels);
            })
          })
        }))
        .then(data => {
          resolve(models.EbaySearchJob.destroy({ where: { ebay_search_id: searchId } }));
        })
        .then(() => event.sender.send('ebay-search-updated'))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-search-updating-error', err);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('save-ebay-search', (event, search) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-search-adding-error', error);
        const models = ModelsSqlite(sequelize);

        models.EbaySearch.update({
          is_active: search.isActive,
          keywords: search.keywords,
          search_period: search.searchPeriod ? parseInt(search.searchPeriod, 10) : 0,
          use_smart_stop: search.useSmartStop,
          use_extended_initial: search.useExtendedInitial,
        }, { where: { id: search.id } });

        return new Promise((resolve, reject) => {
          models.EbayCategory.findAll().then(categories => {
            const newCategoryId = categories
            .filter(item => search.categories.includes(item.ebay_id))
            .map(item => item.id);

            models.EbaySearchCategory.destroy({ where: { ebay_search_id: search.id } });
            const toAdd = [];
            newCategoryId.forEach(CategoryId => {
              toAdd.push({ 
                ebay_search_id: search.id,  
                ebay_category_id: CategoryId });
            })

            models.EbaySearchCategory.bulkCreate(toAdd).then(categories => {
              resolve(categories);
            })
          })
        })
        .then(data => new Promise((resolve, reject) => {
          models.EbayChannel.findAll().then(channels => {
            const newChannelId = channels
            .filter(item => search.channels.includes(item.ebay_id))
            .map(item => item.id);

            models.EbaySearchChannel.destroy({ where: { ebay_search_id: search.id } });
            const toAdd = [];
            newChannelId.forEach(newChannelId => {
              toAdd.push({ 
                ebay_search_id: search.id,  
                ebay_channel_id: newChannelId });
            })

            models.EbaySearchChannel.bulkCreate(toAdd).then(channels => {
              resolve(channels);
            })
          })
        }))
        .then(data => {
          if (search.isActive === false) {
            resolve(models.EbaySearchJob.update(
              { status: 'Waiting' }, 
              { where: { ebay_search_id: search.id, status: 'Queued' } },
            ));
          } else {
            resolve(models.EbaySearchJob.update(
              { status: 'Queued' }, 
              { where: { ebay_search_id: search.id, status: 'Waiting' } },
            ));
          }
        })
        .then(() => {
          if (search.isActive === true) {
            ebayScheduler.emit('start-handler', event);
          }

          return null;
        })
        .then(() => event.sender.send('ebay-search-saved'))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-search-saving-error', err);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('delete-ebay-search', (event, searchId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-search-deleting-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.EbaySearch.destroy({ where: { id: searchId } });
          resolve(models.EbaySearchJob.destroy({ where: { ebay_search_id: searchId } }));
        })
        .then(() => event.sender.send('ebay-search-deleted'))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-search-deleting-error', err);
        }).then(() => models.sequelize.close());
    });
  });

  ipcMain.on('ebay-resave-cover', (event, id, imageURL) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-cover-resaving-error', error);
        const models = ModelsSqlite(sequelize);
        let imgUrl = imageURL;
        let data = {};

        return new Promise((resolve, reject) => {
          models.EbayDataCompleted.findOne({ where: { id: id },
            include: [{ model: models.Image }] })
          .then(itemData => {
            data = itemData;
            imgUrl = typeof imgUrl === 'string' ? imgUrl : data.image.url;
            return imageRequestPromise(imgUrl);
          })
        })
        .then(res => new Promise((resolve, reject) => {
          if (res.is_fake === true) {
            resolve(imageRequestPromise(imgUrl));
          } else {
            resolve(res);
          }
        }))
        .then(res => new Promise((resolve, reject) => {
          if (res.is_fake === true) {
            resolve({
              data: data.image.data, 
              url: imgUrl
            });
          } else {
            resolve(res);
          }
        }))
        .then(res => new Promise((resolve, reject) => {
          models.EbayDataCompleted.update(
            { $set: { image: res }},
            { where: { id: id } }
          );

          event.sender.send('ebay-cover-resaved', { id, image: res });
          resolve(null);
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-cover-resaving-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('load-books', (event) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
        sequelize) => {
        if (error) event.sender.send('books-loading-error', error);
        else {
            const models = ModelsSqlite(sequelize);

            return models.sequelize.query("SELECT B.id, B.title, B.year, BA.author, BL.name language, BP.name publisher, BI.value identifier FROM books AS B \n" + 
            "LEFT JOIN ( \n" + 
                "SELECT BSAS.book_id id, BAS.name author FROM books_authors AS BSAS \n" + 
                "LEFT JOIN book_authors AS BAS ON BAS.id = BSAS.book_author_id \n" + 
            ") AS BA ON BA.id = B.id \n" + 
            "LEFT JOIN book_languages AS BL ON B.book_language_id = BL.id \n" + 
            "LEFT JOIN book_publishers AS BP ON B.book_publisher_id = BP.id \n" + 
            "LEFT JOIN book_identifiers AS BI ON B.book_identifier_id = BI.id \n" + 
            "GROUP BY B.id, B.title", { type: sequelize.QueryTypes.SELECT })
            .then( books => new Promise((resolve, reject) => {
                const parsed = books.map(book => ({
                    key: book.id,
                    id: book.id,
                    title: book.title,
                    year: book.year, 
                    language: book.language,
                    author: book.author,
                    publisher: book.publisher,
                    identifier: book.identifier
                }));
                return event.sender.send('books-loaded', parsed);
            }))
            .catch(err => {
                console.log(err);
                return event.sender.send('books-loading-error', error);
            })
            .then(() => models.sequelize.close());
        }
    });
});

ipcMain.on('add-book', (event, data) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
        sequelize) => {
        if (error) event.sender.send('book-adding-error', error);
        else {
            const models = ModelsSqlite(sequelize);

            const additionalAuthors = [];
            const additionalISBNs13 = [];

            const Op = Sequelize.Op;

            Object.keys(data).map(key => {
                if (key.substring(0, key.length - 1) === 'author_') {
                    let value = data[key];

                    if (value !== null && value !== '') {
                        additionalAuthors.push(value);
                    }
                }
            });

            Object.keys(data).map(key => {
                if (key.substring(0, key.length - 1) === 'isbn_13_') {
                    let value = data[key];

                    if (value !== null && value !== '') {
                    additionalISBNs13.push({type: 'ISBN_13', serial_number: value});
                    }
                }
            });

            return new Promise((resolve, reject) => {
              models.BookAuthor.findOne({ where: { name: data.author || null } })
              .then(author => {
                models.BookPublisher.findOne({ where: { name: data.publisher || null } })
                .then(publisher => {
                  models.BookLanguage.findOne({ where: { name: data.language || null } })
                  .then(language => {
                    models.BookAuthor.findAll({ where: { name: { [Op.in]: additionalAuthors } } })
                    .then(authors => {
                      resolve({ author, publisher, language, authors });
                    })
                  })
                })
              })
            })
            .then(matched => new Promise((resolve, reject) => {
              if (data.author !== '' && (matched.author === null || matched.author === undefined)) {
                const author = new models.BookAuthor({ name: data.author });

                author.save().then(saved => {
                  matched.author = { id: saved.id };
                  resolve(matched);
                });
              } else {
                resolve(matched);
              }
            }))
            .then(matched => new Promise((resolve, reject) => {
              if (additionalAuthors.length !== 0 && matched.authors.length < additionalAuthors.length) {
                const toAdd = [];
                const simpleMatched = matched.authors.map(itm => itm.name);

                additionalAuthors.forEach(author => {
                  if (!simpleMatched.includes(author)) {
                    toAdd.push({ name: author });
                  }
                });

                models.BookAuthor.bulkCreate(toAdd).then(docs => {
                  matched.authors = [...matched.authors, ...docs];
                  resolve(matched);
                })
              } else {
                resolve(matched);
              }
            }))
            .then(matched => new Promise((resolve, reject) => {
              if (data.publisher !== '' && (matched.publisher === null || matched.publisher === undefined)) {
                const publisher = new models.BookPublisher({ name: data.publisher });
    
                publisher.save().then(saved => {
                  matched.publisher = { id: saved.id };
                  resolve(matched);
                });
              } else {
                resolve(matched);
              }
            }))
            .then(matched => new Promise((resolve, reject) => {
              const prepared = {
                title: data.title,
                language: data.language === '' ? null : matched.language.id,
                author: data.author === '' ? null : matched.author.id,
                year: data.year === '' ? null : data.year,
                publisher: data.publisher === '' ? null : matched.publisher.id,
                isbn_10: data.isbn_10 === '' ? null : data.isbn_10,
                isbn_13: data.isbn_13 === '' ? null : data.isbn_13,
                asin: data.asin === '' ? null : data.asin,
                series: data.series === '' ? null : data.series,
                series_number: data.seriesNumber === '' ? null : data.seriesNumber,
                cover: data.cover === ''
                  ? { contentType: null, data: null }
                  : { contentType: data.cover.split(';').shift(), data: data.cover.split(';').pop() },
                notes: data.notes === '' ? null : data.notes,
                cover_price: data.coverPrice === '' ? null : data.coverPrice,
                ebay_keywords: [],
                amazon_data: [],
                ebay_data_completed_approved: [],
                ebay_data_completed_rejected: [],
                ebay_data_completed_pending: [],
                additional_authors: additionalAuthors.length === 0
                  ? []
                  : matched.authors.map(item => item.id),
                additional_serial_numbers: additionalISBNs13
              };
  
              const newBook = new models.Book(prepared);
              newBook.save().then(saved => {
                // ----- insert values into 'books_authors' -----
                const upAdd = [];
                upAdd.push({
                  book_id: saved.id, 
                  book_author_id: matched.author.id
                });
                matched.authors.forEach((author, index) => {
                  upAdd.push({ 
                    book_id: saved.id, 
                    book_author_id: matched.authors[index].id
                  });
                });
                models.BookAuthors.bulkCreate(upAdd)
                .then(authors => {
                    resolve(event.sender.send('book-added'));
                  }
                );
                // -----------------------------------------------

                // resolve(event.sender.send('book-added'));
              });
            }))
            .catch(err => {
              console.log(err);
              return event.sender.send('book-adding-error', error);
            })
            .then(() => models.sequelize.close());
        }
    });
});

  ipcMain.on('update-book', (event, newValues) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-updating-error', error);
      else {
          const models = ModelsSqlite(sequelize);

          const Op = Sequelize.Op;

          const additionalAuthors = [];
          const additionalISBNs13 = [];

          Object.keys(data).map(key => {
              if (key.substring(0, key.length - 1) === 'author_') {
                  let value = data[key];

                  if (value !== null && value !== '') {
                      additionalAuthors.push(value);
                  }
              }
          });

          Object.keys(data).map(key => {
              if (key.substring(0, key.length - 1) === 'isbn_13_') {
                  let value = data[key];

                  if (value !== null && value !== '') {
                  additionalISBNs13.push({type: 'ISBN_13', serial_number: value});
                  }
              }
          });

          return new Promise((resolve, reject) => {
            models.BookAuthor.findOne({ where: { name: newValues.author || null } })
            .then(author => {
              models.BookPublisher.findOne({ where: { name: newValues.publisher || null } })
              .then(publisher => {
                models.BookLanguage.findOne({ where: { name: newValues.language || null } })
                .then(language => {
                  models.BookAuthor.findAll({ where: { name: { [Op.in]: additionalAuthors } } })
                  .then(authors => {
                    resolve({ author, publisher, language, authors });
                  })
                })
              })
            })
          })
          .then(matched => new Promise((resolve, reject) => {
            if (newValues.author !== '' && (matched.author === null || matched.author === undefined)) {
              const author = new models.BookAuthor({ name: newValues.author });

              author.save().then(saved => {
                matched.author = { id: saved.id };
                resolve(matched);
              });
            } else {
              resolve(matched);
            }
          }))
          .then(matched => new Promise((resolve, reject) => {
            if (additionalAuthors.length !== 0 && matched.authors.length < additionalAuthors.length) {
              const toAdd = [];
              const simpleMatched = matched.authors.map(itm => itm.name);

              additionalAuthors.forEach(author => {
                if (!simpleMatched.includes(author)) {
                  toAdd.push({ name: author });
                }
              });

              models.BookAuthor.bulkCreate(toAdd).then(docs => {
                matched.authors = [...matched.authors, ...docs];
                resolve(matched);
              })
            } else {
              resolve(matched);
            }
          }))
          .then(matched => new Promise((resolve, reject) => {
            if (newValues.publisher !== '' && (matched.publisher === null || matched.publisher === undefined)) {
              const publisher = new models.BookPublisher({ name: newValues.publisher });
  
              publisher.save().then(saved => {
                matched.publisher = { id: saved.id };
                resolve(matched);
              });
            } else {
              resolve(matched);
            }
          }))
          .then(matched => new Promise((resolve, reject) => {
            models.Book.findOne({ where: { id: newValues.id } })
            .then(book => {
              resolve({ book, matched, 
                old: { authorId: book.author, publisherId: book.publisher, authors: book.additional_authors } });
            });
          }))
          .then(data => new Promise((resolve, reject) => {
            data.book.title = newValues.title;
            data.book.language = newValues.language === '' ? null : data.matched.language.id;
            data.book.author = newValues.author === '' ? null : data.matched.author.id;
            data.book.year = newValues.year === '' ? null : newValues.year;
            data.book.publisher = newValues.publisher === '' ? null : data.matched.publisher.id;
            data.book.isbn_10 = newValues.isbn_10 === '' ? null : newValues.isbn_10;
            data.book.isbn_13 = newValues.isbn_13 === '' ? null : newValues.isbn_13;
            data.book.asin = newValues.asin === '' ? null : newValues.asin;
            data.book.series = newValues.series === '' ? null : newValues.series;
            data.book.series_number = newValues.seriesNumber === '' ? null : newValues.seriesNumber;
            data.book.cover = newValues.cover === ''
              ? { contentType: null, data: null }
              : { contentType: newValues.cover.split(';').shift(), data: newValues.cover.split(';').pop() };
            data.book.notes = newValues.notes === '' ? null : newValues.notes;
            data.book.cover_price = newValues.coverPrice === '' ? null : newValues.coverPrice;
            data.book.additional_authors = additionalAuthors.length === 0
              ? []
              : data.matched.authors.map(item => item._id);
            data.book.additional_serial_numbers = additionalISBNs13;

            data.book.save().then(b => {
              // ----- insert values into 'books_authors' -----
              const upAdd = [];
              upAdd.push({
                book_id: b.id, 
                book_author_id: data.matched.author.id
              });
              matched.authors.forEach((author, index) => {
                upAdd.push({ 
                  book_id: saved.id, 
                  book_author_id: data.matched.authors[index].id
                });
              });
              models.BookAuthors.bulkCreate(upAdd)
              .then(authors => {
                  event.sender.send('book-updated', {
                    id: b.id.toString(),
                    key: b.id.toString(),
                    title: b.title,
                    language: newValues.language,
                    author: newValues.author,
                    year: b.year,
                    publisher: newValues.publisher,
                    isbn_10: newValues.isbn_10,
                    isbn_13: newValues.isbn_13,
                    asin: newValues.asin,
                    series: newValues.series,
                    series_number: newValues.seriesNumber,
                    cover: newValues.cover,
                    notes: newValues.notes,
                    cover_price: newValues.coverPrice,
                    avg_price: b.avg_price !== null ? b.avg_price.toString() : null,
                    min_price: b.min_price !== null ? b.min_price.toString() : null,
                    max_price: b.max_price !== null ? b.max_price.toString() : null,
                    additional_authors_count: b.additional_authors.length,
                    additional_authors: additionalAuthors,
                    additional_serial_numbers_count: b.additional_serial_numbers.length,
                    additional_serial_numbers: additionalISBNs13.map(itm => itm.serial_number)
                  });
                    resolve(data);
              });
              // -----------------------------------------------
            });
          }))
          .then(data => {
            return models.Book.count({ where: { author: data.old.authorId } })
            .then(count => new Promise((resolve, reject) => {
              resolve(count);
            }))
            .then(count => {
              if (count === 0) {
                return models.BookAuthor.destroy({ where: { id: data.old.authorId } })
                .then(() => data)
              }

              return data;
            });
          })
          .then(data => {
            return models.Book.count({ publisher: data.old.publisherId })
            .then(count => new Promise((resolve, reject) => {
              resolve(count);
            }))
            .then(count => {
              if (count === 0) {
                return models.BookPublisher.destroy({ where: { id: data.old.publisherId } })
                .then(() => data)
              }

              return data;
            })
          })
          .then(data => {
            const getDataPromises = [];
            const deletePromises = [];

            data.old.authors.forEach(item => {
              getDataPromises.push(new Promise((resolve) => {
                models.Book.count({ where: { [Op.or]: [{ author: item }, { additional_authors: item }] } })
                .then(count => {
                  resolve(count);
                });
              }));
            });

            return Promise.all(getDataPromises).then(authorsCount => {
              authorsCount.forEach((count, index) => {
                if (count === 0) {
                  deletePromises.push(new Promise((resovle) => {
                    models.BookAuthor.destroy({ where: { id: data.old.authors[index] } });
                    resolve(true);
                  }));
                }
              });

              return Promise.all(deletePromises);
            });
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('book-updating-error', error);
          })
          .then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('update-book-keyword', (event, keywordId, newData) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-updating-error', error);
      else {
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.EbayChannel.findAll().then(channels => {
            const data = { channels: channels };
            resolve(data);
          });
        })
        .then(data => new Promise((resolve, reject) => {
          models.EbayCategory.findAll().then(categories => {
            data.categories = { categories: categories };
            resolve(data);
          })
        }))
        .then(data => new Promise((resolve, reject) => {
          models.BookEbayKeyword.findOne({ where: { id: keywordId }})
          .then(keyword => {
            // keyword.is_shared = newData.isShared;
            keyword.keyword = newData.keyword;
            keyword.min_price = newData.minPrice;
            keyword.max_price = newData.maxPrice;
            keyword.channels = data.channels
            .filter(item => newData.channels.includes(item.name))
            .map(item => item._id);
            keyword.categories = data.categories.categories
            .filter(item => newData.categories.includes(item.ebay_id))
            .map(item => item._id);

            keyword.save().then(keyword => {
              event.sender.send('book-keyword-updated', keyword);
            })
          })
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keyword-updating-error', err);
        }).then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('delete-book', (event, id) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-deleting-error', error);
      else {
        const models = ModelsSqlite(sequelize);

        const Op = Sequelize.Op;

        return new Promise((resolve, reject) => {
          models.Book.findById(id)
          .then(book => {
            const keywordIds = book.ebay_keywords;

            models.Book.destroy({ where: { id: id } });
            models.BookEbayKeyword.destroy({ where: { id: { $in: keywordIds } } });
            event.sender.send('book-deleted', id);
            resolve(book);
          });
        })
        .then(deletedBook => new Promise((resolve, reject) => {
          models.Book.find({ where: { author: deletedBook.author } })
          .then(booksWithAuthor => {
              models.Book.find({ where: { publisher: deletedBook.publisher } })
              .then(booksWithPublisher => {
                resolve({ deletedBook, booksWithAuthor, booksWithPublisher });
            })
          })
        }))
        .then(data => new Promise((resolve, reject) => {
          if (data.booksWithAuthor.length === 0) {
            models.BookAuthor.destroy({ where: { id: data.deletedBook.author } });
            resolve(data);
          }
        }))
        .then(data => new Promise((resolve, reject) => {
          if (data.booksWithPublisher.length === 0) {
            models.BookPublisher.destroy({ where: { id: data.deletedBook.publisher } });
            resolve(data);
          }
        }))
        .then(data => new Promise((resolve, reject) => {
          return models.EbayDataCompleted.update(
            { book: null },
            { where: { id: { [Op.in]: data.deletedBook.ebay_data_completed_approved } } }
          );
        }))
        .then(data => {
          const getDataPromises = [];
          const deletePromises = [];

          data.deletedBook.additional_authors.forEach(item => {
            getDataPromises.push(new Promise((resolve) => {
              models.Book
              .count({ where: { [Op.or]: [{ author: item }, { additional_authors: item }] } })
              .then(count => {
                resolve(count);
              });
            }));
          });

          return Promise.all(getDataPromises).then(authorsCount => {
            authorsCount.forEach((count, index) => {
              if (count === 0) {
                deletePromises.push(new Promise((resolve) => {
                  models.BookAuthor.destory({ where: { id: data.deletedBook.additional_authors[index] } });
                      resolve(true);
                }));
              }
            });

            return Promise.all(deletePromises);
          });
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('book-deleting-error', error);
        }).then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('load-book-keywords', (event, bookId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-keywords-loading-error', error);
      else {
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.sequelize.query("SELECT ebay_chnel.id, ebay_chnel.name FROM books_ebay_data AS book_ebay \n" + 
          "LEFT JOIN ebay_data_completed AS ebay_data ON ebay_data.id = book_ebay.ebay_data_completed_id \n" + 
          "LEFT JOIN ebay_channels AS ebay_chnel ON ebay_chnel.id = ebay_data.ebay_channel_id \n" + 
          "WHERE book_ebay.book_id = ?", { replacements: { bookId }, type: sequelize.QueryTypes.SELECT })
          .then(channels => {
            const data = { channels: channels }
            resolve(data);
          })
        })
        .then(data => new Promise((resolve, reject) => {
          models.sequelize.query("SELECT ebay_cate.name, ebay_cate.ebay_id FROM books_ebay_data AS book_ebay \n" + 
          "LEFT JOIN ebay_data_completed AS ebay_data ON ebay_data.id = book_ebay.ebay_data_completed_id \n" + 
          "LEFT JOIN ebay_categories AS ebay_cate ON ebay_cate.id = ebay_data.ebay_category_id \n" + 
          "WHERE book_ebay.book_id = ?", { replacements: { bookId }, type: sequelize.QueryTypes.SELECT })
          .then(categories => {
            data.categories = { categories: categories };
            resolve(categories);
          })
        }))
        .then(data => new Promise((resolve, reject) => {
          models.sequelize.query("SELECT BE_KEY.id, keyword, min_price, max_price FROM book_ebay_keywords AS BE_KEY \n" + 
          "LEFT JOIN books_ebay_keywords AS BSE_KEY ON BE_KEY.id = BSE_KEY.book_ebay_keyword_id \n" + 
          "WHERE BSE_KEY.book_id = ?", { replacements: { bookId }, type: sequelize.QueryTypes.SELECT })
          .then(keywords => {
            const parsed = keywords.map(keyword => ({
              id: keyword.id.toString(),
              key: keyword.id.toString(),
              keyword: keyword.keyword, 
              minPrice: keyword.min_price, 
              maxPrice: keyword.max_price, 
              channels: data.channels.map(channel => ({
                key: channel.id.toString(), 
                id: channel.id.toString(), 
                name: channel.name
              })),
              categories: data.categories.categories.map(category => ({
                key: category.id.toString(), 
                id: category.id.toString(), 
                name: category.name, 
                ebay_id: category.ebay_id
              }))
            }));

            return event.sender.send('book-keywords-loaded', parsed);
          })
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keywords-loading-error', error);
        })
        .then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('add-book-keyword', (event, bookId, newData) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-keyword-adding-error', error);
      else {
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.EbayChannel.findAll().then(channels => new Promise((resolve, reject) => {
            const data = { channels: channels };
            resolve(data);
          }))
          .then(data => {
            models.EbayCategory.findAll().then(categories => {
              data.categories = { categories: categories };
              resolve(data);
            })
          })
        })
        .then(data => new Promise((resolve, reject) => {
          const prepared = {
            is_shared: newData.isShared || false,
            keyword: newData.keyword,
            min_price: newData.minPrice,
            max_price: newData.maxPrice,
            channels: data.channels
              .filter(item => newData.channels.includes(item.name))
              .map(item => item.id),
            categories: data.categories.categories
              .filter(item => newData.categories.includes(item.ebay_id))
              .map(item => item.id)
          };
  
          const newBookKeyword = new models.BookEbayKeyword(prepared);
          newBookKeyword.save().then(newKeyword => {
            models.Book.findAll({ where: { id: bookId }}).then(book => {
              book.ebay_keywords.push(newBookKeyword.id);
              book.save().then(newbook => {
                resolve(event.sender.send('book-keyword-added', {
                  id: newBookKeyword.id.toString(),
                  key: newBookKeyword.id.toString(),
                  isShared: newBookKeyword.is_shared,
                  keyword: newData.keyword,
                  minPrice: newData.minPrice || null,
                  maxPrice: newData.maxPrice || null,
                  channels: data.channels
                    .filter(item => newData.channels.includes(item.name))
                    .map(item => ({
                      key: item.id.toString(),
                      id: item.id.toString(),
                      name: item.name,
                    })),
                  categories: data.categories
                    .filter(item => newData.categories.includes(item.ebay_id))
                    .map(item => ({
                      key: item.id.toString(),
                      id: item.id.toString(),
                      name: item.name,
                      ebay_id: item.ebay_id
                    }))
                }));
              })
            })
          })
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keyword-adding-error', err);
        })
        .then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('delete-book-keyword', (event, id, bookId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-keyword-deleting-error', error);
      else {
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.Book.findAll({ where: { id: bookId }}).then(book => {
            models.BookEbayKeyword.destroy({ where: { id: id }});
            resolve(book);
          });
        })
        .then(book => new Promise((resolve, reject) => {
          book.ebay_keywords = book.ebay_keywords.filter((item) => item.toString() !== id);

          book.save().then(newbook => {
            resolve(event.sender.send('book-keyword-deleted', id));
          });
        }))
        .then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('fix-ebay-approved-items', (event) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-keyword-deleting-error', error);
      else {
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.Book.findAll({
            include: [ models.EbayDataCompleted ]
          }).then(data => new Promise((resolve, reject) => {
            resolve(data);
          }))
        })
        .then(books => {
          let promises = [];

          books.forEach(book => {
            book.booksEbayData.forEach(item => {
              if (item.book === null) {
                promises.push(new Promise((resolve, reject) => {
                  item.book = book.id;

                  item.save().then(newItem => {
                    resolve(true);
                  });
                }));
              }
            });
          });

          return Promise.all(promises).then(() => event.sender.send('ebay-approved-items-fixed'));
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('book-ebay-data-loading-error', error);
        })
        .then(() => models.sequelize.close());
      }
    });
  });

  ipcMain.on('load-book-ebay-data', (event, bookId, selectedType, options) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) event.sender.send('book-ebay-data-loading-error', error);
      else if (bookId === null) event.sender.send('book-ebay-data-loading-error', 'Error: No selected bookId');
      else {
        const models = ModelsSqlite(sequelize);
        let type = '';
        const page = options.current > 0 ? options.current - 1 : 0;
        let order = { created_at: -1 };
        let findQuery = {
          is_fake: { $in: [false, null] },
          is_spam: { $in: [false, null] },
          'image.contentType': { $ne: null }
        };
        const dbName = 'bibliotrack';

        if (options.filterTitle !== '') {
          // findQuery.title = { $regex: options.filterTitle, $options: 'i' };
          findQuery.$text = { $search: `${options.filterTitle}` };
        }

        if (options.filterSellerName !== '') {
          // findQuery.seller_name = { $regex: options.filterSellerName, $options: 'i' };
          findQuery.seller_name = new RegExp(options.filterSellerName, 'i');
        }

        if (options.sortField !== '' && options.sortOrder !== '') {
          let orderSymbol = -1;

          if (options.sortOrder === 'descend') {
            orderSymbol = -1;
          } else if (options.sortOrder === 'ascend') {
            orderSymbol = 1;
          }

          if (options.sortField === 'cover') {
            order = { 'image.contentType': orderSymbol };
          } else if (options.sortField === 'price') {
            order = { price: orderSymbol };
          } else if (options.sortField === 'title') {
            order = { title: orderSymbol };
          } else if (options.sortField === 'channel') {
            order = { channel: orderSymbol };
          } else if (options.sortField === 'category') {
            order = { category: orderSymbol };
          } else if (options.sortField === 'seller_name') {
            order = { seller_name: orderSymbol };
          }
        }

        switch (selectedType) {
          case 'Pending':
            type = 'ebay_data_completed_pending';
            break;
          case 'Approved':
            type = 'ebay_data_completed_approved';
            break;
          case 'Rejected':
            type = 'ebay_data_completed_rejected';
            break;
          default:
            type = 'ebay_data_completed_pending';
        }

        return new Promise((resolve, reject) => {
          models.sequelize.query("SELECT * FROM books AS BOOK \n" + 
          "LEFT JOIN books_ebay_data AS BE_DA ON BOOK.id = BE_DA.book_id \n" + 
          "LEFT JOIN ebay_data_completed AS :data ON BE_DA.ebay_data_completed_id = :data.id \n" + 
          "WHERE BOOK.id = :bookId", { replacements: { data: type, bookId: bookId }, type: sequelize.QueryTypes.SELECT })
          .then(book => {
            models.EbayChannel.findAll().then(channels => {
              models.EbayCategory.findAll().then(categories => {
                resolve({ book, channels, categories });
              });
            });
          })
        })
        .then(data => new Promise((resolve, reject) => {
          const db = nativeClient.db(dbName);
          const collection = db.collection('ebay_data_completed');

          if (options.filterCategory !== '') {
            findQuery = {
              ...findQuery,
              category: data.categories.filter(item =>
                item.ebay_id === options.filterCategory)[0].id
            };
          }
          if (options.filterChannel !== '') {
            findQuery = {
              ...findQuery,
              channel: data.channels.filter(item =>
                item.name === options.filterChannel)[0].id
            };
          }

          collection.find({ id: { $in: data.book[type] }, ...findQuery })
            .sort(order)
            .skip(options.pageSize * page)
            .limit(options.pageSize)
            .toArray((e, docs) => {
              if (e) reject(e);
              else {
                docs.forEach((item, index, array) => {
                  array[index].channel = {
                    id: item.channel,
                    name: data.channels.filter(i =>
                      i.id.toString() === item.channel.toString())[0].name
                  };

                  array[index].category = {
                    id: item.category,
                    name: data.categories.filter(i =>
                      i.id.toString() === item.category.toString())[0].name
                  };
                });

                collection.find({ id: { $in: data.book[type] }, ...findQuery }).count((_err, count) => {
                  if (_err) reject(_err);
                  else {
                    resolve({ docs, count,
                      bookCount: {
                        pending: 122,
                        approved: 51,
                        rejected: 3
                      }
                    });
                  }
                });
              }
            });
          }))
          .then(res => new Promise((resolve, reject) => {
            models.BookSchema.findById(bookId)
            .select('ebay_data_completed_pending ebay_data_completed_approved ebay_data_completed_rejected')
            .exec((err, book) => {
              if (!err) {
                resolve({ ...res, bookCount: {
                    pending: book.ebay_data_completed_pending.length,
                    approved: book.ebay_data_completed_approved.length,
                    rejected: book.ebay_data_completed_rejected.length
                  }});
              } else {
                reject(err);
              }
            });
          }))
          .then(res => {
            const parsed = res.docs.map(item => ({
              // eslint-disable-next-line no-underscore-dangle
              id: item.id.toString(),
              key: item.id.toString(),
              ebay_id: item.ebay_id,
              search_keyword: item.search_keyword,
              title: item.title,
              currency_code: item.currency_code,
              price: parseFloat(item.price.toString()).toFixed(2),
              listing_type: item.listing_type,
              seller_name: item.seller_name,
              seller_feedback: item.seller_feedback,
              channel: item.channel.name,
              category: item.category.name,
              cover: item.image.data === null ? null : item.image.data.toString(),
              image_type: item.image.contentType,
              view_url: item.view_url,
              is_needed_checking: item.is_needed_checking === null || item.is_needed_checking === undefined
                ? false
                : item.is_needed_checking
            }));

            return event.sender.send(
              'book-ebay-data-loaded', parsed,
              {
                pageSize: options.pageSize,
                current: options.current,
                total: res.count,
                // sortField: options.sortField,
                // sortOrder: options.sortOrder
              },
              {
                pending: res.bookCount.pending,
                approved: res.bookCount.approved,
                rejected: res.bookCount.rejected
              }
            );
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('book-ebay-data-loading-error', error);
          })
          .then(() => models.sequelize.close())
          .then(() => (nativeClient !== null ? nativeClient.close() : null));
      }
    });
  });

  ipcMain.on('restore-ebay-data-item', (event, itemId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-data-item-restoring-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          model.EbayDataCompleted.update({
            is_fake: false,
            is_spam: false
          }, { where: { id: itemId } });

          resolve(event.sender.send('ebay-data-item-restored'));
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-data-item-restoring-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('delete-ebay-data-item', (event, itemId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-data-item-deleting-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.EbayDataCompleted.destroy({ where: { id: itemId } });
          resolve(event.sender.send('ebay-data-item-deleted'));
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-data-item-deleting-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('change-ebay-data', (event, action, keys) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-data-changing-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          if (action === 'Delete') {
            resolve(models.EbayDataCompleted.destroy({ where: { id: { $in: keys } } }));
          } else if (action === 'Restore') {
            resolve(models.EbayDataCompleted.update(
              { is_spam: false, is_fake: false },
              { where: { id: { $in: keys } } }
            ));
          } else if (action === 'Resave') {
            resolve(models.EbayDataCompleted.find({ id: { $in: keys } })
            .then(data => new Promise((resolve, reject) => {
                resolve(data);
            }))
            .then(data => {
              const promises = [];

              data.forEach(item => {
                let imgUrl = null;

                promises.push(
                  new Promise((resolve) => {
                    imgUrl = typeof imgUrl === 'string' ? imgUrl : item.image.url;
                    resolve(imageRequestPromise(imgUrl));
                  })
                  .then(res => new Promise((resolve) => {
                    if (res.isFailed === true) {
                      resolve(imageRequestPromise(imgUrl));
                    } else if (res.isCorrupted === true) {
                      resolve(imageRequestPromise(imgUrl));
                    } else {
                      resolve(res);
                    }
                  }))
                  .then(res => new Promise((resolve) => {
                    if (res.isFailed === true) {
                      resolve({
                        data: item.image.data,
                        contentType: item.image.contentType,
                        url: imgUrl
                      });
                    } else if (res.isCorrupted === true) {
                      resolve({
                        data: item.image.data,
                        contentType: item.image.contentType,
                        url: imgUrl
                      });
                    } else {
                      resolve(res);
                    }
                  }))
                  .then(res => new Promise((resolve, reject) => {
                    models.EbayDataCompleted.update(
                      { $set: { image: res } },
                      { where: { id: item.id }}
                    );
                  }))
                );
              });

              return Promise.all(promises);
              })
            );
          } else {
            return reject(new Error('Wrong action.'));
          }
        })
        .then(() => event.sender.send('ebay-data-changed'))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-data-changing-error', error);
        })
        .then(() => models.sequelize.close())
    });
  });

  ipcMain.on('book-change-ebay-data', (event, bookId, dataType, dataAction, keys) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('book-ebay-data-changing-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.Book.findOne({ where: { id: bookId }}).then(data => {
            resolve(data);
          });
        })
        .then(book => new Promise((resolve, reject) => {
          if (dataType === 'Pending' && (dataAction === 'Approve' || dataAction === 'Reject')) {
            if (dataAction === 'Approve') {
              models.EbayDataCompleted.findAll({ where: 
              {
                id: { $in: [...book.ebay_data_completed_pending, ...book.ebay_data_completed_approved] },
                is_fake: { $in: [false, null] },
                is_spam: { $in: [false, null] }
              } }).then(data => {
                let sellers = {};
                let toMarkAsNeeded = [];
                let toMarkAsFake = [];
                let toApprove = [];

                allItems.forEach(item => {
                  sellers[item.seller_name] =
                    sellers[item.seller_name] !== undefined
                      ? [...sellers[item.seller_name], item]
                      : [item];
                });

                newItems.forEach(item => {
                  // if there is no other items from this seller OR already marked as "is_needed_checking" - approve
                  if (sellers[item.seller_name].length === 1 || item.is_needed_checking === true) {
                    toApprove.push(item._id.toString());
                  } else {
                    // if has no dates - mark as "is_needed_checking"
                    if (item.listing_started === null || item.listing_started === undefined
                      || item.listing_ended === null || item.listing_ended === undefined) {
                      toMarkAsNeeded.push(item._id.toString());
                    } else { // compare dates.
                      // check all items from the same seller. mark as "fake" the wrong ones.
                      // ignore items without dates if it not approved (if approved - return "true" in dates comparison)
                      sellers[item.seller_name].forEach((itm, index) => { // - mark as "fake" or approve
                        const nxt = sellers[item.seller_name][index + 1];

                        if (nxt !== undefined) {
                          if (itm.listing_ended !== null && nxt.listing_started !== null) {
                            // if difference between itm.listing_ended and nxt.listing_started = 30 days - approve both
                            // else - approve nxt, mark as "fake" itm
                            const listingEnded = moment(itm.listing_ended);
                            const listingStarted = moment(itm.listing_started);
                            const diff = listingStarted.diff(listingEnded, 'days');

                            if (diff >= fakePeriod) {
                              toApprove.push(itm._id.toString());
                              toApprove.push(nxt._id.toString());
                            } else {
                              toMarkAsFake.push(itm._id.toString());
                              toApprove.push(nxt._id.toString());
                            }
                          }
                        }
                      });
                    }
                  }
                });

                models.EbayDataCompleted.update( {
                  is_needed_checking: true
                }, { where: { id: { $in: toMarkAsNeeded }} });

                book.ebay_data_completed_pending = [...new Set(book.ebay_data_completed_pending)]
                  .filter(item => !toApprove.includes(item.toString()));

                book.ebay_data_completed_approved = [...new Set([
                  ...book.ebay_data_completed_approved,
                  ...toApprove
                ])];

                book.save().then(data => {
                  models.EbayDataCompleted.update({
                    book: book.id, 
                    is_needed_checking: false
                  }, { where: { id: { $in: toApprove }} });

                  models.EbayDataCompleted.update({
                    is_fake: true 
                  }, { where: { id: { $in: toMarkAsFake }} });

                  event.sender.send('book-ebay-data-changed');
                });
              })
            } else if (dataAction === 'Reject') {
              book.ebay_data_completed_pending = [...new Set(book.ebay_data_completed_pending)]
              .filter(item => !keys.includes(item.toString()));

              book.ebay_data_completed_rejected = [...new Set([
                ...book.ebay_data_completed_rejected,
                ...keys
              ])];

              book.save((err) => {
                if (err) reject(err);
                else {
                  resolve(event.sender.send('book-ebay-data-changed'));
                }
              });
            }
          } else if (dataType === 'Approved' && (dataAction === 'Reject' || dataAction === 'Restore')) {
            book.ebay_data_completed_approved = [...new Set(book.ebay_data_completed_approved)]
            .filter(item => !keys.includes(item.toString()));

            if (dataAction === 'Reject') {
              book.ebay_data_completed_rejected = [...new Set([
                ...book.ebay_data_completed_rejected,
                ...keys
              ])];

              models.EbayDataCompletedSchema.updateMany(
                { _id: { $in: keys } },
                { book: null },
                (err) => {
                  if (err) reject(err);
                  else {
                    book.save((e) => {
                      if (e) reject(e);
                      else {
                        resolve(event.sender.send('book-ebay-data-changed'));
                      }
                    });
                  }
                }
              )
            } else if (dataAction === 'Restore') {
              book.ebay_data_completed_pending = [...new Set([
                ...book.ebay_data_completed_pending,
                ...keys
              ])];

              models.EbayDataCompleted.update({
                body: null
              }, { where: { id: { $in: keys }}, });

              book.save().then(data => {
                resolve(event.sender.send('book-ebay-data-changed'));
              });
            }
          } else if (dataType === 'Rejected' && dataAction === 'Restore') {
            book.ebay_data_completed_rejected = [...new Set(book.ebay_data_completed_rejected)]
              .filter(item => !keys.includes(item.toString()));

            book.ebay_data_completed_pending = [...new Set([
              ...book.ebay_data_completed_pending,
              ...keys
            ])];

            
            book.save().then(data => {
              resolve(event.sender.send('book-ebay-data-changed'));
            });
          } else if (dataAction === 'Delete') {
            if (dataType === 'Pending') {
              book.ebay_data_completed_pending = [...new Set(book.ebay_data_completed_pending)]
                .filter(item => !keys.includes(item.toString()));
            } else if (dataType === 'Approved') {
              book.ebay_data_completed_approved = [...new Set(book.ebay_data_completed_approved)]
                .filter(item => !keys.includes(item.toString()));
            } else if (dataType === 'Rejected') {
              book.ebay_data_completed_rejected = [...new Set(book.ebay_data_completed_rejected)]
                .filter(item => !keys.includes(item.toString()));
            }

            book.save().then(data => {
              resolve(event.sender.send('book-ebay-data-changed'));
            });
          } else if (dataAction === 'Fake') {
            models.EbayDataCompleted.update({
              is_fake: true
            }, { where: { id: { $in: keys }} });

            resolve(event.sender.send('book-ebay-data-changed'));
          } else if (dataAction === 'Spam') {
            models.EbayDataCompleted.update({
              is_spam: true
            }, { where: { id: { $in: keys }} });

            resolve(event.sender.send('book-ebay-data-changed'));
          }

          return null;
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-ebay-data-changing-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('book-search-keywords', (event, bookId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('book-keywords-searching-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.Book.findOne({ where: { id: 1 }, 
            include: [{ model: models.BookEbayKeyword, as: 'BookEbayKeywords' }] })
            .then(data => {
              resolve(data);
            })
        })
        .then(book => {
          const promises = [];
          book.ebay_keywords.forEach(keyword => {
            promises.push(new Promise((resolve, reject) => {
              models.EbayDataCompleted.find({ where: {
                'image.contentType': { $ne: null },
                book: null,
                is_fake: { $in: [false, null] },
                is_spam: { $in: [false, null] },
                $text: { $search: `${keyword.keyword}` },
                min_price: keyword.min_price,
                max_price: keyword.max_price,
                channel: { $in: keyword.channels },
                category: { $in: keyword.categories }
              }, attributes: ['id', 'title'] })
              .then(data => {
                resolve(data);
              });
            }));
          });

          return Promise.all(promises).then(data => ({ book, data }));
        })
        .then(prepared => new Promise((resolve, reject) => {
          let dataIds = [];
          const approved = prepared.book.ebay_data_completed_approved
            .map(item => item.toString());
          const rejected = prepared.book.ebay_data_completed_rejected
            .map(item => item.toString());

          prepared.data.forEach(value => {
            dataIds = dataIds.concat(value.map(item => item.id.toString()));
          });

          prepared.book.ebay_data_completed_pending = [...new Set(dataIds)]
            .filter(item => !approved.includes(item))
            .filter(item => !rejected.includes(item));
          prepared.book.save((err) => {
            if (err) reject(err);
            else {
              resolve(event.sender.send('book-keywords-searched'));
            }
          });
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keywords-searching-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('book-preview-search-keywords', (event, bookId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('ebay-search-adding-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.Book.findOne({ where: { id: bookId }, 
            include: [{ model: models.BookEbayKeyword, as: 'BookEbayKeywords' }] })
            .then(keyword => {
              resolve(keyword);
            })
        })
        .then(book => {
          const promises = [];
          book.ebay_keywords.forEach(keyword => {
            promises.push(new Promise((resolve, reject) => {
              models.EbayDataCompleted.findAll({ where: {
                book: null,
                $text: { $search: `${keyword.keyword}` },
                min_price: keyword.min_price,
                max_price: keyword.max_price,
                channel: { $in: keyword.channels },
                category: { $in: keyword.categories }
              } })
              .then(data => {
                resolve(data);
              });
            }));
          });

          return Promise.all(promises).then(data => ({ book, data }));
        })
        .then(prepared => new Promise(resolve => {
          let dataIds = [];
          const approved = prepared.book.ebay_data_completed_approved
            .map(item => item.toString());
          const rejected = prepared.book.ebay_data_completed_rejected
            .map(item => item.toString());

          prepared.data.forEach(value => {
            dataIds = dataIds.concat(value.map(item => item.id.toString()));
          });

          dataIds = [...new Set(dataIds)]
            .filter(item => !approved.includes(item))
            .filter(item => !rejected.includes(item));

          resolve(event.sender.send('book-keywords-preview-searched', dataIds.length));
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keywords-preview-searching-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('book-recalculate-prices', (event, bookId) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('book-prices-recalculation-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.sequelize.query("SELECT ED_COM.id, ED_COM.price FROM books AS BOOK \n" + 
          "LEFT JOIN books_ebay_data AS BE_DA ON BOOK.id = BE_DA.book_id \n" + 
          "LEFT JOIN ebay_data_completed AS ED_COM ON BE_DA.ebay_data_completed_id = ED_COM.id \n" + 
          "WHERE BOOK.id = ?", { replacements: { bookId }, type: sequelize.QueryTypes.SELECT })
          .then(data => {
            resolve(data);
          })
        })
        .then(book => new Promise((resolve, reject) => {
          let number = 0;
          let avgPrice = 0.0;
          let minPrice = 0.0;
          let maxPrice = 0.0;

          book.forEach(item => {
            const price = parseFloat(item.price.toString());

            if (number === 0) {
              minPrice = price;
              maxPrice = price;
            } else if (price >= maxPrice) {
              maxPrice = price;
            } else if (price <= minPrice) {
              minPrice = price;
            }

            avgPrice += price;
            number += 1;
          });

          avgPrice /= number;
          avgPrice = avgPrice.toFixed(2);
          minPrice = minPrice.toFixed(2);
          maxPrice = maxPrice.toFixed(2);

          book.avg_price = avgPrice;
          book.min_price = minPrice;
          book.max_price = maxPrice;

          models.EbayDataCompleted.update({
             id: item.id 
            }, { where: { price: item.price } });

          resolve(event.sender.send('book-prices-recalculated', {
            avgPrice,
            minPrice,
            maxPrice
          }));
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-prices-recalculation-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('load-book-autocomplete-data', (event) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('book-autocomplete-data-loading-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.BookAuthor.findAll().then(authors => {
            models.BookPublisher.findAll().then(publishers => {
              resolve({ authors, publishers });
            });
          });
        })
        .then(data => {
          const authors = data.authors.map(item => item.name);
          const publishers = data.publishers.map(item => item.name);

          return event.sender.send('book-autocomplete-data-loaded', {
            authors: [...new Set(authors)], publishers: [...new Set(publishers)]
          });
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('book-autocomplete-data-loading-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });

  ipcMain.on('load-keywords-autocomplete-data', (event) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
      sequelize) => {
      if (error) return event.sender.send('keywords-autocomplete-data-loading-error', error);
        const models = ModelsSqlite(sequelize);

        return new Promise((resolve, reject) => {
          models.BookEbayKeyword.findAll().then(keywords => {
            resolve(keywords);
          })
        })
        .then(keywords => {
          const prepared = keywords.map(item => item.keyword);

          return event.sender.send('keywords-autocomplete-data-loaded', [...new Set(prepared)]);
        })
        .catch(err => {
          console.log(err);
          return event.sender.send('keywords-autocomplete-data-loading-error', error);
        })
        .then(() => models.sequelize.close());
    });
  });
};

export default ipcMainHandler;
