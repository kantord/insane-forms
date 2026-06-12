/** examples/morph.tsx — the landing page's schema-morph story, one step per
 * marker. The build plugin slices each step's source for the Magic Move
 * animation, and the steps are rendered & tested in Storybook — the displayed
 * code can never drift from working code. Bureau chrome via ./profile. */

import * as z from 'zod'
import * as insane from '../src'
import { CheckField, TextField } from './profile'

/* step:1 — plain Zod: data, no UI */
export const Step1 = z.object({
  name: z.string(),
  email: z.string(),
  newsletter: z.boolean(),
})

/* step:2 — bind components: fields carry their own widgets */
export const Step2 = insane.group({
  name: TextField,
  email: TextField,
  newsletter: CheckField,
})

/* step:3 — annotate: titles & descriptions live in .meta() */
export const Step3 = insane.group({
  name: TextField.meta({ title: 'Name' }),
  email: TextField.meta({ title: 'Email', description: 'We never share it' }),
  newsletter: CheckField.meta({ title: 'Newsletter' }),
})

/* step:4 — validate: plain Zod checks; errors & defaults come free */
export const Step4 = insane.group({
  name: TextField.min(2).meta({ title: 'Name' }),
  email: TextField.email().meta({ title: 'Email', description: 'We never share it' }),
  newsletter: CheckField.default(true).meta({ title: 'Newsletter' }),
})
