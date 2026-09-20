import { DocsVersionProvider } from '@docusaurus/plugin-content-docs/client'
import renderRoutes from '@docusaurus/renderRoutes'
import type { Props } from '@theme/DocVersionRoot'

/** `docs.docVersionRootComponent`. Single-version site (no versioning
 * configured) — this only needs to provide the version context nested hooks
 * (useDocsVersion) expect, then render through. */
export default function DocVersionRoot(props: Props) {
  return (
    <DocsVersionProvider version={props.version}>
      {renderRoutes(props.route.routes ?? [])}
    </DocsVersionProvider>
  )
}
