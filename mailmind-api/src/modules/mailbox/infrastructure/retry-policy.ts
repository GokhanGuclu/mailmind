/**
 * Mailbox tarafı worker'ları için ortak retry/backoff politikası.
 * AiAnalysis'in EmailAnalyzerService.MAX_ATTEMPTS / BACKOFF_MS pattern'iyle
 * aynı; tek bir source-of-truth tutmak yerine küçük bir helper olarak
 * burada — başka bir modüldeki sayılarla bağlı kalmamak için.
 */

export const MAX_ATTEMPTS = 3;

/** attemptCount=N başarısız olduğunda kullanılan beklemeler (ms). */
const BACKOFF_MS: readonly number[] = [30_000, 120_000, 600_000]; // 30sn → 2dk → 10dk

export function backoffFor(attemptCount: number): number {
  const idx = Math.max(0, Math.min(attemptCount - 1, BACKOFF_MS.length - 1));
  return BACKOFF_MS[idx];
}

export function nextRetryDate(attemptCount: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + backoffFor(attemptCount));
}
