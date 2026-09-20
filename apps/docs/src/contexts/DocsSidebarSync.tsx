import type { PropSidebarItem } from '@docusaurus/plugin-content-docs'
import { createContext, type ReactNode, useContext, useState } from 'react'

export type OnThisPageEntry = { id: string; label: string }

type Ctx = {
  items: PropSidebarItem[] | null
  setItems: (items: PropSidebarItem[] | null) => void
  onThisPage: OnThisPageEntry[] | null
  setOnThisPage: (entries: OnThisPageEntry[] | null) => void
}

const DocsSidebarSyncContext = createContext<Ctx | null>(null)

/** Bridges content-docs' per-route sidebar data (only available INSIDE a
 * `/docs/*` route, via its own `DocsSidebarProvider`) out to the persistent
 * GLOBAL sidebar (src/components/Sidebar.tsx), which renders as a SIBLING of
 * the routed page in src/theme/Root.tsx — a sibling can't read a context a
 * descendant sets up, so this is a second, simple context that
 * DocRoot.tsx (a descendant) writes into and Sidebar.tsx (the sibling)
 * reads. Deliberately NOT content-docs' own `useDocsSidebar()` — that one
 * only works inside a doc route, which is exactly the case we don't have
 * here (the sidebar needs the doc tree while you're browsing everything
 * ELSE too, so it can be clicked into).
 *
 * `onThisPage` rides the same context but is the OPPOSITE persistence shape
 * from `items`: the design system handoff's SidebarNav puts "On this page"
 * (the CURRENT page's own in-page anchors) above the Docs/Examples trees,
 * and it must track whichever page is active right now — any page can push
 * a list (docs articles via their headings, the landing page via its own
 * named sections), and each one clears it on unmount rather than leaving a
 * stale list up once you've navigated away, unlike the docs tree above. */
export const DocsSidebarSyncProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<PropSidebarItem[] | null>(null)
  const [onThisPage, setOnThisPage] = useState<OnThisPageEntry[] | null>(null)
  return (
    <DocsSidebarSyncContext.Provider value={{ items, setItems, onThisPage, setOnThisPage }}>
      {children}
    </DocsSidebarSyncContext.Provider>
  )
}

export const useDocsSidebarSync = () => {
  const ctx = useContext(DocsSidebarSyncContext)
  if (!ctx) throw new Error('useDocsSidebarSync must be used within DocsSidebarSyncProvider')
  return ctx
}
