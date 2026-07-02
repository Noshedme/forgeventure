// functions/index.js — Cloud Functions v2 (CommonJS)
// scheduledStatsAggregate: runs daily, writes pre-aggregated stats to Firestore
"use strict";

const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ── Helpers ────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function levelRange(lvl) {
  if (lvl <= 5)  return "1–5";
  if (lvl <= 10) return "6–10";
  if (lvl <= 20) return "11–20";
  if (lvl <= 30) return "21–30";
  if (lvl <= 40) return "31–40";
  if (lvl <= 50) return "41–50";
  return "50+";
}

function buildEvolution(logs, periodo) {
  const now = new Date();
  let days, dataPoints;
  switch (periodo) {
    case "7d":  days = 7;   dataPoints = 7;  break;
    case "90d": days = 90;  dataPoints = 13; break;
    case "1y":  days = 365; dataPoints = 12; break;
    default:    days = 30;  dataPoints = 30;
  }

  const result = [];
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * (days / dataPoints) * 24 * 60 * 60 * 1000);
    const dStr = date.toDateString();
    const dayLogs = logs.filter(d => new Date(d.timestamp).toDateString() === dStr);

    const usuarios = new Set(dayLogs.map(d => d.uid || d.userId)).size;
    const sesiones = dayLogs.filter(d => ["exercise_complete","routine_complete"].includes(d.type)).length;
    const xp       = dayLogs.reduce((s, d) => s + (d.xpGained || 0), 0);
    const nuevos   = dayLogs.filter(d => d.type === "register").length;

    result.push({
      dia: periodo === "7d" ? ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][date.getDay()]
         : periodo === "1y" ? `M${Math.floor(i / (dataPoints / 12)) + 1}`
         : `${date.getDate()}`,
      usuarios, sesiones, xp, nuevos,
    });
  }
  return result;
}

function buildHeatmap(logs) {
  const now = new Date();
  const heatmap = [];
  for (let w = 9; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now.getTime() - (w * 7 + d) * 24 * 60 * 60 * 1000);
      const dStr = date.toDateString();
      const count = logs.filter(log =>
        new Date(log.timestamp).toDateString() === dStr &&
        ["exercise_complete","routine_complete"].includes(log.type)
      ).length;
      week.push(Math.min(count, 50));
    }
    heatmap.push(week);
  }
  return heatmap;
}

