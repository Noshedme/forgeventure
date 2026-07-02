// src/components/shared/DailyBonusPopup.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Popup de bonus diario — Admin Config aesthetic (sc-admin palette)
// Auto-dismiss 6s · slide-up from bottom
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Star } from "lucide-react";

// ── Admin config palette (sc-admin) ──────────────────────────
const A = {
  bg:      "#0A0E1A",
  card:    "#141A2A",
  panel:   "#0E1520",
  navy:    "#1A3354",
  navyL:   "#1E3A5F",
  orange:  "#D4A574",
  orangeL: "#E6B98A",
  gold:    "#C9B037",
  blue:    "#5A9FD4",
  teal:    "#4A9D8F",
  green:   "#6B9F6A",
  red:     "#C66B6B",
  purple:  "#8B7BB8",
  white:   "#F0F4FF",
  muted:   "#7A8A9E",
  mutedL:  "#9AA3B2",
};

// ── Typography helpers ────────────────────────────────────────
const raj = (s, w = 600) => ({ fontFamily: "'Rajdhani',sans-serif",   fontSize: s, fontWeight: w });
const orb = (s, w = 700) => ({ fontFamily: "'Orbitron',sans-serif",   fontSize: s, fontWeight: w });
const px8 = (s)          => ({ fontFamily: "'Press Start 2P'",        fontSize: s });

const AUTO_CLOSE_MS = 6000;

// ── Keyframes ─────────────────────────────────────────────────
const CSS = `
  @keyframes dbp-fire   { 0%,100%{filter:drop-shadow(0 0 5px #C9B037aa)} 50%{filter:drop-shadow(0 0 14px #C9B037)} }
  @keyframes dbp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes dbp-pop    { 0%{transform:scale(.6) rotate(-6deg);opacity:0} 70%{transform:scale(1.08) rotate(1deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes dbp-coinIn { 0%{opacity:0;transform:translateY(14px) scale(.8)} 60%{transform:translateY(-3px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes dbp-ring   { 0%{transform:scale(1);opacity:.4} 100%{transform:scale(2);opacity:0} }
  @keyframes dbp-shine  { 0%{left:-100%} 100%{left:220%} }
  @keyframes dbp-glow   { 0%,100%{box-shadow:0 0 0 rgba(212,165,116,0)} 50%{box-shadow:0 0 22px rgba(212,165,116,.35)} }

  .dbp-float { animation:dbp-float 2.2s ease-in-out infinite; }
  .dbp-fire  { animation:dbp-fire  2s   ease-in-out infinite; }
`;

// ── Week dots row ─────────────────────────────────────────────
function WeekDots({ streak }) {
  const posInWeek = ((streak - 1) % 7) + 1;

  return (
    <div style={{ display: "flex", gap: 7, justifyContent: "center", alignItems: "flex-end", marginBottom: 6 }}>
      {Array.from({ length: 7 }, (_, i) => {
        const dayNum  = i + 1;
        const filled  = dayNum <= posInWeek;
        const isToday = dayNum === posInWeek;

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 320, damping: 20 }}
              style={{
                width:  isToday ? 14 : 9,
                height: isToday ? 14 : 9,
                borderRadius: "50%",
                background: isToday
                  ? A.gold
                  : filled
                    ? `${A.gold}66`
                    : `${A.navy}`,
                border: `1.5px solid ${filled ? A.gold : A.navyL}${filled ? "" : "88"}`,
                boxShadow: isToday ? `0 0 10px ${A.gold}88` : "none",
                animation: isToday ? "dbp-pop .5s ease both" : "none",
                transition: "all .2s",
              }}
            />
            <span style={{
              ...raj(7, isToday ? 700 : 500),
              color: isToday ? A.gold : filled ? `${A.gold}77` : `${A.muted}55`,
            }}>
              {dayNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Reward value display ──────────────────────────────────────
function RewardStat({ icon, value, label, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: .85 }}
      animate={{ opacity: 1, y: 0,  scale: 1   }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 22 }}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 6,
      }}
    >
      <div style={{
        width: 50, height: 50,
        background: `${color}12`,
        border: `1px solid ${color}33`,
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        position: "relative", overflow: "hidden",
        boxShadow: `0 0 14px ${color}22`,
      }}>
        {/* Shine sweep */}
        <div style={{
          position: "absolute", top: 0, left: "-100%",
          width: "60%", height: "100%",
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)",
          animation: `dbp-shine .8s ease ${delay + .2}s 1`,
        }}/>
        {icon}
      </div>
      <div style={{ ...orb(18, 900), color, textShadow: `0 0 10px ${color}44` }}>
        {value}
      </div>
      <div style={{ ...raj(9, 600), color: A.muted, letterSpacing: ".06em" }}>
        {label}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN POPUP
