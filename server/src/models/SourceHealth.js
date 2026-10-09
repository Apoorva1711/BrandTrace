import mongoose from 'mongoose';

const sourceHealthSchema = new mongoose.Schema({
  sourceKey: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  sourceType: {
    type: String,
    enum: ['internal_adapter', 'external_api', 'file_import'],
    default: 'internal_adapter'
  },
  status: {
    type: String,
    enum: ['available', 'degraded', 'unavailable', 'unconfigured'],
    default: 'available'
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  lastSuccess: {
    type: Date,
    default: Date.now
  },
  errorMessage: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const SourceHealth = mongoose.model('SourceHealth', sourceHealthSchema);
