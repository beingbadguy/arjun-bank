/**
 * High-Performance Client-Side In-Memory Query Cache with In-Flight Deduplication
 * Provides instant 0ms results on back/forward navigation, pagination, and repeated queries.
 */

interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class ClientQueryCache {
  private cache = new Map<string, ClientCacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private abortControllers = new Map<string, AbortController>();

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttlSeconds = 120): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlSeconds * 1000,
    });
  }

  /**
   * Delete specific key or all keys matching a prefix
   */
  invalidate(keyOrPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Delete a specific cache key
   */
  delete(key: string): void {
    this.invalidate(key);
  }

  /**
   * Clear entire client cache
   */
  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * Abort previous request for a namespace and get a new AbortSignal
   */
  getAbortSignal(namespace: string): AbortSignal {
    const existing = this.abortControllers.get(namespace);
    if (existing) {
      existing.abort();
    }
    const controller = new AbortController();
    this.abortControllers.set(namespace, controller);
    return controller.signal;
  }

  /**
   * Fetch with in-flight deduplication and automatic caching
   */
  async fetchWithCache<T>(
    url: string,
    options?: RequestInit,
    ttlSeconds = 120
  ): Promise<T> {
    // 1. Check client cache first
    const cached = this.get<T>(url);
    if (cached !== null) {
      return cached;
    }

    // 2. Check if identical request is already in flight (deduplication)
    if (this.inFlight.has(url)) {
      return (await this.inFlight.get(url)) as T;
    }

    // 3. Dispatch fetch and store promise
    const fetchPromise = (async () => {
      try {
        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        // Only cache successful JSON payloads
        if (data && data.success !== false) {
          this.set(url, data, ttlSeconds);
        }
        return data as T;
      } finally {
        this.inFlight.delete(url);
      }
    })();

    this.inFlight.set(url, fetchPromise);
    return fetchPromise;
  }
}

// Global client cache instance
export const clientCache = new ClientQueryCache();
