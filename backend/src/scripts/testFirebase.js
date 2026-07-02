// Test simple de Firebase
import { db } from "../config/firebase.js";

const testFirebase = async () => {
  try {
    console.log("🧪 Probando conexión a Firebase...");

    const testRef = db.collection("test");
    await testRef.add({ mensaje: "Test de conexión", timestamp: new Date() });

    console.log("✅ Firebase funciona correctamente");
  } catch (error) {
    console.error("❌ Error en Firebase:", error);
  }
};

testFirebase();