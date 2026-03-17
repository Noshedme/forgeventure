// ─────────────────────────────────────────────────────────────
//  ForgeVenture — Admin Dashboard
//  Librerías: recharts (gráficas) · lucide-react (iconos)
//  Instalar si no están: npm install recharts lucide-react
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import AdminUsuarios   from "./AdminUsuarios";
import AdminEjercicios from "./AdminEjercicios";
import AdminRutinas    from "./AdminRutinas";
import AdminMisiones   from "./AdminMisiones";
import AdminObjetos    from "./AdminObjetos";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, Users, Dumbbell, ClipboardList,
  Target, Package, Trophy, BarChart2, Settings,
  LogOut, Bell, Search, Plus, RefreshCw, Zap,
  TrendingUp, TrendingDown, Activity, Shield,
  ChevronRight, MoreVertical, Eye, Edit2, Trash2,
  Wifi, WifiOff, AlertTriangle, CheckCircle,
} from "lucide-react";

// ── fonts ─────────────────────────────────────────────────────
if (!document.getElementById("fv-adm-fonts")) {
  const l = document.createElement("link");
  l.id = "fv-adm-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap";
  document.head.appendChild(l);
}

// ── theme ─────────────────────────────────────────────────────
const C = {
  bg:     "#050C18", side:   "#080F1C", card:   "#0C1826",
  panel:  "#091220", navy:   "#1A3354", navyL:  "#1E3A5F",
  orange: "#E85D04", orangeL:"#FF9F1C", gold:   "#FFD700",
  blue:   "#4CC9F0", teal:   "#0A9396", green:  "#2ecc71",
  red:    "#E74C3C", purple: "#9B59B6", white:  "#F0F4FF",
  muted:  "#5A7A9A", mutedL: "#7A9AB8",
};

