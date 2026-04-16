import type { MailDashboardCopy } from '../page.mock-data';
import { ymdKey } from './calendar-widget-utils';

export type ResolvedCalendarEvent = {
  y: number;
  m: number;
  d: number;
  time: string;
  title: string;
};

export function resolveCalendarEventSeeds(
  anchor: Date,
  seeds: MailDashboardCopy['mock']['calendarEventSeeds'],
): Map<string, ResolvedCalendarEvent[]> {
  const map = new Map<string, ResolvedCalendarEvent[]>();
  const by = anchor.getFullYear();
  const bm = anchor.getMonth();
  for (const s of seeds) {
    const t = new Date(by, bm + s.monthOffset, 1);
    const y = t.getFullYear();
    const m = t.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const d = Math.min(Math.max(1, s.day), dim);
    const key = ymdKey(y, m, d);
    const list = map.get(key) ?? [];
    list.push({ y, m, d, time: s.time, title: s.title });
    map.set(key, list);
  }
  return map;
}

export function findSpecialDay(
  m: number,
  d: number,
  seeds: MailDashboardCopy['mock']['calendarSpecialDaySeeds'],
) {
  return seeds.find((s) => s.month === m && s.day === d);
}
