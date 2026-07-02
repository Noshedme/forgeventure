// src/routes/mente.routes.js
// ─────────────────────────────────────────────────────────────
//  ZONA MENTE — API de Psicología Positiva para ForgeVenture.
//
//  Endpoints:
//   POST   /api/mente/mood          - Guardar check-in de ánimo del día
//   GET    /api/mente/mood          - Historial de ánimo (últimos 30 días)
//   POST   /api/mente/gratitude     - Guardar entradas de gratitud del día
//   GET    /api/mente/gratitude     - Historial de gratitudes (7 días)
//   POST   /api/mente/perma         - Guardar evaluación PERMA
//   GET    /api/mente/perma         - Historial PERMA (8 semanas)
//   POST   /api/mente/strengths     - Guardar resultado test VIA
//   GET    /api/mente/strengths     - Obtener fortalezas guardadas
//   POST   /api/mente/session       - Registrar sesión completada (respiración, etc.)
//   GET    /api/mente/summary       - Resumen completo de bienestar del usuario
//   GET    /api/mente/insights      - Insights personalizados (mood + ejercicio)
//   GET    /api/mente/community     - Stats anónimas de la comunidad
//   GET    /api/mente/admin/overview - Vista admin del bienestar colectivo
// ─────────────────────────────────────────────────────────────
import { Router }     from "express";
import { createHash } from "crypto";
import { db, auth }   from "../config/firebase.js";
import admin          from "../config/firebase.js";
import { trackMenteMissions }        from "./missions.routes.js";
import { evaluateMenteAchievements } from "./logros.routes.js";
import { applyActiveBoosts }         from "../services/boosts.service.js";

// ── Item 16: Cache en memoria para /admin/overview (TTL 5 min) ─
const overviewCache = new Map();
const CACHE_TTL     = 5 * 60 * 1000;

// ── Cache per-user para /summary (TTL 2 min) ─────────────────
const _summaryCache = new Map();  // uid → { ts, data }
const SUMMARY_TTL   = 2 * 60 * 1000;

// ── Cache global para /community (TTL 15 min) ─────────────────
let _communityCache = { ts: 0, data: null };
const COMMUNITY_TTL = 15 * 60 * 1000;
const MENTE_ACHIEVEMENT_COOLDOWN = 90 * 1000;

// ── Item 20: Rate limiter en memoria (sin deps externos) ───────
const _rlMap = new Map();
function simpleRateLimit(maxPerMinute) {
  return (req, res, next) => {
    const key = req.uid || req.ip || "anon";
    const now = Date.now();
    const e   = _rlMap.get(key);
    if (!e || now > e.reset) {
      _rlMap.set(key, { count: 1, reset: now + 60_000 });
      return next();
    }
    if (e.count >= maxPerMinute)
      return res.status(429).json({ ok:false, message:"Demasiadas peticiones. Intenta en un minuto." });
    e.count++;
    next();
  };
}

// ── Item 19: Pseudoanonimización consistente de UIDs ──────────
//  El mismo uid siempre produce el mismo pseudoId, pero no es
//  reversible sin conocer ANON_SALT. Cumple principio de GDPR
//  de minimización de datos en endpoints de admin.
const ANON_SALT = process.env.ANON_SALT || "forgeventure-mente-salt-v1";
function pseudoId(uid) {
  return createHash("sha256").update(uid + ANON_SALT).digest("hex").slice(0, 12);
}

// ── Item 15: Agregación diaria ligera (fire-and-forget) ───────
//  Escribe en mente_daily_stats/{dateKey} como efecto secundario
//  de cada actividad. Sirve como base de datos para dashboards
//  futuros sin refactorizar el overview actual.
function updateDailyStats(uid, type, dateKey) {
  db.collection("mente_daily_stats").doc(dateKey).set({
    [`counts.${type}`]: FieldValue.increment(1),
    activeUids:         FieldValue.arrayUnion(pseudoId(uid)), // pseudoIds, no UIDs reales
    updatedAt:          FieldValue.serverTimestamp(),
  }, { merge: true }).catch(() => {});
}

function bumpUserMenteDaily(uid, dateKey, countKey, amount = 1) {
  db.collection("users").doc(uid).collection("mente_daily").doc(dateKey).set({
    [`counts.${countKey}`]: FieldValue.increment(amount),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true }).catch(() => {});
}

const FieldValue = admin.firestore.FieldValue;
const Timestamp  = admin.firestore.Timestamp;
const router     = Router();

async function shouldEvaluateMenteAchievements(uid, dateKey) {
  const ref = db.collection("users").doc(uid).collection("mente_daily").doc(dateKey);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : {};
      const lastEvalMs = Number(data.lastAchievementEvalMs || 0);
      const now = Date.now();
      if (lastEvalMs && now - lastEvalMs < MENTE_ACHIEVEMENT_COOLDOWN) {
        return false;
      }
      tx.set(ref, {
        lastAchievementEvalMs: now,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return true;
    });
  } catch {
    return true;
  }
}

// ── Fire-and-forget: progreso de misiones + logros tras actividad ─
function trackAndCheck(uid, misionTipos = []) {
  Promise.resolve().then(async () => {
    try {
      const dateKey = today();
      // Track each mission event type
      for (const [tipo, valor] of misionTipos) {
        await trackMenteMissions(uid, tipo, valor);
        bumpUserMenteDaily(uid, dateKey, tipo, Number(valor) || 1);
      }
      // Track generic "sesion_mente" for count-based missions
      if (misionTipos.length > 0) {
        await trackMenteMissions(uid, "sesion_mente", 1);
        bumpUserMenteDaily(uid, dateKey, "sesion_mente", 1);
      }
      // Check and grant mente achievements
      if (await shouldEvaluateMenteAchievements(uid, dateKey)) {
        await evaluateMenteAchievements(uid);
      }
    } catch (err) {
      console.error("trackAndCheck error:", err);
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);

// XP otorgado por actividad de Zona Mente
const MENTE_XP = {
  mood:        25,  // check-in de ánimo
  gratitude:   30,  // diario de gratitud completo
  perma:       40,  // evaluación PERMA
  breathing:   20,  // sesión de respiración (5+ ciclos)
  affirmation: 15,  // afirmaciones completadas
  strengths:   60,  // test de fortalezas (one-time bonus)
  connection:  20,  // conexión social del día — pilar R (Relaciones)
};

const VALID_MOODS = ["tense","tired","neutral","good","powered"];
const VALID_TYPES = ["breathing","affirmation","gratitude","mood","perma","strengths","connection"];

// ── Middleware: verificar token ───────────────────────────────
async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, message:"Token requerido" });
  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid    = decoded.uid;
    req.claims = decoded;
    next();
  } catch {
    return res.status(401).json({ ok:false, message:"Token inválido" });
  }
}

// ── Middleware: solo admin ────────────────────────────────────
async function verifyAdmin(req, res, next) {
  if (!req.uid) return res.status(401).json({ ok:false, message:"No autenticado" });
  try {
    const userSnap = await db.collection("users").doc(req.uid).get();
    if (!userSnap.exists || userSnap.data().roleId !== "admin")
      return res.status(403).json({ ok:false, message:"Solo administradores" });
    next();
  } catch {
    return res.status(500).json({ ok:false, message:"Error de autorización" });
  }
}

