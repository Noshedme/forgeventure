// src/routes/feedback.routes.js
// ─────────────────────────────────────────────────────────────
//  Sistema de feedback / reportes de usuarios para ForgeVenture.
//  Usuario: enviar feedback (requiere auth).
//  Admin: ver, filtrar, cambiar estado, exportar.
// ─────────────────────────────────────────────────────────────
import { Router }              from "express";
import { db, auth }            from "../config/firebase.js";
import admin                   from "../config/firebase.js";
import { validateNoProfanity } from "../utils/profanityFilter.js";

const Timestamp = admin.firestore.Timestamp;
const router    = Router();

// ── Item 15: In-memory cache para /stats ──────────────────────
const statsCache    = new Map();
const STATS_CACHE_TTL = 3 * 60 * 1000; // 3 min

function invalidateStatsCache() { statsCache.clear(); }

// ── Item 20: Rate limiter simple ──────────────────────────────
const _rlMap = new Map();
function simpleRateLimit(maxPerMinute) {
  return (req, res, next) => {
    const key = req.uid || req.ip || "anon";
    const now = Date.now();
    const e   = _rlMap.get(key);
    if (!e || now > e.reset) { _rlMap.set(key, { count:1, reset:now + 60_000 }); return next(); }
    if (e.count >= maxPerMinute)
      return res.status(429).json({ ok:false, message:"Demasiadas solicitudes. Espera un momento." });
    e.count++;
    next();
  };
}

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

// ── Middleware: auth opcional (feedback anónimo) ──────────────
async function optionalToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) { req.uid = null; req.claims = null; return next(); }
  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid    = decoded.uid;
    req.claims = decoded;
  } catch { req.uid = null; req.claims = null; }
  next();
}

// ── Middleware: verificar rol admin ───────────────────────────
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

// ── Tipos válidos ─────────────────────────────────────────────
const VALID_TYPES = ["bug","suggestion","complaint","praise","other"];

// ─────────────────────────────────────────────────────────────
//  USUARIO: ENVIAR FEEDBACK
// ─────────────────────────────────────────────────────────────

