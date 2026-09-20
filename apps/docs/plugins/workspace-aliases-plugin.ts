import path from 'node:path'
import type { LoadContext, Plugin } from '@docusaurus/types'

/** Two webpack tweaks that only make sense in THIS workspace:
 *
 * 1. `resolve.alias` — the equivalent of the `resolve.alias` block every
 *    other app here configures for its bundler
 *    (apps/storybook/.storybook/vite.config.ts, formerly apps/landing/vite.config.ts):
 *    `insane-forms` resolves to the core package's SOURCE (not its built
 *    dist, so the demo forms always reflect current source with no build
 *    step), `@insane-forms/examples` to the example modules, `@` to the
 *    shadcn/Base UI package.
 * 2. Font files always emit as separate cacheable files, never base64. Docusaurus's
 *    default webpack rule inlines any font under ~10 KB as a data URI — with
 *    six self-hosted families that put ~110 KB of base64 straight into the
 *    render-blocking stylesheet, which is most of why the Lighthouse LCP
 *    budget (quality-gates skill) failed. Prepending a `asset/resource`-only
 *    rule for font extensions, ahead of Docusaurus's own `oneOf` rule, wins
 *    since webpack's `oneOf` stops at the first match. */
export default function workspaceAliasesPlugin(context: LoadContext): Plugin {
  const root = path.resolve(context.siteDir, '../..')
  return {
    name: 'insane-forms-workspace-aliases',
    configureWebpack() {
      return {
        mergeStrategy: { 'module.rules': 'prepend' },
        module: {
          rules: [
            {
              test: /\.(woff2?|ttf|otf)$/,
              type: 'asset/resource',
            },
          ],
        },
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
