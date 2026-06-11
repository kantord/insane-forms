import { useState } from 'react'
import type { DeepPartial } from 'react-hook-form'
import type * as z from 'zod'
import * as insane from '../src'

/* Every story is a LIVE form: render the schema, submit, see the parsed
 * z.output — the same loop a manual tester runs on the docs page, but per piece. */
export function Demo<S extends z.ZodType>({
  schema,
  defaults,
}: {
  schema: S
  defaults?: DeepPartial<z.input<S>> & object
}) {
  const [out, setOut] = useState<z.output<S> | undefined>(undefined)
  return (
    <>
      <insane.ZodForm schema={schema} defaults={defaults} onSubmit={setOut}>
        <button type="submit">Save</button>
      </insane.ZodForm>
      {out !== undefined && (
        <div className="receipt" role="status">
          <div className="receipt-head">
            <span className="receipt-note">z.output — parsed &amp; typed</span>
          </div>
          <pre>{JSON.stringify(out, null, 2)}</pre>
        </div>
      )}
    </>
  )
}
