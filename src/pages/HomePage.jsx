// src/pages/HomePage.jsx
// Optimised home page — stats, recents, favorites, trending.
// Uses windowed grids and deferred data.

import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilteredChannels } from '../hooks/useEnrichedChannels';
import { useCategories, useCountries } from '../api/queries';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { SectionHeader, SkeletonBox } from '../components/ui';

const StatCard = memo(function StatCard({ num, label, icon }) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:6 }}>{icon} {label}</div>
      <div style={statNumStyle}>{num}</div>
    </div>
  );
});

function StatsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ ...statCardStyle, flex:'1 1 130px' }}>
          <SkeletonBox width="60%" height={10} style={{ marginBottom:10 }} />
          <SkeletonBox width="80%" height={24} />
        </div>
      ))}
    </>
  );
}

export default memo(function HomePage() {
  const navigate = useNavigate();
  const { filtered, favChannels, recentChannels, isLoading } = useFilteredChannels();
  const { data: categories = [] } = useCategories();
  const { data: countries  = [] } = useCountries();

  const liveCount = isLoading ? '…' : filtered.filter(c => c.hasStream).length.toLocaleString();

  return (
    <div className="page-enter">
      {/* Greeting */}
      <div style={{ marginBottom:28 }}>
        <h1 style={pageTitleStyle}>Good {getGreeting()} 👋</h1>
        <p style={pageSubtitleStyle}>
          {isLoading ? 'Loading channels…' : `${filtered.length.toLocaleString()} channels available`}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:32 }} className="stagger-1 animate-fadeUp">
        {isLoading ? <StatsSkeleton /> : (
          <>
            <StatCard num={filtered.length.toLocaleString()} label="Total Channels" icon="📺" />
            <StatCard num={liveCount}                         label="Live Streams"   icon="◉" />
            <StatCard num={countries.length || '…'}          label="Countries"      icon="🌍" />
            <StatCard num={categories.length || '…'}         label="Categories"     icon="◈" />
          </>
        )}
      </div>

      {/* Recently Watched */}
      {recentChannels.length > 0 && (
        <div style={{ marginBottom:32 }} className="stagger-2 animate-fadeUp">
          <SectionHeader label="Recently Watched" count={recentChannels.length}
            action={<button onClick={() => navigate('/recent')} style={linkBtnStyle}>View all</button>} />
          <ChannelGrid channels={recentChannels.slice(0, 6)} viewMode="grid" />
        </div>
      )}

      {/* Favorites */}
      {favChannels.length > 0 && (
        <div style={{ marginBottom:32 }} className="stagger-3 animate-fadeUp">
          <SectionHeader label="Favorites" count={favChannels.length}
            action={<button onClick={() => navigate('/favorites')} style={linkBtnStyle}>View all</button>} />
          <ChannelGrid channels={favChannels.slice(0, 6)} viewMode="grid" />
        </div>
      )}

      {/* Trending */}
      <div className="stagger-4 animate-fadeUp">
        <SectionHeader label="Trending Channels"
          action={<button onClick={() => navigate('/live')} style={linkBtnStyle}>Browse all →</button>} />
        <ChannelGrid channels={filtered.slice(0, 12)} isLoading={isLoading} viewMode="grid" />
      </div>
    </div>
  );
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const pageTitleStyle = {
  fontSize:26, fontWeight:800, fontFamily:'var(--font-display)',
  background:'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4,
};
const pageSubtitleStyle = { fontSize:13, color:'var(--text-secondary)' };
const statCardStyle = {
  flex:'1 1 130px', background:'rgba(255,255,255,0.03)',
  border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:'16px 18px',
};
const statNumStyle = {
  fontSize:22, fontWeight:800, fontFamily:'var(--font-display)',
  background:'var(--gradient-accent)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
};
const linkBtnStyle = {
  background:'none', border:'none', color:'var(--text-link)', fontSize:12, fontWeight:600, cursor:'pointer',
};
