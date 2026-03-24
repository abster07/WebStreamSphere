// src/components/ui/TopBar.jsx
// Memoised — only re-renders when sidebar state or search changes.

import React, { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

// Inline debounce — no extra dep
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const TopBar = memo(function TopBar() {
  const navigate          = useNavigate();
  const sidebarCollapsed  = useAppStore(s => s.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore(s => s.setSidebarCollapsed);
  const setSearchQuery    = useAppStore(s => s.setSearchQuery);
  const searchQuery       = useAppStore(s => s.searchQuery);

  const [local, setLocal] = useState(searchQuery);
  const [focused, setFocused] = useState(false);
  const [time, setTime]   = useState(() => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }));

  // Update clock every minute
  React.useEffect(() => {
    const iv = setInterval(() =>
      setTime(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })), 60_000);
    return () => clearInterval(iv);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSet = useCallback(debounce((val) => {
    setSearchQuery(val);
    if (val) navigate('/search');
  }, 280), [setSearchQuery, navigate]);

  const handleChange = useCallback((e) => {
    setLocal(e.target.value);
    debouncedSet(e.target.value);
  }, [debouncedSet]);

  const clearSearch = useCallback(() => {
    setLocal(''); setSearchQuery(''); navigate('/');
  }, [setSearchQuery, navigate]);

  return (
    <header style={headerStyle}>
      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={collapseBtn}>
        {sidebarCollapsed ? '→' : '←'}
      </button>

      <div style={{ flex:1, maxWidth:480, position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
          color: focused ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize:14, transition:'color 0.2s' }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search channels, countries, categories…"
          value={local}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', padding:'9px 36px 9px 36px',
            background:'rgba(255,255,255,0.04)',
            border:`1px solid ${focused ? 'rgba(108,99,255,0.5)' : 'var(--border-moderate)'}`,
            borderRadius:10, color:'var(--text-primary)', fontSize:13, outline:'none',
            boxShadow: focused ? '0 0 0 3px rgba(108,99,255,0.12)' : 'none',
            transition:'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        {local && (
          <button onClick={clearSearch} style={{ position:'absolute', right:10, top:'50%',
            transform:'translateY(-50%)', background:'none', border:'none',
            color:'var(--text-muted)', fontSize:16, cursor:'pointer' }}>×</button>
        )}
      </div>

      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{time}</span>
        <button style={iconBtnStyle}>🔔</button>
        <div style={avatarStyle}>A</div>
      </div>
    </header>
  );
});

export default TopBar;

const headerStyle = {
  height:'var(--topbar-h)', background:'var(--bg-overlay)', backdropFilter:'blur(24px)',
  borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center',
  padding:'0 20px', gap:14, zIndex:20, flexShrink:0,
};
const collapseBtn = {
  padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)',
  border:'1px solid var(--border-moderate)', color:'var(--text-secondary)',
  fontSize:15, transition:'all 0.2s', flexShrink:0, cursor:'pointer',
};
const iconBtnStyle = {
  padding:'7px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)',
  border:'1px solid var(--border-moderate)', color:'var(--text-secondary)', fontSize:14, cursor:'pointer',
};
const avatarStyle = {
  width:34, height:34, borderRadius:'50%', background:'var(--gradient-accent)',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 0 14px rgba(108,99,255,0.4)',
};
