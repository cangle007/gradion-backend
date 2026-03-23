const express = require('express');
const authenticate = require('../middlewares/authenticate');

module.exports = function ({ reportsController }) {
  const router = express.Router();

  router.use(authenticate);

  router.get('/', reportsController.getReports);

  router.post('/', reportsController.createReport);

  router.get('/:id', reportsController.getReportById);

  router.patch('/:id', reportsController.updateReport);

  router.delete('/:id', reportsController.deleteReport);

  router.post('/:id/submit', reportsController.submitReport);

  return router;
};
