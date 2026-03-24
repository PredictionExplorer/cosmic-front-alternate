'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { reportError } from '@/lib/errorReporter';

// ── Simple dedup / stale-while-revalidate cache ─────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const STALE_MS = 5_000; // cached data older than this triggers a background refetch

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  return entry.data;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function isStale(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return true;
  return Date.now() - entry.timestamp > STALE_MS;
}

// ── In-flight dedup ─────────────────────────────────────────────────────

const inflight = new Map<string, Promise<unknown>>();

// ── Hook ────────────────────────────────────────────────────────────────

export interface ApiQueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

export interface ApiQueryOptions {
  /** Set to false to skip fetching (e.g. when a dependency is missing) */
  enabled?: boolean;
  /** If set, re-fetches on this interval (ms) while the page is visible */
  refetchInterval?: number;
}

/**
 * Lightweight data-fetching hook for API calls.
 *
 * - Returns `{ data, error, isLoading, refetch }`.
 * - Deduplicates concurrent requests with the same key.
 * - Stale-while-revalidate: returns cached data immediately while
 *   refetching in the background.
 * - Never silently swallows errors: always sets `error`.
 * - Optional interval polling with visibility check.
 *
 * @param key   Unique cache key (e.g. `"user-info-0xabc"`)
 * @param fetcher  Async function that returns the data
 * @param options  Optional config (enabled, refetchInterval)
 */
export function useApiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: ApiQueryOptions,
): ApiQueryResult<T> {
  const { enabled = true, refetchInterval } = options ?? {};

  const [data, setData] = useState<T | null>(() => getCached<T>(key));
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!getCached(key));

  // Keep fetcher ref stable so we don't re-trigger on every render
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    // Dedup: if the same key is already in flight, await it
    const existing = inflight.get(key);
    if (existing) {
      try {
        const result = (await existing) as T;
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!getCached(key)) {
      setIsLoading(true);
    }

    const promise = fetcherRef.current();
    inflight.set(key, promise);

    try {
      const result = await promise;
      setCached(key, result);
      setData(result);
      setError(null);
    } catch (err) {
      const wrappedError =
        err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      reportError(wrappedError, `useApiQuery(${key})`);
    } finally {
      inflight.delete(key);
      setIsLoading(false);
    }
  }, [key]);

  // Initial fetch + refetch when key/enabled changes
  useEffect(() => {
    if (!enabled) return;

    if (isStale(key)) {
      execute();
    }
  }, [key, enabled, execute]);

  // Interval polling
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        execute();
      }
    }, refetchInterval);

    return () => clearInterval(id);
  }, [enabled, refetchInterval, execute]);

  return { data, error, isLoading, refetch: execute };
}
