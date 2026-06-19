import {
  CheckboxField,
  InputField,
  RadioField,
  SelectField,
  SliderField,
  SwitchField,
} from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { Button } from '@/components/ui/button'
import { demoSubmit } from './demo'

/* Shells, not widgets: a shell is the chrome around a control — it places the
 * label, description and error, and is chosen per control SHAPE, not per widget.
 * One shell serves many widgets (reuse), and several shells exist because the
 * shapes differ: a labelable control, a checkbox-like control beside its label,
 * a composite group with a legend. Each story reuses one shell across two
 * different widgets; the code panel shows that shell's definition + the form. */
/* @code-panel:shell-definition — the panel shows the shell the story's fields use,
 * then the render body as a usage example. */
const meta: Meta = {
  title: 'Integration examples/shadcn ui/Shells',
  tags: ['ai-generated'],
  parameters: { demo: { variant: 'none' } },
}
export default meta

export const FieldShellStory: StoryObj = {
  name: 'Field shell',
  // The default vertical shell: label on top, then the control, description, error.
  // Reused by every labelable single control (Input, Select, Textarea, …).
  render: () => {
    const schema = insane.group({
      name: InputField.min(2).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      language: SelectField.enum(['English', 'French']).default('English').meta({
        title: 'Language',
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

export const CheckboxShellStory: StoryObj = {
  name: 'Checkbox shell',
  // Horizontal shell: the control sits first, label beside it — the right shape
  // for checkbox-like toggles. Reused by Checkbox and Switch.
  render: () => {
    const schema = insane.group({
      marketing: CheckboxField.meta({ title: 'Email me about product updates' }),
      notifications: SwitchField.meta({ title: 'Push notifications' }),
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

export const GroupShellStory: StoryObj = {
  name: 'Group shell',
  // Fieldset + legend: for composite controls with no single labelable element,
  // the legend names the group while items carry their own labels. Reused by
  // Radio Group and Slider.
  render: () => {
    const schema = insane.group({
      plan: RadioField.enum(['Monthly', 'Yearly'])
        .default('Yearly')
        .meta({ title: 'Billing plan' }),
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
