import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { ImapProvider } from '../imap/imap.provider';

@Injectable()
export class MailboxSyncWorkerService implements OnModuleInit {
  private readonly logger = new Logger(MailboxSyncWorkerService.name);
  private interval: NodeJS.Timeout | null = null;

  private readonly workersEnabled =
    (process.env.WORKERS_ENABLED ?? 'true').toLowerCase() === 'true';

  constructor(private readonly prisma: PrismaService, private readonly imapProvider: ImapProvider) {}

  onModuleInit() {
    if (!this.workersEnabled) {
      this.logger.log('Workers disabled (WORKERS_ENABLED=false). Interval not started.');
      return;
    }

    const intervalMs = Number(process.env.MAILBOX_SYNC_WORKER_INTERVAL_MS ?? 1_000);

    this.interval = setInterval(() => {
      this.processOnce().catch((err) => {
        this.logger.error('Mailbox sync worker tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);

    this.logger.log(`Mailbox sync worker started (interval=${intervalMs}ms).`);
  }

  /**
   * ✅ Idempotent enqueue:
   * Aynı mailbox için PENDING/RUNNING job varsa yeni job açmaz.
   */
  async enqueueForMailbox(mailboxAccountId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.mailboxSyncJob.findFirst({
        where: {
          mailboxAccountId,
          status: { in: ['PENDING', 'RUNNING'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        this.logger.log(
          `Sync job already exists for mailbox=${mailboxAccountId} status=${existing.status} id=${existing.id}`,
        );
        return;
      }

      const job = await tx.mailboxSyncJob.create({
        data: {
          mailboxAccountId,
          status: 'PENDING',
        },
      });

      this.logger.log(`Enqueued sync job id=${job.id} mailbox=${mailboxAccountId}`);
    });
  }

  /**
   * Kuyruktan 1 job alır ve işler (deterministik test için ideal).
   */
  async processOnce(): Promise<void> {
    const job = await this.prisma.mailboxSyncJob.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) return;

    await this.prisma.mailboxSyncJob.update({
      where: { id: job.id },
      data: { status: 'RUNNING' },
    });

    try {
      // ✅ Burada gerçek sync pipeline’ın çalışmalı
      // örn: await this.syncMailbox(job.mailboxAccountId);
      // Şimdilik placeholder:
      await this.performSync(job.mailboxAccountId);

      await this.prisma.mailboxSyncJob.update({
        where: { id: job.id },
        data: { status: 'DONE' },
      });
    } catch (err: any) {
      await this.prisma.mailboxSyncJob.update({
        where: { id: job.id },
        data: { status: 'FAILED' },
      });

      this.logger.error(
        `Sync job failed id=${job.id}`,
        err?.stack ?? String(err),
      );
    }
  }

  private extractMaxUid(ids: string[]): number | null {
    let max: number | null = null;

    for (const id of ids) {
      // providerMessageId: "INBOX:123"
      const parts = String(id).split(':');
      const n = Number(parts[1]);
      if (Number.isFinite(n)) {
        if (max === null || n > max) max = n;
      }
    }

    return max;
  }

  private async performSync(
    mailboxAccountId: string,
    cursor?: string,
  ): Promise<{ cursor?: string }> {
    // 1) IMAP'ten son N maili çek (MVP)
    const messages = await this.imapProvider.fetchRecent({
      mailboxAccountId,
      limit: 50,
    });

    // 2) DB'ye upsert et
    // Not: PrismaService üzerinde mailboxMessage görünmüyorsa (TS),
    // geçici olarak any kullanıyoruz.
    const p: any = this.prisma;

    const ops = messages.map((m) =>
      p.mailboxMessage.upsert({
        where: {
          mailboxAccountId_providerMessageId: {
            mailboxAccountId,
            providerMessageId: m.providerMessageId,
          },
        },
        create: {
          mailboxAccountId,
          providerMessageId: m.providerMessageId,
          folder: m.folder,
          from: m.from || null,
          to: (m.to ?? []).join(', '), // schema'da to: String (MVP)
          subject: m.subject || null,
          date: m.date,
          snippet: m.snippet || null,
        },
        update: {
          folder: m.folder,
          from: m.from || null,
          to: (m.to ?? []).join(', '),
          subject: m.subject || null,
          date: m.date,
          snippet: m.snippet || null,
        },
      }),
    );

    if (ops.length > 0) {
      await this.prisma.$transaction(ops);
    }

    // 3) Cursor üret (INBOX:UID)
    const maxUid = this.extractMaxUid(messages.map((m: any) => m.providerMessageId));
    const newCursor = maxUid ? `INBOX:${maxUid}` : cursor;

    this.logger.log(
      `performSync mailbox=${mailboxAccountId} fetched=${messages.length} cursor=${newCursor ?? 'n/a'}`,
    );

    return { cursor: newCursor };
  }
    

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.log('Mailbox sync worker stopped.');
    }
  }
}