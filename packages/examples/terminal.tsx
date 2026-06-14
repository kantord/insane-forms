/** examples/terminal.tsx — a second design system: phosphor-terminal chrome.
 * Same library, same recursive-schema pattern — every visual is user code,
 * styled with semantic tokens the page remaps per style biome. */

import type { CollectionWrapper, FieldProps, Shell } from 'insane-forms'
import * as insane from 'insane-forms'
import * as z from 'zod'
import { ZodForm } from './react-hook-form'

const TerminalShell: Shell = ({ name, label, error, children }) => (
  <div className="mb-3">
    {label !== undefined && (
      <label
        htmlFor={name}
        className="mb-1 block text-[0.7rem] uppercase tracking-[0.2em] text-dim"
      >
        <span className="text-pop">▸</span> {label}
      </label>
    )}
    {children}
    {error !== undefined && (
      <em role="alert" className="mt-1 block text-[0.72rem] text-pop not-italic">
        ! {error}
      </em>
    )}
  </div>
)

const TextWidget = (p: FieldProps<string | undefined>) => (
  <input
    id={p.name}
    name={p.name}
    value={p.value ?? ''}
    onChange={(e) => p.onChange(e.target.value)}
    onBlur={p.onBlur}
    className="w-full border border-rule bg-paper-deep px-2 py-1.5 font-mono text-sm text-ink caret-pop outline-none focus:border-pop"
  />
)

const TreeBox: CollectionWrapper = ({ items, add }) => (
  <fieldset className="ml-1 border-y-0 border-r-0 border-l border-dashed border-rule pl-3">
    {items.map((it) => (
      <div key={it.key} className="relative mt-2 pr-8">
        {it.node}
        {it.remove && (
          <button
            type="button"
            data-remove
            aria-label="Remove node"
            onClick={it.remove}
            className="absolute top-1 right-0 size-5 border border-pop text-[0.7rem] text-pop hover:bg-pop hover:text-paper"
          >
            ×
          </button>
        )}
      </div>
    ))}
    {add && (
      <button
        type="button"
        data-add
        onClick={add}
        className="mt-2 border border-dashed border-dim px-2 py-1 text-[0.72rem] uppercase tracking-widest text-dim hover:border-pop hover:text-pop"
      >
        [ + node ]
      </button>
    )}
  </fieldset>
)

const text = insane.field({ widget: TextWidget, shell: TerminalShell })

export type TreeNode = { name: string; children: TreeNode[] }

export const Tree: z.ZodType<TreeNode> = z.lazy(() =>
  // @note(z.lazy) Recursion is just Zod: each level defers, so the form renders exactly as deep as the data goes.
  insane.group({
    name: text(z.string().min(1).meta({ title: 'name' })),
    children: insane.list(Tree, { wrapper: TreeBox }), // @note(TreeBox) All list chrome is user code — this wrapper decides what add/remove even look like.
  }),
)

export const TerminalTreeForm = ({
  value,
  onSubmit,
}: {
  value: TreeNode
  onSubmit: (d: TreeNode) => void
}) => (
  <ZodForm schema={Tree} defaults={value} onSubmit={onSubmit}>
    <button
      type="submit"
      className="mt-5 border border-pop px-5 py-1.5 text-[0.78rem] uppercase tracking-[0.2em] text-pop hover:bg-pop hover:text-paper"
    >
      run ▸
    </button>
  </ZodForm>
)
