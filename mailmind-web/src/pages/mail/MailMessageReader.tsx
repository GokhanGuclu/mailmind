import {
  LuArchive,
  LuArrowLeft,
  LuBan,
  LuInbox,
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
};

export function MailMessageReader({ model, copy, onClose, variant }: Props) {
  const htmlBody = model.bodyHtml?.trim() ? sanitizeMailHtml(model.bodyHtml.trim()) : '';
  const paragraphs = model.bodyText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const files = model.attachmentNames;
  const isSpamFolder = variant === 'spam';
  const aiSummaryBody = isSpamFolder ? copy.readerSpamNoAiSummaryText : model.aiSummary;
  const aiSummaryRegionAria = isSpamFolder ? copy.readerSpamAiSummaryAria : copy.readerAiSummaryAria;

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
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.inboxBulkArchiveAria}
                title={copy.inboxBulkArchiveAria}
              >
                <LuArchive size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.inboxBulkSpamAria}
                title={copy.inboxBulkSpamAria}
              >
                <LuBan size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.inboxBulkDeleteAria}
                title={copy.inboxBulkDeleteAria}
              >
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
          {variant === 'spam' ? (
            <>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.spamBulkNotSpamLabel}
                title={copy.spamBulkNotSpamLabel}
              >
                <LuInbox size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.inboxBulkDeleteAria}
                title={copy.inboxBulkDeleteAria}
              >
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
          {variant === 'sent' ? (
            <>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.inboxBulkArchiveAria}
                title={copy.inboxBulkArchiveAria}
              >
                <LuArchive size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.inboxBulkDeleteAria}
                title={copy.inboxBulkDeleteAria}
              >
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
          {variant === 'drafts' ? (
            <button
              type="button"
              className="mail-inbox-toolbar__icon-btn"
              aria-label={copy.inboxBulkDeleteAria}
              title={copy.inboxBulkDeleteAria}
            >
              <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
          {variant === 'trash' ? (
            <>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.trashBulkRestoreAria}
                title={copy.trashBulkRestoreAria}
              >
                <LuRotateCcw size={18} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                className="mail-inbox-toolbar__icon-btn"
                aria-label={copy.trashBulkPermanentDeleteAria}
                title={copy.trashBulkPermanentDeleteAria}
              >
                <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </header>
      <div className="mail-inbox-reader__scroll">
        <div
          className={isSpamFolder ? 'mail-inbox-reader__ai-wrap mail-inbox-reader__ai-wrap--spam' : 'mail-inbox-reader__ai-wrap'}
          role="region"
          aria-label={aiSummaryRegionAria}
        >
          <div className="mail-inbox-reader__ai-card">
            <div className="mail-inbox-reader__ai-head">
              {isSpamFolder ? (
                <LuBan className="mail-inbox-reader__ai-sparkle mail-inbox-reader__ai-sparkle--spam" size={18} strokeWidth={2} aria-hidden />
              ) : (
                <LuSparkles className="mail-inbox-reader__ai-sparkle" size={18} strokeWidth={2} aria-hidden />
              )}
              <span className={isSpamFolder ? 'mail-inbox-reader__ai-label mail-inbox-reader__ai-label--spam' : 'mail-inbox-reader__ai-label'}>
                {copy.readerAiSummaryLabel}
              </span>
            </div>
            <p className={isSpamFolder ? 'mail-inbox-reader__ai-text mail-inbox-reader__ai-text--spam' : 'mail-inbox-reader__ai-text'}>
              {aiSummaryBody}
            </p>
          </div>
        </div>
        <div className="mail-inbox-reader__meta">
          <div className="mail-inbox-reader__from-line">
            {model.showRecipientPrefix ? (
              <>
                <span className="mail-inbox-reader__to-prefix">{copy.readerToPrefix}</span>{' '}
              </>
            ) : null}
            <span className="mail-inbox-reader__from-name">{model.displayName}</span>
            {model.displayEmail ? (
              <span className="mail-inbox-reader__from-email">&lt;{model.displayEmail}&gt;</span>
            ) : null}
          </div>
          <time
            className="mail-inbox-reader__when"
            {...(model.dateTimeIso ? { dateTime: model.dateTimeIso } : {})}
          >
            {model.timeDisplay}
          </time>
        </div>
        <div
          className={
            htmlBody
              ? 'mail-inbox-reader__body mail-inbox-reader__body--html'
              : 'mail-inbox-reader__body'
          }
        >
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
                <li key={name} className="mail-inbox-reader__attach-item">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
