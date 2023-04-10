/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
/* eslint-disable no-useless-escape */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Book = require('../models/Book');
// @desc      add book to user
// @route     POST /api/user/book/:id
// @access    Private

exports.addBookToUser = asyncHandler(async (req, res, next) => {
  if (req.user._id) {
    const bookId = req.params.id;

    const existingBook = await User.findOne({
      _id: req.user._id,
      books: { $elemMatch: { bookId } },
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        errors: [`Book with id ${bookId} is already added to user's list.`],
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        $push: {
          books: {
            bookId: req.params.id,
            shelve: req.body.shelve,
            rating: req.body.rating,
          },
        },
      },
      { new: true },
    );

    const book = await Book.findById(bookId);
    book.addRating(req.body.rating);

    res.status(200).json({ success: true, data: user, msg: 'avg rating added' });
  } else {
    res.status(500).json({ success: false, errors: ['User Not found to add book'] });
  }
});

// @desc      update book to user
// @route     PUT /api/user/book/:id
// @access    Private
exports.updateBookToUser = asyncHandler(async (req, res, next) => {
  const { shelve } = req.body;
  const { rating } = req.body;

  if (req.user._id) {
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, 'books.bookId': req.params.id },
      { $set: { 'books.$.shelve': shelve, 'books.$.rating': rating } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        errors: [`Book with id ${req.params.id} not found in user's list.`],
      });
    }

    const book = await Book.findById(req.params.id);
    book.addRating(rating);

    res.status(200).json({ success: true, data: user, msg: 'avgRating added' });
  } else {
    res.status(500).json({ success: false, errors: ['User Not found to add book'] });
  }
});

// @desc      delete book of user
// @route     DELETE /api/user/book/:id
// @access    Private

exports.deleteBookForUser = asyncHandler(async (req, res, next) => {
  const bookId = req.params.id;

  if (req.user._id) {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { books: { bookId } } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        errors: [`Book with id ${bookId} not found in user's list.`],
      });
    }

    res.status(200).json({ success: true, data: user });
  } else {
    res.status(500).json({ success: false, errors: ['User Not found to add book'] });
  }
});