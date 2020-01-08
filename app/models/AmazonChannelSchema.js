import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AmazonChannelSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  }
});

export default AmazonChannelSchema;
