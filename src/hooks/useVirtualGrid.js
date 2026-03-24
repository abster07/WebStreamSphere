// src/hooks/useVirtualGrid.js
// Virtualised grid/list helpers wrapping react-window.
// Keeps only visible DOM nodes, making 13k-channel grids instant.

import { useMemo, useCallback } from 'react';

/**
 * Calculate how many columns fit given a container width and min card width.
 */
export function useGridColumns(containerWidth, minCardWidth = 158, gap = 12) {
  return useMemo(() => {
    if (!containerWidth) return 4;
    return Math.max(1, Math.floor((containerWidth + gap) / (minCardWidth + gap)));
  }, [containerWidth, minCardWidth, gap]);
}

/**
 * Chunk a flat array into rows of `cols` length for FixedSizeList.
 */
export function useRows(items, cols) {
  return useMemo(() => {
    const rows = [];
    for (let i = 0; i < items.length; i += cols) {
      rows.push(items.slice(i, i + cols));
    }
    return rows;
  }, [items, cols]);
}
