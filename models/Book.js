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
    ref: 'Author',
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
  reviews: [String],
}, { timestamps: true });

BookSchema.methods.addRating = function (rating) {
  // Calculate the new average rating of the book
  this.totalRatings += 1;
  if (this.totalRatings === 1) {
    this.avgRating = rating;
  } else {
    const oldRating = this.avgRating;
    this.avgRating = (Number(oldRating) + Number(rating)) / 2;
  }

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
    book.avgRating = (oldRating - Number(rating)) / book.totalRatings;
  } else {
    book.avgRating = 0;
  }
  book.avgRating *= 20;

  return book.save();
};

module.exports = mongoose.model('Book', BookSchema);
