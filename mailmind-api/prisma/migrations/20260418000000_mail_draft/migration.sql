-- CreateTable
CREATE TABLE "MailDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mailboxAccountId" TEXT NOT NULL,
    "toEmails" TEXT,
    "ccEmails" TEXT,
    "bccEmails" TEXT,
    "subject" TEXT,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailDraft_userId_updatedAt_idx" ON "MailDraft"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "MailDraft_mailboxAccountId_updatedAt_idx" ON "MailDraft"("mailboxAccountId", "updatedAt");

-- AddForeignKey
ALTER TABLE "MailDraft" ADD CONSTRAINT "MailDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IamUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailDraft" ADD CONSTRAINT "MailDraft_mailboxAccountId_fkey" FOREIGN KEY ("mailboxAccountId") REFERENCES "MailboxAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
