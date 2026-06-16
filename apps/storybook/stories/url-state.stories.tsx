import { CheckboxField, SearchField, SelectField } from '@insane-forms/examples/fields'
import { reactHookFormEngine, useZodForm, ZodForm } from '@insane-forms/examples/react-hook-form'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as insane from 'insane-forms'
import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { FormProvider, useWatch } from 'react-hook-form'
import { expect, waitFor } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { ProductTable, products } from './demo'

/* Form state in the URL with nuqs: the query string seeds the form, and the
 * form writes it back — shareable, reload-safe filters. The NuqsAdapter lives
 * in a decorator; everything else is in the story. */
const meta: Meta = {
  title: 'Examples/URL state',
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    demo: {
      variant: 'store',
      section: 'Products',
      title: 'Catalog',
      description: 'Filter and sort your products.',
    },
  },
  decorators: [
    (Story) => (
      <NuqsAdapter>
        <Story />
      </NuqsAdapter>
    ),
  ],
}
export default meta

export const ProductFilters: StoryObj = {
  name: 'Filters — apply on submit',
  render: () => {
    const filterParsers = {
      q: parseAsString.withDefault(''),
      category: parseAsStringEnum(['All', 'Audio', 'Video', 'Accessories']).withDefault('All'),
      inStock: parseAsBoolean.withDefault(false),
    }

    const schema = insane.group({
      q: SearchField.default('').meta({ title: 'Search', placeholder: 'Search products…' }),
      category: SelectField.enum(['All', 'Audio', 'Video', 'Accessories']).default('All').meta({
        title: 'Category',
      }),
      inStock: CheckboxField.meta({ title: 'In stock only' }),
    })

    function Filters() {
      // nuqs IS the submit target: URL seeds the draft, submit writes it back.
      const [filters, setFilters] = useQueryStates(filterParsers, { history: 'replace' })

      return (
        <ZodForm
          schema={schema}
          className="flex flex-col gap-6"
          defaults={filters}
          onSubmit={setFilters}
        >
          <Button type="submit" className="self-start">
            Apply filters
          </Button>
        </ZodForm>
      )
    }

    return <Filters />
  },
  // Proves the round trip: submitting lands the form values in the iframe URL.
  play: async ({ canvas, canvasElement, userEvent }) => {
    const location = canvasElement.ownerDocument.defaultView?.location
    await userEvent.type(canvas.getByRole('searchbox'), 'speaker')
    await userEvent.click(canvas.getByRole('button', { name: /apply filters/i }))
    await waitFor(() => expect(location?.search).toContain('q=speaker'))
  },
}

export const FilteredCatalog: StoryObj = {
  name: 'Data table — filtered and sorted live',
  render: () => {
    const schema = insane.group({
      q: SearchField.default('').meta({ title: 'Search', placeholder: 'Filter products…' }),
      sort: SelectField.enum(['name', 'price']).default('name').meta({ title: 'Sort by' }),
      inStock: CheckboxField.meta({ title: 'In stock only' }),
    })

    // One source of truth: the schema's fields double as the nuqs parsers —
    // each field validates its own value and already knows its default.
    const catalogParsers = insane.queryParams(schema)

    function Catalog() {
      const [params, setParams] = useQueryStates(catalogParsers, {
        history: 'replace',
        throttleMs: 250,
      })
      const methods = useZodForm(schema, { defaults: params })

      // Live: every edit lands in the URL…
      insane.useQueryParamsSync(methods, setParams)

      // …and re-filters the table. The draft is fully seeded (every codec has
      // a default), so the values are never undefined — no fallbacks needed.
      const { q, sort, inStock } = useWatch({
        control: methods.control,
      }) as z.output<typeof schema>

      // Even the filter is a schema: a product matches if it parses.
      const rowFilter = z.looseObject({
        name: z.string().toLowerCase().includes(q.toLowerCase()),
        inStock: inStock ? z.literal(true) : z.boolean(),
      })

      const rows = products
        .filter((p) => rowFilter.safeParse(p).success)
        .toSorted((a, b) => (sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name)))

      return (
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <FormProvider {...methods}>
            <form className="flex flex-col gap-4 md:w-60 md:shrink-0">
              <insane.Render schema={schema} name="" engine={reactHookFormEngine} />
            </form>
          </FormProvider>

          <div className="min-w-0 flex-1">
            <ProductTable rows={rows} />
          </div>
        </div>
      )
    }

    return <Catalog />
  },
  // Proves form → table → URL: typing narrows the rows and updates the query.
  // Clear first: URL state persists across stories sharing this page.
  play: async ({ canvas, canvasElement, userEvent }) => {
    const location = canvasElement.ownerDocument.defaultView?.location
    await userEvent.clear(canvas.getByRole('searchbox'))
    await userEvent.type(canvas.getByRole('searchbox'), 'cap')
    await waitFor(() => expect(canvas.queryByText('Studio Headphones')).not.toBeInTheDocument())
    await expect(canvas.getByText('Capture Card')).toBeVisible()
    await waitFor(() => expect(location?.search).toContain('q=cap'))
  },
}
