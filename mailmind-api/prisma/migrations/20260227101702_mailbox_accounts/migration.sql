-- CreateEnum
CREATE TYPE "MailProvider" AS ENUM ('GMAIL', 'OUTLOOK', 'IMAP');

-- CreateEnum
CREATE TYPE "MailboxAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'ERROR');

-- CreateTable
CREATE TABLE "MailboxAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "MailProvider" NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "MailboxAccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailboxAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxCredential" (
    "id" TEXT NOT NULL,
    "mailboxAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUsername" TEXT,
    "imapPasswordEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailboxCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailboxAccount_userId_idx" ON "MailboxAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxAccount_provider_email_key" ON "MailboxAccount"("provider", "email");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxCredential_mailboxAccountId_key" ON "MailboxCredential"("mailboxAccountId");

-- AddForeignKey
ALTER TABLE "MailboxAccount" ADD CONSTRAINT "MailboxAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IamUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxCredential" ADD CONSTRAINT "MailboxCredential_mailboxAccountId_fkey" FOREIGN KEY ("mailboxAccountId") REFERENCES "MailboxAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
