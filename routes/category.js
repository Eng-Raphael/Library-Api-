const express = require('express');

const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category');

const advancedResults = require('../middleware/advancedResults');
const Category = require('../models/Category');

router.route('/').get(advancedResults(Category), getCategories);
router.get('/', getCategories);

router.get('/:categoryId', getCategory);

router.post('/', createCategory);

router.put('/:categoryId', updateCategory);

router.delete('/:categoryId', deleteCategory);

module.exports = router;
