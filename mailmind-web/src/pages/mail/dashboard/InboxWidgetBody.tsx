import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/auth-context';
import { useUIContext } from '../../../shared/context/ui-context';
import { messagesApi, type ApiMessage } from '../../../shared/api/messages';
import type { MailDashboardCopy } from '../page.mock-data';

type Props = {
  copy: MailDashboardCopy;
};

/** Parse "Name <email>" → name only */
function senderName(from: string | null): string {
  if (!from) return '(?)';
  const m = from.match(/^(.*?)\s*<.+?>\s*$/);
  return m ? m[1].trim() || from : from;
}

/** Bugün ise saat (15:42), aksi halde kısa tarih (14 Nis). */
function formatWhen(dateStr: string, language: 'tr' | 'en'): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  if (isToday) {
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function InboxWidgetBody({ copy }: Props) {
  const { accessToken, mailboxAccounts } = useAuth();
  const { language } = useUIContext();
  const navigate = useNavigate();

  const activeAccount = useMemo(
    () => mailboxAccounts.find((a) => a.status === 'ACTIVE'),
    [mailboxAccounts],
  );

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!accessToken || !activeAccount) return;
    setLoading(true);
    try {
      const res = await messagesApi.list(accessToken, activeAccount.id, {
        folder: 'INBOX',
        limit: 8,
      });
      setMessages(res.items);
    } catch {
      // silent — widget gracefully shows empty
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeAccount]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  if (loading && messages.length === 0) {
    return (
      <div className="mail-dash-widget__body mail-dash-widget__body--inbox" style={{ opacity: 0.4, padding: 16, textAlign: 'center', fontSize: '0.8125rem' }}>
        {copy.readerAiSummaryLabel === 'AI Özeti:' ? 'Yükleniyor...' : 'Loading...'}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="mail-dash-widget__body mail-dash-widget__body--inbox" style={{ opacity: 0.4, padding: 16, textAlign: 'center', fontSize: '0.8125rem' }}>
        {copy.readerAiSummaryLabel === 'AI Özeti:' ? 'Gelen kutunuz boş.' : 'Your inbox is empty.'}
      </div>
    );
  }

  return (
    <div className="mail-dash-widget__body mail-dash-widget__body--inbox">
      <ul className="mail-dash-widget__list">
        {messages.map((msg) => (
          <li
            key={msg.id}
            className={`mail-dash-widget__list-item mail-dash-widget__list-item--inbox ${!msg.isRead ? 'mail-dash-widget__list-item--unread' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/mail?open=${encodeURIComponent(msg.id)}`)}
          >
            <div className="mail-dash-widget__list-row">
              <span className="mail-dash-widget__list-sender">{senderName(msg.from)}</span>
              <time className="mail-dash-widget__list-when" dateTime={msg.date}>
                {formatWhen(msg.date, language)}
              </time>
            </div>
            <span className="mail-dash-widget__list-subj">{msg.subject ?? '(no subject)'}</span>
            <span className="mail-dash-widget__list-prev">{msg.snippet ?? ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
