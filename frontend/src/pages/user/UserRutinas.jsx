// src/pages/user/UserRutinas.jsx
// ─────────────────────────────────────────────────────────────
//  Página de rutinas del jugador.
//  Explora, filtra e inicia rutinas completas con flujo paso a paso.
//  Props: profile (objeto del usuario)
//  Conectar: getRutinas(), iniciarRutina(), completarRutina()
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Play, X, Check, ChevronRight, ChevronLeft,
  Clock, Zap, Flame, Star, Camera, Timer as TimerIcon,
  RotateCcw, Award, TrendingUp, Lock, Calendar,
  ClipboardList, Dumbbell, SkipForward, Pause, PlayCircle,
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
  @keyframes ur-fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ur-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes ur-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ur-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ur-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ur-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ur-xpPop   { 0%{opacity:0;transform:translateY(0) scale(.6)} 50%{opacity:1;transform:translateY(-50px) scale(1.2)} 100%{opacity:0;transform:translateY(-100px) scale(1)} }
  @keyframes ur-done    { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ur-stepIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ur-shine   { 0%{left:-100%} 100%{left:200%} }
  @keyframes ur-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes ur-ring    { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }

  .ur-card  { transition:all .22s; cursor:pointer; }
  .ur-card:hover  { transform:translateY(-4px) !important; box-shadow:0 16px 44px rgba(0,0,0,.5) !important; }
  .ur-card:hover .ur-shine { animation:ur-shine .6s ease; }
  .ur-shine { position:absolute;top:0;left:-100%;width:50%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);pointer-events:none; }
  .ur-btn   { transition:all .2s; cursor:pointer; }
  .ur-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ur-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .ur-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .ur-input::placeholder { color:${C.navy}; }
  .ur-filter-btn { transition:all .2s; cursor:pointer; }
  .ur-filter-btn:hover { opacity:.85; }
  .ur-step-item { transition:all .2s; cursor:pointer; }
  .ur-step-item:hover { background:${C.navyL}28 !important; }
  .ur-rep-btn { transition:all .12s; user-select:none; cursor:pointer; }
  .ur-rep-btn:hover { opacity:.8; }
  .ur-rep-btn:active { transform:scale(.92); }
  .ur-tab-btn { transition:all .2s; cursor:pointer; }
  .ur-tab-btn:hover { opacity:.8; }
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Categorías con colores ─────────────────────────────────────
const CAT_META = {
  Fuerza:       { color:C.orange, icon:"⚔️", subs:["Calistenia","Pesas","Funcional","Explosiva","Hipertrofia"] },
  Cardio:       { color:C.blue,   icon:"🏃", subs:["HIIT","Continuo","Intervalos","Aeróbico"] },
  Flexibilidad: { color:C.purple, icon:"🧘", subs:["Yoga","Pilates","Stretching","Movilidad"] },
};
const DIFICULTAD_COLOR = {
  Principiante:C.green, Intermedio:C.gold, Avanzado:C.orange, Élite:C.red
};
const DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// ── Mock rutinas ───────────────────────────────────────────────
const RUTINAS = [
  {
    id:"r1", nombre:"Guerrero del Hierro", categoria:"Fuerza", subcategoria:"Hipertrofia",
    dificultad:"Avanzado", duracionMin:55, diasSemana:["Lun","Mié","Vie"],
    objetivo:"Ganar músculo", xpTotal:220, imagen:"⚔️",
    completadas:5, completadaHoy:false, asignada:true,
    descripcion:"Rutina de hipertrofia de 3 días para máximo crecimiento muscular. Enfocada en ejercicios compuestos.",
    pasos:[
      { id:"p1", nombre:"Plancha",     imagen:"🏋️", series:3, reps:null, duracion:60,  descanso:30,  verif:"Timer",  xp:40  },
      { id:"p2", nombre:"Flexiones",   imagen:"💪", series:4, reps:15,   duracion:null,descanso:60,  verif:"Cámara", xp:30  },
      { id:"p3", nombre:"Press Militar",imagen:"🏋️",series:4, reps:10,   duracion:null,descanso:90,  verif:"Cámara", xp:45  },
      { id:"p4", nombre:"Sentadillas", imagen:"🦵", series:4, reps:12,   duracion:null,descanso:90,  verif:"Cámara", xp:35  },
      { id:"p5", nombre:"Dominadas",   imagen:"🔝", series:3, reps:8,    duracion:null,descanso:90,  verif:"Cámara", xp:55  },
    ],
  },
  {
    id:"r2", nombre:"Sprint y Fuego",    categoria:"Cardio", subcategoria:"HIIT",
    dificultad:"Avanzado", duracionMin:30, diasSemana:["Mar","Jue","Sáb"],
    objetivo:"Perder peso", xpTotal:310, imagen:"⚡",
    completadas:3, completadaHoy:false, asignada:true,
    descripcion:"HIIT de alta intensidad para quema de grasa máxima. Intervalos explosivos que elevan el metabolismo.",
    pasos:[
      { id:"p1", nombre:"HIIT Explosivo",imagen:"⚡", series:6, reps:null,duracion:20,descanso:10, verif:"Timer",  xp:90 },
      { id:"p2", nombre:"Burpees",       imagen:"💥", series:4, reps:10, duracion:null,descanso:30, verif:"Cámara",xp:70 },
      { id:"p3", nombre:"Cardio Libre",  imagen:"🏃", series:1, reps:null,duracion:10,descanso:0,  verif:"Timer",  xp:60 },
    ],
  },
  {
    id:"r3", nombre:"Alma Zen",          categoria:"Flexibilidad", subcategoria:"Yoga",
    dificultad:"Principiante", duracionMin:40, diasSemana:["Lun","Mié","Vie","Dom"],
    objetivo:"Mejorar flexibilidad", xpTotal:130, imagen:"🧘",
    completadas:8, completadaHoy:true, asignada:true,
    descripcion:"Rutina de yoga para mejorar flexibilidad y calmar la mente. Perfecta para empezar o terminar el día.",
    pasos:[
      { id:"p1", nombre:"Yoga Matutino",  imagen:"🧘", series:1, reps:null,duracion:20,descanso:0, verif:"Timer", xp:45 },
      { id:"p2", nombre:"Estiramiento",   imagen:"🤸", series:1, reps:null,duracion:15,descanso:0, verif:"Timer", xp:20 },
      { id:"p3", nombre:"Pilates Core",   imagen:"🧘", series:1, reps:null,duracion:5, descanso:0, verif:"Timer", xp:35 },
    ],
  },
  {
    id:"r4", nombre:"Calistenia Total",  categoria:"Fuerza", subcategoria:"Calistenia",
    dificultad:"Intermedio", duracionMin:45, diasSemana:["Mar","Jue","Sáb"],
    objetivo:"Tonificar", xpTotal:185, imagen:"💪",
    completadas:2, completadaHoy:false, asignada:false,
    descripcion:"Rutina completa de calistenia usando solo el peso corporal. Sin equipo necesario.",
    pasos:[
      { id:"p1", nombre:"Flexiones",    imagen:"💪", series:4, reps:15,duracion:null,descanso:60, verif:"Cámara",xp:30 },
      { id:"p2", nombre:"Dominadas",    imagen:"🔝", series:3, reps:8, duracion:null,descanso:90, verif:"Cámara",xp:55 },
      { id:"p3", nombre:"Fondos",       imagen:"💪", series:3, reps:12,duracion:null,descanso:60, verif:"Cámara",xp:55 },
      { id:"p4", nombre:"Sentadillas",  imagen:"🦵", series:4, reps:15,duracion:null,descanso:60, verif:"Cámara",xp:35 },
    ],
  },
  {
    id:"r5", nombre:"Cardio Matutino",   categoria:"Cardio", subcategoria:"Aeróbico",
    dificultad:"Principiante", duracionMin:35, diasSemana:["Lun","Mié","Vie"],
    objetivo:"Mejorar resistencia", xpTotal:100, imagen:"🌅",
    completadas:0, completadaHoy:false, asignada:false,
    descripcion:"Cardio suave para comenzar el día con energía y activar el metabolismo.",
    pasos:[
      { id:"p1", nombre:"Cardio Libre", imagen:"🏃", series:1, reps:null,duracion:30,descanso:0, verif:"Timer", xp:60 },
      { id:"p2", nombre:"Estiramiento",imagen:"🤸",  series:1, reps:null,duracion:5, descanso:0, verif:"Timer", xp:20 },
    ],
  },
  {
    id:"r6", nombre:"Movilidad Diaria",  categoria:"Flexibilidad", subcategoria:"Movilidad",
    dificultad:"Principiante", duracionMin:25, diasSemana:["Lun","Mar","Mié","Jue","Vie"],
    objetivo:"Mejorar postura", xpTotal:80, imagen:"🤸",
    completadas:12, completadaHoy:false, asignada:false,
    descripcion:"Rutina diaria de movilidad articular. Solo 25 minutos para mejorar tu postura y reducir dolores.",
    pasos:[
      { id:"p1", nombre:"Estiramiento",  imagen:"🤸", series:1, reps:null,duracion:15,descanso:0, verif:"Timer", xp:20 },
      { id:"p2", nombre:"Yoga Matutino", imagen:"🧘", series:1, reps:null,duracion:10,descanso:0, verif:"Timer", xp:45 },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────
function MiniBar({val,max,color,height=5}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,boxShadow:`0 0 5px ${color}66`,
        "--bw":`${pct}%`,animation:"ur-barFill .8s ease both"}}/>
    </div>
  );
}
function DiaChips({dias,color,small=false}) {
  return (
    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
      {DIAS.map(d=>{const on=dias.includes(d);return(
        <span key={d} style={{...raj(small?8:10,on?700:500),color:on?color:C.navy,
          background:on?`${color}18`:"transparent",border:`1px solid ${on?color:C.navy}`,
          padding:small?"1px 4px":"2px 6px"}}>{d}</span>
      );})}
    </div>
  );
}
function fmt(s){return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}

