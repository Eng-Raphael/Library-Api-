const express = require('express');

const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category');

const { protect, authorize } = require('../middleware/auth');

const advancedResults = require('../middleware/advancedResults');
const Category = require('../models/Category');

router.route('/').get(advancedResults(Category), getCategories);
router.get('/', getCategories);

router.get('/:categoryId', getCategory);

router.post('/', protect, authorize('admin'), createCategory);

router.put('/:categoryId', protect, authorize('admin'), updateCategory);

router.delete('/:categoryId', protect, authorize('admin'), deleteCategory);

module.exports = router;
