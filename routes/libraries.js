const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
  getLibraries,
  addLibrary,
  getLibrary,
  editLibrary,
  userLibraries,
  deleteLibrary,
} = require('../controllers/libraries');

const router = express.Router();

router.route('/').get(getLibraries).post(protect, addLibrary);

router.get('/user-libraries', protect, userLibraries);

router
  .route('/:libraryId')
  .get(getLibrary)
  .put(protect, editLibrary)
  .delete(protect, deleteLibrary);

module.exports = router;
