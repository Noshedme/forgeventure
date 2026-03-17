// src/config/firebase.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ruta absoluta al serviceAccountKey.json en la raíz del backend
const keyPath = resolve(__dirname, "../../serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
  console.log("✅ serviceAccountKey.json cargado correctamente");
} catch (err) {
  console.error("❌ No se encontró serviceAccountKey.json en:", keyPath);
  console.error("   Descárgalo desde Firebase Console → ⚙️ → Cuentas de servicio");
  process.exit(1); // Detiene el servidor con mensaje claro
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin inicializado");
}

export const db   = admin.firestore();
export const auth = admin.auth();
export default admin;