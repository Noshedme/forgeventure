// src/components/shared/SkillTree.jsx
// Árbol de Habilidades RPG — SC Admin palette + premium redesign
// Lógica 100% intacta: getMySkills / unlockSkill / skillPoints / eventos
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase.js";
import { getMySkills, unlockSkill } from "../../services/api.js";

// ── Paleta del design system (morado/oscuro) ──────────────────────
const SC = {
  bg:    "#08051A",
  card:  "#14092A",
  panel: "#0F0720",
  navy:  "#1C1040",
  navyL: "#2A1550",
  orange:"#D4B4FF",
  gold:  "#FFD166",
  blue:  "#A55EEA",
  teal:  "#7C6AC0",
  green: "#10b981",
  red:   "#E05C8A",
  purple:"#A55EEA",
  white: "#F0E6FF",
  muted: "#9080B0",
  mutedL:"#B0A0C8",
};
const scCard = (accent) => ({
  background:SC.card, border:`1px solid ${SC.navyL}`,
  borderTop:`2px solid ${accent}`, borderRadius:14,
  boxShadow:"0 4px 28px rgba(0,0,0,0.5)",
});
// Fuentes — todas Manrope para coincidir con el design system
const raj = (s, w=600) => ({ fontFamily:"'Manrope',sans-serif", fontSize:typeof s==="number"?`${Math.max(11,s)}px`:s, fontWeight:w });
const orb = (s, w=700) => ({ fontFamily:"'Manrope',sans-serif", fontSize:typeof s==="number"?`${s}px`:s, fontWeight:w, letterSpacing:"-.01em" });
const px  = (s)        => ({ fontFamily:"'Manrope',sans-serif", fontSize:typeof s==="number"?`${Math.max(10,s+4)}px`:s, fontWeight:800, letterSpacing:".05em" });

