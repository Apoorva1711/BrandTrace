import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SourceAdapter } from './sourceAdapterInterface.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_DATA_DIR = path.resolve(__dirname, '../../../sample-data');

export class SampleDataAdapter extends SourceAdapter {
  constructor() {
    super('sample_data_adapter', 'Deterministic Sample Data Provider', 'sample_data');
  }

  async checkHealth() {
    const socialPath = path.join(SAMPLE_DATA_DIR, 'social-candidates.json');
    const appPath = path.join(SAMPLE_DATA_DIR, 'app-candidates.json');
    const available = fs.existsSync(socialPath) && fs.existsSync(appPath);

    return {
      sourceKey: this.sourceKey,
      name: this.name,
      sourceType: this.sourceType,
      status: available ? 'available' : 'unavailable',
      lastChecked: new Date(),
      details: available
        ? 'Verified local deterministic sample datasets for social and app monitoring.'
        : 'Sample dataset files missing from disk.'
    };
  }

  async fetchCandidates(brand, options = {}) {
    const { scanType = 'both' } = options; // 'social', 'app', or 'both'
    const results = [];

    const brandNames = [brand.name.toLowerCase(), ...(brand.aliases || []).map(a => a.toLowerCase())];

    if (scanType === 'social' || scanType === 'both') {
      const socialPath = path.join(SAMPLE_DATA_DIR, 'social-candidates.json');
      if (fs.existsSync(socialPath)) {
        const socialData = JSON.parse(fs.readFileSync(socialPath, 'utf-8'));
        const brandSocials = socialData.filter(item => {
          if (!item.brandName) return true;
          return brandNames.includes(item.brandName.toLowerCase());
        });

        for (const item of brandSocials) {
          results.push({
            candidateType: 'social',
            platformOrStore: item.platform || 'Web',
            usernameOrAppName: item.username,
            displayName: item.displayName || item.username,
            url: item.profileUrl || '',
            externalUrl: item.externalUrl || '',
            description: item.description || '',
            avatarHash: item.avatarHash || null,
            followers: item.followers || 0,
            source: 'deterministic_sample',
            sourceType: 'sample_data',
            sourceLabel: 'DEMO DATA',
            rawData: item
          });
        }
      }
    }

    if (scanType === 'app' || scanType === 'both') {
      const appPath = path.join(SAMPLE_DATA_DIR, 'app-candidates.json');
      if (fs.existsSync(appPath)) {
        const appData = JSON.parse(fs.readFileSync(appPath, 'utf-8'));
        const brandApps = appData.filter(item => {
          if (!item.brandName) return true;
          return brandNames.includes(item.brandName.toLowerCase());
        });

        for (const item of brandApps) {
          results.push({
            candidateType: 'app',
            platformOrStore: item.storeName || 'Google Play',
            usernameOrAppName: item.appName,
            displayName: item.appName,
            url: item.listingUrl || '',
            externalUrl: item.externalUrl || '',
            description: item.description || '',
            publisherName: item.developer || '',
            packageId: item.packageId || '',
            avatarHash: item.avatarHash || null,
            source: 'deterministic_sample',
            sourceType: 'sample_data',
            sourceLabel: 'DEMO DATA',
            rawData: item
          });
        }
      }
    }

    return results;
  }
}
