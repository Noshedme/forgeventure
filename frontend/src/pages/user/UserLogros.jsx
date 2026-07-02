// src/pages/user/UserLogros.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { getLogrosCatalogo, claimLogro } from "../../services/api.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useLang } from "../../hooks/useLang.js";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import {
  Trophy, Check, Lock, Zap, Gift,
  X, Target, Search, ChevronDown,
  Award, Flame, TrendingUp, Users, Star, Brain, HelpCircle, Dumbbell,
} from "lucide-react";

const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);
const rpx = (s) => mono(s, 700);
const vt  = (s) => mono(s, 400);

// ── SC Admin palette ─────────────────────────────────────────────
const C = {
  bg: P.bg0,    side: P.bg1,  card: P.bg1,   panel: P.bg2,
  navy: P.navy, navyL: P.line,
  orange: P.accent, orangeL: P.accent2, gold: P.gold,
  blue: "#4CC9F0", teal: "#4A9D8F", green: "#6BC87A",
  red: "#E05C8A",  purple: P.accent,  pink: "#EC4899",
  white: P.text, muted: P.muted, mutedL: P.mutedL,
};
const CSS = `
  @keyframes ul-fadeIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ul-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ul-pulse     { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ul-modalIn   { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ul-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ul-xpPop     { 0%{opacity:0;transform:translate(-50%,-50%) scale(.5)} 40%{opacity:1;transform:translate(-50%,-80px) scale(1.3)} 100%{opacity:0;transform:translate(-50%,-160px) scale(1)} }
  @keyframes ul-badge     { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.2) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ul-reward    { 0%{opacity:0;transform:translateY(16px) scale(.93)} 60%{transform:translateY(-3px) scale(1.02)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes ul-glow      { 0%,100%{box-shadow:0 0 10px var(--gc),inset 0 0 10px var(--gc2)} 50%{box-shadow:0 0 28px var(--gc),0 0 48px var(--gc),inset 0 0 20px var(--gc2)} }
  @keyframes ul-shine     { 0%{left:-100%} 100%{left:200%} }
  @keyframes ul-star      { 0%,100%{transform:scale(1) rotate(0)} 50%{transform:scale(1.2) rotate(8deg)} }
  @keyframes ul-badge2    { 0%{opacity:0;transform:scale(0) rotate(-20deg)} 70%{transform:scale(1.18) rotate(5deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes ul-confetti  { 0%{transform:translateY(0) rotate(0) scale(1);opacity:1} 100%{transform:translateY(var(--ty,-140px)) translateX(var(--tx,0px)) rotate(720deg) scale(.4);opacity:0} }
  @keyframes ul-barFill   { from{width:0} to{width:var(--bw)} }
  @keyframes ul-ringBurst { 0%{transform:scale(.6);opacity:1} 100%{transform:scale(3.2);opacity:0} }
  @keyframes ul-shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes ul-lineScroll{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes ul-claimPulse{ 0%,100%{box-shadow:0 0 0 0 var(--lc,${C.gold})00} 60%{box-shadow:0 0 0 3px var(--lc,${C.gold})33} }
  @keyframes ul-ribbonIn  { from{transform:translateX(40px) rotate(35deg);opacity:0} to{transform:translateX(0) rotate(35deg);opacity:1} }
  @keyframes ul-epicGlow  { 0%,100%{filter:drop-shadow(0 0 6px ${C.gold}55)} 50%{filter:drop-shadow(0 0 18px ${C.gold})} }
  @keyframes ul-scoreUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ul-aurora1   { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.15)} 66%{transform:translate(-30px,30px) scale(.9)} }
  @keyframes ul-aurora2   { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-80px,50px) scale(1.1)} 70%{transform:translate(40px,-20px) scale(.95)} }
  @keyframes ul-aurora3   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,60px) scale(1.2)} }
  @keyframes ul-hudScan   { 0%{top:-2px;opacity:.8} 100%{top:100%;opacity:0} }
  @keyframes ul-levelUp   { 0%{opacity:0;transform:translate(-50%,-50%) scale(.4)} 25%{opacity:1;transform:translate(-50%,-50%) scale(1.18)} 55%{transform:translate(-50%,-50%) scale(.97)} 75%{opacity:1;transform:translate(-50%,-50%) scale(1.04)} 100%{opacity:0;transform:translate(-50%,-160px) scale(1)} }
  @keyframes ul-epicBorder{ 0%,100%{box-shadow:0 0 0 1px var(--ec,${C.gold})44,0 4px 20px rgba(0,0,0,.5)} 50%{box-shadow:0 0 0 2px var(--ec,${C.gold})99,0 0 28px var(--ec,${C.gold})22,0 4px 24px rgba(0,0,0,.5)} }
  @keyframes ul-badgeFloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes ul-honorScan { 0%{top:-2px;opacity:.6} 100%{top:100%;opacity:0} }

  .ul-skel {
    background:linear-gradient(90deg,${C.card} 25%,${C.panel} 50%,${C.card} 75%);
    background-size:600px 100%;
    animation:ul-shimmer 1.4s infinite linear;
    border-radius:12px;
  }
  .ul-btn   { transition:all .2s; cursor:pointer; }
  .ul-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ul-btn:disabled { opacity:.5; cursor:not-allowed; transform:none !important; }
  .ul-input { transition:border-color .2s; }
  .ul-input:focus { border-color:${C.orange} !important; outline:none; box-shadow:0 0 0 3px ${C.orange}20; }

  .ul-card-shine {
    position:absolute;top:0;left:-100%;width:50%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);
    pointer-events:none;
  }
  .ul-logro-card:hover .ul-card-shine { animation:ul-shine .7s ease; }
  .ul-logro-card { transition:border-color .25s,box-shadow .25s; border-radius:12px; overflow:hidden; }
  .ul-epic-card  { animation:ul-epicBorder 2.8s ease-in-out infinite; }
  .ul-honor-scroll::-webkit-scrollbar { height:4px; }
  .ul-honor-scroll::-webkit-scrollbar-track { background:transparent; }
  .ul-honor-scroll::-webkit-scrollbar-thumb { background:${C.green}44; border-radius:2px; }
`;

const V = {
  bg:P.bg0, p1:P.bg1, p2:P.bg2,
  bDark:P.line, bMid:P.line, bHi:P.line,
  gold:P.gold, goldL:P.gold,
  str:"#e0455e", sta:"#ffb13a", spd:"#8ac926", dis:"#c08aff", men:"#4cc9f0",
  xp1:P.navy, xp2:P.glow, xp3:P.accent,
  bronze:"#c87a3c", silver:"#c5cad6", epic:"#f4cc78", legend:"#d33bff", plat:"#6dd9f6",
};

const TIER_ACCENT = {
  Común:     { c:"#c87a3c", a:"rgba(200,122,60,.3)"   },
  Raro:      { c:"#c5cad6", a:"rgba(197,202,214,.3)"  },
  Épico:     { c:"#f4cc78", a:"rgba(244,204,120,.4)"  },
  Legendario:{ c:"#d33bff", a:"rgba(211,59,255,.4)"   },
};

const TIPO_ICO = {
  Ejercicio:"🏋", Racha:"🔥", Nivel:"⚡", Social:"👥", Especial:"★", Mente:"☯", Secreto:"?",
};

