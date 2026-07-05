// src/pages/user/UserPerfil.jsx
import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2, Save, X, Check, Eye, EyeOff,
  Zap, Trophy, TrendingUp, Award, BarChart2, Lock,
  LogOut, Sparkles, AlertTriangle, Shield,
} from "lucide-react";
import {
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  getUserStats, updateProfile, getSkins, setActiveSkin,
  getLogrosCatalogo, getWeeklyActivity, deleteProfile,
  getAvatarCatalog, purchaseAvatarItem, setActiveAvatar, setActiveFrame,
  buyTitle, equipTitle, getTitlesCatalog,
} from "../../services/api";
import { getSkinPreview } from "../../avatar/SpriteMap";
import { AVATARS_CATALOG, FRAMES_CATALOG, RAREZA_AVATAR_COLOR } from "../../avatar/AvatarCatalog";
import { TITULOS_CATALOG, RAREZA_TITULO_COLOR } from "../../avatar/TitulosCatalog";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useLang } from "../../hooks/useLang.js";
import { auth } from "../../firebase";
import { validateClean } from "../../utils/profanityFilter.js";
import { useToast } from "../../components/shared/ui.jsx";
import { P as _SP, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";

// ── Session-level logros cache (survives tab switches, busted after claim) ───
const _sessionLogrosCache = new Map();  // uid → { ts, logros }
const SESSION_LOGROS_TTL  = 5 * 60_000; // 5 min (mirrors backend TTL)
const Lottie = lazy(() => import("lottie-react"));

function useLottieJson(src) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(src)
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (active) setAnimationData(json);
      })
      .catch(() => {
        if (active) setAnimationData(null);
      });

    return () => {
      active = false;
    };
  }, [src]);

  return animationData;
}

// ── Paleta admin config (igual que el dashboard) ───────────────
const C = {
  bg: _SP.bg0,    side: _SP.bg1,  card: _SP.bg1,   panel: _SP.bg2,
  navy: _SP.navy, navyL: _SP.line,
  orange: _SP.accent, orangeL: _SP.accent2, gold: _SP.gold,
  blue: "#4CC9F0", teal: "#4A9D8F", green: "#6BC87A",
  red: "#E05C8A",  purple: _SP.accent,
  white: _SP.text, muted: _SP.muted, mutedL: _SP.mutedL,
};

// ── Paleta resumen (glassmorphism sobre admin colors) ──────────
const P = {
  ..._SP,
  green: "#6BC87A",
  blue: "#4CC9F0",
};

const CSS = `
  @keyframes up-fadeIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes up-cardIn    { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes up-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes up-pulse     { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes up-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes up-glow      { 0%,100%{text-shadow:0 0 14px #D4A574} 50%{text-shadow:0 0 32px #D4A574,0 0 60px #D4A57444} }
  @keyframes up-shine     { 0%{left:-100%} 100%{left:200%} }
  @keyframes up-saved     { 0%{opacity:0;transform:scale(.8)} 40%{opacity:1;transform:scale(1.1)} 100%{opacity:0;transform:scale(1)} }
  @keyframes up-barFill   { from{width:0} to{width:var(--bw)} }
  @keyframes up-shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes up-boostTick { from{width:100%} to{width:0%} }
  @keyframes up-toastIn   { from{opacity:0;transform:translateY(20px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes up-toastOut  { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(10px) scale(.96)} }
  @keyframes up-editFade  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes up-viewFade  { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes up-inlineErr { 0%{opacity:0;transform:translateY(-4px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes up-boostUrg  { 0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)} 50%{box-shadow:0 0 0 3px var(--bc,#E74C3C)55} }
  @keyframes frame-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes up-ringPulse { 0%,100%{filter:drop-shadow(0 0 4px #D4A57488)} 50%{filter:drop-shadow(0 0 10px #D4A574cc)} }
  @keyframes up-statIn    { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes up-glowPulse { 0%,100%{opacity:.06} 50%{opacity:.12} }

  /* Cards — glassmorphism admin */
  .up-card {
    background: rgba(10,14,26,0.96) !important;
    border: 1px solid rgba(26,51,84,0.9) !important;
    border-radius: 10px !important;
    box-shadow: inset 0 0 0 1px rgba(201,176,55,0.05), 0 8px 32px rgba(0,0,0,.6) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition: all .22s;
  }
  .up-card:hover {
    border-color: rgba(26,51,84,1) !important;
    transform: translateY(-2px);
    box-shadow: inset 0 0 0 1px rgba(201,176,55,0.08), 0 14px 40px rgba(0,0,0,.65) !important;
  }

  .up-btn   { transition:all .2s; cursor:pointer; }
  .up-btn:hover:not(:disabled) { transform:translateY(-2px); }

  /* Inputs — admin style */
  .up-input {
    transition:border-color .2s,box-shadow .2s; outline:none;
    background: rgba(10,14,26,0.8) !important;
    border: 1px solid rgba(26,51,84,0.9) !important;
    border-radius: 8px !important;
    color: #F0F4FF !important;
  }
  .up-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .up-input::placeholder { color:rgba(122,138,158,0.7); }
  .up-input:disabled { opacity:.45; cursor:not-allowed; }

  .up-tab   { transition:all .2s; cursor:pointer; }
  .up-tab:hover { opacity:.85; }
  .up-cls-btn { transition:all .25s; cursor:pointer; }
  .up-cls-btn:hover { transform:scale(1.03); }
  .up-stat-row { transition:background .15s; }
  .up-stat-row:hover { background:rgba(26,51,84,.2) !important; }
  .up-badge { transition:all .2s; cursor:pointer; }
  .up-badge:hover { transform:scale(1.1); }
  .up-danger-btn { transition:all .2s; cursor:pointer; }
  .up-danger-btn:hover { opacity:.85; }

  /* ============================================================
     MI PERFIL RPG REDESIGN  (mp- prefix)
     ============================================================ */
  /* === Animations === */
  @keyframes mpGlow    { 0%,100%{text-shadow:0 0 18px rgba(169,116,255,.7),0 0 36px rgba(169,116,255,.3)} 50%{text-shadow:0 0 32px rgba(169,116,255,1),0 0 60px rgba(169,116,255,.55),0 0 90px rgba(169,116,255,.25)} }
  @keyframes mpFlash   { 0%{opacity:1} 50%{opacity:.45} 100%{opacity:1} }
  @keyframes mpScanline{ 0%{top:-8px} 100%{top:108%} }
  @keyframes mpPulseGold{ 0%,100%{box-shadow:0 0 6px rgba(244,204,120,.3)} 50%{box-shadow:0 0 18px rgba(244,204,120,.75)} }
  @keyframes mpBadgeIn { from{opacity:0;transform:translateY(8px) scale(.9)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes mpTabSlide{ from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @keyframes mpRingAura{ 0%,100%{opacity:.18} 50%{opacity:.38} }
  @keyframes mpCurrFlash{ 0%{transform:scale(1)} 40%{transform:scale(1.08)} 100%{transform:scale(1)} }

  /* === Header === */
  .mp-head { display:flex; align-items:center; gap:12px; margin-bottom:14px; padding:4px 0; }
  .mp-back-btn { width:36px; height:36px; border-radius:10px; background:rgba(22,20,40,0.55); border:1px solid rgba(160,140,220,0.18); color:#a974ff; display:flex; align-items:center; justify-content:center; font-size:13px; cursor:pointer; transition:.2s; flex-shrink:0; }
  .mp-back-btn:hover { background:rgba(124,58,237,0.25); box-shadow:0 0 16px rgba(169,116,255,.6); transform:translateX(-2px); }
  .mp-title { font-family:'Manrope',sans-serif; font-size:20px; font-weight:800; letter-spacing:-.01em; color:#fff; text-shadow:0 0 16px rgba(169,116,255,.5); flex:1; animation:mpGlow 3.5s ease-in-out infinite; }
  .mp-currs { display:flex; align-items:center; gap:7px; }
  .mp-curr { display:flex; align-items:center; gap:7px; padding:6px 11px; border-radius:10px; background:rgba(22,20,40,0.55); border:1px solid rgba(160,140,220,0.18); font-family:'Manrope',sans-serif; font-size:12px; font-weight:700; color:#fff; cursor:default; transition:.2s; position:relative; overflow:hidden; }
  .mp-curr::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.06) 50%,transparent 100%); transform:translateX(-100%); transition:transform .4s; }
  .mp-curr:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(169,116,255,.3); border-color:rgba(169,116,255,.4); }
  .mp-curr:hover::after { transform:translateX(100%); }
  .mp-curr.gold:hover { box-shadow:0 4px 16px rgba(244,204,120,.35); border-color:rgba(244,204,120,.5); }
  .mp-curr.energy:hover { box-shadow:0 4px 16px rgba(255,154,31,.35); border-color:rgba(255,154,31,.4); }
  .mp-ic { width:12px; height:12px; display:inline-block; }
  .mp-curr.gold .mp-ic { background:radial-gradient(circle at 35% 30%,#ffe28a,#c89b3c 55%,#6e4a13); border-radius:50%; box-shadow:0 0 6px rgba(244,204,120,.5); }
  .mp-curr.gem  .mp-ic { background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg); width:10px; height:10px; box-shadow:0 0 6px rgba(192,138,255,.5); }
  .mp-curr.energy .mp-ic { background:linear-gradient(180deg,#fff099,#ff9a1f); clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); box-shadow:0 0 6px rgba(255,154,31,.5); }

  /* === Tab bar === */
  .mp-tabs { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; margin-bottom:16px; }
  .mp-tab  { display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 5px; border-radius:10px; background:rgba(22,20,40,0.55); border:1px solid rgba(160,140,220,0.18); color:#9d93b8; font-family:'Manrope',sans-serif; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; cursor:pointer; transition:.2s; white-space:nowrap; position:relative; overflow:hidden; }
  .mp-tab::before { content:""; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:0; height:2px; background:#a974ff; transition:width .25s; box-shadow:0 0 8px rgba(169,116,255,.8); }
  .mp-tab:hover { color:#e8e2f4; border-color:rgba(169,116,255,.5); transform:translateY(-2px); box-shadow:0 4px 14px rgba(169,116,255,.2); }
  .mp-tab:hover::before { width:60%; }
  .mp-tab.active { color:#fff; background:linear-gradient(180deg,rgba(124,58,237,0.35),rgba(124,58,237,0.12)); border-color:#a974ff; box-shadow:0 0 18px rgba(169,116,255,.5),inset 0 1px 0 rgba(255,255,255,.1); text-shadow:0 0 18px rgba(169,116,255,.9),0 0 36px rgba(169,116,255,.45); }
  .mp-tab.active::before { width:80%; }
  .mp-ti { width:12px; height:12px; flex-shrink:0; display:inline-block; }
  .mp-ti.resumen { background:#a974ff; clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%); }
  .mp-ti.stats   { background:currentColor; clip-path:polygon(0 80%,25% 55%,50% 70%,75% 35%,100% 15%,100% 100%,0 100%); }
  .mp-ti.prog    { background:currentColor; clip-path:polygon(0 60%,30% 60%,30% 20%,60% 20%,60% 45%,100% 45%,100% 100%,0 100%); }
  .mp-ti.equip   { background:currentColor; clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
  .mp-ti.hist    { background:currentColor; border-radius:2px; }

  /* === Glass card base === */
  .mp-card { position:relative; background:rgba(22,20,40,0.55); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(160,140,220,0.18); border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.04); overflow:hidden; padding:16px 18px; transition:transform .2s,box-shadow .2s,border-color .2s; }
  .mp-card:hover { transform:translateY(-3px); box-shadow:0 14px 40px rgba(0,0,0,.55),0 0 24px var(--mp-accent-a,rgba(169,116,255,.15)),inset 0 1px 0 rgba(255,255,255,.07); border-color:rgba(160,140,220,.32); }
  .mp-card::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--mp-accent,#a974ff),transparent); opacity:.9; pointer-events:none; transition:opacity .2s; }
  .mp-card:hover::before { opacity:1; filter:blur(1px); }
  .mp-card-title { display:flex; align-items:center; gap:9px; font-family:'Manrope',sans-serif; font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--mp-accent,#a974ff); text-shadow:0 0 14px var(--mp-accent-a,rgba(169,116,255,.7)),0 0 28px var(--mp-accent-a,rgba(169,116,255,.35)); margin-bottom:14px; }
  .mp-ct-ico { width:15px; height:15px; flex-shrink:0; display:inline-block; }
  .mp-ct-img, .mp-badge-asset, .mp-inline-asset { display:block; object-fit:contain; flex-shrink:0; }
  .mp-ct-img { width:18px; height:18px; filter:drop-shadow(0 0 10px var(--mp-accent-a,rgba(169,116,255,.35))); }
  .mp-inline-asset { width:16px; height:16px; }
  .mp-fire-lottie { width:18px; height:18px; flex-shrink:0; filter:drop-shadow(0 0 10px rgba(255,148,59,.45)); }
  .mp-fire-lottie.sm { width:16px; height:16px; }

  /* === Bento grid === */
  .mp-bento { display:grid; grid-template-columns:1.55fr 1fr 1fr; grid-template-rows:auto auto; gap:13px; margin-bottom:16px; }
  @media (max-width:820px) { .mp-bento { grid-template-columns:1fr 1fr; } .mp-xp-card { grid-column:1/3; grid-row:auto; } }
  .mp-xp-card     { grid-row:span 2; --mp-accent:#a974ff; --mp-accent-a:rgba(169,116,255,.5); }
  .mp-streak-card { --mp-accent:#e0455e; --mp-accent-a:rgba(224,69,94,.5); }
  .mp-time-card   { --mp-accent:#f4cc78; --mp-accent-a:rgba(244,204,120,.5); }
  .mp-coin-card   { --mp-accent:#c89b3c; --mp-accent-a:rgba(200,155,60,.5); }
  .mp-ach-card    { --mp-accent:#4cc9f0; --mp-accent-a:rgba(76,201,240,.5); }

  /* XP ring + meta */
  .mp-xp-inner { display:grid; grid-template-columns:auto 1fr; gap:16px; align-items:center; }
  .mp-ring-wrap { position:relative; width:128px; height:128px; flex-shrink:0; }
  .mp-ring-wrap svg { width:100%; height:100%; transform:rotate(-90deg); }
  .mp-ring-bg { fill:none; stroke:rgba(160,140,220,.12); stroke-width:9; }
  .mp-ring-fg { fill:none; stroke:url(#mpRG); stroke-width:9; stroke-linecap:round; filter:drop-shadow(0 0 8px rgba(169,116,255,.8)) drop-shadow(0 0 16px rgba(169,116,255,.4)); transition:stroke-dashoffset 1.2s; }
  .mp-ring-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .mp-rc-lab  { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#9d93b8; letter-spacing:.08em; text-transform:uppercase; }
  .mp-rc-lv   { font-family:'Manrope',sans-serif; font-size:28px; font-weight:800; color:#fff; text-shadow:0 0 20px rgba(169,116,255,.9),0 0 40px rgba(169,116,255,.5),0 0 70px rgba(169,116,255,.22); line-height:1.1; }
  .mp-rc-cls  { width:18px; height:20px; margin-top:4px; background:linear-gradient(180deg,#a974ff,#7c3aed); clip-path:polygon(0 0,100% 0,100% 72%,50% 100%,0 72%); }
  .mp-xm-lab   { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#9d93b8; letter-spacing:.08em; text-transform:uppercase; margin-bottom:8px; }
  .mp-xm-total { font-family:'Manrope',sans-serif; font-size:22px; font-weight:800; color:#a974ff; text-shadow:0 0 22px rgba(169,116,255,.85),0 0 44px rgba(169,116,255,.42),0 0 70px rgba(169,116,255,.18); margin-bottom:11px; letter-spacing:-.01em; }
  .mp-xp-bar   { height:12px; border-radius:6px; background:rgba(10,8,20,.8); border:1px solid rgba(160,140,220,.15); overflow:hidden; margin-bottom:6px; }
  .mp-xp-bar .xf { height:100%; border-radius:6px; background:linear-gradient(90deg,#7c3aed,#a974ff); box-shadow:0 0 12px rgba(169,116,255,.5),inset 0 1px 0 rgba(255,255,255,.3); width:0; transition:width 1.2s; }
  .mp-xm-cur   { font-family:'Manrope',sans-serif; font-size:12px; font-weight:500; color:#9d93b8; margin-bottom:5px; }
  .mp-xm-need  { font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#a974ff; text-shadow:0 0 10px rgba(169,116,255,.65),0 0 20px rgba(169,116,255,.3); }
  .mp-xp-mini  { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px; padding-top:13px; border-top:1px solid rgba(160,140,220,.12); }
  .mp-xmi      { display:flex; align-items:center; gap:9px; }
  .mp-xmi-ico  { width:26px; height:26px; border-radius:7px; background:rgba(124,58,237,.15); border:1px solid rgba(169,116,255,.3); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .mp-xmi-ico .ds { width:13px; height:13px; background:#a974ff; clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); }
  .mp-xmi-ico .hs { width:12px; height:11px; background:#e0455e; clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%); }
  .mp-xmi-ico .mp-inline-asset { width:15px; height:15px; }
  .mp-xmi-lab  { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#9d93b8; letter-spacing:.06em; text-transform:uppercase; margin-bottom:3px; }
  .mp-xmi-v    { font-family:'Manrope',sans-serif; font-size:16px; font-weight:800; color:#fff; text-shadow:0 0 14px rgba(169,116,255,.5),0 0 28px rgba(169,116,255,.22); }
  .mp-xmi.hp   { flex-direction:column; align-items:stretch; gap:5px; }
  .mp-hp-bar   { height:7px; border-radius:4px; background:rgba(10,8,20,.8); border:1px solid rgba(160,140,220,.15); overflow:hidden; }
  .mp-hp-bar .hf { height:100%; background:linear-gradient(90deg,#e0455e,#ff8a3a); box-shadow:0 0 8px rgba(224,69,94,.4); border-radius:4px; transition:width 1s; }

  /* Small bento cards */
  .mp-mc-big { font-family:'Manrope',sans-serif; font-size:22px; font-weight:800; color:#fff; letter-spacing:-.01em; margin:6px 0; text-shadow:0 0 14px rgba(255,255,255,.25),0 0 28px rgba(255,255,255,.1); }
  .mp-streak-card .mp-mc-big { color:#ff5a6e; text-shadow:0 0 20px rgba(224,69,94,.85),0 0 40px rgba(224,69,94,.42),0 0 64px rgba(224,69,94,.18); }
  .mp-streak-card .mp-mc-big .unit { font-family:'Manrope',sans-serif; font-size:13px; font-weight:600; color:#9d93b8; margin-left:4px; }
  .mp-flame { width:16px; height:20px; background:radial-gradient(circle at 50% 70%,#ff7a1f 30%,#ffd24a 60%,transparent); clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%); filter:drop-shadow(0 0 5px #ff7a1f); animation:mpFlk .6s ease-in-out infinite alternate; }
  @keyframes mpFlk { 100%{transform:scaleY(1.12) scaleX(.92);} }
  .mp-rec-bar   { height:8px; border-radius:5px; background:rgba(10,8,20,.8); border:1px solid rgba(160,140,220,.15); overflow:hidden; margin:5px 0; }
  .mp-rec-bar .rf { height:100%; background:linear-gradient(90deg,#8a1c2a,#e0455e); border-radius:5px; transition:width 1s; }
  .mp-rec-scale { display:flex; justify-content:space-between; font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#5e5675; }
  .mp-cs-row { display:flex; align-items:center; gap:8px; margin-top:9px; padding-top:8px; border-top:1px solid rgba(160,140,220,.1); }
  .mp-cs-ico { width:13px; height:16px; background:radial-gradient(circle at 50% 70%,#ff7a1f 30%,#ffd24a 60%,transparent); clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%); }
  .mp-cs-lab { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#9d93b8; letter-spacing:.06em; text-transform:uppercase; }
  .mp-cs-v   { font-family:'Manrope',sans-serif; font-size:16px; font-weight:800; color:#ff5a6e; margin-top:2px; text-shadow:0 0 14px rgba(224,69,94,.7),0 0 28px rgba(224,69,94,.32); }
  .mp-time-card .mp-mc-big { color:#f4cc78; text-shadow:0 0 20px rgba(244,204,120,.85),0 0 40px rgba(244,204,120,.42),0 0 64px rgba(244,204,120,.18); font-size:21px; }
  .mp-mc-sub { font-family:'Manrope',sans-serif; font-size:14px; font-weight:500; color:#9d93b8; }
  .mp-coin-stack { display:flex; align-items:center; gap:11px; }
  .mp-coin-ico { width:34px; height:34px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#ffe28a,#c89b3c 55%,#6e4a13); box-shadow:0 0 13px rgba(244,204,120,.4); border:2px solid #8a6420; display:flex; align-items:center; justify-content:center; font-family:'Manrope',sans-serif; font-size:16px; font-weight:800; color:#6e4a13; flex-shrink:0; }
  .mp-coin-card .mp-mc-big { color:#f4cc78; margin:0; text-shadow:0 0 20px rgba(244,204,120,.85),0 0 40px rgba(244,204,120,.42),0 0 64px rgba(244,204,120,.18); }
  .mp-ach-frac { font-family:'Manrope',sans-serif; font-size:20px; font-weight:800; color:#fff; margin:6px 0 11px; text-shadow:0 0 16px rgba(76,201,240,.7),0 0 32px rgba(76,201,240,.32); }
  .mp-ach-frac .tot { color:#9d93b8; font-size:15px; font-weight:600; }
  .mp-ach-pending { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-radius:8px; background:rgba(244,204,120,.1); border:1px solid rgba(244,204,120,.35); cursor:pointer; transition:.15s; }
  .mp-ach-pending:hover { background:rgba(244,204,120,.18); }
  .mp-ap-lab { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#f4cc78; letter-spacing:.06em; text-transform:uppercase; }
  .mp-ap-right { display:flex; align-items:center; gap:7px; }
  .mp-ap-bang { width:15px; height:15px; border-radius:50%; background:#f4cc78; color:#1a1208; display:flex; align-items:center; justify-content:center; font-family:'Manrope',sans-serif; font-size:13px; animation:mpBng 1.4s ease-in-out infinite; }
  @keyframes mpBng { 50%{box-shadow:0 0 12px rgba(244,204,120,.8);} }

  /* === Boosts === */
  .mp-boosts-card { --mp-accent:#f4cc78; --mp-accent-a:rgba(244,204,120,.5); margin-bottom:16px; }
  .mp-boosts-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; }
  .mp-boost { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:10px; background:var(--bb,rgba(124,58,237,.08)); border:1px solid var(--bc,rgba(169,116,255,.5)); transition:.2s; cursor:default; }
  .mp-boost:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.4),0 0 16px var(--bc,rgba(169,116,255,.4)); }
  .mp-boost.xp     { --bc:rgba(169,116,255,.5); --bb:rgba(124,58,237,.1); }
  .mp-boost.shield { --bc:rgba(244,204,120,.5); --bb:rgba(200,155,60,.08); }
  .mp-boost.energy { --bc:rgba(106,209,90,.5);  --bb:rgba(106,209,90,.08); }
  .mp-boost-ico { width:36px; height:40px; flex-shrink:0; display:flex; align-items:center; justify-content:center; clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
  .mp-boost.xp     .mp-boost-ico { background:linear-gradient(180deg,rgba(169,116,255,.3),rgba(124,58,237,.15)); color:#a974ff; font-family:'Manrope',sans-serif; font-size:12px; font-weight:800; }
  .mp-boost.shield .mp-boost-ico { background:linear-gradient(180deg,rgba(244,204,120,.25),rgba(200,155,60,.12)); }
  .mp-boost.energy .mp-boost-ico { background:linear-gradient(180deg,rgba(106,209,90,.25),rgba(106,209,90,.1)); }
  .mp-b-shield { width:15px; height:17px; background:#f4cc78; clip-path:polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%); }
  .mp-b-bolt   { width:13px; height:19px; background:#6ad15a; clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); }
  .mp-bm-name  { font-family:'Manrope',sans-serif; font-size:11px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; margin-bottom:4px; }
  .mp-boost.xp     .mp-bm-name { color:#a974ff; }
  .mp-boost.shield .mp-bm-name { color:#f4cc78; }
  .mp-boost.energy .mp-bm-name { color:#6ad15a; }
  .mp-bm-desc  { font-family:'Manrope',sans-serif; font-size:12px; font-weight:500; color:#9d93b8; margin-bottom:4px; }
  .mp-bm-timer { font-family:'Manrope',sans-serif; font-size:12px; font-weight:600; color:#e8e2f4; display:flex; align-items:center; gap:5px; }
  .mp-clk { width:9px; height:9px; border:1.5px solid var(--bc,rgba(169,116,255,.5)); border-radius:50%; }
  .mp-boost-ico .mp-inline-asset { width:18px; height:18px; filter:drop-shadow(0 0 10px var(--bc,rgba(169,116,255,.35))); }

  /* === Weekly bar chart === */
  .mp-week-card { --mp-accent:#a974ff; --mp-accent-a:rgba(169,116,255,.5); margin-bottom:16px; }
  .mp-week-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:13px; }
  .mp-wh-title  { display:flex; align-items:center; gap:9px; font-family:'Manrope',sans-serif; font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#a974ff; text-shadow:0 0 14px rgba(169,116,255,.8),0 0 28px rgba(169,116,255,.38); }
  .mp-wk-stats  { display:flex; align-items:center; gap:11px; }
  .mp-ws        { display:flex; align-items:center; gap:5px; font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#9d93b8; }
  .mp-ws .wv    { color:#fff; }
  .mp-ws .wi    { width:10px; height:10px; display:inline-block; }
  .mp-ws .wi.ses { background:#a974ff; clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); }
  .mp-ws .wi.xp  { background:#a974ff; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
  .mp-cls-badge2 { display:flex; align-items:center; gap:6px; padding:5px 10px; border-radius:7px; background:var(--cls-bg2,rgba(224,69,94,.12)); border:1px solid var(--cls2,#e0455e); }
  .mp-cls-badge2 .cb2-name { font-family:'Manrope',sans-serif; font-size:11px; font-weight:800; color:var(--cls2,#e0455e); letter-spacing:.04em; text-transform:uppercase; }
  .mp-chart      { display:grid; grid-template-columns:24px 1fr; gap:6px; }
  .mp-chart-y    { display:flex; flex-direction:column; justify-content:space-between; align-items:flex-end; font-family:'Manrope',sans-serif; font-size:11px; font-weight:500; color:#5e5675; height:170px; padding-bottom:20px; }
  .mp-chart-bars { display:flex; align-items:flex-end; justify-content:space-around; gap:7px; height:170px; border-left:1px solid rgba(160,140,220,.12); border-bottom:1px solid rgba(160,140,220,.12); padding:0 4px; position:relative; }
  .mp-chart-bars .gl { position:absolute; left:0; right:0; height:1px; background:rgba(160,140,220,.05); }
  .mp-day-col  { flex:1; height:100%; position:relative; }
  .mp-day-bar  { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:40px; border-radius:5px 5px 0 0; background:linear-gradient(180deg,#a974ff,#7c3aed); box-shadow:0 0 10px rgba(169,116,255,.5),inset 0 1px 0 rgba(255,255,255,.2); min-height:4px; cursor:pointer; transition:height .8s cubic-bezier(.3,.9,.4,1); height:0; }
  .mp-day-bar:hover { filter:brightness(1.2); }
  .mp-day-bar.zero { background:linear-gradient(180deg,#3a3550,#232036); box-shadow:none; cursor:default; }
  .mp-db-val   { position:absolute; top:-16px; left:50%; transform:translateX(-50%); font-family:'Manrope',sans-serif; font-size:12px; font-weight:700; color:#fff; white-space:nowrap; }
  .mp-day-bar.zero .mp-db-val { color:#5e5675; }
  .mp-chart-days  { display:grid; grid-template-columns:24px 1fr; gap:6px; margin-top:4px; }
  .mp-cd-row   { display:flex; justify-content:space-around; gap:7px; }
  .mp-cd       { flex:1; text-align:center; font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#9d93b8; }
  .mp-ylab     { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#5e5675; letter-spacing:.06em; text-transform:uppercase; margin-bottom:3px; }

  /* === Stats row === */
  .mp-stats-row { display:grid; grid-template-columns:1fr 1fr; gap:13px; margin-bottom:16px; }
  @media (max-width:720px) { .mp-stats-row { grid-template-columns:1fr; } }
  .mp-cls-card  { }
  .mp-cs-hero   { display:grid; grid-template-columns:88px 1fr; gap:13px; margin-bottom:13px; }
  .mp-cs-portrait { width:88px; height:105px; border-radius:10px; border:2px solid var(--cls2,#e0455e); background:radial-gradient(ellipse 80% 70% at 50% 40%,var(--cls2a,rgba(224,69,94,.3)),transparent 70%),linear-gradient(180deg,#1a0e14,#0a0610); box-shadow:0 0 16px var(--cls2a,rgba(224,69,94,.4)); position:relative; overflow:hidden; flex-shrink:0; }
  .mp-cs-portrait .cp-slot { position:absolute; inset:6px; border:1px dashed var(--cls2,#e0455e); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; opacity:.7; }
  .mp-cs-portrait .cp-glyph { width:24px; height:28px; background:var(--cls2,#e0455e); }
  .mp-cs-portrait .cp-dim { font-family:'Manrope',sans-serif; font-size:10px; font-weight:600; color:#5e5675; }
  .mp-ci-name  { font-family:'Manrope',sans-serif; font-size:14px; font-weight:800; color:var(--cls2,#e0455e); letter-spacing:.04em; text-shadow:0 0 10px var(--cls2a); margin-bottom:7px; }
  .mp-ci-desc  { font-family:'Manrope',sans-serif; font-size:13px; font-weight:500; color:#9d93b8; line-height:1.4; }
  .mp-stat-line { display:grid; grid-template-columns:13px 62px 1fr auto; gap:8px; align-items:center; margin-bottom:9px; }
  .mp-sl-ico   { width:12px; height:12px; display:inline-block; }
  .mp-sl-ico.str { background:#e0455e; clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%); }
  .mp-sl-ico.sta { background:#ff8a3a; clip-path:polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%); }
  .mp-sl-ico.spd { background:#6ad15a; clip-path:polygon(0 0,60% 0,60% 60%,100% 60%,100% 100%,0 100%); }
  .mp-sl-ico.vit { background:#a974ff; clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
  .mp-sl-name  { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700; color:#9d93b8; letter-spacing:.04em; text-transform:uppercase; }
  .mp-sl-bar   { height:8px; border-radius:5px; background:rgba(10,8,20,.8); border:1px solid rgba(160,140,220,.12); overflow:hidden; }
  .mp-sl-bar .sf { display:block; height:100%; border-radius:5px; box-shadow:inset 0 1px 0 rgba(255,255,255,.2); width:0; transition:width 1s cubic-bezier(.3,.9,.4,1); }
  .mp-sf.str { background:linear-gradient(90deg,#8a1c2a,#e0455e); }
  .mp-sf.sta { background:linear-gradient(90deg,#8a4a14,#ff8a3a); }
  .mp-sf.spd { background:linear-gradient(90deg,#3a7a1c,#6ad15a); }
  .mp-sf.vit { background:linear-gradient(90deg,#5a189a,#a974ff); }
  .mp-sl-val   { font-family:'Manrope',sans-serif; font-size:14px; font-weight:700; color:#e8e2f4; min-width:44px; text-align:right; }
  .mp-sl-val .max { color:#5e5675; font-size:11px; font-weight:500; }
  .mp-cls-bonus { margin-top:11px; padding:8px 11px; border-radius:8px; background:rgba(224,69,94,.08); border:1px solid var(--cls2,#e0455e); font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#9d93b8; letter-spacing:.02em; }
  .mp-cls-bonus .bv { color:var(--cls2,#e0455e); }
  .mp-gen-card  { --mp-accent:#4cc9f0; --mp-accent-a:rgba(76,201,240,.5); }
  .mp-gen-row   { display:grid; grid-template-columns:14px 1fr auto; gap:9px; align-items:center; padding:9px 6px; border-bottom:1px solid rgba(160,140,220,.08); border-radius:6px; transition:.15s; margin:0 -6px; }
  .mp-gen-row:hover { background:rgba(169,116,255,.07); border-bottom-color:rgba(169,116,255,.15); }
  .mp-gen-row:last-child { border-bottom:0; }
  .mp-gr-ico    { width:13px; height:13px; display:inline-block; opacity:.85; }
  .mp-gr-ico.mission { background:#4cc9f0; clip-path:polygon(20% 0,80% 0,80% 50%,65% 70%,65% 80%,80% 80%,80% 100%,20% 100%,20% 80%,35% 80%,35% 70%,20% 50%); }
  .mp-gr-ico.fav     { background:#e0455e; clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); }
  .mp-gr-ico.cat     { background:#f4cc78; clip-path:polygon(15% 5%,85% 5%,95% 95%,5% 95%); }
  .mp-gr-ico.days    { background:#6ad15a; border-radius:2px; }
  .mp-gr-ico.date    { background:#a974ff; clip-path:polygon(0 12%,100% 12%,100% 100%,0 100%); }
  .mp-gr-lab { font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#9d93b8; letter-spacing:.04em; text-transform:uppercase; }
  .mp-gr-val { font-family:'Manrope',sans-serif; font-size:13px; font-weight:700; color:#fff; white-space:nowrap; }

  /* === XP ring glow aura === */
  .mp-ring-wrap::after { content:""; position:absolute; inset:-8px; border-radius:50%; background:radial-gradient(circle,rgba(169,116,255,.18) 0%,transparent 70%); animation:mpRingAura 2.5s ease-in-out infinite; pointer-events:none; }

  /* Stat line hover */
  .mp-stat-line { cursor:default; border-radius:5px; padding:2px 4px; transition:background .15s; margin:0 -4px; margin-bottom:9px; }
  .mp-stat-line:hover { background:rgba(169,116,255,.08); }

  /* Ach pending hover */
  .mp-ach-pending:hover { background:rgba(244,204,120,.18); box-shadow:0 0 12px rgba(244,204,120,.25); }

  /* === Achievement showcase === */
  .mp-showcase-card { --mp-accent:#f4cc78; --mp-accent-a:rgba(244,204,120,.5); background:linear-gradient(180deg,rgba(40,32,12,.5),rgba(20,16,8,.6)); border-color:rgba(244,204,120,.3); }
  .mp-showcase-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
  .mp-sh-title { display:flex; align-items:center; gap:9px; font-family:'Manrope',sans-serif; font-size:12px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#f4cc78; text-shadow:0 0 16px rgba(244,204,120,.85),0 0 32px rgba(244,204,120,.4); }
  .mp-sh-trophy { width:14px; height:14px; background:#f4cc78; clip-path:polygon(20% 0,80% 0,85% 18%,100% 22%,95% 40%,75% 50%,65% 65%,65% 78%,80% 78%,80% 100%,20% 100%,20% 78%,35% 78%,35% 65%,25% 50%,5% 40%,0 22%,15% 18%); display:inline-block; }
  .mp-showcase-meta { display:flex; align-items:center; gap:13px; font-family:'Manrope',sans-serif; font-size:11px; font-weight:600; color:#9d93b8; }
  .mp-sm-v { color:#f4cc78; }
  .mp-sm-pend { display:flex; align-items:center; gap:5px; }
  .mp-sm-bang { width:14px; height:14px; border-radius:50%; background:#f4cc78; color:#1a1208; display:flex; align-items:center; justify-content:center; font-family:'Manrope',sans-serif; font-size:12px; }
  .mp-badge-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:9px; }
  @media (max-width:720px) { .mp-badge-grid { grid-template-columns:repeat(3,1fr); } }
  @media (max-width:820px) { .mp-boosts-grid { grid-template-columns:1fr; } }
  .mp-badge { position:relative; border-radius:10px; padding:11px 5px 8px; display:flex; flex-direction:column; align-items:center; gap:6px; background:var(--bd-bg2,rgba(20,18,30,.5)); border:1px solid var(--bd-c2,rgba(120,120,140,.3)); cursor:pointer; transition:transform .15s,box-shadow .15s; }
  .mp-badge.earned { box-shadow:0 0 14px var(--bd-a2); animation:mpBadgeIn .4s ease both; }
  .mp-badge.earned:hover { transform:translateY(-5px) scale(1.04); box-shadow:0 0 28px var(--bd-a2),0 8px 20px rgba(0,0,0,.4); }
  .mp-badge.locked { opacity:.38; filter:grayscale(.85); }
  .mp-badge.locked:hover { opacity:.55; transform:scale(1.02); }
  .mp-badge.r-common  { --bd-c2:#6ad15a; --bd-a2:rgba(106,209,90,.5);  --bd-bg2:rgba(106,209,90,.08); }
  .mp-badge.r-rare    { --bd-c2:#4cc9f0; --bd-a2:rgba(76,201,240,.5);  --bd-bg2:rgba(76,201,240,.08); }
  .mp-badge.r-epic    { --bd-c2:#a974ff; --bd-a2:rgba(169,116,255,.55); --bd-bg2:rgba(169,116,255,.1); }
  .mp-badge.r-legend  { --bd-c2:#f4cc78; --bd-a2:rgba(244,204,120,.6); --bd-bg2:rgba(244,204,120,.1); }
  .mp-badge.r-mythic  { --bd-c2:#c0c0d0; --bd-a2:rgba(192,192,208,.45); --bd-bg2:rgba(192,192,208,.08); }
  .mp-badge-hex { width:46px; height:52px; position:relative; display:flex; align-items:center; justify-content:center; }
  .mp-badge-hex .bh-sh { position:absolute; inset:0; background:linear-gradient(180deg,rgba(120,120,140,.2),#0c0a14); clip-path:polygon(50% 0,100% 27%,100% 73%,50% 100%,0 73%,0 27%); box-shadow:inset 0 0 0 2px var(--bd-c2); }
  .mp-badge-hex .bh-ico { position:relative; z-index:1; font-family:'Manrope',sans-serif; font-size:20px; color:var(--bd-c2); text-shadow:0 0 7px var(--bd-a2); }
  .mp-badge-asset { position:relative; z-index:2; width:30px; height:30px; filter:drop-shadow(0 0 10px var(--bd-a2)); }
  .mp-bd-check { position:absolute; top:7px; right:7px; width:15px; height:15px; border-radius:50%; background:#6ad15a; display:flex; align-items:center; justify-content:center; font-family:'Manrope',sans-serif; font-size:10px; font-weight:800; color:#0a0712; }
  .mp-bd-name   { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700; color:#e8e2f4; text-align:center; line-height:1.3; min-height:15px; }
  .mp-bd-rarity { font-family:'Manrope',sans-serif; font-size:10px; font-weight:600; color:var(--bd-c2); }
  .mp-showcase-foot { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:13px; font-family:'Manrope',sans-serif; font-size:12px; font-weight:500; color:#5e5675; }

  /* === Responsive breakpoints === */
  @media (max-width:1760px) {
    .mp-bento { grid-template-columns:1.5fr 1fr 1fr; }
  }
  @media (max-width:1600px) {
    .mp-bento { grid-template-columns:1.45fr 1fr 1fr; }
  }
  @media (max-width:1440px) {
    .mp-bento { grid-template-columns:1.4fr 1fr 1fr; }
    .mp-tab { font-size:11px; }
  }
  @media (max-width:1366px) {
    .mp-bento { grid-template-columns:1.38fr 1fr 1fr; }
    .mp-tab { font-size:10.5px; padding:10px 4px; }
  }
  @media (max-width:1280px) {
    .mp-bento { grid-template-columns:1.4fr 1fr 1fr; }
    .mp-boosts-grid { grid-template-columns:repeat(3,1fr); }
  }
  @media (max-width:1080px) {
    .mp-bento { grid-template-columns:1fr 1fr; }
    .mp-xp-card { grid-column:1/3; grid-row:auto; }
    .mp-boosts-grid { grid-template-columns:repeat(2,1fr); }
    .mp-badge-grid { grid-template-columns:repeat(4,1fr); }
    .mp-tabs { grid-template-columns:repeat(5,1fr); gap:5px; }
    .mp-tab  { padding:8px 3px; font-size:10px; }
  }
  @media (max-width:820px) {
    .mp-bento { grid-template-columns:1fr 1fr; }
    .mp-xp-card { grid-column:1/3; grid-row:auto; }
    .mp-tabs { grid-template-columns:repeat(5,1fr); gap:4px; }
    .mp-boosts-grid { grid-template-columns:1fr; }
    .mp-badge-grid { grid-template-columns:repeat(3,1fr); }
    .mp-stats-row { grid-template-columns:1fr; }
    .mp-head { flex-wrap:wrap; }
    .mp-currs { flex-wrap:wrap; }
  }
  @media (max-width:640px) {
    .mp-bento { grid-template-columns:1fr; }
    .mp-xp-card { grid-column:auto; }
    .mp-tabs { grid-template-columns:repeat(3,1fr) repeat(2,1fr); }
    .mp-badge-grid { grid-template-columns:repeat(3,1fr); }
    .mp-boosts-grid { grid-template-columns:1fr; }
    .mp-ring-wrap { width:100px; height:100px; }
  }
  @media (max-width:480px) {
    .mp-tabs { grid-template-columns:1fr 1fr; gap:4px; }
    .mp-tab  { padding:8px 4px; font-size:10px; }
    .mp-badge-grid { grid-template-columns:repeat(2,1fr); }
    .mp-head { gap:8px; }
  }
`;

