class ExpenseItemsController {
  constructor({ expenseItemService }) {
    this._expenseItemService = expenseItemService;

    this._bindMethods([
      'getItemsByReportId',
      'createItem',
      'updateItem',
      'deleteItem',
    ]);
  }

  async getItemsByReportId(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.reportId;

      const items = await this._expenseItemService.getItemsByReportId(
        reportId,
        userId,
      );

      return response.status(200).json({ items });
    } catch (err) {
      next(err);
    }
  }

  async createItem(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.reportId;

      const item = await this._expenseItemService.createItem(
        reportId,
        userId,
        request.body,
      );

      return response.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }

  async updateItem(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.reportId;
      const itemId = request.params.itemId;

      const item = await this._expenseItemService.updateItem(
        itemId,
        reportId,
        userId,
        request.body,
      );

      return response.status(200).json(item);
    } catch (err) {
      next(err);
    }
  }

  async deleteItem(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.reportId;
      const itemId = request.params.itemId;

      await this._expenseItemService.deleteItem(itemId, reportId, userId);

      return response.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  _bindMethods(methodNames) {
    methodNames.forEach((methodName) => {
      this[methodName] = this[methodName].bind(this);
    });
  }
}

module.exports = ExpenseItemsController;
