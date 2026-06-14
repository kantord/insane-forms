import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = path.resolve(import.meta.dirname, '../../..')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The storybook vitest project roots at apps/storybook, but node_modules and
  // the workspace packages live at the monorepo root — allow serving from there.
  server: { fs: { allow: [root] } },
  resolve: {
    alias: {
      '@/': `${path.join(root, 'packages/ui')}/`,
      'insane-forms': path.join(root, 'packages/core/src/index.ts'),
      '@insane-forms/examples': path.join(root, 'packages/examples'),
    },
  },
})