// ── Helper: sumar XP al usuario (transacción segura) ─────────
async function grantXP(uid, amount, reason) {
  try {
    const userRef = db.collection("users").doc(uid);
    let xpEarned = 0, leveledUp = false, newLevel = 1, xpNext = 100;

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : {};
      const { xpFinal: boostedAmount, boosted, log } = applyActiveBoosts(amount, userData);
      if (boosted) console.log(`[grantXP:mente] boosts uid=${uid}:`, log);

      xpEarned = boostedAmount;
      const currentXpTotal = Number(userData.xpTotal || userData.xp || 0);
      const newXpTotal     = currentXpTotal + boostedAmount;
      const currentLevel   = Number(userData.level || 1);
      newLevel             = Math.floor(Math.sqrt(newXpTotal / 100)) + 1;
      xpNext               = Math.pow(newLevel, 2) * 100;
      leveledUp            = newLevel > currentLevel;

      const update = {
        xp:           FieldValue.increment(boostedAmount),
        xpTotal:      FieldValue.increment(boostedAmount),
        menteXpTotal: FieldValue.increment(boostedAmount),
        level:        newLevel,
        xpNext:       xpNext,
        updatedAt:    FieldValue.serverTimestamp(),
      };
      if (leveledUp) {
        update.totalLevelUps = FieldValue.increment(newLevel - currentLevel);
      }
      tx.update(userRef, update);
    });

    // Log de XP fuera de la transacción
    await db.collection("users").doc(uid).collection("xpLogs").add({
      amount: xpEarned, baseAmount: amount, reason, source: "mente",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { xpEarned, leveledUp, newLevel, xpNext };
  } catch (err) {
    console.error("grantXP error:", err);
    return { xpEarned: 0, leveledUp: false, newLevel: 1, xpNext: 100 };
  }
}

// ── Helper: verificar si ya recibió XP hoy por actividad ─────
async function alreadyAwardedToday(uid, activity) {
  const dateKey = today();
  const snap = await db.collection("users").doc(uid)
    .collection("mente_sessions")
    .where("type", "==", activity)
    .where("dateKey", "==", dateKey)
    .limit(1)
    .get();
  return !snap.empty;
}

// ═════════════════════════════════════════════════════════════
//  CHECK-IN DE ÁNIMO
// ═════════════════════════════════════════════════════════════

// POST /api/mente/mood
router.post("/mood", verifyToken, async (req, res) => {
  const { mood } = req.body;
  if (!VALID_MOODS.includes(mood))
    return res.status(400).json({ ok:false, message:"Estado de ánimo inválido" });

  const dateKey = today();
  const ref     = db.collection("users").doc(req.uid).collection("mente_moods").doc(dateKey);

  try {
    const existing = await ref.get();
    if (existing.exists)
      return res.json({ ok:true, message:"Ya registraste tu ánimo hoy", alreadyDone:true, xpEarned:0 });

    await ref.set({ mood, dateKey, createdAt: FieldValue.serverTimestamp() });

    // XP solo si no lo recibió hoy
    const xpResult = await grantXP(req.uid, MENTE_XP.mood, `Ánimo: ${mood}`);

    // Log sesión
    await db.collection("users").doc(req.uid).collection("mente_sessions").add({
      type:"mood", dateKey, mood, createdAt: FieldValue.serverTimestamp(),
    });

    // Actualizar racha de check-ins y contador total
    const userSnap = await db.collection("users").doc(req.uid).get();
    const userData = userSnap.data() || {};
    const lastMoodDate = userData.lastMoodDate || "";
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yesterdayKey = yesterday.toISOString().slice(0,10);
    const newStreak = (lastMoodDate === yesterdayKey || lastMoodDate === dateKey)
      ? (userData.moodStreak || 0) + 1 : 1;

    await db.collection("users").doc(req.uid).update({
      lastMoodDate:    dateKey,
      moodStreak:      newStreak,
      menteMoodsCount: FieldValue.increment(1),
      menteSessions:   FieldValue.increment(1),
    });

    // Bonos de hito de racha (fire-and-forget)
    const STREAK_BONUSES = { 3:15, 7:50, 14:100, 30:250 };
    if (STREAK_BONUSES[newStreak]) {
      const bonusXp = STREAK_BONUSES[newStreak];
      grantXP(req.uid, bonusXp, `Racha mente: ${newStreak} días`).catch(() => {});
      db.collection("users").doc(req.uid).collection("notifications").add({
        type:      "mente_streak_milestone",
        streak:    newStreak,
        xpBonus:   bonusXp,
        message:   `🔥 ¡${newStreak} días de check-in seguidos! +${bonusXp} XP`,
        createdAt: FieldValue.serverTimestamp(),
        read:      false,
      }).catch(() => {});
    }

    // Item 15: stats diarios (fire-and-forget)
    updateDailyStats(req.uid, "mood", dateKey);

    // Progreso de misiones + logros (fire-and-forget)
    trackAndCheck(req.uid, [["completar_mood", 1]]);

    // Log to activityLog (fire-and-forget)
    db.collection("activityLog").add({
      uid: req.uid, type: "mente_mood",
      mood, xpGained: xpResult.xpEarned,
      icon: "🌤️", message: `Check-in de ánimo: ${mood}`,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    _summaryCache.delete(uid);
    return res.json({ ok:true, xpEarned: xpResult.xpEarned, leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel, xpNext: xpResult.xpNext, moodStreak: newStreak });
  } catch (err) {
    console.error("POST /mente/mood:", err);
    return res.status(500).json({ ok:false, message:"Error al guardar ánimo" });
  }
});

// GET /api/mente/mood — historial de ánimo (últimos 30 días)
router.get("/mood", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.uid)
      .collection("mente_moods")
      .orderBy("dateKey", "desc")
      .limit(30)
      .get();

    const moods = snap.docs.map(d => ({ dateKey: d.id, ...d.data() }));

    // Calcular racha actual
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dd = new Date(d); dd.setDate(d.getDate()-i);
      const dk = dd.toISOString().slice(0,10);
      if (moods.find(m => m.dateKey === dk)) streak++;
      else break;
    }

    return res.json({ ok:true, moods, streak });
  } catch (err) {
    console.error("GET /mente/mood:", err);
    return res.status(500).json({ ok:false, message:"Error al obtener historial" });
  }
});

// ═════════════════════════════════════════════════════════════
//  DIARIO DE GRATITUD
// ═════════════════════════════════════════════════════════════

