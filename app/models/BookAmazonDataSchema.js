import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const BookAmazonDataSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  isbn_asin: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  rank: {
    type: Number,
    required: true
  },
  currency_code: {
    type: String,
    required: true
  },
  new_lowest_price: {
    type: Schema.Types.Decimal,
    required: true
  },
  used_lowest_price: {
    type: Schema.Types.Decimal,
    required: true
  },
  new_count: {
    type: Number,
    required: true
  },
  used_count: {
    type: Number,
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'AmazonChannel',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default BookAmazonDataSchema;
