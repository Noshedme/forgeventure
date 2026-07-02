import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import {
  AlertTriangle,
  Bell,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Inbox,
  Megaphone,
  PanelLeft,
  ScrollText,
  Search,
  ShieldAlert,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { db } from "../../firebase.js";
import {
  getUserMessagesPage,
  getMessagePreferences,
  markAllMessagesRead,
  saveMessageForUser,
  unsaveMessageForUser,
} from "../../services/api.js";

// Session-level preferences cache — survives component unmount/remount within the same tab
const _sessionPrefCache = new Map(); // uid → { savedIds: string[], ts: number }
const SESSION_PREF_TTL  = 3 * 60_000; // 3 min

const PAGE_CSS = `
.fvg-msg-root{font-family:'Manrope',sans-serif}
.fvg-msg-scroll::-webkit-scrollbar{width:6px;height:6px}
.fvg-msg-scroll::-webkit-scrollbar-track{background:transparent}
.fvg-msg-scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--msg-accent, #b08cff), transparent 62%);border-radius:999px}
.fvg-msg-scroll::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb, var(--msg-accent, #b08cff), transparent 34%)}
.fvg-msg-line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fvg-msg-line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.fvg-msg-hero-title{font:900 clamp(36px,5.2vw,80px)/.92 "Manrope",sans-serif;max-width:14ch;color:#fff9ef}
.fvg-msg-hero-lead{font:500 clamp(14px,1.2vw,18px)/1.7 "Manrope",sans-serif;max-width:720px;color:#cdbfe0}
.fvg-msg-3col{display:grid;gap:14px;align-items:start;grid-template-columns:228px minmax(0,1fr) 372px}
@media(max-width:1760px){.fvg-msg-3col{grid-template-columns:214px minmax(0,1fr) 356px}}
@media(max-width:1600px){.fvg-msg-3col{grid-template-columns:206px minmax(0,1fr) 340px}}
@media(max-width:1440px){.fvg-msg-3col{grid-template-columns:196px minmax(0,1fr) 322px}}
@media(max-width:1366px){.fvg-msg-3col{grid-template-columns:188px minmax(0,1fr) 308px}}
@media(max-width:1280px){.fvg-msg-3col{grid-template-columns:180px minmax(0,1fr) 290px}}
@media(max-width:1180px){.fvg-msg-3col{grid-template-columns:170px minmax(0,1fr)}}
@media(max-width:1024px){.fvg-msg-3col{grid-template-columns:1fr}}
@media(max-width:979px){.fvg-msg-3col{grid-template-columns:1fr}}
`;

const SC = {
  bg: "#080912",
  panel: "rgba(13, 16, 28, 0.86)",
  panelSoft: "rgba(18, 21, 34, 0.78)",
  card: "rgba(20, 24, 38, 0.92)",
  line: "rgba(173, 190, 255, 0.14)",
  text: "#f4f7ff",
  muted: "#9da7c4",
  soft: "#79829f",
  gold: "#f2c66d",
  red: "#ef6b6b",
  green: "#62d788",
  blue: "#6dc7ff",
  purple: "#b08cff",
  shadow: "0 24px 80px rgba(0,0,0,.34)",
};

const CLASS_THEME = {
  GUERRERO: {
    color: "#ef6464",
    soft: "rgba(239, 100, 100, 0.18)",
    glow: "rgba(239, 100, 100, 0.34)",
    crest: "/ui/crest-warrior.png",
    label: "Guerrero",
  },
  ARQUERO: {
    color: "#7de06f",
    soft: "rgba(125, 224, 111, 0.18)",
    glow: "rgba(125, 224, 111, 0.32)",
    crest: "/ui/crest-archer.png",
    label: "Arquero",
  },
  MAGO: {
    color: "#66b9ff",
    soft: "rgba(102, 185, 255, 0.18)",
    glow: "rgba(102, 185, 255, 0.32)",
    crest: "/ui/crest-mage.png",
    label: "Mago",
  },
  DEFAULT: {
    color: "#b08cff",
    soft: "rgba(176, 140, 255, 0.18)",
    glow: "rgba(176, 140, 255, 0.3)",
    crest: "/ui/crest-default.png",
    label: "Aventurero",
  },
};

const MESSAGE_TYPE_META = {
  announcement: {
    label: "Anuncio",
    tone: "Comunicado del mapa",
    color: "#b58cff",
    soft: "rgba(181, 140, 255, 0.16)",
    icon: Megaphone,
    asset: "/ui/header/notifications/notif-message.png",
  },
  warning: {
    label: "Aviso",
    tone: "Señal prioritaria",
    color: "#84df6f",
    soft: "rgba(132, 223, 111, 0.18)",
    icon: AlertTriangle,
    asset: "/ui/header/notifications/notif-shield.png",
  },
  system: {
    label: "Sistema",
    tone: "Ajuste del tablero",
    color: "#68c8ff",
    soft: "rgba(104, 200, 255, 0.16)",
    icon: Zap,
    asset: "/ui/header/notifications/notif-message.png",
  },
  achievement: {
    label: "Logro",
    tone: "Reconocimiento",
    color: "#f2c66d",
    soft: "rgba(242, 198, 109, 0.18)",
    icon: Trophy,
    asset: "/ui/header/notifications/notif-medal.png",
  },
  event: {
    label: "Evento",
    tone: "Ventana especial",
    color: "#ff7c96",
    soft: "rgba(255, 124, 150, 0.16)",
    icon: CalendarDays,
    asset: "/missions/seals/seal-event.png",
  },
};

const FILTER_ORDER = [
  "all",
  "unread",
  "important",
  "saved",
  "announcement",
  "warning",
  "system",
  "achievement",
  "event",
];

const FILTER_META = {
  all: { label: "Todo el buzón", color: SC.gold, icon: Inbox, asset: "/ui/header/section-mensajes.png" },
  unread: { label: "Sin leer", color: SC.blue, icon: Bell, asset: "/ui/header/notifications/notif-message.png" },
  important: { label: "Prioridad alta", color: SC.red, icon: ShieldAlert, asset: "/ui/chat/chat-request-seal.png" },
  saved: { label: "Guardados", color: SC.green, icon: BookmarkCheck, asset: "/missions/rewards/reward-claimed-seal.png" },
  announcement: { label: "Anuncios", color: MESSAGE_TYPE_META.announcement.color, icon: Megaphone, asset: MESSAGE_TYPE_META.announcement.asset },
  warning: { label: "Avisos", color: MESSAGE_TYPE_META.warning.color, icon: AlertTriangle, asset: MESSAGE_TYPE_META.warning.asset },
  system: { label: "Sistema", color: MESSAGE_TYPE_META.system.color, icon: Zap, asset: MESSAGE_TYPE_META.system.asset },
  achievement: { label: "Logros", color: MESSAGE_TYPE_META.achievement.color, icon: Trophy, asset: MESSAGE_TYPE_META.achievement.asset },
  event: { label: "Eventos", color: MESSAGE_TYPE_META.event.color, icon: CalendarDays, asset: MESSAGE_TYPE_META.event.asset },
};

const HERO_ASSETS = {
  section: "/ui/header/section-mensajes.png",
  overlay: "/ui/panel-texture.png",
  empty: "/ui/header/notifications/notif-empty.png",
  crestFallback: "/ui/crest-default.png",
};

const EASE = [0.22, 1, 0.36, 1];
const HISTORY_PAGE_SIZE = 60;

function buildStorageKey(uid, suffix) {
  return `fv-msg-${suffix}-${uid || "guest"}`;
}

function readStoredValue(key, fallback = "") {
  try {
    const raw = localStorage.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function getClassKey(raw) {
  const value = String(raw || "").toUpperCase();
  if (value.includes("ARQU")) return "ARQUERO";
  if (value.includes("MAG")) return "MAGO";
  if (value.includes("GUERR")) return "GUERRERO";
  return "DEFAULT";
}

function fmtRelative(ts) {
  if (!ts) return "Sin fecha";
  const date = new Date(ts);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return "Sin fecha";
  if (diff < 60_000) return "Ahora mismo";
  if (diff < 3_600_000) return `Hace ${Math.max(1, Math.floor(diff / 60_000))} min`;
  if (diff < 86_400_000) return `Hace ${Math.max(1, Math.floor(diff / 3_600_000))} h`;
  if (diff < 172_800_000) return "Ayer";
  return `Hace ${Math.max(1, Math.floor(diff / 86_400_000))} días`;
}

function fmtFull(ts) {
  if (!ts) return "Sin fecha disponible";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "Sin fecha disponible";
  return date.toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readStoredSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function getTemporalBucket(ts) {
  if (!ts) return "archive";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "archive";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (date >= todayStart) return "today";

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  if (date >= weekStart) return "week";

  return "archive";
}

const TEMPORAL_BUCKET_META = {
  today: { label: "Hoy", hint: "Pulso inmediato" },
  week: { label: "Esta semana", hint: "Lectura reciente" },
  archive: { label: "Archivo reciente", hint: "Notas previas" },
};

const PRIORITY_META = {
  info: {
    label: "Informativo",
    color: SC.blue,
    soft: "rgba(109, 199, 255, 0.14)",
  },
  action: {
    label: "Acción recomendada",
    color: SC.gold,
    soft: "rgba(242, 198, 109, 0.14)",
  },
  urgent: {
    label: "Urgente",
    color: SC.red,
    soft: "rgba(239, 107, 107, 0.14)",
  },
};

function getMessagePriority(msg) {
  const tags = Array.isArray(msg?.tags) ? msg.tags.map((tag) => String(tag).toLowerCase()) : [];
  if (tags.includes("urgent") || tags.includes("important") || msg?.type === "warning") return "urgent";
  if (tags.includes("action") || tags.includes("claim") || msg?.actionRequired || msg?.type === "event") return "action";
  return "info";
}

function getScopeLabel(msg) {
  return msg?.targetAll ? "Global" : "Solo para ti";
}

function getOriginLabel(msg) {
  if (msg?.sourceLabel) return msg.sourceLabel;
  if (msg?.type === "system") return "Sistema";
  if (msg?.type === "achievement") return "Logro";
  if (msg?.type === "event") return "Evento";
  return "Admin";
}

function getExpiryLabel(msg) {
  if (!msg?.expiresAt) return "Sin cierre marcado";
  const expires = new Date(msg.expiresAt);
  if (Number.isNaN(expires.getTime())) return "Sin cierre marcado";
  const diff = expires.getTime() - Date.now();
  if (diff <= 0) return "Cerrado";
  if (diff < 86_400_000) return "Vence hoy";
  if (diff < 172_800_000) return "Vence mañana";
  return `Vigente hasta ${fmtFull(msg.expiresAt)}`;
}

function getActionLabel(msg) {
  if (msg?.actionLabel) return msg.actionLabel;
  return msg?.actionRequired ? "Requiere acción" : "Solo lectura";
}

function getMessageLinkLabel(msg) {
  if (msg?.missionId) return `Misión ${msg.missionId}`;
  if (msg?.achievementId) return `Logro ${msg.achievementId}`;
  if (msg?.itemId) return `Objeto ${msg.itemId}`;
  if (msg?.routeTarget) return `Ruta ${msg.routeTarget}`;
  return "Sin enlace directo";
}

function getActionSection(msg) {
  if (msg?.routeTarget) return msg.routeTarget;
  if (msg?.missionId) return "misiones";
  if (msg?.achievementId) return "logros";
  if (msg?.itemId) return "tienda";
  return null;
}

function MessageTypeBadge({ type }) {
  const meta = MESSAGE_TYPE_META[type] || MESSAGE_TYPE_META.system;
  const Icon = meta.icon;
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${meta.color}33`,
      background: `linear-gradient(180deg, ${meta.soft}, rgba(255,255,255,.03))`,
      color: meta.color,
      font: '700 11px/1 "JetBrains Mono", monospace',
      letterSpacing: ".05em",
      textTransform: "uppercase",
    }}>
      <Icon size={13} />
      {meta.label}
    </div>
  );
}

function MessageScopeSeal({ msg }) {
  const personal = !msg?.targetAll;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${personal ? "rgba(242,198,109,.32)" : "rgba(109,199,255,.28)"}`,
      background: personal ? "rgba(242,198,109,.12)" : "rgba(109,199,255,.1)",
      color: personal ? SC.gold : SC.blue,
      font: '700 10px/1 "JetBrains Mono", monospace',
      letterSpacing: ".05em",
      textTransform: "uppercase",
    }}>
      {personal ? "Solo para ti" : "Global"}
    </span>
  );
}

function MetricCard({ label, value, hint, color, icon: Icon }) {
  return (
    <div style={{
      minWidth: 0,
      padding: "14px 15px",
      borderRadius: 18,
      border: `1px solid ${color}28`,
      background: `linear-gradient(180deg, ${color}10, rgba(255,255,255,.02))`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.05), 0 10px 24px ${color}14`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: `${color}12`,
          border: `1px solid ${color}24`,
          color,
          flexShrink: 0,
        }}>
          <Icon size={14} />
        </div>
        <div style={{
          color: SC.muted,
          font: '700 10px/1.1 "JetBrains Mono", monospace',
          textTransform: "uppercase",
          letterSpacing: ".12em",
        }}>
          {label}
        </div>
      </div>
      <div style={{ color: SC.text, font: '800 28px/1 "Manrope", sans-serif', marginBottom: 6, textShadow: `0 0 20px ${color}cc, 0 0 40px ${color}55, 0 0 66px ${color}22` }}>{value}</div>
      <div style={{ color: SC.muted, font: '500 12px/1.45 "Manrope", sans-serif' }}>{hint}</div>
    </div>
  );
}

function FilterChip({ id, active, count, onClick }) {
  const meta = FILTER_META[id];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid ${active ? `${meta.color}66` : "color-mix(in srgb, var(--msg-accent, #b08cff), transparent 76%)"}`,
        background: active
          ? `linear-gradient(180deg, ${meta.color}18, rgba(255,255,255,.03))`
          : "linear-gradient(180deg, color-mix(in srgb, var(--msg-accent, #b08cff), transparent 92%), rgba(255,255,255,.02))",
        color: active ? SC.text : SC.muted,
        cursor: "pointer",
        transition: "all .18s ease",
        minWidth: 0,
      }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        background: `${meta.color}14`,
        border: `1px solid ${meta.color}22`,
        color: meta.color,
        flexShrink: 0,
        overflow: "hidden",
      }}>
        <img
          src={meta.asset}
          alt=""
          style={{ width: 14, height: 14, objectFit: "contain" }}
          onError={(e) => { e.currentTarget.src = HERO_ASSETS.section; }}
        />
      </div>
      <span style={{
        font: '700 12px/1.1 "Manrope", sans-serif',
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textShadow: active ? `0 0 12px ${meta.color}bb, 0 0 24px ${meta.color}44` : "none",
      }}>
        {meta.label}
      </span>
      <span style={{
        marginLeft: 2,
        minWidth: 20,
        height: 20,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: active ? `${meta.color}16` : "rgba(255,255,255,.04)",
        color: active ? meta.color : SC.soft,
        font: '700 10px/1 "JetBrains Mono", monospace',
        flexShrink: 0,
      }}>
        {count}
      </span>
    </button>
  );
}

