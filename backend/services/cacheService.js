class CacheService {
  constructor({ ttlMs = 30_000 } = {}) {
    this.ttlMs = ttlMs;
    this.entries = new Map();
  }

  async remember(key, producer, ttlMs = this.ttlMs) {
    const cached = this.entries.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await producer();
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  invalidate(prefix = "") {
    for (const key of this.entries.keys()) {
      if (!prefix || key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }
}

module.exports = { CacheService };
