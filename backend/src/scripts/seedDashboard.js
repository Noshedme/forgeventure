// src/scripts/seedDashboard.js
// Script para inicializar colecciones del dashboard en Firebase
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(__dirname, "../../serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));
} catch (err) {
  console.error("❌ serviceAccountKey.json no encontrado");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function seedDashboard() {
  try {
    console.log("🌱 Inicializando colecciones del dashboard...");

    // 1. Ejercicios
    const exercises = [
      {
        nombre: "Flexiones",
        categoria: "Fuerza",
        musculos: ["Pecho", "Tríceps", "Hombros"],
        dificultad: "Principiante",
        series: 3,
        reps: 15,
        xpBase: 30,
        verificacion: "Cámara",
        activo: true,
        descripcion: "Ejercicio clásico de empuje",
        imagen: "💪",
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Sentadillas",
        categoria: "Fuerza",
        musculos: ["Piernas", "Glúteos"],
        dificultad: "Principiante",
        series: 4,
        reps: 12,
        xpBase: 35,
        verificacion: "Cámara",
        activo: true,
        descripcion: "Para el desarrollo del tren inferior",
        imagen: "🦵",
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Cardio Libre",
        categoria: "Cardio",
        musculos: ["Cuerpo completo"],
        dificultad: "Intermedio",
        duracion: 30,
        series: 1,
        xpBase: 60,
        verificacion: "Timer",
        activo: true,
        descripcion: "30 minutos de cardio continuo",
        imagen: "🏃",
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Dominadas",
        categoria: "Calistenia",
        musculos: ["Espalda", "Bíceps"],
        dificultad: "Avanzado",
        series: 3,
        reps: 8,
        xpBase: 55,
        verificacion: "Cámara",
        activo: true,
        descripcion: "Para la espalda y brazos",
        imagen: "🔝",
        creadoEn: new Date().toISOString(),
      },
    ];

    const exercisesRef = db.collection("exercises");
    for (const exercise of exercises) {
      await exercisesRef.add(exercise);
    }
    console.log("✅ " + exercises.length + " ejercicios creados");

    // 2. Rutinas
    const routines = [
      {
        nombre: "Rutina de Principiante",
        descripcion: "Perfecta para comenzar",
        categoria: "Fuerza",
        dificultad: "Principiante",
        ejercicios: ["Flexiones", "Sentadillas"],
        duracion: 30,
        xpBase: 100,
        activo: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "HIIT Explosivo",
        descripcion: "Entrena todo el cuerpo",
        categoria: "HIIT",
        dificultad: "Avanzado",
        ejercicios: ["Dominadas", "Cardio Libre"],
        duracion: 45,
        xpBase: 150,
        activo: true,
        creadoEn: new Date().toISOString(),
      },
    ];

    const routinesRef = db.collection("routines");
    for (const routine of routines) {
      await routinesRef.add(routine);
    }
    console.log("✅ " + routines.length + " rutinas creadas");

    // 3. Misiones
    const missions = [
      {
        nombre: "Misión Diaria",
        descripcion: "Completa un ejercicio hoy",
        tipo: "Diaria",
        objetivo: 1,
        recompensa: 50,
        activa: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Maestro del Cardio",
        descripcion: "Completa 5 sesiones de cardio",
        tipo: "Semanal",
        objetivo: 5,
        recompensa: 200,
        activa: true,
        creadoEn: new Date().toISOString(),
      },
    ];

    const missionsRef = db.collection("missions");
    for (const mission of missions) {
      await missionsRef.add(mission);
    }
    console.log("✅ " + missions.length + " misiones creadas");

    // 4. Objetos/Items
    const objects = [
      {
        nombre: "Mancuerna Mágica",
        descripcion: "+5% de XP en ejercicios",
        rarity: "Raro",
        precio: 500,
        activo: true,
        imagen: "🔱",
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Casco del Guerrero",
        descripcion: "+10% de defensa",
        rarity: "Épico",
        precio: 1500,
        activo: true,
        imagen: "⚔️",
        creadoEn: new Date().toISOString(),
      },
    ];

    const objectsRef = db.collection("objects");
    for (const obj of objects) {
      await objectsRef.add(obj);
    }
    console.log("✅ " + objects.length + " objetos creados");

    // 5. Logros
    const achievements = [
      {
        nombre: "Primer Pasito",
        descripcion: "Completa tu primer ejercicio",
        icon: "👣",
        puntos: 10,
        activo: true,
        creadoEn: new Date().toISOString(),
      },
      {
        nombre: "Guerrero Legendario",
        descripcion: "Alcanza nivel 20",
        icon: "👑",
        puntos: 100,
        activo: true,
        creadoEn: new Date().toISOString(),
      },
    ];

    const achievementsRef = db.collection("achievements");
    for (const achievement of achievements) {
      await achievementsRef.add(achievement);
    }
    console.log("✅ " + achievements.length + " logros creados");

    console.log("🎉 Dashboard inicializado con éxito");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inicializando dashboard:", err);
    process.exit(1);
  }
}

seedDashboard();
