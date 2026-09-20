import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/* E2E against the BUILT static site — the exact artifact GitHub Pages serves
 * (docs at /insane-forms/ and Storybook at /insane-forms/storybook/).
 * `pnpm run test:e2e` builds both (docs build, then storybook into
 * apps/docs/build/storybook) before launching. */
export default defineConfig({
  testDir: '.',
  testMatch: ['apps/*/e2e/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/insane-forms/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'pnpm run serve',
    cwd: path.join(import.meta.dirname, 'apps/docs'),
    url: 'http://localhost:4173/insane-forms/',
    reuseExistingServer: !process.env.CI,
  },
})
