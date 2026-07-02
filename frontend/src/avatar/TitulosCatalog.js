// src/avatar/TitulosCatalog.js
// Catálogo de títulos: ganados por gameplay o comprables con monedas.
// El campo `nombre` es el valor que se guarda en Firestore (user.titulo).

export const TITULOS_CATALOG = [
  // ── Earned via gameplay (logros / misiones) ──────────────────────
  {
    id: "guardian_mental", nombre: "Guardián Mental",
    desc: "Concedido por mantener 7 días de bienestar mental consecutivos.",
    rareza: "Raro", color: "#4CC9F0", fuente: "ganado", precio: 0,
    hint: "Completa la misión de Zona Mente",
  },
  {
    id: "ser_fortalecido", nombre: "Ser Fortalecido",
    desc: "Otorgado al completar el test VIA de fortalezas personales.",
    rareza: "Poco común", color: "#4ADE80", fuente: "ganado", precio: 0,
    hint: "Completa el test de fortalezas VIA",
  },
  {
    id: "centinela_mental", nombre: "Centinela Mental",
    desc: "Por mantener vigilancia mental activa durante 14 días.",
    rareza: "Raro", color: "#818CF8", fuente: "ganado", precio: 0,
    hint: "Logro: Héroe del Bienestar",
  },
  {
    id: "guerrero_interior", nombre: "Guerrero Interior",
    desc: "Para los que vencen los obstáculos de su propia mente.",
    rareza: "Poco común", color: "#F97316", fuente: "ganado", precio: 0,
    hint: "Logro de bienestar mental",
  },
  {
    id: "mente_de_acero", nombre: "Mente de Acero",
    desc: "Forjado a través de disciplina y constancia extrema.",
    rareza: "Épico", color: "#9B5DE5", fuente: "ganado", precio: 0,
    hint: "Logro: Mente de Acero",
  },
  {
    id: "maestro_bienestar", nombre: "Maestro del Bienestar",
    desc: "Dominio completo de las 5 dimensiones PERMA.",
    rareza: "Épico", color: "#FFC857", fuente: "ganado", precio: 0,
    hint: "Logro: Maestro del Bienestar",
  },
  {
    id: "alma_indestructible", nombre: "Alma Indestructible",
    desc: "Solo los más resilientes alcanzan este nivel de fortaleza.",
    rareza: "Legendario", color: "#C9184A", fuente: "ganado", precio: 0,
    hint: "Logro: 60 días de bienestar continuo",
  },
  {
    id: "mente_indestructible", nombre: "Mente Indestructible",
    desc: "La racha de acero confirma tu mente imparable.",
    rareza: "Legendario", color: "#FF4D6D", fuente: "ganado", precio: 0,
    hint: "Misión: Racha de Acero",
  },

  // ── Purchasable with coins ───────────────────────────────────────
  {
    id: "iniciado", nombre: "El Iniciado",
    desc: "El comienzo de todo gran camino.",
    rareza: "Común", color: "#A08090", fuente: "compra", precio: 200,
  },
  {
    id: "forjado_en_hierro", nombre: "Forjado en Hierro",
    desc: "La perseverancia te moldea más duro que el hierro.",
    rareza: "Común", color: "#9CA3AF", fuente: "compra", precio: 400,
  },
  {
    id: "llama_eterna", nombre: "La Llama Eterna",
    desc: "Tu motivación nunca se apaga, sin importar el viento.",
    rareza: "Común", color: "#FF6B6B", fuente: "compra", precio: 600,
  },
  {
    id: "cazador_de_xp", nombre: "Cazador de XP",
    desc: "Siempre buscando la próxima recompensa, sin descanso.",
    rareza: "Poco común", color: "#4ADE80", fuente: "compra", precio: 1000,
  },
  {
    id: "sombra_veloz", nombre: "Sombra Veloz",
    desc: "Rapidez y precisión combinadas. Nadie te sigue el ritmo.",
    rareza: "Poco común", color: "#818CF8", fuente: "compra", precio: 1400,
  },
  {
    id: "forjador_leyendas", nombre: "Forjador de Leyendas",
    desc: "Cada entrenamiento es un ladrillo en tu leyenda personal.",
    rareza: "Raro", color: "#4CC9F0", fuente: "compra", precio: 2000,
  },
  {
    id: "titan_forjado", nombre: "Titán Forjado",
    desc: "El poder absoluto manifestado en cada repetición.",
    rareza: "Épico", color: "#F97316", fuente: "compra", precio: 3200,
  },
  {
    id: "elegido_del_forge", nombre: "Elegido del Forge",
    desc: "Reconocido por el propio ForgeVenture. Distinción máxima.",
    rareza: "Legendario", color: "#FFC857", fuente: "compra", precio: 5000,
  },
];

export const RAREZA_TITULO_COLOR = {
  "Común":      "#9CA3AF",
  "Poco común": "#4ADE80",
  "Raro":       "#4CC9F0",
  "Épico":      "#9B5DE5",
  "Legendario": "#FFC857",
};
