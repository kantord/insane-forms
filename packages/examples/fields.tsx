/** shadcn/ui (Base UI) chrome for insane-forms — the SAME core, a different skin.
 * Mirrors examples/profile.tsx: widgets, a shell, and a list wrapper are all user
 * code, so swapping the bureau chrome for shadcn touches zero library lines. */

import type { CollectionWrapper, FieldProps, Shell } from 'insane-forms'
import * as insane from 'insane-forms'
import { Search as SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { readSchema } from './schema-read'

/* ---------- 1. Chrome: shadcn's Field family IS the shell contract. ---------- */

export const FieldShell: Shell = ({ name, label, description, required, error, children }) => (
  <Field data-invalid={error !== undefined || undefined}>
    {label !== undefined && (
      <FieldLabel htmlFor={name}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </FieldLabel>
    )}
    {children}
    {description !== undefined && <FieldDescription>{description}</FieldDescription>}
    {error !== undefined && <FieldError errors={[{ message: error }]} />}
  </Field>
)

/* Checkbox-shaped fields use shadcn's horizontal Field idiom: box first, label
 * beside it. A shell is per-binding, so this costs one constant. */
export const CheckboxFieldShell: Shell = ({
  name,
  label,
  description,
  required,
  error,
  children,
}) => (
  <Field orientation="horizontal" data-invalid={error !== undefined || undefined}>
    {children}
    <FieldContent>
      {label !== undefined && (
        <FieldLabel htmlFor={name}>
          {label}
          {required ? <span aria-hidden="true">*</span> : null}
        </FieldLabel>
      )}
      {description !== undefined && <FieldDescription>{description}</FieldDescription>}
      {error !== undefined && <FieldError errors={[{ message: error }]} />}
    </FieldContent>
  </Field>
)

export const FieldSetList: CollectionWrapper = ({ label, items, add, header, footer }) => (
  <FieldSet>
    {label !== undefined && <FieldLegend>{label}</FieldLegend>}
    <FieldGroup>
      {header}
      {items.map((it) => (
        <div key={it.key} className="relative rounded-lg border p-4 pr-12">
          <FieldGroup>{it.node}</FieldGroup>
          {it.remove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              data-remove
              aria-label="Remove"
              onClick={it.remove}
            >
              <XIcon />
            </Button>
          )}
        </div>
      ))}
      {add && (
        <Button type="button" variant="outline" data-add onClick={add}>
          Add
        </Button>
      )}
      {footer}
    </FieldGroup>
  </FieldSet>
)

/** A row counts as filled once any leaf holds a meaningful value (numbers and
 *  booleans count as present; empty strings/objects/arrays do not). */
const isBlank = (v: unknown): boolean =>
  v == null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.every(isBlank)) ||
  (typeof v === 'object' && Object.values(v).every(isBlank))

/** Wraps any list wrapper so the list grows ITSELF: it keeps one empty trailing
 *  row and appends a fresh one the instant the last row is filled (until .max).
 *  Typing is the add, so the manual Add button is hidden. Engine-agnostic — it
 *  observes the array through the adapter's `useWatch`, so it works unchanged
 *  under react-hook-form, TanStack Form, or any other adapter. */
export const autoAddList = (Inner: CollectionWrapper): CollectionWrapper =>
  function AutoAddList(props) {
    const rows = (props.engine.useWatch(props.name) as unknown[]) ?? []
    const count = rows.length
    const lastFilled = count > 0 && !isBlank(rows[count - 1])
    const { add } = props
    // `add` is a fresh closure each render, so guard on row count: append at most
    // once per length (idempotent under re-renders and StrictMode double-fires).
    const addedAt = useRef(-1)
    useEffect(() => {
      if (add && lastFilled && addedAt.current !== count) {
        addedAt.current = count
        add()
      }
    }, [add, lastFilled, count])
    return <Inner {...props} add={undefined} />
  }

/* ---------- table chrome: rows as <tr>, leaves as bare cells. ----------
 * Column headers carry the labels, so the cell shell renders no label of its
 * own and the cell widgets name themselves via aria-label. */

const CellShell: Shell = ({ error, children }) => (
  <TableCell className="align-top">
    {children}
    {error !== undefined && <FieldError className="mt-1" errors={[{ message: error }]} />}
  </TableCell>
)

const CellTextWidget = (p: FieldProps<string | undefined>) => (
  <Input
    id={p.name}
    name={p.name}
    aria-label={p.label}
    value={p.value ?? ''}
    placeholder={readSchema(p.schema).placeholder()}
    aria-invalid={p.error !== undefined || undefined}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
  />
)

const CellNumberWidget = (p: FieldProps<number | undefined>) => (
  <Input
    id={p.name}
    name={p.name}
    type="number"
    aria-label={p.label}
    value={p.value ?? ''}
    placeholder={readSchema(p.schema).placeholder()}
    aria-invalid={p.error !== undefined || undefined}
    onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    onBlur={p.onBlur}
  />
)

