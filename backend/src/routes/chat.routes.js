// src/routes/chat.routes.js
// ─────────────────────────────────────────────────────────────
//  API de mensajería usuario-a-usuario para ForgeVenture.
//  Maneja: solicitudes de amistad, lista de amigos, conversaciones y mensajes.
//  Optimización de espacio: max 200 msgs/conv, paginación de 30, 500 chars/msg.
// ─────────────────────────────────────────────────────────────
import { Router }              from "express";
import { db, auth }            from "../config/firebase.js";
import admin                   from "../config/firebase.js";
import { validateNoProfanity } from "../utils/profanityFilter.js";

const FieldValue = admin.firestore.FieldValue;
const Timestamp  = admin.firestore.Timestamp;

const router = Router();

const CHAT_CTA_TYPES = new Set(["mission", "routine", "achievement", "item", "exercise", "profile", "character", "section"]);
const CHAT_SECTIONS = new Set(["home", "dashboard", "ejercicios", "rutinas", "misiones", "logros", "tienda", "personaje", "perfil", "mente", "salud"]);

// ── Rate limiting en memoria ──────────────────────────────────
const lastSend    = new Map();
const RATE_LIMIT_MS = 1000;
const _discoverPoolCache = { ts: 0, data: [] };
const DISCOVER_POOL_TTL = 5 * 60_000;
const DISCOVER_POOL_LIMIT = 36;

// ── Caches en memoria (evitar lecturas Firestore repetidas) ───
const _userCache    = new Map();  // uid → { ts, data }
const _friendsCache = new Map();  // uid → { ts, data }
const _sentCache    = new Map();  // uid → { ts, data }
const _suggestCache = new Map();  // uid → { ts, data }
const _searchCache  = new Map();  // `uid:q` → { ts, data }

const USER_TTL     = 5  * 60_000;  // 5 min — perfil cambia poco
const FRIENDS_TTL  = 3  * 60_000;  // 3 min
const SENT_TTL     = 2  * 60_000;  // 2 min
const SUGGEST_TTL  = 5  * 60_000;  // 5 min — lista global cambia poco
const SEARCH_TTL   = 90 * 1000;    // 90 s — resultados de búsqueda

// Helpers de invalidación
const _bustFriends  = (uid) => { _friendsCache.delete(uid); _suggestCache.delete(uid); };
const _bustSent     = (uid) => { _sentCache.delete(uid);    _suggestCache.delete(uid); };
const _bustSearch   = (uid) => {
  for (const k of _searchCache.keys()) if (k.startsWith(uid + ":")) _searchCache.delete(k);
};

// Limpieza periódica — evita memory leak en procesos de larga vida
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of lastSend)    if (now - v            > 60_000)      lastSend.delete(k);
  for (const [k, v] of _userCache)  if (now - v.ts > USER_TTL)    _userCache.delete(k);
  for (const [k, v] of _friendsCache) if (now - v.ts > FRIENDS_TTL) _friendsCache.delete(k);
  for (const [k, v] of _sentCache)  if (now - v.ts > SENT_TTL)     _sentCache.delete(k);
  for (const [k, v] of _suggestCache) if (now - v.ts > SUGGEST_TTL) _suggestCache.delete(k);
  for (const [k, v] of _searchCache) if (now - v.ts > SEARCH_TTL)   _searchCache.delete(k);
}, 60_000);

// ── Constantes ────────────────────────────────────────────────
const MAX_MESSAGES      = 200;   // Máx mensajes por conversación
const TRIM_COUNT        = 20;    // Cuántos borrar cuando se supera MAX_MESSAGES
const PAGE_SIZE         = 30;    // Mensajes por página
const MAX_MSG_LENGTH    = 500;   // Caracteres máx por mensaje

// ── Middleware: verificar token Firebase ─────────────────────
async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, message:"Token requerido" });
  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ ok:false, message:"Token inválido" });
  }
}

// ── Helper: obtener datos básicos del perfil (con cache 5 min) ─
async function getUserSnap(uid) {
  const cached = _userCache.get(uid);
  if (cached && Date.now() - cached.ts < USER_TTL) return cached.data;

  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  const data = {
    uid,
    username:  d.username  || "Desconocido",
    photoURL:  d.photoURL  || null,
    heroClass: d.heroClass || "GUERRERO",
    level:     d.level     || 1,
    xp:        d.xp        || 0,
    streak:    d.streakCount || d.streak || d.moodStreak || 0,
    favoriteZone: d.favoriteZone || d.preferredZone || null,
    preferredZone: d.preferredZone || d.favoriteZone || null,
    currentRoute: d.currentRoute || d.activeRoute || d.currentZone || null,
    recentZone: d.lastZone || d.recentZone || d.lastCompletedZone || null,
    lastExerciseAt: d.lastExerciseAt || d.lastWorkoutAt || null,
    lastRoutineAt: d.lastRoutineAt || d.lastTrainingAt || null,
    lastMissionAt: d.lastMissionAt || d.lastQuestAt || null,
    lastActiveAt: d.lastActiveAt || d.updatedAt || d.lastSeenAt || null,
    updatedAt: d.updatedAt || d.lastActiveAt || null,
    achievementsCount:
      Array.isArray(d.badges) ? d.badges.length
      : Number(d.achievementsCount || d.badgesCount || d.logrosCount || 0),
  };
  _userCache.set(uid, { ts: Date.now(), data });
  return data;
}

