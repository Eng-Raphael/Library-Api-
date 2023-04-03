const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a book name'],
    minlength: 3,
    maxlength: 50,
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  image: {
    type: String,
    default: 'default.jpg',
  },
  avgRating: {
    type: Number,
  },
  reviews: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Book', BookSchema);
