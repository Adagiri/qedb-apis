const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {
    type: String,
  },
  key: {
    type: String,
    unique: true,
    required: [true, 'Please add category key'],
  },
  name: {
    type: String,
    unique: true,
    required: [true, 'Please add category name'],
  },
  image: {
    type: String
  }
});

module.exports = mongoose.model('Category', categorySchema);
