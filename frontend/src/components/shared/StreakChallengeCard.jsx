// src/components/shared/StreakChallengeCard.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase.js";
import { getStreakChallenge } from "../../services/api.js";
import { Flame, Shield, Check, Zap, Clock, Trophy } from "lucide-react";
import { useLang } from "../../hooks/useLang.js";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";

// ── SC Admin palette ─────────────────────────────────────────────
const C = {
  bg: P.bg0,    side: P.bg1,  card: P.bg1,   panel: P.bg2,
  navy: P.navy, navyL: P.line,
  orange: P.accent, orangeL: P.accent2, gold: P.gold,
  blue: "#4CC9F0", teal: "#4A9D8F", green: "#6BC87A",
  red: "#E05C8A",  purple: P.accent,  pink: "#EC4899",
  white: P.text, muted: P.muted, mutedL: P.mutedL,
};

const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);
const px8 = (s) => mono(s, 700);

const CSS = `
  @keyframes sc-pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes sc-fire   { 0%,100%{filter:drop-shadow(0 0 6px #C9B037)} 50%{filter:drop-shadow(0 0 18px #D4A574)} }
  @keyframes sc-glow   { 0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:0 0 0 8px #C66B6B18} }
  @keyframes sc-ring   { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.2);opacity:0} }
  @keyframes sc-pop    { 0%{transform:scale(0) rotate(-8deg);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  @keyframes sc-shine  { 0%{left:-100%} 100%{left:200%} }
  @keyframes sc-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes sc-bar    { from{width:0} to{width:var(--sc-bw)} }

  .sc-fire     { animation: sc-fire 1.8s ease-in-out infinite; }
  .sc-pulse-tx { animation: sc-pulse 1.2s ease-in-out infinite; }
  .sc-float    { animation: sc-float 2.4s ease-in-out infinite; }
  .sc-shine    { position:absolute;top:0;left:-100%;width:60%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);
    pointer-events:none;animation:sc-shine 2s ease 0.3s 1; }
`;

function calcChallengeReward(streak) {
  if (streak >= 100) return { xp:100, coins:75 };
  if (streak >= 60)  return { xp:75,  coins:55 };
  if (streak >= 30)  return { xp:55,  coins:40 };
  if (streak >= 14)  return { xp:40,  coins:28 };
  if (streak >= 7)   return { xp:28,  coins:20 };
  return { xp:15, coins:10 };
}

