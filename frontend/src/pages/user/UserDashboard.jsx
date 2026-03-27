// src/pages/user/UserDashboard.jsx
// ─────────────────────────────────────────────────────────────
//  Dashboard principal del jugador de ForgeVenture.
//  Props: profile (objeto del usuario), onLogout (función)
//  Conectar: las secciones usarán sus propias páginas/servicios.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  Home, Dumbbell, ClipboardList, Target, Trophy, ShoppingBag,
  User, LogOut, Bell, Settings, ChevronRight, Zap, Flame,
  Star, Shield, TrendingUp, Calendar, Clock, Play,
  Award, Check, Lock, BarChart2, Menu, X,
} from "lucide-react";
import UserEjercicios from "./UserEjercicios";
import UserRutinas    from "./UserRutinas";
import UserMisiones   from "./UserMisiones";
import UserLogros     from "./UserLogros";
import UserTienda     from "./UserTienda";
import UserPerfil     from "./UserPerfil";

// ── Font injection ─────────────────────────────────────────────
if (!document.getElementById("ud-fonts")) {
  const l = document.createElement("link");
  l.id   = "ud-fonts"; l.rel  = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap";
  document.head.appendChild(l);
}

const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

const CSS = `
  @keyframes ud-fadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ud-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes ud-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ud-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ud-glow    { 0%,100%{text-shadow:0 0 14px #E85D04} 50%{text-shadow:0 0 32px #E85D04,0 0 60px #E85D0444} }
  @keyframes ud-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ud-xpfill  { from{width:0} to{width:var(--xw)} }
  @keyframes ud-scan    { 0%{top:-2px} 100%{top:100%} }
  @keyframes ud-shine   { 0%{left:-100%} 100%{left:200%} }
  @keyframes ud-badgePop{ 0%{transform:scale(0) rotate(-15deg);opacity:0} 70%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ud-streakFire { 0%,100%{filter:drop-shadow(0 0 6px #E85D04)} 50%{filter:drop-shadow(0 0 18px #FF9F1C)} }
  @keyframes ud-ring    { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }

  * { box-sizing:border-box; margin:0; padding:0; }

  ::-webkit-scrollbar       { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:${C.panel}; }
  ::-webkit-scrollbar-thumb { background:${C.orange}; }

  .ud-nav-item { transition:all .18s; cursor:pointer; user-select:none; }
  .ud-nav-item:hover { background:${C.navyL}28 !important; }
  .ud-card     { transition:transform .2s,box-shadow .2s; }
  .ud-card:hover { transform:translateY(-3px); box-shadow:0 14px 40px rgba(0,0,0,.5) !important; }
  .ud-btn      { transition:all .2s; cursor:pointer; }
  .ud-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ud-mission  { transition:all .18s; cursor:pointer; }
  .ud-mission:hover { background:${C.navyL}22 !important; border-color:${C.orange}55 !important; }
  .ud-notif-dot { animation:ud-pulse 1.4s ease-in-out infinite; }
  .ud-fire { animation:ud-streakFire 2s ease-in-out infinite; }
  .ud-scan-line { animation:ud-scan 8s linear infinite; }
  .ud-shine-bar::after { content:""; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent); animation:ud-shine 2.5s ease 1s 1; }

  /* Para section "coming soon" */
  .ud-soon { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:80px 20px; }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Clase configs ──────────────────────────────────────────────
const CLS = {
  GUERRERO:{ icon:"⚔️", color:C.orange,  primary:"Fuerza",       stats:{fuerza:95,resistencia:70,agilidad:55,vitalidad:60} },
  ARQUERO: { icon:"🏃", color:C.blue,    primary:"Cardio",       stats:{agilidad:95,resistencia:85,fuerza:50,vitalidad:70} },
  MAGO:    { icon:"🧘", color:C.purple,  primary:"Flexibilidad", stats:{vitalidad:95,agilidad:80,resistencia:75,fuerza:45} },
};

// ── Nav items (lado usuario) ───────────────────────────────────
const NAV = [
  { id:"home",      icon:Home,         label:"Dashboard",    badge:null  },
  { id:"ejercicios",icon:Dumbbell,     label:"Ejercicios",   badge:null  },
  { id:"rutinas",   icon:ClipboardList,label:"Mis Rutinas",  badge:"3"   },
  { id:"misiones",  icon:Target,       label:"Misiones",     badge:"2"   },
  { id:"logros",    icon:Trophy,       label:"Logros",       badge:null  },
  { id:"tienda",    icon:ShoppingBag,  label:"Tienda",       badge:"NEW" },
  { id:"perfil",    icon:User,         label:"Mi Perfil",    badge:null  },
];

// ── Mock data del jugador ──────────────────────────────────────
const MOCK_PLAYER = {
  username: "Aragorn_Dev",
  heroClass:"GUERRERO",
  level:    12,
  xp:       2840,
  xpNext:   3000,
  hp:       88,
  hpMax:    100,
  streak:   14,
  badges:   3,
  coins:    420,
};

const MOCK_MISSIONS = [
  { id:"m1", title:"Guerrero Diario",  type:"Diaria",  xp:150, done:true,  icon:"⚔️", progress:1, total:1,  expires:"23:14:22" },
  { id:"m2", title:"Cardio Libre",     type:"Diaria",  xp:120, done:false, icon:"🏃", progress:0, total:1,  expires:"23:14:22" },
  { id:"m3", title:"Semana de Hierro", type:"Semanal", xp:400, done:false, icon:"🔥", progress:3, total:7,  expires:"5d 12h" },
  { id:"m4", title:"Sprint Épico",     type:"Semanal", xp:250, done:false, icon:"⚡", progress:1, total:3,  expires:"5d 12h" },
];

const MOCK_RECENT_EXERCISE = [
  { icon:"💪", name:"Flexiones",  sets:"3×15", xp:"+90 XP",  time:"Hace 2h",  color:C.orange },
  { icon:"🦵", name:"Sentadillas",sets:"4×12", xp:"+140 XP", time:"Ayer",      color:C.blue   },
  { icon:"🏋️", name:"Plancha",    sets:"3×60s",xp:"+120 XP", time:"Hace 2d",  color:C.teal   },
  { icon:"🧘", name:"Yoga",       sets:"20min",xp:"+90 XP",  time:"Hace 3d",  color:C.purple },
];

const MOCK_LOGROS_RECIENTES = [
  { icon:"🏆", name:"Guerrero Semanal",  rareza:"Raro",      color:C.blue,   isNew:true  },
  { icon:"🔥", name:"Racha de 14 días",  rareza:"Raro",      color:C.red,    isNew:true  },
  { icon:"💪", name:"Centenario",        rareza:"Épico",     color:C.purple, isNew:false },
  { icon:"⭐", name:"Primer Paso",       rareza:"Común",     color:C.muted,  isNew:false },
];

const MOCK_LEADERBOARD = [
  { pos:1, name:"GandalfZen",    level:21, xp:5600, clase:"MAGO"    },
  { pos:2, name:"ArwenSpeed",    level:15, xp:3800, clase:"ARQUERO" },
  { pos:3, name:"GimliAxe",      level:18, xp:4500, clase:"GUERRERO"},
  { pos:4, name:"Aragorn_Dev",   level:12, xp:2840, clase:"GUERRERO", isMe:true },
  { pos:5, name:"BoromirStrong", level:9,  xp:2100, clase:"GUERRERO"},
];

// ══════════════════════════════════════════════════════════════
// UI ATOMS
// ══════════════════════════════════════════════════════════════
function MiniBar({val,max,color,height=6,animated=false}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%",position:"relative"}}>
      <div className={animated?"ud-shine-bar":""} style={{height:"100%","--xw":`${pct}%`,width:animated?undefined:`${pct}%`,
        animation:animated?`ud-xpfill 1.8s ease .3s both`:undefined,
        background:`linear-gradient(90deg,${color}88,${color})`,boxShadow:`0 0 8px ${color}55`,position:"relative"}}
        ref={el=>el&&animated&&(el.style.width=`${pct}%`)}/>
    </div>
  );
}

function Glow({color,size=300,x="50%",y="50%",opacity=0.08}) {
  return <div style={{position:"absolute",left:x,top:y,width:size,height:size,borderRadius:"50%",background:color,filter:"blur(80px)",opacity,transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>;
}

function StatBar({label,val,color}) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{...raj(11,600),color:C.muted}}>{label}</span>
        <span style={{...raj(11,700),color}}>{val}</span>
      </div>
      <MiniBar val={val} max={100} color={color} height={5}/>
    </div>
  );
}

function BadgeCircle({icon,color,isNew=false,size=44}) {
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:"50%",background:`${color}18`,
        border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*.44,boxShadow:`0 0 14px ${color}33`,animation:"ud-float 3s ease-in-out infinite"}}>
        {icon}
      </div>
      {isNew&&(
        <div style={{position:"absolute",top:-3,right:-3,background:C.orange,borderRadius:"50%",
          width:14,height:14,border:`2px solid ${C.bg}`,animation:"ud-badgePop .5s ease both"}}/>
      )}
    </div>
  );
}

// ── Pantalla Coming Soon para secciones ──────────────────────
function ComingSoon({section,color=C.orange}) {
  const labels = {
    ejercicios:"EJERCICIOS", rutinas:"MIS RUTINAS", misiones:"MISIONES",
    logros:"LOGROS",         tienda:"TIENDA",        perfil:"MI PERFIL",
  };
  return (
    <div className="ud-soon">
      <div style={{fontSize:56,animation:"ud-float 2.5s ease-in-out infinite",filter:`drop-shadow(0 0 20px ${color})`}}>🚧</div>
      <div style={{...orb(14,900),color,letterSpacing:".06em"}}>{labels[section]||section.toUpperCase()}</div>
      <div style={{...raj(14,500),color:C.muted}}>Módulo en construcción</div>
      <div style={{background:`${color}0D`,border:`1px solid ${color}22`,padding:"12px 24px",...raj(12,500),color:C.mutedL}}>
        Este módulo estará disponible próximamente en tu aventura.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HOME VIEW — Contenido principal del dashboard
// ══════════════════════════════════════════════════════════════
function HomeView({profile}) {
  const p = { ...MOCK_PLAYER, ...profile };
  const cls = CLS[p.heroClass] || CLS.GUERRERO;
  const xpPct = Math.round((p.xp / p.xpNext) * 100);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* ── HERO BANNER ── */}
      <div style={{background:C.card,border:`1px solid ${cls.color}33`,
        boxShadow:`0 0 40px ${cls.color}0A,0 8px 32px rgba(0,0,0,.4)`,
        overflow:"hidden",position:"relative",animation:"ud-cardIn .4s ease both"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${cls.color},transparent)`}}/>
        <Glow color={cls.color} size={400} x="80%" y="50%" opacity={0.06}/>
        {/* Scan line */}
        <div className="ud-scan-line" style={{position:"absolute",left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${cls.color}33,transparent)`,pointerEvents:"none",zIndex:1}}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:20,padding:"28px 32px",alignItems:"center",position:"relative",zIndex:2}}>
          {/* Left: info del héroe */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{background:`${cls.color}18`,border:`1px solid ${cls.color}44`,padding:"5px 12px",...raj(12,700),color:cls.color}}>
                {cls.icon} {p.heroClass}
              </div>
              <div style={{background:`${C.gold}14`,border:`1px solid ${C.gold}44`,padding:"5px 12px",...raj(12,700),color:C.gold}}>
                ⭐ NIVEL {p.level}
              </div>
              {p.streak>0&&(
                <div className="ud-fire" style={{background:`${C.red}14`,border:`1px solid ${C.red}44`,padding:"5px 12px",...raj(12,700),color:C.orangeL}}>
                  🔥 {p.streak} días
                </div>
              )}
            </div>

            <div style={{...orb("clamp(20px,2vw,28px)",900),color:C.white,marginBottom:4,animation:"ud-glow 3s ease-in-out infinite"}}>
              {(p.username||"HÉROE").toUpperCase()}
            </div>
            <div style={{...raj(13,500),color:C.muted,marginBottom:20}}>Tu aventura continúa, guerrero.</div>

            {/* XP Bar */}
            <div style={{marginBottom:4}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{...px(6),color:C.muted,letterSpacing:".05em"}}>XP · Nivel {p.level}</span>
                <span style={{...raj(12,700),color:C.gold}}>{p.xp.toLocaleString()} / {p.xpNext.toLocaleString()}</span>
              </div>
              <div style={{height:12,background:C.panel,border:`1px solid ${C.gold}33`,overflow:"hidden",position:"relative"}}>
                <div className="ud-shine-bar" style={{height:"100%",width:`${xpPct}%`,
                  background:`linear-gradient(90deg,${C.gold}88,${C.gold})`,
                  boxShadow:`0 0 10px ${C.gold}66`,position:"relative",transition:"width 1.5s ease"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)",animation:"ud-shine 2s ease 1s 1"}}/>
                </div>
              </div>
              <div style={{...raj(11,600),color:C.muted,marginTop:5}}>{xpPct}% hacia Nivel {p.level+1} — faltan {(p.xpNext-p.xp).toLocaleString()} XP</div>
            </div>
          </div>

          {/* Center: character big icon */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{width:120,height:120,borderRadius:"50%",
              background:`radial-gradient(circle at 35% 35%,${cls.color}28,${cls.color}08 70%,transparent)`,
              border:`3px solid ${cls.color}55`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,
              boxShadow:`0 0 40px ${cls.color}44,inset 0 0 30px ${cls.color}14`,
              animation:"ud-float 3s ease-in-out infinite"}}>
              {cls.icon}
            </div>
            {/* HP bar */}
            <div style={{width:"100%",minWidth:100}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{...px(5),color:C.muted}}>HP</span>
                <span style={{...raj(11,700),color:C.green}}>{p.hp}/{p.hpMax}</span>
              </div>
              <MiniBar val={p.hp} max={p.hpMax} color={C.green} height={8}/>
            </div>
          </div>

          {/* Right: stat bars */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:12,letterSpacing:".05em"}}>ESTADÍSTICAS</div>
            <StatBar label="Fuerza"       val={cls.stats.fuerza}      color={C.orange}/>
            <StatBar label="Resistencia"  val={cls.stats.resistencia}  color={C.blue}/>
            <StatBar label="Agilidad"     val={cls.stats.agilidad}     color={C.teal}/>
            <StatBar label="Vitalidad"    val={cls.stats.vitalidad}    color={C.green}/>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {icon:"⚡",label:"XP TOTAL",   value:p.xp.toLocaleString(),   color:C.gold   },
          {icon:"🔥",label:"RACHA",      value:`${p.streak} días`,      color:C.red    },
          {icon:"🏆",label:"LOGROS",     value:p.badges,                color:C.purple },
          {icon:"💰",label:"MONEDAS",    value:p.coins,                 color:C.orangeL},
        ].map((s,i)=>(
          <div key={i} className="ud-card" style={{background:C.card,border:`1px solid ${s.color}22`,
            padding:"16px 18px",display:"flex",alignItems:"center",gap:14,
            animation:`ud-cardIn .4s ease ${i*.07}s both`,boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
            <span style={{fontSize:28,filter:`drop-shadow(0 0 8px ${s.color}66)`}}>{s.icon}</span>
            <div>
              <div style={{...orb(20,900),color:s.color,marginBottom:2}}>{s.value}</div>
              <div style={{...px(5),color:C.muted,letterSpacing:".05em"}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILA MEDIA: Misiones + Ejercicio rápido ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>

        {/* Misiones activas */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"ud-cardIn .4s ease .1s both"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.navy}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Target size={16} color={C.orange}/>
              <span style={{...orb(11,700),color:C.white}}>MISIONES ACTIVAS</span>
            </div>
            <span style={{...raj(11,600),color:C.muted}}>{MOCK_MISSIONS.filter(m=>!m.done).length} pendientes</span>
          </div>
          <div style={{padding:"8px 0"}}>
            {MOCK_MISSIONS.map((m,i)=>{
              const pct=Math.round((m.progress/m.total)*100);
              const typeColor=m.type==="Diaria"?C.orange:C.blue;
              return (
                <div key={m.id} className="ud-mission" style={{display:"flex",alignItems:"center",gap:14,
                  padding:"14px 20px",borderBottom:`1px solid ${C.navy}18`,
                  border:m.done?`1px solid ${C.green}18`:"none",
                  borderLeft:m.done?`3px solid ${C.green}`:"3px solid transparent",
                  background:m.done?`${C.green}05`:"transparent",
                  animation:`ud-fadeIn .35s ease ${i*.08}s both`}}>
                  <span style={{fontSize:22,filter:m.done?`drop-shadow(0 0 6px ${C.green})`:"none"}}>{m.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{...raj(13,700),color:m.done?C.green:C.white}}>{m.title}</span>
                      {m.done&&<Check size={13} color={C.green}/>}
                      <span style={{...raj(9,700),color:typeColor,background:`${typeColor}14`,
                        border:`1px solid ${typeColor}33`,padding:"1px 7px",marginLeft:"auto"}}>{m.type}</span>
                    </div>
                    {!m.done&&m.total>1&&(
                      <div style={{marginBottom:4}}>
                        <MiniBar val={m.progress} max={m.total} color={typeColor} height={4}/>
                        <span style={{...raj(10,500),color:C.muted}}>{m.progress}/{m.total}</span>
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{...raj(11,700),color:C.gold}}>+{m.xp} XP</span>
                      <span style={{...raj(10,500),color:C.muted}}>⏳ {m.expires}</span>
                    </div>
                  </div>
                  {!m.done&&(
                    <button className="ud-btn" style={{background:`${C.orange}18`,border:`1px solid ${C.orange}44`,
                      padding:"7px 14px",...raj(11,700),color:C.orange,cursor:"pointer",flexShrink:0,
                      transition:"all .2s"}}>
                      IR →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start session CTA + stats rápidos */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* CTA */}
          <div style={{background:`linear-gradient(135deg,${C.card},${C.panel})`,
            border:`1px solid ${C.orange}44`,padding:"28px 24px",textAlign:"center",position:"relative",overflow:"hidden",
            animation:"ud-cardIn .4s ease .15s both"}}>
            <Glow color={C.orange} size={200} x="50%" y="50%" opacity={0.08}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontSize:44,marginBottom:12,animation:"ud-float 2.5s ease-in-out infinite",filter:`drop-shadow(0 0 14px ${C.orange})`}}>⚔️</div>
              <div style={{...orb(12,900),color:C.white,marginBottom:6}}>¿LISTO PARA ENTRENAR?</div>
              <div style={{...raj(12,500),color:C.muted,marginBottom:20,lineHeight:1.5}}>Cada sesión te acerca más a la leyenda.</div>
              <button className="ud-btn" style={{width:"100%",...px(8),color:C.bg,background:C.orange,border:"none",
                padding:"14px",cursor:"pointer",boxShadow:`0 6px 28px ${C.orange}55`,
                display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <Play size={14} fill={C.bg}/> INICIAR SESIÓN
              </button>
            </div>
          </div>

          {/* Próxima rutina */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"16px 18px",animation:"ud-cardIn .4s ease .2s both"}}>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📋 PRÓXIMA RUTINA</div>
            <div style={{...raj(13,700),color:C.white,marginBottom:4}}>Guerrero del Hierro</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <span style={{...raj(10,600),color:C.orange,background:`${C.orange}14`,border:`1px solid ${C.orange}33`,padding:"2px 8px"}}>Fuerza</span>
              <span style={{...raj(10,600),color:C.muted,background:`${C.muted}14`,border:`1px solid ${C.muted}33`,padding:"2px 8px"}}>55 min</span>
              <span style={{...raj(10,600),color:C.gold,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,padding:"2px 8px"}}>+220 XP</span>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {["💪","🏋️","🦵","🔝","🏋️"].map((e,i)=>(
                <span key={i} style={{width:28,height:28,background:`${C.orange}18`,border:`1px solid ${C.orange}33`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{e}</span>
              ))}
              <span style={{...raj(11,500),color:C.muted,alignSelf:"center"}}>5 ejercicios</span>
            </div>
            <button className="ud-btn" style={{width:"100%",...raj(12,700),color:C.orange,background:"transparent",
              border:`1px solid ${C.orange}44`,padding:"9px",cursor:"pointer"}}>
              VER RUTINA →
            </button>
          </div>
        </div>
      </div>

      {/* ── FILA BAJA: Actividad reciente + Logros + Leaderboard ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>

        {/* Actividad reciente */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"ud-cardIn .4s ease .2s both"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:`1px solid ${C.navy}`}}>
            <Clock size={14} color={C.teal}/><span style={{...orb(10,700),color:C.white}}>ACTIVIDAD RECIENTE</span>
          </div>
          {MOCK_RECENT_EXERCISE.map((e,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",
              borderBottom:`1px solid ${C.navy}18`,animation:`ud-fadeIn .3s ease ${i*.07}s both`}}>
              <div style={{width:34,height:34,background:`${e.color}18`,border:`1px solid ${e.color}33`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{e.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...raj(12,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                <div style={{...raj(10,500),color:C.muted}}>{e.sets}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{...raj(11,700),color:C.gold}}>{e.xp}</div>
                <div style={{...raj(9,500),color:C.muted}}>{e.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Logros recientes */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"ud-cardIn .4s ease .25s both"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:`1px solid ${C.navy}`}}>
            <Trophy size={14} color={C.gold}/><span style={{...orb(10,700),color:C.white}}>LOGROS RECIENTES</span>
          </div>
          <div style={{padding:"12px 18px",display:"flex",flexDirection:"column",gap:12}}>
            {MOCK_LOGROS_RECIENTES.map((l,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,animation:`ud-fadeIn .3s ease ${i*.07}s both`}}>
                <BadgeCircle icon={l.icon} color={l.color} isNew={l.isNew} size={40}/>
                <div style={{flex:1}}>
                  <div style={{...raj(12,700),color:C.white,marginBottom:2}}>{l.name}</div>
                  <div style={{...raj(10,600),color:l.color,background:`${l.color}14`,
                    border:`1px solid ${l.color}33`,padding:"1px 7px",display:"inline-block"}}>{l.rareza}</div>
                </div>
                {l.isNew&&(
                  <span style={{...raj(8,700),color:C.orange,background:`${C.orange}18`,
                    border:`1px solid ${C.orange}33`,padding:"2px 6px"}}>¡NUEVO!</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"ud-cardIn .4s ease .3s both"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:`1px solid ${C.navy}`}}>
            <BarChart2 size={14} color={C.blue}/><span style={{...orb(10,700),color:C.white}}>LEADERBOARD</span>
          </div>
          {MOCK_LEADERBOARD.map((u,i)=>{
            const medals=["🥇","🥈","🥉"];
            const clsColor={GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",
                borderBottom:`1px solid ${C.navy}18`,
                background:u.isMe?`${C.orange}08`:"transparent",
                borderLeft:u.isMe?`3px solid ${C.orange}`:"3px solid transparent",
                animation:`ud-fadeIn .3s ease ${i*.07}s both`}}>
                <div style={{width:22,textAlign:"center",fontSize:u.pos<=3?18:12,
                  color:u.pos<=3?undefined:C.muted,...(u.pos>3&&raj(12,700))}}>
                  {u.pos<=3?medals[u.pos-1]:`#${u.pos}`}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{...raj(12,u.isMe?700:600),color:u.isMe?C.orange:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {u.name}{u.isMe&&" (tú)"}
                  </div>
                  <div style={{...raj(9,600),color:clsColor[u.clase],marginTop:1}}>{u.clase}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{...raj(11,700),color:C.gold}}>Lv.{u.level}</div>
                  <div style={{...raj(9,500),color:C.muted}}>{u.xp.toLocaleString()} XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function UserDashboard({ profile: propProfile, onLogout }) {
  const profile = propProfile || MOCK_PLAYER;
  const cls     = CLS[profile.heroClass] || CLS.GUERRERO;
  const [active,       setActive]       = useState("home");
  const [sideCollapsed,setSideCollapsed]= useState(false);
  const [notifs,       setNotifs]       = useState(3);
  const [time,         setTime]         = useState(new Date());

  // Reloj en vivo
  useEffect(() => {
    const t = setInterval(()=>setTime(new Date()), 1000);
    return ()=>clearInterval(t);
  },[]);

  const activeNav = NAV.find(n=>n.id===active)||NAV[0];
  const SIDE_W    = sideCollapsed ? 64 : 230;

  return (
    <>
      <style>{CSS}</style>

      <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden",fontFamily:"'Rajdhani',sans-serif"}}>

        {/* ══ SIDEBAR ══ */}
        <div style={{width:SIDE_W,background:C.side,borderRight:`1px solid ${C.navy}`,
          display:"flex",flexDirection:"column",flexShrink:0,
          transition:"width .25s ease",overflow:"hidden",zIndex:10}}>

          {/* Logo */}
          <div style={{padding:"18px 16px",borderBottom:`1px solid ${C.navy}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            {!sideCollapsed&&(
              <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                <span style={{fontSize:18,filter:`drop-shadow(0 0 6px ${C.orange})`}}>⚔️</span>
                <span style={{...px(7),color:C.orange,letterSpacing:".04em",whiteSpace:"nowrap"}}>FORGE</span>
                <span style={{...px(7),color:C.white,whiteSpace:"nowrap"}}>VENTURE</span>
              </div>
            )}
            {sideCollapsed&&<span style={{fontSize:18,filter:`drop-shadow(0 0 6px ${C.orange})`,margin:"0 auto"}}>⚔️</span>}
            <button onClick={()=>setSideCollapsed(v=>!v)} style={{background:"transparent",border:`1px solid ${C.navy}`,
              padding:5,color:C.muted,cursor:"pointer",display:"flex",flexShrink:0,marginLeft:sideCollapsed?0:8,
              transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.orange}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.navy}>
              {sideCollapsed?<ChevronRight size={14}/>:<Menu size={14}/>}
            </button>
          </div>

          {/* Perfil mini */}
          {!sideCollapsed&&(
            <div style={{padding:"16px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`${cls.color}18`,
                  border:`2px solid ${cls.color}44`,display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:20,flexShrink:0}}>{cls.icon}</div>
                <div style={{minWidth:0}}>
                  <div style={{...raj(13,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile.username||"Héroe"}</div>
                  <div style={{...raj(11,600),color:cls.color}}>Lv.{profile.level||1} {profile.heroClass||"GUERRERO"}</div>
                </div>
              </div>
              <div style={{marginTop:10}}>
                <MiniBar val={profile.xp||0} max={profile.xpNext||1000} color={C.gold} height={5} animated/>
                <div style={{...raj(9,500),color:C.muted,marginTop:3}}>
                  {profile.xp||0} / {profile.xpNext||1000} XP
                </div>
              </div>
            </div>
          )}
          {sideCollapsed&&(
            <div style={{padding:"12px 0",borderBottom:`1px solid ${C.navy}`,display:"flex",justifyContent:"center",flexShrink:0}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`${cls.color}18`,
                border:`2px solid ${cls.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                {cls.icon}
              </div>
            </div>
          )}

          {/* Nav items */}
          <nav style={{flex:1,overflowY:"auto",padding:"10px 0"}}>
            {NAV.map(n=>{
              const on=active===n.id;
              return (
                <button key={n.id} onClick={()=>setActive(n.id)} className="ud-nav-item"
                  style={{width:"100%",display:"flex",alignItems:"center",
                    gap:sideCollapsed?0:10,padding:sideCollapsed?"12px 0":"11px 16px",
                    justifyContent:sideCollapsed?"center":"flex-start",
                    background:on?`${cls.color}14`:"transparent",
                    border:"none",borderLeft:`3px solid ${on?cls.color:"transparent"}`,
                    cursor:"pointer",position:"relative"}}>
                  <n.icon size={16} color={on?cls.color:C.muted}/>
                  {!sideCollapsed&&<span style={{...raj(13,on?700:500),color:on?cls.color:C.mutedL}}>{n.label}</span>}
                  {n.badge&&!sideCollapsed&&(
                    <span style={{position:"absolute",right:12,...raj(9,700),
                      color:n.badge==="NEW"?C.green:C.bg,
                      background:n.badge==="NEW"?`${C.green}14`:C.orange,
                      border:`1px solid ${n.badge==="NEW"?C.green:C.orange}55`,
                      padding:"1px 6px"}}>
                      {n.badge}
                    </span>
                  )}
                  {n.badge&&sideCollapsed&&(
                    <div style={{position:"absolute",top:8,right:10,width:7,height:7,
                      background:C.orange,borderRadius:"50%"}}/>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{padding:"12px 8px",borderTop:`1px solid ${C.navy}`,flexShrink:0}}>
            <button onClick={onLogout} className="ud-nav-item"
              style={{width:"100%",display:"flex",alignItems:"center",gap:sideCollapsed?0:10,
                padding:sideCollapsed?"11px 0":"11px 14px",
                justifyContent:sideCollapsed?"center":"flex-start",
                background:"transparent",border:"none",
                cursor:"pointer",color:C.muted}}>
              <LogOut size={15} color={C.muted}/>
              {!sideCollapsed&&<span style={{...raj(13,500),color:C.muted}}>Cerrar Sesión</span>}
            </button>
          </div>
        </div>

        {/* ══ MAIN ══ */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

          {/* TopBar */}
          <div style={{height:56,background:C.side,borderBottom:`1px solid ${C.navy}`,
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"0 24px",flexShrink:0,gap:12}}>
            {/* breadcrumb */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <activeNav.icon size={15} color={cls.color}/>
              <span style={{...raj(14,700),color:C.white}}>{activeNav.label}</span>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:16}}>
              {/* Racha */}
              {profile.streak>0&&(
                <div style={{display:"flex",alignItems:"center",gap:5,...raj(12,700),color:C.orangeL}}>
                  <Flame size={13} className="ud-fire" color={C.orangeL}/> {profile.streak} días
                </div>
              )}
              {/* monedas */}
              <div style={{display:"flex",alignItems:"center",gap:5,...raj(12,700),color:C.gold}}>
                <span>💰</span> {profile.coins||420}
              </div>
              {/* Reloj */}
              <div style={{...raj(12,600),color:C.muted}}>
                {time.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}
              </div>
              {/* Notificaciones */}
              <div style={{position:"relative",cursor:"pointer"}}>
                <Bell size={18} color={C.muted}/>
                {notifs>0&&(
                  <>
                    <div className="ud-notif-dot" style={{position:"absolute",top:-3,right:-3,
                      width:15,height:15,background:C.orange,borderRadius:"50%",
                      border:`2px solid ${C.side}`,display:"flex",alignItems:"center",justifyContent:"center",...px(5),color:C.bg}}>
                      {notifs}
                    </div>
                    <div style={{position:"absolute",top:-3,right:-3,width:15,height:15,
                      borderRadius:"50%",background:C.orange,animation:"ud-ring 1.5s ease-in-out infinite"}}/>
                  </>
                )}
              </div>
              {/* avatar */}
              <div style={{width:32,height:32,borderRadius:"50%",background:`${cls.color}18`,
                border:`2px solid ${cls.color}44`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16,cursor:"pointer"}} onClick={()=>setActive("perfil")}>
                {cls.icon}
              </div>
            </div>
          </div>

          {/* Content scroll */}
          <div style={{flex:1,overflowY:"auto",padding:"24px",position:"relative"}}>
            {/* Grid background */}
            <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
              backgroundImage:`linear-gradient(${C.navy}10 1px,transparent 1px),linear-gradient(90deg,${C.navy}10 1px,transparent 1px)`,
              backgroundSize:"48px 48px"}}/>
            <div style={{position:"relative",zIndex:1}}>
              {active==="home"        && <HomeView profile={profile}/>}
              {active==="ejercicios"  && <UserEjercicios profile={profile}/>}
              {active==="rutinas"     && <UserRutinas    profile={profile}/>}
              {active==="misiones"    && <UserMisiones   profile={profile}/>}
              {active==="logros"      && <UserLogros     profile={profile}/>}
              {active==="tienda"      && <UserTienda     profile={profile}/>}
              {active==="perfil"      && <UserPerfil     profile={profile} onLogout={onLogout}/>}
              {!["home","ejercicios","rutinas","misiones","logros","tienda","perfil"].includes(active) && <ComingSoon section={active} color={cls.color}/>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}