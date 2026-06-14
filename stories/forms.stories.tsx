import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import { ZodForm } from '../examples/react-hook-form'
import {
  CheckboxField,
  FieldSetList,
  InputField,
  selectField,
  TextareaField,
} from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'

/* Full worked forms — the shapes real apps ship. */
const meta: Meta = {
  title: 'Forms',
  tags: ['ai-generated'],
}
export default meta

export const Profile: StoryObj = {
  render: () => {
    const schema = insane.group(
      // Hidden record id: never shown, parse fills it into the output.
      { id: insane.hidden(z.string().default('usr_1a2b3c')) },
      insane.wrap(
        FieldSet,
        <FieldLegend>Profile</FieldLegend>,
        <FieldDescription>This is how others will see you on the site.</FieldDescription>,
        {
          name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
          email: InputField.email().meta({
            title: 'Email',
            description: "We'll never share your email with anyone.",
            placeholder: 'm@example.com',
          }),
          bio: TextareaField.max(160).optional().meta({
            title: 'Bio',
            placeholder: 'Tell us a little about yourself',
          }),
        },
      ),
      <FieldSeparator />,
      insane.wrap(FieldSet, <FieldLegend>Notifications</FieldLegend>, {
        frequency: selectField(
          z.enum(['Every email', 'Daily digest', 'Weekly digest']).default('Daily digest').meta({
            title: 'Email frequency',
          }),
        ),
        marketing: CheckboxField.meta({
          title: 'Email me about product updates',
          description: 'You can unsubscribe at any time.',
        }),
      }),
    )
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Save changes
        </Button>
      </ZodForm>
    )
  },
  // Proves the validation path: submitting empty surfaces field errors as
  // role=alert through shadcn's FieldError, and nothing is submitted.
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /save changes/i }))
    const alerts = await canvas.findAllByRole('alert')
    await expect(alerts.length).toBeGreaterThanOrEqual(2)
    const body = within(canvasElement.ownerDocument.body)
    await expect(body.queryByText(/"id": "usr_1a2b3c"/)).not.toBeInTheDocument()
  },
}

export const Contacts: StoryObj = {
  render: () => {
    const Contact = insane.group({
      name: InputField.min(1).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      email: InputField.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
    })
    const schema = insane.group({
      contacts: insane.list(Contact, { wrapper: FieldSetList }).min(1).max(3),
    })
    return (
      <ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{ contacts: [{}] }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save contacts
        </Button>
      </ZodForm>
    )
  },
}

type Category = { name: string; children: Category[] }

export const Categories: StoryObj = {
  name: 'Categories — recursive schema',
  render: () => {
    const CategorySchema: z.ZodType<Category> = z.lazy(() =>
      insane.group({
        name: InputField.min(1).meta({ title: 'Name', placeholder: 'Documentation' }),
        children: insane.list(CategorySchema, { wrapper: FieldSetList }).meta({
          title: 'Subcategories',
        }),
      }),
    )
    // z.lazy renders exactly as deep as the data goes — add rows to grow the tree.
    return (
      <ZodForm
        schema={CategorySchema}
        className="flex flex-col gap-6"
        defaults={{ name: 'Docs', children: [{ name: 'Guides', children: [] }] }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save categories
        </Button>
      </ZodForm>
    )
  },
}
