/** example.tsx — a worked form on the insane core. ALL chrome (shells, list boxes) lives here, not in the core. */

import type { CollectionWrapper, FieldProps, Shell } from 'insane-forms'
import * as insane from 'insane-forms'
import * as z from 'zod'
import { ZodForm } from './react-hook-form'
import { readSchema } from './schema-read'

/* ---------- 1. Chrome: a shell and a list box — user code, replaceable. ---------- */

const FieldShell: Shell = ({ name, label, description, required, error, children }) => (
  <div>
    {label !== undefined && (
      <label htmlFor={name}>
        {label}
        {required ? ' *' : ''}
      </label>
    )}
    {children}
    {description !== undefined && <small>{description}</small>}
    {error !== undefined && <em role="alert">{error}</em>}
  </div>
)

export const ListBox: CollectionWrapper = ({ label, items, add, header, footer }) => (
  <fieldset>
    {label !== undefined && <legend>{label}</legend>}
    {header}
    {items.map((it) => (
      <div key={it.key}>
        {it.node}
        {it.remove && (
          <button type="button" data-remove onClick={it.remove}>
            −
          </button>
        )}
      </div>
    ))}
    {add && (
      <button type="button" data-add onClick={add}>
        ＋
      </button>
    )}
    {footer}
  </fieldset>
)

/* ---------- 2. Widgets: plain render functions, typed by FieldProps<T>. ----------
 * A widget's value type IS its self-init declaration: `T | undefined` means
 * "I can render the unset state"; a bare `T` makes the compiler demand a
 * `.default(value)` or an `{ initial }` at the use site. */

const TextWidget = (p: FieldProps<string | undefined>) => (
  <input
    id={p.name}
    name={p.name}
    value={p.value ?? ''}
    aria-label={p.label === undefined ? p.name : undefined} // label-less ≠ nameless
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
    readOnly={p.readonly}
  />
)

const NumberWidget = (p: FieldProps<number | undefined>) => (
  <input
    id={p.name}
    name={p.name}
    type="number"
    value={p.value ?? ''}
    onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    onBlur={p.onBlur}
  />
)

/* Strict: a checkbox is never "unset" — its schema must say what unchecked means. */
const CheckWidget = (p: FieldProps<boolean>) => (
  <input
    id={p.name}
    name={p.name}
    type="checkbox"
    checked={p.value}
    onChange={(e) => p.onChange(e.target.checked)}
    onBlur={p.onBlur}
  />
)

/* Strict: cannot render unselected — schema must carry .default(v) (or pass `initial`).
 * The options are a schema fact: read them off p.schema via the resolve toolkit. */
const SelectWidget = (p: FieldProps<string>) => (
  <select
    id={p.name}
    name={p.name}
    value={p.value}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
  >
    {readSchema(p.schema)
      .enum()
      .options()
      .map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
  </select>
)
/* Curried form of insane.field: bind widget + shell once, apply per schema. */
export const text = insane.field({ widget: TextWidget, shell: FieldShell })
export const number = insane.field({ widget: NumberWidget, shell: FieldShell })
export const check = insane.field({ widget: CheckWidget, shell: FieldShell })
export const select = insane.field({ widget: SelectWidget, shell: FieldShell })

/* Pre-baked fields: the one-go form returns a plain (immutable) schema, so a
 * reusable field is just a constant — per-use customization is ordinary Zod
 * chaining. No factory, no parens: `TextField.min(2).meta({ title: "Name" })`.
 * (Strict widgets whose default is per-use — like select — stay curried.) */
export const TextField = insane.field({ schema: z.string(), widget: TextWidget, shell: FieldShell })
export const NumberField = insane.field({
  schema: z.number(),
  widget: NumberWidget,
  shell: FieldShell,
})
export const CheckField = insane.field({
  schema: z.boolean().default(false),
  widget: CheckWidget,
  shell: FieldShell,
})

/* ---------- 3. The form: a plain z.object that happens to carry components. ---- */

const Contact = insane.group({
  email: TextField.email().meta({ title: 'Email' }),
  primary: CheckField.meta({ title: 'Primary' }),
})

/* Sections are themselves groups — reusable, individually testable — and compose
 * as FRAGMENTS: their shapes concatenate flat (no key nesting), their decorations
 * render in place. `key: group(...)` is how you opt into data nesting instead. */
const Account = insane.group(<h3>Account</h3>, {
  id: insane.hidden(z.string().default('srv-000')), // @note(insane.hidden) Renders no UI at all — yet the value is kept in form state, and parse fills the default into the submitted output.
  name: TextField.min(2).meta({ title: 'Name' }),
  email: TextField.email().meta({ title: 'Email', description: 'We never share it' }),
})

const Details = insane.group(<h3>Profile</h3>, {
  age: NumberField.int().min(18).default(18).meta({ title: 'Age' }),
  role: select(z.enum(['admin', 'user', 'guest']).default('user').meta({ title: 'Role' })),
  newsletter: CheckField.meta({ title: 'Newsletter' }),
  nickname: TextField.optional(), // @note(.optional()) Optionality is plain Zod — and a field without .meta({ title }) renders label-less, on purpose.
  address: insane.group({
    city: TextField.min(1).meta({ title: 'City' }),
    zip: TextField.regex(/^\d{5}$/, '5 digits').meta({ title: 'ZIP' }),
  }),
  contacts: insane.list(Contact, { wrapper: ListBox }).min(1).max(3).meta({ title: 'Contacts' }), // @note(.min(1).max(3)) One source of truth: the same bounds validate the array AND gate the add/remove buttons.
})

export const Profile = insane.group(Account, <hr />, Details)

export type ProfileData = z.output<typeof Profile> // decorations & chrome absent here

export const ProfileForm = ({ onSubmit }: { onSubmit: (d: ProfileData) => void }) => (
  <ZodForm schema={Profile} defaults={{ contacts: [{}] }} onSubmit={onSubmit}>
    <button type="submit">Save</button>
  </ZodForm>
)

/* ---------- 4. Recursive tree — z.lazy renders to data depth and stops. ---------- */

export type Cat = { name: string; children: Cat[] }
export const Category: z.ZodType<Cat> = z.lazy(() =>
  insane.group({
    name: TextField.min(1).meta({ title: 'Name' }),
    children: insane.list(Category, { wrapper: ListBox }),
  }),
)

export const CategoryForm = ({ value, onSubmit }: { value: Cat; onSubmit: (d: Cat) => void }) => (
  <ZodForm schema={Category} defaults={value} onSubmit={onSubmit}>
    <button type="submit">Save</button>
  </ZodForm>
)
