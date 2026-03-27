// src/pages/user/UserMisiones.jsx
// ─────────────────────────────────────────────────────────────
//  Página de misiones del jugador.
//  Tipos: Diaria | Semanal | Evento | Desafío
//  Props: profile (objeto del usuario)
//  Conectar: getMisiones(), completarMision()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  Target, Check, Lock, Clock, Zap, Star,
  Flame, Trophy, Gift, ChevronRight, X,
  Calendar, Award, TrendingUp, RotateCcw,
  Shield, Sparkles,
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
  @keyframes um-fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes um-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes um-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes um-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes um-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes um-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes um-xpPop   { 0%{opacity:0;transform:translateY(0) scale(.6)} 50%{opacity:1;transform:translateY(-50px) scale(1.2)} 100%{opacity:0;transform:translateY(-100px) scale(1)} }
  @keyframes um-done    { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes um-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes um-shine   { 0%{left:-100%} 100%{left:200%} }
  @keyframes um-glow    { 0%,100%{box-shadow:0 0 10px var(--gc)} 50%{box-shadow:0 0 28px var(--gc),0 0 48px var(--gc)} }
  @keyframes um-countdown { 0%{stroke-dashoffset:0} }
  @keyframes um-tick    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes um-reward  { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }

  .um-card  { transition:all .22s; }
  .um-card:hover  { transform:translateY(-3px) !important; box-shadow:0 14px 40px rgba(0,0,0,.5) !important; }
  .um-mission { transition:all .18s; cursor:pointer; }
  .um-mission:hover { background:${C.navyL}22 !important; }
  .um-btn   { transition:all .2s; cursor:pointer; }
  .um-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .um-tab   { transition:all .2s; cursor:pointer; }
  .um-tab:hover { opacity:.85; }
  .um-claim { transition:all .2s; cursor:pointer; }
  .um-claim:hover { transform:scale(1.04) !important; box-shadow:0 8px 30px var(--cs) !important; }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Tipos de misión ────────────────────────────────────────────
const TIPOS = {
  Diaria:  { color:C.orange, icon:"☀️",  label:"DIARIA",  resets:"Reinicia a las 00:00"  },
  Semanal: { color:C.blue,   icon:"📅",  label:"SEMANAL", resets:"Reinicia el lunes"     },
  Evento:  { color:C.purple, icon:"🎉",  label:"EVENTO",  resets:"Tiempo limitado"       },
  Desafío: { color:C.gold,   icon:"🏆",  label:"DESAFÍO", resets:"Permanente"            },
};

// ── Timer helpers ──────────────────────────────────────────────
function secsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24,0,0,0);
  return Math.floor((midnight - now) / 1000);
}
function secsUntilMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=dom,1=lun...
  const daysUntil = day === 1 ? 7 : (8 - day) % 7;
  return daysUntil * 86400 - (now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds());
}
function fmtCountdown(s) {
  if (s >= 86400) return `${Math.floor(s/86400)}d ${Math.floor((s%86400)/3600)}h`;
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  return h>0 ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
             : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

// ── Mock misiones ──────────────────────────────────────────────
const MOCK_MISIONES = [
  // Diarias
  { id:"d1", tipo:"Diaria", titulo:"Guerrero del Día",    imagen:"⚔️",  xpRecompensa:150, estado:"completada",  progreso:1, total:1,
    descripcion:"Completa tu rutina de fuerza del día.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"150 XP"}],
    reclamada:false },
  { id:"d2", tipo:"Diaria", titulo:"Cardio Activo",       imagen:"🏃",  xpRecompensa:120, estado:"en_progreso", progreso:0, total:1,
    descripcion:"Completa 30 minutos de cardio hoy.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"120 XP"}],
    reclamada:false },
  { id:"d3", tipo:"Diaria", titulo:"Primer Paso",         imagen:"🌟",  xpRecompensa:80,  estado:"en_progreso", progreso:0, total:1,
    descripcion:"Completa al menos 1 sesión de ejercicio hoy.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"80 XP"}],
    reclamada:false },

  // Semanales
  { id:"s1", tipo:"Semanal", titulo:"Semana de Hierro",   imagen:"🔥",  xpRecompensa:400, estado:"en_progreso", progreso:3, total:7,
    descripcion:"Mantén una racha de 7 días seguidos de entrenamiento.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"400 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Guerrero Semanal"}],
    reclamada:false },
  { id:"s2", tipo:"Semanal", titulo:"Cardio Semanal",     imagen:"💨",  xpRecompensa:350, estado:"en_progreso", progreso:2, total:3,
    descripcion:"Completa 3 sesiones de cardio esta semana.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"350 XP"}],
    reclamada:false },
  { id:"s3", tipo:"Semanal", titulo:"Flex Master",        imagen:"🧘",  xpRecompensa:300, estado:"completada",  progreso:4, total:4,
    descripcion:"Completa 4 sesiones de flexibilidad o yoga esta semana.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"300 XP"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Alma Zen"}],
    reclamada:false },

  // Desafíos
  { id:"ch1", tipo:"Desafío", titulo:"Maestro del Fuego", imagen:"🔥",  xpRecompensa:2000, estado:"en_progreso", progreso:14, total:30,
    descripcion:"Mantén una racha de 30 días consecutivos de entrenamiento.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"2000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Llama Eterna"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Corona del Campeón"}],
    reclamada:false },
  { id:"ch2", tipo:"Desafío", titulo:"Centenario",        imagen:"💯",  xpRecompensa:800,  estado:"en_progreso", progreso:8, total:100,
    descripcion:"Completa 100 sesiones de ejercicio en total.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"800 XP"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Escudo Centenario"}],
    reclamada:false },
  { id:"ch3", tipo:"Desafío", titulo:"Leyenda del Nivel", imagen:"⭐",  xpRecompensa:5000, estado:"en_progreso", progreso:12, total:50,
    descripcion:"Alcanza el nivel 50 con tu personaje.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"5000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Leyenda Viviente"}],
    reclamada:false },

  // Evento
  { id:"ev1", tipo:"Evento", titulo:"Festival de Primavera", imagen:"🌸", xpRecompensa:800, estado:"en_progreso", progreso:3, total:10,
    descripcion:"Evento especial: completa 10 sesiones antes del 31 de marzo.",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"800 XP"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Armadura de Primavera"}],
    reclamada:false, fechaFin:"2025-03-31" },
];

