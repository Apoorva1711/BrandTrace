import { Scan } from '../models/Scan.js';
import { Brand } from '../models/Brand.js';
import { Detection } from '../models/Detection.js';
import { Candidate } from '../models/Candidate.js';
import { ScanEngine } from '../services/scanEngine.js';

export class ScanController {
  static async createScan(req, res, next) {
    try {
      const { brandId, scanType = 'both', source = 'deterministic_sample' } = req.body;

      if (!brandId) {
        return res.status(400).json({ success: false, message: 'Brand ID is required to initiate scan.' });
      }

      const brand = await Brand.findOne({ _id: brandId, organization: req.user.organization });
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found or access denied.' });
      }

      if (!['social', 'app', 'both'].includes(scanType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scanType. Must be "social", "app", or "both".'
        });
      }

      // Create persistent scan record
      const scan = await Scan.create({
        organization: req.user.organization,
        brandId: brand._id,
        scanType,
        source,
        status: 'Queued',
        triggeredBy: req.user.name
      });

      // Execute scan synchronously for prototype
      const completedScan = await ScanEngine.executeScan(scan._id);

      res.status(201).json({
        success: true,
        message: `Scan finished with status: ${completedScan.status}`,
        scan: completedScan
      });
    } catch (err) {
      next(err);
    }
  }

  static async getScans(req, res, next) {
    try {
      const { brandId, status, page = 1, limit = 20 } = req.query;
      const filter = { organization: req.user.organization };

      if (brandId) filter.brandId = brandId;
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Scan.countDocuments(filter);

      const scans = await Scan.find(filter)
        .populate('brandId', 'name logoUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      res.json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        scans
      });
    } catch (err) {
      next(err);
    }
  }

  static async getScanById(req, res, next) {
    try {
      const scan = await Scan.findOne({
        _id: req.params.id,
        organization: req.user.organization
      }).populate('brandId', 'name logoUrl websiteUrl');

      if (!scan) {
        return res.status(404).json({ success: false, message: 'Scan not found.' });
      }

      res.json({ success: true, scan });
    } catch (err) {
      next(err);
    }
  }

  static async getScanResults(req, res, next) {
    try {
      const scan = await Scan.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!scan) {
        return res.status(404).json({ success: false, message: 'Scan not found.' });
      }

      const detections = await Detection.find({
        scanId: scan._id,
        organization: req.user.organization
      }).populate('candidateId').populate('brandId', 'name logoUrl');

      const excludedCandidates = await Candidate.find({
        brandId: scan.brandId,
        organization: req.user.organization,
        isExcluded: true
      });

      res.json({
        success: true,
        scan,
        detectionsCount: detections.length,
        excludedCount: excludedCandidates.length,
        detections,
        excludedCandidates
      });
    } catch (err) {
      next(err);
    }
  }
}
