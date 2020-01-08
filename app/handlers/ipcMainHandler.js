/* eslint-disable no-param-reassign,no-underscore-dangle */
import { ipcMain, dialog } from 'electron';
import request from 'request';
import * as Excel from 'exceljs';
import moment from 'moment';
import storage from 'electron-json-storage';

import amazonJobHandler from './amazonJobHandler';
import ebayJobHandler from './ebayJobHandler';
import ebayScheduler from './ebayScheduler';
import getConnection from '../utils/getConnection';
import Models from '../models/index';
import ModelsSqlite from '../models/index_sqlite';
import isDomestic from '../utils/isDomestic';
import getSettingsDir from '../utils/getSettingsDir';

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

    getConnection((error, mongoose) => {
      if (error) event.sender.send('search-adding-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.AmazonChannelSchema.find({}, (e, channels) => {
            if (e) {
              reject(e);
            } else {
              resolve(channels);
            }
          });
        })
          .then(channels => new Promise((resolve, reject) => models.AmazonSearchSchema.create({
            name: data.name,
            is_asin: data.isAsins,
            channels: channels
              .filter(item => data.channels.includes(item.name))
              .map(item => item._id),
            search_items: []
          }, (err, search) => {
            if (err) {
              reject(err);
            } else {
              resolve(search);
            }
          })))
          .then(search => {
            const selectedItems = amazonItems.map(value => ({
              isbn_asin: value,
              search
            }));

            return models.AmazonSearchItemSchema.insertMany(selectedItems)
              .then(searchItems => new Promise((resolve, reject) => {
                search.search_items = searchItems;

                search.save(err => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(null);
                  }
                });
              }));
          })
          .then(() => event.sender.send('search-added'))
          .catch(err => {
            console.log(err);
            event.sender.send('search-adding-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('delete-search', (event, id) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('search-deletion-error', error);
      else {
        const models = Models(mongoose);

        return models.AmazonSearchJobSchema.deleteMany({ search: id })
          .then(() => models.AmazonSearchItemSchema.deleteMany({ search: id }))
          .then(() => models.AmazonDataSchema.deleteMany({ search: id }))
          .then(() => new Promise((resolve, reject) =>
            models.AmazonSearchSchema.remove({ _id: id }, err => {
              if (err) {
                reject(err);
              } else {
                resolve(null);
              }
            })))
          .then(() => event.sender.send('search-deleted', id))
          .catch(err => {
            console.log(err);
            return event.sender.send('search-deletion-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('start-search', (event, id) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('search-starting-error', error);
      else {
        const models = Models(mongoose);

        return models.AmazonSearchJobSchema.deleteMany({ search: id })
          .then(() => models.AmazonDataSchema.deleteMany({ search: id }))
          .then(() => models.AmazonSearchSchema.findOne({ _id: id })
            .populate('search_items')
            .populate('channels')
            .exec((err, data) => new Promise((resolve, reject) => {
              if (!err) {
                resolve(data);
              } else {
                reject(err);
              }
            })))
          .then(search => {
            const jobs = search.channels.map((channel) => {
              const duplicates = {};

              return search.search_items.map((item) => ({
                isbn_asin: item.isbn_asin,
                search: search._id.toString(),
                channel: channel._id.toString()
              })).filter(value => {
                if (duplicates[value.isbn_asin] === value.search) {
                  return false;
                }

                duplicates[value.isbn_asin] = value.search;
                return true;
              });
            }).reduce((prev, curr) => prev.concat(curr));

            return models.AmazonSearchJobSchema.insertMany(jobs)
              .then(inserted => new Promise((resolve) => resolve({ search, jobs: inserted })));
          })
          .then(result => new Promise((resolve, reject) => {
            result.search.searched_at = new Date();
            result.search.search_jobs = result.jobs;
            result.search.searched_count = result.search.searched_count + 1;

            result.search.save(err => {
              if (err) {
                reject(err);
              } else {
                models.AmazonSearchSchema.findOne({ _id: result.search._id })
                  .populate('search_items')
                  .populate('search_jobs')
                  .populate('channels')
                  .exec((e, data) => {
                    if (!e) {
                      resolve(data);
                    } else {
                      reject(e);
                    }
                  });
              }
            });
          }))
          .then(updatedSearch => {
            const uniqueSearchItems = {};

            updatedSearch.search_items.forEach(item => {
              uniqueSearchItems[item.isbn_asin] = true;
            });

            return event.sender.send('search-started', {
              key: updatedSearch._id.toString(),
              id: updatedSearch._id.toString(),
              name: updatedSearch.name,
              channels: updatedSearch.channels.map(channel =>
                ({ id: channel._id.toString(), name: channel.name })),
              type: updatedSearch.is_asin ? 'ASINs' : 'ISBNs',
              total: updatedSearch.search_items.length,
              duplicates: updatedSearch.search_items.length - Object.keys(uniqueSearchItems).length,
              queued: updatedSearch.search_jobs.length,
              inQueue: updatedSearch.search_jobs.filter(job => job.status === 'Queued').length,
              finished: updatedSearch.search_jobs.filter(job => job.status === 'Finished').length,
              failed: updatedSearch.search_jobs.filter(job => job.status === 'Failed').length,
              createdAt: updatedSearch.created_at,
              searchedAt: updatedSearch.searched_at,
              searchedCount: updatedSearch.searched_count
            });
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('search-starting-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('export-searches-data', (event, ids) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('searches-data-exporting-error', error);
      else {
        const models = Models(mongoose);

        const p = new Promise((resolve, reject) => {
          if (ids === 'all') {
            models.AmazonDataSchema.find()
              .populate('search')
              .populate('channel')
              .exec((err, data) => {
                if (!err) {
                  resolve(data);
                } else {
                  reject(err);
                }
              });
          } else {
            models.AmazonDataSchema.find({ search: { $in: ids } })
              .populate('search')
              .populate('channel')
              .exec((err, data) => {
                if (!err) {
                  resolve(data);
                } else {
                  reject(err);
                }
              });
          }
        });

        return p.then(data => {
          if (data.length > 0) {
            const rows = data.map(item => ({
              ID: item._id.toString(),
              Channel: item.channel.name,
              'Domestic/Imported': isDomestic(item.channel.name, item.language) ? 'Domestic' : 'Imported',
              Language: item.language,
              Title: item.title,
              Author: item.author,
              'Is ASIN?': item.search.is_asin === true ? 'Yes' : 'No',
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
              { header: 'Date', key: 'Date', width: 13 },
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
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-failed-items', (event, searchId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('failed-items-loading-error', error);
      else {
        const models = Models(mongoose);

        return models.AmazonSearchJobSchema.find({ search: searchId, status: 'Failed' })
          .populate('search')
          .populate('channel')
          .exec((e, data) => new Promise((resolve, reject) => {
            if (!e) {
              resolve(data);
            } else {
              reject(e);
            }
          }))
          .then(jobs => {
            const items = jobs.map(job => ({
              isbn_asin: job.isbn_asin,
              channel_name: job.channel.name,
              search_id: job.search._id.toString(),
              key: job._id.toString(),
              status_code: job.status_code
            }));

            return event.sender.send('failed-items-loaded', items);
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('failed-items-loading-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('restart-failed-items', (event, searchId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('failed-items-restarting-error', error);
      else {
        const models = Models(mongoose);

        return models.AmazonSearchJobSchema.updateMany(
          { search: searchId, status: 'Failed' },
          { status: 'Queued', status_code: '' }
        )
          .catch(err => event.sender.send('failed-items-restarting-error', err))
          .then(() => {
            event.sender.send('failed-items-restarted');

            return models.AmazonSearchSchema.findOne({ _id: searchId })
              .populate('search_items')
              .populate('search_jobs')
              .populate('channels')
              .exec((err, data) => new Promise((resolve, reject) => {
                if (!err) {
                  resolve(data);
                } else {
                  reject(err);
                }
              }));
          })
          .then(updatedSearch => {
            const uniqueSearchItems = {};

            updatedSearch.search_items.forEach(item => {
              uniqueSearchItems[item.isbn_asin] = true;
            });

            return event.sender.send('search-started', {
              key: updatedSearch._id.toString(),
              id: updatedSearch._id.toString(),
              name: updatedSearch.name,
              channels: updatedSearch.channels.map(channel =>
                ({ id: channel._id.toString(), name: channel.name })),
              type: updatedSearch.is_asin ? 'ASINs' : 'ISBNs',
              total: updatedSearch.search_items.length,
              duplicates: updatedSearch.search_items.length - Object.keys(uniqueSearchItems).length,
              queued: updatedSearch.search_jobs.length,
              inQueue: updatedSearch.search_jobs.filter(job => job.status === 'Queued').length,
              finished: updatedSearch.search_jobs.filter(job => job.status === 'Finished').length,
              failed: updatedSearch.search_jobs.filter(job => job.status === 'Failed').length,
              createdAt: updatedSearch.created_at,
              searchedAt: updatedSearch.searched_at,
              searchedCount: updatedSearch.searched_count
            });
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('search-starting-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-ebay-data-table', (event, options, type) => {
    getConnection((error, mongoose, amazon, ebay, useLog, nativeClient, dbName) => {
      if (error) event.sender.send('ebay-data-table-loading-error', error);
      else {
        const models = Models(mongoose);
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

        return new Promise((resolve, reject) => {
          models.EbayChannelSchema.find({}, (e, channels) => {
            if (e) {
              reject(e);
            } else {
              models.EbayCategorySchema.find({}, (err, categories) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({ channels, categories });
                }
              });
            }
          });
        }).then(prepared => {
          if (options.filterCategory !== '') {
            findQuery = {
              ...findQuery,
              category: prepared.categories.filter(item =>
                item.ebay_id === options.filterCategory)[0]._id
            };
          }
          if (options.filterChannel !== '') {
            findQuery = {
              ...findQuery,
              channel: prepared.channels.filter(item =>
                item.name === options.filterChannel)[0]._id
            };
          }

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
          }).then(docs => {
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
          }).then(docs => {
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
            }).then(count => models.EbaySearchJobSchema.find({ status: 'Queued' })
              .exec((err, jobs) => new Promise((resolve, reject) => {
                if (!err) {
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
                } else {
                  reject(err);
                }
              })));
          });
        }).catch(err => console.log(err))
          .then(() => models.mongoose.close())
          .then(() => (nativeClient !== null ? nativeClient.close() : null));
      }
    });
  });

  ipcMain.on('load-ebay-searches-table', (event) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-searches-table-loading-error', error);
      else {
        const models = Models(mongoose);

        return models.EbaySearchSchema.find()
          .populate('channels')
          .populate('categories')
          .populate('search_jobs')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(searches => {
            const preparedSearches = [];

            searches.forEach(search => {
              const prepared = {
                key: search._id.toString(),
                id: search._id.toString(),
                isActive: search.is_active,
                keywords: search.keywords,
                type: search.type,
                searchPeriod: search.search_period,
                useExtendedInitial: search.use_extended_initial,
                useSmartStop: search.use_smart_stop,
                minPrice: search.min_price !== null
                  ? parseFloat(search.min_price.toString())
                  : null,
                maxPrice: search.max_price !== null
                  ? parseFloat(search.max_price.toString())
                  : null,
                categories: search.categories.map(category =>
                  ({
                    id: category._id.toString(),
                    name: category.name,
                    ebay_id: category.ebay_id
                  })),
                channels: search.channels.map(channel =>
                  ({ id: channel._id.toString(), name: channel.name })),
                lastSearch: search.last_search_date === null
                  ? ''
                  : moment(new Date(search.last_search_date)).format('hh:mm MM/DD/YYYY'),
                resultsFetched: search.total_results_fetched,
                duplicatesFetched: search.total_duplicates_fetched
              };
              const jobs = search.search_jobs.map(job => job.status);

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
            models.EbayDataCompletedSchema.count({}, (err, count) => {
              if (err) reject(err);
              else {
                resolve(event.sender.send('ebay-searches-table-loaded', prepared, count));
              }
            });
          }))
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-searches-table-loading-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('add-ebay-search', (event, search) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-search-adding-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.EbayChannelSchema.find({}, (err, channels) => {
            if (err) {
              reject(err);
            } else {
              models.EbayCategorySchema.find({}, (e, categories) => {
                if (e) {
                  reject(e);
                } else {
                  resolve({ channels, categories });
                }
              });
            }
          });
        }).then(data => new Promise((resolve, reject) => {
          const prepared = {
            type: search.type,
            is_active: search.isActive,
            keywords: search.keywords,
            search_period: search.searchPeriod,
            use_smart_stop: search.useSmartStop,
            use_extended_initial: search.useExtendedInitial,
            min_price: search.minPrice !== '' ? search.minPrice : null,
            max_price: search.maxPrice !== '' ? search.maxPrice : null,
            channels: data.channels
              .filter(item => search.channels.includes(item.name))
              .map(item => item._id),
            categories: data.categories
              .filter(item => search.categories.includes(item.ebay_id))
              .map(item => item._id),
            search_jobs: []
          };

          const newSearch = new models.EbaySearchSchema(prepared);
          newSearch.save((err) => {
            if (err) reject(err);
            else resolve(event.sender.send('ebay-search-added'));
          });
        })).then(() => (search.isActive === true ? ebayScheduler.emit('run', event) : null))
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-search-adding-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('update-ebay-search', (event, search) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-search-updating-error', error);
      else {
        const models = Models(mongoose);

        return models.EbaySearchSchema.findById(search.id)
          .populate('categories')
          .populate('channels')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(oldSearch => new Promise((resolve, reject) => {
            models.EbayChannelSchema.find({}, (err, channels) => {
              if (err) {
                reject(err);
              } else {
                models.EbayCategorySchema.find({}, (e, categories) => {
                  if (e) {
                    reject(e);
                  } else {
                    resolve({ channels, categories });
                  }
                });
              }
            });
          }).then(data => new Promise((resolve, reject) => {
            oldSearch.is_active = search.isActive;
            oldSearch.keywords = search.keywords;
            oldSearch.search_period = search.searchPeriod
              ? parseInt(search.searchPeriod, 10)
              : 0;
            oldSearch.use_smart_stop = search.useSmartStop;
            oldSearch.use_extended_initial = search.useExtendedInitial;
            oldSearch.min_price = search.minPrice !== '' ? search.minPrice : null;
            oldSearch.max_price = search.maxPrice !== '' ? search.maxPrice : null;
            oldSearch.channels = data.channels
              .filter(item => search.channels.includes(item.name))
              .map(item => item._id);
            oldSearch.categories = data.categories
              .filter(item => search.categories.includes(item.ebay_id))
              .map(item => item._id);
            oldSearch.search_jobs = [];
            oldSearch.is_initial = true;
            oldSearch.searched_at = null;

            oldSearch.save(err => {
              if (err) {
                reject(err);
              } else {
                resolve(models.EbaySearchJobSchema.deleteMany({ search: search.id }));
              }
            });
          })).then(() => (search.isActive === true ? ebayScheduler.emit('run', event) : null)))
          .then(() => event.sender.send('ebay-search-updated'))
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-search-updating-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('save-ebay-search', (event, search) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-search-saving-error', error);
      else {
        const models = Models(mongoose);

        return models.EbaySearchSchema.findById(search.id)
          .populate('categories')
          .populate('channels')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(oldSearch => new Promise((resolve, reject) => {
            models.EbayChannelSchema.find({}, (err, channels) => {
              if (err) {
                reject(err);
              } else {
                models.EbayCategorySchema.find({}, (e, categories) => {
                  if (e) {
                    reject(e);
                  } else {
                    resolve({ channels, categories });
                  }
                });
              }
            });
          }).then(data => new Promise((resolve, reject) => {
            oldSearch.is_active = search.isActive;
            oldSearch.keywords = search.keywords;
            oldSearch.search_period = search.searchPeriod
              ? parseInt(search.searchPeriod, 10)
              : 0;
            oldSearch.use_smart_stop = search.useSmartStop;
            oldSearch.use_extended_initial = search.useExtendedInitial;
            oldSearch.min_price = search.minPrice !== '' ? search.minPrice : null;
            oldSearch.max_price = search.maxPrice !== '' ? search.maxPrice : null;
            oldSearch.channels = data.channels
              .filter(item => search.channels.includes(item.name))
              .map(item => item._id);
            oldSearch.categories = data.categories
              .filter(item => search.categories.includes(item.ebay_id))
              .map(item => item._id);

            oldSearch.save(err => {
              if (err) {
                reject(err);
              } else if (search.isActive === false) {
                resolve(models.EbaySearchJobSchema.updateMany(
                  { search: search.id, status: 'Queued' },
                  { status: 'Waiting' }
                ));
              } else {
                resolve(models.EbaySearchJobSchema.updateMany(
                  { search: search.id, status: 'Waiting' },
                  { status: 'Queued' }
                ));
              }
            });
          })).then(() => {
            if (search.isActive === true) {
              ebayScheduler.emit('start-handler', event);
            }

            return null;
          }))
          .then(() => event.sender.send('ebay-search-saved'))
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-search-saving-error', err);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('delete-ebay-search', (event, searchId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-search-deleting-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.EbaySearchSchema.remove({ _id: searchId }, (err) => {
            if (err) reject(err);
            else resolve(models.EbaySearchJobSchema.deleteMany({ search: searchId }));
          });
        })
          .then(() => event.sender.send('ebay-search-deleted'))
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-search-deleting-error', err);
          }).then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('ebay-resave-cover', (event, id, imageURL) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-cover-resaving-error', error);
      else {
        const models = Models(mongoose);
        let imgUrl = imageURL;
        let data = {};

        return models.EbayDataCompletedSchema.findById(id)
          .exec((err, itemData) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(itemData);
            } else {
              reject(err);
            }
          }))
          .then(itemData => {
            data = itemData;
            imgUrl = typeof imgUrl === 'string' ? imgUrl : data.image.url;
            return imageRequestPromise(imgUrl);
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
                data: data.image.data,
                contentType: data.image.contentType,
                url: imgUrl
              });
            } else if (res.isCorrupted === true) {
              resolve({
                data: data.image.data,
                contentType: data.image.contentType,
                url: imgUrl
              });
            } else {
              resolve(res);
            }
          }))
          .then((res) => new Promise((resolve, reject) => {
            models.EbayDataCompletedSchema.update({ _id: id }, { $set: { image: res } }, (err) => {
              if (err) {
                reject(err);
              } else {
                event.sender.send('ebay-cover-resaved', { id, image: res });
                resolve(null);
              }
            });
          }))
          .then(() => models.mongoose.close())
          .catch(err => {
            console.log(err);
            return event.sender.send('ebay-cover-resaving-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-books', (event) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('books-loading-error', error);
      else {
        const models = Models(mongoose);

        return models.BookSchema.find()
          .populate('author')
          .populate('language')
          .populate('publisher')
          .populate('additional_authors')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(books => {
            const parsed = books.map(book => ({
              id: book._id.toString(),
              key: book._id.toString(),
              title: book.title,
              language: book.language !== null ? book.language.name : null,
              author: book.author !== null ? book.author.name : null,
              year: book.year,
              publisher: book.publisher !== null ? book.publisher.name : null,
              isbn_10: book.isbn_10,
              isbn_13: book.isbn_13,
              asin: book.asin,
              series: book.series,
              series_number: book.series_number,
              cover: book.cover.contentType === null ? null : `${book.cover.contentType};${book.cover.data}`,
              notes: book.notes,
              cover_price: book.cover_price !== null ? book.cover_price.toString() : null,
              avg_price: book.avg_price !== null ? book.avg_price.toString() : null,
              min_price: book.min_price !== null ? book.min_price.toString() : null,
              max_price: book.max_price !== null ? book.max_price.toString() : null,
              additional_authors_count: book.additional_authors.length,
              additional_authors: book.additional_authors.map(item => item.name),
              additional_serial_numbers_count: book.additional_serial_numbers.length,
              additional_serial_numbers: book.additional_serial_numbers.map(item => item.serial_number)
            }));

            return event.sender.send('books-loaded', parsed);
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('books-loading-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('add-book', (event, data) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-adding-error', error);
      else {
        const models = Models(mongoose);

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
          models.BookAuthorSchema.findOne({ name: data.author || null }, (err, author) => {
            if (err) {
              reject(err);
            } else {
              models.BookPublisherSchema.findOne({ name: data.publisher || null }, (er, publisher) => {
                if (er) {
                  reject(er);
                } else {
                  models.BookLanguageSchema.findOne({ name: data.language || null }, (e, language) => {
                    if (e) {
                      reject(e);
                    } else {
                      models.BookAuthorSchema.find({ name: { $in: additionalAuthors } }, (e_, authors) => {
                        if (e_) {
                          reject(e_);
                        } else {
                          resolve({ author, publisher, language, authors });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        })
        .then(matched => new Promise((resolve, reject) => {
          if (data.author !== '' && (matched.author === null || matched.author === undefined)) {
            const author = new models.BookAuthorSchema({ name: data.author });

            author.save((err, saved) => {
              if (err) reject(err);
              else {
                matched.author = { _id: saved._id };
                resolve(matched);
              }
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

            models.BookAuthorSchema.insertMany(toAdd, (error, docs) => {
              if (error) reject(error);
              else {
                matched.authors = [...matched.authors, ...docs];
                resolve(matched);
              }
            });
          } else {
            resolve(matched);
          }
        }))
        .then(matched => new Promise((resolve, reject) => {
          if (data.publisher !== '' && (matched.publisher === null || matched.publisher === undefined)) {
            const publisher = new models.BookPublisherSchema({ name: data.publisher });

            publisher.save((err, saved) => {
              if (err) reject(err);
              else {
                matched.publisher = { _id: saved._id };
                resolve(matched);
              }
            });
          } else {
            resolve(matched);
          }
        }))
          .then(matched => new Promise((resolve, reject) => {
            const prepared = {
              title: data.title,
              language: data.language === '' ? null : matched.language._id,
              author: data.author === '' ? null : matched.author._id,
              year: data.year === '' ? null : data.year,
              publisher: data.publisher === '' ? null : matched.publisher._id,
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
                : matched.authors.map(item => item._id),
              additional_serial_numbers: additionalISBNs13
            };

            const newBook = new models.BookSchema(prepared);
            newBook.save((err) => {
              if (err) reject(err);
              else resolve(event.sender.send('book-added'));
            });
          }))
          .catch(err => {
            console.log(err);
            return event.sender.send('book-adding-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('update-book', (event, newValues) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-updating-error', error);
      else {
        const models = Models(mongoose);

        const additionalAuthors = [];
        const additionalISBNs13 = [];

        Object.keys(newValues).map(key => {
          if (key.substring(0, key.length - 1) === 'author_') {
            let value = newValues[key];

            if (value !== null && value !== '') {
              additionalAuthors.push(value);
            }
          }
        });

        Object.keys(newValues).map(key => {
          if (key.substring(0, key.length - 1) === 'isbn_13_') {
            let value = newValues[key];

            if (value !== null && value !== '') {
              additionalISBNs13.push({type: 'ISBN_13', serial_number: value});
            }
          }
        });

        return new Promise((resolve, reject) => {
          models.BookAuthorSchema.findOne({ name: newValues.author || null }, (err, author) => {
            if (err) {
              reject(err);
            } else {
              models.BookPublisherSchema.findOne({ name: newValues.publisher || null }, (er, publisher) => {
                if (er) {
                  reject(er);
                } else {
                  models.BookLanguageSchema.findOne({ name: newValues.language || null }, (e, language) => {
                    if (e) {
                      reject(e);
                    } else {
                      models.BookAuthorSchema.find({ name: { $in: additionalAuthors } }, (e_, authors) => {
                        if (e_) {
                          reject(e_);
                        } else {
                          resolve({ author, publisher, language, authors });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        })
          .then(matched => new Promise((resolve, reject) => {
            if (newValues.author !== '' && (matched.author === null || matched.author === undefined)) {
              const author = new models.BookAuthorSchema({ name: newValues.author });

              author.save((err, saved) => {
                if (err) reject(err);
                else {
                  matched.author = { _id: saved._id };
                  resolve(matched);
                }
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

              models.BookAuthorSchema.insertMany(toAdd, (error, docs) => {
                if (error) reject(error);
                else {
                  matched.authors = [...matched.authors, ...docs];
                  resolve(matched);
                }
              });
            } else {
              resolve(matched);
            }
          }))
          .then(matched => new Promise((resolve, reject) => {
            if (newValues.publisher !== '' && (matched.publisher === null || matched.publisher === undefined)) {
              const publisher = new models.BookPublisherSchema({ name: newValues.publisher });

              publisher.save((err, saved) => {
                if (err) reject(err);
                else {
                  matched.publisher = { _id: saved._id };
                  resolve(matched);
                }
              });
            } else {
              resolve(matched);
            }
          }))
          .then(matched => new Promise((resolve, reject) => {
            models.BookSchema.findById(newValues.id, (err, book) => {
              if (err) reject(err);
              else {
                resolve({ book, matched,
                  old: { authorId: book.author, publisherId: book.publisher, authors: book.additional_authors } });
              }
            });
          }))
          .then(data => new Promise((resolve, reject) => {
            data.book.title = newValues.title;
            data.book.language = newValues.language === '' ? null : data.matched.language._id;
            data.book.author = newValues.author === '' ? null : data.matched.author._id;
            data.book.year = newValues.year === '' ? null : newValues.year;
            data.book.publisher = newValues.publisher === '' ? null : data.matched.publisher._id;
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

            data.book.save((err, b) => {
              if (err) reject(err);
              else {
                event.sender.send('book-updated', {
                  id: b._id.toString(),
                  key: b._id.toString(),
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
              }
            });
          }))
          .then(data => {
            return models.BookSchema.count({ author: data.old.authorId })
            .exec((err, count) => new Promise((resolve, reject) => {
              if (!err) {
                resolve(count);
              } else {
                reject(err);
              }
            }))
            .then(count => {
              if (count === 0) {
                return models.BookAuthorSchema.deleteOne({ _id: data.old.authorId })
                  .then(() => data)
              }

              return data;
            });
          })
          .then(data => {
            return models.BookSchema.count({ publisher: data.old.publisherId })
            .exec((err, count) => new Promise((resolve, reject) => {
              if (!err) {
                resolve(count);
              } else {
                reject(err);
              }
            }))
            .then(count => {
              if (count === 0) {
                return models.BookPublisherSchema.deleteOne({ _id: data.old.publisherId })
                  .then(() => data)
              }

              return data;
            });
          })
          .then(data => {
            const getDataPromises = [];
            const deletePromises = [];

            data.old.authors.forEach(item => {
              getDataPromises.push(new Promise((resolve) => {
                models.BookSchema
                .count()
                .or([{ author: item }, { additional_authors: item }])
                .exec((err, count) => {
                  if (!err) {
                    resolve(count);
                  } else {
                    resolve(null);
                  }
                });
              }));
            });

            return Promise.all(getDataPromises).then(authorsCount => {
              authorsCount.forEach((count, index) => {
                if (count === 0) {
                  deletePromises.push(new Promise((resolve) => {
                    models.BookAuthorSchema.findByIdAndRemove(data.old.authors[index], (err) => {
                      if (!err) {
                        resolve(true);
                      } else {
                        resolve(null);
                      }
                    })
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
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('update-book-keyword', (event, keywordId, newData) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-keyword-updating-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.EbayChannelSchema.find({}, (err, channels) => {
            if (err) {
              reject(err);
            } else {
              models.EbayCategorySchema.find({}, (e, categories) => {
                if (e) {
                  reject(e);
                } else {
                  models.BookEbayKeywordSchema.findById(keywordId, (e_, keyword) => {
                    if (e_) {
                      reject(e_);
                    } else {
                      resolve({ channels, categories, keyword });
                    }
                  });
                }
              });
            }
          });
        }).then(data => new Promise((resolve, reject) => {
          data.keyword.is_shared = newData.isShared;
          data.keyword.keyword = newData.keyword;
          data.keyword.min_price = newData.minPrice;
          data.keyword.max_price = newData.maxPrice;
          data.keyword.channels = data.channels
          .filter(item => newData.channels.includes(item.name))
          .map(item => item._id);
          data.keyword.categories = data.categories
          .filter(item => newData.categories.includes(item.ebay_id))
          .map(item => item._id);

          data.keyword.save((err, keyword) => {
            if (err) reject(err);
            else {
              event.sender.send('book-keyword-updated', keyword);
            }
          });
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keyword-updating-error', err);
        }).then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('delete-book', (event, id) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-deleting-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.BookSchema.findById(id, (err, book) => {
            if (err) {
              reject(err);
            } else {
              const keywordIds = book.ebay_keywords;

              models.BookSchema.remove({ _id: id }, (er) => {
                if (er) {
                  reject(er);
                } else {
                  models.BookEbayKeywordSchema.remove({ _id: { $in: keywordIds } }, (e) => {
                    if (e) {
                      reject(e);
                    } else {
                      event.sender.send('book-deleted', id);
                      resolve(book);
                    }
                  });
                }
              });
            }
          });
        })
          .then(deletedBook => new Promise((resolve, reject) => {
            models.BookSchema.find({ author: deletedBook.author }, (err, booksWithAuthor) => {
              if (err) reject(err);
              else {
                models.BookSchema.find(
                  { publisher: deletedBook.publisher },
                  (e, booksWithPublisher) => {
                    if (e) reject(e);
                    else resolve({ deletedBook, booksWithAuthor, booksWithPublisher });
                  }
                );
              }
            });
          }))
          .then(data => new Promise((resolve, reject) => {
            if (data.booksWithAuthor.length === 0) {
              models.BookAuthorSchema.remove({ _id: data.deletedBook.author }, err => {
                if (err) reject(err);
                else resolve(data);
              });
            } else {
              return resolve(data);
            }
          }))
          .then(data => new Promise((resolve, reject) => {
            if (data.booksWithPublisher.length === 0) {
              models.BookPublisherSchema.remove({ _id: data.deletedBook.publisher }, err => {
                if (err) reject(err);
                else resolve(data);
              });
            } else {
              return resolve(data);
            }
          }))
          .then(data => new Promise((resolve, reject) => {
            return models.EbayDataCompletedSchema.updateMany(
              { _id: { $in: data.deletedBook.ebay_data_completed_approved } },
              { book: null },
              (err) => {
                if (err) reject(err);
                else {
                  resolve(data);
                }
              }
            );
          }))
          .then(data => {
            const getDataPromises = [];
            const deletePromises = [];

            data.deletedBook.additional_authors.forEach(item => {
              getDataPromises.push(new Promise((resolve) => {
                models.BookSchema
                .count()
                .or([{ author: item }, { additional_authors: item }])
                .exec((err, count) => {
                  if (!err) {
                    resolve(count);
                  } else {
                    resolve(null);
                  }
                });
              }));
            });

            return Promise.all(getDataPromises).then(authorsCount => {
              authorsCount.forEach((count, index) => {
                if (count === 0) {
                  deletePromises.push(new Promise((resolve) => {
                    models.BookAuthorSchema.findByIdAndRemove(data.deletedBook.additional_authors[index], (err) => {
                      if (!err) {
                        resolve(true);
                      } else {
                        resolve(null);
                      }
                    })
                  }));
                }
              });

              return Promise.all(deletePromises);
            });
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('book-deleting-error', error);
          }).then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-book-keywords', (event, bookId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-keywords-loading-error', error);
      else {
        const models = Models(mongoose);

        return models.BookSchema.findById(bookId)
          .populate({
            path: 'ebay_keywords',
            populate: { path: 'channels' }
          })
          .populate({
            path: 'ebay_keywords',
            populate: { path: 'categories' }
          })
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(book => {
            const parsed = book.ebay_keywords.map(keyword => ({
              id: keyword._id.toString(),
              key: keyword._id.toString(),
              isShared: keyword.is_shared,
              keyword: keyword.keyword,
              minPrice: keyword.min_price,
              maxPrice: keyword.max_price,
              channels: keyword.channels.map(channel => ({
                key: channel._id.toString(),
                id: channel._id.toString(),
                name: channel.name
              })),
              categories: keyword.categories.map(category => ({
                key: category._id.toString(),
                id: category._id.toString(),
                name: category.name,
                ebay_id: category.ebay_id
              }))
            }));

            return event.sender.send('book-keywords-loaded', parsed);
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('book-keywords-loading-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('add-book-keyword', (event, bookId, newData) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-keyword-adding-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.EbayChannelSchema.find({}, (err, channels) => {
            if (err) {
              reject(err);
            } else {
              models.EbayCategorySchema.find({}, (e, categories) => {
                if (e) {
                  reject(e);
                } else {
                  resolve({ channels, categories });
                }
              });
            }
          });
        }).then(data => new Promise((resolve, reject) => {
          const prepared = {
            is_shared: newData.isShared || false,
            keyword: newData.keyword,
            min_price: newData.minPrice,
            max_price: newData.maxPrice,
            channels: data.channels
              .filter(item => newData.channels.includes(item.name))
              .map(item => item._id),
            categories: data.categories
              .filter(item => newData.categories.includes(item.ebay_id))
              .map(item => item._id)
          };

          const newBookKeyword = new models.BookEbayKeywordSchema(prepared);
          newBookKeyword.save((err) => {
            if (err) reject(err);
            else {
              models.BookSchema.findById(bookId, (er, book) => {
                if (er) reject(er);
                else {
                  book.ebay_keywords.push(newBookKeyword._id);
                  book.save((e) => {
                    if (e) reject(e);
                    else {
                      resolve(event.sender.send('book-keyword-added', {
                        id: newBookKeyword._id.toString(),
                        key: newBookKeyword._id.toString(),
                        isShared: newBookKeyword.is_shared,
                        keyword: newData.keyword,
                        minPrice: newData.minPrice || null,
                        maxPrice: newData.maxPrice || null,
                        channels: data.channels
                          .filter(item => newData.channels.includes(item.name))
                          .map(item => ({
                            key: item._id.toString(),
                            id: item._id.toString(),
                            name: item.name,
                          })),
                        categories: data.categories
                          .filter(item => newData.categories.includes(item.ebay_id))
                          .map(item => ({
                            key: item._id.toString(),
                            id: item._id.toString(),
                            name: item.name,
                            ebay_id: item.ebay_id
                          }))
                      }));
                    }
                  });
                }
              });
            }
          });
        }))
        .catch(err => {
          console.log(err);
          return event.sender.send('book-keyword-adding-error', err);
        })
        .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('delete-book-keyword', (event, id, bookId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-keyword-deleting-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.BookSchema.findById(bookId, (err, book) => {
            if (err) {
              reject(err);
            } else {
              models.BookEbayKeywordSchema.remove({ _id: id }, (e) => {
                if (e) {
                  reject(e);
                } else {
                  resolve(book);
                }
              });
            }
          });
        }).then(book => new Promise((resolve, reject) => {
          book.ebay_keywords = book.ebay_keywords.filter((item) => item.toString() !== id);

          book.save((err) => {
            if (err) reject(err);
            else {
              resolve(event.sender.send('book-keyword-deleted', id));
            }
          });
        })).catch(err => {
          console.log(err);
          return event.sender.send('book-keyword-deleting-error', error);
        }).then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('fix-ebay-approved-items', (event) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-approved-items-fixing-error', error);
      else {
        const models = Models(mongoose);

        models.BookSchema.find()
        .populate('ebay_data_completed_approved')
        .exec((err, data) => new Promise((resolve, reject) => {
          if (!err) {
            resolve(data);
          } else {
            reject(err);
          }
        }))
        .then(books => {
          let promises = [];

          books.forEach(book => {
            book.ebay_data_completed_approved.forEach(item => {
              if (item.book === null) {
                promises.push(new Promise((resolve) => {
                  item.book = book._id;

                  item.save((e) => {
                    if (e) resolve(null);
                    else {
                      resolve(true);
                    }
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
        .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-book-ebay-data', (event, bookId, selectedType, options) => {
    getConnection((error, mongoose, amazon, ebay, useLog, nativeClient, dbName) => {
      if (error) event.sender.send('book-ebay-data-loading-error', error);
      else if (bookId === null) event.sender.send('book-ebay-data-loading-error', 'Error: No selected bookId');
      else {
        const models = Models(mongoose);
        let type = '';
        const page = options.current > 0 ? options.current - 1 : 0;
        let order = { created_at: -1 };
        let findQuery = {
          is_fake: { $in: [false, null] },
          is_spam: { $in: [false, null] },
          'image.contentType': { $ne: null }
        };

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

        return models.BookSchema.findById(bookId)
          .select(`${type}`)
          .exec((err, book) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(book);
            } else {
              reject(err);
            }
          }))
          .then(book => new Promise((resolve, reject) => {
            models.EbayChannelSchema.find({}, (e, channels) => {
              if (e) {
                reject(e);
              } else {
                models.EbayCategorySchema.find({}, (err, categories) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ book, channels, categories });
                  }
                });
              }
            });
          }))
          .then(data => new Promise((resolve, reject) => {
            const db = nativeClient.db(dbName);
            const collection = db.collection('ebay_data_completed');

            if (options.filterCategory !== '') {
              findQuery = {
                ...findQuery,
                category: data.categories.filter(item =>
                  item.ebay_id === options.filterCategory)[0]._id
              };
            }
            if (options.filterChannel !== '') {
              findQuery = {
                ...findQuery,
                channel: data.channels.filter(item =>
                  item.name === options.filterChannel)[0]._id
              };
            }

            collection.find({ _id: { $in: data.book[type] }, ...findQuery })
              .sort(order)
              .skip(options.pageSize * page)
              .limit(options.pageSize)
              .toArray((e, docs) => {
                if (e) reject(e);
                else {
                  docs.forEach((item, index, array) => {
                    array[index].channel = {
                      _id: item.channel,
                      name: data.channels.filter(i =>
                        i._id.toString() === item.channel.toString())[0].name
                    };

                    array[index].category = {
                      _id: item.category,
                      name: data.categories.filter(i =>
                        i._id.toString() === item.category.toString())[0].name
                    };
                  });

                  collection.find({ _id: { $in: data.book[type] }, ...findQuery }).count((_err, count) => {
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
              id: item._id.toString(),
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
          .then(() => models.mongoose.close())
          .then(() => (nativeClient !== null ? nativeClient.close() : null));
      }
    });
  });

  ipcMain.on('restore-ebay-data-item', (event, itemId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-data-item-restoring-error', error);
      else {
        const models = Models(mongoose);

        models.EbayDataCompletedSchema.update(
          { _id: itemId },
          { is_fake: false, is_spam: false }
        )
        .then(() => event.sender.send('ebay-data-item-restored'))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-data-item-restoring-error', error);
        })
        .then(() => models.mongoose.close())
      }
    });
  });

  ipcMain.on('delete-ebay-data-item', (event, itemId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-data-item-deleting-error', error);
      else {
        const models = Models(mongoose);

        models.EbayDataCompletedSchema.remove({ _id: itemId })
        .then(() => event.sender.send('ebay-data-item-deleted'))
        .catch(err => {
          console.log(err);
          return event.sender.send('ebay-data-item-deleting-error', error);
        })
        .then(() => models.mongoose.close())
      }
    });
  });

  ipcMain.on('change-ebay-data', (event, action, keys) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('ebay-data-changing-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          if (action === 'Delete') {
            resolve(models.EbayDataCompletedSchema.remove({ _id: { $in: keys } }));
          } else if (action === 'Restore') {
            resolve(models.EbayDataCompletedSchema.updateMany(
              { _id: { $in: keys } },
              { is_spam: false, is_fake: false }
            ));
          } else if (action === 'Resave') {
            resolve(models.EbayDataCompletedSchema.find({ _id: { $in: keys } })
              .exec((err, data) => new Promise((resolve, reject) => {
                if (!err) {
                  resolve(data);
                } else {
                  reject(err);
                }
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
                    .then((res) => new Promise((resolve, reject) => {
                      models.EbayDataCompletedSchema.update({ _id: item._id }, { $set: { image: res } }, (err) => {
                        if (err) {
                          reject(null);
                        } else {
                          resolve(true);
                        }
                      });
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
        .then(() => models.mongoose.close())
      }
    });
  });

  ipcMain.on('book-change-ebay-data', (event, bookId, dataType, dataAction, keys) => {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod) => {
      if (error) event.sender.send('book-ebay-data-changing-error', error);
      else {
        const models = Models(mongoose);

        return models.BookSchema
          .findById(bookId)
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(book => new Promise((resolve, reject) => {
            if (dataType === 'Pending' && (dataAction === 'Approve' || dataAction === 'Reject')) {
              if (dataAction === 'Approve') {
                models.EbayDataCompletedSchema.find(
                  {
                    _id: { $in: [...book.ebay_data_completed_pending, ...book.ebay_data_completed_approved] },
                    is_fake: { $in: [false, null] },
                    is_spam: { $in: [false, null] }
                  }, (er, allItems) => {
                    if (er) reject(er);
                    else {
                      models.EbayDataCompletedSchema.find(
                        {
                          _id: { $in: [...keys] },
                          is_fake: { $in: [false, null] },
                          is_spam: { $in: [false, null] }
                        }, (e, newItems) => {
                          if (e) reject(e);
                          else {
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

                            models.EbayDataCompletedSchema.updateMany(
                              { _id: { $in: toMarkAsNeeded } },
                              { is_needed_checking: true },
                              (er_) => {
                                if (er_) reject(er_);
                                else {
                                  book.ebay_data_completed_pending = [...new Set(book.ebay_data_completed_pending)]
                                    .filter(item => !toApprove.includes(item.toString()));

                                  book.ebay_data_completed_approved = [...new Set([
                                    ...book.ebay_data_completed_approved,
                                    ...toApprove
                                  ])];

                                  book.save((err_) => {
                                    if (err_) reject(err_);
                                    else {
                                      resolve(models.EbayDataCompletedSchema.updateMany(
                                        { _id: { $in: toApprove } },
                                        { book: book._id, is_needed_checking: false }
                                      )
                                      .then(() => models.EbayDataCompletedSchema.updateMany(
                                        { _id: { $in: toMarkAsFake } },
                                        { is_fake: true }
                                      ))
                                      .then(() => event.sender.send('book-ebay-data-changed')));
                                    }
                                  });
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                );
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
              }
            } else if (dataType === 'Rejected' && dataAction === 'Restore') {
              book.ebay_data_completed_rejected = [...new Set(book.ebay_data_completed_rejected)]
                .filter(item => !keys.includes(item.toString()));

              book.ebay_data_completed_pending = [...new Set([
                ...book.ebay_data_completed_pending,
                ...keys
              ])];

              book.save((err) => {
                if (err) reject(err);
                else {
                  resolve(event.sender.send('book-ebay-data-changed'));
                }
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

              book.save((err) => {
                if (err) reject(err);
                else {
                  resolve(event.sender.send('book-ebay-data-changed'));
                }
              });
            } else if (dataAction === 'Fake') {
              resolve(models.EbayDataCompletedSchema.updateMany(
                { _id: { $in: keys } },
                { is_fake: true }
              ).then(() => event.sender.send('book-ebay-data-changed')));
            } else if (dataAction === 'Spam') {
              resolve(models.EbayDataCompletedSchema.updateMany(
                { _id: { $in: keys } },
                { is_spam: true }
              ).then(() => event.sender.send('book-ebay-data-changed')));
            }

            return null;
          }))
          .catch(err => {
            console.log(err);
            return event.sender.send('book-ebay-data-changing-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('book-search-keywords', (event, bookId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-keywords-searching-error', error);
      else {
        const models = Models(mongoose);

        return models.BookSchema.findById(bookId)
          .populate('ebay_keywords')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(book => {
            const promises = [];
            book.ebay_keywords.forEach(keyword => {
              promises.push(new Promise((resolve, reject) => {
                models.EbayDataCompletedSchema.find({
                  'image.contentType': { $ne: null },
                  book: null,
                  is_fake: { $in: [false, null] },
                  is_spam: { $in: [false, null] },
                  $text: { $search: `${keyword.keyword}` },
                  min_price: keyword.min_price,
                  max_price: keyword.max_price,
                  channel: { $in: keyword.channels },
                  category: { $in: keyword.categories }
                })
                  .select('_id title')
                  .exec((err, data) => {
                    if (!err) {
                      resolve(data);
                    } else {
                      reject(err);
                    }
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
              dataIds = dataIds.concat(value.map(item => item._id.toString()));
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
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('book-preview-search-keywords', (event, bookId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-keywords-preview-searching-error', error);
      else {
        const models = Models(mongoose);

        return models.BookSchema.findById(bookId)
        .populate('ebay_keywords')
        .exec((err, data) => new Promise((resolve, reject) => {
          if (!err) {
            resolve(data);
          } else {
            reject(err);
          }
        }))
        .then(book => {
          const promises = [];
          book.ebay_keywords.forEach(keyword => {
            promises.push(new Promise((resolve, reject) => {
              models.EbayDataCompletedSchema.find({
                book: null,
                $text: { $search: `${keyword.keyword}` },
                min_price: keyword.min_price,
                max_price: keyword.max_price,
                channel: { $in: keyword.channels },
                category: { $in: keyword.categories }
              })
              .select('_id')
              .exec((err, data) => {
                if (!err) {
                  resolve(data);
                } else {
                  reject(err);
                }
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
            dataIds = dataIds.concat(value.map(item => item._id.toString()));
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
        .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('book-recalculate-prices', (event, bookId) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-prices-recalculation-error', error);
      else {
        const models = Models(mongoose);

        return models.BookSchema.findById(bookId)
          .populate('ebay_data_completed_approved')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(book => new Promise((resolve, reject) => {
            let number = 0;
            let avgPrice = 0.0;
            let minPrice = 0.0;
            let maxPrice = 0.0;

            book.ebay_data_completed_approved.forEach(item => {
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

            book.save((err) => {
              if (err) reject(err);
              else {
                resolve(event.sender.send('book-prices-recalculated', {
                  avgPrice,
                  minPrice,
                  maxPrice
                }));
              }
            });
          }))
          .catch(err => {
            console.log(err);
            return event.sender.send('book-prices-recalculation-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-book-autocomplete-data', (event) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('book-autocomplete-data-loading-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.BookAuthorSchema.find({}, (err, authors) => {
            if (err) reject(err);
            else {
              models.BookPublisherSchema.find({}, (e, publishers) => {
                if (e) reject(e);
                else resolve({ authors, publishers });
              });
            }
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
          .then(() => models.mongoose.close());
      }
    });
  });

  ipcMain.on('load-keywords-autocomplete-data', (event) => {
    getConnection((error, mongoose) => {
      if (error) event.sender.send('keywords-autocomplete-data-loading-error', error);
      else {
        const models = Models(mongoose);

        return new Promise((resolve, reject) => {
          models.BookEbayKeywordSchema.find({}, (err, keywords) => {
            if (err) reject(err);
            else {
              resolve(keywords);
            }
          });
        })
          .then(keywords => {
            const prepared = keywords.map(item => item.keyword);

            return event.sender.send('keywords-autocomplete-data-loaded', [...new Set(prepared)]);
          })
          .catch(err => {
            console.log(err);
            return event.sender.send('keywords-autocomplete-data-loading-error', error);
          })
          .then(() => models.mongoose.close());
      }
    });
  });
};

export default ipcMainHandler;