// ── SVG icon kit ─────────────────────────────────────────────────
const IcoCheck   = (c,s=12)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>;
const IcoLock    = (c,s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoZap     = (c,s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>;
const IcoStar    = (c,s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>;
const IcoInfo    = (c,s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoWarn    = (c,s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoUnlock  = (c,s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;
const IcoTree    = (c,s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="13" x2="6.5" y2="16.5"/><line x1="12" y1="13" x2="17.5" y2="16.5"/></svg>;
const IcoSparkle = (c,s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M12 2l1.5 5H19l-4.5 3.3 1.7 5.2L12 12.3l-4.2 3.2 1.7-5.2L5 7h5.5z"/></svg>;
const IcoFlame   = (c,s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M12 2C6.5 8 5 12 5 14.5a7 7 0 0 0 14 0C19 12 17.5 8 12 2zm0 17a3 3 0 0 1-3-3c0-1.5 1-3 3-4 2 1 3 2.5 3 4a3 3 0 0 1-3 3z"/></svg>;

// ── Tier metadata ────────────────────────────────────────────────
const TIER_META = [
  { id:1, label:"BÁSICAS",   subtitle:"Fundamentos del camino", roman:"I",   accent:"#A55EEA" },
  { id:2, label:"AVANZADAS", subtitle:"El poder crece",          roman:"II",  accent:"#D4B4FF" },
  { id:3, label:"MAESTRÍA",  subtitle:"Cima del árbol",          roman:"III", accent:"#FFD166" },
];

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
  @keyframes st-spin    { to{transform:rotate(360deg)} }
  @keyframes st-pulse   { 0%,100%{box-shadow:0 0 0 0 var(--tc)44} 60%{box-shadow:0 0 0 10px var(--tc)00} }
  @keyframes st-glow    { 0%,100%{filter:drop-shadow(0 0 6px var(--tc))} 50%{filter:drop-shadow(0 0 18px var(--tc))} }
  @keyframes st-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes st-shimmer { 0%,100%{opacity:.25} 50%{opacity:.55} }
  @keyframes st-lineGrow{ from{stroke-dashoffset:400} to{stroke-dashoffset:0} }
  @keyframes st-confetti{
    0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1}
    100%{transform:translate(var(--px),var(--py)) rotate(540deg) scale(.2);opacity:0}
  }
  @keyframes st-ripple  { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
  @keyframes st-unlock  { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes st-ambient { 0%,100%{opacity:.035} 50%{opacity:.07} }
  @keyframes st-dashDash{ to{stroke-dashoffset:-24} }
  @keyframes st-fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes st-dotMove { 0%{offset-distance:0%} 100%{offset-distance:100%} }

  .st-node-available { animation:st-pulse 2.2s ease-in-out infinite; }
  .st-node-unlocked  { animation:st-glow  2.6s ease-in-out infinite; }
  .st-node-icon      { animation:st-float 3.2s ease-in-out infinite; }
  .st-line-active    { animation:st-lineGrow .8s ease both; stroke-dasharray:400; }
  .st-dash-anim      { animation:st-dashDash 1.6s linear infinite; }
`;

function Spinner({ color, size=24 }) {
  return (
    <div style={{ width:size, height:size, border:`3px solid ${SC.navyL}`,
      borderTop:`3px solid ${color}`, borderRadius:"50%",
      animation:"st-spin .8s linear infinite" }}/>
  );
}

// ── Node component — premium card style ──────────────────────────
function SkillNode({ skill, color, skillPoints, onSelect }) {
  const { state } = skill;
  const unlocked  = state === "unlocked";
  const available = state === "available";
  const locked    = !unlocked && !available;
  const canUnlock = available && skillPoints >= 1;

  return (
    <motion.div
      whileHover={!locked ? { y:-4, scale:1.04 } : {}}
      whileTap={!locked ? { scale:.96 } : {}}
      onClick={() => onSelect(skill)}
      className={unlocked ? "st-node-unlocked" : canUnlock ? "st-node-available" : ""}
      style={{
        width:118, minHeight:112,
        background: unlocked
          ? `linear-gradient(160deg,${color}18,${SC.card} 70%)`
          : available
          ? SC.card
          : SC.panel,
        border:`1px solid ${
          unlocked ? `${color}55` :
          available ? `${color}33` :
          `${SC.navyL}55`}`,
        borderTop:`2px solid ${
          unlocked ? color :
          available ? `${color}66` :
          SC.navyL}`,
        borderRadius:12,
        boxShadow: unlocked
          ? `0 4px 28px ${color}1A, inset 0 1px 0 ${color}22`
          : canUnlock
          ? `0 2px 16px ${color}12`
          : "none",
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"14px 10px 10px",
        gap:7, cursor:locked?"default":"pointer",
        position:"relative", overflow:"hidden",
        transition:"box-shadow .22s, border-color .22s, background .22s",
        "--tc":unlocked ? color : available ? color : SC.navyL,
      }}
    >
      {/* available: animated dashed border */}
      {canUnlock && (
        <div style={{ position:"absolute", inset:-1, borderRadius:12,
          border:`1.5px dashed ${color}44`,
          animation:"st-spin 9s linear infinite",
          pointerEvents:"none" }}/>
      )}

      {/* unlocked bg glow */}
      {unlocked && (
        <div style={{ position:"absolute", top:-16, right:-16,
          width:70, height:70, borderRadius:"50%",
          background:color, filter:"blur(32px)",
          opacity:.16, pointerEvents:"none" }}/>
      )}

      {/* icon */}
      <div
        className={unlocked ? "st-node-icon" : ""}
        style={{ fontSize:30, lineHeight:1, position:"relative", zIndex:1,
          filter: locked
            ? "grayscale(1) opacity(.22)"
            : unlocked
            ? `drop-shadow(0 0 10px ${color}77)`
            : `opacity(.8)` }}
      >
        {locked ? "🔒" : skill.icon}
      </div>

      {/* name */}
      <div style={{ ...raj(11, unlocked?700:500),
        color:unlocked?color:available?`${color}BB`:SC.muted,
        textAlign:"center", lineHeight:1.3, position:"relative", zIndex:1,
        transition:"color .2s" }}>
        {skill.name}
      </div>

      {/* level badge */}
      <div style={{ ...px(5),
        color:unlocked?SC.gold:available?`${color}88`:SC.muted,
        background:unlocked?`${SC.gold}18`:available?`${color}0E`:`${SC.navyL}33`,
        border:`1px solid ${unlocked?SC.gold+"44":available?color+"22":`${SC.navyL}44`}`,
        borderRadius:5, padding:"2px 7px", position:"relative", zIndex:1 }}>
        Lv.{skill.levelReq}
      </div>

      {/* unlocked checkmark badge */}
      {unlocked && (
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:"spring", stiffness:400, damping:20 }}
          style={{ position:"absolute", top:7, right:7,
            width:18, height:18, borderRadius:"50%",
            background:`linear-gradient(135deg,${SC.green},#4a7a49)`,
            border:`1.5px solid ${SC.card}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 8px ${SC.green}66` }}>
          {IcoCheck(SC.white, 9)}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── SVG connection lines ─────────────────────────────────────────
function ConnectionLines({ skills, nodePositions, color, unlockedSkills }) {
  if (!nodePositions || Object.keys(nodePositions).length === 0) return null;

  const lines = [];
  for (const skill of skills) {
    for (const reqId of skill.requires) {
      const from = nodePositions[reqId];
      const to   = nodePositions[skill.id];
      if (!from || !to) continue;
      const isActive  = unlockedSkills.includes(reqId) && unlockedSkills.includes(skill.id);
      const isPartial = unlockedSkills.includes(reqId);
      lines.push({ from, to, isActive, isPartial, key:`${reqId}-${skill.id}` });
    }
  }
  if (lines.length === 0) return null;

  const allX = Object.values(nodePositions).map(p => p.cx);
  const allY = Object.values(nodePositions).map(p => p.cy);
  const minX = Math.min(...allX) - 20;
  const minY = Math.min(...allY) - 20;
  const w    = Math.max(...allX) + 20 - minX;
  const h    = Math.max(...allY) + 20 - minY;

  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%",
      pointerEvents:"none", zIndex:1 }}
      viewBox={`${minX} ${minY} ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <filter id="st-glow-line">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="st-glow-dot">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {lines.map(({ from, to, key }) => (
          <linearGradient key={`g-${key}`} id={`g-${key}`}
            x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={color} stopOpacity=".8"/>
            <stop offset="100%" stopColor={color} stopOpacity=".4"/>
          </linearGradient>
        ))}
      </defs>
      {lines.map(({ from, to, isActive, isPartial, key }) => {
        const mx = (from.cx + to.cx) / 2;
        const my = (from.cy + to.cy) / 2;
        const path = `M${from.cx},${from.cy} C${from.cx},${my} ${to.cx},${my} ${to.cx},${to.cy}`;
        return (
          <g key={key}>
            {/* glow shadow */}
            <path d={path}
              stroke={isActive ? color : SC.navyL}
              strokeWidth={isActive ? 6 : 2}
              fill="none"
              strokeOpacity={isActive ? .12 : .06}/>
            {/* main bezier line */}
            <path d={path}
              stroke={isActive
                ? `url(#g-${key})`
                : isPartial
                ? `${color}44`
                : `${SC.navyL}44`}
              strokeWidth={isActive ? 2 : 1.5}
              fill="none"
              strokeDasharray={isActive ? undefined : "6 5"}
              className={isActive ? "st-line-active" : isPartial ? "st-dash-anim" : ""}
              filter={isActive ? "url(#st-glow-line)" : undefined}/>
            {/* animated traveling dot */}
            {isActive && (
              <circle r={3.5} fill={color} opacity={.95} filter="url(#st-glow-dot)">
                <animateMotion dur="2s" repeatCount="indefinite"
                  path={path}/>
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Skill Detail Panel — inline, no overlay ──────────────────────
function SkillDetailPanel({ skill, color, skillPoints, onConfirm, onClose, loading, success, error }) {
  const { state } = skill;
  const unlocked  = state === "unlocked";
  const available = state === "available";
  const canUnlock = available && skillPoints >= 1 && !unlocked;

  const particles = success ? [...Array(16)].map((_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const dist  = 55 + Math.random() * 40;
    return {
      px:`${Math.cos(angle) * dist}px`, py:`${Math.sin(angle) * dist}px`,
      color:[color, SC.gold, SC.white, SC.green, SC.purple][i % 5],
      size: 4 + Math.floor(Math.random() * 4),
    };
  }) : [];

  const bonusDesc = (() => {
    const b = skill.bonus;
    if (!b) return null;
    if (b.type === "global")       return { icon:"🌍", txt:`+${b.pct}% XP en TODOS los ejercicios` };
    if (b.type === "streak_bonus") return { icon:"🔥", txt:`+${b.pct}% XP cuando racha ≥ ${b.minStreak} días` };
    if (b.type === "musculos")     return { icon:"💪", txt:`+${b.pct}% XP · músculos: ${b.targets.slice(0,3).join(", ")}${b.targets.length>3?"…":""}` };
    if (b.type === "categoria")    return { icon:"🎯", txt:`+${b.pct}% XP · categorías: ${b.targets.slice(0,3).join(", ")}${b.targets.length>3?"…":""}` };
    return null;
  })();

  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0  }}
      exit={{    opacity:0, y:8  }}
      transition={{ type:"spring", stiffness:380, damping:34 }}
      style={{ ...scCard(color), position:"relative", overflow:"hidden" }}
    >
      <div style={{ position:"absolute", top:-24, right:-24, width:120, height:120,
        borderRadius:"50%", background:color, filter:"blur(50px)", opacity:.14,
        pointerEvents:"none", zIndex:0 }}/>
      {success && particles.map((p, i) => (
        <div key={i} style={{ position:"absolute", top:"22%", left:"50%",
          width:p.size, height:p.size, borderRadius:"50%", background:p.color,
          animation:`st-confetti ${.6+i*.04}s ease ${i*20}ms both`,
          "--px":p.px, "--py":p.py, pointerEvents:"none", zIndex:0 }}/>
      ))}
      <div style={{ padding:"13px 13px 11px", borderBottom:`1px solid ${SC.navyL}`,
        display:"flex", alignItems:"center", gap:11, position:"relative", zIndex:1 }}>
        <motion.div
          animate={success ? { scale:[1,1.2,1], rotate:[0,8,-8,0] } : {}}
          transition={{ duration:.5 }}
          style={{ width:44, height:44, borderRadius:11, flexShrink:0,
            background:`${color}14`, border:`1px solid ${color}33`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:21, boxShadow:unlocked||success?`0 0 18px ${color}28`:"none",
            filter:unlocked||success?`drop-shadow(0 0 10px ${color}77)`:"none" }}>
          {skill.icon}
        </motion.div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ ...orb(13,900), color, letterSpacing:".01em", marginBottom:4, lineHeight:1.2 }}>
            {skill.name}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <span style={{ ...raj(10,600), color:`${color}BB`,
              background:`${color}10`, border:`1px solid ${color}28`,
              borderRadius:5, padding:"2px 8px" }}>
              TIER {skill.tier} · Nv.{skill.levelReq}
            </span>
            {unlocked && (
              <span style={{ ...raj(10,600), color:SC.green,
                background:`${SC.green}12`, border:`1px solid ${SC.green}33`,
                borderRadius:5, padding:"2px 8px",
                display:"flex", alignItems:"center", gap:3 }}>
                {IcoCheck(SC.green, 8)} Activa
              </span>
            )}
          </div>
        </div>
        <button type="button" onClick={onClose}
          style={{ width:26, height:26, borderRadius:7, cursor:"pointer", flexShrink:0,
            border:`1px solid ${SC.navyL}`, background:"rgba(255,255,255,.04)",
            color:SC.muted, ...raj(16,700),
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          ×
        </button>
      </div>
      <div style={{ padding:"11px 12px 12px", display:"flex", flexDirection:"column", gap:8, position:"relative", zIndex:1 }}>
        <div style={{ background:SC.panel, border:`1px solid ${color}1C`, borderRadius:9, padding:"10px 12px" }}>
          <div style={{ ...raj(12,600), color:SC.white, lineHeight:1.45, marginBottom:4 }}>{skill.desc}</div>
          <div style={{ ...raj(10,500), color:SC.muted, fontStyle:"italic", lineHeight:1.4 }}>"{skill.flavorText}"</div>
        </div>
        {bonusDesc && (
          <div style={{ display:"flex", alignItems:"center", gap:8,
            background:`${color}0D`, border:`1px solid ${color}2A`,
            borderRadius:9, padding:"7px 11px" }}>
            <span style={{ fontSize:13, flexShrink:0 }}>{bonusDesc.icon}</span>
            <span style={{ ...raj(11,700), color, lineHeight:1.3 }}>{bonusDesc.txt}</span>
          </div>
        )}
        {success ? (
          <motion.div initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
            style={{ background:`${SC.green}12`, border:`1px solid ${SC.green}3A`,
              borderRadius:9, padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize:18, marginBottom:2 }}>✨</div>
            <div style={{ ...raj(13,700), color:SC.green }}>¡Habilidad desbloqueada!</div>
            <div style={{ ...raj(10,500), color:`${SC.green}88`, marginTop:2 }}>Bonus XP activo permanentemente</div>
          </motion.div>
        ) : unlocked ? (
          <div style={{ background:`${color}0F`, border:`1px solid ${color}2A`, borderRadius:9, padding:"8px", textAlign:"center" }}>
            <div style={{ ...raj(12,600), color, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              {IcoCheck(color, 12)} Ya desbloqueada — bonus activo
            </div>
          </div>
        ) : !available ? (
          <div style={{ background:`${SC.red}0D`, border:`1px solid ${SC.red}2A`, borderRadius:9, padding:"8px", textAlign:"center" }}>
            <div style={{ ...raj(12,700), color:SC.red, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              {IcoLock(SC.red, 12)} {state === "level_locked" ? `Nivel ${skill.levelReq} requerido` : "Prerrequisitos sin cumplir"}
            </div>
          </div>
        ) : skillPoints < 1 ? (
          <div style={{ background:`${SC.gold}0C`, border:`1px solid ${SC.gold}2A`, borderRadius:9, padding:"8px", textAlign:"center" }}>
            <div style={{ ...raj(12,700), color:SC.gold, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              {IcoStar(SC.gold, 12)} Sin puntos de habilidad
            </div>
            <div style={{ ...raj(10,500), color:`${SC.gold}88`, marginTop:2 }}>Gana 1 punto por nivel · sigue entrenando</div>
          </div>
        ) : (
          <div style={{ background:`${color}0C`, border:`1px solid ${color}2A`, borderRadius:9, padding:"8px", textAlign:"center" }}>
            <div style={{ ...raj(12,600), color, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              {IcoStar(color, 12)} <strong>{skillPoints}</strong> punto{skillPoints!==1?"s":""} disponible{skillPoints!==1?"s":""}
            </div>
          </div>
        )}
        {error && (
          <div style={{ ...raj(11,600), color:SC.red, background:`${SC.red}0F`,
            border:`1px solid ${SC.red}2A`, borderRadius:8,
            padding:"6px 10px", textAlign:"center",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            {IcoWarn(SC.red, 12)} {error}
          </div>
        )}
        <div style={{ display:"flex", gap:7 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:"9px 0", background:"transparent",
              border:`1px solid ${SC.navyL}`, color:SC.mutedL, cursor:"pointer",
              ...raj(12,600), borderRadius:7 }}>
            {success || unlocked ? "Cerrar" : "Cancelar"}
          </button>
          {canUnlock && !success && (
            <motion.button onClick={onConfirm} disabled={loading}
              whileHover={{ scale:1.02 }} whileTap={{ scale:.96 }}
              style={{ flex:2, padding:"9px 0",
                background:loading?`${color}33`:`linear-gradient(90deg,${color},${color}cc)`,
                border:`1px solid ${color}`, color:loading?SC.muted:SC.bg,
                cursor:loading?"default":"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                ...raj(12,700), borderRadius:7,
                boxShadow:loading?"none":`0 3px 14px ${color}3A` }}>
              {loading ? <><Spinner color={color} size={13}/> Desbloqueando...</> : <>{IcoUnlock(SC.bg, 14)} Desbloquear</>}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// ── XP Bonus summary helper ───────────────────────────────────────
function bonusLabel(skill) {
  const b = skill.bonus;
  if (!b) return skill.desc;
  if (b.type === "global")      return `+${b.pct}% XP global`;
  if (b.type === "streak_bonus")return `+${b.pct}% XP (racha ≥ ${b.minStreak}d)`;
  if (b.type === "musculos")    return `+${b.pct}% XP músculos`;
  if (b.type === "categoria")   return `+${b.pct}% XP categoría`;
  return skill.desc;
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
export default function SkillTree({ profile = {} }) {
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [activeTier,    setActiveTier]    = useState(1);
  const [showAllBonuses,setShowAllBonuses]= useState(false);
  const [unlocking,     setUnlocking]     = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [unlockError,   setUnlockError]   = useState(null);
  const [nodePositions, setNodePositions] = useState({});

  const gridRef  = useRef(null);
  const nodeRefs = useRef({});

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchSkills = async () => {
    try {
      setLoading(true); setError(null);
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }
      const token = await user.getIdToken();
      const res   = await getMySkills(token);
      setData(res);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSkills(); }, []);

  useEffect(() => {
    nodeRefs.current = {};
    setNodePositions({});
  }, [activeTier]);

  // ── Measure node DOM positions for SVG lines ──────────────────
  useEffect(() => {
    if (!data || !gridRef.current) return;
    const measure = () => {
      const gridRect  = gridRef.current.getBoundingClientRect();
      const positions = {};
      for (const [id, el] of Object.entries(nodeRefs.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        positions[id] = {
          cx: r.left + r.width / 2 - gridRect.left,
          cy: r.top + r.height / 2 - gridRect.top,
        };
      }
      setNodePositions(positions);
    };

    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [activeTier, data, loading]);

  // ── Unlock ────────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (!selected || unlocking) return;
    setUnlocking(true); setUnlockError(null);
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await unlockSkill(token, selected.id);

      setData(prev => ({
        ...prev,
        skillPoints:    res.skillPoints,
        unlockedSkills: res.unlockedSkills,
        tree: {
          ...prev.tree,
          skills: prev.tree.skills.map(s => {
            if (s.id === selected.id) return { ...s, state:"unlocked" };
            const nowUnlocked = res.unlockedSkills.includes(s.id);
            const levelOk     = prev.userLevel >= s.levelReq;
            const prereqsOk   = s.requires.every(r => res.unlockedSkills.includes(r));
            if (!nowUnlocked) {
              const ns = levelOk && prereqsOk ? "available" : !levelOk ? "level_locked" : "prereq_locked";
              return { ...s, state:ns };
            }
            return s;
          }),
        },
      }));
      setSelected(p => ({ ...p, state:"unlocked" }));
      setUnlockSuccess(true);

      window.dispatchEvent(new CustomEvent("skillUnlocked", {
        detail:{ skillId:selected.id, skillName:selected.name },
      }));
    } catch (err) { setUnlockError(err.message); }
    finally { setUnlocking(false); }
  };

  const handleClose = () => {
    setSelected(null); setUnlockSuccess(false); setUnlockError(null);
  };

  const tree = data?.tree || { color:SC.blue, skills:[], icon:"", label:"", lore:"" };
  const unlockedSkills = data?.unlockedSkills || [];
  const skillPoints = data?.skillPoints || 0;
  const userLevel = data?.userLevel || 0;

  const CLASS_COLORS = { GUERRERO:"#FF4757", ARQUERO:"#6BC87A", MAGO:"#4CC9F0" };
  const heroClass = (profile?.heroClass || "").toUpperCase().trim();
  const color = CLASS_COLORS[heroClass] || tree.color || SC.blue;
  const TIERS = [
    { id:1, label:"BÁSICAS",   subtitle:"Fundamentos del camino", roman:"I",   accent:`${color}99` },
    { id:2, label:"AVANZADAS", subtitle:"El poder crece",          roman:"II",  accent:`${color}CC` },
    { id:3, label:"MAESTRÍA",  subtitle:"Cima del árbol",          roman:"III", accent:"#FFD166" },
  ];
  const tiers = [1, 2, 3].map((t) => tree.skills.filter((s) => s.tier === t).sort((a, b) => a.col - b.col));
  const unlockedCount = unlockedSkills.length;
  const totalSkills = tree.skills.length;
  const totalBonus = tree.skills
    .filter((s) => unlockedSkills.includes(s.id))
    .reduce((sum, s) => sum + (s.bonus?.pct || 0), 0);
  const availableCount = tree.skills.filter((s) => s.state === "available").length;
  const activeTierSkills = tiers[activeTier - 1] || tiers[0] || [];
  const tierMeta = TIERS.find((e) => e.id === activeTier) || TIERS[0];
  const tierUnlocked = activeTierSkills.filter((s) => unlockedSkills.includes(s.id)).length;
  const tierAvailable = activeTierSkills.filter((s) => s.state === "available").length;
  const tierTotal = activeTierSkills.length;
  const spotlightSkill =
    activeTierSkills.find((s) => s.state === "available")
    || activeTierSkills.find((s) => unlockedSkills.includes(s.id))
    || activeTierSkills[0]
    || null;
  const visibleBonuses = showAllBonuses
    ? tree.skills.filter((s) => unlockedSkills.includes(s.id))
    : tree.skills.filter((s) => unlockedSkills.includes(s.id)).slice(0, 4);

  useEffect(() => {
    if (!data?.tree?.skills?.length) return;

    const firstAvailableTier = tiers.findIndex((tierSkills) =>
      tierSkills.some((skill) => skill.state === "available")
    );
    if (firstAvailableTier >= 0) {
      const nextTier = firstAvailableTier + 1;
      if (nextTier !== activeTier) setActiveTier(nextTier);
      return;
    }

    const highestUnlockedTier = tiers.reduce((acc, tierSkills, index) => (
      tierSkills.some((skill) => unlockedSkills.includes(skill.id)) ? index + 1 : acc
    ), 1);

    if ((tiers[activeTier - 1] || []).length === 0 && highestUnlockedTier !== activeTier) {
      setActiveTier(highestUnlockedTier || 1);
    }
  }, [activeTier, data, tiers, unlockedSkills]);

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:16, padding:"60px 20px" }}>
        <div style={{ ...scCard(SC.blue), padding:"32px 48px",
          display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <Spinner color={SC.blue} size={36}/>
          <div style={{ ...raj(13,600), color:SC.muted }}>Cargando árbol de habilidades...</div>
        </div>
      </div>
    </>
  );

  if (error || !data) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        gap:16, padding:"40px 20px" }}>
        <div style={{ ...scCard(SC.red), padding:"32px 40px",
          display:"flex", flexDirection:"column", alignItems:"center", gap:12,
          maxWidth:360, width:"100%", textAlign:"center" }}>
          {IcoWarn(SC.red, 36)}
          <div style={{ ...raj(14,700), color:SC.red }}>Error al cargar habilidades</div>
          <div style={{ ...raj(12,500), color:SC.muted }}>{error}</div>
          <button onClick={fetchSkills}
            style={{ padding:"10px 28px", background:"transparent",
              border:`1px solid ${SC.navyL}`, color:SC.mutedL, cursor:"pointer",
              ...raj(13,600), borderRadius:8, marginTop:4,
              transition:"all .15s" }}>
            Reintentar
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0  }}
        style={{ ...scCard(color), padding:"20px 22px",
          marginBottom:16, position:"relative", overflow:"hidden" }}
      >
        {/* ambient glows */}
        <div style={{ position:"absolute", top:-50, right:-30, width:200, height:200,
          borderRadius:"50%", background:color, filter:"blur(90px)",
          opacity:.08, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-40, left:60, width:160, height:160,
          borderRadius:"50%", background:SC.blue, filter:"blur(80px)",
          opacity:.05, pointerEvents:"none" }}/>

        <div style={{ display:"flex", alignItems:"flex-start", gap:16,
          flexWrap:"wrap", position:"relative", zIndex:1 }}>

          {/* left: class info + progress */}
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              {/* tree icon box */}
              <div style={{ width:46, height:46, borderRadius:11,
                background:`${color}18`, border:`1px solid ${color}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 0 20px ${color}22`, flexShrink:0 }}>
                <span style={{ fontSize:24,
                  filter:`drop-shadow(0 0 8px ${color})` }}>{tree.icon}</span>
              </div>
              <div>
                <div style={{
                  background:`linear-gradient(90deg,${SC.white},${color})`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  ...orb(13,900), letterSpacing:".06em" }}>
                  {tree.label.toUpperCase()}
                </div>
                <div style={{ ...raj(12,500), color:SC.muted, marginTop:2, fontStyle:"italic" }}>
                  {tree.lore}
                </div>
              </div>
            </div>

            {/* progress bar */}
            <div style={{ height:5, background:SC.panel, border:`1px solid ${color}22`,
              borderRadius:5, overflow:"hidden", marginBottom:6 }}>
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${(unlockedCount/totalSkills)*100}%` }}
                transition={{ duration:1.3, ease:[.22,1,.36,1] }}
                style={{ height:"100%", borderRadius:5,
                  background:`linear-gradient(90deg,${color}88,${color})`,
                  boxShadow:`0 0 8px ${color}55` }}/>
            </div>
            <div style={{ ...raj(11,500), color:SC.muted, display:"flex", gap:10 }}>
              <span>{unlockedCount}/{totalSkills} habilidades</span>
              <span style={{ color:SC.navyL }}>·</span>
              <span>Nivel {userLevel}</span>
              {availableCount > 0 && (
                <span style={{ color, fontWeight:700 }}>
                  · {availableCount} disponible{availableCount!==1?"s":""}
                </span>
              )}
            </div>
          </div>

          {/* right: skill points + bonus */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
            <motion.div
              animate={skillPoints>0 ? { boxShadow:[`0 0 0 0 ${color}33`,`0 0 0 14px ${color}00`] } : {}}
              transition={{ repeat:Infinity, duration:2 }}
              style={{ background:skillPoints>0?`${color}14`:SC.panel,
                border:`1px solid ${skillPoints>0?color:SC.navyL}`,
                borderTop:`2px solid ${skillPoints>0?color:SC.navyL}`,
                borderRadius:12, padding:"10px 20px", textAlign:"center",
                minWidth:140 }}>
              <div style={{ ...px(5), color:skillPoints>0?SC.gold:SC.muted, marginBottom:6 }}>
                PUNTOS
              </div>
              <div style={{ ...orb(28,900),
                color:skillPoints>0?color:SC.muted,
                textShadow:skillPoints>0?`0 0 16px ${color}66`:"none",
                lineHeight:1 }}>
                {skillPoints}
              </div>
              <div style={{ ...raj(9,500), color:SC.muted, marginTop:5 }}>
                {skillPoints>0?"¡Listo para desbloquear!":"1 punto por nivel"}
              </div>
            </motion.div>

            {totalBonus > 0 && (
              <div style={{ background:`${SC.gold}12`, border:`1px solid ${SC.gold}33`,
                borderRadius:8, padding:"6px 14px",
                display:"flex", alignItems:"center", gap:7 }}>
                {IcoZap(SC.gold, 13)}
                <span style={{ ...raj(12,700), color:SC.gold }}>
                  +{totalBonus}% XP bonus activo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* how to earn points */}
        <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:10,
          background:`${SC.gold}07`, border:`1px dashed ${SC.gold}20`,
          borderRadius:9, padding:"8px 14px",
          position:"relative", zIndex:1, flexWrap:"wrap" }}>
          {IcoInfo(SC.gold, 13)}
          <span style={{ ...raj(11,500), color:SC.mutedL }}>
            Ganas <b style={{color:SC.gold}}>1 punto de habilidad</b> por cada nivel que subes.
            Completa ejercicios, rutinas y misiones para subir de nivel.
          </span>
        </div>
      </motion.div>

      {/* ── TREE GRID ── */}
      <div style={{ ...scCard(color), padding:"20px 18px 18px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.02, borderRadius:14,
          backgroundImage:`radial-gradient(${color} 1px, transparent 1px)`,
          backgroundSize:"28px 28px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"50%", left:"50%", width:340, height:340,
          borderRadius:"50%", background:color, filter:"blur(120px)", opacity:.04,
          transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>

        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16, position:"relative", zIndex:1 }}>
          {TIERS.map((meta) => {
            const tierSkills = tiers[meta.id - 1] || [];
            const done = tierSkills.filter((s) => unlockedSkills.includes(s.id)).length;
            const avail = tierSkills.filter((s) => s.state === "available").length;
            const active = activeTier === meta.id;
            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => setActiveTier(meta.id)}
                style={{
                  minWidth:170,
                  flex:"1 1 170px",
                  textAlign:"left",
                  padding:"12px 14px",
                  borderRadius:12,
                  cursor:"pointer",
                  background:active ? `linear-gradient(160deg,${color}16,${SC.card} 75%)` : SC.panel,
                  border:`1px solid ${active ? color : SC.navyL}`,
                  borderTop:`2px solid ${active ? color : meta.accent}`,
                  color:SC.white,
                  boxShadow:active ? `0 0 28px ${color}18` : "none",
                }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:6 }}>
                  <span style={{ ...px(6), color:active ? color : meta.accent }}>{meta.roman}</span>
                  <span style={{ ...raj(10,700), color:avail > 0 ? color : SC.muted }}>
                    {done}/{tierSkills.length || 0}
                  </span>
                </div>
                <div style={{ ...raj(12,700), color:active ? SC.white : `${SC.white}CC`, letterSpacing:".08em" }}>{meta.label}</div>
                <div style={{ ...raj(10,500), color:SC.muted, marginTop:4 }}>{meta.subtitle}</div>
                {avail > 0 && (
                  <div style={{ ...raj(10,700), color, marginTop:8 }}>
                    {avail} listo{avail !== 1 ? "s" : ""} para abrir
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, alignItems:"start", position:"relative", zIndex:1 }}>
          <div style={{ ...scCard(color), padding:"18px 16px", background:`linear-gradient(180deg,${color}08,${SC.panel})`, minHeight:320, position:"relative", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              <div style={{ ...px(6), color:tierMeta.accent }}>{tierMeta.roman}</div>
              <div style={{ ...orb(12,900), color:SC.white }}>{tierMeta.label}</div>
              <div style={{ ...raj(10,500), color:SC.muted }}>{tierMeta.subtitle}</div>
              <div style={{ marginLeft:"auto", ...raj(10,700), color:color, background:`${color}14`, border:`1px solid ${color}33`, borderRadius:999, padding:"3px 10px" }}>
                {tierUnlocked}/{tierTotal} activas
              </div>
            </div>

            <div ref={gridRef} style={{ position:"relative", minHeight:230, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ConnectionLines
                skills={activeTierSkills}
                nodePositions={nodePositions}
                color={color}
                unlockedSkills={unlockedSkills}
              />

              <motion.div
                key={`tier-${activeTier}`}
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ type:"spring", stiffness:260, damping:26 }}
                style={{
                  display:"grid",
                  gridTemplateColumns:`repeat(${Math.max(activeTierSkills.length, 1)}, minmax(112px, 138px))`,
                  gap:"18px 24px",
                  justifyContent:"center",
                  alignItems:"center",
                  width:"100%",
                }}>
                {activeTierSkills.map((skill) => (
                  <div
                    key={skill.id}
                    ref={el => { nodeRefs.current[skill.id] = el; }}
                    style={{ display:"flex", justifyContent:"center" }}>
                    <SkillNode
                      skill={skill}
                      color={color}
                      skillPoints={skillPoints}
                      onSelect={s => {
                        setSelected(s);
                        setUnlockSuccess(false);
                        setUnlockError(null);
                      }}
                    />
                  </div>
                ))}
              </motion.div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(132px,1fr))", gap:10, marginTop:14 }}>
              {activeTierSkills.map((skill) => (
                <div key={`${skill.id}-flow`} style={{
                  background:`${skill.state === "unlocked" ? color : SC.card}10`,
                  border:`1px solid ${skill.state === "unlocked" ? color : SC.navyL}33`,
                  borderRadius:10,
                  padding:"10px 12px",
                  display:"grid",
                  gap:4,
                }}>
                  <div style={{ ...raj(10,700), color:skill.state === "unlocked" ? color : SC.mutedL, letterSpacing:".04em" }}>
                    {skill.name}
                  </div>
                  <div style={{ ...raj(9,500), color:SC.muted }}>
                    {skill.state === "unlocked" ? "Nodo activo" : skill.state === "available" ? "Listo para abrir" : skill.state === "level_locked" ? `Nivel ${skill.levelReq}` : "Requiere nodos previos"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gap:12 }}>
            <AnimatePresence mode="wait">
              {selected ? (
                <SkillDetailPanel
                  key="detail"
                  skill={selected} color={color}
                  skillPoints={skillPoints}
                  onConfirm={handleUnlock}
                  onClose={handleClose}
                  loading={unlocking}
                  success={unlockSuccess}
                  error={unlockError}
                />
              ) : (
                <motion.div key="ruta"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:.18 }}
                  style={{ display:"grid", gap:12 }}>
                  <div style={{ ...scCard(color), padding:"16px 16px 14px", background:`linear-gradient(180deg,${color}10,${SC.card})` }}>
                    <div style={{ ...px(6), color:SC.gold, marginBottom:8 }}>RUTA ACTIVA</div>
                    {spotlightSkill ? (
                      <>
                        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                          <div style={{ width:52, height:52, borderRadius:14, background:`${color}14`, border:`1px solid ${color}33`, display:"grid", placeItems:"center", fontSize:26 }}>
                            {spotlightSkill.icon}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ ...orb(12,900), color:SC.white }}>{spotlightSkill.name}</div>
                            <div style={{ ...raj(10,600), color:spotlightSkill.state === "available" ? color : SC.mutedL }}>
                              {spotlightSkill.state === "available" ? "Recomendado ahora" : spotlightSkill.state === "unlocked" ? "Ya forma parte de tu build" : "Siguiente parada del camino"}
                            </div>
                          </div>
                        </div>
                        <div style={{ ...raj(11,500), color:SC.mutedL, lineHeight:1.55, marginBottom:10 }}>
                          {spotlightSkill.desc}
                        </div>
                        <div style={{ ...raj(10,600), color:SC.white, background:SC.panel, border:`1px solid ${color}22`, borderRadius:10, padding:"10px 12px" }}>
                          {bonusLabel(spotlightSkill)}
                        </div>
                      </>
                    ) : (
                      <div style={{ ...raj(11,500), color:SC.muted }}>Sin nodos en esta etapa por ahora.</div>
                    )}
                  </div>
                  <div style={{ ...scCard(tierMeta.accent), padding:"14px 16px", display:"grid", gap:10 }}>
                    <div style={{ ...px(6), color:tierMeta.accent }}>MESA DEL TIER</div>
                    <div style={{ display:"grid", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                        <span style={{ ...raj(11,500), color:SC.muted }}>Nodos abiertos</span>
                        <span style={{ ...raj(11,700), color:SC.white }}>{tierUnlocked}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                        <span style={{ ...raj(11,500), color:SC.muted }}>Listos hoy</span>
                        <span style={{ ...raj(11,700), color:color }}>{tierAvailable}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                        <span style={{ ...raj(11,500), color:SC.muted }}>XP del tier</span>
                        <span style={{ ...raj(11,700), color:SC.gold }}>
                          +{activeTierSkills.filter((skill) => unlockedSkills.includes(skill.id)).reduce((sum, skill) => sum + (skill.bonus?.pct || 0), 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── ACTIVE BONUSES ── */}
      <AnimatePresence>
        {unlockedCount > 0 && (
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0  }}
            style={{ ...scCard(SC.gold), padding:"14px 18px", marginTop:14 }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
              <div style={{ width:30, height:30, borderRadius:8,
                background:`${SC.gold}18`, border:`1px solid ${SC.gold}33`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {IcoSparkle(SC.gold, 15)}
              </div>
              <div style={{ ...px(7), color:SC.white, letterSpacing:".04em" }}>
                BONIFICACIONES ACTIVAS
              </div>
              <div style={{ ...raj(10,700), color:SC.gold,
                background:`${SC.gold}14`, border:`1px solid ${SC.gold}33`,
                borderRadius:999, padding:"3px 10px" }}>
                +{totalBonus}% XP
              </div>
              {unlockedCount > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllBonuses((prev) => !prev)}
                  style={{ marginLeft:"auto", padding:"6px 12px", borderRadius:8, cursor:"pointer",
                    border:`1px solid ${SC.navyL}`, background:"transparent", color:SC.mutedL, ...raj(11,600) }}>
                  {showAllBonuses ? "Ver menos" : `Ver ${unlockedCount - visibleBonuses.length} mas`}
                </button>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
              {visibleBonuses.map((skill, i) => (
                <motion.div key={skill.id}
                  initial={{ opacity:0, x:-8 }}
                  animate={{ opacity:1, x:0   }}
                  transition={{ delay:i*.04 }}
                  style={{ background:SC.panel,
                    border:`1px solid ${color}28`,
                    borderLeft:`2px solid ${color}`,
                    borderRadius:"0 10px 10px 0",
                    padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:19, flexShrink:0,
                    filter:`drop-shadow(0 0 6px ${color}88)` }}>{skill.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ ...raj(11,700), color, marginBottom:2 }}>{skill.name}</div>
                    <div style={{ ...raj(10,500), color:SC.muted, lineHeight:1.35 }}>
                      {bonusLabel(skill)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEGEND ── */}
      <div style={{ background:SC.panel, border:`1px solid ${SC.navy}`,
        borderRadius:10, padding:"10px 18px", marginTop:10,
        display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        {[
          { c:color,    label:"Desbloqueada",                        fill:true  },
          { c:color,    label:"Disponible — clic para desbloquear",  fill:false },
          { c:SC.navyL, label:"Bloqueada",                           fill:false },
        ].map(({ c, label, fill }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:11, height:11, borderRadius:"50%",
              background:fill?c:"transparent", border:`2px solid ${c}`,
              boxShadow:fill?`0 0 6px ${c}66`:"none" }}/>
            <span style={{ ...raj(11,500), color:SC.muted }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
          {IcoStar(SC.gold, 12)}
          <span style={{ ...raj(11,500), color:SC.muted }}>1 punto por nivel ganado</span>
        </div>
      </div>

    </>
  );
}
