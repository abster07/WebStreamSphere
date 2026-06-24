// src/components/epg/EPGGrid.jsx
import React, { useMemo, memo, useState } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';
import { useGuides } from '../../api/queries';
import { useEnrichedChannels } from '../../hooks/useEnrichedChannels';
import { SkeletonBox, ChannelLogo } from '../ui';

const TIME_OFFSETS = [
  { label: 'Now', minutes: 0 },
  { label: '+1h', minutes: 60 },
  { label: '+3h', minutes: 180 },
  { label: '+6h', minutes: 360 },
];

const PROGRAM_TITLES = [
  'Live Coverage', 'Morning News', 'Sports Update', 'Prime Time',
  'Late Night Show', 'Documentary Hour', 'Special Report', 'World Headlines',
  'Entertainment Tonight', 'Business Hour', 'Tech Talk', 'Cultural Review',
];

function makePrograms(seed, baseTime) {
  const durations = [30, 45, 60, 90, 60, 30, 120];
  const programs = [];
  let cursor = baseTime - 60 * 60 * 1000;
  for (let i = 0; i < 7; i++) {
    const dur = durations[i % durations.length];
    programs.push({
      id: `${seed}-${i}`,
      title: PROGRAM_TITLES[(seed + i) % PROGRAM_TITLES.length],
      start: cursor,
      end: cursor + dur * 60_000,
      duration: dur,
    });
    cursor += dur * 60_000;
  }
  return programs;
}

// ── Program block
const ProgramBlock = memo(function ProgramBlock({ program, nowMs, colWidthMs, onClick }) {
  const isNow  = program.start <= nowMs && program.end > nowMs;
  const isPast = program.end <= nowMs;
  const widthPct = ((program.end - program.start) / colWidthMs) * 100;
  const progress = isNow ? ((nowMs - program.start) / (program.end - program.start)) * 100 : 0;
  const startStr = new Date(program.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div onClick={onClick} title={program.title} style={{
      width: `${Math.max(widthPct, 8)}%`, flexShrink: 0,
      background: isNow ? 'rgba(108,99,255,0.18)' : isPast ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isNow ? 'rgba(108,99,255,0.45)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 8, padding: '7px 10px', cursor: 'pointer', position: 'relative',
      overflow: 'hidden', transition: 'background 0.2s', opacity: isPast ? 0.45 : 1,
      minWidth: 100,
    }}>
      {isNow && (
        <div style={{ position:'absolute', top:5, right:6, background:'var(--accent-danger)',
          borderRadius:4, padding:'1px 5px', fontSize:8, fontWeight:800, color:'#fff' }}>NOW</div>
      )}
      <div style={{ fontSize:11, fontWeight:600,
        color: isNow ? 'var(--text-primary)' : 'var(--text-secondary)',
        lineHeight:1.3, marginBottom:3, overflow:'hidden',
        whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
        {program.title}
      </div>
      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{startStr} · {program.duration}m</div>
      {isNow && progress > 0 && (
        <div style={{ position:'absolute', bottom:0, left:0, height:2,
          width:`${progress}%`, background:'var(--gradient-accent)' }} />
      )}
    </div>
  );
});

// ── EPG row — useMemo is ALWAYS called (before any conditional return)
const EPGRow = memo(function EPGRow({ index, style, data }) {
  const { channels, nowMs, setActiveChannel, navigate, colWidthMs } = data;

  // ✅ Hook called unconditionally — before any early return
  const programs = useMemo(() => makePrograms(index, nowMs), [index, nowMs]);

  const ch = channels[index];
  if (!ch) return null;

  return (
    <div style={{ ...style, display:'flex', paddingBottom:5 }}>
      <div style={{ width:150, flexShrink:0, background:'rgba(255,255,255,0.03)',
        borderRight:'1px solid var(--border-subtle)', padding:'8px 10px',
        display:'flex', alignItems:'center', gap:8, borderRadius:'8px 0 0 8px' }}>
        <ChannelLogo src={ch.logo} name={ch.name} size={26} />
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)',
          lineHeight:1.3, overflow:'hidden', display:'-webkit-box',
          WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{ch.name}</div>
      </div>
      <div style={{ flex:1, display:'flex', gap:3, padding:'0 4px', overflowX:'hidden' }}>
        {programs.map(prog => (
          <ProgramBlock key={prog.id} program={prog} nowMs={nowMs}
            colWidthMs={colWidthMs}
            onClick={() => { setActiveChannel(ch, ch.stream); navigate(`/watch/${ch.id}`); }} />
        ))}
      </div>
    </div>
  );
});

// ── Skeleton
function EPGSkeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ display:'flex', height:68, borderRadius:8, overflow:'hidden' }}>
          <div style={{ width:150, background:'var(--bg-surface)',
            borderRight:'1px solid var(--border-subtle)', padding:10 }}>
            <SkeletonBox width={28} height={28} radius={8} style={{ marginBottom:6 }} />
            <SkeletonBox width="75%" height={10} />
          </div>
          <div style={{ flex:1, display:'flex', gap:4, padding:'0 4px' }}>
            {[2,1,2,1].map((w,j) => (
              <SkeletonBox key={j} style={{ flex:w, height:'100%', borderRadius:8 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Public component
export default memo(function EPGGrid() {
  const [offset, setOffset] = useState(0);
  const setActiveChannel    = useAppStore(s => s.setActiveChannel);
  const navigate            = useNavigate();
  const { enriched, isLoading } = useEnrichedChannels();
  useGuides();

  const nowMs      = Date.now() + offset * 60_000;
  const colWidthMs = 4 * 60 * 60_000;

  const timeLabels = useMemo(() => (
    Array.from({ length: 9 }, (_, i) =>
      new Date(nowMs - 60 * 60_000 + i * 30 * 60_000)
        .toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    )
  ), [nowMs]);

  const channels = enriched.slice(0, 20);

  const itemData = useMemo(() => ({
    channels, nowMs, setActiveChannel, navigate, colWidthMs,
  }), [channels, nowMs, setActiveChannel, colWidthMs, navigate]);

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        {TIME_OFFSETS.map(t => (
          <button key={t.label} onClick={() => setOffset(t.minutes)} style={{
            padding:'5px 14px', borderRadius:20,
            background: offset === t.minutes ? 'rgba(108,99,255,0.28)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${offset === t.minutes ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
            color: offset === t.minutes ? 'var(--text-link)' : 'var(--text-secondary)',
            fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.2s',
          }}>{t.label}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)',
          fontFamily:'var(--font-mono)' }}>
          {new Date(nowMs).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
        </span>
      </div>

      <div style={{ display:'flex', paddingLeft:150, marginBottom:6, overflowX:'hidden' }}>
        {timeLabels.map((label, i) => (
          <div key={i} style={{ flex:1, fontSize:10, color:'var(--text-muted)',
            fontFamily:'var(--font-mono)',
            borderLeft: i > 0 ? '1px dashed rgba(255,255,255,0.05)' : 'none',
            paddingLeft:6 }}>
            {label}
          </div>
        ))}
      </div>

      {isLoading ? <EPGSkeleton /> : (
        <AutoSizer disableHeight style={{ width:'100%' }}>
          {({ width }) => (
            <FixedSizeList
              itemCount={channels.length}
              itemSize={73}
              width={width}
              height={Math.min(channels.length * 73, window.innerHeight - 260)}
              itemData={itemData}
              overscanCount={3}
            >
              {EPGRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      )}
    </div>
  );
});
