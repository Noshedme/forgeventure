// src/services/email.service.js
import transporter from "../config/email.js";
import dotenv from "dotenv";
dotenv.config();

const FROM = process.env.MAIL_FROM;
const APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Paleta ─────────────────────────────────────────────────────
const C = {
  bg:       "#060D1A",
  bgCard:   "#0D1B2E",
  bgPanel:  "#0A1628",
  navy:     "#1E3A5F",
  orange:   "#E85D04",
  orangeL:  "#FF9F1C",
  gold:     "#FFD700",
  blue:     "#4CC9F0",
  white:    "#F0F4FF",
  muted:    "#6B8CAE",
  error:    "#E74C3C",
  success:  "#2ecc71",
};

const classEmoji = { GUERRERO: "⚔️", ARQUERO: "🏃", MAGO: "🧘" };
const classColor = { GUERRERO: C.orange, ARQUERO: C.blue, MAGO: "#9B59B6" };
const classBonus = {
  GUERRERO: "+25% XP en fuerza",
  ARQUERO:  "+25% XP en cardio",
  MAGO:     "+25% XP en flexibilidad",
};

// ── Base layout ────────────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ForgeVenture</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};min-height:100vh;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="560" cellpadding="0" cellspacing="0" border="0"
        style="max-width:560px;width:100%;background:${C.bgCard};border-radius:12px;overflow:hidden;
               box-shadow:0 0 60px rgba(232,93,4,0.15),0 24px 80px rgba(0,0,0,0.6);
               border:1px solid ${C.navy};">

        ${body}

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid ${C.navy};background:${C.bgPanel};text-align:center;">
            <p style="margin:0 0 6px;color:${C.muted};font-size:11px;letter-spacing:0.5px;">
              © 2025 <strong style="color:${C.orange};">FORGEVENTURE</strong> · Tu aventura fitness en modo RPG
            </p>
            <p style="margin:0;color:${C.navy};font-size:11px;">
              Forja tu leyenda, un rep a la vez.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Shared: Header con logo ────────────────────────────────────
const header = (subtitle = "") => `
<tr>
  <td style="background:linear-gradient(160deg,${C.bgPanel} 0%,${C.bg} 100%);
             padding:36px 40px 28px;text-align:center;
             border-bottom:2px solid ${C.orange};
             position:relative;">

    <!-- Glow detrás del logo -->
    <div style="display:inline-block;position:relative;">
      <div style="font-size:36px;line-height:1;margin-bottom:10px;
                  filter:drop-shadow(0 0 12px ${C.orange});">⚔️</div>
      <div style="margin-bottom:4px;">
        <span style="font-size:24px;font-weight:900;color:${C.orange};
                     letter-spacing:5px;text-shadow:0 0 20px ${C.orange}88;">FORGE</span>
        <span style="font-size:24px;font-weight:900;color:${C.white};
                     letter-spacing:5px;">VENTURE</span>
      </div>
      ${subtitle ? `<p style="margin:8px 0 0;color:${C.muted};font-size:12px;letter-spacing:2px;text-transform:uppercase;">${subtitle}</p>` : ""}
    </div>

    <!-- Línea decorativa -->
    <div style="width:80px;height:2px;background:linear-gradient(90deg,transparent,${C.orange},transparent);
                margin:16px auto 0;box-shadow:0 0 8px ${C.orange}66;"></div>
  </td>
</tr>`;

// ── Shared: Stat box ───────────────────────────────────────────
const statBox = (label, value, color = C.orange) => `
<td style="width:30%;text-align:center;padding:14px 8px;
           background:${C.bgPanel};border:1px solid ${C.navy};border-radius:6px;">
  <div style="font-size:22px;font-weight:900;color:${color};
              text-shadow:0 0 10px ${color}66;margin-bottom:4px;">${value}</div>
  <div style="font-size:10px;color:${C.muted};letter-spacing:2px;
              text-transform:uppercase;">${label}</div>
</td>`;

