import mongoose from 'mongoose';

const investigationNoteSchema = new mongoose.Schema({
  detectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Detection',
    required: true,
    index: true
  },
  organization: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  authorEmail: {
    type: String,
    trim: true,
    default: ''
  },
  note: {
    type: String,
    required: [true, 'Note text is required'],
    trim: true
  },
  previousStatus: {
    type: String,
    default: ''
  },
  newStatus: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export const InvestigationNote = mongoose.model('InvestigationNote', investigationNoteSchema);
