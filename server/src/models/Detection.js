import mongoose from 'mongoose';

const signalBreakdownSchema = new mongoose.Schema({
  name_similarity_score: { type: Number, default: 0 },
  name_similarity_ratio: { type: Number, default: 0 },
  name_match_type: { type: String, default: 'none' },
  logo_similarity_score: { type: Number, default: 0 },
  logo_evaluated: { type: Boolean, default: false },
  logo_hash_distance: { type: Number, default: null },
  publisher_mismatch_score: { type: Number, default: 0 },
  publisher_evaluation: { type: String, default: 'n/a' },
  context_indicators_score: { type: Number, default: 0 },
  flagged_keywords: [{ type: String }],
  external_link_score: { type: Number, default: 0 },
  link_evaluation: { type: String, default: 'none' }
}, { _id: false });

const detectionSchema = new mongoose.Schema({
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
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
    index: true
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    index: true
  },
  candidateType: {
    type: String,
    enum: ['social', 'app'],
    required: true,
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  riskCategory: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['New', 'Under Review', 'Suspected Impersonation', 'False Positive', 'Resolved'],
    default: 'New',
    index: true
  },
  signals: {
    type: signalBreakdownSchema,
    default: () => ({})
  },
  explanation: [{
    type: String
  }],
  recommendedAction: {
    type: String,
    default: 'Standard analyst review recommended.'
  },
  assignedAnalyst: {
    type: String,
    default: 'Unassigned'
  },
  falsePositiveReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound unique index ensuring one finding per candidate per brand
detectionSchema.index({ brandId: 1, candidateId: 1 }, { unique: true });

export const Detection = mongoose.model('Detection', detectionSchema);
