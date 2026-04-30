import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  GoogleCalendarService,
  MissingCalendarScopeError,
} from './google-calendar.service';
import { MAX_ATTEMPTS, nextRetryDate } from '../../mailbox/infrastructure/retry-policy';

const DEFAULT_INTERVAL_MS = 30_000;
const BATCH_SIZE = 25;

/**
 * Onaylanmış (status=PENDING) ama Google Calendar'a henüz push edilmemiş
 * (externalId IS NULL) CalendarEvent'leri çeker, push'lar, başarılıysa
 * status=CONFIRMED + externalId işaretler. Hata olunca AiAnalysis pattern'i
 * ile retry/backoff (30s → 2dk → 10dk → terminal sync FAILURE).
 *
 * Terminal failure = syncAttemptCount MAX'a ulaştı; status PENDING kalır
 * ama syncNextRetryAt null'a çekilir. UI bu durumu syncErrorMessage ile
 * gösterir (örn 'Re-consent gerekli').
 */
@Injectable()
export class GoogleCalendarPushWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GoogleCalendarPushWorkerService.name);
  private interval: NodeJS.Timeout | null = null;

  private readonly workersEnabled =
    (process.env.WORKERS_ENABLED ?? 'true').toLowerCase() === 'true';

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendar: GoogleCalendarService,
  ) {}

  onModuleInit() {
    if (!this.workersEnabled) {
      this.logger.log('Calendar push worker disabled (WORKERS_ENABLED=false).');
      return;
    }
    const intervalMs = Number(
      process.env.CALENDAR_PUSH_WORKER_INTERVAL_MS ?? DEFAULT_INTERVAL_MS,
    );
    this.interval = setInterval(() => {
      this.tick().catch((err) => {
        this.logger.error('Calendar push tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);
    this.logger.log(`Calendar push worker started (interval=${intervalMs}ms).`);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Tek tur: vadesi gelmiş push'ları işler.
   * Public — e2e/test'ten manuel olarak da çağrılabilir.
   */
  async tick(now: Date = new Date()): Promise<{ pushed: number; failed: number }> {
    const due = await this.prisma.calendarEvent.findMany({
      where: {
        status: 'PENDING',
        externalId: null,
        OR: [{ syncNextRetryAt: null }, { syncNextRetryAt: { lte: now } }],
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    if (due.length === 0) return { pushed: 0, failed: 0 };

    let pushed = 0;
    let failed = 0;
    for (const ev of due) {
      try {
        await this.pushOne(ev);
        pushed++;
      } catch (err: any) {
        failed++;
        this.logger.error(
          `Failed to push event id=${ev.id}: ${err?.message ?? String(err)}`,
        );
      }
    }

    this.logger.log(`Calendar push tick: ${pushed} pushed, ${failed} failed.`);
    return { pushed, failed };
  }

  // ─── Per-event push ────────────────────────────────────────────────────

  private async pushOne(ev: {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date | null;
    isAllDay: boolean;
    location: string | null;
    attendees: string | null;
    rrule: string | null;
    timezone: string;
    syncAttemptCount: number;
  }): Promise<void> {
    try {
      const result = await this.calendar.insertEvent(ev.userId, {
        title: ev.title,
        description: ev.description,
        startAt: ev.startAt,
        endAt: ev.endAt,
        isAllDay: ev.isAllDay,
        location: ev.location,
        attendees: ev.attendees ? JSON.parse(ev.attendees) : undefined,
        rrule: ev.rrule,
        timezone: ev.timezone,
      });

      await this.prisma.calendarEvent.update({
        where: { id: ev.id },
        data: {
          status: 'CONFIRMED',
          externalSystem: 'google_calendar',
          externalId: result.externalId,
          syncErrorMessage: null,
          syncNextRetryAt: null,
          // syncAttemptCount sıfırlama — başarı sonrası temiz
          syncAttemptCount: 0,
        },
      });

      this.logger.log(
        `Pushed event id=${ev.id} → google_calendar=${result.externalId}`,
      );
    } catch (err: any) {
      const errorMessage =
        err instanceof MissingCalendarScopeError
          ? `Re-consent required: ${err.message}`
          : err?.message ?? String(err);

      await this.handleFailure(ev.id, ev.syncAttemptCount, errorMessage, err);

      // Re-consent durumunda log seviyesi warning — kullanıcı eylemi gerek
      if (err instanceof MissingCalendarScopeError) {
        this.logger.warn(
          `Calendar push paused for event id=${ev.id} — user re-consent required`,
        );
      }
    }
  }

  private async handleFailure(
    eventId: string,
    currentAttempt: number,
    errorMessage: string,
    err: any,
  ): Promise<void> {
    const attemptCount = currentAttempt + 1;

    if (attemptCount >= MAX_ATTEMPTS) {
      // Terminal: status PENDING kalır ama nextRetryAt null → worker bir
      // daha denemez. Kullanıcı UI'dan manuel re-trigger edebilir veya
      // (re-consent durumunda) Google'a yeniden bağlanır.
      await this.prisma.calendarEvent.update({
        where: { id: eventId },
        data: {
          syncAttemptCount: attemptCount,
          syncNextRetryAt: null,
          syncErrorMessage: errorMessage,
        },
      });
      this.logger.error(
        `Calendar push terminal FAILURE id=${eventId} attempt=${attemptCount}/${MAX_ATTEMPTS}: ${errorMessage}`,
        err?.stack,
      );
      return;
    }

    const nextRetryAt = nextRetryDate(attemptCount);
    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        syncAttemptCount: attemptCount,
        syncNextRetryAt: nextRetryAt,
        syncErrorMessage: errorMessage,
      },
    });
    this.logger.warn(
      `Calendar push retry scheduled id=${eventId} attempt=${attemptCount}/${MAX_ATTEMPTS} nextRetryAt=${nextRetryAt.toISOString()}: ${errorMessage}`,
    );
  }
}
