// src/components/player/CastModal.jsx
// Real casting modal with PiP, AirPlay, DLNA discovery, Android Share

import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../../store/useAppStore';
import { useCasting, detectPlatform } from '../../hooks/useCasting';
import { Spinner } from '../ui';

export default function CastModal({ onClose, videoRef, streamUrl }) {
  const setCastDevice   = useAppStore(s => s.setCastDevice);
  const clearCastDevice = useAppStore(s => s.setCastDevice);
  const [activeTab, setActiveTab] = useState('methods');

  const {
    status, castMethod, dlnaDevices, pipActive, error,
    startPiP, startAirPlay, shareToAndroid, scanDLNA, castToDLNA, stopCasting,
    availableMethods,
  } = useCasting(videoRef, streamUrl);

  const platform = detectPlatform();

  // Kick off DLNA scan immediately when DLNA tab opens
  useEffect(() => {
    if (activeTab === 'dlna') scanDLNA();
  }, [activeTab]); // eslint-disable-line

  const handleMethod = (method) => {
    switch (method.id) {
      case 'pip':
        startPiP();
        setCastDevice('Picture-in-Picture');
        onClose();
        break;
      case 'airplay':
        startAirPlay();
        setCastDevice('AirPlay');
        onClose();
        break;
      case 'android_share':
      case 'share':
        shareToAndroid();
        break;
      case 'chromecast_manual':
        // Guide user to use Chrome's built-in cast
        setActiveTab('chrome_guide');
        break;
      case 'dlna':
        setActiveTab('dlna');
        break;
      default: break;
    }
  };

  const handleDLNACast = (device) => {
    castToDLNA(device);
    setCastDevice(device.name);
    onClose();
  };

  return (
    <div onClick={onClose} style={backdropStyle}>
      <div onClick={e => e.stopPropagation()} style={panelStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-primary)' }}>
              {activeTab === 'dlna' ? '🖥 DLNA Discovery' : activeTab === 'chrome_guide' ? '📡 Cast via Chrome' : '📡 Cast Stream'}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
              {streamUrl ? 'Stream ready to cast' : 'No stream available'}
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Stream URL pill */}
        {streamUrl && (
          <div style={urlPillStyle}>
            <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {streamUrl}
            </span>
            <button onClick={() => navigator.clipboard?.writeText(streamUrl)} style={copyBtnStyle} title="Copy URL">
              ⎘
            </button>
          </div>
        )}

        {/* ── Methods tab */}
        {activeTab === 'methods' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {availableMethods.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)', fontSize:13 }}>
                No cast methods available on this device/browser.
              </div>
            )}
            {availableMethods.map(method => (
              <button key={method.id} onClick={() => handleMethod(method)} disabled={!method.available} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'13px 16px', borderRadius:12, width:'100%', textAlign:'left', cursor:'pointer',
                background: castMethod && method.id.startsWith(castMethod) ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.04)',
                border:`1px solid ${castMethod && method.id.startsWith(castMethod) ? 'rgba(108,99,255,0.4)' : 'var(--border-subtle)'}`,
                transition:'all 0.18s', opacity: method.available ? 1 : 0.4,
              }}>
                <span style={{ fontSize:24, width:32, textAlign:'center', flexShrink:0 }}>{method.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{method.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{method.subtitle}</div>
                </div>
                {castMethod === method.id && (
                  <span style={{ fontSize:11, color:'var(--accent-success)', fontWeight:700 }}>● ACTIVE</span>
                )}
                {method.id === 'dlna' && <span style={{ fontSize:11, color:'var(--text-muted)' }}>→</span>}
              </button>
            ))}

            {/* PiP status */}
            {pipActive && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px', borderRadius:10,
                background:'rgba(0,198,255,0.1)', border:'1px solid rgba(0,198,255,0.3)' }}>
                <span style={{ fontSize:12, color:'#00C6FF', fontWeight:600 }}>⧉ Picture-in-Picture active</span>
                <button onClick={stopCasting} style={{ fontSize:11, color:'#00C6FF', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
                  Exit PiP
                </button>
              </div>
            )}

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,59,92,0.1)',
                border:'1px solid rgba(255,59,92,0.25)', fontSize:12, color:'#FF3B5C', lineHeight:1.5 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Platform tips */}
            <div style={{ marginTop:4, padding:'12px 14px', borderRadius:10,
              background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-subtle)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                💡 Tips for your device
              </div>
              {platform.isIOS && (
                <div style={tipStyle}>
                  <span>📱</span>
                  <span><b>iPhone/iPad:</b> Tap the AirPlay icon in Control Center, or use Screen Mirroring to cast to Apple TV.</span>
                </div>
              )}
              {platform.isAndroid && (
                <div style={tipStyle}>
                  <span>🤖</span>
                  <span><b>Android:</b> Use "Share Stream URL" to open in VLC, MX Player, or your TV remote app. Or enable Cast in Chrome settings.</span>
                </div>
              )}
              {platform.isChrome && !platform.isMobile && (
                <div style={tipStyle}>
                  <span>💻</span>
                  <span><b>Chrome desktop:</b> Press ⋮ → Cast… → choose your Chromecast or TV. Or use Picture-in-Picture to float the video.</span>
                </div>
              )}
              {platform.isSafari && (
                <div style={tipStyle}>
                  <span>🍎</span>
                  <span><b>Safari:</b> The AirPlay button appears in the video controls when an AirPlay device is nearby.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DLNA tab */}
        {activeTab === 'dlna' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                Scanning your local network for DLNA/UPnP renderers…
              </div>
              <button onClick={scanDLNA} style={{ fontSize:11, color:'var(--text-link)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                ↺ Rescan
              </button>
            </div>

            {status === 'scanning' && (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 0', justifyContent:'center' }}>
                <Spinner size={22} />
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>Probing local network…</span>
              </div>
            )}

            {status !== 'scanning' && dlnaDevices.length === 0 && (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🖥</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>No DLNA devices found</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6, maxWidth:280, margin:'0 auto' }}>
                  Make sure your Smart TV, media player, or Kodi box is on the same Wi-Fi network and DLNA/UPnP is enabled.
                </div>
              </div>
            )}

            {dlnaDevices.map((device, i) => (
              <button key={i} onClick={() => handleDLNACast(device)} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                borderRadius:10, width:'100%', textAlign:'left', cursor:'pointer', marginBottom:8,
                background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-subtle)',
                transition:'all 0.18s',
              }}>
                <span style={{ fontSize:24 }}>🖥</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{device.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{device.url}</div>
                </div>
                <span style={{ fontSize:11, color:'#00E676', fontWeight:700 }}>● Online</span>
              </button>
            ))}

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,59,92,0.08)',
                border:'1px solid rgba(255,59,92,0.2)', fontSize:12, color:'#FF3B5C', marginTop:8, lineHeight:1.5 }}>
                {error}
              </div>
            )}

            <button onClick={() => setActiveTab('methods')} style={{ marginTop:12, ...backTabBtn }}>
              ← Back to Cast Options
            </button>
          </div>
        )}

        {/* ── Chrome guide tab */}
        {activeTab === 'chrome_guide' && (
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                ['1', 'Click the ⋮ menu in Chrome (top-right)'],
                ['2', 'Select "Cast…" from the menu'],
                ['3', 'Choose "Cast tab" or "Cast desktop"'],
                ['4', 'Select your Chromecast or Google TV'],
                ['5', 'The stream will appear on your TV instantly'],
              ].map(([step, text]) => (
                <div key={step} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0,
                    background:'var(--gradient-accent)', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff' }}>
                    {step}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, paddingTop:4 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10,
              background:'rgba(108,99,255,0.08)', border:'1px solid rgba(108,99,255,0.2)' }}>
              <div style={{ fontSize:12, color:'var(--text-link)', lineHeight:1.6 }}>
                💡 For best quality, use "Cast tab" and ensure the video is in fullscreen before casting.
              </div>
            </div>
            <button onClick={() => setActiveTab('methods')} style={{ marginTop:12, ...backTabBtn }}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const backdropStyle = {
  position:'fixed', inset:0, zIndex:500,
  background:'rgba(0,0,0,0.78)', backdropFilter:'blur(12px)',
  display:'flex', alignItems:'center', justifyContent:'center',
  animation:'fadeIn 0.18s ease',
};
const panelStyle = {
  background:'#0D0D1C', border:'1px solid var(--border-moderate)',
  borderRadius:20, padding:24, width:'min(440px, 94vw)',
  maxHeight:'88vh', overflowY:'auto',
  boxShadow:'0 0 80px rgba(108,99,255,0.15), 0 30px 80px rgba(0,0,0,0.6)',
  animation:'scaleIn 0.2s var(--ease-spring)',
  scrollbarWidth:'thin',
};
const headerStyle = {
  display:'flex', alignItems:'flex-start', justifyContent:'space-between',
  marginBottom:14,
};
const closeBtnStyle = {
  background:'rgba(255,255,255,0.07)', border:'1px solid var(--border-moderate)',
  borderRadius:8, width:30, height:30, fontSize:14, color:'var(--text-secondary)',
  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
};
const urlPillStyle = {
  display:'flex', alignItems:'center', gap:8,
  background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-subtle)',
  borderRadius:8, padding:'7px 10px', marginBottom:16,
  overflow:'hidden',
};
const copyBtnStyle = {
  background:'none', border:'none', color:'var(--text-muted)',
  fontSize:14, cursor:'pointer', flexShrink:0, padding:0,
};
const tipStyle = {
  display:'flex', gap:8, fontSize:11, color:'var(--text-secondary)',
  lineHeight:1.55, marginBottom:6,
};
const backTabBtn = {
  background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-subtle)',
  color:'var(--text-secondary)', fontSize:12, fontWeight:600,
  padding:'8px 16px', borderRadius:8, cursor:'pointer', width:'100%',
};
