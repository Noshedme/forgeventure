// src/routes/admin.routes.js
import { Router } from "express";
import { db, auth } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

// ── Helper: etapa de evolución del personaje (igual que frontend) ──
function getPersonajeEtapa(level = 1) {
  if (level <=  4) return { id: 1, label: "PRINCIPIANTE", icon: "🌱" };
  if (level <=  9) return { id: 2, label: "EN FORMA",     icon: "💪" };
  if (level <= 19) return { id: 3, label: "DEFINIDO",     icon: "⚡" };
  if (level <= 29) return { id: 4, label: "MUSCULADO",    icon: "🔥" };
  return                  { id: 5, label: "LEGENDARIO",   icon: "👑" };
}

// ── Helper: XP necesario para el siguiente nivel ───────────────────
function calcXpNext(level = 1) {
  return Math.floor(100 * Math.pow(Math.max(level, 1), 1.5));
}

// ── GET /api/admin/users ───────────────────────────────────────
// Lista todos los usuarios con filtros opcionales
router.get("/users", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { class: heroClass, status, role } = req.query;
    let query = db.collection("users");

    if (heroClass && heroClass !== "all") {
      query = query.where("heroClass", "==", heroClass);
    }
    if (status && status !== "all") {
      query = query.where("status", "==", status);
    } else {
      // Por defecto excluir cuentas en papelera (tienen status "deleted")
      // Firestore no admite != en la misma query con otros where compuestos,
      // así que filtramos en memoria cuando no hay filtro de status específico.
    }
    if (role && role !== "all") {
      query = query.where("roleId", "==", role);
    }

    const snapshot = await query.get();
    const users = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          personajeEtapa: getPersonajeEtapa(data.level || 1),
        };
      })
      // Excluir soft-deleted a menos que el admin filtre explícitamente por status="deleted"
      .filter(u => status === "deleted" ? u.status === "deleted" : u.status !== "deleted");

    return res.json({ ok: true, users });
  } catch (err) {
    console.error("Error en GET /admin/users:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/users ──────────────────────────────────────
// Crea un nuevo usuario
router.post("/users", verifyToken, checkRole("admin"), async (req, res) => {
  const { username, email, heroClass, roleId } = req.body;

  if (!username || !email || !heroClass) {
    return res.status(400).json({
      ok: false,
      message: "Faltan campos: username, email, heroClass",
    });
  }

  try {
    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: Math.random().toString(36).slice(-12), // Contraseña temporal
      displayName: username,
    });

    const now = new Date().toISOString();

    // Crear documento en Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      username,
      email,
      heroClass,
      roleId: roleId || "user",
      level: 1,
      xp: 0,
      xpTotal: 0,
      xpNext: 100,
      hp: 100,
      streak: 0,
      coins: 0,
      badges: [],
      status: "active",
      firstLogin: true,
      createdAt: now,
      lastLoginAt: now,
    });

    return res.status(201).json({
      ok: true,
      message: "Usuario creado correctamente",
      uid: userRecord.uid,
    });
  } catch (err) {
    console.error("Error en POST /admin/users:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:uid ────────────────────────────────
// Actualiza un usuario
router.patch("/users/:uid", verifyToken, checkRole("admin"), async (req, res) => {
  const { uid } = req.params;
  const { username, email, heroClass, roleId, level, xp, streak, hp, status, coins } = req.body;

  try {
    const updates = {};

    if (username) updates.username = username;
    if (email) {
      updates.email = email;
      // También actualizar en Firebase Auth
      await auth.updateUser(uid, { email });
    }
    if (heroClass) updates.heroClass = heroClass;
    if (roleId) updates.roleId = roleId;
    if (level !== undefined) {
      updates.level = Number(level);
      // Recalcular xpNext automáticamente al cambiar nivel
      updates.xpNext = calcXpNext(Number(level));
    }
    if (xp !== undefined) updates.xp = Number(xp);
    if (streak !== undefined) updates.streak = Number(streak);
    if (hp !== undefined) updates.hp = Number(hp);
    if (status) updates.status = status;
    if (coins !== undefined) updates.coins = Math.max(0, Number(coins));

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No hay campos para actualizar",
      });
    }

    updates.updatedAt = new Date().toISOString();

    await db.collection("users").doc(uid).update(updates);

    return res.json({
      ok: true,
      message: "Usuario actualizado correctamente",
    });
  } catch (err) {
    console.error("Error en PATCH /admin/users/:uid:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── DELETE /api/admin/users/:uid ───────────────────────────────
// Eliminación permanente de un usuario (hard-delete, solo admin)
router.delete("/users/:uid", verifyToken, checkRole("admin"), async (req, res) => {
  const { uid } = req.params;

  try {
    await db.collection("users").doc(uid).delete();
    await auth.deleteUser(uid);

    return res.json({ ok: true, message: "Usuario eliminado permanentemente" });
  } catch (err) {
    console.error("Error en DELETE /admin/users/:uid:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/admin/users/deleted ───────────────────────────────
// Lista cuentas en papelera (soft-deleted). Incluye tiempo restante.
router.get("/users/deleted", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("users")
      .where("status", "==", "deleted")
      .get();

    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const users = snapshot.docs.map(doc => {
      const data  = doc.data();
      const deletedMs  = data.deletedAt ? new Date(data.deletedAt).getTime() : 0;
      const elapsed    = now - deletedMs;
      const remaining  = Math.max(0, THREE_DAYS_MS - elapsed);
      const expiredAt  = new Date(deletedMs + THREE_DAYS_MS).toISOString();

      return {
        uid: doc.id,
        ...data,
        personajeEtapa: getPersonajeEtapa(data.level || 1),
        remainingMs:    remaining,
        expiredAt,
        isExpired:      remaining === 0,
      };
    });

    // Ordenar: más recientes primero
    users.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    return res.json({ ok: true, users, total: users.length });
  } catch (err) {
    console.error("Error en GET /admin/users/deleted:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/users/:uid/restore ────────────────────────
// Restaura una cuenta soft-deleted (solo dentro del período de 3 días)
router.post("/users/:uid/restore", verifyToken, checkRole("admin"), async (req, res) => {
  const { uid } = req.params;

  try {
    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    const data = doc.data();
    if (data.status !== "deleted") {
      return res.status(400).json({ ok: false, message: "La cuenta no está en estado eliminado" });
    }

    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const deletedMs = data.deletedAt ? new Date(data.deletedAt).getTime() : 0;
    if (Date.now() - deletedMs > THREE_DAYS_MS) {
      return res.status(400).json({
        ok: false,
        code: "RESTORE_EXPIRED",
        message: "El período de recuperación de 3 días ha expirado",
      });
    }

    // Re-habilitar en Firebase Auth y limpiar campos de borrado
    await auth.updateUser(uid, { disabled: false });
    await ref.update({
      status:    "active",
      deletedAt: null,
      restoredAt: new Date().toISOString(),
      restoredBy: req.user.uid,
    });

    // Log no bloqueante
    db.collection("activityLog").add({
      uid, type: "account_restored",
      message: `Cuenta de ${data.username} restaurada por admin`,
      icon: "♻️", color: "#2ecc71",
      byAdmin: req.user.uid,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return res.json({ ok: true, message: `Cuenta de ${data.username} restaurada correctamente` });
  } catch (err) {
    console.error("Error en POST /admin/users/:uid/restore:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/users/bulk-delete ─────────────────────────
// Elimina múltiples usuarios en un solo request
router.post("/users/bulk-delete", verifyToken, checkRole("admin"), async (req, res) => {
  const { uids } = req.body;
  if (!Array.isArray(uids) || uids.length === 0) {
    return res.status(400).json({ ok: false, message: "Se requiere un array de uids" });
  }
  if (uids.length > 50) {
    return res.status(400).json({ ok: false, message: "Máximo 50 usuarios por operación" });
  }

  const results = { deleted: [], failed: [] };
  const batch = db.batch();

  for (const uid of uids) {
    try {
      batch.delete(db.collection("users").doc(uid));
      results.deleted.push(uid);
    } catch {
      results.failed.push(uid);
    }
  }

  try {
    await batch.commit();
    // Eliminar de Firebase Auth (best-effort, no bloqueante)
    await Promise.allSettled(
      results.deleted.map(uid => auth.deleteUser(uid).catch(() => {}))
    );
    return res.json({ ok: true, deleted: results.deleted.length, failed: results.failed.length });
  } catch (err) {
    console.error("Error en POST /admin/users/bulk-delete:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/users/bulk-status ─────────────────────────
// Cambia el status de múltiples usuarios
router.post("/users/bulk-status", verifyToken, checkRole("admin"), async (req, res) => {
  const { uids, status } = req.body;
  if (!Array.isArray(uids) || uids.length === 0) {
    return res.status(400).json({ ok: false, message: "Se requiere un array de uids" });
  }
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ ok: false, message: "status debe ser 'active' o 'inactive'" });
  }
  if (uids.length > 50) {
    return res.status(400).json({ ok: false, message: "Máximo 50 usuarios por operación" });
  }

  try {
    const batch = db.batch();
    const now = new Date().toISOString();
    uids.forEach(uid => {
      batch.update(db.collection("users").doc(uid), { status, updatedAt: now });
    });
    await batch.commit();
    return res.json({ ok: true, updated: uids.length });
  } catch (err) {
    console.error("Error en POST /admin/users/bulk-status:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/maintenance/cache ──────────────────────────
// Limpia caché (simulado, ya que no hay caché persistente)
router.post("/maintenance/cache", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    // Simular limpieza de caché
    console.log("Cache cleared by admin");
    await new Promise(r => setTimeout(r, 1000)); // Simular delay
    res.json({ ok: true, message: "Caché limpiado exitosamente" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/maintenance/sessions ───────────────────────
// Fuerza cierre de todas las sesiones activas
router.post("/maintenance/sessions", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    // Actualizar lastLogoutAt para todos los usuarios activos
    const batch = db.batch();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("status", "==", "active").get();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: "inactive",
        lastLogoutAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    res.json({ ok: true, message: `Sesiones cerradas para ${snapshot.size} usuarios` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/maintenance/logs ───────────────────────────
// Limpia logs antiguos (simulado)
router.post("/maintenance/logs", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    // Simular limpieza de logs
    console.log("Logs cleaned by admin");
    await new Promise(r => setTimeout(r, 1500));
    res.json({ ok: true, message: "Logs limpiados exitosamente" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/admin/maintenance/export/users ────────────────────
// Exporta usuarios como CSV
router.get("/maintenance/export/users", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => doc.data());

    // Crear CSV
    const headers = ["uid", "username", "email", "heroClass", "level", "xp", "streak", "hp", "status", "roleId", "createdAt"];
    const csv = [
      headers.join(","),
      ...users.map(u => headers.map(h => `"${u[h] || ''}"`).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/admin/maintenance/export/sessions ─────────────────
// Exporta sesiones como CSV
router.get("/maintenance/export/sessions", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("activityLog").get();
    const sessions = snapshot.docs.map(doc => doc.data());

    const headers = ["userId", "exerciseId", "duration", "xpGained", "timestamp"];
    const csv = [
      headers.join(","),
      ...sessions.map(s => headers.map(h => `"${s[h] || ''}"`).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sessions.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/admin/maintenance/export/config ───────────────────
// Exporta configuración como JSON
router.get("/maintenance/export/config", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const configDoc = await db.collection("config").doc("global").get();
    const config = configDoc.exists ? configDoc.data() : {};

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=config.json");
    res.send(JSON.stringify(config, null, 2));
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/maintenance/reset-xp ───────────────────────
// Resetea XP de todos los usuarios
router.post("/maintenance/reset-xp", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const batch = db.batch();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        xp: 0,
        level: 1,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    res.json({ ok: true, message: `XP reseteado para ${snapshot.size} usuarios` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/maintenance/delete-inactive ────────────────
// Elimina usuarios inactivos (+90 días)
router.post("/maintenance/delete-inactive", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const batch = db.batch();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("lastLoginAt", "<", ninetyDaysAgo.toISOString()).get();

    const deletePromises = snapshot.docs.map(async doc => {
      const uid = doc.id;
      batch.delete(doc.ref);
      try {
        await auth.deleteUser(uid);
      } catch (e) {
        console.warn(`Could not delete auth user ${uid}:`, e.message);
      }
    });

    await Promise.all(deletePromises);
    await batch.commit();

    res.json({ ok: true, message: `${snapshot.size} usuarios inactivos eliminados` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:uid/coins ─────────────────────────
// Añade o deduce monedas de un usuario (amount puede ser negativo)
router.patch("/users/:uid/coins", verifyToken, checkRole("admin"), async (req, res) => {
  const { uid } = req.params;
  const { amount, reason = "" } = req.body;

  if (typeof amount !== "number" || isNaN(amount)) {
    return res.status(400).json({ ok: false, message: "amount debe ser un número" });
  }

  try {
    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const currentCoins = Number(doc.data().coins || 0);
    const newCoins = Math.max(0, currentCoins + amount);

    await ref.update({
      coins: newCoins,
      updatedAt: new Date().toISOString(),
    });

    // Log en subcolección del usuario
    await ref.collection("coinLog").add({
      amount,
      reason,
      balanceBefore: currentCoins,
      balanceAfter: newCoins,
      byAdmin: req.user.uid,
      createdAt: new Date().toISOString(),
    });

    return res.json({ ok: true, coins: newCoins, message: `Monedas actualizadas: ${amount > 0 ? "+" : ""}${amount}` });
  } catch (err) {
    console.error("Error en PATCH /admin/users/:uid/coins:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/admin/test-email ───────────────────────────────
// Probar envío de email con la configuración actual
router.post("/test-email", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { type = "welcome" } = req.body;

    // Obtener configuración de email
    const configDoc = await db.collection("config").doc("global").get();
    const config = configDoc.exists ? configDoc.data() : {};
    const emailConfig = config.notificaciones || {};

    // Usar datos de prueba
    const testData = {
      to: emailConfig.smtpUser || "test@example.com",
      username: "UsuarioPrueba",
      heroClass: "GUERRERO"
    };

    // Importar dinámicamente las funciones de email
    const { sendWelcomeEmail, sendAchievementEmail, sendStreakEmail, sendWeeklyEmail } = await import("../services/email.service.js");

    switch (type) {
      case "welcome":
        await sendWelcomeEmail(testData.to, testData.username, testData.heroClass);
        break;
      case "achievement":
        await sendAchievementEmail(testData.to, testData.username, "Primer Entrenamiento", "Completaste tu primera sesión", 50);
        break;
      case "streak":
        await sendStreakEmail(testData.to, testData.username, 7, 1);
        break;
      case "weekly":
        await sendWeeklyEmail(testData.to, testData.username, {
          sessionsCompleted: 5,
          totalXp: 250,
          levelProgress: 75,
          achievements: [
            { name: "Entrenador Dedicado", xp: 100 },
            { name: "Racha de 3 días", xp: 50 }
          ],
          bestDay: "Lunes",
          totalTime: 180
        });
        break;
      default:
        return res.status(400).json({ ok: false, message: "Tipo de email no válido" });
    }

    res.json({ ok: true, message: `Email de prueba (${type}) enviado correctamente` });
  } catch (err) {
    console.error("Error enviando email de prueba:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
