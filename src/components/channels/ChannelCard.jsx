// src/components/channels/ChannelCard.jsx
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';
import { ChannelLogo, Badge, LiveDot } from '../ui';
import { qualityBadgeColor } from '../../utils/dataUtils';

const selectSetChannel = s => s.setActiveChannel;
const selectToggle     = s => s.toggleFavorite;
const selectIsFav      = (id) => (s) => s.favorites.includes(id);

export const ChannelCard = memo(function ChannelCard({ channel }) {
  const navigate         = useNavigate();
  const setActiveChannel = useAppStore(selectSetChannel);
  const toggleFavorite   = useAppStore(selectToggle);
  const fav              = useAppStore(selectIsFav(channel.id));
  const stream = channel.stream;

  const handlePlay = useCallback(() => {
    setActiveChannel(channel, stream);
    navigate(`/watch/${channel.id}`);
  }, [channel, stream, setActiveChannel, navigate]);

  const handleFav = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(channel.id);
  }, [channel.id, toggleFavorite]);

  return (
    <div onClick={handlePlay} className="channel-card" style={cardStyle}>
      <div className="card-glow" style={glowStyle} />
      <div style={cardHeaderStyle}>
        <ChannelLogo src={channel.logo} name={channel.name} size={40} />
        {channel.hasStream && <LiveDot />}
      </div>
      <div style={nameStyle}>{channel.name}</div>
      <div style={badgeRowStyle}>
        {stream?.quality && <Badge color={qualityBadgeColor(stream.quality)}>{stream.quality}</Badge>}
        {channel.categories?.[0] && <Badge>{channel.categories[0]}</Badge>}
        {channel.country && <Badge color="#555">{channel.country}</Badge>}
      </div>
      {channel.network && <div style={networkStyle}>{channel.network}</div>}
      <button onClick={handleFav} style={{ ...favBtnStyle, color: fav ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
        {fav ? '♥' : '♡'}
      </button>
    </div>
  );
});

export const ChannelRow = memo(function ChannelRow({ channel }) {
  const navigate         = useNavigate();
  const setActiveChannel = useAppStore(selectSetChannel);
  const toggleFavorite   = useAppStore(selectToggle);
  const fav              = useAppStore(selectIsFav(channel.id));
  const stream = channel.stream;

  const handlePlay = useCallback(() => {
    setActiveChannel(channel, stream);
    navigate(`/watch/${channel.id}`);
  }, [channel, stream, setActiveChannel, navigate]);

  const handleFav = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(channel.id);
  }, [channel.id, toggleFavorite]);

  return (
    <div onClick={handlePlay} className="channel-row" style={rowStyle}>
      <ChannelLogo src={channel.logo} name={channel.name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rowNameStyle}>{channel.name}</div>
        <div style={rowMetaStyle}>
          {channel.country && <span>{channel.country}</span>}
          <span>{channel.categories?.slice(0,2).join(' · ')}</span>
          {stream?.quality && <Badge color={qualityBadgeColor(stream.quality)}>{stream.quality}</Badge>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {channel.hasStream && (
          <button onClick={handlePlay} style={playBtnStyle}>▶ Play</button>
        )}
        <button onClick={handleFav} style={{ background:'none', border:'none', fontSize:16, padding:2, cursor:'pointer',
          color: fav ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
          {fav ? '♥' : '♡'}
        </button>
      </div>
    </div>
  );
});

const cardStyle = { background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:'14px 14px 12px', cursor:'pointer', position:'relative', overflow:'hidden', transition:'transform 0.2s var(--ease-out), border-color 0.2s, box-shadow 0.2s', willChange:'transform' };
const glowStyle = { position:'absolute', inset:0, borderRadius:'var(--radius-md)', background:'var(--gradient-glow)', opacity:0, transition:'opacity 0.22s', pointerEvents:'none' };
const cardHeaderStyle = { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 };
const nameStyle = { fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:6, lineHeight:1.35, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' };
const badgeRowStyle = { display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 };
const networkStyle = { fontSize:10, color:'var(--text-muted)', marginTop:2 };
const favBtnStyle = { position:'absolute', bottom:10, right:10, background:'none', border:'none', fontSize:16, transition:'color 0.2s', padding:2, cursor:'pointer' };
const rowStyle = { display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.025)', border:'1px solid var(--border-subtle)', borderRadius:10, padding:'10px 14px', cursor:'pointer', transition:'background 0.2s, border-color 0.2s' };
const rowNameStyle = { fontSize:13, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' };
const rowMetaStyle = { fontSize:11, color:'var(--text-secondary)', marginTop:2, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' };
const playBtnStyle = { padding:'5px 12px', borderRadius:7, background:'rgba(108,99,255,0.18)', border:'1px solid rgba(108,99,255,0.3)', color:'var(--text-link)', fontSize:12, fontWeight:600, cursor:'pointer' };
