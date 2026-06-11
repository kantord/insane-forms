/// <reference types="vitest/config" />
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: './playground', // `pnpm run play` — the dev harness importing src directly
  base: './', // relative URLs: the static build works at any GitHub Pages path
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          root: '.',
          environment: 'jsdom',
          include: ['tests/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/setup.ts'],
        },
        plugins: [react()],
      },
      {
        // Absolute paths: the top-level `root: './playground'` (for the docs
        // playground) must not leak into where this project resolves from.
        extends: path.join(import.meta.dirname, '.storybook/vite.config.ts'),
        plugins: [
          storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          root: import.meta.dirname,
          browser: {
            enabled: true,
            headless: true,
            // System Chrome via the playwright channel — no browser downloads,
            // works locally and on GitHub Actions runners alike.
            provider: playwright({ launchOptions: { channel: 'chrome' } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
