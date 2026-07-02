// src/pages/admin/AdminMensajes.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  MessageSquare, Send, Trash2, Users, User,
  AlertTriangle, CheckCircle, Megaphone, Zap, Calendar,
  Trophy, X, Clock, Eye, Tag, Globe, FileText, Archive,
  Image, Edit3, Check,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.js";
import {
  collection, query, limit, onSnapshot, orderBy, getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.js";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import app from "../../firebase.js";
import { sendAdminMessage, deleteAdminMessage } from "../../services/api.js";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";

const storage  = getStorage(app);
const BASE_URL = "http://localhost:4000/api";

// ── Wine Aurora preview palette (matches UserMensajes) ─────────
const WA = { bg:"#180A1C", line:"#2A1538", text:"#F5E6EC", muted:"#A08090", accent:"#C9184A" };

// ── Tag definitions ────────────────────────────────────────────
const TAGS_DEF = [
  { k:"importante", l:"#Importante", c:C.red    },
  { k:"social",     l:"#Social",     c:C.purple },
  { k:"sistema",    l:"#Sistema",    c:C.muted  },
  { k:"evento",     l:"#Evento",     c:C.teal   },
  { k:"urgente",    l:"#Urgente",    c:C.orange },
  { k:"logro",      l:"#Logro",      c:C.gold   },
];

const ACCENT_PALETTE = [C.blue, C.orange, C.green, C.red, C.purple, C.gold, C.teal, C.rose];

const STATUS_META = {
  published: { label:"Publicado", color:C.green,  icon:Globe    },
  draft:     { label:"Borrador",  color:C.muted,  icon:FileText },
  archived:  { label:"Archivado", color:C.orange, icon:Archive  },
};

const MSG_TYPES = [
  { id:"announcement", icon:Megaphone,     label:"Anuncio",    color:C.blue,   desc:"Novedad o información general" },
  { id:"warning",      icon:AlertTriangle, label:"Aviso",      color:C.orange, desc:"Atención requerida"            },
  { id:"system",       icon:Zap,           label:"Sistema",    color:C.muted,  desc:"Actualización de la plataforma"},
  { id:"achievement",  icon:Trophy,        label:"Logro",      color:C.gold,   desc:"Premio especial a usuarios"    },
  { id:"event",        icon:Calendar,      label:"Evento",     color:C.purple, desc:"Actividad o temporada activa"  },
];

// ── Font helpers ───────────────────────────────────────────────
const mono = (s, w = 500) => ({ fontFamily:"'JetBrains Mono',ui-monospace,monospace", fontSize:s, fontWeight:w });

function countdown(isoDate) {
  if (!isoDate) return null;
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 48) return `${Math.floor(h / 24)}d`;
  if (h >= 1)  return `${h}h ${m}m`;
  return `${m}m`;
}

// ── CSS ────────────────────────────────────────────────────────
const CSS = `
  @keyframes am-fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes am-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes am-pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes am-ping    { 0%{transform:scale(1);opacity:.8} 80%,100%{transform:scale(2);opacity:0} }
  @keyframes am-slideIn { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes am-shimmer { 0%{background-position:-300px 0} 100%{background-position:300px 0} }
  @keyframes m-skel-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .am-btn  { transition:all .18s ease; cursor:pointer; }
  .am-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.3); }
  .am-btn:disabled { opacity:.45; cursor:not-allowed; }
  .am-input{ transition:border-color .18s,box-shadow .18s; outline:none; }
  .am-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .am-input::placeholder { color:${C.muted}55; }
  .am-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}44 50%,${C.card} 75%); background-size:300px 100%; animation:am-shimmer 1.4s infinite linear; }
  .m-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}55 50%,${C.card} 75%); background-size:400px 100%; animation:m-skel-shimmer 1.5s infinite linear; }
  .am-pill { transition:all .15s; cursor:pointer; }
  .am-pill:hover { filter:brightness(1.08); }
  .am-hcard { transition:filter .14s; }
  .am-hcard:hover { filter:brightness(1.03); }
  .am-swatch { transition:all .16s; cursor:pointer; border-radius:50%; }
  .am-swatch:hover { transform:scale(1.15); }
`;

