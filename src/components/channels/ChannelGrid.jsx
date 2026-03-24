// src/components/channels/ChannelGrid.jsx
// Virtualised grid and list using react-window + AutoSizer.
// Only renders visible rows — handles 13k channels without lag.

import React, { memo } from 'react';
import { FixedSizeList, FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChannelCard, ChannelRow } from './ChannelCard';
import { SkeletonBox, EmptyState } from '../ui';

const CARD_W    = 170;  // min card width including gap
const CARD_H    = 178;  // card height (fixed for virtualisation)
const ROW_H     = 64;   // list row height
const GAP       = 12;

// ── Skeleton states ────────────────────────────────────────────────────────
function GridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(158px,1fr))', gap: GAP }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 14, border: '1px solid var(--border-subtle)' }}>
          <SkeletonBox width={40} height={40} radius={8} style={{ marginBottom: 10 }} />
          <SkeletonBox width="80%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBox width="60%" height={10} />
        </div>
      ))}
    </div>
  );
}
function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <SkeletonBox width={36} height={36} radius={8} />
          <div style={{ flex: 1 }}>
            <SkeletonBox width="50%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonBox width="35%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Virtual Grid (card view) ───────────────────────────────────────────────
const GridCell = memo(function GridCell({ columnIndex, rowIndex, style, data }) {
  const { rows, gap } = data;
  const channel = rows[rowIndex]?.[columnIndex];
  if (!channel) return null;
  return (
    <div style={{ ...style, paddingRight: gap, paddingBottom: gap }}>
      <ChannelCard channel={channel} />
    </div>
  );
});

function VirtualGrid({ channels }) {
  return (
    <AutoSizer disableHeight style={{ width: '100%' }}>
      {({ width }) => {
        const cols    = Math.max(1, Math.floor((width + GAP) / (CARD_W + GAP)));
        const colW    = (width + GAP) / cols;
        const rows    = [];
        for (let i = 0; i < channels.length; i += cols) rows.push(channels.slice(i, i + cols));
        const height  = Math.min(rows.length * (CARD_H + GAP), window.innerHeight - 200);

        return (
          <FixedSizeGrid
            columnCount={cols}
            columnWidth={colW}
            rowCount={rows.length}
            rowHeight={CARD_H + GAP}
            width={width}
            height={height}
            itemData={{ rows, gap: GAP }}
            overscanRowCount={3}
            style={{ overflowX: 'hidden' }}
          >
            {GridCell}
          </FixedSizeGrid>
        );
      }}
    </AutoSizer>
  );
}

// ── Virtual List (row view) ────────────────────────────────────────────────
const ListRow = memo(function ListRow({ index, style, data }) {
  const channel = data[index];
  return (
    <div style={{ ...style, paddingBottom: 6 }}>
      <ChannelRow channel={channel} />
    </div>
  );
});

function VirtualList({ channels }) {
  return (
    <AutoSizer disableHeight style={{ width: '100%' }}>
      {({ width }) => {
        const height = Math.min(channels.length * (ROW_H + 6), window.innerHeight - 200);
        return (
          <FixedSizeList
            itemCount={channels.length}
            itemSize={ROW_H + 6}
            width={width}
            height={height}
            itemData={channels}
            overscanCount={5}
          >
            {ListRow}
          </FixedSizeList>
        );
      }}
    </AutoSizer>
  );
}

// ── Public export ──────────────────────────────────────────────────────────
export const ChannelGrid = memo(function ChannelGrid({ channels, isLoading, viewMode = 'grid', isStale }) {
  if (isLoading) return viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />;
  if (!channels?.length) return <EmptyState icon="📭" title="No channels found" subtitle="Try adjusting your filters or search query." />;

  return (
    <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      {viewMode === 'list' ? <VirtualList channels={channels} /> : <VirtualGrid channels={channels} />}
    </div>
  );
});
