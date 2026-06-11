import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import * as z from 'zod'
import { FieldDescription, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field'
import {
  ShadCheck,
  ShadText,
  ShadTextarea,
  ShadcnListBox,
  shadSelect,
} from '../examples/shadcn/fields'
import * as insane from '../src'
import { Demo } from './harness'

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
          name: ShadText.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
          email: ShadText.email().meta({
            title: 'Email',
            description: "We'll never share your email with anyone.",
            placeholder: 'm@example.com',
          }),
          bio: ShadTextarea.max(160).optional().meta({
            title: 'Bio',
            placeholder: 'Tell us a little about yourself',
          }),
        },
      ),
      <FieldSeparator />,
      insane.wrap(
        FieldSet,
        <FieldLegend>Notifications</FieldLegend>,
        {
          frequency: shadSelect(
            z.enum(['Every email', 'Daily digest', 'Weekly digest']).default('Daily digest').meta({
              title: 'Email frequency',
            }),
          ),
          marketing: ShadCheck.meta({
            title: 'Email me about product updates',
            description: 'You can unsubscribe at any time.',
          }),
        },
      ),
    )
    return (
      <Demo
        title="Settings"
        description="Manage your profile and notification preferences."
        schema={schema}
        submitLabel="Save changes"
      />
    )
  },
  // Proves the validation path: submitting empty surfaces field errors as
  // role=alert through shadcn's FieldError, and nothing is submitted.
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /save changes/i }))
    const alerts = await canvas.findAllByRole('alert')
    await expect(alerts.length).toBeGreaterThanOrEqual(2)
    await expect(canvas.queryByText(/Submitted values/)).not.toBeInTheDocument()
  },
}

export const Contacts: StoryObj = {
  render: () => {
    const Contact = insane.group({
      name: ShadText.min(1).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      email: ShadText.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
    })
    const schema = insane.group({
      contacts: insane.list(Contact, { wrapper: ShadcnListBox }).min(1).max(3),
    })
    return (
      <Demo
        title="Emergency contacts"
        description="Add up to three people we can reach if something goes wrong."
        schema={schema}
        defaults={{ contacts: [{}] }}
        submitLabel="Save contacts"
      />
    )
  },
}

type Category = { name: string; children: Category[] }

export const Categories: StoryObj = {
  name: 'Categories — recursive schema',
  render: () => {
    const CategorySchema: z.ZodType<Category> = z.lazy(() =>
      insane.group({
        name: ShadText.min(1).meta({ title: 'Name', placeholder: 'Documentation' }),
        children: insane.list(CategorySchema, { wrapper: ShadcnListBox }).meta({
          title: 'Subcategories',
        }),
      }),
    )
    // z.lazy renders exactly as deep as the data goes — add rows to grow the tree.
    return (
      <Demo
        title="Categories"
        description="Organize content into nested categories."
        schema={CategorySchema}
        defaults={{ name: 'Docs', children: [{ name: 'Guides', children: [] }] }}
        submitLabel="Save categories"
      />
    )
  },
}
