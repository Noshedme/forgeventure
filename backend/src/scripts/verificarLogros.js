// Verificar logros en Firebase
import { db } from "../config/firebase.js";

const verificarLogros = async () => {
  try {
    console.log("🔍 Verificando logros en Firebase...");

    const logrosRef = db.collection("achievements");
    const snapshot = await logrosRef.get();

    console.log(`📊 Total de logros encontrados: ${snapshot.size}`);

    const logrosPorTipo = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const tipo = data.tipo;
      if (!logrosPorTipo[tipo]) {
        logrosPorTipo[tipo] = 0;
      }
      logrosPorTipo[tipo]++;
    });

    console.log("📈 Logros por tipo:");
    Object.entries(logrosPorTipo).forEach(([tipo, cantidad]) => {
      console.log(`  ${tipo}: ${cantidad}`);
    });

    console.log("\n🏆 Lista de logros:");
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.nombre} (${data.tipo} - ${data.rareza})`);
    });

  } catch (error) {
    console.error("❌ Error verificando logros:", error);
  }
};

verificarLogros();