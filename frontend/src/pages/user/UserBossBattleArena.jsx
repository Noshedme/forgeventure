import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import BossBattleModal from "../../components/shared/BossBattleModal.jsx";
import { USER_CLASS_THEME } from "./userClassTheme.js";

const PAGE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ueb-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top, color-mix(in srgb, var(--ueb-accent), transparent 82%), transparent 24%),
      radial-gradient(circle at 88% 22%, color-mix(in srgb, var(--ueb-secondary), transparent 88%), transparent 20%),
      linear-gradient(180deg, #090617 0%, var(--ueb-bg) 48%, #080511 100%),
      url("/ui/dashboard-bg.png") center top / cover no-repeat,
      #090611;
  }

  /* ── Barra flotante superior ── */
  .ueb-overlay-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 22px;
    background: rgba(6,4,14,0.90);
    backdrop-filter: blur(16px) saturate(1.4);
    border-bottom: 1px solid color-mix(in srgb, var(--ueb-accent), transparent 60%);
    box-shadow: 0 2px 24px rgba(0,0,0,0.55);
  }
  .ueb-overlay-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .ueb-overlay-crest {
    width: 34px; height: 34px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--ueb-accent), transparent 50%));
  }
  .ueb-overlay-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .ueb-overlay-copy span {
    color: var(--ueb-accent);
    font: 800 10px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .14em;
    white-space: nowrap;
  }
  .ueb-overlay-copy strong {
    color: #fff5ee;
    font: 800 16px/1 "Manrope", sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 340px;
  }
  .ueb-overlay-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .ueb-xp-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--ueb-secondary), transparent 56%);
    background: color-mix(in srgb, var(--ueb-secondary), transparent 88%);
    color: #fff4de;
    font: 800 11px/1 "JetBrains Mono", monospace;
    white-space: nowrap;
  }
  .ueb-action-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.055);
    color: #e8deff;
    font: 700 11px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .1em;
    white-space: nowrap;
  }
  .ueb-back {
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(255,255,255,.13);
    background: rgba(255,255,255,.06);
    color: #f4ebff;
    font: 700 12px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: transform .18s, border-color .18s, background .18s;
    white-space: nowrap;
  }
  .ueb-back:hover {
    transform: translateY(-1px);
    border-color: var(--ueb-accent);
    background: rgba(255,255,255,.10);
  }

  /* ── Arena full-screen ── */
  .ueb-arena {
    min-height: 100vh;
    padding-top: 55px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--ueb-accent), transparent 93%), transparent 30%),
      rgba(8,6,16,.92);
  }

  /* ── Pantalla de cierre ── */
  .ueb-closing {
    position: fixed;
    inset: 0;
    z-index: 9000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: rgba(6,4,14,.92);
    backdrop-filter: blur(20px);
    color: var(--ueb-accent);
    font: 800 14px/1 "JetBrains Mono", monospace;
    letter-spacing: .14em;
  }
  .ueb-closing-bar {
    width: 220px;
    height: 3px;
    background: rgba(255,255,255,.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .ueb-closing-fill {
    height: 100%;
    background: var(--ueb-accent);
    box-shadow: 0 0 8px var(--ueb-accent);
    animation: ueb-fill 1.4s linear forwards;
  }
  @keyframes ueb-fill { from { width: 0% } to { width: 100% } }

  @media (max-width: 900px) {
    .ueb-overlay-bar { padding: 9px 14px; }
    .ueb-overlay-copy strong { font-size: 14px; max-width: 200px; }
    .ueb-action-chip { display: none; }
  }
  @media (max-width: 600px) {
    .ueb-overlay-copy span { display: none; }
    .ueb-xp-pill { padding: 0 10px; font-size: 10px; }
    .ueb-back span { display: none; }
    .ueb-back { padding: 0 10px; }
  }
`;

const CLASS_FLOOR_GLOW = {
  GUERRERO: "/exercises/hero/hero-floor-glow-warrior.png",
  ARQUERO:  "/exercises/hero/hero-floor-glow-archer.png",
  MAGO:     "/exercises/hero/hero-floor-glow-mage.png",
  DEFAULT:  "/exercises/hero/hero-floor-glow-default.png",
};

const BOSS_SCENE = {
  resistencia: "/exercises/zones/zone-cardio-banner.png",
  movilidad:   "/exercises/zones/zone-flexibilidad-banner.png",
  core:        "/exercises/zones/zone-funcional-banner.png",
  default:     "/ui/scene-bg.png",
};

const normalizeClass = (profile) => {
  const raw = profile?.heroClass || profile?.clase || profile?.class || "GUERRERO";
  return String(raw).toUpperCase();
};

export default function UserBossBattleArena({ profile }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { bossKey } = useParams();

  const sourceTab = location.state?.sourceTab || "ejercicios";

  // Obtener datos del boss: desde state (navegación interna) o localStorage (nueva pestaña)
  const [bossBattle] = useState(() => {
    if (location.state?.bossBattle) return location.state.bossBattle;
    try {
      const stored = localStorage.getItem("fv_boss_transfer");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.removeItem("fv_boss_transfer");
        if (parsed?.key === bossKey || parsed?.key) return parsed;
      }
    } catch {}
    return null;
  });

  // True si se abrió en nueva pestaña (sin state de React Router)
  const isNewTab = !location.state?.bossBattle;

  const [closing, setClosing] = useState(false);

  const classKey  = normalizeClass(profile);
  const cls       = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.GUERRERO;
  const arenaScene = BOSS_SCENE[bossKey] || BOSS_SCENE.default;
  const bossTone  = bossBattle?.tone || cls.accent;

  if (!bossBattle?.exercise || !bossBattle?.bossConfig) {
    if (isNewTab) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#090611", color: "#888", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, flexDirection: "column", gap: 12 }}>
          <span>Sin datos de batalla. Cierra esta pestaña y vuelve a intentarlo.</span>
          <button onClick={() => window.close()}
            style={{ background: "none", border: "1px solid #333", color: "#aaa", padding: "8px 18px", cursor: "pointer", borderRadius: 6, fontFamily: "inherit" }}>
            Cerrar pestaña
          </button>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace state={{ activeTab: sourceTab }} />;
  }

  const handleBack = () => {
    if (isNewTab) {
      window.close();
      setTimeout(() => navigate("/dashboard", { replace: true }), 300);
    } else {
      navigate("/dashboard", { replace: true, state: { activeTab: sourceTab } });
    }
  };

  const handleComplete = (payload) => {
    // Guardar recompensa en localStorage para que la pestaña principal la reciba via storage event
    try {
      localStorage.setItem("fv_boss_reward", JSON.stringify({ ...payload, bossKey }));
    } catch {}

    if (isNewTab) {
      setClosing(true);
      setTimeout(() => {
        window.close();
        // fallback si el navegador no permite window.close()
        navigate("/dashboard", { replace: true });
      }, 1500);
    } else {
      // Fallback same-tab: también guardar en sessionStorage
      window.sessionStorage.setItem("uex:last-boss-reward", JSON.stringify({ ...payload, bossKey }));
      navigate("/dashboard", { replace: true, state: { activeTab: sourceTab } });
    }
  };

  return (
    <div
      className="ueb-page"
      style={{
        "--ueb-accent":    cls.accent,
        "--ueb-secondary": cls.secondary,
        "--ueb-bg":        cls.bg,
        "--ueb-soft":      cls.soft,
        "--ueb-boss-tone": bossTone,
      }}
    >
      <style>{PAGE_CSS}</style>

      {/* ── Barra de info flotante ── */}
      <div className="ueb-overlay-bar">
        <div className="ueb-overlay-left">
          {bossBattle.crest && (
            <img className="ueb-overlay-crest" src={bossBattle.crest} alt="" />
          )}
          <div className="ueb-overlay-copy">
            <span>{bossBattle.subtitle}</span>
            <strong>{bossBattle.title}</strong>
          </div>
        </div>

        <div className="ueb-overlay-right">
          <span className="ueb-xp-pill">+{bossBattle.bossConfig?.xpReward || 0} XP</span>
          <span className="ueb-action-chip">{bossBattle.bossConfig?.actionLabel || "Combate"}</span>
          <button
            className="ueb-back"
            onClick={handleBack}
            aria-label={isNewTab ? "Cerrar arena" : "Volver a ejercicios"}
          >
            {isNewTab ? <X size={14} /> : <ArrowLeft size={14} />}
            <span>{isNewTab ? "Cerrar" : "Volver"}</span>
          </button>
        </div>
      </div>

      {/* ── Arena full-screen ── */}
      <div className="ueb-arena">
        <BossBattleModal
          ejercicio={bossBattle.exercise}
          profile={profile}
          bossConfig={bossBattle.bossConfig}
          onClose={handleBack}
          onComplete={handleComplete}
          presentation="page"
          arenaTheme={{
            tone:          bossTone,
            classAccent:   cls.accent,
            classSecondary: cls.secondary,
            classBg:       cls.bg,
            classSoft:     cls.soft,
            scene:         arenaScene,
            crest:         bossBattle.crest,
            zoneIcon:      bossBattle.zoneIcon,
            summary:       bossBattle.summary,
          }}
        />
      </div>

      {/* ── Overlay de cierre (nueva pestaña) ── */}
      {closing && (
        <div className="ueb-closing">
          <span>VICTORIA REGISTRADA</span>
          <div className="ueb-closing-bar">
            <div className="ueb-closing-fill" />
          </div>
          <span style={{ fontSize: 10, opacity: 0.6 }}>Cerrando arena...</span>
        </div>
      )}
    </div>
  );
}
