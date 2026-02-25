-- CreateTable
CREATE TABLE "IamSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "replacedById" TEXT,

    CONSTRAINT "IamSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IamSession_userId_idx" ON "IamSession"("userId");

-- CreateIndex
CREATE INDEX "IamSession_expiresAt_idx" ON "IamSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "IamSession" ADD CONSTRAINT "IamSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "IamUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