// POST /api/mente/gratitude
router.post("/gratitude", verifyToken, async (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length !== 3)
    return res.status(400).json({ ok:false, message:"Se requieren exactamente 3 entradas" });

  const filled = entries.filter(e => typeof e === "string" && e.trim().length >= 3);
  if (filled.length < 1)
    return res.status(400).json({ ok:false, message:"Al menos 1 entrada debe tener 3+ caracteres" });

  const clean = entries.map(e => (typeof e === "string" ? e.trim().slice(0,300) : ""));
  const dateKey = today();
  const ref = db.collection("users").doc(req.uid).collection("mente_gratitudes").doc(dateKey);

  try {
    const existing = await ref.get();
    const alreadyXP = existing.exists;

    await ref.set({ entries: clean, dateKey, filledCount: filled.length, updatedAt: FieldValue.serverTimestamp() });

    let xpResult = { xpEarned: 0, leveledUp: false, newLevel: null, xpNext: null };
    if (!alreadyXP) {
      xpResult = await grantXP(req.uid, MENTE_XP.gratitude, "Diario de gratitud completado");
      await db.collection("users").doc(req.uid).collection("mente_sessions").add({
        type:"gratitude", dateKey, createdAt: FieldValue.serverTimestamp(),
      });
      await db.collection("users").doc(req.uid).update({
        menteGratitudeCount: FieldValue.increment(1),
        menteSessions:       FieldValue.increment(1),
      });
      // Item 15: stats diarios (fire-and-forget)
      updateDailyStats(req.uid, "gratitude", dateKey);

      // Progreso de misiones + logros (fire-and-forget)
      trackAndCheck(req.uid, [["completar_gratitud", 1]]);

      // Log to activityLog (fire-and-forget)
      db.collection("activityLog").add({
        uid: req.uid, type: "mente_gratitude",
        xpGained: xpResult.xpEarned,
        icon: "📓", message: "Diario de gratitud completado",
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    _summaryCache.delete(req.uid);
    return res.json({ ok:true, xpEarned: xpResult.xpEarned, leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel, xpNext: xpResult.xpNext, alreadyDone: alreadyXP });
  } catch (err) {
    console.error("POST /mente/gratitude:", err);
    return res.status(500).json({ ok:false, message:"Error al guardar gratitudes" });
  }
});

// GET /api/mente/gratitude — últimos 7 días
router.get("/gratitude", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.uid)
      .collection("mente_gratitudes")
      .orderBy("dateKey", "desc")
      .limit(7)
      .get();
    const entries = snap.docs.map(d => ({ dateKey: d.id, ...d.data() }));
    return res.json({ ok:true, entries });
  } catch (err) {
    return res.status(500).json({ ok:false, message:"Error al obtener gratitudes" });
  }
});

// ═════════════════════════════════════════════════════════════
//  EVALUACIÓN PERMA
// ═════════════════════════════════════════════════════════════

// POST /api/mente/perma
router.post("/perma", verifyToken, async (req, res) => {
  const { scores } = req.body;
  const PERMA_KEYS = ["P","E","R","M","A"];

  if (!scores || typeof scores !== "object")
    return res.status(400).json({ ok:false, message:"Scores requerido" });

  for (const k of PERMA_KEYS) {
    const v = Number(scores[k]);
    if (isNaN(v) || v < 1 || v > 10)
      return res.status(400).json({ ok:false, message:`${k} debe ser entre 1 y 10` });
  }

  const dateKey = today();
  const clean   = {};
  PERMA_KEYS.forEach(k => { clean[k] = Math.round(Number(scores[k])); });
  const avg = Math.round(PERMA_KEYS.reduce((s,k) => s + clean[k], 0) / 5 * 10) / 10;
  const ref = db.collection("users").doc(req.uid).collection("mente_perma").doc(dateKey);

  try {
    const [existing, permaUserSnap] = await Promise.all([
      ref.get(),
      db.collection("users").doc(req.uid).get(),
    ]);
    const alreadyXP = existing.exists;
    const heroClass = permaUserSnap.data()?.heroClass || null;

    await ref.set({ scores: clean, avg, dateKey, heroClass, updatedAt: FieldValue.serverTimestamp() });

    let xpResult = { xpEarned: 0, leveledUp: false, newLevel: null, xpNext: null };
    if (!alreadyXP) {
      xpResult = await grantXP(req.uid, MENTE_XP.perma, `PERMA assessment (avg: ${avg})`);
      await db.collection("users").doc(req.uid).collection("mente_sessions").add({
        type:"perma", dateKey, avg, createdAt: FieldValue.serverTimestamp(),
      });
      await db.collection("users").doc(req.uid).update({
        mentePermaCount: FieldValue.increment(1),
        menteSessions:   FieldValue.increment(1),
      });
      // Item 15: stats diarios (fire-and-forget)
      updateDailyStats(req.uid, "perma", dateKey);

      // Progreso de misiones + logros (fire-and-forget)
      trackAndCheck(req.uid, [["completar_perma", 1]]);

      // Log to activityLog (fire-and-forget)
      db.collection("activityLog").add({
        uid: req.uid, type: "mente_perma",
        avg, xpGained: xpResult.xpEarned,
        icon: "🏛️", message: `Evaluación PERMA completada (avg: ${avg})`,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    // Actualizar snapshot PERMA en el doc de usuario (para admin dashboard)
    await db.collection("users").doc(req.uid).update({
      latestPermaAvg: avg,
      latestPermaDate: dateKey,
    });

    _summaryCache.delete(req.uid);
    return res.json({ ok:true, xpEarned: xpResult.xpEarned, leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel, xpNext: xpResult.xpNext, avg, alreadyDone: alreadyXP });
  } catch (err) {
    console.error("POST /mente/perma:", err);
    return res.status(500).json({ ok:false, message:"Error al guardar PERMA" });
  }
});

// GET /api/mente/perma — historial PERMA (últimas 8 semanas)
router.get("/perma", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.uid)
      .collection("mente_perma")
      .orderBy("dateKey", "desc")
      .limit(56) // 8 semanas
      .get();
    const history = snap.docs.map(d => ({ dateKey: d.id, ...d.data() }));
    return res.json({ ok:true, history });
  } catch (err) {
    return res.status(500).json({ ok:false, message:"Error al obtener historial PERMA" });
  }
});

// ═════════════════════════════════════════════════════════════
//  FORTALEZAS VIA
// ═════════════════════════════════════════════════════════════

// POST /api/mente/strengths
router.post("/strengths", verifyToken, async (req, res) => {
  const { top3, all } = req.body;
  if (!Array.isArray(top3) || top3.length < 1)
    return res.status(400).json({ ok:false, message:"top3 es requerido" });

  const ref = db.collection("users").doc(req.uid).collection("mente_strengths").doc("result");

  try {
    const existing = await ref.get();
    const isFirst  = !existing.exists;

    await ref.set({
      top3, all: all || {},
      completedAt: FieldValue.serverTimestamp(),
      version: (existing.data()?.version || 0) + 1,
    });

    let xpResult = { xpEarned: 0, leveledUp: false, newLevel: null, xpNext: null };
    if (isFirst) {
      xpResult = await grantXP(req.uid, MENTE_XP.strengths, `Fortalezas VIA: ${top3.slice(0,2).join(", ")}`);
      await db.collection("users").doc(req.uid).collection("mente_sessions").add({
        type:"strengths", dateKey: today(), top3, createdAt: FieldValue.serverTimestamp(),
      });
      await db.collection("users").doc(req.uid).update({
        menteSessions: FieldValue.increment(1),
      });
      // Item 15: stats diarios (fire-and-forget)
      updateDailyStats(req.uid, "strengths", today());

      // Progreso de misiones + logros (fire-and-forget)
      trackAndCheck(req.uid, [["completar_fortalezas", 1]]);
    }

    // Guardar top strength en el perfil de usuario (visible en perfil)
    await db.collection("users").doc(req.uid).update({
      topStrength: top3[0] || null,
      strengthsCompletedAt: FieldValue.serverTimestamp(),
    });

    _summaryCache.delete(req.uid);
    return res.json({ ok:true, xpEarned: xpResult.xpEarned, leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel, xpNext: xpResult.xpNext, isFirst });
  } catch (err) {
    console.error("POST /mente/strengths:", err);
    return res.status(500).json({ ok:false, message:"Error al guardar fortalezas" });
  }
});

