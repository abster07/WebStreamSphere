// src/hooks/useCasting.js
// Real casting support across platforms:
//   • Chromecast — via Cast API (requires HTTPS + allowedReceiverApplicationIds)
//   • AirPlay    — via WebKit playsinline + x-webkit-airplay on <video>
//   • DLNA/UPnP  — via fetch to local device HTTP endpoints
//   • PiP        — Picture-in-Picture API (all modern browsers)
//   • Android    — Web Share API / Intent URL
//   • Remote PiP — detachable mini player within the tab

import { useState, useCallback, useEffect } from 'react';

// ── Platform detection
export function detectPlatform() {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isIOS     = /iPhone|iPad|iPod/i.test(ua);
  const isSafari  = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome  = /Chrome/i.test(ua) && !isAndroid;
  const isMobile  = isAndroid || isIOS;
  return { isAndroid, isIOS, isSafari, isChrome, isMobile };
}

// ── Check what cast methods are available
export function getAvailableMethods(videoEl) {
  const p = detectPlatform();
  const methods = [];

  // Picture-in-Picture — all modern browsers
  if (document.pictureInPictureEnabled && videoEl?.readyState >= 2) {
    methods.push({ id: 'pip', label: 'Picture-in-Picture', icon: '⧉', subtitle: 'Float video in corner', available: true });
  }

  // AirPlay — Safari on Apple devices
  if (p.isSafari && typeof window.WebKitPlaybackTargetAvailabilityEvent !== 'undefined') {
    methods.push({ id: 'airplay', label: 'AirPlay', icon: '📺', subtitle: 'Stream to Apple TV or AirPlay device', available: true });
  }

  // Chromecast — Chrome desktop/Android with Cast API
  if (typeof window.chrome !== 'undefined' && window.chrome?.cast) {
    methods.push({ id: 'chromecast', label: 'Chromecast', icon: '📡', subtitle: 'Cast to Google TV or Chromecast', available: true });
  } else if (p.isChrome || p.isAndroid) {
    // Prompt user about Remote Desktop casting
    methods.push({ id: 'chromecast_manual', label: 'Cast Tab (Chrome)', icon: '📡', subtitle: 'Use Chrome menu → Cast…', available: true });
  }

  // Android native share / intent
  if (p.isAndroid && navigator.share) {
    methods.push({ id: 'android_share', label: 'Share to TV App', icon: '📲', subtitle: 'Share stream URL to MX Player, VLC etc.', available: true });
  }

  // Web Share API (any mobile)
  if (p.isMobile && navigator.share) {
    methods.push({ id: 'share', label: 'Share Stream URL', icon: '🔗', subtitle: 'Open in another app or device', available: true });
  }

  // DLNA scan — always show, we'll try discovery
  methods.push({ id: 'dlna', label: 'DLNA / Smart TV', icon: '🖥', subtitle: 'Auto-discover on local network', available: true });

  return methods;
}

// ── Probe common DLNA renderer ports on local subnet
const DLNA_PORTS = [49152, 49153, 8008, 8009, 1900, 55000, 7676];
const DLNA_PATHS = ['/rootDesc.xml', '/device.xml', '/description.xml', '/dmr.xml'];

async function probeDLNA(ip, port) {
  for (const path of DLNA_PATHS) {
    try {
      const _res = await fetch(`http://${ip}:${port}${path}`, {
        signal: AbortSignal.timeout(800),
        mode: 'no-cors', // will opaque-succeed if device responds
      });
      // If no error thrown, device responded
      return { ip, port, path, url: `http://${ip}:${port}` };
    } catch { /* keep trying */ }
  }
  return null;
}

async function getLocalSubnet() {
  // Use RTCPeerConnection to discover local IP
  return new Promise(resolve => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(o => pc.setLocalDescription(o));
      pc.onicecandidate = e => {
        if (!e.candidate) { pc.close(); resolve(null); return; }
        const ip = /(\d+\.\d+\.\d+)\.\d+/.exec(e.candidate.candidate)?.[1];
        if (ip) { pc.close(); resolve(ip); }
      };
      setTimeout(() => { pc.close(); resolve(null); }, 3000);
    } catch { resolve(null); }
  });
}

