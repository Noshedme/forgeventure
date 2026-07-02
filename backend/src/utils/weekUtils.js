// ISO week utilities — Monday = week start, compliant with ISO 8601

/**
 * Returns "YYYY-Www" for the ISO week containing the given date (default: now).
 * Week 1 is the week that contains the first Thursday of the year.
 */
export function getISOWeekKey(date = new Date()) {
  // Always use UTC accessors so this works regardless of server timezone
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Sunday → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to Thursday of current week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Returns the ISO week key for the week immediately before the given weekKey.
 */
export function getPrevWeekKey(weekKey) {
  const [yearStr, wStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  // Jan 4 is always in ISO week 1
  const jan4    = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Mon = new Date(jan4.getTime() - (jan4Day - 1) * 86400000);
  const thisMon  = new Date(week1Mon.getTime() + (week - 1) * 7 * 86400000);
  const prevMon  = new Date(thisMon.getTime() - 7 * 86400000);
  return getISOWeekKey(prevMon);
}
