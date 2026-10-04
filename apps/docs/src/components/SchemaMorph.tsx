import { Step2, Step3, Step4 } from '@insane-forms/examples/morph'
import { ZodForm } from '@insane-forms/examples/react-hook-form'
import { useEffect, useRef, useState } from 'react'
import Xarrow, { Xwrapper } from 'react-xarrows'
import type { ZodType } from 'zod'
import { useSnippets } from '../hooks/useSnippets'
import { Receipt } from './Receipt'

/** Matches `max-h-40` below — kept as a number so it can be compared against
 * a measured `scrollHeight`. */
const CODE_MAX_HEIGHT = 160

/** A code pane that only crops (and only shows the fade affordance) when its
 * content actually overflows — a short example renders at its full natural
 * height, uncropped, no fade. Measured client-side after mount rather than
 * capped unconditionally: capping every pane regardless of content length
 * faded the last line of SHORT examples too, dimming text nothing was
 * actually hiding. Vertical and horizontal overflow are independent (a
 * short-but-wide example can need the right fade without the bottom one,
 * and vice versa) — `.carbon > pre`'s own `overflow-x: auto` (custom.css)
 * already handles the horizontal SCROLL; this only measures whether that
 * scroll has anything to do. */
const CodePane = ({ html }: { html: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [clampY, setClampY] = useState(false)
  const [clampX, setClampX] = useState(false)

  useEffect(() => {
    const el = ref.current
    const pre = el?.querySelector('pre')
    if (!el || !pre) return
    setClampY(el.scrollHeight > CODE_MAX_HEIGHT)
    setClampX(pre.scrollWidth > pre.clientWidth)
  }, [])

  return (
    <div
      className={`relative min-w-0 border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:p-6 ${clampY ? 'max-h-40 overflow-hidden' : ''}`}
    >
      <div
        ref={ref}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {clampY && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-carbon to-transparent" />
      )}
      {clampX && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-carbon to-transparent" />
      )}
    </div>
  )
}

const LATER_STEPS = [
  {
    id: '2',
    kicker: 'step 2 · customize',
    title: 'Fields are customizable Zod schemata',
    body: 'A field takes the same .min(), .email(), .meta() chaining as any plain Zod schema — because it is one. No separate customization API to learn.',
    schema: Step2,
  },
  {
    id: '3',
    kicker: 'step 3 · compose',
    title: 'Fields compose like any schema',
    body: 'Group two fields into an object and you get exactly what z.object({ … }) gives you — fields compose the same way plain Zod schemas do.',
    schema: Step3,
  },
  {
    id: '4',
    kicker: 'step 4 · inject markup',
    title: 'Plain React, anywhere',
    body: 'insane.group() takes fields OR plain elements as parts — a heading here is just <h4>, dropped straight into the schema. Full control over markup, not just fields.',
    schema: Step4,
  },
] as const

/** Steps 2-4's shared section template: a vertical split, kicker/title/body
 * on the left, code examples on the right — code and its live demo stacked
 * (code above the preview), not side by side, so the right column's full
 * width goes to each in turn instead of halving it. Its own `useState` for
 * the submit receipt, since all steps are rendered simultaneously (not one
 * active step at a time), each needs an independent output. */
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
        <div className="mt-2 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
          <div>
            <h3 className="mt-0 mb-3 font-display text-3xl font-bold tracking-tight">{title}</h3>
            <p className="m-0 max-w-md text-[0.95rem] text-dim">{body}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <CodePane html={snippetHtml} />
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

/** Step 1's own template — the only step that converges from two separate
 * things (the schema, the hand-written UI), so the only one with a dual
 * code pane + `react-xarrows` funnel instead of MorphStep's single
 * code-next-to-demo grid. Two distinct block types by design, each used
 * once per lesson count: this one once, MorphStep three times. */
