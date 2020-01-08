import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AmazonSearchItemSchema = new Schema({
  isbn_asin: {
    type: String,
    required: true,
    index: true
  },
  search: {
    type: Schema.Types.ObjectId,
    ref: 'AmazonSearch',
    required: true
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default AmazonSearchItemSchema;