const px   = (s)       => ({ fontFamily:"'Manrope',sans-serif", fontSize:typeof s==="number"?Math.max(Math.round(s*1.9),11):s, fontWeight:800, lineHeight:1.3 });
const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);

// ── Clase configs ──────────────────────────────────────────────
const CLS = {
  GUERRERO:{ icon:"⚔️", color:C.orange, bg:`${C.orange}14`, desc:"Domina los ejercicios de fuerza",       bonus:"Fuerza +25% XP",      stats:{fuerza:95,resistencia:70,agilidad:55,vitalidad:60} },
  ARQUERO: { icon:"🏃", color:C.blue,   bg:`${C.blue}14`,   desc:"Especialista en cardio y velocidad",    bonus:"Cardio +25% XP",      stats:{agilidad:95,resistencia:85,fuerza:50,vitalidad:70} },
  MAGO:    { icon:"🧘", color:C.purple, bg:`${C.purple}14`, desc:"Maestro de la flexibilidad y la mente", bonus:"Flexibilidad +25% XP", stats:{vitalidad:95,agilidad:80,resistencia:75,fuerza:45} },
};

const RAREZA_COLOR = { Común:C.muted, Raro:C.blue, Épico:C.purple, Legendario:C.gold };

// ── Fallback stats ─────────────────────────────────────────────
const PROFILE_CLS = {
  ...CLS,
  GUERRERO: { ...CLS.GUERRERO, color:"#ff4d5e", bg:"rgba(255,77,94,.14)", secondary:"#c9184a", crest:"/ui/crest-warrior.png", route:"Rompe marcas de fuerza y sostén la disciplina de la forja." },
  ARQUERO:  { ...CLS.ARQUERO,  color:"#6BC87A", bg:"rgba(107,200,122,.14)", secondary:"#20c997", crest:"/ui/crest-archer.png", route:"Mantén pulso alto, zancada estable y sesiones ligeras en cadena." },
  MAGO:     { ...CLS.MAGO,     color:"#4CC9F0", bg:"rgba(76,201,240,.14)", secondary:"#2f80ed", crest:"/ui/crest-mage.png", route:"Trabaja movilidad, foco y control para sostener progreso fino." },
};
const rgbaHex = (hex, alpha = 1) => {
  if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
  const raw = hex.slice(1);
  const full = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const PROFILE_TAB_STORAGE_KEY = "fv-user-profile-tab-v2";
const PROFILE_STAGE_BG = {
  GUERRERO: "/ui/scene-bg.png",
  ARQUERO: "/ui/scene-bg.png",
  MAGO: "/ui/scene-bg.png",
};

const getScopedStorageKey = (baseKey, uid) => (uid ? `${baseKey}-${uid}` : baseKey);

function useScopedStorageState(baseKey, fallbackValue) {
  const scopedKey = getScopedStorageKey(baseKey, auth.currentUser?.uid || null);
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return fallbackValue;
    return window.localStorage.getItem(scopedKey) || fallbackValue;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextValue = window.localStorage.getItem(scopedKey) || fallbackValue;
    setValue((prev) => (prev === nextValue ? prev : nextValue));
  }, [fallbackValue, scopedKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(scopedKey, value);
  }, [scopedKey, value]);

  return [value, setValue];
}

const EMPTY_STATS = {
  sesionesTotales:0, xpTotal:0, rachaMax:0, tiempoTotal:0,
  logrosObtenidos:0, misionesCompletadas:0, ejercicioFav:"-",
  categFav:"-", diasActivo:0, nivel:1, xp:0, xpNext:1000, hp:100,
  streak:0, coins:0, heroClass:"GUERRERO", username:"Heroe", email:"",
  heroName:"", titulo:"", bio:"", createdAt:"-", updatedAt:"",
  pendingEmailTarget:"", pendingEmailStatus:"idle", pendingEmailRequestedAt:"", pendingEmailResolvedAt:"",
  lastActivityAt:"", lastWorkoutAt:"", lastExerciseAt:"",
  activeBoosts:{}, streakShield:null, ownedSkins:["default"], activeSkin:"default",
  ownedAvatars:["avatar_01"], activeAvatar:"avatar_01",
  ownedFrames:[], activeFrame:null,
  ownedTitles:[], usernameChanged: false,
  profileModules: {},
};

function normalizeProfileModules(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    estadisticas: {
      focus: String(source?.estadisticas?.focus || "base"),
      pin: String(source?.estadisticas?.pin || "nivel"),
      note: String(source?.estadisticas?.note || ""),
      lastViewedAt: String(source?.estadisticas?.lastViewedAt || ""),
    },
    progreso: {
      focus: String(source?.progreso?.focus || "momentum"),
      pin: String(source?.progreso?.pin || "nivel"),
      note: String(source?.progreso?.note || ""),
      lastViewedAt: String(source?.progreso?.lastViewedAt || ""),
    },
    historial: {
      focus: String(source?.historial?.focus || "semana"),
      pin: String(source?.historial?.pin || "xp"),
      note: String(source?.historial?.note || ""),
      lastViewedAt: String(source?.historial?.lastViewedAt || ""),
    },
  };
}

// Normaliza profile doc de Firebase a stats esperados
function profileToStats(p) {
  if (!p) return EMPTY_STATS;
  return {
    ...EMPTY_STATS,
    sesionesTotales:    Number(p.totalRutinas   || 0),
    xpTotal:            Number(p.xpTotal         || p.xp || 0),
    rachaMax:           Number(p.maxStreak       || p.streak || 0),
    nivel:              Number(p.level           || 1),
    xp:                 Number(p.xp              || 0),
    xpNext:             Number(p.xpNext          || 1000),
    hp:                 Number(p.hp              || 100),
    streak:             Number(p.streak          || 0),
    coins:              Number(p.coins           || 0),
    heroClass:          p.heroClass              || "GUERRERO",
    username:           p.username               || "Heroe",
    email:              p.email                  || "",
    heroName:           p.heroName               || "",
    titulo:             p.titulo                 || "",
    bio:                p.bio                    || "",
    createdAt:          (p.createdAt             || "").slice(0, 10),
    updatedAt:          p.updatedAt              || "",
    pendingEmailTarget: p.pendingEmailTarget     || "",
    pendingEmailStatus: p.pendingEmailStatus     || "idle",
    pendingEmailRequestedAt: p.pendingEmailRequestedAt || "",
    pendingEmailResolvedAt: p.pendingEmailResolvedAt || "",
    lastActivityAt:     p.lastActivityAt         || "",
    lastWorkoutAt:      p.lastWorkoutAt          || "",
    lastExerciseAt:     p.lastExerciseAt         || "",
    activeBoosts:       p.activeBoosts           || {},
    streakShield:       p.streakShield           || null,
    ownedSkins:         p.ownedSkins             || ["default"],
    activeSkin:         p.activeSkin             || "default",
    ownedAvatars:       p.ownedAvatars           || ["avatar_01"],
    activeAvatar:       p.activeAvatar           || "avatar_01",
    ownedFrames:        p.ownedFrames            || [],
    activeFrame:        p.activeFrame            || null,
    ownedTitles: (() => {
      const arr = Array.isArray(p.ownedTitles) ? p.ownedTitles : [];
      if (p.titulo && !arr.includes(p.titulo)) return [...arr, p.titulo];
      return arr;
    })(),
    usernameChanged:    p.usernameChanged        ?? false,
    weeklyXP:           Number(p.weeklyXP         || 0),
    tiempoTotal:        Number(p.tiempoTotal       || 0),
    profileModules:     normalizeProfileModules(p.profileModules),
  };
}

// Helpers
function coerceDate(value) {
  if (!value) return null;
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStamp(value, fallback = "Sin registro") {
  const date = coerceDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRecentStamp(value, fallback = "Sin lectura reciente") {
  const date = coerceDate(value);
  if (!date) return fallback;
  const now = new Date();
  const sameDay = date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return `Hoy ${new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)}`;
  }
  return formatStamp(date, fallback);
}

function isTodayStamp(value) {
  const date = coerceDate(value);
  if (!date) return null;
  const now = new Date();
  return date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();
}

function normalizeRarityLabel(raw) {
  const value = String(raw || "").toLowerCase();
  if (value.includes("legend")) return "Legendario";
  if (value.includes("mit")) return "Mitico";
  if (value.includes("ep")) return "Epico";
  if (value.includes("raro")) return "Raro";
  if (value.includes("poco")) return "Poco comun";
  if (value.includes("com")) return "Comun";
  return raw || "Comun";
}

function mergeCatalogEntryWithFallback(entry, fallbackEntry = {}) {
  return {
    ...fallbackEntry,
    ...entry,
    rareza: entry?.rareza || fallbackEntry?.rareza || "Comun",
    precio: Number(entry?.precio ?? fallbackEntry?.precio ?? 0),
  };
}

const RARITY_RANK = {
  Comun: 1,
  "Poco comun": 2,
  Raro: 3,
  Epico: 4,
  Legendario: 5,
  Mitico: 6,
};

function getReadableProvider(providerId) {
  if (providerId === "google.com") return "Google";
  if (providerId === "password") return "Correo y clave";
  if (providerId === "github.com") return "GitHub";
  return "Proveedor vinculado";
}

function MiniBar({val,max,color,height=6}) {
  const pct=Math.min(max>0?(val/max)*100:0, 100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,
        boxShadow:`0 0 6px ${color}66`,"--bw":`${pct}%`,
        animation:"up-barFill .8s ease .2s both",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",animation:"up-shine 2s ease .5s 1"}}/>
      </div>
    </div>
  );
}

function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"up-spin .8s linear infinite"}}/>;
}

function SavedFlash({show}) {
  const { t } = useLang();
  if(!show) return null;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,...raj(12,700),color:C.green,
      background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"6px 14px",
      animation:"up-saved 2s ease forwards"}}>
      <Check size={13}/> {t("pr.edit.saved_flash")}
    </div>
  );
}

function CInput({label, value, onChange, onBlur, type="text", placeholder="", disabled=false, error, rows}) {
  const [show, setShow] = useState(false);
  const inputType = type==="password"&&show?"text":type;
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",...px(6),color:C.muted,marginBottom:7,letterSpacing:".06em"}}>{label}</label>}
      <div style={{position:"relative"}}>
        {rows ? (
          <textarea value={value} onChange={e=>onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder} disabled={disabled} rows={rows}
            className="up-input"
            style={{width:"100%",padding:"11px 14px",background:C.panel,
              border:`1px solid ${error?C.red:C.navy}`,color:C.white,
              ...raj(13,500),resize:"vertical"}}/>
        ) : (
          <input type={inputType} value={value}
            onChange={e=>onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder} disabled={disabled}
            className="up-input"
            style={{width:"100%",padding:type==="password"?"11px 44px 11px 14px":"11px 14px",
              background:C.panel,border:`1px solid ${error?C.red:C.navy}`,color:C.white,
              ...raj(13,500)}}/>
        )}
        {type==="password"&&(
          <button type="button" onClick={()=>setShow(s=>!s)}
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}>
            {show?<EyeOff size={14}/>:<Eye size={14}/>}
          </button>
        )}
      </div>
      {error&&<div style={{...raj(11),color:C.red,marginTop:5,animation:"up-inlineErr .25s ease both"}}>⚠ {error}</div>}
    </div>
  );
}

function EInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder = "",
  disabled = false,
  error = null,
  rows = 0,
  badge = null,
  hint = null,
}) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" && show ? "text" : type;
  const isTextarea = Number(rows) > 0;

  return (
    <div style={{ marginBottom: 14 }}>
      {(label || badge) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 7,
          }}
        >
          {label ? (
            <label
              style={{
                display: "block",
                fontFamily: "'Manrope',sans-serif",
                fontSize: 10,
                fontWeight: 700,
                color: C.muted,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </label>
          ) : <span />}
          {badge}
        </div>
      )}

      <div style={{ position: "relative" }}>
        {isTextarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="up-input"
            style={{
              width: "100%",
              paddingTop: 11,
              paddingRight: 14,
              paddingBottom: 11,
              paddingLeft: 14,
              background: C.panel,
              border: `1px solid ${error ? C.red : C.navy}`,
              color: C.white,
              ...raj(13, 500),
              resize: "vertical",
            }}
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="up-input"
            style={{
              width: "100%",
              paddingTop: 11,
              paddingRight: type === "password" ? 44 : 14,
              paddingBottom: 11,
              paddingLeft: 14,
              background: C.panel,
              border: `1px solid ${error ? C.red : C.navy}`,
              color: C.white,
              ...raj(13, 500),
            }}
          />
        )}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar contenido" : "Mostrar contenido"}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              display: "flex",
            }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>

      {hint && !error && (
        <div
          style={{
            ...raj(11),
            color: C.muted,
            marginTop: 5,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>
      )}
      {error && (
        <div style={{ ...raj(11), color: C.red, marginTop: 5, animation: "up-inlineErr .25s ease both" }}>
          âš  {error}
        </div>
      )}
    </div>
  );
}

function HeroAvatar({heroClass, size=80, animated=false}) {
  const cls = PROFILE_CLS[heroClass]||PROFILE_CLS.GUERRERO;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:"50%",
        background:`radial-gradient(circle at 35% 35%,${cls.color}28,${cls.color}08 60%,transparent 100%)`,
        border:`3px solid ${cls.color}55`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*.44,
        boxShadow:`0 0 ${size*.3}px ${cls.color}33,inset 0 0 ${size*.2}px ${cls.color}14`,
        animation:animated?"up-float 3s ease-in-out infinite":"none"}}>
        {cls.icon}
      </div>
      <div style={{position:"absolute",bottom:2,right:2,background:C.navy,borderRadius:"50%",
        width:size*.28,height:size*.28,border:`2px solid ${cls.color}55`,
        display:"flex",alignItems:"center",justifyContent:"center",...px(size*.07),color:cls.color}}>
        ⚡
      </div>
    </div>
  );
}

// ── Frame PNG overlay — transparent center shows avatar ────────
function FrameOverlay({ frameId, fallbackGradient, fallbackAnimated, outerSize, avatarSize }) {
  const [ok, setOk] = useState(true);
  const holePct = `${Math.round((avatarSize / outerSize) * 50)}%`;
  if (ok) {
    return (
      <img
        src={`/marcos/${frameId}.png`}
        alt={frameId}
        onError={() => setOk(false)}
        style={{
          position:"absolute", inset:0,
          width:outerSize, height:outerSize,
          objectFit:"fill", zIndex:2, pointerEvents:"none",
        }}
      />
    );
  }
  return (
    <div style={{
      position:"absolute", inset:0, borderRadius:"50%", zIndex:2,
      background: fallbackGradient,
      animation: fallbackAnimated ? "frame-spin 3s linear infinite" : "none",
      mask:`radial-gradient(circle at center, transparent ${holePct}, black calc(${holePct} + 2%))`,
      WebkitMask:`radial-gradient(circle at center, transparent ${holePct}, black calc(${holePct} + 2%))`,
      pointerEvents:"none",
    }}/>
  );
}

