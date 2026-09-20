import renderRoutes from '@docusaurus/renderRoutes'
import type { Props } from '@theme/DocsRoot'

/** Wired in as `docs.docsRootComponent` (docusaurus.config.ts) — no theme
 * involved. Upstream's version (theme-classic) wraps this in `@theme/Layout`
 * (navbar/footer chrome); we don't want that anywhere (src/theme/Root.tsx's
 * persistent sidebar is this site's only global chrome), so this is just a
 * pass-through to the nested routes. See the landing-page skill for why
 * content-docs runs without theme-classic at all — it's the only way to
 * avoid Infima (theme-classic always loads it as a plugin-level client
 * module, regardless of which individual components get swizzled). */
export default function DocsRoot(props: Props) {
  return <>{renderRoutes(props.route.routes ?? [])}</>
}
