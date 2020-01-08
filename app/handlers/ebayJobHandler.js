import EventEmitter from 'events';
import request from 'request';
import moment from 'moment';
import winston from 'winston';

import Models from '../models/index';
import getConnection from '../utils/getConnection';
import getSettingsDir from '../utils/getSettingsDir';

const imageRequest = request.defaults({ encoding: null, timeout: 5000 });
const ebayJobHandler = new EventEmitter();

ebayJobHandler.isActive = false;
ebayJobHandler.isQueueEmpty = true;
ebayJobHandler.duplicates = null;

function imageRequestPromise(URLs, id) {
  return new Promise((resolve) => {
    imageRequest(URLs[id], (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const image = new Buffer(body).toString('base64');

        if (image !== '') {
          resolve({
            data: `base64,${image}`,
            type: `image/${URLs[id].substr(URLs[id].length - 3)}`,
            url: URLs[id]
          });
        } else {
          resolve({
            isCorrupted: true,
            id
          });
        }
      } else {
        resolve({
          isFailed: true,
          id
        });
      }
    });
  });
}

ebayJobHandler.on('start', (event) => {
  if (!ebayJobHandler.isActive && ebayJobHandler.isQueueEmpty) {
    getConnection((error, mongoose, amazon, ebay, useLog) => {
      if (!error) {
        ebayJobHandler.isActive = false;
        ebayJobHandler.isQueueEmpty = false;
        ebayJobHandler.logger = winston.createLogger({
          level: 'info',
          format: winston.format.json(),
          transports: [
            new winston.transports.Console()
          ]
        });

        if (useLog === true) {
          ebayJobHandler.logger.add(new winston.transports.File({ filename: `${getSettingsDir()}/../log.txt` }));
        }

        ebayJobHandler.models = Models(mongoose);
        ebayJobHandler.client = ebay;
        ebayJobHandler.timer = setInterval(() => ebayJobHandler.emit('run', event), 5000);
        ebayJobHandler.logger.info('[eBay Job Handler] >> Started <<'); // DEBUG
      }
    });
  }
});

ebayJobHandler.on('stop', () => {
  ebayJobHandler.isQueueEmpty = true;
  clearInterval(ebayJobHandler.timer);
  ebayJobHandler.logger.info('[eBay Job Handler] >> Stopped <<'); // DEBUG
});

ebayJobHandler.on('run', (event) => {
  if (!ebayJobHandler.isQueueEmpty) {
    if (!ebayJobHandler.isActive) {
      ebayJobHandler.emit('handle', event);
    }
  } else {
    ebayJobHandler.models.mongoose.close();
    clearInterval(ebayJobHandler.timer);
  }
});

