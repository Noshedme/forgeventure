// src/routes/logros.routes.js
import { Router } from "express";
import { db }     from "../config/firebase.js";
import admin      from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole }   from "../middleware/checkRole.js";
import { _logrosCache, LOGROS_TTL, bustLogrosCache, bustUserCache } from "../utils/userCache.js";
import { getCachedAchievements, invalidateAchCache } from "../utils/achievementEngine.js";

const FieldValue  = admin.firestore.FieldValue;
const Timestamp   = admin.firestore.Timestamp;

const router = Router();

const RAREZA_TIER   = { Común:1, Raro:2, Épico:3, Legendario:4 };
const TIPOS_VALIDOS = ["Ejercicio","Racha","Nivel","Social","Especial","Mente","Secreto"];
const RAREZA_VALIDA = ["Común","Raro","Épico","Legendario"];
const MAX_XP_BONUS  = 50_000;
const MAX_COINS     = 100_000;

// ── G22-23: validación de campos de logro ─────────────────────
function validateLogroFields(body, isNew = false) {
  const errs = [];
  if (isNew || body.nombre !== undefined) {
    if (!body.nombre || typeof body.nombre !== "string" || !body.nombre.trim())
      errs.push("nombre es requerido");
    else if (body.nombre.trim().length > 100)
      errs.push("nombre no puede superar 100 caracteres");
  }
  if (body.descripcion !== undefined && typeof body.descripcion === "string" && body.descripcion.trim().length > 1000)
    errs.push("descripcion no puede superar 1000 caracteres");
  if (body.tipo !== undefined && !TIPOS_VALIDOS.includes(body.tipo))
    errs.push(`tipo inválido — válidos: ${TIPOS_VALIDOS.join(", ")}`);
  if (body.rareza !== undefined && !RAREZA_VALIDA.includes(body.rareza))
    errs.push(`rareza inválida — válidas: ${RAREZA_VALIDA.join(", ")}`);
  if (body.xpBonus !== undefined) {
    const xp = Number(body.xpBonus);
    if (isNaN(xp) || xp < 0 || xp > MAX_XP_BONUS)
      errs.push(`xpBonus debe estar entre 0 y ${MAX_XP_BONUS}`);
  }
  if (body.coinsBonus !== undefined) {
    const c = Number(body.coinsBonus);
    if (isNaN(c) || c < 0 || c > MAX_COINS)
      errs.push(`coinsBonus debe estar entre 0 y ${MAX_COINS}`);
  }
  if (body.condiciones  !== undefined && !Array.isArray(body.condiciones))
    errs.push("condiciones debe ser un array");
  if (body.recompensas  !== undefined && !Array.isArray(body.recompensas))
    errs.push("recompensas debe ser un array");
  if (body.prerequisitos !== undefined && !Array.isArray(body.prerequisitos))
    errs.push("prerequisitos debe ser un array");
  return errs;
}

