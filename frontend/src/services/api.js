// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

async function request(endpoint, options = {}) {
  const fetchOptions = {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  };
  
  const res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || "Error en el servidor");
    error.status = res.status;
    error.code = data.code || error.code;
    error.payload = data;
    throw error;
  }
  return data;
}

// Auth

// Guarda el perfil del heroe en Firestore tras el registro
export const registerProfile = (uid, username, email, heroClass, photoURL = null) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ uid, username, email, heroClass, photoURL }),
  });

// Llamar despues de cada login exitoso - actualiza lastLoginAt y firstLogin
export const loginSync = (token) =>
  request("/auth/login-sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Bonus diario de login - idempotente, una vez por dia UTC
export const claimDailyBonus = (token) =>
  request("/auth/daily-bonus", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Verifica si un usuario ya tiene perfil (para Google login)
export const checkProfile = (uid) =>
  request(`/auth/check/${uid}`);

// Auth
export const checkUsername = (username) =>
  request(`/auth/check-username/${encodeURIComponent(username)}`);

// Obtiene el perfil completo del usuario autenticado
export const getProfile = (token) =>
  request("/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Actualiza el perfil del usuario autenticado
export const updateProfile = (token, profileData) =>
  request("/auth/profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(profileData),
  });

// Verifica que el token es valido
export const verifyMe = (token) =>
  request("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Guarda las respuestas del cuestionario de onboarding (solo primera vez)
export const saveOnboarding = (token, answers) =>
  request("/auth/onboarding", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answers }),
  });

// Elimina la cuenta del usuario autenticado (requiere confirmacion con username)
export const deleteProfile = (token, confirmUsername) =>
  request("/auth/profile", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ confirmUsername }),
  });

// Solicita un codigo de recuperacion por email
export const forgotPassword = (email) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// Verifica el codigo y actualiza la contrasena
export const resetPassword = (email, code, newPassword) =>
  request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });

// Admin

// Admin
export const getUsers = (token) =>
  request("/auth/users", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin
export const addCoinsAdmin = (token, uid, amount, reason = "") =>
  request(`/admin/users/${uid}/coins`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, reason }),
  });

// Cambia el rol de un usuario
export const updateUserRole = (token, uid, role) =>
  request(`/auth/users/${uid}/role`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });

