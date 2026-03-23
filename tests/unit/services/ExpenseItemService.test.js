const ExpenseItemService = require('../../../services/ExpenseItemService');
const { createKnexMock } = require('../../helpers/createKnexMock');

describe('ExpenseItemService', () => {
  let knex;
  let service;

  beforeEach(() => {
    knex = createKnexMock();
    service = new ExpenseItemService(
      {
        reportTable: 'expense_reports',
        itemTable: 'expense_items',
      },
      knex,
    );
  });

  describe('createItem', () => {
    it('allows creating an item when report is DRAFT', async () => {
      jest.spyOn(service, '_getOwnedReport').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'DRAFT',
      });

      knex._builder.returning.mockResolvedValue([
        {
          id: 100,
          report_id: 1,
          amount: 25.5,
          currency: 'USD',
        },
      ]);

      jest.spyOn(service, '_refreshReportTotal').mockResolvedValue();

      const result = await service.createItem(1, 10, {
        amount: 25.5,
        currency: 'USD',
        category: 'Meals',
        merchant_name: 'Chipotle',
        transaction_date: '2026-03-20',
      });

      expect(result.id).toBe(100);
      expect(service._refreshReportTotal).toHaveBeenCalledWith(1);
    });

    it('allows creating an item when report is REJECTED', async () => {
      jest.spyOn(service, '_getOwnedReport').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'REJECTED',
      });

      knex._builder.returning.mockResolvedValue([
        {
          id: 101,
          report_id: 1,
          amount: 10,
        },
      ]);

      jest.spyOn(service, '_refreshReportTotal').mockResolvedValue();

      const result = await service.createItem(1, 10, {
        amount: 10,
        currency: 'USD',
        category: 'Taxi',
        merchant_name: 'Uber',
        transaction_date: '2026-03-20',
      });

      expect(result.id).toBe(101);
    });

    it('rejects creating an item when report is SUBMITTED', async () => {
      jest.spyOn(service, '_getOwnedReport').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'SUBMITTED',
      });

      await expect(
        service.createItem(1, 10, {
          amount: 10,
          currency: 'USD',
          category: 'Taxi',
          merchant_name: 'Uber',
          transaction_date: '2026-03-20',
        }),
      ).rejects.toThrow(
        'Expense items can only be modified when the report is in DRAFT or REJECTED status',
      );
    });
  });

  describe('updateItem', () => {
    it('rejects updating an item when report is APPROVED', async () => {
      jest.spyOn(service, '_getOwnedReport').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'APPROVED',
      });

      await expect(
        service.updateItem(100, 1, 10, { amount: 99 }),
      ).rejects.toThrow(
        'Expense items can only be modified when the report is in DRAFT or REJECTED status',
      );
    });
  });

  describe('deleteItem', () => {
    it('rejects deleting an item when report is SUBMITTED', async () => {
      jest.spyOn(service, '_getOwnedReport').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'SUBMITTED',
      });

      await expect(service.deleteItem(100, 1, 10)).rejects.toThrow(
        'Expense items can only be modified when the report is in DRAFT or REJECTED status',
      );
    });
  });
});
