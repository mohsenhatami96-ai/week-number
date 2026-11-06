import test from 'node:test';
import assert from 'node:assert/strict';
import { readLanguage, saveLanguage } from '../ui/language-storage.js';

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
  };
}

test('language choice persists under weekTool.lang', () => {
  const storage = storageWith();
  saveLanguage(storage, 'sv');
  assert.equal(storage.values.get('weekTool.lang'), 'sv');
  assert.equal(readLanguage(storage, 'en-US'), 'sv');
  saveLanguage(storage, 'en');
  assert.equal(readLanguage(storage, 'sv-SE'), 'en');
});

test('missing or invalid storage falls back to the browser language', () => {
  assert.equal(readLanguage(null, 'sv-FI'), 'sv');
  assert.equal(readLanguage(storageWith(), 'en-US'), 'en');
  const storage = storageWith();
  storage.setItem('weekTool.lang', 'unsupported');
  assert.equal(readLanguage(storage, 'sv-SE'), 'sv');
});

test('blocked localStorage never breaks language selection', () => {
  const storage = storageWith({ readError: true, writeError: true });
  assert.equal(readLanguage(storage, 'sv-SE'), 'sv');
  assert.doesNotThrow(() => saveLanguage(storage, 'en'));
});
