// src/pages/admin/AdminStats.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Zap,
  Trophy, Clock, Target, BarChart2, Activity,
  Calendar, Award, RefreshCw, Download, Brain,
  CheckCircle,
} from "lucide-react";
import { auth } from "../../firebase.js";
import { getDashboardStats } from "../../services/api.js";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";

const CSS = `
  @keyframes s-cardIn  { from{opacity:0;transform:translateY(12px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes s-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes s-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes s-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes st-skel-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

  .s-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}66 50%,${C.card} 75%); background-size:400px 100%; animation:s-shimmer 1.5s infinite linear; border-radius:6px; }
  .st-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}55 50%,${C.card} 75%); background-size:400px 100%; animation:st-skel-shimmer 1.5s infinite linear; }
  .s-kpi  { transition:transform .2s,box-shadow .2s; cursor:default; }
  .s-kpi:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(0,0,0,.5) !important; }
  .s-pill { transition:all .18s; cursor:pointer; }
  .s-pill:hover { filter:brightness(1.1); }
  .s-bar-row { transition:background .14s; }
  .s-bar-row:hover { background:${C.navyL}12 !important; }
  .s-user-row { transition:background .14s; }
  .s-user-row:hover { background:${C.navyL}12 !important; }
  .recharts-tooltip-wrapper { font-family:'Rajdhani',sans-serif !important; }

  @media (max-width:900px) {
    .s-kpi-grid  { grid-template-columns:1fr 1fr !important; }
    .s-qs-grid   { grid-template-columns:1fr 1fr !important; }
    .s-two-col   { grid-template-columns:1fr !important; }
    .s-hm-col    { grid-template-columns:1fr !important; }
  }
  @media (max-width:560px) {
    .s-kpi-grid  { grid-template-columns:1fr !important; }
    .s-qs-grid   { grid-template-columns:1fr !important; }
  }
`;

// ── Item 24: client-side stats cache (3-min TTL, survives tab switches) ──
const _statsCache = new Map(); // key: periodo → { ts, data }
const STATS_TTL   = 3 * 60 * 1000;

// ── Períodos ───────────────────────────────────────────────────
const PERIODOS = [
  { id:"7d",  label:"7 días"  },
  { id:"30d", label:"30 días" },
  { id:"90d", label:"3 meses" },
  { id:"1y",  label:"1 año"   },
];

// ── Mock data (module-level, stable) ───────────────────────────
function genWeekData(n=7) {
  const dias = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  return Array.from({length:n}, (_, i) => ({
    dia:      n <= 7 ? dias[i % 7] : `S${i+1}`,
    usuarios: Math.floor(8  + Math.random() * 35),
    sesiones: Math.floor(20 + Math.random() * 80),
    xp:       Math.floor(3000 + Math.random() * 12000),
    nuevos:   Math.floor(1  + Math.random() * 12),
  }));
}
function genMonthData(n=30) {
  return Array.from({length:n}, (_, i) => ({
    dia:      `${i+1}`,
    usuarios: Math.floor(10 + Math.random() * 40),
    sesiones: Math.floor(25 + Math.random() * 100),
    xp:       Math.floor(4000 + Math.random() * 15000),
    nuevos:   Math.floor(1  + Math.random() * 15),
  }));
}

const DATA_BY_PERIOD = {
  "7d":  genWeekData(7),
  "30d": genMonthData(30),
  "90d": genWeekData(13),
  "1y":  genWeekData(12),
};

const DATA_EJERCICIOS = [
  { name:"Flexiones",    sesiones:1480, xp:44400, completadas:1248 },
  { name:"Sentadillas",  sesiones:1320, xp:46200, completadas:1100 },
  { name:"Cardio Libre", sesiones:1180, xp:70800, completadas:980  },
  { name:"Plancha",      sesiones:890,  xp:35600, completadas:740  },
  { name:"HIIT",         sesiones:670,  xp:60300, completadas:560  },
  { name:"Yoga",         sesiones:540,  xp:24300, completadas:450  },
  { name:"Dominadas",    sesiones:380,  xp:20900, completadas:310  },
  { name:"Pilates",      sesiones:290,  xp:10150, completadas:240  },
];

const DATA_CLASES = [
  { name:"GUERRERO", value:48, color:C.orange, usuarios:79 },
  { name:"ARQUERO",  value:31, color:C.blue,   usuarios:50 },
  { name:"MAGO",     value:21, color:C.purple, usuarios:34 },
];

const DATA_NIVEL_DIST = [
  { rango:"1–5",   usuarios:38 },
  { rango:"6–10",  usuarios:52 },
  { rango:"11–20", usuarios:34 },
  { rango:"21–30", usuarios:18 },
  { rango:"31–40", usuarios:11 },
  { rango:"41–50", usuarios:7  },
  { rango:"50+",   usuarios:3  },
];

const DATA_RADAR = [
  { attr:"Fuerza",       valor:78 },
  { attr:"Cardio",       valor:62 },
  { attr:"Flexibilidad", valor:45 },
  { attr:"Racha prom.",  valor:55 },
  { attr:"Misiones",     valor:70 },
  { attr:"Logros",       valor:38 },
];

const DATA_RETENCION = [
  { semana:"S1",  retencion:100 },
  { semana:"S2",  retencion:72  },
  { semana:"S3",  retencion:58  },
  { semana:"S4",  retencion:49  },
  { semana:"S6",  retencion:38  },
  { semana:"S8",  retencion:31  },
  { semana:"S12", retencion:24  },
];

