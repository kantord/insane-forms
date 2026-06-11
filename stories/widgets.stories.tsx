import type { Meta, StoryObj } from '@storybook/react-vite'
import * as z from 'zod'
import * as insane from '../src'
import { CheckField, NumberField, TextField, select } from '../examples/profile'
import { Demo } from './harness'

/* Each widget in isolation, inside a one-field live form. Submit to see the
 * parsed output; submit empty to see the validation path. */
const meta: Meta = {
  title: 'Widgets',
}
export default meta

export const Text: StoryObj = {
  render: () => <Demo schema={insane.group({ name: TextField.min(2).meta({ title: 'Name' }) })} />,
}

export const TextOptional: StoryObj = {
  name: 'Text — optional, label-less',
  render: () => <Demo schema={insane.group({ nickname: TextField.optional() })} />,
}

export const TextWithDescription: StoryObj = {
  render: () => (
    <Demo
      schema={insane.group({
        email: TextField.email().meta({ title: 'Email', description: 'We never share it' }),
      })}
    />
  ),
}

export const TextReadonly: StoryObj = {
  render: () => (
    <Demo
      schema={insane.group({
        id: TextField.readonly().default('usr-42').meta({ title: 'User id' }),
      })}
    />
  ),
}

export const NumberInput: StoryObj = {
  name: 'Number',
  render: () => (
    <Demo schema={insane.group({ age: NumberField.int().min(18).default(18).meta({ title: 'Age' }) })} />
  ),
}

export const Checkbox: StoryObj = {
  render: () => <Demo schema={insane.group({ newsletter: CheckField.meta({ title: 'Newsletter' }) })} />,
}

export const Select: StoryObj = {
  name: 'Select — options from the enum',
  render: () => (
    <Demo
      schema={insane.group({
        role: select(z.enum(['admin', 'user', 'guest']).default('user').meta({ title: 'Role' })),
      })}
    />
  ),
}

export const Hidden: StoryObj = {
  name: 'Hidden — no UI, value still submitted',
  render: () => (
    <Demo
      schema={insane.group(
        <p>
          The schema has a hidden <code>id</code> field. Nothing renders for it — but submit and the parse fills{' '}
          <code>srv-000</code> into the output.
        </p>,
        { id: insane.hidden(z.string().default('srv-000')) },
      )}
    />
  ),
}