function mergeParticipantIdentity(stored = {}, live = null) {
  if (!live) return stored || {};
  return {
    ...(stored || {}),
    ...live,
    favoriteZone: live.favoriteZone || stored?.favoriteZone || null,
    preferredZone: live.preferredZone || stored?.preferredZone || null,
  };
}

function serializeConversationDoc(id, data = {}) {
  return {
    id,
    participants: data.participants || [],
    participantData: data.participantData || {},
    lastMessage: data.lastMessage || null,
    lastMessageAt: data.lastMessageAt?.toMillis?.() || null,
    unread: data.unread || {},
    readAt: data.readAt || {},
    messageCount: data.messageCount || 0,
    messageCountTotal: data.messageCountTotal || data.messageCount || 0,
    visibleMessageCount: data.visibleMessageCount ?? data.messageCount ?? 0,
  };
}

function friendshipId(uid1, uid2) {
  return [uid1, uid2].sort().join("__");
}

async function getAcceptedFriendshipDocs(uid, otherUid) {
  const canonicalRef = db.collection("friendRequests").doc(friendshipId(uid, otherUid));
  const canonicalSnap = await canonicalRef.get();
  const legacyQueries = await Promise.all([
    db.collection("friendRequests").where("fromUid","==",uid).where("toUid","==",otherUid).where("status","==","accepted").limit(1).get(),
    db.collection("friendRequests").where("fromUid","==",otherUid).where("toUid","==",uid).where("status","==","accepted").limit(1).get(),
  ]);
  const docs = [];
  if (canonicalSnap.exists && canonicalSnap.data()?.status === "accepted") {
    docs.push(canonicalSnap);
  }
  legacyQueries.forEach((snapshot) => docs.push(...snapshot.docs));
  return docs.filter((docSnap, index, array) => array.findIndex((entry) => entry.id === docSnap.id) === index);
}

async function areUsersFriends(uid, otherUid) {
  const docs = await getAcceptedFriendshipDocs(uid, otherUid);
  return docs.length > 0;
}

async function getDiscoveryPool() {
  if (_discoverPoolCache.data.length && Date.now() - _discoverPoolCache.ts < DISCOVER_POOL_TTL) {
    return _discoverPoolCache.data;
  }

  const snap = await db.collection("users")
    .orderBy("xp", "desc")
    .limit(DISCOVER_POOL_LIMIT)
    .get();

  const pool = snap.docs.map((d) => {
    const u = d.data() || {};
    return {
      uid: d.id,
      username: u.username || "Desconocido",
      photoURL: u.photoURL || null,
      heroClass: u.heroClass || "GUERRERO",
      level: u.level || 1,
      xp: u.xp || 0,
      streak: u.streakCount || u.streak || u.moodStreak || 0,
      favoriteZone: u.favoriteZone || u.preferredZone || null,
      preferredZone: u.preferredZone || u.favoriteZone || null,
      currentRoute: u.currentRoute || u.activeRoute || u.currentZone || null,
      recentZone: u.lastZone || u.recentZone || u.lastCompletedZone || null,
      lastExerciseAt: u.lastExerciseAt || u.lastWorkoutAt || null,
      lastRoutineAt: u.lastRoutineAt || u.lastTrainingAt || null,
      lastMissionAt: u.lastMissionAt || u.lastQuestAt || null,
      lastActiveAt: u.lastActiveAt || u.updatedAt || u.lastSeenAt || null,
      updatedAt: u.updatedAt || u.lastActiveAt || null,
      achievementsCount:
        Array.isArray(u.badges) ? u.badges.length
        : Number(u.achievementsCount || u.badgesCount || u.logrosCount || 0),
    };
  });

  _discoverPoolCache.ts = Date.now();
  _discoverPoolCache.data = pool;
  return pool;
}

// ── Helper: ID determinístico de conversación ────────────────
function convId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function cleanShortString(value, max = 120) {
  if (typeof value !== "string") return null;
  const next = value.trim().slice(0, max);
  return next || null;
}

function sanitizeChatCta(raw) {
  if (!raw || typeof raw !== "object") return null;
  const ctaType = cleanShortString(raw.ctaType || raw.type || raw.entityType || "", 32)?.toLowerCase() || null;
  const section = cleanShortString(raw.section || raw.targetSection || "", 32)?.toLowerCase() || null;
  const ctaLabel = cleanShortString(raw.ctaLabel || raw.label || "", 48);
  const profileUid = cleanShortString(raw.profileUid || raw.uid || "", 80);
  const payload = {
    ctaType: CHAT_CTA_TYPES.has(ctaType) ? ctaType : null,
    section: CHAT_SECTIONS.has(section) ? section : null,
    ctaLabel,
    missionId: cleanShortString(raw.missionId || "", 80),
    rutinaId: cleanShortString(raw.rutinaId || "", 80),
    achievementId: cleanShortString(raw.achievementId || raw.logroId || "", 80),
    itemId: cleanShortString(raw.itemId || raw.objetoId || "", 80),
    exerciseId: cleanShortString(raw.exerciseId || raw.ejercicioId || "", 80),
    profileUid,
    entityId: cleanShortString(raw.entityId || "", 80),
  };
  return Object.values(payload).some(Boolean) ? payload : null;
}

