// src/pages/user/UserDashboard.jsx — ForgeVenture Design System v4
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useThemeColors } from "../../hooks/useThemeColors.js";
import { useLang } from "../../hooks/useLang.js";
import {
  P, mono, sans, disp, glass, EASE,
  Aurora, PixelRain, Embers, ScrollProgress, Brackets, Reveal,
} from "../../design/system.jsx";
import {
  motion, AnimatePresence, useReducedMotion, useInView,
  useScroll, useSpring,
} from "framer-motion";
import {
  Home, Dumbbell, ClipboardList, Target, Trophy, ShoppingBag,
  User, LogOut, Bell, ChevronRight, Zap, Flame,
  Star, TrendingUp, Clock, Play,
  Award, Check, BarChart2, Menu, Search, Sword,
  MessageCircle, Brain, Heart, ChevronDown, ChevronUp,
  X, MessageSquare, Send, Instagram, Twitter, Youtube, Github, ArrowRight, BookOpen,
} from "lucide-react";
import { auth } from "../../firebase.js";
import { signOut } from "firebase/auth";
import { useLocation } from "react-router-dom";
import {
  getProfile, getUserStats, getMisionesUsuario, getUserActivity,
  getLeaderboard, getUserLogros, getNotifications, markMessageRead,
  markNotificationRead, markAllNotificationsRead,
  getWeeklyLeaderboard, setActiveAvatar, submitFeedback, getWeeklyActivity,
} from "../../services/api.js";
import { AVATARS_CATALOG } from "../../avatar/AvatarCatalog.js";
import DailyBonusModal from "../../components/shared/DailyBonusModal.jsx";
import StreakChallengeCard from "../../components/shared/StreakChallengeCard.jsx";
import PRBanner from "../../components/shared/PRBanner.jsx";
import LevelUpCeremony from "../../components/shared/LevelUpCeremony.jsx";
import UserMensajes  from "./UserMensajes";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import UserEjercicios  from "./UserEjercicios";
import UserRutinas     from "./UserRutinas";
import UserMisiones    from "./UserMisiones";
import UserLogros      from "./UserLogrosLanding.jsx";
import UserTienda      from "./UserTienda.jsx";
import UserPerfil      from "./UserPerfil";
import UserPersonaje, { STAGES, getStage } from "./UserPersonaje";
import UserChat        from "./UserChat";
import UserMente       from "./UserMente";
import UserDonaciones  from "./UserDonaciones";
import UserSalud       from "./UserSalud";
import UserHome        from "./UserHome";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";
import SocialFab from "../../components/shared/SocialFab.jsx";

// fonts + helpers come from design/system.js
// Legacy shims — keep Manrope/JetBrains Mono instead of Rajdhani/Orbitron
const raj = (s, w = 500) => ({ fontFamily:"'Manrope',sans-serif", fontSize: typeof s==="number"?`${s}px`:s, fontWeight: w });
const orb = (s, w = 600) => ({ fontFamily:"'JetBrains Mono',monospace", fontSize: typeof s==="number"?`${s}px`:s, fontWeight: w });
const px  = (s)          => ({ fontFamily:"'JetBrains Mono',monospace", fontSize: typeof s==="number"?`${s}px`:s, fontWeight: 700 });

// Module-level C — used by all sub-components defined outside the main function
const C = {
  bg: P.bg0,    side: P.bg1,  card: P.bg1,   panel: P.bg2,
  navy: P.navy, navyL: P.line,
  orange: P.accent, gold: P.gold,
  white: P.text, muted: P.muted, mutedL: P.mutedL,
  red: "#E05C8A", blue: "#4CC9F0", purple: P.accent, green: "#6BC87A",
};

// ── Clase configs ──────────────────────────────────────────────
const CLS = {
  GUERRERO:{ icon:"⚔️", color:"#E05C8A", primary:"Fuerza",       stats:{fuerza:95,resistencia:70,agilidad:55,vitalidad:60} },
  ARQUERO: { icon:"🏃", color:"#4CC9F0", primary:"Cardio",       stats:{agilidad:95,resistencia:85,fuerza:50,vitalidad:70} },
  MAGO:    { icon:"🧘", color:"#4cc9f0", primary:"Flexibilidad", stats:{vitalidad:95,agilidad:80,resistencia:75,fuerza:45} },
};

const DASH_CLASS_THEME = USER_CLASS_THEME;

const NAV = [
  { id:"home",       icon:Home,          key:"dash.nav.home",       badge:null  },
  { id:"ejercicios", icon:Dumbbell,      key:"dash.nav.ejercicios", badge:null  },
  { id:"rutinas",    icon:ClipboardList, key:"dash.nav.rutinas",    badge:null  },
  { id:"misiones",   icon:Target,        key:"dash.nav.misiones",   badge:null  },
  { id:"logros",     icon:Trophy,        key:"dash.nav.logros",     badge:null  },
  { id:"tienda",     icon:ShoppingBag,   key:"dash.nav.tienda",     badge:"NEW" },
  { id:"personaje",  icon:Sword,         key:"dash.nav.personaje",  badge:null  },
  { id:"mente",      icon:Brain,         key:"dash.nav.mente",      badge:"NEW" },
  { id:"salud",      icon:BookOpen,      key:"dash.nav.salud",      badge:null  },
  { id:"chat",       icon:MessageCircle, key:"dash.nav.chat",       badge:null  },
  { id:"mensajes",   icon:Bell,          key:"dash.nav.mensajes",   badge:null  },
  { id:"perfil",     icon:User,          key:"dash.nav.perfil",     badge:null  },
];

const NAV_RPG_META = {
  home:       { asset:"/ui/header/section-home.png",       zone:"Progreso",      hint:"Mapa del día",        keywords:["inicio","dashboard","mapa","avance"] },
  ejercicios: { asset:"/ui/header/section-ejercicios.png", zone:"Entreno",       hint:"Campo de combate",    keywords:["entrenar","fuerza","ejercicio","pelea"] },
  rutinas:    { asset:"/ui/header/section-rutinas.png",    zone:"Entreno",       hint:"Ruta física activa",  keywords:["rutina","plan","cardio","secuencia"] },
  misiones:   { asset:"/ui/header/section-misiones.png",   zone:"Aventura",      hint:"Tablón de quests",    keywords:["mision","quest","reclamar","xp"] },
  logros:     { asset:"/ui/header/section-logros.png",     zone:"Progreso",      hint:"Sala de trofeos",     keywords:["logros","trofeo","medalla","ranking"] },
  tienda:     { asset:"/ui/header/section-tienda.png",     zone:"Inventario",    hint:"Mercado del gremio",  keywords:["tienda","oro","comprar","objeto"] },
  personaje:  { asset:"/ui/header/section-personaje.png",  zone:"Héroe",         hint:"Forja de clase",      keywords:["personaje","avatar","clase","equipo"] },
  mente:      { asset:"/ui/header/section-mente.png",      zone:"Recuperación",  hint:"Santuario mental",    keywords:["mente","respirar","calma","flexibilidad"] },
  salud:      { asset:"/ui/header/section-mente.png",      zone:"Conocimiento",  hint:"Biblioteca de salud", keywords:["salud","nutricion","hidratacion","respirar","ejercicio"] },
  chat:       { asset:"/ui/header/section-chat.png",       zone:"Social",        hint:"Canal del gremio",    keywords:["chat","hablar","equipo","social"] },
  mensajes:   { asset:"/ui/header/section-mensajes.png",   zone:"Social",        hint:"Buzón de avisos",     keywords:["mensajes","notificaciones","avisos"] },
  donaciones: { asset:"/ui/header/section-donaciones.png", zone:"Apoyo",         hint:"Cristales del reino", keywords:["donar","apoyo","gemas"] },
  perfil:     { asset:"/ui/header/section-perfil.png",     zone:"Héroe",         hint:"Ficha del héroe",     keywords:["perfil","cuenta","jugador"] },
};

const getNavRpgMeta = (id, dashTheme) => {
  const meta = NAV_RPG_META[id] || NAV_RPG_META.home;
  return meta;
};

const NOTIF_ASSETS = {
  mision:   "/ui/header/notifications/notif-quest.png",
  misiones: "/ui/header/notifications/notif-quest.png",
  quest:    "/ui/header/notifications/notif-quest.png",
  logro:    "/ui/header/notifications/notif-medal.png",
  logros:   "/ui/header/notifications/notif-medal.png",
  medal:    "/ui/header/notifications/notif-medal.png",
  tienda:   "/ui/header/notifications/notif-shop.png",
  shop:     "/ui/header/notifications/notif-shop.png",
  racha:    "/ui/header/notifications/notif-shield.png",
  shield:   "/ui/header/notifications/notif-shield.png",
  sistema:  "/ui/header/notifications/notif-message.png",
  mensaje:  "/ui/header/notifications/notif-message.png",
  message:  "/ui/header/notifications/notif-message.png",
  progreso: "/ui/header/notifications/notif-medal.png",
  nivel:    "/ui/header/notifications/notif-medal.png",
  level:    "/ui/header/notifications/notif-medal.png",
};

const getNotifAsset = (notification) => {
  const key = String(notification?.icono || notification?.group || notification?.tipo || "sistema").toLowerCase();
  return NOTIF_ASSETS[key] || NOTIF_ASSETS[notification?.group] || NOTIF_ASSETS.sistema;
};

const normalizeDashboardClass = (profile) => {
  const raw = profile?.heroClass || profile?.clase || profile?.class || profile?.classId || profile?.roleClass || "GUERRERO";
  return String(raw).toUpperCase();
};

