const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const asyncHandler = require('../middlewares/async');

const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');
const Question = require('../models/Question');
const cache = require('../utils/cache');

const { getSignedUrl } = require('../utils/fileUploads');

module.exports.getCategories = asyncHandler(async (req, res, next) => {
  let categories = await Category.find().select('-_id -__v');

  categories = categories.map((catz) => {
    catz.id = catz.key;
    catz.image = catz.image || 'https://marmelab.com/posters/animals-10.jpeg';
    return catz;
  });

  res.header('X-Total-Count', categories.length);
  res.status(200).json(categories);
});

module.exports.apiGetCategories = asyncHandler(async (req, res, next) => {
  let categories = await Category.find().select('-_id -__v');

  res.status(200).json(
    categories.map((cat) => {
      delete cat._id;
      return cat;
    })
  );
});

module.exports.getCategory = asyncHandler(async (req, res, next) => {
  const categories = await cache.get('categories');
  let category = categories.find((catz) => catz.key === req.params.categoryKey);

  category.id = category.key;
  res.status(200).json(category);
});

module.exports.apiGetCategory = asyncHandler(async (req, res, next) => {
  const categories = await cache.get('categories');
  let category = categories.find((catz) => catz.key === req.params.categoryKey);

  const count = await Question.countDocuments({
    category: req.params.categoryKey,
  });

  category = {
    key: category.key,
    name: category.name,
    count,
  };

  res.status(200).json({ success: true, category });
});

module.exports.addCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  const updatedCategories = await Category.find();
  cache.set('categories', updatedCategories);

  category.id = category.key;

  res.status(200).json(category);
});

module.exports.editCategory = asyncHandler(async (req, res, next) => {
  const update = {};
  req.body.name && (update.name = req.body.name);
  req.body.image && (update.image = req.body.image);

  console.log(req.params.categoryKey);

  const category = await Category.findOneAndUpdate(
    { key: req.params.categoryKey },
    update
  );

  category.id = category.key;

  res.status(200).json(category);
});
