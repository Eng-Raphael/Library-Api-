const express = require('express');

const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
  userPhotoUpload,
} = require('../controllers/auth');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// router
// .route('/:id/photo')
// .put(protect ,userPhotoUpload)

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
