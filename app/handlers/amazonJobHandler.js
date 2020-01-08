import EventEmitter from 'events';

import Models from '../models/index';
import getConnection from '../utils/getConnection';
import getDefaults from '../utils/getDefaults';

const amazonJobHandler = new EventEmitter();

amazonJobHandler.on('start', (event) => {
  if (!amazonJobHandler.isActive) {
    amazonJobHandler.isActive = false;
    amazonJobHandler.isQueueEmpty = false;

    getConnection((error, mongoose, amazon) => {
      if (!error) {
        amazonJobHandler.models = Models(mongoose);
        amazonJobHandler.client = amazon;
        amazonJobHandler.timer = setInterval(() => amazonJobHandler.emit('run', event), 500);
        console.log('>> Amazon Job Handler started.');
      }
    });
  }
});

amazonJobHandler.on('stop', () => {
  amazonJobHandler.isQueueEmpty = true;
  clearInterval(amazonJobHandler.timer);
  console.log('>> Amazon Job Handler stopped.');
});

amazonJobHandler.on('run', (event) => {
  if (!amazonJobHandler.isQueueEmpty) {
    if (!amazonJobHandler.isActive) {
      amazonJobHandler.emit('handle', event);
    }
  } else {
    clearInterval(amazonJobHandler.timer);
  }
});