// ── CSS — clean modern design system ──────────────────────────
const CSS = `
  @keyframes ud2-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ud2-pulse     { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ud2-scan      { 0%{top:-2px} 100%{top:100%} }
  @keyframes ud2-shine     { 0%{left:-100%} 100%{left:200%} }
  @keyframes ud2-fire      { 0%,100%{filter:drop-shadow(0 0 4px var(--dash-class-accent))} 50%{filter:drop-shadow(0 0 14px var(--dash-class-secondary))} }
  @keyframes ud2-ring      { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
  @keyframes ud2-skelPulse { 0%,100%{opacity:.5} 50%{opacity:.2} }
  @keyframes ud2-pageIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ud2-slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ud2-growPulse { 0%{transform:scale(1);box-shadow:0 0 0 0 var(--gc)66} 40%{transform:scale(1.15);box-shadow:0 0 0 10px var(--gc)00} 100%{transform:scale(1);box-shadow:0 0 0 0 transparent} }
  @keyframes ud2-etaGlow   { 0%,100%{opacity:.7} 50%{opacity:1} }
  @keyframes ud2-allClear  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ud2-borderPulse { 0%,100%{opacity:.35} 50%{opacity:.85} }

  .ud2-stage-node  { transition:all .3s cubic-bezier(.34,1.56,.64,1); cursor:default; }
  .ud2-grow-pulse  { animation:ud2-growPulse .75s cubic-bezier(.34,1.56,.64,1) both; }

  .ud2-s0 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .04s both; }
  .ud2-s1 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .10s both; }
  .ud2-s2 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .16s both; }
  .ud2-s3 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .22s both; }
  .ud2-s4 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .28s both; }
  .ud2-s5 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .34s both; }
  .ud2-s6 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .40s both; }
  .ud2-s7 { animation:ud2-slideUp .5s cubic-bezier(.22,1,.36,1) .46s both; }

  * { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar       { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${P.bg0}; }
  ::-webkit-scrollbar-thumb { background:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 45%); border-radius:2px; }
  ::selection { background:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 70%); color:#fff; }

  /* ── NAV items ── */
  .ud2-nav-item {
    transition:background .18s, border-color .18s, transform .18s, box-shadow .18s; cursor:pointer;
    user-select:none; position:relative; border-left:3px solid transparent;
    min-height:40px;
  }
  .ud2-nav-item:hover {
    background:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 92%) !important;
    border-left-color:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 55%) !important;
    box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dash-class-accent),transparent 90%);
  }
  .ud2-nav-active {
    background:
      radial-gradient(circle at 0 50%,color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 72%),transparent 42%),
      linear-gradient(90deg,color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 86%),transparent) !important;
    border-left-color:var(--dash-class-accent, ${P.accent}) !important;
  }

  /* ── MODULE cards ── */
  .ud2-module { transition:border-color .25s, box-shadow .25s, transform .22s; }
  .ud2-module:hover {
    border-color:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 58%) !important;
    box-shadow:0 0 60px color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 84%), 0 30px 80px rgba(0,0,0,.5) !important;
    transform:translateY(-2px);
  }

  /* ── STAT pills ── */
  .ud2-pill { transition:all .25s cubic-bezier(.22,1,.36,1); }
  .ud2-pill:hover {
    transform:translateY(-4px) scale(1.01);
    border-color:var(--pc) !important;
    box-shadow:0 0 28px var(--pc)22, 0 10px 28px rgba(0,0,0,.45) !important;
  }

  /* ── CTA button ── */
  .ud2-btn { transition:all .2s ease; cursor:pointer; position:relative; overflow:hidden; }
  .ud2-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ud2-btn::before {
    content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
    transition:left .4s;
  }
  .ud2-btn:hover::before { left:100%; }

  /* ── Module header ── */
  .ud2-module-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 18px; cursor:pointer; user-select:none;
    transition:background .18s; position:relative;
  }
  .ud2-module-header:hover { background:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 94%); }
  .ud2-module-header::after {
    content:''; position:absolute; left:0; right:0; bottom:0; height:1px;
    background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 58%),transparent);
    opacity:0; transition:opacity .25s;
  }
  .ud2-module-header:hover::after { opacity:1; }

  /* ── Misc ── */
  .ud2-scan      { animation:ud2-scan 8s linear infinite; }
  .ud2-fire      { animation:ud2-fire 2s ease-in-out infinite; }
  .ud2-pulse-dot { animation:ud2-pulse 1.4s ease-in-out infinite; }
  .ud2-allclear  { animation:ud2-allClear 3s ease-in-out infinite; }
  .ud2-page      { animation:ud2-pageIn .3s cubic-bezier(0.22,1,0.36,1) both; }
  .ud2-skel      { animation:ud2-skelPulse 1.4s ease-in-out infinite; background:${P.bg2}; border-radius:4px; }
  .ud2-hero-glow { animation:ud2-borderPulse 3s ease-in-out infinite; }

  .ud2-mission-row { transition:background .15s, transform .15s; }
  .ud2-mission-row:hover { background:${P.navy}44 !important; transform:translateX(3px); }

  .ud2-activity-row { transition:background .15s, transform .15s; }
  .ud2-activity-row:hover { background:${P.navy}33 !important; transform:translateX(2px); }

  .hero-grid { display:grid; grid-template-columns:auto 1fr auto; gap:20px; align-items:center; }
  .hero-stats-col { min-width:140px; }
  .hero-stat-row  { margin-bottom:8px; }
  @media(max-width:1100px){
    .hero-grid { grid-template-columns:auto 1fr; }
    .hero-stats-col { grid-column:1/-1; display:flex; flex-wrap:wrap; gap:10px; }
    .hero-stat-row  { flex:1; min-width:130px; margin-bottom:0 !important; }
  }
  @media(max-width:680px){
    .hero-grid { grid-template-columns:1fr; }
    .hero-stats-col { display:flex; flex-wrap:wrap; gap:10px; }
  }

  /* ── Side section label ── */
  .ud2-side-sep {
    margin:4px 12px; height:1px;
    background:linear-gradient(90deg,transparent,${P.line},transparent);
  }
  .ud2-side-section-label {
    padding:8px 16px 4px;
    font-family:'JetBrains Mono',monospace;
    font-size:7px; font-weight:700;
    letter-spacing:.22em; color:${P.muted};
    text-transform:uppercase;
  }

  .c-input  { font-family:'Manrope',sans-serif; }
  .c-select { font-family:'Manrope',sans-serif; }

  /* ── Sidebar shell ── */
  .ud2-sidebar {
    background:
      radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--dash-class-accent),transparent 88%),transparent 28%),
      linear-gradient(180deg,rgba(8,5,17,.98) 0%,color-mix(in srgb,var(--dash-class-bg),rgba(10,7,18,.94) 55%) 52%,rgba(5,4,9,.98) 100%);
    border-right:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 72%);
    position:relative; overflow:hidden;
    box-shadow:18px 0 46px rgba(0,0,0,.34), inset -1px 0 0 rgba(255,255,255,.03);
  }
  .ud2-sidebar::before {
    content:''; position:absolute; inset:0;
    background:
      url("/ui/dashboard-particles.png") center/cover,
      repeating-linear-gradient(0deg,transparent,transparent 55px,color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 96%) 56px);
    opacity:.22;
    mix-blend-mode:screen;
    pointer-events:none; z-index:0;
  }
  .ud2-sidebar::after {
    content:"";
    position:absolute;
    top:0;
    right:0;
    width:1px;
    height:100%;
    background:linear-gradient(180deg,transparent,var(--dash-class-accent),var(--dash-class-secondary),transparent);
    opacity:.58;
    pointer-events:none;
  }
  .ud2-sidebar > * { position:relative; z-index:1; }
  .ud2-sidebar.is-collapsed .ud2-side-section-label {
    display:none;
  }

  /* ── Profile area ── */
  .ud2-side-profile {
    background:
      radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--dash-class-accent),transparent 84%),transparent 62%),
      linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 78%);
    border-radius:10px;
    margin:8px 10px 10px;
    position:relative; overflow:hidden;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 10px 28px rgba(0,0,0,.22);
  }
  .ud2-side-profile::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 90%) 0%,transparent 65%);
    pointer-events:none;
  }

  /* ── XP bar ── */
  .ud2-xp-bar-track {
    height:3px; background:${P.bg0};
    border:1px solid ${P.line}; overflow:hidden; border-radius:2px;
  }
  .ud2-xp-bar-fill {
    height:100%;
    background:linear-gradient(90deg,var(--dash-class-accent, ${P.accent}),var(--dash-class-secondary, ${P.accent2}),var(--dash-class-accent, ${P.accent}));
    box-shadow:0 0 8px color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 48%);
    transition:width 1.6s cubic-bezier(.22,1,.36,1);
  }

  .ud2-stage-dot {
    width:8px; height:8px; border-radius:50%;
    transition:all .35s cubic-bezier(.34,1.56,.64,1);
  }

  /* ── Sidebar atoms ── */
  .ud2-sidebar-edge {
    position:absolute;
    top:82px;
    right:-1px;
    bottom:82px;
    width:1px;
    display:block;
    background:linear-gradient(180deg,transparent,var(--dash-class-accent),transparent);
    opacity:.42;
    pointer-events:none;
  }
  .ud2-side-logo {
    min-height:58px;
  }
  .ud2-side-brand {
    display:flex;
    align-items:center;
    gap:8px;
    min-width:0;
  }
  .ud2-side-brand-mark {
    width:30px;
    height:30px;
    object-fit:cover;
    mix-blend-mode:screen;
    filter:drop-shadow(0 0 10px var(--dash-class-accent));
  }
  .ud2-side-toggle {
    width:28px;
    height:28px;
    border-radius:8px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 72%);
    background:rgba(255,255,255,.04);
    color:#d8cafa;
    display:grid;
    place-items:center;
    cursor:pointer;
    flex-shrink:0;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
    transition:border-color .18s, color .18s, background .18s, transform .18s;
  }
  .ud2-side-toggle:hover {
    color:var(--dash-class-secondary);
    border-color:color-mix(in srgb,var(--dash-class-accent),var(--dash-class-secondary) 18%);
    background:var(--dash-class-soft);
    transform:translateY(-1px);
  }
  .ud2-nav-icon {
    width:30px; height:30px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,.045); border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 82%);
    transition:background .2s, border-color .2s, transform .2s, box-shadow .2s;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
    position:relative;
  }
  .ud2-nav-icon img {
    width:24px;
    height:24px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 7px 8px rgba(0,0,0,.38));
  }
  .ud2-nav-active .ud2-nav-icon {
    background:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 82%);
    border-color:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 48%);
    box-shadow:0 0 18px color-mix(in srgb,var(--dash-class-accent),transparent 74%), inset 0 1px 0 rgba(255,255,255,.06);
  }
  .ud2-nav-item:hover .ud2-nav-icon {
    background:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 88%);
    border-color:color-mix(in srgb,var(--dash-class-accent, ${P.accent}),transparent 62%);
    transform:translateY(-1px);
  }
  .ud2-nav-tooltip {
    position:absolute;
    left:calc(100% + 12px);
    top:50%;
    transform:translateY(-50%) translateX(-4px);
    opacity:0;
    pointer-events:none;
    min-width:150px;
    max-width:210px;
    padding:8px 10px;
    border-radius:10px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 68%);
    background:rgba(8,5,17,.96);
    color:#fff6e6;
    box-shadow:0 12px 30px rgba(0,0,0,.48),0 0 18px var(--dash-class-soft);
    transition:opacity .16s, transform .16s;
    z-index:60;
  }
  .ud2-nav-item:hover .ud2-nav-tooltip {
    opacity:1;
    transform:translateY(-50%) translateX(0);
  }
  .ud2-nav-tooltip strong {
    display:block;
    font-family:'Manrope',sans-serif;
    font-size:11px;
    font-weight:900;
    line-height:1.15;
    color:#fff;
  }
  .ud2-nav-tooltip span {
    display:block;
    margin-top:4px;
    font-family:'JetBrains Mono',monospace;
    font-size:8px;
    font-weight:800;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:color-mix(in srgb,var(--dash-class-secondary),#fff 12%);
  }
  .ud2-side-ring, .ud2-side-avatar-ring { display:flex; justify-content:center; }
  .ud2-side-logout {}

  /* ── Topbar atoms ── */
  @keyframes ud2-hud-scan { 0%{left:-38%;opacity:0} 18%{opacity:.38} 52%{opacity:.18} 100%{left:124%;opacity:0} }
  @keyframes ud2-topbar-glint { 0%{transform:translateX(-120%);opacity:0} 28%{opacity:.36} 52%{opacity:0} 100%{transform:translateX(120%);opacity:0} }
  @keyframes ud2-topbar-pulse { 0%,100%{opacity:.58;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes ud2-section-pop { 0%{transform:translateY(2px) scale(.92);filter:brightness(.8)} 62%{transform:translateY(-2px) scale(1.08);filter:brightness(1.18)} 100%{transform:translateY(0) scale(1);filter:brightness(1)} }
  @keyframes ud2-coin-pop { 0%{transform:translateY(0) scale(1)} 45%{transform:translateY(-2px) scale(1.08)} 100%{transform:translateY(0) scale(1)} }
  @keyframes ud2-ready-breath { 0%,100%{box-shadow:0 0 16px color-mix(in srgb,var(--dash-class-accent),transparent 82%), inset 0 0 0 1px rgba(255,255,255,.05)} 50%{box-shadow:0 0 26px color-mix(in srgb,var(--dash-class-accent),transparent 62%), inset 0 0 0 1px rgba(255,255,255,.08)} }
  .ud2-topbar-shell {
    min-height:64px;
    background:
      linear-gradient(90deg,rgba(5,4,9,.96),color-mix(in srgb,var(--dash-class-bg),rgba(12,7,22,.9) 48%),rgba(5,4,9,.94)),
      radial-gradient(circle at 10% 0%,var(--dash-class-soft),transparent 34%),
      radial-gradient(circle at 88% 0%,color-mix(in srgb,var(--dash-class-secondary),transparent 90%),transparent 28%);
    backdrop-filter:blur(22px);
    -webkit-backdrop-filter:blur(22px);
    border-bottom:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 70%);
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-shrink:0;
    gap:14px;
    position:relative;
    z-index:50;
    overflow:visible;
    box-shadow:0 14px 42px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.04);
  }
  .ud2-topbar-shell::before {
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    opacity:.09;
    background-image:url("/ui/panel-texture.png");
    background-size:cover;
    background-position:center;
    mix-blend-mode:screen;
  }
  .ud2-topbar-shell::after {
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.13),transparent);
    animation:ud2-topbar-glint 6.5s ease-in-out infinite;
  }
  .ud2-topbar-left,
  .ud2-topbar-center,
  .ud2-topbar-right { position:relative; z-index:1; }
  .ud2-topbar-left {
    display:flex;
    align-items:center;
    gap:12px;
    min-width:220px;
    flex-shrink:0;
  }
  .ud2-section-orb {
    width:42px;
    height:42px;
    display:grid;
    place-items:center;
    border-radius:10px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 56%);
    background:
      radial-gradient(circle at 50% 35%,var(--dash-class-soft),transparent 64%),
      rgba(255,255,255,.045);
    box-shadow:0 0 24px var(--dash-class-soft), inset 0 0 0 1px rgba(255,255,255,.035);
  }
  .ud2-section-orb.is-changing {
    animation:ud2-section-pop .42s cubic-bezier(.22,1,.36,1) both;
  }
  .ud2-section-img {
    width:28px;
    height:28px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 8px 10px rgba(0,0,0,.4)) drop-shadow(0 0 10px var(--dash-class-soft));
  }
  .ud2-section-copy { min-width:0; }
  .ud2-section-title {
    display:flex;
    align-items:center;
    gap:8px;
    color:#fff9ef;
    font-family:'Manrope',sans-serif;
    font-size:14px;
    font-weight:900;
    line-height:1;
    white-space:nowrap;
  }
  .ud2-section-crest {
    width:18px;
    height:18px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 6px 8px rgba(0,0,0,.35));
  }
  .ud2-section-sub {
    margin-top:5px;
    display:flex;
    align-items:center;
    gap:6px;
    color:color-mix(in srgb,var(--dash-class-accent),var(--dash-class-secondary) 28%);
    font-family:'JetBrains Mono',monospace;
    font-size:8px;
    font-weight:900;
    letter-spacing:.18em;
    text-transform:uppercase;
  }
  .ud2-section-sub img {
    width:14px;
    height:14px;
    object-fit:contain;
    image-rendering:pixelated;
  }
  .ud2-topbar-center {
    flex:1 1 360px;
    max-width:460px;
    min-width:180px;
  }
  .ud2-search-wrap { position:relative; }
  .ud2-search-wrap::before {
    content:"";
    position:absolute;
    inset:-1px;
    border-radius:10px;
    background:linear-gradient(90deg,transparent,var(--dash-class-soft),transparent);
    opacity:.75;
    pointer-events:none;
  }
  .ud2-search-input {
    width:100%;
    height:38px;
    padding:0 14px 0 42px;
    background:rgba(8,5,17,.76);
    border-radius:10px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 72%);
    color:#f8f1ff;
    font-family:'Manrope',sans-serif;
    font-size:12px;
    font-weight:700;
    outline:none;
    transition:border-color .2s, box-shadow .2s, background .2s;
    position:relative;
    z-index:1;
  }
  .ud2-search-input:focus {
    border-color:color-mix(in srgb,var(--dash-class-accent),var(--dash-class-secondary) 22%);
    box-shadow:0 0 0 3px var(--dash-class-soft), 0 0 24px var(--dash-class-soft);
    background:rgba(8,5,17,.92);
  }
  .ud2-search-icon {
    position:absolute;
    left:13px;
    top:50%;
    transform:translateY(-50%);
    z-index:2;
    width:20px;
    height:20px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 6px 8px rgba(0,0,0,.35));
    pointer-events:none;
  }
  .ud2-map-results {
    position:absolute;
    top:calc(100% + 8px);
    left:0;
    right:0;
    background:
      linear-gradient(180deg,rgba(12,7,20,.98),rgba(5,4,9,.98)),
      radial-gradient(circle at 12% 0%,var(--dash-class-soft),transparent 36%);
    backdrop-filter:blur(22px);
    -webkit-backdrop-filter:blur(22px);
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 64%);
    border-radius:14px;
    box-shadow:0 18px 46px rgba(0,0,0,.72), 0 0 0 1px rgba(255,255,255,.035);
    z-index:260;
    overflow:hidden;
  }
  .ud2-map-results::before {
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    opacity:.08;
    background-image:url("/ui/panel-texture.png");
    background-size:cover;
  }
  .ud2-map-results-head {
    position:relative;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    padding:10px 12px;
    border-bottom:1px solid rgba(255,255,255,.07);
    color:#fff6e6;
    font-family:'JetBrains Mono',monospace;
    font-size:9px;
    font-weight:900;
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .ud2-map-count {
    color:color-mix(in srgb,var(--dash-class-secondary),#fff 18%);
    letter-spacing:0;
  }
  .ud2-map-result {
    position:relative;
    width:100%;
    min-height:58px;
    padding:10px 12px;
    background:transparent;
    border:0;
    border-bottom:1px solid rgba(255,255,255,.055);
    color:#fff;
    cursor:pointer;
    display:grid;
    grid-template-columns:38px minmax(0,1fr) auto;
    align-items:center;
    gap:10px;
    text-align:left;
    transition:background .18s, transform .18s;
  }
  .ud2-map-result:last-child { border-bottom:0; }
  .ud2-map-result:hover {
    background:linear-gradient(90deg,var(--dash-class-soft),rgba(255,255,255,.025));
    transform:translateX(2px);
  }
  .ud2-map-icon {
    width:38px;
    height:38px;
    border-radius:9px;
    display:grid;
    place-items:center;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 66%);
    background:rgba(255,255,255,.045);
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.035);
  }
  .ud2-map-icon img {
    width:28px;
    height:28px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 8px 9px rgba(0,0,0,.42));
  }
  .ud2-map-copy { min-width:0; }
  .ud2-map-title {
    color:#fff8ef;
    font-family:'Manrope',sans-serif;
    font-size:12px;
    font-weight:900;
    line-height:1.1;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .ud2-map-hint {
    margin-top:4px;
    color:rgba(230,220,255,.56);
    font-family:'Manrope',sans-serif;
    font-size:10px;
    font-weight:700;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .ud2-map-zone {
    justify-self:end;
    border:1px solid color-mix(in srgb,var(--dash-class-secondary),transparent 62%);
    background:rgba(255,255,255,.045);
    color:color-mix(in srgb,var(--dash-class-secondary),#fff 12%);
    border-radius:999px;
    padding:4px 7px;
    font-family:'JetBrains Mono',monospace;
    font-size:8px;
    font-weight:900;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .ud2-topbar-badge {
    display:flex; align-items:center; gap:7px;
    background:rgba(255,255,255,.055); border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 74%);
    padding:6px 10px; border-radius:999px;
    font-family:'JetBrains Mono',monospace;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
    color:#fff;
  }
  .ud2-topbar-badge.is-pulsing {
    animation:ud2-coin-pop .48s cubic-bezier(.22,1,.36,1) both;
    border-color:color-mix(in srgb,var(--dash-class-secondary),var(--dash-class-accent) 28%);
    box-shadow:0 0 20px color-mix(in srgb,var(--dash-class-secondary),transparent 82%), inset 0 1px 0 rgba(255,255,255,.06);
  }
  .ud2-topbar-badge img {
    width:18px;
    height:18px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 6px 7px rgba(0,0,0,.35));
  }
  .ud2-clock-pill {
    display:flex;
    align-items:center;
    gap:7px;
    color:var(--dash-class-secondary);
    font-family:'JetBrains Mono',monospace;
    font-size:10px;
    font-weight:900;
    letter-spacing:.08em;
    white-space:nowrap;
  }
  .ud2-clock-dot {
    width:7px;
    height:7px;
    border-radius:50%;
    background:var(--dash-class-accent);
    box-shadow:0 0 12px var(--dash-class-accent);
    animation:ud2-topbar-pulse 2.2s ease-in-out infinite;
  }
  .ud2-icon-action,
  .ud2-notif-button,
  .ud2-focus-action {
    width:38px;
    height:38px;
    border-radius:10px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 76%);
    background:rgba(255,255,255,.045);
    display:grid;
    place-items:center;
    cursor:pointer;
    position:relative;
    transition:transform .2s,border-color .2s,background .2s,box-shadow .2s;
  }
  .ud2-icon-action:hover,
  .ud2-notif-button:hover,
  .ud2-focus-action:hover {
    transform:translateY(-2px);
    border-color:color-mix(in srgb,var(--dash-class-accent),var(--dash-class-secondary) 18%);
    background:var(--dash-class-soft);
    box-shadow:0 0 22px var(--dash-class-soft);
  }
  .ud2-icon-action img,
  .ud2-notif-button img,
  .ud2-focus-action img {
    width:24px;
    height:24px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 7px 8px rgba(0,0,0,.38));
  }
  .ud2-daily-bonus.ready {
    border-color:color-mix(in srgb,var(--dash-class-accent),transparent 56%);
    background:linear-gradient(180deg,color-mix(in srgb,var(--dash-class-accent),transparent 86%),rgba(255,255,255,.04));
    animation:ud2-ready-breath 2.4s ease-in-out infinite;
  }
  .ud2-daily-bonus.claimed {
    opacity:.64;
    filter:saturate(.7);
  }
  .ud2-action-tip {
    position:absolute;
    top:calc(100% + 9px);
    right:0;
    pointer-events:none;
    opacity:0;
    transform:translateY(-3px);
    transition:opacity .18s, transform .18s;
    padding:6px 8px;
    border-radius:8px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 68%);
    background:rgba(8,5,17,.96);
    color:#fff6e6;
    font-family:'Manrope',sans-serif;
    font-size:10px;
    font-weight:900;
    white-space:nowrap;
    box-shadow:0 10px 24px rgba(0,0,0,.45);
    z-index:330;
  }
  .ud2-icon-action:hover .ud2-action-tip,
  .ud2-notif-button:hover .ud2-action-tip,
  .ud2-focus-action:hover .ud2-action-tip {
    opacity:1;
    transform:translateY(0);
  }
  .ud2-focus-action {
    width:auto;
    min-width:118px;
    padding:0 12px;
    grid-auto-flow:column;
    gap:7px;
    color:#d7c9f6;
    font-family:'Manrope',sans-serif;
    font-size:11px;
    font-weight:900;
  }
  .ud2-focus-action.is-on {
    color:#fff7df;
    border-color:color-mix(in srgb,var(--dash-class-accent),var(--dash-class-secondary) 22%);
    background:linear-gradient(180deg,var(--dash-class-soft),rgba(255,255,255,.045));
    box-shadow:0 0 22px var(--dash-class-soft);
  }
  .ud2-focus-action.is-off {
    opacity:.78;
  }
  .ud2-focus-rune {
    width:20px;
    height:20px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 6px 8px rgba(0,0,0,.42));
  }
  .ud2-notif-button {
    background:rgba(255,255,255,.038);
  }
  .ud2-notif-badge {
    position:absolute;
    top:-3px;
    right:-3px;
    min-width:16px;
    height:16px;
    padding:0 4px;
    border-radius:999px;
    background:var(--dash-class-secondary);
    border:2px solid #05040a;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#12070d;
    font-family:'Manrope',sans-serif;
    font-size:8px;
    font-weight:1000;
    box-shadow:0 0 10px color-mix(in srgb,var(--dash-class-secondary),transparent 38%);
  }
  .ud2-notif-ok {
    position:absolute;
    top:2px;
    right:2px;
    width:7px;
    height:7px;
    border-radius:50%;
    background:#6BC87A;
    border:1px solid #05040a;
    box-shadow:0 0 7px #6BC87A;
  }
  .ud2-notif-panel {
    position:absolute;
    top:calc(100% + 10px);
    right:0;
    width:340px;
    background:
      linear-gradient(180deg,rgba(12,7,20,.98),rgba(5,4,9,.98)),
      radial-gradient(circle at 100% 0%,var(--dash-class-soft),transparent 36%);
    backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px);
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 62%);
    border-radius:16px;
    box-shadow:0 18px 52px rgba(0,0,0,.82), 0 0 0 1px rgba(255,255,255,.035);
    z-index:300;
    overflow:hidden;
  }
  .ud2-notif-panel::before {
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;
    opacity:.08;
    background-image:url("/ui/panel-texture.png");
    background-size:cover;
  }
  .ud2-notif-head,
  .ud2-notif-footer,
  .ud2-notif-empty,
  .ud2-notif-row {
    position:relative;
  }
  .ud2-notif-head {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    padding:14px 16px 12px;
    border-bottom:1px solid rgba(255,255,255,.07);
    background:linear-gradient(90deg,var(--dash-class-soft),rgba(255,255,255,.02));
  }
  .ud2-notif-title {
    display:flex;
    align-items:center;
    gap:8px;
    color:#fff6e6;
    font-family:'JetBrains Mono',monospace;
    font-size:9px;
    font-weight:900;
    letter-spacing:.1em;
    text-transform:uppercase;
  }
  .ud2-notif-title img {
    width:22px;
    height:22px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 7px 8px rgba(0,0,0,.4));
  }
  .ud2-notif-mark,
  .ud2-notif-refresh {
    border:0;
    background:transparent;
    cursor:pointer;
    color:color-mix(in srgb,var(--dash-class-secondary),#fff 15%);
    font-family:'Manrope',sans-serif;
    font-size:11px;
    font-weight:900;
  }
  .ud2-notif-mark:disabled,
  .ud2-notif-refresh:disabled {
    opacity:.5;
    cursor:not-allowed;
  }
  .ud2-notif-summary {
    padding:10px 16px;
    border-bottom:1px solid rgba(255,255,255,.06);
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    color:rgba(230,220,255,.58);
    font-family:'Manrope',sans-serif;
    font-size:10px;
    font-weight:900;
  }
  .ud2-notif-pill {
    border:1px solid color-mix(in srgb,var(--dash-class-secondary),transparent 62%);
    background:rgba(255,255,255,.045);
    color:color-mix(in srgb,var(--dash-class-secondary),#fff 10%);
    border-radius:999px;
    padding:4px 7px;
    white-space:nowrap;
  }
  .ud2-notif-group {
    padding:9px 16px 5px;
    color:color-mix(in srgb,var(--dash-class-secondary),#fff 18%);
    font-family:'JetBrains Mono',monospace;
    font-size:8px;
    font-weight:900;
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .ud2-notif-row {
    width:calc(100% - 20px);
    margin:0 10px 8px;
    padding:11px 12px;
    background:
      radial-gradient(circle at 0 20%,color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 86%),transparent 42%),
      linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));
    border:1px solid color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 70%);
    border-left:3px solid var(--notif-color,var(--dash-class-accent));
    border-radius:12px;
    cursor:pointer;
    display:grid;
    grid-template-columns:42px minmax(0,1fr) 8px;
    gap:11px;
    text-align:left;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 10px 24px rgba(0,0,0,.18);
    transition:background .16s, transform .16s, border-color .16s, box-shadow .16s;
    overflow:hidden;
    position:relative;
  }
  .ud2-notif-row::before {
    content:"";
    position:absolute;
    inset:0 0 auto;
    height:1px;
    background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 38%),transparent);
    pointer-events:none;
  }
  .ud2-notif-row.sev-urgent {
    --notif-color:#ff5a7a;
    background:linear-gradient(90deg,rgba(255,90,122,.08),transparent 50%);
  }
  .ud2-notif-row.sev-warning {
    --notif-color:#f4cc78;
    background:linear-gradient(90deg,rgba(244,204,120,.07),transparent 50%);
  }
  .ud2-notif-row.sev-success {
    --notif-color:#6BC87A;
    background:linear-gradient(90deg,rgba(107,200,122,.07),transparent 50%);
  }
  .ud2-notif-row:hover {
    background:linear-gradient(90deg,var(--dash-class-soft),rgba(255,255,255,.025));
    transform:translateX(2px);
    border-color:color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 46%);
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 14px 26px rgba(0,0,0,.24),0 0 18px color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 86%);
  }
  .ud2-notif-row.is-read {
    opacity:.68;
  }
  .ud2-notif-icon {
    width:42px;
    height:42px;
    border-radius:10px;
    display:grid;
    place-items:center;
    border:1px solid color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 62%);
    background:radial-gradient(circle,var(--dash-class-soft),rgba(255,255,255,.035));
    color:#fff;
    font-size:14px;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
  }
  .ud2-notif-icon img {
    width:31px;
    height:31px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 7px 8px rgba(0,0,0,.42)) drop-shadow(0 0 8px color-mix(in srgb,var(--notif-color,var(--dash-class-accent)),transparent 72%));
  }
  .ud2-notif-name {
    color:#fff8ef;
    font-family:'Manrope',sans-serif;
    font-size:12px;
    font-weight:900;
    line-height:1.25;
  }
  .ud2-notif-desc {
    margin-top:3px;
    color:rgba(230,220,255,.58);
    font-family:'Manrope',sans-serif;
    font-size:11px;
    font-weight:600;
    line-height:1.35;
    overflow:hidden;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
  }
  .ud2-notif-meta {
    margin-top:6px;
    display:flex;
    align-items:center;
    gap:6px;
    color:rgba(230,220,255,.38);
    font-family:'JetBrains Mono',monospace;
    font-size:8px;
    font-weight:800;
    text-transform:uppercase;
  }
  .ud2-notif-dot {
    width:7px;
    height:7px;
    border-radius:50%;
    background:var(--dash-class-secondary);
    box-shadow:0 0 8px var(--dash-class-secondary);
    margin-top:4px;
  }
  .ud2-notif-empty {
    padding:30px 18px;
    text-align:center;
    color:rgba(230,220,255,.56);
    font-family:'Manrope',sans-serif;
    font-size:12px;
    font-weight:800;
  }
  .ud2-notif-state {
    padding:28px 18px;
    display:grid;
    place-items:center;
    gap:10px;
    color:rgba(230,220,255,.62);
    font-family:'Manrope',sans-serif;
    font-size:12px;
    font-weight:900;
    text-align:center;
  }
  .ud2-notif-loader {
    width:24px;
    height:24px;
    border-radius:50%;
    border:2px solid rgba(255,255,255,.12);
    border-top-color:var(--dash-class-secondary);
    animation:ud2-spin .8s linear infinite;
  }
  .ud2-notif-footer {
    padding:9px 16px;
    border-top:1px solid rgba(255,255,255,.07);
    display:flex;
    align-items:center;
    justify-content:space-between;
    color:rgba(230,220,255,.38);
    font-family:'Manrope',sans-serif;
    font-size:10px;
    font-weight:800;
  }
  .ud2-mobile-map-btn,
  .ud2-mobile-search-close {
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 70%);
    background:rgba(255,255,255,.055);
    color:#fff6e6;
    cursor:pointer;
    display:grid;
    place-items:center;
  }
  .ud2-mobile-map-btn {
    width:38px;
    height:38px;
    border-radius:10px;
    box-shadow:0 0 18px var(--dash-class-soft);
  }
  .ud2-mobile-map-btn img {
    width:23px;
    height:23px;
    object-fit:contain;
    image-rendering:pixelated;
    filter:drop-shadow(0 7px 8px rgba(0,0,0,.4));
  }
  .ud2-mobile-search-panel {
    position:absolute;
    top:calc(100% + 10px);
    left:12px;
    right:12px;
    z-index:280;
    padding:12px;
    border-radius:16px;
    border:1px solid color-mix(in srgb,var(--dash-class-accent),transparent 62%);
    background:
      linear-gradient(180deg,rgba(12,7,20,.98),rgba(5,4,9,.98)),
      radial-gradient(circle at 85% 0%,var(--dash-class-soft),transparent 40%);
    box-shadow:0 18px 50px rgba(0,0,0,.76), 0 0 26px var(--dash-class-soft);
  }
  .ud2-mobile-search-top {
    display:grid;
    grid-template-columns:minmax(0,1fr) 36px;
    gap:8px;
    align-items:center;
  }
  .ud2-mobile-search-close {
    height:36px;
    border-radius:10px;
  }
  .ud2-mobile-search-panel .ud2-map-results {
    position:relative;
    top:auto;
    left:auto;
    right:auto;
    margin-top:10px;
    max-height:min(62vh,430px);
    overflow:auto;
  }
  .ud2-compact-hud {
    padding:6px 8px;
    gap:5px;
  }
  .ud2-compact-hud img {
    width:17px;
    height:17px;
  }
  .ud2-focus-action {}

  @media(max-width:760px) {
    .ud2-topbar-shell {
      min-height:60px;
      gap:8px;
      overflow:visible;
    }
    .ud2-topbar-left {
      min-width:0;
      gap:9px;
      flex:1 1 auto;
    }
    .ud2-section-orb {
      width:38px;
      height:38px;
      border-radius:9px;
    }
    .ud2-section-img {
      width:25px;
      height:25px;
    }
    .ud2-section-title {
      font-size:12px;
      max-width:118px;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .ud2-section-crest {
      width:16px;
      height:16px;
    }
    .ud2-section-sub {
      margin-top:4px;
      font-size:7px;
      letter-spacing:.08em;
    }
    .ud2-topbar-right {
      gap:5px !important;
    }
    .ud2-topbar-badge span {
      font-size:9px !important;
    }
    .ud2-clock-pill,
    .ud2-focus-action {
      display:none !important;
    }
    .ud2-icon-action,
    .ud2-mobile-map-btn {
      width:36px;
      height:36px;
      border-radius:9px;
    }
    .ud2-icon-action img {
      width:22px;
      height:22px;
    }
    .ud2-notif-panel {
      position:fixed;
      left:10px;
      right:10px;
      bottom:10px;
      top:auto;
      width:auto;
      max-height:min(78vh,560px);
      border-radius:18px 18px 16px 16px;
      box-shadow:0 -18px 50px rgba(0,0,0,.82),0 0 26px var(--dash-class-soft);
    }
    .ud2-notif-panel::after {
      content:"";
      position:absolute;
      top:7px;
      left:50%;
      width:42px;
      height:4px;
      border-radius:999px;
      background:rgba(255,255,255,.16);
      transform:translateX(-50%);
      pointer-events:none;
    }
    .ud2-notif-head {
      padding-top:18px;
    }
    .ud2-notif-row {
      width:calc(100% - 16px);
      margin:0 8px 8px;
      grid-template-columns:40px minmax(0,1fr) 8px;
    }
  }

  @media(max-width:430px) {
    .ud2-section-title { max-width:96px; }
    .ud2-section-sub img { display:none; }
    .ud2-compact-hud {
      padding:6px;
    }
    .ud2-map-result {
      grid-template-columns:36px minmax(0,1fr);
    }
    .ud2-map-zone {
      grid-column:2;
      justify-self:start;
      margin-top:-2px;
    }
  }
`;
const SIDE_CSS = "";

