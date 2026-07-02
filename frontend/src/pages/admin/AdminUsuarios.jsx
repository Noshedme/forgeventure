// src/pages/admin/AdminUsuarios.jsx
// ─── Wine/Aurora redesign — mantiene toda la lógica y comunicación Firebase ──

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  addCoinsAdmin, bulkDeleteUsers, bulkUpdateStatus,
  getDeletedUsers, restoreUser,
} from "../../services/api.js";
import { auth } from "../../firebase.js";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2, X, Check,
  AlertTriangle, Coins, ShieldOff, ShieldCheck, RotateCcw, Clock, Users,
} from "lucide-react";
import { getStage } from "../user/UserPersonaje";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";

const mono = (s, w=400) => ({fontFamily:"'JetBrains Mono',monospace", fontSize:s, fontWeight:w, lineHeight:1.5});
const sans = (s, w=500) => ({fontFamily:"'Manrope',sans-serif", fontSize:s, fontWeight:w});

const glass = (accent=C.wine) => ({
  background:"#180A1CCC",
  backdropFilter:"blur(14px)",
  WebkitBackdropFilter:"blur(14px)",
  border:`1px solid ${accent}33`,
});

const CLS = {
  GUERRERO: { icon:"⚔️", color:C.wine,    bg:`${C.wine}18`    },
  ARQUERO:  { icon:"🏃", color:C.blue,    bg:`${C.blue}18`    },
  MAGO:     { icon:"🧘", color:"#9B59B6", bg:"#9B59B618" },
};

const FV = {
  card:  { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{duration:0.35}} },
  modal: { hidden:{opacity:0,scale:0.97}, show:{opacity:1,scale:1,transition:{duration:0.18}} },
};

// ── Helpers ────────────────────────────────────────────────────
function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function validateEditForm(form) {
  const e = {};
  if (!form.username?.trim())              e.username = "Nombre requerido";
  else if (form.username.trim().length<3)  e.username = "Mín. 3 caracteres";
  if (!form.email?.trim())                 e.email = "Email requerido";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = "Email inválido";
  if (form.level!==undefined){ const v=Number(form.level); if(isNaN(v)||v<1||v>999) e.level="1–999"; }
  if (form.xp!==undefined){ const v=Number(form.xp); if(isNaN(v)||v<0) e.xp="≥ 0"; }
  if (form.streak!==undefined){ const v=Number(form.streak); if(isNaN(v)||v<0) e.streak="≥ 0"; }
  return e;
}

// ── CSS ────────────────────────────────────────────────────────
const CSS = `
  @keyframes au-spin { to { transform:rotate(360deg) } }
  @keyframes au-in   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @keyframes u-skel-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .u-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}55 50%,${C.card} 75%); background-size:400px 100%; animation:u-skel-shimmer 1.5s infinite linear; }
  .au-inp { outline:none; box-sizing:border-box; transition:border-color .2s,box-shadow .2s; }
  .au-inp:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .au-inp::placeholder { color:${C.muted}66; }
  .au-sel option { background:${C.panel}; color:${C.white}; }
  .au-row:hover { background:${C.orange}0A !important; }
  .au-row-sel { border-left:2px solid ${C.orange}77 !important; background:${C.orange}10 !important; }
`;

// ── Spinner ────────────────────────────────────────────────────
function Spin({ size=12, color=C.wine }) {
  return <div style={{width:size,height:size,border:`2px solid ${color}33`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"au-spin .8s linear infinite",flexShrink:0}}/>;
}

// ── Field ─────────────────────────────────────────────────────
function Field({ label, children, error }) {
  return (
    <div>
      {label && <label style={{...sans(10,600),color:C.muted,display:"block",marginBottom:6,letterSpacing:".04em"}}>{label}</label>}
      {children}
      {error && <div style={{...sans(10,500),color:C.red,marginTop:3,animation:"au-in .2s ease"}}>⚠ {error}</div>}
    </div>
  );
}

function Inp({ value, onChange, onBlur, placeholder, type="text", error, dirty, numStyle }) {
  return (
    <input className="au-inp" type={type} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder}
      style={{width:"100%",padding:"9px 12px",background:C.panel,color:C.white,
        border:`1px solid ${error?C.red:dirty?C.wine:C.navy}`,
        borderRadius:6,
        ...( numStyle ? mono(13,600) : sans(12,500) )}}/>
  );
}

