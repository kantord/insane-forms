/** examples/meadow.tsx — a third design system: soft, rounded, friendly.
 * Same library again; only the chrome changed. */

import type { FieldProps, Shell } from 'insane-forms'
import * as insane from 'insane-forms'
import { resolveInner } from 'insane-forms'
import * as z from 'zod'
import { ZodForm } from './react-hook-form'

const MeadowShell: Shell = ({ name, label, description, error, children }) => (
  <div className="mb-4">
    {label !== undefined && (
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
    )}
    {children}
    {description !== undefined && (
      <small className="mt-1 block text-xs text-dim">{description}</small>
    )}
    {error !== undefined && (
      <em role="alert" className="mt-1 block text-xs font-semibold text-pop not-italic">
        {error}
      </em>
    )}
  </div>
)

const inputClass =
  'w-full rounded-2xl border border-rule bg-paper-deep px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition focus:border-pop focus:ring-4 focus:ring-pop/15'

const TextWidget = (p: FieldProps<string | undefined>) => (
  <input
    id={p.name}
    name={p.name}
    value={p.value ?? ''}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
    className={inputClass}
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
    className={inputClass}
  />
)

const CheckWidget = (p: FieldProps<boolean>) => (
  <input
    id={p.name}
    name={p.name}
    type="checkbox"
    checked={p.value}
    onChange={(e) => p.onChange(e.target.checked)}
    onBlur={p.onBlur}
    className="size-5 rounded-md accent-pop"
  />
)

const SelectWidget = (p: FieldProps<string>) => (
  <select
    id={p.name}
    name={p.name}
    value={p.value}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
    className={inputClass}
  >
    {enumOptions(p.schema).options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
)

const enumOptions = (s: z.ZodType) => ({
  options: (resolveInner(s) as { options?: readonly string[] }).options ?? [],
})

const text = insane.field({ widget: TextWidget, shell: MeadowShell })
const number = insane.field({ widget: NumberWidget, shell: MeadowShell })
const check = insane.field({ widget: CheckWidget, shell: MeadowShell })
const select = insane.field({ widget: SelectWidget, shell: MeadowShell })

export const Rsvp = insane.group({
  name: text(z.string().min(2).meta({ title: 'Your name' })),
  guests: number(
    z.number().int().min(1).max(6).default(1).meta({
      title: 'Guests',
      description: 'Including you — up to six.', // @note(description) Shell copy lives in .meta() — the schema stays parseable, inferable, plain Zod.
    }),
  ),
  menu: select(z.enum(['Garden', 'Sea', 'Earth']).default('Garden').meta({ title: 'Menu' })), // @note(z.enum) The widget's options come from the enum itself — nothing is declared twice.
  updates: check(z.boolean().default(true).meta({ title: 'Email me updates' })),
})

export type RsvpData = z.output<typeof Rsvp>

export const MeadowForm = ({ onSubmit }: { onSubmit: (d: RsvpData) => void }) => (
  <ZodForm schema={Rsvp} onSubmit={onSubmit}>
    <button
      type="submit"
      className="rounded-full bg-pop px-6 py-2.5 text-sm font-semibold text-paper shadow-md transition hover:opacity-90"
    >
      Send RSVP
    </button>
  </ZodForm>
)
