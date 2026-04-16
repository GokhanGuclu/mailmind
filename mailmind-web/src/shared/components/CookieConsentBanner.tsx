import { useUIContext } from '../context/ui-context';

export function CookieConsentBanner() {
  const { cookieConsent, language, theme, acceptCookies, rejectCookies } = useUIContext();

  if (cookieConsent !== null) return null;

  const text =
    language === 'tr'
      ? {
          title: 'Çerez Tercihi',
          description:
            'Bu site, deneyimini iyileştirmek, tercihlerini hatırlamak ve hizmetleri optimize etmek için çerezler kullanır. Onay vermen halinde bu veriler sonraki ziyaretlerinde saklanır.',
          accept: 'Kabul Et',
          reject: 'Reddet',
        }
      : {
          title: 'Cookie Preference',
          description:
            'We can use cookies to remember language and theme preferences. If you accept, your choices are saved for next visit.',
          accept: 'Accept',
          reject: 'Reject',
        };

  return (
    <aside className={`cookie-banner theme-${theme}`} role="dialog" aria-label={text.title}>
      <div className="cookie-banner-text">
        <strong>{text.title}</strong>
        <p>{text.description}</p>
      </div>
      <div className="cookie-banner-actions">
        <button type="button" className="cookie-btn secondary" onClick={rejectCookies}>
          {text.reject}
        </button>
        <button type="button" className="cookie-btn primary" onClick={acceptCookies}>
          {text.accept}
        </button>
      </div>
    </aside>
  );
}
