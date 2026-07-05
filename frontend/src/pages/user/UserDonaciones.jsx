// src/pages/user/UserDonaciones.jsx — Pixel RPG Donation Shop (Bento Grid v2)
import { useState, useEffect, useCallback, memo } from "react";
import { useLang } from "../../hooks/useLang.js";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase.js";
import { getActiveBoosts } from "../../services/api.js";
import {
  Copy, Check, Heart, Sparkles, ChevronRight,
  Zap, Star, Smartphone, QrCode, Landmark, AlertCircle,
  Leaf, Swords, Crown, Shield,
} from "lucide-react";

// ── Admin-config palette (matches dashboard) ───────────────────
const SC = {
  bg: P.bg0,    bg1: P.bg1,   bg2: P.bg2,
  border: P.line, borderL: P.line,
  accent: P.accent, accentL: P.accent2,
  gold: P.gold, text: P.text, muted: P.muted,
  blue: "#4CC9F0", green: "#6BC87A", red: "#E05C8A",
  navy: P.navy, navyL: P.line,
  white: P.text, mutedL: P.mutedL, orange: P.accent,
  card: P.bg1, panel: P.bg2, purple: P.accent,
};
// ── Typography ─────────────────────────────────────────────────
const raj = (s, w = 400) => sans(s, w);
const orb = (s, w = 500) => mono(s, w);
const rpx = (s) => mono(s, 700);

// ── Glass panel helper ─────────────────────────────────────────
const glassPanel = (accent = SC.navy) => ({
  background: "rgba(10,14,26,0.96)",
  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${accent}55`,
  boxShadow: `inset 0 0 0 1px rgba(201,176,55,0.05), 0 8px 32px rgba(0,0,0,.65)`,
  borderRadius: 10, position: "relative", overflow: "hidden",
});

// ── Pixel segment bar ──────────────────────────────────────────
function PixelBar({ val, max, color, segments=22 }) {
  const filled = Math.round((Math.min(val, max) / max) * segments);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {Array.from({ length:segments }, (_,i) => (
        <div key={i} style={{
          width:9, height:9, borderRadius:1,
          background: i < filled
            ? `linear-gradient(180deg,${color}dd,${color}88)`
            : `${SC.navy}99`,
          boxShadow: i < filled ? `0 0 4px ${color}55` : "none",
          transition:"background .3s",
        }}/>
      ))}
    </div>
  );
}

// ── Panel title strip (admin SectionTitle style) ───────────────
function PanelTitle({ icon:Icon, label, color=SC.gold, badge, sub }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 14px", borderBottom:`1px solid rgba(26,51,84,.6)`,
      flexShrink:0, position:"relative", zIndex:2,
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,${color}88,${color}22,transparent)` }}/>
      <div style={{ width:22, height:22, borderRadius:4, flexShrink:0,
        background:`${color}18`, border:`1px solid ${color}44`,
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={11} color={color}/>
      </div>
      <div style={{ flex:1 }}>
        <span style={{ ...rpx(7), color, letterSpacing:".06em" }}>{label}</span>
        {sub && <div style={{ ...raj(10,500), color:SC.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {badge && (
        <span style={{ ...rpx(6), color:SC.bg, background:color, borderRadius:3, padding:"2px 8px" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── RPG Tier Card (shop item) ──────────────────────────────────
const TierCard = memo(function TierCard({
  Icon, name, amount, amountSub, perks, color,
  delay, selected, onSelect, featured, rank,
}) {
  const { t } = useLang();
  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ scale:1.02, y:-3 }}
      whileTap={{ scale:.97 }}
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, type:"spring", stiffness:240, damping:22 }}
      style={{
        ...glassPanel(selected ? color : SC.navy),
        border:`1px solid ${selected ? color : color+"33"}`,
        cursor:"pointer", height:"100%",
        display:"flex", flexDirection:"column",
        boxShadow: selected
          ? `0 0 32px ${color}44, 0 8px 32px rgba(0,0,0,.6), inset 0 0 0 1px ${color}22`
          : `0 6px 24px rgba(0,0,0,.5)`,
        transition:"border .22s, box-shadow .22s",
      }}
    >
      {/* ╔══════════════════════════════════════════════════════╗
          ║ [STATIC_PNG_SLOT] /ui/tier-frame-{rank}.png          ║
          ║ Pixel art border frame per tier (3 color variants)   ║
          ╚══════════════════════════════════════════════════════╝ */}
      <img src={`/ui/tier-frame-${rank}.png`} alt=""
        style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"fill", opacity:.12, pointerEvents:"none", zIndex:0 }}
        onError={e => e.currentTarget.style.display="none"}/>

      {/* ╔══════════════════════════════════════════════════════╗
          ║ [STATIC_PNG_SLOT] /ui/tier-bg-{rank}.png             ║
          ║ Subtle dark texture overlay for each card interior   ║
          ╚══════════════════════════════════════════════════════╝ */}
      <img src={`/ui/tier-bg-${rank}.png`} alt=""
        style={{ position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", opacity:.06, pointerEvents:"none",
          mixBlendMode:"screen", zIndex:0 }}
        onError={e => e.currentTarget.style.display="none"}/>

      {/* Top accent line */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,transparent,${color}aa,${color}ff,${color}aa,transparent)`,
        zIndex:3 }}/>

      {/* Header */}
      <div style={{
        padding:"14px 14px 12px",
        background:`${color}09`,
        borderBottom:`1px solid ${color}22`,
        position:"relative", zIndex:2,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            ...rpx(9), color:SC.bg, background:color,
            borderRadius:3, width:26, height:26, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 10px ${color}44`,
          }}>{rank}</div>

          <div style={{
            width:38, height:38, borderRadius:7, flexShrink:0,
            background:`${color}18`, border:`1px solid ${color}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 14px ${color}22`,
          }}>
            <Icon size={19} color={color}/>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...rpx(8), color, letterSpacing:".04em" }}>{name}</div>
            {featured && (
              <div style={{ display:"flex", alignItems:"center", gap:4,
                ...raj(9,700), color:SC.gold, marginTop:3 }}>
                <Star size={8} color={SC.gold} fill={SC.gold}/>
                {t("do.tier.popular")}
              </div>
            )}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                style={{ width:22, height:22, borderRadius:"50%", background:color, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:`0 0 12px ${color}66` }}>
                <Check size={12} color={SC.bg}/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Price */}
      <div style={{ padding:"14px 14px 12px",
        borderBottom:`1px solid rgba(26,51,84,.4)`,
        position:"relative", zIndex:2 }}>
        <div style={{ ...orb(featured ? 24 : 20, 900), color:SC.gold,
          textShadow:`0 0 18px ${SC.gold}55` }}>{amount}</div>
        {amountSub && (
          <div style={{ ...raj(11,500), color:SC.muted, marginTop:3 }}>{amountSub}</div>
        )}
      </div>

      {/* Perks */}
      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column",
        gap:9, flex:1, position:"relative", zIndex:2 }}>
        {perks.map((p, i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
            <ChevronRight size={10} color={color} style={{ flexShrink:0, marginTop:2 }}/>
            <span style={{ ...raj(12,500), color:SC.mutedL }}>{p}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

// ── Copy button ────────────────────────────────────────────────
function CopyBtn({ text }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard.writeText(text || "")
    .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
    .catch(() => {});
  return (
    <motion.button whileTap={{ scale:.92 }} onClick={copy} style={{
      display:"flex", alignItems:"center", gap:6,
      background: copied ? `${SC.green}18` : `${SC.orange}14`,
      border:`1px solid ${copied ? SC.green : SC.orange}44`,
      borderRadius:6, color: copied ? SC.green : SC.orange,
      padding:"4px 10px", cursor:"pointer", transition:"all .2s",
      ...raj(11,700),
    }}>
      {copied ? <Check size={11} color={SC.green}/> : <Copy size={11} color={SC.orange}/>}
      {copied ? t("do.copy.done") : t("do.copy.btn")}
    </motion.button>
  );
}

// ── Bank field row ─────────────────────────────────────────────
function BankField({ label, value, highlight }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      flexWrap:"wrap", gap:8, padding:"9px 14px",
      borderBottom:`1px solid rgba(26,51,84,.4)` }}>
      <div>
        <div style={{ ...rpx(5), color:SC.muted, marginBottom:3 }}>{label}</div>
        <div style={{ ...raj(13,700), color: highlight ? SC.gold : SC.white,
          textShadow: highlight ? `0 0 10px ${SC.gold}44` : "none" }}>{value}</div>
      </div>
      <CopyBtn text={value}/>
    </div>
  );
}

// ── Cooldown SVG ring ──────────────────────────────────────────
const COOLDOWN_MS  = 20 * 60 * 1000;
const LS_LAST_KEY  = "fv_apoyar_last";
const LS_COUNT_KEY = "fv_apoyar_count";

