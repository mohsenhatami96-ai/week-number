import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

function block(selector) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `missing ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  return css.slice(start, close + 2);
}

test('accent text is separate from the blue fill', () => {
  const root = block(':root');
  assert.match(root, /--blue:\s*#245bc7/);
  assert.match(root, /--accent-text:\s*#194ca9/);
  assert.match(root, /--accent-hover:\s*#194ca9/);

  const dark = block('[data-theme="dark"]');
  assert.match(dark, /--blue:\s*#245bc7/);
  assert.match(dark, /--accent-text:\s*#9ec0ff/);
  assert.match(dark, /--accent-hover:\s*#b6d0ff/);
  assert.match(dark, /--focus-ring:\s*#b6d0ff/);
  assert.doesNotMatch(dark, /#194ca9/i);
  assert.doesNotMatch(dark, /#8eb6ff/i);
});

test('week numbers, badges, and pressed controls use accent text, not the fill blue', () => {
  assert.match(css, /\.current-week strong \{[^}]*color:\s*var\(--accent-text\)/);
  assert.match(css, /\.week-badge \{[^}]*color:\s*var\(--accent-text\)/);
  assert.match(css, /\.language-switch button\[aria-pressed="true"\] \{[^}]*color:\s*var\(--accent-text\)/);
  assert.match(css, /\.card-icon \{[^}]*color:\s*var\(--accent-text\)/);
  assert.match(css, /\.stepper-btn \{[^}]*color:\s*var\(--accent-text\)/);
  const textOnFill = css.split('\n').filter((line) => /(?:^|[^-])color:\s*var\(--blue/.test(line));
  assert.deepEqual(textOnFill, []);
  assert.match(css, /\.day-chip\.is-today \{[^}]*background:\s*var\(--blue\)/);
  assert.match(css, /\.day-chip\.is-today \{[^}]*color:\s*#ffffff/);
});
