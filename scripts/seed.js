import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRequire = createRequire(path.resolve(__dirname, '../server/package.json'));

const mongoose = serverRequire('mongoose');
const bcrypt = serverRequire('bcryptjs');

import { User } from '../server/src/models/User.js';
import { Brand } from '../server/src/models/Brand.js';
import { OfficialAsset } from '../server/src/models/OfficialAsset.js';
import { Candidate } from '../server/src/models/Candidate.js';
import { Detection } from '../server/src/models/Detection.js';
import { InvestigationNote } from '../server/src/models/InvestigationNote.js';
import { Scan } from '../server/src/models/Scan.js';
import { SourceHealth } from '../server/src/models/SourceHealth.js';
import { ENV } from '../server/src/config/env.js';
import { ScanEngine } from '../server/src/services/scanEngine.js';

const SAMPLE_DIR = path.resolve(__dirname, '../sample-data');

async function seed() {
  console.log('--- Starting BRANDTRACE Database Seeding ---');
  await mongoose.connect(ENV.MONGODB_URI);
  console.log('Connected to MongoDB:', ENV.MONGODB_URI);

  const orgName = 'Global Risk Corp';

  // 1. Create Default Analyst User
  const analystEmail = 'analyst@brandtrace.local';
  let analyst = await User.findOne({ email: analystEmail });
  if (!analyst) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Analyst@1234', salt);
    analyst = await User.create({
      name: 'Sarah Connor (Security Analyst)',
      email: analystEmail,
      passwordHash,
      organization: orgName,
      role: 'lead_analyst'
    });
    console.log(`✓ Created Default User: ${analystEmail} / Analyst@1234`);
  } else {
    console.log(`ℹ User ${analystEmail} already exists.`);
  }

  // 2. Load and Seed Brands
  const brandsData = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'brands.json'), 'utf-8'));
  const brandMap = {};

  for (const b of brandsData) {
    let brandDoc = await Brand.findOne({ organization: orgName, name: b.name });
    if (!brandDoc) {
      brandDoc = await Brand.create({
        ...b,
        organization: orgName,
        ownerId: analyst._id
      });
      console.log(`✓ Seeded Brand: ${b.name}`);
    } else {
      console.log(`ℹ Brand ${b.name} already exists.`);
    }
    brandMap[b.name] = brandDoc;
  }

  // 3. Load and Seed Official Assets
  const assetsData = JSON.parse(fs.readFileSync(path.join(SAMPLE_DIR, 'official-assets.json'), 'utf-8'));
  for (const a of assetsData) {
    const brand = brandMap[a.brandName];
    if (!brand) continue;

    const existing = await OfficialAsset.findOne({
      brandId: brand._id,
      assetType: a.assetType,
      identifier: a.identifier
    });

    if (!existing) {
      await OfficialAsset.create({
        brandId: brand._id,
        organization: orgName,
        assetType: a.assetType,
        identifier: a.identifier,
        url: a.url || '',
        platformOrStore: a.platformOrStore || '',
        publisherName: a.publisherName || '',
        notes: a.notes || '',
        isActive: true
      });
      console.log(`  ✓ Seeded Official Asset: [${a.assetType}] ${a.identifier} for ${brand.name}`);
    }
  }

  // 4. Run Initial Scans for the brands to generate full realistic candidates, exclusions, and detections
  console.log('\n--- Running Initial Automated Scans ---');
  for (const brand of Object.values(brandMap)) {
    console.log(`Executing scan for ${brand.name}...`);
    const scan = await Scan.create({
      organization: orgName,
      brandId: brand._id,
      scanType: 'both',
      source: 'deterministic_sample',
      status: 'Queued',
      triggeredBy: analyst.name
    });

    await ScanEngine.executeScan(scan._id);
    console.log(`✓ Scan finished for ${brand.name}: ${scan.threatsFound} threats detected, ${scan.excludedCount} excluded official assets.`);
  }

  // 5. Add a simulated historical failed scan to satisfy Section 11 requirement
  const primaryBrand = Object.values(brandMap)[0];
  const failedScan = await Scan.findOne({ brandId: primaryBrand._id, status: 'Failed' });
  if (!failedScan) {
    await Scan.create({
      organization: orgName,
      brandId: primaryBrand._id,
      scanType: 'social',
      source: 'twitter_monitor',
      status: 'Failed',
      totalCandidates: 0,
      threatsFound: 0,
      excludedCount: 0,
      durationMs: 420,
      errorMessage: 'External API rate limit reached (HTTP 429: Too Many Requests on public Twitter endpoint).',
      triggeredBy: 'Automated Nightly Job'
    });
    console.log('✓ Seeded historical failed scan scenario.');
  }

  // 6. Enrich some detections with realistic analyst workflows (Under Review, Suspected Impersonation, False Positive, Resolved)
  console.log('\n--- Enriching Analyst Investigation History ---');
  const detections = await Detection.find({ organization: orgName }).populate('candidateId');
  for (const d of detections) {
    const c = d.candidateId;
    if (!c) continue;

    // Seed a False Positive example (e.g. legitimate unrelated business)
    if (c.usernameOrAppName.includes('Apex Mountain') || c.usernameOrAppName.includes('Nova Star')) {
      d.status = 'False Positive';
      d.falsePositiveReason = 'Confirmed legitimate unrelated commercial business. Outdoor gear manufacturer operating since 2012 with trademark registration.';
      d.assignedAnalyst = analyst.name;
      await d.save();

      await InvestigationNote.create({
        detectionId: d._id,
        organization: orgName,
        author: analyst.name,
        authorEmail: analyst.email,
        note: 'Analyst inspected corporate registration and logo. Confirmed legitimate unrelated business. Marked as False Positive.',
        previousStatus: 'New',
        newStatus: 'False Positive'
      });
      console.log(`  ✓ Annotated False Positive: ${c.usernameOrAppName}`);
    }

    // Seed a Confirmed Suspected Impersonation (Critical threat)
    if (d.riskCategory === 'Critical' && d.status === 'New') {
      d.status = 'Suspected Impersonation';
      d.assignedAnalyst = analyst.name;
      await d.save();

      await InvestigationNote.create({
        detectionId: d._id,
        organization: orgName,
        author: analyst.name,
        authorEmail: analyst.email,
        note: 'High-confidence fraudulent account. Employs exact logo, phishing redirect domain, and lures victims with fake bonuses. Escalated to legal counsel.',
        previousStatus: 'New',
        newStatus: 'Suspected Impersonation'
      });
      console.log(`  ✓ Annotated Suspected Impersonation: ${c.usernameOrAppName}`);
      break;
    }
  }

  // 7. Seed Source Health status
  await SourceHealth.deleteMany({});
  await SourceHealth.create([
    {
      sourceKey: 'sample_data_adapter',
      name: 'Deterministic Sample Data Provider',
      sourceType: 'internal_adapter',
      status: 'available',
      details: 'Deterministic social and mobile app test fixtures loaded.'
    },
    {
      sourceKey: 'twitter_monitor',
      name: 'Twitter/X Public Stream Connector',
      sourceType: 'external_api',
      status: 'unconfigured',
      errorMessage: 'TWITTER_BEARER_TOKEN environment variable is not configured.',
      details: 'Public stream monitoring paused to prevent unauthenticated scraping.'
    },
    {
      sourceKey: 'google_play_monitor',
      name: 'Google Play Store Listing Adapter',
      sourceType: 'external_api',
      status: 'unconfigured',
      errorMessage: 'GOOGLE_PLAY_API_KEY environment variable is not set.',
      details: 'Listing crawler offline.'
    }
  ]);
  console.log('✓ Seeded source health monitors.');

  console.log('\n====================================================');
  console.log('🎉 BRANDTRACE Seeding Complete!');
  console.log(`Credentials: ${analystEmail} / Analyst@1234`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
