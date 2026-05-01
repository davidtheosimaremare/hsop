/**
 * Simple in-memory cache with TTL for server-side data.
 * This prevents repeated DB queries for frequently accessed data
 * like site settings, menu config, etc.
 * 
 * Unlike Next.js unstable_cache (which uses filesystem on standalone),
 * this stays in Node.js memory and is extremely fast.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTTL: number;

    constructor(defaultTTLSeconds: number = 300) {
        this.defaultTTL = defaultTTLSeconds * 1000;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data as T;
    }

    set<T>(key: string, data: T, ttlSeconds?: number): void {
        const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
        });
    }

    /**
     * Get-or-fetch pattern: returns cached value if available,
     * otherwise calls the fetcher function and caches the result.
     */
    async getOrFetch<T>(
        key: string, 
        fetcher: () => Promise<T>, 
        ttlSeconds?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) return cached;

        const data = await fetcher();
        this.set(key, data, ttlSeconds);
        return data;
    }

    /**
     * Invalidate a specific key or all keys matching a prefix.
     */
    invalidate(keyOrPrefix: string): void {
        if (this.cache.has(keyOrPrefix)) {
            this.cache.delete(keyOrPrefix);
            return;
        }
        
        // Prefix match
        for (const key of this.cache.keys()) {
            if (key.startsWith(keyOrPrefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cached entries.
     */
    clear(): void {
        this.cache.clear();
    }
}

// Global singleton: survives across requests in the same Node.js process
declare global {
    var __memoryCache: MemoryCache | undefined;
}

// 5 minute default TTL
export const memoryCache = globalThis.__memoryCache || new MemoryCache(300);

if (!globalThis.__memoryCache) {
    globalThis.__memoryCache = memoryCache;
}