// GET /api/mente/strengths
router.get("/strengths", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.uid)
      .collection("mente_strengths").doc("result").get();
    if (!snap.exists) return res.json({ ok:true, strengths: null });
    return res.json({ ok:true, strengths: snap.data() });
  } catch (err) {
    return res.status(500).json({ ok:false, message:"Error al obtener fortalezas" });
  }
});

// ═════════════════════════════════════════════════════════════
//  SESIONES (RESPIRACIÓN, AFIRMACIONES, ETC.)
// ═════════════════════════════════════════════════════════════

// POST /api/mente/session
router.post("/session", verifyToken, async (req, res) => {
  const { type, cycles, duration, cardsDone } = req.body;

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ ok:false, message:"Tipo de sesión inválido" });

  const dateKey = today();

  try {
    const alreadyDone = await alreadyAwardedToday(req.uid, type);
    let xpResult = { xpEarned: 0, leveledUp: false, newLevel: null, xpNext: null };

    if (!alreadyDone) {
      // XP solo si cumple mínimos
      const qualifies =
        (type === "breathing"   && (cycles || 0) >= 3) ||
        (type === "affirmation" && (cardsDone || 0) >= 3) ||
        (type === "mood"        || type === "gratitude" || type === "perma" || type === "strengths");

      if (qualifies) {
        xpResult = await grantXP(req.uid, MENTE_XP[type] || 15, `Sesión: ${type}`);
      }
    }

    await db.collection("users").doc(req.uid).collection("mente_sessions").add({
      type, dateKey,
      cycles:    cycles    || null,
      duration:  duration  || null,
      cardsDone: cardsDone || null,
      xpEarned:  xpResult.xpEarned,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Actualizar contador global + contadores por tipo
    await db.collection("users").doc(req.uid).update({
      menteSessions:   FieldValue.increment(1),
      ...(type === "breathing"   ? { menteBreathingCount:   FieldValue.increment(1) } : {}),
      ...(type === "affirmation" ? { menteAffirmationCount: FieldValue.increment(1) } : {}),
    });

    // Item 15: stats diarios (fire-and-forget, siempre — incluso si ya recibió XP)
    updateDailyStats(req.uid, type, dateKey);

    // Progreso de misiones + logros (fire-and-forget, solo en sesiones nuevas)
    if (!alreadyDone && xpResult.xpEarned > 0) {
      const misionTipo = type === "breathing"   ? "completar_respiracion"
                       : type === "affirmation" ? "completar_afirmacion"
                       : null;
      trackAndCheck(req.uid, misionTipo ? [[misionTipo, 1]] : []);

      // Log to activityLog (fire-and-forget)
      db.collection("activityLog").add({
        uid: req.uid, type: `mente_${type}`,
        xpGained: xpResult.xpEarned,
        icon: type === "breathing" ? "🌬️" : type === "affirmation" ? "💬" : "🧘",
        message: `Sesión Mente completada: ${type}`,
        timestamp: new Date().toISOString(),
        metadata: { cycles: cycles || null, cardsDone: cardsDone || null },
      }).catch(() => {});
    }

    _summaryCache.delete(req.uid);
    return res.json({ ok:true, xpEarned: xpResult.xpEarned, leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel, xpNext: xpResult.xpNext, alreadyDone });
  } catch (err) {
    console.error("POST /mente/session:", err);
    return res.status(500).json({ ok:false, message:"Error al guardar sesión" });
  }
});

// ═════════════════════════════════════════════════════════════
//  RESUMEN COMPLETO
// ═════════════════════════════════════════════════════════════

// GET /api/mente/summary
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const uid = req.uid;
    const dateKey = today();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoKey = sevenDaysAgo.toISOString().slice(0, 10);

    // Serve from cache when fresh (2-min TTL)
    const cached = _summaryCache.get(uid);
    if (cached && Date.now() - cached.ts < SUMMARY_TTL) {
      return res.json(cached.data);
    }

    // Paralelo: obtener todos los datos del día y stats globales
    const [
      todayMoodSnap,
      todayGratitudeSnap,
      todayPermaSnap,
      strengthsSnap,
      moodHistSnap,
      permaHistSnap,
      todaySessionsSnap,
      weekSessionsSnap,
      recentSessionsSnap,
      userSnap,
    ] = await Promise.all([
      db.collection("users").doc(uid).collection("mente_moods").doc(dateKey).get(),
      db.collection("users").doc(uid).collection("mente_gratitudes").doc(dateKey).get(),
      db.collection("users").doc(uid).collection("mente_perma").doc(dateKey).get(),
      db.collection("users").doc(uid).collection("mente_strengths").doc("result").get(),
      db.collection("users").doc(uid).collection("mente_moods").orderBy("dateKey","desc").limit(14).get(),
      db.collection("users").doc(uid).collection("mente_perma").orderBy("dateKey","desc").limit(8).get(),
      // today's sessions only — avoids missing today's entries due to limit(50) on recent query
      db.collection("users").doc(uid).collection("mente_sessions").where("dateKey","==",dateKey).get(),
      db.collection("users").doc(uid).collection("mente_sessions").where("dateKey", ">=", sevenDaysAgoKey).get(),
      db.collection("users").doc(uid).collection("mente_sessions").orderBy("createdAt","desc").limit(50).get(),
      db.collection("users").doc(uid).get(),
    ]);

    const userData = userSnap.data() || {};

    // Today's completions — use dedicated today query so it's never affected by limit(50)
    const todayDone = {
      mood:        todayMoodSnap.exists,
      gratitude:   todayGratitudeSnap.exists,
      perma:       todayPermaSnap.exists,
      breathing:   todaySessionsSnap.docs.some(d => d.data().type === "breathing"),
      affirmation: todaySessionsSnap.docs.some(d => d.data().type === "affirmation"),
      strengths:   todaySessionsSnap.docs.some(d => d.data().type === "strengths"),
      connection:  todaySessionsSnap.docs.some(d => d.data().type === "connection"),
    };

    // Mood history (últimas 2 semanas)
    const moodHistory = moodHistSnap.docs.map(d => ({ dateKey:d.id, ...d.data() }));

    // PERMA history
    const permaHistory = permaHistSnap.docs.map(d => ({ dateKey:d.id, ...d.data() }));

    // Session counts by type — preferir contadores autoritativos del user doc;
    // usar las últimas 50 sesiones como fallback para tipos sin contador dedicado
    const rawCounts = {};
    recentSessionsSnap.docs.forEach(d => {
      const t = d.data().type || "other";
      rawCounts[t] = (rawCounts[t]||0) + 1;
    });
    const sessionCounts = {
      mood:        userData.menteMoodsCount       || rawCounts.mood        || 0,
      gratitude:   userData.menteGratitudeCount   || rawCounts.gratitude   || 0,
      perma:       userData.mentePermaCount       || rawCounts.perma       || 0,
      breathing:   userData.menteBreathingCount   || rawCounts.breathing   || 0,
      affirmation: userData.menteAffirmationCount || rawCounts.affirmation || 0,
      connection:  userData.menteConnectionCount  || rawCounts.connection  || 0,
      strengths:   rawCounts.strengths            || 0,
    };

    // Racha de check-in — use stored field as primary (authoritative), recalc as fallback
    const moodStreak = userData.moodStreak || (() => {
      let s = 0;
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const dd = new Date(now); dd.setDate(now.getDate()-i);
        const dk = dd.toISOString().slice(0,10);
        if (moodHistory.find(m => m.dateKey === dk)) s++;
        else break;
      }
      return s;
    })();

    // XP total ganado en Zona Mente — use authoritative field from user doc (not session sum)
    const menteXpTotal = userData.menteXpTotal || 0;

    // Insight de mood (tendencia última semana)
    const lastWeekMoods = moodHistory.slice(0,7);
    const MOOD_SCORE = {tense:1,tired:2,neutral:3,good:4,powered:5};
    const moodAvg = lastWeekMoods.length
      ? Math.round(lastWeekMoods.reduce((s,m) => s+(MOOD_SCORE[m.mood]||3),0) / lastWeekMoods.length * 10)/10
      : null;

    const summaryResult = {
      ok: true,
      todayDone,
      moodHistory,
      permaHistory,
      sessionCounts,
      moodStreak,
      menteXpTotal,
      moodAvg,
      weekSessions:           weekSessionsSnap.docs.filter(d => {
        const dk = d.data().dateKey || "";
        return dk >= sevenDaysAgoKey && dk <= dateKey;
      }).length,
      todayGratitudeEntries:  todayGratitudeSnap.exists ? (todayGratitudeSnap.data()?.entries || []) : [],
      strengths: strengthsSnap.exists ? strengthsSnap.data() : null,
      latestPermaAvg: userData.latestPermaAvg || null,
      moodStreakStored: userData.moodStreak || 0,
      topStrength: userData.topStrength || null,
    };
    _summaryCache.set(uid, { ts: Date.now(), data: summaryResult });
    return res.json(summaryResult);
  } catch (err) {
    console.error("GET /mente/summary:", err);
    return res.status(500).json({ ok:false, message:"Error al obtener resumen" });
  }
});

