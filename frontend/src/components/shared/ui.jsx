// src/components/shared/ui.jsx
// ─────────────────────────────────────────────────────────────
//  Biblioteca de UI transversal de ForgeVenture.
//  Exporta: Skeleton*, EmptyState, Spinner, Toast/useToast,
//           ConfirmModal, useAutoRefresh
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";
import { AlertTriangle, Check, X, RefreshCw, Info } from "lucide-react";
import { toast as sonnerToast, Toaster } from "sonner";

// ── Paleta base (dark RPG) ─────────────────────────────────────
export const C = {
  bg:     "#050C18", card:   "#0C1826", panel:  "#091220",
  navy:   "#1A3354", navyL:  "#1E3A5F",
  orange: "#E85D04", orangeL:"#FF9F1C", gold: "#FFD700",
  blue:   "#4CC9F0", teal:   "#0A9396", green:"#2ecc71",
  red:    "#E74C3C", purple: "#9B59B6",
  white:  "#F0F4FF", muted:  "#5A7A9A", mutedL:"#7A9AB8",
};

// ── Global shared CSS (inject once in root or per-page) ────────
export const SHARED_CSS = `
  @keyframes fv-shimmer    { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes fv-fadeUp     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fv-scaleIn    { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes fv-spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fv-pulse      { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes fv-toastIn    { from{opacity:0;transform:translateY(20px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fv-toastOut   { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(10px) scale(.95)} }
  @keyframes fv-modalIn    { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes fv-slideE     { from{opacity:0;transform:translateX(-6px)} to{opacity:.85;transform:translateX(0)} }

  .fv-skel {
    background: linear-gradient(90deg, ${C.card} 25%, ${C.navyL}44 50%, ${C.card} 75%);
    background-size: 600px 100%;
    animation: fv-shimmer 1.5s infinite linear;
  }

  .fv-modal-bd {
    position:fixed;inset:0;background:rgba(5,12,24,.88);
    display:flex;align-items:center;justify-content:center;z-index:9999;
    backdrop-filter:blur(4px);
  }

  /* Mobile responsive overrides */
  @media (max-width: 768px) {
    .fv-grid-4   { grid-template-columns: 1fr 1fr !important; }
    .fv-grid-3   { grid-template-columns: 1fr 1fr !important; }
    .fv-grid-2-1 { grid-template-columns: 1fr !important; }
    .fv-hide-mobile { display: none !important; }
    .fv-full-mobile { width: 100% !important; min-width: 0 !important; }
  }
  @media (max-width: 480px) {
    .fv-grid-4   { grid-template-columns: 1fr !important; }
    .fv-grid-3   { grid-template-columns: 1fr !important; }
    .fv-grid-2-1 { grid-template-columns: 1fr !important; }
  }
`;

// ── Typography helpers ─────────────────────────────────────────
export const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
export const raj = (s, w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
export const orb = (s, w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ─────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Bare rectangle shimmer placeholder */
export function SkeletonBox({ width="100%", height=18, style={} }) {
  return (
    <div className="fv-skel" style={{ width, height, borderRadius:2, ...style }}/>
  );
}

/** Skeleton for a card with title + N lines */
export function SkeletonCard({ lines=3, height=120, accentColor=C.orange, style={} }) {
  return (
    <div style={{
      background:C.card, border:`1px solid ${C.navy}`,
      padding:"18px 20px", ...style,
      animation:"fv-fadeUp .4s ease both",
    }}>
      <SkeletonBox width="55%" height={14} style={{ marginBottom:12 }}/>
      {Array.from({length:lines},(_,i)=>(
        <SkeletonBox key={i} width={i===lines-1?"40%":"100%"} height={11}
          style={{ marginBottom:i<lines-1?8:0 }}/>
      ))}
    </div>
  );
}

/** Skeleton for a data row (icon + text + trailing value) */
export function SkeletonRow({ height=52, style={} }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14, padding:"12px 20px",
      borderBottom:`1px solid ${C.navy}22`, ...style,
    }}>
      <div className="fv-skel" style={{ width:32, height:32, borderRadius:4, flexShrink:0 }}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <SkeletonBox width="60%" height={12}/>
        <SkeletonBox width="40%" height={10}/>
      </div>
      <SkeletonBox width={48} height={22} style={{ flexShrink:0 }}/>
    </div>
  );
}

