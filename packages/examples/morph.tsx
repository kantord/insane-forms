/** examples/morph.tsx — the landing page's schema-morph story, one step per
 * marker. The build plugin slices each step's source (docs-site rendering
 * only, no Magic Move animation — see the landing-page skill), and the steps
 * are rendered & tested in Storybook — the displayed code can never drift
 * from working code. Bureau chrome via ./profile.
 *
 * Atomic on purpose (a single `name` field, not the multi-field Profile
 * object earlier versions used): the story here is "one schema node merges
 * what used to be two separate files" — a funnel narrowing two pieces into
 * one. A multi-field object would suggest COMPOSITION, which is a different
 * lesson the biome showcases below this section already own; keeping this
 * one atomic avoids stepping on that reveal. */

import * as insane from 'insane-forms'
import { useState } from 'react'
import * as z from 'zod'
import { TextField } from './profile'

/* step:1 — plain Zod: data, no UI */
export const Step1 = z.object({
  name: z.string(),
})

/* step:1b — the old way: schema and UI are two separate files, wired by hand */
export function HandWrittenNameInput() {
  const [name, setName] = useState('')
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="a plain, hand-wired input"
      className="w-full border border-dim px-2 py-1.5 text-sm text-ink"
    />
  )
}

/* step:2 — bind a component: the field carries its own widget */
export const Step2 = insane.group({
  name: TextField,
})

/* step:3 — annotate: titles & descriptions live in .meta() */
export const Step3 = insane.group({
  name: TextField.meta({ title: 'Name' }),
})

/* step:4 — validate: plain Zod checks come free */
export const Step4 = insane.group({
  name: TextField.min(2).meta({ title: 'Name' }),
})
