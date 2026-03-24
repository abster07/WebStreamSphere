// src/components/player/PlayerControls.jsx
// Cinematic glassmorphism controls — fullscreen mode gets a full redesign

import React, { useState, useCallback, useRef } from 'react';
import { LiveDot } from '../ui';

const SPEEDS = ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x'];

function fmt(s) {
  if (!s || isNaN(s)) return 'LIVE';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(Math.floor(s % 60)).padStart(2,'0');
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${ss}` : `${m}:${ss}`;
}

function GlassBtn({ children, onClick, title, active, danger, large, style }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: active ? 'rgba(108,99,255,0.3)' : danger ? 'rgba(255,59,92,0.15)' : 'rgba(255,255,255,0.08)',
      backdropFilter:'blur(8px)',
      border:`1px solid ${active ? 'rgba(108,99,255,0.5)' : danger ? 'rgba(255,59,92,0.3)' : 'rgba(255,255,255,0.14)'}`,
      borderRadius: large ? 12 : 8,
      padding: large ? '8px 16px' : '5px 10px',
      color: active ? '#A89FFF' : danger ? '#FF3B5C' : '#ddd',
      fontSize: large ? 13 : 12,
      fontWeight: large ? 700 : 400,
      cursor:'pointer', display:'flex', alignItems:'center', gap:5,
      transition:'all 0.15s', whiteSpace:'nowrap',
      ...style,
    }}>{children}</button>
  );
}

function DropMenu({ options, value, onChange, onClose }) {
  return (
    <div style={{
      position:'absolute', bottom:'calc(100% + 8px)', right:0,
      background:'rgba(10,10,20,0.97)', backdropFilter:'blur(20px)',
      border:'1px solid rgba(255,255,255,0.1)',
      borderRadius:12, padding:6, minWidth:160,
      boxShadow:'0 -24px 48px rgba(0,0,0,0.8)',
      zIndex:20, animation:'fadeUp 0.15s ease',
    }}>
      {options.map(opt => (
        <div key={opt} onClick={() => { onChange(opt); onClose(); }} style={{
          padding:'8px 14px', borderRadius:8, cursor:'pointer',
          background: opt === value ? 'rgba(108,99,255,0.22)' : 'transparent',
          color: opt === value ? '#A89FFF' : '#ccc',
          fontSize:12, fontWeight: opt === value ? 700 : 400,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          transition:'background 0.12s',
        }}>
          {opt} {opt === value && <span style={{ color:'var(--accent-primary)' }}>✓</span>}
        </div>
      ))}
    </div>
  );
}

// ── Cinematic seek bar with hover scrubbing
function SeekBar({ currentTime, duration, onSeek }) {
  const barRef = useRef(null);
  const [hoverPct, setHoverPct] = useState(null);
  const [dragging, setDragging] = useState(false);
  const pct = duration ? (currentTime / duration) * 100 : 0;

  const calcPct = useCallback((e) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  }, []);

  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    const p = calcPct(e);
    onSeek((p / 100) * duration);
  }, [calcPct, duration, onSeek]);

  return (
    <div style={{ marginBottom:10, padding:'6px 0', cursor:'pointer' }}
      ref={barRef}
      onClick={handleSeek}
      onMouseMove={e => setHoverPct(calcPct(e))}
      onMouseLeave={() => setHoverPct(null)}
    >
      {/* Track */}
      <div style={{ height: hoverPct != null ? 6 : 3, background:'rgba(255,255,255,0.18)',
        borderRadius:3, position:'relative', transition:'height 0.15s', overflow:'visible' }}>
        {/* Buffer bg */}
        <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.08)', borderRadius:3 }} />
        {/* Played */}
        <div style={{ width:`${pct}%`, height:'100%', background:'var(--gradient-accent)',
          borderRadius:3, position:'relative', transition: dragging ? 'none' : 'width 0.25s linear' }}>
          {/* Thumb */}
          <div style={{
            position:'absolute', right:-6, top:'50%', transform:'translateY(-50%)',
            width:12, height:12, borderRadius:'50%', background:'#fff',
            boxShadow:'0 0 10px rgba(108,99,255,0.9)',
            opacity: hoverPct != null ? 1 : 0, transition:'opacity 0.15s',
          }} />
        </div>
        {/* Hover preview */}
        {hoverPct != null && duration > 0 && (
          <div style={{
            position:'absolute', bottom:'calc(100% + 10px)',
            left:`${hoverPct}%`, transform:'translateX(-50%)',
            background:'rgba(10,10,20,0.95)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:6, padding:'3px 8px', fontSize:10,
            color:'#fff', whiteSpace:'nowrap', pointerEvents:'none',
            fontFamily:'var(--font-mono)',
          }}>
            {fmt((hoverPct / 100) * duration)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayerControls({
  visible, channel, stream, state, isFullscreen,
  onTogglePlay, onSeek, onVolume, onMute,
  onQuality, onFullscreen, onClose, onCast, castDevice,
}) {
  const [speed, setSpeed]   = useState('1x');
  const [openDD, setOpenDD] = useState(null);
  const [volHover, setVolHover] = useState(false);

  const qualityOpts = state.qualityLevels?.length
    ? ['Auto', ...state.qualityLevels.map((l, i) => l.height ? `${l.height}p` : `Level ${i}`)]
    : ['Auto', '1080p', '720p', '480p', '360p'];
  const qualLabel = state.currentLevel === -1 ? 'Auto' : qualityOpts[state.currentLevel + 1] || 'Auto';

  const fs = isFullscreen;

  return (
    <div
      onClick={e => { e.stopPropagation(); if (openDD) setOpenDD(null); }}
      style={{
        position:'absolute', inset:0,
        // Full-height gradient for fullscreen; bottom-only for normal
        background: fs
          ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 30%, transparent 55%, rgba(0,0,0,0.2) 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)',
        opacity: visible ? 1 : 0,
        transition:'opacity 0.35s ease',
        pointerEvents: visible ? 'auto' : 'none',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding: fs ? '20px 28px' : '12px 14px',
      }}>

      {/* ── TOP ROW */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        {/* Channel info */}
        <div style={{ display:'flex', alignItems:'center', gap:12,
          background:'rgba(0,0,0,0.3)', backdropFilter:'blur(12px)',
          borderRadius:12, padding: fs ? '8px 14px' : '5px 10px',
          border:'1px solid rgba(255,255,255,0.08)' }}>
          <LiveDot />
          <div>
            <div style={{ fontSize: fs ? 16 : 12, fontWeight:800,
              fontFamily:'var(--font-display)', color:'#fff', lineHeight:1.2 }}>
              {channel?.name}
            </div>
            {fs && stream?.title && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                {stream.title}
              </div>
            )}
          </div>
          {fs && stream?.quality && (
            <div style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5,
              background:'rgba(108,99,255,0.3)', color:'#A89FFF',
              border:'1px solid rgba(108,99,255,0.4)' }}>
              {stream.quality}
            </div>
          )}
        </div>

        {/* Top-right: cast + close */}
        <div style={{ display:'flex', gap:8 }}>
          {castDevice ? (
            <GlassBtn onClick={onCast} active style={{ color:'#00C6FF', borderColor:'rgba(0,198,255,0.35)' }}>
              📡 {castDevice.length > 14 ? castDevice.slice(0,14) + '…' : castDevice}
            </GlassBtn>
          ) : (
            <GlassBtn onClick={onCast}>📡 Cast</GlassBtn>
          )}
          <GlassBtn onClick={onClose} danger>✕</GlassBtn>
        </div>
      </div>

      {/* ── FULLSCREEN CENTRE: large channel art + clock */}
      {fs && (
        <div style={{ textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.35)',
            letterSpacing:'0.1em' }}>
            {new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </div>
        </div>
      )}

      {/* ── CENTER TRANSPORT */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: fs ? 32 : 20 }}>
        {/* -10s */}
        <button onClick={e => { e.stopPropagation(); onSeek(Math.max(0, state.currentTime - 10)); }} style={transBtn(fs, false)}>
          <svg width={fs?22:18} height={fs?22:18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/>
          </svg>
          {fs && <span style={{ fontSize:10, position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', opacity:0.7 }}>10</span>}
        </button>

        {/* Play/Pause */}
        <button onClick={e => { e.stopPropagation(); onTogglePlay(); }} style={{
          background: state.playing ? 'rgba(255,255,255,0.12)' : 'var(--gradient-accent)',
          backdropFilter:'blur(16px)',
          border:`2px solid ${state.playing ? 'rgba(255,255,255,0.2)' : 'rgba(108,99,255,0.6)'}`,
          borderRadius:'50%',
          width: fs ? 72 : 56, height: fs ? 72 : 56,
          color:'#fff', fontSize: fs ? 28 : 22,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: state.playing ? 'none' : '0 0 40px rgba(108,99,255,0.6)',
          transition:'all 0.2s var(--ease-spring)',
          position:'relative',
        }}>
          {state.playing ? '⏸' : '▶'}
        </button>

        {/* +10s */}
        <button onClick={e => { e.stopPropagation(); onSeek(state.currentTime + 10); }} style={transBtn(fs, false)}>
          <svg width={fs?22:18} height={fs?22:18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/>
          </svg>
          {fs && <span style={{ fontSize:10, position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', opacity:0.7 }}>10</span>}
        </button>
      </div>

      {/* ── BOTTOM CONTROLS */}
      <div>
        {/* Seek bar */}
        {state.duration > 0 && (
          <SeekBar currentTime={state.currentTime} duration={state.duration} onSeek={onSeek} />
        )}
        {/* Live indicator when no duration */}
        {!state.duration && (
          <div style={{ height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:10, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%',
              background:'linear-gradient(90deg, transparent, rgba(108,99,255,0.6), transparent)',
              animation:'shimmer 2s infinite' }} />
          </div>
        )}

        {/* Controls row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>

          {/* Left: volume + time */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={e => { e.stopPropagation(); onMute(); }} style={iconBtnStyle}>
              {state.muted || state.volume === 0 ? '🔇' : state.volume > 0.5 ? '🔊' : '🔉'}
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:6,
              overflow:'hidden', maxWidth: volHover ? 90 : 0,
              transition:'max-width 0.25s ease', opacity: volHover ? 1 : 0 }}
              onMouseEnter={() => setVolHover(true)}
              onMouseLeave={() => setVolHover(false)}>
              <input type="range" min="0" max="1" step="0.02"
                value={state.muted ? 0 : state.volume}
                onChange={e => { e.stopPropagation(); onVolume(parseFloat(e.target.value)); }}
                onClick={e => e.stopPropagation()}
                style={{ width:72 }} />
            </div>
            <div onMouseEnter={() => setVolHover(true)} onMouseLeave={() => setVolHover(false)}
              style={{ width:8, height:8, borderRadius:'50%', background:'transparent', cursor:'default' }} />
            {state.duration > 0 && (
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
                {fmt(state.currentTime)} / {fmt(state.duration)}
              </span>
            )}
            {!state.duration && (
              <span style={{ fontSize:10, color:'#FF3B5C', fontWeight:700, letterSpacing:'0.08em' }}>⬤ LIVE</span>
            )}
          </div>

          {/* Right: speed, quality, fullscreen */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {/* Speed */}
            <div style={{ position:'relative' }}>
              <GlassBtn onClick={e => { e.stopPropagation(); setOpenDD(d => d === 'speed' ? null : 'speed'); }}>
                {speed} ▾
              </GlassBtn>
              {openDD === 'speed' && (
                <DropMenu options={SPEEDS} value={speed}
                  onChange={v => { setSpeed(v); }} onClose={() => setOpenDD(null)} />
              )}
            </div>
            {/* Quality */}
            <div style={{ position:'relative' }}>
              <GlassBtn onClick={e => { e.stopPropagation(); setOpenDD(d => d === 'q' ? null : 'q'); }}>
                {qualLabel} ▾
              </GlassBtn>
              {openDD === 'q' && (
                <DropMenu options={qualityOpts} value={qualLabel}
                  onChange={q => onQuality(q === 'Auto' ? -1 : qualityOpts.indexOf(q) - 1)}
                  onClose={() => setOpenDD(null)} />
              )}
            </div>
            {/* PiP */}
            {document.pictureInPictureEnabled && (
              <GlassBtn onClick={e => { e.stopPropagation(); onCast(); }} title="Picture-in-Picture / Cast">
                ⧉
              </GlassBtn>
            )}
            {/* Fullscreen */}
            <GlassBtn onClick={e => { e.stopPropagation(); onFullscreen(); }} large title={fs ? 'Exit fullscreen' : 'Fullscreen'}>
              {fs ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </GlassBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

const transBtn = (fs) => ({
  background:'rgba(255,255,255,0.08)', backdropFilter:'blur(8px)',
  border:'1px solid rgba(255,255,255,0.12)', borderRadius:'50%',
  width: fs ? 50 : 40, height: fs ? 50 : 40,
  color:'#ddd', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  position:'relative', transition:'all 0.15s',
});
const iconBtnStyle = {
  background:'none', border:'none', color:'rgba(255,255,255,0.7)',
  fontSize:16, cursor:'pointer', padding:4, display:'flex',
};
