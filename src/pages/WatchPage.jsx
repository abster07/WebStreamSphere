// src/pages/WatchPage.jsx
import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useEnrichedChannels } from '../hooks/useEnrichedChannels';
import { useHlsPlayer } from '../hooks/useHlsPlayer';
import PlayerControls from '../components/player/PlayerControls';
import CastModal from '../components/player/CastModal';
import { ChannelCard } from '../components/channels/ChannelCard';
import { ChannelLogo, Badge, LiveDot, Spinner, SkeletonBox } from '../components/ui';
import { qualityBadgeColor } from '../utils/dataUtils';

const TABS = [
  { id: 'epg',     label: '📅 Guide' },
  { id: 'related', label: '📺 More Like This' },
  { id: 'info',    label: 'ℹ️ Info' },
];

function makeEPGSchedule(channelName, nowMs) {
  const titles = [`${channelName} Live`,'Morning Edition','Breaking News','Sports Central','Prime Show','Late Night','Documentary Special','World Report','Tech Hour','Culture Tonight','Business Daily','The Interview','Film Night','Weekend Extra'];
  const durations = [60,30,90,45,60,120,60,30,45,90,60,30,120,60];
  const programs = [];
  let cursor = nowMs - 2 * 60 * 60_000;
  for (let i = 0; i < 14; i++) {
    const dur = durations[i];
    programs.push({ id:`${channelName}-${i}`, title:titles[i%titles.length],
      description:`Watch ${titles[i%titles.length]} live on this channel. Full HD broadcast with multi-language audio.`,
      start:cursor, end:cursor + dur*60_000, duration:dur,
      genre:['News','Sports','Entertainment','Documentary'][i%4] });
    cursor += dur*60_000;
  }
  return programs;
}