// ── Profile picture with optional frame ────────────────────────
// `size` = avatar circle diameter. A proportional invisible outer
// ring (~22% each side) gives frame PNGs space to bleed outward.
function ProfileAvatar({ heroClass, avatarId="avatar_01", frameId=null, size=90, cls }) {
  const [imgOk, setImgOk] = useState(true);
  const clsMeta = cls || PROFILE_CLS[heroClass] || PROFILE_CLS.GUERRERO;
  const avatar  = AVATARS_CATALOG.find(a => a.id === avatarId) || AVATARS_CATALOG[0];
  const frame   = FRAMES_CATALOG.find(f => f.id === frameId);
  const glowCol = frame ? frame.color : clsMeta.color;
  const PAD     = Math.round(size * 0.22);
  const outerSz = size + 2 * PAD;

  return (
    <div style={{ position:"relative", width:outerSz, height:outerSz, flexShrink:0 }}>
      {/* Avatar image circle — centered in outer container */}
      <motion.div
        animate={{ boxShadow:[`0 0 12px ${glowCol}44`,`0 0 26px ${glowCol}77`,`0 0 12px ${glowCol}44`] }}
        transition={{ duration:2.8, repeat:Infinity, ease:"easeInOut" }}
        style={{
          position:"absolute", top:PAD, left:PAD,
          width:size, height:size, borderRadius:"50%",
          background:`linear-gradient(135deg,${SC.card},${SC.bg})`,
          border: frame ? `1px solid ${frame.color}44` : `2px solid ${clsMeta.color}66`,
          overflow:"hidden", zIndex:1,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
        {imgOk ? (
          <img
            src={`/perfil/${avatar.id}.png`}
            alt={avatar.nombre}
            onError={() => setImgOk(false)}
            style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }}
          />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:Math.max(size*0.38,22), lineHeight:1 }}>👤</span>
            <span style={{ fontSize:Math.max(size*0.14,10), color:avatar.color, fontWeight:700, opacity:.7 }}>
              {avatar.id.replace("avatar_","")}
            </span>
          </div>
        )}
      </motion.div>

      {/* Frame PNG overlay — covers full outer container */}
      {frame && (
        <FrameOverlay
          frameId={frame.id}
          fallbackGradient={frame.gradient}
          fallbackAnimated={frame.animated}
          outerSize={outerSz}
          avatarSize={size}
        />
      )}

      {/* Class dot badge — anchored to avatar circle edge */}
      <motion.div animate={{ scale:[1,1.15,1] }} transition={{ duration:2, repeat:Infinity }}
        style={{
          position:"absolute",
          bottom: PAD + 1, right: PAD + 1,
          width:22, height:22, borderRadius:"50%",
          background:`linear-gradient(135deg,${clsMeta.color},${clsMeta.color}aa)`,
          border:`2px solid ${SC.bg}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, boxShadow:`0 2px 8px ${clsMeta.color}66`,
          zIndex:3,
        }}>
        {clsMeta.icon}
      </motion.div>
    </div>
  );
}

// ── Active boosts helper — live countdown ──────────────────────
function ActiveBoosts({activeBoosts, streakShield}) {
  const { t } = useLang();
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(tk => tk + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const BOOST_META = {
    xp_bonus:    { icon:"⚡", label:t("pr.boost.xp_bonus"),       color:P.gold,   defaultSecs:3600  },
    xp_mult:     { icon:"✨", label:t("pr.boost.xp_mult"),         color:P.accent2,defaultSecs:7200  },
    cooldown_red:{ icon:"⏱️", label:t("pr.boost.cooldown_red"),    color:P.blue,   defaultSecs:86400 },
  };

  const fmtTime = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
    if (m > 0) return `${m}m ${String(sec).padStart(2,"0")}s`;
    return `${sec}s`;
  };

  const now = Date.now();
  const boosts = [];

  Object.entries(activeBoosts||{}).forEach(([tipo, data]) => {
    if (!data?.expiresAt) return;
    const msLeft = new Date(data.expiresAt).getTime() - now;
    if (msLeft <= 0) return;
    const meta = BOOST_META[tipo] || { icon:"⚡", label:tipo, color:P.accent, defaultSecs:3600 };
    const totalMs = (data.durationSecs || meta.defaultSecs) * 1000;
    const pct = Math.min(100, Math.max(0, (msLeft / totalMs) * 100));
    const urgent = msLeft < 5 * 60 * 1000;
    boosts.push({ tipo, ...meta, valor:data.valor, msLeft, pct, urgent });
  });

  if (streakShield?.expiresAt) {
    const msLeft = new Date(streakShield.expiresAt).getTime() - now;
    if (msLeft > 0) {
      boosts.push({ tipo:"streakShield", icon:"🛡️", label:t("pr.boost.streak_shield"),
        color:P.accent, valor:streakShield.days, msLeft, pct:100,
        urgent: msLeft < 12 * 3600 * 1000 });
    }
  }

  if (boosts.length === 0) return null;

  return (
    <motion.div
      initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
      transition={{type:"spring",stiffness:240,damping:22}}
      style={{
        background:`linear-gradient(160deg,${P.bg2}dd,${P.bg1}ee)`,
        border:`1px solid ${P.gold}33`,borderRadius:20,
        padding:"20px 22px",backdropFilter:"blur(14px)",
        position:"relative",overflow:"hidden",
      }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,borderRadius:"20px 20px 0 0",
        background:`linear-gradient(90deg,transparent,${P.gold},transparent)`}}/>
      <div style={{...mono(9,700),color:P.gold,marginBottom:14,letterSpacing:".08em"}}>{t("pr.res.boosts_active")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {boosts.map((b,i) => (
          <motion.div key={i}
            initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
            transition={{delay:i*.06}}
            style={{
              display:"flex",alignItems:"center",gap:14,
              background:b.urgent?`${b.color}14`:`${b.color}0a`,
              border:`1px solid ${b.color}${b.urgent?"66":"33"}`,
              borderRadius:14,padding:"12px 16px",
              animation:b.urgent?"up-boostUrg 1.4s ease-in-out infinite":undefined,
              "--bc":b.color,
            }}>
            <span style={{fontSize:22,filter:`drop-shadow(0 0 8px ${b.color})`}}>{b.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <div style={{...sans(13,700),color:P.text}}>{b.label}</div>
                {b.valor && (
                  <span style={{
                    ...mono(10,700),color:b.color,
                    background:`${b.color}1a`,border:`1px solid ${b.color}44`,
                    borderRadius:8,padding:"1px 8px",
                  }}>{b.valor}</span>
                )}
              </div>
              <div style={{height:5,borderRadius:99,background:`${b.color}18`,overflow:"hidden"}}>
                <motion.div
                  initial={{width:"100%"}} animate={{width:`${b.pct}%`}}
                  transition={{duration:.8,ease:"linear"}}
                  style={{
                    height:"100%",borderRadius:99,
                    background:b.urgent?`linear-gradient(90deg,${b.color},${P.accent})`:b.color,
                    boxShadow:`0 0 6px ${b.color}88`,
                  }}/>
              </div>
            </div>
            <div style={{textAlign:"right",minWidth:76}}>
              <div style={{
                ...mono(12,800),color:b.urgent?P.accent:b.color,
                textShadow:`0 0 10px ${b.color}66`,
                animation:b.urgent?"up-pulse 1s ease-in-out infinite":undefined,
              }}>
                {fmtTime(b.msLeft)}
              </div>
              {b.urgent && (
                <div style={{...mono(7,700),color:P.accent,marginTop:2}}>{t("pr.res.boost_expiring")}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// TAB: RESUMEN — RPG Dark redesign (mp- classes)
// ══════════════════════════════════════════════════════════════
function TabResumen({stats, badges, actividad}) {
  const cls = PROFILE_CLS[stats.heroClass] || PROFILE_CLS.GUERRERO;
  const fireAnimation = useLottieJson("/lottie/fire.json");
  const withAlpha = (hex, alpha = 0.4) => {
    if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
    const raw = hex.slice(1);
    const full = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
    const value = Number.parseInt(full, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const [hovDay, setHovDay] = useState(null);
  const [barsReady, setBarsReady] = useState(false);
  const [summaryPane, setSummaryPane] = useScopedStorageState("fv-profile-summary-pane-v1", "panel");
  useEffect(() => { const t = setTimeout(() => setBarsReady(true), 80); return () => clearTimeout(t); }, []);

  const xp = stats.xp || 0;
  const xpNext = stats.xpNext || 1000;
  const level = stats.nivel || 1;
  const xpPct = Math.min(100, xpNext > 0 ? (xp / xpNext) * 100 : 0);
  const RR = 52, CIRC = 2 * Math.PI * RR;
  const dashOffset = CIRC * (1 - xpPct / 100);

  const CLS_COLORS = {
    GUERRERO:{ cls2:"#ff4d5e", cls2a:"rgba(255,77,94,0.45)",  cls2bg:"rgba(255,77,94,0.12)",  philo:"La fuerza nace del enfoque, la disciplina y la voluntad que sostiene la rutina.", bonus:"+25% XP EN EJERCICIOS DE FUERZA" },
    ARQUERO: { cls2:"#6ad15a", cls2a:"rgba(106,209,90,0.45)", cls2bg:"rgba(106,209,90,0.12)", philo:"La precisión se construye con ritmo, constancia y lectura limpia del esfuerzo.", bonus:"+25% XP EN EJERCICIOS DE CARDIO" },
    MAGO:    { cls2:"#4CC9F0", cls2a:"rgba(76,201,240,0.45)", cls2bg:"rgba(76,201,240,0.12)", philo:"El dominio del cuerpo empieza por respirar mejor, moverse mejor y sostener foco.", bonus:"+25% XP EN FLEXIBILIDAD Y MENTE" },
  };
  const clsC = CLS_COLORS[stats.heroClass] || CLS_COLORS.GUERRERO;
  const summaryPrimary = clsC.cls2;
  const summarySecondary = cls.secondary || clsC.cls2;
  const summaryPrimaryBg = clsC.cls2bg;
  const summarySecondaryBg = withAlpha(summarySecondary, 0.12);
  const summaryPrimaryGlow = clsC.cls2a;
  const summarySecondaryGlow = withAlpha(summarySecondary, 0.45);
  const themedCard = (accent, bg, glowAlpha = 0.18) => ({
    "--mp-accent": accent,
    "--mp-accent-a": withAlpha(accent, 0.48),
    borderColor: withAlpha(accent, 0.28),
    background: `linear-gradient(145deg, rgba(16,18,34,.92), ${bg})`,
    boxShadow: `0 10px 28px rgba(0,0,0,.38), 0 0 22px ${withAlpha(accent, glowAlpha)}`,
  });

  const STAT_LINES = [
    { ico:"str", name:"FUERZA",      sf:"str", val:cls.stats?.fuerza||78 },
    { ico:"sta", name:"RESISTENCIA", sf:"sta", val:cls.stats?.resistencia||64 },
    { ico:"spd", name:"AGILIDAD",    sf:"spd", val:cls.stats?.agilidad||52 },
    { ico:"vit", name:"VITALIDAD",   sf:"vit", val:cls.stats?.vitalidad||86 },
  ];

  const DAYS = ["LUN","MAR","MIE","JUE","VIE","SAB","DOM"];
  const weekData = DAYS.map((d, i) => actividad[i] || { dia:d, sesiones:0, xp:0 });
  const maxSes = Math.max(...weekData.map(d => d.sesiones), 1);
  const weekTotal = weekData.reduce((s,d) => s + d.sesiones, 0);
  const weekXP = weekData.reduce((s,d) => s + (d.xp||0), 0);
  const weekSessions = weekTotal;
  const trainedToday = [
    stats.lastWorkoutAt,
    stats.lastExerciseAt,
    stats.lastActivityAt,
    stats.updatedAt,
  ].some((entry) => isTodayStamp(entry) === true);

  const now = Date.now();
  const fmtTimer = (ms) => {
    const s = Math.max(0, Math.floor(ms/1000));
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = s%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
  };
  const activeBoostsList = [];
  Object.entries(stats.activeBoosts || {}).forEach(([tipo, data]) => {
    if (!data?.expiresAt) return;
    const msLeft = new Date(data.expiresAt).getTime() - now;
    if (msLeft <= 0) return;
    activeBoostsList.push({ tipo, data, msLeft });
  });
  if (stats.streakShield?.expiresAt) {
    const msLeft = new Date(stats.streakShield.expiresAt).getTime() - now;
    if (msLeft > 0) activeBoostsList.push({ tipo:"streakShield", data:stats.streakShield, msLeft });
  }

  const obtenidos = badges.filter(b => b.obtenido);
  const pendientes = badges.filter(b => b.obtenido && !b.reclamado);
  const pendingTodayLabel = pendientes.length > 0
    ? `Reclama ${pendientes.length} insignias`
    : !trainedToday
      ? "Activa una sesión corta"
      : activeBoostsList.length > 0
        ? "Aprovecha tus boosts vivos"
        : "Mantén el ritmo limpio";
  const RAREZA_RPG = { "Común":"r-common", "Raro":"r-rare", "Épico":"r-epic", "Legendario":"r-legend", "Mítico":"r-mythic" };
  const BADGE_ICONS = ["🏆","⚔","🛡","🔥","🎯","⭐","🧙","🏹","💎","👑","🌟","🗡"];
  const BADGE_FALLBACKS = [
    "/logros/medals/medal-first-blood.png",
    "/logros/medals/medal-streak-master.png",
    "/logros/medals/medal-mind-keeper.png",
    "/logros/medals/medal-social-mark.png",
  ];
  const getBadgeAsset = (badge, index) => {
    if (!badge?.obtenido) return "/logros/states/state-secret.png";
    if (badge?.rareza === "Legendario") return "/ui/medals/rank-crown.png";
    if (badge?.rareza === "Epico") return "/ui/medals/medal-gold.png";
    if (badge?.rareza === "Raro") return "/ui/medals/medal-silver.png";
    if (badge?.rareza === "Comun") return "/ui/medals/medal-bronze.png";
    return BADGE_FALLBACKS[index % BADGE_FALLBACKS.length];
  };
  const displayBadges = [...badges.slice(0, 12)];
  const estimatedBadgeSlots = Math.max(0, 12 - obtenidos.length);
  while (displayBadges.length < 12) displayBadges.push({ obtenido:false, titulo:"???", rareza:"Mitico", icono:"lock" });

  const totalMin = Math.round((stats.tiempoTotal || 0) / 60);
  const totalH = Math.floor(totalMin / 60);
  const remMin = totalMin % 60;
  const summaryRoutes = [
    {
      id:"panel",
      eyebrow:"Panel vivo",
      title:"Pulso, economía y boosts",
      note:"Muestra el estado inmediato del héroe sin llenar toda la vista de bloques.",
      glow:summaryPrimary,
    },
    {
      id:"campo",
      eyebrow:"Lectura del campo",
      title:"Semana, clase y marcas",
      note:"Aqui quedan el ritmo semanal y las estadisticas que explican tu build.",
      glow:summarySecondary,
    },
    {
      id:"insignias",
      eyebrow:"Vitrina",
      title:"Logros y rarezas",
      note:"La colección queda separada para que respire mejor y no rompa el flujo principal.",
      glow:summaryPrimary,
    },
  ];
  const summaryRoutesV2 = [
    {
      id:"panel",
      eyebrow:"Resumen",
      title:"Pulso, economia y boosts",
      note:"Lee lo inmediato sin abrir toda la ficha.",
      glow:summaryPrimary,
      icon:"/ui/icons/stat-xp.png",
    },
    {
      id:"campo",
      eyebrow:"Lectura",
      title:"Semana, clase y marcas",
      note:"Aqui vive el ritmo real de la semana.",
      glow:summarySecondary,
      icon:"/exercises/summary/sum-chart.png",
    },
    {
      id:"insignias",
      eyebrow:"Vitrina",
      title:"Logros y rarezas",
      note:"Tu coleccion queda aparte y mas limpia.",
      glow:summaryPrimary,
      icon:"/ui/medals/rank-crown.png",
    },
  ];
  const panelSnapshots = [
    {
      label:"Ahora mismo",
      value: pendingTodayLabel,
      meta: weekSessions > 0 ? `${weekSessions} sesiones esta semana` : "Sin sesiones esta semana",
      tone: summaryPrimary,
      icon: "/ui/header/notifications/notif-shield.png",
    },
    {
      label:"Reserva util",
      value: `${(stats.coins || 0).toLocaleString()} monedas listas`,
      meta: activeBoostsList.length > 0 ? `${activeBoostsList.length} boosts activos` : "Sin boosts vivos",
      tone: "#f4cc78",
      icon: "/ui/shop/icons/shop-coin-stack.png",
    },
    {
      label:"Coleccion",
      value: `${obtenidos.length} logros ya cerrados`,
      meta: pendientes.length > 0 ? `${pendientes.length} por reclamar` : "Todo al dia",
      tone: summarySecondary,
      icon: "/ui/medals/medal-gold.png",
    },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
          gap:12,
        }}
      >
        {summaryRoutesV2.map((route) => {
          const active = summaryPane === route.id;
          return (
            <button
              key={route.id}
              onClick={() => setSummaryPane(route.id)}
              style={{
                textAlign:"left",
                padding:"14px 15px 13px",
                borderRadius:18,
                border:`1px solid ${active ? withAlpha(route.glow, 0.5) : withAlpha(summaryPrimary, 0.16)}`,
                background:active
                  ? `linear-gradient(135deg, ${withAlpha(route.glow, 0.2)}, rgba(10,14,26,.92))`
                  : `linear-gradient(135deg, rgba(22,20,40,0.7), ${summaryPrimaryBg})`,
                boxShadow:active ? `0 14px 28px ${withAlpha(route.glow, 0.2)}` : `0 10px 20px rgba(0,0,0,.18), inset 0 1px 0 ${withAlpha(route.glow, 0.08)}`,
                cursor:"pointer",
                transition:"all .2s ease",
              }}
            >
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:8}}>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".09em",textTransform:"uppercase",color:active ? route.glow : "#9d93b8"}}>
                  {route.eyebrow}
                </div>
                <div
                  style={{
                    width:34,
                    height:34,
                    borderRadius:12,
                    border:`1px solid ${withAlpha(route.glow, 0.28)}`,
                    background:`linear-gradient(145deg, rgba(10,14,26,.82), ${withAlpha(route.glow, 0.14)})`,
                    display:"grid",
                    placeItems:"center",
                    boxShadow:`0 8px 18px ${withAlpha(route.glow, 0.14)}`,
                    flex:"0 0 auto",
                  }}
                >
                  <img src={route.icon} alt="" style={{width:18,height:18,objectFit:"contain"}} />
                </div>
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:18,fontWeight:800,lineHeight:1.05,color:"#fff",letterSpacing:"-.03em",marginBottom:6}}>
                {route.title}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:11.5,lineHeight:1.55,color:"rgba(229,223,242,.76)"}}>
                {route.note}
              </div>
            </button>
          );
        })}
      </div>

      {summaryPane==="panel" && (
        <>
      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:12,
        }}
      >
        {panelSnapshots.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius:18,
              border:`1px solid ${withAlpha(item.tone, 0.24)}`,
              background:`linear-gradient(145deg, rgba(12,14,28,.92), ${withAlpha(item.tone, 0.1)})`,
              boxShadow:`0 12px 26px rgba(0,0,0,.24), 0 0 20px ${withAlpha(item.tone, 0.12)}`,
              padding:"14px 14px 13px",
              display:"grid",
              gap:10,
              minHeight:112,
            }}
          >
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:item.tone}}>
                {item.label}
              </div>
              <div
                style={{
                  width:36,
                  height:36,
                  borderRadius:12,
                  border:`1px solid ${withAlpha(item.tone, 0.26)}`,
                  background:`linear-gradient(145deg, rgba(10,14,26,.82), ${withAlpha(item.tone, 0.16)})`,
                  display:"grid",
                  placeItems:"center",
                }}
              >
                <img src={item.icon} alt="" style={{width:18,height:18,objectFit:"contain"}} />
              </div>
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:18,fontWeight:800,lineHeight:1.16,color:"#fff8ef"}}>
              {item.value}
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.55,color:"rgba(229,223,242,.72)"}}>
              {item.meta}
            </div>
          </div>
        ))}
      </div>

      {/* BENTO GRID */}
      <div className="mp-bento">

        {/* XP CARD */}
        <div className="mp-card mp-xp-card" style={themedCard(summaryPrimary, summaryPrimaryBg)}>
          <div className="mp-card-title">
            <img className="mp-ct-img" src="/ui/icons/stat-xp.png" alt="" />
            PROGRESO XP
          </div>
          <div className="mp-xp-inner">
            <div className="mp-ring-wrap">
              <svg viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="mpRG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={summarySecondary}/>
                    <stop offset="1" stopColor={summaryPrimary}/>
                  </linearGradient>
                </defs>
                <circle className="mp-ring-bg" cx="60" cy="60" r={RR}/>
                <circle className="mp-ring-fg" cx="60" cy="60" r={RR}
                  strokeDasharray={CIRC}
                  strokeDashoffset={barsReady ? dashOffset : CIRC}
                  style={{transition:"stroke-dashoffset 1.2s cubic-bezier(.3,.9,.4,1)"}}/>
              </svg>
              <div className="mp-ring-center">
                <div className="mp-rc-lab">NIVEL</div>
                <div className="mp-rc-lv">{level}</div>
                <div className="mp-rc-cls"/>
                <img src="/ui/mp-ring-crest.png" onError={e=>e.currentTarget.style.display="none"}
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",opacity:.45,pointerEvents:"none"}}/>
              </div>
            </div>
            <div style={{minWidth:0}}>
              <div className="mp-xm-lab">XP TOTAL ACUMULADA</div>
              <div className="mp-xm-total" style={{color:summaryPrimary,textShadow:`0 0 16px ${summaryPrimaryGlow}`}}>{(stats.xpTotal||0).toLocaleString()}</div>
              <div className="mp-xp-bar"><div className="xf" style={{width:barsReady?`${xpPct}%`:"0%", background:`linear-gradient(90deg, ${summarySecondary}, ${summaryPrimary})`, boxShadow:`0 0 12px ${summaryPrimaryGlow}, inset 0 1px 0 rgba(255,255,255,.3)`}}/></div>
              <div className="mp-xm-cur">{xp.toLocaleString()} / {xpNext.toLocaleString()} XP</div>
              <div className="mp-xm-need" style={{color:summarySecondary}}>FALTAN {Math.max(0,xpNext-xp).toLocaleString()} XP PARA NIV {level+1}</div>
            </div>
          </div>
          <div className="mp-xp-mini">
            <div className="mp-xmi">
              <div className="mp-xmi-ico" style={{background:withAlpha(summarySecondary,0.14), borderColor:withAlpha(summarySecondary,0.34)}}><img className="mp-inline-asset" src="/exercises/summary/sum-logbook.png" alt="" /></div>
              <div>
                <div className="mp-xmi-lab">SESIONES</div>
                <div className="mp-xmi-v">{stats.sesionesTotales||0}</div>
              </div>
            </div>
            <div className="mp-xmi hp">
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div className="mp-xmi-ico" style={{background:withAlpha(summaryPrimary,0.14), borderColor:withAlpha(summaryPrimary,0.34)}}><img className="mp-inline-asset" src="/ui/header/notifications/notif-shield.png" alt="" /></div>
                <div>
                  <div className="mp-xmi-lab">HP ACTUAL</div>
                  <div className="mp-xmi-v">{stats.hp||100}%</div>
                </div>
              </div>
              <div className="mp-hp-bar"><div className="hf" style={{width:barsReady?`${stats.hp||100}%`:"0%", background:`linear-gradient(90deg, ${summarySecondary}, ${summaryPrimary})`, boxShadow:`0 0 8px ${summaryPrimaryGlow}`}}/></div>
            </div>
          </div>
        </div>

        {/* RACHA MÁXIMA */}
        <div className="mp-card mp-streak-card" style={themedCard(summarySecondary, summarySecondaryBg)}>
          <div className="mp-card-title">
            {fireAnimation ? (
              <Suspense fallback={<span className="mp-flame"/>}>
                <Lottie animationData={fireAnimation} loop autoplay className="mp-fire-lottie" />
              </Suspense>
            ) : (
              <span className="mp-flame"/>
            )}
            RACHA MÁXIMA
          </div>
          <div className="mp-mc-big" style={{color:summarySecondary,textShadow:`0 0 12px ${summarySecondaryGlow}`}}>{stats.rachaMax||0} <span className="unit">DÍAS</span></div>
          <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:700,color:"#9d93b8",letterSpacing:".06em",textTransform:"uppercase",display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span>RÉCORD HISTÓRICO</span>
          </div>
          <div className="mp-rec-bar">
            <div className="rf" style={{width:barsReady?`${Math.min(100,stats.rachaMax>0?(stats.rachaMax/30)*100:0)}%`:"0%", background:`linear-gradient(90deg, ${summaryPrimary}, ${summarySecondary})`}}/>
          </div>
          <div className="mp-rec-scale"><span>{stats.rachaMax||0}</span><span>30</span></div>
          <div className="mp-cs-row">
            {fireAnimation ? (
              <Suspense fallback={<div className="mp-cs-ico"/>}>
                <Lottie animationData={fireAnimation} loop autoplay className="mp-fire-lottie sm" />
              </Suspense>
            ) : (
              <div className="mp-cs-ico"/>
            )}
            <div>
              <div className="mp-cs-lab">RACHA ACTUAL</div>
              <div className="mp-cs-v" style={{color:summarySecondary}}>{stats.streak||0} DÍAS</div>
            </div>
          </div>
        </div>

        {/* TIEMPO TOTAL */}
        <div className="mp-card mp-time-card" style={themedCard(summaryPrimary, withAlpha(summaryPrimary,0.08))}>
          <div className="mp-card-title">
            <img className="mp-ct-img" src="/exercises/summary/sum-minutes.png" alt="" />
            TIEMPO TOTAL
          </div>
          <div className="mp-mc-big" style={{color:summaryPrimary,textShadow:`0 0 12px ${summaryPrimaryGlow}`}}>{totalH} h</div>
          <div className="mp-mc-sub">{String(remMin).padStart(2,"0")} min</div>
        </div>

        {/* MONEDAS */}
        <div className="mp-card mp-coin-card" style={themedCard(summarySecondary, withAlpha(summarySecondary,0.08))}>
          <div className="mp-card-title">
            <img className="mp-ct-img" src="/ui/shop/icons/shop-coin-stack.png" alt="" />
            MONEDAS
          </div>
          <div className="mp-coin-stack">
            <div className="mp-coin-ico">
              <img src="/ui/mp-coin-stack.png" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextSibling.style.display="block";}}
                style={{width:26,height:26,objectFit:"contain"}} alt=""/>
              <span style={{display:"none",fontFamily:"'Manrope',sans-serif",fontSize:16,color:"#6e4a13"}}>$</span>
            </div>
            <div className="mp-mc-big">{(stats.coins||0).toLocaleString()}</div>
          </div>
        </div>

        {/* XP SEMANAL */}
        <div className="mp-card mp-week-card" style={themedCard(summaryPrimary, withAlpha(summaryPrimary,0.08))}>
          <div className="mp-card-title" style={{"--mp-accent":summaryPrimary,"--mp-accent-a":summaryPrimaryGlow}}>
            <span style={{fontSize:16}}>⚡</span>
            XP ESTA SEMANA
          </div>
          <div className="mp-mc-big" style={{color:summaryPrimary,textShadow:`0 0 12px ${summaryPrimaryGlow}`,fontSize:20}}>
            {(stats.weeklyXP||0).toLocaleString()}
            <span style={{fontFamily:"'Manrope',sans-serif",fontSize:12,fontWeight:600,color:"#9d93b8",marginLeft:5}}>XP</span>
          </div>
          <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:700,color:"#9d93b8",letterSpacing:".06em",textTransform:"uppercase",marginTop:4}}>
            ACUMULADA EN LOS ÚLTIMOS 7 DÍAS
          </div>
        </div>

        {/* LOGROS */}
        <div className="mp-card mp-ach-card" style={themedCard(summaryPrimary, withAlpha(summaryPrimary,0.08))}>
          <div className="mp-card-title">
            <img className="mp-ct-img" src="/ui/medals/medal-gold.png" alt="" />
            LOGROS
          </div>
          <div className="mp-ach-frac">{obtenidos.length} <span className="tot">/ {badges.length||40}</span></div>
          <div className="mp-ach-pending" style={{background:withAlpha(summaryPrimary,0.12), borderColor:withAlpha(summaryPrimary,0.34)}}>
            <span className="mp-ap-lab" style={{color:summaryPrimary}}>PENDIENTES</span>
            <div className="mp-ap-right">
              <span style={{fontFamily:"'Manrope',sans-serif",fontSize:16,color:"#f4cc78"}}>{pendientes.length}</span>
              {pendientes.length > 0 && <span className="mp-ap-bang">!</span>}
            </div>
          </div>
        </div>

      </div>

      {/* BOOSTS ACTIVOS */}
      {activeBoostsList.length > 0 && (
        <div className="mp-card mp-boosts-card" style={themedCard(summaryPrimary, withAlpha(summaryPrimary,0.06))}>
          <div className="mp-card-title">
            <img className="mp-ct-img" src="/ui/icon-energy.png" alt="" />
            BOOSTS ACTIVOS
          </div>
          <div className="mp-boosts-grid">
            {activeBoostsList.slice(0,3).map((b,i) => {
              const isShield = b.tipo === "streakShield";
              const isEnergy = b.tipo === "cooldown_red";
              const bCls = isShield ? "shield" : isEnergy ? "energy" : "xp";
              return (
                <div key={i} className={`mp-boost ${bCls}`}>
                  <div className="mp-boost-ico">
                    {isShield ? (
                      <img className="mp-inline-asset" src="/ui/header/notifications/notif-shield.png" alt="" />
                    ) : isEnergy ? (
                      <img className="mp-inline-asset" src="/ui/icon-energy.png" alt="" />
                    ) : (
                      <img className="mp-inline-asset" src="/missions/rewards/reward-xp-scroll.png" alt="" />
                    )}
                  </div>
                  <div>
                    <div className="mp-bm-name">{isShield?"ESCUDO DE RACHA":isEnergy?"ENERGÍA EXTRA":"XP BOOST"}</div>
                    <div className="mp-bm-desc">{b.data?.valor ? `+${b.data.valor}` : isShield?"Protege tu racha":"+25% XP"}</div>
                    <div className="mp-bm-timer"><span className="mp-clk"/>{fmtTimer(b.msLeft)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}

      {summaryPane==="campo" && (
        <>
      {/* ACTIVIDAD SEMANAL */}
      <div className="mp-card mp-week-card" style={themedCard(summaryPrimary, summaryPrimaryBg)}>
        <div className="mp-week-head">
          <div className="mp-wh-title">
            <img className="mp-ct-img" src="/exercises/summary/sum-chart.png" alt="" />
            ACTIVIDAD SEMANAL
          </div>
          <div className="mp-wk-stats">
            <div className="mp-ws"><span>TOTAL</span></div>
            <div className="mp-ws"><span className="wi ses"/><span className="wv">{weekTotal}</span> SES</div>
            <div className="mp-ws"><span className="wi xp"/><span className="wv">{weekXP.toLocaleString()}</span> XP</div>
            <div className="mp-cls-badge2" style={{"--cls2":clsC.cls2,"--cls2a":clsC.cls2a,"--cls-bg2":clsC.cls2bg}}>
              <span style={{width:10,height:10,display:"inline-block",background:clsC.cls2,clipPath:"polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)"}}/>
              <span className="cb2-name">{stats.heroClass||"GUERRERO"}</span>
            </div>
          </div>
        </div>
        <div className="mp-ylab">SESIONES</div>
        <div className="mp-chart">
          <div className="mp-chart-y">
            {[maxSes,Math.round(maxSes*.75),Math.round(maxSes*.5),Math.round(maxSes*.25),0].map((v,i)=>(
              <span key={i}>{v}</span>
            ))}
          </div>
          <div className="mp-chart-bars">
            {[25,50,75].map(p=><div key={p} className="gl" style={{bottom:`${p}%`}}/>)}
            {weekData.map((d,i)=>(
              <div key={i} className="mp-day-col">
                <div
                  className={`mp-day-bar${d.sesiones===0?" zero":""}`}
                  style={{height:barsReady&&d.sesiones>0?`${(d.sesiones/maxSes)*100}%`:"4px"}}
                  onMouseEnter={()=>setHovDay(i)}
                  onMouseLeave={()=>setHovDay(null)}
                >
                  <span className="mp-db-val">{d.sesiones}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mp-chart-days">
          <div/>
          <div className="mp-cd-row">
            {weekData.map((_,i)=>(
              <div key={i} className="mp-cd">{DAYS[i]}</div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="mp-stats-row">

        {/* Class stats */}
        <div className="mp-card mp-cls-card" style={{"--cls2":clsC.cls2,"--cls2a":clsC.cls2a, ...themedCard(summaryPrimary, summaryPrimaryBg)}}>
          <div className="mp-card-title" style={{"--mp-accent":clsC.cls2,"--mp-accent-a":clsC.cls2a}}>
            <img className="mp-ct-img" src="/ui/header/section-perfil.png" alt="" />
            STATS DE CLASE
          </div>
          <div className="mp-cs-hero">
            <div className="mp-cs-portrait">
              <img src={`/ui/class-${(stats.heroClass||"guerrero").toLowerCase()}-art.png`}
                onError={e=>e.currentTarget.style.display="none"}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",borderRadius:8}}/>
              <div className="cp-slot">
                <div className="cp-glyph"/>
                <div className="cp-dim">90x108</div>
              </div>
            </div>
            <div>
              <div className="mp-ci-name">{stats.heroClass||"GUERRERO"}</div>
              <div className="mp-ci-desc">{clsC.philo}</div>
            </div>
          </div>
          {STAT_LINES.map((sl,i)=>(
            <div key={i} className="mp-stat-line">
              <span className={`mp-sl-ico ${sl.ico}`}/>
              <span className="mp-sl-name">{sl.name}</span>
              <div className="mp-sl-bar">
                <span className={`sf mp-sf ${sl.sf}`} style={{width:barsReady?`${sl.val}%`:"0%"}}/>
              </div>
              <span className="mp-sl-val">{sl.val} <span className="max">/ 100</span></span>
            </div>
          ))}
          <div className="mp-cls-bonus">BONO: <span className="bv">{clsC.bonus}</span></div>
        </div>

        {/* General stats */}
        <div className="mp-card mp-gen-card" style={themedCard(summarySecondary, summarySecondaryBg)}>
          <div className="mp-card-title" style={{"--mp-accent":summarySecondary,"--mp-accent-a":summarySecondaryGlow}}>
            <img className="mp-ct-img" src="/exercises/summary/sum-logbook.png" alt="" />
            ESTADISTICAS GENERALES
          </div>
          {[
            { ico:"mission", lab:"MISIONES COMPLETADAS", val:stats.misionesCompletadas||0 },
            { ico:"fav",     lab:"EJERCICIO FAVORITO",   val:stats.ejercicioFav||"—" },
            { ico:"cat",     lab:"CATEGORÍA FAVORITA",   val:stats.categFav||"—" },
            { ico:"days",    lab:"DÍAS ACTIVOS TOTALES",  val:`${stats.diasActivo||0} DÍAS` },
            { ico:"date",    lab:"FECHA DE REGISTRO",     val:stats.createdAt||"—" },
          ].map((r,i)=>(
            <div key={i} className="mp-gen-row">
              <span className={`mp-gr-ico ${r.ico}`}/>
              <span className="mp-gr-lab">{r.lab}</span>
              <span className="mp-gr-val">{r.val}</span>
            </div>
          ))}
        </div>

      </div>
        </>
      )}

      {summaryPane==="insignias" && (
        <>
      {/* VITRINA DE LOGROS */}
      <div className="mp-card mp-showcase-card" style={themedCard(summaryPrimary, withAlpha(summaryPrimary,0.08))}>
        <div className="mp-showcase-head">
          <div className="mp-sh-title">
            <img className="mp-ct-img" src="/ui/medals/rank-crown.png" alt="" />
            VITRINA DE LOGROS
          </div>
          <div className="mp-showcase-meta">
            <span>OBTENIDOS: <span className="mp-sm-v">{obtenidos.length} / {badges.length||40}</span></span>
            {estimatedBadgeSlots > 0 && (
              <span
                style={{
                  padding:"4px 10px",
                  borderRadius:999,
                  border:"1px solid rgba(244,204,120,.32)",
                  background:"rgba(244,204,120,.12)",
                  color:"#f4cc78",
                  fontFamily:"'Manrope',sans-serif",
                  fontSize:10,
                  fontWeight:800,
                  letterSpacing:".06em",
                  textTransform:"uppercase",
                }}
              >
                Lectura estimada
              </span>
            )}
            {pendientes.length > 0 && (
              <div className="mp-sm-pend">
                PENDIENTES: <span className="mp-sm-v" style={{marginLeft:4}}>{pendientes.length}</span>
                <span className="mp-sm-bang">!</span>
              </div>
            )}
          </div>
        </div>
        <div className="mp-badge-grid">
          {displayBadges.map((b,i)=>{
            const rCls = RAREZA_RPG[b.rareza] || "r-common";
            const earned = !!b.obtenido;
            return (
              <div key={i} className={`mp-badge ${rCls}${earned?" earned":" locked"}`}>
                {earned && <div className="mp-bd-check">&#10003;</div>}
                <div className="mp-badge-hex">
                  <div className="bh-sh"/>
                  <img
                    className="mp-badge-asset"
                    src={`/ui/badge-${i+1}.png`}
                    alt=""
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallbackApplied === "1") {
                        e.currentTarget.style.display = "none";
                        return;
                      }
                      e.currentTarget.dataset.fallbackApplied = "1";
                      e.currentTarget.src = getBadgeAsset(b, i);
                    }}
                  />
                </div>
                <div className="mp-bd-name">{b.titulo||"???"}</div>
                <div className="mp-bd-rarity">{b.rareza||"Común"}</div>
              </div>
            );
          })}
        </div>
        <div className="mp-showcase-foot">
          <span style={{width:11,height:11,border:"1px solid #5e5675",borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',sans-serif",fontSize:"11px"}}>i</span>
          {estimatedBadgeSlots > 0
            ? "Las casillas bloqueadas siguen como lectura estimada hasta que el backend entregue ese progreso."
            : "Pasa el cursor sobre un logro para ver detalles."}
        </div>
      </div>
        </>
      )}

    </div>
  );
}

function PerfilPlaceholderTab({ tabId, stats, badges, actividad, cls, onJump, onPersistState }) {
  const rgbaHex = (hex, alpha = 1) => {
    if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
    const raw = hex.slice(1);
    const full = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
    const value = Number.parseInt(full, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const classPrimary = cls.color || "#6BC87A";
  const classSecondary = cls.secondary || classPrimary;
  const classPrimaryBg = cls.bg || rgbaHex(classPrimary, 0.14);
  const classPrimarySoft = rgbaHex(classPrimary, 0.16);
  const classPrimaryEdge = rgbaHex(classPrimary, 0.28);
  const classPrimaryGlow = rgbaHex(classPrimary, 0.22);
  const classSecondarySoft = rgbaHex(classSecondary, 0.16);
  const classSecondaryEdge = rgbaHex(classSecondary, 0.24);
  const classSecondaryGlow = rgbaHex(classSecondary, 0.18);
  const classTones = [classPrimary, classSecondary, "#f4cc78", "#4CC9F0"];
  const makePanelStyle = (accent, glow = 0.18, bg = 0.1) => ({
    border: `1px solid ${rgbaHex(accent, 0.26)}`,
    background: `linear-gradient(145deg, rgba(10,14,26,.88), ${rgbaHex(accent, bg)})`,
    boxShadow: `0 14px 28px rgba(0,0,0,.28), 0 0 22px ${rgbaHex(accent, glow)}`,
  });

  const unlocked = badges.filter((badge) => badge.obtenido).length;
  const pending = badges.filter((badge) => badge.obtenido && !badge.reclamado).length;
  const weekSessions = actividad.reduce((sum, day) => sum + Number(day?.sesiones || 0), 0);
  const weekXP = actividad.reduce((sum, day) => sum + Number(day?.xp || 0), 0);
  const activeBoosts = Object.keys(stats.activeBoosts || {}).length + (stats.streakShield ? 1 : 0);
  const totalMinutes = Math.round((stats.tiempoTotal || 0) / 60);
  const totalHoursLabel = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)} h ${String(totalMinutes % 60).padStart(2, "0")} min`
    : `${totalMinutes} min`;
  const avgXpPerSession = stats.sesionesTotales
    ? Math.round((stats.xpTotal || 0) / stats.sesionesTotales)
    : 0;
  const realAttributeRows = [
    { label: "HP actual", value: `${stats.hp || 100}%` },
    { label: "Dias activos", value: `${stats.diasActivo || 0}` },
    { label: "Tiempo total", value: totalHoursLabel },
    { label: "Registro", value: stats.createdAt || "Sin fecha" },
  ];

  const tabMeta = {
    estadisticas: {
      eyebrow: "Lectura del cuerpo",
      title: "Mesa de lectura",
      copy: "Aqui queda la lectura base del perfil: constancia, tiempo acumulado y señales generales del avance.",
      accent: cls.color,
      stats: realAttributeRows,
      note: "La clase sigue marcando el tono, pero la lectura ya sale de progreso real.",
      modules: [
        { title:"Base del perfil", text:"Sesiones, tiempo y continuidad ayudan a ver si el avance viene estable o todavia intermitente.", metric:`${stats.sesionesTotales || 0} sesiones`, glow:cls.color },
        { title:"Pulso de constancia", text:"La semana deja claro si el cuerpo viene con ritmo o si hace falta retomar el paso.", metric:`${weekSessions} sesiones esta semana`, glow:"#4CC9F0" },
        { title:"Sello de clase", text:"La clase activa y la zona mas repetida ayudan a leer hacia donde se inclina tu build actual.", metric:stats.categFav || stats.heroClass || "Sin sello claro", glow:"#f4cc78" },
      ],
      actions: [
        { label: "Abrir resumen", target: "resumen" },
        { label: "Editar ficha", target: "editar" },
      ],
    },
    progreso: {
      eyebrow: "Ritmo del heroe",
      title: "Ruta de progreso",
      copy: "Esta subseccion se queda solo con lo que empuja el siguiente paso: racha, empuje y margen para subir.",
      accent: cls.secondary || cls.color,
      heroIcon: "/exercises/summary/sum-chart.png",
      stats: [
        { label: "XP restante", value: `${Math.max(0, (stats.xpNext || 1000) - (stats.xp || 0)).toLocaleString()}`, icon: "/ui/icons/stat-xp.png" },
        { label: "Racha activa", value: `${stats.streak || 0} dias` },
        { label: "Racha maxima", value: `${stats.rachaMax || 0} dias` },
        { label: "Boosts vivos", value: `${activeBoosts}` },
      ],
      note: "La ruta junta empuje, proteccion y ritmo sin volverlo una pared de datos.",
      modules: [
        { title:"Siguiente empuje", text:"Si el nivel esta cerca, conviene rematarlo. Si no, la prioridad es sostener una sesion limpia.", metric:`${Math.max(0, (stats.xpNext || 1000) - (stats.xp || 0)).toLocaleString()} XP restantes`, glow:cls.secondary || cls.color },
        { title:"Proteccion activa", text:"Los boosts y el escudo de racha condicionan cuanto vale seguir hoy mismo.", metric:`${activeBoosts} mejoras vivas`, glow:"#f4cc78" },
        { title:"Pendiente de hoy", text:"Este tramo aterriza rapido si quedan logros por reclamar o una racha corta por sostener.", metric:pending > 0 ? `${pending} insignias por reclamar` : stats.streak > 0 ? `${stats.streak} dias en curso` : "Sin pendiente fuerte", glow:"#ff6b6b" },
      ],
      actions: [
        { label: "Abrir resumen", target: "resumen" },
        { label: "Ir a guardarropa", target: "guardarropa" },
      ],
    },
    historial: {
      eyebrow: "Memoria del mapa",
      title: "Bitacora del heroe",
      copy: "Aqui queda la huella reciente del perfil: que repetiste, que zona pesa mas y desde cuando vienes construyendo el mapa.",
      accent: cls.color,
      heroIcon: "/exercises/summary/sum-logbook.png",
      stats: [
        { label: "Sesiones de la semana", value: `${weekSessions}`, icon: "/exercises/summary/sum-logbook.png" },
        { label: "Ejercicio clave", value: stats.ejercicioFav || "-", icon: "/missions/rewards/reward-xp-scroll.png" },
        { label: "Zona favorita", value: stats.categFav || "-", icon: "/exercises/summary/sum-zones.png" },
        { label: "Ingreso al mapa", value: stats.createdAt || "-", icon: "/ui/header/section-perfil.png" },
      ],
      note: "La memoria sirve para ubicar patrones y marcas, no para ahogar la vista con historiales eternos.",
      modules: [
        { title:"Semana reciente", text:"Volumen de sesiones y XP ganado para ver si la curva de la semana estuvo viva o plana.", metric:`${weekXP.toLocaleString()} XP`, glow:cls.secondary || cls.color, icon: "/exercises/summary/sum-chart.png" },
        { title:"Huella favorita", text:"Tu ejercicio y zona mas repetidos ayudan a entender por que el perfil se inclino hacia cierta build.", metric:`${stats.ejercicioFav || "Sin huella"} `, glow:"#4CC9F0" },
        { title:"Marca de origen", text:"La fecha de entrada y las misiones cerradas dejan claro desde cuando viene tu progresion.", metric:`${stats.misionesCompletadas || 0} misiones`, glow:cls.color },
      ],
      actions: [
        { label: "Abrir resumen", target: "resumen" },
        { label: "Blindar cuenta", target: "seguridad" },
      ],
    },
  };

  const meta = tabMeta[tabId] || tabMeta.estadisticas;
  const isReadingTab = tabId === "estadisticas";
  const isRouteTab = tabId === "progreso";
  const isMemoryTab = tabId === "historial";
  const estimatedState = tabId === "estadisticas"
    ? "Base real con lectura complementaria del perfil."
    : "Algunas capas siguen resumidas mientras llega el historial fino del backend.";
  const readingQuickPanels = [];
  const routeQuickPanels = [];
  const memoryQuickPanels = [];
  const routeStatIcons = [
    "/ui/icons/stat-xp.png",
    "/ui/header/notifications/notif-shield.png",
    "/ui/medals/rank-crown.png",
    "/ui/icon-energy.png",
    "/ui/medals/medal-gold.png",
    "/missions/rewards/reward-xp-scroll.png",
  ];
  const routeModuleIcons = [
    "/missions/rewards/reward-xp-scroll.png",
    "/ui/header/notifications/notif-shield.png",
    "/exercises/summary/sum-chart.png",
  ];
  const memoryStatIcons = [
    "/exercises/summary/sum-logbook.png",
    "/ui/icons/stat-xp.png",
    "/ui/medals/medal-gold.png",
    "/missions/rewards/reward-xp-scroll.png",
    "/exercises/summary/sum-zones.png",
    "/ui/header/section-perfil.png",
  ];
  const memoryModuleIcons = [
    "/exercises/summary/sum-chart.png",
    "/exercises/summary/sum-zones.png",
    "/ui/medals/rank-crown.png",
  ];
  const moduleState = normalizeProfileModules(stats.profileModules)?.[tabId] || {
    focus:"",
    pin:"",
    note:"",
    lastViewedAt:"",
  };
  const moduleControls = {
    estadisticas: {
      focusLabel: "Foco guardado",
      pinLabel: "Ancla real",
      focusOptions: [
        { value:"base", label:"Base real" },
        { value:"consistencia", label:"Consistencia" },
        { value:"economia", label:"Economia" },
      ],
      pinOptions: [
        { value:"nivel", label:"Nivel" },
        { value:"coins", label:"Monedas" },
        { value:"sesiones", label:"Sesiones" },
      ],
    },
    progreso: {
      focusLabel: "Empuje activo",
      pinLabel: "Objetivo vivo",
      focusOptions: [
        { value:"momentum", label:"Momentum" },
        { value:"cierre", label:"Cierre" },
        { value:"proteccion", label:"Proteccion" },
      ],
      pinOptions: [
        { value:"nivel", label:"Subir nivel" },
        { value:"racha", label:"Racha" },
        { value:"boosts", label:"Boosts" },
      ],
    },
    historial: {
      focusLabel: "Lectura fija",
      pinLabel: "Memoria clave",
      focusOptions: [
        { value:"semana", label:"Semana" },
        { value:"huella", label:"Huella" },
        { value:"origen", label:"Origen" },
      ],
      pinOptions: [
        { value:"xp", label:"XP semanal" },
        { value:"zona", label:"Zona favorita" },
        { value:"misiones", label:"Misiones" },
      ],
    },
  }[tabId];
  const moduleStatusCopy = {
    estadisticas: {
      base: "Esta mesa queda fijada a cifras duras del perfil.",
      consistencia: "La lectura prioriza hábito, tiempo y continuidad.",
      economia: "El tablero deja arriba monedas, reserva y gasto útil.",
    },
    progreso: {
      momentum: "La ruta sigue enfocada en subir sin perder ritmo.",
      cierre: "El sistema empuja cierres cortos y metas cercanas.",
      proteccion: "La prioridad se mueve hacia boosts y escudo de racha.",
    },
    historial: {
      semana: "La memoria abre primero la semana reciente del héroe.",
      huella: "La vitrina resalta lo que más repetiste y consolidaste.",
      origen: "La lectura guarda mejor desde cuándo y por dónde creciste.",
    },
  };

  useEffect(() => {
    if (!moduleControls || typeof onPersistState !== "function") return;
    const viewedAt = coerceDate(moduleState.lastViewedAt);
    const shouldTouch = !viewedAt || (Date.now() - viewedAt.getTime()) > (20 * 60 * 1000);
    if (!shouldTouch) return;
    const timeoutId = window.setTimeout(() => {
      onPersistState(tabId, { lastViewedAt: new Date().toISOString() });
    }, 900);
    return () => window.clearTimeout(timeoutId);
  }, [moduleControls, moduleState.lastViewedAt, onPersistState, tabId]);

  return (
    <div style={{ display:"grid", gap:14 }}>
      <div
        style={{
          position:"relative",
          overflow:"hidden",
          borderRadius:22,
          border:`1px solid ${classPrimaryEdge}`,
          background:`linear-gradient(135deg, rgba(10,14,26,.97), ${classPrimaryBg})`,
          boxShadow:`0 18px 40px rgba(0,0,0,.42), 0 0 28px ${classPrimaryGlow}`,
          padding:"22px 22px 18px",
        }}
      >
        <div
          style={{
            position:"absolute",
            inset:0,
            background:"url('/ui/panel-texture.png') center/cover",
            opacity:.08,
            pointerEvents:"none",
          }}
        />
        <div
          style={{
            position:"absolute",
            right:-30,
            top:-30,
            width:180,
            height:180,
            borderRadius:"50%",
            background:classPrimary,
            opacity:.14,
            filter:"blur(80px)",
            pointerEvents:"none",
          }}
        />
        <div style={{ position:"relative", zIndex:1, display:"grid", gap:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:16, flexWrap:"wrap", alignItems:"start" }}>
            <div style={{ maxWidth:(isReadingTab || isRouteTab || isMemoryTab) ? 700 : 760 }}>
              <div
                style={{
                  display:"inline-flex",
                  alignItems:"center",
                  gap:8,
                  padding:"6px 12px",
                  borderRadius:999,
                  border:`1px solid ${classPrimaryEdge}`,
                  background:`linear-gradient(135deg, ${classPrimarySoft}, rgba(10,14,26,.78))`,
                  color:classPrimary,
                  fontFamily:"'Manrope',sans-serif",
                  fontSize:11,
                  fontWeight:800,
                  letterSpacing:".08em",
                  textTransform:"uppercase",
                  marginBottom:12,
                }}
              >
                {meta.heroIcon && (
                  <img
                    src={meta.heroIcon}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    style={{ width:16, height:16, objectFit:"contain", filter:`drop-shadow(0 0 10px ${classPrimaryGlow})` }}
                  />
                )}
                {meta.eyebrow}
              </div>
              <div
                style={{
                  fontFamily:"'Manrope',sans-serif",
                  fontSize:"clamp(24px, 3vw, 36px)",
                  fontWeight:800,
                  color:"#f7f4ff",
                  lineHeight:1.05,
                  letterSpacing:"-.03em",
                  marginBottom:10,
                }}
              >
                {meta.title}
              </div>
              <div
                style={{
                  fontFamily:"'Manrope',sans-serif",
                  fontSize:14,
                  lineHeight:1.7,
                  color:"rgba(230,224,245,.82)",
                  maxWidth:(isReadingTab || isRouteTab || isMemoryTab) ? 620 : 760,
                }}
              >
                {meta.copy}
              </div>
            </div>

            <div
              style={{
                minWidth:220,
                display:"grid",
                gap:10,
                padding:"14px 16px",
                borderRadius:18,
                ...makePanelStyle(classSecondary, 0.16, 0.09),
                boxShadow:`inset 0 1px 0 rgba(255,255,255,.04), 0 10px 24px rgba(0,0,0,.28), 0 0 18px ${classSecondaryGlow}`,
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <img
                  src={cls.crest}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  style={{ width:44, height:44, objectFit:"contain", flexShrink:0 }}
                />
                <div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(181,170,205,.78)" }}>
                    Clase activa
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:18, fontWeight:800, color:classPrimary, textShadow:`0 0 14px ${classPrimaryGlow}` }}>
                    {stats.heroClass || "GUERRERO"}
                  </div>
                </div>
              </div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, lineHeight:1.6, color:"rgba(230,224,245,.8)" }}>
                {cls.route}
              </div>
              <div
                style={{
                  padding:"9px 10px",
                  borderRadius:12,
                  border:`1px solid ${classSecondaryEdge}`,
                  background:`linear-gradient(135deg, rgba(10,14,26,.72), ${classSecondarySoft})`,
                  fontFamily:"'Manrope',sans-serif",
                  fontSize:11,
                  lineHeight:1.55,
                  color:"rgba(224,218,238,.76)",
                }}
              >
                <span style={{ color:meta.accent, fontWeight:800 }}>Lectura estimada:</span> {estimatedState}
              </div>
            </div>
          </div>

          {((isReadingTab && readingQuickPanels.length > 0) || (isRouteTab && routeQuickPanels.length > 0) || (isMemoryTab && memoryQuickPanels.length > 0)) && (
            <div
              style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",
                gap:12,
              }}
            >
              {(isReadingTab ? readingQuickPanels : isRouteTab ? routeQuickPanels : memoryQuickPanels).map((panel) => (
                <div
                  key={panel.label}
                  style={{
                    padding:"14px 14px 13px",
                    borderRadius:18,
                    border:`1px solid ${rgbaHex(panel.glow, 0.24)}`,
                    background:`linear-gradient(145deg, rgba(10,14,26,.9), ${rgbaHex(panel.glow, 0.1)})`,
                    boxShadow:`0 12px 24px rgba(0,0,0,.24), 0 0 18px ${rgbaHex(panel.glow, 0.12)}`,
                    display:"grid",
                    gap:10,
                    minHeight:116,
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", color:panel.glow }}>
                      {panel.label}
                    </div>
                    <div
                      style={{
                        width:36,
                        height:36,
                        borderRadius:12,
                        border:`1px solid ${rgbaHex(panel.glow, 0.26)}`,
                        background:`linear-gradient(145deg, rgba(10,14,26,.84), ${rgbaHex(panel.glow, 0.14)})`,
                        display:"grid",
                        placeItems:"center",
                        flex:"0 0 auto",
                      }}
                    >
                      <img src={panel.icon} alt="" style={{ width:18, height:18, objectFit:"contain" }} />
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:18, fontWeight:800, lineHeight:1.16, color:"#fff8ef" }}>
                    {panel.value}
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:12, lineHeight:1.55, color:"rgba(229,223,242,.72)" }}>
                    {panel.note}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:(isReadingTab || isRouteTab || isMemoryTab) ? "repeat(auto-fit, minmax(150px, 1fr))" : "repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
            {meta.stats.map((item, index) => {
              const metricAccent = classTones[index % classTones.length];
              const metricIcon =
                item.icon
                || (tabId === "progreso" ? routeStatIcons[index] : null)
                || (tabId === "historial" ? memoryStatIcons[index] : null);
              return (
              <div
                key={item.label}
                style={{
                  padding:(isReadingTab || isRouteTab || isMemoryTab) ? "13px 13px 11px" : "14px 14px 12px",
                  borderRadius:16,
                  ...makePanelStyle(metricAccent, 0.14, 0.08),
                  boxShadow:`inset 0 1px 0 rgba(255,255,255,.03), 0 0 14px ${rgbaHex(metricAccent, 0.12)}`,
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:metricAccent, marginBottom:8 }}>
                  {metricIcon && (
                    <img
                      src={metricIcon}
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      style={{ width:14, height:14, objectFit:"contain", filter:`drop-shadow(0 0 8px ${rgbaHex(metricAccent, 0.28)})` }}
                    />
                  )}
                  <span>{item.label}</span>
                </div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:(isReadingTab || isRouteTab || isMemoryTab) ? 18 : 20, fontWeight:800, color:"#fff", lineHeight:1.1, textShadow:`0 0 12px ${rgbaHex(metricAccent, 0.12)}` }}>
                  {item.value}
                </div>
              </div>
            )})}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:(isReadingTab || isRouteTab || isMemoryTab) ? "repeat(auto-fit, minmax(240px, 1fr))" : "repeat(auto-fit, minmax(220px, 1fr))", gap:12 }}>
            {(meta.modules || []).map((module, index) => {
              const moduleIcon =
                module.icon
                || (tabId === "progreso" ? routeModuleIcons[index] : null)
                || (tabId === "historial" ? memoryModuleIcons[index] : null);
              return (
              <div
                key={module.title}
                style={{
                  position:"relative",
                  overflow:"hidden",
                  padding:(isReadingTab || isRouteTab || isMemoryTab) ? "15px 15px 14px" : "16px 16px 14px",
                  borderRadius:18,
                  ...makePanelStyle(module.glow || classPrimary, 0.16, 0.08),
                }}
              >
                <div style={{
                  position:"absolute",
                  inset:0,
                  background:`radial-gradient(circle at top right, ${rgbaHex(module.glow || classPrimary, 0.18)}, transparent 55%)`,
                  pointerEvents:"none",
                }} />
                <div style={{ position:"relative", zIndex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", color:module.glow, marginBottom:8 }}>
                    {moduleIcon && (
                      <img
                        src={moduleIcon}
                        alt=""
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                        style={{ width:16, height:16, objectFit:"contain", filter:`drop-shadow(0 0 10px ${rgbaHex(module.glow || classPrimary, 0.22)})` }}
                      />
                    )}
                    <span>{module.title}</span>
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:(isReadingTab || isRouteTab || isMemoryTab) ? 20 : 22, fontWeight:800, color:"#fff", lineHeight:1.05, marginBottom:8, textShadow:`0 0 14px ${rgbaHex(module.glow || classPrimary, 0.14)}` }}>
                    {module.metric}
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:12, lineHeight:1.7, color:"rgba(226,219,238,.76)" }}>
                    {module.text}
                  </div>
                </div>
              </div>
            )})}
          </div>

          {moduleControls && (
            <div
              style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",
                gap:12,
              }}
            >
              <div
                style={{
                  padding:"16px",
                  borderRadius:18,
                  ...makePanelStyle(classPrimary, 0.14, 0.08),
                  display:"grid",
                  gap:14,
                }}
              >
                <div style={{ display:"grid", gap:6 }}>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", color:classPrimary }}>
                    Sistema del modulo
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, lineHeight:1.65, color:"rgba(230,224,245,.78)" }}>
                    {isReadingTab
                      ? "Esta lectura ya puede guardar foco y ancla, asi la ficha recuerda que cifra quieres ver primero."
                      : isRouteTab
                        ? "La ruta tambien guarda su foco y su ancla, para que el perfil recuerde si estabas empujando nivel, racha o proteccion."
                        : isMemoryTab
                          ? "La memoria tambien puede fijar su foco, para que la ficha recuerde si estabas leyendo semana, huella u origen."
                          : "Esta subseccion ya guarda su foco y su ancla en Firebase. Asi, lectura, ruta y memoria dejan una huella propia dentro de tu ficha."}
                  </div>
                </div>

                <div style={{ display:"grid", gap:12 }}>
                  <div style={{ display:"grid", gap:8 }}>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"rgba(219,212,234,.82)" }}>
                      {moduleControls.focusLabel}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {moduleControls.focusOptions.map((option) => {
                        const active = moduleState.focus === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => onPersistState?.(tabId, { focus: option.value })}
                            style={{
                              padding:"9px 12px",
                              borderRadius:999,
                              border:`1px solid ${active ? classPrimaryEdge : "rgba(255,255,255,.08)"}`,
                              background:active
                                ? `linear-gradient(135deg, ${classPrimarySoft}, rgba(10,14,26,.9))`
                                : "rgba(10,14,26,.68)",
                              color:active ? "#fff" : "rgba(226,219,238,.76)",
                              fontFamily:"'Manrope',sans-serif",
                              fontSize:11,
                              fontWeight:700,
                              cursor:"pointer",
                              boxShadow:active ? `0 8px 20px ${classPrimaryGlow}` : "none",
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display:"grid", gap:8 }}>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:800, letterSpacing:".06em", textTransform:"uppercase", color:"rgba(219,212,234,.82)" }}>
                      {moduleControls.pinLabel}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {moduleControls.pinOptions.map((option) => {
                        const active = moduleState.pin === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => onPersistState?.(tabId, { pin: option.value })}
                            style={{
                              padding:"9px 12px",
                              borderRadius:999,
                              border:`1px solid ${active ? classSecondaryEdge : "rgba(255,255,255,.08)"}`,
                              background:active
                                ? `linear-gradient(135deg, ${classSecondarySoft}, rgba(10,14,26,.9))`
                                : "rgba(10,14,26,.68)",
                              color:active ? "#fff" : "rgba(226,219,238,.76)",
                              fontFamily:"'Manrope',sans-serif",
                              fontSize:11,
                              fontWeight:700,
                              cursor:"pointer",
                              boxShadow:active ? `0 8px 20px ${classSecondaryGlow}` : "none",
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding:"16px",
                  borderRadius:18,
                  ...makePanelStyle(classSecondary, 0.14, 0.08),
                  display:"grid",
                  gap:12,
                }}
              >
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", color:classSecondary }}>
                  Estado guardado
                </div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:18, fontWeight:800, color:"#fff", lineHeight:1.1 }}>
                  {moduleStatusCopy?.[tabId]?.[moduleState.focus] || "Lectura viva del modulo"}
                </div>
                <div style={{ display:"grid", gap:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:10, fontFamily:"'Manrope',sans-serif", fontSize:12, color:"rgba(222,216,236,.82)" }}>
                    <span>Ultima visita</span>
                    <strong style={{ color:"#fff", fontWeight:700 }}>{formatRecentStamp(moduleState.lastViewedAt, "Aun sin registro")}</strong>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:10, fontFamily:"'Manrope',sans-serif", fontSize:12, color:"rgba(222,216,236,.82)" }}>
                    <span>Ancla actual</span>
                    <strong style={{ color:"#fff", fontWeight:700 }}>
                      {moduleControls.pinOptions.find((option) => option.value === moduleState.pin)?.label || "Sin ancla"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, lineHeight:1.6, color:"rgba(218,211,234,.76)", maxWidth:720 }}>
              {meta.note}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {meta.actions.map((action) => (
                <button
                  key={action.target}
                  onClick={() => onJump(action.target)}
                  style={{
                    padding:"10px 14px",
                    borderRadius:12,
                    border:`1px solid ${classPrimaryEdge}`,
                    background:`linear-gradient(135deg, ${classPrimarySoft}, rgba(10,14,26,.9))`,
                    color:"#fff",
                    fontFamily:"'Manrope',sans-serif",
                    fontSize:12,
                    fontWeight:700,
                    cursor:"pointer",
                    boxShadow:`0 8px 22px ${classPrimaryGlow}`,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// TAB: EDITAR — Admin-config palette · Premium Layout
// ══════════════════════════════════════════════════════════════
function TabEditar({stats, onSaved, showToast, titleCatalog = TITULOS_CATALOG}) {
  const { t }          = useLang();
  const [editMode,     setEditMode]     = useState(false);
  const [viewPane,     setViewPane]     = useScopedStorageState("fv-profile-edit-view-pane-v1", "identidad");
  const [editPane,     setEditPane]     = useScopedStorageState("fv-profile-edit-form-pane-v1", "perfil");
  const buildFormFromStats = useCallback(() => ({
    username:  stats.username  || "",
    heroName:  stats.heroName  || "",
    titulo:    stats.titulo    || "",
    bio:       stats.bio       || "",
    heroClass: stats.heroClass || "GUERRERO",
  }), [stats.bio, stats.heroClass, stats.heroName, stats.titulo, stats.username]);
  const [form,         setForm]         = useState({
    username:  stats.username  || "",
    heroName:  stats.heroName  || "",
    titulo:    stats.titulo    || "",
    bio:       stats.bio       || "",
    heroClass: stats.heroClass || "GUERRERO",
  });
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});
  const [dirty,        setDirty]        = useState(new Set());
  const [shake,        setShake]        = useState(false);
  const [confirmClass, setConfirmClass] = useState(false);
  const [pendingClass, setPendingClass] = useState(null);
  const isMobile = useIsMobile();

  const cancel = () => {
    setForm(buildFormFromStats());
    setErrors({}); setDirty(new Set());
    setConfirmClass(false); setPendingClass(null);
    setEditMode(false);
  };

  useEffect(() => {
    if (editMode) return;
    setForm(buildFormFromStats());
    setErrors({});
    setDirty(new Set());
    setConfirmClass(false);
    setPendingClass(null);
  }, [buildFormFromStats, editMode]);

  const validateField = (k, v) => {
    if (k === "username") {
      if (!v?.trim())        return { username:t("pr.val.username_required") };
      if (v.trim().length<3) return { username:t("pr.val.username_min") };
      if (v.trim().length>24)return { username:t("pr.val.username_max") };
      const profErr = validateClean(v, "nombre de héroe");
      if (profErr) return { username: profErr };
      return { username:null };
    }
    if (k === "bio") {
      if (v.length > 160) return { bio:`${t("pr.val.bio_max")} (${v.length}/160)` };
      const profErr = validateClean(v, "biografía");
      if (profErr) return { bio: profErr };
      return { bio:null };
    }
    if (k === "titulo") {
      const profErr = validateClean(v, "título");
      if (profErr) return { titulo: profErr };
      return { titulo:null };
    }
    return {};
  };

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]:v }));
    if (dirty.has(k)) setErrors(prev => ({ ...prev, ...validateField(k, v) }));
  };

  const touch = (k) => {
    setDirty(prev => new Set([...prev, k]));
    setErrors(prev => ({ ...prev, ...validateField(k, form[k]) }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim())          e.username = t("pr.val.username_required");
    else if (form.username.length < 3)  e.username = t("pr.val.username_min");
    else if (form.username.length > 24) e.username = t("pr.val.username_max");
    if (form.bio.length > 160)          e.bio = t("pr.val.bio_max");
    return e;
  };

  const save = async () => {
    setDirty(new Set(["username","heroName","bio","titulo","heroClass"]));
    const e = validate();
    if (Object.values(e).some(Boolean)) {
      setErrors(e); setShake(true); setTimeout(()=>setShake(false),500); return;
    }
    const trimmedUsername = form.username.trim();
    const trimmedHeroName = form.heroName.trim();
    const trimmedTitulo = form.titulo.trim();
    const trimmedBio = form.bio.trim();
    const payload = {};

    if (trimmedUsername !== (stats.username || "")) payload.username = trimmedUsername;
    if (trimmedHeroName !== (stats.heroName || "")) payload.heroName = trimmedHeroName;
    if (trimmedTitulo !== (stats.titulo || "")) payload.titulo = trimmedTitulo;
    if (trimmedBio !== (stats.bio || "")) payload.bio = trimmedBio;
    if (form.heroClass !== (stats.heroClass || "GUERRERO")) payload.heroClass = form.heroClass;

    if (!Object.keys(payload).length) {
      setEditMode(false);
      showToast?.({ ok:true, message:"No habia cambios por guardar." });
      return;
    }

    if (stats.coins < totalCost) {
      const missingCoins = Math.max(totalCost - stats.coins, 0);
      const message = `Te faltan ${missingCoins} monedas para aplicar este cambio.`;
      setErrors({ general: message });
      setShake(true); setTimeout(()=>setShake(false),500);
      showToast?.({ ok:false, message:"No alcanza la reserva", sub:message });
      return;
    }
    setLoading(true); setErrors({});
    try {
      const token = auth.currentUser && await auth.currentUser.getIdToken();
      if (!token) throw new Error("Sin autenticación");
      const response = await updateProfile(token, payload);
      if (!response.ok) throw new Error(response.message || "Error al guardar");
      const nextUser = { ...stats, ...payload, ...(response.user || {}) };
      setEditMode(false);
      setForm({
        username:  nextUser.username  || "",
        heroName:  nextUser.heroName  || "",
        titulo:    nextUser.titulo    || "",
        bio:       nextUser.bio       || "",
        heroClass: nextUser.heroClass || "GUERRERO",
      });
      onSaved?.(nextUser);
      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          scope: "profile-edit",
          ts: Date.now(),
          uid: auth.currentUser?.uid || response.user?.uid || "guest",
          ...nextUser,
          updatedUser: nextUser,
        },
      }));
      showToast?.({ ok:true, message:t("pr.toast.profile_saved") });
    } catch (err) {
      setErrors({ general: err.message || "Error al guardar perfil" });
      setShake(true); setTimeout(()=>setShake(false),500);
      showToast?.({ ok:false, message:t("pr.toast.save_error"), sub:err.message });
    } finally {
      setLoading(false);
    }
  };

  const bc      = PROFILE_CLS[form.heroClass]?.color || SC.orange;
  const viewCls = PROFILE_CLS[stats.heroClass] || PROFILE_CLS.GUERRERO;

  const USERNAME_COST    = 500;
  const CLASS_COST       = 1000;
  const usernameChanging = form.username.trim() !== stats.username;
  const classChanging    = form.heroClass !== stats.heroClass;
  const usernameCost     = usernameChanging && stats.usernameChanged ? USERNAME_COST : 0;
  const classCost        = classChanging ? CLASS_COST : 0;
  const totalCost        = usernameCost + classCost;
  const canAfford        = stats.coins >= totalCost;

  const applyPendingClassChange = async () => {
    if (!pendingClass || pendingClass === (stats.heroClass || "GUERRERO")) {
      setConfirmClass(false);
      setPendingClass(null);
      return;
    }

    if ((stats.coins || 0) < CLASS_COST) {
      const missingCoins = Math.max(CLASS_COST - (stats.coins || 0), 0);
      const message = `Te faltan ${missingCoins} monedas para cambiar de clase.`;
      setErrors({ general: message });
      setShake(true); setTimeout(()=>setShake(false),500);
      showToast?.({ ok:false, message:"No alcanza la reserva", sub:message });
      return;
    }

    const nextClass = pendingClass;
    setLoading(true);
    setErrors({});
    try {
      const token = auth.currentUser && await auth.currentUser.getIdToken();
      if (!token) throw new Error("Sin autenticacion");
      const response = await updateProfile(token, { heroClass: nextClass });
      if (!response.ok) throw new Error(response.message || "Error al cambiar la clase");
      const nextUser = { ...stats, heroClass: nextClass, ...(response.user || {}) };
      setForm((prev) => ({ ...prev, heroClass: nextUser.heroClass || "GUERRERO" }));
      setConfirmClass(false);
      setPendingClass(null);
      setEditMode(false);
      onSaved?.(nextUser);
      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          scope: "profile-class-change",
          ts: Date.now(),
          uid: auth.currentUser?.uid || response.user?.uid || "guest",
          ...nextUser,
          updatedUser: nextUser,
        },
      }));
      showToast?.({ ok:true, message:`Clase activa: ${nextUser.heroClass || nextClass}.` });
    } catch (err) {
      setErrors({ general: err.message || "No pudimos cambiar la clase." });
      setShake(true); setTimeout(()=>setShake(false),500);
      showToast?.({ ok:false, message:"Cambio de clase fallido", sub:err.message });
    } finally {
      setLoading(false);
    }
  };

  const FV = {
    wrap:{ hidden:{}, show:{ transition:{ staggerChildren:.07 } } },
    card:{ hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:{ type:"spring", stiffness:240, damping:22 } } },
  };

  const glass = (accent = bc, bgTone = rgbaHex(bc, 0.14)) => ({
    position:"relative", overflow:"hidden",
    background:`linear-gradient(145deg, rgba(14,21,32,0.92), ${bgTone})`,
    backdropFilter:"blur(18px)",
    WebkitBackdropFilter:"blur(18px)",
    border:`1px solid ${accent}44`,
    borderRadius:20,
    boxShadow:`0 4px 28px rgba(0,0,0,.4), 0 0 18px ${rgbaHex(accent, 0.14)}, inset 0 1px 0 rgba(255,255,255,.04)`,
  });

  const TopLine = ({color}) => (
    <div style={{
      position:"absolute", top:0, left:0, right:0, height:1,
      background:`linear-gradient(90deg,transparent,${color}aa,transparent)`,
      pointerEvents:"none",
    }}/>
  );

  // ── VIEW MODE ──────────────────────────────────────────────
  if (!editMode) {
    const liveTitleCatalog = titleCatalog?.length ? titleCatalog : TITULOS_CATALOG;
    const tData = liveTitleCatalog.find(t => t.nombre === stats.titulo);
    return (
      <motion.div variants={FV.wrap} initial="hidden" animate="show"
        style={{display:"flex", flexDirection:"column", gap:14}}>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          {[
            { id:"identidad", eyebrow:"Identidad", title:"Nombre, bio y título", note:"La parte pública del héroe queda aislada para lectura rápida.", glow:SC.orange },
            { id:"clase", eyebrow:"Afinidad", title:"Clase activa y bonus", note:"Aqui ves la identidad de combate y el impacto de la clase.", glow:viewCls.color },
          ].map((pane) => {
            const active = viewPane === pane.id;
            return (
              <button
                key={pane.id}
                onClick={() => setViewPane(pane.id)}
                style={{
                  textAlign:"left",
                  padding:"15px 16px 14px",
                  borderRadius:18,
                  border:`1px solid ${active ? pane.glow : "rgba(160,140,220,.18)"}`,
                  background:active ? `linear-gradient(135deg, ${pane.glow}22, rgba(14,21,32,.92))` : "rgba(14,21,32,.78)",
                  boxShadow:active ? `0 12px 24px ${pane.glow}18` : "0 8px 16px rgba(0,0,0,.18)",
                  cursor:"pointer",
                }}
              >
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:active ? pane.glow : SC.muted,marginBottom:8}}>
                  {pane.eyebrow}
                </div>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:20,fontWeight:800,lineHeight:1.04,color:SC.white,letterSpacing:"-.03em",marginBottom:7}}>
                  {pane.title}
                </div>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.6,color:SC.mutedL}}>
                  {pane.note}
                </div>
              </button>
            );
          })}
        </div>

        {/* Asymmetric grid: info (wide) + class (narrow) */}
        <div style={{
          display:"grid",
          gridTemplateColumns: "1fr",
          gap:14, alignItems:"start",
        }}>

          {/* ── Public info card ── */}
          {viewPane==="identidad" && (
          <motion.div variants={FV.card} style={{...glass(SC.navy), padding:"22px 24px"}}>
            <TopLine color={SC.orange}/>

            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18}}>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <div style={{
                  width:30, height:30, borderRadius:9,
                  background:`${SC.orange}16`, border:`1px solid ${SC.orange}33`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                }}>👤</div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                  color:SC.muted, letterSpacing:".12em"}}>{t("pr.edit.public_info")}</div>
              </div>
              <motion.button whileHover={{scale:1.06}} whileTap={{scale:.94}}
                onClick={() => { setEditPane("perfil"); setEditMode(true); }}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                  color:SC.orange, letterSpacing:".06em",
                  background:`${SC.orange}14`, border:`1px solid ${SC.orange}33`,
                  borderRadius:10, padding:"7px 14px", cursor:"pointer",
                  boxShadow:`0 0 12px ${SC.orange}14`,
                }}>
                <Edit2 size={12}/> {t("pr.edit.btn_edit")}
              </motion.button>
            </div>

            {/* Field rows */}
            {[
              {
                label:t("pr.edit.hero_name_label"), value:stats.username||"—", icon:"⚔️",
                badge: stats.usernameChanged
                  ? <span style={{fontFamily:"'Manrope',sans-serif",fontSize:9,fontWeight:700,
                      color:SC.gold,background:`${SC.gold}14`,border:`1px solid ${SC.gold}33`,
                      borderRadius:20,padding:"1px 8px"}}>{USERNAME_COST} 🪙</span>
                  : <span style={{fontFamily:"'Manrope',sans-serif",fontSize:9,fontWeight:700,
                      color:SC.green,background:`${SC.green}14`,border:`1px solid ${SC.green}33`,
                      borderRadius:20,padding:"1px 8px"}}>{t("pr.edit.free_once")}</span>
              },
              { label:t("pr.edit.special_title"), value:stats.heroName||"—", icon:"🎖" },
              { label:t("pr.edit.biography"),     value:stats.bio||t("pr.edit.no_bio"), icon:"📝" },
            ].map((f, i, arr) => {
              const empty = f.value === "—" || f.value === t("pr.edit.no_bio");
              return (
                <div key={i} style={{
                  display:"flex", gap:12, padding:"12px 8px",
                  borderBottom: i < arr.length-1 ? `1px solid ${SC.navy}66` : "none",
                  alignItems:"flex-start",
                }}>
                  <span style={{fontSize:15, flexShrink:0, marginTop:2}}>{f.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap"}}>
                      <div style={{fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                        color:SC.muted, letterSpacing:".08em"}}>{f.label}</div>
                      {f.badge}
                    </div>
                    <div style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:empty?400:600,
                      color:empty?SC.muted:SC.white,
                      fontStyle:empty?"italic":"normal", lineHeight:1.5,
                    }}>{f.value}</div>
                  </div>
                </div>
              );
            })}

            {/* Titulo activo */}
            <div style={{
              marginTop:12, padding:"12px 14px",
              background:`${SC.gold}08`, border:`1px solid ${SC.gold}22`,
              borderRadius:12,
            }}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap"}}>
                <span style={{fontSize:15}}>🏅</span>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                  color:SC.muted, letterSpacing:".08em"}}>{t("pr.edit.active_title_label")}</div>
                <span style={{fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                  color:SC.muted, background:`${SC.navy}88`, border:`1px solid ${SC.navy}`,
                  borderRadius:20, padding:"1px 8px"}}>
                  {(stats.ownedTitles||[]).length} {(stats.ownedTitles||[]).length!==1 ? t("pr.edit.unlocked_pl") : t("pr.edit.unlocked")}
                </span>
              </div>
              {stats.titulo ? (
                <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                  <div style={{
                    fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:800,
                    color: tData?.color || SC.gold,
                    textShadow:`0 0 8px ${tData?.color||SC.gold}44`,
                    padding:"5px 14px",
                    background:`${tData?.color||SC.gold}14`,
                    border:`1px solid ${tData?.color||SC.gold}33`,
                    borderRadius:20,
                  }}>🏅 {stats.titulo}</div>
                  {tData && (
                    <span style={{fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                      color:RAREZA_TITULO_COLOR[tData.rareza]||SC.muted,
                      background:`${RAREZA_TITULO_COLOR[tData.rareza]||SC.muted}14`,
                      border:`1px solid ${RAREZA_TITULO_COLOR[tData.rareza]||SC.muted}33`,
                      borderRadius:20, padding:"2px 8px"}}>
                      {tData.rareza}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:400,
                  color:SC.muted, fontStyle:"italic"}}>
                  {t("pr.edit.no_active_title")}
                </div>
              )}
            </div>
          </motion.div>
          )}

          {/* ── Active class card ── */}
          {viewPane==="clase" && (
          <motion.div variants={FV.card} style={{
            ...glass(viewCls.color),
            padding:"22px 20px",
            boxShadow:`0 4px 28px rgba(0,0,0,.45), 0 0 32px ${viewCls.color}0e, inset 0 1px 0 rgba(255,255,255,.04)`,
          }}>
            <TopLine color={viewCls.color}/>
            <div style={{
              position:"absolute", top:"-30%", right:"-10%",
              width:"60%", height:"200%",
              background:`radial-gradient(ellipse,${viewCls.color}12,transparent 65%)`,
              filter:"blur(40px)", pointerEvents:"none",
            }}/>

            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
              color:SC.muted, letterSpacing:".12em", marginBottom:16, position:"relative"}}>
              {t("pr.edit.active_class")}
            </div>

            <div style={{
              position:"relative",
              display:"flex", flexDirection:"column", alignItems:"center",
              background:`${viewCls.color}0c`, border:`1px solid ${viewCls.color}22`,
              borderRadius:16, padding:"22px 16px", marginBottom:14, textAlign:"center",
            }}>
              <motion.span
                animate={{y:[0,-5,0], rotate:[0,3,-3,0]}}
                transition={{duration:3.5, repeat:Infinity, ease:"easeInOut"}}
                style={{fontSize:42, filter:`drop-shadow(0 0 14px ${viewCls.color})`, marginBottom:12}}>
                {viewCls.icon}
              </motion.span>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:800,
                color:viewCls.color, letterSpacing:".06em", marginBottom:6}}>
                {stats.heroClass}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:500,
                color:SC.mutedL, lineHeight:1.6, marginBottom:12}}>
                {viewCls.desc}
              </div>
              <div style={{
                fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
                color:viewCls.color,
                background:`${viewCls.color}16`, border:`1px solid ${viewCls.color}33`,
                borderRadius:20, padding:"4px 16px", display:"inline-block",
              }}>
                {viewCls.bonus}
              </div>
            </div>

            <motion.button
              whileHover={{scale:1.02, borderColor:`${viewCls.color}55`}}
              whileTap={{scale:.97}}
              onClick={() => { setEditPane("clase"); setEditMode(true); }}
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                width:"100%", padding:"10px 0",
                background:"transparent",
                border:`1px solid ${SC.navy}`, borderRadius:12,
                fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
                color:SC.mutedL, cursor:"pointer", transition:"all .2s", position:"relative",
              }}>
              <Edit2 size={12}/>
              {t("pr.edit.change_class")}
              <span style={{
                fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                color:SC.gold, background:`${SC.gold}14`, border:`1px solid ${SC.gold}33`,
                borderRadius:20, padding:"1px 8px",
              }}>{CLASS_COST} 🪙</span>
            </motion.button>
          </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────────
  const disabled = loading || (totalCost > 0 && !canAfford);

  return (
    <motion.div variants={FV.wrap} initial="hidden" animate="show"
      className={shake ? "up-shake" : ""}
      style={{display:"flex", flexDirection:"column", gap:14}}>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
        {[
          { id:"perfil", eyebrow:"Ajuste base", title:"Nombre, bio y título", note:"Edita la ficha pública sin mezclarla con el cambio de clase.", glow:SC.orange },
          { id:"clase", eyebrow:"Afinidad", title:"Clase y costo del cambio", note:"La decision de clase queda separada para no ensuciar el formulario.", glow:bc },
        ].map((pane) => {
          const active = editPane === pane.id;
          return (
            <button
              key={pane.id}
              onClick={() => setEditPane(pane.id)}
              style={{
                textAlign:"left",
                padding:"15px 16px 14px",
                borderRadius:18,
                border:`1px solid ${active ? pane.glow : "rgba(160,140,220,.18)"}`,
                background:active ? `linear-gradient(135deg, ${pane.glow}22, rgba(14,21,32,.92))` : "rgba(14,21,32,.78)",
                boxShadow:active ? `0 12px 24px ${pane.glow}18` : "0 8px 16px rgba(0,0,0,.18)",
                cursor:"pointer",
              }}
            >
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:active ? pane.glow : SC.muted,marginBottom:8}}>
                {pane.eyebrow}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:20,fontWeight:800,lineHeight:1.04,color:SC.white,letterSpacing:"-.03em",marginBottom:7}}>
                {pane.title}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.6,color:SC.mutedL}}>
                {pane.note}
              </div>
            </button>
          );
        })}
      </div>

      {/* Edit mode header */}
      <motion.div variants={FV.card} style={{
        position:"relative", overflow:"hidden",
        background:`${SC.orange}0e`,
        border:`1px solid ${SC.orange}33`, borderRadius:16,
        padding:"13px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        backdropFilter:"blur(10px)",
      }}>
        <div style={{
          position:"absolute", left:0, top:0, bottom:0, width:"45%",
          background:"linear-gradient(90deg,transparent,rgba(255,255,255,.02),transparent)",
          animation:"up-shine 3s ease-in-out infinite", pointerEvents:"none",
        }}/>
        <div style={{display:"flex", alignItems:"center", gap:10,
          fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
          color:SC.orange, letterSpacing:".06em", position:"relative"}}>
          <motion.span animate={{rotate:[0,-8,8,-8,0]}} transition={{duration:.6, delay:.1}}>
            <Edit2 size={14}/>
          </motion.span>
          {t("pr.edit.edit_mode")}
        </div>
        <div style={{display:"flex", alignItems:"center", gap:10, position:"relative"}}>
          <div style={{
            fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
            color:SC.gold, background:`${SC.gold}14`, border:`1px solid ${SC.gold}33`,
            borderRadius:20, padding:"4px 12px",
          }}>
            🪙 {stats.coins.toLocaleString()}
          </div>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:.95}}
            onClick={cancel}
            style={{
              display:"flex", alignItems:"center", gap:5,
              fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
              color:SC.muted,
              background:`${SC.navy}88`, border:`1px solid ${SC.navy}`,
              borderRadius:10, padding:"6px 14px", cursor:"pointer",
            }}>
            <X size={12}/> {t("pr.edit.cancel")}
          </motion.button>
        </div>
      </motion.div>

      {/* General error */}
      <AnimatePresence>
        {errors.general && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{
              padding:"12px 16px",
              background:`${SC.red}12`, border:`1px solid ${SC.red}44`,
              borderRadius:14,
              fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600,
              color:SC.red, display:"flex", alignItems:"center", gap:8,
            }}>
            <AlertTriangle size={15}/>{errors.general}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile ? "1fr" : "minmax(0,1.35fr) 320px",
        gap:14,
        alignItems:"start",
      }}>
      <div style={{display:"grid", gap:14}}>

      {/* Public info */}
      {editPane==="perfil" && (
      <motion.div variants={FV.card} style={{...glass(SC.orange), padding:"22px 24px"}}>
        <TopLine color={SC.orange}/>
        <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
          color:SC.muted, letterSpacing:".12em", marginBottom:18}}>
          👤 {t("pr.edit.public_info")}
        </div>

        <EInput
          label={"⚔️ " + t("pr.edit.hero_name_label")}
          value={form.username}
          onChange={v=>set("username",v)}
          onBlur={()=>touch("username")}
          placeholder="Ej: WarriorX"
          error={dirty.has("username")?errors.username:null}
          badge={
            <span style={{
              fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
              borderRadius:20, padding:"2px 10px",
              color: stats.usernameChanged ? SC.gold : SC.green,
              background: stats.usernameChanged ? `${SC.gold}14` : `${SC.green}14`,
              border:`1px solid ${stats.usernameChanged ? SC.gold : SC.green}33`,
            }}>
              {stats.usernameChanged ? `${t("pr.edit.cost_badge")} ${USERNAME_COST} 🪙` : t("pr.edit.first_free_badge")}
            </span>
          }
          hint={usernameChanging && stats.usernameChanged
            ? `${t("pr.edit.username_cost_hint_pre")} ${USERNAME_COST} 🪙`
            : null}
        />

        <EInput
          label={"🎖 " + t("pr.edit.special_title")}
          value={form.heroName}
          onChange={v=>set("heroName",v)}
          onBlur={()=>touch("heroName")}
          placeholder="Ej: El Guardián del Norte"
          error={dirty.has("heroName")?errors.heroName:null}
        />

        <TituloPicker
          activeTitulo={form.titulo}
          titleCatalog={titleCatalog}
          ownedTitles={stats.ownedTitles || []}
          coins={stats.coins || 0}
          onEquip={(nombre) => { setForm(f => ({ ...f, titulo: nombre })); }}
          onBought={(nombre, newCoins, newOwned) => {
            onSaved?.({ coins: newCoins, ownedTitles: newOwned, titulo: nombre });
          }}
          showToast={showToast}
        />

        {/* Bio with char counter */}
        <div>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7}}>
            <label style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
              color:SC.muted, letterSpacing:".08em"}}>📝 {t("pr.edit.biography")}</label>
            <div style={{
              fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
              color: form.bio.length > 160 ? SC.red : form.bio.length > 140 ? SC.gold : SC.muted,
            }}>
              {form.bio.length}/160
            </div>
          </div>
          <div style={{height:3, borderRadius:99, background:SC.navy, marginBottom:8, overflow:"hidden"}}>
            <motion.div
              animate={{width:`${Math.min(100,(form.bio.length/160)*100)}%`}}
              transition={{duration:.2}}
              style={{
                height:"100%", borderRadius:99,
                background: form.bio.length > 160 ? SC.red : form.bio.length > 140 ? SC.gold : SC.orange,
                opacity: form.bio.length > 0 ? 1 : 0,
              }}/>
          </div>
          <EInput
            value={form.bio}
            onChange={v=>set("bio",v)}
            onBlur={()=>touch("bio")}
            placeholder={t("pr.edit.bio_placeholder")}
            rows={3}
            error={dirty.has("bio")?errors.bio:null}
          />
        </div>
      </motion.div>
      )}

      {/* Class picker */}
      {editPane==="clase" && (
      <motion.div variants={FV.card} style={{...glass(bc), padding:"22px 24px"}}>
        <TopLine color={bc}/>
        <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
          color:SC.muted, letterSpacing:".12em", marginBottom:6}}>{t("pr.edit.hero_class_title")}</div>
        <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:500,
          color:SC.muted, marginBottom:18, lineHeight:1.6}}>
          {t("pr.edit.hero_class_desc_pre")}{" "}
          <span style={{color:SC.gold, fontWeight:700}}>{CLASS_COST} 🪙</span>.
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
          {Object.entries(CLS).map(([key,m]) => {
            const on = form.heroClass === key;
            return (
              <motion.button key={key} type="button"
                whileHover={on?{}:{scale:1.03, y:-3}}
                whileTap={on?{}:{scale:.97}}
                onClick={()=>on?null:(setPendingClass(key),setConfirmClass(true))}
                style={{
                  position:"relative", overflow:"hidden",
                  background:on?`linear-gradient(145deg,${m.color}18,rgba(14,21,32,.95))`:"rgba(14,21,32,.7)",
                  border:`2px solid ${on?m.color:SC.navy}`,
                  borderRadius:16, padding:"16px 10px",
                  cursor:on?"default":"pointer", textAlign:"center",
                  boxShadow:on?`0 0 22px ${m.color}33, 0 6px 20px rgba(0,0,0,.4)`:`0 3px 12px rgba(0,0,0,.3)`,
                  transition:"box-shadow .25s, border-color .25s",
                  backdropFilter:"blur(8px)",
                }}>
                {on && (
                  <div style={{position:"absolute", top:0, left:0, right:0, height:1,
                    background:`linear-gradient(90deg,transparent,${m.color}aa,transparent)`}}/>
                )}
                {on && (
                  <motion.div initial={{scale:0, opacity:0}} animate={{scale:1, opacity:1}}
                    style={{position:"absolute", top:7, right:7,
                      background:`${m.color}22`, border:`1px solid ${m.color}66`,
                      borderRadius:20, padding:"1px 7px",
                      fontFamily:"'Manrope',sans-serif", fontSize:8, fontWeight:700, color:m.color}}>
                    {t("pr.edit.class_active")}
                  </motion.div>
                )}
                <motion.div
                  animate={on?{y:[0,-5,0], rotate:[0,4,-4,0]}:{}}
                  transition={on?{duration:3, repeat:Infinity, ease:"easeInOut"}:{}}
                  style={{fontSize:30, marginBottom:8, filter:on?`drop-shadow(0 0 10px ${m.color})`:"none"}}>
                  {m.icon}
                </motion.div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                  color:on?m.color:SC.mutedL, marginBottom:5, letterSpacing:".06em"}}>
                  {key}
                </div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:400,
                  color:SC.muted, lineHeight:1.5, marginBottom:8, minHeight:32}}>
                  {m.desc}
                </div>
                <div style={{
                  fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                  color:on?m.color:SC.muted,
                  background:on?`${m.color}16`:"transparent",
                  border:`1px solid ${on?m.color:SC.navy}`,
                  borderRadius:20, padding:"3px 10px", display:"inline-block",
                }}>
                  {m.bonus}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Confirm class change */}
        <AnimatePresence>
          {confirmClass && (() => {
            const hasCoins = stats.coins >= CLASS_COST;
            const pendingM = CLS[pendingClass];
            return (
              <motion.div key="confirm"
                initial={{opacity:0,y:10,scale:.97}} animate={{opacity:1,y:0,scale:1}}
                exit={{opacity:0,y:8,scale:.97}}
                style={{
                  marginTop:14,
                  background:`${SC.gold}0c`,
                  border:`1px solid ${SC.gold}33`, borderRadius:16,
                  padding:"18px 20px",
                  backdropFilter:"blur(10px)",
                }}>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8}}>
                  <span style={{fontSize:20}}>{pendingM?.icon}</span>
                  <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                    color:SC.gold, letterSpacing:".06em"}}>
                    {t("pr.edit.confirm_class_pre")} {pendingClass}{t("pr.edit.confirm_class_q")}
                  </div>
                </div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:500,
                  color:SC.mutedL, marginBottom:14, lineHeight:1.6}}>
                  {t("pr.edit.confirm_class_desc_pre")} <span style={{color:pendingM?.color, fontWeight:700}}>{pendingM?.bonus}</span>.{" "}
                  {t("pr.edit.confirm_class_desc_suf")}
                </div>
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  background:"rgba(14,21,32,.7)", border:`1px solid ${SC.navy}`,
                  borderRadius:12, padding:"10px 16px", marginBottom:12,
                }}>
                  <span style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600, color:SC.muted}}>
                    {t("pr.edit.change_cost")}
                  </span>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <span style={{fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:800, color:SC.gold}}>
                      {CLASS_COST} 🪙
                    </span>
                    <span style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                      color:hasCoins?SC.green:SC.red,
                      background:hasCoins?`${SC.green}14`:`${SC.red}14`,
                      border:`1px solid ${hasCoins?SC.green:SC.red}33`,
                      borderRadius:20, padding:"2px 8px",
                    }}>
                      {hasCoins ? t("pr.edit.have") : t("pr.edit.missing")} {hasCoins?stats.coins:`${CLASS_COST-stats.coins}`} 🪙
                    </span>
                  </div>
                </div>
                {!hasCoins && (
                  <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:600,
                    color:SC.red, marginBottom:12, display:"flex", alignItems:"center", gap:6}}>
                    <AlertTriangle size={13}/>
                    {t("pr.edit.no_coins")}
                  </div>
                )}
                <div style={{display:"flex", gap:10}}>
                  <motion.button whileTap={{scale:.95}} onClick={()=>setConfirmClass(false)}
                    style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600, color:SC.muted,
                      background:`${SC.navy}88`, border:`1px solid ${SC.navy}`,
                      borderRadius:12, padding:"9px 18px", cursor:"pointer",
                    }}>
                    {t("pr.edit.cancel")}
                  </motion.button>
                  <motion.button whileTap={hasCoins?{scale:.95}:{}}
                    disabled={!hasCoins}
                    onClick={() => { if (hasCoins) applyPendingClassChange(); }}
                    style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700,
                      color:hasCoins?SC.bg:SC.muted,
                      background:hasCoins?`linear-gradient(135deg,${SC.gold},${SC.orange})`:SC.navy,
                      border:"none", borderRadius:12, padding:"9px 22px",
                      cursor:hasCoins?"pointer":"not-allowed",
                      boxShadow:hasCoins?`0 4px 18px ${SC.gold}44`:"none",
                      flex:1,
                    }}>
                    {hasCoins ? `${t("pr.edit.confirm_btn_pre")} ${pendingClass}` : t("pr.edit.no_coins_btn")}
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </motion.div>
      )}
      </div>

      <motion.aside variants={FV.card} style={{
        ...glass(editPane==="clase" ? bc : SC.orange),
        padding:"18px 18px 16px",
        position:isMobile ? "relative" : "sticky",
        top:isMobile ? "auto" : 14,
      }}>
        <TopLine color={editPane==="clase" ? bc : SC.orange}/>
        <div style={{display:"grid",gap:12}}>
          <div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:editPane==="clase" ? bc : SC.orange,marginBottom:8}}>
              Panel lateral
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:22,fontWeight:800,lineHeight:1.05,color:"#fff",marginBottom:8}}>
              {editPane==="clase" ? "Afinidad del personaje" : "Identidad pública"}
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.65,color:SC.mutedL}}>
              {editPane==="clase"
                ? "La afinidad cambia el tono de la UI, el foco de las recomendaciones y parte del recorrido visual del usuario."
                : "Este módulo concentra nombre, bio y título para que la edición no se vuelva una pantalla larga sin contexto."}
            </div>
          </div>

          {[
            { label:"Monedas listas", value:`${(stats.coins || 0).toLocaleString()} monedas`, glow:"#f4cc78" },
            { label:"Costo actual", value: totalCost > 0 ? `${totalCost} monedas` : "Sin cambios de costo", glow:totalCost > 0 ? "#f4cc78" : SC.green },
            { label:"Estado del guardado", value: disabled ? "Revision pendiente" : "Listo para aplicar", glow:disabled ? SC.orange : SC.green },
          ].map((item) => (
            <div key={item.label} style={{
              padding:"11px 12px",
              borderRadius:14,
              border:`1px solid ${item.glow}26`,
              background:"rgba(10,14,26,.58)",
            }}>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:SC.muted,marginBottom:5}}>
                {item.label}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:15,fontWeight:800,color:item.glow}}>
                {item.value}
              </div>
            </div>
          ))}

          <div style={{
            padding:"12px 12px 10px",
            borderRadius:14,
            border:`1px solid ${(editPane==="clase" ? bc : SC.orange)}26`,
            background:`${(editPane==="clase" ? bc : SC.orange)}10`,
          }}>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:editPane==="clase" ? bc : SC.orange,marginBottom:6}}>
              Nota rápida
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.65,color:"rgba(231,224,242,.8)"}}>
              {editPane==="clase"
                ? "Si cambias la clase, el tablero personal reorganiza color, orden de zonas y algunas sugerencias del día."
                : "Mantener la bio breve y el título claro ayuda a que la portada del perfil se lea con más fuerza."}
            </div>
          </div>
        </div>
      </motion.aside>
      </div>

      {/* Cost summary */}
      <AnimatePresence>
        {totalCost > 0 && (
          <motion.div key="cost"
            initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
            style={{
              background:canAfford?`${SC.gold}0c`:`${SC.red}0c`,
              border:`1px solid ${canAfford?SC.gold:SC.red}33`,
              borderRadius:14, padding:"14px 20px",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10,
            }}>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600,
              color:canAfford?SC.gold:SC.red, display:"flex", alignItems:"center", gap:7}}>
              {canAfford ? "💰" : <AlertTriangle size={15}/>}
              {t("pr.edit.total_deduct")}
            </div>
            <div style={{display:"flex", alignItems:"center", gap:16}}>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:15, fontWeight:800,
                color:canAfford?SC.gold:SC.red}}>{totalCost} 🪙</div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:500, color:SC.muted}}>
                {t("pr.edit.will_remain")} {Math.max(0,stats.coins-totalCost)} 🪙
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {totalCost > 0 && !canAfford && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          style={{
            fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
            color:SC.red, padding:"10px 16px",
            background:`${SC.red}0c`, border:`1px solid ${SC.red}22`,
            borderRadius:14, display:"flex", alignItems:"center", gap:7,
          }}>
          <AlertTriangle size={14}/>
          {t("pr.edit.no_coins")}
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div variants={FV.card}
        style={{display:"flex", gap:12, justifyContent:"flex-end", alignItems:"center", flexWrap:"wrap"}}>
        <motion.button whileHover={{scale:1.03}} whileTap={{scale:.96}}
          onClick={cancel}
          style={{
            display:"flex", alignItems:"center", gap:7,
            fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, color:SC.mutedL,
            background:"rgba(14,21,32,.7)", border:`1px solid ${SC.navy}`,
            borderRadius:12, padding:"12px 22px", cursor:"pointer",
            backdropFilter:"blur(8px)",
          }}>
          <X size={13}/> {t("pr.edit.cancel")}
        </motion.button>

        <motion.button
          whileHover={disabled?{}:{scale:1.04, y:-2}}
          whileTap={disabled?{}:{scale:.96}}
          onClick={save}
          disabled={disabled}
          style={{
            display:"flex", alignItems:"center", gap:9,
            fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700, letterSpacing:".05em",
            color: disabled ? SC.muted : SC.bg,
            background: disabled ? SC.navy : `linear-gradient(135deg,${SC.orange},${SC.gold})`,
            border:"none", borderRadius:12, padding:"12px 28px",
            cursor:disabled?"not-allowed":"pointer",
            boxShadow:disabled?"none":`0 0 28px ${SC.orange}44`,
            transition:"all .2s",
          }}>
          {loading ? (
            <>
              <div style={{width:13,height:13,border:`2px solid ${SC.muted}44`,
                borderTop:`2px solid ${SC.muted}`,borderRadius:"50%",animation:"up-spin .7s linear infinite"}}/>
              {t("pr.edit.saving")}
            </>
          ) : (
            <><Save size={14}/> {t("pr.edit.save")}</>
          )}
        </motion.button>
      </motion.div>

    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: SKINS — Admin-config palette · Premium Layout
// ══════════════════════════════════════════════════════════════

// Admin-config colour tokens used throughout this tab
const SC = {
  bg:"#0A0E1A", card:"rgba(14,21,32,0.9)", panel:"#0E1520",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#D4A574", gold:"#C9B037",
  blue:"#5A9FD4", teal:"#4A9D8F", green:"#6B9F6A",
  red:"#C66B6B", purple:"#8B7BB8",
  white:"#F0F4FF", muted:"#7A8A9E", mutedL:"#9AA3B2",
};

const RARITY_META = {
  "Común":       { color:SC.muted,   label:"COMÚN",      tier:1 },
  "Poco común":  { color:SC.green,   label:"POCO COMÚN", tier:2 },
  "Raro":        { color:SC.blue,    label:"RARO",       tier:3 },
  "Épico":       { color:SC.purple,  label:"ÉPICO",      tier:4 },
  "Legendario":  { color:SC.gold,    label:"LEGENDARIO", tier:5 },
};

// Single avatar pill for the hero-card strip
function AvatarStripPill({ av, owned, isActive, size, onEquip, avatarChanging }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <motion.div
      whileHover={owned && !isActive ? { scale:1.15, y:-2 } : {}}
      whileTap={owned   && !isActive ? { scale:.9  } : {}}
      onClick={() => owned && !isActive && !avatarChanging && onEquip(av.id)}
      title={owned ? av.nombre : `${av.nombre} — ${av.precio.toLocaleString()} 🪙`}
      style={{
        position:"relative", flexShrink:0,
        width:size, height:size, borderRadius:"50%",
        background:`linear-gradient(135deg,${SC.card},${SC.bg})`,
        border:`2px solid ${isActive ? av.color : owned ? av.color+"55" : P.line}`,
        boxShadow: isActive ? `0 0 10px ${av.color}77` : "none",
        overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor: owned && !isActive ? "pointer" : "default",
        opacity: owned ? 1 : 0.4,
        transition:"border-color .2s, box-shadow .2s, opacity .2s",
      }}>
      {imgOk ? (
        <img src={`/perfil/${av.id}.png`} alt={av.id}
          onError={() => setImgOk(false)}
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
          <span style={{ fontSize:size*0.38, lineHeight:1 }}>👤</span>
          <span style={{ fontSize:size*0.2, color:av.color, fontWeight:700, opacity:.7 }}>
            {av.id.replace("avatar_","")}
          </span>
        </div>
      )}
      {!owned && (
        <div style={{ position:"absolute", inset:0, borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:size*0.3, background:"rgba(0,0,0,.35)" }}>🔒</div>
      )}
      {isActive && (
        <div style={{ position:"absolute", bottom:1, right:1,
          width:8, height:8, borderRadius:"50%",
          background:av.color, border:`1.5px solid ${SC.bg}`,
          boxShadow:`0 0 5px ${av.color}` }}/>
      )}
    </motion.div>
  );
}

