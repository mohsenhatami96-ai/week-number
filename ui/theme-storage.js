export function safeStoredTheme(value) {
  return value === 'light' || value === 'dark' ? value : null;
}

export function systemTheme(mediaQueryList) {
  try {
    return mediaQueryList?.matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function readTheme(storage, mediaQueryList) {
  try {
    return safeStoredTheme(storage?.getItem('weekTool.theme')) ?? systemTheme(mediaQueryList);
  } catch {
    return systemTheme(mediaQueryList);
  }
}

export function saveTheme(storage, theme) {
  if (!safeStoredTheme(theme)) return;
  try {
    storage?.setItem('weekTool.theme', theme);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

export function clearTheme(storage) {
  try {
    storage?.removeItem('weekTool.theme');
  } catch {
    // ignore
  }
}

export function hasStoredTheme(storage) {
  try {
    return Boolean(safeStoredTheme(storage?.getItem('weekTool.theme')));
  } catch {
    return false;
  }
}
