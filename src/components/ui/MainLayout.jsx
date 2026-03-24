// src/components/ui/MainLayout.jsx
// Adjusts main content padding based on current route.
// Watch page gets no horizontal padding (video goes edge-to-edge).

import React from 'react';
import { useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const isWatch = pathname.startsWith('/watch/');

  return (
    <main style={{
      flex: 1,
      overflowY: 'auto',
      // Watch page: no side padding so video fills full width
      // All other pages: standard 28px padding
      padding: isWatch ? '0 0 40px' : '24px 28px 28px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--bg-elevated) transparent',
    }}>
      {children}
    </main>
  );
}
