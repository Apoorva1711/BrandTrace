import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';

import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Brand } from '../src/models/Brand.js';
import { OfficialAsset } from '../src/models/OfficialAsset.js';
import { Candidate } from '../src/models/Candidate.js';
import { Detection } from '../src/models/Detection.js';
import { Scan } from '../src/models/Scan.js';
import { sanitizeCsvField } from '../src/utils/csvEscape.js';
import { evaluateCandidateThreatInJs } from '../src/services/fallbackDetection.js';

describe('BRANDTRACE API & Security Test Suite', () => {
  let org1Token = '';
  let org2Token = '';
  let brandOrg1 = null;
  let brandOrg2 = null;
  let assetId = null;
  let detectionId = null;

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(ENV.MONGODB_URI);
    }
  });

  after(async () => {
    // Clean up test users and entities
    await User.deleteMany({ email: { $in: ['test_org1@test.com', 'test_org2@test.com'] } });
    if (brandOrg1) await Brand.deleteOne({ _id: brandOrg1._id });
    if (brandOrg2) await Brand.deleteOne({ _id: brandOrg2._id });
    await mongoose.disconnect();
    setTimeout(() => {
      process.exit(0);
    }, 500);
  });

  // 1. Registration and Login
  it('POST /api/auth/register - registers new user securely', async () => {
    await User.deleteOne({ email: 'test_org1@test.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analyst Org1',
        email: 'test_org1@test.com',
        password: 'Password123!',
        organization: 'Security Firm Alpha'
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'test_org1@test.com');
    assert.equal(res.body.user.organization, 'Security Firm Alpha');
    assert.equal(res.body.user.passwordHash, undefined, 'Password hash must never leak in API output');
    org1Token = res.body.token;
  });

  it('POST /api/auth/login - authenticates user and issues JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_org1@test.com',
        password: 'Password123!'
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  it('POST /api/auth/login - rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test_org1@test.com',
        password: 'WrongPassword'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 2. Unauthorized API Access
  it('GET /api/brands - rejects request without token', async () => {
    const res = await request(app).get('/api/brands');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 3. Register second organization for Cross-Org tests
  it('Registers second organization user', async () => {
    await User.deleteMany({ email: 'test_org2@test.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Analyst Org2',
        email: 'test_org2@test.com',
        password: 'Password123!',
        organization: 'Competitor Corp Beta'
      });

    assert.equal(res.status, 201);
    org2Token = res.body.token;
  });

  // 4. Brand Creation and Multi-Tenancy Validation
  it('POST /api/brands - creates a new brand profile', async () => {
    const res = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        name: 'AlphaShield',
        legalName: 'AlphaShield Cyber Solutions Ltd',
        description: 'Endpoint protection and SOC monitoring.',
        websiteUrl: 'https://alphashield.example.com',
        aliases: ['Alpha Shield', 'AlphaSec'],
        keywords: ['antivirus', 'soc', 'threats'],
        trustedDomains: ['alphashield.example.com']
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.brand.name, 'AlphaShield');
    brandOrg1 = res.body.brand;
  });

  it('GET /api/brands/:id - prevents cross-organization data access', async () => {
    // Org2 attempts to access Org1's brand
    const res = await request(app)
      .get(`/api/brands/${brandOrg1._id}`)
      .set('Authorization', `Bearer ${org2Token}`);

    assert.equal(res.status, 404, 'Org2 should receive 404 for resources belonging to Org1');
    assert.equal(res.body.success, false);
  });

  // 5. Official Asset Registration and Exclusion
  it('POST /api/assets - registers official asset with normalized URL', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        brandId: brandOrg1._id,
        assetType: 'official_social_profile',
        identifier: 'AlphaShieldOfficial',
        url: 'https://twitter.com/AlphaShieldOfficial/',
        platformOrStore: 'Twitter/X',
        notes: 'Official Twitter page'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.asset.normalizedUrl, 'twitter.com/alphashieldofficial');
    assetId = res.body.asset._id;
  });

  it('POST /api/assets - prevents duplicate asset creation', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        brandId: brandOrg1._id,
        assetType: 'official_social_profile',
        identifier: 'AlphaShieldOfficial'
      });

    assert.equal(res.status, 409, 'Duplicate asset should return 409 conflict');
  });

  // 6. Exclusion and Threat Scoring Logic
  it('Excludes exact registered official asset candidate', () => {
    const brand = { name: 'AlphaShield', aliases: [] };
    const officialAssets = [
      {
        assetType: 'official_social_profile',
        identifier: 'AlphaShieldOfficial',
        url: 'https://twitter.com/AlphaShieldOfficial',
        platformOrStore: 'Twitter/X'
      }
    ];
    const candidate = {
      candidateType: 'social',
      platformOrStore: 'Twitter/X',
      usernameOrAppName: 'AlphaShieldOfficial',
      url: 'https://twitter.com/alphashieldofficial/'
    };

    const res = evaluateCandidateThreatInJs(brand, officialAssets, candidate);
    assert.equal(res.isExcluded, true);
    assert.equal(res.riskScore, 0);
  });

  it('Flags suspicious impersonator with support keyword and malicious link', () => {
    const brand = { name: 'AlphaShield', aliases: [] };
    const officialAssets = [];
    const candidate = {
      candidateType: 'social',
      platformOrStore: 'Twitter/X',
      usernameOrAppName: 'AlphaShield_Support_Help',
      description: 'Official customer support and ticket assistance. Reset your password here.',
      externalUrl: 'https://bit.ly/claim-alphashield-bonus',
      followers: 14
    };

    const res = evaluateCandidateThreatInJs(brand, officialAssets, candidate);
    assert.equal(res.isExcluded, false);
    assert.ok(res.riskScore >= 60, `Risk score should be high/critical, got ${res.riskScore}`);
    assert.ok(['High', 'Critical'].includes(res.riskCategory));
  });

  it('Identifies unauthorized mobile app developer mismatch', () => {
    const brand = { name: 'AlphaShield', aliases: [] };
    const officialAssets = [];
    const candidate = {
      candidateType: 'app',
      platformOrStore: 'Google Play',
      usernameOrAppName: 'AlphaShield Antivirus Pro',
      publisherName: 'Unknown Shady Mobile Devs Ltd',
      description: 'Protect your phone with AlphaShield.',
      packageId: 'com.scam.fake.alphashield'
    };

    const res = evaluateCandidateThreatInJs(brand, officialAssets, candidate);
    assert.equal(res.isExcluded, false);
    assert.ok(res.signals.publisher_mismatch_score >= 10);
  });

  // 7. Investigation Workflow and Status Changes
  it('PATCH /api/detections/:id/status - requires explanation when marking False Positive', async () => {
    // Create candidate and detection
    const candidate = await Candidate.create({
      organization: 'Security Firm Alpha',
      brandId: brandOrg1._id,
      platformOrStore: 'Twitter/X',
      candidateType: 'social',
      usernameOrAppName: 'AlphaShield_News',
      url: 'https://twitter.com/AlphaShield_News'
    });

    const detection = await Detection.create({
      organization: 'Security Firm Alpha',
      brandId: brandOrg1._id,
      candidateId: candidate._id,
      candidateType: 'social',
      riskScore: 65,
      riskCategory: 'High',
      status: 'New'
    });
    detectionId = detection._id;

    // Attempt to set False Positive without a note
    const resFail = await request(app)
      .patch(`/api/detections/${detectionId}/status`)
      .set('Authorization', `Bearer ${org1Token}`)
      .send({ status: 'False Positive' });

    assert.equal(resFail.status, 400);

    // Provide required note
    const resSuccess = await request(app)
      .patch(`/api/detections/${detectionId}/status`)
      .set('Authorization', `Bearer ${org1Token}`)
      .send({
        status: 'False Positive',
        note: 'Verified independent tech journalist fan feed. No impersonation intent.'
      });

    assert.equal(resSuccess.status, 200);
    assert.equal(resSuccess.body.detection.status, 'False Positive');
  });

  // 8. CSV Formula Injection Safety
  it('Sanitizes fields starting with formula characters (=, +, -, @)', () => {
    assert.equal(sanitizeCsvField('=1+2'), `"'=1+2"`);
    assert.equal(sanitizeCsvField('+cmd|/c calc'), `"'+cmd|/c calc"`);
    assert.equal(sanitizeCsvField('-500'), `"'-500"`);
    assert.equal(sanitizeCsvField('@SUM(A1:A10)'), `"'@SUM(A1:A10)"`);
    assert.equal(sanitizeCsvField('Normal Name'), `"Normal Name"`);
  });

  // 9. System Health & Source Availability
  it('GET /api/health - returns operational system status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
  });

  it('GET /api/sources/health - honestly discloses unconfigured external sources', async () => {
    const res = await request(app)
      .get('/api/sources/health')
      .set('Authorization', `Bearer ${org1Token}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.sources));
    const twitterSource = res.body.sources.find(s => s.sourceKey === 'twitter_monitor');
    assert.ok(twitterSource);
    assert.equal(twitterSource.status, 'unconfigured');
  });
});
