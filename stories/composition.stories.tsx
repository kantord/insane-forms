import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { FieldDescription, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import { ShadText } from '../examples/shadcn/fields'
import * as insane from '../src'
import { Demo } from './harness'

/* group / wrap / nesting semantics — the composition rules under manual test. */
const meta: Meta = {
  title: 'Composition',
  tags: ['ai-generated'],
}
export default meta

export const SectionsStayFlat: StoryObj = {
  name: 'wrap(FieldSet) — sections add DOM, data stays flat',
  render: () => {
    const schema = insane.group(
      insane.wrap(
        FieldSet,
        <FieldLegend>Account</FieldLegend>,
        <FieldDescription>How you sign in.</FieldDescription>,
        {
          email: ShadText.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
        },
      ),
      <FieldSeparator />,
      insane.wrap(
        FieldSet,
        <FieldLegend>Shipping</FieldLegend>,
        <FieldDescription>Where orders are delivered.</FieldDescription>,
        {
          address: ShadText.min(1).meta({ title: 'Address', placeholder: '129 Spruce St' }),
        },
      ),
    )
    // z.output: { email, address } — one flat object, no section keys.
    return <Demo title="Settings" schema={schema} submitLabel="Save changes" />
  },
  // Proves the data-flatness claim: sections render as fieldsets, yet the
  // submitted output has email/address at the top level — no section keys.
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email/i), 'm@example.com')
    await userEvent.type(canvas.getByLabelText(/address/i), '129 Spruce St')
    await userEvent.click(canvas.getByRole('button', { name: /save changes/i }))
    const output = await canvas.findByText(/"address": "129 Spruce St"/)
    await expect(output).toBeVisible()
    await expect(output.textContent).not.toMatch(/"Shipping"/)
  },
}

export const ExplicitNesting: StoryObj = {
  name: 'key: group(...) opts into data nesting',
  render: () => {
    const schema = insane.group({
      shipping: insane.group({
        city: ShadText.min(1).meta({ title: 'City', placeholder: 'Portland' }),
        zip: ShadText.regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.').meta({
          title: 'ZIP code',
          placeholder: '97201',
        }),
      }),
    })
    // z.output: { shipping: { city, zip } } — nesting is an explicit choice.
    return <Demo title="Shipping address" schema={schema} submitLabel="Save address" />
  },
}

export const ReusableSections: StoryObj = {
  name: 'Groups compose as fragments',
  render: () => {
    const NameFields = insane.group({
      firstName: ShadText.min(1).meta({ title: 'First name', placeholder: 'Evil' }),
      lastName: ShadText.min(1).meta({ title: 'Last name', placeholder: 'Rabbit' }),
    })
    const schema = insane.group(NameFields, {
      email: ShadText.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
    })
    // NameFields is a reusable value; its shape concatenates into this form.
    return <Demo title="Create account" schema={schema} submitLabel="Create account" />
  },
}
