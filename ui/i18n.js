export const STRINGS = Object.freeze({
  en: Object.freeze({
    today: 'Today',
    dateToWeek: 'Date → week',
    weekToDates: 'Week → dates',
    chooseDate: 'Choose date',
    result: 'Result',
    weekNumber: 'Week number',
    year: 'Year',
    dateRange: 'Date range',
    weekBadge: 'Week {n} · {year}',
    isoNote: 'ISO weeks: Mon–Sun; week 1 has the year’s first Thursday.',
    langEn: 'EN',
    langSv: 'SV',
    decreaseWeek: 'Decrease week',
    increaseWeek: 'Increase week',
    decreaseYear: 'Decrease year',
    increaseYear: 'Increase year',
    openInCalendar: 'Open in Calendar',
    themeToggle: 'Dark mode',
    publicHoliday: 'Public holiday.',
  }),
  sv: Object.freeze({
    today: 'Idag',
    dateToWeek: 'Datum → vecka',
    weekToDates: 'Vecka → datum',
    chooseDate: 'Välj datum',
    result: 'Resultat',
    weekNumber: 'Veckonummer',
    year: 'År',
    dateRange: 'Datumintervall',
    weekBadge: 'Vecka {n} · {year}',
    isoNote: 'ISO-veckor: mån–sön; vecka 1 innehåller årets första torsdag.',
    langEn: 'EN',
    langSv: 'SV',
    decreaseWeek: 'Minska vecka',
    increaseWeek: 'Öka vecka',
    decreaseYear: 'Minska år',
    increaseYear: 'Öka år',
    openInCalendar: 'Öppna i kalendern',
    themeToggle: 'Mörkt läge',
    publicHoliday: 'Helgdag',
  }),
});

export function safeStoredLanguage(value) {
  return value === 'en' || value === 'sv' ? value : null;
}

export function defaultLanguage(browserLanguage) {
  return typeof browserLanguage === 'string' && browserLanguage.toLowerCase().startsWith('sv')
    ? 'sv'
    : 'en';
}

export function translate(language, key, values = {}) {
  const template = STRINGS[language]?.[key] ?? STRINGS.en[key] ?? '';
  return template.replaceAll(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : placeholder,
  );
}
