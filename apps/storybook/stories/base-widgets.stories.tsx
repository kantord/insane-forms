import {
  CheckboxField,
  DateField,
  InputField,
  NativeSelectField,
  NumberField,
  OtpField,
  RadioField,
  SearchField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
  ToggleGroupField,
} from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { expect, within } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { FieldDescription } from '@/components/ui/field'
import { demoSubmit } from './demo'

/* Each widget in isolation, inside a one-field live form. Submit to see the
 * parsed z.output as a toast; submit empty to see the validation path. */
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

export const InputWithDescription: StoryObj = {
  render: () => {
    const schema = insane.group({
      email: InputField.email().meta({
        title: 'Email',
        description: "We'll use this to send your receipt.",
        placeholder: 'm@example.com',
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

export const OptionalInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      website: InputField.optional().meta({ title: 'Website', placeholder: 'https://example.com' }),
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

export const ReadOnlyInput: StoryObj = {
  render: () => {
    const schema = insane.group({
      apiKey: InputField.readonly().default('sk-1a2b3c4d').meta({ title: 'API key' }),
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

export const NumberInput: StoryObj = {
  name: 'Number',
  render: () => {
    const schema = insane.group({
      seats: NumberField.int().min(1).max(10).default(1).meta({
        title: 'Seats',
        description: 'Between 1 and 10.',
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
        name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      },
    )
    return (
      <ZodForm schema={schema} className="flex flex-col gap-6" onSubmit={demoSubmit}>
        <Button type="submit" className="self-start">
          Submit
        </Button>
      </ZodForm>
    )
  },
  // Proves the hidden field's default survives parse into the submitted output
  // even though no control rendered for it. The toast portals to document.body.
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/name/i), 'Evil Rabbit')
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }))
    const body = within(canvasElement.ownerDocument.body)
    // findByText proves arrival; sonner is mid-animation, so don't assert visibility.
    await expect(await body.findByText(/srv-000/)).toBeInTheDocument()
  },
}

export const SearchInput: StoryObj = {
  name: 'Search',
  render: () => {
    const schema = insane.group({
      q: SearchField.meta({ title: 'Search', placeholder: 'Search…' }),
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
  name: 'Native select',
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

export const ToggleGroupControl: StoryObj = {
  name: 'Toggle group',
  // Base UI's ToggleGroup root emits aria-orientation on role="group", which axe
  // flags (aria-allowed-attr). It's a vendored-library attribute, not our markup,
  // so scope that one rule off for this story only.
  parameters: {
    demo: { variant: 'none' },
    a11y: { config: { rules: [{ id: 'aria-allowed-attr', enabled: false }] } },
  },
  render: () => {
    // Toggle groups are multi-select: an array of the chosen options.
    const schema = insane.group({
      days: ToggleGroupField.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
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

export const Otp: StoryObj = {
  name: 'OTP',
  render: () => {
    const schema = insane.group({
      code: OtpField.length(6).meta({
        title: 'Verification code',
        description: 'Check your email.',
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

export const DatePicker: StoryObj = {
  name: 'Calendar (date)',
  render: () => {
    const schema = insane.group({
      when: DateField.meta({ title: 'Event date' }),
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

export const CssCheck: StoryObj = {
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
  // The submit Button uses bg-primary (--primary: oklch(0.205 0 0) in the zinc
  // theme) — this fails if Tailwind / globals.css did not load in the preview.
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i })
    await expect(getComputedStyle(button).backgroundColor).toBe('oklch(0.205 0 0)')
  },
}
