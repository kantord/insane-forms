import {
  CheckboxField,
  InputField,
  NativeSelectField,
  RadioField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
  ToggleField,
  ToggleGroupField,
} from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { Button } from '@/components/ui/button'
import { demoSubmit } from './demo'

/* The atomic shadcn/ui form widgets, each in isolation inside a one-field live
 * form. Submit to see the parsed z.output as a toast; submit empty to see the
 * validation path. This list mirrors shadcn's own atomic form primitives. */
/* @code-panel:field-definition — the code panel shows each featured field's
 * binding definition + the example schema, not the form boilerplate. */
const meta: Meta = {
  title: 'Integration examples/shadcn ui/Widgets',
  tags: ['ai-generated'],
  // Low-level, single-field stories: the thin wrapper, stock shadcn (no portal).
  parameters: { demo: { variant: 'none' } },
}
export default meta

export const Input: StoryObj = {
  render: () => {
    const schema = insane.group({
      name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Textarea: StoryObj = {
  render: () => {
    const schema = insane.group({
      bio: TextareaField.max(160).meta({
        title: 'Bio',
        description: 'Max 160 characters.',
        placeholder: 'Tell us a little about yourself',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Checkbox: StoryObj = {
  render: () => {
    const schema = insane.group({
      marketing: CheckboxField.meta({
        title: 'Email me about product updates',
        description: 'You can unsubscribe at any time.',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Select: StoryObj = {
  render: () => {
    const schema = insane.group({
      language: SelectField.enum(['English', 'French', 'German', 'Spanish'])
        .default('English')
        .meta({
          title: 'Language',
          description: 'Options come from the enum — nothing is declared twice.',
        }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const NativeSelect: StoryObj = {
  name: 'Native Select',
  render: () => {
    const schema = insane.group({
      tier: NativeSelectField.enum(['Free', 'Pro', 'Enterprise']).default('Free').meta({
        title: 'Plan tier',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const Radio: StoryObj = {
  name: 'Radio Group',
  render: () => {
    const schema = insane.group({
      plan: RadioField.enum(['Monthly', 'Yearly', 'Lifetime']).default('Yearly').meta({
        title: 'Billing plan',
        description: 'Switch any time.',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const SwitchControl: StoryObj = {
  name: 'Switch',
  render: () => {
    const schema = insane.group({
      notifications: SwitchField.meta({
        title: 'Push notifications',
        description: 'Send alerts to this device.',
      }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const SliderControl: StoryObj = {
  name: 'Slider',
  render: () => {
    const schema = insane.group({
      volume: SliderField.min(0).max(100).default(40).meta({ title: 'Volume' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const ToggleControl: StoryObj = {
  name: 'Toggle',
  render: () => {
    const schema = insane.group({
      bold: ToggleField.meta({ title: 'Bold' }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}

export const ToggleGroupControl: StoryObj = {
  name: 'Toggle Group',
  // Base UI's ToggleGroup root emits aria-orientation on role="group", which axe
  // flags (aria-allowed-attr). It's a vendored-library attribute, not our markup,
  // so scope that one rule off for this story only.
  parameters: {
    demo: { variant: 'none' },
    a11y: { config: { rules: [{ id: 'aria-allowed-attr', enabled: false }] } },
  },
  render: () => {
    // One field, both base types: `.enum(...)` → single-select (a string),
    // `.array(...)` → multi-select (a string[]).
    const schema = insane.group({
      align: ToggleGroupField.enum(['Left', 'Center', 'Right']).default('Left').meta({
        title: 'Alignment',
      }),
      days: ToggleGroupField.array(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
        .default(['Mon', 'Wed'])
        .meta({
          title: 'Active days',
        }),
    })
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
}
