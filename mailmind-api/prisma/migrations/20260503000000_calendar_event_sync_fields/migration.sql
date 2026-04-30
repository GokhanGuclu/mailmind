-- CalendarEvent push sync alanları:
-- Onaylanmış (PENDING) ama Google Calendar'a henüz yazılmamış event'ler
-- worker tarafından çekilip push edilecek; retry/backoff için bu alanlar
-- AiAnalysis ile aynı pattern'i takip eder.
ALTER TABLE "CalendarEvent"
  ADD COLUMN "syncAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "syncNextRetryAt"  TIMESTAMP(3),
  ADD COLUMN "syncErrorMessage" TEXT;

CREATE INDEX "CalendarEvent_status_syncNextRetryAt_idx" ON "CalendarEvent"("status", "syncNextRetryAt");
