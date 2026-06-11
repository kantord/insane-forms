/** shadcn/ui (Base UI) chrome for insane-forms — the SAME core, a different skin.
 * Mirrors examples/profile.tsx: widgets, a shell, and a list wrapper are all user
 * code, so swapping the bureau chrome for shadcn touches zero library lines. */

import * as z from "zod";
import * as insane from "../../src";
import { resolveInner } from "../../src";
import type { CollectionWrapper, FieldProps, Shell } from "../../src";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- 1. Chrome: shadcn's Field family IS the shell contract. ---------- */

export const ShadcnShell: Shell = ({ name, label, description, required, error, children }) => (
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
);

/* Checkbox-shaped fields use shadcn's horizontal Field idiom: box first, label
 * beside it. A shell is per-binding, so this costs one constant. */
export const ShadcnCheckShell: Shell = ({ name, label, description, required, error, children }) => (
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
);

export const ShadcnListBox: CollectionWrapper = ({ label, items, add, header, footer }) => (
  <Card>
    {label !== undefined && (
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
    )}
    <CardContent className="flex flex-col gap-4">
      {header}
      {items.map((it) => (
        <div key={it.key} className="relative flex flex-col gap-4 rounded-lg border p-4 pr-14">
          {it.node}
          {it.remove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              data-remove
              aria-label="Remove item"
              onClick={it.remove}
            >
              −
            </Button>
          )}
        </div>
      ))}
      {add && (
        <Button type="button" variant="outline" data-add onClick={add}>
          ＋ Add
        </Button>
      )}
      {footer}
    </CardContent>
  </Card>
);

/* ---------- 2. Widgets: plain render functions over shadcn components. ---------- */

const TextWidget = (p: FieldProps<string | undefined>) => (
  <Input
    id={p.name}
    name={p.name}
    value={p.value ?? ""}
    aria-invalid={p.error !== undefined || undefined}
    readOnly={p.readonly}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
  />
);

const NumberWidget = (p: FieldProps<number | undefined>) => (
  <Input
    id={p.name}
    name={p.name}
    type="number"
    value={p.value ?? ""}
    aria-invalid={p.error !== undefined || undefined}
    onChange={(e) => p.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
    onBlur={p.onBlur}
  />
);

/* Strict: a checkbox is never "unset" — the schema says what unchecked means. */
const CheckWidget = (p: FieldProps<boolean>) => (
  <Checkbox
    id={p.name}
    name={p.name}
    checked={p.value}
    aria-invalid={p.error !== undefined || undefined}
    onCheckedChange={(checked) => p.onChange(checked === true)}
  />
);

/* Strict select: schema must carry .default(v). Options come from the schema via
 * the `props` mapper — same mechanism as the bureau example. */
const SelectWidget = (p: FieldProps<string> & { options?: readonly string[] }) => (
  <Select value={p.value} onValueChange={(v) => p.onChange(v as string)}>
    <SelectTrigger id={p.name} className="w-full">
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
);

const enumOptions = (s: z.ZodType) => ({
  options: (resolveInner(s) as { options?: readonly string[] }).options ?? [],
});

/* ---------- 3. Bound fields: same shapes as the bureau example. ---------- */

export const ShadText = insane.field({ schema: z.string(), widget: TextWidget, shell: ShadcnShell });
export const ShadNumber = insane.field({
  schema: z.number(),
  widget: NumberWidget,
  shell: ShadcnShell,
});
export const ShadCheck = insane.field({
  schema: z.boolean().default(false),
  widget: CheckWidget,
  shell: ShadcnCheckShell,
});
export const shadSelect = insane.field({
  widget: SelectWidget,
  shell: ShadcnShell,
  props: enumOptions,
});
