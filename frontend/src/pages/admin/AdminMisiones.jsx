// src/pages/admin/AdminMisiones.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de misiones para el Admin de ForgeVenture.
//  Tipos: Diaria | Semanal | Evento | Desafío
//  Conectar: getMisiones(), createMision(), updateMision(),
//            deleteMision() desde api.js cuando esté el backend.
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Target, Zap, Star,
  BarChart2, Calendar, Clock, Flame, Trophy, Gift,
  Users, Shield, Repeat,
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
  @keyframes m-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes m-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes m-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes m-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes m-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes m-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes m-glow    { 0%,100%{box-shadow:0 0 8px #FFD70033} 50%{box-shadow:0 0 22px #FFD70066} }
  @keyframes m-bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes m-fill    { from{width:0} to{width:var(--fw)} }

  .m-row    { transition:background .15s; }
  .m-row:hover { background:${C.navyL}18 !important; }
  .m-btn    { transition:all .18s; cursor:pointer; }
  .m-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .m-icon-btn { transition:all .2s; cursor:pointer; }
  .m-input  { transition:border-color .2s,box-shadow .2s; outline:none; }
  .m-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22,0 0 14px ${C.orange}18; }
  .m-input::placeholder { color:${C.navy}; }
  .m-sort   { cursor:pointer; user-select:none; transition:color .2s; }
  .m-sort:hover { color:${C.orange} !important; }
  .m-card   { transition:all .22s; }
  .m-card:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(0,0,0,.45) !important; }
  .m-type-tab { transition:all .2s; cursor:pointer; }
  .m-req-row { transition:background .15s; }
  .m-req-row:hover { background:${C.navyL}18 !important; }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Taxonomía de tipos ────────────────────────────────────────
const TIPOS = {
  Diaria:  { color:C.orange,  icon:"☀️",  bg:"#E85D0414", desc:"Se reinicia cada día a las 00:00" },
  Semanal: { color:C.blue,    icon:"📅",  bg:"#4CC9F014", desc:"Se reinicia cada lunes a las 00:00" },
  Evento:  { color:C.purple,  icon:"🎉",  bg:"#9B59B614", desc:"Disponible durante un período especial" },
  Desafío: { color:C.gold,    icon:"🏆",  bg:"#FFD70014", desc:"Reto permanente de alta dificultad" },
};
const TIPO_KEYS = Object.keys(TIPOS);

const DIFICULTADES = ["Fácil","Normal","Difícil","Legendaria"];
const DIFICULTAD_COLOR = { Fácil:C.green, Normal:C.gold, Difícil:C.orange, Legendaria:C.red };

// Tipos de requisito que puede tener una misión
const REQ_TIPOS = [
  { id:"completar_ejercicio", label:"Completar ejercicio",    icon:"💪", unit:"veces",   placeholder:"Ej: 3" },
  { id:"completar_rutina",    label:"Completar rutina",       icon:"📋", unit:"veces",   placeholder:"Ej: 1" },
  { id:"xp_ganado",           label:"Ganar XP",               icon:"⚡", unit:"XP",      placeholder:"Ej: 500" },
  { id:"racha_dias",          label:"Mantener racha",         icon:"🔥", unit:"días",    placeholder:"Ej: 7" },
  { id:"sesiones_total",      label:"Completar sesiones",     icon:"🏃", unit:"sesiones",placeholder:"Ej: 5" },
  { id:"nivel_alcanzado",     label:"Alcanzar nivel",         icon:"⬆️", unit:"nivel",   placeholder:"Ej: 10" },
  { id:"cardio_minutos",      label:"Cardio activo",          icon:"⏱️", unit:"minutos", placeholder:"Ej: 30" },
  { id:"fuerza_reps",         label:"Repeticiones de fuerza", icon:"🏋️", unit:"reps",    placeholder:"Ej: 50" },
  { id:"flex_minutos",        label:"Flexibilidad activa",    icon:"🧘", unit:"minutos", placeholder:"Ej: 20" },
];

// Recompensas disponibles además del XP
const RECOMPENSA_TIPOS = [
  { id:"xp",     icon:"⚡", label:"XP Bonus"     },
  { id:"badge",  icon:"🏅", label:"Badge"         },
  { id:"titulo", icon:"👑", label:"Título"        },
  { id:"item",   icon:"🎒", label:"Objeto"        },
];

const EMOJIS_MISION = ["🎯","⚔️","🏃","🧘","💪","🔥","⚡","🏆","🌟","💫","🛡️","🗡️","🎖️","💎","🌠","🦾","⚡","🎪","🏅","👑"];

