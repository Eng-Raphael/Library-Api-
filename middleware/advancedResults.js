const advancedResults = (model, ...populate) => async (req, res, next) => {
  let query;
  // copy req.qeury
  const reqQeury = { ...req.query };

  // field of query to execlude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // loop over removedField and delete them from requestQuery
  removeFields.forEach((param) => delete reqQeury[param]);

  // create query string
  let queryStr = JSON.stringify(reqQeury);

  // create operators($get,$gte,$lt,$lte,$in)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

  // finding resource
  query = model.find(JSON.parse(queryStr));

  // select Feilds
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // default sort is created at
    query = query.sort('-createdAt');
  }

  // pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate.length > 0) {
    query = query.populate(populate);
  }

  // execute query
  const results = await query;

  // pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
