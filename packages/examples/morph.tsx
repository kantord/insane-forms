/** examples/morph.tsx — the landing page's schema-morph story, one step per
 * marker. The build plugin slices each step's source (docs-site rendering
 * only, no Magic Move animation — see the landing-page skill), and the steps
 * are rendered & tested in Storybook — the displayed code can never drift
 * from working code. Bureau chrome via ./profile.
 *
 * Four lessons, each building on the last: (1) bind — a schema and a widget
 * merge into one field (the funnel); (2) customize — a field takes the same
 * .min()/.meta() chaining as any plain Zod schema; (3) compose — fields
 * combine into an object exactly like plain Zod schemas do; (4) inject
 * markup — plain React elements slot in anywhere insane.group() takes a
 * part, not just field definitions.
 *
 * `step:2` deliberately displays ONLY the bare customized field, not the
 * `insane.group({ name: … })` wrapper `Step2` needs to be renderable by
 * ZodForm — introducing insane.group() is step 3's job (compose); showing
 * it here would blur which lesson step 2 is teaching. The wrapper lives
 * under its own `step:2-demo` marker, which nothing in SchemaMorph.tsx
 * reads for display — it exists purely so `Step2` compiles and renders. */

import * as insane from 'insane-forms'
import { useState } from 'react'
import * as z from 'zod'
import { TextField } from './profile'

/* step:1 — plain Zod: data, no UI */
export const Step1 = z.string()

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

/* step:2 — customize: a field takes the same chaining as any Zod schema */
export const NameField = TextField.min(2).meta({
  title: 'Name',
  description: 'At least 2 characters',
})

/* step:2-demo — not displayed on the docs page; makes NameField renderable */
export const Step2 = insane.group({
  name: NameField,
})

/* step:3 — compose: fields combine into an object just like plain Zod schemas */
export const Step3 = insane.group({
  name: TextField.min(2).meta({ title: 'Name' }),
  email: TextField.email().meta({ title: 'Email' }),
})

/* step:4 — inject markup: a plain React element, not a field, slots right in */
export const Step4 = insane.group(
  <h4 className="mb-1 font-display text-lg font-bold tracking-tight text-ink">Contact card</h4>,
  {
    name: TextField.min(2).meta({ title: 'Name' }),
    email: TextField.email().meta({ title: 'Email' }),
  },
)