// ── Bonus de clase ─────────────────────────────────────────────
function hasClsBonus(heroClass, cat) {
  return (heroClass==="GUERRERO"&&["Fuerza","Calistenia","Funcional","Hipertrofia","Explosiva"].includes(cat))
    ||(heroClass==="ARQUERO"&&["Cardio","HIIT","Aeróbico","Intervalos"].includes(cat))
    ||(heroClass==="MAGO"&&["Flexibilidad","Yoga","Pilates","Stretching","Movilidad"].includes(cat));
}

// ══════════════════════════════════════════════════════════════
//  MODAL — DETALLE DE RUTINA
// ══════════════════════════════════════════════════════════════
function DetalleModal({rutina, profile, onClose, onStart}) {
  const catMeta = CAT_META[rutina.categoria]||{};
  const c = catMeta.color||C.orange;
  const bonus = hasClsBonus(profile?.heroClass, rutina.subcategoria||rutina.categoria);
  const xpFinal = bonus ? Math.round(rutina.xpTotal*1.25) : rutina.xpTotal;

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.82)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:580,background:C.card,border:`2px solid ${c}44`,
        boxShadow:`0 0 60px ${c}18,0 24px 60px rgba(0,0,0,.6)`,
        animation:"ur-modalIn .25s ease both",overflow:"hidden",
        display:"flex",flexDirection:"column",maxHeight:"92vh"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`,flexShrink:0}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"18px 22px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,background:`${c}18`,border:`2px solid ${c}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
              animation:"ur-float 2.5s ease-in-out infinite"}}>{rutina.imagen}</div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:5}}>{rutina.nombre}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 8px"}}>{catMeta.icon} {rutina.categoria}</span>
                <span style={{...raj(10,700),color:c,background:`${c}0A`,border:`1px solid ${c}22`,padding:"2px 8px"}}>{rutina.subcategoria}</span>
                <span style={{...raj(10,700),color:DIFICULTAD_COLOR[rutina.dificultad]||C.muted,
                  background:`${DIFICULTAD_COLOR[rutina.dificultad]||C.muted}14`,
                  border:`1px solid ${DIFICULTAD_COLOR[rutina.dificultad]||C.muted}33`,padding:"2px 8px"}}>
                  {rutina.dificultad}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="ur-btn" style={{background:"transparent",
            border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}>
            <X size={15}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:22,display:"flex",flexDirection:"column",gap:16}}>
          {/* stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {l:"XP TOTAL",   v:`+${xpFinal}`, c:C.gold  },
              {l:"EJERCICIOS", v:rutina.pasos.length, c:c },
              {l:"DURACIÓN",   v:`${rutina.duracionMin}min`, c:C.blue },
              {l:"COMPLETADAS",v:`${rutina.completadas}×`, c:C.teal },
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(14,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* bonus */}
          {bonus&&(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${C.gold}0A`,
              border:`1px solid ${C.gold}33`,padding:"12px 16px"}}>
              <span style={{fontSize:20}}>✨</span>
              <div>
                <div style={{...raj(13,700),color:C.gold}}>Bonus de clase activo</div>
                <div style={{...raj(12,500),color:C.mutedL}}>
                  Tu clase {profile?.heroClass} recibe <strong style={{color:C.gold}}>+25% XP</strong> en esta rutina.
                  Total: <strong style={{color:C.gold}}>+{xpFinal} XP</strong>
                </div>
              </div>
            </div>
          )}

          {/* descripcion + dias */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7,marginBottom:12}}>{rutina.descripcion}</p>
            <div style={{...raj(11,600),color:C.muted,marginBottom:8}}>🎯 Objetivo: <span style={{color:c}}>{rutina.objetivo}</span></div>
            <DiaChips dias={rutina.diasSemana} color={c}/>
          </div>

          {/* pasos */}
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📋 EJERCICIOS DE LA RUTINA</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {rutina.pasos.map((p,i)=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,background:C.panel,
                  border:`1px solid ${c}22`,padding:"11px 14px"}}>
                  <div style={{...orb(11,900),color:c,minWidth:22,textAlign:"center"}}>#{i+1}</div>
                  <span style={{fontSize:20}}>{p.imagen}</span>
                  <div style={{flex:1}}>
                    <div style={{...raj(13,700),color:C.white}}>{p.nombre}</div>
                    <div style={{...raj(11,500),color:C.muted}}>
                      {p.duracion?`${p.series} × ${p.duracion}s`:`${p.series} × ${p.reps} reps`}
                      {p.descanso>0&&` · ⏱ ${p.descanso}s descanso`}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{...raj(10,600),color:p.verif==="Cámara"?C.teal:C.blue,
                      background:`${p.verif==="Cámara"?C.teal:C.blue}14`,
                      border:`1px solid ${p.verif==="Cámara"?C.teal:C.blue}33`,
                      padding:"1px 7px",display:"inline-flex",alignItems:"center",gap:3}}>
                      {p.verif==="Cámara"?<Camera size={9}/>:<TimerIcon size={9}/>} {p.verif}
                    </span>
                    <span style={{...raj(11,700),color:C.gold}}>+{p.xp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* hoy ya completada */}
          {rutina.completadaHoy?(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${C.green}0A`,
              border:`1px solid ${C.green}33`,padding:"14px 16px"}}>
              <Check size={18} color={C.green}/>
              <div>
                <div style={{...raj(13,700),color:C.green}}>¡Ya completaste esta rutina hoy!</div>
                <div style={{...raj(11,400),color:C.muted}}>Vuelve mañana para seguir tu progreso.</div>
              </div>
            </div>
          ):(
            <button onClick={()=>{onClose();onStart(rutina);}} className="ur-btn"
              style={{width:"100%",...px(9),color:C.bg,background:c,border:"none",
                padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                boxShadow:`0 6px 28px ${c}55`}}>
              <PlayCircle size={15}/> INICIAR RUTINA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — SESIÓN DE RUTINA COMPLETA
// ══════════════════════════════════════════════════════════════
function SesionRutinaModal({rutina, profile, onClose, onComplete}) {
  const catMeta  = CAT_META[rutina.categoria]||{};
  const c        = catMeta.color||C.orange;
  const bonus    = hasClsBonus(profile?.heroClass, rutina.subcategoria||rutina.categoria);
  const totalEj  = rutina.pasos.length;

  const [ejIdx,    setEjIdx]    = useState(0);   // paso actual (0-based)
  const [fase,     setFase]     = useState("intro"); // intro | ready | active | rest | nextEj | done
  const [serieAct, setSerieAct] = useState(1);
  const [repsHechas,setRepsHechas]=useState(0);
  const [timerSec, setTimerSec] = useState(0);
  const [restSec,  setRestSec]  = useState(0);
  const [xpTotal,  setXpTotal]  = useState(0);
  const [completedEjs, setCompletedEjs] = useState([]);
  const intervalRef = useRef(null);

  const paso    = rutina.pasos[ejIdx]||rutina.pasos[0];
  const isTimer = paso.verif==="Timer"||!paso.reps;
  const xpSerie = Math.round((paso.xp/paso.series)*(bonus?1.25:1));

  // Reset al cambiar ejercicio
  useEffect(()=>{
    setSerieAct(1);
    setRepsHechas(0);
    setTimerSec(isTimer?(paso.duracion||30):0);
  },[ejIdx]);

  // Intervalo timer
  useEffect(()=>{
    clearInterval(intervalRef.current);
    if(fase==="active"&&isTimer){
      intervalRef.current=setInterval(()=>{
        setTimerSec(t=>{if(t<=1){clearInterval(intervalRef.current);finishSerie();return 0;}return t-1;});
      },1000);
    }
    if(fase==="rest"){
      intervalRef.current=setInterval(()=>{
        setRestSec(t=>{if(t<=1){clearInterval(intervalRef.current);nextSerieOrEj();return 0;}return t-1;});
      },1000);
    }
    return()=>clearInterval(intervalRef.current);
  },[fase]);

  const finishSerie = useCallback(()=>{
    clearInterval(intervalRef.current);
    setXpTotal(p=>p+xpSerie);
    if(serieAct>=paso.series){
      // ejercicio terminado
      setCompletedEjs(p=>[...p,paso.id]);
      if(ejIdx>=totalEj-1){
        setFase("done");
      } else {
        setFase("nextEj");
      }
    } else {
      setFase("rest");
      setRestSec(paso.descanso||60);
    }
  },[serieAct,paso,ejIdx,totalEj,xpSerie]);

  const nextSerieOrEj=()=>{
    setSerieAct(s=>s+1);
    setTimerSec(isTimer?(paso.duracion||30):0);
    setRepsHechas(0);
    setFase("ready");
  };

  const goNextEj=()=>{
    setEjIdx(i=>i+1);
    setFase("ready");
  };

  const skipRest=()=>{clearInterval(intervalRef.current);nextSerieOrEj();};

  // Círculo SVG
  const RADIUS=54; const CIRCUM=2*Math.PI*RADIUS;
  const totalSec=isTimer?(paso.duracion||30):60;
  const currentSec=fase==="rest"?restSec:timerSec;
  const pct=currentSec/totalSec;
  const timerColor=fase==="rest"?C.blue:c;

  // progreso general de la rutina
  const rutinaProgress = Math.round(((ejIdx+(fase==="done"?1:0))/totalEj)*100);

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.92)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{width:"100%",maxWidth:520,background:C.card,
        border:`2px solid ${c}44`,
        boxShadow:`0 0 80px ${c}18,0 24px 60px rgba(0,0,0,.7)`,
        animation:"ur-modalIn .25s ease both",overflow:"hidden",
        display:"flex",flexDirection:"column",maxHeight:"96vh"}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`,flexShrink:0}}/>

        {/* header con progreso */}
        <div style={{flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{rutina.imagen}</span>
              <div>
                <div style={{...orb(11,900),color:C.white}}>{rutina.nombre}</div>
                <div style={{...raj(11,600),color:c}}>
                  {fase==="done"?"COMPLETADA":fase==="intro"?"Preparándose...":
                    fase==="nextEj"?`Siguiente: ${rutina.pasos[ejIdx+1]?.nombre||""}`:
                    `Ejercicio ${ejIdx+1}/${totalEj} · Serie ${serieAct}/${paso.series}`}
                </div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{...raj(12,700),color:C.gold}}>+{xpTotal} XP</div>
              {fase!=="active"&&(
                <button onClick={onClose} className="ur-btn" style={{background:"transparent",
                  border:`1px solid ${C.navy}`,padding:6,color:C.muted,display:"flex"}}>
                  <X size={13}/>
                </button>
              )}
            </div>
          </div>

          {/* barra progreso rutina */}
          <div style={{height:6,background:C.panel}}>
            <div style={{height:"100%",width:`${rutinaProgress}%`,background:c,
              transition:"width .6s ease",boxShadow:`0 0 8px ${c}66`}}/>
          </div>

          {/* pasos dots */}
          <div style={{display:"flex",gap:4,padding:"10px 20px",
            borderBottom:`1px solid ${C.navy}`,alignItems:"center",justifyContent:"center"}}>
            {rutina.pasos.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:4}}>
                <div title={p.nombre}
                  style={{width:i===ejIdx?32:22,height:22,
                    background:completedEjs.includes(p.id)?C.green:i===ejIdx?c:`${C.navy}66`,
                    border:`1px solid ${completedEjs.includes(p.id)?C.green:i===ejIdx?c:C.navy}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:completedEjs.includes(p.id)?12:10,
                    transition:"all .3s",
                    boxShadow:i===ejIdx?`0 0 8px ${c}66`:completedEjs.includes(p.id)?`0 0 6px ${C.green}44`:"none"}}>
                  {completedEjs.includes(p.id)?"✓":p.imagen}
                </div>
                {i<rutina.pasos.length-1&&(
                  <div style={{width:10,height:2,background:completedEjs.includes(p.id)?C.green:C.navy,transition:"background .3s"}}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* body */}
        <div style={{flex:1,overflowY:"auto",padding:"24px 22px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>

          {/* ── INTRO ── */}
          {fase==="intro"&&(
            <div style={{textAlign:"center",animation:"ur-fadeIn .3s ease both",width:"100%"}}>
              <div style={{fontSize:60,marginBottom:16,animation:"ur-float 2s ease-in-out infinite",
                filter:`drop-shadow(0 0 20px ${c})`}}>{rutina.imagen}</div>
              <div style={{...orb(16,900),color:C.white,marginBottom:6}}>{rutina.nombre}</div>
              <div style={{...raj(13,500),color:C.muted,marginBottom:24,lineHeight:1.5}}>
                {totalEj} ejercicios · {rutina.duracionMin} min · +{bonus?Math.round(rutina.xpTotal*1.25):rutina.xpTotal} XP
              </div>
              {bonus&&(
                <div style={{...raj(12,600),color:C.gold,background:`${C.gold}0A`,
                  border:`1px solid ${C.gold}33`,padding:"8px 16px",marginBottom:20,display:"inline-block"}}>
                  ✨ Bonus de clase +25% activo
                </div>
              )}
              {/* mini lista pasos */}
              <div style={{textAlign:"left",marginBottom:24}}>
                {rutina.pasos.map((p,i)=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",
                    borderBottom:`1px solid ${C.navy}22`,animation:`ur-fadeIn .3s ease ${i*.07}s both`}}>
                    <span style={{...orb(10,900),color:c,minWidth:20}}>#{i+1}</span>
                    <span style={{fontSize:18}}>{p.imagen}</span>
                    <span style={{...raj(12,700),color:C.white,flex:1}}>{p.nombre}</span>
                    <span style={{...raj(11,600),color:C.muted}}>
                      {p.duracion?`${p.series}×${p.duracion}s`:`${p.series}×${p.reps}`}
                    </span>
                    <span style={{...raj(11,700),color:C.gold}}>+{p.xp}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>setFase("ready")} className="ur-btn"
                style={{width:"100%",...px(9),color:C.bg,background:c,border:"none",
                  padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 6px 28px ${c}55`}}>
                <PlayCircle size={15}/> ¡EMPEZAR!
              </button>
            </div>
          )}

          {/* ── READY ── */}
          {fase==="ready"&&(
            <div style={{textAlign:"center",width:"100%",animation:"ur-stepIn .3s ease both"}}>
              <div style={{...raj(12,600),color:C.muted,marginBottom:6}}>
                Ejercicio {ejIdx+1} de {totalEj}
              </div>
              <div style={{fontSize:64,marginBottom:12,animation:"ur-float 2s ease-in-out infinite",
                filter:`drop-shadow(0 0 18px ${c})`}}>{paso.imagen}</div>
              <div style={{...orb(16,900),color:C.white,marginBottom:4}}>{paso.nombre}</div>
              <div style={{...raj(12,500),color:C.muted,marginBottom:8}}>
                Serie {serieAct} de {paso.series}
              </div>
              <div style={{...raj(14,700),color:c,marginBottom:24}}>
                {isTimer?`${paso.duracion} segundos`:`${paso.reps} repeticiones`}
              </div>
              {/* verif badge */}
              <div style={{...raj(11,600),color:paso.verif==="Cámara"?C.teal:C.blue,
                background:`${paso.verif==="Cámara"?C.teal:C.blue}14`,
                border:`1px solid ${paso.verif==="Cámara"?C.teal:C.blue}33`,
                padding:"6px 14px",display:"inline-flex",alignItems:"center",gap:6,marginBottom:24}}>
                {paso.verif==="Cámara"?<Camera size={12}/>:<TimerIcon size={12}/>}
                Verificación por {paso.verif}
              </div>
              <button onClick={()=>{setTimerSec(isTimer?(paso.duracion||30):0);setFase("active");}}
                className="ur-btn"
                style={{width:"100%",...px(9),color:C.bg,background:c,border:"none",
                  padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 6px 28px ${c}55`}}>
                <PlayCircle size={15}/> INICIAR
              </button>
            </div>
          )}

          {/* ── ACTIVE ── */}
          {fase==="active"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ur-stepIn .3s ease both"}}>
              <div style={{...raj(12,600),color:C.muted,marginBottom:6}}>
                {paso.nombre} · Serie {serieAct}/{paso.series}
              </div>

              {isTimer?(
                <div style={{position:"relative",width:148,height:148,margin:"0 auto 20px"}}>
                  <svg width={148} height={148} style={{transform:"rotate(-90deg)"}}>
                    <circle cx={74} cy={74} r={RADIUS} fill="none" stroke={`${timerColor}22`} strokeWidth={8}/>
                    <circle cx={74} cy={74} r={RADIUS} fill="none" stroke={timerColor} strokeWidth={8}
                      strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM*(1-pct)}
                      style={{transition:"stroke-dashoffset .9s linear"}}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center"}}>
                    <div style={{...orb(28,900),color:timerColor}}>{fmt(timerSec)}</div>
                    <div style={{...px(6),color:C.muted}}>SEG</div>
                  </div>
                </div>
              ):(
                <div style={{marginBottom:20}}>
                  <div style={{...orb(60,900),color:c,textShadow:`0 0 30px ${c}`}}>{repsHechas}</div>
                  <div style={{...raj(13,600),color:C.muted,marginBottom:8}}>de {paso.reps} repeticiones</div>
                  <MiniBar val={repsHechas} max={paso.reps} color={c} height={8}/>
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:16}}>
                    <button onClick={()=>setRepsHechas(r=>Math.max(0,r-1))} className="ur-rep-btn"
                      style={{width:52,height:52,background:`${C.red}18`,border:`2px solid ${C.red}55`,
                        fontSize:24,cursor:"pointer",color:C.red,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      −
                    </button>
                    <button onClick={()=>setRepsHechas(r=>r+1)} className="ur-rep-btn"
                      style={{width:52,height:52,background:`${C.green}18`,border:`2px solid ${C.green}55`,
                        fontSize:24,cursor:"pointer",color:C.green,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      +
                    </button>
                  </div>
                </div>
              )}

              <button onClick={finishSerie} className="ur-btn"
                style={{width:"100%",...px(8),color:C.bg,background:c,border:"none",
                  padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 4px 20px ${c}55`}}>
                <Check size={14}/> {isTimer?"COMPLETADO":"SERIE TERMINADA"}
              </button>
            </div>
          )}

          {/* ── REST ── */}
          {fase==="rest"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ur-stepIn .3s ease both"}}>
              <div style={{...raj(13,700),color:C.white,marginBottom:4}}>⏸ Descanso</div>
              <div style={{...raj(11,500),color:C.muted,marginBottom:16}}>
                Serie {serieAct+1} de {paso.series} en: {paso.nombre}
              </div>
              <div style={{position:"relative",width:120,height:120,margin:"0 auto 20px"}}>
                <svg width={120} height={120} style={{transform:"rotate(-90deg)"}}>
                  <circle cx={60} cy={60} r={44} fill="none" stroke={`${C.blue}22`} strokeWidth={7}/>
                  <circle cx={60} cy={60} r={44} fill="none" stroke={C.blue} strokeWidth={7}
                    strokeDasharray={2*Math.PI*44}
                    strokeDashoffset={(2*Math.PI*44)*(1-restSec/(paso.descanso||60))}
                    style={{transition:"stroke-dashoffset .9s linear"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{...orb(22,900),color:C.blue}}>{restSec}s</div>
                </div>
              </div>
              <button onClick={skipRest} className="ur-btn"
                style={{...raj(12,700),color:c,background:"transparent",border:`1px solid ${c}55`,
                  padding:"10px 24px",cursor:"pointer"}}>
                Saltar descanso →
              </button>
            </div>
          )}

          {/* ── NEXT EJERCICIO ── */}
          {fase==="nextEj"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ur-stepIn .3s ease both"}}>
              <div style={{...raj(12,600),color:C.green,marginBottom:8}}>
                ✓ {paso.nombre} completado
              </div>
              <div style={{fontSize:56,marginBottom:12,animation:"ur-float 2s ease-in-out infinite",
                filter:`drop-shadow(0 0 16px ${c})`}}>
                {rutina.pasos[ejIdx+1]?.imagen}
              </div>
              <div style={{...orb(14,900),color:C.white,marginBottom:4}}>
                Siguiente ejercicio
              </div>
              <div style={{...raj(16,700),color:c,marginBottom:4}}>
                {rutina.pasos[ejIdx+1]?.nombre}
              </div>
              <div style={{...raj(12,500),color:C.muted,marginBottom:20}}>
                {rutina.pasos[ejIdx+1]?.duracion
                  ?`${rutina.pasos[ejIdx+1].series} × ${rutina.pasos[ejIdx+1].duracion}s`
                  :`${rutina.pasos[ejIdx+1]?.series} × ${rutina.pasos[ejIdx+1]?.reps} reps`}
                {" · "}{ejIdx+2}/{totalEj}
              </div>
              <div style={{...raj(13,700),color:C.gold,marginBottom:20}}>
                XP acumulado: +{xpTotal}
              </div>
              <button onClick={goNextEj} className="ur-btn"
                style={{width:"100%",...px(9),color:C.bg,background:c,border:"none",
                  padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 6px 28px ${c}55`}}>
                <PlayCircle size={15}/> CONTINUAR
              </button>
            </div>
          )}

          {/* ── DONE ── */}
          {fase==="done"&&(
            <div style={{width:"100%",textAlign:"center",animation:"ur-fadeIn .3s ease both"}}>
              <div style={{fontSize:64,marginBottom:16,animation:"ur-done .6s ease both",
                filter:`drop-shadow(0 0 24px ${C.gold})`}}>🏆</div>
              <div style={{...orb(18,900),color:C.white,marginBottom:6}}>¡RUTINA COMPLETADA!</div>
              <div style={{...raj(13,500),color:C.muted,marginBottom:20}}>{rutina.nombre}</div>

              <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}44`,padding:"22px",marginBottom:20}}>
                <div style={{...orb(40,900),color:C.gold,textShadow:`0 0 24px ${C.gold}`,marginBottom:4}}>
                  +{xpTotal}
                </div>
                <div style={{...raj(14,700),color:C.gold}}>XP GANADOS</div>
                {bonus&&<div style={{...raj(12,600),color:C.gold,marginTop:6}}>✨ +25% bonus de clase incluido</div>}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
                {[
                  {l:"EJERCICIOS",v:totalEj,icon:"💪"},
                  {l:"SERIES",v:rutina.pasos.reduce((s,p)=>s+p.series,0),icon:"🔁"},
                  {l:"MINUTOS",v:rutina.duracionMin,icon:"⏱"},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 8px",textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                    <div style={{...orb(16,900),color:c}}>{s.v}</div>
                    <div style={{...px(5),color:C.muted}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <button onClick={()=>onComplete(xpTotal)} className="ur-btn"
                style={{width:"100%",...px(8),color:C.bg,background:c,border:"none",
                  padding:"15px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  boxShadow:`0 6px 28px ${c}55`}}>
                <Award size={14}/> RECLAMAR XP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function UserRutinas({profile}) {
  const [rutinas,    setRutinas]    = useState(RUTINAS);
  const [tab,        setTab]        = useState("mis");   // mis | explorar
  const [catActiva,  setCatActiva]  = useState("Todas");
  const [search,     setSearch]     = useState("");
  const [filterDif,  setFilterDif]  = useState("all");
  const [detalleRut, setDetalleRut] = useState(null);
  const [sesionRut,  setSesionRut]  = useState(null);
  const [xpNotif,    setXpNotif]    = useState(null);

  const clsColor = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
  const myColor  = clsColor[profile?.heroClass]||C.orange;

  const misRutinas  = rutinas.filter(r=>r.asignada);
  const todosLista  = rutinas;

  const fuente = tab==="mis" ? misRutinas : todosLista;

  const filtered = fuente
    .filter(r=>{
      if(catActiva!=="Todas"&&r.categoria!==catActiva) return false;
      if(search&&!r.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      if(filterDif!=="all"&&r.dificultad!==filterDif) return false;
      return true;
    });

  const handleComplete = (xp) => {
    setSesionRut(null);
    setXpNotif(xp);
    setTimeout(()=>setXpNotif(null),2500);
    setRutinas(prev=>prev.map(r=>r.id===sesionRut?.id?{...r,completadas:r.completadas+1,completadaHoy:true}:r));
  };

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,
    background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,
    padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  // hoy = dia de la semana
  const hoyDia = DIAS[new Date().getDay()===0?6:new Date().getDay()-1];
  const rutinasHoy = misRutinas.filter(r=>r.diasSemana.includes(hoyDia));

  return (
    <>
      <style>{CSS}</style>

      {detalleRut&&<DetalleModal rutina={detalleRut} profile={profile} onClose={()=>setDetalleRut(null)} onStart={r=>{setDetalleRut(null);setSesionRut(r);}}/>}
      {sesionRut&&<SesionRutinaModal rutina={sesionRut} profile={profile} onClose={()=>setSesionRut(null)} onComplete={handleComplete}/>}

      {xpNotif&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          zIndex:400,pointerEvents:"none",...orb(32,900),color:C.gold,
          textShadow:`0 0 30px ${C.gold}`,animation:"ur-xpPop 2.2s ease forwards"}}>
          +{xpNotif} XP ⚡
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* ── Header ── */}
        <div style={{background:C.card,border:`1px solid ${myColor}33`,padding:"18px 22px",
          position:"relative",overflow:"hidden",animation:"ur-fadeIn .4s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg,transparent,${myColor},transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div style={{fontSize:36,filter:`drop-shadow(0 0 12px ${myColor})`}}>📋</div>
            <div>
              <div style={{...orb(13,700),color:C.white,marginBottom:3}}>MIS RUTINAS</div>
              <div style={{...raj(12,500),color:C.muted}}>
                {misRutinas.length} asignadas · {misRutinas.reduce((s,r)=>s+r.completadas,0)} sesiones completadas
              </div>
            </div>
            <div style={{display:"flex",gap:16,marginLeft:"auto",flexWrap:"wrap"}}>
              {[
                {l:"Asignadas",   v:misRutinas.length,   c:myColor },
                {l:"Completadas hoy",v:misRutinas.filter(r=>r.completadaHoy).length, c:C.green},
                {l:"Para hoy",   v:rutinasHoy.length,   c:C.gold  },
              ].map((s,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{...orb(18,900),color:s.c}}>{s.v}</div>
                  <div style={{...px(5),color:C.muted}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Rutinas de hoy ── */}
        {rutinasHoy.length>0&&(
          <div style={{background:C.card,border:`1px solid ${C.gold}33`,
            animation:"ur-cardIn .4s ease .05s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",
              borderBottom:`1px solid ${C.navy}`}}>
              <Calendar size={14} color={C.gold}/>
              <span style={{...orb(11,700),color:C.white}}>HOY · {hoyDia.toUpperCase()}</span>
              <span style={{...raj(11,600),color:C.muted,marginLeft:4}}>{rutinasHoy.length} rutina{rutinasHoy.length!==1?"s":""} programada{rutinasHoy.length!==1?"s":""}</span>
            </div>
            <div style={{display:"flex",gap:12,padding:"12px 18px",overflowX:"auto"}}>
              {rutinasHoy.map((r,i)=>{
                const cm=CAT_META[r.categoria]||{}; const c=cm.color||C.orange;
                return (
                  <div key={r.id} onClick={()=>setDetalleRut(r)}
                    style={{flex:"0 0 auto",width:220,background:C.panel,
                      border:`1px solid ${r.completadaHoy?C.green+"44":c+"33"}`,
                      padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden",
                      transition:"all .2s",animation:`ur-cardIn .35s ease ${i*.07}s both`}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=c;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=r.completadaHoy?`${C.green}44`:`${c}33`;}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${r.completadaHoy?C.green:c},transparent)`}}/>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:24}}>{r.imagen}</span>
                      <div>
                        <div style={{...raj(12,700),color:C.white,marginBottom:2}}>{r.nombre}</div>
                        <div style={{...raj(10,600),color:c}}>{r.duracionMin}min · +{r.xpTotal}XP</div>
                      </div>
                    </div>
                    {r.completadaHoy?(
                      <div style={{display:"flex",alignItems:"center",gap:6,...raj(11,700),color:C.green}}>
                        <Check size={12}/> Completada hoy
                      </div>
                    ):(
                      <button className="ur-btn"
                        style={{width:"100%",...raj(11,700),color:C.bg,background:c,
                          border:"none",padding:"7px",cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <PlayCircle size={12}/> Iniciar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tabs: Mis rutinas / Explorar ── */}
        <div style={{display:"flex",gap:0,background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          {[{id:"mis",l:"MIS RUTINAS",count:misRutinas.length},{id:"explorar",l:"EXPLORAR",count:rutinas.length}].map(t=>{
            const on=tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} className="ur-tab-btn"
                style={{flex:1,padding:"14px",background:on?`${myColor}12`:"transparent",
                  border:"none",borderBottom:`3px solid ${on?myColor:"transparent"}`,
                  color:on?myColor:C.muted,cursor:"pointer",display:"flex",alignItems:"center",
                  justifyContent:"center",gap:8,...raj(13,on?700:500)}}>
                {t.l}
                <span style={{...raj(10,700),color:on?myColor:C.navy,
                  background:on?`${myColor}22`:`${C.navy}44`,padding:"1px 8px",borderRadius:99}}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filtros ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"13px 16px",
          display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
            <input className="ur-input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar rutina..."
              style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,
                border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
          </div>

          <span style={{...raj(11,600),color:C.muted}}>Categoría:</span>
          {["Todas",...Object.keys(CAT_META)].map(cat=>{
            const m=CAT_META[cat];
            return (
              <button key={cat} onClick={()=>setCatActiva(cat)} className="ur-filter-btn"
                style={fBtn(catActiva===cat,m?.color||myColor)}>
                {m?.icon||""} {cat}
              </button>
            );
          })}

          <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
          <span style={{...raj(11,600),color:C.muted}}>Dificultad:</span>
          {["all","Principiante","Intermedio","Avanzado","Élite"].map(v=>(
            <button key={v} onClick={()=>setFilterDif(v)} className="ur-filter-btn"
              style={fBtn(filterDif===v,DIFICULTAD_COLOR[v]||myColor)}>
              {v==="all"?"Todas":v}
            </button>
          ))}
        </div>

        <div style={{...raj(12,500),color:C.muted}}>
          {filtered.length} rutina{filtered.length!==1?"s":""} {tab==="mis"?"asignada":"disponible"}{filtered.length!==1?"s":""}
        </div>

        {/* ── Grid de rutinas ── */}
        {filtered.length===0?(
          <div style={{padding:60,textAlign:"center",background:C.card,border:`1px solid ${C.navy}`}}>
            <div style={{fontSize:48,marginBottom:12,opacity:.4}}>📋</div>
            <div style={{...raj(14,600),color:C.muted}}>
              {tab==="mis"
                ?"No tienes rutinas asignadas. Ve a Explorar para encontrar rutinas."
                :"No se encontraron rutinas con esos filtros."}
            </div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {filtered.map((r,i)=>{
              const cm=CAT_META[r.categoria]||{};
              const c=cm.color||C.orange;
              const dc=DIFICULTAD_COLOR[r.dificultad]||C.muted;
              const bonus=hasClsBonus(profile?.heroClass,r.subcategoria||r.categoria);
              return (
                <div key={r.id} className="ur-card"
                  onClick={()=>setDetalleRut(r)}
                  style={{background:C.card,border:`1px solid ${r.completadaHoy?C.green+"33":c+"22"}`,
                    boxShadow:r.completadaHoy?`0 0 14px ${C.green}18`:"0 4px 16px rgba(0,0,0,.35)",
                    overflow:"hidden",animation:`ur-cardIn .4s ease ${i*.05}s both`,position:"relative"}}>
                  <div className="ur-shine"/>
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${r.completadaHoy?C.green:c},transparent)`}}/>

                  <div style={{padding:"16px 16px 0"}}>
                    {/* header */}
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                      <div style={{width:52,height:52,background:`${c}18`,border:`2px solid ${c}44`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>
                        {r.imagen}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{...raj(13,700),color:C.white,marginBottom:4,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.nombre}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 7px"}}>{cm.icon} {r.categoria}</span>
                          <span style={{...raj(9,600),color:c,background:`${c}0A`,border:`1px solid ${c}22`,padding:"2px 7px"}}>{r.subcategoria}</span>
                          <span style={{...raj(10,700),color:dc,background:`${dc}14`,border:`1px solid ${dc}33`,padding:"2px 7px"}}>{r.dificultad}</span>
                        </div>
                      </div>
                    </div>

                    {/* descripcion */}
                    <p style={{...raj(11,400),color:C.muted,lineHeight:1.5,marginBottom:10,
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {r.descripcion}
                    </p>

                    {/* dias */}
                    <div style={{marginBottom:10}}>
                      <DiaChips dias={r.diasSemana} color={c} small/>
                    </div>

                    {/* stats */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
                      {[
                        {l:"XP",   v:bonus?`+${Math.round(r.xpTotal*1.25)}`:`+${r.xpTotal}`, c:C.gold, extra:bonus?"✨":null},
                        {l:"MIN",  v:r.duracionMin,   c:C.blue   },
                        {l:"EJERS",v:r.pasos.length,  c:c        },
                        {l:"COMPL",v:`${r.completadas}×`,c:C.teal},
                      ].map((s,idx)=>(
                        <div key={idx} style={{background:C.panel,border:`1px solid ${s.c}18`,
                          padding:"6px 5px",textAlign:"center"}}>
                          <div style={{...raj(12,700),color:s.c,display:"flex",alignItems:"center",justifyContent:"center",gap:2}}>
                            {s.v}{s.extra&&<span style={{fontSize:9}}>{s.extra}</span>}
                          </div>
                          <div style={{...px(4),color:C.muted}}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* objetivo */}
                    <div style={{...raj(10,600),color:C.muted,marginBottom:8}}>
                      🎯 <span style={{color:c}}>{r.objetivo}</span>
                    </div>

                    {/* progreso completadas */}
                    {r.completadas>0&&(
                      <div style={{marginBottom:8}}>
                        <MiniBar val={r.completadas} max={20} color={r.completadaHoy?C.green:c} height={4}/>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div style={{borderTop:`1px solid ${C.navy}22`,marginTop:8,
                    padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:r.completadaHoy?`${C.green}06`:`${c}06`}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {r.completadaHoy?(
                        <><Check size={12} color={C.green}/>
                        <span style={{...raj(11,700),color:C.green}}>Completada hoy</span></>
                      ):r.asignada?(
                        <span style={{...raj(11,600),color:c}}>📌 Asignada</span>
                      ):(
                        <span style={{...raj(11,600),color:C.muted}}>Explorar</span>
                      )}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5,...raj(11,700),color:c}}>
                      VER <ChevronRight size={13}/>
                    </div>
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