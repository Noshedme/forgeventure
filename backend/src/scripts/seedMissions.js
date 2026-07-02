// src/scripts/seedMissions.js
import { db } from "../config/firebase.js";

const seedMissions = async () => {
  try {
    console.log("🌟 Iniciando seed de misiones...");

    // Limpiar colección existente
    const missionsRef = db.collection("missions");
    const snapshot = await missionsRef.get();
    console.log(`🧹 Encontrados ${snapshot.docs.length} documentos existentes`);
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("🧹 Colección 'missions' limpiada");

    // Misiones de ejemplo con estructura completa
    const missions = [
      {
        titulo: "Guerrero Diario",
        tipo: "Diaria",
        dificultad: "Fácil",
        imagen: "⚔️",
        xpRecompensa: 150,
        activo: true,
        descripcion: "Completa tu rutina de fuerza del día.",
        requisitos: [
          { tipo: "completar_rutina", label: "Completar rutina", icon: "📋", cantidad: 1, unidad: "veces" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "150 XP" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Cardio Semanal",
        tipo: "Semanal",
        dificultad: "Normal",
        imagen: "🏃",
        xpRecompensa: 400,
        activo: true,
        descripcion: "Mantén 3 sesiones de cardio durante la semana.",
        requisitos: [
          { tipo: "sesiones_total", label: "Completar sesiones", icon: "🏃", cantidad: 3, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "400 XP" },
          { tipo: "badge", icon: "🏅", label: "Badge", valor: "Corredor Semanal" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Maestro del Fuego",
        tipo: "Desafío",
        dificultad: "Legendaria",
        imagen: "🔥",
        xpRecompensa: 2000,
        activo: true,
        descripcion: "Mantén una racha de 30 días consecutivos de entrenamiento.",
        requisitos: [
          { tipo: "racha_dias", label: "Mantener racha", icon: "🔥", cantidad: 30, unidad: "días" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "2000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Llama Eterna" },
          { tipo: "badge", icon: "🏅", label: "Badge", valor: "Maestro del Fuego" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Flex Maestro",
        tipo: "Semanal",
        dificultad: "Normal",
        imagen: "🧘",
        xpRecompensa: 350,
        activo: true,
        descripcion: "Completa 4 sesiones de flexibilidad o yoga esta semana.",
        requisitos: [
          { tipo: "flex_minutos", label: "Flexibilidad activa", icon: "🧘", cantidad: 60, unidad: "minutos" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "350 XP" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Festival de Primavera",
        tipo: "Evento",
        dificultad: "Difícil",
        imagen: "🌸",
        xpRecompensa: 800,
        activo: false,
        descripcion: "Evento especial de primavera: completa 10 sesiones en una semana.",
        requisitos: [
          { tipo: "sesiones_total", label: "Completar sesiones", icon: "🏃", cantidad: 10, unidad: "sesiones" },
          { tipo: "xp_ganado", label: "Ganar XP", icon: "⚡", cantidad: 2000, unidad: "XP" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "800 XP" },
          { tipo: "item", icon: "🎒", label: "Objeto", valor: "Armadura de Primavera" },
          { tipo: "badge", icon: "🏅", label: "Badge", valor: "Héroe Primaveral" }
        ],
        fechaInicio: "2025-03-20",
        fechaFin: "2025-03-31",
        limiteUsos: 500,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Primer Paso",
        tipo: "Diaria",
        dificultad: "Fácil",
        imagen: "🌟",
        xpRecompensa: 80,
        activo: true,
        descripcion: "Completa al menos 1 sesión de ejercicio hoy.",
        requisitos: [
          { tipo: "sesiones_total", label: "Completar sesiones", icon: "🏃", cantidad: 1, unidad: "sesiones" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "80 XP" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Leyenda del Hierro",
        tipo: "Desafío",
        dificultad: "Legendaria",
        imagen: "🏆",
        xpRecompensa: 5000,
        activo: true,
        descripcion: "Alcanza el nivel 50 y completa 500 sesiones de fuerza.",
        requisitos: [
          { tipo: "nivel_alcanzado", label: "Alcanzar nivel", icon: "⬆️", cantidad: 50, unidad: "nivel" },
          { tipo: "fuerza_reps", label: "Repeticiones de fuerza", icon: "🏋️", cantidad: 5000, unidad: "reps" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "5000 XP" },
          { tipo: "titulo", icon: "👑", label: "Título", valor: "Leyenda Viviente" },
          { tipo: "item", icon: "🎒", label: "Objeto", valor: "Espada Legendaria" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
      {
        titulo: "Cardio Diario",
        tipo: "Diaria",
        dificultad: "Normal",
        imagen: "🏃",
        xpRecompensa: 120,
        activo: true,
        descripcion: "30 minutos de cardio activo hoy.",
        requisitos: [
          { tipo: "cardio_minutos", label: "Cardio activo", icon: "⏱️", cantidad: 30, unidad: "minutos" }
        ],
        recompensas: [
          { tipo: "xp", icon: "⚡", label: "XP Bonus", valor: "120 XP" }
        ],
        fechaInicio: null,
        fechaFin: null,
        limiteUsos: null,
        completadas: 0,
        usosActuales: 0,
        creadoEn: new Date().toISOString(),
      },
    ];

    // Agregar misiones
    for (const mission of missions) {
      await missionsRef.add(mission);
    }

    console.log(`✅ ${missions.length} misiones creadas exitosamente`);
    console.log("🎉 Seed de misiones completado!");

  } catch (error) {
    console.error("❌ Error en seed de misiones:", error);
  }
};

// Ejecutar si se llama directamente
seedMissions();

export default seedMissions;