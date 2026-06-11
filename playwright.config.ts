import { defineConfig, devices } from '@playwright/test'

/* E2E against the BUILT static site — the exact artifact GitHub Pages serves
 * (docs page at / and Storybook at /storybook/). Run `pnpm run test:e2e`,
 * which builds both before launching the preview server. */
export default defineConfig({
  testDir: './e2e',
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
      // System Chrome via the channel — no browser downloads, locally or in CI.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'pnpm exec vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
