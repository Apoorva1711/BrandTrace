import { Brand } from '../models/Brand.js';
import { OfficialAsset } from '../models/OfficialAsset.js';
import { Detection } from '../models/Detection.js';
import { Candidate } from '../models/Candidate.js';

export class BrandController {
  static async getAllBrands(req, res, next) {
    try {
      const { includeArchived } = req.query;
      const filter = { organization: req.user.organization };
      if (!includeArchived || includeArchived === 'false') {
        filter.isArchived = false;
      }

      const brands = await Brand.find(filter).sort({ createdAt: -1 });

      // Attach asset count & active threat count to each brand
      const brandStats = await Promise.all(brands.map(async (b) => {
        const assetCount = await OfficialAsset.countDocuments({
          brandId: b._id,
          organization: req.user.organization,
          isActive: true
        });
        const activeThreatCount = await Detection.countDocuments({
          brandId: b._id,
          organization: req.user.organization,
          status: { $in: ['New', 'Under Review', 'Suspected Impersonation'] }
        });
        const totalCandidates = await Candidate.countDocuments({
          brandId: b._id,
          organization: req.user.organization
        });

        return {
          ...b.toObject(),
          stats: {
            assetCount,
            activeThreatCount,
            totalCandidates
          }
        };
      }));

      res.json({ success: true, count: brandStats.length, brands: brandStats });
    } catch (err) {
      next(err);
    }
  }

  static async getBrandById(req, res, next) {
    try {
      const brand = await Brand.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found or access denied.' });
      }

      const assetCount = await OfficialAsset.countDocuments({
        brandId: brand._id,
        organization: req.user.organization,
        isActive: true
      });
      const activeThreatCount = await Detection.countDocuments({
        brandId: brand._id,
        organization: req.user.organization,
        status: { $in: ['New', 'Under Review', 'Suspected Impersonation'] }
      });

      res.json({
        success: true,
        brand: {
          ...brand.toObject(),
          stats: { assetCount, activeThreatCount }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createBrand(req, res, next) {
    try {
      const {
        name,
        legalName,
        description,
        websiteUrl,
        aliases,
        keywords,
        trustedDomains,
        logoHash
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Brand name is required.' });
      }

      // Safe parse arrays if submitted as string from multipart form
      const parsedAliases = typeof aliases === 'string' ? aliases.split(',').map(s => s.trim()).filter(Boolean) : (aliases || []);
      const parsedKeywords = typeof keywords === 'string' ? keywords.split(',').map(s => s.trim()).filter(Boolean) : (keywords || []);
      const parsedDomains = typeof trustedDomains === 'string' ? trustedDomains.split(',').map(s => s.trim()).filter(Boolean) : (trustedDomains || []);

      let logoUrl = '';
      if (req.file) {
        logoUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.logoUrl) {
        logoUrl = req.body.logoUrl;
      }

      const brand = await Brand.create({
        organization: req.user.organization,
        name: name.trim(),
        legalName: legalName ? legalName.trim() : '',
        description: description ? description.trim() : '',
        websiteUrl: websiteUrl ? websiteUrl.trim() : '',
        logoUrl,
        logoHash: logoHash ? logoHash.trim() : '',
        aliases: parsedAliases,
        keywords: parsedKeywords,
        trustedDomains: parsedDomains,
        ownerId: req.user._id
      });

      // Automatically register the primary website domain as an official asset if provided
      if (websiteUrl) {
        try {
          const parsed = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
          await OfficialAsset.create({
            brandId: brand._id,
            organization: req.user.organization,
            assetType: 'domain',
            identifier: parsed.hostname,
            url: websiteUrl,
            platformOrStore: 'Web',
            notes: 'Primary corporate website domain'
          });
        } catch (e) {
          // ignore malformed URL for auto-asset creation
        }
      }

      res.status(201).json({ success: true, message: 'Brand profile created successfully.', brand });
    } catch (err) {
      next(err);
    }
  }

  static async updateBrand(req, res, next) {
    try {
      const brand = await Brand.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found or access denied.' });
      }

      const {
        name,
        legalName,
        description,
        websiteUrl,
        aliases,
        keywords,
        trustedDomains,
        logoHash
      } = req.body;

      if (name) brand.name = name.trim();
      if (legalName !== undefined) brand.legalName = legalName.trim();
      if (description !== undefined) brand.description = description.trim();
      if (websiteUrl !== undefined) brand.websiteUrl = websiteUrl.trim();
      if (logoHash !== undefined) brand.logoHash = logoHash.trim();

      if (aliases !== undefined) {
        brand.aliases = typeof aliases === 'string' ? aliases.split(',').map(s => s.trim()).filter(Boolean) : aliases;
      }
      if (keywords !== undefined) {
        brand.keywords = typeof keywords === 'string' ? keywords.split(',').map(s => s.trim()).filter(Boolean) : keywords;
      }
      if (trustedDomains !== undefined) {
        brand.trustedDomains = typeof trustedDomains === 'string' ? trustedDomains.split(',').map(s => s.trim()).filter(Boolean) : trustedDomains;
      }

      if (req.file) {
        brand.logoUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.logoUrl) {
        brand.logoUrl = req.body.logoUrl;
      }

      await brand.save();
      res.json({ success: true, message: 'Brand updated successfully.', brand });
    } catch (err) {
      next(err);
    }
  }

  static async archiveBrand(req, res, next) {
    try {
      const brand = await Brand.findOne({
        _id: req.params.id,
        organization: req.user.organization
      });

      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found.' });
      }

      brand.isArchived = true;
      await brand.save();

      res.json({ success: true, message: 'Brand profile successfully archived.' });
    } catch (err) {
      next(err);
    }
  }
}
