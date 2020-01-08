import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const EbayCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  ebay_id: {
    type: String,
    required: true
  }
});

export default EbayCategorySchema;
