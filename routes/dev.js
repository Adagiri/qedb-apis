const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  getCategories,
  addCategory,
  getCategory,
  apiGetCategory,
} = require('../controllers/categories');
const { apiGetQuestions } = require('../controllers/questions');

const router = express.Router();

router.get('/categories/:categoryKey', apiGetCategory);
router.get('/questions', apiGetQuestions);
router.get('/categories', getCategories);
router.route('/token').get(generateToken);
router.route('token/:token').put(resetToken);

module.exports = router;
