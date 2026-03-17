// src/services/api.js
const BASE_URL = "http://localhost:4000/api";

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error en el servidor");
  return data;
}

// ── Auth ───────────────────────────────────────────────────────

// Guarda el perfil del héroe en Firestore tras el registro
export const registerProfile = (uid, username, email, heroClass, photoURL = null) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ uid, username, email, heroClass, photoURL }),
  });

// Llamar después de cada login exitoso — actualiza lastLoginAt y firstLogin
export const loginSync = (token) =>
  request("/auth/login-sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

// Verifica si un usuario ya tiene perfil (para Google login)
export const checkProfile = (uid) =>
  request(`/auth/check/${uid}`);

// Obtiene el perfil completo del usuario autenticado
export const getProfile = (token) =>
  request("/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Verifica que el token es válido
export const verifyMe = (token) =>
  request("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

// Solicita un código de recuperación por email
export const forgotPassword = (email) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// Verifica el código y actualiza la contraseña
export const resetPassword = (email, code, newPassword) =>
  request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });

// ── Admin ──────────────────────────────────────────────────────

// Lista todos los usuarios (requiere token de admin)
export const getUsers = (token) =>
  request("/auth/users", {
    headers: { Authorization: `Bearer ${token}` },
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