import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { RecurrenceDetectorService } from './recurrence-detector.service';

const DEFAULT_INTERVAL_MS = 60_000;
const BATCH_SIZE = 50;

/**
 * `Reminder` tablosunu tarayıp `nextFireAt <= now` olan ACTIVE kayıtları
 * tetikler:
 * - Tek seferlik (sadece fireAt)        → COMPLETED
 * - Tekrarlı (rrule)                    → nextFireAt ileri alınır; bir sonraki
 *                                         occurrence yoksa COMPLETED
 *
 * Şu aşamada "tetikleme" = log + lastFiredAt güncelle. Gerçek bildirim
 * transport'u (push/email/in-app) sonraki PR'da Notification katmanı ile gelecek.
 */
@Injectable()
export class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private interval: NodeJS.Timeout | null = null;

  private readonly workersEnabled =
    (process.env.WORKERS_ENABLED ?? 'true').toLowerCase() === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly recurrence: RecurrenceDetectorService,
  ) {}

  onModuleInit() {
    if (!this.workersEnabled) {
      this.logger.log('Reminder scheduler disabled (WORKERS_ENABLED=false).');
      return;
    }

    const intervalMs = Number(
      process.env.REMINDER_SCHEDULER_INTERVAL_MS ?? DEFAULT_INTERVAL_MS,
    );
    this.interval = setInterval(() => {
      this.tick().catch((err) => {
        this.logger.error('Scheduler tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);

    this.logger.log(`Reminder scheduler started (interval=${intervalMs}ms).`);
  }

  onModuleDestroy() {
    this.stop();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.log('Reminder scheduler stopped.');
    }
  }

  /**
   * Tek tur: vadesi gelmiş reminder'ları tetikler.
   * E2e/test için public, manuel olarak da çağrılabilir.
   */
  async tick(now: Date = new Date()): Promise<number> {
    const due = await this.prisma.reminder.findMany({
      where: {
        status: 'ACTIVE',
        nextFireAt: { lte: now },
      },
      orderBy: { nextFireAt: 'asc' },
      take: BATCH_SIZE,
      select: {
        id: true,
        userId: true,
        title: true,
        rrule: true,
        fireAt: true,
        nextFireAt: true,
      },
    });

    if (due.length === 0) return 0;

    let fired = 0;
    for (const r of due) {
      try {
        await this.fireOne(r, now);
        fired++;
      } catch (err: any) {
        this.logger.error(
          `Failed to fire reminder id=${r.id}: ${err?.message ?? String(err)}`,
          err?.stack,
        );
      }
    }

    if (fired > 0) {
      this.logger.log(`Fired ${fired}/${due.length} reminders.`);
    }
    return fired;
  }

  // ---------------------------------------------------------------------------

  private async fireOne(
    reminder: {
      id: string;
      userId: string;
      title: string;
      rrule: string | null;
      fireAt: Date | null;
      nextFireAt: Date | null;
    },
    now: Date,
  ): Promise<void> {
    // Şu aşamada "tetikleme" = yapısal log. Frontend GET /reminders ile lastFiredAt
    // üzerinden gösterebilir. Notification transport'u sonraki PR.
    this.logger.log(
      `[REMINDER FIRED] id=${reminder.id} user=${reminder.userId} title="${reminder.title}" recurring=${!!reminder.rrule}`,
    );

    let nextFireAt: Date | null = null;
    let status: 'ACTIVE' | 'COMPLETED' = 'COMPLETED';

    if (reminder.rrule) {
      // Tekrarlı: bir sonraki occurrence'ı bul (mevcut nextFireAt'ten sonra)
      const after = reminder.nextFireAt ?? now;
      nextFireAt = this.recurrence.computeNextFireAt(reminder.rrule, after);
      status = nextFireAt ? 'ACTIVE' : 'COMPLETED';
    }

    await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        lastFiredAt: now,
        nextFireAt,
        status,
      },
    });
  }
}
