/**
 * Base interface for data collection adapters in BRANDTRACE.
 * Allows adding new data sources without rewriting detection logic.
 */
export class SourceAdapter {
  constructor(sourceKey, name, sourceType) {
    this.sourceKey = sourceKey;
    this.name = name;
    this.sourceType = sourceType;
  }

  async checkHealth() {
    throw new Error('checkHealth must be implemented by subclass');
  }

  async fetchCandidates(brand, options = {}) {
    throw new Error('fetchCandidates must be implemented by subclass');
  }
}
