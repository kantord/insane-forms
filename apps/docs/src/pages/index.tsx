import Head from '@docusaurus/Head'
import Link from '@docusaurus/Link'
import { useEffect } from 'react'
import { SchemaMorph } from '../components/SchemaMorph'
import { useDocsSidebarSync } from '../contexts/DocsSidebarSync'

/** Real anchors into this page's own sections — pushed to the persistent
 * SidebarNav's "on this page" group (see the landing-page skill), matching
 * the design system handoff's SidebarNav organism, which every page carries.
 * Labels describe what's actually on the page today, not the mockup's
 * guessed labels for a page that doesn't have this exact structure. */
const ON_THIS_PAGE = [
  { id: 'overview', label: 'Overview' },
  { id: 'principles', label: 'Principles' },
  { id: 'morph', label: 'Schema → form' },
] as const

const PRINCIPLES = [
  [
    'matchless rendering',
    'Every node carries its renderer in .meta({ component }). The core never switches on schema type.',
  ],
  [
    'zero DOM in core',
    'Shells, list chrome, widgets — all user code. The library ships behavior, you ship the looks.',
  ],
  [
    'draft vs submit',
    'The form edits the z.input draft; onSubmit receives parsed z.output. Hidden defaults fill at parse.',
  ],
  [
    'tree-shakeable',
    'Named exports only. Import the resolve toolkit alone: ~0.7 kB, zero react-hook-form in the bundle.',
  ],
] as const

export default function Home() {
  const { setOnThisPage } = useDocsSidebarSync()
  useEffect(() => {
    setOnThisPage([...ON_THIS_PAGE])
    return () => setOnThisPage(null)
  }, [setOnThisPage])

  return (
    <>
      <Head>
        <title>the schema is the form. | insane-forms</title>
        <meta
          name="description"
          content="insane-forms — schema-driven React forms on plain Zod. The schema is the form."
        />
        <html lang="en" />
      </Head>
      <div className="bg-paper font-mono text-[15px] leading-relaxed text-ink">
        {/* ---- hero + principles ---- */}
        <div id="overview" className="pt-12">
          {/* TopBar organism (design system handoff §7): right-aligned
           * external links only, no wordmark — the persistent sidebar
           * (rendered alongside every page, landing included) already
           * carries it, and this is the shared shell contract. Full-width,
           * own `px-6` gutter — NOT nested in the max-w-1180 column below,
           * so its rule reaches the sidebar/aside edges on both sides
           * instead of stopping at the reading column's width (matches the
           * reference Landing.jsx: TopBar is a sibling row above the padded
           * hero block, not inside it). */}
          <div className="flex justify-end gap-6 border-b-[length:var(--rule-w)] border-line px-6 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-dim">
            <Link className="hover:text-pop" href="pathname://./storybook/">
              storybook
            </Link>
            <a className="hover:text-pop" href="https://github.com/kantord/insane-forms">
              github
            </a>
          </div>
          <div className="mx-auto max-w-[1180px] px-6">
            <header>
              {/* `w-fit` + `mx-auto`: without a width cap the h1's flex column
               * stretches to the full content column, so `self-start`/
               * `self-end` push the two lines to opposite ends with a huge
               * empty gap between them. Fitting the box to its own (wider)
               * line's content width makes the second, shorter line sit
               * flush against the same edge instead — then `mx-auto` centers
               * that tightly-fit block in the column. */}
              <h1 className="mx-auto my-9 flex w-fit flex-col font-display text-[clamp(3rem,8vw,6rem)] font-black leading-[0.9] tracking-tighter">
                <span className="self-start">
                  the schema <span className="text-pop">is</span>{' '}
                </span>
                <span className="self-end">the form.</span>
              </h1>

              <p className="mb-7 max-w-2xl text-[1.02rem]">
                <strong>insane-forms</strong> renders React forms straight from plain Zod schemas.
                No JSON dialect, no renderer registry, no match statement — each schema node carries
                its own component, and React does the traversal.
              </p>

              <div className="mb-10 flex flex-wrap items-center gap-6">
                <span className="border-2 border-pop px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.18em] text-pop">
                  zod 4 · react 19
                </span>
                <code className="select-all bg-ink px-4 py-[13px] text-[0.9rem] text-paper">
                  pnpm add insane-forms
                </code>
              </div>
            </header>
          </div>

          {/* Full-width, same reason as TopBar above: nested in the max-w
           * column, the box's own border stopped short of the sidebar/aside
           * edges instead of reaching them. `p-5` on each cell is the ONLY
           * margin now — pushed "inside" the box instead of held outside it
           * as column padding.
           *
           * `border-t` only, no `border-b`/`border-l`/`border-r` on the
           * outer box: every OTHER section boundary on this page is marked
           * exactly once, via the border-TOP of the section that follows
           * (SchemaMorph's own border-t is what ends this box, immediately
           * below with no `pb-*` gap left on `#overview` for it to float
           * in) — a border-b here would double up against that. Left/right
           * would double up against the sidebar's own border-r and the
           * aside's own border-l, now that this box is full-bleed between
           * them.
           *
           * Row dividers (`li`'s border-b) use `nth-last-child` scoped per
           * breakpoint's own column count (2 at `sm`, 4 at `lg`) — `last:`
           * alone only matches the single DOM-last item, correct for the
           * 1-column mobile layout but leaving a stray border under item 3
           * (not paired with item 4) once the grid wraps to 2 columns.
           * Column dividers (`li`'s border-r) use the same `nth-child`
           * approach for the mirror reason: the RIGHTMOST column in each
           * row would otherwise double up against the aside's border-l
           * (sm: item 2 of 2; lg: item 4 of 4 — re-adding it at `lg` since
           * `sm:`'s removal would otherwise still apply at `lg` too). */}
          <ul
            id="principles"
            className="grid list-none grid-cols-1 border-t-[length:var(--rule-w)] border-line p-0 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PRINCIPLES.map(([term, body]) => (
              <li
                key={term}
                className="border-b-[length:var(--rule-w)] border-line p-5 last:border-b-0 sm:border-r-[length:var(--rule-w)] sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r-[length:var(--rule-w)] lg:[&:nth-child(4n)]:border-r-0"
              >
                <h3 className="mb-1.5 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-pop">
                  {term}
                </h3>
                <p className="m-0 text-[0.84rem] text-dim">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- watch a schema become a form (click through the steps) ---- */}
        <SchemaMorph />

        {/* ---- design biomes: removed for now (temporary — the biome
         * showcases and their live demos still exist as working components
         * in src/components/Showcase.tsx/BiomeDemos.tsx/CodePane.tsx, just
         * not rendered on this page). The e2e tests that exercised them are
         * skipped, not deleted, in apps/docs/e2e/docs-page.spec.ts. */}

        {/* ---- footer ---- */}
        {/* FooterBar organism: repo link left, mono note right, above a
         * single top rule (design system handoff §7) — full-width like
         * TopBar, not capped/centered: the reference FooterBar has no
         * max-width of its own, it's the content column's own edge. */}
        <footer className="flex flex-wrap justify-between gap-4 border-t-[length:var(--rule-w)] border-line px-6 py-6 text-[0.72rem] uppercase tracking-[0.14em] text-dim">
          <a className="text-pop hover:underline" href="https://github.com/kantord/insane-forms">
            github.com/kantord/insane-forms
          </a>
          <span>the same example drives the automated suite</span>
        </footer>
      </div>
    </>
  )
}
