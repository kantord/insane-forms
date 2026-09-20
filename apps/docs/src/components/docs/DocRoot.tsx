import { DocsSidebarProvider, useDocRootMetadata } from '@docusaurus/plugin-content-docs/client'
import type { Props } from '@theme/DocRoot'
import { useEffect } from 'react'
import { useDocsSidebarSync } from '../../contexts/DocsSidebarSync'

/** `docs.docRootComponent`. No local sidebar column here — the doc tree
 * renders in the PERSISTENT global sidebar instead (src/components/Sidebar.tsx),
 * merged with its "explore" section, so there's one sidebar on doc pages, not
 * two. `useEffect` pushes this route's `sidebarItems` up to that sidebar via
 * DocsSidebarSync (a plain second context — content-docs' own
 * `DocsSidebarProvider`/`useDocsSidebar()` only work INSIDE this subtree, and
 * the global sidebar is a sibling of it, not a descendant). Cleared on
 * unmount so leaving `/docs` drops the tree back to just the "guides" link.
 *
 * No `@theme/NotFound/Content` fallback for a missing route here (upstream
 * has one) — `onBrokenLinks: 'throw'` (docusaurus.config.ts) already fails
 * the build on a dangling doc link, so this case shouldn't reach runtime. */
export default function DocRoot(props: Props) {
  const metadata = useDocRootMetadata(props)
  const { setItems } = useDocsSidebarSync()
  const sidebarItems = metadata?.sidebarItems ?? null

  useEffect(() => {
    setItems(sidebarItems)
    return () => setItems(null)
  }, [sidebarItems, setItems])

  if (!metadata) return null
  const { docElement, sidebarName } = metadata

  return (
    <DocsSidebarProvider name={sidebarName} items={metadata.sidebarItems}>
      <div className="mx-auto max-w-[820px] px-10 py-10">{docElement}</div>
    </DocsSidebarProvider>
  )
}
