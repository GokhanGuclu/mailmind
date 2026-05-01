import { useCallback, useEffect, useState } from 'react';
import { LuCircleAlert, LuMail, LuPause, LuPlay, LuRefreshCw } from 'react-icons/lu';
import { useAuth } from '../../shared/context/auth-context';
import { mailboxApi, type MailboxAccount, type MailboxAccountStatus } from '../../shared/api/mailbox';
import './mail-accounts.css';

function statusLabel(s: MailboxAccountStatus): string {
  switch (s) {
    case 'ACTIVE': return 'Aktif';
    case 'PAUSED': return 'Duraklatıldı';
    case 'PENDING': return 'Bekliyor';
    case 'REVOKED': return 'İptal';
    case 'ERROR': return 'Hata';
  }
}

export function MailAccountsPage() {
  const { accessToken, refreshMailboxAccounts } = useAuth();
  const [items, setItems] = useState<MailboxAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const list = await mailboxApi.listAccounts(accessToken);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? 'Hesaplar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  const handleToggle = async (acc: MailboxAccount) => {
    if (!accessToken || pendingId) return;
    if (acc.status !== 'ACTIVE' && acc.status !== 'PAUSED') return;
    setPendingId(acc.id);
    setError(null);
    try {
      const updated =
        acc.status === 'ACTIVE'
          ? await mailboxApi.pauseAccount(accessToken, acc.id)
          : await mailboxApi.resumeAccount(accessToken, acc.id);
      setItems((prev) => prev.map((it) => (it.id === acc.id ? updated : it)));
      // auth-context önbelleği de güncellensin (hasActiveMailbox bağımlı)
      await refreshMailboxAccounts();
    } catch (e: any) {
      setError(e?.message ?? 'İşlem başarısız');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main className="accounts-page">
      <header className="accounts-page__head">
        <div>
          <h2 className="accounts-page__heading">
            <LuMail size={20} aria-hidden /> Mailbox Hesapları
          </h2>
          <p className="accounts-page__lead">
            Bağlı e-posta hesaplarını yönet. Bir hesap geçici olarak çalışmıyorsa
            (örn. parola değişikliği, izin reddi) <strong>Duraklat</strong> diyerek
            arka plan senkronizasyonunu durdurabilirsin. Sorunu çözünce
            <strong> Devam ettir</strong> ile tekrar açarsın.
          </p>
        </div>
        <button
          type="button"
          className="accounts-page__refresh"
          onClick={() => load()}
          disabled={loading}
        >
          <LuRefreshCw size={14} className={loading ? 'is-spinning' : undefined} />
          Yenile
        </button>
      </header>

      {error && (
        <div className="accounts-page__error" role="alert">
          <LuCircleAlert size={16} /> {error}
        </div>
      )}

      <section className="accounts-page__list">
        {items.length === 0 && !loading ? (
          <div className="accounts-page__empty">Henüz bağlı bir hesap yok.</div>
        ) : (
          items.map((acc) => {
            const isActive = acc.status === 'ACTIVE';
            const isPaused = acc.status === 'PAUSED';
            const canToggle = isActive || isPaused;
            const statusCls = `account-card__status account-card__status--${acc.status.toLowerCase()}`;
            return (
              <article key={acc.id} className="account-card">
                <div className="account-card__main">
                  <div className="account-card__email">
                    {acc.email}
                    <span className={statusCls}>{statusLabel(acc.status)}</span>
                  </div>
                  <span className="account-card__provider">{acc.provider}</span>
                  {acc.displayName && <span className="account-card__display">{acc.displayName}</span>}
                </div>
                <div className="account-card__actions">
                  {canToggle ? (
                    <button
                      type="button"
                      className={
                        isPaused
                          ? 'account-card__btn account-card__btn--primary'
                          : 'account-card__btn'
                      }
                      onClick={() => handleToggle(acc)}
                      disabled={pendingId === acc.id}
                      title={isActive ? 'Bu hesabı duraklat' : 'Bu hesabı tekrar başlat'}
                    >
                      {isActive ? <LuPause size={14} /> : <LuPlay size={14} />}
                      {isActive ? 'Duraklat' : 'Devam ettir'}
                    </button>
                  ) : (
                    <span className="account-card__display">İşlem yok</span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
