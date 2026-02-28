import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class MailboxSyncWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailboxSyncWorkerService.name);
  private timer: NodeJS.Timeout | null = null;

  private readonly pollMs = 1500;
  private readonly batchSize = 5;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.tick().catch((err) => this.logger.error(err?.message ?? err, err?.stack));
    }, this.pollMs);

    this.logger.log(`Mailbox sync worker started (pollMs=${this.pollMs}, batchSize=${this.batchSize})`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    // 🔧 Prisma type issue yaşamamak için any kullanıyoruz
    const prismaAny = this.prisma as any;

    const jobs = await prismaAny.mailboxSyncJob.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: this.batchSize,
    });

    if (!jobs.length) return;

    for (const job of jobs) {
      // claim (concurrency-safe)
      const claimed = await prismaAny.mailboxSyncJob.updateMany({
        where: { id: job.id, status: 'PENDING' },
        data: { status: 'RUNNING', startedAt: new Date() },
      });
      if (claimed.count !== 1) continue;

      try {
        await this.runJob(job);

        await prismaAny.mailboxSyncJob.update({
          where: { id: job.id },
          data: { status: 'DONE', finishedAt: new Date(), errorMessage: null },
        });
      } catch (err: any) {
        this.logger.error(`Sync job failed id=${job.id} err=${err?.message ?? err}`, err?.stack);

        await prismaAny.mailboxSyncJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', finishedAt: new Date(), errorMessage: String(err?.message ?? err) },
        });
      }
    }
  }

  private async runJob(job: any) {
    this.logger.log(`Running sync job id=${job.id} type=${job.type} mailboxAccountId=${job.mailboxAccountId}`);

    // ŞİMDİLİK: gerçek mail çekme yok. Simüle ediyoruz.
    await new Promise((r) => setTimeout(r, 800));

    this.logger.log(`Finished sync job id=${job.id}`);
  }

  public async processOnce() { await this.tick(); }
}