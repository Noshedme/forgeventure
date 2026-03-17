// src/scripts/seedRoles.js
// Ejecutar UNA SOLA VEZ para crear la colección "roles" en Firestore.
// Comando: node src/scripts/seedRoles.js

import { db } from "../config/firebase.js";

const roles = {
  user: {
    name: "Usuario",
    description: "Acceso completo a la aplicación de fitness RPG",
    permissions: [
      "profile:read",
      "profile:update",
      "workout:create",
      "workout:read",
      "workout:update",
      "leaderboard:read",
      "achievements:read",
    ],
    createdAt: new Date().toISOString(),
  },
  admin: {
    name: "Administrador",
    description: "Acceso total al sistema incluyendo gestión de usuarios y contenido",
    permissions: [
      "profile:read",
      "profile:update",
      "workout:create",
      "workout:read",
      "workout:update",
      "workout:delete",
      "leaderboard:read",
      "achievements:read",
      "users:read",
      "users:update",
      "users:delete",
      "routines:manage",
      "admin:dashboard",
    ],
    createdAt: new Date().toISOString(),
  },
};

async function seed() {
  console.log("🌱 Sembrando colección 'roles'...");
  try {
    for (const [id, data] of Object.entries(roles)) {
      await db.collection("roles").doc(id).set(data);
      console.log(`  ✅ Rol '${id}' creado`);
    }
    console.log("\n🎉 Roles sembrados correctamente en Firestore.");
    console.log("   Colección: roles/user  y  roles/admin");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al sembrar roles:", err.message);
    process.exit(1);
  }
}

seed();