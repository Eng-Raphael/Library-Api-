/* eslint-disable consistent-return */
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const Category = require('../models/Category');
const Book = require('../models/Book');
// @desc Get all categories
// @route GET /api/categories
// @access Public
exports.getCategories = asyncHandler(async (req, res) => {
  res.status(200).json(res.advancedResults);
});

// @desc Get all books belong to category
// @route GET /api/categories/:id/books
// @access Public
exports.getAllBooksOfCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ success: false, errors: ['Category not found'] });
  }
  const books = await Book.find({ category: categoryId }).populate('category');
  if (!books || books.length === 0) {
    return res.status(404).json({ success: false, errors: ['No books found for this category'] });
  }
  res.status(200).json({ success: true, count: books.length, data: books });
});
// @desc Get a category
// @route GET /api/categories/:categoryId
// @access Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return next(
      new ErrorResponse(`Category not found with id: ${req.params.categoryId}`, 404),
    );
  }
  return res.status(200).json({ success: true, data: category });
});

// @desc Create A Category
// @route POST /api/categories
// @access Private (Admin)
exports.createCategory = [
  body('name')
    .isLength({ min: 3, max: 20 })
    .withMessage('Category name must be between 3 and 20 characters'),
  // eslint-disable-next-line consistent-return
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorArray = errors.array().map((error) => error.msg);
        return res.status(400).json({ errors: errorArray });
      }

      const category = new Category({
        name: req.body.name,
      });

      await category.save();

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },
];

// @desc Update A Category
// @route PUT /api/categories/:categoryId
// @access Private (Admin)
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.categoryId);

  console.log(category);
  if (!category) {
    return next(new ErrorResponse(`Category with id ${req.params.categoryId} not found`, 404));
  }

  console.log(req.body);
  const { name } = req.body;

  if (name) {
    category = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { name },
      { new: true, runValidators: true },
    );
  }

  console.log(category);
  return res.status(200).json({ success: true, data: category });
});

// @desc Delete a category
// @route DELETE /api/categories/:categoryId
// @access Private (Admin)

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return next(
        new ErrorResponse(`Category not found with id of ${req.params.categoryId}`, 404),
      );
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
