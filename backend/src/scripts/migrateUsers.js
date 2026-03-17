// src/scripts/migrateUsers.js
// Añade roleId: "user" a todos los documentos de la colección "users"
// que no tengan ese campo todavía.
// Ejecutar UNA SOLA VEZ: node src/scripts/migrateUsers.js

import { db } from "../config/firebase.js";

async function migrate() {
  console.log("🔄 Iniciando migración de usuarios...\n");

  const snapshot = await db.collection("users").get();

  if (snapshot.empty) {
    console.log("⚠️  No hay usuarios en la colección.");
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.roleId) {
      console.log(`  ⏭  ${data.email} — ya tiene roleId: "${data.roleId}"`);
      skipped++;
      continue;
    }

    await db.collection("users").doc(doc.id).update({
      roleId:      "user",
      firstLogin:  data.firstLogin  ?? true,
      lastLoginAt: data.lastLoginAt ?? data.createdAt ?? new Date().toISOString(),
      photoURL:    data.photoURL    ?? null,
    });

    console.log(`  ✅  ${data.email} — roleId: "user" añadido`);
    updated++;
  }

  console.log(`\n🎉 Migración completa.`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Omitidos (ya tenían roleId): ${skipped}`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Error en migración:", err.message);
  process.exit(1);
});