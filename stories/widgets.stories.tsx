import type { Meta, StoryObj } from '@storybook/react-vite'
import * as z from 'zod'
import { FieldDescription } from '@/components/ui/field'
import { ShadCheck, ShadNumber, ShadText, ShadTextarea, shadSelect } from '../examples/shadcn/fields'
import * as insane from '../src'
import { Demo } from './harness'

/* Each widget in isolation, inside a one-field live form. Submit to see the
 * parsed output; submit empty to see the validation path. */
const meta: Meta = {
  title: 'Widgets',
}
export default meta

export const Input: StoryObj = {
  render: () => {
    const schema = insane.group({
      name: ShadText.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
    })
    return <Demo title="Input" description="A required text field." schema={schema} />
  },
}

export const InputWithDescription: StoryObj = {
  render: () => {
    const schema = insane.group({
      email: ShadText.email().meta({
        title: 'Email',
        description: "We'll use this to send your receipt.",
        placeholder: 'm@example.com',
      }),
    })
    return <Demo title="Input with description" schema={schema} />
  },
}

export const OptionalInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      website: ShadText.optional().meta({ title: 'Website', placeholder: 'https://example.com' }),
    })
    return (
      <Demo
        title="Optional input"
        description="Submits without a value — optionality comes from the schema."
        schema={schema}
      />
    )
  },
}

export const ReadOnlyInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      apiKey: ShadText.readonly().default('sk-1a2b3c4d').meta({ title: 'API key' }),
    })
    return <Demo title="Read-only input" schema={schema} />
  },
}

export const NumberInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      seats: ShadNumber.int().min(1).max(10).default(1).meta({
        title: 'Seats',
        description: 'Between 1 and 10.',
      }),
    })
    return <Demo title="Number" schema={schema} />
  },
}

export const TextareaField: StoryObj = {
  name: 'Textarea',
  render: () => {
    const schema = insane.group({
      bio: ShadTextarea.max(160).meta({
        title: 'Bio',
        description: 'Max 160 characters.',
        placeholder: 'Tell us a little about yourself',
      }),
    })
    return <Demo title="Textarea" schema={schema} />
  },
}

export const CheckboxField: StoryObj = {
  name: 'Checkbox',
  render: () => {
    const schema = insane.group({
      marketing: ShadCheck.meta({
        title: 'Email me about product updates',
        description: 'You can unsubscribe at any time.',
      }),
    })
    return <Demo title="Checkbox" schema={schema} />
  },
}

export const SelectField: StoryObj = {
  name: 'Select',
  render: () => {
    const schema = insane.group({
      language: shadSelect(
        z.enum(['English', 'French', 'German', 'Spanish']).default('English').meta({
          title: 'Language',
          description: 'Options come from the enum — nothing is declared twice.',
        }),
      ),
    })
    return <Demo title="Select" schema={schema} />
  },
}

export const HiddenField: StoryObj = {
  name: 'Hidden field',
  render: () => {
    const schema = insane.group(
      <FieldDescription>
        The schema also carries a hidden <code>id</code>. It renders no control, yet the parse fills
        its default into the submitted output.
      </FieldDescription>,
      {
        id: insane.hidden(z.string().default('srv-000')),
        name: ShadText.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      },
    )
    return <Demo title="Hidden field" schema={schema} />
  },
}
