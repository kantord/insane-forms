import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { ZodForm } from '../examples/react-hook-form'
import { cellNumber, cellText, tableList } from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'

/* The same insane.list, table-shaped chrome: rows are items, columns are the
 * row group's fields, and add/remove gating still comes from .min()/.max(). */
const meta: Meta = {
  title: 'Editable table',
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    demo: {
      variant: 'catering',
      section: 'Orders',
      title: 'Invoice line items',
      description: 'Quantities and pricing for this order.',
    },
  },
}
export default meta

export const InvoiceLineItems: StoryObj = {
  name: 'Invoice line items',
  render: () => {
    const LineItem = insane.group({
      description: cellText(
        z.string().min(1).meta({ title: 'Description', placeholder: 'Design work' }),
      ),
      quantity: cellNumber(z.number().int().min(1).default(1).meta({ title: 'Qty' })),
      unitPrice: cellNumber(z.number().min(0).default(0).meta({ title: 'Unit price' })),
    })
    const schema = insane.group({
      lineItems: insane
        .list(LineItem, { wrapper: tableList(['Description', 'Qty', 'Unit price']) })
        .min(1)
        .max(10)
        .meta({ title: 'Line items' }),
    })
    return (
      <ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{
          lineItems: [
            { description: 'Design work', quantity: 12, unitPrice: 90 },
            { description: 'Development', quantity: 40, unitPrice: 110 },
          ],
        }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save invoice
        </Button>
      </ZodForm>
    )
  },
  // Proves the table is live form state: a new row self-seeds its defaults,
  // edits land in the submitted output, and empty required cells error inline.
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /add row/i }))
    await userEvent.click(canvas.getByRole('button', { name: /save invoice/i }))
    await canvas.findAllByRole('alert') // new row's empty Description errors in its cell
    const description = canvas.getAllByRole('textbox', { name: /description/i })[2]
    await userEvent.type(description, 'Consulting')
    await userEvent.click(canvas.getByRole('button', { name: /save invoice/i }))
    const body = within(canvasElement.ownerDocument.body)
    const output = await body.findByText(/"description": "Consulting"/)
    await expect(output.textContent).toMatch(/"quantity": 1/) // seeded .default(1)
  },
}
