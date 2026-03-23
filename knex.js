const environment = process.env.NODE_ENV || 'development';
const config = require('./knexfile')[environment];
const knex = require('knex');

if (!config) {
  throw new Error(
    `No knex configuration found for environment: ${environment}`,
  );
}

module.exports = knex(config);