// ── Helpers ────────────────────────────────────────────────────
function timeAgo(iso, t) {
  if (!iso) return t ? t("dash.time.recent") : "Reciente";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)     return t ? t("dash.time.moment") : "Hace un momento";
  if (d < 3600)   return `Hace ${Math.floor(d/60)}min`;
  if (d < 86400)  return `Hace ${Math.floor(d/3600)}h`;
  if (d < 172800) return t ? t("dash.time.yesterday") : "Ayer";
  return `Hace ${Math.floor(d/86400)}d`;
}
function timeUntil(iso, t) {
  if (!iso) return { label:"--", urgent:false };
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  if (s <= 0)    return { label: t ? t("dash.time.expired") : "Expirada", urgent:true };
  const urgent = s < 3600;
  if (s < 60)    return { label:`${Math.floor(s)}s`, urgent };
  if (s < 3600)  return { label:`${Math.floor(s/60)}m ${Math.floor(s%60)}s`, urgent };
  if (s < 86400) return { label:`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`, urgent:false };
  return { label:`${Math.floor(s/86400)}d ${Math.floor((s%86400)/3600)}h`, urgent:false };
}
function getTimeGroup(ts, t) {
  const diff = Date.now() - ts;
  const d = diff / 86400000;
  if (d < 1)  return t ? t("dash.time.today")     : "Hoy";
  if (d < 2)  return t ? t("dash.time.yesterday") : "Ayer";
  if (d < 7)  return t ? t("dash.time.week")      : "Esta semana";
  return t ? t("dash.time.older") : "Anterior";
}

// ── Atoms ──────────────────────────────────────────────────────
function Skel({ w="100%", h=14, mb=0 }) {
  return <div className="ud2-skel" style={{ width:w, height:h, marginBottom:mb }} />;
}

function MiniBar({ val, max, color, h=5 }) {
  const pct = Math.min(Math.round((val/max)*100), 100);
  return (
    <div style={{ height:h, background:P.bg2, border:`1px solid ${color}22`, overflow:"hidden", width:"100%" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, boxShadow:`0 0 6px ${color}55`, transition:"width 1.4s cubic-bezier(0.22,1,0.36,1)" }} />
    </div>
  );
}

// ── Sidebar avatar circle with PNG avatar + optional PNG frame ──
function SidebarAvatar({ profile, cls, size=36, pulse=false }) {
  const [imgOk,   setImgOk]   = useState(true);
  const [frameOk, setFrameOk] = useState(true);
  const avatarId = profile?.activeAvatar || "avatar_01";
  const frameId  = profile?.activeFrame  || null;
  const PAD      = Math.round(size * 0.22);
  const outer    = size + 2 * PAD;

  return (
    <div className={pulse ? "ud2-grow-pulse" : ""}
      style={{ position:"relative", width:outer, height:outer, flexShrink:0, "--gc":cls.color }}>
      {/* Avatar circle */}
      <div style={{
        position:"absolute", top:PAD, left:PAD,
        width:size, height:size, borderRadius:"50%",
        background:`${cls.color}18`,
        border:`2px solid ${pulse ? cls.color : cls.color+"55"}`,
        overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: size * 0.5,
        boxShadow: pulse ? `0 0 14px ${cls.color}` : "none",
        transition:"border-color .3s, box-shadow .3s",
      }}>
        {imgOk ? (
          <img src={`/perfil/${avatarId}.png`} alt={avatarId}
            onError={() => setImgOk(false)}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          cls.icon
        )}
      </div>
      {/* Frame PNG overlay */}
      {frameId && (frameOk ? (
        <img src={`/marcos/${frameId}.png`} alt={frameId}
          onError={() => setFrameOk(false)}
          style={{ position:"absolute", inset:0, width:outer, height:outer,
            objectFit:"fill", pointerEvents:"none" }}/>
      ) : (
        // CSS gradient ring fallback
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          background: cls.color,
          mask:`radial-gradient(circle at center, transparent ${Math.round((size/outer)*50)}%, black calc(${Math.round((size/outer)*50)}% + 2%))`,
          WebkitMask:`radial-gradient(circle at center, transparent ${Math.round((size/outer)*50)}%, black calc(${Math.round((size/outer)*50)}% + 2%))`,
          pointerEvents:"none",
        }}/>
      ))}
    </div>
  );
}


// Aurora, PixelRain, Embers, Reveal, Brackets — imported from design/system.js

