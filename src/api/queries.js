// src/api/queries.js
// React Query hooks — tiered stale times so critical data stays fresh
// while secondary data is cached aggressively.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchChannels, fetchFeeds, fetchLogos, fetchStreams,
  fetchGuides, fetchCategories, fetchLanguages, fetchCountries,
  fetchSubdivisions, fetchCities, fetchRegions, fetchTimezones,
  fetchBlocklist,
} from './iptvApi';

// Tier 1: critical — 5 min stale, 60 min gc
const T1 = { staleTime: 5 * 60_000, gcTime: 60 * 60_000, retry: 2 };
// Tier 2: enrichment — 15 min stale, 2 hr gc
const T2 = { staleTime: 15 * 60_000, gcTime: 2 * 60 * 60_000, retry: 1 };
// Tier 3: static — 60 min stale, 4 hr gc
const T3 = { staleTime: 60 * 60_000, gcTime: 4 * 60 * 60_000, retry: 1 };

const q = (key, fn, opts) => ({ queryKey: [key], queryFn: fn, ...opts });

// Tier 1 — needed for first meaningful paint
export const useChannels    = () => useQuery(q('channels',    fetchChannels,    T1));
export const useStreams      = () => useQuery(q('streams',     fetchStreams,     T1));
export const useCategories  = () => useQuery(q('categories',  fetchCategories,  T1));
export const useCountries   = () => useQuery(q('countries',   fetchCountries,   T1));
export const useBlocklist   = () => useQuery(q('blocklist',   fetchBlocklist,   T1));

// Tier 2 — enrichment, deferred
export const useLogos       = () => useQuery(q('logos',       fetchLogos,       T2));
export const useFeeds       = () => useQuery(q('feeds',       fetchFeeds,       T2));
export const useLanguages   = () => useQuery(q('languages',   fetchLanguages,   T2));
export const useRegions     = () => useQuery(q('regions',     fetchRegions,     T2));

// Tier 3 — page-specific, lazy
export const useGuides      = () => useQuery(q('guides',      fetchGuides,      T3));
export const useSubdivisions= () => useQuery(q('subdivisions',fetchSubdivisions,T3));
export const useCities      = () => useQuery(q('cities',      fetchCities,      T3));
export const useTimezones   = () => useQuery(q('timezones',   fetchTimezones,   T3));

/**
 * Prefetch hook — call once at app root to warm up critical data
 * using Promise.allSettled so one failure doesn't block others.
 */
export function usePrefetchCritical() {
  const qc = useQueryClient();
  return () => {
    const pairs = [
      ['channels',   fetchChannels],
      ['streams',    fetchStreams],
      ['categories', fetchCategories],
      ['countries',  fetchCountries],
      ['blocklist',  fetchBlocklist],
    ];
    pairs.forEach(([key, fn]) =>
      qc.prefetchQuery({ queryKey: [key], queryFn: fn, ...T1 })
    );
    // Tier 2 slightly delayed
    setTimeout(() => {
      [['logos', fetchLogos, T2], ['feeds', fetchFeeds, T2],
       ['languages', fetchLanguages, T2], ['regions', fetchRegions, T2]]
        .forEach(([key, fn, opts]) =>
          qc.prefetchQuery({ queryKey: [key], queryFn: fn, ...opts })
        );
    }, 800);
  };
}
