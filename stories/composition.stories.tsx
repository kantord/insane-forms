import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import * as insane from '../src'
import { TextField } from '../examples/profile'
import { Demo } from './harness'

/* group / wrap / nesting semantics — the composition rules under manual test. */
const meta: Meta = {
  title: 'Composition',
}
export default meta

const Name = insane.group(<h3>Name</h3>, {
  first: TextField.min(1).meta({ title: 'First' }),
  last: TextField.min(1).meta({ title: 'Last' }),
})

export const FragmentsConcatenateFlat: StoryObj = {
  name: 'Fragments concatenate flat',
  render: () => (
    <Demo
      schema={insane.group(Name, <hr />, {
        email: TextField.email().meta({ title: 'Email' }),
      })}
    />
  ),
}

export const ExplicitNesting: StoryObj = {
  name: 'key: group(...) opts into data nesting',
  render: () => (
    <Demo
      schema={insane.group({
        contact: insane.group({
          city: TextField.min(1).meta({ title: 'City' }),
          zip: TextField.regex(/^\d{5}$/, '5 digits').meta({ title: 'ZIP' }),
        }),
      })}
    />
  ),
}

const Card = ({ children }: { children: ReactNode }) => (
  <div style={{ border: '1px solid var(--ink)', padding: '0 1rem 1rem', margin: '1rem 0' }}>{children}</div>
)

export const WrapAddsDomNotData: StoryObj = {
  name: 'wrap() adds DOM, data stays flat',
  render: () => (
    <Demo
      schema={insane.group(
        insane.wrap(Card, <h3>Boxed visually</h3>, {
          a: TextField.meta({ title: 'A' }).default(''),
          b: TextField.meta({ title: 'B' }).default(''),
        }),
        { c: TextField.meta({ title: 'C — outside the box, same flat object' }).default('') },
      )}
    />
  ),
}
