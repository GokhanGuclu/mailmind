import DOMPurify from 'dompurify';

/** Okuyucuda gösterilecek HTML’i XSS’e karşı temizler (pazarlama / tablo düzenleri dahil). */
export function sanitizeMailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['style'],
    ADD_ATTR: ['style', 'class', 'target', 'align', 'role', 'border', 'cellpadding', 'cellspacing', 'valign', 'bgcolor', 'width', 'height'],
  });
}
