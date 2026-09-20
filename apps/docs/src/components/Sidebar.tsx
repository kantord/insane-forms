import Link from '@docusaurus/Link'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import { useDocsSidebarSync } from '../contexts/DocsSidebarSync'
import { DocSidebarItems } from './docs/DocSidebarItems'
import { useStorybookIndex } from '../hooks/useStorybookIndex'

type TreeNode = {
  groups: Record<string, TreeNode>
  leaves: Array<{ id: string; name: string; type: 'story' | 'docs' }>
}

const buildTree = (
  entries: Array<{ id: string; title: string; name: string; type: 'story' | 'docs' }>,
) => {
  const root: TreeNode = { groups: {}, leaves: [] }
  for (const entry of entries) {
    let node = root
    for (const segment of entry.title.split('/')) {
      node.groups[segment] ??= { groups: {}, leaves: [] }
      node = node.groups[segment]
    }
    node.leaves.push(entry)
  }
  return root
}

const Group = ({
  name,
  node,
  depth,
  activeId,
}: {
  name: string
  node: TreeNode
  depth: number
  activeId: string | null
}) => (
  <div style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
    <div className="mt-3 mb-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-dim">
      {name}
    </div>
    {Object.entries(node.groups).map(([childName, child]) => (
      <Group key={childName} name={childName} node={child} depth={depth + 1} activeId={activeId} />
    ))}
    <ul className="m-0 list-none p-0">
      {node.leaves.map((leaf) => (
        <li key={leaf.id}>
          <Link
            to={`/explore?id=${leaf.id}&mode=${leaf.type}`}
            className={`block border-l-2 py-1 pl-3 text-[0.82rem] no-underline hover:text-pop ${
              activeId === leaf.id ? 'border-pop font-bold text-pop' : 'border-transparent text-ink'
            }`}
          >
            {leaf.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

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
 * skill). Two sections, fed by two different mechanisms but rendered as ONE
 * merged nav (no separate doc-page-local sidebar — see DocRoot.tsx and
 * contexts/DocsSidebarSync.tsx):
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
  const tree = entries ? buildTree(entries) : null
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
      {tree === null && <p className="mt-2 pl-3 text-[0.8rem] text-dim">loading…</p>}
      {tree &&
        Object.entries(tree.groups).map(([name, node]) => (
          <Group key={name} name={name} node={node} depth={0} activeId={activeId} />
        ))}
    </nav>
  )
}
