import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    browserName: 'chromium',
    launchOptions: {
      executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: {
    command: 'npx http-server . -p 4173 -c-1 --silent',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'en-browser', use: { locale: 'en-US' }, grepInvert: /Swedish browser/ },
    { name: 'sv-browser', use: { locale: 'sv-SE' }, grep: /Swedish browser/ },
    { name: 'sv-browser', use: { locale: 'sv-SE' }, grep: /Swedish browser|390px|280px/ },
  ],
});
