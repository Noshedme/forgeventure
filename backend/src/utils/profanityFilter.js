// src/utils/profanityFilter.js
// ─────────────────────────────────────────────────────────────
//  Filtro de palabras obscenas/groserías para ForgeVenture.
//  Cubre español (principal) e inglés (secundario).
//  Detecta: escritura normal, leet speak, caracteres especiales
//  y letras repetidas (ej. "m4ldito", "p**a", "puuuta").
// ─────────────────────────────────────────────────────────────

// ── Lista de términos prohibidos ──────────────────────────────
// Almacenados en forma base normalizada (minúsculas, sin acentos)
// El sistema detecta variantes automáticamente.
const BLOCKED_TERMS = [
  // ── Insultos en español ───────────────────────────────────
  "puta", "puto", "putos", "putas", "putita", "putito",
  "putisima", "putisimo", "reputa", "hijueputa", "hijaputa",
  "malparido", "malparida", "malparidos",
  "mierda", "mierdas", "mierdero",
  "cagada", "cagado", "cagar", "cago",
  "culo", "culos", "culito",
  "pene", "penes", "pinga", "pingas", "verga", "vergas",
  "coño", "cono", "cona",
  "vagina", "vaginas",
  "teta", "tetas", "tetona",
  "culo", "nalgas", "nalgona",
  "pendejo", "pendeja", "pendejos", "pendejas",
  "idiota", "idiotas",
  "imbecil", "imbécil", "imbeciles",
  "estupido", "estupida", "estupidos", "estúpido", "estúpida",
  "cabron", "cabrona", "cabrones", "cabronas", "cabrón",
  "gilipolla", "gilipollas",
  "joder", "jodete", "jodido", "jodida",
  "hostia", "hostias",
  "mamada", "mamadas",
  "chingar", "chinga", "chingada", "chingado", "chingadera",
  "pinche", "pinches",
  "culero", "culera", "culeros",
  "maricon", "maricón", "maricons",
  "marica", "maricas",
  "putear", "puteando",
  "zorra", "zorras", "zorron",
  "perra", "perro", // insulto contextual
  "gilipollez",
  "subnormal",
  "imbecil",
  "retrasado", "retrasada", // insulto
  "mongolo", "mongola",
  "tarado", "tarada",
  "hdp", "hjp", "hp",   // abreviaciones
  "gonorrea",            // insulto colombiano
  "sapo", "sapa",        // insulto latam
  "huevon", "huevona", "huevones", "güevón",
  "mamahuevo", "mamaguevo",
  "cojonudo",
  "follar", "follando",
  "sexo", // solo si combinado — ver contexto
  "orgasmo",
  "masturbacion", "masturbar", "masturbarse",
  "eyacular", "eyaculacion",
  "correrse", "corrida",
  "pajero", "pajera", "pajear", "paja",
  "putrefacto",
  "asco", // sólo en contexto de insulto

  // ── Términos de odio / discriminación ─────────────────────
  "negro", // solo como insulto — ver contexto
  "indio", // insulto
  "naco", "naca",
  "sudaca",
  "fascista",

  // ── Inglés ─────────────────────────────────────────────────
  "fuck", "fucker", "fucking", "fucked", "fuckoff",
  "shit", "shitty", "bullshit",
  "bitch", "bitches", "bitch",
  "asshole", "ass",
  "bastard", "bastards",
  "cunt", "cunts",
  "dick", "dicks", "dickhead",
  "cock", "cocks",
  "pussy", "pussies",
  "whore", "whores",
  "slut", "sluts",
  "motherfucker", "mofo",
  "nigger", "nigga",
  "faggot", "fag",
  "retard", "retarded",
  "idiot", "idiots",
  "stupid",
  "dumbass", "dumb",
  "jackass",
  "wanker",
  "twat",
  "porn", "porno",
  "rape", "rapist",
  "pedophile", "pedofilo", "pedófilo",
  "nazi", "nazismo",
  "kys", // kill yourself
];

// Deduplicar
const TERMS_SET = [...new Set(BLOCKED_TERMS)];

