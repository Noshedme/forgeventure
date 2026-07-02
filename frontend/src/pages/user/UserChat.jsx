// src/pages/user/UserChat.jsx â€” v6 Â· SC Premium Â· Visual redesign
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// VISUAL: SC admin-config palette Â· Orbitron + Rajdhani Â· Glassmorphism
//         AmbientBg animated blobs Â· Premium dashboard aesthetic
// LOGIC:  100 % preservado del v5
//         (activeConvId, smart-scroll, load-more, real-time requests,
//          read-receipts, presence cleanup, periodic refresh)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc, onSnapshot, setDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  MessageSquare, UserPlus, Users, Search, Send, Trash2,
  ChevronLeft, CheckCheck, Check, Clock, UserCheck, UserX,
  X, Inbox, Bell, Shield, Zap, Star, Swords, ChevronDown,
  Wifi,
} from "lucide-react";
import {
  getConversations,
  getFriends, getSentFriendRequests, getFriendRequests,
  searchChatUsers, getSuggestedUsers,
  sendFriendRequest, respondFriendRequest,
  removeFriend, openConversation, sendMessage, deleteMessage,
  markConversationRead, getMessages,
} from "../../services/api.js";
import { validateClean } from "../../utils/profanityFilter.js";
import { useToast } from "../../components/shared/ui.jsx";
import { useLang } from "../../hooks/useLang.js";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { USER_CLASS_THEME } from "./userClassTheme.js";

// â”€â”€ SC admin-config palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SC = {
  bg: P.bg0,    bg1: P.bg1,   bg2: P.bg2,
  border: P.line, borderL: P.line,
  accent: P.accent, accentL: P.accent2,
  gold: P.gold, text: P.text, muted: P.muted,
  blue: "#4CC9F0", green: "#6BC87A", red: "#E05C8A",
  navy: P.navy, navyL: P.line,
  white: P.text, mutedL: P.mutedL, orange: P.accent,
  panel: P.bg2, card: P.bg1, teal: "#4A9D8F", purple: P.accent,
};

const CLASS_COLOR = { GUERRERO: SC.red, ARQUERO: SC.green, MAGO: SC.blue };
const CLASS_LABEL = { GUERRERO: "Guerrero", ARQUERO: "Arquero", MAGO: "Mago" };
const CLASS_CREST = {
  GUERRERO: "/ui/crest-warrior.png",
  ARQUERO: "/ui/crest-archer.png",
  MAGO: "/ui/crest-mage.png",
  DEFAULT: "/ui/crest-default.png",
};
const CHAT_SCENE = {
  GUERRERO: "/exercises/hero/training-scene-warrior.png",
  ARQUERO: "/exercises/hero/training-scene-archer.png",
  MAGO: "/exercises/hero/training-scene-mage.png",
  DEFAULT: "/exercises/hero/training-scene-default.png",
};
const CHAT_ASSETS = {
  emptyPanel: "/ui/chat/chat-empty-panel.png",
  heroOverlay: "/ui/chat/chat-hero-overlay.png",
  requestSeal: "/ui/chat/chat-request-seal.png",
  onlineBadge: "/ui/chat/chat-online-badge.png",
  socialRanks: {
    1: "/ui/chat/chat-social-rank-1.png",
    2: "/ui/chat/chat-social-rank-2.png",
    3: "/ui/chat/chat-social-rank-3.png",
    4: "/ui/chat/chat-social-rank-4.png",
  },
  tabs: {
    chats: "/ui/chat/chat-tab-chats.png",
    amigos: "/ui/chat/chat-tab-allies.png",
    solicitudes: "/ui/chat/chat-tab-requests.png",
    buscar: "/ui/chat/chat-tab-search.png",
  },
};

const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);
const rpx = (s) => mono(s, 700);

// glass imported from design/system.jsx

const ease = [0.22, 1, 0.36, 1];
const FV = {
  up:     { hidden:{ opacity:0, y:16    }, show:{ opacity:1, y:0,    transition:{ duration:0.42, ease } } },
  left:   { hidden:{ opacity:0, x:-16  }, show:{ opacity:1, x:0,    transition:{ duration:0.38, ease } } },
  msgIn:  { hidden:{ opacity:0, y:6, scale:0.97 }, show:{ opacity:1, y:0, scale:1, transition:{ duration:0.2, ease } } },
  stagger:{ hidden:{}, show:{ transition:{ staggerChildren:0.055, delayChildren:0.02 } } },
};

const IDLE_FRAMES = Array.from({ length: 8 }, (_, i) => `/avatar/idle/idle_0${i + 1}.png`);
const CHAT_UI_STORAGE_KEY = "fv-chat-ui-v1";
const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";
const TYPING_WRITE_THROTTLE_MS = 7000;
const TYPING_IDLE_TIMEOUT_MS = 2500;
const TYPING_VISIBLE_WINDOW_MS = 5000;
const PRESENCE_HEARTBEAT_MS = 240000;
const CONVERSATION_REFRESH_MS = 30000;
const REQUESTS_REFRESH_MS = 45000;
const MAX_PRESENCE_WATCH = 8;
const CHAT_CTA_SECTION_BY_TYPE = {
  mission: "misiones",
  routine: "rutinas",
  achievement: "logros",
  item: "tienda",
  exercise: "ejercicios",
  profile: "perfil",
  character: "personaje",
  section: null,
};
const CHAT_CTA_LABEL_BY_TYPE = {
  mission: "Abrir misión",
  routine: "Abrir rutina",
  achievement: "Ver logro",
  item: "Ver objeto",
  exercise: "Ver ejercicio",
  profile: "Abrir ficha",
  character: "Ver personaje",
  section: "Abrir sección",
};

const getChatUiStorageKey = (uid) => (uid ? `${CHAT_UI_STORAGE_KEY}:${uid}` : CHAT_UI_STORAGE_KEY);

function readStoredChatUi(uid) {
  if (typeof window === "undefined") return {};
  const scopedKey = getChatUiStorageKey(uid);
  try {
    const scopedRaw = window.localStorage.getItem(scopedKey);
    if (scopedRaw) return JSON.parse(scopedRaw);
    if (uid) {
      const legacyRaw = window.localStorage.getItem(CHAT_UI_STORAGE_KEY);
      if (legacyRaw) return JSON.parse(legacyRaw);
    }
  } catch {}
  return {};
}

