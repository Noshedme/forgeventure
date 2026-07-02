// src/scripts/seedLogros.js
import { db } from "../config/firebase.js";

const seedLogros = async () => {
  console.log("🚀 Iniciando función seedLogros...");
  try {
    console.log("🏆 Iniciando seed de logros...");
    console.log("🔧 Configurando Firebase...");

    // Limpiar colección existente
    console.log("🧹 Limpiando colección existente...");
    const logrosRef = db.collection("achievements");
    const snapshot = await logrosRef.get();
    console.log(`📊 Encontrados ${snapshot.size} documentos existentes`);
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("🧹 Colección 'achievements' limpiada");

    // Logros de ejemplo con estructura completa
    const logros = [
      // ── EJERCICIO ──────────────────────────────────────────────
      {
        nombre: "Primer Paso",
        descripcion: "Completa tu primera sesión de ejercicio.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Común",
        imagen: "👋",
        xpBonus: 50,
        secreto: false,
        activo: true,
        obtenidos: 892,
        condiciones: [
          { tipo: "sesiones_total", label: "Total de sesiones", icon: "🏃", cantidad: 1, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "50 XP" }
        ],
        creadoEn: "2024-10-01T00:00:00.000Z",
      },
      {
        nombre: "Cardio King",
        descripcion: "Completa 50 sesiones de cardio.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Épico",
        imagen: "🏃",
        xpBonus: 500,
        secreto: false,
        activo: true,
        obtenidos: 67,
        condiciones: [
          { tipo: "cardio_sesiones", label: "Sesiones de cardio", icon: "🏃", cantidad: 50, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "500 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Rey del Cardio" }
        ],
        creadoEn: "2024-10-20T00:00:00.000Z",
      },
      {
        nombre: "Fuerza Interior",
        descripcion: "Completa 25 sesiones de fuerza y musculación.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Raro",
        imagen: "💪",
        xpBonus: 350,
        secreto: false,
        activo: true,
        obtenidos: 78,
        condiciones: [
          { tipo: "fuerza_sesiones", label: "Sesiones de fuerza", icon: "💪", cantidad: 25, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "350 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Titán de Acero" }
        ],
        creadoEn: "2025-01-15T00:00:00.000Z",
      },
      {
        nombre: "Maratón Runner",
        descripcion: "Corre un total de 100 kilómetros.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Épico",
        imagen: "🏃‍♂️",
        xpBonus: 600,
        secreto: false,
        activo: true,
        obtenidos: 23,
        condiciones: [
          { tipo: "distancia_total", label: "Distancia recorrida", icon: "📏", cantidad: 100, unidad: "km" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "600 XP" },
          { tipo: "item", icon: "👟", label: "Objeto", valor: "Zapatillas Legendarias" }
        ],
        creadoEn: "2025-01-20T00:00:00.000Z",
      },
      {
        nombre: "Zen Master",
        descripcion: "Completa 30 sesiones de yoga o flexibilidad.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Épico",
        imagen: "🧘",
        xpBonus: 400,
        secreto: false,
        activo: true,
        obtenidos: 89,
        condiciones: [
          { tipo: "flex_sesiones", label: "Sesiones de flexibilidad", icon: "🧘", cantidad: 30, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "400 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Alma Zen" }
        ],
        creadoEn: "2024-11-10T00:00:00.000Z",
      },
      {
        nombre: "Centenario",
        descripcion: "Completa 100 sesiones de ejercicio en total.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Épico",
        imagen: "💯",
        xpBonus: 800,
        secreto: false,
        activo: true,
        obtenidos: 44,
        condiciones: [
          { tipo: "sesiones_total", label: "Total de sesiones", icon: "🏃", cantidad: 100, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "800 XP" },
          { tipo: "badge_xtra", icon: "🏅", label: "Badge Extra", valor: "Escudo Centenario" }
        ],
        creadoEn: "2024-11-15T00:00:00.000Z",
      },
      {
        nombre: "Especialista HIIT",
        descripcion: "Completa 50 sesiones de HIIT intensas.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Épico",
        imagen: "🔥",
        xpBonus: 550,
        secreto: false,
        activo: true,
        obtenidos: 34,
        condiciones: [
          { tipo: "hiit_sesiones", label: "Sesiones HIIT", icon: "🔥", cantidad: 50, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "550 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Maestro del Fuego" }
        ],
        creadoEn: "2025-02-25T00:00:00.000Z",
      },
      {
        nombre: "Meditación Profunda",
        descripcion: "Completa 20 sesiones de meditación guiada.",
        descripcionSecreta: "",
        tipo: "Ejercicio",
        rareza: "Raro",
        imagen: "🧘‍♀️",
        xpBonus: 200,
        secreto: false,
        activo: true,
        obtenidos: 145,
        condiciones: [
          { tipo: "meditacion_sesiones", label: "Sesiones de meditación", icon: "🧘‍♀️", cantidad: 20, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "200 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Espíritu Sereno" }
        ],
        creadoEn: "2025-03-01T00:00:00.000Z",
      },

      // ── RACHA ──────────────────────────────────────────────────
      {
        nombre: "Semana de Hierro",
        descripcion: "Mantén una racha de 7 días seguidos.",
        descripcionSecreta: "",
        tipo: "Racha",
        rareza: "Raro",
        imagen: "🔥",
        xpBonus: 200,
        secreto: false,
        activo: true,
        obtenidos: 312,
        condiciones: [
          { tipo: "racha_dias", label: "Racha consecutiva", icon: "🔥", cantidad: 7, unidad: "días" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "200 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Guerrero Semanal" }
        ],
        creadoEn: "2024-10-05T00:00:00.000Z",
      },
      {
        nombre: "Maestro del Fuego",
        descripcion: "Mantén una racha de 30 días consecutivos.",
        descripcionSecreta: "",
        tipo: "Racha",
        rareza: "Legendario",
        imagen: "🏆",
        xpBonus: 2000,
        secreto: false,
        activo: true,
        obtenidos: 18,
        condiciones: [
          { tipo: "racha_dias", label: "Racha consecutiva", icon: "🔥", cantidad: 30, unidad: "días" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "2000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Llama Eterna" },
          { tipo: "item", icon: "🎒", label: "Objeto", valor: "Corona del Campeón" }
        ],
        creadoEn: "2024-10-10T00:00:00.000Z",
      },
      {
        nombre: "Sprint Épico",
        descripcion: "Completa 3 sesiones de cardio en un solo día.",
        descripcionSecreta: "",
        tipo: "Racha",
        rareza: "Raro",
        imagen: "⚡",
        xpBonus: 250,
        secreto: false,
        activo: true,
        obtenidos: 156,
        condiciones: [
          { tipo: "cardio_sesiones", label: "Sesiones de cardio", icon: "🏃", cantidad: 3, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "250 XP" }
        ],
        creadoEn: "2025-01-10T00:00:00.000Z",
      },
      {
        nombre: "Racha Dorada",
        descripcion: "Mantén una racha de 14 días consecutivos.",
        descripcionSecreta: "",
        tipo: "Racha",
        rareza: "Épico",
        imagen: "🌟",
        xpBonus: 700,
        secreto: false,
        activo: true,
        obtenidos: 45,
        condiciones: [
          { tipo: "racha_dias", label: "Racha consecutiva", icon: "🔥", cantidad: 14, unidad: "días" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "700 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Guardián Dorado" }
        ],
        creadoEn: "2025-01-25T00:00:00.000Z",
      },
      {
        nombre: "Inquebrantable",
        descripcion: "Mantén una racha de 60 días sin interrupciones.",
        descripcionSecreta: "",
        tipo: "Racha",
        rareza: "Legendario",
        imagen: "🛡️",
        xpBonus: 3000,
        secreto: false,
        activo: true,
        obtenidos: 7,
        condiciones: [
          { tipo: "racha_dias", label: "Racha consecutiva", icon: "🔥", cantidad: 60, unidad: "días" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "3000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Inmortal" },
          { tipo: "item", icon: "🛡️", label: "Objeto", valor: "Escudo de la Eternidad" }
        ],
        creadoEn: "2025-02-01T00:00:00.000Z",
      },

      // ── NIVEL ──────────────────────────────────────────────────
      {
        nombre: "Nivel 10",
        descripcion: "Alcanza el nivel 10 con tu personaje.",
        descripcionSecreta: "",
        tipo: "Nivel",
        rareza: "Raro",
        imagen: "⬆️",
        xpBonus: 300,
        secreto: false,
        activo: true,
        obtenidos: 234,
        condiciones: [
          { tipo: "nivel_alcanzado", label: "Nivel alcanzado", icon: "⬆️", cantidad: 10, unidad: "nivel" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "300 XP" }
        ],
        creadoEn: "2024-10-15T00:00:00.000Z",
      },
      {
        nombre: "Leyenda Viviente",
        descripcion: "Alcanza el nivel 50.",
        descripcionSecreta: "",
        tipo: "Nivel",
        rareza: "Legendario",
        imagen: "👑",
        xpBonus: 5000,
        secreto: false,
        activo: true,
        obtenidos: 3,
        condiciones: [
          { tipo: "nivel_alcanzado", label: "Nivel alcanzado", icon: "⬆️", cantidad: 50, unidad: "nivel" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "5000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Leyenda Viviente" },
          { tipo: "item", icon: "🎒", label: "Objeto", valor: "Orbe del Nivel" }
        ],
        creadoEn: "2024-11-05T00:00:00.000Z",
      },
      {
        nombre: "Millón de XP",
        descripcion: "Acumula 1,000,000 de XP total.",
        descripcionSecreta: "",
        tipo: "Nivel",
        rareza: "Legendario",
        imagen: "💎",
        xpBonus: 10000,
        secreto: false,
        activo: false,
        obtenidos: 1,
        condiciones: [
          { tipo: "xp_total", label: "XP acumulado total", icon: "⚡", cantidad: 1000000, unidad: "XP" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "10000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "El Elegido" }
        ],
        creadoEn: "2024-12-10T00:00:00.000Z",
      },
      {
        nombre: "Ascendido",
        descripcion: "Alcanza el nivel 25.",
        descripcionSecreta: "",
        tipo: "Nivel",
        rareza: "Épico",
        imagen: "🚀",
        xpBonus: 1000,
        secreto: false,
        activo: true,
        obtenidos: 67,
        condiciones: [
          { tipo: "nivel_alcanzado", label: "Nivel alcanzado", icon: "⬆️", cantidad: 25, unidad: "nivel" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "1000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Ascendido" }
        ],
        creadoEn: "2025-02-05T00:00:00.000Z",
      },
      {
        nombre: "Nivel Maestro",
        descripcion: "Alcanza el nivel 75.",
        descripcionSecreta: "",
        tipo: "Nivel",
        rareza: "Legendario",
        imagen: "🎓",
        xpBonus: 7500,
        secreto: false,
        activo: true,
        obtenidos: 2,
        condiciones: [
          { tipo: "nivel_alcanzado", label: "Nivel alcanzado", icon: "⬆️", cantidad: 75, unidad: "nivel" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "7500 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Maestro de Niveles" },
          { tipo: "item", icon: "📚", label: "Objeto", valor: "Grimorio del Conocimiento" }
        ],
        creadoEn: "2025-02-10T00:00:00.000Z",
      },

      // ── SOCIAL ─────────────────────────────────────────────────
      {
        nombre: "Perfil Completo",
        descripcion: "Completa todos los campos de tu perfil de héroe.",
        descripcionSecreta: "",
        tipo: "Social",
        rareza: "Común",
        imagen: "👤",
        xpBonus: 100,
        secreto: false,
        activo: true,
        obtenidos: 567,
        condiciones: [
          { tipo: "perfil_completo", label: "Perfil completado", icon: "👤", cantidad: 1, unidad: "veces" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "100 XP" }
        ],
        creadoEn: "2024-12-01T00:00:00.000Z",
      },
      {
        nombre: "Comunidad Activa",
        descripcion: "Comparte 10 publicaciones en la comunidad.",
        descripcionSecreta: "",
        tipo: "Social",
        rareza: "Raro",
        imagen: "📢",
        xpBonus: 150,
        secreto: false,
        activo: true,
        obtenidos: 234,
        condiciones: [
          { tipo: "publicaciones", label: "Publicaciones compartidas", icon: "📢", cantidad: 10, unidad: "publicaciones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "150 XP" }
        ],
        creadoEn: "2025-02-15T00:00:00.000Z",
      },
      {
        nombre: "Amigo de Todos",
        descripcion: "Haz 50 amigos en la plataforma.",
        descripcionSecreta: "",
        tipo: "Social",
        rareza: "Épico",
        imagen: "👥",
        xpBonus: 500,
        secreto: false,
        activo: true,
        obtenidos: 89,
        condiciones: [
          { tipo: "amigos_total", label: "Amigos agregados", icon: "👥", cantidad: 50, unidad: "amigos" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "500 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Embajador Social" }
        ],
        creadoEn: "2025-02-20T00:00:00.000Z",
      },

      // ── SECRETOS ───────────────────────────────────────────────
      {
        nombre: "??? Misterio ???",
        descripcion: "Condición oculta.",
        descripcionSecreta: "Completa 100 sesiones de HIIT a máxima intensidad.",
        tipo: "Secreto",
        rareza: "Legendario",
        imagen: "❓",
        xpBonus: 1000,
        secreto: true,
        activo: true,
        obtenidos: 5,
        condiciones: [
          { tipo: "ejercicio_tipo", label: "Sesiones de tipo fuerza", icon: "💪", cantidad: 100, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "1000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Sombra del Abismo" }
        ],
        creadoEn: "2024-11-01T00:00:00.000Z",
      },
      {
        nombre: "El Susurro del Viento",
        descripcion: "??? Misterio oculto ???",
        descripcionSecreta: "Completa 10 sesiones de cardio al amanecer.",
        tipo: "Secreto",
        rareza: "Legendario",
        imagen: "🌅",
        xpBonus: 1500,
        secreto: true,
        activo: true,
        obtenidos: 3,
        condiciones: [
          { tipo: "cardio_amanecer", label: "Sesiones al amanecer", icon: "🌅", cantidad: 10, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "1500 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Susurro del Alba" },
          { tipo: "item", icon: "🌟", label: "Objeto", valor: "Aura Matutina" }
        ],
        creadoEn: "2025-03-05T00:00:00.000Z",
      },
      {
        nombre: "Arquitecto del Cambio",
        descripcion: "??? Misterio oculto ???",
        descripcionSecreta: "Cambia tu rutina de ejercicios 5 veces diferentes.",
        tipo: "Secreto",
        rareza: "Épico",
        imagen: "🔄",
        xpBonus: 800,
        secreto: true,
        activo: true,
        obtenidos: 12,
        condiciones: [
          { tipo: "rutinas_cambiadas", label: "Rutinas cambiadas", icon: "🔄", cantidad: 5, unidad: "cambios" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "800 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Arquitecto del Cambio" }
        ],
        creadoEn: "2025-03-10T00:00:00.000Z",
      },
      {
        nombre: "Coleccionista de Estrellas",
        descripcion: "??? Misterio oculto ???",
        descripcionSecreta: "Obtén 25 logros diferentes.",
        tipo: "Secreto",
        rareza: "Legendario",
        imagen: "⭐",
        xpBonus: 2000,
        secreto: true,
        activo: true,
        obtenidos: 1,
        condiciones: [
          { tipo: "logros_obtenidos", label: "Logros obtenidos", icon: "🏆", cantidad: 25, unidad: "logros" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "2000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Coleccionista Estelar" },
          { tipo: "item", icon: "🌌", label: "Objeto", valor: "Galaxia Personal" }
        ],
        creadoEn: "2025-03-15T00:00:00.000Z",
      },
    ];

    // Agregar logros
    console.log(`📝 Agregando ${logros.length} logros a Firebase...`);
    let contador = 0;
    for (const logro of logros) {
      try {
        await logrosRef.add(logro);
        contador++;
        if (contador % 5 === 0) {
          console.log(`  ✅ ${contador} logros agregados...`);
        }
      } catch (error) {
        console.error(`❌ Error agregando logro "${logro.nombre}":`, error);
      }
    }

    console.log(`✅ ${contador} logros creados exitosamente de ${logros.length} totales`);
    console.log("🏆 Seed de logros completado!");

  } catch (error) {
    console.error("❌ Error en seed de logros:", error);
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Ejecutando seeder directamente...");
  seedLogros();
}

export default seedLogros;
        obtenidos: 1,
        condiciones: [
          { tipo: "test_condition", label: "Condición de prueba", icon: "🧪", cantidad: 1, unidad: "test" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "100 XP" }
        ],
        creadoEn: "2024-10-01T00:00:00.000Z",
      },
    ];

    // Agregar logros
    console.log(`📝 Agregando ${logros.length} logros a Firebase...`);
    let contador = 0;
    for (const logro of logros) {
      try {
        await logrosRef.add(logro);
        contador++;
        if (contador % 5 === 0) {
          console.log(`  ✅ ${contador} logros agregados...`);
        }
      } catch (error) {
        console.error(`❌ Error agregando logro "${logro.nombre}":`, error);
      }
    }

    console.log(`✅ ${contador} logros creados exitosamente de ${logros.length} totales`);
    console.log("🏆 Seed de logros completado!");

  } catch (error) {
    console.error("❌ Error en seed de logros:", error);
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedLogros();
}

export default seedLogros;