// src/App.jsx
import { useState, useEffect, useRef, createContext, useContext } from "react";
import sm from "./services/soundManager";
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth }               from "./firebase";
import { getProfile }         from "./services/api";

import { ToastProvider } from "./components/shared/ui.jsx";
import AvatarWidget   from "./avatar/AvatarWidget";
import SettingsPanel  from "./components/shared/SettingsPanel";
import Home           from "./pages/Home";
import LoginPage      from "./pages/LoginPage";
import RegisterPage   from "./pages/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDashboard  from "./pages/user/UserDashboard";
import UserBossBattleArena from "./pages/user/UserBossBattleArena";
import OnboardingFlow from "./pages/OnboardingFlow";
import SupportPage    from "./pages/SupportPage";
import TerminosPage   from "./pages/TerminosPage";
import PrivacidadPage from "./pages/PrivacidadPage";

// ── CSS global: cursor none + pixel cursor styles ─────────────────
// Se inyecta UNA sola vez en el root para que nunca se pierda
const GLOBAL_CSS = `
  body { cursor: auto; }

  .fv-cursor, .fv-cursor-ring { display: none; }

  html[data-fv-cursor="pixel"] body,
  html[data-fv-cursor="pixel"] button,
  html[data-fv-cursor="pixel"] a,
  html[data-fv-cursor="pixel"] input,
  html[data-fv-cursor="pixel"] textarea,
  html[data-fv-cursor="pixel"] select {
    cursor: none !important;
  }

  html[data-fv-cursor="pixel"] .fv-cursor,
  html[data-fv-cursor="pixel"] .fv-cursor-ring {
    display: block;
  }

  html[data-fv-cursor="crosshair"] body,
  html[data-fv-cursor="crosshair"] button,
  html[data-fv-cursor="crosshair"] a,
  html[data-fv-cursor="crosshair"] input,
  html[data-fv-cursor="crosshair"] textarea,
  html[data-fv-cursor="crosshair"] select {
    cursor: crosshair !important;
  }

  .fv-cursor {
    width: 10px; height: 10px;
    clip-path: polygon(0 0, 100% 0, 100% 10%, 10% 10%, 10% 100%, 0 100%);
    background: #E85D04;
    position: fixed; pointer-events: none; z-index: 99999;
    transform: translate(-2px,-2px);
    image-rendering: pixelated;
  }
  .fv-cursor-ring {
    width: 20px; height: 20px;
    clip-path: polygon(
      0 8px, 8px 8px, 8px 0, 12px 0, 12px 8px, 20px 8px,
      20px 12px, 12px 12px, 12px 20px, 8px 20px, 8px 12px, 0 12px
    );
    background: #E85D0488;
    position: fixed; pointer-events: none; z-index: 99998;
    transform: translate(-10px,-10px);
    image-rendering: pixelated;
  }

  /* Ocultar en touch/mobile */
  @media (max-width: 600px) {
    body { cursor: auto !important; }
    .fv-cursor, .fv-cursor-ring { display: none !important; }
  }
`;

// ── Custom cursor — siempre montado en el root ────────────────────
function GlobalCursor() {
  const dot  = useRef(null);
  const ring = useRef(null);
  const [cursorMode, setCursorMode] = useState(() => {
    try { return localStorage.getItem("fv_cursor") || "normal"; }
    catch { return "normal"; }
  });

  useEffect(() => {
    const syncMode = (event) => {
      const next =
        event?.detail?.cursor ||
        window.__fvSettings?.cursor ||
        localStorage.getItem("fv_cursor") ||
        "normal";
      setCursorMode(next);
    };
    window.addEventListener("fv-settings-changed", syncMode);
    window.addEventListener("storage", syncMode);
    return () => {
      window.removeEventListener("fv-settings-changed", syncMode);
      window.removeEventListener("storage", syncMode);
    };
  }, []);

  useEffect(() => {
    // No mostrar en dispositivos touch
    if (window.matchMedia("(hover: none)").matches || cursorMode !== "pixel") return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId = null;

    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot.current) {
        dot.current.style.left = mx + "px";
        dot.current.style.top  = my + "px";
      }
    };

    const loop = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring.current) {
        ring.current.style.left = rx + "px";
        ring.current.style.top  = ry + "px";
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [cursorMode]);

  if (cursorMode !== "pixel") return null;

  return (
    <>
      <div ref={dot}  className="fv-cursor" />
      <div ref={ring} className="fv-cursor-ring" />
    </>
  );
}

