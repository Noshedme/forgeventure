// src/routes/auth.routes.js
import { Router } from "express";
import admin, { db, auth } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { sendWelcomeEmail, sendResetCodeEmail } from "../services/email.service.js";
import { validateNoProfanity } from "../utils/profanityFilter.js";
import { bustAllCaches } from "../utils/userCache.js";

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

  // Filtro de groserías en el nombre de usuario
  const profanityError = validateNoProfanity(username, "nombre de usuario");
  if (profanityError) {
    return res.status(400).json({ ok: false, message: profanityError });
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
      usernameLower:       username.trim().toLowerCase(),
      heroClass,
      roleId:              "user",
      photoURL:            photoURL || null,
      level:               1,
      xp:                  0,
      xpTotal:             0,
      xpNext:              100,
      hp:                  100,
      streak:              0,
      coins:               0,
      badges:              [],
      firstLogin:          true,
      onboardingCompleted: false,   // ← mostrar cuestionario en primer ingreso
      usernameChanged:     false,
      createdAt:           now,
      lastLoginAt:         now,
    });

    // Registro en activityLog (no bloqueante)
    db.collection("activityLog").add({
      uid,
      type:      "register",
      message:   `${username} se unió a ForgeVenture como ${heroClass}`,
      icon:      "⚔️",
      color:     "#E85D04",
      timestamp: now,
    }).catch(() => {});

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

