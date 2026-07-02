// src/routes/messages.routes.js
// Mensajes admin→usuario en tiempo real via Firestore
import { Router }      from "express";
import { db }          from "../config/firebase.js";
import admin           from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRole }   from "../middleware/checkRole.js";

const router     = Router();
const FieldValue = admin.firestore.FieldValue;
const Timestamp  = admin.firestore.Timestamp;
const SAVED_MESSAGES_FIELD = "savedAdminMessageIds";
const MESSAGE_PREFS_UPDATED_AT_FIELD = "messagePrefsUpdatedAt";
const MESSAGE_STATE_SUBCOLLECTION = "messageState";
const MESSAGE_STATE_KIND = "adminMessage";

// ── In-memory caches ───────────────────────────────────────────
const _prefCache  = new Map(); // uid → { savedIds: string[], ts: number }
const PREF_TTL_MS = 3 * 60_000;
function bustPrefCache(uid) { _prefCache.delete(uid); }

const VALID_TYPES    = ["announcement", "warning", "system", "achievement", "event"];
const VALID_STATUSES = ["published", "draft", "archived"];

const TYPE_META = {
  announcement: { label:"Anuncio"             },
  warning:      { label:"Aviso importante"    },
  system:       { label:"Actualización"       },
  achievement:  { label:"Logro especial"      },
  event:        { label:"Evento"              },
};

// ── FCM helper (fire-and-forget) ───────────────────────────────
function getMessageStateRef(uid, messageId) {
  return db.collection("users").doc(uid).collection(MESSAGE_STATE_SUBCOLLECTION).doc(messageId);
}

