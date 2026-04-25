/** Posta başlıklarını ekranda kısa tutmak için yardımcılar. */

export function parseFromLine(raw: string | null): { name: string; email: string } {
  if (!raw) return { name: 'Bilinmeyen', email: '' };
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1]?.trim();
    const email = match[2]?.trim();
    return { name: name || email, email };
  }
  return { name: raw.trim(), email: raw.trim() };
}

export function formatMessageDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? d.toLocaleDateString([], { day: '2-digit', month: 'short' })
    : d.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function messageBodyText(msg: { bodyText: string | null; bodyHtml: string | null; snippet: string | null }): string {
  if (msg.bodyText && msg.bodyText.trim().length > 0) return msg.bodyText.trim();
  if (msg.bodyHtml && msg.bodyHtml.trim().length > 0) return stripHtmlToText(msg.bodyHtml);
  return msg.snippet ?? '';
}
