import Link from '@docusaurus/Link'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
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
    className={`block border-l-2 py-1 pl-3 text-[0.78rem] font-bold uppercase tracking-[0.1em] no-underline hover:text-pop ${
      active ? 'border-pop text-pop' : 'border-transparent text-ink'
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
 */
export const Sidebar = () => {
  const entries = useStorybookIndex()
  const location = useLocation()
  const activeId = new URLSearchParams(location.search).get('id')
  const exploreItems = entries ? storybookToTreeItems(entries, activeId) : null
  const docsBase = useBaseUrl('/docs')
  const exploreBase = useBaseUrl('/explore')
  const onDocsPage = location.pathname.startsWith(docsBase)
  const onExplorePage = location.pathname.startsWith(exploreBase)
  const { items: docsItems } = useDocsSidebarSync()

  return (
    <nav className="h-full w-64 shrink-0 overflow-y-auto border-r border-ink bg-paper-deep px-4 py-6 font-mono">
      <Link
        to="/"
        className="text-[0.9rem] font-bold uppercase tracking-[0.14em] text-ink no-underline"
      >
        insane-forms
      </Link>

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
    </nav>
  )
}
