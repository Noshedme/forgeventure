// src/pages/admin/AdminDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  ForgeVenture — Admin Dashboard — Visual Edition
//  Misma funcionalidad, máximo impacto visual.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import AdminUsuarios   from "./AdminUsuarios";
import AdminEjercicios from "./AdminEjercicios";
import AdminRutinas    from "./AdminRutinas";
import AdminMisiones   from "./AdminMisiones";
import AdminObjetos    from "./AdminObjetos";
import AdminLogros     from "./AdminLogros";
import AdminStats      from "./AdminStats";
import AdminConfig     from "./AdminConfig";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, Users, Dumbbell, ClipboardList,
  Target, Package, Trophy, BarChart2, Settings,
  LogOut, Bell, Search, Plus, RefreshCw, Zap,
  TrendingUp, TrendingDown, Activity, Shield,
  ChevronRight, Eye, Edit2, Trash2,
  AlertTriangle, CheckCircle, ChevronLeft, Menu,
} from "lucide-react";

// ── Fonts ──────────────────────────────────────────────────────
if (!document.getElementById("fv-adm-fonts")) {
  const l = document.createElement("link");
  l.id = "fv-adm-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap";
  document.head.appendChild(l);
}

// ── Paleta ─────────────────────────────────────────────────────
const C = {
  bg:"#050C18", side:"#06101E", card:"#0B1724", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

// ── CSS global ─────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

  /* ── keyframes ── */
  @keyframes adm-glow      { 0%,100%{text-shadow:0 0 16px #E85D04,0 0 32px #E85D0444} 50%{text-shadow:0 0 30px #E85D04,0 0 60px #E85D0477,0 0 90px #E85D0422} }
  @keyframes adm-glowBlue  { 0%,100%{box-shadow:0 0 12px #4CC9F044} 50%{box-shadow:0 0 26px #4CC9F088,0 0 50px #4CC9F033} }
  @keyframes adm-glowGold  { 0%,100%{box-shadow:0 0 12px #FFD70044} 50%{box-shadow:0 0 26px #FFD70088,0 0 50px #FFD70033} }
  @keyframes adm-pulse     { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes adm-blink     { 0%,100%{opacity:1} 45%,55%{opacity:0} }
  @keyframes adm-scan      { 0%{top:-2px;opacity:.8} 70%{opacity:.6} 100%{top:100%;opacity:0} }
  @keyframes adm-scanH     { 0%{left:-2px} 100%{left:100%} }
  @keyframes adm-slideL    { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
  @keyframes adm-slideU    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes adm-fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes adm-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes adm-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes adm-floatX    { 0%,100%{transform:translateX(0)} 50%{transform:translateX(8px)} }
  @keyframes adm-barFill   { from{width:0} to{width:var(--bw)} }
  @keyframes adm-ping      { 0%{transform:scale(1);opacity:.9} 80%,100%{transform:scale(2.4);opacity:0} }
  @keyframes adm-neon      { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:.5} }
  @keyframes adm-cardIn    { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes adm-numberIn  { from{opacity:0;transform:scale(.6) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes adm-shimmer   { 0%{left:-100%} 100%{left:200%} }
  @keyframes adm-borderGlow{ 0%,100%{border-color:#E85D0455;box-shadow:0 0 8px #E85D0422} 50%{border-color:#E85D04;box-shadow:0 0 20px #E85D0466,inset 0 0 8px #E85D0411} }
  @keyframes adm-rotate    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes adm-ticker    { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
  @keyframes adm-rgbShift  { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
  @keyframes adm-orb1      { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-20px,15px)} }
  @keyframes adm-orb2      { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-25px,20px)} 66%{transform:translate(20px,-10px)} }
  @keyframes adm-orb3      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,25px)} }

  /* ── base ── */
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { height:100%; overflow:hidden; }
  body { background:${C.bg}; font-family:'Rajdhani',sans-serif; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${C.panel}; }
  ::-webkit-scrollbar-thumb { background:linear-gradient(180deg,${C.orange},${C.orangeL}); border-radius:0; }
  ::selection { background:${C.orange}44; color:${C.white}; }

  /* ── nav items ── */
  .adm-nav { transition:all .2s; cursor:pointer; position:relative; overflow:hidden; }
  .adm-nav::before { content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,${C.orange}08,transparent); transform:translateX(-100%); transition:transform .3s; }
  .adm-nav:hover::before { transform:translateX(100%); }
  .adm-nav:hover { background:${C.navyL}25 !important; }

  /* ── kpi cards ── */
  .adm-kpi { transition:transform .25s, box-shadow .25s; cursor:default; }
  .adm-kpi:hover { transform:translateY(-5px) scale(1.01); }
  .adm-kpi .adm-kpi-shimmer { position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent); pointer-events:none; }
  .adm-kpi:hover .adm-kpi-shimmer { animation:adm-shimmer .6s ease; }

  /* ── rows ── */
  .adm-row { transition:background .15s; }
  .adm-row:hover { background:${C.navyL}20 !important; }
  .adm-row:hover .adm-row-arrow { opacity:1 !important; transform:translateX(4px) !important; }
  .adm-row-arrow { opacity:0; transform:translateX(0); transition:all .2s; }

  /* ── btns ── */
  .adm-btn { transition:all .2s; cursor:pointer; position:relative; overflow:hidden; }
  .adm-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .adm-btn::after { content:""; position:absolute; inset:0; background:rgba(255,255,255,.06); opacity:0; transition:opacity .2s; }
  .adm-btn:hover::after { opacity:1; }

  .adm-icon-btn { transition:all .2s; cursor:pointer; }
  .adm-icon-btn:hover { transform:scale(1.12); }

  /* ── action cards ── */
  .adm-action { transition:all .22s; cursor:pointer; position:relative; overflow:hidden; }
  .adm-action::after { content:""; position:absolute; inset:0; background:linear-gradient(135deg,transparent 40%,rgba(255,255,255,.03) 100%); opacity:0; transition:opacity .2s; }
  .adm-action:hover::after { opacity:1; }
  .adm-action:hover { transform:translateY(-4px) !important; }

  /* ── recharts ── */
  .recharts-tooltip-wrapper { font-family:'Rajdhani',sans-serif !important; }
  .recharts-text { font-family:'Rajdhani',sans-serif !important; }
`;


// ── SIMPLE MODE CSS — sobrescribe efectos pesados ──────────────
// (legacy SIMPLE_CSS removed — modo simple usa SimpleShell independiente)

// ── Helpers ────────────────────────────────────────────────────
const px  = s => ({fontFamily:"'Press Start 2P'",fontSize:s});
const orb = (s,w=700) => ({fontFamily:"'Orbitron',sans-serif",fontSize:s,fontWeight:w});
const raj = (s,w=600) => ({fontFamily:"'Rajdhani',sans-serif",fontSize:s,fontWeight:w});

// ── Mock data ──────────────────────────────────────────────────
const DATA_REGISTROS = [
  {dia:"Lun",users:12,xp:4400},{dia:"Mar",users:19,xp:6800},{dia:"Mié",users:8,xp:3200},
  {dia:"Jue",users:27,xp:9100},{dia:"Vie",users:34,xp:11200},{dia:"Sáb",users:41,xp:14800},
  {dia:"Dom",users:22,xp:7600},
];
const DATA_EJERCICIOS = [
  {name:"Flexiones",sesiones:148},{name:"Sentadillas",sesiones:132},{name:"Cardio",sesiones:118},
  {name:"Plancha",sesiones:89},{name:"Dominadas",sesiones:67},{name:"Yoga",sesiones:54},
];
const DATA_CLASES = [
  {name:"GUERRERO",value:48,color:C.orange},
  {name:"ARQUERO", value:31,color:C.blue},
  {name:"MAGO",    value:21,color:C.purple},
];
const RECENT_USERS = [
  {id:1,name:"Aragorn_Dev",  email:"aragorn@mail.com",  cls:"GUERRERO",lvl:12,xp:2840,streak:14,status:"active",  joined:"hace 2h"},
  {id:2,name:"LegolasRunner",email:"legolas@mail.com",  cls:"ARQUERO", lvl:8, xp:1920,streak:7, status:"active",  joined:"hace 5h"},
  {id:3,name:"GandalfZen",   email:"gandalf@mail.com",  cls:"MAGO",    lvl:21,xp:5600,streak:30,status:"active",  joined:"hace 1d"},
  {id:4,name:"SauronFit",    email:"sauron@mail.com",   cls:"GUERRERO",lvl:3, xp:480, streak:0, status:"inactive",joined:"hace 3d"},
  {id:5,name:"FrodoBags",    email:"frodo@mail.com",    cls:"MAGO",    lvl:6, xp:1100,streak:4, status:"active",  joined:"hace 4d"},
];
const ACTIVITY_FEED = [
  {icon:"🆕",msg:"FrodoBags completó misión diaria +150 XP",    time:"hace 3m",  color:C.green },
  {icon:"⚔️",msg:"Aragorn_Dev alcanzó Nivel 12",                 time:"hace 8m",  color:C.gold  },
  {icon:"🏆",msg:"LegolasRunner desbloqueó 'Sprint Épico'",     time:"hace 15m", color:C.orange},
  {icon:"👤",msg:"Nuevo usuario: SirPercival_99",               time:"hace 22m", color:C.blue  },
  {icon:"📋",msg:"Rutina 'HIIT Extremo' creada por admin",      time:"hace 1h",  color:C.teal  },
  {icon:"⚠️",msg:"SauronFit sin actividad por 3 días",          time:"hace 2h",  color:C.red   },
  {icon:"🎯",msg:"Misión semanal 'Maestro del Cardio' activada",time:"hace 3h",  color:C.purple},
];
const NEW_ACTIVITY_MSGS = [
  {icon:"💪",msg:"XaduFighter completó 40 flexiones +80 XP",   color:C.green },
  {icon:"🎯",msg:"MageOfLight finalizó misión 'Flex Maestro'",  color:C.teal  },
  {icon:"⚡",msg:"IronWarrior alcanzó racha de 10 días",        color:C.gold  },
  {icon:"🆕",msg:"NuevoHéroe_77 completó registro",             color:C.blue  },
];

const NAV_ITEMS = [
  {id:"dashboard",  icon:LayoutDashboard,label:"Dashboard",    badge:null,  color:C.orange},
  {id:"usuarios",   icon:Users,          label:"Usuarios",     badge:"163", color:C.blue  },
  {id:"ejercicios", icon:Dumbbell,       label:"Ejercicios",   badge:"50",  color:C.orange},
  {id:"rutinas",    icon:ClipboardList,  label:"Rutinas",      badge:"24",  color:C.teal  },
  {id:"misiones",   icon:Target,         label:"Misiones",     badge:"12",  color:C.gold  },
  {id:"objetos",    icon:Package,        label:"Objetos",      badge:"38",  color:C.purple},
  {id:"logros",     icon:Trophy,         label:"Logros",       badge:"30",  color:C.gold  },
  {id:"stats",      icon:BarChart2,      label:"Estadísticas", badge:null,  color:C.blue  },
  {id:"config",     icon:Settings,       label:"Config",       badge:null,  color:C.muted },
];
const CLS_COLOR = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
const CLS_ICON  = {GUERRERO:"⚔️",ARQUERO:"🏃",MAGO:"🧘"};

// ── Live clock ─────────────────────────────────────────────────
function useClock() {
  const [t,setT] = useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setT(new Date()),1000); return()=>clearInterval(id); },[]);
  return t;
}

// ── Animated counter ───────────────────────────────────────────
function Counter({target, duration=1200, prefix="", suffix=""}) {
  const [val,setVal] = useState(0);
  const raw = parseInt(String(target).replace(/\D/g,""))||0;
  useEffect(()=>{
    let start=null;
    const step=(ts)=>{
      if(!start) start=ts;
      const p=Math.min((ts-start)/duration,1);
      const ease = 1-Math.pow(1-p,3);
      setVal(Math.floor(ease*raw));
      if(p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },[raw,duration]);
  const display = typeof target==="string"&&isNaN(Number(target.replace(/[^0-9.]/g,"")))
    ? target
    : prefix+(val>=1000?(val>=1000000?(val/1000000).toFixed(1)+"M":(val>=10000?(val/1000).toFixed(1)+"K":val.toLocaleString())):val)+suffix;
  return <span>{display}</span>;
}

// ── Floating glow orb ──────────────────────────────────────────
function GlowOrb({color,size,x,y,opacity=0.12,anim="adm-orb1",duration="12s"}) {
  return (
    <div data-orb="" style={{position:"absolute",left:x,top:y,width:size,height:size,borderRadius:"50%",
      background:color,filter:`blur(${size*.6}px)`,opacity,
      transform:"translate(-50%,-50%)",pointerEvents:"none",
      animation:`${anim} ${duration} ease-in-out infinite`}}/>
  );
}

// ── Scan line horizontal ───────────────────────────────────────
function ScanLine({speed="7s",color=C.orange,opacity=0.4}) {
  return (
    <div data-scan="" style={{position:"absolute",left:0,right:0,height:1,
      background:`linear-gradient(90deg,transparent,${color}${Math.round(opacity*255).toString(16).padStart(2,"0")},${color},${color}${Math.round(opacity*255).toString(16).padStart(2,"0")},transparent)`,
      animation:`adm-scan ${speed} linear infinite`,
      pointerEvents:"none",zIndex:1}}/>
  );
}

// ── Grid background ────────────────────────────────────────────
function GridBg({opacity=0.06}) {
  return (
    <div data-deco="" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
      backgroundImage:`linear-gradient(${C.navy}${Math.round(opacity*255).toString(16).padStart(2,"0")} 1px,transparent 1px),linear-gradient(90deg,${C.navy}${Math.round(opacity*255).toString(16).padStart(2,"0")} 1px,transparent 1px)`,
      backgroundSize:"48px 48px"}}/>
  );
}

// ── Corner decoration ──────────────────────────────────────────
function CornerDeco({color=C.orange,size=12,pos="tl"}) {
  const top=pos.includes("t")?0:undefined;
  const bottom=pos.includes("b")?0:undefined;
  const left=pos.includes("l")?0:undefined;
  const right=pos.includes("r")?0:undefined;
  return (
    <div data-corner="" style={{position:"absolute",top,bottom,left,right,pointerEvents:"none"}}>
      <div style={{width:size,height:2,background:color,opacity:.7,
        [pos.includes("r")?"marginLeft":"marginRight"]:"auto"}}/>
      <div style={{width:2,height:size,background:color,opacity:.7,
        [pos.includes("r")?"marginLeft":"marginRight"]:"auto"}}/>
    </div>
  );
}

// ── Custom chart tooltip ───────────────────────────────────────
function FvTooltip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.panel,border:`1px solid ${C.navyL}`,padding:"10px 14px",
      boxShadow:`0 8px 24px rgba(0,0,0,.5),0 0 0 1px ${C.orange}22`}}>
      <div style={{...raj(13,700),color:C.white,marginBottom:6,borderBottom:`1px solid ${C.navy}`,paddingBottom:5}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,...raj(12,600),color:p.color,marginBottom:2}}>
          <div style={{width:8,height:8,background:p.color,boxShadow:`0 0 4px ${p.color}`}}/>
          {p.name}: <span style={{fontWeight:700}}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// KPI CARD — visual premium
// ══════════════════════════════════════════════════════════════
function KpiCard({icon:Icon,label,value,sub,color,trend,delay=0}) {
  const isNeg = trend<0;
  return (
    <div className="adm-kpi" style={{
      background:`linear-gradient(135deg,${C.card} 0%,${C.panel} 100%)`,
      border:`1px solid ${color}33`,
      padding:"22px 20px",position:"relative",overflow:"hidden",
      boxShadow:`0 4px 24px rgba(0,0,0,.4),inset 0 1px 0 ${color}11`,
      animation:`adm-cardIn .5s ease ${delay}s both`,
    }}>
      {/* Shimmer effect */}
      <div className="adm-kpi-shimmer"/>
      {/* Top accent bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${color}99,${color},${color}99,transparent)`}}/>
      {/* Corner decorations */}
      <CornerDeco color={color} size={10} pos="tl"/>
      <CornerDeco color={color} size={10} pos="br"/>
      {/* BG glow orb */}
      <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",
        background:color,filter:"blur(55px)",opacity:.07,pointerEvents:"none",
        animation:"adm-float 4s ease-in-out infinite"}}/>

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,position:"relative",zIndex:1}}>
        <div style={{background:`${color}18`,border:`1px solid ${color}33`,padding:"10px",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:`0 0 14px ${color}22`,position:"relative"}}>
          <Icon size={20} color={color}/>
          {/* Icon glow */}
          <div style={{position:"absolute",inset:0,background:color,filter:"blur(8px)",opacity:.15}}/>
        </div>
        {trend!==undefined&&(
          <div style={{display:"flex",alignItems:"center",gap:4,...raj(12,700),
            color:isNeg?C.red:C.green,
            background:isNeg?`${C.red}14`:`${C.green}14`,
            border:`1px solid ${isNeg?C.red:C.green}33`,
            padding:"3px 9px"}}>
            {isNeg?<TrendingDown size={12}/>:<TrendingUp size={12}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{...orb("clamp(20px,2.2vw,28px)",900),color,marginBottom:5,
        animation:`adm-numberIn .6s ease ${delay+.1}s both`,position:"relative",zIndex:1,
        textShadow:`0 0 20px ${color}55`}}>
        <Counter target={value}/>
      </div>
      <div style={{...raj(13,700),color:C.white,marginBottom:3,letterSpacing:".03em",position:"relative",zIndex:1}}>{label}</div>
      <div style={{...raj(11,500),color:C.muted,position:"relative",zIndex:1}}>{sub}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════
function Sidebar({active,setActive,onLogout,collapsed,setCollapsed}) {
  const W = collapsed ? 64 : 230;
  return (
    <div style={{
      width:W,flexShrink:0,
      background:`linear-gradient(180deg,${C.side} 0%,#040A14 100%)`,
      borderRight:`1px solid ${C.navy}66`,
      display:"flex",flexDirection:"column",height:"100vh",
      position:"relative",zIndex:10,
      transition:"width .3s ease",overflow:"hidden",
    }}>
      {/* Scan line on sidebar */}
      <ScanLine speed="9s" color={C.orange} opacity={0.3}/>

      {/* Side accent */}
      <div style={{position:"absolute",top:0,right:0,bottom:0,width:1,
        background:`linear-gradient(180deg,transparent,${C.orange}55,transparent)`,
        pointerEvents:"none"}}/>

      {/* Logo */}
      <div style={{padding:collapsed?"16px 0":"18px 16px",borderBottom:`1px solid ${C.navy}44`,
        display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",
        flexShrink:0,position:"relative",zIndex:2}}>
        {!collapsed&&(
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span style={{fontSize:18,filter:`drop-shadow(0 0 8px ${C.orange})`}}>⚔️</span>
            <span style={{...px(8),color:C.orange,animation:"adm-neon 6s ease-in-out infinite",whiteSpace:"nowrap"}}>FORGE</span>
            <span style={{...px(8),color:C.white,whiteSpace:"nowrap"}}>VENTURE</span>
          </div>
        )}
        {collapsed&&<span style={{fontSize:18,filter:`drop-shadow(0 0 8px ${C.orange})`}}>⚔️</span>}
        <button onClick={()=>setCollapsed(v=>!v)}
          style={{background:"transparent",border:`1px solid ${C.navy}`,padding:5,
            color:C.muted,cursor:"pointer",display:"flex",flexShrink:0,
            marginLeft:collapsed?0:8,transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;e.currentTarget.style.color=C.orange;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.muted;}}>
          {collapsed?<ChevronRight size={13}/>:<ChevronLeft size={13}/>}
        </button>
      </div>

      {/* Admin badge */}
      {!collapsed&&(
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.navy}44`,flexShrink:0,position:"relative",zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Shield size={11} color={C.orange}/>
            <span style={{...raj(11,600),color:C.muted,letterSpacing:".12em"}}>PANEL DE ADMINISTRACIÓN</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{flex:1,padding:"8px 0",overflowY:"auto",position:"relative",zIndex:2}}>
        {NAV_ITEMS.map((item,i)=>{
          const isActive=active===item.id;
          return (
            <div key={item.id} className="adm-nav"
              onClick={()=>setActive(item.id)}
              title={collapsed?item.label:undefined}
              style={{
                display:"flex",alignItems:"center",
                gap:collapsed?0:10,
                padding:collapsed?"12px 0":"10px 16px",
                justifyContent:collapsed?"center":"flex-start",
                borderLeft:`3px solid ${isActive?item.color:"transparent"}`,
                background:isActive?`${item.color}12`:"transparent",
                animation:`adm-slideL .35s ease ${i*.04}s both`,
                marginBottom:1,position:"relative",
                transition:"all .2s",
              }}>
              {/* Active indicator glow */}
              {isActive&&(
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
                  background:item.color,boxShadow:`0 0 10px ${item.color},0 0 20px ${item.color}55`}}/>
              )}
              <item.icon size={15} color={isActive?item.color:C.muted}
                style={{filter:isActive?`drop-shadow(0 0 4px ${item.color})`:"none",flexShrink:0}}/>
              {!collapsed&&(
                <>
                  <span style={{...raj(12,isActive?700:500),color:isActive?item.color:C.mutedL,flex:1,letterSpacing:".02em",whiteSpace:"nowrap"}}>
                    {item.label}
                  </span>
                  {item.badge&&(
                    <span style={{...raj(9,700),
                      background:isActive?item.color:`${C.navyL}88`,
                      color:isActive?C.bg:C.muted,
                      padding:"1px 6px",minWidth:22,textAlign:"center",fontSize:9}}>
                      {item.badge}
                    </span>
                  )}
                  {isActive&&<ChevronRight size={11} color={item.color} style={{opacity:.6}}/>}
                </>
              )}
              {collapsed&&item.badge&&(
                <div style={{position:"absolute",top:8,right:8,width:6,height:6,
                  background:item.color,borderRadius:"50%",animation:"adm-pulse 1.5s infinite"}}/>
              )}
            </div>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div style={{padding:collapsed?"12px 0":"14px 14px",borderTop:`1px solid ${C.navy}44`,flexShrink:0,position:"relative",zIndex:2}}>
        {!collapsed&&(
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:32,height:32,background:`${C.orange}18`,border:`1px solid ${C.orange}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,
              boxShadow:`0 0 10px ${C.orange}22`}}>
              🛡️
            </div>
            <div style={{minWidth:0}}>
              <div style={{...raj(12,700),color:C.white}}>Administrador</div>
              <div style={{...raj(10,600),color:C.orange}}>Acceso Total</div>
            </div>
            <div style={{marginLeft:"auto",position:"relative",flexShrink:0}}>
              <div style={{width:7,height:7,background:C.green,borderRadius:"50%"}}/>
              <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"adm-ping 1.8s infinite"}}/>
            </div>
          </div>
        )}
        {collapsed&&(
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <div style={{width:28,height:28,background:`${C.orange}18`,border:`1px solid ${C.orange}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🛡️</div>
          </div>
        )}
        <button className="adm-btn" onClick={onLogout}
          style={{width:"100%",display:"flex",alignItems:"center",
            gap:collapsed?0:8,justifyContent:collapsed?"center":"flex-start",
            background:"transparent",border:`1px solid ${C.navy}55`,
            color:C.muted,padding:collapsed?"8px 0":"8px 12px",
            ...raj(11,600),letterSpacing:".05em",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=`${C.red}55`;e.currentTarget.style.color=C.red;e.currentTarget.style.background=`${C.red}0A`;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=`${C.navy}55`;e.currentTarget.style.color=C.muted;e.currentTarget.style.background="transparent";}}>
          <LogOut size={13}/>
          {!collapsed&&" SALIR"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TOPBAR
// ══════════════════════════════════════════════════════════════
function TopBar({active,clock,notifications,fx,setFx}) {
  const sec = NAV_ITEMS.find(n=>n.id===active);
  const SectionIcon = sec?.icon||LayoutDashboard;
  const color = sec?.color||C.orange;
  return (
    <div style={{
      height:56,flexShrink:0,
      background:`linear-gradient(90deg,${C.side} 0%,#06101E 100%)`,
      borderBottom:`1px solid ${C.navy}66`,
      display:"flex",alignItems:"center",padding:"0 20px",gap:14,
      position:"relative",overflow:"hidden",
    }}>
      {/* bottom accent */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${color}55,transparent)`}}/>

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
        <SectionIcon size={15} color={color} style={{filter:`drop-shadow(0 0 4px ${color}66)`,flexShrink:0}}/>
        <span style={{...orb(12,700),color:C.white,letterSpacing:".05em",whiteSpace:"nowrap"}}>{sec?.label||"Dashboard"}</span>
        <ChevronRight size={13} color={C.muted}/>
        <span style={{...raj(12,500),color:C.muted,whiteSpace:"nowrap"}}>Panel de control</span>
      </div>

      {/* Search */}
      <div style={{position:"relative",flex:"0 0 220px"}}>
        <Search size={12} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
        <input placeholder="Buscar..."
          style={{background:C.panel,border:`1px solid ${C.navy}`,color:C.white,
            padding:"7px 12px 7px 28px",...raj(12,500),width:"100%",
            outline:"none",transition:"all .2s"}}
          onFocus={e=>{e.target.style.borderColor=C.orange;e.target.style.boxShadow=`0 0 0 2px ${C.orange}22`;}}
          onBlur={e=>{e.target.style.borderColor=C.navy;e.target.style.boxShadow="none";}}/>
      </div>

      {/* Live badge */}
      <div style={{display:"flex",alignItems:"center",gap:6,background:`${C.green}10`,
        border:`1px solid ${C.green}33`,padding:"5px 10px",flexShrink:0}}>
        <div style={{width:6,height:6,background:C.green,borderRadius:"50%",animation:"adm-blink 1.2s ease-in-out infinite"}}/>
        <span style={{...raj(10,700),color:C.green,letterSpacing:".1em"}}>EN VIVO</span>
      </div>

      {/* Notifications */}
      <button className="adm-icon-btn" style={{position:"relative",background:"transparent",
        border:`1px solid ${C.navy}`,padding:"7px",color:C.muted,display:"flex",
        transition:"all .2s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;e.currentTarget.style.color=C.orange;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.muted;}}>
        <Bell size={15}/>
        {notifications>0&&(
          <>
            <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,
              background:C.orange,color:C.bg,...px(5),
              display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%"}}>
              {notifications}
            </span>
            <div style={{position:"absolute",top:-4,right:-4,width:16,height:16,
              background:C.orange,borderRadius:"50%",animation:"adm-ping 1.5s infinite"}}/>
          </>
        )}
      </button>


      {/* FX Toggle */}
      <button className="adm-fx-btn" onClick={()=>setFx(v=>!v)}
        title={fx?"Modo simple (menos efectos)":"Modo visual completo"}
        style={{
          display:"flex",alignItems:"center",gap:7,
          background:fx?`${C.orange}14`:`${C.navy}44`,
          border:`1px solid ${fx?C.orange:C.navy}`,
          padding:"6px 12px",color:fx?C.orange:C.muted,
          ...raj(11,700),letterSpacing:".06em",flexShrink:0,
          boxShadow:fx?`0 0 10px ${C.orange}22`:"none",
        }}>
        <span style={{fontSize:13}}>{fx?"✦":"◇"}</span>
        {fx?"FX ON":"FX OFF"}
      </button>

      {/* Clock */}
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
// QUICK ACTIONS
// ══════════════════════════════════════════════════════════════
function QuickActions() {
  const actions=[
    {icon:"👤",label:"Usuario",   color:C.blue,   desc:"Crear cuenta"      },
    {icon:"💪",label:"Ejercicio", color:C.orange, desc:"Al catálogo"       },
    {icon:"📋",label:"Rutina",    color:C.teal,   desc:"Diseñar rutina"    },
    {icon:"🎯",label:"Misión",    color:C.gold,   desc:"Quest diaria"      },
    {icon:"🎒",label:"Objeto",    color:C.purple, desc:"Item del shop"     },
    {icon:"🏆",label:"Logro",     color:C.green,  desc:"Badge nuevo"       },
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:18}}>
      {actions.map((a,i)=>(
        <button key={i} className="adm-action" style={{
          background:`linear-gradient(135deg,${C.card},${C.panel})`,
          border:`1px solid ${a.color}22`,
          padding:"14px 10px",display:"flex",flexDirection:"column",
          alignItems:"center",gap:6,cursor:"pointer",
          boxShadow:`0 3px 14px rgba(0,0,0,.35)`,
          animation:`adm-cardIn .4s ease ${i*.06}s both`,
          position:"relative",overflow:"hidden",
        }}
          onMouseEnter={e=>{
            e.currentTarget.style.borderColor=a.color;
            e.currentTarget.style.boxShadow=`0 8px 28px ${a.color}33,0 0 0 1px ${a.color}44`;
            e.currentTarget.style.background=`linear-gradient(135deg,${a.color}0A,${C.panel})`;
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.borderColor=`${a.color}22`;
            e.currentTarget.style.boxShadow="0 3px 14px rgba(0,0,0,.35)";
            e.currentTarget.style.background=`linear-gradient(135deg,${C.card},${C.panel})`;
          }}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${a.color}66,transparent)`,opacity:.8}}/>
          <CornerDeco color={a.color} size={8} pos="tl"/>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:20,filter:`drop-shadow(0 0 6px ${a.color}88)`}}>{a.icon}</span>
            <Plus size={11} color={a.color} style={{opacity:.8}}/>
          </div>
          <div style={{...raj(12,700),color:C.white,textAlign:"center"}}>{a.label}</div>
          <div style={{...raj(9,500),color:C.muted,textAlign:"center"}}>{a.desc}</div>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// USERS TABLE
