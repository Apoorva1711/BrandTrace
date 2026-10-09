import { SourceAdapter } from './sourceAdapterInterface.js';

export class CsvJsonImportAdapter extends SourceAdapter {
  constructor() {
    super('import_adapter', 'User CSV/JSON Import Adapter', 'file_import');
  }

  async checkHealth() {
    return {
      sourceKey: this.sourceKey,
      name: this.name,
      sourceType: this.sourceType,
      status: 'available',
      lastChecked: new Date(),
      details: 'Ready to ingest structured user-uploaded JSON and CSV candidate records.'
    };
  }

  parseCandidateList(items, defaultBrandId) {
    if (!Array.isArray(items)) {
      throw new Error('Import data must be a JSON array of candidate objects.');
    }

    return items.map((item, idx) => {
      const type = (item.candidateType || (item.packageId ? 'app' : 'social')).toLowerCase();
      const name = item.usernameOrAppName || item.username || item.appName || item.name;
      if (!name) {
        throw new Error(`Record at row/index ${idx + 1} is missing usernameOrAppName.`);
      }

      return {
        brandId: item.brandId || defaultBrandId,
        candidateType: type === 'app' ? 'app' : 'social',
        platformOrStore: item.platformOrStore || item.platform || item.storeName || (type === 'app' ? 'Google Play' : 'Web'),
        usernameOrAppName: String(name).trim(),
        displayName: item.displayName || name,
        url: item.url || item.profileUrl || item.listingUrl || '',
        externalUrl: item.externalUrl || '',
        description: item.description || '',
        publisherName: item.publisherName || item.developer || '',
        packageId: item.packageId || '',
        avatarHash: item.avatarHash || null,
        followers: Number(item.followers) || 0,
        source: 'user_import',
        sourceType: 'imported_file',
        sourceLabel: 'USER IMPORT',
        rawData: item
      };
    });
  }
}
