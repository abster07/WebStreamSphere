// src/store/useAppStore.js
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

const useAppStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ── Player
        activeChannel:  null,
        activeStream:   null,
        isFullscreen:   false,
        setActiveChannel: (channel, stream = null) =>
          set({ activeChannel: channel, activeStream: stream }),
        clearPlayer: () => set({ activeChannel: null, activeStream: null, isFullscreen: false }),
        setFullscreen: (v) => set({ isFullscreen: v }),

        // ── Favorites
        favorites: [],
        toggleFavorite: (id) => {
          const favs = get().favorites;
          set({ favorites: favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id] });
        },

        // ── Recently Watched
        recentlyWatched: [],
        addRecentlyWatched: (channelId, streamId) => {
          const entry = { channelId, streamId, watchedAt: Date.now() };
          set({ recentlyWatched: [entry, ...get().recentlyWatched.filter(r => r.channelId !== channelId).slice(0, 49)] });
        },

        // ── UI
        sidebarCollapsed:    false,
        setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
        viewMode:            'grid',
        setViewMode:         (v) => set({ viewMode: v }),
        darkMode:            true,
        toggleDarkMode:      () => set(s => ({ darkMode: !s.darkMode })),

        // ── Settings
        settings: {
          autoplay: true, preferHD: true, defaultQuality: 'Auto',
          showNSFW: false, uiLanguage: 'en', audioBoost: 100,
        },
        updateSetting: (key, value) => set(s => ({ settings: { ...s.settings, [key]: value } })),

        // ── Search & Filters
        searchQuery: '',
        setSearchQuery: (q) => set({ searchQuery: q }),
        filters: { category: 'all', country: '', language: '', quality: '' },
        setFilter:    (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
        resetFilters: () => set({ filters: { category: 'all', country: '', language: '', quality: '' } }),

        // ── Cast
        castDevice:    null,
        setCastDevice: (d) => set({ castDevice: d }),
      }),
      {
        name: 'streamsphere-v2',
        partialize: (s) => ({
          favorites: s.favorites, recentlyWatched: s.recentlyWatched,
          sidebarCollapsed: s.sidebarCollapsed, viewMode: s.viewMode,
          darkMode: s.darkMode, settings: s.settings,
        }),
      }
    )
  )
);

export default useAppStore;
