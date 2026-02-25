import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class IamSessionRepositoryPrisma {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }) {
    return this.prisma.iamSession.create({ data });
  }

  createTx(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      userAgent?: string;
      ip?: string;
    },
  ) {
    return tx.iamSession.create({ data });
  }

  findById(id: string) {
    return this.prisma.iamSession.findUnique({ where: { id } });
  }

  async revoke(id: string) {
    await this.prisma.iamSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async updateHash(id: string, refreshTokenHash: string) {
    await this.prisma.iamSession.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  updateHashTx(tx: Prisma.TransactionClient, id: string, refreshTokenHash: string) {
    return tx.iamSession.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }
  async rotateWithIssuedToken(params: {
  oldSessionId: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
  issueToken: (newSessionId: string) => Promise<{ refreshToken: string; refreshTokenHash: string }>;
}): Promise<{ refreshToken: string }> {
  const { oldSessionId, userId, expiresAt, userAgent, ip, issueToken } = params;

  return this.prisma.$transaction(async (tx) => {
    await tx.iamSession.update({
      where: { id: oldSessionId },
      data: { revokedAt: new Date() },
    });

    const newSession = await tx.iamSession.create({
      data: {
        userId,
        refreshTokenHash: 'TEMP',
        expiresAt,
        userAgent,
        ip,
      },
      select: { id: true },
    });

    const { refreshToken, refreshTokenHash } = await issueToken(newSession.id);

    await tx.iamSession.update({
      where: { id: newSession.id },
      data: { refreshTokenHash },
    });

    await tx.iamSession.update({
      where: { id: oldSessionId },
      data: { replacedById: newSession.id },
    });

    return { refreshToken };
  });
}

}