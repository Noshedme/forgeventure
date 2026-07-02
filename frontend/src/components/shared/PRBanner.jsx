// src/components/shared/PRBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Banner de Récord Personal — aparece cuando el usuario supera su mejor marca.
// Auto-cierra en 7s. Wine Aurora + Framer Motion.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";

const P = {
  bg0:"#08051A", card:"#14092A", navy:"#2A1050", line:"#2A1550",
  gold:"#FFD166", blue:"#4CC9F0", green:"#22C55E",
  text:"#F0E6FF", muted:"#9080B0",
};
const orb = (s,w=500) => mono(s,w);
const px8 = (s) => mono(s,700);

const AUTO_CLOSE_MS = 7000;

const CSS = `
  @keyframes pr-shine  { 0%{left:-100%} 100%{left:200%} }
  @keyframes pr-burst  { 0%{transform:scale(0) rotate(-20deg);opacity:0}
                         60%{transform:scale(1.15) rotate(5deg)}
                         100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes pr-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes pr-glow   { 0%,100%{filter:drop-shadow(0 0 8px #FFC857)}
                         50%{filter:drop-shadow(0 0 24px #FFC857)} }
  @keyframes pr-ring   { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(2.5);opacity:0} }
  @keyframes pr-sweep  { 0%{width:100%} 100%{width:0%} }
  @keyframes pr-confetti{ 0%{transform:translateY(0) rotate(0deg);opacity:1}
                          100%{transform:translateY(-60px) rotate(720deg);opacity:0} }
  @keyframes pr-pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }

  .pr-shine { position:absolute;top:0;left:-100%;width:60%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
    pointer-events:none;animation:pr-shine 1.4s ease .2s 1; }
  .pr-trophy { animation:pr-float 2s ease-in-out infinite; }
  .pr-glow   { animation:pr-glow  2s ease-in-out infinite; }
`;

function Particle({ x, color }) {
  const r = Math.random;
  return (
    <div style={{
      position:"absolute", bottom:"100%", left:`${x}%`,
      width:6, height:6,
      background:color,
      borderRadius:r()>0.5?"50%":"2px",
      animation:`pr-confetti ${0.6+r()*0.8}s ease ${r()*0.4}s both`,
      pointerEvents:"none",
    }}/>
  );
}

function formatPR(type, value, ejercicioNombre) {
  if (type === "reps") {
    return `${value} ${value === 1 ? "repetición" : "repeticiones"} de ${ejercicioNombre}`;
  }
  const min = Math.floor(value / 60);
  const sec = value % 60;
  const timeStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  return `${timeStr} en ${ejercicioNombre}`;
}

// ══════════════════════════════════════════════════════════════
export default function PRBanner({ prData, onClose }) {
  const [progress, setProgress] = useState(100);
  const startRef  = useRef(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(pct);
      if (pct <= 0) { clearInterval(intervalRef.current); onClose(); }
    }, 60);
    return () => clearInterval(intervalRef.current);
  }, [onClose]);

  const { type, value, prev, ejercicioNombre, xpBonus } = prData;
  const isFirst = prev === 0;
  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: 5 + i * 8,
    color: [P.gold, P.blue, P.green, "#FF6B6B", "#C77DFF"][i % 5],
  }));

  return (
    <>
      <style>{CSS}</style>
      <AnimatePresence>
        <motion.div
          initial={{ opacity:0, y:80, scale:.9 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:60, scale:.94 }}
          transition={{ type:"spring", stiffness:380, damping:28 }}
          style={{
            position:"fixed", bottom:32, left:"50%", x:"-50%",
            width:"min(480px, calc(100vw - 32px))",
            background:`linear-gradient(135deg,${P.navy},${P.card})`,
            border:`2px solid ${P.gold}66`,
            boxShadow:`0 0 0 1px ${P.line}, 0 12px 60px rgba(0,0,0,.8),
                       0 0 40px ${P.gold}22, 0 0 80px ${P.gold}0A`,
            overflow:"hidden", zIndex:9999, userSelect:"none",
          }}>

          {/* Confetti particles */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
            {particles.map((p, i) => <Particle key={i} {...p}/>)}
          </div>

          {/* Top gold bar */}
          <div style={{ height:3, background:`linear-gradient(90deg,transparent,${P.gold},#FFF8DC,${P.gold},transparent)` }}/>
          <div className="pr-shine"/>

          {/* Ring decorations */}
          <div style={{ position:"absolute", top:16, right:20, width:56, height:56,
            borderRadius:"50%", border:`2px solid ${P.gold}33`,
            animation:"pr-ring 2.2s ease-out infinite", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", top:16, right:20, width:56, height:56,
            borderRadius:"50%", border:`1px solid ${P.gold}18`,
            animation:"pr-ring 2.2s ease-out .7s infinite", pointerEvents:"none" }}/>

          {/* Aurora blob */}
          <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180,
            borderRadius:"50%", background:`radial-gradient(circle,${P.gold}14 0%,transparent 70%)`,
            filter:"blur(24px)", pointerEvents:"none" }}/>

          <div style={{ padding:"18px 20px 14px", position:"relative", zIndex:1 }}>

            {/* Close */}
            <button onClick={onClose}
              style={{ position:"absolute", top:0, right:0, background:"transparent",
                border:"none", color:P.muted, padding:8, cursor:"pointer", display:"flex" }}>
              <X size={13}/>
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:16 }}>

              {/* Trophy */}
              <div style={{ fontSize:44, lineHeight:1, flexShrink:0,
                animation:"pr-burst .5s ease both",
                filter:`drop-shadow(0 0 16px ${P.gold})` }}
                className="pr-trophy">
                🏆
              </div>

              {/* Text */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ ...px8(isFirst ? 7 : 8), color:P.gold,
                  letterSpacing:".06em", marginBottom:6,
                  textShadow:`0 0 16px ${P.gold}88` }}>
                  {isFirst ? "¡PRIMER RÉCORD!" : "¡PR PERSONAL!"}
                </div>

                <div style={{ ...sans(13,700), color:P.text, marginBottom:6,
                  lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis",
                  display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                  {formatPR(type, value, ejercicioNombre)}
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  {!isFirst && (
                    <span style={{ ...mono(9,600), color:P.muted }}>
                      Anterior: {type === "reps" ? `${prev} reps` : `${prev}s`}
                    </span>
                  )}
                  <span style={{ ...mono(10,700), color:P.blue,
                    background:`${P.blue}18`, border:`1px solid ${P.blue}33`,
                    padding:"2px 8px", animation:"pr-burst .5s ease .2s both" }}>
                    +{xpBonus} XP BONUS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-close progress bar */}
          <div style={{ height:3, background:P.navy, position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%",
              width:`${progress}%`,
              background:`linear-gradient(90deg,${P.gold}88,${P.gold})`,
              boxShadow:`0 0 8px ${P.gold}`,
              transition:"width 60ms linear" }}/>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