// POST /api/feedback  (auth opcional — acepta anónimos)
router.post("/", optionalToken, async (req, res) => {
  const { type, rating, subject, message } = req.body;

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ ok:false, message:"Tipo inválido" });
  if (!message || message.trim().length < 10)
    return res.status(400).json({ ok:false, message:"El mensaje debe tener al menos 10 caracteres" });
  if (message.trim().length > 1000)
    return res.status(400).json({ ok:false, message:"El mensaje no puede superar 1000 caracteres" });
  if (subject && subject.trim().length > 100)
    return res.status(400).json({ ok:false, message:"El asunto no puede superar 100 caracteres" });

  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)
    return res.status(400).json({ ok:false, message:"La calificación debe ser entre 1 y 5" });

  const subjectErr = subject ? validateNoProfanity(subject, "asunto") : null;
  if (subjectErr) return res.status(400).json({ ok:false, message: subjectErr });
  const messageErr = validateNoProfanity(message, "mensaje");
  if (messageErr) return res.status(400).json({ ok:false, message: messageErr });

  // Rate-limit: 1 feedback por 24 h por usuario autenticado
  if (req.uid) {
    try {
      const cutoff   = Date.now() - 24 * 3600 * 1000;
      const prevSnap = await db.collection("feedback").where("uid","==",req.uid).get();
      const recent   = prevSnap.docs.find(d => (d.data().createdAt?.toMillis?.() || 0) > cutoff);
      if (recent) {
        const hoursAgo = Math.floor((Date.now() - recent.data().createdAt.toMillis()) / 3600000);
        return res.status(429).json({
          ok:false,
          message:`Ya enviaste un reporte hace ${hoursAgo}h. Puedes enviar otro en ${24 - hoursAgo}h más.`,
        });
      }
    } catch (_) { /* si falla el chequeo, dejamos pasar */ }
  }

  try {
    // Item 19: leer photoURL del usuario para almacenar como avatarUrl
    let userData = {};
    if (req.uid) {
      const userSnap = await db.collection("users").doc(req.uid).get();
      userData = userSnap.exists ? userSnap.data() : {};
    }

    await db.collection("feedback").add({
      uid:        req.uid || null,
      username:   userData.username  || "Anónimo",
      email:      userData.email     || "",
      heroClass:  userData.heroClass || "GUERRERO",
      level:      userData.level     || 1,
      avatarUrl:  userData.photoURL  || "",      // Item 19
      type,
      rating:     ratingNum,
      subject:    (subject || "").trim().slice(0,100),
      message:    message.trim().slice(0,1000),
      status:     "pending",
      adminNote:  "",
      adminReply: "",      // Item 18
      featured:   false,   // Item 16
      isSpam:     false,   // Item 17
      createdAt:  Timestamp.now(),
      updatedAt:  Timestamp.now(),
    });

    invalidateStatsCache(); // Item 15: invalidar caché tras nuevo feedback
    res.status(201).json({ ok:true, message:"Feedback enviado correctamente" });
  } catch (err) {
    console.error("feedback/post:", err);
    res.status(500).json({ ok:false, message:"Error al enviar feedback" });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN: LISTAR Y FILTRAR FEEDBACK
// ─────────────────────────────────────────────────────────────

// GET /api/feedback?type=bug&status=pending&cursor=<ms>&limit=20&includeSpam=true
//
// Item 14: Paginación cursor-based con startAfter.
//   El cliente envía `cursor` = createdAt en ms del último item visible.
//   El backend hace orderBy("createdAt","desc").where("createdAt","<",cursor).limit(n).
//   La respuesta incluye `nextCursor` para la siguiente página.
//
// Item 17: Por defecto filtra isSpam:false. Con ?includeSpam=true los incluye.
//   Filtros de type/status se aplican en memoria para evitar índices compuestos.

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      type, status,
      limit: lim    = "20",
      cursor        = "",
      includeSpam   = "false",
    } = req.query;

    const pageSize = Math.min(50, Math.max(1, parseInt(lim,10) || 20));

    // Construir query base — solo orderBy sobre createdAt (sin índice compuesto)
    let q = db.collection("feedback").orderBy("createdAt","desc");

    // Cursor-based: traer items anteriores al cursor
    if (cursor) {
      const cursorTs = Timestamp.fromMillis(Number(cursor));
      q = q.where("createdAt","<", cursorTs);
    }

    // Fetch con buffer: hasta 5× pageSize para absorber filtros en memoria
    const bufferSize = pageSize * 5;
    const snap = await q.limit(bufferSize).get();
    let docs = snap.docs.map(d => ({ id:d.id, ...d.data() }));

    // Filtros en memoria (evita necesidad de índices compuestos en Firestore)
    if (includeSpam !== "true")                                    docs = docs.filter(d => !d.isSpam);
    if (type   && VALID_TYPES.includes(type))                     docs = docs.filter(d => d.type   === type);
    if (status && ["pending","read","resolved"].includes(status)) docs = docs.filter(d => d.status === status);

    const page       = docs.slice(0, pageSize);
    const hasMore    = docs.length > pageSize;
    const nextCursor = hasMore ? (page.at(-1).createdAt?.toMillis?.() ?? null) : null;

    const items = page.map(d => ({
      id:         d.id,
      uid:        d.uid,
      username:   d.username,
      email:      d.email,
      heroClass:  d.heroClass,
      level:      d.level,
      avatarUrl:  d.avatarUrl  || "",
      type:       d.type,
      rating:     d.rating,
      subject:    d.subject    || "",
      message:    d.message    || "",
      status:     d.status,
      adminNote:  d.adminNote  || "",
      adminReply: d.adminReply || "",
      featured:   d.featured   || false,
      isSpam:     d.isSpam     || false,
      createdAt:  d.createdAt?.toMillis?.()  || Date.now(),
      updatedAt:  d.updatedAt?.toMillis?.()  || Date.now(),
    }));

    res.json({ ok:true, items, hasMore, nextCursor });
  } catch (err) {
    console.error("feedback/get:", err);
    res.status(500).json({ ok:false, message:"Error al obtener feedback" });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN: ESTADÍSTICAS RESUMEN
// ─────────────────────────────────────────────────────────────

// GET /api/feedback/stats
// Item 15: caché de 3 min  |  Item 20: rate-limit 5 req/min por admin
router.get("/stats", verifyToken, verifyAdmin, simpleRateLimit(5), async (req, res) => {
  try {
    // Servir desde caché si está fresca
    const cached = statsCache.get("stats");
    if (cached && Date.now() - cached.ts < STATS_CACHE_TTL)
      return res.json({ ok:true, stats:cached.data, cached:true });

    const snap = await db.collection("feedback").get();
    const all  = snap.docs.map(d => d.data()).filter(d => !d.isSpam);

    const total    = all.length;
    const pending  = all.filter(d => d.status === "pending").length;
    const read     = all.filter(d => d.status === "read").length;
    const resolved = all.filter(d => d.status === "resolved").length;

    const byType = {};
    VALID_TYPES.forEach(t => { byType[t] = all.filter(d => d.type === t).length; });

    const rated     = all.filter(d => d.rating >= 1 && d.rating <= 5);
    const avgRating = rated.length
      ? +(rated.reduce((s,d) => s + d.rating, 0) / rated.length).toFixed(1) : 0;

    const ratingDist = [1,2,3,4,5].map(r => ({
      rating: r,
      count:  all.filter(d => d.rating === r).length,
    }));

    const now  = Date.now();
    const days7 = Array.from({ length:7 }, (_, i) => {
      const d     = new Date(now - i * 86400000);
      const label = d.toLocaleDateString("es-EC", { weekday:"short", day:"numeric" });
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return {
        label,
        count: all.filter(doc => {
          const t = doc.createdAt?.toMillis?.() || 0;
          return t >= start && t < start + 86400000;
        }).length,
      };
    }).reverse();

    const stats = { total, pending, read, resolved, byType, avgRating, ratingDist, days7 };
    statsCache.set("stats", { data:stats, ts:Date.now() });
    res.json({ ok:true, stats });
  } catch (err) {
    console.error("feedback/stats:", err);
    res.status(500).json({ ok:false, message:"Error al obtener estadísticas" });
  }
});

// ─────────────────────────────────────────────────────────────
//  PÚBLICO: ESTADÍSTICAS HERO (sin auth)
// ─────────────────────────────────────────────────────────────

// GET /api/feedback/public-stats
router.get("/public-stats", async (req, res) => {
  try {
    const snap = await db.collection("feedback").get();
    const all  = snap.docs.map(d => d.data()).filter(d => !d.isSpam);

    const rated      = all.filter(d => d.rating >= 1 && d.rating <= 5);
    const avgRating  = rated.length
      ? +(rated.reduce((s,d) => s + d.rating, 0) / rated.length).toFixed(1) : 0;

    const totalResolved = all.filter(d => d.status === "resolved").length;
    const resolvedDocs  = all.filter(d => d.status === "resolved" && d.createdAt && d.updatedAt);
    const avgResponseHours = resolvedDocs.length
      ? Math.min(72, Math.round(resolvedDocs.reduce((s,d) => {
          const diff = (d.updatedAt.toMillis() - d.createdAt.toMillis()) / 3600000;
          return s + Math.max(0, diff);
        }, 0) / resolvedDocs.length))
      : 24;

    const pendingCount   = all.filter(d => d.status === "pending").length;
    const lastFeedbackAt = all.reduce((max,d) => {
      const ms = d.createdAt?.toMillis?.() || 0;
      return ms > max ? ms : max;
    }, 0);

    res.json({ ok:true, avgRating, totalResolved, avgResponseHours, pendingCount, lastFeedbackAt });
  } catch (err) {
    console.error("feedback/public-stats:", err);
    res.status(500).json({ ok:false, message:"Error al obtener estadísticas públicas" });
  }
});

// ─────────────────────────────────────────────────────────────
//  USUARIO: HISTORIAL PROPIO
// ─────────────────────────────────────────────────────────────

// GET /api/feedback/my
// Item 18: incluye adminReply para que el usuario vea la respuesta del admin
router.get("/my", verifyToken, async (req, res) => {
  try {
    const snap  = await db.collection("feedback").where("uid","==",req.uid).get();
    const items = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id:         d.id,
          type:       data.type,
          rating:     data.rating,
          subject:    data.subject    || "",
          message:    data.message    || "",
          status:     data.status,
          adminNote:  data.adminNote  || "",
          adminReply: data.adminReply || "", // Item 18
          createdAt:  data.createdAt?.toMillis?.() || Date.now(),
          updatedAt:  data.updatedAt?.toMillis?.() || Date.now(),
        };
      })
      .sort((a,b) => b.createdAt - a.createdAt);

    res.json({ ok:true, items });
  } catch (err) {
    console.error("feedback/my:", err);
    res.status(500).json({ ok:false, message:"Error al obtener tu historial" });
  }
});

