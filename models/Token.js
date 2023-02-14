const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true],
  },

  questions: {
    type: [String],
  },

  ip: {
    type: String,
    required: true,
  },

  ttl: {
    type: Date,
    default: Date.now,
    expires: 36000,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Token', TokenSchema);
