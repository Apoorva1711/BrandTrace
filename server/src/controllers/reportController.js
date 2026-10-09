import { Detection } from '../models/Detection.js';
import { Scan } from '../models/Scan.js';
import { ReportService } from '../services/reportService.js';

export class ReportController {
  static async exportDetectionsCsv(req, res, next) {
    try {
      const { brandId, riskCategory, status, candidateType } = req.query;
      const filter = { organization: req.user.organization };

      if (brandId) filter.brandId = brandId;
      if (riskCategory) filter.riskCategory = riskCategory;
      if (status) filter.status = status;
      if (candidateType) filter.candidateType = candidateType;

      const detections = await Detection.find(filter)
        .populate('brandId', 'name')
        .populate('candidateId')
        .sort({ riskScore: -1 });

      const csvContent = ReportService.exportDetectionsToCsv(detections);
      const filename = `brandtrace_detections_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  static async exportScansCsv(req, res, next) {
    try {
      const { brandId } = req.query;
      const filter = { organization: req.user.organization };
      if (brandId) filter.brandId = brandId;

      const scans = await Scan.find(filter)
        .populate('brandId', 'name')
        .sort({ createdAt: -1 });

      const csvContent = ReportService.exportScansToCsv(scans);
      const filename = `brandtrace_scans_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}
