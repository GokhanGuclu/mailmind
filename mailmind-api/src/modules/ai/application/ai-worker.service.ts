import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { EmailAnalyzerService } from './email-analyzer.service';

@Injectable()
export class AiWorkerService implements OnModuleInit {
  private readonly logger = new Logger(AiWorkerService.name);
  private interval: NodeJS.Timeout | null = null;

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
      this.processOnce().catch((err) => {
        this.logger.error('AI worker tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);

    this.logger.log(`AI worker started (interval=${intervalMs}ms).`);
  }

  async processOnce(): Promise<void> {
    // INBOX veya SENT klasöründeki mesaja ait, en eski PENDING AiAnalysis kaydını al.
    // SENT genişlemesi: kullanıcının kendi söz verdiği şeyleri (giden mailde) yakalamak için.
    const analysis = await this.prisma.aiAnalysis.findFirst({
      where: {
        status: 'PENDING',
        message: { folder: { in: ['INBOX', 'SENT'] } },
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