// ─────────────────────────────────────────────────────────────
//  PÚBLICO: TESTIMONIOS
// ─────────────────────────────────────────────────────────────

// GET /api/feedback/public-testimonials
// Item 16: prioriza docs con featured:true, luego completa con praise ≥ 4★ recientes
router.get("/public-testimonials", async (req, res) => {
  try {
    const snap = await db.collection("feedback")
      .where("type","==","praise")
      .where("isSpam","==",false)
      .get();

    const praise = snap.docs.map(d => d.data()).filter(d => d.rating >= 4);

    // Featured primero, luego por fecha desc
    const sorted = praise.sort((a,b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return  1;
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    });

    const items = sorted.slice(0,6).map(d => ({
      heroClass:  d.heroClass  || "GUERRERO",
      level:      d.level      || 1,
      rating:     d.rating,
      message:    d.message    || "",
      featured:   d.featured   || false,
      createdAt:  d.createdAt?.toMillis?.() || Date.now(),
    }));

    res.json({ ok:true, items });
  } catch (err) {
    console.error("feedback/public-testimonials:", err);
    res.status(500).json({ ok:false, message:"Error al obtener testimonios" });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN: ACTUALIZAR ESTADO / NOTA
// ─────────────────────────────────────────────────────────────

// PATCH /api/feedback/:id
// Items 16, 17, 18: acepta featured, isSpam, adminReply además de status/adminNote
router.patch("/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, adminNote, adminReply, featured, isSpam } = req.body;

  const updates = { updatedAt: Timestamp.now() };
  if (status     && ["pending","read","resolved"].includes(status)) updates.status     = status;
  if (adminNote  !== undefined) updates.adminNote  = String(adminNote).slice(0,500);
  if (adminReply !== undefined) updates.adminReply = String(adminReply).slice(0,500);  // Item 18
  if (typeof featured === "boolean") updates.featured = featured;                       // Item 16
  if (typeof isSpam   === "boolean") updates.isSpam   = isSpam;                         // Item 17

  if (Object.keys(updates).length === 1)
    return res.status(400).json({ ok:false, message:"Sin cambios" });

  try {
    const ref  = db.collection("feedback").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok:false, message:"Feedback no encontrado" });
    await ref.update(updates);
    invalidateStatsCache(); // Item 15: invalidar caché tras cambio de estado
    res.json({ ok:true, message:"Actualizado" });
  } catch (err) {
    console.error("feedback/patch:", err);
    res.status(500).json({ ok:false, message:"Error al actualizar" });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN: ELIMINAR
// ─────────────────────────────────────────────────────────────

// DELETE /api/feedback/:id
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const ref  = db.collection("feedback").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok:false, message:"No encontrado" });
    await ref.delete();
    invalidateStatsCache(); // Item 15: invalidar caché tras eliminación
    res.json({ ok:true, message:"Eliminado" });
  } catch (err) {
    console.error("feedback/delete:", err);
    res.status(500).json({ ok:false, message:"Error al eliminar" });
  }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN: EXPORTAR CSV / JSON
