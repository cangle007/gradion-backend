'use strict';

require('./env');

const express = require('express');
const app = express();
const bodyParser = require('body-parser'); //You need to use bodyParser() if you want the form data to be available in req.body.

app.disable('x-powered-by');

const cors = require('cors'); //It is a standard for allowing browsers to request resources from apis on other domains.
//const bodyParser = require('body-parser'); dont delete this
const morgan = require('morgan'); //HTTP request logger middleware for node.js. You could see the logs in the terminal for each time an HTTP request was made
//const cookieParser = require('cookie-parser');

switch (process.env.NODE_ENV) {
  case 'development':
    app.use(morgan('dev'));
    break;
  case 'production':
    app.use(morgan('short'));
    break;
  default:
}

app.use(bodyParser.json());
app.use(cors());
//app.use(cookieParser());

// Routes
const authController = require('./instances/authController');
const reportsController = require('./instances/reportsController');
const adminReportsController = require('./instances/adminReportsController');
const expenseItemsController = require('./instances/expenseItemsController');

const authRoutes = require('./routes/auth');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const expenseItemsRoutes = require('./routes/expenseItems');

// Register routes
app.use('/auth', authRoutes({ authController }));
app.use('/reports', reportsRoutes({ reportsController }));
app.use('/admin', adminRoutes({ adminReportsController }));
app.use('/', expenseItemsRoutes({ expenseItemsController }));

app.use((request, response) => {
  response.status(404).json({
    error: 'Not found',
  });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error('Error stack', error.stack); // eslint-disable-line no-console
  }

  return response.status(statusCode).json({
    error: message,
  });
});

const port = process.env.PORT || 3000;

//******dont delete******//
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`); // eslint-disable-line no-console
  });
}

module.exports = app;
