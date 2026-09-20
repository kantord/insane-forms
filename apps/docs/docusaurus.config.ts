import path from 'node:path'
import type { Config } from '@docusaurus/types'

const docsComponent = (name: string) => path.resolve(__dirname, `src/components/docs/${name}`)

/* insane-forms docs site: the landing page (src/pages/index.tsx, plain React)
 * plus two sections behind the persistent sidebar (src/theme/Root.tsx) —
 * /docs (real written docs) and /explore (every Storybook page, our own
 * mechanism — see src/pages/explore.tsx).
 *
 * No `classic` preset, no `theme-classic`. content-docs plugin options below
 * point straight at our own minimal components (src/components/docs/) instead
 * of the default `@theme/Doc*` ones theme-classic would provide. This isn't
 * a style preference — theme-classic's plugin definition unconditionally
 * loads Infima (its base CSS framework, ~150KB) as a global client module the
 * moment it's an active theme, regardless of which individual components get
 * swizzled/overridden; the only way to avoid it is to never register
 * theme-classic at all. Measured: with theme-classic active for docs, the
 * landing page's Lighthouse LCP went from 2.3s to 2.8s (budget: 2.5s, see
 * quality-gates skill) even after swizzling out Navbar/Footer/AnnouncementBar
 * — Infima's own base styles are the fixed, non-prunable cost. See the
 * landing-page skill for the full writeup. */
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
    [
      '@docusaurus/plugin-content-docs',
      {
        routeBasePath: 'docs',
        sidebarPath: './sidebars.ts',
        docsRootComponent: docsComponent('DocsRoot'),
        docVersionRootComponent: docsComponent('DocVersionRoot'),
        docRootComponent: docsComponent('DocRoot'),
        docItemComponent: docsComponent('DocItem'),
        docCategoryGeneratedIndexComponent: docsComponent('DocCategoryGeneratedIndexPage'),
      },
    ],
    './plugins/tailwind-postcss.ts',
    './plugins/snippets-plugin.ts',
    './plugins/workspace-aliases-plugin.ts',
  ],
}

export default config
