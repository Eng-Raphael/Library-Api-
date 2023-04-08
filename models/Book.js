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

module.exports = mongoose.model('Book', BookSchema);
