// src/utils/achievementEngine.js
// ─────────────────────────────────────────────────────────────
//  Motor server-side de evaluación de logros para todos los tipos:
//  Ejercicio | Racha | Nivel | Social | Especial | Secreto
//
//  Uso: importar evaluateGeneralAchievements(uid, eventType) y llamarlo
//  desde cualquier endpoint que registre actividad (activityLog, misiones,
//  rutinas, etc.) o desde una Cloud Function onDocumentCreated("activityLog/{id}").
// ─────────────────────────────────────────────────────────────
import { db }   from "../config/firebase.js";
import admin    from "../config/firebase.js";

const FieldValue = admin.firestore.FieldValue;

// ── Catálogo de logros compartido (process-level, TTL 10 min) ─
const _achCatalogCache = { ts: 0, data: null };
const ACH_CATALOG_TTL  = 10 * 60 * 1000;

export async function getCachedAchievements() {
  if (_achCatalogCache.data && Date.now() - _achCatalogCache.ts < ACH_CATALOG_TTL) {
    return _achCatalogCache.data;
  }
  const snap = await db.collection("achievements").where("activo", "==", true).get();
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  _achCatalogCache.ts   = Date.now();
  _achCatalogCache.data = docs;
  return docs;
}

export function invalidateAchCache() {
  _achCatalogCache.ts   = 0;
  _achCatalogCache.data = null;
}

// Condiciones Mente — las maneja evaluateMenteAchievements (logros.routes.js)
const MENTE_COND_TYPES = new Set([
  "mente_moods_count","mente_gratitude_count","mente_perma_count",
  "mente_xp_total","mente_streak","mente_sessions_total","mente_strengths_done",
]);

// ── Leer stats del usuario desde Firestore ─────────────────────
async function getUserStats(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  return {
    totalSesiones:     Number(d.totalSesiones     || d.totalRutinas || 0),
    totalRutinas:      Number(d.totalRutinas       || 0),
    xpTotal:           Number(d.xpTotal            || d.xp || 0),
    level:             Number(d.level              || 1),
    streak:            Number(d.streak             || 0),
    cardioSesiones:    Number(d.cardioSesiones      || 0),
    flexSesiones:      Number(d.flexSesiones        || 0),
    fuerzaSesiones:    Number(d.fuerzaSesiones      || 0),
    misionesCompl:     Number(d.completedMissions   || 0),
    rutinasCompl:      Number(d.totalRutinas        || 0),
    repsTotales:       Number(d.totalReps           || 0),
    tiempoTotal:       Number(d.totalMinutes        || 0),
    primerLogin:       d.createdAt ? 1 : 0,
    perfilCompleto:    [d.username,d.email,d.heroClass,d.bio,d.avatarUrl].every(Boolean) ? 1 : 0,
    badges:            Array.isArray(d.badges) ? d.badges : [],
    coins:             Number(d.coins || 0),
  };
}

// ── Evaluar una condición individual ──────────────────────────
function checkCondition(cond, stats) {
  const cantidad = Number(cond.cantidad || 1);
  let current = 0;
  switch (cond.tipo) {
    case "sesiones_total":  current = stats.totalSesiones;   break;
    case "rutinas_compl":   current = stats.rutinasCompl;    break;
    case "xp_total":        current = stats.xpTotal;         break;
    case "nivel_alcanzado": current = stats.level;           break;
    case "racha_dias":      current = stats.streak;          break;
    case "ejercicio_tipo":
    case "cardio_sesiones": current = stats.cardioSesiones;  break;
    case "flex_sesiones":   current = stats.flexSesiones;    break;
    case "misiones_compl":  current = stats.misionesCompl;   break;
    case "reps_totales":    current = stats.repsTotales;     break;
    case "tiempo_total":    current = stats.tiempoTotal;     break;
    case "primer_login":    current = stats.primerLogin;     break;
    case "perfil_completo": current = stats.perfilCompleto;  break;
    default: return true; // condición desconocida → no bloquear
  }
  return current >= cantidad;
}

// ── Conceder XP + monedas en una transacción ─────────────────
async function grantRewards(userRef, xpBonus, coinsBonus, now) {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() || {};
    const newXpTotal   = Number(data.xpTotal || data.xp || 0) + xpBonus;
    const currentLevel = Number(data.level || 1);
    const newLevel     = Math.floor(Math.sqrt(newXpTotal / 100)) + 1;
    const xpNext       = Math.pow(newLevel, 2) * 100;
    const update       = { updatedAt: now };
    if (xpBonus > 0) {
      update.xp      = FieldValue.increment(xpBonus);
      update.xpTotal = FieldValue.increment(xpBonus);
      update.level   = newLevel;
      update.xpNext  = xpNext;
      if (newLevel > currentLevel)
        update.totalLevelUps = FieldValue.increment(newLevel - currentLevel);
    }
    if (coinsBonus > 0) {
      update.coins = FieldValue.increment(coinsBonus);
    }
    tx.update(userRef, update);
  });
}

