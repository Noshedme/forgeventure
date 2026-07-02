// src/routes/objetos.routes.js
import { Router } from "express";
import { db }     from "../config/firebase.js";
import admin      from "../config/firebase.js";
import { verifyToken }     from "../middleware/auth.js";
import { checkRole }       from "../middleware/checkRole.js";
import { listActiveBoosts } from "../services/boosts.service.js";

const { FieldValue } = admin.firestore;

const router = Router();

// ── Caché del catálogo público (TTL 5 min) ───────────────────────────────────
const _catalogCache = { data: null, ts: 0 };
const CATALOG_TTL   = 5 * 60_000;
const invalidateCatalog = () => { _catalogCache.ts = 0; };

// ── Constantes de validación ──────────────────────────────────────────────────
const CATEGORIAS_VALIDAS = ["Poción","Consumible","Cosmético","Equipo","Coleccionable","Especial"];
const RAREZA_VALIDA      = ["Común","Poco común","Raro","Épico","Legendario","Mítico"];
const MAX_PRECIO         = 1_000_000;
const MAX_COINS_BONUS    = 100_000;

// Campos permitidos en escritura (whitelist) — evita inyección de campos arbitrarios
const CAMPOS_PERMITIDOS = new Set([
  "nombre","descripcion","descripcionCorta","categoria","rareza","precio","coinsBonus",
  "imagen","activo","efectos","obtenido","duracion","limitado","stock",
  "usosMax","usosActuales","stackeable","equipable","consumible","metadata",
]);

// ── G21: Validación de campos ─────────────────────────────────────────────────
function validateObjetoFields(body, isNew = false) {
  const errs = [];
  if (isNew || body.nombre !== undefined) {
    if (!body.nombre || typeof body.nombre !== "string" || !body.nombre.trim())
      errs.push("nombre es requerido");
    else if (body.nombre.trim().length > 100)
      errs.push("nombre no puede superar 100 caracteres");
  }
  if (body.categoria !== undefined && !CATEGORIAS_VALIDAS.includes(body.categoria))
    errs.push(`categoria inválida — válidas: ${CATEGORIAS_VALIDAS.join(", ")}`);
  if (body.rareza !== undefined && !RAREZA_VALIDA.includes(body.rareza))
    errs.push(`rareza inválida — válidas: ${RAREZA_VALIDA.join(", ")}`);
  if (body.precio !== undefined) {
    const n = Number(body.precio);
    if (isNaN(n) || n < 0 || n > MAX_PRECIO)
      errs.push(`precio debe estar entre 0 y ${MAX_PRECIO.toLocaleString("es")}`);
  }
  if (body.coinsBonus !== undefined) {
    const n = Number(body.coinsBonus);
    if (isNaN(n) || n < 0 || n > MAX_COINS_BONUS)
      errs.push(`coinsBonus debe estar entre 0 y ${MAX_COINS_BONUS.toLocaleString("es")}`);
  }
  if (body.efectos !== undefined && !Array.isArray(body.efectos))
    errs.push("efectos debe ser un array");
  if (body.metadata !== undefined && (typeof body.metadata !== "object" || Array.isArray(body.metadata)))
    errs.push("metadata debe ser un objeto");
  return errs;
}