function toMillisSafe(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeZoneKey(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s+/g, "-")
    : null;
}

function getPrimaryZone(user) {
  return normalizeZoneKey(
    user?.favoriteZone
    || user?.preferredZone
    || user?.currentRoute
    || user?.recentZone
    || null
  );
}

function getRecentGameplayStamp(user) {
  return Math.max(
    toMillisSafe(user?.lastExerciseAt),
    toMillisSafe(user?.lastRoutineAt),
    toMillisSafe(user?.lastMissionAt),
    toMillisSafe(user?.updatedAt),
    toMillisSafe(user?.lastActiveAt)
  );
}

function buildSuggestContextKey(user) {
  if (!user) return "anon";
  return [
    user.heroClass || "NA",
    getPrimaryZone(user) || "no-zone",
    Number(user.level || 1),
    Number(user.streak || 0),
    Number(user.achievementsCount || 0),
    getRecentGameplayStamp(user),
  ].join("|");
}

function buildSuggestedMatch(viewer, candidate) {
  const sharedSignals = [];
  let score = 0;

  if (candidate.heroClass === viewer.heroClass) {
    score += 34;
    sharedSignals.push({ label: "Misma clase", tone: "class" });
  }

  const viewerZone = getPrimaryZone(viewer);
  const candidateZone = getPrimaryZone(candidate);
  if (viewerZone && candidateZone && viewerZone === candidateZone) {
    score += 26;
    sharedSignals.push({ label: "Zona afín", tone: "zone" });
  }

  const levelGap = Math.abs(Number(candidate.level || 1) - Number(viewer.level || 1));
  if (levelGap <= 2) {
    score += 18;
    sharedSignals.push({ label: "Nivel cercano", tone: "progress" });
  } else if (levelGap <= 5) {
    score += 10;
  }

  const streakGap = Math.abs(Number(candidate.streak || 0) - Number(viewer.streak || 0));
  if ((candidate.streak || viewer.streak) && streakGap <= 2) {
    score += 14;
    sharedSignals.push({ label: "Ritmo parecido", tone: "streak" });
  }

  const achievementGap = Math.abs(Number(candidate.achievementsCount || 0) - Number(viewer.achievementsCount || 0));
  if ((candidate.achievementsCount || viewer.achievementsCount) && achievementGap <= 5) {
    score += 10;
    sharedSignals.push({ label: "Trofeos cercanos", tone: "achievement" });
  }

  const recentStamp = getRecentGameplayStamp(candidate);
  if (recentStamp > Date.now() - 86400000) {
    score += 12;
    sharedSignals.push({ label: "Activo hoy", tone: "activity" });
  } else if (recentStamp > Date.now() - 7 * 86400000) {
    score += 6;
  }

  const recommendationReason = sharedSignals[0]?.label
    ? `Buena sinergia por ${sharedSignals.slice(0, 2).map((entry) => entry.label.toLowerCase()).join(" y ")}.`
    : "Puede sumar una lectura distinta del mapa sin salirse de tu ritmo.";

  return {
    score,
    recommendationReason,
    sharedSignals: sharedSignals.slice(0, 3),
  };
}

// ─────────────────────────────────────────────────────────────
//  BÚSQUEDA DE USUARIOS
// ─────────────────────────────────────────────────────────────

// GET /api/chat/users/search?q=término
router.get("/users/search", verifyToken, async (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  if (q.length < 2) return res.json({ ok:true, users:[] });

  const cacheKey = `${req.uid}:${q}`;
  const cached = _searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_TTL)
    return res.json({ ok:true, users: cached.data });

  try {
    const snap = await db.collection("users")
      .where("usernameLower", ">=", q)
      .where("usernameLower", "<=", q + "")
      .limit(15)
      .get();

    const users = snap.docs
      .filter(d => d.id !== req.uid)
      .map(d => {
        const u = d.data();
        return {
          uid:       d.id,
          username:  u.username  || "Desconocido",
          photoURL:  u.photoURL  || null,
          heroClass: u.heroClass || "GUERRERO",
          level:     u.level     || 1,
        };
      });

    _searchCache.set(cacheKey, { ts: Date.now(), data: users });
    res.json({ ok:true, users });
  } catch (err) {
    console.error("chat/search:", err);
    res.status(500).json({ ok:false, message:"Error al buscar usuarios" });
  }
});