// ═════════════════════════════════════════════════════════════
//  INSIGHTS PERSONALIZADOS
// ═════════════════════════════════════════════════════════════

// GET /api/mente/insights
router.get("/insights", verifyToken, async (req, res) => {
  try {
    const uid = req.uid;

    // Obtener datos paralelos
    const [moodSnap, permaSnap, userSnap, activitySnap] = await Promise.all([
      db.collection("users").doc(uid).collection("mente_moods").orderBy("dateKey","desc").limit(14).get(),
      db.collection("users").doc(uid).collection("mente_perma").orderBy("dateKey","desc").limit(4).get(),
      db.collection("users").doc(uid).get(),
      // Root activityLog (where uid==uid) — exercise logs are NOT in a per-user subcollection
      db.collection("activityLog").where("uid", "==", uid).limit(60).get(),
    ]);

    const userData    = userSnap.data() || {};
    const heroClass   = userData.heroClass || "GUERRERO";
    const streak      = userData.streak    || 0;
    const moodHistory = moodSnap.docs.map(d => ({dateKey:d.id,...d.data()}));
    const permaHist   = permaSnap.docs.map(d => ({dateKey:d.id,...d.data()}));

    const MOOD_SCORE  = {tense:1,tired:2,neutral:3,good:4,powered:5};
    const insights    = [];

    // ── Insight 1: Tendencia de ánimo ────────────────────────
    if (moodHistory.length >= 3) {
      const recent  = moodHistory.slice(0,3).map(m=>MOOD_SCORE[m.mood]||3);
      const older   = moodHistory.slice(3,6).map(m=>MOOD_SCORE[m.mood]||3);
      const avgR    = recent.reduce((a,b)=>a+b,0)/recent.length;
      const avgO    = older.length ? older.reduce((a,b)=>a+b,0)/older.length : avgR;
      const trend   = avgR - avgO;

      if (trend >= 0.7) {
        insights.push({ type:"positive", emoji:"📈", title:"Tendencia de ánimo al alza",
          text:`Tu estado emocional mejoró ${Math.round(trend*20)}% esta semana. El ejercicio consistente está funcionando.`,
          action:"Mantén tu racha — la consistencia es el 80% del bienestar." });
      } else if (trend <= -0.7) {
        insights.push({ type:"warning", emoji:"⚠️", title:"Semana de más tensión de lo usual",
          text:"Tu ánimo bajó los últimos días. Esto es normal y temporal.",
          action: heroClass==="MAGO"
            ? "Prueba 10 min de respiración 4-7-8 para activar el nervio vago."
            : "Una sesión corta de ejercicio libera cortisol. 15 minutos son suficientes." });
      }
    }

    // ── Insight 2: Correlación ejercicio ↔ ánimo ────────────
    // Filter only exercise_complete events; timestamp is an ISO string (not Firestore Timestamp)
    const exerciseDays = activitySnap.docs
      .filter(d => d.data().type === "exercise_complete")
      .map(d => {
        const ts = d.data().timestamp;
        return typeof ts === "string" ? ts.slice(0, 10) : ts?.toDate?.()?.toISOString?.()?.slice(0, 10);
      })
      .filter(Boolean);
    const moodyDays    = moodHistory.filter(m => ["good","powered"].includes(m.mood)).map(m=>m.dateKey);
    const overlap      = moodyDays.filter(d => exerciseDays.includes(d)).length;
    const totalMoody   = moodyDays.length;

    if (totalMoody >= 2 && overlap >= 1) {
      const pct = Math.round((overlap/totalMoody)*100);
      insights.push({ type:"insight", emoji:"🔗", title:"Tu ejercicio mejora tu ánimo",
        text:`El ${pct}% de tus días de mejor ánimo coinciden con días que entrenaste.`,
        action:"La evidencia de tu propio historial: moverse es la mejor inversión emocional." });
    }

    // ── Insight 3: PERMA ─────────────────────────────────────
    if (permaHist.length >= 2) {
      const latest = permaHist[0];
      const prev   = permaHist[1];
      const PERMA_KEYS = ["P","E","R","M","A"];
      const PERMA_NAMES = {P:"Emociones Positivas",E:"Compromiso",R:"Relaciones",M:"Significado",A:"Logros"};

      // Dimensión más baja
      const lowest = PERMA_KEYS.sort((a,b)=>(latest.scores[a]||5)-(latest.scores[b]||5))[0];
      const delta  = (latest.avg||5) - (prev.avg||5);

      if (Math.abs(delta) >= 0.5) {
        insights.push({ type: delta>0 ? "positive" : "warning", emoji: delta>0 ? "🌱":"🌧",
          title: delta>0 ? "Tu bienestar PERMA mejoró":"Una dimensión PERMA necesita atención",
          text: delta>0
            ? `Tu score PERMA subió de ${prev.avg} a ${latest.avg}. Estás construyendo resiliencia real.`
            : `Tu score bajó de ${prev.avg} a ${latest.avg}. La dimensión de ${PERMA_NAMES[lowest]} está más baja.`,
          action: delta>0 ? "Identifica qué hiciste diferente esta semana y replícalo."
            : `Para mejorar ${PERMA_NAMES[lowest]}: dedica 10 min diarios a actividades en esa área.` });
      }
    }

    // ── Insight 4: Racha de check-in ────────────────────────
    if (moodHistory.length >= 7) {
      insights.push({ type:"achievement", emoji:"🔥", title:`${moodHistory.length} días de autoconocimiento`,
        text:`Llevas ${moodHistory.length} días registrando tu ánimo. Eso ya es una práctica de psicología positiva.`,
        action:"El autoconocimiento es el primer pilar de la inteligencia emocional (Goleman, 1995)." });
    }

    // ── Insight 5: Recomendación de clase ───────────────────
    const lastMood = moodHistory[0]?.mood;
    const classInsights = {
      GUERRERO: {
        powered: { emoji:"⚔️", text:"Tu energía está máxima. Hoy es tu día para romper tu récord personal.", action:"Prueba añadir un 10% más de intensidad a tu sesión." },
        tense:   { emoji:"🛡️", text:"La tensión es energía sin dirección. El hierro la transforma.", action:"Una sesión de fuerza canaliza el cortisol mejor que cualquier fármaco." },
        tired:   { emoji:"💪", text:"El descanso también es entrenamiento.", action:"Recuperación activa: caminata 20 min o estiramiento. El cuerpo crece en el reposo." },
      },
      ARQUERO: {
        powered: { emoji:"🏃", text:"Modo sprint activado. La velocidad te espera.", action:"Aprovecha la energía para tu entrenamiento de mayor intensidad cardio." },
        tense:   { emoji:"🌬️", text:"Respira. El arquero que corre sin ritmo falla siempre.", action:"Breathing heroico por 5 minutos antes de entrenar." },
        tired:   { emoji:"🌊", text:"Las olas también bajan. El ritmo es parte del proceso.", action:"Trote suave 20 min. El cardio ligero reactiva tu energía mejor que el descanso total." },
      },
      MAGO: {
        powered: { emoji:"🧘", text:"Tu mente y cuerpo están sincronizados. Estado de flujo disponible.", action:"Sesión de yoga o meditación en movimiento. El máximo de tu clase." },
        tense:   { emoji:"🔮", text:"El mago usa la tensión como combustible interno.", action:"4-7-8: inhala 4s, retén 7s, exhala 8s. 3 ciclos cambian tu estado en 90 segundos." },
        tired:   { emoji:"🌙", text:"La oscuridad también tiene sabiduría.", action:"Meditación de cuerpo completo: 10 minutos de escaneo corporal consciente." },
      },
    };

    if (lastMood && classInsights[heroClass]?.[lastMood]) {
      const ci = classInsights[heroClass][lastMood];
      insights.push({ type:"class", emoji:ci.emoji,
        title:`${heroClass} — Recomendación del día`,
        text: ci.text, action: ci.action });
    }

    // ── Insight 6: Streak de ejercicio ───────────────────────
    if (streak >= 5) {
      insights.push({ type:"achievement", emoji:"🏆", title:`Racha de ${streak} días activa`,
        text:"Una racha de 5+ días de ejercicio genera cambios estructurales en el cerebro (neuroplasticidad).",
        action:"Tu racha es evidencia de identidad, no solo de hábito. Eres alguien que entrena." });
    }

    return res.json({ ok:true, insights: insights.slice(0,5) });
  } catch (err) {
    console.error("GET /mente/insights:", err);
    return res.status(500).json({ ok:false, message:"Error al generar insights" });
  }
});

