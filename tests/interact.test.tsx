/** Real interaction — what SSR could never exercise: clicks, typing, submit. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from '../examples/profile'

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: /^name/i }), 'Ada Lovelace')
  await user.type(document.querySelector<HTMLInputElement>('[name="email"]')!, 'ada@example.com')
  await user.type(screen.getByRole('textbox', { name: /city/i }), 'Barcelona')
  await user.type(screen.getByRole('textbox', { name: /zip/i }), '08001')
  const contact = document.querySelector<HTMLInputElement>('[name="contacts.0.email"]')!
  await user.type(contact, 'team@example.com')
}

describe('dynamic collection interaction', () => {
  it('add self-seeds a new row; remove appears above the min and respects it', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProfileForm onSubmit={() => {}} />)

    expect(container.querySelectorAll('[name^="contacts."]').length).toBe(2) // email + primary
    expect(container.querySelector('[data-remove]')).not.toBeInTheDocument() // at min(1)

    await user.click(container.querySelector('[data-add]')!)
    expect(container.querySelector('[name="contacts.1.email"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-remove]').length).toBe(2) // above min now

    await user.click(container.querySelectorAll('[data-remove]')[0]!)
    await waitFor(() =>
      expect(container.querySelectorAll('[name$=".email"][name^="contacts"]').length).toBe(1))
    expect(container.querySelector('[data-remove]')).not.toBeInTheDocument() // back at min
  })

  it('add disappears at max(3)', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProfileForm onSubmit={() => {}} />)
    await user.click(container.querySelector('[data-add]')!)
    await user.click(container.querySelector('[data-add]')!)
    await waitFor(() => expect(container.querySelector('[data-add]')).not.toBeInTheDocument())
  })
})

describe('submit: the draft/output split end to end', () => {
  it('valid input yields typed z.output, with hidden + defaults filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const data = onSubmit.mock.calls[0]![0]
    expect(data).toMatchObject({
      id: 'srv-000',        // hidden: never shown, still submitted
      name: 'Ada Lovelace',
      age: 18,              // declared default, untouched
      role: 'user',
      newsletter: false,    // checkbox default(false), untouched
      address: { city: 'Barcelona', zip: '08001' },
      contacts: [{ email: 'team@example.com', primary: false }],
    })
  })

  it('invalid input blocks submit and surfaces the error through the shell', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ProfileForm onSubmit={onSubmit} />)
    await user.click(screen.getByRole('button', { name: /save/i })) // everything still blank
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
