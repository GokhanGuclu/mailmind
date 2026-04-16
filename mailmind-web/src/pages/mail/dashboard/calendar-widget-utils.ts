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
