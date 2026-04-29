import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { EmailAnalyzerService } from './email-analyzer.service';

const STUCK_RECOVERY_EVERY_N_TICKS = 12; // 5sn × 12 ≈ 60sn'de bir recovery

@Injectable()
export class AiWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiWorkerService.name);
  private interval: NodeJS.Timeout | null = null;
  private tickCount = 0;

  private readonly workersEnabled =
    (process.env.WORKERS_ENABLED ?? 'true').toLowerCase() === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyzer: EmailAnalyzerService,
  ) {}

  onModuleInit() {
    if (!this.workersEnabled) {
      this.logger.log('AI worker disabled (WORKERS_ENABLED=false).');
      return;
    }

    const intervalMs = Number(process.env.AI_WORKER_INTERVAL_MS ?? 5_000);
    this.interval = setInterval(() => {
      this.tick().catch((err) => {
        this.logger.error('AI worker tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);

    this.logger.log(`AI worker started (interval=${intervalMs}ms).`);
  }

  onModuleDestroy() {
    this.stop();
  }

  /**
   * Tek tur: stuck recovery (her N tick'te bir) + bir PENDING analizi işle.
   */
  async tick(): Promise<void> {
    this.tickCount++;
    if (this.tickCount % STUCK_RECOVERY_EVERY_N_TICKS === 0) {
      await this.analyzer.recoverStuck().catch((err) => {
        this.logger.error('Stuck recovery failed', err?.stack ?? String(err));
      });
    }
    await this.processOnce();
  }

  /**
   * INBOX/SENT mesajına ait, vadesi gelmiş PENDING AiAnalysis kaydını al ve işle.
   * Vadesi gelmiş = nextRetryAt boş ya da geçmişte.
   */
  async processOnce(): Promise<void> {
    const now = new Date();
    const analysis = await this.prisma.aiAnalysis.findFirst({
      where: {
        status: 'PENDING',
        message: { folder: { in: ['INBOX', 'SENT'] } },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!analysis) return;

    await this.analyzer.process(analysis.id);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.log('AI worker stopped.');
    }
  }
}