// ── Pantalla de carga ─────────────────────────────────────────────
const LOAD_CSS = `
  @keyframes appPulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 14px #E85D04)} 50%{transform:scale(1.1);filter:drop-shadow(0 0 28px #E85D04)} }
  @keyframes appDot   { 0%,80%,100%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:1} }
  @keyframes appStatusFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes appStatusGlow  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.9;transform:scale(1.06)} }
`;
function LoadingScreen({ msg = "VERIFICANDO SESIÓN..." }) {
  return (
    <>
      <style>{LOAD_CSS}</style>
      <div style={{ height:"100vh", background:"#060D1A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:22 }}>
        <div style={{ fontSize:52, animation:"appPulse 1.8s ease-in-out infinite" }}>⚔️</div>
        <div style={{ display:"flex", gap:8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:9, height:9, background:"#E85D04", borderRadius:"50%", animation:`appDot 1.2s ease-in-out ${i*0.2}s infinite` }}/>
          ))}
        </div>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:600, color:"#5A7A9A", letterSpacing:".14em" }}>{msg}</div>
      </div>
    </>
  );
}

// ── Acceso denegado ───────────────────────────────────────────────
function AccessDenied({ onBack }) {
  return (
    <>
      <style>{LOAD_CSS}</style>
      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 16% 18%, rgba(107,200,122,.12), transparent 30%), radial-gradient(circle at 82% 16%, rgba(76,201,240,.1), transparent 28%), radial-gradient(circle at 74% 82%, rgba(255,71,87,.12), transparent 30%), linear-gradient(180deg, #060816 0%, #090b18 50%, #05070f 100%)",
          color: "#f7f5ff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(112, 133, 173, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(112, 133, 173, 0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            opacity: 0.18,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, transparent 30%, rgba(4, 6, 12, 0.64) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
          }}
        >
          <div
            style={{
              width: "min(1180px, 100%)",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.72fr)",
              gap: 22,
            }}
          >
            <section
              style={{
                position: "relative",
                minHeight: 560,
                borderRadius: 32,
                overflow: "hidden",
                border: "1px solid rgba(128, 223, 145, 0.2)",
                boxShadow:
                  "0 28px 80px rgba(0, 0, 0, 0.44), 0 0 0 1px rgba(100, 214, 122, 0.06) inset",
                background:
                  "linear-gradient(135deg, rgba(11, 14, 27, 0.94), rgba(9, 11, 21, 0.9))",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(180deg, rgba(5, 8, 16, 0.06), rgba(5, 8, 16, 0.84)), url('/ui/scene-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(2px) saturate(1.06)",
                  transform: "scale(1.04)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(110deg, rgba(7, 10, 20, 0.96) 10%, rgba(7, 10, 20, 0.78) 48%, rgba(7, 10, 20, 0.46) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background:
                    "linear-gradient(90deg, rgba(123,220,59,0), rgba(123,220,59,.9), rgba(76,201,240,.85), rgba(255,77,94,.75), rgba(123,220,59,0))",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  height: "100%",
                  padding: "32px clamp(24px, 4vw, 40px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 28,
                }}
              >
                <div style={{ maxWidth: 620, display: "grid", gap: 18 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      width: "fit-content",
                      padding: "10px 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(127, 220, 59, 0.24)",
                      background: "rgba(10, 15, 28, 0.72)",
                      boxShadow: "0 0 24px rgba(123, 220, 59, 0.08)",
                    }}
                  >
                    <img
                      src="/ui/header/section-home.png"
                      alt=""
                      aria-hidden="true"
                      style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <span
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        color: "#9cf065",
                        textTransform: "uppercase",
                      }}
                    >
                      Portal protegido
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(241, 243, 255, 0.66)",
                      }}
                    >
                      Estado del acceso
                    </p>
                    <h1
                      style={{
                        margin: 0,
                        fontFamily: "'Sora', 'Inter', sans-serif",
                        fontSize: "clamp(2.6rem, 6vw, 4.75rem)",
                        lineHeight: 0.98,
                        letterSpacing: "-0.04em",
                        fontWeight: 800,
                      }}
                    >
                      Esta ruta
                      <br />
                      <span
                        style={{
                          color: "#ff6a74",
                          textShadow: "0 0 28px rgba(255, 106, 116, 0.28)",
                        }}
                      >
                        no esta abierta para tu cuenta.
                      </span>
                    </h1>
                    <p
                      style={{
                        margin: 0,
                        maxWidth: 560,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        lineHeight: 1.7,
                        color: "rgba(228, 232, 246, 0.8)",
                      }}
                    >
                      El panel que intentaste abrir pide permisos mas altos.
                      Vuelve al portal principal o entra con una cuenta que si
                      tenga acceso a esta zona.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 16,
                    maxWidth: 640,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 14,
                    }}
                  >
                    <button
                      onClick={onBack}
                      style={{
                        border: "1px solid rgba(120, 215, 102, 0.36)",
                        background:
                          "linear-gradient(135deg, rgba(110, 218, 101, 0.22), rgba(76, 201, 240, 0.18))",
                        color: "#f4fff6",
                        padding: "14px 20px",
                        borderRadius: 16,
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        boxShadow: "0 14px 34px rgba(44, 112, 69, 0.22)",
                      }}
                    >
                      Volver al portal
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {[
                      "Tu sesion sigue viva, solo esta zona no te deja pasar.",
                      "Si deberias tener acceso, cambia de cuenta o revisa permisos.",
                      "El resto del portal puede seguir usandose con normalidad.",
                    ].map((line) => (
                      <div
                        key={line}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 18,
                          border: "1px solid rgba(128, 139, 175, 0.18)",
                          background: "rgba(9, 12, 23, 0.72)",
                          color: "rgba(220, 225, 242, 0.74)",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 13,
                          lineHeight: 1.55,
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside
              style={{
                position: "relative",
                borderRadius: 28,
                border: "1px solid rgba(118, 130, 168, 0.18)",
                background:
                  "linear-gradient(180deg, rgba(11, 14, 27, 0.96), rgba(8, 10, 18, 0.92))",
                boxShadow: "0 28px 70px rgba(0, 0, 0, 0.32)",
                padding: 24,
                display: "grid",
                alignContent: "start",
                gap: 18,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at top, rgba(76, 201, 240, 0.08), transparent 34%), radial-gradient(circle at bottom, rgba(123, 220, 59, 0.08), transparent 28%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: 124,
                  height: 124,
                  margin: "6px auto 2px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.1), rgba(10,14,26,0.34) 58%, rgba(8,10,20,0.08) 72%)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 36px rgba(255, 77, 94, 0.12)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 8,
                    borderRadius: "50%",
                    border: "1px solid rgba(255, 106, 116, 0.2)",
                    animation: "appStatusGlow 3.2s ease-in-out infinite",
                  }}
                />
                <img
                  src="/logo.png"
                  alt="ForgeVenture"
                  style={{
                    width: 82,
                    height: 82,
                    objectFit: "contain",
                    animation: "appStatusFloat 4s ease-in-out infinite",
                  }}
                />
              </div>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  textAlign: "center",
                  display: "grid",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#9cc7ff",
                  }}
                >
                  Estado del portal
                </p>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Sora', 'Inter', sans-serif",
                    fontSize: 28,
                    lineHeight: 1.02,
                    fontWeight: 800,
                  }}
                >
                  Ruta bloqueada
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "rgba(221, 226, 240, 0.72)",
                  }}
                >
                  Tu acceso al mapa sigue activo, pero este tramo necesita otra
                  llave.
                </p>
              </div>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gap: 12,
                }}
              >
                {[
                  ["Estado", "Acceso denegado"],
                  ["Sesion", "Activa pero sin permiso"],
                  ["Siguiente paso", "Volver al portal o cambiar de cuenta"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 18,
                      border:
                        index === 0
                          ? "1px solid rgba(255, 106, 116, 0.26)"
                          : "1px solid rgba(120, 129, 162, 0.16)",
                      background:
                        index === 0
                          ? "linear-gradient(135deg, rgba(255, 90, 101, 0.1), rgba(11, 14, 27, 0.84))"
                          : "rgba(10, 13, 24, 0.78)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(162, 176, 212, 0.72)",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "#f5f7ff",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
// ---------------------------------------------------------------
//  AUTH CONTEXT
// ---------------------------------------------------------------
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// -- Avatar Flex - visible solo con sesion activa y perfil cargado --
function FlexWidget() {
  const { sessionState, logout } = useAuth();
  const [activeSkin, setActiveSkin] = useState(
    sessionState.profile?.activeSkin ?? 'default'
  );

  // Escucha cambios de skin desde UserPerfil sin re-montar el widget.
  useEffect(() => {
    const handler = (e) => setActiveSkin(e.detail.skin);
    window.addEventListener('skinChanged', handler);
    return () => window.removeEventListener('skinChanged', handler);
  }, []);

  if (!sessionState.fbUser) return null;
  return (
    <AvatarWidget
      role={sessionState.role ?? 'user'}
      onLogout={logout}
      skin={activeSkin}
      profile={sessionState.profile ?? null}
    />
  );
}


// ── Settings panel wrapper — always mounted at root ──────────
function SettingsPanelWrapper() {
  const { sessionState } = useAuth();
  return (
    <SettingsPanel
      user={sessionState.fbUser}
      profile={sessionState.profile}
    />
  );
}

// ── Guard: solo usuarios autenticados ─────────────────────────
function PrivateRoute() {
  const { sessionState } = useAuth();
  if (sessionState.loading)  return <LoadingScreen msg="CARGANDO AVENTURA..." />;
  if (!sessionState.fbUser)  return <Navigate to="/home" replace />;
  return <Outlet />;
}

// ── Guard: solo usuarios NO autenticados ──────────────────────
function PublicOnlyRoute() {
  const { sessionState } = useAuth();
  if (sessionState.loading)                          return <LoadingScreen msg="VERIFICANDO SESIÓN..." />;
  if (sessionState.fbUser && sessionState.profile)   return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// ═══════════════════════════════════════════════════════════════
//  WRAPPERS DE PÁGINAS
function HomeWrapper() {
  const navigate = useNavigate();
  const { sessionState } = useAuth();
  return (
    <Home
      onLogin={()   => navigate("/login")}
      onRegister={() => navigate("/register")}
      user={sessionState.fbUser}
    />
  );
}

function LoginWrapper() {
  const navigate = useNavigate();
  return (
    <LoginPage
      onGoRegister={(googleData) =>
        navigate("/register", { state: { googleData: googleData ?? null } })
      }
      onSuccess={() => navigate("/dashboard", { replace: true })}
    />
  );
}

function RegisterWrapper() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const googleData = location.state?.googleData ?? null;
  return (
    <RegisterPage
      googleData={googleData}
      onGoBack={() => navigate("/home")}
      onGoLogin={() => navigate("/login")}
      onSuccess={() => navigate("/dashboard", { replace: true })}
    />
  );
}

function DashboardResolver() {
  const { sessionState, logout } = useAuth();
  if (!sessionState.profile) return <AccessDenied onBack={logout} />;
  switch (sessionState.role) {
    case "admin": return <AdminDashboard onLogout={logout} />;
    case "user":
      if (sessionState.profile.onboardingCompleted === false) {
        return <OnboardingFlow profile={sessionState.profile} onComplete={() => window.location.reload()} />;
      }
      return <UserDashboard profile={sessionState.profile} onLogout={logout} />;
    default:      return <AccessDenied onBack={logout} />;
  }
}

function BossBattleResolver() {
  const { sessionState, logout } = useAuth();
  if (!sessionState.profile) return <AccessDenied onBack={logout} />;
  switch (sessionState.role) {
    case "user":
      if (sessionState.profile.onboardingCompleted === false) {
        return <OnboardingFlow profile={sessionState.profile} onComplete={() => window.location.reload()} />;
      }
      return <UserBossBattleArena profile={sessionState.profile} />;
    case "admin":
      return <Navigate to="/dashboard" replace />;
    default:
      return <AccessDenied onBack={logout} />;
  }
}

// ═══════════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [sessionState, setSessionState] = useState({
    loading: true,
    fbUser:  null,
    profile: null,
    role:    null,
  });

  const loadProfile = async (fbUser, attempt = 0) => {
    if (!fbUser) {
      setSessionState({ loading:false, fbUser:null, profile:null, role:null });
      return;
    }
    try {
      const token    = await fbUser.getIdToken();
      const { user } = await getProfile(token);
      setSessionState({ loading:false, fbUser, profile:user, role:user.roleId ?? null });
    } catch (err) {
      // During registration, onAuthStateChanged fires before the Firestore profile
      // is created. Retry up to 5 times (every 1 s) before giving up.
      if (err.message === "Perfil no encontrado" && attempt < 5) {
        setTimeout(() => loadProfile(fbUser, attempt + 1), 1000);
        return; // keep loading state
      }
      setSessionState({ loading:false, fbUser, profile:null, role:null });
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setSessionState(prev => ({ ...prev, loading:true }));
      loadProfile(fbUser);
    });
    return unsub;
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  // Unlock browser autoplay on first user interaction
  useEffect(() => {
    const unlock = () => { sm.unlockAudio(); window.removeEventListener("pointerdown", unlock); };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Bootstrap visual/runtime settings before the rest of the UI asks for them.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const cursor = localStorage.getItem("fv_cursor") || "normal";
    const scale = localStorage.getItem("fv_ui_scale") || "M";
    const reducedMotion = localStorage.getItem("fv_reduced_motion") === "1";
    const accent = localStorage.getItem("fv_accent") || "#C9184A";
    const px = scale === "S" ? 14 : scale === "L" ? 18 : 16;
    root.dataset.fvCursor = cursor;
    root.dataset.fvUiScale = scale;
    root.dataset.fvReducedMotion = reducedMotion ? "1" : "0";
    root.dataset.fvAccent = accent;
    root.style.fontSize = `${px}px`;
    root.style.setProperty("--fv-accent", accent);
    body.classList.toggle("fv-reduced-motion", reducedMotion);
    window.__fvSettings = {
      ...(window.__fvSettings || {}),
      cursor,
      scale,
      reducedMotion,
      accent,
    };
  }, []);

  return (
    <ToastProvider>
    <AuthContext.Provider value={{ sessionState, logout }}>

      {/* CSS global del cursor — inyectado UNA vez, nunca se desmonta */}
      <style>{GLOBAL_CSS}</style>

      {/* Cursor siempre visible en TODAS las rutas */}
      <GlobalCursor />

      {/* Avatar Flex — guía flotante, solo con sesión activa */}
      <FlexWidget />

      {/* Settings panel — siempre visible, top-right corner */}
      <SettingsPanelWrapper />

      <Routes>
        <Route path="/"        element={<Navigate to="/home" replace />} />
        <Route path="/home"    element={<HomeWrapper />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login"    element={<LoginWrapper />} />
          <Route path="/register" element={<RegisterWrapper />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard/ejercicios/jefe/:bossKey" element={<BossBattleResolver />} />
          <Route path="/dashboard" element={<DashboardResolver />} />
        </Route>

        <Route path="/soporte"    element={<SupportPage />} />
        <Route path="/terminos"   element={<TerminosPage />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

    </AuthContext.Provider>
    </ToastProvider>
  );
}

