import Link from '@docusaurus/Link'

/** Right-rail "Asides" chrome for a doc article — the handoff's AsideRail
 * organism: an "Asides" header over a rule, then AsideNotes and See-also
 * lists, "empty by default" (its own words) otherwise. "On this page" does
 * NOT live here — see DocItem.tsx's comment for why it moved to the left
 * SidebarNav. No "Note" content yet: there's no real editorial content to
 * put in one with the docs pages still placeholders (`docs/intro.md`,
 * `docs/guides/getting-started.md`) — the fixed "see also" link is the one
 * thing that's genuinely true of every doc page today. */
export const Asides = () => (
  <aside className="hidden w-[280px] shrink-0 flex-col gap-8 border-l-[length:var(--rule-w)] border-line bg-rail px-6 py-[22px] lg:flex">
    <div className="border-b-[length:var(--rule-w)] border-line pb-3 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
      Asides
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
