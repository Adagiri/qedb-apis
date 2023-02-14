const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const asyncHandler = require('../middlewares/async');

const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');
const Question = require('../models/Question');
const cache = require('../utils/cache');

const { getSignedUrl } = require('../utils/fileUploads');
const Library = require('../models/Library');

module.exports.getLibraries = asyncHandler(async (req, res, next) => {
  let libraries = await Library.find().select('-_id -__v');

  libraries = libraries.map((lib) => {
    lib.id = lib._id;
    return lib;
  });

  res.header('X-Total-Count', libraries.length);
  res.status(200).json(libraries);
});

module.exports.getLibraries = asyncHandler(async (req, res, next) => {
  let libraries = await Library.find().select('_id -__v');

  libraries = libraries.map((lib) => {
    lib.id = lib._id;
    return lib;
  });

  res.header('X-Total-Count', libraries.length);
  res.status(200).json(libraries);
});

module.exports.userLibraries = asyncHandler(async (req, res, next) => {
  let libraries = await Library.find({ user: req.user.id })
    .select('_id -__v')
    .sort({ _id: -1 });

  const questionsId = [];

  libraries.forEach((library) => {
    questionsId.push(...library.questions);
  });

  const questions = await Question.find({ _id: questionsId }).select(
    '-explanation -author'
  );

  libraries = libraries.map((lib) => {
    lib.id = lib._id;
    lib.questions = lib.questions
      .map((question) => {
        const content = questions.find(
          (quest) => quest._id.toString() === question.toString()
        );
        return content ? content : undefined;
      })
      .filter((question) => question !== undefined);
    console.log(lib);
    return lib;
  });

  res.header('X-Total-Count', libraries.length);
  res.status(200).json(libraries);
});

module.exports.getLibrary = asyncHandler(async (req, res, next) => {
  let library = await Library.findById(req.params.libraryId);

  library.id = library._id;

  const content = await Question.find({ _id: { $in: library.questions } });
  library.content = content;

  res.status(200).json(library);
});

module.exports.addLibrary = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const library = await Library.create(req.body);

  library.id = library._id;
  res.status(200).json(library);
});

module.exports.editLibrary = asyncHandler(async (req, res, next) => {
  const library = await Library.findByIdAndUpdate(
    req.params.libraryId,
    req.body,
    { new: true }
  );

  library.id = library._id;
  res.status(200).json(library);
});

module.exports.deleteLibrary = asyncHandler(async (req, res, next) => {
  const library = await Library.findByIdAndDelete(req.params.libraryId);

  res.status(200).json({ success: true });
});
