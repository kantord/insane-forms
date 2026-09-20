import Link from '@docusaurus/Link'
import { useLocation } from '@docusaurus/router'
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
            to={`/docs?id=${leaf.id}&mode=${leaf.type}`}
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

/** Persistent sidebar (rendered by src/theme/Root.tsx) listing every
 * Storybook story/autodocs page, grouped by title path. Not Storybook's own
 * manager UI — that has its own sidebar already (linked separately from the
 * masthead) — this is a lighter, same-look-as-the-rest-of-the-site nav that
 * embeds just the story canvas (see src/pages/docs.tsx). */
export const DocsSidebar = () => {
  const entries = useStorybookIndex()
  const location = useLocation()
  const activeId = new URLSearchParams(location.search).get('id')
  const tree = entries ? buildTree(entries) : null

  return (
    <nav className="h-full w-64 shrink-0 overflow-y-auto border-r border-ink bg-paper-deep px-4 py-6 font-mono">
      <Link
        to="/"
        className="text-[0.9rem] font-bold uppercase tracking-[0.14em] text-ink no-underline"
      >
        insane-forms
      </Link>
      <div className="mt-1 mb-4 text-[0.68rem] uppercase tracking-[0.14em] text-dim">docs</div>
      {tree === null && <p className="text-[0.8rem] text-dim">loading…</p>}
      {tree &&
        Object.entries(tree.groups).map(([name, node]) => (
          <Group key={name} name={name} node={node} depth={0} activeId={activeId} />
        ))}
    </nav>
  )
}
