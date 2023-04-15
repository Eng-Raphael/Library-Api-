/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');

const Author = require('../models/Author');
const Book = require('../models/Book');
/* eslint-disable no-underscore-dangle */

// @desc Get all authors
// @route GET /api/authors
// @route GET /api/authors/:authorId/books
// @access Public
exports.getAuthors = asyncHandler(async (req, res) => {
  if (req.params.id) {
    const author = await Author.findById(req.params.id).select('_id firstName lastName');
    if (!author) {
      return res.status(404).json({
        success: false,
        errors: ['Author not found'],
      });
    }
    const authorBooks = await Book.find({ author: author._id }).populate('category', 'name');
    if (authorBooks.length === 0) {
      return res.status(404).json({
        success: false,
        errors: ['Books not found for the author'],
      });
    }
    const books = authorBooks.map((book) => ({
      name: book.name,
      image: book.image,
      category: book.category ? book.category.name : '',
    }));

    res.status(200).json({
      success: true,
      data: books,
      author,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc Get single author
// @route GET /api/authors/:authorId
// @access Public
exports.getAuthor = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.authorId);
  if (!author) {
    return res.status(404).json({ success: false, errors: [`Author not found with id: ${req.params.authorId}`] });
  }
  return res.status(200).json({ success: true, data: author });
});

// @desc Create an author
// @route POST /api/authors
// @access Private (Admin)
// Set up file storage configuration
exports.createAuthor = asyncHandler(async (req, res, next) => {
  const image = req.files ? req.files.image : null;
  await Promise.all([
    body('firstName')
      .isLength({ min: 3, max: 20 })
      .withMessage('First name should be between 3 to 20 characters')
      .exists()
      .withMessage('First name is required')
      .run(req),
    body('lastName')
      .isLength({ min: 3, max: 20 })
      .withMessage('Last name should be between 3 to 20 characters')
      .exists()
      .withMessage('Last name is required')
      .run(req),
    body('dob')
      .exists().withMessage('Date of birth is required')
      .isDate()
      .withMessage('Invalid date of birth')
      .toDate()
      .run(req),
    body('image')
      .exists()
      .withMessage('Please upload an image file')
      .custom((value, { req }) => {
        if (!value.mimetype.startsWith('image')) {
          throw new Error('Please upload an image file');
        }
        return true;
      })
      .custom((value, { req }) => {
        if (value.size > process.env.MAX_FILE_UPLOAD) {
          throw new Error(`Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`);
        }
        return true;
      }),
  ]);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { firstName, lastName, dob } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, errors: ['Please upload an image'] });
  }
  // Check if author already exists
  const existingAuthor = await Author.findOne({ firstName, lastName });
  if (existingAuthor) {
    return res.status(400).json({ success: false, errors: ['Author with this name already exists'] });
  }
  const imageExt = path.extname(image.name);
  const imageName = `photo_author_${firstName}_${lastName}${imageExt}`;

  await image.mv(
    `${process.env.FILE_UPLOAD_PATH}/authors/${imageName}`,
    async (err) => {
      if (err) {
        return res.status(500).json({ success: false, errors: ['Error while file upload'] });
      }

      const author = new Author({
        firstName,
        lastName,
        dob,
        image: imageName,
      });

      await author.save();

      res.status(201).json({
        success: true,
        data: author,
      });
    },
  );
});
// @desc Update an author
// @route PUT /api/authors/:authorId
// @access Private (Admin)
// eslint-disable-next-line consistent-return
exports.updateAuthor = asyncHandler(async (req, res, next) => {
  const image = req.files ? req.files.image : null;

  await Promise.all([
    body('firstName')
      .isLength({ min: 2, max: 20 })
      .withMessage('First name should be between 2 to 20 alphabets')
      .notEmpty()
      .withMessage('Please add your first name')
      .run(req),
    body('lastName')
      .isLength({ min: 2, max: 20 })
      .withMessage('Last name should be between 2 to 20 alphabets')
      .notEmpty()
      .withMessage('Please add your last name')
      .run(req),
    body('image')
      .custom(async (value, { req }) => {
        if (value && value.size > process.env.MAX_FILE_UPLOAD) {
          throw new Error(`Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`);
        }
        return true;
      }),
  ]);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { firstName, lastName } = req.body;
  let imageName = null;

  if (image) {
    const imageExt = path.extname(image.name);
    imageName = `photo_author_${firstName}_${lastName}${imageExt}`;
    await image.mv(
      `${process.env.FILE_UPLOAD_PATH}/authors/${imageName}`,
      async (err) => {
        if (err) {
          return res.status(500).json({ success: false, errors: ['Error while file upload'] });
        }
      },
    );
  } else {
    const author = await Author.findById(req.params.authorId);
    imageName = author.image;
  }

  const author = await Author.findByIdAndUpdate(
    req.params.authorId,
    { ...req.body, image: imageName },
    { new: true, runValidators: true },
  );

  if (!author) {
    return res.status(404).json({ success: false, errors: [`Author not found with id: ${req.params.authorId}`] });
  }

  return res.status(200).json({ success: true, data: author });
});

