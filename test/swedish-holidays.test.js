import test from 'node:test';
import assert from 'node:assert/strict';

import {
  allSaintsDay,
  easterSunday,
  midsummerDay,
  midsummerEve,
  swedishHolidayOn,
  swedishHolidaysForYear,
  HOLIDAYS,
} from '../domain/swedish-holidays.js';

function utcDate(dateString) {
  return new Date(`${dateString}T12:00:00Z`);
}

function key(date) {
  return date.toISOString().slice(0, 10);
}

test('Easter Sunday matches known Gregorian dates', () => {
  assert.equal(key(easterSunday(2024)), '2024-03-31');
  assert.equal(key(easterSunday(2025)), '2025-04-20');
  assert.equal(key(easterSunday(2026)), '2026-04-05');
  assert.equal(key(easterSunday(2027)), '2027-03-28');
});

test('fixed Swedish holidays land on the expected calendar days', () => {
  assert.equal(swedishHolidayOn(utcDate('2026-01-01'))?.id, 'newYearsDay');
  assert.equal(swedishHolidayOn(utcDate('2026-01-06'))?.id, 'epiphany');
  assert.equal(swedishHolidayOn(utcDate('2026-05-01'))?.id, 'labourDay');
  assert.equal(swedishHolidayOn(utcDate('2026-06-06'))?.id, 'nationalDay');
  assert.equal(swedishHolidayOn(utcDate('2026-12-24'))?.id, 'christmasEve');
  assert.equal(swedishHolidayOn(utcDate('2026-12-25'))?.id, 'christmasDay');
  assert.equal(swedishHolidayOn(utcDate('2026-12-26'))?.id, 'boxingDay');
  assert.equal(swedishHolidayOn(utcDate('2026-12-31'))?.id, 'newYearsEve');
});

test('Easter-dependent holidays for 2026', () => {
  assert.equal(swedishHolidayOn(utcDate('2026-04-03'))?.id, 'goodFriday');
  assert.equal(swedishHolidayOn(utcDate('2026-04-06'))?.id, 'easterMonday');
  assert.equal(swedishHolidayOn(utcDate('2026-05-14'))?.id, 'ascension');
});

test('Easter-dependent holidays for 2024', () => {
  assert.equal(swedishHolidayOn(utcDate('2024-03-29'))?.id, 'goodFriday');
  assert.equal(swedishHolidayOn(utcDate('2024-04-01'))?.id, 'easterMonday');
  assert.equal(swedishHolidayOn(utcDate('2024-05-09'))?.id, 'ascension');
});

test('Midsummer Eve and Day for 2025 and 2026', () => {
  assert.equal(key(midsummerEve(2025)), '2025-06-20');
  assert.equal(key(midsummerDay(2025)), '2025-06-21');
  assert.equal(key(midsummerEve(2026)), '2026-06-19');
  assert.equal(key(midsummerDay(2026)), '2026-06-20');
  assert.equal(swedishHolidayOn(utcDate('2026-06-19'))?.id, 'midsummerEve');
  assert.equal(swedishHolidayOn(utcDate('2026-06-20'))?.id, 'midsummerDay');
});

test("All Saints' Day is the Saturday in 31 Oct–6 Nov", () => {
  assert.equal(key(allSaintsDay(2025)), '2025-11-01');
  assert.equal(key(allSaintsDay(2026)), '2026-10-31');
  assert.equal(swedishHolidayOn(utcDate('2026-10-31'))?.id, 'allSaints');
});

test('ordinary weekdays are not holidays', () => {
  assert.equal(swedishHolidayOn(utcDate('2026-11-06')), null);
  assert.equal(swedishHolidayOn(utcDate('2026-06-07')), null);
});

test('swedishHolidaysForYear includes official and cultural red days', () => {
  const map = swedishHolidaysForYear(2026);
  assert.equal(map.size, 14);
  assert.equal(map.get('2026-06-19')?.id, 'midsummerEve');
  assert.equal(map.get('2026-06-19')?.official, false);
  assert.equal(map.get('2026-06-20')?.official, true);
  assert.equal(map.get('2026-12-24')?.official, false);
  assert.equal(map.get('2026-12-25')?.official, true);
});

test('holiday names are bilingual', () => {
  assert.equal(HOLIDAYS.nationalDay.en, 'National Day');
  assert.equal(HOLIDAYS.nationalDay.sv, 'Sveriges nationaldag');
  assert.equal(swedishHolidayOn(utcDate('2026-06-06')).sv, 'Sveriges nationaldag');
});