export const CellText = insane.field({
  widget: CellTextWidget,
  shell: CellShell,
})
export const CellNumber = insane.field({
  widget: CellNumberWidget,
  shell: CellShell,
})

/** Rows are list items; a row group's cell fields render in column order. */
export const tableList =
  (headers: readonly string[]): CollectionWrapper =>
  ({ label, items, add, header, footer }) => (
    <FieldSet>
      {label !== undefined && <FieldLegend>{label}</FieldLegend>}
      {header}
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
            <TableHead className="w-10">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.key}>
              {it.node}
              <TableCell className="align-top">
                {it.remove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-remove
                    aria-label="Remove row"
                    onClick={it.remove}
                  >
                    <XIcon />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {add && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          data-add
          onClick={add}
        >
          Add row
        </Button>
      )}
      {footer}
    </FieldSet>
  )

/* ---------- 2. Bound fields: each insane.field() inlines its widget — the
 * arrow that maps the field's draft value onto a shadcn control. Shells and the
 * schema→props mappers stay shared (cross-cutting). ---------- */

export const InputField = insane.field({
  schema: z.string(),
  // No widget annotation: the value type is inferred from the schema as
  // DraftOf<z.ZodString> = string | undefined (raw draft + unset state).
  widget: (p) => (
    <Input
      id={p.name}
      name={p.name}
      value={p.value ?? ''}
      placeholder={readSchema(p.schema).placeholder()}
      aria-invalid={p.error !== undefined || undefined}
      readOnly={p.readonly}
      onChange={(e) => p.onChange(e.target.value)}
      onBlur={p.onBlur}
    />
  ),
  shell: FieldShell,
})

/* Search input: leading magnifier + a clear (✕) button once there's a value
 * (clearing is just onChange('')); the native search clear is hidden. */
export const SearchField = insane.field({
  schema: z.string(),
  widget: (p) => (
    <div className="relative">
      <SearchIcon
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={p.name}
        name={p.name}
        type="search"
        value={p.value ?? ''}
        placeholder={readSchema(p.schema).placeholder()}
        className="px-8 [&::-webkit-search-cancel-button]:appearance-none"
        aria-invalid={p.error !== undefined || undefined}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
      />
      {p.value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => p.onChange('')}
          className="-translate-y-1/2 absolute top-1/2 right-1.5 rounded-sm p-1 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  ),
  shell: FieldShell,
})

export const TextareaField = insane.field({
  schema: z.string(),
  widget: (p) => (
    <Textarea
      id={p.name}
      name={p.name}
      value={p.value ?? ''}
      placeholder={readSchema(p.schema).placeholder()}
      aria-invalid={p.error !== undefined || undefined}
      readOnly={p.readonly}
      onChange={(e) => p.onChange(e.target.value)}
      onBlur={p.onBlur}
    />
  ),
  shell: FieldShell,
})

export const NumberField = insane.field({
  schema: z.number(),
  widget: (p) => (
    <Input
      id={p.name}
      name={p.name}
      type="number"
      value={p.value ?? ''}
      placeholder={readSchema(p.schema).placeholder()}
      aria-invalid={p.error !== undefined || undefined}
      onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      onBlur={p.onBlur}
    />
  ),
  shell: FieldShell,
})

/* Strict: a checkbox is never "unset" — the schema says what unchecked means. */
export const CheckboxField = insane.field({
  schema: z.boolean().default(false),
  widget: (p) => (
    <Checkbox
      id={p.name}
      name={p.name}
      checked={p.value}
      aria-invalid={p.error !== undefined || undefined}
      onCheckedChange={(checked) => p.onChange(checked === true)}
    />
  ),
  shell: CheckboxFieldShell,
})

/* Parametric: the enum values come from the call site, so `.enum(values)` builds
 * z.enum(values) and binds the widget via the one-go field(). The widget is
 * self-initializing (string | undefined → renders unselected), so no .default() is
 * required; the inner field() returns the schema, so the enum's literal members
 * survive — `SelectField.enum(['A','B']).default('A')`. */
export const SelectField = insane.field({
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return insane.field({
      schema: z.enum(values),
      widget: (p: FieldProps<string | undefined>) => (
        <Select value={p.value ?? null} onValueChange={(v) => p.onChange(v as string)}>
          <SelectTrigger id={p.name}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {readSchema(p.schema)
              .enum()
              .options()
              .map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ),
      shell: FieldShell,
    })
  },
})

/* ---------- 4. More base shadcn controls. ---------- */

/* Group shell: a fieldset+legend for composite controls that have no single
 * labelable element (radio group, toggle group, slider) — the legend names the
 * group, individual items carry their own labels. */
const GroupShell: Shell = ({ name, label, description, required, error, children }) => (
  <FieldSet data-invalid={error !== undefined || undefined}>
    {label !== undefined && (
      // id lets a composite control (e.g. the slider thumb) reference the legend
      // as its accessible name via aria-labelledby.
      <FieldLegend id={`${name}-legend`}>
        {label}
        {required ? <span aria-hidden="true">*</span> : null}
      </FieldLegend>
    )}
    {children}
    {description !== undefined && <FieldDescription>{description}</FieldDescription>}
    {error !== undefined && <FieldError errors={[{ message: error }]} />}
  </FieldSet>
)

/* Switch — boolean, like the checkbox but a toggle. id ties it to the shell label. */
export const SwitchField = insane.field({
  schema: z.boolean().default(false),
  widget: (p) => (
    <Switch
      id={p.name}
      name={p.name}
      checked={p.value}
      aria-invalid={p.error !== undefined || undefined}
      onCheckedChange={(checked) => p.onChange(checked)}
    />
  ),
  shell: CheckboxFieldShell,
})

/* Radio group — single choice; the enum values come from the call site. */
export const RadioField = insane.field({
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return insane.field({
      schema: z.enum(values),
      widget: (p: FieldProps<string | undefined>) => (
        <RadioGroup
          value={p.value ?? null}
          aria-invalid={p.error !== undefined || undefined}
          onValueChange={(v) => p.onChange(v as string)}
        >
          {readSchema(p.schema)
            .enum()
            .options()
            .map((o) => (
              <FieldLabel key={o} className="flex items-center gap-2 font-normal">
                <RadioGroupItem value={o} />
                {o}
              </FieldLabel>
            ))}
        </RadioGroup>
      ),
      shell: GroupShell,
    })
  },
})

