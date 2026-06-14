---
name: code-example-pipeline
description: One-source-of-truth rules for all displayed code — landing snippets, Magic Move morph steps, and Storybook code panels. Use when adding/editing examples, stories, the snippets Vite plugin, or anything that shows code to users.
---

# Code example pipeline

**Displayed code is never hand-written.** Every snippet a user sees is sliced
from a real, compiled, tested module — so docs cannot drift from working code.

## The pipeline

- **Source modules** live in `examples/` (`profile.tsx`, `terminal.tsx`,
  `meadow.tsx`, `morph.tsx`, `shadcn/`). Each is rendered by Storybook stories
  (with the axe a11y gate) and/or the vitest suites.
- **Landing snippets**: `playground/snippets.plugin.ts` slices marked regions
  from those files at build time and highlights them with Shiki using custom
  per-biome themes. Zero highlighting JS ships to the browser.
- **Magic Move morph steps**: the same plugin splits `examples/morph.tsx` at
  `/* step:N */` markers, precompiles keyed tokens
  (`codeToKeyedTokens` + `createMagicMoveMachine`, bureau theme), and the
  runtime ships ONLY `ShikiMagicMovePrecompiled` — verify zero Shiki in the
  bundle (no `oniguruma`/`grammar` strings in dist). The only allowed display
  transform is identifier renaming (`export const StepN` → `const Profile`).
- **Storybook code panels**: `.storybook/preview.tsx` shows each story's
  render body VERBATIM from the raw file (`import.meta.glob(..., ?raw)`,
  brace-balanced extraction) — because Storybook's `originalSource` is an AST
  re-print that drops blank lines. The canvas Code panel additionally needs
  the `emitTransformCode` decorator (the React renderer skips snippet emission
  for `source.type: 'code'`).

## Code annotations (hover explanations)

Confusing parts of displayed code get `// @note(target) explanation` comments
in the example file itself (single source of truth — the explanation lives
next to the code it explains). The build plugin strips them from display and
attaches the text to the first occurrence of `target` (whole line if no
target) as a Shiki decoration: a `.code-note` span — dotted underline,
`tabindex="0"`, popover on hover/focus, `aria-label` for screen readers. A
trailing note annotates its own line; a standalone note line annotates the
NEXT code line (Biome relocates long trailing comments, so both are handled).
`target` may contain one level of parens (e.g. `@note(.min(1).max(3))`). Magic
Move panes strip notes without rendering them (keyed tokens can't carry
decorations). The e2e suite asserts notes exist and `@note` never leaks.

## Authoring rules

- Biome formats everything (`pnpm run format`); the verbatim pipeline means
  formatting on disk IS the formatting users see. Blank-line segmentation is
  deliberate and load-bearing.
- Stories are written as `render: () => { …schema… return <ZodForm…> }` —
  the panel shows exactly that body. Keep the interesting part inline; hide
  boring plumbing behind one honest import from `stories/demo.tsx`
  (`demoSubmit`, fixtures, `ProductTable`). NOTE: `ZodForm` is a USERLAND form
  wrapper imported from `examples/react-hook-form` (an engine binding shown, not
  shipped) — the core publishes no form component. The core surface is the
  schema builders + `<Render schema engine={…}>`; a form library is connected
  by implementing the 3-hook `FieldEngine` and (optionally) `createFormRenderer`.
- Shared chrome (`examples/biomes.css`) is imported by BOTH the landing and
  Storybook so examples render identically in both harnesses.
- New display surface? It must consume one of these mechanisms — never an
  inline string.

## Changing these decisions

These are settled, evidence-backed decisions. If you find clear contradicting
evidence, or the user explicitly asks for behavior that conflicts with this
skill: do NOT silently comply or quietly adapt. State the conflict, get
explicit confirmation via the AskUserQuestion tool, and update this skill in
the same change so it stays the source of truth.
