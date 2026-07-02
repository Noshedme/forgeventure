// src/pages/admin/AdminMente.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Smile, Activity, Gauge, TrendingUp,
  Award, Users, BarChart2, RefreshCw,
  Flower2, Star, AlertCircle, Flame,
  Layers, Settings2, CheckCircle2, Circle,
} from "lucide-react";
import { auth } from "../../firebase.js";
import { getMenteAdminOverview } from "../../services/api.js";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  AreaChart, Area,
} from "recharts";

// ── Metadata ──────────────────────────────────────────────────
const MOOD_META = {
  tense:   { label:"Tenso",       color:C.red    },
  tired:   { label:"Cansado",     color:C.muted  },
  neutral: { label:"Neutro",      color:C.blue   },
  good:    { label:"Bien",        color:C.teal   },
  powered: { label:"Con energía", color:C.orange },
};

const MOOD_WEIGHTS = { powered:100, good:75, neutral:50, tired:25, tense:0 };

const SESSION_META = {
  mood:        { label:"Check-in",    color:C.orange },
  gratitude:   { label:"Gratitud",    color:C.teal   },
  breathing:   { label:"Respiración", color:C.blue   },
  affirmation: { label:"Afirmaciones",color:C.honey  },
  perma:       { label:"PERMA",       color:C.plum   },
  strengths:   { label:"Fortalezas",  color:C.rose   },
  connection:  { label:"Conexión",    color:C.green  },
};

const PERMA_META = {
  P: { label:"Emociones",   color:C.rose,  desc:"Positive Emotions", icon:"P" },
  E: { label:"Compromiso",  color:C.blue,  desc:"Engagement",        icon:"E" },
  R: { label:"Relaciones",  color:C.plum,  desc:"Relationships",     icon:"R" },
  M: { label:"Significado", color:C.sage,  desc:"Meaning",           icon:"M" },
  A: { label:"Logros",      color:C.honey, desc:"Achievements",      icon:"A" },
};

const SESSION_PERMA = {
  mood:        ["P"],
  gratitude:   ["P"],
  breathing:   ["M"],
  affirmation: ["E"],
  perma:       ["P","E","R","M","A"],
  strengths:   ["A"],
  connection:  ["R"],
};

const BASE_URL = "http://localhost:4000/api";

const getToken = async () => {
  const u = auth.currentUser;
  if (!u) throw new Error("No autenticado");
  return u.getIdToken();
};

const calcDelta = (curr, prev) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

// ── Global CSS ─────────────────────────────────────────────────
const CSS = `
  @keyframes mente-shimmer {
    0%  { background-position:-300px 0 }
    100%{ background-position: 300px 0 }
  }
  @keyframes c-spin { to { transform:rotate(360deg) } }
  .mente-skel {
    background:linear-gradient(90deg,${C.card} 25%,${C.navyL}33 50%,${C.card} 75%);
    background-size:300px 100%;
    animation:mente-shimmer 1.5s infinite linear;
    border-radius:8px;
  }
  @keyframes mn-skel-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .mn-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}55 50%,${C.card} 75%); background-size:400px 100%; animation:mn-skel-shimmer 1.5s infinite linear; }
`;

// ── Base components ────────────────────────────────────────────
function Skel({ h=200 }) {
  return <div className="mente-skel" style={{ height:h }}/>;
}

function Spinner({ color=C.orange }) {
  return (
    <div style={{
      width:12, height:12, flexShrink:0,
      border:`2px solid ${C.muted}`,
      borderTop:`2px solid ${color}`,
      borderRadius:"50%",
      animation:"c-spin .8s linear infinite",
    }}/>
  );
}

// ── Card — matches SectionCard from config/shared.jsx ─────────
function Card({ children, style }) {
  return (
    <motion.div
      whileHover={{ y:-1, boxShadow:"0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.07)" }}
      transition={{ duration:.18, ease:"easeOut" }}
      style={{
        background:"rgba(20,26,42,0.78)",
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        border:`1px solid ${C.navy}`,
        borderRadius:14,
        boxShadow:"0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
        overflow:"hidden",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Card header — matches SectionTitle from config/shared.jsx ──
function CardHeader({ icon: Icon, title, color, desc, extra }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"18px 22px", borderBottom:`1px solid ${C.navy}22`,
      flexWrap:"wrap",
    }}>
      <div style={{
        background:`${color}18`, border:`1px solid ${color}33`,
        borderRadius:8, padding:9, display:"flex", flexShrink:0,
      }}>
        <Icon size={16} color={color}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ ...orb(11,700), color:C.white, marginBottom:2 }}>{title}</div>
        {desc && <div style={{ ...raj(12,400), color:C.muted }}>{desc}</div>}
      </div>
      {extra}
    </div>
  );
}