// GET /api/chat/users/suggested — héroes para descubrir (sin buscar)
router.get("/users/suggested", verifyToken, async (req, res) => {
  const uid = req.uid;
  const cached = _suggestCache.get(uid);

  try {
    const me = await getUserSnap(uid) || { uid, heroClass: "GUERRERO", level: 1, streak: 0, achievementsCount: 0 };
    const contextKey = buildSuggestContextKey(me);
    if (cached && cached.contextKey === contextKey && Date.now() - cached.ts < SUGGEST_TTL)
      return res.json({ ok:true, users: cached.data });

    // Obtener amigos actuales del usuario para excluirlos
    const [friendsFrom, friendsTo] = await Promise.all([
      db.collection("friendRequests")
        .where("fromUid", "==", req.uid)
        .where("status",  "==", "accepted")
        .get(),
      db.collection("friendRequests")
        .where("toUid",  "==", req.uid)
        .where("status", "==", "accepted")
        .get(),
    ]);
    const friendUids = new Set([
      ...friendsFrom.docs.map(d => d.data().toUid),
      ...friendsTo.docs.map(d => d.data().fromUid),
    ]);

    // Solicitudes ya enviadas (para marcarlas en el frontend)
    const sentSnap = await db.collection("friendRequests")
      .where("fromUid", "==", req.uid)
      .where("status",  "==", "pending")
      .get();
    const sentUids = new Set(sentSnap.docs.map(d => d.data().toUid));

    // Pool amplio pero barato: luego reordenamos por señales reales del juego.
    const discoveryPool = await getDiscoveryPool();

    const users = discoveryPool
      .filter((candidate) => candidate.uid !== req.uid && !friendUids.has(candidate.uid))
      .map((candidate) => {
        const match = buildSuggestedMatch(me, candidate);
        return {
          ...candidate,
          alreadySent: sentUids.has(candidate.uid),
          recommendationReason: match.recommendationReason,
          sharedSignals: match.sharedSignals,
          socialScore: match.score,
        };
      })
      .sort((a, b) => {
        if (b.socialScore !== a.socialScore) return b.socialScore - a.socialScore;
        return Number(b.xp || 0) - Number(a.xp || 0);
      })
      .slice(0, 12);

    _suggestCache.set(uid, { ts: Date.now(), data: users, contextKey });
    res.json({ ok:true, users });
  } catch (err) {
    console.error("chat/suggested:", err);
    res.status(500).json({ ok:false, message:"Error al obtener sugerencias" });
  }
});

// ─────────────────────────────────────────────────────────────
//  SOLICITUDES DE AMISTAD
// ─────────────────────────────────────────────────────────────

// POST /api/chat/friends/request  { toUid }
router.post("/friends/request", verifyToken, async (req, res) => {
  const { toUid } = req.body;
  const fromUid = req.uid;
  if (!toUid || toUid === fromUid)
    return res.status(400).json({ ok:false, message:"Usuario inválido" });

  try {
    const [fromUserSnap, toUserSnap] = await Promise.all([getUserSnap(fromUid), getUserSnap(toUid)]);
    if (!toUserSnap) return res.status(404).json({ ok:false, message:"Usuario no encontrado" });

    const pairId = friendshipId(fromUid, toUid);
    const canonicalRef = db.collection("friendRequests").doc(pairId);
    const canonicalResult = await db.runTransaction(async (tx) => {
      const snap = await tx.get(canonicalRef);
      const nowTs = Timestamp.now();

      if (!snap.exists) {
        tx.set(canonicalRef, {
          pairId,
          participants: [fromUid, toUid].sort(),
          fromUid,
          toUid,
          fromUsername: fromUserSnap?.username || "Desconocido",
          fromPhotoURL: fromUserSnap?.photoURL || null,
          fromHeroClass: fromUserSnap?.heroClass || "GUERRERO",
          toUsername: toUserSnap.username || "Desconocido",
          status: "pending",
          createdAt: nowTs,
          updatedAt: nowTs,
        });
        return "sent";
      }

      const current = snap.data() || {};
      if (current.status === "accepted") return "friends";

      if (current.status === "pending") {
        if (current.fromUid === fromUid) return "already_sent";
        if (current.toUid === fromUid) {
          tx.update(canonicalRef, {
            status: "accepted",
            updatedAt: nowTs,
            acceptedAt: nowTs,
          });
          return "auto_accept";
        }
      }

      tx.set(canonicalRef, {
        ...current,
        pairId,
        participants: [fromUid, toUid].sort(),
        fromUid,
        toUid,
        fromUsername: fromUserSnap?.username || current.fromUsername || "Desconocido",
        fromPhotoURL: fromUserSnap?.photoURL || current.fromPhotoURL || null,
        fromHeroClass: fromUserSnap?.heroClass || current.fromHeroClass || "GUERRERO",
        toUsername: toUserSnap.username || current.toUsername || "Desconocido",
        status: "pending",
        createdAt: current.createdAt || nowTs,
        updatedAt: nowTs,
        acceptedAt: FieldValue.delete(),
      }, { merge: true });
      return "resent";
    });

    _bustSent(fromUid);
    _bustSearch(fromUid);

    if (canonicalResult === "friends") {
      _bustFriends(fromUid); _bustFriends(toUid);
      return res.json({ ok:true, message:"Ya son amigos" });
    }
    if (canonicalResult === "already_sent") {
      return res.json({ ok:true, message:"Solicitud ya enviada" });
    }
    if (canonicalResult === "auto_accept") {
      _bustFriends(fromUid); _bustFriends(toUid);
      _bustSent(toUid);
      _bustSearch(toUid);
      return res.json({ ok:true, message:"Solicitud aceptada automÃ¡ticamente" });
    }
    return res.json({ ok:true, message:"Solicitud enviada" });

    // Comprobar si ya existe solicitud o amistad
    const existing = await db.collection("friendRequests")
      .where("fromUid", "==", fromUid)
      .where("toUid",   "==", toUid)
      .limit(1).get();

    if (!existing.empty) {
      const s = existing.docs[0].data().status;
      if (s === "pending")  return res.json({ ok:true, message:"Solicitud ya enviada" });
      if (s === "accepted") return res.json({ ok:true, message:"Ya son amigos" });
    }

    // Comprobar dirección inversa
    const reverse = await db.collection("friendRequests")
      .where("fromUid", "==", toUid)
      .where("toUid",   "==", fromUid)
      .where("status",  "==", "pending")
      .limit(1).get();

    if (!reverse.empty) {
      // Aceptar automáticamente la solicitud existente
      await reverse.docs[0].ref.update({ status:"accepted", updatedAt: Timestamp.now() });
      _bustFriends(fromUid); _bustFriends(toUid);
      _bustSent(toUid);
      return res.json({ ok:true, message:"Solicitud aceptada automáticamente" });
    }

    const [fromUser, toUser] = await Promise.all([getUserSnap(fromUid), getUserSnap(toUid)]);
    if (!toUser) return res.status(404).json({ ok:false, message:"Usuario no encontrado" });

    await db.collection("friendRequests").add({
      fromUid,
      toUid,
      fromUsername:  fromUser.username,
      fromPhotoURL:  fromUser.photoURL,
      fromHeroClass: fromUser.heroClass,
      toUsername:    toUser.username,
      status:        "pending",
      createdAt:     Timestamp.now(),
    });

    _bustSent(fromUid);
    _bustSearch(fromUid);
    res.json({ ok:true, message:"Solicitud enviada" });
  } catch (err) {
    console.error("chat/friends/request:", err);
    res.status(500).json({ ok:false, message:"Error al enviar solicitud" });
  }
});

