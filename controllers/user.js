/* eslint-disable max-len */
/* eslint-disable no-useless-escape */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc      add book to user
// @route     POST /api/user/book/:id
// @access    Private

exports.addBookToUser = asyncHandler(async (req, res, next) => {
  if (req.user._id) {
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
    res.status(200).json({ success: true, data: user });
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
    res.status(200).json({ success: true, data: user });
  } else {
    res.status(500).json({ success: false, errors: ['User Not found to add book'] });
  }
});