function MessageRow({ msg, selected, isRead, isSaved, isPending, onSelect, onSave }) {
  const meta = MESSAGE_TYPE_META[msg.type] || MESSAGE_TYPE_META.system;
  const Icon = meta.icon;
  const priorityKey = getMessagePriority(msg);
  const priority = PRIORITY_META[priorityKey];
  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3, scale: 1.003 }}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 22,
        border: `1px solid ${selected ? `${meta.color}52` : isRead ? "rgba(255,255,255,.08)" : `${meta.color}28`}`,
        background: selected
          ? `linear-gradient(180deg, ${meta.soft}, rgba(255,255,255,.035))`
          : isRead
            ? "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.018))"
            : `linear-gradient(180deg, ${meta.color}10, rgba(255,255,255,.02))`,
        boxShadow: selected ? `0 20px 40px ${meta.color}24, 0 0 0 1px ${meta.color}14 inset` : `0 12px 28px rgba(0,0,0,.2), 0 0 18px ${meta.color}10`,
        padding: 14,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}>
      <div style={{
        position: "absolute",
        inset: "0 auto 0 0",
        width: 5,
        background: `linear-gradient(180deg, ${priority.color}, transparent 90%)`,
        boxShadow: `0 0 16px ${priority.color}55`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        inset: "0 0 auto 0",
        height: 32,
        background: `linear-gradient(90deg, ${meta.soft}, transparent 60%)`,
        borderBottom: `1px solid ${meta.color}1f`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,.08), transparent 40%)",
        pointerEvents: "none",
        opacity: selected ? 1 : .45,
      }} />
      <div style={{ display: "grid", gridTemplateColumns: "78px minmax(0,1fr) auto", gap: 14, position: "relative", zIndex: 1 }}>
        <div style={{
          width: 78,
          height: 78,
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid ${meta.color}30`,
          background: `linear-gradient(180deg, rgba(10,12,20,.94), ${meta.soft})`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,.03), 0 0 18px ${meta.color}14`,
        }}>
          {msg.imageUrl ? (
            <img src={msg.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
              <img
                src={meta.asset}
                alt=""
                style={{ width: 28, height: 28, objectFit: "contain" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                border: `1px solid ${meta.color}30`,
                background: `${meta.color}14`,
                color: meta.color,
                display: "grid",
                placeItems: "center",
              }}>
                <Icon size={16} />
              </div>
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: SC.text,
                font: '800 17px/1.05 "Manrope", sans-serif',
                marginBottom: 5,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                textShadow: `0 0 14px ${meta.color}77, 0 0 28px ${meta.color}2a`,
              }}>
                {!isRead && <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, boxShadow: `0 0 14px ${meta.color}` }} />}
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {msg.title || "Mensaje del sistema"}
                </span>
              </div>
              <div className="fvg-msg-line-clamp-2" style={{ color: SC.muted, font: '500 13px/1.55 "Manrope", sans-serif', maxWidth: 680 }}>
                {msg.text || "El mapa dejó una nueva nota en tu buzón."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <MessageTypeBadge type={msg.type} />
            <MessageScopeSeal msg={msg} />
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 10px",
              borderRadius: 999,
              border: `1px solid ${priority.color}36`,
              background: priority.soft,
              color: priority.color,
              font: '700 10px/1 "JetBrains Mono", monospace',
              letterSpacing: ".05em",
              textTransform: "uppercase",
            }}>
              {priority.label}
            </span>
            {msg.tags?.slice(0, 2).map((tag) => (
              <span key={tag} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.03)",
                color: SC.soft,
                font: '700 10px/1 "JetBrains Mono", monospace',
                letterSpacing: ".05em",
                textTransform: "uppercase",
              }}>
                <Sparkles size={11} />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", justifyItems: "end", gap: 12, minWidth: 84 }}>
          <button
            type="button"
            onClick={(e) => onSave(e)}
            aria-label={isSaved ? "Quitar guardado" : "Guardar mensaje"}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: `1px solid ${isSaved ? `${SC.gold}44` : "rgba(255,255,255,.08)"}`,
              background: isSaved ? "rgba(242,198,109,.12)" : "rgba(255,255,255,.03)",
              display: "grid",
              placeItems: "center",
              color: isSaved ? SC.gold : SC.muted,
              cursor: "pointer",
            }}>
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>

          <div style={{ color: SC.muted, font: '700 10px/1.25 "JetBrains Mono", monospace', textAlign: "right", letterSpacing: ".06em" }}>
            <div>{fmtRelative(msg.createdAt)}</div>
            <div style={{ marginTop: 6, color: isPending ? SC.gold : isRead ? SC.soft : meta.color }}>
              {isPending ? "Sync..." : isRead ? "Leído" : "Nuevo"}
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({ activeFilter, onReset }) {
  return (
    <div style={{
      minHeight: 320,
      borderRadius: 26,
      border: "1px solid rgba(255,255,255,.08)",
      background: "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.015))",
      display: "grid",
      placeItems: "center",
      padding: 28,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 12%, rgba(255,255,255,.08), transparent 45%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 460 }}>
        <div style={{
          width: 90,
          height: 90,
          margin: "0 auto 18px",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.03)",
          display: "grid",
          placeItems: "center",
        }}>
          <img
            src={HERO_ASSETS.empty}
            alt=""
            style={{ width: 44, height: 44, objectFit: "contain" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
        <div style={{ color: SC.text, font: '800 28px/1.05 "Manrope", sans-serif', marginBottom: 10, textShadow: `0 0 22px ${SC.gold}77, 0 0 44px ${SC.gold}2a` }}>
          El buzón quedó limpio por ahora
        </div>
        <div style={{ color: SC.muted, font: '500 14px/1.65 "Manrope", sans-serif', marginBottom: 18 }}>
          {activeFilter === "all"
            ? "Todavía no hay avisos nuevos del gremio. Cuando entre una orden, evento o ajuste, aparecerá aquí sin romper tu ritmo."
            : "No hay mensajes que coincidan con este filtro. Vuelve al buzón completo o limpia la lectura guardada para recuperar contexto."}
        </div>
        {activeFilter !== "all" && (
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: `1px solid ${SC.gold}44`,
              background: "rgba(242,198,109,.12)",
              color: SC.gold,
              font: '700 12px/1 "JetBrains Mono", monospace',
              textTransform: "uppercase",
              letterSpacing: ".08em",
              cursor: "pointer",
            }}>
            Volver al buzón completo
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} style={{
          height: 108,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,.08)",
          background: "linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.02), rgba(255,255,255,.04))",
          backgroundSize: "220% 100%",
          animation: "fvg-msg-loading 1.2s ease infinite",
        }} />
      ))}
      <style>{`@keyframes fvg-msg-loading{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>
    </div>
  );
}

function DetailPanel({ msg, isRead, isSaved, isPending, onToggleSave, onMarkRead, onClose, mobile = false }) {
  if (!msg) {
    return (
      <div style={{
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.018))",
        padding: 24,
        minHeight: 520,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{
            width: 72,
            height: 72,
            margin: "0 auto 16px",
            borderRadius: 22,
            border: `1px solid ${SC.gold}24`,
            background: "rgba(255,255,255,.03)",
            display: "grid",
            placeItems: "center",
          }}>
            <ScrollText size={30} color={SC.gold} />
          </div>
          <div style={{ color: SC.text, font: '800 24px/1.08 "Manrope", sans-serif', marginBottom: 10, textShadow: `0 0 22px ${SC.gold}88, 0 0 44px ${SC.gold}33` }}>
            Elige una nota del tablero
          </div>
          <div style={{ color: SC.muted, font: '500 14px/1.6 "Manrope", sans-serif' }}>
            Al abrir un mensaje verás objetivo, tono, fecha real y cualquier arte que el sistema haya dejado para ese aviso.
          </div>
        </div>
      </div>
    );
  }

  const meta = MESSAGE_TYPE_META[msg.type] || MESSAGE_TYPE_META.system;
  const priorityKey = getMessagePriority(msg);
  const priority = PRIORITY_META[priorityKey];
  const detailFacts = [
    { label: "Origen", value: getOriginLabel(msg), color: meta.color },
    { label: "Alcance", value: getScopeLabel(msg), color: SC.blue },
    { label: "Vigencia", value: getExpiryLabel(msg), color: msg.expiresAt ? SC.gold : SC.soft },
    { label: "Botín", value: msg.rewardLabel || "Sin botín asociado", color: msg.rewardLabel ? SC.gold : SC.soft },
    { label: "Acción", value: getActionLabel(msg), color: msg.actionRequired ? SC.red : SC.green },
  ];
  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{
        borderRadius: 24,
        border: `1px solid ${meta.color}32`,
        background: "linear-gradient(180deg, rgba(20,24,38,.96), rgba(12,15,26,.96))",
        boxShadow: `0 28px 64px ${meta.color}16`,
        overflow: "hidden",
        position: "relative",
      }}>
      <div style={{
        position: "relative",
        minHeight: 212,
        padding: 20,
        background: msg.imageUrl
          ? `linear-gradient(180deg, rgba(6,8,14,.2), rgba(6,8,14,.86)), url(${msg.imageUrl}) center/cover`
          : `linear-gradient(135deg, ${meta.soft}, rgba(12,15,26,.95))`,
        borderBottom: `1px solid ${meta.color}24`,
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,.06), transparent 34%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 15% 18%, ${meta.color}18, transparent 40%)`,
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <MessageTypeBadge type={msg.type} />
              <MessageScopeSeal msg={msg} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {mobile && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.04)",
                    color: SC.muted,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}>
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onMarkRead}
                disabled={isRead || isPending}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${isRead || isPending ? "rgba(255,255,255,.08)" : `${meta.color}42`}`,
                  background: isRead || isPending ? "rgba(255,255,255,.04)" : `${meta.color}14`,
                  color: isPending ? SC.gold : isRead ? SC.soft : meta.color,
                  cursor: isRead || isPending ? "default" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  font: '700 11px/1 "JetBrains Mono", monospace',
                  textTransform: "uppercase",
                }}>
                <CheckCheck size={14} />
                {isPending ? "Sincronizando" : isRead ? "Leído" : "Marcar leído"}
              </button>
              <button
                type="button"
                onClick={onToggleSave}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: `1px solid ${isSaved ? `${SC.gold}42` : "rgba(255,255,255,.08)"}`,
                  background: isSaved ? "rgba(242,198,109,.12)" : "rgba(255,255,255,.04)",
                  color: isSaved ? SC.gold : SC.muted,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}>
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              display: "grid",
              placeItems: "center",
              background: `${meta.color}14`,
              border: `1px solid ${meta.color}30`,
              color: meta.color,
              flexShrink: 0,
              boxShadow: `0 0 26px ${meta.color}18`,
            }}>
              <img
                src={meta.asset}
                alt=""
                style={{ width: 34, height: 34, objectFit: "contain" }}
                onError={(e) => { e.currentTarget.src = HERO_ASSETS.section; }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: meta.color, font: '700 10px/1 "JetBrains Mono", monospace', textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8, textShadow: `0 0 12px ${meta.color}cc, 0 0 24px ${meta.color}44` }}>
                Carta abierta del buzón
              </div>
              <div style={{ color: SC.text, font: '800 28px/1.06 "Manrope", sans-serif', marginBottom: 6, textShadow: `0 0 24px ${meta.color}aa, 0 0 48px ${meta.color}44, 0 0 78px ${meta.color}1a` }}>
                {msg.title || "Mensaje del sistema"}
              </div>
              <div style={{ color: SC.muted, font: '500 13px/1.45 "Manrope", sans-serif' }}>
                {meta.tone} - {fmtFull(msg.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(255,255,255,.02)",
            padding: 16,
          }}>
            <div style={{ color: SC.muted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
              Lectura del mensaje
            </div>
            <div style={{ color: SC.text, font: '500 14px/1.72 "Manrope", sans-serif', whiteSpace: "pre-wrap" }}>
              {msg.text || "No hay contenido adicional en esta nota."}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
            padding: 12,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,.07)",
            background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))",
          }}>
            {detailFacts.map((fact) => (
              <div
                key={fact.label}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${fact.color}28`,
                  background: "rgba(255,255,255,.025)",
                  padding: 13,
                  minWidth: 0,
                }}>
                <div style={{ color: fact.color, font: '700 10px/1 "JetBrains Mono", monospace', textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, textShadow: `0 0 10px ${fact.color}bb, 0 0 20px ${fact.color}44` }}>
                  {fact.label}
                </div>
                <div style={{ color: SC.text, font: '700 13px/1.4 "Manrope", sans-serif' }}>
                  {fact.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={{
                padding: "11px 12px",
                borderRadius: 14,
                border: `1px solid ${meta.color}24`,
                background: `${meta.color}10`,
                color: meta.color,
                font: '700 11px/1 "JetBrains Mono", monospace',
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}>
                {meta.label}
              </div>
              <div style={{
                padding: "11px 12px",
                borderRadius: 14,
                border: `1px solid ${priority.color}32`,
                background: priority.soft,
                color: priority.color,
                font: '700 11px/1 "JetBrains Mono", monospace',
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}>
                {priority.label}
              </div>
              <div style={{
                padding: "11px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.03)",
                color: isRead ? SC.green : SC.gold,
                font: '700 11px/1 "JetBrains Mono", monospace',
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}>
                {isRead ? "Leído en tu cuenta" : "Pendiente de lectura"}
              </div>
            </div>

            {msg.tags?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {msg.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.03)",
                    color: SC.muted,
                    font: '700 10px/1 "JetBrains Mono", monospace',
                    letterSpacing: ".05em",
                    textTransform: "uppercase",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const MSG_CLASS_COPY = {
  GUERRERO: { title: "Mantén el pulso del mapa,", span: "sin ahogarte en el ruido." },
  ARQUERO:  { title: "Filtra la señal,", span: "abre solo lo que importa." },
  MAGO:     { title: "Ordena el tablero,", span: "lee sin perder el foco." },
  DEFAULT:  { title: "Mantén el pulso del mapa,", span: "sin ahogarte en el scroll." },
};

export default function UserMensajes({ user, profile, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 980);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1180);
  const [showRail, setShowRail] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMsgId, setSelectedMsgId] = useState("");
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [pendingSavedIds, setPendingSavedIds] = useState(() => new Set());
  const [localReadIds, setLocalReadIds] = useState(() => new Set());
  const [remoteReadIds, setRemoteReadIds] = useState(() => new Set());
  const [pendingReadIds, setPendingReadIds] = useState(() => new Set());
  const [syncedAt, setSyncedAt] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const headMessagesRef  = useRef([]);
  const olderHistoryRef  = useRef([]);
  const oldestCursorRef  = useRef(null);
  const syncTimeoutRef   = useRef(null);
  const markReadQueueRef = useRef(new Set()); // accumulate unread IDs for batch flush
  const markReadTimerRef = useRef(null);       // debounce timer for the flush
  const pulsePartsRef    = useRef({ broadcast: "", targeted: "" });
  const pulseSignatureRef = useRef("");
  const pulseInitCountRef = useRef(0);
  const pulseTimerRef    = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 980);
      setIsNarrow(window.innerWidth < 1180);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile && !isNarrow) setShowMobileDetail(false);
  }, [isMobile, isNarrow]);

  useEffect(() => () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
  }, []);

  const classKey = getClassKey(
    profile?.heroClass
    || profile?.className
    || profile?.clase
    || profile?.class
    || user?.heroClass
    || user?.className
    || user?.clase
    || user?.class
  );
  const theme = CLASS_THEME[classKey] || CLASS_THEME.DEFAULT;
  const msgCopy = MSG_CLASS_COPY[classKey] || MSG_CLASS_COPY.DEFAULT;
  const userUid = user?.uid || "guest";
  const storageKeys = useMemo(() => ({
    filter: buildStorageKey(userUid, "filter"),
    search: buildStorageKey(userUid, "search"),
    selected: buildStorageKey(userUid, "selected"),
    saved: buildStorageKey(userUid, "saved"),
    readLocal: buildStorageKey(userUid, "read-local"),
  }), [userUid]);

  useEffect(() => {
    setFilter(readStoredValue(storageKeys.filter, "all"));
    setSearch(readStoredValue(storageKeys.search, ""));
    setSelectedMsgId(readStoredValue(storageKeys.selected, ""));
    setSavedIds(readStoredSet(storageKeys.saved));
    setPendingSavedIds(new Set());
    setLocalReadIds(readStoredSet(storageKeys.readLocal));
    setRemoteReadIds(new Set());
    setPendingReadIds(new Set());
  }, [storageKeys]);

  useEffect(() => {
    writeStoredValue(storageKeys.filter, filter);
  }, [filter, storageKeys]);

  useEffect(() => {
    writeStoredValue(storageKeys.search, search);
  }, [search, storageKeys]);

  useEffect(() => {
    writeStoredValue(storageKeys.selected, selectedMsgId || "");
  }, [selectedMsgId, storageKeys]);

  useEffect(() => {
    writeStoredValue(storageKeys.saved, JSON.stringify(Array.from(savedIds)));
  }, [savedIds, storageKeys]);

  useEffect(() => {
    writeStoredValue(storageKeys.readLocal, JSON.stringify(Array.from(localReadIds)));
  }, [localReadIds, storageKeys]);

  const pushSyncState = useCallback((nextState = "syncing") => {
    setSyncState(nextState);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      setSyncState("ready");
    }, nextState === "syncing" ? 850 : 550);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      if (!user?.uid) { setSyncState("idle"); return; }

      // Serve from session cache if still fresh (avoids Firestore read on every mount)
      const cached = _sessionPrefCache.get(user.uid);
      if (cached && Date.now() - cached.ts < SESSION_PREF_TTL) {
        if (!cancelled) setSavedIds(new Set(cached.savedIds));
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await getMessagePreferences(token);
        if (cancelled) return;
        const remoteSaved = new Set(Array.isArray(response?.savedIds) ? response.savedIds : []);
        setSavedIds(remoteSaved);
        _sessionPrefCache.set(user.uid, { savedIds: [...remoteSaved], ts: Date.now() });
      } catch (prefError) {
        console.warn("[UserMensajes] preferences:", prefError?.message || prefError);
      }
    }

    loadPreferences();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setRemoteReadIds(new Set());
      return undefined;
    }

    const qReadState = query(
      collection(db, "users", user.uid, "messageState"),
      where("kind", "==", "adminMessage"),
    );

    const unsubReadState = onSnapshot(
      qReadState,
      (snapshot) => {
        const next = new Set();
        snapshot.docs.forEach((docSnap) => {
          const state = docSnap.data() || {};
          if (state.read !== false) next.add(docSnap.id);
        });
        setRemoteReadIds(next);
      },
      (snapshotError) => {
        console.warn("[UserMensajes] read-state:", snapshotError?.message || snapshotError);
      },
    );

    return () => unsubReadState();
  }, [user]);

  const mergeMessages = useCallback((headMessages = headMessagesRef.current, olderMessages = olderHistoryRef.current) => {
    const now = Date.now();
    const map = new Map();
    [...headMessages, ...olderMessages].forEach((msg) => {
      if (!msg?.id) return;
      if (msg.status && msg.status !== "published") return;
      if (msg.publishAt && new Date(msg.publishAt).getTime() > now) return;
      // Hide messages that have passed their expiry date
      if (msg.expiresAt && new Date(msg.expiresAt).getTime() < now) return;
      map.set(msg.id, msg);
    });
    const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setMessages(merged);
    setLoading(false);
    setError("");
    setSyncedAt(Date.now());
  }, []);

  const refreshHeadMessages = useCallback(async ({ silent = false } = {}) => {
    if (!user?.uid) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    pushSyncState("syncing");
    try {
      const token = await user.getIdToken();
      const response = await getUserMessagesPage(token, { limit: HISTORY_PAGE_SIZE });
      headMessagesRef.current = Array.isArray(response?.messages) ? response.messages : [];
      oldestCursorRef.current = response?.nextCursor || null;
      setHasMoreHistory(Boolean(response?.hasMore));
      mergeMessages(headMessagesRef.current, olderHistoryRef.current);
    } catch (loadError) {
      console.warn("[UserMensajes] inbox:", loadError?.message || loadError);
      setError("No se pudo cargar el buzón del gremio.");
      setLoading(false);
    }
  }, [mergeMessages, pushSyncState, user]);

  useEffect(() => {
    if (!user?.uid) {
      setMessages([]);
      headMessagesRef.current = [];
      olderHistoryRef.current = [];
      oldestCursorRef.current = null;
      pulsePartsRef.current = { broadcast: "", targeted: "" };
      pulseSignatureRef.current = "";
      pulseInitCountRef.current = 0;
      setHasMoreHistory(true);
      setLoading(false);
      setSyncState("idle");
      return undefined;
    }

    headMessagesRef.current = [];
    olderHistoryRef.current = [];
    oldestCursorRef.current = null;
    pulsePartsRef.current = { broadcast: "", targeted: "" };
    pulseSignatureRef.current = "";
    pulseInitCountRef.current = 0;
    setHasMoreHistory(true);
    refreshHeadMessages();

    const scheduleHeadRefresh = () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        refreshHeadMessages({ silent: true });
      }, 650);
    };

    const handlePulse = (kind, snapshot) => {
      const signature = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() || {};
          return `${docSnap.id}:${data.updatedAt?.seconds || data.createdAt?.seconds || 0}`;
        })
        .join("|");

      pulsePartsRef.current = { ...pulsePartsRef.current, [kind]: signature };
      const combined = `${pulsePartsRef.current.broadcast}::${pulsePartsRef.current.targeted}`;

      if (pulseInitCountRef.current < 2) {
        pulseInitCountRef.current += 1;
        pulseSignatureRef.current = combined;
        return;
      }

      if (combined !== pulseSignatureRef.current) {
        pulseSignatureRef.current = combined;
        scheduleHeadRefresh();
      }
    };

    const qBroadcast = query(collection(db, "adminMessages"), where("targetAll", "==", true), orderBy("createdAt", "desc"), limit(8));
    const qTargeted = query(collection(db, "adminMessages"), where("targetUid", "==", user.uid), orderBy("createdAt", "desc"), limit(6));

    const unsubBroadcast = onSnapshot(
      qBroadcast,
      (snapshot) => {
        handlePulse("broadcast", snapshot);
      },
      (snapshotError) => {
        console.warn("[UserMensajes] broadcast:", snapshotError?.message || snapshotError);
        setError("No se pudo sincronizar el tablón general.");
      },
    );

    const unsubTargeted = onSnapshot(
      qTargeted,
      (snapshot) => {
        handlePulse("targeted", snapshot);
      },
      (snapshotError) => {
        console.warn("[UserMensajes] targeted:", snapshotError?.message || snapshotError);
        setError("No se pudo abrir tu buzón personal.");
      },
    );

    return () => {
      unsubBroadcast();
      unsubTargeted();
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [refreshHeadMessages, user]);

  const isRead = useCallback((msg) => {
    return localReadIds.has(msg.id) || remoteReadIds.has(msg.id) || Boolean(msg?.isRead);
  }, [localReadIds, remoteReadIds]);

  useEffect(() => {
    if (!user?.uid) return;
    const unread = messages.filter((msg) => !isRead(msg)).length;
    onUnreadChange?.(unread);
  }, [messages, isRead, onUnreadChange, user]);

  const counts = useMemo(() => {
    const next = {
      all: messages.length,
      unread: 0,
      important: 0,
      saved: 0,
      announcement: 0,
      warning: 0,
      system: 0,
      achievement: 0,
      event: 0,
    };
    messages.forEach((msg) => {
      if (!isRead(msg)) next.unread += 1;
      if (msg.tags?.includes("important")) next.important += 1;
      if (savedIds.has(msg.id)) next.saved += 1;
      if (next[msg.type] !== undefined) next[msg.type] += 1;
    });
    return next;
  }, [isRead, messages, savedIds]);

  const filteredMessages = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    return messages.filter((msg) => {
      const matchesSearch = !queryText || [msg.title, msg.text, ...(msg.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(queryText);

      if (!matchesSearch) return false;
      if (filter === "all") return true;
      if (filter === "unread") return !isRead(msg);
      if (filter === "saved") return savedIds.has(msg.id);
      if (filter === "important") return msg.tags?.includes("important");
      return msg.type === filter;
    });
  }, [filter, isRead, messages, savedIds, search]);

  const sortedMessages = useMemo(() => {
    const now = Date.now();

    function score(msg) {
      let total = 0;
      if (!isRead(msg)) total += 120;
      if (msg.tags?.includes("important")) total += 80;
      if (savedIds.has(msg.id)) total += 44;
      if (msg.type === "event") {
        const publishAt = msg.publishAt ? new Date(msg.publishAt).getTime() : null;
        if (!publishAt || publishAt <= now) total += 36;
      }
      return total;
    }

    return [...filteredMessages].sort((a, b) => {
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filteredMessages, isRead, savedIds]);

  const groupedMessages = useMemo(() => {
    const grouped = {
      today: [],
      week: [],
      archive: [],
    };

    sortedMessages.forEach((msg) => {
      grouped[getTemporalBucket(msg.createdAt)].push(msg);
    });

    return Object.entries(grouped)
      .map(([id, items]) => ({ id, items, ...TEMPORAL_BUCKET_META[id] }))
      .filter((group) => group.items.length > 0);
  }, [sortedMessages]);

  useEffect(() => {
    if (!sortedMessages.length) {
      setSelectedMsgId("");
      return;
    }
    const stillExists = sortedMessages.some((msg) => msg.id === selectedMsgId);
    if (!stillExists) setSelectedMsgId(sortedMessages[0].id);
  }, [selectedMsgId, sortedMessages]);

  const selectedMessage = useMemo(
    () => sortedMessages.find((msg) => msg.id === selectedMsgId) || sortedMessages[0] || null,
    [selectedMsgId, sortedMessages],
  );

  const handleRead = useCallback((msg) => {
    if (!msg || !user?.uid || isRead(msg)) return;

    // Optimistic update — UI reflects read state immediately
    setLocalReadIds((prev) => new Set(prev).add(msg.id));
    setPendingReadIds((prev) => new Set(prev).add(msg.id));

    // Accumulate in a queue and flush as a single batch after 1.2 s of inactivity.
    // Turns rapid multi-select into 1 API call instead of N.
    markReadQueueRef.current.add(msg.id);
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(async () => {
      const ids = [...markReadQueueRef.current];
      if (!ids.length) return;
      markReadQueueRef.current = new Set();
      try {
        const token = await user.getIdToken();
        await markAllMessagesRead(token, ids);
        pushSyncState("syncing");
        setPendingReadIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      } catch (batchErr) {
        console.warn("[UserMensajes] batch mark-read:", batchErr?.message || batchErr);
        // Rollback optimistic updates
        setLocalReadIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => {
            if (!remoteReadIds.has(id)) next.delete(id);
          });
          return next;
        });
        setPendingReadIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }
    }, 1200);
  }, [isRead, pushSyncState, remoteReadIds, user]);

  const handleSelect = useCallback((msg) => {
    setSelectedMsgId(msg.id);
    handleRead(msg);
    if (isMobile || isNarrow) {
      setShowRail(false);
      setShowMobileDetail(true);
    }
  }, [handleRead, isMobile, isNarrow]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadMessages = messages.filter((msg) => !isRead(msg));
    if (!unreadMessages.length || !user?.uid) return;
    setLocalReadIds((prev) => {
      const next = new Set(prev);
      unreadMessages.forEach((msg) => next.add(msg.id));
      return next;
    });
    setPendingReadIds((prev) => {
      const next = new Set(prev);
      unreadMessages.forEach((msg) => next.add(msg.id));
      return next;
    });
    try {
      const token = await user.getIdToken();
      await markAllMessagesRead(token, unreadMessages.map((msg) => msg.id));
      pushSyncState("syncing");
      setPendingReadIds((prev) => {
        const next = new Set(prev);
        unreadMessages.forEach((msg) => next.delete(msg.id));
        return next;
      });
    } catch (markAllError) {
      console.warn("[UserMensajes] mark all:", markAllError?.message || markAllError);
      setPendingReadIds((prev) => {
        const next = new Set(prev);
        unreadMessages.forEach((msg) => next.delete(msg.id));
        return next;
      });
      setLocalReadIds((prev) => {
        const next = new Set(prev);
        unreadMessages.forEach((msg) => {
          if (!remoteReadIds.has(msg.id)) next.delete(msg.id);
        });
        return next;
      });
    }
  }, [isRead, messages, pushSyncState, remoteReadIds, user]);

  const handleLoadOlder = useCallback(async () => {
    if (!user?.uid || loadingMore || !hasMoreHistory || !oldestCursorRef.current) return;
    setLoadingMore(true);
    setSyncState("syncing");
    try {
      const token = await user.getIdToken();
      const response = await getUserMessagesPage(token, {
        cursor: oldestCursorRef.current,
        limit: HISTORY_PAGE_SIZE,
      });
      const loaded = Array.isArray(response?.messages) ? response.messages : [];
      if (loaded.length) {
        olderHistoryRef.current = [...olderHistoryRef.current, ...loaded];
        mergeMessages(headMessagesRef.current, olderHistoryRef.current);
        pushSyncState("syncing");
      }
      oldestCursorRef.current = response?.nextCursor || null;
      setHasMoreHistory(Boolean(response?.hasMore));
    } catch (olderError) {
      console.warn("[UserMensajes] older:", olderError?.message || olderError);
      setError("No se pudieron cargar mensajes anteriores.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreHistory, loadingMore, mergeMessages, pushSyncState, user]);

  const toggleSave = useCallback(async (msgId) => {
    if (!user?.uid || pendingSavedIds.has(msgId)) return;

    const wasSaved = savedIds.has(msgId);

    // Bust session preferences cache so next mount re-fetches updated saved list
    _sessionPrefCache.delete(user.uid);

    setPendingSavedIds((prev) => new Set(prev).add(msgId));
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(msgId);
      else next.add(msgId);
      return next;
    });

    try {
      const token = await user.getIdToken();
      if (wasSaved) await unsaveMessageForUser(token, msgId);
      else await saveMessageForUser(token, msgId);
    } catch (saveError) {
      console.warn("[UserMensajes] save:", saveError?.message || saveError);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(msgId);
        else next.delete(msgId);
        return next;
      });
    } finally {
      setPendingSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
    }
  }, [pendingSavedIds, savedIds, user]);

  const totalAnnouncements = counts.announcement + counts.system + counts.warning;
  const newestMessage = messages[0] || null;
  const heroSignals = useMemo(() => {
    const unreadSystem = messages.filter((msg) => msg.type === "system" && !isRead(msg)).length;
    const unseenAchievements = messages.filter((msg) => msg.type === "achievement" && !isRead(msg)).length;
    const dueTodayEvents = messages.filter((msg) => {
      if (msg.type !== "event" || !msg.expiresAt) return false;
      const expires = new Date(msg.expiresAt);
      if (Number.isNaN(expires.getTime())) return false;
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return expires <= todayEnd && expires > new Date();
    }).length;

    return [
      { id: "sys", label: `${unreadSystem} aviso nuevo del sistema`, active: unreadSystem > 0, icon: Bell, color: theme.color },
      { id: "ach", label: `${unseenAchievements} reconocimientos listos`, active: unseenAchievements > 0, icon: Trophy, color: SC.gold },
      { id: "evt", label: `${dueTodayEvents} evento vence hoy`, active: dueTodayEvents > 0, icon: CalendarDays, color: MESSAGE_TYPE_META.event.color },
    ];
  }, [isRead, messages, theme.color]);

  const reviewSignals = useMemo(() => {
    const items = [];
    const importantUnread = sortedMessages.find((msg) => !isRead(msg) && getMessagePriority(msg) === "urgent");
    const eventSoon = sortedMessages.find((msg) => {
      if (msg.type !== "event" || !msg.expiresAt) return false;
      const expires = new Date(msg.expiresAt);
      if (Number.isNaN(expires.getTime())) return false;
      const diff = expires.getTime() - Date.now();
      return diff > 0 && diff <= 86_400_000 * 2;
    });
    const unseenAchievement = sortedMessages.find((msg) => msg.type === "achievement" && !isRead(msg));

    if (importantUnread) items.push(`Urgente sin abrir: ${importantUnread.title || "aviso prioritario"}.`);
    if (eventSoon) items.push(`Evento cercano: ${eventSoon.title || "ventana especial"} cierra pronto.`);
    if (unseenAchievement) items.push(`Reconocimiento nuevo: ${unseenAchievement.title || "logro del mapa"}.`);

    if (!items.length) {
      items.push(`${counts.unread} avisos todavia pendientes.`);
      items.push(newestMessage ? `Abre primero: ${newestMessage.title || "ultimo mensaje"}.` : "Todavia no entran nuevas ordenes.");
      items.push(counts.saved > 0 ? `${counts.saved} notas guardadas siguen esperando lectura.` : "No tienes guardados acumulados.");
    }

    return items.slice(0, 3);
  }, [counts.saved, counts.unread, isRead, newestMessage, sortedMessages]);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="fvg-msg-root" style={{
        "--msg-accent": theme.color,
        minHeight: "calc(100vh - 88px)",
        color: SC.text,
        position: "relative",
        paddingBottom: 18,
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 12% 12%, ${theme.glow}, transparent 26%),
            radial-gradient(circle at 88% 18%, rgba(242,198,109,.08), transparent 24%),
            linear-gradient(180deg, rgba(10,12,20,.96), rgba(7,9,16,.98))
          `,
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 18 }}>
          <section style={{
            position: "relative",
            borderRadius: 28,
            overflow: "hidden",
            border: `1px solid ${theme.color}30`,
            background: `
              linear-gradient(115deg, rgba(7,8,14,.95) 0%, rgba(11,13,22,.92) 44%, rgba(13,16,28,.9) 100%),
              url(${HERO_ASSETS.section}) right center / 480px no-repeat
            `,
            boxShadow: `0 30px 80px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05)`,
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(90deg, rgba(8,9,16,.96) 0%, rgba(8,9,16,.88) 42%, rgba(8,9,16,.46) 100%),
                url(${HERO_ASSETS.overlay}) center/cover
              `,
              opacity: 0.95,
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 14% 20%, ${theme.glow}, transparent 30%)`,
              pointerEvents: "none",
            }} />

            <div style={{
              position: "relative",
              zIndex: 1,
              padding: isMobile ? "22px 18px 20px" : isNarrow ? "24px 24px 20px" : "28px 28px 24px",
              display: "grid",
              gridTemplateColumns: (isMobile || isNarrow) ? "1fr" : "minmax(0, 1.1fr) 360px",
              gap: 18,
              alignItems: "end",
            }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid ${theme.color}34`,
                  background: `${theme.soft}`,
                  width: "fit-content",
                  color: theme.color,
                  font: '800 11px/1 "JetBrains Mono", monospace',
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  textShadow: `0 0 12px ${theme.color}99`,
                }}>
                  <img
                    src={HERO_ASSETS.section}
                    alt=""
                    style={{ width: 16, height: 16, objectFit: "contain" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  Buzón del gremio
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div className="fvg-msg-hero-title">
                    {msgCopy.title} <span style={{ color: theme.color, textShadow: `0 0 34px ${theme.color}77` }}>{msgCopy.span}</span>
                  </div>
                  <div className="fvg-msg-hero-lead">
                    Esta sala reúne avisos, eventos, actualizaciones y reconocimientos en una lectura más clara. Filtra rápido, abre el mensaje clave y deja el resto guardado para después.
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {heroSignals.map((signal) => {
                    const SignalIcon = signal.icon;
                    return (
                      <span
                        key={signal.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 12px",
                          borderRadius: 999,
                          border: `1px solid ${signal.active ? `${signal.color}40` : "rgba(255,255,255,.08)"}`,
                          background: signal.active ? `${signal.color}10` : "rgba(255,255,255,.03)",
                          color: SC.text,
                          font: '700 12px/1 "Manrope", sans-serif',
                        }}>
                        <SignalIcon size={14} color={signal.color} />
                        {signal.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{
                borderRadius: 24,
                border: `1px solid ${theme.color}26`,
                background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.025))",
                backdropFilter: "blur(10px)",
                boxShadow: `0 16px 40px ${theme.glow}`,
                padding: 18,
                display: "grid",
                gap: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 62,
                    height: 62,
                    borderRadius: 18,
                    border: `1px solid ${theme.color}34`,
                    background: `${theme.soft}`,
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}>
                    <img
                      src={theme.crest || HERO_ASSETS.crestFallback}
                      alt=""
                      style={{ width: 42, height: 42, objectFit: "contain" }}
                      onError={(e) => { e.currentTarget.src = HERO_ASSETS.crestFallback; }}
                    />
                  </div>
                  <div>
                    <div style={{ color: theme.color, font: '700 11px/1 "JetBrains Mono", monospace', textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 6, textShadow: `0 0 12px ${theme.color}cc, 0 0 24px ${theme.color}44` }}>
                      Perfil actual
                    </div>
                    <div style={{ color: SC.text, font: '800 24px/1.06 "Manrope", sans-serif', textShadow: `0 0 22px ${theme.color}99, 0 0 44px ${theme.color}33` }}>
                      {user?.displayName || "Héroe del mapa"}
                    </div>
                    <div style={{ color: SC.muted, font: '500 13px/1.4 "Manrope", sans-serif', marginTop: 6 }}>
                      {theme.label} - {syncState === "syncing" ? "tablón en movimiento" : "lectura rápida del buzón"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <MetricCard label="No leídos" value={counts.unread} hint="Lo que conviene abrir primero." color={theme.color} icon={Bell} />
                  <MetricCard label="Avisos vivos" value={totalAnnouncements} hint="Anuncios, sistema y alertas." color={SC.gold} icon={ScrollText} />
                </div>

                <div style={{
                  padding: "13px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(255,255,255,.03)",
                  color: SC.muted,
                  font: '500 13px/1.55 "Manrope", sans-serif',
                }}>
                  {newestMessage
                    ? `Último pulso: ${newestMessage.title || "Mensaje del sistema"} · ${fmtRelative(newestMessage.createdAt)}.`
                    : "En cuanto llegue un aviso nuevo, aparecerá aquí con contexto claro."}
                </div>
              </div>
            </div>
          </section>

          <section style={{
            display: "grid",
            gridTemplateColumns: (isMobile || isNarrow) ? "1fr" : "minmax(0, 1fr) auto",
            gap: 14,
            alignItems: "center",
            padding: isMobile ? "14px" : "14px 16px",
            borderRadius: 22,
            border: `1px solid ${theme.color}20`,
            background: "linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.02))",
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {FILTER_ORDER.map((id) => (
                <FilterChip
                  key={id}
                  id={id}
                  active={filter === id}
                  count={counts[id] || 0}
                  onClick={() => setFilter(id)}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: (isMobile || isNarrow) ? "stretch" : "flex-end" }}>
              <div style={{
                minWidth: (isMobile || isNarrow) ? "100%" : 280,
                flex: (isMobile || isNarrow) ? "1 1 100%" : "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.03)",
              }}>
                <Search size={16} color={SC.muted} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar aviso, tag o título..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: SC.text,
                    font: '500 14px/1 "Manrope", sans-serif',
                    minWidth: 0,
                  }}
                />
              </div>

              {(isMobile || isNarrow) && (
                <button
                  type="button"
                  onClick={() => setShowRail(true)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: `1px solid ${theme.color}42`,
                    background: `${theme.soft}`,
                    color: theme.color,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    font: '700 11px/1 "JetBrains Mono", monospace',
                    textTransform: "uppercase",
                  }}>
                  <PanelLeft size={14} />
                  Resumen
                </button>
              )}

              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: `1px solid ${SC.gold}42`,
                  background: "rgba(242,198,109,.12)",
                  color: SC.gold,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  font: '700 11px/1 "JetBrains Mono", monospace',
                  textTransform: "uppercase",
                }}>
                <CheckCheck size={14} />
                Marcar todo leído
              </button>
            </div>
          </section>

          <section className="fvg-msg-3col">
            <AnimatePresence>
              {(!isMobile || showRail) && (
                <>
                  {isMobile && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowRail(false)}
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(4,6,12,.72)",
                        backdropFilter: "blur(10px)",
                        zIndex: 90,
                      }}
                    />
                  )}

                  <motion.aside
                    initial={isMobile ? { x: -24, opacity: 0 } : false}
                    animate={{ x: 0, opacity: 1 }}
                    exit={isMobile ? { x: -24, opacity: 0 } : undefined}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: isMobile ? "fixed" : "relative",
                      top: isMobile ? 88 : "auto",
                      left: isMobile ? 14 : "auto",
                      bottom: isMobile ? 14 : "auto",
                      width: isMobile ? "min(84vw, 340px)" : "auto",
                      zIndex: isMobile ? 91 : "auto",
                      padding: 16,
                      borderRadius: 24,
                      border: `1px solid ${theme.color}22`,
                      background: "linear-gradient(180deg, rgba(16,19,31,.98), rgba(10,13,24,.96))",
                      boxShadow: isMobile ? "0 24px 60px rgba(0,0,0,.42)" : SC.shadow,
                      display: "grid",
                      gap: 14,
                    }}>
                    {isMobile && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <div style={{ color: SC.text, font: '800 18px/1 "Manrope", sans-serif', textShadow: `0 0 16px ${theme.color}77, 0 0 32px ${theme.color}2a` }}>Resumen</div>
                        <button
                          type="button"
                          onClick={() => setShowRail(false)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,.08)",
                            background: "rgba(255,255,255,.03)",
                            display: "grid",
                            placeItems: "center",
                            color: SC.muted,
                            cursor: "pointer",
                          }}>
                          <X size={15} />
                        </button>
                      </div>
                    )}

                    <div style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.03)",
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}>
                      <div style={{
                        color: theme.color,
                        font: '700 10px/1 "JetBrains Mono", monospace',
                        textTransform: "uppercase",
                        letterSpacing: ".12em",
                        textShadow: `0 0 12px ${theme.color}cc, 0 0 24px ${theme.color}44`,
                      }}>
                        Estado del correo
                      </div>
                      <div style={{ color: SC.text, font: '800 19px/1.04 "Manrope", sans-serif', textShadow: `0 0 18px ${theme.color}77, 0 0 36px ${theme.color}2a` }}>
                        {syncState === "syncing" ? "Actualizando tablón" : "Buzón sincronizado"}
                      </div>
                      <div style={{ color: SC.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
                        {syncState === "syncing"
                          ? "Entrando una nueva lectura del tablero..."
                          : syncedAt
                            ? `Última revisión ${new Date(syncedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.`
                            : "Esperando el primer pulso del tablero."}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <MetricCard label="Buzón total" value={counts.all} hint="Todas las notas recibidas." color={SC.gold} icon={Inbox} />
                      <MetricCard label="Guardados" value={counts.saved} hint="Mensajes para volver luego." color={SC.green} icon={BookmarkCheck} />
                      <MetricCard label="Alta prioridad" value={counts.important} hint="Avisos con marca importante." color={SC.red} icon={ShieldAlert} />
                    </div>

                    <div style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "rgba(255,255,255,.03)",
                      padding: 12,
                    }}>
                      <div style={{ color: SC.text, font: '800 16px/1.06 "Manrope", sans-serif', marginBottom: 10, textShadow: `0 0 14px ${theme.color}66, 0 0 28px ${theme.color}28` }}>
                        Qué revisar hoy
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        {reviewSignals.map((line) => (
                          <div key={line} style={{ display: "flex", gap: 10, color: SC.muted, font: '500 13px/1.5 "Manrope", sans-serif' }}>
                            <ChevronRight size={14} color={theme.color} style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            <main style={{ display: "grid", gap: 14, minWidth: 0 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "0 2px",
                flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ color: theme.color, font: '700 10px/1 "JetBrains Mono", monospace', textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 8, textShadow: `0 0 12px ${theme.color}cc, 0 0 24px ${theme.color}44` }}>
                    Lectura principal
                  </div>
                  <div style={{ color: SC.text, font: '800 28px/1.04 "Manrope", sans-serif', textShadow: `0 0 24px ${theme.color}99, 0 0 48px ${theme.color}33` }}>
                    {FILTER_META[filter]?.label || "Buzón"}
                  </div>
                </div>
                <div style={{ color: SC.muted, font: '500 13px/1.55 "Manrope", sans-serif', maxWidth: 420 }}>
                  {sortedMessages.length} resultados listos. El orden empuja primero lo no leído, lo importante y lo más útil para retomar rápido.
                </div>
              </div>

              {error ? (
                <div style={{
                  padding: "14px 16px",
                  borderRadius: 18,
                  border: `1px solid ${SC.red}2f`,
                  background: "rgba(239,107,107,.12)",
                  color: "#ffd6d6",
                  font: '600 13px/1.55 "Manrope", sans-serif',
                }}>
                  {error}
                </div>
              ) : null}

              <div className="fvg-msg-scroll" style={{
                display: "grid",
                gap: 12,
                minHeight: 520,
                maxHeight: isMobile ? "none" : "calc(100vh - 360px)",
                overflowY: isMobile ? "visible" : "auto",
                paddingRight: isMobile ? 0 : 4,
              }}>
                {loading ? (
                  <LoadingRows />
                ) : sortedMessages.length === 0 ? (
                  <EmptyState activeFilter={filter} onReset={() => setFilter("all")} />
                ) : (
                  <>
                    {filter === "all" && !search.trim() && oldestCursorRef.current && (
                      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 2 }}>
                        <button
                          type="button"
                          onClick={handleLoadOlder}
                          disabled={loadingMore || !hasMoreHistory}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 16,
                            border: `1px solid ${theme.color}36`,
                            background: `${theme.soft}`,
                            color: theme.color,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            cursor: loadingMore || !hasMoreHistory ? "default" : "pointer",
                            opacity: loadingMore || !hasMoreHistory ? 0.72 : 1,
                            font: '700 11px/1 "JetBrains Mono", monospace',
                            textTransform: "uppercase",
                            letterSpacing: ".08em",
                          }}>
                          <CalendarDays size={14} />
                          {loadingMore ? "Cargando archivo..." : hasMoreHistory ? "Cargar anteriores" : "Archivo completo"}
                        </button>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {groupedMessages.map((group) => (
                        <motion.div
                          key={group.id}
                          layout
                          style={{
                            display: "grid",
                            gap: 10,
                            paddingTop: 4,
                          }}>
                          <div style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: "0 4px",
                          }}>
                            <div>
                              <div style={{ color: SC.text, font: '800 18px/1.05 "Manrope", sans-serif', textShadow: `0 0 18px ${theme.color}66, 0 0 36px ${theme.color}28` }}>{group.label}</div>
                              <div style={{ color: SC.muted, font: '600 11px/1.3 "JetBrains Mono", monospace', textTransform: "uppercase", letterSpacing: ".08em", marginTop: 5 }}>
                                {group.hint}
                              </div>
                            </div>
                            <div style={{ color: theme.color, font: '700 11px/1 "JetBrains Mono", monospace', textTransform: "uppercase", letterSpacing: ".08em", textShadow: `0 0 10px ${theme.color}cc, 0 0 20px ${theme.color}44` }}>
                              {group.items.length}
                            </div>
                          </div>

                          {group.items.map((msg) => (
                            <MessageRow
                              key={msg.id}
                              msg={msg}
                              selected={selectedMessage?.id === msg.id}
                              isRead={isRead(msg)}
                              isSaved={savedIds.has(msg.id)}
                              isPending={pendingReadIds.has(msg.id)}
                              onSelect={() => handleSelect(msg)}
                              onSave={(e) => {
                                e.stopPropagation();
                                toggleSave(msg.id);
                              }}
                            />
                          ))}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </main>

            <aside style={{ display: (isMobile || isNarrow) ? "none" : "grid", gap: 14 }}>
              <DetailPanel
                msg={selectedMessage}
                isRead={selectedMessage ? isRead(selectedMessage) : false}
                isSaved={selectedMessage ? savedIds.has(selectedMessage.id) : false}
                isPending={selectedMessage ? pendingReadIds.has(selectedMessage.id) : false}
                onToggleSave={() => selectedMessage && toggleSave(selectedMessage.id)}
                onMarkRead={() => selectedMessage && handleRead(selectedMessage)}
              />

              <div style={{
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,.08)",
                background: "linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.018))",
                padding: 16,
                display: "grid",
                gap: 12,
              }}>
                <div style={{ color: SC.text, font: '800 18px/1.06 "Manrope", sans-serif', textShadow: `0 0 16px ${theme.color}66, 0 0 32px ${theme.color}28` }}>
                  Pulso del tablero
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: SC.muted, font: '600 13px/1.4 "Manrope", sans-serif' }}>
                    <span>Eventos activos</span>
                    <span style={{ color: SC.gold, textShadow: `0 0 10px ${SC.gold}cc, 0 0 20px ${SC.gold}44` }}>{counts.event}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: SC.muted, font: '600 13px/1.4 "Manrope", sans-serif' }}>
                    <span>Reconocimientos</span>
                    <span style={{ color: MESSAGE_TYPE_META.achievement.color, textShadow: `0 0 10px ${MESSAGE_TYPE_META.achievement.color}cc, 0 0 20px ${MESSAGE_TYPE_META.achievement.color}44` }}>{counts.achievement}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: SC.muted, font: '600 13px/1.4 "Manrope", sans-serif' }}>
                    <span>Notas de sistema</span>
                    <span style={{ color: MESSAGE_TYPE_META.system.color, textShadow: `0 0 10px ${MESSAGE_TYPE_META.system.color}cc, 0 0 20px ${MESSAGE_TYPE_META.system.color}44` }}>{counts.system}</span>
                  </div>
                </div>
                <div style={{
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${theme.color}44, transparent)`,
                }} />
                <div style={{ color: SC.muted, font: '500 13px/1.6 "Manrope", sans-serif' }}>
                  Mantén esta sala ligera: abre lo urgente, guarda lo útil y deja que el resto del tablero se ordene por tipo y tiempo.
                </div>
              </div>
            </aside>
          </section>

          <AnimatePresence>
            {(isMobile || isNarrow) && showMobileDetail && selectedMessage && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileDetail(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(4,6,12,.76)",
                    backdropFilter: "blur(12px)",
                    zIndex: 94,
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    position: "fixed",
                    left: 12,
                    right: 12,
                    top: 96,
                    bottom: 14,
                    zIndex: 95,
                    overflow: "auto",
                  }}
                >
                  <DetailPanel
                    msg={selectedMessage}
                    isRead={selectedMessage ? isRead(selectedMessage) : false}
                    isSaved={selectedMessage ? savedIds.has(selectedMessage.id) : false}
                    isPending={selectedMessage ? pendingReadIds.has(selectedMessage.id) : false}
                    onToggleSave={() => selectedMessage && toggleSave(selectedMessage.id)}
                    onMarkRead={() => selectedMessage && handleRead(selectedMessage)}
                    onClose={() => setShowMobileDetail(false)}
                    mobile
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
