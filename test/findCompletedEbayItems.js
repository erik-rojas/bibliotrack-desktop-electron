import EbayAPI from '../app/utils/EbayAPI';
import moment from 'moment';

const ebayClient = new EbayAPI({
  appName: 'MauroUrr-Base-PRD-138c4f481-a44fac72'
});

// 132486500660,142688317137,132507747109
ebayClient.findCompletedItems(
  '132486500660', moment(new Date()).toISOString(), 1,
  (error, response, body) => {
    if (error) {
      reject(error);
    } else {
      const data = JSON.parse(body).findCompletedItemsResponse;

      console.log('[eBay Job Handler] Response:');
      console.log(body);
    }
  }
);

// ebayClient.findCompletedItems('142688317137', 1, (error, response, body) => {
//   // console.log(response);
//   console.log(body);
// });
