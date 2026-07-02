// src/pages/admin/AdminObjetos.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de objetos/items para ForgeVenture Admin.
//  FIXES:
//  - Eliminado import duplicado de lucide-react (bug crítico)
//  - Añadida constante CAT_KEYS (faltaba, causaba ReferenceError)
//  - Spinner con borderRadius:"50%" correcto
//  - bulkDelete y bulkToggle con feedback de error en UI
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Package, Zap, Star,
  BarChart2, Shield, Flame, Gift, Sparkles,
  Lock, Unlock, Clock, Hash,
} from "lucide-react";
import { auth } from "../../firebase.js";
import { getObjetos, createObjeto, updateObjeto, deleteObjeto, seedFunctionalItems } from "../../services/api";
import { useToast } from "../../components/shared/ui.jsx";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";

// Colors not in shared palette
const POCION_COLOR  = "#C47BA3";
const MITICO_COLOR  = "#D94F7B";

const CSS = `
  @keyframes o-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes o-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes o-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes o-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes o-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes o-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes o-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes o-glow    { 0%,100%{filter:drop-shadow(0 0 6px currentColor)} 50%{filter:drop-shadow(0 0 16px currentColor)} }
  @keyframes o-skelPulse { 0%,100%{opacity:.5} 50%{opacity:.2} }

  .o-row    { transition:background .15s; }
  .o-row:hover { background:${C.navyL}18 !important; }
  .o-btn    { transition:all .18s; cursor:pointer; }
  .o-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .o-icon-btn { transition:all .2s; cursor:pointer; }
  .o-input  { transition:border-color .2s,box-shadow .2s; outline:none; }
  .o-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22,0 0 14px ${C.orange}18; }
  .o-input::placeholder { color:${C.navy}; }
  .o-sort   { cursor:pointer; user-select:none; transition:color .2s; }
  .o-sort:hover { color:${C.orange} !important; }
  .o-card   { transition:transform .22s,box-shadow .22s; cursor:default; }
  .o-cat-tab { transition:all .2s; cursor:pointer; }
  .o-rar-btn { transition:all .22s; cursor:pointer; }
  .o-rar-btn:hover { transform:scale(1.04); }
  .o-skel   { background:${C.navy}66; animation:o-skelPulse 1.4s ease infinite; border-radius:10px; }
`;


// ── Secciones principales ────────────────────────────────────
const SECCIONES = {
  Boosts:       { color:C.orange,      Icon:Zap,       bg:`${C.orange}14`,      desc:"Pociones y consumibles que dan bonus temporales", categorias:["Poción","Consumible"] },
  Cosmetics:    { color:C.purple,      Icon:Sparkles,  bg:`${C.purple}14`,      desc:"Skins, efectos visuales y personalización",       categorias:["Cosmético"] },
  Equipment:    { color:C.red,         Icon:Shield,    bg:`${C.red}14`,         desc:"Armas, armaduras y equipamiento permanente",      categorias:["Equipo"] },
  Collectibles: { color:C.gold,        Icon:Gift,      bg:`${C.gold}14`,        desc:"Items únicos de colección y eventos",              categorias:["Coleccionable"] },
  Special:      { color:MITICO_COLOR,  Icon:Flame,     bg:`${MITICO_COLOR}14`,  desc:"Items especiales, míticos y de admin",            categorias:["Especial"] },
};
const SECCIONES_KEYS = Object.keys(SECCIONES);

// ── Categorías ───────────────────────────────────────────────
const CATEGORIAS = {
  Poción:       { color:POCION_COLOR, icon:"🧪", bg:`${POCION_COLOR}14`, desc:"Recuperan HP, XP o atributos temporales" },
  Equipo:       { color:C.orange,     icon:"⚔️", bg:`${C.orange}14`,     desc:"Armas, armaduras y accesorios del héroe" },
  Cosmético:    { color:C.purple,     icon:"👑", bg:`${C.purple}14`,     desc:"Skins, efectos y personalización visual" },
  Consumible:   { color:C.teal,       icon:"⚡", bg:`${C.teal}14`,       desc:"Boosts temporales de rendimiento" },
  Coleccionable:{ color:C.gold,       icon:"💎", bg:`${C.gold}14`,       desc:"Piezas únicas de colección" },
  Especial:     { color:C.red,        icon:"🌟", bg:`${C.red}14`,        desc:"Items de eventos y recompensas únicas" },
};
// FIX: CAT_KEYS faltaba — causaba ReferenceError en FormModal
const CAT_KEYS = Object.keys(CATEGORIAS);

// ── Rareza ───────────────────────────────────────────────────
const RAREZA = {
  Común:       { color:C.muted,       glow:C.muted,       tier:1, stars:1 },
  "Poco común":{ color:C.green,       glow:C.green,       tier:2, stars:2 },
  Raro:        { color:C.blue,        glow:C.blue,        tier:3, stars:3 },
  Épico:       { color:C.purple,      glow:C.purple,      tier:4, stars:4 },
  Legendario:  { color:C.gold,        glow:C.gold,        tier:5, stars:5 },
  Mítico:      { color:MITICO_COLOR,  glow:MITICO_COLOR,  tier:6, stars:6 },
};
const RAREZA_KEYS = Object.keys(RAREZA);

// ── Efectos ──────────────────────────────────────────────────
const EFECTOS_TIPOS = [
  { id:"xp_bonus",     icon:"⚡", label:"Bonus XP",         unit:"%",      desc:"Aumenta XP ganado" },
  { id:"xp_instant",   icon:"💫", label:"XP Instantáneo",   unit:"XP",     desc:"Otorga XP al usar" },
  { id:"hp_recover",   icon:"❤️", label:"Recuperar HP",      unit:"%",      desc:"Restaura HP del héroe" },
  { id:"streak_shield",icon:"🔥", label:"Escudo de Racha",   unit:"días",   desc:"Protege racha X días" },
  { id:"xp_mult",      icon:"✨", label:"Multiplicador XP",  unit:"x",      desc:"Multiplica XP por X" },
  { id:"level_boost",  icon:"⬆️", label:"Boost de Nivel",    unit:"niveles",desc:"Sube X niveles" },
  { id:"unlock_class", icon:"🎭", label:"Desbloquea Clase",  unit:"clase",  desc:"Desbloquea clase especial" },
  { id:"cosmetic_skin",icon:"👗", label:"Skin de Personaje", unit:"skin",   desc:"Cambia apariencia" },
  { id:"title_grant",  icon:"👑", label:"Otorga Título",     unit:"título", desc:"Concede título especial" },
  { id:"cooldown_red", icon:"⏱️", label:"Reduce Cooldown",   unit:"%",      desc:"Reduce tiempo de espera" },
];

const OBTENER_TIPOS = ["Tienda","Misión","Logro","Evento","Racha","Nivel","Drop aleatorio","Admin"];

const METADATA_SLOTS = [
  { v:"none",         l:"Sin slot específico" },
  { v:"avatar_frame", l:"Marco de avatar"     },
  { v:"chat_skin",    l:"Skin de chat"        },
  { v:"title",        l:"Título de héroe"     },
  { v:"boost",        l:"Boost activo"        },
  { v:"theme",        l:"Tema visual"         },
];

const EMOJIS_OBJ = ["🧪","⚔️","🛡️","👑","💎","🌟","⚡","💫","❤️","🔮","🗡️","🏹","🎯","🎒","🎁","🏅","🔑","💍","🌙","☄️","🦋","🐉","🌈","⚗️","📿"];

const EMPTY_EFECTO = { tipo:"xp_bonus", label:"Bonus XP", icon:"⚡", valor:10, unidad:"%" };
const EMPTY_FORM = {
  nombre:"", categoria:"Poción", rareza:"Común", imagen:"🧪", precio:100,
  stock:"", limitado:false, activo:true, descripcion:"", descripcionCorta:"", efectos:[],
  duracion:"", stackeable:false, obtenido:"Tienda",
  usosMax:null, usosActuales:0, equipable:false, consumible:true,
  coinsBonus:0, metadata:{ slot:"none" },
};
const PAGE_SIZE_OPTIONS = [6, 12, 24];

// ── UI atoms ─────────────────────────────────────────────────
function MiniBar({ val, color, height=5 }) {
  return (
    <div style={{ height, background:C.panel, border:`1px solid ${color}22`, overflow:"hidden", width:"100%" }}>
      <div style={{ height:"100%", width:`${Math.min(val,100)}%`, background:color, boxShadow:`0 0 5px ${color}66`, transition:"width .6s" }} />
    </div>
  );
}