// ── Module Card (expandible) ───────────────────────────────────
function Module({ id, title, subtitle, icon: Icon, color=P.accent, expanded, onToggle, badge, children, rightSlot }) {
  const g = glass(0.75);
  return (
    <motion.div className="ud2-module"
      whileHover={{ y: expanded ? 0 : -2 }}
      transition={{ duration:.22, ease: EASE }}
      style={{
        ...g,
        border:`1px solid ${expanded ? color+"55" : P.line}`,
        borderRadius:14, overflow:"hidden", position:"relative",
        boxShadow: expanded ? `0 0 60px ${color}18, 0 30px 80px rgba(0,0,0,.5)` : "0 4px 28px rgba(0,0,0,0.4)",
      }}>
      {/* Corner brackets */}
      <Brackets color={expanded ? color : color+"44"} size={14} thickness={1.5}/>
      {/* Top accent line */}
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${color}${expanded?"cc":"44"},transparent)` }} />

      {/* Header */}
      <div className="ud2-module-header" onClick={onToggle}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <motion.div
            animate={expanded ? { boxShadow:`0 0 16px ${color}55`, background:`${color}20` } : { boxShadow:"none", background:`${color}12` }}
            transition={{ duration:.3 }}
            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${color}${expanded?"44":"22"}`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon size={15} color={color} />
          </motion.div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ ...mono(11,700), color:P.text }}>{title}</span>
              {badge && (
                <span style={{ ...mono(8,700), color:P.bg0, background:color, padding:"2px 7px", lineHeight:1.6, borderRadius:3 }}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <div style={{ ...sans(11,400), color:P.muted, marginTop:2 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {rightSlot}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration:.25 }}>
            <ChevronDown size={14} color={P.muted} />
          </motion.div>
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:.3, ease: EASE }}
            style={{ overflow:"hidden" }}
          >
            <div style={{ borderTop:`1px solid ${P.line}` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── StatPill ──────────────────────────────────────────────────
function StatPill({ icon, label, value, color, sub, index=0 }) {
  const ref   = useRef(null);
  const inView= useInView(ref, { once:true, margin:"-10px" });
  const [displayed, setDisplayed] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const raw = String(value).replace(/,/g, "").replace(/[^\d.]/g, "");
    const n = parseFloat(raw);
    if (isNaN(n) || n === 0) { setDisplayed(value); return; }
    const dur = 850;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setDisplayed(Math.floor(n * ease).toLocaleString());
      if (prog < 1) requestAnimationFrame(step);
      else setDisplayed(value);
    };
    requestAnimationFrame(step);
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div ref={ref}
      className="ud2-pill"
      initial={{ opacity:0, y:18, scale:.96 }}
      animate={inView ? { opacity:1, y:0, scale:1 } : {}}
      transition={{ duration:.45, delay:index*0.07, ease:[0.22,1,0.36,1] }}
      style={{ ...glass(0.7), borderTop:`3px solid ${color}`, padding:"16px 14px", borderRadius:12,
        position:"relative", overflow:"hidden", "--pc":color,
        boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)` }}
    >
      {/* Corner gradient */}
      <div style={{ position:"absolute", top:0, right:0, width:60, height:60,
        background:`linear-gradient(225deg,${color}18,transparent)`, pointerEvents:"none" }} />
      {/* Bottom glow line */}
      <div className="ud2-hero-glow" style={{ position:"absolute", bottom:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${color}55,transparent)`, pointerEvents:"none" }}/>
      {/* Scan stripe */}
      <div className="ud2-pill-scan" style={{ position:"absolute", top:0, left:"-100%", width:"60%", height:"100%",
        background:`linear-gradient(90deg,transparent,${color}08,transparent)`,
        pointerEvents:"none", transition:"left .38s ease" }}/>

      <div style={{ fontSize:20, marginBottom:9, filter:`drop-shadow(0 0 10px ${color}77)`,
        position:"relative", display:"inline-block" }}>{icon}</div>
      <div style={{ ...disp(22,800), color, marginBottom:3, lineHeight:1, position:"relative",
        textShadow:`0 0 24px ${color}44` }}>{displayed}</div>
      <div style={{ ...mono(9,700), color:P.muted, letterSpacing:".07em", marginBottom:2, position:"relative" }}>{label}</div>
      {sub && <div style={{ ...sans(10,400), color:P.muted, opacity:.55, position:"relative" }}>{sub}</div>}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// CHARACTER EVOLUTION CARD
// ══════════════════════════════════════════════════════════════
function CharacterEvolutionCard({ profile, userStats, onNavigate }) {
  const { t } = useLang();
  const p      = profile || {};
  const cls    = CLS[p.heroClass] || CLS.GUERRERO;
  const level  = p.level  || 1;
  const xp     = p.xp     || 0;
  const xpNext = p.xpNext || 100;
  const streak = p.streak || 0;

  const stage    = getStage(level);
  const nextStage= STAGES.find(s => s.id === stage.id + 1);
  const lvlsLeft = nextStage ? nextStage.min - level : 0;

  // ETA estimate — based on weekly XP pace
  const weeklyXP  = userStats?.weeklyXP || 0;
  const dailyPace = weeklyXP > 0 ? weeklyXP / 7 : 0;
  let etaText = null;
  if (nextStage && dailyPace > 0) {
    // Remaining XP in current level + iterative sum for each full level until next stage
    let totalXpNeeded = xpNext - xp;
    for (let l = level + 1; l < nextStage.min; l++) {
      totalXpNeeded += Math.floor(Math.pow(l, 2) * 100);
    }
    const etaDays = Math.ceil(Math.max(totalXpNeeded, 0) / dailyPace);
    if (etaDays <= 365) etaText = `~${etaDays} días`;
  }

  // Stage progress fill across the journey (0-100% across all 5 stages)
  const totalPct = stage.pct + (nextStage ? ((level - stage.min) / (nextStage.min - stage.min)) * (nextStage.pct - stage.pct) : 0);

  const isClose = lvlsLeft > 0 && lvlsLeft <= 3;

  return (
    <div style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      border:`1px solid ${cls.color}22`, borderRadius:14, position:"relative", overflow:"hidden",
      boxShadow:"0 4px 24px rgba(0,0,0,0.35)" }}>
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${cls.color}88,transparent)` }}/>

      <div style={{ padding:"18px 20px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22, filter:`drop-shadow(0 0 8px ${cls.color})`, animation:"ud2-float 3s ease-in-out infinite" }}>
              {stage.icon}
            </span>
            <div>
              <div style={{ ...raj(9,700), color:cls.color, letterSpacing:".08em" }}>{t("dash.evo.title")}</div>
              <div style={{ ...raj(12,700), color:C.white, marginTop:2 }}>
                {cls.label} · <span style={{ color:cls.color }}>{stage.label}</span>
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate("personaje")} style={{
            background:`${cls.color}14`, border:`1px solid ${cls.color}33`,
            color:cls.color, padding:"6px 14px", cursor:"pointer", borderRadius:6,
            ...raj(9,700), letterSpacing:".04em",
          }}>
            {t("dash.evo.see")}
          </button>
        </div>

        {/* Journey bar */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            {STAGES.map(s => {
              const done = stage.id > s.id;
              const on   = stage.id === s.id;
              return (
                <div key={s.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1 }}>
                  <div style={{
                    width: on ? 14 : 10, height: on ? 14 : 10, borderRadius:"50%",
                    background: done ? `${cls.color}66` : on ? cls.color : "transparent",
                    border:`2px solid ${done||on ? cls.color : C.navy}`,
                    boxShadow: on ? `0 0 10px ${cls.color}` : "none",
                    transition:"all .4s",
                    animation: on && isClose ? "ud2-ring 2s ease-in-out infinite" : undefined,
                  }}/>
                  <span style={{ ...raj(7,on?700:500), color: done ? `${cls.color}66` : on ? cls.color : C.navy, textAlign:"center" }}>
                    {s.icon}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ height:4, background:C.panel, border:`1px solid ${cls.color}18`, overflow:"hidden", position:"relative" }}>
            <div style={{
              height:"100%", width:`${Math.min(totalPct, 100)}%`,
              background:`linear-gradient(90deg,${cls.color}66,${cls.color})`,
              boxShadow:`0 0 8px ${cls.color}44`,
              transition:"width 1.5s cubic-bezier(.22,1,.36,1)",
              position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent)",
                animation:"ud2-shine 3s ease 1s 1" }}/>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          {nextStage ? (
            <div style={{
              background: isClose ? `${C.gold}12` : `${cls.color}0A`,
              border:`1px solid ${isClose ? C.gold : cls.color}33`,
              padding:"6px 14px", borderRadius:6, display:"flex", alignItems:"center", gap:8,
              animation: isClose ? "ud2-etaGlow 2s ease-in-out infinite" : undefined,
            }}>
              <span style={{ fontSize:14 }}>{nextStage.icon}</span>
              <div>
                <div style={{ ...raj(8,700), color: isClose ? C.gold : cls.color }}>
                  {isClose ? t("dash.evo.close") : t("dash.evo.next")}
                </div>
                <div style={{ ...raj(11,600), color:C.white }}>
                  {nextStage.label} — <span style={{ color: isClose ? C.gold : cls.color }}>
                    {lvlsLeft} {lvlsLeft!==1 ? t("dash.evo.niveles") : t("dash.evo.nivel")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}33`,
              padding:"6px 14px", borderRadius:6, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>👑</span>
              <span style={{ ...raj(12,700), color:C.gold }}>{t("dash.evo.max")}</span>
            </div>
          )}

          {etaText && (
            <div style={{ ...raj(11,500), color:C.muted, display:"flex", alignItems:"center", gap:5 }}>
              <TrendingUp size={12} color={C.green}/>
              <span>{t("dash.evo.eta")} <strong style={{ color:C.green }}>{etaText}</strong></span>
            </div>
          )}

          {weeklyXP > 0 && (
            <div style={{ marginLeft:"auto", ...raj(9,600), color:C.muted }}>
              <span style={{ color:C.gold }}>+{weeklyXP.toLocaleString()} XP</span> {t("dash.evo.xp_week")}
            </div>
          )}

          {streak > 0 && weeklyXP === 0 && (
            <div style={{ marginLeft:"auto", ...raj(11,600), color:C.gold }}>
              🔥 {streak}d {t("dash.evo.streak")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// XP WEEKLY CHART (SVG)
// ══════════════════════════════════════════════════════════════
function XPWeeklyChart({ data, color }) {
  const { t } = useLang();
  const maxXP   = Math.max(...data.map(d => d.xp), 1);
  const W = 220, H = 64, barW = 22, gap = 9;
  const totalW  = data.length * (barW + gap) - gap;
  const offsetX = (W - totalW) / 2;

  return (
    <div style={{ padding:"14px 18px 10px" }}>
      <div style={{ ...raj(9,700), color:C.muted, letterSpacing:".1em", marginBottom:10 }}>{t("dash.chart.xp_week")}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow:"visible" }}>
        {data.map((d, i) => {
          const barH  = d.xp > 0 ? Math.max(Math.round((d.xp / maxXP) * H), 3) : 2;
          const x     = offsetX + i * (barW + gap);
          const y     = H - barH;
          const isToday = i === data.length - 1;
          return (
            <g key={d.fecha || i}>
              <rect x={x} y={0} width={barW} height={H} fill={C.navy} rx={3}/>
              <rect x={x} y={y} width={barW} height={barH}
                fill={isToday ? color : `${color}88`} rx={3}
                style={{ transition:"height 1.2s cubic-bezier(.22,1,.36,1), y 1.2s cubic-bezier(.22,1,.36,1)" }}/>
              {isToday && d.xp > 0 && (
                <rect x={x} y={y} width={barW} height={barH}
                  fill="url(#barGlow)" rx={3} opacity={0.4}/>
              )}
              <text x={x + barW/2} y={H + 14} textAnchor="middle"
                style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:7, fill: isToday ? color : C.muted, fontWeight: isToday ? 700 : 500 }}>
                {d.dia}
              </text>
              {d.xp > 0 && (
                <text x={x + barW/2} y={y - 3} textAnchor="middle"
                  style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:6, fill:isToday?color:C.mutedL, fontWeight:600 }}>
                  {d.xp >= 1000 ? `${(d.xp/1000).toFixed(1)}k` : d.xp}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{ display:"flex", justifyContent:"flex-end", ...raj(9,600), color:C.muted, marginTop:2 }}>
        {t("dash.chart.total")} <span style={{ color:C.gold, marginLeft:4 }}>
          {data.reduce((s,d)=>s+d.xp,0).toLocaleString()} XP
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NEXT WORKOUT WIDGET (F1)
// ══════════════════════════════════════════════════════════════
function NextWorkoutWidget({ recentActivity, profile, onNavigate }) {
  const { t } = useLang();
  const cls  = CLS[profile?.heroClass] || CLS.GUERRERO;
  const last = recentActivity?.[0] || null;

  return (
    <div style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      border:`1px solid ${cls.color}33`, borderRadius:14,
      padding:"16px 20px", display:"flex", alignItems:"center", gap:16,
      position:"relative", overflow:"hidden",
      boxShadow:"0 4px 24px rgba(0,0,0,0.35)" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${cls.color}aa,transparent)` }}/>
      <div style={{ width:44, height:44, background:`${cls.color}14`, border:`1px solid ${cls.color}33`,
        borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
        {last ? last.icon : "🏋️"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ ...raj(8,700), color:cls.color, letterSpacing:".1em", marginBottom:3 }}>
          {t("dash.nw.label")}
        </div>
        <div style={{ ...raj(13,700), color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {last ? `${t("dash.nw.repeat")} ${last.name}` : t("dash.nw.first")}
        </div>
        {last && (
          <div style={{ ...raj(10,500), color:C.muted, marginTop:2 }}>
            {t("dash.nw.last")} {last.time} · <span style={{ color:C.gold }}>{last.xp}</span>
          </div>
        )}
      </div>
      <button className="ud2-btn" onClick={() => onNavigate(last ? "ejercicios" : "rutinas")}
        style={{ ...raj(9,700), color:"#fff", background:`linear-gradient(135deg,${cls.color},${cls.color}bb)`,
          border:`1px solid ${cls.color}66`, padding:"8px 16px", cursor:"pointer", borderRadius:6,
          display:"flex", alignItems:"center", gap:6, flexShrink:0,
          boxShadow:`0 4px 16px ${cls.color}44` }}>
        <Play size={10} fill="#fff"/> {t("dash.nw.go")}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WEEKLY RANKING MODULE
// ══════════════════════════════════════════════════════════════
function WeeklyRankingModule({ weeklyLeaderboard, currentUserUid, openModule, onToggle, onRefresh, refreshing, heroClass }) {
  const { t } = useLang();
  const [weeklyTab, setWeeklyTab] = useState("GUERRERO");
  const weeklyTabInit = useRef(false);
  useEffect(() => {
    if (!weeklyTabInit.current && heroClass) {
      weeklyTabInit.current = true;
      setWeeklyTab(heroClass);
    }
  }, [heroClass]);

  const wData     = weeklyLeaderboard || { GUERRERO:[], ARQUERO:[], MAGO:[], week:"" };
  const entries   = (wData[weeklyTab] || []).slice(0, 10);
  const myEntry   = entries.find(u => u.uid === currentUserUid);
  const tabColor  = { GUERRERO:C.red, ARQUERO:C.blue, MAGO:C.purple }[weeklyTab] || C.orange;
  const BADGE_ICONS = ["👑","🥈","🥉"];
  const BADGE_GLOW  = [C.gold, "#94A3B8", C.orange];

  const weekLabel = (() => {
    if (!wData.week) return t("dash.wrank.current");
    const [yr, wn] = wData.week.split("-W");
    return `${t("dash.wrank.week")} ${parseInt(wn)} · ${yr}`;
  })();

  return (
    <Module id="weekly-ranking" title={t("dash.wrank.title")}
      subtitle={myEntry ? `${t("dash.wrank.my_pos")} #${myEntry.pos}` : weekLabel}
      icon={Trophy} color={C.gold}
      expanded={openModule==="weekly-ranking"} onToggle={()=>onToggle("weekly-ranking")}
      rightSlot={
        <button onClick={e=>{e.stopPropagation();onRefresh?.();}}
          disabled={refreshing}
          style={{ background:"transparent", border:"none", cursor:"pointer",
            ...raj(11,600), color:refreshing?C.muted:C.gold,
            display:"flex", alignItems:"center", gap:4, padding:0 }}>
          <span style={{ display:"inline-block", animation:refreshing?"ud2-spin .8s linear infinite":"none" }}>↻</span>
        </button>
      }
    >
      <div>
        {/* Class tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${C.navy}44`, padding:"0 18px" }}>
          {["GUERRERO","ARQUERO","MAGO"].map(cls => {
            const on  = weeklyTab === cls;
            const col = { GUERRERO:C.red, ARQUERO:C.blue, MAGO:C.purple }[cls];
            const icon= { GUERRERO:"⚔️", ARQUERO:"🏃", MAGO:"🧘" }[cls];
            const cnt = (wData[cls]||[]).filter(u=>u.weeklyXP>0).length;
            return (
              <button key={cls} onClick={()=>setWeeklyTab(cls)}
                style={{ flex:1, padding:"10px 4px", background:"transparent", border:"none",
                  borderBottom:`2px solid ${on?col:"transparent"}`,
                  cursor:"pointer", display:"flex", flexDirection:"column",
                  alignItems:"center", gap:3, transition:"all .18s" }}>
                <span style={{ fontSize:15, filter:on?`drop-shadow(0 0 6px ${col})`:"none" }}>{icon}</span>
                <span style={{ ...raj(8,on?700:500), color:on?col:C.muted, letterSpacing:".04em" }}>{cls}</span>
                {cnt>0 && (
                  <span style={{ ...raj(7,700), color:on?col:C.muted,
                    background:`${on?col:C.muted}18`, border:`1px solid ${on?col:C.muted}33`,
                    padding:"1px 5px", borderRadius:3 }}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Week label */}
        <div style={{ padding:"8px 18px", borderBottom:`1px solid ${C.navy}22`,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ ...raj(9,600), color:C.muted, letterSpacing:".06em" }}>
            🗓 {weekLabel.toUpperCase()}
          </span>
          {myEntry && (
            <span style={{ ...raj(9,700), color:tabColor, background:`${tabColor}18`,
              border:`1px solid ${tabColor}33`, padding:"2px 8px", borderRadius:3 }}>
              TÚ #{myEntry.pos}
            </span>
          )}
        </div>

        {/* Rows */}
        {entries.length === 0 || entries.every(e=>e.weeklyXP===0) ? (
          <div style={{ padding:"28px 18px", textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8, opacity:.4 }}>🏆</div>
            <div style={{ ...raj(13,600), color:C.muted }}>{t("dash.wrank.empty")}</div>
            <div style={{ ...raj(11,400), color:C.muted, marginTop:4 }}>{t("dash.wrank.first")}</div>
          </div>
        ) : entries.map((u, i) => {
          const isPodium = i < 3 && u.weeklyXP > 0;
          const isMeRow  = u.uid === currentUserUid;
          const rowColor = isPodium ? BADGE_GLOW[i] : tabColor;
          return (
            <div key={u.uid} style={{ display:"flex", alignItems:"center", gap:12,
              padding:"11px 18px", borderBottom:`1px solid ${C.navy}22`,
              background: isMeRow ? `${tabColor}0C` : isPodium ? `${BADGE_GLOW[i]}06` : "transparent",
              borderLeft:`3px solid ${isMeRow?tabColor:isPodium?BADGE_GLOW[i]+"44":"transparent"}`,
              transition:"background .2s", opacity: u.weeklyXP===0?.35:1 }}>
              <div style={{ width:26, textAlign:"center", flexShrink:0 }}>
                {isPodium
                  ? <span style={{ fontSize:16, filter:`drop-shadow(0 0 8px ${BADGE_GLOW[i]})`,
                      display:"inline-block", animation:i===0?"ud2-celebrate 3s ease-in-out infinite":"none" }}>
                      {BADGE_ICONS[i]}
                    </span>
                  : <span style={{ ...raj(10,700), color:C.muted }}>#{u.pos}</span>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ ...raj(13,isMeRow?700:600),
                  color:isMeRow?tabColor:isPodium?rowColor:C.white,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {u.nombre}{isMeRow && ` ${t("dash.rank.me")}`}
                </div>
                <div style={{ ...raj(9,600), color:tabColor, marginTop:1, opacity:.7 }}>
                  Lv.{u.nivel}{u.streak>0 && ` · 🔥${u.streak}d`}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ ...raj(12,700), color:u.weeklyXP>0?C.gold:C.muted }}>
                  {u.weeklyXP>0 ? `+${u.weeklyXP.toLocaleString()}` : "—"}
                </div>
                <div style={{ ...raj(8,500), color:C.muted }}>XP SEMANA</div>
              </div>
              {isPodium && u.weeklyXP>0 && (
                <div style={{ width:3, alignSelf:"stretch", background:BADGE_GLOW[i],
                  boxShadow:`0 0 8px ${BADGE_GLOW[i]}`, flexShrink:0, marginLeft:4 }}/>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div style={{ padding:"10px 18px", display:"flex", alignItems:"center", gap:8,
          background:`${C.gold}06`, borderTop:`1px solid ${C.navy}44` }}>
          <span style={{ fontSize:13 }}>✨</span>
          <span style={{ ...raj(8,500), color:C.muted, lineHeight:1.5 }}>
            Top 3 de cada clase reciben badge permanente en su perfil al finalizar la semana
          </span>
        </div>
      </div>
    </Module>
  );
}

// ══════════════════════════════════════════════════════════════
// HOME VIEW — unused (home tab renders <UserHome> from ./UserHome)
// ══════════════════════════════════════════════════════════════
function HomeView({ profile, levelUpCelebration, setLevelUpCelebration, missions:rawMissions,
  recentActivity:rawActivity, leaderboard:rawLeaderboard, userLogros:rawLogros,
  userStats, currentUserUid, onRefreshLeaderboard, leaderboardRefreshing,
  weeklyLeaderboard, onRefreshWeeklyLeaderboard, weeklyLBRefreshing,
  weeklyXPData, focusMode, onExitFocus, onNavigate,
  onChallengeComplete, onProfileUpdate }) {

  const { t } = useLang();
  const p   = profile || {};
  const cls = CLS[p.heroClass] || CLS.GUERRERO;
  const xpPct = p.xpNext ? Math.min(Math.round(((p.xp||0)/p.xpNext)*100),100) : 0;
  const [openModule, setOpenModule] = useState(() => {
    try { return localStorage.getItem("fv_dash_module") || null; } catch { return null; }
  });
  const moduleRefs = useRef({});
  const toggle = (id) => setOpenModule(prev => {
    const next = prev === id ? null : id;
    try { localStorage.setItem("fv_dash_module", next || ""); } catch {}
    if (next) {
      setTimeout(() => {
        moduleRefs.current[next]?.scrollIntoView({ behavior:"smooth", block:"nearest" });
      }, 60);
    }
    return next;
  });

  // ── Normalizar datos ───────────────────────────────────────
  const missions = rawMissions?.length > 0 ? rawMissions.slice(0,5).map(m => {
    const exp = m.expiresAt ? timeUntil(m.expiresAt, t) : { label: m.expires||"--", urgent:false };
    return {
      id: m.id, title:m.titulo||m.title||"Misión",
      type:m.tipo||m.type||"Diaria", xp:m.xp||0,
      done:!!(m.reclamada||m.estado==="completada"),
      icon:m.icono||m.icon||"🎯",
      progress:m.progreso??m.progress??0, total:m.total||1,
      expires:exp.label, urgent:exp.urgent,
    };
  }) : [];

  const activity = rawActivity?.length > 0 ? rawActivity.slice(0,5).map(a => ({
    icon:a.icon||"💪", name:a.name||"Entrenamiento",
    sets:a.metadata?.sets||"--", xp:`+${a.xp||0} XP`,
    time:timeAgo(a.time, t), color:a.color||C.orange,
    ts: a.time ? new Date(a.time).getTime() : Date.now(),
  })) : [];

  const leaderboard = rawLeaderboard?.length > 0 ? rawLeaderboard.slice(0,5).map(u => ({
    pos:u.pos, name:u.nombre||u.name||"Héroe",
    level:u.nivel||u.level||1, xp:u.xp||0,
    clase:u.clase||u.heroClass||"GUERRERO", isMe:u.uid===currentUserUid,
  })) : [];

  const logros = rawLogros?.length > 0 ? rawLogros.slice(0,4).map(l => ({
    icon:l.icon||"🏆", name:l.nombre||l.title||"Trofeo",
    rareza:l.rareza||"Común", color:l.color||C.blue, isNew:l.isNew||false,
    desc: l.descripcion||l.description||"",
    date: l.obtainedAt||l.unlockedAt||l.fechaObtenido||null,
  })) : [];
  const [logroHover, setLogroHover] = useState(null);

  const badgeCount = userStats?.logrosObtenidos ?? (Array.isArray(p.badges)?p.badges.length:(p.badges||0));
  const pendingMissions = missions.filter(m=>!m.done).length;
  const myPos = leaderboard.find(u=>u.isMe)?.pos || null;
  // User's full entry when outside top-5 (rawLeaderboard may have more entries)
  const myRawEntry = !myPos ? rawLeaderboard?.find?.(u => u.uid === currentUserUid) : null;
  const myOutsideEntry = myRawEntry ? {
    pos: myRawEntry.pos, name: myRawEntry.nombre||myRawEntry.name||"Tú",
    level: myRawEntry.nivel||myRawEntry.level||1, xp: myRawEntry.xp||0,
    clase: myRawEntry.clase||myRawEntry.heroClass||"GUERRERO", isMe:true,
  } : null;

  // ── Focus mode: minimal view ──────────────────────────────
  if (focusMode) return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 16px", borderRadius:8, background:`${C.gold}10`, border:`1px solid ${C.gold}33` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Zap size={13} color={C.gold}/>
          <span style={{ ...raj(9,700), color:C.gold, letterSpacing:".1em" }}>{t("dash.focus.active")}</span>
        </div>
        <button onClick={onExitFocus}
          style={{ ...raj(9,700), color:C.muted, background:"transparent",
            border:`1px solid ${C.navy}`, padding:"3px 10px", borderRadius:4, cursor:"pointer" }}>
          {t("dash.focus.exit_btn")}
        </button>
      </div>
      <div className="ud2-s0" style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)",
        border:`1px solid ${cls.color}33`, borderRadius:14,
        position:"relative", overflow:"hidden",
        boxShadow:`0 0 40px ${cls.color}10, 0 8px 40px rgba(0,0,0,.5)` }}>
        <div style={{ height:2, background:`linear-gradient(90deg,transparent,${cls.color}cc,transparent)` }} />
        <div style={{ padding:"24px 28px", display:"flex", alignItems:"center", gap:20 }}>
          <SidebarAvatar profile={p} cls={cls} size={64}/>
          <div style={{ flex:1 }}>
            <div style={{ ...orb("clamp(18px,2.5vw,26px)",900), color:C.white, marginBottom:6 }}>
              {p.username?.toUpperCase() || "HÉROE"}
            </div>
            <div style={{ ...raj(11,600), color:C.muted, marginBottom:10 }}>
              {cls.icon} {p.heroClass} · Lv.{p.level||1} · {(p.xp||0).toLocaleString()} XP
            </div>
            <div style={{ height:6, background:C.panel, border:`1px solid ${C.gold}22`, overflow:"hidden", maxWidth:300, borderRadius:3 }}>
              <div style={{ height:"100%", width:`${xpPct}%`,
                background:`linear-gradient(90deg,${C.gold}66,${C.gold})`,
                transition:"width 1.8s cubic-bezier(.22,1,.36,1)" }}/>
            </div>
          </div>
        </div>
      </div>
      <motion.button
        whileHover={{ scale:1.03, boxShadow:`0 8px 36px ${cls.color}55` }}
        whileTap={{ scale:.97 }}
        className="ud2-btn" onClick={() => onNavigate("ejercicios")}
        style={{ background:`linear-gradient(135deg,${cls.color},${cls.color}bb)`,
          border:`1px solid ${cls.color}66`, padding:"22px 36px", borderRadius:10,
          ...raj(15,700), color:"#fff", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:12,
          boxShadow:`0 6px 28px ${cls.color}44`, letterSpacing:".04em" }}>
        <Play size={16} fill="#fff"/> ENTRAR AL CAMPO
      </motion.button>
      {activity[0] && (
        <div style={{ ...raj(12,500), color:C.muted, textAlign:"center" }}>
          Última hazaña: <span style={{ color:C.white }}>{activity[0].name}</span> · {activity[0].time}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, position:"relative" }}>

      {/* ── STREAK CHALLENGE ── */}
      <StreakChallengeCard
        profile={profile}
        onNavigate={onNavigate}
        onChallengeComplete={(bonus) => {
          onChallengeComplete?.(bonus);
          onProfileUpdate?.({
            coins: (profile?.coins || 0) + bonus.coins,
            xp:    (profile?.xp    || 0) + bonus.xp,
          });
        }}
      />

      {/* Level-up ceremony is rendered at dashboard root, not here */}

      {/* ── HERO CARD ── */}
      <div className="ud2-s0" style={{ background:"rgba(20,26,42,0.85)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        border:`1px solid ${cls.color}33`, borderRadius:14, position:"relative", overflow:"hidden",
        boxShadow:`0 0 40px ${cls.color}10, 0 8px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,0.04)` }}>
        <div style={{ height:2, background:`linear-gradient(90deg,transparent,${cls.color}cc,${cls.color}88,transparent)` }} />
        {/* Animated spotlight orbs */}
        <motion.div
          animate={{ x:[0,80,-60,0], y:[0,-40,60,0], scale:[1,1.2,.92,1] }}
          transition={{ duration:18, repeat:Infinity, ease:"easeInOut" }}
          style={{ position:"absolute", width:380, height:380, left:"5%", top:"30%",
            borderRadius:"50%", background:`radial-gradient(circle,${cls.color} 0%,transparent 70%)`,
            filter:"blur(70px)", opacity:.07, pointerEvents:"none", transform:"translateY(-50%)" }}/>
        <motion.div
          animate={{ x:[0,-50,40,0], y:[0,50,-30,0], scale:[1,.9,1.1,1] }}
          transition={{ duration:22, repeat:Infinity, ease:"easeInOut" }}
          style={{ position:"absolute", width:240, height:240, right:"5%", top:"20%",
            borderRadius:"50%", background:`radial-gradient(circle,${C.gold} 0%,transparent 70%)`,
            filter:"blur(60px)", opacity:.06, pointerEvents:"none", transform:"translateY(-50%)" }}/>
        {/* Grid overlay */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:`linear-gradient(${cls.color}07 1px,transparent 1px),linear-gradient(90deg,${cls.color}07 1px,transparent 1px)`,
          backgroundSize:"40px 40px" }} />
        {/* Scan line */}
        <div className="ud2-scan" style={{ position:"absolute", left:0, right:0, height:1,
          background:`linear-gradient(90deg,transparent,${cls.color}33,transparent)`, pointerEvents:"none" }} />
        {/* Bottom glow line */}
        <div className="ud2-hero-glow" style={{ position:"absolute", bottom:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg,transparent,${cls.color}55,transparent)`, pointerEvents:"none" }}/>

        <div style={{ padding:"20px 24px", position:"relative", zIndex:1 }} className="hero-grid">

          {/* Left: avatar + class + level */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, minWidth:120 }}>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <SidebarAvatar profile={p} cls={cls} size={52}/>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8,
              background:`${cls.color}12`, border:`1px solid ${cls.color}33`, padding:"8px 12px", borderRadius:8 }}>
              <span style={{ fontSize:16 }}>{cls.icon}</span>
              <div>
                <div style={{ ...raj(8,700), color:cls.color, letterSpacing:".06em" }}>{p.heroClass||"GUERRERO"}</div>
                <div style={{ ...raj(10,400), color:C.muted, marginTop:1 }}>{cls.primary}</div>
              </div>
            </div>
            <div style={{ background:`${C.gold}10`, border:`1px solid ${C.gold}28`, padding:"10px 12px", borderRadius:8 }}>
              <div style={{ ...raj(9,600), color:C.muted, marginBottom:2, letterSpacing:".08em", textTransform:"uppercase" }}>Rango</div>
              <div style={{ ...orb(26,900), color:C.gold, lineHeight:1 }}>{p.level||1}</div>
            </div>
            {(p.streak||0)>0 && (
              <div style={{ display:"flex", alignItems:"center", gap:6, ...raj(12,700), color:C.gold }}>
                <span className="ud2-fire" style={{ fontSize:14 }}>🔥</span>
                {p.streak}d de disciplina
              </div>
            )}
          </div>

          {/* Center: greeting + username + XP */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
            {(() => {
              const h = new Date().getHours();
              const greet = h < 12 ? t("dash.greet.morning") : h < 18 ? t("dash.greet.afternoon") : t("dash.greet.evening");
              return (
                <div style={{ ...raj(11,500), color:C.muted, letterSpacing:".04em", textAlign:"center" }}>
                  {greet}, <span style={{ color:cls.color, fontWeight:700 }}>{p.username||t("dash.hero")}</span>
                </div>
              );
            })()}
            {p.username ? (
              <div style={{ ...orb("clamp(16px,2vw,22px)",900), textAlign:"center",
                background:`linear-gradient(135deg,${C.white},${cls.color})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                {p.username.toUpperCase()}
              </div>
            ) : <Skel w={160} h={22}/>}

            {/* Hero glow line */}
            <div style={{ width:"100%", maxWidth:280, height:1,
              background:`linear-gradient(90deg,transparent,${cls.color}88,transparent)`, opacity:.6 }}/>

            <div style={{ width:"100%", maxWidth:280 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, ...raj(10,600), color:C.muted }}>
                <span>XP físico · Rango {p.level}</span>
                <span style={{ color:C.gold }}>{(p.xp||0).toLocaleString()} / {(p.xpNext||1000).toLocaleString()}</span>

              </div>
              <div style={{ height:7, background:C.panel, border:`1px solid ${C.gold}22`, overflow:"hidden", position:"relative", borderRadius:4 }}>
                <div style={{ height:"100%", width:`${xpPct}%`, background:`linear-gradient(90deg,${C.gold}66,${C.gold})`,
                  boxShadow:`0 0 10px ${C.gold}55`, transition:"width 1.8s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)", animation:"ud2-shine 2s ease 1s 1" }} />
                </div>
              </div>
              <div style={{ ...raj(10,400), color:C.muted, marginTop:3, textAlign:"center" }}>
                {xpPct}% — {t("dash.xp_missing")} {((p.xpNext||1000)-(p.xp||0)).toLocaleString()} {t("dash.xp_to_lv")}{(p.level||1)+1}
              </div>
            </div>
          </div>

          {/* Right: stats */}
          <div className="hero-stats-col">
            <div style={{ ...raj(9,700), color:C.muted, letterSpacing:".1em", marginBottom:12, flexBasis:"100%" }}>{t("dash.stats_title")}</div>
            {[
              [t("dash.stat.fuerza"),      cls.stats.fuerza,      cls.color],
              [t("dash.stat.resistencia"), cls.stats.resistencia,  C.blue],
              [t("dash.stat.agilidad"),    cls.stats.agilidad,     C.purple],
              [t("dash.stat.vitalidad"),   cls.stats.vitalidad,    C.green],
            ].map(([label,val,color]) => (
              <div key={label} className="hero-stat-row">
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, ...raj(10,600), color:C.muted }}>
                  <span>{label}</span><span style={{ color }}>{val}</span>
                </div>
                <MiniBar val={val} max={100} color={color} h={4}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NEXT WORKOUT WIDGET ── */}
      <div className="ud2-s1">
        <NextWorkoutWidget recentActivity={activity} profile={p} onNavigate={onNavigate}/>
      </div>

      {/* ── QUICK STATS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatPill index={0} icon="⚡" label={t("dash.pill.xp")}     value={(p.xp||0).toLocaleString()} color={C.gold}   sub={t("dash.pill.xp_sub")} />
        <StatPill index={1} icon="🔥" label={t("dash.pill.streak")} value={`${p.streak||0}`}           color={cls.color} sub={t("dash.pill.streak_sub")} />
        <StatPill index={2} icon="🏆" label={t("dash.pill.logros")} value={String(badgeCount)}          color={C.blue}   sub={t("dash.pill.logros_sub")} />
        <StatPill index={3} icon="💰" label={t("dash.pill.coins")}  value={String(p.coins||0)}          color={C.purple} sub={t("dash.pill.coins_sub")} />
      </div>

      {/* ── CHARACTER EVOLUTION ── */}
      <div className="ud2-s2" style={{ display:"grid", gridTemplateColumns: weeklyXPData.length ? "1fr auto" : "1fr", gap:0, borderRadius:14, overflow:"hidden" }}>
        <CharacterEvolutionCard profile={p} userStats={userStats} onNavigate={onNavigate}/>
        {weeklyXPData.length > 0 && (
          <div style={{ background:"rgba(20,26,42,0.78)", backdropFilter:"blur(12px)",
            border:`1px solid ${C.navy}`, borderLeft:"none", minWidth:260 }}>
            <XPWeeklyChart data={weeklyXPData} color={cls.color}/>
          </div>
        )}
      </div>

      {/* ── MÓDULO: MISIONES ── */}
      <div className="ud2-s3" ref={el=>moduleRefs.current["misiones"]=el}><Module id="misiones" title={t("dash.mis.title")}
        subtitle={pendingMissions > 0 ? `${pendingMissions} ${pendingMissions>1 ? t("dash.mis.pending_pl") : t("dash.mis.pending")}` : t("dash.mis.all_clear")}
        icon={Target} color={cls.color}
        badge={pendingMissions > 0 ? String(pendingMissions) : null}
        expanded={openModule==="misiones"} onToggle={()=>toggle("misiones")}
        rightSlot={
          <button className="ud2-btn" onClick={e=>{e.stopPropagation();onNavigate("misiones");}}
            style={{ ...raj(9,700), color:cls.color, background:`${cls.color}10`, border:`1px solid ${cls.color}33`,
              padding:"4px 10px", cursor:"pointer", borderRadius:4 }}>
            {t("dash.mis.see_all")}
          </button>
        }
      >
        <div style={{ padding:"16px 18px 18px", display:"flex", flexDirection:"column", gap:10 }}>
          {missions.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", opacity:.7 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🎯</div>
              <div style={{ ...raj(13,600), color:C.muted }}>{t("dash.mis.empty")}</div>
            </div>
          ) : missions.map((m,i) => {
            const typeColor = m.type==="Diaria" ? cls.color : C.blue;
            return (
              <div key={m.id} className="ud2-mission-row" style={{
                display:"flex", alignItems:"center", gap:12,
                background: m.done ? `${C.green}06` : m.urgent ? `${C.red}06` : `${C.navy}22`,
                border:`1px solid ${m.done?C.green+"20":m.urgent?C.red+"20":C.navy+"44"}`,
                padding:"11px 14px", borderRadius:6,
              }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{m.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ ...raj(13,700), color:m.done?C.green:m.urgent?C.red:C.white }}>{m.title}</span>
                    <span style={{ ...raj(9,700), color:typeColor, background:`${typeColor}14`,
                      border:`1px solid ${typeColor}28`, padding:"1px 6px", borderRadius:3 }}>{m.type}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ ...raj(11,700), color:C.gold }}>+{m.xp} XP</span>
                    {!m.done && <span style={{ ...raj(10,400), color:m.urgent?C.red:C.muted }}>⏳ {m.expires}</span>}
                  </div>
                  {!m.done && m.total > 1 && (
                    <div style={{ marginTop:6 }}>
                      <MiniBar val={m.progress} max={m.total} color={typeColor} h={3}/>
                      <div style={{ ...raj(9,500), color:C.muted, marginTop:2 }}>{m.progress}/{m.total}</div>
                    </div>
                  )}
                </div>
                {m.done
                  ? <Check size={14} color={C.green}/>
                  : <button className="ud2-btn" onClick={()=>onNavigate("misiones")}
                      style={{ ...raj(9,700), color:cls.color, background:`${cls.color}12`,
                        border:`1px solid ${cls.color}33`, padding:"5px 10px", cursor:"pointer", borderRadius:4 }}>{t("dash.mis.go")}</button>
                }
              </div>
            );
          })}
        </div>
      </Module></div>

      {/* ── MÓDULO: ACTIVIDAD RECIENTE ── */}
      <div className="ud2-s4" ref={el=>moduleRefs.current["actividad"]=el}><Module id="actividad" title={t("dash.act.title")}
        subtitle={activity.length > 0 ? `${activity.length} ${t("dash.act.sessions")}` : t("dash.act.no_yet")}
        icon={Clock} color={C.blue}
        expanded={openModule==="actividad"} onToggle={()=>toggle("actividad")}
        rightSlot={
          <button className="ud2-btn" onClick={e=>{e.stopPropagation();onNavigate("ejercicios");}}
            style={{ ...raj(9,700), color:C.blue, background:`${C.blue}10`, border:`1px solid ${C.blue}33`,
              padding:"4px 10px", cursor:"pointer", borderRadius:4 }}>
            {t("dash.act.train")}
          </button>
        }
      >
        <div style={{ padding:"12px 18px 18px" }}>
          {activity.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", opacity:.7 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💤</div>
              <div style={{ ...raj(13,600), color:C.muted }}>{t("dash.act.empty")}</div>
              <div style={{ ...raj(11,400), color:C.muted, marginTop:4 }}>{t("dash.act.empty_sub")}</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {(() => {
                const groups = [];
                let lastGroup = null;
                activity.forEach((a, i) => {
                  const g = getTimeGroup(a.ts, t);
                  if (g !== lastGroup) { groups.push({ type:"header", label:g }); lastGroup = g; }
                  groups.push({ type:"item", a, i });
                });
                return groups.map((entry, idx) => {
                  if (entry.type === "header") return (
                    <div key={`h-${idx}`} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px 4px" }}>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${C.navy},transparent)` }}/>
                      <span style={{ ...raj(9,700), color:C.muted, letterSpacing:".1em", flexShrink:0 }}>{entry.label.toUpperCase()}</span>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg,transparent,${C.navy})` }}/>
                    </div>
                  );
                  const { a, i } = entry;
                  return (
                    <div key={i} className="ud2-activity-row" style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"10px 12px", border:`1px solid ${C.navy}44`, background:`${C.navy}11`,
                      borderRadius:6,
                    }}>
                      <div style={{ width:34, height:34, background:`${a.color}14`, border:`1px solid ${a.color}28`,
                        borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{a.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ ...raj(13,700), color:C.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                        <div style={{ ...raj(10,500), color:C.muted, marginTop:2 }}>{a.sets}</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ ...raj(11,700), color:C.gold }}>{a.xp}</div>
                        <div style={{ ...raj(10,400), color:C.muted }}>{a.time}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </Module></div>

      {/* ── MÓDULO: LOGROS ── */}
      <div className="ud2-s5" ref={el=>moduleRefs.current["logros"]=el}><Module id="logros" title={t("dash.log.title")}
        subtitle={badgeCount > 0 ? `${badgeCount} ${badgeCount>1 ? t("dash.log.unlocked_pl") : t("dash.log.unlocked")}` : t("dash.log.none")}
        icon={Trophy} color={C.gold}
        badge={logros.some(l=>l.isNew) ? "NEW" : null}
        expanded={openModule==="logros"} onToggle={()=>toggle("logros")}
        rightSlot={
          <button className="ud2-btn" onClick={e=>{e.stopPropagation();onNavigate("logros");}}
            style={{ ...raj(9,700), color:C.gold, background:`${C.gold}10`, border:`1px solid ${C.gold}33`,
              padding:"4px 10px", cursor:"pointer", borderRadius:4 }}>
            {t("dash.log.see_all")}
          </button>
        }
      >
        <div style={{ padding:"12px 18px 18px", display:"flex", flexDirection:"column", gap:8 }}>
          {logros.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 0", opacity:.7 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🏆</div>
              <div style={{ ...raj(13,600), color:C.muted }}>{t("dash.log.empty")}</div>
              <div style={{ ...raj(11,400), color:C.muted, marginTop:4 }}>{t("dash.log.empty_sub")}</div>
            </div>
          ) : logros.map((l,i) => (
            <div key={i} style={{ position:"relative" }}
              onMouseEnter={() => setLogroHover(i)}
              onMouseLeave={() => setLogroHover(null)}>
              <div style={{ display:"flex", alignItems:"center", gap:12,
                padding:"10px 14px", background:`${l.color}08`, border:`1px solid ${l.color}18`,
                borderRadius:6, cursor:"default", transition:"background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background=`${l.color}14`}
                onMouseLeave={e => e.currentTarget.style.background=`${l.color}08`}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`${l.color}18`,
                  border:`2px solid ${l.color}44`, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:18, flexShrink:0 }}>{l.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ ...raj(13,700), color:C.white, marginBottom:3 }}>{l.name}</div>
                  <span style={{ ...raj(9,700), color:l.color, background:`${l.color}14`,
                    border:`1px solid ${l.color}28`, padding:"1px 6px", borderRadius:3 }}>{l.rareza}</span>
                </div>
                {l.isNew && (
                  <span style={{ ...raj(8,700), color:C.bg, background:C.orange,
                    padding:"2px 6px", borderRadius:3, animation:"ud2-badgePop .5s ease both" }}>{t("dash.log.new")}</span>
                )}
              </div>
              {logroHover === i && (
                <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, zIndex:50,
                  background:"rgba(20,26,42,0.95)", backdropFilter:"blur(16px)",
                  border:`1px solid ${l.color}44`,
                  boxShadow:`0 8px 28px rgba(0,0,0,.6), 0 0 0 1px ${l.color}18`,
                  padding:"12px 14px", minWidth:220, maxWidth:300, borderRadius:8,
                  animation:"ud2-slideUp .18s ease both" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg,transparent,${l.color}88,transparent)` }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{l.icon}</span>
                    <div>
                      <div style={{ ...raj(12,700), color:C.white }}>{l.name}</div>
                      <span style={{ ...raj(8,700), color:l.color, background:`${l.color}14`,
                        border:`1px solid ${l.color}33`, padding:"1px 5px", borderRadius:3 }}>{l.rareza}</span>
                    </div>
                  </div>
                  {l.desc && (
                    <div style={{ ...raj(11,400), color:C.mutedL, lineHeight:1.5, marginBottom:6 }}>
                      {l.desc}
                    </div>
                  )}
                  {l.date && (
                    <div style={{ ...raj(9,500), color:C.muted }}>
                      🗓 {new Date(l.date).toLocaleDateString("es-ES",{ day:"2-digit", month:"short", year:"numeric" })}
                    </div>
                  )}
                  <div style={{ position:"absolute", bottom:-5, left:22, width:10, height:10,
                    background:"rgba(20,26,42,0.95)", border:`1px solid ${l.color}44`,
                    borderTop:"none", borderLeft:"none", transform:"rotate(45deg)" }}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </Module></div>

      {/* ── MÓDULO: RANKING ── */}
      <div className="ud2-s6" ref={el=>moduleRefs.current["ranking"]=el}><Module id="ranking" title={t("dash.rank.title")}
        subtitle={myPos ? `${t("dash.rank.my_pos")} #${myPos}` : t("dash.rank.no_pos")}
        icon={BarChart2} color={C.purple}
        expanded={openModule==="ranking"} onToggle={()=>toggle("ranking")}
        rightSlot={
          <button onClick={e=>{e.stopPropagation();onRefreshLeaderboard();}} disabled={leaderboardRefreshing}
            style={{ background:"transparent", border:"none", cursor:"pointer", ...raj(11,600),
              color:leaderboardRefreshing?C.muted:C.purple, display:"flex", alignItems:"center", gap:4, padding:0 }}>
            <span style={{ display:"inline-block", animation:leaderboardRefreshing?"ud2-spin .8s linear infinite":"none" }}>↻</span>
          </button>
        }
      >
        <div>
          {leaderboard.length === 0 ? (
            <div style={{ padding:"24px 18px", textAlign:"center", opacity:.7 }}>
              <div style={{ ...raj(13,600), color:C.muted }}>{t("dash.rank.empty")}</div>
            </div>
          ) : (<>
            {leaderboard.map((u,i) => {
              const medals = ["🥇","🥈","🥉"];
              const podiumC = [C.gold,"#94A3B8",C.orange];
              const clsColor = { GUERRERO:C.red, ARQUERO:C.blue, MAGO:C.purple };
              const isPodium = i < 3;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"11px 18px", borderBottom:`1px solid ${C.navy}22`,
                  background: u.isMe ? `${cls.color}0A` : isPodium ? `${podiumC[i]}04` : "transparent",
                  borderLeft:`3px solid ${u.isMe?cls.color:isPodium?podiumC[i]+"44":"transparent"}`,
                  transition:"background .2s" }}>
                  <div style={{ width:22, textAlign:"center", fontSize:isPodium?15:11,
                    color:isPodium?podiumC[i]:C.muted, ...(isPodium?{}:{...raj(11,700)}) }}>
                    {isPodium ? medals[i] : `#${u.pos}`}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ ...raj(13,u.isMe?700:600), color:u.isMe?cls.color:C.white,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {u.name}{u.isMe&&` ${t("dash.rank.me")}`}
                    </div>
                    <div style={{ ...raj(10,600), color:clsColor[u.clase]||C.muted, marginTop:1 }}>{u.clase}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ ...raj(12,700), color:C.gold }}>Lv.{u.level}</div>
                    <div style={{ ...raj(10,400), color:C.muted }}>{u.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              );
            })}
            {myOutsideEntry && (
              <>
                <div style={{ padding:"5px 18px", display:"flex", alignItems:"center", gap:6, opacity:.5 }}>
                  <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${C.navy},transparent)` }}/>
                  <span style={{ ...raj(10,600), color:C.muted }}>···</span>
                  <div style={{ height:1, flex:1, background:`linear-gradient(90deg,transparent,${C.navy})` }}/>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"11px 18px", borderBottom:`1px solid ${C.navy}22`,
                  background:`${cls.color}0A`, borderLeft:`3px solid ${cls.color}` }}>
                  <div style={{ width:22, textAlign:"center", ...raj(11,700), color:cls.color }}>
                    #{myOutsideEntry.pos}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ ...raj(13,700), color:cls.color,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {myOutsideEntry.name} {t("dash.rank.me")}
                    </div>
                    <div style={{ ...raj(10,600), color:C.muted, marginTop:1 }}>{myOutsideEntry.clase}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ ...raj(12,700), color:C.gold }}>Lv.{myOutsideEntry.level}</div>
                    <div style={{ ...raj(10,400), color:C.muted }}>{myOutsideEntry.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              </>
            )}
          </>)}
        </div>
      </Module></div>

      {/* ── MÓDULO: RANKING SEMANAL ── */}
      <div className="ud2-s7" ref={el=>moduleRefs.current["weekly-ranking"]=el}>
        <WeeklyRankingModule
          weeklyLeaderboard={weeklyLeaderboard}
          currentUserUid={currentUserUid}
          openModule={openModule}
          onToggle={toggle}
          onRefresh={onRefreshWeeklyLeaderboard}
          refreshing={weeklyLBRefreshing}
          heroClass={p.heroClass}
        />
      </div>

      {/* ── CTA ACCIÓN ── */}
      <div style={{ background:"rgba(20,26,42,0.85)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        border:`1px solid ${cls.color}44`, borderRadius:14, padding:"28px",
        textAlign:"center", position:"relative", overflow:"hidden",
        boxShadow:`0 0 40px ${cls.color}0C, 0 12px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,0.04)` }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,transparent,${cls.color}cc,transparent)` }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg,transparent,${cls.color}44,transparent)` }} />
        {/* Ambient orbs */}
        <div style={{ position:"absolute", top:-80, right:-80, width:240, height:240,
          borderRadius:"50%", background:`radial-gradient(circle,${cls.color}15,transparent)`,
          filter:"blur(80px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-60, left:-60, width:200, height:200,
          borderRadius:"50%", background:`radial-gradient(circle,${C.gold}10,transparent)`,
          filter:"blur(80px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:`linear-gradient(${cls.color}05 1px,transparent 1px),linear-gradient(90deg,${cls.color}05 1px,transparent 1px)`,
          backgroundSize:"36px 36px" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <motion.div
            animate={{ y:[0,-5,0], filter:[`drop-shadow(0 0 12px ${cls.color}66)`,`drop-shadow(0 0 28px ${cls.color}cc)`,`drop-shadow(0 0 12px ${cls.color}66)`] }}
            transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
            style={{ fontSize:40, marginBottom:14, display:"inline-block" }}>
            {cls.icon}
          </motion.div>
          <div style={{ ...orb(12,900), marginBottom:8, letterSpacing:".08em",
            background:`linear-gradient(135deg,${C.white},${cls.color})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            textShadow:"none" }}>{t("dash.cta.title")}</div>
          <div style={{ ...raj(13,400), color:C.mutedL, marginBottom:22, lineHeight:1.7 }}>
            {t("dash.cta.sub1")}<br/>{t("dash.cta.sub2")}
          </div>
          <motion.button
            whileHover={{ scale:1.04, boxShadow:`0 8px 32px ${cls.color}55` }}
            whileTap={{ scale:.97 }}
            className="ud2-btn" onClick={()=>onNavigate("ejercicios")}
            style={{ background:`linear-gradient(135deg,${cls.color},${cls.color}bb)`,
              border:`1px solid ${cls.color}66`, padding:"14px 36px", borderRadius:8,
              ...raj(13,700), color:"#fff", cursor:"pointer",
              display:"inline-flex", alignItems:"center", gap:10,
              boxShadow:`0 6px 24px ${cls.color}44`, letterSpacing:".04em" }}>
            <Play size={13} fill="#fff"/> {t("dash.cta.btn")}
          </motion.button>
        </div>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUPPORT PANEL
