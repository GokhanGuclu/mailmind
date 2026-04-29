-- AiAnalysis robustness alanları: retry/backoff + stuck-job recovery
ALTER TABLE "AiAnalysis"
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextRetryAt"  TIMESTAMP(3),
  ADD COLUMN "lockedAt"     TIMESTAMP(3);

-- Worker query indexes
CREATE INDEX "AiAnalysis_status_nextRetryAt_idx" ON "AiAnalysis"("status", "nextRetryAt");
CREATE INDEX "AiAnalysis_status_lockedAt_idx"    ON "AiAnalysis"("status", "lockedAt");
