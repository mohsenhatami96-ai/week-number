# Week numbers · Veckonummer

A tiny, dependency-free website for looking up ISO 8601 week numbers and dates in English or Swedish.

- **Today:** the current week in Europe/Stockholm, its year, Monday–Sunday range, and day chips.
- **Date → week:** choose a date to find its ISO week.
- **Week → dates:** choose a week number and ISO year to see its Monday–Sunday range.
- **EN | SV:** defaults from the browser language and persists the choice in `localStorage` under `weekTool.lang`.

## Run

The production site is entirely static. Serve this directory with any HTTP server:

```sh
npx http-server . -p 4173 -c-1
```

Then open `http://localhost:4173`. No build step, API, external font, or third-party runtime script is required.

## Tests

Requires Node.js 22 or newer:

```sh
npm install
npm test
```

The browser checks use the machine's existing Google Chrome by default:

```sh
npm run test:e2e
```

Set `CHROME_PATH` to a different Chromium executable, or install Playwright's browser and change `executablePath` in `playwright.config.js`.

## Structure

- `domain/iso-week.js` — pure ISO calculations, 52/53-week years, UTC-noon calendar math, and Stockholm today.
- `ui/i18n.js` — the approved EN/SV strings.
- `ui/format.js` — locale-safe, UTC date parsing and formatting.
- `ui/language-storage.js` — resilient language preference persistence.
- `app.js` — browser rendering and events.
- `index.html`, `styles.css` — accessible, mobile-first static interface.
- `test/` — deterministic unit and end-to-end tests.

## Deployment

GitHub Pages serves the root of `main` at <https://mohsenhatami96-ai.github.io/week-number/>. Reverting a deployed commit rolls back the complete app; no database or migration is involved.