// ── KPI stat card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub, delta, delay=0 }) {
  return (
    <motion.div
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:.35, delay, ease:"easeOut" }}
      whileHover={{ y:-2, boxShadow:"0 8px 28px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06)" }}
      style={{
        background:"rgba(20,26,42,0.78)",
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        border:`1px solid ${C.navy}`,
        borderLeft:`3px solid ${color}`,
        borderRadius:14,
        padding:"20px 20px",
        boxShadow:"0 4px 20px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
        cursor:"default",
      }}
    >
      <div style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        background:`${color}14`, border:`1px solid ${color}22`,
        borderRadius:8, padding:8, marginBottom:12,
      }}>
        <Icon size={18} color={color}/>
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:6 }}>
        <div style={{ ...orb(22,900), color }}>{value ?? "—"}</div>
        {delta !== null && delta !== undefined && (
          <span style={{
            ...raj(10,700),
            color: delta >= 0 ? C.green : C.red,
            background: delta >= 0 ? `${C.green}14` : `${C.red}14`,
            border:`1px solid ${delta >= 0 ? C.green : C.red}33`,
            padding:"2px 6px", borderRadius:20,
          }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div style={{ ...raj(13,700), color:C.white }}>{label}</div>
      {sub && <div style={{ ...raj(11,400), color:C.muted, marginTop:2 }}>{sub}</div>}
    </motion.div>
  );
}

// ── PERMA pill filter ──────────────────────────────────────────
function PermaFilter({ active, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", borderRadius:12, padding:"10px 12px" }}>
      <button onClick={() => onChange(null)} style={{
        ...raj(10,700),
        background: active===null ? `${C.purple}18` : "transparent",
        border:`1px solid ${active===null ? C.purple+"66" : C.navy}`,
        boxShadow: active===null ? `0 0 10px ${C.purple}33` : "none",
        color: active===null ? C.purple : C.muted,
        borderRadius:20, padding:"4px 12px", cursor:"pointer",
      }}>
        Todos
      </button>
      {Object.entries(PERMA_META).map(([k, m]) => (
        <button key={k} onClick={() => onChange(active===k ? null : k)} style={{
          ...raj(10,700),
          background: active===k ? `${m.color}18` : "transparent",
          border:`1px solid ${active===k ? m.color+"66" : C.navy}`,
          boxShadow: active===k ? `0 0 10px ${m.color}33` : "none",
          color: active===k ? m.color : C.muted,
          borderRadius:20, padding:"4px 10px", cursor:"pointer",
        }}>
          {k} · {m.label}
        </button>
      ))}
    </div>
  );
}

// ── Community wellness badges ──────────────────────────────────
function WellnessBadges({ data }) {
  if (!data) return null;
  const badges = [];
  const pv = Object.values(data.communityPerma || {}).filter(v => v > 0);

  // Tamaño de comunidad
  if (data.activeUsers >= 100)     badges.push({ l:"CIUDAD EN FLOR",         c:C.blue,   rpg:true  });
  else if (data.activeUsers >= 50) badges.push({ l:"COMUNIDAD VIBRANTE",      c:C.orange, rpg:false });
  else if (data.activeUsers >= 10) badges.push({ l:"COMUNIDAD ACTIVA",        c:C.teal,   rpg:false });

  // PERMA
  if (pv.length === 5 && Math.min(...pv) >= 6)
    badges.push({ l:"PERMA EQUILIBRADO", c:C.sage,   rpg:true  });
  else if (pv.length === 5 && pv.every(v => v >= 7))
    badges.push({ l:"PERMA SALUDABLE",   c:C.plum,   rpg:false });

  // Sesiones
  if (data.totalSessions >= 1000)  badges.push({ l:"MAESTRO DEL BIENESTAR",  c:C.gold,   rpg:true  });

  // Fortalezas
  if ((data.topStrengths?.length||0) >= 10)
    badges.push({ l:"RICA EN FORTALEZAS", c:C.rose,  rpg:false });

  if (!badges.length) return null;
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
      {badges.map((b,i) => (
        <motion.span key={i}
          initial={{ opacity:0, scale:.85 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay:i*.07, type:"spring", stiffness:260 }}
          style={{
            ...(b.rpg ? px(7) : raj(9,700)),
            color:b.c,
            background:`${b.c}14`, border:`1px solid ${b.c}33`,
            padding:"3px 10px", borderRadius:20, lineHeight:1.8,
          }}
        >
          {b.l}
        </motion.span>
      ))}
    </div>
  );
}

