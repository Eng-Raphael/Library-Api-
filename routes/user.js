const express = require('express');

const router = express.Router();

const {
  addBookToUser,
} = require('../controllers/user');

const { protect } = require('../middleware/auth');

router
  .route('/:id/book')
  .post(protect, addBookToUser);

module.exports = router;
