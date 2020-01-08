import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const BookLanguageSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  short_code: {
    type: String,
    required: true,
    index: true
  }
});

export default BookLanguageSchema;
