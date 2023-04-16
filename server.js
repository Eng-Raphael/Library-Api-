/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-len */
/* eslint-disable no-console */

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fileupload = require('express-fileupload');

// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
// eslint-disable-next-line no-unused-vars

// route files
const xss = require('xss-clean');
const auth = require('./routes/auth');
const books = require('./routes/books');
const user = require('./routes/user');

// after route files loasd xss-clean
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const category = require('./routes/category');
const author = require('./routes/author');

// load env
dotenv.config({ path: './config/config.env' });

// connect to db
connectDB();

const app = express();

// parse body
app.use(express.json());

// paerse cookie
app.use(cookieParser());

// middleware for file-upload
app.use(fileupload());

// dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
const corsOptions = {
  origin: ['http://localhost:4200', 'https://goodreads-gyhr.onrender.com', 'https://raboegila.github.io/GoodReads-FrontEnd'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors(corsOptions));

// set static folder
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// app.use(express.static(path.join(__dirname, 'public')));

// mount routes
app.use('/api/books', books);
app.use('/api/categories', category);
app.use('/api/auth', auth);
app.use('/api/authors', author);
app.use('/api/user', user);

// error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`.yellow.bold));

try {
  // Handle unhandled rejection
  // eslint-disable-next-line no-unused-vars
  process.on('unhandledRejection', (err, Promise) => {
    console.log(`Error: ${err.message}`.red.bold);
    // close server
    server.close(() => { process.exit(1); });
  });
} catch (error) {
  console.log(error);
}
