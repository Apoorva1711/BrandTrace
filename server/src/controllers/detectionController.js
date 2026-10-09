import { Detection } from '../models/Detection.js';
import { Candidate } from '../models/Candidate.js';
import { Brand } from '../models/Brand.js';
import { OfficialAsset } from '../models/OfficialAsset.js';
import { InvestigationNote } from '../models/InvestigationNote.js';

export class DetectionController {
  static async getDetections(req, res, next) {
    try {
      const {
        brandId,
        candidateType,
        riskCategory,
        status,
        search,
        page = 1,
        limit = 20,
        sortBy = 'riskScore',
        sortDir = 'desc'
      } = req.query;

      const filter = { organization: req.user.organization };

      if (brandId) filter.brandId = brandId;
      if (candidateType) filter.candidateType = candidateType;
      if (riskCategory) filter.riskCategory = riskCategory;
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

      const total = await Detection.countDocuments(filter);
      const detections = await Detection.find(filter)
        .populate('brandId', 'name logoUrl websiteUrl')
        .populate('candidateId')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Optional text search in populated candidate
      let filtered = detections;
      if (search) {
        const s = search.toLowerCase();
        filtered = detections.filter(d => {
          const c = d.candidateId;
          if (!c) return false;
          return (
            (c.usernameOrAppName && c.usernameOrAppName.toLowerCase().includes(s)) ||
            (c.displayName && c.displayName.toLowerCase().includes(s)) ||
            (c.description && c.description.toLowerCase().includes(s))
          );
        });
      }

      res.json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        detections: filtered
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDetectionById(req, res, next) {
    try {
      const detection = await Detection.findOne({
        _id: req.params.id,
        organization: req.user.organization
      })
        .populate('brandId')
        .populate('candidateId')
        .populate('scanId');

      if (!detection) {
        return res.status(404).json({ success: false, message: 'Detection not found or access denied.' });
      }

      // Fetch official assets for comparison view
      const officialAssets = await OfficialAsset.find({
        brandId: detection.brandId._id,
        organization: req.user.organization,
        isActive: true
      });

      // Fetch audit notes history
      const notes = await InvestigationNote.find({
        detectionId: detection._id,
        organization: req.user.organization
      }).sort({ timestamp: -1 });

      res.json({
        success: true,
        detection,
        officialAssets,
        investigationNotes: notes
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { status, note, falsePositiveReason } = req.body;
      const validStatuses = ['New', 'Under Review', 'Suspected Impersonation', 'False Positive', 'Resolved'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const detection = await Detection.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!detection) {
        return res.status(404).json({ success: false, message: 'Detection not found.' });
      }

      // If marking as False Positive, require an explanation note
      if (status === 'False Positive') {
        const reason = falsePositiveReason || note;
        if (!reason || !reason.trim()) {
          return res.status(400).json({
            success: false,
            message: 'A detailed justification note is required when marking a finding as a False Positive.'
          });
        }
        detection.falsePositiveReason = reason.trim();
      }

      const previousStatus = detection.status;
      detection.status = status;
      detection.assignedAnalyst = req.user.name;
      await detection.save();

      // Record audit history in InvestigationNote
      const auditNote = await InvestigationNote.create({
        detectionId: detection._id,
        organization: req.user.organization,
        author: req.user.name,
        authorEmail: req.user.email,
        note: note ? note.trim() : `Status transitioned from '${previousStatus}' to '${status}'.`,
        previousStatus,
        newStatus: status
      });

      res.json({
        success: true,
        message: `Detection status updated to '${status}'.`,
        detection,
        auditNote
      });
    } catch (err) {
      next(err);
    }
  }

  static async addNote(req, res, next) {
    try {
      const { note } = req.body;
      if (!note || !note.trim()) {
        return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
      }

      const detection = await Detection.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!detection) {
        return res.status(404).json({ success: false, message: 'Detection not found.' });
      }

      const newNote = await InvestigationNote.create({
        detectionId: detection._id,
        organization: req.user.organization,
        author: req.user.name,
        authorEmail: req.user.email,
        note: note.trim(),
        previousStatus: detection.status,
        newStatus: detection.status
      });

      res.status(201).json({
        success: true,
        message: 'Investigation note added successfully.',
        note: newNote
      });
    } catch (err) {
      next(err);
    }
  }
}
