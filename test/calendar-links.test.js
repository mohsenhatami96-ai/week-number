import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appleCalendarDayUrl,
  googleCalendarDayUrl,
  calendarDayUrl,
  isAppleMobileCalendar,
} from '../ui/calendar-links.js';

const COCOA_EPOCH_UNIX_SECONDS = 978_307_200;

function utcNoon(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

test('Google Calendar day URLs use unpadded month and day', () => {
  assert.equal(
    googleCalendarDayUrl(utcNoon(2026, 11, 6)),
    'https://calendar.google.com/calendar/r/day/2026/11/6',
  );
  assert.equal(
    googleCalendarDayUrl(utcNoon(2021, 1, 1)),
    'https://calendar.google.com/calendar/r/day/2021/1/1',
  );
  assert.equal(
    googleCalendarDayUrl(utcNoon(2020, 12, 28)),
    'https://calendar.google.com/calendar/r/day/2020/12/28',
  );
});

test('Apple calshow seconds are local midnight minus the Cocoa epoch', () => {
  const date = utcNoon(2026, 11, 6);
  const expectedSeconds = Math.floor(new Date(2026, 10, 6).getTime() / 1000) - COCOA_EPOCH_UNIX_SECONDS;
  assert.equal(appleCalendarDayUrl(date), `calshow:${expectedSeconds}`);
});

test('Apple calshow works across year boundaries', () => {
  for (const [y, m, d] of [[2020, 12, 28], [2021, 1, 3], [2026, 12, 31], [2027, 1, 1]]) {
    const date = utcNoon(y, m, d);
    const expected = Math.floor(new Date(y, m - 1, d).getTime() / 1000) - COCOA_EPOCH_UNIX_SECONDS;
    assert.equal(appleCalendarDayUrl(date), `calshow:${expected}`);
  }
});

test('iOS and iPadOS user agents prefer Apple Calendar', () => {
  assert.equal(isAppleMobileCalendar('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true);
  assert.equal(isAppleMobileCalendar('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)'), true);
  assert.equal(isAppleMobileCalendar('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', {
    platform: 'MacIntel',
    maxTouchPoints: 5,
  }), true);
  assert.equal(isAppleMobileCalendar('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), false);
  assert.equal(isAppleMobileCalendar('Mozilla/5.0 (Linux; Android 14)'), false);
});

test('calendarDayUrl picks Apple on iOS and Google elsewhere', () => {
  const date = utcNoon(2026, 11, 6);
  assert.match(
    calendarDayUrl(date, { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }),
    /^calshow:-?\d+$/,
  );
  assert.equal(
    calendarDayUrl(date, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }),
    'https://calendar.google.com/calendar/r/day/2026/11/6',
  );
});
