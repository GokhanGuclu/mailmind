import { useCallback, useMemo, useRef, useState } from 'react';
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuPencil,
  LuPlus,
  LuSparkles,
  LuTrash2,
} from 'react-icons/lu';

import { useUIContext } from '../../shared/context/ui-context';
import type { MailDashboardCopy } from './page.mock-data';
import { findSpecialDay } from './dashboard/calendar-seeds';
import {
  buildMonthWeeks,
  clampYM,
  compareYM,
  getCalendarViewBounds,
  shiftYM,
  type YM,
  ymdKey,
} from './dashboard/calendar-widget-utils';
import {
  CALENDAR_COLOR_PRESETS,
  useCalendarEntries,
  type CalendarEntryType,
} from './dashboard/calendar-events-store';

const DEFAULT_EVENT_COLOR = '#3b82f6';
const DEFAULT_TASK_COLOR = '#10b981';
function entryColor(type: CalendarEntryType, color?: string) {
  return color ?? (type === 'task' ? DEFAULT_TASK_COLOR : DEFAULT_EVENT_COLOR);
}

type Props = {
  copy: MailDashboardCopy;
};

function isWeekend(y: number, m: number, d: number): boolean {
  const wd = new Date(y, m, d).getDay();
  return wd === 0 || wd === 6;
}

type AddFormState = {
  title: string;
  time: string;
  type: CalendarEntryType;
  color: string;
  note: string;
};

const EMPTY_FORM: AddFormState = {
  title: '',
  time: '09:00',
  type: 'event',
  color: DEFAULT_EVENT_COLOR,
  note: '',
};