// ── Mapa leet speak / sustituciones comunes ───────────────────
const LEET_MAP = {
  "4": "a", "@": "a", "á": "a", "à": "a", "â": "a", "ä": "a",
  "3": "e", "é": "e", "è": "e", "ê": "e", "ë": "e",
  "1": "i", "!": "i", "í": "i", "ì": "i", "ï": "i",
  "0": "o", "ó": "o", "ò": "o", "ô": "o", "ö": "o",
  "5": "s", "$": "s",
  "7": "t",
  "ñ": "n",
  "ü": "u", "ú": "u", "ù": "u", "û": "u",
  "ç": "c",
};

// ── Normalizar texto para comparación ────────────────────────
function normalize(text) {
  if (!text) return "";
  let t = text.toLowerCase();

  // Reemplazar leet speak y caracteres especiales
  t = t.split("").map(c => LEET_MAP[c] ?? c).join("");

  // Eliminar caracteres que no son letras/números (guiones, puntos, *, etc.)
  // pero mantener espacios para detectar palabras separadas
  t = t.replace(/[^a-z0-9\s]/g, "");

  // Colapsar letras repetidas (puuuta → puta, fuuuck → fuck)
  t = t.replace(/(.)\1{2,}/g, "$1$1");

  // Normalizar espacios múltiples
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

// ── Construir expresiones regulares para cada término ─────────
// Permite hasta un espacio, punto o guion entre letras
function buildPattern(term) {
  const normalized = normalize(term);
  // Entre cada letra permite separadores opcionales
  const pattern = normalized.split("").join("[\\s\\-_\\.\\*]*");
  return new RegExp(`(?<![a-z0-9])${pattern}(?![a-z0-9])`, "i");
}

// Precalcular regexes
const PATTERNS = TERMS_SET.map(term => ({
  term,
  re: buildPattern(term),
}));

// ── Función principal: ¿contiene groserías? ───────────────────
/**
 * Verifica si un texto contiene lenguaje inapropiado.
 * @param {string} text
 * @returns {{ clean: boolean, found: string[] }}
 */
export function checkProfanity(text) {
  if (!text || typeof text !== "string") return { clean: true, found: [] };
  const normalized = normalize(text);
  const found = [];

  for (const { term, re } of PATTERNS) {
    if (re.test(normalized)) {
      found.push(term);
    }
  }

  return { clean: found.length === 0, found };
}

// ── Función: censurar texto (reemplaza con asteriscos) ────────
/**
 * Reemplaza las palabras prohibidas en el texto original con asteriscos.
 * @param {string} text
 * @returns {string}
 */
export function censorText(text) {
  if (!text || typeof text !== "string") return text;
  let result = text;

  for (const { term, re } of PATTERNS) {
    const normalized = normalize(result);
    if (re.test(normalized)) {
      // Buscar y reemplazar en el texto original preservando mayúsculas
      result = result.replace(
        new RegExp(term.split("").join("[\\s\\-_\\.\\*]*"), "gi"),
        m => "*".repeat(m.length)
      );
    }
  }
  return result;
}

// ── Función: validación + mensaje de error listo para usar ────
/**
 * Valida un campo y retorna un mensaje de error si tiene groserías.
 * @param {string} text
 * @param {string} fieldName  Nombre del campo para el mensaje
 * @returns {string|null}  null si está limpio, mensaje de error si no
 */
export function validateNoProfanity(text, fieldName = "campo") {
  const { clean, found } = checkProfanity(text);
  if (!clean) {
    return `El ${fieldName} contiene lenguaje inapropiado. Por favor utiliza un lenguaje respetuoso.`;
  }
  return null;
}

// ── Middleware Express reutilizable ────────────────────────────
/**
 * Middleware que valida campos específicos del body.
 * Uso: router.post("/ruta", profanityMiddleware(["username","bio"]), handler)
 * @param {string[]} fields  Campos del req.body a validar
 */
export function profanityMiddleware(fields = []) {
  return (req, res, next) => {
    for (const field of fields) {
      const value = req.body?.[field];
      if (!value || typeof value !== "string") continue;
      const error = validateNoProfanity(value, field);
      if (error) {
        return res.status(400).json({ ok: false, message: error, field });
      }
    }
    next();
  };
}
