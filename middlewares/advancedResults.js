const mongoose = require('mongoose');
const User = require('../models/User');
const cache = require('../utils/cache');
const ErrorResponse = require('../utils/errorResponse');

const advancedResults = (model, resourceName) => async (req, res, next) => {
  let query;
  if (req.query.limit && req.query.limit > 50) {
    return next(new ErrorResponse(400, 'Limit must not exceed 50'));
  }

  // Copy req.query
  const reqQuery = { ...req.query };

  console.log('query', req.query);

  // Fields to exclude
  const removeFields = [
    'select',
    'sort',
    'page',
    'limit',
    '_sort',
    '_end',
    '_start',
    '_order',
  ];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Text search for results
  queryStr = JSON.parse(queryStr);

  // Transform query

  const dateFields = [
    'createdAt.$gt',
    'createdAt.$gte',
    'createdAt.$lt',
    'createdAt.$lte',
  ];

  for (const key in queryStr) {
    if (!dateFields.find((field) => field === key)) {
      console.log('queryStr before', queryStr);

      if (key !== 'search') {
        queryStr[key] = {
          $in:
            typeof queryStr[key] === 'object'
              ? queryStr[key]
              : queryStr[key].split(','),
        };
      }

      console.log('queryStr after', queryStr);
    }
  }

  queryStr.search &&
    (queryStr.text = { $regex: queryStr.search, $options: 'i' });

  queryStr.id && (queryStr._id = queryStr.id);
  queryStr['author.id'] &&
    (queryStr['author.id'] = [
      mongoose.Types.ObjectId(queryStr['author.id'][0]),
    ]);
  delete queryStr.id;

  // Transform query for date comparism
  dateFields.forEach((query) => {
    console.log('query', query);
    if (queryStr[query]) {
      queryStr['$expr'] = {
        [query.split('.')[1]]: [
          { $dateToString: { date: '$createdAt' } },
          queryStr[query],
        ],
      };

      delete queryStr[query];
    }
  });

  // Search on all fields for users' collesction
  if (resourceName === 'User') {
    queryStr.q &&
      (queryStr['$or'] = [
        { email: { $regex: queryStr.q, $options: 'i' } },
        { username: { $regex: queryStr.q, $options: 'i' } },
      ]);
  }

  console.log(queryStr, 'final');

  queryStr.id && (queryStr._id = queryStr.id);

  // Finding resource
  query = model.find(queryStr);

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort || req.query._sort) {
    req.query.sort =
      req.query._order === 'ASC' ? req.query._sort : '-' + req.query._sort;

    const sortBy = req.query.sort.split(',').join(' ');

    console.log(sortBy);
    query = query.sort(sortBy);
  } else {
    query = query.sort('-_id');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit =
    parseInt(req.query._end, 10) - parseInt(req.query._start, 10) || 20;
  const startIndex = parseInt(req.query._start, 10);
  const endIndex = parseInt(req.query._end, 10);
  const total = await model.countDocuments(queryStr);
  console.log(startIndex, 'sI');
  query = query.skip(startIndex).limit(limit);

  // Executing query

  try {
    let results = await query;
    console.log('after results');

    // If resource been handled is Question, Transform each question category field from ids to readable names
    if (resourceName === 'Question') {
      const userIds = results.map((res) => res.author.id);
      const categories = await cache.get('categories');
      const users = await User.find({ _id: userIds }).select('username');

      results = results.map((question) => {
        const author = users.find(
          (user) => user._id.toString() === question.author.id.toString()
        );
        if (author) {
          question.author.username = author.username;
        }

        return question;
      });

      results = results.map((question) => {
        if (question.category) {
          question.category = question.category.map(
            (catz) => categories.find((categori) => categori.key === catz).name
          );
        }

        question.id = question._id;
        console.log(question.category);
        // delete question._id;
        return question;
      });
    }

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }
    console.log(total, endIndex);
    const hasMoreResult =
      total > endIndex - limit + results.length ? true : false;
    results = results.map((result) => {
      result.id = result._id;
      delete result.__v;
      return result;
    });

    res.header('X-Total-Count', total);
    res.header('Has-More-Result', hasMoreResult);

    // console.log(results);

    res.advancedResults = results;
  } catch (error) {
    next(error);
  }

  next();
};

module.exports = advancedResults;
