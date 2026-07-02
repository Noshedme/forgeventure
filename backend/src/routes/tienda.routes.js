// src/routes/tienda.routes.js
import { Router } from "express";
import { db }     from "../config/firebase.js";
import admin      from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";

const { FieldValue } = admin.firestore;

const router = Router();

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/tienda/comprar/:objetoId — H25
//   Compra atómica con db.runTransaction:
//   1. Lee monedas del usuario y verifica coins >= precio
//   2. Descuenta FieldValue.increment(-precio)
//   3. Decrementa stock si objeto es limitado
//   4. Escribe en users/{uid}/inventory/{objetoId}
//   5. Escribe historial en users/{uid}/purchases
// ══════════════════════════════════════════════════════════════════════════════
router.post("/comprar/:objetoId", verifyToken, async (req, res) => {
  const uid      = req.user.uid;
  const objetoId = req.params.objetoId;
  const cantidad = Math.max(1, Number(req.body.cantidad) || 1);

  const userRef    = db.collection("users").doc(uid);
  const objRef     = db.collection("objects").doc(objetoId);
  const invRef     = userRef.collection("inventory").doc(objetoId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const [userSnap, objSnap, invSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(objRef),
        tx.get(invRef),
      ]);

      if (!userSnap.exists) throw Object.assign(new Error("Usuario no encontrado"),        { code: 404 });
      if (!objSnap.exists)  throw Object.assign(new Error("Objeto no encontrado"),         { code: 404 });

      const obj  = objSnap.data();
      const user = userSnap.data();

      if (!obj.activo) throw Object.assign(new Error("Objeto no disponible"),              { code: 400 });

      const precio  = Number(obj.precio || 0);
      const total   = precio * cantidad;
      const coins   = Number(user.coins || 0);

      if (coins < total)
        throw Object.assign(new Error(`Monedas insuficientes (tienes ${coins}, necesitas ${total})`), { code: 400 });

      if (obj.limitado && typeof obj.stock === "number") {
        if (obj.stock < cantidad)
          throw Object.assign(new Error("Stock insuficiente"), { code: 400 });
        tx.update(objRef, {
          stock: FieldValue.increment(-cantidad),
          usos:  FieldValue.increment(cantidad),
        });
      } else {
        tx.update(objRef, { usos: FieldValue.increment(cantidad) });
      }

      // Descontar monedas del usuario
      tx.update(userRef, { coins: FieldValue.increment(-total), updatedAt: new Date().toISOString() });

      // Inventario: upsert
      if (invSnap.exists) {
        tx.update(invRef, { cantidad: FieldValue.increment(cantidad), updatedAt: new Date().toISOString() });
      } else {
        tx.set(invRef, {
          objetoId,
          nombre:       obj.nombre,
          imagen:       obj.imagen || "",
          categoria:    obj.categoria || "Especial",
          rareza:       obj.rareza   || "Común",
          efectos:      Array.isArray(obj.efectos) ? obj.efectos : [],
          equipado:     false,
          cantidad,
          adquiridoEn:  FieldValue.serverTimestamp(),
        });
      }

      return { total, coinsLeft: coins - total, nombre: obj.nombre };
    });

    // Historial de compra (fuera de la transacción — no crítico)
    userRef.collection("purchases").add({
      objetoId,
      nombre:      result.nombre,
      cantidad,
      total:       result.total,
      purchasedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});

    // Log de actividad
    db.collection("activityLog").add({
      uid,
      type:      "item_purchased",
      itemId:    objetoId,
      itemName:  result.nombre,
      coins:     result.total,
      timestamp: FieldValue.serverTimestamp(),
    }).catch(() => {});

    return res.json({ ok: true, total: result.total, coinsLeft: result.coinsLeft });
  } catch (err) {
    const status = err.code === 404 ? 404 : err.code === 400 ? 400 : 500;
    console.error("Error en POST /tienda/comprar:", err.message);
    return res.status(status).json({ ok: false, message: err.message });
  }
});

export default router;
