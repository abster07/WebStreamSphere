// src/hooks/useDebouncedCallback.js
// Stable debounced callback — ref-based so it never causes re-renders.

import { useRef, useCallback, useEffect } from 'react';

export function useDebouncedCallback(fn, delay) {
  const fnRef    = useRef(fn);
  const timerRef = useRef(null);

  // Keep the ref current without triggering re-renders
  useEffect(() => { fnRef.current = fn; }, [fn]);

  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]); // stable — only changes if delay changes
}

export function useThrottledCallback(fn, interval) {
  const fnRef    = useRef(fn);
  const lastRef  = useRef(0);
  useEffect(() => { fnRef.current = fn; }, [fn]);

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRef.current >= interval) {
      lastRef.current = now;
      fnRef.current(...args);
    }
  }, [interval]);
}