// ── MiniBar ────────────────────────────────────────────────────
function MiniBar({val,max,color,height=6}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%",position:"relative"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,
        boxShadow:`0 0 6px ${color}66`,position:"relative",transition:"width .8s ease"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",
          animation:"um-shine 2s ease .5s 1"}}/>
      </div>
    </div>
  );
}

// ── Estado badge ───────────────────────────────────────────────
function EstadoBadge({estado,reclamada}) {
  if(reclamada) return <span style={{...raj(9,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4}}><Check size={9}/> RECLAMADA</span>;
  if(estado==="completada") return <span style={{...raj(9,700),color:C.gold,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,padding:"2px 8px",animation:"um-tick 2s ease-in-out infinite"}}>⚡ LISTA</span>;
  return null;
}

// ── Countdown live ─────────────────────────────────────────────
function CountdownTag({tipo,fechaFin}) {
  const [secs, setSecs] = useState(
    tipo==="Diaria" ? secsUntilMidnight() :
    tipo==="Semanal"? secsUntilMonday()   :
    tipo==="Evento" && fechaFin ? Math.max(0,Math.floor((new Date(fechaFin)-new Date())/1000)) : null
  );
  useEffect(()=>{
    if(secs===null) return;
    const t=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);
    return()=>clearInterval(t);
  },[]);
  if(secs===null||tipo==="Desafío") return null;
  const urgent=secs<3600;
  return (
    <span style={{...raj(10,700),color:urgent?C.red:C.muted,
      background:urgent?`${C.red}14`:"transparent",
      border:`1px solid ${urgent?C.red:C.navy}`,padding:"2px 8px",
      display:"inline-flex",alignItems:"center",gap:4,
      animation:urgent?"um-pulse 1.2s infinite":undefined}}>
      <Clock size={9}/> {fmtCountdown(secs)}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Detalle de misión
// ══════════════════════════════════════════════════════════════
function DetalleModal({mision, onClose, onReclamar}) {
  const tm  = TIPOS[mision.tipo]||{};
  const c   = tm.color||C.orange;
  const pct = Math.round((mision.progreso/mision.total)*100);
  const lista = mision.estado==="completada"&&!mision.reclamada;

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.82)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:520,background:C.card,
        border:`2px solid ${c}44`,
        boxShadow:`0 0 60px ${c}18,0 24px 60px rgba(0,0,0,.6)`,
        animation:"um-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,background:`${c}18`,border:`2px solid ${c}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
              animation:"um-float 2.5s ease-in-out infinite"}}>
              {mision.imagen}
            </div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:5}}>{mision.titulo}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 8px"}}>
                  {tm.icon} {mision.tipo}
                </span>
                <CountdownTag tipo={mision.tipo} fechaFin={mision.fechaFin}/>
                <EstadoBadge estado={mision.estado} reclamada={mision.reclamada}/>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="um-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16}}>
          {/* stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {l:"XP RECOMP.",v:`+${mision.xpRecompensa}`,c:C.gold},
              {l:"PROGRESO",  v:`${mision.progreso}/${mision.total}`,c},
              {l:"ESTADO",    v:mision.reclamada?"RECLAMADA":mision.estado==="completada"?"LISTA":"EN PROGRESO",
               c:mision.reclamada?C.green:mision.estado==="completada"?C.gold:C.muted},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(14,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* barra de progreso */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{...raj(12,600),color:C.muted}}>Progreso</span>
              <span style={{...raj(12,700),color:c}}>{pct}%</span>
            </div>
            <MiniBar val={mision.progreso} max={mision.total} color={c} height={10}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{...raj(10,500),color:C.muted}}>0</span>
              <span style={{...raj(10,700),color:c}}>{mision.progreso} / {mision.total}</span>
              <span style={{...raj(10,500),color:C.muted}}>{mision.total}</span>
            </div>
          </div>

          {/* descripcion */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <div style={{...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em"}}>📋 OBJETIVO</div>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7}}>{mision.descripcion}</p>
            {mision.fechaFin&&(
              <div style={{...raj(11,600),color:C.muted,marginTop:8}}>📅 Disponible hasta: <span style={{color:c}}>{mision.fechaFin}</span></div>
            )}
            <div style={{...raj(11,500),color:C.muted,marginTop:4}}>{TIPOS[mision.tipo]?.resets}</div>
          </div>

          {/* recompensas */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>🎁 RECOMPENSAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {mision.recompensas.map((r,i)=>(
                <div key={i} style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,
                  padding:"10px 14px",display:"flex",alignItems:"center",gap:8,
                  animation:"um-glow 3s ease-in-out infinite","--gc":`${C.gold}44`}}>
                  <span style={{fontSize:20}}>{r.icon}</span>
                  <div>
                    <div style={{...raj(12,700),color:C.gold}}>{r.label}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{r.valor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {lista&&!mision.reclamada?(
            <button onClick={()=>onReclamar(mision)} className="um-btn"
              style={{width:"100%",...px(9),color:C.bg,background:c,border:"none",
                padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                boxShadow:`0 6px 28px ${c}55`}}>
              <Gift size={14}/> RECLAMAR RECOMPENSA
            </button>
          ):mision.reclamada?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              background:`${C.green}0A`,border:`1px solid ${C.green}33`,padding:"14px",...raj(13,700),color:C.green}}>
              <Check size={15}/> RECOMPENSA RECLAMADA
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${c}0A`,
              border:`1px solid ${c}22`,padding:"14px 16px",...raj(13,500),color:C.mutedL}}>
              <TrendingUp size={15} color={c}/>
              Sigue entrenando para completar esta misión.
              <span style={{marginLeft:"auto",...raj(13,700),color:c}}>{pct}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Reclamar recompensa (celebración)
// ══════════════════════════════════════════════════════════════
function ReclamarModal({mision, onClose}) {
  const tm = TIPOS[mision.tipo]||{};
  const c  = tm.color||C.orange;
  const [phase, setPhase] = useState("anim"); // anim | done
  useEffect(()=>{setTimeout(()=>setPhase("done"),1200);},[]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.9)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:440,background:C.card,
        border:`2px solid ${c}55`,
        boxShadow:`0 0 80px ${c}22,0 24px 60px rgba(0,0,0,.7)`,
        animation:"um-modalIn .25s ease both",overflow:"hidden",textAlign:"center",padding:"36px 28px"}}>
        <div style={{fontSize:72,marginBottom:16,
          animation:phase==="anim"?"um-done .6s ease both":"um-float 2.5s ease-in-out infinite",
          filter:`drop-shadow(0 0 24px ${C.gold})`}}>🎉</div>
        <div style={{...orb(18,900),color:C.white,marginBottom:6,animation:"um-fadeIn .5s ease .2s both"}}>
          ¡MISIÓN COMPLETADA!
        </div>
        <div style={{...raj(13,500),color:C.muted,marginBottom:24,animation:"um-fadeIn .5s ease .3s both"}}>
          {mision.titulo}
        </div>

        {/* recompensas animadas */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {mision.recompensas.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,
              background:`${C.gold}0A`,border:`1px solid ${C.gold}44`,
              padding:"14px 18px",
              animation:`um-reward .4s ease ${.4+i*.15}s both`}}>
              <span style={{fontSize:26,filter:`drop-shadow(0 0 8px ${C.gold})`}}>{r.icon}</span>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{...raj(13,700),color:C.gold}}>{r.label}</div>
                <div style={{...raj(12,500),color:C.mutedL}}>{r.valor}</div>
              </div>
              <div style={{...orb(20,900),color:C.gold,textShadow:`0 0 12px ${C.gold}`}}>
                {r.tipo==="xp"?r.valor.replace(" XP",""):""}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="um-btn"
          style={{width:"100%",...px(8),color:C.bg,background:c,border:"none",
            padding:"15px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            boxShadow:`0 6px 28px ${c}55`,animation:"um-fadeIn .5s ease .8s both"}}>
          <Check size={14}/> ¡GENIAL!
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function UserMisiones({profile}) {
  const [misiones,    setMisiones]    = useState(MOCK_MISIONES);
  const [tab,         setTab]         = useState("Diaria");
  const [detalleMis,  setDetalleMis]  = useState(null);
  const [reclamarMis, setReclamarMis] = useState(null);
  const [xpNotif,     setXpNotif]     = useState(null);

  const clsColor = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
  const myColor  = clsColor[profile?.heroClass]||C.orange;

  const handleReclamar = (mision) => {
    setDetalleMis(null);
    setMisiones(prev => prev.map(m => m.id===mision.id ? {...m, reclamada:true} : m));
    setReclamarMis(mision);
    setXpNotif(mision.xpRecompensa);
    setTimeout(()=>setXpNotif(null),2500);
  };

  const filtradas = misiones.filter(m => m.tipo===tab);

  // Contadores globales
  const totalListas    = misiones.filter(m=>m.estado==="completada"&&!m.reclamada).length;
  const totalActivas   = misiones.filter(m=>m.estado==="en_progreso").length;
  const totalReclamadas= misiones.filter(m=>m.reclamada).length;
  const xpDisponible   = misiones.filter(m=>m.estado==="completada"&&!m.reclamada).reduce((s,m)=>s+m.xpRecompensa,0);

  return (
    <>
      <style>{CSS}</style>

      {detalleMis&&<DetalleModal mision={detalleMis} onClose={()=>setDetalleMis(null)} onReclamar={handleReclamar}/>}
      {reclamarMis&&<ReclamarModal mision={reclamarMis} onClose={()=>setReclamarMis(null)}/>}

      {xpNotif&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          zIndex:500,pointerEvents:"none",...orb(32,900),color:C.gold,
          textShadow:`0 0 30px ${C.gold}`,animation:"um-xpPop 2.2s ease forwards"}}>
          +{xpNotif} XP ⚡
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* ── KPI Banner ── */}
        <div style={{background:C.card,border:`1px solid ${myColor}33`,
          padding:"20px 24px",position:"relative",overflow:"hidden",
          animation:"um-cardIn .4s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg,transparent,${myColor},transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div style={{fontSize:36,animation:"um-float 2.5s ease-in-out infinite",
              filter:`drop-shadow(0 0 12px ${myColor})`}}>🎯</div>
            <div>
              <div style={{...orb(13,700),color:C.white,marginBottom:3}}>MISIONES</div>
              <div style={{...raj(12,500),color:C.muted}}>Completa misiones para ganar XP y recompensas</div>
            </div>
            <div style={{display:"flex",gap:20,marginLeft:"auto",flexWrap:"wrap"}}>
              {[
                {l:"Listas para reclamar",v:totalListas,      c:C.gold,  icon:"⚡"},
                {l:"En progreso",         v:totalActivas,      c:myColor, icon:"⏳"},
                {l:"Reclamadas",          v:totalReclamadas,   c:C.green, icon:"✓"},
                {l:"XP disponible",       v:`+${xpDisponible}`,c:C.gold,  icon:"💰"},
              ].map((s,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{...orb(18,900),color:s.c}}>{s.v}</div>
                  <div style={{...px(5),color:C.muted}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── XP Disponible Reclamar All ── */}
        {totalListas>0&&(
          <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}44`,
            padding:"14px 20px",display:"flex",alignItems:"center",gap:14,
            animation:"um-fadeIn .4s ease .05s both"}}>
            <span style={{fontSize:24,animation:"um-tick 1.5s ease-in-out infinite"}}>⚡</span>
            <div style={{flex:1}}>
              <div style={{...raj(14,700),color:C.gold}}>{totalListas} misión{totalListas!==1?"es":""} lista{totalListas!==1?"s":""} para reclamar</div>
              <div style={{...raj(12,500),color:C.muted}}>Tienes +{xpDisponible} XP esperándote</div>
            </div>
            <div style={{...raj(12,600),color:C.mutedL,textAlign:"right"}}>
              Abre cada misión<br/>y reclama tu XP
            </div>
          </div>
        )}

        {/* ── Tabs de tipo ── */}
        <div style={{display:"flex",background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          {Object.entries(TIPOS).map(([tipo,tm])=>{
            const on=tab===tipo;
            const count=misiones.filter(m=>m.tipo===tipo).length;
            const listas=misiones.filter(m=>m.tipo===tipo&&m.estado==="completada"&&!m.reclamada).length;
            return (
              <button key={tipo} onClick={()=>setTab(tipo)} className="um-tab"
                style={{flex:1,padding:"14px 8px",background:on?`${tm.color}12`:"transparent",
                  border:"none",borderBottom:`3px solid ${on?tm.color:"transparent"}`,
                  color:on?tm.color:C.muted,cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                  position:"relative"}}>
                <div style={{fontSize:18,filter:on?`drop-shadow(0 0 5px ${tm.color})`:"none"}}>{tm.icon}</div>
                <span style={{...raj(11,on?700:500),letterSpacing:".03em"}}>{tipo}</span>
                <span style={{...raj(9,700),color:on?tm.color:C.navy,
                  background:on?`${tm.color}22`:`${C.navy}44`,padding:"1px 6px"}}>{count}</span>
                {listas>0&&(
                  <div style={{position:"absolute",top:8,right:"50%",transform:"translateX(220%)",
                    width:8,height:8,background:C.gold,borderRadius:"50%",
                    animation:"um-pulse 1.2s infinite"}}/>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Info del tipo ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",
          background:`${TIPOS[tab]?.color||C.orange}0A`,
          border:`1px solid ${TIPOS[tab]?.color||C.orange}22`}}>
          <Clock size={13} color={TIPOS[tab]?.color||C.orange}/>
          <span style={{...raj(12,500),color:C.mutedL}}>{TIPOS[tab]?.resets}</span>
          <div style={{marginLeft:"auto"}}>
            <CountdownTag tipo={tab}/>
          </div>
        </div>

        {/* ── Lista de misiones ── */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtradas.length===0&&(
            <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
              <div style={{fontSize:48,marginBottom:12,opacity:.4}}>🎯</div>
              <div style={{...raj(14,600),color:C.muted}}>No hay misiones de este tipo disponibles.</div>
            </div>
          )}
          {filtradas.map((m,i)=>{
            const tm=TIPOS[m.tipo]||{};
            const c=tm.color||C.orange;
            const pct=Math.round((m.progreso/m.total)*100);
            const lista=m.estado==="completada"&&!m.reclamada;
            const reclamada=m.reclamada;
            return (
              <div key={m.id} className="um-mission"
                onClick={()=>setDetalleMis(m)}
                style={{background:C.card,
                  border:`1px solid ${reclamada?C.green+"22":lista?c+"55":C.navy}`,
                  padding:"16px 20px",position:"relative",overflow:"hidden",
                  animation:`um-fadeIn .35s ease ${i*.07}s both`,
                  borderLeft:`4px solid ${reclamada?C.green:lista?c:"transparent"}`}}>

                {/* shine si completada */}
                {lista&&!reclamada&&(
                  <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent,${c}05,transparent)`,
                    animation:"um-shine 3s ease-in-out infinite",pointerEvents:"none"}}/>
                )}

                <div style={{display:"flex",alignItems:"center",gap:16,position:"relative",zIndex:1}}>
                  {/* icono */}
                  <div style={{width:52,height:52,background:reclamada?`${C.green}14`:`${c}18`,
                    border:`2px solid ${reclamada?C.green+"44":lista?c+"66":c+"22"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:26,flexShrink:0,
                    boxShadow:lista&&!reclamada?`0 0 16px ${c}33`:"none"}}>
                    {reclamada?<Check size={22} color={C.green}/>:m.imagen}
                  </div>

                  {/* info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{...raj(14,700),color:reclamada?C.muted:C.white}}>{m.titulo}</span>
                      <EstadoBadge estado={m.estado} reclamada={m.reclamada}/>
                      <CountdownTag tipo={m.tipo} fechaFin={m.fechaFin}/>
                    </div>
                    <div style={{...raj(12,400),color:C.muted,marginBottom:8,lineHeight:1.5,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:400}}>
                      {m.descripcion}
                    </div>

                    {/* progreso */}
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{flex:1,maxWidth:200}}>
                        <MiniBar val={m.progreso} max={m.total} color={reclamada?C.green:c} height={5}/>
                      </div>
                      <span style={{...raj(11,700),color:c,whiteSpace:"nowrap"}}>
                        {m.progreso} / {m.total}
                      </span>
                    </div>
                  </div>

                  {/* XP + acción */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
                    <div style={{...orb(16,900),color:C.gold,textShadow:lista&&!reclamada?`0 0 10px ${C.gold}`:"none"}}>
                      +{m.xpRecompensa}
                    </div>
                    <div style={{...px(5),color:C.muted}}>XP</div>
                    {/* recompensas extra */}
                    {m.recompensas.length>1&&(
                      <div style={{display:"flex",gap:4}}>
                        {m.recompensas.slice(1).map((r,ri)=>(
                          <span key={ri} style={{...raj(9,700),color:C.gold,background:`${C.gold}0D`,
                            border:`1px solid ${C.gold}22`,padding:"1px 6px",
                            display:"inline-flex",alignItems:"center",gap:2}}>
                            {r.icon}
                          </span>
                        ))}
                      </div>
                    )}
                    {lista&&!reclamada?(
                      <button onClick={(e)=>{e.stopPropagation();handleReclamar(m);}} className="um-claim"
                        style={{background:c,border:"none",padding:"8px 14px",...raj(11,700),
                          color:C.bg,cursor:"pointer","--cs":`${c}88`,
                          display:"flex",alignItems:"center",gap:5}}>
                        <Gift size={11}/> RECLAMAR
                      </button>
                    ):(
                      <ChevronRight size={16} color={C.muted}/>
                    )}
                  </div>
                </div>

                {/* progreso bar full de desafíos */}
                {m.tipo==="Desafío"&&!reclamada&&(
                  <div style={{marginTop:10,position:"relative",zIndex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{...raj(10,600),color:C.muted}}>Progreso total del desafío</span>
                      <span style={{...raj(11,700),color:c}}>{pct}%</span>
                    </div>
                    <MiniBar val={m.progreso} max={m.total} color={c} height={8}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                      <span style={{...raj(9,500),color:C.muted}}>0</span>
                      <span style={{...raj(9,700),color:c}}>{m.progreso.toLocaleString()} / {m.total.toLocaleString()}</span>
                      <span style={{...raj(9,500),color:C.muted}}>{m.total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Resumen de recompensas ── */}
        {filtradas.some(m=>m.reclamada)&&(
          <div style={{background:C.card,border:`1px solid ${C.navy}`,
            padding:"16px 20px",animation:"um-cardIn .4s ease both"}}>
            <div style={{...px(6),color:C.muted,marginBottom:12,letterSpacing:".05em"}}>
              ✅ RECOMPENSAS RECLAMADAS HOY
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {filtradas.filter(m=>m.reclamada).map((m,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,
                  background:`${C.green}0A`,border:`1px solid ${C.green}22`,
                  padding:"8px 12px"}}>
                  <span style={{fontSize:16}}>{m.imagen}</span>
                  <div>
                    <div style={{...raj(11,700),color:C.green}}>{m.titulo}</div>
                    <div style={{...raj(10,600),color:C.gold}}>+{m.xpRecompensa} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}