// src/router/Guards.jsx
// ─────────────────────────────────────────────────────────────
//  Guards para proteger rutas según rol del usuario.
//  Usar en rutas que requieren permisos específicos.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.js";
import { verifyMe } from "../services/api.js";

// ── AdminGuard ────────────────────────────────────────────────
// Solo permite acceso a usuarios con rol 'admin'
export function AdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await verifyMe(token);

        if (res.user.roleId === "admin") {
          setAuthorized(true);
        } else {
          navigate("/dashboard"); // o página de acceso denegado
        }
      } catch (err) {
        console.error("Error verificando rol:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#F0F4FF" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 20 }}>Verificando permisos...</div>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
}