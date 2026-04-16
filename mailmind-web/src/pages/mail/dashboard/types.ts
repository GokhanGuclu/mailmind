import type { Layout } from 'react-grid-layout/legacy';

export const DASHBOARD_STORAGE_VERSION = 3 as const;

/** Posta kutusu ana sayfası için tanımlı widget türleri (her türden en fazla bir örnek, id = kind). */
export type WidgetKind =
  | 'inbox'
  | 'unread'
  | 'starred'
  | 'calendar'
  | 'tasks'
  | 'important-contacts'
  | 'stats'
  | 'quick-actions';

export type WidgetInstance = {
  id: string;
  kind: WidgetKind;
};

export type MailDashboardPersisted = {
  version: typeof DASHBOARD_STORAGE_VERSION;
  userKey: string;
  /** Tek kırılım: 12 kolon × en fazla 6 satır. */
  layout: Layout;
};

/** Sabit grid: 12 kolon, 6 satır üst sınır (react-grid-layout maxRows). */
export const GRID_COLS = 12;
export const GRID_MAX_ROWS = 6;