// POST /api/chat/friends/:reqId/respond  { action: "accept"|"reject" }
router.post("/friends/:reqId/respond", verifyToken, async (req, res) => {
  const { reqId }  = req.params;
  const { action } = req.body;
  if (!["accept","reject"].includes(action))
    return res.status(400).json({ ok:false, message:"Acción inválida" });

  try {
    const ref  = db.collection("friendRequests").doc(reqId);
    const txPayload = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return { error: { code: 404, message: "Solicitud no encontrada" } };
      }
      const req_ = snap.data();
      if (req_.toUid !== req.uid) {
        return { error: { code: 403, message: "No autorizado" } };
      }
      if (req_.status !== "pending") {
        return { error: { code: 409, message: "Solicitud ya procesada" } };
      }
      tx.update(ref, {
        status: action === "accept" ? "accepted" : "rejected",
        updatedAt: Timestamp.now(),
        ...(action === "accept" ? { acceptedAt: Timestamp.now() } : {}),
      });
      return { request: req_ };
    });
    if (txPayload?.error) {
      return res.status(txPayload.error.code).json({ ok:false, message: txPayload.error.message });
    }
    const req_ = txPayload.request;

    if (action === "accept") {
      _bustFriends(req.uid); _bustFriends(req_.fromUid);
      _bustSent(req_.fromUid);
      _bustSearch(req.uid); _bustSearch(req_.fromUid);
    }
    res.json({ ok:true, message: action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada" });
  } catch (err) {
    console.error("chat/friends/respond:", err);
    res.status(500).json({ ok:false, message:"Error al responder solicitud" });
  }
});

// GET /api/chat/friends  — lista de amigos (solicitudes aceptadas)
router.get("/friends", verifyToken, async (req, res) => {
  const uid = req.uid;
  const cached = _friendsCache.get(uid);
  if (cached && Date.now() - cached.ts < FRIENDS_TTL)
    return res.json({ ok:true, friends: cached.data });

  try {
    const [sent, recv] = await Promise.all([
      db.collection("friendRequests").where("fromUid","==",uid).where("status","==","accepted").get(),
      db.collection("friendRequests").where("toUid",  "==",uid).where("status","==","accepted").get(),
    ]);

    const friendUids = new Set([
      ...sent.docs.map(d => d.data().toUid),
      ...recv.docs.map(d => d.data().fromUid),
    ]);

    const friends = (await Promise.all([...friendUids].map(u => getUserSnap(u)))).filter(Boolean);
    _friendsCache.set(uid, { ts: Date.now(), data: friends });
    res.json({ ok:true, friends });
  } catch (err) {
    console.error("chat/friends:", err);
    res.status(500).json({ ok:false, message:"Error al obtener amigos" });
  }
});

// GET /api/chat/friends/requests  — solicitudes pendientes recibidas
router.get("/friends/requests", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("friendRequests")
      .where("toUid",  "==", req.uid)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const requests = snap.docs.map(d => ({ id:d.id, ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.() || Date.now() }));
    res.json({ ok:true, requests });
  } catch (err) {
    console.error("chat/friends/requests:", err);
    res.status(500).json({ ok:false, message:"Error al obtener solicitudes" });
  }
});

// GET /api/chat/friends/sent  — solicitudes enviadas pendientes
router.get("/friends/sent", verifyToken, async (req, res) => {
  const uid = req.uid;
  const cached = _sentCache.get(uid);
  if (cached && Date.now() - cached.ts < SENT_TTL)
    return res.json({ ok:true, requests: cached.data });

  try {
    const snap = await db.collection("friendRequests")
      .where("fromUid","==", uid)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const requests = snap.docs.map(d => ({ id:d.id, ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.() || Date.now() }));
    _sentCache.set(uid, { ts: Date.now(), data: requests });
    res.json({ ok:true, requests });
  } catch (err) {
    console.error("chat/friends/sent:", err);
    res.status(500).json({ ok:false, message:"Error al obtener solicitudes enviadas" });
  }
});

