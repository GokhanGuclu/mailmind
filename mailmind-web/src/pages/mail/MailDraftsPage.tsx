import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEllipsisVertical,
  LuRefreshCw,
  LuTrash2,
  LuX,
} from 'react-icons/lu';

import { useUIContext } from '../../shared/context/ui-context';
import { useDrafts } from '../../shared/context/drafts-context';
import { formatMailPageRange } from './format-mail-page-range';
import { mailDashboardContent } from './page.mock-data';

const DRAFTS_PAGE_SIZE = 50;

export function MailDraftsPage() {
  const { language } = useUIContext();
  const copy = mailDashboardContent[language];
  const { drafts: draftsRows } = useDrafts();
  const navigate = useNavigate();

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const totalPages = Math.max(1, Math.ceil(draftsRows.length / DRAFTS_PAGE_SIZE));

  useEffect(() => {
    const max = Math.max(0, Math.ceil(draftsRows.length / DRAFTS_PAGE_SIZE) - 1);
    setPageIndex((p) => Math.min(p, max));
  }, [draftsRows.length]);

  const pageRows = useMemo(() => {
    const start = pageIndex * DRAFTS_PAGE_SIZE;
    return draftsRows.slice(start, start + DRAFTS_PAGE_SIZE);
  }, [draftsRows, pageIndex]);

  const pageIds = useMemo(() => pageRows.map((r) => r.id), [pageRows]);

  const openDraftForEdit = useCallback(
    (id: string) => {
      navigate(`/mail/new?draftId=${encodeURIComponent(id)}`);
    },
    [navigate],
  );

  const masterCheckboxRef = useRef<HTMLInputElement>(null);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id)) && !allSelected;

  useEffect(() => {
    const el = masterCheckboxRef.current;
    if (!el) return;
    el.indeterminate = someSelected;
  }, [someSelected]);

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
        DRAFTS_PAGE_SIZE,
        draftsRows.length,
      ),
    [copy.inboxPageRangeTemplate, copy.inboxPageRangeEmpty, pageIndex, draftsRows.length],
  );

  return (
    <main className="mail-dash-main mail-dash-main--inbox-only">
      <div className="mail-inbox">
        <div className="mail-dash-widget__body mail-dash-widget__body--inbox mail-inbox-list__wrap">
          <div className="mail-inbox-list__panel">
            <div className="mail-inbox-list__split">
              <div className="mail-inbox-list__list-column">
            <div className="mail-inbox-toolbar" role="toolbar" aria-label={copy.draftsToolbarAria}>
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
                    <div className="mail-inbox-toolbar__bulk-actions mail-inbox-toolbar__bulk-actions--drafts">
                      <button type="button" className="mail-inbox-toolbar__icon-btn" aria-label={copy.inboxBulkDeleteAria} title={copy.inboxBulkDeleteAria}>
                        <LuTrash2 size={18} strokeWidth={1.75} aria-hidden />
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
              {draftsRows.length === 0 ? (
                <div className="mail-inbox-list__empty">
                  {language === 'tr' ? 'Henüz taslak yok.' : 'No drafts yet.'}
                </div>
              ) : null}
              <ul className="mail-dash-widget__list mail-inbox-list mail-inbox-list--no-star" aria-label={copy.navDrafts}>
                {pageRows.map((row) => {
                  const recipientLabel =
                    row.toEmail?.trim() || copy.draftsNoRecipientLabel;
                  const titleFull = `${row.subject} - ${row.preview}`;
                  const isSelected = selectedIds.has(row.id);

                  return (
                    <li
                      key={row.id}
                      className="mail-dash-widget__list-item mail-inbox-list__item mail-inbox-list__item--read"
                      onClick={() => openDraftForEdit(row.id)}
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
                      <span className="mail-inbox-list__sender" title={recipientLabel}>
                        {recipientLabel}
                      </span>
                      <div className="mail-inbox-list__mid" title={titleFull}>
                        <span className="mail-inbox-list__subject">{row.subject}</span>
                        <span className="mail-inbox-list__dash" aria-hidden>
                          {' '}
                          -{' '}
                        </span>
                        <span className="mail-inbox-list__preview">{row.preview}</span>
                      </div>
                      <time className="mail-inbox-list__when">{row.time}</time>
                    </li>
                  );
                })}
              </ul>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
