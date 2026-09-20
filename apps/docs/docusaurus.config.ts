import type { Config } from '@docusaurus/types'

/* insane-forms docs site. Today: just the (simplified, static) landing page
 * — see src/pages/index.tsx. No theme/preset on purpose: `theme-classic`
 * ships a full framework's worth of component CSS (admonitions, avatars,
 * badges, doc sidebar, blog chrome...) none of which this page uses, and it
 * blew the Lighthouse LCP budget (quality-gates skill) on its own. The page
 * is plain React + our own Tailwind/biomes chrome; `plugin-content-pages`
 * alone is enough to route src/pages/*. Docs pages are the next step — that
 * step re-evaluates whether theme-classic earns its weight once there's
 * real content needing its sidebar/TOC/admonitions. */
const config: Config = {
  title: 'insane-forms',
  tagline: 'the schema is the form.',
  favicon: 'img/favicon.svg',

  url: 'https://kantord.github.io',
  baseUrl: '/insane-forms/',

  organizationName: 'kantord',
  projectName: 'insane-forms',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    '@docusaurus/plugin-content-pages',
    '@docusaurus/plugin-sitemap',
    './plugins/tailwind-postcss.ts',
    './plugins/snippets-plugin.ts',
    './plugins/workspace-aliases-plugin.ts',
  ],
}

export default config
