import { AiStatsService } from './ai-stats.service';

describe('AiStatsService.summary()', () => {
  let aiAnalysis: { findMany: jest.Mock };
  let task: { count: jest.Mock };
  let calendarEvent: { count: jest.Mock };
  let reminder: { count: jest.Mock };
  let svc: AiStatsService;

  beforeEach(() => {
    aiAnalysis = { findMany: jest.fn().mockResolvedValue([]) };
    task = { count: jest.fn().mockResolvedValue(0) };
    calendarEvent = { count: jest.fn().mockResolvedValue(0) };
    reminder = { count: jest.fn().mockResolvedValue(0) };
    const prisma = { aiAnalysis, task, calendarEvent, reminder } as any;
    svc = new AiStatsService(prisma);
  });

  it('empty window returns zeroed summary', async () => {
    const out = await svc.summary('u1');
    expect(out.totalAnalyses).toBe(0);
    expect(out.failureRate).toBe(0);
    expect(out.latency).toEqual({ samples: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, maxMs: 0 });
    expect(out.topModel).toBeNull();
    expect(out.recent).toEqual([]);
  });

  it('clamps days to [1, 365]', async () => {
    await svc.summary('u1', -5);
    expect((await svc.summary('u1', -5)).windowDays).toBe(1);
    expect((await svc.summary('u1', 9999)).windowDays).toBe(365);
    expect((await svc.summary('u1')).windowDays).toBe(30);
  });

  it('counts statuses, tokens, model usage; computes failure rate excluding pending', async () => {
    aiAnalysis.findMany.mockResolvedValue([
      { id: 'a1', status: 'DONE',    model: 'llama3.1:8b', latencyMs: 10_000, inputTokens: 200, outputTokens: 100, summary: 'x', processedAt: new Date(), createdAt: new Date() },
      { id: 'a2', status: 'DONE',    model: 'llama3.1:8b', latencyMs: 12_000, inputTokens: 220, outputTokens: 110, summary: 'y', processedAt: new Date(), createdAt: new Date() },
      { id: 'a3', status: 'FAILED',  model: 'llama3.1:8b', latencyMs: null,   inputTokens: null, outputTokens: null, summary: null, processedAt: null, createdAt: new Date() },
      { id: 'a4', status: 'PENDING', model: null,          latencyMs: null,   inputTokens: null, outputTokens: null, summary: null, processedAt: null, createdAt: new Date() },
      { id: 'a5', status: 'DONE',    model: 'qwen2.5:7b',  latencyMs: 9_000,  inputTokens: 180, outputTokens: 90,  summary: '',  processedAt: new Date(), createdAt: new Date() }, // noActions (empty summary)
    ]);

    const out = await svc.summary('u1');

    expect(out.totalAnalyses).toBe(5);
    expect(out.done).toBe(3);
    expect(out.failed).toBe(1);
    expect(out.pending).toBe(1);
    expect(out.noActions).toBe(1); // a5 done with empty summary
    expect(out.totalInputTokens).toBe(600);
    expect(out.totalOutputTokens).toBe(300);
    expect(out.totalTokens).toBe(900);
    // settled = 3 done + 1 failed = 4; failureRate = 1/4
    expect(out.failureRate).toBeCloseTo(0.25, 5);
    expect(out.topModel).toEqual({ name: 'llama3.1:8b', count: 3 });
    expect(out.latency.samples).toBe(3);
  });

  it('sums proposals from tasks/calendarEvents/reminders', async () => {
    task.count.mockResolvedValue(2);
    calendarEvent.count.mockResolvedValue(1);
    reminder.count.mockResolvedValue(3);

    const out = await svc.summary('u1');
    expect(out.proposalsCreated).toBe(6);
  });

  it('latency p95 computed from sorted samples', async () => {
    const latencies = [100, 200, 300, 400, 500, 600, 700, 800, 900, 10000];
    aiAnalysis.findMany.mockResolvedValue(
      latencies.map((ms, i) => ({
        id: `a${i}`, status: 'DONE', model: 'm', latencyMs: ms,
        inputTokens: null, outputTokens: null, summary: 'x',
        processedAt: new Date(), createdAt: new Date(),
      })),
    );
    const out = await svc.summary('u1');
    expect(out.latency.maxMs).toBe(10000);
    expect(out.latency.p95Ms).toBe(10000); // index floor(10*0.95)=9
    expect(out.latency.p50Ms).toBe(600); // index floor(10*0.5)=5
  });

  it('daily timeseries has windowDays buckets, fills missing days with zeros', async () => {
    const today = new Date();
    aiAnalysis.findMany.mockResolvedValue([
      { id: 'a1', status: 'DONE',   model: 'm', latencyMs: 100, inputTokens: 10, outputTokens: 5, summary: 'x', processedAt: today, createdAt: today },
      { id: 'a2', status: 'FAILED', model: 'm', latencyMs: null, inputTokens: null, outputTokens: null, summary: null, processedAt: null, createdAt: today },
      { id: 'a3', status: 'DONE',   model: 'm', latencyMs: 200, inputTokens: 20, outputTokens: 10, summary: 'y', processedAt: today, createdAt: today },
    ]);

    const out = await svc.summary('u1', 7);

    expect(out.daily).toHaveLength(7);
    // İlk 6 gün boş olmalı
    for (let i = 0; i < 6; i++) {
      expect(out.daily[i]).toEqual(expect.objectContaining({ total: 0, done: 0, failed: 0 }));
    }
    // Son gün = bugün, 3 analiz dolu
    expect(out.daily[6]).toEqual(expect.objectContaining({ total: 3, done: 2, failed: 1 }));
    // Tarihler eski → yeni sıralı, ISO format
    expect(out.daily[0].date < out.daily[6].date).toBe(true);
    expect(out.daily[6].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('caps recent[] at 20 items, ordered desc by query', async () => {
    aiAnalysis.findMany.mockResolvedValue(
      Array.from({ length: 50 }, (_, i) => ({
        id: `a${i}`, status: 'DONE', model: 'm', latencyMs: i,
        inputTokens: null, outputTokens: null, summary: 'x',
        processedAt: new Date(), createdAt: new Date(),
      })),
    );
    const out = await svc.summary('u1');
    expect(out.recent.length).toBe(20);
  });
});
