// src/utils/profanityFilter.js
// ─────────────────────────────────────────────────────────────
//  Filtro cliente de lenguaje inapropiado.
//  Versión ligera para validación en tiempo real en el frontend.
//  La validación definitiva ocurre en el backend.
// ─────────────────────────────────────────────────────────────

const BLOCKED_TERMS = [
  // Español
  "puta","puto","putos","putas","putita","putito","putisima","putisimo",
  "reputa","hijueputa","hijaputa","malparido","malparida",
  "mierda","mierdas","cagada","cagado",
  "culo","culos","pene","penes","pinga","verga","vergas",
  "cono","coño","vagina","teta","tetas",
  "pendejo","pendeja","pendejos","pendejas",
  "idiota","imbecil","estupido","estupida",
  "cabron","cabrona","cabrones","cabrón",
  "joder","jodete","jodido","jodida",
  "chingada","chingado","chinga","chingar","pinche","pinches",
  "culero","culera","maricon","maricón","marica",
  "zorra","perra",
  "hdp","hjp",
  "gonorrea","huevon","huevona","mamahuevo",
  "pajero","pajera","paja",
  "masturbacion","masturbar","eyacular","corrida",
  "pedofilo","pedófilo",
  // Inglés
  "fuck","fucker","fucking","fucked",
  "shit","bullshit",
  "bitch","asshole","bastard",
  "cunt","dick","cock","pussy","whore","slut",
  "motherfucker","mofo",
  "nigger","nigga","faggot",
  "retard","wanker","twat",
  "porn","porno","rape","rapist","nazi","kys",
];

const LEET_MAP = {
  "4":"a","@":"a","á":"a","à":"a","â":"a","ä":"a",
  "3":"e","é":"e","è":"e","ê":"e","ë":"e",
  "1":"i","!":"i","í":"i","ì":"i","ï":"i",
  "0":"o","ó":"o","ò":"o","ô":"o","ö":"o",
  "5":"s","$":"s","7":"t",
  "ñ":"n","ü":"u","ú":"u","ù":"u","û":"u","ç":"c",
};

function normalize(text) {
  if (!text) return "";
  let t = text.toLowerCase();
  t = t.split("").map(c => LEET_MAP[c] ?? c).join("");
  t = t.replace(/[^a-z0-9\s]/g, "");
  t = t.replace(/(.)\1{2,}/g, "$1$1");
  return t.replace(/\s+/g, " ").trim();
}

function buildPattern(term) {
  const n = normalize(term);
  const p = n.split("").join("[\\s\\-_\\.\\*]*");
  return new RegExp(`(?<![a-z0-9])${p}(?![a-z0-9])`, "i");
}

const PATTERNS = [...new Set(BLOCKED_TERMS)].map(term => ({
  term,
  re: buildPattern(term),
}));

/**
 * Retorna true si el texto contiene lenguaje inapropiado.
 * @param {string} text
 * @returns {boolean}
 */
export function hasProfanity(text) {
  if (!text) return false;
  const normalized = normalize(text);
  return PATTERNS.some(({ re }) => re.test(normalized));
}

/**
 * Retorna un mensaje de error si hay groserías, o null si está limpio.
 * @param {string} text
 * @param {string} fieldLabel  Nombre amigable del campo
 * @returns {string|null}
 */
export function validateClean(text, fieldLabel = "campo") {
  if (!text) return null;
  if (hasProfanity(text)) {
    return `El ${fieldLabel} contiene lenguaje inapropiado. Por favor utiliza un lenguaje respetuoso.`;
  }
  return null;
}
