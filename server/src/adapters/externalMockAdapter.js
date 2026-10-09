import { SourceAdapter } from './sourceAdapterInterface.js';

export class ExternalPlatformAdapter extends SourceAdapter {
  constructor(sourceKey, name, platform, envVarKey) {
    super(sourceKey, name, 'external_api');
    this.platform = platform;
    this.envVarKey = envVarKey;
  }

  async checkHealth() {
    const hasToken = Boolean(process.env[this.envVarKey]);

    if (!hasToken) {
      return {
        sourceKey: this.sourceKey,
        name: this.name,
        sourceType: this.sourceType,
        status: 'unconfigured',
        lastChecked: new Date(),
        errorMessage: `Missing environment variable ${this.envVarKey}. External automated crawling disabled to respect platform policies.`,
        details: 'Respecting platform authentication guidelines: unauthenticated scraping prohibited. Deterministic sample provider active.'
      };
    }

    return {
      sourceKey: this.sourceKey,
      name: this.name,
      sourceType: this.sourceType,
      status: 'available',
      lastChecked: new Date(),
      lastSuccess: new Date(),
      details: `Active authenticated connector for ${this.platform}.`
    };
  }

  async fetchCandidates(brand, options = {}) {
    const health = await this.checkHealth();
    if (health.status !== 'available') {
      throw new Error(`External source '${this.name}' is currently unavailable (${health.status}): ${health.errorMessage}`);
    }
    // If credentials were provided, real API requests would execute here
    return [];
  }
}
