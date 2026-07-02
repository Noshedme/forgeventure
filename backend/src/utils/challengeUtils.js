// Shared utilities for Streak Challenge feature
export const CHALLENGE_MIN_STREAK = 3;

export function utcDateStr(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function calcChallengeReward(streak) {
  if (streak >= 100) return { xp: 100, coins: 75 };
  if (streak >= 60)  return { xp: 75,  coins: 55 };
  if (streak >= 30)  return { xp: 55,  coins: 40 };
  if (streak >= 14)  return { xp: 40,  coins: 28 };
  if (streak >= 7)   return { xp: 28,  coins: 20 };
  return { xp: 15, coins: 10 };
}