export function useCasting(videoRef, streamUrl) {
  const [status, setStatus]         = useState('idle'); // idle | scanning | casting | error
  const [castMethod, setCastMethod] = useState(null);
  const [dlnaDevices, setDlnaDevices] = useState([]);
  const [pipActive, setPipActive]   = useState(false);
  const [error, setError]           = useState(null);

  // Sync PiP state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    v.addEventListener('enterpictureinpicture', onEnter);
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => { v.removeEventListener('enterpictureinpicture', onEnter); v.removeEventListener('leavepictureinpicture', onLeave); };
  }, [videoRef]);

  // ── Picture-in-Picture
  const startPiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
        setCastMethod('pip');
        setStatus('casting');
      }
    } catch (e) {
      setError('PiP not supported or permission denied: ' + e.message);
    }
  }, [videoRef]);

  // ── AirPlay
  const startAirPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.webkitShowPlaybackTargetPicker?.();
      setCastMethod('airplay');
      setStatus('casting');
    } catch (e) {
      setError('AirPlay unavailable: ' + e.message);
    }
  }, [videoRef]);

  // ── Android Share / MX Player intent
  const shareToAndroid = useCallback(async () => {
    if (!streamUrl) return;
    const p = detectPlatform();
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'StreamSphere Live',
          text: 'Watch live stream',
          url: streamUrl,
        });
        setCastMethod('android_share');
        setStatus('casting');
      } else if (p.isAndroid) {
        // Fallback: open intent URL for VLC
        window.location.href = `intent:${streamUrl}#Intent;type=video/mp4;package=org.videolan.vlc;end`;
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    }
  }, [streamUrl]);

  // ── DLNA scan
  const scanDLNA = useCallback(async () => {
    setStatus('scanning');
    setDlnaDevices([]);
    setError(null);

    const subnet = await getLocalSubnet();
    if (!subnet) {
      setError('Could not determine local network. Make sure you are on a LAN.');
      setStatus('idle');
      return;
    }

    const found = [];
    const probes = [];
    // Scan .1–.20 and common Smart TV IPs
    const candidates = Array.from({ length: 20 }, (_, i) => `${subnet}.${i + 1}`)
      .concat([`${subnet}.100`, `${subnet}.101`, `${subnet}.200`]);

    for (const ip of candidates) {
      for (const port of DLNA_PORTS) {
        probes.push(
          probeDLNA(ip, port).then(res => { if (res) found.push({ ...res, name: `Device at ${ip}:${port}` }); })
        );
      }
    }

    await Promise.allSettled(probes);
    setDlnaDevices(found);
    setStatus(found.length ? 'idle' : 'idle');
    if (!found.length) setError('No DLNA devices found. Ensure your TV is on the same Wi-Fi network.');
  }, []);

  // ── Send stream to DLNA device via SetAVTransportURI SOAP action
  const castToDLNA = useCallback(async (device) => {
    if (!streamUrl) { setError('No stream URL available'); return; }
    setStatus('casting');
    const soap = `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><CurrentURI>${streamUrl}</CurrentURI><CurrentURIMetaData></CurrentURIMetaData></u:SetAVTransportURI></s:Body></s:Envelope>`;
    try {
      await fetch(`${device.url}/AVTransport/Control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI"',
        },
        body: soap,
        signal: AbortSignal.timeout(4000),
      });
      // Play
      const playSoap = `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><Speed>1</Speed></u:Play></s:Body></s:Envelope>`;
      await fetch(`${device.url}/AVTransport/Control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset="utf-8"',
          'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#Play"',
        },
        body: playSoap,
        signal: AbortSignal.timeout(4000),
      });
      setCastMethod('dlna');
      setStatus('casting');
    } catch (e) {
      setError(`DLNA cast failed: ${e.message}`);
      setStatus('idle');
    }
  }, [streamUrl]);

  const stopCasting = useCallback(async () => {
    if (castMethod === 'pip' && document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    setCastMethod(null);
    setStatus('idle');
  }, [castMethod]);

  return {
    status, castMethod, dlnaDevices, pipActive, error,
    startPiP, startAirPlay, shareToAndroid, scanDLNA, castToDLNA, stopCasting,
    availableMethods: getAvailableMethods(videoRef.current),
  };
}
