// src/components/shared/DailyBonusModal.jsx — RPG Gothic v3
// Layout: ForgeVenture Daily Bonus.html reference
// Reward track · Draggable panel · Shower · Chest burst · Toasts · Embers
import { Suspense, lazy, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { auth } from "../../firebase.js";
import { claimDailyBonus, getActiveBoosts, getInventario } from "../../services/api.js";
import { P } from "../../design/system.jsx";
import { USER_CLASS_THEME } from "../../pages/user/userClassTheme.js";
import { canShowStreakNotif, canShowXpPopups } from "../../utils/runtimeSettings.js";

const Lottie = lazy(() => import("lottie-react"));

// ─── Reward logic (unchanged from v2) ─────────────────────────────────────────
const MILESTONE_REWARDS = {
  7:   { xp:100,  coins:75,   gems:50,  icon:"chest",   label:"SEMANA ÉPICA"   },
  14:  { xp:200,  coins:150,  gems:100, icon:"chest",   label:"DOS SEMANAS"    },
  30:  { xp:500,  coins:350,  gems:200, icon:"chest",   label:"MES LEGENDARIO" },
  60:  { xp:1000, coins:700,  gems:350, icon:"mystery", label:"DIAMANTE"       },
  100: { xp:2500, coins:1500, gems:800, icon:"mystery", label:"CENTURIÓN"      },
};

function calcReward(streak) {
  if (MILESTONE_REWARDS[streak]) return { ...MILESTONE_REWARDS[streak], isMilestone:true };
  let tier;
  if      (streak >= 100) tier = 5;
  else if (streak >= 60)  tier = 4;
  else if (streak >= 30)  tier = 3;
  else if (streak >= 14)  tier = 2.5;
  else if (streak >= 7)   tier = 2;
  else                    tier = 1 + (streak - 1) * 0.1;
  return { xp:Math.round(20*tier), coins:Math.round(10*tier), gems:Math.round(5*tier),
           isMilestone:false, icon:"energy", label:"DIARIO" };
}

function utcDateStr(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}

function timeUntilMidnightUTC() {
  const now  = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()+1));
  const diff = next - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function hasStreakShieldEffect(item) {
  const effects = Array.isArray(item?.efectos) ? item.efectos : [];
  const hasEffect = effects.some((ef) => ef?.tipo === "streak_shield");
  const text = `${item?.nombre || ""} ${item?.descripcion || ""}`.toLowerCase();
  return hasEffect || /amuleto|racha|escudo/.test(text);
}

function countStreakProtectors(items = []) {
  return items
    .filter(hasStreakShieldEffect)
    .reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
}

function shieldTimeLeft(shield) {
  if (!shield?.expiresAt) return "";
  const diff = new Date(shield.expiresAt).getTime() - Date.now();
  if (diff <= 0) return "";
  const hours = Math.ceil(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

function useLottieJson(src) {
  const [animationData, setAnimationData] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(src)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (alive) setAnimationData(data); })
      .catch(() => { if (alive) setAnimationData(null); });
    return () => { alive = false; };
  }, [src]);
  return animationData;
}

