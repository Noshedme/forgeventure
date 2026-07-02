// Shared per-user cache store — imported by dashboard, ejercicios, logros, skins, avatars, and auth routes
// so mutations can immediately bust stale profile data without full re-reads.
export const _userStatsCache = new Map();  // uid → { ts, data }
export const _weeklyActCache = new Map();  // uid → { ts, data }
export const _logrosCache    = new Map();  // uid → { ts, data }

export const USER_STATS_TTL  = 2  * 60 * 1000;  // 2 min
export const WEEKLY_ACT_TTL  = 10 * 60 * 1000;  // 10 min
export const LOGROS_TTL      = 5  * 60 * 1000;  // 5 min

export function bustUserCache(uid) {
  _userStatsCache.delete(uid);
  _weeklyActCache.delete(uid);
}

export function bustLogrosCache(uid) {
  _logrosCache.delete(uid);
}

export function bustAllCaches(uid) {
  bustUserCache(uid);
  bustLogrosCache(uid);
}
