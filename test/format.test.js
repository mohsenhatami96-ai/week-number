import test from 'node:test';
import assert from 'node:assert/strict';
import { dateInputValue, formatDate, formatDateRange, parseDateInput } from '../ui/format.js';
import { datesOfIsoWeek } from '../domain/iso-week.js';

const date = (value) => new Date(`${value}T12:00:00Z`);

test('English date formatting uses a short month', () => {
  assert.equal(formatDate(date('2026-11-03'), 'en'), '3 Nov 2026');
});

test('Swedish date formatting uses Swedish month names without punctuation', () => {
  assert.equal(formatDate(date('2026-11-03'), 'sv'), '3 nov 2026');
});

test('a date range repeats the month only when it is needed', () => {
  assert.equal(formatDateRange(date('2026-11-02'), date('2026-11-08'), 'en'), '2 Nov – 8 Nov 2026');
  assert.equal(formatDateRange(date('2026-11-30'), date('2026-12-06'), 'sv'), '30 nov – 6 dec 2026');
});

test('a range across ISO year boundary shows both calendar years', () => {
  assert.equal(formatDateRange(date('2025-12-29'), date('2026-01-04'), 'en'), '29 Dec 2025 – 4 Jan 2026');
});

test('input values always use the ISO YYYY-MM-DD representation', () => {
  assert.equal(dateInputValue(date('2026-11-06')), '2026-11-06');
});

test('date input parsing cannot roll invalid dates into the following month', () => {
  assert.equal(parseDateInput('2024-02-29').toISOString(), '2024-02-29T12:00:00.000Z');
  assert.equal(parseDateInput('2026-11-06').toISOString(), '2026-11-06T12:00:00.000Z');
  assert.equal(parseDateInput('2023-02-29'), null);
  assert.equal(parseDateInput('2026-13-01'), null);
  assert.equal(parseDateInput('not-a-date'), null);
  assert.equal(parseDateInput(''), null);
});


test('all 2026 same-year ranges keep the correct start and end dates', () => {
  for (const language of ['en', 'sv']) {
    for (let week = 1; week <= 52; week += 1) {
      const dates = datesOfIsoWeek(week, 2026);
      const range = formatDateRange(dates[0], dates[6], language);
      assert.ok(range.startsWith(`${dates[0].getUTCDate()} `), `${language} W${week}: ${range}`);
      assert.ok(range.endsWith(`${dates[6].getUTCDate()} ${formatDate(dates[6], language).split(' ').slice(1).join(' ')}`), `${language} W${week}: ${range}`);
    }
  }
});
