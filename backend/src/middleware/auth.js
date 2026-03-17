// src/middleware/auth.js
// Verifica que el request tenga un token válido de Firebase
// Úsalo en cualquier ruta que requiera estar autenticado

import { auth } from "../config/firebase.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // El header debe venir como: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Token no proporcionado",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Firebase Admin verifica la firma y expiración del token
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded; // uid, email, etc. quedan disponibles en la ruta
    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      message: "Token inválido o expirado",
    });
  }
};