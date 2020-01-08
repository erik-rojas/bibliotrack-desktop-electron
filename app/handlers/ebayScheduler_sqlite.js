import EventEmitter from 'events';
import moment from 'moment';
import winston from 'winston';

import Models from '../models/index_sqlite';
import getConnection from '../utils/getConnection';
import getSettingsDir from '../utils/getSettingsDir';

const ebayScheduler = new EventEmitter();
ebayScheduler.isActive = false;
ebayScheduler.isWorking = false;
ebayScheduler.ebayJobHandler = null;

ebayScheduler.on('start', (event, ebayJobHandler) => {
  if (!ebayScheduler.isActive) {
    getConnection((error, mongoose, amazonClient, ebayClient, useLog, nativeClient, databaseName, fakePeriod,
        sequelize) => {
      if (!error) {
        ebayScheduler.isActive = true;
        ebayScheduler.isWorking = false;
        ebayScheduler.ebayJobHandler = ebayJobHandler;
        ebayScheduler.logger = winston.createLogger({
          level: 'info',
          format: winston.format.json(),
          transports: [
            new winston.transports.Console()
          ]
        });

        if (useLog === true) {
          ebayScheduler.logger.add(new winston.transports.File({ filename: `${getSettingsDir()}/../log.txt` }));
        }

        ebayScheduler.models = Models(sequelize);
        ebayScheduler.timer = setInterval(() => ebayScheduler.emit('run', event), 20000);

        ebayScheduler.logger.info('[eBay Scheduler] >> Started <<'); // DEBUG
        ebayScheduler.ebayJobHandler.emit('start', event);
      } else {
        event.sender.send('ebay-scheduler-error', error);
      }
    });
  }
});

ebayScheduler.on('stop', () => {
  ebayScheduler.isActive = false;
  clearInterval(ebayScheduler.timer);

  // ebayScheduler.logger.info('[eBay Scheduler] >> Stopped <<'); // DEBUG
});

ebayScheduler.on('start-handler', (event, ebayJobHandler) => {
  if (ebayScheduler.ebayJobHandler !== null) {
    ebayScheduler.ebayJobHandler.emit('start', event);
  } else {
    ebayScheduler.ebayJobHandler = ebayJobHandler;
    ebayScheduler.ebayJobHandler.emit('start', event);
  }
});

ebayScheduler.on('stop-handler', () => {
  if (ebayScheduler.ebayJobHandler !== null) {
    ebayScheduler.ebayJobHandler.emit('stop');
  }
});

ebayScheduler.on('run', (event) => {
  if (ebayScheduler.isActive) {
    if (!ebayScheduler.isWorking) {
      ebayScheduler.emit('handle', event);
    }
  } else {
    clearInterval(ebayScheduler.timer);
  }
});

ebayScheduler.on('handle', (event) => {
  ebayScheduler.isWorking = true;
  const models = ebayScheduler.models;

  models.EbaySearchJob.find({ where: { status: 'Queued' } })
  .then(jobs => new Promise((resolve, reject) => {
      if (jobs.length === 0) {
          resolve(true);
      }
      else {
          resolve(false);
      }
  }))
  .then(condition => {
    if (condition === true) {
      return models.EbaySearch.find({ where: { is_active: true }, 
        include: [{ model: models.EbaySearchJob }, 
                  { model: models.EbayCategory, as: 'EbaySearchCategories' }, 
                  { model: models.EbayChannel, as: 'EbaySearchChannels' }]
      })
      .then(data => new Promise((resolve, reject) => {
        resolve(data);
      }))
      .then(searches => {
        ebayScheduler.logger.info('[eBay Scheduler] Fetching searches...'); // DEBUG
        let search = null;

        // eslint-disable-next-line no-plusplus
        for (let index = 0; searches.length > index; index ++) {
          if (searches[index].searched_at === null
            || (searches[index].search_period > 0
            && (moment(new Date(searches[index].searched_at))
              .add(searches[index].search_period, 'hours'))
              .isBefore(Date.now()))) {
            search = searches[index];
            break;
          }
        }

        if (search !== null) {
          let addJobs = false;
          let isInitial = true;

          if (search.searched_at === null) {
            addJobs = true;
          } else if (search.search_period > 0 && (moment(new Date(search.searched_at)).add(search.search_period, 'hours'))
            .isBefore(Date.now())) {
            addJobs = true;
            isInitial = false;
          }

          if (addJobs) {
            ebayScheduler.logger.info('[eBay Scheduler] Active search:'); // DEBUG
            ebayScheduler.logger.info(search); // DEBUG

            const ids = search.ebay_search_job.map(job => job._id);

            return models.EbaySearchJob.destroy({ where: { id: { $in: ids } } })
              .then(() => {
                if (search.EbaySearchChannels.length > 0 && search.EbaySearchCategories.length > 0) {
                  const jobsData = [];
                  const now = new Date();

                  search.EbaySearchChannels.forEach(channel => {
                    search.EbaySearchCategories.forEach(category => {
                      jobsData.push({
                        status: 'Queued',
                        current_page: 0,
                        search_time_offset: now,
                        keywords: search.keywords,
                        // min_price: search.min_price,
                        // max_price: search.max_price,
                        use_extended_initial: search.use_extended_initial,
                        use_smart_stop: search.use_smart_stop,
                        search: search.id,
                        category: category.id,
                        channel: channel.id
                      });
                    });
                  });

                  search.is_initial = isInitial;
                  search.searched_at = now;

                  return models.EbaySearchJob.bulkCreate(jobsData)
                    .then(jobs => new Promise((resolve, reject) => {
                      search.ebay_search_job = jobs;
                      search.save(err => {
                        if (err) {
                          reject(err);
                        } else {
                          resolve(null);
                        }
                      });
                    }))
                    .then(() => (ebayScheduler.ebayJobHandler !== null
                      ? ebayScheduler.ebayJobHandler.emit('start', event)
                      : null));
                }

                return null;
              })
              .catch(err => {
                ebayScheduler.logger.info('[eBay Scheduler] Error:'); // DEBUG
                ebayScheduler.logger.error(err); // DEBUG

                ebayScheduler.isActive = false;
                ebayScheduler.isWorking = false;
                event.sender.send('ebay-scheduler-error', err);
              });
          }

          return null;
        }

        return null;
      });
    }

    return null;
  })
  .then(() => {
    ebayScheduler.isWorking = false;
    return null;
  })
  .catch(err => {
    ebayScheduler.logger.info('[eBay Scheduler] Error:'); // DEBUG
    ebayScheduler.logger.error(err); // DEBUG

    ebayScheduler.isActive = false;
    ebayScheduler.isWorking = false;
    event.sender.send('ebay-scheduler-error', err);
  });
});

export default ebayScheduler;
