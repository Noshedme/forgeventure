// src/pages/admin/AdminRutinas.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de rutinas para el Admin de ForgeVenture.
//  Categorías: Fuerza | Cardio | Flexibilidad (con subcategorías)
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, ClipboardList, Zap,
  Star, BarChart2,
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
  @keyframes r-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes r-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes r-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes r-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes r-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes r-pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }

  .r-row { transition:background .15s; }
  .r-row:hover { background:${C.navyL}18 !important; }
  .r-btn { transition:all .18s; cursor:pointer; }
  .r-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .r-icon-btn { transition:all .2s; cursor:pointer; }
  .r-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .r-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .r-input::placeholder { color:${C.navy}; }
  .r-sort { cursor:pointer; user-select:none; transition:color .2s; }
  .r-sort:hover { color:${C.orange} !important; }
  .r-card { transition:all .22s; }
  .r-card:hover { border-color:${C.orange}55 !important; transform:translateY(-3px); box-shadow:0 12px 36px rgba(0,0,0,.4) !important; }
  .r-step-row { transition:background .15s; }
  .r-step-row:hover { background:${C.navyL}18 !important; }
  .r-cat-tab { transition:all .2s; cursor:pointer; }
  .r-cat-tab:hover { opacity:.85; }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Taxonomía ─────────────────────────────────────────────────
const TAXONOMIA = {
  Fuerza:       { color:C.orange, icon:"⚔️", bg:"#E85D0414", subs:["Calistenia","Pesas","Funcional","Explosiva","Hipertrofia","Resistencia Muscular"] },
  Cardio:       { color:C.blue,   icon:"🏃", bg:"#4CC9F014", subs:["HIIT","Continuo","Intervalos","Aeróbico","Anaeróbico","Deportivo"] },
  Flexibilidad: { color:C.purple, icon:"🧘", bg:"#9B59B614", subs:["Yoga","Pilates","Stretching","Movilidad","Balance","Recuperación"] },
};
const CATEGORIAS   = Object.keys(TAXONOMIA);
const DIFICULTADES = ["Principiante","Intermedio","Avanzado","Élite"];
const DIAS_SEMANA  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const OBJETIVOS    = ["Perder peso","Ganar músculo","Mejorar resistencia","Aumentar flexibilidad","Tonificar","Mejorar postura","Rendimiento deportivo"];
const DIFICULTAD_COLOR = { Principiante:C.green, Intermedio:C.gold, Avanzado:C.orange, Élite:C.red };

const EJERCICIOS_DISP = [
  {id:"e1",nombre:"Flexiones",       imagen:"💪",xpBase:30,cat:"Fuerza"},
  {id:"e2",nombre:"Sentadillas",     imagen:"🦵",xpBase:35,cat:"Fuerza"},
  {id:"e3",nombre:"Cardio Libre",    imagen:"🏃",xpBase:60,cat:"Cardio"},
  {id:"e4",nombre:"Plancha",         imagen:"🏋️",xpBase:40,cat:"Funcional"},
  {id:"e5",nombre:"Dominadas",       imagen:"🔝",xpBase:55,cat:"Fuerza"},
  {id:"e6",nombre:"Yoga Matutino",   imagen:"🧘",xpBase:45,cat:"Flexibilidad"},
  {id:"e7",nombre:"HIIT Explosivo",  imagen:"⚡",xpBase:90,cat:"Cardio"},
  {id:"e8",nombre:"Press Militar",   imagen:"🏋️",xpBase:45,cat:"Fuerza"},
  {id:"e9",nombre:"Burpees",         imagen:"💥",xpBase:70,cat:"Cardio"},
  {id:"e10",nombre:"Estiramiento",   imagen:"🤸",xpBase:20,cat:"Flexibilidad"},
  {id:"e11",nombre:"Fondos",         imagen:"💪",xpBase:55,cat:"Fuerza"},
  {id:"e12",nombre:"Pilates Core",   imagen:"🧘",xpBase:35,cat:"Flexibilidad"},
];

