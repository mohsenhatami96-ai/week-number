import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('the page loads only local static assets and an ES module', () => {
  assert.match(index, /<link rel="stylesheet" href="\.\/styles\.css">/);
  assert.match(index, /<script type="module" src="\.\/app\.js"><\/script>/);
  assert.doesNotMatch(index, /(?:src|href)="https?:\/\//);
});

test('the three approved cards and all translator keys are present', () => {
  for (const key of ['today', 'dateToWeek', 'weekToDates', 'chooseDate', 'result', 'weekNumber', 'year', 'dateRange', 'isoNote']) {
    assert.match(index, new RegExp(`data-i18n="${key}"`), `Missing translation key ${key}`);
  }
});

test('a grouped language switch exposes EN and SV choices', () => {
  assert.match(index, /role="group" aria-label="Language">/);
  assert.match(index, /<button[^>]+data-language="en"[^>]*>EN<\/button>/);
  assert.match(index, /<button[^>]+data-language="sv"[^>]*>SV<\/button>/);
});

test('date, week and year fields use persistent labels and appropriate inputs', () => {
  assert.match(index, /<label for="date-input" data-i18n="chooseDate">/);
  assert.match(index, /<input id="date-input" type="date"/);
  assert.match(index, /<label for="week-input" data-i18n="weekNumber">/);
  assert.match(index, /<input id="week-input" type="number" min="1" max="53"/);
  assert.match(index, /<label for="year-input" data-i18n="year">/);
  assert.match(index, /<input id="year-input" type="number" min="1" max="9999"/);
});

test('results and errors have live-region semantics', () => {
  assert.match(index, /id="today-result"/);
  assert.match(index, /id="date-result" aria-live="polite"/);
  assert.match(index, /id="week-result" aria-live="polite"/);
  assert.match(index, /<main id="main-content">/);
});

test('a theme toggle sits beside the language switch', () => {
  assert.match(index, /id="theme-toggle"/);
  assert.match(index, /class="theme-toggle"/);
  assert.match(index, /aria-pressed=/);
  assert.match(index, /weekTool\.theme/);
  assert.match(index, /data-theme/);
});
