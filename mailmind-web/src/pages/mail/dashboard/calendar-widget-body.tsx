import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';

import { useUIContext } from '../../../shared/context/ui-context';
import type { MailDashboardCopy } from '../page.mock-data';
import {
  buildMonthGrid,
  clampYM,
  compareYM,
  getCalendarViewBounds,
  shiftYM,
  type YM,
  ymdKey,
} from './calendar-widget-utils';
import { findSpecialDay, resolveCalendarEventSeeds } from './calendar-seeds';

type Props = {
  copy: MailDashboardCopy;
};

type PopoverState = {
  y: number;
  m: number;
  d: number;
  top: number;
  left: number;
  width: number;
};

function computePopoverPosition(rect: DOMRect): Pick<PopoverState, 'top' | 'left' | 'width'> {
  const width = 292;
  const margin = 8;
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const estH = 280;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  let top = rect.bottom + 6;
  if (spaceBelow < estH && spaceAbove > spaceBelow) {
    top = Math.max(margin, rect.top - estH - 6);
  }
  return { top, left, width };
}

const CalendarDayCell = memo(function CalendarDayCell({
  y,
  m,
  d,
  isToday,
  isSelected,
  hasSpecial,
  holidayTitle,
  eventCount,
  onPick,
}: {
  y: number;
  m: number;
  d: number;
  isToday: boolean;
  isSelected: boolean;
  hasSpecial: boolean;
  holidayTitle?: string;
  eventCount: number;
  onPick: (e: React.MouseEvent<HTMLButtonElement>, y: number, m: number, d: number) => void;
}) {
  const holiday = hasSpecial ? 1 : 0;
  const evDots = Math.min(3 - holiday, eventCount);

  return (
    <button
      type="button"
      data-cal-day={`${y}-${m}-${d}`}
      title={hasSpecial && holidayTitle ? holidayTitle : undefined}
      className={`mail-dash-widget__n_drag mail-dash-cal__cell mail-dash-cal__cell--day ${isToday ? 'mail-dash-cal__cell--today' : ''} ${isSelected ? 'mail-dash-cal__cell--selected' : ''}`}
      onClick={(e) => onPick(e, y, m, d)}
      aria-pressed={isSelected}
    >
      <span className="mail-dash-cal__day-num">{d}</span>
      <span className="mail-dash-cal__dots" aria-hidden>
        {holiday + evDots === 0 ? (
          <span className="mail-dash-cal__dots-spacer" />
        ) : (
          <>
            {hasSpecial ? <span className="mail-dash-cal-dot mail-dash-cal-dot--holiday" /> : null}
            {Array.from({ length: evDots }, (_, i) => (
              <span key={i} className="mail-dash-cal-dot mail-dash-cal-dot--event" />
            ))}
          </>
        )}
      </span>
    </button>
  );
});

