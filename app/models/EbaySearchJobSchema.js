import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const EbaySearchJobSchema = new Schema({
  status: {
    // "Queued", "Finished", "Failed"
    type: String,
    required: true,
    index: true,
    default: 'Queued'
  },
  current_page: {
    type: Number,
    required: true,
    default: 0
  },
  search_time_offset: {
    type: Date,
    required: false,
    default: null
  },
  keywords: {
    type: String,
    required: false,
    index: true,
    default: ''
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
  results_fetched: {
    type: Number,
    required: true,
    default: 0
  },
  duplicates_fetched: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'EbayCategory',
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'EbayChannel',
    required: true
  },
  search: {
    type: Schema.Types.ObjectId,
    ref: 'EbaySearch',
    required: true
  },
  created_at: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  }
});

export default EbaySearchJobSchema;