// ── Shared: XP Bar ─────────────────────────────────────────────
const xpBar = (label, pct, color = C.orange) => `
<div style="margin-bottom:10px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-size:11px;color:${C.muted};letter-spacing:1px;">${label}</td>
      <td align="right" style="font-size:10px;color:${color};font-weight:700;">${pct}%</td>
    </tr>
  </table>
  <div style="height:6px;background:${C.bgPanel};border:1px solid ${color}33;
              border-radius:3px;overflow:hidden;margin-top:4px;">
    <div style="height:100%;width:${pct}%;
                background:linear-gradient(90deg,${color}88,${color});
                box-shadow:0 0 6px ${color}66;border-radius:3px;"></div>
  </div>
</div>`;

// ── Shared: Feature row ────────────────────────────────────────
const featureRow = (icon, text, sub) => `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${C.navy}22;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:36px;vertical-align:middle;">
          <div style="width:32px;height:32px;background:${C.orange}11;border:1px solid ${C.orange}33;
                      border-radius:6px;text-align:center;line-height:32px;font-size:15px;">${icon}</div>
        </td>
        <td style="padding-left:12px;vertical-align:middle;">
          <div style="font-size:13px;font-weight:600;color:${C.white};">${text}</div>
          ${sub ? `<div style="font-size:11px;color:${C.muted};margin-top:1px;">${sub}</div>` : ""}
        </td>
      </tr>
    </table>
  </td>
</tr>`;

// ══════════════════════════════════════════════════════════════
// 1. EMAIL DE BIENVENIDA
// ══════════════════════════════════════════════════════════════
export const sendWelcomeEmail = async (to, username, heroClass) => {
  const emoji = classEmoji[heroClass] || "⚔️";
  const color = classColor[heroClass] || C.orange;
  const bonus = classBonus[heroClass] || "";

  const body = `
    ${header("Bienvenido al juego")}

    <!-- Hero greeting -->
    <tr>
      <td style="padding:36px 40px 0;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:${C.white};line-height:1.2;">
          ¡Bienvenido,<br/>
          <span style="color:${C.orange};text-shadow:0 0 16px ${C.orange}66;">${username}</span>!
        </h1>
        <p style="margin:0;font-size:14px;color:${C.muted};line-height:1.6;">
          Tu héroe ha sido creado. La aventura comienza ahora.
        </p>
      </td>
    </tr>

    <!-- Clase card -->
    <tr>
      <td style="padding:28px 40px 0;">
        <div style="background:linear-gradient(135deg,${color}0D,${C.bgPanel});
                    border:1px solid ${color}55;border-radius:10px;padding:24px;
                    text-align:center;box-shadow:0 0 30px ${color}22;">

          <!-- Emoji clase -->
          <div style="font-size:48px;line-height:1;margin-bottom:10px;
                      filter:drop-shadow(0 0 16px ${color});">${emoji}</div>

          <!-- Badge -->
          <div style="display:inline-block;background:${color}22;border:1px solid ${color}66;
                      border-radius:4px;padding:3px 12px;margin-bottom:10px;">
            <span style="font-size:10px;font-weight:700;color:${color};
                         letter-spacing:3px;text-transform:uppercase;">CLASE ELEGIDA</span>
          </div>

          <!-- Nombre clase -->
          <div style="font-size:28px;font-weight:900;color:${color};
                      letter-spacing:4px;text-shadow:0 0 20px ${color}55;
                      margin-bottom:6px;">${heroClass}</div>

          <!-- Bonus -->
          <div style="font-size:13px;color:${C.white};opacity:0.8;">
            ⚡ <strong>${bonus}</strong> activo desde el día 1
          </div>
        </div>
      </td>
    </tr>

    <!-- Stats iniciales -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${statBox("Nivel", "1", C.orange)}
            <td style="width:5%;"></td>
            ${statBox("XP", "0", C.orangeL)}
            <td style="width:5%;"></td>
            ${statBox("HP", "100", C.success)}
          </tr>
        </table>
      </td>
    </tr>

    <!-- XP Bars decorativas -->
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="background:${C.bgPanel};border:1px solid ${C.navy};
                    border-radius:8px;padding:18px 20px;">
          <div style="font-size:10px;color:${C.muted};letter-spacing:2px;
                      margin-bottom:12px;">TUS STATS INICIALES</div>
          ${xpBar("FUERZA", 10, C.orange)}
          ${xpBar("VELOCIDAD", 10, C.blue)}
          ${xpBar("MAGIA", 10, "#9B59B6")}
        </div>
      </td>
    </tr>

    <!-- Qué puedes hacer -->
    <tr>
      <td style="padding:24px 40px 0;">
        <div style="font-size:10px;color:${C.muted};letter-spacing:2px;
                    margin-bottom:12px;">LO QUE TE ESPERA</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${featureRow("🏋️", "Entrena y gana XP real", "Cada ejercicio completado suma experiencia a tu héroe")}
          ${featureRow("⬆️", "Sube de nivel", "Desbloquea habilidades y mejora tus estadísticas")}
          ${featureRow("🏆", "+30 logros desbloqueables", "Completa retos y colecciona insignias épicas")}
          ${featureRow("🤖", "Forge AI — tu entrenador", "Inteligencia artificial que adapta tu entrenamiento")}
          ${featureRow("🔥", "Rachas diarias", "Mantén tu racha y multiplica tus recompensas")}
        </table>
      </td>
    </tr>

    <!-- Mensaje motivacional -->
    <tr>
      <td style="padding:24px 40px 0;">
        <div style="background:${C.bgPanel};border-left:3px solid ${C.orange};
                    border-radius:0 6px 6px 0;padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:${C.white};line-height:1.7;font-style:italic;">
            "Cada repetición cuenta. Cada sesión es XP.
            <strong style="color:${C.orange};">Tu leyenda comienza hoy.</strong>"
          </p>
        </div>
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td style="padding:32px 40px;text-align:center;">
        <a href="${APP_URL}"
          style="display:inline-block;background:linear-gradient(135deg,${C.orange},${C.orangeL});
                 color:${C.bg};font-size:13px;font-weight:900;letter-spacing:3px;
                 padding:16px 40px;border-radius:6px;text-decoration:none;
                 box-shadow:0 4px 24px ${C.orange}66,0 0 60px ${C.orange}22;
                 text-transform:uppercase;">
          ⚔️ &nbsp; ENTRAR AL JUEGO
        </a>
        <p style="margin:16px 0 0;font-size:11px;color:${C.muted};">
          O visita <a href="${APP_URL}" style="color:${C.orange};text-decoration:none;">${APP_URL}</a>
        </p>
      </td>
    </tr>`;

  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `⚔️ ¡Bienvenido a ForgeVenture, ${username}! Tu héroe ${heroClass} te espera`,
    html:    wrap(body),
  });

  console.log(`✅ Email de bienvenida enviado a ${to}`);
};

