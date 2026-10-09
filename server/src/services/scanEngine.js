import { Brand } from '../models/Brand.js';
import { OfficialAsset } from '../models/OfficialAsset.js';
import { Candidate } from '../models/Candidate.js';
import { Detection } from '../models/Detection.js';
import { Scan } from '../models/Scan.js';
import { SampleDataAdapter } from '../adapters/sampleDataAdapter.js';
import { DetectionClient } from './detectionClient.js';
import { normalizeUrl } from '../utils/normalizers.js';

export class ScanEngine {
  static async executeScan(scanId) {
    const startTime = Date.now();
    const scan = await Scan.findById(scanId);
    if (!scan) {
      throw new Error(`Scan ${scanId} not found`);
    }

    try {
      scan.status = 'Running';
      await scan.save();

      // Step 1: Validate brand
      const brand = await Brand.findById(scan.brandId);
      if (!brand) {
        throw new Error(`Brand ${scan.brandId} not found`);
      }

      // Fetch official assets for this brand and organization
      const officialAssets = await OfficialAsset.find({
        brandId: brand._id,
        organization: scan.organization,
        isActive: true
      });

      // Step 2: Collect candidates using appropriate adapter
      const sampleAdapter = new SampleDataAdapter();
      const rawCandidates = await sampleAdapter.fetchCandidates(brand, {
        scanType: scan.scanType
      });

      scan.totalCandidates = rawCandidates.length;

      // Step 3 & 4: Normalize & evaluate candidates with Detection microservice
      const batchResults = await DetectionClient.evaluateBatch(brand, officialAssets, rawCandidates);

      let excludedCount = 0;
      let threatsFound = 0;

      for (let i = 0; i < rawCandidates.length; i++) {
        const raw = rawCandidates[i];
        const evalRes = batchResults[i];

        // Upsert candidate in database
        const normalizedUrl = raw.url ? normalizeUrl(raw.url) : '';
        const candidateDoc = await Candidate.findOneAndUpdate(
          {
            organization: scan.organization,
            brandId: brand._id,
            candidateType: raw.candidateType,
            usernameOrAppName: raw.usernameOrAppName,
            platformOrStore: raw.platformOrStore
          },
          {
            $set: {
              organization: scan.organization,
              brandId: brand._id,
              source: raw.source || 'deterministic_sample',
              sourceType: raw.sourceType || 'sample_data',
              platformOrStore: raw.platformOrStore,
              candidateType: raw.candidateType,
              usernameOrAppName: raw.usernameOrAppName,
              displayName: raw.displayName || raw.usernameOrAppName,
              url: raw.url || '',
              normalizedUrl,
              externalUrl: raw.externalUrl || '',
              description: raw.description || '',
              publisherName: raw.publisherName || '',
              packageId: raw.packageId || '',
              avatarHash: raw.avatarHash || '',
              followers: raw.followers || 0,
              rawData: raw.rawData || {},
              isExcluded: evalRes.isExcluded,
              exclusionReason: evalRes.exclusionReason || '',
              lastSeen: new Date()
            },
            $setOnInsert: {
              firstSeen: new Date()
            }
          },
          { upsert: true, new: true }
        );

        if (evalRes.isExcluded) {
          excludedCount++;
          // If candidate was previously flagged as detection, remove or resolve it
          await Detection.deleteOne({
            brandId: brand._id,
            candidateId: candidateDoc._id
          });
        } else {
          threatsFound++;
          // Upsert detection finding (preventing duplicates)
          await Detection.findOneAndUpdate(
            {
              brandId: brand._id,
              candidateId: candidateDoc._id
            },
            {
              $set: {
                organization: scan.organization,
                scanId: scan._id,
                candidateType: raw.candidateType,
                riskScore: evalRes.riskScore,
                riskCategory: evalRes.riskCategory,
                signals: evalRes.signals,
                explanation: evalRes.explanation,
                recommendedAction: evalRes.recommendedAction
              },
              $setOnInsert: {
                status: 'New',
                assignedAnalyst: 'Unassigned',
                createdAt: new Date()
              }
            },
            { upsert: true, new: true }
          );
        }
      }

      const durationMs = Date.now() - startTime;
      scan.status = 'Completed';
      scan.candidatesEvaluated = rawCandidates.length;
      scan.threatsFound = threatsFound;
      scan.excludedCount = excludedCount;
      scan.durationMs = durationMs;
      await scan.save();

      return scan;
    } catch (err) {
      console.error(`[ScanEngine Error] Scan ${scanId} failed:`, err);
      scan.status = 'Failed';
      scan.errorMessage = err.message;
      scan.durationMs = Date.now() - startTime;
      await scan.save();
      throw err;
    }
  }
}
