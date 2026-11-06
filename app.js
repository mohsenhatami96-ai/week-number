import { datesOfIsoWeek, isoWeekOfDate, stepIsoWeek, stepIsoYear, todayInStockholm, toUtcNoon, weeksInIsoYear } from './domain/iso-week.js';
import { formatDate, formatDateRange, dateInputValue, parseDateInput } from './ui/format.js';
import { readLanguage, saveLanguage } from './ui/language-storage.js';
import { readTheme, saveTheme, hasStoredTheme } from './ui/theme-storage.js';
import { translate } from './ui/i18n.js';
import { calendarDayUrl } from './ui/calendar-links.js';
import { swedishHolidayOn } from './domain/swedish-holidays.js';

const $ = (selector) => document.querySelector(selector);
const elements = {
  todayWeek: $('#today-week'),
  todayYear: $('#today-year'),
  todayRange: $('#today-range'),
  todayDays: $('#today-days'),
  dateForm: $('#date-form'),
  dateInput: $('#date-input'),
  dateBadge: $('#date-week-badge'),
  dateRange: $('#date-range'),
  dateDays: $('#date-days'),
  weekForm: $('#week-form'),
  weekInput: $('#week-input'),
  yearInput: $('#year-input'),
  weekRange: $('#week-range'),
  weekDays: $('#week-days'),
  weekResult: $('#week-result'),
  error: $('#week-error'),
};

const dayNames = Object.freeze({
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  sv: ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'],
});
const t = (key, values) => translate(language, key, values);
const today = todayInStockholm();
const currentWeek = isoWeekOfDate(today);
const selectedDate = $('#date-input');
let language = readLanguage(getStorage(), navigator.language || navigator.languages?.[0] || 'en');
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let theme = readTheme(getStorage(), colorSchemeQuery);

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function badge(week, year) {
  return t('weekBadge', { n: week, year });
}

function node(name, className, text) {
  const element = document.createElement(name);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderDays(container, dates, { today: highlightToday = false, selectedDate: selected = null } = {}) {
  container.replaceChildren();
  dates.forEach((date, index) => {
    const isToday = highlightToday && date.getTime() === today.getTime();
    const isSelected = selected && date.getTime() === selected.getTime();
    const holiday = swedishHolidayOn(date);
    const classes = [
      'day-chip',
      isToday ? 'is-today' : '',
      isSelected ? 'is-selected' : '',
      holiday ? 'is-holiday' : '',
    ].filter(Boolean).join(' ');
    const item = node('li', 'day-chip-item');
    const chip = node('a', classes);
    const day = formatDate(date, language);
    const openLabel = t('openInCalendar');
    const holidayName = holiday ? holiday[language] : '';
    const accessibleName = [
      `${openLabel}: ${dayNames[language][index]}, ${day}`,
      isToday ? t('today') : '',
      holidayName,
    ].filter(Boolean).join(', ');
    const href = calendarDayUrl(date);
    chip.href = href;
    chip.title = holidayName ? `${openLabel} · ${holidayName}` : openLabel;
    chip.setAttribute('aria-label', accessibleName);
    if (holiday) chip.dataset.holiday = holiday.id;
    if (href.startsWith('https:')) {
      chip.target = '_blank';
      chip.rel = 'noopener noreferrer';
    }
    if (isToday) chip.setAttribute('aria-current', 'date');
    const shortDate = formatDate(date, language).replace(/ \d{4}$/, '');
    const [dayNum, ...monthParts] = shortDate.split(' ');
    const dateSpan = node('span', 'day-date');
    dateSpan.append(
      node('span', 'day-num', dayNum),
      document.createTextNode(' '),
      node('span', 'day-month', monthParts.join(' ')),
    );
    chip.append(
      node('span', 'day-name', dayNames[language][index]),
      dateSpan,
      node('time', 'sr-only', day),
    );
    if (holiday && isToday) {
      chip.append(node('span', 'holiday-dot', ''));
      chip.querySelector('.holiday-dot').setAttribute('aria-hidden', 'true');
    }
    const time = chip.querySelector('time');
    time.dateTime = dateInputValue(date);
    time.setAttribute('aria-hidden', 'true');
    item.append(chip);
    container.append(item);
  });
}

function renderToday() {
  elements.todayWeek.textContent = currentWeek.week;
  elements.todayYear.textContent = currentWeek.year;
  const dates = datesOfIsoWeek(currentWeek.week, currentWeek.year);
  elements.todayRange.textContent = formatDateRange(dates[0], dates[6], language);
  renderDays(elements.todayDays, dates, { today: true });
}

function renderDate() {
  const date = parseDateInput(elements.dateInput.value);
  if (!date) return;
  const { week, year } = isoWeekOfDate(toUtcNoon(date));
  const dates = datesOfIsoWeek(week, year);
  elements.dateBadge.textContent = badge(week, year);
  elements.dateRange.textContent = formatDateRange(dates[0], dates[6], language);
  renderDays(elements.dateDays, dates, { selectedDate: date });
}

function renderWeek() {
  const weekText = elements.weekInput.value;
  const yearText = elements.yearInput.value;
  const week = Number(weekText);
  const year = Number(yearText);
  // Do not make a partially edited field jump away from the user's input.
  elements.weekInput.setCustomValidity('');
  elements.yearInput.setCustomValidity('');
  if (!weekText || !yearText || !Number.isInteger(week) || !Number.isInteger(year)) {
    elements.error.textContent = language === 'sv' ? 'Ange ett veckonummer och ett år.' : 'Enter a week number and a year.';
    elements.error.hidden = false;
    elements.weekResult.hidden = true;
    return;
  }
  try {
    const dates = datesOfIsoWeek(week, year);
    elements.weekInput.max = String(weeksInIsoYear(year));
    elements.weekRange.textContent = formatDateRange(dates[0], dates[6], language);
    elements.weekRange.dataset.weekBadge = badge(week, year);
    elements.weekRange.setAttribute('aria-label', `${badge(week, year)}: ${elements.weekRange.textContent}`);
    renderDays(elements.weekDays, dates);
    elements.weekResult.hidden = false;
    elements.error.hidden = true;
    elements.weekInput.removeAttribute('aria-invalid');
  } catch {
    elements.weekResult.hidden = true;
    const validYear = Number.isInteger(year) && year >= 1 && year <= 9999;
    const limit = validYear ? weeksInIsoYear(year) : 52;
    elements.error.textContent = language === 'sv'
      ? `År ${year || '—'} har inte vecka ${week || '—'}. Välj vecka 1–${limit}.`
      : `Year ${year || '—'} does not have week ${week || '—'}. Choose week 1–${limit}.`;
    elements.error.hidden = false;
    elements.weekInput.setAttribute('aria-invalid', 'true');
  }
}


function themeColorMeta() {
  return document.querySelector('meta[name="theme-color"]');
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  const meta = themeColorMeta();
  if (meta) meta.content = theme === 'dark' ? '#0f141d' : '#f5f7fb';
  const toggle = $('#theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    toggle.setAttribute('aria-label', t('themeToggle'));
  }
}

function applyLanguage() {
  document.documentElement.lang = language;
  $('#app-title').textContent = language === 'sv' ? 'Veckonummer' : 'Week numbers';
  document.title = language === 'sv' ? 'Veckonummer' : 'Week numbers';
  $('.brand').setAttribute('aria-label', document.title);
  $('.language-switch').setAttribute('aria-label', language === 'sv' ? 'Språk' : 'Language');
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  }
  const submitLabel = language === 'sv' ? 'Visa datumintervall' : 'Show date range';
  $('.week-submit').setAttribute('aria-label', submitLabel);
  $('.week-submit').title = submitLabel;
  for (const button of document.querySelectorAll('.stepper-btn')) {
    const key = button.dataset.step === 'week'
      ? (button.dataset.delta === '1' ? 'increaseWeek' : 'decreaseWeek')
      : (button.dataset.delta === '1' ? 'increaseYear' : 'decreaseYear');
    button.setAttribute('aria-label', t(key));
  }
  for (const group of document.querySelectorAll('.stepper[role="group"]')) {
    const field = group.closest('.stepper-field');
    const label = field?.querySelector('label');
    if (label) group.setAttribute('aria-label', label.textContent);
  }
  $('#today-days').setAttribute('aria-label', language === 'sv' ? 'Dagar i denna ISO-vecka' : 'Days of this ISO week');
  $('#date-days').setAttribute('aria-label', language === 'sv' ? 'Dagar i den valda ISO-veckan' : 'Days of the selected ISO week');
  $('#week-days').setAttribute('aria-label', language === 'sv' ? 'Dagar i den valda ISO-veckan' : 'Days of the selected ISO week');
  applyTheme();
  renderToday();
  renderDate();
  renderWeek();
}