// ─────────────────────────────────────────────────────────────

// GET /api/feedback/export?format=csv
// Item 20: rate-limit 5 req/min para prevenir full-scans en masa
router.get("/export", verifyToken, verifyAdmin, simpleRateLimit(5), async (req, res) => {
  const format = req.query.format === "json" ? "json" : "csv";
  try {
    const snap = await db.collection("feedback").orderBy("createdAt","desc").get();
    const rows = snap.docs.map(d => {
      const data = d.data();
      return {
        id:         d.id,
        username:   data.username   || "",
        email:      data.email      || "",
        heroClass:  data.heroClass  || "",
        level:      data.level      || 1,
        type:       data.type,
        rating:     data.rating,
        subject:    data.subject    || "",
        message:    data.message    || "",
        status:     data.status,
        adminNote:  data.adminNote  || "",
        adminReply: data.adminReply || "",
        featured:   data.featured   || false,
        isSpam:     data.isSpam     || false,
        createdAt:  data.createdAt?.toDate?.()?.toISOString?.() || "",
      };
    });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=feedback.json");
      return res.json(rows);
    }

    const COLS = [
      "id","username","email","heroClass","level","type","rating",
      "subject","message","status","adminNote","adminReply","featured","isSpam","createdAt",
    ];
    const escape = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const lines  = [
      COLS.join(","),
      ...rows.map(r => COLS.map(c => escape(r[c])).join(",")),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=feedback.csv");
    res.send("﻿" + lines.join("\r\n")); // BOM para Excel
  } catch (err) {
    console.error("feedback/export:", err);
    res.status(500).json({ ok:false, message:"Error al exportar" });
  }
});

export default router;
