import { test, expect } from '@playwright/test';

test('today and all three cards match ISO week 45 of 2026', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-05T23:30:00Z') });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#app-title')).toHaveText('Week numbers');
  await expect(page.locator('#today-week')).toHaveText('45');
  await expect(page.locator('#today-year')).toHaveText('2026');
  await expect(page.locator('#today-range')).toHaveText('2 Nov – 8 Nov 2026');
  await expect(page.locator('#date-input')).toHaveValue('2026-11-06');
  await expect(page.locator('#date-week-badge')).toHaveText('Week 45 · 2026');
  await expect(page.locator('#week-range')).toHaveText('2 Nov – 8 Nov 2026');
  await expect(page.locator('#today-days .day-chip')).toHaveCount(7);
  await expect(page.locator('#today-days .day-chip.is-today')).toContainText('6 Nov');
  await expect(page.locator('#today-days .day-chip').nth(0)).toContainText('Mon');
  await expect(page.locator('#today-days .day-chip').nth(6)).toContainText('Sun');
});

test('date conversion handles a date belonging to the previous ISO year', async ({ page }) => {
  await page.goto('/');
  await page.locator('#date-input').fill('2021-01-01');
  await expect(page.locator('#date-week-badge')).toHaveText('Week 53 · 2020');
  await expect(page.locator('#date-range')).toHaveText('28 Dec 2020 – 3 Jan 2021');
  await expect(page.locator('#date-days .day-chip').last()).toContainText('3 Jan');
});

test('week conversion handles Monday and week 53 year boundaries', async ({ page }) => {
  await page.goto('/');
  await page.locator('#week-input').fill('53');
  await page.locator('#year-input').fill('2020');
  await expect(page.locator('#week-range')).toHaveText('28 Dec 2020 – 3 Jan 2021');
  await expect(page.locator('#week-days .day-chip').first()).toContainText('28 Dec');
  await expect(page.locator('#week-days .day-chip').last()).toContainText('3 Jan');
  await expect(page.locator('#week-error')).toBeHidden();
});

test('a nonexistent week is explained instead of showing wrong dates', async ({ page }) => {
  await page.goto('/');
  await page.locator('#week-input').fill('53');
  await page.locator('#year-input').fill('2027');
  await expect(page.locator('#week-error')).toHaveText('Year 2027 does not have week 53. Choose week 1–52.');
  await expect(page.locator('#week-result')).toBeHidden();
  await expect(page.locator('#week-input')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#week-input').fill('52');
  await expect(page.locator('#week-error')).toBeHidden();
  await expect(page.locator('#week-range')).toHaveText('27 Dec 2027 – 2 Jan 2028');
});

test('Swedish browser localization and manual language choice work', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T10:00:00Z') });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
  await expect(page.locator('#app-title')).toHaveText('Veckonummer');
  await expect(page.locator('#date-heading')).toHaveText('Datum → vecka');
  await expect(page.locator('#week-heading')).toHaveText('Vecka → datum');
  await expect(page.locator('#date-week-badge')).toHaveText('Vecka 45 · 2026');
  await expect(page.locator('#today-range')).toHaveText('2 nov – 8 nov 2026');
  await expect(page.locator('#today-days .day-chip').nth(0)).toContainText('Mån');
  await expect(page.locator('#today-days .day-chip').nth(6)).toContainText('Sön');
  await page.locator('[data-language="en"]').click();
  await expect(page.locator('#date-week-badge')).toHaveText('Week 45 · 2026');
  await expect(page.locator('[data-language="en"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('weekTool.lang'))).toBe('en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('[data-language="sv"]').click();
  expect(await page.evaluate(() => localStorage.getItem('weekTool.lang'))).toBe('sv');
});

test('390px phone layout has no horizontal overflow and all controls are usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  for (const selector of ['[data-language="sv"]', '#date-input', '#week-input', '#year-input', '.week-submit']) {
    await expect(page.locator(selector)).toBeVisible();
    const box = await page.locator(selector).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  await page.locator('#date-input').fill('2030-12-31');
  await expect(page.locator('#date-week-badge')).toHaveText(/^(?:Week|Vecka) 1 · 2031$/);
  const overflowAfterInput = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(overflowAfterInput).toBe(390);
});

test('280px narrow layout stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 653 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(280);
});


test('changing the week repeatedly preserves the chosen ISO year', async ({ page }) => {
  await page.goto('/');
  await page.locator('#year-input').fill('2021');
  await page.locator('#year-input').blur();
  for (const [week, expected] of [['40', '4 Oct – 10 Oct 2021'], ['45', '8 Nov – 14 Nov 2021'], ['35', '30 Aug – 5 Sep 2021'], ['13', '29 Mar – 4 Apr 2021']]) {
    await page.locator('#week-input').focus();
    await page.locator('#week-input').press('ControlOrMeta+A');
    await page.locator('#week-input').pressSequentially(week);
    await page.locator('.week-submit').click();
    await expect(page.locator('#week-range')).toHaveText(expected);
    await expect(page.locator('#year-input')).toHaveValue('2021');
  }
});

