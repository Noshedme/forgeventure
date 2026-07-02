// src/pages/admin/AdminDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  ForgeVenture — Admin Dashboard v2.0
//  Framer Motion + datos reales backend + period selector
//  + top users leaderboard + system health + modo simple fixed
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import AdminUsuarios   from "./AdminUsuarios";
import AdminEjercicios from "./AdminEjercicios";
import AdminRutinas    from "./AdminRutinas";
import AdminMisiones   from "./AdminMisiones";
import AdminObjetos    from "./AdminObjetos";
import AdminLogros     from "./AdminLogros";
import AdminStats      from "./AdminStats";
import AdminConfig     from "./AdminConfig";
import AdminMensajes   from "./AdminMensajes";
import AdminFeedback   from "./AdminFeedback";
import AdminMente      from "./AdminMente";
import { getDashboardStats, getActivityFeed, getChartData, getWeeklyLeaderboard } from "../../services/api.js";
import { auth } from "../../firebase.js";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, Users, Dumbbell, ClipboardList,
  Target, Package, Trophy, BarChart2, Settings,
  LogOut, MessageSquare, Search, Plus, RefreshCw, Zap,
  TrendingUp, TrendingDown, Activity, Shield,
  ChevronRight, Eye, Edit2, Trash2,
  CheckCircle, ChevronLeft, Flame, Clock,
  Award, Calendar, ArrowRight, Send, Inbox, Brain,
  Bell, X as XIcon, UserPlus, AlertTriangle,
} from "lucide-react";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";

// ── Fonts ──────────────────────────────────────────────────────
if (!document.getElementById("fv-adm-fonts")) {
  const l = document.createElement("link");
  l.id = "fv-adm-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Manrope:wght@300;400;500;600;700;800;900&family=Press+Start+2P&display=swap";
  document.head.appendChild(l);
}

// ── Framer Motion variants ─────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];
const FV = {
  up:          { hidden:{ opacity:0, y:20 },     show:{ opacity:1, y:0,    transition:{ duration:0.5, ease } } },
  left:        { hidden:{ opacity:0, x:-20 },    show:{ opacity:1, x:0,    transition:{ duration:0.5, ease } } },
  scale:       { hidden:{ opacity:0, scale:.92 },show:{ opacity:1, scale:1, transition:{ duration:0.45, ease } } },
  stagger:     { hidden:{},                       show:{ transition:{ staggerChildren:0.07, delayChildren:0.05 } } },
  staggerFast: { hidden:{},                       show:{ transition:{ staggerChildren:0.04 } } },
};

