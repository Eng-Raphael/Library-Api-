const express = require('express');

const router = express.Router();

const {
  addBookToUser,
  updateBookToUser,
  deleteBookForUser,
} = require('../controllers/user');

const { protect } = require('../middleware/auth');

router
  .route('/:id/book')
  .post(protect, addBookToUser)
  .put(protect, updateBookToUser)
  .delete(protect, deleteBookForUser);
module.exports = router;
