-- OutboxEvent + MailboxSyncJob robustness: AiAnalysis ile aynı retry/backoff
-- + stuck-recovery pattern'i. Bu migration'dan sonra worker'lar geçici
-- hatalarda iş kaybetmez ve crash sonrası takılı kalmaz.

-- OutboxEvent
ALTER TABLE "OutboxEvent"
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextRetryAt"  TIMESTAMP(3),
  ADD COLUMN "lockedAt"     TIMESTAMP(3),
  ADD COLUMN "errorMessage" TEXT;

CREATE INDEX "OutboxEvent_status_nextRetryAt_idx" ON "OutboxEvent"("status", "nextRetryAt");
CREATE INDEX "OutboxEvent_status_lockedAt_idx"    ON "OutboxEvent"("status", "lockedAt");

-- MailboxSyncJob (startedAt zaten lockedAt rolünde — RUNNING'de set ediliyor;
-- recoverStaleRunningJobs ona bakıyor.)
ALTER TABLE "MailboxSyncJob"
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextRetryAt"  TIMESTAMP(3);

CREATE INDEX "MailboxSyncJob_status_nextRetryAt_idx" ON "MailboxSyncJob"("status", "nextRetryAt");
