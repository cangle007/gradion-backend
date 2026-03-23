class AdminReportsController {
  constructor({ reportService }) {
    this._reportService = reportService;

    this._bindMethods(['getAllReports', 'approveReport', 'rejectReport']);
  }

  async getAllReports(request, response, next) {
    try {
      const { status } = request.query;
      const reports = await this._reportService.getAllReports(status);

      return response.status(200).json({ reports });
    } catch (err) {
      next(err);
    }
  }

  async approveReport(request, response, next) {
    try {
      const report = await this._reportService.approveReport(request.params.id);
      return response.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  async rejectReport(request, response, next) {
    try {
      const report = await this._reportService.rejectReport(request.params.id);
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

module.exports = AdminReportsController;
