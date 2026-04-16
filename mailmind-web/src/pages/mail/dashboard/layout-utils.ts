import type { Layout } from 'react-grid-layout/legacy';

import { WIDGET_GRID_PRESET } from './widget-registry';
import type { WidgetKind } from './types';
import { GRID_COLS, GRID_MAX_ROWS } from './types';

function markOccupied(layout: Layout): Set<string> {
  const occupied = new Set<string>();
  for (const item of layout) {
    for (let ix = item.x; ix < item.x + item.w; ix++) {
      for (let iy = item.y; iy < item.y + item.h; iy++) {
        occupied.add(`${ix},${iy}`);
      }
    }
  }
  return occupied;
}

/** Boş grid hücrelerinde w×h alan arar (12×6 sınırı). */
export function findFreeSlot(
  layout: Layout,
  w: number,
  h: number,
  cols: number = GRID_COLS,
  maxRows: number = GRID_MAX_ROWS,
): { x: number; y: number } | null {
  const occupied = markOccupied(layout);
  const ww = Math.min(w, cols);
  const hh = Math.min(h, maxRows);
  for (let y = 0; y <= maxRows - hh; y++) {
    for (let x = 0; x <= cols - ww; x++) {
      let ok = true;
      outer: for (let dx = 0; dx < ww; dx++) {
        for (let dy = 0; dy < hh; dy++) {
          if (occupied.has(`${x + dx},${y + dy}`)) {
            ok = false;
            break outer;
          }
        }
      }
      if (ok) return { x, y };
    }
  }
  return null;
}

export function removeItemFromLayout(layout: Layout, itemId: string): Layout {
  return layout.filter((l) => l.i !== itemId);
}

/**
 * Yeni widget: önce hedef boyut, sığmazsa kademeli küçülür (minW/minH altına da inebilir);
 * yine sığmazsa 1×1 hücreye kadar dener. minW/minH, gerçek w/h ile uyumlu olacak şekilde kısılanır.
 */
export function addKindToLayout(layout: Layout, kind: WidgetKind): Layout {
  const preset = WIDGET_GRID_PRESET[kind];
  const baseW = Math.min(preset.w, GRID_COLS);
  const baseH = Math.min(preset.h, GRID_MAX_ROWS);

  for (let h = baseH; h >= 1; h--) {
    for (let w = baseW; w >= 1; w--) {
      const slot = findFreeSlot(layout, w, h);
      if (!slot) continue;
      return [
        ...layout,
        {
          i: kind,
          x: slot.x,
          y: slot.y,
          w,
          h,
          minW: Math.min(preset.minW, w),
          minH: Math.min(preset.minH, h),
          maxW: preset.maxW,
          maxH: preset.maxH,
        },
      ];
    }
  }
  return layout;
}
