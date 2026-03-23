class ExpenseItemService {
  constructor({ reportTable, itemTable }, knex) {
    this._reportTable = reportTable;
    this._itemTable = itemTable;
    this._knex = knex;
  }

  async getItemsByReportId(reportId, userId) {
    const report = await this._getOwnedReport(reportId, userId);

    const items = await this._knex(this._itemTable)
      .where({ report_id: report.id })
      .orderBy('transaction_date', 'desc')
      .orderBy('id', 'desc');

    return items;
  }

  async createItem(reportId, userId, payload) {
    const report = await this._getOwnedReport(reportId, userId);
    this._ensureEditable(report);

    const insertPayload = {
      report_id: report.id,
      amount: payload.amount,
      currency: payload.currency,
      category: payload.category,
      merchant_name: payload.merchant_name,
      transaction_date: payload.transaction_date,
    };

    const [createdItem] = await this._knex(this._itemTable)
      .insert(insertPayload)
      .returning('*');

    await this._refreshReportTotal(report.id);

    return createdItem;
  }

  async updateItem(itemId, reportId, userId, payload) {
    const report = await this._getOwnedReport(reportId, userId);
    this._ensureEditable(report);

    const existingItem = await this._knex(this._itemTable)
      .where({
        id: itemId,
        report_id: report.id,
      })
      .first();

    if (!existingItem) {
      const err = new Error('Expense item not found');
      err.statusCode = 404;
      throw err;
    }

    const updatePayload = {};

    if (payload.amount !== undefined) updatePayload.amount = payload.amount;
    if (payload.currency !== undefined)
      updatePayload.currency = payload.currency;
    if (payload.category !== undefined)
      updatePayload.category = payload.category;
    if (payload.merchant_name !== undefined) {
      updatePayload.merchant_name = payload.merchant_name;
    }
    if (payload.transaction_date !== undefined) {
      updatePayload.transaction_date = payload.transaction_date;
    }

    const [updatedItem] = await this._knex(this._itemTable)
      .where({
        id: itemId,
        report_id: report.id,
      })
      .update(updatePayload)
      .returning('*');

    await this._refreshReportTotal(report.id);

    return updatedItem;
  }

  async deleteItem(itemId, reportId, userId) {
    const report = await this._getOwnedReport(reportId, userId);
    this._ensureEditable(report);

    const deletedCount = await this._knex(this._itemTable)
      .where({
        id: itemId,
        report_id: report.id,
      })
      .del();

    if (!deletedCount) {
      const err = new Error('Expense item not found');
      err.statusCode = 404;
      throw err;
    }

    await this._refreshReportTotal(report.id);
  }

  async _getOwnedReport(reportId, userId) {
    const report = await this._knex(this._reportTable)
      .where({
        id: reportId,
        user_id: userId,
      })
      .first();

    if (!report) {
      const err = new Error('Expense report not found');
      err.statusCode = 404;
      throw err;
    }

    return report;
  }

  _ensureEditable(report) {
    if (!['DRAFT', 'REJECTED'].includes(report.status)) {
      const err = new Error(
        'Expense items can only be modified when the report is in DRAFT or REJECTED status',
      );
      err.statusCode = 409;
      throw err;
    }
  }

  async _refreshReportTotal(reportId) {
    const result = await this._knex(this._itemTable)
      .where({ report_id: reportId })
      .sum({ total: 'amount' })
      .first();

    const total = result && result.total ? result.total : 0;

    await this._knex(this._reportTable).where({ id: reportId }).update({
      total_amount: total,
      updated_at: this._knex.fn.now(),
    });
  }
}

module.exports = ExpenseItemService;
