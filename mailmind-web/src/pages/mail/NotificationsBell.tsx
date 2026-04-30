import { useCallback, useEffect, useRef, useState } from 'react';
import { LuBell, LuCheckCheck } from 'react-icons/lu';
import { notificationsApi, type ApiNotification } from '../../shared/api/notifications';
import { useAuth } from '../../shared/context/auth-context';

const POLL_INTERVAL_MS = 30_000;

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'şimdi';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
    if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)} sa önce`;
    if (diffSec < 7 * 86_400) return `${Math.floor(diffSec / 86_400)} gün önce`;
    return d.toLocaleDateString('tr-TR');
  } catch {
    return iso;
  }
}

export function NotificationsBell() {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Polling unread count (lightweight ping; full list lazy-loaded on open)
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    const tick = async () => {
      // Sekme arka plandaysa atla (gereksiz network)
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await notificationsApi.unreadCount(accessToken);
        if (!cancelled) setCount(res.count);
      } catch {
        // sessizce yut — bildirim sayacı kritik değil
      }
    };

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    // Sekmeye dönünce hemen tazele (uzun bir aradan sonra ilk-anda gözüksün)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [accessToken]);

  // Outside click + Escape kapatır
  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const loadList = useCallback(async () => {
    if (!accessToken) return;
    setLoadingList(true);
    setError(null);
    try {
      const list = await notificationsApi.list(accessToken, { limit: 50 });
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? 'Bildirimler yüklenemedi');
    } finally {
      setLoadingList(false);
    }
  }, [accessToken]);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) loadList();
      return next;
    });
  };

  // Dropdown açıkken liste'yi periyodik tazele — yeni reminder fire'ları
  // anında görünsün.
  useEffect(() => {
    if (!open || !accessToken) return;
    const id = setInterval(() => {
      loadList();
    }, 15_000);
    return () => clearInterval(id);
  }, [open, accessToken, loadList]);

  const handleMarkRead = async (n: ApiNotification) => {
    if (!accessToken || n.isRead) return;
    setItems((prev) =>
      prev.map((it) => (it.id === n.id ? { ...it, isRead: true, readAt: new Date().toISOString() } : it)),
    );
    setCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markRead(accessToken, n.id);
    } catch {
      // optimistic — fail sessiz
    }
  };

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true, readAt: new Date().toISOString() })));
    setCount(0);
    try {
      await notificationsApi.markAllRead(accessToken);
    } catch {
      /* noop */
    }
  };

  const badgeText = count > 99 ? '99+' : String(count);

  return (
    <div className="mail-dash-navbar__bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="mail-dash-navbar__bell"
        aria-label="Bildirimler"
        title="Bildirimler"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <LuBell size={20} aria-hidden />
        {count > 0 && <span className="mail-dash-navbar__bell-badge">{badgeText}</span>}
      </button>

      {open && (
        <div className="mail-dash-navbar__bell-menu" role="menu">
          <div className="mail-dash-navbar__bell-header">
            <span className="mail-dash-navbar__bell-title">Bildirimler</span>
            {items.some((it) => !it.isRead) && (
              <button
                type="button"
                className="mail-dash-navbar__bell-mark-all"
                onClick={handleMarkAllRead}
                title="Tümünü okundu işaretle"
              >
                <LuCheckCheck size={14} aria-hidden /> Tümü
              </button>
            )}
          </div>

          <div className="mail-dash-navbar__bell-list">
            {loadingList && (
              <div className="mail-dash-navbar__bell-empty">Yükleniyor…</div>
            )}
            {!loadingList && error && (
              <div className="mail-dash-navbar__bell-empty mail-dash-navbar__bell-empty--error">
                {error}
              </div>
            )}
            {!loadingList && !error && items.length === 0 && (
              <div className="mail-dash-navbar__bell-empty">Bildirim yok.</div>
            )}
            {!loadingList && !error &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  className={
                    'mail-dash-navbar__bell-item' +
                    (n.isRead ? ' is-read' : '')
                  }
                  onClick={() => handleMarkRead(n)}
                >
                  <div className="mail-dash-navbar__bell-item-title">{n.title}</div>
                  {n.body && (
                    <div className="mail-dash-navbar__bell-item-body">{n.body}</div>
                  )}
                  <div className="mail-dash-navbar__bell-item-meta">
                    <span>{n.type === 'REMINDER_FIRED' ? 'Anımsatıcı' : n.type === 'AI_PROPOSAL' ? 'AI önerisi' : 'Sistem'}</span>
                    <span>{formatTimestamp(n.createdAt)}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
