import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShadText, ShadcnListBox } from '../examples/shadcn/fields'
import * as insane from '../src'
import { Demo } from './harness'

/* Dynamic lists: the add/remove chrome is gated by the same .min()/.max()
 * the validator uses — one source of truth. */
const meta: Meta = {
  title: 'Collections',
}
export default meta

export const BoundedList: StoryObj = {
  name: 'Bounded list',
  render: () => {
    const Contact = insane.group({
      name: ShadText.min(1).meta({ title: 'Name', placeholder: 'Evil Rabbit' }),
      email: ShadText.email().meta({ title: 'Email', placeholder: 'm@example.com' }),
    })
    const schema = insane.group({
      contacts: insane
        .list(Contact, { wrapper: ShadcnListBox })
        .min(1)
        .max(3)
        .meta({ title: 'Emergency contacts' }),
    })
    // Add disappears at 3 contacts; Remove disappears at 1 — from .min(1).max(3).
    return (
      <Demo
        title="Emergency contacts"
        description="Add up to three people we can reach."
        schema={schema}
        defaults={{ contacts: [{}] }}
        submitLabel="Save contacts"
      />
    )
  },
}

export const UnboundedList: StoryObj = {
  name: 'Unbounded list',
  render: () => {
    const Link = insane.group({
      url: ShadText.url().meta({ title: 'URL', placeholder: 'https://example.com' }),
    })
    const schema = insane.group({
      links: insane.list(Link, { wrapper: ShadcnListBox }).meta({ title: 'Links' }),
    })
    return (
      <Demo
        title="Links"
        description="Add links to your website, blog, or social profiles."
        schema={schema}
        defaults={{ links: [] }}
        submitLabel="Save links"
      />
    )
  },
}
