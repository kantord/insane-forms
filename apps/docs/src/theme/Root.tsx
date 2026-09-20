import { useLocation } from '@docusaurus/router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
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
 * reachable instead through a hamburger button that opens the SAME `<Sidebar>`
 * markup inside a shadcn/Base UI `Sheet` (`packages/ui/components/ui/sheet.tsx`,
 * vendored via the `@` alias — `workspace-aliases-plugin.ts` already pointed
 * this at packages/ui, it was just unused until now). `SheetContent` is
 * stripped of its default popover chrome (bg/border/shadow/width) via
 * className overrides so it's just a positioning + focus-trap + backdrop
 * shell around the real nav, not a second visual language — one nav tree,
 * one set of styles, matching every other "no duplicate sidebar" decision in
 * this file. Closes on route change (`useLocation().pathname`) since Root
 * persists across client-side navigation and the Sheet wouldn't otherwise
 * know the visitor just followed a link inside it.
 *
 * `SheetContent`'s default slide-in relies on the CSS `@starting-style`
 * enter transition (its `data-starting-style:translate-x-[-2.5rem]` /
 * `opacity-0` classes) — confirmed via computed style that it gets stuck at
 * that starting state (`translate: -40px`, `opacity: 0`) rather than
 * transitioning to resting open, so the panel opens fully invisible and
 * off-canvas. Pinned via an inline `style` (wins over any class, no
 * Tailwind-merge ambiguity) instead of debugging the transition further —
 * this trades the slide-in animation for a panel that reliably shows up. */
export default function Root({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { pathname, hash } = useLocation()

  // `hash` too, not just `pathname` — most links in this nav (the "on this
  // page" group) are same-page anchors, which don't change `pathname` at all.
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
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="max-w-none border-none bg-transparent p-0 shadow-none"
              style={{ width: 266, left: 0, translate: '0', opacity: 1 }}
            >
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-paper text-ink">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="flex shrink-0 items-center gap-2 border-b-[length:var(--rule-w)] border-line px-4 py-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink md:hidden"
            >
              <span aria-hidden="true">☰</span> menu
            </button>
            {children}
          </div>
        </div>
      </DocsSidebarSyncProvider>
    </ColorModeProvider>
  )
}
