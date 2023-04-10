/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable array-callback-return */
/* eslint-disable no-param-reassign */
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

const db = mongoose.connection;
db.once('open', async () => {
  console.log('Connected to database');

  // Create categories
  const category1 = new Category({
    name: 'Science Fiction',
  });
  await category1.save();

  const category2 = new Category({
    name: 'Romance',
  });
  await category2.save();

  // Create users
  const user1 = new User({
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'johndoe@example.com',
    password: 'password123',
    role: 'user',
    books: [
      {
        bookId: '6431d4e04418620d65f7703f', // replace with valid book id
        shelve: 'READING',
        rating: 4,
      },
    ],
  });
  await user1.save();

  const user2 = new User({
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'janedoe',
    email: 'janedoe@example.com',
    password: 'password123',
    role: 'user',
    books: [
      {
        bookId: '6431d4e64418620d65f77044', // replace with valid book id
        shelve: 'WANT_TO_READ',
        rating: 3,
      },
    ],
  });
  await user2.save();

  // Create authors
  const author1 = new Author({
    firstName: 'John',
    lastName: 'Doe',
    dob: new Date('1990-01-01'),
  });
  await author1.save();

  const author2 = new Author({
    firstName: 'Jane',
    lastName: 'Doe',
    dob: new Date('1985-01-01'),
  });
  await author2.save();

  // Create books
  const book1 = new Book({
    name: 'Book 1',
    category: category1._id,
    author: author1._id,
    image: 'book1.jpg',
    avgRating: 4,
    totalRatings: 1,
    reviews: ['Good read!'],
  });
  await book1.save();

  const book2 = new Book({
    name: 'Book 2',
    category: category2._id,
    author: author2._id,
    image: 'book2.jpg',
    avgRating: 3,
    totalRatings: 1,
    reviews: ['Interesting plot.'],
  });
  await book2.save();

  console.log('Data imported');
  process.exit();
});

db.on('error', (err) => {
  console.error('Database connection error:', err);
});
// Read the json files
// const authors = JSON.parse(fs.readFileSync('./_data/authors.json', 'utf-8')).map((author) => {
//   author._id = new mongoose.Types.ObjectId(author._id.$oid);
//   author.createdAt = new Date(author.createdAt.$date);
//   author.updatedAt = new Date(author.updatedAt.$date);
//   author.dob = new Date(author.dob.$date);
//   return author;
// });
// const books = JSON.parse(fs.readFileSync('./_data/books.json', 'utf-8')).map((book) => {
//   // Convert the string representation of the date to a Date object
//   book.createdAt = new Date(book.createdAt.$date);
//   book.updatedAt = new Date(book.updatedAt.$date);
//   return book;
// });
// const users = JSON.parse(fs.readFileSync('./_data/users.json', 'utf-8')).map((user) => {
//   user.createdAt = new Date(user.createdAt.$date);
//   user.updatedAt = new Date(user.updatedAt.$date);
//   return user;
// });
// const categories = JSON.parse(fs.readFileSync('./_data/categories.json', 'utf-8')).map((category) => {
//   category.createdAt = new Date(category.createdAt.$date);
//   category.updatedAt = new Date(category.updatedAt.$date);
//   return category;
// });
// Import into db
// const importData = async () => {
//   try {
//     await Author.create(authors);
//     await Book.create(books);
//     await User.create(users);
//     await Category.create(categories);
//     console.log('Data imported by seeders....'.green.inverse);
//   } catch (error) {
//     console.log(error);
//   }
// };

// // delete data
// const deletetData = async () => {
//   try {
//     await Author.deleteMany();
//     await Book.deleteMany();
//     await User.deleteMany();
//     await Category.deleteMany();
//     console.log('Data destroyed by seeders....'.red.inverse);
//   } catch (error) {
//     console.log(error);
//   }
// };

// // check for seeder or delete option from process.argv
// if (process.argv[2] === '-i') {
//   importData();
// } else if (process.argv[2] === '-d') {
//   deletetData();
// }
