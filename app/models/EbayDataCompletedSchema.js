import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const EbayDataCompletedSchema = new Schema({
  ebay_id: {
    type: String,
    required: true,
    index: true
  },
  search_keyword: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  currency_code: {
    type: String,
    required: true
  },
  price: {
    type: Schema.Types.Decimal128,
    required: true,
    index: true
  },
  listing_type: {
    type: String,
    required: true
  },
  condition: {
    type: Number,
    required: false,
    default: null
  },
  seller_name: {
    type: String,
    required: false,
    default: null,
    index: true
  },
  seller_feedback: {
    type: Number,
    required: false,
    default: null
  },
  view_url: {
    type: String,
    required: false,
    default: null
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'EbayCategory',
    required: false,
    index: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'EbayChannel',
    required: false,
    index: true
  },
  image: {
    url: { type: String, default: null },
    data: { type: Buffer, default: null },
    contentType: { type: String, default: null, index: true },
    required: false
  },
  listing_started: {
    type: Date,
    required: false,
    default: null,
    index: true
  },
  listing_ended: {
    type: Date,
    required: false,
    default: null,
    index: true
  },
  is_fake: {
    type: Boolean,
    required: false,
    default: false,
    index: true
  },
  is_spam: {
    type: Boolean,
    required: false,
    default: false,
    index: true
  },
  is_needed_checking: {
    type: Boolean,
    required: false,
    default: false,
    index: true
  },
  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: false,
    default: null,
    index: true
  },
  created_at: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  }
});

EbayDataCompletedSchema.index({ title: 'text' });

export default EbayDataCompletedSchema;
