// src/pages/admin/AdminObjetos.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de objetos/items para ForgeVenture Admin.
//  Categorías: Poción | Equipo | Cosmético | Consumible | Coleccionable | Especial
//  Conectar: getObjetos(), createObjeto(), updateObjeto(),
//            deleteObjeto() desde api.js cuando esté el backend.
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Package, Zap, Star,
  BarChart2, Shield, Flame, Gift, Sparkles,
  Lock, Unlock, Clock, Hash,
} from "lucide-react";

const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6", pink:"#FF69B4",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

const CSS = `
  @keyframes o-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes o-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes o-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes o-modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes o-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes o-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes o-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes o-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes o-glow    { 0%,100%{filter:drop-shadow(0 0 6px currentColor)} 50%{filter:drop-shadow(0 0 16px currentColor)} }

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
  .o-card   { transition:all .22s; cursor:default; }
  .o-card:hover { transform:translateY(-4px); box-shadow:0 16px 44px rgba(0,0,0,.5) !important; }
  .o-cat-tab { transition:all .2s; cursor:pointer; }
  .o-cat-tab:hover { opacity:.85; }
  .o-rar-btn { transition:all .22s; cursor:pointer; }
  .o-rar-btn:hover { transform:scale(1.04); }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Categorías ────────────────────────────────────────────────
const CATEGORIAS = {
  Poción:       { color:"#FF69B4", icon:"🧪", bg:"#FF69B414", desc:"Recuperan HP, XP o atributos temporales" },
  Equipo:       { color:C.orange,  icon:"⚔️", bg:"#E85D0414", desc:"Armas, armaduras y accesorios del héroe" },
  Cosmético:    { color:C.purple,  icon:"👑", bg:"#9B59B614", desc:"Skins, efectos y personalización visual" },
  Consumible:   { color:C.teal,    icon:"⚡", bg:"#0A939614", desc:"Boosts temporales de rendimiento" },
  Coleccionable:{ color:C.gold,    icon:"💎", bg:"#FFD70014", desc:"Piezas únicas de colección" },
  Especial:     { color:C.red,     icon:"🌟", bg:"#E74C3C14", desc:"Items de eventos y recompensas únicas" },
};
const CAT_KEYS = Object.keys(CATEGORIAS);

// ── Rareza ─────────────────────────────────────────────────────
const RAREZA = {
  Común:     { color:C.muted,   glow:"#5A7A9A", tier:1, stars:1 },
  "Poco común":{ color:C.green,   glow:C.green,   tier:2, stars:2 },
  Raro:      { color:C.blue,    glow:C.blue,    tier:3, stars:3 },
  Épico:     { color:C.purple,  glow:C.purple,  tier:4, stars:4 },
  Legendario:{ color:C.gold,    glow:C.gold,    tier:5, stars:5 },
  Mítico:    { color:"#FF2D55", glow:"#FF2D55", tier:6, stars:6 },
};
const RAREZA_KEYS = Object.keys(RAREZA);

// ── Efectos disponibles para los items ───────────────────────
const EFECTOS_TIPOS = [
  { id:"xp_bonus",     icon:"⚡", label:"Bonus XP",          unit:"%",  desc:"Aumenta XP ganado" },
  { id:"xp_instant",   icon:"💫", label:"XP Instantáneo",    unit:"XP", desc:"Otorga XP al usar" },
  { id:"hp_recover",   icon:"❤️", label:"Recuperar HP",       unit:"%",  desc:"Restaura HP del héroe" },
  { id:"streak_shield",icon:"🔥", label:"Escudo de Racha",    unit:"días",desc:"Protege racha X días" },
  { id:"xp_mult",      icon:"✨", label:"Multiplicador XP",   unit:"x",  desc:"Multiplica XP por X" },
  { id:"level_boost",  icon:"⬆️", label:"Boost de Nivel",     unit:"niveles",desc:"Sube X niveles" },
  { id:"unlock_class", icon:"🎭", label:"Desbloquea Clase",   unit:"clase",desc:"Desbloquea clase especial" },
  { id:"cosmetic_skin",icon:"👗", label:"Skin de Personaje",  unit:"skin",desc:"Cambia apariencia" },
  { id:"title_grant",  icon:"👑", label:"Otorga Título",      unit:"título",desc:"Concede título especial" },
  { id:"cooldown_red", icon:"⏱️", label:"Reduce Cooldown",    unit:"%",  desc:"Reduce tiempo de espera" },
];

// ── Cómo se obtiene ───────────────────────────────────────────
const OBTENER_TIPOS = ["Tienda","Misión","Logro","Evento","Racha","Nivel","Drop aleatorio","Admin"];

const EMOJIS_OBJ = ["🧪","⚔️","🛡️","👑","💎","🌟","⚡","💫","❤️","🔮","🗡️","🏹","🎯","🎒","🎁","🏅","🔑","💍","🌙","☄️","🦋","🐉","🌈","⚗️","📿"];

// ── Mock data ─────────────────────────────────────────────────
const MOCK_OBJETOS = [
  { id:"o1",  nombre:"Poción de XP Mayor",    categoria:"Poción",       rareza:"Raro",      imagen:"🧪",  precio:500,  stock:null, limitado:false, activo:true,  obtenido:"Tienda",       usos:342,  descripcion:"Aumenta el XP ganado en un 50% durante 1 hora.",
    efectos:[{tipo:"xp_bonus",label:"Bonus XP",icon:"⚡",valor:50,unidad:"%"}], duracion:60, stackeable:false, creadoEn:"2024-10-01" },
  { id:"o2",  nombre:"Espada del Guerrero",   categoria:"Equipo",       rareza:"Épico",     imagen:"⚔️",  precio:2000, stock:null, limitado:false, activo:true,  obtenido:"Tienda",       usos:89,   descripcion:"Arma épica que multiplica el XP de ejercicios de fuerza por 1.5x.",
    efectos:[{tipo:"xp_mult",label:"Multiplicador XP",icon:"✨",valor:1.5,unidad:"x"}], duracion:null, stackeable:false, creadoEn:"2024-10-05" },
  { id:"o3",  nombre:"Corona del Campeón",    categoria:"Cosmético",    rareza:"Legendario",imagen:"👑",  precio:5000, stock:50,   limitado:true,  activo:true,  obtenido:"Logro",        usos:12,   descripcion:"Corona dorada exclusiva para campeones de rachas de 60+ días.",
    efectos:[{tipo:"cosmetic_skin",label:"Skin de Personaje",icon:"👗",valor:1,unidad:"skin"}], duracion:null, stackeable:false, creadoEn:"2024-10-12" },
  { id:"o4",  nombre:"Escudo Anti-Racha",     categoria:"Consumible",   rareza:"Poco común",imagen:"🛡️", precio:300,  stock:null, limitado:false, activo:true,  obtenido:"Tienda",       usos:567,  descripcion:"Protege tu racha de 3 días sin actividad.",
    efectos:[{tipo:"streak_shield",label:"Escudo de Racha",icon:"🔥",valor:3,unidad:"días"}], duracion:null, stackeable:true, creadoEn:"2024-10-15" },
  { id:"o5",  nombre:"Diamante de Colección", categoria:"Coleccionable",rareza:"Mítico",    imagen:"💎",  precio:0,    stock:1,    limitado:true,  activo:true,  obtenido:"Evento",       usos:1,    descripcion:"Pieza única del evento de lanzamiento. Valor histórico.",
    efectos:[], duracion:null, stackeable:false, creadoEn:"2024-11-01" },
  { id:"o6",  nombre:"Elixir de Velocidad",   categoria:"Consumible",   rareza:"Raro",      imagen:"⚡",  precio:800,  stock:null, limitado:false, activo:true,  obtenido:"Misión",       usos:234,  descripcion:"Reduce el cooldown entre sesiones un 50% durante 24 horas.",
    efectos:[{tipo:"cooldown_red",label:"Reduce Cooldown",icon:"⏱️",valor:50,unidad:"%"}], duracion:24*60, stackeable:false, creadoEn:"2024-11-10" },
  { id:"o7",  nombre:"Orbe del Nivel",        categoria:"Especial",     rareza:"Épico",     imagen:"🔮",  precio:0,    stock:10,   limitado:true,  activo:false, obtenido:"Admin",        usos:3,    descripcion:"Item especial que sube instantáneamente 1 nivel al héroe.",
    efectos:[{tipo:"level_boost",label:"Boost de Nivel",icon:"⬆️",valor:1,unidad:"niveles"}], duracion:null, stackeable:true, creadoEn:"2024-11-20" },
  { id:"o8",  nombre:"Título: Llama Eterna",  categoria:"Cosmético",    rareza:"Legendario",imagen:"🔥",  precio:0,    stock:null, limitado:false, activo:true,  obtenido:"Racha",        usos:18,   descripcion:"Título exclusivo para héroes con racha de 30+ días.",
    efectos:[{tipo:"title_grant",label:"Otorga Título",icon:"👑",valor:1,unidad:"título"}], duracion:null, stackeable:false, creadoEn:"2024-12-01" },
  { id:"o9",  nombre:"Poción HP Total",       categoria:"Poción",       rareza:"Poco común",imagen:"❤️",  precio:200,  stock:null, limitado:false, activo:true,  obtenido:"Tienda",       usos:891,  descripcion:"Restaura el HP del héroe al 100% instantáneamente.",
    efectos:[{tipo:"hp_recover",label:"Recuperar HP",icon:"❤️",valor:100,unidad:"%"}], duracion:null, stackeable:true, creadoEn:"2024-12-05" },
  { id:"o10", nombre:"Armadura de Primavera", categoria:"Equipo",       rareza:"Épico",     imagen:"🌸",  precio:0,    stock:200,  limitado:true,  activo:false, obtenido:"Evento",       usos:0,    descripcion:"Armadura edición primavera del evento especial.",
    efectos:[{tipo:"xp_bonus",label:"Bonus XP",icon:"⚡",valor:25,unidad:"%"}], duracion:null, stackeable:false, creadoEn:"2025-03-01" },
  { id:"o11", nombre:"XP Instantáneo 1000",  categoria:"Consumible",   rareza:"Raro",      imagen:"💫",  precio:1500, stock:null, limitado:false, activo:true,  obtenido:"Tienda",       usos:156,  descripcion:"Otorga 1000 XP instantáneamente al activarlo.",
    efectos:[{tipo:"xp_instant",label:"XP Instantáneo",icon:"💫",valor:1000,unidad:"XP"}], duracion:null, stackeable:true, creadoEn:"2025-01-15" },
  { id:"o12", nombre:"Clase: Modo Oscuro",    categoria:"Especial",     rareza:"Mítico",    imagen:"🌙",  precio:0,    stock:5,    limitado:true,  activo:true,  obtenido:"Admin",        usos:2,    descripcion:"Desbloquea la clase secreta Modo Oscuro.",
    efectos:[{tipo:"unlock_class",label:"Desbloquea Clase",icon:"🎭",valor:1,unidad:"clase"}], duracion:null, stackeable:false, creadoEn:"2025-02-01" },
];

const EMPTY_EFECTO = { tipo:"xp_bonus", label:"Bonus XP", icon:"⚡", valor:10, unidad:"%" };
const EMPTY_FORM = { nombre:"", categoria:"Poción", rareza:"Común", imagen:"🧪", precio:100, stock:"", limitado:false, activo:true, descripcion:"", efectos:[], duracion:"", stackeable:false, obtenido:"Tienda" };
const PAGE_SIZE_OPTIONS = [6,12,24];

// ── UI atoms ──────────────────────────────────────────────────
function MiniBar({val,color,height=5}) {
  return (<div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}><div style={{height:"100%",width:`${Math.min(val,100)}%`,background:color,boxShadow:`0 0 5px ${color}66`,transition:"width .6s"}}/></div>);
}

function CatBadge({cat}) {
  const m=CATEGORIAS[cat]||{color:C.muted,icon:"?",bg:C.panel};
  return <span style={{...raj(10,700),color:m.color,background:m.bg,border:`1px solid ${m.color}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>{m.icon} {cat}</span>;
}