// ── Shared sub-components ──────────────────────────────────────
function Spinner({ color = C.orange, size = 14 }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid ${C.muted}22`,
      borderTop:`2px solid ${color}`, borderRadius:"50%",
      animation:"am-spin .8s linear infinite", flexShrink:0 }}/>
  );
}

function TagChip({ tag, selected, onClick }) {
  return (
    <button onClick={onClick} className="am-pill"
      style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px",
        background: selected ? `${tag.c}18` : C.panel,
        border:`1px solid ${selected ? tag.c : C.navy}`, borderRadius:20,
        color: selected ? tag.c : C.mutedL,
        ...raj(11, selected ? 700 : 500) }}>
      <Tag size={9}/>{tag.l}
    </button>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button onClick={onClick} className="am-swatch"
      style={{ width:22, height:22, background:color, flexShrink:0,
        border:`2px solid ${selected ? C.white : "transparent"}`,
        boxShadow: selected ? `0 0 0 3px ${color}44` : "none" }}/>
  );
}

function BannerDrop({ imageUrl, onFile, uploading, uploadPct }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{ position:"relative", width:"100%", paddingBottom:"56.25%",
        background: drag ? `${C.blue}12` : C.panel,
        border:`2px dashed ${drag ? C.blue : imageUrl ? C.teal : C.navy}`,
        borderRadius:8, overflow:"hidden",
        cursor: uploading ? "default" : "pointer",
        transition:"all .18s" }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}/>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:8 }}>
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="banner"
              style={{ position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", opacity:0.7 }}/>
            <div style={{ position:"relative", zIndex:1, background:"rgba(0,0,0,.55)",
              border:`1px solid ${C.teal}55`, padding:"4px 10px", borderRadius:4 }}>
              <span style={{ ...raj(11, 700), color:C.teal }}>CAMBIAR IMAGEN</span>
            </div>
          </>
        ) : uploading ? (
          <><Spinner color={C.teal} size={20}/><span style={{ ...raj(11, 600), color:C.teal }}>{uploadPct}%</span></>
        ) : (
          <><Image size={24} color={C.muted}/>
            <span style={{ ...raj(11, 500), color:C.muted }}>
              Arrastra o haz clic · banner 16:9
            </span>
          </>
        )}
      </div>
      {uploading && (
        <div style={{ position:"absolute", bottom:0, left:0, height:3, background:C.teal,
          width:`${uploadPct}%`, transition:"width .3s ease" }}/>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:14,
      padding:16, marginBottom:8 }}>
      <div className="am-skel" style={{ height:12, width:"40%", marginBottom:8, borderRadius:4 }}/>
      <div className="am-skel" style={{ height:16, width:"75%", marginBottom:6, borderRadius:4 }}/>
      <div className="am-skel" style={{ height:12, width:"90%", borderRadius:4 }}/>
    </div>
  );
}

// Wine Aurora preview — faithful replica of UserMensajes MessageCard
function UserPreviewCard({ title, text, type, accentColor, tags, imageUrl }) {
  const typeMeta = MSG_TYPES.find(t => t.id === type) || MSG_TYPES[0];
  const cardColor = accentColor || typeMeta.color;
  const tagDefs = TAGS_DEF.filter(t => (tags || []).includes(t.k));
  const Icon = typeMeta.icon;

  return (
    <div style={{ background:WA.bg, padding:16, borderRadius:8 }}>
      <div style={{ position:"relative", overflow:"hidden",
        background:`${cardColor}0a`, border:`1px solid ${cardColor}44`,
        boxShadow:`0 0 0 1px ${cardColor}22, 0 4px 20px rgba(0,0,0,0.4)` }}>
        {/* Left accent bar */}
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3,
          background:`linear-gradient(180deg,${cardColor},${cardColor}44)` }}/>
        {/* Top glow line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg,transparent,${cardColor}55,transparent)` }}/>
        {imageUrl && (
          <img src={imageUrl} alt="banner"
            style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", opacity:0.85 }}/>
        )}
        <div style={{ padding:"14px 16px 14px 20px", display:"flex", gap:12 }}>
          <div style={{ background:`${cardColor}18`, border:`1px solid ${cardColor}33`,
            padding:9, display:"flex", flexShrink:0, marginTop:1 }}>
            <Icon size={16} color={cardColor}
              style={{ filter:`drop-shadow(0 0 5px ${cardColor}99)` }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
              <span style={{ ...mono(10, 700), color:cardColor, letterSpacing:".08em",
                background:`${cardColor}14`, border:`1px solid ${cardColor}33`, padding:"2px 8px" }}>
                {typeMeta.label.toUpperCase()}
              </span>
              <span style={{ ...mono(9, 800), color:WA.accent, letterSpacing:".08em",
                background:`${WA.accent}14`, border:`1px solid ${WA.accent}33`, padding:"2px 7px",
                animation:"am-pulse 1.2s infinite" }}>
                NUEVO
              </span>
              <span style={{ ...mono(9, 400), color:WA.muted, marginLeft:"auto" }}>
                <Clock size={9} style={{ verticalAlign:"middle", marginRight:3 }}/>ahora
              </span>
            </div>
            {title && (
              <div style={{ ...mono(12, 700), color:WA.text, marginBottom:4, lineHeight:1.4 }}>
                {title}
              </div>
            )}
            <p style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:500,
              color: text ? WA.text : WA.muted, lineHeight:1.65, margin:0 }}>
              {text || "Escribe un mensaje para previsualizar..."}
            </p>
            {tagDefs.length > 0 && (
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
                {tagDefs.map(t => (
                  <span key={t.k} style={{ ...mono(9, 600), color:t.c,
                    background:`${t.c}14`, border:`1px solid ${t.c}33`, padding:"1px 6px" }}>
                    {t.l}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:8 }}>
              <Check size={12} color={WA.muted}/>
              <span style={{ ...mono(10, 500), color:WA.muted }}>Sin leer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeCard({ type, selected, onClick }) {
  const Icon = type.icon;
  return (
    <button onClick={onClick} className="am-btn"
      style={{ background: selected ? `${type.color}18` : C.panel,
        border:`1px solid ${selected ? type.color : C.navy}`, borderRadius:10,
        padding:"12px 10px", display:"flex", flexDirection:"column",
        alignItems:"center", gap:6, cursor:"pointer", flex:1, minWidth:72,
        boxShadow: selected ? `0 0 12px ${type.color}22` : "none",
        transition:"all .18s" }}>
      <Icon size={18} color={selected ? type.color : C.muted}
        style={{ filter: selected ? `drop-shadow(0 0 6px ${type.color}66)` : "none" }}/>
      <span style={{ ...raj(12, selected ? 700 : 500), color: selected ? type.color : C.mutedL }}>
        {type.label}
      </span>
    </button>
  );
}

function HistoryCard({ msg, onDelete, onEdit, deleting, userCount }) {
  const typeMeta   = MSG_TYPES.find(t => t.id === msg.type) || MSG_TYPES[0];
  const statusMeta = STATUS_META[msg.status] || STATUS_META.published;
  const StatusIcon = statusMeta.icon;
  const Icon       = typeMeta.icon;
  const accentColor = msg.accentColor || typeMeta.color;
  const cd = msg.publishAt ? countdown(msg.publishAt) : null;
  const readPct = userCount > 0 ? Math.round((msg.readCount || 0) / userCount * 100) : 0;
  const tagDefs = TAGS_DEF.filter(t => (msg.tags || []).includes(t.k));
  const date = msg.createdAt ? new Date(msg.createdAt).toLocaleString("es-EC", {
    day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit",
  }) : "—";

  return (
    <div className="am-hcard" style={{ background:C.card, borderRadius:14,
      border:`1px solid ${C.navy}`, borderLeft:`3px solid ${accentColor}88`,
      marginBottom:8, overflow:"hidden", animation:"am-fadeUp .3s ease", transition:"transform .18s,box-shadow .18s" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
      {msg.imageUrl && (
        <img src={msg.imageUrl} alt="banner"
          style={{ width:"100%", aspectRatio:"16/9", objectFit:"cover", opacity:0.8,
            borderBottom:`1px solid ${C.navy}` }}/>
      )}
      <div style={{ padding:"12px 16px" }}>
        {/* Badges */}
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          <span style={{ display:"flex", alignItems:"center", gap:4, ...raj(10, 700),
            color:accentColor, background:`${accentColor}14`, border:`1px solid ${accentColor}33`,
            padding:"2px 8px", borderRadius:20 }}>
            <Icon size={10}/>{typeMeta.label.toUpperCase()}
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:4, ...raj(10, 600),
            color:statusMeta.color, background:`${statusMeta.color}10`,
            border:`1px solid ${statusMeta.color}33`, padding:"2px 8px", borderRadius:20 }}>
            <StatusIcon size={9}/>{statusMeta.label}
          </span>
          {cd && (
            <span style={{ display:"flex", alignItems:"center", gap:4, ...raj(10, 600),
              color:C.gold, background:`${C.gold}10`, border:`1px solid ${C.gold}33`, padding:"2px 8px", borderRadius:20 }}>
              <Clock size={9}/>{cd}
            </span>
          )}
          {tagDefs.map(t => (
            <span key={t.k} style={{ ...raj(9, 600), color:t.c,
              background:`${t.c}0c`, border:`1px solid ${t.c}22`, padding:"2px 6px", borderRadius:20 }}>
              {t.l}
            </span>
          ))}
          <span style={{ ...raj(10, 400), color:C.muted, marginLeft:"auto" }}>
            <Clock size={9} style={{ verticalAlign:"middle", marginRight:3 }}/>{date}
          </span>
        </div>
        {msg.title && (
          <div style={{ ...raj(14, 700), color:C.white, marginBottom:4, lineHeight:1.4 }}>
            {msg.title}
          </div>
        )}
        <p style={{ ...raj(12, 400), color:C.mutedL, lineHeight:1.5, margin:"0 0 10px",
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {msg.text}
        </p>
        {/* Read count + progress bar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <Eye size={11} color={C.muted}/>
          <span style={{ ...raj(11, 500), color:C.muted, flexShrink:0 }}>
            {msg.readCount || 0} leídos{userCount > 0 ? ` (${readPct}%)` : ""}
          </span>
          {userCount > 0 && (
            <div style={{ flex:1, height:3, background:C.navy, borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${readPct}%`, background:accentColor,
                borderRadius:2, transition:"width .5s ease" }}/>
            </div>
          )}
        </div>
        {/* Actions */}
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onEdit(msg)} className="am-btn"
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
              background:`${C.blue}10`, border:`1px solid ${C.blue}33`,
              color:C.blue, borderRadius:6, ...raj(11, 600) }}>
            <Edit3 size={11}/>Editar
          </button>
          <button onClick={() => onDelete(msg.id)} disabled={deleting === msg.id} className="am-btn"
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
              background:"transparent", border:`1px solid ${C.red}33`,
              color:C.red, borderRadius:6, ...raj(11, 600) }}>
            {deleting === msg.id ? <Spinner color={C.red} size={11}/> : <Trash2 size={11}/>}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    title:       item.title || "",
    text:        item.text  || "",
    type:        item.type  || "announcement",
    accentColor: item.accentColor || C.blue,
    tags:        item.tags  || [],
    status:      item.status || "published",
    publishAt:   item.publishAt ? item.publishAt.slice(0, 16) : "",
  });
  const [saving, setSaving] = useState(false);

  const toggleTag = k =>
    setForm(f => ({ ...f, tags: f.tags.includes(k) ? f.tags.filter(x => x !== k) : [...f.tags, k] }));

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(item.id, form);
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,8,18,.85)", zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:16,
        width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto",
        animation:"am-fadeUp .25s ease" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.navy}`,
          display:"flex", alignItems:"center", gap:10 }}>
          <Edit3 size={14} color={C.blue}/>
          <span style={{ ...orb(11, 700), color:C.white, flex:1 }}>EDITAR MENSAJE</span>
          <button onClick={onClose} className="am-btn"
            style={{ background:"none", border:"none", color:C.muted, cursor:"pointer" }}>
            <X size={16}/>
          </button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
          {/* Type */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>TIPO</div>
            <div style={{ display:"flex", gap:6 }}>
              {MSG_TYPES.map(t => (
                <TypeCard key={t.id} type={t} selected={form.type === t.id}
                  onClick={() => setForm(f => ({ ...f, type:t.id }))}/>
              ))}
            </div>
          </div>
          {/* Color */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>COLOR</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {ACCENT_PALETTE.map(c => (
                <ColorSwatch key={c} color={c} selected={form.accentColor === c}
                  onClick={() => setForm(f => ({ ...f, accentColor:c }))}/>
              ))}
            </div>
          </div>
          {/* Tags */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>ETIQUETAS</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {TAGS_DEF.map(t => (
                <TagChip key={t.k} tag={t} selected={form.tags.includes(t.k)} onClick={() => toggleTag(t.k)}/>
              ))}
            </div>
          </div>
          {/* Title */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:6 }}>TÍTULO</div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
              placeholder="Título del mensaje (opcional)"
              className="am-input"
              style={{ width:"100%", padding:"9px 12px", background:C.panel,
                border:`1px solid ${C.navy}`, color:C.white, borderRadius:6, ...raj(13, 400) }}/>
          </div>
          {/* Text */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:6 }}>TEXTO</div>
            <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text:e.target.value }))}
              rows={4} className="am-input"
              style={{ width:"100%", padding:"9px 12px", background:C.panel,
                border:`1px solid ${C.navy}`, color:C.white, resize:"vertical",
                minHeight:90, borderRadius:6, ...raj(13, 400), lineHeight:1.6 }}/>
          </div>
          {/* Status */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>ESTADO</div>
            <div style={{ display:"flex", gap:6 }}>
              {Object.entries(STATUS_META).map(([k, v]) => {
                const SIcon = v.icon;
                return (
                  <button key={k} onClick={() => setForm(f => ({ ...f, status:k }))} className="am-btn"
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                      gap:6, padding:"8px 10px", borderRadius:8,
                      background: form.status === k ? `${v.color}18` : C.panel,
                      border:`1px solid ${form.status === k ? v.color : C.navy}`,
                      color: form.status === k ? v.color : C.mutedL,
                      ...raj(12, form.status === k ? 700 : 500) }}>
                    <SIcon size={12}/>{v.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* PublishAt */}
          <div>
            <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:6 }}>
              PUBLICAR EN (OPCIONAL)
            </div>
            <input type="datetime-local" value={form.publishAt}
              onChange={e => setForm(f => ({ ...f, publishAt:e.target.value }))}
              className="am-input"
              style={{ width:"100%", padding:"9px 12px", background:C.panel,
                border:`1px solid ${C.navy}`, color:C.white, borderRadius:6,
                ...raj(12, 400), colorScheme:"dark" }}/>
          </div>
          {/* Actions */}
          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <button onClick={onClose} className="am-btn"
              style={{ flex:1, padding:"10px", background:C.panel, border:`1px solid ${C.navy}`,
                color:C.muted, borderRadius:8, ...raj(13, 600) }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving} className="am-btn"
              style={{ flex:2, display:"flex", alignItems:"center", justifyContent:"center",
                gap:7, padding:"10px", background:`${C.blue}18`, border:`1px solid ${C.blue}`,
                color:C.blue, borderRadius:8, ...raj(13, 700) }}>
              {saving ? <><Spinner color={C.blue} size={12}/>Guardando...</> : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonMensajes() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="m-skel" style={{borderRadius:14,height:90,animationDelay:`${i*.08}s`}}/>
        ))}
      </div>
      <div className="m-skel" style={{borderRadius:12,height:52}}/>
      <div className="m-skel" style={{borderRadius:10,height:50}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="m-skel" style={{borderRadius:12,height:80,animationDelay:`${i*.06}s`}}/>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminMensajes() {
  // Composer
  const [title,       setTitle]       = useState("");
  const [text,        setText]        = useState("");
  const [msgType,     setMsgType]     = useState("announcement");
  const [accentColor, setAccentColor] = useState(C.blue);
  const [tags,        setTags]        = useState([]);
  const [targetAll,   setTargetAll]   = useState(true);
  const [targetUid,   setTargetUid]   = useState("");
  const [publishMode, setPublishMode] = useState("now");
  const [publishAt,   setPublishAt]   = useState("");
  const [imageUrl,    setImageUrl]    = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [sending,     setSending]     = useState(false);
  const [sentOk,      setSentOk]      = useState(false);
  const [sendError,   setSendError]   = useState(null);

  // History & filters
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [histError,    setHistError]    = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [editItem,     setEditItem]     = useState(null);
  const [filterType,   setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag,    setFilterTag]    = useState("all");

  // System
  const [token,     setToken]     = useState(null);
  const [userCount, setUserCount] = useState(0);

  // ── Auth ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) setToken(await u.getIdToken());
      else   setToken(null);
    });
    return unsub;
  }, []);

  // ── User count ─────────────────────────────────────────────────
  useEffect(() => {
    getDocs(query(collection(db, "users"), limit(500)))
      .then(snap => setUserCount(snap.size))
      .catch(() => {});
  }, []);

  // ── Real-time history ──────────────────────────────────────────
  useEffect(() => {
    setHistLoading(true);
    setHistError(null);
    const q = query(
      collection(db, "adminMessages"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(q,
      snap => {
        const msgs = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id:          doc.id,
            text:        d.text        || "",
            title:       d.title       || "",
            type:        d.type        || "announcement",
            status:      d.status      || "published",
            accentColor: d.accentColor || null,
            tags:        d.tags        || [],
            imageUrl:    d.imageUrl    || "",
            publishAt:   d.publishAt   || null,
            createdAt:   d.createdAt?.toDate?.()?.toISOString() || null,
            targetAll:   d.targetAll,
            targetUid:   d.targetUid,
            readCount:   d.readCount ?? (d.readBy || []).length,
          };
        });
        setHistory(msgs);
        setHistLoading(false);
      },
      err => {
        console.warn("[AdminMensajes] snapshot:", err.message);
        setHistError("No se pudo cargar el historial.");
        setHistLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Upload image ───────────────────────────────────────────────
  const handleImageFile = useCallback((file) => {
    setUploading(true); setUploadPct(0);
    const ref  = sRef(storage, `adminMessages/banners/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(ref, file);
    task.on(
      "state_changed",
      snap => setUploadPct(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err  => { console.warn("Upload:", err); setUploading(false); },
      async () => {
        setImageUrl(await getDownloadURL(task.snapshot.ref));
        setUploading(false);
      }
    );
  }, []);

  // ── Edit ───────────────────────────────────────────────────────
  const handleEdit = useCallback(async (id, updates) => {
    if (!token) return;
    try {
      await fetch(`${BASE_URL}/messages/${id}`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn("Edit error:", err.message);
    } finally {
      setEditItem(null);
    }
  }, [token]);

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!token) return;
    setDeleting(id);
    try { await deleteAdminMessage(token, id); }
    catch (err) { console.warn("Delete:", err.message); }
    finally     { setDeleting(null); }
  };

  // ── Send ───────────────────────────────────────────────────────
  const charLeft = 500 - text.length;
  const canSend  = text.trim().length > 0
    && (!targetAll ? targetUid.trim().length > 0 : true)
    && !sending && !uploading;

  const handleSend = async (status = "published") => {
    if (!canSend || !token) return;
    setSending(true); setSendError(null); setSentOk(false);
    try {
      const res = await sendAdminMessage(token, {
        title:     title.trim() || null,
        text:      text.trim(),
        type:      msgType,
        accentColor,
        tags,
        status,
        publishAt: publishMode === "scheduled" && publishAt
          ? new Date(publishAt).toISOString() : null,
        imageUrl:  imageUrl || null,
        targetAll,
        targetUid: targetAll ? null : targetUid.trim(),
      });
      if (res?.ok) {
        setSentOk(true);
        setTitle(""); setText(""); setTargetUid(""); setTags([]);
        setImageUrl(""); setAccentColor(C.blue);
        setPublishAt(""); setPublishMode("now");
        setTimeout(() => setSentOk(false), 3500);
        const fresh = await auth.currentUser?.getIdToken(true);
        if (fresh) setToken(fresh);
      }
    } catch (err) {
      setSendError(err.message || "Error al enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  // ── Filtered history ───────────────────────────────────────────
  const filtered = useMemo(() => history.filter(m => {
    if (filterType   !== "all" && m.type   !== filterType)            return false;
    if (filterStatus !== "all" && m.status !== filterStatus)          return false;
    if (filterTag    !== "all" && !(m.tags||[]).includes(filterTag))  return false;
    return true;
  }), [history, filterType, filterStatus, filterTag]);

  const stats = useMemo(() => ({
    total:     history.length,
    published: history.filter(m => m.status === "published").length,
    broadcast: history.filter(m => m.targetAll).length,
    reads:     history.reduce((s, m) => s + (m.readCount || 0), 0),
  }), [history]);

  const activeType  = MSG_TYPES.find(t => t.id === msgType) || MSG_TYPES[0];
  const hasFilter   = filterType !== "all" || filterStatus !== "all" || filterTag !== "all";
  const clearFilters = () => { setFilterType("all"); setFilterStatus("all"); setFilterTag("all"); };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      {editItem && (
        <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={handleEdit}/>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:20,
        animation:"am-fadeUp .4s ease", fontFamily:"'Rajdhani',sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:`${C.blue}18`, border:`1px solid ${C.blue}33`,
              padding:8, display:"flex", borderRadius:8 }}>
              <MessageSquare size={20} color={C.blue}/>
            </div>
            <div>
              <div style={{ ...orb(14, 700), color:C.white }}>MENSAJES</div>
              <div style={{ ...raj(12, 400), color:C.muted }}>Comunicación en tiempo real con usuarios</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:`${C.green}10`,
            border:`1px solid ${C.green}33`, padding:"6px 12px", borderRadius:20 }}>
            <div style={{ position:"relative", width:6, height:6 }}>
              <div style={{ position:"absolute", inset:0, background:C.green, borderRadius:"50%",
                animation:"am-pulse 1.4s infinite" }}/>
              <div style={{ position:"absolute", inset:0, background:C.green, borderRadius:"50%",
                animation:"am-ping 1.4s infinite" }}/>
            </div>
            <span style={{ ...raj(11, 700), color:C.green, letterSpacing:".08em" }}>TIEMPO REAL</span>
          </div>
        </div>

        {/* ── Grid: composer + preview ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20, alignItems:"start" }}>

          {/* Composer */}
          <div style={{ background:C.card, border:`1px solid ${C.navy}`,
            borderRadius:12, overflow:"hidden", transition:"transform .18s,box-shadow .18s" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.navy}`,
              display:"flex", alignItems:"center", gap:10 }}>
              <Send size={14} color={C.orange}/>
              <span style={{ ...orb(11, 700), color:C.white, letterSpacing:".06em" }}>NUEVO MENSAJE</span>
            </div>
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:18 }}>

              {/* Tipo */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>TIPO</div>
                <div style={{ display:"flex", gap:6 }}>
                  {MSG_TYPES.map(t => (
                    <TypeCard key={t.id} type={t} selected={msgType === t.id}
                      onClick={() => { setMsgType(t.id); setAccentColor(t.color); }}/>
                  ))}
                </div>
                <div style={{ ...raj(11, 400), color:C.muted, marginTop:6 }}>{activeType.desc}</div>
              </div>

              {/* Color */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>COLOR DE ACENTO</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {ACCENT_PALETTE.map(c => (
                    <ColorSwatch key={c} color={c} selected={accentColor === c}
                      onClick={() => setAccentColor(c)}/>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>ETIQUETAS</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {TAGS_DEF.map(t => (
                    <TagChip key={t.k} tag={t} selected={tags.includes(t.k)}
                      onClick={() => setTags(p => p.includes(t.k) ? p.filter(x => x!==t.k) : [...p, t.k])}/>
                  ))}
                </div>
              </div>

              {/* Banner */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>
                  IMAGEN DE BANNER (OPCIONAL)
                </div>
                <BannerDrop imageUrl={imageUrl} onFile={handleImageFile}
                  uploading={uploading} uploadPct={uploadPct}/>
                {imageUrl && (
                  <button onClick={() => setImageUrl("")} className="am-btn"
                    style={{ marginTop:6, background:"none", border:"none", color:C.red,
                      cursor:"pointer", ...raj(11, 600), display:"flex", alignItems:"center", gap:4 }}>
                    <X size={11}/>Quitar imagen
                  </button>
                )}
              </div>

              {/* Título */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:6 }}>TÍTULO (OPCIONAL)</div>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Título del mensaje..."
                  className="am-input"
                  style={{ width:"100%", padding:"10px 14px", background:C.panel,
                    border:`1px solid ${C.navy}`, color:C.white, borderRadius:6, ...raj(13, 400) }}/>
              </div>

              {/* Mensaje */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em" }}>MENSAJE</div>
                  <span style={{ ...raj(11, 500), color: charLeft < 50 ? C.orange : C.muted }}>
                    {charLeft} restantes
                  </span>
                </div>
                <textarea value={text}
                  onChange={e => { if (e.target.value.length <= 500) setText(e.target.value); }}
                  placeholder="Escribe el mensaje que verán los usuarios en tiempo real..."
                  rows={4} className="am-input"
                  style={{ width:"100%", padding:"12px 14px", background:C.panel,
                    border:`1px solid ${C.navy}`, color:C.white, resize:"vertical",
                    minHeight:110, maxHeight:240, borderRadius:6, ...raj(13, 400), lineHeight:1.6 }}/>
              </div>

              {/* Destinatarios */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>DESTINATARIOS</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { v:true,  icon:Users, label:"Todos los usuarios" },
                    { v:false, icon:User,  label:"Usuario específico" },
                  ].map(opt => (
                    <button key={String(opt.v)} onClick={() => setTargetAll(opt.v)} className="am-btn"
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                        gap:7, padding:"9px 12px", borderRadius:8,
                        background: targetAll === opt.v ? `${C.teal}18` : C.panel,
                        border:`1px solid ${targetAll === opt.v ? C.teal : C.navy}`,
                        color: targetAll === opt.v ? C.teal : C.mutedL,
                        ...raj(12, targetAll === opt.v ? 700 : 500) }}>
                      <opt.icon size={13}/>{opt.label}
                    </button>
                  ))}
                </div>
                {!targetAll && (
                  <input value={targetUid} onChange={e => setTargetUid(e.target.value)}
                    placeholder="UID del usuario"
                    className="am-input"
                    style={{ marginTop:8, width:"100%", padding:"9px 14px", background:C.panel,
                      border:`1px solid ${C.navy}`, color:C.white, borderRadius:6, ...raj(13, 400) }}/>
                )}
              </div>

              {/* Publicación */}
              <div>
                <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:8 }}>PUBLICACIÓN</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { v:"now",       label:"Ahora",      icon:Send     },
                    { v:"scheduled", label:"Programado", icon:Calendar },
                  ].map(opt => {
                    const OIcon = opt.icon;
                    return (
                      <button key={opt.v} onClick={() => setPublishMode(opt.v)} className="am-btn"
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                          gap:7, padding:"9px 12px", borderRadius:8,
                          background: publishMode === opt.v ? `${C.purple}18` : C.panel,
                          border:`1px solid ${publishMode === opt.v ? C.purple : C.navy}`,
                          color: publishMode === opt.v ? C.purple : C.mutedL,
                          ...raj(12, publishMode === opt.v ? 700 : 500) }}>
                        <OIcon size={12}/>{opt.label}
                      </button>
                    );
                  })}
                </div>
                {publishMode === "scheduled" && (
                  <input type="datetime-local" value={publishAt}
                    onChange={e => setPublishAt(e.target.value)}
                    className="am-input"
                    style={{ marginTop:8, width:"100%", padding:"9px 14px", background:C.panel,
                      border:`1px solid ${C.navy}`, color:C.white, borderRadius:6,
                      ...raj(12, 400), colorScheme:"dark" }}/>
                )}
              </div>

              {/* Feedback banners */}
              {sendError && (
                <div style={{ display:"flex", alignItems:"center", gap:8, background:`${C.red}0C`,
                  border:`1px solid ${C.red}33`, padding:"10px 14px", borderRadius:8 }}>
                  <AlertTriangle size={13} color={C.red}/>
                  <span style={{ ...raj(12, 600), color:C.red, flex:1 }}>{sendError}</span>
                  <button onClick={() => setSendError(null)}
                    style={{ background:"none", border:"none", color:C.muted, cursor:"pointer" }}>
                    <X size={12}/>
                  </button>
                </div>
              )}
              {sentOk && (
                <div style={{ display:"flex", alignItems:"center", gap:8, background:`${C.green}0C`,
                  border:`1px solid ${C.green}33`, padding:"10px 14px", borderRadius:8,
                  animation:"am-fadeUp .3s ease" }}>
                  <CheckCircle size={13} color={C.green}/>
                  <span style={{ ...raj(12, 700), color:C.green }}>
                    ✓ Mensaje enviado. Los usuarios lo verán instantáneamente.
                  </span>
                </div>
              )}

              {/* Two send buttons */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => handleSend("draft")} disabled={!canSend} className="am-btn"
                  style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                    gap:7, padding:"11px 14px", borderRadius:8,
                    background: canSend ? `${C.muted}14` : C.panel,
                    border:`1px solid ${canSend ? C.muted : C.navy}`,
                    color: canSend ? C.mutedL : C.muted,
                    ...raj(12, 700), letterSpacing:".04em" }}>
                  <FileText size={13}/>BORRADOR
                </button>
                <button onClick={() => handleSend("published")} disabled={!canSend} className="am-btn"
                  style={{ flex:2, display:"flex", alignItems:"center", justifyContent:"center",
                    gap:7, padding:"11px 14px", borderRadius:8,
                    background: canSend ? `linear-gradient(135deg,${C.orange},${C.orangeL})` : C.panel,
                    border:`1px solid ${canSend ? C.orange : C.navy}`,
                    color: canSend ? "#0A0E1A" : C.muted,
                    ...raj(13, 700), letterSpacing:".06em",
                    boxShadow: canSend ? `0 0 20px ${C.orange}33` : "none" }}>
                  {sending
                    ? <><Spinner color="#0A0E1A" size={13}/>Enviando...</>
                    : <><Send size={14}/>PUBLICAR</>}
                </button>
              </div>

            </div>
          </div>

          {/* Right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Live preview */}
            <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:12, overflow:"hidden", transition:"transform .18s,box-shadow .18s" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.navy}`,
                display:"flex", alignItems:"center", gap:8 }}>
                <Eye size={13} color={C.muted}/>
                <span style={{ ...raj(11, 700), color:C.muted, letterSpacing:".08em" }}>
                  VISTA PREVIA DEL USUARIO
                </span>
              </div>
              {text.trim() ? (
                <UserPreviewCard title={title} text={text} type={msgType}
                  accentColor={accentColor} tags={tags} imageUrl={imageUrl}/>
              ) : (
                <div style={{ padding:"28px 20px", textAlign:"center" }}>
                  <MessageSquare size={28} color={C.navy} style={{ marginBottom:8 }}/>
                  <div style={{ ...raj(12, 500), color:C.muted }}>
                    Escribe un mensaje para previsualizar
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:12, padding:"14px 16px", transition:"transform .18s,box-shadow .18s" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ ...raj(10, 700), color:C.muted, letterSpacing:".08em", marginBottom:12 }}>RESUMEN</div>
              {[
                { label:"Total enviados",  value:stats.total,     color:C.blue   },
                { label:"Publicados",      value:stats.published, color:C.green  },
                { label:"Broadcasts",      value:stats.broadcast, color:C.orange },
                { label:"Total lecturas",  value:stats.reads,     color:C.teal   },
                { label:"Usuarios",        value:userCount,       color:C.purple },
              ].map((s, i, arr) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  padding:"6px 0", borderBottom: i < arr.length-1 ? `1px solid ${C.navy}44` : "none" }}>
                  <span style={{ ...raj(12, 500), color:C.muted }}>{s.label}</span>
                  <span style={{ ...raj(14, 700), color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── History ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, borderRadius:12, overflow:"hidden", transition:"transform .18s,box-shadow .18s" }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.navy}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <Clock size={14} color={C.muted}/>
              <span style={{ ...orb(11, 700), color:C.white, flex:1 }}>HISTORIAL</span>
              <div style={{ display:"flex", alignItems:"center", gap:6, background:`${C.green}10`,
                border:`1px solid ${C.green}33`, padding:"5px 10px", borderRadius:20 }}>
                <div style={{ width:5, height:5, background:C.green, borderRadius:"50%",
                  animation:"am-pulse 1.5s infinite" }}/>
                <span style={{ ...raj(10, 700), color:C.green, letterSpacing:".06em" }}>EN VIVO</span>
              </div>
            </div>

            {/* Filter row 1 — type */}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8, borderRadius:12, padding:"10px 12px" }}>
              <button onClick={() => setFilterType("all")} className="am-pill"
                style={{ padding:"3px 10px", borderRadius:20,
                  background: filterType === "all" ? `${C.blue}18` : C.panel,
                  border:`1px solid ${filterType === "all" ? C.blue : C.navy}`,
                  boxShadow: filterType === "all" ? `0 0 10px ${C.blue}33` : "none",
                  color: filterType === "all" ? C.blue : C.mutedL,
                  ...raj(10, filterType === "all" ? 700 : 500) }}>
                Todos
              </button>
              {MSG_TYPES.map(t => {
                const on = filterType === t.id;
                return (
                  <button key={t.id} onClick={() => setFilterType(t.id)} className="am-pill"
                    style={{ padding:"3px 10px", borderRadius:20,
                      background: on ? `${t.color}18` : C.panel,
                      border:`1px solid ${on ? t.color : C.navy}`,
                      boxShadow: on ? `0 0 10px ${t.color}33` : "none",
                      color: on ? t.color : C.mutedL,
                      ...raj(10, on ? 700 : 500) }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Filter row 2 — status + tag */}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center", borderRadius:12, padding:"10px 12px" }}>
              {Object.entries(STATUS_META).map(([k, v]) => {
                const on = filterStatus === k;
                return (
                  <button key={k} onClick={() => setFilterStatus(on ? "all" : k)}
                    className="am-pill"
                    style={{ padding:"3px 10px", borderRadius:20,
                      background: on ? `${v.color}18` : C.panel,
                      border:`1px solid ${on ? v.color : C.navy}`,
                      boxShadow: on ? `0 0 10px ${v.color}33` : "none",
                      color: on ? v.color : C.mutedL,
                      ...raj(10, on ? 700 : 500) }}>
                    {v.label}
                  </button>
                );
              })}
              <div style={{ width:1, height:14, background:`${C.navy}88`, flexShrink:0 }}/>
              {TAGS_DEF.map(t => {
                const on = filterTag === t.k;
                return (
                  <button key={t.k} onClick={() => setFilterTag(on ? "all" : t.k)}
                    className="am-pill"
                    style={{ padding:"3px 8px", borderRadius:20,
                      background: on ? `${t.c}14` : C.panel,
                      border:`1px solid ${on ? t.c : C.navy}`,
                      boxShadow: on ? `0 0 10px ${t.c}33` : "none",
                      color: on ? t.c : C.mutedL,
                      ...raj(9, on ? 700 : 500) }}>
                    {t.l}
                  </button>
                );
              })}
              {hasFilter && (
                <button onClick={clearFilters} className="am-btn"
                  style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4,
                    background:"none", border:"none", color:C.muted, cursor:"pointer",
                    ...raj(10, 600) }}>
                  <X size={10}/>Limpiar
                </button>
              )}
              <span style={{ ...raj(10, 400), color:C.muted, marginLeft: hasFilter ? 4 : "auto" }}>
                {filtered.length} de {history.length}
              </span>
            </div>
          </div>

          <div style={{ padding:"16px 20px" }}>
            {histLoading ? (
              <><style>{CSS}</style><SkeletonMensajes/></>
            ) : histError ? (
              <div style={{ padding:"32px 20px", textAlign:"center" }}>
                <AlertTriangle size={28} color={C.orange} style={{ marginBottom:8 }}/>
                <div style={{ ...raj(13, 500), color:C.muted }}>{histError}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center" }}>
                <MessageSquare size={36} color={C.navy} style={{ marginBottom:12 }}/>
                <div style={{ ...orb(11, 700), color:C.muted, marginBottom:6 }}>SIN MENSAJES</div>
                <div style={{ ...raj(13, 400), color:C.muted }}>
                  {hasFilter ? "No hay mensajes con estos filtros." : "Los mensajes enviados aparecerán aquí."}
                </div>
              </div>
            ) : (
              filtered.map(msg => (
                <HistoryCard key={msg.id} msg={msg}
                  onDelete={handleDelete} onEdit={setEditItem}
                  deleting={deleting} userCount={userCount}/>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  );
}
