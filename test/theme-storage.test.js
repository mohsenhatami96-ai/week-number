import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearTheme,
  hasStoredTheme,
  readTheme,
  safeStoredTheme,
  saveTheme,
  systemTheme,
} from '../ui/theme-storage.js';

function storageWith({ readError = false, writeError = false } = {}) {
  const values = new Map();
  return {
    values,
    getItem(key) {
      if (readError) throw new Error('restricted storage');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (writeError) throw new Error('full storage');
      values.set(key, value);
    },
    removeItem(key) {
      if (writeError) throw new Error('full storage');
      values.delete(key);
    },
  };
}

test('safeStoredTheme only accepts light or dark', () => {
  assert.equal(safeStoredTheme('light'), 'light');
  assert.equal(safeStoredTheme('dark'), 'dark');
  assert.equal(safeStoredTheme('system'), null);
  assert.equal(safeStoredTheme(null), null);
});

test('systemTheme follows prefers-color-scheme', () => {
  assert.equal(systemTheme({ matches: true }), 'dark');
  assert.equal(systemTheme({ matches: false }), 'light');
  assert.equal(systemTheme(null), 'light');
});

test('theme choice persists under weekTool.theme', () => {
  const storage = storageWith();
  saveTheme(storage, 'dark');
  assert.equal(storage.values.get('weekTool.theme'), 'dark');
  assert.equal(readTheme(storage, { matches: false }), 'dark');
  saveTheme(storage, 'light');
  assert.equal(readTheme(storage, { matches: true }), 'light');
});

test('missing theme falls back to system preference', () => {
  assert.equal(readTheme(null, { matches: true }), 'dark');
  assert.equal(readTheme(storageWith(), { matches: false }), 'light');
  const storage = storageWith();
  storage.setItem('weekTool.theme', 'neon');
  assert.equal(readTheme(storage, { matches: true }), 'dark');
});

test('blocked localStorage never breaks theme selection', () => {
  const storage = storageWith({ readError: true, writeError: true });
  assert.equal(readTheme(storage, { matches: true }), 'dark');
  assert.doesNotThrow(() => saveTheme(storage, 'light'));
  assert.equal(hasStoredTheme(storage), false);
  assert.doesNotThrow(() => clearTheme(storage));
});

test('hasStoredTheme reflects a valid manual pick', () => {
  const storage = storageWith();
  assert.equal(hasStoredTheme(storage), false);
  saveTheme(storage, 'dark');
  assert.equal(hasStoredTheme(storage), true);
  clearTheme(storage);
  assert.equal(hasStoredTheme(storage), false);
});
