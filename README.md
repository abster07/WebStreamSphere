# 📺 StreamSphere

A **production-grade IPTV web application** built with React 18, powered by the [iptv-org public API](https://iptv-org.github.io/api). Features a cinematic dark UI, HLS video playback, EPG guide, favorites, and more.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Build for production
npm run build
```

---

## 📁 Project Structure

```
src/
├── api/
│   ├── iptvApi.js        # Axios client + all 13 endpoint functions
│   └── queries.js        # React Query hooks for every endpoint
│
├── components/
│   ├── channels/
│   │   ├── ChannelCard.jsx   # Grid card + list row variants
│   │   ├── ChannelGrid.jsx   # Grid/list container with skeleton loading
│   │   └── FilterBar.jsx     # Category chips, country/language/quality dropdowns
│   │
│   ├── epg/
│   │   └── EPGGrid.jsx       # Horizontal timeline EPG with program blocks
│   │
│   ├── player/
│   │   ├── Player.jsx        # HLS player wrapper (mini + fullscreen)
│   │   ├── PlayerControls.jsx # Glassmorphism controls overlay
│   │   └── CastModal.jsx     # Chromecast device selection modal
│   │
│   ├── settings/
│   │   └── SettingsPanel.jsx # Settings with toggles and dropdowns
│   │
│   ├── sidebar/
│   │   └── Sidebar.jsx       # Collapsible navigation sidebar
│   │
│   └── ui/
│       ├── index.jsx         # Badge, Spinner, Toggle, ChannelLogo, Modal, etc.
│       └── TopBar.jsx        # Search bar + top navigation
│
├── hooks/
│   ├── useDebouncedCallback.js   # Debounced callback hook
│   ├── useEnrichedChannels.js    # Merges channels+logos+streams+feeds+blocklist
│   └── useHlsPlayer.js           # HLS.js lifecycle + playback state
│
├── pages/
│   ├── HomePage.jsx     # Dashboard with stats, recent, favorites, trending
│   └── index.jsx        # All other pages: LiveTV, EPG, Search, Favorites,
│                        #   Recent, Categories, Countries, Regions, Settings
│
├── store/
│   └── useAppStore.js   # Zustand store (player, favorites, recent, prefs)
│
├── styles/
│   ├── tokens.css       # CSS custom properties (design tokens)
│   ├── global.css       # Reset, keyframes, utility classes
│   └── components.css   # Hover states, component-level CSS
│
└── utils/
    └── dataUtils.js     # enrichChannels, buildSearchIndex, applyFilters, etc.
```

---

## 🌐 API Endpoints Used

| Endpoint | URL | Usage |
|---|---|---|
| Channels | `/channels.json` | Core channel data (13k+ channels) |
| Streams  | `/streams.json`  | HLS stream URLs + quality |
| Logos    | `/logos.json`    | Channel logo images |
| Feeds    | `/feeds.json`    | Regional feed variants |
| Guides   | `/guides.json`   | EPG metadata |
| Categories | `/categories.json` | Category list |
| Languages | `/languages.json` | ISO 639-3 language list |
| Countries | `/countries.json` | Countries with flags |
| Subdivisions | `/subdivisions.json` | States/provinces |
| Cities   | `/cities.json`   | City data |
| Regions  | `/regions.json`  | World regions |
| Timezones | `/timezones.json` | Timezone data |
| Blocklist | `/blocklist.json` | DMCA/NSFW blocked channels |

---

## 🧱 Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| React Router | 6 | Client-side routing |
| Zustand | 4 | Global state (with persistence) |
| TanStack Query | 5 | API data fetching + caching |
| HLS.js | 1.5 | HLS video playback |
| Axios | 1.6 | HTTP client |
| Fuse.js | 7 | Fuzzy search |
| react-hot-toast | 2 | Toast notifications |
| date-fns | 3 | Date formatting |

---

## ✨ Features

- **Real data** from iptv-org (13,000+ channels, 100+ countries)
- **HLS playback** via HLS.js with adaptive quality
- **Floating mini player** + fullscreen mode
- **EPG Guide** with horizontal timeline
- **Fuzzy search** across channel names, alt names, categories
- **Filter** by category, country, language, quality
- **Favorites** persisted to localStorage
- **Watch history** with recently watched
- **Blocklist** filtering (NSFW + DMCA)
- **Cast modal** (Chromecast UI)
- **Collapsible sidebar**
- **Skeleton loading** states
- **Error handling** with retry
- **CSS design tokens** for consistent theming
- **Zustand persistence** for user preferences

---

## 📝 Notes

- Stream URLs from iptv-org may go offline; the player shows a friendly retry UI.
- NSFW channels are filtered by default (toggle in Settings).
- EPG programs are generated locally since real EPG XML requires a separate scraper.

---

## 🏗️ Building for Production

```bash
npm run build
# Output: build/
# Deploy to: Netlify, Vercel, GitHub Pages, or any static host
```

### Environment

No `.env` required — all data comes from the public iptv-org CDN.
