// src/routes/ejercicios.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Endpoints CRUD para Categorías, Rutinas y Ejercicios
// Firebase structure:
//   /ejercicios/categorias/{id}
//   /ejercicios/rutinas/{id}
//   /ejercicios/ejercicios/{id}
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";
const { FieldValue } = admin.firestore;
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { applyActiveBoosts } from "../services/boosts.service.js";
import { getSkillXpBonus }  from "../services/skillTree.js";
import { getISOWeekKey } from "../utils/weekUtils.js";
import { utcDateStr, calcChallengeReward, CHALLENGE_MIN_STREAK } from "../utils/challengeUtils.js";
import { bustUserCache } from "../utils/userCache.js";
import { getCachedAchievements } from "../utils/achievementEngine.js";

const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════
// CATEGORÍAS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/ejercicios/categorias-publicas - Categorías activas para usuarios
router.get("/categorias-publicas", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("ejercicios").doc("categorias").collection("items")
      .where("activo", "==", true).get();
    // Si no hay activas, devolver todas
    const docs = snap.empty
      ? (await db.collection("ejercicios").doc("categorias").collection("items").get()).docs
      : snap.docs;
    const categorias = docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ ok: true, categorias });
  } catch (err) {
    console.error("Error fetching categorias-publicas:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/ejercicios/categorias - Listar todas las categorías
router.get("/categorias", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snap = await db.collection("ejercicios").doc("categorias").collection("items").get();
    const categorias = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ categorias });
  } catch (err) {
    console.error("Error fetching categorias:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ejercicios/categorias - Crear categoría
router.post("/categorias", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { nombre, descripcion, icono, color } = req.body;
    if (!nombre) return res.status(400).json({ error: "nombre requerido" });

    const docRef = db.collection("ejercicios").doc("categorias").collection("items").doc();
    await docRef.set({
      nombre,
      descripcion: descripcion || "",
      icono: icono || "💪",
      color: color || "#E85D04",
      activo: true,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ id: docRef.id, success: true });
  } catch (err) {
    console.error("Error creating categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/ejercicios/categorias/:id - Actualizar categoría
router.patch("/categorias/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, actualizadoEn: new Date().toISOString() };
    delete updates.id;

    await db.collection("ejercicios").doc("categorias").collection("items").doc(id).update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ejercicios/categorias/:id - Eliminar categoría
router.delete("/categorias/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("ejercicios").doc("categorias").collection("items").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// RUTINAS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/ejercicios/rutinas?categoria={id} - Listar rutinas (opcionalmente filtradas) - ADMIN
router.get("/rutinas", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = db.collection("ejercicios").doc("rutinas").collection("items");

    if (categoria) {
      query = query.where("categoria", "==", categoria);
    }

    const snap = await query.get();
    const rutinas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ rutinas });
  } catch (err) {
    console.error("Error fetching rutinas:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ejercicios/rutinas-publicas - Listar rutinas activas para usuarios
router.get("/rutinas-publicas", verifyToken, async (req, res) => {
  try {
    let snap = await db.collection("ejercicios").doc("rutinas").collection("items")
      .where("activo", "==", true).get();

    // Si no hay rutinas activas, devolver todas
    const docs = snap.empty
      ? (await db.collection("ejercicios").doc("rutinas").collection("items").get()).docs
      : snap.docs;

    const rutinas = docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ rutinas });
  } catch (err) {
    console.error("Error fetching rutinas publicas:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ejercicios/debug-rutinas - Admin: ver todas las rutinas con conteo
router.get("/debug-rutinas", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snap = await db.collection("ejercicios").doc("rutinas").collection("items").get();
    const rutinas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ rutinas, count: rutinas.length });
  } catch (err) {
    console.error("Error in debug rutinas:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ejercicios/rutinas - Crear rutina (guarda TODOS los campos del admin)
router.post("/rutinas", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { nombre, categoria } = req.body;
    if (!nombre || !categoria) return res.status(400).json({ error: "nombre y categoria requeridos" });

    const now = new Date().toISOString();
    const docRef = db.collection("ejercicios").doc("rutinas").collection("items").doc();
    await docRef.set({
      // Valores por defecto + spread del body completo (pasos, xpTotal, diasSemana, etc.)
      descripcion: "",
      dificultad:  "Intermedio",
      duracionMin: 30,
      xpTotal:     100,
      pasos:       [],
      diasSemana:  [],
      subcategoria:"",
      activo:      true,
      sesiones:    0,
      ...req.body,
      creadoEn:      now,
      actualizadoEn: now,
    });

    res.json({ id: docRef.id, success: true });
  } catch (err) {
    console.error("Error creating rutina:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/ejercicios/rutinas/:id - Actualizar rutina
router.patch("/rutinas/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, actualizadoEn: new Date().toISOString() };
    delete updates.id;

    await db.collection("ejercicios").doc("rutinas").collection("items").doc(id).update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating rutina:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ejercicios/rutinas/:id - Eliminar rutina
router.delete("/rutinas/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("ejercicios").doc("rutinas").collection("items").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting rutina:", err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// EJERCICIOS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/ejercicios/ejercicios-publicos - Ejercicios activos para usuarios
router.get("/ejercicios-publicos", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("ejercicios").doc("ejercicios").collection("items")
      .where("activo", "==", true).get();
    const docs = snap.empty
      ? (await db.collection("ejercicios").doc("ejercicios").collection("items").get()).docs
      : snap.docs;
    const ejercicios = docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ ok: true, ejercicios });
  } catch (err) {
    console.error("Error fetching ejercicios-publicos:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/ejercicios/ejercicios?categoria={id}&rutina={id} - Listar ejercicios
router.get("/ejercicios", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { categoria, rutina } = req.query;
    let query = db.collection("ejercicios").doc("ejercicios").collection("items");

    if (categoria) {
      query = query.where("categoria", "==", categoria);
    }
    if (rutina) {
      query = query.where("rutinas", "array-contains", rutina);
    }

    const snap = await query.get();
    const ejercicios = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ ejercicios });
  } catch (err) {
    console.error("Error fetching ejercicios:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ejercicios/ejercicios - Crear ejercicio
router.post("/ejercicios", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { nombre, descripcion, categoria, musculos, dificultad, series, reps, duracion, xpBase, verificacion, imagen } = req.body;
    if (!nombre || !categoria) return res.status(400).json({ error: "nombre y categoria requeridos" });

    const docRef = db.collection("ejercicios").doc("ejercicios").collection("items").doc();
    await docRef.set({
      nombre,
      descripcion: descripcion || "",
      categoria,
      musculos: musculos || [],
      dificultad: dificultad || "Principiante",
      series: series || 3,
      reps: reps || 10,
      duracion: duracion || null,
      xpBase: xpBase || 25,
      verificacion: verificacion || "Cámara",
      imagen: imagen || "💪",
      rutinas: [],
      sesiones: 0,
      activo: true,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ id: docRef.id, success: true });
  } catch (err) {
    console.error("Error creating ejercicio:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/ejercicios/ejercicios/:id - Actualizar ejercicio
router.patch("/ejercicios/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, actualizadoEn: new Date().toISOString() };
    delete updates.id;

    await db.collection("ejercicios").doc("ejercicios").collection("items").doc(id).update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating ejercicio:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ejercicios/ejercicios/:id - Eliminar ejercicio
router.delete("/ejercicios/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("ejercicios").doc("ejercicios").collection("items").doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting ejercicio:", err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// SESIONES DE USUARIO
// ══════════════════════════════════════════════════════════════════════════

// POST /api/ejercicios/completar-sesion - Completar una sesión de ejercicio
router.post("/completar-sesion", verifyToken, async (req, res) => {
  try {
    const { ejercicioId, tiempoRealizado, repsRealizadas, xpGanado, bossMode } = req.body;
    const uid = req.user.uid;

    if (!ejercicioId) {
      return res.status(400).json({ error: "ejercicioId requerido" });
    }

    // Una sola lectura del ejercicio — reutilizada para XP, skill bonuses y nombre
    const ejercicioRef = db.collection("ejercicios").doc("ejercicios").collection("items").doc(ejercicioId);
    const userRef      = db.collection("users").doc(uid);
    const [ejercicioDoc, userDoc] = await Promise.all([ejercicioRef.get(), userRef.get()]);

    if (!ejercicioDoc.exists) return res.status(404).json({ error: "Ejercicio no encontrado" });
    if (!userDoc.exists)      return res.status(404).json({ error: "Usuario no encontrado" });

    const ejercicioData = ejercicioDoc.data();
    const userData      = userDoc.data();
    const currentLevel  = userData.level    || 1;
    const currentXp     = userData.xp       || 0;
    const currentXpTotal = userData.xpTotal || 0;

    let xpFinal = xpGanado || ejercicioData.xpBase || 25;

    // Boss mode bonus — defeating the boss earns extra XP + coins
    let bossCoinsAwarded = 0;
    if (bossMode === true) {
      xpFinal += 100;
      bossCoinsAwarded = 30;
    }

    // Aplicar bonos del árbol de habilidades del usuario
    const unlockedSkills = userData.unlockedSkills || [];
    if (unlockedSkills.length > 0) {
      const skillPct = getSkillXpBonus(unlockedSkills, ejercicioData, userData.heroClass, userData.streak || 0);
      if (skillPct > 0) xpFinal = Math.round(xpFinal * (1 + skillPct / 100));
    }

    // Aplicar boosts activos
    const { xpFinal: xpFinalBoosted, boosted: xpBoosted } = applyActiveBoosts(xpFinal, userData);
    if (xpBoosted) xpFinal = xpFinalBoosted;

    // Calcular nuevo XP total
    const newXpTotal = currentXpTotal + xpFinal;

    // Nivel calculado con la misma fórmula flat usada en toda la app
    const newLevel = Math.floor(Math.sqrt(newXpTotal / 100)) + 1;
    const newXp    = currentXp + xpFinal;
    const leveledUp = newLevel > currentLevel;

    // Actualizar progreso del ejercicio específico
    const userProgressRef = userRef.collection("progress").doc(ejercicioId);
    const progressDoc = await userProgressRef.get();
    const currentProgress = progressDoc.exists ? progressDoc.data() : { completadas: 0, xpGanado: 0 };

    const sessionStamp = new Date().toISOString();
    const currentWeeklyLog = Array.isArray(currentProgress.weeklyLog) ? currentProgress.weeklyLog : [];
    const weekFloor = new Date(Date.now() - 7 * 86400000).toISOString();
    const weeklyLog = [
      ...currentWeeklyLog.filter(entry => (entry?.date || "") >= weekFloor),
      {
        date: sessionStamp,
        xpGanado: xpFinal,
        tiempoRealizado: tiempoRealizado || null,
        repsRealizadas: repsRealizadas || null,
      },
    ].slice(-14);

    const updatedProgress = {
      completadas: currentProgress.completadas + 1,
      xpGanado: currentProgress.xpGanado + xpFinal,
      ultimoCompletado: sessionStamp,
      tiempoRealizado: tiempoRealizado || null,
      repsRealizadas: repsRealizadas || null,
      weeklyLog,
    };

    // ── Streak tracking (sesión individual) ─────────────────────
    const nowIso     = new Date().toISOString();
    const todayDate  = nowIso.slice(0, 10);
    const yesterday  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastAct    = (userData.lastActivityDate || "").slice(0, 10);
    let newStreak    = Number(userData.streak || 0);
    if (lastAct === todayDate)      { /* ya contado */ }
    else if (lastAct === yesterday) { newStreak += 1; }
    else {
      // Consumir streakShield si está activo antes de resetear
      const shield = userData.streakShield;
      if (shield?.expiresAt && shield.expiresAt > nowIso) {
        newStreak = newStreak; // shield protege la racha
      } else {
        newStreak = 1;
      }
    }
    const newMaxStreak = Math.max(newStreak, Number(userData.maxStreak || 0));

    // ── Categoría del ejercicio → contadores de logros ──────────
    const catRaw = String(ejercicioData.categoria || "").toLowerCase().trim();
    const catField =
      /cardio|cardiov|aerob/.test(catRaw)  ? "cardioSesiones"  :
      /flex|mobil|estira/.test(catRaw)      ? "flexSesiones"    :
      /fuerza|resist|muscu|weight|pesa/.test(catRaw) ? "fuerzaSesiones" :
      null;

    // Actualizar perfil del usuario
    const updatedUserData = {
      level: newLevel,
      xp: newXp,
      xpTotal: newXpTotal,
      xpNext: Math.pow(newLevel, 2) * 100,
      streak: newStreak,
      maxStreak: newMaxStreak,
      lastActivityDate: todayDate,
      updatedAt: nowIso,
      totalSesiones: FieldValue.increment(1),
      ...(catField ? { [catField]: FieldValue.increment(1) } : {}),
      ...(repsRealizadas > 0 ? { totalReps: FieldValue.increment(repsRealizadas) } : {}),
      ...(tiempoRealizado > 0 ? { totalMinutes: FieldValue.increment(Math.round(tiempoRealizado / 60)) } : {}),
    };

    // Award coins for boss defeat
    if (bossCoinsAwarded > 0) {
      updatedUserData.coins = FieldValue.increment(bossCoinsAwarded);
      updatedUserData.lastBossDefeatedAt = new Date().toISOString();
      updatedUserData.bossDefeatsTotal   = FieldValue.increment(1);
    }

    // Weekly XP tracking — reset if new ISO week (Monday-based)
    const currentWeekKey = getISOWeekKey();
    updatedUserData.weeklyXPWeek = currentWeekKey;
    updatedUserData.weeklyXP = userData.weeklyXPWeek === currentWeekKey
      ? (userData.weeklyXP || 0) + xpFinal
      : xpFinal;

    // Si subió de nivel, agregar estadísticas y puntos de habilidad
    if (leveledUp) {
      updatedUserData.lastLevelUp   = new Date().toISOString();
      updatedUserData.totalLevelUps = (userData.totalLevelUps || 0) + (newLevel - currentLevel);
      // +1 skill point por cada nivel ganado
      updatedUserData.skillPoints = FieldValue.increment(newLevel - currentLevel);
    }

    // ejercicioData ya fue cargado al inicio junto con userDoc
    const ejercicioNombre = ejercicioData.nombre || ejercicioId;

    // Ejecutar todas las actualizaciones en una transacción
    await db.runTransaction(async (transaction) => {
      // Actualizar perfil del usuario
      transaction.update(userRef, updatedUserData);

      // Actualizar progreso del ejercicio en subcollection del usuario
      transaction.set(userProgressRef, updatedProgress, { merge: true });

      // Registrar actividad en colección canónica activityLog
      const activityRef = db.collection("activityLog").doc();
      transaction.set(activityRef, {
        uid,
        type: "exercise_complete",
        ejercicioId,
        exerciseName: ejercicioNombre,
        xpGained: xpFinal,
        levelBefore: currentLevel,
        levelAfter: newLevel,
        leveledUp,
        completed: true,
        icon: "💪",
        message: `Completó ${ejercicioNombre}`,
        timestamp: new Date().toISOString(),
        metadata: { tiempoRealizado, repsRealizadas },
      });
    });

    // ── Tracking de misiones — batch writes, un solo fetch del catálogo ─
    try {
      const EXERCISE_TYPES = ["exercise_complete", "ejercicios_completados", "sesiones", "sesiones_total", "completar_ejercicio"];
      const BOSS_TYPES     = ["boss_defeated", "jefe_derrotado"];
      const relevantTypes  = bossMode === true ? [...EXERCISE_TYPES, ...BOSS_TYPES] : EXERCISE_TYPES;

      const missionsSnap = await db.collection("missions").where("activo", "==", true).get();

      // Filtrar misiones con requisito relevante
      const relevantMissions = [];
      for (const missionDoc of missionsSnap.docs) {
        const requisito = missionDoc.data().requisitos?.find(r => relevantTypes.includes(r.tipo));
        if (requisito) relevantMissions.push({ doc: missionDoc, requisito });
      }

      if (relevantMissions.length > 0) {
        const userMissionsRef = db.collection("users").doc(uid).collection("missions");

        // Leer todos los docs de usuario en paralelo (evita N lecturas secuenciales)
        const userMissionDocs = await Promise.all(
          relevantMissions.map(({ doc }) => userMissionsRef.doc(doc.id).get())
        );

        const missionBatch = db.batch();
        let hasMissionUpdates = false;
        const now = new Date().toISOString();

        relevantMissions.forEach(({ doc: missionDoc, requisito }, i) => {
          const userSnap = userMissionDocs[i];
          const current  = userSnap.exists
            ? userSnap.data()
            : { progreso: 0, total: requisito.cantidad, estado: "en_progreso", reclamada: false };
          if (current.reclamada) return;
          const nuevoProgreso = Math.min(current.total, (current.progreso || 0) + 1);
          const nuevoEstado   = nuevoProgreso >= current.total ? "completada" : "en_progreso";
          missionBatch.set(userMissionsRef.doc(missionDoc.id), {
            progreso: nuevoProgreso, total: current.total,
            estado: nuevoEstado, reclamada: false, updatedAt: now,
            ...(nuevoEstado === "completada" && !current.completedAt ? { completedAt: now } : {}),
          }, { merge: true });
          hasMissionUpdates = true;
        });

        if (hasMissionUpdates) await missionBatch.commit();
      }
    } catch (missionErr) {
      console.warn("[completar-sesion] Error tracking missions:", missionErr.message);
    }

    // ── PR (Récord Personal) check ────────────────────────────────
    let prBroken = null;
    const PR_XP_BONUS = 20;
    try {
      const prevPrReps   = currentProgress.prReps   || 0;
      const prevPrTiempo = currentProgress.prTiempo || 0;
      const prUpdate     = {};
      let   beaten       = false;

      if (repsRealizadas && Number(repsRealizadas) > prevPrReps) {
        prUpdate.prReps  = Number(repsRealizadas);
        prUpdate.prFecha = new Date().toISOString();
        beaten = true;
        prBroken = { type:"reps",   value:Number(repsRealizadas), prev:prevPrReps,   ejercicioNombre, xpBonus:PR_XP_BONUS };
      } else if (tiempoRealizado && Number(tiempoRealizado) > prevPrTiempo) {
        prUpdate.prTiempo = Number(tiempoRealizado);
        prUpdate.prFecha  = new Date().toISOString();
        beaten = true;
        prBroken = { type:"tiempo", value:Number(tiempoRealizado), prev:prevPrTiempo, ejercicioNombre, xpBonus:PR_XP_BONUS };
      }

      if (beaten) {
        await userProgressRef.update(prUpdate);
        await userRef.update({ xp: FieldValue.increment(PR_XP_BONUS) });
      }
    } catch (prErr) {
      console.warn("[completar-sesion] PR check error:", prErr.message);
    }

    // ── Streak Challenge bonus (idempotent per day) ──────────────
    let streakChallengeBonus = null;
    try {
      const today      = utcDateStr(0);
      const userStreak = userData.streak || 0;
      if (userStreak >= CHALLENGE_MIN_STREAK && userData.streakChallengeDone !== today) {
        const reward = calcChallengeReward(userStreak);
        await userRef.update({
          streakChallengeDone: today,
          xp:    FieldValue.increment(reward.xp),
          coins: FieldValue.increment(reward.coins),
        });
        streakChallengeBonus = { xp: reward.xp, coins: reward.coins, streak: userStreak };
      }
    } catch (scErr) {
      console.warn("[completar-sesion] Streak challenge error:", scErr.message);
    }

    // ── Achievement check ─────────────────────────────────────────
    const newSessionAchievements = [];
    try {
      const freshSnap  = await userRef.get();
      const freshUser  = freshSnap.data();
      const userBadges = Array.isArray(freshUser.badges) ? freshUser.badges : [];
      const earnedIds  = new Set(userBadges.map(b => (typeof b === "string" ? b : b.id)));

      const achDocs = await getCachedAchievements();
      for (const ach of achDocs) {
        if (earnedIds.has(ach.id)) continue;
        if (!Array.isArray(ach.condiciones) || !ach.condiciones.length) continue;

        let allMet = true;
        for (const cond of ach.condiciones) {
          const qty = Number(cond.cantidad || 0);
          let met = false;
          switch (cond.tipo) {
            case "xp_total":        met = newXpTotal >= qty;  break;
            case "nivel_alcanzado": met = newLevel >= qty;    break;
            case "racha_dias":      met = newStreak >= qty;   break;
            case "sesiones_total":
            case "rutinas_compl":   met = (freshUser.totalSesiones || 0) >= qty; break;
            case "boss_defeated":
            case "jefe_derrotado":  met = bossMode === true;  break;
            default:                met = false;
          }
          if (!met) { allMet = false; break; }
        }
        if (allMet) {
          newSessionAchievements.push({ id: ach.id, nombre: ach.nombre, icon: ach.imagen || "🏆", rareza: ach.rareza || "Común", fecha: new Date().toISOString(), isNew: true });
          earnedIds.add(ach.id);
        }
      }

      if (newSessionAchievements.length > 0) {
        let bonusXp = 0;
        const achMap = Object.fromEntries(achDocs.map(a => [a.id, a]));
        for (const na of newSessionAchievements) bonusXp += Number(achMap[na.id]?.xpBonus || 0);

        const achUpdate = { badges: [...userBadges, ...newSessionAchievements], updatedAt: new Date().toISOString() };
        if (bonusXp > 0) {
          const achXpTotal = (freshUser.xpTotal || 0) + bonusXp;
          const achLevel   = Math.floor(Math.sqrt(achXpTotal / 100)) + 1;
          achUpdate.xp      = (freshUser.xp || 0) + bonusXp;
          achUpdate.xpTotal = achXpTotal;
          achUpdate.level   = achLevel;
          achUpdate.xpNext  = Math.pow(achLevel, 2) * 100;
          if (achLevel > (freshUser.level || 1)) {
            achUpdate.totalLevelUps = (freshUser.totalLevelUps || 0) + (achLevel - (freshUser.level || 1));
          }
        }
        await userRef.update(achUpdate);

        // Log each achievement earned to activityLog
        const achBatch = db.batch();
        for (const na of newSessionAchievements) {
          const logRef = db.collection("activityLog").doc();
          achBatch.set(logRef, {
            uid, type: "achievement_earned",
            achievementId: na.id, achievementName: na.nombre,
            icon: na.icon, rareza: na.rareza,
            timestamp: new Date().toISOString(),
          });
        }
        await achBatch.commit();
      }
    } catch (achErr) {
      console.warn("[completar-sesion] Achievement check error:", achErr.message);
    }

    bustUserCache(uid);

    res.json({
      success: true,
      xpGanado: xpFinal,
      level: newLevel,
      xp: newXp,
      xpNext: updatedUserData.xpNext,
      leveledUp,
      levelsGained: newLevel - currentLevel,
      newAchievements: newSessionAchievements,
      prBroken,
      streakChallengeBonus,
      coinsGained: bossCoinsAwarded || 0,
      completadas: updatedProgress.completadas,
      weeklyXP: updatedUserData.weeklyXP,
      streak: newStreak,
    });

  } catch (err) {
    console.error("Error completing session:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ejercicios/completar-rutina - Completar rutina y otorgar XP
router.post("/completar-rutina", verifyToken, async (req, res) => {
  try {
    const { rutinaId, xpGanado: xpGanadoRaw, tiempoRealizado, totalSeries } = req.body;
    let xpGanado = xpGanadoRaw;
    const uid = req.user.uid;

    if (!rutinaId || xpGanado === undefined) {
      return res.status(400).json({ error: "rutinaId y xpGanado requeridos" });
    }

    // Obtener datos del usuario
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: "Usuario no encontrado" });

    const userData = userSnap.data();
    const currentLevel = userData.level || 1;
    const currentXp    = userData.xp    || 0;
    const currentXpTotal = userData.xpTotal || 0;

    // Obtener datos de la rutina (nombre y categoría para skill tree bonus y log)
    let rutinaNombre = "Rutina";
    let rutinaCategoria = "";
    try {
      const rutDoc = await db.collection("ejercicios").doc("rutinas").collection("items").doc(rutinaId).get();
      if (rutDoc.exists) {
        rutinaNombre = rutDoc.data().nombre || "Rutina";
        rutinaCategoria = rutDoc.data().categoria || "";
      }
    } catch (_) {}

    // Aplicar bonos del árbol de habilidades del usuario
    const unlockedSkills = userData.unlockedSkills || [];
    if (unlockedSkills.length > 0) {
      const skillPct = getSkillXpBonus(
        unlockedSkills,
        { categoria: rutinaCategoria, nombre: rutinaNombre, musculos: [] },
        userData.heroClass,
        userData.streak || 0
      );
      if (skillPct > 0) {
        xpGanado = Math.round(xpGanado * (1 + skillPct / 100));
      }
    }

    // Aplicar boosts activos
    const { xpFinal: xpGanadoBoosted, boosted: rutinaXpBoosted } = applyActiveBoosts(xpGanado, userData);
    if (rutinaXpBoosted) xpGanado = xpGanadoBoosted;

    const newXpTotal = currentXpTotal + xpGanado;
    const newXp      = currentXp + xpGanado;
    const calculateLevel = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;
    const newLevel   = calculateLevel(newXpTotal);
    const leveledUp  = newLevel > currentLevel;
    const now        = new Date().toISOString();

    const currentWeekKey = getISOWeekKey();
    const weeklyXP = userData.weeklyXPWeek === currentWeekKey
      ? (userData.weeklyXP || 0) + xpGanado
      : xpGanado;

    const newTotalRutinas = (userData.totalRutinas || 0) + 1;

    // ── Streak tracking ──────────────────────────────────────────
    const today       = now.slice(0, 10);
    const lastAct     = (userData.lastActivityDate || "").slice(0, 10);
    const yesterday   = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak     = Number(userData.streak || 0);
    if (lastAct === today)      { /* ya contado hoy */ }
    else if (lastAct === yesterday) { newStreak = newStreak + 1; }
    else {
      const shield = userData.streakShield;
      if (shield?.expiresAt && shield.expiresAt > now) { /* shield activo: protege la racha */ }
      else { newStreak = 1; }
    }
    const newMaxStreak = Math.max(newStreak, Number(userData.maxStreak || 0));

    const updatedUserData = {
      xp: newXp, xpTotal: newXpTotal, level: newLevel,
      xpNext: Math.pow(newLevel, 2) * 100,
      lastLevelUp: leveledUp ? now : userData.lastLevelUp,
      totalLevelUps: (userData.totalLevelUps || 0) + (leveledUp ? 1 : 0),
      totalRutinas: newTotalRutinas,
      streak: newStreak,
      maxStreak: newMaxStreak,
      lastActivityDate: today,
      weeklyXP,
      weeklyXPWeek: currentWeekKey,
      updatedAt: now,
      ...(tiempoRealizado > 0 ? { tiempoTotal: FieldValue.increment(tiempoRealizado) } : {}),
      ...(typeof totalSeries === "number" && totalSeries > 0 ? { totalSeries: FieldValue.increment(totalSeries) } : {}),
    };

    // Progreso de rutina del usuario
    const userRutinaRef = userRef.collection("progress").doc(`rutina_${rutinaId}`);
    const rutinaProgressSnap = await userRutinaRef.get();
    const rutinaProgress = rutinaProgressSnap.exists ? rutinaProgressSnap.data() : { completadas: 0, xpGanado: 0 };

    // ── Per-routine weekly streak ─────────────────────────────────
    const getWeekStartStr = (d) => {
      const date = new Date(d);
      const day  = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().slice(0, 10);
    };
    const currentWeekStart  = getWeekStartStr(now);
    const prevWeekStart     = getWeekStartStr(new Date(Date.now() - 7 * 86400000).toISOString());
    const lastWC            = rutinaProgress.lastWeekCompleted || null;
    let weeklyStreak        = Number(rutinaProgress.weeklyStreak || 0);
    if (!lastWC) {
      weeklyStreak = 1;
    } else {
      const lastWCS = getWeekStartStr(lastWC);
      if (lastWCS === currentWeekStart)  { /* already counted this week */ }
      else if (lastWCS === prevWeekStart) { weeklyStreak += 1; }
      else                               { weeklyStreak = 1; }
    }
    const maxWeeklyStreak = Math.max(weeklyStreak, Number(rutinaProgress.maxWeeklyStreak || 0));

    await db.runTransaction(async (t) => {
      t.update(userRef, updatedUserData);
      t.set(userRutinaRef, {
        completadas:       rutinaProgress.completadas + 1,
        xpGanado:          rutinaProgress.xpGanado + xpGanado,
        ultimoCompletado:  now,
        weeklyStreak,
        maxWeeklyStreak,
        lastWeekCompleted: now,
        rutinaId,
        ...(tiempoRealizado != null ? { tiempoRealizado } : {}),
      }, { merge: true });
      const actRef = db.collection("activityLog").doc();
      t.set(actRef, {
        uid, type: "routine_complete", rutinaId,
        exerciseName: rutinaNombre,
        xpGained: xpGanado,
        levelBefore: currentLevel, levelAfter: newLevel, leveledUp,
        completed: true, icon: "📋",
        message: `Completó ${rutinaNombre}`,
        timestamp: now,
        metadata: { rutinaCompletada: true },
      });
    });

    // Increment sesiones counter on rutina document (silent — may not exist for test IDs)
    try {
      await db.collection("ejercicios").doc("rutinas").collection("items").doc(rutinaId)
        .update({ sesiones: FieldValue.increment(1) });
    } catch (_) {}

    // Tracking de misiones — batch writes, lecturas paralelas
    try {
      const RUTINA_TYPES = ["routine_complete", "rutinas_completadas", "sesiones", "sesiones_total", "completar_rutina"];
      const missionsSnap = await db.collection("missions").where("activo", "==", true).get();

      const relevantMissions = [];
      for (const mDoc of missionsSnap.docs) {
        const requisito = mDoc.data().requisitos?.find(r => RUTINA_TYPES.includes(r.tipo));
        if (requisito) relevantMissions.push({ doc: mDoc, requisito });
      }

      if (relevantMissions.length > 0) {
        const userMissionsRef = userRef.collection("missions");
        const userMissionDocs = await Promise.all(
          relevantMissions.map(({ doc }) => userMissionsRef.doc(doc.id).get())
        );
        const missionBatch = db.batch();
        let hasMissionUpdates = false;
        relevantMissions.forEach(({ doc: mDoc, requisito }, i) => {
          const uSnap = userMissionDocs[i];
          const cur = uSnap.exists ? uSnap.data() : { progreso: 0, total: requisito.cantidad, estado: "en_progreso", reclamada: false };
          if (cur.reclamada) return;
          const np = Math.min(cur.total, (cur.progreso || 0) + 1);
          const npEstado = np >= cur.total ? "completada" : "en_progreso";
          missionBatch.set(userMissionsRef.doc(mDoc.id), {
            progreso: np, total: cur.total,
            estado: npEstado, reclamada: false, updatedAt: now,
            ...(npEstado === "completada" && !cur.completedAt ? { completedAt: now } : {}),
          }, { merge: true });
          hasMissionUpdates = true;
        });
        if (hasMissionUpdates) await missionBatch.commit();
      }
    } catch (mErr) {
      console.warn("[completar-rutina] Mission tracking error:", mErr.message);
    }

    // === LOGROS / ACHIEVEMENTS CHECK ===
    // usa userData del read inicial (badges no se tocan en la transacción)
    const newAchievements = [];
    try {
      const userBadges = Array.isArray(userData.badges) ? userData.badges : [];
      const earnedIds  = new Set(userBadges.map(b => (typeof b === "string" ? b : b.id)));

      const achDocs = await getCachedAchievements(); // catálogo en caché (10 min TTL)
      for (const ach of achDocs) {
        if (earnedIds.has(ach.id)) continue;
        if (!Array.isArray(ach.condiciones) || !ach.condiciones.length) continue;

        let allMet = true;
        for (const cond of ach.condiciones) {
          const qty = Number(cond.cantidad || 0);
          let met = false;
          const totalSesionesConRutina = (userData.totalSesiones || 0) + newTotalRutinas;
          switch (cond.tipo) {
            case "rutinas_compl":   met = newTotalRutinas >= qty;            break;
            case "sesiones_total":  met = totalSesionesConRutina >= qty;     break;
            case "xp_total":        met = newXpTotal >= qty;                 break;
            case "nivel_alcanzado": met = newLevel >= qty;                   break;
            case "racha_dias":      met = newStreak >= qty;                  break;
            case "tiempo_total":    met = ((userData.tiempoTotal || 0) + (tiempoRealizado || 0)) >= qty; break;
            default:                met = false;
          }
          if (!met) { allMet = false; break; }
        }

        if (allMet) {
          newAchievements.push({ id: ach.id, nombre: ach.nombre, icon: ach.imagen || "🏆", rareza: ach.rareza || "Común", fecha: now, isNew: true });
          earnedIds.add(ach.id);
        }
      }

      if (newAchievements.length > 0) {
        const achMap = Object.fromEntries(achDocs.map(a => [a.id, a]));
        let bonusXp = 0;
        for (const na of newAchievements) bonusXp += Number(achMap[na.id]?.xpBonus || 0);

        const badgeUpdate = { badges: [...userBadges, ...newAchievements], updatedAt: now };
        if (bonusXp > 0) {
          const achXpTotal = newXpTotal + bonusXp;
          const achLevel   = Math.floor(Math.sqrt(achXpTotal / 100)) + 1;
          badgeUpdate.xp      = newXp + bonusXp;
          badgeUpdate.xpTotal = achXpTotal;
          badgeUpdate.level   = achLevel;
          badgeUpdate.xpNext  = Math.pow(achLevel, 2) * 100;
          if (achLevel > newLevel) {
            badgeUpdate.totalLevelUps = (userData.totalLevelUps || 0) + (newLevel - currentLevel) + (achLevel - newLevel);
          }
        }
        await userRef.update(badgeUpdate);

        const achBatch = db.batch();
        for (const na of newAchievements) {
          achBatch.set(db.collection("activityLog").doc(), {
            uid, type: "achievement_earned",
            achievementId: na.id, achievementName: na.nombre,
            icon: na.icon, rareza: na.rareza,
            timestamp: now,
          });
        }
        await achBatch.commit();
      }
    } catch (achErr) {
      console.warn("[completar-rutina] Achievement check error:", achErr.message);
    }

    // ── Streak Challenge bonus ────────────────────────────────────
    let streakChallengeBonus = null;
    try {
      const today      = utcDateStr(0);
      const userStreak = updatedUserData.streak ?? userData.streak ?? 0;
      if (userStreak >= CHALLENGE_MIN_STREAK && userData.streakChallengeDone !== today) {
        const reward = calcChallengeReward(userStreak);
        await userRef.update({
          streakChallengeDone: today,
          xp:    FieldValue.increment(reward.xp),
          coins: FieldValue.increment(reward.coins),
        });
        streakChallengeBonus = { xp: reward.xp, coins: reward.coins, streak: userStreak };
      }
    } catch (scErr) {
      console.warn("[completar-rutina] Streak challenge error:", scErr.message);
    }

    bustUserCache(uid); // invalidate per-user dashboard cache so profile reflects new data

    res.json({
      success: true, xpGanado, level: newLevel, xp: newXp,
      xpNext: updatedUserData.xpNext, leveledUp, levelsGained: newLevel - currentLevel,
      newAchievements, streakChallengeBonus, weeklyStreak,
      completadas: rutinaProgress.completadas + 1,
      weeklyXP,
      streak: newStreak,
    });
  } catch (err) {
    console.error("Error completing routine:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ejercicios/journal — Diario post-entrenamiento
// Guarda rating + palabra del día y auto-alimenta Zona Mente (mood + session)
router.post("/journal", verifyToken, async (req, res) => {
  try {
    const uid             = req.user.uid;
    const { ejercicioNombre, rating, palabra } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ ok: false, message: "rating 1-5 requerido" });

    const dateKey  = utcDateStr(0);
    const now      = new Date().toISOString();

    // Rating → mood mapping (misma escala que Zona Mente)
    const MOOD_MAP = { 1:"tense", 2:"tired", 3:"neutral", 4:"good", 5:"powered" };
    const mood     = MOOD_MAP[rating];

    // ── 1. Guardar en workoutJournal (merge: puede haber múltiples ejercicios hoy)
    const journalRef = db.collection("users").doc(uid).collection("workoutJournal").doc(dateKey);
    const journalSnap = await journalRef.get();
    if (journalSnap.exists) {
      await journalRef.update({
        rating,          // sobrescribe con última valoración del día
        palabra: palabra?.trim() || journalSnap.data().palabra || "",
        ejercicios: FieldValue.arrayUnion(ejercicioNombre || "Ejercicio"),
        updatedAt: now,
      });
    } else {
      await journalRef.set({
        uid, dateKey, rating,
        palabra:    palabra?.trim() || "",
        ejercicios: [ejercicioNombre || "Ejercicio"],
        createdAt:  now,
        updatedAt:  now,
      });
    }

    // ── 2. Auto-alimentar Zona Mente: mood (solo si no hay uno hoy)
    const moodRef  = db.collection("users").doc(uid).collection("mente_moods").doc(dateKey);
    const moodSnap = await moodRef.get();
    let savedToMente = false;
    let alreadyHadMood = moodSnap.exists;

    if (!moodSnap.exists) {
      await moodRef.set({
        mood,
        dateKey,
        source:    "workout_journal",
        nota:      palabra?.trim() || "",
        createdAt: FieldValue.serverTimestamp(),
      });
      savedToMente = true;
    } else {
      // Actualizar solo la nota/palabra si se proporcionó
      if (palabra?.trim()) {
        await moodRef.update({ nota: palabra.trim(), updatedAt: FieldValue.serverTimestamp() });
      }
    }

    // ── 3. Registrar sesión en Zona Mente (para historial y misiones)
    await db.collection("users").doc(uid).collection("mente_sessions").add({
      type:              "workout_journal",
      dateKey,
      rating,
      mood,
      palabra:           palabra?.trim() || "",
      ejercicioNombre:   ejercicioNombre || "Ejercicio",
      createdAt:         FieldValue.serverTimestamp(),
    });

    return res.json({ ok: true, savedToMente, alreadyHadMood, mood, dateKey });
  } catch (err) {
    console.error("Error en POST /ejercicios/journal:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/ejercicios/mis-prs — PRs del usuario actual
router.get("/mis-prs", verifyToken, async (req, res) => {
  try {
    const uid  = req.user.uid;
    const snap = await db.collection("users").doc(uid).collection("progress").get();
    const prs  = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (d.prReps || d.prTiempo) {
        prs.push({
          ejercicioId: doc.id,
          prReps:      d.prReps   || null,
          prTiempo:    d.prTiempo || null,
          prFecha:     d.prFecha  || null,
        });
      }
    });
    return res.json({ ok: true, prs });
  } catch (err) {
    console.error("Error en GET /ejercicios/mis-prs:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