// ═════════════════════════════════════════════════════════════
//  ESTADÍSTICAS COMUNITARIAS (anónimas)
// ═════════════════════════════════════════════════════════════

// GET /api/mente/community
// collectionGroup queries use no .where() to avoid requiring Firestore Collection Group indexes.
// Filtering is done in-memory after fetch.
// Item 20: limitar a 10 req/min por usuario (protege collectionGroup queries)
router.get("/community", verifyToken, simpleRateLimit(10), async (req, res) => {
  try {
    const dateKey     = today();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    // Serve from cache when fresh (15-min TTL) — avoids 1000+ collectionGroup reads per request
    if (_communityCache.data && Date.now() - _communityCache.ts < COMMUNITY_TTL) {
      return res.json(_communityCache.data);
    }

    // Fetch in parallel — no .where() on collectionGroup to avoid missing index error
    const [moodSnap, strengthsSnap, permaSnap] = await Promise.allSettled([
      db.collectionGroup("mente_moods").limit(1000).get(),
      db.collectionGroup("mente_strengths").limit(300).get(),
      db.collectionGroup("mente_perma").limit(500).get(),
    ]);

    // Ánimos del día — filter in JS
    const moodCount = { tense:0, tired:0, neutral:0, good:0, powered:0 };
    if (moodSnap.status === "fulfilled") {
      moodSnap.value.docs
        .filter(d => d.data().dateKey === dateKey)
        .forEach(d => {
          const m = d.data().mood;
          if (moodCount[m] !== undefined) moodCount[m]++;
        });
    }
    const totalMoods = Object.values(moodCount).reduce((a, b) => a + b, 0);

    // Fortalezas más comunes (top 5)
    const strengthCount = {};
    if (strengthsSnap.status === "fulfilled") {
      strengthsSnap.value.docs.forEach(d => {
        (d.data().top3 || []).forEach(s => { strengthCount[s] = (strengthCount[s] || 0) + 1; });
      });
    }
    const topStrengths = Object.entries(strengthCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, c]) => ({ strength: s, count: c }));

    // PERMA promedio comunitario (últimos 7 días) — filter in JS
    const permaSum   = { P:0, E:0, R:0, M:0, A:0 };
    const permaCount = { P:0, E:0, R:0, M:0, A:0 };
    if (permaSnap.status === "fulfilled") {
      permaSnap.value.docs
        .filter(d => (d.data().dateKey || "") >= sevenDaysAgo)
        .forEach(d => {
          const sc = d.data().scores || {};
          ["P","E","R","M","A"].forEach(k => {
            if (sc[k]) { permaSum[k] += sc[k]; permaCount[k]++; }
          });
        });
    }
    const permaAvg = {};
    ["P","E","R","M","A"].forEach(k => {
      permaAvg[k] = permaCount[k] ? Math.round(permaSum[k] / permaCount[k] * 10) / 10 : null;
    });

    const communityResult = {
      ok: true,
      community: {
        moods:       { count: moodCount, total: totalMoods },
        topStrengths,
        permaAvg,
        activeToday: totalMoods,
      },
    };
    _communityCache = { ts: Date.now(), data: communityResult };
    return res.json(communityResult);
  } catch (err) {
    console.error("GET /mente/community:", err.message);
    return res.status(500).json({ ok: false, message: "Error al obtener datos comunitarios" });
  }
});

// ═════════════════════════════════════════════════════════════
//  ADMIN: OVERVIEW DE BIENESTAR COLECTIVO
// ═════════════════════════════════════════════════════════════

