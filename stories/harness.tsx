import { useState } from 'react'
import { type DeepPartial, useFormContext } from 'react-hook-form'
import type * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import * as insane from '../src'

/* ZodForm provides RHF context, so a reset button is ordinary user code. */
function ResetButton() {
  const { reset } = useFormContext()
  return (
    <Button type="button" variant="outline" onClick={() => reset()}>
      Reset
    </Button>
  )
}

/* Card-framed live form in the shadcn docs style: header, fields, footer
 * actions. Submit to see the parsed z.output below the card. */
export function Demo<S extends z.ZodType>({
  title,
  description,
  schema,
  defaults,
  submitLabel = 'Submit',
}: {
  title: string
  description?: string
  schema: S
  defaults?: DeepPartial<z.input<S>> & object
  submitLabel?: string
}) {
  const [out, setOut] = useState<z.output<S> | undefined>(undefined)
  return (
    <div className="flex w-full max-w-md flex-col gap-6 font-sans text-foreground">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description !== undefined && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="[&>form]:flex [&>form]:flex-col [&>form]:gap-6">
          <insane.ZodForm schema={schema} defaults={defaults} onSubmit={setOut}>
            <Field orientation="horizontal">
              <Button type="submit">{submitLabel}</Button>
              <ResetButton />
            </Field>
          </insane.ZodForm>
        </CardContent>
      </Card>
      {out !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Submitted values</CardTitle>
            <CardDescription>The typed z.output your onSubmit receives.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs">{JSON.stringify(out, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