const TOP_USERS = [
  { pos:1, nombre:"GandalfZen",    clase:"MAGO",     nivel:21, xp:5600, streak:30, sesiones:142 },
  { pos:2, nombre:"ArwenSpeed",    clase:"ARQUERO",  nivel:15, xp:3800, streak:22, sesiones:98  },
  { pos:3, nombre:"GimliAxe",      clase:"GUERRERO", nivel:18, xp:4500, streak:19, sesiones:134 },
  { pos:4, nombre:"BoromirStrong", clase:"GUERRERO", nivel:9,  xp:2100, streak:11, sesiones:67  },
  { pos:5, nombre:"Aragorn_Dev",   clase:"GUERRERO", nivel:12, xp:2840, streak:14, sesiones:89  },
  { pos:6, nombre:"EowynBrave",    clase:"ARQUERO",  nivel:11, xp:2650, streak:8,  sesiones:72  },
  { pos:7, nombre:"FrodoBags",     clase:"MAGO",     nivel:6,  xp:1100, streak:4,  sesiones:31  },
  { pos:8, nombre:"LegolasRunner", clase:"ARQUERO",  nivel:8,  xp:1920, streak:7,  sesiones:58  },
];

// Stable mock heatmap — defined at module level, not regenerated on each render
const HEATMAP_MOCK = (() =>
  Array.from({length:10}, () =>
    Array.from({length:7}, () => Math.random() < 0.25 ? 0 : Math.floor(Math.random() * 50))
  )
)();

// Stable mock hourly activity (realistic distribution)
const HOURLY_MOCK = (() => {
  const peaks = [0,0,0,0,1,2,8,18,32,42,45,40,38,44,36,30,28,35,42,40,32,20,10,3];
  return peaks.map((base, h) => ({
    hora:     `${h.toString().padStart(2, "0")}h`,
    sesiones: Math.max(0, Math.round(base + (Math.sin(h * 0.7) * 3))),
  }));
})();

