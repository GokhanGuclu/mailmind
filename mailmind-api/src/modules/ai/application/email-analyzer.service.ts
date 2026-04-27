import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import type { AiProviderPort, EmailContent } from './ports/ai-provider.port';
import { AI_PROVIDER_TOKEN } from './ports/ai-provider.port';
import { AnalysisResult } from '../domain/value-objects/analysis-result.vo';
import { AiResponseParseError } from '../domain/errors/ai.errors';
import { RecurrenceDetectorService } from './recurrence-detector.service';

const BODY_MAX_CHARS = 2000;

@Injectable()
export class EmailAnalyzerService {
  private readonly logger = new Logger(EmailAnalyzerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: AiProviderPort,
    private readonly recurrence: RecurrenceDetectorService,
  ) {}

  /**
   * Belirli bir AiAnalysis kaydını işler:
   * 1. Mesaj içeriğini yükle
   * 2. AI'a gönder
   * 3. Task + CalendarEvent kaydet
   * 4. AiAnalysis güncelle
   */
  async process(analysisId: string): Promise<void> {
    // Atomic claim: PENDING → PROCESSING
    const claimed = await this.prisma.aiAnalysis.updateMany({
      where: { id: analysisId, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count !== 1) return; // başka worker kapmış

    const analysis = await this.prisma.aiAnalysis.findUnique({
      where: { id: analysisId },
      select: {
        id: true,
        userId: true,
        mailboxMessageId: true,
        user: { select: { timezone: true } },
        message: {
          select: {
            folder: true,
            subject: true,
            from: true,
            date: true,
            bodyText: true,
            snippet: true,
          },
        },
      },
    });

    if (!analysis) return;

    // INBOX → kullanıcıya gelen, perspektif "incoming" (kim ne istiyor / ne planlıyor).
    // SENT  → kullanıcının yazdığı, perspektif "outgoing" (kullanıcı ne söz veriyor / planlıyor).
    // Diğer klasörler (TRASH/SPAM) atlanır.
    let direction: 'incoming' | 'outgoing';
    switch (analysis.message.folder) {
      case 'INBOX':
        direction = 'incoming';
        break;
      case 'SENT':
        direction = 'outgoing';
        break;
      default:
        await this.markSkipped(analysisId);
        return;
    }

    const userTimezone = analysis.user?.timezone ?? 'Europe/Istanbul';
    const content: EmailContent = {
      subject: analysis.message.subject ?? '(no subject)',
      from: analysis.message.from ?? 'unknown',
      date: analysis.message.date,
      bodyText: this.truncate(
        analysis.message.bodyText ?? analysis.message.snippet ?? '',
      ),
      userTimezone,
      nowIso: new Date().toISOString(),
      direction,
    };

    try {
      const result = await this.aiProvider.analyzeEmail(content);
      await this.persist(analysis.id, analysis.userId, result, userTimezone);

      this.logger.log(
        `Analysis done id=${analysisId} tasks=${result.tasks.length} events=${result.calendarEvents.length} reminders=${result.reminders.length}`,
      );
    } catch (err: any) {
      const errorMessage = err instanceof AiResponseParseError
        ? `Parse error: ${err.raw.slice(0, 200)}`
        : (err?.message ?? String(err));

      await this.prisma.aiAnalysis.update({
        where: { id: analysisId },
        data: { status: 'FAILED', errorMessage },
      });

      this.logger.error(`Analysis failed id=${analysisId}: ${errorMessage}`);
    }
  }

  // ---------------------------------------------------------------------------

  private async persist(
    analysisId: string,
    userId: string,
    result: AnalysisResult,
    userTimezone: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // AiAnalysis güncelle
      await tx.aiAnalysis.update({
        where: { id: analysisId },
        data: {
          status: 'DONE',
          model: this.aiProvider.modelName,
          summary: result.summary,
          rawResult: result as any,
          processedAt: new Date(),
        },
      });

      // Task'ları kaydet (rrule varsa doğrula). AI üretimi → PROPOSED.
      for (const t of result.tasks) {
        const taskRrule = this.safeRrule(t.rrule);
        await tx.task.create({
          data: {
            userId,
            aiAnalysisId: analysisId,
            title: t.title,
            notes: t.notes ?? null,
            dueAt: t.dueAt ?? null,
            rrule: taskRrule,
            priority: t.priority,
            status: 'PROPOSED',
          },
        });
      }

      // CalendarEvent'leri kaydet (rrule varsa doğrula)
      for (const e of result.calendarEvents) {
        const eventRrule = this.safeRrule(e.rrule, e.startAt);
        await tx.calendarEvent.create({
          data: {
            userId,
            aiAnalysisId: analysisId,
            title: e.title,
            startAt: e.startAt,
            endAt: e.endAt ?? null,
            location: e.location ?? null,
            attendees: e.attendees?.length ? JSON.stringify(e.attendees) : null,
            rrule: eventRrule,
            timezone: e.timezone ?? userTimezone,
            // status default olarak PROPOSED — kullanıcı onayı bekliyor
          },
        });
      }

      // Reminder'ları kaydet (RRULE doğrulaması: geçersizse PAUSED)
      for (const r of result.reminders) {
        if (!r.title || (!r.fireAt && !r.rrule)) continue;

        let nextFireAt: Date | null = r.fireAt ?? null;
        // AI üretimi → her zaman PROPOSED (onaylanınca ACTIVE'e geçer; rrule
        // geçersizse onaylama PAUSED'a düşer). Böylece scheduler PROPOSED'ları
        // tetiklemez, kullanıcı onayı şart.
        let status: 'PROPOSED' | 'PAUSED' = 'PROPOSED';
        let validatedRrule: string | null = null;

        if (r.rrule) {
          const v = this.recurrence.validate(r.rrule, r.fireAt ?? new Date());
          if (v.ok) {
            validatedRrule = r.rrule.replace(/^RRULE:/i, '').trim();
            nextFireAt = v.nextFireAt;
          } else {
            this.logger.warn(
              `Invalid rrule from LLM (analysis=${analysisId}): ${v.error}; reminder paused for review`,
            );
            status = 'PAUSED';
          }
        }

        await tx.reminder.create({
          data: {
            userId,
            aiAnalysisId: analysisId,
            title: r.title,
            notes: r.notes ?? null,
            fireAt: r.fireAt ?? null,
            rrule: validatedRrule,
            timezone: r.timezone ?? userTimezone,
            nextFireAt,
            status,
          },
        });
      }
    });
  }

  /**
   * RRULE'ü doğrular; geçersizse null döner (kayıt yine yapılır ama recurrence olmaz).
   * CalendarEvent için kullanılan varyant: dtstart vermek RRULE doğruluk kontrolünü iyileştirir.
   */
  private safeRrule(raw: string | null | undefined, dtstart?: Date): string | null {
    if (!raw) return null;
    const v = this.recurrence.validate(raw, dtstart ?? new Date());
    if (!v.ok) {
      this.logger.warn(`Dropping invalid rrule: ${v.error}`);
      return null;
    }
    return raw.replace(/^RRULE:/i, '').trim();
  }

  private async markSkipped(analysisId: string): Promise<void> {
    await this.prisma.aiAnalysis.update({
      where: { id: analysisId },
      data: { status: 'DONE', summary: null, processedAt: new Date() },
    });
  }

  private truncate(text: string): string {
    if (text.length <= BODY_MAX_CHARS) return text;
    return text.slice(0, BODY_MAX_CHARS) + '…';
  }
}
