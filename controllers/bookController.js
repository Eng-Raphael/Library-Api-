const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const Book = require('../models/Book');

// @desc Get all books
// @route GET /api/books
// @access Public
exports.getBooks = asyncHandler(async (req, res) => {
  const books = await Book.find();
  res.status(200).json({ success: true, data: books });
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
  body('avgRating').isNumeric().withMessage('Average rating must be a number'),

  // eslint-disable-next-line consistent-return
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const book = new Book({
        name: req.body.name,
        category: req.body.category,
        author: req.body.author,
        avgRating: req.body.avgRating,
        reviews: req.body.reviews,
      });

      if (!req.files) {
        return next(new ErrorResponse('Please upload a file', 404));
      }

      const file = req.files.image;

      if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please upload an image file', 404));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`,
            404,
          ),
        );
      }

      file.name = `photo_profile_${Date.now()}${path.parse(file.name).ext}`;

      file.mv(
        `${process.env.FILE_UPLOAD_PATH}/books/${file.name}`,
        // eslint-disable-next-line consistent-return
        async (err) => {
          if (err) {
            console.error(err);
            return next(new ErrorResponse('Error while file upload', 500));
          }

          book.image = file.name;

          await book.save();

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

  if (!book) {
    return next(new ErrorResponse('Book not found', 404));
  }

  const { category, author } = req.body;

  if (category) {
    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return next(new ErrorResponse(`Category ${category} not found`, 404));
    }
  }

  if (author) {
    const foundAuthor = await Author.findById(author);
    if (!foundAuthor) {
      return next(new ErrorResponse(`Author ${author} not found`, 404));
    }
  }

  if (req.files && req.files.file) {
    const { file } = req.files.file;

    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload image file lass than ${process.env.MAX_FILE_UPLOAD}`,
          400,
        ),
      );
    }

    // eslint-disable-next-line no-underscore-dangle
    file.name = `photo_${book._id}${path.parse(file.name).ext}`;

    file.mv(
      `${process.env.FILE_UPLOAD_PATH}/books/${file.name}`,
      // eslint-disable-next-line consistent-return
      async (err) => {
        if (err) {
          console.error(err);
          return next(new ErrorResponse('Error while file upload', 500));
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

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
