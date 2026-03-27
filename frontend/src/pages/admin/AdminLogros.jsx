// src/pages/admin/AdminLogros.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de logros/badges para ForgeVenture Admin.
//  Tipos: Ejercicio | Racha | Nivel | Social | Especial | Secreto
//  Conectar: getLogros(), createLogro(), updateLogro(),
//            deleteLogro() desde api.js cuando esté el backend.
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Trophy, Zap, Star,
  BarChart2, Lock, Unlock, EyeOff, Award,
} from "lucide-react";

const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

const CSS = `
  @keyframes l-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes l-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes l-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes l-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes l-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes l-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes l-shine   { 0%{transform:translateX(-100%) rotate(25deg)} 100%{transform:translateX(200%) rotate(25deg)} }
  @keyframes l-glow    { 0%,100%{box-shadow:0 0 10px var(--gc)} 50%{box-shadow:0 0 28px var(--gc),0 0 50px var(--gc)} }
  @keyframes l-badge   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-4px) scale(1.05)} }

  .l-row     { transition:background .15s; }
  .l-row:hover { background:${C.navyL}18 !important; }
  .l-btn     { transition:all .18s; cursor:pointer; }
  .l-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .l-icon-btn { transition:all .2s; cursor:pointer; }
  .l-input   { transition:border-color .2s,box-shadow .2s; outline:none; }
  .l-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .l-input::placeholder { color:${C.navy}; }
  .l-sort    { cursor:pointer; user-select:none; transition:color .2s; }
  .l-sort:hover { color:${C.orange} !important; }
  .l-card    { transition:all .22s; }
  .l-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.5) !important; }
  .l-tab     { transition:all .2s; cursor:pointer; }
  .l-req-row { transition:background .15s; }
  .l-req-row:hover { background:${C.navyL}18 !important; }
  .l-badge-preview:hover .l-shine-effect { animation: l-shine .6s ease; }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Tipos ──────────────────────────────────────────────────────
const TIPOS = {
  Ejercicio: { color:C.orange,  icon:"💪", bg:"#E85D0414", desc:"Completar ejercicios específicos" },
  Racha:     { color:C.red,     icon:"🔥", bg:"#E74C3C14", desc:"Mantener rachas de entrenamiento" },
  Nivel:     { color:C.gold,    icon:"⬆️", bg:"#FFD70014", desc:"Alcanzar niveles en el juego" },
  Social:    { color:C.blue,    icon:"👥", bg:"#4CC9F014", desc:"Interacciones y comunidad" },
  Especial:  { color:C.purple,  icon:"🌟", bg:"#9B59B614", desc:"Eventos y fechas especiales" },
  Secreto:   { color:C.muted,   icon:"❓", bg:"#5A7A9A14", desc:"Condición oculta al jugador" },
};
const TIPO_KEYS = Object.keys(TIPOS);

// ── Rareza ─────────────────────────────────────────────────────
const RAREZA = {
  Común:     { color:C.muted,  tier:1 },
  Raro:      { color:C.blue,   tier:2 },
  Épico:     { color:C.purple, tier:3 },
  Legendario:{ color:C.gold,   tier:4 },
};
const RAREZA_KEYS = Object.keys(RAREZA);

// ── Tipos de condición que puede requerir un logro ─────────────
const COND_TIPOS = [
  { id:"sesiones_total",   icon:"🏃", label:"Total de sesiones",      unit:"sesiones" },
  { id:"racha_dias",       icon:"🔥", label:"Racha consecutiva",       unit:"días"     },
  { id:"xp_total",         icon:"⚡", label:"XP acumulado total",      unit:"XP"       },
  { id:"nivel_alcanzado",  icon:"⬆️", label:"Nivel alcanzado",          unit:"nivel"    },
  { id:"ejercicio_tipo",   icon:"💪", label:"Sesiones de tipo fuerza", unit:"sesiones" },
  { id:"cardio_sesiones",  icon:"🏃", label:"Sesiones de cardio",      unit:"sesiones" },
  { id:"flex_sesiones",    icon:"🧘", label:"Sesiones de flexibilidad",unit:"sesiones" },
  { id:"misiones_compl",   icon:"🎯", label:"Misiones completadas",    unit:"misiones" },
  { id:"rutinas_compl",    icon:"📋", label:"Rutinas completadas",     unit:"rutinas"  },
  { id:"reps_totales",     icon:"🏋️", label:"Repeticiones totales",    unit:"reps"     },
  { id:"tiempo_total",     icon:"⏱️", label:"Tiempo activo total",     unit:"minutos"  },
  { id:"primer_login",     icon:"👋", label:"Primer inicio de sesión", unit:"veces"    },
  { id:"perfil_completo",  icon:"👤", label:"Perfil completado",       unit:"veces"    },
];

// ── Recompensas que otorga el logro ────────────────────────────
const RECOMP_TIPOS = [
  { id:"xp",     icon:"⚡", label:"XP Bonus"  },
  { id:"titulo", icon:"👑", label:"Título"    },
  { id:"item",   icon:"🎒", label:"Objeto"    },
  { id:"badge_xtra", icon:"🏅", label:"Badge Extra" },
];

const EMOJIS = [
  "🏆","🥇","🥈","🥉","🎖️","🏅","⭐","🌟","💫","✨",
  "🔥","⚡","💪","🦾","🛡️","⚔️","🗡️","🏹","🎯","🎪",
  "👑","💎","🔮","🌈","☄️","🐉","🦋","🌙","🌠","💥",
  "🤸","🧘","🏃","🏋️","🎽","🥊","🏊","🚴","🧗","🤼",
];

// ── Mock data ──────────────────────────────────────────────────
const MOCK_LOGROS = [
  { id:"lg1",  nombre:"Primer Paso",       tipo:"Ejercicio", rareza:"Común",     imagen:"👋",  xpBonus:50,   secreto:false, activo:true,  obtenidos:892,  descripcion:"Completa tu primera sesión de ejercicio.", descripcionSecreta:"",
    condiciones:[{tipo:"sesiones_total",label:"Total de sesiones",icon:"🏃",cantidad:1,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"50 XP"}], creadoEn:"2024-10-01" },
  { id:"lg2",  nombre:"Semana de Hierro",  tipo:"Racha",     rareza:"Raro",      imagen:"🔥",  xpBonus:200,  secreto:false, activo:true,  obtenidos:312,  descripcion:"Mantén una racha de 7 días seguidos.",  descripcionSecreta:"",
    condiciones:[{tipo:"racha_dias",label:"Racha consecutiva",icon:"🔥",cantidad:7,unidad:"días"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"200 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Guerrero Semanal"}], creadoEn:"2024-10-05" },
  { id:"lg3",  nombre:"Maestro del Fuego", tipo:"Racha",     rareza:"Legendario",imagen:"🏆",  xpBonus:2000, secreto:false, activo:true,  obtenidos:18,   descripcion:"Mantén una racha de 30 días consecutivos.", descripcionSecreta:"",
    condiciones:[{tipo:"racha_dias",label:"Racha consecutiva",icon:"🔥",cantidad:30,unidad:"días"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"2000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Llama Eterna"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Corona del Campeón"}], creadoEn:"2024-10-10" },
  { id:"lg4",  nombre:"Nivel 10",          tipo:"Nivel",     rareza:"Raro",      imagen:"⬆️",  xpBonus:300,  secreto:false, activo:true,  obtenidos:234,  descripcion:"Alcanza el nivel 10 con tu personaje.", descripcionSecreta:"",
    condiciones:[{tipo:"nivel_alcanzado",label:"Nivel alcanzado",icon:"⬆️",cantidad:10,unidad:"nivel"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"300 XP"}], creadoEn:"2024-10-15" },
  { id:"lg5",  nombre:"Cardio King",       tipo:"Ejercicio", rareza:"Épico",     imagen:"🏃",  xpBonus:500,  secreto:false, activo:true,  obtenidos:67,   descripcion:"Completa 50 sesiones de cardio.", descripcionSecreta:"",
    condiciones:[{tipo:"cardio_sesiones",label:"Sesiones de cardio",icon:"🏃",cantidad:50,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"500 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Rey del Cardio"}], creadoEn:"2024-10-20" },
  { id:"lg6",  nombre:"??? Misterio ???",  tipo:"Secreto",   rareza:"Legendario",imagen:"❓",  xpBonus:1000, secreto:true,  activo:true,  obtenidos:5,    descripcion:"Condición oculta.", descripcionSecreta:"Completa 100 sesiones de HIIT a máxima intensidad.",
    condiciones:[{tipo:"ejercicio_tipo",label:"Sesiones de tipo fuerza",icon:"💪",cantidad:100,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"1000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Sombra del Abismo"}], creadoEn:"2024-11-01" },
  { id:"lg7",  nombre:"Leyenda Viviente",  tipo:"Nivel",     rareza:"Legendario",imagen:"👑",  xpBonus:5000, secreto:false, activo:true,  obtenidos:3,    descripcion:"Alcanza el nivel 50.", descripcionSecreta:"",
    condiciones:[{tipo:"nivel_alcanzado",label:"Nivel alcanzado",icon:"⬆️",cantidad:50,unidad:"nivel"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"5000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Leyenda Viviente"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Orbe del Nivel"}], creadoEn:"2024-11-05" },
  { id:"lg8",  nombre:"Zen Master",        tipo:"Ejercicio", rareza:"Épico",     imagen:"🧘",  xpBonus:400,  secreto:false, activo:true,  obtenidos:89,   descripcion:"Completa 30 sesiones de yoga o flexibilidad.", descripcionSecreta:"",
    condiciones:[{tipo:"flex_sesiones",label:"Sesiones de flexibilidad",icon:"🧘",cantidad:30,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"400 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Alma Zen"}], creadoEn:"2024-11-10" },
  { id:"lg9",  nombre:"Centenario",        tipo:"Ejercicio", rareza:"Épico",     imagen:"💯",  xpBonus:800,  secreto:false, activo:true,  obtenidos:44,   descripcion:"Completa 100 sesiones de ejercicio en total.", descripcionSecreta:"",
    condiciones:[{tipo:"sesiones_total",label:"Total de sesiones",icon:"🏃",cantidad:100,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"800 XP"},{tipo:"badge_xtra",icon:"🏅",label:"Badge Extra",valor:"Escudo Centenario"}], creadoEn:"2024-11-15" },
  { id:"lg10", nombre:"Perfil Completo",   tipo:"Social",    rareza:"Común",     imagen:"👤",  xpBonus:100,  secreto:false, activo:true,  obtenidos:567,  descripcion:"Completa todos los campos de tu perfil de héroe.", descripcionSecreta:"",
    condiciones:[{tipo:"perfil_completo",label:"Perfil completado",icon:"👤",cantidad:1,unidad:"veces"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"100 XP"}], creadoEn:"2024-12-01" },
  { id:"lg11", nombre:"Millón de XP",      tipo:"Nivel",     rareza:"Legendario",imagen:"💎",  xpBonus:10000,secreto:false, activo:false, obtenidos:1,    descripcion:"Acumula 1,000,000 de XP total.", descripcionSecreta:"",
    condiciones:[{tipo:"xp_total",label:"XP acumulado total",icon:"⚡",cantidad:1000000,unidad:"XP"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"10000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"El Elegido"}], creadoEn:"2024-12-10" },
  { id:"lg12", nombre:"Sprint Épico",      tipo:"Racha",     rareza:"Raro",      imagen:"⚡",  xpBonus:250,  secreto:false, activo:true,  obtenidos:156,  descripcion:"Completa 3 sesiones de cardio en un solo día.", descripcionSecreta:"",
    condiciones:[{tipo:"cardio_sesiones",label:"Sesiones de cardio",icon:"🏃",cantidad:3,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"250 XP"}], creadoEn:"2025-01-10" },
];

const EMPTY_COND = { tipo:"sesiones_total", label:"Total de sesiones", icon:"🏃", cantidad:1, unidad:"sesiones" };
const EMPTY_FORM = { nombre:"", tipo:"Ejercicio", rareza:"Común", imagen:"🏆", xpBonus:100, secreto:false, activo:true, descripcion:"", descripcionSecreta:"", condiciones:[], recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:""}] };
const PAGE_SIZE_OPTIONS = [6,12,24];

// ── UI atoms ───────────────────────────────────────────────────
function MiniBar({val,color,height=5}) {
  return (<div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}><div style={{height:"100%",width:`${Math.min(val,100)}%`,background:color,boxShadow:`0 0 5px ${color}66`,transition:"width .6s"}}/></div>);
}
function TipoBadge({tipo}) {
  const m=TIPOS[tipo]||{color:C.muted,icon:"?",bg:C.panel};
  return <span style={{...raj(10,700),color:m.color,background:m.bg,border:`1px solid ${m.color}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{m.icon} {tipo}</span>;
}
function RarezaBadge({rareza}) {
  const r=RAREZA[rareza]||{color:C.muted,tier:1};
  const stars="★".repeat(r.tier);
  return <span style={{...raj(10,700),color:r.color,background:`${r.color}14`,border:`1px solid ${r.color}33`,padding:"2px 8px",whiteSpace:"nowrap",textShadow:r.tier>=3?`0 0 8px ${r.color}`:"none"}}>{rareza} {stars}</span>;
}
function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"l-spin .8s linear infinite"}}/>;
}
function SortIcon({active,dir}) {
  if(!active) return <ChevronDown size={11} color={C.navy}/>;
  return dir==="asc"?<ChevronUp size={11} color={C.orange}/>:<ChevronDown size={11} color={C.orange}/>;
}

