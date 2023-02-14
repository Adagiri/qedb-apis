const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // Main
  type: {
    type: String,
    enum: ['multiple_choice', 'boolean'],
    required: [true, 'Please select a question type'],
  },

  id: {
    type: String,
    required: true,
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Please select question difficulty'],
  },

  text: {
    type: String,
    required: [true, 'Please add a question text'],
  },

  options: {
    _id: false,
    type: [String],
    required: true,
  },

  explanation: {
    type: String,
    maxlength: [800, 'Explanation must not exceed 800 characters'],
  },

  answer: {
    type: String,
    required: [true, 'Please add an answer'],
  },

  image: String,

  // Sub

  credits: {
    _id: false,
    type: [
      {
        title: String,
        link: String,
      },
    ],
    required: true,
  },

  author: {
    id: { type: mongoose.ObjectId, required: true },
    username: { type: String, required: true },
  },

  status: {
    type: String,
    enum: ['approved', 'rejected', 'pending'],
    default: 'pending',
    required: true,
  },

  handledBy: {
    id: mongoose.ObjectId,
    username: String,
  },

  category: {
    type: [String],
    required: [true, 'Please add categories'],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Question', QuestionSchema);
module.exports.QuestionSchemaType = QuestionSchema;