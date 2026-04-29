import { useCallback, useEffect, useState } from 'react';
import {
  LuCalendarClock,
  LuCheck,
  LuCircleAlert,
  LuListTodo,
  LuRefreshCw,
  LuRepeat,
  LuSparkles,
  LuX,
} from 'react-icons/lu';
import { useAuth } from '../../shared/context/auth-context';
import {
  proposalsApi,
  type ApiReminderProposal,
  type ApiTaskProposal,
  type ProposalKind,
  type ProposalsList,
} from '../../shared/api/proposals';
import type { ApiCalendarEvent } from '../../shared/api/calendar';

const EMPTY: ProposalsList = { tasks: [], calendarEvents: [], reminders: [] };

function formatIso(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MailProposalsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<ProposalsList>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await proposalsApi.list(accessToken);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? 'Öneriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const total = data.tasks.length + data.calendarEvents.length + data.reminders.length;

  // ─── Action handlers ───────────────────────────────────────────────────

  const removeFromList = (kind: ProposalKind, id: string) => {
    setData((prev) => {
      switch (kind) {
        case 'task':
          return { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) };
        case 'calendar-event':
          return { ...prev, calendarEvents: prev.calendarEvents.filter((e) => e.id !== id) };
        case 'reminder':
          return { ...prev, reminders: prev.reminders.filter((r) => r.id !== id) };
      }
    });
  };

  const handleApprove = async (kind: ProposalKind, id: string) => {
    if (!accessToken || pendingId) return;
    setPendingId(id);
    try {
      await proposalsApi.approve(accessToken, kind, id);
      removeFromList(kind, id);
    } catch (e: any) {
      setError(e?.message ?? 'Onaylama başarısız');
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (kind: ProposalKind, id: string) => {
    if (!accessToken || pendingId) return;
    setPendingId(id);
    try {
      await proposalsApi.reject(accessToken, kind, id);
      removeFromList(kind, id);
    } catch (e: any) {
      setError(e?.message ?? 'Reddetme başarısız');
    } finally {
      setPendingId(null);
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderActions = (kind: ProposalKind, id: string) => (
    <div className="ai-proposals-card__actions">
      <button
        type="button"
        className="ai-proposals-card__btn ai-proposals-card__btn--approve"
        onClick={() => handleApprove(kind, id)}
        disabled={pendingId === id}
        title="Onayla"
      >
        <LuCheck size={16} aria-hidden />
        Onayla
      </button>
      <button
        type="button"
        className="ai-proposals-card__btn ai-proposals-card__btn--reject"
        onClick={() => handleReject(kind, id)}
        disabled={pendingId === id}
        title="Reddet"
      >
        <LuX size={16} aria-hidden />
        Reddet
      </button>
    </div>
  );

  const renderTask = (t: ApiTaskProposal) => (
    <article key={t.id} className="ai-proposals-card">
      <header className="ai-proposals-card__head">
        <span className="ai-proposals-card__kind ai-proposals-card__kind--task">
          <LuListTodo size={14} /> Görev
        </span>
        <span className={`ai-proposals-card__priority ai-proposals-card__priority--${t.priority.toLowerCase()}`}>
          {t.priority}
        </span>
      </header>
      <h3 className="ai-proposals-card__title">{t.title}</h3>
      {t.notes && <p className="ai-proposals-card__notes">{t.notes}</p>}
      <dl className="ai-proposals-card__meta">
        {t.dueAt && (
          <>
            <dt>Son tarih</dt>
            <dd>{formatIso(t.dueAt)}</dd>
          </>
        )}
        {t.rrule && (
          <>
            <dt>Tekrar</dt>
            <dd className="ai-proposals-card__rrule">
              <LuRepeat size={12} /> {t.rrule}
            </dd>
          </>
        )}
      </dl>
      {renderActions('task', t.id)}
    </article>
  );

  const renderCalendarEvent = (e: ApiCalendarEvent) => (
    <article key={e.id} className="ai-proposals-card">
      <header className="ai-proposals-card__head">
        <span className="ai-proposals-card__kind ai-proposals-card__kind--event">
          <LuCalendarClock size={14} /> Etkinlik
        </span>
      </header>
      <h3 className="ai-proposals-card__title">{e.title}</h3>
      {e.description && <p className="ai-proposals-card__notes">{e.description}</p>}
      <dl className="ai-proposals-card__meta">
        <dt>Tarih</dt>
        <dd>
          {e.isAllDay ? (
            <>
              {formatDateOnly(e.startAt)}{' '}
              <span className="ai-proposals-card__time-hint">
                · Tüm gün (saat belirsiz)
              </span>
            </>
          ) : (
            formatIso(e.startAt)
          )}
        </dd>
        {e.endAt && !e.isAllDay && (
          <>
            <dt>Bitiş</dt>
            <dd>{formatIso(e.endAt)}</dd>
          </>
        )}
        {e.location && (
          <>
            <dt>Yer</dt>
            <dd>{e.location}</dd>
          </>
        )}
        {(e as any).rrule && (
          <>
            <dt>Tekrar</dt>
            <dd className="ai-proposals-card__rrule">
              <LuRepeat size={12} /> {(e as any).rrule}
            </dd>
          </>
        )}
      </dl>
      {renderActions('calendar-event', e.id)}
    </article>
  );

  const renderReminder = (r: ApiReminderProposal) => (
    <article key={r.id} className="ai-proposals-card">
      <header className="ai-proposals-card__head">
        <span className="ai-proposals-card__kind ai-proposals-card__kind--reminder">
          <LuRepeat size={14} /> Anımsatıcı
        </span>
      </header>
      <h3 className="ai-proposals-card__title">{r.title}</h3>
      {r.notes && <p className="ai-proposals-card__notes">{r.notes}</p>}
      <dl className="ai-proposals-card__meta">
        {r.fireAt && (
          <>
            <dt>Tetiklenme</dt>
            <dd>{formatIso(r.fireAt)}</dd>
          </>
        )}
        {r.rrule && (
          <>
            <dt>Tekrar</dt>
            <dd className="ai-proposals-card__rrule">
              <LuRepeat size={12} /> {r.rrule}
            </dd>
          </>
        )}
        {r.nextFireAt && (
          <>
            <dt>Sıradaki</dt>
            <dd>{formatIso(r.nextFireAt)}</dd>
          </>
        )}
      </dl>
      {renderActions('reminder', r.id)}
    </article>
  );

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="ai-proposals-page">
      <div className="ai-proposals-page__head">
        <div className="ai-proposals-page__head-info">
          <h2 className="ai-proposals-page__heading">
            <LuSparkles size={22} aria-hidden /> AI Önerileri
          </h2>
          <p className="ai-proposals-page__lead">
            Mailleriniz analiz edildi. Aşağıdaki öğeleri onaylayarak takviminize, görevlerinize ya da
            anımsatıcılarınıza ekleyin; reddederseniz iptal edilirler.
          </p>
        </div>
        <button
          type="button"
          className="ai-proposals-page__refresh"
          onClick={load}
          disabled={loading}
          title="Yenile"
        >
          <LuRefreshCw size={16} className={loading ? 'is-spinning' : ''} aria-hidden /> Yenile
        </button>
      </div>

      {error && (
        <div className="ai-proposals-page__error">
          <LuCircleAlert size={16} /> {error}
        </div>
      )}

      {!loading && total === 0 && !error && (
        <div className="ai-proposals-page__empty">
          <LuSparkles size={32} aria-hidden />
          <p>Şu anda bekleyen öneri yok.</p>
          <span>Yeni mailler analiz edildiğinde burada görünecek.</span>
        </div>
      )}

      {data.calendarEvents.length > 0 && (
        <section className="ai-proposals-page__section">
          <h3 className="ai-proposals-page__section-title">
            <LuCalendarClock size={16} /> Takvim Etkinlikleri
            <span className="ai-proposals-page__count">{data.calendarEvents.length}</span>
          </h3>
          <div className="ai-proposals-page__grid">
            {data.calendarEvents.map(renderCalendarEvent)}
          </div>
        </section>
      )}

      {data.reminders.length > 0 && (
        <section className="ai-proposals-page__section">
          <h3 className="ai-proposals-page__section-title">
            <LuRepeat size={16} /> Anımsatıcılar
            <span className="ai-proposals-page__count">{data.reminders.length}</span>
          </h3>
          <div className="ai-proposals-page__grid">
            {data.reminders.map(renderReminder)}
          </div>
        </section>
      )}

      {data.tasks.length > 0 && (
        <section className="ai-proposals-page__section">
          <h3 className="ai-proposals-page__section-title">
            <LuListTodo size={16} /> Görevler
            <span className="ai-proposals-page__count">{data.tasks.length}</span>
          </h3>
          <div className="ai-proposals-page__grid">
            {data.tasks.map(renderTask)}
          </div>
        </section>
      )}
    </div>
  );
}
