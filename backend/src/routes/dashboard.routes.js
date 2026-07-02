// src/routes/dashboard.routes.js
import { Router } from "express";
import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { getISOWeekKey, getPrevWeekKey } from "../utils/weekUtils.js";
import { utcDateStr, calcChallengeReward, CHALLENGE_MIN_STREAK } from "../utils/challengeUtils.js";
import { _userStatsCache, _weeklyActCache, USER_STATS_TTL, WEEKLY_ACT_TTL } from "../utils/userCache.js";

const router = Router();

// ── Server-side caches ────────────────────────────────────────
const _statsCache       = new Map(); // key: periodo
const _leaderboardCache = new Map(); // key: "all" | weekKey
const _publicStatsCache = { ts: 0, data: null };

const STATS_TTL        = 5  * 60 * 1000;  // 5 min
const LEADERBOARD_TTL  = 5  * 60 * 1000;  // 5 min
const PUBLIC_STATS_TTL = 30 * 60 * 1000;  // 30 min

function hashNotifId(value) {
  const str = String(value || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function notificationId(prefix, parts = []) {
  return `${prefix}_${hashNotifId(parts.filter(Boolean).join("|"))}`;
}

function notificationTimestamp(...values) {
  return values.find(Boolean) || new Date().toISOString();
}

// ── GET /api/dashboard/public-stats ───────────────────────────
// Estadísticas públicas para la landing page (sin auth)
router.get("/public-stats", async (_req, res) => {
  // Serve from cache if fresh
  if (_publicStatsCache.data && Date.now() - _publicStatsCache.ts < PUBLIC_STATS_TTL) {
    return res.json({ ok: true, stats: _publicStatsCache.data, cached: true });
  }
  try {
    const [usersSnap, exercisesSnap, achievementsSnap] = await Promise.all([
      db.collection("users").limit(500).get(),
      db.collection("achievements").limit(100).get(),
      db.collection("ejercicios").doc("ejercicios").collection("items").limit(100).get(),
    ]);

    const classCounts = { GUERRERO: 0, ARQUERO: 0, MAGO: 0 };
    usersSnap.docs.forEach(doc => {
      const cls = doc.data().heroClass;
      if (cls && classCounts[cls] !== undefined) classCounts[cls]++;
    });

    const data = {
      totalUsers:        usersSnap.size,
      totalExercises:    exercisesSnap.size,
      totalAchievements: achievementsSnap.size,
      classCounts,
    };
    _publicStatsCache.ts   = Date.now();
    _publicStatsCache.data = data;
    return res.json({ ok: true, stats: data });
  } catch (err) {
    console.error("Error en GET /dashboard/public-stats:", err);
    // Return cached stale data or zeros — never block the landing page
    const fallback = _publicStatsCache.data || { totalUsers: 0, totalExercises: 0, totalAchievements: 0, classCounts: { GUERRERO: 0, ARQUERO: 0, MAGO: 0 } };
    return res.json({ ok: true, stats: fallback, cached: true });
  }
});

// ── GET /api/dashboard/stats ───────────────────────────────────
// Obtiene estadísticas generales del dashboard
router.get("/stats", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { periodo = "30d" } = req.query;

    // ── Item 23: check module-scope cache ──
    const cached = _statsCache.get(periodo);
    if (cached && Date.now() - cached.ts < STATS_TTL) {
      const stats = cached.data;
      // Inject period-specific evolution from pre-aggregated doc if present
      const evo = stats._evolution?.[periodo];
      const evolutionData = evo ?? stats.evolutionData ?? [];
      return res.json({ ok:true, stats:{ ...stats, evolutionData, _evolution:undefined } });
    }

    // ── Item 23: try pre-aggregated doc first ──
    let usedPreAgg = false;
    try {
      const aggSnap = await db.doc("stats/aggregated").get();
      if (aggSnap.exists) {
        const agg = aggSnap.data();
        const computedAt = agg.computedAt?.toDate?.() ?? new Date(0);
        const ageHours = (Date.now() - computedAt.getTime()) / 3600000;
        if (ageHours < 25) {
          // Map evolution to the requested period
          const evo = agg.evolution?.[periodo] ?? agg.evolutionData ?? [];
          const stats = {
            totalUsers:        agg.totalUsers,
            activeUsers:       agg.activeUsers,
            newUsers:          agg.newUsers,
            returningUsers:    agg.returningUsers,
            classDistribution: agg.classDistribution,
            totalXP:           agg.totalXP,
            totalAchievements: agg.totalAchievements,
            completedMissions: agg.completedMissions,
            avgStreak:         agg.avgStreak,
            avgSessionTime:    agg.avgSessionTime,
            exerciseCount:     agg.exerciseCount,
            recentUsers:       agg.recentUsers     ?? [],
            levelDistribution: agg.levelDistribution ?? [],
            topExercises:      agg.topExercises    ?? [],
            avgProfile:        agg.avgProfile      ?? [],
            retentionData:     agg.retentionData   ?? [],
            topUsers:          agg.topUsers        ?? [],
            heatmap:           agg.heatmap         ?? [],
            evolutionData:     evo,
            trends:            agg.trends          ?? {},
            menteSessions:     agg.menteSessions   ?? 0,
            menteSessionsAvg:  agg.menteSessionsAvg ?? 0,
            totalExercises:    0, // pre-agg doesn't store this; skip
          };
          _statsCache.set(periodo, { ts: Date.now(), data: { ...stats, _evolution: agg.evolution } });
          usedPreAgg = true;
          return res.json({ ok:true, stats });
        }
      }
    } catch (aggErr) {
      console.warn("[stats] Pre-aggregated doc read failed, falling back to live:", aggErr.message);
    }

    // ── Fall-back: live computation (original logic) ──
    // Total de usuarios
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map(doc => doc.data());
    const totalUsers = users.length;
    const activeUsers = users.filter(u => {
      const lastLogin = new Date(u.lastLoginAt);
      const now = new Date();
      const daysDiff = (now - lastLogin) / (1000 * 60 * 60 * 24);
      return daysDiff < 7;
    }).length;

    // Distribución de clases
    const classDistribution = {
      GUERRERO: users.filter(u => u.heroClass === "GUERRERO").length,
      ARQUERO: users.filter(u => u.heroClass === "ARQUERO").length,
      MAGO: users.filter(u => u.heroClass === "MAGO").length,
    };

    // Total XP distribuido
    const totalXP = users.reduce((sum, u) => sum + (u.xpTotal || u.xp || 0), 0);

    // Usuarios recientes (últimos 5)
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(u => ({
        id: u.uid,
        name: u.username,
        email: u.email,
        cls: u.heroClass,
        lvl: u.level || 1,
        xp: u.xp || 0,
        streak: u.streak || 0,
        status: new Date().getTime() - new Date(u.lastLoginAt).getTime() < 86400000 ? "active" : "inactive",
        joined: new Date(u.createdAt).toLocaleDateString("es-ES"),
      }));

    // Obtener ejercicios completados (desde logs si existen)
    const logsSnapshot = await db.collection("activityLog").get();
    const exerciseCount = logsSnapshot.docs.filter(doc => ["exercise_complete","routine_complete"].includes(doc.data().type)).length;

    // Obtener total de ejercicios
    const exercisesSnapshot = await db.collection("exercises").get();
    const totalExercises = exercisesSnapshot.size;

    // ── NUEVOS DATOS PARA ADMINSTATS ──

    // Distribución de niveles
    const levelDistribution = {};
    users.forEach(u => {
      const lvl = u.level || 1;
      let range;
      if (lvl <= 5) range = "1–5";
      else if (lvl <= 10) range = "6–10";
      else if (lvl <= 20) range = "11–20";
      else if (lvl <= 30) range = "21–30";
      else if (lvl <= 40) range = "31–40";
      else if (lvl <= 50) range = "41–50";
      else range = "50+";
      levelDistribution[range] = (levelDistribution[range] || 0) + 1;
    });

    // Top ejercicios (desde activityLog)
    const exerciseStats = {};
    logsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (["exercise_complete","routine_complete"].includes(data.type) && data.exerciseName) {
        if (!exerciseStats[data.exerciseName]) {
          exerciseStats[data.exerciseName] = { sesiones: 0, xp: 0, completadas: 0 };
        }
        exerciseStats[data.exerciseName].sesiones++;
        exerciseStats[data.exerciseName].xp += data.xpGained || 0;
        if (data.completed) exerciseStats[data.exerciseName].completadas++;
      }
    });
    const topExercises = Object.entries(exerciseStats)
      .sort(([,a], [,b]) => b.sesiones - a.sesiones)
      .slice(0, 8)
      .map(([name, stats]) => ({ name, ...stats }));

    // Perfil promedio (radar)
    const avgProfile = {
      Fuerza: Math.round(users.reduce((sum, u) => sum + (u.stats?.strength || 0), 0) / users.length),
      Cardio: Math.round(users.reduce((sum, u) => sum + (u.stats?.cardio || 0), 0) / users.length),
      Flexibilidad: Math.round(users.reduce((sum, u) => sum + (u.stats?.flexibility || 0), 0) / users.length),
      Racha: Math.round(users.reduce((sum, u) => sum + (u.streak || 0), 0) / users.length),
      Misiones: Math.round(users.reduce((sum, u) => sum + (u.completedMissions || 0), 0) / users.length),
      Logros: Math.round(users.reduce((sum, u) => sum + (u.achievements?.length || 0), 0) / users.length),
    };

    // Curva de retención (simplificada)
    const retentionData = [
      { semana: "S1", retencion: 100 },
      { semana: "S2", retencion: 72 },
      { semana: "S3", retencion: 58 },
      { semana: "S4", retencion: 49 },
      { semana: "S6", retencion: 38 },
      { semana: "S8", retencion: 31 },
      { semana: "S12", retencion: 24 },
    ];

    // Top usuarios
    const topUsers = users
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 8)
      .map((u, i) => ({
        pos: i + 1,
        nombre: u.username,
        clase: u.heroClass,
        nivel: u.level || 1,
        xp: u.xp || 0,
        streak: u.streak || 0,
        sesiones: u.totalSessions || 0,
      }));

    // Evolución temporal (mock por ahora, pero basado en logs)
    const now = new Date();
    let days, dataPoints;
    switch (periodo) {
      case "7d": days = 7; dataPoints = 7; break;
      case "30d": days = 30; dataPoints = 30; break;
      case "90d": days = 90; dataPoints = 13; break;
      case "1y": days = 365; dataPoints = 12; break;
      default: days = 30; dataPoints = 30;
    }

    const evolutionData = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (days / dataPoints) * 24 * 60 * 60 * 1000);
      const dayLogs = logsSnapshot.docs.filter(doc => {
        const logDate = new Date(doc.data().timestamp);
        return logDate.toDateString() === date.toDateString();
      });

      const usuarios = new Set(dayLogs.map(doc => doc.data().uid || doc.data().userId)).size;
      const sesiones = dayLogs.filter(doc => ["exercise_complete","routine_complete"].includes(doc.data().type)).length;
      const xp = dayLogs.reduce((sum, doc) => sum + (doc.data().xpGained || 0), 0);
      const nuevos = dayLogs.filter(doc => doc.data().type === "register").length;

      evolutionData.push({
        dia: periodo === "7d" ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][date.getDay()] :
             periodo === "1y" ? `M${Math.floor(i / (dataPoints / 12)) + 1}` :
             `${date.getDate()}`,
        usuarios,
        sesiones,
        xp,
        nuevos,
      });
    }

    // Heatmap de actividad (últimas 10 semanas)
    const heatmap = [];
    for (let w = 9; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now.getTime() - (w * 7 + d) * 24 * 60 * 60 * 1000);
        const dayActivity = logsSnapshot.docs.filter(doc => {
          const logDate = new Date(doc.data().timestamp);
          return logDate.toDateString() === date.toDateString() && ["exercise_complete","routine_complete"].includes(doc.data().type);
        }).length;
        week.push(Math.min(dayActivity, 50)); // Cap at 50
      }
      heatmap.push(week);
    }

    // KPIs adicionales
    const totalAchievements = await db.collection("achievements").get().then(snap => snap.size);
    const completedMissions = logsSnapshot.docs.filter(doc => doc.data().type === "mission_claim").length;
    const avgStreak = Math.round(users.reduce((sum, u) => sum + (u.streak || 0), 0) / users.length);
    const avgSessionTime = 28; // Mock, en minutos

    const liveStats = {
      totalUsers,
      activeUsers,
      classDistribution,
      totalXP,
      exerciseCount,
      totalExercises,
      recentUsers,
      levelDistribution: Object.entries(levelDistribution).map(([rango, usuarios]) => ({ rango, usuarios })),
      topExercises,
      avgProfile: Object.entries(avgProfile).map(([attr, valor]) => ({ attr, valor })),
      retentionData,
      topUsers,
      evolutionData,
      heatmap,
      totalAchievements,
      completedMissions,
      avgStreak,
      avgSessionTime,
    };

    // Cache the live result so subsequent tab-switches within TTL skip re-computation
    _statsCache.set(periodo, { ts: Date.now(), data: liveStats });

    return res.json({ ok: true, stats: liveStats });
  } catch (err) {
    console.error("Error en GET /dashboard/stats:", err);
    // Return stale cache or minimal fallback rather than breaking the admin panel
    const stale = _statsCache.get(req.query?.periodo || "30d");
    if (stale) return res.json({ ok: true, stats: stale.data, cached: true });
    return res.json({ ok: false, message: err.message, stats: null });
  }
});

