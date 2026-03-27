// src/pages/user/UserLogros.jsx
// ─────────────────────────────────────────────────────────────
//  Página de logros del jugador.
//  Tipos: Ejercicio | Racha | Nivel | Social | Especial | Secreto
//  Props: profile (objeto del usuario)
//  Conectar: getLogros(), reclamarLogro()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  Trophy, Check, Lock, Star, Zap, Flame,
  Award, Shield, Eye, EyeOff, X, Gift,
  TrendingUp, ChevronRight, Search, Filter,
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
  @keyframes ul-fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ul-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes ul-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ul-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ul-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ul-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ul-xpPop   { 0%{opacity:0;transform:translateY(0) scale(.5)} 50%{opacity:1;transform:translateY(-60px) scale(1.3)} 100%{opacity:0;transform:translateY(-110px) scale(1)} }
  @keyframes ul-badge   { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.2) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ul-reward  { 0%{opacity:0;transform:translateX(-20px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes ul-ring    { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
  @keyframes ul-glow    { 0%,100%{box-shadow:0 0 10px var(--gc),inset 0 0 10px var(--gc2)} 50%{box-shadow:0 0 28px var(--gc),0 0 48px var(--gc),inset 0 0 20px var(--gc2)} }
  @keyframes ul-shine   { 0%{left:-100%} 100%{left:200%} }
  @keyframes ul-star    { 0%,100%{transform:scale(1) rotate(0)} 50%{transform:scale(1.2) rotate(8deg)} }
  @keyframes ul-newBadge{ 0%{opacity:0;transform:scale(0) rotate(-15deg)} 80%{transform:scale(1.15) rotate(3deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes ul-confetti{ 0%{transform:translateY(0) rotate(0);opacity:1} 100%{transform:translateY(-120px) rotate(720deg);opacity:0} }
  @keyframes ul-barFill { from{width:0} to{width:var(--bw)} }

  .ul-card  { transition:all .22s; cursor:pointer; }
  .ul-card:hover  { transform:translateY(-4px) !important; box-shadow:0 16px 44px rgba(0,0,0,.5) !important; }
  .ul-btn   { transition:all .2s; cursor:pointer; }
  .ul-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ul-tab   { transition:all .2s; cursor:pointer; }
  .ul-tab:hover { opacity:.85; }
  .ul-filter-btn { transition:all .18s; cursor:pointer; }
  .ul-filter-btn:hover { opacity:.85; }
  .ul-badge-glow { animation:ul-glow 3s ease-in-out infinite; }
  .ul-new-dot { animation:ul-pulse 1.2s ease-in-out infinite; }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Tipos ──────────────────────────────────────────────────────
const TIPOS = {
  Ejercicio:{ color:C.orange,  icon:"💪", desc:"Completar ejercicios"      },
  Racha:    { color:C.red,     icon:"🔥", desc:"Mantener rachas"           },
  Nivel:    { color:C.gold,    icon:"⬆️", desc:"Alcanzar niveles"          },
  Social:   { color:C.blue,    icon:"👥", desc:"Interacciones"             },
  Especial: { color:C.purple,  icon:"🌟", desc:"Eventos especiales"        },
  Secreto:  { color:C.muted,   icon:"❓", desc:"Condición oculta"          },
};

// ── Rareza ─────────────────────────────────────────────────────
const RAREZA = {
  Común:     { color:C.muted,   tier:1, glow:"#5A7A9A" },
  Raro:      { color:C.blue,    tier:2, glow:C.blue     },
  Épico:     { color:C.purple,  tier:3, glow:C.purple   },
  Legendario:{ color:C.gold,    tier:4, glow:C.gold     },
};

// ── Mock logros del jugador ────────────────────────────────────
const MOCK_LOGROS = [
  // Obtenidos
  { id:"lg1",  tipo:"Ejercicio", rareza:"Común",     imagen:"👋",  nombre:"Primer Paso",       xpBonus:50,   desc:"Completa tu primera sesión de ejercicio.",     secreto:false, obtenido:true,  progreso:1,  total:1,  reclamado:true,  fechaObtencion:"2024-10-01",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"50 XP"}] },
  { id:"lg2",  tipo:"Racha",     rareza:"Raro",      imagen:"🔥",  nombre:"Semana de Hierro",  xpBonus:200,  desc:"Mantén una racha de 7 días seguidos.",         secreto:false, obtenido:true,  progreso:7,  total:7,  reclamado:true,  fechaObtencion:"2024-10-12",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"200 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Guerrero Semanal"}] },
  { id:"lg3",  tipo:"Social",    rareza:"Común",     imagen:"👤",  nombre:"Perfil Completo",   xpBonus:100,  desc:"Completa todos los campos de tu perfil.",      secreto:false, obtenido:true,  progreso:1,  total:1,  reclamado:true,  fechaObtencion:"2024-10-02",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"100 XP"}] },
  { id:"lg4",  tipo:"Ejercicio", rareza:"Raro",      imagen:"💯",  nombre:"¡10 Sesiones!",     xpBonus:150,  desc:"Completa 10 sesiones de ejercicio en total.",  secreto:false, obtenido:true,  progreso:10, total:10, reclamado:false, fechaObtencion:"2024-11-05",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"150 XP"}] },
  { id:"lg5",  tipo:"Racha",     rareza:"Raro",      imagen:"⚡",  nombre:"Sprint Épico",      xpBonus:250,  desc:"Completa 3 sesiones de cardio en un día.",     secreto:false, obtenido:true,  progreso:3,  total:3,  reclamado:false, fechaObtencion:"2024-11-18",
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"250 XP"}] },

  // En progreso
  { id:"lg6",  tipo:"Racha",     rareza:"Legendario",imagen:"🏆",  nombre:"Maestro del Fuego", xpBonus:2000, desc:"Mantén una racha de 30 días consecutivos.",    secreto:false, obtenido:false, progreso:14, total:30, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"2000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Llama Eterna"},{tipo:"item",icon:"🎒",label:"Objeto",valor:"Corona del Campeón"}] },
  { id:"lg7",  tipo:"Ejercicio", rareza:"Épico",     imagen:"💯",  nombre:"Centenario",        xpBonus:800,  desc:"Completa 100 sesiones de ejercicio en total.", secreto:false, obtenido:false, progreso:8,  total:100,reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"800 XP"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Escudo Centenario"}] },
  { id:"lg8",  tipo:"Nivel",     rareza:"Raro",      imagen:"⬆️",  nombre:"Nivel 20",          xpBonus:400,  desc:"Alcanza el nivel 20 con tu personaje.",        secreto:false, obtenido:false, progreso:12, total:20, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"400 XP"}] },
  { id:"lg9",  tipo:"Ejercicio", rareza:"Épico",     imagen:"🧘",  nombre:"Zen Master",        xpBonus:400,  desc:"Completa 30 sesiones de yoga o flexibilidad.", secreto:false, obtenido:false, progreso:4,  total:30, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"400 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Alma Zen"}] },
  { id:"lg10", tipo:"Nivel",     rareza:"Legendario",imagen:"👑",  nombre:"Leyenda Viviente",  xpBonus:5000, desc:"Alcanza el nivel 50.",                         secreto:false, obtenido:false, progreso:12, total:50, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"5000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Leyenda Viviente"}] },
  { id:"lg11", tipo:"Especial",  rareza:"Épico",     imagen:"🌸",  nombre:"Héroe Primaveral",  xpBonus:600,  desc:"Participa en el evento de primavera.",         secreto:false, obtenido:false, progreso:3,  total:10, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"600 XP"},{tipo:"badge",icon:"🏅",label:"Badge",valor:"Flor Guerrera"}] },

  // Secretos
  { id:"lg12", tipo:"Secreto",   rareza:"Legendario",imagen:"❓",  nombre:"??? SECRETO ???",   xpBonus:1000, desc:"Condición oculta. ¡Sigue entrenando para descubrirlo!", secreto:true, obtenido:false, progreso:0, total:1, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"1000 XP"},{tipo:"titulo",icon:"👑",label:"Título",valor:"Sombra del Abismo"}] },
  { id:"lg13", tipo:"Secreto",   rareza:"Épico",     imagen:"❓",  nombre:"??? SECRETO ???",   xpBonus:500,  desc:"Condición oculta.",                            secreto:true, obtenido:false, progreso:0, total:1, reclamado:false, fechaObtencion:null,
    recompensas:[{tipo:"xp",icon:"⚡",label:"XP Bonus",valor:"500 XP"}] },
];

