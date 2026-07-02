// src/scripts/seedObjetos.js
import { db } from "../config/firebase.js";

const seedObjetos = async () => {
  try {
    console.log("🌟 Iniciando seed de objetos...");

    // Limpiar colección existente
    const objetosRef = db.collection("objects");
    const snapshot = await objetosRef.get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("🧹 Colección 'objects' limpiada");

    // Objetos de ejemplo con estructura completa
    const objetos = [
      // ── POCIONES ──────────────────────────────────────────────
      {
        nombre: "Poción de XP Menor",
        descripcion: "Otorga 100 XP instantáneamente",
        categoria: "Poción",
        rareza: "Común",
        precio: 50,
        imagen: "🧪",
        activo: true,
        efectos: [
          { tipo: "xp_instant", valor: 100, duracion: null, descripcion: "Otorga 100 XP al usar" }
        ],
        obtener: ["Tienda", "Drop aleatorio"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Elixir de Fuerza",
        descripcion: "+20% XP en ejercicios de fuerza por 24 horas",
        categoria: "Poción",
        rareza: "Raro",
        precio: 300,
        imagen: "💪",
        activo: true,
        efectos: [
          { tipo: "xp_bonus", valor: 20, duracion: 24, descripcion: "+20% XP en fuerza" }
        ],
        obtener: ["Tienda", "Misión"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Poción Legendaria de Renacimiento",
        descripcion: "Restaura completamente HP y otorga inmunidad a racha por 7 días",
        categoria: "Poción",
        rareza: "Legendario",
        precio: 2500,
        imagen: "🌟",
        activo: true,
        efectos: [
          { tipo: "hp_recover", valor: 100, duracion: null, descripcion: "HP completo" },
          { tipo: "streak_shield", valor: 7, duracion: 7, descripcion: "Protege racha 7 días" }
        ],
        obtener: ["Evento", "Admin"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },

      // ── EQUIPO ─────────────────────────────────────────────────
      {
        nombre: "Espada del Guerrero",
        descripcion: "+15% XP en todas las actividades",
        categoria: "Equipo",
        rareza: "Épico",
        precio: 1500,
        imagen: "⚔️",
        activo: true,
        efectos: [
          { tipo: "xp_bonus", valor: 15, duracion: null, descripcion: "+15% XP global" }
        ],
        obtener: ["Tienda", "Logro"],
        usosMax: null,
        usosActuales: 0,
        stackable: false,
        equipable: true,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Escudo Protector",
        descripcion: "Protege la racha por 3 días",
        categoria: "Equipo",
        rareza: "Raro",
        precio: 800,
        imagen: "🛡️",
        activo: true,
        efectos: [
          { tipo: "streak_shield", valor: 3, duracion: null, descripcion: "Escudo de racha" }
        ],
        obtener: ["Tienda", "Misión"],
        usosMax: null,
        usosActuales: 0,
        stackable: false,
        equipable: true,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Armadura Legendaria",
        descripcion: "+25% XP y reduce cooldowns en 10%",
        categoria: "Equipo",
        rareza: "Legendario",
        precio: 3000,
        imagen: "👑",
        activo: true,
        efectos: [
          { tipo: "xp_bonus", valor: 25, duracion: null, descripcion: "+25% XP" },
          { tipo: "cooldown_red", valor: 10, duracion: null, descripcion: "-10% cooldown" }
        ],
        obtener: ["Evento", "Admin"],
        usosMax: null,
        usosActuales: 0,
        stackable: false,
        equipable: true,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },

      // ── COSMÉTICOS ────────────────────────────────────────────
      {
        nombre: "Skin Guerrero Dorado",
        descripcion: "Apariencia dorada para el guerrero",
        categoria: "Cosmético",
        rareza: "Épico",
        precio: 1200,
        imagen: "👑",
        activo: true,
        efectos: [
          { tipo: "cosmetic_skin", valor: "guerrero_dorado", duracion: null, descripcion: "Skin dorada" }
        ],
        obtener: ["Tienda", "Evento"],
        usosMax: null,
        usosActuales: 0,
        stackable: false,
        equipable: true,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Efecto Partículas Estelares",
        descripcion: "Partículas brillantes al caminar",
        categoria: "Cosmético",
        rareza: "Raro",
        precio: 600,
        imagen: "✨",
        activo: true,
        efectos: [
          { tipo: "cosmetic_skin", valor: "particulas_estelares", duracion: null, descripcion: "Efecto visual" }
        ],
        obtener: ["Tienda", "Racha"],
        usosMax: null,
        usosActuales: 0,
        stackable: false,
        equipable: true,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Título Maestro del Fuego",
        descripcion: "Título especial para maestros del cardio",
        categoria: "Cosmético",
        rareza: "Legendario",
        precio: 2000,
        imagen: "🔥",
        activo: true,
        efectos: [
          { tipo: "title_grant", valor: "Maestro del Fuego", duracion: null, descripcion: "Título especial" }
        ],
        obtener: ["Logro", "Admin"],
        usosMax: null,
        usosActuales: 0,
        stackable: false,
        equipable: true,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },

      // ── CONSUMIBLES ───────────────────────────────────────────
      {
        nombre: "Boost XP 2x",
        descripcion: "Duplica XP ganado por 1 hora",
        categoria: "Consumible",
        rareza: "Poco común",
        precio: 200,
        imagen: "⚡",
        activo: true,
        efectos: [
          { tipo: "xp_mult", valor: 2, duracion: 1, descripcion: "2x XP por 1 hora" }
        ],
        obtener: ["Tienda", "Drop aleatorio"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Multiplicador Legendario",
        descripcion: "5x XP por 30 minutos",
        categoria: "Consumible",
        rareza: "Legendario",
        precio: 1500,
        imagen: "💫",
        activo: true,
        efectos: [
          { tipo: "xp_mult", valor: 5, duracion: 0.5, descripcion: "5x XP por 30 min" }
        ],
        obtener: ["Evento", "Admin"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },

      // ── COLECCIONABLES ────────────────────────────────────────
      {
        nombre: "Gema del Dragón",
        descripcion: "Pieza de colección rara",
        categoria: "Coleccionable",
        rareza: "Épico",
        precio: 0,
        imagen: "💎",
        activo: true,
        efectos: [],
        obtener: ["Drop aleatorio", "Evento"],
        usosMax: null,
        usosActuales: 0,
        stackable: true,
        equipable: false,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Moneda Antigua",
        descripcion: "Moneda de colección del antiguo reino",
        categoria: "Coleccionable",
        rareza: "Raro",
        precio: 0,
        imagen: "🪙",
        activo: true,
        efectos: [],
        obtener: ["Drop aleatorio"],
        usosMax: null,
        usosActuales: 0,
        stackable: true,
        equipable: false,
        consumible: false,
        creadoEn: new Date().toISOString(),
      },

      // ── ESPECIALES ────────────────────────────────────────────
      {
        nombre: "Llave Maestra",
        descripcion: "Desbloquea clase especial Arquero",
        categoria: "Especial",
        rareza: "Mítico",
        precio: 0,
        imagen: "🔑",
        activo: true,
        efectos: [
          { tipo: "unlock_class", valor: "Arquero", duracion: null, descripcion: "Desbloquea clase" }
        ],
        obtener: ["Admin"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Cristal de Nivel",
        descripcion: "Sube 5 niveles instantáneamente",
        categoria: "Especial",
        rareza: "Mítico",
        precio: 0,
        imagen: "🔮",
        activo: true,
        efectos: [
          { tipo: "level_boost", valor: 5, duracion: null, descripcion: "+5 niveles" }
        ],
        obtener: ["Admin"],
        usosMax: 1,
        usosActuales: 0,
        stackable: false,
        equipable: false,
        consumible: true,
        creadoEn: new Date().toISOString(),
      },
    ];

    // Agregar objetos
    for (const objeto of objetos) {
      await objetosRef.add(objeto);
    }

    console.log(`✅ ${objetos.length} objetos creados exitosamente`);
    console.log("🎉 Seed de objetos completado!");

  } catch (error) {
    console.error("❌ Error en seed de objetos:", error);
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedObjetos();
}

export default seedObjetos;