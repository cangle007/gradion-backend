const { BadRequestError, NotFoundError } = require('../errors/AppError');

const REPORT_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const ALLOWED_STATUSES = Object.values(REPORT_STATUS);

class ReportService {
  constructor({ reportTable }, knex) {
    this._knex = knex;
    this._reportTable = reportTable;
  }

  async getReportsByUser(userId, status) {
    this._assertValidStatusFilter(status);

    let query = this._knex(this._reportTable)
      .select(
        'id',
        'user_id',
        'title',
        'description',
        'status',
        'total_amount',
        'created_at',
        'updated_at',
      )
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.andWhere('status', status);
    }

    return query;
  }

  async createReport(userId, { title, description }) {
    if (!title || !title.trim()) {
      throw new BadRequestError('Title is required');
    }

    const insertedReports = await this._knex(this._reportTable).insert(
      {
        user_id: userId,
        title: title.trim(),
        description: description || null,
        status: REPORT_STATUS.DRAFT,
        total_amount: 0,
      },
      '*',
    );

    return insertedReports[0];
  }

  async getOwnedReportById(reportId, userId) {
    const report = await this._knex(this._reportTable)
      .where({
        id: reportId,
        user_id: userId,
      })
      .first();

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return report;
  }

  async updateReport(reportId, userId, { title, description }) {
    const report = await this.getOwnedReportById(reportId, userId);
    this._assertEditable(report);

    const attributes = {};

    if (title !== undefined) {
      if (!title || !title.trim()) {
        throw new BadRequestError('Title is required');
      }
      attributes.title = title.trim();
    }

    if (description !== undefined) {
      attributes.description = description;
    }

    if (Object.keys(attributes).length === 0) {
      throw new BadRequestError('No valid fields provided for update');
    }

    attributes.updated_at = this._knex.fn.now();

    const updatedReports = await this._knex(this._reportTable)
      .where({
        id: reportId,
        user_id: userId,
      })
      .update(attributes, '*');

    return updatedReports[0];
  }

  async deleteReport(reportId, userId) {
    const report = await this.getOwnedReportById(reportId, userId);
    this._assertDeletable(report);

    await this._knex(this._reportTable)
      .where({
        id: reportId,
        user_id: userId,
      })
      .del();
  }

  async submitReport(reportId, userId) {
    const report = await this.getOwnedReportById(reportId, userId);
    this._assertSubmittable(report);

    const updatedReports = await this._knex(this._reportTable)
      .where({
        id: reportId,
        user_id: userId,
      })
      .update(
        {
          status: REPORT_STATUS.SUBMITTED,
          updated_at: this._knex.fn.now(),
        },
        '*',
      );

    return updatedReports[0];
  }

  async getAllReports(status) {
    this._assertValidStatusFilter(status);

    let query = this._knex(this._reportTable)
      .select(
        'id',
        'user_id',
        'title',
        'description',
        'status',
        'total_amount',
        'created_at',
        'updated_at',
      )
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where('status', status);
    }

    return query;
  }

  async approveReport(reportId) {
    const report = await this._getReportById(reportId);
    this._assertApprovable(report);

    const updatedReports = await this._knex(this._reportTable)
      .where({ id: reportId })
      .update(
        {
          status: REPORT_STATUS.APPROVED,
          updated_at: this._knex.fn.now(),
        },
        '*',
      );

    return updatedReports[0];
  }

  async rejectReport(reportId) {
    const report = await this._getReportById(reportId);
    this._assertRejectable(report);

    const updatedReports = await this._knex(this._reportTable)
      .where({ id: reportId })
      .update(
        {
          status: REPORT_STATUS.REJECTED,
          updated_at: this._knex.fn.now(),
        },
        '*',
      );

    return updatedReports[0];
  }

  async _getReportById(reportId) {
    const report = await this._knex(this._reportTable)
      .where({ id: reportId })
      .first();

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return report;
  }

  _assertValidStatusFilter(status) {
    if (status && !ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestError('Invalid status filter');
    }
  }

  _assertEditable(report) {
    if (
      ![REPORT_STATUS.DRAFT, REPORT_STATUS.REJECTED].includes(report.status)
    ) {
      throw new BadRequestError('Only DRAFT or REJECTED reports can be edited');
    }
  }

  _assertDeletable(report) {
    if (report.status !== REPORT_STATUS.DRAFT) {
      throw new BadRequestError('Only DRAFT reports can be deleted');
    }
  }

  _assertSubmittable(report) {
    if (
      ![REPORT_STATUS.DRAFT, REPORT_STATUS.REJECTED].includes(report.status)
    ) {
      throw new BadRequestError(
        'Only DRAFT or REJECTED reports can be submitted',
      );
    }
  }

  _assertApprovable(report) {
    if (report.status !== REPORT_STATUS.SUBMITTED) {
      throw new BadRequestError('Only SUBMITTED reports can be approved');
    }
  }

  _assertRejectable(report) {
    if (report.status !== REPORT_STATUS.SUBMITTED) {
      throw new BadRequestError('Only SUBMITTED reports can be rejected');
    }
  }
}

module.exports = ReportService;
