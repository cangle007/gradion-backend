const ReportService = require('../../../services/ReportService');
const { BadRequestError, NotFoundError } = require('../../../errors/AppError');
const { createKnexMock } = require('../../helpers/createKnexMock');

describe('ReportService', () => {
  let knex;
  let service;

  beforeEach(() => {
    knex = createKnexMock();
    service = new ReportService({ reportTable: 'expense_reports' }, knex);
  });

  describe('updateReport', () => {
    it('allows updating a DRAFT report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'DRAFT',
      });

      knex._builder.update.mockResolvedValue([
        {
          id: 1,
          user_id: 10,
          title: 'Updated title',
          description: 'Updated description',
          status: 'DRAFT',
        },
      ]);

      const result = await service.updateReport(1, 10, {
        title: 'Updated title',
        description: 'Updated description',
      });

      expect(result.title).toBe('Updated title');
      expect(knex._builder.update).toHaveBeenCalled();
    });

    it('allows updating a REJECTED report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'REJECTED',
      });

      knex._builder.update.mockResolvedValue([
        {
          id: 1,
          user_id: 10,
          title: 'Updated title',
          status: 'REJECTED',
        },
      ]);

      const result = await service.updateReport(1, 10, {
        title: 'Updated title',
      });

      expect(result.status).toBe('REJECTED');
      expect(knex._builder.update).toHaveBeenCalled();
    });

    it('rejects updating a SUBMITTED report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'SUBMITTED',
      });

      await expect(
        service.updateReport(1, 10, { title: 'New title' }),
      ).rejects.toThrow(BadRequestError);

      expect(knex._builder.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteReport', () => {
    it('allows deleting a DRAFT report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'DRAFT',
      });

      knex._builder.del.mockResolvedValue(1);

      await service.deleteReport(1, 10);

      expect(knex._builder.del).toHaveBeenCalled();
    });

    it('rejects deleting a SUBMITTED report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'SUBMITTED',
      });

      await expect(service.deleteReport(1, 10)).rejects.toThrow(
        BadRequestError,
      );

      expect(knex._builder.del).not.toHaveBeenCalled();
    });
  });

  describe('submitReport', () => {
    it('allows submitting a DRAFT report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'DRAFT',
      });

      knex._builder.update.mockResolvedValue([
        {
          id: 1,
          user_id: 10,
          status: 'SUBMITTED',
        },
      ]);

      const result = await service.submitReport(1, 10);

      expect(result.status).toBe('SUBMITTED');
      expect(knex._builder.update).toHaveBeenCalledWith(
        {
          status: 'SUBMITTED',
          updated_at: 'mocked-now',
        },
        '*',
      );
    });

    it('allows re-submitting a REJECTED report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'REJECTED',
      });

      knex._builder.update.mockResolvedValue([
        {
          id: 1,
          user_id: 10,
          status: 'SUBMITTED',
        },
      ]);

      const result = await service.submitReport(1, 10);

      expect(result.status).toBe('SUBMITTED');
    });

    it('rejects submitting an APPROVED report', async () => {
      jest.spyOn(service, 'getOwnedReportById').mockResolvedValue({
        id: 1,
        user_id: 10,
        status: 'APPROVED',
      });

      await expect(service.submitReport(1, 10)).rejects.toThrow(
        BadRequestError,
      );

      expect(knex._builder.update).not.toHaveBeenCalled();
    });
  });

  describe('approveReport', () => {
    it('allows approving a SUBMITTED report', async () => {
      jest.spyOn(service, '_getReportById').mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
      });

      knex._builder.update.mockResolvedValue([
        {
          id: 1,
          status: 'APPROVED',
        },
      ]);

      const result = await service.approveReport(1);

      expect(result.status).toBe('APPROVED');
      expect(knex._builder.update).toHaveBeenCalled();
    });

    it('rejects approving a DRAFT report', async () => {
      jest.spyOn(service, '_getReportById').mockResolvedValue({
        id: 1,
        status: 'DRAFT',
      });

      await expect(service.approveReport(1)).rejects.toThrow(BadRequestError);

      expect(knex._builder.update).not.toHaveBeenCalled();
    });
  });

  describe('rejectReport', () => {
    it('allows rejecting a SUBMITTED report', async () => {
      jest.spyOn(service, '_getReportById').mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
      });

      knex._builder.update.mockResolvedValue([
        {
          id: 1,
          status: 'REJECTED',
        },
      ]);

      const result = await service.rejectReport(1);

      expect(result.status).toBe('REJECTED');
      expect(knex._builder.update).toHaveBeenCalled();
    });

    it('rejects rejecting an APPROVED report', async () => {
      jest.spyOn(service, '_getReportById').mockResolvedValue({
        id: 1,
        status: 'APPROVED',
      });

      await expect(service.rejectReport(1)).rejects.toThrow(BadRequestError);

      expect(knex._builder.update).not.toHaveBeenCalled();
    });
  });

  describe('getOwnedReportById', () => {
    it('throws NotFoundError when report does not exist', async () => {
      knex._builder.first.mockResolvedValue(undefined);

      await expect(service.getOwnedReportById(999, 10)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
