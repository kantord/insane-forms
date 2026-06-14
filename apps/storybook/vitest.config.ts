/// <reference types="vitest/config" />
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vite'
import storybookViteConfig from './.storybook/vite.config'

// Rooted at this app so the storybook plugin resolves `../stories` (relative to
// configDir) correctly; node_modules is served from the repo root via the
// fs.allow set in .storybook/vite.config.ts.
export default mergeConfig(
  storybookViteConfig,
  defineConfig({
    plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
    test: {
      name: 'storybook',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({ launchOptions: { channel: 'chrome' } }),
        instances: [{ browser: 'chromium' }],
      },
    },
  }),
)
