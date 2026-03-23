'use strict';

const knex = require('../knex');
const ReportService = require('../services/ReportService');
const AdminReportsController = require('../controllers/AdminReportsController');

const reportService = new ReportService(
  {
    reportTable: 'expense_reports',
  },
  knex,
);

module.exports = new AdminReportsController({ reportService });
