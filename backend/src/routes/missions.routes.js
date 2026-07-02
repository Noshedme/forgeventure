// src/routes/missions.routes.js
import { Router } from "express";
import admin, { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { applyActiveBoosts } from "../services/boosts.service.js";
import { evaluateGeneralAchievements } from "../utils/achievementEngine.js";
import { bustUserCache } from "../utils/userCache.js";
import { getISOWeekKey } from "../utils/weekUtils.js";

const router = Router();
const FieldValue = admin.firestore.FieldValue;

// ── Caché del catálogo de misiones (rara vez cambia) ──────────
const _missionsCache = { ts: 0, data: null };
const MISSIONS_CATALOG_TTL = 5 * 60 * 1000; // 5 min

async function getCachedMissions() {
  if (_missionsCache.data && Date.now() - _missionsCache.ts < MISSIONS_CATALOG_TTL) {
    return _missionsCache.data;
  }
  const snap = await db.collection("missions").where("activo", "==", true).limit(150).get();
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _missionsCache.ts   = Date.now();
  _missionsCache.data = docs;
  return docs;
}

// Invalida el caché cuando un admin crea/actualiza/elimina misiones
function invalidateMissionsCache() {
  _missionsCache.ts   = 0;
  _missionsCache.data = null;
}

// ── Helpers ────────────────────────────────────────────────────
function needsReset(tipo, updatedAt) {
  if (!updatedAt) return false;
  const lastUpdate = new Date(updatedAt);
  const now = new Date();
  if (tipo === "Diaria") {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    return lastUpdate < todayStart;
  }
  if (tipo === "Semanal") {
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return lastUpdate < weekStart;
  }
  return false;
}

// ── Misiones de Zona Mente para sembrar ──────────────────────
const MENTE_MISSIONS_SEED = [
  // ── DIARIAS ──────────────────────────────────────────────
  {
    titulo: "Chequeo Mental Diario", tipo: "Mente",
    imagen: "🌤️", xpRecompensa: 80,
    descripcion: "Realiza tu check-in de ánimo en Zona Mente. Observar tus emociones es el primer paso del bienestar.",
    requisitos: [{ tipo: "completar_mood", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Mente", valor: "80 XP" }],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Momentos de Gratitud", tipo: "Mente",
    imagen: "📓", xpRecompensa: 90,
    descripcion: "Completa tu diario de gratitud del día. Tres cosas por las que estar agradecido cambian tu perspectiva.",
    requisitos: [{ tipo: "completar_gratitud", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Mente", valor: "90 XP" }],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Respira y Recarga", tipo: "Mente",
    imagen: "🌬️", xpRecompensa: 70,
    descripcion: "Completa una sesión de respiración consciente. Tu sistema nervioso lo agradecerá.",
    requisitos: [{ tipo: "completar_respiracion", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Mente", valor: "70 XP" }],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Afirmaciones del Día", tipo: "Mente",
    imagen: "💬", xpRecompensa: 60,
    descripcion: "Completa tus afirmaciones positivas del día. Las palabras que te dices a ti mismo importan.",
    requisitos: [{ tipo: "completar_afirmacion", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Mente", valor: "60 XP" }],
    activo: true, completadas: 0, usosActuales: 0,
  },
  // ── SEMANALES ─────────────────────────────────────────────
  {
    titulo: "Semana PERMA Completa", tipo: "Mente",
    imagen: "🏛️", xpRecompensa: 200,
    descripcion: "Completa una evaluación PERMA esta semana. Entiende tus cinco pilares del bienestar.",
    requisitos: [{ tipo: "completar_perma", cantidad: 1 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Mente", valor: "200 XP" },
      { tipo: "coins", icon: "🪙", label: "Monedas", valor: 25 },
    ],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Bienestar de 5 Días", tipo: "Mente",
    imagen: "🔥", xpRecompensa: 250,
    descripcion: "Realiza tu check-in de ánimo 5 días esta semana. La consistencia forja el carácter.",
    requisitos: [{ tipo: "completar_mood", cantidad: 5 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Mente", valor: "250 XP" },
      { tipo: "badge_xtra", icon: "🏅", label: "Insignia", valor: "Guardián Semanal", rareza: "Raro" },
    ],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Semana Agradecida", tipo: "Mente",
    imagen: "💚", xpRecompensa: 220,
    descripcion: "Completa el diario de gratitud 3 veces esta semana. La gratitud es un superpoder.",
    requisitos: [{ tipo: "completar_gratitud", cantidad: 3 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Mente", valor: "220 XP" }],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Zona Mente Activa", tipo: "Mente",
    imagen: "🧘", xpRecompensa: 300,
    descripcion: "Completa 7 sesiones en Zona Mente esta semana. Una por cada día del camino.",
    requisitos: [{ tipo: "sesion_mente", cantidad: 7 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Mente", valor: "300 XP" },
      { tipo: "coins", icon: "🪙", label: "Monedas", valor: 40 },
    ],
    activo: true, completadas: 0, usosActuales: 0,
  },
  // ── ESPECIALES (UNA VEZ) ──────────────────────────────────
  {
    titulo: "Descubre tus Fortalezas", tipo: "Mente",
    imagen: "💎", xpRecompensa: 400,
    descripcion: "Completa el test VIA de fortalezas. Conocer tus talentos naturales te da una ventaja real.",
    requisitos: [{ tipo: "completar_fortalezas", cantidad: 1 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Mente", valor: "400 XP" },
      { tipo: "badge_xtra", icon: "💎", label: "Insignia", valor: "Ser de Fortaleza", rareza: "Épico" },
      { tipo: "coins", icon: "🪙", label: "Monedas", valor: 50 },
    ],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Explorador de la Mente", tipo: "Mente",
    imagen: "🔭", xpRecompensa: 500,
    descripcion: "Acumula 20 sesiones en Zona Mente. Eres un verdadero explorador del bienestar.",
    requisitos: [{ tipo: "sesion_mente", cantidad: 20 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Mente", valor: "500 XP" },
      { tipo: "badge_xtra", icon: "🔭", label: "Insignia", valor: "Explorador Mental", rareza: "Épico" },
    ],
    activo: true, completadas: 0, usosActuales: 0,
  },
  {
    titulo: "Racha de Acero", tipo: "Mente",
    imagen: "⚡", xpRecompensa: 600,
    descripcion: "Mantén el check-in de ánimo durante 10 días consecutivos. Tu disciplina mental es legendaria.",
    requisitos: [{ tipo: "completar_mood", cantidad: 10 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Mente", valor: "600 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Mente Indestructible" },
    ],
    activo: true, completadas: 0, usosActuales: 0,
  },
];

// GET /api/missions (admin)
router.get("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("missions").get();
    const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ ok: true, missions });
  } catch (err) {
    console.error("Error en GET /missions:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/missions/public - misiones visibles para usuarios
router.get("/public", verifyToken, async (req, res) => {
  try {
    const query = db.collection("missions").where("activo", "==", true);
    const snapshot = await query.get();
    const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ ok: true, missions });
  } catch (err) {
    console.error("Error en GET /missions/public:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/missions/user - misiones + progreso de usuario
router.get("/user", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Leer catálogo (cacheado) y progreso de usuario en paralelo — 1 lectura en lugar de 2 independientes
    const [missionDocs, userMissionsSnap] = await Promise.all([
      getCachedMissions(),
      db.collection("users").doc(uid).collection("missions").get(),
    ]);

    const userMissions = userMissionsSnap.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    const now = new Date().toISOString();
    const resetBatch = db.batch();
    let hasResets = false;

    const missions = missionDocs.map(missionData => {
      const userMission = userMissions[missionData.id];
      const defaultTotal = missionData.requisitos?.[0]?.cantidad || 1;

      // Reset diarias/semanales cuando el período venció
      if (userMission && needsReset(missionData.tipo, userMission.updatedAt)) {
        const ref = db.collection("users").doc(uid).collection("missions").doc(missionData.id);
        resetBatch.set(ref, { progreso: 0, total: defaultTotal, estado: "en_progreso", reclamada: false, updatedAt: now }, { merge: false });
        hasResets = true;
        return { ...missionData, progreso: 0, total: defaultTotal, estado: "en_progreso", reclamada: false };
      }

      const progress = userMission || { progreso: 0, total: defaultTotal, estado: "en_progreso", reclamada: false };
      const estado   = progress.reclamada ? "reclamada" : progress.estado;
      return {
        ...missionData,
        progreso:  progress.progreso || 0,
        total:     progress.total    || defaultTotal,
        estado,
        reclamada: progress.reclamada || false,
      };
    });

    // Usar batch para resets (1 operación de escritura en lugar de N)
    if (hasResets) resetBatch.commit().catch(err => console.warn("[missions/user] reset batch:", err.message));

    return res.json({ ok: true, missions, serverTime: now });
  } catch (err) {
    console.error("Error en GET /missions/user:", err);
    // Graceful fallback: página no se rompe aunque Firestore falle
    return res.json({ ok: false, missions: [], serverTime: new Date().toISOString(), message: err.message });
  }
});

// POST /api/missions/track - Actualizar progreso según evento de usuario
router.post("/track", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { tipo, valor } = req.body;
    if (!tipo || valor === undefined) return res.status(400).json({ ok: false, message: "tipo y valor requeridos" });

    // Catálogo cacheado → filtrar primero, luego leer solo los docs relevantes del usuario
    const missionDocs = await getCachedMissions();
    const relevant = missionDocs.filter(m => m.requisitos?.some(r => r.tipo === tipo));
    if (relevant.length === 0) return res.json({ ok: true, updates: [] });

    const userMissionsRef = db.collection("users").doc(uid).collection("missions");
    const userMissionSnaps = await Promise.all(relevant.map(m => userMissionsRef.doc(m.id).get()));
    const userMissions = {};
    relevant.forEach((m, i) => {
      if (userMissionSnaps[i].exists) userMissions[m.id] = userMissionSnaps[i].data();
    });

    const now      = new Date().toISOString();
    const batch    = db.batch();
    const updates  = [];

    for (const mission of relevant) {
      const requisito = mission.requisitos.find(r => r.tipo === tipo);
      const current   = userMissions[mission.id] || { progreso: 0, total: requisito.cantidad, estado: "en_progreso", reclamada: false };
      if (current.reclamada) continue;

      const nuevoProgreso = Math.min(current.total || requisito.cantidad, (current.progreso || 0) + Number(valor));
      const nuevoEstado   = nuevoProgreso >= (current.total || requisito.cantidad) ? "completada" : "en_progreso";

      const update = { progreso: nuevoProgreso, total: current.total || requisito.cantidad, estado: nuevoEstado, reclamada: false, updatedAt: now };
      if (nuevoEstado === "completada" && !current.completedAt) update.completedAt = now;

      const ref = db.collection("users").doc(uid).collection("missions").doc(mission.id);
      batch.set(ref, update, { merge: true });
      updates.push({ missionId: mission.id, progreso: nuevoProgreso, estado: nuevoEstado });
    }

    if (updates.length > 0) await batch.commit();

    return res.json({ ok: true, updates });
  } catch (err) {
    console.error("Error en POST /missions/track:", err);
    return res.json({ ok: false, updates: [], message: err.message });
  }
});

// POST /api/missions/:id/claim - reclamar recompensa si completada
router.post("/:id/claim", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const missionSnap = await db.collection("missions").doc(id).get();
    if (!missionSnap.exists) return res.status(404).json({ ok: false, message: "Misión no encontrada" });

    const mission = missionSnap.data();
    const userMissionRef = db.collection("users").doc(uid).collection("missions").doc(id);
    const userMissionSnap = await userMissionRef.get();

    if (!userMissionSnap.exists || userMissionSnap.data().estado !== "completada") {
      return res.status(400).json({ ok: false, message: "La misión no está completada" });
    }

    if (userMissionSnap.data().reclamada) {
      return res.status(400).json({ ok: false, message: "Recompensa ya reclamada" });
    }

    // Actualizar estado misión para usuario
    await userMissionRef.set({ reclamada: true, estado: "reclamada", claimedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });

    // Actualizar XP de usuario y nivel, procesar recompensas completas
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : { xp: 0, xpTotal: 0, level: 1, coins: 0, badges: [] };

    const xpGanadoBase = Number(mission.xpRecompensa || 0);
    const { xpFinal: xpGanado } = applyActiveBoosts(xpGanadoBase, userData);
    const nuevoXpTotal = (userData.xpTotal || 0) + xpGanado;
    const nuevoXp = (userData.xp || 0) + xpGanado;
    const nuevoNivel = Math.floor(Math.sqrt(nuevoXpTotal / 100)) + 1;
    const leveledUp = nuevoNivel > (userData.level || 1);
    const now = new Date().toISOString();

    // ── weeklyXP ──────────────────────────────────────────────────
    const currentWeekKey = getISOWeekKey();
    const weeklyXP = userData.weeklyXPWeek === currentWeekKey
      ? (userData.weeklyXP || 0) + xpGanado
      : xpGanado;

    // ── Streak tracking ──────────────────────────────────────────
    const today = now.slice(0, 10);
    const lastAct = (userData.lastActivityDate || "").slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = Number(userData.streak || 0);
    if (lastAct === today) { /* ya contado hoy */ }
    else if (lastAct === yesterday) { newStreak = newStreak + 1; }
    else {
      const shield = userData.streakShield;
      if (shield?.expiresAt && shield.expiresAt > now) { /* shield activo */ }
      else { newStreak = 1; }
    }
    const newMaxStreak = Math.max(newStreak, Number(userData.maxStreak || 0));

    // Procesar array recompensas de la misión
    const recompensas = Array.isArray(mission.recompensas) ? mission.recompensas : [];
    const newBadges = [];
    let bonusCoins = 0;
    let nuevoTitulo = null;

    for (const rec of recompensas) {
      if (rec.tipo === "badge" || rec.tipo === "badge_xtra") {
        // Añadir badge al usuario
        const existingBadges = Array.isArray(userData.badges) ? userData.badges : [];
        const alreadyHas = existingBadges.some(b => (typeof b === "string" ? b : b.nombre) === rec.valor);
        if (!alreadyHas && rec.valor) {
          newBadges.push({
            id:     `mission_badge_${id}`,
            nombre: rec.valor,
            icon:   rec.icon || "🏅",
            rareza: "Raro",
            fecha:  now,
            isNew:  true,
          });
        }
      } else if (rec.tipo === "coins" || rec.tipo === "monedas") {
        bonusCoins += Number(rec.valor || 0);
      } else if (rec.tipo === "titulo") {
        nuevoTitulo = rec.valor;
      }
    }

    const userUpdate = {
      xp: nuevoXp,
      xpTotal: nuevoXpTotal,
      level: nuevoNivel,
      xpNext: Math.pow(nuevoNivel, 2) * 100,
      lastLevelUp: leveledUp ? now : userData.lastLevelUp || null,
      totalLevelUps: (userData.totalLevelUps || 0) + (leveledUp ? 1 : 0),
      completedMissions: FieldValue.increment(1),
      weeklyXP,
      weeklyXPWeek: currentWeekKey,
      streak: newStreak,
      maxStreak: newMaxStreak,
      lastActivityDate: today,
      updatedAt: now,
    };

    if (newBadges.length > 0) {
      const currentBadges = Array.isArray(userData.badges) ? userData.badges : [];
      userUpdate.badges = [...currentBadges, ...newBadges];
    }
    if (bonusCoins > 0) {
      userUpdate.coins = (userData.coins || 0) + bonusCoins;
    }
    if (nuevoTitulo) {
      userUpdate.titulo = nuevoTitulo;
      const currentOwned = Array.isArray(userData.ownedTitles) ? userData.ownedTitles
        : (userData.titulo ? [userData.titulo] : []);
      if (!currentOwned.includes(nuevoTitulo)) {
        userUpdate.ownedTitles = [...currentOwned, nuevoTitulo];
      }
    }

    await userRef.update(userUpdate);

    // Increment global completadas counter on mission document (for admin KPIs)
    try {
      await db.collection("missions").doc(id).update({ completadas: FieldValue.increment(1) });
    } catch (_) {}

    // XP log entry (same pattern as achievementEngine)
    if (xpGanado > 0) {
      try {
        await userRef.collection("xpLogs").add({
          amount: xpGanado,
          reason: `Misión: ${mission.titulo || mission.nombre || "Misión"}`,
          source: "mission",
          missionId: id,
          createdAt: now,
        });
      } catch (_) {}
    }

    // Activity log
    await db.collection("activityLog").add({
      uid,
      type: "mission_claim",
      missionId: id,
      missionName: mission.titulo || mission.nombre || "Misión",
      xpGained: xpGanado,
      coinsGained: bonusCoins,
      badgesEarned: newBadges.map(b => b.nombre),
      timestamp: now,
      levelBefore: userData.level || 1,
      levelAfter: nuevoNivel,
      leveledUp,
      icon: "🎯",
      message: `Reclamó misión: ${mission.titulo || mission.nombre || "Misión"}`,
    });

    // In-app notification for the user (appears in UserMensajes)
    try {
      const rewardParts = [];
      if (xpGanado   > 0) rewardParts.push(`+${xpGanado} XP`);
      if (bonusCoins > 0) rewardParts.push(`+${bonusCoins} 🪙`);
      if (leveledUp)      rewardParts.push(`¡Nivel ${nuevoNivel}! ⬆️`);
      if (newBadges.length > 0) rewardParts.push(`Insignia: ${newBadges.map(b => b.icon + " " + b.nombre).join(", ")}`);

      await db.collection("adminMessages").add({
        title:     `Misión completada: ${mission.imagen || "🎯"} ${mission.titulo || mission.nombre}`,
        text:      `¡Felicitaciones! Completaste la misión y ganaste ${rewardParts.join(" · ")}.`,
        type:      "achievement",
        status:    "published",
        targetAll: false,
        targetUid: uid,
        readBy:    [],
        readCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "system",
      });
    } catch (notifErr) {
      console.warn("[missions] in-app notification:", notifErr.message);
    }

    // Evaluate general achievements (awaited to include results in response)
    let newAchievements = [];
    try {
      const achResult = await evaluateGeneralAchievements(uid, "mission_claim");
      newAchievements = achResult?.unlocked || [];
    } catch (achErr) {
      console.warn("[missions] achievement eval:", achErr.message);
    }

    bustUserCache(uid);

    return res.json({
      ok: true, xpGanado, level: nuevoNivel, xp: nuevoXp,
      xpNext: Math.pow(nuevoNivel, 2) * 100, leveledUp,
      coinsGanados: bonusCoins,
      badgesGanados: newBadges,
      titulo: nuevoTitulo,
      weeklyXP,
      streak: newStreak,
      newAchievements,
    });
  } catch (err) {
    console.error("Error en POST /missions/:id/claim:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/missions
router.post("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      creadoEn: new Date().toISOString(),
      completadas: Number(req.body.completadas || 0),
      usosActuales: Number(req.body.usosActuales || 0),
      activo: req.body.activo !== undefined ? req.body.activo : true,
    };

    const docRef = await db.collection("missions").add(payload);
    invalidateMissionsCache();
    const newMission = { id: docRef.id, ...payload };
    return res.status(201).json({ ok: true, mission: newMission });
  } catch (err) {
    console.error("Error en POST /missions:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/missions/:id
router.patch("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, actualizadoEn: new Date().toISOString() };
    await db.collection("missions").doc(id).update(updates);
    invalidateMissionsCache();
    const doc = await db.collection("missions").doc(id).get();
    return res.json({ ok: true, mission: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error("Error en PATCH /missions/:id:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/missions/:id
router.delete("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("missions").doc(id).delete();
    invalidateMissionsCache();
    return res.json({ ok: true, message: "Misión eliminada" });
  } catch (err) {
    console.error("Error en DELETE /missions/:id:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/missions/seed-mente — admin: sembrar misiones de Zona Mente
// Idempotente: omite las que ya existen por título exacto.
// ══════════════════════════════════════════════════════════════
router.post("/seed-mente", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const existingSnap = await db.collection("missions").where("tipo", "==", "Mente").get();
    const existingTitles = new Set(existingSnap.docs.map(d => d.data().titulo));

    const now = new Date().toISOString();
    const created = [];
    const skipped = [];

    for (const mission of MENTE_MISSIONS_SEED) {
      if (existingTitles.has(mission.titulo)) {
        skipped.push(mission.titulo);
        continue;
      }
      const docRef = await db.collection("missions").add({ ...mission, creadoEn: now, actualizadoEn: now });
      created.push({ id: docRef.id, titulo: mission.titulo });
    }

    if (created.length > 0) invalidateMissionsCache();

    return res.json({
      ok: true,
      message: `Sembradas ${created.length} misiones Mente. Omitidas: ${skipped.length}`,
      created,
      skipped,
    });
  } catch (err) {
    console.error("Error en POST /missions/seed-mente:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// trackMenteMissions(uid, tipo, valor) — helper interno
// Usado por mente.routes.js para actualizar progreso de misiones Mente.
// ══════════════════════════════════════════════════════════════
export async function trackMenteMissions(uid, tipo, valor = 1) {
  try {
    const missions = (await getCachedMissions()).filter((mission) => mission.tipo === "Mente");

    for (const mission of missions) {
      const requisito = mission.requisitos?.find(r => r.tipo === tipo);
      if (!requisito) continue;

      const userMissionRef = db.collection("users").doc(uid).collection("missions").doc(mission.id);
      const snap = await userMissionRef.get();
      const current = snap.exists
        ? snap.data()
        : { progreso: 0, total: requisito.cantidad, estado: "en_progreso", reclamada: false };

      if (current.reclamada) continue;

      const nuevoProgreso = Math.min(current.total, (current.progreso || 0) + Number(valor));
      const nuevoEstado   = nuevoProgreso >= current.total ? "completada" : "en_progreso";

      const menteUpdate = {
        progreso:   nuevoProgreso,
        total:      current.total,
        estado:     nuevoEstado,
        reclamada:  false,
        updatedAt:  new Date().toISOString(),
      };
      if (nuevoEstado === "completada" && !current.completedAt) {
        menteUpdate.completedAt = new Date().toISOString();
      }
      await userMissionRef.set(menteUpdate, { merge: true });
    }
  } catch (err) {
    console.error("trackMenteMissions error:", err);
  }
}

export async function trackSaludMissions(uid, tipo, valor = 1) {
  try {
    const missionsSnap = await db.collection("missions")
      .where("activo", "==", true)
      .where("tipo", "==", "Salud")
      .get();

    for (const missionDoc of missionsSnap.docs) {
      const mission = missionDoc.data();
      const requisito = mission.requisitos?.find((r) => r.tipo === tipo);
      if (!requisito) continue;

      const userMissionRef = db.collection("users").doc(uid).collection("missions").doc(missionDoc.id);
      const snap = await userMissionRef.get();
      const current = snap.exists
        ? snap.data()
        : { progreso: 0, total: requisito.cantidad, estado: "en_progreso", reclamada: false };

      if (current.reclamada) continue;

      const nuevoProgreso = Math.min(current.total, (current.progreso || 0) + Number(valor));
      const nuevoEstado = nuevoProgreso >= current.total ? "completada" : "en_progreso";

      const saludUpdate = {
        progreso: nuevoProgreso,
        total: current.total,
        estado: nuevoEstado,
        reclamada: false,
        updatedAt: new Date().toISOString(),
      };
      if (nuevoEstado === "completada" && !current.completedAt) {
        saludUpdate.completedAt = new Date().toISOString();
      }
      await userMissionRef.set(saludUpdate, { merge: true });
    }
  } catch (err) {
    console.error("trackSaludMissions error:", err);
  }
}

export default router;
