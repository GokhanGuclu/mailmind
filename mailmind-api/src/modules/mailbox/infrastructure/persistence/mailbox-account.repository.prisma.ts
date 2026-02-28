import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { MailboxAccountRepository, MailboxAccountRow } from '../../application/ports/mailbox-account.repository';
import { MailProvider, MailboxAccountStatus } from '../../domain/value-objects/mail-provider.vo';

@Injectable()
export class MailboxAccountRepositoryPrisma implements MailboxAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { userId: string; provider: MailProvider; email: string; displayName?: string | null }): Promise<MailboxAccountRow> {
    return this.prisma.mailboxAccount.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        email: input.email.toLowerCase(),
        displayName: input.displayName ?? null,
        status: 'PENDING',
      },
    }) as any;
  }

  async findById(id: string): Promise<MailboxAccountRow | null> {
    return (await this.prisma.mailboxAccount.findUnique({ where: { id } })) as any;
  }

  async findManyByUser(userId: string): Promise<MailboxAccountRow[]> {
    return (await this.prisma.mailboxAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })) as any;
  }

  async updateStatus(id: string, status: MailboxAccountStatus): Promise<MailboxAccountRow> {
    return (await this.prisma.mailboxAccount.update({ where: { id }, data: { status } })) as any;
  }
}