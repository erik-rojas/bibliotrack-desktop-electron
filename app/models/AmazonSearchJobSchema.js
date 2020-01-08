import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AmazonSearchJobSchema = new Schema({
  isbn_asin: {
    type: String,
    required: true
  },
  // "Queued", "Finished", "Failed"
  status: {
    type: String,
    required: true,
    index: true,
    default: 'Queued'
  },
  status_code: {
    type: String,
    required: false,
    default: null
  },
  search: {
    type: Schema.Types.ObjectId,
    ref: 'AmazonSearch',
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'AmazonChannel',
    required: true
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default AmazonSearchJobSchema;