for (const button of document.querySelectorAll('[data-language]')) {
  button.addEventListener('click', () => {
    language = button.dataset.language;
    saveLanguage(getStorage(), language);
    applyLanguage();
  });
}
elements.dateInput.addEventListener('input', renderDate);
elements.dateForm.addEventListener('submit', (event) => event.preventDefault());
elements.weekForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderWeek();
});
elements.yearInput.addEventListener('change', renderWeek);
for (const input of [elements.weekInput, elements.yearInput]) {
  input.addEventListener('input', () => {
    if (input.validity.valid && input.value) renderWeek();
  });
}

function readWeekYear() {
  const week = Number(elements.weekInput.value);
  const year = Number(elements.yearInput.value);
  return {
    week: Number.isInteger(week) ? week : null,
    year: Number.isInteger(year) ? year : null,
  };
}

function applyWeekYear({ week, year }) {
  elements.weekInput.value = week;
  elements.yearInput.value = year;
  elements.weekInput.max = String(weeksInIsoYear(year));
  renderWeek();
}

for (const button of document.querySelectorAll('.stepper-btn')) {
  button.addEventListener('click', () => {
    const delta = Number(button.dataset.delta);
    const { week, year } = readWeekYear();
    if (year === null) return;
    const next = button.dataset.step === 'week'
      ? stepIsoWeek(week ?? 1, year, delta)
      : stepIsoYear(week ?? 1, year, delta);
    applyWeekYear(next);
  });
}


$('#theme-toggle')?.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  saveTheme(getStorage(), theme);
  applyTheme();
});

const onSystemThemeChange = () => {
  if (hasStoredTheme(getStorage())) return;
  theme = readTheme(getStorage(), colorSchemeQuery);
  applyTheme();
};
if (typeof colorSchemeQuery.addEventListener === 'function') {
  colorSchemeQuery.addEventListener('change', onSystemThemeChange);
} else if (typeof colorSchemeQuery.addListener === 'function') {
  colorSchemeQuery.addListener(onSystemThemeChange);
}

selectedDate.value = dateInputValue(today);
elements.weekInput.value = currentWeek.week;
elements.yearInput.value = currentWeek.year;
applyLanguage();
