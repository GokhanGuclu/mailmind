import { useCallback, useMemo, useRef, useState } from 'react';
import { LuCalendarDays, LuChevronLeft, LuChevronRight, LuSparkles } from 'react-icons/lu';

import { useUIContext } from '../../shared/context/ui-context';
import type { MailDashboardCopy } from './page.mock-data';
import { findSpecialDay, resolveCalendarEventSeeds } from './dashboard/calendar-seeds';
import {
  buildMonthGrid,
  clampYM,
  compareYM,
  getCalendarViewBounds,
  shiftYM,
  type YM,
  ymdKey,
} from './dashboard/calendar-widget-utils';

type Props = {
  copy: MailDashboardCopy;
};

function isWeekend(y: number, m: number, d: number): boolean {
  const wd = new Date(y, m, d).getDay();
  return wd === 0 || wd === 6;
}

export function MailCalendarFullView({ copy }: Props) {
  const { language, theme } = useUIContext();
  const anchorRef = useRef(new Date());
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  const bounds = useMemo(() => getCalendarViewBounds(anchorRef.current), []);
  const now = anchorRef.current;
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const [view, setView] = useState<YM>(() =>
    clampYM({ y: todayY, m: todayM }, bounds.min, bounds.max),
  );
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(() => ({
    y: todayY,
    m: todayM,
    d: todayD,
  }));

  const eventsByYmd = useMemo(
    () => resolveCalendarEventSeeds(anchorRef.current, copy.mock.calendarEventSeeds),
    [copy.mock.calendarEventSeeds],
  );

  const goPrev = useCallback(() => {
    setView((v) => clampYM(shiftYM(v, -1), bounds.min, bounds.max));
  }, [bounds.min, bounds.max]);

  const goNext = useCallback(() => {
    setView((v) => clampYM(shiftYM(v, 1), bounds.min, bounds.max));
  }, [bounds.min, bounds.max]);

  const goToday = useCallback(() => {
    const t = clampYM({ y: todayY, m: todayM }, bounds.min, bounds.max);
    setView(t);
    setSelected({ y: todayY, m: todayM, d: todayD });
  }, [bounds.min, bounds.max, todayY, todayM, todayD]);

  const atMin = compareYM(view, bounds.min) <= 0;
  const atMax = compareYM(view, bounds.max) >= 0;

  const { cells } = useMemo(() => buildMonthGrid(view.y, view.m), [view.y, view.m]);

  const monthNameOnly = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(view.y, view.m, 1)),
    [view.y, view.m, locale],
  );

  const monthYearAria = `${monthNameOnly} ${view.y}`;

  const onPickDay = useCallback((y: number, m: number, d: number) => {
    setSelected({ y, m, d });
  }, []);

  const special = selected
    ? findSpecialDay(selected.m, selected.d, copy.mock.calendarSpecialDaySeeds)
    : undefined;
  const dayEvents = selected
    ? eventsByYmd.get(ymdKey(selected.y, selected.m, selected.d)) ?? []
    : [];

  const selectedLabel = useMemo(() => {
    if (!selected) return '';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(selected.y, selected.m, selected.d));
  }, [selected, locale]);

  const isTodayCell = (d: number) => view.y === todayY && view.m === todayM && d === todayD;
  const isSelectedCell = (d: number) =>
    selected !== null && selected.y === view.y && selected.m === view.m && selected.d === d;

  return (
    <div className={`mail-cal-full theme-${theme}`}>
      <header className="mail-cal-full__hero">
        <div className="mail-cal-full__hero-text">
          <p className="mail-cal-full__eyebrow">
            <LuCalendarDays size={18} aria-hidden />
            <span>{copy.navCalendar}</span>
          </p>
          <h1 className="mail-cal-full__title-row">
            <span className="mail-cal-full__title-month">{monthNameOnly}</span>{' '}
            <span className="mail-cal-full__title-year">{view.y}</span>
          </h1>
        </div>

        <div className="mail-cal-full__toolbar" role="group" aria-label={copy.navCalendar}>
          <button
            type="button"
            className="mail-cal-full__btn mail-cal-full__btn--ghost"
            onClick={goPrev}
            disabled={atMin}
            aria-label={copy.mock.calendarPrevMonth}
          >
            <LuChevronLeft size={22} aria-hidden />
          </button>
          <button type="button" className="mail-cal-full__btn mail-cal-full__btn--accent" onClick={goToday}>
            {copy.calendarPageToday}
          </button>
          <button
            type="button"
            className="mail-cal-full__btn mail-cal-full__btn--ghost"
            onClick={goNext}
            disabled={atMax}
            aria-label={copy.mock.calendarNextMonth}
          >
            <LuChevronRight size={22} aria-hidden />
          </button>
        </div>
      </header>

      <div className="mail-cal-full__shell">
        <div className="mail-cal-full__board" aria-label={monthYearAria}>
          <div className="mail-cal-full__grid" role="grid" aria-colcount={7}>
            {copy.mock.calendarWeekdays.map((label, i) => (
              <div key={`wd-${i}-${label}`} className="mail-cal-full__weekday" role="columnheader">
                {label}
              </div>
            ))}
            {cells.map((cell, idx) => {
              if (cell.kind === 'blank') {
                return <div key={`b-${idx}`} className="mail-cal-full__cell mail-cal-full__cell--blank" aria-hidden />;
              }
              const d = cell.d;
              const key = ymdKey(view.y, view.m, d);
              const evs = eventsByYmd.get(key) ?? [];
              const sp = findSpecialDay(view.m, d, copy.mock.calendarSpecialDaySeeds);
              const today = isTodayCell(d);
              const sel = isSelectedCell(d);
              const weekend = isWeekend(view.y, view.m, d);

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={`mail-cal-full__cell mail-cal-full__cell--day ${sp ? 'mail-cal-full__cell--has-special' : ''} ${today ? 'mail-cal-full__cell--today' : ''} ${sel ? 'mail-cal-full__cell--selected' : ''} ${weekend ? 'mail-cal-full__cell--weekend' : ''}`}
                  onClick={() => onPickDay(view.y, view.m, d)}
                  aria-pressed={sel}
                  aria-label={sp ? `${d}, ${sp.title}` : `${d}`}
                >
                  <span className="mail-cal-full__day-num">{d}</span>
                  {sp ? (
                    <div className="mail-cal-full__special-in-cell" title={sp.title}>
                      <LuSparkles size={12} className="mail-cal-full__special-in-cell-icon" aria-hidden />
                      <span className="mail-cal-full__special-in-cell-text">{sp.title}</span>
                    </div>
                  ) : null}
                  <div className="mail-cal-full__day-meta">
                    {evs.length > 0 ? (
                      <span className="mail-cal-full__ev-count">{evs.length}</span>
                    ) : null}
                  </div>
                  {evs.length > 0 ? (
                    <ul className="mail-cal-full__ev-chips" aria-hidden>
                      {evs.slice(0, 2).map((ev, i) => (
                        <li key={`${ev.time}-${i}`} className="mail-cal-full__ev-chip">
                          <span className="mail-cal-full__ev-chip-time">{ev.time}</span>
                          <span className="mail-cal-full__ev-chip-title">{ev.title}</span>
                        </li>
                      ))}
                      {evs.length > 2 ? (
                        <li className="mail-cal-full__ev-chip mail-cal-full__ev-chip--more">+{evs.length - 2}</li>
                      ) : null}
                    </ul>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="mail-cal-full__side" aria-live="polite">
          {!selected ? (
            <div className="mail-cal-full__side-empty">
              <LuCalendarDays size={40} strokeWidth={1.25} className="mail-cal-full__side-empty-icon" aria-hidden />
              <p>{copy.calendarPageSidebarEmpty}</p>
            </div>
          ) : (
            <>
              <p className="mail-cal-full__side-date">{selectedLabel}</p>

              {special ? (
                <section className="mail-cal-full__block mail-cal-full__block--holiday">
                  <h3 className="mail-cal-full__block-title">
                    <LuSparkles size={16} aria-hidden />
                    {copy.mock.calendarSectionHoliday}
                  </h3>
                  <p className="mail-cal-full__holiday-title">{special.title}</p>
                  <p className="mail-cal-full__holiday-desc">{special.description}</p>
                </section>
              ) : null}

              <section className="mail-cal-full__block mail-cal-full__block--events">
                <h3 className="mail-cal-full__block-title">{copy.mock.calendarSectionEvents}</h3>
                {dayEvents.length === 0 ? (
                  <div className="mail-cal-full__events-empty">
                    <p className="mail-cal-full__empty-msg">{copy.mock.calendarNoEvents}</p>
                  </div>
                ) : (
                  <ul className="mail-cal-full__event-list">
                    {dayEvents.map((ev, i) => (
                      <li key={`${ev.time}-${ev.title}-${i}`} className="mail-cal-full__event-row">
                        <span className="mail-cal-full__event-time-badge">{ev.time}</span>
                        <span className="mail-cal-full__event-title">{ev.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