const MOCK_RUTINAS = [
  { id:"r1",nombre:"Guerrero del Hierro", categoria:"Fuerza",       subcategoria:"Hipertrofia", dificultad:"Avanzado",     duracionMin:55,diasSemana:["Lun","Mié","Vie"],objetivo:"Ganar músculo",     xpTotal:220,activo:true, sesiones:89,descripcion:"Rutina de hipertrofia de 3 días para máximo crecimiento muscular.",imagen:"⚔️",creadoEn:"2024-10-05",
    pasos:[{ejercicioId:"e4",nombre:"Plancha",   imagen:"🏋️",series:3,reps:null,duracion:60,descanso:30,orden:1},{ejercicioId:"e1",nombre:"Flexiones",imagen:"💪",series:4,reps:15,duracion:null,descanso:60,orden:2},{ejercicioId:"e8",nombre:"Press Militar",imagen:"🏋️",series:4,reps:10,duracion:null,descanso:90,orden:3},{ejercicioId:"e2",nombre:"Sentadillas",imagen:"🦵",series:4,reps:12,duracion:null,descanso:90,orden:4},{ejercicioId:"e5",nombre:"Dominadas",imagen:"🔝",series:3,reps:8,duracion:null,descanso:90,orden:5}]},
  { id:"r2",nombre:"Sprint y Fuego",      categoria:"Cardio",       subcategoria:"HIIT",        dificultad:"Avanzado",     duracionMin:30,diasSemana:["Mar","Jue","Sáb"],objetivo:"Perder peso",       xpTotal:310,activo:true, sesiones:67,descripcion:"Cardio HIIT de alta intensidad para quema de grasa máxima.",imagen:"⚡",creadoEn:"2024-10-12",
    pasos:[{ejercicioId:"e7",nombre:"HIIT Explosivo",imagen:"⚡",series:6,reps:null,duracion:20,descanso:10,orden:1},{ejercicioId:"e9",nombre:"Burpees",imagen:"💥",series:4,reps:10,duracion:null,descanso:30,orden:2},{ejercicioId:"e3",nombre:"Cardio Libre",imagen:"🏃",series:1,reps:null,duracion:10,descanso:0,orden:3}]},
  { id:"r3",nombre:"Alma Zen",            categoria:"Flexibilidad", subcategoria:"Yoga",        dificultad:"Principiante", duracionMin:40,diasSemana:["Lun","Mié","Vie","Dom"],objetivo:"Mejorar flexibilidad",xpTotal:130,activo:true, sesiones:54,descripcion:"Rutina de yoga para mejorar flexibilidad y calmar la mente.",imagen:"🧘",creadoEn:"2024-11-01",
    pasos:[{ejercicioId:"e6",nombre:"Yoga Matutino",imagen:"🧘",series:1,reps:null,duracion:20,descanso:0,orden:1},{ejercicioId:"e10",nombre:"Estiramiento",imagen:"🤸",series:1,reps:null,duracion:15,descanso:0,orden:2},{ejercicioId:"e12",nombre:"Pilates Core",imagen:"🧘",series:1,reps:null,duracion:5,descanso:0,orden:3}]},
  { id:"r4",nombre:"Calistenia Total",    categoria:"Fuerza",       subcategoria:"Calistenia",  dificultad:"Intermedio",   duracionMin:45,diasSemana:["Mar","Jue","Sáb"],objetivo:"Tonificar",         xpTotal:185,activo:true, sesiones:42,descripcion:"Rutina completa de calistenia usando solo el peso corporal.",imagen:"💪",creadoEn:"2024-11-15",
    pasos:[{ejercicioId:"e1",nombre:"Flexiones",imagen:"💪",series:4,reps:15,duracion:null,descanso:60,orden:1},{ejercicioId:"e5",nombre:"Dominadas",imagen:"🔝",series:3,reps:8,duracion:null,descanso:90,orden:2},{ejercicioId:"e11",nombre:"Fondos",imagen:"💪",series:3,reps:12,duracion:null,descanso:60,orden:3},{ejercicioId:"e2",nombre:"Sentadillas",imagen:"🦵",series:4,reps:15,duracion:null,descanso:60,orden:4}]},
  { id:"r5",nombre:"Movilidad Diaria",    categoria:"Flexibilidad", subcategoria:"Movilidad",   dificultad:"Principiante", duracionMin:25,diasSemana:["Lun","Mar","Mié","Jue","Vie"],objetivo:"Mejorar postura",   xpTotal:80, activo:false,sesiones:18,descripcion:"Rutina diaria de movilidad articular para mejorar la postura.",imagen:"🤸",creadoEn:"2024-12-01",
    pasos:[{ejercicioId:"e10",nombre:"Estiramiento",imagen:"🤸",series:1,reps:null,duracion:15,descanso:0,orden:1},{ejercicioId:"e6",nombre:"Yoga Matutino",imagen:"🧘",series:1,reps:null,duracion:10,descanso:0,orden:2}]},
  { id:"r6",nombre:"Cardio Matutino",     categoria:"Cardio",       subcategoria:"Aeróbico",    dificultad:"Principiante", duracionMin:35,diasSemana:["Lun","Mié","Vie"],objetivo:"Mejorar resistencia",xpTotal:100,activo:true, sesiones:31,descripcion:"Cardio suave para comenzar el día con energía.",imagen:"🌅",creadoEn:"2024-12-10",
    pasos:[{ejercicioId:"e3",nombre:"Cardio Libre",imagen:"🏃",series:1,reps:null,duracion:30,descanso:0,orden:1},{ejercicioId:"e10",nombre:"Estiramiento",imagen:"🤸",series:1,reps:null,duracion:5,descanso:0,orden:2}]},
];

const EMPTY_FORM = { nombre:"",categoria:"Fuerza",subcategoria:"Calistenia",dificultad:"Principiante",duracionMin:30,diasSemana:[],objetivo:"Ganar músculo",xpTotal:0,activo:true,descripcion:"",imagen:"⚔️",pasos:[] };
const EMOJIS = ["⚔️","🏃","🧘","💪","⚡","🔥","💥","🤸","🏆","🎯","🦵","🌅","🌟","💨","🏋️"];
const PAGE_SIZE_OPTIONS = [6,12,24];

