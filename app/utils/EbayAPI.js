import request from 'request';

class EbayAPI {
  constructor(keys: {}) {
    this.findingAPIVersion = '1.13.0';
    this.keys = keys;

    // Default values
    this.globalId = 'EBAY-IT';
    this.channelName = 'ebay.it';
    this.categoryId = 267;
    this.pageSize = 100;

    this.minPrice = null;
    this.maxPrice = null;
  }

  getGlobalId() {
    return this.globalId;
  }

  setGlobalId(globalId: string) {
    this.globalId = globalId;
  }

  getChannelName() {
    return this.channelName;
  }

  setChannelName(channelName: string) {
    this.channelName = channelName;
  }

  getCategoryId() {
    return this.categoryId;
  }

  setCategoryId(categoryId: string) {
    this.categoryId = categoryId;
  }

  setMinPrice(price: any) {
    this.minPrice = price;
  }

  getMinPrice() {
    return this.minPrice;
  }

  setMaxPrice(price: any) {
    this.maxPrice = price;
  }

  getMaxPrice() {
    return this.maxPrice;
  }

  findCompletedItems(keywords: string | null, endTimeTo: string, page: number, callback) {
    let url = `http://svcs.${this.channelName}/services/search/FindingService/v1`
      + '?OPERATION-NAME=findCompletedItems'
      + `&SERVICE-VERSION=${this.findingAPIVersion}`
      + `&SECURITY-APPNAME=${this.keys.appName}`
      + `&GLOBAL-ID=${this.globalId}`
      + '&RESPONSE-DATA-FORMAT=JSON'
      + '&REST-PAYLOAD'
      + '&itemFilter(0).name=SoldItemsOnly'
      + '&itemFilter(0).value=true'
      + '&itemFilter(1).name=HideDuplicateItems'
      + '&itemFilter(1).value=true'
      + '&itemFilter(2).name=ListingType'
      + '&itemFilter(2).value=All'
      + '&itemFilter(3).name=EndTimeTo'
      + `&itemFilter(3).value=${endTimeTo}`
      + '&itemFilter(4).name=ListedIn'
      + `&itemFilter(4).value=${this.globalId}`;

    let num = 5;
    if (this.minPrice !== null) {
      url += `&itemFilter(${num}).name=MinPrice`
        + `&itemFilter(${num}).value=${this.minPrice}`;

      // eslint-disable-next-line no-plusplus
      num++;
    }

    if (this.maxPrice !== null) {
      url += `&itemFilter(${num}).name=MaxPrice`
        + `&itemFilter(${num}).value=${this.maxPrice}`;
    }

    url += '&sortOrder=EndTimeSoonest'
      + `&keywords=${keywords === null || keywords === undefined ? '' : keywords}`
      + `&categoryId=${this.categoryId}`
      + '&outputSelector(0)=PictureURLLarge'
      + '&outputSelector(1)=SellerInfo'
      + '&outputSelector(2)=GalleryInfo'
      + `&paginationInput.entriesPerPage=${this.pageSize}`
      + `&paginationInput.pageNumber=${page}`;

    request(url, (error, response, body) => {
      callback(error, response, body);
    });
  }

  findItemsByProduct(productId: string, page: number, callback) {
    const url = 'http://svcs.ebay.com/services/search/FindingService/v1'
    + '?OPERATION-NAME=findItemsByProduct'
    + `&SERVICE-VERSION=${this.findingAPIVersion}`
    + `&SECURITY-APPNAME=${this.keys.appName}`
    + `&GLOBAL-ID=${this.globalId}`
    + '&RESPONSE-DATA-FORMAT=JSON'
    + '&REST-PAYLOAD'
    + `&paginationInput.entriesPerPage=${this.pageSize}`
    + `&paginationInput.pageNumber=${page}`
    + '&productId.@type=ReferenceID'
    + `&productId=${productId}`;

    request(url, (error, response, body) => {
      callback(error, response, body);
    });
  }
}

export default EbayAPI;
