const mongoose = require('mongoose');

const AuthorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add Your firstName'],
    trim: true,
    minLength: [3, 'firstName cannot be less than 3 characters'],
    maxlength: [20, 'firstName cannot be more than 20 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Please add Your lastName'],
    trim: true,
    minLength: [3, 'lastName cannot be less than 3 characters'],
    maxlength: [20, 'lastName cannot be more than 20 characters'],
  },
  dob: {
    type: Date,
    required: [true, 'Please add Your date of birth'],
    validate: [
      {
        validator(value) {
          // Ensure date is not in the future
          return value <= new Date();
        },
        message: 'Date of birth cannot be in the future',
      },
      {
        validator(value) {
          // Ensure age is at least 18 years
          const age = (new Date() - value) / (365 * 24 * 60 * 60 * 1000);
          return age >= 18;
        },
        message: 'You must be at least 18 years old',
      },
    ],
  },
  image: {
    type: String,
    default: 'default.png',
  },
});

module.exports = mongoose.model('Author', AuthorSchema);
