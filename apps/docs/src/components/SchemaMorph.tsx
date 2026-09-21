import { HandWrittenNameInput, Step3, Step4 } from '@insane-forms/examples/morph'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import { useState } from 'react'
import type { ZodType } from 'zod'
import { useSnippets } from '../hooks/useSnippets'
import { Receipt } from './Receipt'

const LATER_STEPS = [
  {
    id: '3',
    kicker: 'step 3 · annotate',
    title: 'Titles live in the schema',
    body: 'Labels and descriptions are .meta() too — plain Zod chaining, and the shell renders them. The schema is still a schema: parse it, infer from it.',
    schema: Step3,
  },
  {
    id: '4',
    kicker: 'step 4 · validate',
    title: 'Checks come free',
    body: 'Add .min() — the same declaration validates the draft and gates submit. Try submitting empty.',
    schema: Step4,
  },
] as const

/** One of steps 3-4's full section — its own `useState` for the submit
 * receipt, since all steps are rendered simultaneously (not one active step
 * at a time), each needs an independent output. */
const MorphStep = ({
  id,
  kicker,
  title,
  body,
  schema,
  snippetHtml,
}: {
  id: string
  kicker: string
  title: string
  body: string
  schema: ZodType
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:p-6">
              <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: snippetHtml }}
              />
            </div>
            <div className="demo-pane border-[length:var(--rule-w)] border-line bg-paper p-6">
              <ZodForm schema={schema} onSubmit={setOut}>
                <button type="submit">Save</button>
              </ZodForm>
              {out != null && <Receipt data={out} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** The old landing page drove this with a sticky-scroll + Magic Move code
 * animation; a later rewrite replaced that with a click-to-swap step
 * selector; replaced again with static, stacked sections (see git history
 * for both). This pass adds a funnel: step 1 shows the schema AND a
 * hand-written UI as two SEPARATE code panes — historically two files, one
 * hand-wired to the other — instead of the old single "nothing renders yet"
 * message. Step 2 is the merge itself: TWO code panes again (rhyming with
 * step 1's layout), but now both about the SAME merged thing — the schema's
 * usage on the left, and on the right the actual `insane.field({ schema,
 * widget, shell })` line where a schema and a widget become one field. NO
 * live demo at step 2 — the point there is the binding, not a rendered
 * result; that comes back starting step 3, once there's something worth
 * proving actually works. Steps 3-4 iterate on the now-merged field.
 *
 * Deliberately atomic (a single `name` field, not a multi-key object): the
 * lesson here is "two files become one," which reads clearly for one field.
 * A composed object would suggest the OTHER lesson — multiple fields
 * combining — which the biome showcases below this section already own;
 * showing it here too would blur which lesson is which. See
 * packages/examples/morph.tsx for the full schema progression. */
export const SchemaMorph = () => {
  const { morphSteps, snippets } = useSnippets()

  return (
    <>
      <section
        id="morph"
        className="biome-bureau w-full border-t-[length:var(--rule-w)] border-line bg-paper-deep/40 py-16 text-ink"
      >
        <div className="mx-auto max-w-[1180px] px-6">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">
            step 1 · data
          </span>
          <h3 className="mt-2 mb-3 font-display text-3xl font-bold tracking-tight">
            Start with plain Zod
          </h3>
          <p className="m-0 mb-8 max-w-2xl text-[0.95rem] text-dim">
            A schema is data — nothing renders from it alone. Historically, the UI is a second,
            completely separate file you write and wire up by hand. insane-forms exists to merge
            these two back into one.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
                the data
              </div>
              <div
                className="border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: morphSteps['1'] ?? '' }}
              />
            </div>
            <div>
              <div className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
                the UI — wired by hand, disconnected
              </div>
              <div
                className="border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: morphSteps['1b'] ?? '' }}
              />
              <div className="demo-pane mt-3 border-[length:var(--rule-w)] border-line bg-paper p-4">
                <HandWrittenNameInput />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="morph-step-2"
        className="biome-bureau w-full border-t-[length:var(--rule-w)] border-line bg-paper-deep/40 py-16 text-ink"
      >
        <div className="mx-auto max-w-[1180px] px-6">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">
            step 2 · bind
          </span>
          <h3 className="mt-2 mb-3 font-display text-3xl font-bold tracking-tight">
            Fields carry their widgets
          </h3>
          <p className="m-0 mb-8 max-w-2xl text-[0.95rem] text-dim">
            The schema and the UI are no longer two files — one node now carries both. This is the
            merge itself: a schema and a widget, bound once into a field.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
                using the field
              </div>
              <div
                className="border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: morphSteps['2'] ?? '' }}
              />
            </div>
            <div>
              <div className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
                the field itself — where they merge
              </div>
              <div
                className="border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: snippets['text-field-binding'] ?? '' }}
              />
            </div>
          </div>
        </div>
      </section>

      {LATER_STEPS.map((s) => (
        <MorphStep
          key={s.id}
          id={`morph-step-${s.id}`}
          kicker={s.kicker}
          title={s.title}
          body={s.body}
          schema={s.schema}
          snippetHtml={morphSteps[s.id] ?? ''}
        />
      ))}
    </>
  )
}
