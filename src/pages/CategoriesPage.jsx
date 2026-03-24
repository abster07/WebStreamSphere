// src/pages/CategoriesPage.jsx
import React, { useState } from 'react';
import { useCategories } from '../api/queries';
import { useFilteredChannels } from '../hooks/useEnrichedChannels';
import { ChannelGrid } from '../components/channels/ChannelGrid';
import { categoryIcon } from '../utils/dataUtils';
import { SkeletonBox } from '../components/ui';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { filtered } = useFilteredChannels();
  const [selected, setSelected] = useState(null);

  const catChannels = selected
    ? filtered.filter(ch => ch.categories?.includes(selected))
    : [];

  if (selected) {
    const cat = categories.find(c => c.id === selected);
    return (
      <div className="page-enter">
        <button onClick={() => setSelected(null)} style={backBtn}>
          ← Back to Categories
        </button>
        <h1 style={pageTitle}>{categoryIcon(selected)} {cat?.name || selected}</h1>
        {cat?.description && <p style={{ ...pageSubtitle, marginBottom: 20 }}>{cat.description}</p>}
        <ChannelGrid channels={catChannels} viewMode="grid" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>Categories</h1>
        <p style={pageSubtitle}>Browse channels by genre</p>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))',
        gap: 12,
      }}>
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <SkeletonBox key={i} height={110} radius={12} />
            ))
          : categories.map(cat => {
              const count = filtered.filter(ch => ch.categories?.includes(cat.id)).length;
              return (
                <div key={cat.id} onClick={() => setSelected(cat.id)} style={catCard}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>{categoryIcon(cat.id)}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {count.toLocaleString()} channels
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

const pageTitle = {
  fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)',
  background: 'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4,
};
const pageSubtitle = { fontSize: 13, color: 'var(--text-secondary)' };
const catCard = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)', padding: '18px 16px',
  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
};
const backBtn = {
  background: 'none', border: 'none', color: 'var(--text-link)',
  fontSize: 13, cursor: 'pointer', marginBottom: 16,
  display: 'flex', alignItems: 'center', gap: 6,
};
