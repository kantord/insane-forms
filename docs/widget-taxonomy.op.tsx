// docs/widget-taxonomy.op.tsx — INVARIANT, stated positively: every field showcased in the atomic
// "shadcn ui/Widgets" group is actually atomic.
//
// SIGNAL — "which components the widget renders" (structural, not a name guess): an atomic widget
// renders ONLY its control; the SHELL owns field-level layout. So a widget that itself renders a
// Field-family CONTAINER (Field / FieldSet / FieldContent / FieldGroup) is doing field layout — i.e.
// composing multiple controls — which makes it a DERIVED/composite field that belongs in "Derived
// widgets", not here. (A bare FieldLabel does NOT count — RadioField legitimately renders one per
// option; only containers do.)
//
//   esto run docs/widget-taxonomy.op.tsx            # emit a task per misclassified field
//   esto run --dry-run docs/widget-taxonomy.op.tsx  # list them, write nothing
import { h, prompt, read, unit } from 'esto'

const STORY = 'apps/storybook/stories/base-widgets.stories.tsx'
const FIELDS = 'packages/examples/fields.tsx'

const fieldsSrc = read(FIELDS)
const storySrc = read(STORY)

// Fields showcased in the atomic Widgets group = the `*Field` bindings the story references.
const widgetsGroup: string[] = [...new Set(storySrc.match(/[A-Z][A-Za-z]+Field/g) ?? [])]

// The source block of one field binding: from `export const X = insane.field(` to its first close.
const blockOf = (field: string): string => {
  const start = fieldsSrc.indexOf(`export const ${field} = insane.field(`)
  if (start < 0) return ''
  const rest = fieldsSrc.slice(start)
  const end = rest.indexOf('\n})')
  return end >= 0 ? rest.slice(0, end) : rest
}

// Atomic ⇔ the widget renders NO Field-family layout container.
const CONTAINER = /<(Field|FieldSet|FieldContent|FieldGroup)[ >]/
const isAtomic = (field: string): boolean => !CONTAINER.test(blockOf(field))

const AtomicWidget = unit({
  key: (f: { name: string }): string => f.name,
  value: (): string => 'atomic',
  observe: (): { name: string }[] => widgetsGroup.filter(isAtomic).map((name) => ({ name })),
  enter: (f: { name: string }) =>
    prompt`\`${f.name}\` is showcased in the atomic "Integration examples/shadcn ui/Widgets" group, but
its widget renders a Field-family layout container — it composes multiple controls, so it is a
DERIVED/composite field, not an atomic shadcn primitive.
Move its story out of \`${STORY}\` (meta title 'Integration examples/shadcn ui/Widgets') into the
'Integration examples/shadcn ui/Derived widgets' group (\`derived-widgets.stories.tsx\`), updating the
import. Leave the field binding in \`${FIELDS}\` unchanged.`,
})

export default (): unknown => widgetsGroup.map((name) => <AtomicWidget name={name} />)
