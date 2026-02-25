-- CreateTable
CREATE TABLE "IamUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IamUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationsGoogleAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationsGoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationsGoogleToken" (
    "id" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationsGoogleToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IamUser_email_key" ON "IamUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationsGoogleAccount_userId_googleEmail_key" ON "IntegrationsGoogleAccount"("userId", "googleEmail");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationsGoogleToken_googleAccountId_key" ON "IntegrationsGoogleToken"("googleAccountId");

-- AddForeignKey
ALTER TABLE "IntegrationsGoogleAccount" ADD CONSTRAINT "IntegrationsGoogleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IamUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationsGoogleToken" ADD CONSTRAINT "IntegrationsGoogleToken_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "IntegrationsGoogleAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
