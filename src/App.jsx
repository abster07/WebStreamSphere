// src/App.jsx
import React, { Suspense, useEffect, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar   from './components/sidebar/Sidebar';
import TopBar    from './components/ui/TopBar';
import { Spinner } from './components/ui';
import { usePrefetchCritical } from './api/queries';
import MainLayout from './components/ui/MainLayout';
import './styles/components.css';

// ── Code-split every page
const HomePage       = lazy(() => import('./pages/HomePage'));
const LiveTVPage     = lazy(() => import('./pages/LiveTVPage'));
const WatchPage      = lazy(() => import('./pages/WatchPage'));
const EPGPage        = lazy(() => import('./pages/EPGPage'));
const SearchPage     = lazy(() => import('./pages/SearchPage'));
const FavoritesPage  = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const RecentPage     = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.RecentPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CountriesPage  = lazy(() => import('./pages/CountriesPage').then(m => ({ default: m.CountriesPage })));
const RegionsPage    = lazy(() => import('./pages/CountriesPage').then(m => ({ default: m.RegionsPage })));
const SettingsPage   = lazy(() => import('./pages/CountriesPage').then(m => ({ default: m.SettingsPage })));

const AmbientOrbs = React.memo(function AmbientOrbs() {
  return (
    <>
      {[
        { x:'8%',  y:'15%', color:'#6C63FF', size:500 },
        { x:'72%', y:'55%', color:'#00C6FF', size:420 },
        { x:'38%', y:'85%', color:'#FF3B5C', size:320 },
      ].map((o, i) => (
        <div key={i} style={{
          position:'fixed', left:o.x, top:o.y, width:o.size, height:o.size,
          borderRadius:'50%', background:`radial-gradient(${o.color}, transparent 70%)`,
          filter:'blur(90px)', opacity:0.085, pointerEvents:'none', zIndex:0,
          transform:'translate(-50%,-50%)',
        }} />
      ))}
    </>
  );
});

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:200, gap:12, color:'var(--text-muted)', fontSize:13 }}>
      <Spinner /> Loading…
    </div>
  );
}

export default function App() {
  const prefetch = usePrefetchCritical();
  useEffect(() => { prefetch(); }, []); // eslint-disable-line

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh',
      overflow:'hidden', position:'relative', background:'var(--bg-base)' }}>
      <AmbientOrbs />
      <TopBar />
      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative', zIndex:1 }}>
        <Sidebar />
        <MainLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<HomePage />} />
              <Route path="/live"        element={<LiveTVPage />} />
              <Route path="/watch/:channelId" element={<WatchPage />} />
              <Route path="/epg"         element={<EPGPage />} />
              <Route path="/search"      element={<SearchPage />} />
              <Route path="/favorites"   element={<FavoritesPage />} />
              <Route path="/recent"      element={<RecentPage />} />
              <Route path="/categories"  element={<CategoriesPage />} />
              <Route path="/countries"   element={<CountriesPage />} />
              <Route path="/regions"     element={<RegionsPage />} />
              <Route path="/settings"    element={<SettingsPage />} />
              <Route path="*"            element={<HomePage />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </div>
      {/* No floating Player — it lives at /watch/:channelId now */}
      <Toaster position="bottom-left" toastOptions={{
        style: { background:'var(--bg-elevated)', color:'var(--text-primary)',
          border:'1px solid var(--border-moderate)', borderRadius:10, fontSize:13 }
      }} />
    </div>
  );
}