// ── EPG Tab
const EPGTab = memo(function EPGTab({ channel }) {
  const nowMs = useMemo(() => Date.now(), []);
  const schedule = useMemo(() => makeEPGSchedule(channel.name, nowMs), [channel.name, nowMs]);
  const [hovered, setHovered] = useState(null);

  return (
    <div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:16, fontFamily:'var(--font-mono)', letterSpacing:'0.05em' }}>
        {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        {schedule.map(prog => {
          const isNow  = prog.start <= nowMs && prog.end > nowMs;
          const isPast = prog.end <= nowMs;
          const progress = isNow ? ((nowMs - prog.start) / (prog.end - prog.start)) * 100 : 0;
          const startStr = new Date(prog.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
          const endStr   = new Date(prog.end).toLocaleTimeString([],   {hour:'2-digit',minute:'2-digit'});
          return (
            <div key={prog.id}
              onMouseEnter={() => setHovered(prog.id)} onMouseLeave={() => setHovered(null)}
              style={{ display:'flex', alignItems:'stretch', borderRadius:10, overflow:'hidden',
                background: isNow ? 'rgba(108,99,255,0.1)' : hovered===prog.id ? 'rgba(255,255,255,0.035)' : 'transparent',
                border:`1px solid ${isNow ? 'rgba(108,99,255,0.3)' : hovered===prog.id ? 'var(--border-subtle)' : 'transparent'}`,
                transition:'all 0.15s', opacity: isPast ? 0.4 : 1 }}>
              {isNow && <div style={{ width:3, background:'var(--gradient-accent)', flexShrink:0 }} />}
              <div style={{ width:80, flexShrink:0, padding:'11px 12px', display:'flex',
                flexDirection:'column', justifyContent:'center', borderRight:'1px solid var(--border-subtle)' }}>
                <div style={{ fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)',
                  color: isNow ? 'var(--text-link)' : 'var(--text-secondary)' }}>{startStr}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1, fontFamily:'var(--font-mono)' }}>{endStr}</div>
              </div>
              <div style={{ flex:1, padding:'11px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  {isNow && <LiveDot />}
                  <div style={{ fontSize:13, fontWeight: isNow?700:600,
                    color: isNow?'var(--text-primary)':isPast?'var(--text-muted)':'var(--text-secondary)' }}>
                    {prog.title}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>{prog.duration}m</span>
                  <Badge color="#555">{prog.genre}</Badge>
                </div>
                {isNow && (
                  <div style={{ marginTop:7, height:2, background:'rgba(255,255,255,0.07)', borderRadius:1 }}>
                    <div style={{ width:`${progress}%`, height:'100%', background:'var(--gradient-accent)', borderRadius:1 }} />
                  </div>
                )}
                {hovered===prog.id && !isPast && (
                  <div style={{ marginTop:5, fontSize:11, color:'var(--text-muted)', lineHeight:1.55, animation:'fadeIn 0.12s ease' }}>
                    {prog.description}
                  </div>
                )}
              </div>
              <div style={{ padding:'11px 12px', display:'flex', alignItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{prog.duration}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Related Tab
const RelatedTab = memo(function RelatedTab({ channel, enriched }) {
  const related = useMemo(() => {
    const cats = channel.categories ?? [];
    return enriched
      .filter(ch => ch.id !== channel.id && (ch.categories?.some(c => cats.includes(c)) || ch.country === channel.country))
      .sort((a,b) => (b.hasStream?1:0) - (a.hasStream?1:0))
      .slice(0,24);
  }, [channel, enriched]);

  if (!related.length) return (
    <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)', fontSize:13 }}>No related channels found.</div>
  );
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px, 1fr))', gap:12 }}>
      {related.map(ch => <ChannelCard key={ch.id} channel={ch} />)}
    </div>
  );
});

// ── Info Tab
const InfoTab = memo(function InfoTab({ channel, stream }) {
  return (
    <div style={{ maxWidth:580 }}>
      {[
        ['Channel ID', channel.id],
        ['Country',    channel.country || '—'],
        ['Network',    channel.network || '—'],
        ['Categories', (channel.categories||[]).join(', ') || '—'],
        ['Launched',   channel.launched || '—'],
        ['Website',    channel.website || '—'],
        ['Stream URL', stream?.url || 'Not available'],
        ['Quality',    stream?.quality || '—'],
        ['Feeds',      (channel.feeds?.length||0) + ' feed(s)'],
      ].map(([label, value]) => (
        <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:16,
          padding:'11px 0', borderBottom:'1px solid var(--border-subtle)' }}>
          <div style={{ width:100, flexShrink:0, fontSize:11, color:'var(--text-muted)', fontWeight:700, paddingTop:1, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
          <div style={{ flex:1, fontSize:12, color:'var(--text-secondary)', wordBreak:'break-all', lineHeight:1.55 }}>
            {label==='Website' && value!=='—'
              ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color:'var(--text-link)' }}>{value}</a>
              : value}
          </div>
        </div>
      ))}
      {channel.alt_names?.length > 0 && (
        <div style={{ display:'flex', gap:16, padding:'11px 0', borderBottom:'1px solid var(--border-subtle)' }}>
          <div style={{ width:100, flexShrink:0, fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Also Known As</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {channel.alt_names.map(n => <Badge key={n}>{n}</Badge>)}
          </div>
        </div>
      )}
      {channel.owners?.length > 0 && (
        <div style={{ display:'flex', gap:16, padding:'11px 0' }}>
          <div style={{ width:100, flexShrink:0, fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Owned By</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{channel.owners.join(', ')}</div>
        </div>
      )}
    </div>
  );
});

// ── Main WatchPage
export default function WatchPage() {
  const { channelId } = useParams();
  const navigate      = useNavigate();
  const { enriched, isLoading } = useEnrichedChannels();

  const activeChannel    = useAppStore(s => s.activeChannel);
  const setActiveChannel = useAppStore(s => s.setActiveChannel);
  const addRecent        = useAppStore(s => s.addRecentlyWatched);
  const isFullscreen     = useAppStore(s => s.isFullscreen);
  const setFullscreen    = useAppStore(s => s.setFullscreen);
  const toggleFavorite   = useAppStore(s => s.toggleFavorite);
  const isFav            = useAppStore(s => s.favorites.includes(channelId));
  const castDevice       = useAppStore(s => s.castDevice);

  const [tab, setTab]         = useState('epg');
  const [showCast, setShowCast] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);

  const channel = useMemo(() => {
    if (activeChannel?.id === channelId) return activeChannel;
    return enriched.find(ch => ch.id === channelId) ?? null;
  }, [channelId, activeChannel, enriched]);

  useEffect(() => {
    if (channel && channel.id !== activeChannel?.id) setActiveChannel(channel, channel.stream);
  }, [channel?.id]); // eslint-disable-line

  useEffect(() => {
    if (channel) addRecent(channel.id, channel.stream?.url ?? null);
  }, [channel?.id]); // eslint-disable-line

  // Real fullscreen via Fullscreen API
  const videoWrapRef = useRef(null);
  const handleFullscreen = useCallback(async () => {
    const el = videoWrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
        setFullscreen(true);
      } else {
        await document.exitFullscreen?.() || document.webkitExitFullscreen?.();
        setFullscreen(false);
      }
    } catch { setFullscreen(f => !f); }
  }, [setFullscreen]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => { document.removeEventListener('fullscreenchange', handler); document.removeEventListener('webkitfullscreenchange', handler); };
  }, [setFullscreen]);

  const { videoRef, state, togglePlay, seek, setVolume, toggleMute, setQuality, retry } =
    useHlsPlayer(channel?.stream?.url ?? null);

  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    if (state.playing) hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, [state.playing]);

  useEffect(() => { resetHide(); return () => clearTimeout(hideTimerRef.current); }, [resetHide]);
  // Always show controls in fullscreen on touch
  useEffect(() => {
    if (!isFullscreen) setShowControls(true);
  }, [isFullscreen]);

  if (isLoading && !channel) {
    return (
      <div>
        <SkeletonBox height={480} radius={0} />
        <div style={{ padding:'20px 28px' }}>
          <SkeletonBox width={220} height={24} style={{ marginBottom:10 }} />
          <SkeletonBox width={140} height={14} />
        </div>
      </div>
    );
  }

  if (!channel && !isLoading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
        <div style={{ fontSize:48 }}>📡</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>Channel not found</div>
        <button onClick={() => navigate('/live')} style={backBtnStyle}>← Back to Live TV</button>
      </div>
    );
  }

  const stream = channel?.stream ?? null;

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', animation:'fadeIn 0.18s ease' }}>

      {/* ── VIDEO WRAPPER — native Fullscreen API target */}
      <div ref={videoWrapRef}
        onMouseMove={resetHide}
        onTouchStart={resetHide}
        style={{
          position:'relative', background:'#000',
          aspectRatio: isFullscreen ? 'unset' : '16/9',
          height: isFullscreen ? '100%' : undefined,
          maxHeight: isFullscreen ? '100vh' : 560,
          width:'100%', overflow:'hidden', flexShrink:0,
          // Subtle bottom shadow blending into page
          boxShadow: isFullscreen ? 'none' : '0 8px 40px rgba(0,0,0,0.5)',
        }}>
        <video ref={videoRef} style={{ width:'100%', height:'100%', display:'block', objectFit:'cover' }}
          playsInline
          // AirPlay attribute for Safari
          x-webkit-airplay="allow"
          webkit-playsinline="true" />

        {/* Buffering */}
        {state.buffering && !state.error && (
          <div style={overlayCtr}>
            <div style={{ position:'relative' }}>
              <Spinner size={44} />
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:16 }}>📡</div>
            </div>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:12, fontFamily:'var(--font-mono)' }}>
              Connecting…
            </span>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div style={overlayCtr}>
            <div style={{ fontSize:48, marginBottom:12, filter:'grayscale(1)' }}>📡</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:6 }}>Stream Unavailable</div>
            <div style={{ fontSize:12, color:'rgba(255,120,100,0.9)', maxWidth:260, textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
              {typeof state.error === 'string' ? state.error : 'Unable to load stream'}
            </div>
            <button onClick={retry} style={retryBtnStyle}>↺ Retry Connection</button>
          </div>
        )}

        {/* No stream */}
        {!stream && !state.error && !state.buffering && (
          <div style={{ ...overlayCtr, background:'radial-gradient(ellipse at center, #0e0e1a 0%, #000 100%)' }}>
            <div style={{ fontSize:56, marginBottom:14, filter:'grayscale(0.3)' }}>📺</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text-secondary)' }}>No stream available</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>This channel has no live stream URL</div>
          </div>
        )}

        {/* Casting active badge */}
        {castDevice && (
          <div style={{ position:'absolute', top:16, right:16, zIndex:10,
            background:'rgba(0,198,255,0.15)', backdropFilter:'blur(10px)',
            border:'1px solid rgba(0,198,255,0.35)', borderRadius:10,
            padding:'6px 12px', fontSize:11, color:'#00C6FF', fontWeight:700,
            display:'flex', alignItems:'center', gap:7, animation:'fadeIn 0.2s' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#00C6FF', animation:'pulse 1.5s infinite' }} />
            Casting to {castDevice}
          </div>
        )}

        {/* Controls */}
        <PlayerControls
          visible={showControls}
          channel={channel} stream={stream} state={state}
          isFullscreen={isFullscreen} castDevice={castDevice}
          onTogglePlay={togglePlay} onSeek={seek}
          onVolume={setVolume} onMute={toggleMute} onQuality={setQuality}
          onFullscreen={handleFullscreen}
          onClose={() => { if (isFullscreen) handleFullscreen(); else navigate(-1); }}
          onCast={() => setShowCast(true)}
        />
      </div>

      {/* ── CHANNEL HEADER */}
      {!isFullscreen && channel && (
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 28px 14px',
          borderBottom:'1px solid var(--border-subtle)', flexShrink:0,
          background:'linear-gradient(to bottom, rgba(108,99,255,0.04), transparent)' }}>
          <ChannelLogo src={channel.logo} name={channel.name} size={52} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5, flexWrap:'wrap' }}>
              <h1 style={{ fontSize:20, fontWeight:800, fontFamily:'var(--font-display)',
                color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {channel.name}
              </h1>
              {channel.hasStream && <LiveDot />}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
              {stream?.quality && <Badge color={qualityBadgeColor(stream.quality)}>{stream.quality}</Badge>}
              {(channel.categories??[]).slice(0,2).map(c => <Badge key={c}>{c}</Badge>)}
              {channel.country && <Badge color="#555">🌍 {channel.country}</Badge>}
              {channel.network && <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {channel.network}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button onClick={() => toggleFavorite(channel.id)} style={{
              ...actionBtn, color: isFav?'var(--accent-danger)':'var(--text-secondary)',
              background: isFav?'rgba(255,59,92,0.12)':'rgba(255,255,255,0.05)',
              border: `1px solid ${isFav?'rgba(255,59,92,0.3)':'var(--border-moderate)'}`,
            }}>
              {isFav?'♥':'♡'} {isFav?'Saved':'Save'}
            </button>
            <button onClick={() => setShowCast(true)} style={actionBtn}>📡 Cast</button>
            <button onClick={() => navigate(-1)} style={actionBtn}>← Back</button>
          </div>
        </div>
      )}

      {/* ── TABS */}
      {!isFullscreen && (
        <div style={{ display:'flex', gap:0, paddingLeft:28, borderBottom:'1px solid var(--border-subtle)', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'11px 20px', fontSize:13, fontWeight: tab===t.id?700:500,
              color: tab===t.id?'var(--text-primary)':'var(--text-secondary)',
              background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t.id?'2px solid var(--accent-primary)':'2px solid transparent',
              marginBottom:-1, transition:'all 0.18s', whiteSpace:'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* ── TAB CONTENT */}
      {!isFullscreen && channel && (
        <div style={{ flex:1, padding:'20px 28px 40px', animation:'fadeIn 0.18s ease' }}>
          {tab==='epg'     && <EPGTab channel={channel} />}
          {tab==='related' && <RelatedTab channel={channel} enriched={enriched} />}
          {tab==='info'    && <InfoTab channel={channel} stream={stream} />}
        </div>
      )}

      {/* ── CAST MODAL */}
      {showCast && (
        <CastModal
          onClose={() => setShowCast(false)}
          videoRef={videoRef}
          streamUrl={stream?.url ?? null}
        />
      )}
    </div>
  );
}

const overlayCtr = { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)' };
const retryBtnStyle = { padding:'9px 22px', borderRadius:10, background:'rgba(108,99,255,0.25)', border:'1px solid rgba(108,99,255,0.4)', color:'#A89FFF', fontWeight:700, fontSize:13, cursor:'pointer' };
const backBtnStyle = { padding:'9px 20px', borderRadius:10, background:'rgba(108,99,255,0.14)', border:'1px solid rgba(108,99,255,0.28)', color:'var(--text-link)', fontSize:13, fontWeight:600, cursor:'pointer' };
const actionBtn = { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-moderate)', color:'var(--text-secondary)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s' };