// Horizontal quick-switch strip — shown in hero card
function AvatarStrip({ ownedAvatars, activeAvatarId, onEquip, size=38, avatarChanging=false }) {
  return (
    <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none",
      paddingBottom:2, paddingTop:2 }}>
      {AVATARS_CATALOG.map(av => (
        <AvatarStripPill
          key={av.id}
          av={av}
          owned={ownedAvatars.includes(av.id)}
          isActive={activeAvatarId === av.id}
          size={size}
          onEquip={onEquip}
          avatarChanging={avatarChanging}
        />
      ))}
    </div>
  );
}

// Small avatar circle used inside guardarropa grid cards
function AvatarThumb({ id, color, size=62, active=false }) {
  const [ok, setOk] = useState(true);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", margin:"0 auto 10px",
      background:`linear-gradient(135deg,${SC.card},${SC.bg})`,
      border:`2px solid ${active ? color : color+"55"}`,
      boxShadow: active ? `0 0 14px ${color}66` : "none",
      overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
      fontSize: size * 0.35, color, fontWeight:700, transition:"box-shadow .2s" }}>
      {ok ? (
        <img src={`/perfil/${id}.png`} alt={id} onError={() => setOk(false)}
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          <span style={{ fontSize:size*0.38, lineHeight:1 }}>👤</span>
          <span style={{ fontSize:size*0.16, color, fontWeight:700, opacity:.7 }}>
            {id.replace("avatar_","")}
          </span>
        </div>
      )}
    </div>
  );
}

