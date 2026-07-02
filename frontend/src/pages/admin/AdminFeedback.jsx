// src/pages/admin/AdminFeedback.jsx
import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db, auth } from "../../firebase.js";
import { useToast } from "../../components/shared/ui.jsx";
import {
  Bug, Lightbulb, Frown, Smile, HelpCircle,
  Star, Clock, CheckCircle, Eye, Trash2, Download,
  RefreshCw, X, FileText, TrendingUp, Activity,
  MessageSquare, ShieldOff, Globe, Shield, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";
import { updateFeedback, deleteFeedback, exportFeedback } from "../../services/api.js";
import { C, px, raj, orb } from "../../components/admin/config/shared.jsx";


const CSS = `
  @keyframes af-in    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes af-pop   { 0%{transform:scale(.88);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes af-spin  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes af-pulse { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes af-slide { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

  .af-row  { transition:background .15s, box-shadow .15s; cursor:pointer; }
  .af-row:hover { background:rgba(212,165,116,.04) !important; }
  .af-btn  { transition:all .15s; cursor:pointer; border:none; }
  .af-btn:hover { opacity:.78; transform:scale(1.04); }
  .af-pill { transition:all .18s; cursor:pointer; }
  .af-pill:hover { opacity:.82; }
  .af-modal { animation:af-pop .2s ease; }
  ::-webkit-scrollbar       { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${C.navy}; border-radius:4px; }
  @keyframes f-skel-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .f-skel { background:linear-gradient(90deg,${C.card} 25%,${C.navy}55 50%,${C.card} 75%); background-size:400px 100%; animation:f-skel-shimmer 1.5s infinite linear; }
`;

// ── Rating helpers ────────────────────────────────────────────
const RATING_COLOR = { 5:C.green, 4:"#8BAF6A", 3:C.gold, 2:C.orange, 1:C.red };
const ratingColor  = r => RATING_COLOR[r] || C.muted;
const ratingScore  = avg => Math.round(Math.max(0, Math.min(100, ((avg-1)/4)*100)));
function scoreColor(s) {
  if (s >= 75) return C.green;
  if (s >= 50) return C.gold;
  if (s >= 30) return C.orange;
  return C.red;
}
function scoreLabel(s) {
  if (s >= 80) return "Excelente";
  if (s >= 60) return "Bueno";
  if (s >= 40) return "Regular";
  if (s >= 20) return "Bajo";
  return "Crítico";
}

const CLASS_COLOR = { GUERRERO:C.red, ARQUERO:C.blue, MAGO:C.purple, "PALADÍN":C.gold };

const TYPE_META = {
  bug:        { icon:Bug,        label:"Error",     color:C.red,    emoji:"🐛" },
  suggestion: { icon:Lightbulb,  label:"Sugerencia",color:C.blue,   emoji:"💡" },
  complaint:  { icon:Frown,      label:"Queja",     color:C.orange, emoji:"😤" },
  praise:     { icon:Smile,      label:"Elogio",    color:C.green,  emoji:"😊" },
  other:      { icon:HelpCircle, label:"Otro",      color:C.muted,  emoji:"❓" },
};
const STATUS_META = {
  pending:  { label:"Pendiente", color:C.orange },
  read:     { label:"Leído",     color:C.blue   },
  resolved: { label:"Resuelto",  color:C.green  },
};

// ─────────────────────────────────────────────────────────────
//  MINI COMPONENTS
// ─────────────────────────────────────────────────────────────

function Stars({ rating, size=13 }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size}
          fill={n <= rating ? C.gold : "none"}
          color={n <= rating ? C.gold : C.navyL}
          strokeWidth={1.5}/>
      ))}
    </div>
  );
}

function Spinner({ size=16, color=C.orange }) {
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      border:`2px solid ${color}33`, borderTopColor:color,
      borderRadius:"50%", animation:"af-spin .7s linear infinite",
    }}/>
  );
}

