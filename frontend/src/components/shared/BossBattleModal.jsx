// BossBattleModal.jsx — Guardián del Templo · Flexiones
//
// Sprite structure (all in /public/bosses/flexiones/):
//   idle/   → jefe_idle_01.png  … jefe_idle_06.png   (loops)
//   attack/ → jefe_attack_01.png … jefe_attack_15.png (plays once every 10 reps, then back to idle)
//   death/  → jefe_death_01.png … jefe_death_22.png  (plays once at 50 reps → triggers victory)
//
// Fixed sprite container: SPRITE_W × SPRITE_H px, object-fit:contain — no distortion regardless of source dimensions.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PoseCamera from "../exercise/PoseCamera";
import { getExerciseDetector } from "../exercise/exerciseLogic";

// ── Sprite constants ─────────────────────────────────────────────
const IDLE_FRAMES   = 6;
const ATTACK_FRAMES = 15;
const DEATH_FRAMES  = 22;

const IDLE_MS   = 130;   // ms per idle frame
const ATTACK_MS = 65;    // ms per attack frame (snappy)
const DEATH_MS  = 75;    // ms per death frame

// Fixed container dimensions — all sprites are letterboxed to this
const SPRITE_W    = 260;
const SPRITE_H    = 300;
const SPRITE_W_SM = 84;   // picture-in-picture size
const SPRITE_H_SM = 96;

const FRAME_BASE  = "/bosses/flexiones";
const fmt2        = n => String(n).padStart(2, "0");

const idleSrc  = f => `${FRAME_BASE}/idle/jefe_idle_${fmt2(f)}.png`;
const attackSrc= f => `${FRAME_BASE}/attack/jefe_attack_${fmt2(f)}.png`;
const deathSrc = f => `${FRAME_BASE}/death/jefe_death_${fmt2(f)}.png`;

// ── Game constants ───────────────────────────────────────────────
export const BOSS_HP   = 50;
const ATTACK_EVERY_N   = 10;   // trigger attack anim every N reps
const BOSS_HURT_MS     = 280;
const INTRO_SEC        = 3;

export const BOSS_DATA = {
  id:        "guardian_templo",
  nombre:    "El Guardián del Templo",
  subtitulo: "Jefe · Nivel 1",
  lore:      "Un antiguo guerrero despertado por tu llegada. No muestra misericordia.",
  emoji:     "👹",
  xpReward:  150,
  killBonus: 100,
  coinBonus: 30,
};

// ── Palette ──────────────────────────────────────────────────────
const P = {
  bg0:"#0B0510", card:"#130820", panel:"#0E0618",
  accent:"#C9184A", gold:"#FFC857", blue:"#4CC9F0",
  purple:"#7C3AED", green:"#22C55E", red:"#EF4444", orange:"#F97316",
  text:"#F5E6EC", muted:"#A08090", mutedL:"#C4A6B2",
};