function RarezaBadge({rareza}) {
  const r=RAREZA[rareza]||{color:C.muted};
  const stars="★".repeat(r.tier||1);
  return (
    <span style={{...raj(10,700),color:r.color,background:`${r.color}14`,border:`1px solid ${r.color}33`,padding:"2px 8px",whiteSpace:"nowrap",
      textShadow:r.tier>=4?`0 0 8px ${r.color}`:"none"}}>
      {rareza} {stars}
    </span>
  );
}

function PrecioTag({precio}) {
  if(precio===0) return <span style={{...raj(11,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"2px 8px"}}>🎁 GRATIS</span>;
  return <span style={{...raj(11,700),color:C.gold,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,padding:"2px 8px"}}>💰 {precio.toLocaleString()}</span>;
}

function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"o-spin .8s linear infinite"}}/>;
}
function SortIcon({active,dir}) {
  if(!active) return <ChevronDown size={11} color={C.navy}/>;
  return dir==="asc"?<ChevronUp size={11} color={C.orange}/>:<ChevronDown size={11} color={C.orange}/>;
}

// Estrellas de rareza animadas
function StarRating({rareza}) {
  const r=RAREZA[rareza]||{tier:1,color:C.muted};
  return (
    <div style={{display:"flex",gap:2}}>
      {Array.from({length:6},(_,i)=>(
        <span key={i} style={{fontSize:10,color:i<r.tier?r.color:C.navy,textShadow:i<r.tier?`0 0 6px ${r.color}`:"none",transition:"color .3s"}}>★</span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — VER OBJETO
// ══════════════════════════════════════════════════════════════
function ViewModal({obj,onClose,onEdit}) {
  const cat = CATEGORIAS[obj.categoria]||{};
  const rar = RAREZA[obj.rareza]||{};
  const c   = rar.color||C.orange;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:560,background:C.card,border:`2px solid ${c}44`,
        boxShadow:`0 0 60px ${c}18,0 24px 60px rgba(0,0,0,.6)`,animation:"o-modalIn .25s ease both",overflow:"hidden"}}>
        {/* rareza gradient top */}
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>

        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:60,height:60,background:`${c}18`,border:`2px solid ${c}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
              boxShadow:`inset 0 0 20px ${c}18`,animation:"o-float 2.5s ease-in-out infinite"}}>
              {obj.imagen}
            </div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:6}}>{obj.nombre}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <CatBadge cat={obj.categoria}/>
                <RarezaBadge rareza={obj.rareza}/>
              </div>
              <StarRating rareza={obj.rareza}/>
            </div>
          </div>
          <button onClick={onClose} className="o-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16,maxHeight:"70vh",overflowY:"auto"}}>
          {/* stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {l:"PRECIO",   v:obj.precio===0?"GRATIS":`${obj.precio.toLocaleString()}`, c:obj.precio===0?C.green:C.gold},
              {l:"USOS",     v:obj.usos.toLocaleString(), c:C.blue},
              {l:"STOCK",    v:obj.stock?obj.stock.toLocaleString():"∞", c:obj.limitado?C.red:C.muted},
              {l:"ESTADO",   v:obj.activo?"ACTIVO":"INACTIVO", c:obj.activo?C.green:C.red},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center"}}>
                <div style={{...orb(13,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* descripcion */}
          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
            <p style={{...raj(13,400),color:C.white,lineHeight:1.7,marginBottom:10}}>{obj.descripcion}</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <span style={{...raj(11,600),color:C.muted}}>📦 Obtención: <span style={{color:cat.color||C.orange}}>{obj.obtenido}</span></span>
              {obj.duracion&&<span style={{...raj(11,600),color:C.muted}}>⏱️ Duración: <span style={{color:C.blue}}>{obj.duracion}min</span></span>}
              {obj.stackeable&&<span style={{...raj(11,600),color:C.teal}}>📚 Stackeable</span>}
              {obj.limitado&&<span style={{...raj(11,600),color:C.red}}>🔒 Edición Limitada</span>}
            </div>
          </div>

          {/* efectos */}
          {obj.efectos.length>0&&(
            <div>
              <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>✨ EFECTOS DEL OBJETO</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {obj.efectos.map((ef,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:C.panel,border:`1px solid ${c}22`,padding:"12px 16px"}}>
                    <span style={{fontSize:22,filter:`drop-shadow(0 0 6px ${c}88)`}}>{ef.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{...raj(13,700),color:C.white}}>{ef.label}</div>
                      <div style={{...raj(11,500),color:C.muted}}>{EFECTOS_TIPOS.find(e=>e.id===ef.tipo)?.desc}</div>
                    </div>
                    <div style={{background:`${c}18`,border:`1px solid ${c}44`,padding:"6px 14px",...orb(14,900),color:c}}>
                      {ef.tipo==="xp_mult"?`×${ef.valor}`:`+${ef.valor} ${ef.unidad}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* uso bar */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{...raj(12,600),color:C.muted}}>Popularidad ({obj.usos} usos)</span>
              {obj.stock&&<span style={{...raj(12,600),color:C.red}}>{obj.stock} en stock</span>}
            </div>
            <MiniBar val={Math.min((obj.usos/1000)*100,100)} color={c} height={7}/>
          </div>

          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:C.panel,border:`1px solid ${obj.activo?C.green:C.red}33`,padding:"10px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:obj.activo?C.green:C.red,animation:obj.activo?"o-pulse 1.5s infinite":"none"}}/>
              <span style={{...raj(13,700),color:obj.activo?C.green:C.red}}>{obj.activo?"ACTIVO":"INACTIVO"}</span>
            </div>
            <button onClick={()=>{onClose();onEdit(obj);}} className="o-btn"
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,...px(7),color:C.bg,background:C.orange,border:"none",padding:"10px",cursor:"pointer",boxShadow:`0 3px 14px ${C.orange}44`}}>
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
function FormModal({obj,onClose,onSave}) {
  const isEdit=!!obj;
  const [form,    setForm]    = useState(obj?{...obj,efectos:[...obj.efectos]}:{...EMPTY_FORM});
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [shake,   setShake]   = useState(false);
  const [tab,     setTab]     = useState("info");

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const bc=isEdit?C.orange:C.green;
  const rarMeta=RAREZA[form.rareza]||{};
  const catMeta=CATEGORIAS[form.categoria]||{};

  const validate=()=>{const e={};if(!form.nombre.trim())e.nombre="Requerido";if(!form.descripcion.trim())e.descripcion="Requerido";return e;};
  const save=async()=>{
    const e=validate();if(Object.keys(e).length){setErrors(e);setShake(true);setTimeout(()=>setShake(false),500);return;}
    setLoading(true);await new Promise(r=>setTimeout(r,900));setLoading(false);
    onSave({...form,id:obj?.id||`o${Date.now()}`,usos:obj?.usos||0,
      precio:Number(form.precio)||0,
      stock:form.stock?Number(form.stock):null,
      duracion:form.duracion?Number(form.duracion):null,
      creadoEn:obj?.creadoEn||new Date().toISOString().slice(0,10)});
    onClose();
  };

  // efectos
  const addEfecto=()=>setForm(f=>({...f,efectos:[...f.efectos,{...EMPTY_EFECTO}]}));
  const removeEfecto=(i)=>setForm(f=>({...f,efectos:f.efectos.filter((_,idx)=>idx!==i)}));
  const setEf=(i,k,v)=>setForm(f=>({...f,efectos:f.efectos.map((e,idx)=>idx===i?{...e,[k]:v}:e)}));
  const changeEfTipo=(i,tipoId)=>{
    const et=EFECTOS_TIPOS.find(e=>e.id===tipoId)||EFECTOS_TIPOS[0];
    setEf(i,"tipo",tipoId);setEf(i,"label",et.label);setEf(i,"icon",et.icon);setEf(i,"unidad",et.unit);
  };

  const inpSt=(err)=>({width:"100%",padding:"11px 14px",background:C.panel,border:`1px solid ${err?C.red:C.navy}`,color:C.white,...raj(14,500)});
  const lbl={display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"};
  const TABS=[{id:"info",l:"INFO"},{id:"rareza",l:"RAREZA & PRECIO"},{id:"efectos",l:`EFECTOS (${form.efectos.length})`}];

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:700,background:C.card,border:`1px solid ${bc}44`,
        boxShadow:`0 0 60px ${bc}0E,0 24px 60px rgba(0,0,0,.6)`,animation:"o-modalIn .25s ease both",
        overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"93vh"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${bc},transparent)`,flexShrink:0}}/>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 22px",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isEdit?<Edit2 size={15} color={C.orange}/>:<Plus size={15} color={C.green}/>}
            <span style={{...orb(12,700),color:C.white}}>{isEdit?"EDITAR OBJETO":"NUEVO OBJETO"}</span>
            {isEdit&&<span style={{...raj(12,500),color:C.muted}}>— {obj.nombre}</span>}
          </div>
          <button onClick={onClose} className="o-icon-btn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}><X size={15}/></button>
        </div>

        <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,flexShrink:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="o-btn"
              style={{flex:1,padding:"11px 0",...raj(12,tab===t.id?700:500),color:tab===t.id?bc:C.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?bc:"transparent"}`,cursor:"pointer"}}>
              {t.l}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:22}} className={shake?"o-shake":""}>

          {/* ── TAB INFO ── */}
          {tab==="info"&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* emoji + nombre */}
              <div style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:14}}>
                <div>
                  <label style={lbl}>🎨 ICONO</label>
                  {/* preview del item */}
                  <div style={{width:"100%",aspectRatio:"1",background:`${rarMeta.color||C.muted}14`,border:`2px solid ${rarMeta.color||C.navy}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,marginBottom:8,boxShadow:`inset 0 0 20px ${rarMeta.color||C.muted}14`}}>
                    {form.imagen}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
                    {EMOJIS_OBJ.map(e=>(
                      <button key={e} type="button" onClick={()=>set("imagen",e)} className="o-btn"
                        style={{fontSize:15,background:form.imagen===e?`${bc}22`:"transparent",border:`1px solid ${form.imagen===e?bc:C.navy}`,padding:"4px",cursor:"pointer"}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div>
                    <label style={lbl}>📝 NOMBRE</label>
                    <input className="o-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: Poción de XP Mayor" style={inpSt(errors.nombre)}/>
                    {errors.nombre&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.nombre}</p>}
                  </div>
                  <div>
                    <label style={lbl}>📋 DESCRIPCIÓN</label>
                    <textarea className="o-input" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} rows={4} placeholder="Describe el efecto y uso del objeto..." style={{...inpSt(errors.descripcion),resize:"vertical"}}/>
                    {errors.descripcion&&<p style={{...raj(11),color:C.red,marginTop:4}}>⚠ {errors.descripcion}</p>}
                  </div>
                </div>
              </div>

              {/* categoría */}
              <div>
                <label style={lbl}>🗂️ CATEGORÍA</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {CAT_KEYS.map(cat=>{
                    const m=CATEGORIAS[cat]; const on=form.categoria===cat;
                    return (
                      <button key={cat} type="button" onClick={()=>set("categoria",cat)} className="o-btn"
                        style={{background:on?m.bg:"transparent",border:`2px solid ${on?m.color:C.navy}`,padding:"12px 10px",cursor:"pointer",textAlign:"center",boxShadow:on?`0 0 14px ${m.color}33`:"none",transition:"all .22s"}}>
                        <div style={{fontSize:22,marginBottom:5,filter:on?`drop-shadow(0 0 6px ${m.color})`:"none"}}>{m.icon}</div>
                        <div style={{...px(6),color:on?m.color:C.muted,marginBottom:3}}>{cat.toUpperCase()}</div>
                        <div style={{...raj(9,400),color:C.muted,lineHeight:1.3}}>{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* obtención + estado */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <label style={lbl}>📦 CÓMO SE OBTIENE</label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {OBTENER_TIPOS.map(o=>{
                      const on=form.obtenido===o;
                      return (
                        <button key={o} type="button" onClick={()=>set("obtenido",o)} className="o-btn"
                          style={{display:"flex",alignItems:"center",gap:8,...raj(12,on?700:500),color:on?catMeta.color||C.orange:C.muted,background:on?`${catMeta.color||C.orange}14`:"transparent",border:`1px solid ${on?catMeta.color||C.orange:C.navy}`,padding:"9px 12px",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:on?catMeta.color||C.orange:C.navy,flexShrink:0}}/>{o}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div>
                    <label style={lbl}>● ESTADO</label>
                    {[{v:true,l:"ACTIVO",c:C.green},{v:false,l:"INACTIVO",c:C.red}].map(o=>(
                      <button key={String(o.v)} type="button" onClick={()=>set("activo",o.v)} className="o-btn"
                        style={{width:"100%",marginBottom:8,...raj(12,form.activo===o.v?700:500),color:form.activo===o.v?o.c:C.muted,background:form.activo===o.v?`${o.c}18`:"transparent",border:`1px solid ${form.activo===o.v?o.c:C.navy}`,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:form.activo===o.v?o.c:C.navy}}/>{o.l}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    {/* stackeable */}
                    <button type="button" onClick={()=>set("stackeable",!form.stackeable)} className="o-btn"
                      style={{flex:1,display:"flex",alignItems:"center",gap:8,...raj(12,700),color:form.stackeable?C.teal:C.muted,background:form.stackeable?`${C.teal}14`:"transparent",border:`1px solid ${form.stackeable?C.teal:C.navy}`,padding:"10px 12px",cursor:"pointer",transition:"all .18s"}}>
                      <Hash size={13}/> STACKEABLE
                    </button>
                  </div>
                  <div>
                    {/* limitado */}
                    <button type="button" onClick={()=>set("limitado",!form.limitado)} className="o-btn"
                      style={{width:"100%",display:"flex",alignItems:"center",gap:8,...raj(12,700),color:form.limitado?C.red:C.muted,background:form.limitado?`${C.red}14`:"transparent",border:`1px solid ${form.limitado?C.red:C.navy}`,padding:"10px 12px",cursor:"pointer",transition:"all .18s"}}>
                      <Lock size={13}/> EDICIÓN LIMITADA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB RAREZA & PRECIO ── */}
          {tab==="rareza"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* rareza visual */}
              <div>
                <label style={lbl}>💎 RAREZA DEL OBJETO</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {RAREZA_KEYS.map(rar=>{
                    const r=RAREZA[rar]; const on=form.rareza===rar;
                    const stars="★".repeat(r.tier);
                    return (
                      <button key={rar} type="button" onClick={()=>set("rareza",rar)} className="o-rar-btn"
                        style={{background:on?`${r.color}18`:"transparent",border:`2px solid ${on?r.color:C.navy}`,padding:"16px 12px",cursor:"pointer",textAlign:"center",
                          boxShadow:on?`0 0 20px ${r.color}44,inset 0 0 20px ${r.color}0A`:"none",transition:"all .22s"}}>
                        <div style={{...raj(18,900),color:r.color,marginBottom:6,
                          textShadow:on?`0 0 12px ${r.color}`:"none",
                          animation:on&&r.tier>=5?"o-glow 2s ease-in-out infinite":"none"}}>
                          {stars}
                        </div>
                        <div style={{...px(7),color:on?r.color:C.muted,marginBottom:4}}>{rar.toUpperCase()}</div>
                        <div style={{...raj(10,400),color:C.muted}}>Tier {r.tier}</div>
                      </button>
                    );
                  })}
                </div>

                {/* preview rareza */}
                {form.rareza&&(
                  <div style={{marginTop:14,background:C.panel,border:`1px solid ${RAREZA[form.rareza]?.color||C.navy}33`,padding:"14px 18px",display:"flex",alignItems:"center",gap:16}}>
                    <div style={{fontSize:36,filter:`drop-shadow(0 0 12px ${RAREZA[form.rareza]?.color})`}}>{form.imagen}</div>
                    <div>
                      <div style={{...orb(13,900),color:RAREZA[form.rareza]?.color,marginBottom:4}}>{form.nombre||"Nombre del objeto"}</div>
                      <StarRating rareza={form.rareza}/>
                    </div>
                  </div>
                )}
              </div>

              {/* precio + stock + duración */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                <div>
                  <label style={lbl}>💰 PRECIO (coins)</label>
                  <input className="o-input" type="number" min={0} value={form.precio} onChange={e=>set("precio",e.target.value)} placeholder="0 = gratis" style={inpSt(false)}/>
                  <p style={{...raj(10,400),color:C.muted,marginTop:4}}>0 = objeto gratuito</p>
                </div>
                <div>
                  <label style={lbl}>📦 STOCK</label>
                  <input className="o-input" type="number" min={1} value={form.stock||""} onChange={e=>set("stock",e.target.value)} placeholder="∞ sin límite" style={inpSt(false)}/>
                  <p style={{...raj(10,400),color:C.muted,marginTop:4}}>Vacío = sin límite</p>
                </div>
                <div>
                  <label style={lbl}>⏱️ DURACIÓN (min)</label>
                  <input className="o-input" type="number" min={1} value={form.duracion||""} onChange={e=>set("duracion",e.target.value)} placeholder="∞ permanente" style={inpSt(false)}/>
                  <p style={{...raj(10,400),color:C.muted,marginTop:4}}>Vacío = permanente</p>
                </div>
              </div>

              {/* resumen */}
              <div style={{background:C.panel,border:`1px solid ${RAREZA[form.rareza]?.color||C.navy}33`,padding:"16px 18px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[
                  {l:"PRECIO",   v:Number(form.precio)===0?"GRATIS":`${Number(form.precio).toLocaleString()} 💰`,c:Number(form.precio)===0?C.green:C.gold},
                  {l:"STOCK",    v:form.stock?`${Number(form.stock)} unidades`:"Ilimitado", c:form.limitado?C.red:C.muted},
                  {l:"DURACIÓN", v:form.duracion?`${form.duracion}min`:"Permanente",        c:form.duracion?C.blue:C.teal},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{...raj(14,700),color:s.c,marginBottom:3}}>{s.v}</div>
                    <div style={{...px(5),color:C.muted}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB EFECTOS ── */}
          {tab==="efectos"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <p style={{...raj(13,400),color:C.muted,lineHeight:1.6}}>
                Define qué hace el objeto cuando el héroe lo usa o lo equipa. Puedes añadir múltiples efectos.
              </p>

              {form.efectos.map((ef,i)=>(
                <div key={i} style={{background:C.panel,border:`1px solid ${rarMeta.color||C.navy}22`,padding:"14px 16px",position:"relative"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>TIPO DE EFECTO</label>
                      <select className="o-input" value={ef.tipo} onChange={e=>changeEfTipo(i,e.target.value)}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500),appearance:"none",cursor:"pointer"}}>
                        {EFECTOS_TIPOS.map(et=><option key={et.id} value={et.id}>{et.icon} {et.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{...lbl,marginBottom:6}}>VALOR ({ef.unidad})</label>
                      <input className="o-input" type="number" min={0} step={ef.tipo==="xp_mult"?0.1:1}
                        value={ef.valor} onChange={e=>setEf(i,"valor",Number(e.target.value))}
                        placeholder={EFECTOS_TIPOS.find(e=>e.id===ef.tipo)?.unit}
                        style={{width:"100%",padding:"9px 12px",background:C.card,border:`1px solid ${C.navy}`,color:C.white,...raj(14,600)}}/>
                    </div>
                    <button type="button" onClick={()=>removeEfecto(i)} className="o-icon-btn"
                      style={{background:"transparent",border:`1px solid ${C.red}33`,padding:"9px",color:C.red,display:"flex",alignItems:"center",alignSelf:"flex-end"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${C.red}18`;e.currentTarget.style.borderColor=C.red;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${C.red}33`;}}><Trash2 size={13}/></button>
                  </div>
                  {/* preview efecto */}
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:C.card,border:`1px solid ${rarMeta.color||C.navy}22`}}>
                    <span style={{fontSize:20,filter:`drop-shadow(0 0 6px ${rarMeta.color||C.orange})`}}>{ef.icon}</span>
                    <div style={{flex:1}}>
                      <span style={{...raj(12,700),color:C.white}}>{ef.label}</span>
                      <span style={{...raj(11,500),color:C.muted,marginLeft:8}}>{EFECTOS_TIPOS.find(e=>e.id===ef.tipo)?.desc}</span>
                    </div>
                    <span style={{...orb(13,900),color:rarMeta.color||C.orange}}>
                      {ef.tipo==="xp_mult"?`×${ef.valor}`:`+${ef.valor} ${ef.unidad}`}
                    </span>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addEfecto} className="o-btn"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,...raj(13,700),color:rarMeta.color||C.orange,background:`${rarMeta.color||C.orange}0D`,border:`2px dashed ${rarMeta.color||C.orange}44`,padding:"14px",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${rarMeta.color||C.orange}18`;e.currentTarget.style.borderStyle="solid";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${rarMeta.color||C.orange}0D`;e.currentTarget.style.borderStyle="dashed";}}>
                <Plus size={16}/> AÑADIR EFECTO
              </button>

              {/* referencia */}
              <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px"}}>
                <div style={{...px(6),color:C.muted,marginBottom:10,letterSpacing:".05em"}}>📖 REFERENCIA DE EFECTOS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {EFECTOS_TIPOS.map(et=>(
                    <div key={et.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,border:`1px solid ${C.navy}33`}}>
                      <span style={{fontSize:16}}>{et.icon}</span>
                      <div>
                        <div style={{...raj(11,700),color:C.white}}>{et.label}</div>
                        <div style={{...raj(9,400),color:C.muted}}>Unidad: {et.unit} · {et.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:10,padding:"15px 22px",borderTop:`1px solid ${C.navy}`,flexShrink:0}}>
          <button onClick={onClose} className="o-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 20px",cursor:"pointer"}}>CANCELAR</button>
          <button onClick={save} disabled={loading} className="o-btn"
            style={{flex:1,...px(8),color:loading?C.muted:C.bg,background:loading?`${bc}55`:bc,border:"none",padding:"12px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 4px 20px ${bc}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            {loading?<><Spinner color={bc}/> GUARDANDO...</>:<><Check size={14}/> {isEdit?"GUARDAR CAMBIOS":"CREAR OBJETO"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — ELIMINAR
// ══════════════════════════════════════════════════════════════
function DeleteModal({obj,onClose,onConfirm}) {
  const [typed,setTyped]=useState("");
  const [loading,setLoading]=useState(false);
  const match=typed===obj.nombre;
  const confirm=async()=>{if(!match)return;setLoading(true);await new Promise(r=>setTimeout(r,700));setLoading(false);onConfirm(obj.id);onClose();};
  const c=RAREZA[obj.rareza]?.color||C.orange;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:420,background:C.card,border:`1px solid ${C.red}44`,boxShadow:`0 0 60px ${C.red}14,0 24px 60px rgba(0,0,0,.6)`,animation:"o-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>
        <div style={{padding:"22px 24px 26px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex"}}><AlertTriangle size={22} color={C.red}/></div>
            <div><div style={{...orb(13,900),color:C.red,marginBottom:3}}>ELIMINAR OBJETO</div><div style={{...raj(12,500),color:C.muted}}>Esta acción no se puede deshacer</div></div>
          </div>
          <div style={{background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:"12px 16px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:40,height:40,background:`${c}18`,border:`1px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{obj.imagen}</div>
            <div>
              <div style={{...raj(14,700),color:C.red}}>{obj.nombre}</div>
              <div style={{...raj(12,400),color:C.muted}}>{obj.categoria} · {obj.rareza} · {obj.usos} usos</div>
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",...px(6),color:C.muted,marginBottom:8,letterSpacing:".06em"}}>ESCRIBE <span style={{color:C.red}}>{obj.nombre}</span> PARA CONFIRMAR</label>
            <input className="o-input" value={typed} onChange={e=>setTyped(e.target.value)} placeholder={obj.nombre}
              style={{width:"100%",padding:"12px 14px",background:C.panel,border:`1px solid ${match?C.red:C.navy}`,color:C.white,...raj(14,600)}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="o-btn" style={{flex:"0 0 auto",...raj(13,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"12px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={confirm} disabled={!match||loading} className="o-btn"
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
export default function AdminObjetos() {
  const [objetos,    setObjetos]    = useState(MOCK_OBJETOS);
  const [catTab,     setCatTab]     = useState("Todos");
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
  const [modal,      setModal]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh=async()=>{setRefreshing(true);await new Promise(r=>setTimeout(r,800));setRefreshing(false);};

  const filtered=useMemo(()=>{
    let list=[...objetos];
    if(catTab!=="Todos")  list=list.filter(o=>o.categoria===catTab);
    if(search)            list=list.filter(o=>o.nombre.toLowerCase().includes(search.toLowerCase())||o.descripcion.toLowerCase().includes(search.toLowerCase()));
    if(filterRar!=="all") list=list.filter(o=>o.rareza===filterRar);
    if(filterAct!=="all") list=list.filter(o=>String(o.activo)===(filterAct==="active"?"true":"false"));
    if(filterLim!=="all") list=list.filter(o=>filterLim==="limited"?o.limitado:!o.limitado);
    list.sort((a,b)=>{const av=a[sortKey]??"";const bv=b[sortKey]??"";return sortDir==="asc"?(av>bv?1:-1):(av<bv?1:-1);});
    return list;
  },[objetos,catTab,search,filterRar,filterAct,filterLim,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);
  const sort=(k)=>{if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortKey(k);setSortDir("asc");}};
  const toggleSelect=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSelected(s=>s.size===paginated.length?new Set():new Set(paginated.map(o=>o.id)));
  const handleSave=(saved)=>setObjetos(os=>{const i=os.findIndex(o=>o.id===saved.id);if(i>=0){const a=[...os];a[i]=saved;return a;}return[saved,...os];});
  const handleDelete=(id)=>{setObjetos(os=>os.filter(o=>o.id!==id));setSelected(s=>{const n=new Set(s);n.delete(id);return n;});};
  const bulkDelete=()=>{setObjetos(os=>os.filter(o=>!selected.has(o.id)));setSelected(new Set());};
  const bulkToggle=(activo)=>setObjetos(os=>os.map(o=>selected.has(o.id)?{...o,activo}:o));

  const kpis=useMemo(()=>({
    total:    objetos.length,
    activos:  objetos.filter(o=>o.activo).length,
    usos:     objetos.reduce((s,o)=>s+o.usos,0),
    limitados:objetos.filter(o=>o.limitado).length,
  }),[objetos]);

  const fBtn=(on,c=C.orange)=>({...raj(11,on?700:600),color:on?c:C.muted,background:on?`${c}18`:"transparent",border:`1px solid ${on?c:C.navy}`,padding:"5px 12px",cursor:"pointer",transition:"all .18s"});

  return (
    <>
      <style>{CSS}</style>

      {modal?.type==="view"   && <ViewModal   obj={modal.o}   onClose={()=>setModal(null)} onEdit={o=>setModal({type:"form",o})}/>}
      {modal?.type==="form"   && <FormModal   obj={modal.o}   onClose={()=>setModal(null)} onSave={handleSave}/>}
      {modal?.type==="delete" && <DeleteModal obj={modal.o}   onClose={()=>setModal(null)} onConfirm={handleDelete}/>}

      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"OBJETOS TOTALES",value:kpis.total,    icon:<Package size={18}/>,  color:C.orange},
            {label:"ACTIVOS",        value:kpis.activos,  icon:<Zap size={18}/>,      color:C.green },
            {label:"USOS TOTALES",   value:kpis.usos.toLocaleString(),icon:<BarChart2 size={18}/>,color:C.blue},
            {label:"EDIC. LIMITADA", value:kpis.limitados,icon:<Star size={18}/>,     color:C.red   },
          ].map((k,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${k.color}33`,padding:"18px 16px",position:"relative",overflow:"hidden",animation:`o-cardIn .4s ease ${i*.07}s both`,transition:"transform .2s,box-shadow .2s"}}
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
          <div style={{display:"flex",borderBottom:`1px solid ${C.navy}`,overflowX:"auto"}}>
            {["Todos",...CAT_KEYS].map(cat=>{
              const m=CATEGORIAS[cat]; const on=catTab===cat; const cc=m?.color||C.orange;
              const count=cat==="Todos"?objetos.length:objetos.filter(o=>o.categoria===cat).length;
              return (
                <button key={cat} onClick={()=>{setCatTab(cat);setPage(1);}} className="o-cat-tab"
                  style={{flex:"0 0 auto",padding:"14px 18px",background:on?`${cc}12`:"transparent",border:"none",borderBottom:`3px solid ${on?cc:"transparent"}`,color:on?cc:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:90,transition:"all .22s"}}>
                  <div style={{fontSize:18,filter:on?`drop-shadow(0 0 6px ${cc})`:"none"}}>{m?.icon||"🌐"}</div>
                  <span style={{...raj(11,on?700:500),whiteSpace:"nowrap"}}>{cat}</span>
                  <span style={{...raj(9,700),color:on?cc:C.navy,background:on?`${cc}22`:`${C.navy}44`,padding:"1px 6px"}}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"13px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 200px"}}>
              <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
              <input className="o-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Buscar objeto..."
                style={{width:"100%",padding:"8px 12px 8px 30px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
            </div>
            <div style={{display:"flex",gap:4}}>
              {[{v:"grid",i:"⊞"},{v:"table",i:"≡"}].map(({v,i})=>(
                <button key={v} onClick={()=>setView(v)} className="o-btn"
                  style={{...raj(14,700),color:view===v?C.orange:C.muted,background:view===v?`${C.orange}18`:C.panel,border:`1px solid ${view===v?C.orange:C.navy}`,padding:"7px 12px",cursor:"pointer"}}>{i}</button>
              ))}
            </div>

            {/* rareza filter */}
            <span style={{...raj(11,600),color:C.muted}}>Rareza:</span>
            {["all",...RAREZA_KEYS].map(v=>{
              const r=RAREZA[v];
              return <button key={v} onClick={()=>{setFilterRar(v);setPage(1);}} className="o-btn" style={fBtn(filterRar===v,r?.color||C.orange)}>{v==="all"?"Todas":v}</button>;
            })}

            <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
            {[{v:"all",l:"Todos"},{v:"active",l:"● Activos"},{v:"inactive",l:"● Inactivos"}].map(o=><button key={o.v} onClick={()=>{setFilterAct(o.v);setPage(1);}} className="o-btn" style={fBtn(filterAct===o.v,o.v==="active"?C.green:C.red)}>{o.l}</button>)}
            {[{v:"all",l:"Todos"},{v:"limited",l:"🔒 Limitados"},{v:"unlimited",l:"∞ Ilimitados"}].map(o=><button key={o.v} onClick={()=>{setFilterLim(o.v);setPage(1);}} className="o-btn" style={fBtn(filterLim===o.v,o.v==="limited"?C.red:C.teal)}>{o.l}</button>)}

            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              {selected.size>0&&(<>
                <button onClick={()=>bulkToggle(true)} className="o-btn" style={{...raj(11,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Check size={12}/> Activar ({selected.size})</button>
                <button onClick={()=>bulkToggle(false)} className="o-btn" style={{...raj(11,700),color:C.orange,background:`${C.orange}14`,border:`1px solid ${C.orange}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><X size={12}/> Desactivar ({selected.size})</button>
                <button onClick={bulkDelete} className="o-btn" style={{...raj(11,700),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}44`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Trash2 size={12}/> Eliminar ({selected.size})</button>
              </>)}
              <button onClick={refresh} className="o-btn" style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"7px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <RefreshCw size={12} style={{animation:refreshing?"o-spin .8s linear infinite":"none"}}/> Actualizar
              </button>
              <button onClick={()=>setModal({type:"form",o:null})} className="o-btn"
                style={{...px(7),color:C.bg,background:C.green,border:"none",padding:"7px 14px",cursor:"pointer",boxShadow:`0 3px 14px ${C.green}33`,display:"flex",alignItems:"center",gap:6}}>
                <Plus size={13}/> NUEVO
              </button>
            </div>
          </div>
        </div>

        <div style={{...raj(12,500),color:C.muted}}>
          {filtered.length} objeto{filtered.length!==1?"s":""} · página {page}/{totalPages}
          {selected.size>0&&<span style={{color:C.orange,marginLeft:12}}>{selected.size} seleccionado{selected.size!==1?"s":""}</span>}
        </div>

        {/* GRID */}
        {view==="grid"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
            {paginated.length===0?<div style={{gridColumn:"1/-1",padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((o,i)=>{
              const r=RAREZA[o.rareza]||{color:C.muted};
              const cat=CATEGORIAS[o.categoria]||{};
              const sel=selected.has(o.id);
              return (
                <div key={o.id} className="o-card" style={{background:C.card,border:`2px solid ${sel?C.orange:r.color}22`,
                  boxShadow:sel?`0 0 18px ${C.orange}22,inset 0 0 20px ${C.orange}05`:`0 4px 16px rgba(0,0,0,.3)`,
                  overflow:"hidden",animation:`o-cardIn .4s ease ${i*.05}s both`,position:"relative"}}>
                  <input type="checkbox" checked={sel} onChange={()=>toggleSelect(o.id)} style={{position:"absolute",top:10,left:10,accentColor:C.orange,width:14,height:14,cursor:"pointer",zIndex:2}}/>
                  {/* rareza gradient */}
                  <div style={{height:3,background:`linear-gradient(90deg,transparent,${r.color},transparent)`}}/>

                  <div style={{padding:"16px 16px 0"}}>
                    {/* item display */}
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                      <div style={{width:52,height:52,background:`${r.color}18`,border:`2px solid ${r.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,
                        boxShadow:`inset 0 0 16px ${r.color}14`,animation:"o-float 3s ease-in-out infinite"}}>
                        {o.imagen}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{...raj(13,700),color:C.white,marginBottom:4,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.nombre}</div>
                        <CatBadge cat={o.categoria}/>
                        <StarRating rareza={o.rareza}/>
                      </div>
                    </div>

                    <RarezaBadge rareza={o.rareza}/>

                    {/* desc */}
                    <p style={{...raj(11,400),color:C.muted,lineHeight:1.5,marginTop:8,marginBottom:10,
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {o.descripcion}
                    </p>

                    {/* efectos preview */}
                    {o.efectos.length>0&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                        {o.efectos.map((ef,idx)=>(
                          <span key={idx} style={{...raj(10,600),color:r.color,background:`${r.color}12`,border:`1px solid ${r.color}22`,padding:"2px 6px",display:"inline-flex",alignItems:"center",gap:3}}>
                            {ef.icon} {ef.tipo==="xp_mult"?`×${ef.valor}`:`+${ef.valor}${ef.unidad}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* stats grid */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                      <div style={{background:C.panel,border:`1px solid ${C.gold}18`,padding:"6px 8px",textAlign:"center"}}>
                        <div style={{...raj(12,700),color:o.precio===0?C.green:C.gold}}>{o.precio===0?"GRATIS":o.precio.toLocaleString()}</div>
                        <div style={{...px(4),color:C.muted}}>PRECIO</div>
                      </div>
                      <div style={{background:C.panel,border:`1px solid ${C.blue}18`,padding:"6px 8px",textAlign:"center"}}>
                        <div style={{...raj(12,700),color:C.blue}}>{o.usos.toLocaleString()}</div>
                        <div style={{...px(4),color:C.muted}}>USOS</div>
                      </div>
                    </div>

                    {/* tags */}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                      <span style={{...raj(10,600),color:o.activo?C.green:C.red,background:o.activo?`${C.green}14`:`${C.red}14`,border:`1px solid ${o.activo?C.green:C.red}33`,padding:"2px 7px"}}>{o.activo?"● ACTIVO":"● INACTIVO"}</span>
                      {o.limitado&&<span style={{...raj(10,600),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}33`,padding:"2px 7px"}}>🔒 LIMITADO</span>}
                      {o.stock&&<span style={{...raj(10,600),color:C.muted,background:`${C.muted}14`,border:`1px solid ${C.muted}33`,padding:"2px 7px"}}>📦 {o.stock}</span>}
                      {o.stackeable&&<span style={{...raj(10,600),color:C.teal,background:`${C.teal}14`,border:`1px solid ${C.teal}33`,padding:"2px 7px"}}>📚 STACK</span>}
                    </div>

                    <MiniBar val={Math.min((o.usos/1000)*100,100)} color={r.color} height={4}/>
                  </div>

                  <div style={{borderTop:`1px solid ${C.navy}33`,marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",o}),l:"Ver"},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",o}),l:"Editar"},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",o}),l:"Borrar"}].map(({Icon,c:ic,fn,l},j)=>(
                      <button key={j} onClick={fn} className="o-btn"
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
            <div style={{display:"grid",gridTemplateColumns:"34px 2fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.6fr 0.6fr 95px",padding:"10px 14px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:8,alignItems:"center"}}>
              <input type="checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
              {[{l:"OBJETO",k:"nombre"},{l:"CATEGORÍA",k:"categoria"},{l:"RAREZA",k:"rareza"},{l:"EFECTOS",k:null},{l:"PRECIO",k:"precio"},{l:"USOS",k:"usos"},{l:"STOCK",k:"stock"},{l:"ESTADO",k:"activo"}].map((h,i)=>(
                <div key={i} className={h.k?"o-sort":""} onClick={()=>h.k&&sort(h.k)}
                  style={{display:"flex",alignItems:"center",gap:3,...px(5),color:sortKey===h.k?C.orange:C.muted,letterSpacing:".05em"}}>
                  {h.l}{h.k&&<SortIcon active={sortKey===h.k} dir={sortDir}/>}
                </div>
              ))}
              <span style={{...px(5),color:C.muted,letterSpacing:".05em"}}>ACC.</span>
            </div>

            {paginated.length===0?<div style={{padding:40,textAlign:"center",...raj(14,500),color:C.muted}}>Sin resultados.</div>
            :paginated.map((o,i)=>{
              const r=RAREZA[o.rareza]||{color:C.muted};
              return (
                <div key={o.id} className="o-row" style={{display:"grid",gridTemplateColumns:"34px 2fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.6fr 0.6fr 95px",padding:"11px 14px",borderBottom:`1px solid ${C.navy}22`,gap:8,alignItems:"center",animation:`o-slideU .3s ease ${i*.04}s both`,background:selected.has(o.id)?`${C.orange}08`:"transparent"}}>
                  <input type="checkbox" checked={selected.has(o.id)} onChange={()=>toggleSelect(o.id)} style={{accentColor:C.orange,width:14,height:14,cursor:"pointer"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                    <div style={{width:34,height:34,background:`${r.color}18`,border:`2px solid ${r.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{o.imagen}</div>
                    <div style={{minWidth:0}}>
                      <div style={{...raj(13,700),color:C.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.nombre}</div>
                      <div style={{display:"flex",gap:4,marginTop:2}}>
                        {o.limitado&&<span style={{...raj(9,700),color:C.red}}>🔒</span>}
                        {o.stackeable&&<span style={{...raj(9,700),color:C.teal}}>📚</span>}
                      </div>
                    </div>
                  </div>
                  <CatBadge cat={o.categoria}/>
                  <RarezaBadge rareza={o.rareza}/>
                  <div style={{display:"flex",gap:3}}>
                    {o.efectos.slice(0,2).map((ef,idx)=><span key={idx} style={{fontSize:14}}>{ef.icon}</span>)}
                    {o.efectos.length>2&&<span style={{...raj(9,600),color:C.muted}}>+{o.efectos.length-2}</span>}
                    {o.efectos.length===0&&<span style={{...raj(10,500),color:C.navy}}>—</span>}
                  </div>
                  <span style={{...raj(12,700),color:o.precio===0?C.green:C.gold}}>{o.precio===0?"GRATIS":o.precio.toLocaleString()}</span>
                  <div><div style={{...raj(11,700),color:C.blue,marginBottom:2}}>{o.usos.toLocaleString()}</div><MiniBar val={Math.min((o.usos/1000)*100,100)} color={C.blue} height={3}/></div>
                  <span style={{...raj(11,600),color:o.stock?C.muted:C.teal}}>{o.stock?`📦 ${o.stock}`:"∞"}</span>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:o.activo?C.green:C.red,animation:o.activo?"o-pulse 1.8s infinite":"none"}}/>
                    <span style={{...raj(10,600),color:o.activo?C.green:C.red}}>{o.activo?"ON":"OFF"}</span>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[{Icon:Eye,c:C.blue,fn:()=>setModal({type:"view",o})},{Icon:Edit2,c:C.orange,fn:()=>setModal({type:"form",o})},{Icon:Trash2,c:C.red,fn:()=>setModal({type:"delete",o})}].map(({Icon,c:ic,fn},j)=>(
                      <button key={j} onClick={fn} className="o-icon-btn"
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
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} className="o-input"
              style={{padding:"6px 10px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...raj(12,500),cursor:"pointer"}}>
              {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setPage(1)} disabled={page===1} className="o-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 11px",cursor:page===1?"not-allowed":"pointer"}}>«</button>
            <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="o-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"6px 10px",cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className="o-btn"
                style={{background:n===page?C.orange:C.panel,border:`1px solid ${n===page?C.orange:C.navy}`,color:n===page?C.bg:C.muted,padding:"6px 13px",cursor:"pointer",...raj(13,n===page?700:500)}}>
                {n}
              </button>
            ))}
            <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="o-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 10px",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><ChevronRight size={13}/></button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} className="o-btn" style={{background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"6px 11px",cursor:page===totalPages?"not-allowed":"pointer"}}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}