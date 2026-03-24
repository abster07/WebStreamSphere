// src/hooks/useEnrichedChannels.js
// Combines all data sources into one enriched list.
// Uses useDeferredValue so filter/search updates never block the UI.

import { useMemo, useDeferredValue } from 'react';
import { useChannels, useLogos, useStreams, useFeeds, useBlocklist } from '../api/queries';
import { enrichChannels, buildSearchIndex, applyFilters } from '../utils/dataUtils';
import useAppStore from '../store/useAppStore';

// ── Core enrichment hook — rebuilds only when source data changes
export function useEnrichedChannels() {
  const channels  = useChannels();
  const logos     = useLogos();
  const streams   = useStreams();
  const feeds     = useFeeds();
  const blocklist = useBlocklist();

  // Show something as soon as channels arrive, enrich progressively
  const isLoading = channels.isLoading;
  const isError   = channels.isError;
  const error     = channels.error;

  const enriched = useMemo(() => {
    if (!channels.data) return [];
    return enrichChannels({
      channels:  channels.data,
      logos:     logos.data     ?? [],
      streams:   streams.data   ?? [],
      feeds:     feeds.data     ?? [],
      blocklist: blocklist.data ?? [],
    });
  }, [channels.data, logos.data, streams.data, feeds.data, blocklist.data]);

  // Build search index lazily — deferred so it doesn't block paint
  const searchIndex = useMemo(() => buildSearchIndex(enriched), [enriched]);

  return { enriched, searchIndex, isLoading, isError, error, refetch: channels.refetch };
}

// ── Filtered + searched channels with React 18 transitions
export function useFilteredChannels() {
  const { enriched, searchIndex, isLoading, isError, error } = useEnrichedChannels();
  const filters       = useAppStore(s => s.filters);
  const searchQuery   = useAppStore(s => s.searchQuery);
  const favorites     = useAppStore(s => s.favorites);
  const recentlyWatched = useAppStore(s => s.recentlyWatched);

  // Defer the expensive filter/search so typing stays instant
  const deferredQuery   = useDeferredValue(searchQuery);
  const deferredFilters = useDeferredValue(filters);

  const filtered = useMemo(() => {
    if (!enriched.length) return [];
    if (deferredQuery && deferredQuery.length > 1) {
      return searchIndex.search(deferredQuery).map(r => r.item);
    }
    return applyFilters(enriched, deferredFilters);
  }, [enriched, searchIndex, deferredQuery, deferredFilters]);

  const favChannels = useMemo(
    () => enriched.filter(ch => favorites.includes(ch.id)),
    [enriched, favorites]
  );

  // Build an ID→channel map once for O(1) recent lookups
  const channelById = useMemo(
    () => new Map(enriched.map(ch => [ch.id, ch])),
    [enriched]
  );

  const recentChannels = useMemo(() => {
    return recentlyWatched
      .map(r => channelById.get(r.channelId) ? { ...channelById.get(r.channelId), watchedAt: r.watchedAt } : null)
      .filter(Boolean)
      .slice(0, 20);
  }, [channelById, recentlyWatched]);

  // Staleness indicator — true while deferred values catch up
  const isStale = deferredQuery !== searchQuery;

  return { filtered, favChannels, recentChannels, isLoading, isError, error, isStale };
}