const FVL_CSS = `
/* ── FVL GOTHIC JRPG — Logros ── */
.fvl-bg{position:fixed;inset:0;z-index:-3;
  background:radial-gradient(ellipse 70% 50% at 50% 20%,rgba(120,40,180,.18),transparent 60%),
    radial-gradient(ellipse 80% 50% at 50% 110%,rgba(255,110,30,.10),transparent 55%),
    linear-gradient(180deg,#08060f 0%,#05040a 100%);}
.fvl-vignette{position:fixed;inset:0;z-index:-2;pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.85) 100%);}
.fvl-scanlines{position:fixed;inset:0;z-index:100;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);
  mix-blend-mode:overlay;opacity:.6;}
.fvl-p{background:linear-gradient(180deg,#161122 0%,#0b0814 100%);border:2px solid #2a1f3d;position:relative;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),0 0 0 3px #050308,0 0 0 4px #4a3a18,0 6px 24px rgba(0,0,0,.6);}
.fvl-studs::before,.fvl-studs::after{content:"";position:absolute;width:6px;height:6px;
  background:#c89b3c;box-shadow:0 0 0 1px #1a1208;z-index:2;}
.fvl-studs::before{top:4px;left:4px;}
.fvl-studs::after{top:4px;right:4px;}
.fvl-ph-head{display:flex;align-items:center;justify-content:center;gap:10px;
  color:#ffd166;font-family:'Press Start 2P',monospace;font-size:9px;letter-spacing:1px;
  padding:6px 0 10px;margin:-4px -4px 12px;
  text-shadow:0 0 8px rgba(244,204,120,.35);border-bottom:1px dashed rgba(200,155,60,.25);}
.fvl-ui{max-width:1520px;margin:0 auto;padding:20px;
  display:grid;grid-template-columns:280px 1fr 340px;grid-template-rows:auto 1fr auto;
  gap:14px;min-height:100vh;position:relative;z-index:1;}
.fvl-top{grid-column:1/4;grid-row:1;display:grid;grid-template-columns:280px 1fr auto;
  gap:14px;padding:0;border:0;box-shadow:none;background:transparent;}
.fvl-top::before,.fvl-top::after{display:none;}
.fvl-left{grid-column:1;grid-row:2;display:flex;flex-direction:column;gap:14px;}
.fvl-center{grid-column:2;grid-row:2;display:flex;flex-direction:column;gap:14px;min-width:0;}
.fvl-right{grid-column:3;grid-row:2;display:flex;flex-direction:column;}
.fvl-bottom{grid-column:1/4;grid-row:3;}

.fvl-avatar{width:64px;height:64px;flex-shrink:0;border:3px solid #c89b3c;position:relative;overflow:hidden;
  background:linear-gradient(135deg,rgba(157,78,221,.35),rgba(20,15,40,.9));
  box-shadow:inset 0 0 0 1px #000,0 0 14px rgba(157,78,221,.3);
  display:flex;align-items:center;justify-content:center;}
.fvl-avatar::before{content:"";position:absolute;width:4px;height:4px;background:#c89b3c;
  top:-3px;left:-3px;box-shadow:64px 0 0 #c89b3c,0 64px 0 #c89b3c,64px 64px 0 #c89b3c;}

.fvl-bar{height:10px;background:#050308;border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d,inset 0 1px 0 rgba(255,255,255,.04);overflow:hidden;position:relative;}
.fvl-bar .fvl-fill{height:100%;background:linear-gradient(180deg,#9d4edd,#5a189a);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -2px 0 rgba(0,0,0,.3);}
.fvl-bar.tall{height:14px;} .fvl-bar.sm{height:5px;}
.fvl-sbar{height:8px;background:#050308;border:1px solid #000;box-shadow:inset 0 0 0 1px #2a1f3d;overflow:hidden;}
.fvl-sfill{height:100%;box-shadow:inset 0 1px 0 rgba(255,255,255,.28);}
.fvl-sfill.str{background:linear-gradient(180deg,#ff6b80,#e0455e);}
.fvl-sfill.sta{background:linear-gradient(180deg,#ffcd6a,#ffb13a);}
.fvl-sfill.spd{background:linear-gradient(180deg,#b3e070,#8ac926);}
.fvl-sfill.dis{background:linear-gradient(180deg,#d8a8ff,#c08aff);}
.fvl-sfill.men{background:linear-gradient(180deg,#8addf5,#4cc9f0);}

/* Tier ledger */
.fvl-tier-row{display:grid;grid-template-columns:18px 1fr auto;align-items:center;
  gap:10px;padding:7px 0;border-bottom:1px dashed rgba(244,204,120,.1);
  font-family:'Press Start 2P',monospace;font-size:7px;letter-spacing:1px;}
.fvl-tier-row:last-of-type{border-bottom:0;}
.fvl-tier-glyph{width:16px;height:18px;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  box-shadow:0 0 6px var(--ftc,#c89b3c);background:var(--ftc,#c89b3c);}
.fvl-tier-lab{color:#ead7ad;}
.fvl-tier-v{font-family:'VT323',monospace;font-size:16px;color:var(--ftc,#c89b3c);letter-spacing:.5px;}
.fvl-tc-comun  {--ftc:#c87a3c;--fta:rgba(200,122,60,.3);}
.fvl-tc-raro   {--ftc:#c5cad6;--fta:rgba(197,202,214,.3);}
.fvl-tc-epico  {--ftc:#f4cc78;--fta:rgba(244,204,120,.4);}
.fvl-tc-legend {--ftc:#d33bff;--fta:rgba(211,59,255,.4);}

/* Filter tabs */
.fvl-filter-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  padding:10px 4px;background:#0a0712;border:2px solid #2a1f3d;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05);cursor:pointer;
  color:#9d8fa8;font-family:'Press Start 2P',monospace;font-size:6px;letter-spacing:1px;
  transition:.15s;text-align:center;}
.fvl-filter-tab:hover{color:#ffd166;border-color:#c89b3c;}
.fvl-filter-tab.fvl-tab-on{color:#ffd166;border-color:#c89b3c;
  background:linear-gradient(180deg,rgba(244,204,120,.08),rgba(244,204,120,.02));
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.2),0 0 10px rgba(244,204,120,.2);}
.fvl-tab-ico{font-size:14px;line-height:1;}

/* Achievement list rows */
.fvl-lr-row{display:grid;grid-template-columns:64px 1fr 68px 34px;
  gap:10px;align-items:center;padding:10px;background:#0a0712;
  border:2px solid #2a1f3d;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04),0 0 0 2px #050308;
  margin-bottom:7px;cursor:pointer;
  transition:transform .12s,border-color .12s,box-shadow .12s;}
.fvl-lr-row:hover{transform:translateX(2px);border-color:#4a3a18;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.14),0 0 0 2px #050308,0 0 14px rgba(244,204,120,.12);}
.fvl-lr-row.fvl-sel{border-color:#c89b3c;
  box-shadow:inset 0 0 0 1px #ffd166,0 0 0 2px #050308,0 0 18px rgba(200,155,60,.28);
  background:linear-gradient(180deg,rgba(244,204,120,.05),rgba(244,204,120,.01));}
@keyframes fvl-cpulse{50%{box-shadow:inset 0 0 0 1px #ffd166,0 0 0 2px #050308,0 0 22px rgba(200,155,60,.5);}}
.fvl-lr-row.fvl-claimable{border-color:#c89b3c;animation:fvl-cpulse 1.8s ease-in-out infinite;}
.fvl-lr-row.fvl-done{opacity:.82;background:linear-gradient(180deg,rgba(15,20,12,.95),rgba(8,12,8,.98));}
.fvl-lr-row.fvl-done .fvl-lr-title{color:#8ac926 !important;text-shadow:0 0 6px rgba(138,201,38,.3) !important;}

.fvl-lr-icon{width:64px;height:64px;flex-shrink:0;position:relative;overflow:hidden;
  border:2px solid var(--ftc,#c89b3c);
  background:radial-gradient(ellipse 80% 60% at 50% 60%,var(--fta,rgba(200,155,60,.25)),transparent 70%),
    linear-gradient(180deg,#0c0612 0%,#160a1a 100%);}
.fvl-lr-icon img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;}
.fvl-lr-icon-ph{position:absolute;inset:4px;border:1px dashed rgba(244,204,120,.3);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  font-family:'VT323',monospace;font-size:22px;color:var(--ftc,#c89b3c);}
.fvl-ico-dim{font-family:'VT323',monospace;font-size:9px;color:#5e5269;}
.fvl-lr-title{font-family:'Press Start 2P',monospace;font-size:6.5px;letter-spacing:.5px;
  color:var(--ftc,#ffd166);text-shadow:0 0 5px var(--fta,rgba(244,204,120,.2));
  margin-bottom:5px;line-height:1.6;}
.fvl-lr-desc{font-family:'VT323',monospace;font-size:14px;color:#ead7ad;
  letter-spacing:.4px;line-height:1.15;margin-bottom:6px;}
.fvl-lr-pg{display:flex;align-items:center;gap:6px;}
.fvl-lr-pg .fvl-bar{flex:1;}
.fvl-lr-pc{font-family:'VT323',monospace;font-size:12px;color:#9d8fa8;min-width:40px;text-align:right;}
.fvl-lr-rw{display:flex;flex-direction:column;gap:4px;align-items:center;}
.fvl-rw-l{font-family:'Press Start 2P',monospace;font-size:6px;color:#9d8fa8;}
.fvl-rw-v{font-family:'Press Start 2P',monospace;font-size:9px;color:#ffd166;text-shadow:0 0 5px rgba(244,204,120,.25);}
.fvl-claim-btn{font-family:'Press Start 2P',monospace;font-size:6px;padding:5px 6px;
  background:linear-gradient(180deg,#ad7818,#5a3a0a);color:#fff7cf;border:2px solid #ffd166;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),inset 0 -2px 0 rgba(0,0,0,.4);
  cursor:pointer;letter-spacing:.8px;}
.fvl-claim-btn:hover{background:linear-gradient(180deg,#c89b3c,#6e4a13);}
.fvl-check-ico{width:16px;height:16px;background:#8ac926;
  clip-path:polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%);
  box-shadow:0 0 6px rgba(138,201,38,.5);}
.fvl-sec-head{display:flex;align-items:center;gap:10px;
  font-family:'Press Start 2P',monospace;font-size:8px;letter-spacing:1.5px;
  margin-bottom:10px;padding:6px 0 4px;border-top:1px dashed rgba(200,155,60,.2);margin-top:10px;}
.fvl-sec-head:first-child{border-top:0;margin-top:0;}
.fvl-sec-count{margin-left:auto;font-family:'VT323',monospace;font-size:14px;color:#9d8fa8;letter-spacing:1px;}
.fvl-ms-panel{display:flex;flex-direction:column;overflow:auto;}

/* Detail panel */
.fvl-detail{padding:14px 16px;display:flex;flex-direction:column;flex:1;}
.fvl-d-art{aspect-ratio:1/.95;position:relative;overflow:hidden;margin-bottom:12px;
  border:2px solid var(--da,#c89b3c);
  background:radial-gradient(ellipse 70% 60% at 50% 60%,var(--dau,rgba(200,155,60,.25)),transparent 70%),
    linear-gradient(180deg,#0a0612 0%,#160a1a 100%);}
.fvl-d-slot{position:absolute;inset:10px;border:2px dashed rgba(244,204,120,.32);
  background:repeating-linear-gradient(45deg,rgba(244,204,120,.04) 0 8px,transparent 8px 16px),rgba(8,5,15,.4);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#c89b3c;text-align:center;}
.fvl-d-title{font-family:'Press Start 2P',monospace;font-size:9px;letter-spacing:1.5px;
  color:var(--da,#ffd166);text-shadow:0 0 8px var(--dau,rgba(244,204,120,.35));
  text-align:center;margin-bottom:8px;line-height:1.7;}
.fvl-d-lore{font-family:'VT323',monospace;font-size:15px;color:#ead7ad;text-align:center;
  font-style:italic;line-height:1.2;padding:6px 8px;
  border-top:1px dashed rgba(244,204,120,.18);border-bottom:1px dashed rgba(244,204,120,.18);margin-bottom:10px;}
.fvl-d-sec{font-family:'Press Start 2P',monospace;font-size:8px;color:var(--da,#ffd166);
  letter-spacing:1.5px;text-align:center;padding-bottom:6px;margin-bottom:6px;
  border-bottom:1px dashed rgba(244,204,120,.15);}
.fvl-d-obj{font-family:'VT323',monospace;font-size:15px;color:#ead7ad;text-align:center;line-height:1.2;margin-bottom:10px;}
.fvl-d-pr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.fvl-d-pr .fvl-bar{flex:1;height:12px;}
.fvl-d-pc{font-family:'VT323',monospace;font-size:14px;color:#ffd166;letter-spacing:1px;}
.fvl-d-rws{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.fvl-d-rw{padding:10px 8px;background:#0a0712;border:2px solid #2a1f3d;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06);text-align:center;display:flex;flex-direction:column;gap:5px;}
.fvl-d-rw .lab{font-family:'Press Start 2P',monospace;font-size:7px;color:#9d8fa8;letter-spacing:1.2px;}
.fvl-d-rw .val{font-family:'Press Start 2P',monospace;font-size:13px;color:#ffd166;
  letter-spacing:1.5px;text-shadow:0 0 6px rgba(244,204,120,.3);}
.fvl-d-rw .val.gem{color:#d33bff;}
.fvl-d-cta{margin-top:auto;font-family:'Press Start 2P',monospace;font-size:8px;
  padding:14px;background:linear-gradient(180deg,#4a2b5f,#1f0d2c);
  color:#f0d4ff;border:2px solid #7b2cbf;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.12),inset 0 -2px 0 rgba(0,0,0,.4),0 0 16px rgba(157,78,221,.3);
  cursor:pointer;letter-spacing:1.5px;width:100%;text-align:center;}
.fvl-d-cta:hover{background:linear-gradient(180deg,#6a3d80,#2f1a45);}
.fvl-d-cta.done{background:linear-gradient(180deg,#2d6f4c,#134a30);border-color:#8ac926;color:#b4f0c8;}
.fvl-d-cta.view{background:linear-gradient(180deg,#1a2a4a,#0d1828);border-color:#2a4a6f;color:#8ab4d4;cursor:pointer;}
.fvl-d-cta:disabled{opacity:.6;cursor:default;}

/* Bottom nav — 9 items */
.fvl-bottom{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;padding:8px;}
.fvl-nav-item{display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:10px 3px 8px;background:#0a0712;border:2px solid #2a1f3d;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05);cursor:pointer;position:relative;transition:.15s;}
.fvl-nav-item:hover{border-color:#c89b3c;transform:translateY(-2px);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.18),0 0 12px rgba(244,204,120,.15);}
.fvl-nav-item.fvl-nav-on{border-color:#c89b3c;
  box-shadow:inset 0 0 0 1px #ffd166,0 0 16px rgba(244,204,120,.3);
  background:linear-gradient(180deg,rgba(244,204,120,.06),rgba(244,204,120,.01));}
.fvl-nav-item.fvl-nav-on::after{content:"";position:absolute;top:-2px;left:50%;transform:translateX(-50%);
  width:30%;height:3px;background:#ffd166;box-shadow:0 0 10px #ffd166;}
.fvl-nav-label{font-family:'Press Start 2P',monospace;font-size:6.5px;letter-spacing:1px;color:#9d8fa8;}
.fvl-nav-item.fvl-nav-on .fvl-nav-label{color:#ffd166;}
.fvl-nav-badge{position:absolute;top:4px;right:4px;background:#d33b4d;color:#fff;
  font-family:'Press Start 2P',monospace;font-size:6px;padding:2px 4px;
  border:1px solid #1a0408;box-shadow:0 0 6px rgba(220,40,40,.5);}
`;

const px  = (s) => ({ fontFamily:"'Press Start 2P'", fontSize:s });

// ── L1: Aurora + Embers background ──────────────────────────────
function ULBackground({ color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); let raf;
    const W = cv.width = window.innerWidth; const H = cv.height = window.innerHeight;
    const particles = Array.from({ length: 34 }, () => ({
      x:Math.random()*W, y:Math.random()*H+H,
      vx:(Math.random()-.5)*.6, vy:-(Math.random()*.6+.3),
      r:Math.random()*1.8+.6, life:Math.random(), speed:Math.random()*.004+.002,
    }));
    const cols = [color+"bb", C.gold+"88", C.orange+"66"];
    const tick = () => {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => {
        p.life+=p.speed; if(p.life>=1){p.life=0;p.x=Math.random()*W;p.y=H+10;}
        const a=p.life<.2?p.life/.2:p.life>.8?1-(p.life-.8)/.2:1;
        ctx.beginPath(); ctx.arc(p.x,p.y+p.vy*p.life*900,p.r,0,Math.PI*2);
        ctx.fillStyle=cols[Math.floor(p.x/W*cols.length)];
        ctx.globalAlpha=a*.55; ctx.fill(); p.x+=p.vx;
      });
      ctx.globalAlpha=1; raf=requestAnimationFrame(tick);
    };
    tick(); return () => cancelAnimationFrame(raf);
  }, [color]);
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-10%",left:"-5%",width:"55%",height:"55%",borderRadius:"50%",background:`radial-gradient(circle,${color}12 0%,transparent 65%)`,filter:"blur(60px)",animation:"ul-aurora1 22s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-15%",right:"-10%",width:"60%",height:"60%",borderRadius:"50%",background:`radial-gradient(circle,${C.orange}0E 0%,transparent 65%)`,filter:"blur(70px)",animation:"ul-aurora2 28s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"40%",right:"20%",width:"35%",height:"35%",borderRadius:"50%",background:`radial-gradient(circle,${C.blue}08 0%,transparent 65%)`,filter:"blur(50px)",animation:"ul-aurora3 18s ease-in-out infinite"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.navyL}18 1px,transparent 1px),linear-gradient(90deg,${C.navyL}18 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:.35}}/>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",mixBlendMode:"screen"}}/>
    </div>
  );
}

// ── Class helpers ────────────────────────────────────────────────
const CLASS_ICONS        = { GUERRERO:"⚔️", ARQUERO:"🏹", MAGO:"🔮" };
const CLASS_LABEL_KEYS_LO = { GUERRERO:"mi.class.guerrero", ARQUERO:"mi.class.arquero", MAGO:"mi.class.mago" };

// ── Categorías / tipos ──────────────────────────────────────────
const TIPOS = {
  Ejercicio:{ color:C.orange,  Ico:Dumbbell,   descKey:"lo.tipo.ejercicio.desc", synergyKey:"lo.synergy.ejercicio", unitKey:"lo.unit.ejercicio" },
  Racha:    { color:C.red,     Ico:Flame,       descKey:"lo.tipo.racha.desc",     synergyKey:"lo.synergy.racha",     unitKey:"lo.unit.racha"     },
  Nivel:    { color:C.gold,    Ico:TrendingUp,  descKey:"lo.tipo.nivel.desc",     synergyKey:"lo.synergy.nivel",     unitKey:"lo.unit.nivel"     },
  Social:   { color:C.blue,    Ico:Users,       descKey:"lo.tipo.social.desc",    synergyKey:"lo.synergy.social",    unitKey:"lo.unit.social"    },
  Especial: { color:C.purple,  Ico:Star,        descKey:"lo.tipo.especial.desc",  synergyKey:"lo.synergy.especial",  unitKey:"lo.unit.especial"  },
  Mente:    { color:C.teal,    Ico:Brain,       descKey:"lo.tipo.mente.desc",     synergyKey:"lo.synergy.mente",     unitKey:"lo.unit.mente"     },
  Secreto:  { color:C.muted,   Ico:HelpCircle,  descKey:"lo.tipo.secreto.desc",   synergyKey:"lo.synergy.secreto",   unitKey:"lo.unit.secreto"   },
};

const LOGROS_STAGE_THEME = {
  GUERRERO: {
    image: "/missions/missions-hero-warrior.png",
    floor: "/exercises/hero/hero-floor-glow-warrior.png",
    label: "Salon de hierro",
    story: "Insignias de fuerza, constancia y cierre firme de objetivos reales.",
  },
  ARQUERO: {
    image: "/missions/missions-hero-archer.png",
    floor: "/exercises/hero/hero-floor-glow-archer.png",
    label: "Galeria del pulso",
    story: "Premios que suben con ritmo, cardio y precision sostenida.",
  },
  MAGO: {
    image: "/missions/missions-hero-mage.png",
    floor: "/exercises/hero/hero-floor-glow-mage.png",
    label: "Archivo del foco",
    story: "Sellos ligados a disciplina, control y dominio mental del avance.",
  },
  DEFAULT: {
    image: "/missions/missions-hero-default.png",
    floor: "/exercises/hero/hero-floor-glow-default.png",
    label: "Salon del gremio",
    story: "La vitrina del progreso mezcla esfuerzo, botin y constancia visible.",
  },
};