// DELETE /api/chat/friends/:friendUid  — eliminar amigo
router.delete("/friends/:friendUid", verifyToken, async (req, res) => {
  const { friendUid } = req.params;
  try {
    const uid = req.uid;
    const friendshipDocs = await getAcceptedFriendshipDocs(uid, friendUid);
    const convRef = db.collection("conversations").doc(convId(uid, friendUid));
    const convSnap = await convRef.get();
    const batch = db.batch();
    friendshipDocs.forEach(d => batch.delete(d.ref));
    if (convSnap.exists) {
      batch.update(convRef, {
        friendshipActive: false,
        closedAt: Timestamp.now(),
        [`unread.${uid}`]: 0,
        [`unread.${friendUid}`]: 0,
      });
    }
    await batch.commit();
    _bustFriends(uid); _bustFriends(friendUid);
    _bustSent(uid);    _bustSent(friendUid);
    _bustSearch(uid);  _bustSearch(friendUid);
    res.json({
      ok:true,
      message:"Amistad eliminada",
      conversationId: convSnap.exists ? convRef.id : null,
      friendUid,
    });
  } catch (err) {
    console.error("chat/friends/delete:", err);
    res.status(500).json({ ok:false, message:"Error al eliminar amistad" });
  }
});

// ─────────────────────────────────────────────────────────────
//  CONVERSACIONES
// ─────────────────────────────────────────────────────────────

// GET /api/chat/conversations  — lista de conversaciones del usuario
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection("conversations")
      .where("participants", "array-contains", req.uid)
      .orderBy("lastMessageAt", "desc")
      .limit(50)
      .get();

    const rawDocs = snap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() }));
    const participantUids = [...new Set(rawDocs.flatMap((entry) => entry.data.participants || []))];
    const liveParticipants = Object.fromEntries(
      await Promise.all(participantUids.map(async (uid) => [uid, await getUserSnap(uid)]))
    );

    const conversations = rawDocs.map(({ id, data }) => {
      if (data.friendshipActive === false) return null;
      const nextParticipantData = Object.fromEntries(
        (data.participants || []).map((uid) => [
          uid,
          mergeParticipantIdentity(data.participantData?.[uid], liveParticipants[uid]),
        ])
      );

      return {
        id,
        participants: data.participants,
        participantData: nextParticipantData,
        lastMessage:  data.lastMessage || null,
        lastMessageAt: data.lastMessageAt?.toMillis?.() || null,
        unread:       data.unread || {},
        readAt:       data.readAt || {},
        messageCount: data.messageCount || 0,
        messageCountTotal: data.messageCountTotal || data.messageCount || 0,
        visibleMessageCount: data.visibleMessageCount ?? data.messageCount ?? 0,
      };
    }).filter(Boolean);
    res.json({ ok:true, conversations });
  } catch (err) {
    console.error("chat/conversations:", err);
    res.status(500).json({ ok:false, message:"Error al obtener conversaciones" });
  }
});

// POST /api/chat/conversations  — crear o recuperar conversación con un amigo
router.post("/conversations", verifyToken, async (req, res) => {
  const { friendUid } = req.body;
  const uid = req.uid;
  if (!friendUid || friendUid === uid)
    return res.status(400).json({ ok:false, message:"Usuario inválido" });

  try {
    const isFriend = await areUsersFriends(uid, friendUid);
    if (!isFriend)
      return res.status(403).json({ ok:false, message:"Solo puedes chatear con amigos" });

    const cid    = convId(uid, friendUid);
    const convRef = db.collection("conversations").doc(cid);
    const convSnap = await convRef.get();

    if (convSnap.exists) {
      const d = convSnap.data();
      if (d.friendshipActive === false) {
        await convRef.update({
          friendshipActive: true,
          closedAt: FieldValue.delete(),
          [`unread.${uid}`]: d.unread?.[uid] || 0,
          [`unread.${friendUid}`]: d.unread?.[friendUid] || 0,
        });
      }
      const liveParticipants = Object.fromEntries(
        await Promise.all(
          (d.participants || []).map(async (participantUid) => [participantUid, await getUserSnap(participantUid)])
        )
      );
      const nextParticipantData = Object.fromEntries(
        (d.participants || []).map((participantUid) => [
          participantUid,
          mergeParticipantIdentity(d.participantData?.[participantUid], liveParticipants[participantUid]),
        ])
      );
      return res.json({
        ok:true,
        conversation: {
          id:           cid,
          participants: d.participants,
          participantData: nextParticipantData,
          lastMessage:  d.lastMessage || null,
          lastMessageAt: d.lastMessageAt?.toMillis?.() || null,
          unread:       d.unread || {},
          readAt:       d.readAt || {},
          messageCount: d.messageCount || 0,
          messageCountTotal: d.messageCountTotal || d.messageCount || 0,
          visibleMessageCount: d.visibleMessageCount ?? d.messageCount ?? 0,
        }
      });
    }

    // Crear nueva conversación
    const [me, friend] = await Promise.all([getUserSnap(uid), getUserSnap(friendUid)]);
    if (!friend) return res.status(404).json({ ok:false, message:"Usuario no encontrado" });

    const nowTs = Timestamp.now();
    const convData = {
      participants: [uid, friendUid],
      participantData: {
        [uid]:       { username: me.username,     photoURL: me.photoURL,     heroClass: me.heroClass,     level: me.level,     streak: me.streak     || 0 },
        [friendUid]: { username: friend.username, photoURL: friend.photoURL, heroClass: friend.heroClass, level: friend.level, streak: friend.streak || 0 },
      },
      lastMessage:   null,
      lastMessageAt: nowTs,  // no null para que el orderBy no falle
      unread:        { [uid]: 0, [friendUid]: 0 },
      readAt:        { [uid]: nowTs, [friendUid]: nowTs },
      messageCount:  0,
      messageCountTotal: 0,
      visibleMessageCount: 0,
      friendshipActive: true,
      createdAt:     nowTs,
    };

    await convRef.set(convData);
    res.json({ ok:true, conversation: {
      id:           cid,
      participants: convData.participants,
      participantData: convData.participantData,
      lastMessage:  null,
      lastMessageAt: nowTs.toMillis(),
      unread:       convData.unread,
      readAt:       convData.readAt,
      messageCount: 0,
      messageCountTotal: 0,
      visibleMessageCount: 0,
    } });
  } catch (err) {
    console.error("chat/conversations/create:", err);
    res.status(500).json({ ok:false, message:"Error al crear conversación" });
  }
});

