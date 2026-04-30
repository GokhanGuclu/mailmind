import { useCallback, useEffect, useState } from 'react';
import {
  LuCalendarClock,
  LuCheck,
  LuCircleAlert,
  LuListTodo,
  LuPlay,
  LuPlus,
  LuRefreshCw,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import { useAuth } from '../../shared/context/auth-context';
import {
  tasksApi,
  type ApiTask,
  type CreateTaskPayload,
  type TaskPriority,
} from '../../shared/api/tasks';
import './mail-reminders.css'; // ortak modal + card stilleri yeniden kullanılır

type FormMode = 'closed' | 'create';

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

function statusLabel(s: ApiTask['status']): string {
  switch (s) {
    case 'PROPOSED':    return 'AI önerisi';
    case 'PENDING':     return 'Yapılacak';
    case 'IN_PROGRESS': return 'Devam ediyor';
    case 'DONE':        return 'Tamamlandı';
    case 'CANCELLED':   return 'İptal';
  }
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

export function MailTasksPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('closed');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const list = await tasksApi.list(accessToken);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? 'Görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      load();
    }, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  const setStatus = async (t: ApiTask, status: ApiTask['status']) => {
    if (!accessToken || pendingId) return;
    setPendingId(t.id);
    try {
      const updated = await tasksApi.update(accessToken, t.id, { status });
      setItems((prev) => prev.map((it) => (it.id === t.id ? updated : it)));
    } catch (e: any) {
      setError(e?.message ?? 'Güncelleme başarısız');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (t: ApiTask) => {
    if (!accessToken || pendingId) return;
    if (!window.confirm(`"${t.title}" görevini silmek istediğine emin misin?`)) return;
    setPendingId(t.id);
    try {
      await tasksApi.remove(accessToken, t.id);
      setItems((prev) => prev.filter((it) => it.id !== t.id));
    } catch (e: any) {
      setError(e?.message ?? 'Silme başarısız');
    } finally {
      setPendingId(null);
    }
  };

  // Group: PROPOSED ayrı (uyarı), aktif (PENDING+IN_PROGRESS), tamamlanan, iptal
  const groups = {
    proposed: items.filter((t) => t.status === 'PROPOSED'),
    active: items.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'),
    done: items.filter((t) => t.status === 'DONE'),
    cancelled: items.filter((t) => t.status === 'CANCELLED'),
  };

  // ─── Card render ────────────────────────────────────────────────────────

  const renderCard = (t: ApiTask) => {
    const isProposed = t.status === 'PROPOSED';
    const isActive = t.status === 'PENDING' || t.status === 'IN_PROGRESS';
    const isInProgress = t.status === 'IN_PROGRESS';
    const isDone = t.status === 'DONE';

    return (
      <article key={t.id} className={`reminders-card reminders-card--${t.status.toLowerCase()}`}>
        <header className="reminders-card__head">
          <span className="reminders-card__kind">
            <LuListTodo size={12} /> Görev
          </span>
          <span className="reminders-card__status">{statusLabel(t.status)}</span>
        </header>
        <h3 className="reminders-card__title">{t.title}</h3>
        {t.notes && <p className="reminders-card__notes">{t.notes}</p>}
        <dl className="reminders-card__meta">
          <dt>Öncelik</dt>
          <dd>
            <span
              className={`mail-tasks-priority mail-tasks-priority--${t.priority.toLowerCase()}`}
            >
              {PRIORITY_LABEL[t.priority]}
            </span>
          </dd>
          {t.dueAt && (
            <>
              <dt>Son tarih</dt>
              <dd>{formatIso(t.dueAt)}</dd>
            </>
          )}
          {t.rrule && (
            <>
              <dt>Tekrar</dt>
              <dd className="reminders-card__rrule">{t.rrule}</dd>
            </>
          )}
          {t.aiAnalysisId && (
            <>
              <dt>Kaynak</dt>
              <dd>AI çıkarımı</dd>
            </>
          )}
        </dl>
        <div className="reminders-card__actions">
          {isProposed && (
            <a
              href="/mail/oneriler"
              className="reminders-card__btn"
              title="AI Önerileri sayfasında onayla/reddet"
            >
              Onayla / reddet
            </a>
          )}
          {isActive && !isInProgress && (
            <button
              type="button"
              className="reminders-card__btn"
              onClick={() => setStatus(t, 'IN_PROGRESS')}
              disabled={pendingId === t.id}
            >
              <LuPlay size={14} /> Başla
            </button>
          )}
          {isActive && (
            <button
              type="button"
              className="reminders-card__btn"
              onClick={() => setStatus(t, 'DONE')}
              disabled={pendingId === t.id}
            >
              <LuCheck size={14} /> Tamamlandı
            </button>
          )}
          {isDone && (
            <button
              type="button"
              className="reminders-card__btn"
              onClick={() => setStatus(t, 'PENDING')}
              disabled={pendingId === t.id}
              title="Yeniden aç"
            >
              <LuPlay size={14} /> Yeniden aç
            </button>
          )}
          <button
            type="button"
            className="reminders-card__btn reminders-card__btn--danger"
            onClick={() => handleDelete(t)}
            disabled={pendingId === t.id}
          >
            <LuTrash2 size={14} /> Sil
          </button>
        </div>
      </article>
    );
  };

  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    list: ApiTask[],
    emptyHint?: string,
  ) => {
    if (list.length === 0 && !emptyHint) return null;
    return (
      <section className="reminders-page__section">
        <h3 className="reminders-page__section-title">
          {icon} {title}
          <span className="reminders-page__count">{list.length}</span>
        </h3>
        {list.length === 0 ? (
          <p className="reminders-page__group-empty">{emptyHint}</p>
        ) : (
          <div className="reminders-page__grid">{list.map(renderCard)}</div>
        )}
      </section>
    );
  };

  return (
    <div className="reminders-page">
      <div className="reminders-page__head">
        <div className="reminders-page__head-info">
          <h2 className="reminders-page__heading">
            <LuListTodo size={22} aria-hidden /> Görevler
          </h2>
          <p className="reminders-page__lead">
            Manuel görevler ve AI önerilerinden onayladıkların burada listelenir.
            AI'ın çıkardığı yeni görevler için <a href="/mail/oneriler">Öneriler sayfasına</a> bak.
          </p>
        </div>
        <div className="reminders-page__head-actions">
          <button
            type="button"
            className="reminders-page__refresh"
            onClick={load}
            disabled={loading}
          >
            <LuRefreshCw size={16} className={loading ? 'is-spinning' : ''} aria-hidden /> Yenile
          </button>
          <button
            type="button"
            className="reminders-page__create"
            onClick={() => setFormMode('create')}
          >
            <LuPlus size={16} aria-hidden /> Yeni görev
          </button>
        </div>
      </div>

      {error && (
        <div className="reminders-page__error">
          <LuCircleAlert size={16} /> {error}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="reminders-page__empty">
          <LuListTodo size={32} aria-hidden />
          <p>Henüz bir görev yok.</p>
          <span>"Yeni görev" butonuyla başla ya da AI Önerileri sayfasından onayla.</span>
        </div>
      )}

      {renderGroup(
        'AI önerisi (onay bekliyor)',
        <LuCircleAlert size={16} />,
        groups.proposed,
      )}
      {renderGroup('Aktif', <LuListTodo size={16} />, groups.active, 'Aktif görev yok.')}
      {renderGroup('Tamamlanan', <LuCheck size={16} />, groups.done)}
      {renderGroup('İptal edilen', <LuX size={16} />, groups.cancelled)}

      {formMode === 'create' && (
        <CreateTaskModal
          onClose={() => setFormMode('closed')}
          onCreated={(t) => {
            setItems((prev) => [t, ...prev]);
            setFormMode('closed');
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Create modal
// ────────────────────────────────────────────────────────────────────────────

function CreateTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: ApiTask) => void;
}) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState(''); // datetime-local
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!title.trim()) {
      setErr('Başlık zorunlu');
      return;
    }
    const payload: CreateTaskPayload = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
    };
    if (dueAt) payload.dueAt = new Date(dueAt).toISOString();

    setSubmitting(true);
    setErr(null);
    try {
      const created = await tasksApi.create(accessToken, payload);
      onCreated(created);
    } catch (e: any) {
      setErr(e?.message ?? 'Oluşturma başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reminders-modal-backdrop" onClick={onClose}>
      <div
        className="reminders-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="reminders-modal__head">
          <h3>Yeni görev</h3>
          <button
            type="button"
            className="reminders-modal__close"
            onClick={onClose}
            aria-label="Kapat"
          >
            <LuX size={18} />
          </button>
        </header>

        <form className="reminders-modal__body" onSubmit={handleSubmit}>
          <label className="reminders-modal__field">
            <span>Başlık</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              required
              autoFocus
            />
          </label>

          <label className="reminders-modal__field">
            <span>Not (opsiyonel)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={2}
            />
          </label>

          <label className="reminders-modal__field">
            <span>Son tarih (opsiyonel)</span>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>

          <label className="reminders-modal__field">
            <span>Öncelik</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
            </select>
          </label>

          {err && (
            <div className="reminders-modal__error">
              <LuCircleAlert size={14} /> {err}
            </div>
          )}

          <div className="reminders-modal__actions">
            <button type="button" className="reminders-modal__cancel" onClick={onClose}>
              İptal
            </button>
            <button
              type="submit"
              className="reminders-modal__submit"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor…' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// _ to avoid LuCalendarClock unused warning if we drop it later
void LuCalendarClock;