// ── CSS global ─────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Manrope:wght@300;400;500;600;700;800;900&family=Press+Start+2P&display=swap');

  /* ── Aurora bg blobs (mirror of Home) ── */
  @keyframes adm-a1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(120px,-60px) scale(1.12)} 66%{transform:translate(-80px,90px) scale(0.95)} }
  @keyframes adm-a2  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-100px,80px) scale(0.9)} 66%{transform:translate(60px,-50px) scale(1.08)} }
  @keyframes adm-a3  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(80px,-100px) scale(1.1)} 66%{transform:translate(-100px,40px) scale(0.95)} }

  @keyframes adm-glow      { 0%,100%{text-shadow:0 0 16px #C9184A,0 0 32px #C9184A44} 50%{text-shadow:0 0 28px #C9184A,0 0 56px #C9184A77} }
  @keyframes adm-pulse     { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes adm-blink     { 0%,100%{opacity:1} 45%,55%{opacity:0} }
  @keyframes adm-scan      { 0%{top:-2px;opacity:.5} 70%{opacity:.25} 100%{top:100%;opacity:0} }
  @keyframes adm-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes adm-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes adm-ping      { 0%{transform:scale(1);opacity:.9} 80%,100%{transform:scale(2.4);opacity:0} }
  @keyframes adm-shimmer   { 0%{left:-100%} 100%{left:200%} }
  @keyframes adm-slideL    { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
  @keyframes adm-barFill   { from{width:0} to{width:var(--bw)} }
  @keyframes adm-progress  { from{width:0%} to{width:var(--pw,100%)} }
  @keyframes adm-gradFlow  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes adm-notifIn   { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { height:100%; overflow:hidden; }
  body { background:#0B0510; font-family:'Manrope',sans-serif; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:#0F0614; }
  ::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#C9184A88,#C9184A44); border-radius:2px; }
  ::selection { background:#C9184A44; color:#F5E6EC; }

  /* ── Sidebar nav items ── */
  .adm-nav { transition:all .2s; cursor:pointer; position:relative; overflow:hidden; }
  .adm-nav:hover { background:rgba(212,165,116,0.07) !important; border-color:rgba(212,165,116,0.12) !important; }
  .adm-nav:hover .nav-shimmer { transform:translateX(100%) !important; }
  .adm-nav:hover svg { filter:brightness(1.2); }

  /* ── KPI card ── */
  .adm-kpi { position:relative; overflow:hidden; transition:transform .3s cubic-bezier(0.16,1,0.3,1), box-shadow .3s ease; }
  .adm-kpi:hover { transform:translateY(-4px); }
  .adm-kpi .shimmer { position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent); pointer-events:none; }
  .adm-kpi:hover .shimmer { animation:adm-shimmer .7s ease; }

  /* ── Glass card ── */
  .adm-glass {
    background: rgba(24,10,28,0.7) !important;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(201,24,74,0.10) !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(66,146,200,0.06) !important;
  }
  .adm-glass:hover {
    border-color: rgba(201,24,74,0.18) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,24,74,0.08) !important;
  }

  /* ── Gradient title text ── */
  .adm-title-text {
    background: linear-gradient(90deg, #C9184A 0%, #E8294A 40%, #F5E6EC 65%, #C9184A 100%);
    background-size: 300% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: adm-gradFlow 5s ease infinite;
  }

  /* ── Stat number glow ── */
  .adm-stat-num {
    font-family:'JetBrains Mono',monospace; font-weight:700;
    background: linear-gradient(135deg, #C9184A, #FFC857, #C9184A);
    background-size: 200% 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: adm-gradFlow 4s ease infinite;
  }

  /* ── Section pill ── */
  .adm-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:2px 10px; border-radius:100px;
    font-family:'Manrope',sans-serif; font-size:10px; font-weight:600;
    letter-spacing:0.08em; text-transform:uppercase;
  }
  .adm-pill-blue   { border:1px solid rgba(76,201,240,0.30); background:rgba(76,201,240,0.08); color:#4CC9F0; }
  .adm-pill-red    { border:1px solid rgba(201,24,74,0.30); background:rgba(201,24,74,0.08); color:#C9184A; }
  .adm-pill-gold   { border:1px solid rgba(255,200,87,0.30); background:rgba(255,200,87,0.08); color:#FFC857; }
  .adm-pill-green  { border:1px solid rgba(34,197,94,0.30); background:rgba(34,197,94,0.08); color:#22C55E; }

  /* ── Table row ── */
  .adm-row { transition:background .15s; }
  .adm-row:hover { background:rgba(201,24,74,0.05) !important; }
  .adm-row:hover .row-arrow { opacity:1 !important; transform:translateX(4px) !important; }
  .row-arrow { opacity:0; transform:translateX(0); transition:all .2s; }

  /* ── Buttons ── */
  .adm-btn { transition:all .22s; cursor:pointer; position:relative; overflow:hidden; }
  .adm-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
  .adm-icon-btn { transition:all .2s; cursor:pointer; }
  .adm-icon-btn:hover { transform:scale(1.12); }
  .adm-action { transition:all .25s cubic-bezier(0.16,1,0.3,1); cursor:pointer; position:relative; overflow:hidden; }
  .adm-action:hover { transform:translateY(-5px) !important; }

  /* ── Period tabs ── */
  .period-tab { transition:all .2s; cursor:pointer; }
  .period-tab:hover { color:#C9184A !important; border-color:#C9184A55 !important; }

  /* ── Recharts font override ── */
  .recharts-tooltip-wrapper { font-family:'Manrope',sans-serif !important; }
  .recharts-text { font-family:'Manrope',sans-serif !important; }

  /* ── Dashboard skeleton shimmer ── */
  @keyframes d-skel-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .d-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}55 50%,${C.card} 75%); background-size:400px 100%; animation:d-skel-shimmer 1.5s infinite linear; }
`;

// ── Mock fallback data ─────────────────────────────────────────
const MOCK_CHART_DATA = [
  {dia:"Lun",users:12,xp:4400,sesiones:8},{dia:"Mar",users:19,xp:6800,sesiones:14},
  {dia:"Mié",users:8,xp:3200,sesiones:6},{dia:"Jue",users:27,xp:9100,sesiones:22},
  {dia:"Vie",users:34,xp:11200,sesiones:28},{dia:"Sáb",users:41,xp:14800,sesiones:36},
  {dia:"Dom",users:22,xp:7600,sesiones:19},
];
const MOCK_EXERCISES = [
  {name:"Flexiones",sesiones:148},{name:"Sentadillas",sesiones:132},{name:"Cardio",sesiones:118},
  {name:"Plancha",sesiones:89},{name:"Dominadas",sesiones:67},
];
const MOCK_RECENT_USERS = [
  {id:"1",name:"Aragorn_Dev",email:"aragorn@fv.com",cls:"GUERRERO",lvl:47,xp:128400,streak:42,status:"active"},
  {id:"2",name:"Katniss_2024",email:"katniss@fv.com",cls:"ARQUERO",lvl:33,xp:82100,streak:18,status:"active"},
  {id:"3",name:"Gandalf_Pro",email:"gandalf@fv.com",cls:"MAGO",lvl:28,xp:61400,streak:7,status:"inactive"},
  {id:"4",name:"LegolasXD",email:"legolas@fv.com",cls:"ARQUERO",lvl:22,xp:44200,streak:0,status:"inactive"},
  {id:"5",name:"ThorFit",email:"thor@fv.com",cls:"GUERRERO",lvl:15,xp:28800,streak:3,status:"active"},
];

// ── Nav items ──────────────────────────────────────────────────
const NAV_ITEMS = [
  {id:"dashboard",  icon:LayoutDashboard,label:"Dashboard",    badge:null,  color:C.orange},
  {id:"usuarios",   icon:Users,          label:"Usuarios",     badge:"163", color:C.blue  },
  {id:"ejercicios", icon:Dumbbell,       label:"Ejercicios",   badge:"50",  color:C.orange},
  {id:"rutinas",    icon:ClipboardList,  label:"Rutinas",      badge:"24",  color:C.teal  },
  {id:"misiones",   icon:Target,         label:"Misiones",     badge:"12",  color:C.gold  },
  {id:"objetos",    icon:Package,        label:"Objetos",      badge:"38",  color:C.purple},
  {id:"logros",     icon:Trophy,         label:"Logros",       badge:"30",  color:C.gold  },
  {id:"stats",      icon:BarChart2,      label:"Estadísticas", badge:null,  color:C.blue  },
  {id:"mensajes",   icon:MessageSquare,  label:"Mensajes",     badge:null,  color:C.teal  },
  {id:"feedback",   icon:Inbox,          label:"Feedback",     badge:null,  color:C.orange},
  {id:"mente",      icon:Brain,          label:"Zona Mente",   badge:"NEW", color:C.purple},
  {id:"config",     icon:Settings,       label:"Config",       badge:null,  color:C.muted },
];
const CLS_COLOR = {GUERRERO:C.orange, ARQUERO:C.blue, MAGO:C.purple};
const CLS_ICON  = {GUERRERO:"⚔️", ARQUERO:"🏃", MAGO:"🧘"};
const RANK_MEDALS = ["🥇","🥈","🥉"];

// ── Live clock ─────────────────────────────────────────────────
function useClock() {
  const [t,setT] = useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setT(new Date()),1000); return()=>clearInterval(id); },[]);
  return t;
}

// ── Animated counter ───────────────────────────────────────────
function Counter({target, duration=1400, prefix="", suffix=""}) {
  const [val,setVal] = useState(0);
  const raw = parseInt(String(target).replace(/\D/g,""))||0;
  useEffect(()=>{
    let start=null;
    const step=(ts)=>{
      if(!start) start=ts;
      const p=Math.min((ts-start)/duration,1);
      const ease=1-Math.pow(1-p,3);
      setVal(Math.floor(ease*raw));
      if(p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },[raw,duration]);
  const n = val >= 1000000 ? (val/1000000).toFixed(1)+"M"
           : val >= 10000  ? (val/1000).toFixed(1)+"K"
           : val.toLocaleString();
  return <span>{prefix}{n}{suffix}</span>;
}

// ── Aurora background — espejo exacto del Home ────────────────
function AdminAurora() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none",
      background:`radial-gradient(ellipse at 0% 0%, ${C.bg2} 0%, transparent 55%),
                 radial-gradient(ellipse at 100% 100%, ${C.glow}55 0%, transparent 60%),
                 linear-gradient(180deg, ${C.bg}, ${C.side})`,
    }}>
      {/* blob 1 — crimson accent */}
      <div style={{position:"absolute",width:580,height:580,left:"15%",top:"10%",borderRadius:"50%",
        filter:"blur(60px)",opacity:0.3,willChange:"transform",animation:"adm-a1 28s ease-in-out infinite",
        background:`radial-gradient(circle, ${C.orange}44 0%, transparent 70%)`}}/>
      {/* blob 2 — deep glow */}
      <div style={{position:"absolute",width:500,height:500,right:"10%",top:"30%",borderRadius:"50%",
        filter:"blur(70px)",opacity:0.25,willChange:"transform",animation:"adm-a2 34s ease-in-out infinite",
        background:`radial-gradient(circle, ${C.glow}66 0%, transparent 70%)`}}/>
      {/* blob 3 — gold warmth */}
      <div style={{position:"absolute",width:420,height:420,left:"35%",bottom:"0%",borderRadius:"50%",
        filter:"blur(60px)",opacity:0.2,willChange:"transform",animation:"adm-a3 40s ease-in-out infinite",
        background:`radial-gradient(circle, ${C.gold}28 0%, transparent 70%)`}}/>
      {/* pixel grid */}
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`linear-gradient(${C.navy}22 1px, transparent 1px), linear-gradient(90deg, ${C.navy}22 1px, transparent 1px)`,
        backgroundSize:"56px 56px",
        maskImage:"radial-gradient(ellipse at center, #000 30%, transparent 80%)",
        WebkitMaskImage:"radial-gradient(ellipse at center, #000 30%, transparent 80%)",
      }}/>
      {/* noise texture */}
      <div style={{
        position:"absolute",inset:0,opacity:0.05,mixBlendMode:"overlay",
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}/>
      {/* vignette */}
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 50%, transparent 40%, ${C.bg}cc 100%)`}}/>
    </div>
  );
}

// ── Scan line (kept for sidebar) ──────────────────────────────
function ScanLine({speed="10s",color=C.orange,opacity=0.18}) {
  return (
    <div style={{position:"absolute",left:0,right:0,height:1,
      background:`linear-gradient(90deg,transparent,${color},transparent)`,
      opacity,animation:`adm-scan ${speed} linear infinite`,
      pointerEvents:"none",zIndex:1}}/>
  );
}

// ── Corner decoration ──────────────────────────────────────────
function CornerDeco({color=C.orange,size=12,pos="tl"}) {
  const top=pos.includes("t")?0:undefined, bottom=pos.includes("b")?0:undefined;
  const left=pos.includes("l")?0:undefined, right=pos.includes("r")?0:undefined;
  return (
    <div style={{position:"absolute",top,bottom,left,right,pointerEvents:"none"}}>
      <div style={{width:size,height:2,background:color,opacity:.7,[pos.includes("r")?"marginLeft":"marginRight"]:"auto"}}/>
      <div style={{width:2,height:size,background:color,opacity:.7,[pos.includes("r")?"marginLeft":"marginRight"]:"auto"}}/>
    </div>
  );
}

// ── Chart data normalizers — prevent crashes on bad API shapes ─
function normalizeEvolutionData(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  try {
    const out = raw.map(item => ({
      dia:      String(item?.dia ?? item?.date ?? "?"),
      usuarios: Math.max(0, Number(item?.usuarios ?? item?.users ?? 0) || 0),
      sesiones: Math.max(0, Number(item?.sesiones ?? item?.sessions ?? 0) || 0),
      xp:       Math.max(0, Number(item?.xp ?? 0) || 0),
    }));
    return out.length > 0 ? out : null;
  } catch { return null; }
}

function normalizeExercisesData(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  try {
    const out = raw
      .filter(item => item != null)
      .map(item => ({
        name:     String(item?.name ?? item?.nombre ?? "Ejercicio"),
        sesiones: Math.max(0, Number(item?.sesiones ?? item?.sessions ?? 0) || 0),
      }));
    return out.length > 0 ? out : null;
  } catch { return null; }
}

// Sort activity feed newest-first by rawTimestamp
function sortFeed(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  return [...items].sort((a, b) => {
    if (!a.rawTimestamp && !b.rawTimestamp) return 0;
    if (!a.rawTimestamp) return 1;
    if (!b.rawTimestamp) return -1;
    return b.rawTimestamp.localeCompare(a.rawTimestamp);
  });
}

// ── Mobile-native bar chart (replaces Recharts on mobile) ─────
function MobileBarChart({ data, bars, height=100 }) {
  // bars: [{key, color, label}]
  if (!data?.length) return (
    <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",
      ...raj(11,500),color:C.muted}}>Sin datos para este período</div>
  );
  const maxVal = Math.max(...data.flatMap(d => bars.map(b => d[b.key] || 0)), 1);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height,paddingBottom:2}}>
        {data.map((item, i) => (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,height:"100%"}}>
            <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:1,width:"100%",justifyContent:"center"}}>
              {bars.map(b => {
                const pct = Math.round(((item[b.key] || 0) / maxVal) * 100);
                return (
                  <motion.div key={b.key}
                    initial={{height:0}} animate={{height:`${pct}%`}}
                    transition={{duration:.7,delay:i*.05,ease:"easeOut"}}
                    style={{flex:1,background:`linear-gradient(180deg,${b.color},${b.color}66)`,
                      boxShadow:pct>0?`0 0 5px ${b.color}55`:"none",
                      minHeight:pct>0?2:0,maxWidth:18}}
                  />
                );
              })}
            </div>
            <span style={{...raj(8,500),color:C.muted,whiteSpace:"nowrap",fontSize:8}}>{item.dia}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        {bars.map(b=>(
          <div key={b.key} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:2,background:b.color}}/>
            <span style={{...raj(10,500),color:C.muted}}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mobile horizontal bars for top exercises ──────────────────
function MobileExerciseBars({ data }) {
  if (!data?.length) return (
    <div style={{...raj(11,500),color:C.muted,padding:"20px 0",textAlign:"center"}}>Sin ejercicios registrados</div>
  );
  const max = Math.max(...data.map(d => d.sesiones || 0), 1);
  const colors = [C.orange, C.blue, C.teal, C.purple, C.green, C.red, C.gold, C.mutedL];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {data.slice(0,6).map((ex, i) => {
        const pct = Math.round(((ex.sesiones || 0) / max) * 100);
        const color = colors[i % colors.length];
        return (
          <div key={i}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{...raj(11,600),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{ex.name}</span>
              <span style={{...raj(10,600),color,flexShrink:0}}>{ex.sesiones}</span>
            </div>
            <div style={{height:5,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden"}}>
              <motion.div
                initial={{width:0}} animate={{width:`${pct}%`}}
                transition={{duration:.8,delay:i*.06,ease:"easeOut"}}
                style={{height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,
                  boxShadow:`0 0 4px ${color}55`}}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Custom chart tooltip ───────────────────────────────────────
function FvTooltip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.panel,border:`1px solid ${C.navyL}`,padding:"10px 14px",
      borderRadius:10,
      boxShadow:`0 8px 24px rgba(0,0,0,.5),0 0 0 1px ${C.orange}22`}}>
      <div style={{...raj(13,700),color:C.white,marginBottom:6,borderBottom:`1px solid ${C.navy}`,paddingBottom:5}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,...raj(12,600),color:p.color,marginBottom:2}}>
          <div style={{width:8,height:8,background:p.color,boxShadow:`0 0 4px ${p.color}`}}/>
          {p.name}: <span style={{fontWeight:700}}>{typeof p.value==="number"?p.value.toLocaleString():p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────
function SkeletonBlock({h=80,style={}}) {
  return (
    <div style={{height:h,background:`linear-gradient(90deg,${C.card},${C.panel},${C.card})`,
      backgroundSize:"200% 100%",animation:"adm-shimmer 1.4s ease-in-out infinite",...style}}/>
  );
}

function SkeletonDashboard() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="d-skel" style={{borderRadius:14,height:100,animationDelay:`${i*.08}s`}}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
        <div className="d-skel" style={{borderRadius:14,height:300}}/>
        <div className="d-skel" style={{borderRadius:14,height:300,animationDelay:".1s"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {Array.from({length:3}).map((_,i)=>(
          <div key={i} className="d-skel" style={{borderRadius:14,height:180,animationDelay:`${i*.09}s`}}/>
        ))}
      </div>
    </div>
  );
}

// ── Period selector ────────────────────────────────────────────
function PeriodSelector({period,setPeriod}) {
  const tabs=[{id:"7d",label:"7 días"},{id:"30d",label:"30 días"},{id:"90d",label:"90 días"}];
  return (
    <div style={{display:"flex",gap:4,borderRadius:12,padding:"10px 12px"}}>
      {tabs.map(t=>{
        const on=period===t.id;
        return (
          <button key={t.id} className="period-tab"
            onClick={()=>setPeriod(t.id)}
            style={{
              ...raj(11,on?700:500),
              color:on?C.orange:C.muted,
              background:on?`${C.orange}14`:"transparent",
              border:`1px solid ${on?C.orange:C.navy}`,
              borderRadius:20,
              padding:"4px 12px",cursor:"pointer",
              boxShadow:on?`0 0 10px ${C.orange}33`:"none",
              transition:"all .2s",
            }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// KPI CARD v2 — Framer Motion
// ══════════════════════════════════════════════════════════════
function KpiCard({icon:Icon,label,value,sub,color,trend,dataLoaded=true}) {
  const isNeg = trend<0;
  const isEmpty = value == null || value === undefined;
  return (
    <motion.div
      className="adm-kpi"
      variants={FV.scale}
      whileHover={{ y:-5, boxShadow:`0 16px 40px rgba(0,0,0,.55), 0 0 0 1px ${color}44` }}
      style={{
        background:`linear-gradient(135deg,${C.card}CC 0%,${C.panel}CC 100%)`,
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        border:`1px solid ${color}2A`,
        borderRadius:14,
        padding:"22px 20px",
        boxShadow:`0 4px 24px rgba(0,0,0,.35),inset 0 1px 0 ${color}0D`,
      }}
    >
      <div className="shimmer"/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${color}99,${color},${color}99,transparent)`}}/>
      <CornerDeco color={color} size={10} pos="tl"/>
      <CornerDeco color={color} size={10} pos="br"/>
      <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",
        background:color,filter:"blur(55px)",opacity:.07,pointerEvents:"none",animation:"adm-float 4s ease-in-out infinite"}}/>

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,position:"relative",zIndex:1}}>
        <div style={{background:`${color}18`,border:`1px solid ${color}33`,padding:"10px",display:"flex",
          alignItems:"center",justifyContent:"center",boxShadow:`0 0 14px ${color}22`,position:"relative"}}>
          <Icon size={20} color={color}/>
          <div style={{position:"absolute",inset:0,background:color,filter:"blur(8px)",opacity:.15}}/>
        </div>
        {trend!==undefined&&dataLoaded&&!isEmpty&&(
          <div style={{display:"flex",alignItems:"center",gap:4,...raj(12,700),
            color:isNeg?C.red:C.green,background:isNeg?`${C.red}14`:`${C.green}14`,
            border:`1px solid ${isNeg?C.red:C.green}33`,borderRadius:20,padding:"3px 9px"}}>
            {isNeg?<TrendingDown size={12}/>:<TrendingUp size={12}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{...orb("clamp(20px,2vw,26px)",900),color,marginBottom:5,
        textShadow:`0 0 20px ${color}55`,position:"relative",zIndex:1}}>
        {!dataLoaded
          ? <div style={{width:60,height:24,background:C.navy,animation:"adm-shimmer 1.4s ease-in-out infinite",opacity:.5}}/>
          : isEmpty
            ? <span style={{color:C.muted,fontSize:"clamp(16px,1.6vw,20px)"}}>—</span>
            : <Counter target={value}/>
        }
      </div>
      <div style={{...raj(13,700),color:C.white,marginBottom:3,position:"relative",zIndex:1}}>{label}</div>
      <div style={{...raj(11,500),color:C.muted,position:"relative",zIndex:1}}>
        {!dataLoaded ? <span style={{opacity:.4}}>Cargando…</span> : sub}
      </div>
    </motion.div>
  );
}

// ── Nav groups ─────────────────────────────────────────────────
const NAV_GROUPS = [
  { label:"PRINCIPAL",    items:["dashboard"] },
  { label:"GESTIÓN",      items:["usuarios","ejercicios","rutinas","misiones","objetos","logros"] },
  { label:"ANÁLISIS",     items:["stats"] },
  { label:"COMUNICACIÓN", items:["mensajes","feedback","mente"] },
  { label:"SISTEMA",      items:["config"] },
];

// ══════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════
function Sidebar({active,setActive,onLogout,collapsed,setCollapsed,adminUser,navBadges={}}) {
  const W = collapsed ? 68 : 244;
  const adminInitial = ((adminUser?.displayName || adminUser?.email || "A")[0] || "A").toUpperCase();

  return (
    <motion.div
      animate={{ width: W }}
      transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
      style={{
        width:W, flexShrink:0,
        background:"rgba(8,11,20,0.94)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderRight:`1px solid ${C.navy}`,
        display:"flex", flexDirection:"column", height:"100vh",
        position:"relative", zIndex:10, overflow:"hidden",
        boxShadow:"4px 0 40px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.03)",
      }}>

      {/* Glowing right-edge gradient */}
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:1,
        background:`linear-gradient(180deg,transparent 0%,${C.orange}55 35%,${C.orange}77 55%,${C.orange}55 75%,transparent 100%)`,
        pointerEvents:"none"}}/>

      {/* Ambient top-left glow orb */}
      <div style={{position:"absolute",top:-60,left:-40,width:220,height:180,
        background:`radial-gradient(ellipse,${C.orange}16 0%,transparent 70%)`,
        pointerEvents:"none"}}/>

      <ScanLine speed="14s" color={C.orange} opacity={0.10}/>

      {/* ══ LOGO SECTION ══ */}
      <div style={{
        padding: collapsed ? "18px 8px 14px" : "22px 16px 16px",
        borderBottom:`1px solid ${C.navy}44`,
        flexShrink:0, position:"relative", zIndex:2,
      }}>
        {collapsed ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            {/* Icon mark */}
            <div style={{
              width:38, height:38, borderRadius:10,
              background:`linear-gradient(135deg,${C.orange}28,${C.gold}14)`,
              border:`1px solid ${C.orange}44`,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 0 18px ${C.orange}22,inset 0 1px 0 rgba(255,255,255,0.07)`,
            }}>
              <span style={{fontSize:19,filter:`drop-shadow(0 0 6px ${C.orange}88)`}}>⚔️</span>
            </div>
            {/* Collapse toggle */}
            <button onClick={()=>setCollapsed(v=>!v)}
              style={{background:"transparent",border:`1px solid ${C.navy}`,borderRadius:6,
                color:C.muted,cursor:"pointer",display:"flex",padding:"4px 5px",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;e.currentTarget.style.color=C.orange;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.muted;}}>
              <ChevronRight size={12}/>
            </button>
          </div>
        ) : (
          <>
            {/* Brand row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:11}}>
                {/* Icon mark */}
                <div style={{
                  width:42, height:42, borderRadius:11,
                  background:`linear-gradient(135deg,${C.orange}28,${C.gold}14)`,
                  border:`1px solid ${C.orange}44`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:`0 0 20px ${C.orange}22,inset 0 1px 0 rgba(255,255,255,0.07)`,
                  flexShrink:0,
                }}>
                  <span style={{fontSize:21,filter:`drop-shadow(0 0 8px ${C.orange}88)`}}>⚔️</span>
                </div>
                {/* Wordmark */}
                <div>
                  <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                    <span className="adm-title-text" style={{...orb(13,900),letterSpacing:".07em"}}>FORGE</span>
                    <span style={{...orb(13,900),color:C.white,letterSpacing:".07em"}}>VENTURE</span>
                  </div>
                  <div style={{...raj(9,600),color:C.muted,letterSpacing:".15em",marginTop:1}}>
                    ADMIN PANEL
                  </div>
                </div>
              </div>
              {/* Collapse toggle */}
              <button onClick={()=>setCollapsed(v=>!v)}
                style={{background:"transparent",border:`1px solid ${C.navy}`,borderRadius:7,
                  color:C.muted,cursor:"pointer",display:"flex",padding:5,transition:"all .2s",flexShrink:0}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;e.currentTarget.style.color=C.orange;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.muted;}}>
                <ChevronLeft size={12}/>
              </button>
            </div>
            {/* Status pill */}
            <div style={{
              display:"inline-flex",alignItems:"center",gap:6,
              background:`${C.navy}55`,border:`1px solid ${C.navy}88`,
              borderRadius:6,padding:"4px 10px",
            }}>
              <div style={{position:"relative",width:7,height:7,flexShrink:0}}>
                <div style={{width:7,height:7,background:C.green,borderRadius:"50%",boxShadow:`0 0 6px ${C.green}`}}/>
                <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"adm-ping 2s infinite",opacity:.5}}/>
              </div>
              <span style={{...raj(9,600),color:C.muted,letterSpacing:".1em"}}>v2.0 · SISTEMA ACTIVO</span>
            </div>
          </>
        )}
      </div>

      {/* ══ NAV GROUPS ══ */}
      <nav style={{flex:1,padding:"10px 8px",overflowY:"auto",position:"relative",zIndex:2,
        scrollbarWidth:"none",msOverflowStyle:"none"}}>
        <style>{`nav::-webkit-scrollbar{display:none}`}</style>
        {NAV_GROUPS.map((group, gi) => {
          const groupItems = NAV_ITEMS.filter(i => group.items.includes(i.id));
          return (
            <div key={gi} style={{marginBottom: collapsed ? 2 : 4}}>
              {/* Group label */}
              {!collapsed ? (
                <div style={{
                  ...raj(9,700),color:`${C.navy}CC`,letterSpacing:".16em",
                  padding:"8px 8px 3px",textTransform:"uppercase",
                  borderBottom:`1px solid ${C.navy}33`,marginBottom:3,
                }}>
                  {group.label}
                </div>
              ) : (
                gi > 0 && <div style={{height:1,background:`${C.navy}44`,margin:"5px 10px 6px"}}/>
              )}

              {groupItems.map((item, ii) => {
                const isActive = active === item.id;
                const badge = navBadges[item.id] ?? item.badge;
                return (
                  <div key={item.id}
                    className="adm-nav"
                    onClick={() => setActive(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display:"flex", alignItems:"center",
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? "10px 0" : "9px 10px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius:8,
                      background: isActive ? `${item.color}12` : "transparent",
                      border:`1px solid ${isActive ? item.color+"33" : "transparent"}`,
                      marginBottom:2, position:"relative", overflow:"hidden",
                      animation:`adm-slideL .35s ease ${(gi*6+ii)*.04}s both`,
                      transition:"all .2s",
                    }}>

                    {/* Active left accent bar */}
                    {isActive && !collapsed && (
                      <div style={{
                        position:"absolute",left:-8,top:6,bottom:6,width:3,
                        background:item.color,borderRadius:"0 3px 3px 0",
                        boxShadow:`0 0 10px ${item.color}88`,
                      }}/>
                    )}

                    {/* Hover shimmer */}
                    <div style={{
                      position:"absolute",inset:0,
                      background:`linear-gradient(90deg,transparent,${item.color}05,transparent)`,
                      transform:"translateX(-100%)",
                      transition:"transform .3s",
                      pointerEvents:"none",
                    }} className="nav-shimmer"/>

                    <item.icon size={15}
                      color={isActive ? item.color : C.muted}
                      style={{
                        filter:isActive?`drop-shadow(0 0 5px ${item.color}88)`:"none",
                        flexShrink:0, transition:"all .2s",
                      }}/>

                    {!collapsed && (
                      <>
                        <span style={{
                          ...raj(12, isActive ? 700 : 500),
                          color: isActive ? item.color : C.mutedL,
                          flex:1, whiteSpace:"nowrap", transition:"color .2s",
                        }}>
                          {item.label}
                        </span>
                        {badge && (
                          <span style={{
                            ...raj(9,700), fontSize:9,
                            background: isActive ? item.color : `${C.navyL}66`,
                            color: isActive ? C.bg : C.muted,
                            padding:"1px 7px", borderRadius:20,
                            boxShadow: isActive ? `0 0 8px ${item.color}44` : "none",
                            transition:"all .2s",
                          }}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Collapsed badge dot */}
                    {collapsed && badge && (
                      <div style={{
                        position:"absolute",top:7,right:8,width:6,height:6,
                        background:item.color,borderRadius:"50%",
                        animation:"adm-pulse 1.5s infinite",
                      }}/>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ══ ADMIN PROFILE + LOGOUT ══ */}
      <div style={{
        padding: collapsed ? "12px 8px" : "12px 10px",
        borderTop:`1px solid ${C.navy}44`,
        flexShrink:0, position:"relative", zIndex:2,
      }}>
        {!collapsed ? (
          <>
            {/* Profile card */}
            <div style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"9px 10px",marginBottom:8,
              background:`${C.navy}22`,
              border:`1px solid ${C.navy}55`,
              borderRadius:8,
            }}>
              {/* Avatar with initials */}
              <div style={{
                width:34,height:34,borderRadius:8,flexShrink:0,
                background:`linear-gradient(135deg,${C.orange}33,${C.gold}18)`,
                border:`1px solid ${C.orange}44`,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:`0 0 12px ${C.orange}18`,
                ...orb(14,900),color:C.orange,
              }}>
                {adminInitial}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...raj(12,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {adminUser?.displayName || adminUser?.email?.split("@")[0] || "Administrador"}
                </div>
                <div style={{...raj(10,500),color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {adminUser?.email || "admin@forgeventure.com"}
                </div>
              </div>
              {/* Online indicator */}
              <div style={{position:"relative",flexShrink:0,width:9,height:9}}>
                <div style={{width:9,height:9,background:C.green,borderRadius:"50%",boxShadow:`0 0 7px ${C.green}`}}/>
                <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"adm-ping 2s infinite",opacity:.5}}/>
              </div>
            </div>
            {/* Logout */}
            <button className="adm-btn" onClick={onLogout}
              style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                background:"transparent",border:`1px solid ${C.navy}55`,borderRadius:8,
                color:C.muted,padding:"8px 12px",...raj(11,600),letterSpacing:".07em",cursor:"pointer",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=`${C.red}55`;e.currentTarget.style.color=C.red;e.currentTarget.style.background=`${C.red}0A`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.navy}55`;e.currentTarget.style.color=C.muted;e.currentTarget.style.background="transparent";}}>
              <LogOut size={13}/> CERRAR SESIÓN
            </button>
          </>
        ) : (
          <>
            {/* Collapsed avatar */}
            <div style={{
              width:36,height:36,borderRadius:8,margin:"0 auto 8px",
              background:`linear-gradient(135deg,${C.orange}33,${C.gold}18)`,
              border:`1px solid ${C.orange}44`,
              display:"flex",alignItems:"center",justifyContent:"center",
              ...orb(14,900),color:C.orange,
              boxShadow:`0 0 12px ${C.orange}18`,
            }}>
              {adminInitial}
            </div>
            <button className="adm-btn" onClick={onLogout}
              style={{
                width:"100%",display:"flex",alignItems:"center",justifyContent:"center",
                background:"transparent",border:`1px solid ${C.navy}55`,borderRadius:7,
                color:C.muted,padding:"7px 0",cursor:"pointer",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=`${C.red}55`;e.currentTarget.style.color=C.red;e.currentTarget.style.background=`${C.red}0A`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.navy}55`;e.currentTarget.style.color=C.muted;e.currentTarget.style.background="transparent";}}>
              <LogOut size={13}/>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// TOPBAR
// ══════════════════════════════════════════════════════════════
function TopBar({active,clock,fx,setFx,adminUser,adminNotifs=[]}) {
  const sec = NAV_ITEMS.find(n=>n.id===active);
  const SectionIcon = sec?.icon||LayoutDashboard;
  const color = sec?.color||C.orange;
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = adminNotifs.filter(n=>!n.read).length;
  return (
    <div style={{height:56,flexShrink:0,
      background:`${C.side}CC`,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
      borderBottom:`1px solid ${C.navy}88`,
      display:"flex",alignItems:"center",padding:"0 20px",gap:14,
      position:"relative",zIndex:10,overflow:"hidden"}}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${color}55,transparent)`}}/>

      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
        <SectionIcon size={15} color={color} style={{filter:`drop-shadow(0 0 4px ${color}66)`,flexShrink:0}}/>
        <span style={{...orb(12,700),color:C.white,letterSpacing:".05em",whiteSpace:"nowrap"}}>{sec?.label||"Dashboard"}</span>
        <ChevronRight size={13} color={C.muted}/>
        <span style={{...raj(12,500),color:C.muted,whiteSpace:"nowrap"}}>Panel de control</span>
      </div>

      <div style={{position:"relative",flex:"0 0 220px"}}>
        <Search size={12} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
        <input placeholder="Buscar..."
          style={{background:C.panel,border:`1px solid ${C.navy}`,color:C.white,
            borderRadius:6,
            padding:"7px 12px 7px 28px",...raj(12,500),width:"100%",outline:"none",transition:"all .2s"}}
          onFocus={e=>{e.target.style.borderColor=C.orange;e.target.style.boxShadow=`0 0 0 2px ${C.orange}22`;}}
          onBlur={e=>{e.target.style.borderColor=C.navy;e.target.style.boxShadow="none";}}/>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:6,background:`${C.green}10`,
        border:`1px solid ${C.green}33`,padding:"5px 10px",flexShrink:0}}>
        <div style={{width:6,height:6,background:C.green,borderRadius:"50%",animation:"adm-blink 1.2s ease-in-out infinite"}}/>
        <span style={{...raj(10,700),color:C.green,letterSpacing:".1em"}}>EN VIVO</span>
      </div>

      <button onClick={()=>setFx(v=>!v)}
        style={{display:"flex",alignItems:"center",gap:7,
          background:fx?`${C.orange}14`:`${C.navy}44`,
          border:`1px solid ${fx?C.orange:C.navy}`,
          borderRadius:8,
          padding:"6px 12px",color:fx?C.orange:C.muted,
          ...raj(11,700),flexShrink:0,boxShadow:fx?`0 0 10px ${C.orange}22`:"none",
          cursor:"pointer",transition:"all .2s"}}>
        <span style={{fontSize:13}}>{fx?"✦":"◇"}</span>
        {fx?"FX ON":"FX OFF"}
      </button>

      {/* Bell notifications */}
      <div style={{position:"relative",flexShrink:0}}>
        <button onClick={()=>setShowNotifs(v=>!v)}
          style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
            background:showNotifs?`${C.orange}18`:`${C.navy}44`,
            border:`1px solid ${showNotifs?C.orange:C.navy}`,padding:"7px",cursor:"pointer",
            borderRadius:8,
            transition:"all .2s"}}>
          <Bell size={14} color={showNotifs?C.orange:C.muted}/>
          {unread>0&&(
            <span style={{position:"absolute",top:-4,right:-4,
              background:C.red,color:C.white,borderRadius:20,
              width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",
              ...raj(8,800),border:`2px solid ${C.side}`}}>
              {unread>9?"9+":unread}
            </span>
          )}
        </button>
        {/* Dropdown */}
        {showNotifs&&(
          <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:320,zIndex:200,
            background:C.card,border:`1px solid ${C.navy}`,
            borderRadius:16,
            boxShadow:`0 16px 48px rgba(0,0,0,.7),0 0 0 1px ${C.orange}22`,
            animation:"adm-notifIn .2s ease both"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 16px",borderBottom:`1px solid ${C.navy}55`}}>
              <span style={{...orb(10,700),color:C.white}}>ALERTAS ADMIN</span>
              <button onClick={()=>setShowNotifs(false)}
                style={{background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}>
                <XIcon size={13}/>
              </button>
            </div>
            <div style={{maxHeight:280,overflowY:"auto"}}>
              {adminNotifs.length===0 ? (
                <div style={{padding:"24px",textAlign:"center",...raj(11,500),color:C.muted}}>
                  Sin alertas pendientes
                </div>
              ) : adminNotifs.map((n,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,
                  padding:"10px 16px",borderBottom:`1px solid ${C.navy}22`,
                  background:i===0?`${n.color}08`:"transparent"}}>
                  <div style={{background:`${n.color}18`,border:`1px solid ${n.color}33`,
                    padding:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <n.Icon size={12} color={n.color}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{...raj(11,700),color:C.white,marginBottom:2}}>{n.title}</div>
                    <div style={{...raj(9,500),color:C.muted,lineHeight:1.4}}>{n.desc}</div>
                  </div>
                  {n.badge&&(
                    <span style={{...raj(9,800),color:n.color,background:`${n.color}18`,
                      border:`1px solid ${n.color}33`,padding:"1px 6px",flexShrink:0}}>{n.badge}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin avatar */}
      <div style={{width:30,height:30,background:`${C.orange}18`,border:`1px solid ${C.orange}44`,
        display:"flex",alignItems:"center",justifyContent:"center",
        ...raj(12,800),color:C.orange,flexShrink:0,
        boxShadow:`0 0 8px ${C.orange}22`,title:adminUser?.email}}>
        {(adminUser?.displayName||adminUser?.email||"A")[0].toUpperCase()}
      </div>

      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{...px(9),color:C.orange,animation:"adm-glow 3s ease-in-out infinite",letterSpacing:".05em"}}>
          {clock.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </div>
        <div style={{...raj(9,500),color:C.muted,marginTop:2,letterSpacing:".06em"}}>
          {clock.toLocaleDateString("es-EC",{weekday:"short",day:"numeric",month:"short"}).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SYSTEM HEALTH BANNER
// ══════════════════════════════════════════════════════════════
function SystemHealthBanner({stats, todayXP=0, todaySessions=0}) {
  const items = [
    {icon:"🟢", label:"Sistema",      value:"ACTIVO",                         color:C.green},
    {icon:"👥", label:"Online",       value:`${stats.activeUsers||0}`,        color:C.blue},
    {icon:"⚡", label:"XP hoy",       value:`+${todayXP.toLocaleString()}`,   color:C.gold},
    {icon:"🏋️", label:"Sesiones",     value:`${todaySessions}`,               color:C.orange},
  ];
  return (
    <motion.div variants={FV.up}
      style={{display:"flex",gap:0,
        background:`linear-gradient(90deg,${C.card}CC,${C.panel}CC,${C.card}CC)`,
        backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
        border:`1px solid ${C.navy}88`,borderRadius:12,overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.orange}66,${C.gold}44,transparent)`}}/>
      {items.map(({icon,label,value,color},i)=>(
        <div key={i} style={{flex:"1 1 0",display:"flex",alignItems:"center",gap:10,
          padding:"12px 20px",borderRight:i<items.length-1?`1px solid ${C.navy}55`:"none"}}>
          <span style={{fontSize:16,filter:`drop-shadow(0 0 5px ${color}66)`}}>{icon}</span>
          <div>
            <div style={{...raj(10,500),color:C.muted,letterSpacing:".05em",marginBottom:1}}>{label}</div>
            <div style={{...orb(14,700),color}}>{value}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// USERS TABLE — Framer Motion stagger rows
// ══════════════════════════════════════════════════════════════
function UsersTable({users=[], onViewAll}) {
  const list = users.length > 0 ? users : MOCK_RECENT_USERS;
  return (
    <div
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
      style={{background:`linear-gradient(180deg,${C.card}CC,${C.panel}CC)`,
      backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
      border:`1px solid ${C.navy}88`,borderRadius:14,position:"relative",overflow:"hidden",transition:"transform .3s, box-shadow .3s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.orange}66,transparent)`}}/>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 20px",borderBottom:`1px solid ${C.navy}55`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Users size={15} color={C.orange} style={{filter:`drop-shadow(0 0 4px ${C.orange}66)`}}/>
          <span style={{...orb(11,700),color:C.white}}>USUARIOS RECIENTES</span>
          <span style={{...raj(10,700),background:`${C.orange}18`,color:C.orange,
            border:`1px solid ${C.orange}33`,borderRadius:20,padding:"2px 8px"}}>{list.length}</span>
        </div>
        <motion.button
          whileHover={{y:-1}} whileTap={{scale:.97}}
          onClick={onViewAll}
          style={{display:"flex",alignItems:"center",gap:6,background:C.orange,border:"none",
            borderRadius:8,
            color:C.bg,padding:"7px 14px",...raj(11,700),boxShadow:`0 3px 14px ${C.orange}44`,cursor:"pointer"}}>
          <ArrowRight size={12}/> VER TODOS
        </motion.button>
      </div>

      {/* Header */}
      <div style={{display:"grid",gridTemplateColumns:"2fr .8fr .6fr 1fr .7fr .8fr",
        padding:"9px 20px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}44`,gap:8}}>
        {["USUARIO","CLASE","NIVEL","XP","RACHA","ACCIONES"].map(h=>(
          <span key={h} style={{...px(5),color:C.muted,letterSpacing:".07em"}}>{h}</span>
        ))}
      </div>

      <motion.div variants={FV.staggerFast} initial="hidden" animate="show">
        {list.map((u,i)=>(
          <motion.div key={u.id||i} variants={FV.up} className="adm-row"
            style={{display:"grid",gridTemplateColumns:"2fr .8fr .6fr 1fr .7fr .8fr",
              padding:"11px 20px",borderBottom:`1px solid ${C.navy}22`,
              alignItems:"center",gap:8,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,background:`${CLS_COLOR[u.cls]||C.muted}18`,
                border:`1px solid ${CLS_COLOR[u.cls]||C.muted}44`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:15,flexShrink:0,boxShadow:`0 0 8px ${CLS_COLOR[u.cls]||C.muted}22`}}>
                {CLS_ICON[u.cls]||"🧙"}
              </div>
              <div style={{minWidth:0}}>
                <div style={{...raj(12,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                <div style={{...raj(10,400),color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
              </div>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:6,height:6,borderRadius:"50%",
                  background:u.status==="active"?C.green:C.red,
                  boxShadow:`0 0 5px ${u.status==="active"?C.green:C.red}`}}/>
                {u.status==="active"&&(
                  <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"adm-ping 2s infinite"}}/>
                )}
              </div>
            </div>
            <span style={{...raj(11,700),color:CLS_COLOR[u.cls]||C.muted,
              background:`${CLS_COLOR[u.cls]||C.muted}10`,border:`1px solid ${CLS_COLOR[u.cls]||C.muted}33`,
              borderRadius:20,
              padding:"2px 7px",display:"inline-block"}}>
              {u.cls||"N/A"}
            </span>
            <span style={{...orb(13,900),color:C.gold,textShadow:`0 0 10px ${C.gold}55`}}>
              Lv.{u.lvl||1}
            </span>
            <span style={{...raj(12,600),color:C.orange}}>{(u.xp||0).toLocaleString()} XP</span>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{filter:(u.streak||0)>0?"drop-shadow(0 0 3px #FF9F1C)":"none",fontSize:12}}>🔥</span>
              <span style={{...raj(12,600),color:(u.streak||0)>0?C.orangeL:C.muted}}>{u.streak||0}d</span>
            </div>
            <div style={{display:"flex",gap:5}}>
              {[{Icon:Eye,c:C.blue},{Icon:Edit2,c:C.orange},{Icon:Trash2,c:C.red}].map(({Icon:Ic,c},j)=>(
                <button key={j} className="adm-icon-btn"
                  style={{background:"transparent",border:`1px solid ${c}33`,padding:"5px",color:c,display:"flex"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${c}18`;e.currentTarget.style.borderColor=c;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${c}33`;}}>
                  <Ic size={12}/>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TOP USERS LEADERBOARD
// ══════════════════════════════════════════════════════════════
function TopUsersCard({topUsers=[]}) {
  const list = topUsers.length > 0 ? topUsers : MOCK_RECENT_USERS.map((u,i)=>({
    pos:i+1, nombre:u.name, clase:u.cls, nivel:u.lvl, xp:u.xp, streak:u.streak||0, sesiones:0,
  }));
  return (
    <div
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
      style={{background:`linear-gradient(180deg,${C.card},${C.panel})`,
      border:`1px solid ${C.navy}`,borderRadius:14,position:"relative",overflow:"hidden",height:"100%",transition:"transform .3s, box-shadow .3s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.gold}66,transparent)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:`1px solid ${C.navy}55`}}>
        <Trophy size={14} color={C.gold} style={{filter:`drop-shadow(0 0 4px ${C.gold}66)`}}/>
        <span style={{...orb(10,700),color:C.white}}>TOP HÉROES</span>
        <span style={{...raj(10,600),color:C.gold,background:`${C.gold}10`,border:`1px solid ${C.gold}22`,borderRadius:20,padding:"1px 7px",marginLeft:"auto"}}>XP RANK</span>
      </div>
      <motion.div variants={FV.staggerFast} initial="hidden" animate="show" style={{overflowY:"auto",maxHeight:340}}>
        {list.slice(0,8).map((u,i)=>(
          <motion.div key={i} variants={FV.left} className="adm-row"
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",
              borderBottom:`1px solid ${C.navy}22`,position:"relative"}}>
            <div style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
              background:i<3?`${[C.gold,"#C0C0C0","#CD7F32"][i]}18`:`${C.navy}44`,
              border:`1px solid ${i<3?[C.gold,"#C0C0C0","#CD7F32"][i]:C.navy}33`,
              flexShrink:0}}>
              {i<3
                ? <span style={{fontSize:11}}>{RANK_MEDALS[i]}</span>
                : <span style={{...px(6),color:C.muted}}>{i+1}</span>
              }
            </div>
            <div style={{fontSize:14,flexShrink:0}}>{CLS_ICON[u.clase]||"🧙"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{...raj(12,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nombre}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:2}}>
                <span style={{...raj(10,600),color:CLS_COLOR[u.clase]||C.muted}}>{u.clase}</span>
                <span style={{...raj(10,500),color:C.muted}}>Lv.{u.nivel}</span>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{...raj(11,700),color:C.orange}}>{(u.xp||0).toLocaleString()}</div>
              <div style={{...raj(9,500),color:C.muted}}>XP</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ACTIVITY FEED — Framer Motion AnimatePresence
// ══════════════════════════════════════════════════════════════
function ActivityFeed({items=[]}) {
  // Sort by rawTimestamp newest-first; if already sorted by backend, this is a no-op
  const sorted = sortFeed(items);
  const list = sorted.length > 0 ? sorted : null;  // null → show empty state, not mock
  return (
    <div
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
      style={{background:`linear-gradient(180deg,${C.card}CC,${C.panel}CC)`,
      backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
      border:`1px solid ${C.navy}88`,borderRadius:14,display:"flex",flexDirection:"column",height:"100%",
      position:"relative",overflow:"hidden",transition:"transform .3s, box-shadow .3s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.teal}44,transparent)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:`1px solid ${C.navy}55`,flexShrink:0}}>
        <Activity size={14} color={C.teal} style={{filter:`drop-shadow(0 0 4px ${C.teal}55)`}}/>
        <span style={{...raj(12,700),color:C.white}}>Actividad</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
          <div style={{position:"relative"}}>
            <div style={{width:7,height:7,background:C.green,borderRadius:"50%",animation:"adm-blink 1s infinite"}}/>
            <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"adm-ping 1.5s infinite"}}/>
          </div>
          <span style={{...raj(10,700),color:C.green,letterSpacing:".08em"}}>LIVE</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {!list ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            height:"100%",gap:10,padding:"24px 16px",opacity:.6}}>
            <Activity size={28} color={C.muted}/>
            <div style={{...raj(12,600),color:C.muted,textAlign:"center"}}>Sin actividad registrada</div>
            <div style={{...raj(10,400),color:C.muted,textAlign:"center",lineHeight:1.5}}>
              Las acciones de usuarios aparecerán aquí en tiempo real
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {list.map((a,i)=>(
              <motion.div key={a.id||i}
                initial={{opacity:0,x:20}}
                animate={{opacity:1,x:0}}
                exit={{opacity:0,height:0}}
                transition={{duration:0.3,delay:i*0.04}}
                style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 14px",
                  borderBottom:`1px solid ${C.navy}22`,position:"relative",
                  background:i===0?`${a.color}08`:"transparent"}}>
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,
                  background:i===0?`linear-gradient(180deg,${a.color},transparent)`:`${a.color}22`}}/>
                <div style={{fontSize:14,marginTop:1,flexShrink:0,
                  filter:i===0?`drop-shadow(0 0 5px ${a.color})`:"none"}}>{a.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...raj(11,i===0?700:500),color:i===0?C.white:C.mutedL,lineHeight:1.4,marginBottom:2}}>{a.msg}</div>
                  <div style={{...raj(9,500),color:C.muted}}>{a.time}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CLASS DISTRIBUTION — bar-style visual
// ══════════════════════════════════════════════════════════════
function ClassDistributionBar({classDistribution={}, total=0}) {
  const classes = [
    {key:"GUERRERO",icon:"⚔️",color:C.orange},
    {key:"ARQUERO", icon:"🏃",color:C.blue  },
    {key:"MAGO",    icon:"🧘",color:C.purple},
  ];
  const tot = total || Object.values(classDistribution).reduce((s,v)=>s+v,0) || 1;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {classes.map(({key,icon,color})=>{
        const count = classDistribution[key] || 0;
        const pct   = Math.round((count/tot)*100);
        return (
          <div key={key}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontSize:13}}>{icon}</span>
                <span style={{...raj(12,700),color}}>{key}</span>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{...raj(11,600),color:C.mutedL}}>{count} usuarios</span>
                <span style={{...raj(11,700),color,background:`${color}14`,border:`1px solid ${color}33`,borderRadius:20,padding:"1px 7px"}}>{pct}%</span>
              </div>
            </div>
            <div style={{height:6,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden"}}>
              <motion.div
                initial={{width:0}}
                animate={{width:`${pct}%`}}
                transition={{duration:1.2,ease:"easeOut",delay:0.2}}
                style={{height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,
                  boxShadow:`0 0 6px ${color}66`}}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PULSE STRIP — live computed stats bar
// ══════════════════════════════════════════════════════════════
function PulseStrip({stats, todayXP, todaySessions, newUsersToday}) {
  const items = [
    {label:"USUARIOS TOTALES", value:(stats.totalUsers||0).toLocaleString(), icon:"👥", color:C.blue},
    {label:"ACTIVOS (7d)",     value:(stats.activeUsers||0).toLocaleString(), icon:"🟢", color:C.green},
    {label:"XP HOY",           value:`+${todayXP.toLocaleString()}`, icon:"⚡", color:C.gold},
    {label:"SESIONES HOY",     value:todaySessions.toString(), icon:"🏋️", color:C.orange},
    {label:"NUEVOS HOY",       value:newUsersToday.toString(), icon:"✨", color:C.teal},
    {label:"RACHA PROM.",      value:`${stats.avgStreak||0}d`, icon:"🔥", color:C.red},
    {label:"XP TOTAL",         value:(stats.totalXP||0)>99999?`${Math.round((stats.totalXP||0)/1000)}K`:(stats.totalXP||0).toLocaleString(), icon:"🏆", color:C.purple},
  ];
  return (
    <motion.div variants={FV.up}
      style={{display:"flex",gap:0,background:`linear-gradient(90deg,${C.card},${C.panel},${C.card})`,
        border:`1px solid ${C.navy}`,borderRadius:12,overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.blue}66,${C.orange}66,${C.gold}66,transparent)`}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.navy}88,transparent)`}}/>
      {items.map(({label,value,icon,color},i)=>(
        <div key={i} style={{flex:"1 1 0",display:"flex",alignItems:"center",gap:8,
          padding:"10px 14px",borderRight:i<items.length-1?`1px solid ${C.navy}44`:"none",
          background:`linear-gradient(135deg,${color}06,transparent)`,position:"relative",minWidth:0}}>
          <span style={{fontSize:14,filter:`drop-shadow(0 0 4px ${color}66)`,flexShrink:0}}>{icon}</span>
          <div style={{minWidth:0}}>
            <div style={{...raj(8,600),color:C.muted,letterSpacing:".06em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
            <div style={{...orb(12,900),color,marginTop:1,animation:"adm-pulseNum 4s ease-in-out infinite",animationDelay:`${i*.3}s`}}>{value}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// WEEKLY LEADER CARD — top performers this week by class
// ══════════════════════════════════════════════════════════════
function WeeklyLeaderCard({weeklyData={}}) {
  const classes = [
    {key:"GUERRERO",icon:"⚔️",color:C.orange},
    {key:"ARQUERO", icon:"🏹",color:C.blue  },
    {key:"MAGO",    icon:"🔮",color:C.purple},
  ];
  const hasData = Object.keys(weeklyData).length > 0;
  return (
    <div
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
      style={{background:`linear-gradient(135deg,${C.card}CC,${C.panel}CC)`,
      backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
      border:`1px solid ${C.gold}2A`,borderRadius:14,position:"relative",overflow:"hidden",height:"100%",transition:"transform .3s, box-shadow .3s"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.gold}99,transparent)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:`1px solid ${C.navy}55`}}>
        <Flame size={14} color={C.gold} style={{filter:`drop-shadow(0 0 5px ${C.gold}66)`}}/>
        <span style={{...orb(10,700),color:C.white}}>RANKING SEMANAL</span>
        <span style={{...raj(9,600),color:C.gold,background:`${C.gold}10`,border:`1px solid ${C.gold}22`,borderRadius:20,padding:"1px 7px",marginLeft:"auto"}}>ESTA SEMANA</span>
      </div>
      {!hasData ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,
          ...raj(11,500),color:C.muted,flexDirection:"column",gap:8}}>
          <Flame size={24} color={C.muted}/>
          Sin datos esta semana
        </div>
      ) : (
        <div style={{overflowY:"auto",maxHeight:340}}>
          {classes.map(({key,icon,color})=>{
            const list = weeklyData[key]||[];
            const top = list[0];
            if(!top||top.weeklyXP===0) return null;
            return (
              <div key={key} style={{padding:"10px 16px",borderBottom:`1px solid ${C.navy}22`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:13,filter:`drop-shadow(0 0 4px ${color}88)`}}>{icon}</span>
                  <span style={{...raj(10,700),color}}>{key}</span>
                </div>
                {list.slice(0,3).map((u,i)=>(
                  <motion.div key={i}
                    initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                    transition={{delay:i*.06}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",
                      borderBottom:i<2?`1px dashed ${C.navy}33`:"none"}}>
                    <span style={{fontSize:10,width:16,flexShrink:0,textAlign:"center"}}>
                      {i===0?"🥇":i===1?"🥈":"🥉"}
                    </span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{...raj(11,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nombre}</div>
                      <div style={{...raj(9,500),color:C.muted}}>Lv.{u.nivel}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{...raj(11,700),color}}>{(u.weeklyXP||0).toLocaleString()}</div>
                      <div style={{...raj(8,500),color:C.muted}}>XP sem.</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ══════════════════════════════════════════════════════════════
function QuickActions({setActive}) {
  const actions=[
    {icon:"👤",label:"Nuevo usuario",  color:C.blue,   nav:"usuarios"  },
    {icon:"💪",label:"Ejercicio",      color:C.orange, nav:"ejercicios"},
    {icon:"📋",label:"Rutina",         color:C.teal,   nav:"rutinas"   },
    {icon:"🎯",label:"Misión",         color:C.gold,   nav:"misiones"  },
    {icon:"🎒",label:"Objeto",         color:C.purple, nav:"objetos"   },
    {icon:"🏆",label:"Logro",          color:C.green,  nav:"logros"    },
  ];
  return (
    <motion.div variants={FV.stagger} style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {actions.map((a,i)=>(
        <motion.button key={i} variants={FV.scale}
          className="adm-action"
          whileHover={{y:-4,borderColor:a.color,boxShadow:`0 8px 28px ${a.color}33,0 0 0 1px ${a.color}44`}}
          whileTap={{scale:.96}}
          onClick={()=>setActive(a.nav)}
          style={{background:`linear-gradient(135deg,${C.card}CC,${C.panel}CC)`,
            backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:`1px solid ${a.color}1A`,padding:"14px 10px",
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",
            boxShadow:"0 3px 16px rgba(0,0,0,.3)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${a.color}66,transparent)`,opacity:.8}}/>
          <CornerDeco color={a.color} size={8} pos="tl"/>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:20,filter:`drop-shadow(0 0 6px ${a.color}88)`}}>{a.icon}</span>
            <Plus size={11} color={a.color} style={{opacity:.8}}/>
          </div>
          <div style={{...raj(11,700),color:C.white,textAlign:"center"}}>{a.label}</div>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// REFRESH BADGE — last updated + countdown
// ══════════════════════════════════════════════════════════════
function RefreshBadge({lastUpdated, nextIn, onRefresh, loading}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      {lastUpdated&&(
        <span style={{...raj(10,500),color:C.muted}}>
          Act. {lastUpdated.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </span>
      )}
      {nextIn>0&&(
        <span style={{...raj(10,600),color:C.navyL}}>
          Próx. en {nextIn}s
        </span>
      )}
      <motion.button
        whileHover={{scale:1.1,color:C.orange}} whileTap={{scale:.95}}
        onClick={onRefresh}
        style={{display:"flex",alignItems:"center",gap:5,background:`${C.navy}44`,
          border:`1px solid ${C.navy}`,borderRadius:8,padding:"5px 10px",color:C.muted,...raj(10,600),cursor:"pointer"}}>
        <motion.div
          animate={loading?{rotate:360}:{rotate:0}}
          transition={loading?{duration:.8,repeat:Infinity,ease:"linear"}:{}}
        >
          <RefreshCw size={11}/>
        </motion.div>
        {loading?"Cargando...":"Actualizar"}
      </motion.button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMING SOON
// ══════════════════════════════════════════════════════════════
function ComingSoonView({section}) {
  const s = NAV_ITEMS.find(n=>n.id===section);
  const Icon = s?.icon||Settings;
  const color = s?.color||C.orange;
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,position:"relative"}}>
      <GlowOrb color={color} size={200} x="50%" y="50%" opacity={0.1}/>
      <motion.div initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:200}}
        style={{background:`${color}10`,border:`1px solid ${color}33`,padding:"24px",position:"relative",zIndex:1,boxShadow:`0 0 30px ${color}22`}}>
        <Icon size={44} color={color} style={{filter:`drop-shadow(0 0 12px ${color})`}}/>
      </motion.div>
      <div style={{textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{...orb(16,900),color,marginBottom:8,animation:"adm-glow 2s ease-in-out infinite"}}>
          {s?.label?.toUpperCase()||"SECCIÓN"}
        </div>
        <div style={{...raj(14,500),color:C.muted}}>Módulo completamente funcional</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD MAIN VIEW v2 — Framer Motion + datos reales
// ══════════════════════════════════════════════════════════════
function DashboardView({dashboardStats, activityFeed, chartData, period, setPeriod, loading, chartLoading, loadError, lastUpdated, nextIn, onRefresh, setActive, isMobile, todayXP, todaySessions, newUsersToday, weeklyLeaderboard}) {
  const dataLoaded = dashboardStats !== null && !loading;
  const stats      = dashboardStats?.stats || {};

  if (loading && dashboardStats === null) return <><style>{GLOBAL_CSS}</style><SkeletonDashboard/></>;


  // Safe chart data with crash protection
  const evolutionData =
    normalizeEvolutionData(stats.evolutionData) ||
    normalizeEvolutionData(chartData) ||
    MOCK_CHART_DATA;

  const topExercises = normalizeExercisesData(stats.topExercises) || MOCK_EXERCISES;
  const classData    = Object.entries(stats.classDistribution || {}).map(([name,value])=>({name,value,color:CLS_COLOR[name]||C.orange}));

  return (
    <motion.div
      variants={FV.stagger}
      initial="hidden"
      animate="show"
      style={{display:"flex",flexDirection:"column",gap:18,position:"relative"}}
    >
      {/* ── Interaction-blocking overlay during full reload ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="load-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:.2}}
            style={{position:"fixed",inset:0,zIndex:500,
              background:"rgba(5,12,24,0.55)",backdropFilter:"blur(2px)",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"wait",pointerEvents:"all"}}
          >
            <motion.div
              initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}}
              transition={{type:"spring",stiffness:300,damping:24}}
              style={{display:"flex",alignItems:"center",gap:12,
                background:`${C.card}F0`,border:`1px solid ${C.orange}44`,
                borderRadius:16,
                padding:"16px 26px",boxShadow:`0 12px 40px rgba(0,0,0,.7),0 0 0 1px ${C.orange}22`}}
            >
              <motion.div animate={{rotate:360}} transition={{duration:.8,repeat:Infinity,ease:"linear"}}>
                <RefreshCw size={16} color={C.orange}/>
              </motion.div>
              <span style={{...raj(13,700),color:C.orange,letterSpacing:".06em"}}>ACTUALIZANDO DATOS…</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error banner ── */}
      {loadError && !loading && (
        <motion.div variants={FV.up}
          style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,
            padding:"10px 16px",background:`${C.red}12`,border:`1px solid ${C.red}44`,
            ...raj(12,600),color:C.red}}>
          <span>⚠ {loadError}</span>
          <button onClick={onRefresh}
            style={{...raj(11,700),color:C.red,background:`${C.red}18`,border:`1px solid ${C.red}44`,
              borderRadius:8,padding:"4px 12px",cursor:"pointer"}}>
            Reintentar
          </button>
        </motion.div>
      )}

      {/* ── Welcome header ── */}
      <motion.div variants={FV.up}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"22px 28px",
          background:`linear-gradient(135deg,${C.card}CC 0%,${C.panel}CC 100%)`,
          backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
          border:`1px solid ${C.navy}88`,borderRadius:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent,${C.orange}77,${C.gold}44,transparent)`}}/>
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,
          borderRadius:"50%",background:C.orange,filter:"blur(80px)",opacity:.08,pointerEvents:"none",
          animation:"adm-float 7s ease-in-out infinite"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <span style={{fontSize:22,filter:`drop-shadow(0 0 8px ${C.orange}88)`}}>🛡️</span>
            <div style={{...raj(20,800),color:C.white,letterSpacing:"-0.01em"}}>
              Panel de <span style={{color:C.orange,animation:"adm-glow 3s ease-in-out infinite"}}>Control</span>
            </div>
          </div>
          <div style={{...raj(12,400),color:C.muted}}>
            Datos en tiempo real · ForgeVenture Admin
          </div>
        </div>
        <RefreshBadge lastUpdated={lastUpdated} nextIn={nextIn} onRefresh={onRefresh} loading={loading}/>
      </motion.div>

      {/* ── System health ribbon ── */}
      <SystemHealthBanner stats={stats} todayXP={todayXP} todaySessions={todaySessions}/>

      {/* ── Quick actions ── */}
      <QuickActions setActive={setActive}/>

      {/* ── KPI cards (4 cards) ── */}
      <motion.div variants={FV.stagger} style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:14}}>
        <KpiCard icon={Users}    label="Usuarios"   value={stats.totalUsers??null}    sub={`${stats.activeUsers??0} activos hoy`}  color={C.blue}   trend={8}  dataLoaded={dataLoaded}/>
        <KpiCard icon={Zap}      label="XP total"   value={stats.totalXP??null}       sub="distribuido en el sistema"              color={C.gold}   trend={22} dataLoaded={dataLoaded}/>
        <KpiCard icon={Dumbbell} label="Ejercicios" value={stats.totalExercises??null} sub={`${stats.exerciseCount??0} completados`} color={C.orange} trend={5}  dataLoaded={dataLoaded}/>
        <KpiCard icon={Flame}    label="Racha prom" value={stats.avgStreak??null}     sub="días consecutivos"                      color={C.purple} trend={-2} dataLoaded={dataLoaded}/>
      </motion.div>

      {/* ── Charts ── */}
      <motion.div variants={FV.stagger} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.6fr 1fr",gap:14}}>

        {/* Area chart — evolutionData */}
        <motion.div variants={FV.up}
          style={{background:`linear-gradient(135deg,${C.card}CC,${C.panel}CC)`,
            backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:`1px solid ${C.navy}88`,borderRadius:14,padding:"20px 24px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${C.blue}55,transparent)`}}/>
          {!isMobile&&<div style={{position:"absolute",bottom:-40,right:-40,width:160,height:160,
            borderRadius:"50%",background:C.blue,filter:"blur(70px)",opacity:.07,pointerEvents:"none",animation:"adm-float 5s ease-in-out infinite"}}/>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <TrendingUp size={14} color={C.blue} style={{filter:`drop-shadow(0 0 5px ${C.blue}66)`}}/>
              <span style={{...raj(isMobile?11:13,700),color:C.white}}>Actividad del sistema</span>
              {chartLoading&&<motion.div animate={{rotate:360}} transition={{duration:.7,repeat:Infinity,ease:"linear"}}><RefreshCw size={11} color={C.muted}/></motion.div>}
            </div>
            <PeriodSelector period={period} setPeriod={setPeriod}/>
          </div>
          {(loading||chartLoading) ? <SkeletonBlock h={isMobile?120:200}/> : isMobile ? (
            <MobileBarChart
              data={evolutionData}
              bars={[{key:"usuarios",color:C.blue,label:"Usuarios"},{key:"sesiones",color:C.orange,label:"Sesiones"}]}
              height={120}
            />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={evolutionData} margin={{top:4,right:4,left:-16,bottom:0}}>
                <defs>
                  <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue}   stopOpacity={.4}/>
                    <stop offset="95%" stopColor={C.blue}   stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.orange} stopOpacity={.35}/>
                    <stop offset="95%" stopColor={C.orange} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
                <XAxis dataKey="dia" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<FvTooltip/>}/>
                <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke={C.blue} strokeWidth={2.5}
                  fill="url(#gU)" dot={{fill:C.blue,r:3,strokeWidth:0}} activeDot={{r:5,fill:C.blue,stroke:C.card,strokeWidth:2}}/>
                <Area type="monotone" dataKey="sesiones" name="Sesiones" stroke={C.orange} strokeWidth={2}
                  fill="url(#gS)" dot={false} activeDot={{r:4,fill:C.orange,stroke:C.card,strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
          {!isMobile&&(
            <div style={{display:"flex",gap:16,marginTop:10,justifyContent:"center"}}>
              {[{label:"Usuarios",color:C.blue},{label:"Sesiones",color:C.orange}].map(({label,color})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:10,height:2,background:color}}/>
                  <span style={{...raj(10,500),color:C.muted}}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bar chart — top exercises */}
        <motion.div variants={FV.up}
          style={{background:`linear-gradient(135deg,${C.card}CC,${C.panel}CC)`,
            backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:`1px solid ${C.navy}88`,borderRadius:14,padding:"20px 24px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${C.teal}55,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <Dumbbell size={14} color={C.teal} style={{filter:`drop-shadow(0 0 5px ${C.teal}55)`}}/>
              <span style={{...raj(isMobile?11:13,700),color:C.white}}>Top ejercicios</span>
            </div>
            <span style={{...raj(10,500),color:C.muted,background:`${C.teal}0A`,border:`1px solid ${C.teal}22`,borderRadius:20,padding:"3px 10px"}}>
              por sesiones
            </span>
          </div>
          {(loading||chartLoading) ? <SkeletonBlock h={isMobile?120:200}/> : isMobile ? (
            <MobileExerciseBars data={topExercises}/>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topExercises} barCategoryGap="35%" margin={{top:4,right:4,left:-16,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
                <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<FvTooltip/>}/>
                <Bar dataKey="sesiones" name="Sesiones" fill={C.teal} maxBarSize={28}>
                  {topExercises.map((_, i) => (
                    <Cell key={i} fill={i===0?C.orange:i===1?C.blue:C.teal}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>

      {/* ── Class distribution + Métricas rápidas ── */}
      <motion.div variants={FV.stagger} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.3fr 1fr",gap:14}}>
        <motion.div variants={FV.up}
          style={{background:`linear-gradient(135deg,${C.card}CC,${C.panel}CC)`,
            backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:`1px solid ${C.navy}88`,borderRadius:14,padding:"20px 24px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${C.purple}55,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:18}}>
            <BarChart2 size={14} color={C.purple} style={{filter:`drop-shadow(0 0 5px ${C.purple}66)`}}/>
            <span style={{...raj(13,700),color:C.white}}>Distribución de clases</span>
            {!loading&&<span style={{...raj(11,500),color:C.muted,marginLeft:"auto"}}>{(stats.totalUsers||0).toLocaleString()} héroes</span>}
          </div>
          {loading ? <SkeletonBlock h={120}/> : (
            <ClassDistributionBar classDistribution={stats.classDistribution||{}} total={stats.totalUsers||0}/>
          )}
        </motion.div>

        <motion.div variants={FV.up}
          style={{background:`linear-gradient(135deg,${C.card}CC,${C.panel}CC)`,
            backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:`1px solid ${C.navy}88`,borderRadius:14,padding:"20px 24px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${C.gold}55,transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:18}}>
            <Calendar size={14} color={C.gold} style={{filter:`drop-shadow(0 0 5px ${C.gold}55)`}}/>
            <span style={{...raj(13,700),color:C.white}}>Métricas rápidas</span>
          </div>
          {loading ? <SkeletonBlock h={120}/> : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {label:"XP / usuario",   value:`~${Math.round((stats.totalXP||0)/Math.max(1,stats.totalUsers||1)).toLocaleString()}`,color:C.gold,  icon:"⚡"},
                {label:"Tasa activos",   value:`${stats.totalUsers>0?Math.round(((stats.activeUsers||0)/(stats.totalUsers||1))*100):0}%`,color:C.green, icon:"📈"},
                {label:"Misiones",       value:`${stats.completedMissions||0}`,color:C.blue,   icon:"🎯"},
                {label:"Logros total",   value:`${stats.totalAchievements||0}`,color:C.purple, icon:"🏆"},
              ].map(({label,value,color,icon},i)=>(
                <motion.div key={i}
                  whileHover={{scale:1.02,borderColor:`${color}55`}}
                  style={{background:`${color}09`,border:`1px solid ${color}1A`,borderRadius:14,padding:"12px 14px",transition:"border-color .2s"}}>
                  <div style={{fontSize:16,marginBottom:6,filter:`drop-shadow(0 0 4px ${color}66)`}}>{icon}</div>
                  <div style={{...orb(16,700),color,marginBottom:2}}>{value}</div>
                  <div style={{...raj(10,500),color:C.muted}}>{label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── Bottom: users table + weekly leader + feed ── */}
      <motion.div variants={FV.stagger} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr",gap:14}}>
        <motion.div variants={FV.up}>
          <UsersTable users={stats.recentUsers||[]} onViewAll={()=>setActive("usuarios")}/>
        </motion.div>
        <motion.div variants={FV.up}>
          <WeeklyLeaderCard weeklyData={weeklyLeaderboard?.leaderboard||{}}/>
        </motion.div>
        <motion.div variants={FV.up} style={{minHeight:200}}>
          <ActivityFeed items={activityFeed}/>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODO SIMPLE — paleta limpia
// ══════════════════════════════════════════════════════════════
const S = {
  bg:"#0F1117", card:"#1A1D27", panel:"#14171F", border:"#2A2D3E",
  accent:"#6366F1", accentL:"#818CF8", accentD:"#4F46E5",
  green:"#10B981", red:"#EF4444", yellow:"#F59E0B", blue:"#3B82F6",
  text:"#E2E8F0", textMuted:"#94A3B8", textFaint:"#475569", white:"#F8FAFC",
};
const sr = (s,w=400) => ({fontFamily:"'Inter',system-ui,sans-serif",fontSize:s,fontWeight:w});
const SIMPLE_GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .s-nav-item { transition:background .15s; cursor:pointer; border-radius:6px; }
  .s-nav-item:hover { background:#2A2D3E !important; }
  .s-card { transition:box-shadow .2s,border-color .2s; }
  .s-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.4) !important; }
  .s-row { transition:background .1s; }
  .s-row:hover { background:#1E2030 !important; }
  .s-btn { transition:all .15s; cursor:pointer; }
  .s-btn:hover { opacity:.88; }
  .s-icon-btn { transition:background .15s; cursor:pointer; }
  .s-icon-btn:hover { background:#2A2D3E !important; }
  .s-input:focus { outline:none; border-color:#6366F1 !important; box-shadow:0 0 0 3px rgba(99,102,241,.15) !important; }
  .s-input::placeholder { color:#475569; }
`;
const SIMPLE_NAV = [
  {id:"dashboard",  icon:LayoutDashboard, label:"Dashboard"   },
  {id:"usuarios",   icon:Users,           label:"Usuarios"    },
  {id:"ejercicios", icon:Dumbbell,        label:"Ejercicios"  },
  {id:"rutinas",    icon:ClipboardList,   label:"Rutinas"     },
  {id:"misiones",   icon:Target,          label:"Misiones"    },
  {id:"objetos",    icon:Package,         label:"Objetos"     },
  {id:"logros",     icon:Trophy,          label:"Logros"      },
  {id:"stats",      icon:BarChart2,       label:"Estadísticas"},
  {id:"mensajes",   icon:MessageSquare,   label:"Mensajes"    },
  {id:"feedback",   icon:Inbox,           label:"Feedback"    },
  {id:"mente",      icon:Brain,           label:"Zona Mente"  },
  {id:"config",     icon:Settings,        label:"Configuración"},
];

function SimpleSidebar({active,setActive,onLogout,setFx}) {
  const groups=[
    {label:"PRINCIPAL", items:SIMPLE_NAV.slice(0,2)},
    {label:"CONTENIDO", items:SIMPLE_NAV.slice(2,7)},
    {label:"SISTEMA",   items:SIMPLE_NAV.slice(7)   }, // includes mente + feedback + config
  ];
  return (
    <div style={{width:220,flexShrink:0,background:S.card,borderRight:`1px solid ${S.border}`,
      display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${S.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:28,height:28,background:S.accent,borderRadius:6,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚔️</div>
          <span style={{...sr(15,700),color:S.text}}>ForgeVenture</span>
        </div>
        <span style={{...sr(11,500),color:S.textFaint,letterSpacing:".04em"}}>Admin Panel</span>
      </div>
      <nav style={{flex:1,overflowY:"auto",padding:"12px"}}>
        {groups.map(g=>(
          <div key={g.label} style={{marginBottom:20}}>
            <div style={{...sr(10,600),color:S.textFaint,letterSpacing:".08em",marginBottom:6,paddingLeft:8}}>{g.label}</div>
            {g.items.map(item=>{
              const on=active===item.id;
              return (
                <div key={item.id} className="s-nav-item"
                  onClick={()=>setActive(item.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                    background:on?`${S.accent}18`:"transparent",marginBottom:2}}>
                  <item.icon size={15} color={on?S.accentL:S.textFaint}/>
                  <span style={{...sr(13,on?600:400),color:on?S.accentL:S.textMuted}}>{item.label}</span>
                  {on&&<div style={{width:4,height:4,background:S.accent,borderRadius:"50%",marginLeft:"auto"}}/>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{padding:"12px",borderTop:`1px solid ${S.border}`}}>
        <button onClick={()=>setFx(true)}
          style={{width:"100%",display:"flex",alignItems:"center",gap:8,...sr(12,500),
            color:S.textMuted,background:`${S.accent}14`,border:`1px solid ${S.accent}44`,
            padding:"8px 12px",cursor:"pointer",marginBottom:8,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=`${S.accent}22`;e.currentTarget.style.color=S.accentL;}}
          onMouseLeave={e=>{e.currentTarget.style.background=`${S.accent}14`;e.currentTarget.style.color=S.textMuted;}}>
          <span style={{fontSize:14}}>✦</span> Modo visual RPG
        </button>
        <button onClick={onLogout}
          style={{width:"100%",display:"flex",alignItems:"center",gap:8,...sr(12,500),
            color:S.textFaint,background:"transparent",border:`1px solid ${S.border}`,
            padding:"8px 12px",cursor:"pointer",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=`${S.red}10`;e.currentTarget.style.color=S.red;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=S.textFaint;}}>
          <LogOut size={14}/> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function SimpleTopBar({active,clock}) {
  const sec=SIMPLE_NAV.find(n=>n.id===active);
  const SIcon=sec?.icon||LayoutDashboard;
  return (
    <div style={{height:54,flexShrink:0,background:S.card,borderBottom:`1px solid ${S.border}`,
      display:"flex",alignItems:"center",padding:"0 22px",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
        <SIcon size={15} color={S.textMuted}/>
        <span style={{...sr(14,600),color:S.text}}>{sec?.label||"Dashboard"}</span>
        <span style={{...sr(13,400),color:S.textFaint}}>/</span>
        <span style={{...sr(13,400),color:S.textFaint}}>Vista general</span>
      </div>
      <div style={{position:"relative",flex:"0 0 200px"}}>
        <Search size={13} color={S.textFaint} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
        <input placeholder="Buscar..." className="s-input"
          style={{width:"100%",background:S.panel,border:`1px solid ${S.border}`,
            borderRadius:6,
            color:S.text,padding:"7px 12px 7px 30px",...sr(13,400),transition:"border-color .15s"}}/>
      </div>
      <div style={{...sr(12,500),color:S.textFaint}}>
        {clock.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}
      </div>
      <div style={{width:30,height:30,background:S.accent,borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",...sr(12,700),color:S.white}}>A</div>
    </div>
  );
}

function SimpleKpiCard({icon:Icon,label,value,sub,color,trend}) {
  const isNeg=trend<0;
  return (
    <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,
      padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{background:`${color}18`,padding:"8px",display:"flex"}}>
          <Icon size={18} color={color}/>
        </div>
        {trend!==undefined&&(
          <div style={{...sr(11,600),color:isNeg?S.red:S.green,
            background:isNeg?`${S.red}14`:`${S.green}14`,
            padding:"3px 8px",display:"flex",alignItems:"center",gap:3}}>
            {isNeg?<TrendingDown size={11}/>:<TrendingUp size={11}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{...sr(26,700),color:S.white,marginBottom:3}}>{value}</div>
      <div style={{...sr(13,500),color:S.text,marginBottom:2}}>{label}</div>
      <div style={{...sr(11,400),color:S.textFaint}}>{sub}</div>
    </div>
  );
}

function SimpleDashboardView({stats}) {
  const s = stats?.stats || {};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div>
        <div style={{...sr(22,700),color:S.white,marginBottom:4}}>Dashboard</div>
        <div style={{...sr(13,400),color:S.textFaint}}>
          Resumen general · {new Date().toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"})}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <SimpleKpiCard icon={Users}    label="Usuarios Totales"    value={s.totalUsers||"–"}          sub={`${s.activeUsers||0} activos hoy`} color={S.accent} trend={8}  />
        <SimpleKpiCard icon={Activity} label="Activos Hoy"         value={s.activeUsers||"–"}          sub="Sesión actual"                     color={S.blue}   trend={15} />
        <SimpleKpiCard icon={Zap}      label="XP Total"            value={s.totalXP||"–"}              sub="Distribuido"                       color={S.yellow} trend={22} />
        <SimpleKpiCard icon={Target}   label="Misiones"            value={s.completedMissions||"–"}    sub="Completadas"                       color={S.green}  trend={-3} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16}}>
        <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,padding:"20px"}}>
          <div style={{...sr(14,600),color:S.text,marginBottom:4}}>Actividad reciente</div>
          <div style={{...sr(11,400),color:S.textFaint,marginBottom:16}}>Últimos 7 días</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_CHART_DATA} margin={{top:4,right:4,left:-16,bottom:0}}>
              <defs>
                <linearGradient id="sU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={S.accent} stopOpacity={.25}/>
                  <stop offset="95%" stopColor={S.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border}/>
              <XAxis dataKey="dia" tick={{fill:S.textFaint,fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:S.textFaint,fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
              <Tooltip content={({active,payload,label})=>{
                if(!active||!payload?.length) return null;
                return <div style={{background:S.card,border:`1px solid ${S.border}`,padding:"10px 14px",...sr(12,400),color:S.text}}>
                  <div style={{fontWeight:600,marginBottom:5}}>{label}</div>
                  {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value}</div>)}
                </div>;
              }}/>
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={S.accent} strokeWidth={2} fill="url(#sU)" dot={false} activeDot={{r:5}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,padding:"20px"}}>
          <div style={{...sr(14,600),color:S.text,marginBottom:4}}>Top ejercicios</div>
          <div style={{...sr(11,400),color:S.textFaint,marginBottom:16}}>Por sesiones</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_EXERCISES} barCategoryGap="40%" margin={{top:4,right:4,left:-16,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fill:S.textFaint,fontSize:10,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:S.textFaint,fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Bar dataKey="sesiones" name="Sesiones" fill={S.accent} maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${S.border}`}}>
          <div style={{...sr(14,600),color:S.text}}>Usuarios recientes</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr .7fr .5fr 1fr .6fr .7fr",padding:"9px 20px",background:S.panel,borderBottom:`1px solid ${S.border}`,gap:8}}>
          {["USUARIO","CLASE","NIVEL","XP","RACHA","ACCIONES"].map(h=>(
            <span key={h} style={{...sr(10,600),color:S.textFaint,letterSpacing:".06em"}}>{h}</span>
          ))}
        </div>
        {(s.recentUsers||MOCK_RECENT_USERS).map((u,i)=>(
          <div key={u.id||i} className="s-row" style={{display:"grid",gridTemplateColumns:"2fr .7fr .5fr 1fr .6fr .7fr",
            padding:"11px 20px",borderBottom:`1px solid ${S.border}33`,alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,background:`${CLS_COLOR[u.cls]||S.accent}22`,
                borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                {CLS_ICON[u.cls]||"🧙"}
              </div>
              <div style={{minWidth:0}}>
                <div style={{...sr(13,600),color:S.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                <div style={{...sr(11,400),color:S.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
              </div>
              <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:u.status==="active"?S.green:S.red}}/>
            </div>
            <span style={{...sr(12,500),color:CLS_COLOR[u.cls]||S.accent,background:`${CLS_COLOR[u.cls]||S.accent}14`,padding:"2px 8px",display:"inline-block"}}>{u.cls||"N/A"}</span>
            <span style={{...sr(13,600),color:S.text}}>Lv.{u.lvl||1}</span>
            <span style={{...sr(12,500),color:S.textMuted}}>{(u.xp||0).toLocaleString()} XP</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:11}}>🔥</span>
              <span style={{...sr(12,400),color:S.textMuted}}>{u.streak||0}d</span>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{Icon:Eye,c:S.blue},{Icon:Edit2,c:S.accent},{Icon:Trash2,c:S.red}].map(({Icon:Ic,c},j)=>(
                <button key={j} className="s-icon-btn" style={{background:"transparent",border:"none",padding:"5px",color:S.textFaint,display:"flex",cursor:"pointer"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=c;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=S.textFaint;}}>
                  <Ic size={13}/>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleShell({active,setActive,onLogout,setFx,dashboardStats}) {
  const clock=useClock();
  const renderContent=()=>{
    if(active==="dashboard")  return <SimpleDashboardView stats={dashboardStats}/>;
    if(active==="usuarios")   return <AdminUsuarios/>;
    if(active==="ejercicios") return <AdminEjercicios/>;
    if(active==="rutinas")    return <AdminRutinas/>;
    if(active==="misiones")   return <AdminMisiones/>;
    if(active==="objetos")    return <AdminObjetos/>;
    if(active==="logros")     return <AdminLogros/>;
    if(active==="stats")      return <AdminStats/>;
    if(active==="mensajes")   return <AdminMensajes/>;
    if(active==="feedback")   return <AdminFeedback/>;
    if(active==="mente")      return <AdminMente/>;
    if(active==="config")     return <AdminConfig/>;
    return null;
  };
  return (
    <>
      <style>{SIMPLE_GLOBAL_CSS}</style>
      <div style={{display:"flex",height:"100vh",background:S.bg,overflow:"hidden"}}>
        <SimpleSidebar active={active} setActive={setActive} onLogout={onLogout} setFx={setFx}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <SimpleTopBar active={active} clock={clock}/>
          <div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:S.bg}}>
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════
const REFRESH_INTERVAL = 30; // segundos

export default function AdminDashboard({onLogout}) {
  const isMobile = useIsMobile();
  const [active,         setActive]         = useState("dashboard");
  const [collapsed,      setCollapsed]      = useState(false);

  // Navegación desde el avatar Flex
  useEffect(() => {
    const handler = (e) => setActive(e.detail.section);
    window.addEventListener('flexNavigate', handler);
    return () => window.removeEventListener('flexNavigate', handler);
  }, []);
  const [fx,              setFx]             = useState(true);
  const [period,          setPeriod]         = useState("7d");
  const [dashboardStats,  setDashboardStats] = useState(null);
  const [activityFeed,    setActivityFeed]   = useState([]);
  const [chartData,       setChartData]      = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [chartLoading,    setChartLoading]   = useState(false);
  const [loadError,       setLoadError]      = useState(null);
  const [lastUpdated,     setLastUpdated]    = useState(null);
  const [countdown,       setCountdown]      = useState(REFRESH_INTERVAL);
  const [adminUser,       setAdminUser]      = useState(() => auth.currentUser);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState(null);

  // Sync auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setAdminUser(u));
    return unsub;
  }, []);

  const clock = useClock();

  // ── Cargar datos del dashboard ──────────────────────────────
  const loadData = useCallback(async (showLoading=false, periodOnly=false) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      if (showLoading) setLoading(true);
      if (periodOnly) setChartLoading(true);
      setLoadError(null);

      const token = await currentUser.getIdToken();
      const [statsResult, feedResult, chartResult, leaderResult] = await Promise.all([
        getDashboardStats(token, period),
        getActivityFeed(token),
        getChartData(token, period),
        getWeeklyLeaderboard(token).catch(() => null),
      ]);

      if (statsResult?.ok === false || chartResult?.ok === false) {
        setLoadError("Algunos datos no se pudieron cargar.");
      }

      setDashboardStats(statsResult?.ok !== false ? statsResult : null);
      setActivityFeed(sortFeed(feedResult?.activities || []));
      setChartData(chartResult?.data || []);
      if (leaderResult) setWeeklyLeaderboard(leaderResult);
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL);
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      setLoadError("Error de conexión al servidor.");
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, [period]);

  // Carga inicial al montar (showLoading=true)
  // Recarga con indicador de chart-only al cambiar periodo
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadData(true);
    } else {
      loadData(false, true);   // periodOnly — charts spin, rest stays
    }
  }, [period]);

  // Auto-refresh cada 30s
  useEffect(() => {
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { return REFRESH_INTERVAL; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Derived values from activityFeed ──────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActivities = useMemo(() =>
    activityFeed.filter(a => (a.timestamp || a.date || "").slice(0, 10) === todayStr),
    [activityFeed, todayStr]
  );
  const todayXP = useMemo(() =>
    todayActivities.reduce((s, a) => s + (a.xpGained || a.xp || 0), 0),
    [todayActivities]
  );
  const todaySessions = useMemo(() => todayActivities.length, [todayActivities]);
  const newUsersToday = useMemo(() =>
    todayActivities.filter(a => a.type === "register" || a.type === "signup").length,
    [todayActivities]
  );

  // ── Nav badges from stats ──────────────────────────────────────
  const s = dashboardStats?.stats || {};
  const navBadges = useMemo(() => ({
    usuarios:   s.totalUsers   ? String(s.totalUsers)          : undefined,
    ejercicios: s.totalExercises ? String(s.totalExercises)    : undefined,
    misiones:   s.totalMissions  ? String(s.totalMissions)     : undefined,
    logros:     s.totalLogros    ? String(s.totalLogros)        : undefined,
  }), [s.totalUsers, s.totalExercises, s.totalMissions, s.totalLogros]);

  // ── Admin notifications ────────────────────────────────────────
  const adminNotifs = useMemo(() => {
    const notifs = [];
    const total  = s.totalUsers  || 0;
    const active = s.activeUsers || 0;
    if (total > 0 && active / total < 0.2)
      notifs.push({ id:"retention", icon:"⚠️", text:`Retención baja: solo ${active} de ${total} usuarios activos hoy`, read:false, color:C.orange });
    if (newUsersToday > 0)
      notifs.push({ id:"newusers",  icon:"🆕", text:`${newUsersToday} nuevo${newUsersToday!==1?"s":""} usuario${newUsersToday!==1?"s":""} hoy`, read:false, color:C.blue });
    if (todayXP > 5000)
      notifs.push({ id:"highxp",   icon:"⚡", text:`¡Día de alto rendimiento! +${todayXP.toLocaleString()} XP generados`, read:false, color:C.gold });
    if (todaySessions > 50)
      notifs.push({ id:"sessions", icon:"🔥", text:`${todaySessions} sesiones completadas hoy`, read:true, color:C.green });
    if (notifs.length === 0)
      notifs.push({ id:"ok", icon:"✅", text:"Sistema estable — sin alertas pendientes", read:true, color:C.green });
    return notifs;
  }, [s.totalUsers, s.activeUsers, newUsersToday, todayXP, todaySessions]);

  if (!fx) {
    return (
      <SimpleShell
        active={active} setActive={setActive}
        onLogout={onLogout} setFx={setFx}
        dashboardStats={dashboardStats}
      />
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden",position:"relative"}}>
        <AdminAurora/>

        {!isMobile && <Sidebar active={active} setActive={setActive} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} adminUser={adminUser} navBadges={navBadges}/>}

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1}}>
          <TopBar active={active} clock={clock} fx={fx} setFx={setFx} adminUser={adminUser} adminNotifs={adminNotifs}/>

          <div style={{flex:1,overflowY:"auto",padding:isMobile?"12px 10px":"20px 22px",paddingBottom:isMobile?"80px":"20px",background:"transparent",position:"relative"}}>
            <AnimatePresence mode="wait">
              {active==="dashboard" && (
                <motion.div key="dashboard"
                  initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  transition={{duration:0.3}}>
                  <DashboardView
                    dashboardStats={dashboardStats}
                    activityFeed={activityFeed}
                    chartData={chartData}
                    period={period}
                    setPeriod={setPeriod}
                    loading={loading}
                    chartLoading={chartLoading}
                    loadError={loadError}
                    lastUpdated={lastUpdated}
                    nextIn={countdown}
                    onRefresh={()=>loadData(true)}
                    setActive={setActive}
                    isMobile={isMobile}
                    todayXP={todayXP}
                    todaySessions={todaySessions}
                    newUsersToday={newUsersToday}
                    weeklyLeaderboard={weeklyLeaderboard}
                  />
                </motion.div>
              )}
              {active==="usuarios"   && <motion.div key="usuarios"   initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminUsuarios   fx={fx}/></motion.div>}
              {active==="ejercicios" && <motion.div key="ejercicios" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminEjercicios  fx={fx}/></motion.div>}
              {active==="rutinas"    && <motion.div key="rutinas"    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminRutinas     fx={fx}/></motion.div>}
              {active==="misiones"   && <motion.div key="misiones"   initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminMisiones    fx={fx}/></motion.div>}
              {active==="objetos"    && <motion.div key="objetos"    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminObjetos     fx={fx}/></motion.div>}
              {active==="logros"     && <motion.div key="logros"     initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminLogros      fx={fx}/></motion.div>}
              {active==="stats"      && <motion.div key="stats"      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminStats       fx={fx}/></motion.div>}
              {active==="mensajes"   && <motion.div key="mensajes"   initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminMensajes    fx={fx}/></motion.div>}
              {active==="feedback"   && <motion.div key="feedback"   initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminFeedback/></motion.div>}
              {active==="mente"      && <motion.div key="mente"      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminMente/></motion.div>}
              {active==="config"     && <motion.div key="config"     initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><AdminConfig      fx={fx}/></motion.div>}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══ ADMIN MOBILE BOTTOM NAV ══ */}
      {isMobile && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:200,
          background:C.side, borderTop:`1px solid ${C.navy}66`,
          display:"flex", alignItems:"stretch",
          boxShadow:`0 -4px 24px rgba(0,0,0,.5)`,
          height:62, overflowX:"auto",
        }}>
          {NAV_ITEMS.map(n => {
            const on = active === n.id;
            return (
              <button key={n.id} onClick={() => setActive(n.id)}
                style={{
                  flex:"0 0 auto", minWidth:56, display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", gap:3,
                  background: on ? `${n.color}14` : "transparent",
                  border:"none", borderTop:`2px solid ${on ? n.color : "transparent"}`,
                  cursor:"pointer", padding:"6px 8px",
                  transition:"all .15s",
                }}>
                <n.icon size={16} color={on ? n.color : C.muted}/>
                <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:8,fontWeight:700,
                  color:on?n.color:C.muted,letterSpacing:".04em",whiteSpace:"nowrap"}}>
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
