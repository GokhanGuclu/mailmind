import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import type { AiProviderPort, EmailContent } from './ports/ai-provider.port';
import { AI_PROVIDER_TOKEN } from './ports/ai-provider.port';
import { AnalysisResult } from '../domain/value-objects/analysis-result.vo';
import { AiResponseParseError } from '../domain/errors/ai.errors';

const BODY_MAX_CHARS = 2000;

@Injectable()
export class EmailAnalyzerService {
  private readonly logger = new Logger(EmailAnalyzerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: AiProviderPort,
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

    // Sadece INBOX analiz et
    if (analysis.message.folder !== 'INBOX') {
      await this.markSkipped(analysisId);
      return;
    }

    const content: EmailContent = {
      subject: analysis.message.subject ?? '(no subject)',
      from: analysis.message.from ?? 'unknown',
      date: analysis.message.date,
      bodyText: this.truncate(
        analysis.message.bodyText ?? analysis.message.snippet ?? '',
      ),
    };

    try {
      const result = await this.aiProvider.analyzeEmail(content);
      await this.persist(analysis.id, analysis.userId, result);

      this.logger.log(
        `Analysis done id=${analysisId} tasks=${result.tasks.length} events=${result.calendarEvents.length}`,
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

      // Task'ları kaydet
      for (const t of result.tasks) {
        await tx.task.create({
          data: {
            userId,
            aiAnalysisId: analysisId,
            title: t.title,
            notes: t.notes ?? null,
            dueAt: t.dueAt ?? null,
            priority: t.priority,
          },
        });
      }

      // CalendarEvent'leri kaydet
      for (const e of result.calendarEvents) {
        await tx.calendarEvent.create({
          data: {
            userId,
            aiAnalysisId: analysisId,
            title: e.title,
            startAt: e.startAt,
            endAt: e.endAt ?? null,
            location: e.location ?? null,
            attendees: e.attendees?.length ? JSON.stringify(e.attendees) : null,
          },
        });
      }
    });
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
