// @flow
import { Sequelize } from 'sequelize';

import Image from './Image';

import AmazonSearch from './AmazonSearch';
import AmazonSearchChannel from './AmazonSearchChannel';
import AmazonSearchItem from './AmazonSearchItem';
import AmazonSearchJob from './AmazonSearchJob';
import AmazonData from './AmazonData';
import AmazonChannel from './AmazonChannel';

import Book from './Book';
import BookAmazonData from './BookAmazonData';
import BookAuthor from './BookAuthor';
import BookAuthors from './BookAuthors';
import BookEbayKeyword from './BookEbayKeyword';
import BookLanguage from './BookLanguage';
import BookPublisher from './BookPublisher';
import BookIdentifier from './BookIdentifier';

import EbaySearch from './EbaySearch';
import EbaySearchChannel from './EbaySearchChannel';
import EbaySearchCategory from './EbaySearchCategory';
import EbaySearchJob from './EbaySearchJob';
import EbayChannel from './EbayChannel';
import EbayCategory from './EbayCategory';
import EbayDataCompleted from './EbayDataCompleted';

const ModelsSqlite = (sequelize: any = null) => {
  if (sequelize === null) return null;

  const models = {
    sequelize: sequelize,
    Image: Image(sequelize, Sequelize),
    AmazonSearch: AmazonSearch(sequelize, Sequelize),
    AmazonSearchChannel: AmazonSearchChannel(sequelize, Sequelize),
    AmazonSearchItem: AmazonSearchItem(sequelize, Sequelize),
    AmazonSearchJob: AmazonSearchJob(sequelize, Sequelize),
    AmazonData: AmazonData(sequelize, Sequelize),
    AmazonChannel: AmazonChannel(sequelize, Sequelize),
    Book: Book(sequelize, Sequelize),
    BookAmazonData: BookAmazonData(sequelize, Sequelize),
    BookAuthor: BookAuthor(sequelize, Sequelize),
    BookAuthors: BookAuthors(sequelize, Sequelize),
    BookEbayKeyword: BookEbayKeyword(sequelize, Sequelize),
    BookLanguage: BookLanguage(sequelize, Sequelize),
    BookPublisher: BookPublisher(sequelize, Sequelize),
    BookIdentifier: BookIdentifier(sequelize, Sequelize),
    EbaySearch: EbaySearch(sequelize, Sequelize),
    EbaySearchChannel: EbaySearchChannel(sequelize, Sequelize),
    EbaySearchCategory: EbaySearchCategory(sequelize, Sequelize),
    EbaySearchJob: EbaySearchJob(sequelize, Sequelize),
    EbayChannel: EbayChannel(sequelize, Sequelize),
    EbayCategory: EbayCategory(sequelize, Sequelize),
    EbayDataCompleted: EbayDataCompleted(sequelize, Sequelize), 
  };

  models.AmazonSearch.belongsToMany(models.AmazonChannel, { as: 'AmazonSearchChannels',
    through: 'amazon_search_channels', foreignKey: 'amazon_search_id' });
  models.AmazonSearchItem.belongsTo(models.AmazonSearch);
  models.AmazonSearchJob.belongsTo(models.AmazonSearch);
  models.AmazonSearchJob.belongsTo(models.AmazonChannel);
  models.AmazonData.belongsTo(models.AmazonSearch);
  models.AmazonData.belongsTo(models.AmazonChannel);

  models.Book.belongsToMany(models.Image, { as: 'BookImages', through: 'books_images', foreignKey: 'book_id' });
  models.Book.belongsToMany(models.BookAuthor, { as: 'BookAuthors', through: 'books_authors', foreignKey: 'book_id' });
  models.Book.belongsToMany(models.BookEbayKeyword, { as: 'BookEbayKeywords', through: 'books_ebay_keywords', foreignKey: 'book_id' });

  const booksEbayData = sequelize.define('books_ebay_data', {
    type: { // PENDING or APPROVED or REJECTED
      type: Sequelize.STRING,
      allowNull: false,
      get() {
        return this.getDataValue('type');
      },
      set(value) {
        this.setDataValue('type', value);
      }
    }
  }, {
    underscored: true
  });

  models.Book.belongsToMany(models.EbayDataCompleted, { as: 'BookEbayData', through: booksEbayData });

  models.Book.belongsTo(models.BookLanguage);
  models.Book.belongsTo(models.BookPublisher);
  models.Book.belongsTo(models.BookIdentifier);

  models.Book.hasMany(models.BookAmazonData);

  models.EbaySearch.belongsToMany(models.EbayChannel,
    { as: 'EbaySearchChannels', through: 'ebay_search_channels', foreignKey: 'ebay_search_id' });
  models.EbaySearch.belongsToMany(models.EbayCategory,
    { as: 'EbaySearchCategories', through: 'ebay_search_categories', foreignKey: 'ebay_search_id' });

  models.EbaySearchJob.belongsTo(models.EbaySearch);
  models.EbaySearchJob.belongsTo(models.EbayChannel);
  models.EbaySearchJob.belongsTo(models.EbayCategory);

  models.EbaySearch.hasOne(models.EbaySearchJob, { foreignKey: 'ebay_search_id' });

  models.EbayDataCompleted.belongsTo(models.EbayChannel);
  models.EbayDataCompleted.belongsTo(models.EbayCategory);
  models.EbayDataCompleted.belongsTo(models.Image);

  return models;
};

export default ModelsSqlite;
