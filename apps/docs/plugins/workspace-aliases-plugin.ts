import path from 'node:path'
import type { LoadContext, Plugin } from '@docusaurus/types'

/** `resolve.alias` — the equivalent of the `resolve.alias` block every other
 * app in this workspace configures for its bundler
 * (apps/storybook/.storybook/vite.config.ts, formerly apps/landing/vite.config.ts):
 * `insane-forms` resolves to the core package's SOURCE (not its built dist,
 * so the demo forms always reflect current source with no build step),
 * `@insane-forms/examples` to the example modules, `@` to the shadcn/Base UI
 * package.
 *
 * (A `module.rules` override forcing fonts to `asset/resource` used to live
 * here too, meant to stop Docusaurus's default `url-loader` from base64-inlining
 * them. Removed: Docusaurus's font rule is a plain `use: [url-loader]` entry,
 * not `oneOf`-wrapped, so adding a second competing rule for the same test
 * made BOTH apply — webpack emitted the real file under one rule's naming
 * scheme while the OTHER rule's (url-loader's file-loader fallback) JS-string
 * module output got served at that path instead, corrupting every font
 * ("OTS parsing error"). Gzip (static-server.mjs) alone is enough to meet the
 * Lighthouse budget with the fonts inlined — see the landing-page skill. */
export default function workspaceAliasesPlugin(context: LoadContext): Plugin {
  const root = path.resolve(context.siteDir, '../..')
  return {
    name: 'insane-forms-workspace-aliases',
    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@': path.join(root, 'packages/ui'),
            'insane-forms': path.join(root, 'packages/core/src/index.ts'),
            '@insane-forms/examples': path.join(root, 'packages/examples'),
          },
        },
      }
    },
  }
}