// @desc Delete an author
// @route DELETE /api/authors/:authorId
// @access Private (Admin)
// eslint-disable-next-line consistent-return
exports.deleteAuthor = asyncHandler(async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.authorId);

    if (!author) {
      return res.status(404).json({ success: false, errors: [`author not found with id of ${req.params.authorId}`] });
    }

    // Delete all books related to the author
    await Book.deleteMany({ author: author._id });

    if (author.image !== 'default.png') {
      const imagePath = `${process.env.FILE_UPLOAD_PATH}/authors/${author.image}`;

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Author.deleteOne({ _id: req.params.authorId });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
});

// @desc GET popular authors
// @route GET /api/authors/popular/books/popular
// @access Private (Admin)
exports.getPopularAuthorAndBooks = asyncHandler(async (req, res, next) => {
  try {
    // Find the author with the highest average rating
    const popularAuthors = await Author.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'author',
          as: 'books',
        },
      },
      {
        $unwind: '$books',
      },
      {
        $group: {
          _id: '$_id',
          firstName: { $first: '$firstName' },
          lastName: { $first: '$lastName' },
          image: { $first: '$image' },
          avgRating: { $avg: '$books.avgRating' },
        },
      },
      {
        $sort: {
          avgRating: -1,
        },
      },
      {
        $limit: 4,
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'author',
          as: 'books',
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          avgRating: 1,
          image: 1,
          books: 1,
        },
      },
    ]);
    // Find the books with the highest average rating
    const popularBooks = await Book.find()
      .sort({ avgRating: -1 })
      .limit(5)
      .populate('author')
      .populate('category');

    res.status(200).json({
      success: true,
      data: {
        popularAuthor: popularAuthors.slice(0, 3),
        popularBooks,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @desc GET popular authors with thier popular books 3 for each
// @route GET /api/authors/books/popular
// @access Private (Admin)
exports.getPopularAuthorsAndThierPoularBooks = asyncHandler(async (req, res, next) => {
  try {
    // Find the top 3 authors with the highest average rating
    const popularAuthors = await Author.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'author',
          as: 'books',
        },
      },
      {
        $unwind: '$books',
      },
      {
        $group: {
          _id: '$_id',
          firstName: { $first: '$firstName' },
          lastName: { $first: '$lastName' },
          avgRating: { $avg: '$books.avgRating' },
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

    // Get the top 3 books for each of the top 3 authors
    const popularBooks = await Book.aggregate([
      {
        $match: {
          author: {
            $in: popularAuthors.map((author) => author._id),
          },
        },
      },
      {
        $group: {
          _id: '$author',
          books: {
            $push: {
              _id: '$_id',
              name: '$name',
              category: '$category',
              avgRating: '$avgRating',
            },
          },
          avgRating: {
            $avg: '$avgRating',
          },
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
      {
        $facet: {
          authors: [
            {
              $lookup: {
                from: 'authors',
                localField: '_id',
                foreignField: '_id',
                as: 'author',
              },
            },
            {
              $project: {
                author: {
                  $arrayElemAt: ['$author', 0],
                },
                books: {
                  $slice: ['$books', 3],
                },
                avgRating: 1,
              },
            },
          ],
          books: [
            {
              $unwind: '$books',
            },
            {
              $sort: {
                'books.avgRating': -1,
              },
            },
            {
              $group: {
                _id: '$_id',
                name: {
                  $first: '$books.name',
                },
                category: {
                  $first: '$books.category',
                },
                author: {
                  $first: '$author',
                },
                avgRating: {
                  $first: '$books.avgRating',
                },
              },
            },
            {
              $limit: 9,
            },
          ],
        },
      },
    ]);

    if (popularAuthors.length === 0 || popularBooks.length === 0) {
      return res.status(404).json({
        success: false,
        errors: ['Results not found'],
      });
    }

    res.status(200).json({
      success: true,
      data: {
        popularAuthors: popularBooks[0].authors,
        popularBooks: popularBooks[0].books,
      },
    });
  } catch (err) {
    next(err);
  }
});

// exports.getPopularAuthorAndBooks = asyncHandler(async (req, res, next) => {
//   try {
//     // Find the author with the highest average rating
//     const popularAuthors = await Author.aggregate([
//       {
//         $lookup: {
//           from: 'books',
//           localField: '_id',
//           foreignField: 'author',
//           as: 'books',
//         },
//       },
//       {
//         $unwind: '$books',
//       },
//       {
//         $group: {
//           _id: '$_id',
//           firstName: { $first: '$firstName' },
//           lastName: { $first: '$lastName' },
//           avgRating: { $avg: '$books.avgRating' },
//         },
//       },
//       {
//         $sort: {
//           avgRating: -1,
//         },
//       },
//       {
//         $limit: 3,
//       },
//     ]);

//     // Find the books with the highest average rating
//     const popularBooks = await Book.aggregate([
//       {
//         $group: {
//           _id: '$_id',
//           name: { $first: '$name' },
//           category: { $first: '$category' },
//           author: { $first: '$author' },
//           avgRating: { $avg: '$avgRating' },
//         },
//       },
//       {
//         $sort: {
//           avgRating: -1,
//         },
//       },
//       {
//         $limit: 10,
//       },
//     ]);
// if (popularAuthors.length === 0 || popularBooks.length === 0) {
//   return res.status(404).json({
//     success: false,
//     errors: ['Results not found'],
//   });
// }

//     res.status(200).json({
//       success: true,
//       data: {
//         popularAuthor: popularAuthors.slice(0, 3),
//         popularBooks,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// });
