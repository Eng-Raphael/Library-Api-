const mongoose = require('mongoose');

// eslint-disable-next-line no-useless-escape
const regexValidation = /^[a-zA-Z]+(([\s-][a-zA-Z])?[a-zA-Z]*)*$/;

// allow strings that start with one or more letters,
// followed by optional occurrences of a space or hyphen,
// and one or more letters, and nothing else

const CategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Add A Category'],
      unique: true,
      minlength: [3, 'Category Name is too short, minimum 3 , maximum 20'],
      maxlength: [20, 'Category Name is too short, minimum 3 , maximum 20'],
      // match: [
      //   regexValidation,
      //   'Please Add A Valid Category, it can\'t contain any special characters but hyphens)',
      // ],
    },
  },
  { timestamps: true },

);

module.exports = mongoose.model('Category', CategorySchema);
