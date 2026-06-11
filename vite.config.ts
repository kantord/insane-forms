/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: './playground', // `pnpm run play` — the dev harness importing src directly
  base: './', // relative URLs: the static build works at any GitHub Pages path
  plugins: [react(), tailwindcss()],
  test: {
    root: '.',
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
})
