/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
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
    return res.status(404).json({ success: false, errors: [`Category not found with id: ${req.params.categoryId}`] });
  }
  return res.status(200).json({ success: true, data: category });
});

// @desc Create A Category
// @route POST /api/categories
// @access Private (Admin)
exports.createCategory = [
  body('name')
    .isLength({ min: 3, max: 20 })
    .withMessage('Category name must be between 3 and 20 characters')
    .not()
    .isNumeric()
    .withMessage('Category cannot be a number')
    .custom(async (value) => {
      const category = await Category.findOne({ name: value });
      if (category) {
        throw new Error('Category name already exists');
      }
    }),
  // eslint-disable-next-line consistent-return
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorArray = errors.array().map((error) => error.msg);
        return res.status(400).json({ success: false, errors: errorArray });
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
  const { name } = req.body;

  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return res.status(404).json({ success: false, errors: [`Category with id ${req.params.categoryId} not found`] });
  }

  // Check if category name already exists
  const categoryByName = await Category.findOne({ name });
  if (categoryByName && categoryByName._id.toString() !== req.params.categoryId) {
    return res.status(400).json({ success: false, errors: ['Category name already exists'] });
  }

  // Update category name
  category.name = name;
  await category.save();

  res.status(200).json({ success: true, data: category });
});

// @desc Delete a category
// @route DELETE /api/categories/:categoryId
// @access Private (Admin)

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return res.status(404).json({ success: false, errors: [`Category not found with id of ${req.params.categoryId}`] });
    }

    // Delete all books related to the category
    await Book.deleteMany({ category: category._id });

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc GET popular category
// @route Get /api/categories/popular
// @access Private (Admin)
exports.getPopularCategory = asyncHandler(async (req, res, next) => {
  try {
    const categoriesWithHighestAvgRating = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          avgRating: { $avg: '$avgRating' },
        },
      },
      {
        $sort: {
          avgRating: -1,
        },
      },
      {
        $limit: 3,
      },
    ]);

    if (categoriesWithHighestAvgRating.length === 0) {
      res.status(404).json({ success: false, errors: ['no category found'] });
    }

    const categoryIds = categoriesWithHighestAvgRating.map((category) => category._id);
    const Popularcategories = await Category.find({ _id: { $in: categoryIds } });

    res.status(200).json({ Popularcategories });
  } catch (err) {
    next(err);
  }
});
