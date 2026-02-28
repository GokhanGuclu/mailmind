-- CreateEnum
CREATE TYPE "MailboxSyncJobType" AS ENUM ('INITIAL', 'INCREMENTAL');

-- CreateEnum
CREATE TYPE "MailboxSyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "MailboxSyncJob" (
    "id" TEXT NOT NULL,
    "mailboxAccountId" TEXT NOT NULL,
    "type" "MailboxSyncJobType" NOT NULL DEFAULT 'INITIAL',
    "status" "MailboxSyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "cursor" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "MailboxSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailboxSyncJob_mailboxAccountId_status_idx" ON "MailboxSyncJob"("mailboxAccountId", "status");

-- AddForeignKey
ALTER TABLE "MailboxSyncJob" ADD CONSTRAINT "MailboxSyncJob_mailboxAccountId_fkey" FOREIGN KEY ("mailboxAccountId") REFERENCES "MailboxAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
