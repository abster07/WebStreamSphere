// src/hooks/useHlsPlayer.js
// HLS.js lifecycle with proper cleanup and low-latency config.
// Dynamic import of hls.js so it only loads when a stream is played.

import { useEffect, useRef, useState, useCallback } from 'react';

export function useHlsPlayer(streamUrl) {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const [state, setState] = useState({
    playing: false, buffering: true, error: null,
    currentTime: 0, duration: 0, volume: 0.8, muted: false,
    qualityLevels: [], currentLevel: -1,
  });

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const video = videoRef.current;

    // Destroy previous instance
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setState(s => ({ ...s, buffering: true, error: null, playing: false, qualityLevels: [], currentLevel: -1 }));

    let cancelled = false;

    async function init() {
      // Dynamic import — hls.js chunk only loads on first play
      const { default: Hls } = await import('hls.js');
      if (cancelled) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker:       true,
          lowLatencyMode:     true,
          backBufferLength:   30,
          maxBufferLength:    30,
          maxMaxBufferLength: 60,
          // Start fast — don't wait for full segment
          startLevel:         -1,
          abrEwmaDefaultEstimate: 500_000,
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          if (cancelled) return;
          setState(s => ({ ...s, qualityLevels: data.levels, currentLevel: hls.currentLevel }));
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (cancelled || !data.fatal) return;
          const msg = data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? 'Network error — check your connection'
            : data.type === Hls.ErrorTypes.MEDIA_ERROR
              ? 'Media decoding error'
              : 'Stream unavailable';
          setState(s => ({ ...s, error: msg, buffering: false, playing: false }));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = streamUrl;
        video.play().catch(() => {});
      } else {
        setState(s => ({ ...s, error: "HLS not supported in this browser", buffering: false }));
      }
    }

    init();

    // Video event listeners
    const handlers = {
      play:       () => setState(s => ({ ...s, playing: true })),
      pause:      () => setState(s => ({ ...s, playing: false })),
      waiting:    () => setState(s => ({ ...s, buffering: true })),
      playing:    () => setState(s => ({ ...s, buffering: false, playing: true })),
      timeupdate: () => setState(s => ({ ...s, currentTime: video.currentTime, duration: video.duration || 0 })),
      volumechange: () => setState(s => ({ ...s, volume: video.volume, muted: video.muted })),
    };
    Object.entries(handlers).forEach(([ev, fn]) => video.addEventListener(ev, fn, { passive: true }));

    return () => {
      cancelled = true;
      Object.entries(handlers).forEach(([ev, fn]) => video.removeEventListener(ev, fn));
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streamUrl]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  }, []);

  const seek = useCallback((t) => {
    const v = videoRef.current;
    if (v && isFinite(t)) v.currentTime = Math.max(0, Math.min(t, v.duration || Infinity));
  }, []);

  const setVolume = useCallback((vol) => {
    const v = videoRef.current;
    const clamped = Math.max(0, Math.min(vol, 1));
    if (v) { v.volume = clamped; v.muted = clamped === 0; }
    setState(s => ({ ...s, volume: clamped, muted: clamped === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setState(s => ({ ...s, muted: v.muted }));
  }, []);

  const setQuality = useCallback((level) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setState(s => ({ ...s, currentLevel: level }));
    }
  }, []);

  const retry = useCallback(() => {
    const hls = hlsRef.current;
    if (hls) { hls.startLoad(); setState(s => ({ ...s, error: null, buffering: true })); }
    else {
      const v = videoRef.current;
      if (v) { v.load(); v.play().catch(() => {}); }
      setState(s => ({ ...s, error: null, buffering: true }));
    }
  }, []);

  return { videoRef, state, togglePlay, seek, setVolume, toggleMute, setQuality, retry };
}
