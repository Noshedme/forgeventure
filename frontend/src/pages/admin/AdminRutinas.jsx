// src/pages/admin/AdminRutinas.jsx — v2 · Config aesthetic
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase.js";
import { getRutinas, createRutina, updateRutina, deleteRutina } from "../../services/api.js";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";
import { useToast } from "../../components/shared/ui.jsx";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2, X, Check,
  AlertTriangle, BookOpen, Dumbbell, Activity, Sparkles,
  Clock, Zap, BarChart2, Users, ChevronRight, Shield,
} from "lucide-react";

// ── Taxonomy + colour mapping ─────────────────────────────────
const TAXONOMIA = {
  Fuerza:       { color:C.orange, Icon:Dumbbell,  subs:["Calistenia","Pesas","Funcional","Explosiva","Hipertrofia","Resistencia"] },
  Cardio:       { color:C.blue,   Icon:Activity,  subs:["HIIT","Continuo","Intervalos","Aeróbico","Anaeróbico","Deportivo"]       },
  Flexibilidad: { color:C.purple, Icon:Sparkles,  subs:["Yoga","Pilates","Stretching","Movilidad","Balance","Recuperación"]       },
};
const CATEGORIAS_OPT = Object.keys(TAXONOMIA);
const DIFICULTADES   = ["Principiante","Intermedio","Avanzado","Élite"];
const DIFF_COLOR     = { Principiante:C.green, Intermedio:C.teal, Avanzado:C.orange, Élite:C.red };
const DIAS_SEMANA    = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @keyframes rn-modalIn  { from{opacity:0;transform:scale(.95) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes rn-spin      { to{transform:rotate(360deg)} }
  @keyframes rn-slideIn   { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rn-skelPulse { 0%,100%{opacity:.5} 50%{opacity:.2} }

  .rn-skel  { background:${C.navy}66; animation:rn-skelPulse 1.4s ease infinite; border-radius:14px; }
  .rn-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .rn-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22,0 0 14px ${C.orange}12; }
  .rn-input::placeholder { color:${C.navy}; }
  .rn-btn   { transition:all .18s; cursor:pointer; }
  .rn-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .rn-card  { transition:transform .22s,box-shadow .22s,border-color .2s; cursor:default; }
  .rn-card:hover { transform:translateY(-4px) !important; }
`;

const EMPTY = {
  nombre:"", categoria:"Fuerza", subcategoria:"Calistenia",
  dificultad:"Principiante", duracionMin:30, diasSemana:[],
  descripcion:"", xpTotal:0, sesiones:0, activo:true, pasos:[],
};

// ── Validation ────────────────────────────────────────────────
function validateForm(form) {
  const e = {};
  if (!form.nombre?.trim())                      e.nombre       = "Requerido";
  else if (form.nombre.trim().length < 3)        e.nombre       = "Mín. 3 caracteres";
  if (!CATEGORIAS_OPT.includes(form.categoria))  e.categoria    = "Categoría inválida";
  const subs = TAXONOMIA[form.categoria]?.subs || [];
  if (!subs.includes(form.subcategoria))         e.subcategoria = "Subcategoría inválida";
  if (!DIFICULTADES.includes(form.dificultad))   e.dificultad   = "Dificultad inválida";
  const dur = Number(form.duracionMin);
  if (isNaN(dur) || dur < 5 || dur > 480)        e.duracionMin  = "5–480 min";
  const xp = Number(form.xpTotal);
  if (isNaN(xp) || xp < 0)                       e.xpTotal      = "≥ 0";
  return e;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5,
      ...raj(11,700), color:C.red, animation:"rn-slideIn .2s ease both" }}>
      <AlertTriangle size={11} style={{flexShrink:0}}/>{msg}
    </div>
  );
}

// ── Shared modal overlay ──────────────────────────────────────
function ModalOverlay({ children, onClose, maxWidth=620 }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,.72)",
        backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}>
      <div style={{
        width:"100%", maxWidth,
        background:"rgba(20,26,42,0.96)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        border:`1px solid ${C.navy}`,
        borderRadius:16,
        boxShadow:"0 24px 64px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow:"hidden",
        animation:"rn-modalIn .25s ease both",
        maxHeight:"92vh", overflowY:"auto",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Modal header ──────────────────────────────────────────────
function ModalHeader({ icon:Icon, title, color, onClose }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"18px 22px", borderBottom:`1px solid ${C.navy}44`,
      background:`${color}08`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{
          background:`${color}18`, border:`1px solid ${color}33`, borderRadius:8,
          padding:9, display:"flex",
        }}>
          <Icon size={16} color={color}/>
        </div>
        <div>
          <div style={{ ...orb(12,700), color:C.white }}>{title}</div>
          <div style={{ height:2, marginTop:4, width:40,
            background:`linear-gradient(90deg,${color},transparent)` }}/>
        </div>
      </div>
      <button onClick={onClose} className="rn-btn"
        style={{ background:"transparent", border:`1px solid ${C.navy}`, borderRadius:7,
          padding:7, color:C.muted, cursor:"pointer", display:"flex" }}>
        <X size={14}/>
      </button>
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────
const inpStyle = (err=false) => ({
  width:"100%", padding:"10px 13px",
  background:C.panel,
  border:`1px solid ${err ? C.red+"88" : C.navy}`,
  borderRadius:8, color:C.white,
  boxShadow: err ? `0 0 0 2px ${C.red}14` : undefined,
  ...raj(13,500),
});
const lbl = { display:"block", ...px(6), color:C.muted, marginBottom:7, letterSpacing:".06em" };

// ── Paso (exercise step) inline editor ───────────────────────
function PasoEditor({ paso, idx, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const showReps  = paso.verif === "Cámara" || paso.verif === "Ambos" || !paso.verif;
  const showTimer = paso.verif === "Timer"  || paso.verif === "Ambos";
  const fLbl = { ...px(4), color:C.muted, display:"block", marginBottom:3, letterSpacing:".03em" };
  const numSt = { ...inpStyle(), padding:"6px 8px", minWidth:0, width:"100%" };
  return (
    <div style={{
      background:C.panel, border:`1px solid ${C.navy}`,
      borderLeft:`3px solid ${C.orange}66`, borderRadius:8,
      padding:"10px 12px", display:"flex", flexDirection:"column", gap:8,
    }}>
      {/* Row 1: index + emoji + name + reorder + delete */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ ...px(6), color:C.orange, minWidth:20, flexShrink:0 }}>#{idx+1}</span>
        <input
          value={paso.imagen || "💪"}
          onChange={e => onChange({ ...paso, imagen: e.target.value.slice(0,2) || "💪" })}
          style={{ width:36, background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6,
            color:C.white, textAlign:"center", fontSize:18, padding:"4px", outline:"none" }}
        />
        <input className="rn-input"
          value={paso.nombre}
          onChange={e => onChange({ ...paso, nombre: e.target.value })}
          placeholder="Nombre del ejercicio"
          style={{ ...inpStyle(), flex:1 }}
        />
        <div style={{ display:"flex", gap:3, flexShrink:0 }}>
          {[
            { label:"▲", onClick:onMoveUp,  disabled:idx===0         },
            { label:"▼", onClick:onMoveDown, disabled:idx>=total-1   },
          ].map(({ label, onClick, disabled }, i) => (
            <button key={i} type="button" onClick={onClick} disabled={disabled}
              style={{ width:24, height:24, background:"transparent", border:`1px solid ${C.navy}`,
                borderRadius:4, cursor:disabled?"not-allowed":"pointer",
                color:C.muted, opacity:disabled?.35:1,
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:0, fontSize:11 }}>
              {label}
            </button>
          ))}
          <button type="button" onClick={onDelete}
            style={{ width:24, height:24, background:`${C.red}14`, border:`1px solid ${C.red}33`,
              borderRadius:4, cursor:"pointer", color:C.red,
              display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
            <X size={11}/>
          </button>
        </div>
      </div>
      {/* Row 2: series | verif | reps | seg | desc | xp */}
      <div style={{ display:"grid", gridTemplateColumns:"56px 1fr 58px 58px 62px 52px", gap:6 }}>
        <div>
          <label style={fLbl}>SERIES</label>
          <input type="number" min={1} max={20} className="rn-input"
            value={paso.series || 3}
            onChange={e => onChange({ ...paso, series: Math.max(1, Number(e.target.value)||1) })}
            style={numSt}/>
        </div>
        <div>
          <label style={fLbl}>VERIFICACIÓN</label>
          <select className="rn-input"
            value={paso.verif || "Cámara"}
            onChange={e => onChange({ ...paso, verif: e.target.value })}
            style={{ ...numSt, appearance:"none", cursor:"pointer" }}>
            {["Cámara","Timer","Ambos"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ opacity: showReps ? 1 : .3 }}>
          <label style={fLbl}>REPS</label>
          <input type="number" min={1} className="rn-input"
            value={paso.reps ?? ""} placeholder="—"
            disabled={!showReps}
            onChange={e => onChange({ ...paso, reps: e.target.value ? Number(e.target.value) : null })}
            style={numSt}/>
        </div>
        <div style={{ opacity: showTimer ? 1 : .3 }}>
          <label style={fLbl}>SEG</label>
          <input type="number" min={5} className="rn-input"
            value={paso.duracion ?? ""} placeholder="—"
            disabled={!showTimer}
            onChange={e => onChange({ ...paso, duracion: e.target.value ? Number(e.target.value) : null })}
            style={numSt}/>
        </div>
        <div>
          <label style={fLbl}>DESC(s)</label>
          <input type="number" min={0} className="rn-input"
            value={paso.descanso ?? 60}
            onChange={e => onChange({ ...paso, descanso: Number(e.target.value)||0 })}
            style={numSt}/>
        </div>
        <div>
          <label style={fLbl}>XP</label>
          <input type="number" min={0} className="rn-input"
            value={paso.xp || 0}
            onChange={e => onChange({ ...paso, xp: Number(e.target.value)||0 })}
            style={numSt}/>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// FORM MODAL
// ══════════════════════════════════════════════════════════════
function FormModal({ mode, initial, onClose, onSaved }) {
  const [form,  setForm]  = useState(() => {
    const base = initial || EMPTY;
    return { ...base, pasos: (base.pasos||[]).map((p,i) => ({ ...p, _key: p._key || `k${i}-${Date.now()}` })) };
  });
  const [dirty, setDirty] = useState(new Set());
  const [errs,  setErrs]  = useState({});
  const [saving,setSaving]= useState(false);
  const { push }          = useToast();

  const isEdit  = mode === "edit";
  const accent  = isEdit ? C.orange : C.green;
  const subs    = TAXONOMIA[form.categoria]?.subs || [];

  const touch = k => setDirty(d => { const n=new Set(d); n.add(k); return n; });
  const set   = (k, v) => setForm(f => {
    const next = { ...f, [k]:v };
    if (dirty.has(k)) setErrs(validateForm(next));
    return next;
  });
  const blur  = k => { touch(k); setErrs(validateForm(form)); };

  const handleSave = async () => {
    const keys = ["nombre","categoria","subcategoria","dificultad","duracionMin","xpTotal"];
    keys.forEach(touch);
    const e = validateForm(form);
    setErrs(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const pasosSave = (form.pasos||[]).map(({ _key, ...p }) => p);
      const xpFinal = pasosSave.reduce((s,p) => s+(Number(p.xp)||0), 0);
      const payload  = { ...form, pasos:pasosSave, xpTotal:xpFinal > 0 ? xpFinal : (form.xpTotal||0) };
      if (isEdit) await updateRutina(token, initial.id, payload);
      else        await createRutina(token, payload);
      onSaved();
    } catch (err) { push(err.message||"Error al guardar","error"); }
    finally { setSaving(false); }
  };

  const toggleDia = d => set("diasSemana",
    form.diasSemana.includes(d)
      ? form.diasSemana.filter(x => x !== d)
      : [...form.diasSemana, d]
  );

  const addPaso = () => {
    const p = { nombre:"", imagen:"💪", series:3, reps:10, duracion:null, descanso:60, verif:"Cámara", xp:25, _key:`k${Date.now()}` };
    set("pasos", [...(form.pasos||[]), p]);
  };
  const updatePaso = (idx, updated) => {
    const arr = [...form.pasos]; arr[idx] = updated; set("pasos", arr);
  };
  const deletePaso = (idx) => set("pasos", form.pasos.filter((_,i) => i !== idx));
  const movePaso = (idx, dir) => {
    const arr = [...form.pasos], tgt = idx + dir;
    if (tgt < 0 || tgt >= arr.length) return;
    [arr[idx], arr[tgt]] = [arr[tgt], arr[idx]]; set("pasos", arr);
  };
  const xpAutocalc = (form.pasos||[]).reduce((s,p) => s+(Number(p.xp)||0), 0);

  return (
    <ModalOverlay onClose={onClose} maxWidth={660}>
      <div style={{ height:3, background:`linear-gradient(90deg,transparent,${accent},transparent)` }}/>
      <ModalHeader
        icon={isEdit ? Edit2 : Plus}
        title={isEdit ? "EDITAR RUTINA" : "NUEVA RUTINA"}
        color={accent}
        onClose={onClose}
      />

      <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Nombre */}
        <div>
          <label style={lbl}>NOMBRE</label>
          <input className="rn-input" value={form.nombre}
            onChange={e => set("nombre",e.target.value)} onBlur={() => blur("nombre")}
            placeholder="Nombre de la rutina"
            style={inpStyle(dirty.has("nombre")&&!!errs.nombre)}/>
          <FieldError msg={dirty.has("nombre")?errs.nombre:null}/>
        </div>

        {/* Categoría grid */}
        <div>
          <label style={lbl}>CATEGORÍA</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {CATEGORIAS_OPT.map(cat => {
              const m = TAXONOMIA[cat]; const on = form.categoria === cat;
              return (
                <button key={cat} type="button" onClick={() => { set("categoria",cat); set("subcategoria",m.subs[0]); }} className="rn-btn"
                  style={{
                    display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                    padding:"12px 8px",
                    background: on ? `${m.color}18` : "transparent",
                    border:`1px solid ${on ? m.color+"44" : C.navy}`,
                    borderRadius:10, cursor:"pointer", transition:"all .2s",
                    boxShadow: on ? `0 0 16px ${m.color}22` : "none",
                  }}>
                  <m.Icon size={18} color={on ? m.color : C.muted}
                    style={{ filter:on?`drop-shadow(0 0 4px ${m.color})`:"none" }}/>
                  <span style={{ ...raj(11,on?700:500), color:on?m.color:C.muted }}>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategoría + Dificultad */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={lbl}>SUBCATEGORÍA</label>
            <select className="rn-input" value={form.subcategoria}
              onChange={e => { set("subcategoria",e.target.value); touch("subcategoria"); }}
              style={{ ...inpStyle(dirty.has("subcategoria")&&!!errs.subcategoria), appearance:"none", cursor:"pointer" }}>
              {subs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError msg={dirty.has("subcategoria")?errs.subcategoria:null}/>
          </div>
          <div>
            <label style={lbl}>DIFICULTAD</label>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {DIFICULTADES.map(d => {
                const on = form.dificultad === d; const dc = DIFF_COLOR[d];
                return (
                  <button key={d} type="button" onClick={() => { set("dificultad",d); touch("dificultad"); }}
                    style={{
                      ...raj(10,on?700:500), padding:"5px 10px", borderRadius:20, cursor:"pointer",
                      background: on ? `${dc}22` : "transparent",
                      border:`1px solid ${on ? dc+"55" : C.navy}`,
                      color: on ? dc : C.muted, transition:"all .18s",
                    }}>
                    {d}
                  </button>
                );
              })}
            </div>
            <FieldError msg={dirty.has("dificultad")?errs.dificultad:null}/>
          </div>
        </div>

        {/* Duración + XP + Activo */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          <div>
            <label style={lbl}>DURACIÓN (min)</label>
            <input className="rn-input" type="number" min={5} max={480} value={form.duracionMin}
              onChange={e => set("duracionMin",Number(e.target.value))} onBlur={() => blur("duracionMin")}
              style={inpStyle(dirty.has("duracionMin")&&!!errs.duracionMin)}/>
            <FieldError msg={dirty.has("duracionMin")?errs.duracionMin:null}/>
          </div>
          <div>
            <label style={lbl}>XP TOTAL {xpAutocalc>0?<span style={{ color:C.muted, fontWeight:400 }}>(auto)</span>:""}</label>
            <input className="rn-input" type="number" min={0}
              value={xpAutocalc > 0 ? xpAutocalc : form.xpTotal}
              onChange={e => set("xpTotal",Number(e.target.value))} onBlur={() => blur("xpTotal")}
              readOnly={xpAutocalc > 0}
              style={{ ...inpStyle(dirty.has("xpTotal")&&!!errs.xpTotal), opacity:xpAutocalc>0?.7:1 }}/>
            {xpAutocalc > 0
              ? <div style={{ ...px(4), color:C.muted, marginTop:4 }}>Calculado desde los pasos</div>
              : <FieldError msg={dirty.has("xpTotal")?errs.xpTotal:null}/>
            }
          </div>
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <label style={lbl}>ESTADO</label>
            <button type="button" onClick={() => set("activo",!form.activo)}
              style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                ...raj(12,700), color:form.activo?C.green:C.red,
                background:form.activo?`${C.green}14`:`${C.red}14`,
                border:`1px solid ${form.activo?C.green:C.red}44`,
                borderRadius:8, cursor:"pointer", transition:"all .2s",
              }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:form.activo?C.green:C.red }}/>
              {form.activo?"ACTIVA":"INACTIVA"}
            </button>
          </div>
        </div>

        {/* Días */}
        <div>
          <label style={lbl}>DÍAS DE LA SEMANA</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {DIAS_SEMANA.map(d => {
              const on = form.diasSemana.includes(d);
              return (
                <button key={d} type="button" onClick={() => toggleDia(d)} className="rn-btn"
                  style={{
                    ...raj(11,on?700:600), padding:"6px 12px", borderRadius:20, cursor:"pointer",
                    background: on ? `${C.orange}22` : "transparent",
                    color: on ? C.orange : C.muted,
                    border:`1px solid ${on?C.orange+"55":C.navy}`,
                    boxShadow: on ? `0 0 8px ${C.orange}22` : "none",
                    transition:"all .18s",
                  }}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label style={lbl}>DESCRIPCIÓN</label>
          <textarea className="rn-input" value={form.descripcion} rows={3}
            onChange={e => set("descripcion",e.target.value)}
            placeholder="Descripción breve de la rutina..."
            style={{ ...inpStyle(), resize:"vertical", lineHeight:1.6 }}/>
        </div>

        {/* Pasos / Ejercicios */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <label style={{ ...lbl, marginBottom:0 }}>PASOS / EJERCICIOS</label>
              <span style={{ ...px(5), color:C.orange, background:`${C.orange}14`, border:`1px solid ${C.orange}33`, borderRadius:10, padding:"1px 7px" }}>
                {(form.pasos||[]).length}
              </span>
              {xpAutocalc > 0 && (
                <span style={{ ...px(5), color:C.gold }}>→ {xpAutocalc} XP auto</span>
              )}
            </div>
            <button type="button" onClick={addPaso} className="rn-btn"
              style={{ ...px(6), color:C.green, background:`${C.green}14`, border:`1px solid ${C.green}44`,
                borderRadius:6, padding:"5px 12px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:5 }}>
              <Plus size={11}/> AÑADIR PASO
            </button>
          </div>

          {(form.pasos||[]).length === 0 ? (
            <div style={{ background:C.panel, border:`1px dashed ${C.navy}`, borderRadius:8, padding:"20px", textAlign:"center" }}>
              <div style={{ fontSize:24, marginBottom:6, opacity:.4 }}>💪</div>
              <div style={{ ...px(5), color:C.muted }}>Sin ejercicios. Haz clic en AÑADIR PASO para configurar la rutina.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:360, overflowY:"auto", paddingRight:2 }}>
              {(form.pasos||[]).map((paso, pi) => (
                <PasoEditor
                  key={paso._key}
                  paso={paso} idx={pi} total={(form.pasos||[]).length}
                  onChange={updated => updatePaso(pi, updated)}
                  onDelete={() => deletePaso(pi)}
                  onMoveUp={() => movePaso(pi, -1)}
                  onMoveDown={() => movePaso(pi, 1)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:4, borderTop:`1px solid ${C.navy}33` }}>
          <button onClick={onClose} className="rn-btn"
            style={{ ...raj(13,600), background:C.panel, border:`1px solid ${C.navy}`, borderRadius:8,
              color:C.muted, padding:"11px 18px", cursor:"pointer" }}>
            CANCELAR
          </button>
          <button onClick={handleSave} disabled={saving} className="rn-btn"
            style={{
              ...px(8), background:saving?`${accent}55`:accent, color:saving?C.muted:C.bg,
              border:"none", borderRadius:8, padding:"11px 22px", cursor:saving?"not-allowed":"pointer",
              display:"flex", alignItems:"center", gap:10,
              boxShadow: saving?"none":`0 4px 20px ${accent}44`,
            }}>
            {saving
              ? <><div style={{ width:12,height:12,border:`2px solid ${C.muted}`,borderTop:`2px solid ${accent}`,borderRadius:"50%",animation:"rn-spin .8s linear infinite" }}/> GUARDANDO...</>
              : <><Check size={14}/> {isEdit?"GUARDAR CAMBIOS":"CREAR RUTINA"}</>
            }
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ══════════════════════════════════════════════════════════════
// DELETE MODAL
// ══════════════════════════════════════════════════════════════
function DeleteModal({ rutina, onClose, onDeleted }) {
  const [typed,   setTyped]   = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const match = typed.trim() === rutina.nombre.trim();

  const handleDelete = async () => {
    if (!match) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await deleteRutina(token, rutina.id);
      onDeleted();
    } catch (e) { setErr(e.message||"Error al eliminar"); setLoading(false); }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={440}>
      <div style={{ height:3, background:`linear-gradient(90deg,transparent,${C.red},transparent)` }}/>
      <ModalHeader icon={Trash2} title="ELIMINAR RUTINA" color={C.red} onClose={onClose}/>
      <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:14 }}>

        <div style={{ display:"flex", gap:12, padding:"12px 16px",
          background:`${C.red}0A`, border:`1px solid ${C.red}22`, borderRadius:10 }}>
          <AlertTriangle size={16} color={C.red} style={{ flexShrink:0, marginTop:2 }}/>
          <p style={{ ...raj(12,500), color:`${C.red}CC`, lineHeight:1.6, margin:0 }}>
            Esta rutina puede estar referenciada en historiales de usuarios. Esta acción es <strong>irreversible</strong>.
          </p>
        </div>

        <div style={{ background:C.panel, border:`1px solid ${C.navy}`, borderRadius:8, padding:"10px 14px" }}>
          <p style={{ ...raj(11,600), color:C.muted, marginBottom:4 }}>NOMBRE A CONFIRMAR</p>
          <p style={{ ...orb(12,800), color:C.white, letterSpacing:".02em", margin:0 }}>{rutina.nombre}</p>
        </div>

        <div>
          <label style={lbl}>ESCRIBE EL NOMBRE EXACTO</label>
          <input className="rn-input" value={typed} onChange={e => setTyped(e.target.value)}
            placeholder={rutina.nombre}
            style={{ ...inpStyle(), border:`1px solid ${match?C.green+"55":C.navy}` }}/>
        </div>

        {err && <div style={{ ...raj(11,600), color:C.red, display:"flex", gap:6, alignItems:"center" }}><AlertTriangle size={12}/>{err}</div>}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:4, borderTop:`1px solid ${C.navy}33` }}>
          <button onClick={onClose} className="rn-btn"
            style={{ ...raj(13,600), background:C.panel, border:`1px solid ${C.navy}`, borderRadius:8,
              color:C.muted, padding:"11px 18px", cursor:"pointer" }}>
            CANCELAR
          </button>
          <button onClick={handleDelete} disabled={!match||loading} className="rn-btn"
            style={{
              ...px(7), background:(match&&!loading)?C.red:`${C.red}22`,
              color:(match&&!loading)?C.white:C.muted,
              border:`1px solid ${C.red}55`, borderRadius:8, padding:"11px 20px",
              cursor:match?"pointer":"not-allowed",
              display:"flex", alignItems:"center", gap:10, transition:"all .2s",
            }}>
            {loading
              ? <><div style={{ width:12,height:12,border:`2px solid ${C.muted}`,borderTop:`2px solid ${C.red}`,borderRadius:"50%",animation:"rn-spin .8s linear infinite" }}/> ELIMINANDO...</>
              : <><Trash2 size={13}/> ELIMINAR</>
            }
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ══════════════════════════════════════════════════════════════
// VIEW MODAL
// ══════════════════════════════════════════════════════════════
function ViewModal({ rutina, onClose, onEdit, onDelete }) {
  const tax = TAXONOMIA[rutina.categoria] || { color:C.orange, Icon:BookOpen };
  const c   = tax.color;
  const dc  = DIFF_COLOR[rutina.dificultad] || C.muted;

  return (
    <ModalOverlay onClose={onClose} maxWidth={520}>
      <div style={{ height:3, background:`linear-gradient(90deg,transparent,${c},transparent)` }}/>
      <ModalHeader icon={tax.Icon} title={rutina.nombre} color={c} onClose={onClose}/>

      <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Meta badges */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[
            { l:rutina.categoria,    color:c          },
            { l:rutina.subcategoria, color:C.blue      },
            { l:rutina.dificultad,   color:dc          },
          ].map((b,i) => (
            <span key={i} style={{
              ...raj(10,700), color:b.color,
              background:`${b.color}18`, border:`1px solid ${b.color}33`,
              borderRadius:20, padding:"3px 10px",
            }}>{b.l}</span>
          ))}
          <span style={{
            ...raj(10,600), color:rutina.activo?C.green:C.red,
            background:rutina.activo?`${C.green}14`:`${C.red}14`,
            border:`1px solid ${rutina.activo?C.green:C.red}33`,
            borderRadius:20, padding:"3px 10px",
          }}>{rutina.activo?"● ACTIVA":"● INACTIVA"}</span>
        </div>

        {/* Stat cards — 3 col */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { icon:Clock,    label:"DURACIÓN",  value:`${rutina.duracionMin} min`, color:C.blue    },
            { icon:Zap,      label:"XP TOTAL",  value:(rutina.xpTotal||0).toLocaleString(), color:C.gold },
            { icon:BarChart2,label:"SESIONES",  value:(rutina.sesiones||0).toLocaleString(), color:C.teal },
          ].map(({ icon:Icon, label, value, color }, i) => (
            <div key={i} style={{
              background:C.panel, border:`1px solid ${C.navy}`,
              borderRadius:10, padding:"12px 10px",
              borderLeft:`3px solid ${color}`,
              textAlign:"center",
            }}>
              <Icon size={14} color={color} style={{ marginBottom:6 }}/>
              <div style={{ ...orb(14,900), color, marginBottom:3 }}>{value}</div>
              <div style={{ ...px(5), color:C.muted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Descripción */}
        {rutina.descripcion && (
          <div style={{ background:C.panel, border:`1px solid ${C.navy}`, borderRadius:10, padding:"12px 14px" }}>
            <p style={{ ...raj(12,400), color:C.mutedL, lineHeight:1.7, margin:0 }}>{rutina.descripcion}</p>
          </div>
        )}

        {/* Días */}
        {rutina.diasSemana?.length > 0 && (
          <div>
            <p style={{ ...px(6), color:C.muted, marginBottom:8, letterSpacing:".05em" }}>DÍAS</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {rutina.diasSemana.map(d => (
                <span key={d} style={{
                  ...raj(11,700), color:C.orange,
                  background:`${C.orange}18`, border:`1px solid ${C.orange}33`,
                  borderRadius:20, padding:"4px 12px",
                }}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", gap:10, paddingTop:4, borderTop:`1px solid ${C.navy}33` }}>
          <button onClick={() => { onClose(); onEdit(); }} className="rn-btn"
            style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              ...px(8), color:C.bg, background:C.orange, border:"none", borderRadius:8,
              padding:"11px", cursor:"pointer", boxShadow:`0 4px 20px ${C.orange}44`,
            }}>
            <Edit2 size={13}/> EDITAR
          </button>
          <button onClick={() => { onClose(); onDelete(); }} className="rn-btn"
            style={{
              flex:"0 0 auto", display:"flex", alignItems:"center", gap:8,
              ...raj(12,700), color:C.red, background:`${C.red}14`,
              border:`1px solid ${C.red}44`, borderRadius:8,
              padding:"11px 18px", cursor:"pointer",
            }}>
            <Trash2 size={13}/> BORRAR
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ══════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════
function SkeletonRutinas() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[0,1,2,3].map(i => <div key={i} className="rn-skel" style={{ height:90, animationDelay:`${i*.08}s` }}/>)}
      </div>
      {/* Tabs + toolbar */}
      <div className="rn-skel" style={{ height:52 }}/>
      <div className="rn-skel" style={{ height:44 }}/>
      {/* Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
        {[0,1,2,3,4,5].map(i => <div key={i} className="rn-skel" style={{ height:220, animationDelay:`${i*.07}s` }}/>)}
      </div>
    </div>
  );
}

// ── Rutina card ───────────────────────────────────────────────
function RutinaCard({ rutina, onView, onEdit, onDelete }) {
  const tax = TAXONOMIA[rutina.categoria] || { color:C.orange, Icon:BookOpen };
  const c   = tax.color;
  const dc  = DIFF_COLOR[rutina.dificultad] || C.muted;

  return (
    <motion.div
      className="rn-card"
      whileHover={{ y:-4, boxShadow:`0 16px 40px rgba(0,0,0,.5), 0 0 20px ${c}18, inset 0 1px 0 rgba(255,255,255,.07)` }}
      transition={{ duration:0.2, ease:"easeOut" }}
      style={{
        background:"rgba(20,26,42,0.78)",
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        border:`1px solid ${C.navy}`,
        borderLeft:`3px solid ${c}`,
        borderRadius:14,
        boxShadow:"0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
        overflow:"hidden",
        display:"flex", flexDirection:"column",
      }}>

      {/* Top gradient bar */}
      <div style={{ height:2, background:`linear-gradient(90deg,${c},${c}22,transparent)` }}/>

      <div style={{ padding:"16px 16px 0" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
          <div style={{
            width:44, height:44, borderRadius:10, flexShrink:0,
            background:`${c}18`, border:`1px solid ${c}33`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`inset 0 0 14px ${c}0E`,
          }}>
            <tax.Icon size={20} color={c}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...orb(12,800), color:C.white, marginBottom:5, lineHeight:1.3,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {rutina.nombre}
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <span style={{ ...raj(9,700), color:c, background:`${c}14`, border:`1px solid ${c}22`, borderRadius:20, padding:"2px 8px" }}>{rutina.categoria}</span>
              <span style={{ ...raj(9,700), color:dc, background:`${dc}14`, border:`1px solid ${dc}22`, borderRadius:20, padding:"2px 8px" }}>{rutina.dificultad}</span>
            </div>
          </div>
          {/* Active dot */}
          <div style={{ width:9, height:9, borderRadius:"50%", background:rutina.activo?C.green:C.red,
            boxShadow:rutina.activo?`0 0 6px ${C.green}`:"none", flexShrink:0, marginTop:4 }}/>
        </div>

        {/* Description */}
        <p style={{ ...raj(11,400), color:C.muted, lineHeight:1.6, marginBottom:12,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {rutina.descripcion || "Sin descripción."}
        </p>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
          {[
            { icon:Clock,     v:`${rutina.duracionMin}m`,             color:C.blue },
            { icon:Zap,       v:(rutina.xpTotal||0).toLocaleString(), color:C.gold },
            { icon:BarChart2, v:(rutina.sesiones||0).toLocaleString(),color:C.teal },
          ].map(({ icon:Icon, v, color }, i) => (
            <div key={i} style={{ background:C.panel, border:`1px solid ${C.navy}33`,
              borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
              <Icon size={11} color={color} style={{ marginBottom:2 }}/>
              <div style={{ ...raj(11,700), color }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Day pills */}
        {rutina.diasSemana?.length > 0 && (
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:12 }}>
            {rutina.diasSemana.map(d => (
              <span key={d} style={{
                ...raj(9,700), color:C.orange,
                background:`${C.orange}14`, border:`1px solid ${C.orange}22`,
                borderRadius:20, padding:"2px 7px",
              }}>{d}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div style={{ marginTop:"auto", borderTop:`1px solid ${C.navy}33`,
        display:"grid", gridTemplateColumns:"1fr 1fr 1fr", overflow:"hidden",
        borderRadius:"0 0 14px 14px" }}>
        {[
          { Icon:Eye,   c:C.blue,   fn:onView,   l:"Ver"    },
          { Icon:Edit2, c:C.orange, fn:onEdit,   l:"Editar" },
          { Icon:Trash2,c:C.red,    fn:onDelete, l:"Borrar" },
        ].map(({ Icon, c:ic, fn, l }, j) => (
          <button key={j} onClick={fn} className="rn-btn"
            style={{
              background:"transparent", border:"none",
              borderRight:j<2?`1px solid ${C.navy}33`:"none",
              padding:"10px 0", color:ic,
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              cursor:"pointer", transition:"background .18s",
            }}
            onMouseEnter={e => e.currentTarget.style.background=`${ic}12`}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <Icon size={13}/>
            <span style={{ ...raj(9,600), color:C.muted }}>{l}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminRutinas() {
  const [rutinas,      setRutinas]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [catTab,       setCatTab]       = useState("Todas");
  const [search,       setSearch]       = useState("");
  const [subfilter,    setSubfilter]    = useState("Todas");
  const [difilter,     setDifilter]     = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal,        setModal]        = useState(null);
  const [refreshing,   setRefreshing]   = useState(false);
  const { push } = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const resp = await getRutinas(token);
      setRutinas(resp.rutinas || []);
    } catch { push("Error cargando rutinas","error"); }
    finally   { setLoading(false); }
  }, [push]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const stats = useMemo(() => ({
    total:    rutinas.length,
    activas:  rutinas.filter(r => r.activo).length,
    xpTotal:  rutinas.reduce((s,r) => s+(r.xpTotal||0),0),
    sesiones: rutinas.reduce((s,r) => s+(r.sesiones||0),0),
  }), [rutinas]);

  const subcats = catTab !== "Todas" ? TAXONOMIA[catTab]?.subs || [] : [];

  const filtered = useMemo(() => {
    let arr = [...rutinas];
    if (catTab !== "Todas")                       arr = arr.filter(r => r.categoria === catTab);
    if (search.trim())                            arr = arr.filter(r => `${r.nombre} ${r.descripcion}`.toLowerCase().includes(search.toLowerCase()));
    if (subfilter !== "Todas" && catTab !== "Todas") arr = arr.filter(r => r.subcategoria === subfilter);
    if (difilter !== "Todas")                     arr = arr.filter(r => r.dificultad === difilter);
    if (statusFilter === "activas")               arr = arr.filter(r =>  r.activo);
    if (statusFilter === "inactivas")             arr = arr.filter(r => !r.activo);
    return arr;
  }, [rutinas, catTab, search, subfilter, difilter, statusFilter]);

  const handleSaved = useCallback(() => {
    push(`Rutina ${modal?.type==="create"?"creada":"actualizada"} correctamente`);
    setModal(null); loadAll();
  }, [modal, push, loadAll]);

  const handleDeleted = useCallback(() => {
    push("Rutina eliminada");
    setModal(null); loadAll();
  }, [push, loadAll]);

  const pillBtn = (on, color=C.orange) => ({
    ...raj(11,on?700:500),
    color:on?color:C.muted,
    background:on?`${color}18`:"transparent",
    border:`1px solid ${on?color:C.navy}`,
    borderRadius:20, padding:"5px 13px", cursor:"pointer",
    boxShadow:on?`0 0 10px ${color}22`:"none",
    transition:"all .18s",
  });

  if (loading) return <><style>{CSS}</style><SkeletonRutinas/></>;

  return (
    <>
      <style>{CSS}</style>

      {/* Modals */}
      {(modal?.type==="create"||modal?.type==="edit") && (
        <FormModal mode={modal.type} initial={modal.type==="edit"?modal.data:null}
          onClose={()=>setModal(null)} onSaved={handleSaved}/>
      )}
      {modal?.type==="view" && (
        <ViewModal rutina={modal.data} onClose={()=>setModal(null)}
          onEdit={()=>setModal({type:"edit",data:modal.data})}
          onDelete={()=>setModal({type:"delete",data:modal.data})}/>
      )}
      {modal?.type==="delete" && (
        <DeleteModal rutina={modal.data} onClose={()=>setModal(null)} onDeleted={handleDeleted}/>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

        {/* ── KPI CARDS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { label:"RUTINAS",     value:stats.total,                    icon:BookOpen,  color:C.orange },
            { label:"ACTIVAS",     value:stats.activas,                  icon:Shield,    color:C.green  },
            { label:"XP TOTAL",    value:stats.xpTotal.toLocaleString(), icon:Zap,       color:C.gold   },
            { label:"SESIONES",    value:stats.sesiones.toLocaleString(),icon:BarChart2, color:C.blue   },
          ].map((k,i) => (
            <motion.div key={i}
              whileHover={{ y:-2, boxShadow:`0 10px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.07)` }}
              transition={{ duration:0.18, ease:"easeOut" }}
              style={{
                background:"rgba(20,26,42,0.78)",
                backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
                border:`1px solid ${C.navy}`,
                borderLeft:`4px solid ${k.color}`,
                borderRadius:14, padding:"18px 16px",
                boxShadow:"0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04)",
              }}>
              <div style={{ background:`${k.color}18`, border:`1px solid ${k.color}33`,
                borderRadius:8, padding:8, display:"inline-flex", color:k.color, marginBottom:10 }}>
                <k.icon size={16}/>
              </div>
              <div style={{ ...orb(24,900), color:k.color, marginBottom:3 }}>{k.value}</div>
              <div style={{ ...px(6), color:C.muted, letterSpacing:".05em" }}>{k.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── CATEGORY TABS + NEW BUTTON ── */}
        <div style={{
          background:"rgba(20,26,42,0.78)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:`1px solid ${C.navy}`,
          borderRadius:12, padding:"10px 14px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap",
        }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {/* All tab */}
            <button onClick={() => { setCatTab("Todas"); setSubfilter("Todas"); }} className="rn-btn"
              style={pillBtn(catTab==="Todas", C.orange)}>
              Todas <span style={{ ...raj(9,700), color:catTab==="Todas"?C.bg:C.navy,
                background:catTab==="Todas"?C.orange:`${C.navy}55`,
                padding:"1px 7px", borderRadius:10, marginLeft:4 }}>{rutinas.length}</span>
            </button>
            {CATEGORIAS_OPT.map(cat => {
              const m = TAXONOMIA[cat]; const on = catTab===cat;
              const cnt = rutinas.filter(r => r.categoria===cat).length;
              return (
                <button key={cat} onClick={() => { setCatTab(cat); setSubfilter("Todas"); }} className="rn-btn"
                  style={{ ...pillBtn(on, m.color), display:"flex", alignItems:"center", gap:6 }}>
                  <m.Icon size={13}/>
                  {cat}
                  <span style={{ ...raj(9,700), color:on?C.bg:C.navy,
                    background:on?m.color:`${C.navy}55`, padding:"1px 7px", borderRadius:10 }}>{cnt}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setModal({type:"create",data:null})} className="rn-btn"
            style={{
              ...px(8), color:C.bg, background:C.green, border:"none", borderRadius:8,
              padding:"8px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:7,
              boxShadow:`0 3px 14px ${C.green}33`, flexShrink:0,
            }}>
            <Plus size={13}/> NUEVA
          </button>
        </div>

        {/* ── TOOLBAR ── */}
        <div style={{
          background:"rgba(20,26,42,0.78)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          border:`1px solid ${C.navy}`,
          borderRadius:12, padding:"11px 14px",
          display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
        }}>
          {/* Search */}
          <div style={{ position:"relative", flex:"1 1 200px" }}>
            <Search size={13} color={C.muted} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}/>
            <input className="rn-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar rutinas..."
              style={{ ...inpStyle(), padding:"8px 12px 8px 32px" }}/>
            {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}><X size={12}/></button>}
          </div>

          {/* Subcategory filter */}
          {subcats.length > 0 && (
            <select value={subfilter} onChange={e => setSubfilter(e.target.value)}
              className="rn-input"
              style={{ ...inpStyle(), width:"auto", padding:"8px 12px", appearance:"none", cursor:"pointer" }}>
              <option value="Todas">Todas subcategorías</option>
              {subcats.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Difficulty filter */}
          <select value={difilter} onChange={e => setDifilter(e.target.value)}
            className="rn-input"
            style={{ ...inpStyle(), width:"auto", padding:"8px 12px", appearance:"none", cursor:"pointer" }}>
            <option value="Todas">Todas dificultades</option>
            {DIFICULTADES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Status pills */}
          <div style={{ display:"flex", gap:4 }}>
            {[
              { v:"all",      l:"Todas",    c:C.orange },
              { v:"activas",  l:"● Activas",c:C.green  },
              { v:"inactivas",l:"● Inactivas",c:C.red  },
            ].map(o => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)} className="rn-btn"
                style={pillBtn(statusFilter===o.v, o.c)}>
                {o.l}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={refresh} className="rn-btn"
            style={{ ...raj(12,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`,
              borderRadius:6, padding:"7px 11px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <RefreshCw size={12} style={{ animation:refreshing?"rn-spin .8s linear infinite":"none" }}/> Actualizar
          </button>
        </div>

        {/* ── RESULTS COUNT ── */}
        <div style={{ ...raj(12,500), color:C.muted }}>
          {filtered.length} rutina{filtered.length!==1?"s":""} encontrada{filtered.length!==1?"s":""}
        </div>

        {/* ── CARD GRID ── */}
        {filtered.length === 0 ? (
          <div style={{
            background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)",
            border:`1px solid ${C.navy}`, borderRadius:14,
            padding:"60px 40px", textAlign:"center",
          }}>
            <BookOpen size={40} color={C.navy} style={{ marginBottom:14, opacity:.5 }}/>
            <div style={{ ...raj(14,600), color:C.muted }}>No hay rutinas que coincidan con el filtro.</div>
          </div>
        ) : (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",
            gap:14,
            gridAutoRows:"auto",
          }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((rutina, i) => (
                <motion.div key={rutina.id}
                  initial={{ opacity:0, scale:.97 }}
                  animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0, scale:.95 }}
                  transition={{ duration:0.25, delay:i*.04, ease:"easeOut" }}
                  // Featured rutinas (top sessions) get extra column span
                  style={{ gridColumn:(rutina.sesiones||0)>=100 ? "span 1" : "span 1" }}>
                  <RutinaCard
                    rutina={rutina}
                    onView={()   => setModal({type:"view",   data:rutina})}
                    onEdit={()   => setModal({type:"edit",   data:rutina})}
                    onDelete={()=> setModal({type:"delete",  data:rutina})}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </>
  );
}
