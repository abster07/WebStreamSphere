// src/pages/EPGPage.jsx
import React, { Suspense } from 'react';
const EPGGrid = React.lazy(() => import('../components/epg/EPGGrid'));

export default function EPGPage() {
  return (
    <div className="page-enter">
      <div style={{ marginBottom: 20 }}>
        <h1 style={pageTitle}>EPG Guide</h1>
        <p style={pageSubtitle}>Electronic Program Guide — live broadcast schedule</p>
      </div>
      <Suspense fallback={<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading guide…</div>}>
        <EPGGrid />
      </Suspense>
    </div>
  );
}

const pageTitle = {
  fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)',
  background: 'linear-gradient(90deg,var(--text-primary) 60%,var(--text-muted))',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4,
};
const pageSubtitle = { fontSize: 13, color: 'var(--text-secondary)' };
