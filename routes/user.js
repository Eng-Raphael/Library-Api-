const express = require('express');

const router = express.Router();

const {
  addBookToUser,
  updateBookToUser,
  deleteBookForUser,
  addReviewToBook,
  updateReviewForBook,
  deleteReviewForBook,
} = require('../controllers/user');

const { protect } = require('../middleware/auth');

router
  .route('/:id/book')
  .post(protect, addBookToUser)
  .put(protect, updateBookToUser)
  .delete(protect, deleteBookForUser);

router.route('/book/:id/review').post(protect, addReviewToBook);
router.route('/book/:id/review').put(protect, updateReviewForBook);
router.route('/book/:id/review').delete(protect, deleteReviewForBook);
module.exports = router;
