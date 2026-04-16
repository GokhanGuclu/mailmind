import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LuArchive,
  LuBan,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEllipsisVertical,
  LuMailOpen,
  LuRefreshCw,
  LuStar,
  LuTrash2,
  LuX,
} from 'react-icons/lu';

import { useUIContext } from '../../shared/context/ui-context';
import { InboxAttachmentChips } from './InboxAttachmentChips';
import { mailDashboardContent } from './page.mock-data';
import { formatMailPageRange } from './format-mail-page-range';
import {
  formatInboxSenderLabel,
  formatInboxSentDisplay,
  resolveInboxSentDate,
} from './inbox-list-utils';
import { MailMessageReader } from './MailMessageReader';
import { readerFromGeneralInbox } from './mail-reader-model';

/** Genel kutu sayfalama: önce 50 ileti, kalanlar sonraki sayfada (71 ileti → 50 + 21). */
const INBOX_PAGE_SIZE = 50;

export function MailInboxPage() {
  const { language } = useUIContext();
  const copy = mailDashboardContent[language];
  const inboxRows = copy.mock.inboxMockRows;

  const [pageIndex, setPageIndex] = useState(0);
  const [starredIds, setStarredIds] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const totalPages = Math.max(1, Math.ceil(inboxRows.length / INBOX_PAGE_SIZE));

  useEffect(() => {
    const max = Math.max(0, Math.ceil(inboxRows.length / INBOX_PAGE_SIZE) - 1);
    setPageIndex((p) => Math.min(p, max));
  }, [inboxRows.length]);

  const pageRows = useMemo(() => {
    const start = pageIndex * INBOX_PAGE_SIZE;
    return inboxRows.slice(start, start + INBOX_PAGE_SIZE);
  }, [inboxRows, pageIndex]);

  const pageIds = useMemo(() => pageRows.map((r) => r.id), [pageRows]);

  const openedRow = useMemo(
    () => (openedId ? inboxRows.find((r) => r.id === openedId) ?? null : null),
    [openedId, inboxRows],
  );

  const openMessage = useCallback((id: string) => {
    setOpenedId(id);
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const closeMessage = useCallback(() => {
    setOpenedId(null);
  }, []);

  useEffect(() => {
    if (!openedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMessage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openedId, closeMessage]);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id)) && !allSelected;

  useEffect(() => {
    const el = masterCheckboxRef.current;
    if (!el) return;
    el.indeterminate = someSelected;
  }, [someSelected]);

  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allOnPage = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (allOnPage) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [pageIds]);

  const toggleRowSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;

  const goPrev = useCallback(() => {
    setPageIndex((p) => Math.max(0, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setPageIndex((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const clearAllSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const hasSelection = selectedIds.size > 0;

  const pageRangeLabel = useMemo(
    () =>
      formatMailPageRange(
        copy.inboxPageRangeTemplate,
        copy.inboxPageRangeEmpty,
        pageIndex,
        INBOX_PAGE_SIZE,
        inboxRows.length,
      ),
    [copy.inboxPageRangeTemplate, copy.inboxPageRangeEmpty, pageIndex, inboxRows.length],
  );

  return (
    <main className="mail-dash-main mail-dash-main--inbox-only">
      <div className="mail-inbox">
        <div className="mail-dash-widget__body mail-dash-widget__body--inbox mail-inbox-list__wrap">
          <div
            className={
              openedRow
                ? 'mail-inbox-list__panel mail-inbox-list__panel--with-reader'
                : 'mail-inbox-list__panel'
            }
          >
            <div className="mail-inbox-list__split">
              <div className="mail-inbox-list__list-column">
            <div className="mail-inbox-toolbar" role="toolbar" aria-label={copy.inboxToolbarAria}>
              <div className="mail-inbox-toolbar__leading">
                <div className="mail-inbox-toolbar__select-morph">
                  <div
                    className={`mail-inbox-toolbar__morph-pane mail-inbox-toolbar__morph-pane--select ${!hasSelection ? 'mail-inbox-toolbar__morph-pane--active' : ''}`}
                    aria-hidden={hasSelection}
                  >
                    <div className="mail-inbox-toolbar__select-group">
                      <label className="mail-inbox-toolbar__select-label">
                        <input
                          ref={masterCheckboxRef}
                          type="checkbox"
                          className="mail-inbox-list__checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          aria-label={copy.inboxSelectAllAria}
                        />
                      </label>
                      <button
                        type="button"
                        className="mail-inbox-toolbar__caret"
                        aria-label={copy.inboxSelectionMenuAria}
                        aria-haspopup="menu"
                        title={copy.inboxSelectionMenuAria}
                        onClick={(e) => e.preventDefault()}
                      >
                        <LuChevronDown size={16} strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`mail-inbox-toolbar__morph-pane mail-inbox-toolbar__morph-pane--select ${hasSelection ? 'mail-inbox-toolbar__morph-pane--active' : ''}`}
                    aria-hidden={!hasSelection}
                  >
                    <button
                      type="button"
                      className="mail-inbox-toolbar__icon-btn mail-inbox-toolbar__clear-selection"
                      aria-label={copy.inboxClearSelectionAria}
                      title={copy.inboxClearSelectionAria}
                      onClick={clearAllSelection}
                    >
                      <LuX size={18} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="mail-inbox-toolbar__actions-morph">
                  <div
                    className={`mail-inbox-toolbar__morph-pane mail-inbox-toolbar__morph-pane--actions ${!hasSelection ? 'mail-inbox-toolbar__morph-pane--active' : ''}`}
                    aria-hidden={hasSelection}
                  >
                    <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxRefreshAria}>
                      <LuRefreshCw size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxMoreActionsAria}>
                      <LuEllipsisVertical size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                  <div
                    className={`mail-inbox-toolbar__morph-pane mail-inbox-toolbar__morph-pane--actions ${hasSelection ? 'mail-inbox-toolbar__morph-pane--active' : ''}`}
                    aria-hidden={!hasSelection}
                  >
                    <div className="mail-inbox-toolbar__bulk-actions">
                      <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkArchiveAria} title={copy.inboxBulkArchiveAria}>
                        <LuArchive size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkDeleteAria} title={copy.inboxBulkDeleteAria}>
                        <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkSpamAria} title={copy.inboxBulkSpamAria}>
                        <LuBan size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkMarkReadAria} title={copy.inboxBulkMarkReadAria}>
                        <LuMailOpen size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mail-inbox-toolbar__pager">
                <button
                  type="button"
                  className="mail-inbox-toolbar__icon-btn"
                  aria-label={copy.inboxPagePrevAria}
                  disabled={!canPrev}
                  onClick={goPrev}
                >
                  <LuChevronLeft size={18} strokeWidth={1.75} aria-hidden />
                </button>
                <span className="mail-inbox-toolbar__page-range" aria-live="polite" title={pageRangeLabel}>
                  {pageRangeLabel}
                </span>
                <button
                  type="button"
                  className="mail-inbox-toolbar__icon-btn"
                  aria-label={copy.inboxPageNextAria}
                  disabled={!canNext}
                  onClick={goNext}
                >
                  <LuChevronRight size={18} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            </div>
            <div className="mail-dash-list-scroll">
              <ul className="mail-dash-widget__list mail-inbox-list" aria-label={copy.navGeneralInbox}>
              {pageRows.map((row) => {
                const sent = resolveInboxSentDate(row);
                const when = formatInboxSentDisplay(sent, language);
                const sender = formatInboxSenderLabel(row);
                const files = row.attachmentNames?.filter(Boolean) ?? [];
                const hasFiles = files.length > 0;
                const hasHtmlBody = Boolean(row.bodyHtml?.trim());
                const titleFull = `${row.subject} - ${row.preview}`;
                const isStarred = starredIds.has(row.id);
                const isSelected = selectedIds.has(row.id);
                const isOpen = openedId === row.id;
                const isRead = readIds.has(row.id);

                return (
                  <li
                    key={row.id}
                    className={[
                      'mail-dash-widget__list-item',
                      'mail-inbox-list__item',
                      isRead ? 'mail-inbox-list__item--read' : '',
                      isOpen ? 'mail-inbox-list__item--open' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => openMessage(row.id)}
                  >
                    <label className="mail-inbox-list__check-wrap">
                      <input
                        type="checkbox"
                        className="mail-inbox-list__checkbox"
                        aria-label={copy.inboxSelectRowAria}
                        checked={isSelected}
                        onChange={() => toggleRowSelected(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </label>
                    <button
                      type="button"
                      className={
                        isStarred
                          ? 'mail-inbox-list__star-btn mail-inbox-list__star-btn--starred'
                          : 'mail-inbox-list__star-btn'
                      }
                      aria-label={copy.inboxStarRowAria}
                      aria-pressed={isStarred}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(row.id);
                      }}
                    >
                      <LuStar
                        size={18}
                        aria-hidden
                        fill={isStarred ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={isStarred ? 0 : 1.75}
                      />
                    </button>
                    <span className="mail-inbox-list__sender" title={`${sender} <${row.senderEmail}>`}>
                      {sender}
                    </span>
                    <div className="mail-inbox-list__mid" title={titleFull}>
                      <span className="mail-inbox-list__subject">
                        {row.subject}
                        {hasHtmlBody ? (
                          <span className="mail-inbox-list__html-badge" title={copy.inboxHtmlBadgeTitle}>
                            HTML5
                          </span>
                        ) : null}
                      </span>
                      <span className="mail-inbox-list__dash" aria-hidden>
                        {' '}
                        -{' '}
                      </span>
                      <span className="mail-inbox-list__preview">{row.preview}</span>
                    </div>
                    <time className="mail-inbox-list__when" dateTime={sent.toISOString()}>
                      {when}
                    </time>
                    {hasFiles ? (
                      <div
                        className="mail-inbox-list__attachments"
                        role="group"
                        aria-label={copy.inboxAttachmentsLabel}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <InboxAttachmentChips names={files} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
              </ul>
            </div>
              </div>
              {openedRow ? (
                <MailMessageReader
                  model={readerFromGeneralInbox(openedRow, language)}
                  variant="inbox"
                  copy={copy}
                  onClose={closeMessage}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
