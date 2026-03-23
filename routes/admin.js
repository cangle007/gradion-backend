const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');

module.exports = function ({ adminReportsController }) {
  const router = express.Router();

  router.use(authenticate, requireRole('admin'));

  router.get('/reports', adminReportsController.getAllReports);
  router.post('/reports/:id/approve', adminReportsController.approveReport);
  router.post('/reports/:id/reject', adminReportsController.rejectReport);

  return router;
};
