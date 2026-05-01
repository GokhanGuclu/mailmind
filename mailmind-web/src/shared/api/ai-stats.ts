import { apiRequest } from './client';

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
  topModel: { name: string; count: number } | null;
  latency: {
    samples: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    maxMs: number;
  };
  recent: Array<{
    id: string;
    status: string;
    model: string | null;
    latencyMs: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    processedAt: string | null;
    createdAt: string;
  }>;
  daily: Array<{
    date: string;
    total: number;
    done: number;
    failed: number;
  }>;
};

export const aiStatsApi = {
  summary(accessToken: string, days?: number) {
    const path = days ? `/ai/stats?days=${days}` : '/ai/stats';
    return apiRequest<AiStatsSummary>(path, { method: 'GET', token: accessToken });
  },
};
