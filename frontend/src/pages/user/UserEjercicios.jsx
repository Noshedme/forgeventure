// src/pages/user/UserEjercicios.jsx
// ─────────────────────────────────────────────────────────────
//  Página de ejercicios del jugador.
//  Explora el catálogo, filtra por tipo, inicia sesiones.
//  Props: profile (objeto del usuario)
//  Conectar: getEjercicios(), iniciarSesion(), completarSesion()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Play, X, Check, ChevronRight, Clock,
  Zap, Flame, Star, Filter, Camera, Timer,
  RotateCcw, ChevronUp, ChevronDown, Info,
  Award, TrendingUp, Lock,
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
  @keyframes ue-fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ue-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes ue-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ue-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ue-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ue-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ue-glow    { 0%,100%{box-shadow:0 0 10px var(--gc)} 50%{box-shadow:0 0 28px var(--gc),0 0 50px var(--gc)} }
  @keyframes ue-countdown { from{stroke-dashoffset:0} to{stroke-dashoffset:var(--ds)} }
  @keyframes ue-xpPop   { 0%{opacity:0;transform:translateY(0) scale(.6)} 50%{opacity:1;transform:translateY(-40px) scale(1.2)} 100%{opacity:0;transform:translateY(-80px) scale(1)} }
  @keyframes ue-done    { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ue-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes ue-shine   { 0%{left:-100%} 100%{left:200%} }

  .ue-card  { transition:all .22s; cursor:pointer; }
  .ue-card:hover  { transform:translateY(-4px) !important; box-shadow:0 16px 44px rgba(0,0,0,.5) !important; }
  .ue-card:hover .ue-card-shine { animation:ue-shine .5s ease; }
  .ue-card-shine { position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);pointer-events:none; }
  .ue-btn   { transition:all .2s; cursor:pointer; }
  .ue-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ue-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .ue-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .ue-input::placeholder { color:${C.navy}; }
  .ue-filter-btn { transition:all .2s; cursor:pointer; }
  .ue-filter-btn:hover { opacity:.85; }
  .ue-rep-btn { transition:all .12s; cursor:pointer; user-select:none; }
  .ue-rep-btn:hover { opacity:.8; }
  .ue-rep-btn:active { transform:scale(.92); }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Categorías ─────────────────────────────────────────────────
const CATS = {
  Todos:        { color:C.orange,  icon:"⚡" },
  Fuerza:       { color:C.orange,  icon:"⚔️" },
  Cardio:       { color:C.blue,    icon:"🏃" },
  Flexibilidad: { color:C.purple,  icon:"🧘" },
  HIIT:         { color:C.red,     icon:"💥" },
  Calistenia:   { color:C.gold,    icon:"💪" },
  Funcional:    { color:C.teal,    icon:"🏋️" },
};
const DIFICULTAD_COLOR = {
  Principiante:C.green, Intermedio:C.gold, Avanzado:C.orange, Élite:C.red
};