function normalizeLoose(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getRarezaVisual(value) {
  const key = normalizeLoose(value);
  if (key === "legendario" || key === "legendary") {
    return { key: "legendary", label: "Legendario", color: C.gold, tier: 4, asset: "/ui/rarity/rarity-legendary.png" };
  }
  if (key === "epico" || key === "epic") {
    return { key: "epic", label: "Epico", color: C.purple, tier: 3, asset: "/ui/rarity/rarity-epic.png" };
  }
  if (key === "raro" || key === "rare") {
    return { key: "rare", label: "Raro", color: C.blue, tier: 2, asset: "/ui/rarity/rarity-rare.png" };
  }
  return { key: "common", label: "Comun", color: C.orange, tier: 1, asset: "/ui/rarity/rarity-common.png" };
}

const LOGROS_LANDING_CSS = `
  .ulr-page {
    position: relative;
    min-height: 100vh;
    padding: clamp(14px, 2vw, 32px) clamp(14px, 2vw, 32px) 42px;
    color: ${C.white};
    overflow: hidden;
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--class-accent), transparent 86%), transparent 26%),
      radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--class-secondary), transparent 88%), transparent 24%),
      linear-gradient(180deg, #090512 0%, var(--class-bg) 48%, #090611 100%);
  }
  .ulr-shell {
    position: relative;
    z-index: 1;
    width: min(1680px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 12px;
  }
  .ulr-panel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: linear-gradient(180deg, rgba(20,10,34,.78), rgba(8,5,17,.86));
    box-shadow: 0 24px 68px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.05);
  }
  .ulr-kicker,
  .ulr-chip,
  .ulr-tab,
  .ulr-select,
  .ulr-status-chip,
  .ulr-detail-pill,
  .ulr-spotlight-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${C.white};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
  }
  .ulr-kicker {
    width: fit-content;
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 45%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .ulr-kicker img,
  .ulr-chip img,
  .ulr-stage-crest img,
  .ulr-rarity-pill img,
  .ulr-spotlight-chip img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .ulr-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr);
    gap: 14px;
    padding: 18px;
    align-items: start;
  }
  .ulr-hero-copy { display: grid; gap: 12px; align-content: start; }
  .ulr-hero-copy h1 {
    margin: 0;
    max-width: 10ch;
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(28px, 3.2vw, 48px);
    line-height: .95;
  }
  .ulr-hero-copy p,
  .ulr-stage-copy p,
  .ulr-band-copy p,
  .ulr-section-head p,
  .ulr-progress-card p,
  .ulr-detail-card p,
  .ulr-empty p,
  .ulr-spotlight-copy p {
    margin: 0;
    color: ${C.mutedL};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.55;
  }
  .ulr-chip-row,
  .ulr-stage-honors,
  .ulr-tab-row,
  .ulr-spotlight-chip-row,
  .ulr-rarity-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .ulr-chip.is-focus {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 45%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .ulr-hero-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .ulr-stat-card,
  .ulr-band-card,
  .ulr-progress-card,
  .ulr-detail-card {
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .ulr-stat-card small,
  .ulr-band-card small,
  .ulr-progress-card small,
  .ulr-detail-card small {
    display: block;
    color: ${C.muted};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .ulr-stat-card strong,
  .ulr-band-card strong,
  .ulr-progress-card strong,
  .ulr-detail-card strong {
    display: block;
    margin-top: 4px;
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(16px, 1.5vw, 22px);
  }
  .ulr-stage {
    position: relative;
    min-height: 260px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 28%, rgba(255,255,255,.08));
    background:
      linear-gradient(180deg, rgba(9,8,18,.14), rgba(9,8,18,.86)),
      var(--stage-image) center/cover no-repeat;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.04),
      inset 0 0 46px color-mix(in srgb, var(--class-accent) 12%, transparent),
      0 0 28px color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .ulr-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(9,8,18,.16), rgba(9,8,18,.76) 58%, rgba(9,8,18,.2)),
      linear-gradient(180deg, rgba(255,255,255,.02), rgba(9,8,18,.5)),
      var(--floor-image) bottom center/cover no-repeat;
    opacity: .95;
  }
  .ulr-stage::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 58%;
    background: linear-gradient(180deg, transparent, rgba(8,7,14,.92));
  }
  .ulr-stage-crest {
    position: absolute;
    top: 18px;
    right: 18px;
    width: clamp(74px, 8vw, 110px);
    height: clamp(74px, 8vw, 110px);
    display: grid;
    place-items: center;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--class-accent) 24%, transparent));
  }
  .ulr-stage-copy {
    position: absolute;
    left: 18px;
    top: 18px;
    width: min(56%, 320px);
    display: grid;
    gap: 10px;
    padding: 16px 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(16,13,28,.84), rgba(9,8,18,.54)),
      linear-gradient(135deg, color-mix(in srgb, var(--class-accent) 9%, transparent), transparent 56%);
    backdrop-filter: blur(10px);
  }
  .ulr-stage-copy strong {
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(15px, 1.4vw, 22px);
  }
  .ulr-stage-honors {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 18px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(16,13,28,.92), rgba(10,8,18,.94)),
      url("/ui/panel-texture.png");
    justify-content: space-between;
  }
  .ulr-stage-honors > div:first-child {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .ulr-stage-honors strong {
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: 13px;
  }
  .ulr-stage-honors small {
    color: ${C.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .ulr-badge-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .ulr-band {
    display: grid;
    grid-template-columns: 1.32fr .9fr .92fr;
    gap: 12px;
  }
  .ulr-band-copy {
    padding: 18px 18px 20px;
    display: grid;
    gap: 12px;
  }
  .ulr-progress {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255,255,255,.08);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
  }
  .ulr-progress > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 70%, white 8%));
    box-shadow: 0 0 16px color-mix(in srgb, var(--class-accent) 22%, transparent);
  }
  .ulr-rarity-row { gap: 8px; }
  .ulr-rarity-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
  }
  .ulr-honor-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .ulr-content {
    display: grid;
    grid-template-columns: minmax(0, 1.34fr) minmax(320px, .9fr);
    gap: 18px;
    align-items: start;
  }
  .ulr-board {
    padding: 18px;
    min-width: 0;
  }
  .ulr-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }
  .ulr-section-head h2,
  .ulr-spotlight-copy h2 {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(16px, 1.5vw, 22px);
  }
  .ulr-controls {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
  }
  .ulr-tab-row { overflow-x: auto; padding-bottom: 2px; }
  .ulr-tab {
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
  }
  .ulr-tab.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 50%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .ulr-tab:hover { transform: translateY(-2px); }
  .ulr-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(170px, .4fr));
    gap: 10px;
  }
  .ulr-search {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .ulr-search input,
  .ulr-select select {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${C.white};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
  }
  .ulr-select {
    min-height: 36px;
    justify-content: space-between;
    padding-inline: 12px;
  }
  .ulr-state,
  .ulr-group {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
  }
  .ulr-state {
    padding: 18px;
    display: grid;
    gap: 12px;
    justify-items: center;
    text-align: center;
  }
  .ulr-state strong {
    font-family: "Manrope", sans-serif;
    font-size: 20px;
  }
  .ulr-group {
    padding: 12px;
    margin-bottom: 12px;
  }
  .ulr-group-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    padding: 0 4px;
  }
  .ulr-group-head span:first-child {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--group-color, ${C.gold});
    box-shadow: 0 0 14px var(--group-color, ${C.gold});
  }
  .ulr-group-head strong {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .ulr-group-head small {
    margin-left: auto;
    color: ${C.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
  }
  .ulr-board .fvl-lr-row {
    grid-template-columns: 76px minmax(0, 1fr) 110px 40px;
    gap: 12px;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      linear-gradient(90deg, color-mix(in srgb, var(--row-accent, var(--class-accent)) 10%, transparent), transparent 42%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.03),
      0 14px 24px rgba(0,0,0,.2);
  }
  .ulr-board .fvl-lr-row:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--row-accent, var(--class-accent)) 35%, rgba(255,255,255,.08));
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.04),
      0 18px 28px rgba(0,0,0,.24),
      0 0 18px color-mix(in srgb, var(--row-accent, var(--class-accent)) 12%, transparent);
  }
  .ulr-board .fvl-lr-row.fvl-sel {
    border-color: color-mix(in srgb, var(--row-accent, var(--class-accent)) 54%, rgba(255,255,255,.08));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--row-accent, var(--class-accent)) 38%, transparent),
      0 0 24px color-mix(in srgb, var(--row-accent, var(--class-accent)) 14%, transparent);
  }
  .ulr-board .fvl-lr-row.fvl-claimable {
    animation: none;
    border-color: ${C.gold};
  }
  .ulr-board .fvl-lr-icon {
    width: 76px;
    height: 76px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--row-accent, var(--class-accent)) 48%, rgba(255,255,255,.08));
    background:
      radial-gradient(circle at center, color-mix(in srgb, var(--row-accent, var(--class-accent)) 16%, transparent), transparent 68%),
      linear-gradient(180deg, rgba(12,8,22,.98), rgba(14,10,24,.88));
  }
  .ulr-board .fvl-lr-icon img {
    object-fit: cover;
    image-rendering: auto;
  }
  .ulr-board .fvl-lr-title {
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    line-height: 1.25;
    color: ${C.white};
    text-shadow: none;
    margin-bottom: 6px;
  }
  .ulr-board .fvl-lr-desc {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.22;
    color: ${C.mutedL};
    margin-bottom: 8px;
  }
  .ulr-board .fvl-lr-pc,
  .ulr-board .fvl-rw-l {
    font-family: "Manrope", sans-serif;
    color: ${C.muted};
  }
  .ulr-board .fvl-rw-v {
    font-family: "Manrope", sans-serif;
    font-size: 14px;
  }
  .ulr-board .fvl-claim-btn {
    min-height: 34px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid ${C.gold};
    background: linear-gradient(135deg, ${C.gold}, ${C.orangeL});
    color: #140d05;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .02em;
    box-shadow: 0 10px 20px rgba(244,204,120,.16);
  }
  .ulr-board .fvl-claim-btn:hover { transform: translateY(-1px); }
  .ulr-spotlight {
    padding: 18px;
    display: grid;
    gap: 14px;
    position: sticky;
    top: 14px;
  }
  .ulr-spotlight-banner {
    position: relative;
    min-height: 240px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(9,8,18,.14), rgba(9,8,18,.88)),
      var(--spotlight-image) center/cover no-repeat;
  }
  .ulr-spotlight-banner::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(9,8,18,.72)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--spotlight-color) 16%, transparent), transparent 30%);
  }
  .ulr-spotlight-banner > * { position: relative; z-index: 1; }
  .ulr-spotlight-banner-inner {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px;
  }
  .ulr-spotlight-chip {
    font-size: 12px;
    font-weight: 800;
  }
  .ulr-spotlight-copy {
    max-width: 28ch;
    display: grid;
    gap: 8px;
  }
  .ulr-spotlight-copy h2 {
    font-size: clamp(15px, 1.4vw, 20px);
  }
  .ulr-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ulr-detail-card strong {
    font-size: 18px;
  }
  .ulr-action-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ulr-btn,
  .ulr-btn-ghost {
    min-height: 34px;
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 900;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
  }
  .ulr-btn {
    color: #090611;
    background: linear-gradient(135deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 70%, white 8%));
    box-shadow: 0 12px 24px color-mix(in srgb, var(--class-accent) 24%, transparent);
  }
  .ulr-btn-ghost {
    color: ${C.white};
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
  }
  .ulr-btn:hover:not(:disabled),
  .ulr-btn-ghost:hover:not(:disabled) { transform: translateY(-2px); }
  .ulr-btn:disabled,
  .ulr-btn-ghost:disabled { opacity: .6; cursor: not-allowed; }
  .ulr-empty {
    min-height: 180px;
    display: grid;
    place-items: center;
    gap: 10px;
    text-align: center;
  }
  .ulr-empty strong {
    font-family: "Manrope", sans-serif;
    font-size: 20px;
  }
  /* ── 1440px ── */
  @media (max-width: 1440px) {
    .ulr-hero { grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); }
    .ulr-content { grid-template-columns: minmax(0, 1.3fr) minmax(290px, .7fr); }
    .ulr-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  /* ── 1280px ── */
  @media (max-width: 1280px) {
    .ulr-hero { grid-template-columns: minmax(0, 1.4fr) minmax(250px, .6fr); }
    .ulr-content { grid-template-columns: minmax(0, 1.4fr) minmax(260px, .6fr); }
    .ulr-band { grid-template-columns: 1fr 1fr; }
  }
  /* ── 1220px: columna única ── */
  @media (max-width: 1220px) {
    .ulr-hero, .ulr-content { grid-template-columns: 1fr; align-items: start; }
    .ulr-band { grid-template-columns: 1fr 1fr; }
    .ulr-spotlight { position: relative; top: 0; }
    .ulr-stage { min-height: 220px; }
  }
  /* ── 1024px ── */
  @media (max-width: 1024px) {
    .ulr-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ulr-toolbar { grid-template-columns: 1fr 1fr; }
  }
  /* ── viewport corto (1366x768, 1280x720, 1128x634) ── */
  @media (max-height: 800px) and (min-width: 900px) {
    .ulr-page { padding: 10px 14px; }
    .ulr-hero { padding: 12px 14px; gap: 10px; }
    .ulr-hero-copy h1 { font-size: clamp(20px, 2.4vw, 34px); }
    .ulr-stage { min-height: 190px; }
    .ulr-stat-card { padding: 8px 12px; }
    .ulr-stat-card strong { font-size: clamp(14px, 1.2vw, 18px); }
    .ulr-board, .ulr-spotlight { padding: 12px; }
    .ulr-section-head { margin-bottom: 8px; }
    .ulr-shell { gap: 8px; }
  }
  /* ── 860px: móvil grande ── */
  @media (max-width: 860px) {
    .ulr-page { padding: 10px 10px 28px; }
    .ulr-hero { padding: 14px; }
    .ulr-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ulr-stage-copy { width: calc(100% - 28px); }
    .ulr-stage-honors { justify-content: flex-start; align-items: flex-start; }
    .ulr-band { grid-template-columns: 1fr; }
    .ulr-toolbar, .ulr-detail-grid { grid-template-columns: 1fr; }
    .ulr-board .fvl-lr-row { grid-template-columns: 60px minmax(0, 1fr); align-items: start; }
    .ulr-board .fvl-lr-rw, .ulr-board .fvl-lr-row > :last-child { grid-column: 2 / -1; justify-self: start; }
    .ulr-board .fvl-lr-rw { flex-direction: row; align-items: center; gap: 10px; }
    .ulr-stage { min-height: 200px; }
  }
  /* ── 560px: móvil pequeño ── */
  @media (max-width: 560px) {
    .ulr-hero-copy h1 { max-width: 12ch; font-size: clamp(22px, 7vw, 36px); }
    .ulr-hero-stats { grid-template-columns: 1fr; }
    .ulr-board .fvl-lr-icon { width: 54px; height: 54px; }
    .ulr-board .fvl-lr-title { font-size: 12px; }
    .ulr-board .fvl-lr-desc { font-size: 13px; }
    .ulr-action-row { flex-direction: column; }
    .ulr-stage { min-height: 180px; }
    .ulr-toolbar { grid-template-columns: 1fr; }
  }
`;

const RAREZA = {
  Común:     { color:C.mutedL, tier:1 },
  Raro:      { color:C.blue,   tier:2 },
  Épico:     { color:C.purple, tier:3 },
  Legendario:{ color:C.gold,   tier:4 },
};


// ══════════════════════════════════════════════════════════════
// BadgeCircle
// ══════════════════════════════════════════════════════════════
function BadgeCircle({ logro, size="md", isNew=false, onClick }) {
  const rm     = RAREZA[logro.rareza] || { color:C.muted, tier:1 };
  const c      = rm.color;
  const dim    = size==="xl"?110 : size==="lg"?72 : size==="md"?56 : 40;
  const emoSz  = size==="xl"?44  : size==="lg"?28 : size==="md"?22 : 16;
  const locked = !logro.obtenido && logro.secreto;
  const pending= !logro.obtenido && !logro.secreto;

  return (
    <div style={{position:"relative",width:dim,height:dim,flexShrink:0,cursor:onClick?"pointer":"default"}} onClick={onClick}>
      <div style={{
        position:"absolute",inset:0,borderRadius:"50%",
        border:`${size==="xl"?3:2}px solid ${c}${logro.obtenido?"88":"33"}`,
        background:`radial-gradient(circle at 35% 35%,${c}${logro.obtenido?"22":"08"} 0%,${c}08 60%,transparent 100%)`,
        boxShadow:logro.obtenido?`0 0 ${size==="xl"?22:12}px ${c}44,inset 0 0 ${size==="xl"?16:8}px ${c}18`:"none",
        animation:logro.obtenido&&rm.tier>=3?"ul-glow 3s ease-in-out infinite":"none",
        "--gc":`${c}44`,"--gc2":`${c}18`,
      }}/>
      <div style={{
        position:"absolute",inset:size==="xl"?5:3,borderRadius:"50%",
        background:`radial-gradient(circle,${C.card} 55%,${c}18 100%)`,
        border:`1px solid ${c}${logro.obtenido?"44":"22"}`,
      }}/>
      {logro.obtenido&&(
        <div style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",pointerEvents:"none"}}>
          <div style={{position:"absolute",top:0,left:"-60%",width:"40%",height:"100%",
            background:"linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)",
            animation:"ul-shine 3s ease 0s infinite"}}/>
        </div>
      )}
      <div style={{
        position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:emoSz,
        filter:locked?"blur(7px)":!logro.obtenido?`grayscale(1) opacity(.35)`:
          `drop-shadow(0 0 ${rm.tier>=3?10:6}px ${c}${rm.tier>=3?"aa":"66"})`,
        transition:"filter .3s",
      }}>
        {locked ? <Lock size={emoSz*.65} color={C.muted}/> : logro.imagen}
      </div>
      {logro.obtenido&&rm.tier>=2&&(
        <div style={{
          position:"absolute",bottom:size==="xl"?-10:size==="lg"?-8:-6,
          left:"50%",transform:"translateX(-50%)",
          display:"flex",gap:2,background:C.card,padding:"1px 4px",
          border:`1px solid ${c}44`,
        }}>
          {"★".repeat(rm.tier).split("").map((s,i)=>(
            <span key={i} style={{fontSize:size==="xl"?9:6,color:c,textShadow:`0 0 4px ${c}`,animation:`ul-star ${2+i*.3}s ease-in-out infinite`}}>{s}</span>
          ))}
        </div>
      )}
      {isNew&&<div style={{position:"absolute",top:-2,right:-2,width:14,height:14,background:C.orange,borderRadius:"50%",border:`2px solid ${C.bg}`,animation:"ul-badge2 .5s ease both",zIndex:2}}/>}
      {pending&&!locked&&(
        <div style={{position:"absolute",bottom:size==="xl"?-2:0,right:size==="xl"?-2:0,
          background:C.panel,borderRadius:"50%",width:size==="xl"?20:14,height:size==="xl"?20:14,
          border:`1px solid ${C.muted}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Lock size={size==="xl"?10:7} color={C.muted}/>
        </div>
      )}
    </div>
  );
}

// ── MiniBar ─────────────────────────────────────────────────────
function MiniBar({val,max,color,height=6}) {
  const pct = Math.min((val/max)*100,100);
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%",position:"relative",borderRadius:99}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,boxShadow:`0 0 6px ${color}66`,position:"relative",transition:"width .8s ease",borderRadius:99}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",animation:"ul-shine 2s ease .4s 1"}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Detalle de logro
// ══════════════════════════════════════════════════════════════
function DetalleModal({logro, onClose, onReclamar, claiming}) {
  const { t } = useLang();
  const rm    = RAREZA[logro.rareza]||{color:C.muted,tier:1};
  const tm    = TIPOS[logro.tipo]||{};
  const c     = rm.color;
  const pct   = Math.round((logro.progreso/logro.total)*100);
  const listo = logro.obtenido && !logro.reclamado;
  const isClaiming = claiming === logro.id;

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div
        initial={{opacity:0,scale:.93,y:14}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:.93,y:14}} transition={{duration:.25,ease:[.22,1,.36,1]}}
        style={{width:"100%",maxWidth:520,background:C.card,border:`2px solid ${c}44`,boxShadow:`0 0 60px ${c}22,0 24px 60px rgba(0,0,0,.7)`,overflow:"hidden",borderRadius:16}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},${C.gold}88,${c},transparent)`}}/>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <BadgeCircle logro={logro} size="lg" isNew={listo}/>
            <div>
              <div style={{...orb(14,900),color:logro.obtenido?C.white:C.muted,marginBottom:6}}>
                {logro.secreto&&!logro.obtenido?t("lo.dm.secret_name"):logro.nombre}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...raj(10,700),color:tm.color||C.muted,background:`${tm.color||C.muted}14`,border:`1px solid ${tm.color||C.muted}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4,borderRadius:4}}>
                  {tm.Ico && (() => { const IcD = tm.Ico; return <IcD size={10} color={tm.color||C.muted}/>; })()}
                  {logro.tipo}
                </span>
                <span style={{...raj(10,700),color:c,background:`${c}14`,border:`1px solid ${c}33`,padding:"2px 8px",textShadow:rm.tier>=3?`0 0 6px ${c}`:"none"}}>
                  {"★".repeat(rm.tier)} {logro.rareza}
                </span>
                {listo&&<span style={{...raj(9,700),color:C.gold,background:`${C.gold}14`,border:`1px solid ${C.gold}33`,padding:"2px 8px",animation:"ul-pulse 1.5s infinite"}}>{t("lo.dm.badge_ready")}</span>}
                {logro.reclamado&&<span style={{...raj(9,700),color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4}}><Check size={9}/> {t("lo.dm.badge_claimed")}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="ul-btn" style={{background:"transparent",border:`1px solid ${C.navyL}`,padding:7,color:C.muted,display:"flex",borderRadius:8}}><X size={15}/></button>
        </div>

        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[
              {l:t("lo.dm.xp_bonus"),  v:`+${logro.xpBonus}`, c:C.gold},
              {l:t("lo.dm.progress"),  v:`${logro.progreso}/${logro.total}`, c},
              {l:t("lo.dm.obtained"),  v:logro.obtenido?(logro.fechaObtencion||t("lo.dm.yes")):t("lo.dm.no"), c:logro.obtenido?C.green:C.muted},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"12px 10px",textAlign:"center",animation:`ul-scoreUp .3s ease ${i*.07}s both`,borderRadius:8}}>
                <div style={{...orb(13,900),color:s.c,marginBottom:3,fontSize:s.l==="OBTENIDO"&&s.v.length>6?"11px":undefined}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>

          {!logro.secreto&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{...raj(12,600),color:C.muted}}>{t("lo.dm.progress_label")}</span>
                <span style={{...raj(12,700),color:c}}>{pct}%</span>
              </div>
              <MiniBar val={logro.progreso} max={logro.total} color={logro.obtenido?C.green:c} height={10}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{...raj(10,500),color:C.muted}}>0</span>
                <span style={{...raj(10,700),color:c}}>{logro.progreso.toLocaleString()} / {logro.total.toLocaleString()}</span>
                <span style={{...raj(10,500),color:C.muted}}>{logro.total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"14px 16px",borderRadius:10}}>
            <div style={{...raj(9,700),color:C.muted,marginBottom:8,letterSpacing:".08em"}}>{t("lo.dm.desc_label")}</div>
            <p style={{...raj(13,400),color:logro.secreto&&!logro.obtenido?C.muted:C.white,lineHeight:1.7,filter:logro.secreto&&!logro.obtenido?"blur(5px)":undefined}}>
              {logro.descripcion}
            </p>
            {logro.secreto&&!logro.obtenido&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,...raj(12,600),color:C.muted}}>
                <Lock size={12}/> {t("lo.dm.secret_hint")}
              </div>
            )}
          </div>

          {!logro.obtenido&&!logro.secreto&&(
            <div style={{background:`${c}08`,border:`1px solid ${c}33`,padding:"14px 16px",borderRadius:10}}>
              <div style={{...raj(9,700),color:c,marginBottom:10,letterSpacing:".08em",display:"flex",alignItems:"center",gap:8}}>
                <Target size={11} color={c}/> {t("lo.dm.how_to")}
              </div>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{...raj(12,600),color:C.mutedL}}>{t("lo.dm.current_progress")}</span>
                  <span style={{...raj(13,700),color:c}}>{pct}%</span>
                </div>
                <div style={{height:12,background:C.panel,border:`1px solid ${c}22`,overflow:"hidden",position:"relative",borderRadius:99}}>
                  <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c}88,${c})`,boxShadow:`0 0 8px ${c}66`,transition:"width 1s ease",position:"relative"}}>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)",animation:"ul-shine 2s ease .5s 1"}}/>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{...raj(11,600),color:C.muted}}>{logro.progreso.toLocaleString()} {t("lo.dm.completed")}</span>
                  <span style={{...raj(11,700),color:c}}>{logro.total.toLocaleString()} {t("lo.dm.needed")}</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,...raj(12,500),color:C.white,lineHeight:1.6}}>
                <span style={{fontSize:16,flexShrink:0}}>🎯</span>
                <span>{logro.descripcion}</span>
              </div>
              {logro.total - logro.progreso > 0 && (
                <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,...raj(12,700),color:c,background:`${c}0A`,border:`1px solid ${c}22`,padding:"8px 12px",borderRadius:8}}>
                  <Zap size={12} color={c}/>
                  {t("lo.dm.faltan_pre")} <strong>{(logro.total - logro.progreso).toLocaleString()}</strong> {t("lo.dm.faltan_suf")}
                </div>
              )}
            </div>
          )}

          <div>
            <div style={{...raj(9,700),color:C.muted,marginBottom:10,letterSpacing:".08em",display:"flex",alignItems:"center",gap:6}}>
              <Gift size={11} color={C.muted}/> {t("lo.dm.rewards")}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {logro.recompensas.map((r,i)=>(
                <div key={i} style={{background:`${C.gold}0A`,border:`1px solid ${C.gold}33`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,animation:`ul-reward .3s ease ${i*.08}s both`,borderRadius:8}}>
                  <span style={{fontSize:18,filter:`drop-shadow(0 0 6px ${C.gold})`}}>{r.icon}</span>
                  <div>
                    <div style={{...raj(12,700),color:C.gold}}>{r.label}</div>
                    <div style={{...raj(11,500),color:C.muted}}>{r.valor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {listo?(
            <button onClick={()=>{ if(!logro.reclamado&&!isClaiming) onReclamar(logro); }}
              disabled={isClaiming} className="ul-btn"
              style={{width:"100%",...px(9),color:C.bg,background:isClaiming?C.navy:c,border:"none",padding:"16px",cursor:isClaiming?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:isClaiming?"none":`0 6px 28px ${c}55`,opacity:isClaiming?.6:1}}>
              {isClaiming
                ? <><div style={{width:12,height:12,border:`2px solid ${C.muted}`,borderTop:`2px solid ${C.white}`,borderRadius:"50%",animation:"ul-spin .7s linear infinite"}}/> {t("lo.dm.claiming")}</>
                : <><Gift size={14}/> {t("lo.dm.claim_btn")}</>}
            </button>
          ):logro.reclamado?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:`${C.green}0A`,border:`1px solid ${C.green}33`,padding:"14px",...raj(13,700),color:C.green,borderRadius:8}}>
              <Check size={15}/> {t("lo.dm.claimed_done")}
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:12,background:`${c}08`,border:`1px solid ${c}22`,padding:"14px 16px",borderRadius:8}}>
              <Zap size={16} color={c} style={{flexShrink:0}}/>
              <span style={{...raj(12,500),color:C.mutedL,lineHeight:1.6}}>
                {logro.secreto ? t("lo.dm.secret_pending") : `${t("lo.dm.auto_prog")} ${pct}%`}
              </span>
              <span style={{marginLeft:"auto",...orb(14,700),color:c,flexShrink:0}}>{pct}%</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODAL — Celebración al reclamar
// ══════════════════════════════════════════════════════════════
function ReclamarModal({logro, onClose}) {
  const { t } = useLang();
  const rm = RAREZA[logro.rareza]||{color:C.muted,tier:1};
  const c  = rm.color;
  const [phase, setPhase] = useState("burst");
  useEffect(()=>{
    const t1 = setTimeout(()=>setPhase("reveal"), 600);
    const t2 = setTimeout(()=>setPhase("done"),   1300);
    return ()=>{ clearTimeout(t1); clearTimeout(t2); };
  },[]);

  const shapes = ["◆","★","●","▲","◉","✦","■"];
  const colors = [C.gold, c, C.green, C.blue, C.purple, C.orange, C.orangeL];
  const confetti = Array.from({length:22},(_,i)=>({
    x: 4+(i*4.2)%92, ty:-(100+(i*23)%120), tx:(i%2===0?1:-1)*(10+(i*17)%50),
    delay:i*.06, color:colors[i%colors.length], size:7+(i*3)%10, shape:shapes[i%shapes.length],
  }));

  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.93)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflow:"hidden",animation:"ul-fadeIn .2s ease both"}}>
      {confetti.map((p,i)=>(
        <div key={i} style={{position:"fixed",top:"45%",left:`${p.x}%`,color:p.color,fontSize:p.size,pointerEvents:"none",
          animation:`ul-confetti ${1.3+(i%6)*.2}s ease ${p.delay}s both`,"--ty":`${p.ty}px`,"--tx":`${p.tx}px`,zIndex:401}}>
          {p.shape}
        </div>
      ))}

      <motion.div
        initial={{opacity:0,scale:.8,y:20}} animate={{opacity:1,scale:1,y:0}}
        transition={{duration:.35,ease:[.34,1.56,.64,1]}}
        style={{width:"100%",maxWidth:460,background:C.card,border:`2px solid ${c}66`,position:"relative",overflow:"hidden",boxShadow:`0 0 120px ${c}22,0 0 60px ${C.gold}11,0 24px 80px rgba(0,0,0,.85)`,borderRadius:16}}>
        <div style={{height:4,background:`linear-gradient(90deg,transparent,${c},${C.gold},${c},transparent)`}}/>

        <div style={{padding:"32px 28px 28px",textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:20,position:"relative"}}>
            {[0,1,2].map(ri=>(
              <div key={ri} style={{position:"absolute",top:"50%",left:"50%",width:110,height:110,transform:"translate(-50%,-50%)",borderRadius:"50%",border:`2px solid ${c}`,animation:`ul-ringBurst ${.8+ri*.25}s ease ${ri*.18}s both`,pointerEvents:"none"}}/>
            ))}
            <div style={{animation:phase==="burst"?"ul-badge .65s cubic-bezier(.34,1.56,.64,1) both":"ul-float 2.8s ease-in-out infinite",zIndex:1}}>
              <BadgeCircle logro={{...logro,obtenido:true}} size="xl"/>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"center",gap:5,marginBottom:10,animation:"ul-fadeIn .4s ease .2s both"}}>
            {"★".repeat(rm.tier).split("").map((s,i)=>(
              <span key={i} style={{fontSize:18,color:c,textShadow:`0 0 12px ${c},0 0 24px ${c}44`,animation:`ul-star ${1.4+i*.22}s ease-in-out ${i*.1}s infinite`}}>{s}</span>
            ))}
          </div>
          <div style={{...orb(20,900),color:C.white,marginBottom:6,animation:"ul-fadeIn .4s ease .25s both",textShadow:`0 0 16px ${c}66`}}>{t("lo.rec.unlocked")}</div>
          <div style={{...raj(15,700),color:c,marginBottom:4,animation:"ul-fadeIn .4s ease .32s both",textShadow:rm.tier>=3?`0 0 12px ${c}`:"none",letterSpacing:".04em"}}>{logro.nombre}</div>
          <div style={{...raj(12,500),color:C.muted,marginBottom:24,animation:"ul-fadeIn .4s ease .38s both",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {TIPOS[logro.tipo]?.Ico && (() => { const IcR = TIPOS[logro.tipo].Ico; return <IcR size={11} color={C.muted}/>; })()}
            {logro.tipo} · {"★".repeat(rm.tier)} {logro.rareza}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            {logro.recompensas.map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,background:r.tipo==="xp"?`${c}0C`:`${C.gold}0A`,border:`1px solid ${r.tipo==="xp"?c+"44":C.gold+"44"}`,padding:"14px 18px",position:"relative",overflow:"hidden",animation:`ul-reward .45s cubic-bezier(.34,1.4,.64,1) ${.45+i*.14}s both`,borderRadius:10}}>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent)",left:"-100%",animation:`ul-shine .9s ease ${.9+i*.15}s 1`}}/>
                <span style={{fontSize:26,filter:`drop-shadow(0 0 10px ${C.gold})`,position:"relative"}}>{r.icon}</span>
                <div style={{flex:1,textAlign:"left",position:"relative"}}>
                  <div style={{...raj(13,700),color:C.gold}}>{r.label}</div>
                  <div style={{...raj(13,600),color:C.white}}>{r.valor}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="ul-btn"
            style={{width:"100%",...px(9),color:C.bg,background:`linear-gradient(135deg,${c},${C.gold})`,border:"none",padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:`0 6px 32px ${c}77`,animation:"ul-fadeIn .4s ease .9s both"}}>
            <Trophy size={15}/> {t("lo.rec.ok")}
          </button>
        </div>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${c},${C.gold},${c},transparent)`}}/>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGRO CARD — V2: themed gradient, watermark, hover glow, epic border
// ══════════════════════════════════════════════════════════════
function LogroCard({ logro: l, isNew, claiming, onView, onClaim }) {
  const { t } = useLang();
  const [hov, setHov] = useState(false);
  const rm     = RAREZA[l.rareza] || { color:C.muted, tier:1 };
  const c      = rm.color;
  const tc     = TIPOS[l.tipo]?.color || C.muted;
  const listo  = l.obtenido && !l.reclamado;
  const isEpic = rm.tier >= 3;
  const isClaiming = claiming === l.id;
  const pct    = l.total > 0 ? Math.round((l.progreso / l.total) * 100) : 0;

  return (
    <motion.div
      className={`ul-logro-card${isEpic && l.obtenido ? " ul-epic-card" : ""}`}
      onHoverStart={() => l.obtenido && setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileHover={l.obtenido || !l.secreto ? { y:-6, scale:1.02 } : {}}
      whileTap={{ scale:.98 }}
      transition={{ type:"spring", stiffness:360, damping:20 }}
      onClick={() => onView(l)}
      style={{
        background: l.obtenido
          ? `linear-gradient(135deg,${c}0D 0%,${C.card} 58%)`
          : C.card,
        border: `1px solid ${l.reclamado ? `${C.green}33` : listo ? `${c}55` : l.obtenido ? `${c}33` : C.navy}`,
        position:"relative", overflow:"hidden", cursor:"pointer",
        borderRadius:12,
        opacity: !l.obtenido && !l.secreto ? 0.72 : 1,
        boxShadow: listo
          ? `0 8px 32px ${c}22, 0 2px 8px rgba(0,0,0,.5)`
          : l.obtenido ? `0 4px 20px ${c}11, 0 2px 8px rgba(0,0,0,.4)` : "0 2px 8px rgba(0,0,0,.3)",
        animation: listo && !isEpic ? "ul-claimPulse 2.4s ease-in-out infinite" : undefined,
        "--lc": c, "--ec": c,
      }}
    >
      <div className="ul-card-shine"/>

      {/* Tipo watermark — SVG in bg */}
      {!l.secreto && TIPOS[l.tipo]?.Ico && (
        <div style={{ position:"absolute", bottom:4, right:4, pointerEvents:"none", zIndex:0,
          opacity: l.obtenido ? .07 : .03 }}>
          {(() => { const IcoW = TIPOS[l.tipo].Ico; return <IcoW size={64} color={tc}/>; })()}
        </div>
      )}

      {/* Hover radial glow */}
      <div style={{ position:"absolute", inset:0,
        background:`radial-gradient(ellipse at 50% 0%,${c}18,transparent 60%)`,
        opacity: hov ? 1 : 0, transition:"opacity .28s ease", pointerEvents:"none", zIndex:0 }}/>

      {/* Top accent */}
      <div style={{ height:3, position:"relative", zIndex:1, background: l.reclamado
        ? C.green
        : listo ? `linear-gradient(90deg,transparent,${c},${C.gold}88,${c},transparent)`
        : l.obtenido ? `linear-gradient(90deg,${c}88,${c}33,transparent)` : `${C.navy}` }}/>

      {/* NUEVO ribbon diagonal */}
      {isNew && (
        <div style={{ position:"absolute", top:14, right:-22, transform:"rotate(35deg)",
          background:`linear-gradient(135deg,${C.orange},${C.gold})`, padding:"2px 36px",
          ...raj(7,800), color:"#0B0510", zIndex:5, boxShadow:`0 2px 8px ${C.orange}55`,
          animation:"ul-ribbonIn .35s ease both" }}>
          NUEVO
        </div>
      )}

      {/* Shine sweep for listo */}
      {listo && !l.reclamado && (
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:2 }}>
          <div style={{ position:"absolute", top:0, left:"-60%", width:"35%", height:"100%",
            background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)",
            animation:"ul-shine 3.5s ease-in-out infinite" }}/>
        </div>
      )}

      <div style={{ padding:"16px 14px 14px", display:"flex", flexDirection:"column", alignItems:"center",
        textAlign:"center", position:"relative", zIndex:1 }}>

        {/* Badge */}
        <div style={{ marginBottom:10, marginTop:isNew?16:4 }}>
          <BadgeCircle logro={l} size="md" isNew={listo}/>
        </div>

        {/* Name */}
        <div style={{ ...raj(12,700), color:l.obtenido?C.white:C.mutedL, marginBottom:5,
          lineHeight:1.3, minHeight:32, display:"flex", alignItems:"center", justifyContent:"center",
          textShadow: isEpic && l.obtenido ? `0 0 8px ${c}44` : "none" }}>
          {l.secreto && !l.obtenido ? "??? ???" : l.nombre}
        </div>

        {/* Type + rareza chips */}
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:8, flexWrap:"wrap" }}>
          <span style={{ ...raj(8,700), color:tc, background:`${tc}14`,
            border:`1px solid ${tc}33`, padding:"1px 6px",
            borderRadius:4, display:"inline-flex", alignItems:"center", gap:3 }}>
            {TIPOS[l.tipo]?.Ico && (() => { const IcoC = TIPOS[l.tipo].Ico; return <IcoC size={8} color={tc}/>; })()}
            {l.tipo}
          </span>
          <span style={{ ...raj(8,700), color:c, background:`${c}14`, border:`1px solid ${c}33`,
            padding:"1px 6px", borderRadius:4, textShadow:rm.tier>=3?`0 0 6px ${c}`:"none",
            animation: isEpic && l.obtenido ? "ul-epicGlow 2.5s ease-in-out infinite" : "none" }}>
            {"★".repeat(rm.tier)} {rm.tier >= 3 ? l.rareza : ""}
          </span>
        </div>

        {/* State */}
        {l.reclamado ? (
          <div style={{ ...raj(9,700), color:C.green, background:`${C.green}14`,
            border:`1px solid ${C.green}33`, padding:"3px 10px", marginBottom:8,
            display:"flex", alignItems:"center", gap:4, borderRadius:4 }}>
            <Check size={9}/> {t("lo.card.claimed")}
          </div>
        ) : listo ? (
          <button
            onClick={e => { e.stopPropagation(); onClaim(l); }}
            disabled={isClaiming}
            style={{ ...raj(10,700), color:C.bg,
              background: isClaiming ? C.navyL : `linear-gradient(135deg,${c},${C.gold})`,
              border:"none", padding:"6px 14px", marginBottom:8,
              cursor:isClaiming?"not-allowed":"pointer",
              display:"flex", alignItems:"center", gap:5,
              borderRadius:6,
              boxShadow: isClaiming ? "none" : `0 4px 14px ${c}55`,
              opacity: isClaiming ? .6 : 1 }}>
            {isClaiming
              ? <div style={{ width:10, height:10, border:`2px solid ${C.muted}`, borderTop:`2px solid ${C.white}`, borderRadius:"50%", animation:"ul-spin .8s linear infinite" }}/>
              : <><Gift size={9}/> {t("lo.card.claim")}</>}
          </button>
        ) : l.obtenido ? (
          <div style={{ ...raj(9,600), color:C.mutedL, marginBottom:8 }}>{t("lo.card.obtained")}</div>
        ) : l.secreto ? (
          <div style={{ ...raj(9,600), color:C.muted, display:"flex", alignItems:"center", gap:3, marginBottom:8 }}>
            <Lock size={9}/> {t("lo.card.secret")}
          </div>
        ) : (
          <div style={{ width:"100%", marginBottom:8 }}>
            <MiniBar val={l.progreso} max={l.total} color={c} height={4}/>
            <div style={{ ...raj(9,600), color:C.muted, marginTop:3 }}>{l.progreso}/{l.total} · {pct}%</div>
            {l.total > 0 && l.progreso < l.total && (
              <div style={{ ...raj(9,700), color:c, marginTop:4, opacity:.9 }}>
                {t("lo.card.faltan_pre")} {l.total - l.progreso} {t(TIPOS[l.tipo]?.unitKey||"")}
              </div>
            )}
            <div style={{ ...raj(8,500), color:C.mutedL, marginTop:3, fontStyle:"italic" }}>
              {pct < 25  ? t("lo.card.motiv.start")
              :pct < 50  ? t("lo.card.motiv.25")
              :pct < 75  ? t("lo.card.motiv.50")
              :pct < 90  ? t("lo.card.motiv.75")
              :             t("lo.card.motiv.90")}
            </div>
          </div>
        )}

        {/* XP — V2: more prominent */}
        <div style={{ ...orb(15,900), color:C.gold,
          textShadow: listo ? `0 0 10px ${C.gold}66` : "none",
          marginTop: l.reclamado ? 2 : 0 }}>
          +{l.xpBonus} XP
        </div>
        {l.recompensas.length > 1 && (
          <div style={{ display:"flex", gap:4, marginTop:4, justifyContent:"center" }}>
            {l.recompensas.slice(1).map((r,ri) => (
              <span key={ri} style={{ fontSize:13, filter:`drop-shadow(0 0 4px ${c}55)` }}>{r.icon}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// CATEGORY SECTION — V4: glassmorphism header, 32px ring, body indicator
// ══════════════════════════════════════════════════════════════
function CategorySection({ tipo, logros, isOpen, onToggle, onView, onClaim, newSet, claiming }) {
  const { t } = useLang();
  const tm       = TIPOS[tipo] || { color:C.muted, icon:"🏆" };
  const c        = tm.color;
  const earned   = logros.filter(l => l.obtenido).length;
  const listos   = logros.filter(l => l.obtenido && !l.reclamado).length;
  const legendarios = logros.filter(l => l.rareza === "Legendario" && l.obtenido).length;
  const R = 13; // ring radius
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - earned / Math.max(1, logros.length));

  return (
    <div style={{ marginBottom:6, position:"relative" }}>
      {/* V4: left-border body indicator when open */}
      {isOpen && (
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4,
          background:`linear-gradient(180deg,${c},${c}44)`, zIndex:2, pointerEvents:"none" }}/>
      )}

      {/* Accordion header */}
      <motion.div
        whileTap={{ scale:.995 }}
        onClick={onToggle}
        style={{
          display:"flex", alignItems:"center", gap:14,
          padding:"14px 20px", cursor:"pointer",
          background: isOpen
            ? `linear-gradient(90deg,${c}18 0%,${C.card} 55%)`
            : `linear-gradient(90deg,${c}0C,${C.card} 60%)`,
          backdropFilter: isOpen ? "blur(8px)" : "none",
          border:`1px solid ${isOpen ? c+"44" : C.navy}`,
          borderRadius: isOpen ? "12px 12px 0 0" : 12,
          borderLeft:`3px solid ${c}`,
          boxShadow: isOpen ? `0 4px 20px rgba(0,0,0,.25)` : "0 2px 8px rgba(0,0,0,.2)",
          position:"relative", overflow:"hidden",
          userSelect:"none", transition:"border-radius .28s ease,background .28s ease,box-shadow .28s ease",
        }}
      >
        <div style={{ position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(45deg,${c}04 0px,${c}04 1px,transparent 1px,transparent 20px)`, pointerEvents:"none" }}/>

        <div style={{ width:38, height:38, borderRadius:10, background:`${c}18`,
          border:`1px solid ${c}33`, display:"flex", alignItems:"center",
          justifyContent:"center", flexShrink:0,
          boxShadow: isOpen ? `0 0 12px ${c}44` : "none",
          transition:"box-shadow .28s" }}>
          {tm.Ico && <tm.Ico size={18} color={c}/>}
        </div>

        <div style={{ flex:1 }}>
          <div style={{ ...orb(12,700), color:isOpen?C.white:C.white, marginBottom:2 }}>{tipo.toUpperCase()}</div>
          <div style={{ ...raj(11,500), color:C.mutedL }}>{t(tm.descKey||"")}</div>
          {tm.synergyKey && (
            <div style={{ ...raj(9,500), color:C.muted, marginTop:3, opacity:.8 }}>
              {t(tm.synergyKey)}
            </div>
          )}
        </div>

        {/* Stats badges */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {listos > 0 && (
            <span style={{ ...raj(9,800), color:C.bg, background:`linear-gradient(135deg,${c},${C.gold})`,
              padding:"3px 9px", borderRadius:20, boxShadow:`0 2px 8px ${c}44`,
              animation:"ul-pulse 1.5s ease-in-out infinite",
              display:"inline-flex", alignItems:"center", gap:4 }}>
              <Zap size={9} color={C.bg}/> {listos}
            </span>
          )}
          {legendarios > 0 && (
            <span style={{ ...raj(9,700), color:C.gold, background:`${C.gold}14`, border:`1px solid ${C.gold}33`,
              padding:"3px 8px", borderRadius:20, animation:"ul-epicGlow 2.5s ease-in-out infinite" }}>
              ★ {legendarios}
            </span>
          )}
          <span style={{ ...raj(10,600), color:isOpen?c:C.muted }}>
            {earned}/{logros.length}
          </span>
          {/* V4: 32px progress ring */}
          <div style={{ width:32, height:32, position:"relative", flexShrink:0 }}>
            <svg width="32" height="32" style={{ transform:"rotate(-90deg)" }}>
              <circle cx="16" cy="16" r={R} fill="none" stroke={`${c}22`} strokeWidth="3"/>
              <circle cx="16" cy="16" r={R} fill="none" stroke={c} strokeWidth="3"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition:"stroke-dashoffset .7s ease" }}/>
            </svg>
            {/* pct label inside ring */}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
              justifyContent:"center", ...raj(7,700), color:c }}>
              {Math.round(earned/Math.max(1,logros.length)*100)}
            </div>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration:.25 }}>
            <ChevronDown size={18} color={isOpen?c:C.muted}/>
          </motion.div>
        </div>
      </motion.div>

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:.32, ease:[.4,0,.2,1] }}
            style={{ overflow:"hidden" }}
          >
            <div style={{ padding:"12px 8px 14px 12px",
              background:`linear-gradient(180deg,${c}06 0%,${C.card} 100%)`,
              border:`1px solid ${c}22`,
              borderTop:"none",
              borderRadius:"0 0 12px 12px",
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(196px,1fr))",
              gap:10 }}>
              {logros.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity:0, y:14, scale:.97 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  transition={{ duration:.3, delay:i*.045, ease:[.22,1,.36,1] }}>
                  <LogroCard
                    logro={l}
                    isNew={newSet.has(l.id)}
                    claiming={claiming}
                    onView={onView}
                    onClaim={onClaim}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// LrRow — gothic achievement list row
// ══════════════════════════════════════════════════════════════
function LrRow({ logro, isSelected, onClick, onClaim, claiming }) {
  const rm = RAREZA[logro.rareza] || { color:C.muted, tier:1 };
  const ta = TIER_ACCENT[logro.rareza] || TIER_ACCENT.Común;
  const pct = Math.round((logro.progreso / Math.max(1, logro.total)) * 100);
  const isClaimable = logro.obtenido && !logro.reclamado;
  const isDone = logro.reclamado;
  const isClaiming = claiming === logro.id;
  const isLocked = !logro.obtenido && logro.secreto;
  const [imgErr, setImgErr] = useState(false);
  const tierKey = logro.rareza === "Común" ? "comun"
    : logro.rareza === "Raro"       ? "raro"
    : logro.rareza === "Épico"      ? "epico"
    : "legend";

  return (
    <div className={`fvl-lr-row fvl-tc-${tierKey}${isSelected?" fvl-sel":""}${isClaimable?" fvl-claimable":""}${isDone?" fvl-done":""}`}
      onClick={onClick}>
      <div className="fvl-lr-icon">
        {!imgErr && <img src={`/logros/${logro.id}-icon.png`} alt=""
          onError={() => setImgErr(true)}/>}
        <div className="fvl-lr-icon-ph">
          <span style={{filter:isLocked?"blur(5px)":undefined}}>{isLocked ? "?" : logro.imagen}</span>
          <span className="fvl-ico-dim">64×64</span>
        </div>
      </div>
      <div style={{minWidth:0}}>
        <div className="fvl-lr-title" style={{filter:isLocked?"blur(4px)":undefined}}>
          {isLocked ? "??? ???" : logro.nombre}
        </div>
        <div className="fvl-lr-desc" style={{filter:isLocked?"blur(4px)":undefined}}>
          {isLocked ? "Logro secreto. Sigue entrenando." : logro.descripcion}
        </div>
        {!isDone && !isLocked && (
          <div className="fvl-lr-pg">
            <div className="fvl-bar sm"><div className="fvl-fill" style={{width:`${pct}%`,background:ta.c}}/></div>
            <span className="fvl-lr-pc">{logro.progreso}/{logro.total}</span>
          </div>
        )}
      </div>
      <div className="fvl-lr-rw">
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,color:ta.c,textAlign:"center",marginBottom:3}}>
          {"★".repeat(rm.tier)}
        </div>
        <div className="fvl-rw-v">+{logro.xpBonus}</div>
        <div className="fvl-rw-l">XP</div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        {isClaimable ? (
          <button className="fvl-claim-btn" onClick={e=>{e.stopPropagation();onClaim(logro);}} disabled={isClaiming}>
            {isClaiming ? "…" : "★"}
          </button>
        ) : isDone ? <div className="fvl-check-ico"/> : null}
      </div>
    </div>
  );
}

