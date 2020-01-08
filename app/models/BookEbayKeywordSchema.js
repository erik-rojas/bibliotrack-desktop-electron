import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const BookEbayKeywordSchema = new Schema({
  is_shared: {
    type: Boolean,
    required: true
  },
  keyword: {
    type: String,
    required: true,
    index: true
  },
  min_price: {
    type: Number,
    required: false,
    default: null
  },
  max_price: {
    type: Number,
    required: false,
    default: null
  },
  channels: [
    { type: Schema.Types.ObjectId, ref: 'EbayChannel', required: true }
  ],
  categories: [
    { type: Schema.Types.ObjectId, ref: 'EbayCategory', required: true }
  ]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at', }
});

export default BookEbayKeywordSchema;