ebayJobHandler.on('handle', (event) => {
  const models = ebayJobHandler.models;
  const client = ebayJobHandler.client;

  ebayJobHandler.isQueueEmpty = false;
  ebayJobHandler.isActive = true;

  models.EbaySearchJobSchema.findOne({ status: 'Queued' })
    .populate('search')
    .populate('category')
    .populate('channel')
    .sort('+created_at')
    .exec((err, data) => new Promise((resolve, reject) => {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    }))
    .then(job => {
      ebayJobHandler.logger.info('[eBay Job Handler] Fetching jobs...'); // TODO: debug

      if (job !== null) {
        ebayJobHandler.logger.info('[eBay Job Handler] Active job:'); // TODO: debug
        ebayJobHandler.logger.info(job);

        client.setChannelName(job.channel.name);
        client.setCategoryId(job.category.ebay_id);

        if (job.min_price !== null) {
          client.setMinPrice(job.min_price.toString());
        } else {
          client.setMinPrice(null);
        }

        if (job.max_price !== null) {
          client.setMaxPrice(job.max_price.toString());
        } else {
          client.setMaxPrice(null);
        }

        return new Promise((resolve, reject) => {
          const savedPageNumber = job.current_page + 1;

          client.findCompletedItems(
            job.keywords, moment(new Date(job.search_time_offset)).toISOString(),
            savedPageNumber,
            (error, response, body) => {
              if (error) {
                reject(error);
              } else {
                const data = JSON.parse(body).findCompletedItemsResponse;

                ebayJobHandler.logger.info('[eBay Job Handler] Response:'); // TODO: debug
                ebayJobHandler.logger.info(data);

                resolve({ data, job, savedPageNumber });
              }
            }
          );
        });
      }

      return null;
    })
    .then(result => new Promise((resolve, reject) => {
      if (result !== null) {
        if (result.data[0].ack[0] === 'Success') {
          event.sender.send('ebay-job-handler-response', result.data); // TODO: debug
          resolve(result);
        } else {
          reject(result.data);
        }
      } else {
        resolve(null);
      }
    }))
    .then(result => {
      if (result !== null) {
        const ebayIDs = [];

        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < parseInt(result.data[0].searchResult[0]['@count'], 10); index++) {
          ebayIDs.push(result.data[0].searchResult[0].item[index].itemId[0]);
        }

        return models.EbayDataCompletedSchema.find({
          ebay_id: { $in: ebayIDs },
          channel: result.job.channel._id,
          category: result.job.category._id
        })
          .select('ebay_id')
          .exec((err, data) => new Promise((resolve, reject) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          }))
          .then(data => {
            ebayJobHandler.duplicates = data.map(item => item.ebay_id);
            return result;
          });
      }

      return null;
    })
    .then(result => {
      if (result !== null) {
        const data = [];
        const imagesAsPromises = [];
        const resultCount = parseInt(result.data[0].searchResult[0]['@count'], 10);
        let lastItemEndDate = null;

        ebayJobHandler.logger.info('[eBay Job Handler] Duplicates:'); // DEBUG
        ebayJobHandler.logger.info(ebayJobHandler.duplicates);

        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < resultCount; index++) {
          const item = result.data[0].searchResult[0].item[index];
          if (index === resultCount - 1) {
            if (item.listingInfo !== undefined && item.listingInfo[0].endTime !== undefined) {
              lastItemEndDate = new Date(item.listingInfo[0].endTime[0]);
            }
          }
          if (!ebayJobHandler.duplicates.includes(item.itemId[0])
            && item.sellingStatus !== undefined && item.sellingStatus[0].sellingState !== undefined
            && item.sellingStatus[0].sellingState[0] === 'EndedWithSales') {
            const URLs = [];

            if (item.galleryPlusPictureURL !== undefined) {
              URLs.push(item.galleryPlusPictureURL[0]);
            } if (item.pictureURLLarge !== undefined) {
              URLs.push(item.pictureURLLarge[0]);
            } if (item.galleryURL !== undefined) {
              URLs.push(item.galleryURL[0]);
            } if (item.galleryInfoContainer !== undefined
              && item.galleryInfoContainer[0].galleryURL !== undefined) {
              if (item.galleryInfoContainer[0].galleryURL[0].__value__ !== undefined) {
                URLs.push(item.galleryInfoContainer[0].galleryURL[0].__value__);
              } if (item.galleryInfoContainer[0].galleryURL[1].__value__ !== undefined) {
                URLs.push(item.galleryInfoContainer[0].galleryURL[1].__value__);
              } if (item.galleryInfoContainer[0].galleryURL[2].__value__ !== undefined) {
                URLs.push(item.galleryInfoContainer[0].galleryURL[2].__value__);
              }
            }

            data.push({
              ebay_id: item.itemId[0],
              search_keyword: result.job.keywords,
              title: item.title[0],
              currency_code: item.sellingStatus[0].convertedCurrentPrice[0]['@currencyId'],
              price: item.sellingStatus[0].convertedCurrentPrice[0].__value__,
              listing_type: item.listingInfo[0].listingType[0],
              condition: item.condition !== undefined
                ? parseInt(item.condition[0].conditionId[0], 10)
                : null,
              seller_name: item.sellerInfo !== undefined
              && item.sellerInfo[0].sellerUserName !== undefined
                ? item.sellerInfo[0].sellerUserName[0]
                : null,
              seller_feedback: item.sellerInfo !== undefined
              && item.sellerInfo[0].feedbackScore !== undefined
                ? parseInt(item.sellerInfo[0].feedbackScore[0], 10)
                : null,
              view_url: item.viewItemURL !== undefined ? item.viewItemURL[0] : null,
              channel: result.job.channel._id,
              category: result.job.category._id,
              image: URLs,
              listing_started: item.listingInfo !== undefined
                ? new Date(item.listingInfo[0].startTime[0])
                : null,
              listing_ended: item.listingInfo !== undefined
                ? new Date(item.listingInfo[0].endTime[0])
                : null
            });

            imagesAsPromises.push(new Promise((resolve) => {
              if (URLs.length === 0) {
                resolve({
                  data: null,
                  type: null,
                  url: null
                });
              } else {
                resolve(imageRequestPromise(URLs, 0));
              }
            })
              .then(res => new Promise((resolve) => {
                if (res.isFailed === true) {
                  resolve(imageRequestPromise(URLs, res.id));
                } else if (res.isCorrupted === true) {
                  if (URLs[res.id + 1] !== undefined) {
                    resolve(imageRequestPromise(URLs, res.id + 1));
                  } else {
                    resolve({
                      data: null,
                      type: null,
                      url: URLs[res.id]
                    });
                  }
                } else {
                  resolve(res);
                }
              }))
              .then(res => new Promise((resolve) => {
                if (res.isFailed === true) {
                  resolve(imageRequestPromise(URLs, res.id));
                } else if (res.isCorrupted === true) {
                  if (URLs[res.id + 1] !== undefined) {
                    resolve(imageRequestPromise(URLs, res.id + 1));
                  } else {
                    resolve({
                      data: null,
                      type: null,
                      url: URLs[res.id]
                    });
                  }
                } else {
                  resolve(res);
                }
              }))
              .then(res => new Promise((resolve) => {
                if (res.isFailed === true) {
                  resolve(imageRequestPromise(URLs, res.id));
                } else if (res.isCorrupted === true) {
                  if (URLs[res.id + 1] !== undefined) {
                    resolve(imageRequestPromise(URLs, res.id + 1));
                  } else {
                    resolve({
                      data: null,
                      type: null,
                      url: URLs[res.id]
                    });
                  }
                } else {
                  resolve(res);
                }
              }))
              .then(res => new Promise((resolve) => {
                if (res.isFailed === true) {
                  resolve({
                    data: null,
                    type: null,
                    url: URLs[res.id]
                  });
                } else if (res.isCorrupted === true) {
                  resolve({
                    data: null,
                    type: null,
                    url: URLs[res.id]
                  });
                } else {
                  resolve(res);
                }
              })));
          }
        }

        const update = { current_page: result.savedPageNumber, status: 'Queued' };

        if ((result.savedPageNumber >=
            parseInt(result.data[0].paginationOutput[0].totalPages[0], 10))
          || result.savedPageNumber === 100) {
          if (result.job.search.is_initial
            && result.job.use_extended_initial
            && result.savedPageNumber === 100
            && lastItemEndDate !== null) {
            update.status = 'Queued';
            update.current_page = 0;
            update.search_time_offset = lastItemEndDate;
          } else {
            update.status = 'Finished';
          }
        }

        return Promise.all(imagesAsPromises)
          .then(images => {
            event.sender.send('ebay-job-handler-response', data); // TODO: debug

            ebayJobHandler.logger.info('[eBay Job Handler] Parsed data:'); // DEBUG
            ebayJobHandler.logger.info(data);

            if (data.length !== 0) {
              ebayJobHandler.logger.info('[eBay Job Handler] Images saved!'); // DEBUG

              // eslint-disable-next-line no-plusplus
              for (let i = 0; i < data.length; i++) {
                data[i].image = {
                  url: images[i].url,
                  data: images[i].data,
                  contentType: images[i].type
                };
              }

              ebayJobHandler.logger.info('[eBay Job Handler] Data saved!'); // DEBUG
              return models.EbayDataCompletedSchema.insertMany(data);
            }

            return null;
          })
          .then(() => new Promise((resolve, reject) => {
            result.job.status = update.status;
            result.job.current_page = update.current_page;
            result.job.results_fetched = result.job.results_fetched + data.length;
            result.job.duplicates_fetched = result.job.duplicates_fetched
              + (resultCount - data.length);

            if (update.search_time_offset !== undefined) {
              result.job.search_time_offset = update.search_time_offset;
            }

            result.job.save(err => {
              if (err) {
                reject(err);
              } else {
                ebayJobHandler.logger.info('[eBay Job Handler] Job updated!'); // DEBUG
                resolve(null);
              }
            });
          }))
          .then(() => new Promise((resolve, reject) => {
            result.job.search.total_results_fetched = result.job.search.total_results_fetched
              + data.length;
            result.job.search.total_duplicates_fetched = result.job.search.total_duplicates_fetched
              + (resultCount - data.length);
            result.job.search.last_search_date = new Date();

            result.job.search.save(err => {
              if (err) {
                reject(err);
              } else {
                ebayJobHandler.logger.info('[eBay Job Handler] Search updated!'); // DEBUG
                resolve(null);
              }
            });
          }))
          .then(() => {
            ebayJobHandler.isActive = false;
            ebayJobHandler.duplicates = null;
            return null;
          });
      }

      if (ebayJobHandler.isQueueEmpty === false) {
        ebayJobHandler.logger.info('[eBay Job Handler] >> Stopped <<'); // DEBUG
      }
      ebayJobHandler.isQueueEmpty = true;
      ebayJobHandler.isActive = false;
      ebayJobHandler.duplicates = null;
      return models.mongoose.close();
    })
    .catch(err => {
      ebayJobHandler.logger.info('[eBay Job Handler] Error:'); // DEBUG
      ebayJobHandler.logger.error(err); // DEBUG

      // if (err[0] !== undefined) {
      //   console.log('Error info:');
      //   console.log(err[0].errorMessage[0].error[0].message[0]);
      // }

      ebayJobHandler.isActive = false;
      ebayJobHandler.duplicates = null;
      event.sender.send('ebay-job-handler-error', err.name !== undefined && err.message !== undefined
        ? `${err.name}: ${err.message}`
        : err[0].errorMessage[0].error[0].message[0]);
    });
});

export default ebayJobHandler;
