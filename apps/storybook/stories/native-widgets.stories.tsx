import { NativeSelectField } from '@insane-forms/examples/fields'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { Button } from '@/components/ui/button'
import { demoSubmit } from './demo'

/* Native HTML widgets: bindings built on hand-written controls, NOT stock
 * shadcn registry components — e.g. a styled native <select>. Same insane.field()
 * contract, so swapping shadcn chrome for plain HTML touches zero library lines;
 * grouped apart from the shadcn widgets to keep that distinction visible. */
/* @code-panel:field-definition — the code panel shows each featured field's
 * binding definition + the example schema, not the form boilerplate. */
const meta: Meta = {
  title: 'Integration examples/Native HTML widgets',
  tags: ['ai-generated'],
  parameters: { demo: { variant: 'none' } },
}
export default meta

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