const MOCK_MISIONES = [
  { id:"m1",  titulo:"Guerrero Diario",     tipo:"Diaria",  dificultad:"Fácil",     imagen:"⚔️",  xpRecompensa:150, activo:true,  completadas:1248, descripcion:"Completa tu rutina de fuerza del día.",
    requisitos:[{tipo:"completar_rutina",label:"Completar rutina",icon:"📋",cantidad:1,unidad:"veces"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"150 XP"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:1248 },
  { id:"m2",  titulo:"Cardio Semanal",      tipo:"Semanal", dificultad:"Normal",    imagen:"🏃",  xpRecompensa:400, activo:true,  completadas:312,  descripcion:"Mantén 3 sesiones de cardio durante la semana.",
    requisitos:[{tipo:"sesiones_total",label:"Completar sesiones",icon:"🏃",cantidad:3,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"400 XP"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Corredor Semanal"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:312 },
  { id:"m3",  titulo:"Maestro del Fuego",   tipo:"Desafío", dificultad:"Legendaria",imagen:"🔥",  xpRecompensa:2000,activo:true,  completadas:18,   descripcion:"Mantén una racha de 30 días consecutivos de entrenamiento.",
    requisitos:[{tipo:"racha_dias",label:"Mantener racha",icon:"🔥",cantidad:30,unidad:"días"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"2000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Llama Eterna"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Maestro del Fuego"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:18 },
  { id:"m4",  titulo:"Flex Maestro",        tipo:"Semanal", dificultad:"Normal",    imagen:"🧘",  xpRecompensa:350, activo:true,  completadas:89,   descripcion:"Completa 4 sesiones de flexibilidad o yoga esta semana.",
    requisitos:[{tipo:"flex_minutos",label:"Flexibilidad activa",icon:"🧘",cantidad:60,unidad:"minutos"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"350 XP"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:89 },
  { id:"m5",  titulo:"Festival de Primavera",tipo:"Evento", dificultad:"Difícil",  imagen:"🌸",  xpRecompensa:800, activo:false, completadas:0,    descripcion:"Evento especial de primavera: completa 10 sesiones en una semana.",
    requisitos:[{tipo:"sesiones_total",label:"Completar sesiones",icon:"🏃",cantidad:10,unidad:"sesiones"},{tipo:"xp_ganado",label:"Ganar XP",icon:"⚡",cantidad:2000,unidad:"XP"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"800 XP"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Armadura de Primavera"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Héroe Primaveral"}],
    fechaInicio:"2025-03-20", fechaFin:"2025-03-31", limiteUsos:500, usosActuales:0 },
  { id:"m6",  titulo:"Primer Paso",         tipo:"Diaria",  dificultad:"Fácil",    imagen:"🌟",  xpRecompensa:80,  activo:true,  completadas:934,  descripcion:"Completa al menos 1 sesión de ejercicio hoy.",
    requisitos:[{tipo:"sesiones_total",label:"Completar sesiones",icon:"🏃",cantidad:1,unidad:"sesiones"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"80 XP"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:934 },
  { id:"m7",  titulo:"Leyenda del Hierro",  tipo:"Desafío", dificultad:"Legendaria",imagen:"🏆", xpRecompensa:5000,activo:true,  completadas:4,    descripcion:"Alcanza el nivel 50 y completa 500 sesiones de fuerza.",
    requisitos:[{tipo:"nivel_alcanzado",label:"Alcanzar nivel",icon:"⬆️",cantidad:50,unidad:"nivel"},{tipo:"fuerza_reps",label:"Repeticiones de fuerza",icon:"🏋️",cantidad:5000,unidad:"reps"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"5000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Leyenda Viviente"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Espada Legendaria"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:4 },
  { id:"m8",  titulo:"Cardio Diario",       tipo:"Diaria",  dificultad:"Normal",   imagen:"🏃",  xpRecompensa:120, activo:true,  completadas:567,  descripcion:"30 minutos de cardio activo hoy.",
    requisitos:[{tipo:"cardio_minutos",label:"Cardio activo",icon:"⏱️",cantidad:30,unidad:"minutos"}],
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"120 XP"}],
    fechaInicio:null, fechaFin:null, limiteUsos:null, usosActuales:567 },
];

const EMPTY_REQ  = { tipo:"completar_ejercicio", label:"Completar ejercicio", icon:"💪", cantidad:1, unidad:"veces" };
const EMPTY_FORM = { titulo:"", tipo:"Diaria", dificultad:"Fácil", imagen:"🎯", xpRecompensa:100, activo:true, descripcion:"", requisitos:[], recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:""}], fechaInicio:"", fechaFin:"", limiteUsos:"" };
const PAGE_SIZE_OPTIONS = [6,12,24];

// ── UI atoms ──────────────────────────────────────────────────
function MiniBar({val,color,height=5}) {
  return (<div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}><div style={{height:"100%",width:`${Math.min(val,100)}%`,background:color,boxShadow:`0 0 5px ${color}66`,transition:"width .6s"}}/></div>);
}
function TipoBadge({tipo}) {
  const m=TIPOS[tipo]||{color:C.muted,icon:"?",bg:C.panel};
  return <span style={{...raj(10,700),color:m.color,background:m.bg,border:`1px solid ${m.color}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{m.icon} {tipo}</span>;
}
function DifBadge({dif}) {
  const c=DIFICULTAD_COLOR[dif]||C.muted;
  return <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 8px",whiteSpace:"nowrap"}}>{dif}</span>;
}
function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"m-spin .8s linear infinite"}}/>;
}
function SortIcon({active,dir}) {
  if(!active) return <ChevronDown size={11} color={C.navy}/>;
  return dir==="asc"?<ChevronUp size={11} color={C.orange}/>:<ChevronDown size={11} color={C.orange}/>;
}

// ── Barra de progreso de usos ─────────────────────────────────
function UsoBar({usos,limite,color}) {
  const pct = limite ? Math.min((usos/limite)*100,100) : Math.min((usos/1500)*100,100);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{...raj(11,600),color:C.muted}}>{usos.toLocaleString()} completadas</span>
        {limite&&<span style={{...raj(11,600),color}}>{Math.round(pct)}%</span>}
      </div>
      <MiniBar val={pct} color={color} height={5}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — VER
// ══════════════════════════════════════════════════════════════
function ViewModal({mision,onClose,onEdit}) {
  const m=TIPOS[mision.tipo]||{};
  const c=m.color||C.orange;
  const dc=DIFICULTAD_COLOR[mision.dificultad]||C.muted;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:580,background:C.card,border:`1px solid ${c}44`,boxShadow:`0 0 60px ${c}11,0 24px 60px rgba(0,0,0,.6)`,animation:"m-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:52,height:52,background:`${c}18`,border:`2px solid ${c}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,animation:"m-bounce 2.5s ease-in-out infinite"}}>{mision.imagen}</div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:6}}>{mision.titulo}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><TipoBadge tipo={mision.tipo}/><DifBadge dif={mision.dificultad}/></div>
            </div>
          </div>
          <button onClick={onClose} className="m-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16,maxHeight:"72vh",overflowY:"auto"}}>
          {/* stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {l:"XP RECOMP.", v:`+${mision.xpRecompensa}`, c:C.gold},
              {l:"COMPLETADAS",v:mision.completadas.toLocaleString(),c:C.blue},
              {l:"ESTADO",     v:mision.activo?"ACTIVA":"INACTIVA",c:mision.activo?C.green:C.red},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(15,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* descripcion */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7}}>{mision.descripcion}</p>
            {(mision.fechaInicio||mision.fechaFin)&&(
              <div style={{marginTop:10,display:"flex",gap:10,flexWrap:"wrap"}}>
                {mision.fechaInicio&&<span style={{...raj(11,600),color:C.muted}}>📅 Inicio: <span style={{color:C.white}}>{mision.fechaInicio}</span></span>}
                {mision.fechaFin&&<span style={{...raj(11,600),color:C.muted}}>📅 Fin: <span style={{color:C.white}}>{mision.fechaFin}</span></span>}
              </div>
            )}
            {mision.limiteUsos&&<div style={{marginTop:6,...raj(11,600),color:C.muted}}>👥 Límite: <span style={{color:c}}>{mision.limiteUsos.toLocaleString()} usos</span></div>}
          </div>

          {/* requisitos */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📋 REQUISITOS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {mision.requisitos.map((r,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 14px"}}>
                  <span style={{fontSize:20}}>{r.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{...raj(13,700),color:C.white}}>{r.label}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{r.cantidad} {r.unidad}</div>
                  </div>
                  <div style={{background:`${c}18`,border:`1px solid ${c}33`,padding:"4px 10px",...raj(12,700),color:c}}>{r.cantidad} {r.unidad}</div>
                </div>
              ))}
            </div>
          </div>

          {/* recompensas */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>🎁 RECOMPENSAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {mision.recompensas.map((r,i)=>(
                <div key={i} style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,animation:"m-glow 3s ease-in-out infinite"}}>
                  <span style={{fontSize:18}}>{r.icon}</span>
                  <div>
                    <div style={{...raj(12,700),color:C.gold}}>{r.label}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{r.valor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* uso bar */}
          <UsoBar usos={mision.completadas} limite={mision.limiteUsos} color={c}/>

          {/* actions */}
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:C.panel,border:`1px solid ${mision.activo?C.green:C.red}33`,padding:"10px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:mision.activo?C.green:C.red,animation:mision.activo?"m-pulse 1.5s infinite":"none"}}/>
              <span style={{...raj(13,700),color:mision.activo?C.green:C.red}}>{mision.activo?"ACTIVA":"INACTIVA"}</span>
            </div>
            <button onClick={()=>{onClose();onEdit(mision);}} className="m-btn"
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
function FormModal({mision,onClose,onSave}) {
  const isEdit=!!mision;
  const [form,    setForm]    = useState(mision?{...mision,requisitos:[...mision.requisitos],recompensas:[...mision.recompensas]}:{...EMPTY_FORM});
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [shake,   setShake]   = useState(false);
  const [tab,     setTab]     = useState("info");

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const tipoMeta=TIPOS[form.tipo]||{};
  const bc=isEdit?C.orange:C.green;

  const validate=()=>{
    const e={};
    if(!form.titulo.trim())      e.titulo="Título requerido";
    if(!form.descripcion.trim()) e.descripcion="Descripción requerida";
    if(!form.requisitos.length)  e.requisitos="Añade al menos un requisito";
    if(form.xpRecompensa<1)      e.xp="Mínimo 1 XP";
    return e;
  };

  const save=async()=>{
    const e=validate();
    if(Object.keys(e).length){setErrors(e);setShake(true);setTimeout(()=>setShake(false),500);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,900));
    setLoading(false);
    onSave({...form,id:mision?.id||`m${Date.now()}`,completadas:mision?.completadas||0,usosActuales:mision?.usosActuales||0,
      xpRecompensa:Number(form.xpRecompensa),
      limiteUsos:form.limiteUsos?Number(form.limiteUsos):null,
      fechaInicio:form.fechaInicio||null, fechaFin:form.fechaFin||null,
    });
    onClose();
  };

  // requisitos
  const addReq=()=>setForm(f=>({...f,requisitos:[...f.requisitos,{...EMPTY_REQ}]}));
  const removeReq=(i)=>setForm(f=>({...f,requisitos:f.requisitos.filter((_,idx)=>idx!==i)}));
  const setReq=(i,k,v)=>setForm(f=>({...f,requisitos:f.requisitos.map((r,idx)=>idx===i?{...r,[k]:v}:r)}));
  const changeReqTipo=(i,tipoId)=>{
    const rt=REQ_TIPOS.find(r=>r.id===tipoId)||REQ_TIPOS[0];
    setReq(i,"tipo",tipoId); setReq(i,"label",rt.label); setReq(i,"icon",rt.icon); setReq(i,"unidad",rt.unit);
  };

  // recompensas
  const addRecompensa=()=>setForm(f=>({...f,recompensas:[...f.recompensas,{tipo:"badge",icon:"🏅",label:"Badge",valor:""}]}));
  const removeRecompensa=(i)=>setForm(f=>({...f,recompensas:f.recompensas.filter((_,idx)=>idx!==i)}));
  const setRec=(i,k,v)=>setForm(f=>({...f,recompensas:f.recompensas.map((r,idx)=>idx===i?{...r,[k]:v}:r)}));
  const changeRecTipo=(i,tipoId)=>{
    const rt=RECOMPENSA_TIPOS.find(r=>r.id===tipoId)||RECOMPENSA_TIPOS[0];
    setRec(i,"tipo",tipoId); setRec(i,"icon",rt.icon); setRec(i,"label",rt.label);
  };

  const inpSt=(err)=>({width:"100%",padding:"11px 14px",background:C.panel,border:`1px solid ${err?C.red:C.navy}`,color:C.white,...raj(14,500)});
  const lbl={display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"};
  const TABS=[{id:"info",l:"INFO"},{id:"requisitos",l:`REQUISITOS (${form.requisitos.length})`},{id:"recompensas",l:`RECOMPENSAS (${form.recompensas.length})`}];

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:680,background:C.card,border:`1px solid ${bc}44`,boxShadow:`0 0 60px ${bc}0E,0 24px 60px rgba(0,0,0,.6)`,animation:"m-modalIn .25s ease both",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"93vh"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${bc},transparent)`,flexShrink:0}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 22px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isEdit?<Edit2 size={15} color={C.orange}/>:<Plus size={15} color={C.green}/>}
            <span style={{...orb(12,700),color:C.white}}>{isEdit?"EDITAR MISIÓN":"NUEVA MISIÓN"}</span>
            {isEdit&&<span style={{...raj(12,500),color:C.muted}}>— {mision.titulo}</span>}
          </div>
          <button onClick={onClose} className="m-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        {/* tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="m-btn"
              style={{flex:1,padding:"11px 0",...raj(12,tab===t.id?700:500),color:tab===t.id?bc:C.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?bc:"transparent"}`,cursor:"pointer",position:"relative"}}>
              {t.l}
              {t.id==="requisitos"&&errors.requisitos&&<span style={{position:"absolute",top:7,right:"18%",width:6,height:6,background:C.red,borderRadius:"50%"}}/>}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:22}} className={shake?"m-shake":""}>

          {/* ── TAB INFO ── */}
          {tab==="info"&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* emoji + título */}
              <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:14}}>
                <div>
                  <label style={lbl}>🎨 ICONO</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                    {EMOJIS_MISION.map(e=>(
                      <button key={e} type="button" onClick={()=>set("imagen",e)} className="m-btn"
                        style={{fontSize:17,background:form.imagen===e?`${bc}22`:"transparent",border:`1px solid ${form.imagen===e?bc:C.navy}`,padding:"5px",cursor:"pointer",transition:"all .18s"}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>📝 TÍTULO</label>
                  <input className="m-input" value={form.titulo} onChange={e=>set("titulo",e.target.value)} placeholder="Ej: Guerrero Diario" style={inpSt(errors.titulo)}/>
                  {errors.titulo&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.titulo}</p>}
                  <label style={{...lbl,marginTop:12}}>📋 DESCRIPCIÓN</label>
                  <textarea className="m-input" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} rows={3} placeholder="Describe el objetivo de la misión..." style={{...inpSt(errors.descripcion),resize:"vertical"}}/>
                  {errors.descripcion&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.descripcion}</p>}
                </div>
              </div>

              {/* tipo de misión */}
              <div>
                <label style={lbl}>🗂️ TIPO DE MISIÓN</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {TIPO_KEYS.map(tipo=>{
                    const m=TIPOS[tipo]; const on=form.tipo===tipo;
                    return (
                      <button key={tipo} type="button" onClick={()=>set("tipo",tipo)} className="m-btn"
                        style={{background:on?m.bg:"transparent",border:`2px solid ${on?m.color:C.navy}`,padding:"14px 8px",cursor:"pointer",textAlign:"center",boxShadow:on?`0 0 16px ${m.color}33`:"none",transition:"all .22s"}}>
                        <div style={{fontSize:26,marginBottom:6,filter:on?`drop-shadow(0 0 8px ${m.color})`:"none"}}>{m.icon}</div>
                        <div style={{...px(7),color:on?m.color:C.muted,marginBottom:4}}>{tipo.toUpperCase()}</div>
                        <div style={{...raj(9,400),color:C.muted,lineHeight:1.4}}>{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* dificultad + XP + estado */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                <div>
                  <label style={lbl}>⚡ DIFICULTAD</label>
                  {DIFICULTADES.map(d=>{
                    const dc=DIFICULTAD_COLOR[d]; const on=form.dificultad===d;
                    return (
                      <button key={d} type="button" onClick={()=>set("dificultad",d)} className="m-btn"
                        style={{width:"100%",marginBottom:6,...raj(12,on?700:500),color:on?dc:C.muted,background:on?`${dc}18`:"transparent",border:`1px solid ${on?dc:C.navy}`,padding:"9px 12px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                        {d}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label style={lbl}>⚡ XP RECOMPENSA</label>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <input className="m-input" type="range" min={10} max={5000} step={10} value={form.xpRecompensa} onChange={e=>set("xpRecompensa",Number(e.target.value))}
                      style={{flex:1,accentColor:C.gold,cursor:"pointer"}}/>
                    <div style={{background:C.panel,border:`1px solid ${C.gold}44`,padding:"8px 12px",minWidth:70,textAlign:"center"}}>
                      <span style={{...orb(14,900),color:C.gold}}>+{form.xpRecompensa}</span>
                    </div>
                  </div>
                  <input className="m-input" type="number" min={10} value={form.xpRecompensa} onChange={e=>set("xpRecompensa",Number(e.target.value))} style={inpSt(errors.xp)}/>
                  {errors.xp&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.xp}</p>}
                </div>
                <div>
                  <label style={lbl}>● ESTADO</label>
                  {[{v:true,l:"ACTIVA",c:C.green},{v:false,l:"INACTIVA",c:C.red}].map(o=>(
                    <button key={String(o.v)} type="button" onClick={()=>set("activo",o.v)} className="m-btn"
                      style={{width:"100%",marginBottom:8,...raj(12,form.activo===o.v?700:500),color:form.activo===o.v?o.c:C.muted,background:form.activo===o.v?`${o.c}18`:"transparent",border:`1px solid ${form.activo===o.v?o.c:C.navy}`,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:form.activo===o.v?o.c:C.navy}}/>{o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas y límite (solo Evento) */}
              <div style={{background:C.panel,border:`1px solid ${form.tipo==="Evento"?C.purple:C.navy}`,padding:"16px 18px",transition:"border-color .3s"}}>
                <div style={{...px(6),color:form.tipo==="Evento"?C.purple:C.muted,marginBottom:12,letterSpacing:".05em"}}>
                  {form.tipo==="Evento"?"🎉 CONFIGURACIÓN DE EVENTO":"📅 OPCIONES AVANZADAS"}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                  <div>
                    <label style={lbl}>📅 FECHA INICIO</label>
                    <input className="m-input" type="date" value={form.fechaInicio||""} onChange={e=>set("fechaInicio",e.target.value)} style={inpSt(false)}/>
                  </div>
                  <div>
                    <label style={lbl}>📅 FECHA FIN</label>
                    <input className="m-input" type="date" value={form.fechaFin||""} onChange={e=>set("fechaFin",e.target.value)} style={inpSt(false)}/>
                  </div>
                  <div>
                    <label style={lbl}>👥 LÍMITE USOS</label>
                    <input className="m-input" type="number" min={1} value={form.limiteUsos||""} onChange={e=>set("limiteUsos",e.target.value)} placeholder="Sin límite" style={inpSt(false)}/>
                    <p style={{...raj(10,400),color:C.muted,marginTop:4}}>Vacío = sin límite</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB REQUISITOS ── */}
          {tab==="requisitos"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {errors.requisitos&&<p style={{...raj(12),color:C.red}}>⚠ {errors.requisitos}</p>}
              <p style={{...raj(13,400),color:C.muted,lineHeight:1.6}}>
                Define qué debe hacer el jugador para completar la misión. Puedes añadir múltiples requisitos — todos deben cumplirse.
              </p>

              {form.requisitos.length>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {form.requisitos.map((req,i)=>(
                    <div key={i} className="m-req-row" style={{background:C.panel,border:`1px solid ${tipoMeta.color||C.navy}33`,padding:"14px 16px",position:"relative"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
                        {/* tipo */}
                        <div>
                          <label style={{...lbl,marginBottom:6}}>TIPO DE REQUISITO</label>
                          <select className="m-input" value={req.tipo} onChange={e=>changeReqTipo(i,e.target.value)}
                            style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500),appearance:"none",cursor:"pointer"}}>
                            {REQ_TIPOS.map(rt=><option key={rt.id} value={rt.id}>{rt.icon} {rt.label}</option>)}
                          </select>
                        </div>
                        {/* cantidad */}
                        <div>
                          <label style={{...lbl,marginBottom:6}}>CANTIDAD ({req.unidad})</label>
                          <input className="m-input" type="number" min={1} value={req.cantidad} onChange={e=>setReq(i,"cantidad",Number(e.target.value))}
                            style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(14,600)}}
                            placeholder={REQ_TIPOS.find(r=>r.id===req.tipo)?.placeholder}/>
                        </div>
                        {/* remove */}
                        <button type="button" onClick={()=>removeReq(i)} className="m-icon-btn"
                          style={{background:"transparent",border:`1px solid ${C.red}33`,padding:"9px",color:C.red,display:"flex",alignItems:"center",alignSelf:"flex-end"}}
                          onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.borderColor=C.red;}}
                          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.red}33`;}}><Trash2 size={13}/></button>
                      </div>
                      {/* preview */}
                      <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.card,border:`1px solid ${tipoMeta.color||C.navy}22`}}>
                        <span style={{fontSize:18}}>{req.icon}</span>
                        <span style={{...raj(12,600),color:C.white}}>{req.label}</span>
                        <span style={{...raj(12,700),color:tipoMeta.color||C.orange,marginLeft:"auto"}}>{req.cantidad} {req.unidad}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={addReq} className="m-btn"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,...raj(13,700),color:tipoMeta.color||C.orange,background:`${tipoMeta.color||C.orange}0D`,border:`2px dashed ${tipoMeta.color||C.orange}44`,padding:"14px",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${tipoMeta.color||C.orange}18`;e.currentTarget.style.borderStyle="solid";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${tipoMeta.color||C.orange}0D`;e.currentTarget.style.borderStyle="dashed";}}>
                <Plus size={16}/> AÑADIR REQUISITO
              </button>

              {/* Reference table */}
              <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
                <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📖 REFERENCIA DE REQUISITOS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {REQ_TIPOS.map(rt=>(
                    <div key={rt.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,border:`1px solid ${C.navy}33`}}>
                      <span style={{fontSize:16}}>{rt.icon}</span>
                      <div>
                        <div style={{...raj(11,700),color:C.white}}>{rt.label}</div>
                        <div style={{...raj(10,400),color:C.muted}}>Unidad: {rt.unit}</div>
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
                Define qué recibirá el jugador al completar la misión. El XP se suma automáticamente; los demás son extras.
              </p>

              {form.recompensas.map((rec,i)=>(
                <div key={i} style={{background:C.panel,border:`1px solid ${C.gold}22`,padding:"14px 16px",animation:"m-glow 4s ease-in-out infinite"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>TIPO DE RECOMPENSA</label>
                      <select className="m-input" value={rec.tipo} onChange={e=>changeRecTipo(i,e.target.value)}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500),appearance:"none",cursor:"pointer"}}>
                        {RECOMPENSA_TIPOS.map(rt=><option key={rt.id} value={rt.id}>{rt.icon} {rt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>
                        {rec.tipo==="xp"?"CANTIDAD DE XP":rec.tipo==="badge"?"NOMBRE DEL BADGE":rec.tipo==="titulo"?"NOMBRE DEL TÍTULO":"NOMBRE DEL OBJETO"}
                      </label>
                      <input className="m-input" value={rec.valor} onChange={e=>setRec(i,"valor",e.target.value)}
                        placeholder={rec.tipo==="xp"?"Ej: 200 XP":rec.tipo==="badge"?"Ej: Guerrero Semanal":rec.tipo==="titulo"?"Ej: Maestro del Fuego":"Ej: Poción XP"}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(14,600)}}/>
                    </div>
                    {form.recompensas.length>1&&(
                      <button type="button" onClick={()=>removeRecompensa(i)} className="m-icon-btn"
                        style={{background:"transparent",border:`1px solid ${C.red}33`,padding:"9px",color:C.red,display:"flex",alignItems:"center",alignSelf:"flex-end"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.borderColor=C.red;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.red}33`;}}><Trash2 size={13}/></button>
                    )}
                  </div>
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.card,border:`1px solid ${C.gold}22`}}>
                    <span style={{fontSize:18}}>{rec.icon}</span>
                    <span style={{...raj(12,600),color:C.gold}}>{rec.label}</span>
                    {rec.valor&&<span style={{...raj(12,700),color:C.white,marginLeft:"auto"}}>{rec.valor}</span>}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addRecompensa} className="m-btn"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,...raj(13,700),color:C.gold,background:`${C.gold}0D`,border:`2px dashed ${C.gold}44`,padding:"14px",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${C.gold}18`;e.currentTarget.style.borderStyle="solid";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${C.gold}0D`;e.currentTarget.style.borderStyle="dashed";}}>
                <Plus size={16}/> AÑADIR RECOMPENSA
              </button>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{display:"flex",gap:10,padding:"15px 22px",borderTop:`1px solid ${C.navy}`,flexShrink:0}}>
          <button onClick={onClose} className="m-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 20px",cursor:"pointer"}}>CANCELAR</button>
          <button onClick={save} disabled={loading} className="m-btn"
            style={{flex:1,...px(8),color:loading?C.muted:C.bg,background:loading?`${bc}55`:bc,border:"none",padding:"12px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 4px 20px ${bc}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            {loading?<><Spinner color={bc}/> GUARDANDO...</>:<><Check size={14}/> {isEdit?"GUARDAR CAMBIOS":"CREAR MISIÓN"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — ELIMINAR
// ══════════════════════════════════════════════════════════════
function DeleteModal({mision,onClose,onConfirm}) {
  const [typed,setTyped]=useState("");
  const [loading,setLoading]=useState(false);
  const match=typed===mision.titulo;
  const confirm=async()=>{if(!match)return;setLoading(true);await new Promise(r=>setTimeout(r,700));setLoading(false);onConfirm(mision.id);onClose();};
  const c=TIPOS[mision.tipo]?.color||C.orange;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:420,background:C.card,border:`1px solid ${C.red}44`,boxShadow:`0 0 60px ${C.red}14,0 24px 60px rgba(0,0,0,.6)`,animation:"m-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>
        <div style={{padding:"22px 24px 26px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex"}}><AlertTriangle size={22} color={C.red}/></div>
            <div><div style={{...orb(13,900),color:C.red,marginBottom:3}}>ELIMINAR MISIÓN</div><div style={{...raj(12,500),color:C.muted}}>Esta acción no se puede deshacer</div></div>
          </div>
          <div style={{background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:"12px 16px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:26}}>{mision.imagen}</span>
            <div>
              <div style={{...raj(14,700),color:C.red}}>{mision.titulo}</div>
              <div style={{...raj(12,400),color:C.muted}}>{mision.tipo} · {mision.completadas.toLocaleString()} completadas · +{mision.xpRecompensa} XP</div>
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",...px(6),color:C.muted,marginBottom:8,letterSpacing:".06em"}}>ESCRIBE <span style={{color:C.red}}>{mision.titulo}</span> PARA CONFIRMAR</label>
            <input className="m-input" value={typed} onChange={e=>setTyped(e.target.value)} placeholder={mision.titulo}
              style={{width:"100%",padding:"12px 14px",background:C.panel,border:`1px solid ${match?C.red:C.navy}`,color:C.white,...raj(14,600)}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="m-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="m-btn"
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
export default function AdminMisiones() {
  const [misiones,   setMisiones]   = useState(MOCK_MISIONES);
  const [tipoTab,    setTipoTab]    = useState("Todas");
  const [search,     setSearch]     = useState("");
  const [filterDif,  setFilterDif]  = useState("all");
  const [filterAct,  setFilterAct]  = useState("all");
  const [sortKey,    setSortKey]    = useState("completadas");
  const [sortDir,    setSortDir]    = useState("desc");
  const [view,       setView]       = useState("grid");
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(12);
  const [selected,   setSelected]   = useState(new Set());
  const [modal,      setModal]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh=async()=>{setRefreshing(true);await new Promise(r=>setTimeout(r,800));setRefreshing(false);};

  const filtered=useMemo(()=>{
    let list=[...misiones];
    if(tipoTab!=="Todas")  list=list.filter(m=>m.tipo===tipoTab);
    if(search)             list=list.filter(m=>m.titulo.toLowerCase().includes(search.toLowerCase())||m.descripcion.toLowerCase().includes(search.toLowerCase()));
    if(filterDif!=="all")  list=list.filter(m=>m.dificultad===filterDif);
    if(filterAct!=="all")  list=list.filter(m=>String(m.activo)===(filterAct==="active"?"true":"false"));
    list.sort((a,b)=>{const av=a[sortKey]??"";const bv=b[sortKey]??"";return sortDir==="asc"?(av>bv?1:-1):(av<bv?1:-1);});
    return list;
  },[misiones,tipoTab,search,filterDif,filterAct,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);
  const sort=(k)=>{if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}};
  const toggleSelect=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSelected(s=>s.size===paginated.length?new Set():new Set(paginated.map(m=>m.id)));
  const handleSave=(saved)=>setMisiones(ms=>{const i=ms.findIndex(m=>m.id===saved.id);if(i>=0){const a=[...ms];a[i]=saved;return a;}return[saved,...ms];});
  const handleDelete=(id)=>{setMisiones(ms=>ms.filter(m=>m.id!==id));setSelected(s=>{const n=new Set(s);n.delete(id);return n;});};
  const bulkDelete=()=>{setMisiones(ms=>ms.filter(m=>!selected.has(m.id)));setSelected(new Set());};
  const bulkToggle=(activo)=>setMisiones(ms=>ms.map(m=>selected.has(m.id)?{...m,activo}:m));

  const kpis=useMemo(()=>({
    total:      misiones.length,
    activas:    misiones.filter(m=>m.activo).length,
    completadas:misiones.reduce((s,m)=>s+m.completadas,0),
    xpTotal:    misiones.reduce((s,m)=>s+m.xpRecompensa,0),
  }),[misiones]);

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {modal?.type==="view"   && <ViewModal   mision={modal.m} onClose={()=>setModal(null)} onEdit={m=>setModal({type:"form",m})}/>}
      {modal?.type==="form"   && <FormModal   mision={modal.m} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {modal?.type==="delete" && <DeleteModal mision={modal.m} onClose={()=>setModal(null)} onConfirm={handleDelete}/>}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"MISIONES",    value:kpis.total,   icon:<Target size={18}/>,   color:C.orange},
            {label:"ACTIVAS",     value:kpis.activas, icon:<Zap size={18}/>,      color:C.green },
            {label:"COMPLETADAS", value:kpis.completadas.toLocaleString(),icon:<Trophy size={18}/>,color:C.blue},
            {label:"XP EN JUEGO", value:`${(kpis.xpTotal/1000).toFixed(1)}K`,icon:<Star size={18}/>,color:C.gold},
          ].map((k,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${k.color}33`,padding:"18px 16px",position:"relative",overflow:"hidden",animation:`m-cardIn .4s ease ${i*.07}s both`,transition:"transform .2s,box-shadow .2s"}}
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
            {["Todas",...TIPO_KEYS].map(tipo=>{
              const m=TIPOS[tipo]; const on=tipoTab===tipo; const cc=m?.color||C.orange;
              const count=tipo==="Todas"?misiones.length:misiones.filter(x=>x.tipo===tipo).length;
              return (
                <button key={tipo} onClick={()=>{setTipoTab(tipo);setPage(1);}} className="m-type-tab"
                  style={{flex:1,padding:"14px 8px",background:on?`${cc}12`:"transparent",border:"none",borderBottom:`3px solid ${on?cc:"transparent"}`,color:on?cc:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all .22s"}}>
                  <div style={{fontSize:20,filter:on?`drop-shadow(0 0 6px ${cc})`:"none"}}>{m?.icon||"🌐"}</div>
                  <span style={{...raj(12,on?700:500),letterSpacing:".04em"}}>{tipo}</span>
                  <span style={{...raj(10,700),color:on?cc:C.navy,background:on?`${cc}22`:`${C.navy}44`,padding:"1px 7px"}}>{count}</span>
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
              <input className="m-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Buscar misión..."
                style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{v:"grid",i:"⊞"},{v:"table",i:"≡"}].map(({v,i})=>(
                <button key={v} onClick={()=>setView(v)} className="m-btn"
                  style={{...raj(14,700),color:view===v?C.orange:C.muted,background:view===v?`${C.orange}18`:C.panel,border:`1px solid ${view===v?C.orange:C.navy}`,padding:"7px 12px",cursor:"pointer"}}>{i}</button>
              ))}
            </div>
            <span style={{...raj(11,600),color:C.muted}}>Dificultad:</span>
            {["all",...DIFICULTADES].map(v=><button key={v} onClick={()=>{setFilterDif(v);setPage(1);}} className="m-btn" style={fBtn(filterDif===v,DIFICULTAD_COLOR[v]||C.orange)}>{v==="all"?"Todas":v}</button>)}
            <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
            {[{v:"all",l:"Todas"},{v:"active",l:"● Activas"},{v:"inactive",l:"● Inactivas"}].map(o=><button key={o.v} onClick={()=>{setFilterAct(o.v);setPage(1);}} className="m-btn" style={fBtn(filterAct===o.v,o.v==="active"?C.green:C.red)}>{o.l}</button>)}
            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              {selected.size>0&&(<>
                <button onClick={()=>bulkToggle(true)}  className="m-btn" style={{...raj(11,700),color:C.green, background:`${C.green}14`, border:`1px solid ${C.green}44`, padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Check size={12}/> Activar ({selected.size})</button>
                <button onClick={()=>bulkToggle(false)} className="m-btn" style={{...raj(11,700),color:C.orange,background:`${C.orange}14`,border:`1px solid ${C.orange}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><X size={12}/> Desactivar ({selected.size})</button>
                <button onClick={bulkDelete}            className="m-btn" style={{...raj(11,700),color:C.red,   background:`${C.red}14`,   border:`1px solid ${C.red}44`,   padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Trash2 size={12}/> Eliminar ({selected.size})</button>
              </>)}
              <button onClick={refresh} className="m-btn" style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"7px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <RefreshCw size={12} style={{animation:refreshing?"m-spin .8s linear infinite":"none"}}/> Actualizar
              </button>
              <button onClick={()=>setModal({type:"form",m:null})} className="m-btn"
                style={{...px(7),color:C.bg,background:C.green,border:"none",padding:"7px 14px",cursor:"pointer",boxShadow:`0 3px 14px ${C.green}33`,display:"flex",alignItems:"center",gap:6}}>
                <Plus size={13}/> NUEVA
              </button>
            </div>
          </div>
        </div>

        <div style={{...raj(12,500),color:C.muted}}>
          {filtered.length} misión{filtered.length!==1?"es":""} · página {page}/{totalPages}
          {selected.size>0&&<span style={{color:C.orange,marginLeft:12}}>{selected.size} seleccionada{selected.size!==1?"s":""}</span>}
        </div>

        {/* GRID */}
        {view==="grid"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {paginated.length===0?<div style={{gridColumn:"1/-1",padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((m,i)=>{
              const tm=TIPOS[m.tipo]||{}; const c=tm.color||C.orange; const sel=selected.has(m.id);
              const dc=DIFICULTAD_COLOR[m.dificultad]||C.muted;
              return (
                <div key={m.id} className="m-card" style={{background:C.card,border:`1px solid ${sel?C.orange:c}33`,boxShadow:sel?`0 0 16px ${C.orange}22`:"0 4px 16px rgba(0,0,0,.3)",overflow:"hidden",animation:`m-cardIn .4s ease ${i*.05}s both`,position:"relative"}}>
                  <input type="checkbox" checked={sel} onChange={()=>toggleSelect(m.id)} style={{position:"absolute",top:10,left:10,accentColor:C.orange,width:14,height:14,cursor:"pointer",zIndex:2}}/>
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>
                  <div style={{padding:"16px 16px 12px"}}>
                    {/* header */}
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{fontSize:36,filter:`drop-shadow(0 0 10px ${c}88)`,animation:"m-bounce 3s ease-in-out infinite"}}>{m.imagen}</div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                        <TipoBadge tipo={m.tipo}/>
                        <span style={{...raj(10,600),color:m.activo?C.green:C.red,background:m.activo?`${C.green}14`:`${C.red}14`,border:`1px solid ${m.activo?C.green:C.red}33`,padding:"2px 8px"}}>{m.activo?"● ACTIVA":"● INACTIVA"}</span>
                      </div>
                    </div>

                    <div style={{...raj(14,700),color:C.white,marginBottom:6,lineHeight:1.3}}>{m.titulo}</div>
                    <DifBadge dif={m.dificultad}/>

                    <p style={{...raj(12,400),color:C.muted,lineHeight:1.5,marginTop:8,marginBottom:12,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{m.descripcion}</p>

                    {/* requisitos preview */}
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                      {m.requisitos.slice(0,2).map((r,idx)=>(
                        <span key={idx} style={{...raj(10,600),color:c,background:`${c}12`,border:`1px solid ${c}22`,padding:"2px 7px",display:"inline-flex",alignItems:"center",gap:3}}>
                          {r.icon} {r.cantidad} {r.unidad}
                        </span>
                      ))}
                      {m.requisitos.length>2&&<span style={{...raj(10,600),color:C.muted,background:`${C.muted}12`,border:`1px solid ${C.muted}22`,padding:"2px 7px"}}>+{m.requisitos.length-2}</span>}
                    </div>

                    {/* stats */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                      <div style={{background:C.panel,border:`1px solid ${C.gold}18`,padding:"7px 8px",textAlign:"center"}}>
                        <div style={{...orb(14,900),color:C.gold}}>+{m.xpRecompensa}</div>
                        <div style={{...px(5),color:C.muted}}>XP</div>
                      </div>
                      <div style={{background:C.panel,border:`1px solid ${C.blue}18`,padding:"7px 8px",textAlign:"center"}}>
                        <div style={{...raj(13,700),color:C.blue}}>{m.completadas.toLocaleString()}</div>
                        <div style={{...px(5),color:C.muted}}>COMPL.</div>
                      </div>
                    </div>

                    {/* recompensas extras */}
                    {m.recompensas.length>1&&(
                      <div style={{display:"flex",gap:4,marginBottom:10}}>
                        {m.recompensas.slice(1).map((r,idx)=>(
                          <span key={idx} style={{...raj(10,600),color:C.gold,background:`${C.gold}0D`,border:`1px solid ${C.gold}22`,padding:"2px 7px",display:"inline-flex",alignItems:"center",gap:3}}>
                            {r.icon} {r.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <UsoBar usos={m.completadas} limite={m.limiteUsos} color={c}/>

                    {/* fechas si evento */}
                    {m.fechaFin&&<div style={{...raj(10,500),color:C.muted,marginTop:8}}>⏳ Hasta: <span style={{color:c}}>{m.fechaFin}</span></div>}
                  </div>
                  <div style={{borderTop:`1px solid ${C.navy}33`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",m}),l:"Ver"},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",m}),l:"Editar"},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",m}),l:"Borrar"}].map(({Icon,c:ic,fn,l},j)=>(
                      <button key={j} onClick={fn} className="m-btn"
                        style={{background:"transparent",border:"none",borderRight:j<2?`1px solid ${C.navy}33`:"none",padding:"10px 0",color:ic,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",transition:"background .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=`${ic}14`}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <Icon size={13}/><span style={{...raj(9,600),color:C.muted}}>{l}</span>
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
            <div style={{display:"grid",gridTemplateColumns:"34px 2fr 0.9fr 0.9fr 0.8fr 0.7fr 0.7fr 0.6fr 95px",padding:"10px 14px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:8,alignItems:"center"}}>
              <input type="checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
              {[{l:"MISIÓN",k:"titulo"},{l:"TIPO",k:"tipo"},{l:"DIFICULD.",k:"dificultad"},{l:"REQUISITOS",k:null},{l:"XP",k:"xpRecompensa"},{l:"COMPL.",k:"completadas"},{l:"ESTADO",k:"activo"}].map((h,i)=>(
                <div key={i} className={h.k?"m-sort":""} onClick={()=>h.k&&sort(h.k)}
                  style={{display:"flex",alignItems:"center",gap:3,...px(5),color:sortKey===h.k?C.orange:C.muted,letterSpacing:".05em"}}>
                  {h.l}{h.k&&<SortIcon active={sortKey===h.k} dir={sortDir}/>}
                </div>
              ))}
              <span style={{...px(5),color:C.muted,letterSpacing:".05em"}}>ACC.</span>
            </div>

            {paginated.length===0?<div style={{padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((m,i)=>{
              const c=TIPOS[m.tipo]?.color||C.orange;
              return (
                <div key={m.id} className="m-row" style={{display:"grid",gridTemplateColumns:"34px 2fr 0.9fr 0.9fr 0.8fr 0.7fr 0.7fr 0.6fr 95px",padding:"11px 14px",borderBottom:`1px solid ${C.navy}22`,gap:8,alignItems:"center",animation:`m-slideU .3s ease ${i*.04}s both`,background:selected.has(m.id)?`${C.orange}08`:"transparent"}}>
                  <input type="checkbox" checked={selected.has(m.id)} onChange={()=>toggleSelect(m.id)} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                    <div style={{width:34,height:34,background:`${c}18`,border:`1px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{m.imagen}</div>
                    <div style={{minWidth:0}}>
                      <div style={{...raj(13,700),color:C.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.titulo}</div>
                      <div style={{...raj(11,400),color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.descripcion}</div>
                    </div>
                  </div>
                  <TipoBadge tipo={m.tipo}/>
                  <DifBadge dif={m.dificultad}/>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {m.requisitos.slice(0,2).map((r,idx)=><span key={idx} style={{fontSize:13}}>{r.icon}</span>)}
                    <span style={{...raj(10,600),color:C.muted}}>{m.requisitos.length} req.</span>
                  </div>
                  <span style={{...orb(13,900),color:C.gold}}>+{m.xpRecompensa}</span>
                  <div><div style={{...raj(11,700),color:C.blue,marginBottom:2}}>{m.completadas.toLocaleString()}</div><MiniBar val={Math.min((m.completadas/1500)*100,100)} color={C.blue} height={3}/></div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:m.activo?C.green:C.red,animation:m.activo?"m-pulse 1.8s infinite":"none"}}/>
                    <span style={{...raj(10,600),color:m.activo?C.green:C.red}}>{m.activo?"ON":"OFF"}</span>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",m})},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",m})},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",m})}].map(({Icon,c:ic,fn},j)=>(
                      <button key={j} onClick={fn} className="m-icon-btn"
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
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} className="m-input"
              style={{padding:"6px 10px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...raj(12,500),cursor:"pointer"}}>
              {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setPage(1)} disabled={page===1} className="m-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 11px",cursor:page===1?"not-allowed":"pointer"}}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="m-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 10px",cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className="m-btn"
                style={{background:n===page?C.orange:C.panel,border:`1px solid ${n===page?C.orange:C.navy}`,color:n===page?C.bg:C.muted,padding:"6px 13px",cursor:"pointer",...raj(13,n===page?700:500)}}>
                {n}
              </button>
            ))}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="m-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 10px",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronRight size={13}/></button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} className="m-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 11px",cursor:page===totalPages?"not-allowed":"pointer"}}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}