const FunnelStep = () => {
  const { snippets } = useSnippets()

  return (
    <section
      id="morph"
      className="biome-bureau w-full border-t-[length:var(--rule-w)] border-line bg-paper-deep/40 py-16 text-ink"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <span className="text-[0.78rem] font-bold uppercase tracking-[0.2em] text-pop">
          step 1 · bind
        </span>
        <h3 className="mt-2 mb-3 font-display text-3xl font-bold tracking-tight">
          Small schemata for small components
        </h3>
        <p className="m-0 mb-8 max-w-2xl text-[0.95rem] text-dim">
          A schema is data; historically, the UI is a second file you write and wire up by hand —
          completely separate. insane-forms merges the two: a schema and a widget, bound once into a
          field.
        </p>

        <Xwrapper>
          {/* gap-y-8: an explicit, artificial gap so the arrows have real
           * room to read as arrows — bigger than the site's usual gap-y-3,
           * but not so big it exaggerates the height difference below. */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            {/* flex flex-col on each wrapper + flex-1 on the code box:
             * CSS Grid's default `align-items: stretch` already makes
             * both wrappers the height of the taller one, but a plain
             * block child doesn't fill that extra space — it just leaves
             * it empty below the (shorter) actual code block, so THAT
             * arrow starts from real content but then crosses a bunch of
             * dead air before reaching the same gap-y-8 the other arrow
             * gets. `flex-1` makes the code box itself absorb the slack,
             * so both boxes' bottom edges — and so both arrows' start
             * points and lengths — match exactly, not just their anchor
             * X position. */}
            <div className="flex min-w-0 flex-col">
              <div className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
                The schema (Zod)
              </div>
              <div
                id="funnel-data-code"
                className="min-w-0 flex-1 overflow-hidden border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:overflow-hidden [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: snippets['bare-schema'] ?? '' }}
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="mb-2 text-[0.68rem] uppercase tracking-[0.16em] text-dim">
                The form field (any React component)
              </div>
              <div
                id="funnel-ui-code"
                className="min-w-0 flex-1 overflow-hidden border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:overflow-hidden [&_pre]:p-6"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                dangerouslySetInnerHTML={{ __html: snippets['hand-written-input'] ?? '' }}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="relative">
                {/* Two zero-height landing points, positioned at the top
                 * of the CODE BOX below (not the label above it), in the
                 * SAME grid-cols-1/sm:grid-cols-2 + gap-x-6 as the row
                 * above — identical column math, so their centers land
                 * exactly under funnel-data-code/funnel-ui-code
                 * regardless of viewport width, giving each arrow a true
                 * vertical drop instead of slanting toward this box's own
                 * (wider, differently-centered) top edge. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <div id="funnel-field-left" />
                  <div id="funnel-field-right" />
                </div>
                <div
                  className="overflow-hidden border-[length:var(--rule-w)] border-line bg-carbon font-code text-[0.8rem] leading-relaxed [&_pre]:m-0 [&_pre]:overflow-hidden [&_pre]:p-6"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time Shiki output from our own files
                  dangerouslySetInnerHTML={{ __html: snippets['text-field-binding'] ?? '' }}
                />
              </div>
            </div>
          </div>

          <Xarrow
            start="funnel-data-code"
            end="funnel-field-left"
            startAnchor="bottom"
            endAnchor="top"
            path="straight"
            color="var(--color-ink)"
            strokeWidth={2}
            headSize={5}
          />
          <Xarrow
            start="funnel-ui-code"
            end="funnel-field-right"
            startAnchor="bottom"
            endAnchor="top"
            path="straight"
            color="var(--color-ink)"
            strokeWidth={2}
            headSize={5}
          />
        </Xwrapper>
      </div>
    </section>
  )
}

/** The old landing page drove this with a sticky-scroll + Magic Move code
 * animation; a later rewrite replaced that with a click-to-swap step
 * selector; replaced again with static, stacked sections (see git history
 * for both). Four lessons, each building on the field the previous step
 * produced (packages/examples/morph.tsx has the full progression):
 *
 * 1. bind — the funnel: "the data" and "the UI" (two separate, disconnected
 *    files) converge into "the field itself", with `react-xarrows` drawing
 *    the two connecting arrows. The only step that converges from two
 *    things, so the only one with arrows.
 * 2. customize — the SAME field takes .min()/.meta() chaining, because it's
 *    still a plain Zod schema underneath.
 * 3. compose — two customized fields grouped into one object, the same way
 *    z.object({ … }) composes plain schemas.
 * 4. inject markup — that composed group, plus a plain <h4> dropped in as a
 *    part alongside the fields: insane.group() takes elements, not just
 *    field definitions. */
export const SchemaMorph = () => {
  const { morphSteps } = useSnippets()

  return (
    <>
      <FunnelStep />

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
