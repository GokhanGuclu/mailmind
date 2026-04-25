import { useEffect, useRef, useState } from 'react';
import {
  LuArchive,
  LuArrowLeft,
  LuBan,
  LuInbox,
  LuLoader,
  LuRotateCcw,
  LuSparkles,
  LuTrash2,
} from 'react-icons/lu';

import type { MailDashboardCopy } from './page.mock-data';
import type { MailReaderFolderVariant, MailReaderModel } from './mail-reader-model';
import { sanitizeMailHtml } from './sanitize-mail-html';

type Props = {
  model: MailReaderModel;
  copy: MailDashboardCopy;
  onClose: () => void;
  variant: MailReaderFolderVariant;
  onSummarize?: () => Promise<string | null>;
  onDelete?: () => void;
  onRestore?: () => void;
  onSpam?: () => void;
};

const TYPEWRITER_SPEED_MS = 18; // her karakter arası ms

function useTypewriter(text: string | null) {
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    function tick() {
      i++;
      setDisplayed(text!.slice(0, i));
      if (i < text!.length) {
        rafRef.current = setTimeout(tick, TYPEWRITER_SPEED_MS);
      }
    }
    rafRef.current = setTimeout(tick, TYPEWRITER_SPEED_MS);
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [text]);

  return displayed;
}

