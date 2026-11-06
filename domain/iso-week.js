/**
 * Calendar-only ISO 8601 calculations, independent of the runtime time zone.
 * Dates are represented at UTC noon to keep arithmetic away from DST edges.
 */

const DAY_MS = 86_400_000;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

function assertDate(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new RangeError('A valid Date is required.');
  }
}

export function toUtcNoon(date) {
  assertDate(date);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
}

function isoDayOfWeek(date) {
  const sundayBasedDay = date.getUTCDay();
  return sundayBasedDay === 0 ? 7 : sundayBasedDay;
}

function mondayOfWeek(date) {
  const noon = toUtcNoon(date);
  noon.setUTCDate(noon.getUTCDate() - isoDayOfWeek(noon) + 1);
  return noon;
}

/** Return a Monday-based, one-indexed ISO week number. */
export function isoWeekNumber(date) {
  const thursday = toUtcNoon(date);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - isoDayOfWeek(thursday));
  const isoYear = thursday.getUTCFullYear();

  // This week's Thursday minus the Thursday of ISO week 1. The latter
  // cannot simply use January 4's Thursday in years starting Thu–Sun.
  const january4 = new Date(Date.UTC(isoYear, 0, 4, 12));
  january4.setUTCDate(january4.getUTCDate() + 4 - isoDayOfWeek(january4));
  const firstThursday = isoDayOfWeek(january4) >= 4
    ? january4
    : new Date(january4.getTime() - 7 * DAY_MS);
  return Math.round((thursday - firstThursday) / (7 * DAY_MS)) + 1;
}

/** Return the ISO week-numbering year, which can differ from the calendar year. */
export function isoWeekYear(date) {
  const thursday = toUtcNoon(date);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - isoDayOfWeek(thursday));
  return thursday.getUTCFullYear();
}

/** Return { week, year } for a browser-local or UTC Date. */
export function isoWeekOfDate(date) {
  return { week: isoWeekNumber(date), year: isoWeekYear(date) };
}

/** Return 52 or 53 for an ISO week-numbering year. */
export function weeksInIsoYear(year) {
  assertIsoYear(year);
  return isoWeekNumber(new Date(Date.UTC(year, 11, 28, 12)));
}

/** Return seven UTC-noon Dates, Monday through Sunday of the requested ISO week. */
export function datesOfIsoWeek(week, year) {
  assertIsoYear(year);
  if (!Number.isInteger(week) || week < 1 || week > weeksInIsoYear(year)) {
    throw new RangeError(`ISO year ${year} has no week ${week}.`);
  }

  // 4 January is always in week 1, even when Monday falls in the prior year.
  return Array.from({ length: 7 }, (_, index) => {
    const monday = mondayOfWeek(new Date(Date.UTC(year, 0, 4, 12)));
    monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7 + index);
    return monday;
  });
}

function assertIsoYear(year) {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`ISO year must be an integer from ${MIN_YEAR} to ${MAX_YEAR}.`);
  }
}

/** Return today's calendar date in Europe/Stockholm at a safe UTC-noon instant. */
export function todayInStockholm(now = new Date()) {
  assertDate(now);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localDate = new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
  return toUtcNoon(localDate);
}
