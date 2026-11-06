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

test('phone day strips scroll 48px chips and hide the month', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-06T10:00:00Z') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const measure = (selector) => page.locator(selector).evaluate((strip) => {
    const chip = strip.querySelector('.day-chip');
    const chipStyle = getComputedStyle(chip);
    const stripStyle = getComputedStyle(strip);
    return {
      gap: stripStyle.columnGap || stripStyle.gap,
      paddingTop: chipStyle.paddingTop,
      paddingBottom: chipStyle.paddingBottom,
      minWidth: chipStyle.minWidth,
      fontSize: getComputedStyle(chip.querySelector('.day-num')).fontSize,
      month: getComputedStyle(chip.querySelector('.day-month')).display,
      width: chip.getBoundingClientRect().width,
      height: chip.getBoundingClientRect().height,
      overflowX: stripStyle.overflowX,
      scrolls: strip.scrollWidth > strip.clientWidth + 1,
      pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
    };
  });

  for (const selector of ['#today-days', '#date-days', '#week-days']) {
    const box = await measure(selector);
    expect(box.gap).toBe('10px');
    expect(box.paddingTop).toBe('12px');
    expect(box.paddingBottom).toBe('12px');
    expect(box.fontSize).toBe('14px');
    expect(box.month).toBe('none');
    expect(box.overflowX).toBe('auto');
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.scrolls).toBe(true);
    expect(box.pageFits).toBe(true);
  }

  const strip = page.locator('#today-days');
  await strip.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  await expect(strip.locator('.day-chip').last()).toBeInViewport();

  await page.setViewportSize({ width: 280, height: 653 });
  const narrow = await measure('#today-days');
  expect(narrow.width).toBeGreaterThanOrEqual(48);
  expect(narrow.scrolls).toBe(true);
  expect(narrow.month).toBe('none');
  expect(narrow.pageFits).toBe(true);

  await page.setViewportSize({ width: 420, height: 900 });
  expect(await page.locator('#today-days .day-month').first().evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
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
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      accent: style.getPropertyValue('--accent-text').trim(),
      hover: style.getPropertyValue('--accent-hover').trim(),
      blue: style.getPropertyValue('--blue').trim(),
      blueDark: style.getPropertyValue('--blue-dark').trim(),
    };
  });
  expect(tokens.accent).toBe('#9ec0ff');
  expect(tokens.hover).toBe('#b6d0ff');
  expect(tokens.blue).toBe('#245bc7');
  expect(tokens.blueDark.toLowerCase()).not.toBe('#194ca9');
  await expect(page.locator('#today-week')).toHaveCSS('color', 'rgb(158, 192, 255)');
  await expect(page.locator('#date-week-badge')).toHaveCSS('color', 'rgb(158, 192, 255)');
  await expect(page.locator('[data-language="en"]')).toHaveCSS('color', 'rgb(158, 192, 255)');
  const todayChip = page.locator('#today-days .day-chip.is-today');
  await expect(todayChip).toHaveCSS('background-color', 'rgb(36, 91, 199)');
  await expect(todayChip).toHaveCSS('color', 'rgb(255, 255, 255)');
  await toggle.click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent-text').trim())).toBe('#194ca9');
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