// ── H25: auditoría de operaciones admin ───────────────────────
async function writeAuditLog({ tipo, logroId, logroNombre, adminUid, adminEmail, cambios }) {
  try {
    await db.collection("auditLog").add({
      tipo, logroId, logroNombre,
      adminUid, adminEmail: adminEmail || "",
      cambios:   cambios   || {},
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[auditLog]", err.message);
  }
}

// ── Logros de Psicología Positiva para sembrar ───────────────
const MENTE_LOGROS_SEED = [
  {
    nombre: "Primer Paso Mental", tipo: "Mente", rareza: "Común",
    imagen: "🌱", xpBonus: 50, secreto: false,
    descripcion: "Realiza tu primer check-in de ánimo en Zona Mente. El bienestar empieza con un pequeño paso.",
    condiciones: [{ tipo: "mente_moods_count", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "50 XP" }],
    activo: true,
  },
  {
    nombre: "Diario del Alma", tipo: "Mente", rareza: "Común",
    imagen: "📓", xpBonus: 75, secreto: false,
    descripcion: "Completa tu primer diario de gratitud. Tres momentos que merecen tu atención.",
    condiciones: [{ tipo: "mente_gratitude_count", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "75 XP" }],
    activo: true,
  },
  {
    nombre: "Explorador PERMA", tipo: "Mente", rareza: "Común",
    imagen: "🔍", xpBonus: 80, secreto: false,
    descripcion: "Completa tu primera evaluación PERMA. Conocer tu bienestar es el primer paso para mejorarlo.",
    condiciones: [{ tipo: "mente_perma_count", cantidad: 1 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "80 XP" }],
    activo: true,
  },
  {
    nombre: "Semana de Bienestar", tipo: "Mente", rareza: "Raro",
    imagen: "🔥", xpBonus: 150, secreto: false,
    descripcion: "Mantén una racha de 7 días consecutivos de check-in de ánimo. La constancia construye el carácter.",
    condiciones: [{ tipo: "mente_streak", cantidad: 7 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "150 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Guardián Mental" },
    ],
    activo: true,
  },
  {
    nombre: "Corazón Agradecido", tipo: "Mente", rareza: "Raro",
    imagen: "💚", xpBonus: 150, secreto: false,
    descripcion: "Completa 7 días de diario de gratitud. La gratitud reconstruye la perspectiva.",
    condiciones: [{ tipo: "mente_gratitude_count", cantidad: 7 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "150 XP" }],
    activo: true,
  },
  {
    nombre: "Arquitecto PERMA", tipo: "Mente", rareza: "Raro",
    imagen: "🏛️", xpBonus: 175, secreto: false,
    descripcion: "Completa 4 evaluaciones PERMA. Estás construyendo una imagen real de tu bienestar.",
    condiciones: [{ tipo: "mente_perma_count", cantidad: 4 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "175 XP" }],
    activo: true,
  },
  {
    nombre: "Maestro de la Respiración", tipo: "Mente", rareza: "Raro",
    imagen: "🌬️", xpBonus: 125, secreto: false,
    descripcion: "Completa 10 sesiones en Zona Mente. Cada respiración consciente es una victoria.",
    condiciones: [{ tipo: "mente_sessions_total", cantidad: 10 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "125 XP" }],
    activo: true,
  },
  {
    nombre: "Conoce tus Fortalezas", tipo: "Mente", rareza: "Épico",
    imagen: "💎", xpBonus: 250, secreto: false,
    descripcion: "Completa el test VIA de fortalezas. Saber quién eres es la base del crecimiento.",
    condiciones: [{ tipo: "mente_strengths_done", cantidad: 1 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "250 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Ser Fortalecido" },
    ],
    activo: true,
  },
  {
    nombre: "Héroe del Bienestar", tipo: "Mente", rareza: "Épico",
    imagen: "🛡️", xpBonus: 350, secreto: false,
    descripcion: "Mantén una racha de 14 días consecutivos de check-in. Eres un ejemplo de constancia.",
    condiciones: [{ tipo: "mente_streak", cantidad: 14 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "350 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Centinela Mental" },
    ],
    activo: true,
  },
  {
    nombre: "Guerrero Mental", tipo: "Mente", rareza: "Épico",
    imagen: "⚔️", xpBonus: 400, secreto: false,
    descripcion: "30 días consecutivos de check-in de ánimo. Tu mente es tu arma más poderosa.",
    condiciones: [{ tipo: "mente_streak", cantidad: 30 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "400 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Guerrero Interior" },
    ],
    activo: true,
  },
  {
    nombre: "Gratitud Profunda", tipo: "Mente", rareza: "Épico",
    imagen: "🌺", xpBonus: 300, secreto: false,
    descripcion: "Completa 30 entradas de diario de gratitud. La gratitud es un músculo que se entrena.",
    condiciones: [{ tipo: "mente_gratitude_count", cantidad: 30 }],
    recompensas: [{ tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "300 XP" }],
    activo: true,
  },
  {
    nombre: "Mente de Acero", tipo: "Mente", rareza: "Legendario",
    imagen: "🧠", xpBonus: 500, secreto: false,
    descripcion: "Acumula 1000 XP en Zona Mente. Tu resiliencia mental no tiene límites.",
    condiciones: [{ tipo: "mente_xp_total", cantidad: 1000 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "500 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Mente de Acero" },
    ],
    activo: true,
  },
  {
    nombre: "Maestro del Bienestar", tipo: "Mente", rareza: "Legendario",
    imagen: "🌟", xpBonus: 750, secreto: false,
    descripcion: "Completa 100 sesiones en Zona Mente. Eres un maestro de la psicología positiva.",
    condiciones: [{ tipo: "mente_sessions_total", cantidad: 100 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "750 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Maestro del Bienestar" },
    ],
    activo: true,
  },
  {
    nombre: "Alma Fortalecida", tipo: "Mente", rareza: "Legendario",
    imagen: "✨", xpBonus: 1000, secreto: true,
    descripcion: "Un camino de 60 días de bienestar continuo. Pocos llegan aquí.",
    condiciones: [{ tipo: "mente_streak", cantidad: 60 }],
    recompensas: [
      { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "1000 XP" },
      { tipo: "titulo", icon: "👑", label: "Título", valor: "Alma Indestructible" },
    ],
    activo: true,
  },
];

// ══════════════════════════════════════════════════════════════
// GET /api/logros/user — catálogo completo con progreso real del usuario
// ══════════════════════════════════════════════════════════════
router.get("/user", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // ── TTL cache: 2 Firestore reads → 0 for 5 min ──────────────
    const cached = _logrosCache.get(uid);
    if (cached && Date.now() - cached.ts < LOGROS_TTL) {
      return res.json({ ok: true, logros: cached.logros, cached: true });
    }

    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    const userData = userSnap.data();

    // Badges ganados por el usuario
    const earnedBadges = Array.isArray(userData.badges) ? userData.badges : [];
    const earnedMap = {};
    for (const b of earnedBadges) {
      const id = typeof b === "string" ? b : b.id;
      if (id) earnedMap[id] = typeof b === "object" ? b : { id };
    }

    // Stats del usuario para calcular progreso por condición
    const stats = {
      totalRutinas:       Number(userData.totalRutinas           || 0),
      totalSesiones:      Number(userData.totalSesiones          || userData.totalRutinas || 0),
      xpTotal:            Number(userData.xpTotal                || 0),
      level:              Number(userData.level                  || 1),
      streak:             Number(userData.streak                 || 0),
      // Mente stats
      menteMoodsCount:    Number(userData.menteMoodsCount        || 0),
      menteGratitudeCount:Number(userData.menteGratitudeCount    || 0),
      mentePermaCount:    Number(userData.mentePermaCount        || 0),
      menteXpTotal:       Number(userData.menteXpTotal           || 0),
      moodStreak:         Number(userData.moodStreak             || 0),
      menteSessions:      Number(userData.menteSessions          || 0),
      menteStrengthsDone: userData.topStrength ? 1 : 0,
    };

    // Catálogo de logros activos — usa cache compartido (evita lectura por cada usuario)
    const achDocs = await getCachedAchievements();

    const logros = achDocs.map(ach => {
      const earnedBadge = earnedMap[ach.id];
      const obtenido    = !!earnedBadge;
      // isNew: true  = ganado pero sin celebrar todavía (listo para reclamar)
      // isNew: false | undefined = ya reclamado
      const reclamado = obtenido && earnedBadge.isNew !== true;

      // Calcular progreso hacia la primera condición
      const condiciones = Array.isArray(ach.condiciones) ? ach.condiciones : [];
      let progreso = 0;
      let total    = 1;

      if (condiciones.length > 0) {
        const cond = condiciones[0];
        total = Math.max(1, Number(cond.cantidad || 1));
        switch (cond.tipo) {
          case "rutinas_compl":          progreso = stats.totalRutinas;        break;
          case "sesiones_total":       progreso = stats.totalSesiones;       break;
          case "xp_total":             progreso = stats.xpTotal;             break;
          case "nivel_alcanzado":      progreso = stats.level;               break;
          case "racha_dias":           progreso = stats.streak;              break;
          // ── Mente conditions ──
          case "mente_moods_count":    progreso = stats.menteMoodsCount;     break;
          case "mente_gratitude_count":progreso = stats.menteGratitudeCount; break;
          case "mente_perma_count":    progreso = stats.mentePermaCount;     break;
          case "mente_xp_total":       progreso = stats.menteXpTotal;        break;
          case "mente_streak":         progreso = stats.moodStreak;          break;
          case "mente_sessions_total": progreso = stats.menteSessions;       break;
          case "mente_strengths_done": progreso = stats.menteStrengthsDone;  break;
          default:                     progreso = obtenido ? total : 0;
        }
      } else {
        progreso = obtenido ? 1 : 0;
      }

      // Si ya está obtenido, el progreso nunca baja del total
      if (obtenido) progreso = Math.max(progreso, total);
      progreso = Math.min(progreso, total);

      return {
        id:             ach.id,
        nombre:         ach.nombre       || "Logro",
        tipo:           ach.tipo         || "Ejercicio",
        rareza:         ach.rareza       || "Común",
        imagen:         ach.imagen       || ach.icono || "🏆",
        xpBonus:        Number(ach.xpBonus || 0),
        descripcion:    ach.descripcion  || "",
        secreto:        ach.secreto      || false,
        condiciones,
        recompensas:    Array.isArray(ach.recompensas) ? ach.recompensas : [],
        obtenido,
        reclamado,
        progreso,
        total,
        fechaObtencion: earnedBadge?.fecha || null,
      };
    });

    // Orden: obtenidos primero (no reclamados al frente), luego rareza desc
    logros.sort((a, b) => {
      const aListo = a.obtenido && !a.reclamado;
      const bListo = b.obtenido && !b.reclamado;
      if (aListo !== bListo) return aListo ? -1 : 1;
      if (a.obtenido !== b.obtenido) return a.obtenido ? -1 : 1;
      return (RAREZA_TIER[b.rareza] || 1) - (RAREZA_TIER[a.rareza] || 1);
    });

    _logrosCache.set(uid, { ts: Date.now(), logros });
    return res.json({ ok: true, logros });
  } catch (err) {
    console.error("Error en GET /logros/user:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/logros/:id/claim — celebrar/marcar logro como reclamado
// (El XP ya fue otorgado al desbloquear; aquí solo se marca isNew=false)
// ══════════════════════════════════════════════════════════════
router.post("/:id/claim", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const userRef  = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    const userData = userSnap.data();

    const badges   = Array.isArray(userData.badges) ? userData.badges : [];
    const badgeIdx = badges.findIndex(b => (typeof b === "string" ? b : b.id) === id);

    if (badgeIdx === -1) {
      return res.status(400).json({ ok: false, message: "Logro no desbloqueado aún" });
    }

    const badge = badges[badgeIdx];
    // Ya reclamado => OK sin error
    if (typeof badge === "object" && badge.isNew !== true) {
      return res.json({ ok: true, alreadyClaimed: true });
    }

    // Marcar como reclamado (isNew = false)
    const updatedBadges = badges.map((b, i) =>
      i === badgeIdx && typeof b === "object" ? { ...b, isNew: false } : b
    );

    await userRef.update({ badges: updatedBadges, updatedAt: new Date().toISOString() });

    bustLogrosCache(uid);
    bustUserCache(uid);

    // Fire-and-forget activity log — don't block response
    db.collection("activityLog").add({
      uid,
      type:            "achievement_claimed",
      achievementId:   id,
      achievementName: typeof badge === "object" ? badge.nombre : id,
      icon:            typeof badge === "object" ? badge.icon  : "🏆",
      timestamp:       new Date().toISOString(),
    }).catch(() => {});

    // XP was already granted at unlock time; return current user state so frontend can sync
    // xpGanado: null → frontend falls back to logro.xpBonus as the reminder value
    return res.json({
      ok: true, claimed: true,
      xpGanado:  null,
      leveledUp: false,
      newLevel:  userData.level    || 1,
      xpNext:    userData.xpNext   || 100,
      weeklyXP:  userData.weeklyXP || 0,
      streak:    userData.streak   || 0,
    });
  } catch (err) {
    console.error("Error en POST /logros/:id/claim:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/logros — admin: catálogo con paginación cursor-based (H27)
// ?cursor=<ms>&limit=50
router.get("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const pageSize = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor   = req.query.cursor ? Number(req.query.cursor) : null;

    let q = db.collection("achievements").orderBy("creadoEn", "desc");
    if (cursor) {
      // creadoEn stored as ISO string — lexicographic order matches chronological
      q = q.where("creadoEn", "<", new Date(cursor).toISOString());
    }
    q = q.limit(pageSize + 1);

    const snapshot = await q.get();
    const hasMore  = snapshot.docs.length > pageSize;
    const docs     = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    const logros   = docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const nextCursor = hasMore && logros.length > 0
      ? new Date(logros[logros.length - 1].creadoEn).getTime()
      : null;

    return res.json({ ok: true, logros, nextCursor, hasMore });
  } catch (err) {
    console.error("Error en GET /logros:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ── Ítem 20: notificación in-app cuando se publica un logro ───
async function notifyNewAchievement(nombre, imagen, adminUid) {
  try {
    await db.collection("adminMessages").add({
      text:      `¡Nuevo logro disponible: ${imagen} ${nombre}! Completa el desafío y recoge tu recompensa.`,
      title:     `Nuevo logro: ${nombre}`,
      type:      "achievement",
      status:    "published",
      targetAll: true,
      targetUid: null,
      readBy:    [],
      readCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUid,
    });
  } catch (err) {
    console.warn("[logros] notifyNewAchievement:", err.message);
  }
}

// POST /api/logros — admin: crear logro (G22 + H25)
router.post("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    // G22: validación
    const errs = validateLogroFields(req.body, true);
    if (errs.length) return res.status(400).json({ ok: false, message: errs.join(" · ") });

    const payload = {
      nombre:        req.body.nombre.trim(),
      tipo:          req.body.tipo          || "Ejercicio",
      rareza:        req.body.rareza        || "Común",
      imagen:        req.body.imagen        || "🏆",
      xpBonus:       Number(req.body.xpBonus    || 0),
      coinsBonus:    Number(req.body.coinsBonus || 0),
      descripcion:   req.body.descripcion   || "",
      descripcionCorta: req.body.descripcionCorta || "",
      descripcionSecreta: req.body.descripcionSecreta || "",
      condiciones:   Array.isArray(req.body.condiciones)  ? req.body.condiciones  : [],
      recompensas:   Array.isArray(req.body.recompensas)  ? req.body.recompensas  : [],
      prerequisitos: Array.isArray(req.body.prerequisitos)? req.body.prerequisitos: [],
      activo:        req.body.activo  !== undefined ? !!req.body.activo  : true,
      secreto:       req.body.secreto !== undefined ? !!req.body.secreto : false,
      obtenidos:     0,
      creadoEn:      new Date().toISOString(),
      creadoPor:     req.user.uid,
    };

    const docRef   = await db.collection("achievements").add(payload);
    const newLogro = { id: docRef.id, ...payload };
    invalidateAchCache();

    // H25: auditoría
    writeAuditLog({ tipo:"logro_created", logroId:docRef.id, logroNombre:payload.nombre,
      adminUid:req.user.uid, adminEmail:req.user.email, cambios:payload });

    // Ítem 20: notificación broadcast si activo
    if (payload.activo) {
      notifyNewAchievement(payload.nombre, payload.imagen, req.user.uid);
    }

    return res.status(201).json({ ok: true, logro: newLogro });
  } catch (err) {
    console.error("Error en POST /logros:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/logros/:id — admin: actualizar logro (G23 + H25)
router.patch("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // G23: validación condicional (solo campos presentes)
    const errs = validateLogroFields(req.body, false);
    if (errs.length) return res.status(400).json({ ok: false, message: errs.join(" · ") });

    const ref  = db.collection("achievements").doc(id);
    const prev = await ref.get();
    if (!prev.exists) return res.status(404).json({ ok: false, message: "Logro no encontrado" });

    // Construir objeto de actualización con solo campos presentes
    const allowed = ["nombre","tipo","rareza","imagen","xpBonus","coinsBonus",
      "descripcion","descripcionCorta","descripcionSecreta","condiciones",
      "recompensas","prerequisitos","activo","secreto"];
    const updates = { actualizadoEn: new Date().toISOString(), actualizadoPor: req.user.uid };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.nombre) updates.nombre = String(updates.nombre).trim();
    if (updates.xpBonus    !== undefined) updates.xpBonus    = Number(updates.xpBonus);
    if (updates.coinsBonus !== undefined) updates.coinsBonus = Number(updates.coinsBonus);

    await ref.update(updates);
    invalidateAchCache();
    const doc = await ref.get();

    // H25: auditoría
    writeAuditLog({ tipo:"logro_updated", logroId:id, logroNombre:prev.data().nombre,
      adminUid:req.user.uid, adminEmail:req.user.email, cambios:updates });

    // Ítem 20: notificar si pasa de inactivo → activo
    const wasInactive = !prev.data().activo;
    const nowActive   = updates.activo !== undefined ? !!updates.activo : prev.data().activo;
    if (wasInactive && nowActive) {
      const d = doc.data();
      notifyNewAchievement(d.nombre || "Logro", d.imagen || "🏆", req.user.uid);
    }

    return res.json({ ok: true, logro: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error("Error en PATCH /logros/:id:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE /api/logros/:id — G24: soft delete por defecto, ?hard=true para borrado físico
router.delete("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const hard   = req.query.hard === "true";
    const ref    = db.collection("achievements").doc(id);
    const snap   = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Logro no encontrado" });

    const nombre = snap.data().nombre || id;

    if (hard) {
      await ref.delete();
    } else {
      await ref.update({
        activo:     false,
        archivedAt: FieldValue.serverTimestamp(),
        archivedBy: req.user.uid,
        actualizadoEn: new Date().toISOString(),
      });
    }
    invalidateAchCache();

    // H25: auditoría
    writeAuditLog({ tipo: hard ? "logro_deleted" : "logro_archived",
      logroId:id, logroNombre:nombre,
      adminUid:req.user.uid, adminEmail:req.user.email,
      cambios: { hard } });

    return res.json({ ok:true, deleted:hard, archived:!hard, message: hard?"Logro eliminado permanentemente":"Logro archivado (soft delete)" });
  } catch (err) {
    console.error("Error en DELETE /logros/:id:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/logros/seed-mente — admin: sembrar logros de Zona Mente
// Idempotente: salta los que ya existen por nombre exacto.
// ══════════════════════════════════════════════════════════════
router.post("/seed-mente", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    // Fetch existing mente achievements to avoid duplicates
    const existingSnap = await db.collection("achievements").where("tipo", "==", "Mente").get();
    const existingNames = new Set(existingSnap.docs.map(d => d.data().nombre));

    const now = new Date().toISOString();
    const created = [];
    const skipped = [];

    for (const logro of MENTE_LOGROS_SEED) {
      if (existingNames.has(logro.nombre)) {
        skipped.push(logro.nombre);
        continue;
      }
      const docRef = await db.collection("achievements").add({
        ...logro,
        obtenidos:    0,
        creadoEn:     now,
        actualizadoEn:now,
      });
      created.push({ id: docRef.id, nombre: logro.nombre });
    }
    if (created.length > 0) invalidateAchCache();

    return res.json({
      ok: true,
      message: `Sembrados ${created.length} logros Mente. Omitidos: ${skipped.length}`,
      created,
      skipped,
    });
  } catch (err) {
    console.error("Error en POST /logros/seed-mente:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/logros/check-mente/:uid — admin: evaluar logros Mente de un usuario
// (El chequeo automático ocurre en mente.routes.js; esto es manual/debug)
// ══════════════════════════════════════════════════════════════
router.post("/check-mente/:uid", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const uid = req.params.uid;
    const result = await evaluateMenteAchievements(uid);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// evaluateMenteAchievements(uid) — función compartida
// Evalúa condiciones Mente y concede badges no ganados aún.
// Exportada para ser usada por mente.routes.js.
// ══════════════════════════════════════════════════════════════
export async function evaluateMenteAchievements(uid) {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return { unlocked: [] };
  const userData = userSnap.data();

  const stats = {
    menteMoodsCount:    Number(userData.menteMoodsCount        || 0),
    menteGratitudeCount:Number(userData.menteGratitudeCount    || 0),
    mentePermaCount:    Number(userData.mentePermaCount        || 0),
    menteXpTotal:       Number(userData.menteXpTotal           || 0),
    moodStreak:         Number(userData.moodStreak             || 0),
    menteSessions:      Number(userData.menteSessions          || 0),
    menteStrengthsDone: userData.topStrength ? 1 : 0,
  };

  const MENTE_COND_TYPES = new Set([
    "mente_moods_count", "mente_gratitude_count", "mente_perma_count",
    "mente_xp_total", "mente_streak", "mente_sessions_total", "mente_strengths_done",
  ]);

  // Logros de Mente activos — usa cache compartido (filtrado en memoria por tipo)
  const allAchDocs  = await getCachedAchievements();
  const menteAchDocs = allAchDocs.filter(a => a.tipo === "Mente");

  const earnedBadges = Array.isArray(userData.badges) ? userData.badges : [];
  const earnedIds = new Set(earnedBadges.map(b => typeof b === "string" ? b : b.id));

  const now = new Date().toISOString();
  const unlocked = [];

  for (const ach of menteAchDocs) {
    if (earnedIds.has(ach.id)) continue;

    const condiciones = Array.isArray(ach.condiciones) ? ach.condiciones : [];
    if (condiciones.length === 0) continue;

    // Check ALL conditions (AND logic)
    let allMet = true;
    for (const cond of condiciones) {
      if (!MENTE_COND_TYPES.has(cond.tipo)) continue;
      const cantidad = Number(cond.cantidad || 1);
      let current = 0;
      switch (cond.tipo) {
        case "mente_moods_count":    current = stats.menteMoodsCount;     break;
        case "mente_gratitude_count":current = stats.menteGratitudeCount; break;
        case "mente_perma_count":    current = stats.mentePermaCount;     break;
        case "mente_xp_total":       current = stats.menteXpTotal;        break;
        case "mente_streak":         current = stats.moodStreak;          break;
        case "mente_sessions_total": current = stats.menteSessions;       break;
        case "mente_strengths_done": current = stats.menteStrengthsDone;  break;
      }
      if (current < cantidad) { allMet = false; break; }
    }

    if (!allMet) continue;

    const newBadge = {
      id:     ach.id,
      nombre: ach.nombre || "Logro Mente",
      icon:   ach.imagen || "🧠",
      rareza: ach.rareza || "Común",
      tipo:   "Mente",
      fecha:  now,
      isNew:  true,
    };

    const userRef = db.collection("users").doc(uid);
    await userRef.update({ badges: FieldValue.arrayUnion(newBadge), updatedAt: now });
    earnedIds.add(ach.id);

    const xpBonus    = Number(ach.xpBonus    || 0);
    const coinsBonus = Number(ach.coinsBonus || 0);
    if (xpBonus > 0 || coinsBonus > 0) {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data() || {};
        const newXpTotal   = Number(data.xpTotal || data.xp || 0) + xpBonus;
        const currentLevel = Number(data.level || 1);
        const newLevel     = Math.floor(Math.sqrt(newXpTotal / 100)) + 1;
        const xpNext       = Math.pow(newLevel, 2) * 100;
        const update = { updatedAt: now };
        if (xpBonus > 0) {
          update.xp      = FieldValue.increment(xpBonus);
          update.xpTotal = FieldValue.increment(xpBonus);
          update.level   = newLevel;
          update.xpNext  = xpNext;
          if (newLevel > currentLevel) update.totalLevelUps = FieldValue.increment(newLevel - currentLevel);
        }
        if (coinsBonus > 0) update.coins = FieldValue.increment(coinsBonus);
        tx.update(userRef, update);
      });
      if (xpBonus > 0) {
        await userRef.collection("xpLogs").add({
          amount: xpBonus, reason: `Logro: ${ach.nombre}`, source: "achievement", createdAt: now,
        });
      }
    }

    await db.collection("achievements").doc(ach.id).update({ obtenidos: FieldValue.increment(1) });

    const rewardParts = [];
    if (xpBonus    > 0) rewardParts.push(`+${xpBonus} XP`);
    if (coinsBonus > 0) rewardParts.push(`+${coinsBonus} 🪙`);
    try {
      await db.collection("adminMessages").add({
        text: `¡Has desbloqueado el logro ${ach.imagen || "🏆"} **${ach.nombre}**! ${rewardParts.join(" · ")}`,
        title: `Logro desbloqueado: ${ach.nombre}`,
        type: "achievement", status: "published",
        targetAll: false, targetUid: uid,
        readBy: [], readCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "system",
      });
    } catch (notifErr) {
      console.warn("[logros] notificación individual:", notifErr.message);
    }

    unlocked.push({ id: ach.id, nombre: ach.nombre, xpBonus, coinsBonus });
  }

  return { unlocked };
}

export async function evaluateSaludAchievements(uid) {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return { unlocked: [] };
  const userData = userSnap.data();

  const stats = {
    saludSleepCount: Number(userData.saludSleepCount || 0),
    saludHydrationDays: Number(userData.saludHydrationDays || 0),
    saludNutritionDays: Number(userData.saludNutritionDays || 0),
    saludRecoveryCount: Number(userData.saludRecoveryCount || 0),
    saludMovementCount: Number(userData.saludMovementCount || 0),
    saludSessions: Number(userData.saludSessions || 0),
  };

  const SALUD_COND_TYPES = new Set([
    "salud_sleep_count",
    "salud_hydration_days",
    "salud_nutrition_days",
    "salud_recovery_count",
    "salud_movement_count",
    "salud_sessions_total",
  ]);

  const allAchDocs = await getCachedAchievements();
  const saludAchDocs = allAchDocs.filter((a) => a.tipo === "Salud");

  const earnedBadges = Array.isArray(userData.badges) ? userData.badges : [];
  const earnedIds = new Set(earnedBadges.map((b) => typeof b === "string" ? b : b.id));

  const now = new Date().toISOString();
  const unlocked = [];

  for (const ach of saludAchDocs) {
    if (earnedIds.has(ach.id)) continue;

    const condiciones = Array.isArray(ach.condiciones) ? ach.condiciones : [];
    if (condiciones.length === 0) continue;

    let allMet = true;
    for (const cond of condiciones) {
      if (!SALUD_COND_TYPES.has(cond.tipo)) continue;
      const cantidad = Number(cond.cantidad || 1);
      let current = 0;
      switch (cond.tipo) {
        case "salud_sleep_count": current = stats.saludSleepCount; break;
        case "salud_hydration_days": current = stats.saludHydrationDays; break;
        case "salud_nutrition_days": current = stats.saludNutritionDays; break;
        case "salud_recovery_count": current = stats.saludRecoveryCount; break;
        case "salud_movement_count": current = stats.saludMovementCount; break;
        case "salud_sessions_total": current = stats.saludSessions; break;
      }
      if (current < cantidad) {
        allMet = false;
        break;
      }
    }

    if (!allMet) continue;

    const newBadge = {
      id: ach.id,
      nombre: ach.nombre || "Logro Salud",
      icon: ach.imagen || "💠",
      rareza: ach.rareza || "Común",
      tipo: "Salud",
      fecha: now,
      isNew: true,
    };

    const userRef = db.collection("users").doc(uid);
    await userRef.update({ badges: FieldValue.arrayUnion(newBadge), updatedAt: now });
    earnedIds.add(ach.id);

    const xpBonus = Number(ach.xpBonus || 0);
    const coinsBonus = Number(ach.coinsBonus || 0);
    if (xpBonus > 0 || coinsBonus > 0) {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data() || {};
        const newXpTotal = Number(data.xpTotal || data.xp || 0) + xpBonus;
        const currentLevel = Number(data.level || 1);
        const newLevel = Math.floor(Math.sqrt(newXpTotal / 100)) + 1;
        const xpNext = Math.pow(newLevel, 2) * 100;
        const update = { updatedAt: now };
        if (xpBonus > 0) {
          update.xp = FieldValue.increment(xpBonus);
          update.xpTotal = FieldValue.increment(xpBonus);
          update.level = newLevel;
          update.xpNext = xpNext;
          if (newLevel > currentLevel) update.totalLevelUps = FieldValue.increment(newLevel - currentLevel);
        }
        if (coinsBonus > 0) update.coins = FieldValue.increment(coinsBonus);
        tx.update(userRef, update);
      });
      if (xpBonus > 0) {
        await userRef.collection("xpLogs").add({
          amount: xpBonus, reason: `Logro: ${ach.nombre}`, source: "achievement", createdAt: now,
        });
      }
    }

    await db.collection("achievements").doc(ach.id).update({ obtenidos: FieldValue.increment(1) });

    try {
      await db.collection("adminMessages").add({
        text: `¡Has desbloqueado el logro ${ach.imagen || "🏆"} **${ach.nombre}**!`,
        title: `Logro desbloqueado: ${ach.nombre}`,
        type: "achievement", status: "published",
        targetAll: false, targetUid: uid,
        readBy: [], readCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "system",
      });
    } catch (notifErr) {
      console.warn("[logros-salud] notificacion individual:", notifErr.message);
    }

    unlocked.push({ id: ach.id, nombre: ach.nombre, xpBonus, coinsBonus });
  }

  return { unlocked };
}

export default router;
