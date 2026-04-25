import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/auth-context';
import { useUIContext } from '../../../shared/context/ui-context';
import { messagesApi, type ApiMessage } from '../../../shared/api/messages';
import type { MailDashboardCopy } from '../page.mock-data';

type Props = {
  copy: MailDashboardCopy;
};

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

export function UnreadWidgetBody({ copy }: Props) {
  const { accessToken, mailboxAccounts } = useAuth();
  const { language } = useUIContext();
  const navigate = useNavigate();

  const activeAccount = useMemo(
    () => mailboxAccounts.find((a) => a.status === 'ACTIVE'),
    [mailboxAccounts],
  );

  const [count, setCount] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);

  const fetchData = useCallback(async () => {
    if (!accessToken || !activeAccount) return;
    try {
      const [countRes, listRes] = await Promise.all([
        messagesApi.unreadCount(accessToken, activeAccount.id, 'INBOX'),
        messagesApi.list(accessToken, activeAccount.id, {
          folder: 'INBOX',
          limit: 4,
        }),
      ]);
      setCount(countRes.count);
      // Only show unread ones from the fetched list
      setMessages(listRes.items.filter((m) => !m.isRead).slice(0, 4));
    } catch {
      // silent
    }
  }, [accessToken, activeAccount]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="mail-dash-widget__pane">
      <p className="mail-dash-widget__badge-count">{count ?? '–'}</p>
      {messages.length > 0 ? (
        <ul className="mail-dash-widget__list">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className="mail-dash-widget__list-item mail-dash-widget__list-item--inbox mail-dash-widget__list-item--unread"
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
      ) : (
        <p style={{ opacity: 0.4, fontSize: '0.8125rem', textAlign: 'center', margin: '8px 0' }}>
          {copy.readerAiSummaryLabel === 'AI Özeti:' ? 'Okunmamış mail yok' : 'No unread mail'}
        </p>
      )}
    </div>
  );
}
