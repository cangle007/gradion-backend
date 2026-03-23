'use strict';

const knex = require('../knex');
const ExpenseItemService = require('../services/ExpenseItemService');
const ExpenseItemsController = require('../controllers/ExpenseItemsController');

const expenseItemService = new ExpenseItemService(
  {
    reportTable: 'expense_reports',
    itemTable: 'expense_items',
  },
  knex,
);

module.exports = new ExpenseItemsController({ expenseItemService });
