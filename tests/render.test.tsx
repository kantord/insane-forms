/** Rendering semantics: decorations, paths, defaults, composition, recursion. */

import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import * as z from 'zod'
import { type Cat, CategoryForm, Profile, ProfileForm, text } from '../examples/profile'
import * as insane from '../src'

describe('a form rendered from the schema', () => {
  it('interleaves decorations in authored order, around real fields', () => {
    const { container } = render(<ProfileForm onSubmit={() => {}} />)
    const html = container.innerHTML
    expect(html.indexOf('Account')).toBeLessThan(html.indexOf('name="email"'))
    expect(html).toMatch(/<h3>Account<\/h3>[\s\S]*<hr>[\s\S]*<h3>Profile<\/h3>/)
  })

  it('self-seeds declared .default()s per leaf — no global seeding pass', () => {
    render(<ProfileForm onSubmit={() => {}} />)
    expect(screen.getByRole('spinbutton', { name: /age/i })).toHaveValue(18)
    expect(screen.getByRole('combobox', { name: /role/i })).toHaveValue('user')
  })

  it('wires nested and indexed paths', () => {
    const { container } = render(<ProfileForm onSubmit={() => {}} />)
    expect(container.querySelector('[name="address.city"]')).toBeInTheDocument()
    expect(container.querySelector('[name="contacts.0.email"]')).toBeInTheDocument()
  })

  it('required * and optional label-less fields', () => {
    const { container } = render(<ProfileForm onSubmit={() => {}} />)
    expect(
      screen.getByText((_, el) => el?.tagName === 'LABEL' && el.textContent === 'Name *'),
    ).toBeInTheDocument()
    expect(container.querySelector('[name="nickname"]')).toBeInTheDocument()
    expect(screen.queryByText(/nickname/i)).not.toBeInTheDocument()
  })

  it('hidden fields render no UI but their .default() fills at parse', () => {
    const { container } = render(<ProfileForm onSubmit={() => {}} />)
    expect(container.innerHTML).not.toContain('srv-000')
    const parsed = Profile.parse({
      name: 'Ada',
      email: 'ada@x.io',
      age: 30,
      role: 'admin',
      newsletter: true,
      address: { city: 'BCN', zip: '08001' },
      contacts: [{ email: 'a@b.co', primary: true }],
    })
    expect(parsed.id).toBe('srv-000')
  })

  it('gates list controls from the schema bounds (min 1: no remove; add shown)', () => {
    const { container } = render(<ProfileForm onSubmit={() => {}} />)
    expect(container.querySelector('[data-add]')).toBeInTheDocument()
    expect(container.querySelector('[data-remove]')).not.toBeInTheDocument()
  })
})

describe('composition', () => {
  it('groups compose as fragments: flat data, sub-decorations intact', () => {
    const A = insane.group(<em>secA</em>, { x: text(z.string()) })
    const B = insane.group({ y: text(z.string()) })
    const AB = insane.group(A, B)
    const { container } = render(<insane.ZodForm schema={AB} onSubmit={() => {}} />)
    expect(container.querySelector('em')).toHaveTextContent('secA')
    expect(container.querySelector('[name="x"]')).toBeInTheDocument()
    expect(container.querySelector('[name="y"]')).toBeInTheDocument()
    expect(AB.safeParse({ x: '1', y: '2' }).success).toBe(true)
  })

  it('wrap(): DOM around a segment, data stays flat', () => {
    const Card = ({ children }: { children?: React.ReactNode }) => (
      <section data-card>{children}</section>
    )
    const W = insane.group(insane.wrap(Card, { a: text(z.string()) }), { b: text(z.string()) })
    const { container } = render(<insane.ZodForm schema={W} onSubmit={() => {}} />)
    expect(container.querySelector('[data-card] [name="a"]')).toBeInTheDocument()
    expect(container.querySelector('[name="b"]')).toBeInTheDocument()
    expect(W.safeParse({ a: '1', b: '2' }).success).toBe(true)
  })
})

describe('build-time enforcement', () => {
  it('group warns at construction, naming only the un-annotated key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    insane.group({ ok: text(z.string()), raw: z.string() })
    insane.list(z.number())
    expect(warn.mock.calls.some(([m]) => String(m).includes('"raw"'))).toBe(true)
    expect(warn.mock.calls.some(([m]) => String(m).includes('"ok"'))).toBe(false)
    expect(warn.mock.calls.some(([m]) => String(m).includes('list: element'))).toBe(true)
    warn.mockRestore()
  })
})

describe('recursion (z.lazy)', () => {
  const tree: Cat = {
    name: 'root',
    children: [
      { name: 'a', children: [{ name: 'a1', children: [] }] },
      { name: 'b', children: [] },
    ],
  }
  it('renders to the data depth and stops', () => {
    const { container } = render(<CategoryForm value={tree} onSubmit={() => {}} />)
    expect(container.querySelector('[name="children.0.children.0.name"]')).toBeInTheDocument()
    expect(
      container.querySelector('[name^="children.0.children.0.children"]'),
    ).not.toBeInTheDocument()
  })
})
