'use strict';

const knex = require('../knex');
const AuthService = require('../services/AuthService');
const AuthController = require('../controllers/AuthController');

const authService = new AuthService(
  {
    userTable: 'users',
  },
  knex,
);

module.exports = new AuthController({ authService });