// ══════════════════════════════════════════════════════════════
// 2. EMAIL DE CÓDIGO DE RECUPERACIÓN
// ══════════════════════════════════════════════════════════════
export const sendResetCodeEmail = async (to, username, code) => {
  // Separar dígitos para mostrarlos grandes
  const digits = code.split("").map(d =>
    `<td style="width:40px;height:52px;text-align:center;vertical-align:middle;
                background:${C.bgPanel};border:1px solid ${C.orange}55;border-radius:6px;
                font-size:28px;font-weight:900;color:${C.orange};
                text-shadow:0 0 16px ${C.orange}88;">${d}</td>
     <td style="width:6px;"></td>`
  ).join("");

  const body = `
    ${header("Recuperación de cuenta")}

    <!-- Greeting -->
    <tr>
      <td style="padding:36px 40px 0;text-align:center;">
        <div style="font-size:40px;margin-bottom:12px;">🔑</div>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${C.white};">
          Recupera tu acceso
        </h1>
        <p style="margin:0;font-size:14px;color:${C.muted};line-height:1.6;">
          Hola <strong style="color:${C.white};">${username}</strong>, recibimos una solicitud
          para restablecer la contraseña de tu cuenta.
        </p>
      </td>
    </tr>

    <!-- Código visual -->
    <tr>
      <td style="padding:28px 40px 0;">
        <div style="background:linear-gradient(135deg,${C.bgPanel},${C.bg});
                    border:2px solid ${C.orange}66;border-radius:12px;padding:28px;
                    text-align:center;box-shadow:0 0 40px ${C.orange}22,inset 0 0 40px ${C.bg}88;">

          <div style="font-size:10px;color:${C.muted};letter-spacing:3px;margin-bottom:18px;">
            TU CÓDIGO DE VERIFICACIÓN
          </div>

          <!-- Dígitos separados -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
            <tr>${digits}</tr>
          </table>

          <!-- Timer -->
          <div style="display:inline-block;background:${C.orange}11;border:1px solid ${C.orange}33;
                      border-radius:20px;padding:6px 16px;">
            <span style="font-size:12px;color:${C.orangeL};">
              ⏱ &nbsp; Válido por <strong>15 minutos</strong>
            </span>
          </div>
        </div>
      </td>
    </tr>

    <!-- Instrucciones -->
    <tr>
      <td style="padding:24px 40px 0;">
        <div style="background:${C.bgPanel};border:1px solid ${C.navy};
                    border-radius:8px;padding:20px 24px;">
          <div style="font-size:10px;color:${C.muted};letter-spacing:2px;margin-bottom:14px;">
            CÓMO RECUPERAR TU CUENTA
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:26px;vertical-align:top;">
                      <div style="width:22px;height:22px;background:${C.orange};border-radius:50%;
                                  text-align:center;line-height:22px;font-size:11px;
                                  font-weight:900;color:${C.bg};">1</div>
                    </td>
                    <td style="padding-left:10px;font-size:13px;color:${C.white};vertical-align:middle;">
                      Abre la app y haz clic en <strong style="color:${C.orange};">"¿Olvidaste tu contraseña?"</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:26px;vertical-align:top;">
                      <div style="width:22px;height:22px;background:${C.orange};border-radius:50%;
                                  text-align:center;line-height:22px;font-size:11px;
                                  font-weight:900;color:${C.bg};">2</div>
                    </td>
                    <td style="padding-left:10px;font-size:13px;color:${C.white};vertical-align:middle;">
                      Ingresa el código de <strong style="color:${C.orange};">6 dígitos</strong> que aparece arriba
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:26px;vertical-align:top;">
                      <div style="width:22px;height:22px;background:${C.orange};border-radius:50%;
                                  text-align:center;line-height:22px;font-size:11px;
                                  font-weight:900;color:${C.bg};">3</div>
                    </td>
                    <td style="padding-left:10px;font-size:13px;color:${C.white};vertical-align:middle;">
                      Escribe tu <strong style="color:${C.orange};">nueva contraseña</strong> y confirma
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Aviso de seguridad -->
    <tr>
      <td style="padding:20px 40px 0;">
        <div style="background:${C.error}0D;border:1px solid ${C.error}33;
                    border-radius:6px;padding:14px 18px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;font-size:18px;padding-right:10px;">🔒</td>
              <td>
                <div style="font-size:12px;font-weight:700;color:${C.error};margin-bottom:3px;">
                  AVISO DE SEGURIDAD
                </div>
                <div style="font-size:12px;color:${C.muted};line-height:1.5;">
                  Si <strong style="color:${C.white};">no solicitaste</strong> este cambio, ignora este correo.
                  Tu cuenta permanece segura y este código expirará automáticamente.
                </div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:32px 40px;text-align:center;">
        <a href="${APP_URL}"
          style="display:inline-block;background:linear-gradient(135deg,${C.orange},${C.orangeL});
                 color:${C.bg};font-size:13px;font-weight:900;letter-spacing:3px;
                 padding:16px 40px;border-radius:6px;text-decoration:none;
                 box-shadow:0 4px 24px ${C.orange}66;text-transform:uppercase;">
          🔑 &nbsp; IR A LA APP
        </a>
      </td>
    </tr>`;

  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `🔑 Tu código de recuperación ForgeVenture: ${code}`,
    html:    wrap(body),
  });

  console.log(`✅ Email de recuperación enviado a ${to}`);
};