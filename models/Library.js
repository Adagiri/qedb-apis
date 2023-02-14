const mongoose = require('mongoose');
const { QuestionSchemaType } = require('./Question');

const librarySchema = new mongoose.Schema({
  id: {
    type: String,
  },

  user: {
    type: mongoose.ObjectId,
    required: true,
  },

  title: { type: String, required: [true, 'Please add a title'] },

  questions: {},

  content: [QuestionSchemaType],
});

module.exports = mongoose.model('Library', librarySchema);
