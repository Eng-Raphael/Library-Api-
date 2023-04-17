/* eslint-disable max-len */
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
  this.totalRatings += 1;
  this.avgRating = ((this.avgRating || 0) * (this.totalRatings - 1) + rating) / this.totalRatings;

  return this.save();
};
BookSchema.methods.updateRating = function (rating) {
  this.avgRating = ((this.avgRating || 0) * this.totalRatings - rating + rating) / this.totalRatings;

  return this.save();
};

module.exports = mongoose.model('Book', BookSchema);
