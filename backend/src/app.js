// src/app.js
// Punto de entrada del servidor Express

import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middlewares globales ───────────────────────────────────────

// CORS — solo permite requests desde el frontend
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// Parsear JSON en el body de los requests
app.use(express.json());

// ── Rutas ──────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Health check ───────────────────────────────────────────────
// Útil para verificar que el servidor está vivo
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "ForgeVenture API funcionando ⚔️" });
});

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, message: "Ruta no encontrada" });
});

// ── Iniciar servidor ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`⚔️  ForgeVenture API corriendo en http://localhost:${PORT}`);
});

export default app;