// ── Custom tooltip ─────────────────────────────────────────────
function FvTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.navyL}`, padding:"10px 14px",
      borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,.6)",
      backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)" }}>
      <div style={{ ...raj(12, 700), color:C.white, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, ...raj(12, 600), color:p.color, marginBottom:2 }}>
          <div style={{ width:8, height:8, background:p.color, borderRadius:2, flexShrink:0 }}/>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

// ── Inline progress bar ────────────────────────────────────────
function InlineBar({ val, max, color, height=6 }) {
  const pct = Math.min((val / Math.max(max, 1)) * 100, 100);
  return (
    <div style={{ flex:1, height, background:C.panel, border:`1px solid ${color}22`,
      borderRadius:4, overflow:"hidden", minWidth:40 }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color,
        borderRadius:4, boxShadow:`0 0 4px ${color}44`, transition:"width .6s ease" }}/>
    </div>
  );
}

// ── Split bar (2 segments) ─────────────────────────────────────
function SplitBar({ leftVal, rightVal, leftColor, rightColor, height=6 }) {
  const total = Math.max(leftVal + rightVal, 1);
  const lPct  = (leftVal / total) * 100;
  return (
    <div style={{ width:"100%", height, background:C.navy, borderRadius:4, overflow:"hidden", display:"flex" }}>
      <div style={{ height:"100%", width:`${lPct}%`, background:leftColor, borderRadius:"4px 0 0 4px", transition:"width .6s ease" }}/>
      <div style={{ height:"100%", flex:1, background:rightColor, borderRadius:"0 4px 4px 0" }}/>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────
function KpiCard({ icon:Icon, label, value, sub, color, trend, delay=0, insight, splitBar }) {
  const up = trend >= 0;
  return (
    <div className="s-kpi" style={{ background:C.card, border:`1px solid ${color}33`,
      borderRadius:14, padding:"22px 20px", position:"relative", overflow:"hidden",
      boxShadow:`0 4px 24px rgba(0,0,0,.4), 0 0 0 1px ${color}11`,
      animation:`s-cardIn .5s ease ${delay}s both`, height:"100%" }}>
      {/* Top accent line */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${color},transparent)` }}/>
      {/* Glow blob */}
      <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120,
        borderRadius:"50%", background:color, filter:"blur(50px)", opacity:.06, pointerEvents:"none" }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ background:`${color}18`, border:`1px solid ${color}33`,
          borderRadius:6, padding:10, display:"flex" }}>
          <Icon size={20} color={color}/>
        </div>
        {trend !== undefined && (
          <div style={{ display:"flex", alignItems:"center", gap:4, ...raj(12, 700),
            color:up ? C.green : C.red, background: up ? `${C.green}10` : `${C.red}10`,
            border:`1px solid ${up ? C.green : C.red}33`, padding:"3px 8px", borderRadius:20 }}>
            {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ ...orb("clamp(20px,2.2vw,28px)", 900), color, marginBottom:4 }}>{value}</div>
      <div style={{ ...raj(13, 700), color:C.white, marginBottom:3, letterSpacing:".03em" }}>{label}</div>
      <div style={{ ...raj(11, 500), color:C.muted, marginBottom: insight || splitBar ? 10 : 0 }}>{sub}</div>
      {insight && (
        <div style={{ ...raj(11, 600), color: insight.startsWith("↑") ? C.green : insight.startsWith("↓") ? C.red : C.muted,
          background: insight.startsWith("↑") ? `${C.green}10` : insight.startsWith("↓") ? `${C.red}10` : `${C.muted}0a`,
          border:`1px solid ${insight.startsWith("↑") ? C.green : insight.startsWith("↓") ? C.red : C.navy}33`,
          borderRadius:4, padding:"3px 8px", display:"inline-block", marginBottom: splitBar ? 8 : 0 }}>
          {insight}
        </div>
      )}
      {splitBar && (
        <div style={{ marginTop:4 }}>
          <SplitBar leftVal={splitBar.left} rightVal={splitBar.right}
            leftColor={splitBar.leftColor} rightColor={splitBar.rightColor} height={5}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ ...raj(10, 500), color:splitBar.leftColor }}>● {splitBar.leftLabel}</span>
            <span style={{ ...raj(10, 500), color:splitBar.rightColor }}>● {splitBar.rightLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick stat card ────────────────────────────────────────────
function QuickStat({ icon, label, value, color, tall = false }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${color}22`, borderRadius:14,
      padding:"18px 20px", display:"flex", flexDirection: tall ? "column" : "row",
      alignItems: tall ? "flex-start" : "center", gap: tall ? 12 : 14,
      height: tall ? "100%" : "auto", animation:"s-cardIn .4s ease both" }}>
      <div style={{ background:`${color}18`, border:`1px solid ${color}33`,
        borderRadius:6, padding:10, display:"flex", flexShrink:0 }}>
        {typeof icon === "string"
          ? <span style={{ fontSize:18, filter:`drop-shadow(0 0 6px ${color}66)` }}>{icon}</span>
          : <icon.type {...icon.props} size={20} color={color}/>
        }
      </div>
      <div>
        <div style={{ ...orb(tall ? 24 : 18, 900), color, marginBottom:4 }}>{value}</div>
        <div style={{ ...raj(12, 500), color:C.muted }}>{label}</div>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ icon:Icon, title, color=C.orange, extra }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
      <div style={{ background:`${color}18`, border:`1px solid ${color}33`,
        borderRadius:6, padding:6, display:"flex" }}>
        <Icon size={14} color={color}/>
      </div>
      <span style={{ ...orb(11, 700), color:C.white, letterSpacing:".04em" }}>{title}</span>
      {extra && <div style={{ marginLeft:"auto" }}>{extra}</div>}
    </div>
  );
}

// ── Medal ──────────────────────────────────────────────────────
function PosMedal({ pos }) {
  const map = { 1:{c:C.gold,s:"🥇"}, 2:{c:C.mutedL,s:"🥈"}, 3:{c:"#CD7F32",s:"🥉"} };
  const m = map[pos];
  if (m) return <span style={{ fontSize:17, filter:`drop-shadow(0 0 5px ${m.c})` }}>{m.s}</span>;
  return <span style={{ ...raj(13, 700), color:C.muted, minWidth:22, textAlign:"center" }}>#{pos}</span>;
}

// ── Heatmap ────────────────────────────────────────────────────
function ActivityHeatmap({ statsData }) {
  const DIAS = ["L","M","X","J","V","S","D"];
  const raw  = statsData?.heatmap;
  const data = Array.isArray(raw) && raw.length > 0 ? raw : HEATMAP_MOCK;
  const flat = data.flat().filter(v => typeof v === "number");
  const maxV = flat.length > 0 ? Math.max(...flat) : 1;

  // Build dates for the last 10 weeks
  const today     = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  // start of the oldest week shown (10 weeks ago)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (10 * 7) - ((dayOfWeek + 6) % 7));

  return (
    <div>
      <div style={{ display:"flex", gap:3, marginBottom:6 }}>
        {DIAS.map(d => (
          <div key={d} style={{ width:16, ...raj(9, 600), color:C.muted, textAlign:"center" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {data.map((week, wi) => (
          <div key={wi} style={{ display:"flex", gap:3 }}>
            {(Array.isArray(week) ? week : []).map((val, di) => {
              const v   = Number(val) || 0;
              const pct = v / maxV;
              const alpha = v === 0 ? 0.04 : 0.12 + pct * 0.88;
              const cellDate = new Date(startDate);
              cellDate.setDate(startDate.getDate() + wi * 7 + di);
              const dateStr = cellDate.toLocaleDateString("es-EC", { day:"2-digit", month:"short" });
              return (
                <div key={di} title={`${dateStr}: ${v} sesiones`}
                  style={{ width:16, height:16, borderRadius:3,
                    background: v === 0 ? `${C.navy}44` : C.orange,
                    opacity:alpha, border: v > 30 ? `1px solid ${C.orange}88` : "none",
                    transition:"opacity .2s", cursor:"default" }}/>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10 }}>
        <span style={{ ...raj(10, 500), color:C.muted }}>Menos</span>
        {[0.05, 0.25, 0.5, 0.75, 1].map((o, i) => (
          <div key={i} style={{ width:12, height:12, background:C.orange, opacity:o, borderRadius:2 }}/>
        ))}
        <span style={{ ...raj(10, 500), color:C.muted }}>Más</span>
      </div>
    </div>
  );
}

// ── Empty placeholder ──────────────────────────────────────────
function EmptyChart({ text="Sin datos disponibles", height=180 }) {
  return (
    <div style={{ height, display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:10 }}>
      <div style={{ fontSize:28, opacity:.25 }}>📊</div>
      <div style={{ ...raj(13, 600), color:C.muted }}>{text}</div>
    </div>
  );
}

// ── Skeleton loading state ─────────────────────────────────────
function SkeletonStats() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="st-skel" style={{borderRadius:14,height:100,animationDelay:`${i*.08}s`}}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
        <div className="st-skel" style={{borderRadius:14,height:260}}/>
        <div className="st-skel" style={{borderRadius:14,height:260,animationDelay:".1s"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {Array.from({length:3}).map((_,i)=>(
          <div key={i} className="st-skel" style={{borderRadius:14,height:160,animationDelay:`${i*.09}s`}}/>
        ))}
      </div>
    </div>
  );
}

const CLS_COLOR = { GUERRERO:C.orange, ARQUERO:C.blue, MAGO:C.purple };
const CLS_ICON  = { GUERRERO:"⚔️", ARQUERO:"🏃", MAGO:"🧘" };

const METRICA_CONFIG = {
  sesiones: { label:"Sesiones",       color:C.orange, key:"sesiones" },
  xp:       { label:"XP Ganado",      color:C.gold,   key:"xp"       },
  usuarios: { label:"Usuarios Activos",color:C.blue,  key:"usuarios" },
  nuevos:   { label:"Nuevos Registros",color:C.green, key:"nuevos"   },
};

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminStats() {
  const [periodo,     setPeriodo]     = useState("30d");
  const [refreshing,  setRefreshing]  = useState(false);
  const [metricaGraf, setMetricaGraf] = useState("sesiones");
  const [statsData,   setStatsData]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [isMobile,    setIsMobile]    = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [exporting,   setExporting]   = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadStats = useCallback(async (period, silent=false) => {
    const p = period ?? periodo;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const u = auth.currentUser;
      if (!u) return;

      // Item 24: serve from cache if still fresh
      const hit = _statsCache.get(p);
      if (hit && Date.now() - hit.ts < STATS_TTL) {
        setStatsData(hit.data);
        return;
      }

      const token = await u.getIdToken();
      const response = await getDashboardStats(token, p);
      const data = response?.stats ?? null;
      if (data) _statsCache.set(p, { ts: Date.now(), data });
      setStatsData(data);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    let unsub = null;
    const startRefresh = (p) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => loadStats(p, true), 60_000);
    };
    const init = async () => {
      if (auth.currentUser) { await loadStats(periodo); startRefresh(periodo); return; }
      unsub = onAuthStateChanged(auth, async (u) => {
        if (u) { await loadStats(periodo); startRefresh(periodo); if (unsub) unsub(); }
      });
    };
    init();
    return () => { if (unsub) unsub(); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [periodo]);

  const refresh = async () => {
    setRefreshing(true);
    _statsCache.delete(periodo); // bust cache so manual refresh always hits the server
    await loadStats(periodo);
    setRefreshing(false);
  };

  // ── Derived data ───────────────────────────────────────────────
  const normalizeEvo = (raw) => {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map(d => ({
      dia:      d.dia      ?? "—",
      usuarios: Number(d.usuarios) || 0,
      sesiones: Number(d.sesiones) || 0,
      xp:       Number(d.xp)       || 0,
      nuevos:   Number(d.nuevos)   || 0,
    }));
  };
  const data = normalizeEvo(statsData?.evolutionData) ?? DATA_BY_PERIOD[periodo] ?? DATA_BY_PERIOD["30d"];

  const topExercises = useMemo(() => {
    const raw = statsData?.topExercises;
    if (Array.isArray(raw) && raw.length > 0)
      return raw.map(e => ({ name:e.name??"?", sesiones:Number(e.sesiones)||0, xp:Number(e.xp)||0, completadas:Number(e.completadas)||0 }));
    return DATA_EJERCICIOS;
  }, [statsData]);
  const maxSes = topExercises.length > 0 ? Math.max(...topExercises.map(e => e.sesiones)) : 1;

  // Hourly activity
  const hourlyData = useMemo(() => {
    const raw = statsData?.hourlyActivity;
    if (Array.isArray(raw) && raw.length >= 24) return raw;
    return HOURLY_MOCK;
  }, [statsData]);

  // Completion rate
  const completionRate = useMemo(() => {
    const total  = statsData?.exerciseCount || 0;
    const done   = statsData?.completedExercises || 0;
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  }, [statsData]);

  // KPI insight strings
  const insights = useMemo(() => {
    const aktiv  = statsData?.activeUsers    || 0;
    const total  = statsData?.totalUsers     || 0;
    const ses    = statsData?.exerciseCount  || 0;
    const avgStr = statsData?.avgStreak      || 0;
    const pctAct = total > 0 ? Math.round((aktiv / total) * 100) : 0;
    return {
      usuarios: pctAct > 0 ? `${pctAct}% del total activos` : null,
      sesiones: ses > 0 ? `${Math.round(ses / Math.max(aktiv, 1))} por usuario` : null,
      xp:       statsData?.totalXP ? `Prom. ${Math.round((statsData.totalXP || 0) / Math.max(aktiv, 1)).toLocaleString()} por héroe` : null,
      nuevos:   null,
    };
  }, [statsData]);

  // Export
  const exportData = useCallback(async () => {
    setExporting(true);
    try {
      const payload = {
        periodo, generadoEn: new Date().toISOString(),
        kpis: {
          usuariosActivos:     statsData?.activeUsers        ?? 0,
          totalUsuarios:       statsData?.totalUsers         ?? 0,
          sesionesTotales:     statsData?.exerciseCount      ?? 0,
          xpTotal:             statsData?.totalXP            ?? 0,
          logrosDesbloqueados: statsData?.totalAchievements  ?? 0,
          misionesCompletadas: statsData?.completedMissions  ?? 0,
          rachaPromedio:       statsData?.avgStreak          ?? 0,
          tiempoPromedioMin:   statsData?.avgSessionTime     ?? 28,
          completionRate,
        },
        evolucionTemporal:   data,
        topEjercicios:       topExercises,
        distribucionClases:  statsData?.classDistribution || DATA_CLASES,
        distribucionNiveles: statsData?.levelDistribution  || DATA_NIVEL_DIST,
        curvaRetencion:      statsData?.retentionData       || DATA_RETENCION,
        perfilPromedio:      statsData?.avgProfile           || DATA_RADAR,
        topUsuarios:         statsData?.topUsers             || TOP_USERS,
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type:"application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `forgeventure-stats-${periodo}-${new Date().toISOString().split("T")[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }, [periodo, statsData, data, topExercises, completionRate]);

  // ── Loading / error states ─────────────────────────────────────
  if (loading) return <><style>{CSS}</style><SkeletonStats/></>;

  if (error) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"400px" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ ...orb(14, 700), color:C.red, marginBottom:10 }}>Error al cargar estadísticas</div>
          <div style={{ ...raj(13, 500), color:C.muted, marginBottom:20 }}>{error}</div>
          <button onClick={loadStats} style={{ ...raj(13, 600), color:C.white, background:C.navy,
            border:`1px solid ${C.navyL}`, borderRadius:8, padding:"10px 20px", cursor:"pointer" }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const mc = METRICA_CONFIG[metricaGraf];

  // Nuevos vs retenidos split data
  const totalNew      = statsData?.newUsers     || Math.round((data.reduce((s,d)=>s+(d.nuevos||0),0)) * 0.35);
  const totalReturn   = statsData?.returningUsers || Math.round((data.reduce((s,d)=>s+(d.usuarios||0),0)) * 0.65);

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:`${C.orange}18`, border:`1px solid ${C.orange}33`, borderRadius:8, padding:8, display:"flex" }}>
              <BarChart2 size={18} color={C.orange}/>
            </div>
            <div>
              <div style={{ ...orb(13, 700), color:C.white, letterSpacing:".04em" }}>ESTADÍSTICAS GLOBALES</div>
              <div style={{ ...raj(11, 400), color:C.muted }}>Centro de control · ForgeVenture</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, background:`${C.green}14`,
              border:`1px solid ${C.green}33`, borderRadius:20, padding:"4px 10px" }}>
              <div style={{ width:6, height:6, background:C.green, borderRadius:"50%", animation:"s-pulse 1.2s infinite" }}/>
              <span style={{ ...raj(11, 700), color:C.green, letterSpacing:".08em" }}>EN VIVO</span>
            </div>
          </div>

          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {/* Period pills */}
            <div style={{ display:"flex", gap:4, borderRadius:12, padding:"10px 12px", background:C.panel }}>
              {PERIODOS.map(p => {
                const on = periodo === p.id;
                return (
                  <button key={p.id} onClick={() => setPeriodo(p.id)} className="s-pill"
                    style={{ ...raj(12, on ? 700 : 500), color: on ? C.orange : C.muted,
                      background: on ? `${C.orange}18` : "transparent",
                      border:`1px solid ${on ? C.orange : C.navy}`,
                      borderRadius:20, padding:"6px 14px", cursor:"pointer",
                      boxShadow: on ? `0 0 10px ${C.orange}33` : "none" }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button onClick={refresh} disabled={refreshing}
              style={{ ...raj(12, 600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`,
                borderRadius:8, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center",
                gap:5, opacity: refreshing ? .6 : 1 }}>
              <RefreshCw size={13} style={{ animation: refreshing ? "s-spin .8s linear infinite" : "none" }}/>
              Actualizar
            </button>
            <button onClick={exportData} disabled={exporting}
              style={{ ...raj(12, 600), color:C.blue, background:`${C.blue}10`, border:`1px solid ${C.blue}44`,
                borderRadius:8, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center",
                gap:5, opacity: exporting ? .5 : 1 }}>
              <Download size={13} style={{ animation: exporting ? "s-spin .8s linear infinite" : "none" }}/>
              Exportar
            </button>
          </div>
        </div>

        {/* ── Bento KPI Grid (4-col, first two span 2) ── */}
        <div className="s-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {/* Row 1: two wide cards */}
          <div style={{ gridColumn:"span 2" }}>
            <KpiCard icon={Users} label="Usuarios Activos"
              value={statsData?.activeUsers?.toLocaleString() || "0"}
              sub={`Total registrados: ${statsData?.totalUsers?.toLocaleString() || "0"}`}
              color={C.blue} trend={statsData?.trends?.activeUsers}
              insight={insights.usuarios} delay={0}/>
          </div>
          <div style={{ gridColumn:"span 2" }}>
            <KpiCard icon={Activity} label="Sesiones Totales"
              value={statsData?.exerciseCount?.toLocaleString() || "0"}
              sub="Ejercicios completados en el período"
              color={C.orange} trend={statsData?.trends?.sessions}
              insight={insights.sesiones} delay={.06}/>
          </div>

          {/* Row 2: four normal cards */}
          <KpiCard icon={Zap} label="XP Total Generado"
            value={`${((statsData?.totalXP || 0) / 1000).toFixed(1)}K`}
            sub="Suma de todos los héroes"
            color={C.gold} trend={statsData?.trends?.xp}
            insight={insights.xp} delay={.12}/>
          <KpiCard icon={Users} label="Nuevos Registros"
            value={totalNew.toLocaleString()}
            sub="Usuarios nuevos en el período"
            color={C.green} trend={statsData?.trends?.newUsers}
            splitBar={{ left:totalReturn, right:totalNew, leftColor:C.green, rightColor:C.teal,
              leftLabel:`${totalReturn} retenidos`, rightLabel:`${totalNew} nuevos` }}
            delay={.18}/>
          <KpiCard icon={CheckCircle} label="Tasa de Completitud"
            value={`${completionRate}%`}
            sub="Ejercicios terminados / iniciados"
            color={C.teal} trend={statsData?.trends?.completion}
            insight={completionRate >= 70 ? "↑ Buen engagement" : completionRate > 0 ? "→ Margen de mejora" : null}
            delay={.24}/>
          <KpiCard icon={Brain} label="Zona Mente"
            value={`${statsData?.menteSessionsAvg || 0} min`}
            sub={`${statsData?.menteSessions?.toLocaleString() || "0"} sesiones completadas`}
            color={C.purple} trend={statsData?.trends?.mente}
            delay={.30}/>
        </div>

        {/* ── Quick stats Bento (first spans 2 rows) ── */}
        <div className="s-qs-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gridTemplateRows:"auto auto", gap:12 }}>
          {/* Logros — double height */}
          <div style={{ gridRow:"span 2" }}>
            <QuickStat icon="🏆" label="Logros desbloqueados"
              value={statsData?.totalAchievements?.toLocaleString() || "0"} color={C.gold} tall/>
          </div>
          <QuickStat icon="🎯" label="Misiones completadas"
            value={statsData?.completedMissions?.toLocaleString() || "0"} color={C.teal}/>
          <QuickStat icon="🔥" label="Racha promedio"
            value={`${statsData?.avgStreak || 0} días`} color={C.red}/>
          <QuickStat icon={{ type:Clock, props:{} }} label="Tiempo activo prom."
            value={`${statsData?.avgSessionTime || 28} min`} color={C.blue}/>
          {/* Second row (cols 2-4) */}
          <QuickStat icon={{ type:Brain, props:{} }} label="Sesiones de Mente"
            value={statsData?.menteSessions?.toLocaleString() || "0"} color={C.purple}/>
          <QuickStat icon={{ type:Target, props:{} }} label="Tasa de completitud"
            value={`${completionRate}%`} color={C.teal}/>
          <QuickStat icon={{ type:Activity, props:{} }} label="Pico horario"
            value={(() => {
              const peak = hourlyData.reduce((a, b) => (b.sesiones > a.sesiones ? b : a), hourlyData[0]);
              return peak?.hora || "—";
            })()} color={C.orange}/>
        </div>

        {/* ── Gráfica principal — evolución temporal ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
          padding:"22px", animation:"s-cardIn .5s ease .2s both" }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
          <SectionHeader icon={TrendingUp} title="EVOLUCIÓN TEMPORAL" color={mc.color}
            extra={
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", borderRadius:12, padding:"10px 12px", background:C.panel }}>
                {Object.entries(METRICA_CONFIG).map(([k, v]) => {
                  const on = metricaGraf === k;
                  return (
                    <button key={k} onClick={() => setMetricaGraf(k)} className="s-pill"
                      style={{ ...raj(11, on ? 700 : 500), color: on ? v.color : C.muted,
                        background: on ? `${v.color}18` : "transparent",
                        border:`1px solid ${on ? v.color : C.navy}`,
                        borderRadius:20, padding:"4px 12px", cursor:"pointer",
                        boxShadow: on ? `0 0 10px ${v.color}33` : "none" }}>
                      {v.label}
                    </button>
                  );
                })}
              </div>
            }/>
          {data.length === 0 ? <EmptyChart text="Sin datos de evolución" height={240}/> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data} margin={{ top:4, right:4, left:-10, bottom:0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={mc.color} stopOpacity={.35}/>
                    <stop offset="95%" stopColor={mc.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
                <XAxis dataKey="dia" tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<FvTooltip/>} trigger={isMobile ? "click" : "hover"}/>
                <Area type="monotone" dataKey={mc.key} name={mc.label} stroke={mc.color} strokeWidth={2.5}
                  fill="url(#areaGrad)" dot={{ fill:mc.color, r:4, strokeWidth:0 }}
                  activeDot={{ r:6, fill:mc.color, stroke:C.card, strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Distribución clases + Niveles ── */}
        <div className="s-two-col" style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:16 }}>
          {/* Donut clases */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14, padding:"22px" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={Award} title="DISTRIBUCIÓN DE CLASES"/>
            {(() => {
              const clsData = statsData?.classDistribution
                ? Object.entries(statsData.classDistribution)
                    .filter(([,v]) => Number(v) > 0)
                    .map(([name, value]) => ({ name, value:Number(value), color:DATA_CLASES.find(c=>c.name===name)?.color||C.muted, usuarios:Number(value) }))
                : DATA_CLASES;
              if (!clsData.length) return <EmptyChart text="Sin usuarios" height={160}/>;
              const totalCls = clsData.reduce((s, d) => s + d.value, 0);
              return (
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <PieChart width={160} height={160}>
                    <Pie data={clsData} cx={75} cy={75} innerRadius={45} outerRadius={72}
                      dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                      {clsData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip content={<FvTooltip/>} trigger={isMobile?"click":"hover"}/>
                  </PieChart>
                  <div style={{ flex:1 }}>
                    {clsData.map((d, i) => (
                      <div key={i} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <div style={{ width:8, height:8, background:d.color, borderRadius:2 }}/>
                            <span style={{ ...raj(12, 700), color:d.color }}>{d.name}</span>
                          </div>
                          <span style={{ ...raj(12, 700), color:d.color }}>
                            {Math.round((d.value / totalCls) * 100)}%
                          </span>
                        </div>
                        <InlineBar val={d.value} max={totalCls} color={d.color}/>
                        <div style={{ ...raj(10, 500), color:C.muted, marginTop:3 }}>{d.usuarios} usuarios</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Barras niveles */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14, padding:"22px" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={TrendingUp} title="DISTRIBUCIÓN DE NIVELES" color={C.gold}/>
            {(() => {
              const lvl = Array.isArray(statsData?.levelDistribution) && statsData.levelDistribution.length > 0
                ? statsData.levelDistribution : DATA_NIVEL_DIST;
              if (!lvl.length) return <EmptyChart text="Sin datos" height={180}/>;
              return (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={lvl} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
                    <XAxis dataKey="rango" tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<FvTooltip/>} trigger={isMobile?"click":"hover"}/>
                    <Bar dataKey="usuarios" name="Usuarios" radius={[4,4,0,0]}>
                      {lvl.map((_, i) => <Cell key={i} fill={i<2?C.blue:i<4?C.orange:i<6?C.gold:C.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* ── Retención + Radar ── */}
        <div className="s-two-col" style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16 }}>
          {/* Retención */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14, padding:"22px" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={Users} title="CURVA DE RETENCIÓN" color={C.teal}/>
            <p style={{ ...raj(12, 400), color:C.muted, marginBottom:16, lineHeight:1.5 }}>
              % de usuarios activos semanas después de registrarse
            </p>
            {(() => {
              const ret = Array.isArray(statsData?.retentionData) && statsData.retentionData.length > 0
                ? statsData.retentionData : DATA_RETENCION;
              if (!ret.length) return <EmptyChart text="Sin datos" height={180}/>;
              return (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={ret}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.teal} stopOpacity={.35}/>
                        <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
                    <XAxis dataKey="semana" tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<FvTooltip/>} trigger={isMobile?"click":"hover"}/>
                    <Area type="monotone" dataKey="retencion" name="Retención %" stroke={C.teal} strokeWidth={2.5}
                      fill="url(#retGrad)" dot={{ fill:C.teal, r:4, strokeWidth:0 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </div>

          {/* Radar con gradiente */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14, padding:"22px" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={Activity} title="PERFIL PROMEDIO" color={C.purple}/>
            {(() => {
              const rd = Array.isArray(statsData?.avgProfile) && statsData.avgProfile.length > 0
                ? statsData.avgProfile : DATA_RADAR;
              if (!rd.length) return <EmptyChart text="Sin datos" height={220}/>;
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={rd}>
                    <defs>
                      <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C.purple} stopOpacity={0.45}/>
                        <stop offset="100%" stopColor={C.purple} stopOpacity={0.06}/>
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke={`${C.navyL}66`}/>
                    <PolarAngleAxis dataKey="attr" tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }}/>
                    <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
                    <Radar name="Promedio" dataKey="valor" stroke={C.purple} strokeWidth={2}
                      fill="url(#radarGrad)" fillOpacity={1}/>
                    <Tooltip content={<FvTooltip/>} trigger={isMobile?"click":"hover"}/>
                  </RadarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* ── Picos de actividad horaria ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
          padding:"22px", animation:"s-cardIn .5s ease .28s both" }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
          <SectionHeader icon={Clock} title="PICOS DE ACTIVIDAD HORARIA" color={C.gold}
            extra={<span style={{ ...raj(11, 500), color:C.muted }}>Hora local (últimos 30 días)</span>}/>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData} barCategoryGap="10%" margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
              <XAxis dataKey="hora" tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }}
                axisLine={false} tickLine={false}
                interval={2}/>
              <YAxis tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<FvTooltip/>} trigger={isMobile?"click":"hover"}/>
              <Bar dataKey="sesiones" name="Sesiones" radius={[3,3,0,0]}>
                {hourlyData.map((d, i) => {
                  const peak = Math.max(...hourlyData.map(h => h.sesiones));
                  const isPeak = d.sesiones >= peak * 0.85;
                  return <Cell key={i} fill={isPeak ? C.orange : `${C.blue}99`}/>;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, background:C.orange, borderRadius:2 }}/>
              <span style={{ ...raj(10, 500), color:C.muted }}>Pico (≥85%)</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, background:`${C.blue}99`, borderRadius:2 }}/>
              <span style={{ ...raj(10, 500), color:C.muted }}>Normal</span>
            </div>
          </div>
        </div>

        {/* ── Top ejercicios ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14, overflow:"hidden",
          animation:"s-cardIn .5s ease .32s both" }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"18px 22px", borderBottom:`1px solid ${C.navy}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:`${C.orange}18`, border:`1px solid ${C.orange}33`, borderRadius:6, padding:6, display:"flex" }}>
                <BarChart2 size={14} color={C.orange}/>
              </div>
              <span style={{ ...orb(11, 700), color:C.white }}>TOP EJERCICIOS POR POPULARIDAD</span>
            </div>
            <span style={{ ...raj(11, 500), color:C.muted }}>{topExercises.length} ejercicios</span>
          </div>
          {topExercises.length === 0 ? <EmptyChart text="Sin datos" height={120}/> : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 3fr",
                padding:"10px 22px", background:`${C.panel}88`, borderBottom:`1px solid ${C.navy}`, gap:12 }}>
                {["EJERCICIO","SESIONES","XP","COMPLETADAS","POPULARIDAD"].map(h => (
                  <span key={h} style={{ ...px(5), color:C.muted, letterSpacing:".05em" }}>{h}</span>
                ))}
              </div>
              {topExercises.map((ej, i) => {
                const colors = [C.orange, C.blue, C.teal, C.gold, C.purple, C.green, C.orangeL, C.red];
                const c = colors[i % colors.length];
                return (
                  <div key={ej.name} className="s-bar-row"
                    style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 3fr",
                      padding:"12px 22px", borderBottom:`1px solid ${C.navy}22`, gap:12,
                      alignItems:"center", animation:`s-cardIn .35s ease ${i*.05}s both` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ ...orb(10, 900), color:C.muted, minWidth:20, textAlign:"center" }}>#{i+1}</div>
                      <span style={{ ...raj(13, 700), color:C.white }}>{ej.name}</span>
                    </div>
                    <span style={{ ...raj(13, 700), color:c }}>{ej.sesiones.toLocaleString()}</span>
                    <span style={{ ...raj(13, 600), color:C.gold }}>{(ej.xp/1000).toFixed(1)}K</span>
                    <span style={{ ...raj(13, 600), color:C.teal }}>{ej.completadas.toLocaleString()}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <InlineBar val={ej.sesiones} max={maxSes} color={c} height={8}/>
                      <span style={{ ...raj(11, 700), color:c, minWidth:36, textAlign:"right" }}>
                        {Math.round((ej.sesiones/maxSes)*100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Heatmap + Leaderboard (300px fixed, no auto) ── */}
        <div className="s-hm-col" style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16 }}>
          {/* Heatmap */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
            padding:"22px", animation:"s-cardIn .5s ease .38s both" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={Calendar} title="ACTIVIDAD · 10 SEMANAS" color={C.orange}/>
            <ActivityHeatmap statsData={statsData}/>
          </div>

          {/* Leaderboard */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
            overflow:"hidden", animation:"s-cardIn .5s ease .4s both" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"18px 22px",
              borderBottom:`1px solid ${C.navy}` }}>
              <div style={{ background:`${C.gold}18`, border:`1px solid ${C.gold}33`, borderRadius:6, padding:6, display:"flex" }}>
                <Trophy size={14} color={C.gold}/>
              </div>
              <span style={{ ...orb(11, 700), color:C.white, flex:1 }}>LEADERBOARD GLOBAL</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"56px 1fr 0.7fr 0.7fr 0.7fr 0.8fr",
              padding:"9px 20px", background:`${C.panel}88`, borderBottom:`1px solid ${C.navy}`, gap:10 }}>
              {["POS","USUARIO","CLASE","NIVEL","XP","SES."].map(h => (
                <span key={h} style={{ ...px(5), color:C.muted, letterSpacing:".04em" }}>{h}</span>
              ))}
            </div>
            {(statsData?.topUsers || TOP_USERS).map((u, i) => (
              <div key={u.pos} className="s-user-row"
                style={{ display:"grid", gridTemplateColumns:"56px 1fr 0.7fr 0.7fr 0.7fr 0.8fr",
                  padding:"10px 20px", borderBottom:`1px solid ${C.navy}22`, gap:10,
                  alignItems:"center", animation:`s-cardIn .3s ease ${i*.05}s both` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <PosMedal pos={u.pos}/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:26, height:26, background:`${CLS_COLOR[u.clase]}22`,
                    border:`1px solid ${CLS_COLOR[u.clase]}44`, borderRadius:4,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>
                    {CLS_ICON[u.clase]}
                  </div>
                  <span style={{ ...raj(13, 700), color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {u.nombre}
                  </span>
                </div>
                <span style={{ ...raj(10, 700), color:CLS_COLOR[u.clase], background:`${CLS_COLOR[u.clase]}14`,
                  border:`1px solid ${CLS_COLOR[u.clase]}33`, borderRadius:4, padding:"2px 6px", whiteSpace:"nowrap" }}>
                  {u.clase}
                </span>
                <span style={{ ...orb(12, 900), color:C.gold }}>Lv.{u.nivel}</span>
                <span style={{ ...raj(12, 700), color:C.orange }}>{u.xp.toLocaleString()}</span>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ ...raj(12, 600), color:C.blue }}>{u.sesiones}</span>
                  <InlineBar val={u.sesiones} max={150} color={C.blue} height={4}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sesiones vs XP ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
          padding:"22px", animation:"s-cardIn .5s ease .44s both" }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
          <SectionHeader icon={Activity} title="SESIONES VS XP GENERADO" color={C.blue}/>
          {data.length === 0 ? <EmptyChart text="Sin datos" height={220}/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.slice(0, 14)} barCategoryGap="25%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
                <XAxis dataKey="dia" tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left"  tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="right" orientation="right" tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }}
                  axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                <Tooltip content={<FvTooltip/>} trigger={isMobile?"click":"hover"}/>
                <Legend wrapperStyle={{ ...raj(11, 600), color:C.muted, paddingTop:8 }}/>
                <Bar yAxisId="left"  dataKey="sesiones" name="Sesiones" fill={C.orange} radius={[4,4,0,0]} maxBarSize={22}/>
                <Bar yAxisId="right" dataKey="xp"       name="XP"       fill={C.gold}   radius={[4,4,0,0]} maxBarSize={22}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Misiones + Logros ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
            padding:"22px", animation:"s-cardIn .5s ease .48s both" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={Target} title="ESTADO DE MISIONES" color={C.teal}/>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { l:"Diarias completadas hoy",     v:312, max:500, c:C.orange },
                { l:"Semanales completadas",        v:89,  max:150, c:C.blue   },
                { l:"Desafíos activos en progreso", v:23,  max:50,  c:C.gold   },
                { l:"Participantes en eventos",     v:0,   max:500, c:C.purple },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ ...raj(12, 600), color:C.mutedL }}>{s.l}</span>
                    <span style={{ ...raj(12, 700), color:s.c }}>{s.v.toLocaleString()}</span>
                  </div>
                  <InlineBar val={s.v} max={s.max} color={s.c} height={6}/>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
            padding:"22px", animation:"s-cardIn .5s ease .5s both" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <SectionHeader icon={Trophy} title="LOGROS MÁS OBTENIDOS" color={C.gold}/>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { name:"Primer Paso",      obtenidos:892, color:C.muted  },
                { name:"Perfil Completo",  obtenidos:567, color:C.blue   },
                { name:"Cardio Diario",    obtenidos:348, color:C.orange  },
                { name:"Semana de Hierro", obtenidos:312, color:C.red    },
                { name:"Nivel 10",         obtenidos:234, color:C.gold   },
              ].map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ ...orb(10, 900), color:C.muted, minWidth:20, textAlign:"center" }}>#{i+1}</span>
                  <span style={{ ...raj(12, 700), color:C.white, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {l.name}
                  </span>
                  <InlineBar val={l.obtenidos} max={1000} color={l.color} height={6}/>
                  <span style={{ ...raj(11, 700), color:l.color, minWidth:36, textAlign:"right" }}>{l.obtenidos}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
