import Link from '@docusaurus/Link'
import { useState } from 'react'

export type TreeItem =
  | { type: 'link'; key: string; label: string; href: string; active: boolean }
  | { type: 'category'; key: string; label: string; items: TreeItem[] }

const containsActive = (item: TreeItem): boolean =>
  item.type === 'link' ? item.active : item.items.some(containsActive)

const Category = ({
  item,
  depth,
}: {
  item: Extract<TreeItem, { type: 'category' }>
  depth: number
}) => {
  const active = containsActive(item)
  // Manual toggle is a plain override, not tri-state: a category containing
  // the active page is ALWAYS shown open (you're standing in it), but any
  // other category can be opened by hand to browse into it — otherwise its
  // contents would be permanently unreachable from the sidebar.
  const [manuallyOpen, setManuallyOpen] = useState(false)
  const open = active || manuallyOpen

  return (
    <div style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setManuallyOpen((o) => !o)}
        className="mt-3 mb-1 flex w-full items-center gap-1 border-0 bg-transparent p-0 text-left text-[0.68rem] font-bold uppercase tracking-[0.14em] text-dim hover:text-pop"
      >
        <span
          aria-hidden="true"
          className={`inline-block text-[0.6rem] transition-transform ${open ? 'rotate-90' : ''}`}
        >
          ▸
        </span>
        {item.label}
      </button>
      {open && <TreeItems items={item.items} depth={depth + 1} />}
    </div>
  )
}

/** The one hierarchical sidebar renderer, shared by the "docs" tree
 * (DocSidebarItems.tsx, adapting content-docs' PropSidebarItem[]) and the
 * "explore" tree (Sidebar.tsx, adapting Storybook's index.json) — both used
 * to have their own near-identical implementation. A category expands
 * automatically while it contains the active page, and can otherwise be
 * clicked open/closed to browse — everything else stays collapsed by
 * default so a large tree doesn't dump its whole contents on screen. */
export const TreeItems = ({ items, depth = 0 }: { items: TreeItem[]; depth?: number }) => (
  <>
    {items.map((item) =>
      item.type === 'category' ? (
        <Category key={item.key} item={item} depth={depth} />
      ) : (
        <div key={item.key} style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
          <Link
            to={item.href}
            className={`block px-2 py-1 text-[0.82rem] no-underline ${
              item.active
                ? 'bg-pop font-bold text-paper'
                : 'font-medium text-ink hover:bg-paper-deep'
            }`}
          >
            {item.label}
          </Link>
        </div>
      ),
    )}
  </>
)
