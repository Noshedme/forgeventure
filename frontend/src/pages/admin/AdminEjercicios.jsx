// src/pages/admin/AdminEjercicios.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de ejercicios para el Admin de ForgeVenture.
//  Conectar: getEjercicios(), createEjercicio(), updateEjercicio(),
//            deleteEjercicio() desde api.js cuando esté el backend.
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, Filter, RefreshCw, Eye, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Dumbbell, Zap, Clock,
  Flame, Target, Star, BarChart2, Camera, Timer,
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
  @keyframes e-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes e-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes e-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes e-modalIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes e-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes e-pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

  .e-row { transition:background .15s; }
  .e-row:hover { background:${C.navyL}18 !important; }
  .e-btn { transition:all .18s; cursor:pointer; }
  .e-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .e-icon-btn { transition:all .2s; cursor:pointer; }
  .e-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .e-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22,0 0 14px ${C.orange}18; }
  .e-input::placeholder { color:${C.navy}; }
  .e-sort { cursor:pointer; transition:color .2s; user-select:none; }
  .e-sort:hover { color:${C.orange} !important; }
  .e-card:hover { border-color:${C.orange}55 !important; transform:translateY(-3px); box-shadow:0 12px 36px rgba(0,0,0,.4) !important; }
  .e-card { transition:all .22s; }
  .e-tag-del { transition:all .2s; }
  .e-tag-del:hover { background:${C.red}22 !important; color:${C.red} !important; }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Categorías y músculos ──────────────────────────────────────
const CATEGORIAS = ["Fuerza","Cardio","Flexibilidad","HIIT","Yoga","Pilates","Calistenia","Funcional"];
const MUSCULOS   = ["Pecho","Espalda","Hombros","Bíceps","Tríceps","Abdomen","Piernas","Glúteos","Pantorrillas","Cuerpo completo"];
const DIFICULTADES = ["Principiante","Intermedio","Avanzado","Élite"];
const VERIFICACION = ["Cámara","Timer","Ambos"];

const CAT_COLOR = {
  "Fuerza":       C.orange, "Cardio":    C.blue,   "Flexibilidad": C.purple,
  "HIIT":         C.red,    "Yoga":      C.teal,   "Pilates":      "#FF69B4",
  "Calistenia":   C.gold,   "Funcional": C.green,
};
const DIFICULTAD_COLOR = {
  "Principiante": C.green, "Intermedio": C.gold,
  "Avanzado":     C.orange,"Élite":      C.red,
};

// ── Mock data ─────────────────────────────────────────────────
const MOCK_EJERCICIOS = [
  { id:"e1",  nombre:"Flexiones",          categoria:"Fuerza",       musculos:["Pecho","Tríceps","Hombros"],     dificultad:"Principiante", duracion:null, series:3, reps:15, xpBase:30, verificacion:"Cámara",  activo:true,  descripcion:"Ejercicio clásico de empuje para desarrollar fuerza en el tren superior.", imagen:"💪", sesiones:148, creadoEn:"2024-10-01" },
  { id:"e2",  nombre:"Sentadillas",        categoria:"Fuerza",       musculos:["Piernas","Glúteos"],             dificultad:"Principiante", duracion:null, series:4, reps:12, xpBase:35, verificacion:"Cámara",  activo:true,  descripcion:"Ejercicio fundamental para el desarrollo del tren inferior.",              imagen:"🦵", sesiones:132, creadoEn:"2024-10-01" },
  { id:"e3",  nombre:"Cardio Libre",       categoria:"Cardio",       musculos:["Cuerpo completo"],               dificultad:"Intermedio",   duracion:30,   series:1, reps:null,xpBase:60, verificacion:"Timer",   activo:true,  descripcion:"30 minutos de cardio continuo a ritmo moderado.",                         imagen:"🏃", sesiones:118, creadoEn:"2024-10-05" },
  { id:"e4",  nombre:"Plancha",            categoria:"Funcional",    musculos:["Abdomen","Hombros","Espalda"],   dificultad:"Intermedio",   duracion:60,   series:3, reps:null,xpBase:40, verificacion:"Timer",   activo:true,  descripcion:"Ejercicio isométrico para fortalecer el core y la estabilidad.",          imagen:"🏋️", sesiones:89,  creadoEn:"2024-10-08" },
  { id:"e5",  nombre:"Dominadas",          categoria:"Calistenia",   musculos:["Espalda","Bíceps"],              dificultad:"Avanzado",     duracion:null, series:3, reps:8,  xpBase:55, verificacion:"Cámara",  activo:true,  descripcion:"Ejercicio compuesto para la musculatura de la espalda y brazos.",          imagen:"🔝", sesiones:67,  creadoEn:"2024-10-10" },
  { id:"e6",  nombre:"Yoga Matutino",      categoria:"Yoga",         musculos:["Cuerpo completo"],               dificultad:"Principiante", duracion:20,   series:1, reps:null,xpBase:45, verificacion:"Timer",   activo:true,  descripcion:"Rutina de yoga para comenzar el día con energía y flexibilidad.",         imagen:"🧘", sesiones:54,  creadoEn:"2024-10-12" },
  { id:"e7",  nombre:"HIIT Explosivo",     categoria:"HIIT",         musculos:["Cuerpo completo","Piernas"],     dificultad:"Avanzado",     duracion:20,   series:6, reps:null,xpBase:90, verificacion:"Timer",   activo:true,  descripcion:"Intervalos de alta intensidad para quemar grasa y mejorar resistencia.",  imagen:"⚡", sesiones:43,  creadoEn:"2024-11-01" },
  { id:"e8",  nombre:"Press Militar",      categoria:"Fuerza",       musculos:["Hombros","Tríceps"],             dificultad:"Intermedio",   duracion:null, series:4, reps:10, xpBase:45, verificacion:"Cámara",  activo:true,  descripcion:"Ejercicio de empuje vertical para desarrollar hombros fuertes.",           imagen:"🏋️", sesiones:38,  creadoEn:"2024-11-05" },
  { id:"e9",  nombre:"Burpees",            categoria:"HIIT",         musculos:["Cuerpo completo"],               dificultad:"Avanzado",     duracion:null, series:4, reps:10, xpBase:70, verificacion:"Cámara",  activo:false, descripcion:"Ejercicio de cuerpo completo que combina fuerza y cardio.",               imagen:"💥", sesiones:31,  creadoEn:"2024-11-10" },
  { id:"e10", nombre:"Estiramiento Total", categoria:"Flexibilidad", musculos:["Cuerpo completo"],               dificultad:"Principiante", duracion:15,   series:1, reps:null,xpBase:20, verificacion:"Timer",   activo:true,  descripcion:"Rutina de estiramientos para mejorar la flexibilidad general.",           imagen:"🤸", sesiones:28,  creadoEn:"2024-11-15" },
  { id:"e11", nombre:"Fondos en Paralelas",categoria:"Calistenia",   musculos:["Pecho","Tríceps","Hombros"],     dificultad:"Avanzado",     duracion:null, series:3, reps:12, xpBase:55, verificacion:"Cámara",  activo:true,  descripcion:"Ejercicio de calistenia para el desarrollo del tren superior.",           imagen:"💪", sesiones:22,  creadoEn:"2024-11-20" },
  { id:"e12", nombre:"Pilates Core",       categoria:"Pilates",      musculos:["Abdomen","Espalda"],             dificultad:"Intermedio",   duracion:25,   series:1, reps:null,xpBase:35, verificacion:"Timer",   activo:true,  descripcion:"Sesión de pilates enfocada en fortalecer el núcleo corporal.",            imagen:"🧘", sesiones:19,  creadoEn:"2024-12-01" },
];

