import test from 'node:test';
import assert from 'node:assert/strict';

import {
  datesOfIsoWeek,
  isoWeekNumber,
  isoWeekOfDate,
  isoWeekYear,
  todayInStockholm,
  weeksInIsoYear,
} from '../domain/iso-week.js';

function utcDate(dateString) {
  return new Date(`${dateString}T12:00:00Z`);
}

function dateStrings(dates) {
  return dates.map((date) => date.toISOString().slice(0, 10));
}

test('a midweek date belongs to its ISO calendar year', () => {
  assert.equal(isoWeekNumber(utcDate('2026-11-06')), 45);
  assert.equal(isoWeekYear(utcDate('2026-11-06')), 2026);
});

test('ISO week 1 starts on Monday 29 December 2014', () => {
  assert.equal(isoWeekNumber(utcDate('2014-12-29')), 1);
  assert.equal(isoWeekYear(utcDate('2014-12-29')), 2015);
});

test('1 January can belong to the previous ISO year', () => {
  assert.deepEqual(isoWeekOfDate(utcDate('2016-01-01')), {
    week: 53,
    year: 2015,
  });
});

test('1 January 2027 belongs to week 53 of 2026', () => {
  assert.deepEqual(isoWeekOfDate(utcDate('2027-01-01')), {
    week: 53,
    year: 2026,
  });
});

test('ISO week 1 starts on Monday 4 January 2027', () => {
  assert.deepEqual(isoWeekOfDate(utcDate('2027-01-04')), {
    week: 1,
    year: 2027,
  });
});

test('a long ISO year has 53 weeks and a short one has 52', () => {
  for (const [year, count] of [[2015, 53], [2020, 53], [2026, 53], [2027, 52], [2028, 52]]) {
    assert.equal(weeksInIsoYear(year), count);
  }
});

test('today in the brief is ISO week 45 of 2026', () => {
  assert.deepEqual(isoWeekOfDate(utcDate('2026-11-06')), {
    week: 45,
    year: 2026,
  });
});

test('datesOfIsoWeek returns the full Monday through Sunday range', () => {
  const dates = datesOfIsoWeek(45, 2026);
  assert.equal(dates.length, 7);
  assert.deepEqual(dateStrings(dates), [
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
  ]);
  assert.deepEqual(dates.map((date) => date.getUTCDay()), [1, 2, 3, 4, 5, 6, 0]);
  assert.ok(dates.every((date) => date.getUTCHours() === 12));
});

test('a 53-week year ends on Sunday 3 January 2021', () => {
  assert.equal(weeksInIsoYear(2020), 53);
  assert.deepEqual(dateStrings(datesOfIsoWeek(53, 2020)), [
    '2020-12-28',
    '2020-12-29',
    '2020-12-30',
    '2020-12-31',
    '2021-01-01',
    '2021-01-02',
    '2021-01-03',
  ]);
});

test('week 53 is rejected for a year that only has 52 weeks', () => {
  assert.equal(weeksInIsoYear(2027), 52);
  assert.throws(() => datesOfIsoWeek(53, 2027), RangeError);
});

test('week zero and fractional weeks are rejected', () => {
  assert.throws(() => datesOfIsoWeek(0, 2026), RangeError);
  assert.throws(() => datesOfIsoWeek(45.5, 2026), RangeError);
});

test('week 53 exists in 2015 and starts on Monday 28 December', () => {
  const dates = datesOfIsoWeek(53, 2015);
  assert.equal(dateStrings(dates)[0], '2015-12-28');
  assert.equal(dateStrings(dates)[6], '2016-01-03');
});

test('leap day is in week 9 of 2024', () => {
  assert.deepEqual(isoWeekOfDate(utcDate('2024-02-29')), { week: 9, year: 2024 });
});

test('week and year round-trip for dates around many year boundaries', () => {
  for (let year = 1990; year <= 2035; year += 1) {
    for (const dateString of [`${year}-01-01`, `${year}-12-28`, `${year}-12-31`]) {
      const expected = isoWeekOfDate(utcDate(dateString));
      const dates = datesOfIsoWeek(expected.week, expected.year);
      const actual = dateStrings(dates).indexOf(dateString);
      assert.notEqual(actual, -1, `${dateString} must occur in ${expected.year}-W${expected.week}`);
      assert.equal(dates[actual].getUTCDay(), actual === 6 ? 0 : actual + 1);
    }
  }
});

test('local time zones do not change ISO calculations for a calendar date', () => {
  const timezoneDates = [
    new Date(2026, 10, 6, 0, 30),
    new Date(2026, 10, 6, 23, 30),
  ];
  for (const date of timezoneDates) {
    assert.deepEqual(isoWeekOfDate(date), { week: 45, year: 2026 });
  }
});

test('an invalid Date is rejected', () => {
  assert.throws(() => isoWeekOfDate(new Date('not a date')), RangeError);
});

test('Stockholm today uses the calendar date in Europe/Stockholm', () => {
  assert.equal(
    todayInStockholm(new Date('2026-11-05T23:30:00Z')).toISOString(),
    '2026-11-06T12:00:00.000Z',
  );
  assert.equal(
    todayInStockholm(new Date('2026-06-30T22:30:00Z')).toISOString(),
    '2026-07-01T12:00:00.000Z',
  );
});


test('every day round-trips through its ISO week for 100 years', () => {
  let date = utcDate('1950-01-01');
  const end = utcDate('2050-01-01');
  while (date < end) {
    const { week, year } = isoWeekOfDate(date);
    const dates = datesOfIsoWeek(week, year);
    assert.ok(
      dates.some((candidate) => candidate.getTime() === date.getTime()),
      `${date.toISOString().slice(0, 10)} must round-trip through ${year}-W${week}`,
    );
    date = new Date(date.getTime() + 86_400_000);
  }
});

test('week 1 of every year contains its first Thursday', () => {
  for (let year = 1950; year < 2050; year += 1) {
    assert.ok(dateStrings(datesOfIsoWeek(1, year)).includes(`${year}-01-04`));
  }
});

test('year lengths match the first-Thursday invariant for 400 ISO years', () => {
  for (let year = 1800; year < 2200; year += 1) {
    const thursdayYear = isoWeekYear(utcDate(`${year}-01-04`));
    const lastWeek = datesOfIsoWeek(weeksInIsoYear(year), year)[0];
    assert.equal(isoWeekYear(lastWeek), year);
    assert.equal(thursdayYear, year);
  }
});
