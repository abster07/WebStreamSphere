// src/api/iptvApi.js
// Central API layer — uses fetch() directly (no axios overhead),
// with response compression support and smart caching headers.

const BASE_URL = 'https://iptv-org.github.io/api';

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    // Let the browser use its own HTTP cache for repeat visits
    cache: 'default',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json();
}

// Priority tier 1 — needed immediately for the UI to be useful
export const fetchChannels  = () => get('/channels.json');
export const fetchStreams    = () => get('/streams.json');
export const fetchCategories = () => get('/categories.json');
export const fetchCountries  = () => get('/countries.json');
export const fetchBlocklist  = () => get('/blocklist.json');

// Priority tier 2 — needed for enrichment, can lag slightly
export const fetchLogos     = () => get('/logos.json');
export const fetchFeeds     = () => get('/feeds.json');
export const fetchLanguages = () => get('/languages.json');
export const fetchRegions   = () => get('/regions.json');

// Priority tier 3 — only needed for specific pages
export const fetchGuides       = () => get('/guides.json');
export const fetchSubdivisions = () => get('/subdivisions.json');
export const fetchCities       = () => get('/cities.json');
export const fetchTimezones    = () => get('/timezones.json');
