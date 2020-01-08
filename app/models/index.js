// @flow
import AmazonSearchSchema from './AmazonSearchSchema';
import AmazonSearchItemSchema from './AmazonSearchItemSchema';
import AmazonSearchJobSchema from './AmazonSearchJobSchema';
import AmazonDataSchema from './AmazonDataSchema';
import AmazonChannelSchema from './AmazonChannelSchema';

import EbaySearchSchema from './EbaySearchSchema';
import EbaySearchJobSchema from './EbaySearchJobSchema';
import EbayDataCompletedSchema from './EbayDataCompletedSchema';
import EbayChannelSchema from './EbayChannelSchema';
import EbayCategorySchema from './EbayCategorySchema';

import BookSchema from './BookSchema';
import BookAuthorSchema from './BookAuthorSchema';
import BookLanguageSchema from './BookLanguageSchema';
import BookPublisherSchema from './BookPublisherSchema';
import BookEbayKeywordSchema from './BookEbayKeywordSchema';
import BookAmazonDataSchema from './BookAmazonDataSchema';

const Models = (mongoose: any = null) => {
  if (mongoose === null) return null;

  return {
    AmazonSearchSchema: mongoose === null
      ? null : mongoose.model('AmazonSearch', AmazonSearchSchema, 'amazon_searches'),
    AmazonSearchItemSchema: mongoose === null
      ? null : mongoose.model('AmazonSearchItem', AmazonSearchItemSchema, 'amazon_search_items'),
    AmazonSearchJobSchema: mongoose === null
      ? null : mongoose.model('AmazonSearchJob', AmazonSearchJobSchema, 'amazon_search_jobs'),
    AmazonDataSchema: mongoose === null
      ? null : mongoose.model('AmazonData', AmazonDataSchema, 'amazon_data'),
    AmazonChannelSchema: mongoose === null
      ? null : mongoose.model('AmazonChannel', AmazonChannelSchema, 'amazon_channels'),
    EbaySearchSchema: mongoose === null
      ? null : mongoose.model('EbaySearch', EbaySearchSchema, 'ebay_searches'),
    EbaySearchJobSchema: mongoose === null
      ? null : mongoose.model('EbaySearchJob', EbaySearchJobSchema, 'ebay_search_jobs'),
    EbayDataCompletedSchema: mongoose === null
      ? null : mongoose.model('EbayDataCompleted', EbayDataCompletedSchema, 'ebay_data_completed'),
    EbayChannelSchema: mongoose === null
      ? null : mongoose.model('EbayChannel', EbayChannelSchema, 'ebay_channels'),
    EbayCategorySchema: mongoose === null
      ? null : mongoose.model('EbayCategory', EbayCategorySchema, 'ebay_categories'),
    BookSchema: mongoose === null
      ? null : mongoose.model('Book', BookSchema, 'books'),
    BookEbayKeywordSchema: mongoose === null
      ? null : mongoose.model('BookEbayKeyword', BookEbayKeywordSchema, 'book_ebay_keywords'),
    BookAmazonDataSchema: mongoose === null
      ? null : mongoose.model('BookAmazonData', BookAmazonDataSchema, 'book_amazon_data'),
    BookAuthorSchema: mongoose === null
      ? null : mongoose.model('BookAuthor', BookAuthorSchema, 'book_authors'),
    BookLanguageSchema: mongoose === null
      ? null : mongoose.model('BookLanguage', BookLanguageSchema, 'book_languages'),
    BookPublisherSchema: mongoose === null
      ? null : mongoose.model('BookPublisher', BookPublisherSchema, 'book_publishers'),
    mongoose
  };
};

export default Models;