/* Toggle group — MULTI-select: `.enum(values)` builds an ARRAY of that enum
 * (Base UI toggle groups are array-valued). */
export const ToggleGroupField = insane.field({
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return insane.field({
      schema: z.array(z.enum(values)),
      widget: (p: FieldProps<string[] | undefined>) => (
        <ToggleGroup variant="outline" value={p.value ?? []} onValueChange={(v) => p.onChange(v)}>
          {readSchema(p.schema)
            .array()
            .element()
            .enum()
            .options()
            .map((o) => (
              <ToggleGroupItem key={o} value={o} aria-label={o}>
                {o}
              </ToggleGroupItem>
            ))}
        </ToggleGroup>
      ),
      shell: GroupShell,
    })
  },
})

/* Slider — single-thumb number. value is an ARRAY (a bare number makes the
 * shadcn wrapper render two thumbs); the thumb is labelled by the shell legend. */
export const SliderField = insane.field({
  schema: z.number(),
  widget: (p) => {
    // min/max come from the schema's .min()/.max() — read them off p.schema.
    const num = readSchema(p.schema).number()
    return (
      <Slider
        value={[p.value ?? num.min() ?? 0]}
        min={num.min()}
        max={num.max()}
        aria-labelledby={`${p.name}-legend`}
        onValueChange={(v) => p.onChange(Array.isArray(v) ? v[0] : v)}
      />
    )
  },
  shell: GroupShell,
})

/* Native select — plain <select>; the enum values come from the call site. */
export const NativeSelectField = insane.field({
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return insane.field({
      schema: z.enum(values),
      widget: (p: FieldProps<string | undefined>) => (
        <NativeSelect
          id={p.name}
          name={p.name}
          value={p.value ?? ''}
          aria-invalid={p.error !== undefined || undefined}
          onChange={(e) => p.onChange(e.target.value)}
          onBlur={p.onBlur}
        >
          {readSchema(p.schema)
            .enum()
            .options()
            .map((o) => (
              <NativeSelectOption key={o} value={o}>
                {o}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      ),
      shell: FieldShell,
    })
  },
})

/* One-time-code — fixed-length string; `length` comes from the schema's max. */
export const OtpField = insane.field({
  schema: z.string(),
  widget: (p) => {
    // fixed length comes from the schema's .length(n) — read it off p.schema.
    const length = readSchema(p.schema).string().length() ?? 6
    return (
      <InputOTP
        id={p.name}
        maxLength={length}
        value={p.value ?? ''}
        onChange={(v) => p.onChange(v)}
        onBlur={p.onBlur}
      >
        <InputOTPGroup>
          {Array.from({ length }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, positions never reorder
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    )
  },
  shell: FieldShell,
})

/* Calendar — inline date picker bound to a z.date(). */
export const DateField = insane.field({
  schema: z.date(),
  widget: (p) => (
    <Calendar
      mode="single"
      selected={p.value}
      onSelect={(d) => p.onChange(d)}
      className="rounded-lg border"
    />
  ),
  shell: GroupShell,
})
