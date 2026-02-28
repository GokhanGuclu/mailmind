import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { MailboxSyncWorkerService } from '../providers/sync/mailbox-sync-worker.service';

type OutboxEventType = 'MAILBOX_ACCOUNT_CONNECTED' | string;

@Injectable()
export class OutboxWorkerService implements OnModuleInit {
  private readonly logger = new Logger(OutboxWorkerService.name);

  private interval: NodeJS.Timeout | null = null;

  private readonly workersEnabled =
    (process.env.WORKERS_ENABLED ?? 'true').toLowerCase() === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailboxSyncWorker: MailboxSyncWorkerService,
  ) {}

  onModuleInit() {
    if (!this.workersEnabled) {
      this.logger.log('Workers disabled (WORKERS_ENABLED=false). Interval not started.');
      return;
    }

    const intervalMs = Number(process.env.OUTBOX_WORKER_INTERVAL_MS ?? 1_000);

    this.interval = setInterval(() => {
      this.processOnce().catch((err) => {
        this.logger.error('Outbox worker tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);

    this.logger.log(`Outbox worker started (interval=${intervalMs}ms).`);
  }

  async processOnce(): Promise<void> {
    const event = await this.prisma.outboxEvent.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    if (!event) return;

    await this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: { status: 'PROCESSING' }, // ✅ startedAt yok
    });

    try {
      const type = event.type as OutboxEventType;
      this.logger.log(`Processing outbox event: ${event.id} (${type})`);

      switch (type) {
        case 'MAILBOX_ACCOUNT_CONNECTED': {
          let payload: any = event.payload as any;

          if (typeof payload === 'string') {
            try {
              payload = JSON.parse(payload);
            } catch {
              // ignore
            }
          }

          const mailboxAccountId =
            payload?.mailboxAccountId ?? payload?.mailboxId ?? payload?.id;

          if (!mailboxAccountId) {
            throw new Error('MAILBOX_ACCOUNT_CONNECTED payload missing mailboxAccountId');
          }

          await this.mailboxSyncWorker.enqueueForMailbox(mailboxAccountId);
          break;
        }

        default:
          this.logger.warn(`Unknown outbox event type: ${type}`);
      }

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'DONE' }, // ✅ finishedAt yok
      });
    } catch (err: any) {
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
        },
      });

      this.logger.error(`Outbox event failed: ${event.id}`, err?.stack ?? String(err));
    }
  }

  private async enqueueMailboxSync(mailboxAccountId: string): Promise<void> {
    // Senin MailboxSyncWorkerService API'si farklı olabilir.
    // Var olan methodları deniyoruz (hızlı ilerlemek için).
    const anyWorker = this.mailboxSyncWorker as any;

    if (typeof anyWorker.enqueueForMailbox === 'function') {
      await anyWorker.enqueueForMailbox(mailboxAccountId);
      return;
    }
    if (typeof anyWorker.enqueue === 'function') {
      await anyWorker.enqueue(mailboxAccountId);
      return;
    }
    if (typeof anyWorker.createJobForMailbox === 'function') {
      await anyWorker.createJobForMailbox(mailboxAccountId);
      return;
    }
    if (typeof anyWorker.createJob === 'function') {
      await anyWorker.createJob(mailboxAccountId);
      return;
    }

    throw new Error(
      'MailboxSyncWorkerService has no enqueue method. Add enqueueForMailbox(mailboxAccountId) or expose an equivalent method.',
    );
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.log('Outbox worker stopped.');
    }
  }
}