const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');

const User = require('../models/User');

// Protect routes
module.exports.protect = asyncHandler(async (req, res, next) => {
  console.log(req.headers.authorization)
  let token = req.headers.authorization
    ? req.headers.authorization.split(' ')[1]
    : '';

    console.log(token)

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse(401, 'Please login to continue'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decoded)

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorResponse(404, 'User does not exist'));
    }

    req.user.id = req.user._id;

    next();
  } catch (err) {
    console.log(err)
    return next(
      new ErrorResponse(401, 'You are not authorized to access this route')
    );
  }
});

// Grant access to specific users
module.exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(403, `You are not authorized to access this route`)
      );
    }
    next();
  };
};
