import { generateCsv } from '../utils/csvEscape.js';

export class ReportService {
  static exportDetectionsToCsv(detections) {
    const headers = [
      { key: 'findingId', label: 'Finding ID' },
      { key: 'brandName', label: 'Brand' },
      { key: 'candidateType', label: 'Type' },
      { key: 'targetName', label: 'Candidate Name' },
      { key: 'platform', label: 'Platform / Store' },
      { key: 'riskScore', label: 'Risk Score' },
      { key: 'riskCategory', label: 'Risk Category' },
      { key: 'status', label: 'Analyst Status' },
      { key: 'assignedAnalyst', label: 'Assigned Analyst' },
      { key: 'candidateUrl', label: 'Candidate URL' },
      { key: 'primaryReason', label: 'Primary Evidence' },
      { key: 'recommendedAction', label: 'Recommended Action' },
      { key: 'detectedAt', label: 'Detected At' }
    ];

    const rows = detections.map(d => {
      const cand = d.candidateId || {};
      const brand = d.brandId || {};
      const primaryReason = (d.explanation && d.explanation.length > 0)
        ? d.explanation[0]
        : 'Multiple anomalous risk signals detected';

      return {
        findingId: String(d._id),
        brandName: brand.name || 'N/A',
        candidateType: d.candidateType === 'app' ? 'Mobile App' : 'Social Profile',
        targetName: cand.usernameOrAppName || 'N/A',
        platform: cand.platformOrStore || 'N/A',
        riskScore: d.riskScore,
        riskCategory: d.riskCategory,
        status: d.status,
        assignedAnalyst: d.assignedAnalyst || 'Unassigned',
        candidateUrl: cand.url || cand.externalUrl || '',
        primaryReason,
        recommendedAction: d.recommendedAction || '',
        detectedAt: d.createdAt ? new Date(d.createdAt).toISOString() : ''
      };
    });

    return generateCsv(headers, rows);
  }

  static exportScansToCsv(scans) {
    const headers = [
      { key: 'scanId', label: 'Scan ID' },
      { key: 'brandName', label: 'Brand Name' },
      { key: 'scanType', label: 'Scope' },
      { key: 'status', label: 'Status' },
      { key: 'totalCandidates', label: 'Candidates Evaluated' },
      { key: 'threatsFound', label: 'Active Threats Found' },
      { key: 'excludedCount', label: 'Official Assets Excluded' },
      { key: 'durationMs', label: 'Duration (ms)' },
      { key: 'createdAt', label: 'Triggered At' }
    ];

    const rows = scans.map(s => {
      const brand = s.brandId || {};
      return {
        scanId: String(s._id),
        brandName: brand.name || 'N/A',
        scanType: s.scanType,
        status: s.status,
        totalCandidates: s.totalCandidates || 0,
        threatsFound: s.threatsFound || 0,
        excludedCount: s.excludedCount || 0,
        durationMs: s.durationMs || 0,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : ''
      };
    });

    return generateCsv(headers, rows);
  }
}