// ══════════════════════════════════════════════════════════════
function UsersTable() {
  return (
    <div style={{background:`linear-gradient(180deg,${C.card},${C.panel})`,
      border:`1px solid ${C.navy}`,position:"relative",overflow:"hidden",
      animation:"adm-cardIn .5s ease .3s both"}}>
      {/* top accent */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.orange}66,transparent)`}}/>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 20px",borderBottom:`1px solid ${C.navy}55`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Users size={15} color={C.orange} style={{filter:`drop-shadow(0 0 4px ${C.orange}66)`}}/>
          <span style={{...orb(11,700),color:C.white}}>USUARIOS RECIENTES</span>
          <span style={{...raj(10,700),background:`${C.orange}18`,color:C.orange,
            border:`1px solid ${C.orange}33`,padding:"2px 8px"}}>163 total</span>
        </div>
        <button className="adm-btn" style={{display:"flex",alignItems:"center",gap:6,
          background:C.orange,border:"none",color:C.bg,padding:"7px 14px",
          ...raj(11,700),boxShadow:`0 3px 14px ${C.orange}44`}}>
          <Plus size={12}/> VER TODOS
        </button>
      </div>

      {/* table head */}
      <div style={{display:"grid",gridTemplateColumns:"2fr .8fr .6fr 1fr .7fr .8fr",
        padding:"9px 20px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}44`,gap:8}}>
        {["USUARIO","CLASE","NIVEL","XP","RACHA","ACCIONES"].map(h=>(
          <span key={h} style={{...px(5),color:C.muted,letterSpacing:".07em"}}>{h}</span>
        ))}
      </div>

      {RECENT_USERS.map((u,i)=>(
        <div key={u.id} className="adm-row" style={{
          display:"grid",gridTemplateColumns:"2fr .8fr .6fr 1fr .7fr .8fr",
          padding:"11px 20px",borderBottom:`1px solid ${C.navy}22`,
          animation:`adm-slideU .35s ease ${i*.07}s both`,
          alignItems:"center",gap:8,position:"relative",
        }}>
          {/* User */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,background:`${CLS_COLOR[u.cls]}18`,
              border:`1px solid ${CLS_COLOR[u.cls]}44`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:15,flexShrink:0,
              boxShadow:`0 0 8px ${CLS_COLOR[u.cls]}22`}}>
              {CLS_ICON[u.cls]}
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
          {/* Clase */}
          <span style={{...raj(11,700),color:CLS_COLOR[u.cls],
            background:`${CLS_COLOR[u.cls]}10`,border:`1px solid ${CLS_COLOR[u.cls]}33`,
            padding:"2px 7px",display:"inline-block",
            textShadow:`0 0 8px ${CLS_COLOR[u.cls]}44`}}>
            {u.cls}
          </span>
          {/* Nivel */}
          <span style={{...orb(13,900),color:C.gold,
            textShadow:`0 0 10px ${C.gold}55`}}>
            Lv.{u.lvl}
          </span>
          {/* XP */}
          <span style={{...raj(12,600),color:C.orange}}>{u.xp.toLocaleString()} XP</span>
          {/* Racha */}
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{filter:u.streak>0?"drop-shadow(0 0 3px #FF9F1C)":"none",fontSize:12}}>🔥</span>
            <span style={{...raj(12,600),color:u.streak>0?C.orangeL:C.muted}}>{u.streak}d</span>
          </div>
          {/* Actions */}
          <div style={{display:"flex",gap:5}}>
            {[{Icon:Eye,c:C.blue},{Icon:Edit2,c:C.orange},{Icon:Trash2,c:C.red}].map(({Icon:Ic,c},j)=>(
              <button key={j} className="adm-icon-btn"
                style={{background:"transparent",border:`1px solid ${c}33`,
                  padding:"5px",color:c,display:"flex",alignItems:"center"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${c}18`;e.currentTarget.style.borderColor=c;e.currentTarget.style.boxShadow=`0 0 8px ${c}33`;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${c}33`;e.currentTarget.style.boxShadow="none";}}>
                <Ic size={12}/>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ══════════════════════════════════════════════════════════════
function ActivityFeed() {
  const [items,setItems] = useState(ACTIVITY_FEED);
  const [newIdx,setNewIdx] = useState(null);
  useEffect(()=>{
    const id=setInterval(()=>{
      const next=NEW_ACTIVITY_MSGS[Math.floor(Math.random()*NEW_ACTIVITY_MSGS.length)];
      setItems(prev=>[{...next,time:"ahora"},...prev.slice(0,9)]);
      setNewIdx(0);
      setTimeout(()=>setNewIdx(null),800);
    },7000);
    return()=>clearInterval(id);
  },[]);

  return (
    <div style={{background:`linear-gradient(180deg,${C.card},${C.panel})`,
      border:`1px solid ${C.navy}`,
      display:"flex",flexDirection:"column",height:"100%",
      animation:"adm-cardIn .5s ease .4s both",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.teal}66,transparent)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,
        padding:"14px 16px",borderBottom:`1px solid ${C.navy}55`,flexShrink:0}}>
        <Activity size={14} color={C.teal} style={{filter:`drop-shadow(0 0 4px ${C.teal}66)`}}/>
        <span style={{...orb(10,700),color:C.white}}>ACTIVIDAD EN VIVO</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
          <div style={{position:"relative"}}>
            <div style={{width:7,height:7,background:C.green,borderRadius:"50%",animation:"adm-blink 1s infinite"}}/>
            <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"adm-ping 1.5s infinite"}}/>
          </div>
          <span style={{...raj(10,700),color:C.green,letterSpacing:".08em"}}>LIVE</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {items.map((a,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 14px",
            borderBottom:`1px solid ${C.navy}22`,
            animation:i===0&&newIdx===0?"adm-slideU .3s ease both":"none",
            background:i===0&&newIdx===0?`${a.color}0A`:"transparent",
            transition:"background .4s",position:"relative",
          }}>
            {/* left color indicator */}
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,
              background:i===0?`linear-gradient(180deg,${a.color},transparent)`:
                `${a.color}33`,
              opacity:i===0?1:.5}}/>
            <div style={{fontSize:14,marginTop:1,flexShrink:0,
              filter:i===0?`drop-shadow(0 0 5px ${a.color})`:"none"}}>{a.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{...raj(11,i===0?700:600),color:i===0?C.white:C.mutedL,lineHeight:1.4,marginBottom:2}}>{a.msg}</div>
              <div style={{...raj(9,500),color:C.muted}}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STAT BAR mini
// ══════════════════════════════════════════════════════════════
function StatBar({label,val,max,color}) {
  const pct=Math.round((val/max)*100);
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{...raj(11,600),color:C.mutedL}}>{label}</span>
        <span style={{...raj(11,700),color}}>{val.toLocaleString()}</span>
      </div>
      <div style={{height:5,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%","--bw":`${pct}%`,animation:"adm-barFill 1.2s ease .4s both",
          background:`linear-gradient(90deg,${color}88,${color})`,
          boxShadow:`0 0 6px ${color}66`}}
          ref={el=>{if(el)el.style.width=`${pct}%`}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD MAIN VIEW
// ══════════════════════════════════════════════════════════════
function DashboardView() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>

      {/* ── Welcome header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"20px 24px",
        background:`linear-gradient(135deg,${C.card} 0%,${C.panel} 100%)`,
        border:`1px solid ${C.navy}`,position:"relative",overflow:"hidden",
        animation:"adm-cardIn .45s ease both"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:`linear-gradient(90deg,transparent,${C.orange}88,${C.orange},${C.orange}88,transparent)`}}/>
        <div style={{position:"absolute",right:-60,top:-60,width:220,height:220,
          borderRadius:"50%",background:C.orange,filter:"blur(70px)",opacity:.05,pointerEvents:"none",
          animation:"adm-float 6s ease-in-out infinite"}}/>
        <CornerDeco color={C.orange} size={12} pos="tl"/>
        <CornerDeco color={C.orange} size={12} pos="br"/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
            <span style={{fontSize:24,filter:`drop-shadow(0 0 10px ${C.orange})`}}>🛡️</span>
            <div style={{...orb(16,900),color:C.white}}>
              PANEL DE <span style={{color:C.orange,animation:"adm-glow 3s ease-in-out infinite"}}>CONTROL</span>
            </div>
          </div>
          <div style={{...raj(13,500),color:C.muted}}>
            Visión general del sistema · Datos en tiempo real
          </div>
        </div>
        <div style={{display:"flex",gap:20,position:"relative",zIndex:1}}>
          {[
            {label:"Sistema",  value:"ACTIVO",  color:C.green },
            {label:"Usuarios", value:"163",     color:C.blue  },
            {label:"Sesiones", value:"47 hoy",  color:C.orange},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:"right"}}>
              <div style={{...orb(15,900),color:s.color,textShadow:`0 0 12px ${s.color}55`}}>{s.value}</div>
              <div style={{...raj(10,500),color:C.muted,marginTop:2,letterSpacing:".08em"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard icon={Users}    label="Usuarios Totales"    value="163"   sub="↑ 12 esta semana"  color={C.blue}   trend={8}   delay={0}/>
        <KpiCard icon={Activity} label="Activos Hoy"         value="47"    sub="28% del total"      color={C.orange} trend={15}  delay={.07}/>
        <KpiCard icon={Zap}      label="XP Ganado Hoy"       value="24800" sub="Promedio: 528 XP"   color={C.gold}   trend={22}  delay={.14}/>
        <KpiCard icon={Target}   label="Misiones Completadas"value="312"   sub="87 pendientes hoy"  color={C.green}  trend={-3}  delay={.21}/>
      </div>

      {/* ── Charts 50/50 ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Area chart */}
        <div style={{background:`linear-gradient(135deg,${C.card},${C.panel})`,
          border:`1px solid ${C.navy}`,padding:"22px 22px 16px",position:"relative",overflow:"hidden",
          animation:"adm-cardIn .5s ease .15s both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${C.blue}66,transparent)`}}/>
          <div style={{position:"absolute",bottom:-40,right:-40,width:160,height:160,
            borderRadius:"50%",background:C.blue,filter:"blur(60px)",opacity:.06,pointerEvents:"none",
            animation:"adm-float 5s ease-in-out infinite"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <TrendingUp size={14} color={C.blue} style={{filter:`drop-shadow(0 0 5px ${C.blue}66)`}}/>
              <span style={{...orb(12,700),color:C.white}}>USUARIOS ACTIVOS</span>
            </div>
            <span style={{...raj(11,600),color:C.muted,background:`${C.blue}0A`,
              border:`1px solid ${C.blue}22`,padding:"3px 10px"}}>últimos 7 días</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={DATA_REGISTROS} margin={{top:4,right:4,left:-16,bottom:0}}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue} stopOpacity={.4}/>
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
              <XAxis dataKey="dia" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<FvTooltip/>}/>
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={C.blue} strokeWidth={2.5}
                fill="url(#gU)" dot={{fill:C.blue,r:3.5,strokeWidth:0}}
                activeDot={{r:6,fill:C.blue,stroke:C.card,strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div style={{background:`linear-gradient(135deg,${C.card},${C.panel})`,
          border:`1px solid ${C.navy}`,padding:"22px 22px 16px",position:"relative",overflow:"hidden",
          animation:"adm-cardIn .5s ease .22s both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,
            background:`linear-gradient(90deg,transparent,${C.orange}66,transparent)`}}/>
          <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,
            borderRadius:"50%",background:C.orange,filter:"blur(60px)",opacity:.06,pointerEvents:"none",
            animation:"adm-floatX 6s ease-in-out infinite"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <BarChart2 size={14} color={C.orange} style={{filter:`drop-shadow(0 0 5px ${C.orange}66)`}}/>
              <span style={{...orb(12,700),color:C.white}}>TOP EJERCICIOS</span>
            </div>
            <span style={{...raj(11,600),color:C.muted,background:`${C.orange}0A`,
              border:`1px solid ${C.orange}22`,padding:"3px 10px"}}>por sesiones</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={DATA_EJERCICIOS} barCategoryGap="32%" margin={{top:4,right:4,left:-16,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<FvTooltip/>}/>
              <Bar dataKey="sesiones" name="Sesiones" radius={0} maxBarSize={26}>
                {DATA_EJERCICIOS.map((_,i)=>(
                  <Cell key={i} fill={[C.orange,C.orangeL,C.blue,C.teal,C.purple,C.gold][i%6]}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom: tabla + actividad ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <UsersTable/>
        <ActivityFeed/>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMING SOON (para secciones no cargadas)
// ══════════════════════════════════════════════════════════════
function ComingSoonView({section}) {
  const s = NAV_ITEMS.find(n=>n.id===section);
  const Icon = s?.icon||Settings;
  const color = s?.color||C.orange;
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,position:"relative"}}>
      <GlowOrb color={color} size={200} x="50%" y="50%" opacity={0.1}/>
      <div style={{background:`${color}10`,border:`1px solid ${color}33`,padding:"24px",
        animation:"adm-cardIn .4s ease both",position:"relative",zIndex:1,
        boxShadow:`0 0 30px ${color}22`}}>
        <Icon size={44} color={color} style={{filter:`drop-shadow(0 0 12px ${color})`}}/>
      </div>
      <div style={{textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{...orb(16,900),color,marginBottom:8,animation:"adm-glow 2s ease-in-out infinite"}}>
          {s?.label?.toUpperCase()||"SECCIÓN"}
        </div>
        <div style={{...raj(14,500),color:C.muted}}>Módulo completamente funcional</div>
        <div style={{...raj(12,400),color:`${C.muted}88`,marginTop:4}}>
          Conectado a Firebase en tiempo real
        </div>
      </div>
      <div style={{display:"flex",gap:10,position:"relative",zIndex:1}}>
        {[Plus,Edit2,Trash2,RefreshCw].map((Ic,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.navy}`,padding:"12px",
            display:"flex",alignItems:"center",justifyContent:"center",opacity:.35}}>
            <Ic size={17} color={C.muted}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── MODO SIMPLE — paleta, estilos y componentes distintos ──
// ══════════════════════════════════════════════════════════════
const S = {
  bg:"#0F1117", card:"#1A1D27", panel:"#14171F", border:"#2A2D3E",
  accent:"#6366F1", accentL:"#818CF8", accentD:"#4F46E5",
  green:"#10B981", red:"#EF4444", yellow:"#F59E0B", blue:"#3B82F6",
  text:"#E2E8F0", textMuted:"#94A3B8", textFaint:"#475569",
  white:"#F8FAFC",
};
const sr = (s,w=400) => ({fontFamily:"'Inter',system-ui,sans-serif",fontSize:s,fontWeight:w});

const SIMPLE_NAV = [
  {id:"dashboard",  icon:LayoutDashboard, label:"Dashboard"   },
  {id:"usuarios",   icon:Users,           label:"Usuarios"    },
  {id:"ejercicios", icon:Dumbbell,        label:"Ejercicios"  },
  {id:"rutinas",    icon:ClipboardList,   label:"Rutinas"     },
  {id:"misiones",   icon:Target,          label:"Misiones"    },
  {id:"objetos",    icon:Package,         label:"Objetos"     },
  {id:"logros",     icon:Trophy,          label:"Logros"      },
  {id:"stats",      icon:BarChart2,       label:"Estadísticas"},
  {id:"config",     icon:Settings,        label:"Configuración"},
];

const SIMPLE_GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .s-nav-item { transition:background .15s,color .15s; cursor:pointer; border-radius:6px; }
  .s-nav-item:hover { background:#2A2D3E !important; }
  .s-card { transition:box-shadow .2s,border-color .2s; }
  .s-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.4) !important; border-color:#3A3D4E !important; }
  .s-row { transition:background .1s; }
  .s-row:hover { background:#1E2030 !important; }
  .s-btn { transition:all .15s; cursor:pointer; border-radius:6px; }
  .s-btn:hover { opacity:.88; }
  .s-icon-btn { transition:background .15s; cursor:pointer; border-radius:6px; }
  .s-icon-btn:hover { background:#2A2D3E !important; }
  .s-input:focus { outline:none; border-color:#6366F1 !important; box-shadow:0 0 0 3px rgba(99,102,241,.15) !important; }
  .s-input::placeholder { color:#475569; }
`;

// ── Simple Sidebar ──────────────────────────────────────────────
function SimpleSidebar({active,setActive,onLogout,setFx}) {
  const groups = [
    {label:"PRINCIPAL",    items:SIMPLE_NAV.slice(0,2)},
    {label:"CONTENIDO",    items:SIMPLE_NAV.slice(2,7)},
    {label:"SISTEMA",      items:SIMPLE_NAV.slice(7)  },
  ];
  return (
    <div style={{width:220,flexShrink:0,background:S.card,borderRight:`1px solid ${S.border}`,
      display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      {/* Logo */}
      <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${S.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:28,height:28,background:S.accent,borderRadius:6,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚔️</div>
          <span style={{...sr(15,700),color:S.text}}>ForgeVenture</span>
        </div>
        <span style={{...sr(11,500),color:S.textFaint,letterSpacing:".04em"}}>Admin Panel</span>
      </div>

      {/* Nav */}
      <nav style={{flex:1,overflowY:"auto",padding:"12px 12px"}}>
        {groups.map(g=>(
          <div key={g.label} style={{marginBottom:20}}>
            <div style={{...sr(10,600),color:S.textFaint,letterSpacing:".08em",
              marginBottom:6,paddingLeft:8}}>{g.label}</div>
            {g.items.map(item=>{
              const on=active===item.id;
              return (
                <div key={item.id} className="s-nav-item"
                  onClick={()=>setActive(item.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                    background:on?`${S.accent}18`:"transparent",
                    color:on?S.accentL:S.textMuted,marginBottom:2}}>
                  <item.icon size={15} color={on?S.accentL:S.textFaint}/>
                  <span style={{...sr(13,on?600:400),color:on?S.accentL:S.textMuted}}>{item.label}</span>
                  {on&&<div style={{width:4,height:4,background:S.accent,borderRadius:"50%",marginLeft:"auto"}}/>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{padding:"12px",borderTop:`1px solid ${S.border}`}}>
        {/* FX toggle */}
        <button onClick={()=>setFx(true)}
          style={{width:"100%",display:"flex",alignItems:"center",gap:8,...sr(12,500),
            color:S.textMuted,background:`${S.accent}14`,border:`1px solid ${S.accent}44`,
            padding:"8px 12px",cursor:"pointer",borderRadius:6,marginBottom:8,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=`${S.accent}22`;e.currentTarget.style.color=S.accentL;}}
          onMouseLeave={e=>{e.currentTarget.style.background=`${S.accent}14`;e.currentTarget.style.color=S.textMuted;}}>
          <span style={{fontSize:14}}>✦</span> Modo visual RPG
        </button>
        <button onClick={onLogout}
          style={{width:"100%",display:"flex",alignItems:"center",gap:8,...sr(12,500),
            color:S.textFaint,background:"transparent",border:`1px solid ${S.border}`,
            padding:"8px 12px",cursor:"pointer",borderRadius:6,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=`${S.red}10`;e.currentTarget.style.color=S.red;e.currentTarget.style.borderColor=`${S.red}44`;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=S.textFaint;e.currentTarget.style.borderColor=S.border;}}>
          <LogOut size={14}/> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── Simple TopBar ───────────────────────────────────────────────
function SimpleTopBar({active,clock,notifications}) {
  const sec = SIMPLE_NAV.find(n=>n.id===active);
  const SIcon = sec?.icon||LayoutDashboard;
  return (
    <div style={{height:54,flexShrink:0,background:S.card,borderBottom:`1px solid ${S.border}`,
      display:"flex",alignItems:"center",padding:"0 22px",gap:14}}>
      {/* Title */}
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
        <SIcon size={15} color={S.textMuted}/>
        <span style={{...sr(14,600),color:S.text}}>{sec?.label||"Dashboard"}</span>
        <span style={{...sr(13,400),color:S.textFaint}}>/</span>
        <span style={{...sr(13,400),color:S.textFaint}}>Vista general</span>
      </div>
      {/* Search */}
      <div style={{position:"relative",flex:"0 0 200px"}}>
        <Search size={13} color={S.textFaint} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
        <input placeholder="Buscar..." className="s-input"
          style={{width:"100%",background:S.panel,border:`1px solid ${S.border}`,
            color:S.text,padding:"7px 12px 7px 30px",...sr(13,400),borderRadius:6,
            transition:"border-color .15s"}}/>
      </div>
      {/* Notif */}
      <button className="s-icon-btn" style={{position:"relative",background:"transparent",
        border:"none",padding:"7px",color:S.textMuted,display:"flex"}}>
        <Bell size={15}/>
        {notifications>0&&(
          <span style={{position:"absolute",top:-2,right:-2,width:14,height:14,
            background:S.red,color:"white",...sr(9,700),borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {notifications}
          </span>
        )}
      </button>
      {/* Clock */}
      <div style={{...sr(12,500),color:S.textFaint}}>
        {clock.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}
      </div>
      {/* Admin avatar */}
      <div style={{width:30,height:30,background:S.accent,borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",...sr(12,700),color:S.white}}>
        A
      </div>
    </div>
  );
}

// ── Simple KPI Card ─────────────────────────────────────────────
function SimpleKpiCard({icon:Icon,label,value,sub,color,trend}) {
  const isNeg = trend<0;
  return (
    <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,
      padding:"20px",borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{background:`${color}18`,borderRadius:6,padding:"8px",display:"flex"}}>
          <Icon size={18} color={color}/>
        </div>
        {trend!==undefined&&(
          <div style={{...sr(11,600),color:isNeg?S.red:S.green,
            background:isNeg?`${S.red}14`:`${S.green}14`,
            padding:"3px 8px",borderRadius:999,display:"flex",alignItems:"center",gap:3}}>
            {isNeg?<TrendingDown size={11}/>:<TrendingUp size={11}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{...sr(26,700),color:S.white,marginBottom:3,letterSpacing:"-.5px"}}>{value}</div>
      <div style={{...sr(13,500),color:S.text,marginBottom:2}}>{label}</div>
      <div style={{...sr(11,400),color:S.textFaint}}>{sub}</div>
    </div>
  );
}

// ── Simple Dashboard View ───────────────────────────────────────
function SimpleDashboardView() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* Page header */}
      <div>
        <div style={{...sr(22,700),color:S.white,marginBottom:4}}>Dashboard</div>
        <div style={{...sr(13,400),color:S.textFaint}}>
          Resumen general del sistema · {new Date().toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"})}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <SimpleKpiCard icon={Users}    label="Usuarios Totales"    value="163"  sub="↑ 12 esta semana"  color={S.accent} trend={8}  />
        <SimpleKpiCard icon={Activity} label="Activos Hoy"         value="47"   sub="28% del total"     color={S.blue}   trend={15} />
        <SimpleKpiCard icon={Zap}      label="XP Ganado Hoy"       value="24.8K"sub="Promedio: 528 XP"  color={S.yellow} trend={22} />
        <SimpleKpiCard icon={Target}   label="Misiones Completadas"value="312"  sub="87 pendientes"     color={S.green}  trend={-3} />
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16}}>
        {/* Area chart */}
        <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,
          padding:"20px",borderRadius:8}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <div style={{...sr(14,600),color:S.text,marginBottom:2}}>Usuarios activos</div>
              <div style={{...sr(11,400),color:S.textFaint}}>Últimos 7 días</div>
            </div>
            <div style={{...sr(11,500),color:S.textFaint,background:S.panel,
              border:`1px solid ${S.border}`,padding:"4px 10px",borderRadius:6}}>Esta semana</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DATA_REGISTROS} margin={{top:4,right:4,left:-16,bottom:0}}>
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
                return <div style={{background:S.card,border:`1px solid ${S.border}`,padding:"10px 14px",borderRadius:8,...sr(12,400),color:S.text}}>
                  <div style={{fontWeight:600,marginBottom:5}}>{label}</div>
                  {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value}</div>)}
                </div>;
              }}/>
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={S.accent} strokeWidth={2}
                fill="url(#sU)" dot={false} activeDot={{r:5,fill:S.accent,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,
          padding:"20px",borderRadius:8}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <div style={{...sr(14,600),color:S.text,marginBottom:2}}>Top ejercicios</div>
              <div style={{...sr(11,400),color:S.textFaint}}>Por sesiones completadas</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DATA_EJERCICIOS} barCategoryGap="40%" margin={{top:4,right:4,left:-16,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fill:S.textFaint,fontSize:10,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:S.textFaint,fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
              <Tooltip content={({active,payload,label})=>{
                if(!active||!payload?.length) return null;
                return <div style={{background:S.card,border:`1px solid ${S.border}`,padding:"10px 14px",borderRadius:8,...sr(12,400),color:S.text}}>
                  <div style={{fontWeight:600,marginBottom:5}}>{label}</div>
                  {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value}</div>)}
                </div>;
              }}/>
              <Bar dataKey="sesiones" name="Sesiones" fill={S.accent} radius={4} maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users table */}
      <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,
        borderRadius:8,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 20px",borderBottom:`1px solid ${S.border}`}}>
          <div style={{...sr(14,600),color:S.text}}>Usuarios recientes</div>
          <button className="s-btn" style={{...sr(12,500),color:S.accentL,background:`${S.accent}14`,
            border:`1px solid ${S.accent}33`,padding:"6px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <Plus size={12}/> Ver todos
          </button>
        </div>
        {/* thead */}
        <div style={{display:"grid",gridTemplateColumns:"2fr .7fr .5fr 1fr .6fr .7fr",
          padding:"9px 20px",background:S.panel,borderBottom:`1px solid ${S.border}`,gap:8}}>
          {["USUARIO","CLASE","NIVEL","XP","RACHA","ACCIONES"].map(h=>(
            <span key={h} style={{...sr(10,600),color:S.textFaint,letterSpacing:".06em"}}>{h}</span>
          ))}
        </div>
        {RECENT_USERS.map((u,i)=>(
          <div key={u.id} className="s-row" style={{display:"grid",
            gridTemplateColumns:"2fr .7fr .5fr 1fr .6fr .7fr",
            padding:"11px 20px",borderBottom:`1px solid ${S.border}33`,
            alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,background:`${CLS_COLOR[u.cls]}22`,
                borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                {CLS_ICON[u.cls]}
              </div>
              <div style={{minWidth:0}}>
                <div style={{...sr(13,600),color:S.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                <div style={{...sr(11,400),color:S.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
              </div>
              <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                background:u.status==="active"?S.green:S.red}}/>
            </div>
            <span style={{...sr(12,500),color:CLS_COLOR[u.cls],
              background:`${CLS_COLOR[u.cls]}14`,padding:"2px 8px",borderRadius:4,display:"inline-block"}}>
              {u.cls}
            </span>
            <span style={{...sr(13,600),color:S.text}}>Lv.{u.lvl}</span>
            <span style={{...sr(12,500),color:S.textMuted}}>{u.xp.toLocaleString()} XP</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:11}}>🔥</span>
              <span style={{...sr(12,400),color:u.streak>0?S.textMuted:S.textFaint}}>{u.streak}d</span>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{Icon:Eye,c:S.blue},{Icon:Edit2,c:S.accent},{Icon:Trash2,c:S.red}].map(({Icon:Ic,c},j)=>(
                <button key={j} className="s-icon-btn" style={{background:"transparent",border:"none",
                  padding:"5px",color:S.textFaint,display:"flex",cursor:"pointer"}}
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

// ── Simple shell wrapper ─────────────────────────────────────────
function SimpleShell({active,setActive,onLogout,setFx}) {
  const clock = useClock();
  const [notifs] = useState(3);
  const renderContent = () => {
    if(active==="dashboard")  return <SimpleDashboardView/>;
    if(active==="usuarios")   return <AdminUsuarios/>;
    if(active==="ejercicios") return <AdminEjercicios/>;
    if(active==="rutinas")    return <AdminRutinas/>;
    if(active==="misiones")   return <AdminMisiones/>;
    if(active==="objetos")    return <AdminObjetos/>;
    if(active==="logros")     return <AdminLogros/>;
    if(active==="stats")      return <AdminStats/>;
    if(active==="config")     return <AdminConfig/>;
    return null;
  };
  return (
    <>
      <style>{SIMPLE_GLOBAL_CSS}</style>
      <div style={{display:"flex",height:"100vh",background:S.bg,overflow:"hidden"}}>
        <SimpleSidebar active={active} setActive={setActive} onLogout={onLogout} setFx={setFx}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <SimpleTopBar active={active} clock={clock} notifications={notifs}/>
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
export default function AdminDashboard({onLogout}) {
  const [active,     setActive]     = useState("dashboard");
  const [collapsed,  setCollapsed]  = useState(false);
  const [fx,         setFx]         = useState(true); // true = RPG visual
  const clock = useClock();

  // ── Modo simple: shell completamente distinto ──────────────
  if (!fx) {
    return (
      <SimpleShell
        active={active}
        setActive={setActive}
        onLogout={onLogout}
        setFx={setFx}
      />
    );
  }

  // ── Modo RPG: shell visual completo ────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden",position:"relative"}}>

        {/* Background layers */}
        <GridBg opacity={0.07}/>
        <GlowOrb color={C.orange} size={400} x="65%" y="25%" opacity={0.04} anim="adm-orb1" duration="15s"/>
        <GlowOrb color={C.blue}   size={350} x="20%" y="70%" opacity={0.04} anim="adm-orb2" duration="18s"/>
        <GlowOrb color={C.purple} size={300} x="80%" y="75%" opacity={0.03} anim="adm-orb3" duration="20s"/>
        <ScanLine speed="10s" color={C.orange} opacity={0.2}/>

        <Sidebar active={active} setActive={setActive} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed}/>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1}}>
          <TopBar active={active} clock={clock} notifications={3} fx={fx} setFx={setFx}/>

          <div style={{flex:1,overflowY:"auto",padding:"20px 22px",background:"transparent",position:"relative"}}>
            {active==="dashboard"  && <DashboardView/>}
            {active==="usuarios"   && <AdminUsuarios   fx={fx}/>}
            {active==="ejercicios" && <AdminEjercicios  fx={fx}/>}
            {active==="rutinas"    && <AdminRutinas     fx={fx}/>}
            {active==="misiones"   && <AdminMisiones    fx={fx}/>}
            {active==="objetos"    && <AdminObjetos     fx={fx}/>}
            {active==="logros"     && <AdminLogros      fx={fx}/>}
            {active==="stats"      && <AdminStats       fx={fx}/>}
            {active==="config"     && <AdminConfig      fx={fx}/>}
            {!["dashboard","usuarios","ejercicios","rutinas","misiones","objetos","logros","stats","config"].includes(active) && <ComingSoonView section={active}/>}
          </div>
        </div>
      </div>
    </>
  );
}