// ══════════════════════════════════════════════════════════════
// VIEW MODAL
// ══════════════════════════════════════════════════════════════
function ViewModal({ user, onClose }) {
  const m = CLS[user.heroClass] || { icon:"👤", color:C.muted, bg:`${C.muted}18` };
  const stage = user.personajeEtapa || getStage(user.level || 1);
  const SC = { 1:C.green, 2:C.blue, 3:C.wine, 4:C.red, 5:C.gold };
  const sc = SC[stage.id] || C.muted;
  const xpTot = user.xpTotal || user.xp || 0;

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <motion.div variants={FV.modal} initial="hidden" animate="show"
        style={{width:"100%",maxWidth:420,...glass(m.color),padding:24,display:"flex",flexDirection:"column",gap:16,borderRadius:16}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:26,filter:`drop-shadow(0 0 10px ${m.color}88)`}}>{m.icon}</div>
            <div>
              <div style={{...mono(14,700),color:C.white}}>{user.username}</div>
              <div style={{...sans(11,400),color:C.muted,marginTop:2}}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${C.navy}`,padding:6,color:C.muted,cursor:"pointer",display:"flex"}}>
            <X size={13}/>
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{l:"NIVEL",v:`Lv.${user.level||1}`,c:C.gold},{l:"XP TOTAL",v:xpTot>=1000?`${(xpTot/1000).toFixed(1)}k`:xpTot.toLocaleString(),c:C.wine},{l:"RACHA",v:`${user.streak||0}d`,c:C.blue}].map((s,i)=>(
            <div key={i} style={{background:`${s.c}0F`,border:`1px solid ${s.c}22`,padding:"10px 0",textAlign:"center",borderRadius:14}}>
              <div style={{...mono(14,700),color:s.c}}>{s.v}</div>
              <div style={{...sans(9,600),color:C.muted,marginTop:3,letterSpacing:".06em"}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{background:`${sc}0C`,border:`1px solid ${sc}2A`,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{stage.icon}</span>
          <div style={{flex:1}}>
            <div style={{...sans(10,700),color:sc,letterSpacing:".05em"}}>ETAPA {stage.id}/5 · {stage.label}</div>
            <div style={{height:3,background:C.navy,marginTop:6,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(stage.id/5)*100}%`,background:`linear-gradient(90deg,${sc}66,${sc})`,borderRadius:2}}/>
            </div>
          </div>
        </div>

        <div>
          {[
            {l:"Clase",    v:user.heroClass,  dot:m.color},
            {l:"Rol",      v:(user.roleId||"user").toUpperCase()},
            {l:"Estado",   v:(user.status||"active").toUpperCase(), dot:user.status==="active"?C.green:C.red},
            {l:"Monedas",  v:`${(user.coins||0).toLocaleString()} 🪙`},
            {l:"Registro", v:user.createdAt?.slice(0,10)||"—"},
            {l:"Último login",v:user.lastLoginAt?.slice(0,10)||"—"},
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.navy}22`}}>
              <span style={{...sans(11,500),color:C.muted}}>{f.l}</span>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                {f.dot&&<div style={{width:6,height:6,borderRadius:"50%",background:f.dot}}/>}
                <span style={{...mono(11,600),color:C.white}}>{f.v}</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{...sans(11,700),background:C.wine,color:C.white,border:"none",padding:"10px 0",cursor:"pointer",width:"100%",letterSpacing:".04em",borderRadius:8}}>
          CERRAR
        </button>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EDIT MODAL
// ══════════════════════════════════════════════════════════════
function EditModal({ user, onClose, onSave, loading }) {
  const [form, setForm] = useState({...user});
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(new Set());

  const isDirty = k => dirty.has(k) || form[k] !== user[k];

  const vf = useCallback((k,v) => {
    const all = validateEditForm({...form,[k]:v});
    return {[k]:all[k]};
  },[form]);

  const set = (k,v) => {
    setForm(f=>({...f,[k]:v}));
    if(dirty.has(k)) setErrors(p=>({...p,...vf(k,v)}));
  };
  const touch = k => {
    setDirty(p=>new Set([...p,k]));
    setErrors(p=>({...p,...vf(k,form[k])}));
  };
  const save = () => {
    const all = validateEditForm(form);
    if(Object.keys(all).length){ setErrors(all); setDirty(new Set(Object.keys(all))); return; }
    onSave(form);
  };

  const changed = Object.keys(form).filter(k=>form[k]!==user[k]).length;

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <motion.div variants={FV.modal} initial="hidden" animate="show"
        style={{width:"100%",maxWidth:440,...glass(),padding:24,display:"flex",flexDirection:"column",gap:14,borderRadius:16}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{...mono(13,700),color:C.white}}>EDITAR USUARIO</div>
            {changed>0&&<div style={{...sans(10,600),color:C.wine,marginTop:2}}>{changed} campo{changed!==1?"s":""} modificado{changed!==1?"s":""}</div>}
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",padding:0}}><X size={14}/></button>
        </div>

        {[{k:"username",l:"NOMBRE"},{k:"email",l:"EMAIL"}].map(f=>(
          <Field key={f.k} label={<>{f.l}{isDirty(f.k)&&!errors[f.k]&&<span style={{...sans(8,700),color:C.wine,background:`${C.wine}18`,padding:"1px 6px",marginLeft:8,borderRadius:20}}>MOD.</span>}</>} error={errors[f.k]}>
            <Inp value={form[f.k]??""} onChange={e=>set(f.k,e.target.value)} onBlur={()=>touch(f.k)} error={errors[f.k]} dirty={isDirty(f.k)&&!errors[f.k]}/>
          </Field>
        ))}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{k:"heroClass",l:"CLASE",opts:["GUERRERO","ARQUERO","MAGO"]},{k:"roleId",l:"ROL",opts:["user","admin"]}].map(f=>(
            <Field key={f.k} label={<>{f.l}{isDirty(f.k)&&<span style={{color:C.wine,marginLeft:6,fontSize:10}}>●</span>}</>}>
              <select value={form[f.k]} onChange={e=>set(f.k,e.target.value)} className="au-sel"
                style={{width:"100%",padding:"9px 12px",background:C.panel,border:`1px solid ${isDirty(f.k)?C.wine:C.navy}`,color:C.white,...sans(12,500),cursor:"pointer",outline:"none",boxSizing:"border-box",borderRadius:6}}>
                {f.opts.map(o=><option key={o} value={o}>{o.toUpperCase()}</option>)}
              </select>
            </Field>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{k:"level",l:"NIVEL"},{k:"xp",l:"XP"},{k:"streak",l:"RACHA"}].map(f=>(
            <Field key={f.k} label={<>{f.l}{isDirty(f.k)&&<span style={{color:C.wine,marginLeft:4,fontSize:9}}>●</span>}</>} error={errors[f.k]}>
              <input type="number" min="0" className="au-inp"
                value={form[f.k]??0} onChange={e=>set(f.k,Number(e.target.value))} onBlur={()=>touch(f.k)}
                style={{width:"100%",padding:"8px",background:C.panel,border:`1px solid ${errors[f.k]?C.red:isDirty(f.k)?C.wine:C.navy}`,color:C.white,...mono(13,600),borderRadius:6}}/>
            </Field>
          ))}
        </div>

        <div style={{display:"flex",gap:10,marginTop:2}}>
          <button onClick={onClose} style={{flex:1,...sans(11,600),background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
          <button onClick={save} disabled={loading}
            style={{flex:2,...sans(11,700),background:loading?`${C.wine}55`:C.wine,color:C.white,border:"none",padding:10,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,borderRadius:8}}>
            {loading?<><Spin/> GUARDANDO…</>:<><Check size={13}/> GUARDAR{changed>0?` (${changed})`:""}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DELETE MODAL
// ══════════════════════════════════════════════════════════════
function DeleteModal({ user, onClose, onConfirm, loading }) {
  const [typed, setTyped] = useState("");
  const ok = typed === user.username;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <motion.div variants={FV.modal} initial="hidden" animate="show"
        style={{width:"100%",maxWidth:380,...glass(C.red),padding:24,display:"flex",flexDirection:"column",gap:14,borderRadius:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex"}}><AlertTriangle size={17} color={C.red}/></div>
          <div>
            <div style={{...mono(12,700),color:C.red}}>ELIMINAR USUARIO</div>
            <div style={{...sans(10,400),color:C.muted,marginTop:2}}>Esta acción no se puede deshacer</div>
          </div>
        </div>
        <div style={{background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:12}}>
          <div style={{...mono(13,700),color:C.red}}>{user.username}</div>
          <div style={{...sans(10,400),color:C.muted,marginTop:2}}>{user.email}</div>
        </div>
        <Field label={<>ESCRIBE <span style={{color:C.white}}>{user.username.toUpperCase()}</span> PARA CONFIRMAR</>}>
          <Inp value={typed} onChange={e=>setTyped(e.target.value)} placeholder={user.username} error={typed&&!ok}/>
        </Field>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,...sans(11,600),background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
          <button onClick={()=>onConfirm(user.uid)} disabled={!ok||loading}
            style={{flex:1,...sans(11,700),background:ok&&!loading?C.red:`${C.red}44`,color:ok&&!loading?C.white:C.muted,border:"none",padding:10,cursor:ok?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:8}}>
            {loading?<><Spin color={C.red}/> ELIMINANDO…</>:<><Trash2 size={13}/> ELIMINAR</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BULK CONFIRM MODAL
// ══════════════════════════════════════════════════════════════
function BulkConfirmModal({ action, count, onClose, onConfirm, loading }) {
  const [typed, setTyped] = useState("");
  const WORD = "CONFIRMAR";
  const ok = typed === WORD;
  const META = {
    delete:     { label:"Eliminar",   color:C.red,   icon:<Trash2 size={16}/>,     desc:`${count} usuario${count!==1?"s":""} eliminados permanentemente.` },
    activate:   { label:"Activar",    color:C.green, icon:<ShieldCheck size={16}/>,desc:`${count} usuario${count!==1?"s":""} pasarán a estado activo.` },
    deactivate: { label:"Desactivar", color:C.wine,  icon:<ShieldOff size={16}/>,  desc:`${count} usuario${count!==1?"s":""} pasarán a estado inactivo.` },
  }[action] || {};
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <motion.div variants={FV.modal} initial="hidden" animate="show"
        style={{width:"100%",maxWidth:400,...glass(META.color),padding:24,display:"flex",flexDirection:"column",gap:16,borderRadius:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:`${META.color}18`,border:`1px solid ${META.color}44`,padding:10,display:"flex",color:META.color}}>{META.icon}</div>
          <div>
            <div style={{...mono(11,700),color:META.color}}>OP. MASIVA · {META.label?.toUpperCase()}</div>
            <div style={{...sans(10,400),color:C.muted,marginTop:1}}>Afecta {count} usuario{count!==1?"s":""}</div>
          </div>
        </div>
        <div style={{background:`${META.color}0A`,border:`1px solid ${META.color}22`,padding:12,...sans(12,500),color:C.mutedL,lineHeight:1.5}}>
          {META.desc}
          {action==="delete"&&<div style={{...sans(11,700),color:META.color,marginTop:6}}>⚠ Irreversible.</div>}
        </div>
        <Field label={<>ESCRIBE <span style={{color:C.white}}>{WORD}</span> PARA CONTINUAR</>}>
          <Inp value={typed} onChange={e=>setTyped(e.target.value)} placeholder={WORD} error={typed&&!ok}/>
        </Field>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,...sans(11,600),background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
          <button onClick={onConfirm} disabled={!ok||loading}
            style={{flex:1,...sans(11,700),background:ok&&!loading?META.color:`${META.color}44`,color:ok&&!loading?C.white:C.muted,border:"none",padding:10,cursor:ok&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:8}}>
            {loading?<><Spin color={META.color}/> PROCESANDO…</>:<><Check size={13}/> {META.label?.toUpperCase()}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CREATE MODAL
// ══════════════════════════════════════════════════════════════
function CreateModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({username:"",email:"",heroClass:"GUERRERO",roleId:"user"});
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(new Set());

  const set = (k,v) => {
    setForm(f=>({...f,[k]:v}));
    if(dirty.has(k)){ const e=validateEditForm({...form,[k]:v}); setErrors(p=>({...p,[k]:e[k]})); }
  };
  const touch = k => {
    setDirty(p=>new Set([...p,k]));
    const e=validateEditForm(form); setErrors(p=>({...p,[k]:e[k]}));
  };
  const save = () => {
    const e={};
    if(!form.username.trim()) e.username="Requerido"; else if(form.username.trim().length<3) e.username="Mín. 3 caracteres";
    if(!form.email.trim()) e.email="Requerido"; else if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email="Email inválido";
    if(Object.keys(e).length){ setErrors(e); setDirty(new Set(Object.keys(e))); return; }
    onSave(form);
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <motion.div variants={FV.modal} initial="hidden" animate="show"
        style={{width:"100%",maxWidth:420,...glass(C.green),padding:24,display:"flex",flexDirection:"column",gap:14,borderRadius:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{...mono(13,700),color:C.white}}>NUEVO HÉROE</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",padding:0}}><X size={14}/></button>
        </div>
        {[{k:"username",l:"NOMBRE",ph:"NombreHéroe"},{k:"email",l:"EMAIL",ph:"heroe@mail.com"}].map(f=>(
          <Field key={f.k} label={f.l} error={errors[f.k]}>
            <Inp value={form[f.k]} onChange={e=>set(f.k,e.target.value)} onBlur={()=>touch(f.k)} placeholder={f.ph} error={errors[f.k]}/>
          </Field>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{k:"heroClass",l:"CLASE",opts:["GUERRERO","ARQUERO","MAGO"]},{k:"roleId",l:"ROL",opts:["user","admin"]}].map(f=>(
            <Field key={f.k} label={f.l}>
              <select value={form[f.k]} onChange={e=>set(f.k,e.target.value)} className="au-sel"
                style={{width:"100%",padding:"9px 12px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...sans(12,500),cursor:"pointer",outline:"none",boxSizing:"border-box",borderRadius:6}}>
                {f.opts.map(o=><option key={o} value={o}>{o.toUpperCase()}</option>)}
              </select>
            </Field>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:2}}>
          <button onClick={onClose} style={{flex:1,...sans(11,600),background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
          <button onClick={save} disabled={loading}
            style={{flex:2,...sans(11,700),background:loading?`${C.green}55`:C.green,color:C.white,border:"none",padding:10,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,borderRadius:8}}>
            {loading?<><Spin color={C.green}/> CREANDO…</>:<><Plus size={13}/> CREAR HÉROE</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COINS MODAL
// ══════════════════════════════════════════════════════════════
function CoinsModal({ user, onClose, onSave, loading }) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState("add");
  const final = mode==="add" ? Math.abs(amount) : -Math.abs(amount);
  const preview = Math.max(0,(user.coins??0)+final);

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <motion.div variants={FV.modal} initial="hidden" animate="show"
        style={{width:"100%",maxWidth:380,...glass(C.gold),padding:24,display:"flex",flexDirection:"column",gap:14,borderRadius:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🪙</span>
            <div style={{...mono(12,700),color:C.gold}}>MONEDAS</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex",padding:0}}><X size={14}/></button>
        </div>
        <div style={{background:`${C.gold}0F`,border:`1px solid ${C.gold}22`,padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{...sans(12,600),color:C.muted}}>{user.username}</span>
          <span style={{...mono(15,700),color:C.gold}}>{(user.coins??0).toLocaleString()} 🪙</span>
        </div>
        <div style={{display:"flex",border:`1px solid ${C.navy}`,overflow:"hidden"}}>
          {[["add","+ Añadir",C.green],["sub","− Deducir",C.red]].map(([m,l,cc])=>(
            <button key={m} onClick={()=>setMode(m)}
              style={{flex:1,...sans(11,700),padding:"9px",background:mode===m?`${cc}18`:"transparent",border:"none",borderRight:m==="add"?`1px solid ${C.navy}`:"none",color:mode===m?cc:C.muted,cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>
        <Field label="CANTIDAD">
          <input type="number" min="0" className="au-inp"
            value={amount} onChange={e=>setAmount(Number(e.target.value))}
            style={{width:"100%",padding:"9px 12px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...mono(13,600),borderRadius:6}}/>
        </Field>
        <Field label="MOTIVO (opcional)">
          <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Premio, ajuste…"/>
        </Field>
        {amount>0&&(
          <div style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}22`,padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{...sans(12,600),color:C.muted}}>Saldo resultante</span>
            <span style={{...mono(14,700),color:C.gold}}>{preview.toLocaleString()} 🪙</span>
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,...sans(11,600),background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
          <button onClick={()=>onSave(final,reason)} disabled={loading||amount<=0}
            style={{flex:1,...sans(11,700),background:loading||amount<=0?`${C.gold}33`:C.gold,color:loading||amount<=0?C.muted:"#0B0510",border:"none",padding:10,cursor:loading||amount<=0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:8}}>
            {loading?<><Spin color={C.gold}/> GUARDANDO…</>:<><Check size={13}/> APLICAR</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// USERS TABLE
// ══════════════════════════════════════════════════════════════
const COLS = "36px 2.4fr .8fr .9fr 1fr .65fr 108px";

function UsersTable({ users, selected, onToggle, onToggleAll, onView, onEdit, onCoins, onDelete }) {
  const allSel  = users.length>0 && users.every(u=>selected.has(u.uid));
  const someSel = !allSel && users.some(u=>selected.has(u.uid));

  return (
    <div style={{...glass(),overflow:"hidden",borderRadius:10}}>
      <div style={{display:"grid",gridTemplateColumns:COLS,padding:"11px 16px",background:`${C.navy}33`,borderBottom:`1px solid ${C.navy}44`,gap:8,alignItems:"center"}}>
        <input type="checkbox" checked={allSel} ref={el=>{if(el)el.indeterminate=someSel;}} onChange={onToggleAll}
          style={{cursor:"pointer",accentColor:C.wine,width:14,height:14,flexShrink:0}}/>
        {["HÉROE","CLASE","NIVEL","XP TOTAL","RACHA","ACCIONES"].map(h=>(
          <span key={h} style={{...sans(9,700),color:C.muted,letterSpacing:".08em"}}>{h}</span>
        ))}
      </div>

      {users.length===0 ? (
        <div style={{padding:40,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <Users size={28} color={C.navy}/>
          <span style={{...sans(13,500),color:C.muted}}>Sin resultados</span>
        </div>
      ) : users.map((u,i) => {
        const m = CLS[u.heroClass] || {icon:"👤",color:C.muted,bg:`${C.muted}18`};
        const isSel = selected.has(u.uid);
        const isActive = u.status==="active";
        const xpTot = u.xpTotal||u.xp||0;

        return (
          <motion.div key={u.uid}
            initial={{opacity:0,x:-8}} animate={{opacity:1,x:0,transition:{delay:i*0.025,duration:0.25}}}
            className={`au-row${isSel?" au-row-sel":""}`}
            style={{display:"grid",gridTemplateColumns:COLS,padding:"11px 16px",alignItems:"center",gap:8,
              borderBottom:`1px solid ${C.navy}22`,borderLeft:`2px solid ${isSel?C.wine+"66":"transparent"}`}}>

            <input type="checkbox" checked={isSel} onChange={()=>onToggle(u.uid)}
              style={{cursor:"pointer",accentColor:C.wine,width:14,height:14,flexShrink:0}}/>

            {/* Hero */}
            <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
              <div style={{width:32,height:32,background:m.bg,border:`1px solid ${m.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,opacity:isActive?1:0.55,filter:isActive?"none":"grayscale(0.6)"}}>
                {m.icon}
              </div>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{...mono(12,600),color:isActive?C.white:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.username}</span>
                  {!isActive&&<span style={{...sans(7,700),color:C.red,background:`${C.red}18`,padding:"1px 5px",flexShrink:0,letterSpacing:".04em",borderRadius:20}}>OFF</span>}
                </div>
                <div style={{...sans(10,400),color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
              </div>
            </div>

            {/* Clase */}
            <span style={{...sans(10,700),color:m.color,background:m.bg,padding:"3px 8px",display:"inline-block",whiteSpace:"nowrap",borderRadius:20}}>
              {u.heroClass?.slice(0,4)}
            </span>

            {/* Nivel */}
            <div>
              <div style={{...mono(13,700),color:C.gold,marginBottom:4}}>Lv.{u.level||1}</div>
              <div style={{height:2,background:C.navy,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,((u.xp||0)/(u.xpNext||100))*100)}%`,background:`linear-gradient(90deg,${C.gold}55,${C.gold})`}}/>
              </div>
            </div>

            {/* XP Total */}
            <div style={{...mono(11,600),color:C.wine}}>
              {xpTot>=1000?`${(xpTot/1000).toFixed(1)}k`:xpTot.toLocaleString()}
            </div>

            {/* Racha */}
            <div style={{display:"flex",alignItems:"center",gap:3}}>
              <span>🔥</span>
              <span style={{...mono(11,600),color:(u.streak||0)>0?C.gold:C.muted}}>{u.streak||0}</span>
            </div>

            {/* Acciones */}
            <div style={{display:"flex",gap:3}}>
              {[
                {Icon:Eye,    fn:()=>onView(u),  col:C.blue},
                {Icon:Edit2,  fn:()=>onEdit(u),  col:C.wine},
                {Icon:Coins,  fn:()=>onCoins(u), col:C.gold},
                {Icon:Trash2, fn:()=>onDelete(u),col:C.red},
              ].map(({Icon,fn,col},j)=>(
                <motion.button key={j} whileHover={{scale:1.12,y:-1}} onClick={fn}
                  style={{background:"transparent",border:`1px solid ${col}22`,padding:5,color:col,display:"flex",cursor:"pointer"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${col}18`;e.currentTarget.style.borderColor=col;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${col}22`;}}>
                  <Icon size={11}/>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BULK BAR
// ══════════════════════════════════════════════════════════════
function BulkBar({ count, onDelete, onActivate, onDeactivate, onClear, loading }) {
  return (
    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}
      style={{...glass(C.wine),padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
        <div style={{background:`${C.wine}18`,border:`1px solid ${C.wine}44`,padding:"4px 10px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{...mono(10,700),color:C.wine}}>{count}</span>
        </div>
        <span style={{...sans(12,600),color:C.white}}>seleccionado{count!==1?"s":""}</span>
        {loading&&<Spin/>}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[
          {l:"Activar",    fn:onActivate,   col:C.green, Icon:ShieldCheck},
          {l:"Desactivar", fn:onDeactivate, col:C.wine,  Icon:ShieldOff},
          {l:"Eliminar",   fn:onDelete,     col:C.red,   Icon:Trash2},
        ].map(({l,fn,col,Icon})=>(
          <button key={l} onClick={fn} disabled={loading}
            style={{...sans(10,700),color:col,background:`${col}12`,border:`1px solid ${col}44`,padding:"6px 12px",display:"flex",alignItems:"center",gap:5,cursor:"pointer",opacity:loading?.5:1,borderRadius:20}}>
            <Icon size={11}/> {l}
          </button>
        ))}
        <button onClick={onClear} disabled={loading}
          style={{...sans(10,600),color:C.muted,background:"transparent",border:`1px solid ${C.navy}`,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}>
          <X size={11}/>
        </button>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// COUNTDOWN
// ══════════════════════════════════════════════════════════════
function Countdown({ remainingMs }) {
  const [ms, setMs] = useState(remainingMs);
  useEffect(()=>{
    if(ms<=0)return;
    const id=setInterval(()=>setMs(p=>Math.max(0,p-1000)),1000);
    return ()=>clearInterval(id);
  },[]);
  if(ms<=0)return <span style={{color:C.red,...mono(10,700)}}>EXPIRADO</span>;
  const s=Math.floor(ms/1000);
  const d=Math.floor(s/86400), h=Math.floor((s%86400)/3600), m=Math.floor((s%3600)/60), sec=s%60;
  const fmt=n=>String(n).padStart(2,"0");
  const label=d>0?`${d}d ${fmt(h)}h ${fmt(m)}m`:`${fmt(h)}:${fmt(m)}:${fmt(sec)}`;
  const pct=ms/(3*24*60*60*1000);
  const col=pct>0.5?C.green:pct>0.2?C.gold:C.red;
  return <span style={{color:col,...mono(10,700),display:"flex",alignItems:"center",gap:4}}><Clock size={10}/>{label}</span>;
}

// ══════════════════════════════════════════════════════════════
// DELETED ACCOUNTS SECTION
// ══════════════════════════════════════════════════════════════
function DeletedAccountsSection({ token, onRestored }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [opBusy,  setOpBusy]  = useState(null);
  const [opError, setOpError] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try{ const r=await getDeletedUsers(token); setUsers(r.users||[]); }
    catch(e){ setOpError(e.message); }
    finally{ setLoading(false); }
  },[token]);

  useEffect(()=>{load();},[load]);

  const handleRestore = async u=>{
    setOpBusy(u.uid); setOpError(null);
    try{ await restoreUser(token,u.uid); await load(); onRestored?.(); }
    catch(e){ setOpError(e.message); }
    finally{ setOpBusy(null); }
  };

  const handlePurge = async u=>{
    setOpBusy(u.uid); setOpError(null);
    try{ await deleteAdminUser(token,u.uid); await load(); setConfirmDel(null); }
    catch(e){ setOpError(e.message); }
    finally{ setOpBusy(null); }
  };

  if(!loading&&users.length===0) return null;

  return (
    <motion.div variants={FV.card} initial="hidden" animate="show" style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
      {/* Purge confirm */}
      <AnimatePresence>
        {confirmDel&&(
          <div onClick={e=>e.target===e.currentTarget&&setConfirmDel(null)}
            style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <motion.div variants={FV.modal} initial="hidden" animate="show"
              style={{width:"100%",maxWidth:360,...glass(C.red),padding:24,display:"flex",flexDirection:"column",gap:16,borderRadius:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <AlertTriangle size={18} color={C.red}/>
                <div style={{...mono(12,700),color:C.white}}>ELIMINAR PERMANENTEMENTE</div>
              </div>
              <div style={{...sans(12,500),color:C.mutedL,lineHeight:1.6}}>
                ¿Eliminar <strong style={{color:C.white}}>{confirmDel.username}</strong> de forma permanente?
                <br/><strong style={{color:C.red}}>Irreversible.</strong>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setConfirmDel(null)} style={{flex:1,...sans(11,600),background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,padding:10,cursor:"pointer",borderRadius:8}}>CANCELAR</button>
                <button onClick={()=>handlePurge(confirmDel)} disabled={opBusy===confirmDel.uid}
                  style={{flex:1,...sans(11,700),background:opBusy===confirmDel.uid?`${C.red}44`:C.red,color:C.white,border:"none",padding:10,cursor:opBusy===confirmDel.uid?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,borderRadius:8}}>
                  {opBusy===confirmDel.uid?<><Spin color={C.red}/> ELIMINANDO…</>:<><Trash2 size={12}/> PURGAR</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:3,height:20,background:C.red,borderRadius:2}}/>
          <div>
            <div style={{...mono(12,700),color:C.red}}>CUENTAS ELIMINADAS</div>
            <div style={{...sans(10,400),color:C.muted,marginTop:2}}>Recuperables 3 días · {users.length} cuenta{users.length!==1?"s":""}</div>
          </div>
        </div>
        <button onClick={load} style={{...sans(10,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"6px 12px",display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
          <RefreshCw size={10}/> Actualizar
        </button>
      </div>

      {opError&&(
        <div style={{...sans(11,500),color:C.red,background:`${C.red}0D`,border:`1px solid ${C.red}33`,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>⚠ {opError}</span>
          <button onClick={()=>setOpError(null)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",display:"flex"}}><X size={11}/></button>
        </div>
      )}

      {loading?(
        <div style={{padding:24,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:10,...sans(12,500),color:C.muted}}>
          <Spin color={C.red}/> Cargando…
        </div>
      ):(
        <div style={{...glass(C.red),overflow:"hidden",borderRadius:10}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 140px",padding:"10px 16px",background:`${C.navy}22`,borderBottom:`1px solid ${C.red}22`,gap:8,alignItems:"center"}}>
            {["USUARIO","CLASE","TIEMPO RESTANTE","ACCIONES"].map(h=>(
              <span key={h} style={{...sans(9,700),color:C.muted,letterSpacing:".08em"}}>{h}</span>
            ))}
          </div>
          {users.map((u,i)=>{
            const m=CLS[u.heroClass]||{icon:"👤",color:C.muted,bg:`${C.muted}18`};
            const busy=opBusy===u.uid;
            return (
              <div key={u.uid} className="au-row"
                style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 140px",padding:"10px 16px",alignItems:"center",gap:8,borderBottom:`1px solid ${C.navy}22`,opacity:busy?.5:1}}>
                <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                  <div style={{fontSize:14,filter:"grayscale(1)",opacity:.5}}>{m.icon}</div>
                  <div style={{minWidth:0}}>
                    <div style={{...mono(12,600),color:C.mutedL,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.username}</div>
                    <div style={{...sans(10,400),color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                  </div>
                </div>
                <span style={{...sans(10,700),color:`${m.color}88`,background:`${m.color}0E`,padding:"2px 8px",display:"inline-block",borderRadius:20}}>{u.heroClass?.slice(0,4)}</span>
                <div style={{...sans(11,600)}}>
                  {u.isExpired
                    ? <span style={{...sans(10,700),color:C.red,background:`${C.red}14`,padding:"2px 8px",borderRadius:20}}>EXPIRADO</span>
                    : <Countdown remainingMs={u.remainingMs}/>}
                </div>
                <div style={{display:"flex",gap:5}}>
                  {!u.isExpired&&(
                    <button onClick={()=>handleRestore(u)} disabled={busy}
                      style={{...sans(10,700),color:C.green,background:`${C.green}12`,border:`1px solid ${C.green}44`,padding:"5px 10px",display:"flex",alignItems:"center",gap:4,cursor:busy?"not-allowed":"pointer",opacity:busy?.5:1}}>
                      {busy?<Spin color={C.green} size={9}/>:<RotateCcw size={10}/>} Restaurar
                    </button>
                  )}
                  <button onClick={()=>setConfirmDel(u)} disabled={busy}
                    style={{...sans(10,700),color:C.red,background:`${C.red}12`,border:`1px solid ${C.red}33`,padding:"5px 10px",display:"flex",alignItems:"center",gap:4,cursor:busy?"not-allowed":"pointer",opacity:busy?.5:1}}>
                    <Trash2 size={10}/> Purgar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════
function SkeletonUsuarios() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="u-skel" style={{borderRadius:14,height:90,animationDelay:`${i*.08}s`}}/>
        ))}
      </div>
      <div className="u-skel" style={{borderRadius:10,height:50}}/>
      <div className="u-skel" style={{borderRadius:10,height:260}}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminUsuarios() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [modal,        setModal]        = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterClass,  setFilterClass]  = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [bulkModal,    setBulkModal]    = useState(null);
  const [opError,      setOpError]      = useState(null);
  const [adminToken,   setAdminToken]   = useState(null);
  const [deletedKey,   setDeletedKey]   = useState(0);

  useEffect(()=>{ auth.currentUser?.getIdToken().then(setAdminToken).catch(()=>{}); },[]);

  const loadUsers = useCallback(async()=>{
    try{
      const u=auth.currentUser;
      if(!u)return;
      const token=await u.getIdToken();
      setAdminToken(token);
      const r=await getAdminUsers(token);
      setUsers(r.users||[]);
    }catch(err){
      setOpError("No se pudieron cargar los usuarios.");
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{loadUsers();},[loadUsers]);

  if (loading) return <><style>{CSS}</style><SkeletonUsuarios/></>;

  const filtered = useMemo(()=>{
    const q=search.trim();
    const re=q?new RegExp(escapeRegex(q),"i"):null;
    return users.filter(u=>{
      const ms=!re||re.test(u.username)||re.test(u.email);
      const mc=filterClass==="all"||u.heroClass===filterClass;
      const mst=filterStatus==="all"||u.status===filterStatus;
      return ms&&mc&&mst;
    });
  },[users,search,filterClass,filterStatus]);

  const stats = useMemo(()=>({
    total:  users.length,
    active: users.filter(u=>u.status==="active").length,
    admins: users.filter(u=>u.roleId==="admin").length,
  }),[users]);

  useEffect(()=>{setSelectedIds(new Set());},[search,filterClass,filterStatus]);

  const handleRefresh = async()=>{setRefreshing(true);await loadUsers();setRefreshing(false);};

  const withToken = async fn=>{
    const token=await auth.currentUser.getIdToken();
    setAdminToken(token);
    return fn(token);
  };

  const handleEdit = async form=>{
    setModalLoading(true); setOpError(null);
    try{
      const r=await withToken(t=>updateAdminUser(t,modal.user.uid,form));
      if(r?.ok===false) throw new Error(r.message||"Error al guardar");
      await loadUsers(); setModal(null);
    }catch(err){ setOpError(err.message||"Error al editar."); }
    finally{ setModalLoading(false); }
  };

  const handleDelete = async uid=>{
    setModalLoading(true); setOpError(null);
    try{
      const r=await withToken(t=>deleteAdminUser(t,uid));
      if(r?.ok===false) throw new Error(r.message);
      await loadUsers(); setModal(null);
    }catch(err){ setOpError(err.message||"Error al eliminar."); }
    finally{ setModalLoading(false); }
  };

  const handleCreate = async form=>{
    setModalLoading(true); setOpError(null);
    try{
      const r=await withToken(t=>createAdminUser(t,form));
      if(r?.ok===false) throw new Error(r.message);
      await loadUsers(); setModal(null);
    }catch(err){ setOpError(err.message||"Error al crear."); }
    finally{ setModalLoading(false); }
  };

  const handleCoins = async(amount,reason)=>{
    setModalLoading(true); setOpError(null);
    try{
      const r=await withToken(t=>addCoinsAdmin(t,modal.user.uid,amount,reason));
      if(r?.ok===false) throw new Error(r.message);
      await loadUsers(); setModal(null);
    }catch(err){ setOpError(err.message||"Error al actualizar monedas."); }
    finally{ setModalLoading(false); }
  };

  const toggleSelect = uid=>setSelectedIds(prev=>{const n=new Set(prev);n.has(uid)?n.delete(uid):n.add(uid);return n;});

  const toggleAll = ()=>{
    const allSel=filtered.every(u=>selectedIds.has(u.uid));
    if(allSel){setSelectedIds(prev=>{const n=new Set(prev);filtered.forEach(u=>n.delete(u.uid));return n;});}
    else{setSelectedIds(prev=>new Set([...prev,...filtered.map(u=>u.uid)]));}
  };

  const executeBulk = async()=>{
    const uids=[...selectedIds]; const action=bulkModal?.action;
    setBulkLoading(true); setOpError(null);
    try{
      let r;
      const token=await auth.currentUser.getIdToken();
      if(action==="delete") r=await bulkDeleteUsers(token,uids);
      else if(action==="activate") r=await bulkUpdateStatus(token,uids,"active");
      else if(action==="deactivate") r=await bulkUpdateStatus(token,uids,"inactive");
      if(r?.ok===false) throw new Error(r.message);
      setSelectedIds(new Set()); setBulkModal(null); await loadUsers();
    }catch(err){ setOpError(err.message||"Error en operación masiva."); }
    finally{ setBulkLoading(false); }
  };

  const selCount=selectedIds.size;
  const selStyle={padding:"8px 12px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...sans(11,500),cursor:"pointer",outline:"none",borderRadius:6};

  return (
    <>
      <style>{CSS}</style>

      {/* Modals */}
      <AnimatePresence>
        {modal?.type==="view"   && <ViewModal   key="view"   user={modal.user} onClose={()=>setModal(null)}/>}
        {modal?.type==="edit"   && <EditModal   key="edit"   user={modal.user} onClose={()=>setModal(null)} onSave={handleEdit}   loading={modalLoading}/>}
        {modal?.type==="delete" && <DeleteModal key="del"    user={modal.user} onClose={()=>setModal(null)} onConfirm={handleDelete} loading={modalLoading}/>}
        {modal?.type==="create" && <CreateModal key="create"                   onClose={()=>setModal(null)} onSave={handleCreate} loading={modalLoading}/>}
        {modal?.type==="coins"  && <CoinsModal  key="coins"  user={modal.user} onClose={()=>setModal(null)} onSave={handleCoins}  loading={modalLoading}/>}
        {bulkModal && <BulkConfirmModal key="bulk" action={bulkModal.action} count={selCount} onClose={()=>{if(!bulkLoading)setBulkModal(null);}} onConfirm={executeBulk} loading={bulkLoading}/>}
      </AnimatePresence>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* Header */}
        <motion.div variants={FV.card} initial="hidden" animate="show">
          <div style={{...mono(17,700),color:C.white,marginBottom:4}}>HÉROES</div>
          <div style={{...sans(12,400),color:C.muted}}>Gestión de usuarios · {stats.total} registrados</div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {opError&&(
            <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:`${C.red}0D`,border:`1px solid ${C.red}44`,padding:"10px 14px",...sans(12,500),color:C.red}}>
              <span>⚠ {opError}</span>
              <button onClick={()=>setOpError(null)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",display:"flex"}}><X size={13}/></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {l:"Total héroes",  v:stats.total,  c:C.blue,  icon:"👥"},
            {l:"Activos",       v:stats.active, c:C.green, icon:"⚡"},
            {l:"Administradores",v:stats.admins,c:C.wine,  icon:"🛡️"},
          ].map((s,i)=>(
            <motion.div key={i} variants={FV.card} initial="hidden" animate="show"
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
              style={{...glass(s.c),padding:"18px 20px",position:"relative",overflow:"hidden",borderRadius:14}}>
              <div style={{position:"absolute",top:12,right:14,fontSize:22,opacity:.15}}>{s.icon}</div>
              <div style={{...mono(26,700),color:s.c,marginBottom:4}}>{s.v}</div>
              <div style={{...sans(11,500),color:C.muted}}>{s.l}</div>
              <div style={{height:2,background:`${s.c}22`,marginTop:12,overflow:"hidden"}}>
                <motion.div initial={{width:0}} animate={{width:`${stats.total>0?(s.v/stats.total*100):0}%`}} transition={{delay:.3,duration:.8}}
                  style={{height:"100%",background:`linear-gradient(90deg,${s.c}66,${s.c})`}}/>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <motion.div variants={FV.card} initial="hidden" animate="show" style={{...glass(),padding:14,display:"flex",flexDirection:"column",gap:10,borderRadius:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 180px"}}>
              <Search size={12} color={C.muted} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
              <input className="au-inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar héroe…"
                style={{width:"100%",padding:"8px 32px 8px 32px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...sans(12,500),boxSizing:"border-box",borderRadius:6}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:C.muted,cursor:"pointer",display:"flex"}}><X size={11}/></button>}
            </div>

            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="au-sel" style={selStyle}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="au-sel" style={selStyle}>
              <option value="all">Todas clases</option>
              <option value="GUERRERO">Guerrero</option>
              <option value="ARQUERO">Arquero</option>
              <option value="MAGO">Mago</option>
            </select>

            <button onClick={handleRefresh} style={{...sans(11,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
              <RefreshCw size={11} style={{animation:refreshing?"au-spin .8s linear infinite":"none"}}/> Actualizar
            </button>

            <button onClick={()=>setModal({type:"create"})}
              style={{...sans(11,700),color:C.white,background:C.wine,border:"none",padding:"8px 16px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",boxShadow:`0 0 12px ${C.wine}44`}}>
              <Plus size={12}/> Nuevo héroe
            </button>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{...sans(11,400),color:C.muted}}>
              {filtered.length} resultado{filtered.length!==1?"s":""}
              {selCount>0&&<span style={{...sans(11,600),color:C.wine,marginLeft:8}}>· {selCount} seleccionado{selCount!==1?"s":""}</span>}
            </div>
            {selCount>0&&(
              <button onClick={()=>setSelectedIds(new Set())} style={{...sans(10,600),color:C.muted,background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                <X size={10}/> Limpiar
              </button>
            )}
          </div>
        </motion.div>

        {/* Bulk bar */}
        <AnimatePresence>
          {selCount>0&&(
            <BulkBar count={selCount} loading={bulkLoading}
              onDelete={()=>setBulkModal({action:"delete"})}
              onActivate={()=>setBulkModal({action:"activate"})}
              onDeactivate={()=>setBulkModal({action:"deactivate"})}
              onClear={()=>setSelectedIds(new Set())}/>
          )}
        </AnimatePresence>

        {/* Table */}
        <UsersTable users={filtered} selected={selectedIds}
          onToggle={toggleSelect} onToggleAll={toggleAll}
          onView={u=>setModal({type:"view",user:u})}
          onEdit={u=>setModal({type:"edit",user:u})}
          onCoins={u=>setModal({type:"coins",user:u})}
          onDelete={u=>setModal({type:"delete",user:u})}/>

        {/* Deleted accounts */}
        {adminToken&&(
          <DeletedAccountsSection key={deletedKey} token={adminToken}
            onRestored={()=>{setDeletedKey(k=>k+1);loadUsers();}}/>
        )}
      </div>
    </>
  );
}
