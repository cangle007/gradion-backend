class ReportsController {
  constructor({ reportService }) {
    this._reportService = reportService;

    this._bindMethods([
      'getReports',
      'createReport',
      'getReportById',
      'updateReport',
      'deleteReport',
      'submitReport',
    ]);
  }

  async getReports(request, response, next) {
    try {
      const userId = request.user.id;
      const { status } = request.query;

      const reports = await this._reportService.getReportsByUser(
        userId,
        status,
      );

      return response.status(200).json({ reports });
    } catch (err) {
      next(err);
    }
  }

  async createReport(request, response, next) {
    try {
      const userId = request.user.id;
      const report = await this._reportService.createReport(
        userId,
        request.body,
      );

      return response.status(201).json(report);
    } catch (err) {
      next(err);
    }
  }

  async getReportById(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.id;

      const report = await this._reportService.getOwnedReportById(
        reportId,
        userId,
      );

      return response.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  async updateReport(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.id;

      const report = await this._reportService.updateReport(
        reportId,
        userId,
        request.body,
      );

      return response.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  async deleteReport(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.id;

      await this._reportService.deleteReport(reportId, userId);

      return response.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async submitReport(request, response, next) {
    try {
      const userId = request.user.id;
      const reportId = request.params.id;

      const report = await this._reportService.submitReport(reportId, userId);

      return response.status(200).json(report);
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

module.exports = ReportsController;
