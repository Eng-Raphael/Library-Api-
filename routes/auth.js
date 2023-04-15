const express = require('express');

const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

// router
// .route('/:id/photo')
// .put(protect ,userPhotoUpload)

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