// ── Badge visual component ─────────────────────────────────────
function BadgeCircle({ logro, size = "md", isNew = false, onClick }) {
  const rm  = RAREZA[logro.rareza] || { color:C.muted, tier:1, glow:C.muted };
  const c   = rm.color;
  const dim = size==="xl"?110 : size==="lg"?72 : size==="md"?56 : 40;
  const emojiSize = size==="xl"?44 : size==="lg"?28 : size==="md"?22 : 16;
  const locked = !logro.obtenido && logro.secreto;
  const pending= !logro.obtenido && !logro.secreto;

  return (
    <div style={{position:"relative",width:dim,height:dim,flexShrink:0,cursor:onClick?"pointer":"default"}}
      onClick={onClick}>
      {/* outer glow ring */}
      <div style={{position:"absolute",inset:0,borderRadius:"50%",
        border:`${size==="xl"?3:2}px solid ${c}${logro.obtenido?"88":"33"}`,
        background:`radial-gradient(circle at 35% 35%,${c}${logro.obtenido?"22":"08"} 0%,${c}08 60%,transparent 100%)`,
        boxShadow:logro.obtenido?`0 0 ${size==="xl"?22:12}px ${c}44,inset 0 0 ${size==="xl"?16:8}px ${c}18`:"none",
        animation:logro.obtenido&&rm.tier>=3?"ul-glow 3s ease-in-out infinite":"none",
        "--gc":`${c}44`,"--gc2":`${c}18`}}/>
      {/* inner */}
      <div style={{position:"absolute",inset:size==="xl"?5:3,borderRadius:"50%",
        background:`radial-gradient(circle,${C.card} 55%,${c}18 100%)`,
        border:`1px solid ${c}${logro.obtenido?"44":"22"}`}}/>
      {/* shine overlay for obtained */}
      {logro.obtenido&&(
        <div style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",pointerEvents:"none"}}>
          <div style={{position:"absolute",top:0,left:"-60%",width:"40%",height:"100%",
            background:"linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)",
            animation:"ul-shine 3s ease 0s infinite"}}/>
        </div>
      )}
      {/* emoji */}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:emojiSize,
        filter:locked?"blur(7px)":!logro.obtenido?`grayscale(1) opacity(.35)`:
          `drop-shadow(0 0 ${rm.tier>=3?10:6}px ${c}${rm.tier>=3?"aa":"66"})`,
        transition:"filter .3s"}}>
        {locked?<Lock size={emojiSize*.65} color={C.muted}/>:logro.imagen}
      </div>
      {/* stars for rare+ */}
      {logro.obtenido&&rm.tier>=2&&(
        <div style={{position:"absolute",bottom:size==="xl"?-10:size==="lg"?-8:-6,
          left:"50%",transform:"translateX(-50%)",
          display:"flex",gap:2,background:C.card,padding:"1px 4px",
          border:`1px solid ${c}44`}}>
          {"★".repeat(rm.tier).split("").map((s,i)=>(
            <span key={i} style={{fontSize:size==="xl"?9:6,color:c,
              textShadow:`0 0 4px ${c}`,
              animation:`ul-star ${2+i*.3}s ease-in-out infinite`}}>{s}</span>
          ))}
        </div>
      )}
      {/* NEW dot */}
      {isNew&&(
        <div style={{position:"absolute",top:-2,right:-2,width:14,height:14,
          background:C.orange,borderRadius:"50%",border:`2px solid ${C.bg}`,
          animation:"ul-newBadge .5s ease both",zIndex:2}}/>
      )}
      {/* lock icon for not-secret locked */}
      {pending&&!locked&&(
        <div style={{position:"absolute",bottom:size==="xl"?-2:0,right:size==="xl"?-2:0,
          background:C.panel,borderRadius:"50%",width:size==="xl"?20:14,height:size==="xl"?20:14,
          border:`1px solid ${C.muted}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Lock size={size==="xl"?10:7} color={C.muted}/>
        </div>
      )}
    </div>
  );
}

// ── MiniBar ────────────────────────────────────────────────────
function MiniBar({val,max,color,height=6}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,boxShadow:`0 0 6px ${color}66`,
        "--bw":`${pct}%`,animation:"ul-barFill .8s ease both",position:"relative"}}>
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",
          animation:"ul-shine 2s ease .4s 1"}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Detalle de logro
// ══════════════════════════════════════════════════════════════
function DetalleModal({logro, onClose, onReclamar}) {
  const rm  = RAREZA[logro.rareza]||{color:C.muted,tier:1};
  const tm  = TIPOS[logro.tipo]||{};
  const c   = rm.color;
  const pct = Math.round((logro.progreso/logro.total)*100);
  const listo = logro.obtenido && !logro.reclamado;

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.82)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:520,background:C.card,
        border:`2px solid ${c}44`,
        boxShadow:`0 0 60px ${c}22,0 24px 60px rgba(0,0,0,.6)`,
        animation:"ul-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"20px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <BadgeCircle logro={logro} size="lg" isNew={listo}/>
            <div>
              <div style={{...orb(14,900),color:logro.obtenido?C.white:C.muted,marginBottom:6}}>
                {logro.secreto&&!logro.obtenido?"??? LOGRO SECRETO ???":logro.nombre}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...raj(10,700),color:tm.color||C.muted,
                  background:`${tm.color||C.muted}14`,border:`1px solid ${tm.color||C.muted}33`,
                  padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4}}>
                  {tm.icon} {logro.tipo}
                </span>
                <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 8px",
                  textShadow:rm.tier>=3?`0 0 6px ${c}`:"none"}}>
                  {"★".repeat(rm.tier)} {logro.rareza}
                </span>
                {logro.obtenido&&!logro.reclamado&&(
                  <span style={{...raj(9,700),color:C.gold,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,
                    padding:"2px 8px",animation:"ul-pulse 1.5s infinite"}}>⚡ LISTA</span>
                )}
                {logro.reclamado&&(
                  <span style={{...raj(9,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,
                    padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4}}>
                    <Check size={9}/> RECLAMADA
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="ul-btn"
            style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16}}>
          {/* stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {l:"XP BONUS",   v:`+${logro.xpBonus}`, c:C.gold},
              {l:"PROGRESO",   v:`${logro.progreso}/${logro.total}`, c},
              {l:"OBTENIDO",   v:logro.obtenido?(logro.fechaObtencion||"Sí"):"No", c:logro.obtenido?C.green:C.muted},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(13,900),color:s.c,marginBottom:3,
                  fontSize:s.l==="OBTENIDO"&&s.v.length>6?"11px":undefined}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* barra de progreso */}
          {!logro.secreto&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{...raj(12,600),color:C.muted}}>Progreso</span>
                <span style={{...raj(12,700),color:c}}>{pct}%</span>
              </div>
              <MiniBar val={logro.progreso} max={logro.total} color={logro.obtenido?C.green:c} height={10}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{...raj(10,500),color:C.muted}}>0</span>
                <span style={{...raj(10,700),color:c}}>{logro.progreso.toLocaleString()} / {logro.total.toLocaleString()}</span>
                <span style={{...raj(10,500),color:C.muted}}>{logro.total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* descripcion */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <div style={{...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em"}}>📋 DESCRIPCIÓN</div>
            <p style={{...raj(13,400),color:logro.secreto&&!logro.obtenido?C.muted:C.white,lineHeight:1.7,
              filter:logro.secreto&&!logro.obtenido?"blur(5px)":undefined}}>
              {logro.descripcion}
            </p>
            {logro.secreto&&!logro.obtenido&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,...raj(12,600),color:C.muted}}>
                <Lock size={12}/> La condición real está oculta. ¡Descúbrela entrenando!
              </div>
            )}
          </div>

          {/* recompensas */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>🎁 RECOMPENSAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {logro.recompensas.map((r,i)=>(
                <div key={i} style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,
                  padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{r.icon}</span>
                  <div>
                    <div style={{...raj(12,700),color:C.gold}}>{r.label}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{r.valor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {listo?(
            <button onClick={()=>onReclamar(logro)} className="ul-btn"
              style={{width:"100%",...px(9),color:C.bg,background:c,border:"none",
                padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                boxShadow:`0 6px 28px ${c}55`}}>
              <Gift size={14}/> RECLAMAR RECOMPENSA
            </button>
          ):logro.reclamado?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              background:`${C.green}0A`,border:`1px solid ${C.green}33`,padding:"14px",...raj(13,700),color:C.green}}>
              <Check size={15}/> RECOMPENSA RECLAMADA
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${c}0A`,
              border:`1px solid ${c}22`,padding:"14px 16px",...raj(13,500),color:C.mutedL}}>
              <TrendingUp size={15} color={c}/>
              {logro.secreto?"Sigue entrenando para descubrir este logro secreto.":
                `Progreso: ${logro.progreso}/${logro.total} — ${pct}% completado`}
              <span style={{marginLeft:"auto",...raj(13,700),color:c}}>{pct}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Celebración al reclamar
// ══════════════════════════════════════════════════════════════
function ReclamarModal({logro, onClose}) {
  const rm = RAREZA[logro.rareza]||{color:C.muted,tier:1};
  const c  = rm.color;
  const [show, setShow] = useState(false);
  useEffect(()=>{setTimeout(()=>setShow(true),300);},[]);

  // Partículas confetti
  const confetti = Array.from({length:12},(_,i)=>({
    x: 30+Math.random()*40,
    delay: i*.08,
    color: [C.gold,C.orange,C.green,C.blue,C.purple][i%5],
    size: 4+Math.random()*6,
    rotation: Math.random()*360,
  }));

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.92)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflow:"hidden"}}>
      {/* confetti */}
      {confetti.map((p,i)=>(
        <div key={i} style={{position:"absolute",bottom:"40%",left:`${p.x}%`,
          width:p.size,height:p.size,background:p.color,borderRadius:p.size>6?"50%":"2px",
          animation:`ul-confetti 1.5s ease ${p.delay}s both`}}/>
      ))}
      <div style={{width:"100%",maxWidth:440,background:C.card,
        border:`2px solid ${c}55`,
        boxShadow:`0 0 80px ${c}22,0 24px 60px rgba(0,0,0,.7)`,
        animation:"ul-modalIn .25s ease both",overflow:"hidden",textAlign:"center",
        padding:"36px 28px"}}>

        {/* badge grande animado */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <div style={{animation:"ul-badge .7s ease both"}}>
            <BadgeCircle logro={{...logro,obtenido:true}} size="xl"/>
          </div>
        </div>

        <div style={{...orb(18,900),color:C.white,marginBottom:6,animation:"ul-fadeIn .5s ease .3s both"}}>
          ¡LOGRO DESBLOQUEADO!
        </div>
        <div style={{...raj(14,500),color:c,marginBottom:6,animation:"ul-fadeIn .5s ease .4s both",
          textShadow:rm.tier>=3?`0 0 10px ${c}`:"none"}}>
          {logro.nombre}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:24,animation:"ul-fadeIn .5s ease .5s both"}}>
          {"★".repeat(rm.tier).split("").map((s,i)=>(
            <span key={i} style={{fontSize:16,color:c,textShadow:`0 0 8px ${c}`,
              animation:`ul-star ${1.5+i*.2}s ease-in-out ${i*.1}s infinite`}}>{s}</span>
          ))}
        </div>

        {/* recompensas */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {logro.recompensas.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,
              background:`${C.gold}0A`,border:`1px solid ${C.gold}44`,padding:"14px 18px",
              animation:`ul-reward .4s ease ${.5+i*.12}s both`}}>
              <span style={{fontSize:24,filter:`drop-shadow(0 0 8px ${C.gold})`}}>{r.icon}</span>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{...raj(13,700),color:C.gold}}>{r.label}</div>
                <div style={{...raj(12,500),color:C.mutedL}}>{r.valor}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="ul-btn"
          style={{width:"100%",...px(8),color:C.bg,background:c,border:"none",
            padding:"15px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            boxShadow:`0 6px 28px ${c}55`,animation:"ul-fadeIn .5s ease .8s both"}}>
          <Trophy size={14}/> ¡GENIAL!
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function UserLogros({profile}) {
  const [logros,      setLogros]      = useState(MOCK_LOGROS);
  const [tab,         setTab]         = useState("Todos");
  const [filterRar,   setFilterRar]   = useState("all");
  const [filterEst,   setFilterEst]   = useState("all"); // all|obtenido|progreso|secreto
  const [search,      setSearch]      = useState("");
  const [detalleLogro,setDetalleLogro]= useState(null);
  const [reclamarLog, setReclamarLog] = useState(null);
  const [xpNotif,     setXpNotif]     = useState(null);
  const [vista,       setVista]       = useState("grid"); // grid|lista

  const clsColor = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
  const myColor  = clsColor[profile?.heroClass]||C.orange;

  const handleReclamar = (logro) => {
    setDetalleLogro(null);
    setLogros(prev=>prev.map(l=>l.id===logro.id?{...l,reclamado:true}:l));
    setReclamarLog(logro);
    setXpNotif(logro.xpBonus);
    setTimeout(()=>setXpNotif(null),2800);
  };

  // Filtrar
  const filtrados = logros.filter(l=>{
    if(tab!=="Todos"&&l.tipo!==tab) return false;
    if(search&&!l.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if(filterRar!=="all"&&l.rareza!==filterRar) return false;
    if(filterEst==="obtenido"&&!l.obtenido) return false;
    if(filterEst==="progreso"&&(l.obtenido||l.secreto)) return false;
    if(filterEst==="secreto"&&!l.secreto) return false;
    if(filterEst==="listos"&&!(l.obtenido&&!l.reclamado)) return false;
    return true;
  });

  // Stats globales
  const obtenidos    = logros.filter(l=>l.obtenido).length;
  const listos       = logros.filter(l=>l.obtenido&&!l.reclamado).length;
  const reclamados   = logros.filter(l=>l.reclamado).length;
  const xpTotal      = logros.filter(l=>l.reclamado).reduce((s,l)=>s+l.xpBonus,0);
  const xpDisp       = logros.filter(l=>l.obtenido&&!l.reclamado).reduce((s,l)=>s+l.xpBonus,0);
  const totalLogros  = logros.filter(l=>!l.secreto||l.obtenido).length;

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,
    background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,
    padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {detalleLogro&&<DetalleModal logro={detalleLogro} onClose={()=>setDetalleLogro(null)} onReclamar={handleReclamar}/>}
      {reclamarLog&&<ReclamarModal logro={reclamarLog} onClose={()=>setReclamarLog(null)}/>}

      {xpNotif&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          zIndex:500,pointerEvents:"none",...orb(32,900),color:C.gold,
          textShadow:`0 0 30px ${C.gold}`,animation:"ul-xpPop 2.5s ease forwards"}}>
          +{xpNotif} XP ⚡
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* ── Banner de progreso ── */}
        <div style={{background:C.card,border:`1px solid ${myColor}33`,
          padding:"22px 26px",position:"relative",overflow:"hidden",
          animation:"ul-cardIn .4s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg,transparent,${myColor},transparent)`}}/>
          <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,
            borderRadius:"50%",background:myColor,filter:"blur(80px)",opacity:.05,pointerEvents:"none"}}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"center"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Trophy size={22} color={myColor}/>
                <div style={{...orb(14,700),color:C.white}}>VITRINA DE LOGROS</div>
              </div>
              {/* barra progreso colección */}
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{...raj(12,600),color:C.muted}}>Colección completada</span>
                  <span style={{...raj(12,700),color:myColor}}>{obtenidos}/{totalLogros} ({Math.round((obtenidos/totalLogros)*100)}%)</span>
                </div>
                <div style={{height:10,background:C.panel,border:`1px solid ${myColor}22`,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((obtenidos/totalLogros)*100)}%`,
                    background:`linear-gradient(90deg,${myColor}88,${myColor})`,
                    boxShadow:`0 0 8px ${myColor}66`,transition:"width 1.5s ease",position:"relative"}}>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)",animation:"ul-shine 2.5s ease 1s 1"}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                {[
                  {l:"Obtenidos",v:`${obtenidos}/${totalLogros}`,c:myColor},
                  {l:"Reclamados",v:reclamados,c:C.green},
                  {l:"XP ganado",v:`+${xpTotal.toLocaleString()}`,c:C.gold},
                ].map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,background:s.c,flexShrink:0}}/>
                    <span style={{...raj(12,600),color:C.muted}}>{s.l}:</span>
                    <span style={{...raj(12,700),color:s.c}}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges obtenidos preview */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,minWidth:200}}>
              {logros.filter(l=>l.obtenido).slice(0,8).map((l,i)=>(
                <div key={l.id} style={{display:"flex",justifyContent:"center",animation:`ul-cardIn .4s ease ${i*.06}s both`}}>
                  <BadgeCircle logro={l} size="sm" onClick={()=>setDetalleLogro(l)}/>
                </div>
              ))}
              {logros.filter(l=>l.obtenido).length>8&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",
                  width:40,height:40,background:`${myColor}18`,border:`1px solid ${myColor}33`,
                  ...raj(12,700),color:myColor}}>
                  +{logros.filter(l=>l.obtenido).length-8}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Alerta de listos para reclamar ── */}
        {listos>0&&(
          <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}44`,
            padding:"14px 20px",display:"flex",alignItems:"center",gap:14,
            animation:"ul-fadeIn .4s ease both"}}>
            <span style={{fontSize:24,animation:"ul-star 2s ease-in-out infinite"}}>⚡</span>
            <div style={{flex:1}}>
              <div style={{...raj(14,700),color:C.gold}}>
                {listos} logro{listos!==1?"s":""} listo{listos!==1?"s":""} para reclamar
              </div>
              <div style={{...raj(12,500),color:C.muted}}>
                +{xpDisp.toLocaleString()} XP esperando
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs de tipo ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,overflowX:"auto"}}>
            {["Todos",...Object.keys(TIPOS)].map(tipo=>{
              const tm=TIPOS[tipo];
              const on=tab===tipo;
              const cc=tm?.color||myColor;
              const count=tipo==="Todos"?logros.length:logros.filter(l=>l.tipo===tipo).length;
              const countObt=tipo==="Todos"?obtenidos:logros.filter(l=>l.tipo===tipo&&l.obtenido).length;
              const hasListo=tipo==="Todos"?listos>0:logros.some(l=>l.tipo===tipo&&l.obtenido&&!l.reclamado);
              return (
                <button key={tipo} onClick={()=>setTab(tipo)} className="ul-tab"
                  style={{flex:"0 0 auto",padding:"13px 16px",
                    background:on?`${cc}12`:"transparent",border:"none",
                    borderBottom:`3px solid ${on?cc:"transparent"}`,
                    color:on?cc:C.muted,cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    minWidth:80,position:"relative"}}>
                  <div style={{fontSize:17,filter:on?`drop-shadow(0 0 5px ${cc})`:"none"}}>{tm?.icon||"🌐"}</div>
                  <span style={{...raj(11,on?700:500),whiteSpace:"nowrap"}}>{tipo}</span>
                  <span style={{...raj(9,700),color:on?cc:C.navy,
                    background:on?`${cc}22`:`${C.navy}44`,padding:"1px 6px"}}>
                    {countObt}/{count}
                  </span>
                  {hasListo&&(
                    <div className="ul-new-dot" style={{position:"absolute",top:8,right:8,
                      width:7,height:7,background:C.gold,borderRadius:"50%"}}/>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"13px 16px",
          display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:"1 1 180px"}}>
            <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
            <input className="ul-input ul-filter-btn" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar logro..."
              style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,
                border:`1px solid ${C.navy}`,color:C.white,...raj(13,500),outline:"none",
                transition:"border-color .2s"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
          </div>

          <span style={{...raj(11,600),color:C.muted}}>Rareza:</span>
          {["all",...Object.keys(RAREZA)].map(v=>{
            const r=RAREZA[v];
            return (
              <button key={v} onClick={()=>setFilterRar(v)} className="ul-filter-btn"
                style={fBtn(filterRar===v,r?.color||myColor)}>
                {v==="all"?"Todas":v}
              </button>
            );
          })}

          <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
          <span style={{...raj(11,600),color:C.muted}}>Estado:</span>
          {[
            {v:"all",  l:"Todos"},
            {v:"obtenido",l:"✓ Obtenidos"},
            {v:"listos",  l:"⚡ Listos"},
            {v:"progreso",l:"⏳ En progreso"},
            {v:"secreto", l:"🔒 Secretos"},
          ].map(o=>(
            <button key={o.v} onClick={()=>setFilterEst(o.v)} className="ul-filter-btn"
              style={fBtn(filterEst===o.v,o.v==="listos"?C.gold:o.v==="obtenido"?C.green:myColor)}>
              {o.l}
            </button>
          ))}

          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {[{v:"grid",i:"⊞"},{v:"lista",i:"≡"}].map(({v,i})=>(
              <button key={v} onClick={()=>setVista(v)} className="ul-filter-btn"
                style={{...raj(14,700),color:vista===v?myColor:C.muted,
                  background:vista===v?`${myColor}18`:C.panel,
                  border:`1px solid ${vista===v?myColor:C.navy}`,padding:"7px 12px",cursor:"pointer"}}>
                {i}
              </button>
            ))}
          </div>
        </div>

        <div style={{...raj(12,500),color:C.muted}}>
          {filtrados.length} logro{filtrados.length!==1?"s":""} encontrado{filtrados.length!==1?"s":""}
          {filtrados.filter(l=>l.obtenido&&!l.reclamado).length>0&&(
            <span style={{color:C.gold,marginLeft:12}}>
              ⚡ {filtrados.filter(l=>l.obtenido&&!l.reclamado).length} listo{filtrados.filter(l=>l.obtenido&&!l.reclamado).length!==1?"s":""} para reclamar
            </span>
          )}
        </div>

        {/* ── GRID VIEW ── */}
        {vista==="grid"&&(
          filtrados.length===0?(
            <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
              <div style={{fontSize:48,marginBottom:12,opacity:.4}}>🏆</div>
              <div style={{...raj(14,600),color:C.muted}}>No se encontraron logros con esos filtros.</div>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
              {filtrados.map((l,i)=>{
                const rm=RAREZA[l.rareza]||{color:C.muted,tier:1};
                const c=rm.color;
                const listo=l.obtenido&&!l.reclamado;
                const pct=Math.round((l.progreso/l.total)*100);
                return (
                  <div key={l.id} className="ul-card"
                    onClick={()=>setDetalleLogro(l)}
                    style={{background:C.card,
                      border:`2px solid ${l.reclamado?C.green+"22":listo?c+"55":l.obtenido?c+"33":C.navy}`,
                      boxShadow:listo?`0 0 16px ${c}22,0 4px 16px rgba(0,0,0,.35)`:
                        l.obtenido?`0 0 10px ${c}11,0 4px 16px rgba(0,0,0,.35)`:"0 2px 8px rgba(0,0,0,.3)",
                      overflow:"hidden",animation:`ul-cardIn .4s ease ${i*.05}s both`,
                      position:"relative",
                      opacity:!l.obtenido&&!l.secreto?.75:1}}>
                    <div style={{height:3,background:`linear-gradient(90deg,transparent,${l.reclamado?C.green:l.obtenido?c:C.navy},transparent)`}}/>

                    <div style={{padding:"18px 14px 12px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                      {/* Badge */}
                      <div style={{marginBottom:14,marginTop:6}}>
                        <BadgeCircle logro={l} size="md" isNew={listo} onClick={undefined}/>
                      </div>

                      {/* Nombre */}
                      <div style={{...raj(12,700),color:l.obtenido?C.white:C.muted,
                        marginBottom:6,lineHeight:1.3,minHeight:36,
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {l.secreto&&!l.obtenido?"??? ???":l.nombre}
                      </div>

                      {/* Tipo + rareza */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginBottom:8}}>
                        <span style={{...raj(9,700),color:TIPOS[l.tipo]?.color||C.muted,
                          background:`${TIPOS[l.tipo]?.color||C.muted}14`,
                          border:`1px solid ${TIPOS[l.tipo]?.color||C.muted}33`,padding:"1px 6px"}}>
                          {TIPOS[l.tipo]?.icon} {l.tipo}
                        </span>
                        <span style={{...raj(9,700),color:c,background:`${c}14`,
                          border:`1px solid ${c}33`,padding:"1px 6px",
                          textShadow:rm.tier>=3?`0 0 4px ${c}`:"none"}}>
                          {"★".repeat(rm.tier)}
                        </span>
                      </div>

                      {/* Estado visual */}
                      {l.reclamado?(
                        <div style={{...raj(10,700),color:C.green,display:"flex",alignItems:"center",gap:4,
                          background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"3px 10px",marginBottom:8}}>
                          <Check size={10}/> RECLAMADO
                        </div>
                      ):listo?(
                        <div style={{...raj(10,700),color:c,display:"flex",alignItems:"center",gap:4,
                          background:`${c}14`,border:`1px solid ${c}44`,padding:"3px 10px",marginBottom:8,
                          animation:"ul-pulse 1.8s ease-in-out infinite"}}>
                          ⚡ LISTO
                        </div>
                      ):l.obtenido?(
                        <div style={{...raj(10,600),color:C.muted,marginBottom:8}}>Obtenido</div>
                      ):l.secreto?(
                        <div style={{...raj(10,600),color:C.muted,display:"flex",alignItems:"center",gap:4,marginBottom:8}}>
                          <Lock size={10}/> Secreto
                        </div>
                      ):(
                        <div style={{width:"100%",marginBottom:8}}>
                          <MiniBar val={l.progreso} max={l.total} color={c} height={4}/>
                          <div style={{...raj(9,600),color:C.muted,marginTop:3}}>{l.progreso}/{l.total}</div>
                        </div>
                      )}

                      {/* XP */}
                      <div style={{...raj(12,700),color:C.gold}}>+{l.xpBonus} XP</div>
                      {l.recompensas.length>1&&(
                        <div style={{display:"flex",gap:3,marginTop:4,justifyContent:"center"}}>
                          {l.recompensas.slice(1).map((r,ri)=>(
                            <span key={ri} style={{fontSize:12}}>{r.icon}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── LISTA VIEW ── */}
        {vista==="lista"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtrados.length===0&&(
              <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
                <div style={{fontSize:48,marginBottom:12,opacity:.4}}>🏆</div>
                <div style={{...raj(14,600),color:C.muted}}>No se encontraron logros con esos filtros.</div>
              </div>
            )}
            {filtrados.map((l,i)=>{
              const rm=RAREZA[l.rareza]||{color:C.muted,tier:1};
              const c=rm.color;
              const listo=l.obtenido&&!l.reclamado;
              const pct=Math.round((l.progreso/l.total)*100);
              return (
                <div key={l.id}
                  onClick={()=>setDetalleLogro(l)}
                  style={{background:C.card,
                    border:`1px solid ${l.reclamado?C.green+"22":listo?c+"55":l.obtenido?c+"22":C.navy}`,
                    padding:"14px 20px",cursor:"pointer",
                    borderLeft:`4px solid ${l.reclamado?C.green:l.obtenido?c:"transparent"}`,
                    animation:`ul-fadeIn .3s ease ${i*.05}s both`,
                    transition:"all .2s",opacity:!l.obtenido&&!l.secreto?.8:1}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateX(3px)";e.currentTarget.style.borderColor=c;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateX(0)";e.currentTarget.style.borderColor=l.reclamado?`${C.green}22`:listo?`${c}55`:l.obtenido?`${c}22`:C.navy;}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <BadgeCircle logro={l} size="sm" isNew={listo}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{...raj(13,700),color:l.obtenido?C.white:C.muted}}>
                          {l.secreto&&!l.obtenido?"??? LOGRO SECRETO ???":l.nombre}
                        </span>
                        <span style={{...raj(9,700),color:TIPOS[l.tipo]?.color||C.muted,
                          background:`${TIPOS[l.tipo]?.color||C.muted}14`,
                          border:`1px solid ${TIPOS[l.tipo]?.color||C.muted}33`,padding:"1px 6px"}}>
                          {TIPOS[l.tipo]?.icon} {l.tipo}
                        </span>
                        <span style={{...raj(9,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"1px 6px"}}>
                          {"★".repeat(rm.tier)} {l.rareza}
                        </span>
                        {l.reclamado&&<span style={{...raj(9,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"1px 6px",display:"inline-flex",alignItems:"center",gap:3}}><Check size={8}/>Reclamado</span>}
                        {listo&&<span style={{...raj(9,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"1px 6px",animation:"ul-pulse 1.8s infinite"}}>⚡ Listo</span>}
                      </div>
                      {!l.secreto&&!l.obtenido&&(
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{flex:1,maxWidth:240}}>
                            <MiniBar val={l.progreso} max={l.total} color={c} height={4}/>
                          </div>
                          <span style={{...raj(10,600),color:C.muted,whiteSpace:"nowrap"}}>{l.progreso}/{l.total} ({pct}%)</span>
                        </div>
                      )}
                      {l.obtenido&&l.fechaObtencion&&(
                        <span style={{...raj(10,500),color:C.muted}}>Obtenido el {l.fechaObtencion}</span>
                      )}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                      <div style={{...raj(12,700),color:C.gold}}>+{l.xpBonus} XP</div>
                      {l.recompensas.length>1&&(
                        <div style={{display:"flex",gap:3}}>
                          {l.recompensas.slice(1).map((r,ri)=>(
                            <span key={ri} style={{fontSize:13}}>{r.icon}</span>
                          ))}
                        </div>
                      )}
                      <ChevronRight size={14} color={C.muted}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reclamados ── */}
        {logros.filter(l=>l.reclamado).length>0&&(
          <div style={{background:C.card,border:`1px solid ${C.navy}`,
            padding:"16px 20px",animation:"ul-cardIn .4s ease both"}}>
            <div style={{...px(6),color:C.muted,marginBottom:12,letterSpacing:".05em"}}>
              ✅ LOGROS RECLAMADOS RECIENTEMENTE
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {logros.filter(l=>l.reclamado).map((l,i)=>(
                <div key={i} onClick={()=>setDetalleLogro(l)}
                  style={{display:"flex",alignItems:"center",gap:8,
                    background:`${C.green}0A`,border:`1px solid ${C.green}22`,
                    padding:"8px 12px",cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.green}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=`${C.green}22`}>
                  <BadgeCircle logro={l} size="xs"/>
                  <div>
                    <div style={{...raj(11,700),color:C.green}}>{l.nombre}</div>
                    <div style={{...raj(10,600),color:C.gold}}>+{l.xpBonus} XP</div>
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