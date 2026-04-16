import type { LanguageMode } from '../../shared/types/ui';
import type { GeneralInboxRow } from './page.mock-data';

export function resolveInboxSentDate(row: GeneralInboxRow): Date {
  const d = new Date();
  d.setDate(d.getDate() - row.sentDayOffset);
  const parts = row.sentClock.split(':');
  const hh = parseInt(parts[0] ?? '0', 10);
  const mm = parseInt(parts[1] ?? '0', 10);
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function formatInboxSenderLabel(row: GeneralInboxRow): string {
  const n = row.senderName?.trim();
  return n ? n : row.senderEmail;
}

export function formatInboxSentDisplay(sent: Date, language: LanguageMode): string {
  const now = new Date();
  const sameDay =
    sent.getFullYear() === now.getFullYear() &&
    sent.getMonth() === now.getMonth() &&
    sent.getDate() === now.getDate();
  const loc = language === 'tr' ? 'tr-TR' : 'en-US';
  if (sameDay) {
    return new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit' }).format(sent);
  }
  return new Intl.DateTimeFormat(loc, {
    day: 'numeric',
    month: 'short',
    ...(sent.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  }).format(sent);
}

/** Tam ileti başlığında tarih + saat */
export function formatInboxFullDateTime(sent: Date, language: LanguageMode): string {
  const loc = language === 'tr' ? 'tr-TR' : 'en-US';
  return new Intl.DateTimeFormat(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(sent);
}