// ── CSS animations ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fv-glow    { 0%,100%{text-shadow:0 0 16px #E85D04,0 0 32px #E85D0444} 50%{text-shadow:0 0 28px #E85D04,0 0 56px #E85D0477} }
  @keyframes fv-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.95)} }
  @keyframes fv-blink   { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes fv-scanL   { 0%{top:-2px} 100%{top:100%} }
  @keyframes fv-slideL  { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fv-slideU  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fv-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes fv-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fv-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes fv-ping    { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }
  @keyframes fv-ticker  { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
  @keyframes fv-neon    { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:.5} }
  @keyframes fv-cardIn  { from{opacity:0;transform:translateY(12px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fv-number  { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html,body { height:100%; overflow:hidden; }
  body { background:${C.bg}; font-family:'Rajdhani',sans-serif; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:${C.side}; }
  ::-webkit-scrollbar-thumb { background:${C.orange}; border-radius:0; }

  .fv-nav-item { transition:all .2s; cursor:pointer; }
  .fv-nav-item:hover { background:${C.navyL}22 !important; color:${C.orange} !important; border-left-color:${C.orange}66 !important; }
  .fv-nav-item:hover svg { color:${C.orange} !important; }

  .fv-kpi { transition:transform .2s,box-shadow .2s; cursor:default; }
  .fv-kpi:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.5) !important; }

  .fv-row:hover { background:${C.navyL}18 !important; }
  .fv-row { transition:background .15s; }

  .fv-action { transition:all .2s; cursor:pointer; }
  .fv-action:hover { transform:translateY(-3px); }

  .fv-btn { transition:all .18s; cursor:pointer; }
  .fv-btn:hover { transform:translateY(-2px); opacity:.9; }

  .fv-icon-btn { transition:all .2s; cursor:pointer; border-radius:0; }
  .fv-icon-btn:hover { background:${C.navyL}44 !important; color:${C.orange} !important; }

  .recharts-tooltip-wrapper { font-family:'Rajdhani',sans-serif !important; }
`;

// ── mock data (replace with Firebase) ─────────────────────────
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
  {icon:"🆕",msg:"FrodoBags completó misión diaria +150 XP",     time:"hace 3m", color:C.green},
  {icon:"⚔️",msg:"Aragorn_Dev alcanzó Nivel 12",                  time:"hace 8m", color:C.gold},
  {icon:"🏆",msg:"LegolasRunner desbloqueó logro 'Sprint Épico'", time:"hace 15m",color:C.orange},
  {icon:"👤",msg:"Nuevo usuario registrado: SirPercival_99",      time:"hace 22m",color:C.blue},
  {icon:"📋",msg:"Rutina 'HIIT Extremo' creada por admin",        time:"hace 1h", color:C.teal},
  {icon:"⚠️",msg:"SauronFit sin actividad por 3 días",            time:"hace 2h", color:C.red},
  {icon:"🎯",msg:"Misión semanal 'Maestro del Cardio' activada",  time:"hace 3h", color:C.purple},
];

// ── nav config ─────────────────────────────────────────────────
const NAV_ITEMS = [
  {id:"dashboard",  icon:LayoutDashboard, label:"Dashboard",   badge:null},
  {id:"usuarios",   icon:Users,           label:"Usuarios",    badge:"163"},
  {id:"ejercicios", icon:Dumbbell,        label:"Ejercicios",  badge:"50"},
  {id:"rutinas",    icon:ClipboardList,   label:"Rutinas",     badge:"24"},
  {id:"misiones",   icon:Target,          label:"Misiones",    badge:"12"},
  {id:"objetos",    icon:Package,         label:"Objetos/Items",badge:"38"},
  {id:"logros",     icon:Trophy,          label:"Logros",      badge:"30"},
  {id:"stats",      icon:BarChart2,       label:"Estadísticas",badge:null},
  {id:"config",     icon:Settings,        label:"Configuración",badge:null},
];

const CLS_COLOR = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};

// ── helpers ────────────────────────────────────────────────────
const px  = s => ({fontFamily:"'Press Start 2P'",fontSize:s});
const orb = (s,w=700) => ({fontFamily:"'Orbitron',sans-serif",fontSize:s,fontWeight:w});
const raj = (s,w=600) => ({fontFamily:"'Rajdhani',sans-serif",fontSize:s,fontWeight:w});

// ── live clock ─────────────────────────────────────────────────
function useClock() {
  const [t,setT] = useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setT(new Date()),1000); return()=>clearInterval(id); },[]);
  return t;
}

// ── KPI card ───────────────────────────────────────────────────
function KpiCard({icon:Icon,label,value,sub,color,trend,delay=0}) {
  return (
    <div className="fv-kpi" style={{
      background:C.card, border:`1px solid ${color}33`,
      padding:"22px 20px", position:"relative", overflow:"hidden",
      boxShadow:`0 4px 24px rgba(0,0,0,.4), 0 0 0 1px ${color}11`,
      animation:`fv-cardIn .5s ease ${delay}s both`,
    }}>
      {/* top accent */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
      {/* bg glow */}
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:color,filter:"blur(50px)",opacity:.06,pointerEvents:"none"}}/>

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div style={{background:`${color}18`,border:`1px solid ${color}33`,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon size={20} color={color}/>
        </div>
        {trend!==undefined&&(
          <div style={{display:"flex",alignItems:"center",gap:4,...raj(12,700),color:trend>=0?C.green:C.red}}>
            {trend>=0?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{...orb("clamp(22px,2.5vw,30px)",900),color,marginBottom:4,animation:`fv-number .6s ease ${delay+.1}s both`}}>
        {value}
      </div>
      <div style={{...raj(13,700),color:C.white,marginBottom:3,letterSpacing:".03em"}}>{label}</div>
      <div style={{...raj(11,500),color:C.muted}}>{sub}</div>
    </div>
  );
}

// ── custom tooltip ─────────────────────────────────────────────
function FvTooltip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.panel,border:`1px solid ${C.navyL}`,padding:"10px 14px",boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
      <div style={{...raj(13,700),color:C.white,marginBottom:6}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,...raj(12,600),color:p.color}}>
          <div style={{width:8,height:8,background:p.color}}/>
          {p.name}: {p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// ── sidebar ────────────────────────────────────────────────────
function Sidebar({active,setActive,onLogout}) {
  return (
    <div style={{
      width:240,flexShrink:0,
      background:C.side,
      borderRight:`1px solid ${C.navy}`,
      display:"flex",flexDirection:"column",
      height:"100vh",
      position:"relative",zIndex:10,
      animation:"fv-slideL .4s ease both",
    }}>
      {/* scan line */}
      <div style={{position:"absolute",left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.orange}33,transparent)`,animation:"fv-scanL 6s linear infinite",pointerEvents:"none"}}/>

      {/* logo */}
      <div style={{padding:"22px 20px 18px",borderBottom:`1px solid ${C.navy}44`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:18,filter:`drop-shadow(0 0 8px ${C.orange})`}}>⚔️</span>
          <span style={{...px(8),color:C.orange,animation:"fv-neon 6s ease-in-out infinite"}}>FORGE</span>
          <span style={{...px(8),color:C.white}}>VENTURE</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,...raj(11,600),color:C.muted,letterSpacing:".1em"}}>
          <Shield size={11} color={C.orange}/>
          PANEL DE ADMINISTRACIÓN
        </div>
      </div>

      {/* nav */}
      <nav style={{flex:1,padding:"12px 0",overflowY:"auto"}}>
        {NAV_ITEMS.map((item,i)=>{
          const isActive = active===item.id;
          return (
            <div key={item.id} className="fv-nav-item"
              onClick={()=>setActive(item.id)}
              style={{
                display:"flex",alignItems:"center",gap:11,
                padding:"11px 18px",
                borderLeft:`3px solid ${isActive?C.orange:"transparent"}`,
                background:isActive?`${C.orange}14`:"transparent",
                color:isActive?C.orange:C.muted,
                animation:`fv-slideL .35s ease ${i*.04}s both`,
                marginBottom:2,
              }}>
              <item.icon size={16} color={isActive?C.orange:C.muted}/>
              <span style={{...raj(13,isActive?700:600),flex:1,letterSpacing:".02em"}}>{item.label}</span>
              {item.badge&&(
                <span style={{...raj(10,700),background:isActive?C.orange:`${C.navyL}88`,
                  color:isActive?C.bg:C.muted,padding:"1px 6px",minWidth:22,textAlign:"center"}}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* admin profile */}
      <div style={{padding:"16px 18px",borderTop:`1px solid ${C.navy}44`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:34,height:34,background:`${C.orange}22`,border:`2px solid ${C.orange}55`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
            🛡️
          </div>
          <div>
            <div style={{...raj(13,700),color:C.white}}>Admin</div>
            <div style={{...raj(11,500),color:C.orange}}>Acceso Total</div>
          </div>
          <div style={{marginLeft:"auto",position:"relative"}}>
            <div style={{width:8,height:8,background:C.green,borderRadius:"50%"}}/>
            <div style={{position:"absolute",inset:0,background:C.green,borderRadius:"50%",animation:"fv-ping 1.5s ease-in-out infinite"}}/>
          </div>
        </div>
        <button className="fv-btn" onClick={onLogout}
          style={{width:"100%",display:"flex",alignItems:"center",gap:8,
            background:"transparent",border:`1px solid ${C.navy}`,color:C.muted,
            padding:"8px 12px",...raj(12,600),letterSpacing:".05em",
            transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.muted;}}>
          <LogOut size={14}/> CERRAR SESIÓN
        </button>
      </div>
    </div>
  );
}

// ── topbar ─────────────────────────────────────────────────────
function TopBar({active,clock,notifications}) {
  const section = NAV_ITEMS.find(n=>n.id===active);
  const SectionIcon = section?.icon||LayoutDashboard;
  return (
    <div style={{
      height:58,flexShrink:0,
      background:C.side,
      borderBottom:`1px solid ${C.navy}`,
      display:"flex",alignItems:"center",
      padding:"0 24px",gap:16,
      position:"relative",
    }}>
      {/* section title */}
      <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
        <SectionIcon size={16} color={C.orange}/>
        <span style={{...orb(13,700),color:C.white,letterSpacing:".05em",textTransform:"uppercase"}}>
          {section?.label||"Dashboard"}
        </span>
        <ChevronRight size={14} color={C.muted}/>
        <span style={{...raj(13,500),color:C.muted}}>Vista general</span>
      </div>

      {/* search */}
      <div style={{position:"relative"}}>
        <Search size={14} color={C.muted} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
        <input placeholder="Buscar usuarios, misiones..."
          style={{background:C.panel,border:`1px solid ${C.navy}`,color:C.white,
            padding:"7px 14px 7px 34px",...raj(13,500),width:240,
            letterSpacing:".02em",outline:"none",transition:"border-color .2s"}}
          onFocus={e=>e.target.style.borderColor=C.orange}
          onBlur={e=>e.target.style.borderColor=C.navy}/>
      </div>

      {/* realtime badge */}
      <div style={{display:"flex",alignItems:"center",gap:6,background:`${C.green}14`,
        border:`1px solid ${C.green}33`,padding:"5px 10px"}}>
        <div style={{width:6,height:6,background:C.green,borderRadius:"50%",animation:"fv-blink 1.2s ease-in-out infinite"}}/>
        <span style={{...raj(11,700),color:C.green,letterSpacing:".08em"}}>EN VIVO</span>
      </div>

      {/* notifications */}
      <button className="fv-icon-btn" style={{position:"relative",background:"transparent",
        border:`1px solid ${C.navy}`,padding:"7px",color:C.muted,display:"flex",alignItems:"center"}}>
        <Bell size={16}/>
        {notifications>0&&(
          <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,
            background:C.orange,color:C.bg,...px(5),
            display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%"}}>
            {notifications}
          </span>
        )}
      </button>

      {/* clock */}
      <div style={{...px(7),color:C.muted,letterSpacing:".05em",textAlign:"right"}}>
        <div style={{color:C.orange}}>{clock.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
        <div style={{fontSize:5,marginTop:3}}>{clock.toLocaleDateString("es-EC",{weekday:"short",day:"numeric",month:"short"}).toUpperCase()}</div>
      </div>
    </div>
  );
}

// ── quick actions bar ──────────────────────────────────────────
function QuickActions() {
  const actions=[
    {icon:"👤",label:"Nuevo Usuario",  color:C.blue,   sub:"Crear cuenta"},
    {icon:"💪",label:"Nuevo Ejercicio",color:C.orange, sub:"Agregar al catálogo"},
    {icon:"📋",label:"Nueva Rutina",   color:C.teal,   sub:"Diseñar rutina"},
    {icon:"🎯",label:"Nueva Misión",   color:C.gold,   sub:"Quest diaria/semanal"},
    {icon:"🎒",label:"Nuevo Objeto",   color:C.purple, sub:"Item del inventario"},
    {icon:"🏆",label:"Nuevo Logro",    color:C.green,  sub:"Badge desbloq."},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
      {actions.map((a,i)=>(
        <button key={i} className="fv-action" style={{
          background:C.card,border:`1px solid ${a.color}33`,
          padding:"14px 10px",display:"flex",flexDirection:"column",
          alignItems:"center",gap:7,cursor:"pointer",
          boxShadow:`0 2px 12px rgba(0,0,0,.3)`,
          animation:`fv-cardIn .4s ease ${i*.06}s both`,
          position:"relative",overflow:"hidden",
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color;e.currentTarget.style.boxShadow=`0 8px 28px ${a.color}33`;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=`${a.color}33`;e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.3)";}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${a.color},transparent)`,opacity:.6}}/>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:18,filter:`drop-shadow(0 0 6px ${a.color}88)`}}>{a.icon}</span>
            <Plus size={13} color={a.color}/>
          </div>
          <div style={{...raj(12,700),color:C.white,textAlign:"center",lineHeight:1.3}}>{a.label}</div>
          <div style={{...raj(10,500),color:C.muted,textAlign:"center"}}>{a.sub}</div>
        </button>
      ))}
    </div>
  );
}

// ── users table ────────────────────────────────────────────────
function UsersTable() {
  return (
    <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"fv-cardIn .5s ease .3s both"}}>
      {/* header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"16px 20px",borderBottom:`1px solid ${C.navy}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Users size={16} color={C.orange}/>
          <span style={{...orb(12,700),color:C.white}}>USUARIOS RECIENTES</span>
          <span style={{...raj(11,700),background:`${C.orange}22`,color:C.orange,padding:"2px 8px"}}>
            163 total
          </span>
        </div>
        <button className="fv-btn" style={{display:"flex",alignItems:"center",gap:6,
          background:C.orange,border:"none",color:C.bg,padding:"7px 14px",...raj(12,700),letterSpacing:".05em"}}>
          <Plus size={13}/> VER TODOS
        </button>
      </div>

      {/* table head */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",
        padding:"10px 20px",background:C.panel,borderBottom:`1px solid ${C.navy}`}}>
        {["USUARIO","CLASE","NIVEL","XP","RACHA","ACCIONES"].map(h=>(
          <span key={h} style={{...px(6),color:C.muted,letterSpacing:".05em"}}>{h}</span>
        ))}
      </div>

      {/* rows */}
      {RECENT_USERS.map((u,i)=>(
        <div key={u.id} className="fv-row" style={{
          display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",
          padding:"12px 20px",borderBottom:`1px solid ${C.navy}33`,
          animation:`fv-slideU .35s ease ${i*.07}s both`,
          alignItems:"center",
        }}>
          {/* user */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,background:`${CLS_COLOR[u.cls]}22`,
              border:`1px solid ${CLS_COLOR[u.cls]}55`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {u.cls==="GUERRERO"?"⚔️":u.cls==="ARQUERO"?"🏃":"🧘"}
            </div>
            <div>
              <div style={{...raj(13,700),color:C.white,marginBottom:1}}>{u.name}</div>
              <div style={{...raj(11,400),color:C.muted}}>{u.email}</div>
            </div>
            <div style={{width:7,height:7,borderRadius:"50%",
              background:u.status==="active"?C.green:C.red,
              boxShadow:`0 0 6px ${u.status==="active"?C.green:C.red}`,marginLeft:4}}/>
          </div>
          {/* clase */}
          <span style={{...raj(12,700),color:CLS_COLOR[u.cls],
            background:`${CLS_COLOR[u.cls]}14`,border:`1px solid ${CLS_COLOR[u.cls]}33`,
            padding:"3px 8px",display:"inline-block"}}>
            {u.cls}
          </span>
          {/* nivel */}
          <span style={{...orb(14,900),color:C.gold}}>Lv.{u.lvl}</span>
          {/* xp */}
          <span style={{...raj(13,600),color:C.orange}}>{u.xp.toLocaleString()} XP</span>
          {/* racha */}
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:12}}>🔥</span>
            <span style={{...raj(13,600),color:u.streak>0?C.orangeL:C.muted}}>{u.streak}d</span>
          </div>
          {/* actions */}
          <div style={{display:"flex",gap:6}}>
            {[{Icon:Eye,c:C.blue},{Icon:Edit2,c:C.orange},{Icon:Trash2,c:C.red}].map(({Icon:Ic,c},j)=>(
              <button key={j} className="fv-icon-btn" style={{background:"transparent",
                border:`1px solid ${c}33`,padding:"5px",color:c,display:"flex",alignItems:"center",
                transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${c}18`;e.currentTarget.style.borderColor=c;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${c}33`;}}>
                <Ic size={13}/>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── activity feed ──────────────────────────────────────────────
function ActivityFeed() {
  const [items,setItems]=useState(ACTIVITY_FEED);
  // simulate new activity every 8s
  useEffect(()=>{
    const msgs=[
      {icon:"💪",msg:"XaduFighter completó 40 flexiones +80 XP",time:"ahora",color:C.green},
      {icon:"🎯",msg:"MageOfLight finalizó misión 'Flex Maestro'",time:"ahora",color:C.teal},
      {icon:"⚡",msg:"IronWarrior alcanzó racha de 10 días",time:"ahora",color:C.gold},
    ];
    const id=setInterval(()=>{
      const next=msgs[Math.floor(Math.random()*msgs.length)];
      setItems(prev=>[{...next,time:"ahora"},...prev.slice(0,9)]);
    },8000);
    return()=>clearInterval(id);
  },[]);

  return (
    <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"fv-cardIn .5s ease .4s both",
      display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 18px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
        <Activity size={16} color={C.orange}/>
        <span style={{...orb(12,700),color:C.white}}>ACTIVIDAD EN VIVO</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,background:C.green,borderRadius:"50%",animation:"fv-blink 1s infinite"}}/>
          <span style={{...raj(11,600),color:C.green}}>LIVE</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
        {items.map((a,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 16px",
            borderBottom:`1px solid ${C.navy}22`,
            animation:i===0?"fv-slideU .3s ease both":"none",
            background:i===0?`${a.color}08`:"transparent",transition:"background .3s"}}>
            <div style={{fontSize:16,marginTop:1,flexShrink:0}}>{a.icon}</div>
            <div style={{flex:1}}>
              <div style={{...raj(12,600),color:C.white,lineHeight:1.4,marginBottom:2}}>{a.msg}</div>
              <div style={{...raj(10,500),color:C.muted}}>{a.time}</div>
            </div>
            <div style={{width:3,height:3,background:a.color,borderRadius:"50%",marginTop:6,flexShrink:0}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── mini stat bar ──────────────────────────────────────────────
function StatBar({label,val,max,color}) {
  const pct=Math.round((val/max)*100);
  return (
    <div style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{...raj(12,600),color:C.mutedL}}>{label}</span>
        <span style={{...raj(12,700),color}}>{val.toLocaleString()}</span>
      </div>
      <div style={{height:6,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%","--bw":`${pct}%`,animation:"fv-barFill 1s ease .3s both",
          background:`linear-gradient(90deg,${color}88,${color})`,
          boxShadow:`0 0 6px ${color}66`}}
          ref={el=>{if(el)el.style.width=`${pct}%`}}/>
        <div style={{position:"absolute",top:0,left:0,right:0,height:"40%",background:"rgba(255,255,255,.07)"}}/>
      </div>
    </div>
  );
}

// ── main dashboard view ────────────────────────────────────────
function DashboardView() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,height:"100%"}}>

      {/* quick actions */}
      <QuickActions/>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard icon={Users}    label="Usuarios Totales"  value="163"    sub="↑ 12 esta semana"  color={C.blue}   trend={8}   delay={0}/>
        <KpiCard icon={Activity} label="Activos Hoy"       value="47"     sub="28% del total"     color={C.orange} trend={15}  delay={.08}/>
        <KpiCard icon={Zap}      label="XP Ganado Hoy"     value="24.8K"  sub="Promedio: 528 XP"  color={C.gold}   trend={22}  delay={.16}/>
        <KpiCard icon={Target}   label="Misiones Completadas" value="312" sub="87 pendientes"     color={C.green}  trend={-3}  delay={.24}/>
      </div>

      {/* charts + side panel */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 300px",gap:14,flex:1,minHeight:0}}>

        {/* area chart: registros */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"18px",animation:"fv-cardIn .5s ease .15s both"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
            <TrendingUp size={15} color={C.blue}/>
            <span style={{...orb(12,700),color:C.white}}>USUARIOS · ESTA SEMANA</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={DATA_REGISTROS}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue}   stopOpacity={.35}/>
                  <stop offset="95%" stopColor={C.blue}   stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gXP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.orange} stopOpacity={.35}/>
                  <stop offset="95%" stopColor={C.orange} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
              <XAxis dataKey="dia" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<FvTooltip/>}/>
              <Area type="monotone" dataKey="users" name="Usuarios" stroke={C.blue}   strokeWidth={2} fill="url(#gUsers)" dot={{fill:C.blue,  r:3,strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* bar chart: ejercicios */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"18px",animation:"fv-cardIn .5s ease .2s both"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
            <BarChart2 size={15} color={C.orange}/>
            <span style={{...orb(12,700),color:C.white}}>TOP EJERCICIOS</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DATA_EJERCICIOS} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<FvTooltip/>}/>
              <Bar dataKey="sesiones" name="Sesiones" fill={C.orange} radius={0}>
                {DATA_EJERCICIOS.map((_,i)=>(
                  <Cell key={i} fill={i%2===0?C.orange:C.orangeL}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* side: classes pie + stats */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* pie: distribución clases */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"16px",flex:"0 0 auto",animation:"fv-cardIn .5s ease .25s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{fontSize:14}}>🎭</span>
              <span style={{...orb(11,700),color:C.white}}>CLASES</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <PieChart width={80} height={80}>
                <Pie data={DATA_CLASES} cx={35} cy={35} innerRadius={22} outerRadius={38}
                  dataKey="value" stroke="none">
                  {DATA_CLASES.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
              </PieChart>
              <div style={{flex:1}}>
                {DATA_CLASES.map((d,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <div style={{width:7,height:7,background:d.color,flexShrink:0}}/>
                    <span style={{...raj(11,600),color:C.mutedL,flex:1}}>{d.name}</span>
                    <span style={{...raj(11,700),color:d.color}}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* stat bars */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"16px",flex:1,animation:"fv-cardIn .5s ease .3s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <Zap size={14} color={C.gold}/>
              <span style={{...orb(11,700),color:C.white}}>MÉTRICAS</span>
            </div>
            <StatBar label="XP Total"    val={124800} max={200000} color={C.orange}/>
            <StatBar label="Sesiones"    val={1248}   max={2000}   color={C.blue}/>
            <StatBar label="Logros"      val={312}    max={500}    color={C.gold}/>
            <StatBar label="Misiones OK" val={312}    max={400}    color={C.green}/>
          </div>
        </div>
      </div>

      {/* bottom: users table + activity */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14,minHeight:280}}>
        <UsersTable/>
        <ActivityFeed/>
      </div>
    </div>
  );
}

// ── placeholder for other sections ────────────────────────────
function ComingSoonView({section}) {
  const s = NAV_ITEMS.find(n=>n.id===section);
  const Icon = s?.icon||Settings;
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{background:`${C.orange}14`,border:`1px solid ${C.orange}33`,padding:"24px",
        animation:"fv-cardIn .4s ease both"}}>
        <Icon size={48} color={C.orange}/>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{...orb(18,900),color:C.orange,marginBottom:8,animation:"fv-glow 2s ease-in-out infinite"}}>
          {s?.label?.toUpperCase()||"SECCIÓN"}
        </div>
        <div style={{...raj(15,500),color:C.muted,marginBottom:4}}>
          Módulo CRUD completo — próximamente
        </div>
        <div style={{...raj(13,400),color:`${C.muted}88`}}>
          Gestión en tiempo real con Firebase
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        {[Plus,Edit2,Trash2,RefreshCw].map((Ic,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.navy}`,padding:"12px",
            display:"flex",alignItems:"center",justifyContent:"center",opacity:.4}}>
            <Ic size={18} color={C.muted}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function AdminDashboard({onLogout}) {
  const [active,setActive] = useState("dashboard");
  const clock = useClock();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden",position:"relative"}}>

        {/* subtle bg grid */}
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
          backgroundImage:`linear-gradient(${C.navy}10 1px,transparent 1px),linear-gradient(90deg,${C.navy}10 1px,transparent 1px)`,
          backgroundSize:"40px 40px"}}/>

        <Sidebar active={active} setActive={setActive} onLogout={onLogout}/>

        {/* main */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1}}>
          <TopBar active={active} clock={clock} notifications={3}/>

          {/* content */}
          <div style={{flex:1,overflowY:"auto",padding:"20px 24px",
            background:`linear-gradient(160deg,${C.bg} 0%,${C.panel}55 100%)`}}>
            {active==="dashboard"  && <DashboardView/>}
            {active==="usuarios"   && <AdminUsuarios/>}
            {active==="ejercicios" && <AdminEjercicios/>}
            {active==="rutinas"    && <AdminRutinas/>}
            {active==="misiones"   && <AdminMisiones/>}
            {active==="objetos"    && <AdminObjetos/>}
            {!["dashboard","usuarios","ejercicios","rutinas","misiones","objetos"].includes(active) && <ComingSoonView section={active}/>}
          </div>
        </div>
      </div>
    </>
  );
}