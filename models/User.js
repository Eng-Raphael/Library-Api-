/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-return-await */
/* eslint-disable func-names */
/* eslint-disable no-useless-escape */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add Your firstName'],
  },
  lastName: {
    type: String,
    required: [true, 'Please add Your lastName'],
  },
  username: {
    type: String,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 8,
    select: false,
  },
  image: {
    type: String,
    default: 'no-photo.jpg',
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user',
  },
  books: [{
    bookId: {
      type: mongoose.Types.ObjectId, // <-- specify that bookId should be an ObjectId
      required: true,
    },
    shelve: {
      type: String,
      enum: ['READING', 'READ', 'WANT_TO_READ'],
      default: 'READING',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  }],
}, { timestamps: true });
/* eslint-disable prefer-destructuring */

UserSchema.pre('save', async function (next) {
  this.username = `${this.firstName}_${this.lastName}`.toLowerCase();
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
