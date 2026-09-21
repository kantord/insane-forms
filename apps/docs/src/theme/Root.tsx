import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Asides } from '../components/Asides'
import { Sidebar } from '../components/Sidebar'
import '../css/custom.css'
import { ColorModeProvider } from '../contexts/ColorMode'
import { DocsSidebarSyncProvider } from '../contexts/DocsSidebarSync'

/** Docusaurus renders this around EVERY route (the documented `src/theme/Root`
 * swizzle point) — the persistent sidebar lives here, not in individual pages,
 * so it's on the landing page too (deliberate: see the landing-page skill).
 * No theme/preset is registered (see docusaurus.config.ts), so there's no
 * `theme.customCss` hook to register the stylesheet through — this plain
 * import is the only place it's loaded, and it's guaranteed to run for every
 * route since Root wraps everything.
 *
 * The PAGE scrolls natively (`html`/`body`, normal document flow) — an
 * earlier version instead gave the sidebar and the page each their own
 * fixed-height `overflow-y-auto` container (a `flex h-screen` row), which
 * looked broken once every section grew an explicit border: independent
 * scroll positions meant the ruled boxes never read as one continuous page,
 * closer to an app shell with panes than a document. The reference
 * `DocsShell.jsx` (insane-forms-design skill) confirms this — its outer row
 * is `minHeight: '100%'`, not a fixed height, i.e. it's meant to grow with
 * content and let the document scroll. `<Sidebar>` is the one exception:
 * `sticky top-0 h-screen` (its wrapper below) so it stays pinned to the
 * viewport while the page scrolls past it, with its OWN `overflow-y-auto`
 * (Sidebar.tsx) for when the nav tree itself is taller than one screen.
 * `<Asides>` is deliberately NOT sticky — it's normal flow, scrolls away
 * with the page like the reference `AsideNote`'s `offset` prop implies
 * (a note positioned at a page-flow Y offset only makes sense if the rail
 * scrolls with that content, not if it's pinned independently). `/explore`
 * is the one route that keeps the old fixed-viewport, no-page-scroll model
 * (below) — it's a full-bleed embedded Storybook iframe, not a document.
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
 * `pathname`.
 *
 * `<Asides>` (the right rail) is ALSO persistent/global now, not just a
 * docs-article thing — the design system's readme states "both rails are
 * permanent on every surface... a deliberate corrective to sites whose
 * marketing page and docs feel like different products," and its absence on
 * the landing page was exactly why capped-width elements there (the "part
 * two" bar, TopBar) read as floating in unbounded empty space on wide
 * screens instead of sitting bounded between two rail edges. Hidden on
 * `/explore`: that route is a full-bleed embedded Storybook iframe, and a
 * generic "see also: component explorer" link makes no sense while already
 * inside the explorer. DocItem.tsx used to render its own `<Asides>` scoped
 * to just the article's height — removed in favor of this one, page-height
 * instance. */
export default function Root({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const exploreBase = useBaseUrl('/explore')
  const onExplorePage = pathname.startsWith(exploreBase)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname, hash])

  const contentClassName = onExplorePage
    ? 'flex h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-paper text-ink'
    : 'flex min-w-0 flex-1 flex-col bg-paper text-ink'

  return (
    <ColorModeProvider>
      <DocsSidebarSyncProvider>
        <div className="flex min-h-screen">
          <div className="hidden md:sticky md:top-0 md:flex md:h-screen">
            <Sidebar />
          </div>
          <div className={contentClassName}>
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
          {!onExplorePage && <Asides />}
        </div>
      </DocsSidebarSyncProvider>
    </ColorModeProvider>
  )
}
