const express = require('express');
const authenticate = require('../middlewares/authenticate');

module.exports = function ({ expenseItemsController }) {
  const router = express.Router();

  router.use(authenticate);

  router.get(
    '/reports/:reportId/items',
    expenseItemsController.getItemsByReportId,
  );
  router.post('/reports/:reportId/items', expenseItemsController.createItem);
  router.patch(
    '/reports/:reportId/items/:itemId',
    expenseItemsController.updateItem,
  );
  router.delete(
    '/reports/:reportId/items/:itemId',
    expenseItemsController.deleteItem,
  );

  return router;
};