function Avatar({ username, heroClass, avatarUrl, size=34 }) {
  const color    = CLASS_COLOR[heroClass] || C.orange;
  const initials = (username || "??").slice(0,2).toUpperCase();
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={initials} style={{
        width:size, height:size, borderRadius:"50%", objectFit:"cover",
        border:`1.5px solid ${color}55`, flexShrink:0,
      }}/>
    );
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`${color}18`, border:`1.5px solid ${color}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <span style={{ ...raj(Math.floor(size*0.33), 700), color }}>{initials}</span>
    </div>
  );
}

function StatCard({ icon:Icon, label, value, color, sub }) {
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.navy}`,
      borderLeft:`3px solid ${color}`, borderRadius:14,
      padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:12,
      animation:"af-in .3s ease",
    }}>
      <div style={{
        background:`${color}18`, border:`1px solid ${color}33`,
        borderRadius:8, padding:10, flexShrink:0,
      }}>
        <Icon size={18} color={color}/>
      </div>
      <div>
        <div style={{ ...orb(18,900), color:C.white, lineHeight:1 }}>{value}</div>
        <div style={{ ...raj(12,500), color:C.muted, marginTop:3 }}>{label}</div>
        {sub && <div style={{ ...raj(11,500), color, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Sentiment Score Gauge ─────────────────────────────────────
function SentimentGauge({ avgRating }) {
  const score = ratingScore(avgRating || 0);
  const color = scoreColor(score);
  const label = scoreLabel(score);
  const data  = [{ value:score }, { value:100-score }];
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:180, height:100 }}>
        <PieChart width={180} height={100}>
          <Pie data={data} cx="50%" cy="80%"
            startAngle={180} endAngle={0}
            innerRadius={52} outerRadius={72}
            dataKey="value" paddingAngle={0} strokeWidth={0}>
            <Cell fill={color}/>
            <Cell fill={`${C.navy}88`}/>
          </Pie>
        </PieChart>
        <div style={{
          position:"absolute", bottom:4, left:"50%", transform:"translateX(-50%)",
          textAlign:"center", pointerEvents:"none",
        }}>
          <div style={{ ...orb(22,900), color, lineHeight:1 }}>{score}</div>
          <div style={{ ...raj(10,600), color:C.muted, marginTop:1 }}>{label}</div>
        </div>
      </div>
      <div style={{ ...raj(11,500), color:C.muted }}>Satisfacción general</div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ filterType, filterStatus, filterRating }) {
  const hasFilter = filterType || filterStatus || filterRating;
  return (
    <div style={{ padding:"52px 20px", textAlign:"center", animation:"af-in .3s ease" }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none"
        style={{ margin:"0 auto 16px", display:"block", opacity:.3 }}>
        {hasFilter ? (
          <>
            <rect x="8" y="8" width="48" height="48" rx="10"
              stroke={C.blue} strokeWidth="2" fill={`${C.blue}10`}/>
            <circle cx="28" cy="28" r="10" stroke={C.blue} strokeWidth="2"/>
            <line x1="35" y1="35" x2="46" y2="46" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="22" y1="28" x2="34" y2="28" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="22" y1="23" x2="28" y2="23" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <rect x="8" y="16" width="48" height="36" rx="8"
              stroke={C.muted} strokeWidth="2" fill={`${C.muted}10`}/>
            <path d="M8 24 L32 38 L56 24" stroke={C.muted} strokeWidth="2" fill="none"/>
            <line x1="20" y1="12" x2="20" y2="20" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
            <line x1="32" y1="10" x2="32" y2="18" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
            <line x1="44" y1="12" x2="44" y2="20" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
          </>
        )}
      </svg>
      <div style={{ ...raj(14,600), color:C.mutedL, marginBottom:6 }}>
        {hasFilter ? "Sin resultados para este filtro" : "Sin feedback recibido"}
      </div>
      <div style={{ ...raj(12,400), color:C.muted }}>
        {hasFilter
          ? "Prueba con otros filtros o limpia la selección."
          : "Los usuarios aún no han enviado reportes o sugerencias."}
      </div>
    </div>
  );
}

// ── Detail / Edit Modal ───────────────────────────────────────
function DetailModal({ item, onClose, onUpdate, onDelete }) {
  const [status,     setStatus]     = useState(item.status);
  const [adminNote,  setAdminNote]  = useState(item.adminNote  || "");
  const [adminReply, setAdminReply] = useState(item.adminReply || "");
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const meta       = TYPE_META[item.type]  || TYPE_META.other;
  const rCol       = ratingColor(item.rating);
  const isFeatured = !!item.featured;

  const handleSave = async () => {
    setSaving(true);
    try { await onUpdate(item.id, { status, adminNote, adminReply }); onClose(); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar feedback de ${item.username}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try { await onDelete(item.id); onClose(); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,.82)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="af-modal" style={{
        background:C.card, border:`1px solid ${C.navy}`,
        borderRadius:16, width:"100%", maxWidth:620,
        maxHeight:"90vh", overflowY:"auto",
        boxShadow:`0 28px 80px rgba(0,0,0,.7), 0 0 0 1px ${meta.color}22`,
      }}>

        {/* Header */}
        <div style={{
          padding:"18px 20px", borderBottom:`1px solid ${C.navy}`,
          display:"flex", alignItems:"center", gap:10, justifyContent:"space-between",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              background:`${meta.color}18`, border:`1px solid ${meta.color}33`,
              borderRadius:8, padding:8, display:"flex",
            }}>
              <meta.icon size={16} color={meta.color}/>
            </div>
            <div>
              <div style={{ ...orb(11,700), color:C.white }}>
                {meta.emoji} {meta.label.toUpperCase()}
              </div>
              <div style={{ ...raj(11,400), color:C.muted }}>
                {new Date(item.createdAt).toLocaleString("es-EC",
                  { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {item.type === "praise" && item.rating >= 4 && (
              <button onClick={() => onUpdate(item.id, { featured: !isFeatured })}
                className="af-btn"
                title={isFeatured ? "Quitar de testimonios" : "Publicar en testimonios"}
                style={{
                  display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
                  background: isFeatured ? `${C.gold}18` : `${C.navy}44`,
                  border:`1px solid ${isFeatured ? C.gold+"55" : C.navyL}`,
                  borderRadius:6, color: isFeatured ? C.gold : C.muted,
                  ...raj(11,600), cursor:"pointer",
                }}>
                <Globe size={12}/>
                {isFeatured ? "Destacado" : "Destacar"}
              </button>
            )}
            <button onClick={onClose} className="af-btn" style={{
              background:`${C.navy}44`, borderRadius:6, padding:6,
              border:`1px solid ${C.navyL}`, display:"flex", cursor:"pointer",
            }}>
              <X size={14} color={C.muted}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:20 }}>

          {/* User info */}
          <div style={{
            background:C.panel, border:`1px solid ${C.navy}`, borderRadius:10,
            padding:"12px 14px", marginBottom:16,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:10,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Avatar username={item.username} heroClass={item.heroClass}
                avatarUrl={item.avatarUrl} size={40}/>
              <div>
                <div style={{ ...raj(14,700), color:C.white }}>{item.username}</div>
                <div style={{ ...raj(11,400), color:C.muted }}>
                  {item.email} · {item.heroClass} · Nv.{item.level}
                </div>
              </div>
            </div>
            <Stars rating={item.rating}/>
          </div>

          {/* Subject */}
          {item.subject && (
            <div style={{ marginBottom:12 }}>
              <div style={{ ...raj(10,700), color:C.muted, marginBottom:4, letterSpacing:".08em" }}>
                ASUNTO
              </div>
              <div style={{ ...raj(14,600), color:C.white }}>{item.subject}</div>
            </div>
          )}

          {/* Message */}
          <div style={{ marginBottom:20 }}>
            <div style={{ ...raj(10,700), color:C.muted, marginBottom:6, letterSpacing:".08em" }}>
              MENSAJE
            </div>
            <div style={{
              background:C.panel, border:`1px solid ${C.navy}`,
              borderLeft:`3px solid ${rCol}55`, borderRadius:8,
              padding:"12px 14px", ...raj(13,400), color:C.white,
              lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word",
            }}>
              {item.message}
            </div>
          </div>

          {/* Estado */}
          <div style={{ marginBottom:16 }}>
            <div style={{ ...raj(10,700), color:C.muted, marginBottom:6, letterSpacing:".08em" }}>
              ESTADO
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(STATUS_META).map(([key, sm]) => (
                <button key={key} onClick={() => setStatus(key)} className="af-pill"
                  style={{
                    padding:"6px 14px",
                    border:`1px solid ${status===key ? sm.color : C.navy}`,
                    borderRadius:20,
                    background: status===key ? `${sm.color}18` : "transparent",
                    color: status===key ? sm.color : C.muted,
                    ...raj(12,700), cursor:"pointer",
                  }}>
                  {sm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin reply — público */}
          <div style={{ marginBottom:16 }}>
            <div style={{
              ...raj(10,700), color:C.teal, marginBottom:6, letterSpacing:".08em",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <Globe size={11} color={C.teal}/>
              RESPUESTA AL USUARIO (visible por el usuario)
            </div>
            <textarea value={adminReply}
              onChange={e => setAdminReply(e.target.value.slice(0,500))}
              rows={3}
              placeholder="Escribe una respuesta que verá el usuario en su historial..."
              style={{
                width:"100%", background:C.panel,
                border:`1px solid ${C.teal}44`, borderRadius:6,
                color:C.white, ...raj(13,400), padding:"10px 12px",
                outline:"none", resize:"vertical", lineHeight:1.6,
                boxSizing:"border-box",
              }}/>
            <div style={{ ...raj(10,400), color:C.muted, textAlign:"right", marginTop:2 }}>
              {adminReply.length}/500
            </div>
          </div>

          {/* Nota interna */}
          <div style={{ marginBottom:20 }}>
            <div style={{
              ...raj(10,700), color:C.muted, marginBottom:6, letterSpacing:".08em",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <Shield size={11} color={C.muted}/>
              NOTA INTERNA (solo admins)
            </div>
            <textarea value={adminNote}
              onChange={e => setAdminNote(e.target.value.slice(0,500))}
              rows={2}
              placeholder="Añade una nota para el equipo..."
              style={{
                width:"100%", background:C.panel,
                border:`1px solid ${C.navy}`, borderRadius:6,
                color:C.white, ...raj(13,400), padding:"10px 12px",
                outline:"none", resize:"vertical", lineHeight:1.6,
                boxSizing:"border-box",
              }}/>
            <div style={{ ...raj(10,400), color:C.muted, textAlign:"right", marginTop:2 }}>
              {adminNote.length}/500
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={handleDelete} disabled={deleting} className="af-btn"
              style={{
                display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                background:`${C.red}14`, border:`1px solid ${C.red}44`,
                borderRadius:8, color:C.red, ...raj(12,700), cursor:"pointer",
              }}>
              {deleting ? <Spinner size={12} color={C.red}/> : <Trash2 size={13}/>}
              Eliminar
            </button>
            <button onClick={handleSave} disabled={saving} className="af-btn"
              style={{
                display:"flex", alignItems:"center", gap:6, padding:"9px 20px",
                background:C.orange, border:"none", borderRadius:8,
                color:C.bg, ...raj(12,700), cursor:"pointer",
              }}>
              {saving ? <Spinner size={12} color={C.bg}/> : <CheckCircle size={13}/>}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton loading state ────────────────────────────────────
function SkeletonFeedback() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="f-skel" style={{borderRadius:14,height:90,animationDelay:`${i*.08}s`}}/>
        ))}
      </div>
      <div className="f-skel" style={{borderRadius:12,height:52}}/>
      <div className="f-skel" style={{borderRadius:10,height:50}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="f-skel" style={{borderRadius:14,height:180,animationDelay:`${i*.07}s`}}/>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AdminFeedback() {
  const [allItems,     setAllItems]     = useState([]);
  const [rtLoading,    setRtLoading]    = useState(true);
  const [filterType,   setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRating, setFilterRating] = useState(0);
  const [showSpam,     setShowSpam]     = useState(false);
  const [chartTab,     setChartTab]     = useState("sentiment");
  const [selectedItem, setSelectedItem] = useState(null);
  const [exporting,    setExporting]    = useState(false);

  const toast = useToast();

  // ── onSnapshot real-time ──────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc"),
      limit(300)
    );
    const unsub = onSnapshot(q,
      snap => {
        setAllItems(snap.docs.map(d => {
          const data = d.data();
          return {
            id:         d.id,
            uid:        data.uid,
            username:   data.username   || "Anónimo",
            email:      data.email      || "",
            heroClass:  data.heroClass  || "GUERRERO",
            level:      data.level      || 1,
            avatarUrl:  data.avatarUrl  || "",
            type:       data.type,
            rating:     data.rating     || 0,
            subject:    data.subject    || "",
            message:    data.message    || "",
            status:     data.status     || "pending",
            adminNote:  data.adminNote  || "",
            adminReply: data.adminReply || "",
            featured:   data.featured   || false,
            isSpam:     data.isSpam     || false,
            createdAt:  data.createdAt?.toMillis?.() || Date.now(),
          };
        }));
        setRtLoading(false);
      },
      err => {
        console.warn("onSnapshot feedback:", err.message);
        setRtLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Stats derived from allItems ───────────────────────────
  const stats = useMemo(() => {
    const base = allItems.filter(d => !d.isSpam);
    if (!base.length) return null;
    const total    = base.length;
    const pending  = base.filter(d => d.status === "pending").length;
    const read     = base.filter(d => d.status === "read").length;
    const resolved = base.filter(d => d.status === "resolved").length;
    const byType   = {};
    Object.keys(TYPE_META).forEach(t => { byType[t] = base.filter(d => d.type === t).length; });
    const rated     = base.filter(d => d.rating >= 1 && d.rating <= 5);
    const avgRating = rated.length
      ? +(rated.reduce((s,d) => s + d.rating, 0) / rated.length).toFixed(1) : 0;
    const ratingDist = [1,2,3,4,5].map(r => ({
      name: "★".repeat(r), count: base.filter(d => d.rating === r).length,
      fill: ratingColor(r),
    }));
    const now  = Date.now();
    const days7 = Array.from({ length:7 }, (_, i) => {
      const d     = new Date(now - i * 86400000);
      const label = d.toLocaleDateString("es-EC", { weekday:"short", day:"numeric" });
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return {
        label,
        count: base.filter(doc => doc.createdAt >= start && doc.createdAt < start + 86400000).length,
      };
    }).reverse();
    return { total, pending, read, resolved, byType, avgRating, ratingDist, days7 };
  }, [allItems]);

  // ── Client-side filtering ─────────────────────────────────
  const filtered = useMemo(() => allItems
    .filter(it => showSpam ? it.isSpam : !it.isSpam)
    .filter(it => !filterType   || it.type   === filterType)
    .filter(it => !filterStatus || it.status === filterStatus)
    .filter(it => !filterRating || it.rating === filterRating),
    [allItems, filterType, filterStatus, filterRating, showSpam]
  );

  const getToken = async () => {
    const u = auth.currentUser;
    if (!u) throw new Error("No autenticado");
    return u.getIdToken();
  };

  // ── Mutations ─────────────────────────────────────────────
  const handleUpdate = async (id, updates) => {
    try {
      const tok = await getToken();
      await updateFeedback(tok, id, updates);
      // onSnapshot re-fires — no manual state update needed
      toast.push("Actualizado", "success");
    } catch (err) {
      toast.push("Error al actualizar", "error");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const tok = await getToken();
      await deleteFeedback(tok, id);
      toast.push("Eliminado", "info");
    } catch {
      toast.push("Error al eliminar", "error");
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const tok  = await getToken();
      const blob = await exportFeedback(tok, format);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `feedback-forgeventure.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.push(`Exportado .${format.toUpperCase()}`, "success");
    } catch { toast.push("Error al exportar", "error"); }
    finally  { setExporting(false); }
  };

  const hasFilters = filterType || filterStatus || filterRating;
  const clearFilters = () => { setFilterType(""); setFilterStatus(""); setFilterRating(0); };

  if (rtLoading) return <><style>{CSS}</style><SkeletonFeedback/></>;

  // ── PIE DATA ─────────────────────────────────────────────
  const PIE_COLORS = [C.red, C.blue, C.orange, C.green, C.muted];
  const pieData = stats
    ? Object.entries(stats.byType).map(([k, v], i) => ({
        name: TYPE_META[k]?.label || k, value: v, color: PIE_COLORS[i] || C.muted,
      }))
    : [];

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={async (id, upd) => { await handleUpdate(id, upd); setSelectedItem(null); }}
          onDelete={async (id)      => { await handleDelete(id);      setSelectedItem(null); }}
        />
      )}

      <div style={{ animation:"af-in .3s ease" }}>

        {/* ── HEADER ── */}
        <div style={{
          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:24, flexWrap:"wrap", gap:12,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              background:`${C.orange}18`, border:`1px solid ${C.orange}33`,
              borderRadius:10, padding:10, display:"flex",
            }}>
              <MessageSquare size={20} color={C.orange}/>
            </div>
            <div>
              <div style={{ ...orb(13,700), color:C.white }}>FEEDBACK DE USUARIOS</div>
              <div style={{ ...raj(12,400), color:C.muted }}>
                Reportes, sugerencias y calificaciones · tiempo real
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => handleExport("csv")} disabled={exporting} className="af-btn"
              style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                background:`${C.green}14`, border:`1px solid ${C.green}44`,
                borderRadius:8, color:C.green, ...raj(12,700), cursor:"pointer",
              }}>
              {exporting ? <Spinner size={12} color={C.green}/> : <Download size={13}/>}
              CSV
            </button>
            <button onClick={() => handleExport("json")} disabled={exporting} className="af-btn"
              style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                background:`${C.blue}14`, border:`1px solid ${C.blue}44`,
                borderRadius:8, color:C.blue, ...raj(12,700), cursor:"pointer",
              }}>
              <FileText size={13}/> JSON
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        {stats && (
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",
            gap:12, marginBottom:24,
          }}>
            <StatCard icon={MessageSquare} label="Total"        value={stats.total}    color={C.blue}  />
            <StatCard icon={Clock}         label="Pendientes"   value={stats.pending}   color={C.orange}
              sub={stats.pending > 0 ? "Requieren atención" : undefined}/>
            <StatCard icon={Eye}           label="Leídos"       value={stats.read}      color={C.mutedL}/>
            <StatCard icon={CheckCircle}   label="Resueltos"    value={stats.resolved}  color={C.green} />
            <StatCard icon={Star}          label="Rating prom." value={`${stats.avgRating}★`} color={C.gold}/>
          </div>
        )}

        {/* ── CHARTS ── */}
        {stats && (
          <div style={{
            background:C.card, border:`1px solid ${C.navy}`,
            borderRadius:14, padding:"18px 20px", marginBottom:24,
          }}>
            {/* Chart tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", borderRadius:12, padding:"10px 12px" }}>
              {[
                { id:"sentiment", label:"Sentimiento",    icon:Activity  },
                { id:"type",      label:"Por tipo",       icon:BarChart2 },
                { id:"rating",    label:"Calificaciones", icon:Star      },
                { id:"days",      label:"Últimos 7 días", icon:TrendingUp},
              ].map(t => {
                const on = chartTab === t.id;
                const cc = C.orange;
                return (
                  <button key={t.id} onClick={() => setChartTab(t.id)} className="af-pill"
                    style={{
                      display:"flex", alignItems:"center", gap:6, padding:"6px 14px",
                      background: on ? `${cc}18` : "transparent",
                      border:`1px solid ${on ? cc : C.navy}`,
                      borderRadius:20,
                      boxShadow: on ? `0 0 10px ${cc}33` : "none",
                      color: on ? cc : C.muted,
                      ...raj(12, on ? 700 : 500), cursor:"pointer",
                    }}>
                    <t.icon size={12}/> {t.label}
                  </button>
                );
              })}
            </div>

            <div style={{
              height: chartTab === "sentiment" ? "auto" : 200,
              display:"flex", justifyContent:"center",
            }}>
              {chartTab === "sentiment" && (
                <SentimentGauge avgRating={stats.avgRating}/>
              )}

              {chartTab === "type" && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={78}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]||C.muted}/>)}
                    </Pie>
                    <Tooltip contentStyle={{
                      background:C.panel, border:`1px solid ${C.navy}`,
                      borderRadius:8, fontFamily:"'Rajdhani',sans-serif",
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartTab === "rating" && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.ratingDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.navy}66`}/>
                    <XAxis dataKey="name" tick={{ fill:C.muted, fontSize:11,
                      fontFamily:"'Rajdhani',sans-serif" }}/>
                    <YAxis tick={{ fill:C.muted, fontSize:11,
                      fontFamily:"'Rajdhani',sans-serif" }} allowDecimals={false}/>
                    <Tooltip contentStyle={{
                      background:C.panel, border:`1px solid ${C.navy}`,
                      borderRadius:8, fontFamily:"'Rajdhani',sans-serif",
                    }}/>
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {stats.ratingDist.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartTab === "days" && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.days7}>
                    <defs>
                      <linearGradient id="grad-af-days" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.orange} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={C.orange} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.navy}66`}/>
                    <XAxis dataKey="label" tick={{ fill:C.muted, fontSize:10,
                      fontFamily:"'Rajdhani',sans-serif" }}/>
                    <YAxis tick={{ fill:C.muted, fontSize:11,
                      fontFamily:"'Rajdhani',sans-serif" }} allowDecimals={false}/>
                    <Tooltip contentStyle={{
                      background:C.panel, border:`1px solid ${C.navy}`,
                      borderRadius:8, fontFamily:"'Rajdhani',sans-serif",
                    }}/>
                    <Area type="monotone" dataKey="count"
                      stroke={C.orange} strokeWidth={2}
                      fill="url(#grad-af-days)"
                      dot={{ fill:C.orange, r:3, strokeWidth:0 }}
                      activeDot={{ r:5, fill:C.orange }}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Type legend */}
            {chartTab === "type" && (
              <div style={{ display:"flex", gap:14, flexWrap:"wrap",
                justifyContent:"center", marginTop:14 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:d.color }}/>
                    <span style={{ ...raj(11,500), color:C.mutedL }}>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FILTERS (pill buttons) ── */}
        <div style={{ marginBottom:16, display:"flex", flexDirection:"column", gap:10 }}>

          {/* Row 1: type */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ ...raj(10,700), color:C.muted, letterSpacing:".08em", marginRight:2 }}>
              TIPO
            </span>
            {[{ k:"", l:"Todos", color:C.blue },
              ...Object.entries(TYPE_META).map(([k,m]) => ({ k, l:`${m.emoji} ${m.label}`, color:m.color }))
            ].map(({ k, l, color }) => {
              const on = filterType === k;
              return (
                <button key={k} onClick={() => setFilterType(k)} className="af-pill"
                  style={{
                    padding:"5px 12px",
                    border:`1px solid ${on ? color+"88" : C.navy}`,
                    borderRadius:20,
                    background: on ? `${color}18` : "transparent",
                    color: on ? color : C.muted,
                    ...raj(11, on?700:500), cursor:"pointer",
                  }}>
                  {l}
                </button>
              );
            })}
          </div>

          {/* Row 2: status + rating */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ ...raj(10,700), color:C.muted, letterSpacing:".08em", marginRight:2 }}>
              ESTADO
            </span>
            {[{ k:"", l:"Todos", color:C.blue },
              ...Object.entries(STATUS_META).map(([k,m]) => ({ k, l:m.label, color:m.color }))
            ].map(({ k, l, color }) => {
              const on = filterStatus === k;
              return (
                <button key={k} onClick={() => setFilterStatus(k)} className="af-pill"
                  style={{
                    padding:"5px 12px",
                    border:`1px solid ${on ? color+"88" : C.navy}`,
                    borderRadius:20,
                    background: on ? `${color}18` : "transparent",
                    color: on ? color : C.muted,
                    ...raj(11, on?700:500), cursor:"pointer",
                  }}>
                  {l}
                </button>
              );
            })}

            <span style={{ ...raj(10,700), color:C.muted, letterSpacing:".08em", marginLeft:8, marginRight:2 }}>
              RATING
            </span>
            {[0,5,4,3,2,1].map(r => {
              const on   = filterRating === r;
              const rCol = r ? ratingColor(r) : C.blue;
              return (
                <button key={r} onClick={() => setFilterRating(r)} className="af-pill"
                  style={{
                    padding:"5px 12px",
                    border:`1px solid ${on ? rCol+"88" : C.navy}`,
                    borderRadius:20,
                    background: on ? `${rCol}18` : "transparent",
                    color: on ? rCol : C.muted,
                    ...raj(11, on?700:500), cursor:"pointer",
                  }}>
                  {r === 0 ? "Todas" : "★".repeat(r)}
                </button>
              );
            })}
          </div>

          {/* Row 3: spam + clear + count */}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={() => setShowSpam(v => !v)} className="af-pill"
              style={{
                display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
                border:`1px solid ${showSpam ? C.red+"66" : C.navy}`,
                borderRadius:20,
                background: showSpam ? `${C.red}12` : "transparent",
                color: showSpam ? C.red : C.muted,
                ...raj(11,600), cursor:"pointer",
              }}>
              <ShieldOff size={11}/>
              {showSpam ? "Viendo spam" : "Ver spam"}
            </button>

            {hasFilters && (
              <button onClick={clearFilters} className="af-pill"
                style={{
                  display:"flex", alignItems:"center", gap:4, padding:"5px 10px",
                  background:`${C.red}10`, border:`1px solid ${C.red}33`,
                  borderRadius:20, color:C.red, ...raj(11,700), cursor:"pointer",
                }}>
                <X size={11}/> Limpiar
              </button>
            )}

            <span style={{ ...raj(11,400), color:C.muted, marginLeft:"auto" }}>
              {rtLoading
                ? <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                    <Spinner size={11}/> cargando...
                  </span>
                : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`
              }
            </span>
          </div>
        </div>

        {/* ── FEEDBACK LIST ── */}
        <div style={{
          background:C.card, border:`1px solid ${C.navy}`,
          borderRadius:14, overflow:"hidden",
        }}>

          {/* Table header */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"minmax(180px,2fr) 1fr 1fr 1fr 1fr 110px",
            padding:"10px 16px", borderBottom:`1px solid ${C.navy}`,
            background:C.panel,
          }}>
            {["Usuario","Tipo","Rating","Estado","Fecha",""].map(h => (
              <div key={h} style={{ ...raj(10,700), color:C.muted, letterSpacing:".07em" }}>
                {h}
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState filterType={filterType} filterStatus={filterStatus} filterRating={filterRating}/>
          ) : (
            filtered.map(item => {
              const meta       = TYPE_META[item.type]    || TYPE_META.other;
              const sMeta      = STATUS_META[item.status] || STATUS_META.pending;
              const rCol       = ratingColor(item.rating);
              const isFeatured = !!item.featured;
              const isNew      = item.status === "pending"
                                 && (Date.now() - item.createdAt) < 2 * 3600000;
              const date       = new Date(item.createdAt).toLocaleDateString("es-EC",
                { day:"2-digit", month:"short", year:"2-digit" });

              return (
                <div key={item.id} className="af-row"
                  onClick={() => setSelectedItem(item)}
                  onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.5)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
                  style={{
                    display:"grid",
                    gridTemplateColumns:"minmax(180px,2fr) 1fr 1fr 1fr 1fr 110px",
                    padding:"11px 16px",
                    borderBottom:`1px solid ${C.navy}22`,
                    borderLeft:`3px solid ${rCol}55`,
                    alignItems:"center",
                    animation:"af-slide .2s ease",
                  }}>

                  {/* Usuario */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, overflow:"hidden" }}>
                    <Avatar username={item.username} heroClass={item.heroClass}
                      avatarUrl={item.avatarUrl} size={32}/>
                    <div style={{ overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ ...raj(13,600), color:C.white,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {item.username}
                        </span>
                        {isNew && (
                          <span style={{
                            ...px(6), color:C.red,
                            background:`${C.red}18`, border:`1px solid ${C.red}44`,
                            padding:"1px 6px", borderRadius:4,
                            animation:"af-pulse 1.4s ease-in-out infinite",
                          }}>
                            NUEVO
                          </span>
                        )}
                        {isFeatured && (
                          <Globe size={11} color={C.gold} title="Destacado en testimonios"/>
                        )}
                      </div>
                      <div style={{ ...raj(11,400), color:C.muted,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.subject || item.message.slice(0,46)+"…"}
                      </div>
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:4,
                      padding:"3px 10px", borderRadius:20,
                      background:`${meta.color}12`, border:`1px solid ${meta.color}33`,
                      ...raj(11,700), color:meta.color,
                    }}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>

                  {/* Rating */}
                  <div><Stars rating={item.rating} size={12}/></div>

                  {/* Estado */}
                  <div>
                    <span style={{
                      display:"inline-flex", alignItems:"center",
                      padding:"3px 10px", borderRadius:20,
                      background:`${sMeta.color}12`, border:`1px solid ${sMeta.color}33`,
                      ...raj(11,700), color:sMeta.color,
                    }}>
                      {sMeta.label}
                    </span>
                  </div>

                  {/* Fecha */}
                  <div style={{ ...raj(11,400), color:C.muted }}>{date}</div>

                  {/* Acciones rápidas */}
                  <div style={{ display:"flex", gap:4, justifyContent:"flex-end" }}>
                    {/* Featured — solo praise ≥ 4★ */}
                    {item.type === "praise" && item.rating >= 4 && (
                      <button
                        onClick={e => { e.stopPropagation(); handleUpdate(item.id, { featured:!isFeatured }); }}
                        className="af-btn"
                        title={isFeatured ? "Quitar de testimonios" : "Publicar en testimonios"}
                        style={{
                          background: isFeatured ? `${C.gold}20` : `${C.navy}44`,
                          border:`1px solid ${isFeatured ? C.gold+"55" : C.navyL}`,
                          borderRadius:6, padding:"5px 6px", display:"flex", cursor:"pointer",
                        }}>
                        <Globe size={12} color={isFeatured ? C.gold : C.muted}/>
                      </button>
                    )}
                    {/* Spam */}
                    {!item.isSpam && (
                      <button
                        onClick={e => { e.stopPropagation(); handleUpdate(item.id, { isSpam:true, status:"resolved" }); }}
                        className="af-btn" title="Marcar como spam"
                        style={{
                          background:`${C.navy}44`, border:`1px solid ${C.navyL}`,
                          borderRadius:6, padding:"5px 6px", display:"flex", cursor:"pointer",
                        }}>
                        <ShieldOff size={12} color={C.muted}/>
                      </button>
                    )}
                    {/* Ver detalle */}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                      className="af-btn" title="Ver detalle"
                      style={{
                        background:`${C.blue}14`, border:`1px solid ${C.blue}33`,
                        borderRadius:6, padding:"5px 6px", display:"flex", cursor:"pointer",
                      }}>
                      <Eye size={12} color={C.blue}/>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}
