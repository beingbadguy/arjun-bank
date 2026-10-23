/**
 * High-Performance Server-Side In-Memory Cache with Group Invalidation & LRU Eviction
 * Persisted on globalThis to survive Next.js module reloads in Node.js process.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  group?: string;
  accessedAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
  };

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Retrieve cached value if valid, otherwise undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      this.stats.size = this.store.size;
      return undefined;
    }

    entry.accessedAt = now;
    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set cached value with TTL in seconds and optional group tag
   */
  set<T>(key: string, value: T, ttlSeconds: number, group?: string): void {
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + Math.max(1, ttlSeconds) * 1000;
    this.store.set(key, {
      value,
      expiresAt,
      group,
      accessedAt: Date.now(),
    });
    this.stats.size = this.store.size;
  }

  /**
   * Helper to get cached value or compute and cache it atomically
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number,
    group?: string
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    this.set(key, fresh, ttlSeconds, group);
    return fresh;
  }

  /**
   * Delete a single key
   */
  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    this.stats.size = this.store.size;
    return deleted;
  }

  /**
   * Invalidate all keys matching a specific group tag (e.g. 'companies', 'pincodes', 'bankers', 'recycle')
   */
  invalidateGroup(group: string): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.group === group || now > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    this.stats.size = this.store.size;
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear();
    this.stats.size = 0;
  }

  /**
   * Evict the least recently accessed or expired entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        oldestKey = key;
        break;
      }
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size = this.store.size;
    }
  }

  /**
   * Inspect cache health
   */
  getMetrics(): CacheStats & { memoryKeys: number } {
    return {
      ...this.stats,
      size: this.store.size,
      memoryKeys: this.store.size,
    };
  }
}

// Global cache instance across hot reloads and worker invocations
declare global {
  var __globalMemoryCache: MemoryCache | undefined;
}

export const serverCache: MemoryCache =
  globalThis.__globalMemoryCache || new MemoryCache(10000);

if (!globalThis.__globalMemoryCache) {
  globalThis.__globalMemoryCache = serverCache;
}

/**
 * Generate a sorted, normalized cache key from query params
 */
export function buildCacheKey(
  namespace: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const sortedPairs = Object.entries(params)
    .filter(([, val]) => val !== undefined && val !== null && val !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v).trim().toLowerCase())}`);

  return `${namespace}:${sortedPairs.join("&")}`;
}