// ── Mock ejercicios ───────────────────────────────────────────
const EJERCICIOS = [
  { id:"e1",  nombre:"Flexiones",           cat:"Fuerza",       dificultad:"Principiante", imagen:"💪", xpBase:30,  series:3, reps:15, duracion:null, verif:"Cámara",  musculos:["Pecho","Tríceps","Hombros"],     desc:"Ejercicio clásico de empuje para el tren superior. Mantén el cuerpo recto como una tabla.",          completadas:8,  bloqueado:false },
  { id:"e2",  nombre:"Sentadillas",          cat:"Fuerza",       dificultad:"Principiante", imagen:"🦵", xpBase:35,  series:4, reps:12, duracion:null, verif:"Cámara",  musculos:["Piernas","Glúteos"],             desc:"El rey de los ejercicios. Baja hasta que tus muslos queden paralelos al suelo.",               completadas:5,  bloqueado:false },
  { id:"e3",  nombre:"Cardio Libre",         cat:"Cardio",       dificultad:"Intermedio",   imagen:"🏃", xpBase:60,  series:1, reps:null,duracion:30,  verif:"Timer",   musculos:["Cuerpo completo"],               desc:"30 minutos de cardio continuo. Puedes correr, saltar o hacer cualquier actividad aeróbica.",      completadas:3,  bloqueado:false },
  { id:"e4",  nombre:"Plancha",              cat:"Funcional",    dificultad:"Intermedio",   imagen:"🏋️", xpBase:40,  series:3, reps:null,duracion:60,  verif:"Timer",   musculos:["Abdomen","Hombros","Espalda"],   desc:"Ejercicio isométrico para fortalecer el core. Mantén el cuerpo recto durante todo el tiempo.",   completadas:6,  bloqueado:false },
  { id:"e5",  nombre:"Dominadas",            cat:"Calistenia",   dificultad:"Avanzado",     imagen:"🔝", xpBase:55,  series:3, reps:8,  duracion:null, verif:"Cámara",  musculos:["Espalda","Bíceps"],              desc:"El ejercicio más completo para la espalda. Agarra la barra con las palmas hacia afuera.",        completadas:2,  bloqueado:false },
  { id:"e6",  nombre:"Yoga Matutino",        cat:"Flexibilidad", dificultad:"Principiante", imagen:"🧘", xpBase:45,  series:1, reps:null,duracion:20,  verif:"Timer",   musculos:["Cuerpo completo"],               desc:"Rutina de yoga para comenzar el día. Mejora la flexibilidad y reduce el estrés.",               completadas:4,  bloqueado:false },
  { id:"e7",  nombre:"HIIT Explosivo",       cat:"HIIT",         dificultad:"Avanzado",     imagen:"⚡", xpBase:90,  series:6, reps:null,duracion:20,  verif:"Timer",   musculos:["Cuerpo completo","Piernas"],     desc:"Intervalos de alta intensidad: 20s trabajo, 10s descanso. Quema grasa máxima.",                 completadas:1,  bloqueado:false },
  { id:"e8",  nombre:"Press Militar",        cat:"Fuerza",       dificultad:"Intermedio",   imagen:"🏋️", xpBase:45,  series:4, reps:10, duracion:null, verif:"Cámara",  musculos:["Hombros","Tríceps"],             desc:"Empuje vertical para desarrollar hombros fuertes. Mantén el core apretado.",                    completadas:0,  bloqueado:false },
  { id:"e9",  nombre:"Burpees",              cat:"HIIT",         dificultad:"Avanzado",     imagen:"💥", xpBase:70,  series:4, reps:10, duracion:null, verif:"Cámara",  musculos:["Cuerpo completo"],               desc:"Ejercicio total que combina fuerza y cardio. Del suelo al salto en un movimiento.",             completadas:0,  bloqueado:false },
  { id:"e10", nombre:"Estiramiento Total",   cat:"Flexibilidad", dificultad:"Principiante", imagen:"🤸", xpBase:20,  series:1, reps:null,duracion:15,  verif:"Timer",   musculos:["Cuerpo completo"],               desc:"Rutina de estiramientos completa para mejorar la flexibilidad general del cuerpo.",             completadas:10, bloqueado:false },
  { id:"e11", nombre:"Fondos en Paralelas",  cat:"Calistenia",   dificultad:"Avanzado",     imagen:"💪", xpBase:55,  series:3, reps:12, duracion:null, verif:"Cámara",  musculos:["Pecho","Tríceps","Hombros"],     desc:"Ejercicio de calistenia premium para el tren superior. Desciende hasta los 90°.",               completadas:0,  bloqueado:false },
  { id:"e12", nombre:"Pilates Core",         cat:"Flexibilidad", dificultad:"Intermedio",   imagen:"🧘", xpBase:35,  series:1, reps:null,duracion:25,  verif:"Timer",   musculos:["Abdomen","Espalda"],             desc:"Sesión de pilates enfocada en fortalecer el núcleo. Movimientos lentos y controlados.",         completadas:2,  bloqueado:false },
  { id:"e13", nombre:"Zancadas",             cat:"Fuerza",       dificultad:"Principiante", imagen:"🦵", xpBase:32,  series:3, reps:12, duracion:null, verif:"Cámara",  musculos:["Piernas","Glúteos"],             desc:"Ejercicio unilateral para piernas. Da un paso largo hacia adelante bajando la rodilla.",        completadas:3,  bloqueado:false },
  { id:"e14", nombre:"Sprints Cortos",       cat:"Cardio",       dificultad:"Intermedio",   imagen:"💨", xpBase:50,  series:8, reps:null,duracion:30,  verif:"Timer",   musculos:["Piernas","Cuerpo completo"],     desc:"8 sprints de 30 segundos. Velocidad máxima en cada intervalo con 90s de descanso.",            completadas:0,  bloqueado:false },
  { id:"e15", nombre:"Muscle Up",            cat:"Calistenia",   dificultad:"Élite",        imagen:"🏆", xpBase:120, series:3, reps:5,  duracion:null, verif:"Cámara",  musculos:["Espalda","Pecho","Tríceps"],     desc:"El ejercicio élite de calistenia. Requiere fuerza y técnica avanzada.",                         completadas:0,  bloqueado:true  },
];

