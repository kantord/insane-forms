import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { fontsPlugin } from './fonts.plugin'
import { snippetsPlugin } from './snippets.plugin'

const root = path.resolve(import.meta.dirname, '../..')

export default defineConfig({
  // App root is this dir (index.html lives here). Relative base so the static
  // build works at any GitHub Pages path.
  base: './',
  resolve: {
    alias: {
      '@/': `${path.join(root, 'packages/ui')}/`,
      'insane-forms': path.join(root, 'packages/core/src/index.ts'),
      '@insane-forms/examples': path.join(root, 'packages/examples'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    snippetsPlugin(),
    fontsPlugin(),
    ...(process.env.ANALYZE === '1'
      ? [visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
})
