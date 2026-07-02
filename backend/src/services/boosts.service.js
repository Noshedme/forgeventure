// src/services/boosts.service.js
// ─────────────────────────────────────────────────────────────
//  Shared helper for applying active XP boosts stored on a user doc.
//  Called before finalising XP calculations in ejercicios, mente, missions.
//
//  Boost schema (stored at users/{uid}.activeBoosts.{type}):
//    { valor: Number, expiresAt: ISO-string }
//
//  Supported boost types:
//    xp_bonus  — additive percentage  e.g. valor=50 → +50% more XP
//    xp_mult   — multiplicative       e.g. valor=2  → ×2 XP
// ─────────────────────────────────────────────────────────────

/**
 * Applies active (non-expired) boosts to a base XP amount.
 *
 * @param {number}  xpBase    - Raw XP before boosts
 * @param {object}  userData  - Firestore user document data
 * @returns {{ xpFinal: number, boosted: boolean, log: string[] }}
 */
export function applyActiveBoosts(xpBase, userData) {
  const now     = Date.now();
  const boosts  = userData?.activeBoosts || {};
  let   xp      = xpBase;
  const log     = [];
  let   boosted = false;

  // 1. xp_bonus — additive percentage on top of base
  const bonus = boosts.xp_bonus;
  if (bonus && bonus.expiresAt && new Date(bonus.expiresAt).getTime() > now) {
    const pct  = Number(bonus.valor || 0);
    const gain = Math.round(xp * pct / 100);
    xp      += gain;
    boosted  = true;
    log.push(`xp_bonus +${pct}% → +${gain} XP`);
  }

  // 2. xp_mult — multiplicative (applied after bonus, on the already-boosted value)
  const mult = boosts.xp_mult;
  if (mult && mult.expiresAt && new Date(mult.expiresAt).getTime() > now) {
    const factor = Number(mult.valor || 1);
    const prev   = xp;
    xp           = Math.round(xp * factor);
    boosted      = true;
    log.push(`xp_mult ×${factor} → ${prev} → ${xp} XP`);
  }

  return { xpFinal: xp, boosted, log };
}

/**
 * Returns a clean list of all currently-active boosts with remaining seconds.
 *
 * @param {object} userData - Firestore user document data
 * @returns {Array<{type, valor, expiresAt, remainingSecs, label}>}
 */
export function listActiveBoosts(userData) {
  const now    = Date.now();
  const boosts = userData?.activeBoosts || {};
  const result = [];

  const BOOST_META = {
    xp_bonus:    { icon: "⚡", label: (v) => `+${v}% XP` },
    xp_mult:     { icon: "✨", label: (v) => `×${v} XP` },
    cooldown_red:{ icon: "⏱️", label: (v) => `-${v}% Cooldown` },
  };

  for (const [type, data] of Object.entries(boosts)) {
    if (!data || !data.expiresAt) continue;
    const expMs       = new Date(data.expiresAt).getTime();
    const remainingSecs = Math.max(0, Math.floor((expMs - now) / 1000));
    if (remainingSecs <= 0) continue; // expired

    const meta  = BOOST_META[type] || { icon: "🔮", label: (v) => `+${v}` };
    result.push({
      type,
      valor:        data.valor,
      expiresAt:    data.expiresAt,
      remainingSecs,
      icon:         meta.icon,
      label:        meta.label(data.valor),
    });
  }

  return result;
}

/**
 * Returns true if a streak shield is currently active.
 *
 * @param {object} userData
 * @returns {boolean}
 */
export function hasStreakShield(userData) {
  const shield = userData?.streakShield;
  if (!shield || !shield.expiresAt) return false;
  return new Date(shield.expiresAt).getTime() > Date.now();
}
