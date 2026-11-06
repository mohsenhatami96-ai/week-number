import test from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, defaultLanguage, translate, safeStoredLanguage } from '../ui/i18n.js';

test('the approved English and Swedish strings are available', () => {
  assert.equal(STRINGS.en.today, 'Today');
  assert.equal(STRINGS.sv.today, 'Idag');
  assert.equal(STRINGS.en.dateToWeek, 'Date → week');
  assert.equal(STRINGS.sv.dateToWeek, 'Datum → vecka');
  assert.equal(STRINGS.en.weekToDates, 'Week → dates');
  assert.equal(STRINGS.sv.weekToDates, 'Vecka → datum');
  assert.equal(STRINGS.sv.isoNote, 'ISO-veckor: mån–sön; vecka 1 innehåller årets första torsdag.');
  assert.equal(STRINGS.en.increaseWeek, 'Increase week');
  assert.equal(STRINGS.sv.decreaseYear, 'Minska år');
});

test('Swedish browser languages default to SV', () => {
  assert.equal(defaultLanguage('sv-SE'), 'sv');
  assert.equal(defaultLanguage('SV'), 'sv');
  assert.equal(defaultLanguage('svenska'), 'sv');
});

test('other browser languages default to EN', () => {
  assert.equal(defaultLanguage('en-GB'), 'en');
  assert.equal(defaultLanguage('fa-IR'), 'en');
  assert.equal(defaultLanguage(undefined), 'en');
});

test('only a valid saved language overrides the browser language', () => {
  assert.equal(safeStoredLanguage('sv'), 'sv');
  assert.equal(safeStoredLanguage('en'), 'en');
  assert.equal(safeStoredLanguage('de'), null);
  assert.equal(safeStoredLanguage(null), null);
  assert.equal(safeStoredLanguage(''), null);
});

test('placeholders interpolate without unsafe HTML', () => {
  assert.equal(translate('en', 'weekBadge', { n: 45, year: 2026 }), 'Week 45 · 2026');
  assert.equal(translate('sv', 'weekBadge', { n: 45, year: 2026 }), 'Vecka 45 · 2026');
});

test('both locales have the same translation keys', () => {
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.sv).sort());
});
