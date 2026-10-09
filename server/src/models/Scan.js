import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
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
  scanType: {
    type: String,
    enum: ['social', 'app', 'both'],
    required: true
  },
  source: {
    type: String,
    default: 'deterministic_sample'
  },
  status: {
    type: String,
    enum: ['Queued', 'Running', 'Completed', 'Partially Completed', 'Failed'],
    default: 'Queued',
    index: true
  },
  totalCandidates: {
    type: Number,
    default: 0
  },
  candidatesEvaluated: {
    type: Number,
    default: 0
  },
  threatsFound: {
    type: Number,
    default: 0
  },
  excludedCount: {
    type: Number,
    default: 0
  },
  durationMs: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: ''
  },
  triggeredBy: {
    type: String,
    default: 'System Analyst'
  }
}, {
  timestamps: true
});

export const Scan = mongoose.model('Scan', scanSchema);
