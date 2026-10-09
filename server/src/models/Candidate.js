import mongoose from 'mongoose';
import { normalizeUrl, normalizeIdentifier } from '../utils/normalizers.js';

const candidateSchema = new mongoose.Schema({
  organization: {
    type: String,
    required: true,
    index: true
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    default: 'sample_adapter'
  },
  sourceType: {
    type: String,
    enum: ['sample_data', 'imported_file', 'external_api', 'manual'],
    default: 'sample_data'
  },
  platformOrStore: {
    type: String,
    required: true,
    trim: true
  },
  candidateType: {
    type: String,
    enum: ['social', 'app'],
    required: true,
    index: true
  },
  usernameOrAppName: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true,
    default: ''
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
  externalUrl: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  publisherName: {
    type: String,
    trim: true,
    default: ''
  },
  packageId: {
    type: String,
    trim: true,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  avatarHash: {
    type: String,
    default: ''
  },
  followers: {
    type: Number,
    default: 0
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isExcluded: {
    type: Boolean,
    default: false,
    index: true
  },
  exclusionReason: {
    type: String,
    default: ''
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

candidateSchema.pre('save', function(next) {
  if (this.url) {
    this.normalizedUrl = normalizeUrl(this.url);
  }
  next();
});

// Compound index for querying candidates per brand
candidateSchema.index({ brandId: 1, candidateType: 1, usernameOrAppName: 1, platformOrStore: 1 });

export const Candidate = mongoose.model('Candidate', candidateSchema);