// ── Main scheduled function ────────────────────────────────────
exports.scheduledStatsAggregate = onSchedule({
  schedule: "every 24 hours",
  timeZone: "America/Buenos_Aires",
  memory: "512MiB",
}, async () => {
  try {
    // Full collection fetches (done once a day, not per request)
    const [usersSnap, logsSnap, achievementsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("activityLog").get(),
      db.collection("achievements").get(),
    ]);

    const users = usersSnap.docs.map(d => d.data());
    const logs  = logsSnap.docs.map(d => d.data());
    const now   = new Date();

    // ── KPIs ──
    const totalUsers   = users.length;
    const activeUsers  = users.filter(u => {
      const diff = (now - new Date(u.lastLoginAt)) / 86400000;
      return diff < 7;
    }).length;
    const newUsers       = users.filter(u => (now - new Date(u.createdAt)) / 86400000 < 30).length;
    const returningUsers = activeUsers - newUsers < 0 ? 0 : activeUsers - newUsers;

    const classDistribution = { GUERRERO: 0, ARQUERO: 0, MAGO: 0 };
    users.forEach(u => { if (classDistribution[u.heroClass] !== undefined) classDistribution[u.heroClass]++; });

    const totalXP           = users.reduce((s, u) => s + (u.xpTotal || u.xp || 0), 0);
    const totalAchievements = achievementsSnap.size;
    const completedMissions = logs.filter(l => l.type === "mission_claim").length;
    const avgStreak         = totalUsers ? Math.round(users.reduce((s, u) => s + (u.streak || 0), 0) / totalUsers) : 0;
    const avgSessionTime    = 28; // static estimate
    const exerciseCount     = logs.filter(l => ["exercise_complete","routine_complete"].includes(l.type)).length;

    // ── Recent users ──
    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(u => ({
        id: u.uid, name: u.username, email: u.email, cls: u.heroClass,
        lvl: u.level || 1, xp: u.xp || 0, streak: u.streak || 0,
        status: (now - new Date(u.lastLoginAt)) < 86400000 ? "active" : "inactive",
        joined: new Date(u.createdAt).toLocaleDateString("es-ES"),
      }));

    // ── Level distribution ──
    const lvlDist = {};
    users.forEach(u => {
      const r = levelRange(u.level || 1);
      lvlDist[r] = (lvlDist[r] || 0) + 1;
    });
    const levelDistribution = Object.entries(lvlDist).map(([rango, usuarios]) => ({ rango, usuarios }));

    // ── Top exercises ──
    const exStats = {};
    logs.forEach(l => {
      if (["exercise_complete","routine_complete"].includes(l.type) && l.exerciseName) {
        if (!exStats[l.exerciseName]) exStats[l.exerciseName] = { sesiones:0, xp:0, completadas:0 };
        exStats[l.exerciseName].sesiones++;
        exStats[l.exerciseName].xp += l.xpGained || 0;
        if (l.completed) exStats[l.exerciseName].completadas++;
      }
    });
    const topExercises = Object.entries(exStats)
      .sort(([,a],[,b]) => b.sesiones - a.sesiones)
      .slice(0, 8)
      .map(([name, s]) => ({ name, ...s }));

    // ── Avg profile (radar) ──
    const avgProfile = totalUsers ? [
      { attr:"Fuerza",       valor: Math.round(users.reduce((s,u) => s+(u.stats?.strength||0),0)/totalUsers) },
      { attr:"Cardio",       valor: Math.round(users.reduce((s,u) => s+(u.stats?.cardio||0),0)/totalUsers)   },
      { attr:"Flexibilidad", valor: Math.round(users.reduce((s,u) => s+(u.stats?.flexibility||0),0)/totalUsers) },
      { attr:"Racha prom.",  valor: Math.round(users.reduce((s,u) => s+(u.streak||0),0)/totalUsers)           },
      { attr:"Misiones",     valor: Math.round(users.reduce((s,u) => s+(u.completedMissions||0),0)/totalUsers) },
      { attr:"Logros",       valor: Math.round(users.reduce((s,u) => s+(u.achievements?.length||0),0)/totalUsers) },
    ] : [];

    // ── Top users ──
    const topUsers = [...users]
      .sort((a,b) => (b.xp||0) - (a.xp||0))
      .slice(0, 8)
      .map((u, i) => ({
        pos: i+1, nombre: u.username, clase: u.heroClass,
        nivel: u.level||1, xp: u.xp||0,
        streak: u.streak||0, sesiones: u.totalSessions||0,
      }));

    // ── Heatmap ──
    const heatmap = buildHeatmap(logs);

    // ── Evolution (all periods) ──
    const evolution = {
      "7d":  buildEvolution(logs, "7d"),
      "30d": buildEvolution(logs, "30d"),
      "90d": buildEvolution(logs, "90d"),
      "1y":  buildEvolution(logs, "1y"),
    };

    // ── Trends (vs previous 7d) ──
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenAgo  = new Date(now.getTime() - 14 * 86400000);
    const logsThisWeek = logs.filter(l => new Date(l.timestamp) >= sevenDaysAgo);
    const logsPrevWeek = logs.filter(l => {
      const t = new Date(l.timestamp);
      return t >= fourteenAgo && t < sevenDaysAgo;
    });
    const sessionsTW = logsThisWeek.filter(l => ["exercise_complete","routine_complete"].includes(l.type)).length;
    const sessionsPW = logsPrevWeek.filter(l => ["exercise_complete","routine_complete"].includes(l.type)).length;
    const xpTW = logsThisWeek.reduce((s,l) => s+(l.xpGained||0), 0);
    const xpPW = logsPrevWeek.reduce((s,l) => s+(l.xpGained||0), 0);
    const delta = (tw, pw) => pw ? Math.round(((tw - pw) / pw) * 100) : 0;

    const trends = {
      users:    delta(activeUsers, Math.round(activeUsers * 0.9)), // approx
      sessions: delta(sessionsTW, sessionsPW),
      xp:       delta(xpTW, xpPW),
    };

    // ── Mente sessions (if collection exists) ──
    let menteSessions = 0, menteSessionsAvg = 0;
    try {
      const menteSnap = await db.collection("menteSessions").get();
      menteSessions    = menteSnap.size;
      menteSessionsAvg = totalUsers ? Math.round(menteSessions / totalUsers) : 0;
    } catch (_) {}

    // ── Retention curve (static model) ──
    const retentionData = [
      { semana:"S1",  retencion:100 },
      { semana:"S2",  retencion:72  },
      { semana:"S3",  retencion:58  },
      { semana:"S4",  retencion:49  },
      { semana:"S6",  retencion:38  },
      { semana:"S8",  retencion:31  },
      { semana:"S12", retencion:24  },
    ];

    // ── Assemble the aggregated doc ──
    const aggregatedDoc = {
      totalUsers, activeUsers, newUsers, returningUsers,
      classDistribution, totalXP, totalAchievements,
      completedMissions, avgStreak, avgSessionTime,
      exerciseCount, recentUsers,
      levelDistribution, topExercises, avgProfile,
      retentionData, topUsers, heatmap, evolution,
      trends, menteSessions, menteSessionsAvg,
      computedAt: FieldValue.serverTimestamp(),
    };

    // Write aggregated + daily snapshot in parallel
    const dateKey = todayStr();
    await Promise.all([
      db.doc("stats/aggregated").set(aggregatedDoc),
      db.doc(`stats/daily/${dateKey}`).set({ ...aggregatedDoc, date: dateKey }),
    ]);

    console.log(`[scheduledStatsAggregate] Done — ${totalUsers} users, ${exerciseCount} exercises. Date: ${dateKey}`);
  } catch (err) {
    console.error("[scheduledStatsAggregate] Error:", err);
    throw err; // let Functions retry
  }
});
