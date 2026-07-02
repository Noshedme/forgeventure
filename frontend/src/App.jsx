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
    <div style={{ height:"100vh", background:"#060D1A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
      <div style={{ fontSize:52 }}>🚫</div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:"#E74C3C" }}>ACCESO DENEGADO</div>
      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, color:"#6B8CAE", textAlign:"center", maxWidth:320, lineHeight:1.6 }}>
        No tienes permisos para acceder a este panel. Contacta al administrador.
      </div>
      <button onClick={onBack} style={{ fontFamily:"'Press Start 2P'", fontSize:8, background:"#E85D04", border:"none", color:"#060D1A", padding:"12px 24px", cursor:"pointer", marginTop:6 }}>
        ← VOLVER
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ── Avatar Flex — visible solo con sesión activa y perfil cargado ─
function FlexWidget() {
  const { sessionState, logout } = useAuth();
  const [activeSkin, setActiveSkin] = useState(
    sessionState.profile?.activeSkin ?? 'default'
  );

  // Escucha cambios de skin desde UserPerfil (sin re-montar el widget)
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
