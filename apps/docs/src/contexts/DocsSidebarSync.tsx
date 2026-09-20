import type { PropSidebarItem } from '@docusaurus/plugin-content-docs'
import { createContext, type ReactNode, useContext, useState } from 'react'

type Ctx = {
  items: PropSidebarItem[] | null
  setItems: (items: PropSidebarItem[] | null) => void
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
 * ELSE too, so it can be clicked into). */
export const DocsSidebarSyncProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<PropSidebarItem[] | null>(null)
  return <DocsSidebarSyncContext.Provider value={{ items, setItems }}>{children}</DocsSidebarSyncContext.Provider>
}

export const useDocsSidebarSync = () => {
  const ctx = useContext(DocsSidebarSyncContext)
  if (!ctx) throw new Error('useDocsSidebarSync must be used within DocsSidebarSyncProvider')
  return ctx
}
