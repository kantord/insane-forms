import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/* E2E against the BUILT static site — the exact artifact GitHub Pages serves
 * (landing at / and Storybook at /storybook/). `pnpm run test:e2e` builds both
 * (landing dist, then storybook into landing dist/storybook) before launching. */
export default defineConfig({
  testDir: '.',
  testMatch: ['apps/*/e2e/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'vite preview --port 4173 --strictPort',
    cwd: path.join(import.meta.dirname, 'apps/landing'),
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