function SkinCard({ sk, isActive, owned, skinChanging, onEquip, index, classPrimary = "#6BC87A" }) {
  const { t }      = useLang();
  const [hov, setHov] = useState(false);
  const rm  = RARITY_META[sk.rareza] || RARITY_META["Común"];
  const col = sk.color || rm.color;

  return (
    <motion.div
      initial={{ opacity:0, y:14, scale:.96 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:index*.06, type:"spring", stiffness:260, damping:24 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      style={{
        position:"relative", overflow:"hidden",
        background: isActive
          ? `linear-gradient(155deg,${col}1a,rgba(14,21,32,0.95))`
          : "rgba(14,21,32,0.88)",
        border:`1px solid ${isActive ? col : owned ? `${col}44` : SC.navy}`,
        borderRadius:16,
        opacity: owned ? 1 : 0.55,
        boxShadow: isActive
          ? `0 0 28px ${col}44, 0 12px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)`
          : hov && owned
            ? `0 0 14px ${col}22, 0 8px 28px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.04)`
            : `0 4px 16px rgba(0,0,0,.35)`,
        backdropFilter:"blur(16px)",
        transition:"box-shadow .25s, border-color .25s",
        cursor: owned && !isActive ? "pointer" : "default",
      }}>

      {/* Top accent line */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,height:1,
        background: isActive || (hov && owned)
          ? `linear-gradient(90deg,transparent,${col}cc,transparent)`
          : `linear-gradient(90deg,transparent,${col}33,transparent)`,
        transition:"background .3s",
      }}/>

      {/* Shimmer sweep */}
      {hov && owned && (
        <div style={{
          position:"absolute",top:0,bottom:0,width:"40%",
          background:"linear-gradient(90deg,transparent,rgba(255,255,255,.03),transparent)",
          animation:"up-shine 1.6s ease-in-out",
          pointerEvents:"none", zIndex:1,
        }}/>
      )}

      {/* Equipped badge */}
      {isActive && (
        <motion.div
          initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
          transition={{type:"spring",stiffness:320,damping:18,delay:.1}}
          style={{
            position:"absolute",top:10,right:10,zIndex:3,
            background:`linear-gradient(135deg,${col}ee,${col}aa)`,
            borderRadius:8,padding:"3px 10px",
            ...raj(9,700),color:"rgba(10,14,26,0.9)",
            boxShadow:`0 0 12px ${col}66`,
            letterSpacing:".05em",
          }}>
          {t("pr.skin.equipped_badge")}
        </motion.div>
      )}

      {/* Lock overlay */}
      {!owned && (
        <div style={{
          position:"absolute",inset:0,zIndex:2,borderRadius:15,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          background:"rgba(10,14,26,.65)",backdropFilter:"blur(3px)",gap:6,
        }}>
          <div style={{fontSize:24}}>🔒</div>
          <div style={{...raj(10,700),color:SC.muted,letterSpacing:".05em"}}>{t("pr.skin.locked")}</div>
          <div style={{...raj(9,500),color:SC.muted}}>{t("pr.skin.store_hint")}</div>
        </div>
      )}

      {/* Pixel art preview zone */}
      <div style={{
        width:"100%",height:118,
        display:"flex",alignItems:"center",justifyContent:"center",
        background: isActive
          ? `radial-gradient(ellipse at 50% 85%,${col}20 0%,transparent 65%)`
          : `radial-gradient(ellipse at 50% 85%,${col}0c 0%,transparent 65%)`,
        position:"relative",overflow:"hidden",
      }}>
        {isActive && (
          <motion.div
            animate={{scale:[1,1.12,1],opacity:[.15,.3,.15]}}
            transition={{duration:2.8,repeat:Infinity,ease:"easeInOut"}}
            style={{
              position:"absolute",bottom:0,left:"20%",right:"20%",height:"35%",
              background:`radial-gradient(ellipse,${col}55,transparent 70%)`,
              filter:"blur(8px)",pointerEvents:"none",
            }}/>
        )}
        <img
          src={getSkinPreview(sk.id)}
          alt={sk.nombre}
          style={{
            width:94,height:94,
            objectFit:"contain",objectPosition:"bottom center",
            imageRendering:"pixelated",
            filter: owned
              ? isActive
                ? `drop-shadow(0 4px 14px ${col}99) drop-shadow(0 0 8px ${col}66)`
                : hov
                  ? `drop-shadow(0 3px 10px ${col}66)`
                  : `drop-shadow(0 2px 6px ${col}44)`
              : "grayscale(1) opacity(.28)",
            transition:"filter .25s",
            position:"relative",zIndex:1,
          }}
          onError={e=>{ e.currentTarget.style.display="none"; e.currentTarget.nextSibling.style.display="flex"; }}
        />
        <div style={{display:"none",fontSize:36,alignItems:"center",justifyContent:"center",
          width:"100%",height:"100%",opacity:.18}}>🎭</div>
      </div>

      {/* Info & action */}
      <div style={{padding:"11px 13px 13px",display:"flex",flexDirection:"column",gap:7}}>
        <div style={{
          ...raj(12,700),
          color: isActive ? col : owned ? SC.white : SC.muted,
          textShadow: isActive ? `0 0 10px ${col}55` : "none",
          letterSpacing:".02em",
        }}>
          {sk.nombre}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
          <div style={{
            background:`${col}15`,border:`1px solid ${col}44`,
            borderRadius:20,padding:"2px 10px",
            ...raj(9,700),color:col,letterSpacing:".06em",
          }}>
            {rm.label}
          </div>
          <div style={{...raj(9,500),color:`${col}77`}}>
            {"★".repeat(rm.tier)}
          </div>
        </div>

        {owned && !isActive && (
          <motion.button
            whileTap={{scale:.94}} whileHover={{scale:1.02}}
            onClick={() => onEquip(sk.id)}
            disabled={skinChanging}
            style={{
              width:"100%",padding:"7px 0",
              background:`${col}14`,border:`1px solid ${col}44`,
              borderRadius:10,color:col,
              cursor:skinChanging?"wait":"pointer",
              ...raj(11,700),transition:"all .2s",
            }}>
            {skinChanging ? (
              <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <div style={{width:9,height:9,border:`2px solid ${col}44`,borderTop:`2px solid ${col}`,
                  borderRadius:"50%",animation:"up-spin .7s linear infinite"}}/>
                {t("pr.skin.equipping")}
              </span>
            ) : t("pr.skin.equip")}
          </motion.button>
        )}
        {isActive && (
          <div style={{
            width:"100%",padding:"6px 0",textAlign:"center",
            background:`linear-gradient(135deg, ${rgbaHex(classPrimary, 0.18)}, ${col}14)`,
            border:`1px solid ${rgbaHex(classPrimary, 0.34)}`,
            boxShadow:`0 0 12px ${rgbaHex(classPrimary, 0.14)}`,
            borderRadius:10,...raj(10,700),color:classPrimary,
          }}>
            {t("pr.skin.active_btn")}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkinsTab({
  skinCatalog, ownedSkins, activeSkinL, skinChanging, skinFeedback, handleEquipSkin,
  avatarCatalog, frameCatalog, ownedAvatars, activeAvatarL, ownedFrames, activeFrameL,
  avatarChanging, avatarFeedback, avatarBuyingId, handleEquipAvatar, handleEquipFrame, handleBuyAvatarItem, heroClass,
}) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const rgbaHex = (hex, alpha = 1) => {
    if (typeof hex !== "string" || !hex.startsWith("#")) return hex;
    const raw = hex.slice(1);
    const full = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
    const value = Number.parseInt(full, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const classMeta = PROFILE_CLS[heroClass] || PROFILE_CLS.GUERRERO;
  const classPrimary = classMeta.color || "#6BC87A";
  const classSecondary = classMeta.secondary || classPrimary;
  const classBg = classMeta.bg || rgbaHex(classPrimary, 0.14);
  const classPrimarySoft = rgbaHex(classPrimary, 0.12);
  const classSecondarySoft = rgbaHex(classSecondary, 0.12);
  const classPrimaryEdge = rgbaHex(classPrimary, 0.34);
  const classSecondaryEdge = rgbaHex(classSecondary, 0.3);
  const classPrimaryGlow = rgbaHex(classPrimary, 0.24);
  const classSecondaryGlow = rgbaHex(classSecondary, 0.2);
  const wardrobeIcons = {
    skins: "/ui/header/section-perfil.png",
    avatars: "/exercises/summary/sum-logbook.png",
    frames: "/ui/medals/rank-crown.png",
    active: "/ui/header/section-perfil.png",
    roster: "/ui/medals/medal-gold.png",
    collection: "/ui/icon-gem.png",
    avatarsHeader: "/exercises/summary/sum-zones.png",
    framesHeader: "/ui/medals/medal-silver.png",
  };
  const [filter, setFilter] = useState("todas");
  const [wardrobePane, setWardrobePane] = useScopedStorageState("fv-profile-wardrobe-pane-v1", "skins");
  const allSkins = [{ id:"default", nombre:"Flex Original", rareza:"Común", color:classPrimary }, ...skinCatalog];
  const rarities = ["todas", ...Array.from(new Set(allSkins.map(s => s.rareza)))];

  const filtered = filter === "todas"
    ? allSkins
    : allSkins.filter(s => s.rareza === filter);

  const ownedCount = allSkins.filter(s => ownedSkins.includes(s.id)).length;
  const activeSkin = allSkins.find(s => s.id === activeSkinL) || allSkins[0];
  const activeRm   = RARITY_META[activeSkin?.rareza] || RARITY_META["Común"];
  const activeCol  = activeSkin?.color || activeRm.color;
  const liveAvatars = avatarCatalog?.length ? avatarCatalog : AVATARS_CATALOG;
  const liveFrames = frameCatalog?.length ? frameCatalog : FRAMES_CATALOG;
  const activeAvatar = liveAvatars.find((entry) => entry.id === activeAvatarL) || liveAvatars[0] || AVATARS_CATALOG[0];
  const activeFrame = liveFrames.find((entry) => entry.id === activeFrameL) || null;

  const describeWardrobeEntry = useCallback((entry, type) => {
    if (!entry) {
      return [
        { label:"Tipo", value:type === "frame" ? "Marco sin equipar" : "Sin seleccion" },
        { label:"Rareza", value:"Base" },
        { label:"Origen", value:"Registro actual" },
        { label:"Coleccion", value:"Sin set activo" },
      ];
    }

    const rarity = normalizeRarityLabel(entry.rareza);
    const source = entry.precio > 0
      ? "Mercado del gremio"
      : type === "skin" || entry.id === "default" || entry.id === "avatar_01"
        ? "Base del héroe"
        : "Recompensa interna";
    const collection = entry.id === "default" || entry.id === "avatar_01"
      ? "Set base"
      : entry.esNuevo
        ? "Coleccion viva"
        : "Serie abierta";

    return [
      { label:"Tipo", value:type === "skin" ? "Cosmetico principal" : type === "avatar" ? "Retrato del perfil" : "Marco visual" },
      { label:"Rareza", value:rarity },
      { label:"Origen", value:source },
      { label:"Coleccion", value:collection },
    ];
  }, []);

  const FV = {
    wrap:{ hidden:{}, show:{ transition:{ staggerChildren:.06 } } },
    item:{ hidden:{ opacity:0, y:16 }, show:{ opacity:1, y:0, transition:{ type:"spring", stiffness:240, damping:22 } } },
  };

  const glass = (accent = SC.navy) => ({
    position:"relative", overflow:"hidden",
    background:"rgba(14,21,32,0.90)",
    backdropFilter:"blur(18px)",
    WebkitBackdropFilter:"blur(18px)",
    border:`1px solid ${accent}44`,
    borderRadius:20,
    boxShadow:`0 4px 28px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04)`,
  });

  const TopLine = ({color}) => (
    <div style={{
      position:"absolute",top:0,left:0,right:0,height:1,
      background:`linear-gradient(90deg,transparent,${color}aa,transparent)`,
      pointerEvents:"none",
    }}/>
  );

  return (
    <motion.div variants={FV.wrap} initial="hidden" animate="show"
      style={{ display:"flex", flexDirection:"column", gap:18 }}>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(198px,1fr))",gap:12}}>
        {[
          { id:"skins", eyebrow:"Skin activa", title:"Aspectos del avatar", note:"La lectura de skins queda separada de avatares y marcos.", glow:activeCol, icon:wardrobeIcons.skins },
          { id:"avatars", eyebrow:"Retrato", title:"Avatares del perfil", note:"Maneja el retrato principal sin mezclarlo con el resto del guardarropa.", glow:classSecondary, icon:wardrobeIcons.avatars },
          { id:"frames", eyebrow:"Marco", title:"Marcos equipables", note:"Los marcos viven en su propio módulo para que no ensanchen la vista.", glow:"#f4cc78", icon:wardrobeIcons.frames },
        ].map((pane) => {
          const active = wardrobePane === pane.id;
          return (
            <button
              key={pane.id}
              onClick={() => setWardrobePane(pane.id)}
              style={{
                textAlign:"left",
                padding:"15px 16px 14px",
                borderRadius:18,
                border:`1px solid ${active ? rgbaHex(pane.glow, 0.48) : classPrimaryEdge}`,
                background:active ? `linear-gradient(135deg, ${rgbaHex(pane.glow, 0.18)}, rgba(14,21,32,.92))` : `linear-gradient(135deg, rgba(14,21,32,.78), ${classPrimarySoft})`,
                boxShadow:active ? `0 12px 24px ${rgbaHex(pane.glow, 0.18)}` : `0 8px 16px rgba(0,0,0,.18), inset 0 1px 0 ${rgbaHex(classPrimary, 0.08)}`,
                cursor:"pointer",
              }}
            >
              {pane.icon && (
                <img
                  src={pane.icon}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  style={{ width:18, height:18, objectFit:"contain", marginBottom:8, filter:`drop-shadow(0 0 10px ${rgbaHex(pane.glow, 0.22)})` }}
                />
              )}
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:active ? pane.glow : SC.muted,marginBottom:8}}>
                {pane.eyebrow}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:20,fontWeight:800,lineHeight:1.04,color:SC.white,letterSpacing:"-.03em",marginBottom:7}}>
                {pane.title}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.6,color:SC.mutedL}}>
                {pane.note}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── FEEDBACK TOAST ── */}
      <AnimatePresence>
        {skinFeedback && (
          <motion.div key="fb"
            initial={{opacity:0,y:-12,scale:.94}} animate={{opacity:1,y:0,scale:1}}
            exit={{opacity:0,y:-8,scale:.94}}
            style={{
              padding:"12px 18px", borderRadius:14,
              background: skinFeedback.ok ? `${SC.green}14` : `${SC.red}14`,
              border:`1px solid ${skinFeedback.ok ? SC.green : SC.red}44`,
              color: skinFeedback.ok ? SC.green : SC.red,
              display:"flex", alignItems:"center", gap:10,
              backdropFilter:"blur(10px)",
              ...raj(12,600),
            }}>
            <span style={{fontSize:16}}>{skinFeedback.ok ? "✓" : "✕"}</span>
            {skinFeedback.text}
          </motion.div>
      )}
      </AnimatePresence>

      {/* ── SKIN ACTIVA — HERO CARD ── */}
      {wardrobePane==="skins" && (
      <>
      <motion.div variants={FV.item} style={{
        ...glass(activeCol, rgbaHex(activeCol || classPrimary, 0.12)),
        padding:isMobile ? "16px" : "18px 20px",
        boxShadow:`0 8px 40px rgba(0,0,0,.5), 0 0 50px ${rgbaHex(activeCol || classPrimary, 0.14)}, inset 0 1px 0 rgba(255,255,255,.05)`,
      }}>
        <TopLine color={activeCol}/>
        {/* ambient glow */}
        <div style={{
          position:"absolute", top:"-30%", right:"-8%",
          width:"45%", height:"220%",
          background:`radial-gradient(ellipse,${activeCol}18 0%,transparent 65%)`,
          filter:"blur(60px)", pointerEvents:"none",
        }}/>

        <div style={{
          position:"relative",
          display:"grid",
          gridTemplateColumns:isMobile ? "1fr" : "78px minmax(0,1fr) auto",
          alignItems:"center",
          gap:isMobile ? 14 : 16,
        }}>
          {/* Floating skin preview */}
          <motion.div
            animate={{y:[0,-5,0]}}
            transition={{duration:3.8, repeat:Infinity, ease:"easeInOut"}}
            style={{
              width:isMobile ? 74 : 78, height:isMobile ? 74 : 78, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:`radial-gradient(ellipse at 50% 85%,${activeCol}22,transparent 70%)`,
              borderRadius:18,
              border:`1px solid ${activeCol}33`,
              boxShadow:`0 0 32px ${activeCol}33, inset 0 0 20px ${activeCol}0a`,
              justifySelf:isMobile ? "start" : "stretch",
            }}>
            <img src={getSkinPreview(activeSkinL)} alt={activeSkin?.nombre}
              style={{
                width:isMobile ? 64 : 68, height:isMobile ? 64 : 68,
                objectFit:"contain", objectPosition:"bottom center",
                imageRendering:"pixelated",
                filter:`drop-shadow(0 6px 14px ${activeCol}88)`,
              }}
              onError={e => { e.currentTarget.style.display="none"; }}
            />
          </motion.div>

          {/* Info */}
          <div style={{minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,...raj(9,700), color:SC.muted, letterSpacing:".14em", marginBottom:6}}>
              <img src={wardrobeIcons.active} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:14,height:14,objectFit:"contain",filter:`drop-shadow(0 0 8px ${classPrimaryGlow})`}} />
              <span>{t("pr.skin.active_label")}</span>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap"}}>
              <div style={{...raj(isMobile ? 17 : 18,700), color:SC.white, fontFamily:"'Manrope',sans-serif", lineHeight:1.04}}>
                {activeSkin?.nombre}
              </div>
              <span style={{
                ...raj(9,700), color:activeCol,
                background:`${activeCol}16`, border:`1px solid ${activeCol}33`,
                borderRadius:999, padding:"4px 9px", letterSpacing:".08em",
              }}>
                {"★".repeat(activeRm.tier || 1)} {activeRm.label}
              </span>
            </div>
            <div style={{...raj(11,500), color:SC.mutedL, lineHeight:1.55, maxWidth:isMobile ? "100%" : 520}}>
              {t("pr.skin.hint")}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(132px,1fr))",gap:8,marginTop:12}}>
              {describeWardrobeEntry(activeSkin, "skin").map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    padding:"9px 10px",
                    borderRadius:12,
                    border:`1px solid ${activeCol}22`,
                    background:"rgba(10,14,26,.58)",
                  }}
                >
                  <div style={{display:"flex",alignItems:"center",gap:6,...raj(9,700), color:SC.muted, letterSpacing:".08em", marginBottom:4}}>
                    {index === 0 && <img src={wardrobeIcons.skins} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:12,height:12,objectFit:"contain"}} />}
                    {index === 1 && <img src="/ui/medals/medal-gold.png" alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:12,height:12,objectFit:"contain"}} />}
                    {index === 2 && <img src={wardrobeIcons.roster} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:12,height:12,objectFit:"contain"}} />}
                    {index === 3 && <img src={wardrobeIcons.collection} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:12,height:12,objectFit:"contain"}} />}
                    <span>{item.label}</span>
                  </div>
                  <div style={{...raj(11,700), color:SC.white, lineHeight:1.35}}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{...raj(10,500), color:SC.muted, lineHeight:1.5, marginTop:8}}>
              Sello de equipo: {formatRecentStamp(activeSkin?.equippedAt || activeSkin?.updatedAt, "Lectura pendiente")}
            </div>
          </div>

          {/* Ownership counter */}
          <div style={{
            display:"grid",
            gridTemplateColumns:isMobile ? "repeat(2,minmax(0,1fr))" : "repeat(2,minmax(86px,auto))",
            gap:8,
            justifyContent:isMobile ? "stretch" : "end",
          }}>
            <div style={{
              background:`${classPrimarySoft}`, border:`1px solid ${classPrimaryEdge}`,
              borderRadius:14, padding:"10px 12px", textAlign:isMobile ? "left" : "center",
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:isMobile ? "flex-start" : "center",gap:6,...raj(9,700), color:SC.muted, letterSpacing:".08em", marginBottom:4}}>
                <img src={wardrobeIcons.roster} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:12,height:12,objectFit:"contain"}} />
                <span>Activas</span>
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:20, fontWeight:900, color:classPrimary, lineHeight:1}}>
                {ownedCount}
              </div>
            </div>
            <div style={{
              background:`${rgbaHex(activeCol || classPrimary, 0.12)}`, border:`1px solid ${rgbaHex(activeCol || classPrimary, 0.28)}`,
              borderRadius:14, padding:"10px 12px", textAlign:isMobile ? "left" : "center",
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:isMobile ? "flex-start" : "center",gap:6,...raj(9,700), color:SC.muted, letterSpacing:".08em", marginBottom:4}}>
                <img src={wardrobeIcons.collection} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:12,height:12,objectFit:"contain"}} />
                <span>Coleccion</span>
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:20, fontWeight:900, color:activeCol, lineHeight:1}}>
                {ownedCount}/{allSkins.length}
              </div>
            </div>
          </div>
        </div>

        {/* Quick-switch strip — last 5 owned skins */}
        {allSkins.filter(s => ownedSkins.includes(s.id) || s.id === "default").length > 1 && (
          <div style={{
            marginTop:16, paddingTop:14,
            borderTop:`1px solid ${SC.navy}44`,
            display:"flex", gap:10, flexWrap:"wrap",
          }}>
            <div style={{...raj(9,700), color:SC.muted, letterSpacing:".1em", alignSelf:"center", marginRight:4}}>
              {t("pr.skin.quick_switch")}
            </div>
            {allSkins
              .filter(s => ownedSkins.includes(s.id) || s.id === "default")
              .slice(0, 6)
              .map(s => {
                const rm  = RARITY_META[s.rareza] || RARITY_META["Común"];
                const col = s.color || rm.color;
                const active = activeSkinL === s.id;
                return (
                  <motion.button
                    key={s.id}
                    whileHover={{scale:1.08}} whileTap={{scale:.94}}
                    onClick={() => !active && !skinChanging && handleEquipSkin(s.id)}
                    style={{
                      width:isMobile ? 36 : 38, height:isMobile ? 36 : 38, padding:0, borderRadius:10,
                      border:`1.5px solid ${active ? col : col+"44"}`,
                      background: active ? `${col}22` : "rgba(14,21,32,.7)",
                      cursor: active ? "default" : "pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow: active ? `0 0 14px ${col}44` : "none",
                      flexShrink:0, overflow:"hidden",
                    }}>
                    <img src={getSkinPreview(s.id)} alt={s.nombre}
                      style={{width:isMobile ? 28 : 30,height:isMobile ? 28 : 30,objectFit:"contain",imageRendering:"pixelated"}}
                      onError={e => { e.currentTarget.style.display="none"; }}
                    />
                  </motion.button>
                );
              })
            }
          </div>
        )}
      </motion.div>

      {/* ── RARITY FILTER PILLS ── */}
      {rarities.length > 2 && (
        <motion.div variants={FV.item} style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {rarities.map(r => {
            const rm  = r === "todas" ? null : (RARITY_META[r] || RARITY_META["Común"]);
            const col = rm?.color || SC.orange;
            const on  = filter === r;
            return (
              <motion.button
                key={r} whileTap={{scale:.93}} onClick={() => setFilter(r)}
                style={{
                  padding:"6px 16px", borderRadius:20, cursor:"pointer",
                  background: on ? `${col}18` : `linear-gradient(135deg, rgba(14,21,32,.82), ${classPrimarySoft})`,
                  border:`1px solid ${on ? col+"66" : classPrimaryEdge}`,
                  color: on ? col : SC.mutedL,
                  ...raj(10,700), letterSpacing:".06em",
                  boxShadow: on ? `0 0 10px ${col}22` : `inset 0 1px 0 ${rgbaHex(classPrimary, 0.06)}`,
                  transition:"all .2s",
                }}>
                {r === "todas" ? t("pr.skin.all") : (rm?.label || r.toUpperCase())}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* ── SKIN GRID ── */}
      <motion.div variants={FV.item}
        style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile ? 154 : 168}px,1fr))`, gap:12 }}>
        {filtered.map((sk, i) => (
          <SkinCard
            key={sk.id} sk={sk} index={i}
            isActive={activeSkinL === sk.id}
            owned={ownedSkins.includes(sk.id)}
            skinChanging={skinChanging}
            onEquip={handleEquipSkin}
            classPrimary={classPrimary}
          />
        ))}
      </motion.div>
      </>
      )}

      {/* ── AVATARES DE PERFIL ── */}
      {wardrobePane==="avatars" && (
      <motion.div variants={FV.item} style={{...glass(classSecondary, classSecondarySoft), padding:"22px 24px"}}>
        <TopLine color={classSecondary}/>

        {/* Avatar feedback */}
        <AnimatePresence>
          {avatarFeedback && (
            <motion.div key="avfb"
              initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{
                marginBottom:14, padding:"9px 14px", borderRadius:10,
                background: avatarFeedback.ok ? `${SC.green}12` : `${SC.red}12`,
                border:`1px solid ${avatarFeedback.ok ? SC.green : SC.red}44`,
                color: avatarFeedback.ok ? SC.green : SC.red,
                ...raj(12,600), display:"flex", alignItems:"center", gap:8,
              }}>
              {avatarFeedback.ok ? "✓" : "✕"} {avatarFeedback.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:18}}>
          <div style={{
            width:36, height:36, borderRadius:10,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:`${classSecondarySoft}`, border:`1px solid ${classSecondaryEdge}`,
          }}>
            <img src={wardrobeIcons.avatarsHeader} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:18,height:18,objectFit:"contain"}} />
          </div>
          <div>
            <div style={{...raj(12,700), color:classSecondary, letterSpacing:".08em"}}>{t("pr.avatar.title")}</div>
            <div style={{...raj(11,400), color:SC.muted}}>{t("pr.avatar.hint")}</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
          {describeWardrobeEntry(activeAvatar, "avatar").map((item) => (
            <div
              key={item.label}
              style={{
                padding:"10px 12px",
                borderRadius:14,
                border:`1px solid ${classSecondaryEdge}`,
                background:"rgba(10,14,26,.58)",
              }}
            >
              <div style={{...raj(9,700), color:SC.muted, letterSpacing:".08em", marginBottom:4}}>{item.label}</div>
              <div style={{...raj(11,700), color:SC.white, lineHeight:1.4}}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{...raj(10,500), color:SC.muted, lineHeight:1.5, marginBottom:16}}>
          Sello de equipo: {formatRecentStamp(activeAvatar?.equippedAt || activeAvatar?.updatedAt, "Lectura pendiente")}
        </div>

        <div style={{display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile ? 112 : 120}px,1fr))`, gap:12}}>
          {liveAvatars.map((av, i) => {
            const isActive = activeAvatarL === av.id;
            const owned    = ownedAvatars.includes(av.id);
            const rarC     = RAREZA_AVATAR_COLOR[av.rareza] || SC.muted;
            const isBuying = avatarBuyingId === av.id;
            return (
              <motion.div key={av.id}
                initial={{opacity:0, scale:.88}} animate={{opacity:1, scale:1}}
                transition={{delay:i*.05, type:"spring", stiffness:240, damping:22}}
                whileHover={owned ? {y:-4, scale:1.04} : {}}
                onClick={() => {
                  if (owned && !isActive) handleEquipAvatar(av.id);
                  if (!owned && !isBuying && !avatarChanging) handleBuyAvatarItem(av);
                }}
                style={{
                  position:"relative", borderRadius:14, overflow:"hidden",
                  background: isActive
                    ? `linear-gradient(135deg, ${rgbaHex(classSecondary, 0.18)}, ${av.color}20, rgba(14,21,32,.92))`
                    : owned
                      ? `linear-gradient(135deg, rgba(14,21,32,.84), ${classSecondarySoft})`
                      : "rgba(14,21,32,.82)",
                  border:`1.5px solid ${isActive ? rgbaHex(classSecondary, 0.52) : owned ? rgbaHex(classSecondary, 0.24) : SC.navy+"66"}`,
                  padding:"14px 10px", textAlign:"center",
                  cursor: isBuying ? "progress" : owned && !isActive ? "pointer" : !owned ? "pointer" : "default",
                  boxShadow: isActive
                    ? `0 0 22px ${rgbaHex(classSecondary, 0.2)}, 0 0 30px ${av.color}24`
                    : owned
                      ? `inset 0 1px 0 ${rgbaHex(classSecondary, 0.06)}`
                      : "none",
                  transition:"all .22s",
                }}>
                {(isActive || owned) && <TopLine color={isActive ? classSecondary : rgbaHex(classSecondary, 0.7)}/>}
                {!owned && (
                  <div style={{
                    position:"absolute", inset:0, borderRadius:14, zIndex:2,
                    background:"rgba(10,14,26,.65)", backdropFilter:"blur(3px)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
                  }}>🔒</div>
                )}

                <AvatarThumb id={av.id} color={av.color} size={60} active={isActive}/>

                <div style={{...raj(11,700), color: isActive ? av.color : SC.white, marginBottom:2}}>
                  {av.nombre}
                </div>
                <div style={{...raj(9,600), color:rarC, marginBottom:8, letterSpacing:".05em"}}>
                  {av.rareza}
                </div>

                {isActive ? (
                  <div style={{
                    ...raj(9,700), color:classSecondary,
                    background:`linear-gradient(135deg, ${rgbaHex(classSecondary, 0.18)}, ${av.color}14)`,
                    border:`1px solid ${rgbaHex(classSecondary, 0.34)}`,
                    boxShadow:`0 0 10px ${rgbaHex(classSecondary, 0.14)}`,
                    borderRadius:6, padding:"3px 0",
                  }}>{t("pr.avatar.active_btn")}</div>
                ) : owned ? (
                  <motion.div whileTap={{scale:.92}} style={{
                    ...raj(9,700), color:classSecondary,
                    background:`linear-gradient(135deg, rgba(14,21,32,.9), ${classSecondarySoft})`,
                    border:`1px solid ${classSecondaryEdge}`,
                    boxShadow:`inset 0 1px 0 ${rgbaHex(classSecondary, 0.08)}`,
                    borderRadius:6, padding:"3px 0", cursor:"pointer",
                  }}>
                    {avatarChanging ? "..." : t("pr.avatar.equip")}
                  </motion.div>
                ) : (
                  <div style={{...raj(9,600), color:SC.gold}}>
                    {av.precio === 0 ? t("pr.avatar.free") : `${av.precio.toLocaleString()} 🪙`}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      )}

      {/* ── MARCOS DE PERFIL ── */}
      {wardrobePane==="frames" && (
      <motion.div variants={FV.item} style={{...glass(classPrimary, rgbaHex(classPrimary, 0.08)), padding:"22px 24px"}}>
        <TopLine color={classPrimary}/>

        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:18}}>
          <div style={{
            width:36, height:36, borderRadius:10,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:`${rgbaHex(classPrimary, 0.16)}`, border:`1px solid ${classPrimaryEdge}`,
          }}>
            <img src={wardrobeIcons.framesHeader} alt="" onError={(e)=>{e.currentTarget.style.display="none";}} style={{width:18,height:18,objectFit:"contain"}} />
          </div>
          <div style={{flex:1}}>
            <div style={{...raj(12,700), color:classPrimary, letterSpacing:".08em"}}>{t("pr.frame.title")}</div>
            <div style={{...raj(11,400), color:SC.muted}}>{t("pr.frame.hint")}</div>
          </div>
          {activeFrameL && (
            <motion.button whileHover={{scale:1.04}} whileTap={{scale:.94}}
              onClick={() => handleEquipFrame(null)}
              style={{
                ...raj(10,700), color:classPrimary,
                background:`linear-gradient(135deg, rgba(14,21,32,.92), ${rgbaHex(classPrimary, 0.12)})`,
                border:`1px solid ${classPrimaryEdge}`,
                boxShadow:`0 0 12px ${rgbaHex(classPrimary, 0.12)}`,
                borderRadius:8, padding:"5px 14px", cursor:"pointer",
              }}>
              {t("pr.frame.remove")}
            </motion.button>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
          {describeWardrobeEntry(activeFrame, "frame").map((item) => (
            <div
              key={item.label}
              style={{
                padding:"10px 12px",
                borderRadius:14,
                border:`1px solid ${classPrimaryEdge}`,
                background:"rgba(10,14,26,.58)",
              }}
            >
              <div style={{...raj(9,700), color:SC.muted, letterSpacing:".08em", marginBottom:4}}>{item.label}</div>
              <div style={{...raj(11,700), color:SC.white, lineHeight:1.4}}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{...raj(10,500), color:SC.muted, lineHeight:1.5, marginBottom:16}}>
          Sello de equipo: {formatRecentStamp(activeFrame?.equippedAt || activeFrame?.updatedAt, "Lectura pendiente")}
        </div>

        <div style={{display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile ? 120 : 136}px,1fr))`, gap:12}}>
          {liveFrames.map((fr, i) => {
            const isActive = activeFrameL === fr.id;
            const owned    = ownedFrames.includes(fr.id);
            const rarC     = RAREZA_AVATAR_COLOR[fr.rareza] || SC.muted;
            const isBuying = avatarBuyingId === fr.id;
            return (
              <motion.div key={fr.id}
                initial={{opacity:0, scale:.88}} animate={{opacity:1, scale:1}}
                transition={{delay:i*.06, type:"spring", stiffness:240, damping:22}}
                whileHover={owned ? {y:-4, scale:1.04} : {}}
                onClick={() => {
                  if (owned && !isActive) handleEquipFrame(fr.id);
                  if (!owned && !isBuying && !avatarChanging) handleBuyAvatarItem(fr);
                }}
                style={{
                  position:"relative", borderRadius:14, overflow:"hidden",
                  background: isActive
                    ? `linear-gradient(135deg, ${rgbaHex(classPrimary, 0.16)}, ${fr.color}18, rgba(14,21,32,.92))`
                    : owned
                      ? `linear-gradient(135deg, rgba(14,21,32,.84), ${classPrimarySoft})`
                      : "rgba(14,21,32,.82)",
                  border:`1.5px solid ${isActive ? rgbaHex(classPrimary, 0.5) : owned ? rgbaHex(classPrimary, 0.24) : SC.navy+"66"}`,
                  padding:"16px 10px", textAlign:"center",
                  cursor: isBuying ? "progress" : owned && !isActive ? "pointer" : !owned ? "pointer" : "default",
                  boxShadow: isActive
                    ? `0 0 22px ${rgbaHex(classPrimary, 0.18)}, 0 0 28px ${fr.color}22`
                    : owned
                      ? `inset 0 1px 0 ${rgbaHex(classPrimary, 0.06)}`
                      : "none",
                  transition:"all .22s",
                }}>
                {(isActive || owned) && <TopLine color={isActive ? classPrimary : rgbaHex(classPrimary, 0.68)}/>}
                {!owned && (
                  <div style={{
                    position:"absolute", inset:0, borderRadius:14, zIndex:2,
                    background:"rgba(10,14,26,.65)", backdropFilter:"blur(3px)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
                  }}>🔒</div>
                )}

                <div style={{
                  margin:"0 auto 12px", position:"relative",
                  width:76, height:76,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <div style={{
                    position:"absolute", inset:13, borderRadius:"50%",
                    background:"linear-gradient(135deg,#141A2A,#0A0E1A)",
                  }}/>
                  <FrameOverlay
                    frameId={fr.id}
                    fallbackGradient={fr.gradient}
                    fallbackAnimated={fr.animated}
                    outerSize={76}
                    avatarSize={50}
                  />
                </div>

                <div style={{...raj(11,700), color: isActive ? fr.color : SC.white, marginBottom:2}}>
                  {fr.nombre}
                </div>
                <div style={{...raj(9,600), color:rarC, marginBottom:8, letterSpacing:".05em"}}>
                  {fr.rareza}
                </div>

                {isActive ? (
                  <div style={{
                    ...raj(9,700), color:classPrimary,
                    background:`linear-gradient(135deg, ${rgbaHex(classPrimary, 0.18)}, ${fr.color}14)`,
                    border:`1px solid ${rgbaHex(classPrimary, 0.34)}`,
                    boxShadow:`0 0 10px ${rgbaHex(classPrimary, 0.14)}`,
                    borderRadius:6, padding:"3px 0",
                  }}>{t("pr.frame.active_btn")}</div>
                ) : owned ? (
                  <div style={{
                    ...raj(9,700), color:classPrimary,
                    background:`linear-gradient(135deg, rgba(14,21,32,.9), ${classPrimarySoft})`,
                    border:`1px solid ${classPrimaryEdge}`,
                    boxShadow:`inset 0 1px 0 ${rgbaHex(classPrimary, 0.08)}`,
                    borderRadius:6, padding:"3px 0", cursor:"pointer",
                  }}>
                    {avatarChanging ? "..." : t("pr.frame.equip")}
                  </div>
                ) : (
                  <div style={{...raj(9,600), color:SC.gold}}>
                    {`${fr.precio.toLocaleString()} 🪙`}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      )}

    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: SEGURIDAD — email verification + inline validation + toast
// ══════════════════════════════════════════════════════════════
function TabSeguridad({stats, showToast, onLogout}) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const [securityPane, setSecurityPane] = useScopedStorageState("fv-profile-security-pane-v1", "cuenta");

  // ─ Password ──────────────────────────────────────────────────
  const [pwForm,    setPwForm]    = useState({actual:"",nueva:"",confirmar:""});
  const [pwErrors,  setPwErrors]  = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDirty,   setPwDirty]   = useState(new Set());
  const [pwShake,   setPwShake]   = useState(false);
  const [pwPhase,   setPwPhase]   = useState("idle");

  // ─ Email change ──────────────────────────────────────────────
  const [emailOpen,    setEmailOpen]    = useState(false);
  const [emailPhase,   setEmailPhase]   = useState("form");
  const [emailForm,    setEmailForm]    = useState({nuevo:"",password:""});
  const [emailErrors,  setEmailErrors]  = useState({});
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDirty,   setEmailDirty]   = useState(new Set());
  const [emailStatus,  setEmailStatus]  = useState(stats.pendingEmailStatus || "idle");
  const [pendingEmailTarget, setPendingEmailTarget] = useState(stats.pendingEmailTarget || "");

  // ─ Danger zone ───────────────────────────────────────────────
  const [showDanger,    setShowDanger]    = useState(false);
  const [deleteTyped,   setDeleteTyped]   = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState("");
  const currentUser = auth.currentUser;
  const providerIds = currentUser?.providerData?.map((provider) => provider.providerId).filter(Boolean) || [];
  const usesPasswordReauth = providerIds.includes("password") || providerIds.length === 0;
  const canUsePasswordFlow = usesPasswordReauth && Boolean(currentUser?.email);
  const providerLabel = providerIds.length ? providerIds.map(getReadableProvider).join(" + ") : "Correo y clave";
  const accountAuditRows = [
    { label:"Proveedor", value:providerLabel, icon:"link" },
    { label:"Correo", value:currentUser?.emailVerified ? "Verificado" : "Pendiente", icon:"mail" },
    { label:"Ultimo acceso", value:formatRecentStamp(currentUser?.metadata?.lastSignInTime || stats.updatedAt), icon:"time" },
    {
      label:"Cambio pendiente",
      value:pendingEmailTarget ? pendingEmailTarget : (emailStatus === "sent" ? "Revision enviada" : "Sin cambios"),
      icon:"inbox",
    },
  ];

  useEffect(() => {
    setPendingEmailTarget(stats.pendingEmailTarget || "");
    setEmailStatus((current) => {
      if (current === "reauth" || current === "sending") return current;
      return stats.pendingEmailStatus || "idle";
    });
  }, [stats.pendingEmailStatus, stats.pendingEmailTarget]);

  const reauthenticateActiveUser = useCallback(async (passwordValue = "") => {
    const user = auth.currentUser;
    if (!user) throw new Error("Sin sesion activa");

    if (canUsePasswordFlow) {
      if (!user.email) throw new Error("Tu cuenta no tiene correo disponible para validar identidad.");
      if (!passwordValue) throw new Error("Escribe tu clave actual para confirmar.");
      const credential = EmailAuthProvider.credential(user.email, passwordValue);
      await reauthenticateWithCredential(user, credential);
      return auth.currentUser || user;
    }

    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    await reauthenticateWithPopup(user, googleProvider);
    return auth.currentUser || user;
  }, [canUsePasswordFlow]);

  const syncPendingEmailState = useCallback(async ({
    target = "",
    status = "idle",
    requestedAt = "",
    resolvedAt = "",
  }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Sin sesión activa");
    const token = await user.getIdToken();
    await updateProfile(token, {
      pendingEmailTarget: target,
      pendingEmailStatus: status,
      pendingEmailRequestedAt: requestedAt,
      pendingEmailResolvedAt: resolvedAt,
    });
    window.dispatchEvent(new CustomEvent("profileSecurityUpdated", {
      detail: {
        pendingEmailTarget: target,
        pendingEmailStatus: status,
        pendingEmailRequestedAt: requestedAt,
        pendingEmailResolvedAt: resolvedAt,
        ts: Date.now(),
      },
    }));
  }, []);

  useEffect(() => {
    const currentEmail = String(currentUser?.email || "").trim().toLowerCase();
    const pendingEmail = String(stats.pendingEmailTarget || "").trim().toLowerCase();
    if (!currentEmail || !pendingEmail || currentEmail !== pendingEmail) return;

    setPendingEmailTarget("");
    setEmailStatus("idle");
    syncPendingEmailState({
      target: "",
      status: "idle",
      requestedAt: "",
      resolvedAt: new Date().toISOString(),
    }).catch(() => {});
  }, [currentUser?.email, stats.pendingEmailTarget, syncPendingEmailState]);

  const handleDeleteAccount = async () => {
    if (deleteTyped !== stats.username || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const user = await reauthenticateActiveUser(deletePassword);
      const token = await user.getIdToken();
      await deleteProfile(token, stats.username);
      showToast?.({ ok: true, message: t("pr.toast.account_deleted") });
      setTimeout(() => onLogout?.(), 2000);
    } catch (err) {
      setDeleteError(err.message || "No pudimos validar la identidad para eliminar la cuenta.");
      showToast?.({ ok: false, message: t("pr.toast.delete_error"), sub: err.message });
      setDeleteLoading(false);
    }
  };

  // ── Password helpers ──────────────────────────────────────────
  const validatePwField = (k, v) => {
    if (k==="actual")    return { actual:    canUsePasswordFlow && !v ? t("pr.val.pw_required") : null };
    if (k==="nueva")     return { nueva:     !v||v.length<6 ? t("pr.val.pw_min") : null };
    if (k==="confirmar") return { confirmar: v!==pwForm.nueva ? t("pr.val.pw_mismatch") : null };
    return {};
  };
  const setPw = (k, v) => {
    setPwForm(f=>({...f,[k]:v}));
    if (pwDirty.has(k)) {
      const check = k==="confirmar"
        ? { confirmar: v!==pwForm.nueva ? t("pr.val.pw_mismatch") : null }
        : validatePwField(k, v);
      setPwErrors(prev=>({...prev,...check}));
    }
  };
  const touchPw = (k) => {
    setPwDirty(prev=>new Set([...prev,k]));
    setPwErrors(prev=>({...prev,...validatePwField(k, pwForm[k])}));
  };
  const validatePw = () => {
    const e = {};
    if (canUsePasswordFlow && !pwForm.actual) e.actual    = t("pr.val.pw_required");
    if (!pwForm.nueva||pwForm.nueva.length<6) e.nueva     = t("pr.val.pw_min");
    if (pwForm.nueva !== pwForm.confirmar)    e.confirmar = t("pr.val.pw_mismatch");
    return e;
  };
  const savePw = async () => {
    setPwDirty(new Set(canUsePasswordFlow ? ["actual","nueva","confirmar"] : ["nueva","confirmar"]));
    const e = validatePw();
    if (Object.values(e).some(Boolean)) {
      setPwErrors(e); setPwShake(true); setTimeout(()=>setPwShake(false),500); return;
    }
    setPwLoading(true); setPwErrors({});
    setPwPhase("reauth");
    try {
      const user = await reauthenticateActiveUser(pwForm.actual);
      setPwPhase("updating");
      await updatePassword(user, pwForm.nueva);
      await user.reload().catch(() => {});
      window.dispatchEvent(new CustomEvent("profileSecurityUpdated", {
        detail: {
          passwordUpdatedAt: new Date().toISOString(),
          ts: Date.now(),
        },
      }));
      setPwForm({actual:"",nueva:"",confirmar:""});
      setPwDirty(new Set());
      setPwPhase("done");
      showToast?.({ ok:true, message:t("pr.toast.pw_updated") });
    } catch(err) {
      const msg = err.code==="auth/wrong-password"||err.code==="auth/invalid-credential"
        ? t("pr.val.pw_wrong")
        : err.code==="auth/too-many-requests"
          ? t("pr.val.too_many_requests")
          : err.message || t("pr.toast.pw_error");
      setPwErrors({general:msg});
      setPwShake(true); setTimeout(()=>setPwShake(false),500);
      setPwPhase("idle");
      showToast?.({ ok:false, message:t("pr.toast.pw_error"), sub:msg });
    } finally {
      setPwLoading(false);
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Email helpers ─────────────────────────────────────────────
  const validateEmailField = (k, v) => {
    if (k==="nuevo")    return { nuevo:    !v||!/\S+@\S+\.\S+/.test(v) ? t("pr.val.email_invalid") : null };
    if (k==="password") return { password: canUsePasswordFlow && !v ? t("pr.val.pw_required") : null };
    return {};
  };
  const setEmailF = (k, v) => {
    setEmailForm(f=>({...f,[k]:v}));
    if (emailDirty.has(k)) setEmailErrors(prev=>({...prev,...validateEmailField(k,v)}));
  };
  const touchEmail = (k) => {
    setEmailDirty(prev=>new Set([...prev,k]));
    setEmailErrors(prev=>({...prev,...validateEmailField(k,emailForm[k])}));
  };
  const handleEmailChange = async () => {
    setEmailDirty(new Set(canUsePasswordFlow ? ["nuevo","password"] : ["nuevo"]));
    const e = {};
    if (!emailForm.nuevo||!/\S+@\S+\.\S+/.test(emailForm.nuevo)) e.nuevo = t("pr.val.email_invalid");
    if (canUsePasswordFlow && !emailForm.password) e.password = t("pr.val.pw_required");
    if (Object.values(e).some(Boolean)) { setEmailErrors(e); return; }
    setEmailLoading(true); setEmailErrors({});
    setEmailStatus("reauth");
    try {
      const user = await reauthenticateActiveUser(emailForm.password);
      setEmailStatus("sending");
      await verifyBeforeUpdateEmail(user, emailForm.nuevo);
      const normalizedTarget = emailForm.nuevo.trim().toLowerCase();
      await syncPendingEmailState({
        target: normalizedTarget,
        status: "sent",
        requestedAt: new Date().toISOString(),
        resolvedAt: "",
      });
      setPendingEmailTarget(normalizedTarget);
      setEmailPhase("sent");
      setEmailStatus("sent");
      setEmailForm({nuevo:"",password:""});
      setEmailDirty(new Set());
    } catch(err) {
      const msg = err.code==="auth/wrong-password"||err.code==="auth/invalid-credential"
        ? t("pr.val.pw_wrong")
        : err.code==="auth/email-already-in-use"
          ? t("pr.val.email_taken")
          : err.code==="auth/invalid-email"
            ? t("pr.val.email_format")
            : err.message || t("pr.toast.email_error");
      setEmailErrors({general:msg});
      setEmailStatus("idle");
      showToast?.({ ok:false, message:t("pr.toast.email_error"), sub:msg });
    } finally {
      setEmailLoading(false);
    }
  };

  const pwStrength = pwForm.nueva.length===0?0:pwForm.nueva.length<6?1:pwForm.nueva.length<8?2:pwForm.nueva.length<10?3:4;
  const strengthMeta = [null,
    {label:t("pr.sec.pw_weak"),   c:SC.red},
    {label:t("pr.sec.pw_medium"), c:SC.orange},
    {label:t("pr.sec.pw_good"),   c:SC.gold},
    {label:t("pr.sec.pw_strong"), c:SC.green},
  ];

  const FV = {
    wrap: { hidden:{}, show:{ transition:{ staggerChildren:.07 } } },
    card: { hidden:{ opacity:0, y:18 }, show:{ opacity:1, y:0, transition:{ type:"spring", stiffness:240, damping:22 } } },
    row:  { hidden:{ opacity:0, x:-10 }, show:{ opacity:1, x:0, transition:{ duration:.3 } } },
  };

  const glass = (accent = SC.navy) => ({
    position:"relative", overflow:"hidden",
    background:"rgba(14,21,32,0.90)",
    backdropFilter:"blur(18px)",
    WebkitBackdropFilter:"blur(18px)",
    border:`1px solid ${accent}44`,
    borderRadius:20,
    boxShadow:`0 4px 28px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04)`,
  });

  const TopLine = ({color}) => (
    <div style={{
      position:"absolute", top:0, left:0, right:0, height:1,
      background:`linear-gradient(90deg,transparent,${color}aa,transparent)`,
      pointerEvents:"none",
    }}/>
  );

  const SectionIcon = ({color, children}) => (
    <div style={{
      width:34, height:34, borderRadius:10, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:`${color}16`, border:`1px solid ${color}33`,
    }}>{children}</div>
  );

  const DANGER = SC.red;

  return (
    <motion.div variants={FV.wrap} initial="hidden" animate="show"
      style={{display:"flex", flexDirection:"column", gap:14}}>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
        {[
          { id:"cuenta", eyebrow:"Cuenta", title:"Correo y estado de sesión", note:"La capa de cuenta queda separada del cambio de clave.", glow:SC.blue },
          { id:"acceso", eyebrow:"Acceso", title:"Clave y validación", note:"La seguridad de entrada vive en su propio módulo.", glow:SC.orange },
          { id:"peligro", eyebrow:"Zona final", title:"Eliminar cuenta", note:"La accion irreversible se aísla para no mezclarla con cambios normales.", glow:DANGER },
        ].map((pane) => {
          const active = securityPane === pane.id;
          return (
            <button
              key={pane.id}
              onClick={() => setSecurityPane(pane.id)}
              style={{
                textAlign:"left",
                padding:"15px 16px 14px",
                borderRadius:18,
                border:`1px solid ${active ? pane.glow : "rgba(160,140,220,.18)"}`,
                background:active ? `linear-gradient(135deg, ${pane.glow}22, rgba(14,21,32,.92))` : "rgba(14,21,32,.78)",
                boxShadow:active ? `0 12px 24px ${pane.glow}18` : "0 8px 16px rgba(0,0,0,.18)",
                cursor:"pointer",
              }}
            >
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:active ? pane.glow : SC.muted,marginBottom:8}}>
                {pane.eyebrow}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:20,fontWeight:800,lineHeight:1.04,color:SC.white,letterSpacing:"-.03em",marginBottom:7}}>
                {pane.title}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.6,color:SC.mutedL}}>
                {pane.note}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── TOP GRID: account info (wide) + session (narrow) ── */}
      {securityPane==="cuenta" && (
      <>
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
        gap:14, alignItems:"start",
      }}>

        {/* Account info */}
        <motion.div variants={FV.card} style={{...glass(SC.blue), padding:"22px 24px"}}>
          <TopLine color={SC.blue}/>

          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18}}>
            <SectionIcon color={SC.blue}><Shield size={16} color={SC.blue}/></SectionIcon>
            <div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
                color:SC.blue, letterSpacing:".08em"}}>{t("pr.sec.account_info")}</div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:400,
                color:SC.muted}}>{t("pr.sec.account_sub")}</div>
            </div>
          </div>

          {/* Email row */}
          <motion.div variants={FV.row} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 14px", marginBottom:6,
            background:`${SC.navy}44`, borderRadius:12, border:`1px solid ${SC.navy}`,
          }}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <span style={{fontSize:14}}>📧</span>
              <div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                  color:SC.muted, letterSpacing:".07em"}}>{t("pr.sec.email_label")}</div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600,
                  color:SC.white}}>{stats.email||"—"}</div>
              </div>
            </div>
            <motion.button whileHover={{scale:1.05}} whileTap={{scale:.94}}
              onClick={()=>{setEmailOpen(o=>!o);setEmailPhase("form");setEmailStatus("idle");setEmailErrors({});}}
              style={{
                display:"flex", alignItems:"center", gap:5,
                fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700, letterSpacing:".05em",
                color:SC.blue, background:`${SC.blue}16`, border:`1px solid ${SC.blue}33`,
                borderRadius:8, padding:"5px 11px", cursor:"pointer",
              }}>
              <Edit2 size={10}/> {emailOpen ? t("pr.sec.close") : t("pr.sec.change")}
            </motion.button>
          </motion.div>

          {/* Stat rows */}
          {[
            {label:t("pr.sec.member_since"), value:stats.createdAt||"—", icon:"📅"},
            {label:t("pr.sec.role"),         value:t("pr.sec.role_user"), icon:"🛡️"},
            {label:t("pr.sec.current_level"),value:`${t("pr.sec.level_val_pre")} ${stats.nivel||1}`, icon:"⭐"},
            {label:t("pr.sec.xp_total"),     value:`${(stats.xpTotal||0).toLocaleString()} XP`, icon:"⚡"},
            ...accountAuditRows,
          ].map((f,i,arr)=>(
            <motion.div key={i} variants={FV.row}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"11px 14px", marginBottom:i<arr.length-1?5:0,
                background:`${SC.navy}28`, borderRadius:10,
                border:`1px solid ${SC.navy}55`,
              }}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <span style={{fontSize:13}}>{f.icon}</span>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                  color:SC.muted, letterSpacing:".07em"}}>{f.label}</div>
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:700,
                color:SC.white}}>{f.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Session status */}
        <motion.div variants={FV.card} style={{...glass(SC.green), padding:"22px 20px"}}>
          <TopLine color={SC.green}/>
          <div style={{
            position:"absolute", top:"-30%", right:"-10%",
            width:"60%", height:"200%",
            background:`radial-gradient(ellipse,${SC.green}0e,transparent 65%)`,
            filter:"blur(40px)", pointerEvents:"none",
          }}/>

          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18, position:"relative"}}>
            <SectionIcon color={SC.green}><span style={{fontSize:15}}>PC</span></SectionIcon>
            <div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
                color:SC.green, letterSpacing:".08em"}}>{t("pr.sec.session")}</div>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:400,
                color:SC.muted}}>{t("pr.sec.device_connected")}</div>
            </div>
          </div>

          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            background:`${SC.green}08`, border:`1px solid ${SC.green}22`,
            borderRadius:14, padding:"22px 16px", textAlign:"center",
            position:"relative",
          }}>
            {/* pulse dot */}
            <div style={{position:"relative", width:14, height:14, marginBottom:14}}>
              <motion.div
                animate={{scale:[1,2.2,1], opacity:[0.7,0,0.7]}}
                transition={{duration:1.8, repeat:Infinity, ease:"easeInOut"}}
                style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  background:SC.green, opacity:.4,
                }}/>
              <div style={{
                position:"absolute", inset:2, borderRadius:"50%",
                background:SC.green,
                boxShadow:`0 0 10px ${SC.green}`,
              }}/>
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:800,
              color:SC.green, letterSpacing:".08em", marginBottom:6}}>ONLINE</div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
              color:SC.white, marginBottom:4}}>{t("pr.sec.device_current")}</div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:400,
              color:SC.muted, lineHeight:1.5}}>
              {stats.email}
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:600,
              color:"rgba(240,244,255,.82)", marginTop:8}}>
              {providerLabel}
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:500,
              color:SC.muted, marginTop:4, lineHeight:1.5}}>
              Ultimo acceso: {formatRecentStamp(currentUser?.metadata?.lastSignInTime || stats.updatedAt)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── EMAIL CHANGE PANEL ── */}
      <AnimatePresence>
        {emailOpen && (
          <motion.div key="email-panel"
            initial={{opacity:0,y:-10,scale:.98}} animate={{opacity:1,y:0,scale:1}}
            exit={{opacity:0,y:-8,scale:.98}} transition={{duration:.28}}
            style={{...glass(SC.blue), padding:"22px 24px"}}>
            <TopLine color={SC.blue}/>

            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18}}>
              <SectionIcon color={SC.blue}><span style={{fontSize:15}}>📧</span></SectionIcon>
              <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
                color:SC.blue, letterSpacing:".08em"}}>{t("pr.sec.change_email")}</div>
            </div>

            <AnimatePresence mode="wait">
              {emailPhase==="sent" ? (
                <motion.div key="sent"
                  initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  style={{textAlign:"center", padding:"10px 0 4px"}}>
                  <motion.div
                    animate={{y:[0,-8,0]}} transition={{duration:2.5, repeat:Infinity, ease:"easeInOut"}}
                    style={{fontSize:52, marginBottom:16}}>📨</motion.div>
                  <div style={{fontFamily:"'Manrope',sans-serif", fontSize:15, fontWeight:700,
                    color:SC.white, marginBottom:8}}>{t("pr.sec.email_sent_title")}</div>
                  <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:400,
                    color:SC.muted, lineHeight:1.7, maxWidth:320, margin:"0 auto 22px"}}>
                    {t("pr.sec.email_sent_desc")}
                  </div>
                  <motion.button whileHover={{scale:1.04}} whileTap={{scale:.95}}
                    onClick={()=>{setEmailOpen(false);setEmailPhase("form");setEmailStatus("idle");}}
                    style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:700,
                      color:SC.bg,
                      background:`linear-gradient(135deg,${SC.blue},${SC.blue}cc)`,
                      border:"none", borderRadius:12, padding:"11px 26px", cursor:"pointer",
                      display:"inline-flex", alignItems:"center", gap:8,
                      boxShadow:`0 4px 18px ${SC.blue}44`,
                    }}>
                    <Check size={13}/> {t("pr.sec.understood")}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                  <AnimatePresence>
                    {emailErrors.general && (
                      <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                        style={{
                          display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                          background:`${SC.red}12`, border:`1px solid ${SC.red}33`, borderRadius:10,
                          fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
                          color:SC.red, marginBottom:14,
                        }}>
                        <AlertTriangle size={13}/> {emailErrors.general}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div style={{
                    fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:400,
                    color:SC.mutedL, marginBottom:16, lineHeight:1.6,
                    background:`${SC.blue}0a`, border:`1px solid ${SC.blue}22`,
                    borderRadius:10, padding:"10px 14px",
                  }}>
                    {t("pr.sec.email_hint")}
                  </div>
                  {emailStatus !== "idle" && (
                    <div style={{
                      display:"flex", alignItems:"center", gap:8, marginBottom:14,
                      fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
                      color:SC.blue, background:`${SC.blue}10`, border:`1px solid ${SC.blue}26`,
                      borderRadius:10, padding:"9px 12px",
                    }}>
                      {emailStatus === "reauth" && <><Spinner color={SC.blue}/> Verificando credenciales actuales...</>}
                      {emailStatus === "sending" && <><Spinner color={SC.blue}/> Enviando correo de verificación...</>}
                      {emailStatus === "sent" && <><Check size={13}/> Correo enviado. Queda pendiente de confirmar desde tu bandeja.</>}
                    </div>
                  )}
                  <EInput label={t("pr.sec.new_email")} type="email" value={emailForm.nuevo}
                    onChange={v=>setEmailF("nuevo",v)} onBlur={()=>touchEmail("nuevo")}
                    placeholder="nuevo@email.com"
                    error={emailDirty.has("nuevo")?emailErrors.nuevo:null}/>
                  <EInput label={t("pr.sec.current_pw")} type="password"
                    value={emailForm.password}
                    onChange={v=>setEmailF("password",v)} onBlur={()=>touchEmail("password")}
                    placeholder="••••••••"
                    hint={t("pr.sec.identity_hint")}
                    error={emailDirty.has("password")?emailErrors.password:null}/>
                  <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:4}}>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:.96}}
                      onClick={()=>{setEmailOpen(false);setEmailErrors({});setEmailDirty(new Set());setEmailStatus("idle");}}
                      aria-label="Cancelar cambio de correo"
                      style={{
                        fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600, color:SC.muted,
                        background:`${SC.navy}88`, border:`1px solid ${SC.navy}`,
                        borderRadius:10, padding:"10px 16px", cursor:"pointer",
                      }}>
                      {t("pr.sec.cancel")}
                    </motion.button>
                    <motion.button whileHover={{scale:1.03}} whileTap={{scale:.95}}
                      onClick={handleEmailChange} disabled={emailLoading}
                      aria-label="Enviar correo de verificación para cambiar correo"
                      style={{
                        fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700,
                        color:emailLoading?SC.muted:SC.bg,
                        background:emailLoading?`${SC.blue}28`:`linear-gradient(135deg,${SC.blue},${SC.blue}cc)`,
                        border:`1px solid ${SC.blue}44`, borderRadius:10,
                        padding:"10px 20px", cursor:emailLoading?"not-allowed":"pointer",
                        display:"flex", alignItems:"center", gap:8,
                        boxShadow:emailLoading?"none":`0 4px 18px ${SC.blue}33`,
                        transition:"all .2s",
                      }}>
                      {emailLoading
                        ? <><Spinner color={SC.blue}/> {t("pr.sec.sending")}</>
                        : <><Shield size={13}/> {t("pr.sec.send_verify")}</>}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}

      {/* ── CAMBIAR CONTRASEÑA ── */}
      {securityPane==="acceso" && (
      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile ? "1fr" : "minmax(0,1.25fr) 320px",
        gap:14,
        alignItems:"start",
      }}>
      <motion.div variants={FV.card}
        className={pwShake?"up-shake":""}
        style={{...glass(SC.orange), padding:"22px 24px"}}>
        <TopLine color={SC.orange}/>

        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:18}}>
          <SectionIcon color={SC.orange}><Lock size={16} color={SC.orange}/></SectionIcon>
          <div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
              color:SC.orange, letterSpacing:".08em"}}>{t("pr.sec.change_pw_title")}</div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:400,
              color:SC.muted}}>{t("pr.sec.change_pw_sub")}</div>
          </div>
        </div>

        <AnimatePresence>
          {pwErrors.general && (
            <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                background:`${SC.red}12`, border:`1px solid ${SC.red}33`, borderRadius:10,
                fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
                color:SC.red, marginBottom:14,
              }}>
              <AlertTriangle size={13}/> {pwErrors.general}
            </motion.div>
          )}
        </AnimatePresence>

        {pwPhase !== "idle" && (
          <div style={{
            display:"flex", alignItems:"center", gap:8, marginBottom:14,
            fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
            color:SC.orange, background:`${SC.orange}10`, border:`1px solid ${SC.orange}26`,
            borderRadius:10, padding:"9px 12px",
          }}>
            {pwPhase === "reauth" && <><Spinner color={SC.orange}/> Verificando credenciales actuales...</>}
            {pwPhase === "updating" && <><Spinner color={SC.orange}/> Aplicando nueva clave al perfil...</>}
            {pwPhase === "done" && <><Check size={13}/> Clave actualizada y sincronizada.</>}
          </div>
        )}

        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap:"0 20px",
        }}>
          <EInput label={t("pr.sec.current_pw")} type="password" value={pwForm.actual}
            onChange={v=>setPw("actual",v)} onBlur={()=>touchPw("actual")}
            placeholder="••••••••"
            error={pwDirty.has("actual")?pwErrors.actual:null}/>
          <div/>
          <EInput label={t("pr.sec.new_pw")} type="password" value={pwForm.nueva}
            onChange={v=>setPw("nueva",v)} onBlur={()=>touchPw("nueva")}
            placeholder={t("pr.sec.new_pw_placeholder")}
            error={pwDirty.has("nueva")?pwErrors.nueva:null}/>
          <EInput label={t("pr.sec.confirm_pw")} type="password" value={pwForm.confirmar}
            onChange={v=>setPw("confirmar",v)} onBlur={()=>touchPw("confirmar")}
            placeholder={t("pr.sec.confirm_pw_placeholder")}
            error={pwDirty.has("confirmar")?pwErrors.confirmar:null}/>
        </div>

        {/* Password strength meter */}
        <AnimatePresence>
          {pwForm.nueva.length>0 && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
              exit={{opacity:0,height:0}} style={{marginBottom:16, overflow:"hidden"}}>
              <div style={{display:"flex", gap:5, marginBottom:7}}>
                {[1,2,3,4].map(i=>(
                  <div key={i} style={{flex:1, height:4, borderRadius:4, overflow:"hidden",
                    background:`${SC.navy}`}}>
                    <motion.div
                      initial={{width:0}} animate={{width:i<=pwStrength?"100%":"0%"}}
                      transition={{duration:.3, delay:i*.05}}
                      style={{
                        height:"100%",
                        background:i<=pwStrength
                          ?`linear-gradient(90deg,${strengthMeta[pwStrength]?.c},${strengthMeta[pwStrength]?.c}bb)`
                          :"transparent",
                        boxShadow:i<=pwStrength?`0 0 6px ${strengthMeta[pwStrength]?.c}88`:"none",
                      }}/>
                  </div>
                ))}
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8,
                fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:600,
                color:strengthMeta[pwStrength]?.c||SC.muted}}>
                <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                  background:strengthMeta[pwStrength]?.c||SC.muted,
                  boxShadow:`0 0 4px ${strengthMeta[pwStrength]?.c}88`}}/>
                {strengthMeta[pwStrength]?.label||""}
                {pwStrength>=3 && (
                  <span style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:400,
                    color:SC.muted}}>{t("pr.sec.pw_ok")}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{display:"flex", justifyContent:"flex-end", marginTop:4}}>
          <motion.button whileHover={{scale:1.03, boxShadow:`0 6px 28px ${SC.orange}44`}}
            whileTap={{scale:.95}}
            onClick={savePw} disabled={pwLoading}
            aria-label="Guardar nueva contraseña"
            style={{
              fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700,
              color:pwLoading?SC.muted:SC.bg,
              background:pwLoading?`${SC.orange}28`:`linear-gradient(135deg,${SC.orange},${SC.gold})`,
              border:`1px solid ${SC.orange}44`, borderRadius:12,
              padding:"12px 26px", cursor:pwLoading?"not-allowed":"pointer",
              boxShadow:pwLoading?"none":`0 4px 20px ${SC.orange}33`,
              display:"flex", alignItems:"center", gap:10, transition:"all .25s",
            }}>
            {pwLoading
              ? <><Spinner color={SC.orange}/> {t("pr.sec.saving")}</>
              : <><Lock size={14}/> {t("pr.sec.change_pw_title")}</>}
          </motion.button>
        </div>
      </motion.div>
      <motion.aside variants={FV.card} style={{
        ...glass(SC.orange),
        padding:"18px 18px 16px",
        position:isMobile ? "relative" : "sticky",
        top:isMobile ? "auto" : 14,
      }}>
        <TopLine color={SC.orange}/>
        <div style={{display:"grid",gap:12}}>
          <div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:SC.orange,marginBottom:8}}>
              Panel de acceso
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:22,fontWeight:800,lineHeight:1.05,color:"#fff",marginBottom:8}}>
              Cambio de clave
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.65,color:SC.mutedL}}>
              Este lateral deja a mano el estado de la clave, la validacion requerida y la fuerza de la nueva entrada.
            </div>
          </div>
          {[
            { label:"Estado", value:pwPhase === "done" ? "Clave aplicada" : pwLoading ? "Actualizando acceso" : "Pendiente", glow:pwPhase === "done" ? SC.green : SC.orange },
            { label:"Validacion", value:canUsePasswordFlow ? "Clave actual obligatoria" : "Confirmacion con Google", glow:canUsePasswordFlow ? SC.orange : SC.blue },
            { label:"Fortaleza", value:strengthMeta[pwStrength]?.label || "Sin nueva clave", glow:strengthMeta[pwStrength]?.c || SC.muted },
          ].map((item) => (
            <div key={item.label} style={{
              padding:"11px 12px",
              borderRadius:14,
              border:`1px solid ${item.glow}26`,
              background:"rgba(10,14,26,.58)",
            }}>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:SC.muted,marginBottom:5}}>
                {item.label}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:15,fontWeight:800,color:item.glow}}>
                {item.value}
              </div>
            </div>
          ))}
          <div style={{
            padding:"12px 12px 10px",
            borderRadius:14,
            border:`1px solid ${SC.orange}26`,
            background:`${SC.orange}10`,
          }}>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:SC.orange,marginBottom:6}}>
              Nota rápida
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.65,color:"rgba(231,224,242,.8)"}}>
              Si vienes con Google, este bloque sigue informando el estado del módulo aunque la reautenticación final viaje por el proveedor.
            </div>
          </div>
        </div>
      </motion.aside>
      </div>
      )}

      {/* ── ZONA DE PELIGRO ── */}
      {securityPane==="peligro" && (
      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile ? "1fr" : "minmax(0,1.2fr) 320px",
        gap:14,
        alignItems:"start",
      }}>
      <motion.div variants={FV.card}
        style={{...glass(DANGER), padding:"22px 24px"}}>
        <TopLine color={DANGER}/>

        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
          <SectionIcon color={DANGER}><AlertTriangle size={16} color={DANGER}/></SectionIcon>
          <div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
              color:DANGER, letterSpacing:".08em"}}>{t("pr.sec.danger_zone")}</div>
            <div style={{fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:400,
              color:SC.muted}}>{t("pr.sec.danger_sub")}</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showDanger ? (
            <motion.div key="btn" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <div style={{
                fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:400,
                color:SC.muted, marginBottom:14, lineHeight:1.6,
                padding:"10px 14px", background:`${DANGER}08`,
                borderRadius:10, border:`1px solid ${DANGER}22`,
              }}>
                {t("pr.sec.delete_warning")}
              </div>
              <motion.button whileHover={{scale:1.02, background:`${DANGER}16`}} whileTap={{scale:.96}}
                onClick={()=>setShowDanger(true)}
                aria-label="Abrir confirmación para eliminar cuenta"
                style={{
                  fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600,
                  color:DANGER, background:`${DANGER}0a`,
                  border:`1px solid ${DANGER}44`, borderRadius:11,
                  padding:"11px 20px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8, transition:"all .2s",
                }}>
                <AlertTriangle size={14}/> {t("pr.sec.delete_btn")}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="confirm"
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
              <div style={{background:`${DANGER}0a`, border:`1px solid ${DANGER}33`,
                borderRadius:14, padding:"18px 18px 14px"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                  <AlertTriangle size={16} color={DANGER}/>
                  <div style={{fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:700,
                    color:DANGER}}>{t("pr.sec.permanent_title")}</div>
                </div>
                <div style={{fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:400,
                  color:SC.muted, marginBottom:16, lineHeight:1.6}}>
                  {t("pr.sec.delete_desc")}
                </div>

                <div style={{marginBottom:14}}>
                  <label style={{display:"block",
                    fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700,
                    color:SC.muted, letterSpacing:".07em", marginBottom:7}}>
                    {t("pr.sec.delete_type_pre")}{" "}
                    <span style={{color:DANGER}}>{stats.username}</span>
                    {" "}{t("pr.sec.delete_type_suf")}
                  </label>
                  <div style={{position:"relative"}}>
                    <input value={deleteTyped} onChange={e=>setDeleteTyped(e.target.value)}
                      placeholder={stats.username}
                      style={{
                        width:"100%", padding:"11px 14px",
                        background:`${SC.navy}22`,
                        border:`1.5px solid ${deleteTyped===stats.username?DANGER:SC.navy}`,
                        borderRadius:10, color:SC.white,
                        fontFamily:"'Manrope',sans-serif", fontSize:14, fontWeight:600,
                        outline:"none", boxSizing:"border-box",
                        boxShadow:deleteTyped===stats.username?`0 0 0 3px ${DANGER}22`:"none",
                        transition:"border-color .2s, box-shadow .2s",
                      }}/>
                    {deleteTyped===stats.username && (
                      <motion.div initial={{scale:0}} animate={{scale:1}}
                        style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                          color:DANGER, fontSize:16}}>✓</motion.div>
                    )}
                  </div>
                </div>

                {usesPasswordReauth ? (
                  <EInput
                    label="Clave actual"
                    type="password"
                    value={deletePassword}
                    onChange={setDeletePassword}
                    placeholder="••••••••"
                    hint="Necesitamos una reautenticación final antes de borrar la cuenta."
                  />
                ) : (
                  <div style={{
                    marginBottom:14,
                    fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:500,
                    color:SC.mutedL, lineHeight:1.6,
                    padding:"10px 14px", borderRadius:10,
                    background:`${DANGER}08`, border:`1px solid ${DANGER}22`,
                  }}>
                    Tu cuenta usa Google. Al confirmar, se abrirá una validación final para elegir la cuenta correcta antes del borrado.
                  </div>
                )}

                {deleteError && (
                  <div style={{
                    marginBottom:14,
                    display:"flex", alignItems:"center", gap:8,
                    fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
                    color:DANGER, background:`${DANGER}10`, border:`1px solid ${DANGER}33`,
                    borderRadius:10, padding:"10px 12px",
                  }}>
                    <AlertTriangle size={13}/> {deleteError}
                  </div>
                )}

                <div style={{display:"flex", gap:8}}>
                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:.96}}
                    onClick={()=>{setShowDanger(false);setDeleteTyped("");setDeletePassword("");setDeleteError("");}} disabled={deleteLoading}
                    aria-label="Cancelar eliminación de cuenta"
                    style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600, color:SC.muted,
                      background:`${SC.navy}88`, border:`1px solid ${SC.navy}`,
                      borderRadius:10, padding:"10px 18px", cursor:"pointer",
                    }}>
                    {t("pr.sec.cancel")}
                  </motion.button>
                  <motion.button
                    whileHover={deleteTyped===stats.username&&!deleteLoading?{scale:1.02}:{}}
                    whileTap={deleteTyped===stats.username&&!deleteLoading?{scale:.95}:{}}
                    disabled={deleteTyped!==stats.username||deleteLoading||(usesPasswordReauth&&!deletePassword)}
                    onClick={handleDeleteAccount}
                    aria-label="Confirmar eliminación permanente de cuenta"
                    style={{
                      fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700, flex:1,
                      color:deleteTyped===stats.username&&!deleteLoading&&(!usesPasswordReauth||!!deletePassword)?SC.bg:SC.muted,
                      background:deleteTyped===stats.username&&!deleteLoading&&(!usesPasswordReauth||!!deletePassword)
                        ?`linear-gradient(135deg,${DANGER},${DANGER}aa)`
                        :`${DANGER}18`,
                      border:`1px solid ${DANGER}55`, borderRadius:10,
                      padding:"10px 18px",
                      cursor:deleteTyped===stats.username&&!deleteLoading&&(!usesPasswordReauth||!!deletePassword)?"pointer":"not-allowed",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      boxShadow:deleteTyped===stats.username&&!deleteLoading&&(!usesPasswordReauth||!!deletePassword)?`0 4px 18px ${DANGER}44`:"none",
                      transition:"all .25s",
                    }}>
                    {deleteLoading
                      ? <><Spinner color={DANGER}/> {t("pr.sec.deleting")}</>
                      : <><AlertTriangle size={12}/> {t("pr.sec.delete_confirm")}</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.aside variants={FV.card} style={{
        ...glass(DANGER),
        padding:"18px 18px 16px",
        position:isMobile ? "relative" : "sticky",
        top:isMobile ? "auto" : 14,
      }}>
        <TopLine color={DANGER}/>
        <div style={{display:"grid",gap:12}}>
          <div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:DANGER,marginBottom:8}}>
              Zona de riesgo
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:22,fontWeight:800,lineHeight:1.05,color:"#fff",marginBottom:8}}>
              Borrado final
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.65,color:SC.mutedL}}>
              El flujo peligroso queda aislado en su propio lateral para que la decision no se mezcle con cambios normales del perfil.
            </div>
          </div>
          {[
            { label:"Ficha requerida", value:stats.username || "Sin nombre de héroe", glow:DANGER },
            { label:"Reautenticacion", value:usesPasswordReauth ? "Clave actual" : "Cuenta Google", glow:usesPasswordReauth ? DANGER : SC.blue },
            { label:"Estado", value:deleteLoading ? "Validando identidad" : deleteTyped === stats.username ? "Listo para confirmar" : "Pendiente", glow:deleteLoading ? SC.orange : deleteTyped === stats.username ? SC.green : SC.muted },
          ].map((item) => (
            <div key={item.label} style={{
              padding:"11px 12px",
              borderRadius:14,
              border:`1px solid ${item.glow}26`,
              background:"rgba(10,14,26,.58)",
            }}>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:9,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:SC.muted,marginBottom:5}}>
                {item.label}
              </div>
              <div style={{fontFamily:"'Manrope',sans-serif",fontSize:15,fontWeight:800,color:item.glow}}>
                {item.value}
              </div>
            </div>
          ))}
          <div style={{
            padding:"12px 12px 10px",
            borderRadius:14,
            border:`1px solid ${DANGER}26`,
            background:`${DANGER}10`,
          }}>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:DANGER,marginBottom:6}}>
              Ultimo chequeo
            </div>
            <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.65,color:"rgba(231,224,242,.8)"}}>
              Solo se habilita la confirmacion total cuando el nombre coincide y la identidad actual queda validada.
            </div>
          </div>
        </div>
      </motion.aside>
      </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
const EMPTY_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(dia=>({dia,sesiones:0,xp:0}));

const PROFILE_SILENT_TTL = 30_000;
const PROFILE_VISIBLE_PULSE = 45_000;
const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";

export default function UserPerfil({profile, onLogout}) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(1180);
  const [localStats,   setLocalStats]   = useState(() => profileToStats(profile));
  const [badges,       setBadges]       = useState([]);
  const [actividad,    setActividad]    = useState(EMPTY_SEMANA);
  const [badgesLoaded, setBadgesLoaded] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError,   setStatsError]   = useState(null);
  const [tab,          setTab]          = useScopedStorageState(PROFILE_TAB_STORAGE_KEY, "resumen");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const allowedTabs = new Set(["resumen", "estadisticas", "progreso", "guardarropa", "historial", "editar", "seguridad"]);
    const currentUid = auth.currentUser?.uid || profile?.uid || null;

    const applyChatAction = (raw) => {
      const payload = raw?.detail || raw;
      if (!payload || payload.section !== "perfil") return false;
      if (payload.profileUid && currentUid && payload.profileUid !== currentUid) return false;
      const targetTab = allowedTabs.has(payload.entityId) ? payload.entityId : "resumen";
      setTab(targetTab);
      return true;
    };

    const handleChatAction = (event) => {
      applyChatAction(event);
    };

    try {
      const stored = window.sessionStorage.getItem(CHAT_DEEPLINK_KEY);
      if (stored && applyChatAction(JSON.parse(stored))) {
        window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY);
      }
    } catch {}

    window.addEventListener("chatGameplayLink", handleChatAction);
    return () => window.removeEventListener("chatGameplayLink", handleChatAction);
  }, [profile?.uid, setTab]);

  // Skin state — sync from localStats
  const [skinCatalog,  setSkinCatalog]  = useState([]);
  const [skinsLoaded,  setSkinsLoaded]  = useState(false);
  const [ownedSkins,   setOwnedSkins]   = useState(localStats.ownedSkins);
  const [activeSkinL,  setActiveSkinL]  = useState(localStats.activeSkin);
  const [skinChanging, setSkinChanging] = useState(false);
  const [skinFeedback, setSkinFeedback] = useState(null);

  // Avatar & frame state
  const [avatarCatalog,   setAvatarCatalog]   = useState(AVATARS_CATALOG);
  const [frameCatalog,    setFrameCatalog]    = useState(FRAMES_CATALOG);
  const [avatarCatalogLoaded, setAvatarCatalogLoaded] = useState(false);
  const [ownedAvatars,   setOwnedAvatars]   = useState(localStats.ownedAvatars);
  const [activeAvatarL,  setActiveAvatarL]  = useState(localStats.activeAvatar);
  const [ownedFrames,    setOwnedFrames]    = useState(localStats.ownedFrames);
  const [activeFrameL,   setActiveFrameL]   = useState(localStats.activeFrame);
  const [avatarChanging, setAvatarChanging] = useState(false);
  const [avatarBuyingId, setAvatarBuyingId] = useState(null);
  const [avatarFeedback, setAvatarFeedback] = useState(null);

  // Titles state
  const [titleCatalog,   setTitleCatalog]   = useState(TITULOS_CATALOG);
  const [titleCatalogLoaded, setTitleCatalogLoaded] = useState(false);
  const [ownedTitles,   setOwnedTitles]   = useState(localStats.ownedTitles || []);

  const cls = PROFILE_CLS[localStats.heroClass]||PROFILE_CLS.GUERRERO;

  // ── Toast system ─────────────────────────────────────────────
  const _toast = useToast();
  const showToast = useCallback(({ok, message, sub}) => {
    const text = sub ? `${message}: ${sub}` : message;
    ok ? _toast.success(text) : _toast.error(text);
  }, [_toast]);

  // Central profile sync: shorter TTL plus in-flight dedupe
  const lastLoadRef = useRef(0);
  const inFlightProfileRef = useRef(null);
  const profileFingerprintRef = useRef("");
  const broadcastProfileRefresh = useCallback((scope = "core") => {
    const uid = auth.currentUser?.uid || profile?.uid || "guest";
    const detail = { scope, ts: Date.now(), uid };
    try {
      localStorage.setItem(`fv-profile-refresh-${uid}`, JSON.stringify(detail));
    } catch {}
    window.dispatchEvent(new CustomEvent("profileUpdated", { detail }));
  }, [profile?.uid]);

  // ── Load all profile data ────────────────────────────────────
  const applyStatsSnapshot = useCallback((statsPayload, userPayload = {}) => {
    const s = statsPayload || {};
    const usr = userPayload || {};
    setLocalStats((prev) => ({
      ...prev,
      ...s,
      nivel: s.nivel || Number(usr.level || prev.nivel),
      usernameChanged: s.usernameChanged ?? usr.usernameChanged ?? prev.usernameChanged,
      fuerza: Number(s.fuerza ?? usr.fuerza ?? prev.fuerza ?? 0),
      resistencia: Number(s.resistencia ?? usr.resistencia ?? prev.resistencia ?? 0),
      agilidad: Number(s.agilidad ?? usr.agilidad ?? prev.agilidad ?? 0),
      vitalidad: Number(s.vitalidad ?? usr.vitalidad ?? prev.vitalidad ?? 0),
    }));
    setOwnedSkins(s.ownedSkins || ["default"]);
    setActiveSkinL(s.activeSkin || "default");
    setOwnedAvatars(s.ownedAvatars || ["avatar_01"]);
    setActiveAvatarL(s.activeAvatar || "avatar_01");
    setOwnedFrames(s.ownedFrames || []);
    setActiveFrameL(s.activeFrame || null);
    if (Array.isArray(s.ownedTitles)) setOwnedTitles(s.ownedTitles);
  }, []);

  const loadCoreProfileState = useCallback(async ({ silent = false, force = false } = {}) => {
    const now = Date.now();
    if (silent && !force && (now - lastLoadRef.current) < 90000) return;
    lastLoadRef.current = now;

    try {
      if (!silent) setLoadingStats(true);
      setStatsError(null);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const statsRes = await getUserStats(token);

      if (statsRes?.ok) {
        const s = statsRes.stats;
        const usr = statsRes.user || {};
        applyStatsSnapshot(s, usr);
      } else {
        setStatsError("No se pudieron cargar las estadísticas.");
      }
    } catch (err) {
      console.error("Error cargando núcleo del perfil:", err);
      if (!silent) setStatsError(err.message);
    } finally {
      if (!silent) setLoadingStats(false);
    }
  }, [applyStatsSnapshot]);

  const loadCoreProfileStateLive = useCallback(async ({ silent = false, force = false } = {}) => {
    const now = Date.now();
    if (silent && !force && (now - lastLoadRef.current) < PROFILE_SILENT_TTL) return;
    if (inFlightProfileRef.current) return inFlightProfileRef.current;

    const requestPromise = (async () => {
      try {
        if (!silent) setLoadingStats(true);
        setStatsError(null);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const statsRes = await getUserStats(token);

        if (statsRes?.ok) {
          const s = statsRes.stats;
          const usr = statsRes.user || {};
          applyStatsSnapshot(s, usr);
          lastLoadRef.current = Date.now();
        } else {
          setStatsError("No se pudieron cargar las estadisticas.");
        }
      } catch (err) {
        console.error("Error cargando nucleo del perfil:", err);
        if (!silent) setStatsError(err.message);
      } finally {
        if (!silent) setLoadingStats(false);
      }
    })();

    inFlightProfileRef.current = requestPromise;
    try {
      await requestPromise;
    } finally {
      if (inFlightProfileRef.current === requestPromise) {
        inFlightProfileRef.current = null;
      }
    }
  }, [applyStatsSnapshot]);

  const applyLogros = useCallback((allLogros) => {
    setBadges(allLogros.map((l) => ({
      id:          l.id,
      nombre:      l.nombre,
      titulo:      l.nombre,
      icono:       l.imagen || "🏆",
      imagen:      l.imagen || "🏆",
      rareza:      l.rareza || "Común",
      obtenido:    l.obtenido  || false,
      reclamado:   l.reclamado || false,
      descripcion: l.descripcion || "",
      progreso:    l.progreso || 0,
      total:       l.total    || 1,
    })));
    setBadgesLoaded(true);
  }, []);

  const loadBadgesAndActivity = useCallback(async ({ force = false } = {}) => {
    if (!force && badgesLoaded && activityLoaded) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      // ── Session cache for logros (5-min TTL, mirrors backend TTL) ──
      const cachedLogros = _sessionLogrosCache.get(user.uid);
      const logrosPromise = (!force && cachedLogros && Date.now() - cachedLogros.ts < SESSION_LOGROS_TTL)
        ? Promise.resolve({ ok: true, logros: cachedLogros.logros })
        : getLogrosCatalogo(token).then((res) => {
            if (res?.ok) _sessionLogrosCache.set(user.uid, { ts: Date.now(), logros: res.logros || [] });
            return res;
          });

      const [logrosRes, actRes] = await Promise.allSettled([
        logrosPromise,
        activityLoaded && !force ? Promise.resolve(null) : getWeeklyActivity(token),
      ]);

      if (logrosRes.status === "fulfilled" && logrosRes.value?.ok) {
        applyLogros(logrosRes.value.logros || []);
      }

      if (actRes.status === "fulfilled" && actRes.value?.ok && actRes.value.semana?.length) {
        setActividad(actRes.value.semana);
        setActivityLoaded(true);
      }
    } catch (err) {
      console.error("Error cargando extras de perfil:", err);
    }
  }, [activityLoaded, applyLogros, badgesLoaded]);

  const loadSkinsCatalog = useCallback(async ({ force = false } = {}) => {
    if (!force && skinsLoaded) return;
    try {
      const res = await getSkins();
      if (res?.ok) {
        setSkinCatalog(res.skins || []);
        setSkinsLoaded(true);
      }
    } catch (err) {
      console.error("Error cargando skins de perfil:", err);
    }
  }, [skinsLoaded]);

  const loadAvatarCatalog = useCallback(async ({ force = false } = {}) => {
    if (!force && avatarCatalogLoaded) return;
    try {
      const res = await getAvatarCatalog();
      if (res?.ok) {
        const nextAvatars = (res.avatars || []).map((entry) =>
          mergeCatalogEntryWithFallback(entry, AVATARS_CATALOG.find((fallback) => fallback.id === entry.id))
        );
        const nextFrames = (res.frames || []).map((entry) =>
          mergeCatalogEntryWithFallback(entry, FRAMES_CATALOG.find((fallback) => fallback.id === entry.id))
        );
        setAvatarCatalog(nextAvatars.length ? nextAvatars : AVATARS_CATALOG);
        setFrameCatalog(nextFrames.length ? nextFrames : FRAMES_CATALOG);
        setAvatarCatalogLoaded(true);
      }
    } catch (err) {
      console.error("Error cargando catalogo visual del perfil:", err);
    }
  }, [avatarCatalogLoaded]);

  const loadTitleCatalog = useCallback(async ({ force = false } = {}) => {
    if (!force && titleCatalogLoaded) return;
    try {
      const res = await getTitlesCatalog();
      if (res?.ok) {
        const nextTitles = (res.titles || []).map((entry) =>
          mergeCatalogEntryWithFallback(entry, TITULOS_CATALOG.find((fallback) => fallback.nombre === entry.nombre))
        );
        setTitleCatalog(nextTitles.length ? nextTitles : TITULOS_CATALOG);
        setTitleCatalogLoaded(true);
      }
    } catch (err) {
      console.error("Error cargando catalogo de titulos del perfil:", err);
    }
  }, [titleCatalogLoaded]);

  const refreshProfileState = useCallback(async ({
    force = false,
    silent = true,
    includeBadges = false,
    includeActivity = false,
    includeSkins = false,
    includeAvatarCatalog = false,
    includeTitleCatalog = false,
  } = {}) => {
    await loadCoreProfileStateLive({ silent, force });
    if (includeBadges || includeActivity) {
      await loadBadgesAndActivity({ force });
    }
    if (includeSkins) {
      await loadSkinsCatalog({ force });
    }
    if (includeAvatarCatalog) {
      await loadAvatarCatalog({ force });
    }
    if (includeTitleCatalog) {
      await loadTitleCatalog({ force });
    }
  }, [loadAvatarCatalog, loadBadgesAndActivity, loadCoreProfileStateLive, loadSkinsCatalog, loadTitleCatalog]);

  const saveProfileModuleState = useCallback(async (moduleId, patch = {}) => {
    if (!["estadisticas", "progreso", "historial"].includes(moduleId)) return;
    const user = auth.currentUser;
    if (!user) return;

    const currentModules = normalizeProfileModules(localStats.profileModules);
    const nextModules = {
      ...currentModules,
      [moduleId]: {
        ...currentModules[moduleId],
        ...patch,
      },
    };

    setLocalStats((prev) => ({
      ...prev,
      profileModules: nextModules,
    }));

    try {
      const token = await user.getIdToken();
      const response = await updateProfile(token, { profileModules: nextModules });
      if (response?.ok) {
        setLocalStats((prev) => ({
          ...prev,
          ...profileToStats(response.user || {}),
          ...response.user,
          profileModules: normalizeProfileModules(response.user?.profileModules || nextModules),
        }));
        broadcastProfileRefresh(`profile-module-${moduleId}`);
      }
    } catch (err) {
      console.error("Error guardando estado del modulo de perfil:", err);
    }
  }, [broadcastProfileRefresh, localStats.profileModules]);

  // Initial load + auth watch
  useEffect(() => {
    refreshProfileState({ force:true, silent:false });

    const unsub = auth.onAuthStateChanged(u => {
      if (u) refreshProfileState({ silent:true });
    });

    const forceRefresh = () => refreshProfileState({
      silent:true,
      force:true,
      includeBadges: badgesLoaded,
      includeActivity: activityLoaded,
      includeSkins: skinsLoaded,
      includeAvatarCatalog: avatarCatalogLoaded,
      includeTitleCatalog: titleCatalogLoaded,
    });
    const visibilityRefresh = () => {
      if (document.visibilityState === "visible") forceRefresh();
    };
    const pageShowRefresh = () => forceRefresh();
    const storageRefresh = (event) => {
      if (!event.key) return;
      if (event.key.startsWith("fv-profile-")) forceRefresh();
    };
    const refreshEvents = [
      "exerciseCompleted",
      "skinChanged",
      "levelUp",
      "skillUnlocked",
      "misionCompleted",
      "logroUnlocked",
      "streakUpdated",
      "itemUsed",
      "profileUpdated",
      "titlePurchased",
      "titleEquipped",
      "profileSecurityUpdated",
    ];
    refreshEvents.forEach((eventName) => window.addEventListener(eventName, forceRefresh));
    window.addEventListener("focus", forceRefresh);
    window.addEventListener("pageshow", pageShowRefresh);
    window.addEventListener("storage", storageRefresh);
    document.addEventListener("visibilitychange", visibilityRefresh);

    // Sync purchases made in the shop without a full reload
    const avatarPurchasedHandler = (e) => {
      if (e.detail?.ownedAvatars) setOwnedAvatars(e.detail.ownedAvatars);
      if (e.detail?.ownedFrames !== undefined) setOwnedFrames(e.detail.ownedFrames);
      if (e.detail?.coins !== undefined)
        setLocalStats(s => ({ ...s, coins: e.detail.coins }));
      forceRefresh();
    };
    const avatarEquippedHandler = (e) => {
      if (e.detail?.activeAvatar !== undefined) setActiveAvatarL(e.detail.activeAvatar);
      if (e.detail?.activeFrame !== undefined) setActiveFrameL(e.detail.activeFrame);
      forceRefresh();
    };
    window.addEventListener("avatarPurchased", avatarPurchasedHandler);
    window.addEventListener("avatarEquipped", avatarEquippedHandler);

    return () => {
      unsub();
      refreshEvents.forEach((eventName) => window.removeEventListener(eventName, forceRefresh));
      window.removeEventListener("focus", forceRefresh);
      window.removeEventListener("pageshow", pageShowRefresh);
      window.removeEventListener("storage", storageRefresh);
      document.removeEventListener("visibilitychange", visibilityRefresh);
      window.removeEventListener("avatarPurchased", avatarPurchasedHandler);
      window.removeEventListener("avatarEquipped", avatarEquippedHandler);
    };
  }, [activityLoaded, avatarCatalogLoaded, badgesLoaded, refreshProfileState, skinsLoaded, titleCatalogLoaded]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refreshProfileState({
        silent:true,
        force:true,
        includeBadges: badgesLoaded,
        includeActivity: activityLoaded,
        includeSkins: skinsLoaded,
        includeAvatarCatalog: avatarCatalogLoaded,
        includeTitleCatalog: titleCatalogLoaded,
      });
    }, PROFILE_VISIBLE_PULSE);

    return () => window.clearInterval(intervalId);
  }, [activityLoaded, avatarCatalogLoaded, badgesLoaded, refreshProfileState, skinsLoaded, titleCatalogLoaded]);

  // Sync avatar/frame ownership when parent dashboard updates profile after a purchase
  useEffect(() => {
    if (!profile) return;
    const nextStats = profileToStats(profile);
    setLocalStats((prev) => ({
      ...prev,
      heroClass: nextStats.heroClass || prev.heroClass,
      username: nextStats.username || prev.username,
      email: nextStats.email || prev.email,
      heroName: nextStats.heroName || prev.heroName,
      titulo: nextStats.titulo || prev.titulo,
      bio: nextStats.bio || prev.bio,
      createdAt: nextStats.createdAt || prev.createdAt,
      updatedAt: nextStats.updatedAt || prev.updatedAt,
      pendingEmailTarget: nextStats.pendingEmailTarget || prev.pendingEmailTarget,
      pendingEmailStatus: nextStats.pendingEmailStatus || prev.pendingEmailStatus,
      pendingEmailRequestedAt: nextStats.pendingEmailRequestedAt || prev.pendingEmailRequestedAt,
      pendingEmailResolvedAt: nextStats.pendingEmailResolvedAt || prev.pendingEmailResolvedAt,
      usernameChanged: nextStats.usernameChanged ?? prev.usernameChanged,
      profileModules: nextStats.profileModules || prev.profileModules,
      activeSkin: nextStats.activeSkin || prev.activeSkin,
      activeAvatar: nextStats.activeAvatar || prev.activeAvatar,
      activeFrame: nextStats.activeFrame ?? prev.activeFrame,
      ownedSkins: nextStats.ownedSkins || prev.ownedSkins,
      ownedAvatars: nextStats.ownedAvatars || prev.ownedAvatars,
      ownedFrames: nextStats.ownedFrames || prev.ownedFrames,
      ownedTitles: nextStats.ownedTitles || prev.ownedTitles,
    }));
    setOwnedSkins(nextStats.ownedSkins || ["default"]);
    setActiveSkinL(nextStats.activeSkin || "default");
    setOwnedAvatars(nextStats.ownedAvatars || ["avatar_01"]);
    setActiveAvatarL(nextStats.activeAvatar || "avatar_01");
    setOwnedFrames(nextStats.ownedFrames || []);
    setActiveFrameL(nextStats.activeFrame || null);
    setOwnedTitles(nextStats.ownedTitles || []);

    const nextFingerprint = JSON.stringify({
      updatedAt: profile?.updatedAt || "",
      username: profile?.username || "",
      heroClass: profile?.heroClass || "",
      coins: profile?.coins ?? "",
      titulo: profile?.titulo || "",
      activeSkin: profile?.activeSkin || "",
      activeAvatar: profile?.activeAvatar || "",
      activeFrame: profile?.activeFrame || "",
      pendingEmailTarget: profile?.pendingEmailTarget || "",
      pendingEmailStatus: profile?.pendingEmailStatus || "",
    });

    if (!profileFingerprintRef.current) {
      profileFingerprintRef.current = nextFingerprint;
      return;
    }

    if (profileFingerprintRef.current !== nextFingerprint) {
      profileFingerprintRef.current = nextFingerprint;
      refreshProfileState({
        silent:true,
        force:true,
        includeBadges: badgesLoaded,
        includeActivity: activityLoaded,
        includeSkins: skinsLoaded,
        includeAvatarCatalog: avatarCatalogLoaded,
        includeTitleCatalog: titleCatalogLoaded,
      });
    }
  }, [
    activityLoaded,
    avatarCatalogLoaded,
    badgesLoaded,
    profile,
    refreshProfileState,
    skinsLoaded,
    titleCatalogLoaded,
  ]);

  useEffect(() => {
    const needsMeta = tab === "resumen" || tab === "estadisticas" || tab === "progreso" || tab === "historial";
    if (needsMeta && (!badgesLoaded || !activityLoaded)) {
      loadBadgesAndActivity();
    }
    if (tab === "guardarropa" && !skinsLoaded) {
      loadSkinsCatalog();
    }
    if (tab === "guardarropa" && !avatarCatalogLoaded) {
      loadAvatarCatalog();
    }
    if ((tab === "editar" || tab === "resumen") && !titleCatalogLoaded) {
      loadTitleCatalog();
    }
  }, [activityLoaded, avatarCatalogLoaded, badgesLoaded, loadAvatarCatalog, loadBadgesAndActivity, loadSkinsCatalog, loadTitleCatalog, skinsLoaded, tab, titleCatalogLoaded]);

  const handleEquipSkin = async (skinId) => {
    if (skinId===activeSkinL || skinChanging) return;
    setSkinChanging(true);
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await setActiveSkin(token, skinId);
      if (res?.ok) {
        setActiveSkinL(skinId);
        setLocalStats((s) => ({ ...s, activeSkin: skinId }));
        window.dispatchEvent(new CustomEvent("skinChanged", { detail:{skin:skinId} }));
        broadcastProfileRefresh("skin");
        setSkinFeedback({ ok:true, text:t("pr.toast.skin_equipped") });
      } else {
        setSkinFeedback({ ok:false, text:res?.message||"Error al equipar." });
      }
    } catch {
      setSkinFeedback({ ok:false, text:"Error de red." });
    } finally {
      setSkinChanging(false);
      setTimeout(()=>setSkinFeedback(null), 3000);
    }
  };

  const handleEquipAvatar = async (avatarId) => {
    if (avatarId === activeAvatarL || avatarChanging) return;
    setAvatarChanging(true);
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await setActiveAvatar(token, avatarId);
      if (res?.ok) {
        setActiveAvatarL(avatarId);
        setLocalStats(s => ({ ...s, activeAvatar: avatarId }));
        window.dispatchEvent(new CustomEvent("avatarEquipped", { detail:{ activeAvatar: avatarId } }));
        broadcastProfileRefresh("avatar");
        setAvatarFeedback({ ok:true, text:t("pr.toast.avatar_equipped") });
      } else {
        setAvatarFeedback({ ok:false, text:res?.message||"Error al equipar." });
      }
    } catch {
      setAvatarFeedback({ ok:false, text:"Error de red." });
    } finally {
      setAvatarChanging(false);
      setTimeout(()=>setAvatarFeedback(null), 3000);
    }
  };

  const handleEquipFrame = async (frameId) => {
    if (frameId === activeFrameL || avatarChanging) return;
    setAvatarChanging(true);
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await setActiveFrame(token, frameId);
      if (res?.ok) {
        setActiveFrameL(frameId);
        setLocalStats(s => ({ ...s, activeFrame: frameId }));
        window.dispatchEvent(new CustomEvent("avatarEquipped", { detail:{ activeFrame: frameId } }));
        broadcastProfileRefresh("frame");
        setAvatarFeedback({ ok:true, text: frameId ? t("pr.toast.frame_equipped") : t("pr.toast.frame_removed") });
      } else {
        setAvatarFeedback({ ok:false, text:res?.message||"Error al equipar." });
      }
    } catch {
      setAvatarFeedback({ ok:false, text:"Error de red." });
    } finally {
      setAvatarChanging(false);
      setTimeout(()=>setAvatarFeedback(null), 3000);
    }
  };

  const handleBuyAvatarItem = async (item) => {
    if (!item?.id || avatarBuyingId || avatarChanging) return;
    setAvatarBuyingId(item.id);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sin sesion activa.");
      const token = await user.getIdToken();
      const res = await purchaseAvatarItem(token, item.id);
      const newOwnedAvatars = res?.ownedAvatars ?? ownedAvatars;
      const newOwnedFrames = res?.ownedFrames ?? ownedFrames;
      if (!res?.ok) throw new Error(res?.message || "No pudimos comprar esta pieza.");

      setOwnedAvatars(newOwnedAvatars);
      setOwnedFrames(newOwnedFrames);
      setLocalStats((s) => ({
        ...s,
        coins: res.coins ?? s.coins,
        ownedAvatars: newOwnedAvatars,
        ownedFrames: newOwnedFrames,
      }));

      window.dispatchEvent(new CustomEvent("avatarPurchased", {
        detail: {
          ownedAvatars: newOwnedAvatars,
          ownedFrames: newOwnedFrames,
          coins: res.coins,
        },
      }));
      broadcastProfileRefresh("avatar-purchase");

      setAvatarFeedback({ ok:true, text:res.message || `${item.nombre} ya forma parte de tu perfil.` });
      showToast({ ok:true, message:"Compra completada", sub:item.nombre });
      refreshProfileState({ silent:true, force:true, includeAvatarCatalog:true });
    } catch (err) {
      const message = err?.message || "No pudimos comprar esta pieza visual.";
      setAvatarFeedback({ ok:false, text:message });
      showToast({ ok:false, message:"Compra rechazada", sub:message });
    } finally {
      setAvatarBuyingId(null);
      setTimeout(()=>setAvatarFeedback(null), 3200);
    }
  };


  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",gap:14,fontFamily:"'Manrope',sans-serif"}}>
        {(() => {
          const primaryTabs = [
            { id:"resumen", label:"Resumen", icon:"resumen" },
            { id:"estadisticas", label:"Lectura", icon:"stats" },
            { id:"progreso", label:"Ruta", icon:"prog" },
            { id:"guardarropa", label:"Guardarropa", icon:"equip" },
            { id:"historial", label:"Memoria", icon:"hist" },
          ];
          const utilityTabs = [
            { id:"editar", label:"Editar ficha" },
            { id:"seguridad", label:"Seguridad" },
          ];
          const activeTabLabel = [...primaryTabs, ...utilityTabs].find((item) => item.id === tab)?.label || "Resumen";
          const unlockedBadges = badges.filter((badge) => badge.obtenido).length;
          const pendingBadges = badges.filter((badge) => badge.obtenido && !badge.reclamado).length;
          const weekSessions = actividad.reduce((sum, day) => sum + Number(day?.sesiones || 0), 0);
          const stageBackground = PROFILE_STAGE_BG[localStats.heroClass] || PROFILE_STAGE_BG.GUERRERO;
          const authUser = auth.currentUser;
          const liveTitleCatalog = titleCatalog?.length ? titleCatalog : TITULOS_CATALOG;
          const activeTitleData = liveTitleCatalog.find((entry) => entry.nombre === localStats.titulo);
          const activeSkinData = skinCatalog.find((entry) => entry.id === activeSkinL);
          const activeAvatarData = (avatarCatalog?.length ? avatarCatalog : AVATARS_CATALOG).find((entry) => entry.id === activeAvatarL);
          const activeFrameData = (frameCatalog?.length ? frameCatalog : FRAMES_CATALOG).find((entry) => entry.id === activeFrameL);
          const loadoutEntries = [activeSkinData, activeAvatarData, activeFrameData, activeTitleData].filter(Boolean);
          const rarityTally = loadoutEntries.reduce((acc, entry) => {
            const rarity = normalizeRarityLabel(entry.rareza);
            acc[rarity] = (acc[rarity] || 0) + 1;
            return acc;
          }, {});
          const dominantRarity = Object.entries(rarityTally).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return (RARITY_RANK[b[0]] || 0) - (RARITY_RANK[a[0]] || 0);
          })[0]?.[0] || "Base";
          const xpToNext = Math.max(0, (localStats.xpNext || 1000) - (localStats.xp || 0));
          const classPrimary = cls.color;
          const classSecondary = cls.secondary || cls.color;
          const classSurface = `${classPrimary}12`;
          const classSurfaceStrong = `${classPrimary}1e`;
          const classEdge = `${classPrimary}40`;
          const classGlow = `${classPrimary}28`;
          const classGlowSoft = `${classPrimary}18`;
          const classSecondarySoft = `${classSecondary}18`;
          const heroMetricTones = [classPrimary, classSecondary, "#f4cc78", "#4CC9F0"];
          const nextUnlockLabel = xpToNext > 0
            ? `Lv ${Number(localStats.nivel || 1) + 1} en ${xpToNext.toLocaleString()} XP`
            : "Subida lista para cerrar";
          const lastProfileUpdate = formatRecentStamp(
            profile?.updatedAt
              || localStats.updatedAt
              || localStats.lastActivityAt
              || localStats.lastWorkoutAt
              || authUser?.metadata?.lastSignInTime,
            "Sin lectura reciente"
          );
          const trainedToday = [
            localStats.lastWorkoutAt,
            localStats.lastExerciseAt,
            localStats.lastActivityAt,
            profile?.lastWorkoutAt,
            profile?.lastExerciseAt,
            profile?.lastActivityAt,
            profile?.updatedAt,
          ].some((entry) => isTodayStamp(entry) === true);
          const pendingTodayLabel = pendingBadges > 0
            ? `Reclama ${pendingBadges} insignias`
            : !trainedToday
              ? "Activa una sesión corta"
              : xpToNext <= 150
                ? "Remata el nivel actual"
                : Object.keys(localStats.activeBoosts || {}).length > 0 || localStats.streakShield
                  ? "Aprovecha tus boosts vivos"
                  : "Mantén la constancia";
          const sideFacts = [
            { label:"Última lectura", value:lastProfileUpdate },
            { label:"Rareza base", value:dominantRarity },
          ];

          return (
        <div style={{display:"grid",gap:12}}>
          <motion.section
            initial={{opacity:0,y:-16}}
            animate={{opacity:1,y:0}}
            transition={{duration:.45,ease:"easeOut"}}
            style={{
              position:"relative",
              overflow:"hidden",
              borderRadius:28,
              border:`1px solid ${classEdge}`,
              background:`linear-gradient(145deg, rgba(8,12,24,.97), rgba(8,12,24,.92))`,
              boxShadow:`0 22px 52px rgba(0,0,0,.48), 0 0 34px ${classGlow}, inset 0 1px 0 rgba(255,255,255,.04)`,
            }}
          >
            <div
              style={{
                position:"absolute",
                inset:0,
                background:`linear-gradient(112deg, rgba(8,12,24,.985) 4%, ${classSurfaceStrong} 20%, rgba(8,12,24,.82) 50%, rgba(8,12,24,.96) 100%), url('${stageBackground}') center/cover`,
                opacity:.98,
                filter:"blur(8px) saturate(.92) brightness(.82)",
                transform:"scale(1.035)",
              }}
            />
            <div style={{ position:"absolute", inset:0, background:`linear-gradient(180deg, rgba(8,12,24,.16) 0%, ${classSurface} 18%, rgba(8,12,24,.12) 48%, rgba(8,12,24,.42) 72%, ${classSecondarySoft} 100%)`, pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, background:"url('/ui/panel-texture.png') center/cover", opacity:.08, pointerEvents:"none" }} />
            <div style={{ position:"absolute", right:-80, top:-80, width:260, height:260, borderRadius:"50%", background:classPrimary, opacity:.2, filter:"blur(120px)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", left:"18%", bottom:-120, width:240, height:240, borderRadius:"50%", background:classSecondary, opacity:.16, filter:"blur(120px)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:"0 0 auto 0", height:1, background:`linear-gradient(90deg, transparent, ${classPrimary}, ${classSecondary}, transparent)`, opacity:.95 }} />
            <div
              style={{
                position:"relative",
                zIndex:1,
                display:"grid",
                gridTemplateColumns:(isMobile || isNarrow) ? "1fr" : "minmax(0, 1.16fr) minmax(360px, .84fr)",
                gap:isMobile ? 16 : 22,
                padding:isMobile ? "22px 18px 18px" : "28px 28px 22px",
                alignItems:"start",
              }}
            >
              <div style={{ display:"grid", gap:isMobile ? 16 : 18, alignContent:"start", minWidth:0 }}>
                <div
                  style={{
                    display:"inline-flex",
                    alignItems:"center",
                    gap:8,
                    padding:"7px 14px",
                    borderRadius:999,
                    border:`1px solid ${classEdge}`,
                    background:`linear-gradient(135deg, ${classSurfaceStrong}, rgba(10,14,26,.62))`,
                    color:classPrimary,
                    boxShadow:`0 10px 20px ${classGlowSoft}`,
                    fontFamily:"'Manrope',sans-serif",
                    fontSize:11,
                    fontWeight:800,
                    letterSpacing:".08em",
                    textTransform:"uppercase",
                    width:"fit-content",
                    textShadow:`0 0 12px ${classPrimary}, 0 0 24px ${classGlow}`,
                  }}
                >
                  Ficha del héroe
                </div>
                <div style={{ display:"grid", gap:10, maxWidth:isMobile ? "100%" : 700 }}>
                  <div
                    style={{
                      fontFamily:"'Manrope',sans-serif",
                      fontSize:"clamp(46px, 6.4vw, 104px)",
                      fontWeight:900,
                      lineHeight:.92,
                      letterSpacing:0,
                      color:"#fff9ef",
                      overflowWrap:"anywhere",
                    }}
                  >
                    Tu build, tu ruta y tu memoria del mapa <span style={{ color:classPrimary, textShadow:`0 0 34px ${classGlow}, 0 0 68px ${classGlowSoft}` }}>en una sola portada.</span>
                  </div>
                  <div
                    style={{
                      fontFamily:"'Manrope',sans-serif",
                      fontSize:"clamp(13px,1.1vw,15px)",
                      lineHeight:1.7,
                      color:"rgba(229,223,242,.8)",
                      maxWidth:620,
                    }}
                  >
                    Todo tu perfil vive aquí: identidad, progreso, guardarropa y ajustes en una lectura clara, cómoda y sin ruido.
                  </div>
                </div>
              </div>
              <div
                style={{
                  display:"grid",
                  gap:12,
                  alignContent:"start",
                  padding:0,
                  width:"100%",
                  maxWidth:"100%",
                  minWidth:0,
                }}
              >
                <div
                  style={{
                    position:"relative",
                    overflow:"hidden",
                    borderRadius:24,
                    border:`1px solid ${classEdge}`,
                    background:`linear-gradient(180deg, ${classSurfaceStrong}, rgba(8,12,24,.8))`,
                    boxShadow:`0 18px 32px rgba(0,0,0,.36), 0 0 24px ${classGlowSoft}, inset 0 1px 0 rgba(255,255,255,.04)`,
                    padding:isMobile ? "16px 16px 14px" : "18px 18px 14px",
                  }}
                >
                  <img
                    src={cls.crest}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    style={{ position:"absolute", right:14, top:14, width:54, height:54, objectFit:"contain", opacity:.95 }}
                  />
                  <div style={{ display:"flex", gap:isMobile ? 12 : 16, alignItems:"center", marginBottom:16, flexWrap:isMobile ? "wrap" : "nowrap" }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:isMobile ? 88 : 104, flex:"0 0 auto" }}>
                      <ProfileAvatar
                        heroClass={localStats.heroClass}
                        avatarId={activeAvatarL}
                        frameId={activeFrameL}
                        size={isMobile ? 74 : 86}
                        cls={cls}
                      />
                    </div>
                    <div style={{ minWidth:0, paddingRight:isMobile ? 0 : 54, flex:1, maxWidth:isMobile ? "100%" : 320 }}>
                      <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:cls.color, marginBottom:6, textShadow:`0 0 12px ${cls.color}cc, 0 0 24px ${cls.color}44` }}>
                        Registro activo
                      </div>
                      <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:isMobile ? 24 : 28, fontWeight:800, color:"#fff", lineHeight:.96, letterSpacing:"-.04em", marginBottom:4, textShadow:`0 0 26px ${cls.color}aa, 0 0 52px ${cls.color}44, 0 0 80px ${cls.color}18` }}>
                        {(localStats.username || "Héroe").toUpperCase()}
                      </div>
                      {localStats.heroName && (
                        <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700, color:cls.color, marginBottom:6, textShadow:`0 0 10px ${cls.color}bb, 0 0 20px ${cls.color}44` }}>
                          "{localStats.heroName}"
                        </div>
                      )}
                      <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, lineHeight:1.6, color:"rgba(228,223,240,.78)", maxWidth:340 }}>
                        {localStats.bio || "Tu ficha marca tu clase, tu presencia y el tono general del perfil. El resto lo ajustas por secciones segun lo que quieras revisar."}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:10, marginBottom:12 }}>
                    {sideFacts.map((fact, factIndex) => {
                      const factTone = factIndex % 2 === 0 ? classPrimary : classSecondary;
                      return (
                      <div
                        key={fact.label}
                        style={{
                          padding:isMobile ? "12px 12px 10px" : "11px 11px 9px",
                          borderRadius:14,
                          border:`1px solid ${factTone}24`,
                          background:`linear-gradient(145deg, rgba(8,12,24,.84), ${factTone}10)`,
                          boxShadow:`0 8px 18px ${factTone}12`,
                          backdropFilter:"blur(12px)",
                        }}
                      >
                        <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:9, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"rgba(178,169,202,.72)", marginBottom:6 }}>
                          {fact.label}
                        </div>
                        <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:isMobile ? 17 : 15, fontWeight:800, color:"#fff", lineHeight:1.2, textShadow:`0 0 14px ${factTone}88, 0 0 28px ${factTone}33` }}>
                          {fact.value}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                  <div
                    style={{
                      padding:"11px 13px",
                      borderRadius:14,
                      border:`1px solid ${cls.color}28`,
                      background:"rgba(10,14,26,.62)",
                      fontFamily:"'Manrope',sans-serif",
                      fontSize:12,
                      color:"rgba(230,223,242,.78)",
                      flex:"1 1 220px",
                    }}
                  >
                    <span style={{ color:cls.color, fontWeight:800, textShadow:`0 0 10px ${cls.color}bb, 0 0 20px ${cls.color}44` }}>Modulo abierto:</span> {activeTabLabel}
                  </div>
                  <button
                    onClick={onLogout}
                    style={{
                      padding:"11px 15px",
                      borderRadius:14,
                      border:"1px solid rgba(255,92,112,.36)",
                      background:"rgba(255,92,112,.08)",
                      color:"#ff8da0",
                      fontFamily:"'Manrope',sans-serif",
                      fontSize:12,
                      fontWeight:800,
                      cursor:"pointer",
                      display:"inline-flex",
                      alignItems:"center",
                      gap:8,
                    }}
                  >
                    <LogOut size={14}/> Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
          <div
            style={{
              display:"grid",
              gap:12,
              gridTemplateColumns:(isMobile || isNarrow) ? "1fr" : "minmax(0,1fr) auto",
              alignItems:"start",
            }}
          >
            <div
              style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit, minmax(122px, 1fr))",
                gap:10,
              }}
            >
              {primaryTabs.map((tb) => (
                <button
                  key={tb.id}
                  className={`mp-tab${tab===tb.id ? " active" : ""}`}
                  onClick={() => setTab(tb.id)}
                  aria-label={`Abrir modulo ${tb.label.toLowerCase()}`}
                  style={{
                    minHeight:52,
                    borderColor:tab===tb.id ? cls.color : undefined,
                    boxShadow:tab===tb.id ? `0 0 18px ${cls.color}30, inset 0 1px 0 rgba(255,255,255,.08)` : undefined,
                    background:tab===tb.id ? `linear-gradient(180deg, ${cls.color}2e, rgba(10,14,26,.92))` : undefined,
                  }}
                >
                  <span className={`mp-ti ${tb.icon}`} style={{ background:tab===tb.id ? cls.color : undefined }}/>
                  {tb.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:(isMobile || isNarrow) ? "flex-start" : "flex-end" }}>
              {utilityTabs.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  aria-label={`Abrir modulo ${tb.label.toLowerCase()}`}
                  style={{
                    padding:"12px 14px",
                    borderRadius:14,
                    border:`1px solid ${tab===tb.id ? cls.color : "rgba(161,140,220,.2)"}`,
                    background:tab===tb.id ? `linear-gradient(135deg, ${cls.color}24, rgba(10,14,26,.92))` : "rgba(10,14,26,.62)",
                    color:tab===tb.id ? "#fff" : "rgba(223,215,240,.82)",
                    fontFamily:"'Manrope',sans-serif",
                    fontSize:12,
                    fontWeight:800,
                    cursor:"pointer",
                    boxShadow:tab===tb.id ? `0 10px 20px ${cls.color}16` : "none",
                  }}
                >
                  {tb.label}
                </button>
              ))}
            </div>
          </div>
        </div>
          );
        })()}
        {/* ── Tab content ── */}
        {tab==="resumen"&&(
          <TabResumen stats={localStats} badges={badges} actividad={actividad}/>
        )}
        {(tab==="estadisticas"||tab==="progreso"||tab==="historial")&&(
          <PerfilPlaceholderTab
            tabId={tab}
            stats={localStats}
            badges={badges}
            actividad={actividad}
            cls={cls}
            onJump={setTab}
            onPersistState={saveProfileModuleState}
          />
        )}
        {tab==="editar"&&(
          <TabEditar stats={{...localStats, ownedTitles}} titleCatalog={titleCatalog} showToast={showToast} onSaved={updated=>{
            if (updated.ownedTitles) setOwnedTitles(updated.ownedTitles);
            setLocalStats(s=>({...s,...profileToStats(updated),...updated}));
            refreshProfileState({ silent:true, force:true, includeBadges: badgesLoaded, includeActivity: activityLoaded, includeTitleCatalog: true });
          }}/>
        )}
        {tab==="seguridad"&&<TabSeguridad stats={localStats} showToast={showToast} onLogout={onLogout}/>}

        {/* ── SKINS ── */}
        {tab==="guardarropa"&&(
          <SkinsTab
            skinCatalog={skinCatalog}
            ownedSkins={ownedSkins}
            activeSkinL={activeSkinL}
            skinChanging={skinChanging}
            skinFeedback={skinFeedback}
            handleEquipSkin={handleEquipSkin}
            avatarCatalog={avatarCatalog}
            frameCatalog={frameCatalog}
            ownedAvatars={ownedAvatars}
            activeAvatarL={activeAvatarL}
            ownedFrames={ownedFrames}
            activeFrameL={activeFrameL}
            avatarChanging={avatarChanging}
            avatarFeedback={avatarFeedback}
            avatarBuyingId={avatarBuyingId}
            handleEquipAvatar={handleEquipAvatar}
            handleEquipFrame={handleEquipFrame}
            handleBuyAvatarItem={handleBuyAvatarItem}
            heroClass={localStats.heroClass}
          />
        )}
      </div>
    </>
  );
}