test('week steppers type and scrub, rolling across ISO year ends', async ({ page }) => {
  await page.goto('/');
  await page.locator('#week-input').fill('52');
  await page.locator('#year-input').fill('2027');
  await expect(page.locator('#week-range')).toHaveText('27 Dec 2027 – 2 Jan 2028');

  await page.locator('[data-step="week"][data-delta="1"]').click();
  await expect(page.locator('#week-input')).toHaveValue('1');
  await expect(page.locator('#year-input')).toHaveValue('2028');
  await expect(page.locator('#week-range')).toHaveText('3 Jan – 9 Jan 2028');
  await expect(page.locator('#week-error')).toBeHidden();

  await page.locator('[data-step="week"][data-delta="-1"]').click();
  await expect(page.locator('#week-input')).toHaveValue('52');
  await expect(page.locator('#year-input')).toHaveValue('2027');

  await page.locator('[data-step="year"][data-delta="1"]').click();
  await expect(page.locator('#year-input')).toHaveValue('2028');
  await expect(page.locator('#week-input')).toHaveValue('52');

  await page.locator('#week-input').fill('53');
  await page.locator('#year-input').fill('2026');
  await page.locator('[data-step="year"][data-delta="1"]').click();
  await expect(page.locator('#week-input')).toHaveValue('52');
  await expect(page.locator('#year-input')).toHaveValue('2027');
  await expect(page.locator('#week-error')).toBeHidden();
});

test('week steppers expose at least 44px tap targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const selector of [
    '[data-step="week"][data-delta="-1"]',
    '[data-step="week"][data-delta="1"]',
    '[data-step="year"][data-delta="-1"]',
    '[data-step="year"][data-delta="1"]',
  ]) {
    const box = await page.locator(selector).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('day chips open Google Calendar day URLs outside the app', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T10:00:00Z') });
  await page.goto('/');
  const chip = page.locator('#today-days .day-chip.is-today');
  await expect(chip).toHaveAttribute('href', 'https://calendar.google.com/calendar/r/day/2026/11/6');
  await expect(chip).toHaveAttribute('target', '_blank');
  await expect(chip).toHaveAttribute('rel', /noopener/);
  await expect(chip).toHaveAttribute('title', /Calendar|kalendern/i);
  await expect(page.locator('#date-days .day-chip')).toHaveCount(7);
  await expect(page.locator('#week-days .day-chip')).toHaveCount(7);
  await expect(page.locator('#date-days a.day-chip').first()).toHaveAttribute('href', /calendar\.google\.com\/calendar\/r\/day\//);
});

test('dark mode toggle persists and updates theme tokens', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const toggle = page.locator('#theme-toggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('weekTool.theme'))).toBe('dark');
  const pageColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--page').trim());
  expect(pageColor).toBe('#0f141d');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('weekTool.theme'))).toBe('light');
});

test('Swedish holiday chips use soft-red styling and keep calendar links', async ({ page }) => {
  await page.goto('/');
  await page.locator('#date-input').fill('2026-06-06');
  const holiday = page.locator('#date-days .day-chip.is-holiday');
  await expect(holiday).toHaveCount(1);
  await expect(holiday).toHaveAttribute('data-holiday', 'nationalDay');
  await expect(holiday).toHaveAttribute('href', 'https://calendar.google.com/calendar/r/day/2026/6/6');
  await expect(holiday).toHaveAttribute('aria-label', /National Day|Sveriges nationaldag/);
  await expect(page.locator('.day-strip-legend').first()).toContainText(/Public holiday\.|Helgdag/);

  await page.locator('#week-input').fill('25');
  await page.locator('#year-input').fill('2026');
  await expect(page.locator('#week-days .day-chip[data-holiday="midsummerEve"]')).toHaveCount(1);
  await expect(page.locator('#week-days .day-chip[data-holiday="midsummerDay"]')).toHaveCount(1);
});

test('today that is also a holiday keeps blue styling with a red dot', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-06-06T10:00:00Z') });
  await page.goto('/');
  const chip = page.locator('#today-days .day-chip.is-today.is-holiday');
  await expect(chip).toHaveCount(1);
  await expect(chip.locator('.holiday-dot')).toHaveCount(1);
  const bg = await chip.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toMatch(/rgb\(\s*36,\s*91,\s*199\s*\)/);
});
