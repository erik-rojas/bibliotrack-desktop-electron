import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const EbaySearchSchema = new Schema({
  keywords: {
    type: String,
    required: false,
    index: true,
    default: ''
  },
  // "Completed" or "Live"
  type: {
    type: String,
    required: true,
    index: true,
    default: 'Completed'
  },
  // Days (0 - disabled)
  search_period: {
    type: Number,
    required: false,
    default: 7
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
  is_active: {
    type: Boolean,
    required: true,
    default: false
  },
  is_initial: {
    type: Boolean,
    required: true,
    default: true
  },
  use_extended_initial: {
    type: Boolean,
    required: true,
    default: false
  },
  use_smart_stop: {
    type: Boolean,
    required: true,
    default: false
  },
  total_results_fetched: {
    type: Number,
    required: true,
    default: 0
  },
  total_duplicates_fetched: {
    type: Number,
    required: true,
    default: 0
  },
  last_search_date: {
    type: Date,
    required: false,
    index: true,
    default: null
  },
  searched_at: {
    type: Date,
    required: false,
    index: true,
    default: null
  },
  channels: [
    { type: Schema.Types.ObjectId, ref: 'EbayChannel', required: true }
  ],
  categories: [
    { type: Schema.Types.ObjectId, ref: 'EbayCategory', required: true }
  ],
  search_jobs: [
    { type: Schema.Types.ObjectId, ref: 'EbaySearchJob', required: true }
  ]
});

export default EbaySearchSchema;
