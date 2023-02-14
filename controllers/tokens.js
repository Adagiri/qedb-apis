const crypto = require('crypto');

const asyncHandler = require('../middlewares/async');

const Token = require('../models/Token');

const requestIp = require('request-ip');

module.exports.handleToken = asyncHandler(async (req, res, next) => {
  if (req.query.action === 'create') {
    const ip = requestIp.getClientIp(req);

    const tokenCount = await Token.countDocuments({ ip });

    if (tokenCount > 10) {
      return res.status(200).json({ success: true });
    }

    const token = await Token.create({
      token: crypto.randomBytes(30).toString('hex'),
      ip,
    });

    return res.status(200).json({ success: true, token: token.token });
  } else if (req.query.action === 'reset') {
    if (!req.query.token) {
      return res
        .status(200)
        .json({
          success: true,
          response_code: 2,
          message: 'Please specify a token to reset',
        });
    }

    const token = await Token.findOneAndUpdate(
      {
        token: req.query.token,
      },
      {
        $set: {
          questions: [],
          ttl: new Date(
            new Date().getTime() + 10 * 60 * 60 * 1000
          ).toISOString(),
        },
      }
    );

    if (!token) {
      return res.json({
        response_code: 3,
        message: 'Token not found',
      });
    }

    res.status(200).json({ success: true, token: token.token });
  }
  res.status(200).json({ success: true });
});
