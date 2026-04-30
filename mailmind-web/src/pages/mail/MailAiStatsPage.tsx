import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LuActivity,
  LuChartLine,
  LuCircleAlert,
  LuClock,
  LuCpu,
  LuRefreshCw,
  LuSparkles,
} from 'react-icons/lu';
import { useAuth } from '../../shared/context/auth-context';
import { aiStatsApi, type AiStatsSummary } from '../../shared/api/ai-stats';
import './mail-ai-stats.css';

const WINDOW_OPTIONS = [
  { days: 7, label: '7 gün' },
  { days: 30, label: '30 gün' },
  { days: 90, label: '90 gün' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return 'şimdi';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} sa önce`;
    return `${Math.floor(diff / 86_400_000)} gün önce`;
  } catch {
    return iso;
  }
}

export function MailAiStatsPage() {
  const { accessToken } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AiStatsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiStatsApi.summary(accessToken, days);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? 'İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken, days]);

  useEffect(() => {
    load();
  }, [load]);

  const failureToneClass = useMemo(() => {
    if (!data) return '';
    if (data.failureRate > 0.2) return 'is-danger';
    if (data.failureRate > 0.05) return 'is-warn';
    return 'is-good';
  }, [data]);

  return (
    <div className="ai-stats-page">
      <div className="ai-stats-page__head">
        <div>
          <h2 className="ai-stats-page__heading">
            <LuChartLine size={22} aria-hidden /> AI İstatistikleri
          </h2>
          <p className="ai-stats-page__lead">
            E-posta analiz motorunun performansı: kaç mail işlendi, ne kadar token harcadı, ne kadar sürdü.
            Lokal Ollama kullanıldığı için API ücreti yok; tokenlar verim metriği.
          </p>
        </div>
        <div className="ai-stats-page__actions">
          <div className="ai-stats-page__window-tabs">
            {WINDOW_OPTIONS.map((w) => (
              <button
                key={w.days}
                type="button"
                className={days === w.days ? 'is-active' : ''}
                onClick={() => setDays(w.days)}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ai-stats-page__refresh"
            onClick={load}
            disabled={loading}
          >
            <LuRefreshCw size={16} className={loading ? 'is-spinning' : ''} aria-hidden /> Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="ai-stats-page__error">
          <LuCircleAlert size={16} /> {error}
        </div>
      )}

      {!data && !error && (
        <div className="ai-stats-page__empty">
          {loading ? 'Yükleniyor…' : 'Veri yok'}
        </div>
      )}

      {data && (
        <>
          <section className="ai-stats-page__kpis">
            <KpiCard
              icon={<LuSparkles size={18} />}
              label="Toplam analiz"
              value={formatNumber(data.totalAnalyses)}
              hint={`${data.windowDays} gün penceresi`}
            />
            <KpiCard
              icon={<LuActivity size={18} />}
              label="Üretilen öneriler"
              value={formatNumber(data.proposalsCreated)}
              hint="Onay bekleyen + işlenmiş AI çıkarımları"
            />
            <KpiCard
              icon={<LuClock size={18} />}
              label="Medyan latency"
              value={formatMs(data.latency.p50Ms)}
              hint={`p95 ${formatMs(data.latency.p95Ms)} · ${data.latency.samples} örnek`}
            />
            <KpiCard
              icon={<LuCircleAlert size={18} />}
              label="Hata oranı"
              value={formatPct(data.failureRate)}
              hint={`${data.failed} fail / ${data.done + data.failed} tamamlanmış`}
              toneClass={failureToneClass}
            />
          </section>

          <section className="ai-stats-page__row">
            <div className="ai-stats-card">
              <h3>
                <LuCpu size={14} /> Model & token tüketimi
              </h3>
              <dl>
                <dt>Aktif model</dt>
                <dd>
                  {data.topModel ? (
                    <>
                      <code>{data.topModel.name}</code>{' '}
                      <span className="ai-stats-muted">({data.topModel.count} analiz)</span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt>Input token</dt>
                <dd>{formatNumber(data.totalInputTokens)}</dd>
                <dt>Output token</dt>
                <dd>{formatNumber(data.totalOutputTokens)}</dd>
                <dt>Toplam token</dt>
                <dd>{formatNumber(data.totalTokens)}</dd>
              </dl>
            </div>

            <div className="ai-stats-card">
              <h3>
                <LuActivity size={14} /> Durum dağılımı
              </h3>
              <dl>
                <dt>Tamamlandı</dt>
                <dd>{data.done}</dd>
                <dt>Başarısız</dt>
                <dd>{data.failed}</dd>
                <dt>Bekleyen</dt>
                <dd>{data.pending}</dd>
                <dt>Boş çıkarım</dt>
                <dd>
                  {data.noActions}{' '}
                  <span className="ai-stats-muted">(pazarlama / aksiyon yok)</span>
                </dd>
              </dl>
            </div>
          </section>

          <section className="ai-stats-card ai-stats-card--full">
            <h3>
              <LuClock size={14} /> Son 20 analiz
            </h3>
            {data.recent.length === 0 ? (
              <p className="ai-stats-muted">Henüz analiz yok.</p>
            ) : (
              <table className="ai-stats-table">
                <thead>
                  <tr>
                    <th>Zaman</th>
                    <th>Durum</th>
                    <th>Model</th>
                    <th>Latency</th>
                    <th>Token (in / out)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id}>
                      <td>{formatRelative(r.processedAt ?? r.createdAt)}</td>
                      <td>
                        <span className={`ai-stats-status ai-stats-status--${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <code>{r.model ?? '—'}</code>
                      </td>
                      <td>{r.latencyMs != null ? formatMs(r.latencyMs) : '—'}</td>
                      <td>
                        {r.inputTokens != null
                          ? `${r.inputTokens} / ${r.outputTokens ?? '?'}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  toneClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  toneClass?: string;
}) {
  return (
    <div className={`ai-stats-kpi ${toneClass ?? ''}`}>
      <div className="ai-stats-kpi__head">
        {icon} <span>{label}</span>
      </div>
      <div className="ai-stats-kpi__value">{value}</div>
      {hint && <div className="ai-stats-kpi__hint">{hint}</div>}
    </div>
  );
}
