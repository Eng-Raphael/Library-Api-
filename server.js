const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fileupload = require('express-fileupload');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// route files
const xss = require('xss-clean');
const auth = require('./routes/auth');

// after route files loasd xss-clean
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

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
app.use(cors());

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// mount routes
app.use('/api/auth', auth);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`.yellow.bold));

// Handle unhandled rejection
process.on('unhandledRejection', (err, Promise) => {
  console.log(`Error: ${err.message}`.red.bold);
  // close server
  server.close(() => { process.exit(1); });
});
