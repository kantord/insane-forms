import { type FieldEngine, Render } from 'insane-forms'
import type * as z from 'zod'

/**
 * USERLAND sugar — NOT part of insane-forms. The core already takes the engine
 * as a prop (`<Render schema={…} engine={…} />`); this just binds it once so
 * call sites pass only a schema:
 *
 *   const InsaneFields = createFormRenderer({
 *     useField(name, seed) { … },
 *     useArray(name) { … },
 *     useWatch(name) { … },
 *   })
 *   // then, anywhere under your form's context:
 *   <InsaneFields schema={mySchema} />
 *
 * That `engine` object — three hooks bridging insane to your form library — is
 * the ONLY glue insane needs. Copy this file, rename it, or skip it entirely and
 * use `<Render engine={…}>` directly. It is shown, not shipped.
 */
export const createFormRenderer = (engine: FieldEngine) =>
  function InsaneFields({ schema, name = '' }: { schema: z.ZodType; name?: string }) {
    return <Render schema={schema} name={name} engine={engine} />
  }
