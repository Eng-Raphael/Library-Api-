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
    enum: ['user', 'admin', 'author'],
    default: 'user',
  },
  books: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Book',
    required: false,
    shelve: {
      enum: ['READING', 'READ', 'WANT TO READ'],
    },
    rating: {
      type: Number,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function (next) {
  this.username = `${this.firstName}_${this.lastName}`.toLowerCase();
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = () => jwt.sign(
  { id: this._id },
  process.env.JWT_SECRET,

  { expiresIn: process.env.JWT_EXPIRE },
);

UserSchema.methods.matchPassword = async function (enteredPassword) {
  // eslint-disable-next-line no-return-await
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
