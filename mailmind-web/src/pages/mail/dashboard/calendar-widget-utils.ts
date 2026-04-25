/** Ay görünümü: geçmiş 3 ay … gelecek 12 ay (bugüne göre). */
export function getCalendarViewBounds(now: Date): { min: YM; max: YM } {
  const min = shiftYM({ y: now.getFullYear(), m: now.getMonth() }, -3);
  const max = shiftYM({ y: now.getFullYear(), m: now.getMonth() }, 12);
  return { min, max };
}

export type YM = { y: number; m: number };

export function ymdKey(y: number, m: number, d: number): string {
  return `${y}-${m}-${d}`;
}

export function shiftYM(ym: YM, deltaMonths: number): YM {
  const t = new Date(ym.y, ym.m + deltaMonths, 1);
  return { y: t.getFullYear(), m: t.getMonth() };
}

export function clampYM(ym: YM, min: YM, max: YM): YM {
  const a = ym.y * 12 + ym.m;
  const lo = min.y * 12 + min.m;
  const hi = max.y * 12 + max.m;
  const c = Math.max(lo, Math.min(hi, a));
  return { y: Math.floor(c / 12), m: c % 12 };
}

export function compareYM(a: YM, b: YM): number {
  return a.y * 12 + a.m - (b.y * 12 + b.m);
}

/** min … max arası (dahil) tüm aylar */
export function enumerateMonths(min: YM, max: YM): YM[] {
  const out: YM[] = [];
  let cur = { ...min };
  while (compareYM(cur, max) <= 0) {
    out.push({ ...cur });
    cur = shiftYM(cur, 1);
  }
  return out;
}

export type GridCell =
  | { kind: 'blank' }
  | { kind: 'day'; d: number };

export function buildMonthGrid(y: number, m: number): { daysInMonth: number; cells: GridCell[] } {
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const daysInMonth = last.getDate();
  const jsDow = first.getDay();
  const leading = (jsDow + 6) % 7;
  const cells: GridCell[] = [];
  for (let i = 0; i < leading; i++) cells.push({ kind: 'blank' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ kind: 'day', d });
  return { daysInMonth, cells };
}

export type WeekCell =
  | { kind: 'day'; y: number; m: number; d: number }
  | { kind: 'other'; y: number; m: number; d: number };

export type WeekRow = { weekNumber: number; days: WeekCell[] };

/** ISO 8601 hafta numarası. */
export function isoWeekNumber(y: number, m: number, d: number): number {
  const date = new Date(Date.UTC(y, m, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Ay görünümü: 6 haftalık sabit ızgara.
 * Önceki ve sonraki aydan taşan günleri `kind: 'other'` olarak döner.
 * Her satır için hafta numarası hesaplar.
 */
export function buildMonthWeeks(y: number, m: number): WeekRow[] {
  const first = new Date(y, m, 1);
  const jsDow = first.getDay();
  const leading = (jsDow + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevLast = new Date(y, m, 0);
  const prevY = prevLast.getFullYear();
  const prevM = prevLast.getMonth();
  const prevDays = prevLast.getDate();
  const nextFirst = new Date(y, m + 1, 1);
  const nextY = nextFirst.getFullYear();
  const nextM = nextFirst.getMonth();

  const flat: WeekCell[] = [];
  for (let i = leading - 1; i >= 0; i--) {
    flat.push({ kind: 'other', y: prevY, m: prevM, d: prevDays - i });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    flat.push({ kind: 'day', y, m, d });
  }
  let trailingDay = 1;
  while (flat.length < 42) {
    flat.push({ kind: 'other', y: nextY, m: nextM, d: trailingDay });
    trailingDay += 1;
  }

  const weeks: WeekRow[] = [];
  for (let w = 0; w < 6; w++) {
    const days = flat.slice(w * 7, w * 7 + 7);
    const ref = days[0];
    weeks.push({ weekNumber: isoWeekNumber(ref.y, ref.m, ref.d), days });
  }
  return weeks;
}
