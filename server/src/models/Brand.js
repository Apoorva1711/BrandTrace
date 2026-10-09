import mongoose from 'mongoose';

const officialSocialSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  handle: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const officialMobileAppSchema = new mongoose.Schema({
  store: { type: String, required: true },
  appName: { type: String, required: true },
  packageId: { type: String, required: true },
  url: { type: String, required: true },
  publisher: { type: String, default: '' }
}, { _id: false });

const brandSchema = new mongoose.Schema({
  organization: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: 100
  },
  legalName: {
    type: String,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    maxlength: 1000
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String
  },
  logoHash: {
    type: String,
    trim: true
  },
  aliases: [{
    type: String,
    trim: true
  }],
  keywords: [{
    type: String,
    trim: true
  }],
  trustedDomains: [{
    type: String,
    trim: true
  }],
  officialSocialAccounts: [officialSocialSchema],
  officialMobileApps: [officialMobileAppSchema],
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

brandSchema.index({ organization: 1, name: 1 });

export const Brand = mongoose.model('Brand', brandSchema);