amazonJobHandler.on('handle', (event) => {
  const models = amazonJobHandler.models;
  const client = amazonJobHandler.client;

  amazonJobHandler.isQueueEmpty = false;
  amazonJobHandler.isActive = true;

  models.AmazonSearchJobSchema.findOne({ status: 'Queued' })
    .populate('search')
    .populate('channel')
    .sort('+created_at')
    .exec((err, data) => new Promise((resolve, reject) => {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    }))
    .then(firstJob => new Promise((resolve, reject) => {
      if (firstJob !== null) {
        models.AmazonSearchJobSchema.find({
          status: 'Queued', search: firstJob.search._id, channel: firstJob.channel._id
        })
          .populate('search')
          .populate('channel')
          .sort('+created_at')
          .limit(10)
          .exec((err, data) => {
            if (!err) {
              resolve(data);
            } else {
              reject(err);
            }
          });
      } else {
        resolve([]);
      }
    }))
    .then(jobs => {
      console.log('Amazon jobs fetched.');
      if (jobs.length > 0) {
        console.log('Amazon jobs:');
        console.log(jobs);

        const isbnsAsins = jobs.reduce((prev, curr) => `${prev},${curr.isbn_asin}`, '').trim().replace(/^,|,$/g, '');
        const ids = jobs.map(job => job._id);
        event.sender.send('amazon-search-request', isbnsAsins);

        console.log(jobs[0].search.is_asin);
        return client.itemLookup({
          idType: jobs[0].search.is_asin === false ? 'EAN' : 'ASIN',
          itemId: isbnsAsins,
          responseGroup: 'ItemAttributes,Offers,SalesRank',
          domain: `webservices.${jobs[0].channel.name}`
        }).then(results => {
          event.sender.send('amazon-search-response', results, true);

          const data = results.filter((item) => (jobs[0].search.is_asin === false
            ? !!item.ItemAttributes[0].EAN
            : !!item.ASIN)
          && !!item.ItemAttributes[0].Title)
            .map(item => ({
              title: item.ItemAttributes[0].Title[0],
              author: item.ItemAttributes[0].Author ? item.ItemAttributes[0].Author[0] : null,
              isbn_asin: jobs[0].search.is_asin === false
                ? item.ItemAttributes[0].EAN[0]
                : item.ASIN[0],
              language: item.ItemAttributes[0].Languages
                ? item.ItemAttributes[0].Languages[0].Language[0].Name[0]
                : getDefaults(jobs[0].amazon_channel_name, 'language'),
              currency_code: item.OfferSummary && item.OfferSummary[0].LowestNewPrice
                ? item.OfferSummary[0].LowestNewPrice[0].CurrencyCode[0]
                : (item.OfferSummary && item.OfferSummary[0].LowestUsedPrice
                  ? item.OfferSummary[0].LowestUsedPrice[0].CurrencyCode[0]
                  : (item.ItemAttributes[0].ListPrice
                    ? item.ItemAttributes[0].ListPrice[0].CurrencyCode[0]
                    : getDefaults(jobs[0].amazon_channel_name, 'currency'))
                ),
              new_lowest_price: item.OfferSummary && item.OfferSummary[0].LowestNewPrice
                ? Number(item.OfferSummary[0].LowestNewPrice[0].Amount[0] / 100).toString()
                : '0',
              used_lowest_price: item.OfferSummary && item.OfferSummary[0].LowestUsedPrice
                ? Number(item.OfferSummary[0].LowestUsedPrice[0].Amount[0] / 100).toString()
                : '0',
              new_count: item.OfferSummary && item.OfferSummary[0].TotalNew
                ? Number(item.OfferSummary[0].TotalNew[0])
                : 0,
              used_count: item.OfferSummary && item.OfferSummary[0].TotalUsed
                ? Number(item.OfferSummary[0].TotalUsed[0])
                : 0,
              rank: item.SalesRank
                ? Number(item.SalesRank[0])
                : 0,
              search_number: jobs[0].search.searched_count,
              search: jobs[0].search._id,
              channel: jobs[0].channel._id
            })).reduce((values, item) => {
              const prevItemIndex = values.findIndex(element =>
                element.isbn_asin === item.isbn_asin);

              if (prevItemIndex !== -1) {
                if (values[prevItemIndex].rank === 0 && item.rank !== 0) {
                  values[prevItemIndex] = item;
                } else if (item.rank !== 0 && item.rank < values[prevItemIndex].rank) {
                  values[prevItemIndex] = item;
                }

                return [...values];
              }

              return [...values, item];
            }, []);

          event.sender.send('amazon-search-response', data, false);

          return models.AmazonDataSchema.insertMany(data)
            .then(() => models.AmazonSearchJobSchema.updateMany({ _id: { $in: ids } }, { status: 'Finished', status_code: 'OK' }))
            .then(() => {
              amazonJobHandler.isActive = false;
              event.sender.send('amazon-search-handled', { id: jobs[0].search._id.toString(), finished: ids.length });
              return null;
            });
        }).catch(err => {
          event.sender.send('amazon-search-handling-error', err);

          if (err[0] && err[0].Error && err[0].Error[0].Code[0] === 'AWS.InvalidParameterValue') {
            const failedItems = [];

            err[0].Error.forEach(item => {
              if (item.Code[0] === 'AWS.InvalidParameterValue') {
                const regExp = /^([A-Z0-9]{10,20}).(?!\sis\snot\sa\svalid)/g;
                failedItems.push(item.Message[0].match(regExp)[0].trim());
              }
            });

            const failedIds = jobs.reduce((prev, job) => {
              if (failedItems.includes(job.isbn_asin)) return [...prev, job.id];
              return [...prev];
            }, []);

            models.AmazonSearchJobSchema.updateMany(
              { _id: { $in: failedIds } },
              { status: 'Failed', status_code: 'AWS.InvalidParameterValue' }
            )
              .then(() => {
                amazonJobHandler.isActive = false;
                event.sender.send('amazon-search-handled', { id: jobs[0].search._id.toString(), failed: failedIds.length });
                return null;
              }).catch(e => event.sender.send('amazon-search-handling-error', e));
          } else if (err.Error && err.Error[0].Code[0] === 'AWS.InvalidAssociate') {
            models.AmazonSearchJobSchema.updateMany(
              { _id: { $in: ids } },
              { status: 'Failed', status_code: 'AWS.InvalidAssociate' }
            )
              .then(() => {
                amazonJobHandler.isActive = false;
                event.sender.send('amazon-search-handled', { id: jobs[0].search._id.toString(), failed: ids.length });
                return null;
              }).catch(e => event.sender.send('amazon-search-handling-error', e));
          } else if (err.Error && err.Error[0].Code[0] === 'RequestThrottled') {
            setTimeout(() => { amazonJobHandler.isActive = false; }, 3000);
          } else {
            amazonJobHandler.isQueueEmpty = true;
            amazonJobHandler.isActive = false;
          }
        });
      }

      if (amazonJobHandler.isQueueEmpty === false) {
        console.log('>> Amazon Job Handler stopped.');
      }
      amazonJobHandler.isQueueEmpty = true;
      amazonJobHandler.isActive = false;
      return models.mongoose.close();
    })
    .catch(err => {
      console.log(err);
      amazonJobHandler.isActive = false;
      event.sender.send('amazon-search-handling-error', err);
    });
});

export default amazonJobHandler;
