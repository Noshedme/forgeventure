// src/components/shared/DailyBonusModal.jsx — Clean glass redesign
// Single fixed card, no scroll, glass-blurred backdrop, P-palette themed.
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { auth } from "../../firebase.js";
import { claimDailyBonus, getActiveBoosts, getInventario } from "../../services/api.js";
import { P } from "../../design/system.jsx";
import { USER_CLASS_THEME } from "../../pages/user/userClassTheme.js";
import { canShowStreakNotif, canShowXpPopups } from "../../utils/runtimeSettings.js";

// ─── Reward logic (unchanged) ─────────────────────────────────────────────
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

// ─── 7-day schedule (day 7 = milestone chest) ─────────────────────────────
const SCHEDULE = [
  { type:"gold",    amt:"+100",  label:"ORO"     },
  { type:"energy",  amt:"+3",    label:"ENERGÍA" },
  { type:"gems",    amt:"+10",   label:"GEMAS"   },
  { type:"xp",      amt:"×2",    label:"XP"      },
  { type:"gold",    amt:"+300",  label:"ORO"     },
  { type:"mystery", amt:"???",   label:"MISTERIO"},
  { type:"chest",   amt:"+1000", label:"COFRE",  milestone:true },
];

// ─── Theme helpers ──────────────────────────────────────────────────────
function normalizeDailyBonusClass(profile) {
  const raw = profile?.heroClass || profile?.clase || profile?.class || profile?.classId || profile?.roleClass || "DEFAULT";
  const key = String(raw).trim().toUpperCase();
  return USER_CLASS_THEME[key] ? key : "DEFAULT";
}

