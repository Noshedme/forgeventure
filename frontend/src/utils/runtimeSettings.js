const DEFAULT_SETTINGS = {
  xpPopups: true,
  streakNotif: true,
};

function readLocalBool(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw !== "0";
  } catch {
    return fallback;
  }
}

export function getRuntimeSettingsSnapshot() {
  const runtime = typeof window !== "undefined" ? window.__fvSettings || {} : {};
  return {
    ...DEFAULT_SETTINGS,
    xpPopups:
      typeof runtime.xpPopups === "boolean"
        ? runtime.xpPopups
        : readLocalBool("fv_xp_popups", DEFAULT_SETTINGS.xpPopups),
    streakNotif:
      typeof runtime.streakNotif === "boolean"
        ? runtime.streakNotif
        : readLocalBool("fv_streak_notif", DEFAULT_SETTINGS.streakNotif),
  };
}

export function canShowXpPopups() {
  return getRuntimeSettingsSnapshot().xpPopups;
}

export function canShowStreakNotif() {
  return getRuntimeSettingsSnapshot().streakNotif;
}

