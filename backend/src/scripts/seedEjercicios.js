// src/scripts/seedEjercicios.js
// ─────────────────────────────────────────────────────────────────────────────
// Script para poblar la colección de ejercicios con datos iniciales
// Ejecutar: npm run seed-ejercicios
// ─────────────────────────────────────────────────────────────────────────────

import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = resolve(__dirname, "../../serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.firestore();

// ══════════════════════════════════════════════════════════════════════════
// DATOS
// ══════════════════════════════════════════════════════════════════════════

const CATEGORIAS_DATA = [
  { id: "fuerza", nombre: "FUERZA", descripcion: "Ejercicios de resistencia y construcción muscular", icono: "💪", color: "#E85D04" },
  { id: "cardio", nombre: "CARDIO", descripcion: "Ejercicios cardiovasculares y resistencia", icono: "🏃", color: "#4CC9F0" },
  { id: "flexibilidad", nombre: "FLEXIBILIDAD", descripcion: "Estiramientos y mobilidad articular", icono: "🧘", color: "#0A9396" },
  { id: "hiit", nombre: "HIIT", descripcion: "Entrenamiento de alta intensidad por intervalos", icono: "⚡", color: "#E74C3C" },
  { id: "yoga", nombre: "YOGA", descripcion: "Yoga y meditación para bienestar integral", icono: "🙏", color: "#9B59B6" },
  { id: "pilates", nombre: "PILATES", descripcion: "Pilates para fortalecer el core", icono: "✨", color: "#FF69B4" },
  { id: "calistenia", nombre: "CALISTENIA", descripcion: "Ejercicios con peso corporal", icono: "🔝", color: "#FFD700" },
  { id: "funcional", nombre: "FUNCIONAL", descripcion: "Entrenamientos funcionales y movimientos", icono: "⚙️", color: "#2ecc71" },
];

const EJERCICIOS_DATA = [
  // FUERZA
  { nombre: "Flexiones", categoria: "fuerza", musculos: ["Pecho", "Tríceps", "Hombros"], dificultad: "Principiante", series: 3, reps: 15, duracion: null, xpBase: 30, verificacion: "Cámara", imagen: "💪" },
  { nombre: "Sentadillas", categoria: "fuerza", musculos: ["Piernas", "Glúteos"], dificultad: "Principiante", series: 4, reps: 12, duracion: null, xpBase: 35, verificacion: "Cámara", imagen: "🦵" },
  { nombre: "Dominadas", categoria: "fuerza", musculos: ["Espalda", "Bíceps"], dificultad: "Avanzado", series: 3, reps: 8, duracion: null, xpBase: 55, verificacion: "Cámara", imagen: "🔝" },
  { nombre: "Press Militar", categoria: "fuerza", musculos: ["Hombros", "Tríceps"], dificultad: "Intermedio", series: 4, reps: 10, duracion: null, xpBase: 45, verificacion: "Cámara", imagen: "🏋️" },
  { nombre: "Banco Plano", categoria: "fuerza", musculos: ["Pecho", "Hombros"], dificultad: "Intermedio", series: 4, reps: 10, duracion: null, xpBase: 50, verificacion: "Cámara", imagen: "💪" },
  { nombre: "Peso Muerto", categoria: "fuerza", musculos: ["Espalda", "Piernas"], dificultad: "Avanzado", series: 3, reps: 5, duracion: null, xpBase: 70, verificacion: "Cámara", imagen: "⚔️" },
  { nombre: "Fondos en Paralelas", categoria: "fuerza", musculos: ["Pecho", "Tríceps"], dificultad: "Avanzado", series: 3, reps: 12, duracion: null, xpBase: 55, verificacion: "Cámara", imagen: "💪" },
  // CARDIO
  { nombre: "Correr 5km", categoria: "cardio", musculos: ["Cuerpo completo"], dificultad: "Intermedio", series: 1, reps: null, duracion: 30, xpBase: 60, verificacion: "Timer", imagen: "🏃" },
  { nombre: "Saltar la Cuerda", categoria: "cardio", musculos: ["Pantorrillas", "Cuerpo completo"], dificultad: "Principiante", series: 3, reps: 50, duracion: null, xpBase: 40, verificacion: "Cámara", imagen: "🪀" },
  { nombre: "Ciclismo", categoria: "cardio", musculos: ["Piernas"], dificultad: "Intermedio", series: 1, reps: null, duracion: 45, xpBase: 70, verificacion: "Timer", imagen: "🚴" },
  { nombre: "Natación", categoria: "cardio", musculos: ["Cuerpo completo"], dificultad: "Intermedio", series: 1, reps: null, duracion: 30, xpBase: 65, verificacion: "Timer", imagen: "🏊" },
  // FLEXIBILIDAD
  { nombre: "Estiramiento Total", categoria: "flexibilidad", musculos: ["Cuerpo completo"], dificultad: "Principiante", series: 1, reps: null, duracion: 15, xpBase: 20, verificacion: "Timer", imagen: "🤸" },
  { nombre: "Splits", categoria: "flexibilidad", musculos: ["Piernas", "Cadera"], dificultad: "Avanzado", series: 1, reps: null, duracion: 10, xpBase: 40, verificacion: "Cámara", imagen: "🤸" },
  { nombre: "Rotaciones Escapulares", categoria: "flexibilidad", musculos: ["Hombros"], dificultad: "Principiante", series: 3, reps: 15, duracion: null, xpBase: 25, verificacion: "Timer", imagen: "⭕" },
  // HIIT
  { nombre: "HIIT Explosivo", categoria: "hiit", musculos: ["Cuerpo completo"], dificultad: "Avanzado", series: 6, reps: null, duracion: 20, xpBase: 90, verificacion: "Timer", imagen: "⚡" },
  { nombre: "Burpees", categoria: "hiit", musculos: ["Cuerpo completo"], dificultad: "Avanzado", series: 4, reps: 10, duracion: null, xpBase: 70, verificacion: "Cámara", imagen: "💥" },
  { nombre: "Mountain Climbers", categoria: "hiit", musculos: ["Abdomen", "Cardio"], dificultad: "Intermedio", series: 3, reps: 20, duracion: null, xpBase: 50, verificacion: "Cámara", imagen: "⛰️" },
  // YOGA
  { nombre: "Yoga Matutino", categoria: "yoga", musculos: ["Cuerpo completo"], dificultad: "Principiante", series: 1, reps: null, duracion: 20, xpBase: 45, verificacion: "Timer", imagen: "🧘" },
  { nombre: "Yoga Vinyasa", categoria: "yoga", musculos: ["Cuerpo completo"], dificultad: "Intermedio", series: 1, reps: null, duracion: 30, xpBase: 55, verificacion: "Timer", imagen: "🙏" },
  { nombre: "Yoga Restaurativo", categoria: "yoga", musculos: ["Cuerpo completo"], dificultad: "Principiante", series: 1, reps: null, duracion: 25, xpBase: 35, verificacion: "Timer", imagen: "😌" },
  // PILATES
  { nombre: "Pilates Core", categoria: "pilates", musculos: ["Abdomen", "Espalda"], dificultad: "Intermedio", series: 1, reps: null, duracion: 25, xpBase: 35, verificacion: "Timer", imagen: "🧘" },
  { nombre: "Pilates Avanzado", categoria: "pilates", musculos: ["Cuerpo completo"], dificultad: "Avanzado", series: 1, reps: null, duracion: 40, xpBase: 60, verificacion: "Timer", imagen: "✨" },
  // CALISTENIA
  { nombre: "Calistenia Básica", categoria: "calistenia", musculos: ["Cuerpo completo"], dificultad: "Intermedio", series: 4, reps: 10, duracion: null, xpBase: 50, verificacion: "Cámara", imagen: "🤸" },
  { nombre: "Handstand Holds", categoria: "calistenia", musculos: ["Hombros", "Core"], dificultad: "Avanzado", series: 3, reps: null, duracion: 5, xpBase: 65, verificacion: "Cámara", imagen: "🙃" },
  // FUNCIONAL
  { nombre: "Plancha", categoria: "funcional", musculos: ["Abdomen", "Hombros"], dificultad: "Intermedio", series: 3, reps: null, duracion: 1, xpBase: 40, verificacion: "Timer", imagen: "🏋️" },
  { nombre: "TRX Suspension", categoria: "funcional", musculos: ["Cuerpo completo"], dificultad: "Intermedio", series: 3, reps: 12, duracion: null, xpBase: 55, verificacion: "Cámara", imagen: "📋" },
];

const RUTINAS_DATA = [
  {
    nombre: "Guerrero del Hierro",
    descripcion: "Rutina de hipertrofia de 3 días para máximo crecimiento muscular. Enfocada en ejercicios compuestos.",
    categoria: "Fuerza",
    subcategoria: "Hipertrofia",
    dificultad: "Avanzado",
    duracionMin: 55,
    diasSemana: ["Lun", "Mié", "Vie"],
    objetivo: "Ganar músculo",
    xpTotal: 220,
    imagen: "⚔️",
    activo: true,
    pasos: [
      { nombre: "Plancha", imagen: "🏋️", series: 3, reps: null, duracion: 60, descanso: 30, verificacion: "Timer", xp: 40 },
      { nombre: "Flexiones", imagen: "💪", series: 4, reps: 15, duracion: null, descanso: 60, verificacion: "Cámara", xp: 30 },
      { nombre: "Press Militar", imagen: "🏋️", series: 4, reps: 10, duracion: null, descanso: 90, verificacion: "Cámara", xp: 45 },
      { nombre: "Sentadillas", imagen: "🦵", series: 4, reps: 12, duracion: null, descanso: 90, verificacion: "Cámara", xp: 35 },
      { nombre: "Dominadas", imagen: "🔝", series: 3, reps: 8, duracion: null, descanso: 90, verificacion: "Cámara", xp: 55 },
    ],
  },
  {
    nombre: "Sprint y Fuego",
    descripcion: "HIIT de alta intensidad para quema de grasa máxima. Intervalos explosivos que elevan el metabolismo.",
    categoria: "Cardio",
    subcategoria: "HIIT",
    dificultad: "Avanzado",
    duracionMin: 30,
    diasSemana: ["Mar", "Jue", "Sáb"],
    objetivo: "Perder peso",
    xpTotal: 310,
    imagen: "⚡",
    activo: true,
    pasos: [
      { nombre: "HIIT Explosivo", imagen: "⚡", series: 6, reps: null, duracion: 20, descanso: 10, verificacion: "Timer", xp: 90 },
      { nombre: "Burpees", imagen: "💥", series: 4, reps: 10, duracion: null, descanso: 30, verificacion: "Cámara", xp: 70 },
      { nombre: "Cardio Libre", imagen: "🏃", series: 1, reps: null, duracion: 10, descanso: 0, verificacion: "Timer", xp: 60 },
    ],
  },
  {
    nombre: "Alma Zen",
    descripcion: "Rutina de yoga para mejorar flexibilidad y calmar la mente. Perfecta para empezar o terminar el día.",
    categoria: "Flexibilidad",
    subcategoria: "Yoga",
    dificultad: "Principiante",
    duracionMin: 40,
    diasSemana: ["Lun", "Mié", "Vie", "Dom"],
    objetivo: "Mejorar flexibilidad",
    xpTotal: 130,
    imagen: "🧘",
    activo: true,
    pasos: [
      { nombre: "Yoga Matutino", imagen: "🧘", series: 1, reps: null, duracion: 20, descanso: 0, verificacion: "Timer", xp: 45 },
      { nombre: "Estiramiento", imagen: "🤸", series: 1, reps: null, duracion: 15, descanso: 0, verificacion: "Timer", xp: 20 },
      { nombre: "Pilates Core", imagen: "🧘", series: 1, reps: null, duracion: 5, descanso: 0, verificacion: "Timer", xp: 35 },
    ],
  },
  {
    nombre: "Calistenia Total",
    descripcion: "Rutina completa de calistenia usando solo el peso corporal. Sin equipo necesario.",
    categoria: "Fuerza",
    subcategoria: "Calistenia",
    dificultad: "Intermedio",
    duracionMin: 45,
    diasSemana: ["Mar", "Jue", "Sáb"],
    objetivo: "Tonificar",
    xpTotal: 185,
    imagen: "💪",
    activo: true,
    pasos: [
      { nombre: "Flexiones", imagen: "💪", series: 4, reps: 15, duracion: null, descanso: 60, verificacion: "Cámara", xp: 30 },
      { nombre: "Dominadas", imagen: "🔝", series: 3, reps: 8, duracion: null, descanso: 90, verificacion: "Cámara", xp: 55 },
      { nombre: "Fondos", imagen: "💪", series: 3, reps: 12, duracion: null, descanso: 60, verificacion: "Cámara", xp: 55 },
      { nombre: "Sentadillas", imagen: "🦵", series: 4, reps: 15, duracion: null, descanso: 60, verificacion: "Cámara", xp: 35 },
    ],
  },
  {
    nombre: "Cardio Matutino",
    descripcion: "Cardio suave para comenzar el día con energía y activar el metabolismo.",
    categoria: "Cardio",
    subcategoria: "Aeróbico",
    dificultad: "Principiante",
    duracionMin: 35,
    diasSemana: ["Lun", "Mié", "Vie"],
    objetivo: "Mejorar resistencia",
    xpTotal: 100,
    imagen: "🌅",
    activo: true,
    pasos: [
      { nombre: "Cardio Libre", imagen: "🏃", series: 1, reps: null, duracion: 30, descanso: 0, verificacion: "Timer", xp: 60 },
      { nombre: "Estiramiento", imagen: "🤸", series: 1, reps: null, duracion: 5, descanso: 0, verificacion: "Timer", xp: 20 },
    ],
  },
  {
    nombre: "Movilidad Diaria",
    descripcion: "Rutina diaria de movilidad articular. Solo 25 minutos para mejorar tu postura y reducir dolores.",
    categoria: "Flexibilidad",
    subcategoria: "Movilidad",
    dificultad: "Principiante",
    duracionMin: 25,
    diasSemana: ["Lun", "Mar", "Mié", "Jue", "Vie"],
    objetivo: "Mejorar postura",
    xpTotal: 80,
    imagen: "🤸",
    activo: true,
    pasos: [
      { nombre: "Estiramiento", imagen: "🤸", series: 1, reps: null, duracion: 15, descanso: 0, verificacion: "Timer", xp: 20 },
      { nombre: "Yoga Matutino", imagen: "🧘", series: 1, reps: null, duracion: 10, descanso: 0, verificacion: "Timer", xp: 45 },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════
// SEED
// ══════════════════════════════════════════════════════════════════════════

async function seed() {
  console.log("🌱 Sembrando ejercicios...\n");

  try {
    // Crear categorías
    console.log("📁 Creando categorías...");
    for (const cat of CATEGORIAS_DATA) {
      await db.collection("ejercicios").doc("categorias").collection("items").doc(cat.id).set({
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        icono: cat.icono,
        color: cat.color,
        activo: true,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      });
      console.log(`  ✓ ${cat.nombre}`);
    }

    // Crear ejercicios
    console.log("\n💪 Creando ejercicios...");
    const ejerciciosMap = {};
    for (const ej of EJERCICIOS_DATA) {
      const docRef = db.collection("ejercicios").doc("ejercicios").collection("items").doc();
      await docRef.set({
        nombre: ej.nombre,
        descripcion: `Ejercicio de ${ej.categoria}`,
        categoria: ej.categoria,
        musculos: ej.musculos,
        dificultad: ej.dificultad,
        series: ej.series,
        reps: ej.reps,
        duracion: ej.duracion,
        xpBase: ej.xpBase,
        verificacion: ej.verificacion,
        imagen: ej.imagen,
        rutinas: [],
        sesiones: 0,
        activo: true,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      });
      ejerciciosMap[ej.nombre] = docRef.id;
      console.log(`  ✓ ${ej.nombre}`);
    }

    // Crear rutinas
    console.log("\n📋 Creando rutinas...");
    for (const rut of RUTINAS_DATA) {
      await db.collection("ejercicios").doc("rutinas").collection("items").doc().set({
        nombre: rut.nombre,
        descripcion: rut.descripcion,
        categoria: rut.categoria,
        subcategoria: rut.subcategoria,
        dificultad: rut.dificultad,
        duracionMin: rut.duracionMin,
        diasSemana: rut.diasSemana,
        objetivo: rut.objetivo,
        xpTotal: rut.xpTotal,
        imagen: rut.imagen,
        pasos: rut.pasos,
        completadas: 0,
        completadaHoy: false,
        asignada: true,
        activo: rut.activo,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      });
      console.log(`  ✓ ${rut.nombre}`);
    }

    console.log("\n✅ Ejercicios sembrados correctamente\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();
