import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { LuChevronLeft, LuChevronRight, LuPencil, LuPlus, LuTrash2, LuX } from 'react-icons/lu';

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
import { findSpecialDay } from './calendar-seeds';
import {
  CALENDAR_COLOR_PRESETS,
  useCalendarEntries,
  type CalendarEntryType,
} from './calendar-events-store';

const DEFAULT_EVENT_COLOR = '#3b82f6';
const DEFAULT_TASK_COLOR = '#10b981';
function entryColor(type: CalendarEntryType, color?: string) {
  return color ?? (type === 'task' ? DEFAULT_TASK_COLOR : DEFAULT_EVENT_COLOR);
}

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

  const { addEntry, updateEntry, removeEntry, entriesMap } = useCalendarEntries();
  const eventsByYmd = useMemo(() => entriesMap(), [entriesMap]);
  const isTr = language === 'tr';
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormTypeRaw] = useState<CalendarEntryType>('event');
  const [formColor, setFormColor] = useState<string>(DEFAULT_EVENT_COLOR);
  const setFormType = (t: CalendarEntryType) => {
    setFormTypeRaw(t);
    setFormColor((c) =>
      c === DEFAULT_EVENT_COLOR || c === DEFAULT_TASK_COLOR
        ? (t === 'task' ? DEFAULT_TASK_COLOR : DEFAULT_EVENT_COLOR)
        : c,
    );
  };
  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormTitle('');
    setFormNote('');
    setFormTime('09:00');
    setFormTypeRaw('event');
    setFormColor(DEFAULT_EVENT_COLOR);
  };
  const startEdit = (ev: { id: string; time: string; title: string; type: CalendarEntryType; color?: string; note?: string }) => {
    setEditingId(ev.id);
    setFormTitle(ev.title);
    setFormNote(ev.note ?? '');
    setFormTime(ev.time);
    setFormTypeRaw(ev.type);
    setFormColor(ev.color ?? (ev.type === 'task' ? DEFAULT_TASK_COLOR : DEFAULT_EVENT_COLOR));
    setFormOpen(true);
  };

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

  const closePopover = useCallback(() => {
    setPopover(null);
    setFormOpen(false);
    setFormTitle('');
  }, []);

  const openPopover = useCallback((e: React.MouseEvent<HTMLButtonElement>, y: number, m: number, d: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = computePopoverPosition(rect);
    setPopover((prev) => {
      if (prev && prev.y === y && prev.m === m && prev.d === d) {
        setFormOpen(false);
        setFormTitle('');
        return null;
      }
      setFormOpen(false);
      setFormTitle('');
      return { y, m, d, ...pos };
    });
  }, []);

  useEffect(() => {
    setPopover(null);
    setFormOpen(false);
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
                  <div className="mail-dash-cal-popover__sec-header">
                    <p className="mail-dash-cal-popover__sec-title">{isTr ? 'Etkinlik ve Görevler' : 'Events & Tasks'}</p>
                    {!formOpen ? (
                      <button
                        type="button"
                        className="mail-dash-cal-popover__add-btn mail-dash-widget__n_drag"
                        onClick={() => setFormOpen(true)}
                        aria-label={isTr ? 'Ekle' : 'Add'}
                        title={isTr ? 'Etkinlik / Görev ekle' : 'Add event / task'}
                      >
                        <LuPlus size={13} aria-hidden />
                        <span>{isTr ? 'Ekle' : 'Add'}</span>
                      </button>
                    ) : null}
                  </div>

                  {formOpen && popover ? (
                    <form
                      className="mail-dash-cal-popover__form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!formTitle.trim()) return;
                        const payload = {
                          y: popover.y,
                          m: popover.m,
                          d: popover.d,
                          time: formTime,
                          title: formTitle.trim(),
                          type: formType,
                          color: formColor,
                          note: formNote.trim() || undefined,
                        };
                        if (editingId) {
                          updateEntry(editingId, payload);
                        } else {
                          addEntry(payload);
                        }
                        resetForm();
                      }}
                    >
                      <p className="mail-dash-cal-popover__form-title">
                        {editingId ? (isTr ? 'Düzenle' : 'Edit') : (isTr ? 'Yeni Kayıt' : 'New Entry')}
                      </p>
                      <input
                        className="mail-dash-cal-popover__input mail-dash-widget__n_drag"
                        type="text"
                        placeholder={isTr ? 'Başlık…' : 'Title…'}
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        autoFocus
                        maxLength={120}
                        required
                      />
                      <textarea
                        className="mail-dash-cal-popover__input mail-dash-cal-popover__textarea mail-dash-widget__n_drag"
                        placeholder={isTr ? 'Açıklama (isteğe bağlı)…' : 'Description (optional)…'}
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        rows={2}
                        maxLength={1000}
                      />
                      <div className="mail-dash-cal-popover__form-row">
                        <input
                          className="mail-dash-cal-popover__input mail-dash-cal-popover__input--time mail-dash-widget__n_drag"
                          type="time"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                        />
                      </div>
                      <div className="mail-dash-cal-popover__labeled-row">
                        <span className="mail-dash-cal-popover__color-label">{isTr ? 'Tür' : 'Type'}</span>
                        <div className="mail-dash-cal-popover__type-toggle">
                          <button
                            type="button"
                            className={`mail-dash-cal-popover__type-btn mail-dash-widget__n_drag ${formType === 'event' ? 'mail-dash-cal-popover__type-btn--active' : ''}`}
                            onClick={() => setFormType('event')}
                          >
                            {isTr ? 'Etkinlik' : 'Event'}
                          </button>
                          <button
                            type="button"
                            className={`mail-dash-cal-popover__type-btn mail-dash-widget__n_drag ${formType === 'task' ? 'mail-dash-cal-popover__type-btn--active' : ''}`}
                            onClick={() => setFormType('task')}
                          >
                            {isTr ? 'Görev' : 'Task'}
                          </button>
                        </div>
                      </div>
                      <div className="mail-dash-cal-popover__color-row">
                        <span className="mail-dash-cal-popover__color-label">{isTr ? 'Renk' : 'Color'}</span>
                        <div className="mail-dash-cal-popover__color-swatches">
                          {CALENDAR_COLOR_PRESETS.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              className={`mail-dash-cal-popover__color-swatch mail-dash-widget__n_drag ${formColor === preset.value ? 'mail-dash-cal-popover__color-swatch--active' : ''}`}
                              style={{ background: preset.value }}
                              onClick={() => setFormColor(preset.value)}
                              aria-label={preset.label}
                              aria-pressed={formColor === preset.value}
                              title={preset.label}
                            />
                          ))}
                          <label className="mail-dash-cal-popover__color-swatch mail-dash-cal-popover__color-swatch--custom mail-dash-widget__n_drag" title={isTr ? 'Özel renk' : 'Custom'}>
                            <input
                              type="color"
                              value={formColor}
                              onChange={(e) => setFormColor(e.target.value)}
                              aria-label={isTr ? 'Özel renk seç' : 'Pick custom color'}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="mail-dash-cal-popover__form-actions">
                        <button
                          type="button"
                          className="mail-dash-cal-popover__btn mail-dash-cal-popover__btn--ghost mail-dash-widget__n_drag"
                          onClick={resetForm}
                        >
                          {isTr ? 'İptal' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="mail-dash-cal-popover__btn mail-dash-cal-popover__btn--accent mail-dash-widget__n_drag"
                          disabled={!formTitle.trim()}
                        >
                          {isTr ? 'Kaydet' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {popoverEvents.length === 0 && !formOpen ? (
                    <p className="mail-dash-cal-popover__empty">{copy.mock.calendarNoEvents}</p>
                  ) : popoverEvents.length > 0 ? (
                    <ul className="mail-dash-cal-popover__events">
                      {popoverEvents.map((ev) => {
                        const c = entryColor(ev.type, ev.color);
                        const isEditing = editingId === ev.id;
                        return (
                        <li
                          key={ev.id}
                          className={`mail-dash-cal-popover__event mail-dash-cal-popover__event--${ev.type} ${isEditing ? 'mail-dash-cal-popover__event--editing' : ''}`}
                          style={{ ['--entry-color' as string]: c, borderColor: `color-mix(in srgb, ${c} 35%, var(--border))` }}
                        >
                          <span className="mail-dash-cal-popover__ev-dot" aria-hidden style={{ background: c }} />
                          <span className="mail-dash-cal-popover__ev-time">{ev.time}</span>
                          <div className="mail-dash-cal-popover__ev-body">
                            <span className="mail-dash-cal-popover__ev-title">{ev.title}</span>
                            {ev.note ? (
                              <p className="mail-dash-cal-popover__ev-note">{ev.note}</p>
                            ) : null}
                          </div>
                          <div className="mail-dash-cal-popover__ev-actions">
                            <button
                              type="button"
                              className="mail-dash-cal-popover__ev-action mail-dash-widget__n_drag"
                              onClick={() => startEdit(ev)}
                              aria-label={isTr ? 'Düzenle' : 'Edit'}
                              title={isTr ? 'Düzenle' : 'Edit'}
                            >
                              <LuPencil size={12} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="mail-dash-cal-popover__ev-action mail-dash-cal-popover__ev-action--danger mail-dash-widget__n_drag"
                              onClick={() => removeEntry(ev.id)}
                              aria-label={isTr ? 'Sil' : 'Delete'}
                              title={isTr ? 'Sil' : 'Delete'}
                            >
                              <LuTrash2 size={12} aria-hidden />
                            </button>
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </section>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}