function hexToRgba(hex, alpha = 1) {
  const clean = String(hex || "#A55EEA").replace("#", "");
  const value = clean.length === 3
    ? clean.split("").map(ch => ch + ch).join("")
    : clean.padEnd(6, "0").slice(0, 6);
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── CSS ────────────────────────────────────────────────────────────────
const CSS = `
:root {
  --dbn-bg1: ${P.bg1}; --dbn-bg2: ${P.bg2};
  --dbn-border: rgba(255,255,255,.1); --dbn-border-soft: rgba(255,255,255,.06);
  --dbn-text: ${P.text}; --dbn-muted: ${P.muted}; --dbn-mutedL: ${P.mutedL};
  --dbn-gold: ${P.gold}; --dbn-green: #6BC87A; --dbn-crim: #E0688A;
  --dbn-class-accent: #A55EEA; --dbn-class-bg: #14092A;
  --dbn-class-soft: rgba(165,94,234,.14); --dbn-class-line: rgba(165,94,234,.34);
  --dbn-class-glow: rgba(165,94,234,.32); --dbn-class-glow-strong: rgba(165,94,234,.55);
}

@keyframes dbn-in       { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes dbn-spin     { to{transform:rotate(360deg)} }
@keyframes dbn-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes dbn-flicker  { 100%{transform:scaleY(1.1) scaleX(.92)} }
@keyframes dbn-toast-in { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes dbn-toast-out{ to{transform:translateY(-8px);opacity:0} }
@keyframes dbn-fall     { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(112vh) rotate(540deg);opacity:0} }
@keyframes dbn-burst    { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.06);opacity:1} 100%{transform:scale(1);opacity:1} }
@keyframes dbn-glow-r   { 0%{opacity:0} 30%{opacity:1} 100%{opacity:0} }
@keyframes dbn-lid      { to{transform:rotateX(115deg)} }

/* ── Overlay: glass blur backdrop ─────────────────────────────── */
.dbn-overlay {
  position:fixed; inset:0; z-index:8000;
  background:
    radial-gradient(circle at 20% 10%, var(--dbn-class-soft), transparent 45%),
    rgba(6,4,14,.62);
  backdrop-filter: blur(20px) saturate(1.1);
  -webkit-backdrop-filter: blur(20px) saturate(1.1);
  display:flex; align-items:center; justify-content:center; padding:18px;
}

/* ── Card — dashboard panel language: 8px radius, thin borders, flat shadow ── */
.dbn-card {
  position:relative; width:min(480px, calc(100vw - 32px));
  max-height:min(92vh, 580px);
  overflow:hidden;
  display:flex; flex-direction:column; gap:12px;
  padding:20px 20px 18px;
  border-radius:8px;
  border:1px solid color-mix(in srgb, var(--dbn-class-accent), transparent 74%);
  background: linear-gradient(180deg, rgba(20,10,34,.86), rgba(8,5,17,.92));
  box-shadow: 0 24px 68px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05);
  animation: dbn-in .28s cubic-bezier(.22,1,.36,1) both;
}
.dbn-card::before {
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  opacity:.05; background-image:url("/ui/panel-texture.png");
  background-size:cover; background-position:center; mix-blend-mode:screen;
}
.dbn-card > * { position:relative; z-index:1; }

/* ── Close ─────────────────────────────────────────────────────── */
.dbn-close {
  position:absolute; top:12px; right:12px; width:26px; height:26px; z-index:5;
  display:flex; align-items:center; justify-content:center;
  border-radius:6px; border:1px solid var(--dbn-border);
  background:rgba(255,255,255,.04);
  color:var(--dbn-mutedL); font-size:14px; line-height:1; cursor:pointer;
  transition:.15s;
}
.dbn-close:hover { color:var(--dbn-crim); border-color:var(--dbn-crim); background:rgba(224,104,138,.1); }

/* ── Header ────────────────────────────────────────────────────── */
.dbn-head { display:flex; align-items:center; gap:11px; cursor:grab; user-select:none; padding-right:22px; }
.dbn-head:active { cursor:grabbing; }
.dbn-marker {
  width:36px; height:36px; flex-shrink:0; border-radius:50%; font-size:16px;
  display:flex; align-items:center; justify-content:center;
  border:1px solid color-mix(in srgb, var(--dbn-class-accent), transparent 55%);
  background: radial-gradient(circle, var(--dbn-class-soft), rgba(255,255,255,.03) 70%);
}
.dbn-title { font:900 17px/1.15 'Manrope', sans-serif; color:#fff9ef; letter-spacing:-.01em; }
.dbn-sub   { font:700 9.5px 'JetBrains Mono', monospace; color:var(--dbn-mutedL); letter-spacing:.06em; text-transform:uppercase; margin-top:4px; }

/* ── Stats row ─────────────────────────────────────────────────── */
.dbn-stats { display:grid; grid-template-columns:1fr 1fr 1.15fr; gap:8px; }
.dbn-stat {
  padding:9px 10px; border-radius:8px;
  border:1px solid var(--dbn-border);
  background:rgba(255,255,255,.03);
  display:flex; flex-direction:column; gap:2px; min-width:0;
  transition:border-color .2s ease, transform .2s ease;
}
.dbn-stat:hover { border-color:color-mix(in srgb, var(--dbn-class-accent), transparent 60%); transform:translateY(-2px); }
.dbn-stat-top { display:flex; align-items:center; gap:6px; }
.dbn-stat-val { font:900 15px 'JetBrains Mono', monospace; color:#fff; font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dbn-stat-val small { font-size:9px; font-weight:700; font-family:'JetBrains Mono', monospace; color:var(--dbn-mutedL); margin-left:2px; }
.dbn-stat-lab { font:700 8px 'JetBrains Mono', monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--dbn-mutedL); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.dbn-flame-ico { width:13px; height:16px; flex-shrink:0;
  background:radial-gradient(circle at 50% 70%,#ff7a1f 30%,#ffd24a 60%,transparent);
  clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%);
  filter:drop-shadow(0 0 4px #ff7a1f);
  animation:dbn-flicker .6s ease-in-out infinite alternate; }
.dbn-clock-ico { width:13px; height:13px; flex-shrink:0; border:2px solid var(--dbn-class-accent); border-radius:50%; position:relative; }
.dbn-clock-ico::after { content:""; position:absolute; top:14%; left:44%; width:2px; height:38%; background:var(--dbn-class-accent); transform-origin:bottom; }

.dbn-bar { height:4px; margin-top:5px; border-radius:999px; overflow:hidden; background:rgba(255,255,255,.08); }
.dbn-bar-fill { height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--dbn-class-accent),var(--dbn-gold)); box-shadow:0 0 8px var(--dbn-class-soft); }

/* ── Info row (shield / claim result) ─────────────────────────── */
.dbn-info {
  display:flex; align-items:center; gap:9px;
  padding:9px 12px; border-radius:8px;
  border:1px solid var(--dbn-border);
  background:rgba(255,255,255,.03);
}
.dbn-info.ready { border-color:color-mix(in srgb, var(--dbn-gold), transparent 45%); background:color-mix(in srgb, var(--dbn-gold), transparent 92%); }
.dbn-info.success { border-color:color-mix(in srgb, var(--dbn-green), transparent 45%); background:color-mix(in srgb, var(--dbn-green), transparent 92%); }
.dbn-info.warn { border-color:color-mix(in srgb, var(--dbn-crim), transparent 45%); background:color-mix(in srgb, var(--dbn-crim), transparent 92%); }
.dbn-shield-ico { width:15px; height:17px; flex-shrink:0;
  background:var(--dbn-class-accent);
  clip-path:polygon(50% 0,100% 20%,100% 55%,50% 100%,0 55%,0 20%);
  opacity:.92; }
.dbn-info-check { font-size:13px; color:var(--dbn-green); flex-shrink:0; }
.dbn-info-text { font:600 11px 'Manrope', sans-serif; color:var(--dbn-text); line-height:1.25; flex:1; min-width:0; }
.dbn-info-count {
  flex-shrink:0; min-width:30px; text-align:center; padding:3px 7px;
  border-radius:999px; border:1px solid var(--dbn-border);
  background:rgba(0,0,0,.18);
  font:700 10px 'JetBrains Mono', monospace; color:var(--dbn-gold);
}

/* ── Calendar row (always 7 across) ─────────────────────────────── */
.dbn-cal { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px; }
.dbn-day {
  position:relative; min-height:74px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
  padding:8px 2px 6px; border-radius:8px; cursor:pointer;
  border:1px solid var(--dbn-border);
  background:rgba(255,255,255,.025);
  transition:transform .15s, border-color .15s, box-shadow .15s, opacity .15s;
}
.dbn-day:focus-visible { outline:2px solid var(--dbn-class-accent); outline-offset:2px; }
.dbn-day.claimed { opacity:.55; }
.dbn-day.today {
  border-color:color-mix(in srgb, var(--dbn-gold), transparent 25%);
  background:color-mix(in srgb, var(--dbn-gold), transparent 93%);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dbn-gold), transparent 70%), 0 0 14px color-mix(in srgb, var(--dbn-gold), transparent 78%);
}
.dbn-day.today:hover { transform:translateY(-2px); }
.dbn-day.locked { opacity:.4; }
.dbn-day.selected:not(.today) { border-color:color-mix(in srgb, var(--dbn-class-accent), transparent 40%); }
.dbn-day.broken {
  border-color:color-mix(in srgb, var(--dbn-crim), transparent 30%);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dbn-crim), transparent 65%), 0 0 12px color-mix(in srgb, var(--dbn-crim), transparent 78%);
}
.dbn-day.milestone {
  border-color:color-mix(in srgb, var(--dbn-gold), transparent 55%);
  background:color-mix(in srgb, var(--dbn-gold), transparent 94%);
}
.dbn-day.milestone.today {
  border-color:color-mix(in srgb, var(--dbn-gold), transparent 15%);
  box-shadow:inset 0 0 0 1px var(--dbn-gold), 0 0 16px color-mix(in srgb, var(--dbn-gold), transparent 68%);
}

.dbn-day-num { position:absolute; top:5px; left:6px; font:600 7px 'JetBrains Mono', monospace; color:var(--dbn-muted); }
.dbn-day-check { position:absolute; top:4px; right:6px; font-size:11px; color:var(--dbn-green); }
.dbn-ms-tag {
  position:absolute; top:4px; right:5px;
  font:700 5.5px 'JetBrains Mono', monospace; letter-spacing:.5px; color:var(--dbn-gold);
  border:1px solid var(--dbn-gold); border-radius:4px; padding:1px 3px;
}
.dbn-day-ico { display:flex; align-items:center; justify-content:center; }
.dbn-day-amt { font:700 11px 'Manrope', sans-serif; color:var(--dbn-text); letter-spacing:.2px; }
.dbn-day.today .dbn-day-amt { color:var(--dbn-gold); }

/* Reward CSS icons */
.dbn-g { display:flex; align-items:center; justify-content:center; }
.dbn-g.claimed, .dbn-rwd-img.claimed { filter:brightness(1.15) saturate(1.1); animation:dbn-float 2.4s ease-in-out infinite; }
.dbn-g.gold    { background:radial-gradient(circle at 35% 30%,#ffe28a,var(--dbn-gold) 60%,#6e4a13); border-radius:50%; box-shadow:0 0 5px rgba(255,209,102,.4); }
.dbn-g.gems    { background:linear-gradient(135deg,#c77dff,#5a189a); clip-path:polygon(50% 0,100% 35%,80% 100%,20% 100%,0 35%); box-shadow:0 0 5px rgba(165,94,234,.4); }
.dbn-g.energy  { background:linear-gradient(180deg,#fff099,#ff9a1f); clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); box-shadow:0 0 5px rgba(255,154,31,.4); }
.dbn-g.xp      { background:linear-gradient(180deg,var(--dbn-class-accent),#D4B4FF); clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); box-shadow:0 0 5px rgba(165,94,234,.4); }
.dbn-g.mystery { background:linear-gradient(135deg,#6a5a8a,#2a2335); clip-path:polygon(15% 0,85% 0,100% 15%,100% 85%,85% 100%,15% 100%,0 85%,0 15%); position:relative; }
.dbn-g.mystery::after { content:"?"; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font:700 10px 'JetBrains Mono', monospace; color:var(--dbn-gold); }
.dbn-g.chest   { background:linear-gradient(180deg,#ffe08a 40%,var(--dbn-gold) 41%,#6e4a13); clip-path:polygon(0 35%,100% 35%,100% 100%,0 100%); box-shadow:0 0 8px rgba(255,209,102,.45); position:relative; }
.dbn-g.chest::before { content:""; position:absolute; top:0; left:0; width:100%; height:40%; background:linear-gradient(180deg,#ffe08a,var(--dbn-gold)); border-radius:30% 30% 0 0; }
.dbn-g.chest::after  { content:""; position:absolute; top:42%; left:42%; width:16%; height:22%; background:#2a1a06; }
.dbn-rwd-img { display:block; object-fit:contain; image-rendering:pixelated; filter:drop-shadow(0 0 5px rgba(255,209,102,.25)); }

/* claim burst */
.dbn-cell-burst { position:absolute; inset:0; z-index:9; pointer-events:none; overflow:hidden; }
.dbn-cell-burst-core { position:absolute; left:50%; top:50%; width:36px; height:36px; border-radius:50%; transform:translate(-50%,-50%); background:radial-gradient(circle,rgba(255,247,207,.9),rgba(255,209,102,.32) 42%,transparent 70%); }
.dbn-cell-spark { position:absolute; left:50%; top:50%; width:4px; height:4px; border-radius:999px; background:var(--spark-color,var(--dbn-gold)); box-shadow:0 0 8px var(--spark-color,var(--dbn-gold)); }

/* ── Reward detail (single line) ──────────────────────────────── */
.dbn-reward {
  display:flex; align-items:center; gap:11px;
  padding:9px 12px; border-radius:8px;
  border:1px solid var(--dbn-border);
  background:rgba(255,255,255,.03);
}
.dbn-reward-ico { width:32px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.dbn-reward-body { flex:1; min-width:0; display:flex; align-items:center; gap:7px; }
.dbn-reward-name { font:700 12.5px 'Manrope', sans-serif; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dbn-reward-rarity {
  flex-shrink:0; font:900 8.5px 'JetBrains Mono', monospace; letter-spacing:.08em; text-transform:uppercase;
  padding:2px 7px; border-radius:999px; border:1px solid var(--dbn-border); color:var(--dbn-mutedL);
}
.dbn-reward-rarity.common { color:#9fdba4; border-color:color-mix(in srgb, var(--dbn-green), transparent 60%); background:color-mix(in srgb, var(--dbn-green), transparent 90%); }
.dbn-reward-rarity.rare { color:#8fd8ff; border-color:rgba(76,201,240,.4); background:rgba(76,201,240,.1); }
.dbn-reward-rarity.epic { color:#ffd56f; border-color:color-mix(in srgb, var(--dbn-gold), transparent 55%); background:color-mix(in srgb, var(--dbn-gold), transparent 90%); }
.dbn-reward-bonus { flex-shrink:0; font:900 14px 'JetBrains Mono', monospace; color:var(--dbn-gold); }

/* ── CTA — matches dashboard primary button ─────────────────────── */
.dbn-cta {
  width:100%; height:44px; border-radius:8px; cursor:pointer;
  font:800 13px 'Manrope', sans-serif;
  color:#100814; border:none;
  background:linear-gradient(135deg,#ffe08a,var(--dbn-gold));
  box-shadow:0 16px 34px color-mix(in srgb, var(--dbn-gold), transparent 72%);
  transition:transform .2s ease, box-shadow .2s ease; position:relative; display:flex; align-items:center; justify-content:center; gap:8px;
}
.dbn-cta:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 18px 38px color-mix(in srgb, var(--dbn-gold), transparent 64%); }
.dbn-cta:active:not(:disabled) { transform:translateY(0); }
.dbn-cta:disabled { background:rgba(255,255,255,.06); color:var(--dbn-muted); box-shadow:none; cursor:not-allowed; }
.dbn-spinner { width:11px; height:11px; border:2px solid rgba(16,8,20,.3); border-top-color:#100814; border-radius:50%; animation:dbn-spin .7s linear infinite; }

.dbn-done {
  width:100%; height:44px; border-radius:8px;
  display:flex; align-items:center; justify-content:center; gap:6px;
  border:1px solid var(--dbn-border); background:rgba(255,255,255,.03);
  font:600 11px 'Manrope', sans-serif; color:var(--dbn-mutedL);
}
.dbn-done b { color:var(--dbn-gold); font-weight:800; }

/* ── Shower / burst / toasts (transient fixed overlays) ─────────── */
.dbn-shower { position:fixed; inset:0; pointer-events:none; z-index:9100; overflow:hidden; }
.dbn-sh-coin { position:absolute; width:12px; height:12px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#ffe28a,var(--dbn-gold) 60%,#6e4a13); box-shadow:0 0 7px rgba(255,209,102,.55); }
.dbn-sh-gem  { position:absolute; width:11px; height:11px; background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg); box-shadow:0 0 7px rgba(165,94,234,.55); }

.dbn-burst-wrap { position:fixed; inset:0; z-index:9200; display:flex; align-items:center; justify-content:center; pointer-events:none; }
.dbn-burst-inner { text-align:center; animation:dbn-burst .5s cubic-bezier(.3,1.5,.5,1) both; }
.dbn-burst-chest { width:96px; height:78px; margin:0 auto 14px; position:relative; }
.dbn-burst-body { position:absolute; bottom:0; width:100%; height:62%; background:linear-gradient(180deg,#c89b3c,#6e4a13); border:3px solid #2a1a06; border-radius:2px; }
.dbn-burst-lid  { position:absolute; top:0; width:100%; height:42%; background:linear-gradient(180deg,#f4cc78,#c89b3c); border:3px solid #2a1a06; border-radius:40% 40% 0 0; transform-origin:bottom; animation:dbn-lid .6s ease-out .3s forwards; }
.dbn-burst-glow { position:absolute; inset:-46px; background:radial-gradient(circle,rgba(255,209,102,.6),transparent 65%); animation:dbn-glow-r 1.2s ease-out; }
.dbn-burst-label { font:900 13px 'Manrope', sans-serif; color:var(--dbn-gold); letter-spacing:.3px; }

.dbn-toasts { position:fixed; bottom:26px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column-reverse; gap:6px; z-index:9300; pointer-events:none; min-width:260px; }
.dbn-toast {
  border-radius:8px; border:1px solid color-mix(in srgb, var(--dbn-class-accent), transparent 62%);
  background:linear-gradient(180deg, color-mix(in srgb, var(--dbn-class-accent), transparent 92%), transparent 42%), rgba(8,5,17,.96);
  box-shadow:0 14px 34px rgba(0,0,0,.46), inset 0 0 0 1px rgba(255,255,255,.04);
  color:#fff; padding:10px 16px; text-align:center;
  font:600 11px 'Manrope', sans-serif;
  animation:dbn-toast-in .3s ease-out, dbn-toast-out .4s ease-in 2.4s forwards;
}
.dbn-toast .tv { color:var(--dbn-gold); font-weight:700; margin-left:5px; }

@media (max-width: 420px) {
  .dbn-overlay { padding:10px; }
  .dbn-card { padding:16px 14px 14px; gap:10px; max-height:min(94vh,560px); }
  .dbn-title { font-size:16px; }
  .dbn-stats { gap:6px; }
  .dbn-stat { padding:7px 7px; }
  .dbn-stat-val { font-size:13px; }
  .dbn-cal { gap:4px; }
  .dbn-day { min-height:62px; padding:6px 1px 5px; }
  .dbn-day-amt { font-size:9px; }
  .dbn-reward-name { font-size:11px; }
  .dbn-reward-bonus { font-size:12px; }
}

@media (max-height: 680px) {
  .dbn-card { gap:9px; padding:16px 20px 16px; }
  .dbn-day { min-height:62px; }
}
`;

// ─── CSS injection (once) ───────────────────────────────────────────────
function useCSS() {
  useEffect(() => {
    if (document.getElementById("fvdb-css-v16")) return;
    const s = document.createElement("style");
    s.id = "fvdb-css-v16"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
}

// ─── Reward icon ─────────────────────────────────────────────────────────
const REWARD_ICON_SRC = {
  gold: "/ui/icon-gold.png",
  gems: "/ui/icon-gem.png",
  energy: "/ui/icon-energy.png",
  chest: "/sprites/chest_closed.png",
  chestClaimed: "/sprites/chest_open.png",
};

function RwdIcon({ type, size = 24, status = "", glow = false }) {
  const iconKey = type === "chest" && status === "claimed" ? "chestClaimed" : type;
  const src = REWARD_ICON_SRC[iconKey];
  if (src) {
    return (
      <img
        className={`dbn-rwd-img ${glow ? "claimed" : ""}`}
        src={src}
        alt=""
        aria-hidden="true"
        style={{ width:size, height:size }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return <div className={`dbn-g ${type} ${glow ? "claimed" : ""}`} style={{ width:size, height:size }} />;
}

// ─── Marker icon (dashboard-style circular marker) ────────────────────────
function GiftIcon() {
  return <div className="dbn-marker" aria-hidden="true">🎁</div>;
}

// ─── Reward info / detail ────────────────────────────────────────────────
const REWARD_INFO = {
  gold: { name:"Oro", rarity:"Común", rarityKey:"common" },
  energy: { name:"Energía", rarity:"Común", rarityKey:"common" },
  gems: { name:"Gema", rarity:"Rara", rarityKey:"rare" },
  xp: { name:"Impulso XP", rarity:"Rara", rarityKey:"rare" },
  mystery: { name:"Botín sorpresa", rarity:"Épico", rarityKey:"epic" },
  chest: { name:"Cofre semanal", rarity:"Épico", rarityKey:"epic" },
};

function getRewardInfo(reward, day) {
  const info = REWARD_INFO[reward.type] || REWARD_INFO.mystery;
  const bonus = reward.type === "mystery" ? "Sorpresa" : `${reward.amt} ${reward.label}`;
  return { ...info, bonus, day };
}

function RewardDetail({ day, reward }) {
  const info = getRewardInfo(reward, day);
  return (
    <motion.div
      className="dbn-reward"
      initial={{ opacity:0, y:6 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:.16 }}
      key={`${day}-${reward.type}`}
    >
      <div className="dbn-reward-ico"><RwdIcon type={reward.type} size={30}/></div>
      <div className="dbn-reward-body">
        <span className="dbn-reward-name">{info.name}</span>
        <span className={`dbn-reward-rarity ${info.rarityKey}`}>{info.rarity}</span>
      </div>
      <div className="dbn-reward-bonus">{info.bonus}</div>
    </motion.div>
  );
}

const CLAIM_BURST_PARTICLES = Array.from({ length:12 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 12;
  const distance = 28 + (i % 3) * 8;
  return {
    id:i,
    x:Math.cos(angle) * distance,
    y:Math.sin(angle) * distance,
    color:i % 3 === 0 ? "var(--dbn-gold)" : i % 3 === 1 ? "var(--dbn-class-accent)" : "#fff7cf",
    delay:(i % 4) * .03,
  };
});

function CellClaimBurst({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="dbn-cell-burst"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:.16 }}>
          <motion.span className="dbn-cell-burst-core"
            initial={{ scale:.35, opacity:.95 }} animate={{ scale:1.5, opacity:0 }}
            transition={{ duration:.6, ease:"easeOut" }}/>
          {CLAIM_BURST_PARTICLES.map(p => (
            <motion.span key={p.id} className="dbn-cell-spark" style={{ "--spark-color":p.color }}
              initial={{ x:"-50%", y:"-50%", scale:.5, opacity:0 }}
              animate={{ x:`calc(-50% + ${p.x}px)`, y:`calc(-50% + ${p.y}px)`, scale:[.6,1,.2], opacity:[0,1,0] }}
              transition={{ duration:.7, delay:p.delay, ease:"easeOut" }}/>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Day cell ────────────────────────────────────────────────────────────
function DayCell({ day, reward, status, onClaim, onSelect, selected = false, streakBroken = false, burstActive = false }) {
  const isMilestone = reward.milestone;
  const rewardInfo = getRewardInfo(reward, day);
  let cls = "dbn-day";
  if (status === "claimed") cls += " claimed";
  else if (status === "today") cls += " today";
  else cls += " locked";
  if (isMilestone) cls += " milestone";
  if (streakBroken && status === "today") cls += " broken";
  if (selected) cls += " selected";

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
      aria-label={`${rewardInfo.name}. ${rewardInfo.rarity}. ${rewardInfo.bonus}. Día ${day}.`}>
      <CellClaimBurst show={burstActive}/>
      <span className="dbn-day-num">{day}</span>
      {status === "claimed" && <span className="dbn-day-check">✓</span>}
      {isMilestone && <span className="dbn-ms-tag">META</span>}
      <div className="dbn-day-ico">
        <RwdIcon type={reward.type} size={isMilestone ? 30 : 22} status={status} glow={burstActive || status === "today"}/>
      </div>
      <span className="dbn-day-amt">{reward.amt}</span>
    </div>
  );
}

// ─── Shower particles ────────────────────────────────────────────────────
function Shower({ particles }) {
  if (!particles.length) return null;
  return (
    <div className="dbn-shower">
      {particles.map(p => (
        <div key={p.id} className={`dbn-sh-${p.type}`}
          style={{ left:p.x+"%", top:-20,
            animation:`dbn-fall ${p.dur}s ease-in ${p.delay}s forwards` }}/>
      ))}
    </div>
  );
}

// ─── Chest burst ─────────────────────────────────────────────────────────
function ChestBurst({ label, show }) {
  if (!show) return null;
  return (
    <div className="dbn-burst-wrap">
      <div className="dbn-burst-inner">
        <div className="dbn-burst-chest">
          <div className="dbn-burst-glow"/>
          <div className="dbn-burst-body"/>
          <div className="dbn-burst-lid"/>
        </div>
        <div className="dbn-burst-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Toast item ──────────────────────────────────────────────────────────
function Toasts({ list }) {
  return (
    <div className="dbn-toasts">
      {list.map(t => (
        <div key={t.id} className="dbn-toast">
          <span>{t.text}</span>
          {t.value && <span className="tv">{t.value}</span>}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN MODAL
// ══════════════════════════════════════════════════════════════════════════
export default function DailyBonusModal({ profile, onClose, onClaimed }) {
  useCSS();
  const dragControls = useDragControls();
  const classKey = normalizeDailyBonusClass(profile);
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const classStyle = {
    "--dbn-class-accent": classTheme.accent,
    "--dbn-class-bg": classTheme.bg,
    "--dbn-class-soft": classTheme.soft,
    "--dbn-class-line": hexToRgba(classTheme.accent, .34),
    "--dbn-class-glow": hexToRgba(classTheme.accent, .3),
    "--dbn-class-glow-strong": hexToRgba(classTheme.accent, .55),
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

  // ── Derived state ────────────────────────────────────────────────
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
  const shieldCopy = shieldWillSave
    ? "Al reclamar, el amuleto se consumirá y tu racha seguirá viva."
    : shieldStatus.active
      ? `Protección preparada${shieldLeft ? ` por ${shieldLeft}` : ""}.`
      : shieldStatus.protectors > 0
        ? `${shieldStatus.protectors} amuleto${shieldStatus.protectors === 1 ? "" : "s"} esperando en tu mochila.`
        : streakBroken
          ? "Compra un amuleto en la tienda para salvar rachas futuras."
          : "Si algún día fallas, un amuleto puede salvar la cadena.";

  // Position in 7-day cycle
  const cyclePos = ((displayStreak - 1) % 7) + 1; // 1..7
  const activeSelectedDay = selectedDay || cyclePos;
  const selectedReward = SCHEDULE[activeSelectedDay - 1] || SCHEDULE[0];
  const weeklyProgress = Math.min(cyclePos, 7);
  const daysToChest = Math.max(0, 7 - weeklyProgress);
  const chestHint = daysToChest === 0
    ? (effectiveClaimed ? "Cofre abierto" : "Cofre listo")
    : `Cofre en ${daysToChest} ${daysToChest === 1 ? "día" : "días"}`;
  const weeklyProgressPct = `${(weeklyProgress / 7) * 100}%`;

  const dayStatuses = Array.from({ length:7 }, (_, i) => {
    const d = i + 1;
    if (d < cyclePos || (effectiveClaimed && d === cyclePos)) return "claimed";
    if (d === cyclePos) return "today";
    return "locked";
  });

  // ── Helpers ──────────────────────────────────────────────────────
  function spawnShower(kind) {
    const pts = Array.from({ length:26 }, () => {
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

  // ── Claim ────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <Shower particles={particles}/>
      <ChestBurst label={burstLabel} show={burst}/>
      <Toasts list={toasts}/>

      <AnimatePresence>
        <div className="dbn-overlay" style={classStyle} onClick={e => e.target === e.currentTarget && onClose?.()}>
          <motion.div
            className="dbn-card"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.04}
            initial={{ opacity:0, scale:.92, y:16 }}
            animate={{ opacity:1, scale:1,   y:0  }}
            exit={{    opacity:0, scale:.94, y:10 }}
            transition={{ type:"spring", stiffness:340, damping:30 }}
          >
            <button className="dbn-close" onClick={onClose} aria-label="Cerrar calendario de recompensas">×</button>

            {/* ── HEADER ── */}
            <div className="dbn-head" onPointerDown={startDrag}>
              <GiftIcon/>
              <div>
                <h2 className="dbn-title">Bono diario</h2>
                <div className="dbn-sub">Cada entrenamiento abre otra recompensa</div>
              </div>
            </div>

            {/* ── STATS ── */}
            <div className="dbn-stats">
              <div className="dbn-stat">
                <div className="dbn-stat-top"><span className="dbn-flame-ico"/></div>
                <span className="dbn-stat-val">{displayStreak}<small>días</small></span>
                <span className="dbn-stat-lab">Racha</span>
              </div>
              <div className="dbn-stat">
                <div className="dbn-stat-top"><span className="dbn-clock-ico"/></div>
                <span className="dbn-stat-val">{effectiveClaimed ? countdown : "Listo"}</span>
                <span className="dbn-stat-lab">Próximo bono</span>
              </div>
              <div className="dbn-stat">
                <span className="dbn-stat-val">{weeklyProgress}<small>/7</small></span>
                <span className="dbn-stat-lab">{chestHint}</span>
                <div className="dbn-bar" aria-hidden="true">
                  <div className="dbn-bar-fill" style={{ width:weeklyProgressPct }}/>
                </div>
              </div>
            </div>

            {/* ── INFO ROW: claim result or shield status ── */}
            <AnimatePresence mode="wait">
              {claimResult ? (
                <motion.div key="result" className="dbn-info success"
                  initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:.16 }}>
                  <span className="dbn-info-check">✓</span>
                  <span className="dbn-info-text">
                    +{claimResult.xpGained} XP · +{claimResult.coinsGained} monedas
                    {shieldWasUsed ? " · racha salvada" : ""}
                  </span>
                </motion.div>
              ) : (
                <motion.div key="shield" className={`dbn-info${shieldWillSave ? " ready" : ""}${streakBroken ? " warn" : ""}`}
                  initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:.16 }}>
                  <span className="dbn-shield-ico"/>
                  <span className="dbn-info-text">{shieldCopy}</span>
                  {shieldStatus.protectors > 0 && <span className="dbn-info-count">x{shieldStatus.protectors}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 7-DAY CALENDAR ── */}
            <div className="dbn-cal">
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

            {/* ── REWARD DETAIL ── */}
            <RewardDetail day={activeSelectedDay} reward={selectedReward}/>

            {/* ── CTA ── */}
            {effectiveClaimed ? (
              <div className="dbn-done">Reclamado hoy · vuelve en <b>{countdown}</b></div>
            ) : (
              <button className="dbn-cta" onClick={handleClaim} disabled={claiming}>
                {claiming
                  ? <><span className="dbn-spinner"/> Reclamando…</>
                  : `Reclamar recompensa del día ${cyclePos}`}
              </button>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
}
