/**
 * Swedish public holidays (helgdagar) and culturally red days for chip coloring.
 * Dates are computed in UTC noon, matching the ISO week domain module.
 */

const DAY_MS = 86_400_000;

/** @typedef {{ id: string, en: string, sv: string, official: boolean }} HolidayDef */

/** @type {Readonly<Record<string, HolidayDef>>} */
export const HOLIDAYS = Object.freeze({
  newYearsDay: Object.freeze({ id: 'newYearsDay', en: "New Year's Day", sv: 'Nyårsdagen', official: true }),
  epiphany: Object.freeze({ id: 'epiphany', en: 'Epiphany', sv: 'Trettondedag jul', official: true }),
  goodFriday: Object.freeze({ id: 'goodFriday', en: 'Good Friday', sv: 'Långfredagen', official: true }),
  easterMonday: Object.freeze({ id: 'easterMonday', en: 'Easter Monday', sv: 'Annandag påsk', official: true }),
  labourDay: Object.freeze({ id: 'labourDay', en: 'Labour Day', sv: 'Första maj', official: true }),
  ascension: Object.freeze({ id: 'ascension', en: 'Ascension Day', sv: 'Kristi himmelsfärdsdag', official: true }),
  nationalDay: Object.freeze({ id: 'nationalDay', en: 'National Day', sv: 'Sveriges nationaldag', official: true }),
  midsummerEve: Object.freeze({ id: 'midsummerEve', en: 'Midsummer Eve', sv: 'Midsommarafton', official: false }),
  midsummerDay: Object.freeze({ id: 'midsummerDay', en: 'Midsummer Day', sv: 'Midsommardagen', official: true }),
  allSaints: Object.freeze({ id: 'allSaints', en: "All Saints' Day", sv: 'Alla helgons dag', official: true }),
  christmasEve: Object.freeze({ id: 'christmasEve', en: 'Christmas Eve', sv: 'Julafton', official: false }),
  christmasDay: Object.freeze({ id: 'christmasDay', en: 'Christmas Day', sv: 'Juldagen', official: true }),
  boxingDay: Object.freeze({ id: 'boxingDay', en: 'Boxing Day', sv: 'Annandag jul', official: true }),
  newYearsEve: Object.freeze({ id: 'newYearsEve', en: "New Year's Eve", sv: 'Nyårsafton', official: false }),
});

function assertYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError(`Year must be an integer from 1 to 9999, got ${year}.`);
  }
}

function utcNoon(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day, 12));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Easter Sunday via the Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
 * @param {number} year
 * @returns {Date} UTC noon
 */
export function easterSunday(year) {
  assertYear(year);
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcNoon(year, month - 1, day);
}

/** Midsummer Day: Saturday falling between 20 and 26 June. */
export function midsummerDay(year) {
  assertYear(year);
  for (let day = 20; day <= 26; day += 1) {
    const date = utcNoon(year, 5, day);
    if (date.getUTCDay() === 6) return date;
  }
  throw new Error(`Could not find Midsummer Day for ${year}.`);
}

/** Midsummer Eve: Friday falling between 19 and 25 June (day before Midsummer Day). */
export function midsummerEve(year) {
  return addDays(midsummerDay(year), -1);
}

/** All Saints' Day: Saturday falling between 31 October and 6 November. */
export function allSaintsDay(year) {
  assertYear(year);
  for (let offset = 0; offset <= 6; offset += 1) {
    const date = addDays(utcNoon(year, 9, 31), offset);
    if (date.getUTCDay() === 6) return date;
  }
  throw new Error(`Could not find All Saints' Day for ${year}.`);
}

/**
 * Return every colored Swedish red day for a calendar year, keyed by YYYY-MM-DD.
 * @param {number} year
 * @returns {Map<string, HolidayDef>}
 */
export function swedishHolidaysForYear(year) {
  assertYear(year);
  const easter = easterSunday(year);
  const entries = [
    [utcNoon(year, 0, 1), HOLIDAYS.newYearsDay],
    [utcNoon(year, 0, 6), HOLIDAYS.epiphany],
    [addDays(easter, -2), HOLIDAYS.goodFriday],
    [addDays(easter, 1), HOLIDAYS.easterMonday],
    [utcNoon(year, 4, 1), HOLIDAYS.labourDay],
    [addDays(easter, 39), HOLIDAYS.ascension],
    [utcNoon(year, 5, 6), HOLIDAYS.nationalDay],
    [midsummerEve(year), HOLIDAYS.midsummerEve],
    [midsummerDay(year), HOLIDAYS.midsummerDay],
    [allSaintsDay(year), HOLIDAYS.allSaints],
    [utcNoon(year, 11, 24), HOLIDAYS.christmasEve],
    [utcNoon(year, 11, 25), HOLIDAYS.christmasDay],
    [utcNoon(year, 11, 26), HOLIDAYS.boxingDay],
    [utcNoon(year, 11, 31), HOLIDAYS.newYearsEve],
  ];

  const map = new Map();
  for (const [date, holiday] of entries) {
    map.set(dateKey(date), holiday);
  }
  return map;
}

const holidayCache = new Map();

function holidaysCached(year) {
  let map = holidayCache.get(year);
  if (!map) {
    map = swedishHolidaysForYear(year);
    holidayCache.set(year, map);
  }
  return map;
}

/**
 * Look up the Swedish holiday (if any) for a Date.
 * @param {Date} date
 * @returns {HolidayDef | null}
 */
export function swedishHolidayOn(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new RangeError('A valid Date is required.');
  }
  // Domain dates are UTC noon; browser-local midnights use local Y-M-D.
  const useUtc = date.getUTCHours() === 12;
  const year = useUtc ? date.getUTCFullYear() : date.getFullYear();
  const month = (useUtc ? date.getUTCMonth() : date.getMonth()) + 1;
  const day = useUtc ? date.getUTCDate() : date.getDate();
  const key = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return holidaysCached(year).get(key) ?? null;
}
