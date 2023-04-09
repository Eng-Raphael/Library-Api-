const express = require('express');

const router = express.Router();
// const { protect, authorize } = require('../middleware/auth');
const {
  getAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require('../controllers/author');

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const Author = require('../models/Author');

router
  .route('/')
  .get(advancedResults(Author), protect, getAuthors);
router.get('/', protect, getAuthors);

router.get('/:authorId', protect, authorize('admin'), getAuthor);
router.get('/:id/books', protect, authorize('admin'), getAuthors);
router.post('/', protect, authorize('admin'), createAuthor);

router.put('/:authorId', protect, authorize('admin'), updateAuthor);

router.delete('/:authorId', protect, authorize('admin'), deleteAuthor);

module.exports = router;
