// src/pages/user/UserPerfil.jsx
// ─────────────────────────────────────────────────────────────
//  Página de perfil del jugador de ForgeVenture.
//  Props: profile (objeto del usuario), onLogout
//  Conectar: updateProfile(), updatePassword(), getStats()
// ─────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import {
  User, Edit2, Save, X, Check, Camera, Eye, EyeOff,
  Zap, Flame, Trophy, Star, Shield, TrendingUp,
  Calendar, Clock, Award, BarChart2, Lock,
  ChevronRight, AlertTriangle, LogOut, Settings,
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
  @keyframes up-fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes up-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes up-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes up-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes up-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes up-glow    { 0%,100%{text-shadow:0 0 14px #E85D04} 50%{text-shadow:0 0 32px #E85D04,0 0 60px #E85D0444} }
  @keyframes up-shine   { 0%{left:-100%} 100%{left:200%} }
  @keyframes up-saved   { 0%{opacity:0;transform:scale(.8)} 40%{opacity:1;transform:scale(1.1)} 100%{opacity:0;transform:scale(1)} }
  @keyframes up-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes up-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes up-ring    { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
  @keyframes up-star    { 0%,100%{transform:scale(1) rotate(0)} 50%{transform:scale(1.15) rotate(8deg)} }

  .up-card  { transition:all .22s; }
  .up-card:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(0,0,0,.45) !important; }
  .up-btn   { transition:all .2s; cursor:pointer; }
  .up-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .up-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .up-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .up-input::placeholder { color:${C.navy}; }
  .up-input:disabled { opacity:.45; cursor:not-allowed; }
  .up-tab   { transition:all .2s; cursor:pointer; }
  .up-tab:hover { opacity:.85; }
  .up-cls-btn { transition:all .25s; cursor:pointer; }
  .up-cls-btn:hover { transform:scale(1.03); }
  .up-stat-row { transition:background .15s; }
  .up-stat-row:hover { background:${C.navyL}18 !important; }
  .up-badge { transition:all .2s; cursor:pointer; }
  .up-badge:hover { transform:scale(1.1); }
  .up-danger-btn { transition:all .2s; cursor:pointer; }
  .up-danger-btn:hover { opacity:.85; }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Clase configs ──────────────────────────────────────────────
const CLS = {
  GUERRERO:{ icon:"⚔️", color:C.orange,  bg:"#E85D0414", desc:"Domina los ejercicios de fuerza",     bonus:"Fuerza +25% XP",    stats:{fuerza:95,resistencia:70,agilidad:55,vitalidad:60} },
  ARQUERO: { icon:"🏃", color:C.blue,    bg:"#4CC9F014", desc:"Especialista en cardio y velocidad",   bonus:"Cardio +25% XP",    stats:{agilidad:95,resistencia:85,fuerza:50,vitalidad:70} },
  MAGO:    { icon:"🧘", color:C.purple,  bg:"#9B59B614", desc:"Maestro de la flexibilidad y la mente",bonus:"Flexibilidad +25% XP",stats:{vitalidad:95,agilidad:80,resistencia:75,fuerza:45} },
};

const RAREZA_COLOR = { Común:C.muted, Raro:C.blue, Épico:C.purple, Legendario:C.gold };

// ── Mock data ─────────────────────────────────────────────────
const MOCK_STATS = {
  sesionesTotales:  47,
  xpTotal:          8420,
  rachaMax:         21,
  tiempoTotal:      1320, // minutos
  logrosObtenidos:  8,
  misionesCompletadas: 34,
  ejercicioFav:     "Flexiones",
  categFav:         "Fuerza",
  diasActivo:       38,
  nivel:            12,
  xp:               2840,
  xpNext:           3000,
  hp:               88,
  streak:           14,
  coins:            420,
  heroClass:        "GUERRERO",
  username:         "Aragorn_Dev",
  email:            "aragorn@forgeventure.com",
  heroName:         "El Guardián del Norte",
  bio:              "Forjando mi leyenda un rep a la vez.",
  createdAt:        "2024-10-01",
};

const MOCK_BADGES = [
  { id:"b1", imagen:"👋", nombre:"Primer Paso",      rareza:"Común",     color:C.muted,  obtenido:true  },
  { id:"b2", imagen:"🔥", nombre:"Semana de Hierro", rareza:"Raro",      color:C.blue,   obtenido:true  },
  { id:"b3", imagen:"👤", nombre:"Perfil Completo",  rareza:"Común",     color:C.muted,  obtenido:true  },
  { id:"b4", imagen:"💯", nombre:"¡10 Sesiones!",    rareza:"Raro",      color:C.blue,   obtenido:true  },
  { id:"b5", imagen:"⚡", nombre:"Sprint Épico",      rareza:"Raro",      color:C.blue,   obtenido:true  },
  { id:"b6", imagen:"🏆", nombre:"Maestro del Fuego",rareza:"Legendario",color:C.gold,   obtenido:false },
  { id:"b7", imagen:"💯", nombre:"Centenario",        rareza:"Épico",     color:C.purple, obtenido:false },
  { id:"b8", imagen:"👑", nombre:"Leyenda Viviente",  rareza:"Legendario",color:C.gold,   obtenido:false },
];

const ACTIVIDAD_SEMANAL = [
  {dia:"Lun",sesiones:2,xp:240},{dia:"Mar",sesiones:0,xp:0},{dia:"Mié",sesiones:3,xp:380},
  {dia:"Jue",sesiones:1,xp:110},{dia:"Vie",sesiones:2,xp:260},{dia:"Sáb",sesiones:0,xp:0},
  {dia:"Dom",sesiones:1,xp:140},
];

// ── Helpers ────────────────────────────────────────────────────
function MiniBar({val,max,color,height=6}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,
        boxShadow:`0 0 6px ${color}66`,"--bw":`${pct}%`,
        animation:"up-barFill .8s ease .2s both",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",animation:"up-shine 2s ease .5s 1"}}/>
      </div>
    </div>
  );
}

function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"up-spin .8s linear infinite"}}/>;
}

