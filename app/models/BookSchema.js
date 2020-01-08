import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const SerialNumberSchema = new Schema({ serial_number: String, type: String });

const BookSchema = new Schema({
  cover: {
    data: { type: Buffer, default: null },
    contentType: { type: String, default: null },
    required: false
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: Schema.Types.ObjectId,
    ref: 'BookLanguage',
    required: false,
    index: true,
    default: null
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'BookAuthor',
    required: false,
    index: true,
    default: null
  },
  additional_authors: [
    { type: Schema.Types.ObjectId, ref: 'BookAuthor', required: true }
  ],
  year: {
    type: Number,
    required: false,
    index: true,
    default: null
  },
  publisher: {
    type: Schema.Types.ObjectId,
    ref: 'BookPublisher',
    required: false,
    index: true,
    default: null
  },
  series: {
    type: String,
    required: false,
    index: true,
    default: null
  },
  series_number: {
    type: Number,
    required: false,
    default: null
  },
  isbn_10: {
    type: String,
    required: false,
    index: true,
    default: null
  },
  isbn_13: {
    type: String,
    required: false,
    index: true,
    default: null
  },
  asin: {
    type: String,
    required: false,
    index: true,
    default: null
  },
  additional_serial_numbers: [
    SerialNumberSchema
  ],
  notes: {
    type: String,
    required: false,
    default: null
  },
  cover_price: {
    type: Schema.Types.Decimal,
    required: false,
    default: null
  },
  avg_price: {
    type: Schema.Types.Decimal,
    required: false,
    default: null
  },
  min_price: {
    type: Schema.Types.Decimal,
    required: false,
    default: null
  },
  max_price: {
    type: Schema.Types.Decimal,
    required: false,
    default: null
  },
  ebay_keywords: [
    { type: Schema.Types.ObjectId, ref: 'BookEbayKeyword', required: true }
  ],
  amazon_data: [
    { type: Schema.Types.ObjectId, ref: 'BookAmazonData', required: true }
  ],
  ebay_data_completed_approved: [
    { type: Schema.Types.ObjectId, ref: 'EbayDataCompleted', required: true }
  ],
  ebay_data_completed_rejected: [
    { type: Schema.Types.ObjectId, ref: 'EbayDataCompleted', required: true }
  ],
  ebay_data_completed_pending: [
    { type: Schema.Types.ObjectId, ref: 'EbayDataCompleted', required: true }
  ]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  underscored: true,
  usePushEach: true
});

export default BookSchema;
