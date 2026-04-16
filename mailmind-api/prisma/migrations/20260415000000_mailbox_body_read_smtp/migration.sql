-- AlterTable: MailboxMessage - body ve isRead alanları
ALTER TABLE "MailboxMessage" ADD COLUMN "bodyText" TEXT;
ALTER TABLE "MailboxMessage" ADD COLUMN "bodyHtml" TEXT;
ALTER TABLE "MailboxMessage" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: isRead bazlı sorgular için
CREATE INDEX "MailboxMessage_mailboxAccountId_isRead_idx" ON "MailboxMessage"("mailboxAccountId", "isRead");

-- AlterTable: MailboxCredential - SMTP alanları
ALTER TABLE "MailboxCredential" ADD COLUMN "smtpHost" TEXT;
ALTER TABLE "MailboxCredential" ADD COLUMN "smtpPort" INTEGER;
ALTER TABLE "MailboxCredential" ADD COLUMN "smtpUsername" TEXT;
ALTER TABLE "MailboxCredential" ADD COLUMN "smtpPasswordEnc" TEXT;