function writeStoredChatUi(uid, payload) {
  if (typeof window === "undefined" || !uid) return;
  try {
    window.localStorage.setItem(getChatUiStorageKey(uid), JSON.stringify(payload));
  } catch {}
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CSS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHAT_CSS = `
/* === fvch: ForgeVenture Chat v2 — Manrope === */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --fvch-bg:    #07060c; --fvch-bg1:  #161122; --fvch-bg2:  #0b0814;
  --fvch-inner: #0a0712; --fvch-slot: #14101e;
  --fvch-border:#2a1f3d; --fvch-border2:#4a3a18;
  --fvch-gold:  #c89b3c; --fvch-gold-b:#f4cc78; --fvch-gold-s:#d4a44a;
  --fvch-text:  #e8dcc4; --fvch-dim:  #9d8fa8; --fvch-muted: #5e5269;
  --fvch-parch: #ead7ad; --fvch-fire: #ff7a1f;
  --fvch-purple:#c08aff; --fvch-crim: #d33b4d;
  --fvch-xp1:#5a189a; --fvch-xp2:#9d4edd; --fvch-xp3:#c77dff;
  --fvch-online:#8ac926; --fvch-away:#ffb13a; --fvch-busy:#c08aff; --fvch-off:#5e5269;
  --fvch-str:#e0455e; --fvch-sta:#ffb13a; --fvch-spd:#8ac926;
  --fvch-dis:#c08aff; --fvch-men:#4cc9f0;
}

@keyframes fvch-rise { 0%{transform:translateY(100vh);opacity:0} 10%{opacity:.9} 90%{opacity:.9} 100%{transform:translateY(-10vh) translateX(40px);opacity:0} }
@keyframes fvch-spin { to{transform:rotate(360deg)} }
@keyframes fvch-dot  { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
@keyframes fvch-pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes fvch-flicker { 100%{transform:scaleY(1.15) scaleX(0.9)} }

/* Scrollbars */
.fc-scroll::-webkit-scrollbar       { width:4px; }
.fc-scroll::-webkit-scrollbar-track { background:transparent; }
.fc-scroll::-webkit-scrollbar-thumb { background:color-mix(in srgb, var(--chat-accent, #c08aff), transparent 62%); border-radius:2px; }
.fc-scroll::-webkit-scrollbar-thumb:hover { background:color-mix(in srgb, var(--chat-accent, #c08aff), transparent 38%); }

/* fc- compat for TypingIndicator dots */
@keyframes fc-dot { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
@keyframes fc-pulse { 0%,100%{box-shadow:0 0 0 0 currentColor} 50%{box-shadow:0 0 0 6px transparent} }
@keyframes fc-spin  { to{transform:rotate(360deg)} }

/* ROOT */
.fvch-root {
  display:flex; flex-direction:column;
  background:var(--fvch-bg); color:var(--fvch-text);
  font-family:'Manrope',sans-serif; font-size:13px;
  min-height:calc(100vh - 64px); position:relative; overflow-x:hidden;
}
.fvch-root, .fvch-root * { font-family:'Manrope',sans-serif; }
.fvch-root button, .fvch-root input, .fvch-root textarea { font-family:'Manrope',sans-serif; }

/* Embers */
.fvch-embers { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
.fvch-ember  { position:absolute; bottom:-10px; width:3px; height:3px; border-radius:50%;
  background:color-mix(in srgb, var(--chat-accent, #c08aff), white 18%); box-shadow:0 0 8px color-mix(in srgb, var(--chat-accent, #c08aff), transparent 20%);
  animation:fvch-rise linear infinite; opacity:0; }

/* BG */
.fvch-bg-layer { position:fixed; inset:0; z-index:0; pointer-events:none;
  background:radial-gradient(ellipse 70% 50% at 50% 20%,color-mix(in srgb, var(--chat-accent, #c08aff), transparent 82%),transparent 60%),
             radial-gradient(ellipse 80% 50% at 50% 110%,color-mix(in srgb, var(--chat-secondary, #4cc9f0), transparent 88%),transparent 55%),
             linear-gradient(180deg,#08060f,#05040a); }
.fvch-vignette { position:fixed; inset:0; z-index:0; pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.85) 100%); }
.fvch-scanlines { position:fixed; inset:0; z-index:1; pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);
  mix-blend-mode:overlay; opacity:.6; }

/* WRAPPER */
.fvch-wrapper {
  max-width:1560px; margin:0 auto; padding:14px;
  display:grid;
  grid-template-columns:280px 300px 1fr 300px;
  grid-template-rows:auto 1fr auto;
  gap:10px; min-height:calc(100vh - 64px);
  position:relative; z-index:2;
}
.fvch-top-bar   { grid-column:1/5; display:grid; grid-template-columns:280px 1fr auto; gap:10px; }
.fvch-left-col  { grid-column:1; display:flex; flex-direction:column; gap:10px; }
.fvch-friends-col { grid-column:2; display:flex; flex-direction:column; min-height:0; }
.fvch-chat-col  { grid-column:3; display:flex; flex-direction:column; min-height:0; overflow:hidden; }
.fvch-info-col  { grid-column:4; display:flex; flex-direction:column; gap:10px; }
.fvch-bottom-nav { grid-column:1/5; }

/* PANEL */
.fvch-panel {
  position:relative; overflow:hidden;
  background:linear-gradient(180deg,var(--fvch-bg1),var(--fvch-bg2));
  border:2px solid var(--fvch-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),
             0 0 0 3px #050308,0 0 0 4px var(--fvch-border2),0 6px 24px rgba(0,0,0,.6);
  padding:14px;
}
.fvch-panel::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvch-gold); top:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvch-panel::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvch-gold); top:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvch-corners { position:absolute; inset:0; pointer-events:none; }
.fvch-corners::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvch-gold); bottom:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvch-corners::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvch-gold); bottom:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }

.fvch-panel-head {
  display:flex; align-items:center; justify-content:center; gap:10px;
  color:var(--fvch-gold-b); font-size:12px; letter-spacing:1px;
  padding:5px 0 9px; margin:-2px -2px 10px;
  text-shadow:0 0 8px rgba(244,204,120,.35);
  border-bottom:1px dashed rgba(200,155,60,.25);
}
.fvch-panel-head .fvch-deco { color:var(--fvch-gold); opacity:.6; font-size:12px; }

/* TOP BAR */
.fvch-brand { padding:10px 14px; display:flex; align-items:center; gap:12px; }
.fvch-brand-mark { width:28px; height:28px; flex-shrink:0;
  background:conic-gradient(from 45deg,var(--fvch-gold) 25%,transparent 0 50%,var(--fvch-gold) 0 75%,transparent 0);
  border:2px solid var(--fvch-gold); transform:rotate(45deg);
  box-shadow:0 0 12px rgba(244,204,120,.4); }
.fvch-brand-text { font-size:11px; letter-spacing:1.5px; color:var(--fvch-gold-b);
  text-shadow:0 0 8px rgba(244,204,120,.4); }
.fvch-brand-sub  { font-size:11px; color:var(--fvch-dim); margin-top:4px; letter-spacing:1px; }

.fvch-page-title { padding:10px 18px; text-align:center;
  display:flex; flex-direction:column; justify-content:center; }
.fvch-page-h1 { font-size:18px; color:var(--chat-accent); letter-spacing:4px;
  text-shadow:0 0 16px color-mix(in srgb, var(--chat-accent), transparent 45%); margin-bottom:6px;
  display:flex; align-items:center; justify-content:center; gap:14px; }
.fvch-page-h1 .fvch-deco { color:var(--fvch-gold); opacity:.5; font-size:11px; }
.fvch-page-sub { font-family:'Manrope',sans-serif; font-size:15px;
  color:var(--fvch-dim); letter-spacing:1.5px; }

.fvch-top-right { display:flex; align-items:center; gap:8px; padding:10px 14px; }
.fvch-currency { display:flex; align-items:center; gap:8px; padding:8px 10px;
  background:var(--fvch-inner); border:2px solid var(--fvch-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.08);
  font-size:12px; color:var(--fvch-parch); }
.fvch-ic { width:14px; height:14px; display:inline-block; flex-shrink:0; }
.fvch-ic-gold   { background:radial-gradient(circle at 35% 30%,#ffe28a,var(--fvch-gold) 60%,#6e4a13);
  border:1px solid #2a1a06; border-radius:50%; }
.fvch-ic-gem    { background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg);
  border:1px solid #1a0a2a; width:11px !important; height:11px !important; }
.fvch-ic-energy { background:linear-gradient(180deg,#fff099,#ff9a1f);
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); }
.fvch-gear-btn  { width:36px; height:36px; background:var(--fvch-inner);
  border:2px solid var(--fvch-border); cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:var(--fvch-dim); font-size:14px; }
.fvch-gear-btn:hover { color:var(--fvch-gold-b); border-color:var(--fvch-gold-s); }

/* PROFILE CARD (top-bar left) */
.fvch-profile { padding:12px 14px; }
.fvch-profile-top { display:flex; align-items:center; gap:12px;
  padding-bottom:10px; border-bottom:1px dashed rgba(200,155,60,.2); margin-bottom:10px; }
.fvch-avatar-frame { width:64px; height:64px; border:3px solid var(--chat-accent); flex-shrink:0;
  background:linear-gradient(135deg,color-mix(in srgb, var(--chat-accent), transparent 65%),rgba(20,15,40,.9)),var(--fvch-inner);
  box-shadow:inset 0 0 0 1px #000, 0 0 16px color-mix(in srgb, var(--chat-accent), transparent 68%);
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden; }
.fvch-avatar-frame::before { content:""; position:absolute; width:4px; height:4px;
  background:var(--fvch-gold); top:-3px; left:-3px;
  box-shadow:64px 0 0 var(--fvch-gold),0 64px 0 var(--fvch-gold),64px 64px 0 var(--fvch-gold); }
.fvch-av-img { width:100%; height:100%; object-fit:cover; image-rendering:pixelated; }
.fvch-av-placeholder { font-size:26px; color:var(--fvch-gold); }
.fvch-player-name  { font-size:12px; color:var(--fvch-gold-b); letter-spacing:1px;
  text-shadow:0 0 6px rgba(244,204,120,.35); margin-bottom:5px; overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap; }
.fvch-player-class { font-size:11px; color:var(--chat-accent); letter-spacing:1.2px; margin-bottom:7px; text-shadow:0 0 10px color-mix(in srgb, var(--chat-accent), transparent 55%); }
.fvch-level-pill { display:inline-flex; align-items:center; gap:6px;
  font-size:12px; color:var(--fvch-parch); }
.fvch-crest { width:24px; height:28px; background:linear-gradient(180deg,#2a1a4a,#160a26);
  border:2px solid var(--fvch-gold);
  clip-path:polygon(0 0,100% 0,100% 75%,50% 100%,0 75%);
  display:flex; align-items:center; justify-content:center;
  color:var(--fvch-gold-b); font-size:11px; line-height:1; padding-bottom:3px; }
.fvch-xp-row { display:flex; justify-content:space-between; align-items:baseline;
  font-size:11px; color:var(--fvch-dim); margin-bottom:5px; }
.fvch-xp-val { color:var(--fvch-xp3); font-family:'Manrope',sans-serif; font-size:13px; text-shadow:0 0 10px rgba(199,125,255,.6),0 0 20px rgba(199,125,255,.28); }
.fvch-xp-bar { height:10px; background:#050308; border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d; position:relative; overflow:hidden; }
.fvch-xp-fill { height:100%; background:linear-gradient(90deg, var(--chat-accent), var(--chat-secondary));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25), 0 0 8px color-mix(in srgb, var(--chat-accent), transparent 55%); }

/* STATS (left col) */
.fvch-stat { display:grid; grid-template-columns:14px 1fr;
  align-items:center; gap:9px; margin-bottom:9px; }
.fvch-stat:last-of-type { margin-bottom:4px; }
.fvch-stat-glyph { width:14px; height:14px; flex-shrink:0; }
.fvch-glyph-heart  { background:var(--fvch-str); clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%); }
.fvch-glyph-shield { background:var(--fvch-sta); clip-path:polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%); }
.fvch-glyph-boot   { background:var(--fvch-spd); clip-path:polygon(0 0,60% 0,60% 60%,100% 60%,100% 100%,0 100%); }
.fvch-glyph-scroll { background:var(--fvch-dis); }
.fvch-glyph-brain  { background:var(--fvch-men); border-radius:50% 50% 40% 40%; }
.fvch-stat-label { display:flex; justify-content:space-between;
  font-size:11px; color:var(--fvch-parch); letter-spacing:.5px; margin-bottom:3px; }
.fvch-stat-val { color:var(--fvch-gold-b); }
.fvch-stat-bar { height:8px; background:#050308; border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d; position:relative; overflow:hidden; }
.fvch-stat-fill { height:100%; box-shadow:inset 0 1px 0 rgba(255,255,255,.3); }
.fvch-fill-str { background:linear-gradient(180deg,#ff6b80,var(--fvch-str)); width:78%; }
.fvch-fill-sta { background:linear-gradient(180deg,#ffcd6a,var(--fvch-sta)); width:64%; }
.fvch-fill-spd { background:linear-gradient(180deg,#b3e070,var(--fvch-spd)); width:52%; }
.fvch-fill-dis { background:linear-gradient(180deg,#d8a8ff,var(--fvch-dis)); width:86%; }
.fvch-fill-men { background:linear-gradient(180deg,#8addf5,var(--fvch-men)); width:71%; }

.fvch-skill-row { display:flex; justify-content:space-between; align-items:center;
  font-size:11px; color:var(--fvch-dim); padding:6px 0;
  border-top:1px dashed rgba(200,155,60,.15); margin-top:6px; letter-spacing:.5px; }
.fvch-skill-val { color:var(--fvch-gold-b); font-family:'Manrope',sans-serif; font-size:14px; text-shadow:0 0 10px rgba(244,204,120,.6),0 0 20px rgba(244,204,120,.28); }

/* EQUIPMENT (left col) */
.fvch-equip-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:8px; }
.fvch-equip-slot { aspect-ratio:1; background:var(--fvch-inner);
  border:2px solid var(--fvch-border); position:relative;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; cursor:pointer; transition:border-color .2s; }
.fvch-equip-slot:hover { border-color:var(--fvch-gold); }
.fvch-equip-slot::before { content:""; position:absolute; width:4px; height:4px;
  background:var(--fvch-gold); top:1px; left:1px; opacity:.6; }
.fvch-equip-slot::after { content:""; position:absolute; width:4px; height:4px;
  background:var(--fvch-gold); top:1px; right:1px; opacity:.6; }
.fvch-equip-img { width:72%; height:72%; object-fit:contain; image-rendering:pixelated; }
.fvch-equip-slot-empty { font-size:16px; opacity:.3; color:var(--fvch-dim); }

/* Slot border colors by type */
.fvch-slot-weapon { border-color:var(--fvch-gold-s); }
.fvch-slot-helmet { border-color:#9d8fa8; }
.fvch-slot-armor  { border-color:#7a6e8a; }
.fvch-slot-belt   { border-color:var(--fvch-gold-s); }
.fvch-slot-pants  { border-color:#c08aff44; }
.fvch-slot-boots  { border-color:#8ac92644; }

.fvch-set-bonus { font-family:'Manrope',sans-serif; font-size:13px;
  color:#8ac926; text-align:center; letter-spacing:.5px; }
.fvch-set-label { font-size:11px; color:var(--fvch-dim); text-align:center;
  letter-spacing:1px; margin-bottom:4px; }

/* FRIENDS COL */
.fvch-friends-col-inner { display:flex; flex-direction:column; height:100%;
  background:linear-gradient(180deg,var(--fvch-bg1),var(--fvch-bg2));
  border:2px solid var(--fvch-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),
             0 0 0 3px #050308,0 0 0 4px var(--fvch-border2);
  position:relative; overflow:hidden; }
.fvch-friends-col-inner::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--chat-accent); top:4px; left:4px; z-index:2; box-shadow:0 0 6px color-mix(in srgb, var(--chat-accent), transparent 38%); }
.fvch-friends-col-inner::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--chat-accent); top:4px; right:4px; z-index:2; box-shadow:0 0 6px color-mix(in srgb, var(--chat-accent), transparent 38%); }

.fvch-tab-row { display:grid; grid-template-columns:1fr 1fr;
  border-bottom:2px solid var(--fvch-border); flex-shrink:0; }
.fvch-tab-btn { font-family:'Manrope',sans-serif; font-size:11px;
  padding:11px 4px; background:transparent; border:none;
  color:var(--fvch-muted); cursor:pointer; letter-spacing:.06em;
  border-bottom:2px solid transparent; transition:all .2s;
  display:flex; align-items:center; justify-content:center; gap:5px; }
.fvch-tab-btn.active { color:var(--chat-accent); border-bottom-color:var(--chat-accent);
  text-shadow:0 0 8px color-mix(in srgb, var(--chat-accent), transparent 42%); }
.fvch-tab-badge { font-family:'Manrope',sans-serif; font-size:12px;
  background:var(--fvch-crim); color:#fff; border-radius:50%;
  width:16px; height:16px; display:flex; align-items:center; justify-content:center; }

.fvch-search-box { display:flex; align-items:center; gap:8px;
  padding:8px 12px; background:var(--fvch-inner);
  border-bottom:2px solid var(--fvch-border); flex-shrink:0; }
.fvch-search-input { flex:1; background:transparent; border:none; outline:none;
  font-family:'Manrope',sans-serif; font-size:16px; color:var(--fvch-text); }
.fvch-search-input::placeholder { color:var(--fvch-muted); }

.fvch-friend-list { flex:1; overflow-y:auto; }

/* Friend row â€” matching image exactly */
.fvch-friend-row { display:grid; grid-template-columns:54px 1fr 32px;
  align-items:center; gap:10px; padding:8px 12px;
  cursor:pointer; transition:background .15s;
  border-bottom:1px solid rgba(42,31,61,.6); position:relative; }
.fvch-friend-row:hover { background:color-mix(in srgb, var(--chat-accent), transparent 94%); border-left:2px solid color-mix(in srgb, var(--chat-accent), transparent 65%); }
.fvch-friend-row.active { background:color-mix(in srgb, var(--chat-accent), transparent 90%);
  border-left:2px solid var(--chat-accent); box-shadow:inset 2px 0 12px color-mix(in srgb, var(--chat-accent), transparent 82%); }

.fvch-friend-portrait { width:52px; height:52px; flex-shrink:0;
  background:linear-gradient(135deg,rgba(90,24,154,.35),#0a0712);
  border:2px solid var(--fvch-border); position:relative; overflow:hidden; }
.fvch-friend-portrait img { width:100%; height:100%; object-fit:cover; image-rendering:pixelated; }
.fvch-portrait-fallback { width:100%; height:100%; display:flex; align-items:center;
  justify-content:center; font-size:22px; color:var(--fvch-gold); }

.fvch-friend-info { min-width:0; }
.fvch-friend-name { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvch-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:4px; }
.fvch-friend-status { font-family:'Manrope',sans-serif; font-size:14px; display:flex; align-items:center; gap:5px; }
.fvch-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.fvch-status-dot.online  { background:#8ac926; box-shadow:0 0 5px #8ac926; }
.fvch-status-dot.away    { background:#ffb13a; box-shadow:0 0 5px #ffb13a; }
.fvch-status-dot.busy    { background:#c08aff; box-shadow:0 0 5px #c08aff; }
.fvch-status-dot.offline { background:#5e5269; }
.fvch-status-txt.online  { color:#8ac926; }
.fvch-status-txt.away    { color:#ffb13a; }
.fvch-status-txt.busy    { color:#c08aff; }
.fvch-status-txt.offline { color:#5e5269; }

.fvch-friend-lv { width:28px; height:28px;
  background:linear-gradient(135deg,#2a1a4a,#160a26);
  border:2px solid var(--fvch-xp2);
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-family:'Manrope',sans-serif; font-size:14px; color:var(--fvch-xp3);
  box-shadow:0 0 8px rgba(192,138,255,.3); flex-shrink:0; text-shadow:0 0 10px rgba(199,125,255,.65),0 0 20px rgba(199,125,255,.3); }

.fvch-add-friend-btn { font-family:'Manrope',sans-serif; font-size:11px; padding:11px;
  background:var(--fvch-inner); border:2px solid var(--chat-accent);
  color:var(--chat-accent); cursor:pointer; width:calc(100% - 16px); margin:8px 8px 8px;
  letter-spacing:.06em; transition:all .2s; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; gap:6px;
  box-shadow:0 0 10px color-mix(in srgb, var(--chat-accent), transparent 75%); }
.fvch-add-friend-btn:hover { background:color-mix(in srgb, var(--chat-accent), transparent 88%); box-shadow:0 0 18px color-mix(in srgb, var(--chat-accent), transparent 62%); }

.fvch-empty-list { display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:10px; padding:32px 16px;
  color:var(--fvch-muted); font-family:'Manrope',sans-serif; font-size:16px; text-align:center; }

/* CHAT COL */
.fvch-chat-col-inner { display:flex; flex-direction:column; height:100%;
  background:linear-gradient(180deg,var(--fvch-bg1),#090611);
  border:2px solid var(--fvch-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),
             0 0 0 3px #050308,0 0 0 4px var(--fvch-border2);
  position:relative; overflow:hidden; }
.fvch-chat-col-inner::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--chat-accent); top:4px; left:4px; z-index:2; box-shadow:0 0 8px color-mix(in srgb, var(--chat-accent), transparent 32%); }
.fvch-chat-col-inner::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--chat-accent); top:4px; right:4px; z-index:2; box-shadow:0 0 8px color-mix(in srgb, var(--chat-accent), transparent 32%); }

/* Chat header */
.fvch-chat-header { display:grid; grid-template-columns:52px 1fr auto;
  align-items:center; gap:10px; padding:10px 14px;
  border-bottom:2px solid var(--fvch-border); flex-shrink:0;
  background:linear-gradient(180deg,rgba(42,31,61,.5),transparent);
  position:relative; z-index:2; }
.fvch-chat-header::after { content:""; position:absolute; bottom:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent, var(--chat-accent), transparent); }
.fvch-chat-hd-av { width:48px; height:48px; flex-shrink:0;
  border:2px solid var(--chat-accent); background:var(--fvch-inner);
  box-shadow:0 0 12px color-mix(in srgb, var(--chat-accent), transparent 65%);
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden; }
.fvch-chat-hd-av img { width:100%; height:100%; object-fit:cover; image-rendering:pixelated; }
.fvch-chat-hd-name { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--chat-accent); letter-spacing:.5px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  text-shadow:0 0 10px color-mix(in srgb, var(--chat-accent), transparent 55%); }
.fvch-chat-hd-status { font-family:'Manrope',sans-serif; font-size:14px;
  margin-top:3px; display:flex; align-items:center; gap:5px; }
.fvch-hd-actions { display:flex; gap:6px; align-items:center; }
.fvch-hd-btn { width:32px; height:32px; background:rgba(42,31,61,.6);
  border:2px solid var(--fvch-border); color:var(--fvch-gold);
  cursor:pointer; font-size:14px; display:flex; align-items:center;
  justify-content:center; transition:all .2s; flex-shrink:0; }
.fvch-hd-btn:hover { border-color:var(--fvch-gold); background:rgba(200,155,60,.1); }

/* Messages */
.fvch-chat-messages { flex:1; overflow-y:auto; padding:14px; position:relative;
  display:flex; flex-direction:column; gap:2px; }

/* Message rows */
.fvch-msg { display:flex; align-items:flex-end; gap:8px; margin-bottom:6px; }
.fvch-msg-me { flex-direction:row-reverse; }

.fvch-msg-av { width:32px; height:32px; flex-shrink:0;
  border:1px solid var(--fvch-border); background:var(--fvch-inner);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; overflow:hidden; }
.fvch-msg-av img { width:100%; height:100%; object-fit:cover; image-rendering:pixelated; }

.fvch-msg-bubble { max-width:72%;
  background:rgba(22,17,34,.9);
  border:1px solid var(--fvch-border); padding:8px 12px;
  border-radius:2px 12px 12px 2px; }
.fvch-bubble-me { background:linear-gradient(135deg,#2a1a45,#1e0f33);
  border-color:#c08aff33; border-radius:12px 2px 2px 12px; }
.fvch-msg-meta { display:flex; gap:8px; align-items:baseline; margin-bottom:4px; }
.fvch-msg-who { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvch-gold); text-shadow:0 0 10px rgba(200,155,60,.55),0 0 20px rgba(200,155,60,.25); }
.fvch-msg-me .fvch-msg-who { color:var(--fvch-purple); text-shadow:0 0 10px rgba(192,138,255,.55),0 0 20px rgba(192,138,255,.25); }
.fvch-msg-time { font-family:'Manrope',sans-serif; font-size:13px; color:var(--fvch-muted); }
.fvch-msg-text { font-family:'Manrope',sans-serif; font-size:16px;
  color:var(--fvch-text); line-height:1.4; word-break:break-word; }
.fvch-msg-deleted { color:var(--fvch-muted); font-style:italic; }
.fvch-msg-sigil { font-size:16px; color:var(--fvch-purple); flex-shrink:0; }

.fvch-date-sep { text-align:center; margin:8px 0; }
.fvch-date-sep span { font-family:'Manrope',sans-serif; font-size:13px; color:var(--fvch-muted);
  background:var(--fvch-inner); padding:3px 12px; border:1px solid var(--fvch-border); }

.fvch-msg-empty { flex:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:10px; color:var(--fvch-muted);
  font-family:'Manrope',sans-serif; font-size:18px; padding:40px; }

.fvch-load-more-btn { font-family:'Manrope',sans-serif; font-size:11px;
  padding:6px 14px; background:var(--fvch-inner); border:1px solid var(--fvch-border);
  color:var(--fvch-muted); cursor:pointer; letter-spacing:.06em;
  display:flex; margin:0 auto 10px; }

.fvch-scroll-btn { position:absolute; bottom:70px; right:12px; z-index:20;
  width:30px; height:30px; border-radius:50%;
  border:2px solid var(--chat-accent); background:var(--fvch-bg1);
  color:var(--chat-accent); display:flex; align-items:center;
  justify-content:center; cursor:pointer; font-size:12px;
  box-shadow:0 0 12px color-mix(in srgb, var(--chat-accent), transparent 55%); }

/* Input row */
.fvch-chat-input-row { display:grid; grid-template-columns:1fr 34px 34px;
  align-items:center; gap:7px; padding:10px 12px;
  background:linear-gradient(180deg,rgba(42,31,61,.4),rgba(22,17,34,.8));
  border-top:2px solid var(--fvch-border); flex-shrink:0; position:relative; }
.fvch-chat-input-row::before { content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,var(--fvch-gold),transparent); }
.fvch-msg-input-wrap { display:flex; align-items:center;
  background:var(--fvch-inner); border:2px solid var(--fvch-border);
  padding:8px 12px; }
.fvch-msg-input { flex:1; background:transparent; border:none; outline:none;
  font-family:'Manrope',sans-serif; font-size:16px; color:var(--fvch-text); }
.fvch-msg-input::placeholder { color:var(--fvch-muted); }
.fvch-msg-input:focus ~ .fvch-chat-input-row { border-color:var(--chat-accent); }
.fvch-msg-input-wrap:focus-within { border-color:color-mix(in srgb, var(--chat-accent), transparent 38%); box-shadow:0 0 0 2px color-mix(in srgb, var(--chat-accent), transparent 82%); }
.fvch-input-btn { width:34px; height:34px; background:var(--fvch-inner);
  border:2px solid var(--fvch-border); color:var(--fvch-gold);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  font-size:18px; transition:border-color .2s; }
.fvch-input-btn:hover { border-color:var(--chat-accent); color:var(--chat-accent); }
.fvch-send-btn { width:34px; height:34px; flex-shrink:0;
  background:linear-gradient(135deg, var(--chat-accent), var(--chat-secondary));
  border:none; color:#07060c; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:opacity .2s;
  box-shadow:0 0 14px color-mix(in srgb, var(--chat-accent), transparent 58%); }
.fvch-send-btn:disabled { opacity:.38; cursor:not-allowed; }
.fvch-send-btn:not(:disabled):hover { opacity:.82; }

/* INFO COL */
.fvch-info-col-inner { display:flex; flex-direction:column;
  background:linear-gradient(180deg,var(--fvch-bg1),var(--fvch-bg2));
  border:2px solid var(--fvch-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),
             0 0 0 3px #050308,0 0 0 4px var(--fvch-border2);
  position:relative; overflow:hidden; }
.fvch-info-col-inner::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvch-gold); top:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvch-info-col-inner::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvch-gold); top:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }

.fvch-info-head { font-family:'Manrope',sans-serif; font-size:11px;
  letter-spacing:.1em; color:var(--chat-accent);
  background:color-mix(in srgb, var(--chat-accent), transparent 92%);
  border-bottom:2px solid color-mix(in srgb, var(--chat-accent), transparent 72%);
  padding:10px 14px; text-shadow:0 0 12px color-mix(in srgb, var(--chat-accent), transparent 48%);
  flex-shrink:0; text-align:center; }

.fvch-info-portrait { display:flex; justify-content:center; padding:14px 0 8px; }
.fvch-info-big-av { width:110px; height:110px; border-radius:50%;
  border:3px solid var(--fvch-gold);
  box-shadow:0 0 20px rgba(200,155,60,.35),inset 0 0 12px rgba(0,0,0,.5);
  background:var(--fvch-inner); display:flex; align-items:center;
  justify-content:center; overflow:hidden; }
.fvch-info-big-av img { width:100%; height:100%; object-fit:cover; image-rendering:pixelated; }

.fvch-info-name  { font-family:'Manrope',sans-serif; font-size:12px;
  color:var(--fvch-gold-b); text-align:center; padding:4px 12px;
  text-shadow:0 0 6px rgba(244,204,120,.35); }
.fvch-info-title { font-family:'Manrope',sans-serif; font-size:15px;
  color:var(--fvch-purple); text-align:center; margin-bottom:6px; text-shadow:0 0 14px rgba(192,138,255,.65),0 0 28px rgba(192,138,255,.3); }
.fvch-info-lv { font-family:'Manrope',sans-serif; font-size:18px;
  color:var(--fvch-gold); text-align:center; margin-bottom:10px; text-shadow:0 0 14px rgba(200,155,60,.72),0 0 28px rgba(200,155,60,.32); }

.fvch-info-section { padding:8px 14px; border-top:1px dashed rgba(200,155,60,.2); }
.fvch-info-section-lbl { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvch-gold); letter-spacing:.1em; margin-bottom:7px; }

.fvch-rank-row { display:flex; align-items:center; gap:10px; }
.fvch-rank-badge { width:36px; height:36px; flex-shrink:0;
  background:linear-gradient(135deg,#c5cad6,#8a8fa0);
  border:2px solid #6a7080;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; }
.fvch-rank-info { flex:1; min-width:0; }
.fvch-rank-name { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvch-text); margin-bottom:3px; }
.fvch-rank-pts  { font-family:'Manrope',sans-serif; font-size:14px;
  color:var(--fvch-gold); display:flex; align-items:center; gap:4px; text-shadow:0 0 10px rgba(200,155,60,.6),0 0 20px rgba(200,155,60,.28); }
.fvch-rank-pts-trophy { font-size:14px; }

.fvch-info-activity { font-family:'Manrope',sans-serif; font-size:16px; }
.fvch-info-activity.online  { color:#8ac926; }
.fvch-info-activity.offline { color:#5e5269; }
.fvch-info-activity.away    { color:#ffb13a; }

.fvch-info-group { display:flex; align-items:center; gap:10px; }
.fvch-group-crest { width:32px; height:32px; flex-shrink:0;
  background:rgba(42,31,61,.8); border:2px solid var(--fvch-border);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; color:var(--fvch-gold); }
.fvch-group-info { flex:1; min-width:0; }
.fvch-group-name { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvch-text); margin-bottom:3px; }
.fvch-group-members { font-family:'Manrope',sans-serif; font-size:14px; color:var(--fvch-dim); }

.fvch-invite-btn { font-family:'Manrope',sans-serif; font-size:11px; padding:12px;
  background:linear-gradient(135deg, color-mix(in srgb, var(--chat-accent), transparent 74%), color-mix(in srgb, var(--chat-accent), transparent 90%));
  border:2px solid var(--chat-accent); color:var(--chat-accent); cursor:pointer;
  width:calc(100% - 28px); margin:10px 14px 14px;
  letter-spacing:.08em; transition:all .2s; text-shadow:0 0 8px color-mix(in srgb, var(--chat-accent), transparent 50%); }
.fvch-invite-btn:hover { background:color-mix(in srgb, var(--chat-accent), transparent 76%);
  box-shadow:0 0 18px color-mix(in srgb, var(--chat-accent), transparent 60%); }

.fvch-info-empty { flex:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:10px; color:var(--fvch-muted);
  font-family:'Manrope',sans-serif; font-size:18px; padding:40px; text-align:center; }

/* BOTTOM NAV */
.fvch-bottom-nav { padding:8px; display:grid; grid-template-columns:repeat(9,1fr); gap:4px; }
.fvch-nav-item { display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:9px 2px 7px; background:var(--fvch-inner); border:2px solid var(--fvch-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05);
  cursor:pointer; position:relative; transition:.15s; text-decoration:none; color:inherit; }
.fvch-nav-item:hover { border-color:color-mix(in srgb, var(--chat-accent), transparent 42%);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--chat-accent), transparent 72%), 0 0 12px color-mix(in srgb, var(--chat-accent), transparent 78%);
  transform:translateY(-2px); }
.fvch-nav-item.active { border-color:var(--chat-accent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--chat-accent), transparent 22%), 0 0 16px color-mix(in srgb, var(--chat-accent), transparent 65%);
  background:linear-gradient(180deg, color-mix(in srgb, var(--chat-accent), transparent 91%), color-mix(in srgb, var(--chat-accent), transparent 97%)); }
.fvch-nav-item.active::after { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:30%; height:3px;
  background:var(--chat-accent); box-shadow:0 0 10px var(--chat-accent); }
.fvch-nav-icon { width:26px; height:26px; display:flex; align-items:center; justify-content:center; }
.fvch-ng { width:20px; height:20px; }
.fvch-ng-map      { background:linear-gradient(180deg,#d4a44a,#6e4f1f);
  clip-path:polygon(0 10%,33% 0,66% 10%,100% 0,100% 90%,66% 100%,33% 90%,0 100%); }
.fvch-ng-char     { background:linear-gradient(180deg,#b8c0ff,#4a55a0);
  clip-path:polygon(50% 0,90% 30%,90% 70%,50% 100%,10% 70%,10% 30%); }
.fvch-ng-exercise { background:#e0455e;
  clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); }
.fvch-ng-routine  { background:linear-gradient(180deg,var(--fvch-gold-b),var(--fvch-gold));
  clip-path:polygon(15% 0,85% 0,100% 15%,100% 85%,85% 100%,15% 100%,0 85%,0 15%); }
.fvch-ng-mission  { background:linear-gradient(180deg,var(--fvch-gold-b),var(--fvch-gold));
  clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%); }
.fvch-ng-logros   { background:linear-gradient(180deg,var(--fvch-gold-b),var(--fvch-gold));
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
.fvch-ng-inv      { background:linear-gradient(180deg,#c89b3c,#6e4a13);
  clip-path:polygon(0 35%,100% 35%,100% 100%,0 100%); }
.fvch-ng-shop     { background:linear-gradient(180deg,#ffcd6a,var(--fvch-gold));
  clip-path:polygon(0 35%,15% 5%,85% 5%,100% 35%,90% 95%,10% 95%); }
.fvch-ng-chat     { background:linear-gradient(180deg,var(--fvch-gold-b),var(--fvch-gold));
  clip-path:polygon(0 0,100% 0,100% 70%,35% 70%,15% 100%,15% 70%,0 70%); }
.fvch-nav-label { font-size:11px; letter-spacing:.5px; color:var(--fvch-dim); }
.fvch-nav-item.active .fvch-nav-label { color:var(--chat-accent); text-shadow:0 0 10px color-mix(in srgb, var(--chat-accent), transparent 42%),0 0 20px color-mix(in srgb, var(--chat-accent), transparent 70%); }
.fvch-nav-badge { position:absolute; top:3px; right:3px; background:var(--fvch-crim); color:#fff;
  font-size:11px; padding:2px 3px; border:1px solid #1a0408; }

/* CTX MENU */
.fvch-ctx-menu { position:fixed; z-index:501;
  background:linear-gradient(180deg,#241b3a,#161122);
  border:1px solid var(--fvch-crim); min-width:160px;
  box-shadow:0 8px 32px rgba(0,0,0,.85); }
.fvch-ctx-item { display:flex; align-items:center; gap:8px; padding:12px 16px;
  width:100%; background:transparent; border:none;
  color:var(--fvch-crim); font-family:'Manrope',sans-serif;
  font-size:16px; cursor:pointer; transition:background .12s; }
.fvch-ctx-item:hover { background:rgba(211,59,77,.12); }

/* Loading */
.fvch-spinner { width:20px; height:20px; border:2px solid color-mix(in srgb, var(--chat-accent), transparent 78%);
  border-top-color:var(--chat-accent); border-radius:50%;
  animation:fvch-spin .7s linear infinite; }

/* ── Responsive breakpoints ─────────────────────────────────── */
@media (max-width:1440px) {
  .fvch-wrapper { max-width:100%; grid-template-columns:260px 280px 1fr 260px; gap:8px; }
  .fvch-top-bar { grid-template-columns:260px 1fr auto; }
}
@media (max-width:1280px) {
  .fvch-wrapper { grid-template-columns:240px 260px 1fr 240px; gap:6px; padding:10px; }
  .fvch-top-bar { grid-template-columns:240px 1fr auto; }
  .fvch-page-h1 { font-size:15px; letter-spacing:2px; }
  .fvch-brand-text { font-size:11px; }
}
@media (max-width:1152px) {
  .fvch-wrapper { grid-template-columns:220px 240px 1fr; gap:6px; }
  .fvch-top-bar { grid-template-columns:220px 1fr auto; }
  .fvch-info-col { display:none; }
  .fvch-chat-col { grid-column:3; }
}
@media (max-width:1024px) {
  .fvch-wrapper {
    grid-template-columns:1fr 1fr;
    grid-template-rows:auto auto 1fr auto;
    gap:6px; padding:8px;
  }
  .fvch-top-bar      { grid-column:1/3; grid-template-columns:1fr auto; }
  .fvch-left-col     { grid-column:1/3; flex-direction:row; flex-wrap:wrap; }
  .fvch-friends-col  { grid-column:1; min-height:280px; }
  .fvch-chat-col     { grid-column:2; }
  .fvch-info-col     { display:none; }
  .fvch-bottom-nav   { grid-column:1/3; grid-template-columns:repeat(5,1fr); }
  .fvch-page-h1      { font-size:14px; }
  .fvch-avatar-frame { width:52px; height:52px; }
}
@media (max-width:820px) {
  .fvch-wrapper { grid-template-columns:1fr; }
  .fvch-top-bar { grid-column:1; grid-template-columns:1fr auto; }
  .fvch-left-col    { grid-column:1; }
  .fvch-friends-col { grid-column:1; min-height:200px; }
  .fvch-chat-col    { grid-column:1; }
  .fvch-bottom-nav  { grid-column:1; grid-template-columns:repeat(5,1fr); }
}
@media (max-width:640px) {
  .fvch-wrapper { padding:6px; gap:4px; }
  .fvch-bottom-nav { grid-template-columns:repeat(4,1fr); }
  .fvch-bottom-nav .fvch-nav-item:nth-child(n+5) { display:none; }
  .fvch-page-h1 { font-size:13px; letter-spacing:1px; }
}
`;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AMBIENT BACKGROUND â€” SC animated blobs + grid
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AmbientBg = memo(function AmbientBg() {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
      <motion.div
        animate={{ x:[0,70,-50,0], y:[0,-40,60,0], scale:[1,1.12,0.94,1] }}
        transition={{ duration:24, repeat:Infinity, ease:"easeInOut" }}
        style={{ position:"absolute", width:560, height:560, left:"-12%", top:"-15%",
          borderRadius:"50%", filter:"blur(110px)", opacity:0.14,
          background:`radial-gradient(circle,${SC.orange} 0%,transparent 70%)` }} />
      <motion.div
        animate={{ x:[0,-60,40,0], y:[0,50,-35,0], scale:[1,0.9,1.1,1] }}
        transition={{ duration:30, repeat:Infinity, ease:"easeInOut" }}
        style={{ position:"absolute", width:480, height:480, right:"-8%", bottom:"5%",
          borderRadius:"50%", filter:"blur(120px)", opacity:0.11,
          background:`radial-gradient(circle,${SC.blue} 0%,transparent 70%)` }} />
      <motion.div
        animate={{ x:[0,40,-70,0], y:[0,-60,25,0], scale:[1,1.08,0.93,1] }}
        transition={{ duration:38, repeat:Infinity, ease:"easeInOut" }}
        style={{ position:"absolute", width:420, height:420, left:"38%", top:"25%",
          borderRadius:"50%", filter:"blur(100px)", opacity:0.09,
          background:`radial-gradient(circle,${SC.teal} 0%,transparent 70%)` }} />
      {/* Dot grid â€” matches dashboard pattern */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`radial-gradient(circle,${SC.navy}44 1px,transparent 1px)`,
        backgroundSize:"22px 22px",
        animation:"fc-dotmove 10s linear infinite",
      }} />
      {/* Scan line */}
      <motion.div
        animate={{ top:["-2px","100%"] }}
        transition={{ duration:7, repeat:Infinity, ease:"linear" }}
        style={{ position:"absolute", left:0, right:0, height:1, pointerEvents:"none",
          background:`linear-gradient(90deg,transparent,${SC.orange}30,${SC.orange}55,${SC.orange}30,transparent)` }} />
    </div>
  );
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UTILITIES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatTime(ts, nowText = "ahora") {
  if (!ts) return "";
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 60000)    return nowText;
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString("es-EC", { hour:"2-digit", minute:"2-digit" });
  return d.toLocaleDateString("es-EC", { day:"2-digit", month:"short" });
}
function formatMsgTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("es-EC", { hour:"2-digit", minute:"2-digit" });
}

