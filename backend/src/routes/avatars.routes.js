// src/routes/avatars.routes.js
import { Router } from "express";
import { db }     from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { bustUserCache } from "../utils/userCache.js";

const router = Router();

// ── Catálogo (fuente de verdad del servidor) ──────────────────────────────────
const AVATARS_CATALOG = [
  { id:"avatar_01", nombre:"Héroe Clásico",    desc:"El avatar por defecto.",                          precio:0,    rareza:"Común",      type:"avatar" },
  { id:"avatar_02", nombre:"Alma de Fuego",    desc:"Imparable, ardiente y poderoso.",                 precio:400,  rareza:"Común",      type:"avatar" },
  { id:"avatar_03", nombre:"Espíritu Ártico",  desc:"Frío, calculador e implacable.",                  precio:400,  rareza:"Común",      type:"avatar" },
  { id:"avatar_04", nombre:"Rayo Veloz",        desc:"Velocidad y potencia en un solo avatar.",         precio:800,  rareza:"Poco común", type:"avatar" },
  { id:"avatar_05", nombre:"Lobo Solitario",    desc:"Disciplinado, feroz y sin igual.",               precio:1200, rareza:"Raro",       type:"avatar" },
  { id:"avatar_06", nombre:"Dragón Ascendido",  desc:"El poder del dragón fluye en tus venas.",        precio:2000, rareza:"Épico",      type:"avatar" },
  { id:"avatar_07", nombre:"Fénix Eterno",      desc:"Renace más fuerte después de cada caída.",       precio:3500, rareza:"Legendario", type:"avatar" },
  { id:"avatar_08", nombre:"Sombra Oscura",     desc:"Sigiloso y letal.",                              precio:1500, rareza:"Raro",       type:"avatar" },
  { id:"avatar_09", nombre:"Tormenta Solar",    desc:"Energía pura canalizada.",                       precio:2500, rareza:"Épico",      type:"avatar" },
  { id:"avatar_10", nombre:"Campeón Supremo",   desc:"Solo uno puede serlo.",                          precio:5000, rareza:"Legendario", type:"avatar" },
];

const FRAMES_CATALOG = [
  { id:"marco_01", nombre:"Marco Carmesí",    desc:"Un anillo de fuego carmesí.",                      precio:600,  rareza:"Común",      type:"frame" },
  { id:"marco_02", nombre:"Marco Dorado",     desc:"El brillo del oro para los campeones.",            precio:800,  rareza:"Poco común", type:"frame" },
  { id:"marco_03", nombre:"Marco Élite Azul", desc:"Eléctrico y veloz.",                              precio:800,  rareza:"Poco común", type:"frame" },
  { id:"marco_04", nombre:"Marco del Vacío",  desc:"Oscuro y misterioso.",                            precio:1500, rareza:"Raro",       type:"frame" },
  { id:"marco_05", nombre:"Marco Arcoíris",   desc:"Vibrante, imposible de ignorar. Gira sin parar.", precio:2500, rareza:"Épico",      type:"frame" },
  { id:"marco_06", nombre:"Marco Leyenda",    desc:"Solo para los más grandes héroes.",               precio:5000, rareza:"Legendario", type:"frame" },
];

const ALL_CATALOG = [...AVATARS_CATALOG, ...FRAMES_CATALOG];

// ── GET /api/avatars ── catálogo público ──────────────────────────────────────
router.get("/", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ ok: true, avatars: AVATARS_CATALOG, frames: FRAMES_CATALOG });
});

