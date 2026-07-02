// src/pages/user/UserMente.jsx
// ─────────────────────────────────────────────────────────────
//  ZONA MENTE — Psicología Positiva integrada con la plataforma
//  Wine Aurora palette · framer-motion · todayDone progress ring
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useLang } from "../../hooks/useLang.js";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase.js";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import {
  saveMood, getMoodHistory,
  saveGratitude, getGratitudeHistory,
  savePerma, getPermaHistory,
  saveStrengths, getStrengths,
  logMenteSession, getMenteSummary,
  getMenteInsights, getCommunityMente, saveMenteConnection,
} from "../../services/api.js";

// ── Wine Aurora palette ───────────────────────────────────────
const C = {
  bg: P.bg0,    side: P.bg1,  card: P.bg1,   panel: P.bg2,
  navy: P.navy, navyL: P.line,
  orange: P.accent, orangeL: P.accent2, gold: P.gold,
  blue: "#4CC9F0", teal: "#4A9D8F", green: "#6BC87A",
  red: "#E05C8A",  purple: P.accent,  pink: "#EC4899",
  white: P.text, muted: P.muted, mutedL: P.mutedL,
};

// ── SC admin-config palette — idéntico a shared.jsx ──────────
const SC = {
  bg: P.bg0,    bg1: P.bg1,   bg2: P.bg2,
  border: P.line, borderL: P.line,
  accent: P.accent, accentL: P.accent2,
  gold: P.gold, text: P.text, muted: P.muted,
  blue: "#4CC9F0", green: "#6BC87A", red: "#E05C8A",
  navy: P.navy, navyL: P.line,
  white: P.text, mutedL: P.mutedL, orange: P.accent,
};

const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);
const scCard = (accent = SC.orange) => ({ background:SC.card, border:`1px solid ${SC.navy}`, borderTop:`2px solid ${accent}`, borderRadius:14, boxShadow:"0 4px 24px rgba(0,0,0,0.35)" });

// ── CSS keyframes ─────────────────────────────────────────────
const CSS = `
/* === fvm: ForgeVenture Zona Mente — Gothic JRPG === */

:root {
  --fvm-bg:    #07060c; --fvm-bg1:  #161122; --fvm-bg2:  #0b0814;
  --fvm-inner: #0a0712; --fvm-slot: #14101e;
  --fvm-border:#2a1f3d; --fvm-border2:#4a3a18;
  --fvm-gold:  #c89b3c; --fvm-gold-b:#f4cc78; --fvm-gold-s:#d4a44a;
  --fvm-text:  #e8dcc4; --fvm-dim:  #9d8fa8; --fvm-muted: #5e5269;
  --fvm-parch: #ead7ad;
  --fvm-mente: #b06aff; --fvm-mente-a: rgba(176,106,255,0.5);
  --fvm-xp1:#5a189a; --fvm-xp2:#9d4edd; --fvm-xp3:#c77dff;
  /* mood */
  --m-tenso:   #e0455e; --ma-tenso:  rgba(224,69,94,0.5);
  --m-cansado: #ff7a1f; --ma-cansado:rgba(255,122,31,0.5);
  --m-neutro:  #ffcd4a; --ma-neutro: rgba(255,205,74,0.5);
  --m-bien:    #8ac926; --ma-bien:   rgba(138,201,38,0.5);
  --m-energia: #4cc9f0; --ma-energia:rgba(76,201,240,0.5);
}

/* ── Global Manrope base ── */
.fvm-wrapper, .fvm-wrapper * { font-family:'Manrope',sans-serif; }
.fvm-wrapper button, .fvm-wrapper input, .fvm-wrapper textarea, .fvm-wrapper select { font-family:'Manrope',sans-serif; }

@keyframes fvm-rise    { 0%{transform:translateY(100vh);opacity:0} 10%{opacity:.9} 90%{opacity:.9} 100%{transform:translateY(-10vh) translateX(40px);opacity:0} }
@keyframes fvm-flicker { 100%{transform:scaleY(1.12) scaleX(0.92)} }
@keyframes fvm-glow-ci { 50%{box-shadow:inset 0 0 0 1px var(--fvm-gold-b),0 0 28px rgba(244,204,120,.6)} }
@keyframes fvm-spin    { to{transform:rotate(360deg)} }
@keyframes fvm-fb-in   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes fvm-bar-in  { from{height:0} to{} }
@keyframes fvm-pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes fvm-pop     { 0%{transform:scale(.75);opacity:0} 65%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
@keyframes fvm-aura-pulse { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.14)} }
@keyframes fvm-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes fvm-card-glow-in { from{box-shadow:inset 0 0 0 1px var(--mc),0 0 0 2px #050308,0 0 8px var(--ma)} to{box-shadow:inset 0 0 0 1px var(--mc),0 0 0 2px #050308,0 0 36px var(--ma),0 0 60px var(--ma)} }
@keyframes fvm-scan { 0%{top:-100%} 100%{top:200%} }
@keyframes fvm-chest-glow { 50%{opacity:.5} }

/* ── Layout ── */
.fvm-wrapper {
  max-width:1560px; margin:0 auto; padding:14px;
  display:grid;
  grid-template-columns:280px 1fr 320px;
  grid-template-rows:auto 1fr auto;
  gap:12px; min-height:calc(100vh - 64px);
  position:relative; z-index:2;
}
.fvm-top-bar   { grid-column:1/4; display:grid; grid-template-columns:280px 1fr auto; gap:12px; }
.fvm-left-col  { grid-column:1; display:flex; flex-direction:column; gap:12px; }
.fvm-center-col{ grid-column:2; display:flex; flex-direction:column; gap:12px; min-width:0; }
.fvm-right-col { grid-column:3; display:flex; flex-direction:column; gap:12px; }
.fvm-bottom-nav{ grid-column:1/4; }

/* ── Panel ── */
.fvm-panel {
  position:relative; overflow:hidden;
  background:linear-gradient(180deg,var(--fvm-bg1),var(--fvm-bg2));
  border:2px solid var(--fvm-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),
             0 0 0 3px #050308,0 0 0 4px var(--fvm-border2),0 6px 24px rgba(0,0,0,.6);
  padding:16px;
}
.fvm-panel::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); top:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-panel::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); top:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-corners { position:absolute; inset:0; pointer-events:none; }
.fvm-corners::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); bottom:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-corners::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); bottom:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-panel-head {
  display:flex; align-items:center; justify-content:center; gap:10px;
  color:var(--fvm-gold-b); font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  padding:5px 0 9px; margin:-4px -4px 10px;
  text-shadow:0 0 8px rgba(244,204,120,.35);
  border-bottom:1px dashed rgba(200,155,60,.25);
}
.fvm-panel-head .fvm-deco { color:var(--fvm-gold); opacity:.6; font-size:11px; }

/* ── Scrollbar ── */
.fvm-scroll::-webkit-scrollbar       { width:3px; }
.fvm-scroll::-webkit-scrollbar-track { background:transparent; }
.fvm-scroll::-webkit-scrollbar-thumb { background:#2a1f3d; border-radius:2px; }

/* ── Top bar ── */
.fvm-brand { padding:10px 14px; display:flex; align-items:center; gap:12px; }
.fvm-brand-mark { width:28px; height:28px; flex-shrink:0;
  background:conic-gradient(from 45deg,var(--fvm-mente) 25%,transparent 0 50%,var(--fvm-mente) 0 75%,transparent 0);
  border:2px solid var(--fvm-mente); transform:rotate(45deg);
  box-shadow:0 0 12px var(--fvm-mente-a); }
.fvm-brand-text { font-size:12px; font-weight:800; letter-spacing:.06em; color:var(--fvm-gold-b);
  text-shadow:0 0 8px rgba(244,204,120,.4); }
.fvm-brand-sub  { font-size:11px; font-weight:500; color:var(--fvm-dim); margin-top:4px; letter-spacing:.04em; }
.fvm-page-title { padding:10px 18px; text-align:center; display:flex; flex-direction:column; justify-content:center; }
.fvm-page-h1 { font-size:20px; font-weight:800; color:var(--fvm-mente); letter-spacing:.08em;
  text-shadow:0 0 16px var(--fvm-mente-a); margin-bottom:6px;
  display:flex; align-items:center; justify-content:center; gap:14px; }
.fvm-page-h1 .fvm-deco { color:var(--fvm-mente); opacity:.6; font-size:13px; }
.fvm-page-sub { font-family:'Manrope',sans-serif; font-size:13px; font-weight:500; color:var(--fvm-dim); letter-spacing:.04em; }
.fvm-top-right { display:flex; align-items:center; gap:8px; padding:10px 14px; }
.fvm-currency { display:flex; align-items:center; gap:8px; padding:8px 10px;
  background:var(--fvm-inner); border:2px solid var(--fvm-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.08); font-size:11px; color:var(--fvm-parch); }
.fvm-ic { width:14px; height:14px; display:inline-block; flex-shrink:0; }
.fvm-ic-gold   { background:radial-gradient(circle at 35% 30%,#ffe28a,var(--fvm-gold) 60%,#6e4a13);
  border:1px solid #2a1a06; border-radius:50%; }
.fvm-ic-gem    { background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg);
  border:1px solid #1a0a2a; width:11px !important; height:11px !important; }
.fvm-ic-energy { background:linear-gradient(180deg,#fff099,#ff9a1f);
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); }
.fvm-gear-btn  { width:36px; height:36px; background:var(--fvm-inner); border:2px solid var(--fvm-border);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:var(--fvm-dim); font-size:14px; }
.fvm-gear-btn:hover { color:var(--fvm-gold-b); border-color:var(--fvm-gold-s); }

/* ── Profile (left col top) ── */
.fvm-profile-top { display:flex; align-items:center; gap:12px;
  padding-bottom:10px; border-bottom:1px dashed rgba(200,155,60,.2); margin-bottom:10px; }
.fvm-av-frame { width:64px; height:64px; border:3px solid var(--fvm-gold); flex-shrink:0;
  background:linear-gradient(135deg,rgba(176,106,255,.35),rgba(20,15,40,.9)),var(--fvm-inner);
  box-shadow:inset 0 0 0 1px #000,0 0 14px var(--fvm-mente-a);
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden; }
.fvm-av-frame::before { content:""; position:absolute; width:4px; height:4px;
  background:var(--fvm-gold); top:-3px; left:-3px;
  box-shadow:64px 0 0 var(--fvm-gold),0 64px 0 var(--fvm-gold),64px 64px 0 var(--fvm-gold); }
.fvm-av-img { width:100%; height:100%; object-fit:cover; image-rendering:pixelated; }
.fvm-ph-icon { width:44px; height:44px; border:2px solid rgba(244,204,120,.4);
  display:flex; align-items:center; justify-content:center;
  font-family:'Manrope',sans-serif; font-size:13px; color:var(--fvm-gold-s); }
.fvm-player-name  { font-size:13px; font-weight:800; color:var(--fvm-gold-b); letter-spacing:.04em;
  text-shadow:0 0 6px rgba(244,204,120,.35); margin-bottom:5px; }
.fvm-player-class { font-size:11px; font-weight:700; color:var(--fvm-mente); letter-spacing:.05em; margin-bottom:7px; }
.fvm-level-pill { display:inline-flex; align-items:center; gap:6px; font-size:11px; color:var(--fvm-parch); }
.fvm-crest { width:24px; height:28px; background:linear-gradient(180deg,#2a1a4a,#160a26);
  border:2px solid var(--fvm-gold);
  clip-path:polygon(0 0,100% 0,100% 75%,50% 100%,0 75%);
  display:flex; align-items:center; justify-content:center;
  color:var(--fvm-gold-b); font-size:11px; line-height:1; padding-bottom:3px; }
.fvm-xp-row { display:flex; justify-content:space-between; align-items:baseline;
  font-size:11px; color:var(--fvm-dim); margin-bottom:5px; }
.fvm-xp-val { color:var(--fvm-xp3); font-family:'Manrope',sans-serif; font-size:13px; }
.fvm-xp-bar { height:10px; background:#050308; border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d; position:relative; overflow:hidden; }
.fvm-xp-fill { height:100%; background:linear-gradient(180deg,var(--fvm-xp3),var(--fvm-xp1));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3); }

/* ── Stats (left col) ── */
.fvm-stat { display:grid; grid-template-columns:14px 1fr; align-items:center;
  gap:9px; margin-bottom:9px; }
.fvm-stat:last-of-type { margin-bottom:4px; }
.fvm-stat-g { width:14px; height:14px; flex-shrink:0; }
.fvm-g-heart  { background:#e0455e; clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%); }
.fvm-g-shield { background:#ffb13a; clip-path:polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%); }
.fvm-g-boot   { background:#8ac926; clip-path:polygon(0 0,60% 0,60% 60%,100% 60%,100% 100%,0 100%); }
.fvm-g-scroll { background:#c08aff; }
.fvm-g-brain  { background:#4cc9f0; border-radius:50% 50% 40% 40%; }
.fvm-stat-lbl { display:flex; justify-content:space-between; font-size:11px;
  color:var(--fvm-parch); letter-spacing:.5px; margin-bottom:3px; }
.fvm-stat-v { color:var(--fvm-gold-b); }
.fvm-stat-bar { height:8px; background:#050308; border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d; position:relative; overflow:hidden; }
.fvm-stat-fill { height:100%; box-shadow:inset 0 1px 0 rgba(255,255,255,.3); }
.fvm-fill-str { background:linear-gradient(180deg,#ff6b80,#e0455e); width:78%; }
.fvm-fill-sta { background:linear-gradient(180deg,#ffcd6a,#ffb13a); width:64%; }
.fvm-fill-spd { background:linear-gradient(180deg,#b3e070,#8ac926); width:52%; }
.fvm-fill-dis { background:linear-gradient(180deg,#d8a8ff,#c08aff); width:86%; }
.fvm-fill-men { background:linear-gradient(180deg,#8addf5,#4cc9f0); width:71%; }

/* ── Equipment ── */
.fvm-equip-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
.fvm-slot { aspect-ratio:1; background:var(--fvm-inner);
  border:2px solid var(--fvm-border); display:flex; align-items:center;
  justify-content:center; overflow:hidden; }
.fvm-slot.r-legend { border-color:rgba(244,204,120,.5); }
.fvm-slot.r-rare   { border-color:rgba(76,201,240,.5); }
.fvm-slot.r-epic   { border-color:rgba(192,138,255,.5); }
.fvm-slot.r-uncom  { border-color:rgba(138,201,38,.5); }
.fvm-item { width:60%; height:60%; }
.fvm-item.sword   { background:linear-gradient(180deg,#d9d9d9 50%,#8d6b3d 50%);
  clip-path:polygon(45% 0,55% 0,55% 70%,70% 75%,70% 95%,55% 100%,45% 100%,30% 95%,30% 75%,45% 70%); }
.fvm-item.helmet  { background:#6e7a8a;
  clip-path:polygon(20% 30%,50% 0,80% 30%,80% 70%,65% 90%,35% 90%,20% 70%); }
.fvm-item.armor   { background:linear-gradient(180deg,#b85a36,#6e2f15);
  clip-path:polygon(20% 10%,80% 10%,90% 30%,80% 95%,20% 95%,10% 30%); }
.fvm-item.belt    { background:#6e4a22; clip-path:polygon(0 40%,100% 40%,100% 60%,0 60%); }
.fvm-item.pants   { background:#2a2a2a;
  clip-path:polygon(20% 0,80% 0,70% 100%,55% 100%,50% 50%,45% 100%,30% 100%); }
.fvm-item.boots   { background:#4a3a18;
  clip-path:polygon(20% 20%,60% 20%,60% 65%,90% 65%,90% 95%,20% 95%); }

/* ── Streak (left col) ── */
.fvm-streak-row  { display:flex; align-items:center; gap:14px; margin-bottom:10px; }
.fvm-streak-fire { width:36px; height:42px; flex-shrink:0;
  background:radial-gradient(circle at 50% 70%,#ff7a1f 30%,#ffd24a 60%,transparent);
  clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%);
  filter:drop-shadow(0 0 8px #ff7a1f); animation:fvm-flicker .6s ease-in-out infinite alternate; }
.fvm-streak-num { font-size:24px; color:var(--fvm-gold-b); text-shadow:0 0 10px rgba(244,204,120,.4); line-height:1; }
.fvm-streak-lab { font-size:11px; color:var(--fvm-dim); letter-spacing:1.5px; display:block; margin-top:4px; }
.fvm-streak-flames { display:flex; gap:4px; margin-top:10px; flex-wrap:wrap; }
.fvm-flame-ico { width:14px; height:18px;
  background:radial-gradient(circle at 50% 70%,#ff7a1f 30%,#ffd24a 60%,transparent);
  clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%);
  filter:drop-shadow(0 0 4px #ff7a1f); animation:fvm-flicker .6s ease-in-out infinite alternate; }
.fvm-flame-ico.dim { background:var(--fvm-muted); filter:none; animation:none; opacity:.4; }
.fvm-streak-msg { margin-top:10px; font-family:'Manrope',sans-serif; font-size:14px;
  color:#8ac926; letter-spacing:.5px; text-align:center; }

/* ── CHECK-IN PANEL ── */
.fvm-ci-title { text-align:center; font-size:13px; font-weight:800; color:var(--fvm-gold-b); letter-spacing:.06em;
  text-shadow:0 0 8px rgba(244,204,120,.3); margin-bottom:8px;
  font-family:'Manrope',sans-serif; }
.fvm-ci-q { text-align:center; font-family:'Manrope',sans-serif; font-size:16px;
  color:var(--fvm-dim); letter-spacing:.5px; margin-bottom:14px; }

/* 5-col mood grid */
.fvm-mood-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:12px; }
.fvm-mood-card { position:relative; background:var(--fvm-inner);
  border:2px solid var(--mc,var(--fvm-border));
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04),0 0 0 2px #050308;
  padding:12px 6px; cursor:pointer;
  display:flex; flex-direction:column; align-items:center; gap:7px;
  transition:transform .18s,box-shadow .18s,opacity .3s; }
.fvm-mood-card.tenso   { --mc:var(--m-tenso);   --ma:var(--ma-tenso);   }
.fvm-mood-card.cansado { --mc:var(--m-cansado); --ma:var(--ma-cansado); }
.fvm-mood-card.neutro  { --mc:var(--m-neutro);  --ma:var(--ma-neutro);  }
.fvm-mood-card.bien    { --mc:var(--m-bien);    --ma:var(--ma-bien);    }
.fvm-mood-card.energia { --mc:var(--m-energia); --ma:var(--ma-energia); }
.fvm-mood-card:hover   { transform:translateY(-4px);
  box-shadow:inset 0 0 0 1px var(--mc),0 0 0 2px #050308,0 0 20px var(--ma); }
.fvm-mood-card.selected{
  box-shadow:inset 0 0 0 1px var(--mc),0 0 0 2px #050308,0 0 26px var(--ma);
  background:linear-gradient(180deg,rgba(var(--mc-r,200),var(--mc-g,155),var(--mc-b,60),.12),var(--fvm-inner)); }
.fvm-mood-card.selected::before { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:36%; height:3px; background:var(--mc);
  box-shadow:0 0 10px var(--mc); }
.fvm-mood-card.faded   { opacity:.3; filter:grayscale(.5); pointer-events:none; }

/* Pixel emoji face */
.fvm-face { width:52px; height:52px; border-radius:12px; background:var(--mc);
  box-shadow:0 0 14px var(--ma),inset 0 -4px 0 rgba(0,0,0,.2),inset 0 3px 0 rgba(255,255,255,.25);
  position:relative; }
.fvm-face .fvm-eye { position:absolute; top:32%; width:7px; height:8px; background:#1a1208; }
.fvm-face .fvm-eye.l { left:26%; }
.fvm-face .fvm-eye.r { right:26%; }
.fvm-face .fvm-mouth { position:absolute; bottom:22%; left:50%; transform:translateX(-50%); }
/* tenso */
.fvm-face.tenso .fvm-eye { height:6px; }
.fvm-face.tenso .fvm-eye.l { transform:rotate(20deg); }
.fvm-face.tenso .fvm-eye.r { transform:rotate(-20deg); }
.fvm-face.tenso .fvm-mouth { width:22px; height:8px; border-top:3px solid #1a1208; border-radius:40% 40% 0 0; }
/* cansado */
.fvm-face.cansado .fvm-eye { height:4px; top:36%; }
.fvm-face.cansado .fvm-mouth { width:16px; height:5px; border-top:3px solid #1a1208; border-radius:40% 40% 0 0; }
/* neutro */
.fvm-face.neutro .fvm-mouth { width:20px; height:3px; background:#1a1208; }
/* bien */
.fvm-face.bien .fvm-mouth { width:24px; height:10px; border-bottom:3px solid #1a1208; border-radius:0 0 50% 50%; }
/* energia */
.fvm-face.energia .fvm-mouth { width:26px; height:13px; background:#1a1208; border-radius:0 0 40% 40%; }
.fvm-face.energia .fvm-bolt { position:absolute; top:-10px; right:-8px; width:14px; height:16px;
  background:var(--fvm-gold-b);
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%);
  filter:drop-shadow(0 0 4px var(--fvm-gold-b)); }

.fvm-mood-name { font-family:'Manrope',sans-serif; font-size:11px; font-weight:800;
  color:var(--mc); letter-spacing:1px; text-shadow:0 0 6px var(--ma); text-align:center; }
.fvm-mood-desc { font-family:'Manrope',sans-serif; font-size:13px; color:var(--fvm-dim);
  text-align:center; line-height:1.1; letter-spacing:.3px; min-height:40px; }
.fvm-mood-xp { font-family:'Manrope',sans-serif; font-size:11px; color:var(--mc);
  letter-spacing:.5px; padding-top:6px;
  border-top:1px dashed rgba(255,255,255,.12); width:100%; text-align:center; }

.fvm-ci-hint { display:flex; align-items:center; justify-content:center;
  gap:8px; font-family:'Manrope',sans-serif; font-size:14px;
  color:var(--fvm-muted); letter-spacing:.5px; margin-top:8px; }
.fvm-ci-hint .fvm-i { width:14px; height:14px; border:1.5px solid var(--fvm-muted);
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-family:'Manrope',sans-serif; font-size:11px; }

/* ── FEEDBACK PANEL ── */
.fvm-feedback { border-color:var(--fb-c,var(--fvm-border)); padding:16px 18px;
  display:grid; grid-template-columns:96px 1fr; gap:18px; align-items:center;
  position:relative; overflow:hidden; animation:fvm-fb-in .4s ease-out; }
.fvm-feedback::after { content:""; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse 50% 100% at 12% 50%,var(--fb-a,transparent),transparent 70%); }
.fvm-fb-face { width:96px; height:96px; border-radius:18px; background:var(--fb-c,var(--m-bien));
  box-shadow:0 0 22px var(--fb-a),inset 0 -5px 0 rgba(0,0,0,.2),inset 0 4px 0 rgba(255,255,255,.25);
  position:relative; }
.fvm-fb-face .fvm-eye { position:absolute; top:32%; width:12px; height:13px; background:#1a1208; }
.fvm-fb-face .fvm-eye.l { left:26%; }
.fvm-fb-face .fvm-eye.r { right:26%; }
.fvm-fb-face .fvm-mouth { position:absolute; bottom:22%; left:50%; transform:translateX(-50%);
  width:42px; height:18px; border-bottom:5px solid #1a1208; border-radius:0 0 50% 50%; }
.fvm-fb-face.tenso   .fvm-mouth { border-bottom:none; border-top:5px solid #1a1208; border-radius:40% 40% 0 0; }
.fvm-fb-face.cansado .fvm-mouth { width:30px; height:10px; border-bottom:none; border-top:4px solid #1a1208; border-radius:40% 40% 0 0; }
.fvm-fb-face.neutro  .fvm-mouth { border-bottom:none; background:#1a1208; height:5px; }
.fvm-fb-face.energia .fvm-mouth { background:#1a1208; border-bottom:none; border-radius:0 0 40% 40%; height:24px; }
.fvm-fb-body { position:relative; z-index:1; }
.fvm-fb-headline { font-family:'Manrope',sans-serif; font-size:14px; font-weight:800;
  color:var(--fb-c,var(--m-bien)); letter-spacing:1px;
  text-shadow:0 0 8px var(--fb-a); margin-bottom:8px; }
.fvm-fb-text { font-family:'Manrope',sans-serif; font-size:16px; color:var(--fvm-parch);
  line-height:1.2; letter-spacing:.3px; margin-bottom:12px; }
.fvm-fb-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.fvm-fb-xp-v { font-family:'Manrope',sans-serif; font-size:13px;
  color:var(--fb-c); text-shadow:0 0 6px var(--fb-a); }
.fvm-fb-xp-l { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvm-dim); letter-spacing:1px; margin-top:4px; }
.fvm-stamp { transform:rotate(-8deg); border:3px solid #8ac926; color:#8ac926;
  padding:8px 14px; font-family:'Manrope',sans-serif; font-size:10px;
  letter-spacing:2px; text-shadow:0 0 8px rgba(138,201,38,.4);
  box-shadow:0 0 14px rgba(138,201,38,.25);
  display:flex; align-items:center; gap:8px; }
.fvm-stamp .fvm-ck { width:16px; height:16px; background:#8ac926;
  clip-path:polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%); }

/* ── Feedback aura ── */
.fvm-fb-aura { position:absolute; inset:-18px;
  background:radial-gradient(circle at 50% 50%,var(--fb-a,rgba(138,201,38,.35)),transparent 70%);
  animation:fvm-aura-pulse 2.2s ease-in-out infinite;
  pointer-events:none; }

/* ── Streak badge ── */
.fvm-streak-badge { display:flex; align-items:center; gap:6px;
  background:rgba(255,122,31,.1); border:1px solid rgba(255,122,31,.35);
  padding:4px 10px 4px 8px; border-radius:20px;
  box-shadow:0 0 12px rgba(255,122,31,.2); }
.fvm-sb-fire { display:inline-block; width:14px; height:18px;
  background:radial-gradient(circle at 50% 70%,#ff7a1f 30%,#ffd24a 60%,transparent);
  clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%);
  filter:drop-shadow(0 0 4px #ff7a1f); animation:fvm-flicker .6s ease-in-out infinite alternate; }
.fvm-sb-num { font-family:'Manrope',sans-serif; font-size:14px; font-weight:800;
  color:#ffd24a; text-shadow:0 0 8px rgba(255,210,74,.6); }
.fvm-sb-lbl { font-family:'Manrope',sans-serif; font-size:10px; font-weight:700;
  color:#ff9a4a; letter-spacing:1px; }

/* ── Enhanced mood card hover & selected ── */
.fvm-mood-card { position:relative; overflow:hidden; }
.fvm-mood-card::after { content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(135deg,rgba(255,255,255,.07) 0%,transparent 60%);
  opacity:0; transition:opacity .22s; }
.fvm-mood-card:hover::after { opacity:1; }
.fvm-mood-card:hover { transform:translateY(-5px) scale(1.03);
  box-shadow:inset 0 0 0 1px var(--mc),0 0 0 2px #050308,0 0 28px var(--ma),0 0 52px var(--ma); }
.fvm-mood-card.selected { animation:fvm-card-glow-in .5s forwards; }
.fvm-mood-card.selected::before { box-shadow:0 0 14px var(--mc); }

/* scan-line sweep on selected card */
.fvm-mood-card.selected .fvm-scan { position:absolute; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,var(--mc),transparent);
  animation:fvm-scan 1.6s linear infinite; opacity:.5; }

/* ── Chart today column highlight ── */
.fvm-bar-col.is-today { position:relative; }
.fvm-bar-col.is-today::before { content:""; position:absolute; inset:0;
  background:radial-gradient(ellipse 60% 100% at 50% 100%,rgba(244,204,120,.06),transparent);
  pointer-events:none; border-radius:4px; }
.fvm-chart-days .fvm-cd.is-today { color:var(--fvm-gold-b); text-shadow:0 0 8px rgba(244,204,120,.5); font-weight:800; }

/* ── Gratitude row & input upgrades ── */
.sc-grat-row:hover { border-color:rgba(200,155,60,.28) !important; box-shadow:0 0 12px rgba(200,155,60,.06); }
.sc-animo-input:focus { caret-color:#c89b3c; }
.sc-grat-row:focus-within { border-color:#c89b3c !important;
  box-shadow:0 0 0 2px rgba(200,155,60,.18), 0 0 18px rgba(200,155,60,.1) !important; }

/* ── CHART PANEL ── */
.fvm-chart-title { text-align:center; font-weight:800; font-family:'Manrope',sans-serif;
  font-size:11px; color:var(--fvm-mente); letter-spacing:1.5px;
  text-shadow:0 0 8px var(--fvm-mente-a); margin-bottom:14px; }
.fvm-chart-mini-stat { display:flex; flex-direction:column; align-items:flex-end; gap:1px;
  font-family:'Manrope',sans-serif; font-size:9px; letter-spacing:.8px; font-weight:700;
  padding:3px 8px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:4px; }
.fvm-chart-area { display:grid; grid-template-columns:30px 1fr; gap:8px; }
.fvm-chart-y { display:flex; flex-direction:column; justify-content:space-between;
  font-family:'Manrope',sans-serif; font-size:12px; color:var(--fvm-muted);
  text-align:right; height:200px; padding-bottom:22px; }
.fvm-chart-bars { position:relative; height:200px; display:flex;
  align-items:flex-end; justify-content:space-around; gap:8px;
  border-left:1px solid rgba(244,204,120,.15);
  border-bottom:1px solid rgba(244,204,120,.15); padding:0 6px; }
.fvm-chart-bars .fvm-gridline { position:absolute; left:0; right:0; height:1px;
  background:rgba(244,204,120,.06); }
.fvm-bar-col { flex:1; display:flex; flex-direction:column; align-items:center;
  gap:6px; height:100%; justify-content:flex-end; position:relative; z-index:1; }
.fvm-bar-fill { width:100%; max-width:42px; background:var(--bc,var(--m-bien));
  border:2px solid rgba(0,0,0,.4); box-shadow:inset 0 2px 0 rgba(255,255,255,.25),0 0 10px var(--ba);
  display:flex; align-items:flex-start; justify-content:center; padding-top:4px;
  position:relative; transition:height .6s cubic-bezier(.2,.8,.2,1); min-height:18px; }
.fvm-bar-fill.today-bar { border-color:var(--fvm-gold-b);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.25),0 0 16px var(--ba); }
.fvm-bar-face { width:22px; height:22px; border-radius:6px;
  background:rgba(255,255,255,.15); position:relative;
  box-shadow:inset 0 -2px 0 rgba(0,0,0,.2); }
.fvm-bar-face .fvm-e { position:absolute; top:30%; width:4px; height:5px; background:#1a1208; }
.fvm-bar-face .fvm-e.l { left:26%; } .fvm-bar-face .fvm-e.r { right:26%; }
.fvm-bar-face .fvm-m { position:absolute; bottom:24%; left:50%; transform:translateX(-50%); width:11px; height:5px; }
.fvm-bar-face.smile .fvm-m { border-bottom:2px solid #1a1208; border-radius:0 0 50% 50%; }
.fvm-bar-face.flat  .fvm-m { height:2px; background:#1a1208; }
.fvm-bar-face.frown .fvm-m { border-top:2px solid #1a1208; border-radius:40% 40% 0 0; height:4px; }
.fvm-chart-days { display:flex; justify-content:space-around; gap:8px;
  margin-left:38px; margin-top:6px; }
.fvm-chart-days .fvm-cd { flex:1; text-align:center; font-family:'Manrope',sans-serif;
  font-size:11px; color:var(--fvm-dim); letter-spacing:.5px; }
.fvm-chart-legend { display:flex; flex-wrap:wrap; justify-content:center;
  gap:8px; margin-top:14px; padding-top:12px;
  border-top:1px dashed rgba(244,204,120,.15); }
.fvm-legend-item { display:flex; align-items:center; gap:6px;
  padding:5px 9px; background:var(--fvm-inner); border:1px solid var(--lc);
  font-family:'Manrope',sans-serif; font-size:11px; color:var(--lc); letter-spacing:.8px; }
.fvm-legend-item .fvm-ld { width:12px; height:12px; border-radius:4px; background:var(--lc); }
.fvm-legend-item.tenso   { --lc:var(--m-tenso); }
.fvm-legend-item.cansado { --lc:var(--m-cansado); }
.fvm-legend-item.neutro  { --lc:var(--m-neutro); }
.fvm-legend-item.bien    { --lc:var(--m-bien); }
.fvm-legend-item.energia { --lc:var(--m-energia); }

/* ── RIGHT COL ── */
.fvm-reward-chest { width:110px; height:90px; margin:4px auto 12px; position:relative; }
.fvm-chest-glow { position:absolute; inset:-16px;
  background:radial-gradient(circle,var(--fvm-mente-a),transparent 65%);
  animation:fvm-chest-glow 2.4s ease-in-out infinite; }
.fvm-chest-body { position:absolute; bottom:0; width:100%; height:60%;
  background:linear-gradient(180deg,#8a5ac0,#4a2b7a); border:3px solid var(--fvm-mente);
  box-shadow:inset 0 0 0 1px #1a0a2a; }
.fvm-chest-lid  { position:absolute; top:6%; width:100%; height:40%;
  background:linear-gradient(180deg,#b06aff,#7a3ac0); border:3px solid var(--fvm-mente);
  border-radius:36% 36% 0 0; }
.fvm-chest-lock { position:absolute; top:48%; left:44%; width:12%; height:22%;
  background:var(--fvm-gold-b); box-shadow:0 0 8px rgba(244,204,120,.6); z-index:2; }
.fvm-reward-desc { font-family:'Manrope',sans-serif; font-size:14px;
  color:var(--fvm-dim); line-height:1.2; margin-bottom:12px; text-align:center; }
.fvm-reward-amounts { display:flex; justify-content:center; gap:10px; }
.fvm-reward-amt { display:flex; align-items:center; gap:8px; padding:8px 12px;
  background:var(--fvm-inner); border:2px solid var(--fvm-border); }
.fvm-ra-ic { width:16px; height:16px; }
.fvm-ra-xp { background:linear-gradient(180deg,var(--fvm-xp3),var(--fvm-xp1));
  clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.fvm-ra-gem { background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg); }
.fvm-ra-v { font-family:'Manrope',sans-serif; font-size:15px; color:var(--fvm-gold-b); }
.fvm-reward-amt.claimed { border-color:#8ac926; box-shadow:0 0 10px rgba(138,201,38,.2); }

.fvm-bigstreak-hex { width:110px; height:120px; margin:0 auto 10px;
  background:linear-gradient(180deg,rgba(176,106,255,.12),rgba(30,15,50,.4));
  border:2px solid var(--fvm-mente);
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  box-shadow:0 0 20px var(--fvm-mente-a),inset 0 0 0 1px #1a0a2a; }
.fvm-bigstreak-num { font-family:'Manrope',sans-serif; font-size:28px; font-weight:800;
  color:var(--fvm-gold-b); text-shadow:0 0 14px rgba(244,204,120,.5); line-height:1; }
.fvm-bigstreak-label { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700;
  color:var(--fvm-dim); letter-spacing:1.5px; margin-bottom:12px; line-height:1.6;
  text-align:center; }
.fvm-benefits-title { font-family:'Manrope',sans-serif; font-size:11px; font-weight:800;
  color:var(--fvm-gold-b); letter-spacing:1.2px; padding:8px 0 6px;
  border-top:1px dashed rgba(244,204,120,.18); margin-bottom:4px; }
.fvm-benefit-row { display:grid; grid-template-columns:14px 1fr auto; gap:10px;
  align-items:center; padding:5px 0; font-family:'Manrope',sans-serif;
  font-size:11px; color:var(--fvm-parch); letter-spacing:.5px; }
.fvm-bdot { width:8px; height:8px; background:var(--bd-c,var(--fvm-mente)); transform:rotate(45deg); }
.fvm-b7  { --bd-c:#4cc9f0; }
.fvm-b14 { --bd-c:var(--fvm-gold-b); }
.fvm-b30 { --bd-c:#e0455e; }
.fvm-bgain { color:#8ac926; font-family:'Manrope',sans-serif; font-size:14px; }
.fvm-benefit-row.fvm-current { color:var(--fvm-gold-b); }
.fvm-benefit-row.fvm-current .fvm-bgain { color:var(--fvm-gold-b); }

.fvm-med-wrap { position:relative; width:64px; height:56px; margin:0 auto 14px; }
.fvm-med-head { position:absolute; top:0; left:50%; transform:translateX(-50%);
  width:18px; height:18px; border-radius:50%; background:var(--fvm-mente);
  box-shadow:0 0 12px var(--fvm-mente-a); }
.fvm-med-body { position:absolute; bottom:0; left:50%; transform:translateX(-50%);
  width:56px; height:32px; background:var(--fvm-mente);
  clip-path:polygon(50% 0,70% 35%,100% 100%,0 100%,30% 35%);
  box-shadow:0 0 12px var(--fvm-mente-a); opacity:.9; }
.fvm-quote-text { font-family:'Manrope',sans-serif; font-size:17px; color:var(--fvm-parch);
  line-height:1.25; letter-spacing:.5px; font-style:italic; text-align:center; }

/* ── Bottom Nav ── */
.fvm-bottom-nav { padding:8px; display:grid; grid-template-columns:repeat(9,1fr); gap:4px; }
.fvm-nav-item { display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:9px 2px 7px; background:var(--fvm-inner); border:2px solid var(--fvm-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05);
  cursor:pointer; position:relative; transition:.15s; text-decoration:none; color:inherit; }
.fvm-nav-item:hover { border-color:var(--fvm-gold-s);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.18),0 0 12px rgba(244,204,120,.15);
  transform:translateY(-2px); }
.fvm-nav-item.active { border-color:var(--fvm-mente);
  box-shadow:inset 0 0 0 1px var(--fvm-mente),0 0 16px var(--fvm-mente-a);
  background:linear-gradient(180deg,rgba(176,106,255,.1),rgba(176,106,255,.01)); }
.fvm-nav-item.active::after { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:30%; height:3px;
  background:var(--fvm-mente); box-shadow:0 0 10px var(--fvm-mente); }
.fvm-nav-icon { width:26px; height:26px; display:flex; align-items:center; justify-content:center; }
.fvm-ng { width:19px; height:19px; }
.fvm-ng-map      { background:linear-gradient(180deg,#d4a44a,#6e4f1f);
  clip-path:polygon(0 10%,33% 0,66% 10%,100% 0,100% 90%,66% 100%,33% 90%,0 100%); }
.fvm-ng-char     { background:linear-gradient(180deg,#b8c0ff,#4a55a0);
  clip-path:polygon(50% 0,90% 30%,90% 70%,50% 100%,10% 70%,10% 30%); }
.fvm-ng-exercise { background:#e0455e;
  clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); }
.fvm-ng-routine  { background:linear-gradient(180deg,#f4cc78,#c89b3c);
  clip-path:polygon(15% 0,85% 0,100% 15%,100% 85%,85% 100%,15% 100%,0 85%,0 15%); }
.fvm-ng-mission  { background:linear-gradient(180deg,#f4cc78,#c89b3c);
  clip-path:polygon(20% 0,80% 0,80% 50%,65% 70%,65% 80%,80% 80%,80% 100%,20% 100%,20% 80%,35% 80%,35% 70%,20% 50%); }
.fvm-ng-trophy   { background:linear-gradient(180deg,#f4cc78,#c89b3c);
  clip-path:polygon(20% 0,80% 0,85% 18%,100% 22%,95% 40%,75% 50%,65% 65%,65% 78%,80% 78%,80% 100%,20% 100%,20% 78%,35% 78%,35% 65%,25% 50%,5% 40%,0 22%,15% 18%); }
.fvm-ng-shop     { background:linear-gradient(180deg,#ffcd6a,#c89b3c);
  clip-path:polygon(0 35%,15% 5%,85% 5%,100% 35%,90% 95%,10% 95%); }
.fvm-ng-brain    { background:linear-gradient(180deg,#c89bff,#b06aff);
  clip-path:polygon(30% 0,50% 8%,70% 0,88% 18%,92% 45%,82% 60%,88% 80%,65% 100%,50% 90%,35% 100%,12% 80%,18% 60%,8% 45%,12% 18%);
  box-shadow:0 0 8px var(--fvm-mente-a); }
.fvm-ng-chat     { background:linear-gradient(180deg,#f4cc78,#c89b3c);
  clip-path:polygon(0 0,100% 0,100% 70%,35% 70%,15% 100%,15% 70%,0 70%); }
.fvm-nav-label { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700;
  letter-spacing:.5px; color:var(--fvm-dim); }
.fvm-nav-item.active .fvm-nav-label { color:var(--fvm-mente); }

/* ── Tab bar ── */
.fvm-tabbar { display:flex; gap:0; overflow-x:auto; scrollbar-width:none;
  background:linear-gradient(180deg,var(--fvm-bg1),var(--fvm-bg2));
  border:2px solid var(--fvm-border);
  box-shadow:0 0 0 3px #050308,0 0 0 4px var(--fvm-border2);
  position:relative; }
.fvm-tabbar::-webkit-scrollbar { display:none; }
.fvm-tabbar::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); top:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-tabbar::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); top:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-tabbar-btn { transition:all .18s ease; cursor:pointer; border:none; outline:none; flex-shrink:0;
  display:flex; align-items:center; gap:7px; padding:12px 16px;
  background:transparent; color:var(--fvm-muted);
  border-bottom:2px solid transparent;
  font-family:'Manrope',sans-serif; font-size:11px; letter-spacing:.5px;
  position:relative; }
.fvm-tabbar-btn:hover { background:rgba(176,106,255,.05); color:var(--fvm-text); }
.fvm-tabbar-btn.active { color:var(--fvm-tb-c,var(--fvm-mente));
  border-bottom-color:var(--fvm-tb-c,var(--fvm-mente));
  background:rgba(176,106,255,.06);
  text-shadow:0 0 8px var(--fvm-tb-c,var(--fvm-mente)); }
.fvm-tabbar-btn .fvm-done-dot { position:absolute; top:8px; right:8px;
  width:5px; height:5px; border-radius:50%; background:#8ac926;
  box-shadow:0 0 5px #8ac926; }
.fvm-tab-badge { font-family:'Manrope',sans-serif; font-size:11px;
  background:var(--fvm-mente); color:var(--fvm-bg); padding:1px 5px; border-radius:2px; }

/* ── Tab content panel ── */
.fvm-tab-panel { background:linear-gradient(180deg,var(--fvm-bg1),var(--fvm-bg2));
  border:2px solid var(--fvm-border); border-top:none;
  box-shadow:0 0 0 3px #050308,0 0 0 4px var(--fvm-border2);
  padding:22px 20px; position:relative; overflow:hidden;
  min-height:420px; }
.fvm-tab-panel::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); bottom:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-tab-panel::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); bottom:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }

/* ── Progress board ── */
.fvm-progress-board { padding:14px 16px; margin-bottom:0;
  background:linear-gradient(180deg,var(--fvm-bg1),var(--fvm-bg2));
  border:2px solid var(--fvm-border);
  box-shadow:0 0 0 3px #050308,0 0 0 4px var(--fvm-border2);
  position:relative; }
.fvm-progress-board::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); top:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-progress-board::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvm-gold); top:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvm-pb-title { font-family:'Manrope',sans-serif; font-size:11px; font-weight:800;
  color:var(--fvm-gold-b); letter-spacing:.5px; margin-bottom:10px; }
.fvm-pb-bar   { height:5px; background:var(--fvm-inner);
  border:1px solid var(--fvm-border); border-radius:1px; overflow:hidden; margin-bottom:4px; }
.fvm-pb-fill  { height:100%; background:linear-gradient(90deg,#b06aff,var(--fvm-gold));
  box-shadow:0 0 6px #b06aff55; transition:width .9s; }
.fvm-pb-chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.fvm-pb-chip  { display:flex; align-items:center; gap:5px; padding:5px 10px;
  background:var(--fvm-inner); border:1px solid var(--fvm-border);
  font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvm-muted); cursor:pointer; transition:.15s; }
.fvm-pb-chip.done { border-color:var(--fvm-chip-c,#8ac926); color:var(--fvm-chip-c,#8ac926);
  background:rgba(138,201,38,.08); }
.fvm-pb-chip:hover { border-color:var(--fvm-gold-s); }
.fvm-pb-check { width:8px; height:8px; background:#8ac926;
  clip-path:polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%); flex-shrink:0; }

/* ── RESPIRACION (fvr-) ── */
/* Phase accent vars: set via inline --pc / --pa */
:root {
  --pc-inhala:#b06aff; --pa-inhala:rgba(176,106,255,.55);
  --pc-reten: #ffb13a; --pa-reten: rgba(255,177,58,.5);
  --pc-exhala:#4cc9f0; --pa-exhala:rgba(76,201,240,.5);
  --pc-pausa: #8ac926; --pa-pausa: rgba(138,201,38,.5);
}
@keyframes fvr-ring-pulse { 0%{transform:scale(.6);opacity:.6} 100%{transform:scale(1.25);opacity:0} }
@keyframes fvr-node-pulse  { 50%{box-shadow:0 0 26px rgba(244,204,120,.8)} }
@keyframes fvr-chest-glow  { 50%{opacity:.5} }
@keyframes fvr-flicker     { 100%{transform:scaleY(1.12) scaleX(.92)} }

/* SECTIONS nav */
.fvr-sections { padding:14px 16px; }
.fvr-sec-item { display:grid; grid-template-columns:22px 1fr; gap:12px;
  align-items:center; padding:9px 10px; margin-bottom:5px;
  background:var(--fvm-inner); border:2px solid var(--fvm-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04);
  cursor:pointer; transition:.15s; font-family:'Manrope',sans-serif;
  font-size:11px; color:var(--fvm-muted); letter-spacing:.5px; text-decoration:none; }
.fvr-sec-item:last-child { margin-bottom:0; }
.fvr-sec-item:hover { border-color:var(--fvm-gold-s); color:var(--fvm-gold-b); transform:translateX(2px); }
.fvr-sec-item.active { border-color:var(--fvm-mente); color:var(--fvm-mente);
  background:linear-gradient(180deg,rgba(176,106,255,.1),rgba(176,106,255,.01));
  box-shadow:inset 0 0 0 1px var(--fvm-mente-a),0 0 12px var(--fvm-mente-a); }
.fvr-si { width:18px; height:18px; flex-shrink:0; }
.fvr-si-animo  { background:#8ac926; clip-path:polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%); }
.fvr-si-resp   { background:var(--fvm-mente); border-radius:50% 50% 45% 45%; }
.fvr-si-medit  { background:#c08aff; clip-path:polygon(50% 0,62% 16%,50% 30%,38% 16%); }
.fvr-si-visual { background:#4cc9f0; border-radius:50%; }
.fvr-si-enfoque{ background:#ffb13a; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.fvr-si-diario { background:var(--fvm-gold-s); clip-path:polygon(0 0,85% 0,100% 15%,100% 100%,0 100%); }
.fvr-si-perma  { background:#4cc9f0; clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%); }

/* ── PERMA RPG sliders ── */
.fvp-slider { -webkit-appearance:none; appearance:none; width:100%; height:8px;
  background:#050308; border:1px solid #000; box-shadow:inset 0 0 0 1px #2a1f3d;
  outline:none; cursor:pointer; margin-bottom:6px; }
.fvp-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none;
  width:16px; height:18px; background:var(--fvp-c,#b06aff); border:2px solid #1a1208;
  box-shadow:0 0 8px var(--fvp-a,rgba(176,106,255,.5)); cursor:pointer; }
.fvp-slider::-moz-range-thumb { width:16px; height:18px; background:var(--fvp-c,#b06aff);
  border:2px solid #1a1208; box-shadow:0 0 8px var(--fvp-a,rgba(176,106,255,.5));
  cursor:pointer; border-radius:0; }
.fvp-slider:disabled { opacity:.5; cursor:default; }

/* ── AFIRMACIONES RPG (fva-) ── */
.fvr-si-afirm  { background:var(--fvm-gold-b); clip-path:polygon(15% 5%,85% 5%,95% 95%,5% 95%); }

.fva-flip-inner { position:relative; width:100%; height:100%;
  transition:transform .7s cubic-bezier(.4,.2,.2,1); transform-style:preserve-3d; }
.fva-flip-inner.flipped { transform:rotateY(180deg); }
.fva-face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  display:flex; flex-direction:column; overflow:hidden; }
.fva-back { transform:rotateY(180deg); }
.fva-tap-hint { animation:fva-tap 1.6s ease-in-out infinite; }
@keyframes fva-tap { 50%{opacity:.4} }

.fva-ind-node { width:34px; height:34px; flex-shrink:0; background:var(--fvm-inner);
  border:2px solid var(--fvm-border); transform:rotate(45deg);
  display:flex; align-items:center; justify-content:center; transition:.3s; cursor:pointer; }
.fva-ind-node span { transform:rotate(-45deg); font-family:'Manrope',sans-serif;
  font-size:11px; }
.fva-ind-node.done { background:linear-gradient(180deg,#8ac926,#4a8a13); border-color:#8ac926;
  box-shadow:0 0 12px rgba(138,201,38,.5); }
.fva-ind-node.done span { color:#fff; }
.fva-ind-link { flex:1; max-width:58px; height:4px; background:var(--fvm-border); position:relative; }
.fva-ind-link .lf { position:absolute; inset:0; width:0; background:#8ac926;
  box-shadow:0 0 8px rgba(138,201,38,.5); transition:width .4s; }

.fva-prog-card { display:grid; grid-template-columns:24px 1fr 16px; gap:10px;
  align-items:center; padding:8px 10px; margin-bottom:6px;
  background:var(--fvm-inner); border:2px solid var(--fvm-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04);
  cursor:pointer; transition:.15s; }
.fva-prog-card:last-child { margin-bottom:0; }
.fva-prog-card:hover { border-color:var(--fvm-gold-s); transform:translateX(2px); }
.fva-prog-card.active { border-color:var(--fvm-mente);
  box-shadow:inset 0 0 0 1px var(--fvm-mente-a),0 0 10px var(--fvm-mente-a); }
.fva-prog-card.done  { border-color:rgba(138,201,38,.4); }
.fva-pc-num { width:22px; height:22px; background:#14101e; border:1px solid var(--fvm-border2);
  display:flex; align-items:center; justify-content:center; transform:rotate(45deg); }
.fva-pc-num span { transform:rotate(-45deg); font-family:'Manrope',sans-serif;
  font-size:11px; color:var(--fvm-gold-s); }
.fva-prog-card.done  .fva-pc-num { background:linear-gradient(180deg,#8ac926,#4a8a13); border-color:#8ac926; }
.fva-prog-card.done  .fva-pc-num span { color:#fff; }
.fva-prog-card.active .fva-pc-num { border-color:var(--fvm-mente); }
.fva-prog-card.active .fva-pc-num span { color:var(--fvm-mente); }

/* TECH CARDS */
.fvr-tech-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:10px; }
.fvr-tech-card { position:relative; background:var(--fvm-inner);
  border:2px solid var(--tc,var(--fvm-border));
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04),0 0 0 2px #050308;
  padding:14px 12px; cursor:pointer; text-align:center;
  transition:transform .15s,box-shadow .15s;
  display:flex; flex-direction:column; align-items:center; gap:8px; }
.fvr-tech-card.box-m    { --tc:var(--fvm-mente); --tca:var(--fvm-mente-a); }
.fvr-tech-card.weil-m   { --tc:#4cc9f0; --tca:rgba(76,201,240,.5); }
.fvr-tech-card.energy-m { --tc:#ffb13a; --tca:rgba(255,177,58,.5); }
.fvr-tech-card:hover { transform:translateY(-3px);
  box-shadow:inset 0 0 0 1px var(--tc),0 0 0 2px #050308,0 0 18px var(--tca); }
.fvr-tech-card.active { box-shadow:inset 0 0 0 1px var(--tc),0 0 0 2px #050308,0 0 24px var(--tca);
  background:linear-gradient(180deg,rgba(0,0,0,0) 0%,var(--fvm-inner) 100%); }
.fvr-tech-card.active::before { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:36%; height:3px;
  background:var(--tc); box-shadow:0 0 10px var(--tc); }
.fvr-tc-name    { font-family:'Manrope',sans-serif; font-size:11px; font-weight:800;
  color:var(--tc); letter-spacing:1px; text-shadow:0 0 6px var(--tca); }
.fvr-tc-pattern { font-family:'Manrope',sans-serif; font-size:18px;
  color:var(--fvm-parch); letter-spacing:2px; }
.fvr-tc-ico     { width:38px; height:38px; display:flex; align-items:center; justify-content:center;
  margin:2px 0; }
.fvr-box-g { width:30px; height:30px; border:3px solid var(--fvm-mente);
  box-shadow:0 0 10px var(--fvm-mente-a); position:relative; }
.fvr-box-g::before,.fvr-box-g::after { content:""; position:absolute; width:6px; height:6px; background:var(--fvm-mente); }
.fvr-box-g::before { top:-4px; left:-4px; box-shadow:28px 0 0 var(--fvm-mente); }
.fvr-box-g::after  { bottom:-4px; left:-4px; box-shadow:28px 0 0 var(--fvm-mente); }
.fvr-spiral { width:30px; height:30px; border-radius:50%;
  border:3px solid #4cc9f0; border-right-color:transparent; border-bottom-color:transparent;
  box-shadow:0 0 10px rgba(76,201,240,.5); position:relative; }
.fvr-spiral::after { content:""; position:absolute; inset:7px; border-radius:50%;
  border:2px solid #4cc9f0; border-right-color:transparent; }
.fvr-bolt { width:22px; height:32px; background:#ffb13a;
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%);
  filter:drop-shadow(0 0 8px rgba(255,177,58,.6)); }
.fvr-tc-desc { font-family:'Manrope',sans-serif; font-size:13px; color:var(--fvm-dim); line-height:1.15; }

/* ORB */
.fvr-orb-stage { position:relative; display:flex; align-items:center; justify-content:center;
  min-height:300px; margin:6px 0; }
.fvr-orb-rings { position:absolute; width:300px; height:300px; left:50%; top:50%;
  transform:translate(-50%,-50%); pointer-events:none; }
.fvr-orb-ring { position:absolute; inset:0;
  border:2px solid var(--pc,var(--fvm-mente)); border-radius:50%; opacity:0; }
.fvr-orb-ring.r1 { animation:fvr-ring-pulse 2.6s ease-out infinite; }
.fvr-orb-ring.r2 { animation:fvr-ring-pulse 2.6s ease-out .8s infinite; }
.fvr-orb-ring.r3 { animation:fvr-ring-pulse 2.6s ease-out 1.6s infinite; }
.fvr-orb-wrap { position:relative; width:280px; height:280px;
  display:flex; align-items:center; justify-content:center; }
.fvr-orb { position:relative; border-radius:50%;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
  transition:transform .4s ease-in-out,background .8s,box-shadow .8s,width .4s,height .4s; }
.fvr-orb .fvr-craters { position:absolute; inset:0; border-radius:50%; overflow:hidden; opacity:.25; }
.fvr-orb .fvr-craters::before { content:""; position:absolute; width:30px; height:30px;
  border-radius:50%; background:rgba(0,0,0,.4); top:30%; left:22%;
  box-shadow:60px 40px 0 -6px rgba(0,0,0,.4),30px 90px 0 -10px rgba(0,0,0,.4); }
.fvr-phase-name  { font-family:'Manrope',sans-serif; font-size:18px; color:#fff;
  letter-spacing:2px; text-shadow:0 0 12px rgba(0,0,0,.6); position:relative; z-index:2; }
.fvr-phase-count { font-family:'Manrope',sans-serif; font-size:38px; color:#fff;
  line-height:.9; text-shadow:0 0 14px rgba(0,0,0,.6); position:relative; z-index:2; }
.fvr-phase-idle  { font-family:'Manrope',sans-serif; font-size:11px; color:rgba(255,255,255,.85);
  letter-spacing:1.5px; text-shadow:0 0 10px rgba(0,0,0,.6); position:relative; z-index:2;
  text-align:center; padding:0 20px; line-height:1.5; }
.fvr-orb-cue { text-align:center; font-family:'Manrope',sans-serif; font-size:16px;
  color:var(--fvm-dim); letter-spacing:.5px; margin:8px 0 12px; min-height:22px;
  transition:color .4s; }

/* Controls */
.fvr-control-row { display:flex; gap:12px; justify-content:center; align-items:center; }
.fvr-start-btn { flex:1; max-width:340px; font-family:'Manrope',sans-serif; font-size:11px;
  padding:16px; background:linear-gradient(180deg,#6a3da0,#2f1a55); color:#f0d4ff;
  border:2px solid var(--fvm-mente);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.15),inset 0 -2px 0 rgba(0,0,0,.4),0 0 18px var(--fvm-mente-a);
  cursor:pointer; letter-spacing:2px; text-shadow:0 1px 0 rgba(0,0,0,.5);
  transition:.1s; display:flex; align-items:center; justify-content:center; gap:12px; }
.fvr-start-btn:hover { background:linear-gradient(180deg,#7d4dba,#3f2470); transform:translateY(-1px);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.25),inset 0 -2px 0 rgba(0,0,0,.4),0 0 28px var(--fvm-mente-a); }
.fvr-start-btn:active { transform:translateY(1px); }
.fvr-play-tri { width:0; height:0; border-left:12px solid var(--fvm-gold-b);
  border-top:8px solid transparent; border-bottom:8px solid transparent; }
.fvr-pause-btn { width:56px; height:56px; background:var(--fvm-inner);
  border:2px solid var(--fvm-border); cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:4px; transition:.1s; }
.fvr-pause-btn:hover { border-color:var(--fvm-mente); box-shadow:0 0 12px var(--fvm-mente-a); }
.fvr-pause-bar { width:6px; height:22px; background:var(--fvm-mente); }

/* Cycle progress */
.fvr-cycle-progress { padding:14px 18px; display:grid;
  grid-template-columns:1fr auto; gap:18px; align-items:center; }
.fvr-cp-track { display:flex; align-items:center; gap:0; }
.fvr-cp-node { width:40px; height:40px; flex-shrink:0;
  background:var(--fvm-inner); border:2px solid var(--fvm-border);
  transform:rotate(45deg); display:flex; align-items:center; justify-content:center;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05); transition:.3s; }
.fvr-cp-node span { transform:rotate(-45deg); font-family:'Manrope',sans-serif;
  font-size:11px; color:var(--fvm-muted); }
.fvr-cp-node.done { background:linear-gradient(180deg,var(--fvm-mente),var(--fvm-xp1));
  border-color:var(--fvm-mente); box-shadow:0 0 14px var(--fvm-mente-a); }
.fvr-cp-node.done span { color:#fff; }
.fvr-cp-node.current { border-color:var(--fvm-gold-b);
  box-shadow:0 0 16px rgba(244,204,120,.5); animation:fvr-node-pulse 1.6s ease-in-out infinite; }
.fvr-cp-node.current span { color:var(--fvm-gold-b); }
.fvr-cp-link { flex:1; height:4px; background:var(--fvm-border); position:relative; }
.fvr-cp-link-fill { position:absolute; inset:0; width:0;
  background:var(--fvm-mente); box-shadow:0 0 8px var(--fvm-mente-a); transition:width .5s; }
.fvr-cp-label { text-align:right; }
.fvr-cp-title { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700;
  color:var(--fvm-dim); letter-spacing:1px; margin-bottom:4px; }
.fvr-cp-count { font-family:'Manrope',sans-serif; font-size:16px;
  color:var(--fvm-gold-b); text-shadow:0 0 8px rgba(244,204,120,.3); }
.fvr-cp-total { color:var(--fvm-dim); font-size:12px; }
.fvr-cp-done  { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700;
  color:var(--fvm-dim); letter-spacing:1px; margin-top:4px; }

/* RIGHT: tech info */
.fvr-ti-name { text-align:center; font-family:'Manrope',sans-serif; font-size:13px; font-weight:800;
  color:var(--fvm-mente); letter-spacing:1.5px; text-shadow:0 0 8px var(--fvm-mente-a);
  margin-bottom:12px; }
.fvr-phase-row { display:grid; grid-template-columns:18px 1fr auto; gap:10px;
  align-items:center; padding:8px 4px;
  border-bottom:1px dashed rgba(244,204,120,.1); }
.fvr-phase-row:last-of-type { border-bottom:0; }
.fvr-pr-ico { width:14px; height:14px; flex-shrink:0; }
.fvr-pr-ico.inhala { background:var(--pc-inhala);
  clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); box-shadow:0 0 6px var(--pa-inhala); }
.fvr-pr-ico.reten  { background:var(--pc-reten);
  border:2px solid #1a1208; box-shadow:0 0 6px var(--pa-reten); }
.fvr-pr-ico.exhala { background:var(--pc-exhala);
  clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); box-shadow:0 0 6px var(--pa-exhala); }
.fvr-pr-ico.pausa  { background:var(--pc-pausa);
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%);
  box-shadow:0 0 6px var(--pa-pausa); }
.fvr-pr-name { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700; color:var(--fvm-parch); letter-spacing:.04em; }
.fvr-phase-row.inhala .fvr-pr-name { color:var(--pc-inhala); }
.fvr-phase-row.reten  .fvr-pr-name { color:var(--pc-reten); }
.fvr-phase-row.exhala .fvr-pr-name { color:var(--pc-exhala); }
.fvr-phase-row.pausa  .fvr-pr-name { color:var(--pc-pausa); }
.fvr-pr-sec { font-family:'Manrope',sans-serif; font-size:15px; color:var(--fvm-gold-b); }
.fvr-ti-cycle { text-align:center; margin-top:12px; padding-top:10px;
  border-top:1px dashed rgba(244,204,120,.18); }
.fvr-ti-cycle-lab { font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvm-dim); letter-spacing:1.5px; margin-bottom:6px; }
.fvr-ti-cycle-v { font-family:'Manrope',sans-serif; font-size:18px;
  color:var(--fvm-mente); text-shadow:0 0 8px var(--fvm-mente-a); }

/* RIGHT: reward & benefits */
.fvr-reward-chest { width:96px; height:80px; margin:4px auto 12px; position:relative; }
.fvr-chest-glow   { position:absolute; inset:-16px;
  background:radial-gradient(circle,var(--fvm-mente-a),transparent 65%);
  animation:fvr-chest-glow 2.4s ease-in-out infinite; }
.fvr-chest-body { position:absolute; bottom:0; width:100%; height:60%;
  background:linear-gradient(180deg,#8a5ac0,#4a2b7a); border:3px solid var(--fvm-mente); }
.fvr-chest-lid  { position:absolute; top:6%; width:100%; height:40%;
  background:linear-gradient(180deg,#b06aff,#7a3ac0); border:3px solid var(--fvm-mente);
  border-radius:36% 36% 0 0; }
.fvr-chest-lock { position:absolute; top:46%; left:44%; width:12%; height:22%;
  background:var(--fvm-gold-b); box-shadow:0 0 8px rgba(244,204,120,.6); z-index:2; }
.fvr-reward-xp { font-family:'Manrope',sans-serif; font-size:15px; font-weight:800;
  color:var(--fvm-gold-b); letter-spacing:1px; text-shadow:0 0 8px rgba(244,204,120,.4);
  display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:6px; }
.fvr-xp-tag { font-family:'Manrope',sans-serif; font-size:11px; font-weight:700;
  border:1px solid var(--fvm-gold-s); padding:2px 4px; color:var(--fvm-gold-s); }
.fvr-reward-desc { font-family:'Manrope',sans-serif; font-size:14px; color:var(--fvm-dim); text-align:center; }
.fvr-benefit-row { display:grid; grid-template-columns:18px 1fr; gap:10px;
  align-items:center; padding:7px 4px;
  font-family:'Manrope',sans-serif; font-size:11px;
  color:var(--fvm-parch); letter-spacing:.5px; }
.fvr-bi { width:14px; height:14px; border:1.5px solid var(--fvm-mente); border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 0 6px var(--fvm-mente-a); position:relative; flex-shrink:0; }
.fvr-bi::after { content:""; width:5px; height:5px; background:var(--fvm-mente); border-radius:50%; }
.fvr-bi.b2 { border-color:#4cc9f0; box-shadow:0 0 6px rgba(76,201,240,.4); }
.fvr-bi.b2::after { background:#4cc9f0; }
.fvr-bi.b3 { border-color:#ffb13a; box-shadow:0 0 6px rgba(255,177,58,.4); }
.fvr-bi.b3::after { background:#ffb13a; }
.fvr-bi.b4 { border-color:var(--fvm-gold-b); }
.fvr-bi.b4::after { background:var(--fvm-gold-b); }

/* Spinner */
.fvm-spinner { width:20px; height:20px; border:2px solid rgba(176,106,255,.2);
  border-top-color:var(--fvm-mente); border-radius:50%;
  animation:fvm-spin .7s linear infinite; display:inline-block; }

/* Legacy sc- compat for other tabs */
.sc-section-card { background:#161122; border:1px solid #2a1f3d;
  border-radius:4px; box-shadow:0 4px 24px rgba(0,0,0,.35); }
.sc-animo-input { outline:none; background:transparent; border:none; width:100%;
  font-family:'Manrope',sans-serif; font-size:16px; font-weight:500; color:#e8dcc4;
  caret-color:#c89b3c; line-height:1.6; }
.sc-animo-input::placeholder { color:#5e5269; }
.sc-mood-btn { transition:all .22s ease; cursor:pointer; user-select:none;
  background:#161122; border:2px solid #2a1f3d; border-radius:4px;
  display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 10px; outline:none; }
.sc-mood-btn:hover:not(:disabled) { transform:translateY(-4px); }
.sc-grat-row { background:#0a0712; border:1px solid #2a1f3d; border-radius:4px;
  transition:border-color .22s,box-shadow .22s; }
.sc-grat-row:hover { border-color:rgba(200,155,60,.28) !important; }
.sc-grat-row:focus-within { border-color:#c89b3c !important;
  box-shadow:0 0 0 2px rgba(200,155,60,.18),0 0 20px rgba(200,155,60,.08) !important; }
.sc-chip { transition:all .18s ease; cursor:pointer; }
.sc-chip:hover { opacity:.82; transform:translateY(-1px); }
.fvm-grat-card { position:relative; overflow:hidden; }
.fvm-grat-card::before { content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(74,157,143,.5),transparent); pointer-events:none; }
.fvm-grat-save-active::after { content:""; position:absolute; inset:0; pointer-events:none;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.15); border-radius:10px; }
.fvm-btn-shimmer { position:absolute; top:0; left:-60%; width:40%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
  animation:fvm-shimmer 2.2s ease-in-out infinite; pointer-events:none; }
.sc-breath-grid { display:grid; grid-template-columns:1fr 290px; gap:24px; align-items:start; }
.sc-breath-mode-btn { transition:all .22s ease; cursor:pointer; text-align:left; outline:none; }
.sc-breath-mode-btn:hover:not(:disabled) { transform:translateY(-2px); }
.sc-breath-phase-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
.sc-breath-card { background:#161122; border:1px solid #2a1f3d; border-radius:4px;
  box-shadow:0 4px 24px rgba(0,0,0,.35); }
.sc-breath-class-badge { display:inline-flex; align-items:center; gap:5px;
  font-family:'Manrope',sans-serif; font-size:10px; font-weight:800; letter-spacing:.08em;
  padding:3px 10px; border:1px solid; border-radius:12px; transition:all .22s; }
.sc-perma-grid { display:grid; grid-template-columns:auto 1fr; gap:28px; align-items:start; }
.sc-perma-chip { transition:all .22s ease; cursor:pointer; outline:none; }
.sc-perma-chip:hover { transform:translateY(-2px); }
.sc-perma-slider { width:100%; cursor:pointer; height:20px; margin:0; outline:none; background:transparent; appearance:none; -webkit-appearance:none; }
.sc-perma-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:16px; height:16px; border-radius:50%; background:currentColor; cursor:pointer; border:2.5px solid #161122; box-shadow:0 0 0 3px color-mix(in srgb, currentColor 22%, transparent), 0 0 14px currentColor, 0 0 28px color-mix(in srgb, currentColor 40%, transparent); margin-top:-6px; transition:box-shadow .18s ease, transform .15s ease; }
.sc-perma-slider:active::-webkit-slider-thumb { transform:scale(1.18); box-shadow:0 0 0 5px color-mix(in srgb, currentColor 28%, transparent), 0 0 20px currentColor, 0 0 40px color-mix(in srgb, currentColor 55%, transparent); }
.sc-perma-slider::-webkit-slider-runnable-track { height:4px; border-radius:4px; background:#2a1f3d; }
.sc-perma-slider::-moz-range-thumb { width:16px; height:16px; border-radius:50%; background:currentColor; cursor:pointer; border:2.5px solid #161122; box-shadow:0 0 0 3px color-mix(in srgb, currentColor 22%, transparent), 0 0 14px currentColor; }
.sc-perma-slider::-moz-range-track { height:4px; border-radius:4px; background:#2a1f3d; }
.sc-perma-slider:focus-visible::-webkit-slider-thumb { outline:2px solid currentColor; outline-offset:3px; }
.sc-aff-grid { display:grid; grid-template-columns:1fr 258px; gap:22px; align-items:start; }
.sc-aff-card-row { display:flex; flex-direction:column; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:4px; cursor:pointer; transition:all .18s ease; }
.sc-aff-card-row:hover { background:#2a1f3d18; }
.sc-insights-grid { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }
.sc-ins-stat { transition:background .2s,box-shadow .2s; cursor:default; }
.sc-ins-stat:hover { background:var(--ins-c,#4cc9f0)0a !important; box-shadow:inset 0 -2px 0 var(--ins-c,#4cc9f0)44 !important; }
.sc-ins-insight { transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease; }
.sc-ins-insight:hover { transform:translateY(-3px) !important; box-shadow:0 8px 28px rgba(0,0,0,.35),0 0 0 1px var(--ins-ic,#4cc9f0)22 !important; border-color:var(--ins-ic,#4cc9f0)44 !important; }
.sc-ins-first { position:relative; overflow:hidden; }
.sc-ins-first::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--ins-ic,#4cc9f0)66,transparent); pointer-events:none; }
.sc-comm-bar { transition:background .18s; }
.sc-comm-bar:hover { background:rgba(255,255,255,.03) !important; }
.sc-comm-str-row { transition:background .18s ease,transform .18s ease; }
.sc-comm-str-row:hover { background:var(--comm-c,#4a9d8f)0a !important; transform:translateX(3px) !important; }
.sc-result-grid { display:grid; grid-template-columns:1.4fr 1fr; gap:16px; align-items:start; }
.sc-strength-opt { transition:border-color .18s ease,background .18s ease,transform .18s ease,box-shadow .18s ease; cursor:pointer; position:relative; overflow:hidden; }
.sc-strength-opt:hover:not(:disabled) { border-color:var(--str-gold,#c89b3c)55 !important; background:var(--str-gold,#c89b3c)0a !important; box-shadow:inset 3px 0 0 var(--str-gold,#c89b3c)88, 0 4px 16px rgba(0,0,0,.2) !important; transform:translateX(5px) !important; }
.sc-strength-opt::after { content:""; position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; background:linear-gradient(90deg,var(--str-gold,#c89b3c)08,transparent 40%); opacity:0; transition:opacity .22s; }
.sc-strength-opt:hover::after { opacity:1; }
.sc-str-winner { position:relative; overflow:hidden; }
.sc-str-winner-aura { position:absolute; inset:-30%; border-radius:50%; background:radial-gradient(circle,var(--str-wc,#c89b3c)18,transparent 65%); animation:fvm-aura-pulse 2.8s ease-in-out infinite; pointer-events:none; }
.sc-str-icon-ring { animation:fvm-aura-pulse 2.2s ease-in-out infinite; }
.sc-str-2nd { transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease !important; }
.sc-str-2nd:hover { box-shadow:0 6px 22px var(--str-c,#4cc9f0)1e, inset 0 0 0 1px var(--str-c,#4cc9f0)33 !important; transform:translateX(5px) !important; }
.sc-str-prog-seg { transition:background .3s,box-shadow .3s; }
.sc-str-prog-seg.is-done { box-shadow:0 0 6px var(--str-gold,#c89b3c)88; }
.sc-str-prog-seg.is-current { box-shadow:0 0 10px var(--str-gold,#c89b3c); animation:sc-seg-pulse 1.4s ease-in-out infinite; }
@keyframes sc-seg-pulse { 0%,100%{box-shadow:0 0 8px var(--str-gold,#c89b3c)} 50%{box-shadow:0 0 16px var(--str-gold,#c89b3c),0 0 28px var(--str-gold,#c89b3c)66} }
.sc-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
@media (max-width:860px) { .sc-stats-grid { grid-template-columns:1fr 1fr !important; } }
@media (max-width:720px) { .sc-breath-grid,.sc-perma-grid,.sc-aff-grid,.sc-result-grid,.sc-insights-grid { grid-template-columns:1fr !important; } }
.sc-tabbar { display:flex; gap:0; overflow-x:auto; scrollbar-width:none; }
.sc-tabbar::-webkit-scrollbar { display:none; }
.sc-tabbar-btn { transition:all .18s ease; cursor:pointer; border:none; outline:none; flex-shrink:0; }
.sc-tabbar-btn:hover { background:rgba(176,106,255,0.07) !important; color:#e8dcc4 !important; }
.mm-skel { background:linear-gradient(90deg,#161122 25%,#2a1f3d55 50%,#161122 75%); background-size:300px 100%; animation:mm-shimmer 1.4s infinite linear; border-radius:4px; }
@keyframes mm-shimmer { 0%{background-position:-300px 0} 100%{background-position:300px 0} }
.mm-mood-btn { transition:all .22s cubic-bezier(.34,1.56,.64,1); cursor:pointer; user-select:none; }
.mm-mood-btn:hover:not(:disabled) { transform:scale(1.18) translateY(-5px); }
.mm-tab { transition:all .2s; cursor:pointer; user-select:none; }
.mm-tab:hover { filter:brightness(1.15); }
.mm-aff-card { perspective:900px; cursor:pointer; border-radius:12px; }
.mm-aff-card:hover .mm-aff-face:not(.mm-aff-back) { box-shadow:0 0 0 1px var(--aff-c,#c08aff)33, 0 0 28px var(--aff-c,#c08aff)22, 0 8px 32px rgba(0,0,0,.4) !important; }
.mm-aff-card:hover .mm-aff-face:not(.mm-aff-back)::after { opacity:1 !important; }
.mm-aff-inner { transition:transform .55s cubic-bezier(.23,1,.32,1); transform-style:preserve-3d; position:relative; }
.mm-aff-inner.flipped { transform:rotateY(180deg); }
.mm-aff-face { backface-visibility:hidden; position:absolute; inset:0; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; overflow:hidden; }
.mm-aff-face:not(.mm-aff-back)::after { content:""; position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity .3s; background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 60%,rgba(255,255,255,.02) 100%); border-radius:12px; }
.mm-aff-face::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--aff-c,#c08aff)55,transparent); pointer-events:none; }
.mm-aff-back { transform:rotateY(180deg); }
.mm-aff-back::after { content:""; position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at 30% 20%,var(--aff-c,#c08aff)10,transparent 60%); border-radius:12px; }
.mm-aff-shimmer { position:absolute; top:0; left:-80%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent); animation:fvm-shimmer 3s ease-in-out infinite; pointer-events:none; border-radius:12px; }
.sc-aff-row-item { display:flex; align-items:flex-start; gap:9px; padding:9px 10px; border-radius:8px; cursor:pointer; border:1px solid transparent; transition:all .18s ease; }
.sc-aff-row-item:hover { background:var(--aff-c,#c08aff)0a; border-color:var(--aff-c,#c08aff)22 !important; transform:translateX(2px); }
.sc-aff-row-item.is-active { background:var(--aff-c,#c08aff)10; border-color:var(--aff-c,#c08aff)44 !important; }
@keyframes aff-dot-pulse { 0%,100%{box-shadow:0 0 0 0 var(--aff-c,#c08aff)55} 50%{box-shadow:0 0 0 5px transparent} }
.mm-quiz-opt { transition:all .18s; cursor:pointer; border:2px solid #2a1f3d; }
.mm-quiz-opt:hover:not(.selected) { border-color:#c89b3c99; background:#c89b3c11; transform:translateX(4px); }
.mm-quiz-opt.selected { border-color:#c89b3c; background:#c89b3c18; }
.mm-insight-card { animation:mm-insight .4s ease both; transition:transform .2s,box-shadow .2s; }
.mm-insight-card:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(0,0,0,.45) !important; }
.mm-bar { animation:mm-barIn .6s cubic-bezier(.4,0,.2,1) both; }
@keyframes mm-barIn { from{height:0;opacity:0} to{opacity:1} }
@keyframes mm-insight { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes mm-pop  { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
@keyframes mm-xpFloat { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-60px) scale(1.3);opacity:0} }
@keyframes mm-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
@keyframes mm-fire { 0%,100%{filter:drop-shadow(0 0 5px #c89b3caa)} 50%{filter:drop-shadow(0 0 14px #c89b3c)} }
@keyframes mm-topline { from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1} }
@keyframes mm-counter { from{opacity:0;transform:scale(.7) rotateX(-30deg)} to{opacity:1;transform:scale(1) rotateX(0)} }
@keyframes mm-glow-ring { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
@keyframes mm-slide-in { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes mm-breathePulse { 0%,100%{box-shadow:0 0 20px var(--bc,#7C3AED44),0 0 60px var(--bc,#7C3AED22)} 50%{box-shadow:0 0 50px var(--bc,#7C3AED88),0 0 100px var(--bc,#7C3AED44)} }
@keyframes mm-up-particle { 0%{transform:translateY(0) scale(1);opacity:.7} 100%{transform:translateY(-80px) scale(.4);opacity:0} }
.mm-particle { position:absolute; border-radius:50%; pointer-events:none; animation:mm-up-particle linear forwards; }

/* ── Responsive breakpoints ── */
@media (max-width:1440px) {
  .fvm-wrapper { grid-template-columns:250px 1fr 290px; gap:10px; }
  .fvm-top-bar  { grid-template-columns:250px 1fr auto; }
  .fvr-tech-grid { grid-template-columns:repeat(3,1fr); }
}
@media (max-width:1280px) {
  .fvm-wrapper { grid-template-columns:230px 1fr 260px; padding:10px; gap:10px; }
  .fvm-top-bar  { grid-template-columns:230px 1fr auto; }
  .fvm-mood-grid { grid-template-columns:repeat(5,1fr); gap:6px; }
  .fvr-tech-grid { grid-template-columns:repeat(3,1fr); gap:8px; }
  .sc-stats-grid { grid-template-columns:repeat(2,1fr); }
}
@media (max-width:1152px) {
  .fvm-wrapper { grid-template-columns:210px 1fr; padding:10px; }
  .fvm-top-bar  { grid-template-columns:210px 1fr; }
  .fvm-right-col { grid-column:1/3; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .fvm-bottom-nav { grid-column:1/3; }
  .fvm-brand-sub { display:none; }
  .fvr-tech-grid { grid-template-columns:repeat(3,1fr); }
}
@media (max-width:1024px) {
  .fvm-wrapper { grid-template-columns:1fr; padding:8px; gap:8px; }
  .fvm-top-bar  { grid-template-columns:1fr auto; }
  .fvm-left-col { display:none; }
  .fvm-center-col { grid-column:1; }
  .fvm-right-col  { grid-column:1; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .fvm-bottom-nav { grid-column:1; }
  .fvm-mood-grid { grid-template-columns:repeat(5,1fr); gap:5px; }
  .fvr-tech-grid { grid-template-columns:repeat(3,1fr); }
  .sc-breath-grid,.sc-perma-grid,.sc-aff-grid,.sc-result-grid,.sc-insights-grid { grid-template-columns:1fr !important; }
}
@media (max-width:820px) {
  .fvm-mood-grid { grid-template-columns:repeat(3,1fr); gap:6px; }
  .fvm-right-col { grid-template-columns:1fr; }
  .fvm-tabbar-btn { padding:10px 10px; }
  .fvr-tech-grid { grid-template-columns:repeat(2,1fr); }
  .fvr-orb-wrap { width:220px; height:220px; }
  .fvr-orb-rings { width:240px; height:240px; }
}
@media (max-width:640px) {
  .fvm-wrapper { padding:6px; gap:6px; }
  .fvm-mood-grid { grid-template-columns:1fr 1fr; }
  .fvm-tabbar { flex-wrap:wrap; }
  .fvm-tabbar-btn { padding:8px; flex:1 0 calc(33% - 4px); }
  .fvr-tech-grid { grid-template-columns:1fr; }
  .fvr-orb-wrap { width:180px; height:180px; }
  .fvr-orb-rings { width:200px; height:200px; }
}
`;

// ── Data ──────────────────────────────────────────────────────
const MOODS = [
  { id:"tense",   label:"Tenso",      labelKey:"me.mood.tense.label",   tipKey:"me.mood.tense.tip",   color:SC.red,     xp:25 },
  { id:"tired",   label:"Cansado",    labelKey:"me.mood.tired.label",   tipKey:"me.mood.tired.tip",   color:SC.muted,   xp:25 },
  { id:"neutral", label:"Neutro",     labelKey:"me.mood.neutral.label", tipKey:"me.mood.neutral.tip", color:SC.blue,    xp:25 },
  { id:"good",    label:"Bien",       labelKey:"me.mood.good.label",    tipKey:"me.mood.good.tip",    color:SC.teal,    xp:25 },
  { id:"powered", label:"Con energía",labelKey:"me.mood.powered.label", tipKey:"me.mood.powered.tip", color:SC.orange,  xp:25 },
];
const MOOD_SCORE = { tense:1, tired:2, neutral:5, good:8, powered:10 };

const PERMA = [
  { id:"P", label:"Emociones\nPositivas", labelKey:"me.perma.p.label", color:SC.orange, emoji:"😊", desc:"¿Cuántas emociones positivas experimentas al entrenar?",     descKey:"me.perma.p.desc", full:"Las emociones positivas amplían tu mente y construyen recursos psicológicos duraderos.", fullKey:"me.perma.p.full" },
  { id:"E", label:"Compromiso\n& Flujo",  labelKey:"me.perma.e.label", color:SC.blue,   emoji:"🎯", desc:"¿Qué tan conectado te sientes con tu entrenamiento?",         descKey:"me.perma.e.desc", full:"El estado de flujo es máxima felicidad. El ejercicio bien calibrado lo produce con frecuencia.", fullKey:"me.perma.e.full" },
  { id:"R", label:"Relaciones\nPositivas",labelKey:"me.perma.r.label", color:SC.purple, emoji:"🤝", desc:"¿Tu vida social apoya tu bienestar físico?",                  descKey:"me.perma.r.desc", full:"Entrenar acompañado multiplica los beneficios psicológicos del ejercicio.", fullKey:"me.perma.r.full" },
  { id:"M", label:"Significado\n& Prop.", labelKey:"me.perma.m.label", color:SC.teal,   emoji:"💡", desc:"¿Tu entrenamiento conecta con un propósito más grande?",      descKey:"me.perma.m.desc", full:"Cuando el ejercicio tiene 'por qué', deja de ser obligación y se vuelve identidad.", fullKey:"me.perma.m.full" },
  { id:"A", label:"Logros &\nCompetencia",labelKey:"me.perma.a.label", color:SC.gold,   emoji:"🏆", desc:"¿Qué tan satisfecho estás con tu progreso físico?",           descKey:"me.perma.a.desc", full:"Cada PR superado activa el sistema de recompensa del cerebro.", fullKey:"me.perma.a.full" },
];

const AFFIRMATIONS = {
  GUERRERO: [
    { q:"¿Cuándo fue la última vez que superaste tus propios límites?",    a:"La fuerza no nace en el gimnasio. Nace cuando decides no rendirte, una sola vez más." },
    { q:"¿Qué haría tu versión más fuerte que aún no has probado?",        a:"Tu potencial físico siempre supera lo que tu mente cree posible. Confía en el proceso." },
    { q:"¿Qué te hace levantarte a entrenar aunque no quieras?",           a:"Los guerreros no esperan motivación. Crean disciplina, y la disciplina crea libertad." },
    { q:"¿Qué significa para ti ser más fuerte mañana que hoy?",          a:"Cada kg que levantas hoy programa tu cerebro para la victoria." },
    { q:"¿Qué batalla interna has ganado esta semana?",                   a:"La batalla más importante no es contra el hierro. Es contra la voz que dice 'suficiente'." },
  ],
  ARQUERO: [
    { q:"¿Cuándo fue la última vez que correr te hizo sentir libre?",      a:"La velocidad no es huir de algo. Es correr hacia la mejor versión de ti mismo." },
    { q:"¿Qué pasa por tu mente en los últimos metros cuando quieres parar?", a:"El segundo aire no es físico. Es la decisión de que tu propósito importa más que el dolor." },
    { q:"¿Qué te impulsa cuando el camino se pone cuesta arriba?",         a:"Los arqueros apuntan más alto de lo que ven. Tu resistencia hoy construye tus alas mañana." },
    { q:"¿Cómo se siente tu cuerpo después de una carrera completa?",      a:"Esa satisfacción post-entreno es tu sistema nervioso celebrando tu victoria." },
    { q:"¿Qué nueva distancia quieres conquistar este mes?",               a:"No corres contra nadie. Solo contra quien fuiste ayer. Y siempre puedes ganar esa carrera." },
  ],
  MAGO: [
    { q:"¿Qué sientes cuando tu mente y tu cuerpo están completamente alineados?", a:"El equilibrio no es ausencia de tensión. Es la maestría de bailar con ella sin romperte." },
    { q:"¿Cómo te hablas a ti mismo en los momentos difíciles?",          a:"La mente es el primer músculo que entrenas. Cada pensamiento compasivo te hace más fuerte." },
    { q:"¿Cuándo fue la última vez que te diste crédito por tu progreso?", a:"La flexibilidad del cuerpo refleja la apertura de la mente. Celebra cada centímetro de avance." },
    { q:"¿Qué práctica te conecta más con tu bienestar interior?",        a:"El mago no domina el mundo externo. Domina su mundo interno, y todo lo demás sigue." },
    { q:"¿Cómo transfieres la calma del yoga a tu vida cotidiana?",       a:"Cada momento de equilibrio que practicas en la estera se convierte en recursos para la vida." },
  ],
  DEFAULT: [
    { q:"¿Qué logro físico te ha demostrado que eres más fuerte de lo que creías?", a:"Tu cuerpo guarda evidencia de cada victoria. Cada músculo es un capítulo de tu historia." },
    { q:"¿Qué te enseñó el ejercicio sobre la persistencia?",             a:"El progreso físico y el crecimiento personal tienen la misma fórmula: consistencia sobre perfección." },
    { q:"¿Cómo se conecta tu salud física con tu bienestar emocional?",   a:"La ciencia confirma lo que tu cuerpo ya sabe: moverse es la medicina más antigua y efectiva." },
    { q:"¿Qué versión de ti mismo estás construyendo con cada entrenamiento?", a:"No entrenas para un evento. Entrenas para ser la persona que quieres ser todos los días." },
    { q:"¿Qué te gustaría agradecerle a tu cuerpo hoy?",                 a:"Tu cuerpo trabaja para ti cada segundo. El ejercicio es tu manera de trabajar para él." },
  ],
};

const STRENGTHS_QUIZ = [
  { q:"Cuando enfrentas un problema difícil, ¿qué haces primero?", opts:[
    { text:"Busco una solución creativa que nadie ha probado",    strength:"Creatividad" },
    { text:"Lo enfrento directamente aunque me dé miedo",         strength:"Valentía" },
    { text:"Pregunto cómo puedo ayudar a otros en el proceso",    strength:"Amabilidad" },
    { text:"Analizo todos los ángulos antes de actuar",           strength:"Sabiduría" },
  ]},
  { q:"¿Qué es lo que más disfrutas de entrenar?", opts:[
    { text:"Inventar nuevos ejercicios y rutinas propias",        strength:"Creatividad" },
    { text:"Superar el límite que me impuse ayer",                strength:"Perseverancia" },
    { text:"Entrenar con amigos y motivarlos",                    strength:"Liderazgo" },
    { text:"Ver el progreso medido en números reales",            strength:"Sabiduría" },
  ]},
  { q:"Cuando alguien de tu equipo falla, tú...", opts:[
    { text:"Propones una forma distinta de intentarlo",           strength:"Creatividad" },
    { text:"Le recuerdo que el fracaso es parte del proceso",     strength:"Perspectiva" },
    { text:"Le doy apoyo emocional sin juzgar",                   strength:"Amabilidad" },
    { text:"Tomo las riendas para reagrupar al equipo",           strength:"Liderazgo" },
  ]},
  { q:"¿Cuál de estos objetivos te motiva más?", opts:[
    { text:"Crear algo nuevo y único en mi entrenamiento",        strength:"Creatividad" },
    { text:"Ser el ejemplo de constancia en mi círculo",          strength:"Perseverancia" },
    { text:"Que las personas a mi alrededor mejoren también",     strength:"Amabilidad" },
    { text:"Entender a fondo el 'por qué' de cada ejercicio",     strength:"Sabiduría" },
  ]},
  { q:"¿Qué haces después de completar un entrenamiento duro?", opts:[
    { text:"Lo celebro con humor — merezco reírme de mi esfuerzo", strength:"Humor" },
    { text:"Lo anoto y busco cómo mejorarlo la próxima vez",       strength:"Perspectiva" },
    { text:"Comparto el logro para inspirar a otros",              strength:"Liderazgo" },
    { text:"Agradezco a mi cuerpo por haberlo logrado",            strength:"Gratitud" },
  ]},
  { q:"Si pudieras tener un superpoder psicológico, sería...", opts:[
    { text:"Siempre ver el lado positivo de cualquier situación",   strength:"Gratitud" },
    { text:"Nunca rendirme pase lo que pase",                       strength:"Perseverancia" },
    { text:"Entender a las personas a fondo",                       strength:"Amabilidad" },
    { text:"Hacer reír a la gente en los momentos más difíciles",   strength:"Humor" },
  ]},
];

const STRENGTH_INFO = {
  Creatividad:   { color:SC.purple,  desc:"Ves soluciones donde otros ven obstáculos. Tu mente innovadora convierte el entrenamiento en arte.", descKey:"me.sinfo.creatividad.desc" },
  Valentía:      { color:SC.orange,  desc:"Actúas a pesar del miedo. Cada rep dura es evidencia de tu coraje aplicado.", descKey:"me.sinfo.valentia.desc" },
  Amabilidad:    { color:SC.green,   desc:"Tu fuerza más grande es cómo tratas a los demás. El bienestar colectivo te impulsa.", descKey:"me.sinfo.amabilidad.desc" },
  Sabiduría:     { color:SC.blue,    desc:"Piensas antes de actuar. Tu análisis convierte cada sesión en aprendizaje profundo.", descKey:"me.sinfo.sabiduria.desc" },
  Perseverancia: { color:SC.red,     desc:"No paras cuando estás cansado. Paras cuando terminas. Eso te diferencia.", descKey:"me.sinfo.perseverancia.desc" },
  Liderazgo:     { color:SC.gold,    desc:"Inspiras con tu ejemplo. Tu presencia eleva el nivel de todos los que te rodean.", descKey:"me.sinfo.liderazgo.desc" },
  Perspectiva:   { color:SC.teal,    desc:"Ves el panorama completo. Los reveses son datos, no derrotas. Eso es madurez mental.", descKey:"me.sinfo.perspectiva.desc" },
  Gratitud:      { color:SC.teal,    desc:"Reconoces lo que tienes. La gratitud es el amplificador de bienestar más estudiado en psicología positiva.", descKey:"me.sinfo.gratitud.desc" },
  Humor:         { color:SC.orangeL, desc:"Ríes incluso en los momentos difíciles. El humor es resiliencia disfrazada de alegría.", descKey:"me.sinfo.humor.desc" },
};

const BREATH_MODES = [
  { id:"box",   label:"Box Breathing", labelKey:"me.breath.mode.box.label",   short:"4·4·4·4",
    phases:[{label:"INHALA",phaseKey:"me.breath.phase.inhala",d:4},{label:"RETÉN",phaseKey:"me.breath.phase.reten",d:4},{label:"EXHALA",phaseKey:"me.breath.phase.exhala",d:4},{label:"PAUSA",phaseKey:"me.breath.phase.pausa",d:4}],
    tip:"Técnica de Navy SEALs. Activa el parasimpático y reduce el estrés en 60 segundos.", tipKey:"me.breath.mode.box.tip",
    desc:"Equilibrio", descKey:"me.breath.mode.box.desc", color:"#5A9FD4" },
  { id:"478",   label:"4-7-8",         labelKey:"me.breath.mode.478.label",   short:"4·7·8",
    phases:[{label:"INHALA",phaseKey:"me.breath.phase.inhala",d:4},{label:"RETÉN",phaseKey:"me.breath.phase.reten",d:7},{label:"EXHALA",phaseKey:"me.breath.phase.exhala",d:8}],
    tip:"Dr. Andrew Weil. Activa el sistema nervioso parasimpático y prepara para el sueño.", tipKey:"me.breath.mode.478.tip",
    desc:"Relajación", descKey:"me.breath.mode.478.desc", color:"#4A9D8F" },
  { id:"power", label:"Energizante",   labelKey:"me.breath.mode.power.label", short:"2·2·2·2",
    phases:[{label:"INHALA",phaseKey:"me.breath.phase.inhala",d:2},{label:"EXHALA",phaseKey:"me.breath.phase.exhala",d:2},{label:"INHALA",phaseKey:"me.breath.phase.inhala",d:2},{label:"EXHALA",phaseKey:"me.breath.phase.exhala",d:2}],
    tip:"Respiración de poder. Aumenta el oxígeno cerebral y la energía mental de forma inmediata.", tipKey:"me.breath.mode.power.tip",
    desc:"Energía", descKey:"me.breath.mode.power.desc", color:"#D4A574" },
];

// ── Helpers ───────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0,10);
const lsGet = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const menteScopedKey = (scope, key) => `fv_mente_${scope || "guest"}_${key}`;
const menteClientCache = new Map();
const MENTE_CLIENT_CACHE_TTL = 45 * 1000;
const MENTE_CLIENT_INSIGHTS_TTL = 2 * 60 * 1000;
const readMenteClientCache = (scope, section, ttl) => {
  const entry = menteClientCache.get(`${scope}:${section}`);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) return null;
  return entry.data;
};
const writeMenteClientCache = (scope, section, data) => {
  menteClientCache.set(`${scope}:${section}`, { ts: Date.now(), data });
  return data;
};
const getToken = async () => {
  const u = auth.currentUser;
  if (!u) throw new Error("No autenticado");
  return u.getIdToken();
};

// ── Motion presets ────────────────────────────────────────────
const fadeUp    = { initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-8}, transition:{duration:.3,ease:"easeOut"} };
const staggerCt = { animate:{ transition:{ staggerChildren:.07 } } };
const staggerIt = { initial:{opacity:0,y:12}, animate:{opacity:1,y:0} };

// ══════════════════════════════════════════════════════════════
//  XP FLOAT
// ══════════════════════════════════════════════════════════════
function XPPopup({ amount, color = SC.gold, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position:"fixed", bottom:120, right:32, zIndex:9999,
      background:`${color}18`, border:`1.5px solid ${color}66`,
      borderRadius:40, padding:"10px 22px",
      display:"flex", alignItems:"center", gap:8,
      animation:"mm-xpFloat 1.4s cubic-bezier(.4,0,.2,1) forwards",
      pointerEvents:"none", boxShadow:`0 0 28px ${color}44`,
      backdropFilter:"blur(8px)",
    }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill={color} stroke="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span style={{ ...orb(14,900), color }}>+{amount} XP</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TODAY'S PROGRESS BOARD
// ══════════════════════════════════════════════════════════════
const ACT_ICONS = {
  mood:        (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  gratitude:   (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  breathing:   (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
  perma:       (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  affirmation: (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  strengths:   (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  connection:  (c,s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

const TODAY_ACTIVITIES = [
  { key:"mood",        label:"Ánimo",        labelKey:"me.act.mood",        xp:25,  color:SC.orange },
  { key:"gratitude",   label:"Gratitud",     labelKey:"me.act.gratitude",   xp:30,  color:SC.teal   },
  { key:"breathing",   label:"Respiración",  labelKey:"me.act.breathing",   xp:20,  color:SC.blue   },
  { key:"perma",       label:"PERMA",        labelKey:"me.act.perma",       xp:40,  color:SC.purple },
  { key:"affirmation", label:"Afirmaciones", labelKey:"me.act.affirmation", xp:15,  color:SC.gold   },
  { key:"strengths",   label:"Fortalezas",   labelKey:"me.act.strengths",   xp:60,  color:SC.teal   },
  { key:"connection",  label:"ConexiÃ³n",     labelKey:"me.act.connection",  xp:20,  color:SC.green  },
];

function TodayProgress({ todayDone, onTabClick, onConnectionClick, connectionSaving = false }) {
  const { t } = useLang();
  const done    = TODAY_ACTIVITIES.filter(a => todayDone?.[a.key]);
  const total   = TODAY_ACTIVITIES.length;
  const pct     = Math.round((done.length / total) * 100);
  const xpToday = done.reduce((s, a) => s + a.xp, 0);

  const IcoCal = ({c=SC.blue,s=16}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
  const IcoCheckSm = ({c=SC.green,s=10}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  const IcoTrophy = ({c=SC.green,s=15}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  );

  return (
    <motion.div {...fadeUp} style={{ ...scCard(SC.blue), marginBottom:18, overflow:"hidden" }}>

      {/* Header row */}
      <div style={{
        padding:"16px 20px 14px",
        borderBottom:`1px solid ${SC.navy}`,
        display:"flex", alignItems:"center", gap:12,
      }}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background:`${SC.blue}18`, border:`1px solid ${SC.blue}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <IcoCal c={SC.blue} s={16}/>
        </div>
        <span style={{ ...orb(10,800), color:SC.white, letterSpacing:"0.07em", flex:1 }}>
          {t("me.today.title")}
        </span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{
            background:`${SC.gold}14`, border:`1px solid ${SC.gold}30`,
            padding:"4px 12px", borderRadius:16,
            display:"flex", gap:5, alignItems:"center",
          }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill={SC.gold} stroke="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span style={{ ...orb(10,800), color:SC.gold }}>{xpToday} {t("me.today.xp_suf")}</span>
          </div>
          <div style={{
            background: pct===100 ? `${SC.green}14` : SC.panel,
            border:`1px solid ${pct===100 ? SC.green+'44' : SC.navy}`,
            padding:"4px 10px", borderRadius:16,
          }}>
            <span style={{ ...orb(10,800), color: pct===100 ? SC.green : SC.mutedL }}>
              {done.length}/{total}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding:"10px 20px 0" }}>
        <div style={{ background:SC.navy, borderRadius:6, height:4, overflow:"hidden" }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
            transition={{ duration:.9, ease:"easeOut" }}
            style={{
              height:"100%", borderRadius:6,
              background: pct===100
                ? `linear-gradient(90deg,${SC.green},${SC.teal})`
                : `linear-gradient(90deg,${SC.blue},${SC.teal})`,
              boxShadow: pct===100 ? `0 0 6px ${SC.green}55` : `0 0 6px ${SC.blue}55`,
            }}/>
        </div>
        {pct > 0 && (
          <div style={{ ...raj(9,500), color:SC.muted, textAlign:"right", marginTop:4 }}>
            {pct}{t("me.today.pct_done")}
          </div>
        )}
      </div>

      {/* Activity chips */}
      <div style={{ padding:"12px 20px 16px", display:"flex", gap:7, flexWrap:"wrap" }}>
        {TODAY_ACTIVITIES.map((a, i) => {
          const isDone = todayDone?.[a.key];
          return (
            <motion.button key={a.key}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * .04 }}
              whileHover={{ y:-2, boxShadow:`0 6px 18px ${a.color}22` }}
              whileTap={{ scale:.96 }}
              onClick={() => {
                if (a.key === "connection") {
                  onConnectionClick?.();
                  return;
                }
                onTabClick(a.key);
              }}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"6px 13px", borderRadius:20,
                background: isDone ? `${a.color}12` : SC.panel,
                border:`1px solid ${isDone ? a.color+'44' : SC.navy}`,
                color: isDone ? a.color : SC.mutedL,
                cursor: connectionSaving && a.key === "connection" ? "wait" : "pointer", transition:"all .2s",
                opacity: connectionSaving && a.key === "connection" ? 0.72 : 1,
              }}>
              <span style={{ display:"flex", alignItems:"center" }}>
                {isDone ? <IcoCheckSm c={a.color} s={10}/> : ACT_ICONS[a.key]?.(a.color, 12)}
              </span>
              <span style={{ ...raj(11,600) }}>{t(a.labelKey)}</span>
              {isDone && <span style={{ ...raj(9,600), color:a.color, opacity:.8 }}>+{a.xp}</span>}
            </motion.button>
          );
        })}
      </div>

      {/* 100% complete banner */}
      {pct === 100 && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          style={{
            margin:"0 20px 16px", padding:"10px 16px", borderRadius:10,
            background:`${SC.green}0d`, border:`1px solid ${SC.green}33`,
            display:"flex", gap:10, alignItems:"center",
          }}>
          <IcoTrophy c={SC.green} s={15}/>
          <span style={{ ...raj(12,700), color:SC.green }}>
            {t("me.today.zone_done")}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── SC minimal SVG icon kit ───────────────────────────────────
// Header badges
const IcoTrendUp = ({c=SC.blue,  s=16}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcoActivity = ({c=SC.orange, s=16}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoLeaf = ({c=SC.teal, s=16}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 22a17.9 17.9 0 0 0 21.18-21.18A17.9 17.9 0 0 0 17 8z"/>
  </svg>
);
const IcoWind = ({c=SC.blue, s=16}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);
const IcoHexGrid = ({c=SC.purple, s=16}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l4.5 2.6v5.2L12 12.4 7.5 9.8V4.6z"/>
    <path d="M12 11.6l4.5 2.6v5.2L12 22l-4.5-2.6v-5.2z"/>
    <path d="M16.5 9.8L21 7.2v5.2l-4.5 2.6M7.5 9.8L3 7.2v5.2l4.5 2.6"/>
  </svg>
);
const IcoFlame = ({c=SC.orange, s=13}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

// Mood icons — called as MOOD_ICO[id](color, size)
const MOOD_ICO = {
  tense:   (c,s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 12 6 5 10 16 14 7 18 14 22 10"/>
    </svg>
  ),
  tired:   (c,s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  neutral: (c,s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  good:    (c,s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    </svg>
  ),
  powered: (c,s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" stroke="none" fill={c}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
};

// Strength icons — called as STRENGTH_ICO[name](color, size)
const STRENGTH_ICO = {
  Creatividad:   (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>,
  Valentía:      (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Amabilidad:    (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Sabiduría:     (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Perseverancia: (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Liderazgo:     (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Perspectiva:   (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Gratitud:      (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 22a17.9 17.9 0 0 0 21.18-21.18A17.9 17.9 0 0 0 17 8z"/></svg>,
  Humor:         (c,s=24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/></svg>,
};

// PERMA icons — called as PERMA_ICO[id](color, size)
const PERMA_ICO = {
  P: (c,s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
    </svg>
  ),
  E: (c,s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  R: (c,s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  M: (c,s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={c} stroke="none" opacity=".55"/>
    </svg>
  ),
  A: (c,s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
};

// ══════════════════════════════════════════════════════════════
//  MOOD CHART  — card con paleta admin-config
// ══════════════════════════════════════════════════════════════
function MoodChart({ history }) {
  const { t } = useLang();
  if (!history || history.length === 0) return null;
  const last7 = history.slice(-7);
  const W = 340, H = 90, PAD = 16, BAR_W = 28;
  const step  = last7.length > 1 ? (W - PAD * 2 - BAR_W) / (last7.length - 1) : 0;

  return (
    <motion.div
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:0.22, duration:0.38, ease:"easeOut" }}
      className="sc-section-card"
      style={{ padding:"20px 22px", marginTop:18, borderTop:`2px solid ${SC.blue}` }}>

      {/* Card header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <div style={{ width:32, height:32, borderRadius:8,
          background:`${SC.blue}18`, border:`1px solid ${SC.blue}33`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <IcoTrendUp c={SC.blue} s={16}/>
        </div>
        <div>
          <p style={{ ...orb(10,700), color:SC.white, margin:0, letterSpacing:"0.08em" }}>
            {t("me.chart.title")}
          </p>
          <p style={{ ...raj(11,500), color:SC.muted, margin:0 }}>{t("me.chart.last7")}</p>
        </div>
        <div style={{ marginLeft:"auto", background:`${SC.blue}12`,
          border:`1px solid ${SC.blue}28`, padding:"3px 12px", borderRadius:20 }}>
          <span style={{ ...raj(10,600), color:SC.blue }}>{last7.length} {t(last7.length===1?"me.chart.reg_1":"me.chart.reg_n")}</span>
        </div>
      </div>

      {/* SVG chart */}
      <svg width="100%" viewBox={`0 0 ${W} ${H + 42}`} style={{ overflow:"visible" }}>
        <defs>
          <filter id="mc-glow-f"><feGaussianBlur stdDeviation="3" result="b"/></filter>
          {last7.map((_, i) => {
            const mood = MOODS.find(m => m.id === last7[i].id);
            const col  = mood?.color || SC.muted;
            return (
              <linearGradient key={i} id={`mcg${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={col} stopOpacity="0.85"/>
                <stop offset="100%" stopColor={col} stopOpacity="0.15"/>
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct}
            x1={PAD} y1={H - pct * H} x2={W - PAD} y2={H - pct * H}
            stroke={SC.navyL} strokeWidth="0.8" opacity="0.5" strokeDasharray="3,6"/>
        ))}

        {last7.map((d, i) => {
          const score = MOOD_SCORE[d.id] || 5;
          const barH  = Math.max(10, (score / 10) * H);
          const x     = PAD + i * step;
          const y     = H - barH;
          const mood  = MOODS.find(m => m.id === d.id);
          const col   = mood?.color || SC.muted;
          return (
            <g key={i}>
              {/* Glow */}
              <rect x={x-3} y={y-3} width={BAR_W+6} height={barH+3}
                rx="9" fill={col} opacity="0.07" filter="url(#mc-glow-f)"/>
              {/* Bar */}
              <motion.rect x={x} y={H} width={BAR_W} height={0} rx="6"
                fill={`url(#mcg${i})`}
                animate={{ y, height: barH }}
                transition={{ duration:0.52, delay:i * 0.06, ease:"easeOut" }}/>
              {/* Mood icon */}
              <foreignObject x={x + BAR_W/2 - 8} y={H + 4} width="16" height="16">
                {MOOD_ICO[d.id]?.(col, 14)}
              </foreignObject>
              {/* Date */}
              <text x={x + BAR_W/2} y={H + 32} textAnchor="middle" fontSize="8.5"
                fontFamily="'Manrope',sans-serif" fontWeight="600" fill={SC.muted}>
                {(d.date || d.dateKey || "").slice(5)}
              </text>
            </g>
          );
        })}
        <line x1={PAD} y1={H} x2={W-PAD} y2={H} stroke={SC.navyL} strokeWidth="1.2" opacity="0.6"/>
      </svg>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  INSIGHTS PANEL — SC premium redesign
// ══════════════════════════════════════════════════════════════
function InsightsPanel({ insights, loading }) {
  const { t } = useLang();
  const typeStyles = {
    mood_trend:    { color:SC.blue   },
    exercise_sync: { color:SC.orange },
    perma_delta:   { color:SC.purple },
    streak:        { color:SC.gold   },
    class_tip:     { color:SC.teal   },
    positive:      { color:SC.green  },
    warning:       { color:SC.red    },
    insight:       { color:SC.blue   },
    achievement:   { color:SC.gold   },
    class:         { color:SC.purple },
    default:       { color:SC.muted  },
  };

  const IcoForType = ({ type, c, s=14 }) => {
    const p = { fill:"none", stroke:c, strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round" };
    const map = {
      mood_trend:    <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
      exercise_sync: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
      perma_delta:   <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
      streak:        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
      class_tip:     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
      positive:      <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
      warning:       <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/></>,
      insight:       <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3"/><line x1="12" y1="12" x2="12" y2="16"/></>,
      achievement:   <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
      class:         <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/>,
      default:       <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>,
    };
    return <svg width={s} height={s} viewBox="0 0 24 24" {...p}>{map[type] || map.default}</svg>;
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {[1,2,3].map(i => <div key={i} className="mm-skel" style={{ height:64, borderRadius:10 }}/>)}
    </div>
  );

  if (!insights || insights.length === 0) return (
    <div style={{ textAlign:"center", padding:"36px 20px",
      background:SC.panel, border:`1px solid ${SC.navy}`,
      borderRadius:12, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:180, height:180, borderRadius:"50%",
        background:`radial-gradient(circle,${SC.blue}08,transparent 70%)`,
        pointerEvents:"none" }}/>
      <img src="/ui/icons/zone-flag.png" alt=""
        style={{ width:44, height:44, objectFit:"contain", margin:"0 auto 14px", display:"block",
          filter:`drop-shadow(0 0 8px ${SC.blue}66)` }}
        onError={e => { e.target.style.display="none"; }}/>
      <p style={{ ...raj(13,600), color:SC.muted, lineHeight:1.65, margin:0,
        maxWidth:280, marginInline:"auto" }}>
        {t("me.ins.empty")}
      </p>
    </div>
  );

  return (
    <motion.div variants={staggerCt} initial="initial" animate="animate"
      style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {insights.map((ins, i) => {
        const st = typeStyles[ins.type] || typeStyles.default;
        const isFirst = i === 0;
        return (
          <motion.div key={i} variants={staggerIt}
            className={`sc-ins-insight${isFirst ? " sc-ins-first" : ""}`}
            style={{
              background: isFirst ? `${st.color}0e` : SC.panel,
              border:`1px solid ${isFirst ? st.color+"44" : SC.navy}`,
              borderLeft:`3px solid ${st.color}`,
              borderRadius:10,
              padding: isFirst ? "16px 18px" : "12px 16px",
              "--ins-ic": st.color,
            }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              {/* Type icon — PNG for first, SVG for rest */}
              <div style={{
                width: isFirst ? 36 : 28, height: isFirst ? 36 : 28,
                borderRadius: isFirst ? 10 : 7, flexShrink:0,
                background:`${st.color}16`, border:`1px solid ${st.color}33`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: isFirst ? `0 0 10px ${st.color}22` : "none",
              }}>
                {ins.emoji
                  ? <span style={{ fontSize: isFirst ? 16 : 13, lineHeight:1 }}>{ins.emoji}</span>
                  : <IcoForType type={ins.type} c={st.color} s={isFirst ? 17 : 13}/>}
              </div>
              <div style={{ flex:1 }}>
                {ins.title && (
                  <p style={{ ...orb(isFirst ? 9 : 8, 700), color:st.color,
                    margin:"0 0 5px", letterSpacing:"0.08em",
                    textShadow: isFirst ? `0 0 8px ${st.color}66` : "none" }}>
                    {ins.title}
                  </p>
                )}
                <p style={{ ...raj(isFirst ? 13 : 12, 600), color:SC.white,
                  lineHeight:1.6, margin:0 }}>
                  {ins.message || ins.text}
                </p>
                {ins.action && (
                  <p style={{ ...raj(11,500), color:st.color, marginTop:6, lineHeight:1.5,
                    opacity:0.8 }}>
                    → {ins.action}
                  </p>
                )}
              </div>
              {isFirst && (
                <img src="/ui/medals/medal-gold.png" alt=""
                  style={{ width:20, height:20, objectFit:"contain", flexShrink:0, opacity:0.85,
                    filter:`drop-shadow(0 0 5px ${SC.gold}88)` }}
                  onError={e => { e.target.style.display="none"; }}/>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  COMMUNITY PANEL — SC premium redesign
// ══════════════════════════════════════════════════════════════
function CommunityPanel({ community, loading }) {
  const { t } = useLang();
  const IcoGlobe = ({s=14,c=SC.teal}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
  const medals = ["/ui/medals/medal-gold.png","/ui/medals/medal-silver.png","/ui/medals/medal-bronze.png"];

  if (loading) return (
    <div style={{ ...scCard(SC.teal), padding:"16px", overflow:"hidden", borderTop:"none" }}>
      <div style={{ height:2, background:`linear-gradient(90deg,${SC.teal},${SC.blue}88)`, marginBottom:16, borderRadius:2 }}/>
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        <div className="mm-skel" style={{ height:12, width:"60%", borderRadius:4 }}/>
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="mm-skel" style={{ height:16, borderRadius:4 }}/>
        ))}
      </div>
    </div>
  );
  if (!community) return null;

  const comm        = community.community || community;
  const moodDist    = comm.moods?.count || {};
  const totalResp   = comm.moods?.total  || comm.activeToday || 0;
  const topStrList  = (comm.topStrengths || []).slice(0,3);
  const total       = Math.max(1, Object.values(moodDist).reduce((a,b)=>a+b,0));

  return (
    <div style={{ ...scCard(SC.teal), overflow:"hidden", position:"relative",
      borderTop:"none" }}>

      {/* Gradient top bar */}
      <div style={{ height:2, background:`linear-gradient(90deg,${SC.teal},${SC.blue}88)` }}/>

      {/* Header */}
      <div style={{ padding:"13px 16px 11px",
        borderBottom:`1px solid ${SC.navy}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ color:SC.teal, filter:`drop-shadow(0 0 4px ${SC.teal}88)` }}>
          <IcoGlobe/>
        </div>
        <span style={{ ...orb(9,700), color:SC.white, letterSpacing:"0.08em", flex:1 }}>
          {t("me.comm.title")}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <motion.div
            animate={{ scale:[1,1.2,1], opacity:[0.7,1,0.7] }}
            transition={{ duration:2, repeat:Infinity }}
            style={{ width:6, height:6, borderRadius:"50%", background:SC.teal,
              boxShadow:`0 0 6px ${SC.teal}` }}/>
          <span style={{ ...raj(9,600), color:SC.teal }}>
            {totalResp} {t("me.comm.activos")}
          </span>
        </div>
      </div>

      {/* Mood rows */}
      <div style={{ padding:"12px 16px 10px", display:"flex", flexDirection:"column", gap:7 }}>
        <span style={{ ...orb(7,700), color:SC.muted, letterSpacing:"0.1em", marginBottom:2 }}>
          ÁNIMO HOY EN EL GREMIO
        </span>
        {MOODS.map((m, i) => {
          const count = moodDist[m.id] || 0;
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={m.id} className="sc-comm-bar"
              style={{ display:"flex", alignItems:"center", gap:7,
                padding:"3px 4px", borderRadius:4 }}>
              <div style={{ width:16, flexShrink:0 }}>
                {MOOD_ICO[m.id]?.(m.color, 14)}
              </div>
              <span style={{ ...raj(9,500), color:SC.muted, width:56, flexShrink:0, lineHeight:1 }}>
                {t(m.labelKey)}
              </span>
              <div style={{ flex:1, height:3, borderRadius:3,
                background:SC.navy, overflow:"hidden" }}>
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${pct}%` }}
                  transition={{ duration:.65, ease:"easeOut", delay: i * 0.055 }}
                  style={{ height:"100%", borderRadius:3, background:m.color,
                    boxShadow:`0 0 4px ${m.color}66` }}/>
              </div>
              <span style={{ ...raj(9,700), color:m.color,
                width:26, textAlign:"right", flexShrink:0,
                textShadow:`0 0 5px ${m.color}55` }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Top 3 strengths */}
      {topStrList.length > 0 && (
        <div style={{ padding:"0 14px 14px" }}>
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,${SC.navy},transparent)`,
            margin:"2px 0 10px" }}/>
          <span style={{ ...orb(7,700), color:SC.muted, letterSpacing:"0.1em",
            display:"block", marginBottom:7 }}>FORTALEZAS MÁS FRECUENTES</span>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {topStrList.map((ts, i) => {
              const info = STRENGTH_INFO[ts.strength] || { color:SC.teal };
              return (
                <div key={ts.strength}
                  className="sc-comm-str-row"
                  style={{ display:"flex", alignItems:"center", gap:9, padding:"5px 6px",
                    borderRadius:7, "--comm-c": info.color }}>
                  <img src={medals[i]} alt={`#${i+1}`}
                    style={{ width:16, height:16, objectFit:"contain", flexShrink:0,
                      filter:`drop-shadow(0 0 3px ${info.color}55)` }}
                    onError={e => { e.target.style.display="none"; e.target.insertAdjacentText("afterend", `${i+1}`); }}/>
                  <div style={{ color:info.color, flexShrink:0 }}>
                    {STRENGTH_ICO[ts.strength]?.(info.color, 14)}
                  </div>
                  <span style={{ ...raj(11,600), color: i===0 ? SC.white : SC.mutedL, flex:1 }}>
                    {ts.strength}
                  </span>
                  {ts.count && (
                    <span style={{ ...raj(9,600), color:SC.muted }}>
                      {ts.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  1. CHECK-IN DE ÁNIMO  — paleta idéntica a admin-config
// ══════════════════════════════════════════════════════════════
function MoodCheckin({ heroClass, onXP, todayDone, storageScope, moodStreak }) {
  const { t } = useLang();
  const lsKey  = menteScopedKey(storageScope, `mood_${todayStr()}`);
  const historyKey = menteScopedKey(storageScope, "mood_hist");
  const [selected, setSelected] = useState(() => lsGet(lsKey, null));
  const [tip,      setTip]      = useState(null);
  const [history,  setHistory]  = useState([]);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    getToken().then(t => getMoodHistory(t)).then(res => {
      const raw = res.moods || res.history || [];
      const norm = raw.map(m => ({ ...m, id: m.mood || m.id, date: m.dateKey || m.date }));
      if (norm.length) setHistory(norm);
      const todayEntry = norm.find(m => m.date === todayStr());
      if (todayEntry && !lsGet(lsKey, null)) {
        const match = MOODS.find(mo => mo.id === todayEntry.id);
        if (match) setSelected(match);
      }
    }).catch(() => { setHistory(lsGet(historyKey, [])); });
  }, [historyKey, lsKey]);

  const pick = async (mood) => {
    if (selected || saving) return;
    setSelected(mood);
    setTip(mood.tip);
    lsSet(lsKey, mood);
    try {
      setSaving(true);
      const token = await getToken();
      const res   = await saveMood(token, mood.id);
      if (res.xpEarned) onXP(res.xpEarned, mood.color, res);
      // Update local history without a redundant API call
      const newEntry = { id: mood.id, mood: mood.id, date: todayStr(), dateKey: todayStr() };
      setHistory(prev => [newEntry, ...prev.filter(h => (h.date || h.dateKey) !== todayStr())]);
    } catch {}
    finally { setSaving(false); }
  };

  const streak = (() => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const dd = new Date(d); dd.setDate(d.getDate()-i);
      const dk = dd.toISOString().slice(0,10);
      if (history.find(h => (h.date||h.dateKey) === dk) || lsGet(menteScopedKey(storageScope, `mood_${dk}`), null)) s++;
      else break;
    }
    return s;
  })();

  const alreadyDone = todayDone?.mood;

  // MOOD XP table from reference
  const MOOD_REF = {
    tense:   { cls:'tenso',   label:'TENSO',      desc:'Me siento tenso o estresado',         xpRef:5  },
    tired:   { cls:'cansado', label:'CANSADO',     desc:'Me siento agotado o sin energía',     xpRef:10 },
    neutral: { cls:'neutro',  label:'NEUTRO',      desc:'Me siento normal, sin altibajos',     xpRef:15 },
    good:    { cls:'bien',    label:'BIEN',        desc:'Me siento bien y en balance',          xpRef:20 },
    powered: { cls:'energia', label:'CON ENERGÍA', desc:'¡Me siento increíble! Listo para todo',xpRef:25 },
  };
  const FB_MSG = {
    tense:   { head:'RESPIRA HONDO',      body:'Está bien tener días difíciles. Un entrenamiento ligero puede ayudarte a soltar tensión.' },
    tired:   { head:'ESCUCHA A TU CUERPO',body:'El descanso también es progreso. Hoy cuenta como un día más de constancia.' },
    neutral: { head:'DÍA ESTABLE',        body:'Un día neutro es una base sólida. Pequeños pasos construyen grandes leyendas.' },
    good:    { head:'¡BIEN ELECCIÓN!',    body:'Es bueno verte en balance. Sigue con ese ritmo y continúa trabajando en ti.' },
    powered: { head:'¡IMPARABLE!',        body:'¡Esa energía es oro! Aprovéchala — hoy es un gran día para superarte.' },
  };

  // Chart history (last 7 days indexed by weekday: 0=Mon…6=Sun)
  const DAYS_SHORT = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
  const MOOD_VAL   = { tense:20, tired:38, neutral:50, good:75, powered:100 };
  const todayJsDay = new Date().getDay(); // 0=Sun...6=Sat
  const todayColIdx = todayJsDay === 0 ? 6 : todayJsDay - 1; // maps to 0=Mon...6=Sun
  const chartHistory = (() => {
    const result = Array(7).fill(null).map(() => ({ id: null, val: 0 }));
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const dd = new Date(now); dd.setDate(now.getDate() - i);
      const dk = dd.toISOString().slice(0, 10);
      const jsDay = dd.getDay(); // 0=Sun…6=Sat
      const idx = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon…6=Sun
      const found = history.find(h => (h.date || h.dateKey) === dk);
      if (found) result[idx] = { id: found.id, val: MOOD_VAL[found.id] || 50 };
    }
    // Overlay today's live selection if not yet in history
    if (selected) {
      const now2 = new Date(); const jsDay2 = now2.getDay();
      const idx2 = jsDay2 === 0 ? 6 : jsDay2 - 1;
      result[idx2] = { id: selected.id, val: MOOD_VAL[selected.id] || 50 };
    }
    return result;
  })();

  const faceClass  = (id) => MOOD_REF[id]?.cls || 'bien';
  const moodColor  = (id) => {
    const map = {tense:'var(--m-tenso)',tired:'var(--m-cansado)',neutral:'var(--m-neutro)',good:'var(--m-bien)',powered:'var(--m-energia)'};
    return map[id] || 'var(--m-bien)';
  };
  const moodAura   = (id) => {
    const map = {tense:'var(--ma-tenso)',tired:'var(--ma-cansado)',neutral:'var(--ma-neutro)',good:'var(--ma-bien)',powered:'var(--ma-energia)'};
    return map[id] || 'var(--ma-bien)';
  };
  const barFaceType = (id) => ['good','powered'].includes(id) ? 'smile' : id === 'neutral' ? 'flat' : 'frown';

  return (
    <>
      {/* ── CHECK-IN PANEL ── */}
      <div className="fvm-panel" style={{padding:"18px 20px",marginBottom:0}}>
        <span className="fvm-corners"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div className="fvm-ci-title" style={{margin:0}}>CHECK-IN EMOCIONAL DIARIO</div>
          {moodStreak > 0 && (
            <div className="fvm-streak-badge">
              <span className="fvm-sb-fire"/>
              <span className="fvm-sb-num">{moodStreak}</span>
              <span className="fvm-sb-lbl">DÍAS</span>
            </div>
          )}
        </div>
        <div className="fvm-ci-q">¿Cómo te sientes hoy? Elige tu estado de ánimo.</div>

        <div className="fvm-mood-grid">
          {MOODS.map(m => {
            const ref = MOOD_REF[m.id] || {};
            const isSelected = selected?.id === m.id;
            const isFaded    = selected && !isSelected;
            return (
              <div key={m.id}
                className={`fvm-mood-card ${ref.cls||''}${isSelected?' selected':''}${isFaded?' faded':''}`}
                onClick={() => pick(m)}
                style={{cursor: selected || saving ? 'default' : 'pointer',
                  opacity: saving && !isSelected ? .5 : undefined}}>
                {isSelected && <span className="fvm-scan"/>}
                {/* Pixel emoji face */}
                <div className={`fvm-face ${ref.cls||''}`}>
                  <span className="fvm-eye l"/>
                  <span className="fvm-eye r"/>
                  <span className="fvm-mouth"/>
                  {m.id === 'powered' && <span className="fvm-bolt"/>}
                </div>
                <div className="fvm-mood-name">{ref.label || m.label}</div>
                <div className="fvm-mood-desc">{ref.desc || ''}</div>
                <div className="fvm-mood-xp">+{ref.xpRef || m.xp} XP</div>
              </div>
            );
          })}
        </div>

        <div className="fvm-ci-hint">
          <span className="fvm-i">i</span>
          <span>Elige solo una opción. No podrás cambiarla después.</span>
        </div>
      </div>

      {/* ── FEEDBACK PANEL ── */}
      {selected && (() => {
        const ref  = MOOD_REF[selected.id] || {};
        const fb   = FB_MSG[selected.id]   || {};
        return (
          <motion.div
            key="feedback"
            className="fvm-panel fvm-feedback"
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            style={{
              '--fb-c': moodColor(selected.id),
              '--fb-a': moodAura(selected.id),
            }}>
            <span className="fvm-corners"/>
            <div style={{position:"relative",flexShrink:0}}>
              <div className="fvm-fb-aura"/>
              <div className={`fvm-fb-face ${ref.cls||''}`}
                style={{background: moodColor(selected.id)}}>
                <span className="fvm-eye l"/>
                <span className="fvm-eye r"/>
                <span className="fvm-mouth"/>
              </div>
            </div>
            <div className="fvm-fb-body">
              <div className="fvm-fb-headline">{fb.head}</div>
              <div className="fvm-fb-text">{fb.body}</div>
              <div className="fvm-fb-foot">
                <div>
                  <div className="fvm-fb-xp-v">+{ref.xpRef || selected.xp} XP</div>
                  <div className="fvm-fb-xp-l">XP TOTAL GANADA HOY</div>
                </div>
                <div className="fvm-stamp">
                  <span>COMPLETADO</span>
                  <span className="fvm-ck"/>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* ── CHART PANEL ── */}
      <div className="fvm-panel" style={{padding:"16px 18px"}}>
        <span className="fvm-corners"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div className="fvm-chart-title" style={{margin:0}}>HISTORIAL DE ÁNIMO — ÚLTIMOS 7 DÍAS</div>
          {history.length > 0 && (() => {
            const filled = chartHistory.filter(h => h.id);
            const avg = filled.length ? Math.round(filled.reduce((s,h)=>s+(h.val||0),0)/filled.length) : 0;
            const avgLabel = avg >= 75 ? "ALTO" : avg >= 50 ? "ESTABLE" : avg >= 30 ? "BAJO" : "--";
            const avgColor = avg >= 75 ? "var(--m-bien)" : avg >= 50 ? "var(--m-neutro)" : "var(--m-tenso)";
            return (
              <div style={{display:"flex",gap:10}}>
                <div className="fvm-chart-mini-stat">
                  <span style={{color:"var(--fvm-dim)"}}>DÍAS REG.</span>
                  <span style={{color:"var(--fvm-gold-b)"}}>{filled.length}/7</span>
                </div>
                <div className="fvm-chart-mini-stat">
                  <span style={{color:"var(--fvm-dim)"}}>TONO PROM.</span>
                  <span style={{color:avgColor,textShadow:`0 0 8px ${avgColor}`}}>{avgLabel}</span>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="fvm-chart-area">
          <div className="fvm-chart-y">
            <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
          </div>
          <div className="fvm-chart-bars">
            {[0,25,50,75,100].map(v => (
              <div key={v} className="fvm-gridline" style={{bottom:`${v}%`}}/>
            ))}
            {chartHistory.map((h, i) => {
              const isToday = i === todayColIdx;
              if (!h.id) {
                return <div key={i} className={`fvm-bar-col${isToday?' is-today':''}`}>
                  <div className="fvm-bar-fill" style={{height:'4px',opacity:.25,
                    '--bc':'var(--fvm-muted)','--ba':'transparent'}}/>
                </div>;
              }
              return (
                <div key={i} className={`fvm-bar-col${isToday?' is-today':''}`}>
                  <div className={`fvm-bar-fill${isToday?' today-bar':''}`}
                    style={{height:`${h.val||40}%`,
                      '--bc': moodColor(h.id), '--ba': moodAura(h.id)}}>
                    <div className={`fvm-bar-face ${barFaceType(h.id)}`}>
                      <span className="fvm-e l"/><span className="fvm-e r"/><span className="fvm-m"/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="fvm-chart-days">
          {DAYS_SHORT.map((d, i) => <div key={d} className={`fvm-cd${i===todayColIdx?' is-today':''}`}>{d}</div>)}
        </div>
        <div className="fvm-chart-legend">
          {[
            {cls:'tenso',   label:'TENSO'},
            {cls:'cansado', label:'CANSADO'},
            {cls:'neutro',  label:'NEUTRO'},
            {cls:'bien',    label:'BIEN'},
            {cls:'energia', label:'CON ENERGÍA'},
          ].map(l => (
            <div key={l.cls} className={`fvm-legend-item ${l.cls}`}>
              <span className="fvm-ld"/>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}



// ── Gratitude Diary — paleta idéntica a admin-config ────────
function GratitudeDiary({ onXP, todayDone, serverEntries, storageScope }) {
  const { t } = useLang();
  const lsKey  = menteScopedKey(storageScope, `gratitud_${todayStr()}`);
  const [entries,  setEntries]  = useState(() => lsGet(lsKey, ["","",""]));
  const [saved,    setSaved]    = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Pre-fill from server when localStorage is empty (new device / cleared storage)
  useEffect(() => {
    if (!serverEntries?.length) return;
    const lsVal = lsGet(lsKey, ["","",""]);
    if (lsVal.every(e => !e.trim())) {
      const filled = [...serverEntries.slice(0, 3)];
      while (filled.length < 3) filled.push("");
      setEntries(filled);
    }
  }, [serverEntries]);

  const save = async () => {
    const filled = entries.filter(e => e.trim().length > 2);
    if (filled.length < 1) return;
    lsSet(lsKey, entries);
    setSaved(true);
    try {
      setSaving(true);
      const token = await getToken();
      const res   = await saveGratitude(token, filled.length < 3 ? [...filled, ...Array(3-filled.length).fill("")] : entries);
      if (res.xpEarned) onXP(res.xpEarned, SC.teal, res);
    } catch {}
    finally { setSaving(false); setTimeout(() => setSaved(false), 2500); }
  };

  const LABELS  = [t("me.grat.label0"), t("me.grat.label1"), t("me.grat.label2")];
  const ACCENTS = [SC.gold, SC.orange, SC.teal];
  const allFilled = entries.every(e => e.trim().length > 2);

  return (
    <motion.div
      initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:0.08, duration:0.38, ease:"easeOut" }}
      style={{ marginTop:18 }}>

      {/* ══════════ CARD 3 — Diario de Gratitud ══════════ */}
      <div className="sc-section-card fvm-grat-card"
        style={{ padding:"22px 24px", borderTop:`2px solid ${SC.teal}` }}>

        {/* Card header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:36, height:36, borderRadius:8, flexShrink:0,
            background:`${SC.teal}18`, border:`1px solid ${SC.teal}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 14px ${SC.teal}22` }}>
            <IcoLeaf c={SC.teal} s={17}/>
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ ...orb(12,800), color:SC.white, margin:0, letterSpacing:"0.07em",
              textShadow:`0 0 12px ${SC.teal}44` }}>
              {t("me.grat.title")}
            </h2>
            <p style={{ ...raj(12,500), color:SC.muted, margin:0 }}>{t("me.grat.sub")}</p>
          </div>
          <AnimatePresence>
            {saved && (
              <motion.div key="saved"
                initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.8 }}
                style={{ display:"flex", alignItems:"center", gap:5,
                  background:`${SC.green}15`, border:`1px solid ${SC.green}33`,
                  padding:"5px 12px", borderRadius:20 }}>
                <span style={{ fontSize:11 }}>✓</span>
                <span style={{ ...raj(10,700), color:SC.green }}>{t("me.grat.saved")}</span>
              </motion.div>
            )}
            {!saved && todayDone?.gratitude && (
              <div key="done" style={{ display:"flex", alignItems:"center", gap:5,
                background:`${SC.teal}12`, border:`1px solid ${SC.teal}28`,
                padding:"5px 12px", borderRadius:20 }}>
                <span style={{ fontSize:11 }}>✓</span>
                <span style={{ ...raj(10,700), color:SC.teal }}>{t("me.grat.done_today")}</span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Science note */}
        <p style={{ ...raj(12,500), color:SC.muted, lineHeight:1.65,
          marginBottom:20, borderBottom:`1px solid ${SC.navy}`, paddingBottom:18 }}>
          {t("me.grat.science_pre")}{" "}
          <span style={{ color:SC.teal, fontWeight:700 }}>{t("me.grat.science_pct")}</span>{" "}{t("me.grat.science_suf")}
        </p>

        {/* Input rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {entries.map((e, i) => {
            const accent   = ACCENTS[i];
            const isFilled = e.trim().length > 2;
            return (
              <motion.div key={i}
                initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.07 + 0.05, ease:"easeOut" }}
                className="sc-grat-row"
                style={{ display:"flex", alignItems:"center", gap:0,
                  borderLeft:`3px solid ${isFilled ? accent : SC.navy}`,
                  transition:"border-color .2s" }}>

                {/* Number badge */}
                <div style={{ width:52, flexShrink:0, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:1,
                  borderRight:`1px solid ${SC.navy}`, padding:"12px 0",
                  background:`${isFilled ? accent + "0d" : "transparent"}`,
                  transition:"background .2s", borderRadius:"0" }}>
                  <span style={{ ...orb(14,900), color: isFilled ? accent : SC.mutedL,
                    transition:"color .2s" }}>
                    {i + 1}
                  </span>
                </div>

                {/* Input */}
                <input
                  value={e}
                  placeholder={LABELS[i]}
                  onChange={ev => { const n=[...entries]; n[i]=ev.target.value; setEntries(n); }}
                  className="sc-animo-input"
                  style={{ padding:"13px 16px" }}
                />

                {/* Filled indicator */}
                {isFilled && (
                  <div style={{ width:34, flexShrink:0, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                      transition={{ type:"spring", stiffness:320 }}
                      style={{ width:18, height:18, borderRadius:"50%",
                        background:`${accent}20`, border:`1.5px solid ${accent}`,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ ...orb(7,900), color:accent }}>✓</span>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* XP progress pills */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {entries.map((e, i) => {
            const accent   = ACCENTS[i];
            const isFilled = e.trim().length > 2;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:5,
                background: isFilled ? `${accent}12` : SC.panel,
                border:`1px solid ${isFilled ? accent + "33" : SC.navy}`,
                padding:"4px 12px", borderRadius:20, transition:"all .2s" }}>
                <span style={{ ...orb(9,700), color: isFilled ? accent : SC.muted }}>
                  {t("me.grat.pill_pre")} {i + 1}
                </span>
                {isFilled && (
                  <span style={{ ...raj(9,600), color:accent }}>+10 XP</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <motion.button
          whileHover={allFilled && !saving ? { scale:1.02, y:-2 } : {}}
          whileTap={allFilled && !saving ? { scale:0.97 } : {}}
          onClick={save} disabled={saving}
          className={allFilled && !saving ? "fvm-grat-save-active" : ""}
          style={{ display:"inline-flex", alignItems:"center", gap:8,
            background: allFilled
              ? `linear-gradient(135deg,${SC.teal},${SC.blue})`
              : SC.panel,
            border:`1.5px solid ${allFilled ? SC.teal : SC.navy}`,
            color: allFilled ? SC.white : SC.muted,
            padding:"11px 26px", borderRadius:10, ...raj(13,700),
            cursor: allFilled && !saving ? "pointer" : "default",
            boxShadow: allFilled ? `0 4px 28px ${SC.teal}55,0 0 60px ${SC.teal}18` : "none",
            opacity: saving ? 0.7 : 1, transition:"all .2s ease",
            position:"relative", overflow:"hidden" }}>
          {allFilled && !saving && <span className="fvm-btn-shimmer"/>}
          {saving ? t("me.grat.saving") : saved ? t("me.grat.save_done") : t("me.grat.save_btn")}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  2. RESPIRACIÓN HEROICA
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  2. RESPIRACIÓN HEROICA — SC admin-config premium redesign
// ══════════════════════════════════════════════════════════════
function BreathingExercise({ onXP, todayDone, heroClass, classTheme, breathingSessions }) {
  const { t } = useLang();
  const [mode,      setMode]      = useState(BREATH_MODES[0]);
  const [running,   setRunning]   = useState(false);
  const [phaseIdx,  setPhaseIdx]  = useState(0);
  const [countdown, setCountdown] = useState(mode.phases[0].d);
  const [cycles,    setCycles]    = useState(0);
  const [xpLogged,  setXpLogged]  = useState(false);
  const timerRef = useRef(null);
  const phaseRef = useRef(0);
  const cdRef    = useRef(mode.phases[0].d);

  const classAccent = classTheme?.accent || "#c08aff";
  const classSoft   = classTheme?.soft   || `${classAccent}18`;
  const classCrest  = classTheme?.crest  || null;
  const classLabel  = classTheme?.label  || "Héroe";

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    setRunning(false);
    setPhaseIdx(0);
    setCountdown(mode.phases[0].d);
    phaseRef.current = 0;
    cdRef.current    = mode.phases[0].d;
  }, [mode]);

  const start = useCallback(() => {
    phaseRef.current = 0;
    cdRef.current    = mode.phases[0].d;
    setPhaseIdx(0);
    setCountdown(mode.phases[0].d);
    setRunning(true);
    timerRef.current = setInterval(() => {
      cdRef.current -= 1;
      setCountdown(cdRef.current);
      if (cdRef.current <= 0) {
        const next = (phaseRef.current + 1) % mode.phases.length;
        if (next === 0) setCycles(c => c + 1);
        phaseRef.current = next;
        cdRef.current    = mode.phases[next].d;
        setPhaseIdx(next);
        setCountdown(mode.phases[next].d);
      }
    }, 1000);
  }, [mode]);

  useEffect(() => {
    if (cycles >= 3 && !xpLogged) {
      setXpLogged(true);
      getToken().then(t => logMenteSession(t, "breathing", { mode: mode.id, cycles }))
        .then(res => { if (res.xpEarned) onXP(res.xpEarned, mode.color, res); })
        .catch(() => {});
    }
  }, [cycles, xpLogged, mode.id, mode.color, onXP]);

  useEffect(() => { if (running) stop(); }, [mode]); // eslint-disable-line
  useEffect(() => () => clearInterval(timerRef.current), []);

  const phase      = mode.phases[phaseIdx];
  const isInhale   = phase?.label === "INHALA";
  const isExhale   = phase?.label === "EXHALA";
  const circleScale = running ? (isInhale ? 1.48 : isExhale ? 1 : 1.25) : 1;
  const transDur   = running ? `${phase?.d || 4}s` : "0.4s";
  const xpPct      = Math.min((cycles / 3) * 100, 100);
  const R          = 100; // SVG circle radius
  const CIRC       = 2 * Math.PI * R;

  const PHASE_ICONS = { "INHALA":"↑", "RETÉN":"⏸", "EXHALA":"↓", "PAUSA":"○" };
  const totalPhaseSec = mode.phases.reduce((s, p) => s + p.d, 0);

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.38, ease:"easeOut" }}>

      {/* ══════════ MAIN CARD ══════════ */}
      <div className="sc-section-card sc-breath-card"
        style={{
          "--breath-mode-c": mode.color,
          "--breath-class-c": classAccent,
          overflow:"hidden",
          transition:"all .35s ease",
          position:"relative",
        }}>

        {/* Class-colored top accent bar */}
        <div style={{ height:2, background:`linear-gradient(90deg,${classAccent},${mode.color},${classAccent}88)`, transition:"background .35s" }}/>

        {/* Subtle class bg tint */}
        <div style={{ position:"absolute", top:0, right:0, width:"45%", height:"180px",
          background:`radial-gradient(ellipse at 85% 10%,${classSoft},transparent 65%)`,
          pointerEvents:"none", zIndex:0 }}/>

        {/* ── Card header ── */}
        <div style={{ padding:"18px 24px 16px", position:"relative", zIndex:1,
          display:"flex", alignItems:"center", gap:12,
          borderBottom:`1px solid ${SC.navy}` }}>
          <motion.div
            animate={{ borderColor: mode.color + "55", background: mode.color + "18",
              boxShadow:`0 0 16px ${mode.color}22` }}
            transition={{ duration:.35 }}
            style={{ width:38, height:38, borderRadius:8, flexShrink:0,
              border:`1px solid ${mode.color}44`, background:`${mode.color}18`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IcoWind c={mode.color} s={17}/>
          </motion.div>
          <div style={{ flex:1 }}>
            <h2 style={{ ...orb(12,800), color:SC.white, margin:0, letterSpacing:"0.07em",
              textShadow:`0 0 12px ${mode.color}44` }}>
              {t("me.breath.title")}
            </h2>
            <p style={{ ...raj(12,500), color:SC.muted, margin:0 }}>
              {t("me.breath.sub")}
            </p>
          </div>

          {/* Class badge + session stats */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              {classCrest && (
                <img src={classCrest} alt={classLabel}
                  style={{ width:18, height:18, objectFit:"contain",
                    filter:`drop-shadow(0 0 5px ${classAccent}88)` }}
                  onError={e => { e.target.style.display="none"; }}/>
              )}
              <span className="sc-breath-class-badge"
                style={{ borderColor:`${classAccent}44`, color:classAccent,
                  background:`${classAccent}0e`,
                  boxShadow:`0 0 10px ${classAccent}18` }}>
                {classLabel.toUpperCase()}
              </span>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {breathingSessions > 0 && (
                <span style={{ ...raj(10,600), color:SC.muted }}>
                  <span style={{ color:classAccent, fontWeight:800 }}>{breathingSessions}</span> sesiones totales
                </span>
              )}
              {cycles > 0 && (
                <motion.div animate={{ scale:[1,1.04,1] }} transition={{ repeat:Infinity, duration:2 }}
                  style={{ display:"flex", alignItems:"center", gap:5,
                    background:`${SC.green}15`, border:`1px solid ${SC.green}33`,
                    padding:"4px 10px", borderRadius:16,
                    boxShadow:`0 0 12px ${SC.green}22` }}>
                  <span style={{ fontSize:10 }}>✓</span>
                  <span style={{ ...orb(9,800), color:SC.green }}>{cycles}/3 ciclos</span>
                </motion.div>
              )}
              {todayDone?.breathing && cycles === 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5,
                  background:`${classAccent}10`, border:`1px solid ${classAccent}33`,
                  padding:"4px 10px", borderRadius:16,
                  boxShadow:`0 0 10px ${classAccent}18` }}>
                  <span style={{ fontSize:10 }}>✓</span>
                  <span style={{ ...raj(10,700), color:classAccent }}>{t("me.breath.completed")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mode selector — 3 equal cards ── */}
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${SC.navy}`, position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {BREATH_MODES.map(bm => {
              const on = mode.id === bm.id;
              return (
                <motion.button key={bm.id}
                  className="sc-breath-mode-btn"
                  whileHover={!running && !on ? { y:-2, boxShadow:`0 6px 18px ${bm.color}22` } : {}}
                  whileTap={!running ? { scale:0.97 } : {}}
                  onClick={() => { if (!running) setMode(bm); }}
                  disabled={running}
                  style={{ background: on ? `${bm.color}14` : SC.panel,
                    border:`1.5px solid ${on ? bm.color + "66" : SC.navy}`,
                    borderTop:`2px solid ${on ? bm.color : SC.navy}`,
                    borderRadius:10, padding:"13px 14px",
                    opacity: running && !on ? 0.28 : 1,
                    boxShadow: on
                      ? `0 4px 20px ${bm.color}22, 0 0 0 1px ${bm.color}22, inset 0 0 24px ${classAccent}05`
                      : "none",
                    transition:"all .22s ease" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ ...orb(9,800), color: on ? bm.color : SC.mutedL,
                      letterSpacing:"0.05em", transition:"color .22s",
                      textShadow: on ? `0 0 10px ${bm.color}88` : "none" }}>
                      {t(bm.labelKey)}
                    </span>
                    <span style={{ ...raj(9,600), color: on ? bm.color : SC.muted,
                      background: on ? `${bm.color}18` : SC.card,
                      border:`1px solid ${on ? bm.color+"44" : SC.navy}`,
                      padding:"2px 8px", borderRadius:12, transition:"all .22s",
                      boxShadow: on ? `0 0 8px ${bm.color}22` : "none" }}>
                      {bm.short}
                    </span>
                  </div>
                  <p style={{ ...raj(10,500), color: on ? SC.mutedL : SC.muted, margin:0,
                    lineHeight:1.45 }}>
                    {t(bm.descKey)}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Main area — asymmetric 2-column ── */}
        <div className="sc-breath-grid" style={{ padding:"24px" }}>

          {/* LEFT — Orb + phase flow + button */}
          <div style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:22 }}>

            {/* ── Breathing orb ── */}
            <div style={{ position:"relative", width:230, height:230,
              display:"flex", alignItems:"center", justifyContent:"center" }}>

              {/* Slow class-accent ambient ring (always visible) */}
              <motion.div
                animate={{ scale:[1, 1.06, 1], opacity:[0.18, 0.32, 0.18] }}
                transition={{ duration:3.8, repeat:Infinity, ease:"easeInOut" }}
                style={{ position:"absolute", width:220, height:220,
                  borderRadius:"50%", border:`1px solid ${classAccent}`,
                  boxShadow:`0 0 18px ${classAccent}22, inset 0 0 18px ${classAccent}08`,
                  pointerEvents:"none" }}/>

              {/* Expanding mode-colored rings on run */}
              {running && [0,1,2].map(n => (
                <motion.div key={n}
                  animate={{ scale:[1, 1.35, 1], opacity:[0.38, 0, 0.38] }}
                  transition={{ duration:(phase?.d||4)*0.9, repeat:Infinity,
                    delay:n * 0.75, ease:"easeOut" }}
                  style={{ position:"absolute",
                    width: 170 + n*18, height: 170 + n*18,
                    borderRadius:"50%", border:`1px solid ${mode.color}`,
                    pointerEvents:"none" }}/>
              ))}

              {/* Class-accent outer pulse when running */}
              {running && (
                <motion.div
                  animate={{ scale:[1,1.18,1], opacity:[0.12,0.28,0.12] }}
                  transition={{ duration:(phase?.d||4)*1.4, repeat:Infinity, ease:"easeInOut" }}
                  style={{ position:"absolute", width:224, height:224, borderRadius:"50%",
                    border:`1.5px solid ${classAccent}`,
                    boxShadow:`0 0 28px ${classAccent}33`, pointerEvents:"none" }}/>
              )}

              {/* SVG progress ring — resets per phase via key */}
              <svg style={{ position:"absolute", width:230, height:230,
                transform:"rotate(-90deg)" }}>
                {/* Track */}
                <circle cx="115" cy="115" r={R} fill="none"
                  stroke={mode.color} strokeWidth="1.5" opacity="0.12"/>
                {/* Progress arc */}
                <motion.circle
                  key={`${running}-${phaseIdx}`}
                  cx="115" cy="115" r={R}
                  fill="none"
                  stroke={mode.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${CIRC}`}
                  initial={{ strokeDashoffset: CIRC, opacity: running ? 1 : 0 }}
                  animate={running
                    ? { strokeDashoffset: 0, opacity: 0.85 }
                    : { strokeDashoffset: CIRC, opacity: 0 }}
                  transition={running
                    ? { strokeDashoffset:{ duration:phase?.d || 4, ease:"linear" },
                        opacity:{ duration:0.3 } }
                    : { duration:0.4 }}/>
              </svg>

              {/* Inner orb */}
              <motion.div
                animate={{
                  scale: circleScale,
                  boxShadow: running
                    ? [`0 0 40px ${mode.color}35, 0 0 80px ${mode.color}15`,
                       `0 0 60px ${mode.color}55, 0 0 120px ${mode.color}20`,
                       `0 0 40px ${mode.color}35, 0 0 80px ${mode.color}15`]
                    : `0 0 20px ${mode.color}1A`,
                }}
                transition={{
                  scale:{ duration: running ? (phase?.d || 4) : 0.4, ease:"easeInOut" },
                  boxShadow: running ? { duration:2.5, repeat:Infinity, ease:"easeInOut" } : {},
                }}
                style={{ width:160, height:160, borderRadius:"50%", zIndex:1,
                  background:`radial-gradient(circle at 38% 35%,${mode.color}44,${mode.color}12)`,
                  border:`2px solid ${mode.color}${running ? "99" : "44"}`,
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:3,
                  transition:`border-color .4s ease` }}>
                {running ? (
                  <>
                    <span style={{ ...orb(8,800), color:mode.color,
                      letterSpacing:"0.14em" }}>
                      {PHASE_ICONS[phase?.label] || "·"} {phase?.phaseKey ? t(phase.phaseKey) : phase?.label}
                    </span>
                    <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:32,
                      color:SC.white, lineHeight:1,
                      textShadow:`0 0 24px ${mode.color}` }}>
                      {countdown}
                    </span>
                    <span style={{ ...raj(9,600), color:SC.muted }}>{t("me.breath.seg")}</span>
                  </>
                ) : (
                  <>
                    {classCrest
                      ? <img src={classCrest} alt={classLabel} style={{ width:46, height:46, objectFit:"contain",
                          filter:`drop-shadow(0 0 10px ${classAccent}99)`, marginBottom:2 }}
                          onError={e => { e.target.replaceWith(Object.assign(document.createElement("span"),{style:"font-size:36px",textContent:"🌬️"})); }}/>
                      : <span style={{ fontSize:38 }}>🌬️</span>}
                    <span style={{ ...raj(10,500), color:classAccent,
                      textShadow:`0 0 10px ${classAccent}66` }}>{t("me.breath.listo")}</span>
                  </>
                )}
              </motion.div>
            </div>

            {/* Phase flow chips */}
            <div style={{ display:"flex", alignItems:"center", gap:5,
              flexWrap:"wrap", justifyContent:"center" }}>
              {mode.phases.map((p, i) => {
                const isActive = running && i === phaseIdx;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <motion.div
                      animate={isActive ? { scale:[1,1.06,1] } : { scale:1 }}
                      transition={{ repeat:Infinity, duration:1.2 }}
                      style={{ padding:"5px 11px", borderRadius:8,
                        background: isActive ? `${mode.color}22` : SC.panel,
                        border:`1px solid ${isActive ? mode.color+"77" : SC.navy}`,
                        ...raj(10,700), color: isActive ? mode.color : SC.muted,
                        transition:"all .3s ease",
                        boxShadow: isActive ? `0 0 14px ${mode.color}30` : "none" }}>
                      {p.phaseKey ? t(p.phaseKey) : p.label} · {p.d}s
                    </motion.div>
                    {i < mode.phases.length - 1 && (
                      <span style={{ color:SC.navyL, fontSize:11, flexShrink:0 }}>▶</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            {!running ? (
              <motion.button
                whileHover={{ scale:1.05, y:-3,
                  boxShadow:`0 8px 32px ${mode.color}55, 0 0 20px ${classAccent}33, 0 2px 8px rgba(0,0,0,0.3)` }}
                whileTap={{ scale:0.96 }}
                onClick={start}
                style={{ background:`linear-gradient(135deg,${mode.color},${mode.color}CC,${classAccent}99)`,
                  border:"none",
                  color: mode.id === "power" ? SC.bg : SC.white,
                  padding:"13px 48px", borderRadius:10, ...raj(14,700),
                  cursor:"pointer", letterSpacing:"0.06em",
                  boxShadow:`0 6px 24px ${mode.color}44, 0 0 14px ${classAccent}22, 0 2px 8px rgba(0,0,0,0.25)`,
                  transition:"box-shadow .2s", position:"relative", overflow:"hidden" }}>
                <span className="fvm-btn-shimmer"/>
                {t("me.breath.comenzar")}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale:1.04, borderColor:`${classAccent}44` }}
                whileTap={{ scale:0.96 }}
                onClick={stop}
                style={{ background:SC.panel, border:`1.5px solid ${SC.navy}`,
                  color:SC.muted, padding:"13px 44px", borderRadius:10,
                  ...raj(14,700), cursor:"pointer",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
                  transition:"all .2s" }}>
                {t("me.breath.detener")}
              </motion.button>
            )}
          </div>

          {/* RIGHT — Info panel (3 stacked sub-cards) */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Technique tip */}
            <div style={{ background:SC.panel,
              border:`1px solid ${SC.navy}`,
              borderLeft:`3px solid ${mode.color}`,
              borderRadius:10, padding:"15px 16px",
              transition:"all .35s",
              boxShadow:`inset 0 0 0 1px ${classAccent}06` }}>
              <p style={{ ...orb(8,700), color:mode.color, margin:"0 0 7px",
                letterSpacing:"0.1em", transition:"color .35s",
                textShadow:`0 0 10px ${mode.color}44` }}>
                {t("me.breath.tecnica")}
              </p>
              <p style={{ ...raj(12,600), color:SC.white,
                lineHeight:1.72, margin:0 }}>
                {t(mode.tipKey)}
              </p>
            </div>

            {/* Phase sequence breakdown */}
            <div style={{ background:SC.panel, border:`1px solid ${SC.navy}`,
              borderRadius:10, padding:"15px 16px" }}>
              <p style={{ ...orb(8,700), color:SC.muted, margin:"0 0 13px",
                letterSpacing:"0.1em" }}>
                {t("me.breath.secuencia")}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {mode.phases.map((p, i) => {
                  const isActive = running && i === phaseIdx;
                  const barPct   = (p.d / totalPhaseSec) * 100;
                  return (
                    <div key={i}>
                      <div className="sc-breath-phase-row">
                        <span style={{ ...raj(11,700),
                          color: isActive ? mode.color : SC.mutedL,
                          transition:"color .3s" }}>
                          {PHASE_ICONS[p.label] || "·"} {p.phaseKey ? t(p.phaseKey) : p.label}
                        </span>
                        <span style={{ ...orb(9,700),
                          color: isActive ? mode.color : SC.muted,
                          transition:"color .3s" }}>
                          {p.d}s
                        </span>
                      </div>
                      <div style={{ height:4, borderRadius:4,
                        background:SC.navy, overflow:"hidden" }}>
                        <div style={{ width:`${barPct}%`, height:"100%",
                          borderRadius:4, transition:"background .35s",
                          background: isActive
                            ? `linear-gradient(90deg,${mode.color},${mode.color}88)`
                            : SC.navyL }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* XP progress */}
            <div style={{ background:SC.panel, border:`1px solid ${SC.navy}`,
              borderRadius:10, padding:"15px 16px",
              transition:"box-shadow .35s",
              boxShadow: cycles >= 3 ? `0 0 20px ${classAccent}22, inset 0 0 0 1px ${classAccent}18` : "none" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:10 }}>
                <p style={{ ...orb(8,700), color: cycles >= 3 ? classAccent : SC.muted, margin:0,
                  letterSpacing:"0.1em", transition:"color .35s",
                  textShadow: cycles >= 3 ? `0 0 10px ${classAccent}66` : "none" }}>
                  {t("me.breath.progreso_xp")}
                </p>
                <span style={{ ...raj(11,700),
                  color: cycles >= 3 ? classAccent : SC.muted,
                  textShadow: cycles >= 3 ? `0 0 10px ${classAccent}88` : "none",
                  transition:"all .35s" }}>
                  {cycles} / 3 {t("me.breath.ciclos")}
                </span>
              </div>
              <div style={{ height:6, borderRadius:6,
                background:SC.navy, overflow:"hidden", marginBottom:8,
                boxShadow: cycles >= 3 ? `0 0 10px ${classAccent}33` : "none" }}>
                <motion.div
                  animate={{ width:`${xpPct}%` }}
                  transition={{ duration:0.5, ease:"easeOut" }}
                  style={{ height:"100%", borderRadius:6,
                    background: cycles >= 3
                      ? `linear-gradient(90deg,${classAccent},${mode.color})`
                      : `linear-gradient(90deg,${mode.color},${mode.color}88)` }}/>
              </div>
              <p style={{ ...raj(10,500), color: cycles >= 3 ? classAccent : SC.muted,
                margin:0, lineHeight:1.55, transition:"color .35s" }}>
                {cycles >= 3
                  ? t("me.breath.done_xp")
                  : `${t("me.breath.need_pre")} ${3 - cycles} ${t(3 - cycles === 1 ? "me.breath.need_1" : "me.breath.need_n")}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  3. RUEDA PERMA — SC admin-config premium redesign
// ══════════════════════════════════════════════════════════════
function PermaWheel({ onXP, todayDone, storageScope, initialHistory, permaSessions, latestPermaAvg }) {
  const { t } = useLang();
  const lsKey = menteScopedKey(storageScope, `perma_${todayStr()}`);
  const [scores,  setScores]  = useState(() => lsGet(lsKey, {P:5,E:5,R:5,M:5,A:5}));
  const [active,  setActive]  = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [history, setHistory] = useState(() => initialHistory || []);

  useEffect(() => {
    // Use parent summary data if available; only fetch independently when not provided
    if (initialHistory?.length) { setHistory(initialHistory); return; }
    getToken().then(t => getPermaHistory(t)).then(res => {
      if (res.history) setHistory(res.history);
    }).catch(() => {});
  }, []);

  const save = async () => {
    lsSet(lsKey, scores);
    setSaved(true);
    try {
      setSaving(true);
      const token = await getToken();
      const res   = await savePerma(token, scores);
      if (res.xpEarned) onXP(res.xpEarned, SC.purple, res);
      const fresh = await getPermaHistory(token);
      if (fresh.history) setHistory(fresh.history);
    } catch {} finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const avg = Math.round(Object.values(scores).reduce((a,b)=>a+b,0) / 5 * 10) / 10;
  const trend = (() => {
    if (history.length < 2) return null;
    const last = history[history.length-1], prev = history[history.length-2];
    const d = (last.avg||5)-(prev.avg||5);
    return { delta: Math.round(d*10)/10, dir: d>0?"up":d<0?"down":"same" };
  })();

  const SVG_SIZE = 220, CX = 110, CY = 110, R_MAX = 88, R_MIN = 12, N = PERMA.length;
  const polar = (deg, r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };
  const polyPoints = PERMA.map((seg, i) => {
    const r = R_MIN + ((scores[seg.id] / 10) * (R_MAX - R_MIN));
    const p = polar((360 / N) * i, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  const activeSeg = PERMA.find(s => s.id === active);
  const trendColor = trend?.dir === "up" ? SC.green : trend?.dir === "down" ? SC.red : SC.muted;

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.38, ease:"easeOut" }}>

      {/* ══════════ MAIN CARD ══════════ */}
      <div className="sc-section-card sc-perma-card"
        style={{ overflow:"hidden" }}>

        {/* Purple top accent bar */}
        <div style={{ height:2, background:`linear-gradient(90deg,${SC.purple},${SC.blue},${SC.purple}88)` }}/>

        {/* ── Card header ── */}
        <div style={{ padding:"18px 24px 16px",
          display:"flex", alignItems:"center", gap:12,
          borderBottom:`1px solid ${SC.navy}` }}>
          <div style={{ width:38, height:38, borderRadius:8, flexShrink:0,
            background:`${SC.purple}18`, border:`1px solid ${SC.purple}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 16px ${SC.purple}22` }}>
            <IcoHexGrid c={SC.purple} s={17}/>
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ ...orb(12,800), color:SC.white, margin:0, letterSpacing:"0.07em",
              textShadow:`0 0 12px ${SC.purple}44` }}>
              {t("me.perma.title")}
            </h2>
            <p style={{ ...raj(12,500), color:SC.muted, margin:0 }}>
              {t("me.perma.sub")}
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              {trend && (
                <motion.div
                  animate={{ scale:[1,1.04,1] }}
                  transition={{ repeat: trend.dir!=="same" ? Infinity : 0, duration:2.2 }}
                  style={{ background:`${trendColor}15`, border:`1px solid ${trendColor}44`,
                    padding:"4px 10px", borderRadius:16,
                    boxShadow:`0 0 10px ${trendColor}22` }}>
                  <span style={{ ...raj(11,700), color:trendColor,
                    textShadow:`0 0 8px ${trendColor}88` }}>
                    {trend.dir==="up"?"↑ ":trend.dir==="down"?"↓ ":"= "}{Math.abs(trend.delta)}
                  </span>
                </motion.div>
              )}
              <div style={{ background:`${SC.gold}15`, border:`1px solid ${SC.gold}44`,
                padding:"4px 12px", borderRadius:16,
                boxShadow:`0 0 10px ${SC.gold}22` }}>
                <span style={{ ...orb(12,800), color:SC.gold,
                  textShadow:`0 0 10px ${SC.gold}88` }}>{avg}/10</span>
              </div>
              {todayDone?.perma && (
                <div style={{ display:"flex", alignItems:"center", gap:5,
                  background:`${SC.purple}12`, border:`1px solid ${SC.purple}44`,
                  padding:"4px 10px", borderRadius:16,
                  boxShadow:`0 0 10px ${SC.purple}22` }}>
                  <span style={{ fontSize:10 }}>✓</span>
                  <span style={{ ...raj(10,700), color:SC.purple,
                    textShadow:`0 0 8px ${SC.purple}88` }}>+40 XP</span>
                </div>
              )}
            </div>
            {permaSessions > 0 && (
              <span style={{ ...raj(10,500), color:SC.muted }}>
                <span style={{ color:SC.purple, fontWeight:800 }}>{permaSessions}</span> evaluaciones totales
              </span>
            )}
          </div>
        </div>

        {/* ── PERMA segment chips ── */}
        <div style={{ padding:"16px 24px 0",
          display:"flex", gap:8, flexWrap:"wrap" }}>
          {PERMA.map(seg => {
            const on = active === seg.id;
            const score = scores[seg.id];
            const scorePct = ((score - 1) / 9) * 100;
            return (
              <motion.button key={seg.id}
                className="sc-perma-chip"
                whileHover={!on ? { y:-3, boxShadow:`0 6px 20px ${seg.color}28` } : {}}
                whileTap={{ scale:0.96 }}
                onClick={() => setActive(on ? null : seg.id)}
                style={{ display:"flex", alignItems:"center", gap:7,
                  background: on ? `${seg.color}14` : SC.panel,
                  border:`1.5px solid ${on ? seg.color+"66" : SC.navy}`,
                  borderTop:`2px solid ${on ? seg.color : SC.navy}`,
                  borderRadius:10, padding:"8px 14px",
                  boxShadow: on
                    ? `0 4px 20px ${seg.color}28, 0 0 0 1px ${seg.color}18`
                    : "none",
                  transition:"all .22s ease" }}>
                {PERMA_ICO[seg.id]?.(on ? seg.color : SC.muted, 14)}
                <span style={{ ...orb(8,800), color: on ? seg.color : SC.muted,
                  letterSpacing:"0.08em", transition:"color .22s",
                  textShadow: on ? `0 0 8px ${seg.color}88` : "none" }}>
                  {seg.id}
                </span>
                <span style={{ ...raj(10,500), color: on ? seg.color : SC.mutedL,
                  transition:"color .22s" }}>
                  {t(seg.labelKey).replace("\n", " ")}
                </span>
                <motion.div
                  animate={{ background: on ? `${seg.color}22` : SC.card,
                    borderColor: on ? `${seg.color}55` : SC.navy,
                    boxShadow: on ? `0 0 10px ${seg.color}44` : "none" }}
                  style={{ width:24, height:24, borderRadius:6, flexShrink:0,
                    border:`1px solid ${on ? seg.color+"44" : SC.navy}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all .22s" }}>
                  <span style={{ ...orb(8,900), color: on ? seg.color : SC.muted,
                    textShadow: on ? `0 0 6px ${seg.color}` : "none" }}>
                    {score}
                  </span>
                </motion.div>
              </motion.button>
            );
          })}
        </div>

        {/* ── Detail card (expandable) ── */}
        <AnimatePresence>
          {activeSeg && (
            <motion.div key={activeSeg.id}
              initial={{ opacity:0, height:0 }}
              animate={{ opacity:1, height:"auto" }}
              exit={{ opacity:0, height:0 }}
              transition={{ duration:0.3, ease:"easeOut" }}
              style={{ overflow:"hidden" }}>
              <div style={{ margin:"14px 24px 0",
                background:SC.panel, borderRadius:10,
                border:`1px solid ${SC.navy}`,
                borderLeft:`3px solid ${activeSeg.color}`,
                padding:"16px 20px" }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:42, height:42, borderRadius:10, flexShrink:0,
                    background:`${activeSeg.color}18`, border:`1px solid ${activeSeg.color}33`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {PERMA_ICO[activeSeg.id]?.(activeSeg.color, 22)}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ ...orb(9,700), color:activeSeg.color,
                      margin:"0 0 7px", letterSpacing:"0.1em" }}>
                      {activeSeg.id} — {t(activeSeg.labelKey).replace("\n", " ").toUpperCase()}
                    </p>
                    <p style={{ ...raj(13,600), color:SC.white,
                      lineHeight:1.72, margin:"0 0 7px" }}>
                      {t(activeSeg.descKey)}
                    </p>
                    <p style={{ ...raj(12,500), color:SC.mutedL,
                      lineHeight:1.65, margin:0 }}>
                      {t(activeSeg.fullKey)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main grid: radar + sliders ── */}
        <div className="sc-perma-grid" style={{ padding:"22px 24px 24px" }}>

          {/* LEFT — Enhanced SVG radar */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
            <svg width={SVG_SIZE + 40} height={SVG_SIZE + 40}
              viewBox={`-20 -20 ${SVG_SIZE + 40} ${SVG_SIZE + 40}`}
              style={{ overflow:"visible" }}>
              <defs>
                <radialGradient id="pg-fill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={SC.purple} stopOpacity="0.36"/>
                  <stop offset="100%" stopColor={SC.blue}   stopOpacity="0.06"/>
                </radialGradient>
                <radialGradient id="pg-fill-active" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={activeSeg?.color || SC.purple} stopOpacity="0.44"/>
                  <stop offset="100%" stopColor={SC.purple} stopOpacity="0.08"/>
                </radialGradient>
                <filter id="pg-glow">
                  <feGaussianBlur stdDeviation="5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="pg-dot-glow">
                  <feGaussianBlur stdDeviation="3" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="pg-strong-glow">
                  <feGaussianBlur stdDeviation="7" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Dashed concentric rings */}
              {[2, 4, 6, 8, 10].map(ring => (
                <circle key={ring} cx={CX} cy={CY}
                  r={R_MIN + ((ring / 10) * (R_MAX - R_MIN))}
                  fill="none" stroke={SC.navyL} strokeWidth="0.8"
                  strokeDasharray="3 5" opacity="0.6"/>
              ))}

              {/* Spoke lines — colored on active */}
              {PERMA.map((seg, i) => {
                const pt   = polar((360 / N) * i, R_MAX);
                const isOn = active === seg.id;
                return (
                  <line key={i} x1={CX} y1={CY} x2={pt.x} y2={pt.y}
                    stroke={isOn ? seg.color : SC.navyL}
                    strokeWidth={isOn ? 1.5 : 0.8}
                    opacity={isOn ? 0.7 : 0.5}
                    style={{ transition:"stroke .3s, opacity .3s" }}/>
                );
              })}

              {/* Strong glow polygon (blurred copy) */}
              <polygon points={polyPoints}
                fill="none"
                stroke={activeSeg ? activeSeg.color : SC.purple}
                strokeWidth="8" opacity={activeSeg ? 0.22 : 0.14}
                filter="url(#pg-strong-glow)"
                style={{ transition:"all .5s cubic-bezier(.4,0,.2,1)" }}/>

              {/* Standard glow polygon */}
              <polygon points={polyPoints}
                fill="none" stroke={SC.purple} strokeWidth="3" opacity="0.18"
                filter="url(#pg-glow)"
                style={{ transition:"all .5s cubic-bezier(.4,0,.2,1)" }}/>

              {/* Main filled polygon */}
              <polygon points={polyPoints}
                fill={activeSeg ? "url(#pg-fill-active)" : "url(#pg-fill)"}
                stroke={activeSeg ? activeSeg.color : SC.purple}
                strokeWidth="1.8"
                style={{ transition:"all .5s cubic-bezier(.4,0,.2,1)" }}/>

              {/* Vertex dots */}
              {PERMA.map((seg, i) => {
                const r    = R_MIN + ((scores[seg.id] / 10) * (R_MAX - R_MIN));
                const pt   = polar((360 / N) * i, r);
                const isOn = active === seg.id;
                return (
                  <g key={i} style={{ cursor:"pointer" }}
                    onClick={() => setActive(active === seg.id ? null : seg.id)}>
                    {/* Outer halo when active */}
                    {isOn && (
                      <circle cx={pt.x} cy={pt.y} r={20}
                        fill={seg.color} opacity="0.10"
                        filter="url(#pg-dot-glow)"/>
                    )}
                    {/* Mid glow ring */}
                    <circle cx={pt.x} cy={pt.y} r={isOn ? 14 : 10}
                      fill={seg.color} opacity={isOn ? 0.18 : 0.08}
                      style={{ transition:"all .3s ease" }}/>
                    {/* Core dot */}
                    <circle cx={pt.x} cy={pt.y} r={isOn ? 8 : 5.5}
                      fill={seg.color} stroke={SC.card} strokeWidth="2"
                      filter={isOn ? "url(#pg-dot-glow)" : undefined}
                      style={{ transition:"all .3s ease" }}/>
                  </g>
                );
              })}

              {/* Axis labels */}
              {PERMA.map((seg, i) => {
                const { x, y } = polar((360 / N) * i, R_MAX + 22);
                const isOn = active === seg.id;
                return (
                  <text key={seg.id} x={x} y={y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="11" fontFamily="'Orbitron',sans-serif" fontWeight="800"
                    fill={isOn ? seg.color : SC.mutedL}
                    style={{ cursor:"pointer", userSelect:"none", transition:"fill .3s",
                      filter: isOn ? `drop-shadow(0 0 4px ${seg.color})` : "none" }}
                    onClick={() => setActive(active === seg.id ? null : seg.id)}>
                    {seg.id}
                  </text>
                );
              })}

              {/* Center score */}
              <text x={CX} y={CY - 9} textAnchor="middle"
                fontSize="24" fontFamily="'Orbitron',sans-serif" fontWeight="900"
                fill={SC.white} style={{ filter:`drop-shadow(0 0 6px ${SC.purple}88)` }}>
                {avg}
              </text>
              <text x={CX} y={CY + 12} textAnchor="middle"
                fontSize="7.5" fontFamily="'Manrope',sans-serif" fontWeight="600"
                fill={SC.muted}>{t("me.perma.bienestar")}</text>
            </svg>
          </div>

          {/* RIGHT — Premium sliders + save */}
          <div style={{ display:"flex", flexDirection:"column",
            gap:18, justifyContent:"center" }}>

            {PERMA.map(seg => (
              <div key={seg.id}>
                {/* Label row */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  {PERMA_ICO[seg.id]?.(seg.color, 14)}
                  <span style={{ ...orb(8,800), color:seg.color, letterSpacing:"0.08em" }}>
                    {seg.id}
                  </span>
                  <span style={{ ...raj(11,500), color:SC.muted, flex:1, lineHeight:1.3 }}>
                    {t(seg.labelKey).replace("\n", " ")}
                  </span>
                  <motion.span
                    key={scores[seg.id]}
                    initial={{ scale:1.25, opacity:0.6 }}
                    animate={{ scale:1, opacity:1 }}
                    transition={{ duration:0.15 }}
                    style={{ ...orb(13,900), color:seg.color,
                      minWidth:22, textAlign:"right" }}>
                    {scores[seg.id]}
                  </motion.span>
                </div>

                {/* Animated fill track */}
                <div style={{ height:3, borderRadius:3, background:SC.navy,
                  marginBottom:3, overflow:"hidden" }}>
                  <motion.div
                    animate={{ width:`${(scores[seg.id] / 10) * 100}%` }}
                    transition={{ duration:0.15, ease:"easeOut" }}
                    style={{ height:"100%", borderRadius:3,
                      background:`linear-gradient(90deg,${seg.color},${seg.color}88)` }}/>
                </div>

                {/* Range input */}
                <input type="range" min="1" max="10" value={scores[seg.id]}
                  onChange={e => setScores(p => ({...p, [seg.id]:+e.target.value}))}
                  className="sc-perma-slider"
                  style={{ color:seg.color }}/>
              </div>
            ))}

            {/* Save */}
            <motion.button
              whileHover={{ scale:1.03, y:-2,
                boxShadow:`0 8px 30px ${saved ? SC.green : SC.purple}55, 0 0 0 1px ${saved ? SC.green : SC.purple}33` }}
              whileTap={{ scale:0.97 }}
              onClick={save} disabled={saving}
              style={{ marginTop:4, display:"flex", alignItems:"center",
                justifyContent:"center", gap:8, position:"relative", overflow:"hidden",
                background: saved
                  ? `linear-gradient(135deg,${SC.green},${SC.teal})`
                  : `linear-gradient(135deg,${SC.purple},${SC.blue})`,
                border:"none", color:SC.white,
                padding:"12px 22px", borderRadius:10, ...raj(13,700),
                cursor:"pointer", opacity: saving ? 0.7 : 1,
                letterSpacing:"0.04em",
                boxShadow:`0 4px 20px ${saved ? SC.green : SC.purple}40`,
                transition:"background .4s ease, box-shadow .25s ease" }}>
              {!saved && !saving && <span className="fvm-btn-shimmer"/>}
              {saving
                ? t("me.perma.saving")
                : saved
                  ? <><span>✓</span>{t("me.perma.saved")}</>
                  : t("me.perma.save_btn")}
            </motion.button>
          </div>
        </div>

        {/* ── Mini PERMA history chart ── */}
        {history.length > 0 && (() => {
          const recent = history.slice(-7);
          const days = ["L","M","X","J","V","S","D"];
          return (
            <div style={{ padding:"0 24px 20px",
              borderTop:`1px solid ${SC.navy}`,
              background:`linear-gradient(180deg,${SC.purple}05,transparent)` }}>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", marginBottom:12, paddingTop:16 }}>
                <span style={{ ...orb(8,700), color:SC.muted, letterSpacing:"0.08em" }}>
                  HISTORIAL PERMA — ÚLTIMAS {recent.length} SESIONES
                </span>
                <div style={{ display:"flex", gap:10 }}>
                  {PERMA.map(seg => (
                    <div key={seg.id} style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:seg.color,
                        boxShadow:`0 0 4px ${seg.color}` }}/>
                      <span style={{ ...orb(7,700), color:SC.muted }}>{seg.id}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:60 }}>
                {recent.map((entry, i) => {
                  const heightPct = Math.max(((entry.avg || 0) / 10) * 100, 4);
                  const isLast = i === recent.length - 1;
                  const d = entry.dateKey ? new Date(entry.dateKey + "T12:00:00") : new Date();
                  const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
                  const barColor = isLast
                    ? `linear-gradient(180deg,${SC.purple},${SC.blue})`
                    : `linear-gradient(180deg,${SC.purple}88,${SC.blue}44)`;
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                      alignItems:"center", gap:3 }}>
                      <span style={{ ...raj(8,600), color: isLast ? SC.purple : SC.muted,
                        textShadow: isLast ? `0 0 8px ${SC.purple}` : "none",
                        transition:"all .3s" }}>
                        {entry.avg != null ? entry.avg.toFixed(1) : ""}
                      </span>
                      <div style={{ width:"100%", display:"flex", alignItems:"flex-end",
                        height:42, borderRadius:3, overflow:"hidden" }}>
                        <motion.div
                          initial={{ height:0 }} animate={{ height:`${heightPct}%` }}
                          transition={{ duration:0.5, delay:i * 0.04, ease:"easeOut" }}
                          style={{ width:"100%", borderRadius:3,
                            background: barColor,
                            boxShadow: isLast ? `0 0 10px ${SC.purple}55` : "none" }}/>
                      </div>
                      <span style={{ ...raj(7,600), color: isLast ? SC.mutedL : SC.muted }}>
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  4. AFIRMACIONES DEL HÉROE — SC admin-config premium redesign
// ══════════════════════════════════════════════════════════════
function HeroAffirmations({ heroClass, onXP, todayDone, classTheme, storageScope, affirmationSessions }) {
  const { t } = useLang();
  const cards  = AFFIRMATIONS[heroClass] || AFFIRMATIONS.DEFAULT;

  // Persist done set to localStorage scoped to user + today's date
  const todayKey = new Date().toISOString().slice(0,10);
  const lsKey    = `fv_mente_${storageScope || "guest"}_aff_done_${todayKey}`;
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done,    setDone]    = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(lsKey) || "[]")); }
    catch { return new Set(); }
  });
  const [exiting, setExiting] = useState(false);
  const [xpDone,  setXpDone]  = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const classColor  = classTheme?.accent    || SC.gold;
  const classSoft   = classTheme?.soft      || `${classColor}18`;
  const classCrest  = classTheme?.crest     || null;
  const classLabel  = classTheme?.label     || heroClass || "HÉROE";

  const classDescKey = heroClass==="GUERRERO" ? "me.aff.guerrero.desc"
                     : heroClass==="ARQUERO"  ? "me.aff.arquero.desc"
                     : heroClass==="MAGO"     ? "me.aff.mago.desc"
                     : "me.aff.default.desc";

  const next = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => { setFlipped(false); setIdx(i=>(i+1)%cards.length); setExiting(false); }, 280);
  };

  const markDone = async () => {
    const nd = new Set(done); nd.add(idx);
    setDone(nd);
    try { localStorage.setItem(lsKey, JSON.stringify([...nd])); } catch {}
    if (nd.size >= cards.length) { setCelebrated(true); }
    else { next(); }
    // XP: only once per day (guard with todayDone?.affirmation AND local xpDone)
    if (nd.size >= 3 && !xpDone && !todayDone?.affirmation) {
      setXpDone(true);
      try {
        const token = await getToken();
        const res   = await logMenteSession(token, "affirmation", { cardsDone: nd.size });
        if (res.xpEarned) onXP(res.xpEarned, SC.gold, res);
      } catch {}
    }
  };

  const card = cards[idx];

  // ── Inline SVG micro-icons ─────────────────────────────────
  const IcoSpark = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
  const IcoChevL = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
  const IcoChevR = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
  const IcoCheck = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  const IcoDiamond = ({ size=16, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color||"currentColor"}
      style={{ flexShrink:0 }}>
      <path d="M12 2l10 10-10 10L2 12z" opacity=".85"/>
    </svg>
  );
  const IcoInfo = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"
        strokeWidth="3"/><line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );

  return (
    <motion.div {...fadeUp}>
      {/* ── Single SC card ── */}
      <div style={{ ...scCard(classColor), overflow:"hidden", position:"relative",
        borderTop:"none", "--aff-c": classColor }}>

        {/* Top gradient accent bar */}
        <div style={{ height:2, background:`linear-gradient(90deg,${classColor},${classColor}BB,${classColor}33)` }}/>

        {/* Ambient class glow — top right */}
        <div style={{ position:"absolute", top:0, right:0, width:"40%", height:160,
          background:`radial-gradient(ellipse at 90% 10%,${classSoft},transparent 65%)`,
          pointerEvents:"none" }}/>

        {/* ── Card header ── */}
        <div style={{
          padding:"18px 24px 16px", position:"relative",
          borderBottom:`1px solid ${SC.navy}`,
          display:"flex", alignItems:"center", gap:14,
        }}>
          {/* Icon badge with crest or spark */}
          <div style={{
            width:44, height:44, borderRadius:10, flexShrink:0,
            background:classSoft, border:`1px solid ${classColor}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:classColor, boxShadow:`0 0 14px ${classColor}22`,
          }}>
            {classCrest
              ? <img src={classCrest} alt={classLabel}
                  style={{ width:26, height:26, objectFit:"contain",
                    filter:`drop-shadow(0 0 6px ${classColor}88)` }}
                  onError={e => { e.target.style.display="none"; }}/>
              : <IcoSpark/>}
          </div>

          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
              <span style={{ ...orb(11,700), color:SC.white, letterSpacing:"0.06em" }}>
                {t("me.aff.title")}
              </span>
              <span style={{
                ...raj(9,700), color:classColor,
                background:classSoft, border:`1px solid ${classColor}44`,
                padding:"2px 8px", borderRadius:12, letterSpacing:"0.08em",
              }}>
                {classLabel.toUpperCase()}
              </span>
              {todayDone?.affirmation && (
                <motion.span
                  initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  style={{
                    ...raj(9,700), color:SC.green,
                    background:`${SC.green}14`, border:`1px solid ${SC.green}44`,
                    padding:"2px 8px", borderRadius:12,
                  }}>
                  ✓ {t("me.aff.completed")}
                </motion.span>
              )}
            </div>
            <div style={{ ...raj(11,400), color:SC.muted }}>
              {t("me.aff.science")}
            </div>
          </div>

          {/* Progress + sessions counter */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
              <motion.span
                key={done.size}
                initial={{ scale:1.3, color:classColor }} animate={{ scale:1 }}
                transition={{ duration:0.2 }}
                style={{ ...orb(18,900), color:classColor,
                  textShadow:`0 0 10px ${classColor}66` }}>
                {done.size}
              </motion.span>
              <span style={{ ...raj(10,500), color:SC.muted }}>/ {cards.length}</span>
            </div>
            <span style={{ ...raj(9,600), color:SC.muted, letterSpacing:"0.06em" }}>
              {t("me.aff.interiorizadas")}
            </span>
            {affirmationSessions > 0 && (
              <span style={{ ...raj(9,500), color:SC.muted }}>
                <span style={{ color:classColor, fontWeight:700 }}>{affirmationSessions}</span>
                {" sesiones totales"}
              </span>
            )}
          </div>
        </div>

        {/* ── Main body: asymmetric grid ── */}
        <div className="sc-aff-grid" style={{ padding:"22px 24px 24px", position:"relative" }}>

          {/* LEFT — flip card + navigation */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Card indicator strip */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ ...orb(8,700), color:SC.muted, letterSpacing:"0.12em" }}>
                {t("me.aff.carta_pre")} {String(idx+1).padStart(2,"0")} / {String(cards.length).padStart(2,"0")}
              </span>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {cards.map((_,i) => {
                  const isCur  = i === idx;
                  const isDone = done.has(i);
                  return (
                    <motion.div key={i}
                      animate={{
                        width: isCur ? 22 : 7,
                        background: isDone ? SC.green : isCur ? classColor : SC.navy,
                        boxShadow: isCur ? `0 0 8px ${classColor}88` : "none",
                      }}
                      transition={{ duration:.3 }}
                      style={{ height:4, borderRadius:4, cursor:"pointer" }}
                      onClick={() => { setFlipped(false); setIdx(i); }}/>
                  );
                })}
              </div>
            </div>

            {/* ── Celebration state — all cards done ── */}
            <AnimatePresence>
              {celebrated && (
                <motion.div
                  initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0 }}
                  style={{ height:248, borderRadius:12, overflow:"hidden", position:"relative",
                    background:`linear-gradient(140deg,${classColor}1a 0%,${SC.panel} 100%)`,
                    border:`1.5px solid ${classColor}55`,
                    display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", gap:14, textAlign:"center",
                    boxShadow:`0 0 40px ${classColor}22, inset 0 0 60px ${classColor}08` }}>
                  <div style={{ fontSize:40 }}>✨</div>
                  <div style={{ ...orb(13,900), color:classColor,
                    textShadow:`0 0 14px ${classColor}` }}>
                    ¡TODAS INTERIORIZADAS!
                  </div>
                  <p style={{ ...raj(12,500), color:SC.mutedL, margin:0, padding:"0 24px", lineHeight:1.65 }}>
                    Has completado las {cards.length} afirmaciones de hoy. Tu mente ya tiene las herramientas.
                  </p>
                  <motion.button
                    whileHover={{ scale:1.04, y:-2 }} whileTap={{ scale:0.96 }}
                    onClick={() => { setCelebrated(false); setFlipped(false); setIdx(0); }}
                    style={{ background:`linear-gradient(135deg,${classColor},${classColor}BB)`,
                      border:"none", color:"#fff", padding:"10px 20px", borderRadius:8,
                      ...raj(11,700), cursor:"pointer", position:"relative", overflow:"hidden",
                      boxShadow:`0 4px 18px ${classColor}44` }}>
                    <span className="fvm-btn-shimmer"/>
                    Repasar cartas
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Flip card ── */}
            {!celebrated && (
              <div className="mm-aff-card"
                style={{ height:248, position:"relative", "--aff-c": classColor }}
                onClick={() => setFlipped(f => !f)}>
                <div className={`mm-aff-inner ${flipped ? "flipped" : ""}`}
                  style={{ width:"100%", height:"100%" }}>

                  {/* FRONT — question */}
                  <div className="mm-aff-face" style={{
                    background:SC.panel,
                    border:`1px solid ${SC.navy}`,
                    borderLeft:`3px solid ${classColor}`,
                    borderRadius:12,
                    transition:"box-shadow .25s ease",
                  }}>
                    <span className="mm-aff-shimmer"/>
                    {/* Card number watermark */}
                    <span style={{
                      position:"absolute", top:16, right:18,
                      ...orb(9,700), color:`${classColor}44`, letterSpacing:"0.12em",
                      userSelect:"none",
                    }}>
                      #{String(idx+1).padStart(2,"0")}
                    </span>

                    {/* Diamond accent with glow */}
                    <div style={{ marginBottom:16, opacity:.85,
                      filter:`drop-shadow(0 0 6px ${classColor}66)` }}>
                      <IcoDiamond size={20} color={classColor}/>
                    </div>

                    <p style={{
                      ...raj(15,700), color:SC.white, textAlign:"center",
                      lineHeight:1.68, margin:"0 0 20px", padding:"0 16px",
                      position:"relative", zIndex:1,
                    }}>
                      {card.q}
                    </p>

                    {/* Hint */}
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:24, height:1, background:SC.navy }}/>
                      <span style={{ ...raj(10,600), color:SC.muted }}>{t("me.aff.touch_reveal")}</span>
                      <div style={{ width:24, height:1, background:SC.navy }}/>
                    </div>
                  </div>

                  {/* BACK — affirmation */}
                  <div className="mm-aff-face mm-aff-back" style={{
                    background:`linear-gradient(140deg,${classColor}18 0%,${SC.card} 55%)`,
                    border:`1.5px solid ${classColor}66`,
                    borderRadius:12,
                    boxShadow:`0 0 40px ${classColor}22, inset 0 0 40px ${classColor}0a`,
                  }}>
                    {/* Large decorative quote */}
                    <span style={{
                      position:"absolute", top:2, left:18,
                      fontFamily:"Georgia, 'Times New Roman', serif",
                      fontSize:88, lineHeight:1,
                      color:`${classColor}22`,
                      userSelect:"none", pointerEvents:"none",
                    }}>"</span>
                    {/* Bottom glow line */}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1,
                      background:`linear-gradient(90deg,transparent,${classColor}55,transparent)`,
                      pointerEvents:"none" }}/>

                    <p style={{
                      ...raj(14,700), color:SC.white, textAlign:"center",
                      lineHeight:1.78, fontStyle:"italic",
                      padding:"0 20px",
                      position:"relative", zIndex:1,
                      textShadow:`0 0 30px ${classColor}22`,
                    }}>
                      "{card.a}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Controls ── */}
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <motion.button
                whileHover={{ scale:1.05, x:-2,
                  boxShadow:`0 4px 16px rgba(0,0,0,.3), inset 0 0 0 1px ${SC.navy}` }}
                whileTap={{ scale:.95 }}
                onClick={() => { setFlipped(false); setIdx(i=>(i-1+cards.length)%cards.length); }}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  background:SC.panel, border:`1px solid ${SC.navy}`,
                  color:SC.muted, padding:"10px 14px", borderRadius:8,
                  ...raj(11,700), cursor:"pointer", transition:"all .18s",
                }}>
                <IcoChevL/> {t("me.aff.anterior")}
              </motion.button>

              <div style={{ flex:1, display:"flex", justifyContent:"center" }}>
                <AnimatePresence>
                  {flipped && !celebrated && (
                    <motion.button
                      initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                      exit={{ scale:0, opacity:0 }}
                      whileHover={{ scale:1.06, y:-2,
                        boxShadow:`0 8px 28px ${SC.green}55` }}
                      whileTap={{ scale:.95 }}
                      onClick={markDone}
                      style={{
                        display:"flex", alignItems:"center", gap:7, position:"relative",
                        overflow:"hidden",
                        background:`linear-gradient(135deg,${SC.green},${SC.teal})`,
                        border:"none", color:SC.white,
                        padding:"10px 18px", borderRadius:8,
                        ...raj(11,700), cursor:"pointer",
                        boxShadow:`0 4px 20px ${SC.green}44`,
                        letterSpacing:"0.04em",
                      }}>
                      <span className="fvm-btn-shimmer"/>
                      <IcoCheck/> {t("me.aff.interiorizado")}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale:1.05, x:2,
                  boxShadow:`0 6px 22px ${classColor}44` }}
                whileTap={{ scale:.95 }}
                onClick={next}
                style={{
                  display:"flex", alignItems:"center", gap:6, position:"relative",
                  overflow:"hidden",
                  background:`linear-gradient(135deg,${classColor},${classColor}CC)`,
                  border:"none", color:SC.white,
                  padding:"10px 14px", borderRadius:8,
                  ...raj(11,700), cursor:"pointer",
                  boxShadow:`0 4px 16px ${classColor}33`,
                  transition:"box-shadow .2s ease",
                }}>
                <span className="fvm-btn-shimmer"/>
                {t("me.aff.siguiente")} <IcoChevR/>
              </motion.button>
            </div>
          </div>

          {/* RIGHT — progress sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Class context with glow */}
            <div style={{
              background:SC.panel, position:"relative", overflow:"hidden",
              border:`1px solid ${classColor}33`,
              borderTop:`2px solid ${classColor}`,
              borderRadius:10, padding:"16px",
              boxShadow:`0 0 16px ${classColor}0e, inset 0 0 20px ${classColor}06`,
            }}>
              <div style={{ position:"absolute", top:0, right:0, width:"60%", height:"100%",
                background:`radial-gradient(ellipse at 90% 20%,${classSoft},transparent 70%)`,
                pointerEvents:"none" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, position:"relative" }}>
                {classCrest
                  ? <img src={classCrest} alt={classLabel}
                      style={{ width:20, height:20, objectFit:"contain",
                        filter:`drop-shadow(0 0 5px ${classColor}88)` }}
                      onError={e => { e.target.style.display="none"; }}/>
                  : <IcoDiamond size={10} color={classColor}/>}
                <span style={{ ...orb(8,700), color:classColor, letterSpacing:"0.1em",
                  textShadow:`0 0 8px ${classColor}66` }}>
                  {classLabel.toUpperCase()}
                </span>
              </div>
              <p style={{ ...raj(12,500), color:SC.mutedL, lineHeight:1.68, margin:0, position:"relative" }}>
                {t(classDescKey)}
              </p>
            </div>

            {/* Progress list */}
            <div style={{
              background:SC.panel, border:`1px solid ${SC.navy}`,
              borderRadius:10, padding:"14px 12px", flex:1,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:10, padding:"0 4px" }}>
                <span style={{ ...orb(8,700), color:SC.muted, letterSpacing:"0.1em" }}>
                  {t("me.aff.progreso")}
                </span>
                {done.size > 0 && (
                  <span style={{ ...raj(9,600), color:classColor,
                    textShadow:`0 0 6px ${classColor}66` }}>
                    {done.size}/{cards.length} ✓
                  </span>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                {cards.map((c,i) => {
                  const isDone   = done.has(i);
                  const isActive = i === idx;
                  return (
                    <div key={i}
                      className={`sc-aff-row-item${isActive ? " is-active" : ""}`}
                      style={{ "--aff-c": classColor }}
                      onClick={() => { setFlipped(false); setIdx(i); }}>
                      {/* State indicator */}
                      <motion.div
                        animate={{
                          background: isDone ? SC.green : isActive ? classColor : SC.navy,
                          boxShadow: isActive && !isDone
                            ? `0 0 0 0 ${classColor}55`
                            : "none",
                        }}
                        transition={{ duration:.25 }}
                        style={{
                          width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          color:"#fff",
                          animation: isActive && !isDone ? "aff-dot-pulse 1.8s ease-in-out infinite" : "none",
                        }}>
                        {isDone
                          ? <IcoCheck/>
                          : <span style={{ ...orb(6,900) }}>{i+1}</span>}
                      </motion.div>
                      {/* Question preview */}
                      <span style={{
                        ...raj(11, isActive ? 700 : 500),
                        color: isDone ? SC.green : isActive ? SC.white : SC.muted,
                        lineHeight:1.45, flex:1,
                        display:"-webkit-box", WebkitLineClamp:2,
                        WebkitBoxOrient:"vertical", overflow:"hidden",
                        transition:"color .18s",
                      }}>
                        {c.q}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Science note */}
            <div style={{
              background:`${SC.blue}08`, border:`1px solid ${SC.blue}22`,
              borderRadius:8, padding:"12px 14px",
              display:"flex", gap:9, alignItems:"flex-start",
              transition:"border-color .2s",
            }}>
              <div style={{ color:SC.blue, marginTop:1, flexShrink:0 }}>
                <IcoInfo/>
              </div>
              <p style={{ ...raj(10,500), color:SC.mutedL, lineHeight:1.65, margin:0 }}>
                <span style={{ ...raj(10,700), color:SC.blue }}>{t("me.aff.science_author")} </span>
                {t("me.aff.science2")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  5. TEST DE FORTALEZAS VIA — SC admin-config premium redesign
// ══════════════════════════════════════════════════════════════
function StrengthsTest({ onXP, todayDone, storageScope, classTheme, initialStrengths, strengthsSessions }) {
  const { t } = useLang();
  const [serverResult, setServerResult] = useState(() => initialStrengths || null);
  const [loadingServer, setLoadingServer] = useState(!initialStrengths);
  const [answers,  setAnswers]  = useState({});
  const [step,     setStep]     = useState(() => initialStrengths ? "result" : "loading");
  const [result,   setResult]   = useState(() => initialStrengths || null);
  const [anim,     setAnim]     = useState(false);

  const classAccent = classTheme?.accent || SC.gold;
  const classSoft   = classTheme?.soft   || `${classAccent}18`;

  useEffect(() => {
    // Skip fetch if parent already provided the data
    if (initialStrengths) { setLoadingServer(false); return; }
    getToken().then(tk => getStrengths(tk)).then(res => {
      if (res.strengths) {
        setServerResult(res.strengths);
        setResult(res.strengths);
        setStep("result");
      } else {
        const saved = lsGet(menteScopedKey(storageScope, "strengths"), null);
        setResult(saved);
        setStep(saved ? "result" : "quiz");
      }
    }).catch(() => {
      const saved = lsGet(menteScopedKey(storageScope, "strengths"), null);
      setResult(saved);
      setStep(saved ? "result" : "quiz");
    }).finally(() => setLoadingServer(false));
  }, [storageScope]);

  const current  = STRENGTHS_QUIZ[Object.keys(answers).length];
  const progress = Object.keys(answers).length;
  const pct      = Math.round((progress / STRENGTHS_QUIZ.length) * 100);

  const pick = async (strength) => {
    const next = { ...answers, [progress]: strength };
    setAnswers(next);
    if (Object.keys(next).length === STRENGTHS_QUIZ.length) {
      const count = {};
      Object.values(next).forEach(s => { count[s] = (count[s]||0)+1; });
      const top3 = Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([s])=>s);
      const res  = { top3, all: count };
      setResult(res);
      lsSet(menteScopedKey(storageScope, "strengths"), res);
      setAnim(true);
      try {
        const token  = await getToken();
        const apiRes = await saveStrengths(token, top3, count);
        if (apiRes.xpEarned) onXP(apiRes.xpEarned, SC.gold, apiRes);
      } catch {}
      setTimeout(() => { setStep("result"); setAnim(false); }, 600);
    }
  };

  const reset = () => {
    setAnswers({}); setStep("quiz"); setResult(null); setServerResult(null);
    lsSet(menteScopedKey(storageScope, "strengths"), null);
  };

  // ── Local SVG icons ────────────────────────────────────────
  const IcoPuzzle = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/>
    </svg>
  );
  const IcoAward = ({s=17}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
  const IcoRotateCcw = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
    </svg>
  );
  const IcoChevronRight = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
  const IcoInfoSm = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );

  // ── Loading skeleton ───────────────────────────────────────
  if (step === "loading" || loadingServer) return (
    <div style={{ ...scCard(SC.gold), padding:"22px 24px",
      display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <div className="mm-skel" style={{ width:42, height:42, borderRadius:10 }}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
          <div className="mm-skel" style={{ height:13, width:"50%", borderRadius:4 }}/>
          <div className="mm-skel" style={{ height:10, width:"32%", borderRadius:4 }}/>
        </div>
      </div>
      <div className="mm-skel" style={{ height:5, borderRadius:6 }}/>
      {[1,2,3,4].map(i => (
        <div key={i} className="mm-skel" style={{ height:52, borderRadius:10 }}/>
      ))}
    </div>
  );

  // ── Result state ───────────────────────────────────────────
  if (step === "result" && result) {
    const winner = result.top3[0];
    const winnerInfo = STRENGTH_INFO[winner] || { color:SC.gold, desc:"Una fortaleza única." };
    const wColor = winnerInfo.color;
    const completedDate = (result.dateKey || serverResult?.dateKey)
      ? new Date((result.dateKey || serverResult?.dateKey) + "T12:00:00")
        .toLocaleDateString("es-ES", { day:"numeric", month:"long", year:"numeric" })
      : null;
    const totalVotes = result.all ? Object.values(result.all).reduce((a,b)=>a+b,0) : 0;

    return (
      <motion.div {...fadeUp}>
        <div style={{ ...scCard(wColor), overflow:"hidden", position:"relative",
          borderTop:"none" }}>

          {/* Gradient top bar */}
          <div style={{ height:2, background:`linear-gradient(90deg,${wColor},${wColor}88,${SC.teal}55)` }}/>

          {/* Ambient winner glow top-right */}
          <div style={{ position:"absolute", top:0, right:0, width:"50%", height:200,
            background:`radial-gradient(ellipse at 90% 10%,${wColor}0e,transparent 65%)`,
            pointerEvents:"none" }}/>

          {/* Card header */}
          <div style={{
            padding:"18px 24px 16px", position:"relative",
            borderBottom:`1px solid ${SC.navy}`,
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{
              width:44, height:44, borderRadius:10, flexShrink:0,
              background:`${wColor}18`, border:`1px solid ${wColor}44`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:wColor, boxShadow:`0 0 14px ${wColor}22`,
            }}>
              <IcoAward/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                <span style={{ ...orb(11,700), color:SC.white, letterSpacing:"0.06em" }}>
                  {t("me.str.result.title")}
                </span>
                {serverResult && (
                  <span style={{
                    ...raj(9,700), color:SC.green,
                    background:`${SC.green}14`, border:`1px solid ${SC.green}44`,
                    padding:"2px 8px", borderRadius:12,
                  }}>{t("me.str.result.saved")}</span>
                )}
                {todayDone?.strengths && (
                  <span style={{
                    ...raj(9,700), color:wColor,
                    background:`${wColor}14`, border:`1px solid ${wColor}44`,
                    padding:"2px 8px", borderRadius:12,
                  }}>+60 XP</span>
                )}
              </div>
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                <span style={{ ...raj(11,400), color:SC.muted }}>
                  {t("me.str.result.sci_ref")}
                </span>
                {completedDate && (
                  <span style={{ ...raj(10,500), color:SC.muted }}>
                    Realizado: <span style={{ color:SC.mutedL }}>{completedDate}</span>
                  </span>
                )}
              </div>
            </div>
            {strengthsSessions > 0 && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                <span style={{ ...orb(16,900), color:wColor,
                  textShadow:`0 0 10px ${wColor}66` }}>
                  {strengthsSessions}
                </span>
                <span style={{ ...raj(9,500), color:SC.muted }}>tests</span>
              </div>
            )}
          </div>

          {/* Result body */}
          <div style={{ padding:"22px 24px 24px" }}>

            {/* Asymmetric grid: winner large left + 2nd/3rd stacked right */}
            <div className="sc-result-grid" style={{ marginBottom:20 }}>

              {/* #1 — Large winner with aura */}
              <motion.div
                className="sc-str-winner"
                initial={{ opacity:0, scale:.92 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay:0.05, type:"spring", stiffness:240 }}
                whileHover={{ y:-5, boxShadow:`0 14px 40px ${wColor}28, 0 4px 24px rgba(0,0,0,0.35)` }}
                style={{
                  background:`linear-gradient(145deg,${wColor}14 0%,${SC.card} 55%)`,
                  border:`1.5px solid ${wColor}55`,
                  borderRadius:14, padding:"28px 22px",
                  display:"flex", flexDirection:"column", alignItems:"center",
                  textAlign:"center", gap:14,
                  boxShadow:`0 8px 32px ${wColor}1e, 0 4px 24px rgba(0,0,0,0.3)`,
                  transition:"box-shadow .3s ease",
                  "--str-wc": wColor,
                }}>
                {/* Ambient aura */}
                <div className="sc-str-winner-aura"/>

                <motion.span
                  initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  transition={{ delay:0.15 }}
                  style={{
                    ...raj(9,700), color:wColor,
                    background:`${wColor}18`, border:`1px solid ${wColor}44`,
                    padding:"3px 12px", borderRadius:20, letterSpacing:"0.1em",
                    position:"relative", zIndex:1,
                    boxShadow:`0 0 10px ${wColor}22`,
                  }}>
                  {t("me.str.result.principal")}
                </motion.span>

                {/* Icon with pulsing ring */}
                <div style={{ position:"relative", zIndex:1 }}>
                  <motion.div
                    className="sc-str-icon-ring"
                    style={{
                      position:"absolute", inset:-10, borderRadius:24,
                      border:`1px solid ${wColor}44`,
                      boxShadow:`0 0 12px ${wColor}33`,
                    }}/>
                  <div style={{
                    width:72, height:72, borderRadius:20,
                    background:`${wColor}18`, border:`1.5px solid ${wColor}44`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:wColor, boxShadow:`0 0 20px ${wColor}33`,
                    position:"relative",
                  }}>
                    {STRENGTH_ICO[winner]?.(wColor, 34)}
                  </div>
                </div>

                <div style={{ ...orb(15,800), color:wColor, letterSpacing:"0.04em",
                  position:"relative", zIndex:1,
                  textShadow:`0 0 12px ${wColor}66` }}>
                  {winner}
                </div>

                {totalVotes > 0 && result.all?.[winner] && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, position:"relative", zIndex:1 }}>
                    <div style={{ height:3, flex:1, borderRadius:3,
                      background:SC.navy, overflow:"hidden", minWidth:60 }}>
                      <motion.div
                        initial={{ width:0 }}
                        animate={{ width:`${(result.all[winner]/STRENGTHS_QUIZ.length)*100}%` }}
                        transition={{ delay:0.3, duration:0.6, ease:"easeOut" }}
                        style={{ height:"100%", borderRadius:3,
                          background:`linear-gradient(90deg,${wColor},${wColor}AA)`,
                          boxShadow:`0 0 6px ${wColor}88` }}/>
                    </div>
                    <span style={{ ...raj(9,600), color:wColor,
                      textShadow:`0 0 6px ${wColor}66` }}>
                      {result.all[winner]}/{STRENGTHS_QUIZ.length}
                    </span>
                  </div>
                )}

                <p style={{ ...raj(13,500), color:SC.mutedL, lineHeight:1.68, margin:0,
                  position:"relative", zIndex:1 }}>
                  {winnerInfo.descKey ? t(winnerInfo.descKey) : winnerInfo.desc}
                </p>
              </motion.div>

              {/* #2 and #3 stacked */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {result.top3.slice(1).map((s, i) => {
                  const info = STRENGTH_INFO[s] || { color:SC.orange, desc:"Una fortaleza única." };
                  return (
                    <motion.div key={s}
                      className="sc-str-2nd"
                      initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: 0.1 + i * 0.09, ease:"easeOut" }}
                      style={{
                        background:SC.panel,
                        border:`1px solid ${SC.navy}`,
                        borderLeft:`3px solid ${info.color}`,
                        borderRadius:12, padding:"16px 18px",
                        display:"flex", gap:14, alignItems:"flex-start",
                        "--str-c": info.color,
                      }}>
                      <div style={{
                        width:40, height:40, borderRadius:10, flexShrink:0,
                        background:`${info.color}14`, border:`1px solid ${info.color}33`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:info.color,
                      }}>
                        {STRENGTH_ICO[s]?.(info.color, 20)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                          <span style={{
                            ...raj(9,700), color:info.color,
                            background:`${info.color}18`, border:`1px solid ${info.color}33`,
                            padding:"1px 7px", borderRadius:12, letterSpacing:"0.08em",
                            boxShadow:`0 0 6px ${info.color}22`,
                          }}>#{i+2}</span>
                          <span style={{ ...orb(10,700), color:SC.white }}>{s}</span>
                          {result.all?.[s] && (
                            <span style={{ ...raj(9,500), color:SC.muted, marginLeft:"auto" }}>
                              {result.all[s]}/{STRENGTHS_QUIZ.length}
                            </span>
                          )}
                        </div>
                        <p style={{ ...raj(11,500), color:SC.muted, lineHeight:1.6, margin:0 }}>
                          {info.descKey ? t(info.descKey) : info.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Class color insight */}
                {classTheme && (
                  <div style={{
                    background:classSoft, border:`1px solid ${classAccent}33`,
                    borderRadius:10, padding:"13px 14px",
                    display:"flex", gap:9, alignItems:"flex-start",
                  }}>
                    <div style={{ color:classAccent, marginTop:1, flexShrink:0 }}>
                      <IcoInfoSm/>
                    </div>
                    <p style={{ ...raj(11,500), color:SC.mutedL, lineHeight:1.6, margin:0 }}>
                      <span style={{ ...raj(11,700), color:classAccent }}>Tu clase:</span>{" "}
                      Usa <span style={{ color:wColor, fontWeight:700 }}>{winner}</span> para potenciar tu entrenamiento.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Science insight */}
            <div style={{
              background:`${SC.blue}08`, border:`1px solid ${SC.blue}22`,
              borderRadius:10, padding:"14px 18px", marginBottom:20,
              display:"flex", gap:10, alignItems:"flex-start",
            }}>
              <div style={{ color:SC.blue, marginTop:1, flexShrink:0 }}>
                <IcoInfoSm/>
              </div>
              <p style={{ ...raj(12,500), color:SC.mutedL, lineHeight:1.68, margin:0 }}>
                <span style={{ ...raj(12,700), color:SC.blue }}>{t("me.str.result.science_pre")} </span>
                {t("me.str.result.science_text")}{" "}
                <span style={{ ...raj(12,700), color:SC.white }}>{t("me.str.result.science_pct")}</span>. {t("me.str.result.use_pre")}{" "}
                <span style={{ color:wColor, fontWeight:700 }}>{winner}</span>{" "}
                {t("me.str.result.science_suf")}
              </p>
            </div>

            {/* Reset */}
            <motion.button
              whileHover={{ scale:1.03, x:2, borderColor:`${SC.navy}`, color:SC.mutedL }}
              whileTap={{ scale:.97 }}
              onClick={reset}
              style={{
                display:"flex", alignItems:"center", gap:8,
                background:"transparent", border:`1px solid ${SC.navy}`,
                color:SC.muted, padding:"10px 20px",
                borderRadius:8, ...raj(12,700), cursor:"pointer",
                transition:"all .2s ease",
              }}>
              <IcoRotateCcw/> {t("me.str.result.repeat")}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Anim transition ────────────────────────────────────────
  if (anim) return (
    <div style={{
      ...scCard(SC.gold), padding:"80px 24px", position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden",
      borderTop:"none",
    }}>
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          width:300, height:300, borderRadius:"50%",
          background:`radial-gradient(circle,${SC.gold}10,transparent 70%)`,
          animation:"fvm-aura-pulse 1.8s ease-in-out infinite" }}/>
      </div>
      <div style={{ textAlign:"center", position:"relative" }}>
        <motion.div
          animate={{ rotate:360 }}
          transition={{ duration:1.4, repeat:Infinity, ease:"linear" }}
          style={{
            width:72, height:72, borderRadius:20,
            background:`${SC.gold}18`, border:`2px solid ${SC.gold}55`,
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 18px", color:SC.gold,
            boxShadow:`0 0 28px ${SC.gold}33`,
          }}>
          <IcoAward s={32}/>
        </motion.div>
        <p style={{ ...orb(13,700), color:SC.gold, margin:"0 0 6px",
          textShadow:`0 0 12px ${SC.gold}66` }}>{t("me.str.saving")}</p>
        <p style={{ ...raj(11,400), color:SC.muted, margin:0 }}>Analizando tus respuestas...</p>
      </div>
    </div>
  );

  if (!current) return null;

  // ── Quiz state ─────────────────────────────────────────────
  return (
    <motion.div {...fadeUp}>
      <div style={{ ...scCard(SC.gold), overflow:"hidden", position:"relative",
        borderTop:"none", "--str-gold": SC.gold }}>

        {/* Gradient top bar */}
        <div style={{ height:2, background:`linear-gradient(90deg,${SC.gold},${classAccent},${SC.gold}55)` }}/>

        {/* Ambient glow top-right */}
        <div style={{ position:"absolute", top:0, right:0, width:"40%", height:160,
          background:`radial-gradient(ellipse at 90% 10%,${SC.gold}0c,transparent 65%)`,
          pointerEvents:"none" }}/>

        {/* Card header */}
        <div style={{
          padding:"18px 24px 16px", position:"relative",
          borderBottom:`1px solid ${SC.navy}`,
          display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{
            width:44, height:44, borderRadius:10, flexShrink:0,
            background:`${SC.gold}18`, border:`1px solid ${SC.gold}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:SC.gold, boxShadow:`0 0 14px ${SC.gold}22`,
          }}>
            <IcoPuzzle/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
              <span style={{ ...orb(11,700), color:SC.white, letterSpacing:"0.06em" }}>
                {t("me.str.title")}
              </span>
              {strengthsSessions > 0 && (
                <span style={{
                  ...raj(9,600), color:SC.muted,
                  background:SC.panel, border:`1px solid ${SC.navy}`,
                  padding:"2px 8px", borderRadius:12,
                }}>
                  <span style={{ color:SC.gold }}>{strengthsSessions}</span> completados
                </span>
              )}
            </div>
            <div style={{ ...raj(11,400), color:SC.muted }}>
              {t("me.str.sub")}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
              <motion.span
                key={progress}
                initial={{ scale:1.3, opacity:0.6 }} animate={{ scale:1, opacity:1 }}
                style={{ ...orb(18,900), color:SC.gold,
                  textShadow:`0 0 10px ${SC.gold}66` }}>
                {progress+1}
              </motion.span>
              <span style={{ ...raj(10,500), color:SC.muted }}>/ {STRENGTHS_QUIZ.length}</span>
            </div>
            <span style={{ ...raj(9,600), color:SC.muted, letterSpacing:"0.06em" }}>{t("me.str.pregunta")}</span>
          </div>
        </div>

        {/* Segmented progress with glow */}
        <div style={{ padding:"14px 24px", borderBottom:`1px solid ${SC.navy}` }}>
          <div style={{ display:"flex", gap:5 }}>
            {STRENGTHS_QUIZ.map((_,i) => {
              const isDone = i < progress;
              const isCur  = i === progress;
              return (
                <motion.div key={i}
                  className={`sc-str-prog-seg${isDone?" is-done":isCur?" is-current":""}`}
                  animate={{
                    flex: isCur ? 2 : 1,
                    background: isDone ? SC.green : isCur ? SC.gold : SC.navy,
                  }}
                  transition={{ duration:.3 }}
                  style={{ height:4, borderRadius:4 }}/>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <span style={{ ...raj(10,500), color:SC.muted }}>{pct}{t("me.str.pct_done")}</span>
            <span style={{ ...raj(10,600), color: pct > 60 ? SC.green : SC.muted,
              textShadow: pct > 60 ? `0 0 6px ${SC.green}66` : "none" }}>
              {STRENGTHS_QUIZ.length - progress} {t(STRENGTHS_QUIZ.length - progress !== 1 ? "me.str.restante_n" : "me.str.restante_1")}
            </span>
          </div>
        </div>

        {/* Question + Options */}
        <div style={{ padding:"22px 24px 26px" }}>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div key={progress}
              initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-18 }}
              transition={{ duration:.22, ease:"easeOut" }}
              style={{
                background:SC.panel, overflow:"hidden",
                border:`1px solid ${SC.navy}`,
                borderLeft:`3px solid ${SC.gold}`,
                borderRadius:12, padding:"20px 22px", marginBottom:16,
                position:"relative",
                boxShadow:`inset 0 0 0 0 transparent`,
              }}>
              {/* Shimmer on question card */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                background:`linear-gradient(90deg,transparent,${SC.gold}44,transparent)`,
                pointerEvents:"none" }}/>
              <div style={{ ...orb(8,700), color:SC.gold, letterSpacing:"0.1em", marginBottom:10,
                textShadow:`0 0 8px ${SC.gold}55` }}>
                {t("me.str.pregunta_pre")} #{String(progress+1).padStart(2,"0")}
              </div>
              <p style={{ ...raj(15,700), color:SC.white, lineHeight:1.65, margin:0 }}>
                {current.q}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Answer options */}
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {current.opts.map((opt, i) => (
              <motion.button key={`${progress}-${i}`}
                initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.055, ease:"easeOut" }}
                whileTap={{ scale:.98 }}
                className="sc-strength-opt"
                onClick={() => pick(opt.strength)}
                style={{
                  display:"flex", alignItems:"center", gap:14,
                  background:SC.panel, border:`1px solid ${SC.navy}`,
                  borderRadius:10, padding:"14px 18px",
                  textAlign:"left", width:"100%",
                  "--str-gold": SC.gold,
                }}>
                <motion.div
                  whileHover={{ scale:1.1, boxShadow:`0 0 12px ${SC.gold}55` }}
                  style={{
                    width:28, height:28, borderRadius:7, flexShrink:0,
                    background:`${SC.gold}14`, border:`1px solid ${SC.gold}33`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    ...orb(8,900), color:SC.gold,
                    transition:"all .18s",
                  }}>
                  {String.fromCharCode(65+i)}
                </motion.div>
                <span style={{ ...raj(13,600), color:SC.white, lineHeight:1.45, flex:1 }}>
                  {opt.text}
                </span>
                <div style={{ color:SC.muted, flexShrink:0, transition:"color .18s" }}>
                  <IcoChevronRight/>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  INSIGHTS TAB — SC admin-config premium redesign
// ══════════════════════════════════════════════════════════════
function InsightsTab({ summary, insights, community, insightsLoading, communityLoading, classTheme, heroClass }) {
  const { t } = useLang();
  const menteXp      = summary?.menteXpTotal  || 0;
  const streak       = summary?.moodStreak    || summary?.moodStreakStored || 0;
  const sessionCounts= summary?.sessionCounts || {};
  const sessions     = Object.values(sessionCounts).reduce((a,b)=>a+b,0);
  const weekSess     = summary?.weekSessions  || 0;
  const latestPerma  = summary?.latestPermaAvg ?? null;
  const topStr       = summary?.topStrength;
  const topStrInfo   = STRENGTH_INFO[topStr]  || null;

  const classAccent  = classTheme?.accent || SC.blue;
  const classSoft    = classTheme?.soft   || `${classAccent}14`;
  const classCrest   = classTheme?.crest  || null;
  const classLabel   = classTheme?.label  || heroClass || "HÉROE";

  // ── Local icons ─────────────────────────────────────────
  const IcoZap = ({s=18,c=SC.gold}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" stroke="none" fill={c}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  );
  const IcoUsers = ({s=16,c=SC.blue}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  const IcoBarChart = ({s=17,c=SC.blue}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
  const IcoCalendar = ({s=16,c=SC.teal}) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );

  // 4-stat strip: XP, streak, sessions total, week sessions
  const stats = [
    { label:"XP MENTE",   value: menteXp > 999 ? `${(menteXp/1000).toFixed(1)}k` : menteXp,
      color:SC.gold,   img:"/ui/icons/stat-xp.png",    fallbackIcon:<IcoZap s={16} c={SC.gold}/>  },
    { label:"RACHA",      value:`${streak}d`,
      color:SC.orange, img:"/ui/icons/weather-sun.png", fallbackIcon:<IcoFlame c={SC.orange} s={16}/> },
    { label:"SESIONES",   value:sessions,
      color:SC.blue,   img:null,                       fallbackIcon:<IcoUsers s={16} c={SC.blue}/> },
    { label:"ESTA SEMANA",value:weekSess,
      color:SC.teal,   img:null,                       fallbackIcon:<IcoCalendar s={16} c={SC.teal}/> },
  ];

  // Activity breakdown mini bars
  const activityRows = [
    { key:"mood",        label:"Ánimo",       color:SC.orange },
    { key:"gratitude",   label:"Gratitud",    color:SC.gold   },
    { key:"breathing",   label:"Respiración", color:SC.blue   },
    { key:"perma",       label:"PERMA",       color:SC.purple },
    { key:"affirmation", label:"Afirmaciones",color:SC.gold   },
    { key:"strengths",   label:"Fortalezas",  color:SC.teal   },
  ].filter(r => (sessionCounts[r.key] || 0) > 0);
  const maxCount = Math.max(...activityRows.map(r => sessionCounts[r.key] || 0), 1);

  return (
    <motion.div {...fadeUp}>
      <div style={{ ...scCard(SC.blue), overflow:"hidden", position:"relative",
        borderTop:"none" }}>

        {/* Gradient top bar */}
        <div style={{ height:2, background:`linear-gradient(90deg,${SC.blue},${classAccent},${SC.teal}88)` }}/>

        {/* Ambient top-right glow */}
        <div style={{ position:"absolute", top:0, right:0, width:"45%", height:180,
          background:`radial-gradient(ellipse at 90% 10%,${SC.blue}0a,transparent 65%)`,
          pointerEvents:"none" }}/>

        {/* ── Card header ── */}
        <div style={{
          padding:"18px 24px 16px", position:"relative",
          borderBottom:`1px solid ${SC.navy}`,
          display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{
            width:44, height:44, borderRadius:10, flexShrink:0,
            background:`${SC.blue}18`, border:`1px solid ${SC.blue}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:SC.blue, boxShadow:`0 0 14px ${SC.blue}22`,
          }}>
            <IcoBarChart s={18} c={SC.blue}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
              <span style={{ ...orb(11,700), color:SC.white, letterSpacing:"0.06em" }}>
                {t("me.ins.title")}
              </span>
              {classCrest && (
                <span style={{
                  ...raj(9,700), color:classAccent,
                  background:classSoft, border:`1px solid ${classAccent}44`,
                  padding:"2px 8px", borderRadius:12, letterSpacing:"0.08em",
                  display:"flex", alignItems:"center", gap:4,
                }}>
                  <img src={classCrest} alt="" style={{ width:12, height:12, objectFit:"contain" }}
                    onError={e => { e.target.style.display="none"; }}/>
                  {classLabel.toUpperCase()}
                </span>
              )}
              <span style={{
                background:`${SC.teal}14`, border:`1px solid ${SC.teal}44`,
                padding:"2px 10px", borderRadius:20,
                ...raj(9,700), color:SC.teal, letterSpacing:"0.1em",
              }}>LIVE</span>
            </div>
            <div style={{ ...raj(11,400), color:SC.muted }}>
              {t("me.ins.sub")}
            </div>
          </div>
          {latestPerma != null && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
                <span style={{ ...orb(18,900), color:SC.purple,
                  textShadow:`0 0 10px ${SC.purple}66` }}>{latestPerma}</span>
                <span style={{ ...raj(9,500), color:SC.muted }}>/10</span>
              </div>
              <span style={{ ...raj(9,500), color:SC.muted }}>último PERMA</span>
            </div>
          )}
        </div>

        {/* ── 4-stat strip ── */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          borderBottom:`1px solid ${SC.navy}`,
        }}>
          {stats.map((s, i) => (
            <motion.div key={s.label}
              className="sc-ins-stat"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.055 }}
              style={{
                padding:"16px 14px", textAlign:"center",
                borderRight: i < 3 ? `1px solid ${SC.navy}` : "none",
                "--ins-c": s.color,
              }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:7 }}>
                {s.img
                  ? <img src={s.img} alt="" style={{ width:18, height:18, objectFit:"contain",
                      filter:`drop-shadow(0 0 4px ${s.color}88)` }}
                      onError={e => { e.target.style.display="none"; }}/>
                  : s.fallbackIcon}
              </div>
              <motion.div
                key={s.value}
                initial={{ scale:1.2, opacity:0.5 }} animate={{ scale:1, opacity:1 }}
                transition={{ duration:0.25 }}
                style={{ ...orb(20,900), color:s.color, marginBottom:3, lineHeight:1,
                  textShadow:`0 0 10px ${s.color}55` }}>
                {s.value}
              </motion.div>
              <div style={{ ...raj(9,600), color:SC.muted, letterSpacing:"0.06em" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Content body ── */}
        <div style={{ padding:"22px 24px 26px" }}>

          {/* ── Session breakdown mini bars ── */}
          {activityRows.length > 0 && (
            <motion.div
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.1 }}
              style={{ marginBottom:20,
                background:SC.panel, border:`1px solid ${SC.navy}`,
                borderRadius:12, padding:"14px 18px" }}>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ ...orb(8,700), color:SC.muted, letterSpacing:"0.1em" }}>
                  SESIONES POR MÓDULO
                </span>
                <span style={{ ...raj(9,500), color:SC.muted }}>
                  {sessions} total
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {activityRows.map((row, i) => {
                  const cnt = sessionCounts[row.key] || 0;
                  const pct = Math.round((cnt / maxCount) * 100);
                  return (
                    <div key={row.key} style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <span style={{ ...raj(10,600), color:SC.muted, width:82, flexShrink:0 }}>
                        {row.label}
                      </span>
                      <div style={{ flex:1, height:4, borderRadius:4,
                        background:SC.navy, overflow:"hidden" }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${pct}%` }}
                          transition={{ duration:0.6, delay:0.12 + i*0.05, ease:"easeOut" }}
                          style={{ height:"100%", borderRadius:4,
                            background:`linear-gradient(90deg,${row.color},${row.color}88)`,
                            boxShadow:`0 0 6px ${row.color}55` }}/>
                      </div>
                      <span style={{ ...raj(10,700), color:row.color,
                        width:18, textAlign:"right", flexShrink:0,
                        textShadow:`0 0 6px ${row.color}66` }}>
                        {cnt}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Top strength highlight ── */}
          {topStr && topStrInfo && (
            <motion.div
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.18 }}
              whileHover={{ y:-3, boxShadow:`0 8px 28px ${topStrInfo.color}1e` }}
              style={{
                display:"flex", alignItems:"flex-start", gap:14,
                background:`${topStrInfo.color}0d`,
                border:`1px solid ${topStrInfo.color}44`,
                borderLeft:`3px solid ${topStrInfo.color}`,
                borderRadius:12, padding:"16px 18px", marginBottom:22,
                position:"relative", overflow:"hidden",
                transition:"box-shadow .25s ease",
              }}>
              {/* Top edge shimmer */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                background:`linear-gradient(90deg,transparent,${topStrInfo.color}66,transparent)`,
                pointerEvents:"none" }}/>
              <div style={{
                width:44, height:44, borderRadius:11, flexShrink:0,
                background:`${topStrInfo.color}18`, border:`1.5px solid ${topStrInfo.color}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:topStrInfo.color, boxShadow:`0 0 14px ${topStrInfo.color}22`,
              }}>
                {STRENGTH_ICO[topStr]?.(topStrInfo.color, 22)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <img src="/ui/medals/medal-gold.png" alt="1" style={{ width:16, height:16,
                    objectFit:"contain" }} onError={e => { e.target.style.display="none"; }}/>
                  <span style={{ ...raj(9,700), color:topStrInfo.color,
                    letterSpacing:"0.1em", textShadow:`0 0 8px ${topStrInfo.color}66` }}>
                    {t("me.ins.tu_fortaleza")}
                  </span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ ...orb(12,700), color:SC.white }}>{topStr}</span>
                  <span style={{ ...raj(11,500), color:SC.mutedL, lineHeight:1.5, flex:1 }}>
                    {(topStrInfo.descKey ? t(topStrInfo.descKey) : topStrInfo.desc)?.slice(0, 80)}...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Main grid: insights left · community right ── */}
          <div className="sc-insights-grid">

            {/* LEFT — Insights */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:2, height:14,
                  background:`linear-gradient(180deg,${SC.blue},${classAccent})`,
                  borderRadius:2, boxShadow:`0 0 6px ${SC.blue}88` }}/>
                <span style={{ ...orb(8,700), color:SC.muted, letterSpacing:"0.1em" }}>
                  {t("me.ins.personalizados")}
                </span>
                <div style={{ marginLeft:"auto" }}>
                  <span style={{ ...raj(9,600), color:SC.muted }}>
                    <span style={{ color:SC.blue }}>{insights?.length || 0}</span>{" "}
                    {t("me.ins.analisis")}
                  </span>
                </div>
              </div>
              <InsightsPanel insights={insights} loading={insightsLoading}/>
            </div>

            {/* RIGHT — Community */}
            <CommunityPanel community={community} loading={communityLoading}/>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB DEFINITIONS
// ══════════════════════════════════════════════════════════════
const TAB_ICONS = {
  mood:      (c,s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  breath:    (c,s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
  perma:     (c,s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  aff:       (c,s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  strengths: (c,s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  insights:  (c,s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

const TABS = [
  { id:"mood",      label:"Ánimo",       labelKey:"me.tab.mood",      color:SC.orange  },
  { id:"breath",    label:"Respiración", labelKey:"me.tab.breath",    color:SC.blue    },
  { id:"perma",     label:"PERMA",       labelKey:"me.tab.perma",     color:SC.purple  },
  { id:"aff",       label:"Afirmaciones",labelKey:"me.tab.aff",       color:SC.gold    },
  { id:"strengths", label:"Fortalezas",  labelKey:"me.tab.strengths", color:SC.teal    },
  { id:"insights",  label:"Insights",    labelKey:"me.tab.insights",  color:SC.blue, badge:"LIVE" },
];

// Activity key → tab id map for TodayProgress clicks
const ACT_TO_TAB = {
  mood:"mood", gratitude:"mood", breathing:"breath",
  perma:"perma", affirmation:"aff", strengths:"strengths",
};

const MENTE_LANDING_CSS = `
  .umind-page {
    position: relative;
    min-height: 100%;
    padding: 18px 18px 42px;
    color: #f4efff;
  }

  .umind-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 12% 12%, var(--mind-soft, rgba(192, 138, 255, .12)), transparent 24%),
      radial-gradient(circle at 84% 18%, color-mix(in srgb, var(--mind-secondary, #4cc9f0), transparent 82%), transparent 28%),
      linear-gradient(180deg, rgba(10, 8, 18, .2), rgba(10, 8, 18, .7));
    z-index: 0;
  }

  .umind-shell {
    position: relative;
    z-index: 1;
    max-width: 1460px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .umind-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 78%);
    background:
      linear-gradient(180deg, rgba(17, 13, 31, .94), rgba(9, 8, 18, .96)),
      rgba(10, 8, 18, .92);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.05),
      0 0 0 1px rgba(255,255,255,.02),
      0 24px 60px rgba(0,0,0,.42);
  }

  .umind-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
    gap: 18px;
    min-height: 430px;
    padding: 24px;
  }

  .umind-stage {
    position: relative;
    min-height: 380px;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 76%);
    background: rgba(9, 8, 18, .88);
  }

  .umind-stage img.umind-stage-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(1.05) brightness(.78);
  }

  .umind-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(8, 7, 15, .2), rgba(8, 7, 15, .9)),
      radial-gradient(circle at 78% 22%, color-mix(in srgb, var(--mind-accent, #c08aff), transparent 65%), transparent 24%);
  }

  .umind-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .umind-kpi {
    padding: 14px 14px 12px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 82%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--mind-accent, #c08aff), transparent 94%), rgba(255,255,255,.015));
  }

  .umind-reco {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    align-items: start;
    padding: 18px 22px;
  }

  .umind-route {
    display: grid;
    grid-template-columns: repeat(3, minmax(220px, 1fr));
    gap: 12px;
    align-items: stretch;
  }

  .umind-node {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    min-height: 96px;
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 84%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--mind-accent, #c08aff), transparent 95%), rgba(255,255,255,.02));
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .umind-node:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--mind-accent, #c08aff), transparent 60%);
    box-shadow: 0 16px 28px color-mix(in srgb, var(--mind-accent, #c08aff), transparent 92%);
  }

  .umind-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 18px;
    align-items: start;
  }

  .umind-main {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .umind-aside {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: sticky;
    top: 18px;
  }

  .umind-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .umind-tab {
    appearance: none;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.02);
    color: #d6cee6;
    border-radius: 999px;
    padding: 10px 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
  }

  .umind-tab:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--mind-accent, #c08aff), transparent 55%);
  }

  .umind-tab.active {
    color: #fff;
    border-color: color-mix(in srgb, var(--mind-accent, #c08aff), transparent 24%);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--mind-accent, #c08aff), transparent 86%), rgba(255,255,255,.02)),
      rgba(255,255,255,.03);
    box-shadow: 0 0 30px color-mix(in srgb, var(--mind-accent, #c08aff), transparent 88%);
    text-shadow: 0 0 10px color-mix(in srgb, var(--mind-accent, #c08aff), transparent 38%), 0 0 22px color-mix(in srgb, var(--mind-accent, #c08aff), transparent 68%);
  }

  .umind-tab-panel {
    padding: 18px;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 80%);
    background:
      linear-gradient(180deg, rgba(18, 15, 30, .96), rgba(10, 8, 18, .98)),
      rgba(10, 8, 18, .94);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 18px 50px rgba(0,0,0,.36);
  }

  .umind-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 82%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--mind-accent, #c08aff), transparent 94%), rgba(255,255,255,.02));
    color: #ddd5eb;
    font-size: 12px;
    line-height: 1;
  }

  .umind-soft-btn {
    appearance: none;
    border: 1px solid color-mix(in srgb, var(--mind-accent, #c08aff), transparent 82%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--mind-accent, #c08aff), transparent 95%), rgba(255,255,255,.02));
    color: #f4efff;
    border-radius: 16px;
    padding: 12px 16px;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }

  .umind-soft-btn:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--mind-accent, #c08aff), transparent 50%);
    box-shadow: 0 12px 28px rgba(0,0,0,.28);
  }

  .umind-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--chip-color, #c08aff), transparent 54%);
    background: color-mix(in srgb, var(--chip-color, #c08aff), transparent 88%);
    color: var(--chip-color, #c08aff);
    font-size: 11px;
    letter-spacing: .02em;
    text-shadow: 0 0 10px color-mix(in srgb, var(--chip-color, #c08aff), transparent 40%), 0 0 22px color-mix(in srgb, var(--chip-color, #c08aff), transparent 68%);
  }

  .umind-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
  }

  @media (max-width: 1180px) {
    .umind-hero,
    .umind-layout,
    .umind-reco {
      grid-template-columns: 1fr;
    }

    .umind-aside {
      position: static;
    }
  }

  @media (max-width: 760px) {
    .umind-page {
      padding: 14px 12px 28px;
    }

    .umind-hero,
    .umind-reco,
    .umind-tab-panel {
      padding: 16px;
    }

    .umind-kpis,
    .umind-route {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 560px) {
    .umind-kpis,
    .umind-route {
      grid-template-columns: 1fr;
    }

    .umind-tab {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  GOTHIC JRPG RESPIRACION SECTION
// ══════════════════════════════════════════════════════════════
function BreathingRPG({ onXP, todayDone, profile, streak, tab, setTab }) {
  // ── Reuse same state/logic as BreathingExercise ──────────
  const [mode,      setMode]     = useState(BREATH_MODES[0]);
  const [running,   setRunning]  = useState(false);
  const [phaseIdx,  setPhaseIdx] = useState(0);
  const [countdown, setCount]    = useState(BREATH_MODES[0].phases[0].d);
  const [cycles,    setCycles]   = useState(0);
  const [xpLogged,  setXpLogged] = useState(false);
  const timerRef  = useRef(null);
  const phaseRef  = useRef(0);
  const cdRef     = useRef(BREATH_MODES[0].phases[0].d);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    setRunning(false); setPhaseIdx(0);
    setCount(mode.phases[0].d);
    phaseRef.current = 0; cdRef.current = mode.phases[0].d;
  }, [mode]);

  const start = useCallback(() => {
    phaseRef.current = 0; cdRef.current = mode.phases[0].d;
    setPhaseIdx(0); setCount(mode.phases[0].d); setRunning(true);
    timerRef.current = setInterval(() => {
      cdRef.current -= 1;
      setCount(cdRef.current);
      if (cdRef.current <= 0) {
        const next = (phaseRef.current + 1) % mode.phases.length;
        if (next === 0) setCycles(c => c + 1);
        phaseRef.current = next;
        cdRef.current    = mode.phases[next].d;
        setPhaseIdx(next); setCount(mode.phases[next].d);
      }
    }, 1000);
  }, [mode]);

  useEffect(() => {
    if (cycles >= 3 && !xpLogged) {
      setXpLogged(true);
      getToken().then(t => logMenteSession(t, "breathing", { mode: mode.id, cycles }))
        .then(res => { if (res.xpEarned) onXP(res.xpEarned, mode.color, res); })
        .catch(() => {});
    }
  }, [cycles, xpLogged, mode.id, mode.color, onXP]);

  useEffect(() => { if (running) stop(); }, [mode]); // eslint-disable-line
  useEffect(() => () => clearInterval(timerRef.current), []);

  const phase      = mode.phases[phaseIdx];
  const phaseKey   = phase?.label?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace("n","n") || "inhala";
  const phaseCssKey = phase?.label === "INHALA" ? "inhala" : phase?.label === "RETÉN" ? "reten" : phase?.label === "EXHALA" ? "exhala" : "pausa";
  const PHASE_COLOR = { "INHALA":"#b06aff","RETÉN":"#ffb13a","EXHALA":"#4cc9f0","PAUSA":"#8ac926" };
  const PHASE_AURA  = { "INHALA":"rgba(176,106,255,.55)","RETÉN":"rgba(255,177,58,.5)","EXHALA":"rgba(76,201,240,.5)","PAUSA":"rgba(138,201,38,.5)" };
  const pc  = running ? (PHASE_COLOR[phase?.label] || "#b06aff") : "#b06aff";
  const pa  = running ? (PHASE_AURA[phase?.label]  || "rgba(176,106,255,.5)") : "rgba(176,106,255,.5)";
  const isInhale = phase?.label === "INHALA";
  const isExhale = phase?.label === "EXHALA";
  const orbSize  = running ? (isInhale ? 230 : isExhale ? 180 : 210) : 210;

  const CUES = { "INHALA":"Respira profundo...", "RETÉN":"Mantén el aire...", "EXHALA":"Suelta lentamente...", "PAUSA":"Pausa natural..." };
  const cueText = running ? (CUES[phase?.label] || "") : (cycles >= 3 ? "¡3 ciclos completados! XP ganado." : "Cuando estés listo, comienza tu sesión.");

  const SECCIONES_ITEMS = [
    {key:"mood",      label:"Ánimo",          cls:"fvr-si-animo",   onClick:()=>setTab("mood")},
    {key:"breath",    label:"Respiración",     cls:"fvr-si-resp",    onClick:()=>setTab("breath")},
    {key:"medit",     label:"Meditación",      cls:"fvr-si-medit",   onClick:()=>{}},
    {key:"visual",    label:"Visualización",   cls:"fvr-si-visual",  onClick:()=>{}},
    {key:"enfoque",   label:"Enfoque",         cls:"fvr-si-enfoque", onClick:()=>{}},
    {key:"diario",    label:"Diario",          cls:"fvr-si-diario",  onClick:()=>{}},
  ];

  const BENEFITS = [
    {text:"Reduce el estrés",        biCls:""},
    {text:"Mejora el enfoque",       biCls:"b2"},
    {text:"Aumenta la claridad",     biCls:"b3"},
    {text:"Mejora el rendimiento",   biCls:"b4"},
  ];

  const TECH_MAP = {
    box:    {cls:"box-m",    color:"#b06aff"},
    "478":  {cls:"weil-m",   color:"#4cc9f0"},
    power:  {cls:"energy-m", color:"#ffb13a"},
  };

  const xpCur = profile?.xp    || 0;
  const xpMax = profile?.xpMax || profile?.xpNext || 100;
  const xpPct = Math.min(100, Math.round((xpCur / xpMax) * 100));

  return (
    <>
      {/* ── LEFT COL override for breath tab ── */}
      <aside className="fvm-left-col" style={{gridColumn:"1"}}>

        {/* Profile mini */}
        <div className="fvm-panel" style={{padding:"14px 16px"}}>
          <span className="fvm-corners"/>
          <div className="fvm-profile-top">
            <div className="fvm-av-frame" style={{width:52,height:52}}>
              {profile?.photoURL
                ? <img src={profile.photoURL} alt="" className="fvm-av-img"/>
                : <div className="fvm-ph-icon" style={{fontSize:11}}>⚔</div>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="fvm-player-name" style={{fontSize:"10px"}}>
                {(profile?.username||profile?.displayName||"WARRIOR").toUpperCase().slice(0,10)}
              </div>
              <div className="fvm-player-class">DISCIPLINED WARRIOR</div>
              <div className="fvm-level-pill">
                <div className="fvm-crest" style={{width:20,height:24,fontSize:"11px"}}>⚔</div>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"13px",color:"var(--fvm-gold-b)"}}>
                  LV. {profile?.level||24}
                </div>
              </div>
            </div>
          </div>
          <div className="fvm-xp-row">
            <span style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px"}}>EXP</span>
            <span className="fvm-xp-val">{(xpCur).toLocaleString()} / {(xpMax).toLocaleString()}</span>
          </div>
          <div className="fvm-xp-bar"><div className="fvm-xp-fill" style={{width:`${xpPct}%`}}/></div>
        </div>

        {/* Secciones nav */}
        <div className="fvm-panel fvr-sections" style={{padding:0}}>
          <span className="fvm-corners"/>
          <div style={{padding:"12px 14px 0"}}>
            <div className="fvm-panel-head" style={{margin:0,paddingTop:0}}>
              <span className="fvm-deco">◆</span>SECCIONES<span className="fvm-deco">◆</span>
            </div>
          </div>
          <div style={{padding:"6px 12px 12px"}}>
            {SECCIONES_ITEMS.map(s=>(
              <div key={s.key}
                className={`fvr-sec-item${s.key===tab?" active":""}`}
                onClick={s.onClick}
                style={{display:"grid",gridTemplateColumns:"22px 1fr",gap:12,
                  alignItems:"center",padding:"9px 10px",marginBottom:5,
                  border:`2px solid ${s.key===tab?"var(--fvm-mente)":"var(--fvm-border)"}`,
                  cursor:"pointer",transition:".15s",
                  fontFamily:"'Manrope',sans-serif",fontSize:"11px",
                  color:s.key===tab?"var(--fvm-mente)":"var(--fvm-muted)",letterSpacing:".5px",
                  boxShadow:s.key===tab?"inset 0 0 0 1px var(--fvm-mente-a),0 0 12px var(--fvm-mente-a)":"none",
                  background:s.key===tab?"linear-gradient(180deg,rgba(176,106,255,.1),rgba(176,106,255,.01))":"var(--fvm-inner)",
                }}>
                <span className={`fvr-si ${s.cls}`}/>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="fvm-panel" style={{padding:"14px 16px"}}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head">
            <span className="fvm-deco">◆</span>ESTADÍSTICAS<span className="fvm-deco">◆</span>
          </div>
          {[
            {gCls:"fvm-g-heart",  name:"FUERZA MENTAL",   barCls:"fvm-fill-str", val:78},
            {gCls:"fvm-g-shield", name:"RESISTENCIA MENTAL",barCls:"fvm-fill-sta", val:64},
            {gCls:"fvm-g-boot",   name:"CLARIDAD",         barCls:"fvm-fill-spd", val:52},
            {gCls:"fvm-g-scroll", name:"DISCIPLINA",       barCls:"fvm-fill-dis", val:86},
            {gCls:"fvm-g-brain",  name:"EQUILIBRIO",       barCls:"fvm-fill-men", val:71},
          ].map(s=>(
            <div key={s.name} className="fvm-stat">
              <div className={`fvm-stat-g ${s.gCls}`}/>
              <div style={{minWidth:0}}>
                <div className="fvm-stat-lbl">
                  <span>{s.name}</span><span className="fvm-stat-v">{s.val}</span>
                </div>
                <div className="fvm-stat-bar"><div className={`fvm-stat-fill ${s.barCls}`}/></div>
              </div>
            </div>
          ))}
        </div>

        {/* Streak */}
        <div className="fvm-panel" style={{padding:"14px 16px"}}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head">
            <span className="fvm-deco">◆</span>RACHA ACTUAL<span className="fvm-deco">◆</span>
          </div>
          <div className="fvm-streak-row">
            <div className="fvm-streak-fire"/>
            <div className="fvm-streak-num">{streak||14}<span className="fvm-streak-lab">DÍAS</span></div>
          </div>
          <div className="fvm-streak-flames">
            {Array.from({length:7},(_,i)=>(
              <div key={i} className={`fvm-flame-ico${i>=(streak||14)?` dim`:""}`}/>
            ))}
          </div>
          <div className="fvm-streak-msg">¡Sigue así, campeón!</div>
        </div>

      </aside>

      {/* ── CENTER COL: Breathing UI ── */}
      <main className="fvm-center-col" style={{gridColumn:"2"}}>

        {/* Breathing panel */}
        <div className="fvm-panel" style={{padding:"16px 18px",flex:1,display:"flex",flexDirection:"column"}}>
          <span className="fvm-corners"/>

          {/* Title */}
          <div style={{textAlign:"center",fontFamily:"'Manrope',sans-serif",fontSize:"13px",
            color:"var(--fvm-mente)",letterSpacing:"1.5px",textShadow:"0 0 10px var(--fvm-mente-a)",
            marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            RESPIRACIÓN CONSCIENTE
            <span style={{width:14,height:14,border:"1.5px solid var(--fvm-dim)",borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Manrope',sans-serif",fontSize:11,color:"var(--fvm-dim)"}}>i</span>
          </div>
          <div style={{textAlign:"center",fontFamily:"'Manrope',sans-serif",fontSize:15,
            color:"var(--fvm-dim)",letterSpacing:".5px",marginBottom:14}}>
            Elige tu técnica y completa 3 ciclos para ganar XP
          </div>

          {/* Tech cards */}
          <div className="fvr-tech-grid">
            {BREATH_MODES.map(m=>{
              const tm = TECH_MAP[m.id]||{cls:"box-m",color:"#b06aff"};
              const isActive = mode.id === m.id;
              return (
                <div key={m.id}
                  className={`fvr-tech-card ${tm.cls}${isActive?" active":""}`}
                  onClick={()=>{setMode(m);stop();}}>
                  <div className="fvr-tc-name">{m.label}</div>
                  <div className="fvr-tc-pattern">{m.short}</div>
                  <div className="fvr-tc-ico">
                    {m.id==="box"   && <div className="fvr-box-g"/>}
                    {m.id==="478"   && <div className="fvr-spiral"/>}
                    {m.id==="power" && <div className="fvr-bolt"/>}
                  </div>
                  <div className="fvr-tc-desc" dangerouslySetInnerHTML={{__html:m.tip.replace(/\./,'.​<br/>')}}/>
                </div>
              );
            })}
          </div>

          {/* ORB stage */}
          <div className="fvr-orb-stage" style={{"--pc":pc,"--pa":pa}}>
            {running && (
              <div className="fvr-orb-rings" style={{"--pc":pc}}>
                <div className="fvr-orb-ring r1"/><div className="fvr-orb-ring r2"/><div className="fvr-orb-ring r3"/>
              </div>
            )}
            <div className="fvr-orb-wrap">
              <div className="fvr-orb" style={{
                width:orbSize, height:orbSize,
                background:`radial-gradient(circle at 38% 32%, color-mix(in oklab,${pc} 70%,#fff) 0%, ${pc} 28%, color-mix(in oklab,${pc} 55%,#1a0a2a) 70%, #1a0a2a 100%)`,
                boxShadow:`0 0 50px ${pa}, inset 0 0 40px rgba(0,0,0,.4), inset 8px 8px 30px rgba(255,255,255,.12)`,
                transition:`transform .4s, background .8s, box-shadow .8s, width .4s, height .4s`,
              }}>
                <div className="fvr-craters"/>
                {!running && (
                  <div className="fvr-phase-idle">
                    {cycles>=3?"¡COMPLETADO!":"Elige una técnica\ny pulsa iniciar"}
                  </div>
                )}
                {running && <>
                  <div className="fvr-phase-name">{phase?.label||"INHALA"}</div>
                  <div className="fvr-phase-count">{countdown}</div>
                </>}
              </div>
            </div>
          </div>

          {/* Cue text */}
          <div className="fvr-orb-cue" style={{color:running?pc:"var(--fvm-dim)"}}>{cueText}</div>

          {/* Controls */}
          <div className="fvr-control-row">
            <button className="fvr-start-btn"
              onClick={running ? stop : start}
              disabled={cycles>=3&&!running}>
              {running
                ? <><span className="fvr-pause-bar"/><span className="fvr-pause-bar"/>&nbsp;PAUSAR</>
                : <><span className="fvr-play-tri"/>&nbsp;{cycles>=3?"COMPLETADO":"INICIAR"}</>}
            </button>
            {running && (
              <button className="fvr-pause-btn" onClick={stop} title="Reiniciar">
                <span className="fvr-pause-bar"/><span className="fvr-pause-bar"/>
              </button>
            )}
          </div>
        </div>

        {/* Cycle progress */}
        <div className="fvm-panel fvr-cycle-progress" style={{padding:"14px 18px"}}>
          <span className="fvm-corners"/>
          <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px",
            color:"var(--fvm-gold-b)",letterSpacing:"1px",marginBottom:10,
            gridColumn:"1/-1"}}>
            PROGRESO DE CICLOS
          </div>
          <div className="fvr-cp-track">
            {[0,1,2].map(i=>(
              <div key={i} style={{display:"contents"}}>
                <div className={`fvr-cp-node${cycles>i?" done":cycles===i?" current":""}`}>
                  <span>{i+1}</span>
                </div>
                {i<2&&(
                  <div className="fvr-cp-link">
                    <div className="fvr-cp-link-fill" style={{width:cycles>i?"100%":"0%"}}/>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="fvr-cp-label">
            <div className="fvr-cp-title">CICLOS COMPLETADOS</div>
            <div className="fvr-cp-count">
              {Math.min(cycles,3)}<span className="fvr-cp-total"> / 3</span>
            </div>
          </div>
        </div>

      </main>

      {/* ── RIGHT COL: Tech info + Reward + Benefits ── */}
      <aside className="fvm-right-col" style={{gridColumn:"3"}}>

        {/* Técnica actual */}
        <div className="fvm-panel" style={{padding:"14px 16px"}}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{color:"var(--fvm-mente)",borderBottomColor:"var(--fvm-mente-a)"}}>
            <span className="fvm-deco">◆</span>TÉCNICA ACTUAL<span className="fvm-deco">◆</span>
          </div>
          <div className="fvr-ti-name">{mode.label.toUpperCase()}</div>
          {mode.phases.map((p,i)=>{
            const pKey = p.label==="INHALA"?"inhala":p.label==="RETÉN"?"reten":p.label==="EXHALA"?"exhala":"pausa";
            const isActive = running && phaseIdx===i;
            return (
              <div key={i} className={`fvr-phase-row ${pKey}`}
                style={{opacity:isActive?1:.7,
                  background:isActive?`rgba(0,0,0,.3)`:"transparent"}}>
                <div className={`fvr-pr-ico ${pKey}`}/>
                <div className="fvr-pr-name">{p.label} {p.d} SEG</div>
                {isActive && (
                  <div className="fvr-pr-sec">{countdown}s</div>
                )}
                {!isActive && (
                  <div className="fvr-pr-sec">{p.d}</div>
                )}
              </div>
            );
          })}
          <div className="fvr-ti-cycle">
            <div className="fvr-ti-cycle-lab">CICLO ACTIVO</div>
            <div className="fvr-ti-cycle-v">
              {running?cycles+1:cycles} <span style={{color:"var(--fvm-muted)",fontSize:"14px"}}> / 3</span>
            </div>
          </div>
        </div>

        {/* Recompensa */}
        <div className="fvm-panel" style={{padding:"14px 16px",textAlign:"center"}}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{color:"var(--fvm-mente)",borderBottomColor:"var(--fvm-mente-a)"}}>
            <span className="fvm-deco">◆</span>RECOMPENSA<span className="fvm-deco">◆</span>
          </div>
          <div className="fvr-reward-chest">
            <div className="fvr-chest-glow"/><div className="fvr-chest-lid"/>
            <div className="fvr-chest-body"/><div className="fvr-chest-lock"/>
            <img src="/ui/chest-mente.png" alt="" style={{
              position:"absolute",inset:0,width:"100%",height:"100%",
              objectFit:"contain",imageRendering:"pixelated",zIndex:3}}
              onError={e=>e.currentTarget.style.display="none"}/>
          </div>
          <div className="fvr-reward-xp">
            +30 XP <span className="fvr-xp-tag">XP</span>
          </div>
          <div className="fvr-reward-desc">Completa 3 ciclos</div>
        </div>

        {/* Beneficios */}
        <div className="fvm-panel" style={{padding:"14px 16px"}}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{color:"var(--fvm-mente)",borderBottomColor:"var(--fvm-mente-a)"}}>
            <span className="fvm-deco">◆</span>BENEFICIOS<span className="fvm-deco">◆</span>
          </div>
          {BENEFITS.map((b,i)=>(
            <div key={i} className="fvr-benefit-row">
              <div className={`fvr-bi ${b.biCls}`}/>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

      </aside>
    </>
  );
}


// ══════════════════════════════════════════════════════════════
//  GOTHIC JRPG AFIRMACIONES SECTION — full 3-column RPG layout
//  Based on: Rediseños/ForgeVenture Zona Mente Afirmaciones.html
// ══════════════════════════════════════════════════════════════
function AffirmationsRPG({ onXP, todayDone, profile, streak, tab, setTab, storageScope }) {
  const lsKey = menteScopedKey(storageScope, `aff_rpg_${todayStr()}`);

  const DECKS = {
    GUERRERO: [
      { q:"¿Qué parte de mí hoy merece orgullo?",                        a:"Cada batalla que libro me forja. Hoy honro mi esfuerzo.",                            s:"EL PROGRESO SE CELEBRA, NO SE EXIGE." },
      { q:"¿Qué desafío estoy listo para enfrentar?",                    a:"No le temo al peso; le temo a no intentarlo. Avanzo.",                               s:"EL MIEDO ES SOLO UN OPONENTE MÁS." },
      { q:"¿Cómo puedo ser mejor que ayer?",                             a:"No compito con nadie más que con quien fui ayer.",                                    s:"TU ÚNICO RIVAL ERES TÚ MISMO." },
      { q:"¿Cuándo fue la última vez que superaste tus propios límites?", a:"No soy definido por mis límites, sino por el coraje de superarlos una y otra vez.", s:"ERES MÁS FUERTE DE LO QUE CREES." },
      { q:"¿Qué quiero construir con mi esfuerzo diario?",               a:"Cada repetición es un ladrillo de la persona en que me convierto.",                  s:"LA CONSTANCIA CONSTRUYE LEYENDAS." },
    ],
    ARQUERO: [
      { q:"¿Cómo se siente tu cuerpo después de una carrera completa?",  a:"Mi cuerpo es mi arco; cuando lo escucho, jamás falla el tiro.",                     s:"LA PRECISIÓN NACE DE LA ESCUCHA." },
      { q:"¿Estás respirando con tu ritmo o contra él?",                 a:"Encuentro mi ritmo y el camino se vuelve infinito.",                                 s:"EL RITMO ES TU ALIADO." },
      { q:"¿Qué objetivo tienes hoy en la mira?",                        a:"Fijo mi blanco con calma y suelto sin dudar.",                                       s:"LA CALMA AFINA LA PUNTERÍA." },
      { q:"¿Confías en tu preparación cuando llega el momento?",         a:"He entrenado mil tiros para acertar el que importa.",                                s:"LA PRÁCTICA ES CONFIANZA SILENCIOSA." },
      { q:"¿Qué te mantiene en movimiento cuando cansa?",                a:"Cada paso adelante es una flecha que ya no vuelve atrás.",                           s:"AVANZAR ES TU NATURALEZA." },
    ],
    MAGO: [
      { q:"¿Cómo te hablas a ti mismo en los momentos difíciles?",       a:"Mis palabras internas son hechizos; elijo las que me elevan.",                      s:"TU VOZ INTERIOR DA FORMA A TU MUNDO." },
      { q:"¿Qué conocimiento de ti mismo descubriste hoy?",              a:"Conocerme es mi mayor poder; cada día leo un nuevo capítulo.",                      s:"EL SABER INTERIOR ES MAGIA REAL." },
      { q:"¿Puedes mantener la mente serena bajo presión?",              a:"En la quietud encuentro la claridad que el caos esconde.",                           s:"LA CALMA ES TU CONJURO MÁS FUERTE." },
      { q:"¿Qué pensamiento limitante quieres transformar?",             a:"Transmuto la duda en intención y la intención en acción.",                           s:"TÚ ERES EL ALQUIMISTA DE TU MENTE." },
      { q:"¿Hacia qué propósito diriges tu energía?",                    a:"Mi energía sigue a mi enfoque; enfoco lo que deseo crear.",                          s:"LA INTENCIÓN DIRIGE EL PODER." },
    ],
  };

  const CLASS_INFO = {
    GUERRERO: {
      color:"#e0455e", aura:"rgba(224,69,94,.5)",
      icoClip:"polygon(45% 0,55% 0,55% 60%,70% 65%,70% 80%,55% 85%,55% 100%,45% 100%,45% 85%,30% 80%,30% 65%,45% 60%)",
      philo:"La fuerza nace del enfoque, la disciplina y la voluntad inquebrantable.",
      sci:"Las afirmaciones positivas activan neuronas asociadas al bienestar, mejoran la autoeficacia y fortalecen la resiliencia.",
    },
    ARQUERO: {
      color:"#8ac926", aura:"rgba(138,201,38,.5)",
      icoClip:"polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
      philo:"La precisión nace de la paciencia, el ritmo y la conexión con el cuerpo.",
      sci:"Repetir afirmaciones de presencia mejora la conciencia corporal y reduce la ansiedad de rendimiento.",
    },
    MAGO: {
      color:"#4cc9f0", aura:"rgba(76,201,240,.5)",
      icoClip:"polygon(50% 0,62% 38%,100% 38%,70% 62%,82% 100%,50% 76%,18% 100%,30% 62%,0 38%,38% 38%)",
      philo:"El poder nace de la mente serena, el conocimiento y el dominio interior.",
      sci:"El diálogo interno positivo reestructura patrones cognitivos y refuerza la autocompasión.",
    },
  };

  const initialClass = DECKS[profile?.heroClass] ? profile.heroClass : "GUERRERO";

  // Stats for left column (Afirmaciones RPG — matches reference image)
  const AFF_STATS = [
    { gCls:"fvm-g-heart",  name:"FUERZA MENTAL", barCls:"fvm-fill-str",                                                   val:78 },
    { gCls:"fvm-g-shield", name:"RESILIENCIA",    barCls:"fvm-fill-sta",                                                   val:64 },
    { gCls:"fvm-g-boot",   name:"DISCIPLINA",     barCls:"fvm-fill-spd",                                                   val:86 },
    { gCls:"fvm-g-scroll", name:"CLARIDAD",       fillColor:"linear-gradient(180deg,#ffe066,#ffcd4a)", iconColor:"#ffcd4a", val:52 },
    { gCls:"fvm-g-brain",  name:"MOTIVACIÓN",     fillColor:"linear-gradient(180deg,#d8a8ff,#c08aff)", iconColor:"#c08aff", val:71 },
  ];

  // Equipment slots with PNG placeholder slots
  const EQUIP_SLOTS = [
    { src:"/ui/equip_weapon.png", rarity:"r-legend", fb:"sword"  },
    { src:"/ui/equip_helmet.png", rarity:"r-rare",   fb:"helmet" },
    { src:"/ui/equip_armor.png",  rarity:"r-epic",   fb:"armor"  },
    { src:"/ui/equip_belt.png",   rarity:"r-epic",   fb:"belt"   },
    { src:"/ui/equip_boots.png",  rarity:"r-rare",   fb:"boots"  },
    { src:"/ui/equip_ring.png",   rarity:"r-uncom",  fb:"pants"  },
  ];

  const [activeClass, setActiveClass] = useState(initialClass);
  const [idx,         setIdx]         = useState(0);
  const [done,        setDone]        = useState(() => new Set(lsGet(lsKey, null)?.done || []));
  const [xpDone,      setXpDone]      = useState(() => lsGet(lsKey, null)?.xpDone || false);

  const cards   = DECKS[activeClass] || DECKS.GUERRERO;
  const clsInfo = CLASS_INFO[activeClass] || CLASS_INFO.GUERRERO;
  const card    = cards[idx];
  const isDone  = done.has(idx);

  const xpCur = profile?.xp    || 0;
  const xpMax = profile?.xpMax || profile?.xpNext || 100;
  const xpPct = Math.min(100, Math.round((xpCur / xpMax) * 100));

  const switchClass = (cls) => { setActiveClass(cls); setIdx(0); };
  const goTo        = (i)   => { setIdx(i); };
  const prev        = ()    => { if (idx > 0) goTo(idx - 1); };
  const next        = ()    => { if (idx < cards.length - 1) goTo(idx + 1); };

  const internalize = async () => {
    const nd = new Set(done); nd.add(idx);
    setDone(nd);
    lsSet(lsKey, { done:[...nd], xpDone });
    setTimeout(() => { if (idx < cards.length - 1) goTo(idx + 1); }, 500);
    if (nd.size >= 3 && !xpDone) {
      setXpDone(true);
      lsSet(lsKey, { done:[...nd], xpDone:true });
      try {
        const token = await getToken();
        const res   = await logMenteSession(token, "affirmation", { cardsDone: nd.size });
        if (res?.xpEarned) onXP(res.xpEarned, clsInfo.color, res);
        else onXP(15, clsInfo.color);
      } catch { onXP(15, clsInfo.color); }
    }
  };

  // Helper: 4 pixel corners for a card face
  const CardCorners = ({ color }) => (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:5 }}>
      {[{top:5,left:5},{top:5,right:5},{bottom:5,left:5},{bottom:5,right:5}].map((pos,pi) => (
        <div key={pi} style={{ position:"absolute", width:7, height:7, background:color,
          boxShadow:"0 0 0 1px #1a1208", ...pos }}/>
      ))}
    </div>
  );

  return (
    <>
      {/* ══ LEFT COL — profile + estadísticas + equip + racha (matches reference image) ══ */}
      <aside className="fvm-left-col" style={{ gridColumn:"1" }}>

        {/* Profile — full 64px avatar with PNG overlay slot */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-profile-top">
            <div className="fvm-av-frame">
              {profile?.photoURL
                ? <img src={profile.photoURL} alt="" className="fvm-av-img"/>
                : <div className="fvm-ph-icon">⚔</div>}
              {/* PNG slot: /ui/aff-avatar-frame.png — ornate gold portrait border */}
              <img src="/ui/aff-avatar-frame.png" alt="" style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", imageRendering:"pixelated", pointerEvents:"none", zIndex:2,
              }} onError={e => e.currentTarget.style.display="none"}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="fvm-player-name">
                {(profile?.username||profile?.displayName||"WARRIOR").toUpperCase().slice(0,12)}
              </div>
              <div className="fvm-player-class">DISCIPLINED WARRIOR</div>
              <div className="fvm-level-pill">
                <div className="fvm-crest">⚔</div>
                <div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                    color:"var(--fvm-dim)", letterSpacing:"1px" }}>NIVEL</div>
                  <div style={{ color:"var(--fvm-gold-b)", fontFamily:"'Manrope',sans-serif",
                    fontSize:"13px", textShadow:"0 0 8px rgba(244,204,120,.5)" }}>
                    {profile?.level||24}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="fvm-xp-row">
            <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px" }}>EXP</span>
            <span className="fvm-xp-val">{xpCur.toLocaleString()} / {xpMax.toLocaleString()}</span>
          </div>
          <div className="fvm-xp-bar"><div className="fvm-xp-fill" style={{ width:`${xpPct}%` }}/></div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head">
            <span className="fvm-deco">◆</span>ESTADÍSTICAS<span className="fvm-deco">◆</span>
          </div>
          {AFF_STATS.map(s => (
            <div key={s.name} className="fvm-stat">
              <div className={`fvm-stat-g ${s.gCls}`}
                style={s.iconColor ? { background:s.iconColor } : {}}/>
              <div style={{ minWidth:0 }}>
                <div className="fvm-stat-lbl">
                  <span>{s.name}</span><span className="fvm-stat-v">{s.val}</span>
                </div>
                <div className="fvm-stat-bar">
                  {s.barCls
                    ? <div className={`fvm-stat-fill ${s.barCls}`} style={{ width:`${s.val}%` }}/>
                    : <div style={{ height:"100%", width:`${s.val}%`, background:s.fillColor,
                        boxShadow:"inset 0 1px 0 rgba(255,255,255,.3)" }}/>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* EQUIPAMIENTO — PNG placeholder slots */}
        <div className="fvm-panel" style={{ padding:"14px 16px 12px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head">
            <span className="fvm-deco">◆</span>EQUIPAMIENTO<span className="fvm-deco">◆</span>
          </div>
          {/* PNG slots: /ui/equip_weapon.png · helmet · armor · belt · boots · ring */}
          <div className="fvm-equip-grid">
            {EQUIP_SLOTS.map((slot, i) => (
              <div key={i} className={`fvm-slot ${slot.rarity}`}>
                <img src={slot.src} alt={slot.fb}
                  style={{ width:"60%", height:"60%", imageRendering:"pixelated" }}
                  onError={e => {
                    e.currentTarget.style.display="none";
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display="block";
                  }}/>
                <div className={`fvm-item ${slot.fb}`} style={{ display:"none" }}/>
              </div>
            ))}
          </div>
        </div>

        {/* RACHA MENTAL */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head">
            <span className="fvm-deco">◆</span>RACHA MENTAL<span className="fvm-deco">◆</span>
          </div>
          <div className="fvm-streak-row">
            <div className="fvm-streak-fire"/>
            <div className="fvm-streak-num">{streak||14}<span className="fvm-streak-lab">DÍAS</span></div>
          </div>
          <div className="fvm-streak-flames">
            {Array.from({ length:7 }, (_, i) => (
              <div key={i} className={`fvm-flame-ico${i>=(streak||14)?" dim":""}`}/>
            ))}
          </div>
          <div className="fvm-streak-msg">¡Sigue así, campeón!</div>
        </div>

      </aside>

      {/* ══ CENTER COL ══ */}
      <main className="fvm-center-col" style={{ gridColumn:"2" }}>
        <div className="fvm-panel" style={{ padding:"14px 18px", flex:1, display:"flex", flexDirection:"column" }}>
          <span className="fvm-corners"/>

          {/* Title */}
          <div style={{ textAlign:"center", marginBottom:6 }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"12px",
              color:"var(--fvm-mente)", letterSpacing:"1.5px", textShadow:"0 0 10px var(--fvm-mente-a)" }}>
              AFIRMACIONES PERSONALES
            </div>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:15, color:"var(--fvm-dim)",
              letterSpacing:".5px", marginTop:3 }}>
              Reflexiona. Interioriza. Transfórmate.
            </div>
          </div>

          {/* Class switcher pills + deck label */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:8, marginBottom:10, flexWrap:"wrap" }}>
            {Object.entries(CLASS_INFO).map(([ck, ci]) => {
              const on = activeClass === ck;
              return (
                <button key={ck} onClick={() => switchClass(ck)} style={{
                  padding:"4px 10px", cursor:"pointer", transition:".15s",
                  background: on ? `${ci.color}20` : "var(--fvm-inner)",
                  border:`1.5px solid ${on ? ci.color : "var(--fvm-border)"}`,
                  fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color: on ? ci.color : "var(--fvm-muted)",
                  boxShadow: on ? `0 0 8px ${ci.aura}` : "none",
                }}>
                  {ck}
                </button>
              );
            })}
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
              color:"var(--fvm-gold-s)", letterSpacing:".8px" }}>
              MAZO {activeClass}:{" "}
              <span style={{ color:"var(--fvm-gold-b)" }}>{done.size}/{cards.length}</span> COMPLETADAS
            </div>
          </div>

          {/* Indicator strip */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
            {cards.flatMap((_, i) => {
              const isDoneI   = done.has(i);
              const isCurrent = i === idx;
              const node = (
                <div key={`n${i}`}
                  className={`fva-ind-node${isDoneI?" done":""}${isCurrent?" current":""}`}
                  style={{
                    borderColor: isDoneI ? "#8ac926" : isCurrent ? clsInfo.color : "var(--fvm-border)",
                    boxShadow:   isCurrent ? `0 0 14px ${clsInfo.aura}` : isDoneI ? "0 0 12px rgba(138,201,38,.5)" : "none",
                  }}
                  onClick={() => goTo(i)}>
                  <span style={{ color: isDoneI ? "#fff" : isCurrent ? clsInfo.color : "var(--fvm-muted)" }}>
                    {isDoneI ? "✓" : i+1}
                  </span>
                </div>
              );
              if (i < cards.length - 1) {
                return [node, <div key={`l${i}`} className="fva-ind-link"><div className="lf" style={{ width: isDoneI && done.has(i+1) ? "100%":"0" }}/></div>];
              }
              return [node];
            })}
          </div>

          {/* ── TWO-CARD STAGE: question (left) · affirmation (right) ── */}
          <div style={{ display:"flex", alignItems:"stretch", justifyContent:"center", flex:1, gap:0 }}>

            {/* ◀ Prev nav */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:5, padding:"0 8px" }}>
              <button onClick={prev} disabled={idx===0} style={{
                width:40, height:52, background:"var(--fvm-inner)",
                border:"2px solid var(--fvm-gold-s)", color:"var(--fvm-gold-b)",
                cursor:idx===0?"not-allowed":"pointer", opacity:idx===0?0.3:1,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Manrope',sans-serif", fontSize:"12px", transition:".15s",
              }}>◀</button>
              <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-dim)", letterSpacing:".5px" }}>ANTERIOR</span>
            </div>

            {/* LEFT CARD — Question (mente/purple border) */}
            <div style={{ width:224, flexShrink:0, minHeight:310, position:"relative",
              border:"3px solid var(--fvm-mente)",
              boxShadow:"0 0 0 2px #050308,0 0 24px var(--fvm-mente-a),inset 0 0 0 1px rgba(0,0,0,.5)",
              background:"linear-gradient(180deg,#1a1030 0%,#0a0618 100%)",
              display:"flex", flexDirection:"column", overflow:"hidden",
            }}>
              <CardCorners color="var(--fvm-mente)"/>
              {/* PNG slot: /ui/card-bg-question.png — dark mystical pixel art */}
              <img src="/ui/card-bg-question.png" alt="" style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", imageRendering:"pixelated", opacity:.16, zIndex:0,
              }} onError={e => e.currentTarget.style.display="none"}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                padding:"7px 8px", borderBottom:"1px dashed rgba(176,106,255,.3)",
                position:"relative", zIndex:1 }}>
                <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:"var(--fvm-mente)", letterSpacing:"2px" }}>
                  CARTA {idx+1} / {cards.length}
                </span>
              </div>
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                padding:"18px 14px", position:"relative", textAlign:"center", zIndex:1 }}>
                <div style={{ position:"absolute", fontFamily:"'Manrope',sans-serif", fontSize:75,
                  color:"rgba(176,106,255,.07)", lineHeight:1, userSelect:"none" }}>{idx+1}</div>
                <div style={{ position:"relative",
                  fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:"var(--fvm-parch)", letterSpacing:"1px", lineHeight:1.7,
                  textShadow:"0 2px 6px rgba(0,0,0,.7)" }}>
                  {card.q}
                </div>
              </div>
              <div style={{ padding:"8px", display:"flex", alignItems:"center",
                justifyContent:"center", gap:6,
                borderTop:"1px dashed rgba(176,106,255,.3)", position:"relative", zIndex:1,
                fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-mente)", letterSpacing:"1.5px" }}>
                <span className="fva-tap-hint">▸</span>TOCA PARA REVELAR
              </div>
            </div>

            {/* Arrow between cards (purple CSS arrow) */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              padding:"0 8px", flexShrink:0 }}>
              <div style={{ width:24, height:24, background:"var(--fvm-mente)",
                clipPath:"polygon(0 32%,58% 32%,58% 8%,100% 50%,58% 92%,58% 68%,0 68%)",
                boxShadow:"0 0 12px var(--fvm-mente-a)",
                filter:"drop-shadow(0 0 5px var(--fvm-mente))" }}/>
            </div>

            {/* RIGHT CARD — Affirmation (gold border) */}
            <div style={{ width:224, flexShrink:0, minHeight:310, position:"relative",
              border:"3px solid var(--fvm-gold)",
              boxShadow:"0 0 0 2px #050308,0 0 24px rgba(244,204,120,.4),inset 0 0 0 1px rgba(0,0,0,.5)",
              background:"linear-gradient(180deg,#2a1d08 0%,#0e0a04 100%)",
              display:"flex", flexDirection:"column", overflow:"hidden",
            }}>
              <CardCorners color="var(--fvm-gold)"/>
              {/* PNG slot: /ui/card-bg-affirm.png — warm parchment/fire pixel art */}
              <img src="/ui/card-bg-affirm.png" alt="" style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", imageRendering:"pixelated", opacity:.14, zIndex:0,
              }} onError={e => e.currentTarget.style.display="none"}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                padding:"7px 8px", borderBottom:"1px dashed rgba(244,204,120,.3)",
                position:"relative", zIndex:1 }}>
                <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:"var(--fvm-gold-b)", letterSpacing:"2px" }}>AFIRMACIÓN</span>
              </div>
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", padding:"18px 16px", position:"relative",
                textAlign:"center", zIndex:1 }}>
                <div style={{ position:"absolute", top:4, left:8, fontFamily:"'Manrope',sans-serif",
                  fontSize:72, color:"rgba(244,204,120,.12)", lineHeight:.6, userSelect:"none" }}>"</div>
                <div style={{ position:"absolute", bottom:28, right:8, fontFamily:"'Manrope',sans-serif",
                  fontSize:72, color:"rgba(244,204,120,.12)", lineHeight:.6, userSelect:"none" }}>"</div>
                <div style={{ position:"relative", zIndex:1,
                  fontFamily:"'Manrope',sans-serif", fontSize:"20px", fontStyle:"italic",
                  color:"var(--fvm-gold-b)", lineHeight:1.3, letterSpacing:".5px",
                  textShadow:"0 0 12px rgba(244,204,120,.3)", marginBottom:10 }}>
                  {card.a}
                </div>
                <div style={{ width:46, height:1, background:"rgba(244,204,120,.3)",
                  margin:"4px 0 8px", position:"relative" }}>
                  <span style={{ position:"absolute", left:"50%", top:"50%",
                    transform:"translate(-50%,-50%)", color:"var(--fvm-gold)",
                    fontSize:10, background:"#0e0a04", padding:"0 4px" }}>⚔</span>
                </div>
                <div style={{ position:"relative", zIndex:1,
                  fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:"var(--fvm-parch)", letterSpacing:"1px", lineHeight:1.6 }}>
                  {card.s}
                </div>
              </div>
            </div>

            {/* ▶ Next nav */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:5, padding:"0 8px" }}>
              <button onClick={next} disabled={idx===cards.length-1} style={{
                width:40, height:52, background:"var(--fvm-inner)",
                border:"2px solid var(--fvm-gold-s)", color:"var(--fvm-gold-b)",
                cursor:idx===cards.length-1?"not-allowed":"pointer",
                opacity:idx===cards.length-1?0.3:1,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Manrope',sans-serif", fontSize:"12px", transition:".15s",
              }}>▶</button>
              <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-dim)", letterSpacing:".5px" }}>SIGUIENTE</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:10,
            alignItems:"start", marginTop:14 }}>

            {/* Completed pill */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
              background:"var(--fvm-inner)", border:"2px solid var(--fvm-gold-s)" }}>
              {/* PNG slot: /ui/shield-gold.png */}
              <div style={{ width:26, height:30, flexShrink:0,
                background:"linear-gradient(180deg,var(--fvm-gold-b),var(--fvm-gold))",
                clipPath:"polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#1a1208", fontFamily:"'Manrope',sans-serif", fontSize:"11px" }}>
                <img src="/ui/shield-gold.png" alt="" style={{ width:"100%", height:"100%",
                  objectFit:"contain", imageRendering:"pixelated" }}
                  onError={e => { e.currentTarget.style.display="none"; }}/>
                ★
              </div>
              <div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"14px",
                  color:"var(--fvm-gold-b)" }}>{done.size} / {cards.length}</div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:"var(--fvm-dim)", letterSpacing:"1px", marginTop:2 }}>COMPLETADAS</div>
              </div>
            </div>

            {/* INTERIORIZADO btn */}
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <button onClick={internalize} style={{
                padding:"12px", width:"100%",
                background: isDone
                  ? "linear-gradient(180deg,#2d6f4c,#134a30)"
                  : "linear-gradient(180deg,#ad7818,#5a3a0a)",
                color: isDone ? "#b4f0c8" : "#fff7cf",
                border:`2px solid ${isDone ? "#8ac926" : "var(--fvm-gold-b)"}`,
                boxShadow: isDone
                  ? "inset 0 0 0 1px rgba(180,240,200,.18)"
                  : "inset 0 0 0 1px rgba(255,255,255,.15),inset 0 -2px 0 rgba(0,0,0,.4),0 0 16px rgba(244,204,120,.4)",
                cursor:"pointer", fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                letterSpacing:"1.5px", textShadow:"0 1px 0 rgba(0,0,0,.5)", transition:".15s",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              }}>
                <span style={{ width:18, height:18, flexShrink:0, background:isDone?"#4a8a13":"#8ac926",
                  borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#0a0712", fontSize:"11px" }}>✓</span>
                {isDone ? "INTERIORIZADO ✓" : "INTERIORIZADO"}
              </button>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:12, color:"var(--fvm-muted)",
                textAlign:"center", letterSpacing:".3px" }}>
                Se marcará como completada y avanzarás a la siguiente
              </div>
            </div>

            {/* Reward pill */}
            <div style={{ textAlign:"center", padding:"10px 14px",
              background:"var(--fvm-inner)", border:"2px solid var(--fvm-border)" }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-dim)", letterSpacing:"1.2px", marginBottom:4 }}>RECOMPENSA</div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"14px",
                color:"var(--fvm-mente)", textShadow:"0 0 8px var(--fvm-mente-a)" }}>+15 XP</div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-dim)", letterSpacing:".5px", marginTop:4 }}>por 3 cartas completadas</div>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ textAlign:"center", marginTop:10,
            fontFamily:"'Manrope',sans-serif", fontSize:"11px",
            color:"var(--fvm-mente)", letterSpacing:"1.5px",
            textShadow:"0 0 8px var(--fvm-mente-a)" }}>
            LA MENTE QUE SE ENTRENA, NUNCA SE RINDE.
          </div>

        </div>
      </main>

      {/* ══ RIGHT COL ══ */}
      <aside className="fvm-right-col" style={{ gridColumn:"3" }}>

        {/* Class hero panel */}
        <div className="fvm-panel" style={{ padding:0, overflow:"hidden" }}>
          <span className="fvm-corners"/>
          <div style={{
            height:130, position:"relative",
            background:`radial-gradient(ellipse 80% 70% at 60% 40%,${clsInfo.aura},transparent 70%),linear-gradient(180deg,#1a0e1e,#0a0610)`,
            borderBottom:`2px solid ${clsInfo.color}`,
            display:"flex", alignItems:"center", gap:12, padding:"0 14px",
          }}>
            {/* Crest */}
            <div style={{
              width:56, height:64, flexShrink:0,
              background:`linear-gradient(180deg,${clsInfo.color}60,#0a0610)`,
              border:`2px solid ${clsInfo.color}`,
              clipPath:"polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 0 16px ${clsInfo.aura}`,
            }}>
              {/* PNG slot: /ui/cls-ico-{class}.png — 30×30px class icon */}
              <img src={`/ui/cls-ico-${activeClass.toLowerCase()}.png`} alt={activeClass}
                style={{ width:28, height:28, imageRendering:"pixelated" }}
                onError={e => {
                  e.currentTarget.style.display="none";
                  e.currentTarget.nextSibling.style.display="block";
                }}/>
              <div style={{ display:"none", width:26, height:26, background:clsInfo.color,
                clipPath:clsInfo.icoClip, boxShadow:`0 0 8px ${clsInfo.aura}` }}/>
            </div>
            <div style={{ minWidth:0, zIndex:1 }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-dim)", letterSpacing:"1.5px", marginBottom:6 }}>TU CLASE</div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"14px",
                color:clsInfo.color, letterSpacing:"1.5px",
                textShadow:`0 0 10px ${clsInfo.aura}` }}>{activeClass}</div>
            </div>
            {/* PNG slot: /ui/class-{class}.png — 220×140px hero art (right aligned) */}
            <img src={`/ui/class-${activeClass.toLowerCase()}.png`} alt=""
              style={{ position:"absolute", right:0, bottom:0, height:"100%",
                objectFit:"contain", imageRendering:"pixelated", opacity:.85, zIndex:0 }}
              onError={e => e.currentTarget.style.display="none"}/>
          </div>
          {/* Philosophy */}
          <div style={{ padding:"12px 14px" }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
              color:"var(--fvm-gold-b)", letterSpacing:"1.5px", marginBottom:8 }}>FILOSOFÍA</div>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"15px",
              color:"var(--fvm-parch)", lineHeight:1.25 }}>
              {clsInfo.philo}
            </div>
          </div>
        </div>

        {/* TU MAZO — progress list */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{ color:"var(--fvm-mente)", borderBottomColor:"var(--fvm-mente-a)" }}>
            <span className="fvm-deco">◆</span>TU MAZO DE AFIRMACIONES<span className="fvm-deco">◆</span>
          </div>
          {cards.map((c, i) => {
            const isDoneI   = done.has(i);
            const isCurrent = i === idx;
            return (
              <div key={i}
                className={`fva-prog-card${isDoneI?" done":""}${isCurrent?" active":""}`}
                onClick={() => goTo(i)}>
                <div className="fva-pc-num"><span>{isDoneI ? "✓" : i+1}</span></div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"13px",
                  color:isDoneI ? "var(--fvm-dim)" : "var(--fvm-parch)",
                  lineHeight:1.15, display:"-webkit-box",
                  WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                  {c.q}
                </div>
                <div style={{
                  width:16, height:16, flexShrink:0,
                  background: isDoneI ? "#8ac926" : "transparent",
                  clipPath: isDoneI ? "polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%)" : "none",
                  boxShadow: isDoneI ? "0 0 6px rgba(138,201,38,.4)" : "none",
                }}/>
              </div>
            );
          })}
        </div>

        {/* RESPALDO CIENTÍFICO */}
        <div className="fvm-panel" style={{ padding:"12px 14px" }}>
          <span className="fvm-corners"/>
          <div style={{ display:"grid", gridTemplateColumns:"28px 1fr", gap:10, alignItems:"start" }}>
            {/* PNG slot: /ui/scroll-note.png — 26×24px parchment scroll */}
            <img src="/ui/scroll-note.png" alt="" style={{ width:26, height:24, imageRendering:"pixelated" }}
              onError={e => {
                e.currentTarget.style.display="none";
                e.currentTarget.nextSibling.style.display="block";
              }}/>
            <div style={{ display:"none", width:26, height:24,
              background:"linear-gradient(180deg,#8d6b3d,#4a3618)",
              clipPath:"polygon(0 0,90% 0,100% 12%,100% 100%,0 100%)",
              position:"relative" }}>
              <div style={{ position:"absolute", top:"30%", left:"18%", right:"18%",
                height:2, background:"rgba(244,204,120,.4)",
                boxShadow:"0 5px 0 rgba(244,204,120,.4),0 10px 0 rgba(244,204,120,.4)" }}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-gold-b)", letterSpacing:"1.2px", marginBottom:5 }}>
                RESPALDO CIENTÍFICO
              </div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"13px",
                color:"var(--fvm-dim)", lineHeight:1.25 }}>
                {clsInfo.sci}
                <span style={{ color:"var(--fvm-gold-s)" }}> — Psicología Positiva (M. Seligman)</span>
              </div>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}


// ══════════════════════════════════════════════════════════════
//  GOTHIC JRPG PERMA SECTION — full 3-column RPG layout
//  Based on: Rediseños/ForgeVenture Zona Mente PERMA.html
// ══════════════════════════════════════════════════════════════
function PermaRPG({ onXP, todayDone, profile, streak, tab, setTab, permaHistory, storageScope }) {
  const lsKey = menteScopedKey(storageScope, `perma_${todayStr()}`);

  const P_COLORS = { P:"#ff5a8a", E:"#ffb13a", R:"#4cc9f0", M:"#b06aff", A:"#8ac926" };
  const P_AURAS  = {
    P:"rgba(255,90,138,.5)", E:"rgba(255,177,58,.5)",
    R:"rgba(76,201,240,.5)", M:"rgba(176,106,255,.5)", A:"rgba(138,201,38,.5)",
  };
  const P_DATA = {
    P:{ name:"EMOCIONES POSITIVAS", q:"¿Cuántas emociones positivas experimentas al entrenar?",
        sci:"Las emociones positivas (Fredrickson) amplían tu repertorio pensamiento-acción y construyen recursos físicos y mentales duraderos.",
        tip:"Anota 1 cosa que disfrutaste de tu último entrenamiento.",
        quest:"Sonríe durante 3 series hoy — activa emoción positiva consciente." },
    E:{ name:"COMPROMISO & FLUJO",   q:"¿Qué tan conectado te sientes con tu entrenamiento?",
        sci:"El estado de Flujo (Csikszentmihalyi) surge cuando el reto iguala tu habilidad. Es el corazón del compromiso pleno.",
        tip:"Elige un ejercicio que te rete justo lo suficiente.",
        quest:"Entrena sin móvil 1 sesión — busca el flujo total." },
    R:{ name:"RELACIONES POSITIVAS",  q:"¿Tu vida social apoya tu bienestar físico?",
        sci:"Las relaciones de calidad son el predictor #1 de bienestar a largo plazo (Harvard Study of Adult Development).",
        tip:"Invita a alguien a entrenar o comparte tu progreso.",
        quest:"Envía un mensaje a un aliado del gremio hoy." },
    M:{ name:"SIGNIFICADO & PROPÓSITO",q:"¿Tu entrenamiento conecta con algo más grande que tú?",
        sci:"El propósito (Seligman) — pertenecer y servir a algo mayor — sostiene la motivación más allá del placer.",
        tip:"Recuerda POR QUÉ empezaste a entrenar.",
        quest:"Escribe tu 'porqué' en una frase y léela antes de entrenar." },
    A:{ name:"LOGROS & COMPETENCIA",  q:"¿Qué tan satisfecho estás con tu progreso físico?",
        sci:"El logro (Seligman) — perseguir y alcanzar metas — refuerza la autoeficacia y la competencia percibida.",
        tip:"Celebra un PR reciente, por pequeño que sea.",
        quest:"Define una meta medible para esta semana." },
  };
  const ORDER = ["P","E","R","M","A"];

  const [scores,     setScores]     = useState(() => lsGet(lsKey, null)?.scores || { P:7, E:8, R:6, M:7, A:7 });
  const [saved,      setSaved]      = useState(() => lsGet(lsKey, null)?.saved  || false);
  const [saving,     setSaving]     = useState(false);
  const [openPillar, setOpenPillar] = useState(null);

  const avg  = () => ORDER.reduce((s, k) => s + scores[k], 0) / ORDER.length;
  const lowK = ORDER.reduce((lo, k) => scores[k] < scores[lo] ? k : lo, ORDER[0]);

  // 7-day history from real PERMA data (last entry = today's live avg)
  const history7 = (() => {
    const result = Array(7).fill(null);
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(now); dd.setDate(now.getDate() - i);
      const dk = dd.toISOString().slice(0, 10);
      const found = (permaHistory || []).find(p => p.dateKey === dk);
      result[6 - i] = found ? found.avg : null;
    }
    // Always show today's live score as last bar
    result[6] = parseFloat(avg().toFixed(1));
    return result;
  })();
  const DAYS = ["LUN","MAR","MIÉ","JUE","VIE","SÁB","HOY"];

  const xpCur = profile?.xp    || 0;
  const xpMax = profile?.xpMax || profile?.xpNext || 100;
  const xpPct = Math.min(100, Math.round((xpCur / xpMax) * 100));

  // ── SVG pentagon radar math ─────────────────────────────────
  const CX = 200, CY = 200, RAD = 130;
  const angleAt  = i => -Math.PI / 2 + i * (2 * Math.PI / 5);
  const axisPos  = (i, ratio) => [CX + ratio * RAD * Math.cos(angleAt(i)), CY + ratio * RAD * Math.sin(angleAt(i))];
  const vertexPos = (i, val)  => { const r = (val / 10) * RAD; return [CX + r * Math.cos(angleAt(i)), CY + r * Math.sin(angleAt(i))]; };
  const gridPts  = ratio => ORDER.map((_, i) => axisPos(i, ratio).join(",")).join(" ");
  const areaPts  = ORDER.map((k, i) => vertexPos(i, scores[k]).join(",")).join(" ");

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await savePerma(token, { scores, avg: avg() });
      lsSet(lsKey, { scores, saved: true });
      setSaved(true);
      if (res?.xpEarned) onXP(res.xpEarned, "#b06aff", res);
      else onXP(40, "#b06aff");
    } catch {
      lsSet(lsKey, { scores, saved: true });
      setSaved(true);
      onXP(40, "#b06aff");
    }
    setSaving(false);
  };

  const SECCIONES = [
    { key:"mood",    label:"Ánimo",       cls:"fvr-si-animo",   onClick:() => setTab("mood")   },
    { key:"breath",  label:"Respiración", cls:"fvr-si-resp",    onClick:() => setTab("breath") },
    { key:"perma",   label:"PERMA",       cls:"fvr-si-perma",   onClick:() => {}               },
    { key:"medit",   label:"Meditación",  cls:"fvr-si-medit",   onClick:() => {}               },
    { key:"enfoque", label:"Enfoque",     cls:"fvr-si-enfoque", onClick:() => {}               },
    { key:"diario",  label:"Diario",      cls:"fvr-si-diario",  onClick:() => {}               },
  ];

  const activePillar = openPillar || lowK;

  return (
    <>
      {/* ══ LEFT COL ══ */}
      <aside className="fvm-left-col" style={{ gridColumn:"1" }}>

        {/* Profile */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-profile-top">
            <div className="fvm-av-frame" style={{ width:52, height:52 }}>
              {profile?.photoURL
                ? <img src={profile.photoURL} alt="" className="fvm-av-img"/>
                : <div className="fvm-ph-icon" style={{ fontSize:11 }}>⚔</div>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="fvm-player-name" style={{ fontSize:"10px" }}>
                {(profile?.username||profile?.displayName||"WARRIOR").toUpperCase().slice(0,10)}
              </div>
              <div className="fvm-player-class">GUERRERO DISCIPLINADO</div>
              <div className="fvm-level-pill">
                <div className="fvm-crest" style={{ width:20, height:24, fontSize:"11px" }}>⚔</div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"13px", color:"var(--fvm-gold-b)" }}>
                  LV. {profile?.level||24}
                </div>
              </div>
            </div>
          </div>
          <div className="fvm-xp-row">
            <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px" }}>EXP</span>
            <span className="fvm-xp-val">{xpCur.toLocaleString()} / {xpMax.toLocaleString()}</span>
          </div>
          <div className="fvm-xp-bar"><div className="fvm-xp-fill" style={{ width:`${xpPct}%` }}/></div>
        </div>

        {/* Secciones nav */}
        <div className="fvm-panel fvr-sections" style={{ padding:0 }}>
          <span className="fvm-corners"/>
          <div style={{ padding:"12px 14px 0" }}>
            <div className="fvm-panel-head" style={{ margin:0, paddingTop:0 }}>
              <span className="fvm-deco">◆</span>SECCIONES<span className="fvm-deco">◆</span>
            </div>
          </div>
          <div style={{ padding:"6px 12px 12px" }}>
            {SECCIONES.map(s => (
              <div key={s.key} className={`fvr-sec-item${s.key==="perma"?" active":""}`}
                onClick={s.onClick}
                style={{
                  display:"grid", gridTemplateColumns:"22px 1fr", gap:12,
                  alignItems:"center", padding:"9px 10px", marginBottom:5,
                  border:`2px solid ${s.key==="perma"?"var(--fvm-mente)":"var(--fvm-border)"}`,
                  cursor:"pointer", transition:".15s",
                  fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:s.key==="perma"?"var(--fvm-mente)":"var(--fvm-muted)", letterSpacing:".5px",
                  boxShadow:s.key==="perma"?"inset 0 0 0 1px var(--fvm-mente-a),0 0 12px var(--fvm-mente-a)":"none",
                  background:s.key==="perma"?"linear-gradient(180deg,rgba(176,106,255,.1),rgba(176,106,255,.01))":"var(--fvm-inner)",
                }}>
                <span className={`fvr-si ${s.cls}`}/>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PERMA Streak */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{ color:"var(--fvm-mente)", borderBottomColor:"var(--fvm-mente-a)" }}>
            <span className="fvm-deco">◆</span>RACHA PERMA<span className="fvm-deco">◆</span>
          </div>
          <div className="fvm-streak-row">
            <div className="fvm-streak-fire"/>
            <div className="fvm-streak-num">
              {streak}<span className="fvm-streak-lab">DÍAS</span>
            </div>
          </div>
          <div className="fvm-streak-flames">
            {Array.from({ length:7 }, (_, i) => (
              <div key={i} className={`fvm-flame-ico${i>=streak?" dim":""}`}/>
            ))}
          </div>
          <div className="fvm-streak-msg" style={{ color:"var(--fvm-mente)" }}>
            {streak} días midiendo tu bienestar
          </div>
        </div>

      </aside>

      {/* ══ CENTER COL ══ */}
      <main className="fvm-center-col" style={{ gridColumn:"2" }}>
        <div className="fvm-panel" style={{ padding:"16px 18px" }}>
          <span className="fvm-corners"/>

          {/* Header row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"13px",
                color:"var(--fvm-mente)", letterSpacing:"1.5px", textShadow:"0 0 10px var(--fvm-mente-a)", marginBottom:4 }}>
                EVALUACIÓN PERMA DIARIA
              </div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:16,
                color:"var(--fvm-dim)", letterSpacing:".5px" }}>
                Evalúa cada dimensión del bienestar del 1 al 10.
              </div>
            </div>
            {/* Average badge */}
            <div style={{
              display:"flex", alignItems:"center", gap:12, padding:"10px 16px", flexShrink:0,
              background:"linear-gradient(180deg,rgba(244,204,120,.12),rgba(244,204,120,.02))",
              border:"2px solid var(--fvm-gold)",
              boxShadow:"0 0 16px rgba(244,204,120,.3),inset 0 0 0 1px rgba(244,204,120,.1)",
            }}>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"22px",
                color:"var(--fvm-gold-b)", textShadow:"0 0 12px rgba(244,204,120,.5)", lineHeight:1 }}>
                {avg().toFixed(1)}
              </div>
              <div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                  color:"var(--fvm-dim)", letterSpacing:"1.2px", marginBottom:4 }}>
                  PROMEDIO ACTUAL
                </div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13,
                  color:"#8ac926", display:"flex", alignItems:"center", gap:4 }}>
                  ▲ +0.8 vs ayer
                </div>
              </div>
            </div>
          </div>

          {/* Radar + Sliders grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>

            {/* ── Pentagon Radar SVG ── */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <svg viewBox="0 0 400 400"
                style={{ width:"100%", maxWidth:380, height:"auto", overflow:"visible" }}>
                <defs>
                  <radialGradient id="permaRpgGrad" cx="50%" cy="50%" r="55%">
                    <stop offset="0%"   stopColor="rgba(176,106,255,0.55)"/>
                    <stop offset="100%" stopColor="rgba(76,201,240,0.32)"/>
                  </radialGradient>
                </defs>
                {/* Grid rings */}
                {[0.25,0.5,0.75,1].map((r,ri) => (
                  <polygon key={ri} points={gridPts(r)}
                    fill="none" stroke="rgba(244,204,120,0.12)" strokeWidth="1"/>
                ))}
                {/* Axis spokes */}
                {ORDER.map((_, i) => {
                  const [x,y] = axisPos(i,1);
                  return <line key={i} x1={CX} y1={CY} x2={x} y2={y}
                    stroke="rgba(244,204,120,0.14)" strokeWidth="1"/>;
                })}
                {/* Filled area */}
                <polygon points={areaPts}
                  fill="url(#permaRpgGrad)"
                  stroke="var(--fvm-mente)" strokeWidth="2.5"
                  style={{ filter:"drop-shadow(0 0 8px rgba(176,106,255,.5))", transition:"all .35s" }}/>
                {/* Vertices */}
                {ORDER.map((k,i) => {
                  const [x,y] = vertexPos(i, scores[k]);
                  return (
                    <circle key={k} cx={x} cy={y} r="6"
                      fill={P_COLORS[k]} stroke="#0a0712" strokeWidth="2"
                      style={{ cursor:"pointer", filter:`drop-shadow(0 0 5px ${P_AURAS[k]})`, transition:"all .35s" }}
                      onClick={() => setOpenPillar(openPillar===k ? null : k)}/>
                  );
                })}
                {/* Labels */}
                {ORDER.map((k,i) => {
                  const [x,y] = axisPos(i,1.3);
                  const anchor = Math.abs(x-CX) < 10 ? "middle" : x > CX ? "start" : "end";
                  return (
                    <g key={k} onClick={() => setOpenPillar(openPillar===k ? null : k)}
                      style={{ cursor:"pointer" }}>
                      <text x={x} y={y} textAnchor={anchor}
                        fontFamily="'Manrope',sans-serif" fontSize="11"
                        fill={P_COLORS[k]}
                        style={{ filter:`drop-shadow(0 0 4px ${P_AURAS[k]})` }}>
                        {k}
                      </text>
                      <text x={x} y={y+15} textAnchor={anchor}
                        fontFamily="'Manrope',sans-serif" fontSize="13"
                        fill="var(--fvm-dim)">
                        {scores[k]}/10
                      </text>
                    </g>
                  );
                })}
                {/* Center score */}
                <text x={CX} y={CY-2} textAnchor="middle"
                  fontFamily="'Manrope',sans-serif" fontSize="26"
                  fill="var(--fvm-gold-b)">{avg().toFixed(1)}</text>
                <text x={CX} y={CY+16} textAnchor="middle"
                  fontFamily="'Manrope',sans-serif" fontSize="7"
                  fill="var(--fvm-dim)" letterSpacing="1">PROMEDIO GLOBAL</text>
              </svg>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:14,
                color:"var(--fvm-muted)", textAlign:"center", marginTop:6 }}>
                Haz clic en un pilar para ver más información.
              </div>
            </div>

            {/* ── Sliders ── */}
            <div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-gold-b)", letterSpacing:".5px", marginBottom:10 }}>
                AJUSTA TU EVALUACIÓN
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {ORDER.map(k => (
                  <div key={k} style={{
                    padding:"9px 12px",
                    background:"var(--fvm-inner)",
                    border:`2px solid ${P_COLORS[k]}`,
                    boxShadow:`inset 0 0 0 1px rgba(244,204,120,.04)`,
                    cursor:"pointer",
                  }} onClick={() => setOpenPillar(openPillar===k ? null : k)}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <div style={{
                        width:22, height:22, flexShrink:0,
                        background:P_COLORS[k], color:"#1a1208",
                        fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:`0 0 8px ${P_AURAS[k]}`,
                      }}>{k}</div>
                      <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                        color:P_COLORS[k], letterSpacing:".8px", flex:1, minWidth:0,
                        overflow:"hidden", textOverflow:"ellipsis" }}>
                        {P_DATA[k].name}
                      </div>
                      <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"18px",
                        color:"var(--fvm-gold-b)", flexShrink:0 }}>{scores[k]}</div>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={scores[k]}
                      disabled={saved}
                      className="fvp-slider"
                      style={{ "--fvp-c":P_COLORS[k], "--fvp-a":P_AURAS[k] }}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setScores(prev => ({ ...prev, [k]: parseInt(e.target.value,10) }))}/>
                    {/* Progress bar */}
                    <div style={{ height:7, background:"#050308", border:"1px solid #000",
                      boxShadow:"inset 0 0 0 1px #2a1f3d", overflow:"hidden" }}>
                      <div style={{
                        height:"100%", width:`${scores[k]*10}%`,
                        background:`linear-gradient(90deg,${P_COLORS[k]}88,${P_COLORS[k]})`,
                        boxShadow:`inset 0 1px 0 rgba(255,255,255,.25),0 0 6px ${P_AURAS[k]}`,
                        transition:"width .25s",
                      }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                      color:"var(--fvm-muted)", marginTop:4 }}>
                      <span>1</span><span>5</span><span>10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pillar info expandable */}
          <AnimatePresence>
            {openPillar && (
              <motion.div
                key={openPillar}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                transition={{ duration:.22 }}
                style={{
                  marginTop:16, padding:"14px 16px",
                  background:"var(--fvm-inner)",
                  border:`2px solid ${P_COLORS[openPillar]}`,
                  boxShadow:`inset 0 0 0 1px ${P_AURAS[openPillar]},0 0 16px ${P_AURAS[openPillar]}`,
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{
                    width:28, height:28, background:P_COLORS[openPillar], color:"#1a1208",
                    fontFamily:"'Manrope',sans-serif", fontSize:"13px", flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:`0 0 10px ${P_AURAS[openPillar]}`,
                  }}>{openPillar}</div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"10px",
                    color:P_COLORS[openPillar], letterSpacing:"1px" }}>
                    {P_DATA[openPillar].name}
                  </div>
                </div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"16px",
                  color:"var(--fvm-parch)", lineHeight:1.3, marginBottom:10 }}>
                  {P_DATA[openPillar].q}
                </div>
                <div style={{ paddingTop:10, borderTop:"1px dashed rgba(244,204,120,.15)" }}>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                    color:P_COLORS[openPillar], letterSpacing:"1.2px", marginBottom:6 }}>
                    FUNDAMENTO CIENTÍFICO
                  </div>
                  <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"14px",
                    color:"var(--fvm-dim)", lineHeight:1.3 }}>
                    {P_DATA[openPillar].sci}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save row */}
          <div style={{ display:"flex", gap:10, marginTop:18, alignItems:"center" }}>
            <button disabled={saved||saving} onClick={handleSave} style={{
              flex:1, fontFamily:"'Manrope',sans-serif", fontSize:"10px",
              padding:"14px", letterSpacing:"1.5px", cursor:saved?"default":"pointer",
              background:saved
                ? "linear-gradient(180deg,#2d6f4c,#134a30)"
                : "linear-gradient(180deg,#ad7818,#5a3a0a)",
              color:saved ? "#b4f0c8" : "#fff7cf",
              border:`2px solid ${saved?"#8ac926":"var(--fvm-gold-b)"}`,
              boxShadow:saved
                ? "inset 0 0 0 1px rgba(180,240,200,.18)"
                : "inset 0 0 0 1px rgba(255,255,255,.15),inset 0 -2px 0 rgba(0,0,0,.4),0 0 16px rgba(244,204,120,.4)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:12,
              transition:"all .1s",
            }}>
              {saved ? "✓ GUARDADO HOY" : saving ? "GUARDANDO..." : "⊕ GUARDAR EVALUACIÓN"}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px",
              background:"var(--fvm-inner)", border:"2px solid var(--fvm-border)" }}>
              <div style={{ width:16, height:16, background:"linear-gradient(180deg,var(--fvm-xp3),var(--fvm-xp1))",
                clipPath:"polygon(50% 0,100% 50%,50% 100%,0 50%)" }}/>
              <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-gold-b)" }}>+40 XP</span>
            </div>
            {saved && (
              <motion.div initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
                  border:"2px solid #8ac926", boxShadow:"0 0 12px rgba(138,201,38,.3)" }}>
                <div style={{ width:14, height:14, background:"#8ac926",
                  clipPath:"polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%)" }}/>
                <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px", color:"#8ac926" }}>
                  GUARDADO
                </span>
              </motion.div>
            )}
          </div>

        </div>
      </main>

      {/* ══ RIGHT COL ══ */}
      <aside className="fvm-right-col" style={{ gridColumn:"3" }}>

        {/* Pillar detail card */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{ color:"var(--fvm-mente)", borderBottomColor:"var(--fvm-mente-a)" }}>
            <span className="fvm-deco">◆</span>SOBRE ESTE PILAR<span className="fvm-deco">◆</span>
          </div>

          {/* Pillar icon */}
          <div style={{ textAlign:"center", margin:"8px 0 12px" }}>
            <div style={{
              display:"inline-flex", alignItems:"center", justifyContent:"center", gap:10,
              padding:"10px 16px",
              border:`2px solid ${P_COLORS[activePillar]}`,
              boxShadow:`0 0 16px ${P_AURAS[activePillar]},inset 0 0 0 1px ${P_AURAS[activePillar]}`,
              background:`linear-gradient(180deg,${P_COLORS[activePillar]}18,${P_COLORS[activePillar]}04)`,
            }}>
              <div style={{
                width:24, height:24, background:P_COLORS[activePillar], color:"#1a1208",
                fontFamily:"'Manrope',sans-serif", fontSize:"12px",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 0 10px ${P_AURAS[activePillar]}`,
              }}>{activePillar}</div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:P_COLORS[activePillar], letterSpacing:".8px" }}>
                {P_DATA[activePillar].name}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"15px",
            color:"var(--fvm-parch)", lineHeight:1.3, marginBottom:12 }}>
            {P_DATA[activePillar].q}
          </div>

          {/* Science basis */}
          <div style={{ paddingTop:10, marginBottom:12,
            borderTop:"1px dashed rgba(244,204,120,.15)" }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"11px",
              color:"var(--fvm-gold-s)", letterSpacing:"1px", marginBottom:6 }}>
              FUNDAMENTO CIENTÍFICO
            </div>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"13px",
              color:"var(--fvm-dim)", lineHeight:1.3 }}>
              {P_DATA[activePillar].sci}
            </div>
          </div>

          {/* Score display */}
          <div style={{
            textAlign:"center", padding:"10px",
            border:`2px solid ${P_COLORS[activePillar]}`,
            background:"var(--fvm-inner)",
            boxShadow:`0 0 12px ${P_AURAS[activePillar]}`,
          }}>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"20px",
              color:P_COLORS[activePillar], lineHeight:1,
              textShadow:`0 0 12px ${P_AURAS[activePillar]}` }}>
              {scores[activePillar]} / 10
            </div>
          </div>
        </div>

        {/* 7-day trend */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{ color:"var(--fvm-mente)", borderBottomColor:"var(--fvm-mente-a)" }}>
            <span className="fvm-deco">◆</span>HISTORIAL (7 DÍAS)<span className="fvm-deco">◆</span>
          </div>
          <div style={{ height:90, display:"flex", alignItems:"flex-end", justifyContent:"space-between",
            gap:4, padding:"18px 2px 0", borderBottom:"1px solid rgba(244,204,120,.15)",
            marginBottom:6, position:"relative" }}>
            {history7.map((v, i) => {
              const pct  = v !== null ? (v / 10) * 100 : 0;
              const today = i === 6;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                  <div style={{
                    width:"100%", maxWidth:22, minHeight:4,
                    height:`${pct}%`,
                    background: today
                      ? "linear-gradient(180deg,var(--fvm-gold-b),var(--fvm-gold))"
                      : "linear-gradient(180deg,var(--fvm-mente),var(--fvm-xp1))",
                    border:`1px solid ${today?"var(--fvm-gold-b)":"var(--fvm-mente)"}66`,
                    boxShadow: today
                      ? "inset 0 1px 0 rgba(255,255,255,.3),0 0 10px rgba(244,204,120,.4)"
                      : "inset 0 1px 0 rgba(255,255,255,.2)",
                    transition:"height .5s", position:"relative",
                  }}>
                    <span style={{ position:"absolute", top:-14, left:"50%",
                      transform:"translateX(-50%)",
                      fontFamily:"'Manrope',sans-serif", fontSize:"11px", whiteSpace:"nowrap",
                      color:today?"var(--fvm-gold-b)":"var(--fvm-dim)" }}>
                      {v !== null ? v.toFixed(1) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", gap:4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ flex:1, textAlign:"center",
                fontFamily:"'Manrope',sans-serif", fontSize:"11px",
                color:"var(--fvm-dim)", letterSpacing:".5px" }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Micro-mission */}
        <div className="fvm-panel" style={{ padding:"14px 16px" }}>
          <span className="fvm-corners"/>
          <div className="fvm-panel-head" style={{ color:"var(--fvm-mente)", borderBottomColor:"var(--fvm-mente-a)" }}>
            <span className="fvm-deco">◆</span>MICRO-MISIÓN<span className="fvm-deco">◆</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8,
            fontFamily:"'Manrope',sans-serif", fontSize:"11px",
            color:"var(--fvm-gold-b)", letterSpacing:"1.2px" }}>
            <span>★</span>PILAR MÁS BAJO: {lowK}
          </div>
          <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:"14px",
            color:"var(--fvm-parch)", lineHeight:1.3, marginBottom:10 }}>
            {P_DATA[lowK].quest}
          </div>
          {/* Reward */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            padding:"8px", background:"var(--fvm-inner)", border:"2px solid var(--fvm-border)" }}>
            <div style={{ width:14, height:14,
              background:"linear-gradient(180deg,var(--fvm-xp3),var(--fvm-xp1))",
              clipPath:"polygon(50% 0,100% 50%,50% 100%,0 50%)",
              boxShadow:"0 0 8px rgba(157,78,221,.4)" }}/>
            <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"12px",
              color:"var(--fvm-gold-b)", textShadow:"0 0 8px rgba(244,204,120,.4)" }}>
              +40 XP
            </span>
          </div>
        </div>

      </aside>
    </>
  );
}


function UserMenteLegacy({ profile }) {
  // Mantener el nombre evita romper referencias viejas, pero toda ruta legacy
  // cae en la vista viva para no sostener dos comportamientos distintos.
  return <UserMente profile={profile} />;

  const { t } = useLang();
  const scCard = (accent = SC.orange) => ({ background:SC.card, border:`1px solid ${SC.navy}`, borderTop:`2px solid ${accent}`, borderRadius:14, boxShadow:"0 4px 24px rgba(0,0,0,0.35)" });
  const [tab, setTab] = useState("mood");

  // XP popups
  const [xpPopups, setXpPopups] = useState([]);
  const xpIdRef = useRef(0);

  // Remote data
  const [todayDone,        setTodayDone]        = useState(null);
  const [summary,          setSummary]          = useState(null);
  const [insights,         setInsights]         = useState([]);
  const [community,        setCommunity]        = useState(null);
  const [insightsLoading,  setInsightsLoading]  = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);

  const heroClass = profile?.heroClass || profile?.clase || "DEFAULT";

  const handleXP = useCallback((amount, color = C.gold, levelData = {}) => {
    const id = ++xpIdRef.current;
    if (canShowXpPopups()) {
      setXpPopups(prev => [...prev, { id, amount, color }]);
    }
    window.dispatchEvent(new CustomEvent("exerciseCompleted", {
      detail: {
        xp:        amount,
        leveledUp: levelData.leveledUp  || false,
        newLevel:  levelData.newLevel   ?? undefined,
        xpNext:    levelData.xpNext     ?? undefined,
      },
    }));
  }, []);

  const removeXP = useCallback((id) => {
    setXpPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleTabFromActivity = (actKey) => {
    const t = ACT_TO_TAB[actKey];
    if (t) setTab(t);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const [sumRes, insRes, comRes] = await Promise.allSettled([
          getMenteSummary(token),
          getMenteInsights(token),
          getCommunityMente(token),
        ]);
        if (cancelled) return;
        if (sumRes.status === "fulfilled") {
          setSummary(sumRes.value);
          setTodayDone(sumRes.value.todayDone || null);
        }
        if (insRes.status === "fulfilled") setInsights(insRes.value.insights || []);
        if (comRes.status === "fulfilled") setCommunity(comRes.value);
      } catch {}
      if (!cancelled) { setInsightsLoading(false); setCommunityLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const active = TABS.find(tb => tb.id===tab);

  const SCIENCE_STATS = [
    { stat:"30%", labelKey:"me.stats.0.label", src:"APA 2023",    color:SC.blue,   ico:(c)=><IcoTrendUp c={c} s={14}/> },
    { stat:"47%", labelKey:"me.stats.1.label", src:"Emmons 2003", color:SC.teal,   ico:(c)=><IcoLeaf c={c} s={14}/> },
    { stat:"23%", labelKey:"me.stats.2.label", src:"Beedie 2012", color:SC.orange, ico:(c)=><IcoActivity c={c} s={14}/> },
    { stat:"5×",  labelKey:"me.stats.3.label", src:"VIA",         color:SC.gold,   ico:(c)=><IcoFlame c={c} s={13}/> },
  ];

  const streak = profile?.streak || 0;
  const xpCur  = profile?.xp    || 2350;
  const xpMax  = profile?.xpMax || 4800;
  const xpPct  = Math.min(100, Math.round((xpCur / xpMax) * 100));

  return (
    <>
      <style>{CSS}</style>

      {/* XP popups */}
      {xpPopups.map(p => (
        <XPPopup key={p.id} amount={p.amount} color={p.color} onDone={() => removeXP(p.id)}/>
      ))}

      <div className="fvm-wrapper">

        {/* ═══ TOP BAR ═══ */}
        <div className="fvm-top-bar">
          <div className="fvm-panel fvm-brand">
            <span className="fvm-corners"/>
            <div className="fvm-brand-mark"/>
            <div>
              <div className="fvm-brand-text">FORGEVENTURE</div>
              <div className="fvm-brand-sub">ZONA MENTE · ÁNIMO</div>
            </div>
          </div>
          <div className="fvm-panel fvm-page-title">
            <span className="fvm-corners"/>
            <div className="fvm-page-h1">
              <span className="fvm-deco">✦</span>
              ZONA MENTE
              <span className="fvm-deco">✦</span>
            </div>
            <div className="fvm-page-sub">ENTRENA TU MENTE, DOMINA TU VIDA</div>
          </div>
          <div className="fvm-panel fvm-top-right">
            <span className="fvm-corners"/>
            <div className="fvm-currency">
              <span className="fvm-ic fvm-ic-gold"/><span>2,450</span>
            </div>
            <div className="fvm-currency">
              <span className="fvm-ic fvm-ic-gem"/><span>385</span>
            </div>
            <div className="fvm-currency">
              <span className="fvm-ic fvm-ic-energy"/><span>12</span>
            </div>
            <button className="fvm-gear-btn">⚙</button>
          </div>
        </div>

        {/* ═══ LEFT COL: Profile + Stats + Equipment + Streak ═══ */}
        {tab === "breath"
          ? <BreathingRPG
              onXP={handleXP} todayDone={todayDone}
              profile={profile} streak={streak}
              tab={tab} setTab={setTab}/>
          : tab === "perma"
            ? <PermaRPG
                onXP={handleXP} todayDone={todayDone}
                profile={profile} streak={streak}
                tab={tab} setTab={setTab}
                permaHistory={summary?.permaHistory || []}
                storageScope={profile?.uid || auth.currentUser?.uid || "guest"}/>
          : tab === "aff"
            ? <AffirmationsRPG
                onXP={handleXP} todayDone={todayDone}
                profile={profile} streak={streak}
                tab={tab} setTab={setTab}
                storageScope={profile?.uid || auth.currentUser?.uid || "guest"}/>
          : <><aside className="fvm-left-col">

          {/* Profile */}
          <div className="fvm-panel" style={{padding:"14px 16px"}}>
            <span className="fvm-corners"/>
            <div className="fvm-profile-top">
              <div className="fvm-av-frame">
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="" className="fvm-av-img"/>
                  : <div className="fvm-ph-icon">⚔</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="fvm-player-name">
                  {(profile?.username||profile?.displayName||"WARRIOR").toUpperCase().slice(0,10)}
                </div>
                <div className="fvm-player-class">GUERRERO DISCIPLINADO</div>
                <div className="fvm-level-pill">
                  <div className="fvm-crest">⚔</div>
                  <div>
                    <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px",
                      color:"var(--fvm-dim)",letterSpacing:"1px"}}>LV.</div>
                    <div style={{color:"var(--fvm-gold-b)",fontFamily:"'Manrope',sans-serif",
                      fontSize:"13px",textShadow:"0 0 8px rgba(244,204,120,.5)"}}>
                      {profile?.level||24}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="fvm-xp-row">
              <span style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px"}}>EXP</span>
              <span className="fvm-xp-val">
                {(xpCur).toLocaleString()} / {(xpMax).toLocaleString()}
              </span>
            </div>
            <div className="fvm-xp-bar">
              <div className="fvm-xp-fill" style={{width:`${xpPct}%`}}/>
            </div>
          </div>

          {/* Stats */}
          <div className="fvm-panel" style={{padding:"14px 16px"}}>
            <span className="fvm-corners"/>
            <div className="fvm-panel-head">
              <span className="fvm-deco">◆</span>ESTADÍSTICAS<span className="fvm-deco">◆</span>
            </div>
            {[
              {gCls:"fvm-g-heart",  name:"FUERZA",     barCls:"fvm-fill-str", val:78},
              {gCls:"fvm-g-shield", name:"RESISTENCIA", barCls:"fvm-fill-sta", val:64},
              {gCls:"fvm-g-boot",   name:"VELOCIDAD",   barCls:"fvm-fill-spd", val:52},
              {gCls:"fvm-g-scroll", name:"DISCIPLINA",  barCls:"fvm-fill-dis", val:86},
              {gCls:"fvm-g-brain",  name:"MENTALIDAD",  barCls:"fvm-fill-men",
                val: Math.min(100, 71 + (streak > 0 ? 1 : 0))},
            ].map(s => (
              <div key={s.name} className="fvm-stat">
                <div className={`fvm-stat-g ${s.gCls}`}/>
                <div style={{minWidth:0}}>
                  <div className="fvm-stat-lbl">
                    <span>{s.name}</span>
                    <span className="fvm-stat-v">{s.val}</span>
                  </div>
                  <div className="fvm-stat-bar">
                    <div className={`fvm-stat-fill ${s.barCls}`}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment */}
          <div className="fvm-panel" style={{padding:"14px 16px 12px"}}>
            <span className="fvm-corners"/>
            <div className="fvm-panel-head">
              <span className="fvm-deco">◆</span>EQUIPAMIENTO<span className="fvm-deco">◆</span>
            </div>
            <div className="fvm-equip-grid">
              <div className="fvm-slot r-legend">
                <img src="/ui/equip_weapon.png" alt="" className="fvm-item sword"
                  onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextSibling&&(e.currentTarget.nextSibling.style.display="block")}}/>
                <div className="fvm-item sword" style={{display:"none"}}/>
              </div>
              <div className="fvm-slot r-rare"><div className="fvm-item helmet"/></div>
              <div className="fvm-slot r-epic"><div className="fvm-item armor"/></div>
              <div className="fvm-slot r-epic"><div className="fvm-item belt"/></div>
              <div className="fvm-slot r-rare"><div className="fvm-item pants"/></div>
              <div className="fvm-slot r-uncom"><div className="fvm-item boots"/></div>
            </div>
          </div>

          {/* Streak */}
          <div className="fvm-panel" style={{padding:"14px 16px"}}>
            <span className="fvm-corners"/>
            <div className="fvm-panel-head">
              <span className="fvm-deco">◆</span>RACHA ACTUAL<span className="fvm-deco">◆</span>
            </div>
            <div className="fvm-streak-row">
              <div className="fvm-streak-fire"/>
              <div className="fvm-streak-num">
                {streak||14}
                <span className="fvm-streak-lab">DÍAS</span>
              </div>
            </div>
            <div className="fvm-streak-flames">
              {Array.from({length:7},(_,i)=>(
                <div key={i} className={`fvm-flame-ico${i>=(streak||14)?` dim`:""}`}/>
              ))}
            </div>
            <div className="fvm-streak-msg">¡Sigue así, campeón!</div>
          </div>

        </aside>

        {/* ═══ CENTER COL ═══ */}
        <main className="fvm-center-col">

          {/* ── Progress board ── */}
          {todayDone && (() => {
            const acts = [
              {key:"mood",        label:"ÁNIMO",        color:"#c89b3c", xp:25},
              {key:"gratitude",   label:"GRATITUD",     color:"#4a9d8f", xp:30},
              {key:"breathing",   label:"RESPIRACIÓN",  color:"#5a9fd4", xp:20},
              {key:"perma",       label:"PERMA",        color:"#8b7bb8", xp:40},
              {key:"affirmation", label:"AFIRMACIONES", color:"#c9b037", xp:15},
              {key:"strengths",   label:"FORTALEZAS",   color:"#4a9d8f", xp:60},
            ];
            const done  = acts.filter(a => todayDone?.[a.key]);
            const pct   = Math.round((done.length / acts.length) * 100);
            const xpTot = done.reduce((s,a) => s + a.xp, 0);
            return (
              <div className="fvm-progress-board">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div className="fvm-pb-title">PROGRESO DE HOY</div>
                  <div style={{display:"flex",gap:8}}>
                    <span style={{fontFamily:"'Manrope',sans-serif",fontSize:"14px",
                      color:"var(--fvm-gold-b)",background:"var(--fvm-inner)",
                      border:"1px solid var(--fvm-border)",padding:"3px 8px"}}>
                      +{xpTot} XP
                    </span>
                    <span style={{fontFamily:"'Manrope',sans-serif",fontSize:"14px",
                      color: pct===100?"#8ac926":"var(--fvm-dim)",background:"var(--fvm-inner)",
                      border:`1px solid ${pct===100?"#8ac926":"var(--fvm-border)"}`,padding:"3px 8px"}}>
                      {done.length}/{acts.length}
                    </span>
                  </div>
                </div>
                <div className="fvm-pb-bar">
                  <div className="fvm-pb-fill" style={{width:`${pct}%`}}/>
                </div>
                <div className="fvm-pb-chips">
                  {acts.map(a => {
                    const isDone = todayDone?.[a.key];
                    return (
                      <button key={a.key}
                        className={`fvm-pb-chip${isDone?" done":""}`}
                        style={isDone?{"--fvm-chip-c":a.color}:{}}
                        onClick={() => {const t=ACT_TO_TAB[a.key];if(t)setTab(t);}}>
                        {isDone && <span className="fvm-pb-check"/>}
                        {a.label}
                        {isDone && <span style={{color:a.color}}>+{a.xp}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Gothic Tab Bar ── */}
          <div className="fvm-tabbar">
            {TABS.map((tb2, idx) => {
              const on   = tab === tb2.id;
              const aKey = ACT_TO_TAB[tb2.id === "mood" ? "mood" : tb2.id === "breath" ? "breathing" : tb2.id === "perma" ? "perma" : tb2.id === "aff" ? "affirmation" : tb2.id === "strengths" ? "strengths" : ""] || null;
              const isDone = aKey && todayDone?.[aKey];
              const colVar = {mood:"#c89b3c",breath:"#5a9fd4",perma:"#8b7bb8",aff:"#c9b037",strengths:"#4a9d8f",insights:"#5a9fd4"}[tb2.id] || "#b06aff";
              return (
                <button key={tb2.id}
                  className={`fvm-tabbar-btn${on?" active":""}`}
                  style={on ? {"--fvm-tb-c": colVar} : {}}
                  onClick={() => setTab(tb2.id)}>
                  <span style={{opacity: on ? 1 : 0.55, display:"flex", alignItems:"center"}}>
                    {TAB_ICONS[tb2.id]?.(on ? colVar : "#5e5269", 13)}
                  </span>
                  <span>{t(tb2.labelKey)}</span>
                  {tb2.badge && <span className="fvm-tab-badge">{tb2.badge}</span>}
                  {isDone && <span className="fvm-done-dot"/>}
                </button>
              );
            })}
          </div>

          {/* ── Tab content ── */}
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
              transition={{duration:.22,ease:"easeOut"}}
              className="fvm-tab-panel">

              {/* ── ÁNIMO ── */}
              {tab === "mood" && (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <MoodCheckin heroClass={heroClass} onXP={handleXP} todayDone={todayDone}/>
                  <GratitudeDiary onXP={handleXP} todayDone={todayDone} serverEntries={summary?.todayGratitudeEntries}/>
                </div>
              )}

              {/* ── RESPIRACIÓN — handled by BreathingRPG which takes over left+right cols ── */}
              {tab === "breath" && null}

              {/* ── PERMA ── */}
              {tab === "perma" && (
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px",
                    color:"#8b7bb8",letterSpacing:"1px",marginBottom:16,
                    textShadow:"0 0 8px #8b7bb844",
                    borderBottom:"1px dashed rgba(139,123,184,.2)",paddingBottom:10,
                    display:"flex",alignItems:"center",gap:10}}>
                    {TAB_ICONS.perma("#8b7bb8",14)}
                    BIENESTAR PERMA
                  </div>
                  <PermaWheel onXP={handleXP} todayDone={todayDone}/>
                </div>
              )}

              {/* ── AFIRMACIONES ── */}
              {tab === "aff" && (
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px",
                    color:"#c9b037",letterSpacing:"1px",marginBottom:16,
                    textShadow:"0 0 8px #c9b03744",
                    borderBottom:"1px dashed rgba(201,176,55,.2)",paddingBottom:10,
                    display:"flex",alignItems:"center",gap:10}}>
                    {TAB_ICONS.aff("#c9b037",14)}
                    AFIRMACIONES DEL HÉROE
                  </div>
                  <HeroAffirmations heroClass={heroClass} onXP={handleXP} todayDone={todayDone}/>
                </div>
              )}

              {/* ── FORTALEZAS ── */}
              {tab === "strengths" && (
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px",
                    color:"#4a9d8f",letterSpacing:"1px",marginBottom:16,
                    textShadow:"0 0 8px #4a9d8f44",
                    borderBottom:"1px dashed rgba(74,157,143,.2)",paddingBottom:10,
                    display:"flex",alignItems:"center",gap:10}}>
                    {TAB_ICONS.strengths("#4a9d8f",14)}
                    TEST DE FORTALEZAS
                  </div>
                  <StrengthsTest onXP={handleXP} todayDone={todayDone}/>
                </div>
              )}

              {/* ── INSIGHTS ── */}
              {tab === "insights" && (
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{fontFamily:"'Manrope',sans-serif",fontSize:"11px",
                    color:"#5a9fd4",letterSpacing:"1px",marginBottom:16,
                    textShadow:"0 0 8px #5a9fd444",
                    borderBottom:"1px dashed rgba(90,159,212,.2)",paddingBottom:10,
                    display:"flex",alignItems:"center",gap:10}}>
                    {TAB_ICONS.insights("#5a9fd4",14)}
                    INSIGHTS DE LA COMUNIDAD
                    <span className="fvm-tab-badge" style={{marginLeft:4}}>LIVE</span>
                  </div>
                  <InsightsTab
                    summary={summary}
                    insights={insights}
                    community={community}
                    insightsLoading={insightsLoading}
                    communityLoading={communityLoading}/>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>

        {/* ═══ RIGHT COL ═══ */}
        <aside className="fvm-right-col">

          {/* Daily reward */}
          <div className="fvm-panel" style={{padding:"14px 16px",textAlign:"center"}}>
            <span className="fvm-corners"/>
            <div className="fvm-panel-head" style={{color:"var(--fvm-mente)",
              borderBottomColor:"var(--fvm-mente-a)"}}>
              <span className="fvm-deco">◆</span>RECOMPENSA DIARIA<span className="fvm-deco">◆</span>
            </div>
            {/* ╔══════════════════════════════════════════════╗
                ║ [PNG_SLOT] /ui/chest-mente.png               ║
                ║ 110×90px purple/mente chest pixel art        ║
                ╚══════════════════════════════════════════════╝ */}
            <div className="fvm-reward-chest">
              <div className="fvm-chest-glow"/>
              <div className="fvm-chest-lid"/>
              <div className="fvm-chest-body"/>
              <div className="fvm-chest-lock"/>
              <img src="/ui/chest-mente.png" alt="" style={{
                position:"absolute",inset:0,width:"100%",height:"100%",
                objectFit:"contain",imageRendering:"pixelated",zIndex:3}}
                onError={e=>e.currentTarget.style.display="none"}/>
            </div>
            <div className="fvm-reward-desc">Por completar tu<br/>check-in emocional</div>
            <div className="fvm-reward-amounts">
              <div className={`fvm-reward-amt${todayDone?.mood?" claimed":""}`}>
                <span className="fvm-ra-ic fvm-ra-xp"/>
                <span className="fvm-ra-v">XP 20</span>
              </div>
              <div className={`fvm-reward-amt${todayDone?.mood?" claimed":""}`}>
                <span className="fvm-ra-ic fvm-ra-gem"/>
                <span className="fvm-ra-v">5</span>
              </div>
            </div>
          </div>

          {/* Streak panel */}
          <div className="fvm-panel" style={{padding:"14px 16px",textAlign:"center"}}>
            <span className="fvm-corners"/>
            <div className="fvm-panel-head" style={{color:"var(--fvm-mente)",
              borderBottomColor:"var(--fvm-mente-a)"}}>
              <span className="fvm-deco">◆</span>TU RACHA<span className="fvm-deco">◆</span>
            </div>
            <div className="fvm-bigstreak-hex">
              <div className="fvm-bigstreak-num">{moodStreak}</div>
            </div>
            <div className="fvm-bigstreak-label">DÍAS<br/>CONSECUTIVOS</div>
            <div className="fvm-benefits-title">BENEFICIOS DE RACHA</div>
            {[
              {cls:"fvm-b7",  days:"7 días",  gain:"+5% XP",  current:moodStreak>=7 && moodStreak<14},
              {cls:"fvm-b14", days:"14 días", gain:"+10% XP", current:moodStreak>=14 && moodStreak<30},
              {cls:"fvm-b30", days:"30 días", gain:"+15% XP", current:moodStreak>=30},
            ].map(b=>(
              <div key={b.cls} className={`fvm-benefit-row ${b.cls}${b.current?" fvm-current":""}`}>
                <span className="fvm-bdot"/>
                <span>{b.days}</span>
                <span className="fvm-bgain">{b.gain}</span>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="fvm-panel" style={{padding:"18px 16px",textAlign:"center"}}>
            <span className="fvm-corners"/>
            <div className="fvm-med-wrap">
              <div className="fvm-med-head"/>
              <div className="fvm-med-body"/>
            </div>
            <div className="fvm-quote-text">
              "La fuerza mental es el músculo más poderoso de todos."
            </div>
          </div>

        </aside>

        </>}
        {/* ═══ BOTTOM NAV — 9 items ═══ */}
        <nav className="fvm-panel fvm-bottom-nav">
          <span className="fvm-corners"/>
          {[
            {id:"map",      label:"MAPA",       href:"/",           ng:"fvm-ng-map"},
            {id:"char",     label:"PERSONAJE",  href:"/personaje",  ng:"fvm-ng-char"},
            {id:"exercise", label:"EJERCICIOS", href:"/ejercicios", ng:"fvm-ng-exercise"},
            {id:"routine",  label:"RUTINAS",    href:"/rutinas",    ng:"fvm-ng-routine"},
            {id:"mission",  label:"MISIONES",   href:"/misiones",   ng:"fvm-ng-mission"},
            {id:"logros",   label:"LOGROS",     href:"/logros",     ng:"fvm-ng-trophy"},
            {id:"shop",     label:"TIENDA",     href:"/tienda",     ng:"fvm-ng-shop"},
            {id:"mente",    label:"MENTE",      href:"/mente",      ng:"fvm-ng-brain", active:true},
            {id:"chat",     label:"CHAT",       href:"/chat",       ng:"fvm-ng-chat"},
          ].map(item=>(
            <a key={item.id} href={item.href}
              className={`fvm-nav-item${item.active?" active":""}`}>
              <div className="fvm-nav-icon">
                <div className={`fvm-ng ${item.ng}`}/>
              </div>
              <div className="fvm-nav-label">{item.label}</div>
            </a>
          ))}
        </nav>

      </div>
    </>
  );
}

const MENTE_CLASS_COPY = {
  GUERRERO: { title: "Despeja tensión,", span: "prepara el golpe." },
  ARQUERO:  { title: "Ajusta ritmo y pulso,", span: "apunta sin ruido." },
  MAGO:     { title: "Ordena el campo,", span: "que el mapa rinda." },
  DEFAULT:  { title: "Mente clara,", span: "mapa despejado." },
};

export default function UserMente({ profile }) {
  const storageScope = String(profile?.uid || auth.currentUser?.uid || "guest");
  const tabStorageKey = menteScopedKey(storageScope, "tab");
  const [tab, setTab] = useState(() => lsGet(tabStorageKey, "mood"));
  const [xpPopups, setXpPopups] = useState([]);
  const xpIdRef        = useRef(0);
  const [todayDone, setTodayDone] = useState(null);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [community, setCommunity] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [connectionSaving, setConnectionSaving] = useState(false);

  const rawHeroClass = String(profile?.heroClass || profile?.clase || "DEFAULT").toUpperCase();
  const heroClass = USER_CLASS_THEME[rawHeroClass] ? rawHeroClass : "DEFAULT";
  const classTheme = USER_CLASS_THEME[heroClass] || USER_CLASS_THEME.DEFAULT;
  const menteCopy = MENTE_CLASS_COPY[heroClass] || MENTE_CLASS_COPY.DEFAULT;

  const handleXP = useCallback((amount, color = C.gold, levelData = {}) => {
    const id = ++xpIdRef.current;
    if (canShowXpPopups()) {
      setXpPopups((prev) => [...prev, { id, amount, color }]);
    }
    window.dispatchEvent(new CustomEvent("exerciseCompleted", {
      detail: {
        xp: amount,
        leveledUp: levelData.leveledUp || false,
        newLevel: levelData.newLevel ?? undefined,
        xpNext: levelData.xpNext ?? undefined,
      },
    }));
  }, []);

  const removeXP = useCallback((id) => {
    setXpPopups((prev) => prev.filter((popup) => popup.id !== id));
  }, []);

  const handleTabFromActivity = useCallback((actKey) => {
    const nextTab = ACT_TO_TAB[actKey];
    if (nextTab) setTab(nextTab);
  }, []);

  const handleConnection = useCallback(async () => {
    if (connectionSaving || todayDone?.connection) return;

    const connectionNotes = {
      GUERRERO: "Hoy abrí espacio para una alianza breve que sostenga disciplina y constancia.",
      ARQUERO: "Hoy conecté con alguien para mantener ritmo, presencia y avance limpio.",
      MAGO: "Hoy dejé un gesto de conexión consciente para cuidar relaciones y foco interno.",
      DEFAULT: "Hoy registré una conexión breve que suma equilibrio a mi jornada.",
    };

    try {
      setConnectionSaving(true);
      const token = await getToken();
      const res = await saveMenteConnection(token, connectionNotes[heroClass] || connectionNotes.DEFAULT);

      if (res?.xpEarned) {
        handleXP(res.xpEarned, classTheme.secondary || classTheme.accent, res);
      }

      const nextTodayDone = { ...(todayDone || {}), connection: true };
      setTodayDone(nextTodayDone);

      setSummary((prev) => {
        if (!prev) return prev;
        const bump = res?.alreadyDone ? 0 : 1;
        const nextSummary = {
          ...prev,
          todayDone: nextTodayDone,
          weekSessions: Number(prev.weekSessions || 0) + bump,
          sessionCounts: {
            ...(prev.sessionCounts || {}),
            connection: Number(prev.sessionCounts?.connection || 0) + bump,
          },
        };
        writeMenteClientCache(storageScope, "summary", nextSummary);
        return nextSummary;
      });
    } catch {}
    finally {
      setConnectionSaving(false);
    }
  }, [classTheme.accent, classTheme.secondary, connectionSaving, handleXP, heroClass, storageScope, todayDone]);

  useEffect(() => {
    lsSet(tabStorageKey, tab);
  }, [tab, tabStorageKey]);

  useEffect(() => {
    const cachedSummary = readMenteClientCache(storageScope, "summary", MENTE_CLIENT_CACHE_TTL);
    if (cachedSummary) {
      setSummary(cachedSummary);
      setTodayDone(cachedSummary.todayDone || null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const sumRes = await getMenteSummary(token);
        if (cancelled) return;
        const nextSummary = writeMenteClientCache(storageScope, "summary", sumRes);
        setSummary(nextSummary);
        setTodayDone(nextSummary.todayDone || null);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [storageScope]);

  useEffect(() => {
    if (tab !== "insights") return;

    const cachedInsights = readMenteClientCache(storageScope, "insights", MENTE_CLIENT_INSIGHTS_TTL);
    const cachedCommunity = readMenteClientCache(storageScope, "community", MENTE_CLIENT_INSIGHTS_TTL);

    if (cachedInsights) setInsights(cachedInsights);
    if (cachedCommunity) setCommunity(cachedCommunity);

    if (cachedInsights && cachedCommunity) {
      setInsightsLoading(false);
      setCommunityLoading(false);
      return;
    }

    let cancelled = false;
    setInsightsLoading(true);
    setCommunityLoading(true);

    (async () => {
      try {
        const token = await getToken();
        const [insRes, comRes] = await Promise.allSettled([
          cachedInsights ? Promise.resolve({ insights: cachedInsights }) : getMenteInsights(token),
          cachedCommunity ? Promise.resolve(cachedCommunity) : getCommunityMente(token),
        ]);
        if (cancelled) return;
        if (insRes.status === "fulfilled") {
          const nextInsights = insRes.value.insights || [];
          writeMenteClientCache(storageScope, "insights", nextInsights);
          setInsights(nextInsights);
        }
        if (comRes.status === "fulfilled") {
          writeMenteClientCache(storageScope, "community", comRes.value);
          setCommunity(comRes.value);
        }
      } catch {}
      if (!cancelled) {
        setInsightsLoading(false);
        setCommunityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, storageScope]);

  const streak = profile?.streak || 0;
  const moodStreak = summary?.moodStreak || summary?.moodStreakStored || 0;
  const xpCur = profile?.xp || 0;
  const xpMax = profile?.xpMax || profile?.xpNext || 100;
  const xpPct = Math.min(100, Math.round((xpCur / xpMax) * 100));
  const doneCount = TODAY_ACTIVITIES.filter((activity) => todayDone?.[activity.key]).length;
  const progressPct = Math.round((doneCount / TODAY_ACTIVITIES.length) * 100);
  const xpToday = TODAY_ACTIVITIES.filter((activity) => todayDone?.[activity.key]).reduce((sum, activity) => sum + activity.xp, 0);
  const weekSessions =
    summary?.weekSessions ||
    summary?.weeklySessions ||
    summary?.sessionsThisWeek ||
    summary?.diasActivos ||
    Math.max(doneCount, Math.min(6, streak + 1));
  const reflectionCount =
    summary?.journalEntries ||
    summary?.gratitudeEntries ||
    summary?.gratitudeCount ||
    (todayDone?.gratitude ? 3 : 0) + (todayDone?.affirmation ? 1 : 0);
  const communityActive =
    community?.community?.activeToday ||
    community?.activeToday ||
    community?.moods?.total ||
    0;
  const connectionDone = Boolean(todayDone?.connection);
  const mindStageState =
    doneCount === 0 ? "Santuario en reposo" :
    doneCount < 3 ? "Camino en calentamiento" :
    doneCount < TODAY_ACTIVITIES.length ? "Ritmo mental encendido" :
    "Jornada despejada";

  const recommendedTab =
    doneCount === TODAY_ACTIVITIES.length ? "insights" :
    heroClass === "MAGO" ? "perma" :
    heroClass === "ARQUERO" ? "breath" :
    heroClass === "GUERRERO" ? "strengths" :
    "mood";

  const TAB_COPY = {
    mood: {
      title: "Check-in emocional",
      lead: "Lee como llegas hoy, deja una nota breve y abre la zona con intencion clara.",
      kicker: "Entrada del santuario",
      reward: "+55 XP entre animo y gratitud",
    },
    breath: {
      title: "Respiración guiada",
      lead: "Baja ruido mental, ordena pulso y recupera foco sin salir del mapa.",
      kicker: "Control del ritmo",
      reward: "+20 XP por sesión guiada",
    },
    perma: {
      title: "Rueda PERMA",
      lead: "Mide bienestar real, detecta el pilar más bajo y deja una micro misión útil para hoy.",
      kicker: "Lectura profunda",
      reward: "+40 XP por balance diario",
    },
    aff: {
      title: "Afirmaciones del héroe",
      lead: "Activa lenguaje interno mas limpio y deja que la mente respalde el cuerpo que estas construyendo.",
      kicker: "Voz interna",
      reward: "+15 XP por reforzar enfoque",
    },
    strengths: {
      title: "Fortalezas activas",
      lead: "Descubre que rasgo sostiene tu disciplina y usalo para que la constancia se sienta más natural.",
      kicker: "Afinidad del personaje",
      reward: "+60 XP por prueba completa",
    },
    insights: {
      title: "Pulso de la comunidad",
      lead: "Compara el estado del gremio, cruza tendencias y saca ideas para ajustar tu propia ruta mental.",
      kicker: "Bitácora compartida",
      reward: "Lectura viva del gremio",
    },
  };

  const activeTabMeta = TAB_COPY[tab] || TAB_COPY.mood;
  const recommendedMeta = TAB_COPY[recommendedTab] || TAB_COPY.mood;
  const sectionAsset = "/ui/header/section-mente.png";
  const sealAsset = "/missions/seals/seal-mind.png";
  const rewardAsset = "/logros/medals/medal-mind-keeper.png";
  const heroStageImage = "/missions/spotlight/spotlight-mind-banner.png";

  const heroPills = [
    { label:`Clase ${classTheme.label}`, color: classTheme.accent },
    { label:`Racha mental: ${streak || 0} días`, color: classTheme.secondary },
    { label: mindStageState, color: doneCount === 0 ? "#b6abc8" : "#7bdc3b" },
    { label: connectionDone ? "Vinculo del dia sellado" : "Vinculo social pendiente", color: connectionDone ? "#7bdc3b" : "#f3c969" },
  ];

  const heroKpis = [
    { label:"rituales hoy", value:`${doneCount}/${TODAY_ACTIVITIES.length}` },
    { label:"xp mental", value:`${xpToday}` },
    { label:"sesiones semana", value:`${weekSessions}` },
    { label:"foco actual", value:`${xpPct}%` },
  ];

  const routeNodes = [
    {
      title: "Entrada recomendada",
      text: recommendedMeta.title,
      asset: sectionAsset,
      action: () => setTab(recommendedTab),
    },
    {
      title: "Estado del dia",
      text: doneCount === 0 ? "Empieza con una lectura corta del animo." : `${doneCount} practicas ya despejadas hoy.`,
      asset: sealAsset,
      action: () => setTab("mood"),
    },
    {
      title: "Botin mental",
      text: progressPct >= 100 ? "La bitácora quedó sellada y el gremio ya la contó." : "Suma foco, calma y lectura útil antes del cierre.",
      asset: rewardAsset,
      action: () => setTab(doneCount < TODAY_ACTIVITIES.length ? recommendedTab : "insights"),
    },
  ];

  return (
    <>
      <style>{CSS}{MENTE_LANDING_CSS}</style>

      {xpPopups.map((popup) => (
        <XPPopup key={popup.id} amount={popup.amount} color={popup.color} onDone={() => removeXP(popup.id)} />
      ))}

      <div
        className="umind-page"
        style={{
          "--mind-accent": classTheme.accent,
          "--mind-secondary": classTheme.secondary,
          "--mind-soft": classTheme.soft,
        }}
      >
        <div className="umind-shell">
          <section className="umind-card umind-hero">
            <div style={{ display:"flex", flexDirection:"column", gap:18, minWidth:0 }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                <span className="umind-chip" style={{ "--chip-color": classTheme.accent }}>
                  <img src={sectionAsset} alt="" style={{ width:18, height:18, objectFit:"contain" }} />
                  Zona mente
                </span>
                <span className="umind-chip" style={{ "--chip-color": "#f3c969" }}>
                  <img src={sealAsset} alt="" style={{ width:18, height:18, objectFit:"contain" }} />
                  Santuario activo
                </span>
              </div>

              <div style={{ maxWidth:700 }}>
                <div style={{ font:"800 11px/1 'JetBrains Mono',monospace", letterSpacing:".14em", textTransform:"uppercase", color:classTheme.accent, marginBottom:12, textShadow:`0 0 12px ${classTheme.accent}99` }}>
                  Campo mental del héroe
                </div>
                <h1 style={{ font:"900 clamp(36px,5.2vw,80px)/.92 'Manrope',sans-serif", color:"#fff9ef", margin:0, maxWidth:"14ch" }}>
                  {menteCopy.title} <span style={{ color:classTheme.accent, textShadow:`0 0 34px ${classTheme.accent}77` }}>{menteCopy.span}</span>
                </h1>
                <p style={{ marginTop:16, font:"500 clamp(14px,1.2vw,18px)/1.7 'Manrope',sans-serif", color:"#cdbfe0", maxWidth:720 }}>
                  Esta zona junta ánimo, respiración, afirmaciones y lectura de fortalezas en una portada más limpia. Entras, registras como vienes, ajustas foco y sales con progreso que sí se siente útil.
                </p>
              </div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {heroPills.map((pill) => (
                  <span key={pill.label} className="umind-pill" style={{ borderColor:`${pill.color}44`, color:pill.color }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:pill.color, boxShadow:`0 0 12px ${pill.color}` }} />
                    {pill.label}
                  </span>
                ))}
              </div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                <button
                  type="button"
                  className="umind-soft-btn"
                  style={{ borderColor:`${classTheme.accent}55`, background:`linear-gradient(135deg, ${classTheme.soft}, rgba(255,255,255,.03))` }}
                  onClick={() => setTab(recommendedTab)}
                >
                  Abrir {recommendedMeta.title.toLowerCase()}
                </button>
                <button
                  type="button"
                  className="umind-soft-btn"
                  onClick={() => setTab("insights")}
                >
                  Ver pulso del gremio
                </button>
                <button
                  type="button"
                  className="umind-soft-btn"
                  style={connectionDone ? { opacity:.72, cursor:"default" } : { borderColor:`${classTheme.secondary}55`, background:`linear-gradient(135deg, ${classTheme.soft}, rgba(255,255,255,.03))` }}
                  onClick={handleConnection}
                  disabled={connectionSaving || connectionDone}
                >
                  {connectionDone ? "Vinculo sellado" : connectionSaving ? "Sellando vinculo..." : "Registrar conexion del dia"}
                </button>
              </div>

              <div className="umind-kpis">
                {heroKpis.map((item) => (
                  <div key={item.label} className="umind-kpi">
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:10, textShadow:"0 0 10px rgba(142,132,162,.8), 0 0 20px rgba(142,132,162,.3)" }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily:"'Manrope', sans-serif", fontSize:32, fontWeight:800, lineHeight:1, color:"#fff", textShadow:`0 0 20px ${classTheme.accent}cc, 0 0 40px ${classTheme.accent}55, 0 0 66px ${classTheme.accent}22` }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="umind-stage">
              <img src={heroStageImage} alt="" className="umind-stage-bg" />
              <div style={{ position:"absolute", inset:0, zIndex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"flex-start" }}>
                  <div style={{ padding:"12px 14px", borderRadius:18, background:"rgba(9, 8, 18, .55)", border:`1px solid ${classTheme.accent}33`, backdropFilter:"blur(10px)", maxWidth:260 }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, textTransform:"uppercase", letterSpacing:".12em", color:classTheme.accent, marginBottom:8, textShadow:`0 0 12px ${classTheme.accent}cc, 0 0 24px ${classTheme.accent}44` }}>
                      Estado del dia
                    </div>
                    <div style={{ fontFamily:"'Manrope', sans-serif", fontSize:30, fontWeight:800, lineHeight:1.02, color:"#fff", marginBottom:8, textShadow:`0 0 20px ${classTheme.accent}cc, 0 0 40px ${classTheme.accent}55, 0 0 66px ${classTheme.accent}22` }}>
                      {mindStageState}
                    </div>
                    <p style={{ margin:0, color:"#d4cada", fontSize:14, lineHeight:1.55 }}>
                      {doneCount === 0
                        ? "La entrada sigue libre. Un check-in corto basta para encender la lectura del dia."
                        : doneCount < TODAY_ACTIVITIES.length
                          ? "Tu bitácora ya se movió. Ahora conviene cerrar foco con una práctica guiada."
                          : "La jornada quedó cubierta. Te conviene leer insights y proteger ritmo para mañana."}
                    </p>
                  </div>

                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:58, height:58, borderRadius:18, background:"rgba(9, 8, 18, .6)", border:`1px solid ${classTheme.accent}44`, display:"grid", placeItems:"center", boxShadow:`0 0 28px ${classTheme.soft}` }}>
                      <img src={sectionAsset} alt="" style={{ width:30, height:30, objectFit:"contain" }} />
                    </div>
                    <div style={{ width:58, height:58, borderRadius:18, background:"rgba(9, 8, 18, .6)", border:`1px solid ${classTheme.accent}44`, display:"grid", placeItems:"center" }}>
                      <img src={classTheme.crest} alt="" style={{ width:34, height:34, objectFit:"contain" }} />
                    </div>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:14, alignItems:"end" }}>
                  <div style={{ padding:"14px 16px", borderRadius:20, background:"rgba(9, 8, 18, .58)", border:"1px solid rgba(255,255,255,.08)", backdropFilter:"blur(10px)" }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:8, textShadow:"0 0 10px rgba(142,132,162,.8), 0 0 20px rgba(142,132,162,.3)" }}>
                      Campana actual
                    </div>
                    <div style={{ fontFamily:"'Manrope', sans-serif", fontSize:24, fontWeight:800, lineHeight:1.05, color:"#fff", marginBottom:6, textShadow:`0 0 16px ${classTheme.accent}cc, 0 0 32px ${classTheme.accent}44` }}>
                      {recommendedMeta.title}
                    </div>
                    <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:"#d4cada" }}>
                      {recommendedMeta.lead}
                    </p>
                  </div>

                  <div style={{ width:120, padding:"12px 12px 10px", borderRadius:20, background:"rgba(9, 8, 18, .62)", border:`1px solid ${classTheme.accent}33`, textAlign:"center", backdropFilter:"blur(10px)" }}>
                    <img src={rewardAsset} alt="" style={{ width:64, height:64, objectFit:"contain", margin:"0 auto 8px", display:"block" }} />
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:4, textShadow:"0 0 10px rgba(142,132,162,.7), 0 0 20px rgba(142,132,162,.28)" }}>
                      sello mental
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.45, color:"#fff" }}>
                      Keeper listo para sumar calma y foco.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="umind-card umind-reco">
            <div style={{ minWidth:0, maxWidth:860 }}>
              <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, textTransform:"uppercase", letterSpacing:".14em", color:classTheme.accent, marginBottom:8, textShadow:`0 0 12px ${classTheme.accent}cc, 0 0 24px ${classTheme.accent}44` }}>
                Hoy el mapa recomienda
              </div>
              <h2 style={{ margin:0, fontFamily:"'Manrope', sans-serif", fontWeight:800, fontSize:"clamp(1.4rem, 2.6vw, 2.1rem)", lineHeight:1.05, textShadow:`0 0 22px ${classTheme.accent}55, 0 0 44px ${classTheme.accent}22` }}>
                Una ruta corta para que la mente acompane el entrenamiento.
              </h2>
              <p style={{ margin:"10px 0 0", color:"#cfc5de", fontSize:15, lineHeight:1.6, maxWidth:700 }}>
                Primero abres lectura emocional, luego bajas ruido con respiración o foco de clase, y terminas con un sello que deja memoria real en tu jornada.
              </p>
            </div>

            <div className="umind-route">
              {routeNodes.map((node) => (
                <button
                  key={node.title}
                  type="button"
                  className="umind-node"
                  onClick={node.action}
                  style={{ cursor:"pointer", textAlign:"left" }}
                >
                  <img src={node.asset} alt="" style={{ width:40, height:40, objectFit:"contain", flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:5, textShadow:"0 0 10px rgba(142,132,162,.7), 0 0 20px rgba(142,132,162,.28)" }}>
                      {node.title}
                    </div>
                    <div style={{ fontSize:14, lineHeight:1.45, color:"#fff" }}>{node.text}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="umind-layout">
            <div className="umind-main">
              <div className="umind-tabs">
                {TABS.map((tb) => {
                  const isActive = tab === tb.id;
                  const isDone =
                    tb.id === "mood" ? Boolean(todayDone?.mood || todayDone?.gratitude) :
                    tb.id === "breath" ? Boolean(todayDone?.breathing) :
                    tb.id === "perma" ? Boolean(todayDone?.perma) :
                    tb.id === "aff" ? Boolean(todayDone?.affirmation) :
                    tb.id === "strengths" ? Boolean(todayDone?.strengths) :
                    false;
                  const label = {
                    mood: "Animo",
                    breath: "Respiración",
                    perma: "PERMA",
                    aff: "Afirmaciones",
                    strengths: "Fortalezas",
                    insights: "Insights",
                  }[tb.id] || tb.id;

                  return (
                    <button
                      key={tb.id}
                      type="button"
                      className={`umind-tab${isActive ? " active" : ""}`}
                      onClick={() => setTab(tb.id)}
                    >
                      <span style={{ display:"inline-flex", alignItems:"center", color:isActive ? classTheme.accent : tb.color }}>
                        {TAB_ICONS[tb.id]?.(isActive ? classTheme.accent : tb.color, 15)}
                      </span>
                      <span>{label}</span>
                      {tb.badge && (
                        <span style={{ padding:"2px 7px", borderRadius:999, fontSize:10, color:"#fff", background:`${classTheme.accent}22`, border:`1px solid ${classTheme.accent}44` }}>
                          {tb.badge}
                        </span>
                      )}
                      {isDone && <span style={{ width:8, height:8, borderRadius:"50%", background:"#7bdc3b", boxShadow:"0 0 12px #7bdc3b" }} />}
                    </button>
                  );
                })}
              </div>

              <div className="umind-tab-panel">
                <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:14, alignItems:"flex-start", marginBottom:18 }}>
                  <div style={{ minWidth:0, maxWidth:760 }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, textTransform:"uppercase", letterSpacing:".13em", color:classTheme.accent, marginBottom:8, textShadow:`0 0 12px ${classTheme.accent}cc, 0 0 24px ${classTheme.accent}44` }}>
                      {activeTabMeta.kicker}
                    </div>
                    <h3 style={{ margin:0, fontFamily:"'Manrope', sans-serif", fontWeight:800, fontSize:"clamp(1.35rem, 2vw, 2rem)", lineHeight:1.06, textShadow:`0 0 22px ${classTheme.accent}55, 0 0 44px ${classTheme.accent}22` }}>
                      {activeTabMeta.title}
                    </h3>
                    <p style={{ margin:"10px 0 0", color:"#cfc5de", fontSize:15, lineHeight:1.65 }}>
                      {activeTabMeta.lead}
                    </p>
                  </div>

                  <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                    <span className="umind-pill" style={{ borderColor:`${classTheme.accent}44`, color:classTheme.accent }}>
                      <img src={classTheme.crest} alt="" style={{ width:18, height:18, objectFit:"contain" }} />
                      {classTheme.label}
                    </span>
                    <span className="umind-pill" style={{ borderColor:"rgba(243, 201, 105, .35)", color:"#f3c969" }}>
                      {activeTabMeta.reward}
                    </span>
                  </div>
                </div>

                <div className="umind-divider" style={{ marginBottom:18 }} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity:0, y:8 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:-6 }}
                    transition={{ duration:.2, ease:"easeOut" }}
                  >
                    {tab === "mood" && (
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        <MoodCheckin heroClass={heroClass} onXP={handleXP} todayDone={todayDone} storageScope={storageScope} moodStreak={summary?.moodStreak || summary?.moodStreakStored || 0} />
                        <GratitudeDiary onXP={handleXP} todayDone={todayDone} storageScope={storageScope} serverEntries={summary?.todayGratitudeEntries} />
                      </div>
                    )}

                    {tab === "breath" && (
                      <BreathingExercise
                        onXP={handleXP}
                        todayDone={todayDone}
                        heroClass={heroClass}
                        classTheme={classTheme}
                        breathingSessions={summary?.sessionCounts?.breathing || 0}
                      />
                    )}

                    {tab === "perma" && (
                      <PermaWheel
                        onXP={handleXP}
                        todayDone={todayDone}
                        storageScope={storageScope}
                        initialHistory={summary?.permaHistory || []}
                        permaSessions={summary?.sessionCounts?.perma || 0}
                        latestPermaAvg={summary?.latestPermaAvg ?? null}
                      />
                    )}

                    {tab === "aff" && (
                      <HeroAffirmations
                        heroClass={heroClass}
                        onXP={handleXP}
                        todayDone={todayDone}
                        classTheme={classTheme}
                        storageScope={storageScope}
                        affirmationSessions={summary?.sessionCounts?.affirmation || 0}
                      />
                    )}

                    {tab === "strengths" && (
                      <StrengthsTest
                        onXP={handleXP}
                        todayDone={todayDone}
                        storageScope={storageScope}
                        classTheme={classTheme}
                        initialStrengths={summary?.strengths || null}
                        strengthsSessions={summary?.sessionCounts?.strengths || 0}
                      />
                    )}

                    {tab === "insights" && (
                      <InsightsTab
                        summary={summary}
                        insights={insights}
                        community={community}
                        insightsLoading={insightsLoading}
                        communityLoading={communityLoading}
                        classTheme={classTheme}
                        heroClass={heroClass}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <aside className="umind-aside">
              <TodayProgress
                todayDone={todayDone}
                onTabClick={handleTabFromActivity}
                onConnectionClick={handleConnection}
                connectionSaving={connectionSaving}
              />

              <div className="umind-card" style={{ padding:18 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:14 }}>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, textTransform:"uppercase", letterSpacing:".13em", color:classTheme.accent, marginBottom:8, textShadow:`0 0 12px ${classTheme.accent}cc, 0 0 24px ${classTheme.accent}44` }}>
                      Botin del santuario
                    </div>
                    <div style={{ fontFamily:"'Manrope', sans-serif", fontSize:26, fontWeight:800, lineHeight:1.05, color:"#fff", marginBottom:8, textShadow:`0 0 20px ${classTheme.accent}cc, 0 0 40px ${classTheme.accent}55, 0 0 66px ${classTheme.accent}22` }}>
                      Recompensa mental viva
                    </div>
                    <p style={{ margin:0, color:"#cfc5de", fontSize:14, lineHeight:1.6 }}>
                      Tu bitácora de hoy deja foco acumulado, lectura útil y una memoria clara para volver mañana sin arrancar desde cero.
                    </p>
                  </div>
                  <img src={rewardAsset} alt="" style={{ width:72, height:72, objectFit:"contain", flexShrink:0 }} />
                </div>

                <div style={{ display:"grid", gap:10 }}>
                  <div className="umind-kpi" style={{ padding:"12px 14px" }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:8, textShadow:"0 0 10px rgba(142,132,162,.7), 0 0 20px rgba(142,132,162,.28)" }}>
                      Reserva mental
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:12, color:"#fff", fontSize:14 }}>
                      <span>XP mental</span>
                      <strong style={{ color:"#f3c969", textShadow:"0 0 14px rgba(243,201,105,.65), 0 0 28px rgba(243,201,105,.3)" }}>+{xpToday || 20}</strong>
                    </div>
                  </div>
                  <div className="umind-kpi" style={{ padding:"12px 14px" }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:8, textShadow:"0 0 10px rgba(142,132,162,.7), 0 0 20px rgba(142,132,162,.28)" }}>
                      Entrada guardada
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:12, color:"#fff", fontSize:14 }}>
                      <span>Notas y reflejos</span>
                      <strong style={{ color:classTheme.accent, textShadow:`0 0 14px ${classTheme.accent}cc, 0 0 28px ${classTheme.accent}44` }}>{reflectionCount}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <CommunityPanel community={community} loading={communityLoading} />

              <div className="umind-card" style={{ padding:18 }}>
                <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, textTransform:"uppercase", letterSpacing:".13em", color:classTheme.accent, marginBottom:10, textShadow:`0 0 12px ${classTheme.accent}cc, 0 0 24px ${classTheme.accent}44` }}>
                  Ritmo del gremio
                </div>
                <div style={{ display:"grid", gap:10 }}>
                  <div className="umind-kpi" style={{ padding:"12px 14px" }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:8, textShadow:"0 0 10px rgba(142,132,162,.7), 0 0 20px rgba(142,132,162,.28)" }}>
                      Heroes activos hoy
                    </div>
                    <div style={{ fontFamily:"'Manrope', sans-serif", fontSize:28, fontWeight:800, lineHeight:1, color:"#fff", textShadow:`0 0 20px ${classTheme.accent}cc, 0 0 40px ${classTheme.accent}55, 0 0 66px ${classTheme.accent}22` }}>
                      {communityActive}
                    </div>
                  </div>
                  <div className="umind-kpi" style={{ padding:"12px 14px" }}>
                    <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#8e84a2", marginBottom:8, textShadow:"0 0 10px rgba(142,132,162,.7), 0 0 20px rgba(142,132,162,.28)" }}>
                      Consejo rápido
                    </div>
                    <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:"#d7cfe5" }}>
                      {heroClass === "MAGO"
                        ? "Si ya entrenaste fuerte hoy, cierra con PERMA y respiración lenta para no perder claridad."
                        : heroClass === "ARQUERO"
                          ? "Te conviene abrir respiración o enfoque antes de una sesión intensa para que el pulso no mande solo."
                          : heroClass === "GUERRERO"
                            ? "Tu mejor retorno aqui suele venir de fortalezas y afirmaciones cortas antes de entrar a fuerza."
                            : "Usa una entrada de animo y una lectura breve para que la jornada no quede a ciegas."}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </>
  );
}

/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║               PNG ASSET LIST — UserMente.jsx                     ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  MOOD FACES (replace CSS clip-path pixel emoji faces)            ║
 * ║  /ui/face-tenso.png    — 52×52px angry face pixel art (red)      ║
 * ║  /ui/face-cansado.png  — 52×52px tired face pixel art (orange)   ║
 * ║  /ui/face-neutro.png   — 52×52px neutral face pixel art (yellow) ║
 * ║  /ui/face-bien.png     — 52×52px happy face pixel art (green)    ║
 * ║  /ui/face-energia.png  — 52×52px energized face w/ bolt (blue)   ║
 * ║  Large (96px) variants for feedback panel:                       ║
 * ║  /ui/face-bien-large.png — 96×96px happy face for feedback       ║
 * ║                                                                  ║
 * ║  REWARD CHEST                                                    ║
 * ║  /ui/chest-mente.png   — 110×90px purple mente chest pixel art   ║
 * ║    Wire: <img src="/ui/chest-mente.png" className="fvm-chest-img">║
 * ║                                                                  ║
 * ║  EQUIPMENT SLOTS (left column)                                   ║
 * ║  /ui/equip_weapon.png  — sword/weapon pixel art                  ║
 * ║  /ui/equip_helmet.png  — helmet pixel art                        ║
 * ║  /ui/equip_armor.png   — armor pixel art                         ║
 * ║  /ui/equip_belt.png    — belt pixel art                          ║
 * ║  /ui/equip_pants.png   — pants pixel art                         ║
 * ║  /ui/equip_boots.png   — boots pixel art                         ║
 * ║                                                                  ║
 * ║  CHART MINI FACES (bar chart top emoji)                          ║
 * ║  /ui/face-mini-smile.png  — 22×22px happy mini face              ║
 * ║  /ui/face-mini-flat.png   — 22×22px neutral mini face            ║
 * ║  /ui/face-mini-frown.png  — 22×22px sad mini face                ║
 * ║                                                                  ║
 * ║  NAV ICONS (replace CSS clip-path shapes in bottom nav)          ║
 * ║  /ui/nav-mente.png     — 19×19px brain pixel art (active, purple)║
 * ║  + same nav set as other pages (map/char/exercise/etc.)          ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║             PNG ASSETS — AffirmationsRPG Section                 ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  CLASS ART (right col hero panel — 220×130px pixel art)          ║
 * ║  /ui/class-guerrero.png — Warrior RPG pixel art (red/crimson)    ║
 * ║  /ui/class-arquero.png  — Archer RPG pixel art (green/forest)    ║
 * ║  /ui/class-mago.png     — Mage RPG pixel art (cyan/magic)        ║
 * ║    Wire: already wired as <img src={`/ui/class-${cls}.png`}/>    ║
 * ║                                                                  ║
 * ║  CLASS CREST ICONS (replace CSS clip-path icons in switcher)     ║
 * ║  /ui/cls-ico-guerrero.png — 24×24px sword icon (red glow)        ║
 * ║  /ui/cls-ico-arquero.png  — 24×24px bow icon (green glow)        ║
 * ║  /ui/cls-ico-mago.png     — 24×24px star/wand icon (cyan glow)   ║
 * ║                                                                  ║
 * ║  FLIP CARD FRAMES (replace CSS border/shadow on cards)           ║
 * ║  /ui/card-front-frame.png — 280×390px purple arcane border frame ║
 * ║  /ui/card-back-frame.png  — 280×390px gold ornate border frame   ║
 * ║    Wire: <img position:absolute inset:0 object-fit:fill zIndex:4>║
 * ║                                                                  ║
 * ║  CARD BACKGROUNDS                                                ║
 * ║  /ui/card-bg-question.png — 280×390px dark mystical bg art       ║
 * ║  /ui/card-bg-affirm.png   — 280×390px warm parchment/fire bg     ║
 * ║                                                                  ║
 * ║  INDICATOR DIAMOND NODES                                         ║
 * ║  /ui/ind-pending.png  — 34×34px dark diamond (empty)             ║
 * ║  /ui/ind-current.png  — 34×34px glowing diamond (active)         ║
 * ║  /ui/ind-done.png     — 34×34px green diamond + checkmark        ║
 * ║                                                                  ║
 * ║  COMPLETED PILL SHIELD                                           ║
 * ║  /ui/shield-gold.png  — 26×30px gold shield pixel art (★ crest)  ║
 * ║                                                                  ║
 * ║  SCIENCE NOTE SCROLL                                             ║
 * ║  /ui/scroll-note.png  — 26×24px parchment scroll pixel art       ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║               PNG ASSETS — PermaRPG Section                      ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  PILLAR ICONS (replace CSS letter squares in radar + sliders)    ║
 * ║  /ui/perma-p.png  — 28×28px pink  heart icon (Emociones P.)     ║
 * ║  /ui/perma-e.png  — 28×28px amber flame icon (Compromiso/Flujo) ║
 * ║  /ui/perma-r.png  — 28×28px cyan  hands icon (Relaciones)       ║
 * ║  /ui/perma-m.png  — 28×28px purple star icon (Significado)      ║
 * ║  /ui/perma-a.png  — 28×28px green trophy icon (Logros)          ║
 * ║    Wire: replace colored div with <img src="/ui/perma-{k}.png"/> ║
 * ║                                                                  ║
 * ║  RADAR BACKGROUND OVERLAY                                        ║
 * ║  /ui/perma-radar-bg.png — dark arcane pentagon texture (400×400) ║
 * ║    Wire: <image href="/ui/perma-radar-bg.png" x="0" y="0"       ║
 * ║           width="400" height="400" opacity=".18"/>               ║
 * ║           inside the <defs> section of the radar SVG             ║
 * ║                                                                  ║
 * ║  PILLAR FRAME (right column "SOBRE ESTE PILAR" display)          ║
 * ║  /ui/perma-pillar-frame.png — 260×90px ornate pixel frame       ║
 * ║    Wire: absolute overlay on the pillar detail header div        ║
 * ║                                                                  ║
 * ║  PERMA STREAK DECORATION                                         ║
 * ║  /ui/perma-streak-orb.png  — 48×48px glowing orb pixel art      ║
 * ║    Wire: replace fvm-streak-fire with <img ...> in left col      ║
 * ║                                                                  ║
 * ║  MICRO-MISSION ICON                                              ║
 * ║  /ui/perma-quest-ico.png — 24×24px quest scroll pixel art       ║
 * ║    Wire: beside "MICRO-MISIÓN SUGERIDA" label in right col       ║
 * ║                                                                  ║
 * ║  SLIDER THUMB (CSS custom)                                       ║
 * ║  /ui/perma-slider-thumb.png — 16×18px gem pixel art per pillar  ║
 * ║    Use separate PNG per color: perma-thumb-p/e/r/m/a.png        ║
 * ║    Wire: background-image on ::-webkit-slider-thumb via CSS var  ║
 * ║                                                                  ║
 * ║  SAVE BUTTON ICON                                                ║
 * ║  /ui/perma-save-ico.png — 18×18px floppy/seal pixel art (gold)  ║
 * ║    Wire: <img src="/ui/perma-save-ico.png"/> inside save button  ║
 * ║                                                                  ║
 * ║  TREND CHART DECORATIONS                                         ║
 * ║  /ui/perma-chart-today.png — 22×22px crown pixel art (gold)     ║
 * ║    Wire: <img> absolutely positioned at top of today's bar       ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
