import { Candidate } from '../models/Candidate.js';
import { Detection } from '../models/Detection.js';
import { Brand } from '../models/Brand.js';
import { CsvJsonImportAdapter } from '../adapters/csvJsonImportAdapter.js';

export class CandidateController {
  static async getCandidates(req, res, next) {
    try {
      const {
        brandId,
        candidateType,
        platformOrStore,
        isExcluded,
        search,
        page = 1,
        limit = 20,
        sortBy = 'lastSeen',
        sortDir = 'desc'
      } = req.query;

      const filter = { organization: req.user.organization };

      if (brandId) filter.brandId = brandId;
      if (candidateType) filter.candidateType = candidateType;
      if (platformOrStore) filter.platformOrStore = platformOrStore;
      if (isExcluded !== undefined) filter.isExcluded = isExcluded === 'true';

      if (search) {
        filter.$or = [
          { usernameOrAppName: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
          { publisherName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

      const total = await Candidate.countDocuments(filter);
      const candidates = await Candidate.find(filter)
        .populate('brandId', 'name logoUrl')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Attach linked detections if any
      const candidateIds = candidates.map(c => c._id);
      const detections = await Detection.find({
        candidateId: { $in: candidateIds },
        organization: req.user.organization
      });

      const detectionMap = {};
      detections.forEach(d => {
        detectionMap[String(d.candidateId)] = d;
      });

      const enriched = candidates.map(c => ({
        ...c.toObject(),
        detection: detectionMap[String(c._id)] || null
      }));

      res.json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        candidates: enriched
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCandidateById(req, res, next) {
    try {
      const candidate = await Candidate.findOne({
        _id: req.params.id,
        organization: req.user.organization
      }).populate('brandId', 'name logoUrl websiteUrl aliases keywords');

      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Candidate not found.' });
      }

      const detection = await Detection.findOne({
        candidateId: candidate._id,
        organization: req.user.organization
      });

      res.json({
        success: true,
        candidate: {
          ...candidate.toObject(),
          detection
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async importCandidates(req, res, next) {
    try {
      const { brandId, items } = req.body;
      if (!brandId) {
        return res.status(400).json({ success: false, message: 'brandId is required for import.' });
      }

      const brand = await Brand.findOne({ _id: brandId, organization: req.user.organization });
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found or access denied.' });
      }

      const importAdapter = new CsvJsonImportAdapter();
      const parsedItems = importAdapter.parseCandidateList(items, brand._id);

      let importedCount = 0;
      for (const item of parsedItems) {
        await Candidate.findOneAndUpdate(
          {
            organization: req.user.organization,
            brandId: brand._id,
            candidateType: item.candidateType,
            usernameOrAppName: item.usernameOrAppName,
            platformOrStore: item.platformOrStore
          },
          {
            $set: {
              ...item,
              organization: req.user.organization,
              lastSeen: new Date()
            },
            $setOnInsert: {
              firstSeen: new Date()
            }
          },
          { upsert: true }
        );
        importedCount++;
      }

      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedCount} candidate records. Run a scan to evaluate threats.`,
        count: importedCount
      });
    } catch (err) {
      next(err);
    }
  }
}
