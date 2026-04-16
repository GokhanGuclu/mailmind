import type { Layout, LayoutItem } from 'react-grid-layout/legacy';

import type { MailDashboardPersisted, WidgetKind } from './types';
import { DASHBOARD_STORAGE_VERSION } from './types';

const STORAGE_PREFIX = 'mailmind.mail-dashboard';

export function getDashboardStorageKey(userKey: string): string {
  return `${STORAGE_PREFIX}.v${DASHBOARD_STORAGE_VERSION}.${userKey}`;
}

function isWidgetKind(s: string): s is WidgetKind {
  return (
    s === 'inbox' ||
    s === 'unread' ||
    s === 'starred' ||
    s === 'calendar' ||
    s === 'tasks' ||
    s === 'important-contacts' ||
    s === 'stats' ||
    s === 'quick-actions'
  );
}

function sanitizeLayout(layout: unknown): Layout | null {
  if (!Array.isArray(layout)) return null;
  const out: LayoutItem[] = [];
  for (const item of layout) {
    if (
      item &&
      typeof item === 'object' &&
      'i' in item &&
      typeof (item as { i: unknown }).i === 'string' &&
      isWidgetKind((item as { i: string }).i)
    ) {
      out.push(item as LayoutItem);
    }
  }
  return out.length ? (out as Layout) : null;
}

export function loadDashboard(userKey: string): MailDashboardPersisted | null {
  try {
    const raw = localStorage.getItem(getDashboardStorageKey(userKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MailDashboardPersisted> & { version?: number };
    if (parsed.version !== DASHBOARD_STORAGE_VERSION) return null;
    const layout = sanitizeLayout(parsed.layout);
    if (!layout) return null;
    return { version: DASHBOARD_STORAGE_VERSION, userKey, layout };
  } catch {
    return null;
  }
}

export function saveDashboard(data: MailDashboardPersisted): void {
  try {
    localStorage.setItem(getDashboardStorageKey(data.userKey), JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function getCurrentUserKey(): string {
  try {
    return localStorage.getItem('mailmind.userKey') ?? 'default';
  } catch {
    return 'default';
  }
}