// ─── 7-day schedule (day 7 = milestone chest) ─────────────────────────────────
const SCHEDULE = [
  { type:"gold",    amt:"+100",  label:"ORO"     },
  { type:"energy",  amt:"+3",    label:"ENERGÍA" },
  { type:"gems",    amt:"+10",   label:"GEMAS"   },
  { type:"xp",      amt:"×2",    label:"XP"      },
  { type:"gold",    amt:"+300",  label:"ORO"     },
  { type:"mystery", amt:"???",   label:"MISTERIO"},
  { type:"chest",   amt:"+1000", label:"COFRE",  milestone:true },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
function normalizeDailyBonusClass(profile) {
  const raw = profile?.heroClass || profile?.clase || profile?.class || profile?.classId || profile?.roleClass || "DEFAULT";
  const key = String(raw).trim().toUpperCase();
  return USER_CLASS_THEME[key] ? key : "DEFAULT";
}

function hexToRgba(hex, alpha = 1) {
  const clean = String(hex || "#c08aff").replace("#", "");
  const value = clean.length === 3
    ? clean.split("").map(ch => ch + ch).join("")
    : clean.padEnd(6, "0").slice(0, 6);
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const CSS = `
:root {
  --db-bg:    ${P.bg0};   --db-bg1:  ${P.bg1};  --db-bg2:  ${P.bg2};
  --db-inner: ${P.bg0};   --db-slot: ${P.navy};
  --db-bd:    ${P.line};  --db-bd2:  ${P.glow};
  --db-gold:  ${P.gold};  --db-goldb:#FFE08A;    --db-golds:#F0C040;
  --db-text:  ${P.text};  --db-dim:  ${P.mutedL};--db-muted:${P.muted};
  --db-parch: ${P.accent2};--db-fire: #ff7a1f;   --db-ember:${P.gold};
  --db-green: #6BC87A;    --db-men:  #4cc9f0;    --db-crim: #E05C8A;
  --db-xp1:   ${P.glow};  --db-xp2:  ${P.accent};--db-xp3:  ${P.accent2};
  --db-class-accent:#c08aff; --db-class-secondary:#c08aff; --db-class-bg:#12091f;
  --db-class-soft:rgba(192,138,255,.15); --db-class-line:rgba(192,138,255,.42);
  --db-class-glow:rgba(192,138,255,.35); --db-class-glow-strong:rgba(192,138,255,.62);
}

/* ── Keyframes ───────────────────────────────────────────────── */
@keyframes db-float   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-6px)} }
@keyframes db-glow    { 50%{box-shadow:inset 0 0 0 1px var(--db-goldb),0 0 28px rgba(244,204,120,.7)} }
@keyframes db-flicker { 100%{transform:scaleY(1.12) scaleX(.92)} }
@keyframes db-pop     { 0%{transform:scale(.85) translateY(24px);opacity:0} 65%{transform:scale(1.04)} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes db-pe-rise { 0%{transform:translateY(0);opacity:0} 15%{opacity:.85} 100%{transform:translateY(-480px);opacity:0} }
@keyframes db-spin    { to{transform:rotate(360deg)} }
@keyframes db-badge   { 50%{transform:scale(1.18)} }
@keyframes db-shine   { from{left:-100%} to{left:150%} }
@keyframes db-today   { 50%{box-shadow:inset 0 0 0 1px var(--db-goldb),0 0 28px rgba(244,204,120,.7)} }
@keyframes db-scan    { 0%{background-position:0 0} 100%{background-position:0 100%} }
@keyframes db-textglo { 0%,100%{text-shadow:0 0 10px rgba(244,204,120,.6)} 50%{text-shadow:0 0 22px rgba(244,204,120,.9),0 0 40px rgba(244,204,120,.3)} }
@keyframes db-chest-lid { to{transform:rotateX(120deg)} }
@keyframes db-burst   { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
@keyframes db-glow-r  { 0%{opacity:0} 30%{opacity:1} 100%{opacity:0} }
@keyframes db-fall    { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(115vh) rotate(720deg);opacity:0} }
@keyframes db-toast-in  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes db-toast-out { to{transform:translateY(-10px);opacity:0} }
@keyframes db-sweep   { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
@keyframes db-aura    { 0%,100%{box-shadow:0 0 8px rgba(244,204,120,.3)} 50%{box-shadow:0 0 24px rgba(244,204,120,.7)} }
@keyframes db-rune    { 0%,100%{opacity:.08;transform:scale(1)} 50%{opacity:.16;transform:scale(1.04)} }
@keyframes db-crt     { 0%,95%,100%{opacity:1} 96%{opacity:.85} }

/* ── Scrollbar ───────────────────────────────────────────────── */
.db-scroll::-webkit-scrollbar       { width:3px; }
.db-scroll::-webkit-scrollbar-track { background:transparent; }
.db-scroll::-webkit-scrollbar-thumb { background:var(--db-gold)55; border-radius:2px; }

/* ── Overlay ─────────────────────────────────────────────────── */
.db-overlay {
  position:fixed; inset:0; z-index:8000;
  background:
    radial-gradient(circle at 18% 20%,var(--db-class-soft),transparent 30%),
    radial-gradient(circle at 86% 18%,var(--db-class-glow),transparent 34%),
    radial-gradient(circle at 50% 100%,rgba(76,201,240,.1),transparent 40%),
    rgba(4,3,10,.68);
  backdrop-filter:blur(14px) saturate(1.12);
  display:flex; align-items:center; justify-content:center; padding:16px;
}
.db-overlay::before {
  content:""; position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(115deg,transparent 0 38%,rgba(255,255,255,.055) 48%,transparent 58%),
    url("/ui/dashboard-particles.png");
  background-size:auto,520px auto;
  opacity:.38;
  mix-blend-mode:screen;
}

/* ── Popup ───────────────────────────────────────────────────── */
.db-popup {
  position:relative; width:min(704px,calc(100vw - 28px)); max-height:min(84vh,680px);
  overflow-y:auto; overflow-x:hidden;
  border:1px solid rgba(255,224,138,.78);
  border-radius:18px;
  background:
    radial-gradient(circle at 0 0,var(--db-class-soft),transparent 38%),
    linear-gradient(160deg,var(--db-class-bg),rgba(10,7,18,.97) 52%,rgba(28,16,32,.96)),
    url("/ui/panel-texture.png");
  background-size:auto,420px auto;
  box-shadow:
    0 0 0 1px rgba(5,3,8,.98),
    0 0 0 5px var(--db-class-soft),
    0 26px 90px rgba(0,0,0,.62),
    0 0 72px var(--db-class-glow);
  animation:db-aura 5s ease-in-out infinite;
  transform-origin:center;
  touch-action:pan-y;
}
/* Gold corner rivets */
.db-popup::before,.db-popup::after { content:""; position:absolute; width:8px; height:8px;
  background:radial-gradient(circle,var(--db-goldb) 30%,var(--db-gold));
  box-shadow:0 0 8px var(--db-gold); z-index:10; pointer-events:none; }
.db-popup::before { top:10px; left:10px; }
.db-popup::after  { top:10px; right:10px; }
.db-corners::before,.db-corners::after { content:""; position:absolute; width:8px; height:8px;
  background:radial-gradient(circle,var(--db-goldb) 30%,var(--db-gold));
  box-shadow:0 0 8px var(--db-gold); z-index:10; pointer-events:none; }
.db-corners::before { bottom:10px; left:10px; }
.db-corners::after  { bottom:10px; right:10px; }

/* Gold sweep line */
.db-sweep {
  position:absolute; top:0; left:0; height:2px; width:36%;
  background:linear-gradient(90deg,transparent,var(--db-goldb)88,transparent);
  animation:db-sweep 4s ease-in-out infinite; pointer-events:none; z-index:11;
}

/* Rune watermark */
.db-rune {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-size:170px; color:var(--db-gold); opacity:.055; pointer-events:none; user-select:none;
  animation:db-rune 7s ease-in-out infinite; z-index:0;
}

/* Embers */
.db-embers { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0; }
.db-pe { position:absolute; width:3px; height:3px; background:var(--db-ember);
  box-shadow:0 0 6px var(--db-fire); bottom:-10px;
  animation:db-pe-rise linear infinite; opacity:0; }

/* Scanlines */
.db-scan { position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.5;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.04) 3px,rgba(0,0,0,.04) 5px);
  animation:db-crt 8s ease-in-out infinite; }

.db-inner { position:relative; z-index:2; padding:18px 20px 20px; }

/* ── Close button ────────────────────────────────────────────── */
.db-close { position:absolute; top:12px; right:14px; width:32px; height:32px;
  background:rgba(7,5,12,.74); border:1px solid var(--db-class-line);
  border-radius:10px;
  color:var(--db-dim); font-family:'JetBrains Mono',monospace; font-size:10px;
  cursor:pointer; z-index:15; transition:.12s;
  display:flex; align-items:center; justify-content:center; }
.db-close:hover { color:var(--db-crim); border-color:var(--db-crim); box-shadow:0 0 18px rgba(211,59,77,.42); }

/* ── Header ──────────────────────────────────────────────────── */
.db-header {
  text-align:center; margin:-2px 42px 14px;
  padding:10px 16px 12px;
  border:1px solid var(--db-class-line);
  border-radius:14px;
  background:linear-gradient(180deg,var(--db-class-soft),rgba(255,224,138,.015));
  box-shadow:inset 0 0 24px var(--db-class-soft),0 0 22px rgba(0,0,0,.16);
  cursor:grab;
  user-select:none;
  touch-action:none;
}
.db-header:active { cursor:grabbing; }
.db-drag-handle {
  display:flex; justify-content:center; gap:6px; margin:0 auto 9px;
  height:6px; align-items:center;
}
.db-drag-handle span {
  width:22px; height:2px; border-radius:99px;
  background:linear-gradient(90deg,transparent,rgba(255,224,138,.55),transparent);
  box-shadow:0 0 10px rgba(244,204,120,.25);
}
.db-ribbon { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:8px; }
.db-title  { font-size:18px; color:var(--db-goldb); letter-spacing:2.4px;
  animation:db-textglo 3.5s ease-in-out infinite; }
.db-sub    { font-family:'VT323',monospace; font-size:15px;
  color:var(--db-dim); letter-spacing:1.2px; }

/* ── Gift CSS icon ───────────────────────────────────────────── */
.db-gift { width:26px; height:26px; position:relative; flex-shrink:0; }
.db-gift .g-box { position:absolute; bottom:0; left:6%; width:88%; height:64%;
  background:linear-gradient(180deg,#d4451f,#8a1c0a); border:1px solid #ffb48a; }
.db-gift .g-lid { position:absolute; top:14%; left:0; width:100%; height:28%;
  background:linear-gradient(180deg,#e0552f,#a02410); border:1px solid #ffb48a; }
.db-gift .g-bow { position:absolute; top:0; left:50%; transform:translateX(-50%);
  width:14px; height:8px; background:var(--db-goldb);
  clip-path:polygon(0 50%,30% 0,45% 40%,55% 40%,70% 0,100% 50%,70% 100%,55% 60%,45% 60%,30% 100%); }

/* ── Streak bar ──────────────────────────────────────────────── */
.db-streak-bar { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
.db-sc { display:flex; align-items:center; gap:12px; padding:11px 14px;
  background:linear-gradient(180deg,var(--db-class-soft),rgba(4,3,9,.38));
  border:1px solid var(--db-class-line);
  border-radius:14px;
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04),0 10px 26px rgba(0,0,0,.18);
  transition:border-color .2s, transform .2s, box-shadow .2s; }
.db-sc:hover { border-color:var(--db-class-accent); transform:translateY(-1px); box-shadow:0 14px 28px rgba(0,0,0,.22),0 0 18px var(--db-class-glow); }
.db-sc-ico { width:26px; height:28px; flex-shrink:0; }
.db-flame-ico { background:radial-gradient(circle at 50% 70%,var(--db-fire) 30%,#ffd24a 60%,transparent);
  clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%);
  filter:drop-shadow(0 0 6px var(--db-fire));
  animation:db-flicker .6s ease-in-out infinite alternate; }
.db-clock-ico { border:3px solid var(--db-class-accent); border-radius:50%; position:relative;
  box-shadow:0 0 8px var(--db-class-glow); height:26px; }
.db-clock-ico::after { content:""; position:absolute; top:18%; left:46%;
  width:2px; height:36%; background:var(--db-class-accent); transform-origin:bottom; }
.db-sc-lab { font-family:'JetBrains Mono',monospace; font-size:6px;
  color:var(--db-dim); letter-spacing:1.2px; margin-bottom:5px; }
.db-sc-val { font-family:'VT323',monospace; font-size:20px;
  color:var(--db-goldb); letter-spacing:1px; text-shadow:0 0 8px rgba(244,204,120,.35); }
.db-sc.timer .db-sc-val { color:var(--db-class-accent); text-shadow:0 0 8px var(--db-class-glow); font-size:22px; }

/* ── Calendar grid (4-col) ───────────────────────────────────── */
.db-meta-grid {
  display:grid; grid-template-columns:1.05fr .95fr; gap:10px;
  margin:0 0 10px;
}

.db-week-note {
  display:grid; grid-template-columns:1.1fr .9fr; gap:10px;
  margin:0; padding:10px 12px;
  border:1px solid var(--db-class-line);
  border-radius:14px;
  background:
    linear-gradient(90deg,var(--db-class-soft),rgba(76,201,240,.035)),
    rgba(7,5,13,.42);
  box-shadow:inset 0 0 0 1px var(--db-class-soft);
}
.db-week-item { min-width:0; }
.db-week-label {
  font-family:'JetBrains Mono',monospace; font-size:6px;
  color:var(--db-dim); letter-spacing:1px; margin-bottom:5px;
}
.db-week-value {
  font-family:'VT323',monospace; font-size:18px; line-height:1;
  color:var(--db-goldb); letter-spacing:.5px;
  text-shadow:0 0 10px rgba(244,204,120,.28);
}
.db-week-value span { color:var(--db-dim); font-size:13px; }
.db-week-bar {
  height:5px; margin-top:8px; overflow:hidden; border-radius:99px;
  background:rgba(255,224,138,.12);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);
}
.db-week-fill {
  height:100%; border-radius:inherit;
  background:linear-gradient(90deg,var(--db-class-accent),var(--db-goldb));
  box-shadow:0 0 12px var(--db-class-glow);
}
.db-week-item.chest { text-align:right; }
.db-week-item.chest .db-week-value { color:var(--db-class-accent); text-shadow:0 0 10px var(--db-class-glow); }

.db-shield-note {
  display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px;
  margin:0; padding:10px 12px;
  border:1px solid var(--db-class-line);
  border-radius:16px;
  background:
    radial-gradient(circle at 8% 20%,var(--db-class-soft),transparent 34%),
    linear-gradient(90deg,rgba(244,204,120,.08),var(--db-class-soft)),
    rgba(7,5,13,.5);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05),0 12px 24px rgba(0,0,0,.18);
  position:relative; overflow:hidden;
}
.db-shield-note::before {
  content:""; position:absolute; inset:0 auto 0 0; width:3px;
  background:linear-gradient(180deg,var(--db-goldb),var(--db-class-accent));
  box-shadow:0 0 14px var(--db-class-glow-strong);
}
.db-shield-note.ready {
  border-color:var(--db-goldb);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.14),0 0 28px var(--db-class-glow);
}
.db-shield-note.used {
  border-color:rgba(138,201,38,.5);
  background:linear-gradient(90deg,rgba(138,201,38,.14),var(--db-class-soft)),rgba(7,5,13,.56);
}
.db-shield-icon {
  width:38px; height:38px; display:flex; align-items:center; justify-content:center;
  border:1px solid var(--db-class-line); border-radius:12px;
  background:radial-gradient(circle,var(--db-class-soft),rgba(7,5,13,.64));
  color:var(--db-goldb); font-size:20px;
  filter:drop-shadow(0 0 10px var(--db-class-glow));
}
.db-shield-kicker {
  font-family:'JetBrains Mono',monospace; font-size:6px;
  color:var(--db-class-accent); letter-spacing:1px; margin-bottom:3px;
}
.db-shield-copy {
  font-family:'VT323',monospace; font-size:17px; line-height:1.05;
  color:#fff7cf; letter-spacing:.3px;
}
.db-shield-count {
  min-width:46px; text-align:center; padding:6px 8px;
  border:1px solid rgba(244,204,120,.22); border-radius:999px;
  background:rgba(0,0,0,.22);
  font-family:'VT323',monospace; font-size:16px; color:var(--db-goldb);
}

.db-cal {
  display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px; margin-bottom:10px;
  padding:8px;
  border:1px solid var(--db-class-line);
  border-radius:18px;
  background:
    radial-gradient(circle at 50% 0,var(--db-class-soft),transparent 42%),
    rgba(7,5,13,.38);
  box-shadow:inset 0 0 42px rgba(0,0,0,.26);
}

/* ── Day cell ────────────────────────────────────────────────── */
.db-day { position:relative; min-height:82px;
  background:
    linear-gradient(180deg,var(--db-class-soft),rgba(255,224,138,.012)),
    rgba(11,8,18,.82);
  border:1px solid var(--db-class-line);
  border-radius:13px;
  box-shadow:inset 0 0 0 1px var(--db-class-soft),0 10px 22px rgba(0,0,0,.18);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:3px; padding:14px 3px 7px; overflow:hidden; cursor:pointer;
  transition:transform .18s, border-color .18s, box-shadow .18s, opacity .18s; }
.db-day:focus-visible {
  outline:2px solid var(--db-class-accent);
  outline-offset:2px;
}
.db-day::before { content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,var(--db-gold)22,transparent); pointer-events:none; }
.db-day.claimed { border-color:rgba(138,201,38,.35);
  background:linear-gradient(180deg,rgba(23,42,17,.76),rgba(7,11,7,.72)); opacity:.82; }
.db-day.today   { border-color:var(--db-gold); cursor:pointer;
  animation:db-today 1.8s ease-in-out infinite; }
.db-day.today::after { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:42%; height:3px;
  background:var(--db-goldb); box-shadow:0 0 10px var(--db-goldb); }
.db-day.today:hover { transform:translateY(-4px) scale(1.015); box-shadow:0 12px 30px rgba(244,204,120,.25); }
.db-day.locked  { opacity:.45; }
.db-day.selected {
  border-color:var(--db-class-accent);
  box-shadow:inset 0 0 0 1px var(--db-class-glow),0 0 26px var(--db-class-glow);
}
.db-day.milestone { grid-column:span 1; aspect-ratio:auto; flex-direction:column;
  gap:4px; justify-content:center; padding:14px 3px 7px; min-height:82px;
  background:
    radial-gradient(circle at 50% 20%,var(--db-class-soft),transparent 50%),
    linear-gradient(135deg,rgba(255,122,31,.12),rgba(11,8,18,.84)); }
.db-day.milestone .db-day-ico { width:40px; height:38px; }
.db-day.milestone .db-day-ico .db-g { width:32px; height:32px; }
.db-day.milestone.today { border-color:var(--db-fire);
  box-shadow:inset 0 0 0 1px var(--db-goldb),0 0 28px rgba(255,122,31,.5); }
.db-day > :not(.db-state-art):not(.db-cell-burst) { position:relative; z-index:2; }
.db-state-art {
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; pointer-events:none; user-select:none;
  opacity:.82; z-index:1;
}
.db-state-art.today { opacity:.95; z-index:3; filter:drop-shadow(0 0 12px rgba(244,204,120,.38)); }
.db-state-art.claimed { opacity:.78; mix-blend-mode:screen; }
.db-state-art.locked { opacity:.58; mix-blend-mode:luminosity; }
.db-state-art.streakBroken { opacity:.88; z-index:3; filter:drop-shadow(0 0 14px rgba(224,92,138,.36)); }
.db-state-fallback {
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  pointer-events:none; z-index:3; background:rgba(8,12,8,.42);
}
.db-state-fallback::before {
  content:""; width:24px; height:24px; background:var(--db-green);
  clip-path:polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%);
  box-shadow:0 0 12px rgba(138,201,38,.55);
}
.db-day.broken {
  border-color:rgba(224,92,138,.52);
  box-shadow:inset 0 0 0 1px rgba(224,92,138,.24),0 0 24px rgba(224,92,138,.18);
}
.db-lower-grid {
  display:grid; grid-template-columns:minmax(0,1.1fr) minmax(180px,.9fr); gap:10px;
  align-items:start; margin:10px 0 12px;
}

.db-reward-detail {
  display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:14px;
  margin:0; padding:11px 13px;
  border:1px solid var(--db-class-line);
  border-radius:16px;
  background:
    radial-gradient(circle at 8% 30%,var(--db-class-soft),transparent 34%),
    linear-gradient(90deg,var(--db-class-soft),rgba(76,201,240,.028)),
    rgba(7,5,13,.52);
  box-shadow:inset 0 0 0 1px var(--db-class-soft),0 12px 28px rgba(0,0,0,.2),0 0 18px rgba(0,0,0,.08);
}
.db-detail-icon { width:44px; height:44px; display:flex; align-items:center; justify-content:center; }
.db-detail-title {
  font-family:'VT323',monospace; font-size:20px; line-height:1;
  color:#fff7cf; letter-spacing:.4px; text-shadow:0 0 10px rgba(244,204,120,.32);
}
.db-detail-meta {
  display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;
  font-family:'JetBrains Mono',monospace; font-size:6px; letter-spacing:.65px;
  color:var(--db-dim);
}
.db-detail-pill {
  padding:4px 6px; border-radius:999px;
  background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.11);
}
.db-detail-pill.common { color:#cfe7d2; border-color:rgba(138,201,38,.28); }
.db-detail-pill.rare { color:#7ee2ff; border-color:rgba(76,201,240,.36); }
.db-detail-pill.epic { color:#ffd56f; border-color:rgba(244,204,120,.42); }
.db-detail-bonus { text-align:right; min-width:130px; }
.db-detail-label {
  font-family:'JetBrains Mono',monospace; font-size:6px; color:var(--db-dim);
  letter-spacing:1px; margin-bottom:4px;
}
.db-detail-value {
  font-family:'VT323',monospace; font-size:18px; line-height:1;
  color:var(--db-goldb); text-shadow:0 0 10px rgba(244,204,120,.28);
}

/* day number tag */
.db-day-num { position:absolute; top:6px; left:7px;
  font-family:'JetBrains Mono',monospace; font-size:6px;
  color:var(--db-muted); letter-spacing:.5px; }
.db-ms-tag  { position:absolute; top:6px; right:7px;
  font-family:'JetBrains Mono',monospace; font-size:5px;
  color:var(--db-fire); letter-spacing:1px;
  border:1px solid var(--db-fire); padding:2px 4px; background:rgba(0,0,0,.4); }
.db-day-ico { width:42px; height:40px; display:flex; align-items:center; justify-content:center; }
.db-day-amt { font-family:'VT323',monospace; font-size:15px;
  color:var(--db-parch); letter-spacing:.5px; }
.db-day-lbl { font-family:'JetBrains Mono',monospace; font-size:5px;
  color:var(--db-dim); letter-spacing:.5px; }
.db-day.today .db-day-lbl { color:var(--db-goldb); }
.db-ms-text { text-align:center; }
.db-ms-text .db-day-amt { font-family:'VT323',monospace; font-size:14px; color:var(--db-goldb); line-height:1; }
.db-ms-text .db-day-lbl { font-size:5.5px; color:var(--db-fire); letter-spacing:.8px; }

/* claimed check mark */
/* ── Reward icons (CSS-only with PNG slot) ───────────────────── */
.db-g { display:flex; align-items:center; justify-content:center; }
.db-g.claimed { filter:brightness(1.2) saturate(1.15) drop-shadow(0 0 12px var(--db-class-glow-strong)); }
.db-g.gold    { background:radial-gradient(circle at 35% 30%,#ffe28a,var(--db-gold) 60%,#6e4a13);
  border-radius:50%; border:1px solid #2a1a06; box-shadow:0 0 9px rgba(244,204,120,.5); }
.db-g.gems    { background:linear-gradient(135deg,#c77dff,#5a189a);
  clip-path:polygon(50% 0,100% 35%,80% 100%,20% 100%,0 35%); box-shadow:0 0 9px rgba(192,138,255,.5); }
.db-g.energy  { background:linear-gradient(180deg,#fff099,#ff9a1f);
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); box-shadow:0 0 9px rgba(255,154,31,.5); }
.db-g.xp      { background:linear-gradient(180deg,var(--db-xp3),var(--db-xp1));
  clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%);
  box-shadow:0 0 9px rgba(157,78,221,.5); }
.db-g.mystery { background:linear-gradient(135deg,#6a5a8a,#2a2335);
  clip-path:polygon(15% 0,85% 0,100% 15%,100% 85%,85% 100%,15% 100%,0 85%,0 15%);
  position:relative; }
.db-g.mystery::after { content:"?"; position:absolute; inset:0; display:flex;
  align-items:center; justify-content:center;
  font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--db-goldb); }
.db-g.chest   { background:linear-gradient(180deg,var(--db-goldb) 40%,var(--db-gold) 41%,#6e4a13);
  clip-path:polygon(0 35%,100% 35%,100% 100%,0 100%); box-shadow:0 0 12px rgba(244,204,120,.6); position:relative; }
.db-g.chest::before { content:""; position:absolute; top:0; left:0; width:100%; height:40%;
  background:linear-gradient(180deg,var(--db-goldb),var(--db-gold)); border-radius:30% 30% 0 0; }
.db-g.chest::after  { content:""; position:absolute; top:42%; left:42%; width:16%; height:22%; background:#2a1a06; }
.db-rwd-img {
  display:block; object-fit:contain; image-rendering:auto;
  filter:drop-shadow(0 0 10px rgba(244,204,120,.42));
  transform-origin:center;
}
.db-rwd-img.claimed {
  filter:brightness(1.22) saturate(1.18) drop-shadow(0 0 14px var(--db-class-glow-strong)) drop-shadow(0 0 10px rgba(244,204,120,.36));
  animation:db-float 2.2s ease-in-out infinite;
}
.db-rwd-img.gold { filter:drop-shadow(0 0 10px rgba(244,204,120,.48)); }
.db-rwd-img.gems { filter:drop-shadow(0 0 11px rgba(192,138,255,.45)); }
.db-rwd-img.energy { filter:drop-shadow(0 0 11px rgba(255,154,31,.42)); }
.db-rwd-img.chest { filter:drop-shadow(0 8px 14px rgba(0,0,0,.35)) drop-shadow(0 0 14px rgba(244,204,120,.38)); }
.db-rwd-img.claimed,
.db-rwd-img.gold.claimed,
.db-rwd-img.gems.claimed,
.db-rwd-img.energy.claimed,
.db-rwd-img.chest.claimed {
  filter:brightness(1.22) saturate(1.18) drop-shadow(0 0 14px var(--db-class-glow-strong)) drop-shadow(0 0 10px rgba(244,204,120,.36));
  animation:db-float 2.2s ease-in-out infinite;
}
.db-day.claim-burst {
  border-color:var(--db-goldb);
  box-shadow:inset 0 0 0 1px var(--db-goldb),0 0 34px var(--db-class-glow-strong),0 0 28px rgba(244,204,120,.28);
}
.db-cell-burst {
  position:absolute; inset:0; z-index:9; pointer-events:none; overflow:hidden;
}
.db-cell-burst-core {
  position:absolute; left:50%; top:48%; width:42px; height:42px; border-radius:50%;
  background:radial-gradient(circle,rgba(255,247,207,.9),rgba(244,204,120,.36) 42%,transparent 70%);
  transform:translate(-50%,-50%);
  filter:blur(.2px);
}
.db-cell-spark {
  position:absolute; left:50%; top:48%; width:5px; height:5px; border-radius:999px;
  background:var(--spark-color,var(--db-goldb));
  box-shadow:0 0 10px var(--spark-color,var(--db-goldb));
}
.db-cell-ring {
  position:absolute; left:50%; top:48%; width:36px; height:36px; border-radius:50%;
  border:1px solid rgba(255,224,138,.78);
  transform:translate(-50%,-50%);
  box-shadow:0 0 16px var(--db-class-glow);
}

/* ── Flame row ───────────────────────────────────────────────── */
.db-flames { display:flex; gap:2px; flex-wrap:wrap; align-items:center; min-height:22px; }
.db-flame  {
  width:20px; height:24px; display:flex; align-items:center; justify-content:center;
  position:relative; flex:0 0 auto;
}
.db-flame-lottie {
  width:24px; height:28px; pointer-events:none;
  filter:drop-shadow(0 0 7px rgba(255,128,31,.62)) drop-shadow(0 0 5px var(--db-class-glow));
}
.db-flame-fallback {
  width:13px; height:17px;
  background:linear-gradient(180deg,#5f6070,#343543);
  clip-path:polygon(50% 0,90% 32%,78% 100%,22% 100%,10% 32%);
  opacity:.55;
  filter:drop-shadow(0 0 2px rgba(255,255,255,.08));
}
.db-flame-loading {
  width:20px; height:24px;
}

/* ── Bottom row ──────────────────────────────────────────────── */
.db-bottom { display:flex; flex-direction:column; gap:8px; margin:0; }
.db-streak-cell { display:flex; align-items:center; gap:10px; padding:12px 14px;
  background:linear-gradient(180deg,var(--db-class-soft),rgba(5,4,10,.42));
  border:1px solid var(--db-class-line);
  border-radius:14px;
  box-shadow:inset 0 0 0 1px var(--db-class-soft); }
.db-streak-lbl { font-family:'JetBrains Mono',monospace; font-size:6px;
  color:var(--db-dim); letter-spacing:1px; margin-bottom:6px; }
.db-streak-val { font-family:'VT323',monospace; font-size:20px;
  color:var(--db-goldb); letter-spacing:1px; text-shadow:0 0 8px rgba(244,204,120,.35); }
.db-extra-cell { padding:12px 14px;
  background:linear-gradient(180deg,var(--db-class-soft),rgba(5,4,10,.42));
  border:1px solid var(--db-class-line);
  border-radius:14px;
  box-shadow:inset 0 0 0 1px var(--db-class-soft); }
.db-extra-head { font-family:'JetBrains Mono',monospace; font-size:7px;
  color:var(--db-goldb); letter-spacing:1px; margin-bottom:5px;
  text-shadow:0 0 8px rgba(244,204,120,.4); }
.db-extra-sub  { font-family:'VT323',monospace; font-size:14px;
  color:var(--db-dim); margin-bottom:8px; letter-spacing:.5px; }
.db-extra-row  { display:flex; align-items:center; gap:10px; }
.db-extra-val  { font-family:'VT323',monospace; font-size:21px;
  color:var(--db-goldb); text-shadow:0 0 10px rgba(244,204,120,.5); }

/* ── Claim result banner ─────────────────────────────────────── */
.db-result { background:linear-gradient(180deg,rgba(22,40,16,.92),rgba(10,18,10,.85));
  border:1px solid rgba(138,201,38,.5); border-radius:14px;
  padding:12px 14px; margin-bottom:12px;
  position:relative; overflow:hidden; }
.db-result::before { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:55%; height:2px;
  background:var(--db-green); box-shadow:0 0 12px var(--db-green); }
.db-result-head { font-family:'JetBrains Mono',monospace; font-size:7px;
  color:var(--db-green); letter-spacing:1px; margin-bottom:8px;
  text-shadow:0 0 8px rgba(138,201,38,.5); }
.db-result-rewards { display:flex; gap:18px; }
.db-result-val { font-family:'VT323',monospace; font-size:22px;
  color:var(--db-goldb); text-shadow:0 0 12px rgba(244,204,120,.55); }
.db-result-lab { font-family:'JetBrains Mono',monospace; font-size:5px;
  color:var(--db-dim); margin-top:2px; }

/* ── CTA Button ──────────────────────────────────────────────── */
.db-cta { width:100%; font-family:'JetBrains Mono',monospace; font-size:10px;
  padding:14px; background:linear-gradient(180deg,#bf8420,#68420a);
  color:#fff7cf; border:1px solid var(--db-goldb);
  border-radius:14px;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.15),inset 0 -2px 0 rgba(0,0,0,.4),0 0 20px var(--db-class-glow);
  cursor:pointer; letter-spacing:2px; text-shadow:0 1px 0 rgba(0,0,0,.5);
  transition:.1s; position:relative; overflow:hidden; }
.db-cta .db-shine { position:absolute; top:0; left:-100%; width:100%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent); }
.db-cta:hover:not(:disabled) { background:linear-gradient(180deg,#c89b3c,#6e4a13);
  transform:translateY(-1px); box-shadow:inset 0 0 0 1px rgba(255,255,255,.25),0 0 32px var(--db-class-glow-strong); }
.db-cta:hover:not(:disabled) .db-shine { left:150%; transition:left .6s ease; }
.db-cta:active:not(:disabled) { transform:translateY(1px); }
.db-cta:disabled { background:var(--db-inner); color:var(--db-muted);
  border-color:var(--db-bd); cursor:not-allowed; box-shadow:none; text-shadow:none; }

/* ── Countdown ───────────────────────────────────────────────── */
.db-countdown { display:inline-flex; align-items:center; gap:12px;
  background:rgba(7,5,12,.72); border:1px solid var(--db-class-line);
  border-radius:14px;
  padding:9px 18px; margin-bottom:10px; }
.db-count-val { font-family:'VT323',monospace; font-size:24px;
  color:var(--db-goldb); letter-spacing:2px; text-shadow:0 0 10px rgba(244,204,120,.35); }

/* ── Shower particles (fixed overlay) ───────────────────────── */
.db-shower { position:fixed; inset:0; pointer-events:none; z-index:9100; overflow:hidden; }
.db-sh-coin { position:absolute; width:13px; height:13px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#ffe28a,var(--db-gold) 60%,#6e4a13);
  border:1px solid #2a1a06; box-shadow:0 0 8px rgba(244,204,120,.6); }
.db-sh-gem  { position:absolute; width:12px; height:12px;
  background:linear-gradient(135deg,#c77dff,#5a189a);
  transform:rotate(45deg); border:1px solid #1a0a2a; box-shadow:0 0 8px rgba(192,138,255,.6); }

/* ── Chest burst (fixed overlay) ────────────────────────────── */
.db-burst-wrap { position:fixed; inset:0; z-index:9200; display:flex;
  align-items:center; justify-content:center; pointer-events:none; }
.db-burst-inner { text-align:center; animation:db-burst .5s cubic-bezier(.3,1.5,.5,1) both; }
.db-burst-chest { width:110px; height:88px; margin:0 auto 16px; position:relative; }
.db-burst-body { position:absolute; bottom:0; width:100%; height:62%;
  background:linear-gradient(180deg,#c89b3c,#6e4a13); border:3px solid #2a1a06; }
.db-burst-lid  { position:absolute; top:0; width:100%; height:42%;
  background:linear-gradient(180deg,#f4cc78,#c89b3c); border:3px solid #2a1a06;
  border-radius:40% 40% 0 0; transform-origin:bottom;
  animation:db-chest-lid .6s ease-out .3s forwards; }
.db-burst-glow { position:absolute; inset:-50px;
  background:radial-gradient(circle,rgba(244,204,120,.65),transparent 65%);
  animation:db-glow-r 1.2s ease-out; }
.db-burst-label { font-family:'JetBrains Mono',monospace; font-size:13px;
  color:var(--db-goldb); letter-spacing:2px;
  text-shadow:0 0 16px rgba(244,204,120,.8); }

/* ── Toast stack (fixed) ─────────────────────────────────────── */
.db-toasts { position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column-reverse; gap:6px; z-index:9300; pointer-events:none;
  min-width:280px; }
.db-toast { background:linear-gradient(180deg,#1a1525,#0a0712);
  border:2px solid var(--db-golds); box-shadow:0 0 0 2px #050308,0 0 24px rgba(244,204,120,.4);
  color:var(--db-goldb); padding:10px 18px;
  font-family:'JetBrains Mono',monospace; font-size:8px;
  letter-spacing:1.2px; text-align:center;
  animation:db-toast-in .3s ease-out, db-toast-out .4s ease-in 2.4s forwards; }
.db-toast .db-tv { color:#fff; }

/* ── Spinner ─────────────────────────────────────────────────── */
.db-spinner { display:inline-block; width:10px; height:10px; border:2px solid rgba(255,247,207,.25); border-top-color:#fff7cf; border-radius:50%; animation:db-spin .7s linear infinite; vertical-align:middle; }

@media (max-width: 720px) {
  .db-overlay { padding:10px; align-items:center; }
  .db-popup { width:min(100%,calc(100vw - 20px)); max-height:88vh; border-radius:16px; }
  .db-inner { padding:20px 14px 16px; }
  .db-header { margin:0 40px 14px; padding:10px 12px 12px; }
  .db-title { font-size:16px; letter-spacing:2px; }
  .db-sub { font-size:14px; }
  .db-streak-bar { grid-template-columns:1fr; }
  .db-meta-grid, .db-lower-grid { grid-template-columns:1fr; }
  .db-week-note { grid-template-columns:1fr; gap:8px; }
  .db-shield-note { grid-template-columns:auto 1fr; }
  .db-shield-count { grid-column:1 / -1; justify-self:start; }
  .db-week-item.chest { text-align:left; }
  .db-cal { grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; padding:8px; }
  .db-day { min-height:90px; padding:14px 5px 8px; gap:4px; }
  .db-day.milestone { grid-column:span 2; min-height:90px; flex-direction:row; gap:10px; padding:12px; }
  .db-day.milestone .db-day-ico { width:48px; height:44px; }
  .db-day.milestone .db-day-ico .db-g { width:36px; height:36px; }
  .db-reward-detail { grid-template-columns:auto 1fr; }
  .db-detail-bonus { grid-column:1 / -1; text-align:left; min-width:0; }
  .db-close { top:12px; right:12px; }
}

@media (max-width: 420px) {
  .db-header { margin:0 38px 12px; }
  .db-ribbon { gap:8px; }
  .db-gift { width:22px; height:22px; }
  .db-cal { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .db-day { min-height:104px; padding:17px 5px 8px; }
  .db-day.milestone { flex-direction:column; gap:5px; }
  .db-day-amt { font-size:14px; }
  .db-cta { font-size:9px; letter-spacing:1.2px; padding:14px 10px; }
}
`;

// ─── CSS injection (once) ──────────────────────────────────────────────────────
function useCSS() {
  useEffect(() => {
    if (document.getElementById("fvdb-css-v14")) return;
    const s = document.createElement("style");
    s.id = "fvdb-css-v14"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
}

// ─── Reward icon ───────────────────────────────────────────────────────────────
const REWARD_ICON_SRC = {
  gold: "/ui/icon-gold.png",
  gems: "/ui/icon-gem.png",
  energy: "/ui/icon-energy.png",
  chest: "/sprites/chest_closed.png",
  chestClaimed: "/sprites/chest_open.png",
};

const DAY_STATE_ART = {
  claimed: "/ui/dailybonus/day-claimed.png",
  locked: "/ui/dailybonus/day-locked.png",
  today: "/ui/dailybonus/day-today-frame.png",
  streakBroken: "/ui/dailybonus/day-streak-broken.png",
};

function DayStateArt({ state }) {
  const [missing, setMissing] = useState(false);
  const src = DAY_STATE_ART[state];
  if (!src) return null;

  return (
    <>
      {!missing && (
        <img
          className={`db-state-art ${state}`}
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setMissing(true)}
        />
      )}
      {missing && state === "claimed" && <span className="db-state-fallback" aria-hidden="true"/>}
    </>
  );
}

function RwdIcon({ type, size = 24, float = false, status = "", glow = false }) {
  const iconKey = type === "chest" && status === "claimed" ? "chestClaimed" : type;
  const src = REWARD_ICON_SRC[iconKey];
  if (src) {
    return (
      <img
        className={`db-rwd-img ${type} ${glow ? "claimed" : ""}`}
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          width:size,
          height:size,
          animation: float ? "db-float 2.2s ease-in-out infinite" : "none",
        }}
      />
    );
  }

  return (
    <div className={`db-g ${type} ${glow ? "claimed" : ""}`}
      style={{ width:size, height:size,
        animation: float ? "db-float 2.2s ease-in-out infinite" : "none" }} />
  );
}

// ─── Gift mini ─────────────────────────────────────────────────────────────────
function GiftMini() {
  return (
    <div className="db-gift">
      <div className="g-box"/><div className="g-lid"/><div className="g-bow"/>
    </div>
  );
}

// ─── Flame row ─────────────────────────────────────────────────────────────────
function FlameRow({ streak, max = 7 }) {
  const fireAnimation = useLottieJson("/lottie/fire.json");
  return (
    <div className="db-flames">
      {Array.from({ length:max }, (_, i) => {
        const lit = i < streak;
        return (
          <div key={i} className={`db-flame${lit ? "" : " dim"}`}>
            {lit && fireAnimation ? (
              <Suspense fallback={<span className="db-flame-loading"/>}>
                <Lottie
                  animationData={fireAnimation}
                  loop
                  autoplay
                  className="db-flame-lottie"
                  rendererSettings={{ preserveAspectRatio:"xMidYMid meet" }}
                />
              </Suspense>
            ) : lit ? (
              <span className="db-flame-loading"/>
            ) : (
              <span className="db-flame-fallback"/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Day cell ──────────────────────────────────────────────────────────────────
const REWARD_INFO = {
  gold: { name:"Oro", rarity:"Comun", rarityKey:"common", origin:"Bono diario" },
  energy: { name:"Energia", rarity:"Comun", rarityKey:"common", origin:"Reserva de entrenamiento" },
  gems: { name:"Gema", rarity:"Rara", rarityKey:"rare", origin:"Tesoro del calendario" },
  xp: { name:"Impulso XP", rarity:"Rara", rarityKey:"rare", origin:"Entrenamiento bendecido" },
  mystery: { name:"Botin sorpresa", rarity:"Epico", rarityKey:"epic", origin:"Evento del calendario" },
  chest: { name:"Cofre semanal", rarity:"Epico", rarityKey:"epic", origin:"Meta semanal" },
};

function getRewardInfo(reward, day) {
  const info = REWARD_INFO[reward.type] || REWARD_INFO.mystery;
  const bonus = reward.type === "mystery" ? "Recompensa aleatoria" : `${reward.amt} ${reward.label}`;
  return {
    ...info,
    bonus,
    origin: reward.milestone ? `Dia ${day} del calendario` : info.origin,
  };
}

function RewardDetail({ day, reward }) {
  const info = getRewardInfo(reward, day);
  return (
    <motion.div
      className="db-reward-detail"
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:.18 }}
      key={`${day}-${reward.type}`}
    >
      <div className="db-detail-icon">
        <RwdIcon type={reward.type} size={44} float={false}/>
      </div>
      <div>
        <div className="db-detail-title">{info.name}</div>
        <div className="db-detail-meta">
          <span className={`db-detail-pill ${info.rarityKey}`}>{info.rarity}</span>
          <span className="db-detail-pill">Dia {day}</span>
          <span className="db-detail-pill">{info.origin}</span>
        </div>
      </div>
      <div className="db-detail-bonus">
        <div className="db-detail-label">BONUS</div>
        <div className="db-detail-value">{info.bonus}</div>
      </div>
    </motion.div>
  );
}

const CLAIM_BURST_PARTICLES = Array.from({ length:18 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 18;
  const distance = 34 + (i % 4) * 10;
  return {
    id:i,
    x:Math.cos(angle) * distance,
    y:Math.sin(angle) * distance,
    color:i % 3 === 0 ? "var(--db-goldb)" : i % 3 === 1 ? "var(--db-class-accent)" : "#fff7cf",
    delay:(i % 5) * .025,
  };
});

function CellClaimBurst({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="db-cell-burst"
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{ opacity:0 }}
          transition={{ duration:.18 }}
        >
          <motion.span
            className="db-cell-burst-core"
            initial={{ scale:.35, opacity:.95 }}
            animate={{ scale:1.65, opacity:0 }}
            transition={{ duration:.72, ease:"easeOut" }}
          />
          <motion.span
            className="db-cell-ring"
            initial={{ scale:.45, opacity:.9 }}
            animate={{ scale:2.4, opacity:0 }}
            transition={{ duration:.76, ease:"easeOut" }}
          />
          {CLAIM_BURST_PARTICLES.map(p => (
            <motion.span
              key={p.id}
              className="db-cell-spark"
              style={{ "--spark-color":p.color }}
              initial={{ x:"-50%", y:"-50%", scale:.5, opacity:0 }}
              animate={{ x:`calc(-50% + ${p.x}px)`, y:`calc(-50% + ${p.y}px)`, scale:[.65,1,.25], opacity:[0,1,0] }}
              transition={{ duration:.82, delay:p.delay, ease:"easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DayCell({ day, reward, status, onClaim, onSelect, selected = false, streakBroken = false, burstActive = false }) {
  const isMilestone = reward.milestone;
  const rewardInfo = getRewardInfo(reward, day);
  const stateArt = streakBroken && status === "today" ? "streakBroken" : status;
  let cls = "db-day";
  if (status === "claimed") cls += " claimed";
  else if (status === "today") cls += " today";
  else cls += " locked";
  if (isMilestone) cls += " milestone";
  if (streakBroken && status === "today") cls += " broken";
  if (selected) cls += " selected";
  if (burstActive) cls += " claim-burst";

  const handleClick = () => {
    onSelect?.();
    if (status === "today") onClaim();
  };
  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleClick();
  };

  return (
    <div className={cls} onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`${rewardInfo.name}. ${rewardInfo.rarity}. ${rewardInfo.bonus}. ${rewardInfo.origin}.`}
      style={{ animation: status === "today" ? "db-pop .45s ease both" : "none" }}>
      <DayStateArt state={stateArt}/>
      <CellClaimBurst show={burstActive}/>
      <span className="db-day-num">DÍA {day}</span>
      {isMilestone && <span className="db-ms-tag">META</span>}

      {isMilestone ? (
        <>
          <div className="db-day-ico">
            <RwdIcon type={reward.type} size={56} float={status==="today" || burstActive} status={status} glow={burstActive}/>
          </div>
          <div className="db-ms-text">
            <div className="db-day-amt">{reward.amt} {reward.label}</div>
            <div className="db-day-lbl">COFRE LEGENDARIO</div>
          </div>
        </>
      ) : (
        <>
          <div className="db-day-ico">
            <RwdIcon type={reward.type} size={42} float={status==="today" || burstActive} status={status} glow={burstActive}/>
          </div>
          <div className="db-day-amt">{reward.amt}</div>
          <div className="db-day-lbl">
            {status === "today" ? "HOY" : status === "claimed" ? "" : reward.label}
          </div>
        </>
      )}

    </div>
  );
}

// ─── Shower particles ──────────────────────────────────────────────────────────
function Shower({ particles }) {
  if (!particles.length) return null;
  return (
    <div className="db-shower">
      {particles.map(p => (
        <div key={p.id} className={`db-sh-${p.type}`}
          style={{ left:p.x+"%", top:-20,
            animation:`db-fall ${p.dur}s ease-in ${p.delay}s forwards` }}/>
      ))}
    </div>
  );
}

// ─── Chest burst ───────────────────────────────────────────────────────────────
function ChestBurst({ label, show }) {
  if (!show) return null;
  return (
    <div className="db-burst-wrap">
      <div className="db-burst-inner">
        <div className="db-burst-chest">
          <div className="db-burst-glow"/>
          <div className="db-burst-body"/>
          <div className="db-burst-lid"/>
        </div>
        <div className="db-burst-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Toast item ────────────────────────────────────────────────────────────────
function Toasts({ list }) {
  return (
    <div className="db-toasts">
      {list.map(t => (
        <div key={t.id} className="db-toast">
          <span>{t.text}</span>
          {t.value && <span className="db-tv">{t.value}</span>}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN MODAL
// ══════════════════════════════════════════════════════════════════════════════
export default function DailyBonusModal({ profile, onClose, onClaimed }) {
  useCSS();
  const dragControls = useDragControls();
  const classKey = normalizeDailyBonusClass(profile);
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const classStyle = {
    "--db-class-accent": classTheme.accent,
    "--db-class-secondary": classTheme.secondary,
    "--db-class-bg": classTheme.bg,
    "--db-class-soft": classTheme.soft,
    "--db-class-line": hexToRgba(classTheme.accent, .36),
    "--db-class-glow": hexToRgba(classTheme.accent, .34),
    "--db-class-glow-strong": hexToRgba(classTheme.accent, .62),
  };

  const [claiming,    setClaiming]    = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [countdown,   setCountdown]   = useState(timeUntilMidnightUTC());
  const [particles,   setParticles]   = useState([]);
  const [burst,       setBurst]       = useState(false);
  const [burstLabel,  setBurstLabel]  = useState("");
  const [toasts,      setToasts]      = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [claimedBurstDay, setClaimedBurstDay] = useState(null);
  const [shieldStatus, setShieldStatus] = useState({
    active: profile?.streakShield || null,
    protectors: 0,
    loaded: false,
  });
  const particleRef = useRef(0);
  const toastRef    = useRef(0);
  const claimBurstTimer = useRef(null);

  const startDrag = useCallback((event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragControls.start(event);
  }, [dragControls]);

  useEffect(() => {
    const iv = setInterval(() => setCountdown(timeUntilMidnightUTC()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => () => {
    if (claimBurstTimer.current) clearTimeout(claimBurstTimer.current);
  }, []);

  // ── Derived state ──────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (alive) setShieldStatus(prev => ({ ...prev, loaded:true }));
          return;
        }
        const token = await user.getIdToken();
        const [boostsRes, invRes] = await Promise.allSettled([
          getActiveBoosts(token),
          getInventario(token),
        ]);
        if (!alive) return;
        const boosts = boostsRes.status === "fulfilled" ? boostsRes.value : null;
        const inv = invRes.status === "fulfilled" ? invRes.value : null;
        setShieldStatus({
          active: boosts?.streakShield || profile?.streakShield || null,
          protectors: countStreakProtectors(inv?.items || []),
          loaded: true,
        });
      } catch {
        if (alive) {
          setShieldStatus(prev => ({ ...prev, active:profile?.streakShield || prev.active, loaded:true }));
        }
      }
    })();
    return () => { alive = false; };
  }, [profile?.streakShield]);

  const today           = utcDateStr(0);
  const yesterday       = utcDateStr(-1);
  const lastBonus       = profile?.lastDailyBonusDate || null;
  const alreadyClaimed  = lastBonus === today;
  const canContinue     = lastBonus === yesterday;
  const currentStreak   = profile?.streak || 0;
  const shieldAvailable = Boolean(shieldStatus.active) || shieldStatus.protectors > 0;
  const streakBroken    = Boolean(lastBonus && !alreadyClaimed && !canContinue && currentStreak > 0);
  const nextStreak      = alreadyClaimed
    ? currentStreak
    : canContinue
      ? currentStreak + 1
      : streakBroken && shieldAvailable
        ? currentStreak + 1
        : 1;
  const effectiveClaimed = alreadyClaimed || !!claimResult;
  const displayStreak   = claimResult ? claimResult.streak : nextStreak;
  const shieldWillSave = streakBroken && !effectiveClaimed && shieldAvailable;
  const shieldWasUsed = Boolean(claimResult?.streakProtected || claimResult?.shieldConsumed);
  const shieldLeft = shieldTimeLeft(shieldStatus.active);
  const shieldKicker = shieldWasUsed
    ? "GUARDA ACTIVADA"
    : shieldWillSave
      ? "AMULETO LISTO"
      : shieldStatus.active
        ? "PROTECCION ACTIVA"
        : shieldStatus.protectors > 0
          ? "EN INVENTARIO"
          : streakBroken
            ? "SIN PROTECTOR"
            : "GUARDA DE RACHA";
  const shieldCopy = shieldWasUsed
    ? `Tu racha se salvo y sigue en ${displayStreak} dias.`
    : shieldWillSave
      ? "Al reclamar, el amuleto se consumira y tu racha seguira viva."
      : shieldStatus.active
        ? `Proteccion preparada${shieldLeft ? ` por ${shieldLeft}` : ""}.`
        : shieldStatus.protectors > 0
          ? `${shieldStatus.protectors} amuleto${shieldStatus.protectors === 1 ? "" : "s"} esperando en tu mochila.`
          : streakBroken
            ? "Compra uno en la tienda para salvar rachas futuras."
            : "Si algun dia fallas, un amuleto puede salvar la cadena.";

  // Position in 7-day cycle
  const cyclePos = ((displayStreak - 1) % 7) + 1; // 1..7
  const activeSelectedDay = selectedDay || cyclePos;
  const selectedReward = SCHEDULE[activeSelectedDay - 1] || SCHEDULE[0];
  const weeklyProgress = Math.min(cyclePos, 7);
  const daysToChest = Math.max(0, 7 - weeklyProgress);
  const chestHint = daysToChest === 0
    ? (effectiveClaimed ? "Cofre abierto" : "Cofre listo")
    : `Cofre mayor en ${daysToChest} ${daysToChest === 1 ? "dia" : "dias"}`;
  const weeklyProgressPct = `${(weeklyProgress / 7) * 100}%`;

  const dayStatuses = Array.from({ length:7 }, (_, i) => {
    const d = i + 1;
    if (d < cyclePos || (effectiveClaimed && d === cyclePos)) return "claimed";
    if (d === cyclePos) return "today";
    return "locked";
  });

  const streakDays = Math.min(displayStreak, 7);

  // ── Helpers ────────────────────────────────────────────────────
  function spawnShower(kind) {
    const pts = Array.from({ length:30 }, () => {
      const type = kind === "gem" ? "gem" : kind === "coin" ? "coin" : Math.random() > .5 ? "coin" : "gem";
      return { id:++particleRef.current, type, x:Math.random()*100,
               dur:1.4+Math.random()*1.6, delay:Math.random()*.5 };
    });
    setParticles(pts);
    setTimeout(() => setParticles([]), 3800);
  }

  function showToast(text, value = "", kind = "system") {
    if (kind === "xp" && !canShowXpPopups()) return;
    if (kind === "streak" && !canShowStreakNotif()) return;
    if (kind === "system" && !canShowXpPopups() && String(value).includes("XP")) return;
    if (kind === "system" && !canShowStreakNotif() && (String(text).includes("RACHA") || String(value).includes("RACHA"))) return;
    const id = ++toastRef.current;
    setToasts(prev => [...prev, { id, text, value }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2900);
  }

  function showChestBurst(label) {
    setBurstLabel(label);
    setBurst(true);
    spawnShower("mix");
    setTimeout(() => setBurst(false), 2000);
  }

  // ── Claim ──────────────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (effectiveClaimed || claiming) return;
    setClaiming(true);
    try {
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken();
      const res   = await claimDailyBonus(token);
      if (!res?.ok) throw new Error(res?.message || "Error al reclamar");
      setClaimResult(res);
      if (res.streakProtected || res.shieldConsumed) {
        setShieldStatus(prev => ({
          ...prev,
          active: res.streakShield || prev.active,
          protectors: res.shieldSource === "inventory" ? Math.max(0, prev.protectors - 1) : prev.protectors,
        }));
      }
      onClaimed?.(res);
      setSelectedDay(cyclePos);
      setClaimedBurstDay(cyclePos);
      if (claimBurstTimer.current) clearTimeout(claimBurstTimer.current);
      claimBurstTimer.current = setTimeout(() => setClaimedBurstDay(null), 1500);

      const reward = calcReward(res.streak || nextStreak);
      if (reward.isMilestone) {
        showChestBurst("¡COFRE LEGENDARIO!");
      } else if (res.streakProtected || res.shieldConsumed) {
        showToast("AMULETO CONSUMIDO", "RACHA SALVADA", "streak");
      } else if (SCHEDULE[(cyclePos-1) % SCHEDULE.length].type === "mystery") {
        showToast("¡RECOMPENSA SORPRESA!", `+${res.coinsGained} ORO`);
      } else {
        showToast("¡RECOMPENSA RECLAMADA!", `+${res.xpGained} XP · +${res.coinsGained} MONEDAS`);
      }
    } catch (e) {
      console.error("Claim error:", e.message);
      showToast("ERROR AL RECLAMAR — INTÉNTALO DE NUEVO");
    } finally {
      setClaiming(false);
    }
  }, [effectiveClaimed, claiming, onClaimed, nextStreak, cyclePos]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Global particle layers */}
      <Shower particles={particles}/>
      <ChestBurst label={burstLabel} show={burst}/>
      <Toasts list={toasts}/>

      <AnimatePresence>
        <div className="db-overlay" style={classStyle} onClick={e => e.target === e.currentTarget && onClose?.()}>
          <motion.div
            className="db-popup db-scroll"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.04}
            whileDrag={{ scale:1.01 }}
            initial={{ opacity:0, scale:.85, y:24 }}
            animate={{ opacity:1, scale:1,   y:0  }}
            exit={{    opacity:0, scale:.9,  y:16 }}
            transition={{ type:"spring", stiffness:340, damping:28 }}
          >
            <div className="db-corners"/>
            <div className="db-sweep"/>
            <div className="db-rune">◆</div>

            {/* Embers */}
            <div className="db-embers">
              {Array.from({ length:14 }, (_, i) => (
                <div key={i} className="db-pe" style={{
                  left:`${(i*7+4)%100}%`,
                  animationDuration:`${5+(i%4)*1.5}s`,
                  animationDelay:`${(i*.65)%7}s`,
                }}/>
              ))}
            </div>

            {/* Scanlines */}
            <div className="db-scan"/>

            <div className="db-inner">

              {/* Close */}
              <button className="db-close" onClick={onClose} aria-label="Cerrar calendario de recompensas">X</button>

              {/* ── HEADER ── */}
              <div className="db-header" onPointerDown={startDrag}>
                <div className="db-drag-handle" aria-hidden="true">
                  <span/><span/><span/>
                </div>
                <div className="db-ribbon">
                  <span style={{ color:"var(--db-gold)",opacity:.5,fontSize:12 }}>◆</span>
                  <GiftMini/>
                  <h2 className="db-title">BONO DIARIO</h2>
                  <GiftMini/>
                  <span style={{ color:"var(--db-gold)",opacity:.5,fontSize:12 }}>◆</span>
                </div>
                <div className="db-sub">Cada entrenamiento abre otra recompensa</div>
              </div>

              {/* ── STREAK + TIMER BAR ── */}
              <div className="db-streak-bar">
                <div className="db-sc">
                  <div className="db-sc-ico db-flame-ico"/>
                  <div>
                    <div className="db-sc-lab">RACHA DE CONEXIÓN</div>
                    <div className="db-sc-val">
                      {displayStreak} <span style={{ fontSize:10,color:"var(--db-dim)" }}>DÍAS</span>
                    </div>
                  </div>
                </div>
                <div className="db-sc timer">
                  <div className="db-sc-ico db-clock-ico"/>
                  <div>
                    <div className="db-sc-lab">PRÓXIMO BONO EN</div>
                    <div className="db-sc-val">{effectiveClaimed ? countdown : "—"}</div>
                  </div>
                </div>
              </div>

              {/* ── CLAIM RESULT BANNER ── */}
              <AnimatePresence>
                {claimResult && (
                  <motion.div className="db-result"
                    initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    <div className="db-result-head">¡RECOMPENSA RECLAMADA!</div>
                    <div className="db-result-rewards">
                      <div>
                        <div className="db-result-val">+{claimResult.xpGained} XP</div>
                        <div className="db-result-lab">EXPERIENCIA</div>
                      </div>
                      <div>
                        <div className="db-result-val">+{claimResult.coinsGained}</div>
                        <div className="db-result-lab">MONEDAS</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── SEMANA + ESCUDO (en paralelo) ── */}
              <div className="db-meta-grid">
                <div className="db-week-note">
                  <div className="db-week-item">
                    <div className="db-week-label">PROGRESO SEMANAL</div>
                    <div className="db-week-value">{weeklyProgress}<span>/7</span></div>
                    <div className="db-week-bar" aria-hidden="true">
                      <div className="db-week-fill" style={{ width:weeklyProgressPct }}/>
                    </div>
                  </div>
                  <div className="db-week-item chest">
                    <div className="db-week-label">SIGUIENTE META</div>
                    <div className="db-week-value">{chestHint}</div>
                  </div>
                </div>

                <div className={`db-shield-note${shieldWillSave ? " ready" : ""}${shieldWasUsed ? " used" : ""}`}>
                  <div className="db-shield-icon" aria-hidden="true">🔰</div>
                  <div>
                    <div className="db-shield-kicker">{shieldKicker}</div>
                    <div className="db-shield-copy">{shieldCopy}</div>
                  </div>
                  <div className="db-shield-count">
                    {shieldStatus.protectors > 0 ? `x${shieldStatus.protectors}` : shieldStatus.active ? "ON" : "0"}
                  </div>
                </div>
              </div>

              {/* ── 7-DAY CALENDAR (una sola fila) ── */}
              <div className="db-cal">
                {SCHEDULE.map((reward, i) => (
                  <DayCell
                    key={i}
                    day={i + 1}
                    reward={reward}
                    status={dayStatuses[i]}
                    onClaim={handleClaim}
                    onSelect={() => setSelectedDay(i + 1)}
                    selected={activeSelectedDay === i + 1}
                    streakBroken={streakBroken}
                    burstActive={claimedBurstDay === i + 1}
                  />
                ))}
              </div>

              {/* ── DETALLE DE RECOMPENSA + BOTTOM (en paralelo) ── */}
              <div className="db-lower-grid">
                <RewardDetail day={activeSelectedDay} reward={selectedReward}/>

                <div className="db-bottom">
                  <div className="db-streak-cell">
                    <div style={{ flex:1 }}>
                      <div className="db-streak-lbl">RACHA ACTUAL</div>
                      <FlameRow streak={streakDays}/>
                      <div className="db-streak-val" style={{ marginTop:6 }}>
                        {displayStreak} DÍAS
                      </div>
                    </div>
                  </div>
                  <div className="db-extra-cell">
                    <div className="db-extra-head">RECOMPENSA EXTRA</div>
                    <div className="db-extra-sub">¡Mantén tu racha 7 días!</div>
                    <div className="db-extra-row">
                      <RwdIcon type="gems" size={22}/>
                      <span className="db-extra-val">50</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"6px",
                        color:"var(--db-dim)",marginLeft:4 }}>GEMAS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CTA ── */}
              {effectiveClaimed ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"6px",
                    color:"var(--db-dim)",letterSpacing:"1px",marginBottom:10 }}>
                    PRÓXIMO BONO EN
                  </div>
                  <div className="db-countdown">
                    <span className="db-count-val">{countdown}</span>
                  </div>
                  <button className="db-cta" disabled>
                    <span className="db-shine"/>
                    VUELVE MAÑANA POR MÁS
                  </button>
                </div>
              ) : (
                <button className="db-cta" onClick={handleClaim} disabled={claiming}>
                  <span className="db-shine"/>
                  {claiming
                    ? <><div className="db-spinner"/> RECLAMANDO…</>
                    : `RECLAMAR RECOMPENSA DEL DÍA ${cyclePos}`}
                </button>
              )}

            </div>{/* /inner */}
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
}
