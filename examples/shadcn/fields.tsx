/** shadcn/ui (Base UI) chrome for insane-forms — the SAME core, a different skin.
 * Mirrors examples/profile.tsx: widgets, a shell, and a list wrapper are all user
 * code, so swapping the bureau chrome for shadcn touches zero library lines. */

import { XIcon } from 'lucide-react'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { CollectionWrapper, FieldProps, Shell } from '../../src'
import * as insane from '../../src'
import { resolveInner } from '../../src'

/* User-land meta key: `.meta({ placeholder })` reaches widgets through the
 * props mapper — a one-line resolver on the library's `resolve` primitive. */
const resolvePlaceholder = insane.resolve<string>(
  (s) => (s.meta() as { placeholder?: string } | undefined)?.placeholder,
)
const fieldExtras = (s: z.ZodType) => ({ placeholder: resolvePlaceholder(s) })

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

/* ---------- table chrome: rows as <tr>, leaves as bare cells. ----------
 * Column headers carry the labels, so the cell shell renders no label of its
 * own and the cell widgets name themselves via aria-label. */

const CellShell: Shell = ({ error, children }) => (
  <TableCell className="align-top">
    {children}
    {error !== undefined && <FieldError className="mt-1" errors={[{ message: error }]} />}
  </TableCell>
)

const CellTextWidget = (p: FieldProps<string | undefined> & { placeholder?: string }) => (
  <Input
    id={p.name}
    name={p.name}
    aria-label={p.label}
    value={p.value ?? ''}
    placeholder={p.placeholder}
    aria-invalid={p.error !== undefined || undefined}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
  />
)

const CellNumberWidget = (p: FieldProps<number | undefined> & { placeholder?: string }) => (
  <Input
    id={p.name}
    name={p.name}
    type="number"
    aria-label={p.label}
    value={p.value ?? ''}
    placeholder={p.placeholder}
    aria-invalid={p.error !== undefined || undefined}
    onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    onBlur={p.onBlur}
  />
)

export const cellText = insane.field({
  widget: CellTextWidget,
  shell: CellShell,
  props: fieldExtras,
})
export const cellNumber = insane.field({
  widget: CellNumberWidget,
  shell: CellShell,
  props: fieldExtras,
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

/* ---------- 2. Widgets: plain render functions over shadcn components. ---------- */

const TextWidget = (p: FieldProps<string | undefined> & { placeholder?: string }) => (
  <Input
    id={p.name}
    name={p.name}
    value={p.value ?? ''}
    placeholder={p.placeholder}
    aria-invalid={p.error !== undefined || undefined}
    readOnly={p.readonly}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
  />
)

const TextareaWidget = (p: FieldProps<string | undefined> & { placeholder?: string }) => (
  <Textarea
    id={p.name}
    name={p.name}
    value={p.value ?? ''}
    placeholder={p.placeholder}
    aria-invalid={p.error !== undefined || undefined}
    readOnly={p.readonly}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
  />
)

const NumberWidget = (p: FieldProps<number | undefined> & { placeholder?: string }) => (
  <Input
    id={p.name}
    name={p.name}
    type="number"
    value={p.value ?? ''}
    placeholder={p.placeholder}
    aria-invalid={p.error !== undefined || undefined}
    onChange={(e) => p.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    onBlur={p.onBlur}
  />
)

/* Strict: a checkbox is never "unset" — the schema says what unchecked means. */
const CheckWidget = (p: FieldProps<boolean>) => (
  <Checkbox
    id={p.name}
    name={p.name}
    checked={p.value}
    aria-invalid={p.error !== undefined || undefined}
    onCheckedChange={(checked) => p.onChange(checked === true)}
  />
)

/* Strict select: schema must carry .default(v). Options come from the schema via
 * the `props` mapper — same mechanism as the bureau example. */
const SelectWidget = (p: FieldProps<string> & { options?: readonly string[] }) => (
  <Select value={p.value} onValueChange={(v) => p.onChange(v as string)}>
    <SelectTrigger id={p.name}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {p.options?.map((o) => (
        <SelectItem key={o} value={o}>
          {o}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const enumOptions = (s: z.ZodType) => ({
  options: (resolveInner(s) as { options?: readonly string[] }).options ?? [],
})

/* ---------- 3. Bound fields: same shapes as the bureau example. ---------- */

export const InputField = insane.field({
  schema: z.string(),
  widget: TextWidget,
  shell: FieldShell,
  props: fieldExtras,
})
export const TextareaField = insane.field({
  schema: z.string(),
  widget: TextareaWidget,
  shell: FieldShell,
  props: fieldExtras,
})
export const NumberField = insane.field({
  schema: z.number(),
  widget: NumberWidget,
  shell: FieldShell,
  props: fieldExtras,
})
export const CheckboxField = insane.field({
  schema: z.boolean().default(false),
  widget: CheckWidget,
  shell: CheckboxFieldShell,
})
export const selectField = insane.field({
  widget: SelectWidget,
  shell: FieldShell,
  props: enumOptions,
})
