import type { LayoutItem } from 'react-grid-layout/legacy';

import type { WidgetKind } from './types';
import { GRID_COLS, GRID_MAX_ROWS } from './types';

export type WidgetGridPreset = {
  w: number;
  h: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
};

/** Önceden tanımlı boyut sınırları (serbest piksel yok; grid birimine snap). */
export const WIDGET_GRID_PRESET: Record<WidgetKind, WidgetGridPreset> = {
  inbox: { w: 8, h: 6, minW: 5, minH: 4, maxW: GRID_COLS, maxH: GRID_MAX_ROWS },
  unread: { w: 4, h: 3, minW: 2, minH: 2, maxW: 6, maxH: 4 },
  starred: { w: 4, h: 3, minW: 2, minH: 2, maxW: 6, maxH: 4 },
  calendar: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 4 },
  tasks: { w: 4, h: 3, minW: 2, minH: 2, maxW: 6, maxH: 4 },
  'important-contacts': { w: 4, h: 3, minW: 2, minH: 2, maxW: 6, maxH: 4 },
  stats: { w: 4, h: 2, minW: 2, minH: 2, maxW: 6, maxH: 3 },
  'quick-actions': { w: 4, h: 2, minW: 2, minH: 2, maxW: 6, maxH: 3 },
};

export const ALL_WIDGET_KINDS: WidgetKind[] = [
  'inbox',
  'unread',
  'starred',
  'calendar',
  'tasks',
  'important-contacts',
  'stats',
  'quick-actions',
];

export function layoutItemForKind(kind: WidgetKind, x: number, y: number): LayoutItem {
  const p = WIDGET_GRID_PRESET[kind];
  return {
    i: kind,
    x,
    y,
    w: Math.min(p.w, GRID_COLS),
    h: Math.min(p.h, GRID_MAX_ROWS),
    minW: p.minW,
    minH: p.minH,
    maxW: p.maxW,
    maxH: p.maxH,
  };
}