// ── H24: Auditoría fire-and-forget ────────────────────────────────────────────
async function writeAuditLog({ tipo, objetoId, objetoNombre, adminUid, adminEmail, cambios }) {
  try {
    await db.collection("auditLog").add({
      tipo, objetoId: objetoId || null, objetoNombre: objetoNombre || "",
      adminUid, adminEmail: adminEmail || "",
      cambios: cambios || {},
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[auditLog:objetos]", err.message);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcLevel(xpTotal) {
  return Math.floor(Math.sqrt(xpTotal / 100)) + 1;
}

function ledgerKindFromCategory(category = "") {
  const raw = String(category || "").toLowerCase();
  if (raw.includes("poción") || raw.includes("pocion") || raw.includes("consumible")) return "consumable";
  return "loot";
}

function applyNestedUpdate(target, path, value) {
  if (!path.includes(".")) {
    target[path] = value;
    return;
  }
  const parts = path.split(".");
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

function buildProfilePatch(userData, updates, now) {
  const merged = JSON.parse(JSON.stringify(userData || {}));
  for (const [key, value] of Object.entries(updates || {})) {
    applyNestedUpdate(merged, key, value);
  }
  merged.updatedAt = now;

  const ownedTitles = Array.isArray(merged.ownedTitles)
    ? merged.ownedTitles
    : (merged.titulo ? [merged.titulo] : []);

  return {
    coins: Number(merged.coins || 0),
    level: Number(merged.level || 1),
    xp: Number(merged.xp || 0),
    xpTotal: Number(merged.xpTotal || 0),
    xpNext: Number(merged.xpNext || 1000),
    hp: Number(merged.hp ?? 100),
    skillPoints: Number(merged.skillPoints || 0),
    titulo: merged.titulo || "",
    ownedTitles,
    unlockedClass: merged.unlockedClass || null,
    streakShield: merged.streakShield || null,
    activeBoosts: merged.activeBoosts || {},
    lastLevelUp: merged.lastLevelUp || null,
    updatedAt: now,
  };
}

/**
 * Apply efectos array to user doc updates + return summary.
 * `obj` is the raw object from Firestore, `userData` is the current user doc.
 * Returns { updates, summary[] } where updates is a partial Firestore update map.
 */
function applyEfectos(obj, userData) {
  const efectos = Array.isArray(obj.efectos) ? obj.efectos : [];
  const now = new Date().toISOString();
  const updates = {};
  const summary = []; // { tipo, icon, label, valor }

  let xpBonus = 0;
  let newLevel = userData.level || 1;
  let leveledUp = false;

  for (const ef of efectos) {
    const valor = Number(ef.valor || 0);

    switch (ef.tipo) {
      case "xp_instant": {
        xpBonus += valor;
        summary.push({ tipo: ef.tipo, icon: ef.icon || "💫", label: `+${valor} XP`, valor });
        break;
      }
      case "hp_recover": {
        updates.hp = 100;
        summary.push({ tipo: ef.tipo, icon: ef.icon || "❤️", label: `HP restaurado ${valor}%`, valor });
        break;
      }
      case "level_boost": {
        const levels = valor || 1;
        const boostedLevel = (userData.level || 1) + levels;
        updates.level = boostedLevel;
        updates.xp = 0;
        updates.xpNext = Math.pow(boostedLevel, 2) * 100;
        newLevel = boostedLevel;
        leveledUp = true;
        summary.push({ tipo: ef.tipo, icon: ef.icon || "⬆️", label: `+${levels} Nivel${levels > 1 ? "es" : ""}`, valor: levels });
        break;
      }
      case "title_grant": {
        const titulo = String(ef.valor || ef.label || "");
        if (titulo) {
          updates.titulo = titulo;
          const currentOwned = Array.isArray(userData.ownedTitles) ? userData.ownedTitles
            : (userData.titulo ? [userData.titulo] : []);
          if (!currentOwned.includes(titulo)) {
            updates.ownedTitles = [...currentOwned, titulo];
          }
          summary.push({ tipo: ef.tipo, icon: ef.icon || "👑", label: `Título: ${titulo}`, valor: titulo });
        }
        break;
      }
      case "xp_bonus": {
        const dur = Number(obj.duracion || 60);
        const expiresAt = new Date(Date.now() + dur * 60 * 1000).toISOString();
        updates["activeBoosts.xp_bonus"] = { valor, expiresAt };
        summary.push({ tipo: ef.tipo, icon: ef.icon || "⚡", label: `+${valor}% XP · ${dur < 60 ? dur + "min" : dur / 60 + "h"}`, valor, expiresAt });
        break;
      }
      case "xp_mult": {
        const dur = Number(obj.duracion || 120);
        const expiresAt = new Date(Date.now() + dur * 60 * 1000).toISOString();
        updates["activeBoosts.xp_mult"] = { valor, expiresAt };
        summary.push({ tipo: ef.tipo, icon: ef.icon || "✨", label: `×${valor} XP · ${dur < 60 ? dur + "min" : dur / 60 + "h"}`, valor, expiresAt });
        break;
      }
      case "streak_shield": {
        const days = valor || 3;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        updates.streakShield = { days, expiresAt };
        summary.push({ tipo: ef.tipo, icon: ef.icon || "🔥", label: `Racha protegida ${days}d`, valor: days, expiresAt });
        break;
      }
      case "cooldown_red": {
        const dur = Number(obj.duracion || 1440);
        const expiresAt = new Date(Date.now() + dur * 60 * 1000).toISOString();
        updates["activeBoosts.cooldown_red"] = { valor, expiresAt };
        summary.push({ tipo: ef.tipo, icon: ef.icon || "⏱️", label: `-${valor}% cooldown · ${dur < 60 ? dur + "min" : dur / 60 + "h"}`, valor, expiresAt });
        break;
      }
      case "unlock_class": {
        const cls = String(ef.valor || "");
        if (cls) {
          updates.unlockedClass = cls;
          summary.push({ tipo: ef.tipo, icon: ef.icon || "🎭", label: `Clase desbloqueada: ${cls}`, valor: cls });
        }
        break;
      }
      default:
        break;
    }
  }

  // Apply XP bonus last (so level_boost doesn't get overridden by xpTotal calc)
  if (xpBonus > 0) {
    const newXpTotal = (userData.xpTotal || 0) + xpBonus;
    const newXp = (userData.xp || 0) + xpBonus;
    const xpLevel = calcLevel(newXpTotal);
    if (xpLevel > (userData.level || 1) && !leveledUp) {
      leveledUp = true;
      newLevel = xpLevel;
    }
    if (!updates.level) {
      updates.level = xpLevel;
      updates.xpNext = Math.pow(xpLevel, 2) * 100;
      newLevel = xpLevel;
    }
    updates.xpTotal = newXpTotal;
    updates.xp = newXp;
    if (leveledUp) updates.lastLevelUp = new Date().toISOString();
  }

  return { updates, summary, xpGanado: xpBonus, newLevel, leveledUp };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/objetos — admin: catálogo completo
// ══════════════════════════════════════════════════════════════════════════════
router.get("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("objects").get();
    const objetos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ ok: true, objetos });
  } catch (err) {
    console.error("Error en GET /objetos:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/objetos/public — catálogo público para usuarios (con caché 5 min)
// ══════════════════════════════════════════════════════════════════════════════
router.get("/public", verifyToken, async (req, res) => {
  try {
    const now = Date.now();
    if (_catalogCache.data && (now - _catalogCache.ts) < CATALOG_TTL) {
      return res.json({ ok: true, objetos: _catalogCache.data });
    }
    const snapshot = await db.collection("objects").where("activo", "==", true).get();
    const objetos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    _catalogCache.data = objetos;
    _catalogCache.ts   = now;
    return res.json({ ok: true, objetos });
  } catch (err) {
    console.error("Error en GET /objetos/public:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/objetos/inventory — inventario del usuario
// ══════════════════════════════════════════════════════════════════════════════
router.get("/inventory", verifyToken, async (req, res) => {
  try {
    const invSnap = await db.collection("users").doc(req.user.uid)
      .collection("inventory").where("cantidad", ">", 0).get();
    const items = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("Error en GET /objetos/inventory:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/objetos/purchases — historial de compras
// ══════════════════════════════════════════════════════════════════════════════
router.get("/purchases", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const pageSizeRaw = Number(req.query.limit || 24);
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor.trim() : "";
    const purchasesRef = db.collection("users").doc(uid).collection("purchases");

    let query = purchasesRef.orderBy("purchasedAt", "desc");
    if (cursor) {
      const cursorSnap = await purchasesRef.doc(cursor).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snap = await query.limit(pageSize + 1).get();
    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const visibleDocs = hasMore ? docs.slice(0, pageSize) : docs;
    const purchases = visibleDocs.map(doc => ({ id: doc.id, ...doc.data() }));
    const nextCursor = hasMore && visibleDocs.length
      ? visibleDocs[visibleDocs.length - 1].id
      : null;

    return res.json({ ok: true, purchases, nextCursor, hasMore });
  } catch (err) {
    console.error("Error en GET /objetos/purchases:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/objetos — admin: crear objeto
// ══════════════════════════════════════════════════════════════════════════════
router.post("/", verifyToken, checkRole("admin"), async (req, res) => {
  // G21: validar
  const errs = validateObjetoFields(req.body, true);
  if (errs.length) return res.status(400).json({ ok: false, errors: errs });

  try {
    // G22: whitelist — solo campos permitidos
    const allowed = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (CAMPOS_PERMITIDOS.has(k)) allowed[k] = v;
    }
    const payload = {
      ...allowed,
      creadoEn: new Date().toISOString(),
      activo: allowed.activo !== undefined ? allowed.activo : true,
      usos: 0,
    };
    const docRef = await db.collection("objects").add(payload);
    invalidateCatalog();

    // H24: auditoría fire-and-forget
    writeAuditLog({
      tipo: "objeto_creado", objetoId: docRef.id, objetoNombre: payload.nombre,
      adminUid: req.user.uid, adminEmail: req.user.email,
      cambios: allowed,
    });

    return res.status(201).json({ ok: true, objeto: { id: docRef.id, ...payload } });
  } catch (err) {
    console.error("Error en POST /objetos:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/objetos/:id — admin: actualizar objeto
// ══════════════════════════════════════════════════════════════════════════════
router.patch("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  // G21: validar (isNew=false — solo valida campos presentes)
  const errs = validateObjetoFields(req.body, false);
  if (errs.length) return res.status(400).json({ ok: false, errors: errs });

  try {
    const { id } = req.params;

    // G22: whitelist explícita — rechaza campos no permitidos
    const allowed = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (CAMPOS_PERMITIDOS.has(k)) allowed[k] = v;
    }
    const updates = { ...allowed, actualizadoEn: new Date().toISOString() };
    await db.collection("objects").doc(id).update(updates);
    const doc = await db.collection("objects").doc(id).get();
    invalidateCatalog();

    // H24: auditoría fire-and-forget
    writeAuditLog({
      tipo: "objeto_actualizado", objetoId: id, objetoNombre: doc.data()?.nombre || "",
      adminUid: req.user.uid, adminEmail: req.user.email,
      cambios: allowed,
    });

    return res.json({ ok: true, objeto: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error("Error en PATCH /objetos/:id:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/objetos/:id — admin: eliminar objeto
//   ?hard=true → borrado físico (irreversible)
//   default    → soft-delete: {activo:false, archivedAt, archivedBy}
// ══════════════════════════════════════════════════════════════════════════════
router.delete("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const hard   = req.query.hard === "true";
    const ref    = db.collection("objects").doc(id);
    const snap   = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Objeto no encontrado" });
    const nombre = snap.data()?.nombre || "";

    if (hard) {
      // G23: borrado físico — solo con ?hard=true
      await ref.delete();
      invalidateCatalog();
      writeAuditLog({
        tipo: "objeto_eliminado_hard", objetoId: id, objetoNombre: nombre,
        adminUid: req.user.uid, adminEmail: req.user.email, cambios: {},
      });
      return res.json({ ok: true, message: "Objeto eliminado permanentemente" });
    } else {
      // G23: soft-delete por defecto
      await ref.update({
        activo:     false,
        archivedAt: FieldValue.serverTimestamp(),
        archivedBy: req.user.uid,
      });
      invalidateCatalog();
      writeAuditLog({
        tipo: "objeto_archivado", objetoId: id, objetoNombre: nombre,
        adminUid: req.user.uid, adminEmail: req.user.email, cambios: { activo: false },
      });
      return res.json({ ok: true, message: "Objeto archivado (soft-delete)" });
    }
  } catch (err) {
    console.error("Error en DELETE /objetos/:id:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/objetos/buy — comprar un objeto (transacción atómica)
// ══════════════════════════════════════════════════════════════════════════════
router.post("/buy", verifyToken, async (req, res) => {
  const { id, cantidad = 1 } = req.body;
  if (!id || Number(cantidad) <= 0) {
    return res.status(400).json({ ok: false, message: "id y cantidad válidos son requeridos" });
  }
  const uid     = req.user.uid;
  const objRef  = db.collection("objects").doc(id);
  const userRef = db.collection("users").doc(uid);
  const invRef  = userRef.collection("inventory").doc(id);

  try {
    const { total, newCoins, now, obj } = await db.runTransaction(async (tx) => {
      const [objSnap, userSnap, invSnap] = await Promise.all([
        tx.get(objRef), tx.get(userRef), tx.get(invRef),
      ]);

      if (!objSnap.exists)  throw Object.assign(new Error("Objeto no encontrado"),  { code: 404 });
      if (!userSnap.exists) throw Object.assign(new Error("Usuario no encontrado"), { code: 404 });

      const obj      = objSnap.data();
      const userData = userSnap.data();

      if (!obj.activo) throw Object.assign(new Error("Objeto no disponible"), { code: 400 });

      const price     = Number(obj.precio || 0);
      const total     = price * Number(cantidad);
      const userCoins = Number(userData.coins || 0);

      if (userCoins < total)
        throw Object.assign(new Error("Monedas insuficientes"), { code: 400 });

      if (obj.limitado && typeof obj.stock === "number") {
        if (obj.stock < Number(cantidad))
          throw Object.assign(new Error("No hay stock suficiente"), { code: 400 });
        tx.update(objRef, { stock: obj.stock - Number(cantidad), usos: (obj.usos || 0) + Number(cantidad) });
      } else {
        tx.update(objRef, { usos: (obj.usos || 0) + Number(cantidad) });
      }

      const now      = new Date().toISOString();
      const newCoins = userCoins - total;
      tx.update(userRef, { coins: newCoins, updatedAt: now });

      const invData = {
        objectId:   id,
        nombre:     obj.nombre,
        imagen:     obj.imagen || "",
        categoria:  obj.categoria || "Especial",
        rareza:     obj.rareza   || "Común",
        precio:     price,
        efectos:    Array.isArray(obj.efectos) ? obj.efectos : [],
        duracion:   obj.duracion || null,
        consumible: obj.consumible !== undefined
          ? obj.consumible
          : ["Poción","Consumible"].includes(obj.categoria),
        stackeable: obj.stackeable || false,
        updatedAt:  now,
      };

      if (invSnap.exists) {
        tx.update(invRef, { cantidad: (invSnap.data().cantidad || 0) + Number(cantidad), updatedAt: now });
      } else {
        tx.set(invRef, { ...invData, cantidad: Number(cantidad), compradoEn: now });
      }

      return { total, newCoins, now, obj };
    });

    // Post-transacción: historial + actividad (fire-and-forget)
    Promise.all([
      userRef.collection("purchases").add({
        type: "item_purchase",
        kind: ledgerKindFromCategory(obj.categoria),
        objectId: id,
        itemId: id,
        nombre: obj.nombre,
        imagen: obj.imagen || "",
        cantidad: Number(cantidad),
        total,
        rareza: obj.rareza || "Común",
        source: "Mercado",
        purchasedAt: now,
      }),
      db.collection("activityLog").add({
        uid, type: "item_purchased",
        itemId: id, itemName: obj.nombre, icon: obj.imagen || "📦",
        coins: total, timestamp: now,
      }),
    ]).catch(err => console.warn("[buy:post-tx]", err.message));

    // Invalida caché si el item era limitado (stock cambió)
    if (obj.limitado) invalidateCatalog();

    return res.json({ ok: true, total, coins: newCoins });
  } catch (err) {
    const status = err.code === 400 || err.code === 404 ? err.code : 500;
    if (status === 500) console.error("Error en POST /objetos/buy:", err);
    return res.status(status).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/objetos/buy-level — comprar +1 nivel con monedas (máx 10 por cuenta)
// ══════════════════════════════════════════════════════════════════════════════
const LEVEL_PRICE   = 1000;
const LEVEL_MAX_BUY = 10;

router.post("/buy-level", verifyToken, async (req, res) => {
  const uid     = req.user.uid;
  const userRef = db.collection("users").doc(uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("Usuario no encontrado");

      const d = snap.data();
      const currentCoins  = Number(d.coins  || 0);
      const currentLevel  = Number(d.level  || 1);
      const levelsBought  = Number(d.levelsBoughtTotal || 0);

      if (currentCoins < LEVEL_PRICE)
        throw Object.assign(new Error("Monedas insuficientes"), { code: 400 });
      if (levelsBought >= LEVEL_MAX_BUY)
        throw Object.assign(new Error("Límite de 10 niveles comprados alcanzado"), { code: 400 });

      const newLevel     = currentLevel + 1;
      // Same formula as completar-sesion
      const newXpNext    = Math.floor(100 * Math.pow(newLevel, 1.5));
      const newCoins     = currentCoins - LEVEL_PRICE;
      const newBought    = levelsBought + 1;
      const now          = new Date().toISOString();

      const nextSkillPoints = Number(d.skillPoints || 0) + 1;

      tx.update(userRef, {
        level:              newLevel,
        xp:                 0,
        xpNext:             newXpNext,
        coins:              newCoins,
        levelsBoughtTotal:  newBought,
        lastLevelUp:        now,
        totalLevelUps:      (d.totalLevelUps || 0) + 1,
        skillPoints:        FieldValue.increment(1),
        updatedAt:          now,
      });

      return { newLevel, newXpNext, newCoins, newBought, now, nextSkillPoints };
    });

    // Log historial de compra (outside transaction)
    await userRef.collection("purchases").add({
      type:        "level_purchase",
      kind:        "service",
      nombre:      `Nivel comprado → ${result.newLevel}`,
      imagen:      "⬆️",
      cantidad:    1,
      total:       LEVEL_PRICE,
      rareza:      "Legendario",
      source:      "Servicio del gremio",
      purchasedAt: result.now,
    });

    await db.collection("activityLog").add({
      uid,
      type:      "level_purchased",
      icon:      "⬆️",
      coins:     LEVEL_PRICE,
      levelAfter: result.newLevel,
      timestamp: result.now,
    });

    return res.json({
      ok:           true,
      leveledUp:    true,
      levelsGained: 1,
      newLevel:     result.newLevel,
      xpNext:       result.newXpNext,
      skillPoints:  result.nextSkillPoints,
      coins:        result.newCoins,
      coinsLeft:    result.newCoins,
      levelsBought: result.newBought,
      maxBuy:       LEVEL_MAX_BUY,
    });
  } catch (err) {
    const status = err.code === 400 ? 400 : 500;
    return res.status(status).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/objetos/use/:id — usar un objeto del inventario
// ══════════════════════════════════════════════════════════════════════════════
router.post("/use/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // objectId (mismo que el doc en inventory)
    const uid = req.user.uid;

    const userRef = db.collection("users").doc(uid);
    const invRef  = userRef.collection("inventory").doc(id);

    const result = await db.runTransaction(async (tx) => {
      const [userSnap, invSnap, objSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(invRef),
        tx.get(db.collection("objects").doc(id)),
      ]);

      if (!userSnap.exists) {
        throw Object.assign(new Error("Usuario no encontrado"), { code: 404 });
      }
      if (!invSnap.exists || (invSnap.data().cantidad || 0) <= 0) {
        throw Object.assign(new Error("No tienes ese objeto en tu inventario"), { code: 400 });
      }

      const userData = userSnap.data();
      const invData = invSnap.data();

      let obj = invData;
      if (objSnap.exists) {
        obj = { ...invData, ...objSnap.data() };
      }

      const { updates, summary, xpGanado, newLevel, leveledUp } = applyEfectos(obj, userData);
      const now = new Date().toISOString();
      const newCantidad = (invData.cantidad || 1) - 1;

      if (newCantidad <= 0) {
        tx.delete(invRef);
      } else {
        tx.update(invRef, { cantidad: newCantidad, updatedAt: now });
      }

      const userUpdates = { ...updates, updatedAt: now };
      tx.update(userRef, userUpdates);

      const profilePatch = buildProfilePatch(userData, userUpdates, now);
      const activeBoosts = listActiveBoosts(profilePatch);
      const streakShield = (() => {
        const shield = profilePatch.streakShield;
        if (!shield?.expiresAt) return null;
        const remainingSecs = Math.max(0, Math.floor((new Date(shield.expiresAt).getTime() - Date.now()) / 1000));
        return remainingSecs > 0 ? { ...shield, remainingSecs } : null;
      })();

      return {
        summary,
        xpGanado,
        newLevel,
        leveledUp,
        newCantidad,
        now,
        invData,
        profilePatch,
        activeBoosts,
        streakShield,
      };
    });

    db.collection("activityLog").add({
      uid,
      type:      "item_used",
      itemId:    id,
      itemName:  result.invData.nombre,
      icon:      result.invData.imagen || "📦",
      effects:   result.summary,
      timestamp: result.now,
    }).catch((logErr) => console.warn("[use:item:activity]", logErr.message));

    return res.json({
      ok:         true,
      xpGanado:   result.xpGanado,
      leveledUp:  result.leveledUp,
      level:      result.newLevel,
      xpNext:     result.profilePatch.xpNext,
      effects:    result.summary,
      cantidad:   result.newCantidad,
      profilePatch: result.profilePatch,
      activeBoosts: result.activeBoosts,
      streakShield: result.streakShield,
    });
  } catch (err) {
    const status = err.code === 400 || err.code === 404 ? err.code : 500;
    if (status === 500) console.error("Error en POST /objetos/use/:id:", err);
    return res.status(status).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/objetos/active-boosts — boosts activos del usuario con tiempo restante
// ══════════════════════════════════════════════════════════════════════════════
router.get("/active-boosts", verifyToken, async (req, res) => {
  try {
    const uid      = req.user.uid;
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const boosts      = listActiveBoosts(userSnap.data());
    const streakShield = (() => {
      const s = userSnap.data().streakShield;
      if (!s || !s.expiresAt) return null;
      const remainingSecs = Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000));
      return remainingSecs > 0 ? { ...s, remainingSecs } : null;
    })();

    return res.json({ ok: true, boosts, streakShield, wishlist: userSnap.data().wishlist || [] });
  } catch (err) {
    console.error("Error en GET /objetos/active-boosts:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/objetos/wishlist — guarda la lista de favoritos del usuario
// ══════════════════════════════════════════════════════════════════════════════
router.put("/wishlist", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { wishlist } = req.body;
    if (!Array.isArray(wishlist)) return res.status(400).json({ ok: false, message: "wishlist debe ser un array" });
    const capped = [...new Set(wishlist.filter(id => typeof id === "string"))].slice(0, 100);
    await db.collection("users").doc(uid).update({
      wishlist: capped,
      wishlistUpdatedAt: new Date().toISOString(),
    });
    return res.json({ ok: true, count: capped.length });
  } catch (err) {
    console.error("Error en PUT /objetos/wishlist:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/objetos/seed-items — admin: sembrar objetos funcionales demo
// ══════════════════════════════════════════════════════════════════════════════
const FUNCTIONAL_ITEMS_SEED = [
  {
    nombre: "Poción XP Mayor",
    descripcion: "Aumenta el XP ganado un 50% durante 1 hora.",
    imagen: "🧪",
    categoria: "Poción",
    rareza: "Raro",
    precio: 500,
    duracion: 60,
    consumible: true,
    stackeable: true,
    activo: true,
    esNuevo: true,
    efectos: [{ tipo: "xp_bonus", valor: 50, icon: "⚡" }],
  },
  {
    nombre: "Elixir XP ×2",
    descripcion: "Duplica todo el XP ganado durante 2 horas.",
    imagen: "✨",
    categoria: "Consumible",
    rareza: "Épico",
    precio: 2500,
    duracion: 120,
    consumible: true,
    stackeable: false,
    activo: true,
    esNuevo: true,
    efectos: [{ tipo: "xp_mult", valor: 2, icon: "✨" }],
  },
  {
    nombre: "Escudo Anti-Racha",
    descripcion: "Protege tu racha de actividad durante 3 días.",
    imagen: "🛡️",
    categoria: "Consumible",
    rareza: "Poco común",
    precio: 300,
    duracion: null,
    consumible: true,
    stackeable: true,
    activo: true,
    esNuevo: false,
    efectos: [{ tipo: "streak_shield", valor: 3, icon: "🔥" }],
  },
  {
    nombre: "Amuleto Protector de Racha",
    descripcion: "Se consume automaticamente si fallas un dia y reclamas el bono diario. Tambien puedes usarlo para activar 1 dia de proteccion.",
    imagen: "🔰",
    categoria: "Consumible",
    rareza: "Épico",
    precio: 650,
    duracion: null,
    consumible: true,
    stackeable: true,
    activo: true,
    esNuevo: true,
    limitado: false,
    efectos: [{ tipo: "streak_shield", valor: 1, icon: "🔥" }],
  },
  {
    nombre: "Orbe de Ascensión",
    descripcion: "Sube instantáneamente 1 nivel a tu héroe.",
    imagen: "🔮",
    categoria: "Especial",
    rareza: "Épico",
    precio: 3000,
    duracion: null,
    consumible: true,
    stackeable: true,
    activo: true,
    esNuevo: false,
    limitado: true,
    stock: 20,
    efectos: [{ tipo: "level_boost", valor: 1, icon: "⬆️" }],
  },
  {
    nombre: "Poción HP Total",
    descripcion: "Restaura el HP del héroe al 100%.",
    imagen: "❤️",
    categoria: "Poción",
    rareza: "Poco común",
    precio: 200,
    duracion: null,
    consumible: true,
    stackeable: true,
    activo: true,
    esNuevo: false,
    efectos: [{ tipo: "hp_recover", valor: 100, icon: "❤️" }],
  },
  {
    nombre: "Cristal XP 500",
    descripcion: "Otorga 500 XP al instante al usarlo.",
    imagen: "💎",
    categoria: "Consumible",
    rareza: "Raro",
    precio: 800,
    duracion: null,
    consumible: true,
    stackeable: true,
    activo: true,
    esNuevo: false,
    efectos: [{ tipo: "xp_instant", valor: 500, icon: "💫" }],
  },
  {
    nombre: "Elixir de Velocidad",
    descripcion: "Reduce el cooldown entre sesiones un 50% durante 24h.",
    imagen: "⚡",
    categoria: "Consumible",
    rareza: "Raro",
    precio: 800,
    duracion: 1440,
    consumible: true,
    stackeable: false,
    activo: true,
    esNuevo: false,
    efectos: [{ tipo: "cooldown_red", valor: 50, icon: "⏱️" }],
  },
];

router.post("/seed-items", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const existingSnap = await db.collection("objects").get();
    const existingNames = new Set(existingSnap.docs.map(d => d.data().nombre));

    const toInsert = FUNCTIONAL_ITEMS_SEED.filter(item => !existingNames.has(item.nombre));
    if (toInsert.length === 0) {
      return res.json({ ok: true, message: "Todos los objetos ya existen", inserted: 0 });
    }

    const batch = db.batch();
    const now   = new Date().toISOString();
    for (const item of toInsert) {
      const ref = db.collection("objects").doc();
      batch.set(ref, { ...item, creadoEn: now, usos: 0 });
    }
    await batch.commit();

    return res.json({ ok: true, message: `${toInsert.length} objetos sembrados`, inserted: toInsert.length });
  } catch (err) {
    console.error("Error en POST /objetos/seed-items:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
