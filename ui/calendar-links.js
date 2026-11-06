/**
 * Build deep links that open a calendar day outside the app.
 * No events are fetched or displayed in-app.
 */

/** Seconds between the Unix epoch and Apple's Cocoa reference date (2001-01-01T00:00:00Z). */
const COCOA_EPOCH_UNIX_SECONDS = 978_307_200;

/**
 * True for iPhone / iPod / iPad (including iPadOS desktop UA).
 * @param {string} [userAgent]
 * @param {{ platform?: string, maxTouchPoints?: number }} [device]
 */
export function isAppleMobileCalendar(userAgent = '', device = {}) {
  const ua = String(userAgent);
  if (/iPhone|iPod|iPad/i.test(ua)) return true;
  // iPadOS 13+ may report as Macintosh with touch.
  if (/Macintosh/i.test(ua) && Number(device.maxTouchPoints) > 1) return true;
  if (device.platform === 'MacIntel' && Number(device.maxTouchPoints) > 1) return true;
  return false;
}

/**
 * Civil Y/M/D from a UTC-noon calendar Date used elsewhere in this app.
 * @param {Date} date
 */
function civilParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/**
 * Apple Calendar day URL (`calshow:` seconds since 2001-01-01 GMT for local midnight).
 * @param {Date} date UTC-noon civil date
 */
export function appleCalendarDayUrl(date) {
  const { year, month, day } = civilParts(date);
  // Local midnight for that civil calendar day in the browser's time zone.
  const localMidnightMs = new Date(year, month - 1, day).getTime();
  const seconds = Math.floor(localMidnightMs / 1000) - COCOA_EPOCH_UNIX_SECONDS;
  return `calshow:${seconds}`;
}

/**
 * Google Calendar day view URL for a civil date.
 * @param {Date} date UTC-noon civil date
 */
export function googleCalendarDayUrl(date) {
  const { year, month, day } = civilParts(date);
  return `https://calendar.google.com/calendar/r/day/${year}/${month}/${day}`;
}

/**
 * Preferred calendar URL for the current environment.
 * @param {Date} date
 * @param {{ userAgent?: string, platform?: string, maxTouchPoints?: number }} [env]
 */
export function calendarDayUrl(date, env = {}) {
  const userAgent = env.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const platform = env.platform ?? (typeof navigator !== 'undefined' ? navigator.platform : undefined);
  const maxTouchPoints = env.maxTouchPoints
    ?? (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : undefined);
  if (isAppleMobileCalendar(userAgent, { platform, maxTouchPoints })) {
    return appleCalendarDayUrl(date);
  }
  return googleCalendarDayUrl(date);
}