// ── Escribir notificación in-app individual ───────────────────
async function notifyUser(uid, ach, xpBonus, coinsBonus) {
  try {
    const parts = [];
    if (xpBonus    > 0) parts.push(`+${xpBonus} XP`);
    if (coinsBonus > 0) parts.push(`+${coinsBonus} 🪙`);
    await db.collection("adminMessages").add({
      text:      `¡Has desbloqueado el logro ${ach.imagen || "🏆"} **${ach.nombre}**! ${parts.join(" · ")}`,
      title:     `Logro desbloqueado: ${ach.nombre}`,
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
  } catch (err) {
    console.warn("[achievementEngine] notifyUser:", err.message);
  }
}

// ══════════════════════════════════════════════════════════════
// evaluateGeneralAchievements — función principal exportada
//
// Parámetros:
//   uid       — UID del usuario a evaluar
//   eventType — tipo de evento que disparó la evaluación
//              (p.ej. "exercise_complete", "routine_complete",
//               "mission_claim", "level_up", "login", etc.)
//              Pasar null para evaluar todos los tipos.
//
// Retorna: { unlocked: [{ id, nombre, xpBonus, coinsBonus }] }
// ══════════════════════════════════════════════════════════════
export async function evaluateGeneralAchievements(uid, eventType = null) {
  // Obtener stats del usuario
  const stats = await getUserStats(uid);
  if (!stats) return { unlocked: [] };

  const userRef  = db.collection("users").doc(uid);
  const earnedIds = new Set(
    stats.badges.map(b => (typeof b === "string" ? b : b?.id)).filter(Boolean)
  );

  // Solo logros activos no-Mente (los Mente los evalúa evaluateMenteAchievements)
  const achDocs = await getCachedAchievements();

  const now      = new Date().toISOString();
  const unlocked = [];

  for (const ach of achDocs) {
    if (earnedIds.has(ach.id)) continue;

    const condiciones = Array.isArray(ach.condiciones) ? ach.condiciones : [];
    if (condiciones.length === 0) continue;

    // Saltar logros cuyas condiciones sean todas de tipo Mente
    const allMente = condiciones.every(c => MENTE_COND_TYPES.has(c.tipo));
    if (allMente) continue;

    // Verificar prerequisitos
    if (Array.isArray(ach.prerequisitos) && ach.prerequisitos.length > 0) {
      const allPreMet = ach.prerequisitos.every(pid => earnedIds.has(pid));
      if (!allPreMet) continue;
    }

    // Verificar todas las condiciones (AND logic)
    const allMet = condiciones
      .filter(c => !MENTE_COND_TYPES.has(c.tipo))
      .every(c => checkCondition(c, stats));
    if (!allMet) continue;

    // ── Conceder el logro ──
    const xpBonus    = Number(ach.xpBonus    || 0);
    const coinsBonus = Number(ach.coinsBonus || 0);

    const newBadge = {
      id:     ach.id,
      nombre: ach.nombre || "Logro",
      icon:   ach.imagen || "🏆",
      rareza: ach.rareza || "Común",
      tipo:   ach.tipo   || "Ejercicio",
      fecha:  now,
      isNew:  true,
    };

    await userRef.update({ badges: FieldValue.arrayUnion(newBadge), updatedAt: now });
    earnedIds.add(ach.id);

    // Recompensas XP + monedas
    if (xpBonus > 0 || coinsBonus > 0) {
      await grantRewards(userRef, xpBonus, coinsBonus, now);
      if (xpBonus > 0) {
        await userRef.collection("xpLogs").add({
          amount: xpBonus, reason: `Logro: ${ach.nombre}`, source: "achievement",
          createdAt: now,
        });
      }
    }

    // Incrementar contador global
    await db.collection("achievements").doc(ach.id).update({
      obtenidos: FieldValue.increment(1),
    });

    // Notificación in-app individual
    notifyUser(uid, ach, xpBonus, coinsBonus);

    unlocked.push({ id: ach.id, nombre: ach.nombre, xpBonus, coinsBonus });
  }

  return { unlocked };
}
