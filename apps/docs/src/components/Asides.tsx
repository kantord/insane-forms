import Link from '@docusaurus/Link'

/** Right-rail "Asides" chrome — the handoff's AsideRail organism: an
 * "Asides" header over a rule, then AsideNotes and See-also lists, "empty by
 * default" (its own words) otherwise. Rendered persistently from
 * src/theme/Root.tsx (like the left `<Sidebar>`), on every surface except
 * `/explore` — "both rails are permanent on every surface, landing
 * included" (insane-forms-design skill's readme); it used to be rendered
 * only inside DocItem.tsx, scoped to a single article's height, which is
 * also why it was missing on the landing page entirely. "On this page" does
 * NOT live here — see DocItem.tsx's comment for why it moved to the left
 * SidebarNav. No "Note" content yet: there's no real editorial content to
 * put in one with the docs pages still placeholders (`docs/intro.md`,
 * `docs/guides/getting-started.md`) — the fixed "see also" link is the one
 * thing that's genuinely true of every page today.
 *
 * No explicit height here, deliberately — Root.tsx no longer wraps this in
 * a fixed-height row (the page scrolls natively; only `<Sidebar>` is
 * `sticky`+viewport-height). This rail just stretches to match its flex
 * row's natural height (default `align-items: stretch`, no height math
 * needed), so its border/background run the full page length without this
 * rail scrolling independently of the content beside it. */
export const Asides = () => (
  <aside className="hidden w-[280px] shrink-0 flex-col gap-8 border-l-[length:var(--rule-w)] border-line bg-rail px-6 pt-12 pb-[22px] lg:flex">
    {/* No "Asides" label — just the rule, positioned to align with the
     * hero's TopBar border-b in the center column. A hand-tuned `mt-[Npx]`
     * offset here drifted a few px off in practice (magic numbers rot the
     * moment either side's spacing changes) — instead this row is built
     * from the EXACT same box model as TopBar (`pt-12` on the aside itself,
     * matching `#overview`'s own `pt-12`; identical `px-6 py-2
     * text-[0.72rem] font-semibold uppercase tracking-[0.14em]` on the row)
     * so the two borders land at the same Y by construction, not by
     * measurement. `&nbsp;` gives it the same line-box height as TopBar's
     * real text without showing anything. -mx-6 (matching px-6 on close):
     * bleeds it to the aside's true edges. */}
    <div className="-mx-6 border-b-[length:var(--rule-w)] border-line px-6 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-dim">
      &nbsp;
    </div>
    <div>
      <div className="mb-3 text-[0.68rem] uppercase tracking-[0.16em] text-dim">See also</div>
      <Link
        className="text-[0.82rem] font-semibold text-ink no-underline hover:text-pop"
        to="/explore"
      >
        component explorer
      </Link>
    </div>
  </aside>
)
