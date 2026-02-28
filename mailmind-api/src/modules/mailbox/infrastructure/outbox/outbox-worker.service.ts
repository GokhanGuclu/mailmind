import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

type OutboxStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

@Injectable()
export class OutboxWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private timer: NodeJS.Timeout | null = null;

  // İstersen env ile yönet: OUTBOX_POLL_MS, OUTBOX_BATCH
  private readonly pollMs = 1500;
  private readonly batchSize = 20;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Uygulama ayağa kalkınca worker başlar
    this.timer = setInterval(() => {
      this.tick().catch((err) => this.logger.error(err?.message ?? err, err?.stack));
    }, this.pollMs);

    this.logger.log(`Outbox worker started (pollMs=${this.pollMs}, batchSize=${this.batchSize})`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    // 1) PENDING eventleri çek
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: this.batchSize,
      select: {
        id: true,
        type: true,
        status: true,
        payload: true,     // <-- ŞART
        createdAt: true,
      },
    });

    if (events.length === 0) return;

    for (const evt of events) {
      // 2) Claim: aynı event’i iki worker’ın işlememesi için
      const claimed = await this.prisma.outboxEvent.updateMany({
        where: { id: evt.id, status: 'PENDING' },
        data: { status: 'PROCESSING' satisfies OutboxStatus },
      });

      if (claimed.count !== 1) continue; // başka instance kaptı

      try {
        await this.handleEvent(evt.type, evt.payload);

        await this.prisma.outboxEvent.update({
          where: { id: evt.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (err: any) {
        this.logger.error(
          `Outbox event failed id=${evt.id} type=${evt.type} err=${err?.message ?? err}`,
          err?.stack,
        );

        await this.prisma.outboxEvent.update({
          where: { id: evt.id },
          data: { status: 'FAILED' satisfies OutboxStatus },
        });
      }
    }
  }

  private async handleEvent(type: string, payload: any) {
    // ŞİMDİLİK: işleyici sadece log atıyor.
    // Bir sonraki modülde burada "sync job" yazacağız.
    switch (type) {
      case 'MAILBOX_ACCOUNT_CONNECTED': {
        this.logger.log(
          `Handle MAILBOX_ACCOUNT_CONNECTED mailboxAccountId=${payload?.mailboxAccountId} email=${payload?.email}`,
        );
        return;
      }
      case 'MAILBOX_ACCOUNT_REVOKED': {
        this.logger.log(
          `Handle MAILBOX_ACCOUNT_REVOKED mailboxAccountId=${payload?.mailboxAccountId} email=${payload?.email}`,
        );
        return;
      }
      case 'MAILBOX_ACCOUNT_CONNECTED': {
        const p =
          typeof payload === 'string'
            ? (() => { try { return JSON.parse(payload); } catch { return null; } })()
            : payload;

        const mailboxAccountId = p?.mailboxAccountId as string | undefined;
        if (!mailboxAccountId) {
          this.logger.warn(`CONNECTED event missing mailboxAccountId payload=${JSON.stringify(payload)}`);
          return;
        }

        const prismaAny = this.prisma as any;

        const existing = await prismaAny.mailboxSyncJob.findFirst({
          where: { mailboxAccountId, type: 'INITIAL' },
          select: { id: true },
        });

        if (!existing) {
          await prismaAny.mailboxSyncJob.create({
            data: { mailboxAccountId, type: 'INITIAL', status: 'PENDING' },
          });
        }

        this.logger.log(`Queued INITIAL sync job for mailboxAccountId=${mailboxAccountId}`);
        return;
      }
      
      default:
        this.logger.warn(`Unknown outbox event type=${type}`);
        return;
    }
  }

  public async processOnce() {
    await this.tick();
  }
}