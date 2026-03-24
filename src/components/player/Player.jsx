// src/components/player/Player.jsx
// Mini floating player + fullscreen. Fully memoised — only re-renders
// when the active channel or fullscreen state changes.

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import useAppStore from '../../store/useAppStore';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { Spinner, Badge } from '../ui';
import PlayerControls from './PlayerControls';
import CastModal from './CastModal';

// Selectors — granular subscriptions
const selectChannel    = s => s.activeChannel;
const selectStream     = s => s.activeStream;
const selectFullscreen = s => s.isFullscreen;
const selectCastDevice = s => s.castDevice;
const selectSetFull    = s => s.setFullscreen;
const selectClear      = s => s.clearPlayer;
const selectAddRecent  = s => s.addRecentlyWatched;

export default memo(function Player() {
  const activeChannel  = useAppStore(selectChannel);
  const activeStream   = useAppStore(selectStream);
  const isFullscreen   = useAppStore(selectFullscreen);
  const castDevice     = useAppStore(selectCastDevice);
  const setFullscreen  = useAppStore(selectSetFull);
  const clearPlayer    = useAppStore(selectClear);
  const addRecent      = useAppStore(selectAddRecent);

  const streamUrl = activeStream?.url ?? null;
  const { videoRef, state, togglePlay, seek, setVolume, toggleMute, setQuality, retry } =
    useHlsPlayer(streamUrl);

  const [showControls, setShowControls] = useState(true);
  const [showCast, setShowCast] = useState(false);
  const hideTimer = useRef(null);

  // Track recently watched
  useEffect(() => {
    if (activeChannel) addRecent(activeChannel.id, activeStream?.url ?? null);
  }, [activeChannel?.id]); // eslint-disable-line

  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (state.playing) hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, [state.playing]);

  useEffect(() => {
    resetHide();
    return () => clearTimeout(hideTimer.current);
  }, [resetHide]);

  if (!activeChannel) return null;

  return (
    <>
      <div
        onMouseMove={resetHide}
        style={isFullscreen ? fullStyle : miniStyle}
      >
        {/* Video screen */}
        <div style={{
          position:'relative',
          aspectRatio: isFullscreen ? 'unset' : '16/9',
          height: isFullscreen ? 'calc(100% - 48px)' : 'auto',
          background:'#000',
          display:'flex', alignItems:'center', justifyContent:'center',
          // GPU compositing layer — stops paint invalidation spreading
          transform:'translateZ(0)',
        }}>
          <video ref={videoRef} style={{ width:'100%', height:'100%', display:'block' }} playsInline />

          {/* Buffering overlay */}
          {state.buffering && !state.error && (
            <div style={overlayCenter}>
              <Spinner size={36} />
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:10 }}>Buffering…</span>
            </div>
          )}

          {/* Error overlay */}
          {state.error && (
            <div style={overlayCenter}>
              <span style={{ fontSize:32, marginBottom:12 }}>⚠️</span>
              <span style={{ fontSize:13, color:'rgba(255,120,120,0.9)', textAlign:'center', maxWidth:240, marginBottom:16 }}>
                {typeof state.error === 'string' ? state.error : 'Stream unavailable'}
              </span>
              <button onClick={retry} style={retryBtn}>↺ Retry</button>
            </div>
          )}

          {/* No stream */}
          {!streamUrl && !state.error && (
            <div style={{ ...overlayCenter, background:'radial-gradient(ellipse at center,#111,#000)' }}>
              <div style={{ fontSize:42, marginBottom:10 }}>📡</div>
              <span style={{ fontSize:13, color:'#555' }}>No stream available</span>
            </div>
          )}

          {/* Controls */}
          <PlayerControls
            visible={showControls}
            channel={activeChannel}
            stream={activeStream}
            state={state}
            isFullscreen={isFullscreen}
            castDevice={castDevice}
            onTogglePlay={togglePlay}
            onSeek={seek}
            onVolume={setVolume}
            onMute={toggleMute}
            onQuality={setQuality}
            onFullscreen={() => setFullscreen(!isFullscreen)}
            onClose={clearPlayer}
            onCast={() => setShowCast(true)}
          />

          {/* Casting badge */}
          {castDevice && (
            <div style={{ position:'absolute', top:14, right:14,
              background:'rgba(0,198,255,0.15)', border:'1px solid rgba(0,198,255,0.35)',
              borderRadius:8, padding:'5px 10px', fontSize:11, color:'#00C6FF', fontWeight:600,
              display:'flex', alignItems:'center', gap:6 }}>
              📡 Casting to {castDevice}
            </div>
          )}
        </div>

        {/* Info strip (mini only) */}
        {!isFullscreen && (
          <div style={{ padding:'9px 14px', borderTop:'1px solid var(--border-subtle)',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{activeChannel.name}</div>
              <div style={{ fontSize:10, color:'var(--text-secondary)', marginTop:2 }}>
                {activeStream?.quality || '—'} · {activeChannel.country}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {activeStream?.quality && <Badge>{activeStream.quality}</Badge>}
              <button onClick={clearPlayer}
                style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:18, cursor:'pointer' }}>
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {showCast && <CastModal onClose={() => setShowCast(false)} />}
    </>
  );
});

const miniStyle = {
  position:'fixed', bottom:20, right:20,
  width:'var(--player-mini-w)', zIndex:100,
  borderRadius:'var(--radius-lg)', overflow:'hidden',
  background:'var(--bg-surface)',
  border:'1px solid var(--border-accent)',
  boxShadow:'var(--shadow-lg), var(--shadow-glow)',
  animation:'slideLeft 0.32s var(--ease-out)',
  // Own compositing layer
  willChange:'transform',
};
const fullStyle = {
  position:'fixed', inset:0, zIndex:200,
  background:'#000', animation:'fadeIn 0.2s',
  willChange:'transform',
};
const overlayCenter = {
  position:'absolute', inset:0,
  display:'flex', flexDirection:'column',
  alignItems:'center', justifyContent:'center',
  background:'rgba(0,0,0,0.7)',
};
const retryBtn = {
  padding:'8px 20px', borderRadius:8,
  background:'rgba(108,99,255,0.28)', border:'1px solid rgba(108,99,255,0.45)',
  color:'#A89FFF', fontWeight:600, fontSize:13, cursor:'pointer',
};
