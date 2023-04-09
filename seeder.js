/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// load env variables
dotenv.config({ path: './config/config.env' });

// load models
const Author = require('./models/Author');
const Book = require('./models/Book');
const User = require('./models/User');
const Category = require('./models/Category');

// connect to db
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Read the json files
const authors = JSON.parse(fs.readFileSync('./_data/authors.json', 'utf-8'));
const books = JSON.parse(fs.readFileSync('./_data/books.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./_data/users.json', 'utf-8'));
const categories = JSON.parse(fs.readFileSync('./_data/categories.json', 'utf-8'));
// Import into db
const importData = async () => {
  try {
    await Author.create(authors);
    await Book.create(books);
    await User.create(users);
    await Category.create(categories);
    console.log('Data imported by seeders....'.green.inverse);
  } catch (error) {
    console.log(error);
  }
};

// delete data
const deletetData = async () => {
  try {
    await Author.deleteMany();
    await Book.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();
    console.log('Data destroyed by seeders....'.red.inverse);
  } catch (error) {
    console.log(error);
  }
};

// check for seeder or delete option from process.argv
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deletetData();
}
