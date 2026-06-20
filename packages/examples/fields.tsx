/** shadcn/ui (Base UI) chrome for insane-forms — the SAME core, a different skin.
 * Mirrors examples/profile.tsx: widgets, a shell, and a list wrapper are all user
 * code, so swapping the bureau chrome for shadcn touches zero library lines. */

import type { CollectionWrapper, Derive, FieldProps, SchemaReader, Shell } from 'insane-forms'
import * as insane from 'insane-forms'
import { CalendarIcon, Info as InfoIcon, Search as SearchIcon, XIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/* ---------- 1. Chrome: shadcn's Field family IS the shell contract. ---------- */

/* Help tooltip — an info icon beside the label revealing ON-DEMAND help (distinct
 * from `description`, the always-visible helper text). shadcn ships no first-class
 * field-help pattern, so this DIY-composes its Tooltip with an info-icon trigger.
 * Fed by `.meta({ help })`; a slot in the shell's label row, not a separate shell. */
const HelpTooltip = ({ content, label }: { content: ReactNode; label?: string }) => (
  // Standard shadcn usage: a bare Tooltip; the TooltipProvider lives once at the
  // app root (mounted in the Storybook preview decorator).
  <Tooltip>
    <TooltipTrigger
      render={
        // p-1.5 enlarges the hover/click target; the negative margins keep the
        // icon visually in place and hugging the label (left) while the right
        // padding adds breathing room before the required marker.
        <button
          type="button"
          aria-label={label ? `Help: ${label}` : 'Help'}
          className="-my-1 inline-flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <InfoIcon className="size-3" />
        </button>
      }
    />
    <TooltipContent>{content}</TooltipContent>
  </Tooltip>
)

/* The label row shared by labelable shells: label, then the help icon (hugging
 * the label), then the required marker. `help` comes from `.meta({ help })` via
 * FieldProps; the asterisk is decorative — `aria-required` is set on the control. */
const FieldLabelRow = ({
  name,
  label,
  help,
  required,
}: {
  name: string
  label: string
  help?: ReactNode
  required: boolean
}) => (
  <div className="flex items-center">
    <FieldLabel htmlFor={name} className="leading-none">
      {label}
    </FieldLabel>
    {help !== undefined && <HelpTooltip content={help} label={label} />}
    {required ? (
      <span aria-hidden="true" className="ml-1">
        *
      </span>
    ) : null}
  </div>
)

export const FieldShell: Shell = ({
  name,
  label,
  description,
  help,
  required,
  error,
  children,
}) => (
  <Field data-invalid={error !== undefined || undefined}>
    {label !== undefined && (
      <FieldLabelRow name={name} label={label} help={help} required={required} />
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
  help,
  required,
  error,
  children,
}) => (
  <Field orientation="horizontal" data-invalid={error !== undefined || undefined}>
    {children}
    <FieldContent>
      {label !== undefined && (
        <FieldLabelRow name={name} label={label} help={help} required={required} />
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

const CellTextWidget = (p: FieldProps<string | undefined>, derive: Derive, hint: SchemaReader) => (
  <Input
    {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur')}
    aria-label={p.label}
    value={p.value ?? ''}
    placeholder={hint.placeholder()}
    onChange={(e) => p.onChange(e.target.value)}
  />
)

const CellNumberWidget = (
  p: FieldProps<number | undefined>,
  derive: Derive,
  hint: SchemaReader,
) => (
  <Input
    {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur')}
    type="number"
    aria-label={p.label}
    value={p.value ?? ''}
    placeholder={hint.placeholder()}
    onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
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
  // Core hands the widget bound helpers: `derive` pulls the boilerplate
  // attributes off the binding, `hint` reads schema-declared facts. `value`/
  // `onChange` stay explicit (the real per-control decision). `p` infers its
  // value type from the schema (DraftOf<z.ZodString> = string | undefined).
  widget: (p, derive, hint) => (
    <Input
      {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur', 'readOnly')}
      value={p.value ?? ''}
      placeholder={hint.placeholder()}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
  shell: FieldShell,
})

/* Search input — shadcn's canonical pattern: an InputGroup with a leading
 * magnifier addon and a trailing clear button that appears once there's a value
 * (clearing is just onChange('')). The native search clear is hidden. */
export const SearchField = insane.field({
  schema: z.string(),
  widget: (p, derive, hint) => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur')}
        type="search"
        value={p.value ?? ''}
        placeholder={hint.placeholder()}
        className="[&::-webkit-search-cancel-button]:appearance-none"
        onChange={(e) => p.onChange(e.target.value)}
      />
      {p.value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => p.onChange('')}>
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  ),
  shell: FieldShell,
})

export const TextareaField = insane.field({
  schema: z.string(),
  widget: (p, derive, hint) => (
    <Textarea
      {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur', 'readOnly')}
      value={p.value ?? ''}
      placeholder={hint.placeholder()}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
  shell: FieldShell,
})

export const NumberField = insane.field({
  schema: z.number(),
  widget: (p, derive, hint) => (
    <Input
      {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur')}
      type="number"
      value={p.value ?? ''}
      placeholder={hint.placeholder()}
      onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  ),
  shell: FieldShell,
})

/* Strict: a checkbox is never "unset" — the schema says what unchecked means. */
export const CheckboxField = insane.field({
  schema: z.boolean().default(false),
  widget: (p, derive) => (
    <Checkbox
      {...derive('id', 'name', 'aria-invalid', 'aria-required')}
      checked={p.value}
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
      widget: (p, derive, hint) => (
        <Select value={p.value ?? null} onValueChange={(v) => p.onChange(v as string)}>
          <SelectTrigger {...derive('id', 'aria-invalid', 'aria-required')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hint
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
const GroupShell: Shell = ({ name, label, description, help, required, error, children }) => (
  <FieldSet data-invalid={error !== undefined || undefined}>
    {label !== undefined && (
      // id lets a composite control (e.g. the slider thumb) reference the legend
      // as its accessible name via aria-labelledby. Help/required live INSIDE the
      // legend — it must stay a direct child of the fieldset.
      <FieldLegend id={`${name}-legend`} className="flex items-center leading-none">
        {label}
        {help !== undefined && <HelpTooltip content={help} label={label} />}
        {required ? (
          <span aria-hidden="true" className="ml-1">
            *
          </span>
        ) : null}
      </FieldLegend>
    )}
    {children}
    {description !== undefined && <FieldDescription>{description}</FieldDescription>}
    {error !== undefined && <FieldError errors={[{ message: error }]} />}
  </FieldSet>
)

/* Single toggle — a boolean rendered as one pressable button that carries its
 * OWN label (the button text), so its shell renders no separate label, only the
 * description/error. Contrast Checkbox/Switch, where the shell labels beside. */
const ToggleFieldShell: Shell = ({ description, error, children }) => (
  <Field data-invalid={error !== undefined || undefined}>
    {children}
    {description !== undefined && <FieldDescription>{description}</FieldDescription>}
    {error !== undefined && <FieldError errors={[{ message: error }]} />}
  </Field>
)

export const ToggleField = insane.field({
  schema: z.boolean().default(false),
  widget: (p, derive) => (
    <Toggle
      {...derive('aria-invalid')}
      variant="outline"
      pressed={p.value}
      onPressedChange={(pressed) => p.onChange(pressed)}
    >
      {p.label ?? p.name}
    </Toggle>
  ),
  shell: ToggleFieldShell,
})

/* Switch — boolean, like the checkbox but a toggle. id ties it to the shell label. */
export const SwitchField = insane.field({
  schema: z.boolean().default(false),
  widget: (p, derive) => (
    <Switch
      {...derive('id', 'name', 'aria-invalid', 'aria-required')}
      checked={p.value}
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
      widget: (p, derive, hint) => (
        <RadioGroup
          {...derive('aria-invalid', 'aria-required')}
          value={p.value ?? null}
          onValueChange={(v) => p.onChange(v as string)}
        >
          {hint
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

/* Toggle group — one control, two base types (Base UI toggle groups are always
 * array-valued; `multiple` decides arity):
 *   .enum(values)  → single-select, value is a `string`  (z.enum)
 *   .array(values) → multi-select,  value is a `string[]` (z.array(z.enum))
 * The single variant maps the schema's `string` onto Base UI's array shape. */
export const ToggleGroupField = insane.field({
  enum<const T extends readonly [string, ...string[]]>(values: T) {
    return insane.field({
      schema: z.enum(values),
      widget: (p, _derive, hint) => (
        <ToggleGroup
          variant="outline"
          value={p.value !== undefined ? [p.value] : []}
          onValueChange={(v) => p.onChange(v.at(-1))}
        >
          {hint
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
  array<const T extends readonly [string, ...string[]]>(values: T) {
    return insane.field({
      schema: z.array(z.enum(values)),
      widget: (p, _derive, hint) => (
        <ToggleGroup
          variant="outline"
          multiple
          value={p.value ?? []}
          onValueChange={(v) => p.onChange(v)}
        >
          {hint
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
  widget: (p, _derive, hint) => {
    // min/max come from the schema's .min()/.max() — read them off `hint`.
    const num = hint.number()
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
      widget: (p, derive, hint) => (
        <NativeSelect
          {...derive('id', 'name', 'aria-invalid', 'aria-required', 'onBlur')}
          value={p.value ?? ''}
          onChange={(e) => p.onChange(e.target.value)}
        >
          {hint
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
  widget: (p, derive, hint) => {
    // fixed length comes from the schema's .length(n) — read it off `hint`.
    const length = hint.string().length() ?? 6
    return (
      <InputOTP
        {...derive('id', 'onBlur', 'aria-required')}
        maxLength={length}
        value={p.value ?? ''}
        onChange={(v) => p.onChange(v)}
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

/* Date picker — shadcn's canonical date form field: a Button trigger that opens
 * a Popover holding a Calendar (there is no DatePicker root component). The
 * trigger shows the chosen date; selecting one writes it back and closes the
 * popover. A named component (like CellTextWidget) so the open/close `useState`
 * sits in a real component — Biome forbids hooks in a bare widget arrow. */
const DatePickerWidget = (p: FieldProps<Date | undefined>, derive: Derive) => {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            {...derive('id', 'aria-invalid')}
            variant="outline"
            className="w-56 justify-start font-normal data-[empty=true]:text-muted-foreground"
            data-empty={p.value === undefined || undefined}
          >
            <CalendarIcon />
            {p.value ? p.value.toLocaleDateString() : 'Pick a date'}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={p.value}
          onSelect={(d) => {
            p.onChange(d)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export const DateField = insane.field({
  schema: z.date(),
  widget: DatePickerWidget,
  shell: FieldShell,
})
