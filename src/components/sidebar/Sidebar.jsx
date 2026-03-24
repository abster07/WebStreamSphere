// src/components/sidebar/Sidebar.jsx — memoised, CSS transitions, no JS layout thrash

import React, { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

const NAV = [
  { path:'/',           icon:'⊞', label:'Home' },
  { path:'/live',       icon:'◉', label:'Live TV' },
  { path:'/epg',        icon:'≡', label:'EPG Guide' },
  { path:'/categories', icon:'◈', label:'Categories' },
  { path:'/countries',  icon:'⊕', label:'Countries' },
  { path:'/regions',    icon:'🗺', label:'Regions' },
  { path:'/favorites',  icon:'♥', label:'Favorites' },
  { path:'/recent',     icon:'◷', label:'Recent' },
  { path:'/settings',   icon:'⚙', label:'Settings' },
];

const Sidebar = memo(function Sidebar() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const collapsed = useAppStore(s => s.sidebarCollapsed);
  const setCollapsed = useAppStore(s => s.setSidebarCollapsed);

  return (
    <nav style={{
      width: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
      minWidth: collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
      height:'100%', flexShrink:0,
      background:'var(--bg-overlay)', backdropFilter:'blur(24px)',
      borderRight:'1px solid var(--border-subtle)',
      display:'flex', flexDirection:'column',
      transition:'width 0.28s var(--ease-out), min-width 0.28s var(--ease-out)',
      overflow:'hidden', zIndex:10,
      // GPU-accelerated — avoids layout recalc
      willChange:'width',
    }}>
      {/* Logo */}
      <div onClick={() => setCollapsed(!collapsed)} style={{
        padding: collapsed ? '18px 0' : '18px 20px',
        display:'flex', alignItems:'center', gap:10,
        borderBottom:'1px solid var(--border-subtle)',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor:'pointer', flexShrink:0,
      }}>
        <div style={logoMark}>📺</div>
        {!collapsed && <span style={logoText}>StreamSphere</span>}
      </div>

      {/* Nav */}
      <div style={{ flex:1, paddingTop:10, overflowY:'auto', overflowX:'hidden' }}>
        {NAV.map(item => {
          const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={navItem(active, collapsed)}>
              <span style={navIcon}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {!collapsed && (
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border-subtle)',
          fontSize:10, color:'var(--text-muted)', lineHeight:1.6, flexShrink:0 }}>
          <div style={{ fontWeight:600 }}>StreamSphere v2.4.1</div>
          <div>Powered by iptv-org</div>
        </div>
      )}
    </nav>
  );
});

export default Sidebar;

const logoMark = {
  width:32, height:32, borderRadius:9,
  background:'linear-gradient(135deg,#6C63FF,#00C6FF)',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontSize:16, flexShrink:0, boxShadow:'0 0 18px rgba(108,99,255,0.45)',
};
const logoText = {
  fontSize:15, fontWeight:800, fontFamily:'var(--font-display)',
  background:'linear-gradient(135deg,#fff,#aaa)',
  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', whiteSpace:'nowrap',
};
const navItem = (active, collapsed) => ({
  display:'flex', alignItems:'center', gap:12, width:'100%',
  padding: collapsed ? '11px 0' : '11px 20px',
  justifyContent: collapsed ? 'center' : 'flex-start',
  borderRadius: collapsed ? 0 : '0 12px 12px 0',
  marginRight: collapsed ? 0 : 8,
  background: active ? 'rgba(108,99,255,0.14)' : 'transparent',
  borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
  color: active ? 'var(--text-link)' : 'var(--text-secondary)',
  fontSize:13, fontWeight: active ? 600 : 400,
  transition:'all 0.18s', cursor:'pointer',
});
const navIcon = { fontSize:16, width:20, textAlign:'center', flexShrink:0 };
