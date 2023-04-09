/* eslint-disable func-names */
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
    required: false,
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false,
  },
  image: {
    type: String,
    default: 'default.jpg',
  },
  avgRating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      type: String,
    },
  ],
}, { timestamps: true });

BookSchema.methods.addRating = function (rating) {
  // Calculate the new average rating of the book
  const oldRating = this.avgRating * this.totalRatings;
  this.totalRatings += 1;
  this.avgRating = (oldRating + rating) / this.totalRatings;
  return this.save();
};

BookSchema.statics.deleteRating = async function (bookId, rating) {
  const book = await this.findById(bookId);
  if (!book) {
    throw new Error(`Book with id ${bookId} not found.`);
  }
  const oldRating = book.avgRating * book.totalRatings;
  book.totalRatings -= 1;
  if (book.totalRatings > 0) {
    book.avgRating = (oldRating - rating) / book.totalRatings;
  } else {
    book.avgRating = 0;
  }
  return book.save();
};

module.exports = mongoose.model('Book', BookSchema);
