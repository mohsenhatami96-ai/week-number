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

const MIN_WEEK = 1;

/**
 * Clamp a week number into the valid ISO range for a year.
 * Returns null when week is not an integer (caller keeps the typed value).
 */
export function clampIsoWeek(week, year) {
  assertIsoYear(year);
  if (!Number.isInteger(week)) return null;
  const max = weeksInIsoYear(year);
  return Math.min(Math.max(week, MIN_WEEK), max);
}

/**
 * Step an ISO week by `delta` weeks, rolling across year boundaries.
 * Past the last week of a year → week 1 of the next year (and the reverse).
 * Out-of-range weeks are clamped for the current year before the step.
 */
export function stepIsoWeek(week, year, delta) {
  assertIsoYear(year);
  if (!Number.isInteger(delta) || delta === 0) {
    throw new RangeError('delta must be a non-zero integer.');
  }
  const baseWeek = clampIsoWeek(Number.isInteger(week) ? week : MIN_WEEK, year) ?? MIN_WEEK;
  let nextWeek = baseWeek + delta;
  let nextYear = year;

  while (nextWeek > weeksInIsoYear(nextYear)) {
    nextWeek -= weeksInIsoYear(nextYear);
    nextYear += 1;
    if (nextYear > MAX_YEAR) {
      return { week: weeksInIsoYear(MAX_YEAR), year: MAX_YEAR };
    }
  }

  while (nextWeek < MIN_WEEK) {
    nextYear -= 1;
    if (nextYear < MIN_YEAR) {
      return { week: MIN_WEEK, year: MIN_YEAR };
    }
    nextWeek += weeksInIsoYear(nextYear);
  }

  return { week: nextWeek, year: nextYear };
}

/**
 * Step the ISO year by `delta` years and clamp the week to that year's length.
 */
export function stepIsoYear(week, year, delta) {
  assertIsoYear(year);
  if (!Number.isInteger(delta) || delta === 0) {
    throw new RangeError('delta must be a non-zero integer.');
  }
  let nextYear = year + delta;
  if (nextYear < MIN_YEAR) nextYear = MIN_YEAR;
  if (nextYear > MAX_YEAR) nextYear = MAX_YEAR;
  const clamped = clampIsoWeek(Number.isInteger(week) ? week : MIN_WEEK, nextYear);
  return { week: clamped ?? MIN_WEEK, year: nextYear };
}
