import mongoose from 'mongoose';
import { normalizeUrl, normalizeIdentifier } from '../utils/normalizers.js';

const officialAssetSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    index: true
  },
  organization: {
    type: String,
    required: true,
    index: true
  },
  assetType: {
    type: String,
    required: true,
    enum: [
      'official_social_profile',
      'official_company_page',
      'official_mobile_app',
      'domain',
      'official_logo',
      'trusted_publisher',
      'brand_alias'
    ]
  },
  identifier: {
    type: String,
    required: true,
    trim: true
  },
  normalizedIdentifier: {
    type: String,
    trim: true,
    index: true
  },
  url: {
    type: String,
    trim: true
  },
  normalizedUrl: {
    type: String,
    trim: true,
    index: true
  },
  platformOrStore: {
    type: String,
    trim: true,
    default: ''
  },
  publisherName: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto normalize fields before saving
officialAssetSchema.pre('save', function(next) {
  if (this.url) {
    this.normalizedUrl = normalizeUrl(this.url);
  }
  if (this.identifier) {
    this.normalizedIdentifier = normalizeIdentifier(this.identifier);
  }
  next();
});

// Unique compound index preventing duplicate assets for the same brand
officialAssetSchema.index({ brandId: 1, assetType: 1, identifier: 1 }, { unique: true });

export const OfficialAsset = mongoose.model('OfficialAsset', officialAssetSchema);
