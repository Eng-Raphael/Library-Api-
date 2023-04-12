/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-useless-escape */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
const crypto = require('crypto');
const path = require('path');
const { body, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName } = req.body;
  const { file } = req.files;

  // Run validations
  await Promise.all([
    body('firstName')
      .notEmpty().withMessage('Please add your first name')
      .isLength({ min: 2, max: 20 })
      .withMessage('First name should be between 2 to 20 alphabets')
      .run(req),
    body('lastName')
      .notEmpty().withMessage('Please add your last name')
      .isLength({ min: 2, max: 20 })
      .withMessage('Last name should be between 2 to 20 alphabets')
      .run(req),
    body('email')
      .notEmpty().withMessage('Please add an email')
      .isEmail()
      .withMessage('Please add a valid email')
      .run(req),
    body('password')
      .notEmpty().withMessage('Please add a password')
      .isLength({ min: 8 })
      .withMessage('Password should be at least 8 characters long')
      .run(req),
    body('username')
      .notEmpty().withMessage('Please add your user name')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user) {
          throw new Error('Username already exists');
        }
        return true;
      })
      .run(req),
    body('file')
      .custom((value, { req }) => {
        if (!value) {
          throw new Error('Please upload a file');
        }
        return true;
      })
      .custom((value, { req }) => {
        if (!value.mimetype.startsWith('image')) {
          throw new Error('Please upload an image file');
        }
        return true;
      })
      .custom((value, { req }) => {
        if (value.size > process.env.MAX_FILE_UPLOAD) {
          throw new Error(`Please upload an image file less than ${process.env.MAX_FILE_UPLOAD}`);
        }
        return true;
      }),
  ]);

  // Check for validation errors
  const errors = validationResult(req);

  errors.array().forEach((error) => {
    if (error.param === 'username') {
      validationResult(req).addError(error);
    }
  });

  errors.array().forEach((error) => {
    if (error.param === 'file') {
      validationResult(req).addError(error);
    }
  });

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Create custom file name
  const fileExt = path.extname(file.name);
  const fileName = `photo_user_${firstName}_${lastName}${fileExt}`;

  // Move file to upload directory
  await file.mv(`${process.env.FILE_UPLOAD_PATH}/users/${fileName}`);

  // Create user
  const user = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    image: fileName,
  });

  sendTokenResponse(user, 200, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  await Promise.all([
    body('username')
      .notEmpty().withMessage('Please provide an username')
      .matches(/^[a-zA-Z0-9@_$%^&*!]+$/, 'i')
      .withMessage('Please provide a valid username')
      .run(req),
    body('password')
      .notEmpty().withMessage('Please provide a password')
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return res.status(401).json({ errors: ['Invalid credentials'] });
  }

  // Check if password is valid
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ errors: ['Invalid credentials'] });
  }

  sendTokenResponse(user, 200, res);
});
// @desc      Get current logged in user
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;

  await body('firstName')
    .notEmpty().withMessage('Please add your first name')
    .isLength({ min: 2, max: 20 })
    .withMessage('First name should be between 2 to 20 alphabets')
    .run(req);

  await body('lastName')
    .notEmpty().withMessage('Please add your last name')
    .isLength({ min: 2, max: 20 })
    .withMessage('Last name should be between 2 to 20 alphabets')
    .run(req);

  await body('email')
    .notEmpty().withMessage('Please add an email')
    .isEmail()
    .withMessage('Please add a valid email')
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const fieldsToUpdate = {
    firstName,
    lastName,
    email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!await user.matchPassword(req.body.currentPassword)) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }
  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Public
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Get token from model , create cookie and send response
const sendTokenResponse = (user, statuscode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  res
    .status(statuscode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      userId: user._id,
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      books: user.books,
    });
};
