// src/routes/config.routes.js
// ─────────────────────────────────────────────────────────────
//  Rutas para configuración global de ForgeVenture.
//  Solo accesible para usuarios con rol 'admin'.
// ─────────────────────────────────────────────────────────────
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/checkRole.js";
import { db } from "../config/firebase.js";

const router = express.Router();

// ── Fuente única de verdad para valores por defecto ───────────
//  IMPORTANTE: si cambias un default aquí, refleja el cambio
//  en AdminConfig.jsx → INITIAL_CONFIG (fallback offline del FE).
//
//  Campos XP autoritativos: sección `xp`.
//  Sección `juego` NO duplica xpBase/xpPorNivel/maxNivel/
//  multiplicadorDia/bonusPrimerSesion/rachaMinDias/xpRachaBonus/
//  claseBonus — esos campos se leen siempre desde `xp`.
const DEFAULT_CONFIG = {
  general: {
    appNombre:       "ForgeVenture",
    appDesc:         "La aventura gamificada de tu cuerpo",
    appUrl:          "https://forgeventure.app",
    idioma:          "es",
    zonaHoraria:     "America/Guayaquil",
    mantenimiento:   false,
    registroAbierto: true,
    maxUsuarios:     5000,
    logoUrl:         "",
  },
  xp: {
    xpBase:            30,
    multiplicadorDia:  1.0,
    bonusPrimerSesion: 50,
    xpPorNivel:        1000,
    maxNivel:          99,
    xpRachaBonus:      10,
    rachaMinDias:      3,
    claseBonus:        25,
    xpDecayActivo:     false,
    xpDecayDias:       14,
    xpDecayPct:        5,
  },
  // juego solo contiene mecánicas propias (sin duplicar campos de xp)
  juego: {
    clasesDisponibles:       ["GUERRERO", "ARQUERO", "MAGO"],
    permitirCambioClase:     false,
    cambioClaseCosto:        500,
    rachasPorEjercicio:      false,
    rachasSemanales:         false,
    rachaSemanalRecompensa:  100,
    cooldownSesionMin:       60,
    timerMinutosDef:         20,
    verificacionCamara:      true,
    verificacionTimer:       true,
    modoHardcore:            false,
    hpMaximo:                100,
    hpRecuperacionDias:      1,
    hpPorNivel:              5,
    sistemaDanio:            false,
    danioPorFallo:           1,
    monedasPorEjercicio:     10,
    monedasPorNivel:         50,
    monedasPorRacha:         5,
    tiendaActiva:            true,
    inflacionControlada:     false,
    logrosActivos:           true,
    logrosSecretos:          false,
    recompensaLogro:         25,
    logrosTemporada:         false,
    leaderboardActivo:       false,
    misionesActivas:         true,
    misionesDiarias:         3,
    recompensaMisionDiaria:  15,
    misionesSemanales:       false,
    recompensaMisionSemanal: 100,
    chatbotActivo:           false,
    recomendacionesIA:       false,
    analisisForma:           false,
    planesIA:                false,
    eventosTemporada:        false,
    desafiosComunitarios:    false,
    torneosMensuales:        false,
    multiplicadorEventos:    1.5,
  },
  seguridad: {
    jwtExpiracion:          "7d",
    maxIntentos:            5,
    bloqueoMinutos:         15,
    emailVerificacion:      false,
    faActivo:               false,
    sessionTimeout:         60,
    apiRateLimit:           100,
    corsOrigins:            "http://localhost:5173",
    passwordMinLength:      8,
    passwordRequireUpper:   true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    enableAuthLogs:         true,
    enableConfigLogs:       true,
    enableSecurityAlerts:   false,
    logRetentionDays:       "90",
    enableAutoBackup:       false,
    backupFrequency:        "weekly",
    backupRetention:        10,
  },
  notificaciones: {
    emailBienvenida: true,
    emailReset:      true,
    emailLogro:      false,
    emailRacha:      false,
    emailSemanal:    false,
    pushActivo:      false,
    smtpHost:        "smtp.gmail.com",
    smtpPuerto:      587,
    smtpUser:        "",
    // smtpPass: Never stored here — use process.env.SMTP_PASS
    remitente:       "ForgeVenture ⚔️",
  },
};