function buildMessageStatePayload(messageId) {
  return {
    messageId,
    kind: MESSAGE_STATE_KIND,
    source: "adminMessages",
    read: true,
    readAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function isVisibleToUser(data = {}, uid, now = Date.now()) {
  const visibleToUser = data.targetAll === true || data.targetUid === uid;
  const published = (data.status || "published") === "published";
  const publishAtMs = data.publishAt?.toDate?.()?.getTime?.() || null;
  const publishReady = !publishAtMs || publishAtMs <= now;
  const expiresAtMs = data.expiresAt?.toDate?.()?.getTime?.() || null;
  const stillActive = !expiresAtMs || expiresAtMs >= now;
  return visibleToUser && published && publishReady && stillActive;
}

function normalizeMessageDoc(doc) {
  const d    = doc.data();
  const meta = TYPE_META[d.type] || TYPE_META.announcement;
  return {
    id:          doc.id,
    text:        d.text  || "",
    title:       d.title || "",
    type:        d.type,
    accentColor: d.accentColor || null,
    tags:        d.tags        || [],
    imageUrl:    d.imageUrl    || null,
    status:      d.status      || "published",
    publishAt:   d.publishAt?.toDate?.()?.toISOString() || null,
    expiresAt:   d.expiresAt?.toDate?.()?.toISOString() || null,
    titulo:      meta.label,
    desc:        d.text,
    seccion:     "home",
    createdAt:   d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt:   d.updatedAt?.toDate?.()?.toISOString() || null,
    readBy:      [],
    readCount:   d.readCount ?? (d.readBy || []).length,
    targetAll:   d.targetAll,
    targetUid:   d.targetUid,
    rewardLabel: d.rewardLabel || "",
    actionRequired: Boolean(d.actionRequired),
    actionLabel: d.actionLabel || "",
    sourceLabel: d.sourceLabel || "",
    routeTarget: d.routeTarget || null,
    missionId: d.missionId || null,
    achievementId: d.achievementId || null,
    itemId: d.itemId || null,
    xpReward: Number(d.xpReward || 0),
    levelReward: Number(d.levelReward || 0),
    isAdmin:     true,
  };
}

async function fetchUserMessagePage(uid, { cursorMs = null, pageSize = 50 } = {}) {
  const safePageSize = Math.min(Math.max(Number(pageSize) || 50, 1), 100);
  const bucketLimit = Math.min(Math.max(safePageSize * 2, safePageSize + 10), 120);

  let broadcastQuery = db.collection("adminMessages")
    .where("targetAll", "==", true)
    .orderBy("createdAt", "desc");
  let targetedQuery = db.collection("adminMessages")
    .where("targetUid", "==", uid)
    .orderBy("createdAt", "desc");

  if (cursorMs) {
    const cursorTs = Timestamp.fromMillis(cursorMs);
    broadcastQuery = broadcastQuery.where("createdAt", "<", cursorTs);
    targetedQuery = targetedQuery.where("createdAt", "<", cursorTs);
  }

  const [broadcastSnap, targetedSnap] = await Promise.all([
    broadcastQuery.limit(bucketLimit).get(),
    targetedQuery.limit(bucketLimit).get(),
  ]);

  const now = Date.now();
  const mergedMap = new Map();
  [...broadcastSnap.docs, ...targetedSnap.docs].forEach((doc) => {
    const data = doc.data() || {};
    if (!isVisibleToUser(data, uid, now)) return;
    mergedMap.set(doc.id, normalizeMessageDoc(doc));
  });

  const merged = Array.from(mergedMap.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const page = merged.slice(0, safePageSize);
  const hasMore = merged.length > safePageSize;
  const nextCursor = page.length
    ? new Date(page[page.length - 1].createdAt).getTime()
    : null;

  return { messages: page, hasMore, nextCursor };
}

async function sendPushNotification({ type, title, text, messageId }) {
  try {
    const snap = await db.collection("users")
      .where("fcmToken", "!=", "")
      .limit(500)
      .get();
    const tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);
    if (!tokens.length) return;

    const notification = {
      title: title || TYPE_META[type]?.label || "Mensaje",
      body:  text.slice(0, 100),
    };
    // sendEachForMulticast (Firebase Admin SDK ≥ 11) — max 500 tokens/batch
    const messaging = admin.messaging();
    const fn = messaging.sendEachForMulticast?.bind(messaging)
             ?? messaging.sendMulticast?.bind(messaging);
    if (!fn) return;

    for (let i = 0; i < tokens.length; i += 500) {
      await fn({
        tokens:       tokens.slice(i, i + 500),
        notification,
        data:         { type, messageId },
      });
    }
  } catch (err) {
    console.warn("[FCM] sendPushNotification:", err.message);
  }
}

// ── POST /api/messages/admin ───────────────────────────────────
router.post("/admin", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const {
      text, type = "announcement", targetAll = true, targetUid = null,
      title = "", accentColor = null, tags = [], status = "published",
      publishAt = null, imageUrl = null,
      expiresAt = null, rewardLabel = "", actionRequired = false,
      actionLabel = "", sourceLabel = "",
      routeTarget = null, missionId = null, achievementId = null, itemId = null,
      xpReward = 0, levelReward = 0,
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim())
      return res.status(400).json({ ok:false, message:"El mensaje no puede estar vacío." });
    if (text.trim().length > 500)
      return res.status(400).json({ ok:false, message:"El mensaje no puede superar 500 caracteres." });
    if (title && typeof title === "string" && title.length > 100)
      return res.status(400).json({ ok:false, message:"El título no puede superar 100 caracteres." });
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ ok:false, message:"Tipo de mensaje inválido." });
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ ok:false, message:"Estado inválido." });
    if (!targetAll && !targetUid)
      return res.status(400).json({ ok:false, message:"Especifica targetAll o targetUid." });
    if (tags && !Array.isArray(tags))
      return res.status(400).json({ ok:false, message:"tags debe ser un array." });

    const publishAtTs  = publishAt  ? Timestamp.fromDate(new Date(publishAt))  : null;
    const expiresAtTs  = expiresAt  ? Timestamp.fromDate(new Date(expiresAt))  : null;

    const doc = {
      text:           text.trim(),
      title:          typeof title === "string" ? title.trim() : "",
      type,
      accentColor:    accentColor || null,
      tags:           Array.isArray(tags) ? tags.slice(0, 10) : [],
      status,
      publishAt:      publishAtTs,
      expiresAt:      expiresAtTs,
      imageUrl:       typeof imageUrl === "string" ? imageUrl : null,
      rewardLabel:    typeof rewardLabel === "string" ? rewardLabel.slice(0, 80).trim() : "",
      actionRequired: Boolean(actionRequired),
      actionLabel:    typeof actionLabel === "string" ? actionLabel.slice(0, 80).trim() : "",
      sourceLabel:    typeof sourceLabel === "string" ? sourceLabel.slice(0, 80).trim() : "",
      routeTarget:    typeof routeTarget === "string" ? routeTarget.trim() : null,
      missionId:      typeof missionId === "string" ? missionId.trim() : null,
      achievementId:  typeof achievementId === "string" ? achievementId.trim() : null,
      itemId:         typeof itemId === "string" ? itemId.trim() : null,
      xpReward:       Number(xpReward) > 0 ? Number(xpReward) : 0,
      levelReward:    Number(levelReward) > 0 ? Number(levelReward) : 0,
      createdAt:      FieldValue.serverTimestamp(),
      updatedAt:      FieldValue.serverTimestamp(),
      createdBy:      req.user.uid,
      targetAll:      !!targetAll,
      targetUid:      targetAll ? null : (targetUid || null),
      readCount:      0,
    };

    const msgRef = await db.collection("adminMessages").add(doc);

    // Item 23: FCM — only for published broadcasts
    if (status === "published" && !!targetAll) {
      sendPushNotification({ type, title: doc.title, text: doc.text, messageId: msgRef.id });
    }

    return res.status(201).json({ ok:true, id:msgRef.id });
  } catch (err) {
    console.error("Error en POST /messages/admin:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

// ── GET /api/messages ──────────────────────────────────────────
// Items 16 + 17: filter publishAt <= now AND status === "published"
router.get("/", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const cursorMs = req.query.cursor ? Number(req.query.cursor) : null;
    const pageSize = req.query.limit ? Number(req.query.limit) : 50;
    const { messages, hasMore, nextCursor } = await fetchUserMessagePage(uid, { cursorMs, pageSize });

    const stateRefs = messages.map((msg) => getMessageStateRef(uid, msg.id));
    const stateSnaps = stateRefs.length ? await db.getAll(...stateRefs) : [];
    const readStateMap = new Map();
    stateSnaps.forEach((snap) => {
      if (!snap.exists) return;
      const state = snap.data() || {};
      readStateMap.set(snap.id, state.readAt?.toDate?.()?.toISOString?.() || null);
    });

    return res.json({
      ok:true,
      messages: messages.map((msg) => ({
        ...msg,
        isRead: readStateMap.has(msg.id),
        readAt: readStateMap.get(msg.id) || null,
      })),
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("Error en GET /messages:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

// ── PATCH /api/messages/:id/read ───────────────────────────────
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const uid    = req.user.uid;

    const msgRef = db.collection("adminMessages").doc(id);
    const stateRef = getMessageStateRef(uid, id);

    const result = await db.runTransaction(async (trx) => {
      const [msgSnap, stateSnap] = await Promise.all([
        trx.get(msgRef),
        trx.get(stateRef),
      ]);

      if (!msgSnap.exists) {
        const error = new Error("Mensaje no encontrado.");
        error.status = 404;
        throw error;
      }

      if (!isVisibleToUser(msgSnap.data() || {}, uid)) {
        const error = new Error("Mensaje no disponible.");
        error.status = 404;
        throw error;
      }

      if (stateSnap.exists) {
        return { updated: false };
      }

      trx.set(stateRef, buildMessageStatePayload(id), { merge: true });
      trx.update(msgRef, {
        readCount: FieldValue.increment(1),
      });

      return { updated: true };
    });

    return res.json({ ok:true, updated: result.updated });
  } catch (err) {
    if (err.status === 404 || err.code === 5 || String(err.message).includes("NOT_FOUND")) {
      return res.status(404).json({ ok:false, message:"Mensaje no encontrado." });
    }
    console.error("Error en PATCH /messages/:id/read:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

router.post("/read-all", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const requestedIds = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean).slice(0, 120) : [];
    const now = Date.now();

    let docs = [];

    if (requestedIds.length) {
      const uniqueIds = [...new Set(requestedIds)];
      const snaps = await Promise.all(uniqueIds.map((id) => db.collection("adminMessages").doc(id).get()));
      docs = snaps.filter((snap) => snap.exists);
    } else {
      const [broadcastSnap, targetedSnap] = await Promise.all([
        db.collection("adminMessages").where("targetAll", "==", true).limit(120).get(),
        db.collection("adminMessages").where("targetUid", "==", uid).limit(120).get(),
      ]);
      docs = [...broadcastSnap.docs, ...targetedSnap.docs];
    }

    const uniqueDocs = new Map();
    docs.forEach((doc) => {
      uniqueDocs.set(doc.id, doc);
    });

    const toUpdate = Array.from(uniqueDocs.values()).filter((snap) => {
      return isVisibleToUser(snap.data() || {}, uid, now);
    });

    if (!toUpdate.length) {
      return res.json({ ok: true, updated: 0 });
    }

    const updated = await db.runTransaction(async (trx) => {
      const stateRefs = toUpdate.map((snap) => getMessageStateRef(uid, snap.id));
      const stateSnaps = await Promise.all(stateRefs.map((ref) => trx.get(ref)));

      let changes = 0;
      toUpdate.forEach((snap, index) => {
        if (stateSnaps[index]?.exists) return;
        changes += 1;
        trx.set(stateRefs[index], buildMessageStatePayload(snap.id), { merge: true });
        trx.update(snap.ref, {
          readCount: FieldValue.increment(1),
        });
      });
      return changes;
    });

    return res.json({ ok: true, updated });
  } catch (err) {
    console.error("Error en POST /messages/read-all:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

router.get("/preferences", verifyToken, async (req, res) => {
  try {
    const uid    = req.user.uid;
    const cached = _prefCache.get(uid);
    if (cached && Date.now() - cached.ts < PREF_TTL_MS) {
      return res.json({ ok: true, savedIds: cached.savedIds });
    }
    const userSnap = await db.collection("users").doc(uid).get();
    const savedIds = userSnap.exists && Array.isArray(userSnap.data()?.[SAVED_MESSAGES_FIELD])
      ? userSnap.data()[SAVED_MESSAGES_FIELD]
      : [];
    _prefCache.set(uid, { savedIds, ts: Date.now() });
    return res.json({ ok: true, savedIds });
  } catch (err) {
    console.error("Error en GET /messages/preferences:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

router.post("/saved/:id", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok:false, message:"Mensaje invalido." });

    bustPrefCache(uid);
    await db.collection("users").doc(uid).set({
      [SAVED_MESSAGES_FIELD]: FieldValue.arrayUnion(id),
      [MESSAGE_PREFS_UPDATED_AT_FIELD]: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ ok: true, saved: true, id });
  } catch (err) {
    console.error("Error en POST /messages/saved/:id:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

router.delete("/saved/:id", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok:false, message:"Mensaje invalido." });

    bustPrefCache(uid);
    await db.collection("users").doc(uid).set({
      [SAVED_MESSAGES_FIELD]: FieldValue.arrayRemove(id),
      [MESSAGE_PREFS_UPDATED_AT_FIELD]: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ ok: true, saved: false, id });
  } catch (err) {
    console.error("Error en DELETE /messages/saved/:id:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

// ── PATCH /api/messages/:id ────────────────────────────────────
// Item 18: admin edita un mensaje existente
router.patch("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, text, type, accentColor, tags, status, publishAt, imageUrl,
      expiresAt, rewardLabel, actionRequired, actionLabel, sourceLabel,
      routeTarget, missionId, achievementId, itemId, xpReward, levelReward,
    } = req.body;

    const ref  = db.collection("adminMessages").doc(id);
    const snap = await ref.get();

    if (!snap.exists)
      return res.status(404).json({ ok:false, message:"Mensaje no encontrado." });

    const update = { updatedAt: FieldValue.serverTimestamp() };

    if (title     !== undefined) update.title       = typeof title === "string" ? title.trim() : "";
    if (text      !== undefined) {
      if (typeof text !== "string" || !text.trim())
        return res.status(400).json({ ok:false, message:"El texto no puede estar vacío." });
      if (text.trim().length > 500)
        return res.status(400).json({ ok:false, message:"El texto no puede superar 500 caracteres." });
      update.text = text.trim();
    }
    if (type      !== undefined) {
      if (!VALID_TYPES.includes(type))
        return res.status(400).json({ ok:false, message:"Tipo inválido." });
      update.type = type;
    }
    if (accentColor     !== undefined) update.accentColor    = accentColor || null;
    if (tags            !== undefined) {
      if (!Array.isArray(tags))
        return res.status(400).json({ ok:false, message:"tags debe ser un array." });
      update.tags = tags.slice(0, 10);
    }
    if (status    !== undefined) {
      if (!VALID_STATUSES.includes(status))
        return res.status(400).json({ ok:false, message:"Estado inválido." });
      update.status = status;
    }
    if (publishAt       !== undefined) update.publishAt      = publishAt  ? Timestamp.fromDate(new Date(publishAt))  : null;
    if (expiresAt       !== undefined) update.expiresAt      = expiresAt  ? Timestamp.fromDate(new Date(expiresAt))  : null;
    if (imageUrl        !== undefined) update.imageUrl       = imageUrl || null;
    if (rewardLabel     !== undefined) update.rewardLabel    = typeof rewardLabel === "string" ? rewardLabel.slice(0, 80).trim() : "";
    if (actionRequired  !== undefined) update.actionRequired = Boolean(actionRequired);
    if (actionLabel     !== undefined) update.actionLabel    = typeof actionLabel  === "string" ? actionLabel.slice(0, 80).trim()  : "";
    if (sourceLabel     !== undefined) update.sourceLabel    = typeof sourceLabel  === "string" ? sourceLabel.slice(0, 80).trim()  : "";
    if (routeTarget     !== undefined) update.routeTarget    = typeof routeTarget === "string" ? routeTarget.trim() : null;
    if (missionId       !== undefined) update.missionId      = typeof missionId === "string" ? missionId.trim() : null;
    if (achievementId   !== undefined) update.achievementId  = typeof achievementId === "string" ? achievementId.trim() : null;
    if (itemId          !== undefined) update.itemId         = typeof itemId === "string" ? itemId.trim() : null;
    if (xpReward        !== undefined) update.xpReward       = Number(xpReward) > 0 ? Number(xpReward) : 0;
    if (levelReward     !== undefined) update.levelReward    = Number(levelReward) > 0 ? Number(levelReward) : 0;

    await ref.update(update);

    // FCM: if admin is publishing a broadcast for the first time
    const prev = snap.data();
    const nowPublished = update.status === "published" && prev.status !== "published" && prev.targetAll;
    if (nowPublished) {
      const d = { ...prev, ...update };
      sendPushNotification({ type: d.type, title: d.title, text: d.text, messageId: id });
    }

    return res.json({ ok:true });
  } catch (err) {
    console.error("Error en PATCH /messages/:id:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

// ── GET /api/messages/admin/history ────────────────────────────
// Item 21: cursor-based pagination (?cursor=<ms>&limit=30)
router.get("/admin/history", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const pageSize = Math.min(parseInt(req.query.limit) || 30, 100);
    const cursor   = req.query.cursor ? Number(req.query.cursor) : null;

    let q = db.collection("adminMessages").orderBy("createdAt", "desc");
    if (cursor) {
      q = q.where("createdAt", "<", Timestamp.fromMillis(cursor));
    }
    q = q.limit(pageSize + 1); // fetch one extra to detect next page

    const snap     = await q.get();
    const hasMore  = snap.docs.length > pageSize;
    const docs     = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    const messages = docs.map(doc => {
      const d = doc.data();
      return {
        id:          doc.id,
        text:        d.text        || "",
        title:       d.title       || "",
        type:        d.type        || "announcement",
        status:      d.status      || "published",
        accentColor: d.accentColor || null,
        tags:        d.tags        || [],
        imageUrl:    d.imageUrl    || "",
        publishAt:   d.publishAt?.toDate?.()?.toISOString() || null,
        createdAt:   d.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt:   d.updatedAt?.toDate?.()?.toISOString() || null,
        createdBy:   d.createdBy,
        targetAll:   d.targetAll,
        targetUid:   d.targetUid,
        readCount:   d.readCount ?? (d.readBy || []).length,
        routeTarget: d.routeTarget || null,
        missionId:   d.missionId || null,
        achievementId: d.achievementId || null,
        itemId:      d.itemId || null,
        xpReward:    Number(d.xpReward || 0),
        levelReward: Number(d.levelReward || 0),
      };
    });

    const nextCursor = hasMore
      ? new Date(messages[messages.length - 1].createdAt).getTime()
      : null;

    return res.json({ ok:true, messages, nextCursor, hasMore });
  } catch (err) {
    console.error("Error en GET /messages/admin/history:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

// ── DELETE /api/messages/:id ───────────────────────────────────
// Item 22: soft delete (status→"archived"). ?hard=true para borrado real (admin).
router.delete("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const hard   = req.query.hard === "true";
    const ref    = db.collection("adminMessages").doc(id);
    const snap   = await ref.get();

    if (!snap.exists)
      return res.status(404).json({ ok:false, message:"Mensaje no encontrado." });

    if (hard) {
      await ref.delete();
    } else {
      await ref.update({
        status:    "archived",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return res.json({ ok:true, deleted:hard, archived:!hard });
  } catch (err) {
    console.error("Error en DELETE /messages/:id:", err);
    return res.status(500).json({ ok:false, message:err.message });
  }
});

export default router;

/*
 * ── Item 24: Firestore Security Rules ─────────────────────────
 * Pegar en Firebase Console → Firestore → Rules
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     match /adminMessages/{id} {
 *       // Usuarios autenticados pueden leer mensajes que les correspondan
 *       allow read: if request.auth != null &&
 *         (resource.data.targetAll == true ||
 *          resource.data.targetUid == request.auth.uid);
 *
 *       // Solo admins pueden crear/actualizar/borrar via Firebase Console o SDK directo.
 *       // Las escrituras normales van por el backend (verifyToken + checkRole).
 *       allow write: if request.auth != null &&
 *         request.auth.token.role == "admin";
 *     }
 *
 *     match /users/{uid}/messageState/{messageId} {
 *       allow read, write: if request.auth != null && request.auth.uid == uid;
 *     }
 *
 *   }
 * }
 */
