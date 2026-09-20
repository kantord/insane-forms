import type { LoadContext, Plugin, PostCssOptions } from '@docusaurus/types'
import tailwindPostcss from '@tailwindcss/postcss'

/** Docusaurus builds CSS through webpack + postcss-loader, not Vite — so
 * Tailwind 4 is wired in as a PostCSS plugin rather than `@tailwindcss/vite`.
 * No content config needed: Tailwind 4's automatic source detection walks
 * the whole (single-git-root) monorepo. */
export default function tailwindPostcssPlugin(_context: LoadContext): Plugin {
  return {
    name: 'insane-forms-tailwind-postcss',
    configurePostCss(postcssOptions: PostCssOptions) {
      postcssOptions.plugins.push(tailwindPostcss())
      return postcssOptions
    },
  }
}
