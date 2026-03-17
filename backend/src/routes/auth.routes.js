// src/routes/auth.routes.js
import { Router } from "express";
import { db, auth } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { sendWelcomeEmail, sendResetCodeEmail } from "../services/email.service.js";

const router = Router();

const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── POST /api/auth/register ────────────────────────────────────
// Crea el perfil del héroe en Firestore con rol "user" por defecto
router.post("/register", async (req, res) => {
  const { uid, username, email, heroClass, photoURL } = req.body;

  if (!uid || !username || !email || !heroClass) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos requeridos: uid, username, email, heroClass",
    });
  }

  try {
    await auth.getUser(uid);

    // Verificar que el rol "user" existe en Firestore
    const roleDoc = await db.collection("roles").doc("user").get();
    if (!roleDoc.exists) {
      return res.status(500).json({
        ok: false,
        message: "Roles no inicializados. Ejecuta: node src/scripts/seedRoles.js",
      });
    }

    const now = new Date().toISOString();

    await db.collection("users").doc(uid).set({
      uid,
      email,
      username,
      heroClass,
      roleId:      "user",         // ← rol por defecto
      photoURL:    photoURL || null,
      level:       1,
      xp:          0,
      hp:          100,
      streak:      0,
      badges:      [],
      firstLogin:  true,           // ← true hasta que haga login por primera vez
      createdAt:   now,
      lastLoginAt: now,
    });

    // Email de bienvenida (no bloqueante)
    sendWelcomeEmail(email, username, heroClass).catch((err) =>
      console.error("⚠️ Email de bienvenida fallido:", err.message)
    );

    return res.status(201).json({ ok: true, message: "Perfil creado correctamente" });
  } catch (err) {
    console.error("Error en /register:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/auth/login-sync ──────────────────────────────────
// Llamar desde el frontend después de cada login exitoso.
// Actualiza lastLoginAt y marca firstLogin como false si es la primera vez.
router.post("/login-sync", verifyToken, async (req, res) => {
  try {
    const ref = db.collection("users").doc(req.user.uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: "Perfil no encontrado" });
    }

    const data     = doc.data();
    const isFirst  = data.firstLogin === true;
    const now      = new Date().toISOString();

    await ref.update({
      lastLoginAt: now,
      ...(isFirst ? { firstLogin: false } : {}), // solo actualiza si era true
    });

    return res.json({
      ok:         true,
      firstLogin: isFirst,          // el frontend puede mostrar un onboarding si quiere
      user:       { ...data, lastLoginAt: now, firstLogin: isFirst ? false : data.firstLogin },
    });
  } catch (err) {
    console.error("Error en /login-sync:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/auth/check/:uid ───────────────────────────────────
// Verifica si un usuario ya tiene perfil (para Google login)
router.get("/check/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    return res.json({ ok: true, exists: doc.exists });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/auth/profile ──────────────────────────────────────
// Devuelve el perfil completo del usuario autenticado
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.user.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: "Perfil no encontrado" });
    }
    return res.json({ ok: true, user: doc.data() });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────
// Verifica token y devuelve info básica
router.get("/me", verifyToken, (req, res) => {
  return res.json({ ok: true, uid: req.user.uid, email: req.user.email });
});

// ── POST /api/auth/forgot-password ────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, message: "El correo es obligatorio" });

  try {
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.json({ ok: true, message: "Si el correo existe, recibirás un código" });
    }

    const doc      = await db.collection("users").doc(userRecord.uid).get();
    const username = doc.exists ? doc.data().username : "Héroe";
    const code     = randomCode();
    const expires  = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.collection("resetCodes").doc(userRecord.uid).set({ code, expires, email });
    await sendResetCodeEmail(email, username, code);

    return res.json({ ok: true, message: "Si el correo existe, recibirás un código" });
  } catch (err) {
    console.error("Error en /forgot-password:", err);
    return res.status(500).json({ ok: false, message: "Error al procesar la solicitud" });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ ok: false, message: "Faltan campos requeridos" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ ok: false, message: "Mínimo 6 caracteres" });
  }

  try {
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const resetDoc = await db.collection("resetCodes").doc(userRecord.uid).get();
    if (!resetDoc.exists) {
      return res.status(400).json({ ok: false, message: "No hay código activo para este correo" });
    }

    const { code: savedCode, expires } = resetDoc.data();

    if (savedCode !== code) {
      return res.status(400).json({ ok: false, message: "Código incorrecto" });
    }
    if (new Date() > new Date(expires)) {
      await db.collection("resetCodes").doc(userRecord.uid).delete();
      return res.status(400).json({ ok: false, message: "El código ha expirado. Solicita uno nuevo" });
    }

    await auth.updateUser(userRecord.uid, { password: newPassword });
    await db.collection("resetCodes").doc(userRecord.uid).delete();

    return res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en /reset-password:", err);
    return res.status(500).json({ ok: false, message: "Error al actualizar la contraseña" });
  }
});

// ── ADMIN: GET /api/auth/users ─────────────────────────────────
// Lista todos los usuarios (solo admin)
router.get("/users", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    const users    = snapshot.docs.map((d) => d.data());
    return res.json({ ok: true, users, total: users.length });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── ADMIN: PATCH /api/auth/users/:uid/role ─────────────────────
// Cambia el rol de un usuario (solo admin)
router.patch("/users/:uid/role", verifyToken, checkRole("admin"), async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ ok: false, message: "Rol inválido. Usa: user | admin" });
  }

  // No puede cambiar su propio rol
  if (req.params.uid === req.user.uid) {
    return res.status(400).json({ ok: false, message: "No puedes cambiar tu propio rol" });
  }

  try {
    const ref = db.collection("users").doc(req.params.uid);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    await ref.update({ roleId: role });
    return res.json({ ok: true, message: `Rol actualizado a '${role}'` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── ADMIN: DELETE /api/auth/users/:uid ────────────────────────
// Elimina un usuario (solo admin)
router.delete("/users/:uid", verifyToken, checkRole("admin"), async (req, res) => {
  if (req.params.uid === req.user.uid) {
    return res.status(400).json({ ok: false, message: "No puedes eliminarte a ti mismo" });
  }

  try {
    await auth.deleteUser(req.params.uid);
    await db.collection("users").doc(req.params.uid).delete();
    return res.json({ ok: true, message: "Usuario eliminado correctamente" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;