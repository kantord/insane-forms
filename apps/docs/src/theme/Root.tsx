import { useLocation } from '@docusaurus/router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import '../css/custom.css'
import { ColorModeProvider } from '../contexts/ColorMode'
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
 * merged sidebar, not the doc page's own nested one next to a global one.
 *
 * Below `md`, the fixed 266px `<Sidebar>` would eat most of a phone
 * viewport (confirmed: 124px left for content at 390px wide) — hidden there,
 * reachable instead through a toggle that renders the SAME `<Sidebar>`
 * (`variant="inline"`, see Sidebar.tsx) in normal document flow, right below
 * the toggle. Deliberately NOT a modal/overlay/drawer: the design system
 * (insane-forms-design skill's readme) states "nothing is `position: fixed`"
 * and "both rails are permanent on every surface... a deliberate corrective
 * to sites whose marketing page and docs feel like different products" — a
 * floating panel with a backdrop is a different visual language (and a
 * different mechanism) from this site's grid of ruled, bordered boxes. An
 * earlier version of this used a shadcn/Base UI `Sheet` for exactly that
 * floating-panel pattern; reverted once the style mismatch was pointed out.
 * Closes on route change AND hash change (`useLocation()`) — most links in
 * this nav are same-page anchors, which change `hash` without changing
 * `pathname`. */
export default function Root({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname, hash])

  return (
    <ColorModeProvider>
      <DocsSidebarSyncProvider>
        <div className="flex h-screen">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-paper text-ink">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              className="flex shrink-0 items-center gap-2 border-b-[length:var(--rule-w)] border-line px-4 py-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink md:hidden"
            >
              <span aria-hidden="true">☰</span> menu
            </button>
            {mobileNavOpen && (
              <div id="mobile-nav" className="shrink-0 md:hidden">
                <Sidebar variant="inline" />
              </div>
            )}
            {children}
          </div>
        </div>
      </DocsSidebarSyncProvider>
    </ColorModeProvider>
  )
}