export function MailCalendarFullView({ copy }: Props) {
  const { language, theme } = useUIContext();
  const anchorRef = useRef(new Date());
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  const isTr = language === 'tr';

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

  const { addEntry, updateEntry, removeEntry, entriesMap } = useCalendarEntries();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);

  const eventsByYmd = useMemo(() => entriesMap(), [entriesMap]);

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
    setShowForm(false);
  }, [bounds.min, bounds.max, todayY, todayM, todayD]);

  const atMin = compareYM(view, bounds.min) <= 0;
  const atMax = compareYM(view, bounds.max) >= 0;

  const weeks = useMemo(() => buildMonthWeeks(view.y, view.m), [view.y, view.m]);

  const monthNameOnly = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(view.y, view.m, 1)),
    [view.y, view.m, locale],
  );

  const monthYearAria = `${monthNameOnly} ${view.y}`;

  const onPickDay = useCallback((y: number, m: number, d: number) => {
    setSelected({ y, m, d });
    setShowForm(false);
  }, []);

  const special = selected
    ? findSpecialDay(selected.m, selected.d, copy.mock.calendarSpecialDaySeeds)
    : undefined;
  const dayEntries = selected
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

  const isTodayYmd = (y: number, m: number, d: number) =>
    y === todayY && m === todayM && d === todayD;
  const isSelectedYmd = (y: number, m: number, d: number) =>
    selected !== null && selected.y === y && selected.m === m && selected.d === d;

  const handleAddSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selected || !form.title.trim()) return;
      if (editingId) {
        updateEntry(editingId, {
          y: selected.y,
          m: selected.m,
          d: selected.d,
          time: form.time,
          title: form.title.trim(),
          type: form.type,
          color: form.color,
          note: form.note.trim() || undefined,
        });
      } else {
        addEntry({
          y: selected.y,
          m: selected.m,
          d: selected.d,
          time: form.time,
          title: form.title.trim(),
          type: form.type,
          color: form.color,
          note: form.note.trim() || undefined,
        });
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
    },
    [selected, form, addEntry, updateEntry, editingId],
  );

  const startEdit = useCallback((entry: { id: string; time: string; title: string; type: CalendarEntryType; color?: string; note?: string }) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      time: entry.time,
      type: entry.type,
      color: entry.color ?? (entry.type === 'task' ? DEFAULT_TASK_COLOR : DEFAULT_EVENT_COLOR),
      note: entry.note ?? '',
    });
    setShowForm(true);
  }, []);

  const cancelForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const labels = {
    addBtn: isTr ? 'Etkinlik / Görev Ekle' : 'Add Event / Task',
    cancelBtn: isTr ? 'İptal' : 'Cancel',
    saveBtn: isTr ? 'Kaydet' : 'Save',
    titlePlaceholder: isTr ? 'Başlık…' : 'Title…',
    notePlaceholder: isTr ? 'Açıklama (isteğe bağlı)…' : 'Description (optional)…',
    typeEvent: isTr ? 'Etkinlik' : 'Event',
    typeTask: isTr ? 'Görev' : 'Task',
    sectionEntries: isTr ? 'Etkinlik ve Görevler' : 'Events & Tasks',
    colorLabel: isTr ? 'Renk' : 'Color',
    typeLabel: isTr ? 'Tür' : 'Type',
    editBtn: isTr ? 'Düzenle' : 'Edit',
    formEditTitle: isTr ? 'Düzenle' : 'Edit',
    formAddTitle: isTr ? 'Yeni Kayıt' : 'New Entry',
  };

  const setFormType = (type: CalendarEntryType) => {
    setForm((f) => {
      const nextColor =
        f.color === DEFAULT_EVENT_COLOR || f.color === DEFAULT_TASK_COLOR
          ? type === 'task'
            ? DEFAULT_TASK_COLOR
            : DEFAULT_EVENT_COLOR
          : f.color;
      return { ...f, type, color: nextColor };
    });
  };

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
          <div className="mail-cal-full__grid" role="grid" aria-colcount={8}>
            <div className="mail-cal-full__weekday-row" role="row">
              <div className="mail-cal-full__weekday mail-cal-full__weekday--wk" role="columnheader" aria-label={isTr ? 'Hafta' : 'Week'}>
                {isTr ? 'HF' : 'WK'}
              </div>
              {copy.mock.calendarWeekdays.map((label, i) => (
                <div key={`wd-${i}-${label}`} className="mail-cal-full__weekday" role="columnheader">
                  {label}
                </div>
              ))}
            </div>
            {weeks.map((wk, wi) => (
              <div key={`wk-${wi}`} className="mail-cal-full__week-row" role="row">
                <div className="mail-cal-full__week-num" role="rowheader" aria-label={`${isTr ? 'Hafta' : 'Week'} ${wk.weekNumber}`}>
                  {wk.weekNumber}
                </div>
                {wk.days.map((cell) => {
                  const { y, m, d } = cell;
                  const key = ymdKey(y, m, d);
                  const evs = eventsByYmd.get(key) ?? [];
                  const sp = findSpecialDay(m, d, copy.mock.calendarSpecialDaySeeds);
                  const today = isTodayYmd(y, m, d);
                  const sel = isSelectedYmd(y, m, d);
                  const weekend = isWeekend(y, m, d);
                  const other = cell.kind === 'other';

                  if (other) {
                    return (
                      <div
                        key={key}
                        role="gridcell"
                        aria-disabled
                        className={`mail-cal-full__cell mail-cal-full__cell--day mail-cal-full__cell--other ${sp ? 'mail-cal-full__cell--has-special' : ''} ${weekend ? 'mail-cal-full__cell--weekend' : ''}`}
                      >
                        <span className="mail-cal-full__day-num">{d}</span>
                        {sp ? (
                          <div className="mail-cal-full__special-in-cell" title={sp.title}>
                            <LuSparkles size={12} className="mail-cal-full__special-in-cell-icon" aria-hidden />
                            <span className="mail-cal-full__special-in-cell-text">{sp.title}</span>
                          </div>
                        ) : null}
                        {evs.length > 0 ? (
                          <ul className="mail-cal-full__ev-chips" aria-hidden>
                            {evs.slice(0, 2).map((ev, i) => (
                              <li
                                key={`${ev.time}-${i}`}
                                className={`mail-cal-full__ev-chip mail-cal-full__ev-chip--${ev.type}`}
                                style={{
                                  borderLeftColor: entryColor(ev.type, ev.color),
                                  ['--entry-color' as string]: entryColor(ev.type, ev.color),
                                }}
                              >
                                <span className="mail-cal-full__ev-chip-time">{ev.time}</span>
                                <span className="mail-cal-full__ev-chip-title">{ev.title}</span>
                              </li>
                            ))}
                            {evs.length > 2 ? (
                              <li className="mail-cal-full__ev-chip mail-cal-full__ev-chip--more">+{evs.length - 2}</li>
                            ) : null}
                          </ul>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      className={`mail-cal-full__cell mail-cal-full__cell--day ${sp ? 'mail-cal-full__cell--has-special' : ''} ${today ? 'mail-cal-full__cell--today' : ''} ${sel ? 'mail-cal-full__cell--selected' : ''} ${weekend ? 'mail-cal-full__cell--weekend' : ''}`}
                      onClick={() => onPickDay(y, m, d)}
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
                            <li
                              key={`${ev.time}-${i}`}
                              className={`mail-cal-full__ev-chip mail-cal-full__ev-chip--${ev.type}`}
                              style={{
                                borderLeftColor: entryColor(ev.type, ev.color),
                                ['--entry-color' as string]: entryColor(ev.type, ev.color),
                              }}
                            >
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
            ))}
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
                <div className="mail-cal-full__block-header">
                  <h3 className="mail-cal-full__block-title">{labels.sectionEntries}</h3>
                  {!showForm ? (
                    <button
                      type="button"
                      className="mail-cal-full__add-btn"
                      onClick={() => setShowForm(true)}
                      aria-label={labels.addBtn}
                      title={labels.addBtn}
                    >
                      <LuPlus size={15} aria-hidden />
                      <span>{labels.addBtn}</span>
                    </button>
                  ) : null}
                </div>

                {showForm ? (
                  <form className="mail-cal-full__add-form" onSubmit={handleAddSubmit}>
                    <p className="mail-cal-full__form-title">
                      {editingId ? labels.formEditTitle : labels.formAddTitle}
                    </p>
                    <div className="mail-cal-full__add-form-row">
                      <input
                        className="mail-cal-full__add-input"
                        type="text"
                        placeholder={labels.titlePlaceholder}
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        autoFocus
                        maxLength={120}
                        required
                      />
                    </div>
                    <div className="mail-cal-full__add-form-row">
                      <textarea
                        className="mail-cal-full__add-input mail-cal-full__add-textarea"
                        placeholder={labels.notePlaceholder}
                        value={form.note}
                        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                        rows={2}
                        maxLength={1000}
                      />
                    </div>
                    <div className="mail-cal-full__add-form-row">
                      <input
                        className="mail-cal-full__add-input mail-cal-full__add-input--time"
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      />
                    </div>
                    <div className="mail-cal-full__add-form-row mail-cal-full__add-form-row--labeled">
                      <span className="mail-cal-full__color-label">{labels.typeLabel}</span>
                      <div className="mail-cal-full__type-toggle" role="group">
                        <button
                          type="button"
                          className={`mail-cal-full__type-btn ${form.type === 'event' ? 'mail-cal-full__type-btn--active' : ''}`}
                          onClick={() => setFormType('event')}
                        >
                          {labels.typeEvent}
                        </button>
                        <button
                          type="button"
                          className={`mail-cal-full__type-btn ${form.type === 'task' ? 'mail-cal-full__type-btn--active' : ''}`}
                          onClick={() => setFormType('task')}
                        >
                          {labels.typeTask}
                        </button>
                      </div>
                    </div>
                    <div className="mail-cal-full__add-form-row mail-cal-full__add-form-row--labeled">
                      <span className="mail-cal-full__color-label">{labels.colorLabel}</span>
                      <div className="mail-cal-full__color-swatches" role="group" aria-label={labels.colorLabel}>
                        {CALENDAR_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            className={`mail-cal-full__color-swatch ${form.color === preset.value ? 'mail-cal-full__color-swatch--active' : ''}`}
                            style={{ background: preset.value }}
                            onClick={() => setForm((f) => ({ ...f, color: preset.value }))}
                            aria-label={preset.label}
                            aria-pressed={form.color === preset.value}
                            title={preset.label}
                          />
                        ))}
                        <label className="mail-cal-full__color-swatch mail-cal-full__color-swatch--custom" title={isTr ? 'Özel renk' : 'Custom color'}>
                          <input
                            type="color"
                            value={form.color}
                            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                            aria-label={isTr ? 'Özel renk seç' : 'Pick custom color'}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="mail-cal-full__add-form-row mail-cal-full__add-form-actions">
                      <button
                        type="button"
                        className="mail-cal-full__btn mail-cal-full__btn--ghost mail-cal-full__btn--sm"
                        onClick={cancelForm}
                      >
                        {labels.cancelBtn}
                      </button>
                      <button
                        type="submit"
                        className="mail-cal-full__btn mail-cal-full__btn--accent mail-cal-full__btn--sm"
                        disabled={!form.title.trim()}
                      >
                        {labels.saveBtn}
                      </button>
                    </div>
                  </form>
                ) : null}

                {dayEntries.length === 0 && !showForm ? (
                  <div className="mail-cal-full__events-empty">
                    <p className="mail-cal-full__empty-msg">{copy.mock.calendarNoEvents}</p>
                  </div>
                ) : (
                  <ul className="mail-cal-full__event-list">
                    {dayEntries.map((ev) => {
                      const c = entryColor(ev.type, ev.color);
                      const isEditing = editingId === ev.id;
                      return (
                      <li
                        key={ev.id}
                        className={`mail-cal-full__event-row mail-cal-full__event-row--${ev.type} ${isEditing ? 'mail-cal-full__event-row--editing' : ''}`}
                        style={{ ['--entry-color' as string]: c }}
                      >
                        <span className="mail-cal-full__event-type-dot" aria-hidden style={{ background: c }} />
                        <span className="mail-cal-full__event-time-badge">{ev.time}</span>
                        <div className="mail-cal-full__event-body">
                          <span className="mail-cal-full__event-title">{ev.title}</span>
                          {ev.note ? (
                            <p className="mail-cal-full__event-note">{ev.note}</p>
                          ) : null}
                        </div>
                        <div className="mail-cal-full__event-actions">
                          <button
                            type="button"
                            className="mail-cal-full__event-action"
                            onClick={() => startEdit(ev)}
                            aria-label={labels.editBtn}
                            title={labels.editBtn}
                          >
                            <LuPencil size={13} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="mail-cal-full__event-action mail-cal-full__event-action--danger"
                            onClick={() => removeEntry(ev.id)}
                            aria-label={isTr ? 'Sil' : 'Delete'}
                            title={isTr ? 'Sil' : 'Delete'}
                          >
                            <LuTrash2 size={13} aria-hidden />
                          </button>
                        </div>
                      </li>
                      );
                    })}
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
