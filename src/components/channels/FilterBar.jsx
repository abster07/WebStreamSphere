// src/components/channels/FilterBar.jsx
// Memoised — only re-renders when filters or data changes.

import React, { memo } from 'react';
import useAppStore from '../../store/useAppStore';
import { useCategories, useCountries, useLanguages } from '../../api/queries';

const QUALITY_OPTIONS = ['', '4K', '1080p', '720p', '480p'];

// Selectors — prevent re-renders from unrelated store changes
const selectFilters      = s => s.filters;
const selectSetFilter    = s => s.setFilter;
const selectResetFilters = s => s.resetFilters;

const FilterBar = memo(function FilterBar({ viewMode, setViewMode, total }) {
  const filters      = useAppStore(selectFilters);
  const setFilter    = useAppStore(selectSetFilter);
  const resetFilters = useAppStore(selectResetFilters);

  const { data: categories = [] } = useCategories();
  const { data: countries  = [] } = useCountries();
  const { data: languages  = [] } = useLanguages();

  const hasActive = (filters.category && filters.category !== 'all') ||
    filters.country || filters.language || filters.quality;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Category chips — horizontal scroll on mobile */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:12,
        scrollbarWidth:'none', msOverflowStyle:'none' }}>
        <button style={chip(filters.category === 'all' || !filters.category)}
          onClick={() => setFilter('category', 'all')}>All</button>
        {categories.slice(0, 14).map(cat => (
          <button key={cat.id} style={chip(filters.category === cat.id)}
            onClick={() => setFilter('category', cat.id)}>{cat.name}</button>
        ))}
      </div>

      {/* Dropdowns + view toggle */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <select value={filters.country} onChange={e => setFilter('country', e.target.value)} style={sel}>
          <option value="">🌍 All Countries</option>
          {countries.slice(0,100).map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
        </select>

        <select value={filters.language} onChange={e => setFilter('language', e.target.value)} style={sel}>
          <option value="">🗣 All Languages</option>
          {languages.slice(0,80).map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>

        <select value={filters.quality} onChange={e => setFilter('quality', e.target.value)} style={sel}>
          <option value="">📺 All Quality</option>
          {QUALITY_OPTIONS.filter(Boolean).map(q => <option key={q} value={q}>{q}</option>)}
        </select>

        {hasActive && (
          <button onClick={resetFilters} style={{ padding:'6px 12px', borderRadius:8,
            background:'rgba(255,59,92,0.12)', border:'1px solid rgba(255,59,92,0.25)',
            color:'#FF3B5C', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            ✕ Reset
          </button>
        )}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {total != null && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{total.toLocaleString()} channels</span>}
          <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)',
            border:'1px solid var(--border-subtle)', borderRadius:9, padding:3 }}>
            <button onClick={() => setViewMode('grid')} style={viewBtn(viewMode === 'grid')}>⊞</button>
            <button onClick={() => setViewMode('list')} style={viewBtn(viewMode === 'list')}>≡</button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FilterBar;

const chip = active => ({
  padding:'5px 14px', borderRadius:20, whiteSpace:'nowrap',
  background: active ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.04)',
  border:`1px solid ${active ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
  color: active ? 'var(--text-link)' : 'var(--text-secondary)',
  fontSize:12, fontWeight: active ? 600 : 400, cursor:'pointer', transition:'all 0.2s',
  flexShrink: 0,
});
const sel = {
  padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)',
  border:'1px solid var(--border-moderate)', color:'var(--text-primary)',
  fontSize:12, cursor:'pointer', outline:'none',
};
const viewBtn = active => ({
  padding:'5px 12px', borderRadius:6,
  background: active ? 'rgba(108,99,255,0.3)' : 'transparent',
  border: active ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
  color: active ? 'var(--text-link)' : 'var(--text-secondary)',
  cursor:'pointer', fontSize:13, transition:'all 0.2s',
});