export default function UserLogros({profile, onNavigate}) {
  const { t } = useLang();
  const scCard = (accent, r=14) => ({ background:C.card, border:`1px solid ${C.navy}`, borderTop:`2px solid ${accent}`, borderRadius:r, boxShadow:"0 4px 24px rgba(0,0,0,0.35)" });
  const isMobile = useIsMobile();
  const [logros,       setLogros]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterRar,    setFilterRar]    = useState(() => localStorage.getItem("ul-filter-rar") || "all");
  const [filterEst,    setFilterEst]    = useState(() => localStorage.getItem("ul-filter-est") || "all");
  const [detalleLogro, setDetalleLogro] = useState(null);
  const [reclamarLog,  setReclamarLog]  = useState(null);
  const [xpNotif,      setXpNotif]      = useState(null);
  const [newLogroToast,setNewLogroToast]= useState(null);
  const [claiming,     setClaiming]     = useState(null);
  const [newLogrosSet, setNewLogrosSet] = useState(new Set());
  const [openCats,     setOpenCats]     = useState(["Ejercicio","Racha","Nivel"]);
  const [levelUpPop,   setLevelUpPop]   = useState(null);
  const [selectedLogro,setSelectedLogro]= useState(null);
  const [filterTipo,   setFilterTipo]   = useState("Todos");
  const prevLogrosRef  = useRef([]);
  const pollRef        = useRef(null);

  const classKey = String(profile?.heroClass || "DEFAULT").toUpperCase();
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const stageTheme = LOGROS_STAGE_THEME[classKey] || LOGROS_STAGE_THEME.DEFAULT;
  const myColor = classTheme.accent || C.orange;

  const loadLogros = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) { setLogros([]); return; }
      const token = await user.getIdToken();
      const res   = await getLogrosCatalogo(token);
      if (res?.ok && res.logros?.length > 0) {
        const nuevos = res.logros;
        const prev   = prevLogrosRef.current;
        const recienGanados = nuevos.filter(l =>
          l.obtenido && !l.reclamado && !prev.find(p => p.id === l.id && p.obtenido)
        );
        if (recienGanados.length > 0) {
          setNewLogroToast(recienGanados[0]);
          const newIds = recienGanados.map(l => l.id);
          setNewLogrosSet(prev => new Set([...prev, ...newIds]));
          setTimeout(() => setNewLogroToast(null), 4500);
          // L6: auto-clear each "new" dot after 5 minutes so the set never grows indefinitely
          newIds.forEach(id => setTimeout(() => {
            setNewLogrosSet(prev => { const s = new Set(prev); s.delete(id); return s; });
          }, 5 * 60 * 1000));
          // Auto-expand the category of the new achievement
          const newTipo = recienGanados[0].tipo;
          setOpenCats(prev => prev.includes(newTipo) ? prev : [...prev, newTipo]);
        }
        prevLogrosRef.current = nuevos;
        setLogros(nuevos);
      } else if (res?.ok) {
        setLogros([]);
      } else {
        setError("No se pudieron cargar los logros.");
      }
    } catch (err) {
      console.error("Error cargando logros:", err);
      setError("Error de red al cargar logros. Revisa tu conexión.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) loadLogros();
      else { setLogros([]); setLoading(false); }
    });
    return () => unsub();
  }, [loadLogros]);

  useEffect(() => {
    const handler = () => loadLogros(true);
    window.addEventListener("exerciseCompleted", handler);
    return () => window.removeEventListener("exerciseCompleted", handler);
  }, [loadLogros]);

  // L4: persist filters across navigations
  useEffect(() => { localStorage.setItem("ul-filter-rar", filterRar); }, [filterRar]);
  useEffect(() => { localStorage.setItem("ul-filter-est", filterEst); }, [filterEst]);

  // L5: pause 45s poll when tab is hidden, re-fetch + restart when visible again
  useEffect(() => {
    const startPoll = () => {
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadLogros(true), 45000);
    };
    const onVisChange = () => {
      if (document.hidden) {
        clearInterval(pollRef.current);
      } else {
        loadLogros(true);
        startPoll();
      }
    };
    startPoll();
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [loadLogros]);

  // Auto-select first claimable logro for right panel
  useEffect(() => {
    if (logros.length > 0 && !selectedLogro) {
      setSelectedLogro(
        logros.find(l => l.obtenido && !l.reclamado) ||
        logros.find(l => l.obtenido) ||
        logros[0]
      );
    }
  }, [logros.length]);
  useEffect(() => {
    if (selectedLogro) {
      const updated = logros.find(l => l.id === selectedLogro.id);
      if (updated) setSelectedLogro(updated);
    }
  }, [logros]);

  const handleReclamar = async (logro) => {
    if (logro.reclamado || claiming === logro.id) return;
    setClaiming(logro.id);
    setDetalleLogro(null);
    // L2: snapshot prev state for full rollback on any error
    const prevLogros = logros;
    setLogros(prev => prev.map(l => l.id === logro.id ? {...l, reclamado:true} : l));
    setNewLogrosSet(prev => { const s = new Set(prev); s.delete(logro.id); return s; });
    try {
      const user  = auth.currentUser;
      if (!user) { setLogros(prevLogros); return; }
      const token = await user.getIdToken();
      const res   = await claimLogro(token, logro.id);
      if (res?.ok) {
        if (!res.alreadyClaimed) {
          setReclamarLog(logro);
          // L3: prefer server-granted XP, fall back to logro.xpBonus for the pop
          const xpToShow = res.xpGranted ?? res.xpGanado ?? logro.xpBonus;
          if (xpToShow > 0 && canShowXpPopups()) {
            setXpNotif(xpToShow);
            setTimeout(() => setXpNotif(null), 3000);
          }
          // Dispatch with real XP value so Dashboard updates correctly
          window.dispatchEvent(new CustomEvent("exerciseCompleted", {
            detail: {
              xp: xpToShow,
              newLevel: res.newLevel,
              xpNext:   res.xpNext,
              leveledUp: res.leveledUp ?? (res.newLevel > (logro._prevLevel || 0)),
            },
          }));
          // C4: show level-up celebration pop if the user leveled up
          if (res.leveledUp || (res.newLevel && res.newLevel > (profile?.level || 0))) {
            setLevelUpPop(res.newLevel);
            setTimeout(() => setLevelUpPop(null), 3500);
          }
        }
      } else {
        // Server returned non-ok: full rollback
        setLogros(prevLogros);
        setError("No se pudo reclamar el logro. Intenta de nuevo.");
        setTimeout(() => setError(null), 3500);
      }
    } catch (err) {
      console.error("Error al reclamar logro:", err);
      // L2: always rollback on any catch
      setLogros(prevLogros);
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("no desbloqueado") || msg.includes("not unlocked")) {
        setError("Este logro aún no está desbloqueado.");
      } else {
        setError("Error al reclamar el logro. Intenta de nuevo.");
      }
      setTimeout(() => setError(null), 3500);
    } finally {
      setClaiming(null);
    }
  };

  const toggleCat = (tipo) => setOpenCats(prev =>
    prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
  );

  // Filter
  const filtered = logros.filter(l => {
    if (search && !l.nombre.toLowerCase().includes(search.toLowerCase()) && !l.descripcion?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRar !== "all" && l.rareza !== filterRar) return false;
    if (filterEst === "obtenido" && !l.obtenido) return false;
    if (filterEst === "progreso" && (l.obtenido || l.secreto)) return false;
    if (filterEst === "secreto" && !l.secreto) return false;
    if (filterEst === "listos" && !(l.obtenido && !l.reclamado)) return false;
    return true;
  });

  // Group by tipo
  const grouped = Object.keys(TIPOS).map(tipo => ({
    tipo,
    logros: filtered.filter(l => l.tipo === tipo)
      .sort((a,b) => {
        const pri = l => (l.obtenido&&!l.reclamado)?0 : l.reclamado?1 : l.obtenido?2 : l.secreto?4:3;
        const d = pri(a)-pri(b);
        return d !== 0 ? d : (RAREZA[b.rareza]?.tier||0)-(RAREZA[a.rareza]?.tier||0);
      }),
  })).filter(g => g.logros.length > 0);

  // Stats
  const obtenidos   = logros.filter(l=>l.obtenido).length;
  const listos      = logros.filter(l=>l.obtenido&&!l.reclamado).length;
  const reclamados  = logros.filter(l=>l.reclamado).length;
  const xpTotal     = logros.filter(l=>l.reclamado).reduce((s,l)=>s+l.xpBonus,0);
  const xpDisp      = logros.filter(l=>l.obtenido&&!l.reclamado).reduce((s,l)=>s+l.xpBonus,0);
  const totalLogros = logros.filter(l=>!l.secreto||l.obtenido).length;
  const pctColec    = totalLogros > 0 ? Math.round((obtenidos/totalLogros)*100) : 0;

  const filterActive = search || filterRar !== "all" || filterEst !== "all";
  const isAllOpen    = filterActive; // auto-expand all when filtering

  // C1: contextual header message
  const ctxMsg = (() => {
    if (loading) return t("lo.ctx.loading");
    if (newLogroToast) return `${t("lo.toast.unlocked")} ${newLogroToast.nombre}`;
    if (listos > 0) return `${t("lo.ctx.listos_pre")} ${listos} ${listos>1?t("lo.ctx.listos_n"):t("lo.ctx.listos_1")} ${t("lo.ctx.listos_suf")}`;
    if (pctColec >= 90) return `${t("lo.ctx.colec_90_pre")} ${pctColec}%${t("lo.ctx.colec_90_suf")}`;
    if (pctColec >= 70) return `${t("lo.ctx.colec_70_pre")} ${pctColec}%${t("lo.ctx.colec_70_suf")}`;
    if (reclamados > 0) return `${reclamados} ${reclamados>1?t("lo.ctx.claimed_n"):t("lo.ctx.claimed_1")} ${t("lo.ctx.claimed_suf")}`;
    return t("lo.ctx.default");
  })();
  // XP-to-level pct for the strip
  const xpLevelPct = profile?.xpNext > 0
    ? Math.min(100, Math.round((xpDisp / Math.max(1, profile.xpNext - (profile.xp || profile.xpActual || 0))) * 100))
    : 0;


  // Detail panel accent
  const dAccent = TIER_ACCENT[selectedLogro?.rareza] || TIER_ACCENT.Común;
  const dPct    = selectedLogro ? Math.round((selectedLogro.progreso / Math.max(1, selectedLogro.total)) * 100) : 0;

  // Filtered list for tipo tab
  const listForTipo = filtered.filter(l => filterTipo === "Todos" || l.tipo === filterTipo);
  const groupedForTipo = Object.keys(TIPOS)
    .filter(tipo => filterTipo === "Todos" || tipo === filterTipo)
    .map(tipo => ({ tipo, items: listForTipo.filter(l => l.tipo === tipo) }))
    .filter(g => g.items.length > 0);

  const claimableLogros = logros.filter((l) => l.obtenido && !l.reclamado);
  const honorShowcase = [...logros.filter((l) => l.reclamado)]
    .sort((a, b) => getRarezaVisual(b.rareza).tier - getRarezaVisual(a.rareza).tier)
    .slice(0, 6);
  const spotlightLogro = selectedLogro || claimableLogros[0] || logros[0] || null;
  const spotlightRareza = getRarezaVisual(spotlightLogro?.rareza);
  const spotlightType = TIPOS[spotlightLogro?.tipo] || TIPOS.Especial;
  const SpotlightTypeIcon = spotlightType.Ico || Award;
  const spotlightProgress = spotlightLogro
    ? Math.round((Number(spotlightLogro.progreso || 0) / Math.max(1, Number(spotlightLogro.total || 1))) * 100)
    : 0;
  const spotlightStatus = spotlightLogro?.reclamado
    ? { label: "Archivado", color: C.green, text: "La insignia ya quedo guardada en tu vitrina." }
    : spotlightLogro?.obtenido
      ? { label: "Lista para reclamar", color: C.gold, text: "Ya cumpliste el objetivo y solo falta cobrar el botin." }
      : spotlightLogro?.secreto
        ? { label: "Sello oculto", color: C.muted, text: "Sigue entrenando para revelar esta pieza del tablero." }
        : { label: "En progreso", color: classTheme.accent, text: "Aun falta empujar esta meta para cerrar la insignia." };
  const raritySummary = [
    { label: "Comun", key: "common" },
    { label: "Raro", key: "rare" },
    { label: "Epico", key: "epic" },
    { label: "Legendario", key: "legendary" },
  ].map((entry) => {
    const count = logros.filter((l) => getRarezaVisual(l.rareza).key === entry.key && l.obtenido).length;
    const total = logros.filter((l) => getRarezaVisual(l.rareza).key === entry.key).length;
    const meta = getRarezaVisual(entry.label);
    return { ...entry, count, total, meta };
  });
  const boardVisibleCount = listForTipo.length;
  const spotlightRewardAlt = spotlightLogro?.recompensas?.find((reward) => {
    const raw = normalizeLoose(reward?.tipo || reward?.icon || reward?.nombre || "");
    return raw && raw !== "xp";
  });

  return (
    <>
      <style>{CSS + FVL_CSS}</style>

      {/* Modals */}
      <AnimatePresence>
        {detalleLogro && (
          <DetalleModal logro={detalleLogro} onClose={()=>setDetalleLogro(null)} onReclamar={handleReclamar} claiming={claiming}/>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reclamarLog && (
          <ReclamarModal logro={reclamarLog} onClose={()=>setReclamarLog(null)}/>
        )}
      </AnimatePresence>

      {/* XP Pop */}
      {xpNotif && (
        <div style={{position:"fixed",top:"50%",left:"50%",zIndex:500,pointerEvents:"none",
          fontFamily:"'Manrope',sans-serif",fontSize:34,fontWeight:900,color:V.gold,
          textShadow:`0 0 40px ${V.gold},0 0 80px ${V.gold}44`,
          animation:"ul-xpPop 2.6s ease forwards",whiteSpace:"nowrap"}}>
          +{xpNotif} XP ⚡
        </div>
      )}

      {/* Level-up pop */}
      {levelUpPop && (
        <div style={{position:"fixed",top:"50%",left:"50%",zIndex:501,pointerEvents:"none",
          textAlign:"center",animation:"ul-levelUp 3.2s ease forwards"}}>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:10,color:V.gold,
            textShadow:`0 0 30px ${V.gold},0 0 60px ${V.gold}66`,whiteSpace:"nowrap",lineHeight:1.3}}>
            ¡NIVEL SUBIDO!
          </div>
          <div style={{fontFamily:"'Manrope',sans-serif",fontSize:40,fontWeight:900,color:"#fff",
            textShadow:`0 0 22px ${V.xp3},0 0 40px ${V.xp3}66`,marginTop:6}}>
            {levelUpPop}
          </div>
        </div>
      )}

      {/* New logro toast */}
      <AnimatePresence>
        {newLogroToast && (()=>{
          const rm = RAREZA[newLogroToast.rareza]||{color:V.gold,tier:2};
          const tc = rm.color;
          return (
            <motion.div
              initial={{x:140,opacity:0}} animate={{x:0,opacity:1}} exit={{x:140,opacity:0}}
              transition={{type:"spring",stiffness:320,damping:28}}
              style={{position:"fixed",bottom:30,right:24,zIndex:600,maxWidth:320}}>
              <div style={{background:"#161122",border:`2px solid ${tc}77`,
                boxShadow:`0 0 32px ${tc}44,0 8px 32px rgba(0,0,0,.75)`,
                padding:"14px 18px",display:"flex",alignItems:"center",gap:14,overflow:"hidden"}}>
                <div style={{animation:"ul-badge .6s ease both",flexShrink:0}}>
                  <BadgeCircle logro={{...newLogroToast,obtenido:true}} size="md" isNew/>
                </div>
                <div>
                  <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,color:V.gold,marginBottom:4}}>
                    ¡LOGRO DESBLOQUEADO!
                  </div>
                  <div style={{fontFamily:"'Manrope',sans-serif",fontSize:11,fontWeight:900,color:"#fff",marginBottom:3}}>
                    {newLogroToast.nombre}
                  </div>
                  <div style={{fontFamily:"'VT323',monospace",fontSize:14,color:tc}}>
                    {"★".repeat(rm.tier)} {newLogroToast.rareza}
                    {newLogroToast.xpBonus>0&&<span style={{color:V.gold,marginLeft:6}}>+{newLogroToast.xpBonus} XP</span>}
                  </div>
                </div>
              </div>
              <div style={{height:3,background:`linear-gradient(90deg,${tc},transparent)`,animation:"ul-barFill 4.5s linear both","--bw":"100%"}}/>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Gothic atmosphere ── */}
      <img src="/ui/logros-bg.png" alt="" onError={e=>e.currentTarget.style.display="none"}
        style={{position:"fixed",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:-4,pointerEvents:"none"}}/>
      <div className="fvl-bg"/>
      <div className="fvl-vignette"/>
      <div className="fvl-scanlines"/>

      {/* ── Main gothic grid ── */}
      <div className="fvl-ui">

        {/* TOP: brand / title / currencies */}
        <header className="fvl-top">
          <div className="fvl-p fvl-studs" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px"}}>
            <img src="/ui/logo-sm.png" alt="" style={{width:36,height:36,imageRendering:"pixelated"}}
              onError={e=>e.currentTarget.style.display="none"}/>
            <div>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:V.gold,letterSpacing:1}}>FORGEVENTURE</div>
              <div style={{fontFamily:"'VT323',monospace",fontSize:13,color:"#9d8fa8",letterSpacing:2}}>ACHIEVEMENT LOG</div>
            </div>
          </div>
          <div className="fvl-p fvl-studs" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 18px"}}>
            <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:12,color:V.gold,letterSpacing:3,
              textShadow:"0 0 16px rgba(200,155,60,.5)"}}>🏆 LOGROS 🏆</div>
            <div style={{fontFamily:"'VT323',monospace",fontSize:14,color:"#9d8fa8",letterSpacing:2,marginTop:4}}>
              COMPLETA DESAFÍOS Y DEMUESTRA TU DISCIPLINA
            </div>
          </div>
          <div className="fvl-p fvl-studs" style={{display:"flex",alignItems:"center",gap:16,padding:"10px 16px"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:V.gold}}>{obtenidos}/{totalLogros}</div>
              <div style={{fontFamily:"'VT323',monospace",fontSize:12,color:"#9d8fa8",letterSpacing:1}}>LOGROS</div>
            </div>
            <div style={{width:1,height:28,background:"#2a1f3d"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:listos>0?V.gold:"#9d8fa8"}}>{listos}</div>
              <div style={{fontFamily:"'VT323',monospace",fontSize:12,color:"#9d8fa8",letterSpacing:1}}>LISTOS</div>
            </div>
            <div style={{width:1,height:28,background:"#2a1f3d"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:V.spd}}>{pctColec}%</div>
              <div style={{fontFamily:"'VT323',monospace",fontSize:12,color:"#9d8fa8",letterSpacing:1}}>COLECCIÓN</div>
            </div>
          </div>
        </header>

        {/* LEFT: profile + stats + tier ledger */}
        <aside className="fvl-left">

          {/* Profile card */}
          <div className="fvl-p fvl-studs" style={{padding:"14px 16px"}}>
            <div className="fvl-ph-head">AVENTURERO</div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
              <div className="fvl-avatar">
                <img src={`/perfil/avatar_0${profile?.avatar||1}.png`} alt=""
                  style={{width:"100%",height:"100%",objectFit:"cover",imageRendering:"pixelated"}}
                  onError={e=>e.currentTarget.style.display="none"}/>
                <img src="/ui/avatar-frame-sm.png" alt=""
                  style={{position:"absolute",inset:-3,width:"calc(100% + 6px)",height:"calc(100% + 6px)",
                    imageRendering:"pixelated",pointerEvents:"none"}}
                  onError={e=>e.currentTarget.style.display="none"}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:V.goldL,letterSpacing:.5,
                  marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {profile?.displayName||"Héroe"}
                </div>
                <div style={{fontFamily:"'VT323',monospace",fontSize:14,color:"#9d8fa8",letterSpacing:1,marginBottom:6}}>
                  {profile?.heroClass||"Guerrero"}
                </div>
                <div style={{fontFamily:"'VT323',monospace",fontSize:12,color:"#9d8fa8",marginBottom:3}}>
                  NV {profile?.level||1}
                </div>
              </div>
            </div>
            <div className="fvl-bar tall" style={{marginBottom:4}}>
              <div className="fvl-fill" style={{width:`${xpLevelPct}%`}}/>
            </div>
            {xpDisp>0&&(
              <div style={{fontFamily:"'VT323',monospace",fontSize:12,color:V.gold,textAlign:"right",marginTop:2}}>
                +{xpDisp.toLocaleString()} XP disponible
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="fvl-p fvl-studs" style={{padding:"14px 16px"}}>
            <div className="fvl-ph-head">ESTADÍSTICAS</div>
            {[
              {k:"str",lb:"STR",cls:"str",v:profile?.stats?.fuerza||0},
              {k:"sta",lb:"STA",cls:"sta",v:profile?.stats?.resistencia||0},
              {k:"spd",lb:"SPD",cls:"spd",v:profile?.stats?.velocidad||0},
              {k:"dis",lb:"DIS",cls:"dis",v:profile?.stats?.disciplina||0},
              {k:"men",lb:"MEN",cls:"men",v:profile?.stats?.mente||0},
            ].map(s=>(
              <div key={s.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,letterSpacing:.8,width:26,flexShrink:0,
                  color:s.cls==="str"?V.str:s.cls==="sta"?V.sta:s.cls==="spd"?V.spd:s.cls==="dis"?V.dis:V.men}}>
                  {s.lb}
                </span>
                <div className="fvl-sbar" style={{flex:1}}>
                  <div className={`fvl-sfill ${s.cls}`} style={{width:`${Math.min(s.v,100)}%`}}/>
                </div>
                <span style={{fontFamily:"'VT323',monospace",fontSize:14,color:"#9d8fa8",width:28,textAlign:"right"}}>{s.v}</span>
              </div>
            ))}
            {profile?.skillPoints > 0 && (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                marginTop:6,padding:"6px 0",borderTop:"1px dashed rgba(200,155,60,.2)"}}>
                <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,color:"#9d8fa8",letterSpacing:.8}}>
                  PUNTOS HABILIDAD
                </span>
                <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:V.gold}}>{profile.skillPoints}</span>
              </div>
            )}
          </div>

          {/* Tier ledger — unique to Logros */}
          <div className="fvl-p fvl-studs" style={{padding:"14px 16px"}}>
            <div className="fvl-ph-head">RAREZAS</div>
            {[
              {lb:"COMÚN",     k:"Común",     cls:"comun",  count:logros.filter(l=>l.rareza==="Común"&&l.obtenido).length,  total:logros.filter(l=>l.rareza==="Común").length},
              {lb:"RARO",      k:"Raro",      cls:"raro",   count:logros.filter(l=>l.rareza==="Raro"&&l.obtenido).length,   total:logros.filter(l=>l.rareza==="Raro").length},
              {lb:"ÉPICO",     k:"Épico",     cls:"epico",  count:logros.filter(l=>l.rareza==="Épico"&&l.obtenido).length,  total:logros.filter(l=>l.rareza==="Épico").length},
              {lb:"LEGENDARIO",k:"Legendario",cls:"legend", count:logros.filter(l=>l.rareza==="Legendario"&&l.obtenido).length, total:logros.filter(l=>l.rareza==="Legendario").length},
            ].map(({lb,cls,count,total})=>(
              <div key={lb} className={`fvl-tier-row fvl-tc-${cls}`}>
                <div className="fvl-tier-glyph"/>
                <span className="fvl-tier-lab">{lb}</span>
                <span className="fvl-tier-v">{count}/{total}</span>
              </div>
            ))}
            <div style={{marginTop:12,paddingTop:10,borderTop:"2px solid #2a1f3d",
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,color:"#9d8fa8",letterSpacing:1}}>
                XP TOTAL
              </span>
              <span style={{fontFamily:"'VT323',monospace",fontSize:18,color:V.gold,
                textShadow:"0 0 8px rgba(200,155,60,.35)"}}>
                +{xpTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Showcase — pinned earned badges */}
          {reclamados > 0 && (
            <div className="fvl-p fvl-studs" style={{padding:"14px 16px"}}>
              <div className="fvl-ph-head">🏅 HONOR</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
                {[...logros.filter(l=>l.reclamado)]
                  .sort((a,b)=>(RAREZA[b.rareza]?.tier||0)-(RAREZA[a.rareza]?.tier||0))
                  .slice(0,9)
                  .map((l,i)=>(
                    <div key={l.id} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}
                      onClick={()=>setDetalleLogro(l)}>
                      <BadgeCircle logro={l} size="sm"/>
                    </div>
                  ))}
                {reclamados>9&&(
                  <div style={{width:40,height:40,background:"rgba(138,201,38,.12)",border:"1px solid rgba(138,201,38,.3)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#8ac926",borderRadius:"50%"}}>
                    +{reclamados-9}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER: filter tabs + achievement list */}
        <main className="fvl-center">

          {/* Showcase strip */}
          <div className="fvl-p fvl-studs" style={{padding:"14px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontFamily:"'VT323',monospace",fontSize:12,color:"#9d8fa8",letterSpacing:2,marginBottom:4}}>
                  PROGRESO GENERAL
                </div>
                <div style={{height:14,background:"#050308",border:"1px solid #000",
                  boxShadow:"inset 0 0 0 1px #2a1f3d",overflow:"hidden",position:"relative",marginBottom:4}}>
                  <div style={{height:"100%",width:`${pctColec}%`,
                    background:`linear-gradient(90deg,${V.xp1},${V.xp3})`,
                    boxShadow:`inset 0 1px 0 rgba(255,255,255,.3)`,transition:"width 1.5s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"'VT323',monospace",fontSize:13,color:"#9d8fa8"}}>
                    {obtenidos} / {totalLogros} logros
                  </span>
                  <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:V.gold}}>
                    {pctColec}%
                  </span>
                </div>
              </div>
              <div style={{display:"flex",gap:18,flexShrink:0}}>
                {[
                  {l:"OBTENIDOS",v:`${obtenidos}/${totalLogros}`,c:V.gold},
                  {l:"LISTOS",   v:listos,    c:listos>0?V.gold:"#9d8fa8"},
                  {l:"RECLAMADOS",v:reclamados,c:V.spd},
                ].map(s=>(
                  <div key={s.l} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:11,color:s.c,
                      textShadow:`0 0 10px ${s.c}44`}}>{s.v}</div>
                    <div style={{fontFamily:"'VT323',monospace",fontSize:11,color:"#9d8fa8",letterSpacing:1,marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Claimable banner */}
          {!loading && listos > 0 && (
            <div style={{background:"rgba(200,155,60,.12)",border:"2px solid rgba(200,155,60,.4)",
              padding:"10px 14px",display:"flex",alignItems:"center",gap:10,
              animation:"fvl-cpulse 2s ease-in-out infinite"}}>
              <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:V.gold}}>
                ★ {listos} {listos!==1?"logros listos para reclamar":"logro listo para reclamar"}
              </span>
              <span style={{fontFamily:"'VT323',monospace",fontSize:15,color:V.gold,marginLeft:"auto"}}>
                +{xpDisp.toLocaleString()} XP
              </span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
              background:"rgba(220,40,80,.12)",border:"1px solid rgba(220,40,80,.4)"}}>
              <X size={13} color={V.str} style={{flexShrink:0}}/>
              <span style={{fontFamily:"'VT323',monospace",fontSize:16,color:V.str,flex:1}}>{error}</span>
              <button onClick={()=>setError(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#9d8fa8",display:"flex"}}>
                <X size={12}/>
              </button>
            </div>
          )}

          {/* Tipo filter tabs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5}}>
            {["Todos", ...Object.keys(TIPOS)].map(tipo=>{
              const on = filterTipo === tipo;
              const count = tipo === "Todos" ? logros.length : logros.filter(l=>l.tipo===tipo).length;
              const listosCnt = tipo === "Todos"
                ? logros.filter(l=>l.obtenido&&!l.reclamado).length
                : logros.filter(l=>l.tipo===tipo&&l.obtenido&&!l.reclamado).length;
              return (
                <button key={tipo}
                  className={`fvl-filter-tab${on?" fvl-tab-on":""}`}
                  onClick={()=>setFilterTipo(tipo)}>
                  <span className="fvl-tab-ico">{tipo==="Todos"?"🏆":TIPO_ICO[tipo]}</span>
                  {tipo==="Todos"?"TODOS":tipo.substring(0,3).toUpperCase()}
                  {listosCnt>0&&(
                    <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,
                      color:"#07060c",background:V.gold,padding:"1px 4px"}}>{listosCnt}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search row */}
          {!loading && (
            <div className="fvl-p" style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
              <Search size={13} color="#9d8fa8" style={{flexShrink:0}}/>
              <input
                value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar logro..."
                style={{flex:1,background:"transparent",border:"none",color:"#ead7ad",
                  fontFamily:"'VT323',monospace",fontSize:16,outline:"none",letterSpacing:.5}}/>
              {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#9d8fa8",display:"flex"}}><X size={12}/></button>}
              <div style={{width:1,background:"#2a1f3d",height:20,margin:"0 4px"}}/>
              <span style={{fontFamily:"'VT323',monospace",fontSize:14,color:"#9d8fa8"}}>
                {listForTipo.length} logros
              </span>
            </div>
          )}

          {/* Achievement list — grouped by tipo */}
          <div className="fvl-ms-panel" style={{flex:1,overflowY:"auto",minHeight:0}}>

            {/* Skeletons */}
            {loading && [...Array(6)].map((_,i)=>(
              <div key={i} className="fvl-lr-row" style={{height:72,opacity:.35,cursor:"default"}}/>
            ))}

            {/* Empty state */}
            {!loading && listForTipo.length === 0 && (
              <div style={{textAlign:"center",padding:"48px 16px",opacity:.5}}>
                <div style={{fontSize:32,marginBottom:12}}>🏆</div>
                <div style={{fontFamily:"'VT323',monospace",fontSize:20,color:V.gold}}>
                  Sin logros para este filtro
                </div>
              </div>
            )}

            {/* Grouped rows */}
            {!loading && groupedForTipo.map(({tipo, items})=>(
              <div key={tipo}>
                <div className="fvl-sec-head" style={{color:TIPOS[tipo]?.color||V.gold}}>
                  <span style={{fontSize:12}}>{TIPO_ICO[tipo]}</span>
                  {tipo.toUpperCase()}
                  <span className="fvl-sec-count">{items.filter(l=>l.obtenido).length}/{items.length}</span>
                </div>
                {items.map(l=>(
                  <LrRow key={l.id} logro={l}
                    isSelected={selectedLogro?.id===l.id}
                    onClick={()=>setSelectedLogro(l)}
                    onClaim={handleReclamar}
                    claiming={claiming}/>
                ))}
              </div>
            ))}
          </div>
        </main>

        {/* RIGHT: detail panel */}
        <aside className="fvl-right fvl-p fvl-studs"
          style={{"--da":dAccent.c,"--dau":dAccent.a}}>
          <div className="fvl-detail">
            <div className="fvl-ph-head">DETALLES DEL LOGRO</div>
            {selectedLogro ? (
              <>
                {/* Art slot — 200×200 */}
                <div className="fvl-d-art">
                  <img src={`/logros/${selectedLogro.id}-detail.png`} alt=""
                    style={{position:"absolute",inset:0,width:"100%",height:"100%",
                      objectFit:"cover",imageRendering:"pixelated"}}
                    onError={e=>e.currentTarget.style.display="none"}/>
                  <div className="fvl-d-slot">
                    <span style={{fontSize:42,filter:!selectedLogro.obtenido&&selectedLogro.secreto?"blur(6px)":undefined}}>
                      {selectedLogro.imagen}
                    </span>
                    <span style={{fontFamily:"'VT323',monospace",fontSize:9,color:"#5e5269",textAlign:"center"}}>
                      200×200 — /logros/{selectedLogro.id}-detail.png
                    </span>
                  </div>
                </div>

                {/* Rareza stars */}
                <div style={{textAlign:"center",marginBottom:6}}>
                  {(() => { const rm = RAREZA[selectedLogro.rareza]||{tier:1}; return (
                    <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"var(--da)",
                      textShadow:"0 0 8px var(--dau)"}}>
                      {"★".repeat(rm.tier)} {selectedLogro.rareza?.toUpperCase()}
                    </span>
                  ); })()}
                </div>

                {/* Title */}
                <div className="fvl-d-title">
                  {!selectedLogro.obtenido&&selectedLogro.secreto ? "????? ?????" : selectedLogro.nombre}
                </div>

                {/* Status */}
                <div className="fvl-d-sec">ESTADO</div>
                <div style={{textAlign:"center",marginBottom:10}}>
                  {selectedLogro.reclamado ? (
                    <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#8ac926"}}>
                      ✓ COMPLETADO
                    </span>
                  ) : selectedLogro.obtenido ? (
                    <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:V.gold,
                      animation:"ul-pulse 1.5s infinite"}}>
                      ★ LISTO PARA RECLAMAR
                    </span>
                  ) : selectedLogro.secreto ? (
                    <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#9d8fa8"}}>
                      ? SECRETO
                    </span>
                  ) : (
                    <span style={{fontFamily:"'VT323',monospace",fontSize:16,color:"#9d8fa8"}}>EN PROGRESO</span>
                  )}
                  {selectedLogro.reclamado && selectedLogro.fechaObtencion && (
                    <div style={{fontFamily:"'VT323',monospace",fontSize:13,color:"#9d8fa8",marginTop:4}}>
                      Completado el {selectedLogro.fechaObtencion}
                    </div>
                  )}
                </div>

                {/* Description / lore */}
                <div className="fvl-d-sec">DESCRIPCIÓN</div>
                <div className="fvl-d-lore">
                  "{!selectedLogro.obtenido&&selectedLogro.secreto
                    ? "Logro secreto. Sigue entrenando para descubrirlo."
                    : selectedLogro.descripcion}"
                </div>

                {/* Progress */}
                {!selectedLogro.reclamado && !selectedLogro.secreto && (
                  <>
                    <div className="fvl-d-sec">PROGRESO</div>
                    <div className="fvl-d-pr">
                      <div className="fvl-bar" style={{flex:1,height:12}}>
                        <div className="fvl-fill" style={{width:`${dPct}%`,background:"var(--da)"}}/>
                      </div>
                      <span className="fvl-d-pc">{selectedLogro.progreso}/{selectedLogro.total}</span>
                    </div>
                  </>
                )}

                {/* Rewards */}
                <div className="fvl-d-sec">RECOMPENSAS</div>
                <div className="fvl-d-rws">
                  <div className="fvl-d-rw">
                    <div className="val">+{selectedLogro.xpBonus}</div>
                    <div className="lab">XP</div>
                  </div>
                  {selectedLogro.recompensas?.slice(1,2).map((r,i)=>(
                    <div key={i} className="fvl-d-rw">
                      <div className="val gem">{r.valor}</div>
                      <div className="lab">{r.icon||"◆"}</div>
                    </div>
                  )) || (
                    <div className="fvl-d-rw">
                      <div className="val">{Math.max(1,Math.floor(selectedLogro.xpBonus/10))}</div>
                      <div className="lab">◆ GEMAS</div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {selectedLogro.obtenido && !selectedLogro.reclamado ? (
                  <button className="fvl-d-cta"
                    onClick={()=>handleReclamar(selectedLogro)}
                    disabled={claiming===selectedLogro.id}>
                    {claiming===selectedLogro.id ? "RECLAMANDO…" : "★ RECLAMAR RECOMPENSA"}
                  </button>
                ) : selectedLogro.reclamado ? (
                  <>
                    <div className="fvl-d-cta done">✓ LOGRO RECLAMADO</div>
                    <button className="fvl-d-cta view" style={{marginTop:6}}
                      onClick={()=>setDetalleLogro(selectedLogro)}>
                      VER DETALLES COMPLETOS
                    </button>
                  </>
                ) : (
                  <>
                    <div className="fvl-d-cta" style={{opacity:.5,cursor:"default"}}>EN PROGRESO…</div>
                    <button className="fvl-d-cta view" style={{marginTop:6}}
                      onClick={()=>setDetalleLogro(selectedLogro)}>
                      VER DETALLES
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",gap:12,opacity:.4,padding:24}}>
                <div style={{fontSize:48}}>🏆</div>
                <div style={{fontFamily:"'VT323',monospace",fontSize:20,color:V.gold,textAlign:"center"}}>
                  Selecciona un logro para ver detalles
                </div>
              </div>
            )}
          </div>
        </aside>


      </div>
    </>
  );
}
