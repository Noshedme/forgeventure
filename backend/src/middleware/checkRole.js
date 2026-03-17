// src/middleware/checkRole.js
// Verifica que el usuario autenticado tenga el rol requerido.
// Usar DESPUÉS de verifyToken.

import { db } from "../config/firebase.js";

// Uso: router.get("/admin/x", verifyToken, checkRole("admin"), handler)
export const checkRole = (requiredRole) => async (req, res, next) => {
  try {
    const doc = await db.collection("users").doc(req.user.uid).get();

    if (!doc.exists) {
      return res.status(403).json({ ok: false, message: "Perfil no encontrado" });
    }

    const { roleId } = doc.data();

    if (roleId !== requiredRole) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere rol: ${requiredRole}`,
      });
    }

    req.userProfile = doc.data(); // disponible en la ruta siguiente
    next();
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};