// ══════════════════════════════════════════════════════════════
const SOCIALS = [
  { icon: Instagram, label: "Instagram",  href: "https://instagram.com/forgeventure",  color: "#E1306C" },
  { icon: Twitter,   label: "Twitter / X", href: "https://twitter.com/forgeventure",   color: "#1DA1F2" },
  { icon: Youtube,   label: "YouTube",    href: "https://youtube.com/@forgeventure",    color: "#FF0000" },
  { icon: Github,    label: "GitHub",     href: "https://github.com/forgeventure",      color: "#f0f6fc" },
];
const FB_TYPE_KEYS = [
  { value: "praise",     key: "dash.fb.praise"    },
  { value: "suggestion", key: "dash.fb.suggest"   },
  { value: "bug",        key: "dash.fb.bug"       },
  { value: "complaint",  key: "dash.fb.complaint" },
  { value: "other",      key: "dash.fb.other"     },
];


// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function UserDashboard({ profile: propProfile, onLogout }) {
  const location = useLocation();
  // Static design system mapping (replaces useThemeColors for the user dashboard)
  const C = {
    bg: P.bg0,    side: P.bg1,  card: P.bg1,   panel: P.bg2,
    navy: P.navy, navyL: P.line,
    orange: P.accent, gold: P.gold,
    white: P.text, muted: P.muted, mutedL: P.mutedL,
    red: "#E05C8A", blue: "#4CC9F0", purple: P.accent, green: "#6BC87A",
  };
  const { t } = useLang();
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(propProfile || null);
  const [loading, setLoading] = useState(true);
  const dashboardClassKey = normalizeDashboardClass(profile);
  const cls = CLS[dashboardClassKey] || CLS.GUERRERO;
  const dashTheme = DASH_CLASS_THEME[dashboardClassKey] || DASH_CLASS_THEME.DEFAULT;
  const [active, setActive]   = useState("home");
  const [donationsLocked, setDonationsLocked] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(true);
  const isMobile      = useIsMobile(768);
  const isTiendaBreak = useIsMobile(960); // shop collapses to 1-col at 960px

  const [missions,             setMissions]             = useState([]);
  const [recentActivity,       setRecentActivity]       = useState([]);
  const [leaderboard,          setLeaderboard]          = useState([]);
  const [leaderboardRefreshing,setLeaderboardRefreshing]= useState(false);
  const [weeklyLeaderboard,    setWeeklyLeaderboard]    = useState({ GUERRERO:[], ARQUERO:[], MAGO:[], week:"" });
  const [weeklyLBRefreshing,   setWeeklyLBRefreshing]   = useState(false);
  const [userLogros,           setUserLogros]           = useState([]);
  const [userStats,            setUserStats]            = useState(null);
  const [notifications,        setNotifications]        = useState([]);
  const [unreadMsgCount,       setUnreadMsgCount]       = useState(0);
  const [notifLoaded,          setNotifLoaded]          = useState(false);
  const [notifLoading,         setNotifLoading]         = useState(true);
  const [notifRefreshing,      setNotifRefreshing]      = useState(false);
  const [notifError,           setNotifError]           = useState(null);
  const [notifSyncedAt,        setNotifSyncedAt]        = useState(null);
  const [showNotifs,           setShowNotifs]           = useState(false);
  const [searchQ,              setSearchQ]              = useState("");
  const [showSearch,           setShowSearch]           = useState(false);
  const [time,                 setTime]                 = useState(new Date());
  const [levelUpCelebration,   setLevelUpCelebration]   = useState(null);
  const [showDailyModal,       setShowDailyModal]       = useState(false);
  const [skillPointsBadge,     setSkillPointsBadge]     = useState(null);
  const [prBroken,             setPrBroken]             = useState(null);
  const [loadError,            setLoadError]            = useState(false);

  const navigateToSection = useCallback((section) => {
    if (!section) return;
    if (section === "donaciones") {
      setDonationsLocked(true);
      setShowNotifs(false);
      setShowSearch(false);
      return;
    }
    setDonationsLocked(false);
    setActive(section);
  }, []);

  useEffect(() => {
    if (location.state?.activeTab) navigateToSection(location.state.activeTab);
  }, [location.state, navigateToSection]);
  const [loadKey,              setLoadKey]              = useState(0);
  const [weeklyXPData,         setWeeklyXPData]         = useState([]);
  const [focusMode,            setFocusMode]            = useState(false);
  const [coinsPulse,           setCoinsPulse]           = useState(false);
  const notifRef     = useRef(null);
  const mainScrollRef = useRef(null);
  const lastCoinsRef = useRef(Number(propProfile?.coins || 0));

  // Navegación desde el avatar Flex
  useEffect(() => {
    const h = (e) => navigateToSection(e.detail.section);
    window.addEventListener("flexNavigate", h);
    return () => window.removeEventListener("flexNavigate", h);
  }, [navigateToSection]);

  // Sync profile prop
  useEffect(() => { if (propProfile) setProfile(propProfile); }, [propProfile]);

  useEffect(() => {
    const currentCoins = Number(profile?.coins || 0);
    if (currentCoins !== lastCoinsRef.current) {
      lastCoinsRef.current = currentCoins;
      setCoinsPulse(true);
      const timer = setTimeout(() => setCoinsPulse(false), 520);
      return () => clearTimeout(timer);
    }
    lastCoinsRef.current = currentCoins;
  }, [profile?.coins]);

  const syncProfileFromPatch = useCallback((patch = {}, { accumulateXp = false, accumulateCoins = false } = {}) => {
    if (!patch || typeof patch !== "object") return;
    setProfile(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      if (patch.level !== undefined) next.level = Number(patch.level || 1);
      if (patch.newLevel !== undefined) next.level = Number(patch.newLevel || next.level || 1);
      if (patch.xp !== undefined) {
        next.xp = accumulateXp ? Number(prev.xp || 0) + Number(patch.xp || 0) : Number(patch.xp || 0);
      }
      if (patch.xpNext !== undefined) next.xpNext = Number(patch.xpNext || next.xpNext || 0);
      if (patch.coins !== undefined) {
        next.coins = accumulateCoins ? Number(prev.coins || 0) + Number(patch.coins || 0) : Number(patch.coins || 0);
      } else if (accumulateCoins && patch.coinsGanados !== undefined) {
        next.coins = Number(prev.coins || 0) + Number(patch.coinsGanados || 0);
      }
      if (patch.streak !== undefined) next.streak = Number(patch.streak || 0);
      if (patch.skillPoints !== undefined) next.skillPoints = Number(patch.skillPoints || 0);
      if (patch.levelsBoughtTotal !== undefined) next.levelsBoughtTotal = Number(patch.levelsBoughtTotal || 0);
      if (patch.levelsBought !== undefined) next.levelsBoughtTotal = Number(patch.levelsBought || 0);
      if (patch.heroClass !== undefined) next.heroClass = patch.heroClass || next.heroClass;
      return next;
    });
  }, []);

  const syncUserStatsFromPatch = useCallback((patch = {}) => {
    if (!patch || typeof patch !== "object") return;
    setUserStats(prev => ({
      ...(prev || {}),
      ...(patch.level !== undefined ? { nivel: Number(patch.level || 1) } : {}),
      ...(patch.newLevel !== undefined ? { nivel: Number(patch.newLevel || 1) } : {}),
      ...(patch.xp !== undefined ? { xp: Number(patch.xp || 0) } : {}),
      ...(patch.xpTotal !== undefined ? { xpTotal: Number(patch.xpTotal || 0) } : {}),
      ...(patch.xpNext !== undefined ? { xpNext: Number(patch.xpNext || 0) } : {}),
      ...(patch.coins !== undefined ? { coins: Number(patch.coins || 0) } : {}),
      ...(patch.streak !== undefined ? { streak: Number(patch.streak || 0) } : {}),
      ...(patch.skillPoints !== undefined ? { skillPoints: Number(patch.skillPoints || 0) } : {}),
      ...(patch.heroClass !== undefined ? { heroClass: patch.heroClass || "GUERRERO" } : {}),
    }));
  }, []);

  // Carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) { setLoading(false); return; }
      setUser(firebaseUser);
      try {
        const token = await firebaseUser.getIdToken();
        const [missionsRes, statsRes, activityRes, leaderboardRes, logrosRes, weeklyRes, weeklyXPRes] =
          await Promise.allSettled([
            getMisionesUsuario(token), getUserStats(token),
            getUserActivity(token), getLeaderboard(token), getUserLogros(token),
            getWeeklyLeaderboard(token), getWeeklyActivity(token),
          ]);
        if (missionsRes.status==="fulfilled")    setMissions(missionsRes.value?.missions||[]);
        if (statsRes.status==="fulfilled") {
          setUserStats(statsRes.value?.stats||null);
          const sp = statsRes.value?.stats?.skillPoints ?? 0;
          if (sp > 0) setSkillPointsBadge(sp);
        }
        if (activityRes.status==="fulfilled")    setRecentActivity(activityRes.value?.activities||[]);
        if (leaderboardRes.status==="fulfilled") setLeaderboard(leaderboardRes.value?.leaderboard||[]);
        if (logrosRes.status==="fulfilled")      setUserLogros(logrosRes.value?.logros||[]);
        if (weeklyRes.status==="fulfilled" && weeklyRes.value?.ok) {
          setWeeklyLeaderboard({
            GUERRERO: weeklyRes.value.leaderboard?.GUERRERO || [],
            ARQUERO:  weeklyRes.value.leaderboard?.ARQUERO  || [],
            MAGO:     weeklyRes.value.leaderboard?.MAGO     || [],
            week:     weeklyRes.value.week || "",
          });
        }
        if (weeklyXPRes.status==="fulfilled" && weeklyXPRes.value?.ok) {
          setWeeklyXPData(weeklyXPRes.value.semana || []);
        }
      } catch (err) {
        console.warn("Dashboard load error:", err.message);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open daily bonus modal once per UTC day if bonus is available
  useEffect(() => {
    if (!profile) return;
    const todayUTC = (() => {
      const d = new Date();
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
    })();
    const sessionKey = `fv_daily_modal_${todayUTC}`;
    if (sessionStorage.getItem(sessionKey)) return;
    if (profile.lastDailyBonusDate !== todayUTC) {
      setShowDailyModal(true);
      sessionStorage.setItem(sessionKey, "1");
    }
  }, [profile?.lastDailyBonusDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reloj
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Notificaciones
  const loadNotifications = useCallback(async (attempt=0) => {
    if (attempt === 0) {
      setNotifError(null);
      setNotifRefreshing(notifLoaded);
      if (!notifLoaded) setNotifLoading(true);
    }
    try {
      const u = auth.currentUser; if (!u) return;
      const token = await u.getIdToken();
      const res = await getNotifications(token);
      if (res?.ok) {
        setNotifications(res.notifications||[]);
        setNotifSyncedAt(res.syncedAt || new Date().toISOString());
        setNotifLoaded(true);
      }
    } catch (err) {
      if (attempt < 2) setTimeout(() => loadNotifications(attempt+1), 800*Math.pow(2,attempt));
      else {
        console.warn("Notifs unavailable");
        setNotifError("No pudimos revisar el buzón ahora.");
        setNotifLoaded(true);
      }
    } finally {
      if (attempt === 0) {
        setNotifLoading(false);
        setNotifRefreshing(false);
      }
    }
  }, [notifLoaded]);

  useEffect(() => {
    loadNotifications();
    const poll = setInterval(() => loadNotifications(), 45000);
    return () => clearInterval(poll);
  }, [loadNotifications]);

  useEffect(() => {
    const h = () => loadNotifications();
    window.addEventListener("exerciseCompleted", h);
    return () => window.removeEventListener("exerciseCompleted", h);
  }, [loadNotifications]);

  const markNotifRead = useCallback(async (notif) => {
    if (!notif?.id || notif.read) return;
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read:true } : n));
    try {
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken();
      await markNotificationRead(token, notif.id);
    } catch {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read:false } : n));
    }
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id).filter(Boolean);
    if (ids.length === 0) return;
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read:true } : n));
    try {
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken();
      await markAllNotificationsRead(token, ids);
    } catch {
      loadNotifications();
    }
  }, [notifications, loadNotifications]);

  // Admin messages are handled by UserMensajes via Firestore onSnapshot.
  // Badge count is received via onUnreadChange callback.

  // Leaderboard auto-refresh
  const refreshLeaderboard = useCallback(async () => {
    const u = auth.currentUser;
    if (!u || leaderboardRefreshing) return;
    setLeaderboardRefreshing(true);
    try {
      const token = await u.getIdToken();
      const res = await getLeaderboard(token);
      if (res?.leaderboard) setLeaderboard(res.leaderboard);
    } catch(_) {} finally { setLeaderboardRefreshing(false); }
  }, [leaderboardRefreshing]);

  const refreshWeeklyLeaderboard = useCallback(async () => {
    const u = auth.currentUser;
    if (!u || weeklyLBRefreshing) return;
    setWeeklyLBRefreshing(true);
    try {
      const token = await u.getIdToken();
      const res = await getWeeklyLeaderboard(token);
      if (res?.ok) {
        setWeeklyLeaderboard({
          GUERRERO: res.leaderboard?.GUERRERO || [],
          ARQUERO:  res.leaderboard?.ARQUERO  || [],
          MAGO:     res.leaderboard?.MAGO     || [],
          week:     res.week || "",
        });
      }
    } catch(_) {} finally { setWeeklyLBRefreshing(false); }
  }, [weeklyLBRefreshing]);

  useEffect(() => {
    const iv = setInterval(refreshLeaderboard, 60000);
    return () => clearInterval(iv);
  }, [refreshLeaderboard]);

  // Cerrar notifs al click fuera
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Progreso / tienda / recompensas
  useEffect(() => {
    const handle = (e) => {
      const detail = e.detail || {};
      const { xp, leveledUp, newLevel, coins, coinsGanados, prBroken: pr } = detail;
      if (pr) { setPrBroken(pr); }
      const refreshProfile = async () => {
        try {
          const u = auth.currentUser; if (!u) return;
          const token = await u.getIdToken();
          const res = await getProfile(token);
          const data = res?.user||res?.profile||{};
          if (Object.keys(data).length>0) {
            setProfile(prev=>({...prev,...data}));
            syncUserStatsFromPatch({
              level: data.level,
              xp: data.xp,
              xpTotal: data.xpTotal,
              xpNext: data.xpNext,
              coins: data.coins,
              streak: data.streak,
              skillPoints: data.skillPoints,
              heroClass: data.heroClass,
            });
          }
        } catch(_) {}
      };
      refreshProfile();
      const isStoreLevelEvent = detail.source === "tienda";
      const coinsDelta = Number(coinsGanados ?? 0);
      const hasAbsoluteCoins = isStoreLevelEvent && coins !== undefined;
      if (xp!==undefined||newLevel!==undefined||coins!==undefined||coinsDelta>0) {
        syncProfileFromPatch({
          newLevel,
          xp: leveledUp ? 0 : xp,
          xpNext: detail.xpNext,
          coins: hasAbsoluteCoins ? coins : undefined,
          coinsGanados: !hasAbsoluteCoins ? coinsDelta : undefined,
          skillPoints: detail.skillPoints,
          levelsBought: detail.levelsBought,
        }, {
          accumulateXp: !leveledUp && xp !== undefined,
          accumulateCoins: !hasAbsoluteCoins && coinsDelta > 0,
        });
        syncUserStatsFromPatch({
          newLevel,
          xp: leveledUp ? 0 : xp,
          xpNext: detail.xpNext,
          coins: hasAbsoluteCoins ? coins : undefined,
          skillPoints: detail.skillPoints,
        });
      }
      if (leveledUp && canShowXpPopups()) {
        const gained = e.detail?.levelsGained ?? 1;
        setLevelUpCelebration({ newLevel, xpGained:xp, levelsGained: gained, xpNext: e.detail?.xpNext, heroClass: profile?.heroClass || profile?.clase || "DEFAULT" });
        setSkillPointsBadge(prev => (prev || 0) + gained);
      }
    };
    const handleProfileUpdated = (e) => {
      const detail = e.detail || {};
      syncProfileFromPatch(detail);
      syncUserStatsFromPatch(detail);
    };
    const handleSkillUnlocked = () => {
      setSkillPointsBadge(prev => Math.max(0, (prev || 0) - 1) || null);
    };
    const handleAvatarPurchased = (e) => {
      const { ownedAvatars, ownedFrames, coins } = e.detail || {};
      setProfile(prev => prev ? {
        ...prev,
        ...(ownedAvatars !== undefined && { ownedAvatars }),
        ...(ownedFrames  !== undefined && { ownedFrames  }),
        ...(coins        !== undefined && { coins        }),
      } : prev);
    };

    const handleAvatarEquipped = (e) => {
      const { activeAvatar, activeFrame } = e.detail || {};
      setProfile(prev => prev ? {
        ...prev,
        ...(activeAvatar !== undefined && { activeAvatar }),
        ...(activeFrame  !== undefined && { activeFrame  }),
      } : prev);
    };

    window.addEventListener("exerciseCompleted", handle);
    window.addEventListener("levelUp", handle);
    window.addEventListener("profileUpdated", handleProfileUpdated);
    window.addEventListener("skillUnlocked", handleSkillUnlocked);
    window.addEventListener("avatarPurchased", handleAvatarPurchased);
    window.addEventListener("avatarEquipped",  handleAvatarEquipped);
    return () => {
      window.removeEventListener("exerciseCompleted", handle);
      window.removeEventListener("levelUp", handle);
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      window.removeEventListener("skillUnlocked", handleSkillUnlocked);
      window.removeEventListener("avatarPurchased", handleAvatarPurchased);
      window.removeEventListener("avatarEquipped",  handleAvatarEquipped);
    };
  }, [profile?.heroClass, syncProfileFromPatch, syncUserStatsFromPatch]);

  const handleLogout = async () => {
    try { await signOut(auth); if (onLogout) onLogout(); }
    catch (e) { console.error(e); }
  };

  const pendingNavMissions = missions.filter(m => !(m.reclamada || m.estado === "completada")).length;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", background:C.bg, flexDirection:"column", gap:20 }}>
      <style>{CSS + SIDE_CSS}</style>
      <div style={{ width:48, height:48, border:`3px solid ${C.navy}`,
        borderTop:`3px solid ${C.orange}`, borderRadius:"50%", animation:"ud2-spin 1s linear infinite" }} />
      <div style={{ ...mono(13,700), color:C.orange, letterSpacing:".1em" }}>CARGANDO...</div>
    </div>
  );

  const navActiveId = donationsLocked ? "donaciones" : active;
  const activeNav = NAV.find(n=>n.id===navActiveId)||NAV[0];
  const activeNavMeta = getNavRpgMeta(activeNav.id, dashTheme);
  const searchNeedle = searchQ.trim().toLowerCase();
  const searchItems = NAV
    .map(n => ({ ...n, rpg:getNavRpgMeta(n.id, dashTheme), label:t(n.key) }))
    .filter(n => {
      if (!searchNeedle) return true;
      const haystack = [n.label, n.id, n.rpg.zone, n.rpg.hint, ...(n.rpg.keywords || [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchNeedle);
    });
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const notifGroupMeta = {
    misiones: { label:"Quests", order:1 },
    logros:   { label:"Trofeos", order:2 },
    racha:    { label:"Disciplina", order:3 },
    progreso: { label:"Progreso físico", order:4 },
    tienda:   { label:"Mercado", order:5 },
    sistema:  { label:"Sistema", order:6 },
  };
  const groupedNotifications = Object.entries(
    notifications.reduce((acc, n) => {
      const key = n.group || n.tipo || "sistema";
      if (!acc[key]) acc[key] = [];
      acc[key].push(n);
      return acc;
    }, {})
  ).sort(([a], [b]) => (notifGroupMeta[a]?.order || 99) - (notifGroupMeta[b]?.order || 99));
  const notifSyncLabel = notifSyncedAt
    ? new Date(notifSyncedAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
    : "--:--";
  const SIDE_W = sideCollapsed ? (isMobile ? 56 : 64) : (isMobile ? 188 : 196);

  return (
    <>
      <style>{CSS + SIDE_CSS}</style>

      {/* ── Global background + particle layers (fixed, behind everything) ── */}
      <Aurora />
      <PixelRain />
      <Embers />

      {/* ── Level Up Ceremony ── */}
      <AnimatePresence>
        {levelUpCelebration && canShowXpPopups() && (
          <LevelUpCeremony
            levelData={levelUpCelebration}
            onDismiss={() => setLevelUpCelebration(null)}
          />
        )}
      </AnimatePresence>

      {/* ── PR Banner ── */}
      <AnimatePresence>
        {prBroken && (
          <PRBanner prData={prBroken} onClose={() => setPrBroken(null)}/>
        )}
      </AnimatePresence>

      {/* ── Daily Bonus Modal ── */}
      <AnimatePresence>
        {showDailyModal && (
          <DailyBonusModal
            profile={profile}
            onClose={() => setShowDailyModal(false)}
            onClaimed={(res) => {
              setShowDailyModal(false);
              const d = new Date();
              const todayUTC = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
              setProfile(prev => prev ? {
                ...prev,
                xp:                 res.newXp    ?? prev.xp,
                coins:              res.newCoins ?? prev.coins,
                streak:             res.streak   ?? prev.streak,
                level:              res.newLevel ?? prev.level,
                xpNext:             res.xpNext   ?? prev.xpNext,
                lastDailyBonusDate: todayUTC,
              } : prev);
              if (res.leveledUp) {
                setLevelUpCelebration({ newLevel: res.newLevel, xpGained: res.xpGained, xpNext: res.xpNext, levelsGained: res.levelsGained ?? 1, heroClass: profile?.heroClass || profile?.clase || "DEFAULT" });
              }
            }}
          />
        )}
      </AnimatePresence>

      <div style={{
        display:"flex", height:"100vh", background:P.bg0, overflow:"hidden",
        fontFamily:"'Manrope',sans-serif", position:"relative", zIndex:1,
        "--dash-class-accent": dashTheme.accent,
        "--dash-class-secondary": dashTheme.secondary,
        "--dash-class-bg": dashTheme.bg,
        "--dash-class-soft": dashTheme.soft,
      }}>

        {isMobile && !sideCollapsed && (
          <motion.button
            className="ud2-side-backdrop"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            onClick={() => setSideCollapsed(true)}
            aria-label="Cerrar menú lateral"
            style={{
              position:"fixed", inset:0, zIndex:95,
              border:0, background:"rgba(5,4,9,.58)", backdropFilter:"blur(6px)",
            }}
          />
        )}

        {/* ══ SIDEBAR ══ */}
        <motion.div
          className={`ud2-sidebar ${sideCollapsed ? "is-collapsed" : "is-open"}`}
          initial={{ x: -30, opacity:0 }}
          animate={{ x:0, opacity:1 }}
          transition={{ duration:.45, ease:[0.22,1,0.36,1] }}
          style={{ width:SIDE_W,
            display:"flex", flexDirection:"column", flexShrink:0,
            transition:"width .22s ease",
            position:isMobile && !sideCollapsed ? "fixed" : "relative",
            left:0, top:0, bottom:0, height:"100vh",
            zIndex:isMobile && !sideCollapsed ? 110 : 10 }}>
          <div className="ud2-sidebar-edge"/>

          {/* Logo */}
          <div className="ud2-side-logo" style={{ padding:sideCollapsed ? "14px 10px" : "14px 12px",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
            position:"relative" }}>
            {/* Accent bottom glow under logo */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1,
              background:`linear-gradient(90deg,transparent,${dashTheme.accent}55,transparent)`, pointerEvents:"none" }}/>
            {!sideCollapsed && (
              <motion.div
                className="ud2-side-brand"
                initial={{ opacity:0, y:-6 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:.4, delay:.1 }}
              >
                <motion.img src="/logo.png" alt="FV"
                  className="ud2-side-brand-mark"
                  animate={{ filter:[`drop-shadow(0 0 8px ${dashTheme.accent}88)`,`drop-shadow(0 0 14px ${dashTheme.accent})`,`drop-shadow(0 0 8px ${dashTheme.accent}88)`] }}
                  transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
                />
                <div style={{ minWidth:0 }}>
                  <span style={{ ...mono(9,900),
                    display:"block", color:dashTheme.secondary, whiteSpace:"nowrap", letterSpacing:"0.12em",
                    textShadow:`0 0 12px ${dashTheme.accent}88` }}>FORGEVENTURE</span>
                  <span style={{ ...mono(7,700), display:"block", color:P.muted, letterSpacing:".16em", marginTop:2 }}>MAPA RPG</span>
                </div>
              </motion.div>
            )}
            {sideCollapsed && (
              <motion.img src="/logo.png" alt="FV"
                animate={{ filter:[`drop-shadow(0 0 8px ${dashTheme.accent}88)`,`drop-shadow(0 0 14px ${dashTheme.accent})`,`drop-shadow(0 0 8px ${dashTheme.accent}88)`] }}
                transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
                style={{ width:30, height:30, objectFit:"cover", mixBlendMode:"screen", margin:"0 auto" }} />
            )}
            <motion.button onClick={()=>setSideCollapsed(v=>!v)}
              className="ud2-side-toggle"
              title={sideCollapsed ? "Desplegar mapa" : "Compactar mapa"}
              aria-label={sideCollapsed ? "Desplegar menú lateral" : "Compactar menú lateral"}
              whileHover={{ borderColor:dashTheme.accent, color:dashTheme.accent }}
              style={{ marginLeft:sideCollapsed?0:6 }}>
              {sideCollapsed ? <ChevronRight size={13}/> : <Menu size={13}/>}
            </motion.button>
          </div>

          {/* ── Navigation ── */}
          <nav style={{ flex:1, overflowY:"auto", padding:"6px 0 4px" }}>
            {!sideCollapsed && <div className="ud2-side-section-label">NAVEGACIÓN</div>}
            {NAV.map((n, idx) => {
              const on = navActiveId===n.id;
              const meta = getNavRpgMeta(n.id, dashTheme);
              const label = t(n.key);
              const badge = n.id==="mensajes"  ? (unreadMsgCount>0?String(unreadMsgCount):null)
                : n.id==="misiones"  ? (pendingNavMissions>0?String(pendingNavMissions):null)
                : n.id==="personaje" ? (skillPointsBadge>0?String(skillPointsBadge):n.badge)
                : n.badge;
              return (
                <motion.button
                  key={n.id}
                  onClick={() => {
                    navigateToSection(n.id);
                    if (isMobile && !sideCollapsed) setSideCollapsed(true);
                  }}
                  className={`ud2-nav-item${on?" ud2-nav-active":""}`}
                  initial={{ opacity:0, x:-16 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ duration:.3, delay: idx * 0.04, ease:[0.22,1,0.36,1] }}
                  whileHover={{ x: sideCollapsed ? 0 : 4 }}
                  style={{ width:"100%", display:"flex", alignItems:"center",
                    gap: sideCollapsed ? 0 : 9, padding: sideCollapsed ? "8px 0" : "8px 10px",
                    justifyContent: sideCollapsed ? "center" : "flex-start",
                    background:"transparent", border:"none",
                    cursor:"pointer", position:"relative" }}
                  title={sideCollapsed ? label : undefined}
                  aria-label={label}>
                  {/* Icon box */}
                  <div className="ud2-nav-icon">
                    <img
                      src={meta.asset}
                      alt=""
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                  {!sideCollapsed && (
                    <span style={{ flex:1, minWidth:0, textAlign:"left" }}>
                      <span style={{ ...sans(11, on?900:700), color: on ? dashTheme.secondary : P.mutedL, display:"block", lineHeight:1.05, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {label}
                      </span>
                      <span style={{ ...mono(7,800), color:on ? dashTheme.accent : P.muted, display:"block", marginTop:3, letterSpacing:".11em", textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {meta.zone}
                      </span>
                    </span>
                  )}
                  {badge && !sideCollapsed && (
                    <motion.span
                      initial={{ scale:0 }} animate={{ scale:1 }}
                      transition={{ type:"spring", stiffness:500, damping:25 }}
                      style={{ ...mono(9,700), borderRadius:4,
                        color: badge==="NEW" || badge==="💛" ? dashTheme.secondary : P.bg0,
                        background: badge==="NEW" || badge==="💛" ? "transparent" : dashTheme.secondary,
                        border:`1px solid ${badge==="NEW" || badge==="💛" ? dashTheme.secondary+"55" : "transparent"}`,
                        padding:"1px 6px", lineHeight:1.5, flexShrink:0 }}>
                      {badge}
                    </motion.span>
                  )}
                  {badge && sideCollapsed && (
                    <div style={{ position:"absolute", top:7, right:8, width:7, height:7,
                      background:dashTheme.accent, borderRadius:"50%",
                      boxShadow:`0 0 8px ${dashTheme.accent}`, border:`1px solid ${P.bg0}` }}/>
                  )}
                  {sideCollapsed && (
                    <span className="ud2-nav-tooltip">
                      <strong>{label}</strong>
                      <span>{meta.hint}</span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* ── Logout ── */}
          <div className="ud2-side-logout" style={{ padding:"10px 10px", flexShrink:0 }}>
            <div className="ud2-side-sep" style={{ margin:"0 0 8px" }}/>
            <motion.button
              onClick={handleLogout}
              className="ud2-nav-item"
              whileHover={{ x: sideCollapsed ? 0 : 3 }}
              style={{ width:"100%", display:"flex", alignItems:"center",
                gap: sideCollapsed ? 0 : 10, padding: sideCollapsed ? "9px 0" : "9px 10px",
                justifyContent: sideCollapsed ? "center" : "flex-start",
                background:"transparent", border:"none", cursor:"pointer", borderLeft:"3px solid transparent" }}>
              <div className="ud2-nav-icon">
                <LogOut size={13} color={P.muted}/>
              </div>
              {!sideCollapsed && <span style={{ ...sans(11,500), color:P.muted }}>{t("dash.side.logout")}</span>}
            </motion.button>
          </div>
        </motion.div>

        {/* ══ MAIN ══ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* ══ HUD TOPBAR ══ */}
          <motion.div
            className="ud2-topbar-shell"
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:.45, ease:[0.22,1,0.36,1] }}
            style={{
              padding:`0 ${isMobile?"12px":"18px"}`,
              "--dash-class-accent": dashTheme.accent,
              "--dash-class-secondary": dashTheme.secondary,
              "--dash-class-bg": dashTheme.bg,
              "--dash-class-soft": dashTheme.soft,
              filter: donationsLocked ? "blur(8px) saturate(.88)" : "none",
              transform: donationsLocked ? "scale(.995)" : "scale(1)",
              opacity: donationsLocked ? .46 : 1,
              pointerEvents: donationsLocked ? "none" : "auto",
              transition:"filter .28s ease, transform .28s ease, opacity .28s ease",
            }}>

            {/* HUD scan line */}
            <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
              <div style={{ position:"absolute", top:0, left:"-60%", width:"60%", height:"100%",
                background:`linear-gradient(90deg,transparent,${dashTheme.secondary}12,transparent)`,
                animation:"ud2-hud-scan 9s ease-in-out infinite" }}/>
            </div>

            {/* ── LEFT: Section breadcrumb ── */}
            <div className="ud2-topbar-left">
              <motion.div
                key={activeNav.id}
                className="ud2-section-orb is-changing"
                initial={{ scale:.92, y:2, opacity:.75 }}
                animate={{ scale:1, y:0, opacity:1 }}
                transition={{ duration:.32, ease:[0.22,1,0.36,1] }}>
                <img
                  className="ud2-section-img"
                  src={activeNavMeta.asset}
                  alt=""
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/icons/map-pin.png"; }}
                />
              </motion.div>
              <div className="ud2-section-copy">
                <div className="ud2-section-title">
                  <img className="ud2-section-crest" src={dashTheme.crest} alt="" />
                  {t(activeNav.key)}
                </div>
                <div className="ud2-section-sub">
                  <img src="/ui/icons/zone-flag.png" alt="" />
                  {(dashTheme.labelShort || dashTheme.label || "AVENTURA").toUpperCase()} · FORGEVENTURE
                </div>
              </div>
            </div>

            {/* ── CENTER: Search ── */}
            <div className="ud2-topbar-center" style={{ display:isMobile?"none":"block" }}>
              <div className="ud2-search-wrap">
                <img className="ud2-search-icon" src="/ui/icons/map-pin.png" alt="" />
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  onFocus={()=>setShowSearch(true)} onBlur={()=>setTimeout(()=>setShowSearch(false),150)}
                  placeholder="Buscar zona, mision o tienda..."
                  className="ud2-search-input"/>
                {showSearch && searchItems.length > 0 && (
                  <div className="ud2-map-results">
                    <div className="ud2-map-results-head">
                      <span>Mapa rapido</span>
                      <span className="ud2-map-count">{searchItems.length} zonas</span>
                    </div>
                    {searchItems.map(m=>(
                      <button key={m.id} className="ud2-map-result"
                        onMouseDown={()=>{navigateToSection(m.id);setSearchQ("");setShowSearch(false);}}
                        aria-label={`Ir a ${m.label}`}>
                        <span className="ud2-map-icon">
                          <img src={m.rpg.asset} alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/icons/map-pin.png"; }} />
                        </span>
                        <span className="ud2-map-copy">
                          <span className="ud2-map-title">{m.label}</span>
                          <span className="ud2-map-hint">{m.rpg.hint}</span>
                        </span>
                        <span className="ud2-map-zone">{m.rpg.zone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: HUD stats + actions ── */}
            <div className="ud2-topbar-right" style={{ display:"flex", alignItems:"center", gap: isMobile?6:10, flexShrink:0 }}>

              {isMobile && (
                <motion.button whileTap={{ scale:.94 }} className="ud2-mobile-map-btn"
                  onClick={()=>{setShowSearch(v=>!v); setSearchQ("");}}
                  title="Abrir mapa rapido"
                  aria-label="Abrir mapa rapido">
                  <img src="/ui/icons/map-pin.png" alt="" />
                </motion.button>
              )}

              {/* Streak badge */}
              {(profile?.streak||0) > 0 && (
                <div className={`ud2-topbar-badge ${isMobile ? "ud2-compact-hud" : ""}`}>
                  <img src="/ui/icon-energy.png" alt="" />
                  <span style={{ ...mono(isMobile ? 9 : 11,700), color:"#ff9500" }}>{profile.streak}d</span>
                </div>
              )}

              {/* Coins badge */}
              <div className={`ud2-topbar-badge ${isMobile ? "ud2-compact-hud" : ""} ${coinsPulse ? "is-pulsing" : ""}`}>
                <img src="/ui/icon-gold.png" alt="" />
                <span style={{ ...mono(isMobile ? 9 : 11,700), color:dashTheme.secondary }}>
                  {isMobile && (profile?.coins||0) > 999 ? `${Math.floor((profile?.coins||0)/1000)}k` : (profile?.coins||0).toLocaleString()}
                </span>
              </div>

              {/* Clock */}
              {!isMobile && (
                <div className="ud2-clock-pill">
                  <span className="ud2-clock-dot" />
                  {time.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}
                </div>
              )}

              {/* Divider */}
              {!isMobile && <div style={{ width:1, height:22, background:"rgba(26,16,40,.9)" }}/>}

              {/* Focus mode */}
              {active === "home" && (
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}
                  className={`ud2-focus-action ${focusMode ? "is-on" : "is-off"}`}
                  onClick={() => setFocusMode(v => !v)}
                  title={focusMode ? t("dash.top.focus_exit") : t("dash.top.focus_enter")}
                  aria-label={focusMode ? "Salir de modo enfoque" : "Activar modo enfoque"}>
                  <img
                    className="ud2-focus-rune"
                    src="/ui/header/action-focus.png"
                    alt=""
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/icon-energy.png"; }}
                  />
                  <span>Modo enfoque</span>
                  <span className="ud2-action-tip">{focusMode ? "Encendido" : "Apagado"}</span>
                </motion.button>
              )}

              {/* Daily bonus */}
              {(() => {
                const todayUTC = (() => { const d=new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`; })();
                const bonusAvailable = profile?.lastDailyBonusDate !== todayUTC;
                const bonusLabel = bonusAvailable ? "Cofre listo" : "Cofre reclamado hoy";
                return (
                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:.92 }}
                    onClick={() => setShowDailyModal(true)}
                    title={bonusLabel}
                    aria-label={bonusLabel}
                    className={`ud2-icon-action ud2-daily-bonus ${bonusAvailable ? "ready" : "claimed"}`}>
                    <img src={bonusAvailable ? "/sprites/chest_closed.png" : "/sprites/chest_open.png"} alt="" />
                    {bonusAvailable && (
                      <div className="ud2-pulse-dot" style={{ position:"absolute", top:0, right:0,
                        width:8, height:8, background:dashTheme.secondary, borderRadius:"50%",
                        border:`2px solid #05040a`, boxShadow:`0 0 8px ${dashTheme.secondary}` }}/>
                    )}
                    <span className="ud2-action-tip">{bonusLabel}</span>
                  </motion.button>
                );
              })()}

              {/* Notifications */}
              <div ref={notifRef} style={{ position:"relative" }}>
                <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:.9 }}
                  onClick={()=>setShowNotifs(v=>!v)}
                  className={`ud2-notif-button ${showNotifs ? "is-open" : ""}`}
                  title="Buzón del gremio"
                  aria-label="Abrir buzón del gremio">
                  <img
                    src="/ui/header/action-notifications.png"
                    alt=""
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/icons/zone-flag.png"; }}
                  />
                  {(() => {
                    if (unreadNotifications > 0) return (
                      <>
                        <span className="ud2-notif-badge">{unreadNotifications>9?"9+":unreadNotifications}</span>
                        <div style={{ position:"absolute", top:1, right:1, width:14, height:14,
                          borderRadius:"50%", background:dashTheme.secondary, animation:"ud2-ring 1.8s ease-in-out infinite" }}/>
                      </>
                    );
                    if (notifLoaded) return (
                      <span className="ud2-notif-ok" />
                    );
                    return null;
                  })()}
                  <span className="ud2-action-tip">Buzón</span>
                </motion.button>

                {showNotifs && (
                  <div className="ud2-notif-panel">
                    <div className="ud2-notif-head">
                      <span className="ud2-notif-title">
                        <img src="/ui/header/action-notifications.png" alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/icons/zone-flag.png"; }} />
                        Buzón del gremio
                      </span>
                      {unreadNotifications > 0 && (
                        <button onClick={markAllNotifsRead}
                          disabled={notifRefreshing}
                          className="ud2-notif-mark">
                          {t("dash.notif.mark_read")}
                        </button>
                      )}
                    </div>
                    <div className="ud2-notif-summary">
                      <span>{unreadNotifications ? `${unreadNotifications} aviso${unreadNotifications > 1 ? "s" : ""} por leer` : "El buzón está limpio"}</span>
                      <span className="ud2-notif-pill">{notifRefreshing ? "Exploradores revisando..." : `Última revisión ${notifSyncLabel}`}</span>
                    </div>
                    <div style={{ maxHeight:340, overflowY:"auto" }}>
                      {notifLoading ? (
                        <div className="ud2-notif-state">
                          <span className="ud2-notif-loader" />
                          <span>Revisando el buzón del gremio...</span>
                        </div>
                      ) : notifError ? (
                        <div className="ud2-notif-state">
                          <span>{notifError}</span>
                          <button onClick={() => loadNotifications()} className="ud2-notif-refresh">
                            Reintentar
                          </button>
                        </div>
                      ) : notifications.length===0 ? (
                        <div className="ud2-notif-empty">
                          <img
                            src="/ui/header/notifications/notif-empty.png"
                            alt=""
                            onError={e => { e.currentTarget.style.display = "none"; }}
                            style={{ width:58, height:58, objectFit:"contain", imageRendering:"pixelated", margin:"0 auto 12px", display:"block", filter:"drop-shadow(0 10px 12px rgba(0,0,0,.4))" }}
                          />
                          {t("dash.notif.empty")}
                        </div>
                      ) : groupedNotifications.map(([group, items]) => (
                        <div key={group}>
                          <div className="ud2-notif-group">
                            {notifGroupMeta[group]?.label || group}
                          </div>
                          {items.map(n => {
                            const leida = Boolean(n.read);
                            return (
                              <button key={n.id}
                                onClick={async () => {
                                  markNotifRead(n);
                                  if (n.isAdmin && n._firestoreId) {
                                    try {
                                      const u = auth.currentUser;
                                      if (u) { const tok = await u.getIdToken(); markMessageRead(tok,n._firestoreId).catch(()=>{}); }
                                    } catch(_) {}
                                  }
                                  navigateToSection(n.seccion); setShowNotifs(false);
                                }}
                                className={`ud2-notif-row ${leida ? "is-read" : ""} sev-${n.severity || "info"}`}
                                style={{ "--notif-color": n.color || dashTheme.secondary }}>
                                <div className="ud2-notif-icon" style={{ color:n.color || dashTheme.secondary }}>
                                  <img
                                    src={getNotifAsset(n)}
                                    alt=""
                                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/header/action-notifications.png"; }}
                                  />
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div className="ud2-notif-name">
                                    {n.titulo}
                                  </div>
                                  <div className="ud2-notif-desc">
                                    {n.desc}
                                  </div>
                                  <div className="ud2-notif-meta">
                                    <span>{n.severity || "info"}</span>
                                    <span>prioridad {n.priority || 1}</span>
                                  </div>
                                </div>
                                {!leida && <span className="ud2-notif-dot" />}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="ud2-notif-footer">
                      <span>Exploradores revisan cada 45s</span>
                      <button onClick={() => loadNotifications()}
                        disabled={notifRefreshing}
                        className="ud2-notif-refresh">
                        {notifRefreshing ? "..." : "Actualizar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <motion.div whileHover={{ scale:1.08 }} style={{ cursor:"pointer" }} onClick={()=>navigateToSection("perfil")}
                role="button" tabIndex={0} aria-label="Abrir perfil del heroe"
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigateToSection("perfil"); } }}>
                <SidebarAvatar profile={profile} cls={cls} size={32}/>
              </motion.div>
            </div>

            {/* ── Animated gold bottom border ── */}
            {isMobile && showSearch && (
              <div className="ud2-mobile-search-panel">
                <div className="ud2-mobile-search-top">
                  <div className="ud2-search-wrap">
                    <img className="ud2-search-icon" src="/ui/icons/map-pin.png" alt="" />
                    <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                      placeholder="Buscar zona, mision o tienda..."
                      className="ud2-search-input"
                      autoFocus />
                  </div>
                  <button className="ud2-mobile-search-close" onClick={()=>{setShowSearch(false); setSearchQ("");}} title="Cerrar mapa" aria-label="Cerrar mapa rapido">
                    <X size={15} />
                  </button>
                </div>
                {searchItems.length > 0 && (
                  <div className="ud2-map-results">
                    <div className="ud2-map-results-head">
                      <span>Mapa rapido</span>
                      <span className="ud2-map-count">{searchItems.length} zonas</span>
                    </div>
                    {searchItems.map(m=>(
                      <button key={m.id} className="ud2-map-result"
                        onMouseDown={()=>{navigateToSection(m.id);setSearchQ("");setShowSearch(false);}}
                        aria-label={`Ir a ${m.label}`}>
                        <span className="ud2-map-icon">
                          <img src={m.rpg.asset} alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/ui/icons/map-pin.png"; }} />
                        </span>
                        <span className="ud2-map-copy">
                          <span className="ud2-map-title">{m.label}</span>
                          <span className="ud2-map-hint">{m.rpg.hint}</span>
                        </span>
                        <span className="ud2-map-zone">{m.rpg.zone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, overflow:"hidden" }}>
              <motion.div
                style={{ height:"100%", background:`linear-gradient(90deg,transparent,${dashTheme.accent}99,${dashTheme.secondary},${dashTheme.accent}99,transparent)` }}
                animate={{ opacity:[.3,.9,.3] }}
                transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}/>
            </div>
          </motion.div>

          {/* Content */}
          <div ref={mainScrollRef} style={{
            flex:1, overflowY: (active==="home" || (active==="tienda" && !isTiendaBreak)) ? "hidden" : "auto",
            padding: (active==="home" || (active==="tienda" && !isTiendaBreak)) ? 0 : isMobile?"10px":"22px",
            paddingBottom: (active==="home" || (active==="tienda" && !isTiendaBreak)) ? 0 : "22px",
            position:"relative",
            display: (active==="home" || (active==="tienda" && !isTiendaBreak)) ? "flex" : "block",
            flexDirection: "column",
          }}>

            {/* API load error banner */}
            {loadError && active === "home" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                padding:"10px 16px", marginBottom:14,
                background:`${C.red}0E`, border:`1px solid ${C.red}33`, borderRadius:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span>⚠️</span>
                  <span style={{ ...raj(12,600), color:C.red }}>Algunos datos no cargaron.</span>
                </div>
                <button onClick={() => { setLoadError(false); setLoading(true); setLoadKey(k => k+1); }}
                  style={{ ...px(8), color:C.red, background:`${C.red}14`,
                    border:`1px solid ${C.red}33`, borderRadius:6, padding:"4px 12px", cursor:"pointer" }}>
                  REINTENTAR
                </button>
              </div>
            )}

            {/* Scroll progress bar for sub-pages */}
            {active !== "home" && !(active === "tienda" && !isTiendaBreak) && <ScrollProgress containerRef={mainScrollRef}/>}

            <div key={active} className="ud2-page" style={{
              position:"relative", zIndex:1,
              filter: donationsLocked ? "blur(10px) saturate(.9)" : "none",
              transform: donationsLocked ? "scale(.992)" : "scale(1)",
              opacity: donationsLocked ? .42 : 1,
              pointerEvents: donationsLocked ? "none" : "auto",
              transition:"filter .28s ease, transform .28s ease, opacity .28s ease",
              ...((active==="home" || (active==="tienda" && !isTiendaBreak)) ? { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" } : {}),
            }}>
              {active==="home" && (
                <UserHome
                  profile={profile}
                  stats={userStats}
                  onNavigate={navigateToSection}
                />
              )}
              {active==="ejercicios" && <UserEjercicios profile={profile}/>}
              {active==="rutinas"    && <UserRutinas    profile={profile}/>}
              {active==="misiones"   && <UserMisiones   profile={profile} onNavigate={navigateToSection}/>}
              {active==="logros"     && <UserLogros     profile={profile}/>}
              {active==="tienda"     && <UserTienda     profile={profile} onCoinsChange={c=>setProfile(p=>({...p,coins:c}))} onProfilePatch={patch=>setProfile(p=>p?{...p,...patch}:p)}/>}
              {active==="personaje"  && <UserPersonaje  profile={profile}/>}
              {active==="mente"      && <UserMente      profile={profile}/>}
              {active==="salud"      && <UserSalud      profile={profile}/>}
              {active==="chat"       && <UserChat       user={user} profile={profile}/>}
              {active==="mensajes"   && <UserMensajes   user={user} profile={profile} onUnreadChange={setUnreadMsgCount}/>}
              {active==="donaciones" && <UserDonaciones/>}
              {active==="perfil"     && <UserPerfil     profile={profile} onLogout={handleLogout}/>}
            </div>

            <AnimatePresence>
              {donationsLocked && (
                <motion.div
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  exit={{ opacity:0 }}
                  transition={{ duration:.22 }}
                  style={{
                    position:"absolute",
                    inset:isMobile ? 10 : 22,
                    zIndex:5,
                    display:"grid",
                    placeItems:"center",
                    pointerEvents:"auto",
                  }}>
                  <motion.div
                    initial={{ opacity:0, y:16, scale:.97 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:10, scale:.97 }}
                    transition={{ duration:.24, ease:[0.22,1,0.36,1] }}
                    style={{
                      width:"min(100%, 680px)",
                      borderRadius:28,
                      border:`1px solid ${dashTheme.accent}44`,
                      background:`linear-gradient(180deg, color-mix(in srgb, ${dashTheme.accent}, transparent 88%), rgba(10,7,18,.96) 18%, rgba(8,6,14,.98) 100%)`,
                      boxShadow:`0 30px 80px rgba(0,0,0,.42), 0 0 42px ${dashTheme.accent}16, inset 0 1px 0 rgba(255,255,255,.05)`,
                      overflow:"hidden",
                      position:"relative",
                    }}>
                    <div style={{
                      position:"absolute",
                      inset:0,
                      background:`radial-gradient(circle at 18% 20%, ${dashTheme.accent}20, transparent 34%), radial-gradient(circle at 82% 78%, ${dashTheme.secondary}18, transparent 28%)`,
                      pointerEvents:"none",
                    }} />
                    <div style={{
                      position:"absolute",
                      top:0,
                      left:0,
                      right:0,
                      height:2,
                      background:`linear-gradient(90deg, transparent, ${dashTheme.accent}cc, ${dashTheme.secondary}, transparent)`,
                    }} />
                    <div style={{ position:"relative", zIndex:1, padding:isMobile ? "22px 18px" : "28px 28px 26px", textAlign:"center" }}>
                      <div style={{
                        display:"inline-flex",
                        alignItems:"center",
                        gap:10,
                        padding:"9px 14px",
                        borderRadius:999,
                        border:`1px solid ${dashTheme.accent}33`,
                        background:`linear-gradient(180deg, ${dashTheme.accent}14, rgba(255,255,255,.02))`,
                        color:dashTheme.accent,
                        ...raj(11,700),
                        letterSpacing:".1em",
                        textTransform:"uppercase",
                        marginBottom:16,
                      }}>
                        <img
                          src="/ui/header/section-donaciones.png"
                          alt=""
                          style={{ width:18, height:18, objectFit:"contain" }}
                          onError={e => { e.currentTarget.style.display = "none"; }}
                        />
                        Zona en construcción
                      </div>
                      <div style={{ ...orb("clamp(28px,4vw,46px)", 900), color:C.white, lineHeight:1.02, marginBottom:12 }}>
                        Donaciones del reino
                      </div>
                      <div style={{ ...raj(16,500), color:C.muted, lineHeight:1.72, maxWidth:560, margin:"0 auto 18px" }}>
                        Esta sección todavía está siendo forjada. Por ahora dejamos visible la entrada, pero el santuario de apoyo abrirá cuando la experiencia quede a la altura del resto del mapa.
                      </div>
                      <div style={{
                        display:"grid",
                        gridTemplateColumns:isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                        gap:12,
                        marginBottom:18,
                      }}>
                        {[
                          "Aportes, recompensas y agradecimientos llegarán aquí.",
                          "Puedes salir cambiando a cualquier otra pestaña del tablero.",
                        ].map((copy) => (
                          <div key={copy} style={{
                            borderRadius:18,
                            border:`1px solid ${dashTheme.accent}24`,
                            background:"rgba(255,255,255,.025)",
                            padding:"14px 16px",
                            color:C.muted,
                            ...raj(13,500),
                            lineHeight:1.6,
                          }}>
                            {copy}
                          </div>
                        ))}
                      </div>
                      <div style={{
                        display:"inline-flex",
                        alignItems:"center",
                        gap:8,
                        padding:"10px 14px",
                        borderRadius:999,
                        border:`1px solid ${dashTheme.accent}33`,
                        background:`linear-gradient(180deg, ${dashTheme.accent}10, rgba(255,255,255,.02))`,
                        color:dashTheme.accent,
                        ...raj(12,700),
                      }}>
                        Cambia de pestaña para continuar
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      {/* bottom mobile nav removed — using left sidebar for all pages */}

      <SocialFab prompt="Soporte y contacto" />
    </>
  );
}
