import type { ReactNode } from 'react'
import { DocsSidebar } from '../components/DocsSidebar'
import '../css/custom.css'

/** Docusaurus renders this around EVERY route (the documented `src/theme/Root`
 * swizzle point) — the persistent sidebar lives here, not in individual pages,
 * so it's on the landing page too (deliberate: see the landing-page skill).
 * The sidebar and the page both scroll independently inside a fixed-height
 * flex row; `html`/`body` themselves never scroll (custom.css). */
export default function Root({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <DocsSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