// ── GET /api/auth/check-username/:username ────────────────────
// Verifica si un username ya está en uso (sin autenticación)
router.get("/check-username/:username", async (req, res) => {
  const { username } = req.params;
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ ok: false, message: "Username inválido" });
  }
  try {
    const snap = await db.collection("users")
      .where("username", "==", username.trim())
      .limit(1)
      .get();
    return res.json({ ok: true, available: snap.empty });
  } catch (err) {
    console.error("Error en /check-username:", err);
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
    const data = doc.data();
    // Cuenta en papelera — bloquear acceso hasta restauración
    if (data.status === "deleted") {
      return res.status(403).json({ ok: false, code: "ACCOUNT_DELETED", message: "Esta cuenta ha sido eliminada" });
    }
    return res.json({ ok: true, user: data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PATCH /api/auth/profile ────────────────────────────────────
// Actualiza datos del perfil del usuario autenticado
router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const {
      username,
      heroName,
      bio,
      heroClass,
      titulo,
      profileModules,
      pendingEmailTarget,
      pendingEmailStatus,
      pendingEmailRequestedAt,
      pendingEmailResolvedAt,
    } = req.body;

    const hasProfileUpdate =
      username !== undefined ||
      heroName !== undefined ||
      bio !== undefined ||
      heroClass !== undefined ||
      titulo !== undefined ||
      profileModules !== undefined ||
      pendingEmailTarget !== undefined ||
      pendingEmailStatus !== undefined ||
      pendingEmailRequestedAt !== undefined ||
      pendingEmailResolvedAt !== undefined;

    if (!hasProfileUpdate) {
      return res.status(400).json({ ok: false, message: "No se enviaron campos para actualizar" });
    }

    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: "Perfil no encontrado" });
    }

    const data = doc.data();

    // Filtro de groserías en campos de texto público
    const fieldsToCheck = [
      [username, "nombre de usuario"],
      [heroName, "nombre de héroe"],
      [bio,      "biografía"],
      [titulo,   "título"],
    ];
    for (const [value, label] of fieldsToCheck) {
      if (value !== undefined) {
        const err = validateNoProfanity(value, label);
        if (err) return res.status(400).json({ ok: false, message: err });
      }
    }

    // ── Cost logic ────────────────────────────────────────────────
    const USERNAME_COST = 500;
    const CLASS_COST    = 1000;

    const usernameActuallyChanged =
      username !== undefined &&
      username.trim() !== "" &&
      username.trim() !== data.username;

    const classActuallyChanged =
      heroClass !== undefined && heroClass !== data.heroClass;

    let coinDeduction = 0;

    if (usernameActuallyChanged && data.usernameChanged) {
      if ((data.coins || 0) < USERNAME_COST) {
        return res.status(400).json({
          ok: false, code: "INSUFFICIENT_COINS",
          message: `Necesitas ${USERNAME_COST} monedas para cambiar el nombre. Tienes ${data.coins || 0}.`,
        });
      }
      coinDeduction += USERNAME_COST;
    }

    if (classActuallyChanged) {
      if ((data.coins || 0) - coinDeduction < CLASS_COST) {
        return res.status(400).json({
          ok: false, code: "INSUFFICIENT_COINS",
          message: `Necesitas ${CLASS_COST} monedas para cambiar de clase. Tienes ${(data.coins || 0) - coinDeduction}.`,
        });
      }
      coinDeduction += CLASS_COST;
    }
    // ─────────────────────────────────────────────────────────────

    const updates = {};
    if (username !== undefined) { updates.username = username.trim(); updates.usernameLower = username.trim().toLowerCase(); }
    if (heroName !== undefined) updates.heroName = heroName.trim();
    if (bio      !== undefined) updates.bio      = bio.trim();
    if (heroClass !== undefined) updates.heroClass = heroClass;
    if (titulo !== undefined)   updates.titulo = titulo.trim();
    if (profileModules !== undefined) {
      const currentModules = typeof data.profileModules === "object" && data.profileModules !== null
        ? data.profileModules
        : {};
      const incomingModules = typeof profileModules === "object" && profileModules !== null
        ? profileModules
        : null;
      if (!incomingModules) {
        return res.status(400).json({ ok: false, message: "profileModules debe ser un objeto valido" });
      }

      const allowedTabs = new Set(["estadisticas", "progreso", "historial"]);
      const allowedKeys = new Set(["focus", "pin", "note", "lastViewedAt"]);
      const mergedModules = { ...currentModules };

      for (const [tabKey, rawTabValue] of Object.entries(incomingModules)) {
        if (!allowedTabs.has(tabKey)) continue;
        const currentTabValue = typeof currentModules[tabKey] === "object" && currentModules[tabKey] !== null
          ? currentModules[tabKey]
          : {};
        const incomingTabValue = typeof rawTabValue === "object" && rawTabValue !== null
          ? rawTabValue
          : {};

        const nextTabValue = { ...currentTabValue };
        for (const [fieldKey, fieldValue] of Object.entries(incomingTabValue)) {
          if (!allowedKeys.has(fieldKey)) continue;
          if (fieldKey === "lastViewedAt") {
            nextTabValue[fieldKey] = fieldValue || "";
          } else {
            nextTabValue[fieldKey] = String(fieldValue || "").trim();
          }
        }
        mergedModules[tabKey] = nextTabValue;
      }

      updates.profileModules = mergedModules;
    }
    if (pendingEmailTarget !== undefined) {
      const normalizedPending = String(pendingEmailTarget || "").trim().toLowerCase();
      if (normalizedPending && !/\S+@\S+\.\S+/.test(normalizedPending)) {
        return res.status(400).json({ ok: false, message: "El correo pendiente no tiene un formato válido" });
      }
      updates.pendingEmailTarget = normalizedPending;
    }
    if (pendingEmailStatus !== undefined) {
      updates.pendingEmailStatus = String(pendingEmailStatus || "idle").trim() || "idle";
    }
    if (pendingEmailRequestedAt !== undefined) {
      updates.pendingEmailRequestedAt = pendingEmailRequestedAt || "";
    }
    if (pendingEmailResolvedAt !== undefined) {
      updates.pendingEmailResolvedAt = pendingEmailResolvedAt || "";
    }
    updates.updatedAt = new Date().toISOString();

    // Mark first free username change as used
    if (usernameActuallyChanged && !data.usernameChanged) {
      updates.usernameChanged = true;
    }
    // Deduct coins for paid changes
    if (coinDeduction > 0) {
      updates.coins = (data.coins || 0) - coinDeduction;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, message: "Datos sin cambios válidos" });
    }

    await ref.update(updates);

    // Activity log for paid changes (non-blocking)
    if (coinDeduction > 0) {
      const now = new Date().toISOString();
      if (usernameActuallyChanged && data.usernameChanged) {
        db.collection("activityLog").add({
          uid, type: "username_change",
          message: `Cambió nombre: ${data.username} → ${username.trim()}`,
          icon: "✏️", color: "#FF9F1C",
          amount: -USERNAME_COST, timestamp: now,
        }).catch(() => {});
      }
      if (classActuallyChanged) {
        db.collection("activityLog").add({
          uid, type: "class_change",
          message: `Cambió clase: ${data.heroClass} → ${heroClass}`,
          icon: "🎭", color: "#9B59B6",
          amount: -CLASS_COST, timestamp: now,
        }).catch(() => {});
      }
    }

    // Actualizar displayName en Firebase Auth si cambia username
    if (username !== undefined) {
      try {
        await auth.updateUser(uid, { displayName: username.trim() });
      } catch (userErr) {
        console.warn("No se pudo actualizar displayName en Firebase Auth:", userErr.message);
      }
    }

    bustAllCaches(uid);
    const updated = await ref.get();
    return res.json({ ok: true, user: updated.data() });
  } catch (err) {
    console.error("Error en PATCH /auth/profile:", err);
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

// ── PATCH /api/auth/change-password ──────────────────────────
// Cambia la contraseña del usuario autenticado
router.patch("/change-password", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    // Verificar contraseña actual (si se proporciona)
    if (currentPassword) {
      try {
        // Firebase Auth no permite verificar contraseña directamente desde backend
        // En producción, esto debería hacerse desde el frontend usando reauthenticateWithCredential
        // Por ahora, asumimos que la validación se hace en frontend
      } catch (authErr) {
        return res.status(400).json({ ok: false, message: "Contraseña actual incorrecta" });
      }
    }

    // Actualizar contraseña en Firebase Auth
    await auth.updateUser(uid, { password: newPassword });

    return res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en PATCH /auth/change-password:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── DELETE /api/auth/profile ──────────────────────────────────
// Soft-delete: deshabilita cuenta (recuperable por admin en 3 días)
router.delete("/profile", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { confirmUsername } = req.body;

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();
    if (confirmUsername !== userData.username) {
      return res.status(400).json({ ok: false, message: "El nombre de usuario no coincide" });
    }

    const now = new Date().toISOString();

    // Soft-delete: marcar en Firestore y deshabilitar en Firebase Auth
    await db.collection("users").doc(uid).update({
      status:    "deleted",
      deletedAt: now,
    });
    await auth.updateUser(uid, { disabled: true });

    // Registro no bloqueante
    db.collection("activityLog").add({
      uid, type: "account_deleted",
      message: `${userData.username} eliminó su cuenta`,
      icon: "🗑️", color: "#E74C3C",
      timestamp: now,
    }).catch(() => {});

    return res.json({ ok: true, message: "Cuenta eliminada. El admin puede restaurarla en los próximos 3 días." });
  } catch (err) {
    console.error("Error en DELETE /auth/profile:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});
// ── POST /api/auth/onboarding ──────────────────────────────────
// Guarda las respuestas del cuestionario inicial, calcula el perfil
// de fitness del usuario y marca onboardingCompleted = true.
// Solo se puede completar UNA VEZ (flag permanente).
router.post("/onboarding", verifyToken, async (req, res) => {
  try {
    const uid     = req.user.uid;
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    const userData = userDoc.data();

    // Idempotencia: si ya completó el onboarding no repetir
    if (userData.onboardingCompleted === true) {
      return res.json({ ok: true, message: "Onboarding ya completado", skipped: true });
    }

    const { answers } = req.body; // objeto con las respuestas { q1, q2, … }
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ ok: false, message: "Faltan las respuestas del cuestionario" });
    }

    // ── Calcular nivel de fitness ──────────────────────────────
    // q1: frecuencia  (0=nunca, 1=1-2x, 2=3-4x, 3=diario)
    // q3: condicion   (0=cansado, 1=ligero, 2=buena, 3=muy buena)
    const freqScore = Number(answers.q1?.score ?? 0);
    const condScore = Number(answers.q3?.score ?? 0);
    const total     = freqScore + condScore;

    let fitnessLevel, fitnessLabel, defaultRoutineTag, coinsBonus;
    if (total <= 1) {
      fitnessLevel     = "beginner";
      fitnessLabel     = "Iniciante";
      defaultRoutineTag = "beginner";
      coinsBonus        = 150;
    } else if (total <= 3) {
      fitnessLevel     = "intermediate";
      fitnessLabel     = "Intermedio";
      defaultRoutineTag = "intermediate";
      coinsBonus        = 100;
    } else {
      fitnessLevel     = "advanced";
      fitnessLabel     = "Avanzado";
      defaultRoutineTag = "advanced";
      coinsBonus        = 50;
    }

    const now = new Date().toISOString();

    // ── Actualizar perfil ──────────────────────────────────────
    await userRef.update({
      onboardingCompleted: true,
      onboardingAnswers:   answers,
      onboardingDate:      now,
      fitnessLevel,
      fitnessLabel,
      defaultRoutineTag,
      coins: (userData.coins || 0) + coinsBonus,
      updatedAt: now,
    });

    // ── Asignar rutinas según nivel ────────────────────────────
    // Mapear nivel → dificultad en Firestore
    const dificultadMap = {
      beginner:     "Principiante",
      intermediate: "Intermedio",
      advanced:     "Avanzado",
    };
    const dificultadTarget = dificultadMap[fitnessLevel];

    // Días de entrenamiento por nivel
    const diasPorNivel = {
      beginner:     ["Lun", "Mié", "Vie"],
      intermediate: ["Lun", "Mar", "Jue", "Sáb"],
      advanced:     ["Lun", "Mar", "Mié", "Jue", "Vie"],
    };
    const diasAsignados = diasPorNivel[fitnessLevel];

    try {
      const rutinasSnap = await db.collection("rutinas")
        .where("activo", "==", true)
        .where("dificultad", "==", dificultadTarget)
        .limit(3)
        .get();

      const progressRef = db.collection("users").doc(uid).collection("progress");
      const batch = db.batch();

      rutinasSnap.forEach(doc => {
        const progDoc = progressRef.doc(`rutina_${doc.id}`);
        batch.set(progDoc, {
          asignada:   true,
          diasSemana: diasAsignados,
          assignedAt: now,
          fitnessLevel,
        }, { merge: true });
      });

      await batch.commit();
    } catch (routineErr) {
      // Non-fatal — profile saved, routine assignment failed
      console.warn("Routine assignment failed:", routineErr.message);
    }

    // Log de actividad
    db.collection("activityLog").add({
      uid,
      type:      "onboarding_completed",
      message:   `${userData.username} completó su perfil inicial — Nivel: ${fitnessLabel}`,
      icon:      "🧭",
      color:     "#E85D04",
      timestamp: now,
    }).catch(() => {});

    return res.json({
      ok: true,
      fitnessLevel,
      fitnessLabel,
      defaultRoutineTag,
      coinsBonus,
    });
  } catch (err) {
    console.error("Error en POST /auth/onboarding:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/auth/daily-bonus ─────────────────────────────────
// Reclama el bonus diario de login. Idempotente: una sola vez por día UTC.
// Actualiza streak, XP, coins y lastDailyBonusDate del usuario.
router.post("/daily-bonus", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const FieldValue = admin.firestore.FieldValue;

  // ── helpers de fecha UTC ──────────────────────────────────────
  function utcDateStr(offsetDays = 0) {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  }

  // ── tabla de recompensas ──────────────────────────────────────
  const MILESTONES = { 7:true, 14:true, 30:true, 60:true, 100:true };
  const MILESTONE_BONUSES = {
    7:   { xp:100,  coins:75,  badge:"racha_7dias",   msg:"¡UNA SEMANA SEGUIDA! 🔥" },
    14:  { xp:200,  coins:150, badge:"racha_14dias",  msg:"¡DOS SEMANAS ÉPICAS! ⚡" },
    30:  { xp:500,  coins:350, badge:"racha_30dias",  msg:"¡UN MES LEGENDARIO! 👑" },
    60:  { xp:1000, coins:700, badge:"racha_60dias",  msg:"¡60 DÍAS IMPARABLES! 💎" },
    100: { xp:2500, coins:1500,badge:"racha_100dias", msg:"¡CENTURIÓN ABSOLUTO! 🏆" },
  };

  function calcReward(streak) {
    const mb = MILESTONE_BONUSES[streak];
    if (mb) return { xp:mb.xp, coins:mb.coins, isMilestone:true, milestoneMsg:mb.msg, badge:mb.badge };

    // XP y monedas escalan con la racha
    let tier;
    if      (streak >= 100) tier = 5;
    else if (streak >= 60)  tier = 4;
    else if (streak >= 30)  tier = 3;
    else if (streak >= 14)  tier = 2.5;
    else if (streak >= 7)   tier = 2;
    else                    tier = 1 + (streak - 1) * 0.1; // +10% por día hasta el día 7

    return {
      xp:          Math.round(20 * tier),
      coins:       Math.round(10 * tier),
      isMilestone: false,
      milestoneMsg: null,
      badge:       null,
    };
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const today   = utcDateStr(0);
    const yesterday = utcDateStr(-1);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("Perfil no encontrado");

      const data = snap.data();
      const lastBonus = data.lastDailyBonusDate || null;

      // Ya reclamado hoy
      if (lastBonus === today) {
        return {
          alreadyClaimed: true,
          streak: data.streak || 0,
          streakShield: data.streakShield || null,
          streakProtected: false,
          shieldConsumed: false,
          shieldSource: null,
        };
      }

      // Calcular nueva racha y protegerla si el usuario tenia amuleto/escudo.
      const nowIso = new Date().toISOString();
      const prevStreak = data.streak || 0;
      const missedStreak = Boolean(lastBonus && lastBonus !== yesterday && prevStreak > 0);
      let streakProtected = false;
      let shieldConsumed = false;
      let shieldSource = null;
      let shieldInventoryRef = null;
      let shieldInventoryQty = 0;

      const activeShield = data.streakShield || null;
      if (missedStreak && activeShield?.expiresAt && activeShield.expiresAt > nowIso) {
        streakProtected = true;
        shieldConsumed = false;
        shieldSource = "active";
      } else if (missedStreak) {
        const invSnap = await tx.get(userRef.collection("inventory").where("cantidad", ">", 0));
        const shieldDoc = invSnap.docs.find((doc) => {
          const item = doc.data();
          const effects = Array.isArray(item.efectos) ? item.efectos : [];
          const hasShieldEffect = effects.some((ef) => ef?.tipo === "streak_shield");
          const name = `${item.nombre || ""} ${item.descripcion || ""}`.toLowerCase();
          return hasShieldEffect || /amuleto|racha|escudo/.test(name);
        });

        if (shieldDoc) {
          const shieldItem = shieldDoc.data();
          streakProtected = true;
          shieldConsumed = true;
          shieldSource = "inventory";
          shieldInventoryRef = shieldDoc.ref;
          shieldInventoryQty = Number(shieldItem.cantidad || 1);
        }
      }

      const newStreak = lastBonus === yesterday
        ? prevStreak + 1
        : streakProtected
          ? prevStreak + 1
          : 1;
      const newMaxStreak = Math.max(data.maxStreak || 0, newStreak);
      const reward     = calcReward(newStreak);

      // Aplicar XP con lógica de nivel
      const currentXp      = data.xp    || 0;
      const currentXpTotal = data.xpTotal || 0;
      const currentLevel   = data.level  || 1;
      const currentCoins   = data.coins  || 0;

      const newXpTotal = currentXpTotal + reward.xp;
      let   newXp      = currentXp + reward.xp;
      let   newLevel   = currentLevel;
      let   leveledUp  = false;

      let xpForNext = Math.floor(100 * Math.pow(currentLevel, 1.5));
      while (newXp >= xpForNext) {
        newXp    -= xpForNext;
        newLevel++;
        leveledUp = true;
        xpForNext = Math.floor(100 * Math.pow(newLevel, 1.5));
      }

      const updates = {
        streak:            newStreak,
        maxStreak:         newMaxStreak,
        lastDailyBonusDate: today,
        xp:                newXp,
        xpTotal:           newXpTotal,
        xpNext:            Math.floor(100 * Math.pow(newLevel, 1.5)),
        level:             newLevel,
        coins:             currentCoins + reward.coins,
        updatedAt:         nowIso,
      };

      // Badge de milestone
      if (reward.badge) {
        updates.badges = FieldValue.arrayUnion(reward.badge);
      }

      tx.update(userRef, updates);

      if (shieldInventoryRef) {
        if (shieldInventoryQty <= 1) {
          tx.delete(shieldInventoryRef);
        } else {
          tx.update(shieldInventoryRef, {
            cantidad: FieldValue.increment(-1),
            updatedAt: nowIso,
          });
        }
      }

      return {
        alreadyClaimed: false,
        streak:         newStreak,
        maxStreak:      newMaxStreak,
        xpGained:       reward.xp,
        coinsGained:    reward.coins,
        isMilestone:    reward.isMilestone,
        milestoneMsg:   reward.milestoneMsg,
        milestoneDay:   reward.isMilestone ? newStreak : null,
        badge:          reward.badge,
        leveledUp,
        newLevel,
        newXp,
        newCoins:       currentCoins + reward.coins,
        streakProtected,
        shieldConsumed,
        shieldSource,
        protectedFromStreak: streakProtected ? prevStreak : null,
        streakShield: activeShield,
      };
    });

    if (result.shieldConsumed) {
      db.collection("activityLog").add({
        uid,
        type: "streak_shield_consumed",
        message: "Un amuleto protector salvo tu racha diaria.",
        icon: "shield",
        color: "#f4cc78",
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Error en POST /auth/daily-bonus:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