function SavedFlash({show}) {
  if(!show) return null;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,...raj(12,700),color:C.green,
      background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"6px 14px",
      animation:"up-saved 2s ease forwards"}}>
      <Check size={13}/> Guardado
    </div>
  );
}

function CInput({label, value, onChange, type="text", placeholder="", disabled=false, error, unit, mono=false}) {
  const [show, setShow] = useState(false);
  const inputType = type==="password"&&show?"text":type;
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"}}>{label}</label>}
      <div style={{position:"relative"}}>
        <input type={inputType} value={value}
          onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          className="up-input"
          style={{width:"100%",padding:type==="password"?"11px 44px 11px 14px":"11px 14px",
            background:C.panel,border:`1px solid ${error?C.red:C.navy}`,color:C.white,
            ...(mono?{fontFamily:"'Courier New',monospace",fontSize:13}:raj(13,500))}}/>
        {type==="password"&&(
          <button type="button" onClick={()=>setShow(s=>!s)}
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}>
            {show?<EyeOff size={14}/>:<Eye size={14}/>}
          </button>
        )}
        {unit&&<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",...raj(11,600),color:C.muted}}>{unit}</span>}
      </div>
      {error&&<div style={{...raj(11),color:C.red,marginTop:5}}>⚠ {error}</div>}
    </div>
  );
}