function CooldownDisplay({ remainMs, maxMs = COOLDOWN_MS }) {
  const { t } = useLang();
  const mins = Math.floor(remainMs / 60000);
  const secs = Math.floor((remainMs % 60000) / 1000);
  const pct  = 1 - remainMs / Math.max(1, maxMs);
  const r = 20, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px",
      background:`${SC.orange}0a`, border:`1px solid ${SC.orange}22`, borderRadius:8 }}>
      <svg width={48} height={48} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
        <circle cx={24} cy={24} r={r} fill="none" stroke={`${SC.orange}22`} strokeWidth={3}/>
        <circle cx={24} cy={24} r={r} fill="none" stroke={SC.orange} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset .9s linear" }}/>
      </svg>
      <div>
        <div style={{ ...orb(14,900), color:SC.orange }}>
          {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
        </div>
        <div style={{ ...raj(11,500), color:SC.muted, marginTop:2 }}>{t("do.cooldown.next")}</div>
      </div>
    </div>
  );
}

// ── Floating hearts ────────────────────────────────────────────
function FloatingHeart({ id, onDone }) {
  const x = (Math.random() - 0.5) * 180;
  return (
    <motion.div key={id}
      initial={{ opacity:1, y:0, x:0, scale:.8 }}
      animate={{ opacity:0, y:-130, x, scale:1.4 }}
      transition={{ duration:1.4, ease:"easeOut" }}
      onAnimationComplete={onDone}
      style={{ position:"absolute", top:"50%", left:"50%", pointerEvents:"none", zIndex:10 }}>
      <Heart size={16} color={SC.orange} fill={`${SC.orange}99`}/>
    </motion.div>
  );
}

