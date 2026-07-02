import express from "express";
import admin, { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { utcDateStr } from "../utils/challengeUtils.js";
import { applyActiveBoosts } from "../services/boosts.service.js";
import { _weeklyActCache, bustUserCache, WEEKLY_ACT_TTL } from "../utils/userCache.js";
import { trackMenteMissions, trackSaludMissions } from "./missions.routes.js";
import { evaluateMenteAchievements, evaluateSaludAchievements } from "./logros.routes.js";

const router = express.Router();
const { FieldValue } = admin.firestore;

const SUMMARY_TTL = 2 * 60 * 1000;
const summaryCache = new Map();
const ALLOWED_TABS = new Set(["general", "ejercicio", "respiracion", "hidratacion", "nutricion"]);
const SESSION_TYPES = new Set(["exercise_complete", "routine_complete", "exercise", "routineComplete", "exerciseComplete", "sesion_completada"]);
const SALUD_XP = {
  sleep: 12,
  general: 16,
  ejercicio: 18,
  respiracion: 20,
  hidratacion: 18,
  nutricion: 18,
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asDate = (value) => {
  if (!value) return null;
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isTodayByDateKey = (value, dateKey) => {
  const date = asDate(value);
  if (!date) return false;
  return date.toISOString().slice(0, 10) === dateKey;
};

function resolveTrainedToday(userData, workoutTodayExists, dateKey) {
  if (workoutTodayExists) {
    return { value: true, source: "workoutJournal" };
  }

  const activityFields = [
    ["lastWorkoutAt", userData.lastWorkoutAt],
    ["lastExerciseAt", userData.lastExerciseAt],
    ["lastTrainingAt", userData.lastTrainingAt],
    ["lastRoutineAt", userData.lastRoutineAt],
  ];

  const activeField = activityFields.find(([, value]) => isTodayByDateKey(value, dateKey));
  if (activeField) {
    return { value: true, source: activeField[0] };
  }

  const explicitFlags = [
    ["trainedToday", userData.trainedToday],
    ["todayWorkout", userData.todayWorkout],
    ["todayTraining", userData.todayTraining],
  ];
  const explicit = explicitFlags.find(([, value]) => typeof value === "boolean");
  if (explicit) {
    return { value: explicit[1], source: explicit[0] };
  }

  const hasHistoricSignal = activityFields.some(([, value]) => Boolean(asDate(value)));
  return { value: hasHistoricSignal ? false : null, source: hasHistoricSignal ? "historicActivity" : "unknown" };
}

function normalizeDailyState(dateKey, data = {}) {
  const sleep = data.sleep || {};
  const general = data.general || {};
  const ejercicio = data.ejercicio || {};
  const respiracion = data.respiracion || {};
  const hidratacion = data.hidratacion || {};
  const nutricion = data.nutricion || {};
  const hydrationTarget = Math.max(4, toNumber(hidratacion.target, 6));
  const hydrationCups = Math.max(0, toNumber(hidratacion.cups, 0));
  const nutritionMeals = Math.max(0, toNumber(nutricion.meals, 0));
  const completedCount = [
    Boolean(sleep.done),
    Boolean(general.done),
    Boolean(ejercicio.done),
    Boolean(respiracion.done),
    Boolean(hydratationDone(hydrationCups, hydrationTarget)),
    Boolean(nutritionMeals >= 1 || nutricion.done),
  ].filter(Boolean).length;

  return {
    dateKey,
    sleep: {
      done: Boolean(sleep.done),
      hours: toNumber(sleep.hours, 0),
      updatedAt: sleep.updatedAt || "",
    },
    general: {
      done: Boolean(general.done),
      updatedAt: general.updatedAt || "",
    },
    ejercicio: {
      done: Boolean(ejercicio.done),
      updatedAt: ejercicio.updatedAt || "",
    },
    respiracion: {
      done: Boolean(respiracion.done),
      minutes: toNumber(respiracion.minutes, 0),
      updatedAt: respiracion.updatedAt || "",
    },
    hidratacion: {
      cups: hydrationCups,
      target: hydrationTarget,
      done: hydratationDone(hydrationCups, hydrationTarget),
      updatedAt: hidratacion.updatedAt || "",
    },
    nutricion: {
      meals: nutritionMeals,
      done: Boolean(nutricion.done || nutritionMeals >= 1),
      updatedAt: nutricion.updatedAt || "",
    },
    completedCount,
    lastActionAt: data.lastActionAt || "",
  };
}

function hydratationDone(cups, target) {
  return Number(cups || 0) >= Number(target || 6);
}

function applyHealthCounterPatch(basePatch, key, amount = 1) {
  return {
    ...basePatch,
    [key]: FieldValue.increment(amount),
    saludSessions: FieldValue.increment(amount),
    lastSaludAt: new Date().toISOString(),
  };
}

async function grantSaludXp(uid, amount, reason) {
  const userRef = db.collection("users").doc(uid);
  let xpEarned = 0;
  let leveledUp = false;
  let newLevel = 1;
  let xpNext = 100;

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data() || {};
    const { xpFinal: boostedAmount } = applyActiveBoosts(amount, userData);
    xpEarned = boostedAmount;

    const currentXp = toNumber(userData.xp, toNumber(userData.xpTotal, 0));
    const currentLevel = toNumber(userData.level, 1);
    const newXpTotal = currentXp + xpEarned;
    newLevel = Math.floor(Math.sqrt(newXpTotal / 100)) + 1;
    xpNext = Math.pow(newLevel, 2) * 100;
    leveledUp = newLevel > currentLevel;

    const patch = {
      xp: newXpTotal,
      xpTotal: newXpTotal,
      level: newLevel,
      xpNext,
      lastSaludAt: new Date().toISOString(),
    };
    if (leveledUp) {
      patch.totalLevelUps = FieldValue.increment(newLevel - currentLevel);
      patch.skillPoints = FieldValue.increment(newLevel - currentLevel);
      patch.lastLevelUpAt = new Date().toISOString();
    }

    tx.set(userRef, patch, { merge: true });
    tx.set(userRef.collection("xpHistory").doc(), {
      amount: xpEarned,
      baseAmount: amount,
      reason,
      source: "salud",
      createdAt: new Date().toISOString(),
    });
  });

  bustUserCache(uid);
  return { xpEarned, leveledUp, newLevel, xpNext };
}

async function getWeeklySnapshot(uid) {
  const cached = _weeklyActCache.get(uid);
  if (cached && Date.now() - cached.ts < WEEKLY_ACT_TTL && Array.isArray(cached.data?.semana)) {
    const sessions = cached.data.semana.reduce((sum, day) => sum + toNumber(day.sesiones, 0), 0);
    const xp = cached.data.semana.reduce((sum, day) => sum + toNumber(day.xp, 0), 0);
    const activeDays = cached.data.semana.filter((day) => toNumber(day.sesiones, 0) > 0).length;
    return { sessions, xp, activeDays, source: "weeklyCache" };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const logsSnap = await db.collection("activityLog")
    .where("uid", "==", uid)
    .limit(40)
    .get();

  let sessions = 0;
  let xp = 0;
  const activeDays = new Set();
  logsSnap.docs.forEach((doc) => {
    const data = doc.data() || {};
    const timestamp = data.timestamp || "";
    if (!timestamp || timestamp < sevenDaysAgo) return;
    if (!SESSION_TYPES.has(data.type)) return;
    sessions += 1;
    xp += toNumber(data.xpGained || data.xpGanado, 0);
    activeDays.add(timestamp.slice(0, 10));
  });

  return { sessions, xp, activeDays: activeDays.size, source: "activityLog" };
}

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const cached = summaryCache.get(uid);
    if (cached && Date.now() - cached.ts < SUMMARY_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    const dateKey = utcDateStr(0);
    const userRef = db.collection("users").doc(uid);
    const menteSessionsRef = userRef.collection("mente_sessions");

    const [
      userSnap,
      saludTodaySnap,
      workoutTodaySnap,
      moodTodaySnap,
      gratitudeTodaySnap,
      permaTodaySnap,
      menteTodaySnap,
      weekly,
    ] = await Promise.all([
      userRef.get(),
      userRef.collection("salud_daily").doc(dateKey).get(),
      userRef.collection("workoutJournal").doc(dateKey).get(),
      userRef.collection("mente_moods").doc(dateKey).get(),
      userRef.collection("mente_gratitudes").doc(dateKey).get(),
      userRef.collection("mente_perma").doc(dateKey).get(),
      menteSessionsRef.where("dateKey", "==", dateKey).get(),
      getWeeklySnapshot(uid),
    ]);

    const userData = userSnap.data() || {};
    const daily = normalizeDailyState(dateKey, saludTodaySnap.data() || {});
    const trainedState = resolveTrainedToday(userData, workoutTodaySnap.exists, dateKey);
    const todaySessions = menteTodaySnap.docs.map((doc) => doc.data() || {});
    const activeBoosts = typeof userData.activeBoosts === "object" && userData.activeBoosts
      ? userData.activeBoosts
      : {};
    const xp = toNumber(userData.xp, toNumber(userData.xpTotal, 0));
    const xpNext = Math.max(1, toNumber(userData.xpNext, userData.xpMax || 1000));

    const payload = {
      ok: true,
      summary: {
        trainedToday: trainedState.value,
        trainedSource: trainedState.source,
        daily,
        stats: {
          heroClass: userData.heroClass || "DEFAULT",
          level: toNumber(userData.level, 1),
          streak: toNumber(userData.streak, 0),
          xp,
          xpNext,
          xpPct: Math.max(0, Math.min(100, Math.round((xp / xpNext) * 100))),
          hp: toNumber(userData.hp, 100),
          coins: toNumber(userData.coins, 0),
        },
        todayDone: {
          workout: workoutTodaySnap.exists,
          mood: moodTodaySnap.exists,
          gratitude: gratitudeTodaySnap.exists,
          perma: permaTodaySnap.exists,
          breathing: todaySessions.some((entry) => entry.type === "breathing"),
          affirmation: todaySessions.some((entry) => entry.type === "affirmation"),
          mente: todaySessions.length > 0 || moodTodaySnap.exists || gratitudeTodaySnap.exists || permaTodaySnap.exists,
        },
        mind: {
          moodStreak: toNumber(userData.moodStreak, 0),
          latestPermaAvg: userData.latestPermaAvg ?? null,
          topStrength: userData.topStrength || null,
        },
        boosts: {
          activeCount: Object.keys(activeBoosts).length,
          activeBoosts,
          streakShield: userData.streakShield || null,
          supportFlags: {
            xpBonus: Boolean(activeBoosts?.xp_bonus),
            xpMult: Boolean(activeBoosts?.xp_mult),
            cooldownReduction: Boolean(activeBoosts?.cooldown_red),
            streakShieldActive: Boolean(userData.streakShield?.expiresAt && userData.streakShield.expiresAt > new Date().toISOString()),
          },
        },
        weekly,
        moduleState: {
          lastTab: ALLOWED_TABS.has(userData.saludModule?.lastTab) ? userData.saludModule.lastTab : "",
          lastViewedAt: userData.saludModule?.lastViewedAt || "",
        },
        derivedAt: new Date().toISOString(),
      },
    };

    summaryCache.set(uid, { ts: Date.now(), data: payload });
    return res.json(payload);
  } catch (err) {
    console.error("GET /salud/summary:", err);
    return res.status(500).json({ ok: false, message: "Error al obtener resumen de salud" });
  }
});