// ── Helper bar ─────────────────────────────────────────────────
function MiniBar({val,max,color,height=5}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%",position:"relative"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,boxShadow:`0 0 5px ${color}66`,
        "--bw":`${pct}%`,animation:"ue-barFill .8s ease both",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",animation:"ue-shine 2s ease .4s 1"}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — DETALLE DE EJERCICIO
// ══════════════════════════════════════════════════════════════
function DetalleModal({ej,profile,onClose,onStart}) {
  const catColor = CATS[ej.cat]?.color || C.orange;
  const difColor = DIFICULTAD_COLOR[ej.dificultad] || C.muted;

  // Bonus de clase
  const clsBonus = {GUERRERO:"Fuerza",ARQUERO:"Cardio",MAGO:"Flexibilidad"};
  const primaryCat = clsBonus[profile?.heroClass]||"";
  const hasBonus = ej.cat===primaryCat || (profile?.heroClass==="GUERRERO"&&["Fuerza","Calistenia","Funcional"].includes(ej.cat))
    ||(profile?.heroClass==="ARQUERO"&&["Cardio","HIIT"].includes(ej.cat))
    ||(profile?.heroClass==="MAGO"&&["Flexibilidad"].includes(ej.cat));
  const bonusXp = hasBonus ? Math.round(ej.xpBase * 0.25) : 0;

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.8)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:560,background:C.card,border:`2px solid ${catColor}44`,
        boxShadow:`0 0 60px ${catColor}18,0 24px 60px rgba(0,0,0,.6)`,
        animation:"ue-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${catColor},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,background:`${catColor}18`,border:`2px solid ${catColor}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
              animation:"ue-float 2.5s ease-in-out infinite"}}>
              {ej.imagen}
            </div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:5}}>{ej.nombre}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...raj(10,700),color:catColor,background:`${catColor}14`,border:`1px solid ${catColor}33`,padding:"2px 8px"}}>
                  {CATS[ej.cat]?.icon} {ej.cat}
                </span>
                <span style={{...raj(10,700),color:difColor,background:`${difColor}14`,border:`1px solid ${difColor}33`,padding:"2px 8px"}}>
                  {ej.dificultad}
                </span>
                <span style={{...raj(10,600),color:ej.verif==="Cámara"?C.teal:C.blue,background:`${ej.verif==="Cámara"?C.teal:C.blue}14`,
                  border:`1px solid ${ej.verif==="Cámara"?C.teal:C.blue}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4}}>
                  {ej.verif==="Cámara"?<Camera size={10}/>:<Timer size={10}/>} {ej.verif}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="ue-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16,maxHeight:"72vh",overflowY:"auto"}}>
          {/* stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {l:"XP BASE",     v:`+${ej.xpBase}`,                         c:C.gold  },
              {l:"SERIES",      v:ej.duracion?`${ej.series}s`:ej.series,    c:catColor},
              {l:ej.duracion?"DURACIÓN":"REPS", v:ej.duracion?`${ej.duracion}s`:`×${ej.reps}`, c:C.blue},
              {l:"COMPLETADAS", v:ej.completadas,                           c:C.teal  },
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(14,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* bonus de clase */}
          {hasBonus&&(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${C.gold}0A`,
              border:`1px solid ${C.gold}33`,padding:"12px 16px"}}>
              <span style={{fontSize:20}}>✨</span>
              <div>
                <div style={{...raj(13,700),color:C.gold}}>Bonus de clase activo</div>
                <div style={{...raj(12,500),color:C.mutedL}}>
                  Tu clase {profile?.heroClass} recibe <strong style={{color:C.gold}}>+{bonusXp} XP extra</strong> en este ejercicio.
                  Total: <strong style={{color:C.gold}}>+{ej.xpBase+bonusXp} XP</strong>
                </div>
              </div>
            </div>
          )}

          {/* descripcion */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <div style={{...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em"}}>📋 DESCRIPCIÓN</div>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7}}>{ej.desc}</p>
          </div>

          {/* músculos */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>💪 MÚSCULOS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {ej.musculos.map(m=>(
                <span key={m} style={{...raj(12,600),color:catColor,background:`${catColor}12`,
                  border:`1px solid ${catColor}33`,padding:"4px 12px"}}>{m}</span>
              ))}
            </div>
          </div>

          {/* tips según verificación */}
          <div style={{background:`${ej.verif==="Cámara"?C.teal:C.blue}0A`,
            border:`1px solid ${ej.verif==="Cámara"?C.teal:C.blue}22`,padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              {ej.verif==="Cámara"?<Camera size={13} color={C.teal}/>:<Timer size={13} color={C.blue}/>}
              <span style={{...raj(12,700),color:ej.verif==="Cámara"?C.teal:C.blue}}>
                {ej.verif==="Cámara"?"Verificación por cámara":"Verificación por temporizador"}
              </span>
            </div>
            <p style={{...raj(11,400),color:C.mutedL,lineHeight:1.6}}>
              {ej.verif==="Cámara"
                ? "La cámara usará MediaPipe para detectar y contar tus repeticiones automáticamente. Asegúrate de tener buena iluminación."
                : "El temporizador empezará cuando confirmes. Mantén la app activa durante toda la sesión para que cuente correctamente."}
            </p>
          </div>

          {/* acciones */}
          {ej.bloqueado?(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${C.muted}0A`,
              border:`1px solid ${C.muted}33`,padding:"14px 16px"}}>
              <Lock size={18} color={C.muted}/>
              <div>
                <div style={{...raj(13,700),color:C.muted}}>Ejercicio bloqueado</div>
                <div style={{...raj(11,400),color:C.muted}}>Alcanza el nivel requerido para desbloquear este ejercicio.</div>
              </div>
            </div>
          ):(
            <button onClick={()=>{onClose();onStart(ej);}} className="ue-btn"
              style={{width:"100%",...px(9),color:C.bg,background:catColor,border:"none",
                padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                boxShadow:`0 6px 28px ${catColor}55`}}>
              <Play size={14} fill={C.bg}/> INICIAR SESIÓN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — SESIÓN ACTIVA
// ══════════════════════════════════════════════════════════════
function SesionModal({ej,profile,onClose,onComplete}) {
  const catColor = CATS[ej.cat]?.color || C.orange;
  const isTimer  = ej.verif==="Timer" || !ej.reps;

  // Estado de la sesión
  const [phase,    setPhase]    = useState("ready"); // ready | active | rest | done
  const [serieAct, setSerieAct] = useState(1);
  const [repsHechas,setRepsHechas]=useState(0);
  const [timerSec, setTimerSec] = useState(isTimer?(ej.duracion||30):0);
  const [restSec,  setRestSec]  = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef(null);

  const clsBonus = (profile?.heroClass==="GUERRERO"&&["Fuerza","Calistenia","Funcional"].includes(ej.cat))
    ||(profile?.heroClass==="ARQUERO"&&["Cardio","HIIT"].includes(ej.cat))
    ||(profile?.heroClass==="MAGO"&&["Flexibilidad"].includes(ej.cat));
  const xpSerie = Math.round((ej.xpBase / ej.series) * (clsBonus?1.25:1));

  // Timer countdown
  useEffect(()=>{
    if(phase==="active"&&isTimer){
      intervalRef.current=setInterval(()=>{
        setTimerSec(t=>{
          if(t<=1){ clearInterval(intervalRef.current); finishSerie(); return 0; }
          return t-1;
        });
      },1000);
    }
    if(phase==="rest"){
      intervalRef.current=setInterval(()=>{
        setRestSec(t=>{
          if(t<=1){ clearInterval(intervalRef.current); nextSerie(); return 0; }
          return t-1;
        });
      },1000);
    }
    return ()=>clearInterval(intervalRef.current);
  },[phase]);

  const startSerie = ()=>{ setPhase("active"); if(!isTimer) setRepsHechas(0); };

  const finishSerie = useCallback(()=>{
    clearInterval(intervalRef.current);
    setXpEarned(p=>p+xpSerie);
    if(serieAct>=ej.series){
      setPhase("done");
    } else {
      setPhase("rest");
      setRestSec(60);
    }
  },[serieAct,ej.series,xpSerie]);

  const nextSerie = ()=>{
    setSerieAct(s=>s+1);
    setPhase("ready");
    setTimerSec(isTimer?(ej.duracion||30):0);
    setRepsHechas(0);
  };

  const skipRest = ()=>{ clearInterval(intervalRef.current); nextSerie(); };

  // Círculo countdown SVG
  const RADIUS=54; const CIRCUM=2*Math.PI*RADIUS;
  const totalSec = isTimer?(ej.duracion||30):60;
  const currentSec = phase==="rest"?restSec:timerSec;
  const pct = currentSec/totalSec;
  const dash = CIRCUM*(1-pct);
  const timerColor = phase==="rest"?C.blue:catColor;

  // format mm:ss
  const fmt = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.9)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:480,background:C.card,
        border:`2px solid ${catColor}44`,
        boxShadow:`0 0 80px ${catColor}18,0 24px 60px rgba(0,0,0,.7)`,
        animation:"ue-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${catColor},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{ej.imagen}</span>
            <div>
              <div style={{...orb(12,900),color:C.white}}>{ej.nombre}</div>
              <div style={{...raj(11,600),color:catColor}}>
                Serie {serieAct} de {ej.series} · +{xpEarned} XP ganado
              </div>
            </div>
          </div>
          {phase!=="active"&&(
            <button onClick={onClose} className="ue-btn" style={{background:"transparent",
              border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}>
              <X size={14}/>
            </button>
          )}
        </div>

        <div style={{padding:"28px 22px",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>

          {/* ── READY ── */}
          {phase==="ready"&&(
            <div style={{textAlign:"center",animation:"ue-fadeIn .3s ease both"}}>
              <div style={{fontSize:64,marginBottom:16,animation:"ue-float 2s ease-in-out infinite"}}>{ej.imagen}</div>
              <div style={{...orb(14,900),color:C.white,marginBottom:8}}>
                {serieAct===1?"¡Prepárate!":"Siguiente serie"}
              </div>
              <div style={{...raj(13,500),color:C.muted,marginBottom:24}}>
                {isTimer?`${ej.duracion} segundos de ${ej.nombre}`:`${ej.reps} repeticiones de ${ej.nombre}`}
              </div>
              <button onClick={startSerie} className="ue-btn"
                style={{...px(9),color:C.bg,background:catColor,border:"none",
                  padding:"16px 40px",cursor:"pointer",boxShadow:`0 6px 28px ${catColor}55`,
                  display:"flex",alignItems:"center",gap:10}}>
                <Play size={14} fill={C.bg}/> {serieAct===1?"COMENZAR":"SERIE "+serieAct}
              </button>
            </div>
          )}

          {/* ── ACTIVE ── */}
          {phase==="active"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ue-fadeIn .3s ease both"}}>
              {/* Círculo timer */}
              {isTimer?(
                <div style={{position:"relative",width:148,height:148,margin:"0 auto 20px"}}>
                  <svg width={148} height={148} style={{transform:"rotate(-90deg)"}}>
                    <circle cx={74} cy={74} r={RADIUS} fill="none" stroke={`${timerColor}22`} strokeWidth={8}/>
                    <circle cx={74} cy={74} r={RADIUS} fill="none" stroke={timerColor} strokeWidth={8}
                      strokeDasharray={CIRCUM} strokeDashoffset={dash}
                      strokeLinecap="butt" style={{transition:"stroke-dashoffset .9s linear"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center"}}>
                    <div style={{...orb(28,900),color:timerColor}}>{fmt(timerSec)}</div>
                    <div style={{...px(6),color:C.muted}}>SEG</div>
                  </div>
                </div>
              ):(
                /* Contador de reps */
                <div style={{marginBottom:20}}>
                  <div style={{...orb(56,900),color:catColor,marginBottom:4,
                    textShadow:`0 0 30px ${catColor}`}}>{repsHechas}</div>
                  <div style={{...raj(13,600),color:C.muted}}>de {ej.reps} repeticiones</div>
                  <MiniBar val={repsHechas} max={ej.reps} color={catColor} height={8}/>
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:16}}>
                    <button onClick={()=>setRepsHechas(r=>Math.max(0,r-1))} className="ue-rep-btn"
                      style={{width:52,height:52,background:`${C.red}18`,border:`2px solid ${C.red}55`,
                        fontSize:24,cursor:"pointer",color:C.red,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      −
                    </button>
                    <button onClick={()=>setRepsHechas(r=>Math.min(ej.reps+5,r+1))} className="ue-rep-btn"
                      style={{width:52,height:52,background:`${C.green}18`,border:`2px solid ${C.green}55`,
                        fontSize:24,cursor:"pointer",color:C.green,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      +
                    </button>
                  </div>
                </div>
              )}

              <div style={{...raj(12,600),color:C.muted,marginBottom:20}}>Serie {serieAct} de {ej.series}</div>

              <button onClick={finishSerie} className="ue-btn"
                style={{width:"100%",...px(8),color:C.bg,background:catColor,border:"none",
                  padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 4px 20px ${catColor}55`}}>
                <Check size={14}/> {isTimer?"COMPLETADO":"SERIE TERMINADA"}
              </button>
            </div>
          )}

          {/* ── REST ── */}
          {phase==="rest"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ue-fadeIn .3s ease both"}}>
              <div style={{...raj(14,700),color:C.white,marginBottom:8}}>⏸ Descanso</div>
              <div style={{...raj(12,500),color:C.muted,marginBottom:20}}>
                Siguiente: Serie {serieAct+1} de {ej.series}
              </div>
              <div style={{position:"relative",width:120,height:120,margin:"0 auto 20px"}}>
                <svg width={120} height={120} style={{transform:"rotate(-90deg)"}}>
                  <circle cx={60} cy={60} r={44} fill="none" stroke={`${C.blue}22`} strokeWidth={7}/>
                  <circle cx={60} cy={60} r={44} fill="none" stroke={C.blue} strokeWidth={7}
                    strokeDasharray={2*Math.PI*44} strokeDashoffset={(2*Math.PI*44)*(1-restSec/60)}
                    style={{transition:"stroke-dashoffset .9s linear"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{...orb(22,900),color:C.blue}}>{restSec}s</div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={skipRest} className="ue-btn"
                  style={{...raj(12,700),color:catColor,background:"transparent",border:`1px solid ${catColor}55`,
                    padding:"10px 24px",cursor:"pointer"}}>
                  Saltar descanso →
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {phase==="done"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ue-fadeIn .3s ease both"}}>
              <div style={{fontSize:64,marginBottom:16,animation:"ue-done .6s ease both",
                filter:`drop-shadow(0 0 20px ${C.gold})`}}>🏆</div>
              <div style={{...orb(16,900),color:C.white,marginBottom:8}}>¡EJERCICIO COMPLETADO!</div>
              <div style={{...raj(13,500),color:C.muted,marginBottom:20}}>{ej.series} series de {ej.nombre}</div>

              <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,
                padding:"20px",marginBottom:20}}>
                <div style={{...orb(36,900),color:C.gold,marginBottom:4,
                  textShadow:`0 0 20px ${C.gold}`}}>+{xpEarned+xpSerie} XP</div>
                <div style={{...raj(13,600),color:C.mutedL}}>XP ganado en esta sesión</div>
                {clsBonus&&(
                  <div style={{...raj(11,600),color:C.gold,marginTop:8}}>
                    ✨ Incluye bonus de clase +25%
                  </div>
                )}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[
                  {l:"SERIES",icon:"🔁",v:`${ej.series}/${ej.series}`},
                  {l:"CATEGORÍA",icon:CATS[ej.cat]?.icon,v:ej.cat},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                    <div style={{...raj(13,700),color:C.white}}>{s.v}</div>
                    <div style={{...px(5),color:C.muted}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <button onClick={()=>onComplete(xpEarned+xpSerie)} className="ue-btn"
                style={{width:"100%",...px(8),color:C.bg,background:catColor,border:"none",
                  padding:"15px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 6px 28px ${catColor}55`}}>
                <Check size={14}/> RECLAMAR XP
              </button>
            </div>
          )}

        </div>

        {/* progress bar bottom */}
        <div style={{height:4,background:C.panel}}>
          <div style={{height:"100%",width:`${(serieAct-1)/ej.series*100+(phase==="done"?100/ej.series:0)}%`,
            background:catColor,transition:"width .4s ease"}}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function UserEjercicios({profile}) {
  const [ejercicios, setEjercicios] = useState(EJERCICIOS);
  const [catActiva,  setCatActiva]  = useState("Todos");
  const [search,     setSearch]     = useState("");
  const [filterDif,  setFilterDif]  = useState("all");
  const [filterVerif,setFilterVerif]= useState("all");
  const [sortBy,     setSortBy]     = useState("popular"); // popular|xp|nombre|completadas
  const [detalleEj,  setDetalleEj]  = useState(null);
  const [sesionEj,   setSesionEj]   = useState(null);
  const [xpNotif,    setXpNotif]    = useState(null); // { xp, x, y }

  // Clase del jugador para colores
  const clsColor = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
  const myColor  = clsColor[profile?.heroClass]||C.orange;

  // Filtrar + ordenar
  const filtered = ejercicios
    .filter(e=>{
      if(catActiva!=="Todos"&&e.cat!==catActiva) return false;
      if(search&&!e.nombre.toLowerCase().includes(search.toLowerCase())&&!e.cat.toLowerCase().includes(search.toLowerCase())) return false;
      if(filterDif!=="all"&&e.dificultad!==filterDif) return false;
      if(filterVerif!=="all"&&e.verif!==filterVerif) return false;
      return true;
    })
    .sort((a,b)=>{
      if(sortBy==="xp")          return b.xpBase-a.xpBase;
      if(sortBy==="completadas") return b.completadas-a.completadas;
      if(sortBy==="nombre")      return a.nombre.localeCompare(b.nombre);
      return b.completadas-a.completadas; // popular
    });

  const handleComplete = (xp) => {
    setSesionEj(null);
    setXpNotif(xp);
    setTimeout(()=>setXpNotif(null),2500);
    // actualizar completadas del ejercicio
    setEjercicios(prev=>prev.map(e=>e.id===sesionEj?.id?{...e,completadas:e.completadas+1}:e));
  };

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,
    background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,
    padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {detalleEj&&<DetalleModal ej={detalleEj} profile={profile} onClose={()=>setDetalleEj(null)} onStart={e=>{setDetalleEj(null);setSesionEj(e);}}/>}
      {sesionEj&&<SesionModal ej={sesionEj} profile={profile} onClose={()=>setSesionEj(null)} onComplete={handleComplete}/>}

      {/* XP notification */}
      {xpNotif&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          zIndex:400,pointerEvents:"none",
          ...orb(32,900),color:C.gold,textShadow:`0 0 30px ${C.gold}`,
          animation:"ue-xpPop 2.2s ease forwards"}}>
          +{xpNotif} XP ⚡
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* ── Header con stats personales ── */}
        <div style={{background:C.card,border:`1px solid ${myColor}33`,padding:"18px 22px",
          display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",
          animation:"ue-fadeIn .4s ease both",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg,transparent,${myColor},transparent)`}}/>
          <div style={{fontSize:36,filter:`drop-shadow(0 0 12px ${myColor})`}}>
            {{GUERRERO:"⚔️",ARQUERO:"🏃",MAGO:"🧘"}[profile?.heroClass]||"⚡"}
          </div>
          <div>
            <div style={{...orb(13,700),color:C.white,marginBottom:3}}>CATÁLOGO DE EJERCICIOS</div>
            <div style={{...raj(12,500),color:C.muted}}>{ejercicios.length} ejercicios disponibles · {ejercicios.filter(e=>e.completadas>0).length} explorados</div>
          </div>
          <div style={{display:"flex",gap:16,marginLeft:"auto",flexWrap:"wrap"}}>
            {[
              {l:"Completadas",v:ejercicios.reduce((s,e)=>s+e.completadas,0),c:C.gold},
              {l:"Desbloqueadas",v:ejercicios.filter(e=>!e.bloqueado).length,c:C.green},
              {l:"Bloqueadas",v:ejercicios.filter(e=>e.bloqueado).length,c:C.muted},
            ].map((s,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{...orb(18,900),color:s.c}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs de categoría ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,overflowX:"auto"}}>
            {Object.entries(CATS).map(([cat,m])=>{
              const on=catActiva===cat;
              const count=cat==="Todos"?ejercicios.length:ejercicios.filter(e=>e.cat===cat).length;
              return (
                <button key={cat} onClick={()=>{setCatActiva(cat);}} className="ue-filter-btn"
                  style={{flex:"0 0 auto",padding:"13px 18px",
                    background:on?`${m.color}12`:"transparent",border:"none",
                    borderBottom:`3px solid ${on?m.color:"transparent"}`,
                    color:on?m.color:C.muted,cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:80}}>
                  <div style={{fontSize:17,filter:on?`drop-shadow(0 0 5px ${m.color})`:"none"}}>{m.icon}</div>
                  <span style={{...raj(11,on?700:500),whiteSpace:"nowrap"}}>{cat}</span>
                  <span style={{...raj(9,700),color:on?m.color:C.navy,
                    background:on?`${m.color}22`:`${C.navy}44`,padding:"1px 6px"}}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {/* search */}
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
            <input className="ue-input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
              style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,
                border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
          </div>

          <span style={{...raj(11,600),color:C.muted}}>Dificultad:</span>
          {["all","Principiante","Intermedio","Avanzado","Élite"].map(v=>(
            <button key={v} onClick={()=>setFilterDif(v)} className="ue-filter-btn"
              style={fBtn(filterDif===v,DIFICULTAD_COLOR[v]||myColor)}>
              {v==="all"?"Todas":v}
            </button>
          ))}

          <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
          <span style={{...raj(11,600),color:C.muted}}>Verificación:</span>
          {[{v:"all",l:"Todas"},{v:"Cámara",l:"📷 Cámara"},{v:"Timer",l:"⏱ Timer"}].map(o=>(
            <button key={o.v} onClick={()=>setFilterVerif(o.v)} className="ue-filter-btn"
              style={fBtn(filterVerif===o.v,o.v==="Cámara"?C.teal:o.v==="Timer"?C.blue:myColor)}>
              {o.l}
            </button>
          ))}

          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{...raj(11,600),color:C.muted}}>Ordenar:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:"7px 12px",background:C.panel,border:`1px solid ${C.navy}`,
                color:C.muted,...raj(12,500),cursor:"pointer",outline:"none"}}>
              <option value="popular">Más populares</option>
              <option value="xp">Mayor XP</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="completadas">Mis completados</option>
            </select>
          </div>
        </div>

        {/* resultado */}
        <div style={{...raj(12,500),color:C.muted}}>
          {filtered.length} ejercicio{filtered.length!==1?"s":""} encontrado{filtered.length!==1?"s":""}
        </div>

        {/* ── Grid de ejercicios ── */}
        {filtered.length===0?(
          <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
            <div style={{fontSize:48,marginBottom:12,opacity:.4}}>🔍</div>
            <div style={{...raj(14,600),color:C.muted}}>No se encontraron ejercicios con esos filtros.</div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
            {filtered.map((ej,i)=>{
              const c  = CATS[ej.cat]?.color||C.orange;
              const dc = DIFICULTAD_COLOR[ej.dificultad]||C.muted;
              const hasBonus=(profile?.heroClass==="GUERRERO"&&["Fuerza","Calistenia","Funcional"].includes(ej.cat))
                ||(profile?.heroClass==="ARQUERO"&&["Cardio","HIIT"].includes(ej.cat))
                ||(profile?.heroClass==="MAGO"&&["Flexibilidad"].includes(ej.cat));
              return (
                <div key={ej.id} className="ue-card"
                  onClick={()=>setDetalleEj(ej)}
                  style={{background:C.card,border:`1px solid ${ej.bloqueado?C.muted+"22":c+"22"}`,
                    boxShadow:"0 4px 16px rgba(0,0,0,.35)",overflow:"hidden",
                    animation:`ue-cardIn .4s ease ${i*.04}s both`,position:"relative",
                    opacity:ej.bloqueado?.6:1}}>
                  <div className="ue-card-shine"/>
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${ej.bloqueado?C.muted:c},transparent)`}}/>

                  <div style={{padding:"16px 16px 0"}}>
                    {/* header */}
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                      <div style={{width:52,height:52,background:`${c}18`,border:`2px solid ${c}${ej.bloqueado?"22":"44"}`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,
                        filter:ej.bloqueado?"blur(4px)":undefined}}>
                        {ej.bloqueado?<Lock size={22} color={C.muted}/>:ej.imagen}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{...raj(13,700),color:ej.bloqueado?C.muted:C.white,marginBottom:4,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {ej.bloqueado?"??? BLOQUEADO ???":ej.nombre}
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 7px"}}>
                            {CATS[ej.cat]?.icon} {ej.cat}
                          </span>
                          <span style={{...raj(10,700),color:dc,background:`${dc}14`,border:`1px solid ${dc}33`,padding:"2px 7px"}}>
                            {ej.dificultad}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* descripción truncada */}
                    {!ej.bloqueado&&(
                      <p style={{...raj(11,400),color:C.muted,lineHeight:1.5,marginBottom:12,
                        display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                        {ej.desc}
                      </p>
                    )}
                    {ej.bloqueado&&(
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,...raj(12,600),color:C.muted}}>
                        <Lock size={13}/> Requiere nivel mayor para desbloquear
                      </div>
                    )}

                    {/* músculos chips */}
                    {!ej.bloqueado&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
                        {ej.musculos.slice(0,3).map(m=>(
                          <span key={m} style={{...raj(9,600),color:C.muted,background:`${C.muted}12`,
                            border:`1px solid ${C.muted}22`,padding:"1px 6px"}}>{m}</span>
                        ))}
                      </div>
                    )}

                    {/* stats row */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                      <div style={{background:C.panel,border:`1px solid ${C.gold}18`,padding:"7px 6px",textAlign:"center"}}>
                        <div style={{...raj(13,700),color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                          +{ej.xpBase}
                          {hasBonus&&<span style={{fontSize:10}}>✨</span>}
                        </div>
                        <div style={{...px(4),color:C.muted}}>XP</div>
                      </div>
                      <div style={{background:C.panel,border:`1px solid ${c}18`,padding:"7px 6px",textAlign:"center"}}>
                        <div style={{...raj(12,700),color:c}}>
                          {ej.duracion?`${ej.duracion}s`:`${ej.series}×${ej.reps}`}
                        </div>
                        <div style={{...px(4),color:C.muted}}>
                          {ej.duracion?"DUR":"SERIES"}
                        </div>
                      </div>
                      <div style={{background:C.panel,border:`1px solid ${ej.verif==="Cámara"?C.teal:C.blue}18`,padding:"7px 6px",textAlign:"center"}}>
                        <div style={{fontSize:14}}>{ej.verif==="Cámara"?"📷":"⏱"}</div>
                        <div style={{...px(4),color:C.muted}}>{ej.verif}</div>
                      </div>
                    </div>

                    {/* completadas bar */}
                    {ej.completadas>0&&!ej.bloqueado&&(
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{...raj(10,500),color:C.muted}}>Completadas</span>
                          <span style={{...raj(10,700),color:c}}>{ej.completadas}×</span>
                        </div>
                        <MiniBar val={ej.completadas} max={20} color={c} height={4}/>
                      </div>
                    )}
                  </div>

                  {/* footer action */}
                  <div style={{borderTop:`1px solid ${C.navy}22`,marginTop:8,
                    padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:ej.bloqueado?`${C.muted}06`:`${c}06`}}>
                    <span style={{...raj(11,600),color:ej.bloqueado?C.muted:c}}>
                      {ej.bloqueado?"🔒 Bloqueado":ej.completadas>0?`✓ ${ej.completadas} veces completado`:"Sin completar"}
                    </span>
                    {!ej.bloqueado&&(
                      <div style={{display:"flex",alignItems:"center",gap:5,...raj(11,700),color:c}}>
                        VER <ChevronRight size={13}/>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}