// ── PERMA-enriched recharts tooltip (Item 7) ──────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const pk = label
    ? Object.keys(PERMA_META).find(k => PERMA_META[k].label === label)
    : null;
  const pm = pk ? PERMA_META[pk] : null;
  return (
    <div style={{
      background:"rgba(14,21,32,0.97)", border:`1px solid ${pm ? pm.color+"44" : C.navy}`,
      padding:"10px 14px", borderRadius:8,
      backdropFilter:"blur(8px)", boxShadow:"0 6px 24px rgba(0,0,0,.45)",
      minWidth:120,
    }}>
      {label && (
        <p style={{ ...raj(11,700), color: pm ? pm.color : C.mutedL, margin:"0 0 4px" }}>
          {pm ? `[${pm.icon}] ${label}` : label}
        </p>
      )}
      {pm && (
        <p style={{ ...raj(10,400), color:`${pm.color}99`, margin:"0 0 6px", fontStyle:"italic" }}>
          {pm.desc}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} style={{ ...raj(12,600), color:p.color || C.white, margin:0 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Empty states (Item 6) ──────────────────────────────────────
function EmptyState({ type="activity", message }) {
  const svgMap = {
    activity: (
      <svg width="76" height="60" viewBox="0 0 76 60" fill="none">
        <rect x="5" y="9"  width="66" height="46" rx="4" stroke={C.navy} strokeWidth="1.5" fill={`${C.blue}06`}/>
        <rect x="5" y="7"  width="66" height="13" rx="4" fill={`${C.blue}0C`} stroke={C.navy} strokeWidth="1.5"/>
        <line x1="20" y1="6"  x2="20" y2="20" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="56" y1="6"  x2="56" y2="20" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="14" y="42" width="6" height="10" rx="1.5" fill={`${C.blue}28`}/>
        <rect x="26" y="34" width="6" height="18" rx="1.5" fill={`${C.blue}28`}/>
        <rect x="38" y="38" width="6" height="14" rx="1.5" fill={`${C.blue}28`}/>
        <rect x="50" y="30" width="6" height="22" rx="1.5" fill={`${C.blue}28`}/>
        <line x1="10" y1="52" x2="66" y2="52" stroke={C.navy} strokeWidth="1" opacity=".6"/>
      </svg>
    ),
    mood: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="24" stroke={C.orange} strokeWidth="1.5" fill={`${C.orange}06`}/>
        <circle cx="22" cy="25" r="2.5" fill={C.orange} opacity=".55"/>
        <circle cx="38" cy="25" r="2.5" fill={C.orange} opacity=".55"/>
        <path d="M20 38 Q30 33 40 38" stroke={C.orange} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".45"/>
        <circle cx="30" cy="30" r="17" stroke={`${C.orange}22`} strokeWidth="1" strokeDasharray="3 3"/>
      </svg>
    ),
    strengths: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <polygon points="30,8 36,24 54,24 40,34 46,50 30,40 14,50 20,34 6,24 24,24"
          stroke={C.honey} strokeWidth="1.5" fill={`${C.honey}0A`}/>
        <polygon points="30,17 34,27 45,27 37,33 40,43 30,37 20,43 23,33 15,27 26,27"
          fill={`${C.honey}14`} stroke={`${C.honey}33`} strokeWidth="1"/>
      </svg>
    ),
    sessions: (
      <svg width="60" height="64" viewBox="0 0 60 64" fill="none">
        <circle cx="30" cy="14" r="7" stroke={C.sage} strokeWidth="1.5" fill={`${C.sage}0A`}/>
        <path d="M16 36 Q30 26 44 36" stroke={C.sage} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <line x1="30" y1="27" x2="30" y2="50" stroke={C.sage} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="30" y1="40" x2="19" y2="47" stroke={C.sage} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="30" y1="40" x2="41" y2="47" stroke={C.sage} strokeWidth="1.5" strokeLinecap="round"/>
        <ellipse cx="30" cy="57" rx="13" ry="3" fill={`${C.sage}14`}/>
      </svg>
    ),
    users: (
      <svg width="74" height="50" viewBox="0 0 74 50" fill="none">
        <circle cx="18" cy="18" r="8"  stroke={C.teal}   strokeWidth="1.5" fill={`${C.teal}0A`}/>
        <circle cx="37" cy="14" r="10" stroke={C.purple} strokeWidth="1.5" fill={`${C.purple}0A`}/>
        <circle cx="56" cy="18" r="8"  stroke={C.rose}   strokeWidth="1.5" fill={`${C.rose}0A`}/>
        <path d="M3 46 Q18 35 33 41"  stroke={C.teal}   strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M20 43 Q37 33 54 43" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M41 41 Q56 35 71 46" stroke={C.rose}   strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  };
  return (
    <div style={{ textAlign:"center", padding:"40px 20px",
      display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
      <motion.div
        initial={{ opacity:0, scale:.85 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ type:"spring", stiffness:200, damping:16 }}
      >
        {svgMap[type] || svgMap.activity}
      </motion.div>
      <p style={{ ...raj(12,500), color:C.muted, margin:0, lineHeight:1.6, maxWidth:220 }}>
        {message}
      </p>
    </div>
  );
}

// ── Sentiment Score gauge (Item 2) ────────────────────────────
function SentimentGauge({ score, loading }) {
  if (loading) return <Skel h={150}/>;
  if (score === null || score === undefined)
    return <EmptyState type="mood" message="Sin datos de ánimo en el período"/>;

  const color  = score >= 75 ? C.green : score >= 50 ? C.teal : score >= 25 ? C.orange : C.red;
  const label  = score >= 75 ? "Muy positivo" : score >= 50 ? "Positivo" : score >= 25 ? "Neutro" : "Bajo";
  const gaugeData = [
    { value: score,       fill: color            },
    { value: 100 - score, fill: `${C.navyL}55`   },
  ];

  return (
    <div style={{ position:"relative", userSelect:"none" }}>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie data={gaugeData} cx="50%" cy="80%"
            startAngle={180} endAngle={0}
            innerRadius={52} outerRadius={74}
            paddingAngle={0} dataKey="value" strokeWidth={0}
          >
            {gaugeData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)",
        textAlign:"center", pointerEvents:"none",
      }}>
        <motion.div
          initial={{ opacity:0, scale:.7 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ type:"spring", stiffness:180, damping:14, delay:.1 }}
          style={{ ...orb(28,900), color, lineHeight:1 }}
        >
          {score}
        </motion.div>
        <div style={{ ...raj(10,700), color:C.mutedL, marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Top Activos user list (Item 4) ────────────────────────────
function UserList({ users, loading }) {
  if (loading) return <Skel h={120}/>;
  if (!users || users.length === 0)
    return <EmptyState type="users" message="Requiere endpoint GET /mente/admin/top-users"/>;

  const accents = [C.purple, C.blue, C.teal, C.orange, C.rose];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {users.map((u, i) => (
        <motion.div key={u.uid || i}
          initial={{ opacity:0, x:-10 }}
          animate={{ opacity:1, x:0 }}
          transition={{ delay:i*.055 }}
          style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"10px 14px",
            background:`${C.navy}18`,
            border:`1px solid ${C.navy}44`,
            borderRadius:8,
          }}
        >
          <div style={{
            width:34, height:34, borderRadius:8, flexShrink:0,
            background:`${accents[i%5]}22`,
            border:`1px solid ${accents[i%5]}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            ...px(9), color:accents[i%5],
          }}>
            {(u.displayName || u.email || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...raj(13,700), color:C.white,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {u.displayName || u.email || "Usuario"}
            </div>
            <div style={{ ...raj(11,400), color:C.muted }}>
              {u.sessions} sesiones · {u.streak ?? 0} días racha
            </div>
          </div>
          <span style={{
            ...raj(9,700), color:C.mutedL,
            background:`${C.navyL}44`, border:`1px solid ${C.navy}`,
            padding:"3px 8px", borderRadius:20, flexShrink:0,
          }}>
            #{i + 1}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function SkeletonMente() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="mn-skel" style={{borderRadius:14,height:90,animationDelay:`${i*.08}s`}}/>
        ))}
      </div>
      <div className="mn-skel" style={{borderRadius:12,height:52}}/>
      <div className="mn-skel" style={{borderRadius:10,height:50}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="mn-skel" style={{borderRadius:14,height:220,animationDelay:`${i*.07}s`}}/>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AdminMente() {
  const [days,        setDays]        = useState(7);
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [permaPillar, setPermaPillar] = useState(null);
  const [prevByDay,   setPrevByDay]   = useState(null);
  const [topUsers,    setTopUsers]    = useState(undefined);
  const [activities,  setActivities]  = useState(undefined); // Item 10
  const [actSaving,   setActSaving]   = useState(null);      // id of activity being saved

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();

      const res = await getMenteAdminOverview(token, days);
      if (res.ok && res.overview) setData(res.overview);
      else { setError(res.message || "Error al cargar datos"); return; }

      // Item 3: previous-period delta via double-window fetch
      try {
        const prev = await getMenteAdminOverview(token, days * 2);
        if (prev.ok && prev.overview?.byDay) {
          const all  = prev.overview.byDay;
          const half = Math.floor(all.length / 2);
          setPrevByDay({ sessions: all.slice(0, half).reduce((a,d) => a + d.count, 0) });
        } else { setPrevByDay(null); }
      } catch { setPrevByDay(null); }

      // Item 4: top active users — graceful fallback for missing endpoint
      try {
        const r = await fetch(`${BASE_URL}/mente/admin/top-users?days=${days}`, {
          headers:{ Authorization:`Bearer ${token}` },
        });
        setTopUsers(r.ok ? (await r.json()).users || [] : null);
      } catch { setTopUsers(null); }

      // Item 10: activities config — fetch once
      if (activities === undefined) {
        try {
          const r = await fetch(`${BASE_URL}/mente/admin/activities`, {
            headers:{ Authorization:`Bearer ${token}` },
          });
          setActivities(r.ok ? (await r.json()).activities || [] : null);
        } catch { setActivities(null); }
      }

    } catch (e) {
      setError(e.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // Item 10: toggle activity active/inactive
  const patchActivity = async (id, patch) => {
    setActSaving(id);
    try {
      const token = await getToken();
      const r = await fetch(`${BASE_URL}/mente/admin/activities/${id}`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        setActivities(prev => prev?.map(a => a.id === id ? { ...a, ...patch } : a));
      }
    } catch { /* silent */ } finally {
      setActSaving(null);
    }
  };

  // ── Derived data ────────────────────────────────────────────
  const moodPieData = data
    ? Object.entries(data.moodDist).map(([id, count]) => ({
        name:  MOOD_META[id]?.label || id,
        value: count,
        color: MOOD_META[id]?.color || C.muted,
      })).filter(d => d.value > 0)
    : [];

  const sentimentScore = (() => {
    if (!data || !moodPieData.length) return null;
    const map = {};
    moodPieData.forEach(d => {
      const id = Object.keys(MOOD_META).find(k => MOOD_META[k].label === d.name);
      if (id) map[id] = d.value;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    if (!total) return null;
    return Math.round(
      Object.entries(map).reduce((acc,[k,v]) => acc + (MOOD_WEIGHTS[k]??50)*v, 0) / total
    );
  })();

  const allSessionBarData = data
    ? Object.entries(data.sessionByType).map(([type, count]) => ({
        name:  SESSION_META[type]?.label || type,
        count, fill: SESSION_META[type]?.color || C.mutedL,
        perma: SESSION_PERMA[type] || [],
      })).sort((a,b) => b.count - a.count)
    : [];

  const sessionBarData = permaPillar
    ? allSessionBarData.filter(d => d.perma.includes(permaPillar))
    : allSessionBarData;

  const strengthBarData = data?.topStrengths?.map(s => ({
    name: s.strength, count: s.count,
  })) || [];

  const permaRadarData = data
    ? Object.entries(data.communityPerma).map(([k, v]) => ({
        subject:  PERMA_META[k]?.label || k,
        value:    v || 0,
        fullMark: 10,
      }))
    : [];

  const dayAreaData = data?.byDay?.map(d => ({
    date: d.date.slice(5), count: d.count,
  })) || [];

  const sessionsDelta = prevByDay && data
    ? calcDelta(data.totalSessions, prevByDay.sessions)
    : null;

  // Item 9: streakDist from overview
  const streakDist = data?.streakDist || null;

  // Item 14: permaByClass — convert to recharts grouped bar format
  const permaByClassData = (() => {
    const pbc = data?.permaByClass;
    if (!pbc || Object.keys(pbc).length === 0) return [];
    return ["P","E","R","M","A"].map(k => {
      const entry = { pillar: k };
      Object.entries(pbc).forEach(([cls, vals]) => { entry[cls] = vals[k] ?? 0; });
      return entry;
    });
  })();
  const permaClasses = data?.permaByClass ? Object.keys(data.permaByClass) : [];

  // ── Render ──────────────────────────────────────────────────
  if (loading) return <><style>{CSS}</style><SkeletonMente/></>;
  return (
    <div style={{ padding:"0 0 48px" }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity:0, y:-8 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:.3 }}
        style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:24, flexWrap:"wrap" }}
      >
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
            <div style={{
              width:3, height:36,
              background:`linear-gradient(180deg,${C.purple},${C.rose})`,
              borderRadius:2, flexShrink:0,
            }}/>
            <div>
              <h1 style={{ ...px(11), color:C.white, margin:0, lineHeight:1.6 }}>ZONA MENTE</h1>
              <p style={{ ...raj(12,400), color:C.muted, margin:0 }}>
                Bienestar psicológico comunitario · Modelo PERMA
              </p>
            </div>
          </div>
          <WellnessBadges data={data}/>
        </div>

        {/* Period selector + refresh */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {[7, 14, 30].map(d => (
            <motion.button key={d}
              whileTap={{ scale:.95 }}
              animate={{ opacity: loading ? (days===d ? 0.65 : 0.4) : 1 }}
              onClick={() => setDays(d)}
              style={{
                ...raj(12,700),
                padding:"7px 14px", borderRadius:20,
                background: days===d ? `${C.purple}18` : "transparent",
                border:`1px solid ${days===d ? C.purple+"66" : C.navy+"88"}`,
                color: days===d ? C.purple : C.muted,
                cursor: loading ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", gap:6,
              }}
            >
              {loading && days===d && <Spinner color={C.purple}/>}
              {d}d
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale:.95 }}
            onClick={load} disabled={loading}
            style={{
              ...raj(12,700),
              padding:"7px 14px", borderRadius:8,
              background: `${C.orange}14`,
              border:`1px solid ${C.orange}44`,
              color: C.orange,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? .55 : 1,
              display:"flex", alignItems:"center", gap:6,
            }}
          >
            {loading ? <Spinner color={C.orange}/> : <RefreshCw size={13}/>}
            Actualizar
          </motion.button>
        </div>
      </motion.div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity:0, y:-6 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }}
            style={{
              display:"flex", alignItems:"center", gap:10,
              background:`${C.red}0C`, border:`1px solid ${C.red}33`,
              padding:"12px 16px", borderRadius:8,
              ...raj(13,600), color:C.red, marginBottom:18,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink:0 }}/>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ BENTO GRID ══════════════════════════════════════════ */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(12, 1fr)",
        gap:12,
        alignItems:"start",
      }}>

        {/* ── Row 1: KPI cards ── */}
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ gridColumn:"span 3" }}>
              <div className="mente-skel" style={{ height:118 }}/>
            </div>
          ))
        ) : data && (
          <>
            <div style={{ gridColumn:"span 3" }}>
              <StatCard icon={Brain}    label="Usuarios activos"  value={data.activeUsers}
                color={C.purple} sub={`últimos ${days} días`} delay={0}/>
            </div>
            <div style={{ gridColumn:"span 3" }}>
              <StatCard icon={Smile}    label="Check-ins ánimo"   value={data.totalMoods}
                color={C.blue}   sub={`últimos ${days} días`} delay={.05}/>
            </div>
            <div style={{ gridColumn:"span 3" }}>
              <StatCard icon={Activity} label="Sesiones totales"  value={data.totalSessions}
                color={C.teal}   sub="todas las prácticas"   delta={sessionsDelta} delay={.1}/>
            </div>
            <div style={{ gridColumn:"span 3" }}>
              <StatCard icon={Star}     label="Tests fortalezas" value={data.totalStrengthsUsers||0}
                color={C.honey}  sub="usuarios completaron VIA" delay={.15}/>
            </div>
          </>
        )}

        {/* ── Row 2: PERMA Radar (5) · Mood Pie (3) · Sessions (4) ── */}

        {/* PERMA Radar */}
        <motion.div style={{ gridColumn:"span 5" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.1 }}>
          <Card>
            <CardHeader icon={Flower2} title={`PERMA COMUNITARIO · ${days}D`}
              color={C.purple} desc="Promedio de bienestar por pilar"
              extra={
                !loading && permaRadarData.length
                  ? <span style={{ ...raj(9,700), color:C.muted,
                      background:`${C.navyL}33`, border:`1px solid ${C.navy}`,
                      padding:"3px 9px", borderRadius:20 }}>AVG /10</span>
                  : null
              }
            />
            <div style={{ padding:"14px 20px 20px" }}>
              {loading ? <Skel h={300}/> : (
                permaRadarData.every(d => d.value === 0) ? (
                  <EmptyState type="sessions" message="Sin datos de PERMA en el período"/>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={175}>
                      <RadarChart outerRadius={68} data={permaRadarData}>
                        <PolarGrid stroke={C.navy} opacity={.8}/>
                        <PolarAngleAxis dataKey="subject"
                          tick={{ fill:C.mutedL, fontSize:10, fontFamily:"Rajdhani", fontWeight:600 }}/>
                        <Radar name="Comunidad" dataKey="value"
                          stroke={C.purple} fill={C.purple} fillOpacity={.2}/>
                        <Tooltip content={<CustomTooltip/>}/>
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:10 }}>
                      {permaRadarData.map(d => {
                        const key = Object.keys(PERMA_META).find(k => PERMA_META[k].label === d.subject);
                        const col = key ? PERMA_META[key].color : C.purple;
                        return (
                          <div key={d.subject}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ ...raj(12,600), color:C.mutedL }}>{d.subject}</span>
                              <span style={{ ...raj(11,700), color:col }}>{d.value}/10</span>
                            </div>
                            <div style={{ background:`${C.navyL}44`, borderRadius:3, height:4, overflow:"hidden" }}>
                              <motion.div
                                initial={{ width:0 }}
                                animate={{ width:`${(d.value/10)*100}%` }}
                                transition={{ duration:.75, ease:"easeOut", delay:.25 }}
                                style={{ height:"100%",
                                  background:`linear-gradient(90deg,${col}66,${col})`,
                                  borderRadius:3 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* Mood distribution */}
        <motion.div style={{ gridColumn:"span 3" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.15 }}>
          <Card>
            <CardHeader icon={Smile} title="DISTRIBUCIÓN DE ÁNIMOS" color={C.orange}
              desc={`últimos ${days} días`}/>
            <div style={{ padding:"14px 18px 20px" }}>
              {loading ? <Skel h={258}/> : (
                moodPieData.length === 0 ? (
                  <EmptyState type="mood" message="Sin check-ins de ánimo"/>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={155}>
                      <PieChart>
                        <Pie data={moodPieData} cx="50%" cy="50%"
                          innerRadius={40} outerRadius={64}
                          paddingAngle={2} dataKey="value">
                          {moodPieData.map((e,i) => (
                            <Cell key={i} fill={e.color} opacity={.8}/>
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
                      {moodPieData.map((d,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
                          padding:"4px 0",
                          borderBottom:`1px solid ${C.navy}22` }}>
                          <div style={{ width:6, height:6, borderRadius:2,
                            background:d.color, flexShrink:0 }}/>
                          <span style={{ ...raj(11,500), color:C.muted, flex:1 }}>{d.name}</span>
                          <span style={{ ...raj(11,700), color:C.white }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* Sessions by type + PERMA filter */}
        <motion.div style={{ gridColumn:"span 4" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.2 }}>
          <Card>
            <CardHeader icon={Activity} title="SESIONES POR TIPO" color={C.teal}
              desc="Filtrar por pilar PERMA"/>
            <div style={{ padding:"12px 18px 6px",
              borderBottom:`1px solid ${C.navy}22` }}>
              <PermaFilter active={permaPillar} onChange={setPermaPillar}/>
            </div>
            <div style={{ padding:"8px 18px 20px" }}>
              {loading ? <Skel h={198}/> : (
                sessionBarData.length === 0 ? (
                  <EmptyState type="sessions"
                    message={`Sin sesiones${permaPillar ? ` en pilar ${permaPillar}` : ""}`}/>
                ) : (
                  <ResponsiveContainer width="100%" height={198}>
                    <BarChart data={sessionBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.navy} opacity={.5}/>
                      <XAxis dataKey="name"
                        tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }}
                        angle={-15} textAnchor="end" height={34}/>
                      <YAxis tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }}
                        allowDecimals={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="count" name="Sesiones" radius={[3,3,0,0]}>
                        {sessionBarData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Row 3: Sentiment Score (4) · Daily Activity AreaChart (8) ── */}

        {/* Sentiment Score gauge */}
        <motion.div style={{ gridColumn:"span 4" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.25 }}>
          <Card>
            <CardHeader icon={Gauge} title="SENTIMENT SCORE" color={C.orange}
              desc="Score ponderado por bienestar emocional"
              extra={
                <span style={{ ...raj(9,700), color:C.muted,
                  background:`${C.navyL}33`, border:`1px solid ${C.navy}`,
                  padding:"3px 9px", borderRadius:20 }}>{days}D</span>
              }
            />
            <div style={{ padding:"14px 18px 20px" }}>
              <SentimentGauge score={sentimentScore} loading={loading}/>
              {!loading && sentimentScore !== null && (
                <div style={{
                  marginTop:10, paddingTop:10,
                  borderTop:`1px solid ${C.navy}22`,
                  display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap",
                }}>
                  {Object.entries(MOOD_WEIGHTS).reverse().map(([k, w]) => {
                    const meta = MOOD_META[k];
                    if (!meta) return null;
                    return (
                      <div key={k} style={{ display:"flex", flexDirection:"column",
                        alignItems:"center", gap:2 }}>
                        <span style={{ ...raj(9,700), color:meta.color }}>{w}</span>
                        <span style={{ ...raj(9,400), color:C.muted }}>{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Daily activity — AreaChart with gradient (Item 1) */}
        <motion.div style={{ gridColumn:"span 8" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.3 }}>
          <Card>
            <CardHeader icon={TrendingUp} title={`ACTIVIDAD DIARIA · ${days} DÍAS`}
              color={C.blue} desc="Check-ins y sesiones por día"/>
            <div style={{ padding:"14px 18px 20px" }}>
              {loading ? <Skel h={208}/> : (
                dayAreaData.length === 0 ? (
                  <EmptyState type="activity" message="Sin actividad registrada en el período"/>
                ) : (
                  <ResponsiveContainer width="100%" height={208}>
                    <AreaChart data={dayAreaData}>
                      <defs>
                        <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="8%"  stopColor={C.blue} stopOpacity={.35}/>
                          <stop offset="92%" stopColor={C.blue} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.navy} opacity={.5}/>
                      <XAxis dataKey="date"
                        tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }}/>
                      <YAxis tick={{ fill:C.muted, fontSize:10, fontFamily:"Rajdhani" }}
                        allowDecimals={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="count" name="Check-ins"
                        stroke={C.blue} strokeWidth={2}
                        fill="url(#blueAreaGrad)"
                        dot={{ fill:C.blue, r:3, strokeWidth:0 }}
                        activeDot={{ r:5, fill:C.blue, stroke:`${C.blue}44`, strokeWidth:2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Row 4: Top Strengths (4) · Top Activos (8) ── */}

        {/* Top strengths */}
        <motion.div style={{ gridColumn:"span 4" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.35 }}>
          <Card>
            <CardHeader icon={Award} title="TOP FORTALEZAS" color={C.honey}
              desc="Fortalezas más frecuentes en la comunidad"/>
            <div style={{ padding:"14px 18px 20px" }}>
              {loading ? <Skel h={208}/> : (
                strengthBarData.length === 0 ? (
                  <EmptyState type="strengths" message="Sin test de fortalezas aún"/>
                ) : (
                  <ResponsiveContainer width="100%" height={208}>
                    <BarChart data={strengthBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={C.navy} opacity={.5}/>
                      <XAxis type="number"
                        tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }}
                        allowDecimals={false}/>
                      <YAxis type="category" dataKey="name" width={85}
                        tick={{ fill:C.mutedL, fontSize:9, fontFamily:"Rajdhani" }}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="count" name="Usuarios" radius={[0,3,3,0]}>
                        {strengthBarData.map((_,i) => (
                          <Cell key={i}
                            fill={[C.honey,C.orange,C.purple,C.blue,C.sage,C.rose][i%6]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </div>
          </Card>
        </motion.div>

        {/* Top Activos */}
        <motion.div style={{ gridColumn:"span 8" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.4 }}>
          <Card>
            <CardHeader icon={Users} title="TOP ACTIVOS" color={C.teal}
              desc={`Usuarios más activos en los últimos ${days} días`}
              extra={
                <span style={{ ...raj(9,700), color:C.muted,
                  background:`${C.navyL}33`, border:`1px solid ${C.navy}`,
                  padding:"3px 9px", borderRadius:20 }}>{days}D</span>
              }
            />
            <div style={{ padding:"14px 18px 20px" }}>
              <UserList users={topUsers} loading={loading || topUsers === undefined}/>
            </div>
          </Card>
        </motion.div>

        {/* ── Row 5: Streak Distribution (4) · PERMA por clase (8) ── */}

        {/* Item 9: Streak Distribution */}
        <motion.div style={{ gridColumn:"span 4" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.45 }}>
          <Card>
            <CardHeader icon={Flame} title="RACHAS ACTIVAS" color={C.orange}
              desc="Distribución de rachas de check-in comunitarias"/>
            <div style={{ padding:"14px 18px 20px" }}>
              {loading ? <Skel h={160}/> : !streakDist || streakDist.total === 0 ? (
                <EmptyState type="activity" message="Sin usuarios con racha activa"/>
              ) : (
                <>
                  {/* Pct headline */}
                  <div style={{ textAlign:"center", marginBottom:16 }}>
                    <div style={{ ...orb(22,900), color:C.orange }}>
                      {Math.round((streakDist.high / streakDist.total) * 100)}%
                    </div>
                    <div style={{ ...raj(11,500), color:C.muted, marginTop:2 }}>
                      usuarios con racha de 7+ días
                    </div>
                  </div>
                  {/* Bars */}
                  {[
                    { label:"7+ días",  val:streakDist.high,   color:C.orange },
                    { label:"3–6 días", val:streakDist.medium, color:C.teal   },
                    { label:"1–2 días", val:streakDist.low,    color:C.muted  },
                  ].map(b => (
                    <div key={b.label} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ ...raj(11,600), color:C.mutedL }}>{b.label}</span>
                        <span style={{ ...raj(11,700), color:b.color }}>{b.val}</span>
                      </div>
                      <div style={{ background:`${C.navyL}44`, borderRadius:3, height:4, overflow:"hidden" }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${(b.val / streakDist.total) * 100}%` }}
                          transition={{ duration:.75, ease:"easeOut", delay:.3 }}
                          style={{ height:"100%",
                            background:`linear-gradient(90deg,${b.color}66,${b.color})`,
                            borderRadius:3 }}
                        />
                      </div>
                    </div>
                  ))}
                  <div style={{ ...raj(10,500), color:C.muted, marginTop:12, textAlign:"right" }}>
                    {streakDist.total} usuarios con racha activa
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Item 14: PERMA por clase de héroe */}
        <motion.div style={{ gridColumn:"span 8" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.5 }}>
          <Card>
            <CardHeader icon={BarChart2} title="PERMA POR CLASE DE HÉROE" color={C.purple}
              desc="Bienestar promedio segmentado por clase (requiere datos post-deploy)"/>
            <div style={{ padding:"14px 18px 20px" }}>
              {loading ? <Skel h={210}/> : permaByClassData.length === 0 ? (
                <EmptyState type="sessions"
                  message="Los nuevos registros PERMA incluirán la clase del héroe. Los datos aparecerán progresivamente."/>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={permaByClassData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.navy} opacity={.5}/>
                    <XAxis dataKey="pillar"
                      tick={{ fill:C.mutedL, fontSize:10, fontFamily:"Rajdhani", fontWeight:700 }}/>
                    <YAxis domain={[0, 10]}
                      tick={{ fill:C.muted, fontSize:9, fontFamily:"Rajdhani" }} allowDecimals={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend
                      formatter={v => <span style={{ ...raj(10,600), color:C.mutedL }}>{v}</span>}
                    />
                    {permaClasses.map((cls, i) => (
                      <Bar key={cls} dataKey={cls} name={cls}
                        fill={[C.orange,C.blue,C.purple,C.teal][i%4]}
                        radius={[3,3,0,0]} fillOpacity={.8}/>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Item 10: Actividades PERMA configurables */}
        <motion.div style={{ gridColumn:"span 12" }}
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:.35, delay:.55 }}>
          <Card>
            <CardHeader icon={Layers} title="ACTIVIDADES PERMA" color={C.teal}
              desc="Mapeo de actividades a pilares PERMA · Activa o desactiva cada tipo"
              extra={
                <span style={{ ...raj(9,700), color:C.muted,
                  background:`${C.navyL}33`, border:`1px solid ${C.navy}`,
                  padding:"3px 9px", borderRadius:20 }}>
                  {(activities || []).filter(a => a.active).length} activas
                </span>
              }
            />
            <div style={{ padding:"14px 22px 20px" }}>
              {loading || activities === undefined ? <Skel h={100}/> :
               activities === null ? (
                <EmptyState type="sessions" message="Error al cargar actividades"/>
              ) : (
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
                  gap:10,
                }}>
                  {activities.map(act => (
                    <div key={act.id}
                      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
                      style={{
                      display:"flex", alignItems:"flex-start", gap:12,
                      padding:"12px 14px",
                      background: act.active ? `${C.teal}08` : `${C.navyL}18`,
                      border:`1px solid ${act.active ? C.teal+"33" : C.navy+"44"}`,
                      borderRadius:8,
                      transition:"all .2s",
                    }}>
                      <span style={{ fontSize:18, flexShrink:0, lineHeight:1, marginTop:2 }}>
                        {act.icon || "⭐"}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ ...raj(13,700), color: act.active ? C.white : C.mutedL }}>
                            {act.label}
                          </span>
                          <span style={{ ...raj(9,700), color:C.muted,
                            background:`${C.navyL}33`, border:`1px solid ${C.navy}`,
                            padding:"1px 6px", borderRadius:20 }}>
                            +{act.xp} XP
                          </span>
                        </div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:4 }}>
                          {(act.permaTags || []).map(tag => (
                            <span key={tag} style={{
                              ...raj(8,700),
                              color:["P","E","R","M","A"].map((_,i)=>[C.rose,C.blue,C.plum,C.sage,C.honey][i])[
                                ["P","E","R","M","A"].indexOf(tag)
                              ] || C.muted,
                              background:`${C.navyL}33`,
                              border:`1px solid ${C.navy}`,
                              padding:"1px 6px", borderRadius:20,
                            }}>{tag}</span>
                          ))}
                        </div>
                        {act.description && (
                          <div style={{ ...raj(10,400), color:C.muted, lineHeight:1.5 }}>
                            {act.description}
                          </div>
                        )}
                      </div>
                      <button
                        disabled={actSaving === act.id}
                        onClick={() => patchActivity(act.id, { active: !act.active })}
                        style={{
                          ...raj(9,700),
                          flexShrink:0,
                          color: act.active ? C.teal : C.muted,
                          background: act.active ? `${C.teal}14` : `${C.navyL}33`,
                          border:`1px solid ${act.active ? C.teal+"44" : C.navy+"66"}`,
                          borderRadius:8, padding:"5px 10px",
                          cursor: actSaving === act.id ? "not-allowed" : "pointer",
                          display:"flex", alignItems:"center", gap:5,
                          opacity: actSaving === act.id ? .5 : 1,
                        }}
                      >
                        {actSaving === act.id
                          ? <Spinner color={C.teal}/>
                          : act.active
                            ? <><CheckCircle2 size={11}/> ON</>
                            : <><Circle size={11}/> OFF</>
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Privacy footer ── */}
        <div style={{ gridColumn:"span 12" }}>
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:.5 }}
            style={{
              display:"flex", gap:10, alignItems:"flex-start",
              padding:"12px 16px",
              background:`${C.purple}08`, border:`1px solid ${C.navy}`,
              borderRadius:10,
            }}
          >
            <BarChart2 size={13} color={C.muted} style={{ flexShrink:0, marginTop:2 }}/>
            <p style={{ ...raj(11,400), color:C.muted, lineHeight:1.65, margin:0 }}>
              <strong style={{ ...raj(11,700), color:C.mutedL }}>Privacidad:</strong>{" "}
              Todos los datos son anónimos y agregados. Ningún ID de usuario individual
              es expuesto en este panel. Principios GDPR de minimización de datos.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