router.patch("/state", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const requestedTab = String(req.body?.activeTab || "").trim().toLowerCase();
    const activeTab = ALLOWED_TABS.has(requestedTab) ? requestedTab : "general";
    const payload = {
      saludModule: {
        lastTab: activeTab,
        lastViewedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    };

    await db.collection("users").doc(uid).set(payload, { merge: true });
    summaryCache.delete(uid);
    return res.json({ ok: true, state: { lastTab: activeTab, lastViewedAt: payload.saludModule.lastViewedAt } });
  } catch (err) {
    console.error("PATCH /salud/state:", err);
    return res.status(500).json({ ok: false, message: "No se pudo guardar el estado de salud" });
  }
});

router.post("/checkin", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const moduleId = String(req.body?.module || "").trim().toLowerCase();
    const mode = String(req.body?.mode || "").trim().toLowerCase();
    const amount = Math.max(0, toNumber(req.body?.amount, 1));
    if (!ALLOWED_TABS.has(moduleId)) {
      return res.status(400).json({ ok: false, message: "Modulo de salud invalido" });
    }

    const dateKey = utcDateStr(0);
    const dailyRef = db.collection("users").doc(uid).collection("salud_daily").doc(dateKey);
    const snap = await dailyRef.get();
    const current = normalizeDailyState(dateKey, snap.data() || {});
    const nowIso = new Date().toISOString();
    const patch = { lastActionAt: nowIso, updatedAt: FieldValue.serverTimestamp() };
    let xpResult = { xpEarned: 0, leveledUp: false, newLevel: null, xpNext: null };
    let createdProgress = false;
    let activityType = `salud_${moduleId}`;
    let activityLabel = "Salud";
    let userProgressPatch = null;
    const missionEvents = [];

    if (moduleId === "general") {
      if (mode === "sleep") {
        const alreadyDone = current.sleep.done;
        patch.sleep = {
          done: true,
          hours: Math.max(7, toNumber(req.body?.hours, current.sleep.hours || 7)),
          updatedAt: nowIso,
        };
        createdProgress = !alreadyDone;
        activityType = "salud_sleep";
        activityLabel = "Sueño base";
        if (!alreadyDone) {
          xpResult = await grantSaludXp(uid, SALUD_XP.sleep, "Sueño base completado");
          userProgressPatch = applyHealthCounterPatch(userProgressPatch || {}, "saludSleepCount");
          missionEvents.push(["completar_salud_sueno", 1], ["sesion_salud", 1]);
        }
      } else {
        const alreadyDone = current.general.done;
        patch.general = { done: true, updatedAt: nowIso };
        createdProgress = !alreadyDone;
        activityType = "salud_general";
        activityLabel = "Base de bienestar";
        if (!alreadyDone) {
          xpResult = await grantSaludXp(uid, SALUD_XP.general, "Checklist base de bienestar");
          userProgressPatch = applyHealthCounterPatch(userProgressPatch || {}, "saludGeneralCount");
          missionEvents.push(["completar_salud_general", 1], ["sesion_salud", 1]);
        }
      }
    } else if (moduleId === "ejercicio") {
      const alreadyDone = current.ejercicio.done;
      patch.ejercicio = { done: true, updatedAt: nowIso };
      createdProgress = !alreadyDone;
      activityLabel = "Chequeo de movimiento";
      if (!alreadyDone) {
        xpResult = await grantSaludXp(uid, SALUD_XP.ejercicio, "Chequeo de movimiento del dia");
        userProgressPatch = applyHealthCounterPatch(userProgressPatch || {}, "saludMovementCount");
        missionEvents.push(["completar_salud_movimiento", 1], ["sesion_salud", 1]);
      }
    } else if (moduleId === "respiracion") {
      const alreadyDone = current.respiracion.done;
      const minutes = Math.max(3, toNumber(req.body?.minutes, current.respiracion.minutes || 4));
      patch.respiracion = { done: true, minutes, updatedAt: nowIso };
      createdProgress = !alreadyDone;
      activityLabel = "Recuperacion guiada";
      if (!alreadyDone) {
        xpResult = await grantSaludXp(uid, SALUD_XP.respiracion, `Respiracion guiada ${minutes} min`);
        userProgressPatch = applyHealthCounterPatch(userProgressPatch || {}, "saludRecoveryCount");
        await db.collection("users").doc(uid).collection("mente_sessions").add({
          type: "breathing",
          dateKey,
          cycles: minutes,
          source: "salud",
          createdAt: FieldValue.serverTimestamp(),
        });
        trackMenteMissions(uid, "completar_respiracion", 1).catch(() => {});
        evaluateMenteAchievements(uid).catch(() => {});
        missionEvents.push(["completar_salud_recuperacion", 1], ["sesion_salud", 1]);
      }
    } else if (moduleId === "hidratacion") {
      const nextCups = Math.min(12, current.hidratacion.cups + Math.max(1, amount));
      const target = current.hidratacion.target || 6;
      const reachedNow = !current.hidratacion.done && hydratationDone(nextCups, target);
      patch.hidratacion = {
        cups: nextCups,
        target,
        updatedAt: nowIso,
      };
      createdProgress = nextCups !== current.hidratacion.cups;
      activityLabel = "Reserva de agua";
      if (reachedNow) {
        xpResult = await grantSaludXp(uid, SALUD_XP.hidratacion, `Meta de agua ${nextCups}/${target}`);
        userProgressPatch = applyHealthCounterPatch(userProgressPatch || {}, "saludHydrationDays");
        missionEvents.push(["completar_salud_hidratacion", 1], ["sesion_salud", 1]);
      }
    } else if (moduleId === "nutricion") {
      const nextMeals = Math.min(4, current.nutricion.meals + Math.max(1, amount));
      const reachedNow = !current.nutricion.done && nextMeals >= 1;
      patch.nutricion = {
        meals: nextMeals,
        done: nextMeals >= 1,
        updatedAt: nowIso,
      };
      createdProgress = nextMeals !== current.nutricion.meals;
      activityLabel = "Comida base";
      if (reachedNow) {
        xpResult = await grantSaludXp(uid, SALUD_XP.nutricion, "Comida base registrada");
        userProgressPatch = applyHealthCounterPatch(userProgressPatch || {}, "saludNutritionDays");
        missionEvents.push(["completar_salud_nutricion", 1], ["sesion_salud", 1]);
      }
    }

    await dailyRef.set(patch, { merge: true });
    if (userProgressPatch) {
      await db.collection("users").doc(uid).set(userProgressPatch, { merge: true });
      trackSaludMissions(uid, "sesion_salud", 1).catch(() => {});
      for (const [eventType, eventValue] of missionEvents) {
        if (eventType === "sesion_salud") continue;
        trackSaludMissions(uid, eventType, eventValue).catch(() => {});
      }
      evaluateSaludAchievements(uid).catch(() => {});
    }
    summaryCache.delete(uid);

    const fresh = normalizeDailyState(dateKey, { ...snap.data(), ...patch });
    db.collection("activityLog").add({
      uid,
      type: activityType,
      timestamp: nowIso,
      message: activityLabel,
      description: activityLabel,
      xpGained: xpResult.xpEarned || 0,
      icon: "💠",
      color: "#5ad8ff",
      metadata: {
        source: "salud",
        module: moduleId,
        mode: mode || "default",
        createdProgress,
        daily: {
          completedCount: fresh.completedCount,
          hydrationCups: fresh.hidratacion.cups,
          meals: fresh.nutricion.meals,
        },
      },
    }).catch(() => {});

    return res.json({
      ok: true,
      module: moduleId,
      mode: mode || "default",
      createdProgress,
      daily: fresh,
      xpEarned: xpResult.xpEarned || 0,
      leveledUp: xpResult.leveledUp || false,
      newLevel: xpResult.newLevel || null,
      xpNext: xpResult.xpNext || null,
    });
  } catch (err) {
    console.error("POST /salud/checkin:", err);
    return res.status(500).json({ ok: false, message: "No se pudo guardar el progreso de salud" });
  }
});

export default router;
