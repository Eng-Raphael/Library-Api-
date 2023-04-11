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

const { protect, authorize } = require('../middleware/auth');

router.route('/').get(advancedResults(Book, { path: 'author', select: 'firstName lastName' }), getBooks);
router.get('/', getBooks);
router.get('/:bookId', getBook);
router.post('/', protect, authorize('admin'), createBook);
router.put('/:bookId', protect, authorize('admin'), updateBook);
router.delete('/:bookId', protect, authorize('admin'), deleteBook);

module.exports = router;