// ─────────────────────────────────────────────────────────────
//  MENSAJES
// ─────────────────────────────────────────────────────────────

// GET /api/chat/conversations/:convId/messages?before=timestamp&limit=30
router.get("/conversations/:convId/messages", verifyToken, async (req, res) => {
  const { convId: cid } = req.params;
  const uid = req.uid;

  try {
    // Verificar que el usuario es participante
    const convSnap = await db.collection("conversations").doc(cid).get();
    if (!convSnap.exists)
      return res.status(404).json({ ok:false, message:"Conversación no encontrada" });
    if (!convSnap.data().participants.includes(uid))
      return res.status(403).json({ ok:false, message:"No autorizado" });
    if (convSnap.data().friendshipActive === false)
      return res.status(410).json({ ok:false, message:"Este canal ya no estÃ¡ disponible" });

    let query = db.collection("conversations").doc(cid)
      .collection("messages")
      .where("deleted","==",false)
      .orderBy("timestamp","desc")
      .limit(PAGE_SIZE);

    // Paginación: cargar mensajes anteriores a cierto timestamp
    if (req.query.before) {
      const beforeTs = Timestamp.fromMillis(Number(req.query.before));
      query = query.startAfter(beforeTs);
    }

    const snap = await query.get();
    const messages = snap.docs.map(d => {
      const data = d.data();
      return {
        id:        d.id,
        fromUid:   data.fromUid,
        text:      data.text,
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        deleted:   data.deleted || false,
        cta:       data.cta || null,
      };
    }).reverse(); // Los más antiguos primero

    res.json({ ok:true, messages, hasMore: snap.size === PAGE_SIZE });
  } catch (err) {
    console.error("chat/messages/get:", err);
    res.status(500).json({ ok:false, message:"Error al obtener mensajes" });
  }
});

// POST /api/chat/conversations/:convId/messages  { text }
router.post("/conversations/:convId/messages", verifyToken, async (req, res) => {
  const { convId: cid } = req.params;
  const uid = req.uid;
  let { text, cta: rawCta } = req.body;
  const cta = sanitizeChatCta(rawCta);

  if (!text || !text.trim())
    return res.status(400).json({ ok:false, message:"El mensaje no puede estar vacío" });

  // Recortar a máx caracteres
  text = text.trim().slice(0, MAX_MSG_LENGTH);

  // Filtro de lenguaje inapropiado
  const profanityErr = validateNoProfanity(text, "mensaje");
  if (profanityErr)
    return res.status(400).json({ ok:false, message: profanityErr });

  // Rate limiting por usuario
  const now = Date.now();
  if (lastSend.has(uid) && (now - lastSend.get(uid)) < RATE_LIMIT_MS)
    return res.status(429).json({ ok:false, message:"Demasiado rápido, espera un momento" });
  lastSend.set(uid, now);

  try {
    const convRef  = db.collection("conversations").doc(cid);
    const convSnap = await convRef.get();
    if (!convSnap.exists)
      return res.status(404).json({ ok:false, message:"Conversación no encontrada" });
    const conv = convSnap.data();
    if (!conv.participants.includes(uid))
      return res.status(403).json({ ok:false, message:"No autorizado" });
    if (conv.friendshipActive === false)
      return res.status(410).json({ ok:false, message:"Este canal ya no estÃ¡ disponible" });

    const otherUid = conv.participants.find(p => p !== uid);
    const msgRef   = convRef.collection("messages").doc();
    const ts       = Timestamp.now();

    const msgData = {
      fromUid:   uid,
      text,
      timestamp: ts,
      deleted:   false,
      deletedAt: null,
      cta,
    };

    const batch = db.batch();

    // Agregar mensaje
    batch.set(msgRef, msgData);

    // Actualizar metadatos de conversación
    batch.update(convRef, {
      lastMessage:   { text, fromUid: uid, timestamp: ts, cta },
      lastMessageAt: ts,
      messageCount:  FieldValue.increment(1),
      messageCountTotal: FieldValue.increment(1),
      visibleMessageCount: FieldValue.increment(1),
      [`unread.${otherUid}`]: FieldValue.increment(1),
    });

    await batch.commit();

    // Recorte de espacio: leer el conteo fresco (post-commit) para evitar race conditions
    try {
      const freshSnap = await convRef.get();
      const freshCount = freshSnap.data()?.visibleMessageCount ?? freshSnap.data()?.messageCount ?? 0;
      if (freshCount > MAX_MESSAGES) {
        const old = await convRef.collection("messages")
          .where("deleted", "==", false)
          .orderBy("timestamp", "asc")
          .limit(TRIM_COUNT)
          .get();
        if (!old.empty) {
          const trimmedVisible = old.docs.length;
          const trimBatch = db.batch();
          old.docs.forEach(d => trimBatch.update(d.ref, {
            deleted:   true,
            deletedAt: Timestamp.now(),
            text:      "[Mensaje eliminado por límite de almacenamiento]",
          }));
          trimBatch.update(convRef, { visibleMessageCount: FieldValue.increment(-trimmedVisible) });
          await trimBatch.commit();
        }
      }
    } catch (trimErr) {
      console.warn("[chat] trim:", trimErr.message);
    }

    res.json({
      ok:true,
      message: {
        id:        msgRef.id,
        fromUid:   uid,
        text,
        timestamp: ts.toMillis(),
        deleted:   false,
        cta,
      }
    });
  } catch (err) {
    console.error("chat/messages/send:", err);
    res.status(500).json({ ok:false, message:"Error al enviar mensaje" });
  }
});