const EMPTY_FORM = { nombre:"", categoria:"Fuerza", musculos:[], dificultad:"Principiante", duracion:"", series:3, reps:10, xpBase:30, verificacion:"Cámara", activo:true, descripcion:"", imagen:"💪" };
const EMOJIS = ["💪","🏃","🧘","🏋️","⚡","🔥","💥","🤸","🏆","⚔️","🎯","🦵","🔝","🌟","💨"];
const PAGE_SIZE_OPTIONS = [6,12,24];

// ── Helpers UI ────────────────────────────────────────────────
function CatBadge({ cat }) {
  const c = CAT_COLOR[cat] || C.muted;
  return <span style={{ ...raj(10,700), color:c, background:`${c}14`, border:`1px solid ${c}33`, padding:"2px 8px", whiteSpace:"nowrap" }}>{cat}</span>;
}
function DifBadge({ dif }) {
  const c = DIFICULTAD_COLOR[dif] || C.muted;
  return <span style={{ ...raj(10,700), color:c, background:`${c}14`, border:`1px solid ${c}33`, padding:"2px 8px", whiteSpace:"nowrap" }}>{dif}</span>;
}
function MiniBar({ val, color, height=5 }) {
  return (
    <div style={{ height, background:C.panel, border:`1px solid ${color}22`, overflow:"hidden", width:"100%" }}>
      <div style={{ height:"100%", width:`${Math.min(val,100)}%`, background:color, boxShadow:`0 0 5px ${color}66`, transition:"width .6s ease" }}/>
    </div>
  );
}
function SortIcon({ active, dir }) {
  if (!active) return <ChevronDown size={11} color={C.navy}/>;
  return dir==="asc" ? <ChevronUp size={11} color={C.orange}/> : <ChevronDown size={11} color={C.orange}/>;
}
function Spinner({ color=C.orange }) {
  return <div style={{ width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"e-spin .8s linear infinite" }}/>;
}

// ── Chip musculos ─────────────────────────────────────────────
function MusculoChips({ list, color=C.blue }) {
  const show = list.slice(0,2);
  const rest = list.length - 2;
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {show.map(m => <span key={m} style={{ ...raj(10,600), color, background:`${color}12`, border:`1px solid ${color}22`, padding:"1px 6px" }}>{m}</span>)}
      {rest > 0 && <span style={{ ...raj(10,600), color:C.muted, background:`${C.muted}12`, border:`1px solid ${C.muted}22`, padding:"1px 6px" }}>+{rest}</span>}
    </div>
  );
}