/** Full page / panel skeleton with N cards */
export function SkeletonPage({ cards=4, cardLines=3 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Header skeleton */}
      <div style={{ background:C.card, border:`1px solid ${C.navy}`, padding:"16px 20px",
        display:"flex", alignItems:"center", gap:12 }}>
        <div className="fv-skel" style={{ width:20, height:20, borderRadius:2 }}/>
        <SkeletonBox width={180} height={14}/>
      </div>
      {/* Card grid skeleton */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
        {Array.from({length:cards},(_,i)=>(
          <SkeletonCard key={i} lines={cardLines} style={{ animationDelay:`${i*.07}s` }}/>
        ))}
      </div>
    </div>
  );
}

/** Inline skeleton for tables — N rows */
export function SkeletonTable({ rows=5 }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.navy}` }}>
      {/* fake thead */}
      <div style={{ background:`${C.panel}88`, padding:"10px 20px", borderBottom:`1px solid ${C.navy}` }}>
        <SkeletonBox width="50%" height={10}/>
      </div>
      {Array.from({length:rows},(_,i)=>(
        <SkeletonRow key={i} style={{ animationDelay:`${i*.05}s` }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

/**
 * Renders a centered empty-state block.
 * @param {string} icon     - Emoji or text icon
 * @param {string} title    - Bold heading
 * @param {string} text     - Subtitle / explanation
 * @param {{label,onClick}} action - Optional CTA button
 * @param {string} color    - Accent color (default C.muted)
 * @param {number} minHeight - Container min height
 */
export function EmptyState({
  icon = "🔍",
  title = "Sin datos",
  text = "No hay nada que mostrar aquí todavía.",
  action = null,
  color = C.muted,
  minHeight = 220,
  style = {},
}) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:12, minHeight,
      padding:"40px 24px", textAlign:"center",
      animation:"fv-scaleIn .4s ease both", ...style,
    }}>
      <div style={{ fontSize:44, filter:`drop-shadow(0 0 12px ${color}44)`,
        animation:"fv-pulse 2.5s ease-in-out infinite" }}>
        {icon}
      </div>
      <div style={{ ...orb(13,700), color:C.white }}>{title}</div>
      <div style={{ ...raj(13,400), color:C.mutedL, maxWidth:340, lineHeight:1.7 }}>{text}</div>
      {action && (
        <button onClick={action.onClick}
          style={{ ...raj(13,700), color:C.bg, background:color, border:"none",
            padding:"10px 24px", cursor:"pointer", marginTop:4,
            boxShadow:`0 4px 16px ${color}44` }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────
export function Spinner({ color=C.orange, size=14 }) {
  return (
    <div style={{
      width:size, height:size,
      border:`2px solid ${C.muted}44`,
      borderTop:`2px solid ${color}`,
      borderRadius:"50%",
      animation:"fv-spin .8s linear infinite",
      flexShrink:0,
    }}/>
  );
}

/** Full-screen / full-panel loading overlay */
export function LoadingPanel({ text="Cargando...", height=280 }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:16, height,
      color:C.white, animation:"fv-fadeUp .4s ease both",
    }}>
      <RefreshCw size={34} color={C.orange} style={{ animation:"fv-spin 1s linear infinite" }}/>
      <span style={{ ...raj(13,600), color:C.mutedL }}>{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOAST SYSTEM — context-based global queue
// ─────────────────────────────────────────────────────────────

const TOAST_VARIANTS = {
  success: { icon:<Check size={13}/>,           bg:C.green,   label:"OK"     },
  error:   { icon:<X size={13}/>,               bg:C.red,     label:"Error"  },
  info:    { icon:<Info size={13}/>,             bg:C.blue,    label:"Info"   },
  warn:    { icon:<AlertTriangle size={13}/>,    bg:C.orangeL, label:"Aviso"  },
};

// Durations per type (ms)
const TOAST_DURATIONS = { success:2500, info:3000, warn:3500, error:4500 };

// ── Sonner-backed toast API ────────────────────────────────────
// ToastProvider now just renders <Toaster> from sonner.
// useToast() returns the same {push, success, error, info, warn} API
// so every existing caller keeps working without changes.

const VARIANT_MAP = { success: "success", error: "error", info: "info", warn: "warning" };

const toastApi = {
  push:    (text, variant = "success") => {
    const fn = sonnerToast[VARIANT_MAP[variant] ?? "message"] ?? sonnerToast;
    fn(text);
  },
  success: (text) => sonnerToast.success(text),
  error:   (text) => sonnerToast.error(text),
  info:    (text) => sonnerToast.info(text),
  warn:    (text) => sonnerToast.warning(text),
};

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            background: "#0C1826",
            border: "1px solid #1A3354",
            color: "#F0F4FF",
          },
        }}
      />
    </>
  );
}

export function useToast() {
  return toastApi;
}

// kept for backward compat — dead code path now
function ToasterRenderer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <>
      <style>{`
        @keyframes fv-tIn  { from{opacity:0;transform:translateX(24px) scale(.95)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes fv-tOut { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(18px) scale(.95)} }
        .fv-toast-wrap {
          position:fixed; bottom:20px; right:20px; z-index:99999;
          display:flex; flex-direction:column; gap:8px;
          pointer-events:none;
        }
        @media(max-width:600px){
          .fv-toast-wrap { right:0; left:0; bottom:72px; align-items:center; }
        }
        .fv-toast {
          pointer-events:all;
          display:flex; align-items:center; gap:10;
          padding:11px 14px 11px 12px;
          background:#0C1826; border-left:3px solid;
          box-shadow:0 8px 32px rgba(0,0,0,.55), 2px 2px 0 rgba(0,0,0,.4);
          max-width:340px; min-width:200px;
          cursor:pointer; user-select:none;
        }
        @media(max-width:600px){
          .fv-toast { width:calc(100vw - 32px); max-width:none; }
        }
        .fv-toast.fv-t-in  { animation:fv-tIn  .3s cubic-bezier(.22,1,.36,1) both; }
        .fv-toast.fv-t-out { animation:fv-tOut .32s ease forwards; }
        .fv-toast-progress {
          position:absolute; bottom:0; left:0; height:2px;
          animation:fv-tProgress var(--dur) linear forwards;
        }
        @keyframes fv-tProgress { from{width:100%} to{width:0%} }
        .fv-toast-icon {
          width:20px; height:20px; display:flex; align-items:center;
          justify-content:center; flex-shrink:0;
        }
        .fv-toast-msg {
          font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600;
          color:#F0F4FF; line-height:1.45; flex:1;
        }
        .fv-toast-close {
          flex-shrink:0; opacity:.45; transition:opacity .15s; display:flex; margin-left:4px;
        }
        .fv-toast:hover .fv-toast-close { opacity:.85; }
      `}</style>
      <div className="fv-toast-wrap">
        {toasts.map(t => {
          const v   = TOAST_VARIANTS[t.variant] || TOAST_VARIANTS.info;
          const dur = `${TOAST_DURATIONS[t.variant] ?? 3000}ms`;
          return (
            <div key={t.id}
              className={`fv-toast ${t.leaving ? "fv-t-out" : "fv-t-in"}`}
              style={{ borderColor: v.bg, position:"relative", overflow:"hidden" }}
              onClick={() => onDismiss(t.id)}>
              <div className="fv-toast-icon" style={{ color: v.bg }}>
                {v.icon}
              </div>
              <span className="fv-toast-msg">{t.text}</span>
              <div className="fv-toast-close"><X size={12} color="#5A7A9A"/></div>
              {!t.leaving && (
                <div className="fv-toast-progress"
                  style={{ background: v.bg, opacity:.5, "--dur": dur }}/>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * @deprecated — Use useToast() + ToastProvider instead.
 * Kept for backward compatibility during migration.
 */
export function Toast({ toasts }) {
  // no-op — toasts now render through ToasterRenderer inside ToastProvider
  return null;
}

// ─────────────────────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
/**
 * Generic confirm modal.
 * @param {string} title
 * @param {string} message
 * @param {string} confirmLabel
 * @param {string} confirmVariant - 'danger' | 'warn' | 'primary'
 * @param {string} typedConfirm   - if set, user must type this to confirm
 * @param {function} onConfirm
 * @param {function} onCancel
 * @param {boolean} loading
 */
export function ConfirmModal({
  title = "¿Confirmar acción?",
  message = "",
  confirmLabel = "Confirmar",
  confirmVariant = "danger",
  typedConfirm = null,
  onConfirm,
  onCancel,
  loading = false,
  children,
}) {
  const [typed, setTyped] = useState("");
  const needsType = Boolean(typedConfirm);
  const canConfirm = !needsType || typed.trim() === typedConfirm;

  const accentColor = {
    danger: C.red,
    warn:   C.orangeL,
    primary:C.orange,
  }[confirmVariant] || C.red;

  return (
    <div className="fv-modal-bd" onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.card, border:`1px solid ${accentColor}44`,
        width:"min(440px, 92vw)", animation:"fv-modalIn .22s ease",
      }}>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"18px 22px", borderBottom:`1px solid ${C.navy}`,
        }}>
          <AlertTriangle size={16} color={accentColor}/>
          <span style={{ ...orb(11,700), color:C.white, flex:1 }}>{title}</span>
          <button onClick={onCancel}
            style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}>
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:"18px 22px" }}>
          {message && (
            <p style={{ ...raj(13,400), color:C.mutedL, lineHeight:1.7, marginBottom:children||needsType?14:0 }}>
              {message}
            </p>
          )}
          {children}
          {needsType && (
            <div style={{ marginTop:14 }}>
              <div style={{ ...raj(11,600), color:C.mutedL, marginBottom:6 }}>
                Escribe <strong style={{ color:accentColor }}>{typedConfirm}</strong> para confirmar:
              </div>
              <input
                autoFocus
                value={typed}
                onChange={e=>setTyped(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&canConfirm&&!loading&&onConfirm()}
                style={{
                  width:"100%", padding:"10px 12px",
                  background:C.panel,
                  border:`1px solid ${canConfirm&&typed?C.green:C.navy}`,
                  color:C.white, ...raj(13,600),
                  outline:"none", transition:"border-color .2s",
                  boxSizing:"border-box",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display:"flex", gap:8, justifyContent:"flex-end",
          padding:"14px 22px", borderTop:`1px solid ${C.navy}`,
        }}>
          <button onClick={onCancel}
            style={{ ...raj(12,600), color:C.muted, background:C.panel,
              border:`1px solid ${C.navy}`, padding:"9px 16px", cursor:"pointer" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={!canConfirm||loading}
            style={{
              ...raj(12,700), color:C.white,
              background: canConfirm&&!loading ? accentColor : `${accentColor}44`,
              border:"none", padding:"9px 18px",
              cursor:canConfirm&&!loading?"pointer":"not-allowed",
              display:"flex", alignItems:"center", gap:7, transition:"all .2s",
              boxShadow:canConfirm&&!loading?`0 4px 16px ${accentColor}44`:"none",
            }}>
            {loading ? <><Spinner color={C.white}/> Ejecutando...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INLINE FIELD ERROR
// ─────────────────────────────────────────────────────────────
export function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:5, marginTop:4,
      ...raj(11,600), color:C.red, animation:"fv-slideE .2s ease both",
    }}>
      <AlertTriangle size={10}/>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// API ERROR BANNER
// ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      background:`${C.red}0C`, border:`1px solid ${C.red}33`,
      padding:"12px 18px", marginBottom:12,
      animation:"fv-slideE .3s ease both",
    }}>
      <AlertTriangle size={14} color={C.red} style={{ flexShrink:0 }}/>
      <span style={{ ...raj(12,600), color:C.red, flex:1, lineHeight:1.5 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry}
          style={{ ...raj(11,700), color:C.red, background:`${C.red}14`,
            border:`1px solid ${C.red}44`, padding:"5px 12px", cursor:"pointer", flexShrink:0 }}>
          Reintentar
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss}
          style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", display:"flex", padding:0 }}>
          <X size={13}/>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTO-REFRESH HOOK
// ─────────────────────────────────────────────────────────────
/**
 * useAutoRefresh(fn, intervalMs, deps)
 * Calls fn immediately on mount (and deps change), then every intervalMs.
 * Returns { refresh, refreshing } for manual trigger.
 */
export function useAutoRefresh(fn, intervalMs = 60_000, deps = []) {
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let mounted = true;
    const run = async (silent=false) => {
      if (!silent) setRefreshing(true);
      try { await fnRef.current(); }
      catch(e) { console.error("useAutoRefresh:", e); }
      finally { if (mounted) setRefreshing(false); }
    };

    run(false);
    const iv = setInterval(() => run(true), intervalMs);
    return () => { mounted = false; clearInterval(iv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await fnRef.current(); }
    finally { setRefreshing(false); }
  }, []);

  return { refresh, refreshing };
}

// ─────────────────────────────────────────────────────────────
// LAST-UPDATED BADGE
// ─────────────────────────────────────────────────────────────
export function RefreshBadge({ onRefresh, refreshing, label="Actualizar" }) {
  return (
    <button onClick={onRefresh} disabled={refreshing}
      style={{
        display:"flex", alignItems:"center", gap:6,
        ...raj(11,600), color:refreshing?C.muted:C.mutedL,
        background:C.panel, border:`1px solid ${C.navy}`,
        padding:"5px 12px", cursor:refreshing?"not-allowed":"pointer",
        transition:"all .2s",
      }}>
      <RefreshCw size={11} style={{ animation:refreshing?"fv-spin .8s linear infinite":"none" }}/>
      {refreshing?"Actualizando...":label}
    </button>
  );
}
