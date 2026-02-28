import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CreateMailboxAccountDto } from './dto/create-mailbox-account.dto';
import { BadRequestException, ForbiddenException, NotFoundException, Injectable, ConflictException } from '@nestjs/common';
import { ActivateMailboxAccountDto } from './dto/activate-mailbox-account.dto';

@Injectable()
export class MailboxAccountsService {
  constructor(private readonly prisma: PrismaService) {}


  async activate(userId: string, accountId: string, dto: ActivateMailboxAccountDto) {
    const acc = await this.prisma.mailboxAccount.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true, provider: true, email: true },
    });
    if (!acc) throw new NotFoundException('Mailbox account not found.');
    if (acc.userId !== userId) throw new ForbiddenException();

    const hasOauth = !!dto.accessToken || !!dto.refreshToken;
    const hasImap = !!dto.imapHost || !!dto.imapUsername || !!dto.imapPassword;

    if (!hasOauth && !hasImap) {
      throw new BadRequestException('Provide OAuth tokens or IMAP credentials.');
    }

    const tokenExpiresAt = dto.tokenExpiresAt ? new Date(dto.tokenExpiresAt) : null;

    // Şimdilik placeholder (sonra encryption)
    const imapPasswordEnc = dto.imapPassword ? `PLAINTEXT:${dto.imapPassword}` : null;

    return this.prisma.$transaction(async (tx) => {
      await tx.mailboxCredential.upsert({
        where: { mailboxAccountId: acc.id },
        create: {
          mailboxAccountId: acc.id,
          accessToken: dto.accessToken ?? null,
          refreshToken: dto.refreshToken ?? null,
          tokenExpiresAt,
          imapHost: dto.imapHost ?? null,
          imapPort: dto.imapPort ?? null,
          imapUsername: dto.imapUsername ?? null,
          imapPasswordEnc,
        },
        update: {
          accessToken: dto.accessToken ?? undefined,
          refreshToken: dto.refreshToken ?? undefined,
          tokenExpiresAt: tokenExpiresAt ?? undefined,
          imapHost: dto.imapHost ?? undefined,
          imapPort: dto.imapPort ?? undefined,
          imapUsername: dto.imapUsername ?? undefined,
          imapPasswordEnc: imapPasswordEnc ?? undefined,
        },
      });

      const updated = await tx.mailboxAccount.update({
        where: { id: acc.id },
        data: { status: 'ACTIVE' },
        select: {
          id: true,
          userId: true,
          provider: true,
          email: true,
          displayName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          type: 'MAILBOX_ACCOUNT_CONNECTED',
          payload: { mailboxAccountId: acc.id, userId: acc.userId, provider: acc.provider, email: acc.email },
        },
      });

      return updated;
    });
  }

  async revoke(userId: string, accountId: string) {
    const acc = await this.prisma.mailboxAccount.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true, provider: true, email: true },
    });
    if (!acc) throw new NotFoundException('Mailbox account not found.');
    if (acc.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      // credential temizle (istersen saklarsın ama revoke için temizlemek mantıklı)
      await tx.mailboxCredential.deleteMany({ where: { mailboxAccountId: acc.id } });

      const updated = await tx.mailboxAccount.update({
        where: { id: acc.id },
        data: { status: 'REVOKED' },
        select: {
          id: true,
          userId: true,
          provider: true,
          email: true,
          displayName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          type: 'MAILBOX_ACCOUNT_REVOKED',
          payload: { mailboxAccountId: acc.id, userId: acc.userId, provider: acc.provider, email: acc.email },
        },
      });

      return updated;
    });
  }

  async list(userId: string) {
    return this.prisma.mailboxAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        provider: true,
        email: true,
        displayName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async create(userId: string, dto: CreateMailboxAccountDto) {
    try {
      return await this.prisma.mailboxAccount.create({
        data: {
          userId,
          provider: dto.provider,
          email: dto.email.toLowerCase(),
          displayName: dto.displayName ?? null,
          status: 'PENDING',
        },
        select: {
          id: true,
          userId: true,
          provider: true,
          email: true,
          displayName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e: any) {
      // unique(provider,email)
      if (e?.code === 'P2002') {
        throw new ConflictException('This mailbox account is already linked.');
      }
      throw e;
    }
  }
}