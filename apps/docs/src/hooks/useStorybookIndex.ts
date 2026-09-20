import useBaseUrl from '@docusaurus/useBaseUrl'
import { useEffect, useState } from 'react'

export type StorybookEntry = {
  id: string
  title: string
  name: string
  type: 'story' | 'docs'
}

type StorybookIndex = { entries: Record<string, StorybookEntry> }

/** Storybook writes `index.json` (every story + autodocs page it built) into
 * its own static output at build time — fetched here client-side so the
 * sidebar never needs its own story-discovery logic, and doesn't care what
 * order `build:docs`/`build:storybook` ran in (see the landing-page skill). */
export const useStorybookIndex = () => {
  const indexUrl = useBaseUrl('/storybook/index.json')
  const [entries, setEntries] = useState<StorybookEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(indexUrl)
      .then((res) => res.json() as Promise<StorybookIndex>)
      .then((data) => {
        if (!cancelled) setEntries(Object.values(data.entries))
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [indexUrl])

  return entries
}
