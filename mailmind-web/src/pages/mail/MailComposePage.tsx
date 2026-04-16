import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowLeft, LuSend } from 'react-icons/lu';

import { useUIContext } from '../../shared/context/ui-context';
import { mailDashboardContent } from './page.mock-data';

export function MailComposePage() {
  const { language } = useUIContext();
  const copy = mailDashboardContent[language];
  const navigate = useNavigate();

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const goBack = useCallback(() => {
    navigate('/mail');
  }, [navigate]);

  const onSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <main className="mail-dash-main mail-dash-main--compose" aria-label={copy.composeRegionAria}>
      <div className="mail-compose">
        <header className="mail-compose__head">
          <button
            type="button"
            className="mail-compose__back"
            onClick={goBack}
            aria-label={copy.composeBackAria}
            title={copy.composeBackAria}
          >
            <LuArrowLeft size={20} strokeWidth={2} aria-hidden />
          </button>
          <h1 className="mail-compose__title">{copy.composeTitle}</h1>
        </header>
        <p className="mail-compose__hint" role="note">
          {copy.composeMockHint}
        </p>
        <form className="mail-compose__form" onSubmit={onSubmit}>
          <label className="mail-compose__field">
            <span className="mail-compose__label">{copy.composeToLabel}</span>
            <input
              type="email"
              className="mail-compose__input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              autoComplete="email"
              placeholder="ornek@alan.com"
              spellCheck={false}
            />
          </label>
          <label className="mail-compose__field">
            <span className="mail-compose__label">{copy.composeSubjectLabel}</span>
            <input
              type="text"
              className="mail-compose__input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="mail-compose__field mail-compose__field--grow">
            <span className="mail-compose__label">{copy.composeBodyLabel}</span>
            <textarea
              className="mail-compose__textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              spellCheck
            />
          </label>
          <div className="mail-compose__actions">
            <button type="button" className="mail-compose__btn mail-compose__btn--ghost" onClick={goBack}>
              {copy.composeClose}
            </button>
            <button type="submit" className="mail-compose__btn mail-compose__btn--primary">
              <LuSend size={18} strokeWidth={2} aria-hidden />
              {copy.composeSend}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
