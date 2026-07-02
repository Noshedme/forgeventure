import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import sm from "../../services/soundManager";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";

// ── Palette ────────────────────────────────────────────────────────
const P = {
  bg0:    "#08051A",
  card:   "#12082A",
  gold:   "#FFD166",
  purple: "#A55EEA",
  blue:   "#4CC9F0",
  green:  "#22C55E",
  text:   "#F0E6FF",
  muted:  "#9080B0",
  dim:    "#5a4d72",
};

const CONFETTI_COLORS = [P.gold, "#A55EEA", "#4CC9F0", "#22C55E", "#FF6B6B", "#A8EDEA", "#FFB347"];

// Class data ─────────────────────────────────────────────────────────
const CLASS_META = {
  GUERRERO: { crest: "/ui/crest-warrior.png",  accent: "#ff4d5e", label: "Guerrero"   },
  ARQUERO:  { crest: "/ui/crest-archer.png",   accent: "#7bdc3b", label: "Arquero"    },
  MAGO:     { crest: "/ui/crest-mage.png",     accent: "#4cc9f0", label: "Mago"       },
  DEFAULT:  { crest: "/ui/crest-default.png",  accent: "#c08aff", label: "Aventurero" },
};

// ── CSS keyframes ──────────────────────────────────────────────────
const CSS = `
@keyframes lu-ring1  { to { transform:translate(-50%,-50%) rotate(360deg); } }
@keyframes lu-ring2  { to { transform:translate(-50%,-50%) rotate(-360deg); } }
@keyframes lu-glow   {
  0%,100% { text-shadow:0 0 24px #FFD166,0 0 60px #FFD16688,0 0 100px #FFD16644; }
  50%     { text-shadow:0 0 44px #FFD166,0 0 110px #FFD166bb,0 0 180px #FFD16666; }
}
@keyframes lu-float  { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-9px); } }
@keyframes lu-rays   { to { transform:translate(-50%,-50%) rotate(360deg); } }
@keyframes lu-star   { 0%,100%{ opacity:.18; transform:scale(.8); } 50%{ opacity:1; transform:scale(1.25); } }
@keyframes lu-scan   { from{ transform:translateY(-100%); } to{ transform:translateY(220vh); } }
@keyframes lu-numPop {
  0%  { transform:scale(.35); opacity:0; filter:blur(14px); }
  60% { transform:scale(1.16); opacity:1; filter:blur(0); }
  80% { transform:scale(.96); }
  100%{ transform:scale(1); }
}
@keyframes lu-shimmer {
  0%   { transform:translateX(-120%); }
  100% { transform:translateX(220%); }
}
@keyframes lu-btnPulse {
  0%,100%{ box-shadow:0 0 0 0 var(--lu-accent,#A55EEA)44; }
  50%    { box-shadow:0 0 0 16px transparent; }
}
@keyframes lu-crestSpin {
  0%,100%{ transform:translate(-50%,-50%) rotate(-4deg) scale(1); opacity:.18; }
  50%    { transform:translate(-50%,-50%) rotate(4deg)  scale(1.06); opacity:.26; }
}
@keyframes lu-barShine {
  0%  { left:-60%; }
  100%{ left:160%; }
}
@keyframes lu-tagPop {
  0%  { transform:scale(.7) translateY(8px); opacity:0; }
  70% { transform:scale(1.05) translateY(-2px); }
  100%{ transform:scale(1) translateY(0); opacity:1; }
}
@keyframes lu-rowIn {
  from{ opacity:0; transform:translateX(-14px); }
  to  { opacity:1; transform:translateX(0); }
}
`;

// ── Sub-components ─────────────────────────────────────────────────
function Particle({ index, total, burst }) {
  const angle  = (index / total) * Math.PI * 2 + Math.random() * 0.6;
  const dist   = 130 + Math.random() * 230;
  const color  = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size   = 5 + Math.random() * 9;
  const square = Math.random() > 0.5;
  if (!burst) return null;
  return (
    <motion.div
      style={{ position:"absolute", top:"50%", left:"50%", width:size, height:size,
        borderRadius: square ? 2 : "50%", background:color, pointerEvents:"none", zIndex:3,
        boxShadow:`0 0 8px ${color}` }}
      initial={{ x:0, y:0, opacity:1, scale:1, rotate:0 }}
      animate={{ x:Math.cos(angle)*dist, y:Math.sin(angle)*dist, opacity:0, scale:.15, rotate:angle*200 }}
      transition={{ duration:1.5 + Math.random() * 0.7, delay:Math.random() * 0.3, ease:"easeOut" }}
    />
  );
}

