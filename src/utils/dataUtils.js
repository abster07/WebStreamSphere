// src/utils/dataUtils.js
// All heavy data processing — kept pure so results can be memoized at call site.

import Fuse from 'fuse.js';

/**
 * Merge channels + logos + streams + feeds into enriched objects.
 * Uses Maps instead of plain objects for O(1) lookups.
 */
export function enrichChannels({ channels = [], logos = [], streams = [], feeds = [], blocklist = [] }) {
  const blockedIds = new Set(blocklist.map(b => b.channel));

  // First logo wins per channel
  const logoMap = new Map();
  for (const l of logos) {
    if (l.url && !logoMap.has(l.channel)) logoMap.set(l.channel, l.url);
  }

  // First stream wins per channel
  const streamMap = new Map();
  for (const s of streams) {
    if (s.channel && !streamMap.has(s.channel)) streamMap.set(s.channel, s);
  }

  // Collect all feeds per channel
  const feedMap = new Map();
  for (const f of feeds) {
    const arr = feedMap.get(f.channel);
    if (arr) arr.push(f);
    else feedMap.set(f.channel, [f]);
  }

  const result = [];
  for (const ch of channels) {
    if (blockedIds.has(ch.id) || ch.is_nsfw) continue;
    const stream = streamMap.get(ch.id) ?? null;
    result.push({
      ...ch,
      logo: logoMap.get(ch.id) ?? null,
      stream,
      feeds: feedMap.get(ch.id) ?? [],
      hasStream: stream !== null,
    });
  }
  return result;
}

/**
 * Build a Fuse.js search index.
 * minMatchCharLength avoids thrashing on single-char input.
 */
export function buildSearchIndex(channels) {
  return new Fuse(channels, {
    keys: [
      { name: 'name',      weight: 0.55 },
      { name: 'alt_names', weight: 0.20 },
      { name: 'network',   weight: 0.10 },
      { name: 'country',   weight: 0.10 },
      { name: 'categories',weight: 0.05 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    useExtendedSearch: false,
  });
}

/**
 * Filter channels by active filter state.
 * Early-exits per-channel as soon as any predicate fails.
 */
export function applyFilters(channels, filters) {
  const catFilter  = filters.category && filters.category !== 'all' ? filters.category : null;
  const ctryFilter = filters.country  ? filters.country.toLowerCase()  : null;
  const langFilter = filters.language ? filters.language : null;
  const qualFilter = filters.quality  ? filters.quality  : null;

  // If nothing active, skip the loop entirely
  if (!catFilter && !ctryFilter && !langFilter && !qualFilter) return channels;

  return channels.filter(ch => {
    if (catFilter  && !ch.categories?.includes(catFilter))             return false;
    if (ctryFilter && ch.country?.toLowerCase() !== ctryFilter)        return false;
    if (qualFilter && ch.stream?.quality !== qualFilter)               return false;
    if (langFilter) {
      const langs = ch.feeds?.flatMap(f => f.languages) ?? [];
      if (!langs.includes(langFilter)) return false;
    }
    return true;
  });
}

export function qualityBadgeColor(q) {
  if (!q) return '#444';
  if (q === '4K')   return '#FFB800';
  if (q === '1080p') return '#00C6FF';
  if (q === '720p')  return '#6C63FF';
  return '#555';
}

export const CATEGORY_ICONS = {
  news: '📡', sports: '⚽', movies: '🎬', entertainment: '🎭',
  kids: '🏰', music: '🎵', documentary: '🌿', general: '📺',
  cooking: '🍳', travel: '✈️', science: '🔬', business: '💼',
  auto: '🚗', weather: '🌤️', religious: '🙏', shop: '🛒',
};
export const categoryIcon = id => CATEGORY_ICONS[id] ?? '📺';
export const QUALITY_ORDER = ['4K', '1080p', '720p', '480p', '360p', '240p'];
export function formatDate(str) {
  if (!str) return null;
  try { return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return str; }
}
export function groupByCountry(channels) {
  return channels.reduce((acc, ch) => {
    const k = ch.country || 'XX'; (acc[k] ??= []).push(ch); return acc;
  }, {});
}
export function groupByCategory(channels) {
  return channels.reduce((acc, ch) => {
    for (const cat of (ch.categories ?? ['general'])) (acc[cat] ??= []).push(ch);
    return acc;
  }, {});
}
