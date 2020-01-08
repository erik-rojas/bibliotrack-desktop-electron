import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const BookAuthorSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
});

export default BookAuthorSchema;
