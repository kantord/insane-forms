import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  core: { disableTelemetry: true },
  framework: {
    name: '@storybook/react-vite',
    // Dedicated vite config: the project one is rooted at ./playground for the docs page.
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
}

export default config
