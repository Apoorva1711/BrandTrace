import { OfficialAsset } from '../models/OfficialAsset.js';
import { Brand } from '../models/Brand.js';
import { normalizeUrl, normalizeIdentifier } from '../utils/normalizers.js';

export class AssetController {
  static async getAssetsByBrand(req, res, next) {
    try {
      const { brandId } = req.params;
      const brand = await Brand.findOne({ _id: brandId, organization: req.user.organization });
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found or access denied.' });
      }

      const assets = await OfficialAsset.find({
        brandId,
        organization: req.user.organization
      }).sort({ createdAt: -1 });

      res.json({ success: true, count: assets.length, assets });
    } catch (err) {
      next(err);
    }
  }

  static async getAllAssets(req, res, next) {
    try {
      const { brandId, assetType } = req.query;
      const filter = { organization: req.user.organization };

      if (brandId) filter.brandId = brandId;
      if (assetType) filter.assetType = assetType;

      const assets = await OfficialAsset.find(filter)
        .populate('brandId', 'name logoUrl')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: assets.length, assets });
    } catch (err) {
      next(err);
    }
  }

  static async createAsset(req, res, next) {
    try {
      const brandId = req.params.brandId || req.body.brandId;
      const {
        assetType,
        identifier,
        url,
        platformOrStore,
        publisherName,
        notes
      } = req.body;

      if (!brandId) {
        return res.status(400).json({ success: false, message: 'Brand ID is required.' });
      }

      const brand = await Brand.findOne({ _id: brandId, organization: req.user.organization });
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found or access denied.' });
      }

      if (!assetType || !identifier) {
        return res.status(400).json({
          success: false,
          message: 'Both assetType and identifier are required.'
        });
      }

      const normUrl = url ? normalizeUrl(url) : '';
      const normId = normalizeIdentifier(identifier);

      // Check duplicate
      const existing = await OfficialAsset.findOne({
        brandId,
        assetType,
        identifier: identifier.trim()
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'This official asset is already registered for this brand.'
        });
      }

      const asset = await OfficialAsset.create({
        brandId,
        organization: req.user.organization,
        assetType,
        identifier: identifier.trim(),
        normalizedIdentifier: normId,
        url: url ? url.trim() : '',
        normalizedUrl: normUrl,
        platformOrStore: platformOrStore ? platformOrStore.trim() : '',
        publisherName: publisherName ? publisherName.trim() : '',
        notes: notes ? notes.trim() : '',
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Official asset registered successfully.',
        asset
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAsset(req, res, next) {
    try {
      const asset = await OfficialAsset.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!asset) {
        return res.status(404).json({ success: false, message: 'Official asset not found.' });
      }

      const {
        identifier,
        url,
        platformOrStore,
        publisherName,
        notes,
        isActive
      } = req.body;

      if (identifier) {
        asset.identifier = identifier.trim();
        asset.normalizedIdentifier = normalizeIdentifier(identifier);
      }
      if (url !== undefined) {
        asset.url = url.trim();
        asset.normalizedUrl = normalizeUrl(url);
      }
      if (platformOrStore !== undefined) asset.platformOrStore = platformOrStore.trim();
      if (publisherName !== undefined) asset.publisherName = publisherName.trim();
      if (notes !== undefined) asset.notes = notes.trim();
      if (isActive !== undefined) asset.isActive = Boolean(isActive);

      await asset.save();

      res.json({ success: true, message: 'Official asset updated successfully.', asset });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAsset(req, res, next) {
    try {
      const asset = await OfficialAsset.findOneAndDelete({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!asset) {
        return res.status(404).json({ success: false, message: 'Official asset not found.' });
      }

      res.json({ success: true, message: 'Official asset successfully removed from registry.' });
    } catch (err) {
      next(err);
    }
  }
}
