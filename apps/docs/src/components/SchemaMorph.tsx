import { Step2, Step3, Step4 } from '@insane-forms/examples/morph'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import { useState } from 'react'
import type { ZodType } from 'zod'
import { useSnippets } from '../hooks/useSnippets'
import { Receipt } from './Receipt'

const MORPH_STEPS = [
  {
    kicker: 'step 1 · data',
    title: 'Start with plain Zod',
    body: 'A schema is data. No components, no registry — and honestly: nothing renders. That is the point; the library never guesses.',
    schema: null,
  },
  {
    kicker: 'step 2 · bind',
    title: 'Fields carry their widgets',
    body: 'Swap z.string() for a pre-bound field. Each node now carries its own component in .meta() — inputs appear. No match statement anywhere.',
    schema: Step2,
  },
  {
    kicker: 'step 3 · annotate',
    title: 'Titles live in the schema',
    body: 'Labels and descriptions are .meta() too — plain Zod chaining, and the shell renders them. The schema is still a schema: parse it, infer from it.',
    schema: Step3,
  },
  {
    kicker: 'step 4 · validate',
    title: 'Checks and defaults come free',
    body: 'Add .min(), .email(), .default() — the same declarations validate the draft, seed it, and gate submit. Try submitting empty.',
    schema: Step4,
  },
] as const

/** One step's full section — its own `useState` for the submit receipt,
 * since all four steps are now rendered simultaneously (not one active step
 * at a time), each needs an independent output. */
const MorphStep = ({
  id,
  kicker,
  title,
  body,
  schema,
  snippetHtml,
}: {
  id?: string
  kicker: string
  title: string
  body: string
  schema: ZodType | null
  snippetHtml: string
}) => {
  const [out, setOut] = useState<unknown>(null)

  return (
    <section
      id={id}
      className="biome-bureau w-full border-t-[length:var(--rule-w)] border-line bg-paper-deep/40 py-16 text-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">
          {kicker}
        </span>
        <div className="mt-2 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h3 className="mt-0 mb-3 font-display text-3xl font-bold tracking-tight">{title}</h3>
            <p className="m-0 max-w-md text-[0.95rem] text-dim">{body}</p>
          </div>

          <div className="grid grid-rows-[1.15fr_1fr] gap-3 lg:h-[60svh]">
            <div className="min-h-0 overflow-auto border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed">
              <div
                className="h-full [&_pre]:m-0 [&_pre]:h-full [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: snippetHtml }}
              />
            </div>
            <div className="demo-pane min-h-0 overflow-auto border-[length:var(--rule-w)] border-line bg-paper p-6">
              {schema ? (
                <ZodForm schema={schema} onSubmit={setOut}>
                  <button type="submit">Save</button>
                </ZodForm>
              ) : (
                <p className="m-0 text-[0.85rem] text-dim">
                  Nothing renders yet — the schema carries no components. Data first.
                </p>
              )}
              {out != null && <Receipt data={out} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** The old landing page drove this with a sticky-scroll + Magic Move code
 * animation (IntersectionObserver, keyed-token morph); a later Docusaurus
 * rewrite replaced that with a click-to-swap step selector (one button row,
 * one active step's code+form shown at a time). Replaced again: each step
 * is now its own static section, stacked and separated by the same
 * border-t rule every other section on this page uses — no interactive
 * carousel, nothing to click through, matching the rest of the site's
 * plain top-to-bottom flow. `id="morph"` stays on the first step so the
 * sidebar's "on this page" anchor still lands here. */
export const SchemaMorph = () => {
  const { morphSteps } = useSnippets()

  return (
    <>
      {MORPH_STEPS.map((s, i) => (
        <MorphStep
          key={s.kicker}
          id={i === 0 ? 'morph' : `morph-step-${i + 1}`}
          kicker={s.kicker}
          title={s.title}
          body={s.body}
          schema={s.schema}
          snippetHtml={morphSteps[i] ?? ''}
        />
      ))}
    </>
  )
}
