import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobitoAuth } from "../../../context/LinkContxt";
import { useTranslation } from "../../../context/translation-context";
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "./JobAnalytics.module.css";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5200";

interface Application {
  applicationId: number;
  status: string;
  appliedAt: string;
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

interface JobDetail {
  jobId: number;
  title: string;
  address: string;
  jobType: string;
  description?: string;
  slotsAvailable: number;
  slots?: number;
  createdAt?: string;
  category?: { name: string };
  applications?: Application[];
}

/* ── CountUp ── */
function CountUp({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start = 0;
    const step = Math.ceil(target / 40) || 1;
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(start);
    }, 25);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

/* ── Donut Chart ── */
function DonutChart({ data, colors }: { data: number[]; colors: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        cutout: "68%",
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed}` } } },
        animation: { animateRotate: true, duration: 800 },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data, colors]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%" }} />;
}

/* ── SVG Line Chart ── */
function SvgLineChart({ points, width = 600, height = 160 }: { points: number[]; width?: number; height?: number }) {
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const maxV = Math.max(...points, 1);
  const minV = 0;

  const coords = points.map((v, i) => ({
    x: pad.left + (i / (points.length - 1)) * chartW,
    y: pad.top + (1 - (v - minV) / (maxV - minV)) * chartH,
  }));

  const linePath = coords
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Smooth curve using cubic bezier
  const smoothPath = coords.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = coords[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");

  const areaPath = `${smoothPath} L${coords[coords.length - 1].x.toFixed(1)},${(pad.top + chartH).toFixed(1)} L${pad.left},${(pad.top + chartH).toFixed(1)} Z`;

  // Y grid lines
  const yTicks = 4;
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = Math.round((maxV * i) / yTicks);
    const y = pad.top + (1 - i / yTicks) * chartH;
    return { val, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A6ED1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4A6ED1" stopOpacity="0" />
        </linearGradient>
        <filter id="glowLine">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yLines.map(({ val, y }) => (
        <g key={val}>
          <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
          <text x={pad.left - 8} y={y + 4} fontSize="9" fill="rgba(255,255,255,0.3)"
            textAnchor="end" fontFamily="'DM Mono', monospace">
            {val > 999 ? `${(val / 1000).toFixed(1)}k` : val}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#lineAreaGrad)" />

      {/* Line */}
      <path d={smoothPath} fill="none" stroke="#4A6ED1" strokeWidth="2.5"
        strokeLinecap="round" filter="url(#glowLine)" />

      {/* Dots */}
      {coords.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#4A6ED1" stroke="#fff" strokeWidth="1.5" />
        </g>
      ))}

      {/* X labels */}
      {coords.map((p, i) => (
        <text key={i} x={p.x} y={pad.top + chartH + 18} fontSize="9"
          fill="rgba(255,255,255,0.35)" textAnchor="middle" fontFamily="'DM Sans', sans-serif">
          D{i + 1}
        </text>
      ))}
    </svg>
  );
}

/* ── Tooltip for hoverable point ── */
function SvgLineChartWithLabels({
  points,
  labels,
}: {
  points: number[];
  labels: string[];
}) {
  const width = 700;
  const height = 180;
  const pad = { top: 24, right: 24, bottom: 36, left: 44 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxV = Math.max(...points, 1);
  const [hover, setHover] = useState<number | null>(null);

  const coords = useMemo(() => points.map((v, i) => ({
    x: pad.left + (i / Math.max(points.length - 1, 1)) * chartW,
    y: pad.top + (1 - v / maxV) * chartH,
    v,
  })), [points, maxV, chartW, chartH, pad.left, pad.top]);

  const smoothPath = coords.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = coords[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");

  const areaPath = coords.length > 1
    ? `${smoothPath} L${coords[coords.length - 1].x.toFixed(1)},${(pad.top + chartH).toFixed(1)} L${pad.left},${(pad.top + chartH).toFixed(1)} Z`
    : "";

  const yTicks = 4;
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => ({
    val: Math.round((maxV * i) / yTicks),
    y: pad.top + (1 - i / yTicks) * chartH,
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A6ED1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4A6ED1" stopOpacity="0" />
        </linearGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {yLines.map(({ val, y }) => (
        <g key={val}>
          <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="5 4" />
          <text x={pad.left - 8} y={y + 4} fontSize="9" fill="rgba(255,255,255,0.28)"
            textAnchor="end" fontFamily="'DM Mono',monospace">
            {val > 999 ? `${(val / 1000).toFixed(1)}k` : val}
          </text>
        </g>
      ))}

      {areaPath && <path d={areaPath} fill="url(#areaGrad2)" />}
      {coords.length > 1 && (
        <path d={smoothPath} fill="none" stroke="#4A6ED1" strokeWidth="2.5"
          strokeLinecap="round" filter="url(#glow2)" />
      )}

      {coords.map((p, i) => (
        <g key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: "pointer" }}>
          {/* hover vertical line */}
          {hover === i && (
            <line x1={p.x} y1={pad.top} x2={p.x} y2={pad.top + chartH}
              stroke="rgba(74,110,209,0.4)" strokeWidth="1" strokeDasharray="4 3" />
          )}
          {/* tooltip */}
          {hover === i && (
            <g>
              <rect x={p.x - 28} y={p.y - 30} width="56" height="22" rx="6"
                fill="#4A6ED1" opacity="0.92" />
              <text x={p.x} y={p.y - 14} fontSize="10" fill="#fff"
                textAnchor="middle" fontFamily="'DM Mono',monospace" fontWeight="700">
                {p.v.toLocaleString()}
              </text>
            </g>
          )}
          <circle cx={p.x} cy={p.y} r={hover === i ? 6 : 4}
            fill={hover === i ? "#fff" : "#4A6ED1"}
            stroke={hover === i ? "#4A6ED1" : "#fff"}
            strokeWidth="2"
            style={{ transition: "r 0.15s" }} />
          <text x={p.x} y={pad.top + chartH + 18} fontSize="9"
            fill="rgba(255,255,255,0.35)" textAnchor="middle" fontFamily="'DM Sans',sans-serif">
            {labels[i] || `D${i + 1}`}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ══════════════ MAIN COMPONENT ══════════════ */
export default function JobAnalytics() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { apiFetch } = useJobitoAuth();
  const { t, language } = useTranslation();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const jobRes = await apiFetch(`${API_BASE_URL}/api/jobs/${jobId}`);
        if (!jobRes.ok) throw new Error("Job not found");
        const jobData: JobDetail = await jobRes.json();
        setJob(jobData);

        const appsRes = await apiFetch(`${API_BASE_URL}/api/applications/job/${jobId}`);
        if (appsRes.ok) {
          const d = await appsRes.json();
          setApplications(Array.isArray(d) ? d : d.data || d.applications || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("خطأ في جلب البيانات"));
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchData();
  }, [jobId, apiFetch]);

  /* ── derived stats ── */
  const total       = applications.length;
  const hiredCount  = applications.filter(a => a.status?.toLowerCase() === "hired").length;
  const reviewCount = applications.filter(a => a.status?.toLowerCase() === "reviewing").length;
  const declinedCnt = applications.filter(a => a.status?.toLowerCase() === "declined").length;
  const pendingCnt  = applications.filter(a => a.status?.toLowerCase() === "applied").length;
  const capacity    = job?.slotsAvailable || job?.slots || 10;

  /* ── chart view (daily applications last N days) ── */
  const chartDays = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      return d;
    });
  }, [range]);

  const chartPoints = useMemo(() =>
    chartDays.map(day =>
      applications.filter(a => new Date(a.appliedAt).toDateString() === day.toDateString()).length
    ), [chartDays, applications]);

  const chartLabels = chartDays.map(d =>
    d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
  );

  /* ── donut data ── */
  const donutData   = [pendingCnt, reviewCount, hiredCount, declinedCnt];
  const donutColors = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];
  const donutLabels = [t("انتظار"), t("مراجعة"), t("مقبول"), t("مرفوض")];

  if (loading) return (
    <div className={styles.loadingWrap}>
      <div className={styles.spinner} />
      <p>{t("جاري التحميل...")}</p>
    </div>
  );

  if (error || !job) return (
    <div className={styles.errorWrap}>
      <span>⚠️</span>
      <p>{t(error || "الوظيفة غير موجودة")}</p>
      <button onClick={() => navigate(-1)}>{t("العودة")}</button>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>{t("العودة")}</span>
          </button>
          <div>
            <h1 className={styles.pageTitle}>{t(job.title)}</h1>
            <p className={styles.pageSub}>
              <span className={styles.jobBadge}>{t(job.jobType || "دوام كامل")}</span>
              <span>📍 {t(job.address || "عن بُعد")}</span>
              {job.category?.name && <span>🏷️ {t(job.category.name)}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={styles.mainGrid}>

        {/* ─── LEFT: metrics + line chart ─── */}
        <div className={styles.leftCol}>

          {/* Metric Cards Row */}
          <div className={styles.metricsRow}>
            {/* Total Applied */}
            <div className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={styles.metricLabel}>{t("إجمالي المتقدمين")}</span>
                <div className={styles.metricIcon} style={{ background: "rgba(74,110,209,0.18)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6ED1" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div className={styles.metricNum}><CountUp target={total} /></div>
              <div className={styles.metricSub}>
                <span className={styles.metricChange} style={{ color: "#10b981" }}>
                  ▲ {hiredCount} {t("مقبول")}
                </span>
                <span className={styles.metricOf}>{t("من")} {capacity} {t("متاح")}</span>
              </div>
            </div>

            {/* Hired */}
            <div className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={styles.metricLabel}>{t("تم التوظيف")}</span>
                <div className={styles.metricIcon} style={{ background: "rgba(16,185,129,0.18)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <div className={styles.metricNum} style={{ color: "#10b981" }}>
                <CountUp target={hiredCount} />
              </div>
              <div className={styles.metricSub}>
                <span className={styles.metricChange} style={{ color: declinedCnt > 0 ? "#ef4444" : "#6b7280" }}>
                  {declinedCnt > 0 ? `▼ ${declinedCnt} ${t("مرفوض")}` : t("لا يوجد مرفوضين")}
                </span>
              </div>
            </div>

            {/* Reviewing */}
            <div className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={styles.metricLabel}>{t("قيد المراجعة")}</span>
                <div className={styles.metricIcon} style={{ background: "rgba(245,158,11,0.18)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
              <div className={styles.metricNum} style={{ color: "#f59e0b" }}>
                <CountUp target={reviewCount} />
              </div>
              <div className={styles.metricSub}>
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  {pendingCnt} {t("في الانتظار")}
                </span>
              </div>
            </div>
          </div>

          {/* Line Chart Card */}
          <div className={styles.lineCard}>
            <div className={styles.lineCardHeader}>
              <div>
                <h3 className={styles.lineCardTitle}>{t("إحصائيات التقديمات")}</h3>
                <p className={styles.lineCardSub}>{t("عدد التقديمات اليومية")}</p>
              </div>
              <div className={styles.rangeButtons}>
                {[5, 7, 14, 30].map(r => (
                  <button
                    key={r}
                    className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ""}`}
                    onClick={() => setRange(r)}
                  >
                    {r === 5 ? t("آخر 5 أيام") : r === 7 ? t("أسبوع") : r === 14 ? t("أسبوعان") : t("شهر")}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.lineChartWrap}>
              <SvgLineChartWithLabels points={chartPoints} labels={chartLabels} />
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Donut + Table ─── */}
        <div className={styles.rightCol}>

          {/* Traffic / Status Donut */}
          <div className={styles.donutCard}>
            <h3 className={styles.donutTitle}>{t("توزيع الحالات")}</h3>
            <div className={styles.donutWrap}>
              <div className={styles.donutCanvas}>
                <DonutChart data={donutData} colors={donutColors} />
                <div className={styles.donutCenter}>
                  <span className={styles.donutTotal}>{total}</span>
                  <span className={styles.donutSub}>{t("إجمالي")}</span>
                </div>
              </div>
              <div className={styles.donutLegend}>
                {donutLabels.map((label, i) => (
                  <div key={i} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: donutColors[i] }} />
                    <span className={styles.legendLabel}>{label}</span>
                    <span className={styles.legendVal}>{donutData[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Applicants */}
          <div className={styles.recentCard}>
            <div className={styles.recentHeader}>
              <h3 className={styles.recentTitle}>{t("آخر المتقدمين")}</h3>
              <button className={styles.seeAllBtn} onClick={() => {}}>
                {t("عرض الكل")} →
              </button>
            </div>
            <div className={styles.recentList}>
              {applications.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>📭</span>
                  <p>{t("لا يوجد متقدمون بعد")}</p>
                </div>
              ) : (
                applications.slice(0, 5).map((app) => {
                  const av = app.user?.avatarUrl
                    ? app.user.avatarUrl.startsWith("http")
                      ? app.user.avatarUrl
                      : `${API_BASE_URL}${app.user.avatarUrl}`
                    : null;
                  const statusColor: Record<string, string> = {
                    hired: "#10b981", declined: "#ef4444",
                    reviewing: "#f59e0b", applied: "#3b82f6",
                  };
                  const statusLabel: Record<string, string> = {
                    hired: t("مقبول"), declined: t("مرفوض"),
                    reviewing: t("مراجعة"), applied: t("انتظار"),
                  };
                  const sc = statusColor[app.status?.toLowerCase()] || "#6b7280";
                  const sl = statusLabel[app.status?.toLowerCase()] || t(app.status || "—");
                  return (
                    <div key={app.applicationId} className={styles.recentRow}
                      onClick={() => navigate(`/ApplicantDetails/${app.applicationId}`)}
                    >
                      <div className={styles.recentAvatar}>
                        {av
                          ? <img src={av} alt={app.user?.fullName} />
                          : <span>{app.user?.fullName?.[0] || "?"}</span>}
                      </div>
                      <div className={styles.recentInfo}>
                        <span className={styles.recentName}>{t(app.user?.fullName || "—")}</span>
                        <span className={styles.recentDate}>
                          {new Date(app.appliedAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                        </span>
                      </div>
                      <span className={styles.recentBadge} style={{ color: sc, borderColor: sc + "33", background: sc + "18" }}>
                        {sl}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
