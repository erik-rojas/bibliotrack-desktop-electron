const config = require('./../config.json');

const fetchData = (mongoClient, mongoModels, sqlClient, sqlModels, pageNumber) => {
  return new Promise((resolve, reject) => {
    mongoModels.EbayDataCompletedSchema
    .find()
    .skip(config.itemsPerFillQuery * (pageNumber - 1))
    .limit(config.itemsPerFillQuery)
    .populate('category')
    .populate('channel')
    .sort({ created_at: 1 })
    .lean()
    .exec((e, data) => {
      if (e) {
        reject(e);
      } else {
        resolve(sqlClient.sync()
          .then(() => {
            const prepared = data.map(item => ({
              id: null,
              ebay_id: item.ebay_id,
              search_keyword: item.search_keyword,
              title: item.title,
              currency_code: item.currency_code,
              price: parseFloat(item.price.toString()),
              listing_type: item.listing_type,
              condition: item.condition,
              seller_name: item.seller_name,
              seller_feedback: item.seller_feedback,
              view_url: item.view_url,
              category: item.category.name,
              channel: item.channel.name,
              image_data: item.image.data === null ? null : item.image.data.toString(),
              image_content_type: item.image.contentType,
              image_url: item.image.url,
              listing_started: item.listing_started === null ? null : item.listing_started,
              listing_ended: item.listing_ended === null ? null : item.listing_ended,
              is_fake: item.is_fake,
              is_spam: item.is_spam,
              is_needed_checking: item.is_needed_checking,
              book: null,
              created_at: item.created_at
            }));

            return sqlModels.EbayDataCompleted.bulkCreate(prepared, { raw: true, fields: [
                'id',
                'ebay_id',
                'search_keyword',
                'title',
                'currency_code',
                'price',
                'listing_type',
                'condition',
                'seller_name',
                'seller_feedback',
                'view_url',
                'category',
                'channel',
                'image_data',
                'image_content_type',
                'image_url',
                'listing_started',
                'listing_ended',
                'is_fake',
                'is_spam',
                'is_needed_checking',
                'book',
                'created_at'
              ]});
          })
          .then(() => {
            console.log(`Page #${pageNumber}: Done.`);
          })
        );
      }
    });
  })
};

export default fetchData;
