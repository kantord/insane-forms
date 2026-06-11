import type { Meta, StoryObj } from '@storybook/react-vite'
import { NuqsAdapter } from 'nuqs/adapters/react'
import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { expect, waitFor } from 'storybook/test'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { FieldDescription } from '@/components/ui/field'
import { CheckboxField, InputField, selectField } from '../examples/shadcn/fields'
import * as insane from '../src'
import { demoSubmit } from './demo'

/* Form state synced to the URL with nuqs: edits land in the query string
 * (throttled, history-replacing), and a shared link restores the filters.
 * The NuqsAdapter lives in a decorator — ambient scaffolding, not example code. */
const meta: Meta = {
  title: 'URL state',
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <NuqsAdapter>
        <Story />
      </NuqsAdapter>
    ),
  ],
}
export default meta

const CATEGORIES = ['All', 'Audio', 'Video', 'Accessories'] as const

const FILTER_PARSERS = {
  q: parseAsString.withDefault(''),
  category: parseAsStringEnum([...CATEGORIES]).withDefault('All'),
  inStock: parseAsBoolean.withDefault(false),
}

const serializeFilters = createSerializer(FILTER_PARSERS)

type Filters = { q: string; category: (typeof CATEGORIES)[number]; inStock: boolean }

/* One-liner inside the form: watches values, pushes them into the URL, and
 * shows the resulting query string (the canvas iframe's URL is hidden). */
function SyncFormToUrl() {
  const values = useWatch() as Partial<Filters>
  const [, setParams] = useQueryStates(FILTER_PARSERS, { history: 'replace', throttleMs: 250 })
  useEffect(() => {
    void setParams({
      q: values.q ?? '',
      category: values.category ?? 'All',
      inStock: values.inStock ?? false,
    })
  }, [values.q, values.category, values.inStock, setParams])
  const search = serializeFilters({
    q: values.q ?? '',
    category: values.category ?? 'All',
    inStock: values.inStock ?? false,
  })
  return (
    <FieldDescription>
      Shareable URL: <code>{search === '' ? '(defaults — no params)' : search}</code>
    </FieldDescription>
  )
}

/* Read the filters back from the URL — a shared link seeds the form draft. */
const loadFilters = createLoader(FILTER_PARSERS)
const filtersFromUrl = (): Filters => loadFilters(window.location.search)

export const ProductFilters: StoryObj = {
  name: 'Product filters',
  render: () => {
    const schema = insane.group({
      q: InputField.default('').meta({ title: 'Search', placeholder: 'Search products…' }),
      category: selectField(z.enum(CATEGORIES).default('All').meta({ title: 'Category' })),
      inStock: CheckboxField.meta({ title: 'In stock only' }),
    })
    return (
      <insane.ZodForm
        schema={schema}
        className="flex flex-col gap-6"
        defaults={filtersFromUrl()}
        onSubmit={demoSubmit}
      >
        <SyncFormToUrl />
        <Button type="submit" className="self-start">
          Apply filters
        </Button>
      </insane.ZodForm>
    )
  },
  // Proves the live sync: typing and toggling land in the iframe's real URL.
  play: async ({ canvas, canvasElement, userEvent }) => {
    const location = canvasElement.ownerDocument.defaultView?.location
    await userEvent.type(canvas.getByLabelText(/search/i), 'speaker')
    await waitFor(() => expect(location?.search).toContain('q=speaker'))
    await userEvent.click(canvas.getByRole('checkbox', { name: /in stock/i }))
    await waitFor(() => expect(location?.search).toContain('inStock=true'))
  },
}