function HaloRing({ size, color, width, duration, reverse, dashed }) {
  return (
    <div style={{ position:"absolute", top:"50%", left:"50%", width:size, height:size,
      borderRadius:"50%", border:`${width}px ${dashed?"dashed":"solid"} ${color}`,
      boxShadow:`0 0 14px ${color}44, inset 0 0 10px ${color}22`,
      animation:`${reverse?"lu-ring2":"lu-ring1"} ${duration}s linear infinite` }}/>
  );
}

function Rays({ count = 10, color, opacity = 0.09 }) {
  return (
    <div style={{ position:"absolute", top:"50%", left:"50%", width:1000, height:1000,
      animation:"lu-rays 14s linear infinite", pointerEvents:"none" }}>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:500, height:2,
          background:`linear-gradient(to right,${color}00,${color})`, opacity,
          transformOrigin:"left center", transform:`rotate(${(i/count)*360}deg)` }}/>
      ))}
    </div>
  );
}

function useCounter(from, to, delay = 0, duration = 900) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    const t = setTimeout(() => {
      const steps = 32;
      let i = 0;
      const id = setInterval(() => {
        i++;
        const p = 1 - Math.pow(1 - i / steps, 2.4);
        setVal(Math.round(from + (to - from) * p));
        if (i >= steps) clearInterval(id);
      }, duration / steps);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [from, to, delay, duration]);
  return val;
}

