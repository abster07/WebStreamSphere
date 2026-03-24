// src/pages/FavoritesPage.jsx
import React from 'react';
import { useFilteredChannels } from '../hooks/useEnrichedChannels';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { EmptyState } from '../components/ui';

export function FavoritesPage() {
  const { favChannels, isLoading } = useFilteredChannels();
  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Favorites</h1>
        <p style={pageSubtitle}>{favChannels.length} saved channels</p>
      </div>
      {!isLoading && favChannels.length === 0 ? (
        <EmptyState
          icon="♡"
          title="No favorites yet"
          subtitle="Click the heart icon on any channel card to save it here."
        />
      ) : (
        <ChannelGrid channels={favChannels} isLoading={isLoading} viewMode="grid" />
      )}
    </div>
  );
}

// src/pages/RecentPage.jsx
export function RecentPage() {
  const { recentChannels } = useFilteredChannels();
  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Recently Watched</h1>
        <p style={pageSubtitle}>{recentChannels.length} channels in history</p>
      </div>
      {recentChannels.length === 0 ? (
        <EmptyState icon="◷" title="No watch history" subtitle="Channels you watch will appear here." />
      ) : (
        <ChannelGrid channels={recentChannels} viewMode="list" />
      )}
    </div>
  );
}

const pageTitle = {
  fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)',
  background: 'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4,
};
const pageSubtitle = { fontSize: 13, color: 'var(--text-secondary)' };
