import { useCallback, useEffect, useState } from 'react';
import {
  LuBell,
  LuCalendarClock,
  LuCircleAlert,
  LuPause,
  LuPlay,
  LuPlus,
  LuRefreshCw,
  LuRepeat,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import { useAuth } from '../../shared/context/auth-context';
import {
  remindersApi,
  type ApiReminder,
  type CreateReminderPayload,
} from '../../shared/api/reminders';
import './mail-reminders.css';

type FormMode = 'closed' | 'create';

const RRULE_PRESETS: { label: string; value: string }[] = [
  { label: 'Tek seferlik', value: '' },
  { label: 'Her gün', value: 'FREQ=DAILY' },
  { label: 'Her hafta — Pazartesi', value: 'FREQ=WEEKLY;BYDAY=MO' },
  { label: 'Her hafta — bugün', value: 'FREQ=WEEKLY' },
  { label: 'Her ay (aynı gün)', value: 'FREQ=MONTHLY' },
  { label: 'Her hafta sonu (Cmt+Paz)', value: 'FREQ=WEEKLY;BYDAY=SA,SU' },
];

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

function statusLabel(s: ApiReminder['status']): string {
  switch (s) {
    case 'ACTIVE': return 'Aktif';
    case 'PAUSED': return 'Duraklatıldı';
    case 'COMPLETED': return 'Tamamlandı';
    case 'CANCELLED': return 'İptal';
    case 'PROPOSED': return 'AI önerisi';
  }
}

export function MailRemindersPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ApiReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('closed');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const list = await remindersApi.list(accessToken);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? 'Anımsatıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePauseResume = async (r: ApiReminder) => {
    if (!accessToken || pendingId) return;
    const next = r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setPendingId(r.id);
    try {
      const updated = await remindersApi.update(accessToken, r.id, { status: next });
      setItems((prev) => prev.map((it) => (it.id === r.id ? updated : it)));
    } catch (e: any) {
      setError(e?.message ?? 'Güncelleme başarısız');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (r: ApiReminder) => {
    if (!accessToken || pendingId) return;
    if (!window.confirm(`"${r.title}" anımsatıcısını silmek istediğine emin misin?`)) return;
    setPendingId(r.id);
    try {
      await remindersApi.remove(accessToken, r.id);
      setItems((prev) => prev.filter((it) => it.id !== r.id));
    } catch (e: any) {
      setError(e?.message ?? 'Silme başarısız');
    } finally {
      setPendingId(null);
    }
  };

  // ─── Group by status ────────────────────────────────────────────────────
  const groups = {
    active: items.filter((r) => r.status === 'ACTIVE'),
    paused: items.filter((r) => r.status === 'PAUSED'),
    completed: items.filter((r) => r.status === 'COMPLETED'),
    cancelled: items.filter((r) => r.status === 'CANCELLED'),
  };

  // ─── Render helpers ─────────────────────────────────────────────────────

  const renderCard = (r: ApiReminder) => {
    const isActive = r.status === 'ACTIVE';
    const isPaused = r.status === 'PAUSED';
    const canToggle = isActive || isPaused;
    return (
      <article key={r.id} className={`reminders-card reminders-card--${r.status.toLowerCase()}`}>
        <header className="reminders-card__head">
          <span className={r.rrule ? 'reminders-card__kind reminders-card__kind--recurring' : 'reminders-card__kind'}>
            {r.rrule ? <><LuRepeat size={12} /> Tekrarlı</> : <><LuCalendarClock size={12} /> Tek seferlik</>}
          </span>
          <span className="reminders-card__status">{statusLabel(r.status)}</span>
        </header>
        <h3 className="reminders-card__title">{r.title}</h3>
        {r.notes && <p className="reminders-card__notes">{r.notes}</p>}
        <dl className="reminders-card__meta">
          {r.rrule ? (
            <>
              <dt>Kural</dt>
              <dd className="reminders-card__rrule">{r.rrule}</dd>
            </>
          ) : (
            <>
              <dt>Zaman</dt>
              <dd>{formatIso(r.fireAt)}</dd>
            </>
          )}
          {r.nextFireAt && r.status === 'ACTIVE' && (
            <>
              <dt>Sıradaki</dt>
              <dd>{formatIso(r.nextFireAt)}</dd>
            </>
          )}
          {r.lastFiredAt && (
            <>
              <dt>Son tetikleme</dt>
              <dd>{formatIso(r.lastFiredAt)}</dd>
            </>
          )}
          {r.aiAnalysisId && (
            <>
              <dt>Kaynak</dt>
              <dd>AI çıkarımı</dd>
            </>
          )}
        </dl>
        <div className="reminders-card__actions">
          {canToggle && (
            <button
              type="button"
              className="reminders-card__btn"
              onClick={() => handlePauseResume(r)}
              disabled={pendingId === r.id}
              title={isActive ? 'Duraklat' : 'Devam ettir'}
            >
              {isActive ? <LuPause size={14} /> : <LuPlay size={14} />}
              {isActive ? 'Duraklat' : 'Devam ettir'}
            </button>
          )}
          <button
            type="button"
            className="reminders-card__btn reminders-card__btn--danger"
            onClick={() => handleDelete(r)}
            disabled={pendingId === r.id}
            title="Sil"
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
    list: ApiReminder[],
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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="reminders-page">
      <div className="reminders-page__head">
        <div className="reminders-page__head-info">
          <h2 className="reminders-page__heading">
            <LuBell size={22} aria-hidden /> Anımsatıcılar
          </h2>
          <p className="reminders-page__lead">
            Manuel olarak veya AI önerilerinden onayladığın anımsatıcılar burada listelenir.
            Aktif olanlar zamanı geldiğinde size bildirim gönderir.
          </p>
        </div>
        <div className="reminders-page__head-actions">
          <button
            type="button"
            className="reminders-page__refresh"
            onClick={load}
            disabled={loading}
            title="Yenile"
          >
            <LuRefreshCw size={16} className={loading ? 'is-spinning' : ''} aria-hidden /> Yenile
          </button>
          <button
            type="button"
            className="reminders-page__create"
            onClick={() => setFormMode('create')}
          >
            <LuPlus size={16} aria-hidden /> Yeni anımsatıcı
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
          <LuBell size={32} aria-hidden />
          <p>Henüz bir anımsatıcı yok.</p>
          <span>"Yeni anımsatıcı" butonuyla başla ya da AI Önerileri sayfasındaki bir anımsatıcıyı onayla.</span>
        </div>
      )}

      {renderGroup('Aktif', <LuPlay size={16} />, groups.active, 'Aktif anımsatıcı yok.')}
      {renderGroup('Duraklatılan', <LuPause size={16} />, groups.paused)}
      {renderGroup('Tamamlanan', <LuCalendarClock size={16} />, groups.completed)}
      {renderGroup('İptal edilen', <LuX size={16} />, groups.cancelled)}

      {formMode === 'create' && (
        <CreateReminderModal
          onClose={() => setFormMode('closed')}
          onCreated={(r) => {
            setItems((prev) => [r, ...prev]);
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

function CreateReminderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: ApiReminder) => void;
}) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrenceMode, setRecurrenceMode] = useState<'one-shot' | 'recurring'>('one-shot');
  const [fireAt, setFireAt] = useState(''); // datetime-local string
  const [rrulePreset, setRrulePreset] = useState(RRULE_PRESETS[1].value);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!title.trim()) {
      setErr('Başlık zorunlu');
      return;
    }
    if (recurrenceMode === 'one-shot' && !fireAt) {
      setErr('Tarih/saat zorunlu');
      return;
    }
    if (recurrenceMode === 'recurring' && !rrulePreset) {
      setErr('Tekrar kuralı seç');
      return;
    }

    const payload: CreateReminderPayload = {
      title: title.trim(),
      notes: notes.trim() || undefined,
    };
    if (recurrenceMode === 'one-shot') {
      // datetime-local → ISO
      payload.fireAt = new Date(fireAt).toISOString();
    } else {
      payload.rrule = rrulePreset;
      // İlk tetikleme zamanı opsiyonel; verilirse fireAt ile DTSTART rolü oynar
      if (fireAt) payload.fireAt = new Date(fireAt).toISOString();
    }

    setSubmitting(true);
    setErr(null);
    try {
      const created = await remindersApi.create(accessToken, payload);
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
          <h3>Yeni anımsatıcı</h3>
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

          <div className="reminders-modal__tabs">
            <button
              type="button"
              className={recurrenceMode === 'one-shot' ? 'is-active' : ''}
              onClick={() => setRecurrenceMode('one-shot')}
            >
              <LuCalendarClock size={14} /> Tek seferlik
            </button>
            <button
              type="button"
              className={recurrenceMode === 'recurring' ? 'is-active' : ''}
              onClick={() => setRecurrenceMode('recurring')}
            >
              <LuRepeat size={14} /> Tekrarlı
            </button>
          </div>

          {recurrenceMode === 'one-shot' ? (
            <label className="reminders-modal__field">
              <span>Tarih ve saat</span>
              <input
                type="datetime-local"
                value={fireAt}
                onChange={(e) => setFireAt(e.target.value)}
                required
              />
            </label>
          ) : (
            <>
              <label className="reminders-modal__field">
                <span>Tekrar kuralı</span>
                <select
                  value={rrulePreset}
                  onChange={(e) => setRrulePreset(e.target.value)}
                >
                  {RRULE_PRESETS.filter((p) => p.value).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="reminders-modal__field">
                <span>Başlangıç (opsiyonel)</span>
                <input
                  type="datetime-local"
                  value={fireAt}
                  onChange={(e) => setFireAt(e.target.value)}
                />
              </label>
            </>
          )}

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