// ── Multi-select chips ────────────────────────────────────────
function MultiSelect({ options, value, onChange, color=C.blue }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter(v=>v!==opt) : [...value, opt]);
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(opt => {
        const on = value.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)} className="e-btn"
            style={{ ...raj(11,on?700:500), color:on?color:C.muted, background:on?`${color}18`:"transparent", border:`1px solid ${on?color:C.navy}`, padding:"4px 10px", cursor:"pointer", transition:"all .18s" }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Ver ejercicio
// ══════════════════════════════════════════════════════════════
function ViewModal({ ej, onClose, onEdit }) {
  const c = CAT_COLOR[ej.categoria] || C.orange;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%",maxWidth:540,background:C.card,border:`1px solid ${c}44`,boxShadow:`0 0 60px ${c}11,0 24px 60px rgba(0,0,0,.6)`,animation:"e-modalIn .25s ease both",overflow:"hidden" }}>
        <div style={{ height:3,background:`linear-gradient(90deg,transparent,${c},transparent)` }}/>

        {/* header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}` }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:46,height:46,background:`${c}18`,border:`2px solid ${c}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>{ej.imagen}</div>
            <div>
              <div style={{ ...orb(14,900),color:C.white }}>{ej.nombre}</div>
              <div style={{ display:"flex",gap:8,marginTop:4 }}>
                <CatBadge cat={ej.categoria}/><DifBadge dif={ej.dificultad}/>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="e-icon-btn" style={{ background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex" }}><X size={15}/></button>
        </div>

        <div style={{ padding:22,display:"flex",flexDirection:"column",gap:16 }}>
          {/* stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
            {[
              { label:"XP BASE",    value:`+${ej.xpBase}`,            color:C.gold   },
              { label:"SESIONES",   value:ej.sesiones.toLocaleString(),color:C.blue   },
              { label:ej.duracion?"DURACIÓN":"SERIES×REPS", value:ej.duracion?`${ej.duracion}min`:`${ej.series}×${ej.reps}`, color:C.orange },
              { label:"VERIFICACIÓN",value:ej.verificacion,            color:C.teal   },
            ].map((s,i)=>(
              <div key={i} style={{ background:C.panel,border:`1px solid ${s.color}22`,padding:"12px 10px",textAlign:"center" }}>
                <div style={{ ...orb(13,900),color:s.color,marginBottom:3 }}>{s.value}</div>
                <div style={{ ...px(5),color:C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* descripcion */}
          <div style={{ background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px" }}>
            <div style={{ ...px(6),color:C.muted,marginBottom:8,letterSpacing:".05em" }}>📝 DESCRIPCIÓN</div>
            <p style={{ ...raj(13,400),color:C.white,lineHeight:1.7 }}>{ej.descripcion}</p>
          </div>

          {/* músculos */}
          <div>
            <div style={{ ...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em" }}>💪 MÚSCULOS TRABAJADOS</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {ej.musculos.map(m=>(
                <span key={m} style={{ ...raj(12,600),color:C.blue,background:`${C.blue}14`,border:`1px solid ${C.blue}33`,padding:"4px 12px" }}>{m}</span>
              ))}
            </div>
          </div>

          {/* popularidad */}
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ ...raj(12,600),color:C.muted }}>Popularidad ({ej.sesiones} sesiones)</span>
              <span style={{ ...raj(12,700),color:c }}>{Math.round((ej.sesiones/200)*100)}%</span>
            </div>
            <MiniBar val={(ej.sesiones/200)*100} color={c} height={7}/>
          </div>

          {/* status + actions */}
          <div style={{ display:"flex",gap:10 }}>
            <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,background:C.panel,border:`1px solid ${ej.activo?C.green:C.red}33`,padding:"10px 14px" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:ej.activo?C.green:C.red,animation:ej.activo?"e-pulse 1.5s infinite":"none" }}/>
              <span style={{ ...raj(13,700),color:ej.activo?C.green:C.red }}>{ej.activo?"ACTIVO":"INACTIVO"}</span>
            </div>
            <button onClick={()=>{onClose();onEdit(ej);}} className="e-btn" style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,...px(7),color:C.bg,background:C.orange,border:"none",padding:"10px",cursor:"pointer",boxShadow:`0 3px 14px ${C.orange}44` }}>
              <Edit2 size={13}/> EDITAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Crear / Editar ejercicio
