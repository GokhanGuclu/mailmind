import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js';
import Info from 'lucide-react/dist/esm/icons/info.js';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2.js';
import Mail from 'lucide-react/dist/esm/icons/mail.js';
import Server from 'lucide-react/dist/esm/icons/server.js';
import gmailSvg from '../../assets/gmail.svg';
import icloudSvg from '../../assets/icloud.svg';
import outlookSvg from '../../assets/outlook.svg';
import { useUIContext } from '../../shared/context/ui-context';
import { useAuth } from '../../shared/context/auth-context';
import { integrationsApi } from '../../shared/api/integrations';
import { ApiError } from '../../shared/api/client';
import { connectMailPageContent } from './page.mock-data';
import './styles.css';

export function ConnectMailPage() {
  const { language, theme } = useUIContext();
  const t = connectMailPageContent[language];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken, refreshMailboxAccounts, hasActiveMailbox } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  // Handle the OAuth callback redirect from the backend
  useEffect(() => {
    const status = searchParams.get('gmail');
    if (!status) return;

    if (status === 'connected') {
      const email = searchParams.get('email');
      setSuccessEmail(email);
      setError(null);
      // Clean the query string and refresh accounts
      void (async () => {
        await refreshMailboxAccounts();
        setSearchParams({}, { replace: true });
      })();
    } else if (status === 'error') {
      const reason = searchParams.get('reason') ?? 'unknown';
      setError(reason);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, refreshMailboxAccounts, setSearchParams]);

  // Once accounts include an ACTIVE one, bounce to /mail
  useEffect(() => {
    if (hasActiveMailbox) {
      navigate('/mail', { replace: true });
    }
  }, [hasActiveMailbox, navigate]);

  const handleGmail = async () => {
    if (isConnecting || !accessToken) return;
    setError(null);
    setIsConnecting(true);
    try {
      const { authorizeUrl } = await integrationsApi.startGoogleConnect(accessToken);
      // Full-page redirect to Google
      window.location.href = authorizeUrl;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Bağlantı başlatılamadı';
      setError(message);
      setIsConnecting(false);
    }
  };

  return (
    <main className={`page connect-mail-page theme-${theme}`}>
      <div className="connect-mail-wrap">
        <section className="connect-mail-card">
          <header className="connect-mail-card-head">
            <div className="connect-mail-card-head-icon" aria-hidden>
              <Mail size={22} strokeWidth={2} />
            </div>
            <div className="connect-mail-card-head-text">
              <h1>{t.title}</h1>
              <p>{t.subtitle}</p>
            </div>
          </header>

          <div className="connect-mail-card-body">
            {error && (
              <div className="connect-mail-alert connect-mail-alert--error" role="alert">
                {error}
              </div>
            )}
            {successEmail && !hasActiveMailbox && (
              <div className="connect-mail-alert connect-mail-alert--success" role="status">
                {successEmail} {language === 'tr' ? 'bağlanıyor...' : 'connecting...'}
              </div>
            )}
            <div className="connect-mail-rows">
              <button
                type="button"
                className="connect-mail-row connect-mail-row--gmail"
                onClick={handleGmail}
                disabled={isConnecting}
              >
                <div className="connect-mail-row-main">
                  <div className="connect-mail-logo-box">
                    <img src={gmailSvg} alt="" className="connect-mail-logo-img" />
                  </div>
                  <div className="connect-mail-row-copy">
                    <h2>{t.gmailTitle}</h2>
                    <p>{t.gmailDesc}</p>
                  </div>
                </div>
                <div className="connect-mail-row-trail" aria-hidden>
                  {isConnecting ? (
                    <Loader2 className="connect-mail-spinner" size={20} strokeWidth={2} />
                  ) : (
                    <ChevronRight className="connect-mail-chevron" size={20} strokeWidth={2} />
                  )}
                </div>
              </button>

              <div className="connect-mail-row connect-mail-row--disabled" aria-disabled>
                <div className="connect-mail-row-main">
                  <div className="connect-mail-logo-box connect-mail-logo-box--muted">
                    <img src={outlookSvg} alt="" className="connect-mail-logo-img connect-mail-logo-img--muted" />
                  </div>
                  <div className="connect-mail-row-copy">
                    <h2>{t.outlookTitle}</h2>
                    <p>{t.outlookDesc}</p>
                  </div>
                </div>
                <span className="connect-mail-badge">{t.soonBadge}</span>
              </div>

              <div className="connect-mail-row connect-mail-row--disabled" aria-disabled>
                <div className="connect-mail-row-main">
                  <div className="connect-mail-logo-box connect-mail-logo-box--muted">
                    <img src={icloudSvg} alt="" className="connect-mail-logo-img connect-mail-logo-img--muted" />
                  </div>
                  <div className="connect-mail-row-copy">
                    <h2>{t.icloudTitle}</h2>
                    <p>{t.icloudDesc}</p>
                  </div>
                </div>
                <span className="connect-mail-badge">{t.soonBadge}</span>
              </div>

              <div className="connect-mail-row connect-mail-row--disabled" aria-disabled>
                <div className="connect-mail-row-main">
                  <div className="connect-mail-logo-box connect-mail-logo-box--muted connect-mail-logo-box--imap">
                    <Server className="connect-mail-logo-imap-icon" size={22} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="connect-mail-row-copy">
                    <h2>{t.imapTitle}</h2>
                    <p>{t.imapDesc}</p>
                  </div>
                </div>
                <span className="connect-mail-badge">{t.soonBadge}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="connect-mail-info" role="note">
          <Info className="connect-mail-info-icon" size={20} strokeWidth={2} aria-hidden />
          <div className="connect-mail-info-text">
            <p className="connect-mail-info-title">{t.infoTitle}</p>
            <p className="connect-mail-info-body">{t.infoBody}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
