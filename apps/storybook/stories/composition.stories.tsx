import { InputField } from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { expect, within } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import { demoSubmit } from './demo'

/* group / wrap / nesting semantics — the composition rules under manual test. */
const meta: Meta = {
  title: 'Tests/Composition',
  tags: ['ai-generated'],
  // A behavior test of group/wrap/nesting semantics — bare, no demo-app frame.
  parameters: { demo: { variant: 'none' } },
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
          email: InputField.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
        },
      ),
      <FieldSeparator />,
      insane.wrap(
        FieldSet,
        <FieldLegend>Shipping</FieldLegend>,
        <FieldDescription>Where orders are delivered.</FieldDescription>,
        {
          address: InputField.min(1).meta({ title: 'Address', placeholder: '129 Spruce St' }),
        },
      ),
    )
    // z.output: { email, address } — one flat object, no section keys.
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Save changes
        </Button>
      </ZodForm>
    )
  },
  // Proves the data-flatness claim: sections render as fieldsets, yet the
  // submitted output has email/address at the top level — no section keys.
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email/i), 'm@example.com')
    await userEvent.type(canvas.getByLabelText(/address/i), '129 Spruce St')
    await userEvent.click(canvas.getByRole('button', { name: /save changes/i }))
    const body = within(canvasElement.ownerDocument.body)
    // findByText proves arrival; sonner is mid-animation, so don't assert visibility.
    const output = await body.findByText(/"address": "129 Spruce St"/)
    await expect(output).toBeInTheDocument()
    await expect(output.textContent).not.toMatch(/"Shipping"/)
  },
}

export const ExplicitNesting: StoryObj = {
  name: 'key: group(...) opts into data nesting',
  render: () => {
    const schema = insane.group({
      shipping: insane.group({
        city: InputField.min(1).meta({ title: 'City', placeholder: 'Portland' }),
        zip: InputField.regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.').meta({
          title: 'ZIP code',
          placeholder: '97201',
        }),
      }),
    })
    // z.output: { shipping: { city, zip } } — nesting is an explicit choice.
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Save address
        </Button>
      </ZodForm>
    )
  },
}

export const ReusableSections: StoryObj = {
  name: 'Groups compose as fragments',
  render: () => {
    const NameFields = insane.group({
      firstName: InputField.min(1).meta({ title: 'First name', placeholder: 'Evil' }),
      lastName: InputField.min(1).meta({ title: 'Last name', placeholder: 'Rabbit' }),
    })
    // NameFields is a reusable value; its shape concatenates into this form.
    const schema = insane.group(NameFields, {
      email: InputField.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Create account
        </Button>
      </ZodForm>
    )
  },
}
