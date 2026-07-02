// src/pages/admin/AdminEjercicios.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";
import { useToast } from "../../components/shared/ui.jsx";
import {
  getCategorias, createCategoria, updateCategoria, deleteCategoria,
  getRutinas, createRutina, updateRutina, deleteRutina,
  getEjercicios, createEjercicio, updateEjercicio, deleteEjercicio,
} from "../../services/api.js";
import { auth } from "../../firebase.js";
import {
  Search, Plus, RefreshCw, Edit2, Trash2, X, Check, AlertTriangle,
  ChevronRight, Home, BookOpen, Dumbbell, Layers, Zap, Timer, Repeat,
  Eye, EyeOff, ToggleLeft, ToggleRight,
} from "lucide-react";

const DIFICULTADES    = ["Principiante","Intermedio","Avanzado","Élite"];
const MUSCULOS_OPT    = ["Pecho","Espalda","Hombros","Bíceps","Tríceps","Abdomen","Piernas","Glúteos","Pantorrillas","Cuerpo completo"];
const VERIFICACION_OPT = ["Cámara","Timer","Ambos"];
const DIFF_COLOR = { Principiante:C.green, Intermedio:C.teal, Avanzado:C.orange, Élite:C.red };

const CSS = `
  @keyframes ae-spin      { to{transform:rotate(360deg)} }
  @keyframes ae-skelPulse { 0%,100%{opacity:.5} 50%{opacity:.2} }
  @keyframes ae-glow      { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes ae-slideUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .ae-skel { background:${C.navy}66; animation:ae-skelPulse 1.4s ease infinite; border-radius:10px; }
  .ae-inp  { transition:border-color .2s,box-shadow .2s; outline:none; }
  .ae-inp:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22 !important; }
  .ae-card-cat:hover .ae-cat-orb { opacity:1 !important; }
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
function inp(dirty, errors, k) {
  return {
    width:"100%", padding:"9px 12px",
    background:"rgba(10,14,26,0.8)", color:C.white, ...raj(12,500),
    border:`1px solid ${dirty.has(k) && errors[k] ? C.red : dirty.has(k) && !errors[k] ? C.green : C.navy}`,
    borderRadius:8, boxSizing:"border-box",
  };
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{...raj(11,600),color:C.red,marginTop:4,display:"flex",alignItems:"center",gap:5}}>
      <AlertTriangle size={11}/>{msg}
    </div>
  );
}

function Spin() {
  return <div style={{width:12,height:12,border:"2px solid #fff4",borderTop:"2px solid #fff",borderRadius:"50%",animation:"ae-spin .8s linear infinite"}}/>;
}

function SaveCancelRow({ onClose, onSave, loading }) {
  return (
    <div style={{display:"flex",gap:10,paddingTop:4}}>
      <button onClick={onClose} style={{flex:1,...raj(11,600),background:"rgba(10,14,26,0.8)",border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>
        CANCELAR
      </button>
      <button onClick={onSave} disabled={loading} style={{
        flex:1,...raj(11,700),
        background:loading?`${C.green}44`:C.green,
        color:loading?C.muted:"#060D1A",
        border:"none",padding:10,
        cursor:loading?"not-allowed":"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:8,
      }}>
        {loading ? <><Spin/> GUARDANDO...</> : <><Check size={13}/> GUARDAR</>}
      </button>
    </div>
  );
}

// ── Glassmorphism modal wrapper ────────────────────────────────────────────────
function ModalWrap({ children, onClose, maxWidth=440 }) {
  return (
    <div
      onClick={e => e.target===e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
    >
      <motion.div
        initial={{opacity:0,scale:.95,y:12}}
        animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:.95,y:8}}
        transition={{duration:.2}}
        style={{
          width:"100%",maxWidth,
          background:"rgba(20,26,42,0.95)",
          backdropFilter:"blur(16px)",
          border:`1px solid ${C.navy}`,
          borderRadius:12,overflow:"hidden",
          maxHeight:"90vh",overflowY:"auto",
          boxShadow:"0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ModalHeader({ isEdit, label, onClose, accent }) {
  const col  = accent || (isEdit ? C.orange : C.green);
  const icon = isEdit ? <Edit2 size={14}/> : <Plus size={14}/>;
  return (
    <div style={{background:`${col}14`,borderBottom:`2px solid ${col}`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{background:col,color:"#fff",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}>{icon}</div>
        <span style={{...orb(11,800),color:col}}>{label}</span>
      </div>
      <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",padding:4,borderRadius:4}}>
        <X size={16}/>
      </button>
    </div>
  );
}

// ── DiffPills shared component ────────────────────────────────────────────────
function DiffPills({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {DIFICULTADES.map(d => {
        const on = value === d;
        const dc = DIFF_COLOR[d];
        return (
          <button key={d} type="button" onClick={()=>onChange(d)} style={{
            ...raj(10,on?700:500), color:on?dc:C.muted,
            background:on?`${dc}22`:"transparent",
            border:`1px solid ${on?dc:C.navy}`,
            padding:"4px 12px",cursor:"pointer",borderRadius:20,
          }}>{d}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function validateCatForm(form) {
  const e = {};
  if (!form.nombre?.trim())               e.nombre = "Nombre requerido";
  else if (form.nombre.trim().length < 3) e.nombre = "Mín. 3 caracteres";
  return e;
}

function CategoriasModal({ data, onClose, onSave, isEdit, loading }) {
  const [form,   setForm]   = useState(data || { nombre:"", descripcion:"", icono:"💪", color:"#E85D04", activo:true });
  const [dirty,  setDirty]  = useState(new Set());
  const [errors, setErrors] = useState({});

  const set   = (k,v) => setForm(f => { const n={...f,[k]:v}; if(dirty.has(k)) setErrors(validateCatForm(n)); return n; });
  const touch = k => setDirty(d => { const n=new Set(d);n.add(k);return n; });
  const blur  = k => { touch(k); setErrors(validateCatForm(form)); };

  const handleSave = () => {
    ["nombre"].forEach(touch);
    const errs = validateCatForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(form);
  };

  const i = k => inp(dirty, errors, k);
  return (
    <ModalWrap onClose={onClose} maxWidth={420}>
      <ModalHeader isEdit={isEdit} label={isEdit?"EDITAR CATEGORÍA":"NUEVA CATEGORÍA"} onClose={onClose} accent={C.green}/>
      <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>NOMBRE</label>
          <input className="ae-inp" value={form.nombre} onChange={e=>set("nombre",e.target.value)} onBlur={()=>blur("nombre")} placeholder="Nombre de la categoría" style={i("nombre")}/>
          <FieldError msg={dirty.has("nombre")?errors.nombre:null}/>
        </div>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>DESCRIPCIÓN</label>
          <input className="ae-inp" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} placeholder="Descripción breve" style={i("descripcion")}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>ICONO</label>
            <input className="ae-inp" value={form.icono} onChange={e=>set("icono",e.target.value)} maxLength={2} style={{...i("icono"),textAlign:"center",fontSize:18}}/>
          </div>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>COLOR</label>
            <input type="color" value={form.color} onChange={e=>set("color",e.target.value)} style={{width:"100%",height:42,border:`1px solid ${C.navy}`,borderRadius:8,cursor:"pointer",background:"transparent"}}/>
          </div>
        </div>
        <button type="button" onClick={()=>set("activo",!form.activo)} style={{
          display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
          background:form.activo?`${C.green}14`:`${C.muted}0A`,
          border:`1px solid ${form.activo?C.green:C.navy}`,borderRadius:8,cursor:"pointer",
          transition:"all .2s",
        }}>
          {form.activo
            ? <><ToggleRight size={18} color={C.green}/><span style={{...raj(12,700),color:C.green}}>VISIBLE PARA USUARIOS</span></>
            : <><ToggleLeft  size={18} color={C.muted}/><span style={{...raj(12,700),color:C.muted}}>OCULTA (inactiva)</span></>
          }
        </button>
        <SaveCancelRow onClose={onClose} onSave={handleSave} loading={loading}/>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RUTINAS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function validateRutinaForm(form) {
  const e = {};
  if (!form.nombre?.trim())                    e.nombre     = "Nombre requerido";
  else if (form.nombre.trim().length < 3)      e.nombre     = "Mín. 3 caracteres";
  if (!DIFICULTADES.includes(form.dificultad)) e.dificultad = "Dificultad inválida";
  const dur = Number(form.duracion);
  if (isNaN(dur) || dur < 1)                   e.duracion   = "Mínimo 1 min";
  return e;
}

function RutinasModal({ data, onClose, onSave, isEdit, loading, ejercicios }) {
  const [form,  setForm]  = useState(data || { nombre:"", descripcion:"", duracion:30, dificultad:"Intermedio", ejercicios:[] });
  const [dirty, setDirty] = useState(new Set());
  const [errors,setErrors]= useState({});

  const set      = (k,v) => setForm(f => { const n={...f,[k]:v}; if(dirty.has(k)) setErrors(validateRutinaForm(n)); return n; });
  const touch    = k => setDirty(d => { const n=new Set(d);n.add(k);return n; });
  const blur     = k => { touch(k); setErrors(validateRutinaForm(form)); };
  const toggleEj = id => set("ejercicios", form.ejercicios.includes(id) ? form.ejercicios.filter(x=>x!==id) : [...form.ejercicios,id]);

  const handleSave = () => {
    ["nombre","dificultad","duracion"].forEach(touch);
    const errs = validateRutinaForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(form);
  };

  const i = k => inp(dirty, errors, k);
  return (
    <ModalWrap onClose={onClose} maxWidth={500}>
      <ModalHeader isEdit={isEdit} label={isEdit?"EDITAR RUTINA":"NUEVA RUTINA"} onClose={onClose} accent={C.orange}/>
      <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>NOMBRE</label>
          <input className="ae-inp" value={form.nombre} onChange={e=>set("nombre",e.target.value)} onBlur={()=>blur("nombre")} placeholder="Nombre" style={i("nombre")}/>
          <FieldError msg={dirty.has("nombre")?errors.nombre:null}/>
        </div>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>DESCRIPCIÓN</label>
          <textarea value={form.descripcion} rows={2} onChange={e=>set("descripcion",e.target.value)} placeholder="Descripción" className="ae-inp" style={{...i("descripcion"),resize:"vertical"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignItems:"start"}}>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>DURACIÓN (min)</label>
            <input type="number" min={1} value={form.duracion} onChange={e=>set("duracion",Number(e.target.value))} onBlur={()=>blur("duracion")} className="ae-inp" style={i("duracion")}/>
            <FieldError msg={dirty.has("duracion")?errors.duracion:null}/>
          </div>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:6}}>DIFICULTAD</label>
            <DiffPills value={form.dificultad} onChange={v=>{set("dificultad",v);touch("dificultad");}}/>
            <FieldError msg={dirty.has("dificultad")?errors.dificultad:null}/>
          </div>
        </div>
        {ejercicios?.length > 0 && (
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:8}}>EJERCICIOS ({form.ejercicios.length} sel.)</label>
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto"}}>
              {ejercicios.map(ej=>(
                <label key={ej.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:form.ejercicios.includes(ej.id)?"rgba(90,159,212,0.1)":"rgba(10,14,26,0.5)",border:`1px solid ${form.ejercicios.includes(ej.id)?C.blue:C.navy}44`,cursor:"pointer",borderRadius:6,transition:"all .15s"}}>
                  <input type="checkbox" checked={form.ejercicios.includes(ej.id)} onChange={()=>toggleEj(ej.id)} style={{accentColor:C.blue,width:14,height:14}}/>
                  <span style={{...raj(11,600),color:C.white,flex:1}}>{ej.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <SaveCancelRow onClose={onClose} onSave={handleSave} loading={loading}/>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EJERCICIOS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function validateEjForm(form) {
  const e = {};
  if (!form.nombre?.trim())                          e.nombre       = "Nombre requerido";
  else if (form.nombre.trim().length < 3)            e.nombre       = "Mín. 3 caracteres";
  if (!DIFICULTADES.includes(form.dificultad))       e.dificultad   = "Dificultad inválida";
  if (isNaN(Number(form.xpBase)) || form.xpBase < 1) e.xpBase      = "Mín. 1 XP";
  if (!VERIFICACION_OPT.includes(form.verificacion)) e.verificacion = "Verificación inválida";
  return e;
}

function EjerciciosModal({ data, onClose, onSave, isEdit, loading }) {
  const [form,  setForm]  = useState(data || { nombre:"", descripcion:"", musculos:[], dificultad:"Principiante", series:3, reps:10, duracion:null, xpBase:25, verificacion:"Cámara", imagen:"💪", activo:true });
  const [dirty, setDirty] = useState(new Set());
  const [errors,setErrors]= useState({});

  const set       = (k,v) => setForm(f => { const n={...f,[k]:v}; if(dirty.has(k)) setErrors(validateEjForm(n)); return n; });
  const touch     = k => setDirty(d => { const n=new Set(d);n.add(k);return n; });
  const blur      = k => { touch(k); setErrors(validateEjForm(form)); };
  const toggleMus = m => set("musculos", form.musculos.includes(m) ? form.musculos.filter(x=>x!==m) : [...form.musculos,m]);

  const handleSave = () => {
    ["nombre","dificultad","xpBase","verificacion"].forEach(touch);
    const errs = validateEjForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(form);
  };

  const i = k => inp(dirty, errors, k);
  return (
    <ModalWrap onClose={onClose} maxWidth={520}>
      <ModalHeader isEdit={isEdit} label={isEdit?"EDITAR EJERCICIO":"NUEVO EJERCICIO"} onClose={onClose} accent={C.blue}/>
      <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"start"}}>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>NOMBRE</label>
            <input className="ae-inp" value={form.nombre} onChange={e=>set("nombre",e.target.value)} onBlur={()=>blur("nombre")} placeholder="Nombre del ejercicio" style={i("nombre")}/>
            <FieldError msg={dirty.has("nombre")?errors.nombre:null}/>
          </div>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>ICONO</label>
            <input className="ae-inp" value={form.imagen} onChange={e=>set("imagen",e.target.value)} maxLength={2} style={{...i("imagen"),width:52,textAlign:"center",fontSize:20,padding:"8px 0"}}/>
          </div>
        </div>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>DESCRIPCIÓN</label>
          <textarea value={form.descripcion} rows={2} onChange={e=>set("descripcion",e.target.value)} placeholder="Descripción" className="ae-inp" style={{...i("descripcion"),resize:"vertical"}}/>
        </div>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:6}}>DIFICULTAD</label>
          <DiffPills value={form.dificultad} onChange={v=>{set("dificultad",v);touch("dificultad");}}/>
          <FieldError msg={dirty.has("dificultad")?errors.dificultad:null}/>
        </div>
        <div>
          <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:6}}>MÚSCULOS</label>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {MUSCULOS_OPT.map(m => {
              const on = form.musculos.includes(m);
              return (
                <button key={m} type="button" onClick={()=>toggleMus(m)} style={{
                  ...raj(10,on?700:500), color:on?C.blue:C.muted,
                  background:on?`${C.blue}18`:"transparent",
                  border:`1px solid ${on?C.blue:C.navy}`,
                  padding:"4px 10px",cursor:"pointer",borderRadius:20,
                }}>{m}</button>
              );
            })}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[["series","SERIES"],["reps","REPS"],["duracion","DUR (min)"]].map(([k,l])=>(
            <div key={k}>
              <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>{l}</label>
              <input type="number" min={1} value={form[k]||""} onChange={e=>set(k,e.target.value?Number(e.target.value):null)} placeholder="—" className="ae-inp" style={i(k)}/>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>XP BASE</label>
            <input type="number" min={1} value={form.xpBase} onChange={e=>set("xpBase",Number(e.target.value))} onBlur={()=>blur("xpBase")} className="ae-inp" style={i("xpBase")}/>
            <FieldError msg={dirty.has("xpBase")?errors.xpBase:null}/>
          </div>
          <div>
            <label style={{...raj(11,600),color:C.muted,display:"block",marginBottom:5}}>VERIFICACIÓN</label>
            <select value={form.verificacion} onChange={e=>{set("verificacion",e.target.value);touch("verificacion");}} className="ae-inp" style={i("verificacion")}>
              {VERIFICACION_OPT.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <FieldError msg={dirty.has("verificacion")?errors.verificacion:null}/>
          </div>
        </div>
        <button type="button" onClick={()=>set("activo",!form.activo)} style={{
          display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
          background:form.activo?`${C.green}14`:`${C.muted}0A`,
          border:`1px solid ${form.activo?C.green:C.navy}`,borderRadius:8,cursor:"pointer",
          transition:"all .2s",
        }}>
          {form.activo
            ? <><ToggleRight size={18} color={C.green}/><span style={{...raj(12,700),color:C.green}}>VISIBLE PARA USUARIOS</span></>
            : <><ToggleLeft  size={18} color={C.muted}/><span style={{...raj(12,700),color:C.muted}}>OCULTO (inactivo)</span></>
          }
        </button>
        <SaveCancelRow onClose={onClose} onSave={handleSave} loading={loading}/>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ name, onClose, onConfirm, loading, type, inUseCount }) {
  const [typed, setTyped] = useState("");
  const ok = typed === name;
  return (
    <ModalWrap onClose={onClose} maxWidth={400}>
      <div style={{background:`${C.red}14`,borderBottom:`2px solid ${C.red}`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:C.red,color:"#fff",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}><Trash2 size={14}/></div>
          <span style={{...orb(11,800),color:C.red}}>ELIMINAR {type.toUpperCase()}</span>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",padding:4}}><X size={16}/></button>
      </div>
      <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
        {inUseCount > 0 && (
          <div style={{background:`${C.orange}14`,border:`1px solid ${C.orange}44`,padding:"10px 14px",borderRadius:8,display:"flex",gap:10}}>
            <AlertTriangle size={15} color={C.orange} style={{flexShrink:0,marginTop:2}}/>
            <div style={{...raj(12,500),color:C.orange,lineHeight:1.5}}>
              Este {type} está referenciado en <strong>{inUseCount}</strong> {inUseCount===1?"elemento":"elementos"}.
            </div>
          </div>
        )}
        <div style={{background:`${C.red}14`,border:`1px solid ${C.red}33`,padding:"10px 14px",borderRadius:8,display:"flex",gap:10}}>
          <AlertTriangle size={15} color={C.red} style={{flexShrink:0,marginTop:2}}/>
          <div style={{...raj(12,500),color:C.red,lineHeight:1.5}}>Esta acción es <strong>irreversible</strong>.</div>
        </div>
        <div style={{...raj(12,500),color:C.muted}}>Escribe el nombre para confirmar:</div>
        <div style={{...raj(13,700),color:C.white,background:"rgba(10,14,26,0.8)",padding:"8px 12px",borderRadius:8,letterSpacing:1}}>{name}</div>
        <input
          value={typed} onChange={e=>setTyped(e.target.value)} placeholder={name}
          className="ae-inp"
          style={{padding:"9px 12px",background:"rgba(10,14,26,0.8)",border:`1px solid ${ok?C.green:C.red}`,color:C.white,...raj(12,500),borderRadius:8,outline:"none"}}
        />
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,...raj(11,600),background:"rgba(10,14,26,0.8)",border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
          <button onClick={()=>ok&&onConfirm()} disabled={!ok||loading} style={{flex:1,...raj(11,700),background:(ok&&!loading)?C.red:`${C.red}44`,color:ok&&!loading?"#fff":C.muted,border:"none",padding:10,cursor:ok?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:8}}>
            {loading?<><Spin/> ELIMINANDO...</>:<><Trash2 size={13}/> ELIMINAR</>}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonEjercicios() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        {[0,1,2,3].map(i=><div key={i} className="ae-skel" style={{height:96}}/>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
        {[0,1,2,3,4,5].map(i=><div key={i} className="ae-skel" style={{height:148}}/>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CARD
// ─────────────────────────────────────────────────────────────────────────────
function CatCard({ cat, rutinas, ejercicios, onClick, onToggleActivo }) {
  const rc = rutinas.filter(r=>r.categoria===cat.id).length;
  const ec = ejercicios.filter(e=>e.categoria===cat.id).length;
  const isInactive = cat.activo === false;
  return (
    <motion.div
      className="ae-card-cat"
      whileHover={{ y:-4, boxShadow:`0 14px 40px ${cat.color}28, 0 4px 16px rgba(0,0,0,0.45)` }}
      transition={{ duration:.2 }}
      onClick={onClick}
      style={{
        background:"rgba(20,26,42,0.84)",
        backdropFilter:"blur(14px)",
        border:`1px solid ${isInactive ? C.navy : cat.color+"30"}`,
        borderRadius:14, overflow:"hidden",
        cursor:"pointer",
        boxShadow:"0 2px 14px rgba(0,0,0,0.28)",
        opacity: isInactive ? 0.65 : 1,
      }}
    >
      {/* Colored header band */}
      <div style={{
        background:`linear-gradient(135deg, ${cat.color}1A 0%, ${cat.color}06 100%)`,
        borderBottom:`1px solid ${cat.color}22`,
        padding:"18px 18px 14px",
        position:"relative", overflow:"hidden",
      }}>
        {/* Corner ambient orb — fades in on hover via CSS */}
        <div className="ae-cat-orb" style={{
          position:"absolute", top:-24, right:-24, width:90, height:90, borderRadius:"50%",
          background:`radial-gradient(circle, ${cat.color}44, transparent)`,
          filter:"blur(22px)", pointerEvents:"none", opacity:.4, transition:"opacity .25s",
        }}/>
        <div style={{ position:"absolute", top:10, right:10, zIndex:2 }}>
          {isInactive
            ? <span style={{...raj(8,700),color:C.muted,background:`${C.muted}14`,border:`1px solid ${C.muted}33`,padding:"2px 7px",borderRadius:20}}>INACTIVA</span>
            : <span style={{...raj(8,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"2px 7px",borderRadius:20}}>✓ ACTIVA</span>
          }
        </div>
        <div style={{ fontSize:30, marginBottom:10, filter:`drop-shadow(0 2px 10px ${cat.color}55)`,
          position:"relative" }}>{cat.icono}</div>
        <div style={{...orb(11,700), color:isInactive?C.muted:cat.color, letterSpacing:".02em",
          position:"relative"}}>{cat.nombre}</div>
      </div>
      {/* Body */}
      <div style={{ padding:"12px 18px 16px" }}>
        {cat.descripcion && (
          <div style={{...raj(10,400), color:C.muted, marginBottom:10, lineHeight:1.5,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {cat.descripcion}
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <div style={{ flex:1, background:`${C.navy}55`, borderRadius:8, padding:"7px 10px",
            display:"flex", alignItems:"center", gap:6, border:`1px solid ${C.navy}` }}>
            <BookOpen size={10} color={C.orange}/>
            <span style={{...raj(11,700), color:C.white}}>{rc}</span>
            <span style={{...raj(9,400), color:C.muted}}>rut.</span>
          </div>
          <div style={{ flex:1, background:`${C.navy}55`, borderRadius:8, padding:"7px 10px",
            display:"flex", alignItems:"center", gap:6, border:`1px solid ${C.navy}` }}>
            <Dumbbell size={10} color={C.blue}/>
            <span style={{...raj(11,700), color:C.white}}>{ec}</span>
            <span style={{...raj(9,400), color:C.muted}}>ej.</span>
          </div>
        </div>
        <button
          onClick={e=>{e.stopPropagation();onToggleActivo?.();}}
          style={{
            width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            padding:"6px 10px",
            background:isInactive?`${C.green}14`:`${C.muted}0A`,
            border:`1px solid ${isInactive?C.green:C.navy}`,
            borderRadius:7,cursor:"pointer",transition:"all .2s",
            ...raj(10,700), color:isInactive?C.green:C.muted,
          }}
        >
          {isInactive ? <><Eye size={11}/> Activar</> : <><EyeOff size={11}/> Desactivar</>}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RUTINA ROW CARD
// ─────────────────────────────────────────────────────────────────────────────
function RutinaCard({ rut, onEdit, onDelete }) {
  const dc = DIFF_COLOR[rut.dificultad] || C.muted;
  return (
    <motion.div
      whileHover={{ y:-1, boxShadow:`0 6px 22px rgba(0,0,0,.32), 0 0 0 1px ${dc}20` }}
      transition={{ duration:.16 }}
      style={{
        background:"rgba(20,26,42,0.76)",
        backdropFilter:"blur(12px)",
        border:`1px solid ${C.navy}`,
        borderLeft:`3px solid ${dc}`,
        borderRadius:10, padding:"12px 14px",
        display:"flex", alignItems:"center", gap:12,
      }}
    >
      {/* Icon orb */}
      <div style={{ width:36, height:36, borderRadius:10, background:`${dc}16`,
        border:`1px solid ${dc}30`, display:"flex", alignItems:"center",
        justifyContent:"center", flexShrink:0 }}>
        <BookOpen size={14} color={dc}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{...raj(12,700),color:C.white,marginBottom:4,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{rut.nombre}</div>
        <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{...raj(9,700),color:dc,background:`${dc}18`,
            border:`1px solid ${dc}28`,padding:"2px 8px",borderRadius:20}}>{rut.dificultad}</span>
          {rut.duracion && (
            <span style={{...raj(9,500),color:C.muted,display:"flex",alignItems:"center",gap:3}}>
              <Timer size={9}/>{rut.duracion}min
            </span>
          )}
          {rut.ejercicios?.length > 0 && (
            <span style={{...raj(9,500),color:C.muted,display:"flex",alignItems:"center",gap:3}}>
              <Dumbbell size={9}/>{rut.ejercicios.length} ej.
            </span>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:4,flexShrink:0}}>
        <button onClick={onEdit}   style={{background:`${C.orange}14`,border:`1px solid ${C.orange}33`,padding:"6px 7px",color:C.orange,cursor:"pointer",borderRadius:7,display:"flex"}}><Edit2 size={11}/></button>
        <button onClick={onDelete} style={{background:`${C.red}14`,border:`1px solid ${C.red}33`,padding:"6px 7px",color:C.red,cursor:"pointer",borderRadius:7,display:"flex"}}><Trash2 size={11}/></button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EJERCICIO ROW CARD
// ─────────────────────────────────────────────────────────────────────────────
function EjercicioCard({ ej, onEdit, onDelete, onToggleActivo }) {
  const dc = DIFF_COLOR[ej.dificultad] || C.muted;
  const muscles = (ej.musculos || []).slice(0, 2);
  const isInactive = ej.activo === false;
  return (
    <motion.div
      whileHover={{ y:-1, boxShadow:`0 6px 22px rgba(0,0,0,.32), 0 0 0 1px ${isInactive?C.navy:C.blue+"20"}` }}
      transition={{ duration:.16 }}
      style={{
        background:"rgba(20,26,42,0.76)",
        backdropFilter:"blur(12px)",
        border:`1px solid ${C.navy}`,
        borderLeft:`3px solid ${isInactive?C.muted:C.blue}`,
        borderRadius:10, padding:"12px 14px",
        display:"flex", alignItems:"center", gap:12,
        opacity: isInactive ? 0.65 : 1,
      }}
    >
      {/* Emoji orb */}
      <div style={{ width:36, height:36, borderRadius:10, background:`${isInactive?C.muted:C.blue}14`,
        border:`1px solid ${isInactive?C.muted:C.blue}28`, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:18, flexShrink:0 }}>{ej.imagen}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{...raj(12,700),color:isInactive?C.muted:C.white,marginBottom:4,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ej.nombre}</div>
        <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
          {isInactive && (
            <span style={{...raj(8,700),color:C.muted,background:`${C.muted}14`,
              border:`1px solid ${C.muted}33`,padding:"1px 7px",borderRadius:20}}>INACTIVO</span>
          )}
          <span style={{...raj(9,700),color:dc,background:`${dc}18`,
            border:`1px solid ${dc}28`,padding:"2px 8px",borderRadius:20}}>{ej.dificultad}</span>
          {ej.series && (
            <span style={{...raj(9,500),color:C.muted,display:"flex",alignItems:"center",gap:3}}>
              <Repeat size={9}/>{ej.series}×{ej.reps}
            </span>
          )}
          <span style={{...raj(9,700),color:C.gold,background:`${C.gold}16`,
            border:`1px solid ${C.gold}28`,padding:"2px 8px",borderRadius:20,
            display:"flex",alignItems:"center",gap:3}}>
            <Zap size={8}/>+{ej.xpBase}XP
          </span>
          {muscles.map(m => (
            <span key={m} style={{...raj(8,500),color:C.muted,background:`${C.navy}88`,
              padding:"1px 6px",borderRadius:20}}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:4,flexShrink:0}}>
        <button onClick={onToggleActivo} title={isInactive?"Activar":"Desactivar"}
          style={{background:isInactive?`${C.green}14`:`${C.muted}0A`,border:`1px solid ${isInactive?C.green:C.navy}`,padding:"6px 7px",color:isInactive?C.green:C.muted,cursor:"pointer",borderRadius:7,display:"flex"}}>
          {isInactive ? <Eye size={11}/> : <EyeOff size={11}/>}
        </button>
        <button onClick={onEdit}   style={{background:`${C.orange}14`,border:`1px solid ${C.orange}33`,padding:"6px 7px",color:C.orange,cursor:"pointer",borderRadius:7,display:"flex"}}><Edit2 size={11}/></button>
        <button onClick={onDelete} style={{background:`${C.red}14`,border:`1px solid ${C.red}33`,padding:"6px 7px",color:C.red,cursor:"pointer",borderRadius:7,display:"flex"}}><Trash2 size={11}/></button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminEjercicios() {
  const [categorias,   setCategorias]   = useState([]);
  const [rutinas,      setRutinas]      = useState([]);
  const [ejercicios,   setEjercicios]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedCat,  setSelectedCat]  = useState(null);
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { push } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const [catsRes, rutRes, ejRes] = await Promise.all([getCategorias(token), getRutinas(token), getEjercicios(token)]);
      setCategorias(catsRes.categorias || []);
      setRutinas(rutRes.rutinas || []);
      setEjercicios(ejRes.ejercicios || []);
    } catch { push("Error cargando datos", "error"); }
    finally { setLoading(false); }
  }, [push]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRutinas = useMemo(() => {
    let r = rutinas;
    if (selectedCat) r = r.filter(x => x.categoria === selectedCat.id);
    if (search) r = r.filter(x => x.nombre.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [rutinas, selectedCat, search]);

  const filteredEjercicios = useMemo(() => {
    let e = ejercicios;
    if (selectedCat) e = e.filter(x => x.categoria === selectedCat.id);
    if (search) e = e.filter(x => x.nombre.toLowerCase().includes(search.toLowerCase()));
    return e;
  }, [ejercicios, selectedCat, search]);

  const catInUse    = cat => rutinas.filter(r=>r.categoria===cat.id).length + ejercicios.filter(e=>e.categoria===cat.id).length;
  const rutinaInUse = rut => (rut.ejercicios||[]).length;
  const ejInUse     = ej  => rutinas.filter(r=>(r.ejercicios||[]).includes(ej.id)).length;

  const handleSaveCategoria = async (data) => {
    setModalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      if (modal.isEdit) await updateCategoria(token, modal.data.id, data);
      else              await createCategoria(token, data);
      await loadData();
      push(`Categoría ${modal.isEdit?"actualizada":"creada"}`);
      setModal(null);
    } catch (err) { push(err.message||"Error al guardar","error"); }
    finally { setModalLoading(false); }
  };

  const handleSaveRutina = async (data) => {
    setModalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      if (modal.isEdit) await updateRutina(token, modal.data.id, {...data, categoria:selectedCat.id});
      else              await createRutina(token, {...data, categoria:selectedCat.id});
      await loadData();
      push(`Rutina ${modal.isEdit?"actualizada":"creada"}`);
      setModal(null);
    } catch (err) { push(err.message||"Error al guardar","error"); }
    finally { setModalLoading(false); }
  };

  const handleSaveEjercicio = async (data) => {
    setModalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      if (modal.isEdit) await updateEjercicio(token, modal.data.id, {...data, categoria:selectedCat.id});
      else              await createEjercicio(token, {...data, categoria:selectedCat.id});
      await loadData();
      push(`Ejercicio ${modal.isEdit?"actualizado":"creado"}`);
      setModal(null);
    } catch (err) { push(err.message||"Error al guardar","error"); }
    finally { setModalLoading(false); }
  };

  const handleDeleteCategoria = async () => {
    setModalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await deleteCategoria(token, modal.data.id);
      await loadData(); setSelectedCat(null);
      push("Categoría eliminada"); setModal(null);
    } catch (err) { push(err.message||"Error al eliminar","error"); }
    finally { setModalLoading(false); }
  };

  const handleDeleteRutina = async () => {
    setModalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await deleteRutina(token, modal.data.id);
      await loadData(); push("Rutina eliminada"); setModal(null);
    } catch (err) { push(err.message||"Error al eliminar","error"); }
    finally { setModalLoading(false); }
  };

  const handleDeleteEjercicio = async () => {
    setModalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await deleteEjercicio(token, modal.data.id);
      await loadData(); push("Ejercicio eliminado"); setModal(null);
    } catch (err) { push(err.message||"Error al eliminar","error"); }
    finally { setModalLoading(false); }
  };

  const handleToggleActivoCategoria = async (cat) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await updateCategoria(token, cat.id, { activo: !(cat.activo ?? true) });
      await loadData();
      push(`Categoría ${cat.activo === false ? "activada" : "desactivada"}`);
    } catch (err) { push(err.message||"Error al actualizar","error"); }
  };

  const handleToggleActivoEjercicio = async (ej) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await updateEjercicio(token, ej.id, { activo: !(ej.activo ?? true) });
      await loadData();
      push(`Ejercicio ${ej.activo === false ? "activado" : "desactivado"}`);
    } catch (err) { push(err.message||"Error al actualizar","error"); }
  };

  const avgXp = ejercicios.length
    ? Math.round(ejercicios.reduce((s,e)=>s+(e.xpBase||0),0)/ejercicios.length)
    : 0;

  const KPIS = [
    { label:"CATEGORÍAS", value:categorias.length, Icon:Layers,   color:C.green  },
    { label:"RUTINAS",    value:rutinas.length,    Icon:BookOpen, color:C.orange },
    { label:"EJERCICIOS", value:ejercicios.length, Icon:Dumbbell, color:C.blue   },
    { label:"XP PROMEDIO",value:avgXp,             Icon:Zap,      color:C.gold   },
  ];

  return (
    <>
      <style>{CSS}</style>

      <AnimatePresence>
        {modal?.type==="categoria"       && <CategoriasModal key="m-cat"  data={modal.data} onClose={()=>setModal(null)} onSave={handleSaveCategoria} isEdit={modal.isEdit} loading={modalLoading}/>}
        {modal?.type==="rutina"          && <RutinasModal    key="m-rut"  data={modal.data} onClose={()=>setModal(null)} onSave={handleSaveRutina}    isEdit={modal.isEdit} loading={modalLoading} ejercicios={filteredEjercicios}/>}
        {modal?.type==="ejercicio"       && <EjerciciosModal key="m-ej"   data={modal.data} onClose={()=>setModal(null)} onSave={handleSaveEjercicio} isEdit={modal.isEdit} loading={modalLoading}/>}
        {modal?.type==="deleteCategoria" && <DeleteModal key="d-cat" name={modal.data.nombre} onClose={()=>setModal(null)} onConfirm={handleDeleteCategoria} loading={modalLoading} type="categoría" inUseCount={catInUse(modal.data)}/>}
        {modal?.type==="deleteRutina"    && <DeleteModal key="d-rut" name={modal.data.nombre} onClose={()=>setModal(null)} onConfirm={handleDeleteRutina}    loading={modalLoading} type="rutina"    inUseCount={rutinaInUse(modal.data)}/>}
        {modal?.type==="deleteEjercicio" && <DeleteModal key="d-ej"  name={modal.data.nombre} onClose={()=>setModal(null)} onConfirm={handleDeleteEjercicio} loading={modalLoading} type="ejercicio" inUseCount={ejInUse(modal.data)}/>}
      </AnimatePresence>

      {/* Ambient orbs */}
      <div style={{ position:"fixed", top:0, right:0, width:320, height:320, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.blue}0A, transparent)`,
        filter:"blur(90px)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"fixed", bottom:60, left:0, width:260, height:260, borderRadius:"50%",
        background:`radial-gradient(circle, ${C.orange}08, transparent)`,
        filter:"blur(80px)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{display:"flex",flexDirection:"column",gap:20,padding:20,position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
            <div style={{
              ...orb(20,900),
              background:`linear-gradient(135deg, ${C.white} 30%, ${C.orange})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>EJERCICIOS</div>
            <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.orange}44, transparent)` }}/>
          </div>
          <div style={{...raj(12,500), color:C.muted}}>Gestión jerárquica: Categorías → Rutinas → Ejercicios</div>
        </div>

        {/* KPIs */}
        {!loading && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            {KPIS.map(k => (
              <motion.div
                key={k.label}
                whileHover={{ y:-3, boxShadow:`0 12px 32px ${k.color}22, 0 4px 12px rgba(0,0,0,0.4)` }}
                transition={{ duration:.2 }}
                style={{
                  background:"rgba(20,26,42,0.84)",
                  backdropFilter:"blur(14px)",
                  border:`1px solid ${C.navy}`,
                  borderTop:`3px solid ${k.color}`,
                  borderRadius:12, padding:"16px 18px",
                  boxShadow:"0 2px 14px rgba(0,0,0,0.25)",
                  position:"relative", overflow:"hidden",
                }}
              >
                {/* Corner glow */}
                <div style={{ position:"absolute", top:-18, right:-18, width:72, height:72, borderRadius:"50%",
                  background:`radial-gradient(circle, ${k.color}22, transparent)`, filter:"blur(18px)", pointerEvents:"none" }}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{...raj(10,600),color:C.muted,letterSpacing:".07em"}}>{k.label}</span>
                  <div style={{ background:`${k.color}18`, border:`1px solid ${k.color}30`,
                    borderRadius:8, padding:7, display:"flex" }}>
                    <k.Icon size={13} color={k.color}/>
                  </div>
                </div>
                <div style={{...orb(24,900),color:C.white}}>{k.value}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div style={{
          background:"rgba(20,26,42,0.84)",
          backdropFilter:"blur(14px)",
          border:`1px solid ${C.navy}`,
          borderRadius:12, padding:"12px 16px",
          display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
          boxShadow:"0 2px 16px rgba(0,0,0,0.22)",
        }}>
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <Search size={12} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
            <input
              className="ae-inp" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar rutinas o ejercicios..."
              style={{width:"100%",padding:"9px 12px 9px 33px",background:"rgba(10,14,26,0.6)",
                border:`1px solid ${C.navy}`,color:C.white,...raj(12,500),borderRadius:9,boxSizing:"border-box"}}
            />
          </div>
          <button onClick={loadData} style={{...raj(11,600),background:"rgba(10,14,26,0.6)",
            border:`1px solid ${C.navy}`,color:C.muted,padding:"9px 14px",cursor:"pointer",
            display:"flex",alignItems:"center",gap:6,borderRadius:9,transition:"border-color .2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.navyL}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.navy}>
            <RefreshCw size={12}/> Recargar
          </button>
          <button onClick={()=>setModal({type:"categoria",data:null,isEdit:false})}
            style={{...raj(11,700),color:"#060D1A",background:C.green,border:"none",
              padding:"9px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
              borderRadius:9,boxShadow:`0 2px 12px ${C.green}44`}}>
            <Plus size={12}/> CATEGORÍA
          </button>
          {selectedCat && <>
            <button onClick={()=>setModal({type:"rutina",data:null,isEdit:false})}
              style={{...raj(11,700),color:"#060D1A",background:C.orange,border:"none",
                padding:"9px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                borderRadius:9,boxShadow:`0 2px 12px ${C.orange}44`}}>
              <Plus size={12}/> RUTINA
            </button>
            <button onClick={()=>setModal({type:"ejercicio",data:null,isEdit:false})}
              style={{...raj(11,700),color:"#fff",background:C.blue,border:"none",
                padding:"9px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                borderRadius:9,boxShadow:`0 2px 12px ${C.blue}44`}}>
              <Plus size={12}/> EJERCICIO
            </button>
          </>}
        </div>

        {/* Breadcrumb */}
        {selectedCat && (
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(20,26,42,0.6)", backdropFilter:"blur(10px)",
            border:`1px solid ${selectedCat.color}22`,
            borderLeft:`3px solid ${selectedCat.color}`,
            borderRadius:10, padding:"10px 16px",
          }}>
            <button onClick={()=>{setSelectedCat(null);setSearch("");}}
              style={{...raj(11,600),color:C.orange,background:"transparent",border:"none",
                cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <Home size={12}/> Todas las categorías
            </button>
            <ChevronRight size={12} color={C.muted}/>
            <span style={{...raj(12,700),color:selectedCat.color}}>{selectedCat.icono} {selectedCat.nombre}</span>
            <div style={{ flex:1 }}/>
            <button onClick={()=>setModal({type:"categoria",data:selectedCat,isEdit:true})}
              style={{...raj(10,600),background:`${C.orange}14`,border:`1px solid ${C.orange}33`,
                color:C.orange,cursor:"pointer",padding:"4px 10px",borderRadius:7,
                display:"flex",alignItems:"center",gap:4}}>
              <Edit2 size={11}/> Editar
            </button>
            <button onClick={()=>setModal({type:"deleteCategoria",data:selectedCat})}
              style={{...raj(10,600),background:`${C.red}14`,border:`1px solid ${C.red}33`,
                color:C.red,cursor:"pointer",padding:"4px 9px",borderRadius:7,display:"flex",alignItems:"center",gap:4}}>
              <Trash2 size={11}/>
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <SkeletonEjercicios/>}

        {/* Categories grid */}
        {!loading && !selectedCat && (
          <motion.div
            initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}
          >
            {categorias.map((cat,i) => (
              <motion.div key={cat.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05,duration:.22}}>
                <CatCard cat={cat} rutinas={rutinas} ejercicios={ejercicios}
                  onClick={()=>{setSelectedCat(cat);setSearch("");}}
                  onToggleActivo={()=>handleToggleActivoCategoria(cat)}
                />
              </motion.div>
            ))}
            {categorias.length===0 && (
              <div style={{...raj(13,400),color:C.muted,gridColumn:"1/-1",textAlign:"center",padding:60,
                background:"rgba(20,26,42,0.6)",border:`1px dashed ${C.navy}`,borderRadius:14}}>
                Sin categorías — crea la primera con el botón de arriba.
              </div>
            )}
          </motion.div>
        )}

        {/* Split view: Rutinas + Ejercicios */}
        {!loading && selectedCat && (
          <motion.div
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:16}}
          >
            {/* Rutinas panel */}
            <div style={{
              background:"rgba(20,26,42,0.76)", backdropFilter:"blur(14px)",
              border:`1px solid ${C.navy}`, borderRadius:14, overflow:"hidden",
              boxShadow:"0 4px 24px rgba(0,0,0,0.28)",
            }}>
              <div style={{ background:`${C.orange}0A`, borderBottom:`1px solid ${C.orange}22`,
                padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ background:`${C.orange}18`, border:`1px solid ${C.orange}30`,
                  borderRadius:8, padding:8, display:"flex" }}>
                  <BookOpen size={14} color={C.orange}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{...orb(11,700), color:C.white}}>RUTINAS</div>
                </div>
                <span style={{...raj(10,700), color:C.orange, background:`${C.orange}18`,
                  border:`1px solid ${C.orange}30`, padding:"2px 9px", borderRadius:5}}>
                  {filteredRutinas.length}
                </span>
              </div>
              <div style={{ height:1, background:`linear-gradient(90deg,${C.orange}33,transparent)` }}/>
              <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:7}}>
                <AnimatePresence>
                  {filteredRutinas.map((rut,i) => (
                    <motion.div key={rut.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                      <RutinaCard rut={rut}
                        onEdit={()=>setModal({type:"rutina",data:rut,isEdit:true})}
                        onDelete={()=>setModal({type:"deleteRutina",data:rut})}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredRutinas.length===0 && (
                  <div style={{...raj(12,400),color:C.muted,padding:28,textAlign:"center",
                    background:"rgba(10,14,26,0.35)",borderRadius:10,border:`1px dashed ${C.navy}`}}>
                    Sin rutinas en esta categoría
                  </div>
                )}
              </div>
            </div>

            {/* Ejercicios panel */}
            <div style={{
              background:"rgba(20,26,42,0.76)", backdropFilter:"blur(14px)",
              border:`1px solid ${C.navy}`, borderRadius:14, overflow:"hidden",
              boxShadow:"0 4px 24px rgba(0,0,0,0.28)",
            }}>
              <div style={{ background:`${C.blue}0A`, borderBottom:`1px solid ${C.blue}22`,
                padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ background:`${C.blue}18`, border:`1px solid ${C.blue}30`,
                  borderRadius:8, padding:8, display:"flex" }}>
                  <Dumbbell size={14} color={C.blue}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{...orb(11,700), color:C.white}}>EJERCICIOS</div>
                </div>
                <span style={{...raj(10,700), color:C.blue, background:`${C.blue}18`,
                  border:`1px solid ${C.blue}30`, padding:"2px 9px", borderRadius:5}}>
                  {filteredEjercicios.length}
                </span>
              </div>
              <div style={{ height:1, background:`linear-gradient(90deg,${C.blue}33,transparent)` }}/>
              <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:7,maxHeight:520,overflowY:"auto"}}>
                <AnimatePresence>
                  {filteredEjercicios.map((ej,i) => (
                    <motion.div key={ej.id} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.03,0.3)}}>
                      <EjercicioCard ej={ej}
                        onEdit={()=>setModal({type:"ejercicio",data:ej,isEdit:true})}
                        onDelete={()=>setModal({type:"deleteEjercicio",data:ej})}
                        onToggleActivo={()=>handleToggleActivoEjercicio(ej)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredEjercicios.length===0 && (
                  <div style={{...raj(12,400),color:C.muted,padding:28,textAlign:"center",
                    background:"rgba(10,14,26,0.35)",borderRadius:10,border:`1px dashed ${C.navy}`}}>
                    Sin ejercicios en esta categoría
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </>
  );
}
