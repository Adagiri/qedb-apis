const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error');
const socketIo = require('socket.io');
const http = require('http');

const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

connectDB();

// Route files

const users = require('./routes/users');
const questions = require('./routes/questions');
const categories = require('./routes/categories');
const tokens = require('./routes/tokens');
const libraries = require('./routes/libraries');

const app = express();

app.use(cors({ exposedHeaders: ['X-Total-Count', 'Has-More-Result'] }));

app.use(cookieParser());

// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
// app.use(express.text({ limit: '50mb', extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers

app.use('/api/v1/users', users);
app.use('/api/v1/questions', questions);
app.use('/api/v1/categories', categories);
app.use('/api/v1/tokens', tokens);
app.use('/api/v1/libraries', libraries);

app.use(errorHandler);

const PORT = process.env.PORT || 5700;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);

  server.close(() => process.exit(1));
});
