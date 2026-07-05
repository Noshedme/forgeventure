// src/pages/user/UserTienda.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "../../hooks/useLang.js";
import { auth } from "../../firebase.js";
import {
  getObjetosPublic, buyObjeto, buyLevel, useObjeto,
  getSkins, purchaseSkin, getInventario, getPurchases, getActiveBoosts,
  saveWishlist,
  purchaseAvatarItem,
  getAvatarCatalog,
  getMisionesUsuario,
  getUserStats,
  getRutinasPublicas,
  buyTitle,
  getTitlesCatalog,
  equipTitle,
  setActiveAvatar as apiSetActiveAvatar,
  setActiveFrame  as apiSetActiveFrame,
  setActiveSkin   as apiSetActiveSkin,
} from "../../services/api";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { getSkinPreview } from "../../avatar/SpriteMap";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { AVATARS_CATALOG, FRAMES_CATALOG, RAREZA_AVATAR_COLOR } from "../../avatar/AvatarCatalog";
import {
  ShoppingBag, ShoppingCart, X, Check, Zap,
  ChevronRight, Search, Package, Sparkles, Info,
  RotateCcw, AlertTriangle,
} from "lucide-react";

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
  @keyframes ut-fadeIn    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ut-spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ut-modalIn   { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ut-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ut-shine     { 0%{left:-100%} 100%{left:200%} }
  @keyframes ut-coin      { 0%{opacity:0;transform:translateY(0) scale(.5)} 50%{opacity:1;transform:translateY(-50px) scale(1.2)} 100%{opacity:0;transform:translateY(-100px) scale(.8)} }
  @keyframes ut-buy       { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ut-newTag    { 0%{transform:scale(0) rotate(-15deg);opacity:0} 80%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ut-shimmer   { 0%,100%{opacity:.3} 50%{opacity:.6} }
  @keyframes frame-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ut-coinUp    { 0%{transform:scale(1)} 30%{transform:scale(1.2);color:${C.gold};text-shadow:0 0 24px ${C.gold},0 0 40px ${C.gold}66} 60%{transform:scale(.96)} 100%{transform:scale(1)} }
  @keyframes ut-coinDown  { 0%{transform:scale(1)} 25%{transform:scale(1.1);color:${C.red};text-shadow:0 0 16px ${C.red}} 60%{transform:scale(.96)} 100%{transform:scale(1)} }
  @keyframes ut-useOk     { 0%{transform:scale(0) rotate(-10deg);opacity:0} 55%{transform:scale(1.2) rotate(3deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes ut-boostIn   { from{opacity:0;transform:translateY(-10px) scale(.97)} to{opacity:1;transform:none;scale:1} }
  @keyframes ut-timerPulse{ 0%,100%{opacity:1} 50%{opacity:.65} }
  @keyframes ut-timerEnd  { 0%{color:inherit} 50%{color:${C.red};text-shadow:0 0 8px ${C.red}} 100%{color:inherit} }
  @keyframes ut-epicBorder{ 0%,100%{box-shadow:0 0 0 1.5px var(--ec)55,0 4px 18px rgba(0,0,0,.4)} 50%{box-shadow:0 0 0 2.5px var(--ec)CC,0 0 24px var(--ec)44,0 4px 18px rgba(0,0,0,.4)} }
  @keyframes ut-hudScan   { 0%{top:-3px;opacity:.55} 100%{top:103%;opacity:0} }
  @keyframes ut-auroraA   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
  @keyframes ut-auroraB   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,24px) scale(.93)} }
  @keyframes ut-auroraC   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,10px) scale(1.12)} }
  @keyframes ut-ember     { 0%{opacity:0;transform:translateY(0)} 10%{opacity:.7} 90%{opacity:.2} 100%{opacity:0;transform:translateY(-60px)} }
  @keyframes ti-crestPulse{ 0%,100%{filter:drop-shadow(0 0 8px var(--ti-ac,#c08aff)) brightness(1)} 50%{filter:drop-shadow(0 0 18px var(--ti-ac,#c08aff)) brightness(1.2)} }
  @keyframes ti-accentLine{ 0%{transform:scaleX(0);opacity:0} 100%{transform:scaleX(1);opacity:1} }
  @keyframes ti-heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

  .ut-input { transition:border-color .2s; outline:none; }
  .ut-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .ut-input::placeholder { color:${C.muted}; }
  .ut-btn { transition:all .18s; cursor:pointer; }
  .ut-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .ut-shine { position:absolute;top:0;left:-100%;width:50%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);pointer-events:none; }
  .ut-epic-card { animation:ut-epicBorder 2.4s ease-in-out infinite; }
  .ut-tab-active-line { position:absolute;bottom:0;left:10%;width:80%;height:2px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);
    animation:ut-hudScan 2.2s linear infinite; pointer-events:none; border-radius:2px; }
`;

const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);
const rpx = (s) => mono(s, 700);
const px  = (s)           => mono(s, 700);

// ── Gothic JRPG design tokens ────────────────────────────────────
const V = {
  bg: P.bg0, p1: P.bg1, p2: P.bg2,
  bDark: P.navy, bMid: P.line, bHi: P.line,
  gold: P.gold, goldL: P.accent2,
  str:"#e0455e", sta:"#ffb13a", spd:"#8ac926", dis: P.accent, men:"#4cc9f0",
};

const TIER_ACCENT_TI = {
  "Común":      { c:"#a8a8b8", a:"rgba(168,168,184,.4)"  },
  "Poco común": { c:"#5ad15a", a:"rgba(90,209,90,.45)"   },
  "Raro":       { c:"#4cc9f0", a:"rgba(76,201,240,.5)"   },
  "Épico":      { c:"#c08aff", a:"rgba(192,138,255,.55)" },
  "Legendario": { c:"#f4cc78", a:"rgba(244,204,120,.6)"  },
  "Mítico":     { c:"#ff5a2e", a:"rgba(255,90,46,.65)"   },
};

const SHOP_CSS = `
  /* ── App grid ── */
  .ti-app {
    max-width:1680px; margin:0 auto; padding:16px;
    display:grid;
    grid-template-columns:250px 1fr 300px;
    grid-template-rows: auto 1fr;
    gap:14px;
    position:relative; z-index:1;
    flex:1; min-height:0; height:100%;
    overflow:hidden;
    box-sizing:border-box;
    font-family:'Manrope',sans-serif; color:#f0eaff;
    background:
      radial-gradient(ellipse 55% 42% at 5% 5%,   color-mix(in srgb,var(--ti-ac,#c08aff),transparent 72%) 0%,transparent 100%),
      radial-gradient(ellipse 40% 30% at 95% 90%,  color-mix(in srgb,var(--ti-ac,#c08aff),transparent 78%) 0%,transparent 100%),
      radial-gradient(ellipse 30% 25% at 50% 48%,  color-mix(in srgb,var(--ti-ac,#c08aff),transparent 92%) 0%,transparent 100%),
      linear-gradient(160deg,#06040f 0%,#0a0718 40%,#060411 100%);
  }
  .ti-top-bar { grid-column:1/4; display:grid; grid-template-columns:250px 1fr auto; gap:16px; }
  .ti-left  { display:flex; flex-direction:column; gap:14px; overflow-y:auto; min-height:0; }
  .ti-main  { display:flex; flex-direction:column; gap:14px; min-width:0; overflow-y:auto; min-height:0; }
  .ti-right { display:flex; flex-direction:column; gap:14px; overflow-y:auto; min-height:0; }

  /* pixel grid overlay */
  .ti-gridline{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.38;background-image:linear-gradient(color-mix(in srgb,var(--ti-ac,#c08aff),transparent 94%) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--ti-ac,#c08aff),transparent 94%) 1px,transparent 1px);background-size:44px 44px;}

  /* ── Glass panel ── */
  .ti-panel{position:relative;background:rgba(14,10,28,.72);border:1px solid color-mix(in srgb,var(--ti-ac,#c08aff),transparent 76%);border-radius:12px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:20px;box-shadow:0 8px 32px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.07);transition:border-color .2s;}
  .ti-panel-head{display:flex;align-items:center;gap:9px;font:800 11px/1 'JetBrains Mono',monospace;color:var(--ti-ac,#c08aff);letter-spacing:.14em;text-transform:uppercase;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid color-mix(in srgb,var(--ti-ac,#c08aff),transparent 82%);text-shadow:0 0 16px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 50%);}

  /* ── Rarity modifiers ── */
  .ti-r-common   {--ti-rc:#a8a8b8;--ti-ra:rgba(168,168,184,.3);}
  .ti-r-uncommon {--ti-rc:#5ad15a;--ti-ra:rgba(90,209,90,.35);}
  .ti-r-rare     {--ti-rc:#4cc9f0;--ti-ra:rgba(76,201,240,.4);}
  .ti-r-epic     {--ti-rc:#c08aff;--ti-ra:rgba(192,138,255,.45);}
  .ti-r-legend   {--ti-rc:#f4cc78;--ti-ra:rgba(244,204,120,.5);}
  .ti-r-mythic   {--ti-rc:#ff5a2e;--ti-ra:rgba(255,90,46,.55);}

  /* ── Item cards ── */
  .ti-card{position:relative;background:rgba(10,7,22,.82);border:1px solid var(--ti-rc,#3a2d54);border-radius:10px;cursor:pointer;overflow:hidden;transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s,border-color .2s;display:flex;flex-direction:column;}
  .ti-card::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,transparent 50%);opacity:0;transition:opacity .2s;pointer-events:none;z-index:2;}
  .ti-card:hover{transform:translateY(-6px) scale(1.02);border-color:var(--ti-rc,#a8a8b8);box-shadow:0 0 28px var(--ti-ra,rgba(168,168,184,.35)),0 16px 36px rgba(0,0,0,.7);}
  .ti-card:hover::after{opacity:1;}
  .ti-card.selected{border-color:var(--ti-ac,#c08aff);box-shadow:0 0 0 1px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 50%),0 0 28px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 62%);}
  .ti-card-art{height:96px;position:relative;overflow:hidden;border-radius:9px 9px 0 0;}
  .ti-card-body{padding:10px 10px 9px;display:flex;flex-direction:column;gap:5px;flex:1;}
  .ti-badge{font:800 8px/1 'Manrope',sans-serif;padding:3px 7px;position:absolute;z-index:3;top:7px;left:7px;border-radius:4px;letter-spacing:.04em;}
  .ti-badge-new {background:rgba(45,96,0,.9);color:#b4f074;border:1px solid #8ac926;}
  .ti-badge-sale{background:rgba(110,10,24,.9);color:#ffa0a0;border:1px solid #d33b4d;}
  .ti-owned{position:absolute;top:7px;right:7px;background:rgba(6,4,14,.88);border:1px solid #8ac926;color:#8ac926;padding:3px 6px;font:700 8px/1 'Manrope',sans-serif;z-index:3;border-radius:4px;}

  /* ── Category buttons ── */
  .ti-cat{padding:10px 6px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:border-color .18s,background .18s,transform .18s,box-shadow .18s;font-family:'Manrope',sans-serif;color:#9080b0;text-align:center;}
  .ti-cat:hover{border-color:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 50%);background:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 92%);transform:translateY(-3px) scale(1.03);box-shadow:0 8px 20px rgba(0,0,0,.5);}
  .ti-cat.active{border-color:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 30%);background:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 85%);color:var(--ti-ac,#c08aff);box-shadow:0 0 18px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 70%),inset 0 1px 0 rgba(255,255,255,.1);}

  /* ── Tab nav ── */
  .ti-tab{padding:10px 16px;background:transparent;border:none;border-bottom:2px solid transparent;color:#6e607e;font:700 11px/1 'Manrope',sans-serif;letter-spacing:.04em;cursor:pointer;transition:color .15s,border-color .15s,background .15s;display:flex;align-items:center;gap:6px;white-space:nowrap;}
  .ti-tab:hover{color:#c0b0d8;background:rgba(255,255,255,.03);}
  .ti-tab.active{color:var(--ti-ac,#c08aff);border-bottom-color:var(--ti-ac,#c08aff);text-shadow:0 0 12px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 50%);}

  /* ── Seg control ── */
  .ti-seg{display:inline-flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:6px;overflow:hidden;}
  .ti-seg-btn{background:transparent;border:none;color:#6e607e;font:700 10px/1 'Manrope',sans-serif;padding:6px 10px;cursor:pointer;letter-spacing:.06em;transition:color .12s,background .12s;}
  .ti-seg-btn:hover{color:#c0b0d8;background:rgba(255,255,255,.04);}
  .ti-seg-btn.active{background:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 80%);color:var(--ti-ac,#c08aff);text-shadow:0 0 8px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 55%);}

  /* ── Bars ── */
  .ti-bar{height:5px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden;}
  .ti-bar-fill{height:100%;border-radius:99px;transition:width .6s ease;}

  /* ── Rows ── */
  .ti-row{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;padding:9px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-left:2px solid transparent;border-radius:6px;cursor:pointer;transition:border-color .15s,background .15s,transform .15s,border-left-color .15s;margin-bottom:6px;}
  .ti-row:hover{border-color:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 55%);border-left-color:var(--ti-ac,#c08aff);background:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 94%);transform:translateX(4px);}

  /* ── Detail art ── */
  .ti-d-art{aspect-ratio:1/1;position:relative;background:radial-gradient(ellipse 70% 60% at 50% 50%,var(--ti-ra,rgba(200,155,60,.25)),transparent 70%),linear-gradient(180deg,rgba(6,4,12,.8),rgba(12,8,22,.9));border:1px solid var(--ti-rc,#3a2d54);border-radius:8px;box-shadow:0 0 20px var(--ti-ra,rgba(200,155,60,.15));overflow:hidden;margin-bottom:14px;}

  /* ── Panel hover ── */
  .ti-panel{transition:border-color .2s,box-shadow .2s;}
  .ti-panel:hover{border-color:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 60%);box-shadow:0 12px 40px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.09);}

  /* ── Action buttons ── */
  .ti-btn-buy{position:relative;overflow:hidden;width:100%;padding:13px;border:none;border-radius:7px;cursor:pointer;font:800 12px/1 'Manrope',sans-serif;letter-spacing:.06em;background:linear-gradient(135deg,var(--ti-ac,#c08aff),color-mix(in oklab,var(--ti-ac,#c08aff) 60%,#a000ff));color:#08041a;box-shadow:0 8px 28px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 66%);transition:transform .15s,box-shadow .15s;margin-bottom:8px;}
  .ti-btn-buy::after{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transition:left .4s;}
  .ti-btn-buy:hover:not(:disabled):not(.owned)::after{left:150%;}
  .ti-btn-buy:hover:not(:disabled):not(.owned){transform:translateY(-2px) scale(1.01);box-shadow:0 14px 40px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 50%);}
  .ti-btn-buy.owned{background:linear-gradient(135deg,#2d6f4c,#134a30);color:#b4f0c8;box-shadow:none;cursor:default;}
  .ti-btn-buy:disabled:not(.owned){background:rgba(255,255,255,.06);color:#e05c8a;box-shadow:none;cursor:not-allowed;}
  .ti-btn-wish{width:100%;padding:10px;border-radius:7px;cursor:pointer;font:700 11px/1 'Manrope',sans-serif;letter-spacing:.04em;background:rgba(255,255,255,.04);color:#6e607e;border:1px solid rgba(255,255,255,.09);transition:color .15s,border-color .15s,background .15s;display:flex;align-items:center;justify-content:center;gap:8px;}
  .ti-btn-wish:hover{color:#e05c8a;border-color:rgba(224,92,138,.4);background:rgba(224,92,138,.06);}
  .ti-btn-wish.active{color:#e05c8a;border-color:#e05c8a;background:rgba(224,92,138,.08);}

  /* ── Avatar ── */
  .ti-av{width:56px;height:56px;border-radius:50%;border:2px solid color-mix(in srgb,var(--ti-ac,#c08aff),transparent 55%);background:linear-gradient(135deg,rgba(157,78,221,.35),rgba(20,15,40,.9));overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

  /* ── Skeleton ── */
  .ti-skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:ut-shimmer 1.5s infinite;border-radius:6px;}

  /* ── Wheel ── */
  .ti-wheel{width:60px;height:60px;border-radius:50%;flex-shrink:0;background:conic-gradient(#f4cc78 0 60deg,#c77dff 60deg 120deg,#4cc9f0 120deg 180deg,#e0455e 180deg 240deg,#8ac926 240deg 300deg,#c08aff 300deg 360deg);border:2px solid rgba(255,255,255,.15);box-shadow:0 0 14px rgba(244,204,120,.3);animation:fvs-spin 8s linear infinite;}
  @keyframes fvs-spin{to{transform:rotate(360deg)}}

  /* ── Search input ── */
  .ti-input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:#e8dcc4;padding:7px 11px;font-family:'Manrope',sans-serif;font-size:12px;outline:none;transition:border-color .2s;width:130px;}
  .ti-input:focus{border-color:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 55%);box-shadow:0 0 0 2px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 86%);}
  .ti-input::placeholder{color:#6e607e;}

  /* ── Class crest glow ── */
  .ti-crest{animation:ti-crestPulse 3s ease-in-out infinite;}
  /* ── Hero idle float ── */
  .ti-hero-idle{animation:ti-heroFloat 3.2s ease-in-out infinite;}
  /* ── Accent entry bar ── */
  .ti-accent-line{transform-origin:left;animation:ti-accentLine .6s cubic-bezier(.2,.8,.2,1) both;}
  /* ── Class-colored chip ── */
  .ti-class-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;background:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 88%);border:1px solid color-mix(in srgb,var(--ti-ac,#c08aff),transparent 55%);border-radius:99px;font:700 9px/1 'JetBrains Mono',monospace;color:var(--ti-ac,#c08aff);letter-spacing:.09em;text-shadow:0 0 8px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 50%);box-shadow:0 0 12px color-mix(in srgb,var(--ti-ac,#c08aff),transparent 80%);}
  /* ── Stat bar uses class color ── */
  .ti-bar-class{height:100%;border-radius:99px;transition:width .7s ease;background:linear-gradient(90deg,color-mix(in srgb,var(--ti-ac,#c08aff),transparent 35%),var(--ti-ac,#c08aff));}

  /* ── Scrollbars ── */
  .ti-left::-webkit-scrollbar,.ti-main::-webkit-scrollbar,.ti-right::-webkit-scrollbar{width:3px}
  .ti-left::-webkit-scrollbar-track,.ti-main::-webkit-scrollbar-track,.ti-right::-webkit-scrollbar-track{background:transparent}
  .ti-left::-webkit-scrollbar-thumb,.ti-main::-webkit-scrollbar-thumb,.ti-right::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--ti-ac,#c08aff),transparent 72%);border-radius:2px}

  /* ── Responsive ── */
  @media(max-width:1440px){.ti-app{grid-template-columns:230px 1fr 280px}.ti-top-bar{grid-template-columns:230px 1fr auto}}
  @media(max-width:1280px){.ti-app{grid-template-columns:210px 1fr 260px}.ti-top-bar{grid-template-columns:210px 1fr auto}}
  @media(max-width:1180px){.ti-app{grid-template-columns:200px 1fr}.ti-top-bar{grid-column:1/3;grid-template-columns:200px 1fr}.ti-right{display:none}}
  @media(max-width:960px){.ti-app{grid-template-columns:1fr;grid-template-rows:auto auto;padding:10px;gap:10px;overflow-y:auto;overflow-x:hidden}.ti-top-bar{grid-column:1;grid-template-columns:1fr}.ti-right{display:none}.ti-left,.ti-main{overflow-y:visible}}
  @media(max-width:600px){.ti-app{padding:8px;gap:8px}}
  @media(max-height:800px) and (min-width:900px){.ti-app{padding:10px;gap:10px}.ti-left,.ti-main,.ti-right{gap:8px}}
`;


// ── Class helpers ────────────────────────────────────────────────
const CLASS_LABEL_KEYS_TI = { GUERRERO:"ti.class.guerrero", ARQUERO:"ti.class.arquero", MAGO:"ti.class.mago" };

// ── C3: effect → mission synergy hint (returns key for i18n) ────
function missionHint(efectos) {
  if (!efectos?.length) return null;
  const types = efectos.map(e => e.tipo);
  if (types.includes("xp_mult"))      return { img:EFFECT_ICON_ASSET.xp_mult,       textKey:"ti.hint.xp_mult",      color:C.gold   };
  if (types.includes("xp_bonus"))     return { img:EFFECT_ICON_ASSET.xp_bonus,      textKey:"ti.hint.xp_bonus",     color:C.gold   };
  if (types.includes("streak_shield"))return { img:EFFECT_ICON_ASSET.streak_shield, textKey:"ti.hint.streak_shield",color:C.orange };
  if (types.includes("xp_instant"))   return { img:EFFECT_ICON_ASSET.xp_instant,    textKey:"ti.hint.xp_instant",   color:C.teal   };
  if (types.includes("hp_recover"))   return { img:EFFECT_ICON_ASSET.hp_recover,    textKey:"ti.hint.hp_recover",   color:C.red    };
  if (types.includes("level_boost"))  return { img:EFFECT_ICON_ASSET.level_boost,   textKey:"ti.hint.level_boost",  color:C.purple };
  return null;
}

// ── efecto → texto legible (static, stored on item) ─────────────
function efTxt(ef) {
  if (ef.txt) return ef.txt;
  const v = ef.valor;
  switch (ef.tipo) {
    case "xp_bonus":      return `+${v}% XP`;
    case "xp_instant":    return `+${v} XP`;
    case "hp_recover":    return `HP +${v}%`;
    case "streak_shield": return `__streak__${v}d`;
    case "xp_mult":       return `×${v} XP`;
    case "level_boost":   return `__nivel__${v}`;
    case "unlock_class":  return `__clase__${v}`;
    case "cosmetic_skin": return `Skin: ${v}`;
    case "title_grant":   return `__titulo__${v}`;
    case "cooldown_red":  return `-${v}% CD`;
    default:              return ef.label || `${v} ${ef.unidad || ""}`;
  }
}

// ── efecto → texto localizado (used at render time) ──────────────
function renderEfTxt(ef, t) {
  const raw = ef.txt || ef.label || "";
  if (raw.startsWith("__streak__"))  return `${t("ti.ef.streak")} ${raw.slice(10)}`;
  if (raw.startsWith("__nivel__"))   return `+${raw.slice(9)} ${t("ti.ef.nivel")}`;
  if (raw.startsWith("__clase__"))   return `${t("ti.ef.clase")}: ${raw.slice(9)}`;
  if (raw.startsWith("__titulo__"))  return `${t("ti.ef.titulo")}: ${raw.slice(10)}`;
  return raw || `${ef.valor} ${ef.unidad || ""}`;
}

// ── Rareza → i18n key map ────────────────────────────────────────
const RAREZA_LABEL_KEYS = {
  "Común":"ti.rar.todas",
  "Poco común":"ti.rar.poco_comun",
  "Raro":"ti.rar.raro",
  "Épico":"ti.rar.epico",
  "Legendario":"ti.rar.legendario",
  "Mítico":"ti.rar.mitico",
};

// ── Cat → i18n key map ───────────────────────────────────────────
const CAT_LABEL_KEYS = {
  Todos:"ti.cat.todos", Poción:"ti.cat.pocion", Equipo:"ti.cat.equipo",
  Cosmético:"ti.cat.cosmetico", Consumible:"ti.cat.consumible", Especial:"ti.cat.especial", Coleccionable:"ti.cat.especial",
};

const MARKET_KIND_META = {
  functional:  { label:"FUNCIONAL",   color:"#8ac926", bg:"rgba(138,201,38,.12)", border:"rgba(138,201,38,.35)" },
  cosmetic:    { label:"COSMETICO",   color:"#c08aff", bg:"rgba(192,138,255,.12)", border:"rgba(192,138,255,.35)" },
  collectible: { label:"COLECCION",   color:"#f4cc78", bg:"rgba(244,204,120,.12)", border:"rgba(244,204,120,.35)" },
  service:     { label:"SERVICIO",    color:"#4cc9f0", bg:"rgba(76,201,240,.12)", border:"rgba(76,201,240,.35)" },
  legacy:      { label:"LEGACY",      color:"#e05c8a", bg:"rgba(224,92,138,.12)", border:"rgba(224,92,138,.35)" },
};

function deriveMarketKind(item = {}) {
  if (item?.marketKind) return item.marketKind;
  const effectTypes = Array.isArray(item?.efectos) ? item.efectos.map((ef) => ef?.tipo).filter(Boolean) : [];
  const rawCat = normalizeLoose(item?.categoria || item?.cat || "");
  if (effectTypes.includes("cosmetic_skin") || rawCat.includes("cosmet")) return "cosmetic";
  if (!effectTypes.length) return "collectible";
  if (effectTypes.includes("level_boost")) return "service";
  if (effectTypes.includes("unlock_class") || effectTypes.includes("title_grant")) return "legacy";
  return "functional";
}

function isSupportedUseItem(item = {}) {
  if (item?.supportedUse !== undefined) return Boolean(item.supportedUse);
  const effectTypes = Array.isArray(item?.efectos) ? item.efectos.map((ef) => ef?.tipo).filter(Boolean) : [];
  if (!effectTypes.length) return false;
  const marketKind = deriveMarketKind(item);
  if (!["functional", "service"].includes(marketKind)) return false;
  return !effectTypes.includes("cosmetic_skin");
}

function normalizeObjeto(o) {
  const marketKind = deriveMarketKind(o);
  const supportedUse = isSupportedUseItem(o);
  return {
    stackeable: false, gratis: false, limitado: false,
    esNuevo: false,
    consumible: ["Poción","Consumible"].includes(o.categoria || o.cat),
    ...o,
    imagen: o.imagen || "",
    cat:    o.categoria || o.cat || "Especial",
    rareza: o.rareza   || "Común",
    precio: Number(o.precio || 0),
    desc:   o.desc     || o.descripcion || "",
    efectos:(o.efectos || []).map(ef => ({ ...ef, txt: efTxt(ef) })),
    marketKind,
    catalogStatus: o.catalogStatus || (marketKind === "legacy" ? "legacy" : "canonical"),
    retiredReason: o.retiredReason || "",
    supportedUse,
  };
}

// ── Categorías ───────────────────────────────────────────────────
const CATS = {
  Todos:      { color:C.orange,  icon:"🌟", img:"/ui/shop/icons/shop-coin-stack.png"    },
  Poción:     { color:"#FF69B4", icon:"🧪", img:"/items/consumables/pocion_vida.png"    },
  Equipo:     { color:C.orange,  icon:"⚔️", img:"/equipo/pechera.png"                  },
  Cosmético:  { color:C.purple,  icon:"👑", img:"/ui/shop/icons/shop-cosmetic.png"      },
  Consumible: { color:C.teal,    icon:"⚡", img:"/ui/shop/icons/shop-crate.png"         },
  Coleccionable:{ color:C.gold,  icon:"💠", img:"/ui/shop/icons/shop-coin-stack.png"    },
  Especial:   { color:C.red,     icon:"💎", img:"/items/rewards/orbe_magico.png"        },
};

// ── Stage images per hero class ──────────────────────────────────
const SHOP_STAGE = {
  GUERRERO: "/ui/shop/hero/shop-stage-warrior.png",
  ARQUERO:  "/ui/shop/hero/shop-stage-archer.png",
  MAGO:     "/ui/shop/hero/shop-stage-mage.png",
};

const RAREZA = {
  "Común":      { color:C.muted,   tier:1 },
  "Poco común": { color:C.green,   tier:2 },
  "Raro":       { color:C.blue,    tier:3 },
  "Épico":      { color:C.purple,  tier:4 },
  "Legendario": { color:C.gold,    tier:5 },
  "Mítico":     { color:"#FF2D55", tier:6 },
};

// ── Image box — progressive URL fallback ─────────────────────────
function ItemImageBox({ item, height = 80 }) {
  const r  = RAREZA[item.rareza] || { color:C.muted, tier:1 };
  const ac = r.color;
  const catImg = CATS[item.cat]?.img || "/ui/shop/icons/shop-crate.png";
  const [urlIdx, setUrlIdx] = useState(0);
  useEffect(() => { setUrlIdx(0); }, [item.imagen]);

  const rawImg = (item.imagen || "").trim();
  const isEmojiLike = rawImg.length > 0 && rawImg.length <= 4 && !/^[a-zA-Z0-9_./-]/.test(rawImg);

  const candidates = (() => {
    if (!rawImg || isEmojiLike) return [catImg];
    if (rawImg.startsWith("/") || rawImg.startsWith("http")) return [rawImg, catImg];
    const base = rawImg.includes(".") ? rawImg : `${rawImg}.png`;
    return [
      `/items/consumables/${base}`,
      `/items/equipment/${base}`,
      `/items/rewards/${base}`,
      `/items/${base}`,
      catImg,
    ];
  })();

  const src = isEmojiLike ? null : candidates[Math.min(urlIdx, candidates.length - 1)];

  return (
    <div style={{
      width:"100%", height, flexShrink:0, position:"relative",
      background:`linear-gradient(160deg,#0d0b18,${ac}18)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", width:64, height:64, borderRadius:"50%",
        background:`radial-gradient(circle,${ac}40 0%,transparent 70%)`,
        pointerEvents:"none",
      }}/>
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width:height*0.6, height:height*0.6, objectFit:"contain",
            filter:`drop-shadow(0 0 8px ${ac}88)`,
            animation:r.tier>=4?"ut-float 3s ease-in-out infinite":"none" }}
          onError={() => setUrlIdx(i => i + 1)}
        />
      ) : (
        <img src={catImg} alt="" style={{ width:height*0.55, height:height*0.55,
          objectFit:"contain", filter:`drop-shadow(0 0 6px ${ac}66)`, opacity:.65 }}/>
      )}
    </div>
  );
}

// ── V1: Background — canvas embers + aurora blobs + pixel grid ───
function UTBackground({ color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const parseHex = (hex) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return [r,g,b];
    };
    const [cr,cg,cb] = parseHex(color);
    const embers = Array.from({ length:34 }, () => ({
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      s: Math.random() * 2.2 + .5,
      sp: Math.random() * .18 + .06,
      op: 0,
      life: Math.random(),
      max: Math.random() * .55 + .2,
    }));
    const draw = () => {
      if (!canvas.width) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      embers.forEach(e => {
        e.life += e.sp * .012;
        if (e.life >= 1) { e.life=0; e.x=Math.random()*100; e.y=100+Math.random()*10; e.op=0; }
        const pct = e.life;
        e.op = pct < .1 ? pct * 10 * e.max : pct > .8 ? (1-pct)*5*e.max : e.max;
        const px = e.x / 100 * canvas.width + Math.sin(e.life*Math.PI*2)*18;
        const py = (1-e.life) * canvas.height * 1.1;
        ctx.beginPath();
        ctx.arc(px, py, e.s, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${e.op})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [color]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      {/* canvas embers */}
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}/>
      {/* aurora blob A */}
      <div style={{ position:"absolute", top:"8%", left:"15%", width:480, height:320,
        borderRadius:"60% 40% 55% 45% / 50% 60% 40% 50%",
        background:`radial-gradient(ellipse, ${color}1A 0%, transparent 68%)`,
        filter:"blur(48px)", animation:"ut-auroraA 11s ease-in-out infinite", pointerEvents:"none" }}/>
      {/* aurora blob B */}
      <div style={{ position:"absolute", top:"40%", right:"8%", width:380, height:260,
        borderRadius:"45% 55% 40% 60% / 60% 40% 60% 40%",
        background:`radial-gradient(ellipse, ${C.purple}18 0%, transparent 65%)`,
        filter:"blur(56px)", animation:"ut-auroraB 14s ease-in-out infinite", pointerEvents:"none" }}/>
      {/* aurora blob C */}
      <div style={{ position:"absolute", bottom:"12%", left:"35%", width:340, height:220,
        borderRadius:"55% 45% 50% 50% / 45% 55% 45% 55%",
        background:`radial-gradient(ellipse, ${C.gold}10 0%, transparent 65%)`,
        filter:"blur(44px)", animation:"ut-auroraC 9s ease-in-out infinite", pointerEvents:"none" }}/>
      {/* pixel grid overlay */}
      <div style={{ position:"absolute", inset:0,
        backgroundImage:`linear-gradient(${color}06 1px,transparent 1px),linear-gradient(90deg,${color}06 1px,transparent 1px)`,
        backgroundSize:"40px 40px", pointerEvents:"none", opacity:.6 }}/>
    </div>
  );
}

// ── Rareza badge ─────────────────────────────────────────────────
function RarezaBadge({ rareza, small = false }) {
  const { t } = useLang();
  const r = RAREZA[rareza] || { color:C.muted, tier:1 };
  const label = RAREZA_LABEL_KEYS[rareza] ? t(RAREZA_LABEL_KEYS[rareza]) : rareza;
  return (
    <span style={{
      ...raj(small?9:10, 700), color:r.color,
      background:`${r.color}14`, border:`1px solid ${r.color}33`,
      padding:small?"1px 5px":"2px 8px", whiteSpace:"nowrap",
      textShadow:r.tier>=4?`0 0 6px ${r.color}`:"none",
      borderRadius:4,
    }}>
      {"★".repeat(r.tier)} {label}
    </span>
  );
}

// ── Coin anim ────────────────────────────────────────────────────
function CoinNotif({ amount, type = "loss", onDone }) {
  const isGain = type === "gain";
  const col    = isGain ? C.green : C.red;
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
      zIndex:500, pointerEvents:"none", ...orb(28,900), color:col,
      textShadow:`0 0 24px ${col}88`, animation:"ut-coin 2s ease forwards",
      display:"flex", alignItems:"center", gap:10,
    }}>
      <AssetIcon src="/ui/icon-gold.png" size={24} style={{filter:`drop-shadow(0 0 12px ${col}88)`}} />
      <span>{isGain ? "+" : "−"}{amount}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ITEM MODAL — Detalle / Compra
// ══════════════════════════════════════════════════════════════════
function ItemModal({ item, coins, onClose, onBuy }) {
  const { t } = useLang();
  const r   = RAREZA[item.rareza] || { color:C.muted, tier:1 };
  const c   = r.color;
  const cat = CATS[item.cat]    || {};
  const [qty,      setQty]     = useState(1);
  const [fase,     setFase]    = useState("detail");
  const [loading,  setLoading] = useState(false);
  const [buyError, setBuyError]= useState(null);

  const total     = item.precio * qty;
  const canAfford = coins >= total;
  const canBuy    = !item.gratis && !item.requiereLogro && item.cat !== "Especial";

  const handleBuy = () => {
    if (!canAfford) { setFase("noCoins"); return; }
    setFase("confirm");
  };
  const handleConfirm = async () => {
    setLoading(true); setBuyError(null);
    try {
      const ok = await onBuy(item, qty, total);
      if (ok === false) { setBuyError(t("ti.err.buy_fail")); setFase("detail"); }
      else setFase("success");
    } catch { setBuyError(t("ti.err.buy_err")); setFase("detail"); }
    finally  { setLoading(false); }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,.85)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity:0, scale:.92, y:18 }}
        animate={{ opacity:1, scale:1,    y:0  }}
        exit={{    opacity:0, scale:.94, y:10  }}
        transition={{ type:"spring", stiffness:340, damping:28 }}
        style={{
          width:"100%", maxWidth:500, background:C.card,
          border:`2px solid ${c}44`, overflow:"hidden",
          boxShadow:`0 0 60px ${c}18, 0 24px 60px rgba(0,0,0,.7)`,
          borderRadius:16,
        }}
      >
        {/* accent line */}
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${c},transparent)` }}/>

        {/* DETAIL */}
        {fase === "detail" && (<>
          <ItemImageBox item={item} height={140}/>
          <div style={{ padding:"18px 22px 22px", display:"flex", flexDirection:"column", gap:16 }}>
            {/* header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ ...orb(14,900), color:C.white, marginBottom:6 }}>{item.nombre}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span style={{ ...raj(10,700), color:cat.color||C.orange, background:`${cat.color||C.orange}14`,
                    border:`1px solid ${cat.color||C.orange}33`, padding:"2px 8px", borderRadius:4 }}>
                    <img src={cat.img||"/ui/shop/icons/shop-crate.png"} alt="" style={{width:11,height:11,objectFit:"contain",verticalAlign:"middle"}}/> {CAT_LABEL_KEYS[item.cat] ? t(CAT_LABEL_KEYS[item.cat]) : item.cat}
                  </span>
                  <RarezaBadge rareza={item.rareza}/>
                  {item.esNuevo && <span style={{ ...raj(9,700), color:C.green, background:`${C.green}14`,
                    border:`1px solid ${C.green}33`, padding:"2px 8px",
                    animation:"ut-newTag .5s ease both", display:"inline-flex", alignItems:"center", gap:6 }}><AssetIcon src="/ui/medals/medal-gold.png" size={11} /> {t("ti.md.nuevo")}</span>}
                  {item.limitado && <span style={{ ...raj(9,700), color:C.red, background:`${C.red}14`,
                    border:`1px solid ${C.red}33`, padding:"2px 8px" }}>{t("ti.md.limitado")}</span>}
                </div>
              </div>
              <button onClick={onClose} className="ut-btn" style={{ background:"transparent",
                border:`1px solid ${C.navyL}`, padding:7, color:C.muted, display:"flex", borderRadius:8 }}>
                <X size={15}/>
              </button>
            </div>

            {/* stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {[
                { l:t("ti.md.precio"), v:item.gratis?t("ti.md.gratis"):`${item.precio.toLocaleString()} monedas`, c:item.gratis?C.green:C.gold },
                { l:t("ti.md.stack"),  v:item.stackeable?t("ti.md.si"):t("ti.md.no"), c:item.stackeable?C.teal:C.muted },
                { l:t("ti.md.stock"),  v:item.stock?item.stock.toLocaleString():"∞", c:item.limitado?C.red:C.muted },
              ].map((s,i) => (
                <div key={i} style={{ background:C.panel, border:`1px solid ${s.c}22`,
                  padding:"10px 8px", textAlign:"center", borderRadius:8 }}>
                  <div style={{ ...orb(13,900), color:s.c, marginBottom:2 }}>{s.v}</div>
                  <div style={{ ...raj(9,500), color:C.muted }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* desc */}
            <div style={{ background:C.panel, border:`1px solid ${C.navyL}`, padding:"14px 16px", borderRadius:8 }}>
              <p style={{ ...raj(13,400), color:C.white, lineHeight:1.7, marginBottom:0 }}>{item.desc}</p>
              {item.duracion && (
                <div style={{ ...raj(11,600), color:C.muted, marginTop:8 }}>
                  ⏱ {t("ti.md.duracion")}: <span style={{ color:C.blue }}>
                    {item.duracion>=60?`${item.duracion/60}h`:`${item.duracion}min`}
                  </span>
                </div>
              )}
            </div>

            {/* efectos */}
            {item.efectos.length > 0 && (
              <div>
                <div style={{ ...raj(10,600), color:C.muted, marginBottom:8, letterSpacing:".05em" }}>
                  {t("ti.md.efectos")}
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {item.efectos.map((ef, i) => (
                    <div key={i} style={{ background:`${c}0A`, border:`1px solid ${c}33`,
                      padding:"8px 14px", display:"flex", alignItems:"center", gap:8, borderRadius:8 }}>
                      <AssetIcon src={EFFECT_ICON_ASSET[ef.tipo] || "/ui/shop/icons/shop-service.png"} size={16} />
                      <span style={{ ...raj(12,700), color:c }}>{renderEfTxt(ef, t)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* compra */}
            {item.gratis || item.requiereLogro ? (
              <div style={{ display:"flex", alignItems:"center", gap:12,
                background:`${C.muted}0A`, border:`1px solid ${C.muted}33`, padding:"14px 16px", borderRadius:8 }}>
                <Info size={16} color={C.muted}/>
                <span style={{ ...raj(12,400), color:C.mutedL, lineHeight:1.5 }}>
                  {item.requiereLogro ? t("ti.md.req_logro") : t("ti.md.req_mision")}
                </span>
              </div>
            ) : (<>
              {item.stackeable && (
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <span style={{ ...raj(13,600), color:C.muted }}>{t("ti.md.cantidad")}:</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8,
                    background:C.panel, border:`1px solid ${C.navyL}`, padding:4, borderRadius:8 }}>
                    <button onClick={() => setQty(q => Math.max(1,q-1))} className="ut-btn"
                      style={{ width:32, height:32, background:"transparent", border:"none",
                        color:C.muted, cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center", fontSize:20 }}>−</button>
                    <span style={{ ...orb(16,900), color:C.white, minWidth:32, textAlign:"center" }}>{qty}</span>
                    <button onClick={() => setQty(q => q+1)} className="ut-btn"
                      style={{ width:32, height:32, background:"transparent", border:"none",
                        color:C.muted, cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center", fontSize:20 }}>+</button>
                  </div>
                  <div style={{ ...raj(12,700), color:C.gold, marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                    <AssetIcon src="/ui/icon-gold.png" size={12} />
                    {t("ti.md.total")}: {total.toLocaleString()}
                  </div>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 0" }}>
                <div style={{ ...raj(12,600), color:C.muted }}>
                  {t("ti.md.saldo")}: <span style={{ color:canAfford?C.gold:C.red }}>{coins.toLocaleString()} monedas</span>
                </div>
                {!canAfford && <span style={{ ...raj(11,700), color:C.red }}>{t("ti.md.no_coins_warn")}</span>}
              </div>
              {buyError && (
                <div style={{ ...raj(11,600), color:C.red, background:`${C.red}14`,
                  border:`1px solid ${C.red}33`, padding:"8px 12px", borderRadius:8 }}>⚠ {buyError}</div>
              )}
              <motion.button
                whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                onClick={handleBuy} disabled={!canAfford} className="ut-btn"
                style={{ width:"100%", ...px(9), color:!canAfford?C.muted:C.bg,
                  background:!canAfford?`${C.orange}33`:`linear-gradient(90deg,${C.orange},${C.orangeL})`,
                  border:"none", padding:"15px", cursor:canAfford?"pointer":"not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  boxShadow:canAfford?`0 6px 28px ${C.orange}55`:"none" }}>
                <ShoppingCart size={14}/> {t("ti.md.comprar")} {item.stackeable&&qty>1?`(${qty})`:""}
              </motion.button>
            </>)}
          </div>
        </>)}

        {/* CONFIRM */}
        {fase === "confirm" && (
          <div style={{ padding:"32px 28px", textAlign:"center" }}>
            <div style={{ marginBottom:16, animation:"ut-float 2s ease-in-out infinite", display:"flex", justifyContent:"center" }}>
              <AssetIcon src="/ui/shop/icons/shop-contract.png" size={52} style={{filter:`drop-shadow(0 0 16px ${C.gold}66)`}} />
            </div>
            <div style={{ ...orb(14,900), color:C.white, marginBottom:8 }}>{t("ti.md.confirm_title")}</div>
            <div style={{ ...raj(13,500), color:C.muted, marginBottom:20, lineHeight:1.5 }}>
              {qty>1?`${qty}× `:""}"{item.nombre}" {t("ti.md.confirm_por")}{" "}
              <span style={{ color:C.gold }}>{total.toLocaleString()} monedas</span>
            </div>
            <div style={{ background:`${C.gold}0A`, border:`1px solid ${C.gold}33`,
              padding:"12px 16px", marginBottom:24, borderRadius:8 }}>
              {[
                [t("ti.md.confirm.saldo"), `${coins.toLocaleString()} monedas`,          C.gold],
                [t("ti.md.confirm.costo"), `−${total.toLocaleString()} monedas`,          C.red],
                [t("ti.md.confirm.resto"), `${(coins-total).toLocaleString()} monedas`,   C.gold],
              ].map(([l,v,col],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  ...raj(13,600), color:C.muted, marginTop:i?6:0,
                  borderTop:i?`1px solid ${C.navyL}`:undefined, paddingTop:i?6:0 }}>
                  <span>{l}</span><span style={{ color:col }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setFase("detail")} className="ut-btn"
                style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted,
                  background:C.panel, border:`1px solid ${C.navyL}`, padding:"12px 20px", cursor:"pointer", borderRadius:8 }}>
                {t("ti.md.cancelar")}
              </button>
              <motion.button onClick={handleConfirm} disabled={loading} className="ut-btn"
                whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                style={{ flex:1, ...px(8), color:loading?C.muted:C.bg,
                  background:loading?`${C.gold}44`:`linear-gradient(90deg,${C.gold},#FFD97D)`,
                  border:"none", padding:"12px", cursor:loading?"not-allowed":"pointer",
                  boxShadow:`0 4px 20px ${C.gold}44`,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                {loading
                  ? <><div style={{ width:13, height:13, border:`2px solid ${C.muted}`,
                      borderTop:`2px solid ${C.gold}`, borderRadius:"50%",
                      animation:"ut-spin .8s linear infinite" }}/> {t("ti.md.comprando")}</>
                  : <><Check size={14}/> {t("ti.md.confirmar")}</>}
              </motion.button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {fase === "success" && (
          <div style={{ padding:"36px 28px", textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16, animation:"ut-buy .7s ease both",
              filter:`drop-shadow(0 0 20px ${c})` }}>
              {item.imagen && !/^item_tienda_\d+$/i.test(item.imagen) ? item.imagen : "✅"}
            </div>
            <div style={{ ...orb(16,900), color:C.white, marginBottom:6 }}>{t("ti.md.ok_title")}</div>
            <div style={{ ...raj(13,500), color:C.muted, marginBottom:20 }}>
              {item.nombre} {t("ti.md.ok_sub")}
            </div>
            <div style={{ background:`${c}0A`, border:`1px solid ${c}33`, padding:16, marginBottom:24, borderRadius:8 }}>
              {item.efectos.map((ef,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                  ...raj(13,700), color:c, marginBottom:i<item.efectos.length-1?8:0 }}>
                  <AssetIcon src={EFFECT_ICON_ASSET[ef.tipo] || "/ui/shop/icons/shop-service.png"} size={18} />{renderEfTxt(ef, t)}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="ut-btn"
              style={{ width:"100%", ...px(8), color:C.bg,
                background:`linear-gradient(90deg,${c},${C.orangeL})`,
                border:"none", padding:"14px", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                boxShadow:`0 4px 20px ${c}55` }}>
              <Check size={14}/> {t("ti.md.ok_btn")}
            </button>
          </div>
        )}

        {/* NO COINS */}
        {fase === "noCoins" && (
          <div style={{ padding:"32px 28px", textAlign:"center" }}>
            <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><AssetIcon src="/ui/icon-gold.png" size={42} style={{opacity:.75}} /></div>
            <div style={{ ...orb(14,900), color:C.red, marginBottom:8 }}>{t("ti.md.nocoins_title")}</div>
            <div style={{ ...raj(13,500), color:C.muted, marginBottom:20, lineHeight:1.5 }}>
              {t("ti.md.nocoins_pre")} <span style={{ color:C.gold }}>{total.toLocaleString()} monedas</span> {t("ti.md.nocoins_pero")}{" "}
              <span style={{ color:C.red }}>{coins.toLocaleString()} monedas</span>.
            </div>
            <div style={{ background:`${C.gold}0A`, border:`1px solid ${C.gold}33`,
              padding:"14px", marginBottom:24, ...raj(12,400), color:C.mutedL, lineHeight:1.6, borderRadius:8 }}>
              {t("ti.md.nocoins_tip")}
            </div>
            <button onClick={() => setFase("detail")} className="ut-btn"
              style={{ width:"100%", ...raj(13,600), color:C.muted, background:C.panel,
                border:`1px solid ${C.navyL}`, padding:"12px", cursor:"pointer", borderRadius:8 }}>
              {t("ti.md.volver")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ITEM CARD — floating, image-first design
// ══════════════════════════════════════════════════════════════════
function ItemCard({ item, coins, owned, onClick, idx }) {
  const { t } = useLang();
  const r    = RAREZA[item.rareza] || { color:C.muted, tier:1 };
  const c    = r.color;
  const catM = CATS[item.cat] || {};
  const isEpic = r.tier >= 4;
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:18 }}
      animate={{ opacity:1, y:0   }}
      transition={{ delay:idx * .04, type:"spring", stiffness:280, damping:22 }}
      whileHover={{ y:-6 }}
      whileTap={{ scale:.97 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      onClick={onClick}
      className={isEpic ? "ut-epic-card" : ""}
      style={{
        "--ec": c,
        cursor:"pointer",
        background:`linear-gradient(135deg,${c}0D 0%,${C.card} 58%)`,
        border:`1.5px solid ${c}${isEpic?"55":"28"}`,
        boxShadow:`0 4px 18px rgba(0,0,0,.4)`,
        overflow:"hidden", position:"relative",
        display:"flex", flexDirection:"column",
        transition:"box-shadow .22s",
        borderRadius:12,
      }}
    >
      {/* hover radial glow */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1,
        background:`radial-gradient(ellipse at 50% 0%, ${c}1C, transparent 60%)`,
        opacity: hov ? 1 : 0, transition:"opacity .28s ease" }}/>
      {/* shine sweep */}
      <div className="ut-shine"/>
      {/* top accent line */}
      <div style={{ height:2.5, background:`linear-gradient(90deg,transparent,${c},transparent)`, zIndex:2, position:"relative" }}/>
      {/* category watermark */}
      <img src={catM.img||"/ui/shop/icons/shop-crate.png"} alt="" style={{position:"absolute",bottom:-6,right:-4,width:64,height:64,objectFit:"contain",opacity:.07,pointerEvents:"none",zIndex:0}}/>

      {/* image area */}
      <ItemImageBox item={item} height={112}/>

      {/* badges overlay */}
      <div style={{ position:"absolute", top:14, right:10, display:"flex",
        flexDirection:"column", gap:4, alignItems:"flex-end", zIndex:4 }}>
        {item.esNuevo && (
          <span style={{ ...raj(8,700), color:C.green, background:`${C.green}22`,
            border:`1px solid ${C.green}44`, padding:"1px 7px",
            animation:"ut-newTag .5s ease both", display:"inline-flex", alignItems:"center", gap:6 }}><AssetIcon src="/ui/medals/medal-gold.png" size={11} /> {t("ti.md.nuevo")}</span>
        )}
        {item.limitado && (
          <span style={{ ...raj(8,700), color:C.red, background:`${C.red}18`,
            border:`1px solid ${C.red}33`, padding:"1px 7px" }}>LIM</span>
        )}
        {owned && (
          <span style={{ ...raj(8,700), color:C.teal, background:`${C.teal}18`,
            border:`1px solid ${C.teal}33`, padding:"1px 7px" }}>×{owned.cantidad}</span>
        )}
      </div>

      {/* body */}
      <div style={{ padding:"12px 14px 10px", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ ...raj(13,700), color:C.white, marginBottom:6, lineHeight:1.3,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {item.nombre}
        </div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
          <span style={{ ...raj(9,700), color:catM.color||C.orange, background:`${catM.color||C.orange}14`,
            border:`1px solid ${catM.color||C.orange}33`, padding:"1px 6px", borderRadius:4 }}>
            <img src={catM.img||"/ui/shop/icons/shop-crate.png"} alt="" style={{width:10,height:10,objectFit:"contain",verticalAlign:"middle"}}/> {CAT_LABEL_KEYS[item.cat] ? t(CAT_LABEL_KEYS[item.cat]) : item.cat}
          </span>
          <RarezaBadge rareza={item.rareza} small/>
        </div>
        {/* efectos */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
          {item.efectos.slice(0,2).map((ef,i) => (
            <span key={i} style={{ ...raj(9,700), color:c, background:`${c}12`,
              border:`1px solid ${c}22`, padding:"2px 6px", borderRadius:4 }}>
              {renderEfTxt(ef, t)}
            </span>
          ))}
        </div>
        {/* C3: mission synergy hint */}
        {(() => {
          const hint = missionHint(item.efectos);
          return hint ? (
            <div style={{
              display:"flex", alignItems:"center", gap:5,
              background:`${hint.color}0E`, border:`1px solid ${hint.color}33`,
              padding:"3px 8px", marginBottom:8, borderRadius:6,
            }}>
              <AssetIcon src={hint.img || "/ui/shop/icons/shop-service.png"} size={11} />
              <span style={{ ...raj(9,700), color:hint.color }}>{t(hint.textKey)}</span>
            </div>
          ) : <div style={{ marginBottom:8 }}/>;
        })()}
        {/* desc - 2 lines */}
        <p style={{ ...raj(10,400), color:C.muted, lineHeight:1.5, flex:1, marginBottom:0,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {item.desc}
        </p>
      </div>

      {/* footer */}
      <div style={{ borderTop:`1px solid ${c}18`, padding:"10px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:item.gratis?`${C.green}06`:`${c}06` }}>
        <div style={{ ...orb(16,900), color:item.gratis?C.green:!item.gratis&&coins<item.precio?C.red:C.gold,
          textShadow:isEpic?`0 0 10px ${item.gratis?C.green:C.gold}88`:"none" }}>
          {item.gratis ? t("ti.md.gratis") : `${item.precio.toLocaleString()} monedas`}
        </div>
        {!item.gratis && !item.requiereLogro && (
          <div style={{ ...raj(11,700), color:c, display:"flex", alignItems:"center", gap:4 }}>
            {t("ti.card.comprar")} <ChevronRight size={12}/>
          </div>
        )}
        {(item.gratis || item.requiereLogro) && (
          <div style={{ ...raj(11,600), color:C.muted, display:"flex", alignItems:"center", gap:4 }}>
            <Info size={11}/> {item.requiereLogro ? t("ti.card.logro") : t("ti.card.mision")}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SKELETON CARD
// ══════════════════════════════════════════════════════════════════
function SkeletonCard() {
  return (
    <div className="ti-card" style={{pointerEvents:"none"}}>
      <div className="ti-skel" style={{height:80}}/>
      <div style={{padding:"8px 9px",display:"flex",flexDirection:"column",gap:6}}>
        <div className="ti-skel" style={{width:"70%",height:10}}/>
        <div className="ti-skel" style={{width:"50%",height:8}}/>
        <div className="ti-skel" style={{width:"40%",height:8,marginTop:4}}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// USE RESULT TOAST
// ══════════════════════════════════════════════════════════════════
function UseResultToast({ result, onDone }) {
  const { t } = useLang();
  useEffect(() => { const timer = setTimeout(onDone, 5500); return () => clearTimeout(timer); }, []);
  return (
    <motion.div
      initial={{ opacity:0, x:40 }}
      animate={{ opacity:1, x:0  }}
      exit={{    opacity:0, x:40  }}
      transition={{ type:"spring", stiffness:320, damping:28 }}
      onClick={onDone}
      style={{
        position:"fixed", bottom:24, right:24, zIndex:500, cursor:"pointer",
        background:C.card, border:`2px solid ${C.teal}55`,
        boxShadow:`0 0 40px ${C.teal}22, 0 8px 32px rgba(0,0,0,.6)`,
        padding:"18px 22px", maxWidth:320, borderRadius:14,
      }}
    >
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${C.teal},transparent)`, marginBottom:14 }}/>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ animation:"ut-useOk .6s cubic-bezier(.34,1.56,.64,1) both" }}>
          <AssetIcon src="/ui/shop/icons/shop-crate.png" size={36} style={{filter:`drop-shadow(0 0 14px ${C.teal})`}} />
        </div>
        <div>
          <div style={{ ...orb(11,900), color:C.teal, marginBottom:2 }}>{t("ti.use.title")}</div>
          <div style={{ ...raj(12,700), color:C.white }}>{result.item.nombre}</div>
        </div>
      </div>
      {result.effects?.length > 0 ? result.effects.map((ef,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6,
          background:`${C.teal}0A`, border:`1px solid ${C.teal}22`, padding:"8px 12px", borderRadius:8 }}>
          <AssetIcon src={ef.img || EFFECT_ICON_ASSET[ef.type] || "/ui/shop/icons/shop-service.png"} size={16} />
          <span style={{ ...raj(12,700), color:C.teal }}>{ef.label||ef.txt||t("ti.use.effect_default")}</span>
        </div>
      )) : (
        <div style={{ background:`${C.teal}08`, border:`1px solid ${C.teal}22`, padding:"10px 14px",
          ...raj(12,500), color:C.teal, lineHeight:1.5, marginBottom:8, borderRadius:8 }}>
          {t("ti.use.effect_ok")}
        </div>
      )}
      {result.xpGanado > 0 && (
        <div style={{ ...raj(12,700), color:C.orange, background:`${C.orange}0A`,
          border:`1px solid ${C.orange}22`, padding:"7px 12px", marginTop:4 }}>
          <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
            <AssetIcon src="/ui/icon-energy.png" size={14} />
            +{result.xpGanado} {t("ti.use.xp_suf")}
          </span>
        </div>
      )}
      {result.leveledUp && (
        <div style={{ ...orb(11,900), color:C.gold, marginTop:6, textAlign:"center",
          textShadow:`0 0 10px ${C.gold}`, animation:"ut-useOk .7s .3s ease both" }}>
          {t("ti.use.levelup_pre")} {result.level}!
        </div>
      )}
      <div style={{ ...raj(10,500), color:C.muted, marginTop:10,
        borderTop:`1px solid ${C.navyL}`, paddingTop:8 }}>
        {t("ti.use.close")}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ACTIVE BOOSTS PANEL
// ══════════════════════════════════════════════════════════════════
function fmtTime(secs) {
  if (secs <= 0) return "00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

const BOOST_COLORS = {
  xp_bonus:     C.orange,
  xp_mult:      C.gold,
  cooldown_red: C.blue,
  streak_shield:C.green,
};

function ActiveBoostsPanel({ boosts, streakShield, onExpire }) {
  const { t } = useLang();
  const scCard = (accent, r=14) => ({ background:C.card, border:`1px solid ${C.navy}`, borderTop:`2px solid ${accent}`, borderRadius:r, boxShadow:"0 4px 24px rgba(0,0,0,0.35)" });
  const [ticks,   setTicks]   = useState({});
  const [expired, setExpired] = useState(new Set());

  useEffect(() => {
    const init = {};
    for (const b of boosts) init[b.type] = b.remainingSecs;
    if (streakShield) init["streak_shield"] = streakShield.remainingSecs;
    setTicks(init); setExpired(new Set());
  }, [boosts, streakShield]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTicks(prev => {
        const next = { ...prev };
        let anyExp = false;
        for (const k of Object.keys(next)) {
          next[k] = Math.max(0, (next[k]||0) - 1);
          if (next[k] === 0) anyExp = true;
        }
        if (anyExp) setExpired(e => new Set([...e, ...Object.keys(next).filter(k => next[k]===0)]));
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (expired.size > 0 && onExpire) onExpire(); }, [expired]);

  const all = [
    ...boosts.map(b => ({ ...b, key:b.type })),
    ...(streakShield ? [{ type:"streak_shield", img:EFFECT_ICON_ASSET.streak_shield, label:`${t("ti.boost.streak_pre")} ${streakShield.days}d`, key:"streak_shield" }] : []),
  ];
  if (all.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity:0, y:-10 }}
      animate={{ opacity:1, y:0   }}
      style={{
        ...scCard(C.gold, 12),
        background:`linear-gradient(135deg, ${C.card}, ${C.navy})`,
        padding:"14px 18px", position:"relative", overflow:"hidden",
      }}
    >
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${C.gold},transparent)` }}/>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div style={{ ...orb(11,700), color:C.gold, textShadow:`0 0 10px ${C.gold}66` }}>{t("ti.boost.title")}</div>
        <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${C.gold}44,transparent)` }}/>
        <div style={{ ...raj(10,500), color:C.muted }}>{t("ti.boost.auto")}</div>
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        {all.map(b => {
          const rem     = ticks[b.key] ?? b.remainingSecs ?? 0;
          const isExp   = rem <= 0 || expired.has(b.key);
          const isClose = rem > 0 && rem < 60;
          const col     = BOOST_COLORS[b.type] || C.teal;
          const pct     = b.remainingSecs ? Math.max(0, Math.min(100, (rem/b.remainingSecs)*100)) : 100;
          return (
            <div key={b.key} style={{
              background:isExp?`${C.muted}0A`:`${col}10`,
              border:`1px solid ${isExp?C.navyL:col}${isExp?"":"44"}`,
              padding:"11px 14px", minWidth:140, flex:"1 1 140px", maxWidth:200,
              position:"relative", overflow:"hidden", opacity:isExp?.4:1, transition:"opacity .4s",
              borderRadius:8,
            }}>
              {!isExp && b.expiresAt && (
                <div style={{ position:"absolute", bottom:0, left:0, width:`${pct}%`,
                  height:2, background:isClose?C.red:col, transition:"width 1s linear" }}/>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <AssetIcon
                  src={b.img || EFFECT_ICON_ASSET[b.type] || "/ui/shop/icons/shop-service.png"}
                  size={20}
                  style={{
                    animation:isClose ? "ut-timerPulse .8s ease-in-out infinite" : "none",
                    filter:isExp ? "grayscale(1)" : `drop-shadow(0 0 6px ${col})`,
                  }}
                />
                <div>
                  <div style={{ ...raj(12,700), color:isExp?C.muted:col }}>{b.label}</div>
                  {isExp
                    ? <div style={{ ...raj(9,600), color:C.muted }}>{t("ti.boost.expired")}</div>
                    : b.expiresAt
                      ? <div style={{ ...orb(10,700), color:isClose?C.red:C.white,
                          animation:isClose?"ut-timerEnd .8s ease-in-out infinite":"none" }}>
                          {fmtTime(rem)}
                        </div>
                      : <div style={{ ...raj(9,600), color:C.muted }}>{t("ti.boost.permanent")}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BUY LEVEL SECTION
// ══════════════════════════════════════════════════════════════════
const LEVEL_PRICE   = 1000;
const LEVEL_MAX_BUY = 10;

function BuyLevelSection({ coins, profile, onSuccess }) {
  const { t } = useLang();
  const scCard = (accent, r=14) => ({ background:C.card, border:`1px solid ${C.navy}`, borderTop:`2px solid ${accent}`, borderRadius:r, boxShadow:"0 4px 24px rgba(0,0,0,0.35)" });
  const [phase,        setPhase]       = useState("idle");
  const [error,        setError]       = useState(null);
  const [localLevel,   setLocalLevel]  = useState(profile?.level ?? 1);
  const [levelsBought, setLevelsBought]= useState(profile?.levelsBoughtTotal ?? 0);

  useEffect(() => {
    setLocalLevel(profile?.level ?? 1);
    setLevelsBought(profile?.levelsBoughtTotal ?? 0);
  }, [profile?.level, profile?.levelsBoughtTotal]);

  const canAfford  = coins >= LEVEL_PRICE;
  const remaining  = LEVEL_MAX_BUY - levelsBought;
  const maxReached = remaining <= 0;
  const nextLevel  = localLevel + 1;
  const pctUsed    = (levelsBought / LEVEL_MAX_BUY) * 100;

  const handleBuy = async () => {
    setPhase("buying"); setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error(t("ti.err.session"));
      const token = await user.getIdToken();
      const res   = await buyLevel(token);
      if (!res?.ok) throw new Error(res?.message || "Error al procesar");
      setLocalLevel(res.newLevel);
      setLevelsBought(res.levelsBought);
      setPhase("done");
      onSuccess(res);
      setTimeout(() => setPhase("idle"), 2800);
    } catch (err) { setError(err.message); setPhase("idle"); }
  };

  return (
    <motion.div
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0  }}
      style={{ position:"relative", overflow:"hidden", borderRadius:16,
        background:"linear-gradient(145deg,rgba(14,10,28,.96) 0%,rgba(8,5,20,.98) 100%)",
        border:"1px solid rgba(255,255,255,.06)",
        boxShadow:"0 12px 48px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06)" }}
    >
      {/* Top accent bar */}
      <div style={{ height:2, background:`linear-gradient(90deg,${C.gold},${C.purple},${C.gold}44,transparent)` }}/>

      {/* Ambient glow blobs */}
      <div style={{ position:"absolute", top:-80, left:"10%", width:260, height:200, borderRadius:"50%",
        background:`radial-gradient(circle,${C.gold}18 0%,transparent 70%)`,
        filter:"blur(50px)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-60, right:"5%", width:200, height:180, borderRadius:"50%",
        background:`radial-gradient(circle,${C.purple}20 0%,transparent 70%)`,
        filter:"blur(44px)", pointerEvents:"none" }}/>

      {/* DESTACADO ribbon */}
      <div style={{ position:"absolute", top:14, right:-30, width:120, textAlign:"center",
        background:`linear-gradient(135deg,${C.gold},${C.orange})`,
        transform:"rotate(35deg)", font:"800 8px/1 'JetBrains Mono',monospace",
        color:"#06040f", padding:"4px 0", letterSpacing:"0.1em",
        boxShadow:`0 2px 12px ${C.gold}55`, zIndex:5, pointerEvents:"none" }}>
        {t("ti.lv.destacado")}
      </div>

      <div style={{ padding:"18px 20px 20px", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:48, height:48, borderRadius:12,
              background:`linear-gradient(135deg,${C.gold}33,${C.purple}22)`,
              border:`1px solid ${C.gold}44`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 0 20px ${C.gold}33`, animation:"ut-float 3s ease-in-out infinite" }}>
              <img src="/ui/medals/medal-gold.png" alt="" style={{ width:28, height:28, objectFit:"contain", filter:`drop-shadow(0 0 8px ${C.gold}88)` }}
                onError={e=>{e.currentTarget.style.display="none";}}/>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ font:"800 13px/1 'Manrope',sans-serif", color:"#f0eaff", letterSpacing:"0.05em", marginBottom:3 }}>{t("ti.lv.title")}</div>
            <div style={{ font:"500 10px/1 'Manrope',sans-serif", color:"#6e607e" }}>
              {t("ti.lv.sub_pre")} {LEVEL_MAX_BUY} {t("ti.lv.sub_suf")}
            </div>
          </div>
          <div style={{ flexShrink:0, font:"700 9px/1 'JetBrains Mono',monospace", letterSpacing:"0.08em",
            color: maxReached ? C.orange : C.gold,
            background: maxReached ? `${C.orange}14` : `${C.gold}14`,
            border:`1px solid ${maxReached ? C.orange : C.gold}33`,
            padding:"5px 10px", borderRadius:8 }}>
            {maxReached ? t("ti.lv.agotado") : `${remaining}/${LEVEL_MAX_BUY} ${t("ti.lv.restantes")}`}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)", marginBottom:16 }}/>

        {/* DONE state */}
        {phase === "done" ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <img src="/ui/medals/medal-gold.png" alt="" style={{ width:52, height:52, objectFit:"contain", filter:`drop-shadow(0 0 24px ${C.gold})`, animation:"ut-float 2s ease-in-out infinite", marginBottom:12 }}
              onError={e=>{e.currentTarget.style.display="none";}}/>
            <div style={{ font:"900 16px/1 'Manrope',sans-serif", color:C.gold, marginBottom:6, textShadow:`0 0 20px ${C.gold}66` }}>
              {t("ti.lv.done_pre")} {localLevel} {t("ti.lv.done_suf")}
            </div>
            <div style={{ font:"500 11px/1.4 'Manrope',sans-serif", color:"#6e607e" }}>{t("ti.lv.done_sub")}</div>
          </div>

        ) : phase === "confirm" ? (
          <div style={{ background:"rgba(6,4,14,.7)", border:"1px solid rgba(255,255,255,.07)", padding:"16px", borderRadius:12 }}>
            <div style={{ font:"700 11px/1 'JetBrains Mono',monospace", color:"#9080b0", letterSpacing:"0.1em", marginBottom:14 }}>{t("ti.lv.confirm_title")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:16 }}>
              {[
                [t("ti.lv.actual"),    `${localLevel}`,  "#f0eaff"],
                [t("ti.lv.siguiente"), `${nextLevel}`,   C.gold],
                [t("ti.lv.costo"),     `−${LEVEL_PRICE.toLocaleString()}`, C.orange],
                [t("ti.lv.resto"),     `${(coins-LEVEL_PRICE).toLocaleString()}`, coins-LEVEL_PRICE < 500 ? C.orange : C.green],
              ].map(([l,v,col]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  font:"600 11px/1 'Manrope',sans-serif", color:"#6e607e",
                  borderBottom:"1px solid rgba(255,255,255,.04)", paddingBottom:7 }}>
                  <span>{l}</span>
                  <span style={{ font:"700 12px/1 'JetBrains Mono',monospace", color:col }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setPhase("idle")}
                style={{ flex:"0 0 auto", font:"600 11px/1 'Manrope',sans-serif", color:"#6e607e",
                  background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)",
                  padding:"11px 16px", borderRadius:10, cursor:"pointer" }}>
                {t("ti.lv.cancelar")}
              </button>
              <motion.button onClick={handleBuy} disabled={phase==="buying"}
                whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                style={{ flex:1, font:"700 11px/1 'Manrope',sans-serif", color:"#06040f",
                  background:`linear-gradient(135deg,${C.gold},${C.orange})`,
                  border:"none", padding:"11px", borderRadius:10, cursor:"pointer",
                  boxShadow:`0 4px 20px ${C.gold}44`,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <img src="/ui/medals/medal-gold.png" alt="" style={{ width:14, height:14, objectFit:"contain" }} onError={e=>{e.currentTarget.style.display="none";}}/>
                {t("ti.lv.confirmar")}
              </motion.button>
            </div>
          </div>

        ) : (
          <>
            {/* Level display */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:18,
              padding:"16px", borderRadius:12,
              background:"linear-gradient(135deg,rgba(244,204,120,.06) 0%,rgba(157,78,221,.06) 100%)",
              border:"1px solid rgba(244,204,120,.1)" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ font:"600 9px/1 'JetBrains Mono',monospace", color:"#6e607e", letterSpacing:"0.1em", marginBottom:6 }}>{t("ti.lv.actual_label")}</div>
                <div style={{ font:"900 38px/1 'JetBrains Mono',monospace", color:"#f0eaff", textShadow:`0 0 20px ${C.purple}88` }}>{localLevel}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <img src="/ui/icon-energy.png" alt="" style={{ width:22, height:22, objectFit:"contain", filter:`drop-shadow(0 0 8px ${C.gold}88)`, animation:"ut-float 2s ease-in-out infinite" }}
                  onError={e=>{e.currentTarget.style.display="none";}}/>
                <div style={{ font:"700 14px/1 'JetBrains Mono',monospace", color:C.gold }}>→</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ font:"600 9px/1 'JetBrains Mono',monospace", color:C.gold, letterSpacing:"0.1em", marginBottom:6 }}>{t("ti.lv.siguiente_label")}</div>
                <div style={{ font:"900 38px/1 'JetBrains Mono',monospace", color:C.gold, textShadow:`0 0 28px ${C.gold}88` }}>{nextLevel}</div>
              </div>
            </div>

            {/* XP bar */}
            {profile?.xp !== undefined && profile?.xpNext > 0 && (
              <div style={{ marginBottom:14, padding:"12px 14px", borderRadius:10,
                background:"rgba(6,4,14,.5)", border:"1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  font:"600 9px/1 'JetBrains Mono',monospace", color:"#6e607e", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <img src="/ui/icons/stat-xp.png" alt="" style={{ width:12, height:12, objectFit:"contain", filter:`drop-shadow(0 0 4px ${C.purple}88)` }} onError={e=>{e.currentTarget.style.display="none";}}/>
                    <span>{t("ti.lv.xp_label")}</span>
                  </div>
                  <span style={{ color:C.purple, letterSpacing:"0.06em" }}>
                    {Math.min(100,Math.round((profile.xp/profile.xpNext)*100))}{t("ti.lv.xp_pct_suf")}
                  </span>
                </div>
                <div style={{ height:5, background:"rgba(255,255,255,.06)", overflow:"hidden", borderRadius:99, position:"relative" }}>
                  <div style={{ height:"100%", width:`${Math.min(100,Math.round((profile.xp/profile.xpNext)*100))}%`,
                    background:`linear-gradient(90deg,${C.purple},${C.blue})`,
                    boxShadow:`0 0 8px ${C.purple}66`, transition:"width .8s ease" }}/>
                </div>
                <div style={{ font:"500 9px/1 'Manrope',sans-serif", color:"rgba(110,96,126,.7)", marginTop:7, textAlign:"center" }}>
                  {t("ti.lv.skip_note")}
                </div>
              </div>
            )}

            {/* Price row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"10px 14px", borderRadius:10, marginBottom:10,
              background:"rgba(244,204,120,.06)", border:"1px solid rgba(244,204,120,.12)" }}>
              <span style={{ font:"600 11px/1 'Manrope',sans-serif", color:"#6e607e" }}>{t("ti.lv.precio")}</span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <img src="/ui/icon-gold.png" alt="" style={{ width:16, height:16, objectFit:"contain", filter:`drop-shadow(0 0 6px ${C.gold}88)` }} onError={e=>{e.currentTarget.style.display="none";}}/>
                <span style={{ font:"800 14px/1 'JetBrains Mono',monospace", color:C.gold, letterSpacing:"0.04em" }}>{LEVEL_PRICE.toLocaleString()}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ font:"600 11px/1 'Manrope',sans-serif", color:C.orange,
                background:`${C.orange}12`, border:`1px solid ${C.orange}30`,
                padding:"8px 12px", borderRadius:8, marginBottom:10 }}>⚠ {error}</div>
            )}

            {/* Buy button */}
            <motion.button
              onClick={()=>!maxReached && canAfford && setPhase("confirm")}
              disabled={maxReached || !canAfford}
              whileHover={!maxReached && canAfford ? { scale:1.02 } : {}}
              whileTap={!maxReached && canAfford ? { scale:.97 } : {}}
              style={{ width:"100%", font:"700 11px/1 'Manrope',sans-serif", letterSpacing:"0.06em",
                color: maxReached || !canAfford ? "#4a3d60" : "#06040f",
                background: maxReached ? "rgba(255,255,255,.04)"
                  : !canAfford ? `${C.orange}22`
                  : `linear-gradient(135deg,${C.gold},${C.orange})`,
                border: maxReached || !canAfford ? `1px solid rgba(255,255,255,.07)` : "none",
                padding:"14px", borderRadius:10,
                cursor: maxReached || !canAfford ? "not-allowed" : "pointer",
                boxShadow: !maxReached && canAfford ? `0 4px 24px ${C.gold}44` : "none",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {!maxReached && canAfford && (
                <img src="/ui/icon-energy.png" alt="" style={{ width:14, height:14, objectFit:"contain" }} onError={e=>{e.currentTarget.style.display="none";}}/>
              )}
              {maxReached ? t("ti.lv.limit")
                : !canAfford ? `${t("ti.lv.faltan_pre")} ${(LEVEL_PRICE-coins).toLocaleString()}`
                : t("ti.lv.subir")}
              {!canAfford && !maxReached && (
                <img src="/ui/icon-gold.png" alt="" style={{ width:12, height:12, objectFit:"contain", opacity:.7 }} onError={e=>{e.currentTarget.style.display="none";}}/>
              )}
            </motion.button>
          </>
        )}

        {/* Usage bar */}
        <div style={{ marginTop:16, padding:"10px 14px", borderRadius:10,
          background:"rgba(6,4,14,.4)", border:"1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <img src="/ui/shop/icons/shop-coin-stack.png" alt="" style={{ width:13, height:13, objectFit:"contain", opacity:.6 }} onError={e=>{e.currentTarget.style.display="none";}}/>
              <span style={{ font:"600 9px/1 'JetBrains Mono',monospace", color:"#6e607e", letterSpacing:"0.08em" }}>{t("ti.lv.niveles_label")}</span>
            </div>
            <span style={{ font:"700 10px/1 'JetBrains Mono',monospace", color: maxReached ? C.orange : C.gold }}>{levelsBought}/{LEVEL_MAX_BUY}</span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,.05)", overflow:"hidden", borderRadius:99 }}>
            <div style={{ height:"100%", width:`${pctUsed}%`,
              background: maxReached ? C.orange : `linear-gradient(90deg,${C.purple},${C.gold})`,
              boxShadow: maxReached ? `0 0 8px ${C.orange}` : `0 0 8px ${C.gold}55`,
              transition:"width .6s ease" }}/>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
// Small PNG avatar circle for Tienda cards
function TiendaAvatarThumb({ id, color, size=86 }) {
  const [ok, setOk] = useState(true);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background:"linear-gradient(135deg,#2A0E2E,#0B0510)",
      border:`2px solid ${color}55`, boxShadow:`0 0 20px ${color}55`,
      overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
      fontSize: size * 0.36, color, fontWeight:700,
      animation:"ut-float 3s ease-in-out infinite" }}>
      {ok ? (
        <img src={`/perfil/${id}.png`} alt={id} onError={() => setOk(false)}
          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          <AssetIcon src="/ui/crest-default.png" size={size*0.4} style={{filter:`drop-shadow(0 0 8px ${color}88)`}} />
          <span style={{ fontSize:size*0.16, color, fontWeight:700, opacity:.7 }}>
            {id.replace("avatar_","")}
          </span>
        </div>
      )}
    </div>
  );
}

// Frame preview for shop — PNG with CSS gradient ring fallback
function TiendaFrameThumb({ frameId, gradient, animated, color, outerSize=96, avatarSize=62 }) {
  const [ok, setOk] = useState(true);
  const holePct = `${Math.round((avatarSize / outerSize) * 50)}%`;
  return (
    <div style={{ position:"relative", width:outerSize, height:outerSize }}>
      {/* dark center */}
      <div style={{ position:"absolute",
        top:(outerSize-avatarSize)/2, left:(outerSize-avatarSize)/2,
        width:avatarSize, height:avatarSize, borderRadius:"50%",
        background:"linear-gradient(135deg,#1A0A28,#0B0510)" }}/>

      {/* PNG frame or CSS fallback */}
      {ok ? (
        <img src={`/marcos/${frameId}.png`} alt={frameId} onError={() => setOk(false)}
          style={{ position:"absolute", inset:0, width:outerSize, height:outerSize,
            objectFit:"fill", pointerEvents:"none" }}/>
      ) : (
        <div style={{ position:"absolute", inset:0, borderRadius:"50%",
          background: gradient,
          animation: animated ? "frame-spin 3s linear infinite" : "none",
          mask:`radial-gradient(circle at center, transparent ${holePct}, black calc(${holePct} + 2%))`,
          WebkitMask:`radial-gradient(circle at center, transparent ${holePct}, black calc(${holePct} + 2%))`,
          pointerEvents:"none" }}/>
      )}
    </div>
  );
}


function FVSPanel({ children, className="", style, p=16 }) {
  return (
    <div className={`ti-panel ${className}`} style={{ padding:p, width:"100%", minWidth:0, boxSizing:"border-box", ...style }}>
      {children}
    </div>
  );
}
function FVSHead({ children }) {
  return (
    <div className="ti-panel-head">
      <div style={{width:4,height:4,borderRadius:"50%",background:"var(--ti-ac,#c08aff)",boxShadow:"0 0 6px var(--ti-ac,#c08aff)",flexShrink:0}}/>
      <span>{children}</span>
    </div>
  );
}

// ── Caches de módulo — persisten entre montajes, se invalidan en mutaciones ───
const _shopCache = { objetos: null, ts: 0 };
const _invCache  = { items: null, ts: 0, uid: null };
const _histCache = { purchases: null, ts: 0, uid: null };
const _ctxCache  = { data: null, ts: 0, uid: null };
const _statsCache = { data: null, ts: 0, uid: null };
const _svcCache  = { titles: null, routines: null, ts: 0 };
const SHOP_TTL   = 5 * 60_000;  // 5 min
const INV_TTL    = 2 * 60_000;  // 2 min — inventario cambia solo al comprar/usar
const HIST_TTL   = 3 * 60_000;  // 3 min — historial es append-only
const CTX_TTL    = 2 * 60_000;  // 2 min — contexto del mercader
const STATS_TTL  = 2 * 60_000;  // 2 min — snapshot de progreso para sidebar
const SVC_TTL    = 5 * 60_000;  // 5 min — servicios/títulos/rutinas públicas
const invalidateUserCaches = () => { _invCache.ts = 0; _histCache.ts = 0; };

const CLASS_ICON_ASSET = {
  GUERRERO: "/ui/crest-warrior.png",
  ARQUERO: "/ui/crest-archer.png",
  MAGO: "/ui/crest-mage.png",
};

const TAB_ICON_ASSET = {
  tienda: "/ui/shop/icons/shop-contract.png",
  inventario: "/ui/shop/icons/shop-crate.png",
  historial: "/ui/shop/icons/shop-coin-stack.png",
  skins: "/ui/shop/icons/shop-cosmetic.png",
  avatares: "/ui/crest-default.png",
  servicios: "/ui/shop/icons/shop-service.png",
};

const EFFECT_ICON_ASSET = {
  xp_mult: "/ui/icons/stat-xp.png",
  xp_bonus: "/ui/icons/stat-xp.png",
  streak_shield: "/ui/header/notifications/notif-shield.png",
  xp_instant: "/ui/icon-energy.png",
  hp_recover: "/ui/icons/quest-hidratacion.png",
  level_boost: "/ui/shop/icons/shop-service.png",
  title_grant: "/ui/medals/medal-gold.png",
  unlock_class: "/ui/crest-default.png",
};

function AssetIcon({ src, alt = "", size = 16, style = {} }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, ...style }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

function normalizeLoose(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function summarizeMerchantContext(profile, statsPayload, missions = []) {
  const stats = statsPayload?.stats || statsPayload?.userStats || statsPayload?.data || {};
  const user = statsPayload?.user || profile || {};
  const streak = Number(stats.streak ?? user.streak ?? profile?.streak ?? 0);
  const level = Number(stats.nivel ?? user.level ?? profile?.level ?? 1);
  const weeklyXP = Number(stats.weeklyXP ?? user.weeklyXP ?? profile?.weeklyXP ?? 0);
  const trainedAt = stats.lastWorkoutAt || stats.lastExerciseAt || user.lastWorkoutAt || user.lastExerciseAt || profile?.lastWorkoutAt || profile?.lastExerciseAt || profile?.lastActivityAt;
  const trainedToday = Boolean(trainedAt && new Date(trainedAt).toDateString() === new Date().toDateString());

  const activeMissions = Array.isArray(missions)
    ? missions.filter((mission) => {
        const state = normalizeLoose(mission?.estado || mission?.status);
        return !mission?.reclamada && !state.includes("complet") && !state.includes("reclam");
      })
    : [];
  const claimableMissions = Array.isArray(missions)
    ? missions.filter((mission) => {
        const state = normalizeLoose(mission?.estado || mission?.status);
        return mission?.reclamable || state.includes("list") || state.includes("complet");
      })
    : [];

  const focus = [...new Set(activeMissions.flatMap((mission) => [
    mission?.tipo,
    mission?.type,
    mission?.categoria,
    mission?.category,
    mission?.zona,
    mission?.zone,
    mission?.section,
  ].map(normalizeLoose).filter(Boolean)))];

  return {
    streak,
    level,
    weeklyXP,
    trainedToday,
    activeMissionCount: activeMissions.length,
    claimableMissionCount: claimableMissions.length,
    missionFocus: focus,
  };
}

const SHOP_CLASS_BASELINES = {
  GUERRERO: { str: 86, sta: 72, spd: 48, dis: 58, men: 44 },
  ARQUERO:  { str: 56, sta: 76, spd: 88, dis: 64, men: 54 },
  MAGO:     { str: 42, sta: 62, spd: 58, dis: 68, men: 88 },
  DEFAULT:  { str: 60, sta: 60, spd: 60, dis: 60, men: 60 },
};

function clampShopStat(value) {
  return Math.max(8, Math.min(100, Math.round(Number(value) || 0)));
}

function buildShopSidebarStats({
  heroClass,
  stats = {},
  user = {},
  merchantContext = {},
  activeBoostsCount = 0,
  streakShield = null,
}) {
  const base = SHOP_CLASS_BASELINES[heroClass] || SHOP_CLASS_BASELINES.DEFAULT;
  const level = Number(stats.nivel ?? user.level ?? 1);
  const streak = Number(stats.streak ?? user.streak ?? 0);
  const weeklyXP = Number(stats.weeklyXP ?? user.weeklyXP ?? 0);
  const sessions = Number(stats.sesionesTotales ?? user.totalRutinas ?? 0);
  const missionsDone = Number(stats.misionesCompletadas ?? user.completedMissions ?? 0);
  const achievements = Number(stats.logrosObtenidos ?? (Array.isArray(user.badges) ? user.badges.length : 0) ?? 0);
  const daysActive = Number(stats.diasActivo ?? user.diasActivo ?? 0);
  const totalMinutes = Math.round(Number(stats.tiempoTotal ?? user.tiempoTotal ?? 0) / 60);
  const claimable = Number(merchantContext.claimableMissionCount || 0);
  const active = Number(merchantContext.activeMissionCount || 0);
  const focus = (merchantContext.missionFocus || []).map(normalizeLoose);
  const hasFocus = (pattern) => focus.some((entry) => pattern.test(entry));
  const levelPulse = Math.min(18, level * 2.4);
  const streakPulse = Math.min(20, streak * 2.7);
  const weeklyPulse = Math.min(18, weeklyXP / 90);
  const sessionPulse = Math.min(18, sessions * 1.35);
  const volumePulse = Math.min(16, totalMinutes / 10);
  const missionPulse = Math.min(14, missionsDone * 0.65 + claimable * 3 + active * 1.8);
  const activeDaysPulse = Math.min(12, daysActive / 3);
  const boostPulse = Math.min(10, activeBoostsCount * 3 + (streakShield ? 4 : 0));
  const achievementPulse = Math.min(12, achievements * 1.15);

  return {
    str: clampShopStat(
      base.str +
      levelPulse * 0.46 +
      sessionPulse * 0.34 +
      volumePulse * 0.26 +
      missionPulse * 0.18 +
      (hasFocus(/fuerza|funcional|calistenia|resisten/) ? 8 : 0)
    ),
    sta: clampShopStat(
      base.sta +
      levelPulse * 0.22 +
      streakPulse * 0.28 +
      volumePulse * 0.34 +
      sessionPulse * 0.22 +
      (merchantContext.trainedToday ? 5 : 0)
    ),
    spd: clampShopStat(
      base.spd +
      weeklyPulse * 0.52 +
      sessionPulse * 0.2 +
      missionPulse * 0.18 +
      (hasFocus(/cardio|hiit|movilidad|velocidad|ritmo/) ? 10 : 0)
    ),
    dis: clampShopStat(
      base.dis +
      streakPulse * 0.52 +
      activeDaysPulse * 0.32 +
      missionPulse * 0.24 +
      claimable * 2
    ),
    men: clampShopStat(
      base.men +
      boostPulse * 0.46 +
      achievementPulse * 0.28 +
      weeklyPulse * 0.16 +
      streakPulse * 0.14 +
      (hasFocus(/mente|respiracion|salud|recuper|flexi/) ? 10 : 0)
    ),
  };
}

const CLASS_ROUTINE_HINTS = {
  GUERRERO: ["fuerza", "funcional", "calistenia", "resistencia"],
  ARQUERO: ["cardio", "hiit", "movilidad", "velocidad"],
  MAGO: ["mente", "flexibilidad", "respiracion", "movilidad"],
};

const CLASS_TITLE_HINTS = {
  GUERRERO: ["guerrero", "forjado", "titan", "hierro", "llama"],
  ARQUERO: ["cazador", "veloz", "sombra", "ritmo", "precision"],
  MAGO: ["mente", "mental", "alma", "bienestar", "centinela"],
};

function normalizedEntryText(entry) {
  return normalizeLoose([
    entry?.nombre,
    entry?.name,
    entry?.titulo,
    entry?.desc,
    entry?.descripcion,
    entry?.zona,
    entry?.zone,
    entry?.categoria,
    entry?.category,
    entry?.tipo,
    entry?.type,
  ].filter(Boolean).join(" "));
}

function scoreRoutineForContext(routine, heroClass, merchantContext) {
  const text = normalizedEntryText(routine);
  let score = 0;
  for (const hint of CLASS_ROUTINE_HINTS[heroClass] || []) if (text.includes(hint)) score += 12;
  for (const focus of merchantContext.missionFocus || []) if (text.includes(focus)) score += 16;
  if (merchantContext.trainedToday && /(movilidad|flexibilidad|respiracion|mente|recuper)/.test(text)) score += 18;
  if (!merchantContext.trainedToday && /(fuerza|cardio|hiit|funcional|calistenia)/.test(text)) score += 10;
  if (merchantContext.claimableMissionCount > 0 && /(corta|rapida|breve)/.test(text)) score += 8;
  return score;
}

function scoreTitleForContext(title, heroClass, merchantContext, coins, ownedTitles = [], activeTitle = "") {
  const text = normalizedEntryText(title);
  const owned = ownedTitles.includes(title?.nombre);
  let score = owned ? 6 : 0;
  if (owned && activeTitle === title?.nombre) score -= 20;
  if (!owned && Number(title?.precio || 0) > coins) score -= 18;
  for (const hint of CLASS_TITLE_HINTS[heroClass] || []) if (text.includes(hint)) score += 10;
  for (const focus of merchantContext.missionFocus || []) if (text.includes(focus)) score += 10;
  if ((merchantContext.streak || 0) >= 5 && /(llama|leyenda|tit|elegido)/.test(text)) score += 6;
  return score;
}

function scoreMarketItemForContext(item, merchantContext, heroClass, streakShield, coins) {
  const effectTypes = Array.isArray(item?.efectos) ? item.efectos.map((ef) => ef.tipo) : [];
  const text = normalizedEntryText(item);
  const marketKind = deriveMarketKind(item);
  let score = 0;
  if (marketKind === "collectible") score -= 18;
  if (marketKind === "legacy" || marketKind === "cosmetic") score -= 40;
  if (Number(item?.precio || 0) > coins) score -= 20;
  if (!streakShield && effectTypes.includes("streak_shield")) score += 30;
  if (merchantContext.claimableMissionCount > 0 && (effectTypes.includes("xp_bonus") || effectTypes.includes("xp_mult") || effectTypes.includes("xp_instant"))) score += 16;
  if (merchantContext.trainedToday && (effectTypes.includes("hp_recover") || effectTypes.includes("cooldown_red") || effectTypes.includes("streak_shield"))) score += 18;
  if (!merchantContext.trainedToday && (effectTypes.includes("xp_bonus") || effectTypes.includes("xp_mult") || effectTypes.includes("level_boost"))) score += 12;
  for (const focus of merchantContext.missionFocus || []) if (text.includes(focus)) score += 10;
  for (const hint of CLASS_ROUTINE_HINTS[heroClass] || []) if (text.includes(hint)) score += 6;
  return score;
}

export default function UserTienda({ profile, onCoinsChange, onProfilePatch }) {
  const { t } = useLang();
  const scCard = (accent, r=14) => ({ background:C.card, border:`1px solid ${C.navy}`, borderTop:`2px solid ${accent}`, borderRadius:r, boxShadow:"0 4px 24px rgba(0,0,0,0.35)" });
  const isMobile = useIsMobile();

  // L1: persist filters across navigations
  const [cat,        setCat]       = useState(() => localStorage.getItem("ut-filter-cat")    || "Todos");
  const [search,     setSearch]    = useState("");
  const [filterRar,  setFilterRar] = useState(() => localStorage.getItem("ut-filter-rar")    || "all");
  const [sortBy,     setSortBy]    = useState(() => localStorage.getItem("ut-filter-sort")   || "nuevo");
  const [tab,        setTab]       = useState(() => localStorage.getItem("ut-active-tab")    || "tienda");
  const [itemModal,  setItemModal] = useState(null);
  const [coinAnim,   setCoinAnim]  = useState(null);

  const [coins,        setCoins]       = useState(profile?.coins ?? 0);
  const [inventario,   setInventario]  = useState([]);
  const [historial,    setHistorial]   = useState([]);
  const [objetos,      setObjetos]     = useState([]);
  const [cargando,     setCargando]    = useState(true);
  const [error,        setError]       = useState(null);
  const [skinCatalog,  setSkinCatalog] = useState([]);
  const [avatarCatalog, setAvatarCatalog] = useState([]);
  const [frameCatalog,  setFrameCatalog]  = useState([]);
  const [titleCatalog, setTitleCatalog] = useState([]);
  const [publicRoutines, setPublicRoutines] = useState([]);
  const [ownedSkins,   setOwnedSkins]  = useState(profile?.ownedSkins ?? ["default"]);
  const [skinMsg,      setSkinMsg]     = useState(null);

  const [ownedAvatars, setOwnedAvatars] = useState(profile?.ownedAvatars ?? ["avatar_01"]);
  const [ownedFrames,  setOwnedFrames]  = useState(profile?.ownedFrames  ?? []);
  const [avatarMsg,    setAvatarMsg]    = useState(null);
  const [buyingId,     setBuyingId]     = useState(null);
  const [useResult,    setUseResult]   = useState(null);
  const [usingId,      setUsingId]     = useState(null);
  const [activeBoosts, setActiveBoosts]= useState([]);
  const [streakShield, setStreakShield]= useState(null);
  const [localProfile, setLocalProfile]= useState(profile);
  const [statsSnapshot, setStatsSnapshot] = useState(null);
  const [selectedItem, setSelectedItem]= useState(null);
  const [detailFocus, setDetailFocus] = useState(null);
  const [wishlist,     setWishlist]    = useState(new Set());
  const [featuredIdx,  setFeaturedIdx] = useState(0);
  const [merchantContext, setMerchantContext] = useState(() => summarizeMerchantContext(profile, null, []));
  const [skinBuyModal,   setSkinBuyModal]   = useState(null);
  const [equippedAvatar, setEquippedAvatar] = useState(profile?.activeAvatar ?? "avatar_01");
  const [equippedFrame,  setEquippedFrame]  = useState(profile?.activeFrame  ?? null);
  const [equippedSkin,   setEquippedSkin]   = useState(profile?.activeSkin   ?? "default");
  const [ownedTitles,    setOwnedTitles]    = useState(profile?.ownedTitles ?? (profile?.titulo ? [profile.titulo] : []));
  const [activeTitle,    setActiveTitle]    = useState(profile?.titulo ?? "");
  const [titleMsg,       setTitleMsg]       = useState(null);
  const [titleBusyId,    setTitleBusyId]    = useState(null);
  const [equippingId,    setEquippingId]    = useState(null);

  const prevCoinsRef  = useRef(profile?.coins ?? 0);
  const [coinAnimKey, setCoinAnimKey]  = useState(0);
  const [coinAnimType,setCoinAnimType] = useState("gain");

  const clsColor = { GUERRERO:"#FF4757", ARQUERO:"#6BC87A", MAGO:"#4CC9F0" };
  const heroClass = (localProfile?.heroClass || profile?.heroClass || "").toUpperCase().trim();
  const myColor   = clsColor[heroClass] || "#FF4757";
  const clsCrest  = heroClass==="GUERRERO"?"warrior":heroClass==="ARQUERO"?"archer":heroClass==="MAGO"?"mage":"default";
  const clsDir    = heroClass==="GUERRERO"?"guerrero":heroClass==="ARQUERO"?"arquero":heroClass==="MAGO"?"mago":"guerrero";
  const showRightRail = !isMobile && (tab === "tienda" || tab === "servicios");
  const SHOP_CLASS_COPY = {
    GUERRERO: { lead:"Equipa al guerrero.", sub:"Fuerza, resistencia y botin para la proxima batalla." },
    ARQUERO:  { lead:"Afina tu arsenal.", sub:"Velocidad, precision y consumibles para sostener el ritmo." },
    MAGO:     { lead:"Expande tu poder.", sub:"Control, concentracion y objetos para dominar cada sesion." },
    DEFAULT:  { lead:"Explora el mercado.", sub:"Objetos, mejoras y cosmeticos para forjar tu camino." },
  };
  const shopCopy = SHOP_CLASS_COPY[heroClass] || SHOP_CLASS_COPY.DEFAULT;
  const liveAvatars = avatarCatalog.length ? avatarCatalog : AVATARS_CATALOG;
  const liveFrames = frameCatalog.length ? frameCatalog : FRAMES_CATALOG;
  const effectiveStats = statsSnapshot || {};
  const storeSidebarStats = useMemo(
    () => buildShopSidebarStats({
      heroClass,
      stats: effectiveStats,
      user: localProfile || profile || {},
      merchantContext,
      activeBoostsCount: activeBoosts.length,
      streakShield,
    }),
    [heroClass, effectiveStats, localProfile, profile, merchantContext, activeBoosts.length, streakShield]
  );
  const storeSidebarMeta = useMemo(() => ([
    { key: "level", label: "LV", value: `Lv ${Number(effectiveStats.nivel ?? localProfile?.level ?? profile?.level ?? 1)}` },
    { key: "streak", label: "RACHA", value: `${Number(effectiveStats.streak ?? localProfile?.streak ?? profile?.streak ?? 0)}d` },
    { key: "weekly", label: "XP SEM", value: `+${Number(effectiveStats.weeklyXP ?? localProfile?.weeklyXP ?? profile?.weeklyXP ?? 0).toLocaleString()}` },
    { key: "missions", label: "BOTIN", value: `${Number(merchantContext.claimableMissionCount || 0)} listo${Number(merchantContext.claimableMissionCount || 0) === 1 ? "" : "s"}` },
  ]), [effectiveStats, localProfile, profile, merchantContext.claimableMissionCount]);

  // C1: contextual subtitle for wallet banner
  const ctxMsg = (() => {
    if (merchantContext.claimableMissionCount > 0) return `${merchantContext.claimableMissionCount} ${merchantContext.claimableMissionCount>1?"misiones listas":"mision lista"} para cerrar con botin`;
    if (merchantContext.activeMissionCount > 0 && merchantContext.missionFocus.length > 0) return `El mercader ve foco en ${merchantContext.missionFocus[0]} para hoy`;
    if (activeBoosts.some((boost) => boost.type === "cooldown_red")) return "Tu apoyo del gremio y lecturas de ritmo vienen con recarga reducida";
    if (activeBoosts.length > 0)   return `${activeBoosts.length} ${activeBoosts.length>1?t("ti.ctx.boosts_n"):t("ti.ctx.boosts_1")} ${t("ti.ctx.boosts_suf")}`;
    if (streakShield)              return t("ti.ctx.shield");
    const usables = inventario.filter(i => i.consumible).reduce((s,i) => s + i.cantidad, 0);
    if (usables > 0)               return `${t("ti.ctx.usables_pre")} ${usables} ${usables>1?t("ti.ctx.usables_n"):t("ti.ctx.usables_1")}`;
    if (merchantContext.trainedToday) return "Ya entrenaste hoy: revisa recuperacion, XP o apoyo tactico";
    if (merchantContext.weeklyXP > 0) return `+${merchantContext.weeklyXP.toLocaleString()} XP esta semana en tu ruta`;
    if (coins >= LEVEL_PRICE)      return t("ti.ctx.level");
    if (coins > 0)                 return `${coins.toLocaleString()} ${t("ti.ctx.coins_suf")}`;
    return t("ti.ctx.default");
  })();

  const normalizePurchaseEntry = (entry = {}) => ({
    id: entry.id || `shop-${Date.now()}`,
    item: entry.item || entry.nombre || "Item",
    imagen: entry.imagen || "",
    cantidad: Number(entry.cantidad || 1),
    precio: Number(entry.precio ?? entry.total ?? 0),
    fecha: entry.fecha || String(entry.purchasedAt || entry.createdAt || "").slice(0, 10),
    categoria: entry.categoria || entry.cat || entry.kind || entry.source || "Mercado",
    rareza: entry.rareza || "Comun",
    source: entry.source || "",
    kind: entry.kind || "",
    type: entry.type || "",
  });

  const pushMarketHistory = (entry) => {
    setHistorial((prev) => {
      const next = [normalizePurchaseEntry(entry), ...prev];
      _histCache.purchases = next;
      _histCache.ts = Date.now();
      _histCache.uid = auth.currentUser?.uid ?? _histCache.uid;
      return next;
    });
  };

  const getResponseProfilePatch = (res, fallback = {}) => (
    res?.profilePatch && typeof res.profilePatch === "object"
      ? res.profilePatch
      : fallback
  );

  const syncShopStatsFromPatch = (patch = {}) => {
    if (!patch || typeof patch !== "object") return;
    setStatsSnapshot((prev) => {
      const next = { ...(prev || {}) };
      if (patch.level !== undefined) next.nivel = Number(patch.level || 1);
      if (patch.xp !== undefined) next.xp = Number(patch.xp || 0);
      if (patch.xpTotal !== undefined) next.xpTotal = Number(patch.xpTotal || 0);
      if (patch.streak !== undefined) next.streak = Number(patch.streak || 0);
      if (patch.coins !== undefined) next.coins = Number(patch.coins || 0);
      if (patch.heroClass !== undefined) next.heroClass = patch.heroClass || "GUERRERO";
      if (patch.hp !== undefined) next.hp = Number(patch.hp || 100);
      if (patch.weeklyXP !== undefined) next.weeklyXP = Number(patch.weeklyXP || 0);
      if (patch.sesionesTotales !== undefined) next.sesionesTotales = Number(patch.sesionesTotales || 0);
      if (patch.misionesCompletadas !== undefined) next.misionesCompletadas = Number(patch.misionesCompletadas || 0);
      if (patch.logrosObtenidos !== undefined) next.logrosObtenidos = Number(patch.logrosObtenidos || 0);
      if (patch.diasActivo !== undefined) next.diasActivo = Number(patch.diasActivo || 0);
      if (patch.tiempoTotal !== undefined) next.tiempoTotal = Number(patch.tiempoTotal || 0);
      return Object.keys(next).length ? next : prev;
    });
  };

  const applyCanonicalStatsPayload = (payload = {}) => {
    const stats = payload?.stats || null;
    const userData = payload?.user || {};
    if (stats) setStatsSnapshot(stats);
    const patch = {
      ...userData,
      ...(stats?.coins !== undefined ? { coins: Number(stats.coins || 0) } : {}),
      ...(stats?.nivel !== undefined ? { level: Number(stats.nivel || 1) } : {}),
      ...(stats?.xp !== undefined ? { xp: Number(stats.xp || 0) } : {}),
      ...(stats?.xpTotal !== undefined ? { xpTotal: Number(stats.xpTotal || 0) } : {}),
      ...(stats?.streak !== undefined ? { streak: Number(stats.streak || 0) } : {}),
      ...(stats?.heroClass ? { heroClass: stats.heroClass } : {}),
      ...(stats?.hp !== undefined ? { hp: Number(stats.hp || 100) } : {}),
      ...(stats?.weeklyXP !== undefined ? { weeklyXP: Number(stats.weeklyXP || 0) } : {}),
      ...(stats?.sesionesTotales !== undefined ? { totalRutinas: Number(stats.sesionesTotales || 0) } : {}),
      ...(stats?.misionesCompletadas !== undefined ? { completedMissions: Number(stats.misionesCompletadas || 0) } : {}),
      ...(stats?.logrosObtenidos !== undefined ? { logrosObtenidos: Number(stats.logrosObtenidos || 0) } : {}),
      ...(stats?.diasActivo !== undefined ? { diasActivo: Number(stats.diasActivo || 0) } : {}),
      ...(stats?.tiempoTotal !== undefined ? { tiempoTotal: Number(stats.tiempoTotal || 0) } : {}),
    };
    if (Object.keys(patch).length) {
      syncVisualStateFromPatch(patch);
      applyLocalProfilePatch(patch);
    }
  };

  const applyLocalProfilePatch = (patch = {}) => {
    if (!patch || typeof patch !== "object") return;
    setLocalProfile((prev) => ({ ...(prev || {}), ...patch }));
    if (onProfilePatch) onProfilePatch(patch);
  };

  const syncVisualStateFromPatch = (patch = {}) => {
    if (!patch || typeof patch !== "object") return;
    if (patch.coins !== undefined) {
      setCoins(patch.coins);
      if (onCoinsChange) onCoinsChange(patch.coins);
    }
    if (patch.ownedSkins !== undefined) setOwnedSkins(patch.ownedSkins || ["default"]);
    if (patch.activeSkin !== undefined) setEquippedSkin(patch.activeSkin || "default");
    if (patch.ownedAvatars !== undefined) setOwnedAvatars(patch.ownedAvatars || ["avatar_01"]);
    if (patch.activeAvatar !== undefined) setEquippedAvatar(patch.activeAvatar || "avatar_01");
    if (patch.ownedFrames !== undefined) setOwnedFrames(patch.ownedFrames || []);
    if (patch.activeFrame !== undefined) setEquippedFrame(patch.activeFrame ?? null);
    if (patch.ownedTitles !== undefined) setOwnedTitles(Array.isArray(patch.ownedTitles) ? patch.ownedTitles : []);
    if (patch.titulo !== undefined) setActiveTitle(patch.titulo || "");
    if (patch.streakShield !== undefined) setStreakShield(patch.streakShield || null);
    if (patch.level !== undefined) {
      setMerchantContext((prev) => ({ ...(prev || {}), level: Number(patch.level || prev?.level || 1) }));
    }
  };

  const applyStoreProfilePatch = (patch = {}) => {
    if (!patch || typeof patch !== "object") return;
    syncVisualStateFromPatch(patch);
    syncShopStatsFromPatch(patch);
    applyLocalProfilePatch(patch);
  };

  const emitProfileUpdated = (patch = {}, extra = {}) => {
    window.dispatchEvent(new CustomEvent("profileUpdated", {
      detail: { ...(patch || {}), ...(extra || {}) },
    }));
  };

  const syncMerchantContext = async (token, uid, { force = false } = {}) => {
    const now = Date.now();
    if (!force && _ctxCache.data && _ctxCache.uid === uid && (now - _ctxCache.ts) < CTX_TTL) {
      setMerchantContext(_ctxCache.data);
      return _ctxCache.data;
    }

    const [statsRes, missionsRes] = await Promise.allSettled([
      getUserStats(token),
      getMisionesUsuario(token),
    ]);

    const statsPayload = statsRes.status === "fulfilled" && statsRes.value?.ok ? statsRes.value : null;
    if (statsPayload) {
      _statsCache.data = statsPayload;
      _statsCache.ts = now;
      _statsCache.uid = uid;
      applyCanonicalStatsPayload(statsPayload);
    }
    const missionsPayload = missionsRes.status === "fulfilled" && missionsRes.value?.ok
      ? (missionsRes.value.missions || missionsRes.value.misiones || [])
      : [];
    const next = summarizeMerchantContext(profile, statsPayload, missionsPayload);
    _ctxCache.data = next;
    _ctxCache.ts = now;
    _ctxCache.uid = uid;
    setMerchantContext(next);
    return next;
  };

  const refreshSidebarProgress = async ({ force = false, includeContext = false } = {}) => {
    const user = auth.currentUser;
    if (!user) return null;
    const now = Date.now();

    if (!force && _statsCache.data && _statsCache.uid === user.uid && (now - _statsCache.ts) < STATS_TTL) {
      applyCanonicalStatsPayload(_statsCache.data);
      if (includeContext) {
        await syncMerchantContext(await user.getIdToken(), user.uid, { force: false });
      }
      return _statsCache.data;
    }

    try {
      const token = await user.getIdToken();
      if (includeContext) {
        await syncMerchantContext(token, user.uid, { force });
        return _statsCache.data;
      }
      const statsRes = await getUserStats(token);
      if (statsRes?.ok) {
        _statsCache.data = statsRes;
        _statsCache.ts = Date.now();
        _statsCache.uid = user.uid;
        applyCanonicalStatsPayload(statsRes);
      }
      return statsRes;
    } catch {
      return null;
    }
  };

  const focusItemDetail = (item, { manual = true } = {}) => {
    if (!item) return;
    setSelectedItem(item);
    setDetailFocus({ type: "item", id: item.id, manual });
  };

  const focusRoutineDetail = (routine, { manual = true } = {}) => {
    if (!routine) return;
    setDetailFocus({ type: "routine", id: routine.id || routine.nombre || routine.name, manual });
  };

  const focusTitleDetail = (titleEntry, { manual = true } = {}) => {
    if (!titleEntry) return;
    setDetailFocus({ type: "title", id: titleEntry.id || titleEntry.nombre, manual });
  };

  useEffect(() => {
    if (profile?.coins         !== undefined) setCoins(profile.coins);
  }, [profile?.coins]);

  useEffect(() => {
    setLocalProfile((prev) => ({ ...(prev || {}), ...(profile || {}) }));
  }, [profile]);

  useEffect(() => {
    if (profile?.activeAvatar  !== undefined) setEquippedAvatar(profile.activeAvatar);
    if (profile?.activeFrame   !== undefined) setEquippedFrame(profile.activeFrame);
    if (profile?.activeSkin    !== undefined) setEquippedSkin(profile.activeSkin);
    if (profile?.ownedAvatars  !== undefined) setOwnedAvatars(profile.ownedAvatars);
    if (profile?.ownedFrames   !== undefined) setOwnedFrames(profile.ownedFrames);
    if (profile?.ownedSkins    !== undefined) setOwnedSkins(profile.ownedSkins);
    if (Array.isArray(profile?.ownedTitles)) setOwnedTitles(profile.ownedTitles);
    else if (profile?.titulo) setOwnedTitles((prev) => prev.length ? prev : [profile.titulo]);
    if (profile?.titulo !== undefined) setActiveTitle(profile.titulo || "");
  }, [profile?.activeAvatar, profile?.activeFrame, profile?.activeSkin,
      profile?.ownedAvatars, profile?.ownedFrames, profile?.ownedSkins, profile?.ownedTitles, profile?.titulo]);

  useEffect(() => {
    if (prevCoinsRef.current !== coins) {
      setCoinAnimType(coins > prevCoinsRef.current ? "gain" : "loss");
      setCoinAnimKey(k => k+1);
      prevCoinsRef.current = coins;
    }
  }, [coins]);

  // L4: listen for XP events from other pages — refresh boosts + sync coins
  useEffect(() => {
    const onXP = async (e) => {
      const detail = e.detail || {};
      // Sync coins if the event carries a new balance (profile patch)
      if (detail.coins !== undefined) {
        setCoins(detail.coins);
      }
      syncShopStatsFromPatch(detail);
      // Re-fetch active boosts whenever XP or level changes (a boost may have activated)
      if (detail.xp > 0 || detail.leveledUp || detail.source === "tienda") {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const token = await user.getIdToken();
          const bRes  = await getActiveBoosts(token);
          if (bRes?.ok) {
            setActiveBoosts(bRes.boosts || []);
            setStreakShield(bRes.streakShield || null);
          }
          _statsCache.ts = 0;
          await refreshSidebarProgress({ force: true, includeContext: true });
        } catch {}
      }
    };
    window.addEventListener("exerciseCompleted", onXP);
    return () => window.removeEventListener("exerciseCompleted", onXP);
  }, []);

  useEffect(() => {
    const onProfileUpdated = async (e) => {
      const detail = e.detail || {};
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      if (detail.uid && detail.uid !== uid) return;
      applyStoreProfilePatch(detail);

      const meaningful =
        detail.forceStats ||
        detail.level !== undefined ||
        detail.xp !== undefined ||
        detail.xpTotal !== undefined ||
        detail.streak !== undefined ||
        detail.heroClass !== undefined ||
        detail.source === "misiones" ||
        detail.source === "rutinas" ||
        detail.source === "perfil" ||
        detail.source === "logros" ||
        detail.source === "tienda";

      if (meaningful) {
        _statsCache.ts = 0;
        await refreshSidebarProgress({ force: true, includeContext: detail.source !== "tienda" });
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshSidebarProgress({ includeContext: true });
      }
    };

    window.addEventListener("profileUpdated", onProfileUpdated);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      window.removeEventListener("profileUpdated", onProfileUpdated);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [profile?.uid]);

  // L1: sync filter state → localStorage
  useEffect(() => { localStorage.setItem("ut-filter-cat",  cat);    }, [cat]);
  useEffect(() => { localStorage.setItem("ut-filter-rar",  filterRar); }, [filterRar]);
  useEffect(() => { localStorage.setItem("ut-filter-sort", sortBy);  }, [sortBy]);
  useEffect(() => { localStorage.setItem("ut-active-tab",  tab);    }, [tab]);

  // ── Wishlist: persiste en Firebase con debounce 1.5s ─────────────────────────
  const _wishlistTimer = useRef(null);
  useEffect(() => {
    if (_wishlistTimer.current) clearTimeout(_wishlistTimer.current);
    _wishlistTimer.current = setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        await saveWishlist(token, [...wishlist]);
      } catch { /* silencioso — wishlist es best-effort */ }
    }, 1500);
    return () => { if (_wishlistTimer.current) clearTimeout(_wishlistTimer.current); };
  }, [wishlist]);

  // ── Load all data ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setCargando(true); setError(null);
        const user = auth.currentUser;
        if (!user) { setObjetos([]); setCargando(false); setError(t("ti.err.login")); return; }
        const uid   = user.uid;
        const token = await user.getIdToken();
        const now   = Date.now();

        // Determinar qué caches están frescos — evita reads de Firestore redundantes
        const catalogFresh = _shopCache.objetos && (now - _shopCache.ts) < SHOP_TTL;
        const invFresh     = _invCache.items    && _invCache.uid === uid && (now - _invCache.ts) < INV_TTL;
        const histFresh    = _histCache.purchases && _histCache.uid === uid && (now - _histCache.ts) < HIST_TTL;

        if (catalogFresh) setObjetos(_shopCache.objetos);
        if (invFresh)     setInventario(_invCache.items);
        if (histFresh)    setHistorial(_histCache.purchases);
        const statsFresh = _statsCache.data && _statsCache.uid === uid && (now - _statsCache.ts) < STATS_TTL;
        if (statsFresh) applyCanonicalStatsPayload(_statsCache.data);

        const ctxFresh = _ctxCache.data && _ctxCache.uid === uid && (now - _ctxCache.ts) < CTX_TTL;
        const servicesFresh = _svcCache.ts && (now - _svcCache.ts) < SVC_TTL;
        if (ctxFresh) setMerchantContext(_ctxCache.data);
        if (servicesFresh) {
          setTitleCatalog(_svcCache.titles || []);
          setPublicRoutines(_svcCache.routines || []);
        }

        const [objetosRes, invRes, histRes, boostsRes, avatarCatalogRes, ctxRes, servicesRes] = await Promise.allSettled([
          catalogFresh
            ? Promise.resolve({ ok: true, _cached: true })
            : getObjetosPublic(token),
          invFresh
            ? Promise.resolve({ ok: true, _cached: true })
            : getInventario(token),
          histFresh
            ? Promise.resolve({ ok: true, _cached: true })
            : getPurchases(token),
          getActiveBoosts(token), // siempre fresco — incluye wishlist y boosts activos
          getAvatarCatalog(),
          ctxFresh
            ? Promise.resolve({ ok: true, _cached: true, data: _ctxCache.data })
            : syncMerchantContext(token, uid),
          servicesFresh
            ? Promise.resolve({ ok: true, _cached: true, titles: _svcCache.titles || [], routines: _svcCache.routines || [] })
            : Promise.allSettled([getTitlesCatalog(), getRutinasPublicas(token)]),
        ]);

        if (objetosRes.status === "fulfilled" && objetosRes.value?.ok && !objetosRes.value._cached) {
          const normalized = (objetosRes.value.objetos || []).map(normalizeObjeto);
          setObjetos(normalized);
          _shopCache.objetos = normalized;
          _shopCache.ts = now;
        }

        if (invRes.status === "fulfilled" && invRes.value?.ok && !invRes.value._cached) {
          const items = (invRes.value.items || []).map(normalizeObjeto);
          setInventario(items);
          _invCache.items = items; _invCache.ts = now; _invCache.uid = uid;
        }

        if (histRes.status === "fulfilled" && histRes.value?.ok && !histRes.value._cached) {
          const p = (histRes.value.purchases || []).map((entry) => normalizePurchaseEntry(entry));
          setHistorial(p);
          _histCache.purchases = p; _histCache.ts = now; _histCache.uid = uid;
        }

        if (boostsRes.status === "fulfilled" && boostsRes.value?.ok) {
          setActiveBoosts(boostsRes.value.boosts || []);
          setStreakShield(boostsRes.value.streakShield || null);
          // wishlist viene gratis en el mismo read del user doc
          const wl = boostsRes.value.wishlist;
          setWishlist(new Set(Array.isArray(wl) ? wl : []));
        }

        if (avatarCatalogRes.status === "fulfilled" && avatarCatalogRes.value?.ok) {
          if (Array.isArray(avatarCatalogRes.value.avatars)) setAvatarCatalog(avatarCatalogRes.value.avatars);
          if (Array.isArray(avatarCatalogRes.value.frames)) setFrameCatalog(avatarCatalogRes.value.frames);
        }

        if (ctxRes.status === "fulfilled" && ctxRes.value && !ctxRes.value?._cached) {
          setMerchantContext(ctxRes.value);
        }

        if (servicesRes.status === "fulfilled") {
          if (Array.isArray(servicesRes.value)) {
            const [titlesRes, routinesRes] = servicesRes.value;
            const nextTitles = titlesRes.status === "fulfilled" && titlesRes.value?.ok ? (titlesRes.value.titles || []) : [];
            const nextRoutines = routinesRes.status === "fulfilled" && routinesRes.value?.ok ? (routinesRes.value.rutinas || routinesRes.value.routines || []) : [];
            setTitleCatalog(nextTitles);
            setPublicRoutines(nextRoutines);
            _svcCache.titles = nextTitles;
            _svcCache.routines = nextRoutines;
            _svcCache.ts = now;
          } else if (servicesRes.value?.ok && servicesRes.value?._cached) {
            setTitleCatalog(servicesRes.value.titles || []);
            setPublicRoutines(servicesRes.value.routines || []);
          }
        }
      } catch (err) {
        setError(t("ti.err.buy_fail") + " " + t("ti.err.network"));
      } finally { setCargando(false); }
    })();
  }, []);

  useEffect(() => {
    getSkins()
      .then(res => { if (res?.ok) setSkinCatalog(res.skins); })
      .catch(() => {});
  }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleBuy = async (item, qty, total) => {
    if (coins < total) return false;
    try {
      const user = auth.currentUser;
      if (!user) { setError(t("ti.err.login_buy")); return false; }
      const token = await user.getIdToken();
      const res   = await buyObjeto(token, item.id, qty);
      if (!res?.ok) { setError(res?.message || t("ti.err.buy_fail")); return false; }

      const newCoins = res.coins !== undefined ? res.coins : coins - total;
      const profilePatch = getResponseProfilePatch(res, { coins: newCoins });
      applyStoreProfilePatch(profilePatch);
      // Invalidar caches — inventario y historial cambiaron en Firestore
      invalidateUserCaches();
      if (item.limitado) _shopCache.ts = 0;
      setCoinAnim(total);
      setInventario(prev => {
        const ex = prev.find(i => i.id === item.id);
        if (ex && item.stackeable) return prev.map(i => i.id===item.id ? { ...i, cantidad:i.cantidad+qty } : i);
        return [...prev, { id:item.id, nombre:item.nombre, imagen:item.imagen, cantidad:qty,
          cat:item.cat, rareza:item.rareza, precio:item.precio,
          consumible:item.consumible, efectos:item.efectos, stackeable:item.stackeable }];
      });
      pushMarketHistory({
        id:`h${Date.now()}`, item:item.nombre, imagen:item.imagen,
        cantidad:qty, precio:total, fecha:new Date().toISOString().slice(0,10),
        categoria:"Mercado", rareza:item.rareza || "Comun",
      });
      emitProfileUpdated(profilePatch, {
        source: "tienda",
        itemId: item.id,
        category: item.cat || item.categoria || "mercado",
      });
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: { ...profilePatch, itemId: item.id, qty, category: item.cat || item.categoria || "mercado" },
      }));
      return true;
    } catch { setError(t("ti.err.buy_err")); return false; }
  };

  const handleBuySkin = async (skin) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res   = await purchaseSkin(token, skin.id);
      if (!res?.ok) { setSkinMsg({ ok:false, text:res?.message||t("ti.err.buy_err") }); return; }
      const profilePatch = getResponseProfilePatch(res, {
        coins: res.coins,
        ownedSkins: res.ownedSkins,
        activeSkin: localProfile?.activeSkin ?? equippedSkin,
      });
      applyStoreProfilePatch(profilePatch);
      invalidateUserCaches();
      pushMarketHistory({
        id:`skin-${skin.id}-${Date.now()}`,
        item:skin.nombre || skin.name || "Skin",
        imagen:skin.preview || skin.id || "",
        cantidad:1,
        precio:Number(skin.precio || 0),
        fecha:new Date().toISOString().slice(0,10),
        categoria:"Cosmetico",
        rareza:skin.rareza || "Epico",
      });
      emitProfileUpdated(profilePatch, {
        source: "tienda",
        skinId: skin.id,
        category: "skin",
      });
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: { ...profilePatch, skinId: skin.id, category: "skin" },
      }));
      setSkinMsg({ ok:true, text:`¡"${skin.nombre}" ${t("ti.sk.buy_ok_suf")}` });
      setTimeout(() => setSkinMsg(null), 4000);
    } catch { setSkinMsg({ ok:false, text:t("ti.err.network") }); }
  };

  const handleBuyAvatarItem = async (item) => {
    if (buyingId) return;
    setBuyingId(item.id);
    try {
      const user = auth.currentUser;
      if (!user) { setBuyingId(null); return; }
      const token = await user.getIdToken();
      const res   = await purchaseAvatarItem(token, item.id);
      if (!res?.ok) {
        setAvatarMsg({ ok:false, text: res?.message || t("ti.err.buy_err") });
        setTimeout(() => setAvatarMsg(null), 4000);
        return;
      }
      const newOwnedAvatars = res.ownedAvatars ?? ownedAvatars;
      const newOwnedFrames  = res.ownedFrames  ?? ownedFrames;
      const profilePatch = getResponseProfilePatch(res, {
        coins: res.coins,
        ownedAvatars: newOwnedAvatars,
        ownedFrames: newOwnedFrames,
      });
      applyStoreProfilePatch(profilePatch);
      invalidateUserCaches();
      pushMarketHistory({
        id:`cosmetic-${item.id}-${Date.now()}`,
        item:item.nombre || item.name || "Cosmetico",
        imagen:item.id || "",
        cantidad:1,
        precio:Number(item.precio || 0),
        fecha:new Date().toISOString().slice(0,10),
        categoria:"Cosmetico",
        rareza:item.rareza || "Raro",
      });
      emitProfileUpdated(profilePatch, {
        source: "tienda",
        itemId: item.id,
        category: item.type || "cosmetic",
      });
      // Propagate to parent dashboard so UserPerfil gets fresh data on mount
      // Also broadcast for already-mounted UserPerfil
      window.dispatchEvent(new CustomEvent("avatarPurchased", {
        detail: { ...profilePatch },
      }));
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: { ...profilePatch, itemId: item.id, category: item.type || "cosmetic" },
      }));
      const isFrame = item.id.startsWith("marco_");
      setAvatarMsg({ ok:true, text:`¡"${item.nombre}" ${t(isFrame ? "ti.fr.buy_ok_suf" : "ti.av.buy_ok_suf")}` });
      setTimeout(() => setAvatarMsg(null), 5000);
    } catch (err) {
      setAvatarMsg({ ok:false, text: err?.message || t("ti.err.buy_err") });
      setTimeout(() => setAvatarMsg(null), 4000);
    } finally {
      setBuyingId(null);
    }
  };

  const handleBuyTitle = async (titleEntry) => {
    if (titleBusyId) return;
    setTitleBusyId(titleEntry.id);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await buyTitle(token, titleEntry.nombre);
      if (!res?.ok) {
        setTitleMsg({ ok: false, text: res?.message || t("ti.err.buy_err") });
        setTimeout(() => setTitleMsg(null), 4000);
        return;
      }
      const profilePatch = getResponseProfilePatch(res, { coins: res.coins, ownedTitles: res.ownedTitles || [] });
      applyStoreProfilePatch(profilePatch);
      invalidateUserCaches();
      pushMarketHistory({
        id:`title-${titleEntry.id}-${Date.now()}`,
        item:titleEntry.nombre,
        imagen:titleEntry.id,
        cantidad:1,
        precio:Number(titleEntry.precio || 0),
        fecha:new Date().toISOString().slice(0,10),
        categoria:"Coleccion",
        rareza:titleEntry.rareza || "Raro",
      });
      emitProfileUpdated(profilePatch, {
        source: "tienda",
        title: titleEntry.nombre,
        category: "title",
      });
      window.dispatchEvent(new CustomEvent("titlePurchased", {
        detail: { ...profilePatch, title: titleEntry.nombre },
      }));
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: { ...profilePatch, title: titleEntry.nombre, category: "title" },
      }));
      setTitleMsg({ ok: true, text: `Titulo "${titleEntry.nombre}" agregado a tu ficha.` });
      setTimeout(() => setTitleMsg(null), 4000);
    } catch (err) {
      setTitleMsg({ ok: false, text: err?.message || t("ti.err.network") });
      setTimeout(() => setTitleMsg(null), 4000);
    } finally {
      setTitleBusyId(null);
    }
  };

  const handleEquipTitle = async (titleName) => {
    if (titleBusyId) return;
    setTitleBusyId(titleName || "clear-title");
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await equipTitle(token, titleName || "");
      if (!res?.ok) {
        setTitleMsg({ ok: false, text: res?.message || t("ti.err.buy_err") });
        setTimeout(() => setTitleMsg(null), 4000);
        return;
      }
      const profilePatch = getResponseProfilePatch(res, { titulo: res.titulo || "" });
      applyStoreProfilePatch(profilePatch);
      emitProfileUpdated(profilePatch, { source: "tienda", category: "title_equip" });
      window.dispatchEvent(new CustomEvent("titleEquipped", { detail: { ...profilePatch } }));
      setTitleMsg({ ok: true, text: res.titulo ? `Titulo activo: ${res.titulo}` : "Titulo retirado de la ficha." });
      setTimeout(() => setTitleMsg(null), 3200);
    } catch (err) {
      setTitleMsg({ ok: false, text: err?.message || t("ti.err.network") });
      setTimeout(() => setTitleMsg(null), 4000);
    } finally {
      setTitleBusyId(null);
    }
  };

  // ── Equipar cosmético: avatar ─────────────────────────────────────────────
  const handleEquipAvatar = async (av) => {
    if (equippingId) return;
    setEquippingId(av.id);
    try {
      const user = auth.currentUser; if (!user) return;
      const token = await user.getIdToken();
      const res   = await apiSetActiveAvatar(token, av.id);
      if (!res?.ok) return;
      const patch = getResponseProfilePatch(res, { activeAvatar: av.id });
      applyStoreProfilePatch(patch);
      emitProfileUpdated(patch, { source: "tienda", category: "avatar_equip" });
      window.dispatchEvent(new CustomEvent("avatarEquipped", { detail: patch }));
    } catch {} finally { setEquippingId(null); }
  };

  // ── Equipar cosmético: marco ──────────────────────────────────────────────
  const handleEquipFrame = async (fr) => {
    if (equippingId) return;
    const targetId = fr?.id ?? null;
    setEquippingId(targetId ?? "none");
    try {
      const user = auth.currentUser; if (!user) return;
      const token = await user.getIdToken();
      const res   = await apiSetActiveFrame(token, targetId);
      if (!res?.ok) return;
      const patch = getResponseProfilePatch(res, { activeFrame: targetId });
      applyStoreProfilePatch(patch);
      emitProfileUpdated(patch, { source: "tienda", category: "frame_equip" });
      window.dispatchEvent(new CustomEvent("avatarEquipped", { detail: patch }));
    } catch {} finally { setEquippingId(null); }
  };

  // ── Equipar cosmético: skin ───────────────────────────────────────────────
  const handleEquipSkin = async (skin) => {
    if (equippingId) return;
    setEquippingId(skin.id);
    try {
      const user = auth.currentUser; if (!user) return;
      const token = await user.getIdToken();
      const res   = await apiSetActiveSkin(token, skin.id);
      if (!res?.ok) return;
      const patch = getResponseProfilePatch(res, { activeSkin: skin.id });
      applyStoreProfilePatch(patch);
      emitProfileUpdated(patch, { source: "tienda", category: "skin_equip" });
      window.dispatchEvent(new CustomEvent("skinChanged", { detail: patch }));
    } catch {} finally { setEquippingId(null); }
  };

  const handleUse = async (item) => {
    if (usingId === item.id) return;
    const user = auth.currentUser;
    if (!user) return;
    if (!isSupportedUseItem(item)) {
      setError(item.retiredReason || "Este objeto ya no se usa desde el mercado actual.");
      return;
    }
    const isSingleUse = item.usoUnico === true || (item.consumible && item.cantidad <= 1);
    setInventario(prev => isSingleUse ? prev.filter(i => i.id!==item.id)
      : prev.map(i => i.id===item.id ? { ...i, cantidad:i.cantidad-1 } : i));
    setUsingId(item.id);
    try {
      const token = await user.getIdToken();
      const res   = await useObjeto(token, item.id);
      if (!res?.ok) {
        setInventario(prev => {
          const ex = prev.find(i => i.id===item.id);
          if (ex) return prev.map(i => i.id===item.id ? { ...i, cantidad:i.cantidad+1 } : i);
          return [...prev, item];
        });
        setError(res?.message || t("ti.err.use_fail"));
        return;
      }
      if (res.cantidad !== undefined) {
        setInventario(prev => {
          if (res.cantidad <= 0) return prev.filter(i => i.id!==item.id);
          const ex = prev.find(i => i.id===item.id);
          if (ex) return prev.map(i => i.id===item.id ? { ...i, cantidad:res.cantidad } : i);
          return [...prev, { ...item, cantidad:res.cantidad }];
        });
      }
      setUseResult({ item, effects:res.effects||[], xpGanado:res.xpGanado||0, leveledUp:res.leveledUp, level:res.level });
      const previousLevel = Number(localProfile?.level ?? profile?.level ?? 1);
      const resultingLevel = Number(res.profilePatch?.level ?? res.level ?? previousLevel);
      const levelsGained = res.leveledUp ? Math.max(1, resultingLevel - previousLevel) : 0;
      if (res.profilePatch) {
        applyStoreProfilePatch(res.profilePatch);
      }
      if (Array.isArray(res.activeBoosts)) {
        setActiveBoosts(res.activeBoosts);
      }
      if (res.streakShield !== undefined) {
        setStreakShield(res.streakShield || null);
      }
      emitProfileUpdated(res.profilePatch || {}, {
        source: "tienda",
        category: "item_use",
        itemId: item.id,
        itemName: item.nombre,
        activeBoosts: res.activeBoosts || [],
        streakShield: res.streakShield || null,
        effects: res.effects || [],
      });
      window.dispatchEvent(new CustomEvent("itemUsed", {
        detail: {
          source: "tienda",
          itemId: item.id,
          itemName: item.nombre,
          xp: res.xpGanado || 0,
          leveledUp: !!res.leveledUp,
          newLevel: resultingLevel,
          xpNext: res.xpNext || res.profilePatch?.xpNext || null,
          levelsGained,
          effects: res.effects || [],
          activeBoosts: res.activeBoosts || [],
          streakShield: res.streakShield || null,
          profilePatch: res.profilePatch || {},
        },
      }));
      // L2: dispatch with real XP/level data so Dashboard + HUD update correctly
      if (res.xpGanado > 0 || res.leveledUp) {
        window.dispatchEvent(new CustomEvent("exerciseCompleted", {
          detail: {
            xp:       res.xpGanado  || 0,
            leveledUp:res.leveledUp || false,
            newLevel: resultingLevel || null,
            xpNext:   res.xpNext    || null,
            levelsGained,
            source:   "tienda",
          },
        }));
      }
      pushMarketHistory({
        id:`use-${item.id}-${Date.now()}`,
        item:item.nombre,
        imagen:item.imagen || "",
        cantidad:1,
        precio:0,
        fecha:new Date().toISOString().slice(0,10),
        categoria:"Uso",
        rareza:item.rareza || "Comun",
      });
      // inventario cambió en Firestore — invalidar cache
      invalidateUserCaches();
      window.dispatchEvent(new CustomEvent("shopStateChanged", {
        detail: {
          category: "item_use",
          itemId: item.id,
          xp: res.xpGanado || 0,
          newLevel: resultingLevel,
          activeBoosts: res.activeBoosts || [],
          streakShield: res.streakShield || null,
        },
      }));
    } catch {
      setInventario(prev => {
        const ex = prev.find(i => i.id===item.id);
        if (ex) return prev.map(i => i.id===item.id ? { ...i, cantidad:i.cantidad+1 } : i);
        return [...prev, item];
      });
      setError(t("ti.err.use_err"));
    } finally { setUsingId(null); }
  };

  const handleLevelPurchaseSuccess = (res) => {
    const previousLevel = Number(localProfile?.level ?? profile?.level ?? 1);
    const nextLevel = Number(res.newLevel || previousLevel);
    const levelsGained = Math.max(1, nextLevel - previousLevel);
    const fallbackPatch = {
      level: nextLevel,
      xp: 0,
      xpNext: res.xpNext,
      coins: res.coins ?? res.coinsLeft ?? coins,
      levelsBoughtTotal: res.levelsBought,
      skillPoints: res.skillPoints ?? localProfile?.skillPoints,
      lastLevelUp: new Date().toISOString(),
    };
    const profilePatch = getResponseProfilePatch(res, fallbackPatch);
    applyStoreProfilePatch(profilePatch);
    invalidateUserCaches();
    pushMarketHistory({
      id:`service-level-${Date.now()}`,
      item:`Nivel comprado -> ${nextLevel}`,
      imagen:"/ui/icon-energy.png",
      cantidad:1,
      precio:LEVEL_PRICE,
      fecha:new Date().toISOString().slice(0,10),
      categoria:"Servicio",
      rareza:"Legendario",
    });
    emitProfileUpdated(profilePatch, { source: "tienda", category: "service_level" });
    window.dispatchEvent(new CustomEvent("levelUp", {
      detail: {
        newLevel: nextLevel,
        xpNext: res.xpNext,
        skillPoints: res.skillPoints,
        coins: profilePatch.coins,
        leveledUp: true,
        levelsGained,
        source: "tienda",
      },
    }));
    window.dispatchEvent(new CustomEvent("shopStateChanged", {
      detail: {
        ...profilePatch,
        newLevel: nextLevel,
        skillPoints: res.skillPoints,
        levelsBought: res.levelsBought,
        category: "service",
      },
    }));
  };

  const merchantRecommendation = useMemo(() => {
    const recommendedItem = [...objetos]
      .sort((a, b) =>
        scoreMarketItemForContext(b, merchantContext, heroClass, streakShield, coins) -
        scoreMarketItemForContext(a, merchantContext, heroClass, streakShield, coins))
      .find((entry) => Number(entry?.precio || 0) <= coins) || null;

    const recommendedRoutine = [...publicRoutines]
      .sort((a, b) => scoreRoutineForContext(b, heroClass, merchantContext) - scoreRoutineForContext(a, heroClass, merchantContext))[0] || null;

    const recommendedTitle = [...titleCatalog]
      .sort((a, b) =>
        scoreTitleForContext(b, heroClass, merchantContext, coins, ownedTitles, activeTitle) -
        scoreTitleForContext(a, heroClass, merchantContext, coins, ownedTitles, activeTitle))[0] || null;

    const serviceLabel = !streakShield
      ? "Protección de racha"
      : coins >= LEVEL_PRICE
        ? "Ascenso directo"
        : recommendedTitle?.nombre || "Colección del mercader";

    return { item: recommendedItem, routine: recommendedRoutine, title: recommendedTitle, serviceLabel };
  }, [objetos, publicRoutines, titleCatalog, merchantContext, heroClass, streakShield, coins, ownedTitles, activeTitle]);

  useEffect(() => {
    if (tab === "servicios" && merchantRecommendation.title) {
      setDetailFocus((prev) => (
        prev?.manual && prev?.type === "title"
          ? prev
          : { type: "title", id: merchantRecommendation.title.id || merchantRecommendation.title.nombre, manual: false }
      ));
      return;
    }

    if (tab === "tienda" && merchantRecommendation.routine) {
      setDetailFocus((prev) => (
        prev?.manual && (prev?.type === "routine" || prev?.type === "item")
          ? prev
          : { type: "routine", id: merchantRecommendation.routine.id || merchantRecommendation.routine.nombre || merchantRecommendation.routine.name, manual: false }
      ));
      return;
    }

    if (merchantRecommendation.item) {
      if (!selectedItem) setSelectedItem(merchantRecommendation.item);
      setDetailFocus((prev) => (
        prev?.manual && prev?.type === "item"
          ? prev
          : { type: "item", id: merchantRecommendation.item.id, manual: false }
      ));
    }
  }, [selectedItem, merchantRecommendation, tab]);

  const activeDetail = useMemo(() => {
    if (detailFocus?.type === "routine") {
      const routine = publicRoutines.find((entry) => (entry.id || entry.nombre || entry.name) === detailFocus.id) || merchantRecommendation.routine;
      if (routine) return { type: "routine", data: routine };
    }
    if (detailFocus?.type === "title") {
      const titleEntry = titleCatalog.find((entry) => (entry.id || entry.nombre) === detailFocus.id) || merchantRecommendation.title;
      if (titleEntry) return { type: "title", data: titleEntry };
    }
    const item = (detailFocus?.type === "item"
      ? objetos.find((entry) => entry.id === detailFocus.id)
      : null) || selectedItem || merchantRecommendation.item || null;
    return item ? { type: "item", data: item } : null;
  }, [detailFocus, publicRoutines, titleCatalog, merchantRecommendation, objetos, selectedItem]);

  // ── Filtered & sorted catalog ─────────────────────────────────
  const filtrado = objetos.filter(it => {
    if (cat !== "Todos" && it.cat !== cat) return false;
    if (search && !it.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRar !== "all" && it.rareza !== filterRar) return false;
    return true;
  }).sort((a,b) => {
    if (sortBy === "precio_asc")  return a.precio - b.precio;
    if (sortBy === "precio_desc") return b.precio - a.precio;
    if (sortBy === "rareza")      return (RAREZA[b.rareza]?.tier||0)-(RAREZA[a.rareza]?.tier||0);
    return (b.esNuevo?1:0) - (a.esNuevo?1:0);
  });

  // L5: inventario grouped + sorted (consumibles first, then by rareza tier)
  const invSorted = [...inventario].sort((a, b) => {
    if (a.consumible && !b.consumible) return -1;
    if (!a.consumible && b.consumible) return 1;
    return (RAREZA[b.rareza]?.tier || 0) - (RAREZA[a.rareza]?.tier || 0);
  });
  const INV_CAT_ORDER = ["Poción", "Consumible", "Equipo", "Cosmético", "Especial"];
  const allInvCats = [...new Set([
    ...INV_CAT_ORDER.filter(c => invSorted.some(i => i.cat === c)),
    ...invSorted.map(i => i.cat).filter(c => !INV_CAT_ORDER.includes(c)),
  ])];
  const invGrouped = allInvCats.map(catKey => ({
    cat:      catKey,
    icon:     null,
    img:      CATS[catKey]?.img   || "/ui/shop/icons/shop-crate.png",
    color:    CATS[catKey]?.color || C.muted,
    items:    invSorted.filter(i => i.cat === catKey),
    usables:  invSorted.filter(i => i.cat === catKey && i.consumible).length,
  }));
  const invTotal    = inventario.reduce((s,i) => s + i.cantidad, 0);
  const invUsables  = inventario.filter(i => i.consumible).reduce((s,i) => s + i.cantidad, 0);

  // ── Render ────────────────────────────────────────────────────
  const RARITY_CLASS = {
    "Común":"ti-r-common","Poco común":"ti-r-uncommon","Raro":"ti-r-rare",
    "Épico":"ti-r-epic","Legendario":"ti-r-legend","Mítico":"ti-r-mythic",
  };
  const featuredItems = objetos.filter(o => o.esNuevo || o.descuento).slice(0,3);

  return (
    <>
      <style>{CSS + SHOP_CSS}</style>

      {/* ── Modals ── */}
      <AnimatePresence>
        {itemModal && (
          <ItemModal key="im" item={itemModal} coins={coins}
            onClose={() => setItemModal(null)} onBuy={handleBuy}/>
        )}
        {skinBuyModal && (
          <div key="skm" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:250,padding:20}}>
            <div className="ti-panel" style={{width:"min(380px,100%)",padding:24}}>
              <div style={{textAlign:"center",font:"700 10px/1 'JetBrains Mono',monospace",color:"var(--ti-ac,#c08aff)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:18}}>{t("ti.sk.confirm_title")||"CONFIRMAR COMPRA"}</div>
              <div style={{textAlign:"center",marginBottom:10,display:"flex",justifyContent:"center"}}><AssetIcon src="/ui/shop/icons/shop-cosmetic.png" size={32} /></div>
              <div style={{textAlign:"center",font:"600 13px/1 'Manrope',sans-serif",color:"#e0d4ff",marginBottom:18}}>{skinBuyModal.nombre||skinBuyModal.name}</div>
              <div style={{display:"flex",justifyContent:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,.05)",border:"1px solid color-mix(in srgb,var(--ti-ac,#c08aff),transparent 75%)",borderRadius:6,marginBottom:18,font:"800 18px/1 'Manrope',sans-serif",color:"var(--ti-ac,#c08aff)"}}>
                <img src="/ui/icon-gold.png" alt="gold" style={{width:14,height:14,objectFit:"contain"}}/>
                {skinBuyModal.precio?.toLocaleString()||"FREE"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={()=>setSkinBuyModal(null)} style={{font:"700 12px/1 'Manrope',sans-serif",padding:12,background:"rgba(255,255,255,.04)",color:"#9080b0",border:"1px solid rgba(255,255,255,.09)",borderRadius:6,cursor:"pointer",letterSpacing:"0.04em"}}>CANCELAR</button>
                <button onClick={()=>{handleBuySkin(skinBuyModal);setSkinBuyModal(null);}} className="ti-btn-buy" style={{margin:0}}>▶ CONFIRMAR</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      {coinAnim && <CoinNotif amount={coinAnim} type={coinAnimType} onDone={() => setCoinAnim(null)}/>}
      <AnimatePresence>
        {useResult && <UseResultToast key="ut" result={useResult} onDone={() => setUseResult(null)}/>}
      </AnimatePresence>

      {/* ─────────────────────── MAIN GRID ─────────────────────── */}
      <div className="ti-gridline"/>
      <div className="ti-app" style={{"--ti-ac": myColor}}>

        {/* ══ TOP BAR ══ */}
        <header className="ti-top-bar">

          {/* Brand */}
          <FVSPanel p={12} style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/ui/header/section-tienda.png" alt="tienda" style={{width:28,height:28,objectFit:"contain",flexShrink:0,filter:`drop-shadow(0 0 8px ${myColor}88)`}}/>
            <div>
              <div style={{font:"800 10px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 10px ${myColor}55`}}>FORGEVENTURE</div>
              <div style={{font:"500 10px/1 'Manrope',sans-serif",color:"#9080b0",marginTop:5,letterSpacing:"0.04em"}}>TIENDA · MERCADO ERRANTE</div>
            </div>
          </FVSPanel>

          {/* Title */}
          <FVSPanel p={0} style={{overflow:"hidden",display:"flex",alignItems:"stretch"}}>
            {/* Class accent sidebar */}
            <div style={{width:4,background:`linear-gradient(180deg,${myColor},${myColor}44)`,flexShrink:0}}/>
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"10px 16px",position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <img
                  src={`/ui/crest-${clsCrest}.png`}
                  alt=""
                  className="ti-crest"
                  style={{width:28,height:28,objectFit:"contain",flexShrink:0}}
                  onError={e=>{e.currentTarget.style.display="none";}}
                />
                <div>
                  <h1 style={{font:"900 clamp(18px,1.6vw,26px)/1 'Manrope',sans-serif",color:"#fff9ef",margin:0,letterSpacing:"0.01em"}}>
                    Tienda · <span style={{color:myColor,textShadow:`0 0 22px ${myColor}88`}}>{shopCopy.lead}</span>
                  </h1>
                  <div style={{font:"500 clamp(11px,0.9vw,13px)/1.5 'Manrope',sans-serif",color:"#cdbfe0",marginTop:5}}>{shopCopy.sub}</div>
                </div>
              </div>
              {/* bottom accent line */}
              <div className="ti-accent-line" style={{position:"absolute",bottom:0,left:4,right:0,height:1,background:`linear-gradient(90deg,${myColor}55,transparent)`}}/>
            </div>
          </FVSPanel>

          {/* Currencies */}
          <FVSPanel p={12} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:`${myColor}0D`,border:`1px solid ${myColor}33`,borderRadius:8,boxShadow:`0 0 14px ${myColor}22`}}>
              <img src="/ui/icon-gold.png" alt="gold" style={{width:16,height:16,objectFit:"contain",filter:`drop-shadow(0 0 4px ${myColor}88)`}}/>
              <span key={coinAnimKey} style={{
                animation:coinAnimKey>0 ? `${coinAnimType==="gain"?"ut-coinUp":"ut-coinDown"} .65s ease both` : "none",
                font:"800 16px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.04em",
                textShadow:`0 0 14px ${myColor}77`,
              }}>{coins.toLocaleString()}</span>
            </div>
            {(localProfile?.heroClass || profile?.heroClass) && (
              <div className="ti-class-chip">
                <AssetIcon src={CLASS_ICON_ASSET[heroClass] || `/ui/crest-${clsCrest}.png`} size={16} />
                {localProfile?.heroClass || profile?.heroClass}
              </div>
            )}
            {!isMobile && (
              <div style={{display:"flex",gap:8,marginLeft:4}}>
                {[
                  {l:"ITEMS",  v:objetos.length,                           c:myColor},
                  {l:"INV",    v:inventario.reduce((s,i)=>s+i.cantidad,0), c:"#4cc9f0"},
                  {l:"BOOSTS", v:activeBoosts.length+(streakShield?1:0),   c:"#8ac926"},
                ].map(s=>(
                  <div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"rgba(255,255,255,.04)",border:`1px solid ${s.c}22`,borderRadius:6,borderTop:`2px solid ${s.c}55`}}>
                    <div style={{font:`800 15px/1 'JetBrains Mono',monospace`,color:s.c,textShadow:`0 0 10px ${s.c}66`}}>{s.v}</div>
                    <div style={{font:"600 8px/1 'Manrope',sans-serif",color:"#6e607e",letterSpacing:"0.06em",marginTop:3}}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </FVSPanel>

        </header>

        {/* ══ LEFT COLUMN ══ */}
        {!isMobile && (
          <aside className="ti-left">


            {/* Stats */}
            <FVSPanel>
              <FVSHead>ESTADÍSTICAS</FVSHead>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBottom:12}}>
                {storeSidebarMeta.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding:"8px 9px",
                      borderRadius:8,
                      background:"rgba(255,255,255,.035)",
                      border:`1px solid ${myColor}18`,
                      boxShadow:`inset 0 1px 0 ${myColor}10`,
                    }}
                  >
                    <div style={{font:"700 8px/1 'JetBrains Mono',monospace",color:"#7f7295",letterSpacing:"0.08em",marginBottom:5}}>
                      {item.label}
                    </div>
                    <div style={{font:"800 12px/1.1 'Manrope',sans-serif",color:"#f4f0ff"}}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              {[
                {k:"str",l:"FUERZA",     c:"#e0455e",pct:storeSidebarStats.str},
                {k:"sta",l:"RESISTENCIA",c:"#ffb13a",pct:storeSidebarStats.sta},
                {k:"spd",l:"VELOCIDAD",  c:"#8ac926",pct:storeSidebarStats.spd},
                {k:"dis",l:"DISCIPLINA", c:"#c08aff",pct:storeSidebarStats.dis},
                {k:"men",l:"MENTALIDAD", c:"#4cc9f0",pct:storeSidebarStats.men},
              ].map(s=>(
                <div key={s.k} style={{display:"grid",gridTemplateColumns:"16px 1fr",alignItems:"center",gap:8,marginBottom:8}}>
                  <img src={`/ui/stat-${s.k}.png`} alt={s.l} style={{width:14,height:14,objectFit:"contain",filter:`drop-shadow(0 0 4px ${s.c}88)`}}/>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",font:"600 9px/1 'JetBrains Mono',monospace",color:"#9080b0",letterSpacing:"0.08em",marginBottom:4}}>
                      <span>{s.l}</span><span style={{color:s.c}}>{s.pct}</span>
                    </div>
                    <div className="ti-bar">
                      <div className="ti-bar-fill" style={{width:`${Math.min(100,s.pct)}%`,background:`linear-gradient(90deg,${s.c}99,${s.c})`}}/>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.06)",font:"500 10px/1.45 'Manrope',sans-serif",color:"#9b90ae"}}>
                La lectura mezcla clase, nivel, racha, XP semanal, misiones y ritmo reciente del heroe.
              </div>
            </FVSPanel>


            {/* Active boosts */}
            {(activeBoosts.length > 0 || streakShield) && (
              <ActiveBoostsPanel boosts={activeBoosts} streakShield={streakShield}/>
            )}

          </aside>
        )}

        {/* ══ CENTER COLUMN ══ */}
        <main className="ti-main" style={!isMobile && !showRightRail ? { gridColumn:"2 / 4" } : undefined}>

          {error && (
            <div style={{padding:"10px 14px",background:"rgba(160,30,46,.14)",border:"1px solid rgba(160,30,46,.5)",borderRadius:6,color:"#ffb4b4",font:"500 11px/1 'Manrope',sans-serif"}}>
              ⚠ {error}
            </div>
          )}

          {/* Tab navigation */}
          <div style={{display:"flex",borderBottom:`1px solid rgba(255,255,255,.08)`,flexWrap:"wrap"}}>
            {[
              {id:"tienda",     l:t("ti.tab.tienda")||"SHOP"},
              {id:"inventario", l:t("ti.tab.inventario")||"INV"},
              {id:"historial",  l:t("ti.tab.historial")||"HISTORY"},
              {id:"skins",      l:t("ti.tab.skins")||"SKINS"},
              {id:"avatares",   l:t("ti.tab.avatares")||"AVATAR"},
              {id:"servicios",  l:"SERVICIOS"},
            ].map(tb => (
              <button key={tb.id} onClick={()=>setTab(tb.id)} className={`ti-tab${tab===tb.id?" active":""}`}>
                <AssetIcon src={TAB_ICON_ASSET[tb.id] || "/ui/shop/icons/shop-contract.png"} size={14} style={{opacity: tab===tb.id ? 1 : .72}} />
                <span>{tb.l}</span>
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ── */}
          <AnimatePresence mode="wait">

            {/* TIENDA */}
            {tab==="tienda" && (
              <motion.div key="tienda" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.2}} style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* Merchant NPC */}
                <FVSPanel p={0} style={{display:"grid",gridTemplateColumns:"140px 1fr",overflow:"hidden"}}>
                  <div style={{position:"relative",background:`radial-gradient(ellipse 80% 70% at 50% 60%,${myColor}25,transparent 70%),linear-gradient(180deg,rgba(6,4,14,.9),rgba(14,8,26,.95))`,overflow:"hidden",minHeight:140}}>
                    <img
                      src={SHOP_STAGE[heroClass] || "/ui/shop/hero/shop-stage-default.png"}
                      alt="merchant"
                      style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
                    <img
                      src="/ui/shop/hero/shop-table-overlay.png"
                      alt=""
                      style={{position:"absolute",bottom:0,left:0,width:"100%",objectFit:"contain",zIndex:1}}
                      onError={e=>{e.currentTarget.style.display="none";}}/>
                    <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent,rgba(6,4,14,.6))`,zIndex:2}}/>
                  </div>
                  <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",justifyContent:"center",gap:8}}>
                    <div style={{font:"800 9px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 8px ${myColor}55`,display:"flex",alignItems:"center",gap:6}}><AssetIcon src="/ui/shop/icons/shop-contract.png" size={12} /> WANDERING MERCHANT</div>
                    <div style={{font:"900 clamp(20px,1.8vw,28px)/1 'Manrope',sans-serif",color:"#fff9ef",margin:"4px 0 2px"}}>
                      VALEN <span style={{color:myColor,textShadow:`0 0 26px ${myColor}88`,fontSize:"0.72em"}}>· Mercado Errante</span>
                    </div>
                    <div style={{font:"500 clamp(11px,0.9vw,13px)/1.5 'Manrope',sans-serif",color:"#cdbfe0",marginBottom:2}}>{shopCopy.lead} {shopCopy.sub}</div>
                    <div style={{font:"500 11px/1.45 'Manrope',sans-serif",color:"#c8b8e8",padding:"9px 12px",background:"rgba(255,255,255,.05)",border:`1px solid ${myColor}22`,borderRadius:6}}>
                      {ctxMsg||"\"Well met, traveler. What catches your eye today?\""}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7,font:"600 9px/1 'JetBrains Mono',monospace",color:"#6e607e",letterSpacing:"0.08em",marginTop:2}}>
                      <div style={{width:8,height:8,border:`1px solid ${myColor}55`,borderRadius:"50%",borderTopColor:myColor,animation:"ut-spin 4s linear infinite"}}/>
                      <span>STOCK REFRESHES DAILY</span>
                    </div>
                  </div>
                </FVSPanel>

                <FVSPanel p={14}>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:10}}>
                    <div onClick={()=>focusItemDetail(merchantRecommendation.item, { manual:true })} style={{padding:"12px 14px",borderRadius:10,background:`${myColor}10`,border:`1px solid ${myColor}26`,cursor:merchantRecommendation.item?"pointer":"default"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <AssetIcon src="/ui/shop/icons/shop-contract.png" size={16} style={{filter:`drop-shadow(0 0 8px ${myColor}66)`}} />
                        <div style={{font:"800 9px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.12em"}}>ENCARGO ACTIVO</div>
                      </div>
                      <div style={{font:"700 12px/1.35 'Manrope',sans-serif",color:"#f0eaff"}}>
                        {merchantContext.activeMissionCount > 0
                          ? `Tienes ${merchantContext.activeMissionCount} encargo${merchantContext.activeMissionCount===1?"":"s"} abiertos y ${merchantContext.claimableMissionCount} listo${merchantContext.claimableMissionCount===1?"":"s"} para cerrar.`
                          : "El mercader no detecta presión inmediata en tu tablón."}
                      </div>
                    </div>
                    <div onClick={()=>focusRoutineDetail(merchantRecommendation.routine, { manual:true })} style={{padding:"12px 14px",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",cursor:merchantRecommendation.routine?"pointer":"default"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <AssetIcon src="/ui/icons/map-pin.png" size={16} />
                        <div style={{font:"800 9px/1 'JetBrains Mono',monospace",color:"#c0b0d8",letterSpacing:"0.12em"}}>RUTA QUE COMBINA</div>
                      </div>
                      <div style={{font:"700 12px/1.35 'Manrope',sans-serif",color:"#f0eaff"}}>
                        {merchantRecommendation.routine?.nombre || merchantRecommendation.routine?.name || "Sin ruta destacada"}
                      </div>
                      <div style={{font:"500 10px/1.4 'Manrope',sans-serif",color:"#8f83a9",marginTop:4}}>
                        {merchantRecommendation.routine
                          ? (merchantRecommendation.routine?.zona || merchantRecommendation.routine?.category || merchantRecommendation.routine?.tipo || "Encaja con tu clase y tu ritmo reciente.")
                          : "Cuando el mapa tenga más contexto, esta lectura se volverá más fina."}
                      </div>
                    </div>
                    <div onClick={()=>focusTitleDetail(merchantRecommendation.title, { manual:true })} style={{padding:"12px 14px",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",cursor:merchantRecommendation.title?"pointer":"default"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <AssetIcon src="/ui/shop/icons/shop-service.png" size={16} />
                        <div style={{font:"800 9px/1 'JetBrains Mono',monospace",color:"#c0b0d8",letterSpacing:"0.12em"}}>SERVICIO DEL DÍA</div>
                      </div>
                      <div style={{font:"700 12px/1.35 'Manrope',sans-serif",color:"#f0eaff"}}>
                        {merchantRecommendation.title?.nombre || merchantRecommendation.serviceLabel}
                      </div>
                      <div style={{font:"500 10px/1.4 'Manrope',sans-serif",color:"#8f83a9",marginTop:4}}>
                        {merchantRecommendation.title
                          ? (ownedTitles.includes(merchantRecommendation.title.nombre)
                            ? "Ya está desbloqueado; puedes dejarlo activo desde servicios."
                            : `Cuesta ${Number(merchantRecommendation.title.precio || 0).toLocaleString()} monedas y acompaña bien tu lectura actual.`)
                          : "Protección, ascenso o colección: aquí vive el apoyo más directo del mercado."}
                      </div>
                    </div>
                  </div>
                </FVSPanel>

                {/* Featured carousel */}
                {featuredItems.length > 0 && (
                  <FVSPanel p={0} style={{overflow:"hidden",position:"relative"}}>
                    <div style={{display:"flex",transition:"transform .5s cubic-bezier(.2,.8,.2,1)",transform:`translateX(-${featuredIdx*100}%)`}}>
                      {featuredItems.map((item,i) => {
                        const rc = TIER_ACCENT_TI[item.rareza]||{c:"#d4a44a",a:"rgba(244,204,120,.3)"};
                        return (
                          <div key={item.id||i} style={{flex:"0 0 100%",padding:"16px 20px",display:"grid",gridTemplateColumns:"110px 1fr auto",gap:16,alignItems:"center",position:"relative",background:`radial-gradient(ellipse 55% 100% at 20% 50%,${rc.a}33,transparent 70%)`}}>
                            <div style={{width:110,height:110,borderRadius:8,overflow:"hidden",background:`radial-gradient(ellipse 80% 60% at 50% 60%,${rc.a}44,transparent 70%),rgba(6,4,14,.8)`,border:`1px solid ${rc.c}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <img src={CATS[item.cat]?.img||"/ui/shop/icons/shop-crate.png"} alt={item.cat} style={{width:64,height:64,objectFit:"contain",filter:`drop-shadow(0 0 8px ${rc.c}88)`}}/>
                            </div>
                            <div style={{zIndex:1}}>
                              <div style={{display:"inline-flex",alignItems:"center",gap:6,font:"700 8px/1 'JetBrains Mono',monospace",letterSpacing:"0.1em",color:rc.c,background:`${rc.c}14`,border:`1px solid ${rc.c}44`,padding:"4px 8px",borderRadius:99,marginBottom:8}}>
                                <AssetIcon src={item.esNuevo?"/ui/medals/medal-gold.png":"/missions/rewards/reward-contract-chest.png"} size={12} />
                                {item.esNuevo?"NUEVO":"OFERTA"}
                              </div>
                              <div style={{font:"800 13px/1.2 'Manrope',sans-serif",color:"#f0eaff",marginBottom:6}}>{item.nombre}</div>
                              <div style={{font:"400 11px/1.5 'Manrope',sans-serif",color:"#9080b0",marginBottom:8}}>{item.descripcion}</div>
                              <div style={{display:"flex",gap:12,font:"600 9px/1 'JetBrains Mono',monospace",color:"#6e607e",letterSpacing:"0.08em"}}>
                                <span>RAREZA: <span style={{color:rc.c}}>{item.rareza}</span></span>
                                <span>CAT: <span style={{color:rc.c}}>{item.cat}</span></span>
                              </div>
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"stretch",minWidth:120,zIndex:1}}>
                              <div style={{background:"rgba(255,255,255,.05)",border:`1px solid ${rc.c}44`,borderRadius:6,padding:"8px 10px",font:"800 14px/1 'Manrope',sans-serif",color:rc.c,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                                <img src="/ui/icon-gold.png" alt="gold" style={{width:12,height:12,objectFit:"contain"}}/>
                                {item.precio?.toLocaleString()||"FREE"}
                              </div>
                              <button onClick={()=>{focusItemDetail(item);setItemModal(item);}} style={{font:"800 11px/1 'Manrope',sans-serif",padding:"11px 14px",background:`linear-gradient(135deg,${rc.c},color-mix(in oklab,${rc.c} 60%,#000))`,color:"#08041a",border:"none",borderRadius:6,cursor:"pointer",letterSpacing:"0.06em",boxShadow:`0 6px 20px ${rc.a}44`,transition:".15s",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8}}>
                                <ShoppingBag size={13} /> COMPRAR
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {featuredItems.length > 1 && (
                      <div style={{position:"absolute",bottom:14,right:14,display:"flex",gap:6,zIndex:3}}>
                        <button onClick={()=>setFeaturedIdx(i=>(i-1+featuredItems.length)%featuredItems.length)} style={{width:28,height:28,background:"rgba(6,4,14,.85)",border:"1px solid rgba(255,255,255,.15)",borderRadius:6,color:"#f0eaff",font:"500 10px/1 'Manrope',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={14} style={{transform:"rotate(180deg)"}}/></button>
                        <button onClick={()=>setFeaturedIdx(i=>(i+1)%featuredItems.length)} style={{width:28,height:28,background:"rgba(6,4,14,.85)",border:"1px solid rgba(255,255,255,.15)",borderRadius:6,color:"#f0eaff",font:"500 10px/1 'Manrope',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><ChevronRight size={14}/></button>
                      </div>
                    )}
                    <div style={{position:"absolute",bottom:18,left:20,display:"flex",gap:6,zIndex:3}}>
                      {featuredItems.map((_,i)=>(
                        <div key={i} onClick={()=>setFeaturedIdx(i)} style={{width:8,height:4,background:i===featuredIdx?"var(--ti-ac,#c08aff)":"rgba(255,255,255,.15)",borderRadius:99,cursor:"pointer",transition:".15s"}}/>
                      ))}
                    </div>
                  </FVSPanel>
                )}

                {/* Buy Level Section */}
                <BuyLevelSection coins={coins} profile={localProfile}
                  onSuccess={handleLevelPurchaseSuccess}/>

                {/* Categories */}
                <FVSPanel p={12}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(86px,1fr))",gap:8}}>
                    {Object.entries(CATS).map(([name,meta])=>{
                      const count = name==="Todos" ? objetos.length : objetos.filter(o=>o.cat===name).length;
                      const isActive = cat===name;
                      return (
                        <button key={name} className={`ti-cat${isActive?" active":""}`} onClick={()=>setCat(name)} style={isActive?{borderTopColor:myColor,borderTopWidth:2}:{}}>
                          <div style={{position:"relative",width:32,height:32,flexShrink:0}}>
                            <img src={meta.img} alt={name} style={{width:32,height:32,objectFit:"contain",filter:isActive?`drop-shadow(0 0 10px ${myColor}BB) brightness(1.1)`:"grayscale(40%) brightness(.65)",transition:"filter .2s"}}/>
                            {isActive && <div style={{position:"absolute",inset:"-4px",borderRadius:"50%",background:`radial-gradient(circle,${myColor}22,transparent 70%)`,pointerEvents:"none"}}/>}
                          </div>
                          <div style={{font:"700 7px/1.2 'Manrope',sans-serif",letterSpacing:"0.07em"}}>{name.toUpperCase()}</div>
                          <div style={{font:"700 10px/1 'JetBrains Mono',monospace",color:isActive?myColor:"#6e607e"}}>{count}</div>
                        </button>
                      );
                    })}
                  </div>
                </FVSPanel>

                {/* Toolbar */}
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <span style={{font:"600 9px/1 'JetBrains Mono',monospace",color:"#6e607e",letterSpacing:"0.08em"}}>ORDEN</span>
                  <div className="ti-seg">
                    {[{v:"nuevo",l:"NUEVO"},{v:"precio",l:"PRECIO"},{v:"rareza",l:"RAREZA"}].map(s=>(
                      <button key={s.v} className={`ti-seg-btn${sortBy===s.v?" active":""}`} onClick={()=>setSortBy(s.v)}>{s.l}</button>
                    ))}
                  </div>
                  <span style={{font:"600 9px/1 'JetBrains Mono',monospace",color:"#6e607e",letterSpacing:"0.08em"}}>FILTRO</span>
                  <div className="ti-seg">
                    {[{v:"all",l:"TODO"},{v:"Raro",l:"RARO"},{v:"Épico",l:"ÉPICO"},{v:"Legendario",l:"LEYENDA"}].map(s=>(
                      <button key={s.v} className={`ti-seg-btn${filterRar===s.v?" active":""}`} onClick={()=>setFilterRar(s.v)}>{s.l}</button>
                    ))}
                  </div>
                  <div style={{flex:1}}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="ti-input"/>
                  <span style={{font:"600 9px/1 'JetBrains Mono',monospace",color:"#6e607e",letterSpacing:"0.08em"}}>
                    <span style={{color:"var(--ti-ac,#c08aff)"}}>{filtrado.length}</span> ÍTEMS
                  </span>
                </div>

                {/* Item grid */}
                <FVSPanel p={14} style={{flex:1}}>
                  {cargando ? (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))",gap:10}}>
                      {Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
                    </div>
                  ) : filtrado.length===0 ? (
                    <div style={{textAlign:"center",padding:"40px 20px",color:"#6e607e"}}>
                      <div style={{marginBottom:12,opacity:.4,display:"flex",justifyContent:"center"}}><AssetIcon src="/ui/shop/icons/shop-contract.png" size={32} /></div>
                      <div style={{font:"700 9px/1 'JetBrains Mono',monospace",letterSpacing:"0.1em"}}>SIN RESULTADOS</div>
                    </div>
                  ) : (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))",gap:10}}>
                      {filtrado.map((item,idx)=>{
                        const rc = TIER_ACCENT_TI[item.rareza]||{c:"#a8a8b8",a:"rgba(168,168,184,.4)"};
                        const rCls = RARITY_CLASS[item.rareza]||"ti-r-common";
                        const owned = inventario.some(i=>i.id===item.id||i.objectId===item.id);
                        const kindMeta = MARKET_KIND_META[item.marketKind] || MARKET_KIND_META.functional;
                        return (
                          <div key={item.id||idx}
                            className={`ti-card ${rCls}${selectedItem?.id===item.id?" selected":""}`}
                            style={{"--ti-rc":rc.c,"--ti-ra":rc.a}}
                            onClick={()=>focusItemDetail(item)}>
                            <div className="ti-card-art">
                              <ItemImageBox item={item} height={84}/>
                              {item.esNuevo && <span className="ti-badge ti-badge-new">NUEVO</span>}
                              {item.descuento && !item.esNuevo && <span className="ti-badge ti-badge-sale">SALE</span>}
                              {owned && <span className="ti-owned">LISTO</span>}
                              {/* Rarity icon */}
                              <img
                                src={`/ui/rarity/rarity-${item.rareza==="Épico"?"epic":item.rareza==="Legendario"?"legendary":item.rareza==="Raro"?"rare":"common"}.png`}
                                alt=""
                                style={{position:"absolute",bottom:4,right:4,width:14,height:14,objectFit:"contain",filter:`drop-shadow(0 0 4px ${rc.c}88)`,opacity:.85}}
                                onError={e=>{e.currentTarget.style.display="none";}}
                              />
                            </div>
                            <div className="ti-card-body">
                              <div style={{font:"600 10px/1.3 'Manrope',sans-serif",color:rc.c,
                                textShadow:`0 0 8px ${rc.a}`,
                                display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.nombre}</div>
                              <div style={{display:"flex",alignItems:"center",gap:4}}>
                                <img
                                  src={`/ui/rarity/rarity-${item.rareza==="Épico"?"epic":item.rareza==="Legendario"?"legendary":item.rareza==="Raro"?"rare":"common"}.png`}
                                  alt=""
                                  style={{width:10,height:10,objectFit:"contain"}}
                                  onError={e=>{e.currentTarget.style.display="none";}}
                                />
                                <div style={{font:"700 7px/1 'JetBrains Mono',monospace",color:rc.c,letterSpacing:"0.08em",opacity:.8}}>{item.rareza?.toUpperCase()}</div>
                              </div>
                              <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 6px",borderRadius:999,border:`1px solid ${kindMeta.border}`,background:kindMeta.bg,font:"700 7px/1 'JetBrains Mono',monospace",color:kindMeta.color,letterSpacing:"0.08em",width:"fit-content"}}>
                                {kindMeta.label}
                              </div>
                              <div style={{marginTop:"auto",display:"flex",alignItems:"center",gap:4}}>
                                <img src="/ui/icon-gold.png" alt="gold" style={{width:10,height:10,objectFit:"contain",filter:`drop-shadow(0 0 4px ${rc.c}55)`}}/>
                                <span style={{font:"800 11px/1 'Manrope',sans-serif",color:rc.c,textShadow:`0 0 6px ${rc.a}`}}>{item.precio?.toLocaleString()||"FREE"}</span>
                                {item.descuento && (
                                  <span style={{font:"400 8px/1 'Manrope',sans-serif",color:"#6e607e",
                                    textDecoration:"line-through",marginLeft:"auto"}}>
                                    {Math.round((item.precio||0)/(1-(item.descuento||0)/100))?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </FVSPanel>

              </motion.div>
            )}

            {/* INVENTARIO */}
            {tab==="inventario" && (
              <motion.div key="inventario" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0,width:"100%",alignSelf:"stretch"}}>
                {/* Inventory hero banner */}
                <FVSPanel p={0} style={{overflow:"hidden"}}>
                  <div style={{height:80,position:"relative",background:`radial-gradient(ellipse 60% 100% at 15% 50%,${myColor}20,transparent 60%),linear-gradient(180deg,rgba(6,4,14,.9),rgba(14,8,26,.95))`,display:"flex",alignItems:"center",gap:16,padding:"0 20px"}}>
                    <img
                      src={`/home_${clsDir}/home_idle_${clsDir}_01.png`}
                      alt="hero"
                      style={{height:76,objectFit:"contain",imageRendering:"pixelated",filter:`drop-shadow(0 0 12px ${myColor}88)`,flexShrink:0,animation:"ti-heroFloat 3.2s ease-in-out infinite"}}
                      onError={e=>{e.currentTarget.style.display="none";}}
                    />
                    <div>
                      <div style={{font:"800 11px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 10px ${myColor}55`,marginBottom:6}}>INVENTARIO</div>
                      <div style={{display:"flex",gap:12}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{font:"900 20px/1 'JetBrains Mono',monospace",color:"#f0eaff"}}>{inventario.reduce((s,i)=>s+i.cantidad,0)}</div>
                          <div style={{font:"600 8px/1 'Manrope',sans-serif",color:"#6e607e",letterSpacing:"0.06em",marginTop:2}}>ÍTEMS</div>
                        </div>
                        <div style={{width:1,background:"rgba(255,255,255,.08)"}}/>
                        <div style={{textAlign:"center"}}>
                          <div style={{font:"900 20px/1 'JetBrains Mono',monospace",color:"#8ac926"}}>{invUsables}</div>
                          <div style={{font:"600 8px/1 'Manrope',sans-serif",color:"#6e607e",letterSpacing:"0.06em",marginTop:2}}>USABLES</div>
                        </div>
                      </div>
                    </div>
                    <img src="/sprites/chest_open.png" alt="" style={{position:"absolute",right:16,bottom:0,height:64,objectFit:"contain",opacity:.35,filter:`drop-shadow(0 0 10px ${myColor}44)`}} onError={e=>{e.currentTarget.style.display="none";}}/>
                  </div>
                </FVSPanel>

                <FVSPanel style={{flex:1}}>
                  {inventario.length===0 ? (
                    <div style={{textAlign:"center",padding:"40px 20px",color:"#6e607e"}}>
                      <img src="/sprites/chest_closed.png" alt="" style={{height:48,marginBottom:14,opacity:.35}} onError={e=>{e.currentTarget.style.display="none";}}/>
                      <div style={{fontSize:0}}/>
                      <div style={{font:"700 9px/1 'JetBrains Mono',monospace",letterSpacing:"0.1em"}}>INVENTARIO VACÍO</div>
                    </div>
                  ) : (
                    invGrouped.map(group=>(
                      <div key={group.cat} style={{marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,font:"700 9px/1 'JetBrains Mono',monospace",color:group.color,letterSpacing:"0.1em",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${group.color}22`}}>
                          <img src={group.img} alt="" style={{width:16,height:16,objectFit:"contain",filter:`drop-shadow(0 0 4px ${group.color}88)`}}/>
                          <span>{group.cat.toUpperCase()}</span>
                          <span style={{color:"#6e607e",fontWeight:400}}>({group.items.reduce((s,i)=>s+i.cantidad,0)})</span>
                        </div>
                        {group.items.map((item,i)=>{
                          const rc=TIER_ACCENT_TI[item.rareza]||{c:"#a8a8b8",a:"rgba(168,168,184,.4)"};
                          const kindMeta = MARKET_KIND_META[item.marketKind] || MARKET_KIND_META.functional;
                          const canUseItem = item.consumible && isSupportedUseItem(item);
                          return (
                          <div key={item.id||i} className="ti-row" onClick={()=>focusItemDetail(item)}>
                              <div style={{width:36,height:36,background:`${rc.c}0D`,border:`1px solid ${rc.c}33`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                                {item.imagen && !/^item_tienda_\d+$/i.test(item.imagen)
                                  ? <span style={{fontSize:18,lineHeight:1}}>{item.imagen}</span>
                                  : <img src={group.img} alt="" style={{width:22,height:22,objectFit:"contain",filter:`drop-shadow(0 0 4px ${rc.c}66)`}}/>}
                              </div>
                              <div>
                                <div style={{font:"600 11px/1 'Manrope',sans-serif",color:"#e0d4ff",marginBottom:3}}>{item.nombre}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                  <div style={{font:"600 8px/1 'JetBrains Mono',monospace",color:rc.c,letterSpacing:"0.08em"}}>{item.rareza?.toUpperCase()}</div>
                                  <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 6px",borderRadius:999,border:`1px solid ${kindMeta.border}`,background:kindMeta.bg,font:"700 7px/1 'JetBrains Mono',monospace",color:kindMeta.color,letterSpacing:"0.08em"}}>
                                    {kindMeta.label}
                                  </div>
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{font:"800 14px/1 'JetBrains Mono',monospace",color:"var(--ti-ac,#c08aff)"}}>×{item.cantidad||1}</div>
                                {item.consumible && (
                                  canUseItem ? (
                                    <button onClick={e=>{e.stopPropagation();handleUse(item);}} disabled={usingId===item.id}
                                      style={{marginTop:4,background:"rgba(76,201,240,.1)",border:"1px solid rgba(76,201,240,.35)",color:"#4cc9f0",font:"700 9px/1 'Manrope',sans-serif",padding:"3px 8px",cursor:"pointer",borderRadius:4,letterSpacing:"0.04em",transition:"background .15s"}}>
                                      {usingId===item.id?"...":"USAR"}
                                    </button>
                                  ) : (
                                    <div style={{marginTop:4,font:"700 8px/1 'JetBrains Mono',monospace",color:"#e05c8a",letterSpacing:"0.08em"}}>
                                      LEGACY
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </FVSPanel>
              </motion.div>
            )}

            {/* HISTORIAL */}
            {tab==="historial" && (
              <motion.div key="historial" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0,width:"100%",alignSelf:"stretch"}}>
                <FVSPanel p={0} style={{overflow:"hidden"}}>
                  <div style={{height:80,position:"relative",background:`radial-gradient(ellipse 60% 100% at 85% 50%,${myColor}18,transparent 60%),linear-gradient(180deg,rgba(6,4,14,.9),rgba(14,8,26,.95))`,display:"flex",alignItems:"center",gap:16,padding:"0 20px"}}>
                    <div>
                      <div style={{font:"800 11px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 10px ${myColor}55`,marginBottom:6}}>HISTORIAL</div>
                      <div style={{font:"500 10px/1 'Manrope',sans-serif",color:"#6e607e"}}>{historial.length} compra{historial.length!==1?"s":""} registrada{historial.length!==1?"s":""}</div>
                    </div>
                    <img src="/missions/rewards/reward-xp-scroll.png" alt="" style={{position:"absolute",right:20,height:56,objectFit:"contain",opacity:.4,filter:`drop-shadow(0 0 10px ${myColor}44)`}} onError={e=>{e.currentTarget.style.display="none";}}/>
                  </div>
                </FVSPanel>
                <FVSPanel style={{flex:1}}>
                  <FVSHead>HISTORIAL DE COMPRAS</FVSHead>
                  {historial.length===0 ? (
                    <div style={{textAlign:"center",padding:"40px 20px",color:"#6e607e"}}>
                      <img src="/missions/rewards/reward-xp-scroll.png" alt="" style={{height:40,marginBottom:14,opacity:.3}} onError={e=>{e.currentTarget.style.display="none";}}/>
                      <div style={{font:"700 9px/1 'JetBrains Mono',monospace",letterSpacing:"0.1em"}}>SIN COMPRAS AÚN</div>
                    </div>
                  ) : historial.map((h,i)=>{
                    const histCat = h.categoria||h.cat||"";
                    const histIcon = histCat==="Cosmético"?"/ui/shop/history/history-cosmetic.png"
                                   : histCat==="Consumible"||histCat==="Poción"?"/ui/shop/history/history-consumable.png"
                                   : histCat==="Equipo"?"/ui/shop/history/history-loot.png"
                                   : "/ui/shop/history/history-service.png";
                    return (
                    <div key={h.id||i} className="ti-row" style={{gridTemplateColumns:"38px 1fr auto"}}>
                      <div style={{width:38,height:38,background:"rgba(255,255,255,.04)",border:`1px solid ${myColor}22`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                        <img src={histIcon} alt="" style={{width:26,height:26,objectFit:"contain",filter:`drop-shadow(0 0 5px ${myColor}55)`}} onError={e=>{e.currentTarget.style.fontSize="14px";e.currentTarget.style.display="none";}}/>
                      </div>
                      <div>
                        <div style={{font:"600 11px/1.2 'Manrope',sans-serif",color:"#e0d4ff",marginBottom:3}}>{h.item||h.nombre||"Item"}</div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <div style={{font:"400 8px/1 'JetBrains Mono',monospace",color:"#6e607e",letterSpacing:"0.06em"}}>{h.fecha||""}</div>
                          {h.cantidad>1 && <div style={{font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,background:`${myColor}14`,border:`1px solid ${myColor}33`,padding:"1px 5px",borderRadius:3}}>×{h.cantidad}</div>}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{font:"800 13px/1 'JetBrains Mono',monospace",color:"#e05c8a",textShadow:"0 0 8px rgba(224,92,138,.4)"}}>-{(h.precio||0).toLocaleString()}</div>
                        <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end",marginTop:2}}>
                          <img src="/ui/icon-gold.png" alt="" style={{width:9,height:9,objectFit:"contain",opacity:.6}}/>
                          <span style={{font:"500 8px/1 'Manrope',sans-serif",color:"#6e607e"}}>monedas</span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </FVSPanel>
              </motion.div>
            )}

            {/* SKINS */}
            {tab==="skins" && (
              <motion.div key="skins" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0,width:"100%",alignSelf:"stretch"}}>
                <FVSPanel p={0} style={{overflow:"hidden"}}>
                  <div style={{height:80,position:"relative",background:`radial-gradient(ellipse 70% 100% at 20% 50%,${myColor}22,transparent 60%),linear-gradient(180deg,rgba(6,4,14,.9),rgba(14,8,26,.95))`,display:"flex",alignItems:"center",gap:16,padding:"0 20px"}}>
                    <img
                      src={`/home_${clsDir}/home_idle_${clsDir}_01.png`}
                      alt="hero"
                      style={{height:76,objectFit:"contain",imageRendering:"pixelated",filter:`drop-shadow(0 0 14px ${myColor}88)`,flexShrink:0}}
                      onError={e=>{e.currentTarget.style.display="none";}}
                    />
                    <div>
                      <div style={{font:"800 11px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 10px ${myColor}55`,marginBottom:5}}>APARIENCIAS</div>
                      <div style={{font:"500 10px/1.4 'Manrope',sans-serif",color:"#9080b0"}}>Cambia el look de tu personaje</div>
                    </div>
                    <div style={{position:"absolute",right:20,display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{textAlign:"center",padding:"6px 12px",background:`${myColor}0F`,border:`1px solid ${myColor}22`,borderRadius:6}}>
                        <div style={{font:"800 16px/1 'JetBrains Mono',monospace",color:myColor}}>{ownedSkins.length}</div>
                        <div style={{font:"600 7px/1 'Manrope',sans-serif",color:"#6e607e",marginTop:2,letterSpacing:"0.06em"}}>TUYAS</div>
                      </div>
                    </div>
                  </div>
                </FVSPanel>
                <FVSPanel style={{flex:1}}>
                  <FVSHead>APARIENCIAS</FVSHead>
                  {skinMsg && (
                    <div style={{padding:"8px 12px",marginBottom:12,background:skinMsg.ok?"rgba(138,201,38,.1)":"rgba(160,30,46,.12)",border:`1px solid ${skinMsg.ok?"#8ac92644":"rgba(160,30,46,.45)"}`,borderRadius:6,color:skinMsg.ok?"#b4f0c8":"#ffb4b4",font:"500 11px/1 'Manrope',sans-serif"}}>
                      {skinMsg.text}
                    </div>
                  )}
                  {skinCatalog.length===0 ? (
                    <div style={{textAlign:"center",padding:"40px 20px",color:"#6e607e"}}>
                      <div style={{marginBottom:12,opacity:.4,display:"flex",justifyContent:"center"}}><AssetIcon src="/ui/shop/icons/shop-cosmetic.png" size={32} /></div>
                      <div style={{font:"700 9px/1 'JetBrains Mono',monospace",letterSpacing:"0.1em"}}>SIN APARIENCIAS DISPONIBLES</div>
                    </div>
                  ) : (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14}}>
                      {skinCatalog.map((skin,i)=>{
                        const skinKey = skin.id || skin.nombre;
                        const owned   = ownedSkins.includes(skinKey);
                        const active  = equippedSkin === skinKey;
                        const ac = active?"var(--ti-ac,#c08aff)":owned?"#8ac926":"rgba(255,255,255,.1)";
                        const acRaw = active?myColor:owned?"#8ac926":"#3a2d54";
                        return (
                          <div key={i} style={{
                            background:"rgba(10,7,22,.82)",
                            border:`1px solid ${ac}`,
                            borderRadius:12,overflow:"hidden",
                            cursor:!owned||active?"default":"pointer",
                            transition:"transform .18s,box-shadow .18s",
                            boxShadow: active?`0 0 24px ${acRaw}44`:owned?"0 0 12px rgba(138,201,38,.2)":"none",
                          }} onClick={()=>{if(!owned)setSkinBuyModal(skin);}}>
                            {/* Art area */}
                            <div style={{
                              height:110,position:"relative",
                              background:`radial-gradient(ellipse 70% 80% at 50% 60%,${acRaw}22,transparent 70%),linear-gradient(180deg,rgba(14,8,28,.9),rgba(8,5,18,.95))`,
                              display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",
                            }}>
                              {skin.preview
                                ? <img src={skin.preview} alt={skin.nombre||skin.name} style={{width:80,height:80,objectFit:"contain",filter:`drop-shadow(0 0 12px ${acRaw}88)`}}/>
                                : <AssetIcon src="/ui/shop/icons/shop-cosmetic.png" size={40} style={{filter:`drop-shadow(0 0 12px ${acRaw}88)`}} />}
                              {active && <div style={{position:"absolute",top:8,right:8,background:`${myColor}22`,border:`1px solid ${myColor}88`,borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em"}}>EN USO</div>}
                              {owned && !active && <div style={{position:"absolute",top:8,right:8,background:"rgba(138,201,38,.15)",border:"1px solid rgba(138,201,38,.5)",borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:"#8ac926",letterSpacing:"0.08em"}}>TUYA</div>}
                            </div>
                            {/* Info area */}
                            <div style={{padding:"12px 14px 14px"}}>
                              <div style={{font:"700 12px/1.3 'Manrope',sans-serif",color:"#f0eaff",marginBottom:4}}>{skin.nombre||skin.name}</div>
                              {skin.descripcion && <div style={{font:"400 10px/1.4 'Manrope',sans-serif",color:"#8070a0",marginBottom:10}}>{skin.descripcion}</div>}
                              {owned
                                ? active
                                  ? <div style={{font:"700 9px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em",textShadow:`0 0 8px ${myColor}66`}}>APARIENCIA ACTIVA</div>
                                  : <button disabled={equippingId===skinKey} onClick={e=>{e.stopPropagation();handleEquipSkin(skin);}}
                                      style={{width:"100%",padding:"9px 0",background:`rgba(192,138,255,.12)`,border:`1px solid rgba(192,138,255,.4)`,borderRadius:6,color:"var(--ti-ac,#c08aff)",font:"700 11px/1 'Manrope',sans-serif",cursor:"pointer",letterSpacing:"0.04em",transition:"background .15s",opacity:equippingId===skinKey ? .6 : 1}}>
                                      {equippingId===skinKey?"Equipando...":"EQUIPAR"}
                                    </button>
                                : <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                    <div style={{font:"800 13px/1 'Manrope',sans-serif",color:"var(--ti-ac,#c08aff)"}}>{skin.precio?.toLocaleString()||"FREE"}</div>
                                    <div style={{font:"600 9px/1 'Manrope',sans-serif",color:"#6e607e",display:"flex",alignItems:"center",gap:5}}><AssetIcon src="/ui/icon-gold.png" size={10} /> monedas</div>
                                  </div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </FVSPanel>
              </motion.div>
            )}

            {/* AVATARES */}
            {tab==="avatares" && (
              <motion.div key="avatares" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} style={{display:"flex",flexDirection:"column",gap:14,flex:1,minHeight:0,width:"100%",alignSelf:"stretch"}}>
                <FVSPanel p={0} style={{overflow:"hidden"}}>
                  <div style={{height:80,position:"relative",background:`radial-gradient(ellipse 70% 100% at 80% 50%,${myColor}22,transparent 60%),linear-gradient(180deg,rgba(6,4,14,.9),rgba(14,8,26,.95))`,display:"flex",alignItems:"center",gap:16,padding:"0 20px"}}>
                    <div>
                      <div style={{font:"800 11px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 10px ${myColor}55`,marginBottom:5}}>AVATARES Y MARCOS</div>
                      <div style={{font:"500 10px/1.4 'Manrope',sans-serif",color:"#9080b0"}}>Personaliza tu perfil de héroe</div>
                    </div>
                    <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{textAlign:"center",padding:"6px 12px",background:`${myColor}0F`,border:`1px solid ${myColor}22`,borderRadius:6}}>
                        <div style={{font:"800 16px/1 'JetBrains Mono',monospace",color:myColor}}>{ownedAvatars.length}</div>
                        <div style={{font:"600 7px/1 'Manrope',sans-serif",color:"#6e607e",marginTop:2,letterSpacing:"0.06em"}}>AVATARES</div>
                      </div>
                      <div style={{textAlign:"center",padding:"6px 12px",background:"rgba(244,204,120,.08)",border:"1px solid rgba(244,204,120,.2)",borderRadius:6}}>
                        <div style={{font:"800 16px/1 'JetBrains Mono',monospace",color:"#f4cc78"}}>{ownedFrames.length}</div>
                        <div style={{font:"600 7px/1 'Manrope',sans-serif",color:"#6e607e",marginTop:2,letterSpacing:"0.06em"}}>MARCOS</div>
                      </div>
                    </div>
                    <img
                      src={`/home_${clsDir}/home_idle_${clsDir}_01.png`}
                      alt="hero"
                      style={{position:"absolute",right:130,bottom:0,height:78,objectFit:"contain",imageRendering:"pixelated",filter:`drop-shadow(0 0 14px ${myColor}77)`,opacity:.7}}
                      onError={e=>{e.currentTarget.style.display="none";}}
                    />
                  </div>
                </FVSPanel>
                <FVSPanel style={liveFrames.length > 0 ? {} : {flex:1}}>
                  <FVSHead>AVATARES</FVSHead>
                  {avatarMsg && (
                    <div style={{padding:"8px 12px",marginBottom:12,background:avatarMsg.ok?"rgba(138,201,38,.1)":"rgba(160,30,46,.12)",border:`1px solid ${avatarMsg.ok?"#8ac92644":"rgba(160,30,46,.45)"}`,borderRadius:6,color:avatarMsg.ok?"#b4f0c8":"#ffb4b4",font:"500 11px/1 'Manrope',sans-serif"}}>
                      {avatarMsg.text}
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
                    {liveAvatars.map((av,i)=>{
                      const owned  = ownedAvatars.includes(av.id);
                      const active = equippedAvatar === av.id;
                      const rc     = RAREZA_AVATAR_COLOR[av.rareza]||"#c89b3c";
                      const borderC = active?myColor:owned?"#8ac926":`${rc}44`;
                      return (
                        <div key={i} style={{
                          background:"rgba(10,7,22,.82)",
                          border:`1px solid ${borderC}`,
                          borderRadius:12,overflow:"hidden",
                          cursor:owned&&!active?"pointer":"default",
                          transition:"transform .18s,box-shadow .18s",
                          boxShadow: active?`0 0 24px ${myColor}44`:owned?"0 0 10px rgba(138,201,38,.18)":"none",
                          opacity:(buyingId===av.id || equippingId===av.id) ? .7 : 1,
                        }} onClick={()=>{if(!owned&&!buyingId)handleBuyAvatarItem(av);}}>
                          <div style={{height:110,background:`radial-gradient(ellipse 70% 80% at 50% 60%,${rc}20,transparent 70%),linear-gradient(180deg,rgba(14,8,28,.9),rgba(8,5,18,.95))`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                            <TiendaAvatarThumb id={av.id} color={rc} size={72}/>
                            {active && <div style={{position:"absolute",top:8,right:8,background:`${myColor}22`,border:`1px solid ${myColor}88`,borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em"}}>EN USO</div>}
                            {owned && !active && <div style={{position:"absolute",top:8,right:8,background:"rgba(138,201,38,.15)",border:"1px solid rgba(138,201,38,.5)",borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:"#8ac926",letterSpacing:"0.08em"}}>TUYO</div>}
                          </div>
                          <div style={{padding:"10px 12px 12px"}}>
                            <div style={{font:"700 11px/1.3 'Manrope',sans-serif",color:"#f0eaff",marginBottom:8}}>{av.nombre||av.name}</div>
                          {owned
                            ? active
                              ? <div style={{font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em",textShadow:`0 0 8px ${myColor}66`}}>AVATAR ACTIVO</div>
                              : <button disabled={!!equippingId} onClick={e=>{e.stopPropagation();handleEquipAvatar(av);}}
                                  style={{width:"100%",padding:"8px 0",background:"rgba(192,138,255,.1)",border:"1px solid rgba(192,138,255,.4)",borderRadius:6,color:"var(--ti-ac,#c08aff)",font:"700 10px/1 'Manrope',sans-serif",cursor:"pointer",letterSpacing:"0.04em",opacity:equippingId===av.id ? .6 : 1}}>
                                  {equippingId===av.id?"Equipando...":"EQUIPAR"}
                                </button>
                            : <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                <div style={{font:"800 12px/1 'Manrope',sans-serif",color:rc}}>{av.precio?.toLocaleString()||"FREE"}</div>
                                <AssetIcon src="/ui/icon-gold.png" size={10} />
                              </div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FVSPanel>
                {liveFrames.length > 0 && (
                  <FVSPanel style={{marginTop:12,flex:1}}>
                    <FVSHead>MARCOS</FVSHead>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
                      {liveFrames.map((fr,i)=>{
                        const owned  = ownedFrames.includes(fr.id);
                        const active = equippedFrame === fr.id;
                        const rc     = RAREZA_AVATAR_COLOR[fr.rareza]||"#c89b3c";
                        const borderC = active?myColor:owned?"#8ac926":`${rc}44`;
                        return (
                          <div key={i} style={{
                            background:"rgba(10,7,22,.82)",border:`1px solid ${borderC}`,borderRadius:12,overflow:"hidden",
                            cursor:owned&&!active?"pointer":"default",transition:"transform .18s,box-shadow .18s",
                            boxShadow:active?`0 0 24px ${myColor}44`:owned?"0 0 10px rgba(138,201,38,.18)":"none",
                            opacity:(buyingId===fr.id || equippingId===fr.id) ? .7 : 1,
                          }} onClick={()=>{if(!owned&&!buyingId)handleBuyAvatarItem(fr);}}>
                            <div style={{height:110,background:`radial-gradient(ellipse 70% 80% at 50% 60%,${rc}20,transparent 70%),linear-gradient(180deg,rgba(14,8,28,.9),rgba(8,5,18,.95))`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                              <TiendaFrameThumb frameId={fr.id} gradient={fr.gradient} animated={fr.animated} color={rc} outerSize={72} avatarSize={52}/>
                              {active && <div style={{position:"absolute",top:8,right:8,background:`${myColor}22`,border:`1px solid ${myColor}88`,borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em"}}>EN USO</div>}
                              {owned && !active && <div style={{position:"absolute",top:8,right:8,background:"rgba(138,201,38,.15)",border:"1px solid rgba(138,201,38,.5)",borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:"#8ac926",letterSpacing:"0.08em"}}>TUYO</div>}
                            </div>
                            <div style={{padding:"10px 12px 12px"}}>
                              <div style={{font:"700 11px/1.3 'Manrope',sans-serif",color:"#f0eaff",marginBottom:8}}>{fr.nombre||fr.name}</div>
                              {owned
                                ? active
                                  ? <div style={{font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em",textShadow:`0 0 8px ${myColor}66`}}>MARCO ACTIVO</div>
                                  : <button disabled={!!equippingId} onClick={e=>{e.stopPropagation();handleEquipFrame(fr);}}
                                      style={{width:"100%",padding:"8px 0",background:"rgba(192,138,255,.1)",border:"1px solid rgba(192,138,255,.4)",borderRadius:6,color:"var(--ti-ac,#c08aff)",font:"700 10px/1 'Manrope',sans-serif",cursor:"pointer",letterSpacing:"0.04em",opacity:equippingId===fr.id ? .6 : 1}}>
                                      {equippingId===fr.id?"Equipando...":"EQUIPAR"}
                                    </button>
                                : <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                    <div style={{font:"800 12px/1 'Manrope',sans-serif",color:rc}}>{fr.precio?.toLocaleString()||"FREE"}</div>
                                    <AssetIcon src="/ui/icon-gold.png" size={10} />
                                  </div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </FVSPanel>
                )}
              </motion.div>
            )}

            {tab==="servicios" && (
              <motion.div key="servicios" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} style={{display:"flex",flexDirection:"column",gap:14,width:"100%",alignSelf:"stretch"}}>
                <FVSPanel p={0} style={{overflow:"hidden"}}>
                  <div style={{height:92,position:"relative",background:`radial-gradient(ellipse 70% 100% at 20% 50%,${myColor}22,transparent 60%),linear-gradient(180deg,rgba(6,4,14,.9),rgba(14,8,26,.95))`,display:"flex",alignItems:"center",gap:16,padding:"0 20px"}}>
                    <AssetIcon src="/ui/shop/icons/shop-service.png" size={42} style={{filter:`drop-shadow(0 0 14px ${myColor}88)`}} />
                    <div>
                      <div style={{font:"800 11px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.14em",textShadow:`0 0 10px ${myColor}55`,marginBottom:5}}>SERVICIOS DEL GREMIO</div>
                      <div style={{font:"500 10px/1.4 'Manrope',sans-serif",color:"#9080b0"}}>Ascensos directos, colección de títulos y apoyo fino para tu ruta actual.</div>
                    </div>
                  </div>
                </FVSPanel>

                {titleMsg && (
                  <div style={{padding:"8px 12px",background:titleMsg.ok?"rgba(138,201,38,.1)":"rgba(160,30,46,.12)",border:`1px solid ${titleMsg.ok?"#8ac92644":"rgba(160,30,46,.45)"}`,borderRadius:6,color:titleMsg.ok?"#b4f0c8":"#ffb4b4",font:"500 11px/1 'Manrope',sans-serif"}}>
                    {titleMsg.text}
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1.05fr) minmax(0,.95fr)",gap:14}}>
                  <BuyLevelSection coins={coins} profile={localProfile} onSuccess={handleLevelPurchaseSuccess}/>
                  <FVSPanel>
                    <FVSHead>TABLÓN DE APOYO</FVSHead>
                    <div style={{display:"grid",gap:10}}>
                      <div style={{padding:"12px 14px",borderRadius:10,background:`${myColor}10`,border:`1px solid ${myColor}26`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <AssetIcon src="/ui/icons/map-pin.png" size={15} />
                          <div style={{font:"800 9px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.12em"}}>LECTURA DEL MERCADER</div>
                        </div>
                        <div style={{font:"700 12px/1.35 'Manrope',sans-serif",color:"#f0eaff"}}>{merchantRecommendation.serviceLabel}</div>
                        <div style={{font:"500 10px/1.45 'Manrope',sans-serif",color:"#8f83a9",marginTop:4}}>
                          {merchantRecommendation.routine?.nombre
                            ? `Ruta relacionada: ${merchantRecommendation.routine.nombre}.`
                            : "Sin ruta ligada todavía; el servicio sigue disponible para tu progreso general."}
                        </div>
                      </div>
                      <div style={{padding:"12px 14px",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <AssetIcon src="/ui/shop/icons/shop-cosmetic.png" size={15} />
                          <div style={{font:"800 9px/1 'JetBrains Mono',monospace",color:"#c0b0d8",letterSpacing:"0.12em"}}>TÍTULO DESTACADO</div>
                        </div>
                        <div style={{font:"700 12px/1.35 'Manrope',sans-serif",color:"#f0eaff"}}>{merchantRecommendation.title?.nombre || "Sin título sugerido ahora"}</div>
                        <div style={{font:"500 10px/1.45 'Manrope',sans-serif",color:"#8f83a9",marginTop:4}}>
                          {merchantRecommendation.title
                            ? ownedTitles.includes(merchantRecommendation.title.nombre)
                              ? "Ya forma parte de tu colección y puede equiparse abajo."
                              : `Rareza ${merchantRecommendation.title.rareza || "Común"} · ${Number(merchantRecommendation.title.precio || 0).toLocaleString()} monedas.`
                            : "El catálogo irá afinando la recomendación según tu ritmo y tu clase."}
                        </div>
                      </div>
                    </div>
                  </FVSPanel>
                </div>

                <FVSPanel>
                  <FVSHead>COLECCIÓN DE TÍTULOS</FVSHead>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14}}>
                    {titleCatalog.map((titleEntry) => {
                      const owned = ownedTitles.includes(titleEntry.nombre);
                      const active = activeTitle === titleEntry.nombre;
                      const accent = titleEntry.color || myColor;
                      const buyable = titleEntry.fuente === "compra";
                      const canAfford = Number(titleEntry.precio || 0) <= coins;
                      return (
                        <div key={titleEntry.id} style={{background:"rgba(10,7,22,.82)",border:`1px solid ${active?myColor:owned?"#8ac926":`${accent}44`}`,borderRadius:12,overflow:"hidden",boxShadow:active?`0 0 22px ${myColor}44`:owned?"0 0 10px rgba(138,201,38,.18)":"none"}}>
                          <div style={{height:96,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse 70% 80% at 50% 60%,${accent}22,transparent 70%),linear-gradient(180deg,rgba(14,8,28,.9),rgba(8,5,18,.95))`}}>
                            <AssetIcon src="/ui/medals/medal-gold.png" size={58} style={{filter:`drop-shadow(0 0 12px ${accent}88)`}} />
                            {active && <div style={{position:"absolute",top:8,right:8,background:`${myColor}22`,border:`1px solid ${myColor}88`,borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em"}}>ACTIVO</div>}
                            {owned && !active && <div style={{position:"absolute",top:8,right:8,background:"rgba(138,201,38,.15)",border:"1px solid rgba(138,201,38,.5)",borderRadius:4,padding:"3px 7px",font:"700 8px/1 'JetBrains Mono',monospace",color:"#8ac926",letterSpacing:"0.08em"}}>OBTENIDO</div>}
                          </div>
                          <div style={{padding:"12px 14px 14px"}}>
                            <div style={{font:"700 12px/1.3 'Manrope',sans-serif",color:"#f0eaff",marginBottom:6}}>{titleEntry.nombre}</div>
                            <div style={{font:"500 10px/1.45 'Manrope',sans-serif",color:"#8f83a9",minHeight:42,marginBottom:10}}>{titleEntry.desc || titleEntry.hint || "Título del mapa."}</div>
                            <div style={{font:"700 8px/1 'JetBrains Mono',monospace",color:accent,letterSpacing:"0.08em",marginBottom:10}}>{(titleEntry.rareza || "Común").toUpperCase()}</div>
                            {owned ? (
                              active ? (
                                <div style={{font:"700 9px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.08em"}}>TÍTULO EN USO</div>
                              ) : (
                                <button disabled={titleBusyId===titleEntry.nombre} onClick={()=>handleEquipTitle(titleEntry.nombre)} style={{width:"100%",padding:"9px 0",background:"rgba(192,138,255,.1)",border:"1px solid rgba(192,138,255,.4)",borderRadius:6,color:"var(--ti-ac,#c08aff)",font:"700 11px/1 'Manrope',sans-serif",cursor:"pointer",letterSpacing:"0.04em",opacity:titleBusyId===titleEntry.nombre ? .6 : 1}}>
                                  {titleBusyId===titleEntry.nombre?"Equipando...":"EQUIPAR"}
                                </button>
                              )
                            ) : buyable ? (
                              <button disabled={!canAfford || !!titleBusyId} onClick={()=>handleBuyTitle(titleEntry)} style={{width:"100%",padding:"9px 0",background:canAfford?`linear-gradient(135deg,${accent},color-mix(in oklab,${accent} 60%,#000))`:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:6,color:canAfford?"#08041a":"#9080b0",font:"700 11px/1 'Manrope',sans-serif",cursor:canAfford?"pointer":"not-allowed",letterSpacing:"0.04em",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8}}>
                                <AssetIcon src="/ui/icon-gold.png" size={12} />
                                {Number(titleEntry.precio || 0).toLocaleString()}
                              </button>
                            ) : (
                              <div style={{font:"600 9px/1.4 'Manrope',sans-serif",color:"#8f83a9"}}>{titleEntry.hint || "Se obtiene jugando."}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </FVSPanel>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* ══ RIGHT COLUMN ══ */}
        {showRightRail && (
          <aside className="ti-right">

            {/* Detail panel */}
            <FVSPanel style={{display:"flex",flexDirection:"column",flex:1}}>
              <FVSHead>{activeDetail?.type==="routine" ? "DETALLE DE RUTA" : activeDetail?.type==="title" ? "DETALLE DE TÍTULO" : "DETALLE DEL MERCADO"}</FVSHead>

              {activeDetail?.type === "item" ? (()=> {
                const selectedItem = activeDetail.data;
                const rc = TIER_ACCENT_TI[selectedItem.rareza]||{c:"#d4a44a",a:"rgba(244,204,120,.3)"};
                const owned = inventario.some(i=>i.id===selectedItem.id||i.objectId===selectedItem.id);
                const canAfford = coins >= (selectedItem.precio||0);
                const hint = missionHint(selectedItem.efectos);
                const kindMeta = MARKET_KIND_META[selectedItem.marketKind] || MARKET_KIND_META.functional;
                const canUseItem = isSupportedUseItem(selectedItem);
                return (
                  <>
                    <div className="ti-d-art" style={{"--ti-rc":rc.c,"--ti-ra":rc.a}}>
                      <ItemImageBox item={selectedItem} height={260} radius={0}/>
                    </div>
                    <div style={{font:"700 12px/1 'Manrope',sans-serif",color:rc.c,textShadow:`0 0 10px ${rc.a}`,textAlign:"center",marginBottom:4}}>{selectedItem.nombre}</div>
                    <div style={{textAlign:"center",font:"700 8px/1 'JetBrains Mono',monospace",color:rc.c,letterSpacing:"0.1em",marginBottom:10,opacity:.8}}>{selectedItem.rareza?.toUpperCase()}</div>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                      <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:999,border:`1px solid ${kindMeta.border}`,background:kindMeta.bg,font:"700 8px/1 'JetBrains Mono',monospace",color:kindMeta.color,letterSpacing:"0.08em"}}>
                        {kindMeta.label}
                      </div>
                    </div>
                    <div style={{font:"400 11px/1.5 'Manrope',sans-serif",color:"#9080b0",textAlign:"center",padding:"8px 6px",borderTop:"1px solid rgba(255,255,255,.07)",borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:12}}>
                      {selectedItem.descripcion||"—"}
                    </div>
                    {selectedItem.retiredReason && (
                      <div style={{padding:"7px 10px",background:"rgba(224,92,138,.1)",border:"1px solid rgba(224,92,138,.28)",borderRadius:6,marginBottom:12,font:"500 10px/1.45 'Manrope',sans-serif",color:"#f4b2c4"}}>
                        {selectedItem.retiredReason}
                      </div>
                    )}
                    {selectedItem.efectos?.length > 0 && (
                      <div style={{marginBottom:12}}>
                        <div style={{font:"700 8px/1 'JetBrains Mono',monospace",color:rc.c,letterSpacing:"0.1em",paddingBottom:6,marginBottom:8,borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:rc.c,boxShadow:`0 0 4px ${rc.a}`}}/>
                          EFECTOS
                        </div>
                        {selectedItem.efectos.map((ef,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",font:"400 10px/1 'Manrope',sans-serif",color:"#9080b0"}}>
                            <span>{renderEfTxt(ef,t)||ef.tipo}</span>
                            <span style={{font:"800 11px/1 'JetBrains Mono',monospace",color:"#8ac926"}}>+{ef.valor}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {hint && (
                      <div style={{padding:"6px 10px",background:`${hint.color}11`,border:`1px solid ${hint.color}33`,borderRadius:5,marginBottom:12,font:"500 10px/1.4 'Manrope',sans-serif",color:hint.color}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                          <AssetIcon src={hint.img || "/ui/shop/icons/shop-service.png"} size={12} />
                          {t(hint.textKey)||hint.textKey}
                        </span>
                      </div>
                    )}
                    {selectedItem.effectTypes?.includes("cooldown_red") && (
                      <div style={{padding:"7px 10px",background:"rgba(76,201,240,.08)",border:"1px solid rgba(76,201,240,.28)",borderRadius:6,marginBottom:12,font:"500 10px/1.45 'Manrope',sans-serif",color:"#8fdcff"}}>
                        Mientras este activo, el apoyo del gremio reduce su recarga y el mercado te deja volver antes a ese gesto.
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,.04)",border:`1px solid ${rc.c}44`,borderRadius:6,marginBottom:12}}>
                      <img src="/ui/icon-gold.png" alt="gold" style={{width:14,height:14,objectFit:"contain"}}/>
                      <span style={{font:"800 20px/1 'Manrope',sans-serif",color:rc.c,textShadow:`0 0 12px ${rc.a}`}}>{selectedItem.precio?.toLocaleString()||"FREE"}</span>
                    </div>
                    <button className={`ti-btn-buy${owned?" owned":""}`} disabled={(!canAfford && !owned) || selectedItem.catalogStatus==="legacy"} onClick={()=>{if(!owned)setItemModal(selectedItem);}}>
                      {owned ? "OBTENIDO" : selectedItem.catalogStatus==="legacy" ? "OBJETO RETIRADO" : canAfford ? "COMPRAR" : "MONEDAS INSUFICIENTES"}
                    </button>
                    <button className={`ti-btn-wish${wishlist.has(selectedItem.id)?" active":""}`} onClick={()=>setWishlist(prev=>{const s=new Set(prev);s.has(selectedItem.id)?s.delete(selectedItem.id):s.add(selectedItem.id);return s;})}>
                      <AssetIcon src="/ui/icon-gem.png" size={13} />
                      {wishlist.has(selectedItem.id)?"EN FAVORITOS":"AGREGAR A FAVORITOS"}
                    </button>
                    {owned && selectedItem.consumible && !canUseItem && (
                      <div style={{marginTop:10,font:"500 10px/1.45 'Manrope',sans-serif",color:"#e8a1b7",textAlign:"center"}}>
                        Este ejemplar quedó como legado y ya no se consume desde el mercado actual.
                      </div>
                    )}
                  </>
                );
              })() : activeDetail?.type === "routine" ? (() => {
                const routine = activeDetail.data;
                const zoneLabel = routine?.zona || routine?.category || routine?.tipo || routine?.type || "Ruta sugerida";
                const xpLabel = routine?.xp || routine?.rewardXp || routine?.xpReward || routine?.reward || null;
                const stepLabel = routine?.pasos || routine?.steps || routine?.exerciseCount || routine?.ejercicios?.length || null;
                return (
                  <>
                    <div className="ti-d-art" style={{"--ti-rc":myColor,"--ti-ra":`${myColor}44`, display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <AssetIcon src="/ui/icons/map-pin.png" size={84} style={{filter:`drop-shadow(0 0 18px ${myColor}88)`}} />
                    </div>
                    <div style={{font:"700 12px/1 'Manrope',sans-serif",color:myColor,textShadow:`0 0 10px ${myColor}44`,textAlign:"center",marginBottom:4}}>{routine?.nombre || routine?.name || "Ruta sugerida"}</div>
                    <div style={{textAlign:"center",font:"700 8px/1 'JetBrains Mono',monospace",color:myColor,letterSpacing:"0.1em",marginBottom:10,opacity:.8}}>{String(zoneLabel).toUpperCase()}</div>
                    <div style={{font:"400 11px/1.5 'Manrope',sans-serif",color:"#9080b0",textAlign:"center",padding:"8px 6px",borderTop:"1px solid rgba(255,255,255,.07)",borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:12}}>
                      {routine?.descripcion || routine?.desc || "Ruta pública que combina con tu clase y con el estado actual del mapa."}
                    </div>
                    <div style={{display:"grid",gap:8,marginBottom:12}}>
                      {xpLabel !== null && (
                        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,font:"500 10px/1 'Manrope',sans-serif",color:"#9080b0"}}>
                          <span>Recompensa estimada</span><span style={{color:"#8ac926",fontWeight:800}}>{xpLabel} XP</span>
                        </div>
                      )}
                      {stepLabel !== null && (
                        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,font:"500 10px/1 'Manrope',sans-serif",color:"#9080b0"}}>
                          <span>Tramos o ejercicios</span><span style={{color:"#f0eaff",fontWeight:800}}>{stepLabel}</span>
                        </div>
                      )}
                      <div style={{padding:"8px 10px",background:`${myColor}11`,border:`1px solid ${myColor}33`,borderRadius:5,font:"500 10px/1.4 'Manrope',sans-serif",color:myColor}}>
                        El mercader la deja al frente porque mezcla tu clase, tus encargos vivos y el pulso reciente del héroe.
                      </div>
                    </div>
                    <button className="ti-btn-buy owned" onClick={()=>setTab("servicios")} style={{cursor:"pointer"}}>
                      VER SERVICIOS DEL GREMIO
                    </button>
                  </>
                );
              })() : activeDetail?.type === "title" ? (() => {
                const titleEntry = activeDetail.data;
                const accent = titleEntry.color || myColor;
                const owned = ownedTitles.includes(titleEntry.nombre);
                const canAfford = Number(titleEntry.precio || 0) <= coins;
                return (
                  <>
                    <div className="ti-d-art" style={{"--ti-rc":accent,"--ti-ra":`${accent}44`, display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <AssetIcon src="/ui/medals/medal-gold.png" size={84} style={{filter:`drop-shadow(0 0 18px ${accent})`}} />
                    </div>
                    <div style={{font:"700 12px/1 'Manrope',sans-serif",color:accent,textShadow:`0 0 10px ${accent}44`,textAlign:"center",marginBottom:4}}>{titleEntry.nombre}</div>
                    <div style={{textAlign:"center",font:"700 8px/1 'JetBrains Mono',monospace",color:accent,letterSpacing:"0.1em",marginBottom:10,opacity:.8}}>{(titleEntry.rareza || "Común").toUpperCase()}</div>
                    <div style={{font:"400 11px/1.5 'Manrope',sans-serif",color:"#9080b0",textAlign:"center",padding:"8px 6px",borderTop:"1px solid rgba(255,255,255,.07)",borderBottom:"1px solid rgba(255,255,255,.07)",marginBottom:12}}>
                      {titleEntry.desc || titleEntry.hint || "Título recomendado para la lectura actual del mapa."}
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,.04)",border:`1px solid ${accent}44`,borderRadius:6,marginBottom:12}}>
                      <AssetIcon src="/ui/icon-gold.png" size={14} />
                      <span style={{font:"800 20px/1 'Manrope',sans-serif",color:accent,textShadow:`0 0 12px ${accent}44`}}>{Number(titleEntry.precio || 0).toLocaleString()}</span>
                    </div>
                    {owned ? (
                      activeTitle === titleEntry.nombre ? (
                        <button className="ti-btn-buy owned">TÍTULO ACTIVO</button>
                      ) : (
                        <button className="ti-btn-buy" onClick={()=>handleEquipTitle(titleEntry.nombre)}>EQUIPAR TÍTULO</button>
                      )
                    ) : titleEntry.fuente === "compra" ? (
                      <button className="ti-btn-buy" disabled={!canAfford || !!titleBusyId} onClick={()=>handleBuyTitle(titleEntry)}>
                        {canAfford ? "COMPRAR TÍTULO" : "MONEDAS INSUFICIENTES"}
                      </button>
                    ) : (
                      <button className="ti-btn-buy owned">SE CONSIGUE JUGANDO</button>
                    )}
                  </>
                );
              })() : (
                <div style={{flex:1,position:"relative",borderRadius:10,overflow:"hidden",minHeight:160}}>
                  <img
                    src="/ui/scene-bg.png"
                    alt=""
                    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.45}}
                    onError={e=>{e.currentTarget.style.display="none";}}
                  />
                  <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 80% 50% at 50% 100%,${myColor}22,transparent 65%),linear-gradient(180deg,rgba(6,4,14,.55) 0%,rgba(6,4,14,.15) 50%,rgba(6,4,14,.7) 100%)`}}/>
                  <div style={{position:"absolute",bottom:14,left:0,right:0,textAlign:"center",font:"700 8px/1.6 'JetBrains Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",color:"#4a3d60"}}>
                    SELECCIONA UN ÍTEM<br/>PARA VER DETALLES
                  </div>
                </div>
              )}
            </FVSPanel>

            {/* Wishlist */}
            <FVSPanel>
              <FVSHead><span style={{display:"inline-flex",alignItems:"center",gap:8}}><AssetIcon src="/ui/icon-gem.png" size={14} /> FAVORITOS</span></FVSHead>
              {wishlist.size===0 ? (
                <div style={{padding:"18px 14px",textAlign:"center",color:"#6e607e",font:"500 11px/1.5 'Manrope',sans-serif",background:"rgba(255,255,255,.03)",border:"1px dashed rgba(255,255,255,.08)",borderRadius:6}}>
                  Aún no tienes favoritos. Guarda cualquier ítem desde su ficha para tenerlo a mano.
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[...wishlist].map(id=>{
                    const item=objetos.find(o=>o.id===id);
                    if(!item)return null;
                    const rc=TIER_ACCENT_TI[item.rareza]||{c:"#a8a8b8",a:"rgba(168,168,184,.4)"};
                    return (
                      <div key={id} className="ti-row" onClick={()=>focusItemDetail(item)}>
                        <div style={{width:36,height:36,background:"rgba(255,255,255,.05)",border:`1px solid ${rc.c}33`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}><img src={CATS[item.cat]?.img||"/ui/shop/icons/shop-crate.png"} alt={item.cat} style={{width:22,height:22,objectFit:"contain"}}/></div>
                        <div>
                          <div style={{font:"600 10px/1.3 'Manrope',sans-serif",color:"#e0d4ff",marginBottom:3}}>{item.nombre}</div>
                          <div style={{font:"800 10px/1 'Manrope',sans-serif",color:rc.c,display:"flex",alignItems:"center",gap:5}}><AssetIcon src="/ui/icon-gold.png" size={10} /> {item.precio?.toLocaleString()||"FREE"}</div>
                        </div>
                        <button onClick={e=>{e.stopPropagation();setWishlist(prev=>{const s=new Set(prev);s.delete(id);return s;});}} style={{width:18,height:18,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:"50%",color:"#6e607e",cursor:"pointer",font:"500 12px/1 'Manrope',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </FVSPanel>

          </aside>
        )}

      </div>
    </>
  );
}


