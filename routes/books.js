const express = require('express');

const router = express.Router();
// const { protect, authorize } = require('../middleware/auth');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const advancedResults = require('../middleware/advancedResults');
const Book = require('../models/Book');

router.route('/').get(advancedResults(Book), getBooks);
router.get('/', getBooks);

router.get('/:bookId', getBook);

router.post('/', createBook);

router.put('/:bookId', updateBook);

router.delete('/:bookId', deleteBook);

module.exports = router;