// ══════════════════════════════════════════════════════════════
export default function DailyBonusPopup({ bonus, onClose, heroClass }) {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const startRef    = useRef(Date.now());

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct     = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(pct);
      if (pct <= 0) { clearInterval(intervalRef.current); onClose(); }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [onClose]);

  const clsColor = { GUERRERO: A.red, ARQUERO: A.blue, MAGO: A.purple }[heroClass] || A.orange;
  const { streak, xpGained, coinsGained, isMilestone, milestoneMsg } = bonus;

  const weekNum   = Math.ceil(streak / 7);
  const dayInWeek = ((streak - 1) % 7) + 1;
  const isFirst   = streak === 1;

  // Next milestone hint
  const STEPS = [7, 14, 30, 60, 100];
  const nextMs = STEPS.find(m => m > streak) ?? null;
  const daysToNext = nextMs ? nextMs - streak : 0;

  return (
    <>
      <style>{CSS}</style>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 72, scale: .92 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 48, scale: .95  }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          style={{
            position: "fixed",
            bottom: 28, left: "50%",
            transform: "translateX(-50%)",
            width: "min(420px, calc(100vw - 24px))",
            background: "rgba(10, 14, 26, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${A.navy}aa`,
            borderRadius: 16,
            boxShadow: `0 0 0 1px ${A.navyL}22,
                        0 12px 60px rgba(0,0,0,.8),
                        0 0 50px rgba(212,165,116,.07)`,
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* ── Gradient accent line ────────────────────────── */}
          <div style={{
            height: 2,
            background: isMilestone
              ? `linear-gradient(90deg, transparent, ${A.gold}ee, ${A.orangeL}, ${A.gold}ee, transparent)`
              : `linear-gradient(90deg, transparent, ${A.orange}cc, ${A.gold}bb, ${A.orange}cc, transparent)`,
            borderRadius: "16px 16px 0 0",
          }}/>

          {/* ── Ambient blob ────────────────────────────────── */}
          <div style={{
            position: "absolute", top: -50, right: -50,
            width: 180, height: 180, borderRadius: "50%",
            background: `radial-gradient(circle, ${A.gold}0c 0%, transparent 70%)`,
            filter: "blur(30px)", pointerEvents: "none", zIndex: 0,
          }}/>

          {/* ── Milestone ring decorations ───────────────────── */}
          {isMilestone && (
            <>
              <div style={{
                position: "absolute", top: 14, left: 14, width: 52, height: 52,
                borderRadius: "50%", border: `1.5px solid ${A.gold}44`,
                animation: "dbp-ring 2.2s ease-out infinite", pointerEvents: "none", zIndex: 0,
              }}/>
              <div style={{
                position: "absolute", top: 14, left: 14, width: 52, height: 52,
                borderRadius: "50%", border: `1px solid ${A.gold}22`,
                animation: "dbp-ring 2.2s ease-out .7s infinite", pointerEvents: "none", zIndex: 0,
              }}/>
            </>
          )}

          <div style={{ padding: "18px 20px 16px", position: "relative", zIndex: 1 }}>

            {/* ── Close button ─────────────────────────────── */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 12, right: 14,
                background: `${A.navy}66`, border: `1px solid ${A.navyL}`,
                borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: A.muted,
                display: "flex", alignItems: "center",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = A.white; e.currentTarget.style.borderColor = A.mutedL; }}
              onMouseLeave={e => { e.currentTarget.style.color = A.muted; e.currentTarget.style.borderColor = A.navyL; }}
            >
              <X size={12}/>
            </button>

            {/* ── Header ────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              {/* Title */}
              <div style={{
                ...orb(10, 700), color: A.gold,
                letterSpacing: ".1em", marginBottom: 8,
              }}>
                ¡BONUS DIARIO!
              </div>

              {/* Streak counter */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, marginBottom: 6,
              }}>
                <span className="dbp-fire" style={{ fontSize: 24 }}>🔥</span>

                <div>
                  <motion.div
                    key={streak}
                    initial={{ opacity: 0, y: -8, scale: .8 }}
                    animate={{ opacity: 1, y: 0,  scale: 1  }}
                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                    style={{
                      ...orb(isMilestone ? 20 : 18, 900),
                      color: A.white,
                      textShadow: isMilestone ? `0 0 18px ${A.gold}77` : "none",
                    }}
                  >
                    {isFirst ? "PRIMER DÍA" : `DÍA ${streak} DE RACHA`}
                  </motion.div>
                  {streak > 7 && (
                    <div style={{ ...raj(10, 500), color: A.muted, marginTop: 2 }}>
                      Semana {weekNum} · Día {dayInWeek} de 7
                    </div>
                  )}
                </div>

                <span className="dbp-fire" style={{ fontSize: 24 }}>🔥</span>
              </div>

              {/* Milestone banner */}
              {isMilestone && milestoneMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: .85 }}
                  animate={{ opacity: 1, scale: 1  }}
                  transition={{ delay: .15, type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    background: `${A.gold}12`,
                    border: `1px solid ${A.gold}44`,
                    borderRadius: 8, padding: "7px 14px",
                    marginTop: 6, marginBottom: 4,
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "-100%",
                    width: "50%", height: "100%",
                    background: "linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)",
                    animation: "dbp-shine 1.2s ease .4s 1",
                  }}/>
                  <div style={{ ...px8(6), color: A.gold, letterSpacing: ".06em" }}>
                    {milestoneMsg}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Week dots ─────────────────────────────────── */}
            <WeekDots streak={streak}/>

            {/* ── Reward values ──────────────────────────────── */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 28,
              margin: "14px 0 10px",
              padding: "14px 18px",
              background: `rgba(20,26,42,0.8)`,
              border: `1px solid ${A.navyL}44`,
              borderRadius: 12,
              position: "relative", overflow: "hidden",
            }}>
              {/* Subtle top line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${A.navyL}88, transparent)`,
              }}/>

              <RewardStat
                icon="⚡"
                value={`+${xpGained}`}
                label="XP"
                color={A.blue}
                delay={0.05}
              />

              {/* Divider */}
              <div style={{ width: 1, background: `${A.navyL}66`, alignSelf: "stretch", margin: "4px 0" }}/>

              <RewardStat
                icon="🪙"
                value={`+${coinsGained}`}
                label="MONEDAS"
                color={A.gold}
                delay={0.15}
              />
            </div>

            {/* ── Next milestone hint ────────────────────────── */}
            {!isMilestone && nextMs && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: .3 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  ...raj(10, 500), color: A.muted,
                }}
              >
                <Star size={11} color={`${A.gold}88`}/>
                <span>
                  <span style={{ ...raj(10, 700), color: A.gold }}>{daysToNext} día{daysToNext !== 1 ? "s" : ""}</span>
                  {" "}para el hito del día {nextMs}
                </span>
                <Star size={11} color={`${A.gold}88`}/>
              </motion.div>
            )}
          </div>

          {/* ── Auto-close progress bar ───────────────────────── */}
          <div style={{ height: 3, background: A.navy, position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0,
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${A.orange}cc, ${A.gold})`,
              boxShadow: `0 0 6px ${A.gold}88`,
              transition: "width 50ms linear",
              borderRadius: "0 2px 2px 0",
            }}/>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