function formatCountdown(msLeft) {
  if (msLeft <= 0) return "00:00:00";
  const s   = Math.floor(msLeft / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

// ══════════════════════════════════════════════════════════════
export default function StreakChallengeCard({ profile, onNavigate, onChallengeComplete }) {
  const { t } = useLang();
  const [challenge,   setChallenge]   = useState(null);
  const [msLeft,      setMsLeft]      = useState(0);
  const [justDone,    setJustDone]    = useState(false);
  const [bonusEarned, setBonusEarned] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const timerRef = useRef(null);

  const fetchChallenge = useCallback(async () => {
    try {
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken();
      const res   = await getStreakChallenge(token);
      if (res?.ok) {
        setChallenge(res);
        setMsLeft(Math.max(0, res.midnightUTC - Date.now()));
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

  useEffect(() => {
    if (!challenge?.midnightUTC) return;
    timerRef.current = setInterval(() => {
      setMsLeft(Math.max(0, challenge.midnightUTC - Date.now()));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [challenge?.midnightUTC]);

  useEffect(() => {
    const handle = (e) => {
      const { streakChallengeBonus } = e.detail || {};
      if (!streakChallengeBonus) return;
      setJustDone(true);
      setBonusEarned(streakChallengeBonus);
      setChallenge(prev => prev ? { ...prev, completed: true } : prev);
      onChallengeComplete?.(streakChallengeBonus);
    };
    window.addEventListener("exerciseCompleted", handle);
    return () => window.removeEventListener("exerciseCompleted", handle);
  }, [onChallengeComplete]);

  if (loading || !challenge?.active) return null;

  const { streak, completed, reward } = challenge;
  const isDone     = completed || justDone;
  const isUrgent   = !isDone && msLeft > 0 && msLeft < 2 * 3600 * 1000;
  const isCritical = !isDone && msLeft > 0 && msLeft < 3600 * 1000;
  const accent     = isDone ? C.green : isCritical ? C.red : isUrgent ? C.orange : C.gold;
  const timeStr    = formatCountdown(msLeft);

  // Progress 0→1 over the day
  const dayProgress = challenge.midnightUTC
    ? Math.min(1, (1 - msLeft / 86400000))
    : 0;

  return (
    <>
      <style>{CSS}</style>
      <motion.div
        initial={{ opacity:0, y:-12 }}
        animate={{ opacity:1, y:0 }}
        transition={{ type:"spring", stiffness:300, damping:24 }}
        style={{
          background: C.card,
          border: `1px solid ${C.navy}`,
          borderTop: `2px solid ${accent}`,
          borderRadius: 14,
          boxShadow: isCritical && !isDone
            ? `0 0 0 1px ${C.red}22, 0 4px 28px ${C.red}18`
            : "0 4px 24px rgba(0,0,0,0.35)",
          position:"relative", overflow:"hidden",
          animation: isCritical && !isDone ? "sc-glow 2s ease-in-out infinite" : "none",
        }}>

        {/* Ambient corner glow */}
        <div style={{ position:"absolute", top:-40, right:-30, width:140, height:140,
          background:accent, opacity:.05, borderRadius:"50%", filter:"blur(50px)", pointerEvents:"none" }}/>

        {/* Urgency rings */}
        {isCritical && !isDone && (
          <>
            <div style={{ position:"absolute", top:14, right:88, width:44, height:44,
              borderRadius:"50%", border:`1px solid ${C.red}44`,
              animation:"sc-ring 2s ease-out infinite", pointerEvents:"none" }}/>
            <div style={{ position:"absolute", top:14, right:88, width:44, height:44,
              borderRadius:"50%", border:`1px solid ${C.red}22`,
              animation:"sc-ring 2s ease-out .7s infinite", pointerEvents:"none" }}/>
          </>
        )}

        <div className="sc-shine"/>

        <div style={{ padding:"16px 18px", display:"grid",
          gridTemplateColumns:"auto 1fr auto", gap:14, alignItems:"center" }}>

          {/* ── LEFT: streak counter ── */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div className={isDone ? "sc-float" : "sc-fire"}
              style={{ width:48, height:48, borderRadius:12,
                background: `${accent}18`, border:`1px solid ${accent}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 0 12px ${accent}33` }}>
              {isDone ? <Check size={22} color={accent}/> : <Flame size={22} color={accent}/>}
            </div>
            <div style={{ ...orb(16,900), color:accent, lineHeight:1 }}>{streak}</div>
            <div style={{ ...px8(5), color:C.muted }}>{t("dash.sc.days")}</div>
          </div>

          {/* ── CENTER: info ── */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
              <span style={{ ...px8(7), color:accent, letterSpacing:".04em" }}>
                {isDone ? t("dash.sc.done") : t("dash.sc.title")}
              </span>
              {!isDone && (
                <span style={{
                  ...raj(9,700), color: C.bg,
                  background: isCritical ? C.red : isUrgent ? C.orange : accent,
                  borderRadius: 4, padding:"2px 7px",
                  animation: isCritical ? "sc-pulse-tx 1s infinite" : "none",
                }}>
                  {isCritical ? t("dash.sc.urgent") : isUrgent ? t("dash.sc.soon") : t("dash.sc.active")}
                </span>
              )}
            </div>

            {isDone ? (
              <AnimatePresence>
                <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ ...raj(12,600), color:C.mutedL, lineHeight:1.5 }}>
                    {t("dash.sc.protected")}
                  </span>
                  {bonusEarned && (
                    <div style={{ display:"flex", gap:8, animation:"sc-pop .4s ease both" }}>
                      <span style={{ ...raj(12,700), color:C.blue, background:`${C.blue}14`, border:`1px solid ${C.blue}33`, borderRadius:4, padding:"2px 8px", display:"inline-flex", alignItems:"center", gap:4 }}>
                        <Zap size={10} color={C.blue}/> +{bonusEarned.xp} XP
                      </span>
                      <span style={{ ...raj(12,700), color:C.gold, background:`${C.gold}14`, border:`1px solid ${C.gold}33`, borderRadius:4, padding:"2px 8px" }}>
                        +{bonusEarned.coins} {t("dash.sc.coins")}
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                <div style={{ ...raj(12,500), color:C.mutedL, marginBottom:8, lineHeight:1.5 }}>
                  {t("dash.sc.no_break")}{" "}
                  <span style={{ color:accent, fontWeight:700 }}>{streak} {t("dash.sc.day_dot")}</span>
                  {" "}{t("dash.sc.complete")}{" "}
                  <span style={{ color:C.white, fontWeight:700 }}>{t("dash.sc.exercise")}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ ...raj(10,600), color:C.muted }}>{t("dash.sc.reward")}</span>
                  <span style={{ ...raj(11,700), color:C.blue, background:`${C.blue}12`, border:`1px solid ${C.blue}22`, borderRadius:4, padding:"1px 8px", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <Zap size={9} color={C.blue}/> +{reward.xp} XP
                  </span>
                  <span style={{ ...raj(11,700), color:C.gold, background:`${C.gold}10`, border:`1px solid ${C.gold}22`, borderRadius:4, padding:"1px 8px" }}>
                    +{reward.coins} {t("dash.sc.coins")}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: timer + CTA ── */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10, minWidth:104 }}>
            {!isDone ? (
              <>
                <div style={{ textAlign:"center", background:C.panel, border:`1px solid ${C.navy}`, borderRadius:10, padding:"8px 12px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3, justifyContent:"center" }}>
                    <Clock size={9} color={C.muted}/>
                    <span style={{ ...raj(9,600), color:C.muted, letterSpacing:".06em" }}>{t("dash.sc.time")}</span>
                  </div>
                  <div style={{
                    ...orb(isCritical ? 14 : 12, 900),
                    color: isCritical ? C.red : isUrgent ? C.orange : C.white,
                    fontVariantNumeric:"tabular-nums",
                    animation: isCritical ? "sc-pulse-tx 1s ease-in-out infinite" : "none",
                    textShadow: isCritical ? `0 0 10px ${C.red}` : "none",
                  }}>
                    {timeStr}
                  </div>
                </div>
                <button onClick={() => onNavigate?.("ejercicios")}
                  style={{
                    background: isCritical
                      ? `linear-gradient(135deg,${C.red},${C.orange})`
                      : `linear-gradient(135deg,${accent},${C.gold})`,
                    border:"none", borderRadius:8, padding:"9px 14px",
                    ...raj(11,700), color: C.bg, cursor:"pointer",
                    boxShadow:`0 4px 16px ${accent}44`,
                    transition:"all .18s", display:"flex", alignItems:"center", gap:6,
                    width:"100%", justifyContent:"center",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <Zap size={11}/> {t("dash.sc.train")}
                </button>
              </>
            ) : (
              <div style={{ textAlign:"center", animation:"sc-pop .5s ease both" }}>
                <div style={{ width:52, height:52, borderRadius:14, background:`${C.green}18`, border:`1px solid ${C.green}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 6px", boxShadow:`0 0 12px ${C.green}44` }}>
                  <Shield size={26} color={C.green}/>
                </div>
                <div style={{ ...px8(6), color:C.green }}>{t("dash.sc.safe1")}<br/>{t("dash.sc.safe2")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isDone && challenge.midnightUTC && (
          <div style={{ height:3, background:C.navy, borderRadius:"0 0 14px 14px" }}>
            <div style={{
              height:"100%",
              width:`${dayProgress * 100}%`,
              "--sc-bw":`${dayProgress * 100}%`,
              background: isCritical
                ? `linear-gradient(90deg,${C.red}77,${C.red})`
                : `linear-gradient(90deg,${accent}66,${accent})`,
              borderRadius:"0 0 14px 14px",
              transition:"width 1s linear",
            }}/>
          </div>
        )}
      </motion.div>
    </>
  );
}
