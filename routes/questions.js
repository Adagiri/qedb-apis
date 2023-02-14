const express = require('express');

const {
  getQuestion,
  apiGetQuestions,
  addQuestion,
  editQuestion,
  getQuestions,
  addQuestionPublic,
  getQuestionsStats,
} = require('../controllers/questions');

const { protect, authorize } = require('../middlewares/auth');
const advancedResults = require('../middlewares/advancedResults');

const Question = require('../models/Question');

const router = express.Router();

router
  .route('/')
  .get(advancedResults(Question, 'Question'), getQuestions)
  .post(protect, addQuestion);

// Qedb public api specific
router.get('/public', apiGetQuestions);

router.post('/public-add', protect, addQuestionPublic);
router.get('/question-stats', getQuestionsStats);
router
  .route('/:questionId')
  .get(getQuestion)
  .put(protect, authorize('Moderator', 'Admin'), editQuestion);

module.exports = router;
