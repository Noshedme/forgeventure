// src/config/email.js
// Transporter de Nodemailer usando Gmail

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,   // contraseña de aplicación, no tu contraseña normal
  },
});

// Verificar conexión al iniciar (solo en desarrollo)
transporter.verify((err) => {
  if (err) console.error("❌ Error de conexión con Gmail:", err.message);
  else     console.log("✅ Nodemailer conectado con Gmail");
});

export default transporter;