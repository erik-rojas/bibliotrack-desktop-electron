import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const BookPublisherSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
});

export default BookPublisherSchema;
