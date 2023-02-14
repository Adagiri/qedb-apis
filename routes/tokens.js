const express = require('express');
const { handleToken,  } = require('../controllers/tokens');

const router = express.Router();

router
  .route('/public')
  .get(handleToken)

module.exports = router;
