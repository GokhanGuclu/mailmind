import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LuActivity,
  LuChartLine,
  LuCircleAlert,
  LuCircleCheck,
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
          <SuccessBanner data={data} />

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

          <DailyChartCard daily={data.daily} />

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

function SuccessBanner({ data }: { data: AiStatsSummary }) {
  // Yeterli veri yoksa banner göstermenin değeri yok (ufak örneklemde
  // gürültülü görünür).
  if (data.done + data.failed < 5) return null;

  const successRate = 1 - data.failureRate;
  const avgMs = data.latency.avgMs;
  const isGood = successRate >= 0.9;
  const tone = isGood ? 'good' : 'warn';
  const Icon = isGood ? LuCircleCheck : LuCircleAlert;

  return (
    <div className={`ai-stats-banner ai-stats-banner--${tone}`} role="status">
      <span className="ai-stats-banner__icon" aria-hidden>
        <Icon size={20} />
      </span>
      <div className="ai-stats-banner__text">
        {isGood ? (
          <>
            <strong>%{(successRate * 100).toFixed(1)} başarı</strong>
            {avgMs > 0 && <> · ortalama <strong>{formatMs(avgMs)}</strong></>} ·{' '}
            {data.done} mail başarıyla analiz edildi.
          </>
        ) : (
          <>
            <strong>%{(data.failureRate * 100).toFixed(1)} hata oranı</strong> —
            son {data.windowDays} günde {data.failed} analiz başarısız oldu. Ollama
            servisi çalışıyor mu, log'lara bakmak iyi fikir.
          </>
        )}
      </div>
    </div>
  );
}

function DailyChartCard({ daily }: { daily: AiStatsSummary['daily'] }) {
  const hasData = daily.some((d) => d.total > 0);

  // SVG viewBox 600x140; 20 padding'le inner area (560 x 100)
  const W = 600;
  const H = 140;
  const padX = 20;
  const padTop = 12;
  const padBottom = 22;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const max = Math.max(1, ...daily.map((d) => d.total));
  const stepX = daily.length > 1 ? innerW / (daily.length - 1) : 0;

  const toPoint = (i: number, v: number) => {
    const x = padX + i * stepX;
    const y = padTop + innerH - (v / max) * innerH;
    return [x, y] as const;
  };

  const totalPath = daily
    .map((d, i) => {
      const [x, y] = toPoint(i, d.total);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const failedPath = daily
    .map((d, i) => {
      const [x, y] = toPoint(i, d.failed);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPath = daily.length
    ? `${totalPath} L${(padX + (daily.length - 1) * stepX).toFixed(1)},${padTop + innerH} L${padX},${padTop + innerH} Z`
    : '';

  const labelIndices = (() => {
    if (daily.length <= 7) return daily.map((_, i) => i);
    const step = Math.ceil(daily.length / 6);
    const out: number[] = [];
    for (let i = 0; i < daily.length; i += step) out.push(i);
    if (out[out.length - 1] !== daily.length - 1) out.push(daily.length - 1);
    return out;
  })();

  const formatLabel = (iso: string): string => {
    // YYYY-MM-DD → DD/MM
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  };

  return (
    <section className="ai-stats-chart-card">
      <h3>
        <LuChartLine size={14} /> Günlük analiz hacmi · {daily.length} gün
      </h3>
      {!hasData ? (
        <div className="ai-stats-chart-empty">Bu pencerede analiz yok.</div>
      ) : (
        <>
          <svg
            className="ai-stats-chart-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Günlük analiz adedi"
          >
            {/* yatay grid: 0 / max çizgileri */}
            <line
              className="ai-stats-chart-grid"
              x1={padX}
              x2={W - padX}
              y1={padTop + innerH}
              y2={padTop + innerH}
            />
            <line
              className="ai-stats-chart-grid"
              x1={padX}
              x2={W - padX}
              y1={padTop}
              y2={padTop}
            />
            <text x={padX} y={padTop - 2}>{max}</text>
            <text x={padX} y={H - padBottom + 12}>0</text>

            <path className="ai-stats-chart-area" d={areaPath} />
            <path className="ai-stats-chart-line" d={totalPath} />
            {daily.some((d) => d.failed > 0) && (
              <path className="ai-stats-chart-line ai-stats-chart-line--failed" d={failedPath} />
            )}

            {labelIndices.map((i) => {
              const [x] = toPoint(i, 0);
              return (
                <text key={i} x={x} y={H - 4} textAnchor="middle">
                  {formatLabel(daily[i].date)}
                </text>
              );
            })}
          </svg>
          <div className="ai-stats-chart-card__legend">
            <span className="ai-stats-chart-card__legend-item">
              <span className="ai-stats-chart-card__legend-swatch" /> Toplam analiz
            </span>
            <span className="ai-stats-chart-card__legend-item">
              <span className="ai-stats-chart-card__legend-swatch ai-stats-chart-card__legend-swatch--failed" />
              Başarısız
            </span>
          </div>
        </>
      )}
    </section>
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
