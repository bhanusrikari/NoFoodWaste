const reportService = require('./report.service');

class ReportController {
  async createReport(req, res, next) {
    try {
      const { description } = req.body;
      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Report description is required',
        });
      }

      const report = await reportService.createReport(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Issue report submitted successfully',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllReports(req, res, next) {
    try {
      const result = await reportService.getAllReports(req.query);
      res.status(200).json({
        success: true,
        count: result.reports.length,
        stats: result.stats,
        data: result.reports,
      });
    } catch (err) {
      next(err);
    }
  }

  async getReportById(req, res, next) {
    try {
      const report = await reportService.getReportById(req.params.id);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReportStatus(req, res, next) {
    try {
      const updated = await reportService.updateReportStatus(req.params.id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: `Report status updated to ${updated.status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
