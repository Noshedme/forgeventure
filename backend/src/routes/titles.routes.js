// src/routes/titles.routes.js
import { Router } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { bustUserCache } from "../utils/userCache.js";

const router = Router();

const TITULOS_CATALOG = [
  { id: "guardian_mental", nombre: "Guardián Mental", desc: "Concedido por mantener 7 días de bienestar mental consecutivos.", rareza: "Raro", color: "#4CC9F0", fuente: "ganado", precio: 0, hint: "Completa la misión de Zona Mente" },
  { id: "ser_fortalecido", nombre: "Ser Fortalecido", desc: "Otorgado al completar el test VIA de fortalezas personales.", rareza: "Poco común", color: "#4ADE80", fuente: "ganado", precio: 0, hint: "Completa el test de fortalezas VIA" },
  { id: "centinela_mental", nombre: "Centinela Mental", desc: "Por mantener vigilancia mental activa durante 14 días.", rareza: "Raro", color: "#818CF8", fuente: "ganado", precio: 0, hint: "Logro: Héroe del Bienestar" },
  { id: "guerrero_interior", nombre: "Guerrero Interior", desc: "Para los que vencen los obstáculos de su propia mente.", rareza: "Poco común", color: "#F97316", fuente: "ganado", precio: 0, hint: "Logro de bienestar mental" },
  { id: "mente_de_acero", nombre: "Mente de Acero", desc: "Forjado a través de disciplina y constancia extrema.", rareza: "Épico", color: "#9B5DE5", fuente: "ganado", precio: 0, hint: "Logro: Mente de Acero" },
  { id: "maestro_bienestar", nombre: "Maestro del Bienestar", desc: "Dominio completo de las 5 dimensiones PERMA.", rareza: "Épico", color: "#FFC857", fuente: "ganado", precio: 0, hint: "Logro: Maestro del Bienestar" },
  { id: "alma_indestructible", nombre: "Alma Indestructible", desc: "Solo los más resilientes alcanzan este nivel de fortaleza.", rareza: "Legendario", color: "#C9184A", fuente: "ganado", precio: 0, hint: "Logro: 60 días de bienestar continuo" },
  { id: "mente_indestructible", nombre: "Mente Indestructible", desc: "La racha de acero confirma tu mente imparable.", rareza: "Legendario", color: "#FF4D6D", fuente: "ganado", precio: 0, hint: "Misión: Racha de Acero" },
  { id: "iniciado", nombre: "El Iniciado", desc: "El comienzo de todo gran camino.", rareza: "Común", color: "#A08090", fuente: "compra", precio: 200 },
  { id: "forjado_en_hierro", nombre: "Forjado en Hierro", desc: "La perseverancia te moldea más duro que el hierro.", rareza: "Común", color: "#9CA3AF", fuente: "compra", precio: 400 },
  { id: "llama_eterna", nombre: "La Llama Eterna", desc: "Tu motivación nunca se apaga, sin importar el viento.", rareza: "Común", color: "#FF6B6B", fuente: "compra", precio: 600 },
  { id: "cazador_de_xp", nombre: "Cazador de XP", desc: "Siempre buscando la próxima recompensa, sin descanso.", rareza: "Poco común", color: "#4ADE80", fuente: "compra", precio: 1000 },
  { id: "sombra_veloz", nombre: "Sombra Veloz", desc: "Rapidez y precisión combinadas. Nadie te sigue el ritmo.", rareza: "Poco común", color: "#818CF8", fuente: "compra", precio: 1400 },
  { id: "forjador_leyendas", nombre: "Forjador de Leyendas", desc: "Cada entrenamiento es un ladrillo en tu leyenda personal.", rareza: "Raro", color: "#4CC9F0", fuente: "compra", precio: 2000 },
  { id: "titan_forjado", nombre: "Titán Forjado", desc: "El poder absoluto manifestado en cada repetición.", rareza: "Épico", color: "#F97316", fuente: "compra", precio: 3200 },
  { id: "elegido_del_forge", nombre: "Elegido del Forge", desc: "Reconocido por el propio ForgeVenture. Distinción máxima.", rareza: "Legendario", color: "#FFC857", fuente: "compra", precio: 5000 },
];

const TITULOS_COMPRABLES = TITULOS_CATALOG.filter((entry) => entry.fuente === "compra");

router.get("/", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ ok: true, titles: TITULOS_CATALOG });
});

router.post("/buy", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { titulo } = req.body;
    if (!titulo) return res.status(400).json({ ok: false, message: "Falta el campo titulo" });

    const tituloData = TITULOS_COMPRABLES.find((entry) => entry.nombre === titulo);
    if (!tituloData) {
      return res.status(404).json({ ok: false, message: "Título no disponible para compra" });
    }

    const ref = db.collection("users").doc(uid);
    const now = new Date().toISOString();
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw Object.assign(new Error("Usuario no encontrado"), { code: 404 });
      }

      const user = snap.data();
      const ownedTitles = Array.isArray(user.ownedTitles) ? user.ownedTitles : (user.titulo ? [user.titulo] : []);

      if (ownedTitles.includes(titulo)) {
        throw Object.assign(new Error("Ya tienes este título"), { code: 400 });
      }

      const coins = Number(user.coins || 0);
      if (coins < tituloData.precio) {
        throw Object.assign(
          new Error(`Necesitas ${tituloData.precio} 🪙. Tienes ${coins}.`),
          { code: 400 },
        );
      }

      const newCoins = coins - tituloData.precio;
      const newOwnedTitles = [...ownedTitles, titulo];

      tx.update(ref, {
        coins: newCoins,
        ownedTitles: newOwnedTitles,
        updatedAt: now,
      });

      return { newCoins, newOwnedTitles };
    });

    Promise.all([
      ref.collection("purchases").add({
        type: "title_purchase",
        kind: "cosmetic",
        itemId: tituloData.id,
        nombre: tituloData.nombre,
        imagen: tituloData.id,
        cantidad: 1,
        total: Number(tituloData.precio || 0),
        rareza: tituloData.rareza || "Raro",
        purchasedAt: now,
        source: "Colección de títulos",
      }),
      db.collection("activityLog").add({
        uid,
        type: "title_purchased",
        itemId: tituloData.id,
        itemName: tituloData.nombre,
        coins: Number(tituloData.precio || 0),
        timestamp: now,
      }),
    ]).catch((err) => console.warn("[titles:buy:post-tx]", err.message));

    bustUserCache(uid);

    return res.json({ ok: true, coins: result.newCoins, ownedTitles: result.newOwnedTitles });
  } catch (err) {
    const status = err.code === 400 || err.code === 404 ? err.code : 500;
    if (status === 500) console.error("Error en POST /titles/buy:", err);
    return res.status(status).json({ ok: false, message: err.message });
  }
});

router.post("/equip", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { titulo } = req.body;

    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const user = snap.data();
    const ownedTitles = Array.isArray(user.ownedTitles) ? user.ownedTitles : (user.titulo ? [user.titulo] : []);

    if (!titulo) {
      await ref.update({ titulo: "", updatedAt: new Date().toISOString() });
      bustUserCache(uid);
      return res.json({ ok: true, titulo: "" });
    }

    if (!ownedTitles.includes(titulo)) {
      return res.status(403).json({ ok: false, message: "No tienes este título desbloqueado" });
    }

    await ref.update({ titulo, updatedAt: new Date().toISOString() });
    bustUserCache(uid);
    return res.json({ ok: true, titulo });
  } catch (err) {
    console.error("Error en POST /titles/equip:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