// ── Badge preview visual ───────────────────────────────────────
function BadgePreview({logro,size="md"}) {
  const tm=TIPOS[logro.tipo]||{};
  const rm=RAREZA[logro.rareza]||{color:C.muted,tier:1};
  const c=rm.color;
  const dim=size==="lg"?90:size==="md"?64:44;
  const emojiSize=size==="lg"?36:size==="md"?26:18;
  return (
    <div className="l-badge-preview" style={{position:"relative",width:dim,height:dim,flexShrink:0,cursor:"default",
      "--gc":`${c}66`}}>
      {/* outer ring */}
      <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid ${c}`,
        boxShadow:`0 0 18px ${c}44,inset 0 0 18px ${c}18`,
        background:`radial-gradient(circle at 35% 35%,${c}28 0%,${c}08 60%,transparent 100%)`,
        animation:"l-badge 3s ease-in-out infinite"}}/>
      {/* inner bg */}
      <div style={{position:"absolute",inset:6,borderRadius:"50%",
        background:`radial-gradient(circle,${C.card} 60%,${c}18 100%)`,
        border:`1px solid ${c}44`}}/>
      {/* shine */}
      <div className="l-shine-effect" style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",
          background:"linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)",
          transform:"translateX(-100%) rotate(25deg)"}}/>
      </div>
      {/* emoji */}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:emojiSize,filter:logro.secreto?"blur(6px)":`drop-shadow(0 0 8px ${c}88)`}}>
        {logro.imagen}
      </div>
      {/* secret lock */}
      {logro.secreto&&(
        <div style={{position:"absolute",bottom:2,right:2,background:C.navy,border:`1px solid ${C.muted}`,
          borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Lock size={10} color={C.muted}/>
        </div>
      )}
      {/* tier stars */}
      {rm.tier>=3&&(
        <div style={{position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",
          display:"flex",gap:2,background:C.card,padding:"1px 4px",border:`1px solid ${c}44`}}>
          {"★".repeat(rm.tier).split("").map((s,i)=>(
            <span key={i} style={{fontSize:7,color:c,textShadow:`0 0 4px ${c}`}}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — VER LOGRO
// ══════════════════════════════════════════════════════════════
function ViewModal({logro,onClose,onEdit}) {
  const tm=TIPOS[logro.tipo]||{};
  const rm=RAREZA[logro.rareza]||{color:C.muted};
  const c=rm.color;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:580,background:C.card,border:`2px solid ${c}44`,
        boxShadow:`0 0 60px ${c}18,0 24px 60px rgba(0,0,0,.6)`,animation:"l-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <BadgePreview logro={logro} size="md"/>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:6}}>{logro.secreto?"??? LOGRO SECRETO ???":logro.nombre}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <TipoBadge tipo={logro.tipo}/>
                <RarezaBadge rareza={logro.rareza}/>
                {logro.secreto&&<span style={{...raj(10,700),color:C.muted,background:`${C.muted}14`,border:`1px solid ${C.muted}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4}}><Lock size={10}/> SECRETO</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="l-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16,maxHeight:"70vh",overflowY:"auto"}}>
          {/* stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {l:"XP BONUS",   v:`+${logro.xpBonus.toLocaleString()}`, c:C.gold },
              {l:"OBTENIDOS",  v:logro.obtenidos.toLocaleString(),      c:C.blue },
              {l:"ESTADO",     v:logro.activo?"ACTIVO":"INACTIVO",      c:logro.activo?C.green:C.red},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(15,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* descripcion pública */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <div style={{...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em"}}>📋 DESCRIPCIÓN PÚBLICA</div>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7}}>{logro.descripcion}</p>
          </div>

          {/* descripcion secreta */}
          {logro.secreto&&logro.descripcionSecreta&&(
            <div style={{background:`${C.muted}08`,border:`1px solid ${C.muted}33`,padding:"14px 16px"}}>
              <div style={{...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em",display:"flex",alignItems:"center",gap:6}}>
                <Lock size={12} color={C.muted}/> CONDICIÓN REAL (OCULTA AL JUGADOR)
              </div>
              <p style={{...raj(13,400),color:C.mutedL,lineHeight:1.7}}>{logro.descripcionSecreta}</p>
            </div>
          )}

          {/* condiciones */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>🎯 CONDICIONES</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {logro.condiciones.map((cd,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.panel,border:`1px solid ${c}22`,padding:"12px 16px"}}>
                  <span style={{fontSize:20,filter:`drop-shadow(0 0 6px ${c}66)`}}>{cd.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{...raj(13,700),color:C.white}}>{cd.label}</div>
                  </div>
                  <div style={{background:`${c}18`,border:`1px solid ${c}44`,padding:"5px 12px",...raj(13,700),color:c}}>
                    {cd.cantidad.toLocaleString()} {cd.unidad}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* recompensas */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>🎁 RECOMPENSAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {logro.recompensas.map((r,i)=>(
                <div key={i} style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{r.icon}</span>
                  <div>
                    <div style={{...raj(12,700),color:C.gold}}>{r.label}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{r.valor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* popularidad */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{...raj(12,600),color:C.muted}}>Popularidad</span>
              <span style={{...raj(12,700),color:c}}>{logro.obtenidos.toLocaleString()} héroes</span>
            </div>
            <MiniBar val={Math.min((logro.obtenidos/1000)*100,100)} color={c} height={7}/>
          </div>

          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:C.panel,border:`1px solid ${logro.activo?C.green:C.red}33`,padding:"10px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:logro.activo?C.green:C.red,animation:logro.activo?"l-pulse 1.5s infinite":"none"}}/>
              <span style={{...raj(13,700),color:logro.activo?C.green:C.red}}>{logro.activo?"ACTIVO":"INACTIVO"}</span>
            </div>
            <button onClick={()=>{onClose();onEdit(logro);}} className="l-btn"
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,...px(7),color:C.bg,background:C.orange,border:"none",padding:"10px",cursor:"pointer",boxShadow:`0 3px 14px ${C.orange}44`}}>
              <Edit2 size={13}/> EDITAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — FORM (Crear / Editar)
// ══════════════════════════════════════════════════════════════
function FormModal({logro,onClose,onSave}) {
  const isEdit=!!logro;
  const [form,    setForm]    = useState(logro?{...logro,condiciones:[...logro.condiciones],recompensas:[...logro.recompensas]}:{...EMPTY_FORM});
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [shake,   setShake]   = useState(false);
  const [tab,     setTab]     = useState("info");

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const bc=isEdit?C.orange:C.green;
  const tm=TIPOS[form.tipo]||{};
  const rm=RAREZA[form.rareza]||{color:C.muted};

  const validate=()=>{
    const e={};
    if(!form.nombre.trim())       e.nombre="Requerido";
    if(!form.descripcion.trim())  e.descripcion="Requerido";
    if(!form.condiciones.length)  e.condiciones="Añade al menos una condición";
    return e;
  };
  const save=async()=>{
    const e=validate();if(Object.keys(e).length){setErrors(e);setShake(true);setTimeout(()=>setShake(false),500);return;}
    setLoading(true);await new Promise(r=>setTimeout(r,900));setLoading(false);
    onSave({...form,id:logro?.id||`lg${Date.now()}`,obtenidos:logro?.obtenidos||0,xpBonus:Number(form.xpBonus)||0,creadoEn:logro?.creadoEn||new Date().toISOString().slice(0,10)});
    onClose();
  };

  // condiciones
  const addCond=()=>setForm(f=>({...f,condiciones:[...f.condiciones,{...EMPTY_COND}]}));
  const removeCond=(i)=>setForm(f=>({...f,condiciones:f.condiciones.filter((_,idx)=>idx!==i)}));
  const setCond=(i,k,v)=>setForm(f=>({...f,condiciones:f.condiciones.map((c,idx)=>idx===i?{...c,[k]:v}:c)}));
  const changeCondTipo=(i,tid)=>{
    const ct=COND_TIPOS.find(c=>c.id===tid)||COND_TIPOS[0];
    setCond(i,"tipo",tid);setCond(i,"label",ct.label);setCond(i,"icon",ct.icon);setCond(i,"unidad",ct.unit);
  };

  // recompensas
  const addRecomp=()=>setForm(f=>({...f,recompensas:[...f.recompensas,{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:""}]}));
  const removeRecomp=(i)=>setForm(f=>({...f,recompensas:f.recompensas.filter((_,idx)=>idx!==i)}));
  const setRec=(i,k,v)=>setForm(f=>({...f,recompensas:f.recompensas.map((r,idx)=>idx===i?{...r,[k]:v}:r)}));
  const changeRecTipo=(i,tid)=>{
    const rt=RECOMP_TIPOS.find(r=>r.id===tid)||RECOMP_TIPOS[0];
    setRec(i,"tipo",tid);setRec(i,"icon",rt.icon);setRec(i,"label",rt.label);
  };

  const inpSt=(err)=>({width:"100%",padding:"11px 14px",background:C.panel,border:`1px solid ${err?C.red:C.navy}`,color:C.white,...raj(14,500)});
  const lbl={display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"};
  const TABS=[{id:"info",l:"INFO"},{id:"condiciones",l:`CONDICIONES (${form.condiciones.length})`},{id:"recompensas",l:`RECOMPENSAS (${form.recompensas.length})`}];

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:720,background:C.card,border:`1px solid ${bc}44`,
        boxShadow:`0 0 60px ${bc}0E,0 24px 60px rgba(0,0,0,.6)`,animation:"l-modalIn .25s ease both",
        overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"93vh"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${bc},transparent)`,flexShrink:0}}/>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 22px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isEdit?<Edit2 size={15} color={C.orange}/>:<Plus size={15} color={C.green}/>}
            <span style={{...orb(12,700),color:C.white}}>{isEdit?"EDITAR LOGRO":"NUEVO LOGRO"}</span>
            {isEdit&&<span style={{...raj(12,500),color:C.muted}}>— {logro.nombre}</span>}
          </div>
          <button onClick={onClose} className="l-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="l-btn"
              style={{flex:1,padding:"11px 0",...raj(12,tab===t.id?700:500),color:tab===t.id?bc:C.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?bc:"transparent"}`,cursor:"pointer",position:"relative"}}>
              {t.l}
              {t.id==="condiciones"&&errors.condiciones&&<span style={{position:"absolute",top:7,right:"18%",width:6,height:6,background:C.red,borderRadius:"50%"}}/>}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:22}} className={shake?"l-shake":""}>

          {/* ── TAB INFO ── */}
          {tab==="info"&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* badge preview + config básica */}
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:20,alignItems:"start"}}>
                {/* preview */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:8}}>
                  <BadgePreview logro={form} size="lg"/>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3,width:160}}>
                    {EMOJIS.map(e=>(
                      <button key={e} type="button" onClick={()=>set("imagen",e)} className="l-btn"
                        style={{fontSize:14,background:form.imagen===e?`${bc}22`:"transparent",border:`1px solid ${form.imagen===e?bc:C.navy}`,padding:"4px",cursor:"pointer"}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* info */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div>
                    <label style={lbl}>📝 NOMBRE</label>
                    <input className="l-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: Maestro del Fuego" style={inpSt(errors.nombre)}/>
                    {errors.nombre&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.nombre}</p>}
                  </div>
                  <div>
                    <label style={lbl}>📋 DESCRIPCIÓN PÚBLICA</label>
                    <textarea className="l-input" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} rows={2} placeholder="Lo que el jugador ve como objetivo..." style={{...inpSt(errors.descripcion),resize:"vertical"}}/>
                    {errors.descripcion&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.descripcion}</p>}
                  </div>
                  {form.secreto&&(
                    <div>
                      <label style={{...lbl,color:C.muted}}><Lock size={10} style={{marginRight:4}}/> CONDICIÓN REAL (OCULTA AL JUGADOR)</label>
                      <textarea className="l-input" value={form.descripcionSecreta} onChange={e=>set("descripcionSecreta",e.target.value)} rows={2} placeholder="Condición real que el jugador no ve hasta obtenerlo..." style={{...inpSt(false),resize:"vertical",borderColor:C.muted}}/>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={lbl}>⚡ XP BONUS</label>
                      <input className="l-input" type="number" min={0} value={form.xpBonus} onChange={e=>set("xpBonus",e.target.value)} style={inpSt(false)}/>
                    </div>
                    <div>
                      <label style={lbl}>● ESTADO</label>
                      {[{v:true,l:"ACTIVO",c:C.green},{v:false,l:"INACTIVO",c:C.red}].map(o=>(
                        <button key={String(o.v)} type="button" onClick={()=>set("activo",o.v)} className="l-btn"
                          style={{width:"100%",marginBottom:6,...raj(12,form.activo===o.v?700:500),color:form.activo===o.v?o.c:C.muted,background:form.activo===o.v?`${o.c}18`:"transparent",border:`1px solid ${form.activo===o.v?o.c:C.navy}`,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:form.activo===o.v?o.c:C.navy}}/>{o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* secreto toggle */}
                  <button type="button" onClick={()=>set("secreto",!form.secreto)} className="l-btn"
                    style={{display:"flex",alignItems:"center",gap:10,...raj(13,700),color:form.secreto?C.muted:C.muted,background:form.secreto?`${C.muted}14`:"transparent",border:`1px solid ${form.secreto?C.muted:C.navy}`,padding:"11px 14px",cursor:"pointer",transition:"all .18s"}}>
                    {form.secreto?<><Lock size={14}/> LOGRO SECRETO (activo)</>:<><Unlock size={14}/> Hacer SECRETO</>}
                    <span style={{...raj(11,400),color:C.muted,marginLeft:"auto"}}>El jugador no verá la condición real</span>
                  </button>
                </div>
              </div>

              {/* tipo */}
              <div>
                <label style={lbl}>🗂️ TIPO DE LOGRO</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {TIPO_KEYS.map(tipo=>{
                    const m=TIPOS[tipo]; const on=form.tipo===tipo;
                    return (
                      <button key={tipo} type="button" onClick={()=>set("tipo",tipo)} className="l-btn"
                        style={{background:on?m.bg:"transparent",border:`2px solid ${on?m.color:C.navy}`,padding:"12px 10px",cursor:"pointer",textAlign:"center",boxShadow:on?`0 0 14px ${m.color}33`:"none",transition:"all .22s"}}>
                        <div style={{fontSize:20,marginBottom:5,filter:on?`drop-shadow(0 0 6px ${m.color})`:"none"}}>{m.icon}</div>
                        <div style={{...px(6),color:on?m.color:C.muted,marginBottom:3}}>{tipo.toUpperCase()}</div>
                        <div style={{...raj(9,400),color:C.muted,lineHeight:1.3}}>{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* rareza */}
              <div>
                <label style={lbl}>💎 RAREZA</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {RAREZA_KEYS.map(rar=>{
                    const r=RAREZA[rar]; const on=form.rareza===rar;
                    const stars="★".repeat(r.tier);
                    return (
                      <button key={rar} type="button" onClick={()=>set("rareza",rar)} className="l-btn"
                        style={{background:on?`${r.color}18`:"transparent",border:`2px solid ${on?r.color:C.navy}`,padding:"14px 10px",cursor:"pointer",textAlign:"center",
                          boxShadow:on?`0 0 18px ${r.color}44`:"none",transition:"all .22s"}}>
                        <div style={{...raj(16,900),color:r.color,marginBottom:5,textShadow:on?`0 0 10px ${r.color}`:"none"}}>{stars}</div>
                        <div style={{...px(6),color:on?r.color:C.muted,marginBottom:3}}>{rar.toUpperCase()}</div>
                        <div style={{...raj(9,400),color:C.muted}}>Tier {r.tier}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONDICIONES ── */}
          {tab==="condiciones"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {errors.condiciones&&<p style={{...raj(12),color:C.red}}>⚠ {errors.condiciones}</p>}
              <p style={{...raj(13,400),color:C.muted,lineHeight:1.6}}>
                Define qué debe hacer el jugador para obtener este logro. Si hay múltiples, <strong style={{color:C.white}}>todas deben cumplirse</strong>.
              </p>

              {form.condiciones.map((cd,i)=>(
                <div key={i} className="l-req-row" style={{background:C.panel,border:`1px solid ${tm.color||C.navy}33`,padding:"14px 16px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>TIPO DE CONDICIÓN</label>
                      <select className="l-input" value={cd.tipo} onChange={e=>changeCondTipo(i,e.target.value)}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500),appearance:"none",cursor:"pointer"}}>
                        {COND_TIPOS.map(ct=><option key={ct.id} value={ct.id}>{ct.icon} {ct.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>CANTIDAD ({cd.unidad})</label>
                      <input className="l-input" type="number" min={1} value={cd.cantidad} onChange={e=>setCond(i,"cantidad",Number(e.target.value))}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(14,600)}}/>
                    </div>
                    <button type="button" onClick={()=>removeCond(i)} className="l-icon-btn"
                      style={{background:"transparent",border:`1px solid ${C.red}33`,padding:"9px",color:C.red,display:"flex",alignItems:"center",alignSelf:"flex-end"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.borderColor=C.red;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.red}33`;}}><Trash2 size={13}/></button>
                  </div>
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:C.card,border:`1px solid ${tm.color||C.navy}22`}}>
                    <span style={{fontSize:18}}>{cd.icon}</span>
                    <span style={{...raj(12,700),color:C.white}}>{cd.label}</span>
                    <span style={{...raj(12,700),color:tm.color||C.orange,marginLeft:"auto"}}>{cd.cantidad.toLocaleString()} {cd.unidad}</span>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addCond} className="l-btn"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,...raj(13,700),color:tm.color||C.orange,background:`${tm.color||C.orange}0D`,border:`2px dashed ${tm.color||C.orange}44`,padding:"14px",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${tm.color||C.orange}18`;e.currentTarget.style.borderStyle="solid";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${tm.color||C.orange}0D`;e.currentTarget.style.borderStyle="dashed";}}>
                <Plus size={16}/> AÑADIR CONDICIÓN
              </button>

              {/* referencia */}
              <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
                <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📖 TIPOS DE CONDICIÓN</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {COND_TIPOS.map(ct=>(
                    <div key={ct.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,border:`1px solid ${C.navy}33`}}>
                      <span style={{fontSize:15}}>{ct.icon}</span>
                      <div>
                        <div style={{...raj(11,700),color:C.white}}>{ct.label}</div>
                        <div style={{...raj(9,400),color:C.muted}}>Unidad: {ct.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB RECOMPENSAS ── */}
          {tab==="recompensas"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <p style={{...raj(13,400),color:C.muted,lineHeight:1.6}}>
                Define qué recibirá el jugador al desbloquear este logro.
              </p>
              {form.recompensas.map((rec,i)=>(
                <div key={i} style={{background:C.panel,border:`1px solid ${C.gold}22`,padding:"14px 16px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>TIPO</label>
                      <select className="l-input" value={rec.tipo} onChange={e=>changeRecTipo(i,e.target.value)}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500),appearance:"none",cursor:"pointer"}}>
                        {RECOMP_TIPOS.map(rt=><option key={rt.id} value={rt.id}>{rt.icon} {rt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>{rec.tipo==="xp"?"CANTIDAD XP":rec.tipo==="titulo"?"NOMBRE TÍTULO":rec.tipo==="item"?"NOMBRE OBJETO":"NOMBRE BADGE"}</label>
                      <input className="l-input" value={rec.valor} onChange={e=>setRec(i,"valor",e.target.value)}
                        placeholder={rec.tipo==="xp"?"Ej: 500 XP":rec.tipo==="titulo"?"Ej: Llama Eterna":rec.tipo==="item"?"Ej: Corona del Campeón":"Ej: Badge Centenario"}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(14,600)}}/>
                    </div>
                    {form.recompensas.length>1&&(
                      <button type="button" onClick={()=>removeRecomp(i)} className="l-icon-btn"
                        style={{background:"transparent",border:`1px solid ${C.red}33`,padding:"9px",color:C.red,display:"flex",alignItems:"center",alignSelf:"flex-end"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.borderColor=C.red;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.red}33`;}}><Trash2 size={13}/></button>
                    )}
                  </div>
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:C.card,border:`1px solid ${C.gold}22`}}>
                    <span style={{fontSize:18}}>{rec.icon}</span>
                    <span style={{...raj(12,700),color:C.gold}}>{rec.label}</span>
                    {rec.valor&&<span style={{...raj(12,600),color:C.white,marginLeft:"auto"}}>{rec.valor}</span>}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRecomp} className="l-btn"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,...raj(13,700),color:C.gold,background:`${C.gold}0D`,border:`2px dashed ${C.gold}44`,padding:"14px",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}18`;e.currentTarget.style.borderStyle="solid";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${C.gold}0D`;e.currentTarget.style.borderStyle="dashed";}}>
                <Plus size={16}/> AÑADIR RECOMPENSA
              </button>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:10,padding:"15px 22px",borderTop:`1px solid ${C.navy}`,flexShrink:0}}>
          <button onClick={onClose} className="l-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 20px",cursor:"pointer"}}>CANCELAR</button>
          <button onClick={save} disabled={loading} className="l-btn"
            style={{flex:1,...px(8),color:loading?C.muted:C.bg,background:loading?`${bc}55`:bc,border:"none",padding:"12px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 4px 20px ${bc}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            {loading?<><Spinner color={bc}/> GUARDANDO...</>:<><Check size={14}/> {isEdit?"GUARDAR CAMBIOS":"CREAR LOGRO"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — ELIMINAR
// ══════════════════════════════════════════════════════════════
function DeleteModal({logro,onClose,onConfirm}) {
  const [typed,setTyped]=useState("");
  const [loading,setLoading]=useState(false);
  const match=typed===logro.nombre;
  const confirm=async()=>{if(!match)return;setLoading(true);await new Promise(r=>setTimeout(r,700));setLoading(false);onConfirm(logro.id);onClose();};
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:420,background:C.card,border:`1px solid ${C.red}44`,boxShadow:`0 0 60px ${C.red}14,0 24px 60px rgba(0,0,0,.6)`,animation:"l-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>
        <div style={{padding:"22px 24px 26px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex"}}><AlertTriangle size={22} color={C.red}/></div>
            <div><div style={{...orb(13,900),color:C.red,marginBottom:3}}>ELIMINAR LOGRO</div><div style={{...raj(12,500),color:C.muted}}>Esta acción no se puede deshacer</div></div>
          </div>
          <div style={{background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:"12px 16px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
            <BadgePreview logro={logro} size="sm"/>
            <div>
              <div style={{...raj(14,700),color:C.red}}>{logro.nombre}</div>
              <div style={{...raj(12,400),color:C.muted}}>{logro.tipo} · {logro.rareza} · {logro.obtenidos} obtenidos</div>
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",...px(6),color:C.muted,marginBottom:8,letterSpacing:".06em"}}>ESCRIBE <span style={{color:C.red}}>{logro.nombre}</span> PARA CONFIRMAR</label>
            <input className="l-input" value={typed} onChange={e=>setTyped(e.target.value)} placeholder={logro.nombre}
              style={{width:"100%",padding:"12px 14px",background:C.panel,border:`1px solid ${match?C.red:C.navy}`,color:C.white,...raj(14,600)}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="l-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="l-btn"
              style={{flex:1,...px(7),color:(match&&!loading)?C.white:C.muted,background:(match&&!loading)?C.red:`${C.red}22`,border:`1px solid ${C.red}55`,padding:"12px",cursor:match?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .2s"}}>
              {loading?<><Spinner color={C.red}/> ELIMINANDO...</>:<><Trash2 size={13}/> ELIMINAR</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminLogros() {
  const [logros,     setLogros]     = useState(MOCK_LOGROS);
  const [tipoTab,    setTipoTab]    = useState("Todos");
  const [search,     setSearch]     = useState("");
  const [filterRar,  setFilterRar]  = useState("all");
  const [filterAct,  setFilterAct]  = useState("all");
  const [filterSec,  setFilterSec]  = useState("all");
  const [sortKey,    setSortKey]    = useState("obtenidos");
  const [sortDir,    setSortDir]    = useState("desc");
  const [view,       setView]       = useState("grid");
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(12);
  const [selected,   setSelected]   = useState(new Set());
  const [modal,      setModal]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh=async()=>{setRefreshing(true);await new Promise(r=>setTimeout(r,800));setRefreshing(false);};

  const filtered=useMemo(()=>{
    let list=[...logros];
    if(tipoTab!=="Todos") list=list.filter(l=>l.tipo===tipoTab);
    if(search)            list=list.filter(l=>l.nombre.toLowerCase().includes(search.toLowerCase())||l.descripcion.toLowerCase().includes(search.toLowerCase()));
    if(filterRar!=="all") list=list.filter(l=>l.rareza===filterRar);
    if(filterAct!=="all") list=list.filter(l=>String(l.activo)===(filterAct==="active"?"true":"false"));
    if(filterSec!=="all") list=list.filter(l=>filterSec==="secret"?l.secreto:!l.secreto);
    list.sort((a,b)=>{const av=a[sortKey]??"";const bv=b[sortKey]??"";return sortDir==="asc"?(av>bv?1:-1):(av<bv?1:-1);});
    return list;
  },[logros,tipoTab,search,filterRar,filterAct,filterSec,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);
  const sort=(k)=>{if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}};
  const toggleSelect=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSelected(s=>s.size===paginated.length?new Set():new Set(paginated.map(l=>l.id)));
  const handleSave=(saved)=>setLogros(ls=>{const i=ls.findIndex(l=>l.id===saved.id);if(i>=0){const a=[...ls];a[i]=saved;return a;}return[saved,...ls];});
  const handleDelete=(id)=>{setLogros(ls=>ls.filter(l=>l.id!==id));setSelected(s=>{const n=new Set(s);n.delete(id);return n;});};
  const bulkDelete=()=>{setLogros(ls=>ls.filter(l=>!selected.has(l.id)));setSelected(new Set());};
  const bulkToggle=(activo)=>setLogros(ls=>ls.map(l=>selected.has(l.id)?{...l,activo}:l));

  const kpis=useMemo(()=>({
    total:     logros.length,
    activos:   logros.filter(l=>l.activo).length,
    obtenidos: logros.reduce((s,l)=>s+l.obtenidos,0),
    secretos:  logros.filter(l=>l.secreto).length,
  }),[logros]);

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {modal?.type==="view"   && <ViewModal   logro={modal.l} onClose={()=>setModal(null)} onEdit={l=>setModal({type:"form",l})}/>}
      {modal?.type==="form"   && <FormModal   logro={modal.l} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {modal?.type==="delete" && <DeleteModal logro={modal.l} onClose={()=>setModal(null)} onConfirm={handleDelete}/>}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"LOGROS TOTALES",value:kpis.total,    icon:<Trophy size={18}/>,  color:C.orange},
            {label:"ACTIVOS",       value:kpis.activos,  icon:<Zap size={18}/>,     color:C.green },
            {label:"OBTENIDOS",     value:kpis.obtenidos.toLocaleString(),icon:<Award size={18}/>,color:C.blue},
            {label:"SECRETOS",      value:kpis.secretos, icon:<EyeOff size={18}/>,  color:C.muted },
          ].map((k,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${k.color}33`,padding:"18px 16px",position:"relative",overflow:"hidden",animation:`l-cardIn .4s ease ${i*.07}s both`,transition:"transform .2s,box-shadow .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 32px rgba(0,0,0,.4)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color},transparent)`}}/>
              <div style={{background:`${k.color}18`,border:`1px solid ${k.color}33`,padding:9,display:"inline-flex",color:k.color,marginBottom:10}}>{k.icon}</div>
              <div style={{...orb(26,900),color:k.color,marginBottom:3}}>{k.value}</div>
              <div style={{...px(6),color:C.muted,letterSpacing:".05em"}}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tipo tabs */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`}}>
            {["Todos",...TIPO_KEYS].map(tipo=>{
              const m=TIPOS[tipo]; const on=tipoTab===tipo; const cc=m?.color||C.orange;
              const count=tipo==="Todos"?logros.length:logros.filter(l=>l.tipo===tipo).length;
              return (
                <button key={tipo} onClick={()=>{setTipoTab(tipo);setPage(1);}} className="l-tab"
                  style={{flex:1,padding:"14px 8px",background:on?`${cc}12`:"transparent",border:"none",borderBottom:`3px solid ${on?cc:"transparent"}`,color:on?cc:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <div style={{fontSize:18,filter:on?`drop-shadow(0 0 6px ${cc})`:"none"}}>{m?.icon||"🌐"}</div>
                  <span style={{...raj(11,on?700:500),letterSpacing:".03em"}}>{tipo}</span>
                  <span style={{...raj(9,700),color:on?cc:C.navy,background:on?`${cc}22`:`${C.navy}44`,padding:"1px 6px"}}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"13px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 200px"}}>
              <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
              <input className="l-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Buscar logro..."
                style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{v:"grid",i:"⊞"},{v:"table",i:"≡"}].map(({v,i})=>(
                <button key={v} onClick={()=>setView(v)} className="l-btn"
                  style={{...raj(14,700),color:view===v?C.orange:C.muted,background:view===v?`${C.orange}18`:C.panel,border:`1px solid ${view===v?C.orange:C.navy}`,padding:"7px 12px",cursor:"pointer"}}>{i}</button>
              ))}
            </div>
            <span style={{...raj(11,600),color:C.muted}}>Rareza:</span>
            {["all",...RAREZA_KEYS].map(v=>{const r=RAREZA[v];return<button key={v} onClick={()=>{setFilterRar(v);setPage(1);}} className="l-btn" style={fBtn(filterRar===v,r?.color||C.orange)}>{v==="all"?"Todas":v}</button>;})}
            <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
            {[{v:"all",l:"Todos"},{v:"active",l:"● Activos"},{v:"inactive",l:"● Inactivos"}].map(o=><button key={o.v} onClick={()=>{setFilterAct(o.v);setPage(1);}} className="l-btn" style={fBtn(filterAct===o.v,o.v==="active"?C.green:C.red)}>{o.l}</button>)}
            {[{v:"all",l:"Todos"},{v:"secret",l:"🔒 Secretos"},{v:"public",l:"👁️ Públicos"}].map(o=><button key={o.v} onClick={()=>{setFilterSec(o.v);setPage(1);}} className="l-btn" style={fBtn(filterSec===o.v,o.v==="secret"?C.muted:C.teal)}>{o.l}</button>)}
            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              {selected.size>0&&(<>
                <button onClick={()=>bulkToggle(true)} className="l-btn" style={{...raj(11,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Check size={12}/> Activar ({selected.size})</button>
                <button onClick={()=>bulkToggle(false)} className="l-btn" style={{...raj(11,700),color:C.orange,background:`${C.orange}14`,border:`1px solid ${C.orange}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><X size={12}/> Desactivar ({selected.size})</button>
                <button onClick={bulkDelete} className="l-btn" style={{...raj(11,700),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Trash2 size={12}/> Eliminar ({selected.size})</button>
              </>)}
              <button onClick={refresh} className="l-btn" style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"7px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <RefreshCw size={12} style={{animation:refreshing?"l-spin .8s linear infinite":"none"}}/> Actualizar
              </button>
              <button onClick={()=>setModal({type:"form",l:null})} className="l-btn"
                style={{...px(7),color:C.bg,background:C.green,border:"none",padding:"7px 14px",cursor:"pointer",boxShadow:`0 3px 14px ${C.green}33`,display:"flex",alignItems:"center",gap:6}}>
                <Plus size={13}/> NUEVO
              </button>
            </div>
          </div>
        </div>

        <div style={{...raj(12,500),color:C.muted}}>
          {filtered.length} logro{filtered.length!==1?"s":""} · página {page}/{totalPages}
          {selected.size>0&&<span style={{color:C.orange,marginLeft:12}}>{selected.size} seleccionado{selected.size!==1?"s":""}</span>}
        </div>

        {/* GRID */}
        {view==="grid"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
            {paginated.length===0?<div style={{gridColumn:"1/-1",padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((l,i)=>{
              const tm=TIPOS[l.tipo]||{}; const rm=RAREZA[l.rareza]||{color:C.muted};
              const c=rm.color; const sel=selected.has(l.id);
              return (
                <div key={l.id} className="l-card" style={{background:C.card,border:`2px solid ${sel?C.orange:c}22`,
                  boxShadow:sel?`0 0 18px ${C.orange}22`:`0 4px 16px rgba(0,0,0,.3)`,
                  overflow:"hidden",animation:`l-cardIn .4s ease ${i*.05}s both`,position:"relative"}}>
                  <input type="checkbox" checked={sel} onChange={()=>toggleSelect(l.id)} style={{position:"absolute",top:10,left:10,accentColor:C.orange,width:14,height:14,cursor:"pointer",zIndex:2}}/>
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

                  <div style={{padding:"20px 16px 12px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                    {/* badge centered */}
                    <div style={{marginBottom:14}}>
                      <BadgePreview logro={l} size="md"/>
                    </div>

                    <div style={{...raj(13,700),color:C.white,marginBottom:6,lineHeight:1.3}}>
                      {l.secreto?"??? ??? ???":l.nombre}
                    </div>

                    <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",marginBottom:8}}>
                      <TipoBadge tipo={l.tipo}/>
                      <RarezaBadge rareza={l.rareza}/>
                    </div>

                    {l.secreto&&(
                      <div style={{display:"flex",alignItems:"center",gap:5,...raj(10,600),color:C.muted,background:`${C.muted}14`,border:`1px solid ${C.muted}33`,padding:"2px 8px",marginBottom:8}}>
                        <Lock size={10}/> SECRETO
                      </div>
                    )}

                    <p style={{...raj(11,400),color:C.muted,lineHeight:1.5,marginBottom:10,
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {l.descripcion}
                    </p>

                    {/* condiciones preview */}
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginBottom:10}}>
                      {l.condiciones.slice(0,2).map((cd,idx)=>(
                        <span key={idx} style={{...raj(10,600),color:tm.color||C.orange,background:`${tm.color||C.orange}12`,border:`1px solid ${tm.color||C.orange}22`,padding:"2px 7px",display:"inline-flex",alignItems:"center",gap:3}}>
                          {cd.icon} {cd.cantidad.toLocaleString()} {cd.unidad}
                        </span>
                      ))}
                      {l.condiciones.length>2&&<span style={{...raj(10,600),color:C.muted}}>+{l.condiciones.length-2}</span>}
                    </div>

                    {/* stats */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,width:"100%",marginBottom:10}}>
                      <div style={{background:C.panel,border:`1px solid ${C.gold}18`,padding:"6px 8px",textAlign:"center"}}>
                        <div style={{...orb(12,900),color:C.gold}}>+{l.xpBonus.toLocaleString()}</div>
                        <div style={{...px(4),color:C.muted}}>XP BONUS</div>
                      </div>
                      <div style={{background:C.panel,border:`1px solid ${C.blue}18`,padding:"6px 8px",textAlign:"center"}}>
                        <div style={{...raj(12,700),color:C.blue}}>{l.obtenidos.toLocaleString()}</div>
                        <div style={{...px(4),color:C.muted}}>OBTENIDOS</div>
                      </div>
                    </div>

                    <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",marginBottom:6}}>
                      <span style={{...raj(10,600),color:l.activo?C.green:C.red,background:l.activo?`${C.green}14`:`${C.red}14`,border:`1px solid ${l.activo?C.green:C.red}33`,padding:"2px 7px"}}>{l.activo?"● ACTIVO":"● INACTIVO"}</span>
                      {l.recompensas.length>1&&l.recompensas.slice(1).map((r,idx)=>(
                        <span key={idx} style={{...raj(10,600),color:C.gold,background:`${C.gold}0D`,border:`1px solid ${C.gold}22`,padding:"2px 7px",display:"inline-flex",alignItems:"center",gap:3}}>{r.icon}</span>
                      ))}
                    </div>

                    <MiniBar val={Math.min((l.obtenidos/1000)*100,100)} color={c} height={4}/>
                  </div>

                  <div style={{borderTop:`1px solid ${C.navy}33`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",l}),lab:"Ver"},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",l}),lab:"Editar"},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",l}),lab:"Borrar"}].map(({Icon,c:ic,fn,lab},j)=>(
                      <button key={j} onClick={fn} className="l-btn"
                        style={{background:"transparent",border:"none",borderRight:j<2?`1px solid ${C.navy}33`:"none",padding:"10px 0",color:ic,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",transition:"background .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${ic}14`}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <Icon size={13}/><span style={{...raj(9,600),color:C.muted}}>{lab}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE */}
        {view==="table"&&(
          <div style={{background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"34px 80px 2fr 0.9fr 1fr 0.8fr 0.7fr 0.6fr 0.6fr 95px",padding:"10px 14px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:8,alignItems:"center"}}>
              <input type="checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
              <span style={{...px(5),color:C.muted,letterSpacing:".05em"}}>BADGE</span>
              {[{l:"NOMBRE",k:"nombre"},{l:"TIPO",k:"tipo"},{l:"RAREZA",k:"rareza"},{l:"CONDIC.",k:null},{l:"XP",k:"xpBonus"},{l:"OBTEN.",k:"obtenidos"},{l:"ESTADO",k:"activo"}].map((h,i)=>(
                <div key={i} className={h.k?"l-sort":""} onClick={()=>h.k&&sort(h.k)}
                  style={{display:"flex",alignItems:"center",gap:3,...px(5),color:sortKey===h.k?C.orange:C.muted,letterSpacing:".05em"}}>
                  {h.l}{h.k&&<SortIcon active={sortKey===h.k} dir={sortDir}/>}
                </div>
              ))}
              <span style={{...px(5),color:C.muted,letterSpacing:".05em"}}>ACC.</span>
            </div>
            {paginated.length===0?<div style={{padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((l,i)=>{
              const rm=RAREZA[l.rareza]||{color:C.muted};
              return (
                <div key={l.id} className="l-row" style={{display:"grid",gridTemplateColumns:"34px 80px 2fr 0.9fr 1fr 0.8fr 0.7fr 0.6fr 0.6fr 95px",padding:"12px 14px",borderBottom:`1px solid ${C.navy}22`,gap:8,alignItems:"center",animation:`l-slideU .3s ease ${i*.04}s both`,background:selected.has(l.id)?`${C.orange}08`:"transparent"}}>
                  <input type="checkbox" checked={selected.has(l.id)} onChange={()=>toggleSelect(l.id)} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
                  <div style={{display:"flex",justifyContent:"center"}}><BadgePreview logro={l} size="sm"/></div>
                  <div style={{minWidth:0}}>
                    <div style={{...raj(13,700),color:C.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.secreto?"??? SECRETO ???":l.nombre}</div>
                    <div style={{display:"flex",gap:4,marginTop:2}}>
                      {l.secreto&&<span style={{...raj(9,700),color:C.muted}}>🔒</span>}
                    </div>
                  </div>
                  <TipoBadge tipo={l.tipo}/>
                  <RarezaBadge rareza={l.rareza}/>
                  <div style={{display:"flex",gap:3}}>
                    {l.condiciones.slice(0,2).map((cd,idx)=><span key={idx} style={{fontSize:13}}>{cd.icon}</span>)}
                    <span style={{...raj(9,600),color:C.muted}}>{l.condiciones.length}</span>
                  </div>
                  <span style={{...orb(12,900),color:C.gold}}>+{l.xpBonus.toLocaleString()}</span>
                  <div><div style={{...raj(11,700),color:C.blue,marginBottom:2}}>{l.obtenidos.toLocaleString()}</div><MiniBar val={Math.min((l.obtenidos/1000)*100,100)} color={C.blue} height={3}/></div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:l.activo?C.green:C.red,animation:l.activo?"l-pulse 1.8s infinite":"none"}}/>
                    <span style={{...raj(10,600),color:l.activo?C.green:C.red}}>{l.activo?"ON":"OFF"}</span>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",l})},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",l})},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",l})}].map(({Icon,c:ic,fn},j)=>(
                      <button key={j} onClick={fn} className="l-icon-btn"
                        style={{background:"transparent",border:`1px solid ${ic}33`,padding:5,color:ic,display:"flex",alignItems:"center"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${ic}18`;e.currentTarget.style.borderColor=ic;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${ic}33`;}}><Icon size={12}/></button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{...raj(13,500),color:C.muted}}>{Math.min((page-1)*pageSize+1,filtered.length)}–{Math.min(page*pageSize,filtered.length)} de {filtered.length}</span>
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} className="l-input"
              style={{padding:"6px 10px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...raj(12,500),cursor:"pointer"}}>
              {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setPage(1)} disabled={page===1} className="l-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 11px",cursor:page===1?"not-allowed":"pointer"}}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="l-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 10px",cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className="l-btn"
                style={{background:n===page?C.orange:C.panel,border:`1px solid ${n===page?C.orange:C.navy}`,color:n===page?C.bg:C.muted,padding:"6px 13px",cursor:"pointer",...raj(13,n===page?700:500)}}>
                {n}
              </button>
            ))}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="l-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 10px",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronRight size={13}/></button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} className="l-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 11px",cursor:page===totalPages?"not-allowed":"pointer"}}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}