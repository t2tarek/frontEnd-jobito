import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../context/TranslationContext";
import styles from "./Admin.module.css";
import {
  BarChart2,
  Package,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  CheckCircle,
  CreditCard,
  DollarSign,
  Landmark,
  Bell,
  Sun,
  Moon,
  Headset,
  Calendar,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Eye,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
type Status = "Approved" | "Rejected" | "Pending";

interface Company {
  name: string;
  avatar: string;
  color: [string, string];
  location: string;
  date: string;
  status: Status;
}

interface Segment {
  label: string;
  pct: number;
  color: string;
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const MONTHS: string[] = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const SALES_2021: number[] = [180, 240, 210, 310, 280, 350, 420, 390, 460, 380, 500, 470];
const SALES_2022: number[] = [220, 190, 270, 360, 310, 400, 380, 430, 490, 420, 540, 510];

const ACTIVITY_2021: number[] = [
  280, 310, 250, 380, 420, 360, 490, 450, 520, 480, 560, 530,
];
const ACTIVITY_2022: number[] = [
  180, 230, 290, 340, 310, 380, 350, 420, 460, 400, 510, 480,
];

const COMPANIES: Company[] = [
  { name: "Tech Vision", avatar: "TV", color: ["#6366f1", "#818cf8"], location: "Riyadh", date: "22.10.2023", status: "Pending" },
  { name: "Global Solutions", avatar: "GS", color: ["#10b981", "#34d399"], location: "Jeddah", date: "24.10.2023", status: "Approved" },
  { name: "Alpha Tech", avatar: "AT", color: ["#f59e0b", "#fbbf24"], location: "Cairo", date: "18.10.2023", status: "Rejected" },
  { name: "Mega Corp", avatar: "MC", color: ["#8b5cf6", "#a78bfa"], location: "Dubai", date: "03.11.2023", status: "Pending" },
  { name: "Innovate LLC", avatar: "IL", color: ["#06b6d4", "#22d3ee"], location: "Amman", date: "01.11.2023", status: "Approved" },
];

const USER_SEGMENTS: Segment[] = [
  { label: "Job Seekers", pct: 62, color: "#f59e0b" },
  { label: "Employers", pct: 26, color: "#6366f1" },
  { label: "Inactive", pct: 12, color: "#e2e8f0" },
];

const SUB_SEGMENTS: Segment[] = [
  { label: "Enterprise", pct: 70, color: "#6366f1" },
  { label: "Startups", pct: 30, color: "#e2e8f0" },
];

const NAV = [
  { id: "analytics", label: "Analytics", icon: <BarChart2 size={18} /> },
  { id: "companies", label: "Companies", icon: <Package size={18} /> },
  { id: "messages", label: "Inbox", icon: <MessageSquare size={18} /> },
  { id: "seekers", label: "Job Seekers", icon: <Users size={18} /> },
];

const STATUS_CONFIG: Record<Status, { bg: string; color: string }> = {
  Approved: { bg: "#dcfce7", color: "#16a34a" },
  Rejected: { bg: "#fee2e2", color: "#dc2626" },
  Pending: { bg: "#fef9c3", color: "#b45309" },
};

// ─── Mini Charts ──────────────────────────────────────────────────────────────
interface BarChartProps {
  data: number[];
  year: number;
  onYearToggle: () => void;
}
function BarChart({ data, year, onYearToggle }: BarChartProps) {
  const { t } = useTranslation();
  const max = Math.max(...data);
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>{t("Jobs Posted Over Time")}</div>
        <button className={styles.chartYearBtn} onClick={onYearToggle}>
          {year} ▾
        </button>
      </div>
      <div className={styles.barChart}>
        {data.map((v, i) => {
          const h = (v / max) * 100;
          const isHov = hov === i;
          return (
            <div
              key={i}
              className={styles.barCol}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            >
              <div className={styles.barWrap}>
                <div
                  className={`${styles.bar} ${isHov ? styles.highlight : ""}`}
                  style={{ height: `${h}%` }}
                >
                  <div className={styles.barShimmer}></div>
                </div>
                <div className={styles.barTooltip}>{v.toLocaleString()}</div>
              </div>
              <div className={styles.barLabel}>{t(MONTHS[i])}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface LineChartProps {
  data1: number[];
  data2: number[];
  year: number;
  onYearToggle: () => void;
}
function LineChart({ data1, data2, year, onYearToggle }: LineChartProps) {
  const { t } = useTranslation();
  const [hov, setHov] = useState<number | null>(null);
  const all = [...data1, ...data2];
  const max = Math.max(...all),
    min = Math.min(...all);
  const W = 340,
    H = 120,
    PL = 10,
    PR = 10,
    PT = 10,
    PB = 28;
  const cw = W - PL - PR,
    ch = H - PT - PB;
  const px = (i: number) => PL + (i / (data1.length - 1)) * cw;
  const py = (v: number) => PT + ch - ((v - min) / (max - min + 1)) * ch;
  const path = (d: number[]) =>
    d.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(v)}`).join(" ");
  const area = (d: number[]) =>
    `${path(d)} L${px(d.length - 1)},${PT + ch} L${PL},${PT + ch} Z`;
  return (
    <div>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>{t("User Registration Dynamics")}</div>
        <button className={styles.chartYearBtn} onClick={onYearToggle}>
          {year} ▾
        </button>
      </div>
      <div className={styles.lineChartWrap}>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Y grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={i}
              x1={PL}
              y1={PT + ch * t}
              x2={W - PR}
              y2={PT + ch * t}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}
          {/* Area fills */}
          <path d={area(data1)} fill="url(#g1)" />
          <path d={area(data2)} fill="url(#g2)" />
          {/* Lines */}
          <path
            d={path(data1)}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path(data2)}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5,3"
          />
          {/* X labels */}
          {MONTHS.map((m, i) => (
            <text
              key={i}
              x={px(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="8"
              fill="var(--muted)"
              fontFamily="DM Sans"
            >
              {t(m)}
            </text>
          ))}
          {/* Hover dots */}
          {hov !== null && (
            <>
              <circle
                cx={px(hov)}
                cy={py(data1[hov])}
                r="4"
                fill="#6366f1"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={px(hov)}
                cy={py(data2[hov])}
                r="4"
                fill="#a855f7"
                stroke="#fff"
                strokeWidth="2"
              />
              <rect
                x={px(hov) - 28}
                y={py(data1[hov]) - 28}
                width={56}
                height={20}
                rx={5}
                fill="#1f2937"
              />
              <text
                x={px(hov)}
                y={py(data1[hov]) - 14}
                textAnchor="middle"
                fontSize="9"
                fill="#fff"
                fontWeight="700"
                fontFamily="DM Sans"
              >
                {data1[hov].toLocaleString()}
              </text>
            </>
          )}
          <rect
            x={PL}
            y={PT}
            width={cw}
            height={ch}
            fill="transparent"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - r.left) / r.width;
              setHov(Math.round(pct * (data1.length - 1)));
            }}
            onMouseLeave={() => setHov(null)}
          />
        </svg>
      </div>
    </div>
  );
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
}
function DonutChart({ segments, size = 80 }: DonutChartProps) {
  const [hov, setHov] = useState<number | null>(null);
  const stroke = 14,
    r = (size - stroke) / 2,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const arcs = segments.map((s) => {
    const dash = (s.pct / 100) * circ;
    const a = { ...s, dash, off, gap: circ - dash };
    off += dash;
    return a;
  });
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={hov === i ? stroke + 2 : stroke}
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={-a.off}
          style={{
            cursor: "pointer",
            opacity: hov !== null && hov !== i ? 0.4 : 1,
          }}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
        />
      ))}
    </svg>
  );
}

interface RadialProgressProps {
  pct: number;
  color: string;
  size?: number;
}
function RadialProgress({ pct, color, size = 64 }: RadialProgressProps) {
  const stroke = 6,
    r = (size - stroke) / 2,
    circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
interface CounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
}
function Counter({ target, prefix = "", suffix = "" }: CounterProps) {
  const [val, setVal] = useState<number>(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return (
    <>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { t } = useTranslation();
  const [activeNav, setActiveNav] = useState<string>("analytics");
  const { isDarkMode: dark, toggleTheme } = useTheme();
  const [salesYear, setSalesYear] = useState<number>(2022);
  const [actYear, setActYear] = useState<number>(2021);
  const salesData = salesYear === 2021 ? SALES_2021 : SALES_2022;
  const actData1 = actYear === 2021 ? ACTIVITY_2021 : ACTIVITY_2022;
  const actData2 = actYear === 2021 ? ACTIVITY_2022 : ACTIVITY_2021;

  return (
    <div className={styles.layout} dir={document.dir}>
      {/* ── Sidebar ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandX}>✕</div>
          <div className={styles.brandName}>{t("Business")}</div>
        </div>
        <div className={styles.sidebarNav}>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`${styles.navItem} ${activeNav === n.id ? styles.active : ""}`}
              onClick={() => setActiveNav(n.id)}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {t(n.label)}
            </button>
          ))}
        </div>
        <div className={styles.navDivider}></div>
        <div className={styles.sidebarBottom}>
          <button
            className={styles.navItem}
            onClick={() => setActiveNav("settings")}
          >
            <span className={styles.navIcon}><Settings size={18} /></span> {t("Settings")}
          </button>
          <button className={styles.navItem}>
            <span className={styles.navIcon}><LogOut size={18} /></span> {t("Sign Out")}
          </button>
        </div>

      </div>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.pageTitle}>{t("Analytics")}</div>
            <div className={styles.dateRange}>
              <Calendar size={14} style={{ marginRight: 4 }} />
              01.08.2022 – 31.08.2022
            </div>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.iconBtn}><Bell size={16} /></div>
            <div
              className={styles.iconBtn}
              onClick={toggleTheme}
              title={dark ? t("Light mode") : t("Dark mode")}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </div>
            <div className={styles.userPill}>
              <div className={styles.userAvatar}>KK</div>
              Kristi Kamlykova
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className={styles.contentScroll}>
          {/* KPI Row 1 */}
          <div className={styles.kpiGrid}>
            {[
              { label: "Active Jobs", value: 201, change: +6.2, icon: <Package size={20} color="#6366f1" />, iconBg: "#ede9fe" },
              { label: "Hired Applicants", value: 36, change: +3.4, icon: <CheckCircle size={20} color="#16a34a" />, iconBg: "#dcfce7" },
              { label: "Total Users", value: 4890, change: -1.1, icon: <Users size={20} color="#b45309" />, iconBg: "#fef9c3", large: true },
              { label: "Pro Companies", value: 1201, change: +0.8, icon: <CreditCard size={20} color="#1d4ed8" />, iconBg: "#dbeafe", large: true, donut: SUB_SEGMENTS },
            ].map((k, i) => (
              <div key={i} className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ background: k.iconBg }}>
                  {k.icon}
                </div>
                <div className={styles.kpiLabel}>{t(k.label)}</div>
                {k.donut ? (
                  <div className={styles.donutWrap}>
                    <DonutChart segments={k.donut} size={72} />
                    <div className={styles.donutLegend}>
                      {k.donut.map((s) => (
                        <div key={s.label} className={styles.donutLegItem}>
                          <div className={styles.donutLegDot} style={{ background: s.color }}></div>
                          <span style={{ color: "var(--muted)", fontWeight: 400 }}>{t(s.label)}:</span>
                          <span className={styles.donutLegPct}>{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : k.label === "Users" ? (
                  <div className={styles.donutWrap}>
                    <DonutChart segments={USER_SEGMENTS} size={72} />
                    <div className={styles.donutLegend}>
                      {USER_SEGMENTS.map((s) => (
                        <div key={s.label} className={styles.donutLegItem}>
                          <div className={styles.donutLegDot} style={{ background: s.color }}></div>
                          <span style={{ color: "var(--muted)", fontWeight: 400 }}>{t(s.label)}:</span>
                          <span className={styles.donutLegPct}>{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.kpiValue}>
                    <Counter target={k.value} />
                  </div>
                )}
                <div className={`${styles.kpiChange} ${k.change >= 0 ? styles.up : styles.down}`}>
                  {k.change >= 0 ? <TrendingUp size={14} style={{ marginRight: 2 }} /> : <TrendingDown size={14} style={{ marginRight: 2 }} />} {Math.abs(k.change)}%
                  <span className={styles.kpiSince}>{t("since last month")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* KPI Row 2 */}
          <div className={styles.kpiGrid2}>
            {[
              { label: "New Resumes", value: 541, change: -0.2, icon: <DollarSign size={20} color="#b45309" />, iconBg: "#fef9c3" },
              { label: "Monthly Subscriptions", value: 1352, change: +1.2, icon: <CreditCard size={20} color="#6366f1" />, iconBg: "#ede9fe" },
            ].map((k, i) => (
              <div key={i} className={styles.kpiCard} style={{ gridColumn: i + 1 }}>
                <div className={styles.kpiIcon} style={{ background: k.iconBg }}>
                  {k.icon}
                </div>
                <div className={styles.kpiLabel}>{t(k.label)}</div>
                <div className={styles.kpiValue}>
                  {k.label === "Monthly Subscriptions" && "$"}
                  <Counter target={k.value} />
                </div>
                <div className={`${styles.kpiChange} ${k.change >= 0 ? styles.up : styles.down}`}>
                  {k.change >= 0 ? <TrendingUp size={14} style={{ marginRight: 2 }} /> : <TrendingDown size={14} style={{ marginRight: 2 }} />} {Math.abs(k.change)}%
                  <span className={styles.kpiSince}>{t("since last month")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <BarChart
                data={salesData}
                year={salesYear}
                onYearToggle={() => setSalesYear((y) => (y === 2021 ? 2022 : 2021))}
              />
            </div>
            <div className={styles.chartCard}>
              <LineChart
                data1={actData1}
                data2={actData2}
                year={actYear}
                onYearToggle={() => setActYear((y) => (y === 2021 ? 2022 : 2021))}
              />
            </div>
          </div>

          {/* Bottom row */}
          <div className={styles.bottomRow}>
            {/* Finance cards */}
            <div className={styles.financeCol}>
              {[
                { label: "Premium Job Postings", value: "30,256", badge: "+15%", up: true, icon: <DollarSign size={22} color="#6366f1" />, iconBg: "#ede9fe", sub: "Current Financial Year", pct: 65, color: "#6366f1" },
                { label: "Subscription Revenue", value: "150,256", badge: "+58%", up: true, icon: <Landmark size={22} color="#16a34a" />, iconBg: "#dcfce7", sub: "Current Financial Year", pct: 82, color: "#10b981" },
              ].map((f, i) => (
                <div key={i} className={styles.financeCard}>
                  <div className={styles.financeTop}>
                    <div className={styles.financeIcon} style={{ background: f.iconBg }}>
                      {f.icon}
                    </div>
                    <div className={`${styles.financeBadge} ${f.up ? styles.up : styles.down}`}>
                      {f.badge}
                    </div>
                  </div>
                  <div className={styles.radialWrap} style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "8px 0" }}>
                    <RadialProgress pct={f.pct} color={f.color} size={64} />
                    <div style={{ position: "absolute", fontSize: 11, fontWeight: 700, color: f.color }}>
                      {f.pct}%
                    </div>
                  </div>
                  <div className={styles.financeLabel}>{t(f.label)}</div>
                  <div className={styles.financeValue}>${f.value}</div>
                  <div className={styles.financeSub}>{t(f.sub)}</div>
                </div>
              ))}
            </div>

            {/* Orders table */}
            <div className={styles.ordersCard}>
              <div className={styles.ordersHeader}>
                <div className={styles.ordersTitle}>{t("Company Approvals")}</div>
                <div className={styles.refreshBtn}><RefreshCcw size={14} /></div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>{t("Company")}</th>
                    <th>{t("Location")}</th>
                    <th>{t("Applied Date")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPANIES.map((c, i) => {
                    const sc = STATUS_CONFIG[c.status];
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className={styles.tAvatar} style={{ background: `linear-gradient(135deg,${c.color[0]},${c.color[1]})` }}>
                              {c.avatar}
                            </div>
                            <div className={styles.tName}>{t(c.name)}</div>
                          </div>
                        </td>
                        <td className={styles.tAddress}>{t(c.location)}</td>
                        <td className={styles.tDate}>{c.date}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            <button className={`${styles.actionBtn} ${styles.approve}`} title={t("Approve")}><Check size={14} /></button>
                            <button className={`${styles.actionBtn} ${styles.reject}`} title={t("Reject")}><X size={14} /></button>
                            <button className={`${styles.actionBtn} ${styles.view}`} title={t("View Data")}><Eye size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