// ── Avatar con clase ───────────────────────────────────────────
function HeroAvatar({heroClass, size=80, animated=false}) {
  const cls = CLS[heroClass]||CLS.GUERRERO;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:"50%",
        background:`radial-gradient(circle at 35% 35%,${cls.color}28,${cls.color}08 60%,transparent 100%)`,
        border:`3px solid ${cls.color}55`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*.44,
        boxShadow:`0 0 ${size*.3}px ${cls.color}33,inset 0 0 ${size*.2}px ${cls.color}14`,
        animation:animated?"up-float 3s ease-in-out infinite":"none"}}>
        {cls.icon}
      </div>
      <div style={{position:"absolute",bottom:2,right:2,background:C.navy,borderRadius:"50%",
        width:size*.28,height:size*.28,border:`2px solid ${cls.color}55`,
        display:"flex",alignItems:"center",justifyContent:"center",...px(size*.07),color:cls.color}}>
        ⚡
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: RESUMEN
// ══════════════════════════════════════════════════════════════
function TabResumen({stats, badges}) {
  const cls = CLS[stats.heroClass]||CLS.GUERRERO;
  const xpPct = Math.round((stats.xp/stats.xpNext)*100);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Stats principales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {icon:"⚡",label:"SESIONES",  value:stats.sesionesTotales,         color:C.orange},
          {icon:"🏆",label:"XP TOTAL",  value:stats.xpTotal.toLocaleString(), color:C.gold  },
          {icon:"🔥",label:"RACHA MÁX.", value:`${stats.rachaMax}d`,          color:C.red   },
          {icon:"⏱️",label:"TIEMPO",    value:`${Math.floor(stats.tiempoTotal/60)}h`,color:C.blue},
        ].map((s,i)=>(
          <div key={i} className="up-card" style={{background:C.card,border:`1px solid ${s.color}22`,
            padding:"16px",textAlign:"center",boxShadow:"0 4px 16px rgba(0,0,0,.3)",
            animation:`up-cardIn .4s ease ${i*.07}s both`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.color},transparent)`}}/>
            <div style={{fontSize:26,marginBottom:8,filter:`drop-shadow(0 0 8px ${s.color}66)`}}>{s.icon}</div>
            <div style={{...orb(20,900),color:s.color,marginBottom:3}}>{s.value}</div>
            <div style={{...px(5),color:C.muted,letterSpacing:".05em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP bar del nivel */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"18px 20px",
        animation:"up-cardIn .4s ease .2s both"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{...orb(13,900),color:C.gold}}>Nivel {stats.nivel}</div>
            <div style={{...raj(12,500),color:C.muted}}>→ Nivel {stats.nivel+1}</div>
          </div>
          <div style={{...raj(12,700),color:C.gold}}>{xpPct}%</div>
        </div>
        <MiniBar val={stats.xp} max={stats.xpNext} color={C.gold} height={12}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{...raj(11,600),color:C.muted}}>{stats.xp.toLocaleString()} XP</span>
          <span style={{...raj(11,600),color:C.muted}}>faltan {(stats.xpNext-stats.xp).toLocaleString()} XP</span>
          <span style={{...raj(11,600),color:C.muted}}>{stats.xpNext.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Actividad semanal */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"18px 20px",
        animation:"up-cardIn .4s ease .25s both"}}>
        <div style={{...px(7),color:C.muted,marginBottom:16,letterSpacing:".05em"}}>📅 ACTIVIDAD ESTA SEMANA</div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80}}>
          {ACTIVIDAD_SEMANAL.map((d,i)=>{
            const maxSes=3;
            const h=d.sesiones>0?Math.max(16,(d.sesiones/maxSes)*72):4;
            const color=d.sesiones>0?cls.color:C.navy;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{...raj(9,d.sesiones>0?700:500),color:d.sesiones>0?C.gold:C.muted}}>
                  {d.sesiones>0?`+${d.xp}`:""}{d.sesiones>0?"":"—"}
                </div>
                <div style={{width:"100%",height:h,background:color,
                  boxShadow:d.sesiones>0?`0 0 8px ${color}66`:"none",
                  transition:"height .6s ease",position:"relative",overflow:"hidden"}}>
                  {d.sesiones>0&&<div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(255,255,255,.15),transparent)"}}/>}
                </div>
                <div style={{...raj(9,600),color:C.muted}}>{d.dia}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats de juego */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {/* Clase stats */}
        <div style={{background:C.card,border:`1px solid ${cls.color}22`,padding:"18px 20px",
          animation:"up-cardIn .4s ease .3s both"}}>
          <div style={{...px(6),color:C.muted,marginBottom:12,letterSpacing:".05em"}}>⚔️ ESTADÍSTICAS DE CLASE</div>
          {Object.entries(cls.stats).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{...raj(12,600),color:C.mutedL,textTransform:"capitalize"}}>{k}</span>
                <span style={{...raj(12,700),color:cls.color}}>{v}</span>
              </div>
              <MiniBar val={v} max={100} color={cls.color} height={5}/>
            </div>
          ))}
        </div>

        {/* Info extra */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"18px 20px",
          animation:"up-cardIn .4s ease .35s both"}}>
          <div style={{...px(6),color:C.muted,marginBottom:12,letterSpacing:".05em"}}>📊 DATOS GENERALES</div>
          {[
            {icon:"🏅",label:"Logros obtenidos",  value:stats.logrosObtenidos},
            {icon:"🎯",label:"Misiones completadas",value:stats.misionesCompletadas},
            {icon:"💪",label:"Ejercicio favorito", value:stats.ejercicioFav},
            {icon:"📋",label:"Categoría favorita", value:stats.categFav},
            {icon:"📅",label:"Días activo",         value:`${stats.diasActivo} días`},
            {icon:"📅",label:"Miembro desde",       value:stats.createdAt},
          ].map((s,i)=>(
            <div key={i} className="up-stat-row" style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"8px 0",borderBottom:`1px solid ${C.navy}22`}}>
              <span style={{...raj(12,500),color:C.muted}}>{s.icon} {s.label}</span>
              <span style={{...raj(12,700),color:C.white}}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"18px 20px",
        animation:"up-cardIn .4s ease .4s both"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{...px(6),color:C.muted,letterSpacing:".05em"}}>🏅 MIS BADGES</div>
          <span style={{...raj(11,600),color:C.muted}}>{badges.filter(b=>b.obtenido).length}/{badges.length}</span>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {badges.map((b,i)=>{
            const r=RAREZA_COLOR[b.rareza]||C.muted;
            return (
              <div key={b.id} className="up-badge" title={b.nombre}
                style={{width:54,height:54,borderRadius:"50%",
                  background:`${r}${b.obtenido?"18":"08"}`,
                  border:`2px solid ${r}${b.obtenido?"55":"22"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:24,
                  boxShadow:b.obtenido?`0 0 12px ${r}33`:"none",
                  filter:b.obtenido?`drop-shadow(0 0 6px ${r}66)`:"grayscale(.9) opacity(.4)",
                  animation:b.obtenido?`up-cardIn .4s ease ${i*.05}s both`:"none"}}>
                {b.imagen}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: EDITAR PERFIL
// ══════════════════════════════════════════════════════════════
function TabEditar({stats, onSaved}) {
  const cls = CLS[stats.heroClass]||CLS.GUERRERO;
  const [form, setForm] = useState({
    username:  stats.username,
    heroName:  stats.heroName||"",
    bio:       stats.bio||"",
    heroClass: stats.heroClass,
  });
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [errors,   setErrors]   = useState({});
  const [shake,    setShake]    = useState(false);
  const [confirmClass, setConfirmClass] = useState(false);
  const [pendingClass, setPendingClass] = useState(null);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const validate=()=>{
    const e={};
    if(!form.username.trim())    e.username="El nombre de héroe es requerido";
    if(form.username.length<3)   e.username="Mínimo 3 caracteres";
    if(form.bio.length>120)      e.bio="Máximo 120 caracteres";
    return e;
  };

  const save=async()=>{
    const e=validate();
    if(Object.keys(e).length){setErrors(e);setShake(true);setTimeout(()=>setShake(false),500);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,900)); // ← updateProfile(token, form)
    setLoading(false);
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
    onSaved?.(form);
  };

  const requestClassChange=(cls)=>{
    setPendingClass(cls);
    setConfirmClass(true);
  };

  const confirmClassChange=()=>{
    set("heroClass",pendingClass);
    setConfirmClass(false);
    setPendingClass(null);
  };

  const lbl={display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"};
  const bc=CLS[form.heroClass]?.color||C.orange;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}} className={shake?"up-shake":""}>

      {/* Nombre de héroe */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"20px 22px",animation:"up-cardIn .4s ease both"}}>
        <div style={{...px(7),color:C.muted,marginBottom:16,letterSpacing:".05em"}}>👤 INFORMACIÓN PÚBLICA</div>
        <CInput label="NOMBRE DE HÉROE" value={form.username} onChange={v=>set("username",v)}
          placeholder="Ej: WarriorX" error={errors.username}/>
        <CInput label="NOMBRE ESPECIAL (TÍTULO)" value={form.heroName} onChange={v=>set("heroName",v)}
          placeholder="Ej: El Guardián del Norte"/>
        <div>
          <label style={lbl}>📝 BIO ({form.bio.length}/120)</label>
          <textarea className="up-input" value={form.bio} onChange={e=>set("bio",e.target.value)}
            maxLength={120} rows={3} placeholder="Cuéntanos algo sobre tu aventura..."
            style={{width:"100%",padding:"11px 14px",background:C.panel,border:`1px solid ${errors.bio?C.red:C.navy}`,
              color:C.white,...raj(13,500),resize:"vertical"}}/>
          {errors.bio&&<div style={{...raj(11),color:C.red,marginTop:5}}>⚠ {errors.bio}</div>}
        </div>
      </div>

      {/* Cambio de clase */}
      <div style={{background:C.card,border:`1px solid ${bc}33`,padding:"20px 22px",animation:"up-cardIn .4s ease .1s both"}}>
        <div style={{...px(7),color:C.muted,marginBottom:6,letterSpacing:".05em"}}>🎭 CLASE DE HÉROE</div>
        <div style={{...raj(12,400),color:C.muted,marginBottom:14,lineHeight:1.5}}>
          Tu clase define tu bonus de XP. El cambio puede requerir confirmación del admin.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {Object.entries(CLS).map(([key,m])=>{
            const on=form.heroClass===key;
            return (
              <button key={key} type="button" onClick={()=>on?null:requestClassChange(key)}
                className="up-cls-btn"
                style={{background:on?m.bg:"transparent",border:`2px solid ${on?m.color:C.navy}`,
                  padding:"14px 10px",cursor:on?"default":"pointer",textAlign:"center",
                  boxShadow:on?`0 0 18px ${m.color}33`:"none",transition:"all .25s"}}>
                <div style={{fontSize:26,marginBottom:6,filter:on?`drop-shadow(0 0 8px ${m.color})`:"none",
                  animation:on?"up-float 3s ease-in-out infinite":"none"}}>{m.icon}</div>
                <div style={{...px(7),color:on?m.color:C.muted,marginBottom:4}}>{key}</div>
                <div style={{...raj(9,400),color:C.muted,lineHeight:1.4,marginBottom:6}}>{m.desc}</div>
                <div style={{...raj(10,700),color:on?m.color:C.muted,background:on?`${m.color}18`:"transparent",
                  border:`1px solid ${on?m.color:C.navy}`,padding:"2px 8px",display:"inline-block"}}>
                  {m.bonus}
                </div>
                {on&&<div style={{...raj(9,700),color:m.color,marginTop:6}}>● ACTIVA</div>}
              </button>
            );
          })}
        </div>

        {/* confirm class change */}
        {confirmClass&&(
          <div style={{marginTop:14,background:`${C.orange}0A`,border:`1px solid ${C.orange}33`,padding:"14px 16px"}}>
            <div style={{...raj(13,700),color:C.orange,marginBottom:6}}>
              ⚠ ¿Cambiar a clase {pendingClass}?
            </div>
            <div style={{...raj(12,400),color:C.muted,marginBottom:12,lineHeight:1.5}}>
              Esta acción cambiará tu bonus de XP. El historial de sesiones no se verá afectado.
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmClass(false)} className="up-btn"
                style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"9px 16px",cursor:"pointer"}}>
                Cancelar
              </button>
              <button onClick={confirmClassChange} className="up-btn"
                style={{...raj(12,700),color:C.bg,background:C.orange,border:"none",padding:"9px 20px",cursor:"pointer",boxShadow:`0 3px 12px ${C.orange}44`}}>
                Confirmar cambio
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save row */}
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12}}>
        <SavedFlash show={saved}/>
        <button onClick={save} disabled={loading} className="up-btn"
          style={{...px(8),color:loading?C.muted:C.bg,background:loading?`${C.orange}44`:C.orange,
            border:"none",padding:"12px 24px",cursor:loading?"not-allowed":"pointer",
            boxShadow:loading?"none":`0 4px 20px ${C.orange}44`,
            display:"flex",alignItems:"center",gap:10}}>
          {loading?<><Spinner/> GUARDANDO...</>:<><Save size={14}/> GUARDAR PERFIL</>}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: SEGURIDAD