export function CalendarWidgetBody({ copy }: Props) {
  const { language, theme } = useUIContext();
  const anchorRef = useRef(new Date());
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  const bounds = useMemo(() => getCalendarViewBounds(anchorRef.current), []);
  const [view, setView] = useState<YM>(() => clampYM({ y: anchorRef.current.getFullYear(), m: anchorRef.current.getMonth() }, bounds.min, bounds.max));

  const eventsByYmd = useMemo(
    () => resolveCalendarEventSeeds(anchorRef.current, copy.mock.calendarEventSeeds),
    [copy.mock.calendarEventSeeds],
  );

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const goPrev = useCallback(() => {
    setView((v) => clampYM(shiftYM(v, -1), bounds.min, bounds.max));
  }, [bounds.min, bounds.max]);

  const goNext = useCallback(() => {
    setView((v) => clampYM(shiftYM(v, 1), bounds.min, bounds.max));
  }, [bounds.min, bounds.max]);

  const atMin = compareYM(view, bounds.min) <= 0;
  const atMax = compareYM(view, bounds.max) >= 0;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start || !e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0 && !atMin) goPrev();
      else if (dx < 0 && !atMax) goNext();
    },
    [atMin, atMax, goPrev, goNext],
  );

  const now = anchorRef.current;
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const { cells } = useMemo(() => buildMonthGrid(view.y, view.m), [view.y, view.m]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(view.y, view.m, 1)),
    [view.y, view.m, locale],
  );

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => setPopover(null), []);

  const openPopover = useCallback((e: React.MouseEvent<HTMLButtonElement>, y: number, m: number, d: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = computePopoverPosition(rect);
    setPopover((prev) => {
      if (prev && prev.y === y && prev.m === m && prev.d === d) return null;
      return { y, m, d, ...pos };
    });
  }, []);

  useEffect(() => {
    setPopover(null);
  }, [view.y, view.m]);

  useEffect(() => {
    if (!popover) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closePopover();
    };
    const onDocDown = (ev: MouseEvent) => {
      const el = popoverRef.current;
      if (el && !el.contains(ev.target as Node)) closePopover();
    };
    const onScroll = () => closePopover();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [popover, closePopover]);

  const popoverSpecial = popover ? findSpecialDay(popover.m, popover.d, copy.mock.calendarSpecialDaySeeds) : undefined;
  const popoverEvents = popover ? eventsByYmd.get(ymdKey(popover.y, popover.m, popover.d)) ?? [] : [];

  const popoverDateLabel = useMemo(() => {
    if (!popover) return '';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(popover.y, popover.m, popover.d));
  }, [popover, locale]);

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <div
      className="mail-dash-widget__cal mail-dash-cal"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mail-dash-cal__toolbar">
        <button
          type="button"
          className="mail-dash-cal__nav mail-dash-widget__n_drag"
          onClick={goPrev}
          disabled={atMin}
          aria-label={copy.mock.calendarPrevMonth}
          title={copy.mock.calendarPrevMonth}
        >
          <LuChevronLeft size={14} aria-hidden />
        </button>
        <div className="mail-dash-cal__toolbar-mid">
          <p className="mail-dash-cal__month-title" aria-live="polite">
            {monthTitle}
          </p>
        </div>
        <button
          type="button"
          className="mail-dash-cal__nav mail-dash-widget__n_drag"
          onClick={goNext}
          disabled={atMax}
          aria-label={copy.mock.calendarNextMonth}
          title={copy.mock.calendarNextMonth}
        >
          <LuChevronRight size={16} aria-hidden />
        </button>
      </div>

      <div className="mail-dash-cal__scroll">
        <div className="mail-dash-cal__weekdays" role="row">
          {copy.mock.calendarWeekdays.map((label, i) => (
            <span key={`${i}-${label}`} className="mail-dash-cal__weekday">
              {label}
            </span>
          ))}
        </div>
        <div className="mail-dash-cal__grid" role="grid">
          {cells.map((cell, idx) => {
            if (cell.kind === 'blank') {
              return <div key={`b-${idx}`} className="mail-dash-cal__cell mail-dash-cal__cell--blank" aria-hidden />;
            }
            const d = cell.d;
            const key = ymdKey(view.y, view.m, d);
            const evs = eventsByYmd.get(key) ?? [];
            const sp = findSpecialDay(view.m, d, copy.mock.calendarSpecialDaySeeds);
            const isToday = view.y === todayY && view.m === todayM && d === todayD;
            const isSelected =
              popover != null && popover.y === view.y && popover.m === view.m && popover.d === d;

            return (
              <CalendarDayCell
                key={key}
                y={view.y}
                m={view.m}
                d={d}
                isToday={isToday}
                isSelected={isSelected}
                hasSpecial={!!sp}
                holidayTitle={sp?.title}
                eventCount={evs.length}
                onPick={openPopover}
              />
            );
          })}
        </div>
      </div>

      {portalTarget && popover
        ? createPortal(
            <div
              ref={popoverRef}
              className={`mail-dash-cal-popover theme-${theme}`}
              style={{
                position: 'fixed',
                top: popover.top,
                left: popover.left,
                width: popover.width,
                zIndex: 4000,
              }}
              role="dialog"
              aria-label={popoverDateLabel}
            >
              <div className="mail-dash-cal-popover__head">
                <div className="mail-dash-cal-popover__head-text">
                  <p className="mail-dash-cal-popover__date">{popoverDateLabel}</p>
                </div>
                <button
                  type="button"
                  className="mail-dash-cal-popover__close mail-dash-widget__n_drag"
                  onClick={closePopover}
                  aria-label={copy.mock.calendarClosePopover}
                >
                  <LuX size={16} aria-hidden />
                </button>
              </div>
              <div className="mail-dash-cal-popover__body">
                {popoverSpecial ? (
                  <section className="mail-dash-cal-popover__section mail-dash-cal-popover__section--holiday">
                    <p className="mail-dash-cal-popover__sec-title">{copy.mock.calendarSectionHoliday}</p>
                    <p className="mail-dash-cal-popover__holiday-title">{popoverSpecial.title}</p>
                    <p className="mail-dash-cal-popover__holiday-desc">{popoverSpecial.description}</p>
                  </section>
                ) : null}
                <section className="mail-dash-cal-popover__section mail-dash-cal-popover__section--events">
                  <p className="mail-dash-cal-popover__sec-title">{copy.mock.calendarSectionEvents}</p>
                  {popoverEvents.length === 0 ? (
                    <p className="mail-dash-cal-popover__empty">{copy.mock.calendarNoEvents}</p>
                  ) : (
                    <ul className="mail-dash-cal-popover__events">
                      {popoverEvents.map((ev, i) => (
                        <li key={`${ev.time}-${ev.title}-${i}`} className="mail-dash-cal-popover__event">
                          <span className="mail-dash-cal-popover__ev-time">{ev.time}</span>
                          <span className="mail-dash-cal-popover__ev-title">{ev.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}
