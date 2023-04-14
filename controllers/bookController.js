/* eslint-disable no-shadow */
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
  const book = await Book.findById(req.params.bookId).populate('author').populate('category');
  if (!book) {
    return res.status(404).json({ success: false, errors: [`Book not found with id: ${req.params.bookId}`] });
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
  body('image')
    .custom((value, { req }) => {
      if (!req.files || !req.files.image) {
        throw new Error('Please upload a file');
      }

      const file = req.files.image;

      if (!file.mimetype.startsWith('image')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        throw new Error(`Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`);
      }

      req.body.imageName = `photo_book_${req.body.name}${path.parse(file.name).ext}`;

      return true;
    }),

  async (req, res, next) => {
    try {
      const errors = validationResult(req).formatWith(({ msg }) => msg);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const category = await Category.findById(req.body.category);
      if (!category) {
        errors.errors.push({ success: false, errors: `Category ${req.body.category} not found` });
      }

      const author = await Author.findById(req.body.author);
      if (!author) {
        errors.errors.push({ success: false, errors: `Author ${req.body.author} not found` });
      }

      if (errors.errors.length) {
        return res.status(404).json({ success: false, errors: errors.array() });
      }

      const book = new Book({
        name: req.body.name,
        category: req.body.category,
        author: req.body.author,
        reviews: req.body.reviews,
        image: req.body.imageName,
      });

      // Save the book image file
      const file = req.files.image;
      const imagePath = `./public/uploads/books/${req.body.imageName}`;
      await file.mv(imagePath);

      const savedBook = await book.save();

      // Return the book object in the response
      res.status(201).json({
        success: true,
        data: savedBook,
      });
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

  // Define validation rules
  const rules = [
    body('name')
      .isLength({ min: 3, max: 50 })
      .withMessage('Book name must be between 3 and 50 characters'),
    body('category').exists().withMessage('Category is required'),
    body('author').exists().withMessage('Author is required'),
  ];

  // If file is provided, add file validation rule
  if (req.files && req.files.image) {
    rules.push(
      body('image').custom((value, { req }) => {
        const { image } = req.files; // fix destructuring here
        if (!image.mimetype.startsWith('image')) {
          throw new Error('Please upload an image file');
        }
        if (image.size > process.env.MAX_FILE_UPLOAD) {
          throw new Error(`Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`);
        }
        return true;
      }),
    );
  }

  // Validate input fields and file
  await Promise.all(rules.map((rule) => rule.run(req)));

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array().map((error) => error.msg);
    return res.status(400).json({ success: false, errors: errorArray });
  }

  if (!book) {
    return res.status(404).json({ success: false, errors: ['Book not found'] });
  }

  const { category, author } = req.body;

  if (category) {
    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return res.status(404).json({ success: false, errors: [`Category ${category} not found`] });
    }
  }

  if (author) {
    const foundAuthor = await Author.findById(author);
    if (!foundAuthor) {
      return res.status(404).json({ success: false, errors: [`Author ${author} not found`] });
    }
  }

  // If no file is provided, use the current image in db
  if (!req.files || !req.files.image) {
    req.body.image = book.image;
  } else {
    const { image } = req.files;

    image.name = `photo_book_${req.body.name}${path.parse(image.name).ext}`;

    image.mv(
      `${process.env.FILE_UPLOAD_PATH}/books/${image.name}`,
      async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, errors: ['Error while file upload'] });
        }
      },
    );

    req.body.image = image.name;
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
      return res.status(404).json({ success: false, errors: [`Book not found with id of ${req.params.bookId}`] });
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
