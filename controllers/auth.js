/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-useless-escape */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
const path = require('path');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, username } = req.body;
  const image = req.files ? req.files.image : null;
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  // Run validations
  const validations = [
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
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error('Email already exists');
        }
        return true;
      })
      .run(req),
    body('password')
      .notEmpty().withMessage('Please add a password')
      .isLength({ min: 8 })
      .withMessage('Password should be at least 8 characters long')
      .run(req),
    body('username')
      .notEmpty().withMessage('Please add your user name')
      .not()
      .isNumeric()
      .withMessage('Username cannot be a number')
      .custom(async (value, { req }) => {
        const user = await User.findOne({ username: value });
        if (user) {
          throw new Error('Username already exists');
        }
        return true;
      })
      .run(req),
  ];

  if (image) {
    validations.push(
      body('image')
        .custom((value, { req }) => {
          if (!value.mimetype.startsWith('image')) {
            throw new Error('Please upload an image of type image');
          }
          return true;
        })
        .custom((value, { req }) => {
          const imageExt = path.extname(value.name).toLowerCase();
          if (!validExtensions.includes(imageExt)) {
            throw new Error('Invalid image file extension. Please upload a jpg, jpeg, png, or gif file.');
          }
          if (value.size > process.env.MAX_FILE_UPLOAD) {
            throw new Error(`Please upload an image file less than ${process.env.MAX_FILE_UPLOAD}`);
          }
          return true;
        }),
    );
  }

  // Check for validation errors
  await Promise.all(validations);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (image) {
    // Create custom file name
    const fileExt = path.extname(image.name);
    const fileName = `photo_user_${username}${fileExt}`;

    // Move file to upload directory
    await image.mv(`${process.env.FILE_UPLOAD_PATH}/users/${fileName}`);
    const user = await User.create({
      firstName,
      lastName,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      image: image ? fileName : 'default.png',
    });
    sendTokenResponse(user, 200, res);
  } else {
    const user = await User.create({
      firstName,
      lastName,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      image: 'default.png',
    });
    sendTokenResponse(user, 200, res);
  }
});

exports.login = asyncHandler(async (req, res, next) => {
  await Promise.all([
    body('username')
      .notEmpty().withMessage('Please provide an username')
      .not()
      .isNumeric()
      .withMessage('Username cannot be a number')
      .matches(/^[a-zA-Z0-9@_$%^&*!]+$/, 'i')
      .withMessage('Please provide a valid username')
      .run(req),
    body('password')
      .notEmpty().withMessage('Please add a password')
      .isLength({ min: 8 })
      .withMessage('Password should be at least 8 characters long')
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, errors: [`Invalid credentials , user ${username} not found`] });
  }

  // Check if password is valid
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, errors: ['Invalid credentials , password not found or does not match'] });
  }

  sendTokenResponse(user, 200, res);
});
// @desc      Get current logged in user
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      errors: ['Unauthorized access - please log in'],
    });
  }
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
