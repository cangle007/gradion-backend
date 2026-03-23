const knexConfig = require('../../knexfile').test;
const knex = require('knex')(knexConfig);

async function resetDatabase() {
  await knex('expense_items').del();
  await knex('expense_reports').del();
  await knex('users').del();
}

module.exports = {
  knex,
  resetDatabase,
};
