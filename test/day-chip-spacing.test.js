import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

function mediaBlock(query) {
  const marker = `@media ${query}`;
  const start = css.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  const next = css.indexOf('@media', start + marker.length);
  return css.slice(start, next === -1 ? css.length : next);
}

test('day strips scroll larger chips instead of squeezing seven into the row', () => {
  assert.match(css, /\.day-strip \{[^}]*display: flex;/);
  assert.match(css, /\.day-strip \{[^}]*\bgap: 10px\b/);
  assert.match(css, /\.day-strip \{[^}]*overflow-x: auto/);
  assert.match(css, /\.day-strip \{[^}]*contain: paint/);
  assert.match(css, /\.day-chip \{[^}]*min-width: 48px;/);
  assert.match(css, /\.day-chip-item \{[^}]*min-width: 48px;/);
  assert.match(css, /\.day-chip \{[^}]*\bpadding: 12px\b/);
  assert.match(css, /\.day-chip \.day-date \{[^}]*\bfont-size: 14px\b/);
  assert.doesNotMatch(css, /repeat\(7,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(css, /\.day-strip \{[^}]*gap: [0-9]px/);

  for (const rule of css.matchAll(/[^{}]*day-date[^{]*\{[^}]*\}/g)) {
    const size = rule[0].match(/font-size:\s*(\d+)px/);
    if (size) assert.ok(Number(size[1]) >= 14, `day number shrunk: ${rule[0]}`);
  }
});

test('phone strips show the day number only', () => {
  const phone = mediaBlock('(max-width: 419px)');
  assert.match(phone, /\.day-chip \.day-month \{\s*display: none;\s*\}/);
});