function ImgSafe({ src, alt="", style={} }) {
  return (
    <img src={src} alt={alt} style={{ objectFit:"contain", imageRendering:"pixelated", ...style }}
      onError={e => { e.currentTarget.style.display = "none"; }} />
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN CEREMONY
// ═══════════════════════════════════════════════════════════════════
export default function LevelUpCeremony({ levelData, onDismiss }) {
  if (!levelData || !canShowXpPopups()) return null;

  const { newLevel = 1, xpGained = 0, levelsGained = 1, xpNext, heroClass = "DEFAULT" } = levelData;
  const oldLevel     = newLevel - (levelsGained || 1);
  const classMeta    = CLASS_META[String(heroClass).toUpperCase()] || CLASS_META.DEFAULT;
  const accent       = classMeta.accent;

  const [phase,      setPhase]      = useState(0);
  const [burst,      setBurst]      = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);

  const displayLevel = useCounter(oldLevel, newLevel, 600, 950);

  useEffect(() => {
    sm.playLevelUp();
    const t1 = setTimeout(() => setPhase(1), 350);
    const t2 = setTimeout(() => { setPhase(2); setBurst(true); }, 1350);
    const t3 = setTimeout(() => setPhase(3), 2300);
    const t4 = setTimeout(() => setCanDismiss(true), 2900);
    return () => { [t1,t2,t3,t4].forEach(clearTimeout); };
  }, []);

  const handleClick = () => { if (canDismiss) { sm.playClick(); onDismiss?.(); } };

  const UNLOCKS = [
    { img:"/ui/stat-str.png",                text:`Recompensas de ejercicio +${Math.min(newLevel * 2, 30)}% XP` },
    { img:"/ui/medals/medal-gold.png",        text:`Misiones de dificultad Nivel ${newLevel} desbloqueadas` },
    { img:"/ui/shop/icons/shop-coin-stack.png", text:"Bonus de monedas diarias aumentado" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <motion.div
        key="lu-overlay"
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        exit={{ opacity:0 }}
        transition={{ duration:.35 }}
        onClick={handleClick}
        style={{
          position:"fixed", inset:0, zIndex:99500,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"radial-gradient(ellipse 90% 80% at 50% 42%, #1a0540 0%, #0a0418 55%, #060210 100%)",
          overflow:"hidden",
          cursor: canDismiss ? "pointer" : "default",
          "--lu-accent": accent,
        }}
      >
        {/* Particles texture overlay */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1,
          opacity:.09, backgroundImage:`url(/ui/dashboard-particles.png)`, backgroundSize:"cover" }}/>

        {/* Scanline */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:1 }}>
          <div style={{ position:"absolute", left:0, right:0, height:3,
            background:`linear-gradient(to bottom,transparent,${accent}18,transparent)`,
            animation:"lu-scan 5s linear infinite" }}/>
        </div>

        {/* Stars */}
        {Array.from({ length:28 }).map((_,i) => (
          <div key={i} style={{
            position:"absolute",
            left:`${(i * 37.3 + 11) % 100}%`,
            top:`${(i * 53.7 + 7) % 100}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            borderRadius:"50%",
            background:"#D8C8F4",
            animation:`lu-star ${1.6 + (i % 5) * 0.4}s ease-in-out ${(i % 7) * 0.3}s infinite`,
            pointerEvents:"none", zIndex:1,
          }}/>
        ))}

        {/* Rays */}
        <div style={{ position:"absolute", top:"50%", left:"50%", zIndex:1, pointerEvents:"none" }}>
          <Rays count={14} color={P.gold}  opacity={0.07} />
          <Rays count={10} color={accent}  opacity={0.05} />
        </div>

        {/* Confetti burst */}
        <div style={{ position:"absolute", top:"42%", left:"50%", zIndex:4, pointerEvents:"none" }}>
          {Array.from({ length:44 }).map((_,i) => (
            <Particle key={i} index={i} total={44} burst={burst} />
          ))}
        </div>

        {/* Halo rings */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div key="rings"
              initial={{ opacity:0, scale:.35 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ duration:.65, ease:"easeOut" }}
              style={{ position:"absolute", top:"38%", left:"50%", zIndex:2, pointerEvents:"none" }}>
              <HaloRing size={280} color={P.gold}   width={1.5} duration={9} />
              <HaloRing size={345} color={accent}   width={1}   duration={14} reverse />
              <HaloRing size={418} color={P.blue}   width={0.8} duration={21} dashed />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content column ── */}
        <div style={{ position:"relative", zIndex:5, textAlign:"center",
          padding:"0 20px", maxWidth:480, width:"100%", display:"flex",
          flexDirection:"column", alignItems:"center", gap:0 }}>

          {/* Crown + title */}
          <AnimatePresence>
            {phase >= 0 && (
              <motion.div key="title"
                initial={{ opacity:0, y:-44, scale:.85 }}
                animate={{ opacity:1, y:0, scale:1 }}
                transition={{ type:"spring", stiffness:240, damping:20, delay:.1 }}
                style={{ marginBottom:4 }}>
                <ImgSafe src="/ui/medals/rank-crown.png"
                  style={{ width:52, height:52, filter:`drop-shadow(0 0 14px ${P.gold}cc) drop-shadow(0 0 30px ${P.gold}66)`,
                    marginBottom:8, display:"block", margin:"0 auto 8px" }} />
                <div style={{
                  fontFamily:"'Orbitron',sans-serif", fontSize:"clamp(10px,2.6vw,13px)",
                  fontWeight:900, letterSpacing:".22em", color:accent, textTransform:"uppercase",
                  textShadow:`0 0 22px ${accent}, 0 0 44px ${accent}66`,
                }}>
                  ¡ Subiste de Nivel !
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level badge */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div key="levelnum"
                initial={{ opacity:0, scale:.3 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ type:"spring", stiffness:280, damping:18 }}
                style={{ position:"relative", display:"inline-block", marginBottom:2 }}>

                {/* Class crest background */}
                <img src={classMeta.crest} alt=""
                  style={{ position:"absolute", top:"50%", left:"50%", width:190, height:190,
                    objectFit:"contain", imageRendering:"pixelated",
                    animation:"lu-crestSpin 4s ease-in-out infinite",
                    pointerEvents:"none", zIndex:0 }}
                  onError={e => { e.currentTarget.style.display="none"; }} />

                {/* Gold glow blob */}
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
                  width:240, height:240, borderRadius:"50%",
                  background:`radial-gradient(circle, ${P.gold}2a 0%, transparent 72%)`,
                  pointerEvents:"none" }}/>

                {/* Class accent glow blob */}
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
                  width:200, height:200, borderRadius:"50%",
                  background:`radial-gradient(circle, ${accent}1a 0%, transparent 65%)`,
                  pointerEvents:"none" }}/>

                {/* The big number */}
                <div style={{
                  fontFamily:"'Orbitron',sans-serif",
                  fontSize:"clamp(100px,18vw,138px)",
                  fontWeight:900,
                  color:P.gold,
                  lineHeight:1,
                  position:"relative", zIndex:2,
                  animation: phase >= 2
                    ? "lu-glow 2.2s ease-in-out infinite, lu-float 3.2s ease-in-out infinite"
                    : "lu-numPop .5s cubic-bezier(.22,1.3,.5,1) both",
                  textShadow:`0 0 32px ${P.gold}, 0 0 80px ${P.gold}88`,
                }}>
                  {displayLevel}
                </div>

                {/* NIVEL label */}
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, fontWeight:700,
                  letterSpacing:".4em", color:P.muted, marginTop:-6, textTransform:"uppercase",
                  position:"relative", zIndex:2 }}>
                  NIVEL
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats + XP bar + unlocks */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div key="stats"
                initial={{ opacity:0, y:26 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:.52, ease:"easeOut" }}
                style={{ width:"100%", marginTop:18 }}>

                {/* XP earned badge */}
                <div style={{ display:"inline-flex", alignItems:"center", gap:10,
                  background:`linear-gradient(135deg, ${P.gold}1a, ${accent}0f)`,
                  border:`1px solid ${P.gold}44`,
                  borderRadius:24, padding:"8px 20px", marginBottom:18,
                  animation:"lu-tagPop .4s cubic-bezier(.34,1.56,.64,1) both" }}>
                  <ImgSafe src="/ui/icons/stat-xp.png"
                    style={{ width:22, height:22, filter:`drop-shadow(0 0 8px ${P.gold}cc)` }} />
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:17,
                    color:P.gold, letterSpacing:".04em" }}>
                    +{xpGained} XP ganados
                  </span>
                </div>

                {/* XP progress bar */}
                <div style={{ marginBottom:20, textAlign:"left" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <ImgSafe src="/ui/icons/stat-xp.png"
                        style={{ width:14, height:14, opacity:.7 }} />
                      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9,
                        color:P.muted, letterSpacing:".1em" }}>PROGRESO NIVEL {newLevel}</span>
                    </div>
                    <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9,
                      color:accent }}>0 / {xpNext ?? "??"} XP</span>
                  </div>
                  {/* Bar track */}
                  <div style={{ position:"relative", height:14, background:"#170930",
                    borderRadius:7, overflow:"hidden", border:`1px solid ${accent}33` }}>
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:"5%" }}
                      transition={{ duration:1.3, delay:.15, ease:"easeOut" }}
                      style={{ height:"100%", borderRadius:7,
                        background:`linear-gradient(90deg, ${accent}88, ${P.gold}, ${accent})`,
                        boxShadow:`0 0 14px ${P.gold}88, 0 0 28px ${accent}44`,
                        position:"relative", overflow:"hidden" }}>
                      {/* Shine sweep */}
                      <div style={{ position:"absolute", top:0, bottom:0, width:"50%",
                        background:"linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)",
                        animation:"lu-barShine 2s ease-in-out .6s infinite" }}/>
                    </motion.div>
                  </div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, color:P.muted,
                    marginTop:6, textAlign:"right" }}>
                    Nivel {newLevel - 1} →{" "}
                    <span style={{ color:P.gold, fontWeight:700, textShadow:`0 0 8px ${P.gold}` }}>
                      Nivel {newLevel}
                    </span>{" "}✓
                  </div>
                </div>

                {/* Unlock card */}
                <div style={{
                  position:"relative", overflow:"hidden",
                  background:`linear-gradient(135deg, ${P.card}ee, #0e062088)`,
                  border:`1px solid ${accent}33`,
                  borderRadius:16,
                  padding:"16px 18px",
                  marginBottom:26,
                  backdropFilter:"blur(12px)",
                  boxShadow:`0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04)`,
                }}>
                  {/* Top highlight line */}
                  <div style={{ position:"absolute", top:0, left:20, right:20, height:1,
                    background:`linear-gradient(90deg,transparent,${accent}66,transparent)` }}/>

                  {/* Card header */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14,
                    paddingBottom:10, borderBottom:`1px solid ${accent}22` }}>
                    <ImgSafe src={classMeta.crest}
                      style={{ width:28, height:28, filter:`drop-shadow(0 0 8px ${accent}88)` }} />
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9,
                      fontWeight:700, letterSpacing:".18em", color:accent, textTransform:"uppercase" }}>
                      Recompensas desbloqueadas
                    </div>
                  </div>

                  {/* Unlock rows */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {UNLOCKS.map(({ img, text }, idx) => (
                      <div key={text}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 10px",
                          borderRadius:10, background:`${accent}08`,
                          border:`1px solid ${accent}18`,
                          animation:`lu-rowIn .35s ease ${.1 + idx * .08}s both`,
                        }}>
                        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                          background:`linear-gradient(135deg,${accent}22,${P.gold}11)`,
                          border:`1px solid ${accent}33`,
                          display:"grid", placeItems:"center" }}>
                          <ImgSafe src={img}
                            style={{ width:22, height:22, filter:`drop-shadow(0 0 6px ${accent}99)` }} />
                        </div>
                        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14,
                          fontWeight:600, color:P.text, textAlign:"left", lineHeight:1.35 }}>
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue button */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.button
                key="btn"
                initial={{ opacity:0, scale:.8, y:16 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0 }}
                transition={{ type:"spring", stiffness:300, damping:22 }}
                onClick={canDismiss ? (e => { e.stopPropagation(); handleClick(); }) : undefined}
                style={{
                  position:"relative", overflow:"hidden",
                  fontFamily:"'Orbitron',sans-serif",
                  fontSize:12, fontWeight:900, letterSpacing:".22em",
                  background:`linear-gradient(135deg, ${accent}, ${P.purple} 50%, ${accent}cc)`,
                  border:`1px solid ${accent}88`,
                  color:"#fff",
                  padding:"16px 0",
                  width:"100%",
                  maxWidth:360,
                  borderRadius:8,
                  cursor: canDismiss ? "pointer" : "default",
                  animation: canDismiss ? "lu-btnPulse 1.9s ease-in-out infinite" : "none",
                  boxShadow:`0 6px 32px ${accent}55, 0 2px 0 ${accent}33`,
                  opacity: canDismiss ? 1 : 0.55,
                  transition:"transform .15s ease, box-shadow .15s ease",
                  textTransform:"uppercase",
                }}
                onMouseEnter={e => { if (canDismiss) {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.025)";
                  e.currentTarget.style.boxShadow = `0 12px 44px ${accent}88, 0 2px 0 ${accent}44`;
                }}}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = `0 6px 32px ${accent}55, 0 2px 0 ${accent}33`;
                }}
              >
                {/* Shimmer sweep */}
                <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                  <div style={{ position:"absolute", top:0, bottom:0, width:"40%",
                    background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",
                    animation:"lu-shimmer 2.2s ease-in-out infinite" }}/>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, position:"relative" }}>
                  <ImgSafe src="/ui/medals/medal-gold.png"
                    style={{ width:20, height:20, filter:`drop-shadow(0 0 6px ${P.gold}cc)` }} />
                  ¡ Continuar !
                  <ImgSafe src="/ui/medals/medal-gold.png"
                    style={{ width:20, height:20, filter:`drop-shadow(0 0 6px ${P.gold}cc)` }} />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Waiting hint */}
          {!canDismiss && phase >= 1 && (
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:7, color:P.dim,
              letterSpacing:".1em", marginTop:20, opacity:.5 }}>· · ·</div>
          )}
        </div>

        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:130,
          background:"linear-gradient(to top,#060210,transparent)",
          pointerEvents:"none", zIndex:2 }}/>
      </motion.div>
    </>
  );
}
