// src/pages/CountriesPage.jsx
import React, { useState } from 'react';
import { useCountries, useRegions } from '../api/queries';
import { useFilteredChannels } from '../hooks/useEnrichedChannels';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { SkeletonBox } from '../components/ui';
import SettingsPanel from '../components/settings/SettingsPanel';

// ── Countries Page
export function CountriesPage() {
  const { data: countries = [], isLoading } = useCountries();
  const { filtered } = useFilteredChannels();
  const [selected, setSelected] = useState(null);

  const countryChannels = selected ? filtered.filter(ch => ch.country === selected) : [];
  const country = countries.find(c => c.code === selected);

  if (selected) {
    return (
      <div className="page-enter">
        <button onClick={() => setSelected(null)} style={backBtn}>← Back to Countries</button>
        <h1 style={pageTitle}>{country?.flag} {country?.name}</h1>
        <p style={{ ...pageSubtitle, marginBottom: 20 }}>{countryChannels.length.toLocaleString()} channels</p>
        <ChannelGrid channels={countryChannels} viewMode="grid" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Countries</h1>
        <p style={pageSubtitle}>Browse channels by country</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
        {isLoading
          ? Array.from({ length: 24 }).map((_, i) => <SkeletonBox key={i} height={72} radius={10} />)
          : countries.map(c => {
              const count = filtered.filter(ch => ch.country === c.code).length;
              if (count === 0) return null;
              return (
                <div key={c.code} onClick={() => setSelected(c.code)} style={countryCard}>
                  <span style={{ fontSize: 24 }}>{c.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{count.toLocaleString()} channels</div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ── Regions Page
export function RegionsPage() {
  const { data: regions = [], isLoading } = useRegions();
  const { filtered } = useFilteredChannels();
  const [selected, setSelected] = useState(null);

  const regionChannels = selected ? filtered.filter(ch => selected.countries?.includes(ch.country)) : [];

  if (selected) {
    return (
      <div className="page-enter">
        <button onClick={() => setSelected(null)} style={backBtn}>← Back to Regions</button>
        <h1 style={pageTitle}>{selected.name}</h1>
        <p style={{ ...pageSubtitle, marginBottom: 20 }}>
          {selected.countries.length} countries · {regionChannels.length.toLocaleString()} channels
        </p>
        <ChannelGrid channels={regionChannels} viewMode="grid" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Regions</h1>
        <p style={pageSubtitle}>Browse channels by world region</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} height={100} radius={12} />)
          : regions.map(region => {
              const count = filtered.filter(ch => region.countries?.includes(ch.country)).length;
              return (
                <div key={region.code} onClick={() => setSelected(region)} style={regionCard}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{region.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{region.countries.length} countries</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {region.countries.slice(0, 6).map(code => (
                      <span key={code} style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                      }}>{code}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>{count.toLocaleString()} channels</div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ── Settings Page
export function SettingsPage() {
  return (
    <div className="page-enter">
      <div style={{ marginBottom: 24 }}>
        <h1 style={pageTitle}>Settings</h1>
        <p style={pageSubtitle}>Customize your StreamSphere experience</p>
      </div>
      <SettingsPanel />
    </div>
  );
}

const pageTitle = {
  fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)',
  background: 'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4,
};
const pageSubtitle = { fontSize: 13, color: 'var(--text-secondary)' };
const backBtn = { background: 'none', border: 'none', color: 'var(--text-link)', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 };
const countryCard = { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s' };
const regionCard = { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' };
