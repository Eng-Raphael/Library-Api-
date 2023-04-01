/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const Author = require('../models/Author');

// @desc Get all authors
// @route GET /api/authors
// @access Public
exports.getAuthors = asyncHandler(async (req, res) => {
  const authors = await Author.find();
  res.status(200).json({ success: true, data: authors });
});

// @desc Get single author
// @route GET /api/authors/:authorId
// @access Public
exports.getAuthor = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.authorId);
  if (!author) {
    return next(
      new ErrorResponse(`Author not found with id: ${req.params.authorId}`, 404),
    );
  }
  return res.status(200).json({ success: true, data: author });
});

// @desc Create an author
// @route POST /api/authors
// @access Private (Admin)
exports.createAuthor = [
  body('firstName').isLength({ min: 3, max: 20 }).exists().withMessage('First name is required'),
  body('lastName').isLength({ min: 3, max: 20 }).exists().withMessage('Last name is required'),
  body('dob').exists().withMessage('Date of birth is required'),

  // eslint-disable-next-line consistent-return
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const author = new Author({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dob: req.body.dob,
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
        `${process.env.FILE_UPLOAD_PATH}/authors/${file.name}`,
        // eslint-disable-next-line consistent-return
        async (err) => {
          if (err) {
            console.error(err);
            return next(new ErrorResponse('Error while file upload', 500));
          }

          author.image = file.name;

          await author.save();

          res.status(201).json({
            success: true,
            data: author,
          });
        },
      );
    } catch (err) {
      next(err);
    }
  },

];

// @desc Update an author
// @route PUT /api/authors/:authorId
// @access Private (Admin)
// eslint-disable-next-line consistent-return
exports.updateAuthor = asyncHandler(async (req, res, next) => {
  let author = await Author.findById(req.params.authorId);

  if (!author) {
    return next(
      new ErrorResponse(`Author not found with id: ${req.params.authorId}`, 404),
    );
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
    file.name = `photo_${author._id}${path.parse(file.name).ext}`;

    file.mv(
      `${process.env.FILE_UPLOAD_PATH}/authors/${file.name}`,
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

  author = await Author.findByIdAndUpdate(req.params.authorId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: author });
});

// @desc Delete an author
// @route DELETE /api/authors/:authorId
// @access Private (Admin)
// eslint-disable-next-line consistent-return
exports.deleteAuthor = asyncHandler(async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.authorId);

    if (!author) {
      return next(
        new ErrorResponse(`author not found with id of ${req.params.authorId}`, 404),
      );
    }

    if (author.image !== 'default.png') {
      const imagePath = `${process.env.FILE_UPLOAD_PATH}/authors/${author.image}`;

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Author.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
});