// ── UI atoms ──────────────────────────────────────────────────
function MiniBar({val,color,height=5}) {
  return (<div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}><div style={{height:"100%",width:`${Math.min(val,100)}%`,background:color,boxShadow:`0 0 5px ${color}66`,transition:"width .6s"}}/></div>);
}
function CatBadge({cat}) {
  const m=TAXONOMIA[cat]||{color:C.muted,icon:"?",bg:C.panel};
  return <span style={{...raj(10,700),color:m.color,background:m.bg,border:`1px solid ${m.color}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{m.icon} {cat}</span>;
}
function SubBadge({sub,cat}) {
  const c=TAXONOMIA[cat]?.color||C.muted;
  return <span style={{...raj(10,600),color:c,background:`${c}0D`,border:`1px solid ${c}22`,padding:"1px 7px",whiteSpace:"nowrap"}}>{sub}</span>;
}
function DifBadge({dif}) {
  const c=DIFICULTAD_COLOR[dif]||C.muted;
  return <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 8px",whiteSpace:"nowrap"}}>{dif}</span>;
}
function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"r-spin .8s linear infinite"}}/>;
}
function SortIcon({active,dir}) {
  if(!active) return <ChevronDown size={11} color={C.navy}/>;
  return dir==="asc"?<ChevronUp size={11} color={C.orange}/>:<ChevronDown size={11} color={C.orange}/>;
}
function DiaChips({dias,color}) {
  return (<div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{DIAS_SEMANA.map(d=>{const on=dias.includes(d);return <span key={d} style={{...raj(9,on?700:500),color:on?color:C.navy,background:on?`${color}18`:"transparent",border:`1px solid ${on?color:C.navy}`,padding:"1px 5px"}}>{d}</span>;})}</div>);
}

// ══════════════════════════════════════════════════════════════
// MODAL — VER
// ══════════════════════════════════════════════════════════════
function ViewModal({rutina,onClose,onEdit}) {
  const m=TAXONOMIA[rutina.categoria]||{};
  const c=m.color||C.orange;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:620,background:C.card,border:`1px solid ${c}44`,boxShadow:`0 0 60px ${c}11,0 24px 60px rgba(0,0,0,.6)`,animation:"r-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,background:`${c}18`,border:`2px solid ${c}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{rutina.imagen}</div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:5}}>{rutina.nombre}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><CatBadge cat={rutina.categoria}/><SubBadge sub={rutina.subcategoria} cat={rutina.categoria}/><DifBadge dif={rutina.dificultad}/></div>
            </div>
          </div>
          <button onClick={onClose} className="r-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>
        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16,maxHeight:"70vh",overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[{l:"XP TOTAL",v:`+${rutina.xpTotal}`,c:C.gold},{l:"DURACIÓN",v:`${rutina.duracionMin}min`,c:C.orange},{l:"EJERCICIOS",v:rutina.pasos.length,c:C.blue},{l:"SESIONES",v:rutina.sesiones,c:C.teal}].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(14,900),color:s.c,marginBottom:3}}>{s.v}</div><div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7,marginBottom:10}}>{rutina.descripcion}</p>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
              <span style={{...raj(11,600),color:C.muted}}>🎯 {rutina.objetivo}</span>
            </div>
            <DiaChips dias={rutina.diasSemana} color={c}/>
          </div>
          <div>
            <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📋 EJERCICIOS</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {rutina.pasos.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.panel,border:`1px solid ${C.navy}`,padding:"10px 14px"}}>
                  <div style={{...orb(12,900),color:c,minWidth:22,textAlign:"center"}}>#{p.orden}</div>
                  <div style={{fontSize:20}}>{p.imagen}</div>
                  <div style={{flex:1}}>
                    <div style={{...raj(13,700),color:C.white}}>{p.nombre}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{p.duracion?`${p.series}s × ${p.duracion}seg`:`${p.series}×${p.reps} reps`}{p.descanso>0?` · ⏱ ${p.descanso}s descanso`:""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:C.panel,border:`1px solid ${rutina.activo?C.green:C.red}33`,padding:"10px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:rutina.activo?C.green:C.red,animation:rutina.activo?"r-pulse 1.5s infinite":"none"}}/>
              <span style={{...raj(13,700),color:rutina.activo?C.green:C.red}}>{rutina.activo?"ACTIVA":"INACTIVA"}</span>
            </div>
            <button onClick={()=>{onClose();onEdit(rutina);}} className="r-btn" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,...px(7),color:C.bg,background:C.orange,border:"none",padding:"10px",cursor:"pointer",boxShadow:`0 3px 14px ${C.orange}44`}}>
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
function FormModal({rutina,onClose,onSave}) {
  const isEdit=!!rutina;
  const [form,    setForm]    = useState(rutina?{...rutina,pasos:[...rutina.pasos]}:{...EMPTY_FORM});
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [shake,   setShake]   = useState(false);
  const [tab,     setTab]     = useState("info");
  const [exSearch,setExSearch]= useState("");

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const catMeta=TAXONOMIA[form.categoria]||{};
  const xpCalc=form.pasos.reduce((s,p)=>{const ej=EJERCICIOS_DISP.find(e=>e.id===p.ejercicioId);return s+(ej?.xpBase||0)*p.series;},0);

  const validate=()=>{const e={};if(!form.nombre.trim())e.nombre="Requerido";if(!form.descripcion.trim())e.descripcion="Requerido";if(!form.diasSemana.length)e.dias="Selecciona días";if(!form.pasos.length)e.pasos="Añade ejercicios";return e;};

  const save=async()=>{const e=validate();if(Object.keys(e).length){setErrors(e);setShake(true);setTimeout(()=>setShake(false),500);return;}setLoading(true);await new Promise(r=>setTimeout(r,900));setLoading(false);onSave({...form,xpTotal:xpCalc,id:rutina?.id||`r${Date.now()}`,sesiones:rutina?.sesiones||0,creadoEn:rutina?.creadoEn||new Date().toISOString().slice(0,10)});onClose();};

  const addPaso=(ej)=>{const o=form.pasos.length+1;setForm(f=>({...f,pasos:[...f.pasos,{ejercicioId:ej.id,nombre:ej.nombre,imagen:ej.imagen,series:3,reps:10,duracion:null,descanso:60,orden:o}]}));};
  const removePaso=(idx)=>setForm(f=>({...f,pasos:f.pasos.filter((_,i)=>i!==idx).map((p,i)=>({...p,orden:i+1}))}));
  const movePaso=(idx,dir)=>{const a=[...form.pasos];const to=idx+dir;if(to<0||to>=a.length)return;[a[idx],a[to]]=[a[to],a[idx]];setForm(f=>({...f,pasos:a.map((p,i)=>({...p,orden:i+1}))}));};
  const setPF=(idx,k,v)=>setForm(f=>({...f,pasos:f.pasos.map((p,i)=>i===idx?{...p,[k]:v}:p)}));

  const dispEj=EJERCICIOS_DISP.filter(e=>!form.pasos.find(p=>p.ejercicioId===e.id)&&(exSearch?e.nombre.toLowerCase().includes(exSearch.toLowerCase()):true));
  const inpSt=(err)=>({width:"100%",padding:"11px 14px",background:C.panel,border:`1px solid ${err?C.red:C.navy}`,color:C.white,...raj(14,500)});
  const lbl={display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"};
  const bc=isEdit?C.orange:C.green;
  const TABS=[{id:"info",l:"INFO"},{id:"dias",l:"DÍAS & OBJETIVO"},{id:"pasos",l:`EJERCICIOS (${form.pasos.length})`}];

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:700,background:C.card,border:`1px solid ${bc}44`,boxShadow:`0 0 60px ${bc}0E,0 24px 60px rgba(0,0,0,.6)`,animation:"r-modalIn .25s ease both",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"93vh"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${bc},transparent)`,flexShrink:0}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 22px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isEdit?<Edit2 size={15} color={C.orange}/>:<Plus size={15} color={C.green}/>}
            <span style={{...orb(12,700),color:C.white}}>{isEdit?"EDITAR RUTINA":"NUEVA RUTINA"}</span>
            {isEdit&&<span style={{...raj(12,500),color:C.muted}}>— {rutina.nombre}</span>}
          </div>
          <button onClick={onClose} className="r-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="r-btn"
              style={{flex:1,padding:"11px 0",...raj(12,tab===t.id?700:500),color:tab===t.id?bc:C.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?bc:"transparent"}`,cursor:"pointer",position:"relative"}}>
              {t.l}
              {t.id==="pasos"&&errors.pasos&&<span style={{position:"absolute",top:7,right:"20%",width:6,height:6,background:C.red,borderRadius:"50%"}}/>}
              {t.id==="dias"&&errors.dias&&<span style={{position:"absolute",top:7,right:"20%",width:6,height:6,background:C.red,borderRadius:"50%"}}/>}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:22}} className={shake?"r-shake":""}>

          {/* ── INFO ── */}
          {tab==="info"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:14}}>
                <div>
                  <label style={lbl}>🎨 ICONO</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                    {EMOJIS.map(e=><button key={e} type="button" onClick={()=>set("imagen",e)} className="r-btn" style={{fontSize:17,background:form.imagen===e?`${bc}22`:"transparent",border:`1px solid ${form.imagen===e?bc:C.navy}`,padding:"5px",cursor:"pointer"}}>{e}</button>)}
                  </div>
                </div>
                <div>
                  <label style={lbl}>📝 NOMBRE</label>
                  <input className="r-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: Guerrero del Hierro" style={inpSt(errors.nombre)}/>
                  {errors.nombre&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.nombre}</p>}
                </div>
              </div>

              {/* categoria */}
              <div>
                <label style={lbl}>🗂️ CATEGORÍA PRINCIPAL</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {CATEGORIAS.map(cat=>{const m=TAXONOMIA[cat];const on=form.categoria===cat;return(
                    <button key={cat} type="button" onClick={()=>{set("categoria",cat);set("subcategoria",m.subs[0]);}} className="r-btn"
                      style={{background:on?m.bg:"transparent",border:`2px solid ${on?m.color:C.navy}`,padding:"14px 10px",cursor:"pointer",textAlign:"center",boxShadow:on?`0 0 16px ${m.color}33`:"none",transition:"all .22s"}}>
                      <div style={{fontSize:28,marginBottom:6,filter:on?`drop-shadow(0 0 8px ${m.color})`:"none"}}>{m.icon}</div>
                      <div style={{...px(8),color:on?m.color:C.muted,marginBottom:3}}>{cat.toUpperCase()}</div>
                      <div style={{...raj(10,400),color:C.muted}}>{m.subs.length} subcat.</div>
                    </button>
                  );} )}
                </div>
              </div>

              {/* subcategoría */}
              <div>
                <label style={lbl}>🏷️ SUBCATEGORÍA</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {(TAXONOMIA[form.categoria]?.subs||[]).map(sub=>{const cc=TAXONOMIA[form.categoria]?.color||C.orange;const on=form.subcategoria===sub;return(
                    <button key={sub} type="button" onClick={()=>set("subcategoria",sub)} className="r-btn"
                      style={{...raj(12,on?700:500),color:on?cc:C.muted,background:on?`${cc}18`:"transparent",border:`1px solid ${on?cc:C.navy}`,padding:"7px 14px",cursor:"pointer",transition:"all .18s",boxShadow:on?`0 0 8px ${cc}22`:"none"}}>
                      {sub}
                    </button>
                  );} )}
                </div>
              </div>

              {/* dificultad + duración + descripción */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                <div>
                  <label style={lbl}>⚡ DIFICULTAD</label>
                  {DIFICULTADES.map(d=>{const dc=DIFICULTAD_COLOR[d];const on=form.dificultad===d;return(
                    <button key={d} type="button" onClick={()=>set("dificultad",d)} className="r-btn"
                      style={{width:"100%",marginBottom:6,...raj(12,on?700:500),color:on?dc:C.muted,background:on?`${dc}18`:"transparent",border:`1px solid ${on?dc:C.navy}`,padding:"8px 12px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                      {d}
                    </button>
                  );})}
                </div>
                <div>
                  <label style={lbl}>⏱️ DURACIÓN (min)</label>
                  <input className="r-input" type="number" min={5} value={form.duracionMin} onChange={e=>set("duracionMin",Number(e.target.value))} style={inpSt(false)}/>
                  <label style={{...lbl,marginTop:14}}>● ESTADO</label>
                  {[{v:true,l:"ACTIVA",c:C.green},{v:false,l:"INACTIVA",c:C.red}].map(o=>(
                    <button key={String(o.v)} type="button" onClick={()=>set("activo",o.v)} className="r-btn"
                      style={{width:"100%",marginBottom:6,...raj(12,form.activo===o.v?700:500),color:form.activo===o.v?o.c:C.muted,background:form.activo===o.v?`${o.c}18`:"transparent",border:`1px solid ${form.activo===o.v?o.c:C.navy}`,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:form.activo===o.v?o.c:C.navy}}/>{o.l}
                    </button>
                  ))}
                </div>
                <div>
                  <label style={lbl}>📋 DESCRIPCIÓN</label>
                  <textarea className="r-input" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} rows={7} placeholder="Describe la rutina..." style={{...inpSt(errors.descripcion),resize:"vertical"}}/>
                  {errors.descripcion&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.descripcion}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── DÍAS & OBJETIVO ── */}
          {tab==="dias"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div>
                <label style={lbl}>📅 DÍAS DE LA SEMANA</label>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8}}>
                  {DIAS_SEMANA.map(d=>{const on=form.diasSemana.includes(d);const cc=catMeta.color||C.orange;return(
                    <button key={d} type="button" onClick={()=>set("diasSemana",on?form.diasSemana.filter(x=>x!==d):[...form.diasSemana,d])} className="r-btn"
                      style={{...raj(13,on?700:600),color:on?cc:C.muted,background:on?`${cc}18`:"transparent",border:`2px solid ${on?cc:C.navy}`,padding:"12px 18px",cursor:"pointer",minWidth:60,textAlign:"center",transition:"all .22s",boxShadow:on?`0 0 12px ${cc}33`:"none"}}>
                      {d}
                    </button>
                  );})}
                </div>
                {errors.dias&&<p style={{...raj(11),color:C.red}}>⚠ {errors.dias}</p>}
                {form.diasSemana.length>0&&<div style={{...raj(12,600),color:C.muted,marginTop:6}}>{form.diasSemana.length} día{form.diasSemana.length!==1?"s":""}: <span style={{color:catMeta.color||C.orange}}>{form.diasSemana.join(", ")}</span></div>}
              </div>
              <div>
                <label style={lbl}>🎯 OBJETIVO PRINCIPAL</label>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {OBJETIVOS.map(o=>{const on=form.objetivo===o;const cc=catMeta.color||C.orange;return(
                    <button key={o} type="button" onClick={()=>set("objetivo",o)} className="r-btn"
                      style={{display:"flex",alignItems:"center",gap:10,...raj(13,on?700:500),color:on?cc:C.muted,background:on?`${cc}14`:"transparent",border:`1px solid ${on?cc:C.navy}`,padding:"11px 16px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:on?cc:C.navy,flexShrink:0}}/>{o}
                    </button>
                  );})}
                </div>
              </div>
              <div style={{background:C.panel,border:`1px solid ${C.gold}33`,padding:"16px 18px"}}>
                <div style={{...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em"}}>⚡ XP ESTIMADO</div>
                <div style={{...orb(30,900),color:C.gold,marginBottom:4}}>+{xpCalc}</div>
                <div style={{...raj(12,500),color:C.muted}}>Basado en {form.pasos.length} ejercicio{form.pasos.length!==1?"s":""} añadidos</div>
              </div>
            </div>
          )}

          {/* ── PASOS ── */}
          {tab==="pasos"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {errors.pasos&&<p style={{...raj(12),color:C.red}}>⚠ {errors.pasos}</p>}

              {form.pasos.length>0&&(
                <div>
                  <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>ORDEN DE EJERCICIOS</div>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {form.pasos.map((p,idx)=>(
                      <div key={idx} className="r-step-row" style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"9px 12px",display:"grid",gridTemplateColumns:"22px 34px 1fr 72px 72px 72px 72px",gap:8,alignItems:"center"}}>
                        <div style={{...orb(10,900),color:catMeta.color||C.orange,textAlign:"center"}}>#{p.orden}</div>
                        <div style={{fontSize:19,textAlign:"center"}}>{p.imagen}</div>
                        <div style={{...raj(12,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</div>
                        {[
                          {l:"SERIES",k:"series",   v:p.series},
                          {l:p.duracion?"SEG":"REPS",k:p.duracion?"duracion":"reps",v:p.duracion||p.reps||""},
                          {l:"DESC(s)",k:"descanso",v:p.descanso},
                        ].map(f=>(
                          <div key={f.k}>
                            <div style={{...px(4),color:C.muted,marginBottom:3,letterSpacing:".04em"}}>{f.l}</div>
                            <input type="number" min={0} value={f.v} onChange={e=>setPF(idx,f.k,Number(e.target.value)||null)}
                              className="r-input" style={{width:"100%",padding:"5px 8px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,600)}}/>
                          </div>
                        ))}
                        <div style={{display:"flex",gap:3}}>
                          <button type="button" onClick={()=>movePaso(idx,-1)} disabled={idx===0} className="r-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:5,color:idx===0?C.navy:C.muted,display:"flex"}}><ChevronUp size={11}/></button>
                          <button type="button" onClick={()=>movePaso(idx,1)} disabled={idx===form.pasos.length-1} className="r-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:5,color:idx===form.pasos.length-1?C.navy:C.muted,display:"flex"}}><ChevronDown size={11}/></button>
                          <button type="button" onClick={()=>removePaso(idx)} className="r-icon-btn" style={{background:"transparent",border:`1px solid ${C.red}33`,padding:5,color:C.red,display:"flex"}}
                            onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.borderColor=C.red;}}
                            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.red}33`;}}><X size={11}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
                <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>➕ AÑADIR EJERCICIO</div>
                <div style={{position:"relative",marginBottom:10}}>
                  <Search size={13} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
                  <input className="r-input" value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder="Buscar..."
                    style={{width:"100%",padding:"8px 10px 8px 28px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
                  {dispEj.length===0?<div style={{...raj(12,500),color:C.muted,padding:"6px 0"}}>Todos los ejercicios ya están añadidos.</div>
                  :dispEj.map(ej=>(
                    <button key={ej.id} type="button" onClick={()=>addPaso(ej)} className="r-btn"
                      style={{display:"flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.navy}`,padding:"8px 12px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=catMeta.color||C.orange;e.currentTarget.style.background=`${catMeta.color||C.orange}0A`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.background=C.card;}}>
                      <span style={{fontSize:18}}>{ej.imagen}</span>
                      <div style={{flex:1}}>
                        <div style={{...raj(13,700),color:C.white}}>{ej.nombre}</div>
                        <div style={{...raj(10,500),color:C.muted}}>{ej.cat}</div>
                      </div>
                      <span style={{...raj(11,600),color:C.gold}}>+{ej.xpBase} XP</span>
                      <Plus size={14} color={catMeta.color||C.orange}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:10,padding:"15px 22px",borderTop:`1px solid ${C.navy}`,flexShrink:0}}>
          <button onClick={onClose} className="r-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 20px",cursor:"pointer"}}>CANCELAR</button>
          <button onClick={save} disabled={loading} className="r-btn" style={{flex:1,...px(8),color:loading?C.muted:C.bg,background:loading?`${bc}55`:bc,border:"none",padding:"12px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 4px 20px ${bc}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            {loading?<><Spinner color={bc}/> GUARDANDO...</>:<><Check size={14}/> {isEdit?"GUARDAR CAMBIOS":"CREAR RUTINA"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — ELIMINAR
// ══════════════════════════════════════════════════════════════
function DeleteModal({rutina,onClose,onConfirm}) {
  const [typed,setTyped]=useState("");
  const [loading,setLoading]=useState(false);
  const match=typed===rutina.nombre;
  const confirm=async()=>{if(!match)return;setLoading(true);await new Promise(r=>setTimeout(r,700));setLoading(false);onConfirm(rutina.id);onClose();};
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:420,background:C.card,border:`1px solid ${C.red}44`,boxShadow:`0 0 60px ${C.red}14,0 24px 60px rgba(0,0,0,.6)`,animation:"r-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>
        <div style={{padding:"22px 24px 26px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex"}}><AlertTriangle size={22} color={C.red}/></div>
            <div><div style={{...orb(13,900),color:C.red,marginBottom:3}}>ELIMINAR RUTINA</div><div style={{...raj(12,500),color:C.muted}}>Esta acción no se puede deshacer</div></div>
          </div>
          <div style={{background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:"12px 16px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>{rutina.imagen}</span>
            <div><div style={{...raj(14,700),color:C.red}}>{rutina.nombre}</div><div style={{...raj(12,400),color:C.muted}}>{rutina.categoria} · {rutina.subcategoria} · {rutina.sesiones} sesiones</div></div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",...px(6),color:C.muted,marginBottom:8,letterSpacing:".06em"}}>ESCRIBE <span style={{color:C.red}}>{rutina.nombre}</span> PARA CONFIRMAR</label>
            <input className="r-input" value={typed} onChange={e=>setTyped(e.target.value)} placeholder={rutina.nombre}
              style={{width:"100%",padding:"12px 14px",background:C.panel,border:`1px solid ${match?C.red:C.navy}`,color:C.white,...raj(14,600)}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="r-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="r-btn"
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
export default function AdminRutinas() {
  const [rutinas,   setRutinas]   = useState(MOCK_RUTINAS);
  const [catTab,    setCatTab]    = useState("Todas");
  const [search,    setSearch]    = useState("");
  const [filterSub, setFilterSub] = useState("all");
  const [filterDif, setFilterDif] = useState("all");
  const [filterAct, setFilterAct] = useState("all");
  const [sortKey,   setSortKey]   = useState("sesiones");
  const [sortDir,   setSortDir]   = useState("desc");
  const [view,      setView]      = useState("grid");
  const [page,      setPage]      = useState(1);
  const [pageSize,  setPageSize]  = useState(12);
  const [selected,  setSelected]  = useState(new Set());
  const [modal,     setModal]     = useState(null);
  const [refreshing,setRefreshing]= useState(false);

  const refresh=async()=>{setRefreshing(true);await new Promise(r=>setTimeout(r,800));setRefreshing(false);};
  const subsDisp = catTab!=="Todas"?(TAXONOMIA[catTab]?.subs||[]):[];

  const filtered=useMemo(()=>{
    let list=[...rutinas];
    if(catTab!=="Todas")  list=list.filter(r=>r.categoria===catTab);
    if(search)            list=list.filter(r=>r.nombre.toLowerCase().includes(search.toLowerCase())||r.descripcion.toLowerCase().includes(search.toLowerCase()));
    if(filterSub!=="all") list=list.filter(r=>r.subcategoria===filterSub);
    if(filterDif!=="all") list=list.filter(r=>r.dificultad===filterDif);
    if(filterAct!=="all") list=list.filter(r=>String(r.activo)===(filterAct==="active"?"true":"false"));
    list.sort((a,b)=>{const av=a[sortKey]??"";const bv=b[sortKey]??"";return sortDir==="asc"?(av>bv?1:-1):(av<bv?1:-1);});
    return list;
  },[rutinas,catTab,search,filterSub,filterDif,filterAct,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);
  const sort=(k)=>{if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}};
  const toggleSelect=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSelected(s=>s.size===paginated.length?new Set():new Set(paginated.map(r=>r.id)));
  const handleSave=(saved)=>setRutinas(rs=>{const idx=rs.findIndex(r=>r.id===saved.id);if(idx>=0){const a=[...rs];a[idx]=saved;return a;}return[saved,...rs];});
  const handleDelete=(id)=>{setRutinas(rs=>rs.filter(r=>r.id!==id));setSelected(s=>{const n=new Set(s);n.delete(id);return n;});};
  const bulkDelete=()=>{setRutinas(rs=>rs.filter(r=>!selected.has(r.id)));setSelected(new Set());};

  const kpis=useMemo(()=>({
    total:   rutinas.length,
    activas: rutinas.filter(r=>r.activo).length,
    sesiones:rutinas.reduce((s,r)=>s+r.sesiones,0),
    avgXP:   Math.round(rutinas.reduce((s,r)=>s+r.xpTotal,0)/rutinas.length),
  }),[rutinas]);

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {modal?.type==="view"   && <ViewModal   rutina={modal.r} onClose={()=>setModal(null)} onEdit={r=>setModal({type:"form",r})}/>}
      {modal?.type==="form"   && <FormModal   rutina={modal.r} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {modal?.type==="delete" && <DeleteModal rutina={modal.r} onClose={()=>setModal(null)} onConfirm={handleDelete}/>}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"RUTINAS",  value:kpis.total,   icon:<ClipboardList size={18}/>,color:C.orange},
            {label:"ACTIVAS",  value:kpis.activas, icon:<Zap size={18}/>,           color:C.green },
            {label:"SESIONES", value:kpis.sesiones.toLocaleString(),icon:<BarChart2 size={18}/>,color:C.blue},
            {label:"XP PROM.", value:`+${kpis.avgXP}`,icon:<Star size={18}/>,       color:C.gold  },
          ].map((k,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${k.color}33`,padding:"18px 16px",position:"relative",overflow:"hidden",animation:`r-cardIn .4s ease ${i*.07}s both`,transition:"transform .2s,box-shadow .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 32px rgba(0,0,0,.4)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color},transparent)`}}/>
              <div style={{background:`${k.color}18`,border:`1px solid ${k.color}33`,padding:9,display:"inline-flex",color:k.color,marginBottom:10}}>{k.icon}</div>
              <div style={{...orb(26,900),color:k.color,marginBottom:3}}>{k.value}</div>
              <div style={{...px(6),color:C.muted,letterSpacing:".05em"}}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`}}>
            {["Todas",...CATEGORIAS].map(cat=>{
              const m=TAXONOMIA[cat];const on=catTab===cat;const cc=m?.color||C.orange;
              const count=cat==="Todas"?rutinas.length:rutinas.filter(r=>r.categoria===cat).length;
              return (
                <button key={cat} onClick={()=>{setCatTab(cat);setFilterSub("all");setPage(1);}} className="r-cat-tab"
                  style={{flex:1,padding:"14px 10px",background:on?`${cc}12`:"transparent",border:"none",borderBottom:`3px solid ${on?cc:"transparent"}`,color:on?cc:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <div style={{fontSize:20,filter:on?`drop-shadow(0 0 6px ${cc})`:"none"}}>{m?.icon||"🌐"}</div>
                  <span style={{...raj(12,on?700:500),letterSpacing:".04em"}}>{cat}</span>
                  <span style={{...raj(10,700),color:on?cc:C.navy,background:on?`${cc}22`:`${C.navy}44`,padding:"1px 7px"}}>{count}</span>
                </button>
              );
            })}
          </div>
          {catTab!=="Todas"&&subsDisp.length>0&&(
            <div style={{padding:"10px 16px",display:"flex",gap:8,flexWrap:"wrap",borderBottom:`1px solid ${C.navy}`,background:C.panel}}>
              <span style={{...raj(11,600),color:C.muted,alignSelf:"center"}}>Subcategoría:</span>
              {["all",...subsDisp].map(s=>{const cc=TAXONOMIA[catTab]?.color||C.orange;return<button key={s} onClick={()=>{setFilterSub(s);setPage(1);}} className="r-btn" style={fBtn(filterSub===s,cc)}>{s==="all"?"Todas":s}</button>;})}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"13px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 200px"}}>
              <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
              <input className="r-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Buscar rutina..."
                style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{v:"grid",i:"⊞"},{v:"table",i:"≡"}].map(({v,i})=>(
                <button key={v} onClick={()=>setView(v)} className="r-btn" style={{...raj(14,700),color:view===v?C.orange:C.muted,background:view===v?`${C.orange}18`:C.panel,border:`1px solid ${view===v?C.orange:C.navy}`,padding:"7px 12px",cursor:"pointer"}}>{i}</button>
              ))}
            </div>
            <span style={{...raj(11,600),color:C.muted}}>Dificultad:</span>
            {["all",...DIFICULTADES].map(v=><button key={v} onClick={()=>{setFilterDif(v);setPage(1);}} className="r-btn" style={fBtn(filterDif===v,DIFICULTAD_COLOR[v]||C.orange)}>{v==="all"?"Todas":v}</button>)}
            <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
            {[{v:"all",l:"Todas"},{v:"active",l:"● Activas"},{v:"inactive",l:"● Inactivas"}].map(o=><button key={o.v} onClick={()=>{setFilterAct(o.v);setPage(1);}} className="r-btn" style={fBtn(filterAct===o.v,o.v==="active"?C.green:C.red)}>{o.l}</button>)}
            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              {selected.size>0&&<button onClick={bulkDelete} className="r-btn" style={{...raj(11,700),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Trash2 size={12}/> Eliminar ({selected.size})</button>}
              <button onClick={refresh} className="r-btn" style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"7px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={12} style={{animation:refreshing?"r-spin .8s linear infinite":"none"}}/> Actualizar</button>
              <button onClick={()=>setModal({type:"form",r:null})} className="r-btn" style={{...px(7),color:C.bg,background:C.green,border:"none",padding:"7px 14px",cursor:"pointer",boxShadow:`0 3px 14px ${C.green}33`,display:"flex",alignItems:"center",gap:6}}><Plus size={13}/> NUEVA</button>
            </div>
          </div>
        </div>

        <div style={{...raj(12,500),color:C.muted}}>
          {filtered.length} rutina{filtered.length!==1?"s":""} · página {page}/{totalPages}
          {selected.size>0&&<span style={{color:C.orange,marginLeft:12}}>{selected.size} seleccionada{selected.size!==1?"s":""}</span>}
        </div>

        {/* GRID */}
        {view==="grid"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
            {paginated.length===0?<div style={{gridColumn:"1/-1",padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((r,i)=>{
              const m=TAXONOMIA[r.categoria]||{};const c=m.color||C.orange;const sel=selected.has(r.id);
              return (
                <div key={r.id} className="r-card" style={{background:C.card,border:`1px solid ${sel?C.orange:c}33`,boxShadow:sel?`0 0 16px ${C.orange}22`:"0 4px 16px rgba(0,0,0,.3)",overflow:"hidden",animation:`r-cardIn .4s ease ${i*.05}s both`,position:"relative"}}>
                  <input type="checkbox" checked={sel} onChange={()=>toggleSelect(r.id)} style={{position:"absolute",top:10,left:10,accentColor:C.orange,width:14,height:14,cursor:"pointer",zIndex:2}}/>
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>
                  <div style={{padding:"16px 16px 12px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                      <div style={{fontSize:34,filter:`drop-shadow(0 0 8px ${c}88)`}}>{r.imagen}</div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <CatBadge cat={r.categoria}/><SubBadge sub={r.subcategoria} cat={r.categoria}/>
                      </div>
                    </div>
                    <div style={{...raj(14,700),color:C.white,marginBottom:5,lineHeight:1.3}}>{r.nombre}</div>
                    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                      <DifBadge dif={r.dificultad}/>
                      <span style={{...raj(10,600),color:r.activo?C.green:C.red,background:r.activo?`${C.green}14`:`${C.red}14`,border:`1px solid ${r.activo?C.green:C.red}33`,padding:"2px 8px"}}>{r.activo?"● ACTIVA":"● INACTIVA"}</span>
                    </div>
                    <DiaChips dias={r.diasSemana} color={c}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
                      {[{l:"XP",v:`+${r.xpTotal}`,c:C.gold},{l:"PASOS",v:r.pasos.length,c:c},{l:"MIN",v:r.duracionMin,c:C.orange},{l:"SESIONES",v:r.sesiones,c:C.blue}].map((s,idx)=>(
                        <div key={idx} style={{background:C.panel,border:`1px solid ${s.c}18`,padding:"7px 8px"}}>
                          <div style={{...raj(13,700),color:s.c}}>{s.v}</div><div style={{...px(5),color:C.muted}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:10}}><MiniBar val={(r.sesiones/100)*100} color={c} height={4}/></div>
                  </div>
                  <div style={{borderTop:`1px solid ${C.navy}33`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",r}),l:"Ver"},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",r}),l:"Editar"},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",r}),l:"Borrar"}].map(({Icon,c:ic,fn,l},j)=>(
                      <button key={j} onClick={fn} className="r-btn"
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
            <div style={{display:"grid",gridTemplateColumns:"34px 2.2fr 1fr 0.9fr 0.9fr 0.8fr 0.7fr 0.6fr 0.6fr 95px",padding:"10px 14px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:8,alignItems:"center"}}>
              <input type="checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
              {[{l:"RUTINA",k:"nombre"},{l:"CATEG.",k:"categoria"},{l:"SUBCATEG.",k:"subcategoria"},{l:"DIFICULD.",k:"dificultad"},{l:"DÍAS",k:null},{l:"XP",k:"xpTotal"},{l:"SESIONES",k:"sesiones"},{l:"ESTADO",k:"activo"}].map((h,i)=>(
                <div key={i} className={h.k?"r-sort":""} onClick={()=>h.k&&sort(h.k)}
                  style={{display:"flex",alignItems:"center",gap:3,...px(5),color:sortKey===h.k?C.orange:C.muted,letterSpacing:".05em"}}>
                  {h.l}{h.k&&<SortIcon active={sortKey===h.k} dir={sortDir}/>}
                </div>
              ))}
              <span style={{...px(5),color:C.muted,letterSpacing:".05em"}}>ACC.</span>
            </div>
            {paginated.length===0?<div style={{padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((r,i)=>{
              const c=TAXONOMIA[r.categoria]?.color||C.orange;
              return (
                <div key={r.id} className="r-row" style={{display:"grid",gridTemplateColumns:"34px 2.2fr 1fr 0.9fr 0.9fr 0.8fr 0.7fr 0.6fr 0.6fr 95px",padding:"11px 14px",borderBottom:`1px solid ${C.navy}22`,gap:8,alignItems:"center",animation:`r-slideU .3s ease ${i*.04}s both`,background:selected.has(r.id)?`${C.orange}08`:"transparent"}}>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleSelect(r.id)} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                    <div style={{width:32,height:32,background:`${c}18`,border:`1px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{r.imagen}</div>
                    <div style={{minWidth:0}}><div style={{...raj(13,700),color:C.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.nombre}</div></div>
                  </div>
                  <CatBadge cat={r.categoria}/>
                  <SubBadge sub={r.subcategoria} cat={r.categoria}/>
                  <DifBadge dif={r.dificultad}/>
                  <div style={{opacity:.75,transform:"scale(.85)",transformOrigin:"left"}}><DiaChips dias={r.diasSemana} color={c}/></div>
                  <span style={{...orb(12,900),color:C.gold}}>+{r.xpTotal}</span>
                  <div><div style={{...raj(11,700),color:C.blue,marginBottom:2}}>{r.sesiones}</div><MiniBar val={(r.sesiones/100)*100} color={C.blue} height={3}/></div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:r.activo?C.green:C.red,animation:r.activo?"r-pulse 1.8s infinite":"none"}}/>
                    <span style={{...raj(10,600),color:r.activo?C.green:C.red}}>{r.activo?"ON":"OFF"}</span>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",r})},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",r})},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",r})}].map(({Icon,c:ic,fn},j)=>(
                      <button key={j} onClick={fn} className="r-icon-btn"
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
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} className="r-input"
              style={{padding:"6px 10px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...raj(12,500),cursor:"pointer"}}>
              {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setPage(1)} disabled={page===1} className="r-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 11px",cursor:page===1?"not-allowed":"pointer"}}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="r-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 10px",cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className="r-btn"
                style={{background:n===page?C.orange:C.panel,border:`1px solid ${n===page?C.orange:C.navy}`,color:n===page?C.bg:C.muted,padding:"6px 13px",cursor:"pointer",...raj(13,n===page?700:500)}}>
                {n}
              </button>
            ))}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="r-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 10px",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronRight size={13}/></button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} className="r-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 11px",cursor:page===totalPages?"not-allowed":"pointer"}}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}