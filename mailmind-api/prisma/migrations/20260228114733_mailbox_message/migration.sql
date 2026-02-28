-- CreateTable
CREATE TABLE "MailboxMessage" (
    "id" TEXT NOT NULL,
    "mailboxAccountId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "from" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "snippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailboxMessage_mailboxAccountId_date_idx" ON "MailboxMessage"("mailboxAccountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxMessage_mailboxAccountId_providerMessageId_key" ON "MailboxMessage"("mailboxAccountId", "providerMessageId");

-- AddForeignKey
ALTER TABLE "MailboxMessage" ADD CONSTRAINT "MailboxMessage_mailboxAccountId_fkey" FOREIGN KEY ("mailboxAccountId") REFERENCES "MailboxAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
