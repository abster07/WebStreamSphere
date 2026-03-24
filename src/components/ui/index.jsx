// src/components/ui/index.jsx
// Shared primitive components — all memoised, static styles outside render.

import React, { memo, useState, useEffect, useRef } from 'react';

export const Badge = memo(function Badge({ children, color, style }) {
  const bg     = color ? `${color}22` : 'rgba(108,99,255,0.18)';
  const border = color ? `${color}55` : 'rgba(108,99,255,0.35)';
  const text   = color || '#A89FFF';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px',
      borderRadius:5, background:bg, border:`1px solid ${border}`, color:text,
      fontSize:10, fontWeight:700, letterSpacing:'0.05em', lineHeight:1.6, ...style }}>
      {children}
    </span>
  );
});

export const LiveDot = memo(function LiveDot() {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF3B5C',
        animation:'pulse 1.4s infinite', display:'inline-block' }} />
      <span style={{ fontSize:10, fontWeight:800, color:'#FF3B5C', letterSpacing:'0.1em' }}>LIVE</span>
    </span>
  );
});

export const Spinner = memo(function Spinner({ size = 28, color = '#6C63FF' }) {
  return (
    <span style={{ display:'inline-block', width:size, height:size,
      border:`3px solid ${color}33`, borderTop:`3px solid ${color}`,
      borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
  );
});

export const SkeletonBox = memo(function SkeletonBox({ width = '100%', height = 16, radius = 8, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius:radius, ...style }} />;
});

export const IconButton = memo(function IconButton({ children, onClick, title, active, style }) {
  return (
    <button onClick={onClick} title={title} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      gap:6, padding:'7px 10px', borderRadius:8,
      background: active ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.05)',
      border:`1px solid ${active ? 'rgba(108,99,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
      color: active ? '#A89FFF' : '#888', fontSize:14, transition:'all 0.2s', ...style }}>
      {children}
    </button>
  );
});

export const Toggle = memo(function Toggle({ on, onChange }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{
      width:42, height:24, borderRadius:12,
      background: on ? 'linear-gradient(90deg,#6C63FF,#00C6FF)' : 'rgba(255,255,255,0.08)',
      border:'none', position:'relative', transition:'background 0.25s', flexShrink:0,
      boxShadow: on ? '0 0 10px rgba(108,99,255,0.4)' : 'none', cursor:'pointer' }}>
      <span style={{
        position:'absolute', top:4, width:16, height:16, borderRadius:'50%', background:'#fff',
        left: on ? 22 : 4, transition:'left 0.2s var(--ease-spring)',
        boxShadow:'0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
});

// ── Lazy image with Intersection Observer — loads only when visible
export const ChannelLogo = memo(function ChannelLogo({ src, name, size = 48 }) {
  const [err, setErr]       = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const initials = (name || '?').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!src || err) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [src, err]);

  if (!src || err) {
    return (
      <div style={{ ...fallbackStyle, width:size, height:size, fontSize:size*0.35 }}>
        {initials}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ width:size, height:size, flexShrink:0, borderRadius:8, overflow:'hidden',
      background:'rgba(255,255,255,0.04)' }}>
      {visible && (
        <img src={src} alt={name} loading="lazy" decoding="async"
          onError={() => setErr(true)}
          onLoad={() => setLoaded(true)}
          style={{ width:'100%', height:'100%', objectFit:'contain',
            opacity: loaded ? 1 : 0, transition:'opacity 0.25s' }} />
      )}
    </div>
  );
});

export const EmptyState = memo(function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'64px 24px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{title}</div>
      {subtitle && <div style={{ fontSize:13, color:'var(--text-secondary)', maxWidth:300 }}>{subtitle}</div>}
      {action && <div style={{ marginTop:20 }}>{action}</div>}
    </div>
  );
});

export const ErrorBanner = memo(function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
      background:'rgba(255,59,92,0.1)', border:'1px solid rgba(255,59,92,0.25)',
      borderRadius:10, margin:'12px 0' }}>
      <span style={{ fontSize:18 }}>⚠️</span>
      <span style={{ fontSize:13, color:'#FF3B5C', flex:1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ padding:'5px 12px', borderRadius:7,
          background:'rgba(255,59,92,0.15)', border:'1px solid rgba(255,59,92,0.3)',
          color:'#FF3B5C', fontSize:12, fontWeight:600, cursor:'pointer' }}>Retry</button>
      )}
    </div>
  );
});

export const SectionHeader = memo(function SectionHeader({ label, count, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em',
          color:'var(--text-muted)', textTransform:'uppercase' }}>{label}</span>
        {count != null && <Badge>{count}</Badge>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
});

export function Modal({ children, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center',
      animation:'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} className="animate-scaleIn" style={{
        background:'var(--bg-surface)', border:'1px solid var(--border-moderate)',
        borderRadius:'var(--radius-lg)', padding:28, minWidth:320, maxWidth:440,
        boxShadow:'var(--shadow-lg), var(--shadow-glow)', position:'relative' }}>
        {children}
      </div>
    </div>
  );
}

const fallbackStyle = {
  borderRadius:8, background:'linear-gradient(135deg,#1a1a2e,#16213e)',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontWeight:800, color:'#6C63FF', fontFamily:'var(--font-display)',
  border:'1px solid rgba(108,99,255,0.2)', flexShrink:0,
};
