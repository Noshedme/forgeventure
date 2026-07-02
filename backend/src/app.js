// src/app.js
// Punto de entrada del servidor Express

import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import net        from "net";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import configRoutes from "./routes/config.routes.js";
import ejerciciosRoutes from "./routes/ejercicios.routes.js";
import missionsRoutes from "./routes/missions.routes.js";
import objetosRoutes from "./routes/objetos.routes.js";
import logrosRoutes from "./routes/logros.routes.js";
import skinsRoutes    from "./routes/skins.routes.js";
import avatarsRoutes  from "./routes/avatars.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import chatRoutes     from "./routes/chat.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import menteRoutes    from "./routes/mente.routes.js";
import saludRoutes    from "./routes/salud.routes.js";
import skillsRoutes  from "./routes/skills.routes.js";
import titlesRoutes  from "./routes/titles.routes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4001;

// ── Middlewares globales ───────────────────────────────────────

// CORS — permite requests desde el frontend (soporta varios orígenes separados por coma en FRONTEND_URL,
// más los puertos comunes que Vite usa cuando el puerto principal ya está ocupado)
const allowedOrigins = new Set([
  ...(process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((o) => o.trim()),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));

// Parsear JSON en el body de los requests
app.use(express.json());

// ── Rutas ──────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);
app.use("/api/ejercicios", ejerciciosRoutes);
app.use("/api/missions", missionsRoutes);
app.use("/api/objetos", objetosRoutes);
app.use("/api/logros", logrosRoutes);
app.use("/api/skins",    skinsRoutes);
app.use("/api/avatars",  avatarsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/chat",     chatRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/mente",    menteRoutes);
app.use("/api/salud",    saludRoutes);
app.use("/api/skills",  skillsRoutes);
app.use("/api/titles",  titlesRoutes);

// ── Health check ───────────────────────────────────────────────
// Útil para verificar que el servidor está vivo
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "ForgeVenture API funcionando ⚔️" });
});

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, message: "Ruta no encontrada" });
});

// ── Buscar puerto libre y arrancar servidor ────────────────────
const getFreePort = (startPort, maxTry = 10) => {
  let current = startPort;
  return new Promise((resolve, reject) => {
    const check = () => {
      const server = net.createServer();
      server.once("error", (err) => {
        server.close();
        if (err.code === "EADDRINUSE") {
          if (current < startPort + maxTry) {
            current += 1;
            console.warn(`Puerto ${current - 1} ocupado, probando ${current}...`);
            check();
          } else {
            reject(new Error(`No hay puertos libres entre ${startPort} y ${startPort + maxTry}`));
          }
        } else {
          reject(err);
        }
      });
      server.once("listening", () => {
        server.close(() => resolve(current));
      });
      server.listen(current);
    };
    check();
  });
};

const startServer = async () => {
  try {
    const basePort = Number(process.env.PORT) || 4001;
    const port = await getFreePort(basePort, 20);

    const server = app.listen(port, () => {
      console.log(`⚔️  ForgeVenture API corriendo en http://localhost:${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`⚠️  Puerto ${port} ya en uso (EADDRINUSE), reinicia el proceso o cambia PORT en .env`);
      } else {
        console.error("Error del servidor:", err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("No se pudo iniciar el servidor:", err);
    process.exit(1);
  }
};

startServer();

export default app;