// ── POST /api/avatars/purchase ── comprar avatar o marco ──────────────────────
router.post("/purchase", verifyToken, async (req, res) => {
  try {
    const { itemId } = req.body;
    const uid = req.user.uid;

    const item = ALL_CATALOG.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ ok:false, message:"Item no encontrado." });

    const ref = db.collection("users").doc(uid);
    const now = new Date().toISOString();
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        throw Object.assign(new Error("Perfil no encontrado."), { code: 404 });
      }

      const data = doc.data();
      const coins = Number(data.coins ?? 0);
      const ownedAvatars = data.ownedAvatars ?? ["avatar_01"];
      const ownedFrames = data.ownedFrames ?? [];
      const isAvatar = item.type === "avatar";
      const owned = isAvatar ? ownedAvatars.includes(itemId) : ownedFrames.includes(itemId);

      if (owned) {
        throw Object.assign(new Error("Ya tienes este item."), { code: 400 });
      }
      if (item.precio > 0 && coins < item.precio) {
        throw Object.assign(
          new Error(`Monedas insuficientes. Necesitas ${item.precio}, tienes ${coins}.`),
          { code: 400 },
        );
      }

      const newCoins = coins - item.precio;
      const update = { coins: newCoins, updatedAt: now };

      if (isAvatar) {
        const newOwnedAvatars = [...ownedAvatars, itemId];
        update.ownedAvatars = newOwnedAvatars;
        tx.update(ref, update);
        return {
          type: "avatar",
          newCoins,
          newOwnedAvatars,
          newOwnedFrames: ownedFrames,
        };
      }

      const newOwnedFrames = [...ownedFrames, itemId];
      update.ownedFrames = newOwnedFrames;
      tx.update(ref, update);
      return {
        type: "frame",
        newCoins,
        newOwnedAvatars: ownedAvatars,
        newOwnedFrames,
      };
    });

    Promise.all([
      ref.collection("purchases").add({
        type: `${item.type}_purchase`,
        kind: "cosmetic",
        itemId: item.id,
        nombre: item.nombre,
        imagen: item.id,
        cantidad: 1,
        total: Number(item.precio || 0),
        rareza: item.rareza || "Raro",
        purchasedAt: now,
        source: "Mercado visual",
      }),
      db.collection("activityLog").add({
        uid,
        type: `${item.type}_purchased`,
        itemId: item.id,
        itemName: item.nombre,
        coins: Number(item.precio || 0),
        timestamp: now,
      }),
    ]).catch((err) => console.warn("[avatars:purchase:post-tx]", err.message));

    bustUserCache(uid);
    return res.json({
      ok: true,
      message: item.type === "avatar"
        ? `¡Avatar "${item.nombre}" desbloqueado!`
        : `¡Marco "${item.nombre}" desbloqueado!`,
      ownedAvatars: result.newOwnedAvatars,
      ownedFrames: result.newOwnedFrames,
      coins: result.newCoins,
    });
  } catch (err) {
    const status = err.code === 400 || err.code === 404 ? err.code : 500;
    if (status === 500) console.error("Error en POST /avatars/purchase:", err);
    return res.status(status).json({ ok:false, message:err.message });
  }
});

// ── PATCH /api/avatars/active ── equipar avatar ───────────────────────────────
router.patch("/active", verifyToken, async (req, res) => {
  try {
    const { avatarId } = req.body;
    const uid = req.user.uid;

    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ ok:false, message:"Perfil no encontrado." });

    const data = doc.data();
    const ownedAvatars = data.ownedAvatars ?? ["avatar_01"];

    if (avatarId !== "avatar_01" && !ownedAvatars.includes(avatarId)) {
      return res.status(403).json({ ok:false, message:"No posees este avatar." });
    }

    await ref.update({ activeAvatar: avatarId });
    bustUserCache(uid);
    return res.json({ ok:true, activeAvatar: avatarId });
  } catch (err) {
    console.error("Error en PATCH /avatars/active:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

// ── PATCH /api/avatars/active-frame ── equipar marco ─────────────────────────
router.patch("/active-frame", verifyToken, async (req, res) => {
  try {
    const { frameId } = req.body;
    const uid = req.user.uid;

    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ ok:false, message:"Perfil no encontrado." });

    const data = doc.data();
    const ownedFrames = data.ownedFrames ?? [];

    // frameId null = quitar marco
    if (frameId && !ownedFrames.includes(frameId)) {
      return res.status(403).json({ ok:false, message:"No posees este marco." });
    }

    await ref.update({ activeFrame: frameId ?? null });
    bustUserCache(uid);
    return res.json({ ok:true, activeFrame: frameId ?? null });
  } catch (err) {
    console.error("Error en PATCH /avatars/active-frame:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

export default router;
