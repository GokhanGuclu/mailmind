import { useCallback, useEffect, useState } from 'react';
import { ymdKey } from './calendar-widget-utils';
import { calendarApi, type ApiCalendarEvent } from '../../../shared/api/calendar';
import { useAuth } from '../../../shared/context/auth-context';

export type CalendarEntryType = 'event' | 'task';

export type UserCalendarEntry = {
  id: string;
  y: number;
  m: number;
  d: number;
  time: string;
  title: string;
  type: CalendarEntryType;
  color?: string;
  note?: string;
};

export const CALENDAR_COLOR_PRESETS: Array<{ value: string; label: string }> = [
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#10b981', label: 'Yeşil' },
  { value: '#8b5cf6', label: 'Mor' },
  { value: '#f59e0b', label: 'Turuncu' },
  { value: '#ef4444', label: 'Kırmızı' },
  { value: '#ec4899', label: 'Pembe' },
  { value: '#06b6d4', label: 'Turkuaz' },
  { value: '#64748b', label: 'Gri' },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function parseMeta(
  description: string | null,
): { type: CalendarEntryType; color?: string; note?: string } {
  if (!description) return { type: 'event' };
  try {
    const meta = JSON.parse(description);
    const type: CalendarEntryType = meta?.kind === 'task' ? 'task' : 'event';
    const rawColor = typeof meta?.color === 'string' ? meta.color : undefined;
    const color = rawColor && HEX_RE.test(rawColor) ? rawColor : undefined;
    const note = typeof meta?.note === 'string' && meta.note.length > 0 ? meta.note : undefined;
    return { type, color, note };
  } catch {
    return { type: 'event' };
  }
}

function encodeMeta(type: CalendarEntryType, color?: string, note?: string): string {
  const payload: { kind: CalendarEntryType; color?: string; note?: string } = { kind: type };
  if (color && HEX_RE.test(color)) payload.color = color;
  if (note && note.trim().length > 0) payload.note = note.trim();
  return JSON.stringify(payload);
}

function twoDigit(n: number): string {
  return String(n).padStart(2, '0');
}

function apiToEntry(ev: ApiCalendarEvent): UserCalendarEntry {
  const dt = new Date(ev.startAt);
  const { type, color, note } = parseMeta(ev.description);
  return {
    id: ev.id,
    y: dt.getFullYear(),
    m: dt.getMonth(),
    d: dt.getDate(),
    time: `${twoDigit(dt.getHours())}:${twoDigit(dt.getMinutes())}`,
    title: ev.title,
    type,
    color,
    note,
  };
}

function buildStartAtISO(y: number, m: number, d: number, time: string): string {
  const [hhRaw, mmRaw] = time.split(':');
  const hh = Number(hhRaw) || 0;
  const mm = Number(mmRaw) || 0;
  return new Date(y, m, d, hh, mm, 0, 0).toISOString();
}

export function useCalendarEntries() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<UserCalendarEntry[]>([]);

  useEffect(() => {
    if (!accessToken) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    calendarApi
      .list(accessToken)
      .then((rows) => {
        if (!cancelled) setEntries(rows.map(apiToEntry));
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Calendar list failed:', err);
          setEntries([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const addEntry = useCallback(
    async (entry: Omit<UserCalendarEntry, 'id'>) => {
      if (!accessToken) return null;
      try {
        const created = await calendarApi.create(accessToken, {
          title: entry.title,
          description: encodeMeta(entry.type, entry.color, entry.note),
          startAt: buildStartAtISO(entry.y, entry.m, entry.d, entry.time),
        });
        const mapped = apiToEntry(created);
        setEntries((prev) => [...prev, mapped]);
        return mapped;
      } catch (err) {
        console.error('Calendar create failed:', err);
        return null;
      }
    },
    [accessToken],
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Omit<UserCalendarEntry, 'id'>>) => {
      if (!accessToken) return null;
      const current = entries.find((e) => e.id === id);
      if (!current) return null;
      const next: UserCalendarEntry = { ...current, ...patch };
      try {
        const updated = await calendarApi.update(accessToken, id, {
          title: next.title,
          description: encodeMeta(next.type, next.color, next.note),
          startAt: buildStartAtISO(next.y, next.m, next.d, next.time),
        });
        const mapped = apiToEntry(updated);
        setEntries((prev) => prev.map((e) => (e.id === id ? mapped : e)));
        return mapped;
      } catch (err) {
        console.error('Calendar update failed:', err);
        return null;
      }
    },
    [accessToken, entries],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      const prev = entries;
      setEntries((curr) => curr.filter((e) => e.id !== id));
      try {
        await calendarApi.remove(accessToken, id);
      } catch (err) {
        console.error('Calendar remove failed:', err);
        setEntries(prev);
      }
    },
    [accessToken, entries],
  );

  const entriesByYmd = useCallback(
    (y: number, m: number, d: number): UserCalendarEntry[] => {
      const key = ymdKey(y, m, d);
      return entries
        .filter((e) => ymdKey(e.y, e.m, e.d) === key)
        .sort((a, b) => a.time.localeCompare(b.time));
    },
    [entries],
  );

  const entriesMap = useCallback((): Map<string, UserCalendarEntry[]> => {
    const map = new Map<string, UserCalendarEntry[]>();
    for (const e of entries) {
      const key = ymdKey(e.y, e.m, e.d);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [entries]);

  return { entries, addEntry, updateEntry, removeEntry, entriesByYmd, entriesMap };
}