const orb  = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif",     fontSize:s, fontWeight:w });
const raj  = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif",      fontSize:s, fontWeight:w });
const px8  = (s)       => ({ fontFamily:"'Press Start 2P'",           fontSize:s });
const mono = (s,w=600) => ({ fontFamily:"'JetBrains Mono',monospace", fontSize:s, fontWeight:w });

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
@keyframes bb-dmgFloat    { 0%{opacity:1;transform:translate(-50%,-100%) scale(1)} 60%{opacity:1;transform:translate(-50%,-230%) scale(1.4)} 100%{opacity:0;transform:translate(-50%,-340%) scale(.8)} }
@keyframes bb-slash       { 0%{opacity:0;transform:translate(120%,-50%) rotate(-35deg) scaleX(.3)} 25%{opacity:1;transform:translate(0,-50%) rotate(-35deg) scaleX(1)} 70%{opacity:.8;transform:translate(-30%,-50%) rotate(-35deg) scaleX(1.1)} 100%{opacity:0;transform:translate(-80%,-50%) rotate(-35deg) scaleX(.5)} }
@keyframes bb-countIn     { 0%{opacity:0;transform:scale(2.8)} 30%{opacity:1;transform:scale(1)} 75%{opacity:1} 100%{opacity:0;transform:scale(.6)} }
@keyframes bb-victoryPop  { 0%{opacity:0;transform:scale(0) rotate(-15deg)} 60%{transform:scale(1.18) rotate(3deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
@keyframes bb-screenPulse { 0%,100%{box-shadow:none} 50%{box-shadow:inset 0 0 100px #EF444422} }
@keyframes bb-hpLow       { 0%,100%{filter:drop-shadow(0 0 5px #EF4444)} 50%{filter:drop-shadow(0 0 20px #EF4444)} }
@keyframes bb-btnGlow     { 0%,100%{box-shadow:0 0 0 0 #FFC85744} 50%{box-shadow:0 0 0 14px #FFC85700} }
@keyframes bb-auraRing    { 0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.7;transform:translate(-50%,-50%) scale(1.08)} }
@keyframes bb-particleFly { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--px),var(--py)) scale(.15)} }
@keyframes bb-scanLine    { 0%{top:-2px} 100%{top:100%} }
@keyframes bb-attackPulse { 0%{box-shadow:0 0 0 0 #F9731688} 50%{box-shadow:0 0 0 18px #F9731600} 100%{box-shadow:0 0 0 0 #F9731600} }
@keyframes bb-deathShake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-18px)} 40%{transform:translateX(14px)} 60%{transform:translateX(-10px)} 80%{transform:translateX(6px)} }
@keyframes bb-float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.bb-scan { animation:bb-scanLine 6s linear infinite; }

/* ── Exercise-style player panel ── */
.bb-rep-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--bb-pc, #C9184A), transparent 56%);
  background:
    radial-gradient(circle at 18% 50%, color-mix(in srgb, var(--bb-pc, #C9184A), transparent 84%), transparent 48%),
    rgba(255,255,255,.03);
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}
.bb-camera-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--bb-pc, #C9184A), transparent 52%);
  background: rgba(5,4,12,.52);
}
.bb-camera-manual {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  padding: 20px;
}
.bb-action-row { display:flex; gap:9px; flex-shrink:0; width:100%; justify-content:center; flex-wrap:wrap; }
.bb-btn {
  border-radius: 9px; padding: 9px 22px;
  border: 1px solid var(--bb-pc, #C9184A);
  background: var(--bb-pc, #C9184A);
  color: #fff; font: 700 13px/1 "Rajdhani",sans-serif;
  cursor: pointer; letter-spacing: .06em; transition: opacity .15s;
}
.bb-btn:hover { opacity: .82; }
.bb-btn-ghost {
  border-radius: 9px; padding: 9px 22px;
  border: 1px solid color-mix(in srgb, var(--bb-pc, #C9184A), transparent 52%);
  background: transparent;
  color: color-mix(in srgb, var(--bb-pc, #C9184A), white 16%);
  font: 700 13px/1 "Rajdhani",sans-serif;
  cursor: pointer; transition: background .18s;
}
.bb-btn-ghost:hover { background: color-mix(in srgb, var(--bb-pc, #C9184A), transparent 88%); }
`;

// ── Sub-components ───────────────────────────────────────────────
function DmgNumber({ id, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 950); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"absolute", top:"35%", left:"50%", pointerEvents:"none", zIndex:20,
      ...orb(30,900), color:P.red,
      textShadow:`0 0 24px ${P.red}, 0 0 48px ${P.red}66`,
      animation:"bb-dmgFloat .95s ease forwards",
    }}>-1</div>
  );
}

function AttackSlash({ color }) {
  return (
    <div style={{
      position:"absolute", top:"50%", right:0,
      width:"62%", height:5, pointerEvents:"none", zIndex:25,
      background:`linear-gradient(90deg,transparent,${color},${color}88)`,
      borderRadius:3, boxShadow:`0 0 18px ${color}, 0 0 36px ${color}44`,
      animation:"bb-slash .42s cubic-bezier(.22,1,.36,1) forwards",
    }}/>
  );
}

const CONF_COLS = [P.gold, P.accent, P.blue, P.purple, P.green, "#FF6B6B", P.orange];
function VictoryParticle({ i }) {
  const angle = (i / 24) * Math.PI * 2;
  const dist  = 90 + Math.random() * 180;
  const color = CONF_COLS[i % CONF_COLS.length];
  return (
    <div style={{
      position:"absolute", top:"38%", left:"50%",
      width:7+Math.random()*7, height:7+Math.random()*7,
      borderRadius:Math.random()>.5?"50%":2,
      background:color, boxShadow:`0 0 8px ${color}`,
      pointerEvents:"none", zIndex:30,
      "--px":`${Math.cos(angle)*dist}px`,
      "--py":`${Math.sin(angle)*dist}px`,
      animation:`bb-particleFly 1.3s ${Math.random()*.4}s ease forwards`,
    }}/>
  );
}

// ── BossSprite — fixed container, no distortion ──────────────────
// The outer <div> is always SPRITE_W × SPRITE_H.
// The <img> uses maxWidth/maxHeight 100% + object-fit:contain so any
// source resolution letterboxes cleanly without stretching.
function BossSprite({ spriteMode, spriteFrame, isHurt, small=false, bossData=BOSS_DATA }) {
  const [errors, setErrors] = useState({});   // { "idle_3": true, … }
  const w = small ? SPRITE_W_SM : SPRITE_W;
  const h = small ? SPRITE_H_SM : SPRITE_H;

  const src = spriteMode === "attack"
    ? attackSrc(spriteFrame)
    : spriteMode === "death"
      ? deathSrc(spriteFrame)
      : idleSrc(spriteFrame);

  const key = `${spriteMode}_${spriteFrame}`;
  const errored = !!errors[key];

  // visual filter per state
  const filter = spriteMode === "death"
    ? "brightness(1.2) saturate(.5) drop-shadow(0 0 20px #EF444488)"
    : isHurt
      ? "brightness(3.5) saturate(0) sepia(1) hue-rotate(-30deg)"
      : spriteMode === "attack"
        ? "brightness(1.15) saturate(1.4) drop-shadow(0 0 14px #F9731688)"
        : "drop-shadow(0 0 20px #7C3AED55)";

  return (
    <div style={{
      width:w, height:h, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative",
    }}>
      {errored ? (
        <div style={{
          fontSize: small ? 36 : 80,
          filter,
          userSelect:"none",
          textShadow: isHurt ? `0 0 30px ${P.red}` : `0 0 24px ${P.purple}`,
        }}>
          {spriteMode === "death" ? "💀" : bossData.emoji}
        </div>
      ) : (
        <img
          key={key}
          src={src}
          alt={`${spriteMode} ${spriteFrame}`}
          draggable={false}
          onError={() => setErrors(e => ({ ...e, [key]:true }))}
          style={{
            maxWidth:"100%", maxHeight:"100%",
            width:"auto",    height:"auto",
            objectFit:"contain",
            imageRendering:"pixelated",
            display:"block",
            filter,
            // only float during idle to avoid fighting with other anims
            animation: spriteMode === "idle" && !isHurt
              ? "bb-float 3.4s ease-in-out infinite"
              : "none",
          }}
        />
      )}
    </div>
  );
}

// ── HP Bar ────────────────────────────────────────────────────────
function HPBar({ current, max, bossData=BOSS_DATA }) {
  const pct = Math.max(0, (current / max) * 100);
  const col = pct > 50 ? P.green : pct > 25 ? P.gold : pct > 10 ? P.orange : P.red;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:13 }}>💀</span>
          <span style={{ ...px8(7), color:P.text, letterSpacing:".08em" }}>
            {bossData.nombre.toUpperCase()}
          </span>
        </div>
        <div style={{ ...orb(11,900), color:col,
          animation:pct<=10?"bb-hpLow 1s ease-in-out infinite":"none" }}>
          {current}<span style={{ ...raj(9,500), color:P.muted }}> / {max} HP</span>
        </div>
      </div>
      <div style={{ height:10, background:"#1E0B35", overflow:"hidden", border:"1px solid #3D1A60" }}>
        <motion.div
          animate={{ width:`${pct}%` }}
          transition={{ duration:.22, ease:"easeOut" }}
          style={{
            height:"100%",
            background:`linear-gradient(90deg,${col}99,${col})`,
            boxShadow:`0 0 10px ${col}88`,
            position:"relative", overflow:"hidden",
          }}
        >
          <div className="bb-scan" style={{
            position:"absolute", left:0, right:0, height:1,
            background:"rgba(255,255,255,.18)", pointerEvents:"none",
          }}/>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BOSS BATTLE MODAL
// ═══════════════════════════════════════════════════════════════
export default function BossBattleModal({ ejercicio, profile, onClose, onComplete, bossConfig=null, presentation="modal", arenaTheme=null }) {
  const bossData = { ...BOSS_DATA, ...(bossConfig || {}) };
  const bossHpMax = bossData.hp || BOSS_HP;
  const bossAction = bossData.actionLabel || "FLEXIONES";
  const isPage = presentation === "page";

  // Detector needs to be known before state so usarCamara can be initialised correctly
  const detector = getExerciseDetector?.(ejercicio?.nombre) ?? null;

  // ── Phase & countdown ──────────────────────────────────────
  const [phase,     setPhase]     = useState("intro");
  const [countdown, setCountdown] = useState(INTRO_SEC);

  // ── Battle state ───────────────────────────────────────────
  const [bossHP,     setBossHP]    = useState(bossHpMax);
  const [repsHechas, setRepsHechas]= useState(0);
  const [isHurt,     setIsHurt]    = useState(false);
  // Start in camera mode only when a pose detector is available for the exercise
  const [usarCamara, setUsarCamara]= useState(!!detector);
  const [cameraError,setCameraError]= useState(false);
  const [claiming,   setClaiming]  = useState(false);

  // ── Sprite state machine ───────────────────────────────────
  const [spriteMode,  _setSpriteMode]  = useState("idle");   // "idle"|"attack"|"death"
  const [spriteFrame, setSpriteFrame]  = useState(1);
  const spriteModeRef = useRef("idle");
  const setSpriteMode = useCallback((m) => { spriteModeRef.current = m; _setSpriteMode(m); }, []);

  // ── Effects queues ─────────────────────────────────────────
  const [dmgNumbers, setDmgNumbers] = useState([]);
  const [slashes,    setSlashes]    = useState([]);

  const repsRef      = useRef(0);
  const finishingRef = useRef(false);
  const isMobile     = typeof window !== "undefined" && window.innerWidth < 700;

  const hpPct  = bossHP / bossHpMax;
  const enraged = hpPct < 0.4 && hpPct > 0;

  const clsColor    = { GUERRERO:P.accent, ARQUERO:P.blue, MAGO:P.purple };
  const playerColor = clsColor[profile?.heroClass] || P.accent;

  // ── Intro countdown ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "intro") return;
    if (countdown <= 0) { setPhase("fighting"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ── Idle animation loop ────────────────────────────────────
  useEffect(() => {
    if (spriteMode !== "idle" || phase !== "fighting") return;
    const id = setInterval(() => {
      setSpriteFrame(f => f >= IDLE_FRAMES ? 1 : f + 1);
    }, IDLE_MS);
    return () => clearInterval(id);
  }, [spriteMode, phase]);

  // ── Attack animation — plays once through, then back to idle
  useEffect(() => {
    if (spriteMode !== "attack") return;
    setSpriteFrame(1);
    let frame = 1;
    const id = setInterval(() => {
      frame++;
      if (frame > ATTACK_FRAMES) {
        clearInterval(id);
        setSpriteMode("idle");
        setSpriteFrame(1);
        return;
      }
      setSpriteFrame(frame);
    }, ATTACK_MS);
    return () => clearInterval(id);
  }, [spriteMode, setSpriteMode]);

  // ── Death animation — plays once through, then triggers victory
  useEffect(() => {
    if (spriteMode !== "death") return;
    setSpriteFrame(1);
    let frame = 1;
    const id = setInterval(() => {
      frame++;
      if (frame > DEATH_FRAMES) {
        clearInterval(id);
        setPhase("victory");
        return;
      }
      setSpriteFrame(frame);
    }, DEATH_MS);
    return () => clearInterval(id);
  }, [spriteMode, setSpriteMode]);

  // ── Rep hit handler ────────────────────────────────────────
  const handleRep = useCallback((newCount) => {
    if (finishingRef.current) return;
    if (newCount <= repsRef.current) return;
    repsRef.current = newCount;
    setRepsHechas(newCount);

    const newHP = Math.max(0, bossHpMax - newCount);
    setBossHP(newHP);

    // hurt flash (shake in JSX)
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), BOSS_HURT_MS);

    // floating -1 + slash
    const dmgId   = Date.now() + Math.random();
    const slashId = Date.now() + Math.random() + 1;
    setDmgNumbers(prev => [...prev.slice(-4), { id:dmgId }]);
    setSlashes(prev   => [...prev.slice(-2),  { id:slashId }]);

    if (newHP <= 0 && !finishingRef.current) {
      // ── Boss dies: play death animation, then victory
      finishingRef.current = true;
      setSpriteMode("death");
      setSpriteFrame(1);
    } else if (newCount % ATTACK_EVERY_N === 0 && spriteModeRef.current === "idle") {
      // ── Every 10 reps: play attack animation
      setSpriteMode("attack");
    }
  }, [setSpriteMode]);

  const handleCameraReps = useCallback((count) => {
    if (count > repsRef.current) handleRep(count);
  }, [handleRep]);

  const addManualRep = () => {
    if (phase !== "fighting" || finishingRef.current) return;
    handleRep(repsRef.current + 1);
  };

  const handleClaim = () => {
    if (claiming) return;
    setClaiming(true);
    onComplete({
      ejercicioId:     ejercicio.id,
      repsRealizadas:  bossHpMax,
      tiempoRealizado: null,
      xpGanado:        bossData.xpReward,
      bossMode:        true,
      bossId:          bossData.id,
    });
  };

  // ── Sprite visual extras ─────────────────────────────────
  // Aura color changes with boss state
  const themeTone = arenaTheme?.tone || playerColor;
  const classAccent = arenaTheme?.classAccent || playerColor;
  const classSecondary = arenaTheme?.classSecondary || themeTone;
  const classBg = arenaTheme?.classBg || "#12091f";
  const classSoft = arenaTheme?.classSoft || `${playerColor}18`;
  const sceneAsset = arenaTheme?.scene || "/ui/scene-bg.png";
  const crestAsset = arenaTheme?.crest || bossData.crest || null;
  const zoneIconAsset = arenaTheme?.zoneIcon || null;
  const arenaSummary = arenaTheme?.summary || bossData.lore;
  const auraColor = spriteMode === "death"
    ? P.red
    : enraged
      ? P.orange
      : classAccent;

  return (
    <>
      <style>{CSS}</style>
      {!isPage && (
        <div style={{ position:"fixed", inset:0, zIndex:19999, background:"rgba(0,0,0,.78)", backdropFilter:"blur(3px)" }}/>
      )}
      <motion.div
        key="boss-battle"
        initial={{ opacity:0, scale:.96 }}
        animate={{ opacity:1, scale:1 }}
        exit={{ opacity:0, scale:.96 }}
        transition={{ duration:.3 }}
        style={{
          position:isPage ? "relative" : "fixed",
          zIndex:isPage ? "auto" : 20000,
          top:isPage ? undefined : "50%",
          left:isPage ? undefined : "50%",
          transform:isPage ? "none" : "translate(-50%,-50%)",
          inset:isPage ? 0 : undefined,
          width:isPage ? "100%" : "min(96vw, 960px)",
          height:isPage ? "100%" : "min(92vh, 620px)",
          background:
            `linear-gradient(180deg, color-mix(in srgb, ${classAccent}, transparent 94%), transparent 34%), linear-gradient(180deg, rgba(8,6,16,.18), rgba(8,6,16,.54)), radial-gradient(ellipse 100% 90% at 50% 25%, ${classBg} 0%, #0B0510 70%)`,
          display:"flex", flexDirection:"column", overflow:"hidden",
          boxShadow:`0 34px 110px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.05), 0 0 42px color-mix(in srgb, ${classAccent}, transparent 82%)`,
          border:`1px solid color-mix(in srgb, ${classAccent}, transparent 74%)`,
          borderRadius:isPage ? 8 : 0,
          animation: enraged && spriteMode !== "death" ? "bb-screenPulse 1.3s ease-in-out infinite" : "none",
        }}
      >
        <div style={{
          position:"absolute",
          inset:0,
          pointerEvents:"none",
          zIndex:0,
          background:"url('/ui/dashboard-frame.png') center/cover",
          opacity:.08,
        }}/>
        {/* Grid overlay */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
          backgroundImage:`linear-gradient(#3D1A6018 1px,transparent 1px),linear-gradient(90deg,#3D1A6018 1px,transparent 1px)`,
          backgroundSize:"36px 36px", opacity:.5 }}/>

        {/* ── TOP BAR ────────────────────────────────────── */}
        {/* In page mode only the HP bar is shown — the overlay bar in UserBossBattleArena
            already provides the boss title, XP, and close/back button */}
        <div style={{
          padding: isPage ? "7px 16px" : "10px 16px",
          borderBottom:`1px solid color-mix(in srgb, ${classAccent}, transparent 76%)`,
          display:"flex", alignItems:"center", gap:12,
          background:"linear-gradient(90deg, rgba(11,5,16,.92), rgba(11,5,16,.7)), rgba(11,5,16,.7)", backdropFilter:"blur(8px)",
          flexShrink:0, position:"relative", zIndex:10,
        }}>
          {!isPage && (
            <div style={{ ...px8(7), color:classAccent, letterSpacing:".18em",
              background:`${classAccent}14`, border:`1px solid ${classAccent}33`,
              padding:"4px 10px", flexShrink:0 }}>
              ⚔️ BATALLA JEFE
            </div>
          )}
          {!isPage && crestAsset && (
            <img
              src={crestAsset}
              alt=""
              style={{ width:26, height:26, objectFit:"contain", filter:"drop-shadow(0 0 14px rgba(0,0,0,.36))" }}
            />
          )}
          <div style={{ flex:1 }}>
            <HPBar current={bossHP} max={bossHpMax} bossData={bossData} />
          </div>
          {!isPage && (
            <button onClick={onClose} style={{
              background:"none", border:`1px solid color-mix(in srgb, ${classAccent}, transparent 82%)`, color:P.muted,
              width:32, height:32, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:15, flexShrink:0, transition:"all .18s",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=classAccent; e.currentTarget.style.color=classAccent; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=`color-mix(in srgb, ${classAccent}, transparent 82%)`; e.currentTarget.style.color=P.muted; }}>
              ✕
            </button>
          )}
        </div>

        {/* ── INTRO OVERLAY ──────────────────────────────── */}
        <AnimatePresence>
          {phase === "intro" && (
            <motion.div key="intro"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{
                position:"absolute", inset:0, zIndex:50,
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                background:"rgba(11,5,16,.94)", backdropFilter:"blur(6px)",
              }}
            >
              {/* Boss preview (idle frame 1) */}
              <motion.div
                initial={{ opacity:0, scale:.7, y:30 }}
                animate={{ opacity:1, scale:1, y:0 }}
                transition={{ delay:.1, duration:.7, type:"spring", stiffness:180 }}
                style={{ marginBottom:20, position:"relative" }}
              >
                <div style={{
                  position:"absolute", top:"50%", left:"50%",
                  width:SPRITE_W+40, height:SPRITE_H+40, borderRadius:"50%",
                  border:`2px solid ${P.purple}44`,
                  boxShadow:`0 0 40px ${P.purple}33, inset 0 0 40px ${P.purple}22`,
                  animation:"bb-auraRing 3s ease-in-out infinite",
                }}/>
                <BossSprite spriteMode="idle" spriteFrame={1} isHurt={false} bossData={bossData} />
              </motion.div>

              <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:.3, duration:.6 }}
                style={{ textAlign:"center", marginBottom:28, padding:"0 24px" }}>
                <div style={{ ...px8(7), color:P.muted, letterSpacing:".2em", marginBottom:10 }}>
                  ⚔️ JEFE NIVEL 1
                </div>
                <div style={{ ...orb("clamp(20px,5vw,34px)",900), color:P.text, marginBottom:8,
                  textShadow:`0 0 30px ${P.purple}88` }}>
                  {bossData.nombre}
                </div>
                <div style={{ ...raj(13,400), color:P.mutedL, maxWidth:380, lineHeight:1.65 }}>
                  {bossData.lore}
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div key={countdown}
                  initial={{ opacity:0, scale:2.5 }}
                  animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0, scale:.5 }}
                  transition={{ duration:.6, ease:[0.22,1,0.36,1] }}
                  style={{
                    ...orb("clamp(64px,18vw,96px)",900),
                    color: countdown===1?P.accent:countdown===2?P.gold:P.text,
                    textShadow: countdown===1
                      ? `0 0 50px ${P.accent}, 0 0 100px ${P.accent}44`
                      : countdown===2 ? `0 0 40px ${P.gold}` : `0 0 24px ${P.text}44`,
                  }}
                >
                  {countdown}
                </motion.div>
              </AnimatePresence>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.6 }}
                style={{ ...raj(12,600), color:P.muted, marginTop:20, letterSpacing:".1em" }}>
                {bossHpMax} {bossAction} · {bossHpMax} HP
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN BATTLE AREA ───────────────────────────── */}
        <div style={{
          flex:1, display:"flex",
          flexDirection:isMobile?"column":"row",
          overflow:"hidden", minHeight:0, position:"relative", zIndex:5,
        }}>

          {/* ═══ BOSS SIDE ════════════════════════════════ */}
          <div style={{
            flex:isMobile?"0 0 44%":"0 0 39%",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            padding:isMobile ? "14px 10px" : "18px 14px", position:"relative",
            borderRight:isMobile?"none":`1px solid color-mix(in srgb, ${classAccent}, transparent 78%)`,
            borderBottom:isMobile?`1px solid color-mix(in srgb, ${classAccent}, transparent 78%)`:"none",
            overflow:"hidden",
            background: spriteMode==="death"
              ? `linear-gradient(180deg, rgba(45,10,10,.74), ${classBg}), url("${sceneAsset}") center/cover no-repeat`
              : enraged
              ? `linear-gradient(180deg, rgba(26,10,0,.72), ${classBg}), url("${sceneAsset}") center/cover no-repeat`
              : `linear-gradient(180deg, rgba(11,5,16,.42), ${classBg}), url("${sceneAsset}") center/cover no-repeat`,
          }}>
            <div style={{
              position:"absolute",
              inset:0,
              background:"linear-gradient(180deg, rgba(8,6,16,.16), rgba(8,6,16,.72)), url('/ui/dashboard-frame.png') center/cover",
              opacity:.22,
              pointerEvents:"none",
            }}/>
            {crestAsset && (
              <img
                src={crestAsset}
                alt=""
                style={{
                  position:"absolute",
                  top:isMobile ? 10 : 18,
                  right:isMobile ? 10 : 16,
                  width:isMobile ? 68 : 94,
                  height:isMobile ? 68 : 94,
                  objectFit:"contain",
                  opacity:.34,
                  filter:"drop-shadow(0 0 28px rgba(0,0,0,.4))",
                  pointerEvents:"none",
                }}
              />
            )}

            {/* Aura glow */}
            <div style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              width:isMobile ? 300 : 420, height:isMobile ? 300 : 420, borderRadius:"50%",
              background:`radial-gradient(circle, color-mix(in srgb, ${classAccent}, ${classSecondary} 28%) 0%, transparent 62%)`,
              pointerEvents:"none",
              animation:"bb-auraRing 4s ease-in-out infinite",
            }}/>
            <div style={{
              position:"absolute",
              bottom:isMobile ? 12 : 18,
              left:"50%",
              transform:"translateX(-50%)",
              width:isMobile ? 240 : 320,
              height:isMobile ? 84 : 110,
              background:`radial-gradient(circle,${classAccent}2f 0%,transparent 70%)`,
              filter:"blur(10px)",
              pointerEvents:"none",
            }}/>

            {/* Scan line */}
            <div className="bb-scan" style={{
              position:"absolute", left:0, right:0, height:1,
              background:`linear-gradient(90deg,transparent,${auraColor}22,transparent)`,
              pointerEvents:"none",
            }}/>

            {/* Slash effects */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
              <AnimatePresence>
                {slashes.map(s => <AttackSlash key={s.id} color={playerColor}/>)}
              </AnimatePresence>
            </div>

            {/* Boss sprite — animated per spriteMode */}
            <motion.div
              animate={isHurt ? { x:[0,-15,15,-10,10,-5,0] } : { x:0 }}
              transition={isHurt ? { duration:.28, ease:"easeInOut" } : {}}
              style={{ position:"relative", zIndex:5,
                transform:isPage ? "scale(1.18)" : "scale(1.05)",
                transformOrigin:"center bottom",
                animation: spriteMode==="attack" ? "bb-attackPulse .9s ease" : "none" }}
            >
              <BossSprite
                spriteMode={spriteMode}
                spriteFrame={spriteFrame}
                isHurt={isHurt}
                bossData={bossData}
              />

              {/* Damage numbers */}
              <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                {dmgNumbers.map(d => (
                  <DmgNumber key={d.id} id={d.id}
                    onDone={() => setDmgNumbers(p => p.filter(x => x.id !== d.id))} />
                ))}
              </div>
            </motion.div>

            {/* Status label */}
            <div style={{ marginTop:isMobile ? 6 : 10, textAlign:"center", minHeight:20, position:"relative", zIndex:5 }}>
              <div style={{
                display:"inline-flex",
                alignItems:"center",
                gap:8,
                minHeight:32,
                padding:"0 12px",
                marginBottom:8,
                borderRadius:999,
                border:`1px solid color-mix(in srgb, ${classAccent}, transparent 62%)`,
                background:classSoft,
                color:"#f3eaff",
                ...mono(10,700),
                letterSpacing:".08em",
              }}>
                {zoneIconAsset && <img src={zoneIconAsset} alt="" style={{ width:16, height:16, objectFit:"contain" }} />}
                {bossAction}
              </div>
              <div style={{
                ...raj(11,700), letterSpacing:".07em",
                color: spriteMode==="death" ? P.red : enraged ? P.orange : P.muted,
                animation: spriteMode==="death" ? "bb-hpLow 1s ease-in-out infinite" : "none",
              }}>
                {spriteMode==="death"
                  ? "☠️ MURIENDO..."
                  : enraged
                  ? "🔥 ¡ENRARECIDO!"
                  : `${bossHP} HP restante`}
              </div>
              <div style={{ ...raj(12,500), color:P.mutedL, marginTop:6, maxWidth:280 }}>
                {arenaSummary}
              </div>
            </div>
          </div>

          {/* ═══ PLAYER SIDE ══════════════════════════════ */}
          <div style={{
            flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", padding:isMobile ? "12px" : "16px 18px", gap:10,
            overflow:"hidden", minHeight:0, justifyContent:"flex-start",
            "--bb-pc": playerColor,
            background:"linear-gradient(180deg, rgba(255,255,255,.042), rgba(255,255,255,.016)), rgba(8,6,18,.74)",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.05)",
          }}>

            {/* Rep counter — exercise-style card */}
            <div className="bb-rep-card">
              {/* SVG rep ring */}
              <div style={{ position:"relative", width:88, height:88, flexShrink:0 }}>
                <svg viewBox="0 0 88 88" style={{ width:"100%", height:"100%", display:"block" }}>
                  <circle cx={44} cy={44} r={37} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={7}/>
                  <circle
                    cx={44} cy={44} r={37} fill="none" stroke={playerColor} strokeWidth={7}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 37}
                    strokeDashoffset={2 * Math.PI * 37 * (1 - repsHechas / Math.max(bossHpMax,1))}
                    style={{ transition:"stroke-dashoffset .22s ease-out", transform:"rotate(-90deg)", transformOrigin:"center" }}
                  />
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:2 }}>
                  <motion.strong
                    key={repsHechas}
                    initial={{ scale:1.45, color:P.gold }}
                    animate={{ scale:1, color:"#fff" }}
                    transition={{ duration:.22 }}
                    style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:900, lineHeight:1 }}
                  >
                    {repsHechas}
                  </motion.strong>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:P.muted,
                    letterSpacing:".05em" }}>de {bossHpMax}</span>
                </div>
              </div>

              {/* Progress + status */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ ...raj(14,800), color:"#fff", marginBottom:3, whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis" }}>{bossAction}</div>
                <div style={{ display:"flex", justifyContent:"space-between",
                  ...raj(10,600), color:P.muted, marginBottom:5 }}>
                  <span>Progreso</span>
                  <span style={{ color:playerColor }}>{Math.round((repsHechas/bossHpMax)*100)}%</span>
                </div>
                <div style={{ height:7, background:"rgba(255,255,255,.06)", overflow:"hidden",
                  border:"1px solid rgba(255,255,255,.08)", borderRadius:999 }}>
                  <motion.div
                    animate={{ width:`${(repsHechas/bossHpMax)*100}%` }}
                    transition={{ duration:.2, ease:"easeOut" }}
                    style={{ height:"100%",
                      background:`linear-gradient(90deg,${playerColor}88,${playerColor})`,
                      boxShadow:`0 0 8px ${playerColor}88` }}
                  />
                </div>
                {/* Attack marker ticks */}
                <div style={{ position:"relative", height:4, marginTop:2 }}>
                  {[10,20,30,40].map(n => (
                    <div key={n} style={{
                      position:"absolute", top:0, bottom:0,
                      left:`${(n/bossHpMax)*100}%`, width:1,
                      background: repsHechas >= n ? `${playerColor}88` : "rgba(255,255,255,.15)",
                    }}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Camera / manual area */}
            {phase === "fighting" && (
              <div style={{ flex:1, width:"100%", minHeight:0, position:"relative",
                display:"flex", flexDirection:"column", gap:8, overflow:"hidden" }}>

                {usarCamara && !cameraError ? (
                  <div className="bb-camera-wrap">
                    <PoseCamera
                      key="boss-camera"
                      ejercicio={{ ...ejercicio, reps:bossHpMax }}
                      targetReps={bossHpMax}
                      onRepsChange={handleCameraReps}
                      onError={() => { setUsarCamara(false); setCameraError(true); }}
                    />

                    {/* Boss PiP — top-right corner */}
                    <div style={{
                      position:"absolute", top:8, right:8, zIndex:15,
                      background:`${P.bg0}DD`, backdropFilter:"blur(4px)",
                      border:`1px solid color-mix(in srgb, ${classAccent}, transparent 56%)`,
                      boxShadow:`0 0 20px ${classAccent}22`,
                      padding:8, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                      borderRadius:12,
                    }}>
                      <BossSprite
                        spriteMode={spriteMode}
                        spriteFrame={spriteFrame}
                        isHurt={isHurt}
                        small
                        bossData={bossData}
                      />
                      <div style={{ ...px8(4), color:auraColor, textAlign:"center", lineHeight:1.3 }}>
                        {spriteMode==="death" ? "☠️ FINAL" : enraged ? "ENRAJ." : `${bossHP}HP`}
                      </div>
                    </div>

                    {/* Hit flash */}
                    <AnimatePresence>
                      {isHurt && (
                        <motion.div key="repflash"
                          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          transition={{ duration:.1 }}
                          style={{
                            position:"absolute", inset:0, pointerEvents:"none",
                            background:`${playerColor}18`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                          }}
                        >
                          <div style={{ ...orb(32,900), color:playerColor,
                            textShadow:`0 0 24px ${playerColor}` }}>+1 ⚔️</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                ) : (
                  /* Manual fallback */
                  <div className="bb-camera-wrap">
                    <div className="bb-camera-manual">
                      <div style={{ opacity:.72 }}>
                        <BossSprite spriteMode={spriteMode} spriteFrame={spriteFrame}
                          isHurt={isHurt} small bossData={bossData}/>
                      </div>
                      <div style={{ ...raj(12,500), color:P.muted, textAlign:"center" }}>
                        {cameraError ? "Cámara no disponible — modo manual" : "Modo manual"}
                      </div>
                      <div className="bb-action-row">
                        <button className="bb-btn-ghost"
                          style={{ fontSize:22, padding:"8px 20px" }}
                          onClick={() => repsRef.current > 0 && handleRep(repsRef.current - 1)}>−</button>
                        <div style={{ ...orb(48,900), color:playerColor, minWidth:64,
                          textAlign:"center", textShadow:`0 0 22px ${playerColor}` }}>
                          {repsHechas}
                        </div>
                        <button className="bb-btn"
                          style={{ fontSize:22, padding:"8px 20px" }}
                          onClick={addManualRep}>+</button>
                      </div>
                      {!cameraError && detector && (
                        <button className="bb-btn-ghost" onClick={() => { setUsarCamara(true); setCameraError(false); }}>
                          📷 Activar cámara IA
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual +1 always accessible when camera active */}
                {usarCamara && !cameraError && (
                  <button className="bb-btn-ghost" onClick={addManualRep} style={{ flexShrink:0 }}>
                    ＋ Contar rep manualmente
                  </button>
                )}
              </div>
            )}

            {/* Waiting for death animation to finish */}
            {phase === "fighting" && spriteMode === "death" && (
              <div style={{ ...raj(12,600), color:P.red, textAlign:"center",
                animation:"bb-hpLow 1s ease-in-out infinite" }}>
                ☠️ Guardián cayendo…
              </div>
            )}
          </div>
        </div>

        {/* ── VICTORY / REWARD OVERLAY ───────────────────── */}
        <AnimatePresence>
          {(phase === "victory" || phase === "reward") && (
            <motion.div key="victory"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{
                position:"absolute", inset:0, zIndex:60,
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                background:"rgba(11,5,16,.95)", backdropFilter:"blur(8px)",
                overflowY:"auto",
              }}
            >
              <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                {Array.from({length:24}).map((_,i) => <VictoryParticle key={i} i={i}/>)}
              </div>

              <motion.div
                initial={{ scale:0, rotate:-12 }}
                animate={{ scale:1, rotate:0 }}
                transition={{ type:"spring", stiffness:260, damping:16, delay:.18 }}
                style={{ textAlign:"center", position:"relative", zIndex:5,
                  padding:"20px 24px", maxWidth:480, width:"100%" }}
              >
                {/* Dead boss — last death frame */}
                <div style={{ display:"flex", justifyContent:"center", marginBottom:10, opacity:.65 }}>
                  <BossSprite spriteMode="death" spriteFrame={DEATH_FRAMES} isHurt={false} bossData={bossData}/>
                </div>

                <div style={{ fontSize:"clamp(40px,10vw,64px)", marginBottom:6,
                  filter:`drop-shadow(0 0 28px ${P.gold})`,
                  animation:"bb-float 2.5s ease-in-out infinite" }}>💀</div>

                <div style={{ ...orb("clamp(18px,4.5vw,28px)",900), color:P.gold,
                  marginBottom:6, textShadow:`0 0 32px ${P.gold}`,
                  animation:"bb-victoryPop .7s cubic-bezier(.34,1.56,.64,1) both" }}>
                  ¡JEFE DERROTADO!
                </div>

                <div style={{ ...raj(13,500), color:P.mutedL, marginBottom:22,
                  maxWidth:340, lineHeight:1.55, margin:"0 auto 22px" }}>
                  {bossData.nombre} ha caído ante tu poder.
                </div>

                {/* Rewards */}
                <div style={{ display:"flex", gap:10, justifyContent:"center",
                  flexWrap:"wrap", marginBottom:22 }}>
                  {[
                    { icon:"⚡", label:`+${bossData.xpReward} XP`,     color:P.gold   },
                    { icon:"⚔️", label:`+${bossData.killBonus} BONUS`, color:P.accent },
                    { icon:"💰", label:`+${bossData.coinBonus} 💰`,    color:P.orange },
                  ].map((r,i) => (
                    <motion.div key={r.label}
                      initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:.5+i*.1 }}
                      style={{ background:`${r.color}18`, border:`1px solid ${r.color}55`,
                        padding:"9px 16px", display:"flex", alignItems:"center", gap:7,
                        boxShadow:`0 0 12px ${r.color}22` }}>
                      <span style={{ fontSize:16 }}>{r.icon}</span>
                      <span style={{ ...orb(11,700), color:r.color }}>{r.label}</span>
                    </motion.div>
                  ))}
                </div>

                <div style={{ ...mono(11,600), color:P.muted, marginBottom:20 }}>
                  XP TOTAL:{" "}
                  <span style={{ color:P.gold }}>+{bossData.xpReward+bossData.killBonus} XP ⚡</span>
                </div>

                <motion.button
                  initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:.85 }}
                  onClick={handleClaim}
                  disabled={claiming}
                  style={{
                    ...px8(8), color:"#0B0510", letterSpacing:".14em",
                    background:claiming?`${P.muted}88`:`linear-gradient(135deg,${P.gold},#E8A020)`,
                    border:"none", padding:"15px 48px",
                    cursor:claiming?"default":"pointer",
                    boxShadow:claiming?"none":`0 4px 32px ${P.gold}55`,
                    animation:claiming?"none":"bb-btnGlow 1.8s ease-in-out infinite",
                    transition:"all .2s",
                  }}
                  onMouseEnter={e=>{ if(!claiming) e.currentTarget.style.transform="scale(1.05)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; }}
                >
                  {claiming?"⏳ GUARDANDO...":"⚡ RECLAMAR RECOMPENSA"}
                </motion.button>

                <div style={{ ...raj(10,500), color:P.muted, marginTop:14 }}>
                  {bossHpMax} {bossAction.toLowerCase()} completadas · ¡Increíble hazaña!
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
