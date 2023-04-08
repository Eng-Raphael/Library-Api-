const express = require('express');

const router = express.Router();

const {
  addBookToUser,
  updateBookToUser,
} = require('../controllers/user');

const { protect } = require('../middleware/auth');

router
  .route('/:id/book')
  .post(protect, addBookToUser)
  .put(protect, updateBookToUser);
module.exports = router;