// ══════════════════════════════════════════════════════════════
function TabSeguridad({stats}) {
  const [pwForm,   setPwForm]   = useState({actual:"",nueva:"",confirmar:""});
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading,setPwLoading]= useState(false);
  const [pwSaved,  setPwSaved]  = useState(false);
  const [pwShake,  setPwShake]  = useState(false);
  const [showDanger,setShowDanger]=useState(false);
  const [deleteTyped,setDeleteTyped]=useState("");

  const setPw=(k,v)=>setPwForm(f=>({...f,[k]:v}));

  const validatePw=()=>{
    const e={};
    if(!pwForm.actual)            e.actual="Requerida";
    if(!pwForm.nueva||pwForm.nueva.length<6) e.nueva="Mínimo 6 caracteres";
    if(pwForm.nueva!==pwForm.confirmar) e.confirmar="Las contraseñas no coinciden";
    return e;
  };

  const savePw=async()=>{
    const e=validatePw();
    if(Object.keys(e).length){setPwErrors(e);setPwShake(true);setTimeout(()=>setPwShake(false),500);return;}
    setPwLoading(true);
    await new Promise(r=>setTimeout(r,900)); // ← updatePassword(token, pwForm)
    setPwLoading(false);
    setPwSaved(true);
    setPwForm({actual:"",nueva:"",confirmar:""});
    setTimeout(()=>setPwSaved(false),2500);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Info de cuenta */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"20px 22px",animation:"up-cardIn .4s ease both"}}>
        <div style={{...px(7),color:C.muted,marginBottom:14,letterSpacing:".05em"}}>🔒 INFORMACIÓN DE CUENTA</div>
        {[
          {label:"Email",       value:stats.email,       icon:"📧"},
          {label:"Miembro desde",value:stats.createdAt,  icon:"📅"},
          {label:"Rol",         value:"Usuario",          icon:"🛡️"},
        ].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"12px 0",borderBottom:`1px solid ${C.navy}22`}}>
            <div style={{...raj(13,500),color:C.muted}}>{f.icon} {f.label}</div>
            <div style={{...raj(13,700),color:C.white}}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* Cambiar contraseña */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"20px 22px",
        animation:"up-cardIn .4s ease .1s both"}} className={pwShake?"up-shake":""}>
        <div style={{...px(7),color:C.muted,marginBottom:14,letterSpacing:".05em"}}>🔑 CAMBIAR CONTRASEÑA</div>
        <CInput label="CONTRASEÑA ACTUAL" type="password" value={pwForm.actual}
          onChange={v=>setPw("actual",v)} placeholder="••••••••" error={pwErrors.actual}/>
        <CInput label="NUEVA CONTRASEÑA" type="password" value={pwForm.nueva}
          onChange={v=>setPw("nueva",v)} placeholder="Mínimo 6 caracteres" error={pwErrors.nueva}/>
        <CInput label="CONFIRMAR CONTRASEÑA" type="password" value={pwForm.confirmar}
          onChange={v=>setPw("confirmar",v)} placeholder="Repite la nueva contraseña" error={pwErrors.confirmar}/>

        {/* fortaleza */}
        {pwForm.nueva.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{...raj(11,600),color:C.muted,marginBottom:6}}>Fortaleza de contraseña:</div>
            <div style={{display:"flex",gap:4}}>
              {[
                {min:1,  label:"Débil",     color:C.red},
                {min:6,  label:"Regular",   color:C.orange},
                {min:8,  label:"Buena",     color:C.gold},
                {min:10, label:"Fuerte",    color:C.green},
              ].map((s,i)=>{
                const active=pwForm.nueva.length>=s.min;
                return (
                  <div key={i} style={{flex:1,height:5,background:active?s.color:`${C.navy}55`,
                    transition:"background .3s",boxShadow:active?`0 0 4px ${s.color}66`:"none"}}/>
                );
              })}
            </div>
            <div style={{...raj(10,500),color:C.muted,marginTop:4}}>
              {pwForm.nueva.length<6?"Débil":pwForm.nueva.length<8?"Regular":pwForm.nueva.length<10?"Buena":"Fuerte"}
            </div>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12,marginTop:4}}>
          <SavedFlash show={pwSaved}/>
          <button onClick={savePw} disabled={pwLoading} className="up-btn"
            style={{...px(8),color:pwLoading?C.muted:C.bg,
              background:pwLoading?`${C.blue}44`:C.blue,
              border:"none",padding:"12px 22px",cursor:pwLoading?"not-allowed":"pointer",
              boxShadow:pwLoading?"none":`0 4px 20px ${C.blue}44`,
              display:"flex",alignItems:"center",gap:10}}>
            {pwLoading?<><Spinner color={C.blue}/> GUARDANDO...</>:<><Lock size={14}/> CAMBIAR CONTRASEÑA</>}
          </button>
        </div>
      </div>

      {/* Sesiones activas (info) */}
      <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"20px 22px",animation:"up-cardIn .4s ease .2s both"}}>
        <div style={{...px(7),color:C.muted,marginBottom:14,letterSpacing:".05em"}}>🖥️ SESIONES ACTIVAS</div>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",
          background:C.panel,border:`1px solid ${C.navy}`}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,animation:"up-pulse 1.5s infinite",flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{...raj(13,700),color:C.white}}>Este dispositivo · Chrome / Windows</div>
            <div style={{...raj(11,500),color:C.muted}}>Sesión actual · Activo ahora</div>
          </div>
        </div>
      </div>

      {/* Zona peligro */}
      <div style={{background:C.card,border:`1px solid ${C.red}33`,padding:"20px 22px",animation:"up-cardIn .4s ease .3s both"}}>
        <div style={{...px(7),color:C.red,marginBottom:6,letterSpacing:".05em"}}>⚠️ ZONA DE PELIGRO</div>
        <div style={{...raj(12,400),color:C.muted,marginBottom:14,lineHeight:1.5}}>
          Estas acciones son permanentes. Procede con mucho cuidado.
        </div>
        {!showDanger?(
          <button onClick={()=>setShowDanger(true)} className="up-danger-btn"
            style={{...raj(13,600),color:C.red,background:`${C.red}0A`,border:`1px solid ${C.red}33`,
              padding:"10px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <AlertTriangle size={14}/> Eliminar mi cuenta
          </button>
        ):(
          <div style={{background:`${C.red}08`,border:`1px solid ${C.red}33`,padding:"16px"}}>
            <div style={{...raj(13,700),color:C.red,marginBottom:8}}>⚠ Esta acción eliminará tu cuenta permanentemente</div>
            <div style={{...raj(12,400),color:C.muted,marginBottom:12,lineHeight:1.5}}>
              Se borrarán todos tus datos, XP, logros y progreso. Escribe tu nombre de héroe para confirmar.
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"}}>
                ESCRIBE <span style={{color:C.red}}>{stats.username}</span> PARA CONFIRMAR
              </label>
              <input className="up-input" value={deleteTyped} onChange={e=>setDeleteTyped(e.target.value)}
                placeholder={stats.username}
                style={{width:"100%",padding:"11px 14px",background:C.panel,
                  border:`1px solid ${deleteTyped===stats.username?C.red:C.navy}`,
                  color:C.white,...raj(14,600)}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setShowDanger(false);setDeleteTyped("");}} className="up-btn"
                style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"9px 16px",cursor:"pointer"}}>
                Cancelar
              </button>
              <button disabled={deleteTyped!==stats.username} className="up-btn"
                style={{...raj(12,700),color:deleteTyped===stats.username?C.white:C.muted,
                  background:deleteTyped===stats.username?C.red:`${C.red}22`,
                  border:`1px solid ${C.red}44`,padding:"9px 18px",
                  cursor:deleteTyped===stats.username?"pointer":"not-allowed",
                  display:"flex",alignItems:"center",gap:6}}>
                <AlertTriangle size={12}/> Eliminar definitivamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function UserPerfil({profile, onLogout}) {
  const stats  = { ...MOCK_STATS, ...profile };
  const cls    = CLS[stats.heroClass]||CLS.GUERRERO;
  const [tab,  setTab]  = useState("resumen");
  const [localStats, setLocalStats] = useState(stats);

  const tabs = [
    {id:"resumen",  icon:<BarChart2 size={14}/>, label:"Resumen"    },
    {id:"editar",   icon:<Edit2 size={14}/>,     label:"Editar"     },
    {id:"seguridad",icon:<Lock size={14}/>,      label:"Seguridad"  },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* ── Hero card ── */}
        <div style={{background:C.card,border:`1px solid ${cls.color}33`,
          overflow:"hidden",position:"relative",animation:"up-cardIn .4s ease both"}}>
          <div style={{height:4,background:`linear-gradient(90deg,transparent,${cls.color},transparent)`}}/>
          <div style={{position:"absolute",top:-60,right:-60,width:280,height:280,
            borderRadius:"50%",background:cls.color,filter:"blur(80px)",opacity:.06,pointerEvents:"none"}}/>
          {/* scan line */}
          <div style={{position:"absolute",left:0,right:0,height:1,pointerEvents:"none",
            background:`linear-gradient(90deg,transparent,${cls.color}33,transparent)`,
            animation:"up-shine 6s linear infinite"}}/>

          <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:24,
            padding:"28px 32px",alignItems:"center",position:"relative",zIndex:1}}>
            {/* Avatar */}
            <HeroAvatar heroClass={localStats.heroClass||stats.heroClass} size={90} animated/>

            {/* Info */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                <div style={{background:`${cls.color}18`,border:`1px solid ${cls.color}44`,
                  padding:"4px 12px",...raj(11,700),color:cls.color}}>
                  {cls.icon} {localStats.heroClass||stats.heroClass}
                </div>
                <div style={{background:`${C.gold}14`,border:`1px solid ${C.gold}44`,
                  padding:"4px 12px",...raj(11,700),color:C.gold}}>
                  ⭐ NIVEL {localStats.nivel||stats.nivel}
                </div>
                {(localStats.streak||stats.streak)>0&&(
                  <div style={{background:`${C.red}14`,border:`1px solid ${C.red}44`,
                    padding:"4px 12px",...raj(11,700),color:C.orangeL}}>
                    🔥 {localStats.streak||stats.streak} días de racha
                  </div>
                )}
              </div>
              <div style={{...orb("clamp(18px,2vw,26px)",900),color:C.white,marginBottom:3,
                animation:"up-glow 4s ease-in-out infinite"}}>
                {(localStats.username||stats.username||"HÉROE").toUpperCase()}
              </div>
              {(localStats.heroName||stats.heroName)&&(
                <div style={{...raj(13,600),color:cls.color,marginBottom:4}}>
                  "{localStats.heroName||stats.heroName}"
                </div>
              )}
              {(localStats.bio||stats.bio)&&(
                <div style={{...raj(12,400),color:C.muted,lineHeight:1.5,maxWidth:420}}>
                  {localStats.bio||stats.bio}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:140}}>
              {[
                {label:"XP TOTAL",  value:(localStats.xpTotal||stats.xpTotal).toLocaleString(),color:C.gold  },
                {label:"SESIONES",  value:localStats.sesionesTotales||stats.sesionesTotales,   color:C.orange},
                {label:"MONEDAS",   value:(localStats.coins||stats.coins).toLocaleString(),    color:C.gold  },
              ].map((s,i)=>(
                <div key={i} style={{background:C.panel,border:`1px solid ${s.color}22`,
                  padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{...raj(11,600),color:C.muted}}>{s.label}</span>
                  <span style={{...raj(13,900),color:s.color}}>{s.value}</span>
                </div>
              ))}
              <button onClick={onLogout} className="up-btn"
                style={{display:"flex",alignItems:"center",gap:8,...raj(12,600),
                  color:C.muted,background:"transparent",border:`1px solid ${C.navy}`,
                  padding:"9px 14px",cursor:"pointer",marginTop:4,transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor=`${C.red}44`;}}
                onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.navy;}}>
                <LogOut size={13}/> Cerrar sesión
              </button>
            </div>
          </div>

          {/* HP/XP bars */}
          <div style={{padding:"0 32px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,position:"relative",zIndex:1}}>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{...px(5),color:C.muted,letterSpacing:".04em"}}>HP</span>
                <span style={{...raj(11,700),color:C.green}}>{localStats.hp||stats.hp}%</span>
              </div>
              <MiniBar val={localStats.hp||stats.hp} max={100} color={C.green} height={7}/>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{...px(5),color:C.muted,letterSpacing:".04em"}}>XP · Lv {localStats.nivel||stats.nivel}</span>
                <span style={{...raj(11,700),color:C.gold}}>{localStats.xp||stats.xp} / {localStats.xpNext||stats.xpNext}</span>
              </div>
              <MiniBar val={localStats.xp||stats.xp} max={localStats.xpNext||stats.xpNext} color={C.gold} height={7}/>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{display:"flex",background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          {tabs.map(t=>{
            const on=tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} className="up-tab"
                style={{flex:1,padding:"13px",background:on?`${cls.color}12`:"transparent",
                  border:"none",borderBottom:`3px solid ${on?cls.color:"transparent"}`,
                  color:on?cls.color:C.muted,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  ...raj(13,on?700:500)}}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Contenido del tab ── */}
        {tab==="resumen"  &&<TabResumen   stats={localStats} badges={MOCK_BADGES}/>}
        {tab==="editar"   &&<TabEditar    stats={localStats} onSaved={f=>setLocalStats(s=>({...s,...f}))}/>}
        {tab==="seguridad"&&<TabSeguridad stats={localStats}/>}
      </div>
    </>
  );
}