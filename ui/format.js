const shortDateFormatters = Object.freeze({
  en: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
  sv: new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
});

function locale(language) {
  return language === 'sv' ? 'sv' : 'en';
}

export function formatDate(date, language) {
  const parts = Object.fromEntries(
    shortDateFormatters[locale(language)].formatToParts(date).map(({ type, value }) => [type, value]),
  );
  // Swedish ICU sometimes adds punctuation to abbreviated month names.
  return `${parts.day} ${parts.month.replace(/\./g, '')} ${parts.year}`;
}

export function formatDateRange(start, end, language) {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const from = sameYear
    ? `${start.getUTCDate()} ${formatDate(start, language).split(' ')[1]}`
    : formatDate(start, language);
  return `${from} – ${formatDate(end, language)}`;
}

export function dateInputValue(date) {
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function parseDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}