// ══════════════════════════════════════════════════════════════
function FormModal({ ej, onClose, onSave }) {
  const isEdit = !!ej;
  const [form,    setForm]    = useState(ej ? { ...ej } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [shake,   setShake]   = useState(false);
  const [tab,     setTab]     = useState("general"); // general | musculos | config

  const set = (k,v) => setForm(f=>({ ...f,[k]:v }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())       e.nombre = "El nombre es requerido";
    if (!form.descripcion.trim())  e.descripcion = "La descripción es requerida";
    if (!form.musculos.length)     e.musculos = "Selecciona al menos un músculo";
    if (form.xpBase < 1)           e.xpBase = "Mínimo 1 XP";
    return e;
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(()=>setShake(false),500); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,900)); // ← reemplazar con createEjercicio / updateEjercicio
    setLoading(false);
    onSave({ ...form, id: ej?.id || `e${Date.now()}`, sesiones: ej?.sesiones||0, creadoEn: ej?.creadoEn || new Date().toISOString().slice(0,10) });
    onClose();
  };

  const borderColor = isEdit ? C.orange : C.green;
  const inpSt = (err) => ({ width:"100%",padding:"12px 14px",background:C.panel,border:`1px solid ${err?C.red:C.navy}`,color:C.white,...raj(14,500) });
  const lbl   = { display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em" };
  const TABS  = [{ id:"general",label:"GENERAL" },{ id:"musculos",label:"MÚSCULOS" },{ id:"config",label:"CONFIG" }];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%",maxWidth:600,background:C.card,border:`1px solid ${borderColor}44`,boxShadow:`0 0 60px ${borderColor}0E,0 24px 60px rgba(0,0,0,.6)`,animation:"e-modalIn .25s ease both",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column" }}>
        <div style={{ height:3,background:`linear-gradient(90deg,transparent,${borderColor},transparent)`,flexShrink:0 }}/>

        {/* header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:`1px solid ${C.navy}`,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {isEdit ? <Edit2 size={15} color={C.orange}/> : <Plus size={15} color={C.green}/>}
            <span style={{ ...orb(12,700),color:C.white }}>{isEdit?"EDITAR EJERCICIO":"NUEVO EJERCICIO"}</span>
            {isEdit && <span style={{ ...raj(12,500),color:C.muted }}>— {ej.nombre}</span>}
          </div>
          <button onClick={onClose} className="e-icon-btn" style={{ background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex" }}><X size={15}/></button>
        </div>

        {/* tabs */}
        <div style={{ display:"flex",borderBottom:`1px solid ${C.navy}`,flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="e-btn" style={{ flex:1,padding:"11px 0",...raj(12,tab===t.id?700:500),color:tab===t.id?borderColor:C.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?borderColor:"transparent"}`,cursor:"pointer",transition:"all .2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div style={{ padding:22,overflowY:"auto",flex:1 }} className={shake?"e-shake":""}>

          {/* ── TAB: GENERAL ── */}
          {tab==="general" && (
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              {/* emoji + nombre */}
              <div style={{ display:"grid",gridTemplateColumns:"100px 1fr",gap:14 }}>
                <div>
                  <label style={lbl}>🎨 ICONO</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5 }}>
                    {EMOJIS.map(e=>(
                      <button key={e} type="button" onClick={()=>set("imagen",e)} className="e-btn"
                        style={{ fontSize:18,background:form.imagen===e?`${C.orange}22`:"transparent",border:`1px solid ${form.imagen===e?C.orange:C.navy}`,padding:"6px",cursor:"pointer",transition:"all .18s" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>📝 NOMBRE</label>
                  <input className="e-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: Flexiones Diamante" style={inpSt(errors.nombre)}/>
                  {errors.nombre && <p style={{ ...raj(11),color:C.red,marginTop:4 }}>⚠ {errors.nombre}</p>}

                  <label style={{ ...lbl,marginTop:12 }}>🗂️ CATEGORÍA</label>
                  <select className="e-input" value={form.categoria} onChange={e=>set("categoria",e.target.value)} style={{ ...inpSt(false),appearance:"none" }}>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* descripcion */}
              <div>
                <label style={lbl}>📋 DESCRIPCIÓN</label>
                <textarea className="e-input" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)}
                  placeholder="Describe el ejercicio, técnica correcta, beneficios..."
                  rows={3} style={{ ...inpSt(errors.descripcion),resize:"vertical" }}/>
                {errors.descripcion && <p style={{ ...raj(11),color:C.red,marginTop:4 }}>⚠ {errors.descripcion}</p>}
              </div>

              {/* dificultad + estado */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                <div>
                  <label style={lbl}>⚡ DIFICULTAD</label>
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    {DIFICULTADES.map(d=>{
                      const c = DIFICULTAD_COLOR[d];
                      const on = form.dificultad===d;
                      return (
                        <button key={d} type="button" onClick={()=>set("dificultad",d)} className="e-btn"
                          style={{ ...raj(12,on?700:500),color:on?c:C.muted,background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,padding:"8px 12px",cursor:"pointer",textAlign:"left",transition:"all .18s" }}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={lbl}>● ESTADO</label>
                  {[{v:true,label:"ACTIVO",c:C.green},{v:false,label:"INACTIVO",c:C.red}].map(o=>(
                    <button key={String(o.v)} type="button" onClick={()=>set("activo",o.v)} className="e-btn"
                      style={{ width:"100%",marginBottom:8,...raj(12,form.activo===o.v?700:500),color:form.activo===o.v?o.c:C.muted,background:form.activo===o.v?`${o.c}18`:"transparent",border:`1px solid ${form.activo===o.v?o.c:C.navy}`,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s" }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",background:form.activo===o.v?o.c:C.navy }}/>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: MÚSCULOS ── */}
          {tab==="musculos" && (
            <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
              <div>
                <label style={lbl}>💪 MÚSCULOS TRABAJADOS</label>
                <p style={{ ...raj(12,400),color:C.muted,marginBottom:12,lineHeight:1.5 }}>Selecciona todos los grupos musculares que trabaja este ejercicio.</p>
                <MultiSelect options={MUSCULOS} value={form.musculos} onChange={v=>set("musculos",v)} color={C.blue}/>
                {errors.musculos && <p style={{ ...raj(11),color:C.red,marginTop:8 }}>⚠ {errors.musculos}</p>}
              </div>

              {form.musculos.length > 0 && (
                <div style={{ background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px" }}>
                  <div style={{ ...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em" }}>SELECCIONADOS ({form.musculos.length})</div>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {form.musculos.map(m=>(
                      <span key={m} style={{ ...raj(12,600),color:C.blue,background:`${C.blue}14`,border:`1px solid ${C.blue}33`,padding:"4px 10px",display:"flex",alignItems:"center",gap:6 }}>
                        {m}
                        <button type="button" onClick={()=>set("musculos",form.musculos.filter(x=>x!==m))} className="e-tag-del"
                          style={{ background:"transparent",border:"none",cursor:"pointer",color:C.muted,display:"flex",lineHeight:1,padding:2 }}>
                          <X size={11}/>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CONFIGURACIÓN ── */}
          {tab==="config" && (
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              {/* verificacion */}
              <div>
                <label style={lbl}>📹 MODO DE VERIFICACIÓN</label>
                <div style={{ display:"flex",gap:8 }}>
                  {VERIFICACION.map(v=>{
                    const on = form.verificacion===v;
                    const ic = v==="Cámara"?<Camera size={14}/>:v==="Timer"?<Timer size={14}/>:<><Camera size={14}/><Timer size={14}/></>;
                    return (
                      <button key={v} type="button" onClick={()=>set("verificacion",v)} className="e-btn"
                        style={{ flex:1,...raj(12,on?700:500),color:on?C.teal:C.muted,background:on?`${C.teal}18`:"transparent",border:`1px solid ${on?C.teal:C.navy}`,padding:"12px 8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .18s" }}>
                        {ic} {v}
                      </button>
                    );
                  })}
                </div>
                <p style={{ ...raj(11,400),color:C.muted,marginTop:8,lineHeight:1.5 }}>
                  {form.verificacion==="Cámara" && "MediaPipe detectará y contará las repeticiones automáticamente."}
                  {form.verificacion==="Timer"  && "El usuario deberá mantener el tiempo activo en la app."}
                  {form.verificacion==="Ambos"  && "El usuario puede elegir entre cámara o timer."}
                </p>
              </div>

              {/* series / reps / duracion */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
                <div>
                  <label style={lbl}>🔁 SERIES</label>
                  <input className="e-input" type="number" min={1} value={form.series} onChange={e=>set("series",Number(e.target.value))} style={inpSt(false)}/>
                </div>
                <div>
                  <label style={lbl}>🏋️ REPS</label>
                  <input className="e-input" type="number" min={1} value={form.reps||""} onChange={e=>set("reps",Number(e.target.value)||null)} placeholder="—" style={inpSt(false)}/>
                  <p style={{ ...raj(10,400),color:C.muted,marginTop:4 }}>Dejar vacío si es por tiempo</p>
                </div>
                <div>
                  <label style={lbl}>⏱️ DURACIÓN (min)</label>
                  <input className="e-input" type="number" min={1} value={form.duracion||""} onChange={e=>set("duracion",Number(e.target.value)||null)} placeholder="—" style={inpSt(false)}/>
                  <p style={{ ...raj(10,400),color:C.muted,marginTop:4 }}>Dejar vacío si es por reps</p>
                </div>
              </div>

              {/* xp */}
              <div>
                <label style={lbl}>⚡ XP BASE POR SESIÓN</label>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <input className="e-input" type="range" min={5} max={200} step={5} value={form.xpBase} onChange={e=>set("xpBase",Number(e.target.value))}
                    style={{ flex:1,accentColor:C.gold,cursor:"pointer" }}/>
                  <div style={{ background:C.panel,border:`1px solid ${C.gold}44`,padding:"10px 16px",minWidth:80,textAlign:"center" }}>
                    <span style={{ ...orb(16,900),color:C.gold }}>+{form.xpBase}</span>
                    <div style={{ ...raj(10,500),color:C.muted,marginTop:2 }}>XP</div>
                  </div>
                </div>
                <p style={{ ...raj(11,400),color:C.muted,marginTop:6 }}>
                  El XP real puede ser mayor según la clase del héroe y dificultad completada.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ display:"flex",gap:10,padding:"16px 22px",borderTop:`1px solid ${C.navy}`,flexShrink:0 }}>
          <button onClick={onClose} className="e-btn" style={{ flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 20px",cursor:"pointer" }}>
            CANCELAR
          </button>
          <button onClick={save} disabled={loading} className="e-btn" style={{ flex:1,...px(8),color:loading?C.muted:C.bg,background:loading?`${borderColor}55`:borderColor,border:"none",padding:"12px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 4px 20px ${borderColor}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
            {loading ? <><Spinner color={borderColor}/> GUARDANDO...</> : <><Check size={14}/> {isEdit?"GUARDAR CAMBIOS":"CREAR EJERCICIO"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Eliminar
// ══════════════════════════════════════════════════════════════
function DeleteModal({ ej, onClose, onConfirm }) {
  const [typed,   setTyped]   = useState("");
  const [loading, setLoading] = useState(false);
  const match = typed === ej.nombre;

  const confirm = async () => {
    if (!match) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,700)); // ← reemplazar con deleteEjercicio(token, id)
    setLoading(false);
    onConfirm(ej.id);
    onClose();
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%",maxWidth:420,background:C.card,border:`1px solid ${C.red}44`,boxShadow:`0 0 60px ${C.red}14,0 24px 60px rgba(0,0,0,.6)`,animation:"e-modalIn .25s ease both",overflow:"hidden" }}>
        <div style={{ height:3,background:`linear-gradient(90deg,transparent,${C.red},transparent)` }}/>
        <div style={{ padding:"22px 24px 26px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:18 }}>
            <div style={{ background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex" }}>
              <AlertTriangle size={22} color={C.red}/>
            </div>
            <div>
              <div style={{ ...orb(13,900),color:C.red,marginBottom:3 }}>ELIMINAR EJERCICIO</div>
              <div style={{ ...raj(12,500),color:C.muted }}>Esta acción no se puede deshacer</div>
            </div>
          </div>

          <div style={{ background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:"12px 16px",marginBottom:18,display:"flex",gap:12,alignItems:"center" }}>
            <span style={{ fontSize:24 }}>{ej.imagen}</span>
            <div>
              <div style={{ ...raj(14,700),color:C.red }}>{ej.nombre}</div>
              <div style={{ ...raj(12,400),color:C.muted }}>{ej.categoria} · {ej.sesiones} sesiones</div>
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block",...px(6),color:C.muted,marginBottom:8,letterSpacing:".06em" }}>
              ESCRIBE <span style={{ color:C.red }}>{ej.nombre}</span> PARA CONFIRMAR
            </label>
            <input className="e-input" value={typed} onChange={e=>setTyped(e.target.value)} placeholder={ej.nombre}
              style={{ width:"100%",padding:"12px 14px",background:C.panel,border:`1px solid ${match?C.red:C.navy}`,color:C.white,...raj(14,600) }}/>
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} className="e-btn" style={{ flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 18px",cursor:"pointer" }}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="e-btn"
              style={{ flex:1,...px(7),color:(match&&!loading)?C.white:C.muted,background:(match&&!loading)?C.red:`${C.red}22`,border:`1px solid ${C.red}55`,padding:"12px",cursor:match?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .2s" }}>
              {loading ? <><Spinner color={C.red}/> ELIMINANDO...</> : <><Trash2 size={13}/> ELIMINAR</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminEjercicios() {
  const [ejercicios,  setEjercicios]  = useState(MOCK_EJERCICIOS);
  const [view,        setView]        = useState("table"); // "table" | "grid"
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("all");
  const [filterDif,   setFilterDif]   = useState("all");
  const [filterAct,   setFilterAct]   = useState("all");
  const [filterVer,   setFilterVer]   = useState("all");
  const [sortKey,     setSortKey]     = useState("sesiones");
  const [sortDir,     setSortDir]     = useState("desc");
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(12);
  const [selected,    setSelected]    = useState(new Set());
  const [modal,       setModal]       = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise(r=>setTimeout(r,800)); // ← reemplazar con getEjercicios(token)
    setRefreshing(false);
  };

  // ── Filtro + orden ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...ejercicios];
    if (search)           list = list.filter(e=>e.nombre.toLowerCase().includes(search.toLowerCase())||e.descripcion.toLowerCase().includes(search.toLowerCase()));
    if (filterCat!=="all") list = list.filter(e=>e.categoria===filterCat);
    if (filterDif!=="all") list = list.filter(e=>e.dificultad===filterDif);
    if (filterAct!=="all") list = list.filter(e=>String(e.activo)===(filterAct==="active"?"true":"false"));
    if (filterVer!=="all") list = list.filter(e=>e.verificacion===filterVer);
    list.sort((a,b)=>{
      const av=a[sortKey]??""; const bv=b[sortKey]??"";
      return sortDir==="asc"?(av>bv?1:-1):(av<bv?1:-1);
    });
    return list;
  },[ejercicios,search,filterCat,filterDif,filterAct,filterVer,sortKey,sortDir]);

  const totalPages = Math.max(1,Math.ceil(filtered.length/pageSize));
  const paginated  = filtered.slice((page-1)*pageSize,page*pageSize);

  const sort = (key) => { if(sortKey===key)setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortKey(key);setSortDir("asc");} };
  const toggleSelect = id => setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll    = () => setSelected(s=>s.size===paginated.length?new Set():new Set(paginated.map(e=>e.id)));

  const handleSave = (saved) => setEjercicios(es=>{
    const idx = es.findIndex(e=>e.id===saved.id);
    if(idx>=0){ const a=[...es]; a[idx]=saved; return a; }
    return [saved,...es];
  });
  const handleDelete   = (id) => { setEjercicios(es=>es.filter(e=>e.id!==id)); setSelected(s=>{const n=new Set(s);n.delete(id);return n;}); };
  const bulkDelete     = () => { setEjercicios(es=>es.filter(e=>!selected.has(e.id))); setSelected(new Set()); };
  const bulkToggle     = (activo) => setEjercicios(es=>es.map(e=>selected.has(e.id)?{...e,activo}:e));

  const kpis = useMemo(()=>({
    total:    ejercicios.length,
    activos:  ejercicios.filter(e=>e.activo).length,
    sesiones: ejercicios.reduce((s,e)=>s+e.sesiones,0),
    avgXP:    Math.round(ejercicios.reduce((s,e)=>s+e.xpBase,0)/ejercicios.length),
  }),[ejercicios]);

  const fBtn = (on,c=C.orange) => ({ ...raj(11,on?700:600), color:on?c:C.muted, background:on?`${c}18`:"transparent", border:`1px solid ${on?c:C.navy}`, padding:"5px 12px", cursor:"pointer", transition:"all .18s", boxShadow:on?`0 0 8px ${c}22`:"none" });

  return (
    <>
      <style>{CSS}</style>

      {modal?.type==="view"   && <ViewModal ej={modal.ej} onClose={()=>setModal(null)} onEdit={(e)=>setModal({type:"form",ej:e})}/>}
      {modal?.type==="form"   && <FormModal ej={modal.ej} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {modal?.type==="delete" && <DeleteModal ej={modal.ej} onClose={()=>setModal(null)} onConfirm={handleDelete}/>}

      <div style={{ display:"flex",flexDirection:"column",gap:18 }}>

        {/* ── KPIs ── */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12 }}>
          {[
            { label:"EJERCICIOS",    value:kpis.total,               icon:<Dumbbell size={18}/>, color:C.orange },
            { label:"ACTIVOS",       value:kpis.activos,             icon:<Zap size={18}/>,      color:C.green  },
            { label:"SESIONES TOTAL",value:kpis.sesiones.toLocaleString(), icon:<BarChart2 size={18}/>,color:C.blue },
            { label:"XP PROMEDIO",   value:`+${kpis.avgXP}`,         icon:<Star size={18}/>,     color:C.gold   },
          ].map((k,i)=>(
            <div key={i} style={{ background:C.card,border:`1px solid ${k.color}33`,padding:"18px 16px",position:"relative",overflow:"hidden",animation:`e-cardIn .4s ease ${i*.07}s both`,transition:"transform .2s,box-shadow .2s" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 32px rgba(0,0,0,.4)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color},transparent)` }}/>
              <div style={{ background:`${k.color}18`,border:`1px solid ${k.color}33`,padding:9,display:"inline-flex",color:k.color,marginBottom:10 }}>{k.icon}</div>
              <div style={{ ...orb(26,900),color:k.color,marginBottom:3 }}>{k.value}</div>
              <div style={{ ...px(6),color:C.muted,letterSpacing:".05em" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ background:C.card,border:`1px solid ${C.navy}`,padding:"14px 16px" }}>
          {/* top row */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap" }}>
            <div style={{ position:"relative",flex:"1 1 200px" }}>
              <Search size={13} color={C.muted} style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
              <input className="e-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Buscar ejercicio..."
                style={{ width:"100%",padding:"8px 12px 8px 30px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500) }}/>
              {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex" }}><X size={12}/></button>}
            </div>

            {/* vista */}
            <div style={{ display:"flex",gap:4 }}>
              {[{v:"table",icon:"≡"},{v:"grid",icon:"⊞"}].map(({v,icon})=>(
                <button key={v} onClick={()=>setView(v)} className="e-btn"
                  style={{ ...raj(14,700),color:view===v?C.orange:C.muted,background:view===v?`${C.orange}18`:C.panel,border:`1px solid ${view===v?C.orange:C.navy}`,padding:"7px 12px",cursor:"pointer" }}>
                  {icon}
                </button>
              ))}
            </div>

            <div style={{ display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap" }}>
              {selected.size>0 && (<>
                <button onClick={()=>bulkToggle(true)}  className="e-btn" style={{ ...raj(11,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}><Check size={12}/> Activar ({selected.size})</button>
                <button onClick={()=>bulkToggle(false)} className="e-btn" style={{ ...raj(11,700),color:C.orange,background:`${C.orange}14`,border:`1px solid ${C.orange}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}><X size={12}/> Desactivar ({selected.size})</button>
                <button onClick={bulkDelete}            className="e-btn" style={{ ...raj(11,700),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}><Trash2 size={12}/> Eliminar ({selected.size})</button>
              </>)}
              <button onClick={refresh} className="e-btn" style={{ ...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"7px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
                <RefreshCw size={12} style={{ animation:refreshing?"e-spin .8s linear infinite":"none" }}/> Actualizar
              </button>
              <button onClick={()=>setModal({type:"form",ej:null})} className="e-btn" style={{ ...px(7),color:C.bg,background:C.green,border:"none",padding:"7px 14px",cursor:"pointer",boxShadow:`0 3px 14px ${C.green}33`,display:"flex",alignItems:"center",gap:6 }}>
                <Plus size={13}/> NUEVO
              </button>
            </div>
          </div>

          {/* filtros */}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ ...raj(11,600),color:C.muted }}>Categoría:</span>
            {["all",...CATEGORIAS].map(v=>(
              <button key={v} onClick={()=>{setFilterCat(v);setPage(1);}} className="e-btn" style={fBtn(filterCat===v,CAT_COLOR[v]||C.orange)}>
                {v==="all"?"Todas":v}
              </button>
            ))}
            <div style={{ width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px" }}/>
            <span style={{ ...raj(11,600),color:C.muted }}>Dificultad:</span>
            {["all",...DIFICULTADES].map(v=>(
              <button key={v} onClick={()=>{setFilterDif(v);setPage(1);}} className="e-btn" style={fBtn(filterDif===v,DIFICULTAD_COLOR[v]||C.orange)}>
                {v==="all"?"Todas":v}
              </button>
            ))}
            <div style={{ width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px" }}/>
            <span style={{ ...raj(11,600),color:C.muted }}>Estado:</span>
            {[{v:"all",l:"Todos"},{v:"active",l:"● Activos"},{v:"inactive",l:"● Inactivos"}].map(o=>(
              <button key={o.v} onClick={()=>{setFilterAct(o.v);setPage(1);}} className="e-btn" style={fBtn(filterAct===o.v,o.v==="active"?C.green:C.red)}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* result count */}
        <div style={{ ...raj(12,500),color:C.muted }}>
          {filtered.length} ejercicio{filtered.length!==1?"s":""} · página {page}/{totalPages}
          {selected.size>0 && <span style={{ color:C.orange,marginLeft:12 }}>{selected.size} seleccionado{selected.size!==1?"s":""}</span>}
        </div>

        {/* ── TABLE VIEW ── */}
        {view==="table" && (
          <div style={{ background:C.card,border:`1px solid ${C.navy}`,overflow:"hidden" }}>
            {/* thead */}
            <div style={{ display:"grid",gridTemplateColumns:"36px 2.2fr 1fr 0.9fr 0.8fr 0.7fr 0.7fr 0.7fr 100px",padding:"10px 14px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:8,alignItems:"center" }}>
              <input type="checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll} style={{ accentColor:C.orange,width:14,height:14,cursor:"pointer" }}/>
              {[
                {label:"EJERCICIO",key:"nombre"},
                {label:"CATEGORÍA",key:"categoria"},
                {label:"DIFICULTAD",key:"dificultad"},
                {label:"SERIES",   key:"series"},
                {label:"XP BASE",  key:"xpBase"},
                {label:"SESIONES", key:"sesiones"},
                {label:"ESTADO",   key:"activo"},
              ].map(h=>(
                <div key={h.key} className="e-sort" onClick={()=>sort(h.key)}
                  style={{ display:"flex",alignItems:"center",gap:3,...px(5),color:sortKey===h.key?C.orange:C.muted,letterSpacing:".05em" }}>
                  {h.label}<SortIcon active={sortKey===h.key} dir={sortDir}/>
                </div>
              ))}
              <span style={{ ...px(5),color:C.muted,letterSpacing:".05em" }}>ACCIONES</span>
            </div>

            {paginated.length===0 ? (
              <div style={{ padding:40,textAlign:"center",...raj(14,500),color:C.muted }}>Sin resultados para esos filtros.</div>
            ) : paginated.map((ej,i)=>(
              <div key={ej.id} className="e-row" style={{ display:"grid",gridTemplateColumns:"36px 2.2fr 1fr 0.9fr 0.8fr 0.7fr 0.7fr 0.7fr 100px",padding:"11px 14px",borderBottom:`1px solid ${C.navy}22`,gap:8,alignItems:"center",animation:`e-slideU .3s ease ${i*.04}s both`,background:selected.has(ej.id)?`${C.orange}08`:"transparent" }}>
                <input type="checkbox" checked={selected.has(ej.id)} onChange={()=>toggleSelect(ej.id)} style={{ accentColor:C.orange,width:14,height:14,cursor:"pointer" }}/>

                {/* nombre */}
                <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
                  <div style={{ width:32,height:32,background:`${CAT_COLOR[ej.categoria]||C.muted}18`,border:`1px solid ${CAT_COLOR[ej.categoria]||C.muted}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0 }}>{ej.imagen}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ ...raj(13,700),color:C.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{ej.nombre}</div>
                    <MusculoChips list={ej.musculos} color={C.blue}/>
                  </div>
                </div>

                <CatBadge cat={ej.categoria}/>
                <DifBadge dif={ej.dificultad}/>

                {/* series×reps o duración */}
                <span style={{ ...raj(12,600),color:C.mutedL }}>
                  {ej.duracion ? `${ej.duracion}min` : `${ej.series}×${ej.reps}`}
                </span>

                {/* xp */}
                <span style={{ ...orb(13,900),color:C.gold }}>+{ej.xpBase}</span>

                {/* sesiones */}
                <div>
                  <div style={{ ...raj(12,700),color:C.blue,marginBottom:3 }}>{ej.sesiones}</div>
                  <MiniBar val={(ej.sesiones/200)*100} color={C.blue} height={4}/>
                </div>

                {/* estado */}
                <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:ej.activo?C.green:C.red,animation:ej.activo?"e-pulse 1.8s infinite":"none" }}/>
                  <span style={{ ...raj(11,600),color:ej.activo?C.green:C.red }}>{ej.activo?"ON":"OFF"}</span>
                </div>

                {/* acciones */}
                <div style={{ display:"flex",gap:5 }}>
                  {[
                    {Icon:Eye,   c:C.blue,   fn:()=>setModal({type:"view",ej})},
                    {Icon:Edit2, c:C.orange, fn:()=>setModal({type:"form",ej})},
                    {Icon:Trash2,c:C.red,    fn:()=>setModal({type:"delete",ej})},
                  ].map(({Icon,c,fn},j)=>(
                    <button key={j} onClick={fn} className="e-icon-btn"
                      style={{ background:"transparent",border:`1px solid ${c}33`,padding:5,color:c,display:"flex",alignItems:"center" }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${c}18`;e.currentTarget.style.borderColor=c;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${c}33`;}}>
                      <Icon size={12}/>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {view==="grid" && (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14 }}>
            {paginated.length===0 ? (
              <div style={{ gridColumn:"1/-1",padding:40,textAlign:"center",...raj(14,500),color:C.muted }}>Sin resultados para esos filtros.</div>
            ) : paginated.map((ej,i)=>{
              const c = CAT_COLOR[ej.categoria]||C.orange;
              const sel = selected.has(ej.id);
              return (
                <div key={ej.id} className="e-card" style={{ background:C.card,border:`1px solid ${sel?C.orange:c}33`,boxShadow:sel?`0 0 14px ${C.orange}22`:"0 4px 16px rgba(0,0,0,.3)",padding:0,overflow:"hidden",animation:`e-cardIn .4s ease ${i*.05}s both`,cursor:"default",position:"relative" }}>
                  {/* checkbox overlay */}
                  <div style={{ position:"absolute",top:10,left:10,zIndex:2 }}>
                    <input type="checkbox" checked={sel} onChange={()=>toggleSelect(ej.id)} style={{ accentColor:C.orange,width:14,height:14,cursor:"pointer" }}/>
                  </div>

                  {/* top accent */}
                  <div style={{ height:3,background:`linear-gradient(90deg,transparent,${c},transparent)` }}/>

                  <div style={{ padding:"16px 16px 14px" }}>
                    {/* header */}
                    <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12 }}>
                      <div style={{ fontSize:32,filter:`drop-shadow(0 0 8px ${c}88)` }}>{ej.imagen}</div>
                      <div style={{ display:"flex",gap:4,flexDirection:"column",alignItems:"flex-end" }}>
                        <CatBadge cat={ej.categoria}/>
                        <div style={{ width:7,height:7,borderRadius:"50%",background:ej.activo?C.green:C.red,marginTop:4,alignSelf:"flex-end",animation:ej.activo?"e-pulse 1.8s infinite":"none" }}/>
                      </div>
                    </div>

                    <div style={{ ...raj(14,700),color:C.white,marginBottom:4,lineHeight:1.3 }}>{ej.nombre}</div>
                    <DifBadge dif={ej.dificultad}/>

                    <div style={{ marginTop:10 }}>
                      <MusculoChips list={ej.musculos} color={C.blue}/>
                    </div>

                    {/* stats mini */}
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12 }}>
                      {[
                        {label:"XP",   value:`+${ej.xpBase}`,         color:C.gold },
                        {label:"SESIONES",value:ej.sesiones,           color:C.blue },
                        {label:ej.duracion?"MINUTOS":"SERIES",value:ej.duracion?`${ej.duracion}min`:`${ej.series}×${ej.reps}`,color:C.orange},
                        {label:"VERIF.",value:ej.verificacion.slice(0,3),color:C.teal},
                      ].map((s,idx)=>(
                        <div key={idx} style={{ background:C.panel,border:`1px solid ${s.color}18`,padding:"7px 8px" }}>
                          <div style={{ ...raj(13,700),color:s.color }}>{s.value}</div>
                          <div style={{ ...px(5),color:C.muted }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* sesiones bar */}
                    <div style={{ marginTop:10 }}>
                      <MiniBar val={(ej.sesiones/200)*100} color={c} height={5}/>
                    </div>
                  </div>

                  {/* actions footer */}
                  <div style={{ borderTop:`1px solid ${C.navy}33`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr" }}>
                    {[
                      {Icon:Eye,   c:C.blue,   fn:()=>setModal({type:"view",ej}),   label:"Ver"     },
                      {Icon:Edit2, c:C.orange, fn:()=>setModal({type:"form",ej}),   label:"Editar"  },
                      {Icon:Trash2,c:C.red,    fn:()=>setModal({type:"delete",ej}), label:"Borrar"  },
                    ].map(({Icon,c:ic,fn,label},j)=>(
                      <button key={j} onClick={fn} className="e-btn"
                        style={{ background:"transparent",border:"none",borderRight:j<2?`1px solid ${C.navy}33`:"none",padding:"10px 0",color:ic,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",transition:"background .2s" }}
                        onMouseEnter={e=>e.currentTarget.style.background=`${ic}14`}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <Icon size={13}/>
                        <span style={{ ...raj(9,600),color:C.muted }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ ...raj(13,500),color:C.muted }}>
              {Math.min((page-1)*pageSize+1,filtered.length)}–{Math.min(page*pageSize,filtered.length)} de {filtered.length}
            </span>
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}
              className="e-input" style={{ padding:"6px 10px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...raj(12,500),cursor:"pointer" }}>
              {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
          <div style={{ display:"flex",gap:5 }}>
            <button onClick={()=>setPage(1)}      disabled={page===1}          className="e-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 11px",cursor:page===1?"not-allowed":"pointer" }}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1}          className="e-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 10px",cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center" }}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className="e-btn"
                style={{ background:n===page?C.orange:C.panel,border:`1px solid ${n===page?C.orange:C.navy}`,color:n===page?C.bg:C.muted,padding:"6px 13px",cursor:"pointer",...raj(13,n===page?700:500) }}>
                {n}
              </button>
            ))}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="e-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 10px",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center" }}><ChevronRight size={13}/></button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} className="e-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 11px",cursor:page===totalPages?"not-allowed":"pointer" }}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}