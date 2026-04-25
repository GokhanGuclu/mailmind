-- AlterTable
ALTER TABLE "MailboxMessage" ADD COLUMN "isStarred" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "MailboxMessage_mailboxAccountId_isStarred_idx" ON "MailboxMessage"("mailboxAccountId", "isStarred");
