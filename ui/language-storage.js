import { defaultLanguage, safeStoredLanguage } from './i18n.js';

export function readLanguage(storage, browserLanguage) {
  try {
    return safeStoredLanguage(storage?.getItem('weekTool.lang')) ?? defaultLanguage(browserLanguage);
  } catch {
    return defaultLanguage(browserLanguage);
  }
}

export function saveLanguage(storage, language) {
  if (!safeStoredLanguage(language)) return;
  try {
    storage?.setItem('weekTool.lang', language);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}
