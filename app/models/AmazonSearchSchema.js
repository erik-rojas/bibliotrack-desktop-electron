import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AmazonSearchSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  is_asin: {
    type: Boolean,
    required: true
  },
  searched_count: {
    type: Number,
    required: true,
    default: 0
  },
  search_items: [
    { type: Schema.Types.ObjectId, ref: 'AmazonSearchItem', required: true }
  ],
  search_jobs: [
    { type: Schema.Types.ObjectId, ref: 'AmazonSearchJob', required: true }
  ],
  channels: [
    { type: Schema.Types.ObjectId, ref: 'AmazonChannel', required: true }
  ],
  data: [
    { type: Schema.Types.ObjectId, ref: 'AmazonData', required: true }
  ],
  searched_at: {
    type: Date,
    required: false,
    default: null
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default AmazonSearchSchema;
