-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- AlterEnum: PROPOSED değerini CalendarEventStatus'a ekle
ALTER TYPE "CalendarEventStatus" ADD VALUE 'PROPOSED' BEFORE 'PENDING';

-- AlterTable: IamUser timezone
ALTER TABLE "IamUser" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul';

-- AlterTable: Task rrule
ALTER TABLE "Task" ADD COLUMN "rrule" TEXT;

-- AlterTable: CalendarEvent — recurrence + external system
-- NOT: status default'unu PROPOSED'a çekme işlemi sonraki migration'da
-- (Postgres yeni enum değerini aynı tx içinde DEFAULT olarak kullandırmıyor)
ALTER TABLE "CalendarEvent" ADD COLUMN "rrule" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul';
ALTER TABLE "CalendarEvent" ADD COLUMN "externalSystem" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "externalId" TEXT;

-- CreateTable: Reminder
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiAnalysisId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "fireAt" TIMESTAMP(3),
    "rrule" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "nextFireAt" TIMESTAMP(3),
    "lastFiredAt" TIMESTAMP(3),
    "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_userId_status_idx" ON "Reminder"("userId", "status");
CREATE INDEX "Reminder_status_nextFireAt_idx" ON "Reminder"("status", "nextFireAt");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IamUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_aiAnalysisId_fkey" FOREIGN KEY ("aiAnalysisId") REFERENCES "AiAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
