import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from '../src'
import { ListBox, TextField } from '../examples/profile'
import { Demo } from './harness'

/* Dynamic lists: bounds gate the chrome from the same .min()/.max() the
 * validator uses, and recursion renders to data depth. */
const meta: Meta = {
  title: 'Collections',
}
export default meta

const Tag = insane.group({ label: TextField.min(1).meta({ title: 'Label' }) })

export const BoundedList: StoryObj = {
  name: 'List — add hides at max(3), remove at min(1)',
  render: () => (
    <Demo
      schema={insane.group({
        tags: insane.list(Tag, { wrapper: ListBox }).min(1).max(3).meta({ title: 'Tags' }),
      })}
      defaults={{ tags: [{}] }}
    />
  ),
}

export const UnboundedList: StoryObj = {
  name: 'List — no bounds, chrome always on',
  render: () => (
    <Demo
      schema={insane.group({
        tags: insane.list(Tag, { wrapper: ListBox }).meta({ title: 'Tags' }),
      })}
      defaults={{ tags: [] }}
    />
  ),
}
