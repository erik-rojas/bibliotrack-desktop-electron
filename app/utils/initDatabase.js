// @flow
import Models from '../models/index';

const initDatabase = (mongoose: any, callback: (error: any) => void) => {
  const models: any = Models(mongoose);

  return new Promise((resolve, reject) => {
    models.EbayChannelSchema.find({}, (error, ebayChannels) => {
      if (error) {
        reject(error);
      } else {
        models.EbayCategorySchema.find({}, (err, ebayCategories) => {
          if (err) {
            reject(err);
          } else {
            models.AmazonChannelSchema.find({}, (er, amazonChannels) => {
              if (er) {
                reject(er);
              } else {
                models.BookLanguageSchema.find({}, (e, bookLanguages) => {
                  if (e) {
                    reject(e);
                  } else {
                    resolve({
                      ebayChannels, ebayCategories, amazonChannels, bookLanguages
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  })
    .then(defaults => {
      if (defaults.amazonChannels === null || defaults.amazonChannels.length === 0) {
        return models.AmazonChannelSchema.insertMany([
          { name: 'amazon.co.uk', url: 'http://www.amazon.co.uk/' },
          { name: 'amazon.de', url: 'http://www.amazon.de/' },
          { name: 'amazon.it', url: 'http://www.amazon.it/' },
          { name: 'amazon.fr', url: 'http://www.amazon.fr/' },
          { name: 'amazon.es', url: 'http://www.amazon.es/' },
          { name: 'amazon.com', url: 'http://www.amazon.com/' }
        ])
          .then(() => defaults);
      }

      return defaults;
    })
    .then(defaults => {
      if (defaults.ebayChannels === null || defaults.ebayChannels.length === 0) {
        return models.EbayChannelSchema.insertMany([
          { name: 'ebay.co.uk', url: 'http://www.ebay.co.uk/' },
          { name: 'ebay.de', url: 'http://www.ebay.de/' },
          { name: 'ebay.it', url: 'http://www.ebay.it/' },
          { name: 'ebay.fr', url: 'http://www.ebay.fr/' },
          { name: 'ebay.es', url: 'http://www.ebay.es/' },
          { name: 'ebay.com', url: 'http://www.ebay.com/' }
        ])
          .then(() => defaults);
      }

      return defaults;
    })
    .then(defaults => {
      if (defaults.ebayCategories === null || defaults.ebayCategories.length === 0) {
        return models.EbayCategorySchema.insertMany([
          { name: 'Books', ebay_id: '267' },
          { name: 'Comic Books', ebay_id: '63' }
        ])
          .then(() => defaults);
      }

      return defaults;
    })
    .then(defaults => {
      if (defaults.bookLanguages === null || defaults.bookLanguages.length === 0) {
        return models.BookLanguageSchema.insertMany([
          { name: 'English', short_code: 'EN' },
          { name: 'Italian', short_code: 'IT' },
          { name: 'French', short_code: 'FR' },
          { name: 'German', short_code: 'GER' },
          { name: 'Spanish', short_code: 'SPA' },
          { name: 'Multilingual', short_code: 'MULTI' }
        ])
          .then(() => defaults);
      }

      return defaults;
    })
    .then(() => callback(false))
    .catch((error) => {
      console.log(error);
      callback(error);
    });
};

export default initDatabase;
