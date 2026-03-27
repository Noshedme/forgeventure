// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged }  from "firebase/auth";
import { auth }                from "./firebase";
import { getProfile }          from "./services/api";

import SplashScreen   from "./components/SplashScreen";
import Home           from "./pages/Home";
import LoginPage      from "./pages/LoginPage";
import RegisterPage   from "./pages/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDashboard  from "./pages/user/UserDashboard";

// ── Pantalla de carga ─────────────────────────────────────────
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

// ── Acceso denegado ───────────────────────────────────────────
function AccessDenied({ onBack }) {
  return (
    <div style={{ height:"100vh", background:"#060D1A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
      <div style={{ fontSize:52 }}>🚫</div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:"#E74C3C" }}>ACCESO DENEGADO</div>
      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, color:"#6B8CAE", textAlign:"center", maxWidth:320, lineHeight:1.6 }}>
        No tienes permisos para acceder a este panel. Contacta al administrador si crees que es un error.
      </div>
      <button onClick={onBack} style={{ fontFamily:"'Press Start 2P'", fontSize:8, background:"#E85D04", border:"none", color:"#060D1A", padding:"12px 24px", cursor:"pointer", marginTop:6, letterSpacing:".05em" }}>
        ← VOLVER
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [screen,     setScreen]     = useState("splash");
  const [googleData, setGoogleData] = useState(null);

  // Estado de sesión / perfil
  const [sessionState, setSessionState] = useState({
    loading:  true,   // true mientras Firebase resuelve
    fbUser:   null,
    profile:  null,
    role:     null,   // "admin" | "user" | null
  });

  // ── Cargar perfil desde el backend ───────────────────────────
  const loadProfile = async (fbUser) => {
    if (!fbUser) {
      setSessionState({ loading:false, fbUser:null, profile:null, role:null });
      return;
    }
    try {
      const token    = await fbUser.getIdToken();
      const { user } = await getProfile(token);         // GET /api/auth/profile
      setSessionState({ loading:false, fbUser, profile:user, role:user.roleId ?? null });
    } catch {
      // Perfil no existe aún (ej: registro en curso) → dejamos sin role
      setSessionState({ loading:false, fbUser, profile:null, role:null });
    }
  };

  // ── Escuchar cambios de sesión de Firebase ───────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setSessionState(prev => ({ ...prev, loading:true }));
      loadProfile(fbUser);
    });
    return unsub;
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = async () => {
    await auth.signOut();
    setGoogleData(null);
    setScreen("home");
    // onAuthStateChanged disparará automáticamente → sessionState se limpia solo
  };

  // ─────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────

  // 1. Splash — siempre primero, independiente de la sesión
  if (screen === "splash") {
    return <SplashScreen onComplete={() => setScreen("home")} />;
  }

  // 2. Home — pantalla pública
  if (screen === "home") {
    return (
      <Home
        onLogin={() => setScreen("login")}
        onRegister={() => { setGoogleData(null); setScreen("register"); }}
      />
    );
  }

  // 3. Login
  if (screen === "login") {
    return (
      <LoginPage
        onGoRegister={(data) => { setGoogleData(data || null); setScreen("register"); }}
        onSuccess={() => setScreen("resolving")}  // ← va a resolver el rol
      />
    );
  }

  // 4. Register
  if (screen === "register") {
    return (
      <RegisterPage
        onGoLogin={() => setScreen("login")}
        onSuccess={() => { setGoogleData(null); setScreen("resolving"); }}
        googleData={googleData}
      />
    );
  }

  // 5. Resolving — detecta el rol después de login/register exitoso
  //    También se llega aquí desde screen="dashboard" si ya hay sesión
  if (screen === "resolving" || screen === "dashboard") {

    // 5a. Firebase aún resolviendo
    if (sessionState.loading) {
      return <LoadingScreen msg="CARGANDO AVENTURA..." />;
    }

    // 5b. Sin sesión activa (no debería pasar, pero por si acaso)
    if (!sessionState.fbUser) {
      setScreen("login");
      return null;
    }

    // 5c. Perfil no encontrado en Firestore
    if (!sessionState.profile) {
      return <AccessDenied onBack={logout} />;
    }

    // 5d. Enrutar por rol
    switch (sessionState.role) {
      case "admin":
        return <AdminDashboard onLogout={logout} />;

      case "user":
        return <UserDashboard profile={sessionState.profile} onLogout={logout} />;

      default:
        return <AccessDenied onBack={logout} />;
    }
  }

  // Fallback — no debería llegar aquí
  return null;
}