function CatBadge({ cat }) {
  const m = CATEGORIAS[cat] || { color:C.muted, icon:"?", bg:C.panel };
  return (
    <span style={{ ...raj(10,700), color:m.color, background:m.bg, border:`1px solid ${m.color}33`, padding:"2px 10px", borderRadius:20, display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
      {m.icon} {cat}
    </span>
  );
}

function RarezaBadge({ rareza }) {
  const r = RAREZA[rareza] || { color:C.muted, tier:1 };
  const stars = "★".repeat(r.tier);
  return (
    <span style={{ ...raj(10,700), color:r.color, background:`${r.color}14`, border:`1px solid ${r.color}33`, padding:"2px 10px", borderRadius:20, whiteSpace:"nowrap", textShadow:r.tier>=4?`0 0 8px ${r.color}`:"none" }}>
      {rareza} {stars}
    </span>
  );
}

function Spinner({ color=C.orange }) {
  return (
    <div style={{ width:13, height:13, border:`2px solid ${C.muted}`, borderTop:`2px solid ${color}`, borderRadius:"50%", animation:"o-spin .8s linear infinite" }} />
  );
}

function SortIcon({ active, dir }) {
  if (!active) return <ChevronDown size={11} color={C.navy} />;
  return dir === "asc" ? <ChevronUp size={11} color={C.orange} /> : <ChevronDown size={11} color={C.orange} />;
}

function StarRating({ rareza }) {
  const r = RAREZA[rareza] || { tier:1, color:C.muted };
  return (
    <div style={{ display:"flex", gap:2 }}>
      {Array.from({ length:6 }, (_, i) => (
        <span key={i} style={{ fontSize:10, color:i<r.tier?r.color:C.navy, textShadow:i<r.tier?`0 0 6px ${r.color}`:"none", transition:"color .3s" }}>★</span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — VER OBJETO
// ══════════════════════════════════════════════════════════════
function ViewModal({ obj, onClose, onEdit }) {
  const cat = CATEGORIAS[obj.categoria] || {};
  const rar = RAREZA[obj.rareza] || {};
  const c   = rar.color || C.orange;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.7)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:560, background:"rgba(20,26,42,0.95)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${c}44`, borderRadius:16, boxShadow:`0 0 60px ${c}14, 0 24px 64px rgba(0,0,0,.7)`, animation:"o-modalIn .25s ease both", overflow:"hidden" }}>
        <div style={{ height:4, background:`linear-gradient(90deg,transparent,${c},transparent)` }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", borderBottom:`1px solid ${C.navy}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:60, height:60, background:`${c}18`, border:`1px solid ${c}44`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, boxShadow:`inset 0 0 20px ${c}14` }}>
              {obj.imagen}
            </div>
            <div>
              <div style={{ ...orb(14,900), color:C.white, marginBottom:4 }}>{obj.nombre}</div>
              {obj.descripcionCorta && <div style={{ ...raj(12,400), color:C.muted, marginBottom:4, lineHeight:1.4 }}>{obj.descripcionCorta}</div>}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                <CatBadge cat={obj.categoria} />
                <RarezaBadge rareza={obj.rareza} />
              </div>
              <StarRating rareza={obj.rareza} />
            </div>
          </div>
          <button onClick={onClose} className="o-icon-btn" style={{ background:"transparent", border:`1px solid ${C.navy}`, padding:7, color:C.muted, display:"flex" }}><X size={15} /></button>
        </div>

        <div style={{ padding:22, display:"flex", flexDirection:"column", gap:16, maxHeight:"70vh", overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[
              { l:"PRECIO", v:obj.precio===0?"GRATIS":`${obj.precio.toLocaleString()}`, c:obj.precio===0?C.green:C.gold },
              { l:"USOS",   v:(obj.usos||0).toLocaleString(), c:C.blue },
              { l:"STOCK",  v:obj.stock?obj.stock.toLocaleString():"∞", c:obj.limitado?C.red:C.muted },
              { l:"ESTADO", v:obj.activo?"ACTIVO":"INACTIVO", c:obj.activo?C.green:C.red },
            ].map((s, i) => (
              <div key={i} style={{ background:C.panel, border:`1px solid ${s.c}22`, borderRadius:8, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ ...orb(13,900), color:s.c, marginBottom:3 }}>{s.v}</div>
                <div style={{ ...px(5), color:C.muted }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ background:C.panel, border:`1px solid ${C.navy}`, padding:"14px 16px" }}>
            <p style={{ ...raj(13,400), color:C.white, lineHeight:1.7, marginBottom:10 }}>{obj.descripcion}</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <span style={{ ...raj(11,600), color:C.muted }}>📦 Obtención: <span style={{ color:cat.color||C.orange }}>{obj.obtenido}</span></span>
              {obj.duracion && <span style={{ ...raj(11,600), color:C.muted }}>⏱️ Duración: <span style={{ color:C.blue }}>{obj.duracion}min</span></span>}
              {obj.stackeable && <span style={{ ...raj(11,600), color:C.teal }}>📚 Stackeable</span>}
              {obj.limitado && <span style={{ ...raj(11,600), color:C.red }}>🔒 Edición Limitada</span>}
            </div>
          </div>

          {obj.efectos && obj.efectos.length > 0 && (
            <div>
              <div style={{ ...px(6), color:C.muted, marginBottom:10, letterSpacing:".05em" }}>✨ EFECTOS DEL OBJETO</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {obj.efectos.map((ef, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:C.panel, border:`1px solid ${c}22`, padding:"12px 16px" }}>
                    <span style={{ fontSize:22, filter:`drop-shadow(0 0 6px ${c}88)` }}>{ef.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ ...raj(13,700), color:C.white }}>{ef.label}</div>
                      <div style={{ ...raj(11,500), color:C.muted }}>{EFECTOS_TIPOS.find(e => e.id === ef.tipo)?.desc}</div>
                    </div>
                    <div style={{ background:`${c}18`, border:`1px solid ${c}44`, padding:"6px 14px", ...orb(14,900), color:c }}>
                      {ef.tipo === "xp_mult" ? `×${ef.valor}` : `+${ef.valor} ${ef.unidad}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ ...raj(12,600), color:C.muted }}>Popularidad ({obj.usos||0} usos)</span>
              {obj.stock && <span style={{ ...raj(12,600), color:C.red }}>{obj.stock} en stock</span>}
            </div>
            <MiniBar val={Math.min(((obj.usos||0)/1000)*100,100)} color={c} height={7} />
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.panel, border:`1px solid ${obj.activo?C.green:C.red}33`, padding:"10px 14px" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:obj.activo?C.green:C.red, animation:obj.activo?"o-pulse 1.5s infinite":"none" }} />
              <span style={{ ...raj(13,700), color:obj.activo?C.green:C.red }}>{obj.activo?"ACTIVO":"INACTIVO"}</span>
            </div>
            <button onClick={() => { onClose(); onEdit(obj); }} className="o-btn"
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, ...px(7), color:C.bg, background:C.orange, border:"none", padding:"10px", cursor:"pointer", boxShadow:`0 3px 14px ${C.orange}44` }}>
              <Edit2 size={13} /> EDITAR
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
function FormModal({ obj, onClose, onSave }) {
  const isEdit = !!obj;
  const [form,    setForm]    = useState(obj ? { ...obj, efectos:[...obj.efectos] } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [shake,   setShake]   = useState(false);
  const [tab,     setTab]     = useState("info");
  const [dirty,   setDirty]   = useState(new Set());

  const touch = k => setDirty(d => { const n=new Set(d);n.add(k);return n; });
  const set = (k, v) => setForm(f => { const next={...f,[k]:v}; if(dirty.has(k))setErrors(validate(next)); return next; });
  const blur = k => { touch(k); setErrors(validate(form)); };
  const bc      = isEdit ? C.orange : C.green;
  const rarMeta = RAREZA[form.rareza]   || {};
  const catMeta = CATEGORIAS[form.categoria] || {};

  const validate = (f=form) => {
    const e = {};
    if (!f.nombre.trim())      e.nombre      = "Requerido";
    if (!f.descripcion.trim()) e.descripcion = "Requerido";
    return e;
  };

  const save = async () => {
    ["nombre","descripcion"].forEach(touch);
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(() => setShake(false), 500); return; }
    setLoading(true);
    try {
      const objetoData = {
        nombre:           form.nombre,
        descripcion:      form.descripcion,
        descripcionCorta: form.descripcionCorta || "",
        categoria:        form.categoria,
        rareza:           form.rareza,
        precio:           Number(form.precio) || 0,
        coinsBonus:       Number(form.coinsBonus) || 0,
        imagen:           form.imagen,
        activo:           form.activo,
        efectos:          form.efectos,
        obtenido:         form.obtenido,
        duracion:         form.duracion ? Number(form.duracion) : null,
        limitado:         form.limitado || false,
        stock:            form.limitado && form.stock !== "" ? Number(form.stock) : null,
        usosMax:          form.usosMax ? Number(form.usosMax) : null,
        usosActuales:     Number(form.usosActuales) || 0,
        stackeable:       form.stackeable,
        equipable:        form.equipable,
        consumible:       form.consumible,
        metadata:         form.metadata || { slot:"none" },
        creadoEn:         obj?.creadoEn || new Date().toISOString(),
      };
      await onSave(objetoData);
      onClose();
    } catch (err) {
      console.error("Error guardando:", err);
    } finally {
      setLoading(false);
    }
  };

  const addEfecto    = () => setForm(f => ({ ...f, efectos:[...f.efectos, { ...EMPTY_EFECTO }] }));
  const removeEfecto = i  => setForm(f => ({ ...f, efectos:f.efectos.filter((_, idx) => idx !== i) }));
  const setEf = (i, k, v) => setForm(f => ({ ...f, efectos:f.efectos.map((e, idx) => idx === i ? { ...e, [k]:v } : e) }));
  const changeEfTipo = (i, tipoId) => {
    const et = EFECTOS_TIPOS.find(e => e.id === tipoId) || EFECTOS_TIPOS[0];
    setEf(i, "tipo",   tipoId);
    setEf(i, "label",  et.label);
    setEf(i, "icon",   et.icon);
    setEf(i, "unidad", et.unit);
  };

  const inpSt = (err) => ({ width:"100%", padding:"11px 14px", background:C.panel, border:`1px solid ${err?C.red:C.navy}`, borderRadius:6, color:C.white, ...raj(14,500) });
  const lbl   = { display:"block", ...px(6), color:C.muted, marginBottom:7, letterSpacing:".06em" };
  const TABS  = [
    { id:"info",       l:"INFO" },
    { id:"rareza",     l:"RAREZA & PRECIO" },
    { id:"propiedades",l:"PROPIEDADES" },
    { id:"efectos",    l:`EFECTOS (${form.efectos.length})` },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.7)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:700, background:"rgba(20,26,42,0.95)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${bc}44`, borderRadius:16, boxShadow:`0 0 60px ${bc}0A, 0 24px 64px rgba(0,0,0,.7)`, animation:"o-modalIn .25s ease both", overflow:"hidden", display:"flex", flexDirection:"column", maxHeight:"93vh" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${bc},transparent)`, flexShrink:0 }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 22px", borderBottom:`1px solid ${C.navy}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {isEdit ? <Edit2 size={15} color={C.orange} /> : <Plus size={15} color={C.green} />}
            <span style={{ ...orb(12,700), color:C.white }}>{isEdit ? "EDITAR OBJETO" : "NUEVO OBJETO"}</span>
            {isEdit && <span style={{ ...raj(12,500), color:C.muted }}>— {obj.nombre}</span>}
          </div>
          <button onClick={onClose} className="o-icon-btn" style={{ background:"transparent", border:`1px solid ${C.navy}`, padding:7, color:C.muted, display:"flex" }}><X size={15} /></button>
        </div>

        <div style={{ display:"flex", borderBottom:`1px solid ${C.navy}`, flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="o-btn"
              style={{ flex:1, padding:"11px 0", ...raj(12, tab===t.id?700:500), color:tab===t.id?bc:C.muted, background:"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?bc:"transparent"}`, cursor:"pointer" }}>
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:22 }} className={shake ? "o-shake" : ""}>

          {/* ── TAB INFO ── */}
          {tab === "info" && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              <div style={{ display:"grid", gridTemplateColumns:"130px 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>🎨 ICONO</label>
                  <div style={{ width:"100%", aspectRatio:"1", background:`${rarMeta.color||C.muted}14`, border:`2px solid ${rarMeta.color||C.navy}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, marginBottom:8, boxShadow:`inset 0 0 20px ${rarMeta.color||C.muted}14` }}>
                    {form.imagen}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:3 }}>
                    {EMOJIS_OBJ.map(e => (
                      <button key={e} type="button" onClick={() => set("imagen", e)} className="o-btn"
                        style={{ fontSize:15, background:form.imagen===e?`${bc}22`:"transparent", border:`1px solid ${form.imagen===e?bc:C.navy}`, padding:"4px", cursor:"pointer" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={lbl}>📝 NOMBRE</label>
                    <input className="o-input" value={form.nombre} onChange={e => set("nombre", e.target.value)} onBlur={() => blur("nombre")} placeholder="Ej: Poción de XP Mayor" style={inpSt(errors.nombre&&dirty.has("nombre"))} />
                    {errors.nombre && dirty.has("nombre") && <p style={{ ...raj(11), color:C.red, marginTop:4 }}>⚠ {errors.nombre}</p>}
                  </div>
                  <div>
                    <label style={lbl}>💬 DESCRIPCIÓN CORTA <span style={{ color:C.muted, fontWeight:400 }}>({(form.descripcionCorta||"").length}/60)</span></label>
                    <input className="o-input" maxLength={60} value={form.descripcionCorta||""} onChange={e => set("descripcionCorta", e.target.value)} placeholder="Subtítulo breve que aparece en la card..." style={inpSt(false)} />
                  </div>
                  <div>
                    <label style={lbl}>📋 DESCRIPCIÓN</label>
                    <textarea className="o-input" value={form.descripcion} onChange={e => set("descripcion", e.target.value)} onBlur={() => blur("descripcion")} rows={4} placeholder="Describe el efecto y uso del objeto..." style={{ ...inpSt(errors.descripcion&&dirty.has("descripcion")), resize:"vertical" }} />
                    {errors.descripcion && dirty.has("descripcion") && <p style={{ ...raj(11), color:C.red, marginTop:4 }}>⚠ {errors.descripcion}</p>}
                  </div>
                </div>
              </div>

              {/* categoría — usa CAT_KEYS (ahora definido) */}
              <div>
                <label style={lbl}>🗂️ CATEGORÍA</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {CAT_KEYS.map(cat => {
                    const m = CATEGORIAS[cat]; const on = form.categoria === cat;
                    return (
                      <button key={cat} type="button" onClick={() => set("categoria", cat)} className="o-btn"
                        style={{ background:on?m.bg:"transparent", border:`2px solid ${on?m.color:C.navy}`, padding:"12px 10px", cursor:"pointer", textAlign:"center", boxShadow:on?`0 0 14px ${m.color}33`:"none", transition:"all .22s" }}>
                        <div style={{ fontSize:22, marginBottom:5, filter:on?`drop-shadow(0 0 6px ${m.color})`:"none" }}>{m.icon}</div>
                        <div style={{ ...px(6), color:on?m.color:C.muted, marginBottom:3 }}>{cat.toUpperCase()}</div>
                        <div style={{ ...raj(9,400), color:C.muted, lineHeight:1.3 }}>{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>📦 CÓMO SE OBTIENE</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {OBTENER_TIPOS.map(o => {
                      const on = form.obtenido === o;
                      return (
                        <button key={o} type="button" onClick={() => set("obtenido", o)} className="o-btn"
                          style={{ display:"flex", alignItems:"center", gap:8, ...raj(12,on?700:500), color:on?catMeta.color||C.orange:C.muted, background:on?`${catMeta.color||C.orange}14`:"transparent", border:`1px solid ${on?catMeta.color||C.orange:C.navy}`, padding:"9px 12px", cursor:"pointer", textAlign:"left", transition:"all .18s" }}>
                          <div style={{ width:7, height:7, borderRadius:"50%", background:on?catMeta.color||C.orange:C.navy, flexShrink:0 }} />{o}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={lbl}>● ESTADO</label>
                    {[{ v:true, l:"ACTIVO", c:C.green }, { v:false, l:"INACTIVO", c:C.red }].map(o => (
                      <button key={String(o.v)} type="button" onClick={() => set("activo", o.v)} className="o-btn"
                        style={{ width:"100%", marginBottom:8, ...raj(12,form.activo===o.v?700:500), color:form.activo===o.v?o.c:C.muted, background:form.activo===o.v?`${o.c}18`:"transparent", border:`1px solid ${form.activo===o.v?o.c:C.navy}`, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all .18s" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:form.activo===o.v?o.c:C.navy }} />{o.l}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => set("stackeable", !form.stackeable)} className="o-btn"
                    style={{ flex:1, display:"flex", alignItems:"center", gap:8, ...raj(12,700), color:form.stackeable?C.teal:C.muted, background:form.stackeable?`${C.teal}14`:"transparent", border:`1px solid ${form.stackeable?C.teal:C.navy}`, padding:"10px 12px", cursor:"pointer", transition:"all .18s" }}>
                    <Hash size={13} /> STACKEABLE
                  </button>
                  <button type="button" onClick={() => set("limitado", !form.limitado)} className="o-btn"
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:8, ...raj(12,700), color:form.limitado?C.red:C.muted, background:form.limitado?`${C.red}14`:"transparent", border:`1px solid ${form.limitado?C.red:C.navy}`, padding:"10px 12px", cursor:"pointer", transition:"all .18s" }}>
                    <Lock size={13} /> EDICIÓN LIMITADA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB RAREZA & PRECIO ── */}
          {tab === "rareza" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <label style={lbl}>💎 RAREZA DEL OBJETO</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {RAREZA_KEYS.map(rar => {
                    const r = RAREZA[rar]; const on = form.rareza === rar;
                    const stars = "★".repeat(r.tier);
                    return (
                      <button key={rar} type="button" onClick={() => set("rareza", rar)} className="o-rar-btn"
                        style={{ background:on?`${r.color}18`:"transparent", border:`2px solid ${on?r.color:C.navy}`, padding:"16px 12px", cursor:"pointer", textAlign:"center", boxShadow:on?`0 0 20px ${r.color}44,inset 0 0 20px ${r.color}0A`:"none", transition:"all .22s" }}>
                        <div style={{ ...raj(18,900), color:r.color, marginBottom:6, textShadow:on?`0 0 12px ${r.color}`:"none", animation:on&&r.tier>=5?"o-glow 2s ease-in-out infinite":"none" }}>
                          {stars}
                        </div>
                        <div style={{ ...px(7), color:on?r.color:C.muted, marginBottom:4 }}>{rar.toUpperCase()}</div>
                        <div style={{ ...raj(10,400), color:C.muted }}>Tier {r.tier}</div>
                      </button>
                    );
                  })}
                </div>
                {form.rareza && (
                  <div style={{ marginTop:14, background:C.panel, border:`1px solid ${RAREZA[form.rareza]?.color||C.navy}33`, padding:"14px 18px", display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ fontSize:36, filter:`drop-shadow(0 0 12px ${RAREZA[form.rareza]?.color})` }}>{form.imagen}</div>
                    <div>
                      <div style={{ ...orb(13,900), color:RAREZA[form.rareza]?.color, marginBottom:4 }}>{form.nombre||"Nombre del objeto"}</div>
                      <StarRating rareza={form.rareza} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>💰 PRECIO (coins)</label>
                  <input className="o-input" type="number" min={0} value={form.precio} onChange={e => set("precio", e.target.value)} placeholder="0 = gratis" style={inpSt(false)} />
                  <p style={{ ...raj(10,400), color:C.muted, marginTop:4 }}>0 = objeto gratuito</p>
                </div>
                <div>
                  <label style={lbl}>🪙 RECOMPENSA (coins al usar)</label>
                  <input className="o-input" type="number" min={0} value={form.coinsBonus||0} onChange={e => set("coinsBonus", e.target.value)} placeholder="0" style={inpSt(false)} />
                  <p style={{ ...raj(10,400), color:C.muted, marginTop:4 }}>Coins que otorga al consumir</p>
                </div>
                <div>
                  <label style={lbl}>📦 STOCK</label>
                  <input className="o-input" type="number" min={1} value={form.stock||""} onChange={e => set("stock", e.target.value)} placeholder="∞ sin límite" style={inpSt(false)} />
                  <p style={{ ...raj(10,400), color:C.muted, marginTop:4 }}>Vacío = sin límite</p>
                </div>
                <div>
                  <label style={lbl}>⏱️ DURACIÓN (min)</label>
                  <input className="o-input" type="number" min={1} value={form.duracion||""} onChange={e => set("duracion", e.target.value)} placeholder="∞ permanente" style={inpSt(false)} />
                  <p style={{ ...raj(10,400), color:C.muted, marginTop:4 }}>Vacío = permanente</p>
                </div>
              </div>

              <div style={{ background:C.panel, border:`1px solid ${RAREZA[form.rareza]?.color||C.navy}33`, padding:"16px 18px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { l:"PRECIO",   v:Number(form.precio)===0?"GRATIS":`${Number(form.precio).toLocaleString()} 💰`, c:Number(form.precio)===0?C.green:C.gold },
                  { l:"STOCK",    v:form.stock?`${Number(form.stock)} unidades`:"Ilimitado", c:form.limitado?C.red:C.muted },
                  { l:"DURACIÓN", v:form.duracion?`${form.duracion}min`:"Permanente", c:form.duracion?C.blue:C.teal },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ ...raj(14,700), color:s.c, marginBottom:3 }}>{s.v}</div>
                    <div style={{ ...px(5), color:C.muted }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB PROPIEDADES ── */}
          {tab === "propiedades" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <label style={lbl}>🎯 TIPO DE OBJETO</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                  {[
                    { key:"consumible", label:"CONSUMIBLE",  desc:"Se usa y desaparece",         icon:"⚡", color:C.teal   },
                    { key:"equipable",  label:"EQUIPABLE",   desc:"Se equipa permanentemente",   icon:"⚔️", color:C.orange },
                  ].map(({ key, label, desc, icon, color }) => (
                    <button key={key} type="button" onClick={() => set(key, !form[key])} className="o-btn"
                      style={{ display:"flex", alignItems:"center", gap:12, ...raj(13,form[key]?700:500), color:form[key]?color:C.muted, background:form[key]?`${color}14`:"transparent", border:`2px solid ${form[key]?color:C.navy}`, padding:"16px 14px", cursor:"pointer", textAlign:"left", transition:"all .22s" }}>
                      <div style={{ fontSize:24, filter:form[key]?`drop-shadow(0 0 8px ${color})`:"none" }}>{icon}</div>
                      <div>
                        <div style={{ marginBottom:2 }}>{label}</div>
                        <div style={{ ...raj(10,400), color:C.muted }}>{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>🔢 USOS MÁXIMOS</label>
                  <input className="o-input" type="number" min={1} value={form.usosMax||""} onChange={e => set("usosMax", e.target.value)} placeholder="∞ sin límite" style={inpSt(false)} />
                  <p style={{ ...raj(10,400), color:C.muted, marginTop:4 }}>Vacío = usos ilimitados</p>
                </div>
                <div>
                  <label style={lbl}>📊 USOS ACTUALES</label>
                  <input className="o-input" type="number" min={0} value={form.usosActuales||0} onChange={e => set("usosActuales", e.target.value)} placeholder="0" style={inpSt(false)} />
                  <p style={{ ...raj(10,400), color:C.muted, marginTop:4 }}>Cuántos usos lleva</p>
                </div>
              </div>

              <div>
                <label style={lbl}>🎯 SLOT DE EQUIPAMIENTO</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {METADATA_SLOTS.map(s => {
                    const on = (form.metadata?.slot||"none") === s.v;
                    return (
                      <button key={s.v} type="button" onClick={() => set("metadata", { ...form.metadata, slot:s.v })} className="o-btn"
                        style={{ background:on?`${C.teal}18`:"transparent", border:`2px solid ${on?C.teal:C.navy}`, borderRadius:8, padding:"10px 8px", cursor:"pointer", textAlign:"center", ...raj(11,on?700:500), color:on?C.teal:C.muted, transition:"all .22s" }}>
                        {s.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={lbl}>📚 PROPIEDADES ADICIONALES</label>
                <div style={{ display:"flex", gap:10 }}>
                  <button type="button" onClick={() => set("stackeable", !form.stackeable)} className="o-btn"
                    style={{ flex:1, display:"flex", alignItems:"center", gap:8, ...raj(12,700), color:form.stackeable?C.teal:C.muted, background:form.stackeable?`${C.teal}14`:"transparent", border:`1px solid ${form.stackeable?C.teal:C.navy}`, padding:"12px 14px", cursor:"pointer", transition:"all .18s" }}>
                    <Hash size={13} /> STACKEABLE
                  </button>
                  <button type="button" onClick={() => set("limitado", !form.limitado)} className="o-btn"
                    style={{ flex:1, display:"flex", alignItems:"center", gap:8, ...raj(12,700), color:form.limitado?C.red:C.muted, background:form.limitado?`${C.red}14`:"transparent", border:`1px solid ${form.limitado?C.red:C.navy}`, padding:"12px 14px", cursor:"pointer", transition:"all .18s" }}>
                    <Lock size={13} /> EDICIÓN LIMITADA
                  </button>
                </div>
              </div>

              <div style={{ background:C.panel, border:`1px solid ${rarMeta.color||C.navy}33`, padding:"16px 18px" }}>
                <div style={{ ...px(6), color:C.muted, marginBottom:12, letterSpacing:".05em" }}>📋 RESUMEN DE PROPIEDADES</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                  {[
                    { ic:"⚡", k:"consumible", lbl:"Consumible", c:C.teal   },
                    { ic:"⚔️", k:"equipable",  lbl:"Equipable",  c:C.orange },
                    { ic:"📚", k:"stackeable", lbl:"Stackeable", c:C.teal   },
                    { ic:"🔒", k:"limitado",   lbl:"Limitado",   c:C.red    },
                  ].map(({ ic, k, lbl: l, c }) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:form[k]?c:C.navy }}>{ic}</span>
                      <span style={{ ...raj(12,500), color:C.white }}>{l}: <span style={{ color:form[k]?c:C.navy }}>{form[k]?"Sí":"No"}</span></span>
                    </div>
                  ))}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color:C.blue }}>🔢</span>
                    <span style={{ ...raj(12,500), color:C.white }}>Usos: <span style={{ color:C.blue }}>{form.usosActuales||0}/{form.usosMax||"∞"}</span></span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color:form.activo?C.green:C.red }}>●</span>
                    <span style={{ ...raj(12,500), color:C.white }}>Estado: <span style={{ color:form.activo?C.green:C.red }}>{form.activo?"Activo":"Inactivo"}</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB EFECTOS ── */}
          {tab === "efectos" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <p style={{ ...raj(13,400), color:C.muted, lineHeight:1.6 }}>
                Define qué hace el objeto cuando el héroe lo usa o lo equipa. Puedes añadir múltiples efectos.
              </p>

              {form.efectos.map((ef, i) => (
                <div key={i} style={{ background:C.panel, border:`1px solid ${rarMeta.color||C.navy}22`, padding:"14px 16px", position:"relative" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:12, alignItems:"end" }}>
                    <div>
                      <label style={{ ...lbl, marginBottom:6 }}>TIPO DE EFECTO</label>
                      <select className="o-input" value={ef.tipo} onChange={e => changeEfTipo(i, e.target.value)}
                        style={{ width:"100%", padding:"9px 12px", background:C.card, border:`1px solid ${C.navy}`, color:C.white, ...raj(13,500), appearance:"none", cursor:"pointer" }}>
                        {EFECTOS_TIPOS.map(et => <option key={et.id} value={et.id}>{et.icon} {et.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...lbl, marginBottom:6 }}>VALOR ({ef.unidad})</label>
                      <input className="o-input" type="number" min={0} step={ef.tipo==="xp_mult"?0.1:1}
                        value={ef.valor} onChange={e => setEf(i, "valor", Number(e.target.value))}
                        style={{ width:"100%", padding:"9px 12px", background:C.card, border:`1px solid ${C.navy}`, color:C.white, ...raj(14,600) }} />
                    </div>
                    <button type="button" onClick={() => removeEfecto(i)} className="o-icon-btn"
                      style={{ background:"transparent", border:`1px solid ${C.red}33`, padding:"9px", color:C.red, display:"flex", alignItems:"center", alignSelf:"flex-end" }}
                      onMouseEnter={e => { e.currentTarget.style.background=`${C.red}18`; e.currentTarget.style.borderColor=C.red; }}
                      onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=`${C.red}33`; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:C.card, border:`1px solid ${rarMeta.color||C.navy}22` }}>
                    <span style={{ fontSize:20, filter:`drop-shadow(0 0 6px ${rarMeta.color||C.orange})` }}>{ef.icon}</span>
                    <div style={{ flex:1 }}>
                      <span style={{ ...raj(12,700), color:C.white }}>{ef.label}</span>
                      <span style={{ ...raj(11,500), color:C.muted, marginLeft:8 }}>{EFECTOS_TIPOS.find(e => e.id===ef.tipo)?.desc}</span>
                    </div>
                    <span style={{ ...orb(13,900), color:rarMeta.color||C.orange }}>
                      {ef.tipo==="xp_mult" ? `×${ef.valor}` : `+${ef.valor} ${ef.unidad}`}
                    </span>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addEfecto} className="o-btn"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, ...raj(13,700), color:rarMeta.color||C.orange, background:`${rarMeta.color||C.orange}0D`, border:`2px dashed ${rarMeta.color||C.orange}44`, padding:"14px", cursor:"pointer", transition:"all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background=`${rarMeta.color||C.orange}18`; e.currentTarget.style.borderStyle="solid"; }}
                onMouseLeave={e => { e.currentTarget.style.background=`${rarMeta.color||C.orange}0D`; e.currentTarget.style.borderStyle="dashed"; }}>
                <Plus size={16} /> AÑADIR EFECTO
              </button>

              <div style={{ background:C.panel, border:`1px solid ${C.navy}`, padding:"14px 16px" }}>
                <div style={{ ...px(6), color:C.muted, marginBottom:10, letterSpacing:".05em" }}>📖 REFERENCIA DE EFECTOS</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {EFECTOS_TIPOS.map(et => (
                    <div key={et.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:C.card, border:`1px solid ${C.navy}33` }}>
                      <span style={{ fontSize:16 }}>{et.icon}</span>
                      <div>
                        <div style={{ ...raj(11,700), color:C.white }}>{et.label}</div>
                        <div style={{ ...raj(9,400), color:C.muted }}>Unidad: {et.unit} · {et.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10, padding:"15px 22px", borderTop:`1px solid ${C.navy}`, flexShrink:0 }}>
          <button onClick={onClose} className="o-btn" style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, borderRadius:8, padding:"12px 20px", cursor:"pointer" }}>CANCELAR</button>
          <button onClick={save} disabled={loading} className="o-btn"
            style={{ flex:1, ...px(8), color:loading?C.muted:C.bg, background:loading?`${bc}55`:bc, border:"none", borderRadius:8, padding:"12px", cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 20px ${bc}44`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {loading ? <><Spinner color={bc} /> GUARDANDO...</> : <><Check size={14} /> {isEdit?"GUARDAR CAMBIOS":"CREAR OBJETO"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — ELIMINAR
// ══════════════════════════════════════════════════════════════
function DeleteModal({ obj, onClose, onConfirm }) {
  const [typed,    setTyped]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [delError, setDelError] = useState("");
  const match = typed === obj.nombre;
  const c     = RAREZA[obj.rareza]?.color || C.orange;

  const confirm = async () => {
    if (!match) return;
    setLoading(true);
    try { await onConfirm(obj.id); onClose(); }
    catch(e) { setDelError(e.message||"Error al eliminar"); setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.7)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:420, background:"rgba(20,26,42,0.95)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${C.red}44`, borderRadius:16, boxShadow:`0 0 60px ${C.red}0E, 0 24px 64px rgba(0,0,0,.7)`, animation:"o-modalIn .25s ease both", overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${C.red},transparent)` }} />
        <div style={{ padding:"22px 24px 26px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ background:`${C.red}18`, border:`1px solid ${C.red}44`, padding:10, display:"flex" }}><AlertTriangle size={22} color={C.red} /></div>
            <div>
              <div style={{ ...orb(13,900), color:C.red, marginBottom:3 }}>ELIMINAR OBJETO</div>
              <div style={{ ...raj(12,500), color:C.muted }}>Esta acción no se puede deshacer</div>
            </div>
          </div>
          <div style={{ background:`${C.red}0A`, border:`1px solid ${C.red}22`, padding:"12px 16px", marginBottom:12, display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:40, height:40, background:`${c}18`, border:`1px solid ${c}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{obj.imagen}</div>
            <div>
              <div style={{ ...raj(14,700), color:C.red }}>{obj.nombre}</div>
              <div style={{ ...raj(12,400), color:C.muted }}>{obj.categoria} · {obj.rareza} · {obj.usos||0} usos</div>
            </div>
          </div>
          {(obj.usos||0) > 0 && (
            <div style={{ background:"#FF9F1C14", border:"1px solid #FF9F1C55", padding:"10px 14px", borderRadius:4, display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 }}>
              <AlertTriangle size={14} color="#FF9F1C" style={{ flexShrink:0, marginTop:2 }}/>
              <div style={{ ...raj(12,500), color:"#FF9F1C", lineHeight:1.5 }}>
                ⚠️ Este objeto ha sido usado <strong>{(obj.usos||0).toLocaleString()} veces</strong>. Al eliminarlo quedará huérfano en los inventarios de usuarios.
              </div>
            </div>
          )}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", ...px(6), color:C.muted, marginBottom:8, letterSpacing:".06em" }}>ESCRIBE <span style={{ color:C.red }}>{obj.nombre}</span> PARA CONFIRMAR</label>
            <input className="o-input" value={typed} onChange={e => setTyped(e.target.value)} placeholder={obj.nombre}
              style={{ width:"100%", padding:"12px 14px", background:C.panel, border:`1px solid ${match?C.green:C.navy}`, color:C.white, ...raj(14,600) }} />
          </div>
          {delError&&<div style={{ ...raj(11,600), color:C.red, marginBottom:10, display:"flex", gap:6, alignItems:"center" }}><AlertTriangle size={12}/>{delError}</div>}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} className="o-btn" style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, borderRadius:8, padding:"12px 18px", cursor:"pointer" }}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="o-btn"
              style={{ flex:1, ...px(7), color:(match&&!loading)?C.white:C.muted, background:(match&&!loading)?C.red:`${C.red}22`, border:`1px solid ${C.red}55`, borderRadius:8, padding:"12px", cursor:match?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}>
              {loading ? <><Spinner color={C.red} /> ELIMINANDO...</> : <><Trash2 size={13} /> ELIMINAR</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — BULK DELETE (I27)
// ══════════════════════════════════════════════════════════════
function BulkDeleteModal({ items, onClose, onConfirm }) {
  const [typed,   setTyped]   = useState("");
  const [loading, setLoading] = useState(false);
  const CONFIRM_WORD = "ELIMINAR";
  const match = typed === CONFIRM_WORD;

  const confirm = async () => {
    if (!match) return;
    setLoading(true);
    try { await onConfirm(); onClose(); }
    catch { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:210, background:"rgba(0,0,0,.7)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:460, background:"rgba(20,26,42,0.95)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${C.red}44`, borderRadius:16, boxShadow:`0 0 60px ${C.red}0E, 0 24px 64px rgba(0,0,0,.7)`, animation:"o-modalIn .25s ease both", overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${C.red},transparent)` }} />
        <div style={{ padding:"22px 24px 26px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ background:`${C.red}18`, border:`1px solid ${C.red}44`, borderRadius:8, padding:10, display:"flex" }}><AlertTriangle size={22} color={C.red} /></div>
            <div>
              <div style={{ ...orb(13,900), color:C.red, marginBottom:3 }}>ELIMINACIÓN MASIVA</div>
              <div style={{ ...raj(12,500), color:C.muted }}>Se eliminarán {items.length} objeto{items.length!==1?"s":""}</div>
            </div>
          </div>

          <div style={{ background:`${C.red}08`, border:`1px solid ${C.red}22`, borderRadius:8, padding:"12px 16px", marginBottom:16, maxHeight:130, overflowY:"auto" }}>
            {items.map((o, i) => (
              <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 0", borderBottom:i<items.length-1?`1px solid ${C.navy}33`:"none" }}>
                <span style={{ fontSize:16 }}>{o.imagen}</span>
                <span style={{ ...raj(12,600), color:C.white }}>{o.nombre}</span>
                <span style={{ ...raj(10,500), color:C.muted, marginLeft:"auto" }}>{o.rareza}</span>
              </div>
            ))}
          </div>

          <div style={{ background:`${C.red}0A`, border:`1px solid ${C.red}22`, borderRadius:6, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"flex-start" }}>
            <AlertTriangle size={13} color={C.red} style={{ flexShrink:0, marginTop:2 }}/>
            <span style={{ ...raj(12,500), color:C.red, lineHeight:1.5 }}>Esta acción es permanente. Los objetos eliminados quedarán huérfanos en inventarios de usuarios activos.</span>
          </div>

          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", ...px(6), color:C.muted, marginBottom:8, letterSpacing:".06em" }}>
              ESCRIBE <span style={{ color:C.red }}>{CONFIRM_WORD}</span> PARA CONFIRMAR
            </label>
            <input className="o-input" value={typed} onChange={e => setTyped(e.target.value)} placeholder={CONFIRM_WORD}
              style={{ width:"100%", padding:"12px 14px", background:C.panel, border:`1px solid ${match?C.red:C.navy}`, borderRadius:6, color:C.white, ...raj(14,700), letterSpacing:".08em" }} />
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} className="o-btn" style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, borderRadius:8, padding:"12px 18px", cursor:"pointer" }}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="o-btn"
              style={{ flex:1, ...px(7), color:(match&&!loading)?C.white:C.muted, background:(match&&!loading)?C.red:`${C.red}22`, border:`1px solid ${C.red}55`, borderRadius:8, padding:"12px", cursor:match?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}>
              {loading ? <><Spinner color={C.red}/> ELIMINANDO...</> : <><Trash2 size={13}/> ELIMINAR {items.length} OBJETO{items.length!==1?"S":""}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SKELETON SHIMMER
// ══════════════════════════════════════════════════════════════
function SkeletonObjetos() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {Array.from({ length:4 }).map((_,i) => (
          <div key={i} className="o-skel" style={{ borderRadius:14, height:90, animationDelay:`${i*.08}s` }}/>
        ))}
      </div>
      <div className="o-skel" style={{ borderRadius:12, height:56 }}/>
      <div className="o-skel" style={{ borderRadius:10, height:52 }}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
        {Array.from({ length:8 }).map((_,i) => (
          <div key={i} className="o-skel" style={{ borderRadius:14, height:300, animationDelay:`${i*.07}s` }}/>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminObjetos() {
  const [objetos,    setObjetos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const { push }                   = useToast();
  const [catTab,     setCatTab]     = useState("Boosts");
  const [search,     setSearch]     = useState("");
  const [filterRar,  setFilterRar]  = useState("all");
  const [filterAct,  setFilterAct]  = useState("all");
  const [filterLim,  setFilterLim]  = useState("all");
  const [sortKey,    setSortKey]    = useState("usos");
  const [sortDir,    setSortDir]    = useState("desc");
  const [view,       setView]       = useState("grid");
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(12);
  const [selected,   setSelected]   = useState(new Set());
  const [modal,        setModal]        = useState(null);
  const [bulkDelModal, setBulkDelModal] = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [seeding,      setSeeding]      = useState(false);
  const [exportMenu,   setExportMenu]   = useState(false);

  const loadObjetos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError("Usuario no autenticado");
        return;
      }
      const response = await getObjetos(token);
      setObjetos(response.objetos || []);
    } catch (err) {
      console.error("Error cargando objetos:", err);
      setError("Error al cargar objetos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadObjetos(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadObjetos();
    setRefreshing(false);
  };

  const handleSeedItems = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res   = await seedFunctionalItems(token);
      push(res?.message || "Objetos sembrados", "success");
      await loadObjetos();
    } catch (err) {
      push("Error al sembrar objetos: " + err.message, "error");
    } finally {
      setSeeding(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...objetos];
    if (catTab !== "Todos") {
      const sec = SECCIONES[catTab];
      if (sec) list = list.filter(o => sec.categorias.includes(o.categoria));
    }
    if (search)            list = list.filter(o => o.nombre.toLowerCase().includes(search.toLowerCase()) || o.descripcion.toLowerCase().includes(search.toLowerCase()));
    if (filterRar !== "all") list = list.filter(o => o.rareza === filterRar);
    if (filterAct !== "all") list = list.filter(o => String(o.activo) === (filterAct==="active"?"true":"false"));
    if (filterLim !== "all") list = list.filter(o => filterLim==="limited" ? o.limitado : !o.limitado);
    list.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [objetos, catTab, search, filterRar, filterAct, filterLim, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page-1)*pageSize, page*pageSize);

  const sort = k => {
    if (sortKey === k) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const toggleSelect = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll    = ()  => setSelected(s => s.size===paginated.length ? new Set() : new Set(paginated.map(o => o.id)));

  const handleSave = async saved => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuario no autenticado");

      if (saved.id) { await updateObjeto(token, saved.id, saved); push("Objeto actualizado correctamente"); }
      else          { await createObjeto(token, saved); push("Objeto creado correctamente"); }
      await loadObjetos();

      // F20 — fire-and-forget notification when item is published
      if (saved.activo) {
        const precioStr = Number(saved.precio) === 0 ? "¡GRATIS!" : `${saved.precio} 🪙`;
        fetch("/api/mensajes", {
          method:"POST",
          headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({
            text:      `¡Nuevo objeto en la tienda! ${saved.imagen} **${saved.nombre}** — ${precioStr}`,
            title:     `Nuevo en la tienda: ${saved.nombre}`,
            type:      "item_new",
            status:    "published",
            targetAll: true,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      push(err.message || "Error al guardar objeto", "error");
      throw err;
    }
  };

  const handleDelete = async id => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuario no autenticado");

      await deleteObjeto(token, id);
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      await loadObjetos();
      push("Objeto eliminado");
    } catch (err) {
      push(err.message || "Error al eliminar objeto", "error");
      throw err;
    }
  };

  const bulkDelete = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuario no autenticado");
      const n = selected.size;
      for (const id of selected) await deleteObjeto(token, id);
      setSelected(new Set());
      await loadObjetos();
      push(`${n} objeto${n!==1?"s":""} eliminado${n!==1?"s":""}`);
    } catch (err) {
      push(err.message || "Error en eliminación masiva", "error");
    }
  };

  const bulkToggle = async activo => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuario no autenticado");
      const n = selected.size;
      for (const id of selected) {
        const obj = objetos.find(o => o.id === id);
        if (obj) await updateObjeto(token, id, { ...obj, activo });
      }
      setSelected(new Set());
      await loadObjetos();
      push(`${n} objeto${n!==1?"s":""} ${activo?"activado":"desactivado"}${n!==1?"s":""}`);
    } catch (err) {
      push(err.message || "Error en cambio masivo", "error");
    }
  };

  // I29: exportar objetos filtrados
  const exportObjetos = fmt => {
    setExportMenu(false);
    const now = new Date().toISOString().slice(0,10);
    if (fmt === "json") {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type:"application/json" });
      const a = Object.assign(document.createElement("a"), { href:URL.createObjectURL(blob), download:`objetos_${now}.json` });
      a.click(); URL.revokeObjectURL(a.href);
    } else {
      const cols = ["id","nombre","categoria","rareza","precio","usos","stock","activo","obtenido","descripcion"];
      const rows = filtered.map(o => cols.map(c => {
        const v = o[c];
        return typeof v === "string" && v.includes(",") ? `"${v.replace(/"/g,'""')}"` : String(v ?? "");
      }).join(","));
      const blob = new Blob([[cols.join(","), ...rows].join("\n")], { type:"text/csv" });
      const a = Object.assign(document.createElement("a"), { href:URL.createObjectURL(blob), download:`objetos_${now}.csv` });
      a.click(); URL.revokeObjectURL(a.href);
    }
  };

  const kpis = useMemo(() => ({
    total:    objetos.length,
    activos:  objetos.filter(o => o.activo).length,
    usos:     objetos.reduce((s, o) => s + (o.usos||0), 0),
    limitados:objetos.filter(o => o.limitado).length,
  }), [objetos]);

  const fBtn = (on, c=C.orange) => ({ ...raj(11,on?700:600), color:on?c:C.muted, background:on?`${c}18`:"transparent", border:`1px solid ${on?c:C.navy}`, borderRadius:20, padding:"5px 12px", cursor:"pointer", transition:"all .18s" });

  if (loading) return <><style>{CSS}</style><SkeletonObjetos/></>;

  if (error) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"400px" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center" }}>
          <AlertTriangle size={48} color={C.red} />
          <span style={{ ...raj(16,500), color:C.red }}>{error}</span>
          <button onClick={() => { setError(null); refresh(); }} className="o-btn"
            style={{ ...raj(14,600), color:C.orange, background:`${C.orange}18`, border:`1px solid ${C.orange}44`, padding:"10px 20px", cursor:"pointer" }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      {modal?.type === "view"   && <ViewModal      obj={modal.o} onClose={() => setModal(null)} onEdit={o => setModal({ type:"form", o })} />}
      {modal?.type === "form"   && <FormModal      obj={modal.o} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.type === "delete" && <DeleteModal    obj={modal.o} onClose={() => setModal(null)} onConfirm={handleDelete} />}
      {bulkDelModal && (
        <BulkDeleteModal
          items={[...selected].map(id => objetos.find(o => o.id === id)).filter(Boolean)}
          onClose={() => setBulkDelModal(false)}
          onConfirm={bulkDelete}
        />
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { label:"OBJETOS TOTALES", value:kpis.total,                      icon:<Package  size={18}/>, color:C.orange },
            { label:"ACTIVOS",         value:kpis.activos,                     icon:<Zap      size={18}/>, color:C.green  },
            { label:"USOS TOTALES",    value:kpis.usos.toLocaleString(),       icon:<BarChart2 size={18}/>,color:C.blue   },
            { label:"EDIC. LIMITADA",  value:kpis.limitados,                   icon:<Star     size={18}/>, color:C.red    },
          ].map((k, i) => (
            <motion.div key={i}
              whileHover={{ y:-2, boxShadow:"0 10px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)" }}
              transition={{ duration:0.18, ease:"easeOut" }}
              style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:`1px solid ${C.navy}`, borderRadius:14, padding:"18px 16px", position:"relative", overflow:"hidden", animation:`o-cardIn .4s ease ${i*.07}s both`, boxShadow:"0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)", borderLeft:`4px solid ${k.color}` }}>
              <div style={{ background:`${k.color}18`, border:`1px solid ${k.color}33`, borderRadius:8, padding:9, display:"inline-flex", color:k.color, marginBottom:10 }}>{k.icon}</div>
              <div style={{ ...orb(26,900), color:k.color, marginBottom:3 }}>{k.value}</div>
              <div style={{ ...px(6), color:C.muted, letterSpacing:".05em" }}>{k.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Section tabs */}
        <div style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:`1px solid ${C.navy}`, borderRadius:12, padding:"10px 12px", boxShadow:"0 4px 24px rgba(0,0,0,0.3)" }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {SECCIONES_KEYS.map(seccion => {
              const m   = SECCIONES[seccion];
              const on  = catTab === seccion;
              const cc  = m.color;
              const cnt = objetos.filter(o => m.categorias.includes(o.categoria)).length;
              return (
                <button key={seccion} onClick={() => { setCatTab(seccion); setPage(1); }} className="o-cat-tab"
                  style={{ padding:"8px 16px", background:on?`${cc}18`:"transparent", border:`1px solid ${on?cc:C.navy}`, borderRadius:20, color:on?cc:C.muted, cursor:"pointer", display:"flex", alignItems:"center", gap:7, transition:"all .22s", boxShadow:on?`0 0 10px ${cc}33`:"none" }}>
                  <m.Icon size={14} color={on?cc:C.muted} style={{ flexShrink:0 }}/>
                  <span style={{ ...raj(12,on?700:500), whiteSpace:"nowrap" }}>{seccion}</span>
                  <span style={{ ...raj(10,700), color:on?cc:C.navy, background:on?`${cc}22`:`${C.navy}44`, padding:"1px 7px", borderRadius:10 }}>{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:`1px solid ${C.navy}`, borderRadius:12, padding:"13px 16px", boxShadow:"0 4px 24px rgba(0,0,0,0.3)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:"1 1 200px" }}>
              <Search size={13} color={C.muted} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
              <input className="o-input" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar objeto..."
                style={{ width:"100%", padding:"8px 12px 8px 30px", background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, color:C.white, ...raj(13,500) }} />
              {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}><X size={12} /></button>}
            </div>

            <div style={{ display:"flex", gap:4 }}>
              {[{ v:"grid", i:"⊞" }, { v:"table", i:"≡" }].map(({ v, i }) => (
                <button key={v} onClick={() => setView(v)} className="o-btn"
                  style={{ ...raj(14,700), color:view===v?C.orange:C.muted, background:view===v?`${C.orange}18`:C.panel, border:`1px solid ${view===v?C.orange:C.navy}`, padding:"7px 12px", cursor:"pointer" }}>{i}</button>
              ))}
            </div>

            <span style={{ ...raj(11,600), color:C.muted }}>Rareza:</span>
            {["all", ...RAREZA_KEYS].map(v => {
              const r = RAREZA[v];
              return <button key={v} onClick={() => { setFilterRar(v); setPage(1); }} className="o-btn" style={fBtn(filterRar===v, r?.color||C.orange)}>{v==="all"?"Todas":v}</button>;
            })}

            <div style={{ width:1, background:C.navy, alignSelf:"stretch", margin:"0 4px" }} />
            {[{ v:"all", l:"Todos" }, { v:"active", l:"● Activos" }, { v:"inactive", l:"● Inactivos" }].map(o => (
              <button key={o.v} onClick={() => { setFilterAct(o.v); setPage(1); }} className="o-btn" style={fBtn(filterAct===o.v, o.v==="active"?C.green:C.red)}>{o.l}</button>
            ))}
            {[{ v:"all", l:"Todos" }, { v:"limited", l:"🔒 Limitados" }, { v:"unlimited", l:"∞ Ilimitados" }].map(o => (
              <button key={o.v} onClick={() => { setFilterLim(o.v); setPage(1); }} className="o-btn" style={fBtn(filterLim===o.v, o.v==="limited"?C.red:C.teal)}>{o.l}</button>
            ))}

            <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
              {selected.size > 0 && (
                <>
                  <button onClick={() => bulkToggle(true)} className="o-btn" style={{ ...raj(11,700), color:C.green,  background:`${C.green}14`,  border:`1px solid ${C.green}44`,  borderRadius:6, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Check size={12} /> Activar ({selected.size})</button>
                  <button onClick={() => bulkToggle(false)} className="o-btn" style={{ ...raj(11,700), color:C.orange, background:`${C.orange}14`, border:`1px solid ${C.orange}44`, borderRadius:6, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><X size={12} /> Desactivar ({selected.size})</button>
                  <button onClick={() => setBulkDelModal(true)} className="o-btn" style={{ ...raj(11,700), color:C.red, background:`${C.red}14`, border:`1px solid ${C.red}44`, borderRadius:6, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Trash2 size={12} /> Eliminar ({selected.size})</button>
                </>
              )}

              {/* I29: Export dropdown */}
              <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setExportMenu(m => !m)} className="o-btn"
                  style={{ ...raj(11,700), color:C.teal, background:`${C.teal}14`, border:`1px solid ${C.teal}44`, borderRadius:6, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  <ChevronDown size={12} style={{ transform:exportMenu?"rotate(180deg)":"none", transition:"transform .2s" }}/> Exportar
                </button>
                {exportMenu && (
                  <div style={{ position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:50, background:"rgba(20,26,42,0.97)", backdropFilter:"blur(12px)", border:`1px solid ${C.navy}`, borderRadius:8, minWidth:140, boxShadow:"0 8px 32px rgba(0,0,0,.5)", overflow:"hidden" }}>
                    {[{ fmt:"json", l:"⬇ JSON" }, { fmt:"csv", l:"⬇ CSV" }].map(({ fmt, l }) => (
                      <button key={fmt} onClick={() => exportObjetos(fmt)} className="o-btn"
                        style={{ display:"block", width:"100%", textAlign:"left", ...raj(12,600), color:C.white, background:"transparent", border:"none", padding:"10px 16px", cursor:"pointer", transition:"background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background=`${C.teal}18`}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={refresh} className="o-btn" style={{ ...raj(12,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, padding:"7px 11px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                <RefreshCw size={12} style={{ animation:refreshing?"o-spin .8s linear infinite":"none" }} /> Actualizar
              </button>
              <button onClick={handleSeedItems} disabled={seeding} className="o-btn"
                style={{ ...raj(11,700), color:C.teal, background:`${C.teal}14`, border:`1px solid ${C.teal}44`, borderRadius:6, padding:"7px 12px", cursor:seeding?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:6, opacity:seeding?.6:1 }}>
                {seeding ? <><div style={{width:10,height:10,border:`2px solid ${C.teal}`,borderTop:`2px solid transparent`,borderRadius:"50%",animation:"o-spin .8s linear infinite"}}/> Sembrando...</> : <><Sparkles size={12}/> Sembrar</>}
              </button>
              <button onClick={() => setModal({ type:"form", o:null })} className="o-btn"
                style={{ ...px(7), color:C.bg, background:C.green, border:"none", borderRadius:6, padding:"7px 14px", cursor:"pointer", boxShadow:`0 3px 14px ${C.green}33`, display:"flex", alignItems:"center", gap:6 }}>
                <Plus size={13} /> NUEVO
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...raj(12,500), color:C.muted }}>
          {filtered.length} objeto{filtered.length!==1?"s":""} · página {page}/{totalPages}
          {selected.size > 0 && <span style={{ color:C.orange, marginLeft:12 }}>{selected.size} seleccionado{selected.size!==1?"s":""}</span>}
        </div>

        {/* GRID */}
        {view === "grid" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
            {paginated.length === 0
              ? <div style={{ gridColumn:"1/-1", padding:40, textAlign:"center", ...raj(14,500), color:C.muted }}>Sin resultados.</div>
              : paginated.map((o, i) => {
                const r   = RAREZA[o.rareza] || { color:C.muted, tier:1 };
                const cat = CATEGORIAS[o.categoria] || {};
                const sel = selected.has(o.id);
                const c   = r.color;
                const glowMap = { 1:"none", 2:`0 0 14px ${c}22`, 3:`0 0 22px ${c}44`, 4:`0 0 36px ${c}66`, 5:`0 0 48px ${c}88`, 6:`0 0 60px ${c}AA` };
                const isLegendary = r.tier >= 5;
                return (
                  <div key={o.id} className="o-card"
                    style={{
                      background: "rgba(20,26,42,0.78)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: sel ? `2px solid ${C.orange}` : `1px solid ${C.navy}`,
                      borderRadius: 14,
                      boxShadow: sel ? `0 0 18px ${C.orange}33` : "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
                      overflow:"hidden", animation:`o-cardIn .4s ease ${i*.05}s both`, position:"relative",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 16px 40px rgba(0,0,0,0.5), 0 0 20px ${c}22, inset 0 1px 0 rgba(255,255,255,0.07)`; e.currentTarget.style.borderColor=`${c}44`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=sel?`0 0 18px ${C.orange}33`:"0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor=sel?C.orange:C.navy; }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleSelect(o.id)} style={{ position:"absolute", top:10, left:10, accentColor:C.orange, width:14, height:14, cursor:"pointer", zIndex:2 }} />
                    <div style={{ height:3, background:`linear-gradient(90deg,transparent,${c},transparent)` }} />

                    <div style={{ padding:"16px 16px 0" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
                        <div style={{ width:52, height:52, background:`${c}18`, border:`1px solid ${c}33`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0, boxShadow:`inset 0 0 16px ${c}0E` }}>
                          {o.imagen}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ ...raj(13,700), color:C.white, marginBottom:4, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.nombre}</div>
                          <CatBadge cat={o.categoria} />
                          <StarRating rareza={o.rareza} />
                        </div>
                      </div>

                      <RarezaBadge rareza={o.rareza} />

                      <p style={{ ...raj(11,400), color:C.muted, lineHeight:1.5, marginTop:8, marginBottom:10, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {o.descripcion}
                      </p>

                      {o.efectos && o.efectos.length > 0 && (
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
                          {o.efectos.map((ef, idx) => (
                            <span key={idx} style={{ ...raj(10,600), color:c, background:`${c}12`, border:`1px solid ${c}22`, padding:"2px 8px", borderRadius:20, display:"inline-flex", alignItems:"center", gap:3 }}>
                              {ef.icon} {ef.tipo==="xp_mult"?`×${ef.valor}`:`+${ef.valor}${ef.unidad}`}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                        <div style={{ background:C.panel, border:`1px solid ${C.gold}18`, borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                          <div style={{ ...raj(12,700), color:o.precio===0?C.green:C.gold }}>{o.precio===0?"GRATIS":o.precio.toLocaleString()}</div>
                          <div style={{ ...px(4), color:C.muted }}>PRECIO</div>
                        </div>
                        <div style={{ background:C.panel, border:`1px solid ${C.blue}18`, borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                          <div style={{ ...raj(12,700), color:C.blue }}>{(o.usos||0).toLocaleString()}</div>
                          <div style={{ ...px(4), color:C.muted }}>USOS</div>
                        </div>
                      </div>

                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                        <span style={{ ...raj(10,600), color:o.activo?C.green:C.red, background:o.activo?`${C.green}14`:`${C.red}14`, border:`1px solid ${o.activo?C.green:C.red}33`, borderRadius:20, padding:"2px 8px" }}>{o.activo?"● ACTIVO":"● INACTIVO"}</span>
                        {o.limitado   && <span style={{ ...raj(10,600), color:C.red,  background:`${C.red}14`,  border:`1px solid ${C.red}33`,  borderRadius:20, padding:"2px 8px" }}>🔒 LIMITADO</span>}
                        {o.stock      && <span style={{ ...raj(10,600), color:C.muted,background:`${C.muted}14`,border:`1px solid ${C.muted}33`,borderRadius:20,padding:"2px 8px" }}>📦 {o.stock}</span>}
                        {o.stackeable && <span style={{ ...raj(10,600), color:C.teal, background:`${C.teal}14`, border:`1px solid ${C.teal}33`,  borderRadius:20, padding:"2px 8px" }}>📚 STACK</span>}
                      </div>

                      <MiniBar val={Math.min(((o.usos||0)/1000)*100,100)} color={c} height={4} />
                    </div>

                    <div style={{ borderTop:`1px solid ${C.navy}33`, marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderRadius:"0 0 14px 14px", overflow:"hidden" }}>
                      {[
                        { Icon:Eye,    c:C.blue,   fn:() => setModal({ type:"view",   o }), l:"Ver"    },
                        { Icon:Edit2,  c:C.orange, fn:() => setModal({ type:"form",   o }), l:"Editar" },
                        { Icon:Trash2, c:C.red,    fn:() => setModal({ type:"delete", o }), l:"Borrar" },
                      ].map(({ Icon, c:ic, fn, l }, j) => (
                        <button key={j} onClick={fn} className="o-btn"
                          style={{ background:"transparent", border:"none", borderRight:j<2?`1px solid ${C.navy}33`:"none", padding:"10px 0", color:ic, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", transition:"background .2s" }}
                          onMouseEnter={e => e.currentTarget.style.background=`${ic}14`}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <Icon size={13} /><span style={{ ...raj(9,600), color:C.muted }}>{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* TABLE */}
        {view === "table" && (
          <div style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:`1px solid ${C.navy}`, borderRadius:12, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.35)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"34px 2fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.6fr 0.6fr 95px", padding:"10px 14px", background:`${C.panel}88`, borderBottom:`1px solid ${C.navy}`, gap:8, alignItems:"center" }}>
              <input type="checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll} style={{ accentColor:C.orange, width:14, height:14, cursor:"pointer" }} />
              {[
                { l:"OBJETO",    k:"nombre"   },
                { l:"CATEGORÍA", k:"categoria"},
                { l:"RAREZA",    k:"rareza"   },
                { l:"EFECTOS",   k:null       },
                { l:"PRECIO",    k:"precio"   },
                { l:"USOS",      k:"usos"     },
                { l:"STOCK",     k:"stock"    },
                { l:"ESTADO",    k:"activo"   },
              ].map((h, i) => (
                <div key={i} className={h.k?"o-sort":""} onClick={() => h.k && sort(h.k)}
                  style={{ display:"flex", alignItems:"center", gap:3, ...px(5), color:sortKey===h.k?C.orange:C.muted, letterSpacing:".05em" }}>
                  {h.l}{h.k && <SortIcon active={sortKey===h.k} dir={sortDir} />}
                </div>
              ))}
              <span style={{ ...px(5), color:C.muted, letterSpacing:".05em" }}>ACC.</span>
            </div>

            {paginated.length === 0
              ? <div style={{ padding:40, textAlign:"center", ...raj(14,500), color:C.muted }}>Sin resultados.</div>
              : paginated.map((o, i) => {
                const r = RAREZA[o.rareza] || { color:C.muted };
                return (
                  <div key={o.id} className="o-row" style={{ display:"grid", gridTemplateColumns:"34px 2fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.6fr 0.6fr 95px", padding:"11px 14px", borderBottom:`1px solid ${C.navy}22`, gap:8, alignItems:"center", animation:`o-slideU .3s ease ${i*.04}s both`, background:selected.has(o.id)?`${C.orange}08`:"transparent" }}>
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} style={{ accentColor:C.orange, width:14, height:14, cursor:"pointer" }} />
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                      <div style={{ width:34, height:34, background:`${r.color}18`, border:`2px solid ${r.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{o.imagen}</div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ ...raj(13,700), color:C.white, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{o.nombre}</div>
                        <div style={{ display:"flex", gap:4, marginTop:2 }}>
                          {o.limitado  && <span style={{ ...raj(9,700), color:C.red  }}>🔒</span>}
                          {o.stackeable && <span style={{ ...raj(9,700), color:C.teal }}>📚</span>}
                        </div>
                      </div>
                    </div>
                    <CatBadge cat={o.categoria} />
                    <RarezaBadge rareza={o.rareza} />
                    <div style={{ display:"flex", gap:3 }}>
                      {(o.efectos||[]).slice(0,2).map((ef, idx) => <span key={idx} style={{ fontSize:14 }}>{ef.icon}</span>)}
                      {(o.efectos||[]).length > 2 && <span style={{ ...raj(9,600), color:C.muted }}>+{o.efectos.length-2}</span>}
                      {(o.efectos||[]).length === 0 && <span style={{ ...raj(10,500), color:C.navy }}>—</span>}
                    </div>
                    <span style={{ ...raj(12,700), color:o.precio===0?C.green:C.gold }}>{o.precio===0?"GRATIS":o.precio.toLocaleString()}</span>
                    <div>
                      <div style={{ ...raj(11,700), color:C.blue, marginBottom:2 }}>{(o.usos||0).toLocaleString()}</div>
                      <MiniBar val={Math.min(((o.usos||0)/1000)*100,100)} color={C.blue} height={3} />
                    </div>
                    <span style={{ ...raj(11,600), color:o.stock?C.muted:C.teal }}>{o.stock?`📦 ${o.stock}`:"∞"}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:o.activo?C.green:C.red, animation:o.activo?"o-pulse 1.8s infinite":"none" }} />
                      <span style={{ ...raj(10,600), color:o.activo?C.green:C.red }}>{o.activo?"ON":"OFF"}</span>
                    </div>
                    <div style={{ display:"flex", gap:5 }}>
                      {[
                        { Icon:Eye,    c:C.blue,   fn:() => setModal({ type:"view",   o }) },
                        { Icon:Edit2,  c:C.orange, fn:() => setModal({ type:"form",   o }) },
                        { Icon:Trash2, c:C.red,    fn:() => setModal({ type:"delete", o }) },
                      ].map(({ Icon, c:ic, fn }, j) => (
                        <button key={j} onClick={fn} className="o-icon-btn"
                          style={{ background:"transparent", border:`1px solid ${ic}33`, padding:5, color:ic, display:"flex", alignItems:"center" }}
                          onMouseEnter={e => { e.currentTarget.style.background=`${ic}18`; e.currentTarget.style.borderColor=ic; }}
                          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=`${ic}33`; }}>
                          <Icon size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* Pagination */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ ...raj(13,500), color:C.muted }}>
              {Math.min((page-1)*pageSize+1, filtered.length)}–{Math.min(page*pageSize, filtered.length)} de {filtered.length}
            </span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="o-input"
              style={{ padding:"6px 10px", background:C.panel, border:`1px solid ${C.navy}`, color:C.muted, ...raj(12,500), cursor:"pointer" }}>
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={() => setPage(1)}           disabled={page===1}          className="o-btn" style={{ background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, color:page===1?C.navy:C.muted,          padding:"6px 11px", cursor:page===1?"not-allowed":"pointer" }}>«</button>
            <button onClick={() => setPage(p => p-1)}    disabled={page===1}          className="o-btn" style={{ background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, color:page===1?C.navy:C.muted,          padding:"6px 10px", cursor:page===1?"not-allowed":"pointer", display:"flex", alignItems:"center" }}><ChevronLeft  size={13} /></button>
            {Array.from({ length:totalPages }, (_, i) => i+1).filter(n => Math.abs(n-page) <= 2).map(n => (
              <button key={n} onClick={() => setPage(n)} className="o-btn"
                style={{ background:n===page?C.orange:C.panel, border:`1px solid ${n===page?C.orange:C.navy}`, borderRadius:6, color:n===page?C.bg:C.muted, padding:"6px 13px", cursor:"pointer", ...raj(13,n===page?700:500) }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => p+1)}    disabled={page===totalPages} className="o-btn" style={{ background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, color:page===totalPages?C.navy:C.muted, padding:"6px 10px", cursor:page===totalPages?"not-allowed":"pointer", display:"flex", alignItems:"center" }}><ChevronRight size={13} /></button>
            <button onClick={() => setPage(totalPages)}  disabled={page===totalPages} className="o-btn" style={{ background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, color:page===totalPages?C.navy:C.muted, padding:"6px 11px", cursor:page===totalPages?"not-allowed":"pointer" }}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}