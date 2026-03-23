const express = require('express');

module.exports = function ({ authController }) {
  const router = express.Router();

  router.post('/signup', authController.signup);

  router.post('/login', authController.login);

  return router;
};
