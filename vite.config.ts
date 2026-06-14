/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = import.meta.dirname
const alias = {
  '@/': `${path.join(root, 'packages/ui')}/`,
  'insane-forms': path.join(root, 'packages/core/src/index.ts'),
  '@insane-forms/examples': path.join(root, 'packages/examples'),
}

// Unit/integration tests (jsdom) across the libraries. The Storybook browser
// suite has its own config (apps/storybook/vitest.config.ts) — run via the root
// `test` script after this.
export default defineConfig({
  resolve: { alias },
  plugins: [react()],
  test: {
    name: 'unit',
    environment: 'jsdom',
    include: ['packages/*/tests/**/*.test.{ts,tsx}'],
    setupFiles: [path.join(root, 'packages/core/tests/setup.ts')],
  },
})
