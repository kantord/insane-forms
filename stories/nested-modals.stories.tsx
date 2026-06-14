import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { expect, waitFor, within } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { ZodForm } from '../examples/react-hook-form'
import { InputField } from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'

/* Recursive editing via STACKED DIALOGS: every nesting level opens in its own
 * modal, and "Done" only closes a modal once THAT item's subtree validates —
 * `trigger(path)` scopes validation to the sub-schema. Values in closed modals
 * survive because useZodForm pins shouldUnregister: false. */
const meta: Meta = {
  title: 'Nested modals',
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    demo: {
      variant: 'catering',
      section: 'Menus',
      title: 'Menu builder',
      description: 'A menu of sections nested within sections.',
    },
  },
}
export default meta

/* ---------- user-land chrome: a summary row whose editor lives in a dialog ---------- */

/* Every leaf path currently present under a prefix — scoped validation targets. */
const leafPaths = (value: unknown, path: string): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => leafPaths(child, `${path}.${key}`))
    : [path]

function ItemModal({ name, children }: { name: string; children: ReactNode }) {
  const { trigger, getValues, formState } = useFormContext()
  const label = useWatch({ name: `${name}.label` }) as string | undefined
  // Fresh items (no label yet) open their editor immediately.
  const [open, setOpen] = useState(label === undefined || label === '')
  const subtreeError = name
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
      formState.errors,
    )

  // The only way out is a valid item: Done, Esc, and outside clicks all
  // validate THIS item's subtree first and keep the dialog open on failure.
  const requestClose = async () => {
    if (await trigger(leafPaths(getValues(name), name))) setOpen(false)
  }

  return (
    <>
      <span
        className={cn('flex-1 truncate text-sm', subtreeError !== undefined && 'text-destructive')}
      >
        {label || <span className="text-muted-foreground italic">Untitled item</span>}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : void requestClose())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit menu item</DialogTitle>
            <DialogDescription>
              Nested items open in their own dialog. This one closes only when the item is valid.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>{children}</FieldGroup>
          <DialogFooter>
            <Button type="button" onClick={requestClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const MenuList: insane.CollectionWrapper = ({ label, items, add }) => (
  <FieldSet>
    {label !== undefined && <FieldLegend>{label}</FieldLegend>}
    <FieldGroup className="gap-2">
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
          {it.node}
          {it.remove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-remove
              aria-label="Remove"
              onClick={it.remove}
            >
              ✕
            </Button>
          )}
        </div>
      ))}
      {add && (
        <Button type="button" variant="outline" size="sm" data-add onClick={add}>
          Add item
        </Button>
      )}
    </FieldGroup>
  </FieldSet>
)

/* Re-stamp a group's renderer with the modal wrapper — the renderer receives its
 * own path (NodeProps.name), which is exactly what scoped validation needs. */
function editedInModal<S extends z.ZodType>(g: S): S {
  const Inner = insane.resolveComponent(g)
  if (!Inner) return g
  return (g as z.ZodType).meta({
    component: (p: insane.NodeProps) => (
      <ItemModal name={p.name}>
        <Inner {...p} />
      </ItemModal>
    ),
  }) as unknown as S
}

/* ---------- the schema: a recursive navigation menu ---------- */

type MenuItem = { label: string; url: string; children: MenuItem[] }

const MenuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  editedInModal(
    insane.group({
      label: InputField.min(1).meta({ title: 'Label', placeholder: 'Products' }),
      url: InputField.url().meta({ title: 'URL', placeholder: 'https://example.com/products' }),
      children: insane.list(MenuItemSchema, { wrapper: MenuList }).meta({ title: 'Sub-items' }),
    }),
  ),
)

export const NavigationMenu: StoryObj = {
  name: 'Navigation menu builder',
  render: () => {
    const schema = insane.group({
      items: insane
        .list(MenuItemSchema, { wrapper: MenuList })
        .min(1)
        .meta({ title: 'Menu items' }),
    })
    return (
      <ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={{
          items: [
            { label: 'Home', url: 'https://example.com', children: [] },
            {
              label: 'Products',
              url: 'https://example.com/products',
              children: [{ label: 'Pricing', url: 'https://example.com/pricing', children: [] }],
            },
          ],
        }}
        onSubmit={demoSubmit}
      >
        <Button type="submit" className="self-start">
          Save menu
        </Button>
      </ZodForm>
    )
  },
  // Proves the close gate: emptying a required field keeps the dialog open with
  // an error on Done; fixing it lets the dialog close. The dialog node is
  // re-created across re-renders, so every step re-queries through body.
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getAllByRole('button', { name: /edit/i })[0])
    await userEvent.clear(await body.findByLabelText(/^label/i))
    await userEvent.click(body.getByRole('button', { name: /done/i }))
    await body.findAllByRole('alert') // invalid: stays open, shows the error
    await userEvent.type(body.getByLabelText(/^label/i), 'Home')
    await userEvent.click(body.getByRole('button', { name: /done/i }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}
