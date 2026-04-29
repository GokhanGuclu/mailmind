import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
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
    private readonly notifications: NotificationsService,
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
    let raced = 0;
    for (const r of due) {
      try {
        const won = await this.fireOne(r, now);
        if (won) fired++;
        else raced++;
      } catch (err: any) {
        this.logger.error(
          `Failed to fire reminder id=${r.id}: ${err?.message ?? String(err)}`,
          err?.stack,
        );
      }
    }

    if (fired > 0 || raced > 0) {
      this.logger.log(
        `Fired ${fired}/${due.length} reminders` +
          (raced > 0 ? ` (${raced} skipped — already claimed by another worker)` : ''),
      );
    }
    return fired;
  }

  // ---------------------------------------------------------------------------

  /**
   * Atomic claim ile tek bir reminder'ı ateşler.
   *
   * Race koşulu: aynı reminder iki scheduler worker tarafından aynı anda
   * fetch edilebilir → ikisi de fire eder → çift Notification.
   *
   * Çözüm: updateMany'i `where: { id, nextFireAt: <fetch'tekiyle aynı> }`
   * guard'ı ile yap. Sadece nextFireAt'ı ilerleten ilk worker `count=1`
   * alır; diğerleri `count=0` görüp sessizce çekilir. Notification.create
   * aynı transaction içinde olduğu için kaybeden taraf hiçbir kayıt
   * bırakmaz (atomik all-or-nothing).
   *
   * Dönüş: true = bu worker fire'ı kazandı; false = race kaybedildi.
   */
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
  ): Promise<boolean> {
    let nextFireAt: Date | null = null;
    let status: 'ACTIVE' | 'COMPLETED' = 'COMPLETED';

    if (reminder.rrule) {
      const after = reminder.nextFireAt ?? now;
      nextFireAt = this.recurrence.computeNextFireAt(reminder.rrule, after);
      status = nextFireAt ? 'ACTIVE' : 'COMPLETED';
    }

    return this.prisma.$transaction(async (tx) => {
      // Atomic claim: yalnızca nextFireAt hâlâ aynıysa güncelle.
      // Başka bir worker zaten ilerlettiyse count=0 → çekil.
      const claim = await tx.reminder.updateMany({
        where: {
          id: reminder.id,
          status: 'ACTIVE',
          nextFireAt: reminder.nextFireAt,
        },
        data: { lastFiredAt: now, nextFireAt, status },
      });

      if (claim.count !== 1) {
        // Yarış kaybedildi — tx rollback (notification yaratılmaz).
        return false;
      }

      await tx.notification.create({
        data: {
          userId: reminder.userId,
          type: 'REMINDER_FIRED',
          title: reminder.title,
          body: reminder.rrule
            ? `Tekrarlayan anımsatıcı tetiklendi.${nextFireAt ? ` Sıradaki: ${nextFireAt.toISOString()}` : ' Tamamlandı.'}`
            : 'Anımsatıcı tetiklendi.',
          sourceType: 'reminder',
          sourceId: reminder.id,
        },
      });

      this.logger.log(
        `[REMINDER FIRED] id=${reminder.id} user=${reminder.userId} title="${reminder.title}" recurring=${!!reminder.rrule}`,
      );
      return true;
    });
  }
}
