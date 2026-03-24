// src/pages/SearchPage.jsx
import React from 'react';
import { useFilteredChannels } from '../hooks/useEnrichedChannels';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import useAppStore from '../store/useAppStore';

export default function SearchPage() {
  const { filtered, isLoading, isStale } = useFilteredChannels();
  const searchQuery = useAppStore(s => s.searchQuery);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Search Results</h1>
        <p style={pageSubtitle}>
          {searchQuery
            ? `${filtered.length.toLocaleString()} results for "${searchQuery}"`
            : 'Start typing in the search bar above'}
        </p>
      </div>
      <ChannelGrid channels={filtered} isLoading={isLoading} viewMode="grid" isStale={isStale} />
    </div>
  );
}

const pageTitle = { fontSize:24, fontWeight:800, fontFamily:'var(--font-display)',
  background:'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 };
const pageSubtitle = { fontSize:13, color:'var(--text-secondary)' };