export function MailMessageReader({ model, copy, onClose, variant, onSummarize, onDelete, onRestore, onSpam }: Props) {
  const htmlBody = model.bodyHtml?.trim() ? sanitizeMailHtml(model.bodyHtml.trim()) : '';
  const paragraphs = model.bodyText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const files = model.attachmentNames;
  const isSpamFolder = variant === 'spam';
  const isTr = copy.readerAiSummaryLabel === 'AI Özeti:';

  // AI summary state
  const [localSummary, setLocalSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  const effectiveSummary = localSummary ?? model.aiSummary?.trim() ?? '';
  const hasSummary = Boolean(effectiveSummary);

  // Typewriter: sadece yeni gelen özet için çalıştır
  const typedSummary = useTypewriter(localSummary);
  // Modelden gelen önceden var olan özeti direk göster
  const displayedSummary = localSummary ? typedSummary : effectiveSummary;

  const canSummarize = !isSpamFolder && !hasSummary && Boolean(onSummarize);
  // Spam için de kart göster
  const showAiCard = isSpamFolder || hasSummary || canSummarize || summarizing;

  const handleSummarize = async () => {
    if (!onSummarize || summarizing) return;
    setSummarizing(true);
    setSummarizeError(null);
    try {
      const result = await onSummarize();
      if (result?.trim()) {
        setLocalSummary(result.trim());
      } else {
        setSummarizeError(isTr ? 'Özetleme başarısız oldu.' : 'Summarization failed.');
      }
    } catch (err: any) {
      setSummarizeError(err?.message ?? 'Error');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <section className="mail-inbox-reader" aria-label={copy.inboxMessageReaderRegionAria}>
      <header className="mail-inbox-reader__toolbar">
        <button
          type="button"
          className="mail-inbox-reader__back"
          onClick={onClose}
          aria-label={copy.inboxBackToListAria}
          title={copy.inboxBackToListAria}
        >
          <LuArrowLeft size={20} strokeWidth={2} aria-hidden />
        </button>
        <h1 className="mail-inbox-reader__toolbar-title" title={model.subject}>
          {model.subject}
        </h1>
        <div className="mail-inbox-reader__toolbar-actions" role="group" aria-label={copy.inboxReaderMessageActionsAria}>
          {variant === 'inbox' ? (
            <>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkArchiveAria} title={copy.inboxBulkArchiveAria}>
                <LuArchive size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkSpamAria} title={copy.inboxBulkSpamAria} onClick={onSpam}>
                <LuBan size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkDeleteAria} title={copy.inboxBulkDeleteAria} onClick={onDelete}>
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
          {variant === 'spam' ? (
            <>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.spamBulkNotSpamLabel} title={copy.spamBulkNotSpamLabel} onClick={onRestore}>
                <LuInbox size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkDeleteAria} title={copy.inboxBulkDeleteAria} onClick={onDelete}>
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
          {variant === 'sent' ? (
            <>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkArchiveAria} title={copy.inboxBulkArchiveAria}>
                <LuArchive size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkDeleteAria} title={copy.inboxBulkDeleteAria} onClick={onDelete}>
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
          {variant === 'drafts' ? (
            <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkDeleteAria} title={copy.inboxBulkDeleteAria} onClick={onDelete}>
              <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
          {variant === 'trash' ? (
            <>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.trashBulkRestoreAria} title={copy.trashBulkRestoreAria} onClick={onRestore}>
                <LuRotateCcw size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.trashBulkPermanentDeleteAria} title={copy.trashBulkPermanentDeleteAria}>
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="mail-inbox-reader__scroll">
        {/* AI özet kartı — her zaman görünür (spam / özet var / buton) */}
        {showAiCard ? (
          <div
            className={`mail-inbox-reader__ai-wrap${isSpamFolder ? ' mail-inbox-reader__ai-wrap--spam' : ''}`}
            role="region"
            aria-label={isSpamFolder ? copy.readerSpamAiSummaryAria : copy.readerAiSummaryAria}
          >
            <div className="mail-inbox-reader__ai-card">
              <div className="mail-inbox-reader__ai-head">
                {isSpamFolder ? (
                  <LuBan className="mail-inbox-reader__ai-sparkle mail-inbox-reader__ai-sparkle--spam" size={18} strokeWidth={2} aria-hidden />
                ) : (
                  <LuSparkles className="mail-inbox-reader__ai-sparkle" size={18} strokeWidth={2} aria-hidden />
                )}
                <span className={`mail-inbox-reader__ai-label${isSpamFolder ? ' mail-inbox-reader__ai-label--spam' : ''}`}>
                  {copy.readerAiSummaryLabel}
                </span>
              </div>

              {/* İçerik: buton / yükleniyor / özet metni */}
              {isSpamFolder ? (
                <p className="mail-inbox-reader__ai-text mail-inbox-reader__ai-text--spam">
                  {copy.readerSpamNoAiSummaryText}
                </p>
              ) : hasSummary ? (
                <p className="mail-inbox-reader__ai-text">
                  {displayedSummary}
                  {/* Yazım devam ediyorsa imleç */}
                  {localSummary && displayedSummary.length < localSummary.length ? (
                    <span className="mail-inbox-reader__ai-cursor" aria-hidden>▋</span>
                  ) : null}
                </p>
              ) : summarizing ? (
                <div className="mail-inbox-reader__ai-loading">
                  <LuLoader className="mail-inbox-reader__summarize-spinner" size={15} strokeWidth={2.5} aria-hidden />
                  <span>{isTr ? 'Özetleniyor...' : 'Summarizing...'}</span>
                </div>
              ) : (
                <div className="mail-inbox-reader__ai-btn-wrap">
                  <button
                    type="button"
                    className="mail-inbox-reader__summarize-btn"
                    onClick={handleSummarize}
                  >
                    <LuSparkles size={14} strokeWidth={2} aria-hidden />
                    <span>{isTr ? 'AI Özetle' : 'AI Summarize'}</span>
                  </button>
                  {summarizeError ? (
                    <p className="mail-inbox-reader__summarize-error">{summarizeError}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="mail-inbox-reader__meta">
          <div className="mail-inbox-reader__from-line">
            {model.showRecipientPrefix ? (
              <><span className="mail-inbox-reader__to-prefix">{copy.readerToPrefix}</span>{' '}</>
            ) : null}
            <span className="mail-inbox-reader__from-name">{model.displayName}</span>
            {model.displayEmail ? (
              <span className="mail-inbox-reader__from-email">&lt;{model.displayEmail}&gt;</span>
            ) : null}
          </div>
          <time className="mail-inbox-reader__when" {...(model.dateTimeIso ? { dateTime: model.dateTimeIso } : {})}>
            {model.timeDisplay}
          </time>
        </div>

        <div className={htmlBody ? 'mail-inbox-reader__body mail-inbox-reader__body--html' : 'mail-inbox-reader__body'}>
          {htmlBody ? (
            <div
              className="mail-inbox-reader__html-root mail-inbox-reader__html-root--marketing"
              // eslint-disable-next-line react/no-danger -- sanitizeMailHtml ile temizlenir
              dangerouslySetInnerHTML={{ __html: htmlBody }}
            />
          ) : (
            paragraphs.map((block, i) => (
              <p key={i} className="mail-inbox-reader__para">
                {block.split('\n').map((line, j, arr) => (
                  <span key={j}>
                    {line}
                    {j < arr.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            ))
          )}
        </div>

        {files.length > 0 ? (
          <div className="mail-inbox-reader__attachments" role="group" aria-label={copy.inboxAttachmentsLabel}>
            <ul className="mail-inbox-reader__attach-list">
              {files.map((name) => (
                <li key={name} className="mail-inbox-reader__attach-item">{name}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
