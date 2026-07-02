// src/routes/skins.routes.js
import { Router } from "express";
import { db }     from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { bustUserCache } from "../utils/userCache.js";

const router = Router();

// ── Catálogo de skins (fuente de verdad del servidor) ─────────────────────────
export const SKINS_CATALOG = [
  {
    id:      "guerrero",
    nombre:  "Flex Guerrero",
    desc:    "Transforma a Flex en un guerrero épico. Armadura forjada en fuego y acero.",
    precio:  2000,
    rareza:  "Épico",
    color:   "#E85D04",
    esNuevo: true,
  },
  {
    id:      "caballero",
    nombre:  "Flex Caballero",
    desc:    "El honor hecho armadura. Flex viste la armadura plateada de un caballero legendario.",
    precio:  3500,
    rareza:  "Legendario",
    color:   "#A8B8D0",
    esNuevo: true,
  },
];

// ── GET /api/skins ─── catálogo público ───────────────────────────────────────
router.get("/", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ ok: true, skins: SKINS_CATALOG });
});

// ── POST /api/skins/purchase ─── comprar una skin ─────────────────────────────
router.post("/purchase", verifyToken, async (req, res) => {
  try {
    const { skinId } = req.body;
    const uid = req.user.uid;

    const skin = SKINS_CATALOG.find(s => s.id === skinId);
    if (!skin) {
      return res.status(404).json({ ok: false, message: "Skin no encontrada." });
    }

    const ref = db.collection("users").doc(uid);
    const now = new Date().toISOString();
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        throw Object.assign(new Error("Perfil no encontrado."), { code: 404 });
      }

      const data = doc.data();
      const ownedSkins = data.ownedSkins ?? ["default"];
      const coins = Number(data.coins ?? 0);

      if (ownedSkins.includes(skinId)) {
        throw Object.assign(new Error("Ya tienes esta skin."), { code: 400 });
      }

      if (coins < skin.precio) {
        throw Object.assign(
          new Error(`Monedas insuficientes. Necesitas ${skin.precio}, tienes ${coins}.`),
          { code: 400 },
        );
      }

      const newCoins = coins - skin.precio;
      const newOwnedSkins = [...ownedSkins, skinId];

      tx.update(ref, {
        ownedSkins: newOwnedSkins,
        coins: newCoins,
        updatedAt: now,
      });

      return { newCoins, newOwnedSkins };
    });

    Promise.all([
      ref.collection("purchases").add({
        type: "skin_purchase",
        kind: "cosmetic",
        itemId: skin.id,
        nombre: skin.nombre,
        imagen: skin.id,
        cantidad: 1,
        total: Number(skin.precio || 0),
        rareza: skin.rareza || "Épico",
        purchasedAt: now,
        source: "Mercado visual",
      }),
      db.collection("activityLog").add({
        uid,
        type: "skin_purchased",
        itemId: skin.id,
        itemName: skin.nombre,
        coins: Number(skin.precio || 0),
        timestamp: now,
      }),
    ]).catch((err) => console.warn("[skins:purchase:post-tx]", err.message));

    bustUserCache(uid);

    return res.json({
      ok:         true,
      message:    `¡Skin "${skin.nombre}" desbloqueada!`,
      ownedSkins: result.newOwnedSkins,
      coins:      result.newCoins,
    });
  } catch (err) {
    const status = err.code === 400 || err.code === 404 ? err.code : 500;
    if (status === 500) console.error("Error en POST /skins/purchase:", err);
    return res.status(status).json({ ok: false, message: err.message });
  }
});

// ── PATCH /api/skins/active ─── cambiar skin equipada ────────────────────────
router.patch("/active", verifyToken, async (req, res) => {
  try {
    const { skinId } = req.body;
    const uid = req.user.uid;

    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: "Perfil no encontrado." });
    }

    const data       = doc.data();
    const ownedSkins = data.ownedSkins ?? ["default"];

    if (skinId !== "default" && !ownedSkins.includes(skinId)) {
      return res.status(403).json({ ok: false, message: "No posees esta skin." });
    }

    await ref.update({ activeSkin: skinId });
    bustUserCache(uid);

    return res.json({ ok: true, activeSkin: skinId });
  } catch (err) {
    console.error("Error en PATCH /skins/active:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
