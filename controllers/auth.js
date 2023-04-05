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

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public

// exports.register = asyncHandler(async (req, res, next) => {
//   const {
//     firstName, lastName, email, password,
//   } = req.body;

//   if (!req.files) {
//     return next(new ErrorResponse('Please upload a file', 404));
//   }

//   const { file } = req.files;

//   // Make sure image is a photo
//   if (!file.mimetype.startsWith('image')) {
//     return next(new ErrorResponse('Please upload an image file', 404));
//   }

//   // check file size
//   if (file.size > process.env.MAX_FILE_UPLOAD) {
//     return next(new ErrorResponse(`Please upload image file lass than ${process.env.MAX_FILE_UPLOAD}`, 404));
//   }

//   // Create custom file name
//   file.name = `photo_${firstName + lastName}${path.parse(file.name).ext}`;

//   // move file to folder
//   file.mv(`${process.env.FILE_UPLOAD_PATH}/users/${file.name}`, async (err) => {
//     if (err) {
//       console.error(err);
//       return next(new ErrorResponse('Error while file upload', 500));
//     }
//   });

//   // create User
//   const user = await User.create({
//     firstName,
//     lastName,
//     email,
//     password,
//     image: file.name,
//   });

//   sendTokenResponse(user, 200, res);
// });
exports.register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    role,
  } = req.body;

  // Validate inputs
  const errors = {};

  // Validate firstName
  if (!firstName) {
    errors.firstName = 'Please add your first name';
  } else if (!/^[A-Za-z]{2,20}$/.test(firstName)) {
    errors.firstName = 'First name should be between 2 to 20 alphabets';
  }

  // Validate lastName
  if (!lastName) {
    errors.lastName = 'Please add your last name';
  } else if (!/^[A-Za-z]{2,20}$/.test(lastName)) {
    errors.lastName = 'Last name should be between 2 to 20 alphabets';
  }

  // Validate email
  if (!email) {
    errors.email = 'Please add an email';
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.email = 'Please add a valid email';
  }

  // Validate password
  if (!password) {
    errors.password = 'Please add a password';
  } else if (password.length < 8) {
    errors.password = 'Password should be at least 8 characters long';
  }

  // Check for validation errors
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  // Check for uploaded file
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const { file } = req.files;

  // Check if the file is an image
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse(`Please upload an image file less than ${process.env.MAX_FILE_UPLOAD}`, 400));
  }

  // Create custom file name
  const fileExt = path.extname(file.name);
  const fileName = `photo_${firstName}_${lastName}${fileExt}`;

  // Move file to upload directory
  await file.mv(`${process.env.FILE_UPLOAD_PATH}/users/${fileName}`);

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    image: fileName,
  });

  sendTokenResponse(user, 200, res);
});
// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
// exports.login = asyncHandler(async (req, res, next) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return next(new ErrorResponse('Please provide an email and password', 400));
//   }
//   const user = await User.findOne({ email }).select('+password');
//   if (!user) {
//     return next(new ErrorResponse('Invalid credentials', 401));
//   }

//   const isMatch = await user.matchPassword(password);

//   if (!isMatch) {
//     return next(new ErrorResponse('Invalid credentials', 401));
//   }
//   sendTokenResponse(user, 200, res);
// });
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check if email is valid
  const isValidEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  if (!isValidEmail) {
    return next(new ErrorResponse('Please provide a valid email', 400));
  }

  // Find user by email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password is valid
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
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
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
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
      userRole: user.role,
      userName: user.username,
    });
};