// ── CSS animations ─────────────────────────────────────────────
const DON_CSS = `
/* === fvd: ForgeVenture Donate — Gothic JRPG === */

:root {
  --fvd-bg:    #07060c; --fvd-bg1:  #161122; --fvd-bg2:  #0b0814;
  --fvd-inner: #0a0712; --fvd-slot: #14101e;
  --fvd-border:#2a1f3d; --fvd-border2:#4a3a18;
  --fvd-gold:  #c89b3c; --fvd-gold-b:#f4cc78; --fvd-gold-s:#d4a44a;
  --fvd-text:  #e8dcc4; --fvd-dim:  #9d8fa8; --fvd-muted: #5e5269;
  --fvd-parch: #ead7ad; --fvd-fire: #ff7a1f; --fvd-ember: #ffb15c;
  --fvd-crim:  #d33b4d;
  --fvd-xp1:#5a189a; --fvd-xp2:#9d4edd; --fvd-xp3:#c77dff;
  /* tier colors */
  --tc-bronze:#c87a3c; --ta-bronze:rgba(200,122,60,0.5);
  --tc-silver:#c5cad6; --ta-silver:rgba(197,202,214,0.5);
  --tc-gold:  #f4cc78; --ta-gold:  rgba(244,204,120,0.55);
  --tc-purple:#c08aff; --ta-purple:rgba(192,138,255,0.55);
  --tc-red:   #e0455e; --ta-red:   rgba(224,69,94,0.55);
}

@keyframes fvd-rise { 0%{transform:translateY(100vh);opacity:0} 10%{opacity:.9} 90%{opacity:.9} 100%{transform:translateY(-10vh) translateX(40px);opacity:0} }
@keyframes fvd-flicker { 100%{transform:scaleY(1.15) scaleX(0.9)} }
@keyframes fvd-heartbeat { 0%,100%{transform:scale(1)} 30%{transform:scale(1.25)} }
@keyframes fvd-spin { to{transform:rotate(360deg)} }
@keyframes fvd-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes fvd-shine { from{left:-100%} to{left:140%} }
@keyframes fvd-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes fvd-row-in { 0%{transform:translateX(-20px);opacity:0;background:rgba(244,204,120,0.15)} 100%{transform:translateX(0);opacity:1} }
@keyframes fvd-pulse-dot { 50%{opacity:.4} }
@keyframes fvd-toast-in  { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes fvd-toast-out { to{transform:translateY(-10px);opacity:0} }

.fvd-scroll::-webkit-scrollbar       { width:3px; }
.fvd-scroll::-webkit-scrollbar-track { background:transparent; }
.fvd-scroll::-webkit-scrollbar-thumb { background:#2a1f3d; border-radius:2px; }

/* BG */
.fvd-bg-layer { position:fixed; inset:0; z-index:0; pointer-events:none;
  background:radial-gradient(ellipse 70% 50% at 50% 20%,rgba(120,40,180,0.18),transparent 60%),
             radial-gradient(ellipse 80% 50% at 50% 110%,rgba(255,110,30,0.10),transparent 55%),
             linear-gradient(180deg,#08060f,#05040a); }
.fvd-vignette { position:fixed; inset:0; z-index:0; pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.85) 100%); }
.fvd-scanlines { position:fixed; inset:0; z-index:1; pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0 1px,transparent 1px 3px);
  mix-blend-mode:overlay; opacity:0.6; }
.fvd-embers { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.fvd-ember  { position:absolute; bottom:-10px; width:3px; height:3px; border-radius:50%;
  background:var(--fvd-ember); box-shadow:0 0 6px var(--fvd-fire);
  animation:fvd-rise linear infinite; opacity:0; }

/* ROOT */
.fvd-root { position:relative; z-index:2; min-height:calc(100vh - 64px); }
.fvd-wrapper {
  max-width:1560px; margin:0 auto; padding:16px;
  display:grid;
  grid-template-columns:280px 1fr 320px;
  grid-template-rows:auto 1fr auto;
  gap:12px; min-height:calc(100vh - 64px);
}
.fvd-top-bar  { grid-column:1/4; display:grid; grid-template-columns:280px 1fr auto; gap:12px; }
.fvd-left-col { grid-column:1; display:flex; flex-direction:column; gap:12px; }
.fvd-center-col { grid-column:2; display:flex; flex-direction:column; gap:12px; min-width:0; }
.fvd-right-col  { grid-column:3; display:flex; flex-direction:column; gap:12px; }
.fvd-bottom-nav { grid-column:1/4; }

/* PANEL */
.fvd-panel {
  position:relative; overflow:hidden;
  background:linear-gradient(180deg,var(--fvd-bg1),var(--fvd-bg2));
  border:2px solid var(--fvd-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.06),
             0 0 0 3px #050308,0 0 0 4px var(--fvd-border2),0 6px 24px rgba(0,0,0,.6);
  padding:16px;
}
.fvd-panel::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvd-gold); top:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvd-panel::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvd-gold); top:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvd-corners { position:absolute; inset:0; pointer-events:none; }
.fvd-corners::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvd-gold); bottom:4px; left:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }
.fvd-corners::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvd-gold); bottom:4px; right:4px; z-index:2; box-shadow:0 0 0 1px #1a1208; }

.fvd-panel-head {
  display:flex; align-items:center; justify-content:center; gap:10px;
  color:var(--fvd-gold-b); font-size:9px; letter-spacing:1px;
  padding:6px 0 10px; margin:-4px -4px 12px;
  text-shadow:0 0 8px rgba(244,204,120,.35);
  border-bottom:1px dashed rgba(200,155,60,.25);
}
.fvd-panel-head .fvd-deco { color:var(--fvd-gold); opacity:.6; font-size:8px; }

/* XP BAR */
.fvd-bar { height:10px; background:#050308; border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d,inset 0 1px 0 rgba(255,255,255,.04);
  position:relative; overflow:hidden; }
.fvd-bar.tall { height:14px; }
.fvd-bar-fill { height:100%;
  background:linear-gradient(180deg,var(--fvd-xp3),var(--fvd-xp1));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -2px 0 rgba(0,0,0,.3); }

/* BRAND / TOP BAR */
.fvd-brand { padding:10px 16px; display:flex; align-items:center; gap:12px; }
.fvd-brand-mark { width:28px; height:28px; flex-shrink:0;
  background:conic-gradient(from 45deg,var(--fvd-gold) 25%,transparent 0 50%,var(--fvd-gold) 0 75%,transparent 0);
  border:2px solid var(--fvd-gold); transform:rotate(45deg);
  box-shadow:0 0 12px rgba(244,204,120,.4); }
.fvd-brand-text { font-size:11px; letter-spacing:1.5px; color:var(--fvd-gold-b);
  text-shadow:0 0 8px rgba(244,204,120,.4); }
.fvd-brand-sub  { font-size:7px; color:var(--fvd-dim); margin-top:4px; letter-spacing:1px; }

.fvd-page-title { padding:12px 18px; text-align:center; display:flex; flex-direction:column; justify-content:center; }
.fvd-page-h1 { font-size:18px; color:var(--fvd-fire); letter-spacing:4px;
  text-shadow:0 0 16px rgba(255,122,31,.5); margin-bottom:6px; }
.fvd-page-sub { font-family:'VT323',monospace; font-size:16px;
  color:var(--fvd-dim); letter-spacing:1.5px; }

.fvd-top-right { display:flex; align-items:center; gap:8px; padding:10px 14px; }
.fvd-currency { display:flex; align-items:center; gap:8px; padding:8px 10px;
  background:var(--fvd-inner); border:2px solid var(--fvd-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.08);
  font-size:9px; color:var(--fvd-parch); }
.fvd-currency .fvd-ic { width:14px; height:14px; display:inline-block; flex-shrink:0; }
.fvd-ic-gold   { background:radial-gradient(circle at 35% 30%,#ffe28a,var(--fvd-gold) 60%,#6e4a13);
  border:1px solid #2a1a06; border-radius:50%; }
.fvd-ic-gem    { background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg);
  border:1px solid #1a0a2a; width:11px !important; height:11px !important; }
.fvd-ic-energy { background:linear-gradient(180deg,#fff099,#ff9a1f);
  clip-path:polygon(40% 0,100% 0,60% 45%,100% 45%,20% 100%,50% 55%,0 55%); }
.fvd-gear-btn { width:36px; height:36px; background:var(--fvd-inner); border:2px solid var(--fvd-border);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:var(--fvd-dim); font-size:14px; }
.fvd-gear-btn:hover { color:var(--fvd-gold-b); border-color:var(--fvd-gold-s); }

/* PROFILE */
.fvd-profile-top { display:flex; align-items:center; gap:12px;
  padding-bottom:10px; border-bottom:1px dashed rgba(200,155,60,.2); margin-bottom:12px; }
.fvd-avatar-frame { width:64px; height:64px; border:3px solid var(--fvd-gold);
  background:linear-gradient(135deg,rgba(157,78,221,.35),rgba(20,15,40,.9)),var(--fvd-inner);
  box-shadow:inset 0 0 0 1px #000,0 0 14px rgba(157,78,221,.3);
  display:flex; align-items:center; justify-content:center;
  position:relative; flex-shrink:0; overflow:hidden; }
.fvd-avatar-frame::before { content:""; position:absolute; width:4px; height:4px;
  background:var(--fvd-gold); top:-3px; left:-3px;
  box-shadow:64px 0 0 var(--fvd-gold),0 64px 0 var(--fvd-gold),64px 64px 0 var(--fvd-gold); }
.fvd-ph-icon { width:44px; height:44px; border:2px solid rgba(244,204,120,.4);
  display:flex; align-items:center; justify-content:center;
  font-family:'VT323',monospace; font-size:13px; color:var(--fvd-gold-s); }
.fvd-player-name  { font-size:12px; color:var(--fvd-gold-b); letter-spacing:1px;
  text-shadow:0 0 6px rgba(244,204,120,.35); margin-bottom:6px; }
.fvd-player-class { font-size:7px; color:#c08aff; letter-spacing:1.2px; margin-bottom:8px; }
.fvd-level-pill   { display:inline-flex; align-items:center; gap:6px;
  font-size:8px; color:var(--fvd-parch); }
.fvd-crest { width:24px; height:28px; background:linear-gradient(180deg,#2a1a4a,#160a26);
  border:2px solid var(--fvd-gold);
  clip-path:polygon(0 0,100% 0,100% 75%,50% 100%,0 75%);
  display:flex; align-items:center; justify-content:center;
  color:var(--fvd-gold-b); font-size:11px; line-height:1; padding-bottom:3px; }
.fvd-xp-row { display:flex; justify-content:space-between; align-items:baseline;
  font-size:7px; color:var(--fvd-dim); margin-bottom:6px; }
.fvd-xp-val { color:var(--fvd-xp3); font-family:'VT323',monospace; font-size:13px; }

/* STATS */
.fvd-stat { display:grid; grid-template-columns:14px 1fr;
  align-items:center; gap:10px; margin-bottom:11px; }
.fvd-stat:last-of-type { margin-bottom:4px; }
.fvd-stat-glyph { width:14px; height:14px; }
.fvd-glyph-heart  { background:#e0455e; clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%); }
.fvd-glyph-shield { background:#ffb13a; clip-path:polygon(50% 0,100% 20%,100% 65%,50% 100%,0 65%,0 20%); }
.fvd-glyph-boot   { background:#8ac926; clip-path:polygon(0 0,60% 0,60% 60%,100% 60%,100% 100%,0 100%); }
.fvd-glyph-scroll { background:#c08aff; }
.fvd-glyph-brain  { background:#4cc9f0; border-radius:50% 50% 40% 40%; }
.fvd-stat-row-name { display:flex; justify-content:space-between;
  font-size:8px; color:var(--fvd-parch); letter-spacing:.5px; margin-bottom:4px; }
.fvd-stat-val  { color:var(--fvd-gold-b); }
.fvd-stat-bar  { height:8px; background:#050308; border:1px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d; position:relative; overflow:hidden; }
.fvd-stat-fill { height:100%; box-shadow:inset 0 1px 0 rgba(255,255,255,.3); }
.fvd-stat-fill::after { content:""; position:absolute; inset:0;
  background:repeating-linear-gradient(90deg,transparent 0 5px,rgba(0,0,0,.18) 5px 6px); }
.fvd-fill-str { background:linear-gradient(180deg,#ff6b80,#e0455e); width:78%; }
.fvd-fill-sta { background:linear-gradient(180deg,#ffcd6a,#ffb13a); width:64%; }
.fvd-fill-spd { background:linear-gradient(180deg,#b3e070,#8ac926); width:52%; }
.fvd-fill-dis { background:linear-gradient(180deg,#d8a8ff,#c08aff); width:86%; }
.fvd-fill-men { background:linear-gradient(180deg,#8addf5,#4cc9f0); width:71%; }

/* STREAK */
.fvd-streak-row { display:flex; align-items:center; gap:14px; margin-bottom:10px; }
.fvd-streak-num { font-size:22px; color:var(--fvd-gold-b);
  text-shadow:0 0 10px rgba(244,204,120,.4); line-height:1; }
.fvd-streak-lab { font-size:8px; color:var(--fvd-dim); letter-spacing:1.5px; display:block; margin-top:4px; }
.fvd-streak-flames { display:flex; gap:4px; flex-wrap:wrap; }
.fvd-flame { width:14px; height:18px;
  background:radial-gradient(circle at 50% 70%,var(--fvd-fire) 30%,#ffd24a 60%,transparent);
  clip-path:polygon(50% 0,80% 30%,100% 60%,80% 100%,20% 100%,0 60%,20% 30%);
  filter:drop-shadow(0 0 4px var(--fvd-fire));
  animation:fvd-flicker .6s ease-in-out infinite alternate; }
.fvd-flame.dim { background:var(--fvd-muted); filter:none; animation:none; opacity:.4; }
.fvd-streak-msg { font-family:'VT323',monospace; font-size:14px;
  color:#8ac926; letter-spacing:.5px; text-align:center; }

/* GOAL */
.fvd-goal-top { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px; }
.fvd-goal-raised { font-size:13px; color:var(--fvd-gold-b);
  text-shadow:0 0 8px rgba(244,204,120,.35); }
.fvd-goal-target { font-family:'VT323',monospace; font-size:15px; color:var(--fvd-dim); }
.fvd-goal-bar { height:18px; background:#050308; border:2px solid #000;
  box-shadow:inset 0 0 0 1px #2a1f3d; position:relative; overflow:hidden; }
.fvd-goal-fill { height:100%;
  background:linear-gradient(180deg,#ffd87a,var(--fvd-fire) 60%,#b3361f);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -3px 0 rgba(0,0,0,.3);
  transition:width .8s cubic-bezier(.2,.8,.2,1); }
.fvd-goal-meta { display:flex; justify-content:space-between; margin-top:8px;
  font-size:7px; color:var(--fvd-dim); letter-spacing:1px; }
.fvd-goal-v { color:var(--fvd-gold-b); font-family:'VT323',monospace; font-size:13px; }

/* TIERS */
.fvd-tiers-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:12px; }
.fvd-tier-card {
  position:relative;
  background:linear-gradient(180deg,var(--fvd-bg1),var(--fvd-bg2));
  border:2px solid var(--tc,var(--fvd-border));
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.04),0 0 0 2px #050308;
  padding:14px 8px; cursor:pointer;
  transition:transform .18s,box-shadow .18s;
  display:flex; flex-direction:column; align-items:center; gap:8px;
}
.fvd-tier-card:hover { transform:translateY(-4px);
  box-shadow:inset 0 0 0 1px var(--tc),0 0 0 2px #050308,0 0 20px var(--ta); }
.fvd-tier-card.active {
  box-shadow:inset 0 0 0 1px var(--tc),0 0 0 2px #050308,0 0 26px var(--ta);
  background:linear-gradient(180deg,rgba(244,204,120,.08),var(--fvd-bg2));
}
.fvd-tier-card.active::before { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:36%; height:3px;
  background:var(--tc); box-shadow:0 0 10px var(--tc); }
.fvd-tier-name { font-size:9px; color:var(--tc); letter-spacing:1.2px; text-shadow:0 0 8px var(--ta); }
.fvd-tier-medal { width:64px; height:64px; position:relative;
  display:flex; align-items:center; justify-content:center; }
.fvd-tier-ring { position:absolute; inset:0; border-radius:50%;
  background:radial-gradient(circle at 38% 30%,rgba(255,255,255,.12),var(--tc) 45%,rgba(0,0,0,.5));
  border:3px solid var(--tc); box-shadow:0 0 14px var(--ta),inset 0 0 0 2px rgba(0,0,0,.3); }
.fvd-tier-ring::after { content:""; position:absolute; inset:22%; border-radius:50%;
  background:radial-gradient(circle at 50% 40%,rgba(0,0,0,.5),#1a1208);
  border:1px solid rgba(0,0,0,.5); }
.fvd-tier-star { position:relative; z-index:2; width:26px; height:26px;
  background:var(--tc);
  clip-path:polygon(50% 0,64% 18%,86% 14%,82% 36%,100% 50%,82% 64%,86% 86%,64% 82%,50% 100%,36% 82%,14% 86%,18% 64%,0 50%,18% 36%,14% 14%,36% 18%);
  box-shadow:0 0 8px var(--ta); }
.fvd-tier-price { font-size:14px; color:var(--fvd-parch); letter-spacing:.5px; }
.fvd-tier-gems { display:flex; align-items:center; gap:6px;
  font-family:'VT323',monospace; font-size:15px; color:var(--fvd-xp3); letter-spacing:.5px; }
.fvd-gem-ic { width:10px; height:10px;
  background:linear-gradient(135deg,#c77dff,#5a189a); transform:rotate(45deg);
  border:1px solid #1a0a2a; display:inline-block; }

/* Tier CSS var sets */
.fvd-tc-bronze { --tc:var(--tc-bronze); --ta:var(--ta-bronze); }
.fvd-tc-silver { --tc:var(--tc-silver); --ta:var(--ta-silver); }
.fvd-tc-gold   { --tc:var(--tc-gold);   --ta:var(--ta-gold); }
.fvd-tc-purple { --tc:var(--tc-purple); --ta:var(--ta-purple); }
.fvd-tc-red    { --tc:var(--tc-red);    --ta:var(--ta-red); }

/* CUSTOM / MSG / DONATE BTN */
.fvd-custom-row { display:grid; grid-template-columns:auto 1fr auto; gap:12px;
  align-items:center; padding:12px 14px; background:var(--fvd-inner);
  border:2px solid var(--fvd-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05); margin-bottom:12px; }
.fvd-custom-row.active { border-color:var(--fvd-gold-s);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.18),0 0 12px rgba(244,204,120,.15); }
.fvd-custom-lbl { font-size:8px; color:var(--fvd-gold-b); letter-spacing:1px; }
.fvd-custom-input-wrap { display:flex; align-items:center; gap:6px; background:#050308;
  border:2px solid var(--fvd-border); box-shadow:inset 0 0 0 1px #2a1f3d; padding:8px 10px; }
.fvd-custom-input-wrap .fvd-dollar { color:var(--fvd-gold-b); font-size:12px; }
.fvd-custom-input { flex:1; background:transparent; border:0; outline:none;
  color:var(--fvd-parch); font-family:'VT323',monospace; font-size:18px;
  letter-spacing:1px; width:100%; }
.fvd-custom-gems { font-family:'VT323',monospace; font-size:14px;
  color:var(--fvd-xp3); letter-spacing:.5px; white-space:nowrap;
  display:flex; align-items:center; gap:5px; }

.fvd-msg-field { margin-bottom:14px; }
.fvd-msg-label { font-size:7px; color:var(--fvd-dim); letter-spacing:1.2px; margin-bottom:6px; }
.fvd-msg-input { width:100%; background:#050308; border:2px solid var(--fvd-border);
  box-shadow:inset 0 0 0 1px #2a1f3d; color:var(--fvd-parch);
  font-family:'VT323',monospace; font-size:16px; letter-spacing:.5px;
  padding:10px 12px; outline:none; }
.fvd-msg-input:focus { border-color:var(--fvd-gold-s); }
.fvd-msg-input::placeholder { color:var(--fvd-muted); }

.fvd-donate-btn { width:100%; font-family:'Press Start 2P',monospace; font-size:12px;
  padding:16px; background:linear-gradient(180deg,#b3361f,#6e1408);
  color:#ffe0d0; border:2px solid var(--fvd-fire);
  box-shadow:inset 0 0 0 1px rgba(255,200,160,.2),inset 0 -2px 0 rgba(0,0,0,.4),0 0 20px rgba(255,122,31,.4);
  cursor:pointer; letter-spacing:2px; text-shadow:0 1px 0 rgba(0,0,0,.5); transition:.1s;
  display:flex; align-items:center; justify-content:center; gap:12px; position:relative; overflow:hidden; }
.fvd-donate-btn:hover { background:linear-gradient(180deg,#d4451f,#8a1c0a);
  box-shadow:inset 0 0 0 1px rgba(255,200,160,.3),inset 0 -2px 0 rgba(0,0,0,.4),0 0 32px rgba(255,122,31,.7);
  transform:translateY(-1px); }
.fvd-donate-btn:active { transform:translateY(1px); }
.fvd-donate-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.fvd-btn-heart { width:14px; height:13px; background:var(--fvd-crim);
  clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%);
  box-shadow:0 0 8px rgba(220,40,40,.6); animation:fvd-heartbeat 1s ease-in-out infinite; flex-shrink:0; }
.fvd-btn-shine { position:absolute; top:0; left:-100%; width:60%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
  animation:fvd-shine 2s ease-in-out infinite; }

/* IMPACT */
.fvd-impact-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.fvd-impact-cell { display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:8px 4px; text-align:center; }
.fvd-impact-ico { width:36px; height:36px; display:flex; align-items:center; justify-content:center; }
.fvd-impact-g { width:26px; height:26px; }
.fvd-ig-heart    { background:var(--fvd-crim);
  clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%);
  box-shadow:0 0 10px rgba(220,40,40,.4); }
.fvd-ig-dumbbell { background:var(--fvd-gold-s);
  clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%);
  box-shadow:0 0 10px rgba(200,155,60,.3); }
.fvd-ig-trophy   { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(20% 0,80% 0,80% 50%,65% 70%,65% 80%,80% 80%,80% 100%,20% 100%,20% 80%,35% 80%,35% 70%,20% 50%);
  box-shadow:0 0 10px rgba(244,204,120,.4); }
.fvd-ig-people   { background:var(--fvd-gold-s);
  clip-path:polygon(20% 45%,30% 30%,40% 45%,40% 42%,50% 25%,60% 42%,60% 45%,70% 30%,80% 45%,85% 100%,15% 100%);
  box-shadow:0 0 10px rgba(200,155,60,.3); }
.fvd-ig-star     { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
  box-shadow:0 0 10px rgba(244,204,120,.4); }
.fvd-impact-txt { font-family:'VT323',monospace; font-size:12px;
  color:var(--fvd-dim); line-height:1.15; letter-spacing:.3px; }

/* RECENT DONATIONS */
.fvd-don-row { display:grid; grid-template-columns:44px 130px 1fr auto;
  gap:12px; align-items:center; padding:10px 4px;
  border-bottom:1px dashed rgba(244,204,120,.12); }
.fvd-don-row:last-child { border-bottom:0; }
.fvd-don-av { width:44px; height:44px; border:2px solid var(--tc,var(--fvd-gold-s));
  background:radial-gradient(ellipse 80% 60% at 50% 55%,var(--ta,rgba(244,204,120,.3)),transparent 70%),
             linear-gradient(180deg,#0c0612,#160a1a);
  position:relative; overflow:hidden; }
.fvd-don-av .fvd-slot { position:absolute; inset:3px; border:1px dashed rgba(244,204,120,.3);
  display:flex; align-items:center; justify-content:center;
  font-family:'VT323',monospace; font-size:16px; color:var(--tc,var(--fvd-gold-s)); }
.fvd-don-av.fvd-c-gold   { --tc:var(--tc-gold);   --ta:var(--ta-gold); }
.fvd-don-av.fvd-c-silver  { --tc:var(--tc-silver); --ta:var(--ta-silver); }
.fvd-don-av.fvd-c-purple  { --tc:var(--tc-purple); --ta:var(--ta-purple); }
.fvd-don-av.fvd-c-bronze  { --tc:var(--tc-bronze); --ta:var(--ta-bronze); }
.fvd-don-name { font-size:9px; color:var(--fvd-gold-b); letter-spacing:.8px; margin-bottom:5px; }
.fvd-don-amt  { font-family:'VT323',monospace; font-size:13px; color:#8ac926; letter-spacing:.5px; }
.fvd-don-msg  { font-family:'VT323',monospace; font-size:14px; color:var(--fvd-parch); letter-spacing:.3px; }
.fvd-don-time { font-size:7px; color:var(--fvd-dim); letter-spacing:.5px; white-space:nowrap; text-align:right; }

/* PAYMENT */
.fvd-pay-row { display:grid; grid-template-columns:32px 1fr; gap:12px;
  align-items:center; padding:10px 0; border-bottom:1px dashed rgba(244,204,120,.1); }
.fvd-pay-row:last-of-type { border-bottom:0; }
.fvd-pay-ico { width:32px; height:32px; background:var(--fvd-inner); border:2px solid var(--fvd-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.08);
  display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.fvd-pay-g2 { width:16px; height:16px; background:var(--fvd-gold-s); }
.fvd-g2-bank    { clip-path:polygon(50% 0,100% 30%,100% 38%,0 38%,0 30%,8% 42%,8% 82%,0 82%,0 92%,100% 92%,100% 82%,92% 82%,92% 42%); }
.fvd-g2-tree    { clip-path:polygon(40% 0,60% 0,60% 25%,85% 40%,85% 60%,60% 50%,60% 100%,40% 100%,40% 50%,15% 60%,15% 40%,40% 25%); }
.fvd-g2-titular { clip-path:polygon(50% 0,100% 28%,100% 36%,0 36%,0 28%,12% 44%,12% 100%,30% 100%,30% 50%,45% 50%,45% 100%,55% 100%,55% 50%,70% 50%,70% 100%,88% 100%,88% 44%); }
.fvd-g2-card    { clip-path:polygon(5% 15%,95% 15%,95% 85%,5% 85%); }
.fvd-g2-cci     { clip-path:polygon(50% 0,62% 38%,100% 38%,70% 62%,82% 100%,50% 76%,18% 100%,30% 62%,0 38%,38% 38%); }
.fvd-pay-lab { font-size:6px; color:var(--fvd-dim); letter-spacing:1.2px; margin-bottom:4px; }
.fvd-pay-val { font-family:'VT323',monospace; font-size:15px;
  color:var(--fvd-parch); letter-spacing:.5px; word-break:break-all; }

/* QR */
.fvd-qr-frame { width:150px; height:150px; margin:4px auto 12px; padding:8px;
  background:#fff; border:3px solid #c08aff; box-shadow:0 0 18px rgba(192,138,255,.4);
  position:relative; }
.fvd-qr-grid { width:100%; height:100%; display:grid;
  grid-template-columns:repeat(11,1fr); grid-template-rows:repeat(11,1fr); }
.fvd-qr-grid .q { background:#07060c; }
.fvd-qr-or { font-size:7px; color:var(--fvd-dim); letter-spacing:1px; margin-bottom:8px; text-align:center; }
.fvd-yape-key { display:block; padding:10px 14px; background:var(--fvd-inner);
  border:2px solid #c08aff; box-shadow:0 0 12px rgba(192,138,255,.25);
  color:#c08aff; font-size:9px; letter-spacing:1px;
  cursor:pointer; transition:.15s; margin-bottom:12px; text-align:center; }
.fvd-yape-key:hover { background:rgba(192,138,255,.08); box-shadow:0 0 18px rgba(192,138,255,.45); }
.fvd-secure-note { display:flex; align-items:flex-start; gap:8px;
  font-family:'VT323',monospace; font-size:13px;
  color:var(--fvd-dim); line-height:1.2; letter-spacing:.3px; }
.fvd-lock { width:12px; height:14px; flex-shrink:0; margin-top:2px; background:#8ac926;
  clip-path:polygon(20% 50%,20% 30%,35% 15%,65% 15%,80% 30%,80% 50%,95% 50%,95% 100%,5% 100%,5% 50%); }

/* MODAL */
.fvd-modal-mask { position:fixed; inset:0; background:rgba(0,0,0,.8);
  backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center;
  z-index:250; padding:20px; }
.fvd-modal { width:min(420px,100%);
  background:linear-gradient(180deg,var(--fvd-bg1),var(--fvd-bg2));
  border:2px solid var(--fvd-fire);
  box-shadow:0 0 0 3px #050308,0 0 0 4px var(--fvd-border2),0 0 50px rgba(255,122,31,.4);
  position:relative; padding:24px; text-align:center; }
.fvd-modal::before { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvd-gold); top:4px; left:4px; z-index:2; }
.fvd-modal::after  { content:""; position:absolute; width:6px; height:6px;
  background:var(--fvd-gold); top:4px; right:4px; z-index:2; }
.fvd-modal-heart { width:60px; height:56px; margin:0 auto 14px;
  background:var(--fvd-crim);
  clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%);
  box-shadow:0 0 24px rgba(220,40,40,.6); animation:fvd-heartbeat .9s ease-in-out infinite; }
.fvd-modal-h2 { font-size:13px; color:var(--fvd-fire); letter-spacing:2px;
  margin-bottom:14px; text-shadow:0 0 12px rgba(255,122,31,.5); }
.fvd-modal-amount { font-size:26px; color:var(--fvd-gold-b); letter-spacing:1px;
  text-shadow:0 0 12px rgba(244,204,120,.5); margin-bottom:6px; }
.fvd-modal-tier { font-family:'VT323',monospace; font-size:16px;
  color:var(--fvd-dim); letter-spacing:1px; margin-bottom:12px; }
.fvd-modal-detail { background:var(--fvd-inner); border:1px solid var(--fvd-border);
  padding:10px 12px; margin-bottom:14px; }
.fvd-modal-row { display:flex; justify-content:space-between; align-items:center;
  font-size:8px; color:var(--fvd-dim); letter-spacing:.8px; padding:4px 0; }
.fvd-modal-v { font-family:'VT323',monospace; font-size:14px;
  color:var(--fvd-gold-b); letter-spacing:.5px; }
.fvd-modal-v.gem { color:var(--fvd-xp3); }
.fvd-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.fvd-m-btn { font-family:'Press Start 2P',monospace; font-size:9px; padding:12px;
  cursor:pointer; letter-spacing:1.2px; transition:.1s; }
.fvd-m-btn.cancel { background:var(--fvd-inner); color:var(--fvd-dim); border:2px solid var(--fvd-border); }
.fvd-m-btn.cancel:hover { color:var(--fvd-gold-b); border-color:var(--fvd-gold-s); }
.fvd-m-btn.confirm { background:linear-gradient(180deg,#b3361f,#6e1408); color:#ffe0d0;
  border:2px solid var(--fvd-fire);
  box-shadow:inset 0 0 0 1px rgba(255,200,160,.2),inset 0 -2px 0 rgba(0,0,0,.4); }
.fvd-m-btn.confirm:hover { transform:translateY(-1px); box-shadow:inset 0 0 0 1px rgba(255,200,160,.3),0 0 18px rgba(255,122,31,.5); }

/* BOTTOM NAV */
.fvd-bottom-nav { padding:8px; display:grid; grid-template-columns:repeat(12,1fr); gap:4px; }
.fvd-nav-item { display:flex; flex-direction:column; align-items:center; gap:5px;
  padding:9px 2px 7px; background:var(--fvd-inner); border:2px solid var(--fvd-border);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.05);
  cursor:pointer; position:relative; transition:.15s; text-decoration:none; color:inherit; }
.fvd-nav-item:hover { border-color:var(--fvd-gold-s);
  box-shadow:inset 0 0 0 1px rgba(244,204,120,.18),0 0 12px rgba(244,204,120,.15);
  transform:translateY(-2px); }
.fvd-nav-item.active { border-color:var(--fvd-fire);
  box-shadow:inset 0 0 0 1px var(--fvd-fire),0 0 16px rgba(255,122,31,.35);
  background:linear-gradient(180deg,rgba(255,122,31,.08),rgba(255,122,31,.01)); }
.fvd-nav-item.active::after { content:""; position:absolute; top:-2px; left:50%;
  transform:translateX(-50%); width:30%; height:3px;
  background:var(--fvd-fire); box-shadow:0 0 10px var(--fvd-fire); }
.fvd-nav-icon { width:26px; height:26px; display:flex; align-items:center; justify-content:center; }
.fvd-ng { width:19px; height:19px; }
.fvd-ng-map      { background:linear-gradient(180deg,#d4a44a,#6e4f1f);
  clip-path:polygon(0 10%,33% 0,66% 10%,100% 0,100% 90%,66% 100%,33% 90%,0 100%); }
.fvd-ng-char     { background:linear-gradient(180deg,#b8c0ff,#4a55a0);
  clip-path:polygon(50% 0,90% 30%,90% 70%,50% 100%,10% 70%,10% 30%); }
.fvd-ng-exercise { background:#e0455e;
  clip-path:polygon(0 35%,15% 35%,15% 20%,30% 20%,30% 35%,70% 35%,70% 20%,85% 20%,85% 35%,100% 35%,100% 65%,85% 65%,85% 80%,70% 80%,70% 65%,30% 65%,30% 80%,15% 80%,15% 65%,0 65%); }
.fvd-ng-routine  { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(15% 0,85% 0,100% 15%,100% 85%,85% 100%,15% 100%,0 85%,0 15%); }
.fvd-ng-mission  { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(20% 0,80% 0,80% 50%,65% 70%,65% 80%,80% 80%,80% 100%,20% 100%,20% 80%,35% 80%,35% 70%,20% 50%); }
.fvd-ng-trophy   { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(20% 0,80% 0,85% 18%,100% 22%,95% 40%,75% 50%,65% 65%,65% 78%,80% 78%,80% 100%,20% 100%,20% 78%,35% 78%,35% 65%,25% 50%,5% 40%,0 22%,15% 18%); }
.fvd-ng-shop     { background:linear-gradient(180deg,#ffcd6a,var(--fvd-gold));
  clip-path:polygon(0 35%,15% 5%,85% 5%,100% 35%,90% 95%,10% 95%); }
.fvd-ng-chat     { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(0 0,100% 0,100% 70%,35% 70%,15% 100%,15% 70%,0 70%); }
.fvd-ng-mail     { background:linear-gradient(180deg,var(--fvd-gold-b),var(--fvd-gold));
  clip-path:polygon(0 15%,100% 15%,100% 85%,0 85%); }
.fvd-ng-bestiary { background:#d33b4d;
  clip-path:polygon(50% 0,100% 35%,85% 100%,50% 75%,15% 100%,0 35%); }
.fvd-ng-heart    { background:var(--fvd-crim);
  clip-path:polygon(50% 100%,0 38%,0 18%,25% 0,50% 22%,75% 0,100% 18%,100% 38%); }
.fvd-ng-settings { background:linear-gradient(180deg,#b8b8c8,#5a5a6a);
  clip-path:polygon(42% 0,58% 0,63% 15%,78% 8%,88% 22%,80% 37%,100% 42%,100% 58%,80% 63%,88% 78%,78% 92%,63% 85%,58% 100%,42% 100%,37% 85%,22% 92%,12% 78%,20% 63%,0 58%,0 42%,20% 37%,12% 22%,22% 8%,37% 15%); }
.fvd-nav-label { font-size:6px; letter-spacing:.5px; color:var(--fvd-dim); }
.fvd-nav-item.active .fvd-nav-label { color:var(--fvd-fire); }
`;

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function UserDonaciones() {
  const { t } = useLang();
  const [effectiveCooldownMs, setEffectiveCooldownMs] = useState(COOLDOWN_MS);

  // ── Cooldown ──
  const [totalCount, setTotalCount] = useState(() => {
    const n = parseInt(localStorage.getItem(LS_COUNT_KEY) || "0", 10);
    return isNaN(n) ? 0 : n;
  });
  const [remainMs,   setRemainMs]   = useState(0);
  const [onCooldown, setOnCooldown] = useState(false);

  const recheckCooldown = useCallback(() => {
    const last  = parseInt(localStorage.getItem(LS_LAST_KEY) || "0", 10);
    const since = Date.now() - last;
    if (since < effectiveCooldownMs) {
      setOnCooldown(true); setRemainMs(effectiveCooldownMs - since);
    } else {
      setOnCooldown(false); setRemainMs(0);
    }
  }, [effectiveCooldownMs]);

  useEffect(() => { recheckCooldown(); }, [recheckCooldown]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await getActiveBoosts(token);
        const pct = Number(res?.boosts?.find((boost) => boost.type === "cooldown_red")?.valor || 0);
        const next = Math.max(60_000, Math.round(COOLDOWN_MS * Math.max(0.2, 1 - (pct / 100))));
        if (alive) setEffectiveCooldownMs(next);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!onCooldown) return;
    const iv = setInterval(() => {
      setRemainMs(r => {
        const next = r - 1000;
        if (next <= 0) { setOnCooldown(false); clearInterval(iv); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [onCooldown]);

  // ── UI state ──
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [showThanks,     setShowThanks]     = useState(false);
  const [selectedTier,   setSelectedTier]   = useState(null);
  const [ripple,         setRipple]         = useState(false);

  useEffect(() => {
    if (document.getElementById("don-css-v7")) return;
    const s = document.createElement("style");
    s.id = "don-css-v7"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const handleApoyar = () => {
    if (onCooldown) return;
    const next = totalCount + 1;
    setTotalCount(next);
    localStorage.setItem(LS_COUNT_KEY, String(next));
    localStorage.setItem(LS_LAST_KEY, String(Date.now()));
    setFloatingHearts(h => [...h, { id: Date.now() }]);
    setRipple(true); setTimeout(() => setRipple(false), 700);
    setShowThanks(true); setTimeout(() => setShowThanks(false), 3200);
    setOnCooldown(true); setRemainMs(effectiveCooldownMs);
  };

  const GOAL    = 50;
  const goalPct = Math.min(totalCount / GOAL * 100, 100);

  const TIERS = [
    {
      Icon:Leaf, rank:"I", name:t("do.tier.0.name"), amount:t("do.tier.0.amount"),
      amountSub:t("do.tier.0.sub"), color:SC.teal, delay:.04, featured:false,
      perks:[t("do.tier.0.p1"), t("do.tier.0.p2"), t("do.tier.0.p3")],
    },
    {
      Icon:Swords, rank:"II", name:t("do.tier.1.name"), amount:t("do.tier.1.amount"),
      amountSub:t("do.tier.1.sub"), color:SC.orange, delay:.1, featured:true,
      perks:[t("do.tier.1.p1"), t("do.tier.1.p2"), t("do.tier.1.p3"), t("do.tier.1.p4")],
    },
    {
      Icon:Crown, rank:"III", name:t("do.tier.2.name"), amount:t("do.tier.2.amount"),
      amountSub:t("do.tier.2.sub"), color:SC.gold, delay:.16, featured:false,
      perks:[t("do.tier.2.p1"), t("do.tier.2.p2"), t("do.tier.2.p3")],
    },
  ];

  const BANK = {
    titular:"Andrés Cherrez", banco:"Banco Pichincha",
    tipo:"Ahorros", numero:"2203XXXXXXXX", cedula:"17XXXXXXXX",
  };

  const FV = {
    page: { hidden:{}, show:{ transition:{ staggerChildren:.07 } } },
    item: { hidden:{ opacity:0, y:18 }, show:{ opacity:1, y:0, transition:{ type:"spring", stiffness:240, damping:22 } } },
  };


  // ── Donation-specific state ───────────────────────────────────
  const [donTierIdx,  setDonTierIdx]  = useState(0);
  const [customAmt,   setCustomAmt]   = useState("");
  const [donMsg,      setDonMsg]      = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [isCustom,    setIsCustom]    = useState(false);
  const [recentDons,  setRecentDons]  = useState([
    {name:"IRONBEAST",  amt:10,  msg:"¡Vamos por más, hermanos! 💪", time:"Hace 2h",  cls:"fvd-c-gold",   ico:"☻"},
    {name:"GYM_LORD",   amt:5,   msg:"Sigamos creciendo juntos 🔥",  time:"Hace 5h",  cls:"fvd-c-silver",  ico:"♜"},
    {name:"FIT_KNIGHT", amt:25,  msg:"La disciplina es libertad ⚔",  time:"Hace 1d",  cls:"fvd-c-purple",  ico:"♞"},
    {name:"SHADOWLIFT", amt:1,   msg:"Pequeño aporte, gran cambio 🙌",time:"Hace 1d",  cls:"fvd-c-bronze",  ico:"☠"},
  ]);

  const DON_TIERS = [
    {id:"aprendiz", name:"APRENDIZ", price:1,  gems:10,  cls:"fvd-tc-bronze"},
    {id:"guerrero", name:"GUERRERO", price:5,  gems:50,  cls:"fvd-tc-silver"},
    {id:"campeon",  name:"CAMPEÓN",  price:10, gems:120, cls:"fvd-tc-gold"},
    {id:"leyenda",  name:"LEYENDA",  price:25, gems:350, cls:"fvd-tc-purple"},
    {id:"titan",    name:"TITÁN",    price:50, gems:800, cls:"fvd-tc-red"},
  ];

  const gemsForAmt = (v) => Math.round(v * 16);
  const currAmt    = isCustom
    ? (parseFloat(customAmt) || 0)
    : DON_TIERS[donTierIdx].price;
  const currGems   = isCustom
    ? gemsForAmt(currAmt)
    : DON_TIERS[donTierIdx].gems;

  const handleDonate = () => {
    if (currAmt <= 0) return;
    handleApoyar();
    setRecentDons(prev => [
      {name:"TÚ", amt:currAmt, msg:donMsg||"¡Gracias por el apoyo! ❤", time:"Ahora", cls:"fvd-c-gold", ico:"★", fresh:true},
      ...prev.slice(0,5),
    ]);
    setShowModal(false);
    setCustomAmt(""); setIsCustom(false); setDonMsg("");
  };

  const STREAKDAYS = 14;
  const flameCount = Math.min(STREAKDAYS, 7);

  // QR grid (deterministic pseudo-random)
  const qrCells = (() => {
    const n = 11; let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const inFinder = (rr,cc) => (rr<3&&cc<3)||(rr<3&&cc>=n-3)||(rr>=n-3&&cc<3);
      let on;
      if (inFinder(r,c)) {
        const lr = r<3?r:r-(n-3), lc = c<3?c:c-(n-3);
        on = (lr===0||lr===2||lc===0||lc===2);
      } else { on = rnd()>.5; }
      cells.push(on);
    }
    return cells;
  })();

  return (
    <>
      <style>{DON_CSS}</style>

      {/* BG layers */}
      <div className="fvd-bg-layer"/>
      <div className="fvd-vignette"/>
      <div className="fvd-scanlines"/>

      {/* Embers */}
      <div className="fvd-embers" aria-hidden="true">
        {Array.from({length:18},(_,i)=>(
          <div key={i} className="fvd-ember" style={{
            left:`${(i*5.5+3)%100}%`,
            animationDuration:`${6+(i%5)*1.6}s`,
            animationDelay:`${(i*.55)%10}s`,
          }}/>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showThanks && (
          <motion.div key="toast"
            initial={{opacity:0,y:-20,scale:.9}} animate={{opacity:1,y:0,scale:1}}
            exit={{opacity:0,y:-14,scale:.9}}
            style={{position:"fixed",top:20,right:20,zIndex:9999,
              background:"linear-gradient(180deg,#1a1525,#0a0712)",
              border:"2px solid #c89b3c",
              boxShadow:"0 0 0 2px #050308,0 0 24px rgba(244,204,120,.4)",
              padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div className="fvd-btn-heart"/>
            <div>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:"7px",
                color:"#c89b3c",marginBottom:3}}>
                ¡GRACIAS POR TU APOYO!
              </div>
              <div style={{fontFamily:"'VT323',monospace",fontSize:"15px",color:"#9d8fa8"}}>
                Tu apoyo mantiene viva la aventura
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating hearts */}
      <div style={{position:"fixed",top:"45%",left:"50%",pointerEvents:"none",zIndex:20}}>
        <AnimatePresence>
          {floatingHearts.map(h => (
            <FloatingHeart key={h.id} id={h.id}
              onDone={() => setFloatingHearts(fh => fh.filter(x => x.id !== h.id))}/>
          ))}
        </AnimatePresence>
      </div>

      {/* DONATE MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fvd-modal-mask"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={e => e.target===e.currentTarget && setShowModal(false)}>
            <motion.div className="fvd-modal"
              initial={{scale:.88,y:20}} animate={{scale:1,y:0}} exit={{scale:.88,y:20}}>
              <div className="fvd-modal-h2">CONFIRMAR DONACIÓN</div>
              <div className="fvd-modal-heart"/>
              <div className="fvd-modal-amount">${currAmt.toFixed(2)}</div>
              <div className="fvd-modal-tier">{isCustom?"PERSONALIZADO":DON_TIERS[donTierIdx].name}</div>
              <div className="fvd-modal-detail">
                <div className="fvd-modal-row">
                  <span>MONTO</span>
                  <span className="fvd-modal-v">${currAmt.toFixed(2)}</span>
                </div>
                <div className="fvd-modal-row">
                  <span>GEMAS DE GRACIAS</span>
                  <span className="fvd-modal-v gem">+{currGems}</span>
                </div>
                <div className="fvd-modal-row">
                  <span>MÉTODO</span>
                  <span className="fvd-modal-v">Transferencia Bancaria</span>
                </div>
                {donMsg && (
                  <div className="fvd-modal-row">
                    <span>MENSAJE</span>
                    <span className="fvd-modal-v" style={{color:"#ead7ad",maxWidth:"60%",textAlign:"right"}}>{donMsg}</span>
                  </div>
                )}
              </div>
              <div className="fvd-modal-actions">
                <button className="fvd-m-btn cancel" onClick={() => setShowModal(false)}>CANCELAR</button>
                <button className="fvd-m-btn confirm" onClick={handleDonate}>▶ DONAR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fvd-root">
        <div className="fvd-wrapper">

          {/* ═══ TOP BAR ═══ */}
          <div className="fvd-top-bar">
            <div className="fvd-panel fvd-brand">
              <span className="fvd-corners"/>
              <div className="fvd-brand-mark"/>
              <div>
                <div className="fvd-brand-text">FORGEVENTURE</div>
                <div className="fvd-brand-sub">DONAR · APOYA EL PROYECTO</div>
              </div>
            </div>
            <div className="fvd-panel fvd-page-title">
              <span className="fvd-corners"/>
              <div className="fvd-page-h1">DONAR</div>
              <div className="fvd-page-sub">apoya el proyecto y ayúdanos a seguir creciendo</div>
            </div>
            <div className="fvd-panel fvd-top-right">
              <span className="fvd-corners"/>
              <div className="fvd-currency"><span className="fvd-ic fvd-ic-gold"/><span>2,450</span></div>
              <div className="fvd-currency"><span className="fvd-ic fvd-ic-gem"/><span>385</span></div>
              <div className="fvd-currency"><span className="fvd-ic fvd-ic-energy"/><span>12</span></div>
              <button className="fvd-gear-btn">⚙</button>
            </div>
          </div>

          {/* ═══ LEFT COL ═══ */}
          <aside className="fvd-left-col">

            {/* Profile */}
            <div className="fvd-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-profile-top">
                <div className="fvd-avatar-frame">
                  <div className="fvd-ph-icon">⚔</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="fvd-player-name">
                    WARRIOR
                  </div>
                  <div className="fvd-player-class">GUERRERO DISCIPLINADO</div>
                  <div className="fvd-level-pill">
                    <div className="fvd-crest">⚔</div>
                    <div>
                      <div style={{fontSize:"7px",color:"var(--fvd-dim)",letterSpacing:"1px"}}>LV</div>
                      <div style={{color:"var(--fvd-gold-b)",fontSize:"13px",
                        textShadow:"0 0 8px rgba(244,204,120,0.5)",
                        fontFamily:"'VT323',monospace"}}>24</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="fvd-xp-row">
                <span>EXP</span>
                <span className="fvd-xp-val">2,350 / 4,800</span>
              </div>
              <div className="fvd-bar tall">
                <div className="fvd-bar-fill" style={{width:"49%"}}/>
              </div>
            </div>

            {/* Stats */}
            <div className="fvd-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head">
                <span className="fvd-deco">◆</span>ESTADÍSTICAS<span className="fvd-deco">◆</span>
              </div>
              {[
                {cls:"fvd-glyph-heart",  name:"FUERZA",     val:78,  fillCls:"fvd-fill-str"},
                {cls:"fvd-glyph-shield", name:"RESISTENCIA", val:64,  fillCls:"fvd-fill-sta"},
                {cls:"fvd-glyph-boot",   name:"VELOCIDAD",   val:52,  fillCls:"fvd-fill-spd"},
                {cls:"fvd-glyph-scroll", name:"DISCIPLINA",  val:86,  fillCls:"fvd-fill-dis"},
                {cls:"fvd-glyph-brain",  name:"MENTALIDAD",  val:71,  fillCls:"fvd-fill-men"},
              ].map(s => (
                <div key={s.name} className="fvd-stat">
                  <div className={`fvd-stat-glyph ${s.cls}`}/>
                  <div>
                    <div className="fvd-stat-row-name">
                      <span>{s.name}</span>
                      <span className="fvd-stat-val">{s.val}</span>
                    </div>
                    <div className="fvd-stat-bar">
                      <div className={`fvd-stat-fill ${s.fillCls}`}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Streak */}
            <div className="fvd-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head">
                <span className="fvd-deco">◆</span>RACHA ACTUAL<span className="fvd-deco">◆</span>
              </div>
              <div className="fvd-streak-row">
                <div className="fvd-streak-num">
                  {STREAKDAYS}
                  <span className="fvd-streak-lab">DÍAS</span>
                </div>
                <div className="fvd-streak-flames">
                  {Array.from({length:7},(_,i)=>(
                    <div key={i} className={`fvd-flame${i>=flameCount?" dim":""}`}
                      style={{"--idx":i}}/>
                  ))}
                </div>
              </div>
              <div className="fvd-streak-msg">¡Sigue así, campeón!</div>
            </div>

          </aside>

          {/* ═══ CENTER COL ═══ */}
          <main className="fvd-center-col">

            {/* Community Goal */}
            <div className="fvd-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head">
                <span className="fvd-deco">◆</span>META DE LA COMUNIDAD<span className="fvd-deco">◆</span>
              </div>
              <div className="fvd-goal-top">
                <span className="fvd-goal-raised">
                  $<span>{(4280 + totalCount).toLocaleString()}</span>
                </span>
                <span className="fvd-goal-target">de</span>
                <span className="fvd-goal-target">$10,000</span>
              </div>
              <div className="fvd-goal-bar">
                <div className="fvd-goal-fill"
                  style={{width:`${Math.min(100,((4280+totalCount)/10000)*100).toFixed(1)}%`}}/>
              </div>
              <div className="fvd-goal-meta">
                <span>DONANTES: <span className="fvd-goal-v">{312+recentDons.filter(d=>d.name==="TÚ").length}</span></span>
                <span><span className="fvd-goal-v">{Math.min(100,((4280+totalCount)/10000)*100).toFixed(1)}</span>% COMPLETADO</span>
              </div>
            </div>

            {/* Tiers */}
            <div className="fvd-panel" style={{padding:"16px 18px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head">
                <span className="fvd-deco">◆</span>ELIGE TU DONACIÓN<span className="fvd-deco">◆</span>
              </div>

              <div className="fvd-tiers-grid">
                {DON_TIERS.map((tier,idx) => (
                  <div key={tier.id}
                    className={`fvd-tier-card ${tier.cls}${!isCustom&&donTierIdx===idx?" active":""}`}
                    onClick={() => {setDonTierIdx(idx);setIsCustom(false);setCustomAmt("");}}>
                    <div className="fvd-tier-name">{tier.name}</div>
                    <div className="fvd-tier-medal">
                      <div className="fvd-tier-ring"/>
                      <div className="fvd-tier-star"/>
                    </div>
                    <div className="fvd-tier-price">${tier.price.toFixed(2)}</div>
                    <div className="fvd-tier-gems">
                      <span className="fvd-gem-ic"/>
                      {tier.gems}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom amount */}
              <div className={`fvd-custom-row${isCustom?" active":""}`}>
                <span className="fvd-custom-lbl">OTRO MONTO</span>
                <div className="fvd-custom-input-wrap">
                  <span className="fvd-dollar">$</span>
                  <input type="number" min="1" step="1" placeholder="0.00"
                    className="fvd-custom-input"
                    value={customAmt}
                    onChange={e => {
                      setCustomAmt(e.target.value);
                      setIsCustom(e.target.value !== "");
                    }}/>
                </div>
                <span className="fvd-custom-gems">
                  <span className="fvd-gem-ic"/>
                  {gemsForAmt(parseFloat(customAmt)||0)}
                </span>
              </div>

              {/* Message field */}
              <div className="fvd-msg-field">
                <div className="fvd-msg-label">DEJA UN MENSAJE (OPCIONAL)</div>
                <input type="text" maxLength={60} placeholder="¡Vamos por más, hermanos!"
                  className="fvd-msg-input"
                  value={donMsg}
                  onChange={e => setDonMsg(e.target.value)}/>
              </div>

              {/* Donate button */}
              {onCooldown ? (
                <CooldownDisplay remainMs={remainMs} maxMs={effectiveCooldownMs}/>
              ) : (
                <button className="fvd-donate-btn" disabled={currAmt<=0}
                  onClick={() => currAmt>0 && setShowModal(true)}>
                  <div className="fvd-btn-shine"/>
                  <div className="fvd-btn-heart"/>
                  <span>DONAR ${currAmt.toFixed(2)}</span>
                </button>
              )}
            </div>

            {/* Impact */}
            <div className="fvd-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head">
                <span className="fvd-deco">◆</span>IMPACTO DE TU APOYO<span className="fvd-deco">◆</span>
              </div>
              <div className="fvd-impact-grid">
                {[
                  {gCls:"fvd-ig-heart",    txt:"Mejoras constantes en la plataforma"},
                  {gCls:"fvd-ig-dumbbell", txt:"Nuevos ejercicios y rutinas"},
                  {gCls:"fvd-ig-trophy",   txt:"Eventos y retos exclusivos"},
                  {gCls:"fvd-ig-people",   txt:"Comunidad más fuerte"},
                  {gCls:"fvd-ig-star",     txt:"Más contenido gratuito"},
                ].map(item => (
                  <div key={item.txt} className="fvd-impact-cell">
                    <div className="fvd-impact-ico">
                      <div className={`fvd-impact-g ${item.gCls}`}/>
                    </div>
                    <div className="fvd-impact-txt">{item.txt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent donations */}
            <div className="fvd-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head">
                <span className="fvd-deco">◆</span>DONACIONES RECIENTES<span className="fvd-deco">◆</span>
              </div>
              <div>
                {recentDons.slice(0,4).map((d,i) => (
                  <div key={i} className="fvd-don-row"
                    style={d.fresh ? {animation:"fvd-row-in .6s ease-out"} : undefined}>
                    <div className={`fvd-don-av ${d.cls}`}>
                      <div className="fvd-slot">{d.ico}</div>
                    </div>
                    <div>
                      <div className="fvd-don-name">{d.name}</div>
                      <div className="fvd-don-amt">Donó ${typeof d.amt==="number"?d.amt.toFixed(2):d.amt}</div>
                    </div>
                    <div className="fvd-don-msg">{d.msg}</div>
                    <div className="fvd-don-time">{d.time}</div>
                  </div>
                ))}
              </div>
            </div>

          </main>

          {/* ═══ RIGHT COL ═══ */}
          <aside className="fvd-right-col">

            {/* Payment details */}
            <div className="fvd-panel fvd-pay-panel" style={{padding:"14px 16px"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head" style={{color:"#c08aff",
                textShadow:"0 0 8px rgba(192,138,255,.35)",
                borderBottomColor:"rgba(192,138,255,.25)"}}>
                <span className="fvd-deco">◆</span>DETALLES DE PAGO<span className="fvd-deco">◆</span>
              </div>
              {[
                {gCls:"fvd-g2-bank",    lab:"MÉTODO DE PAGO", val:"Transferencia Bancaria"},
                {gCls:"fvd-g2-tree",    lab:"BANCO",          val:"Banco de la Nación"},
                {gCls:"fvd-g2-titular", lab:"TITULAR",        val:"ForgeVenture S.A.C."},
                {gCls:"fvd-g2-card",    lab:"NÚMERO DE CUENTA",val:"04-123-456789"},
                {gCls:"fvd-g2-cci",     lab:"CCI",            val:"018-123-000123456789-05"},
              ].map(row => (
                <div key={row.lab} className="fvd-pay-row">
                  <div className="fvd-pay-ico">
                    <div className={`fvd-pay-g2 ${row.gCls}`}/>
                  </div>
                  <div>
                    <div className="fvd-pay-lab">{row.lab}</div>
                    <div className="fvd-pay-val">{row.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* QR panel */}
            <div className="fvd-panel" style={{padding:"14px 16px",textAlign:"center"}}>
              <span className="fvd-corners"/>
              <div className="fvd-panel-head" style={{color:"#c08aff",
                borderBottomColor:"rgba(192,138,255,.25)"}}>
                <span className="fvd-deco">◆</span>ESCANEA PARA DONAR<span className="fvd-deco">◆</span>
              </div>
              <div className="fvd-qr-frame">
                <div className="fvd-qr-grid">
                  {qrCells.map((on,i) => (
                    <div key={i} className={on?"q":""}/>
                  ))}
                </div>
              </div>
              <div className="fvd-qr-or">O USA NUESTRA CLAVE</div>
              <div className="fvd-yape-key"
                onClick={() => navigator.clipboard?.writeText("FORGEVENTURE@YAPE").catch(()=>{})}>
                FORGEVENTURE@YAPE
              </div>
              <div className="fvd-secure-note">
                <div className="fvd-lock"/>
                <span>Tu donación es segura y será usada para mejorar la plataforma.</span>
              </div>
            </div>

          </aside>

          {/* ═══ BOTTOM NAV — 12 items ═══ */}
          <nav className="fvd-panel fvd-bottom-nav">
            <span className="fvd-corners"/>
            {[
              {id:"map",      label:"MAPA",       href:"/",           ng:"fvd-ng-map"},
              {id:"char",     label:"PERSONAJE",  href:"/personaje",  ng:"fvd-ng-char"},
              {id:"exercise", label:"EJERCICIOS", href:"/ejercicios", ng:"fvd-ng-exercise"},
              {id:"routine",  label:"RUTINAS",    href:"/rutinas",    ng:"fvd-ng-routine"},
              {id:"mission",  label:"MISIONES",   href:"/misiones",   ng:"fvd-ng-mission"},
              {id:"trophy",   label:"LOGROS",     href:"/logros",     ng:"fvd-ng-trophy"},
              {id:"shop",     label:"TIENDA",     href:"/tienda",     ng:"fvd-ng-shop"},
              {id:"chat",     label:"CHAT",       href:"/chat",       ng:"fvd-ng-chat"},
              {id:"mail",     label:"MENSAJES",   href:"/mensajes",   ng:"fvd-ng-mail"},
              {id:"bestiary", label:"BESTIARIO",  href:"/bestiary",   ng:"fvd-ng-bestiary"},
              {id:"donate",   label:"DONAR",      href:"/donaciones", ng:"fvd-ng-heart", active:true},
              {id:"settings", label:"AJUSTES",    href:"/ajustes",    ng:"fvd-ng-settings"},
            ].map(item => (
              <a key={item.id} href={item.href}
                className={`fvd-nav-item${item.active?" active":""}`}>
                <div className="fvd-nav-icon">
                  <div className={`fvd-ng ${item.ng}`}/>
                </div>
                <div className="fvd-nav-label">{item.label}</div>
              </a>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}

/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              PNG ASSET LIST — UserDonaciones.jsx                 ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  TIERS / MEDALS                                                  ║
 * ║  /ui/tier-medal-bronze.png  — 64×64px bronze medal pixel art     ║
 * ║  /ui/tier-medal-silver.png  — 64×64px silver medal pixel art     ║
 * ║  /ui/tier-medal-gold.png    — 64×64px gold medal pixel art       ║
 * ║  /ui/tier-medal-purple.png  — 64×64px purple/amethyst medal      ║
 * ║  /ui/tier-medal-red.png     — 64×64px crimson/titan medal        ║
 * ║    Wire: replace .fvd-tier-medal with <img> at pixelated render  ║
 * ║                                                                  ║
 * ║  IMPACT ICONS (replace CSS clip-path shapes)                     ║
 * ║  /ui/impact-heart.png       — 26×26px heart icon                 ║
 * ║  /ui/impact-dumbbell.png    — 26×26px dumbbell icon              ║
 * ║  /ui/impact-trophy.png      — 26×26px trophy icon                ║
 * ║  /ui/impact-people.png      — 26×26px community icon             ║
 * ║  /ui/impact-star.png        — 26×26px star icon                  ║
 * ║                                                                  ║
 * ║  PAYMENT ICONS (replace CSS clip-path shapes)                    ║
 * ║  /ui/pay-bank.png           — 32×32px bank icon                  ║
 * ║  /ui/pay-tree.png           — 32×32px org/tree icon              ║
 * ║  /ui/pay-titular.png        — 32×32px person/holder icon         ║
 * ║  /ui/pay-card.png           — 32×32px card/account icon          ║
 * ║  /ui/pay-cci.png            — 32×32px CCI/transfer icon          ║
 * ║                                                                  ║
 * ║  NAV ICONS (replace CSS clip-path icons in bottom nav)           ║
 * ║  /ui/nav-heart.png          — 19×19px heart icon (DONAR active)  ║
 * ║  /ui/nav-map.png .. /ui/nav-settings.png — 11 remaining navs     ║
 * ║                                                                  ║
 * ║  QR & MISC                                                       ║
 * ║  /qr-donacion.png           — Actual QR code (donation link)     ║
 * ║  /ui/don-panel-border.png   — Pixel art panel frame overlay      ║
 * ║  /ui/forge-anvil-frame.png  — Decorative forge/anvil art for     ║
 * ║    left column profile header area                               ║
 * ║                                                                  ║
 * ║  ANIMATED SEQUENCE (existing from previous version)              ║
 * ║  /avatar/forge/forge_01.png .. forge_08.png                      ║
 * ║    8-frame forge anvil animation, 8fps, 120×120px each           ║
 * ║    Can be shown in profile card or as a top-bar decoration       ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
