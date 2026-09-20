import { Step2, Step3, Step4 } from '@insane-forms/examples/morph'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import { useState } from 'react'
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

/** The old landing page drove this with a sticky-scroll + Magic Move code
 * animation (IntersectionObserver, keyed-token morph). Simplified for the
 * Docusaurus rewrite: a plain step selector, no scroll wiring, no animation
 * library — click a step, the code and the live form update. */
export const SchemaMorph = () => {
  const [step, setStep] = useState(0)
  const [out, setOut] = useState<unknown>(null)
  const { morphSteps } = useSnippets()
  const current = MORPH_STEPS[step]
  const schema = current?.schema ?? null

  return (
    <section
      id="morph"
      className="biome-bureau w-full border-t-[length:var(--rule-w)] border-line bg-paper-deep/40 py-16 text-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-wrap gap-2">
          {MORPH_STEPS.map((s, i) => (
            <button
              key={s.kicker}
              type="button"
              aria-pressed={i === step}
              onClick={() => {
                setStep(i)
                setOut(null)
              }}
              className={`border px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] ${
                i === step
                  ? 'border-pop bg-pop text-paper'
                  : 'border-dim text-dim hover:border-pop hover:text-pop'
              }`}
            >
              {s.kicker}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h3 className="mt-0 mb-3 font-display text-3xl font-bold tracking-tight">
              {current?.title}
            </h3>
            <p className="m-0 max-w-md text-[0.95rem] text-dim">{current?.body}</p>
          </div>

          <div className="grid grid-rows-[1.15fr_1fr] gap-3 lg:h-[68svh]">
            <div className="min-h-0 overflow-auto border border-ink bg-carbon font-code text-[0.8rem] leading-relaxed">
              <div
                className="h-full [&_pre]:m-0 [&_pre]:h-full [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: morphSteps[step] ?? '' }}
              />
            </div>
            <div className="demo-pane min-h-0 overflow-auto border border-ink bg-paper p-6">
              {schema ? (
                <ZodForm key={step} schema={schema} onSubmit={setOut}>
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
