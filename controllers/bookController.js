/* eslint-disable no-use-before-define */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const Book = require('../models/Book');
const Category = require('../models/Category');
const Author = require('../models/Author');
const User = require('../models/User');

// @desc Get all books
// @route GET /api/books
// @access Public
exports.getBooks = asyncHandler(async (req, res) => {
  res.status(200).json(res.advancedResults);
});

// @desc Get a book
// @route GET /api/books/:bookId
// @access Public
exports.getBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) {
    return next(
      new ErrorResponse(`Book not found with id: ${req.params.bookId}`, 404),
    );
  }
  return res.status(200).json({ success: true, data: book });
});

// @desc Create a book
// @route POST /api/books
// @access Private (Admin)
exports.createBook = [
  body('name')
    .isLength({ min: 3, max: 50 })
    .withMessage('Book name must be between 3 and 50 characters'),
  body('category').exists().withMessage('Category is required'),
  body('author').exists().withMessage('Author is required'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorArray = errors.array().map((error) => error.msg);
        return res.status(400).json({ errors: errorArray });
      }

      if (req.body.category) {
        const foundCategory = await Category.findById(req.body.category);
        if (!foundCategory) {
          return res.status(404).json({ errors: `Category ${req.body.category} not found` });
        }
      }
      if (req.body.author) {
        const foundAuthor = await Author.findById(req.body.author);
        if (!foundAuthor) {
          return res.status(404).json({ errors: `Author ${req.body.author} not found` });
        }
      }
      const book = new Book({
        name: req.body.name,
        category: req.body.category,
        author: req.body.author,
        reviews: req.body.reviews,
      });

      if (!req.files) {
        return res.status(404).json({ errors: 'Please upload a file' });
      }

      const file = req.files.image;

      if (!file.mimetype.startsWith('image')) {
        return res.status(404).json({ errors: 'Please upload an image file' });
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return res.status(404).json({
          message: `Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`,
        });
      }

      file.name = `${req.protocol}://${req.get('host')}/uploads/books/photo_book_${req.body.name}${path.parse(file.name).ext}`;

      file.mv(
        `${process.env.FILE_UPLOAD_PATH}/books/${file.name}`,
        async (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ errors: 'Error while file upload' });
          }

          book.image = file.name;

          await book.save();
          // // return the image URL in the response
          // const imageUrl = `${req.protocol}://${req.get('host')}/uploads/books/${file.name}`;
          res.status(201).json({
            success: true,
            data: book,
          });
        },
      );
    } catch (err) {
      next(err);
    }
  },
];

// @desc Update a book
// @route PUT /api/books/:bookId
// @access Private (Admin)
// eslint-disable-next-line consistent-return
exports.updateBook = asyncHandler(async (req, res, next) => {
  let book = await Book.findById(req.params.bookId);

  // Validate input fields
  await body('name')
    .isLength({ min: 3, max: 50 })
    .withMessage('Book name must be between 3 and 50 characters')
    .run(req);
  await body('category').exists().withMessage('Category is required').run(req);
  await body('author').exists().withMessage('Author is required').run(req);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array().map((error) => error.msg);
    return res.status(400).json({ errors: errorArray });
  }
  if (!book) {
    return res.status(404).json({ errors: 'Book not found' });
  }

  const { category, author } = req.body;

  if (category) {
    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return res.status(404).json({ errors: `Category ${category} not found` });
    }
  }

  if (author) {
    const foundAuthor = await Author.findById(author);
    if (!foundAuthor) {
      return res.status(404).json({ errors: `Author ${author} not found` });
    }
  }

  if (req.files && req.files.file) {
    const { file } = req.files.file;

    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({ errors: 'Please upload an image file' });
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return res.status(400).json({ errors: `Please upload image file lass than ${process.env.MAX_FILE_UPLOAD}` });
    }

    // eslint-disable-next-line no-underscore-dangle
    file.name = `${req.protocol}://${req.get('host')}/uploads/books/photo_book_${book.name}${path.parse(file.name).ext}`;

    file.mv(
      `${process.env.FILE_UPLOAD_PATH}/books/${file.name}`,
      // eslint-disable-next-line consistent-return
      async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ errors: 'Error while file upload' });
        }
      },
    );

    req.body.image = file.name;
  }

  book = await Book.findByIdAndUpdate(req.params.bookId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: book });
});

// @desc Delete a book
// @route DELETE /api/books/:bookId
// @access Private (Admin)

// eslint-disable-next-line consistent-return
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return next(
        new ErrorResponse(`Book not found with id of ${req.params.bookId}`, 404),
      );
    }

    if (book.image !== 'default.jpg') {
      const imagePath = `${process.env.FILE_UPLOAD_PATH}/books/${book.image}`;

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await book.deleteOne();

    // remove book from user's books array
    await removeBookFromUserBooks(book._id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

async function removeBookFromUserBooks(bookId) {
  try {
    const users = await User.find({ 'books.bookId': bookId });

    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const index = user.books.findIndex((book) => book.bookId.toString() === bookId.toString());
        if (index !== -1) {
          user.books.splice(index, 1);
          await user.save();
        }
      }
    }
  } catch (err) {
    console.error(`Error removing book from user's books array: ${err.message}`);
  }
}