function normalizeChatGameplayAction(raw) {
  const cta = raw?.cta || raw;
  if (!cta || typeof cta !== "object") return null;
  const ctaType = String(cta.ctaType || cta.type || cta.entityType || "").toLowerCase();
  const section = String(cta.section || CHAT_CTA_SECTION_BY_TYPE[ctaType] || "").toLowerCase() || null;
  if (!section) return null;
  return {
    section,
    ctaType,
    ctaLabel: cta.ctaLabel || cta.label || CHAT_CTA_LABEL_BY_TYPE[ctaType] || "Abrir detalle",
    missionId: cta.missionId || null,
    rutinaId: cta.rutinaId || null,
    achievementId: cta.achievementId || null,
    itemId: cta.itemId || null,
    exerciseId: cta.exerciseId || null,
    profileUid: cta.profileUid || null,
    entityId: cta.entityId || null,
  };
}

function Spinner({ size = 16, color = SC.orange }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid ${color}30`,
      borderTop:`2px solid ${color}`, borderRadius:"50%",
      animation:"fc-spin .7s linear infinite", flexShrink:0 }} />
  );
}
function Skel({ h = 52 }) {
  return <div className="fc-skel" style={{ height:h, marginBottom:8 }} />;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PANEL TITLE â€” matches UserMensajes PanelTitle
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PanelTitle({ icon: Icon, label, color = SC.gold, badge, sub }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 14px", borderBottom:`1px solid rgba(26,51,84,.6)`,
      flexShrink:0, position:"relative", zIndex:2,
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${color}88,${color}22,transparent)` }}/>
      <div style={{ width:22, height:22, borderRadius:4, flexShrink:0,
        background:`${color}18`, border:`1px solid ${color}44`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={11} color={color}/>
      </div>
      <div style={{ flex:1 }}>
        <span style={{ ...rpx(7), color, letterSpacing:".05em" }}>{label}</span>
        {sub && <div style={{ ...raj(10,500), color:SC.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {badge != null && (
        <span style={{ ...orb(9,900), color:SC.bg, background:color,
          borderRadius:3, padding:"2px 8px" }}>{badge}</span>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// STAT COUNTER â€” matches UserMensajes StatCounter
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCounter({ value, label, color, icon: Icon }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 12px",
      background:`${color}0a`, border:`1px solid ${color}22`, borderRadius:8,
    }}>
      <div style={{ width:32, height:32, borderRadius:7, flexShrink:0,
        background:`${color}18`, border:`1px solid ${color}33`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={14} color={color}/>
      </div>
      <div>
        <div style={{ ...orb(18,900), color, lineHeight:1 }}>{value}</div>
        <div style={{ ...raj(9,700), color:SC.muted, letterSpacing:".09em", marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CHAT FILTER BTN â€” vertical nav button, matches UserMensajes FilterBtn
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChatFilterBtn({ tab, active, onClick }) {
  const col = tab.color || SC.orange;
  return (
    <button onClick={onClick} className="fc-filter-btn"
      style={{
        width:"100%", display:"flex", alignItems:"center", gap:9,
        padding:"8px 10px", borderRadius:8,
        background: active ? `${col}18` : "transparent",
        border:`1px solid ${active ? col+"44" : "transparent"}`,
        color: active ? col : SC.muted,
        textAlign:"left", position:"relative", cursor:"pointer",
      }}>
      {active && (
        <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%",
          width:2, borderRadius:2, background:col }}/>
      )}
      <div style={{ width:26, height:26, borderRadius:6, flexShrink:0,
        background:`${col}${active ? "22" : "14"}`,
        border:`1px solid ${col}${active ? "44" : "22"}`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ color:col }}>{tab.icon}</span>
      </div>
      <span style={{ ...raj(12, active ? 700 : 500), flex:1, color: active ? col : SC.muted }}>
        {tab.label}
      </span>
      {tab.badge != null && tab.badge > 0 && (
        <span style={{ ...orb(8,700), color: active ? col : SC.muted,
          background:`${col}${active ? "22" : "14"}`,
          border:`1px solid ${col}${active ? "44" : "22"}`,
          borderRadius:20, padding:"1px 6px", flexShrink:0 }}>{tab.badge > 9 ? "9+" : tab.badge}</span>
      )}
    </button>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SPRITE IDLE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘ [ANIMATED_SEQUENCE_SLOT] /muÃ±eco/idle_01..08.png                     â•‘
// â•‘ 8-frame idle animation cycling at 8fps via setInterval              â•‘
// â•‘ Used in: EmptyChatState (centered hero), HeroCard backdrop           â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function SpriteIdle({ size = 120, fps = 8 }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => { IDLE_FRAMES.forEach(src => { const i = new Image(); i.src = src; }); }, []);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % IDLE_FRAMES.length), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      backgroundImage:`url('${IDLE_FRAMES[frame]}')`,
      backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundPosition:"center bottom",
      imageRendering:"pixelated",
    }} />
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AVATAR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Avatar({ user, size = 38, online = false }) {
  const col = CLASS_COLOR[user?.heroClass] || SC.orange;
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      {user?.photoURL ? (
        <img src={user.photoURL} alt={user?.username}
          style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover",
            border:`2px solid ${col}55`, boxShadow:`0 0 0 1px ${col}22` }} />
      ) : (
        <div style={{ width:size, height:size, borderRadius:"50%",
          background:`linear-gradient(135deg,${col}1a,${col}0a)`,
          border:`2px solid ${col}44`,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 0 0 1px ${col}1a` }}>
          <img
            src={CLASS_CREST[user?.heroClass] || CLASS_CREST.DEFAULT}
            alt=""
            style={{ width:size * 0.48, height:size * 0.48, objectFit:"contain" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      )}
      <AnimatePresence>
        {online && (
          <motion.span initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
            style={{ position:"absolute", bottom:-2, right:-2, width:18, height:18,
              borderRadius:"50%", display:"grid", placeItems:"center",
              background:"rgba(8,10,18,.92)", border:`1px solid ${SC.green}55`,
              boxShadow:`0 0 12px ${SC.green}33` }}>
            <img
              src={CHAT_ASSETS.onlineBadge}
              alt=""
              style={{ width:12, height:12, objectFit:"contain" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background = SC.green;
                  e.currentTarget.parentElement.style.border = `2px solid ${SC.bg}`;
                  e.currentTarget.parentElement.style.width = "10px";
                  e.currentTarget.parentElement.style.height = "10px";
                  e.currentTarget.parentElement.style.animation = "fc-pulse 2s ease infinite";
                }
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TYPING INDICATOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TypingIndicator({ name }) {
  const { t } = useLang();
  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 14px",
        background:`${SC.navy}66`, borderRadius:20, alignSelf:"flex-start",
        border:`1px solid ${SC.navy}`, backdropFilter:"blur(8px)", maxWidth:"fit-content" }}>
      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width:5, height:5, borderRadius:"50%", background:SC.orange,
            display:"inline-block", animation:`fc-dot 1.3s ease-in-out ${i * 0.22}s infinite` }} />
        ))}
      </div>
      <span style={{ ...raj(12, 500), color:SC.muted, fontStyle:"italic" }}>
        {name} {t("ch.typing")}
      </span>
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HERO CARD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HeroCard = memo(function HeroCard({
  u,
  isFriend,
  alreadySent,
  onAdd,
  onChat,
  tags = [],
  insight = "",
  isOnline = false,
  socialRankSrc = "",
  statusLabel = "",
}) {
  const { t } = useLang();
  const col = CLASS_COLOR[u.heroClass] || SC.orange;
  const classTxt = u.heroClass ? t(`ch.class.${u.heroClass.toLowerCase()}`) : "Héroe";
  const crest = CLASS_CREST[u.heroClass] || CLASS_CREST.DEFAULT;

  return (
    <motion.div
      variants={FV.up}
      className="fc-hero-card"
      style={{
        position:"relative",
        overflow:"hidden",
        borderRadius:18,
        padding:"16px 16px 14px",
        border:`1px solid ${col}33`,
        background:"linear-gradient(180deg, rgba(15,11,28,.96), rgba(10,8,20,.98))",
        boxShadow:`0 18px 42px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.04)`,
      }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 82% 16%, ${col}16, transparent 28%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${col}88, transparent)` }} />

      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14, position:"relative", zIndex:1 }}>
        <Avatar user={u} size={44} online={isOnline} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:SC.text, ...sans(15,800), overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {u.username}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:7 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 9px", borderRadius:999, border:`1px solid ${col}33`, background:`${col}12`, color:col, ...mono(10,700), letterSpacing:".08em", textTransform:"uppercase" }}>
              <img src={crest} alt="" style={{ width:14, height:14, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
              {classTxt}
            </span>
            <span style={{ display:"inline-flex", alignItems:"center", padding:"5px 9px", borderRadius:999, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.03)", color:SC.muted, ...mono(10,700), letterSpacing:".08em", textTransform:"uppercase" }}>
              Lv. {u.level || 1}
            </span>
          </div>
        </div>
        {socialRankSrc ? (
          <div style={{ width:42, height:42, borderRadius:14, border:`1px solid ${col}26`, background:"rgba(255,255,255,.03)", display:"grid", placeItems:"center", flexShrink:0 }}>
            <img src={socialRankSrc} alt="" style={{ width:28, height:28, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
          </div>
        ) : null}
      </div>

      <div style={{ ...glass(col), borderRadius:14, padding:"12px 12px 10px", marginBottom:12, position:"relative", zIndex:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:10 }}>
          <div>
            <div style={{ color:SC.muted, ...mono(10,700), letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>Rareza social</div>
            <div style={{ color:col, ...sans(13,800) }}>{isFriend ? "Vinculo firme" : alreadySent ? "Contacto abierto" : "Nuevo contacto"}</div>
          </div>
          <div>
            <div style={{ color:SC.muted, ...mono(10,700), letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>Conexion</div>
            <div style={{ color:isOnline ? SC.green : SC.muted, ...sans(13,800) }}>{statusLabel || (isOnline ? "Activo ahora" : "Sin pulso visible")}</div>
          </div>
        </div>
      </div>

      {(tags.length > 0 || insight) && (
        <div style={{ display:"grid", gap:8, marginBottom:12, position:"relative", zIndex:1 }}>
          {tags.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={`${u.uid}-${tag.label}`}
                  style={{
                    display:"inline-flex",
                    alignItems:"center",
                    padding:"5px 8px",
                    borderRadius:999,
                    border:`1px solid ${(tag.color || SC.muted)}33`,
                    background:`${(tag.color || SC.muted)}12`,
                    color:tag.color || SC.muted,
                    ...mono(9,700),
                    letterSpacing:".08em",
                    textTransform:"uppercase",
                  }}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          {insight ? (
            <div style={{ color:SC.muted, ...sans(12,500), lineHeight:1.55 }}>
              {insight}
            </div>
          ) : null}
        </div>
      )}

      {isFriend ? (
        <motion.button
          whileHover={{ scale:1.015, y:-1 }}
          whileTap={{ scale:.98 }}
          onClick={() => onChat(u.uid)}
          style={{ width:"100%", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 12px", borderRadius:12, border:`1px solid ${SC.orange}44`, background:`linear-gradient(180deg, ${SC.orange}18, rgba(255,255,255,.02))`, color:SC.orange, cursor:"pointer", ...sans(13,800) }}>
          <MessageSquare size={13} /> {t("ch.hero.open_chat")}
        </motion.button>
      ) : alreadySent ? (
        <div style={{ width:"100%", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.03)", color:SC.muted, ...sans(13,700) }}>
          <Clock size={12} /> {t("ch.hero.sent")}
        </div>
      ) : (
        <motion.button
          whileHover={{ scale:1.015, y:-1, boxShadow:`0 8px 22px ${col}22` }}
          whileTap={{ scale:.98 }}
          onClick={() => onAdd(u.uid)}
          style={{ width:"100%", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 12px", borderRadius:12, border:`1px solid ${col}44`, background:`linear-gradient(180deg, ${col}16, rgba(255,255,255,.02))`, color:col, cursor:"pointer", ...sans(13,800) }}>
          <UserPlus size={13} /> {t("ch.hero.add")}
        </motion.button>
      )}
    </motion.div>
  );
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MESSAGE BUBBLE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MessageBubble({ msg, isMe, other, onContextMenu, seenByOther, onAction }) {
  const accent = CLASS_COLOR[other?.heroClass] || SC.teal;
  const crest = CLASS_CREST[other?.heroClass] || CLASS_CREST.DEFAULT;
  const gameplayAction = normalizeChatGameplayAction(msg);
  return (
    <motion.div variants={FV.msgIn}
      style={{ display:"flex", flexDirection:"column",
        alignItems:isMe ? "flex-end" : "flex-start", marginBottom:2 }}>
      <div style={{ maxWidth:"74%", display:"flex",
        flexDirection:isMe ? "row-reverse" : "row", alignItems:"flex-end", gap:7 }}>
        {!isMe && (
          <div style={{ flexShrink:0, marginBottom:2 }}>
            <Avatar user={other} size={26} />
          </div>
        )}
        <div
          onContextMenu={isMe && !msg.deleted ? onContextMenu : undefined}
          style={{
            position:"relative",
            overflow:"hidden",
            padding:"11px 14px 10px",
            background: isMe
              ? `linear-gradient(135deg,${SC.orange}ee,${SC.gold}cc)`
              : "linear-gradient(180deg, rgba(18,27,42,.94), rgba(11,16,28,.96))",
            border: isMe
              ? `1px solid ${SC.orange}44`
              : `1px solid ${accent}2f`,
            borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            backdropFilter: "blur(12px)",
            boxShadow: isMe
              ? `0 4px 20px ${SC.orange}33, inset 0 1px 0 rgba(255,255,255,0.12)`
              : "0 8px 24px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)",
            maxWidth:"100%", wordBreak:"break-word",
            cursor: isMe && !msg.deleted ? "context-menu" : "default",
          }}>
          <img
            src="/ui/panel-texture.png"
            alt=""
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:isMe ? 0.08 : 0.12, pointerEvents:"none", mixBlendMode:"screen" }}
            onError={(e)=>{e.currentTarget.style.display="none";}}
          />
          {!isMe && (
            <>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${accent}88, transparent)` }} />
              <div style={{ position:"absolute", top:10, right:10, width:16, height:16, borderRadius:6, border:`1px solid ${accent}28`, background:"rgba(255,255,255,.03)", display:"grid", placeItems:"center" }}>
                <img src={crest} alt="" style={{ width:10, height:10, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
              </div>
            </>
          )}
          <p style={{
            ...raj(14, msg.deleted ? 400 : 500),
            color: msg.deleted ? SC.muted : (isMe ? "#0A0E1A" : SC.white),
            fontStyle: msg.deleted ? "italic" : "normal",
            lineHeight: 1.55, margin: 0,
          }}>
            {msg.text}
          </p>
          <div style={{ display:"flex", justifyContent:"flex-end",
            gap:5, marginTop:4, alignItems:"center" }}>
            <span style={{ ...orb(8, 400), color:isMe ? "rgba(10,14,26,0.55)" : SC.muted }}>
              {formatMsgTime(msg.timestamp)}
            </span>
            {isMe && !msg.deleted && (
              seenByOther
                ? <CheckCheck size={11} color={SC.blue} title="Visto" />
                : <Check size={11} color="rgba(10,14,26,0.4)" title="Entregado" />
            )}
          </div>
          {gameplayAction && !msg.deleted ? (
            <button
              type="button"
              onClick={() => onAction?.(gameplayAction)}
              style={{
                marginTop:10,
                display:"inline-flex",
                alignItems:"center",
                gap:8,
                padding:"8px 10px",
                borderRadius:10,
                border:`1px solid ${isMe ? "rgba(10,14,26,0.18)" : `${accent}33`}`,
                background:isMe ? "rgba(10,14,26,0.12)" : `${accent}14`,
                color:isMe ? "#0A0E1A" : accent,
                cursor:"pointer",
                ...sans(12,800),
              }}>
              <Zap size={12} /> {gameplayAction.ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// EMPTY CHAT STATE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmptyChatState({ onExplore }) {
  const { t } = useLang();
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.55 }}
      style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:0, padding:32, position:"relative", zIndex:2 }}>

      <div style={{ width:"min(100%, 760px)", borderRadius:24, border:"1px solid rgba(255,255,255,.08)", background:"linear-gradient(180deg, rgba(13,10,25,.92), rgba(9,7,18,.98))", boxShadow:"0 28px 60px rgba(0,0,0,.34)", padding:"28px 24px", position:"relative", overflow:"hidden" }}>
        <img
          src={CHAT_ASSETS.emptyPanel}
          alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.18, pointerEvents:"none" }}
          onError={(e)=>{e.currentTarget.style.display="none";}}
        />
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 50% 20%, ${SC.orange}18, transparent 28%), radial-gradient(circle at 78% 78%, ${SC.teal}10, transparent 24%)`, pointerEvents:"none" }} />
        <div style={{ display:"grid", gridTemplateColumns:"minmax(180px, 220px) minmax(0, 1fr)", gap:24, alignItems:"center", position:"relative", zIndex:1 }}>
          <div style={{ position:"relative", minHeight:220, display:"grid", placeItems:"center" }}>
            <motion.div
              animate={{ scale:[1,1.18,1], opacity:[0.2,0.45,0.2] }}
              transition={{ duration:3.2, repeat:Infinity, ease:"easeInOut" }}
              style={{ position:"absolute", top:"50%", left:"50%",
                transform:"translate(-50%,-50%)", width:190, height:190,
                borderRadius:"50%", border:`1px solid ${SC.orange}33` }} />
            <motion.div
              animate={{ scale:[1,1.35,1], opacity:[0.1,0.25,0.1] }}
              transition={{ duration:3.2, repeat:Infinity, ease:"easeInOut", delay:0.45 }}
              style={{ position:"absolute", top:"50%", left:"50%",
                transform:"translate(-50%,-50%)", width:250, height:250,
                borderRadius:"50%", border:`1px solid ${SC.teal}22` }} />
            <motion.div
              animate={{ y:[0,-10,0] }}
              transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
              style={{ filter:`drop-shadow(0 10px 32px ${SC.orange}44)` }}>
              <SpriteIdle size={130} fps={8} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.25, duration:0.5, ease }}
            style={{ textAlign:"left" }}>
            <div style={{ ...mono(11,700), color:SC.orange, letterSpacing:".14em", textTransform:"uppercase", marginBottom:12 }}>
              {t("ch.empty.title")}
            </div>
            <div style={{ color:SC.text, font:'800 clamp(1.8rem, 3vw, 2.6rem)/1.02 "Manrope", sans-serif', marginBottom:12 }}>
              El salón de mensajeria ya puede abrir tu primer contacto.
            </div>
            <div style={{ ...sans(15,500), color:SC.muted, lineHeight:1.7, maxWidth:420, marginBottom:18 }}>
              {t("ch.empty.desc")} <span style={{ color:SC.orange, cursor:"pointer", borderBottom:`1px solid ${SC.orange}55` }} onClick={onExplore}>{t("ch.empty.link")}</span> {t("ch.empty.desc2")}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
              {["Canales limpios", "Aliados sugeridos", "Lectura rápida"].map((chip) => (
                <span key={chip} style={{ display:"inline-flex", alignItems:"center", padding:"7px 10px", borderRadius:999, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.03)", color:SC.muted, ...mono(10,700), letterSpacing:".08em", textTransform:"uppercase" }}>
                  {chip}
                </span>
              ))}
            </div>
            <motion.button
              whileHover={{ scale:1.03, y:-1, boxShadow:`0 10px 32px ${SC.orange}30` }}
              whileTap={{ scale:0.98 }}
              onClick={onExplore}
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 18px", borderRadius:14, background:`linear-gradient(135deg,${SC.orange},${SC.gold})`, border:"none", color:SC.bg, cursor:"pointer", ...sans(13,800) }}>
              <Swords size={14} /> {t("ch.empty.btn")}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMPONENTE PRINCIPAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHAT_CLASS_COPY = {
  GUERRERO: { title: "Coordina aliados,", span: "mantén el gremio en pie." },
  ARQUERO:  { title: "Abre canal,", span: "mantén el ritmo del equipo." },
  MAGO:     { title: "Lee el mapa,", span: "conecta sin ruido." },
  DEFAULT:  { title: "Coordina rutas y aliados,", span: "mantén el gremio vivo." },
};

export default function UserChat({ user: initialUser, profile }) {
  const { t } = useLang();
  const initialStorageUid = initialUser?.uid || auth.currentUser?.uid || profile?.uid || null;
  const readStoredUi = useCallback((uid = initialStorageUid) => readStoredChatUi(uid), [initialStorageUid]);
  const initialStoredUi = useMemo(() => readStoredUi(), [readStoredUi]);

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [currentUser,    setCurrentUser]    = useState(initialUser || null);
  const [view,           setView]           = useState(() => initialStoredUi.view || "chats");
  const [conversations,  setConversations]  = useState([]);
  const [activeConvId,   setActiveConvId]   = useState(() => initialStoredUi.activeConvId || null);
  const [messages,       setMessages]       = useState([]);
  const [olderMessages,  setOlderMessages]  = useState([]);
  const [hasMoreMsgs,    setHasMoreMsgs]    = useState(false);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [friends,        setFriends]        = useState([]);
  const [requests,       setRequests]       = useState([]);
  const [sentReqs,       setSentReqs]       = useState([]);
  const [searchQ,        setSearchQ]        = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [suggested,      setSuggested]      = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [classFilter,    setClassFilter]    = useState(() => initialStoredUi.classFilter || "ALL");
  const [msgInput,       setMsgInput]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 700);
  const [isNarrow,       setIsNarrow]       = useState(window.innerWidth < 1280);
  const [showSidebar,    setShowSidebar]    = useState(true);
  const [convSearch,     setConvSearch]     = useState(() => initialStoredUi.convSearch || "");
  const [contextMenu,    setContextMenu]    = useState(null);
  const [peerTyping,     setPeerTyping]     = useState(false);
  const [presences,      setPresences]      = useState({});
  const [pageVisible,    setPageVisible]    = useState(() => document.visibilityState === "visible");
  const [showScrollBtn,  setShowScrollBtn]  = useState(false);
  const [removeFriendTarget, setRemoveFriendTarget] = useState(null);

  // â”€â”€ Refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const messagesEndRef  = useRef(null);
  const msgContainerRef = useRef(null);
  const inputRef        = useRef(null);
  const unsubTypingRef  = useRef(null);
  const searchTimerRef  = useRef(null);
  const typingTimerRef  = useRef(null);
  const typingActiveRef = useRef(false);
  const peerTypingTimeoutRef = useRef(null);
  const lastTypingWriteRef = useRef(0);
  const presenceUnsubs     = useRef([]);
  const shouldScrollRef    = useRef(true);
  const lastFriendsLoadRef = useRef(0);          // ts del último GET /friends
  const lastConversationsLoadRef = useRef(0);
  const lastRequestsLoadRef = useRef(0);
  const suggestCacheRef    = useRef({ ts:0, data:[] }); // cache 5 min sugeridos
  const searchCacheRef     = useRef(new Map());   // q → { ts, data }
  const presenceFriendIds  = useRef("");          // string de UIDs para evitar re-sub innecesaria
  const lastStorageUidRef  = useRef(initialStorageUid);

  useEffect(() => {
    if (initialUser?.uid) {
      setCurrentUser(initialUser);
      return;
    }
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setCurrentUser(nextUser || null);
    });
    return () => unsub();
  }, [initialUser]);

  const viewerUid = currentUser?.uid || initialUser?.uid || profile?.uid || null;

  useEffect(() => {
    const payload = {
      view,
      classFilter,
      convSearch,
      activeConvId,
    };
    writeStoredChatUi(viewerUid, payload);
  }, [view, classFilter, convSearch, activeConvId, viewerUid]);

  const _toast    = useToast();
  const showToast = useCallback((msg, type = "info") => _toast.push(msg, type), [_toast]);
  const getToken  = useCallback(async () => {
    if (!currentUser) throw new Error("No autenticado");
    return currentUser.getIdToken();
  }, [currentUser]);
  const stopTypingSignal = useCallback(() => {
    typingActiveRef.current = false;
    lastTypingWriteRef.current = 0;
    clearTimeout(typingTimerRef.current);
  }, []);

  // â”€â”€ DERIVED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activeConv = useMemo(
    () => conversations.find(c => c.id === activeConvId) || null,
    [conversations, activeConvId]
  );
  const viewerProfile = useMemo(() => ({
    uid: viewerUid,
    username: profile?.username || currentUser?.username || currentUser?.displayName || "Héroe",
    photoURL: profile?.photoURL || currentUser?.photoURL || null,
    heroClass: String(profile?.heroClass || profile?.clase || currentUser?.heroClass || "DEFAULT").toUpperCase(),
    level: Number(profile?.level || currentUser?.level || 1),
    xp: Number(profile?.xp ?? profile?.experience ?? currentUser?.xp ?? 0),
    xpMax: Number(profile?.xpMax || profile?.xpNext || profile?.xpToNextLevel || ((Number(profile?.level || currentUser?.level || 1) ** 2) * 100)),
    streak: Number(profile?.streak ?? profile?.streakCount ?? currentUser?.streakCount ?? currentUser?.streak ?? 0),
  }), [currentUser?.displayName, currentUser?.heroClass, currentUser?.level, currentUser?.photoURL, currentUser?.streak, currentUser?.streakCount, currentUser?.uid, currentUser?.username, currentUser?.xp, profile?.clase, profile?.experience, profile?.heroClass, profile?.level, profile?.photoURL, profile?.streak, profile?.streakCount, profile?.uid, profile?.username, profile?.xp, profile?.xpMax, profile?.xpNext, profile?.xpToNextLevel, viewerUid]);
  const friendMap = useMemo(
    () => new Map(friends.map((friend) => [friend.uid, friend])),
    [friends]
  );
  const allMessages = useMemo(() => {
    const seen = new Set(messages.map(m => m.id));
    const older = olderMessages.filter(m => !seen.has(m.id));
    return [...older, ...messages];
  }, [messages, olderMessages]);

  const otherUid    = activeConv?.participants.find(p => p !== viewerUid);
  const otherReadAt = activeConv?.readAt?.[otherUid]?.toMillis?.() || Number(activeConv?.readAt?.[otherUid]) || 0;

  useEffect(() => {
    if (!viewerUid) return;
    if (lastStorageUidRef.current === viewerUid) return;
    const nextUi = readStoredUi(viewerUid);
    setView(nextUi.view || "chats");
    setActiveConvId(nextUi.activeConvId || null);
    setClassFilter(nextUi.classFilter || "ALL");
    setConvSearch(nextUi.convSearch || "");
    setSearchQ("");
    setSearchResults([]);
    setSuggested([]);
    setContextMenu(null);
    setPeerTyping(false);
    setMessages([]);
    setOlderMessages([]);
    setHasMoreMsgs(false);
    lastStorageUidRef.current = viewerUid;
  }, [readStoredUi, viewerUid]);

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const isNearBottom = useCallback(() => {
    if (!msgContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = msgContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 120;
  }, []);
  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
  }, []);
  const getOther = useCallback((conv) => {
    if (!viewerUid || !conv) return null;
    const uid = conv.participants.find(p => p !== viewerUid);
    const merged = {
      ...(conv.participantData?.[uid] || {}),
      ...(friendMap.get(uid) || {}),
    };
    return Object.keys(merged).length
      ? { uid, ...merged }
      : { uid, username:t("ch.chats.unknown"), photoURL:null, heroClass:"DEFAULT", level:1, streak:0 };
  }, [friendMap, t, viewerUid]);
  const upsertConversationLocal = useCallback((incoming) => {
    if (!incoming?.id) return;
    setConversations((prev) => {
      const next = [...prev];
      const index = next.findIndex((conv) => conv.id === incoming.id);
      if (index >= 0) {
        next[index] = {
          ...next[index],
          ...incoming,
          unread: { ...(next[index].unread || {}), ...(incoming.unread || {}) },
          readAt: { ...(next[index].readAt || {}), ...(incoming.readAt || {}) },
        };
      } else {
        next.push(incoming);
      }
      return next.sort((a, b) => Number(b.lastMessageAt || 0) - Number(a.lastMessageAt || 0));
    });
  }, []);

  const loadConversations = useCallback(async (force = false) => {
    if (!currentUser) return [];
    const now = Date.now();
    if (!force && now - lastConversationsLoadRef.current < CONVERSATION_REFRESH_MS) {
      return conversations;
    }
    lastConversationsLoadRef.current = now;
    const tok = await getToken();
    const data = await getConversations(tok);
    const nextConversations = data.conversations || [];
    setConversations(nextConversations);
    return nextConversations;
  }, [conversations, currentUser, getToken]);

  const loadRequests = useCallback(async (force = false) => {
    if (!currentUser) return [];
    const now = Date.now();
    if (!force && now - lastRequestsLoadRef.current < REQUESTS_REFRESH_MS) {
      return requests;
    }
    lastRequestsLoadRef.current = now;
    const tok = await getToken();
    const data = await getFriendRequests(tok);
    const nextRequests = data.requests || [];
    setRequests(nextRequests);
    return nextRequests;
  }, [currentUser, getToken, requests]);

  const loadLatestMessages = useCallback(async (convId, { silent = false } = {}) => {
    if (!convId || !currentUser) return null;
    if (!silent) {
      setLoadingMsgs(true);
      shouldScrollRef.current = true;
    }
    try {
      const tok = await getToken();
      const data = await getMessages(tok, convId);
      setMessages(data.messages || []);
      setOlderMessages([]);
      setHasMoreMsgs(Boolean(data.hasMore));
      return data;
    } finally {
      setLoadingMsgs(false);
    }
  }, [currentUser, getToken]);

  const openChatGameplayAction = useCallback((rawAction) => {
    const action = normalizeChatGameplayAction(rawAction);
    if (!action) return;
    try {
      window.sessionStorage.setItem(CHAT_DEEPLINK_KEY, JSON.stringify(action));
    } catch {}
    window.dispatchEvent(new CustomEvent("flexNavigate", { detail: { section: action.section } }));
    window.dispatchEvent(new CustomEvent("chatGameplayLink", { detail: action }));
  }, []);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // EFFECTS (100 % del v5 â€” sin cambios)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (!currentUser?.uid) return;
    const presenceRef = doc(db, "presence", currentUser.uid);
    let heartbeatId = null;
    let lastOnlineValue = null;

    const clearHeartbeat = () => {
      if (heartbeatId) {
        window.clearInterval(heartbeatId);
        heartbeatId = null;
      }
    };

    const writePresence = (online) => {
      if (lastOnlineValue === online && !online) return;
      lastOnlineValue = online;
      setDoc(
        presenceRef,
        { online, lastSeen:serverTimestamp(), uid:currentUser.uid },
        { merge:true }
      ).catch(() => {});
    };

    const startHeartbeat = () => {
      clearHeartbeat();
      if (document.visibilityState !== "visible") return;
      heartbeatId = window.setInterval(() => writePresence(true), PRESENCE_HEARTBEAT_MS);
    };

    const syncPresence = () => {
      const online = document.visibilityState === "visible";
      writePresence(online);
      startHeartbeat();
    };

    const handlePageHide = () => {
      clearHeartbeat();
      writePresence(false);
    };

    syncPresence();
    window.addEventListener("focus", syncPresence);
    const handleVisibility = () => {
      setPageVisible(document.visibilityState === "visible");
      syncPresence();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("focus", syncPresence);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      clearHeartbeat();
      writePresence(false);
    };
  }, [currentUser?.uid]);

  const filteredConvs = useMemo(() => {
    const term = convSearch.trim().toLowerCase();
    return [...conversations]
      .filter((c) => !term || getOther(c)?.username?.toLowerCase().includes(term))
      .sort((a, b) => {
        const aUnread = Number(a.unread?.[viewerUid] || 0);
        const bUnread = Number(b.unread?.[viewerUid] || 0);
        if ((bUnread > 0) !== (aUnread > 0)) return Number(bUnread > 0) - Number(aUnread > 0);

        const aOther = getOther(a);
        const bOther = getOther(b);
        const aOnline = Number(Boolean(aOther?.uid && presences[aOther.uid]));
        const bOnline = Number(Boolean(bOther?.uid && presences[bOther.uid]));
        if (bOnline !== aOnline) return bOnline - aOnline;

        return Number(b.lastMessageAt || 0) - Number(a.lastMessageAt || 0);
      });
  }, [convSearch, conversations, getOther, presences, viewerUid]);
  const suggestedFiltered = classFilter === "ALL" ? suggested : suggested.filter(u => u.heroClass === classFilter);
  const searchFiltered    = classFilter === "ALL" ? searchResults : searchResults.filter(u => u.heroClass === classFilter);
  const watchedPresenceIds = useMemo(() => {
    const next = [];
    const pushUid = (uid) => {
      if (!uid || next.includes(uid)) return;
      next.push(uid);
    };

    const activeOtherUid = activeConv?.participants?.find((uid) => uid !== viewerUid);
    pushUid(activeOtherUid);

    if (view === "chats") {
      filteredConvs.slice(0, MAX_PRESENCE_WATCH - next.length).forEach((conv) => {
        pushUid(getOther(conv)?.uid);
      });
    } else if (view === "buscar") {
      const source = searchQ.trim().length >= 2 ? searchFiltered : suggestedFiltered;
      source.slice(0, MAX_PRESENCE_WATCH - next.length).forEach((user) => pushUid(user?.uid));
    } else {
      friends.slice(0, MAX_PRESENCE_WATCH - next.length).forEach((friend) => pushUid(friend?.uid));
    }

    return next.slice(0, MAX_PRESENCE_WATCH);
  }, [activeConv?.participants, filteredConvs, friends, getOther, searchFiltered, searchQ, suggestedFiltered, view, viewerUid]);

  useEffect(() => {
    const newKey = watchedPresenceIds.slice().sort().join(",");
    if (newKey === presenceFriendIds.current && pageVisible && presenceUnsubs.current.length > 0) return;
    presenceFriendIds.current = newKey;

    presenceUnsubs.current.forEach((unsubscribe) => unsubscribe());
    presenceUnsubs.current = [];

    const watchedSet = new Set(watchedPresenceIds);
    setPresences((prev) => {
      const cleaned = {};
      for (const uid of Object.keys(prev)) {
        if (watchedSet.has(uid)) cleaned[uid] = prev[uid];
      }
      return cleaned;
    });

    if (!pageVisible || !watchedPresenceIds.length) return undefined;

    presenceUnsubs.current = watchedPresenceIds.map((uid) =>
      onSnapshot(doc(db, "presence", uid), (snap) => {
        const d = snap.data();
        const isOnline = d?.online === true &&
          (Date.now() - (d?.lastSeen?.toMillis?.() || 0)) < 300_000;
        setPresences((prev) => ({ ...prev, [uid]: isOnline }));
      })
    );
    return () => {
      presenceUnsubs.current.forEach((unsubscribe) => unsubscribe());
      presenceUnsubs.current = [];
    };
  }, [pageVisible, watchedPresenceIds]);

  useEffect(() => {
    setMessages([]); setOlderMessages([]); setHasMoreMsgs(false); setShowScrollBtn(false);
    if (!activeConvId || !currentUser) { setLoadingMsgs(false); return; }
    loadLatestMessages(activeConvId).catch(() => {});
    getToken()
      .then(tok => markConversationRead(tok, activeConvId))
      .then(() => {
        setConversations(prev => prev.map((conv) => (
          conv.id === activeConvId
            ? {
                ...conv,
                unread: { ...(conv.unread || {}), [currentUser.uid]: 0 },
                readAt: { ...(conv.readAt || {}), [currentUser.uid]: Date.now() },
              }
            : conv
        )));
      })
      .catch(() => {});
  }, [activeConvId, currentUser, getToken, loadConversations, loadLatestMessages]);

  useEffect(() => {
    if (!allMessages.length) return;
    if (shouldScrollRef.current) {
      setTimeout(() => scrollToBottom("auto"), 50);
      shouldScrollRef.current = false;
    } else if (isNearBottom()) {
      setTimeout(() => scrollToBottom("smooth"), 60);
    } else {
      setShowScrollBtn(true);
    }
  }, [allMessages, scrollToBottom, isNearBottom]);

  useEffect(() => {
    if (unsubTypingRef.current) { unsubTypingRef.current(); unsubTypingRef.current = null; }
    clearTimeout(peerTypingTimeoutRef.current);
    setPeerTyping(false);
    if (!activeConvId || !currentUser || !otherUid) return;
    const typingRef = doc(db, "conversations", activeConvId, "typing", otherUid);
    unsubTypingRef.current = onSnapshot(typingRef, snap => {
      clearTimeout(peerTypingTimeoutRef.current);
      if (!snap.exists()) { setPeerTyping(false); return; }
      const ms = snap.data()?.at?.toMillis?.() || 0;
      if (!ms) {
        setPeerTyping(false);
        return;
      }
      const remaining = Math.max(0, TYPING_VISIBLE_WINDOW_MS - (Date.now() - ms));
      setPeerTyping(remaining > 0);
      if (remaining > 0) {
        peerTypingTimeoutRef.current = window.setTimeout(() => {
          setPeerTyping(false);
        }, remaining + 80);
      }
    });
    return () => {
      if (unsubTypingRef.current) unsubTypingRef.current();
      clearTimeout(peerTypingTimeoutRef.current);
    };
  }, [activeConvId, otherUid, viewerUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFriendsAndSent = useCallback(async (force = false) => {
    if (!currentUser) return;
    const now = Date.now();
    if (!force && now - lastFriendsLoadRef.current < 120_000) return; // gate 2 min
    lastFriendsLoadRef.current = now;
    try {
      const tok = await getToken();
      const [fr, sr] = await Promise.all([getFriends(tok), getSentFriendRequests(tok)]);
      setFriends(fr.friends || []);
      setSentReqs(sr.requests || []);
    } catch {}
  }, [currentUser, getToken]);

  useEffect(() => {
    if (!currentUser) return;
    Promise.allSettled([
      loadConversations(true),
      loadRequests(true),
      loadFriendsAndSent(true),
    ]);
  }, [currentUser, loadConversations, loadRequests, loadFriendsAndSent]);

  useEffect(() => {
    const refreshFriends = () => {
      if (document.visibilityState === "visible") {
        loadFriendsAndSent();
        loadConversations();
        loadRequests();
        if (view === "chats" && activeConvId) loadLatestMessages(activeConvId, { silent: true }).catch(() => {});
      }
    };
    window.addEventListener("focus", refreshFriends);
    document.addEventListener("visibilitychange", refreshFriends);
    return () => {
      window.removeEventListener("focus", refreshFriends);
      document.removeEventListener("visibilitychange", refreshFriends);
    };
  }, [activeConvId, loadConversations, loadFriendsAndSent, loadLatestMessages, loadRequests, view]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadConversations().catch(() => {});
      loadRequests().catch(() => {});
      if (view === "chats" && activeConvId) {
        loadLatestMessages(activeConvId, { silent: true }).catch(() => {});
      }
    }, CONVERSATION_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [activeConvId, currentUser, loadConversations, loadLatestMessages, loadRequests, view]);

  useEffect(() => () => {
    clearTimeout(typingTimerRef.current);
    stopTypingSignal();
  }, [stopTypingSignal]);

  useEffect(() => {
    stopTypingSignal();
  }, [activeConvId, stopTypingSignal]);

  useEffect(() => {
    if (view !== "buscar" || searchQ.length >= 2) return;
    const c = suggestCacheRef.current;
    if (c.ts && Date.now() - c.ts < 5 * 60_000 && c.data.length) {
      setSuggested(c.data); // servir desde cache cliente
      return;
    }
    setSuggestLoading(true);
    getToken().then(t => getSuggestedUsers(t))
      .then(res => {
        const users = res.users || [];
        suggestCacheRef.current = { ts: Date.now(), data: users };
        setSuggested(users);
      })
      .catch(() => setSuggested([]))
      .finally(() => setSuggestLoading(false));
  }, [view, searchQ]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const key = searchQ.trim().toLowerCase();
    const hit = searchCacheRef.current.get(key);
    if (hit && Date.now() - hit.ts < 90_000) {
      setSearchResults(hit.data); // servir desde cache cliente
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const tok = await getToken();
        const data = await searchChatUsers(tok, searchQ);
        const users = data.users || [];
        searchCacheRef.current.set(key, { ts: Date.now(), data: users });
        setSearchResults(users);
      } catch { setSearchResults([]); }
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQ, getToken]);

  useEffect(() => {
    const h = () => {
      setIsMobile(window.innerWidth < 700);
      setIsNarrow(window.innerWidth < 1280);
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // HANDLERS (100 % del v5)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleScroll = useCallback(() => {
    if (!msgContainerRef.current) return;
    setShowScrollBtn(!isNearBottom());
  }, [isNearBottom]);

  const handleOpenConv = useCallback(async (friendUid) => {
    try {
      setLoading(true);
      const tok  = await getToken();
      const data = await openConversation(tok, friendUid);
      const conv = data.conversation;
      upsertConversationLocal({ ...conv, readAt:conv.readAt || {} });
      setActiveConvId(conv.id);
      setView("chats");
      if (isMobile) setShowSidebar(false);
      await loadLatestMessages(conv.id);
    } catch (err) {
      showToast(err.message || "Error al abrir conversación", "error");
    } finally { setLoading(false); }
  }, [getToken, isMobile, loadLatestMessages, showToast, upsertConversationLocal]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreMsgs || !activeConvId) return;
    const oldest = allMessages[0];
    if (!oldest) return;
    setLoadingMore(true);
    const container = msgContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    try {
      const tok  = await getToken();
      const data = await getMessages(tok, activeConvId, oldest.timestamp);
      if (data.messages?.length > 0) {
        setOlderMessages(prev => {
          const seen = new Set(prev.map(m => m.id));
          return [...data.messages.filter(m => !seen.has(m.id)), ...prev];
        });
        setHasMoreMsgs(data.hasMore);
        requestAnimationFrame(() => {
          if (container) container.scrollTop += container.scrollHeight - prevScrollHeight;
        });
      } else { setHasMoreMsgs(false); }
    } catch {} finally { setLoadingMore(false); }
  }, [loadingMore, hasMoreMsgs, activeConvId, allMessages, getToken]);

  const handleInputChange = useCallback((val) => {
    const nextValue = val.slice(0, 500);
    setMsgInput(nextValue);
    if (!activeConvId || !currentUser) return;
    if (!nextValue.trim()) {
      stopTypingSignal();
      return;
    }
    if (document.visibilityState !== "visible") return;
    const ref = doc(db, "conversations", activeConvId, "typing", currentUser.uid);
    const now = Date.now();
    if (
      nextValue.trim().length >= 2 &&
      (!typingActiveRef.current || now - lastTypingWriteRef.current > TYPING_WRITE_THROTTLE_MS)
    ) {
      typingActiveRef.current = true;
      lastTypingWriteRef.current = now;
      setDoc(ref, { at:serverTimestamp() }, { merge:true });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      stopTypingSignal();
    }, TYPING_IDLE_TIMEOUT_MS);
  }, [activeConvId, currentUser, stopTypingSignal]);

  const handleSend = useCallback(async () => {
    if (!msgInput.trim() || !activeConvId || sending) return;
    const text = msgInput.trim();
    const profErr = validateClean(text, "mensaje");
    if (profErr) { showToast(profErr, "error"); return; }
    if (activeConvId && currentUser) {
      stopTypingSignal();
    }
    setMsgInput(""); setSending(true); shouldScrollRef.current = true;
    try {
      const tok = await getToken();
      const response = await sendMessage(tok, activeConvId, text);
      const sentMessage = response?.message || {
        id: `temp-${Date.now()}`,
        fromUid: currentUser.uid,
        text,
        timestamp: Date.now(),
        deleted: false,
        cta: null,
      };
      setMessages((prev) => [...prev, sentMessage]);
      upsertConversationLocal({
        id: activeConvId,
        lastMessage: sentMessage,
        lastMessageAt: sentMessage.timestamp,
        messageCount: Number(activeConv?.messageCount || 0) + 1,
        messageCountTotal: Number((activeConv?.messageCountTotal ?? activeConv?.messageCount) || 0) + 1,
        visibleMessageCount: Number((activeConv?.visibleMessageCount ?? activeConv?.messageCount) || 0) + 1,
        unread: { [currentUser.uid]: 0 },
        readAt: { [currentUser.uid]: sentMessage.timestamp },
      });
    } catch (err) {
      showToast(err.message || "Error al enviar", "error");
      setMsgInput(text); shouldScrollRef.current = false;
    } finally { setSending(false); inputRef.current?.focus(); }
  }, [msgInput, activeConvId, sending, getToken, showToast, currentUser, stopTypingSignal, upsertConversationLocal, activeConv?.messageCount]);

  const handleDeleteMsg = useCallback(async (msgId) => {
    if (!activeConvId) return;
    try {
      const tok = await getToken();
      const response = await deleteMessage(tok, activeConvId, msgId);
      setContextMenu(null);
      const markDeleted = (entry) => (
        entry.id === msgId
          ? { ...entry, deleted: true, text: "[Mensaje eliminado]" }
          : entry
      );
      setMessages((prev) => prev.map(markDeleted));
      setOlderMessages((prev) => prev.map(markDeleted));
      if (response?.conversation?.id) {
        upsertConversationLocal(response.conversation);
      }
    } catch (err) { showToast(err.message || "Error al borrar", "error"); }
  }, [activeConvId, getToken, showToast, upsertConversationLocal]);

  const handleAddFriend = useCallback(async (toUid) => {
    try {
      const tok = await getToken();
      await sendFriendRequest(tok, toUid);
      showToast(t("ch.toast.sent"), "success");
      setSuggested(prev => prev.map(u => u.uid === toUid ? { ...u, alreadySent:true } : u));
      setSentReqs(prev => [...prev, { toUid }]);
      suggestCacheRef.current = { ts: 0, data: [] }; // invalidar cache sugeridos
      lastRequestsLoadRef.current = 0;
    } catch (err) { showToast(err.message || "Error al enviar solicitud", "error"); }
  }, [getToken, showToast]);

  const handleRespond = useCallback(async (reqId, action) => {
    try {
      const tok = await getToken();
      await respondFriendRequest(tok, reqId, action);
      showToast(action === "accept" ? t("ch.toast.new_friend") : t("ch.toast.rejected"),
        action === "accept" ? "success" : "info");
      if (action === "accept") {
        suggestCacheRef.current = { ts: 0, data: [] };
        lastRequestsLoadRef.current = 0;
        await Promise.allSettled([
          loadFriendsAndSent(true),
          loadRequests(true),
        ]);
      } else {
        setRequests((prev) => prev.filter((req) => req.id !== reqId));
      }
    } catch (err) { showToast(err.message || "Error", "error"); }
  }, [getToken, showToast, loadFriendsAndSent, loadRequests]);

  const handleConfirmRemoveFriend = useCallback(async () => {
    if (!removeFriendTarget?.uid) return;
    try {
      const tok = await getToken();
      const response = await removeFriend(tok, removeFriendTarget.uid);
      showToast(t("ch.toast.removed"), "info");
      setFriends(prev => prev.filter(f => f.uid !== removeFriendTarget.uid));
      setSentReqs(prev => prev.filter((req) => req.toUid !== removeFriendTarget.uid));
      setRequests(prev => prev.filter((req) => req.fromUid !== removeFriendTarget.uid && req.toUid !== removeFriendTarget.uid));
      suggestCacheRef.current = { ts: 0, data: [] };
      const removedConversationId = response?.conversationId || null;
      setConversations((prev) => prev.filter((conv) => {
        if (removedConversationId) return conv.id !== removedConversationId;
        return !conv.participants?.includes(removeFriendTarget.uid);
      }));
      if (
        activeConvId
        && (
          removedConversationId
            ? activeConvId === removedConversationId
            : activeConv?.participants?.includes(removeFriendTarget.uid)
        )
      ) {
        setActiveConvId(null);
        setMessages([]);
        setOlderMessages([]);
        setHasMoreMsgs(false);
      }
      setRemoveFriendTarget(null);
    } catch (err) { showToast(err.message || "Error", "error"); }
  }, [getToken, removeFriendTarget, showToast, t, activeConvId, activeConv?.participants]);

  // â”€â”€ Derived display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalUnread       = conversations.reduce((a, c) => a + (c.unread?.[viewerUid] || 0), 0);
  const pendingReqs       = requests.length;
  const onlineCount       = friends.filter(f => presences[f.uid]).length;

  const TABS = [
    { id:"chats",       label:t("ch.tab.chats"),       icon:<MessageSquare size={13}/>, badge:totalUnread > 0 ? totalUnread : null, asset: CHAT_ASSETS.tabs.chats },
    { id:"amigos",      label:t("ch.tab.amigos"),      icon:<Users size={13}/>,         badge:null, asset: CHAT_ASSETS.tabs.amigos },
    { id:"solicitudes", label:t("ch.tab.solicitudes"), icon:<Bell size={13}/>,          badge:pendingReqs > 0 ? pendingReqs : null, asset: CHAT_ASSETS.tabs.solicitudes },
    { id:"buscar",      label:t("ch.tab.buscar"),      icon:<Search size={13}/>,        badge:null, asset: CHAT_ASSETS.tabs.buscar },
  ];

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER â€” GOTHIC JRPG v2 (pixel-art, matches reference image)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const statusCls   = (o) => o ? "online" : "offline";
  const statusTxt   = (o) => o ? "En línea" : "Desconectado";
  const statusDot   = (f) => presences[f.uid] ? "online" : "offline";

  const FmtDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts), diff = Date.now() - d;
    if (diff < 60000)   return "ahora";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
    return d.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"});
  };

  function getZoneForClass(heroClass) {
    return heroClass === "GUERRERO"
      ? "Fuerza y calistenia"
      : heroClass === "ARQUERO"
        ? "Cardio y movilidad"
        : heroClass === "MAGO"
          ? "Mente y flexibilidad"
          : "Ruta mixta";
  }

  function getRecentStamp(value) {
    if (!value) return 0;
    if (typeof value === "number") return value;
    if (typeof value?.toMillis === "function") return value.toMillis();
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const activeOther    = activeConv ? getOther(activeConv) : null;
  const activeOtherUid = activeConv?.participants?.find(p => p !== viewerUid);
  const activeOtherOnline = !!presences[activeOtherUid];
  const viewerHeroClass = String(
    viewerProfile?.heroClass
    || activeOther?.heroClass
    || "DEFAULT"
  ).toUpperCase();
  const userClassKey = USER_CLASS_THEME[viewerHeroClass] ? viewerHeroClass : "DEFAULT";
  const chatCopy = CHAT_CLASS_COPY[userClassKey] || CHAT_CLASS_COPY.DEFAULT;
  const chatAccent = CLASS_COLOR[userClassKey] || SC.orange;
  const cls = USER_CLASS_THEME[userClassKey] || USER_CLASS_THEME.DEFAULT;
  const userCrest = CLASS_CREST[userClassKey] || CLASS_CREST.DEFAULT;
  const sceneAsset = CHAT_SCENE[userClassKey] || CHAT_SCENE.DEFAULT;
  const userLevel = Number(viewerProfile?.level || 1);
  const userXp = Number(viewerProfile?.xp ?? 0);
  const userXpMax = Number(viewerProfile?.xpMax || (userLevel * userLevel * 100));
  const xpPct = Math.max(6, Math.min(100, Math.round((userXp / Math.max(1, userXpMax)) * 100)));
  const activeLastMessageText = activeConv?.lastMessage?.text || activeConv?.lastMessage || "Sin intercambio reciente guardado.";
  const activeLastActivity = Number(activeConv?.lastMessageAt || 0);
  const activeStreak = Number(activeOther?.streak ?? activeOther?.streakCount ?? activeOther?.racha ?? 0);
  const activeVisibleMessageCount = Number(activeConv?.visibleMessageCount ?? activeConv?.messageCount ?? 0);
  const activeHistoricalMessageCount = Number(activeConv?.messageCountTotal ?? activeConv?.messageCount ?? 0);
  const activeZone = activeOther?.favoriteZone || activeOther?.preferredZone || getZoneForClass(activeOther?.heroClass);
  const latestGameplayAction = useMemo(() => {
    const lastActionableMessage = [...allMessages].reverse().find((msg) => normalizeChatGameplayAction(msg));
    return normalizeChatGameplayAction(lastActionableMessage || activeConv?.lastMessage);
  }, [activeConv?.lastMessage, allMessages]);
  const fallbackGameplayActions = useMemo(() => ([
    latestGameplayAction,
    { section: "misiones", ctaLabel: "Abrir misiones" },
    { section: "rutinas", ctaLabel: "Ver rutinas" },
    { section: "personaje", ctaLabel: "Ver personaje" },
  ].filter((action, index, array) => action && array.findIndex((candidate) => candidate?.section === action.section && candidate?.ctaLabel === action.ctaLabel) === index)), [latestGameplayAction]);
  const activeRelation = activeVisibleMessageCount >= 20
    ? "Historial muy activo"
    : activeVisibleMessageCount >= 6
      ? "Canal con recorrido"
      : activeConv?.lastMessageAt
        ? "Contacto reciente"
        : "Canal nuevo";
  const requestOpen = view === "solicitudes";
  const discoverOpen = view === "buscar";
  const rosterTitle = view === "amigos"
    ? "Compañeros listos"
    : view === "solicitudes"
      ? "Solicitudes del gremio"
      : view === "buscar"
        ? "Explorar aliados"
        : "Canales recientes";
  const rosterSub = view === "amigos"
    ? `${friends.length} aliados guardados`
    : view === "solicitudes"
      ? `${pendingReqs} pendientes por revisar`
      : view === "buscar"
        ? `${(searchQ.length >= 2 ? searchFiltered.length : suggestedFiltered.length) || 0} perfiles visibles`
        : `${filteredConvs.length} conversaciones activas`;
  const heroSignals = [
    { label: "Alianzas en línea", value: `${onlineCount}`, color: SC.green, asset: "/ui/header/notifications/notif-message.png" },
    { label: "Pendientes", value: `${pendingReqs}`, color: SC.gold, asset: "/missions/journal/journal-seal-today.png" },
    { label: "Chats vivos", value: `${filteredConvs.length}`, color: chatAccent, asset: "/ui/header/section-chat.png" },
  ];

  const currentAccent = CLASS_COLOR[String(viewerProfile?.heroClass || userClassKey || "DEFAULT").toUpperCase()] || chatAccent;
  const unreadConversationCount = conversations.filter((c) => Number(c.unread?.[viewerUid] || 0) > 0).length;
  const discoverPool = searchQ.length >= 2 ? searchFiltered : suggestedFiltered;
  const getConversationSignal = useCallback((conv) => {
    const unread = Number(conv?.unread?.[viewerUid] || 0);
    const other = getOther(conv);
    const otherUid = conv?.participants?.find((p) => p !== viewerUid);
    const isOnline = Boolean(otherUid && presences[otherUid]);
    const lastTs = Number(conv?.updatedAt || conv?.lastMessageAt || 0);
    const lastFromUid = conv?.lastMessage?.fromUid || conv?.lastMessageFromUid || null;
    const wasToday = lastTs > Date.now() - 86400000;

    if (unread > 0 && lastFromUid && lastFromUid !== viewerUid) {
      return { label: wasToday ? "Te respondio hoy" : "Mensaje pendiente", color: SC.gold };
    }
    if (lastFromUid === viewerUid && unread === 0 && lastTs > 0) {
      return { label: "Pendiente tuyo", color: currentAccent };
    }
    if (isOnline) {
      return { label: "Activo hoy", color: SC.green };
    }
    if (lastTs > Date.now() - 172800000) {
      return { label: "Movimiento reciente", color: SC.blue };
    }
    return { label: "Canal silencioso", color: SC.muted };
  }, [currentAccent, getOther, presences, viewerUid]);
  const getRecruitTags = useCallback((u, alreadySentFlag, isFriendFlag) => {
    if (Array.isArray(u?.sharedSignals) && u.sharedSignals.length) {
      return u.sharedSignals.slice(0, 3).map((signal) => {
        const tone = String(signal?.tone || "").toLowerCase();
        const color =
          tone === "class" ? (CLASS_COLOR[u?.heroClass] || currentAccent)
          : tone === "zone" ? SC.blue
          : tone === "streak" ? SC.gold
          : tone === "activity" ? SC.green
          : tone === "achievement" ? SC.orange
          : currentAccent;
        return { label: signal?.label || "Sinergia útil", color };
      });
    }
    const tags = [];
    if (u?.heroClass && u.heroClass === userClassKey) {
      tags.push({ label:"Afinidad de clase", color:CLASS_COLOR[u.heroClass] || currentAccent });
    }
    const lastSeen = getRecentStamp(u?.lastSeenAt || u?.lastActiveAt || u?.updatedAt);
    if (lastSeen > Date.now() - 86400000) {
      tags.push({ label:"Activo hoy", color:SC.green });
    }
    const createdAt = getRecentStamp(u?.createdAt || u?.joinedAt);
    if (createdAt && createdAt > Date.now() - 604800000) {
      tags.push({ label:"Nuevo en el gremio", color:SC.blue });
    }
    if (isFriendFlag) {
      tags.push({ label:"Compañero frecuente", color:SC.gold });
    } else if (alreadySentFlag) {
      tags.push({ label:"Solicitud enviada", color:SC.gold });
    }
    if (!tags.length) {
      tags.push({ label:getZoneForClass(u?.heroClass), color:CLASS_COLOR[u?.heroClass] || SC.muted });
    }
    return tags.slice(0, 3);
  }, [currentAccent, userClassKey]);
  const getRecruitInsight = useCallback((u, isFriendFlag) => {
    const zone = u?.favoriteZone || u?.preferredZone || getZoneForClass(u?.heroClass);
    if (u?.recommendationReason) {
      return u.recommendationReason;
    }
    if (isFriendFlag) {
      return `Ya comparte canal contigo. Su zona dominante va por ${zone.toLowerCase()}.`;
    }
    if (u?.heroClass === userClassKey) {
      return `Buena sinergia para rutas de ${zone.toLowerCase()} y lectura de ritmo similar.`;
    }
    return `Puede sumar otra lectura del mapa con foco en ${zone.toLowerCase()}.`;
  }, [userClassKey]);
  const getRecruitRankSrc = useCallback((u, alreadySentFlag, isFriendFlag) => {
    let tier = 1;
    if (u?.heroClass && u.heroClass === userClassKey) tier += 1;
    if (alreadySentFlag) tier = Math.max(tier, 2);
    if (isFriendFlag) tier = Math.max(tier, 3);
    const recentStamp = getRecentStamp(u?.lastSeenAt || u?.lastActiveAt || u?.updatedAt);
    if (recentStamp > Date.now() - 86400000) tier = Math.min(4, tier + 1);
    return CHAT_ASSETS.socialRanks[Math.min(4, Math.max(1, tier))];
  }, [userClassKey]);
  const heroTodo = [
    pendingReqs > 0 ? { label:`Responder ${Math.min(pendingReqs, 2)} solicitud${pendingReqs > 1 ? "es" : ""}`, color:SC.gold } : null,
    unreadConversationCount > 0 ? { label:`Retomar ${Math.min(unreadConversationCount, 1)} conversación`, color:currentAccent } : null,
    discoverPool.length > 0 ? { label:"Abrir 1 nuevo aliado", color:SC.green } : null,
  ].filter(Boolean);

  const shellCard = {
    position:"relative",
    overflow:"hidden",
    borderRadius:22,
    border:`1px solid ${chatAccent}4a`,
    background:`linear-gradient(180deg, ${cls.bg}88 0%, rgba(14,10,26,.97) 18%, rgba(9,7,18,.99) 100%)`,
    boxShadow:`0 20px 60px rgba(0,0,0,.34), 0 0 0 1px ${chatAccent}12, 0 0 32px ${chatAccent}14, inset 0 1px 0 ${chatAccent}14`,
  };
  const softCard = {
    borderRadius:18,
    border:`1px solid ${chatAccent}30`,
    background:`linear-gradient(180deg, ${cls.soft} 0%, rgba(255,255,255,.018) 100%)`,
    boxShadow:`inset 0 1px 0 ${chatAccent}1a, 0 10px 24px ${chatAccent}10`,
  };
  const chipStyle = {
    display:"inline-flex",
    alignItems:"center",
    gap:8,
    padding:"8px 12px",
    borderRadius:999,
    border:`1px solid ${chatAccent}36`,
    background:`linear-gradient(180deg, ${cls.soft} 0%, rgba(255,255,255,.018) 100%)`,
    color:`${chatAccent}dd`,
    ...mono(11,700),
    letterSpacing:".08em",
    textTransform:"uppercase",
  };
  const railButton = (active, color = chatAccent) => ({
    display:"inline-flex",
    alignItems:"center",
    gap:8,
    padding:"10px 14px",
    borderRadius:999,
    cursor:"pointer",
    border:`1px solid ${active ? `${color}66` : `${chatAccent}30`}`,
    background: active ? `linear-gradient(180deg, ${color}24, ${cls.soft})` : `linear-gradient(180deg, ${cls.soft}, rgba(255,255,255,.018))`,
    color: active ? color : SC.muted,
    boxShadow: active ? `0 10px 22px ${color}18, inset 0 1px 0 ${color}18` : `inset 0 1px 0 ${chatAccent}12`,
    ...sans(12,700),
  });

  if (!currentUser) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      height:"calc(100vh - 120px)",background:"#07060c"}}>
      <div className="fvch-spinner"/>
    </div>
  );

  return (
    <>
      <style>{CHAT_CSS}</style>

      {/* BG */}
      <div className="fvch-bg-layer"/>
      <div className="fvch-vignette"/>
      <div className="fvch-scanlines"/>

      {/* Embers */}
      <div className="fvch-embers" aria-hidden="true">
        {Array.from({length:14},(_,i)=>(
          <div key={i} className="fvch-ember" style={{
            left:`${(i*7+3)%100}%`,
            animationDuration:`${6+(i%5)*1.6}s`,
            animationDelay:`${(i*.6)%10}s`,
          }}/>
        ))}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div style={{position:"fixed",inset:0,zIndex:500}}
              onClick={()=>setContextMenu(null)}/>
            <motion.div className="fvch-ctx-menu"
              initial={{opacity:0,scale:.88,y:-8}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:.88,y:-8}} transition={{duration:.14}}
              style={{position:"fixed",left:contextMenu.x,top:contextMenu.y,zIndex:501}}>
              <button onClick={()=>handleDeleteMsg(contextMenu.msgId)}
                className="fvch-ctx-item">
                <Trash2 size={13}/> {t("ch.msg.delete")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removeFriendTarget && (
          <>
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              onClick={() => setRemoveFriendTarget(null)}
              style={{ position:"fixed", inset:0, zIndex:520, background:"rgba(5,4,10,.72)", backdropFilter:"blur(10px)" }}
            />
            <motion.div
              initial={{ opacity:0, y:18, scale:.96 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:12, scale:.96 }}
              transition={{ duration:.18 }}
              style={{ position:"fixed", inset:0, zIndex:521, display:"grid", placeItems:"center", padding:18 }}>
              <div style={{ width:"min(100%, 460px)", borderRadius:22, border:`1px solid ${SC.red}33`, background:"linear-gradient(180deg, rgba(16,11,24,.96), rgba(10,8,18,.98))", boxShadow:"0 30px 70px rgba(0,0,0,.45)", padding:22 }}>
                <div style={{ color:SC.red, ...mono(11,700), letterSpacing:".12em", textTransform:"uppercase", marginBottom:10, textShadow:`0 0 12px ${SC.red}cc, 0 0 24px ${SC.red}44` }}>
                  Confirmar salida
                </div>
                <div style={{ color:SC.text, font:'800 26px/1.06 \"Manrope\", sans-serif', marginBottom:10, textShadow:`0 0 22px ${SC.red}77, 0 0 44px ${SC.red}2a` }}>
                  Quitar a {removeFriendTarget.username || "este aliado"} del gremio
                </div>
                <div style={{ color:SC.muted, ...sans(14,500), lineHeight:1.65, marginBottom:18 }}>
                  Esta acción cierra el vínculo actual del chat y tendrás que enviar una nueva solicitud si quieres retomarlo después.
                </div>
                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button type="button" onClick={() => setRemoveFriendTarget(null)} style={railButton(false, SC.muted)}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleConfirmRemoveFriend} style={railButton(true, SC.red)}>
                    <UserX size={14} /> Quitar aliado
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fvch-root" style={{ minHeight:"100%", fontFamily:"'Manrope', sans-serif", "--chat-accent": chatAccent, "--chat-secondary": cls.secondary, "--chat-soft": cls.soft }}>
        <div className="fvch-wrapper" style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:1480, minHeight:"auto", padding:isMobile ? 12 : 18 }}>

          <section style={{
            ...shellCard,
            display:"grid",
            gridTemplateColumns:isMobile ? "1fr" : isNarrow ? "minmax(0,1fr) minmax(240px,.65fr)" : "minmax(0, 1.2fr) minmax(320px, .8fr)",
            gap:isNarrow ? 14 : 18,
            padding:isMobile ? 16 : isNarrow ? 18 : 22,
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0, justifyContent:"center" }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                <span style={{ ...chipStyle, color:chatAccent, borderColor:`${chatAccent}44` }}>
                  <img src="/ui/header/section-chat.png" alt="" style={{ width:18, height:18, objectFit:"contain" }} />
                  canal social
                </span>
                <span style={{ ...chipStyle }}>
                  {activeConv ? "Canal activo" : "Sala del gremio"}
                </span>
                <span style={{ ...chipStyle, color:SC.gold, borderColor:"rgba(243,201,105,.22)" }}>
                  {onlineCount} en línea
                </span>
              </div>

              <div>
                <div style={{ color:chatAccent, font:'800 11px/1 "JetBrains Mono", monospace', letterSpacing:".14em", textTransform:"uppercase", marginBottom:12, textShadow:`0 0 12px ${chatAccent}99` }}>
                  comunicación de campaña
                </div>
                <h1 style={{ margin:0, color:"#fff9ef", font:'900 clamp(36px,5.2vw,80px)/.92 "Manrope", sans-serif', maxWidth:"14ch" }}>
                  {chatCopy.title} <span style={{ color:chatAccent, textShadow:`0 0 34px ${chatAccent}77` }}>{chatCopy.span}</span>
                </h1>
                <p style={{ margin:"16px 0 0", color:"#cdbfe0", font:'500 clamp(14px,1.2vw,18px)/1.7 "Manrope", sans-serif', maxWidth:720 }}>
                  Este chat ya no vive como una ventana suelta: ahora se siente como una sala social del mapa, con lecturas claras de actividad, aliados en línea y acceso limpio a cada conversación.
                </p>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap:12 }}>
                {heroSignals.map((item) => (
                  <div key={item.label} style={{ ...softCard, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 86% 18%, ${item.color}16, transparent 32%)`, pointerEvents:"none" }} />
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div>
                        <div style={{ color:SC.deepMuted || SC.muted, ...mono(10,700), letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>{item.label}</div>
                        <div style={{ color:item.color, textShadow:`0 0 22px ${item.color}cc, 0 0 44px ${item.color}55, 0 0 70px ${item.color}22`, font:'900 28px/1 "Manrope", sans-serif' }}>{item.value}</div>
                      </div>
                      <div style={{ width:44, height:44, borderRadius:14, display:"grid", placeItems:"center", border:`1px solid ${item.color}44`, background:`linear-gradient(180deg, ${item.color}1a, rgba(255,255,255,.02))`, boxShadow:`0 8px 18px ${item.color}14` }}>
                        <img src={item.asset} alt="" style={{ width:22, height:22, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {heroTodo.length > 0 && (
                <div style={{ ...softCard, padding:"12px 14px", display:"flex", flexWrap:"wrap", gap:8 }}>
                  <span style={{ color:chatAccent, ...mono(10,700), letterSpacing:".12em", textTransform:"uppercase" }}>
                    Qué hacer aquí hoy
                  </span>
                  {heroTodo.map((item) => (
                    <span
                      key={item.label}
                      style={{
                        display:"inline-flex",
                        alignItems:"center",
                        padding:"6px 10px",
                        borderRadius:999,
                        border:`1px solid ${item.color}33`,
                        background:`${item.color}12`,
                        color:item.color,
                        ...mono(10,700),
                        letterSpacing:".08em",
                        textTransform:"uppercase",
                      }}>
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              position:"relative",
              minHeight:isMobile ? 260 : 360,
              borderRadius:22,
              overflow:"hidden",
              border:`1px solid ${chatAccent}4a`,
              background:`linear-gradient(180deg, ${cls.bg}88, rgba(9,7,18,.96))`,
              boxShadow:`0 0 0 1px ${chatAccent}12, 0 24px 44px rgba(0,0,0,.28), 0 0 30px ${chatAccent}16`,
            }}>
              <img src={sceneAsset} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.34, filter:"brightness(.8) saturate(1.02)" }} onError={(e)=>{e.currentTarget.src="/ui/scene-bg.png";}} />
              <img src={CHAT_ASSETS.heroOverlay} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.28, pointerEvents:"none" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(180deg, rgba(8,6,16,.16), rgba(8,6,16,.9)), radial-gradient(circle at 78% 20%, ${chatAccent}2e, transparent 26%), radial-gradient(circle at 18% 78%, ${cls.secondary}22, transparent 28%)` }} />
              <div style={{ position:"relative", zIndex:1, height:"100%", padding:18, display:"grid", gridTemplateRows:"auto 1fr auto", gap:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"flex-start" }}>
                  <div style={{ ...softCard, padding:14, maxWidth:300, backdropFilter:"blur(10px)", background:`linear-gradient(180deg, ${cls.soft}, rgba(9,7,18,.56))` }}>
                    <div style={{ color:chatAccent, ...mono(11,700), letterSpacing:".12em", textTransform:"uppercase", marginBottom:8, textShadow:`0 0 12px ${chatAccent}cc, 0 0 24px ${chatAccent}44` }}>
                      presencia activa
                    </div>
                    <div style={{ color:SC.text, font:'800 26px/1.04 "Manrope", sans-serif', marginBottom:8, textShadow:`0 0 24px ${chatAccent}99, 0 0 48px ${chatAccent}33` }}>
                      {activeOther ? activeOther.username : "Buzón del gremio"}
                    </div>
                    <div style={{ color:SC.muted, font:'500 14px/1.55 "Manrope", sans-serif' }}>
                      {activeOther
                        ? (activeOtherOnline ? "Conectado ahora y listo para coordinar." : "Canal abierto para retomar sin perder contexto.")
                        : "Explora aliados, acepta solicitudes y abre una conversación sin perder el estilo del mapa."}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <div style={{ width:58, height:58, borderRadius:18, background:`linear-gradient(180deg, ${cls.soft}, rgba(9,7,18,.66))`, border:`1px solid ${chatAccent}55`, boxShadow:`0 10px 24px ${chatAccent}14`, display:"grid", placeItems:"center" }}>
                      <img src={userCrest} alt="" style={{ width:34, height:34, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
                    </div>
                    <div style={{ width:58, height:58, borderRadius:18, background:`linear-gradient(180deg, ${cls.soft}, rgba(9,7,18,.66))`, border:`1px solid ${chatAccent}55`, boxShadow:`0 10px 24px ${chatAccent}14`, display:"grid", placeItems:"center" }}>
                      <img src="/ui/header/section-chat.png" alt="" style={{ width:28, height:28, objectFit:"contain" }} />
                    </div>
                  </div>
                </div>
                <div />
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:14, alignItems:"end" }}>
                  <div style={{ ...softCard, padding:14, backdropFilter:"blur(10px)", background:`linear-gradient(180deg, ${cls.soft}, rgba(9,7,18,.58))` }}>
                    <div style={{ color:SC.deepMuted || SC.muted, ...mono(10,700), letterSpacing:".12em", textTransform:"uppercase", marginBottom:8 }}>
                      Hoy conviene revisar
                    </div>
                    <div style={{ color:SC.text, font:'800 24px/1.08 "Manrope", sans-serif', marginBottom:6, textShadow:`0 0 22px ${chatAccent}88, 0 0 44px ${chatAccent}2a` }}>
                      {requestOpen ? "Solicitudes pendientes" : discoverOpen ? "Explorar aliados" : activeConv ? "Canal en curso" : "Abrir una conversación"}
                    </div>
                    <div style={{ color:SC.muted, font:'500 14px/1.55 "Manrope", sans-serif' }}>
                      {requestOpen
                        ? "Acepta, rechaza o limpia entradas del gremio sin perder la vista principal."
                        : discoverOpen
                          ? "Busca perfiles por clase y abre un canal sin salir de la sala."
                          : activeConv
                            ? "Mantén la conversación clara, responde rápido y revisa si tu aliado sigue en línea."
                            : "Empieza por un aliado sugerido o abre tu lista de amigos para activar el canal."}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (requestOpen) setView("solicitudes");
                      else if (discoverOpen || !activeConv) setView("buscar");
                      else setShowSidebar((v) => !v);
                    }}
                    style={{
                      border:`1px solid ${chatAccent}66`,
                      background:`linear-gradient(135deg, ${chatAccent}2c, ${cls.soft})`,
                      color:SC.text,
                      borderRadius:18,
                      padding:"12px 16px",
                      boxShadow:`0 14px 28px ${chatAccent}1c`,
                      cursor:"pointer",
                      ...sans(13,700),
                    }}>
                    {requestOpen ? "Ver solicitudes" : discoverOpen || !activeConv ? "Explorar gremio" : isMobile ? (showSidebar ? "Ocultar rail" : "Mostrar rail") : "Sala activa"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section style={{
            display:"grid",
            gridTemplateColumns:isMobile ? "1fr" : isNarrow ? "240px minmax(0, 1fr)" : "280px minmax(0, 1fr) 300px",
            gap:isNarrow ? 12 : 16,
            alignItems:"start",
            minHeight:isMobile ? "auto" : "calc(100vh - 280px)",
          }}>
            {(!isMobile || showSidebar) && (
              <div style={{ display:"contents" }}>
              {isMobile && (
                <motion.div
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  exit={{ opacity:0 }}
                  onClick={() => setShowSidebar(false)}
                  style={{ position:"fixed", inset:0, zIndex:140, background:"rgba(4,4,10,.68)", backdropFilter:"blur(8px)" }}
                />
              )}
              <aside style={{
                ...shellCard,
                padding:14,
                display:"flex",
                flexDirection:"column",
                minHeight:0,
                position:isMobile ? "fixed" : "relative",
                inset:isMobile ? "92px auto 14px 14px" : "auto",
                width:isMobile ? "min(88vw, 340px)" : "auto",
                zIndex:isMobile ? 141 : "auto",
                boxShadow:isMobile ? "0 28px 60px rgba(0,0,0,.42)" : shellCard.boxShadow,
              }}>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  <div style={{ color:chatAccent, ...mono(11,700), letterSpacing:".12em", textTransform:"uppercase", textShadow:`0 0 12px ${chatAccent}cc, 0 0 24px ${chatAccent}44` }}>{rosterTitle}</div>
                  <div style={{ color:SC.text, font:'800 24px/1.08 "Manrope", sans-serif', textShadow:`0 0 22px ${chatAccent}88, 0 0 44px ${chatAccent}2a` }}>{rosterSub}</div>
                  <div style={{ color:SC.muted, font:'500 13px/1.55 "Manrope", sans-serif' }}>
                    {view === "chats"
                      ? "Tus conversaciones recientes viven aquí con estado, nivel y lectura rápida."
                      : view === "amigos"
                        ? "Abre un canal directo con cualquier aliado del mapa."
                        : view === "solicitudes"
                          ? "Gestiona nuevas entradas al gremio sin salir de la sala."
                          : "Busca perfiles por nombre o deja que el mapa te sugiera nuevas conexiones."}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:8, marginBottom:12 }}>
                  {TABS.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => setView(tab.id)} style={{ ...railButton(view === tab.id, tab.id === "solicitudes" ? SC.gold : chatAccent), justifyContent:"space-between", width:"100%", padding:"10px 12px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:8, minWidth:0 }}>
                        <img
                          src={tab.asset}
                          alt=""
                          style={{ width:18, height:18, objectFit:"contain", flexShrink:0 }}
                          onError={(e)=>{ e.currentTarget.style.display = "none"; }}
                        />
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tab.label}</span>
                      </span>
                      {tab.badge ? <span style={{ ...mono(10,700), color:view === tab.id ? (tab.id === "solicitudes" ? SC.gold : chatAccent) : SC.muted }}>{tab.badge > 9 ? "9+" : tab.badge}</span> : null}
                    </button>
                  ))}
                </div>

                <div style={{ ...softCard, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <Search size={15} color={chatAccent} />
                  <input
                    value={view === "chats" ? convSearch : searchQ}
                    onChange={(e)=>view === "chats" ? setConvSearch(e.target.value) : setSearchQ(e.target.value)}
                    placeholder={view === "buscar" ? "Buscar aliado, clase o nombre..." : "Buscar canal o aliado..."}
                    style={{ flex:1, background:"transparent", border:"none", outline:"none", color:SC.text, ...sans(14,500) }}
                  />
                </div>

                {view === "buscar" && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                    {["ALL","GUERRERO","ARQUERO","MAGO"].map((key) => (
                      <button key={key} type="button" onClick={() => setClassFilter(key)} style={railButton(classFilter === key, key === "GUERRERO" ? SC.red : key === "ARQUERO" ? SC.green : key === "MAGO" ? SC.blue : chatAccent)}>
                        {key === "ALL" ? "Todo" : CLASS_LABEL[key]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="fc-scroll" style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, minHeight:0, paddingRight:4 }}>
                  {view === "solicitudes" ? (
                    requests.length === 0 ? (
                      <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>No hay solicitudes pendientes por ahora.</div>
                    ) : requests.map((req) => {
                      const other = req.from || req.user || req.sender || {};
                      return (
                        <div key={req.id} style={{ ...softCard, padding:14 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:12, border:`1px solid ${SC.gold}26`, background:"rgba(255,255,255,.03)", display:"grid", placeItems:"center", flexShrink:0 }}>
                              <img src={CHAT_ASSETS.requestSeal} alt="" style={{ width:18, height:18, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
                            </div>
                            <Avatar user={other} size={40} online={!!presences[other.uid]} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ color:SC.text, ...sans(14,700) }}>{other.username || "Aspirante"}</div>
                              <div style={{ color:SC.muted, ...sans(12,500) }}>{CLASS_LABEL[other.heroClass] || "Héroe"} · Lv. {other.level || 1}</div>
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:8, marginTop:12 }}>
                            <button type="button" onClick={() => handleRespond(req.id, "accept")} style={{ ...railButton(true, SC.green), flex:1, justifyContent:"center" }}>Aceptar</button>
                            <button type="button" onClick={() => handleRespond(req.id, "reject")} style={{ ...railButton(true, SC.red), flex:1, justifyContent:"center" }}>Rechazar</button>
                          </div>
                        </div>
                      );
                    })
                  ) : view === "buscar" ? (
                    <>
                      {suggestLoading && <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>Buscando aliados del mapa...</div>}
                      {(searchQ.length >= 2 ? searchFiltered : suggestedFiltered).length === 0 && !suggestLoading ? (
                        <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>
                          {searchQ.length >= 2 ? "No encontre perfiles con esa busqueda." : "El mapa no tiene sugerencias nuevas por ahora."}
                        </div>
                      ) : (searchQ.length >= 2 ? searchFiltered : suggestedFiltered).map((u) => {
                        const isFriendFlag = friends.some((f) => f.uid === u.uid);
                        const alreadySentFlag = !!u.alreadySent || sentReqs.some((r) => r.toUid === u.uid);
                        const cardTags = getRecruitTags(u, alreadySentFlag, isFriendFlag);
                        return (
                          <HeroCard
                            key={u.uid}
                            u={u}
                            isFriend={isFriendFlag}
                            alreadySent={alreadySentFlag}
                            tags={cardTags}
                            insight={getRecruitInsight(u, isFriendFlag)}
                            isOnline={Boolean(u?.uid && presences[u.uid])}
                            socialRankSrc={getRecruitRankSrc(u, alreadySentFlag, isFriendFlag)}
                            statusLabel={Boolean(u?.uid && presences[u.uid]) ? "Activo ahora" : cardTags[0]?.label}
                            onAdd={handleAddFriend}
                            onChat={handleOpenConv}
                          />
                        );
                      })}
                    </>
                  ) : view === "amigos" ? (
                    friends.length === 0 ? (
                      <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>Todavía no tienes aliados guardados. Abre explorar y suma los primeros.</div>
                    ) : [...friends].sort((a,b)=>(presences[b.uid]?1:0)-(presences[a.uid]?1:0)).map((f) => {
                      const isonl = !!presences[f.uid];
                      return (
                        <button key={f.uid} type="button" onClick={() => handleOpenConv(f.uid)} style={{ ...softCard, padding:12, textAlign:"left", cursor:"pointer" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <Avatar user={f} size={42} online={isonl} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ color:SC.text, ...sans(14,700) }}>{f.username}</div>
                              <div style={{ color:SC.muted, ...sans(12,500) }}>{statusTxt(isonl)} · Lv. {f.level || 1}</div>
                            </div>
                            <div style={{ color:CLASS_COLOR[f.heroClass] || chatAccent, ...mono(11,700) }}>{CLASS_LABEL[f.heroClass] || "Héroe"}</div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    filteredConvs.length === 0 ? (
                      <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>Todavía no tienes conversaciones abiertas.</div>
                    ) : filteredConvs.map((conv) => {
                      const other = getOther(conv);
                      const othUid = conv.participants?.find((p) => p !== viewerUid);
                      const unread = conv.unread?.[viewerUid] || 0;
                      const isonl = !!presences[othUid];
                      const isAct = activeConvId === conv.id;
                      const convSignal = getConversationSignal(conv);
                      return (
                        <button key={conv.id} type="button" onClick={() => { setActiveConvId(conv.id); if (isMobile) setShowSidebar(false); }} style={{
                          ...softCard,
                          padding:12,
                          textAlign:"left",
                          cursor:"pointer",
                          borderColor:isAct ? `${chatAccent}66` : `${chatAccent}24`,
                          background:isAct ? `linear-gradient(180deg, ${chatAccent}18, ${cls.soft})` : softCard.background,
                          boxShadow:isAct ? `0 14px 28px ${chatAccent}16, inset 0 1px 0 ${chatAccent}14` : softCard.boxShadow,
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <Avatar user={other} size={44} online={isonl} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                                <div style={{ color:SC.text, ...sans(14,700), overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{other?.username || "Aliado"}</div>
                                <div style={{ color:SC.muted, ...mono(10,700) }}>{FmtDate(conv.updatedAt || conv.lastMessageAt || conv.createdAt)}</div>
                              </div>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", marginTop:4 }}>
                                <div style={{ color:SC.muted, ...sans(12,500) }}>{statusTxt(isonl)} · Lv. {other?.level || 1}</div>
                                <span style={{ color:convSignal.color, ...mono(9,700), letterSpacing:".08em", textTransform:"uppercase" }}>
                                  {convSignal.label}
                                </span>
                              </div>
                            </div>
                            {unread > 0 ? <div style={{ minWidth:24, height:24, borderRadius:999, display:"grid", placeItems:"center", background:`${chatAccent}18`, border:`1px solid ${chatAccent}44`, color:chatAccent, ...mono(10,700) }}>{unread > 9 ? "9+" : unread}</div> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <button type="button" onClick={() => setView("buscar")} style={{ ...railButton(true, chatAccent), width:"100%", justifyContent:"center", marginTop:12 }}>
                  <UserPlus size={14} /> Buscar nuevos aliados
                </button>
              </aside>
              </div>
            )}

            <div style={{ ...shellCard, minHeight:isMobile ? 520 : "calc(100vh - 320px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {(discoverOpen || requestOpen) ? (
                <div style={{ padding:18, display:"flex", flexDirection:"column", gap:16, height:"100%" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                    <div>
                      <div style={{ color:discoverOpen ? chatAccent : SC.gold, ...mono(11,700), letterSpacing:".12em", textTransform:"uppercase", marginBottom:8, textShadow:discoverOpen ? `0 0 12px ${chatAccent}cc, 0 0 24px ${chatAccent}44` : `0 0 12px ${SC.gold}cc, 0 0 24px ${SC.gold}44` }}>
                        {discoverOpen ? "explorador social" : "tablon del gremio"}
                      </div>
                      <div style={{ color:SC.text, font:'800 28px/1.06 "Manrope", sans-serif', marginBottom:8, textShadow:discoverOpen ? `0 0 26px ${chatAccent}99, 0 0 52px ${chatAccent}33` : `0 0 26px ${SC.gold}88, 0 0 52px ${SC.gold}2a` }}>
                        {discoverOpen ? "Perfiles listos para conectar" : "Solicitudes pendientes"}
                      </div>
                      <div style={{ color:SC.muted, ...sans(14,500), maxWidth:720 }}>
                        {discoverOpen
                          ? "Abre un canal desde aqui, filtra por clase y evita que la parte social se sienta como una lista muerta."
                          : "Resuelve entradas pendientes, acepta nuevas alianzas y manten limpio el flujo del gremio."}
                      </div>
                    </div>
                    {isMobile && (
                      <button type="button" onClick={() => setShowSidebar((v)=>!v)} style={railButton(true, chatAccent)}>
                        {showSidebar ? "Ocultar rail" : "Ver rail"}
                      </button>
                    )}
                  </div>

                  <div className="fc-scroll" style={{ flex:1, overflowY:"auto", paddingRight:4 }}>
                    {discoverOpen ? (
                      <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap:14 }}>
                        {(searchQ.length >= 2 ? searchFiltered : suggestedFiltered).map((u) => {
                          const isFriendFlag = friends.some((f) => f.uid === u.uid);
                          const alreadySentFlag = !!u.alreadySent || sentReqs.some((r) => r.toUid === u.uid);
                          const cardTags = getRecruitTags(u, alreadySentFlag, isFriendFlag);
                          return (
                            <HeroCard
                              key={u.uid}
                              u={u}
                              isFriend={isFriendFlag}
                              alreadySent={alreadySentFlag}
                              tags={cardTags}
                              insight={getRecruitInsight(u, isFriendFlag)}
                              isOnline={Boolean(u?.uid && presences[u.uid])}
                              socialRankSrc={getRecruitRankSrc(u, alreadySentFlag, isFriendFlag)}
                              statusLabel={Boolean(u?.uid && presences[u.uid]) ? "Activo ahora" : cardTags[0]?.label || "Sin pulso visible"}
                              onAdd={handleAddFriend}
                              onChat={handleOpenConv}
                            />
                          );
                        })}
                        {(searchQ.length >= 2 ? searchFiltered : suggestedFiltered).length === 0 && !suggestLoading && (
                          <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>
                            {searchQ.length >= 2 ? "No hubo coincidencias con esa busqueda." : "Todavía no hay sugerencias disponibles."}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display:"grid", gap:12 }}>
                        {requests.length === 0 ? (
                          <div style={{ ...softCard, padding:16, color:SC.muted, ...sans(14,500) }}>No hay solicitudes por resolver.</div>
                        ) : requests.map((req) => {
                          const other = req.from || req.user || req.sender || {};
                          return (
                        <div key={req.id} style={{ ...softCard, padding:16 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <div style={{ width:36, height:36, borderRadius:12, border:`1px solid ${SC.gold}26`, background:"rgba(255,255,255,.03)", display:"grid", placeItems:"center", flexShrink:0 }}>
                              <img src={CHAT_ASSETS.requestSeal} alt="" style={{ width:18, height:18, objectFit:"contain" }} onError={(e)=>{e.currentTarget.style.display="none";}} />
                            </div>
                            <Avatar user={other} size={46} online={!!presences[other.uid]} />
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ color:SC.text, ...sans(15,700) }}>{other.username || "Aspirante"}</div>
                                  <div style={{ color:SC.muted, ...sans(13,500) }}>{CLASS_LABEL[other.heroClass] || "Héroe"} · Lv. {other.level || 1}</div>
                                </div>
                                <div style={{ color:SC.gold, ...mono(10,700), letterSpacing:".08em", textTransform:"uppercase" }}>nuevo acceso</div>
                              </div>
                              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                                <button type="button" onClick={() => handleRespond(req.id, "accept")} style={{ ...railButton(true, SC.green), flex:1, justifyContent:"center" }}>Aceptar</button>
                                <button type="button" onClick={() => handleRespond(req.id, "reject")} style={{ ...railButton(true, SC.red), flex:1, justifyContent:"center" }}>Rechazar</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : !activeConv ? (
                <EmptyChatState onExplore={() => { setView("buscar"); if (isMobile) setShowSidebar(true); }} />
              ) : (
                <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                  <div style={{ padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
                      <Avatar user={activeOther} size={52} online={activeOtherOnline} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ color:SC.text, font:'800 22px/1.05 "Manrope", sans-serif', overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textShadow:`0 0 20px ${chatAccent}99, 0 0 40px ${chatAccent}33` }}>
                          {activeOther?.username || t("ch.chats.unknown")}
                        </div>
                        <div style={{ color:activeOtherOnline ? SC.green : SC.muted, ...sans(13,600), marginTop:6 }}>
                          {activeOtherOnline ? "En linea ahora" : `${CLASS_LABEL[activeOther?.heroClass] || "Héroe"} · Lv. ${activeOther?.level || 1}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button
                        type="button"
                        onClick={() => openChatGameplayAction(fallbackGameplayActions[0] || { section: "misiones", ctaLabel: "Abrir misiones" })}
                        style={{ ...railButton(true, latestGameplayAction ? SC.gold : chatAccent) }}>
                        <Zap size={14} /> {(latestGameplayAction?.ctaLabel) || "Abrir misiones"}
                      </button>
                      {isMobile && (
                        <button type="button" onClick={() => setShowSidebar(true)} style={railButton(false, SC.gold)}>
                          <ChevronLeft size={14} /> Canales
                        </button>
                      )}
                    </div>
                  </div>

                  <div ref={msgContainerRef} onScroll={handleScroll} className="fc-scroll" style={{ flex:1, overflowY:"auto", padding:"18px 18px 10px", position:"relative" }}>
                    {hasMoreMsgs && (
                      <button onClick={handleLoadMore} disabled={loadingMore} style={{ ...railButton(false, SC.gold), margin:"0 auto 16px", display:"flex" }}>
                        {loadingMore ? "Cargando..." : "Ver mensajes anteriores"}
                      </button>
                    )}

                    {loadingMsgs && (
                      <div style={{ display:"flex", justifyContent:"center", padding:24 }}>
                        <div className="fvch-spinner"/>
                      </div>
                    )}

                    {!loadingMsgs && allMessages.length === 0 && (
                      <div style={{ ...softCard, padding:22, textAlign:"center", color:SC.muted, ...sans(15,500) }}>
                        Aun no hay mensajes aqui. Abre el canal con una primera linea clara y listo.
                      </div>
                    )}

                    {allMessages.map((msg, idx) => {
                      const isMe = msg.fromUid === viewerUid;
                      const other = getOther(activeConv);
                      const showDate = idx === 0 || (
                        new Date(msg.timestamp).toDateString() !== new Date(allMessages[idx - 1].timestamp).toDateString()
                      );
                      const seenByOther = isMe && otherReadAt > 0 && msg.timestamp <= otherReadAt;
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div style={{ display:"flex", justifyContent:"center", margin:"10px 0 14px" }}>
                              <span style={{ ...chipStyle, color:SC.gold, borderColor:"rgba(243,201,105,.22)" }}>
                                {new Date(msg.timestamp).toLocaleDateString("es-EC", { weekday:"long", day:"numeric", month:"long" })}
                              </span>
                            </div>
                          )}
                          <div onContextMenu={isMe && !msg.deleted ? (e) => {
                            e.preventDefault();
                            setContextMenu({ msgId:msg.id, x:e.clientX, y:e.clientY });
                          } : undefined}>
                            <MessageBubble msg={msg} isMe={isMe} other={other} seenByOther={seenByOther} onAction={openChatGameplayAction} />
                          </div>
                        </div>
                      );
                    })}

                    <AnimatePresence>
                      {peerTyping && (() => {
                        const other = getOther(activeConv);
                        return <TypingIndicator key="typing" name={other?.username || t("ch.chats.unknown")} />;
                      })()}
                    </AnimatePresence>

                    <div ref={messagesEndRef}/>
                  </div>

                  <AnimatePresence>
                    {showScrollBtn && (
                      <motion.button
                        initial={{ opacity:0, scale:.75 }}
                        animate={{ opacity:.95, scale:1 }}
                        exit={{ opacity:0, scale:.75 }}
                        onClick={() => { shouldScrollRef.current = true; scrollToBottom("smooth"); }}
                        style={{
                          position:"absolute",
                          right:22,
                          bottom:96,
                          width:42,
                          height:42,
                          borderRadius:"50%",
                          border:`1px solid ${chatAccent}55`,
                          background:`linear-gradient(180deg, ${chatAccent}18, rgba(255,255,255,.03))`,
                          color:chatAccent,
                          cursor:"pointer",
                          display:"grid",
                          placeItems:"center",
                        }}>
                        <ChevronDown size={16} />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <div style={{ padding:"14px 18px 18px", borderTop:"1px solid rgba(255,255,255,.06)", display:"grid", gridTemplateColumns:"1fr auto", gap:12 }}>
                    <div style={{ ...softCard, padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
                      <input
                        ref={inputRef}
                        value={msgInput}
                        onChange={(e)=>handleInputChange(e.target.value)}
                        onKeyDown={(e)=>{ if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Escribe una orden, una respuesta o una estrategia..."
                        maxLength={500}
                        style={{ flex:1, background:"transparent", border:"none", outline:"none", color:SC.text, ...sans(14,500) }}
                      />
                      <span style={{ color:SC.muted, ...mono(10,700) }}>{msgInput.length}/500</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!msgInput.trim() || sending}
                      style={{
                        ...railButton(true, chatAccent),
                        justifyContent:"center",
                        minWidth:140,
                        opacity:!msgInput.trim() || sending ? .55 : 1,
                      }}>
                      {sending ? <div className="fvch-spinner" style={{width:14,height:14}}/> : <Send size={14} />}
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isNarrow && (!isMobile || !showSidebar || activeConv || discoverOpen || requestOpen) && (
              <aside style={{ ...shellCard, padding:16, display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <div style={{ color:chatAccent, ...mono(11,700), letterSpacing:".12em", textTransform:"uppercase", marginBottom:8 }}>
                    ficha social
                  </div>
                  <div style={{ color:SC.text, font:'800 24px/1.08 "Manrope", sans-serif' }}>
                    {activeOther ? "Perfil del aliado" : "Estado del salón"}
                  </div>
                </div>

                {activeOther ? (
                  <>
                    <div style={{ ...softCard, padding:16, textAlign:"center" }}>
                      <div style={{ width:96, height:96, margin:"0 auto 12px", borderRadius:24, border:`1px solid ${chatAccent}44`, background:`linear-gradient(180deg, ${cls.soft}, rgba(255,255,255,.03))`, boxShadow:`0 12px 26px ${chatAccent}18`, display:"grid", placeItems:"center", overflow:"hidden" }}>
                        {activeOther.photoURL
                          ? <img src={activeOther.photoURL} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <img src={CLASS_CREST[activeOther.heroClass] || CLASS_CREST.DEFAULT} alt="" style={{ width:58, height:58, objectFit:"contain" }} />}
                      </div>
                      <div style={{ color:SC.text, font:'800 20px/1.1 "Manrope", sans-serif', marginBottom:6 }}>{activeOther.username || "Aliado"}</div>
                      <div style={{ color:CLASS_COLOR[activeOther.heroClass] || chatAccent, ...mono(11,700), letterSpacing:".08em", textTransform:"uppercase" }}>
                        {CLASS_LABEL[activeOther.heroClass] || "Héroe"} · Lv. {activeOther.level || 1}
                      </div>
                    </div>

                    <div style={{ ...softCard, padding:14 }}>
                      <div style={{ color:chatAccent, ...mono(10,700), letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>Ultima actividad</div>
                      <div style={{ color:SC.text, ...sans(14,700), marginBottom:6 }}>
                        {activeLastMessageText}
                      </div>
                      <div style={{ color:SC.muted, ...sans(13,500) }}>
                        {activeLastActivity ? `Movimiento visto ${FmtDate(activeLastActivity)}.` : "Todavía no hay marca reciente en este canal."}
                      </div>
                    </div>

                    <div style={{ ...softCard, padding:14 }}>
                      <div style={{ color:chatAccent, ...mono(10,700), letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Lectura del aliado</div>
                      <div style={{ display:"grid", gap:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:12, color:SC.muted, ...sans(13,600) }}>
                          <span>Clase y zona favorita</span>
                          <span style={{ color:CLASS_COLOR[activeOther.heroClass] || chatAccent }}>{CLASS_LABEL[activeOther.heroClass] || "Héroe"} · {activeZone}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:12, color:SC.muted, ...sans(13,600) }}>
                          <span>Racha activa</span>
                          <span style={{ color:activeStreak > 0 ? SC.green : SC.muted }}>{activeStreak > 0 ? `${activeStreak} días activos` : "Sin lectura visible"}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:12, color:SC.muted, ...sans(13,600) }}>
                          <span>Histórico del canal</span>
                          <span style={{ color:activeHistoricalMessageCount > 0 ? SC.gold : SC.muted }}>
                            {activeHistoricalMessageCount > 0
                              ? `${activeHistoricalMessageCount} total · ${activeVisibleMessageCount} visibles`
                              : "Canal nuevo"}
                          </span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:12, color:SC.muted, ...sans(13,600) }}>
                          <span>Lectura del vínculo</span>
                          <span style={{ color:SC.blue }}>{activeRelation}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ ...softCard, padding:14 }}>
                      <div style={{ color:chatAccent, ...mono(10,700), letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>Acciones</div>
                      <div style={{ display:"grid", gap:8 }}>
                        {fallbackGameplayActions.slice(0, 2).map((action, index) => (
                          <button
                            key={`${action.section}-${index}`}
                            type="button"
                            onClick={() => openChatGameplayAction(action)}
                            style={{ ...railButton(true, index === 0 && latestGameplayAction ? SC.gold : chatAccent), justifyContent:"center" }}>
                            <Zap size={14} /> {action.ctaLabel}
                          </button>
                        ))}
                        <button type="button" onClick={() => setRemoveFriendTarget(activeOther)} style={{ ...railButton(true, SC.red), justifyContent:"center" }}>
                          <UserX size={14} /> Quitar aliado
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ ...softCard, padding:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:54, height:54, borderRadius:18, border:`1px solid ${chatAccent}44`, background:`linear-gradient(180deg, ${cls.soft}, rgba(255,255,255,.03))`, boxShadow:`0 10px 22px ${chatAccent}16`, display:"grid", placeItems:"center" }}>
                          <img src="/ui/header/section-chat.png" alt="" style={{ width:28, height:28, objectFit:"contain" }} />
                        </div>
                        <div>
                          <div style={{ color:SC.text, ...sans(15,700) }}>Pulso del salón</div>
                          <div style={{ color:SC.muted, ...sans(13,500) }}>Todo el flujo social vive aqui sin hacer scroll infinito.</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ ...softCard, padding:14 }}>
                      <div style={{ color:chatAccent, ...mono(10,700), letterSpacing:".1em", textTransform:"uppercase", marginBottom:10 }}>Senales rápidas</div>
                      <div style={{ display:"grid", gap:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", color:SC.muted, ...sans(13,600) }}><span>Aliados conectados</span><span style={{ color:SC.green }}>{onlineCount}</span></div>
                        <div style={{ display:"flex", justifyContent:"space-between", color:SC.muted, ...sans(13,600) }}><span>Solicitudes pendientes</span><span style={{ color:SC.gold }}>{pendingReqs}</span></div>
                        <div style={{ display:"flex", justifyContent:"space-between", color:SC.muted, ...sans(13,600) }}><span>Canales abiertos</span><span style={{ color:chatAccent }}>{filteredConvs.length}</span></div>
                      </div>
                    </div>
                    <div style={{ ...softCard, padding:14, color:SC.muted, ...sans(13,500) }}>
                      Abre una conversación o explora perfiles nuevos para que esta sala social se sienta viva desde el primer vistazo.
                    </div>
                  </>
                )}
              </aside>
            )}
          </section>

        </div>
      </div>

    </>
  );
}