// DELETE /api/chat/conversations/:convId/messages/:msgId  — borrado suave
router.delete("/conversations/:convId/messages/:msgId", verifyToken, async (req, res) => {
  const { convId: cid, msgId } = req.params;
  const uid = req.uid;

  try {
    const convRef = db.collection("conversations").doc(cid);
    const convSnap = await convRef.get();
    if (!convSnap.exists)
      return res.status(404).json({ ok:false, message:"ConversaciÃ³n no encontrada" });
    const conv = convSnap.data();
    if (!conv.participants.includes(uid))
      return res.status(403).json({ ok:false, message:"No autorizado" });
    if (conv.friendshipActive === false)
      return res.status(410).json({ ok:false, message:"Este canal ya no estÃ¡ disponible" });

    const msgRef  = convRef.collection("messages").doc(msgId);
    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) return res.status(404).json({ ok:false, message:"Mensaje no encontrado" });
    if (msgSnap.data().fromUid !== uid)
      return res.status(403).json({ ok:false, message:"Solo puedes borrar tus propios mensajes" });
    if (msgSnap.data().deleted)
      return res.json({ ok:true, message:"Ya eliminado" });

    await msgRef.update({
      deleted:   true,
      deletedAt: Timestamp.now(),
      text:      "[Mensaje eliminado]",
    });

    const latestVisibleSnap = await convRef.collection("messages")
      .where("deleted", "==", false)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    let nextLastMessage = null;
    let nextLastMessageAt = conv.createdAt || Timestamp.now();

    if (!latestVisibleSnap.empty) {
      const latestDoc = latestVisibleSnap.docs[0];
      const latestData = latestDoc.data() || {};
      nextLastMessage = {
        text: latestData.text || "",
        fromUid: latestData.fromUid || null,
        timestamp: latestData.timestamp || null,
        cta: latestData.cta || null,
      };
      nextLastMessageAt = latestData.timestamp || conv.lastMessageAt || conv.createdAt || Timestamp.now();
    }

    await convRef.update({
      lastMessage: nextLastMessage,
      lastMessageAt: nextLastMessageAt,
      visibleMessageCount: FieldValue.increment(-1),
    });

    const conversation = serializeConversationDoc(cid, {
      ...conv,
      lastMessage: nextLastMessage,
      lastMessageAt: nextLastMessageAt,
      visibleMessageCount: Math.max(0, Number(conv.visibleMessageCount ?? conv.messageCount ?? 1) - 1),
    });

    res.json({
      ok:true,
      message:"Mensaje eliminado",
      conversation,
    });
  } catch (err) {
    console.error("chat/messages/delete:", err);
    res.status(500).json({ ok:false, message:"Error al eliminar mensaje" });
  }
});

// PATCH /api/chat/conversations/:convId/read  — marcar como leído
router.patch("/conversations/:convId/read", verifyToken, async (req, res) => {
  const { convId: cid } = req.params;
  const uid = req.uid;

  try {
    const convRef = db.collection("conversations").doc(cid);
    const snap    = await convRef.get();
    if (!snap.exists || !snap.data().participants.includes(uid))
      return res.status(403).json({ ok:false, message:"No autorizado" });
    if (snap.data().friendshipActive === false)
      return res.status(410).json({ ok:false, message:"Este canal ya no estÃ¡ disponible" });

    await convRef.update({
      [`unread.${uid}`]: 0,
      [`readAt.${uid}`]: Timestamp.now(),
    });
    res.json({ ok:true });
  } catch (err) {
    console.error("chat/conversations/read:", err);
    res.status(500).json({ ok:false, message:"Error al marcar como leído" });
  }
});

export default router;
