const mongoose = require('mongoose');
const cache = require('../utils/cache');
const Category = require('../models/Category');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);

  console.log(
    `MongoDB Connected on host: ${conn.connection.host}`.cyan.underline
  );

  const categories = await Category.find();

  cache.set('categories', categories);
};

module.exports = connectDB;