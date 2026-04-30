-- AiAnalysis telemetry alanları: token sayıları ve latency.
-- Cost/performance dashboard'u, prompt iyileştirme A/B'leri için temel.
ALTER TABLE "AiAnalysis"
  ADD COLUMN "inputTokens"  INTEGER,
  ADD COLUMN "outputTokens" INTEGER,
  ADD COLUMN "latencyMs"    INTEGER;
