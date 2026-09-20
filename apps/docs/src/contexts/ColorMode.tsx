import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

type Mode = 'light' | 'dark'
type Ctx = { mode: Mode; toggle: () => void }

const ColorModeContext = createContext<Ctx | null>(null)
const STORAGE_KEY = 'insane-forms:theme'

const initialMode = (): Mode => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Independent of Docusaurus's own color-mode system on purpose: that lives
 * in `@docusaurus/theme-classic` (`ColorModeProvider`), which this site
 * doesn't register (see the landing-page skill — Infima's CSS cost). This
 * is the same small localStorage-plus-`data-theme`-attribute pattern used
 * elsewhere in this codebase's history for on-page toggles; the actual
 * light/dark VALUES live in packages/examples/biomes.css
 * (`:root[data-theme="dark"]`), not here — this only owns the on/off state.
 *
 * State always STARTS at 'light' (matching what the server rendered, since
 * the server has no way to know the visitor's stored/system preference) and
 * only reads localStorage/matchMedia in an effect, post-mount. Computing the
 * real value during the initial render instead (e.g. `useState(initialMode)`)
 * reads `window` on the client's first render pass but not the server's,
 * so a dark-preferring visitor's client render disagrees with the
 * server-rendered "light mode" text — a real React hydration error (#418),
 * not just a cosmetic flash. This still has a brief flash-of-light-mode for
 * such visitors (documented in the landing-page skill) but no longer an
 * error. */
export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<Mode>('light')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setMode(initialMode())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    document.documentElement.dataset.theme = mode
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode, hydrated])

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return <ColorModeContext.Provider value={{ mode, toggle }}>{children}</ColorModeContext.Provider>
}

export const useColorMode = () => {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider')
  return ctx
}