// ── GET /api/dashboard/user-stats ─────────────────────────────
// Datos de resumen para el usuario autenticado (Mi perfil - Resumen)
router.get("/user-stats", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Serve from per-user cache when fresh (saves 100+ Firestore reads)
    const cached = _userStatsCache.get(uid);
    if (cached && Date.now() - cached.ts < USER_STATS_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    const userRef  = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    const user = userSnap.data();

    // misionesCompletadas: read from incremental counter on user doc (set by missions claim)
    // Fall back to subcollection scan only if counter doesn't exist yet (legacy users)
    let completedMissions = user.completedMissions != null
      ? Number(user.completedMissions)
      : null;

    if (completedMissions === null) {
      const missionSnap = await userRef.collection("missions").get();
      completedMissions = missionSnap.docs.filter(doc => {
        const d = doc.data();
        return d.reclamada === true || d.estado === "completada";
      }).length;
    }

    // tiempoTotal: read from incremental counter if stored, else compute from activityLog (limit 30)
    let tiempoTotal = user.tiempoTotal != null ? Number(user.tiempoTotal) : null;
    let ejercicioFav = user.ejercicioFav || null;

    if (tiempoTotal === null || ejercicioFav === null) {
      const snap = await db.collection("activityLog")
        .where("uid", "==", uid)
        .limit(30)
        .get();
      const acts = snap.docs.map(d => d.data())
        .filter(e => ["exercise_complete","routine_complete","exercise"].includes(e.type));

      if (tiempoTotal === null) {
        tiempoTotal = acts.reduce((s, e) => {
          const dur = Number(e.metadata?.tiempoRealizado || e.tiempoRealizado || 0);
          return s + (isNaN(dur) ? 0 : dur);
        }, 0);
      }
      if (ejercicioFav === null) {
        const cnt = {};
        acts.forEach(e => { const k = e.ejercicioId||e.exerciseId||e.exerciseName||null; if(k) cnt[k]=(cnt[k]||0)+1; });
        ejercicioFav = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0] || "N/A";
      }
    }

    const rawCreatedAt = user.createdAt || null;
    const createdAtDate =
      typeof rawCreatedAt?.toDate === "function"
        ? rawCreatedAt.toDate()
        : rawCreatedAt instanceof Date
          ? rawCreatedAt
          : rawCreatedAt
            ? new Date(rawCreatedAt)
            : null;
    const createdAtIso = createdAtDate && !Number.isNaN(createdAtDate.getTime())
      ? createdAtDate.toISOString().slice(0, 10)
      : "";
    const diasActivo = createdAtDate && !Number.isNaN(createdAtDate.getTime())
      ? Math.max(1, Math.floor((Date.now() - createdAtDate.getTime()) / 86400000))
      : 0;
    const logrosObtenidos  = Array.isArray(user.badges) ? user.badges.length : 0;
    const sesionesTotales  = Number(user.totalRutinas || 0);

    const payload = {
      ok: true,
      user,
      stats: {
        sesionesTotales,
        xpTotal:             Number(user.xpTotal || user.xp || 0),
        rachaMax:            Number(user.maxStreak || user.streak || 0),
        tiempoTotal,
        logrosObtenidos,
        misionesCompletadas: completedMissions,
        ejercicioFav,
        categFav:            user.categFav || user.heroClass || "N/A",
        diasActivo,
        nivel:               Number(user.level || 1),
        xp:                  Number(user.xp || 0),
        xpNext:              Number(user.xpNext || 1000),
        hp:                  Number(user.hp || 100),
        streak:              Number(user.streak || 0),
        coins:               Number(user.coins || 0),
        gems:                Number(user.gems || 0),
        calorias:            Number(user.calorias || 0),
        recordPeso:          Number(user.recordPeso || 0),
        username:            user.username || "Héroe",
        email:               user.email || "",
        heroClass:           user.heroClass || "GUERRERO",
        heroName:            user.heroName || "",
        titulo:              user.titulo || "",
        bio:                 user.bio || "",
        createdAt:           createdAtIso,
        pendingEmailTarget:  user.pendingEmailTarget || "",
        pendingEmailStatus:  user.pendingEmailStatus || "idle",
        pendingEmailRequestedAt: user.pendingEmailRequestedAt || "",
        pendingEmailResolvedAt: user.pendingEmailResolvedAt || "",
        profileModules:      user.profileModules || {},
        activeBoosts:        user.activeBoosts || {},
        streakShield:        user.streakShield || null,
        ownedSkins:          user.ownedSkins  || ["default"],
        activeSkin:          user.activeSkin  || "default",
        ownedAvatars:        user.ownedAvatars || ["avatar_01"],
        activeAvatar:        user.activeAvatar || "avatar_01",
        ownedFrames:         user.ownedFrames  || [],
        activeFrame:         user.activeFrame  || null,
        usernameChanged:     user.usernameChanged || false,
        ownedTitles: (() => {
          const arr = Array.isArray(user.ownedTitles) ? user.ownedTitles : [];
          if (user.titulo && !arr.includes(user.titulo)) return [...arr, user.titulo];
          return arr;
        })(),
      },
    };

    _userStatsCache.set(uid, { ts: Date.now(), data: payload });
    return res.json(payload);
  } catch (err) {
    console.error("Error en GET /dashboard/user-stats:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/dashboard/weekly-activity ────────────────────────
// Actividad de los últimos 7 días del usuario (sesiones + XP por día)
router.get("/weekly-activity", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Serve from per-user cache — weekly chart doesn't need real-time data
    const wCached = _weeklyActCache.get(uid);
    if (wCached && Date.now() - wCached.ts < WEEKLY_ACT_TTL) {
      return res.json({ ...wCached.data, cached: true });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Single-field query to avoid composite index requirement; filter by date in memory
    const snap = await db.collection("activityLog")
      .where("uid", "==", uid)
      .limit(50)
      .get();

    // Build 7-day result array (oldest first)
    const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({ dia: DIAS[d.getDay()], fecha: d.toISOString().slice(0, 10), sesiones: 0, xp: 0 });
    }

    const SESSION_TYPES = new Set(["exercise_complete","routine_complete","exercise","routineComplete","exerciseComplete","sesion_completada"]);

    snap.docs.forEach(doc => {
      const data = doc.data();
      if (!data.timestamp) return;
      const dateStr = data.timestamp.slice(0, 10);
      const idx = result.findIndex(r => r.fecha === dateStr);
      if (idx === -1) return;
      if (SESSION_TYPES.has(data.type)) {
        result[idx].sesiones++;
        result[idx].xp += Number(data.xpGained || data.xpGanado || 0);
      }
    });

    const payload = { ok: true, semana: result };
    _weeklyActCache.set(uid, { ts: Date.now(), data: payload });
    return res.json(payload);
  } catch (err) {
    console.error("Error en GET /dashboard/weekly-activity:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/dashboard/leaderboard ────────────────────────────
// Top usuarios por XP (accesible a todos los usuarios autenticados)
router.get("/leaderboard", verifyToken, async (req, res) => {
  const cached = _leaderboardCache.get("all");
  if (cached && Date.now() - cached.ts < LEADERBOARD_TTL) {
    return res.json({ ok: true, leaderboard: cached.data, cached: true });
  }
  try {
    const usersSnapshot = await db.collection("users").orderBy("xp", "desc").limit(20).get();
    const leaderboard = usersSnapshot.docs
      .map((doc, i) => {
        const u = doc.data();
        return { pos: i + 1, uid: u.uid, nombre: u.username, clase: u.heroClass || "GUERRERO", nivel: u.level || 1, xp: u.xp || 0, streak: u.streak || 0 };
      });
    _leaderboardCache.set("all", { ts: Date.now(), data: leaderboard });
    return res.json({ ok: true, leaderboard });
  } catch (err) {
    console.error("Error en GET /dashboard/leaderboard:", err);
    const cached = _leaderboardCache.get("all");
    if (cached) return res.json({ ok: true, leaderboard: cached.data, cached: true });
    return res.json({ ok: true, leaderboard: [] });
  }
});

// ── Helper: otorga badges a los top-3 de cada clase de una semana pasada ──
// Se ejecuta de forma lazy la primera vez que alguien consulta el leaderboard
// semanal en una semana nueva. Usa un flag "badgesAwarded" para ser idempotente.
async function awardWeeklyBadgesIfNeeded(weekKey) {
  const weekRef = db.collection("weeklyLeaderboard").doc(weekKey);

  try {
    await db.runTransaction(async (tx) => {
      const weekDoc = await tx.get(weekRef);
      if (weekDoc.exists && weekDoc.data()?.badgesAwarded) return; // ya se otorgaron

      const usersSnap = await db.collection("users").get();
      const allUsers  = usersSnap.docs.map(d => d.data());
      const CLASSES   = ["GUERRERO", "ARQUERO", "MAGO"];
      const champions = {};

      for (const cls of CLASSES) {
        const top = allUsers
          .filter(u => u.heroClass === cls && u.weeklyXPWeek === weekKey && (u.weeklyXP || 0) > 0 && u.roleId !== "admin")
          .sort((a, b) => (b.weeklyXP || 0) - (a.weeklyXP || 0))
          .slice(0, 3);

        champions[cls] = top.map((u, i) => ({
          uid: u.uid, username: u.username, weeklyXP: u.weeklyXP || 0, pos: i + 1,
        }));

        for (let i = 0; i < top.length; i++) {
          const badgeId = `semana_top${i + 1}_${cls}_${weekKey}`;
          const uRef = db.collection("users").doc(top[i].uid);
          tx.update(uRef, { badges: admin.firestore.FieldValue.arrayUnion(badgeId) });
        }
      }

      tx.set(weekRef, {
        badgesAwarded: true,
        awardedAt: new Date().toISOString(),
        weekKey,
        champions,
      });
    });

    console.log(`[weeklyLeaderboard] Badges awarded for week ${weekKey}`);
  } catch (err) {
    // Non-fatal: log and continue — badges can be retried on next request
    console.error(`[weeklyLeaderboard] Error awarding badges for ${weekKey}:`, err.message);
  }
}

// ── GET /api/dashboard/leaderboard/weekly ─────────────────────
// Ranking semanal por clase — se resetea cada lunes (ISO week)
// Top 3 de la semana anterior reciben badges permanentes en su perfil
router.get("/leaderboard/weekly", verifyToken, async (req, res) => {
  const currentWeek = getISOWeekKey();
  const cacheKey    = `weekly_${currentWeek}`;
  const cached      = _leaderboardCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < LEADERBOARD_TTL) {
    return res.json({ ok: true, week: currentWeek, leaderboard: cached.data, cached: true });
  }
  try {
    const prevWeek = getPrevWeekKey(currentWeek);
    // Award previous-week badges lazily (non-blocking, uses its own read)
    awardWeeklyBadgesIfNeeded(prevWeek).catch(() => {});

    // Fetch users ordered by weeklyXP desc, limit to 200 to cover all classes
    const usersSnap = await db.collection("users").limit(200).get();
    const allUsers  = usersSnap.docs.map(d => d.data()).filter(u => u.roleId !== "admin");

    const CLASSES = ["GUERRERO", "ARQUERO", "MAGO"];
    const result  = {};
    for (const cls of CLASSES) {
      result[cls] = allUsers
        .filter(u => u.heroClass === cls)
        .map(u => ({
          uid:      u.uid,
          nombre:   u.username || "Héroe",
          nivel:    u.level || 1,
          weeklyXP: u.weeklyXPWeek === currentWeek ? (u.weeklyXP || 0) : 0,
          streak:   u.streak || 0,
        }))
        .sort((a, b) => b.weeklyXP - a.weeklyXP)
        .slice(0, 10)
        .map((u, i) => ({ ...u, pos: i + 1, isBadge: i < 3 && u.weeklyXP > 0, badgeTier: i + 1 }));
    }

    _leaderboardCache.set(cacheKey, { ts: Date.now(), data: result });
    return res.json({ ok: true, week: currentWeek, leaderboard: result });
  } catch (err) {
    console.error("Error en GET /dashboard/leaderboard/weekly:", err);
    const cached = _leaderboardCache.get(cacheKey);
    if (cached) return res.json({ ok: true, week: currentWeek, leaderboard: cached.data, cached: true });
    return res.json({ ok: true, week: currentWeek, leaderboard: { GUERRERO: [], ARQUERO: [], MAGO: [] } });
  }
});

// ── GET /api/dashboard/user-activity ──────────────────────────
// Actividad reciente del usuario autenticado (sin índice compuesto)
router.get("/user-activity", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const logsSnapshot = await db.collection("activityLog")
      .where("uid", "==", uid)
      .limit(50)
      .get();

    const activities = logsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "exercise",
          name: data.exerciseName || data.description || data.message || "Actividad",
          xp: data.xpGained || 0,
          time: data.timestamp || null,
          icon: data.icon || "💪",
          color: data.color || null,
          metadata: data.metadata || {},
        };
      })
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 8);

    return res.json({ ok: true, activities });
  } catch (err) {
    console.error("Error en GET /dashboard/user-activity:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/dashboard/activity-feed ───────────────────────────
// Obtiene el feed de actividad reciente
router.get("/activity-feed", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const logsSnapshot = await db.collection("activityLog")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const activities = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      const rawTs = data.timestamp || null;
      return {
        id: doc.id,
        icon: data.icon || "📋",
        msg: data.message || data.description || "Actividad registrada",
        time: rawTs ? new Date(rawTs).toLocaleString("es-ES") : "hace poco",
        rawTimestamp: rawTs,    // ISO string — used by frontend to sort
        color: data.color || "#4CC9F0",
      };
    });

    // Sort newest first by raw timestamp (orderBy may not always be reliable for mixed types)
    activities.sort((a, b) => {
      if (!a.rawTimestamp && !b.rawTimestamp) return 0;
      if (!a.rawTimestamp) return 1;
      if (!b.rawTimestamp) return -1;
      return b.rawTimestamp.localeCompare(a.rawTimestamp);
    });

    return res.json({ ok: true, activities });
  } catch (err) {
    console.error("Error en GET /dashboard/activity-feed:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/dashboard/notifications ─────────────────────────
// Notificaciones reales del usuario: logros por reclamar, misiones completadas,
// items nuevos en tienda, nivel reciente.
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = db.collection("users").doc(uid);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [userSnap, missionsSnap, objetosSnap, readsSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("missions").get(),
      db.collection("objects").where("activo", "==", true).get(),
      userRef.collection("notificationReads").get(),
    ]);

    const user = userSnap.data() || {};
    const reads = new Map(readsSnap.docs.map(doc => [doc.id, doc.data()]));
    const notifications = [];
    const addNotification = (payload) => {
      const readState = reads.get(payload.id);
      notifications.push({
        read: Boolean(readState?.read),
        readAt: readState?.readAt || null,
        source: payload.source || "generated",
        priority: payload.priority ?? 1,
        severity: payload.severity || "info",
        group: payload.group || payload.tipo || "sistema",
        ...payload,
      });
    };

    const newBadges = Array.isArray(user.badges) ? user.badges.filter(b => b.isNew === true) : [];
    if (newBadges.length > 0) {
      const badgeKey = newBadges.map(b => b.id || b.nombre || "logro").sort().join("|");
      addNotification({
        id: notificationId("badges_new", [badgeKey, newBadges.length]),
        tipo: "logro",
        titulo: `${newBadges.length} logro${newBadges.length > 1 ? "s" : ""} por reclamar`,
        desc: newBadges.slice(0, 3).map(b => b.nombre || "Logro").join(", "),
        icono: "medal",
        color: "#FFD700",
        seccion: "logros",
        timestamp: notificationTimestamp(newBadges[0]?.createdAt, newBadges[0]?.unlockedAt, user.updatedAt),
        group: "logros",
        severity: "success",
        priority: 4,
      });
    }

    const misionesListas = missionsSnap.docs.filter(doc => {
      const d = doc.data();
      return d.estado === "completada" && !d.reclamada;
    });
    if (misionesListas.length > 0) {
      const missionIds = misionesListas.map(doc => doc.id).sort();
      const newestMission = misionesListas
        .map(doc => doc.data().completedAt || doc.data().updatedAt || doc.data().createdAt || "")
        .sort()
        .at(-1);
      addNotification({
        id: notificationId("missions_done", missionIds),
        tipo: "mision",
        titulo: `${misionesListas.length} mision${misionesListas.length > 1 ? "es" : ""} completada${misionesListas.length > 1 ? "s" : ""}`,
        desc: "Reclama tus recompensas pendientes.",
        icono: "quest",
        color: "#E85D04",
        seccion: "misiones",
        timestamp: notificationTimestamp(newestMission),
        group: "misiones",
        severity: "urgent",
        priority: 5,
      });
    }

    if (user.lastLevelUp && user.lastLevelUp > sevenDaysAgo) {
      addNotification({
        id: notificationId("level_up", [user.lastLevelUp, user.level || 1]),
        tipo: "nivel",
        titulo: `Subiste al nivel ${user.level || 1}`,
        desc: `Ya llevas ${(user.xpTotal || 0).toLocaleString()} XP total.`,
        icono: "level",
        color: "#FFD700",
        seccion: "perfil",
        timestamp: user.lastLevelUp,
        group: "progreso",
        severity: "success",
        priority: 3,
      });
    }

    const newItems = objetosSnap.docs
      .filter(doc => { const d = doc.data(); return d.creadoEn && d.creadoEn > sevenDaysAgo; })
      .map(doc => ({ id: doc.id, ...doc.data() }));
    if (newItems.length > 0) {
      const itemIds = newItems.map(i => i.id).sort();
      const newestItem = newItems.map(i => i.creadoEn || "").sort().at(-1);
      addNotification({
        id: notificationId("shop_new", itemIds),
        tipo: "tienda",
        titulo: `${newItems.length} item${newItems.length > 1 ? "s nuevos" : " nuevo"} en la tienda`,
        desc: newItems.slice(0, 3).map(i => i.nombre).join(", "),
        icono: "shop",
        color: "#FF9F1C",
        seccion: "tienda",
        timestamp: notificationTimestamp(newestItem),
        group: "tienda",
        severity: "info",
        priority: 2,
      });
    }

    if (user.streakShield?.expiresAt && user.streakShield.expiresAt > new Date().toISOString()) {
      const days = Math.ceil((new Date(user.streakShield.expiresAt).getTime() - Date.now()) / 86400000);
      addNotification({
        id: notificationId("streak_shield", [user.streakShield.expiresAt, user.streak || 0]),
        tipo: "racha",
        titulo: `Escudo de racha activo · ${days}d restante${days > 1 ? "s" : ""}`,
        desc: `Tu racha de ${user.streak || 0} dias esta protegida.`,
        icono: "shield",
        color: "#E74C3C",
        seccion: "tienda",
        timestamp: notificationTimestamp(user.streakShield.activatedAt, user.streakShield.expiresAt),
        group: "racha",
        severity: days <= 1 ? "warning" : "info",
        priority: days <= 1 ? 4 : 2,
      });
    }

    notifications.sort((a, b) =>
      Number(a.read) - Number(b.read) ||
      (b.priority || 0) - (a.priority || 0) ||
      (b.timestamp || "").localeCompare(a.timestamp || "")
    );

    return res.json({
      ok: true,
      notifications,
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error en GET /dashboard/notifications:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

router.patch("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const id = String(req.params.id || "").trim();
    if (!id || id.includes("/")) {
      return res.status(400).json({ ok: false, message: "Notificacion invalida" });
    }
    const now = new Date().toISOString();
    await db.collection("users").doc(uid).collection("notificationReads").doc(id).set({
      read: true,
      readAt: now,
      updatedAt: now,
    }, { merge: true });
    return res.json({ ok: true, id, readAt: now });
  } catch (err) {
    console.error("Error en PATCH /dashboard/notifications/:id/read:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

router.post("/notifications/read-all", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map(id => String(id || "").trim()).filter(id => id && !id.includes("/"))
      : [];
    if (ids.length === 0) {
      return res.json({ ok: true, marked: 0 });
    }
    const now = new Date().toISOString();
    const batch = db.batch();
    const readsRef = db.collection("users").doc(uid).collection("notificationReads");
    ids.slice(0, 100).forEach(id => {
      batch.set(readsRef.doc(id), { read: true, readAt: now, updatedAt: now }, { merge: true });
    });
    await batch.commit();
    return res.json({ ok: true, marked: Math.min(ids.length, 100), readAt: now });
  } catch (err) {
    console.error("Error en POST /dashboard/notifications/read-all:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/notifications-legacy", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = db.collection("users").doc(uid);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [userSnap, missionsSnap, objetosSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("missions").get(),
      db.collection("objects").where("activo", "==", true).get(),
    ]);

    const user = userSnap.data() || {};
    const notifications = [];

    // 1. Logros por reclamar (badge con isNew: true)
    const newBadges = Array.isArray(user.badges) ? user.badges.filter(b => b.isNew === true) : [];
    if (newBadges.length > 0) {
      notifications.push({
        id: "badges_new",
        tipo: "logro",
        titulo: `${newBadges.length} logro${newBadges.length > 1 ? "s" : ""} por reclamar`,
        desc: newBadges.slice(0, 3).map(b => b.nombre || "Logro").join(", "),
        icono: "🏅",
        color: "#FFD700",
        seccion: "logros",
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Misiones completadas sin reclamar
    const misionesListas = missionsSnap.docs.filter(doc => {
      const d = doc.data();
      return d.estado === "completada" && !d.reclamada;
    });
    if (misionesListas.length > 0) {
      notifications.push({
        id: "missions_done",
        tipo: "mision",
        titulo: `${misionesListas.length} misión${misionesListas.length > 1 ? "es" : ""} completada${misionesListas.length > 1 ? "s" : ""}`,
        desc: "¡Reclama tus recompensas pendientes!",
        icono: "🎯",
        color: "#E85D04",
        seccion: "misiones",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Subida de nivel reciente (última semana)
    if (user.lastLevelUp && user.lastLevelUp > sevenDaysAgo) {
      notifications.push({
        id: "level_up",
        tipo: "nivel",
        titulo: `¡Subiste al Nivel ${user.level || 1}!`,
        desc: `Has ganado ${(user.xpTotal || 0).toLocaleString()} XP en total. ¡Sigue así!`,
        icono: "⬆️",
        color: "#FFD700",
        seccion: "perfil",
        timestamp: user.lastLevelUp,
      });
    }

    // 4. Items nuevos en la tienda (últimos 7 días, admin los agregó)
    const newItems = objetosSnap.docs
      .filter(doc => { const d = doc.data(); return d.creadoEn && d.creadoEn > sevenDaysAgo; })
      .map(doc => doc.data());
    if (newItems.length > 0) {
      notifications.push({
        id: "shop_new",
        tipo: "tienda",
        titulo: `${newItems.length} ítem${newItems.length > 1 ? "s nuevos" : " nuevo"} en la tienda`,
        desc: newItems.slice(0, 3).map(i => i.nombre).join(", "),
        icono: "🛍️",
        color: "#FF9F1C",
        seccion: "tienda",
        timestamp: newItems[0].creadoEn,
      });
    }

    // 5. Escudo de racha activo (recordatorio)
    if (user.streakShield?.expiresAt && user.streakShield.expiresAt > new Date().toISOString()) {
      const days = Math.ceil((new Date(user.streakShield.expiresAt).getTime() - Date.now()) / 86400000);
      notifications.push({
        id: "streak_shield",
        tipo: "racha",
        titulo: `Escudo de Racha activo · ${days}d restante${days > 1 ? "s" : ""}`,
        desc: `Tu racha de ${user.streak || 0} días está protegida.`,
        icono: "🔥",
        color: "#E74C3C",
        seccion: "tienda",
        timestamp: new Date().toISOString(),
      });
    }

    // Ordenar: más recientes primero
    notifications.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    return res.json({ ok: true, notifications, total: notifications.length });
  } catch (err) {
    console.error("Error en GET /dashboard/notifications:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/dashboard/chart-data ──────────────────────────────
// Obtiene datos para gráficos de registros diarios
router.get("/chart-data", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { periodo = "7d" } = req.query;
    let days, dataPoints;
    switch (periodo) {
      case "30d": days = 30; dataPoints = 30; break;
      case "90d": days = 90; dataPoints = 13; break;
      default:    days = 7;  dataPoints = 7;
    }

    const cutoffMs   = Date.now() - days * 24 * 60 * 60 * 1000;
    const cutoffISO  = new Date(cutoffMs).toISOString();
    const dayNames   = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const now        = new Date();

    // Fetch logs since cutoff (stored as ISO strings)
    const logsSnapshot = await db.collection("activityLog").get();
    const filteredDocs  = logsSnapshot.docs.filter(doc => {
      const ts = doc.data().timestamp;
      return ts && ts >= cutoffISO;
    });

    const chartData = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (days / dataPoints) * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();

      const dayDocs = filteredDocs.filter(doc => {
        const ts = doc.data().timestamp;
        return ts && new Date(ts).toDateString() === dateStr;
      });

      const users    = new Set(dayDocs.map(d => d.data().userId || d.data().uid)).size;
      const sesiones = dayDocs.filter(d => ["exercise","exercise_complete","routine_complete"].includes(d.data().type)).length;
      const xp       = dayDocs.reduce((s, d) => s + (Number(d.data().xpGained || d.data().amount) || 0), 0);

      const label = periodo === "7d"
        ? dayNames[date.getDay()]
        : periodo === "90d"
          ? `S${dataPoints - i}`
          : `${date.getDate()}`;

      chartData.push({ dia: label, usuarios: users, sesiones, xp });
    }

    return res.json({ ok: true, data: chartData });
  } catch (err) {
    console.error("Error en GET /dashboard/chart-data:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /api/dashboard/log-activity ───────────────────────────
// Registra una actividad en el log
router.post("/log-activity", verifyToken, async (req, res) => {
  try {
    const { type, message, icon, color, amount } = req.body;
    const uid = req.user.uid;

    const log = {
      uid,
      type,
      message,
      icon: icon || "📋",
      color: color || "#4CC9F0",
      amount: amount || 0,
      timestamp: new Date().toISOString(),
    };

    await db.collection("activityLog").add(log);

    return res.status(201).json({ ok: true, message: "Actividad registrada" });
  } catch (err) {
    console.error("Error en POST /dashboard/log-activity:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /api/dashboard/streak-challenge ───────────────────────
router.get("/streak-challenge", verifyToken, async (req, res) => {
  try {
    const uid  = req.user.uid;
    const doc  = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const data   = doc.data();
    const today  = utcDateStr(0);
    const streak = data.streak || 0;
    const active = streak >= CHALLENGE_MIN_STREAK;

    const now      = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

    return res.json({
      ok:           true,
      active,
      streak,
      completed:    data.streakChallengeDone === today,
      reward:       calcChallengeReward(streak),
      midnightUTC:  midnight.getTime(),
      todayUTC:     today,
    });
  } catch (err) {
    console.error("Error en GET /dashboard/streak-challenge:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
