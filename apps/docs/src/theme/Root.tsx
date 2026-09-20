import type { ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'
import '../css/custom.css'
import { DocsSidebarSyncProvider } from '../contexts/DocsSidebarSync'

/** Docusaurus renders this around EVERY route (the documented `src/theme/Root`
 * swizzle point) — the persistent sidebar lives here, not in individual pages,
 * so it's on the landing page too (deliberate: see the landing-page skill).
 * The sidebar and the page both scroll independently inside a fixed-height
 * flex row; `html`/`body` themselves never scroll (custom.css). No
 * theme/preset is registered (see docusaurus.config.ts), so there's no
 * `theme.customCss` hook to register the stylesheet through — this plain
 * import is the only place it's loaded, and it's guaranteed to run for every
 * route since Root wraps everything.
 *
 * `DocsSidebarSyncProvider` wraps BOTH `<Sidebar>` and `{children}` so a doc
 * page (rendered inside `children`, see src/components/docs/DocRoot.tsx) can
 * push its sidebar tree up to the persistent `<Sidebar>` (a sibling) — one
 * merged sidebar, not the doc page's own nested one next to a global one. */
export default function Root({ children }: { children: ReactNode }) {
  return (
    <DocsSidebarSyncProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </DocsSidebarSyncProvider>
  )
}