// ── Claves permitidas por sección (allowlist de escritura) ────
//  Cualquier clave no listada aquí es ignorada silenciosamente.
//  Nota: smtpPass se maneja por separado (no está en la lista).
const VALID_KEYS = {
  general: [
    "appNombre", "appDesc", "appUrl", "idioma", "zonaHoraria",
    "mantenimiento", "registroAbierto", "maxUsuarios", "logoUrl",
  ],
  xp: [
    "xpBase", "multiplicadorDia", "bonusPrimerSesion",
    "xpPorNivel", "maxNivel", "xpRachaBonus", "rachaMinDias",
    "claseBonus", "xpDecayActivo", "xpDecayDias", "xpDecayPct",
  ],
  juego: [
    // Clases
    "clasesDisponibles", "permitirCambioClase", "cambioClaseCosto",
    // Rachas (solo mecánica — XP de rachas vive en sección `xp`)
    "rachasPorEjercicio", "rachasSemanales", "rachaSemanalRecompensa",
    // Sesión
    "cooldownSesionMin", "timerMinutosDef",
    "verificacionCamara", "verificacionTimer", "modoHardcore",
    // HP
    "hpMaximo", "hpRecuperacionDias", "hpPorNivel", "sistemaDanio", "danioPorFallo",
    // Economía
    "monedasPorEjercicio", "monedasPorNivel", "monedasPorRacha",
    "tiendaActiva", "inflacionControlada",
    // Logros
    "logrosActivos", "logrosSecretos", "recompensaLogro", "logrosTemporada", "leaderboardActivo",
    // Misiones
    "misionesActivas", "misionesDiarias", "recompensaMisionDiaria",
    "misionesSemanales", "recompensaMisionSemanal",
    // IA
    "chatbotActivo", "recomendacionesIA", "analisisForma", "planesIA",
    // Eventos
    "eventosTemporada", "desafiosComunitarios", "torneosMensuales", "multiplicadorEventos",
  ],
  seguridad: [
    "jwtExpiracion", "maxIntentos", "bloqueoMinutos", "emailVerificacion",
    "faActivo", "sessionTimeout", "apiRateLimit", "corsOrigins",
    "passwordMinLength", "passwordRequireUpper", "passwordRequireNumbers", "passwordRequireSymbols",
    "enableAuthLogs", "enableConfigLogs", "enableSecurityAlerts", "logRetentionDays",
    "enableAutoBackup", "backupFrequency", "backupRetention",
  ],
  // smtpPass excluido: las credenciales SMTP pertenecen a variables de entorno.
  // Para cambiar la contraseña SMTP actualiza process.env.SMTP_PASS en el servidor.
  notificaciones: [
    "emailBienvenida", "emailReset", "emailLogro", "emailRacha", "emailSemanal",
    "pushActivo", "smtpHost", "smtpPuerto", "smtpUser", "remitente",
  ],
};

// ── GET / — Obtener configuración ─────────────────────────────
router.get("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const configDoc = await db.collection("config").doc("global").get();

    if (!configDoc.exists) {
      await db.collection("config").doc("global").set(DEFAULT_CONFIG);
      // smtpPass nunca se envía al cliente
      return res.json({ ok: true, config: DEFAULT_CONFIG });
    }

    const cfg = configDoc.data();

    // Enmascarar smtpPass: nunca se expone por la API.
    // El frontend recibe smtpPassSet (bool) para mostrar el estado.
    const smtpPassSet = Boolean(cfg.notificaciones?.smtpPass);
    const notificaciones = {
      ...DEFAULT_CONFIG.notificaciones,
      ...(cfg.notificaciones || {}),
      smtpPass:    "",       // siempre vacío en la respuesta
      smtpPassSet,           // true = hay contraseña guardada
    };

    return res.json({
      ok:     true,
      config: { ...cfg, notificaciones },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── PATCH / PUT /:section — Guardar configuración por sección ─
//  Usa dot-notation keys para actualizar campo a campo (no
//  reemplaza la sección completa, evitando pérdida de datos).
//  PUT se mantiene como alias para retrocompatibilidad con el FE.
const saveSection = async (req, res) => {
  try {
    const { section } = req.params;
    const raw = req.body;

    if (!VALID_KEYS[section]) {
      return res.status(400).json({ ok: false, message: "Sección inválida" });
    }

    // ── 3.2 Sanitización: solo claves conocidas ──────────────
    const sanitized = Object.fromEntries(
      Object.entries(raw).filter(([k]) => VALID_KEYS[section].includes(k))
    );

    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ ok: false, message: "Sin campos válidos para actualizar" });
    }

    // ── 3.3 smtpPass: actualización separada y explícita ─────
    //  Solo se escribe si viene en el body y es una cadena no vacía
    //  diferente al centinela. VALID_KEYS.notificaciones no incluye
    //  smtpPass, así que hay que gestionarlo aquí manualmente.
    if (section === "notificaciones" && typeof raw.smtpPass === "string" && raw.smtpPass.trim()) {
      sanitized.smtpPass = raw.smtpPass.trim();
    }

    // ── 3.1 Actualización campo a campo (dot-notation) ───────
    //  En lugar de: { [section]: fullObject }  ← borra campos no enviados
    //  Usamos: { "section.field1": v1, "section.field2": v2 }
    const flatUpdates = Object.fromEntries(
      Object.entries(sanitized).map(([k, v]) => [`${section}.${k}`, v])
    );

    await db.collection("config").doc("global").update(flatUpdates);

    // ── 3.4 Audit log ─────────────────────────────────────────
    await db.collection("config_audit").add({
      section,
      changedBy:  req.user.uid,
      changedAt:  new Date().toISOString(),
      diff:       sanitized,           // campos que cambiaron (sin smtpPass si está vacío)
    });

    res.json({ ok: true, message: "Configuración guardada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

router.patch("/:section", verifyToken, checkRole("admin"), saveSection);
router.put("/:section",   verifyToken, checkRole("admin"), saveSection); // alias retrocompatible

export default router;