// Elimina un usuario
export const deleteUser = (token, uid) =>
  request(`/auth/users/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Dashboard

// Auth
export const getPublicStats = () =>
  request("/dashboard/public-stats");

// Dashboard
export const getDashboardStats = (token, periodo = "30d") =>
  request(`/dashboard/stats?periodo=${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Obtiene el feed de actividad
export const getActivityFeed = (token) =>
  request("/dashboard/activity-feed", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getUserStats = (token) =>
  request("/dashboard/user-stats", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Notificaciones reales del usuario
export const getNotifications = (token) =>
  request("/dashboard/notifications", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const markNotificationRead = (token, id) =>
  request(`/dashboard/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

export const markAllNotificationsRead = (token, ids) =>
  request("/dashboard/notifications/read-all", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });

// Actividad reciente del usuario autenticado
export const getUserActivity = (token) =>
  request("/dashboard/user-activity", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Actividad de los ultimos 7 dias (para grafico semanal del perfil)
export const getWeeklyActivity = (token) =>
  request("/dashboard/weekly-activity", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Top usuarios por XP (leaderboard publico)
export const getLeaderboard = (token) =>
  request("/dashboard/leaderboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Ranking semanal por clase - se resetea cada lunes
export const getWeeklyLeaderboard = (token) =>
  request("/dashboard/leaderboard/weekly", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Streak Challenge - estado del desafio de racha del dia
export const getStreakChallenge = (token) =>
  request("/dashboard/streak-challenge", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Diario post-entrenamiento - guarda rating + palabra y auto-alimenta Zona Mente
export const saveWorkoutJournal = (token, data) =>
  request("/ejercicios/journal", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

// Logros/badges del usuario actual
export const getUserLogros = (token) =>
  request("/logros/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Obtiene datos para gráficos
export const getChartData = (token, periodo = "7d") =>
  request(`/dashboard/chart-data?periodo=${periodo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Registra una actividad
export const logActivity = (token, activityData) =>
  request("/dashboard/log-activity", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(activityData),
  });

// Admin

// Admin
export const getAdminMessages = (token) =>
  request("/messages", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin
export const sendAdminMessage = (token, data) =>
  request("/messages/admin", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

// Admin
export const getAdminMessageHistory = (token) =>
  request("/messages/admin/history", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin
export const deleteAdminMessage = (token, id) =>
  request(`/messages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Usuario: marcar mensaje como leído
export const markMessageRead = (token, id) =>
  request(`/messages/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

export const markAllMessagesRead = (token, ids = []) =>
  request("/messages/read-all", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ids }),
  });

export const getUserMessagesPage = (token, options = {}) => {
  const params = new URLSearchParams();
  if (options.cursor) params.set("cursor", String(options.cursor));
  if (options.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  return request(`/messages${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMessagePreferences = (token) =>
  request("/messages/preferences", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveMessageForUser = (token, id) =>
  request(`/messages/saved/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

export const unsaveMessageForUser = (token, id) =>
  request(`/messages/saved/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin

// Obtiene lista de usuarios con filtros
export const getAdminUsers = (token, filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return request(`/admin/users${query ? "?" + query : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Crea un nuevo usuario
export const createAdminUser = (token, userData) =>
  request("/admin/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(userData),
  });

// Actualiza un usuario
export const updateAdminUser = (token, uid, userData) =>
  request(`/admin/users/${uid}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(userData),
  });

// Elimina un usuario (hard-delete permanente)
export const deleteAdminUser = (token, uid) =>
  request(`/admin/users/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Lista cuentas en papelera (soft-deleted)
export const getDeletedUsers = (token) =>
  request("/admin/users/deleted", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Restaura una cuenta soft-deleted
export const restoreUser = (token, uid) =>
  request(`/admin/users/${uid}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Elimina múltiples usuarios
export const bulkDeleteUsers = (token, uids) =>
  request("/admin/users/bulk-delete", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uids }),
  });

// Cambia status de múltiples usuarios
export const bulkUpdateStatus = (token, uids, status) =>
  request("/admin/users/bulk-status", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ uids, status }),
  });

// ── Ejercicios ─────────────────────────────────────────────────

// ─── CATEGORÍAS ───
export const getCategorias = (token) =>
  request("/ejercicios/categorias", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createCategoria = (token, data) =>
  request("/ejercicios/categorias", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateCategoria = (token, id, data) =>
  request(`/ejercicios/categorias/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteCategoria = (token, id) =>
  request(`/ejercicios/categorias/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── RUTINAS ───
export const getRutinas = (token, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request(`/ejercicios/rutinas${params ? "?" + params : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createRutina = (token, data) =>
  request("/ejercicios/rutinas", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateRutina = (token, id, data) =>
  request(`/ejercicios/rutinas/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteRutina = (token, id) =>
  request(`/ejercicios/rutinas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Catálogo público de rutinas activas para usuarios
export const getRutinasPublicas = (token) =>
  request("/ejercicios/rutinas-publicas", {
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── COMPLETAR RUTINA ───
export const completarRutina = (token, rutinaData) =>
  request("/ejercicios/completar-rutina", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(rutinaData),
  });

// Catálogo público de ejercicios activos para usuarios
export const getEjerciciosPublicos = (token) =>
  request("/ejercicios/ejercicios-publicos", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Categorías públicas activas para usuarios
export const getCategoriasPublicas = (token) =>
  request("/ejercicios/categorias-publicas", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Obtiene lista de ejercicios disponibles para usuarios (endpoint público)
export const getEjerciciosUsuario = (token) =>
  request("/ejercicios/ejercicios-publicos", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Personal records del usuario
export const getMisPRs = (token) =>
  request("/ejercicios/mis-prs", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Completa una sesión de ejercicio y otorga XP
export const completarSesion = (token, sessionData) =>
  request("/ejercicios/completar-sesion", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(sessionData),
  });

// ─── MISIONES ───
// Admin
export const getMisionesAdmin = (token) =>
  request("/missions", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Misiones activas públicas (compatibilidad)
export const getMisiones = (token) =>
  request("/missions/public", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMisionesUsuario = (token) =>
  request("/missions/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const trackMision = (token, payload) =>
  request("/missions/track", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

export const getMissionsUser = getMisionesUsuario;

export const trackMissionProgress = (token, tipo, valor) =>
  request("/missions/track", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tipo, valor }),
  });

export const claimMision = (token, id) =>
  request(`/missions/${id}/claim`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

export const createMision = (token, data) =>
  request("/missions", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateMision = (token, id, data) =>
  request(`/missions/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteMision = (token, id) =>
  request(`/missions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── OBJETOS ───
export const getObjetos = (token) =>
  request("/objetos", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getObjetosPublic = (token) =>
  request("/objetos/public", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getInventario = (token) =>
  request("/objetos/inventory", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getPurchases = (token, { cursor = "", limit = 24 } = {}) =>
  request(`/objetos/purchases?limit=${encodeURIComponent(limit)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const buyObjeto = (token, id, cantidad = 1) =>
  request("/objetos/buy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id, cantidad }),
  });

export const buyLevel = (token) =>
  request("/objetos/buy-level", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

export const useObjeto = (token, id) =>
  request(`/objetos/use/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

export const createObjeto = (token, data) =>
  request("/objetos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateObjeto = (token, id, data) =>
  request(`/objetos/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteObjeto = (token, id) =>
  request(`/objetos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Obtiene los boosts activos del usuario con tiempo restante
export const getActiveBoosts = (token) =>
  request("/objetos/active-boosts", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Guarda la wishlist del usuario en Firestore (debounced desde el frontend)
export const saveWishlist = (token, wishlist) =>
  request("/objetos/wishlist", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ wishlist }),
  });

// Admin
export const seedFunctionalItems = (token) =>
  request("/objetos/seed-items", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Skins del avatar ──────────────────────────────────────────

// Catálogo público de skins disponibles
export const getSkins = () =>
  request("/skins");

// Compra una skin (deduce coins y agrega a ownedSkins)
export const purchaseSkin = (token, skinId) =>
  request("/skins/purchase", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ skinId }),
  });

// Cambia la skin activa del usuario
export const setActiveSkin = (token, skinId) =>
  request("/skins/active", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ skinId }),
  });

// ── Avatares de perfil y marcos circulares ────────────────────

// Catálogo público de avatares y marcos
export const getAvatarCatalog = () =>
  request("/avatars");

// Compra un avatar o marco (type: "avatar" | "frame")
export const purchaseAvatarItem = (token, itemId) =>
  request("/avatars/purchase", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ itemId }),
  });

// Cambia el avatar activo
export const setActiveAvatar = (token, avatarId) =>
  request("/avatars/active", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ avatarId }),
  });

// Cambia el marco activo (frameId=null quita el marco)
export const setActiveFrame = (token, frameId) =>
  request("/avatars/active-frame", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ frameId }),
  });

// ── Config ────────────────────────────────────────────────────

// Obtiene la configuración global
export const getConfig = (token) =>
  request("/config", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Guarda configuración por sección
export const saveConfig = (token, section, data) =>
  request(`/config/${section}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

// ── Mantenimiento ──────────────────────────────────────────────

// Limpia caché
export const clearCache = (token) =>
  request("/admin/maintenance/cache", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Cierra todas las sesiones
export const closeAllSessions = (token) =>
  request("/admin/maintenance/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Limpia logs
export const clearLogs = (token) =>
  request("/admin/maintenance/logs", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Exporta usuarios CSV
export const exportUsersCSV = (token) =>
  request("/admin/maintenance/export/users", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Exporta sesiones CSV
export const exportSessionsCSV = (token) =>
  request("/admin/maintenance/export/sessions", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Exporta configuración JSON
export const exportConfigJSON = (token) =>
  request("/admin/maintenance/export/config", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Resetea XP de todos los usuarios
export const resetAllXP = (token) =>
  request("/admin/maintenance/reset-xp", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Elimina usuarios inactivos
export const deleteInactiveUsers = (token) =>
  request("/admin/maintenance/delete-inactive", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── LOGROS ───
export const getLogros = (token) =>
  request("/logros", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Catálogo completo con progreso del usuario
export const getLogrosCatalogo = (token) =>
  request("/logros/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Marcar logro como celebrado/reclamado
export const claimLogro = (token, id) =>
  request(`/logros/${id}/claim`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

export const createLogro = (token, data) =>
  request("/logros", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateLogro = (token, id, data) =>
  request(`/logros/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteLogro = (token, id) =>
  request(`/logros/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin
export const seedMenteLogros = (token) =>
  request("/logros/seed-mente", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin
export const seedMenteMisiones = (token) =>
  request("/missions/seed-mente", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Títulos ───────────────────────────────────────────────────

export const buyTitle = (token, titulo) =>
  request("/titles/buy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ titulo }),
  });

export const getTitlesCatalog = () =>
  request("/titles");

export const equipTitle = (token, titulo) =>
  request("/titles/equip", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ titulo }),
  });

// ── Feedback / Reportes ───────────────────────────────────────

// Usuario: enviar feedback (P2: token null = feedback anónimo)
export const submitFeedback = (token, data) =>
  request("/feedback", {
    method: "POST",
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    body: JSON.stringify(data),
  });

// Admin
export const getFeedback = (token, filters = {}) => {
  const q = new URLSearchParams(filters).toString();
  return request(`/feedback${q ? "?" + q : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Admin
export const getFeedbackStats = (token) =>
  request("/feedback/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin
export const updateFeedback = (token, id, data) =>
  request(`/feedback/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

// Admin
export const deleteFeedback = (token, id) =>
  request(`/feedback/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Auth
export const getMyFeedback = (token) =>
  request("/feedback/my", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Auth
export const getPublicFeedbackStats = () =>
  request("/feedback/public-stats");

// Auth
export const getPublicTestimonials = () =>
  request("/feedback/public-testimonials");

// Admin
export const exportFeedback = async (token, format = "csv") => {
  const res = await fetch(`${BASE_URL}/feedback/export?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al exportar");
  return res.blob();
};

// ── Chat usuario-a-usuario ────────────────────────────────────

// Buscar usuarios por nombre
export const searchChatUsers = (token, q) =>
  request(`/chat/users/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Héroes sugeridos para descubrir (sin necesidad de buscar)
export const getSuggestedUsers = (token) =>
  request("/chat/users/suggested", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Enviar solicitud de amistad
export const sendFriendRequest = (token, toUid) =>
  request("/chat/friends/request", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ toUid }),
  });

// Responder solicitud (accept | reject)
export const respondFriendRequest = (token, reqId, action) =>
  request(`/chat/friends/${reqId}/respond`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action }),
  });

// Lista de amigos
export const getFriends = (token) =>
  request("/chat/friends", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Solicitudes pendientes recibidas
export const getFriendRequests = (token) =>
  request("/chat/friends/requests", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Solicitudes enviadas pendientes
export const getSentFriendRequests = (token) =>
  request("/chat/friends/sent", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Eliminar amigo
export const removeFriend = (token, friendUid) =>
  request(`/chat/friends/${friendUid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Lista de conversaciones
export const getConversations = (token) =>
  request("/chat/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Crear o recuperar conversación con un amigo
export const openConversation = (token, friendUid) =>
  request("/chat/conversations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ friendUid }),
  });

// Obtener mensajes paginados de una conversación
export const getMessages = (token, convId, before = null) => {
  const params = before ? `?before=${before}` : "";
  return request(`/chat/conversations/${convId}/messages${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Enviar mensaje en una conversación
export const sendMessage = (token, convId, payload) =>
  request(`/chat/conversations/${convId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(typeof payload === "string" ? { text: payload } : payload),
  });

// Borrar un mensaje propio
export const deleteMessage = (token, convId, msgId) =>
  request(`/chat/conversations/${convId}/messages/${msgId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// Marcar conversación como leída
export const markConversationRead = (token, convId) =>
  request(`/chat/conversations/${convId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── EJERCICIOS ───
export const getEjercicios = (token, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request(`/ejercicios/ejercicios${params ? "?" + params : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createEjercicio = (token, data) =>
  request("/ejercicios/ejercicios", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateEjercicio = (token, id, data) =>
  request(`/ejercicios/ejercicios/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteEjercicio = (token, id) =>
  request(`/ejercicios/ejercicios/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Zona Mente (Psicología Positiva) ──────────────────────────

export const saveMood = (token, mood) =>
  request("/mente/mood", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mood }),
  });

export const getMoodHistory = (token) =>
  request("/mente/mood", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveGratitude = (token, entries) =>
  request("/mente/gratitude", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ entries }),
  });

export const getGratitudeHistory = (token) =>
  request("/mente/gratitude", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const savePerma = (token, scores) =>
  request("/mente/perma", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ scores }),
  });

export const getPermaHistory = (token) =>
  request("/mente/perma", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveStrengths = (token, top3, all) =>
  request("/mente/strengths", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ top3, all }),
  });

export const getStrengths = (token) =>
  request("/mente/strengths", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const logMenteSession = (token, type, extra = {}) =>
  request("/mente/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type, ...extra }),
  });

export const getMenteSummary = (token) =>
  request("/mente/summary", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getSaludSummary = (token) =>
  request("/salud/summary", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveSaludState = (token, data) =>
  request("/salud/state", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const saveSaludCheckin = (token, data) =>
  request("/salud/checkin", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const getMenteInsights = (token) =>
  request("/mente/insights", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCommunityMente = (token) =>
  request("/mente/community", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveMenteConnection = (token, note = "") =>
  request("/mente/connection", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ note }),
  });

export const getMenteAdminOverview = (token, days = 7) =>
  request(`/mente/admin/overview?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Skill Tree ──────────────────────────────────────────────────

// Árbol de habilidades del usuario (clase + estado de cada skill)
export const getMySkills = (token) =>
  request("/skills/my-skills", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Desbloquear una habilidad (gasta 1 skill point)
export const unlockSkill = (token, skillId) =>
  request("/skills/unlock", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ skillId }),
  });
