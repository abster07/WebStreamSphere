// src/pages/LiveTVPage.jsx
import React, { useState } from 'react';
import { useFilteredChannels } from '../hooks/useEnrichedChannels';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import FilterBar from '../components/channels/FilterBar';

export default function LiveTVPage() {
  const [viewMode, setViewMode] = useState('grid');
  const { filtered, isLoading, isError, error, isStale } = useFilteredChannels();

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Live TV</h1>
        <p style={pageSubtitle}>
          {isLoading ? 'Loading channels…' : `${filtered.length.toLocaleString()} channels`}
          {isStale && <span style={{ marginLeft:8, fontSize:11, color:'var(--text-muted)' }}>Filtering…</span>}
        </p>
      </div>
      <FilterBar viewMode={viewMode} setViewMode={setViewMode} total={filtered.length} />
      {isError && <div style={{ color:'var(--accent-danger)', marginBottom:12, fontSize:13 }}>⚠️ {error?.message}</div>}
      <ChannelGrid channels={filtered} isLoading={isLoading} viewMode={viewMode} isStale={isStale} />
    </div>
  );
}

const pageTitle = { fontSize:24, fontWeight:800, fontFamily:'var(--font-display)',
  background:'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 };
const pageSubtitle = { fontSize:13, color:'var(--text-secondary)' };
