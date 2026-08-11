/**
 * Cross-instance persistent cache using Next.js unstable_cache.
 *
 * Unlike a plain Map (which only lives in one Lambda instance's memory),
 * Next.js Data Cache is stored at the infrastructure layer and shared across
 * ALL Lambda instances. This means even brand-new instances get fast responses.
 *
 * The in-memory fallback ensures sub-millisecond hits for repeat calls within
 * the same instance (e.g. multiple components on one page render).
 */

import { unstable_cache } from "next/cache";

// Per-instance in-memory layer (sub-ms for same-instance repeat hits)
type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const localStore = new Map<string, CacheEntry<any>>();

/**
 * getCached — tiered caching:
 *  1. Check local in-memory store (< 1ms, same-instance only)
 *  2. Check Next.js Data Cache (shared across all Vercel Lambda instances)
 *  3. Fetch from DB and populate both layers
 */
export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Layer 1: In-memory (current Lambda instance only)
  const now = Date.now();
  const local = localStore.get(key);
  if (local && local.expiresAt > now) {
    return local.data as T;
  }

  // Layer 2: Next.js Data Cache (shared across all instances)
  const cachedFetch = unstable_cache(fetchFn, [key], {
    revalidate: ttlSeconds,
    tags: [key.split("_")[0]], // group by prefix for targeted invalidation
  });

  const data = await cachedFetch();

  // Populate in-memory layer for subsequent same-instance hits
  localStore.set(key, { data, expiresAt: now + ttlSeconds * 1000 });

  return data;
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    localStore.clear();
    return;
  }
  for (const key of localStore.keys()) {
    if (key.startsWith(keyPrefix)) {
      localStore.delete(key);
    }
  }
}
