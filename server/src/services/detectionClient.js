import axios from 'axios';
import { ENV } from '../config/env.js';
import { evaluateCandidateThreatInJs } from './fallbackDetection.js';

export class DetectionClient {
  static async checkServiceHealth() {
    try {
      const response = await axios.get(`${ENV.DETECTION_SERVICE_URL}/health`, { timeout: 1500 });
      return {
        status: response.data.status === 'healthy' ? 'available' : 'degraded',
        details: 'Python FastAPI Detection Microservice is online.',
        service: response.data.service,
        version: response.data.version
      };
    } catch (err) {
      return {
        status: 'degraded',
        details: 'Python Detection microservice offline; using resilient internal Node engine fallback.',
        error: err.message
      };
    }
  }

  static async evaluateSingle(brand, officialAssets, candidate) {
    try {
      const payload = {
        brand: {
          name: brand.name,
          legal_name: brand.legalName || '',
          aliases: brand.aliases || [],
          website_url: brand.websiteUrl || '',
          trusted_domains: brand.trustedDomains || [],
          keywords: brand.keywords || [],
          logo_hash: brand.logoHash || null
        },
        official_assets: (officialAssets || []).map(a => ({
          asset_type: a.assetType,
          identifier: a.identifier,
          url: a.url || '',
          platform_or_store: a.platformOrStore || '',
          publisher_name: a.publisherName || ''
        })),
        candidate: {
          candidate_id: candidate._id ? String(candidate._id) : candidate.candidate_id,
          candidate_type: candidate.candidateType,
          platform_or_store: candidate.platformOrStore || '',
          username_or_app_name: candidate.usernameOrAppName,
          display_name: candidate.displayName || '',
          url: candidate.url || '',
          external_url: candidate.externalUrl || '',
          description: candidate.description || '',
          publisher_name: candidate.publisherName || '',
          package_id: candidate.packageId || '',
          avatar_hash: candidate.avatarHash || null,
          followers: candidate.followers || 0
        }
      };

      const response = await axios.post(`${ENV.DETECTION_SERVICE_URL}/detect/match`, payload, {
        timeout: 4000
      });

      return {
        isExcluded: response.data.is_excluded,
        exclusionReason: response.data.exclusion_reason,
        riskScore: response.data.risk_score,
        riskCategory: response.data.risk_category,
        signals: response.data.signals,
        explanation: response.data.explanation,
        recommendedAction: response.data.recommended_action
      };
    } catch (err) {
      // Graceful fallback to internal JS detection engine
      return evaluateCandidateThreatInJs(brand, officialAssets, candidate);
    }
  }

  static async evaluateBatch(brand, officialAssets, candidates) {
    try {
      const payload = {
        brand: {
          name: brand.name,
          legal_name: brand.legalName || '',
          aliases: brand.aliases || [],
          website_url: brand.websiteUrl || '',
          trusted_domains: brand.trustedDomains || [],
          keywords: brand.keywords || [],
          logo_hash: brand.logoHash || null
        },
        official_assets: (officialAssets || []).map(a => ({
          asset_type: a.assetType,
          identifier: a.identifier,
          url: a.url || '',
          platform_or_store: a.platformOrStore || '',
          publisher_name: a.publisherName || ''
        })),
        candidates: candidates.map(c => ({
          candidate_id: c._id ? String(c._id) : c.candidate_id,
          candidate_type: c.candidateType,
          platform_or_store: c.platformOrStore || '',
          username_or_app_name: c.usernameOrAppName,
          display_name: c.displayName || '',
          url: c.url || '',
          external_url: c.externalUrl || '',
          description: c.description || '',
          publisher_name: c.publisherName || '',
          package_id: c.packageId || '',
          avatar_hash: c.avatarHash || null,
          followers: c.followers || 0
        }))
      };

      const response = await axios.post(`${ENV.DETECTION_SERVICE_URL}/detect/batch`, payload, {
        timeout: 10000
      });

      return response.data.results.map(r => ({
        candidate_id: r.candidate_id,
        username_or_app_name: r.username_or_app_name,
        isExcluded: r.is_excluded,
        exclusionReason: r.exclusion_reason,
        riskScore: r.risk_score,
        riskCategory: r.risk_category,
        signals: r.signals,
        explanation: r.explanation,
        recommendedAction: r.recommended_action
      }));
    } catch (err) {
      // Fallback
      return candidates.map(c => {
        const evalRes = evaluateCandidateThreatInJs(brand, officialAssets, c);
        return {
          candidate_id: c._id ? String(c._id) : c.candidate_id,
          username_or_app_name: c.usernameOrAppName,
          ...evalRes
        };
      });
    }
  }
}
