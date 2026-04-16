import type { Layout } from 'react-grid-layout/legacy';

import type { WidgetInstance, WidgetKind } from './types';

/** Varsayılan yerleşim: sol Inbox (8×6), sağ sütunda Okunmamış / Takvim / Hızlı işlem (4×2). */
export const DEFAULT_LAYOUT: Layout = [
  {
    i: 'inbox',
    x: 0,
    y: 0,
    w: 8,
    h: 6,
    minW: 5,
    minH: 4,
    maxW: 12,
    maxH: 6,
  },
  {
    i: 'unread',
    x: 8,
    y: 0,
    w: 4,
    h: 2,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 4,
  },
  {
    i: 'calendar',
    x: 8,
    y: 2,
    w: 4,
    h: 2,
    minW: 3,
    minH: 2,
    maxW: 6,
    maxH: 4,
  },
  {
    i: 'quick-actions',
    x: 8,
    y: 4,
    w: 4,
    h: 2,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 3,
  },
];

export function widgetsFromLayout(layout: Layout): WidgetInstance[] {
  return layout.map((li) => ({ id: li.i, kind: li.i as WidgetKind }));
}