// GET /api/mente/admin/overview
// collectionGroup queries use no .where() to avoid requiring Firestore Collection Group indexes.
router.get("/admin/overview", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const days     = Number(req.query.days) || 7;

    // Item 16: caché en memoria — TTL 5 min, invalidada al guardar config
    const cacheKey = `overview_${days}`;
    const cached   = overviewCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL)
      return res.json({ ok:true, overview:cached.data, cached:true });

    const fromDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const [moodSnap, strengthsSnap, sessionSnap, permaSnap] = await Promise.all([
      db.collectionGroup("mente_moods").limit(2000).get(),
      db.collectionGroup("mente_strengths").limit(500).get(),
      db.collectionGroup("mente_sessions").limit(3000).get(),
      db.collectionGroup("mente_perma").limit(1000).get(),
    ]);

    // Filter by date range in JS (avoids collection group index requirement)
    const filteredMoods    = moodSnap.docs.filter(d    => (d.data().dateKey || "") >= fromDate);
    const filteredSessions = sessionSnap.docs.filter(d => (d.data().dateKey || "") >= fromDate);
    const filteredPerma    = permaSnap.docs.filter(d   => (d.data().dateKey || "") >= fromDate);

    // Actividad por día — todas las sesiones (no solo moods) para reflejar uso real
    const byDay = {};
    filteredSessions.forEach(d => {
      const dk = d.data().dateKey;
      if (dk) byDay[dk] = (byDay[dk] || 0) + 1;
    });

    // Distribución de ánimos
    const moodDist = { tense:0, tired:0, neutral:0, good:0, powered:0 };
    filteredMoods.forEach(d => {
      const m = d.data().mood;
      if (moodDist[m] !== undefined) moodDist[m]++;
    });

    // Sesiones por tipo
    const sessionByType = {};
    filteredSessions.forEach(d => {
      const t = d.data().type || "other";
      sessionByType[t] = (sessionByType[t] || 0) + 1;
    });

    // Fortalezas comunitarias (sin filtro de fecha — son datos históricos)
    const strengthCount = {};
    strengthsSnap.docs.forEach(d => {
      (d.data().top3 || []).forEach(s => { strengthCount[s] = (strengthCount[s] || 0) + 1; });
    });

    // PERMA promedio
    const permaSum = { P:0, E:0, R:0, M:0, A:0 };
    const permaCountMap = { P:0, E:0, R:0, M:0, A:0 };
    filteredPerma.forEach(d => {
      const sc = d.data().scores || {};
      ["P","E","R","M","A"].forEach(k => {
        if (sc[k]) { permaSum[k] += sc[k]; permaCountMap[k]++; }
      });
    });
    const communityPerma = {};
    ["P","E","R","M","A"].forEach(k => {
      communityPerma[k] = permaCountMap[k] ? Math.round(permaSum[k] / permaCountMap[k] * 10) / 10 : 0;
    });

    // Usuarios únicos activos (en el rango)
    const activeUsers = new Set(filteredMoods.map(d => d.ref.parent.parent.id)).size;

    // Item 9: Distribución de rachas comunitarias
    let streakDist = { low:0, medium:0, high:0, total:0 };
    try {
      const streakSnap = await db.collection("users")
        .where("moodStreak", ">", 0)
        .select("moodStreak")
        .get();
      streakSnap.docs.forEach(d => {
        const s = d.data().moodStreak || 0;
        if (s >= 7)      streakDist.high++;
        else if (s >= 3) streakDist.medium++;
        else if (s >= 1) streakDist.low++;
        streakDist.total++;
      });
    } catch { /* índice de Firestore pendiente — streakDist queda en ceros */ }

    // Item 14: PERMA promedio por clase de héroe (solo docs con heroClass guardado)
    const permaByClassRaw = {};
    filteredPerma.forEach(d => {
      const cls = d.data().heroClass;
      if (!cls) return;
      if (!permaByClassRaw[cls]) permaByClassRaw[cls] = { P:0,E:0,R:0,M:0,A:0,count:0 };
      const sc = d.data().scores || {};
      ["P","E","R","M","A"].forEach(k => { permaByClassRaw[cls][k] += sc[k] || 0; });
      permaByClassRaw[cls].count++;
    });
    const permaByClass = {};
    Object.entries(permaByClassRaw).forEach(([cls, data]) => {
      if (data.count > 0) {
        permaByClass[cls] = { count: data.count };
        ["P","E","R","M","A"].forEach(k => {
          permaByClass[cls][k] = Math.round(data[k] / data.count * 10) / 10;
        });
      }
    });

    // Item 16: construir objeto, cachear y devolver
    const overview = {
      activeUsers,
      totalMoods:         filteredMoods.length,
      totalSessions:      filteredSessions.length,
      totalStrengthsUsers: strengthsSnap.docs.length,
      moodDist,
      byDay:         Object.entries(byDay).sort((a,b)=>a[0]>b[0]?1:-1).map(([date,count])=>({date,count})),
      sessionByType,
      topStrengths:  Object.entries(strengthCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([s,c])=>({strength:s,count:c})),
      communityPerma,
      streakDist,
      permaByClass,
    };
    overviewCache.set(cacheKey, { data: overview, ts: Date.now() });
    return res.json({ ok: true, overview });
  } catch (err) {
    console.error("GET /mente/admin/overview:", err.message);
    return res.status(500).json({ ok:false, message:"Error al obtener overview admin" });
  }
});

// ═════════════════════════════════════════════════════════════
//  ADMIN: TOP USUARIOS ACTIVOS EN ZONA MENTE  (Items 18 + 19)
// ═════════════════════════════════════════════════════════════

// GET /api/mente/admin/top-users
// Devuelve los usuarios con mayor menteXpTotal.
// Item 19: el campo `id` es un pseudoId (sha256 truncado) para
//          cumplir GDPR — el UID real nunca sale de este endpoint.
router.get("/admin/top-users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;

    const snap = await db.collection("users")
      .orderBy("menteXpTotal", "desc")
      .select("displayName", "username", "heroClass", "menteXpTotal", "moodStreak", "level")
      .limit(10)
      .get();

    const users = snap.docs.map(d => {
      const u = d.data();
      return {
        uid:        pseudoId(d.id),          // pseudoanonimizado
        displayName: u.displayName || u.username || "Héroe",
        heroClass:   u.heroClass   || "GUERRERO",
        sessions:    u.menteXpTotal ? Math.floor(u.menteXpTotal / 20) : 0, // aprox sesiones
        streak:      u.moodStreak  || 0,
        level:       u.level       || 1,
      };
    });

    return res.json({ ok: true, users, days });
  } catch (err) {
    console.error("GET /mente/admin/top-users:", err.message);
    return res.status(500).json({ ok:false, message:"Error al obtener top usuarios" });
  }
});

// ═════════════════════════════════════════════════════════════
//  CONEXIÓN SOCIAL — Pilar R (Relaciones)
// ═════════════════════════════════════════════════════════════

