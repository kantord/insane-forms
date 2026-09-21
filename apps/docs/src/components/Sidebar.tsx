import Link from '@docusaurus/Link'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import { useColorMode } from '../contexts/ColorMode'
import { useDocsSidebarSync } from '../contexts/DocsSidebarSync'
import { type StorybookEntry, useStorybookIndex } from '../hooks/useStorybookIndex'
import { type TreeItem, TreeItems } from './CollapsibleTree'
import { DocSidebarItems } from './docs/DocSidebarItems'

/** Storybook's flat entry list, keyed by `title` (a slash-separated path,
 * e.g. `Examples/Forms`), grouped into the shared CollapsibleTree shape.
 * Category nodes are pure grouping (a folder is never itself a page); each
 * entry becomes exactly one leaf link. */
// Plain objects, deliberately NOT Map: a Map-keyed version of this exact
// tree-building pattern crashed on first paint in production once before
// (see the landing-page skill) — treat Map as off-limits in this render path.
type Building = { categories: Record<string, Building>; leaves: TreeItem[] }

const storybookToTreeItems = (entries: StorybookEntry[], activeId: string | null): TreeItem[] => {
  const root: Building = { categories: {}, leaves: [] }
  for (const entry of entries) {
    let node = root
    for (const segment of entry.title.split('/')) {
      node.categories[segment] ??= { categories: {}, leaves: [] }
      node = node.categories[segment]
    }
    node.leaves.push({
      type: 'link',
      key: entry.id,
      label: entry.name,
      href: `/explore?id=${entry.id}&mode=${entry.type}`,
      active: activeId === entry.id,
    })
  }
  const toItems = (node: Building, keyPrefix: string): TreeItem[] => [
    ...Object.entries(node.categories).map(
      ([label, child]): TreeItem => ({
        type: 'category',
        key: `${keyPrefix}/${label}`,
        label,
        items: toItems(child, `${keyPrefix}/${label}`),
      }),
    ),
    ...node.leaves,
  ]
  return toItems(root, '')
}

const SectionLink = ({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: string
}) => (
  <Link
    to={to}
    className={`block px-2 py-1 text-[0.82rem] no-underline ${
      active ? 'bg-pop font-bold text-paper' : 'font-medium text-ink hover:bg-paper-deep'
    }`}
  >
    {children}
  </Link>
)

/** The persistent, global sidebar (rendered by src/theme/Root.tsx) — present
 * on every route, landing page included (deliberate; see the landing-page
 * skill). Two sections, fed by two different mechanisms but rendered
 * through the SAME hierarchical tree component (CollapsibleTree.tsx — a
 * category auto-expands while it contains the active page, else collapsed
 * but clickable open):
 *
 * - "docs": the real, hand-authored documentation
 *   (`@docusaurus/plugin-content-docs`, files under apps/docs/docs/). Its
 *   tree only exists once you've navigated into `/docs` at least once (that's
 *   when DocRoot pushes it via DocsSidebarSync) — before that, a single
 *   "guides" link gets you in.
 * - "explore": every Storybook story/autodocs page, fetched from Storybook's
 *   own build-time-generated index.json (useStorybookIndex) and grouped by
 *   title path. See src/pages/explore.tsx for the embed side.
 *
 * `variant="inline"` (src/theme/Root.tsx's mobile menu, below `md`) reuses
 * this exact nav — same links, same tree — inside the page's normal document
 * flow instead of the permanent fixed-width rail: full width, no forced
 * height, a rule-w border on all four sides so it reads as one more of the
 * site's boxed grid sections rather than a floating panel. Two design-system
 * rules ruled out a modal/overlay/drawer here instead: "nothing is
 * `position: fixed`" and "both rails are permanent on every surface" (see
 * the insane-forms-design skill's readme) — this is the in-flow
 * equivalent of the same always-there nav, not a different mechanism. */
export const Sidebar = ({ variant = 'rail' }: { variant?: 'rail' | 'inline' }) => {
  const entries = useStorybookIndex()
  const location = useLocation()
  const activeId = new URLSearchParams(location.search).get('id')
  const exploreItems = entries ? storybookToTreeItems(entries, activeId) : null
  const docsBase = useBaseUrl('/docs')
  const exploreBase = useBaseUrl('/explore')
  const onDocsPage = location.pathname.startsWith(docsBase)
  const onExplorePage = location.pathname.startsWith(exploreBase)
  const { items: docsItems, onThisPage } = useDocsSidebarSync()
  const { mode, toggle } = useColorMode()

  return (
    <nav
      className={
        variant === 'rail'
          ? 'flex h-full w-[266px] shrink-0 flex-col overflow-y-auto border-r-[length:var(--rule-w)] border-line bg-rail px-[18px] py-6 font-mono'
          : 'flex max-h-[70vh] w-full flex-col overflow-y-auto border-[length:var(--rule-w)] border-line bg-rail px-[18px] py-6 font-mono'
      }
    >
      <Link
        to="/"
        className="font-display text-base font-extrabold tracking-tight text-ink no-underline"
      >
        insane-forms
      </Link>

      {onThisPage && (
        <>
          <div className="mt-4 mb-1 text-[0.68rem] uppercase tracking-[0.14em] text-dim">
            on this page
          </div>
          {onThisPage.map((entry) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className="block px-2 py-1 text-[0.82rem] font-medium text-ink no-underline hover:bg-paper-deep"
            >
              {entry.label}
            </a>
          ))}
        </>
      )}

      <div className="mt-4 mb-1 text-[0.68rem] uppercase tracking-[0.14em] text-dim">docs</div>
      {docsItems ? (
        <DocSidebarItems items={docsItems} />
      ) : (
        <SectionLink to="/docs" active={onDocsPage}>
          guides
        </SectionLink>
      )}

      <div className="mt-4 mb-1 text-[0.68rem] uppercase tracking-[0.14em] text-dim">explore</div>
      <SectionLink to="/explore" active={onExplorePage && !activeId}>
        overview
      </SectionLink>
      {exploreItems === null && <p className="mt-2 pl-3 text-[0.8rem] text-dim">loading…</p>}
      {exploreItems && <TreeItems items={exploreItems} />}

      {/* -mx-[18px] + matching px-[18px]: bleeds the rule out to the nav's
       * true edges (it should span the full sidebar width, not stop short
       * at the nav's own content padding) while keeping the text inset the
       * same as everything else above it. */}
      <div className="-mx-[18px] mt-auto flex items-center justify-between border-t-[length:var(--rule-w)] border-line px-[18px] pt-3 text-[0.68rem] text-dim">
        <span>rev 0.1.0</span>
        <span>mit</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="mt-2 flex items-center justify-between text-[0.72rem] text-dim hover:text-pop"
      >
        <span>{mode === 'dark' ? 'dark' : 'light'} mode</span>
        <span aria-hidden="true">{mode === 'dark' ? '●○' : '○●'}</span>
      </button>
    </nav>
  )
}
