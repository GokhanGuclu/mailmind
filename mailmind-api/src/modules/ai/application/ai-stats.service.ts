import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';

const DEFAULT_WINDOW_DAYS = 30;
const MAX_WINDOW_DAYS = 365;

export type AiStatsSummary = {
  windowDays: number;
  totalAnalyses: number;
  done: number;
  failed: number;
  pending: number;
  noActions: number;
  failureRate: number;
  proposalsCreated: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  /** En çok kullanılan model adı (varsa) ve onun analiz sayısı. */
  topModel: { name: string; count: number } | null;
  latency: {
    samples: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    maxMs: number;
  };
  /** Son N analiz: zaman serisi grafiği için (ham örnekler). */
  recent: Array<{
    id: string;
    status: string;
    model: string | null;
    latencyMs: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    processedAt: Date | null;
    createdAt: Date;
  }>;
};

@Injectable()
export class AiStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, days?: number): Promise<AiStatsSummary> {
    const windowDays = Math.max(1, Math.min(days ?? DEFAULT_WINDOW_DAYS, MAX_WINDOW_DAYS));
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60_000);

    // Tüm analizleri tek query'de çek (kullanıcı başı az sayıda — tek pass app-side
    // hesap yeterli; daha sonra ölçek baskısı olursa DB-side aggregate yazarız).
    const rows = await this.prisma.aiAnalysis.findMany({
      where: { userId, createdAt: { gte: since } },
      select: {
        id: true,
        status: true,
        model: true,
        latencyMs: true,
        inputTokens: true,
        outputTokens: true,
        summary: true,
        processedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAnalyses = rows.length;
    let done = 0;
    let failed = 0;
    let pending = 0;
    let noActions = 0;
    let totalInput = 0;
    let totalOutput = 0;
    const latencies: number[] = [];
    const modelCounts: Record<string, number> = {};

    for (const r of rows) {
      if (r.status === 'DONE') done++;
      else if (r.status === 'FAILED') failed++;
      else if (r.status === 'PENDING' || r.status === 'PROCESSING') pending++;

      // "No actions" = DONE ama summary boş (ya AI hiçbir şey çıkaramadı, ya
      // analyzer markSkipped çağırdı — TRASH/SPAM aslında bu yola girmiyor
      // çünkü AiAnalysis bile yaratılmıyor; ama folder=INBOX/SENT olup
      // pazarlama maili olanlar burada çıkar).
      if (r.status === 'DONE' && !r.summary) noActions++;

      if (r.inputTokens != null) totalInput += r.inputTokens;
      if (r.outputTokens != null) totalOutput += r.outputTokens;
      if (r.latencyMs != null) latencies.push(r.latencyMs);

      if (r.model) modelCounts[r.model] = (modelCounts[r.model] ?? 0) + 1;
    }

    // Proposals — bu pencerede AI üretimi olan ve henüz onaylanmamış sayısı.
    // (Onaylanmış sonrası status PENDING'e geçtiği için aiAnalysisId üzerinden
    // groupBy almak da yeterli; sadeleştirmek için her bir tablodan PROPOSED
    // sayıyoruz.)
    const [propTasks, propEvents, propReminders] = await Promise.all([
      this.prisma.task.count({
        where: {
          userId,
          status: 'PROPOSED',
          aiAnalysisId: { not: null },
          createdAt: { gte: since },
        },
      }),
      this.prisma.calendarEvent.count({
        where: {
          userId,
          status: 'PROPOSED',
          aiAnalysisId: { not: null },
          createdAt: { gte: since },
        },
      }),
      this.prisma.reminder.count({
        where: {
          userId,
          status: 'PROPOSED',
          aiAnalysisId: { not: null },
          createdAt: { gte: since },
        },
      }),
    ]);
    const proposalsCreated = propTasks + propEvents + propReminders;

    // Latency aggregates
    const latency = this.aggLatency(latencies);

    // Top model
    let topModel: { name: string; count: number } | null = null;
    for (const [name, count] of Object.entries(modelCounts)) {
      if (!topModel || count > topModel.count) topModel = { name, count };
    }

    // Failure rate (denominator = DONE + FAILED, pending'i sayma)
    const settled = done + failed;
    const failureRate = settled === 0 ? 0 : failed / settled;

    return {
      windowDays,
      totalAnalyses,
      done,
      failed,
      pending,
      noActions,
      failureRate,
      proposalsCreated,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalTokens: totalInput + totalOutput,
      topModel,
      latency,
      recent: rows.slice(0, 20).map((r) => ({
        id: r.id,
        status: r.status,
        model: r.model,
        latencyMs: r.latencyMs,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        processedAt: r.processedAt,
        createdAt: r.createdAt,
      })),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private aggLatency(samples: number[]): AiStatsSummary['latency'] {
    if (samples.length === 0) {
      return { samples: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, maxMs: 0 };
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const avg = Math.round(samples.reduce((s, v) => s + v, 0) / samples.length);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
    const max = sorted[sorted.length - 1];
    return { samples: sorted.length, avgMs: avg, p50Ms: p50, p95Ms: p95, maxMs: max };
  }
}