// POST /api/mente/connection
router.post("/connection", verifyToken, async (req, res) => {
  const { note } = req.body; // Nota libre opcional (max 300 chars)
  const dateKey  = today();
  const ref      = db.collection("users").doc(req.uid).collection("mente_connections").doc(dateKey);

  try {
    const existing = await ref.get();
    if (existing.exists)
      return res.json({ ok:true, message:"Ya registraste tu conexión social hoy", alreadyDone:true, xpEarned:0 });

    await ref.set({
      dateKey,
      note: (typeof note === "string" ? note.trim().slice(0, 300) : "") || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    const xpResult = await grantXP(req.uid, MENTE_XP.connection, "Conexión social del día");

    await db.collection("users").doc(req.uid).collection("mente_sessions").add({
      type: "connection", dateKey, createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection("users").doc(req.uid).update({
      menteConnectionCount: FieldValue.increment(1),
      menteSessions:        FieldValue.increment(1),
    });

    // Item 15: stats diarios (fire-and-forget)
    updateDailyStats(req.uid, "connection", dateKey);

    trackAndCheck(req.uid, [["completar_conexion", 1]]);

    db.collection("activityLog").add({
      uid: req.uid, type: "mente_connection",
      xpGained: xpResult.xpEarned,
      icon: "🤝", message: "Conexión social registrada",
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return res.json({
      ok: true,
      xpEarned:  xpResult.xpEarned,
      leveledUp: xpResult.leveledUp,
      newLevel:  xpResult.newLevel,
      xpNext:    xpResult.xpNext,
    });
  } catch (err) {
    console.error("POST /mente/connection:", err);
    return res.status(500).json({ ok:false, message:"Error al registrar conexión" });
  }
});

// ═════════════════════════════════════════════════════════════
//  ADMIN: GESTIÓN DE ACTIVIDADES PERMA (Item 10)
// ═════════════════════════════════════════════════════════════

const DEFAULT_ACTIVITIES = [
  { id:"mood",        label:"Check-in de Ánimo",    permaTags:["P"],              xp:25, icon:"🌤️", active:true, description:"Registra cómo te sientes hoy" },
  { id:"gratitude",   label:"Diario de Gratitud",   permaTags:["P"],              xp:30, icon:"📓", active:true, description:"Escribe 3 cosas por las que eres agradecido" },
  { id:"breathing",   label:"Respiración",           permaTags:["M"],              xp:20, icon:"🌬️", active:true, description:"Técnica de respiración consciente" },
  { id:"affirmation", label:"Afirmaciones",          permaTags:["E"],              xp:15, icon:"💬", active:true, description:"Afirmaciones positivas para tu mentalidad" },
  { id:"perma",       label:"Evaluación PERMA",     permaTags:["P","E","R","M","A"], xp:40, icon:"🏛️", active:true, description:"Evaluación de bienestar de los 5 pilares" },
  { id:"strengths",   label:"Fortalezas VIA",        permaTags:["A"],              xp:60, icon:"💪", active:true, description:"Test de fortalezas de carácter" },
  { id:"connection",  label:"Conexión Social",       permaTags:["R"],              xp:20, icon:"🤝", active:true, description:"¿Conectaste con alguien importante hoy?" },
];

const ACTIVITY_VALID_KEYS = ["label","permaTags","xp","icon","active","description"];
const VALID_PERMA_TAGS    = ["P","E","R","M","A"];

// GET /api/mente/admin/activities
router.get("/admin/activities", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const snap = await db.collection("mente_activities").orderBy("order", "asc").get()
      .catch(() => null); // graceful if collection doesn't exist yet

    if (!snap || snap.empty) {
      // Seed defaults on first access
      const batch = db.batch();
      DEFAULT_ACTIVITIES.forEach((act, i) => {
        const ref = db.collection("mente_activities").doc(act.id);
        batch.set(ref, { ...act, order: i, createdAt: FieldValue.serverTimestamp() }, { merge: true });
      });
      await batch.commit();
      return res.json({ ok:true, activities: DEFAULT_ACTIVITIES.map((a,i) => ({ ...a, order:i })) });
    }

    return res.json({
      ok: true,
      activities: snap.docs.map(d => ({ id:d.id, ...d.data() })),
    });
  } catch (err) {
    console.error("GET /mente/admin/activities:", err);
    return res.status(500).json({ ok:false, message:"Error al obtener actividades" });
  }
});

// PATCH /api/mente/admin/activities/:id
router.patch("/admin/activities/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ ok:false, message:"ID requerido" });

  const sanitized = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => ACTIVITY_VALID_KEYS.includes(k))
  );

  if (Object.keys(sanitized).length === 0)
    return res.status(400).json({ ok:false, message:"Sin campos válidos" });

  // Validate permaTags if provided
  if (sanitized.permaTags) {
    if (!Array.isArray(sanitized.permaTags) || sanitized.permaTags.some(t => !VALID_PERMA_TAGS.includes(t)))
      return res.status(400).json({ ok:false, message:"permaTags debe ser array de P/E/R/M/A" });
  }

  // Validate xp range
  if (sanitized.xp !== undefined) {
    const n = Number(sanitized.xp);
    if (isNaN(n) || n < 0 || n > 500)
      return res.status(400).json({ ok:false, message:"xp debe ser entre 0 y 500" });
    sanitized.xp = n;
  }

  try {
    const ref = db.collection("mente_activities").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok:false, message:"Actividad no encontrada" });

    await ref.update({ ...sanitized, updatedAt: FieldValue.serverTimestamp() });
    return res.json({ ok:true, message:"Actividad actualizada" });
  } catch (err) {
    console.error("PATCH /mente/admin/activities/:id:", err);
    return res.status(500).json({ ok:false, message:"Error al actualizar actividad" });
  }
});

// POST /api/mente/admin/activities
router.post("/admin/activities", verifyToken, verifyAdmin, async (req, res) => {
  const { id, label, permaTags, xp, icon, description } = req.body;

  if (!id || !label)
    return res.status(400).json({ ok:false, message:"id y label son requeridos" });

  if (!/^[a-z_]+$/.test(id))
    return res.status(400).json({ ok:false, message:"id debe ser snake_case (a-z y guión bajo)" });

  if (!Array.isArray(permaTags) || permaTags.some(t => !VALID_PERMA_TAGS.includes(t)))
    return res.status(400).json({ ok:false, message:"permaTags debe ser array de P/E/R/M/A" });

  const xpNum = Number(xp) || 15;
  if (xpNum < 0 || xpNum > 500)
    return res.status(400).json({ ok:false, message:"xp debe ser entre 0 y 500" });

  try {
    const ref  = db.collection("mente_activities").doc(id);
    const snap = await ref.get();
    if (snap.exists) return res.status(409).json({ ok:false, message:`La actividad "${id}" ya existe` });

    // Count existing docs to set order
    const countSnap = await db.collection("mente_activities").count().get().catch(() => null);
    const order     = countSnap ? countSnap.data().count : 99;

    await ref.set({
      id, label, permaTags, xp: xpNum,
      icon:        icon || "⭐",
      description: (typeof description === "string" ? description.trim().slice(0,300) : "") || "",
      active:      true,
      order,
      createdAt:   FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ ok:true, message:"Actividad creada", id });
  } catch (err) {
    console.error("POST /mente/admin/activities:", err);
    return res.status(500).json({ ok:false, message:"Error al crear actividad" });
  }
});

export default router;
