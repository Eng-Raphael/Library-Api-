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
const Author = require('../models/Author');

router.route('/').get(advancedResults(Author), getAuthors);
router.get('/', getAuthors);

router.get('/:authorId', getAuthor);

router.post('/', createAuthor);

router.put('/:authorId', updateAuthor);

router.delete('/:authorId', deleteAuthor);

module.exports = router;
