const crypto = require('crypto');
const asyncHandler = require('../middlewares/async');

const Question = require('../models/Question');
const Token = require('../models/Token');
const User = require('../models/User');
const cache = require('../utils/cache');
const ErrorResponse = require('../utils/errorResponse');

module.exports.getQuestions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

module.exports.apiGetQuestions = asyncHandler(async (req, res, next) => {
  let query = req.query;

  // Check for invalid parameters

  if (query.amount && isNaN(query.amount)) {
    return res.status(200).json({
      response_code: 2,
      results: [],
      message: `'amount' got invalid value: ${query.amount}`,
    });
  }

  if (
    query.type &&
    query.type !== 'boolean' &&
    query.type !== 'multiple_choice'
  ) {
    return res.status(200).json({
      response_code: 2,
      results: [],
      message: `'type' got invalid value: ${query.type}`,
    });
  }

  if (
    query.difficulty &&
    query.difficulty !== 'easy' &&
    query.difficulty !== 'medium' &&
    query.difficulty !== 'hard'
  ) {
    return res.status(200).json({
      response_code: 2,
      results: [],
      message: `'difficulty' got invalid value: ${query.difficulty}`,
    });
  }

  const amount = parseInt(query.amount) <= 50 ? parseInt(query.amount) : 50;
  const tokenKey = query.token;
  // Filter unaccepted query fields
  const acceptedFields = ['type', 'difficulty', 'category'];

  for (const key in query) {
    if (acceptedFields.indexOf(key) === -1) {
      delete query[key];
    }
  }

  let token = { questions: [] };
  let questions = [];

  // Check that token exists and has not expired
  if (tokenKey) {
    token = await Token.findOne({ token: tokenKey });

    if (!token) {
      return res
        .status(200)
        .json({ response_code: 3, results: [], message: 'Token not found' });
    }
  }

  // Redefine query to suit mongodb query syntaxes
  query.category && (query.category = { $in: query.category.split(',') });
  query.id = {
    $nin: token.questions,
  };
  query.status = 'approved';

  // Get questions

  questions = await Question.aggregate([
    { $match: query },
    { $sample: { size: amount } },
    {
      $project: {
        author: 0,
        status: 0,
        handledBy: 0,
        createdAt: 0,
        __v: 0,
        _id: 0,
      },
    },
  ]);
  // questions = await Question.find(query)
  //   .limit(amount)
  //   .select('-author -status -_id -handledBy -createdAt -__v');

  // Update the token.questions field
  questions.length &&
    (await Token.findByIdAndUpdate(token._id, {
      $push: {
        questions: { $each: questions.map((question) => question.id) },
      },
    }));

  // Transform questions' category field from ids to readable names
  const categories = await cache.get('categories');

  if (!questions.length) {
    return res.status(200).json({
      response_code: 0,
      results: [],
      message: `No more questions match your query`,
      count: 0,
    });
  }

  questions = questions.map((question) => {
    if (question.category) {
      question.category = question.category.map(
        (catz) => categories[catz].name
      );
    }

    delete question.id;
    return question;
  });

  res
    .status(200)
    .json({ response_code: 1, count: questions.length, results: questions });
});

// @desc      Get a single question
// @route     GET /api/v1/question/:id
// @access    Public

module.exports.getQuestion = asyncHandler(async (req, res, next) => {
  const question = await Question.findById(req.params.questionId);
  question.id = question._id;
  res.status(200).json(question);
});

module.exports.getQuestionsStats = asyncHandler(async (req, res, next) => {
  const approved = await Question.countDocuments({ status: 'approved' });
  const pending = await Question.countDocuments({ status: 'pending' });
  res.status(200).json({ approved, pending });
});

// @desc      Add a question - public
// @route     POST /api/v1/question/:id
// @access    Private

module.exports.addQuestionPublic = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  // Check if category was added
  if (!req.body.category?.length) {
    return next(new ErrorResponse(400, 'Please include categories'));
  }

  // Include author field
  req.body.author = {
    username: user.username,
    id: user._id,
  };

  // Such question must be of pending status
  req.body.status = 'pending';

  // Include id field
  req.body.id = crypto.randomBytes(20).toString('hex');

  const question = await Question.create(req.body);

  // Update relevant user fields

  user.hasPosts = true;
  user.qposted = user.qposted + 1;
  user.qpending = user.qpending + 1;

  await user.save();
  question.id = question._id;

  res.status(200).json(question);
});

// @desc      Add a question
// @route     POST /api/v1/question/:id
// @access    Private

module.exports.addQuestion = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  console.log(req.user);
  // Check if category was added
  if (!req.body.category?.length) {
    return next(new ErrorResponse(400, 'Please include categories'));
  }

  // Include author field
  req.body.author = {
    username: user.username,
    id: user._id,
  };

  // Include id field
  req.body.id = crypto.randomBytes(20).toString('hex');

  const question = await Question.create(req.body);

  // Update relevant user fields

  user.hasPosts = true;
  user.qposted = user.qposted + 1;
  user.qapproved = user.qapproved + 1;

  await user.save();
  question.id = question._id;

  res.status(200).json(question);
});

// @desc      Edit a question
// @route     POST /api/v1/question/:questionId
// @access    Private

module.exports.editQuestion = asyncHandler(async (req, res, next) => {
  // - check for empty option fields
  console.log('before', req.body.options);
  req.body.options = req.body.options.filter((option) => !!option);
  console.log('after', req.body.options);

  // - check for options not less than two
  if (req.body.options.length < 2) {
    return next(new ErrorResponse(400, 'Options cannot be less than 2'));
  }

  // - check for answers not matching any options
  if (req.body.options.indexOf(req.body.answer) === -1) {
    return next(new ErrorResponse(400, 'Answer does not match an option'));
  }

  const question = await Question.findByIdAndUpdate(
    req.params.questionId,
    req.body
  );

  if (req.body.status === 'rejected') {
    await User.findByIdAndUpdate(req.body.author.id, {
      $inc: { qpending: -1, qrejected: 1 },
    });
  }

  if (req.body.status === 'accepted') {
    await User.findByIdAndUpdate(req.body.author.id, {
      $inc: { qpending: -1, qapproved: 1 },
    });
  }

  question.id = question._id;
  res.status(200).json(question);
});

// addQuestion;
