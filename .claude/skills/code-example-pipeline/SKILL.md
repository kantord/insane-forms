---
name: code-example-pipeline
description: One-source-of-truth rules for all displayed code — landing snippets, Magic Move morph steps, and Storybook code panels. Use when adding/editing examples, stories, the snippets Vite plugin, or anything that shows code to users.
---

# Code example pipeline

**Displayed code is never hand-written.** Every snippet a user sees is sliced
from a real, compiled, tested module — so docs cannot drift from working code.

## The pipeline

- **Source modules** live in `packages/examples/` (`profile.tsx`, `terminal.tsx`,
  `meadow.tsx`, `morph.tsx`, `fields.tsx`); the UNCHANGED shadcn components are in
  `packages/ui/components`. Each module is rendered by Storybook stories
  (`apps/storybook/stories/`, with the axe a11y gate) and/or the vitest suites.
- **Landing snippets**: `apps/landing/snippets.plugin.ts` slices marked regions
  from those files (resolved at `../../packages/examples`) at build time and
  highlights them with Shiki using custom per-biome themes. Zero highlighting JS
  ships to the browser.
- **Magic Move morph steps**: the same plugin splits `packages/examples/morph.tsx`
  at `/* step:N */` markers, precompiles keyed tokens
  (`codeToKeyedTokens` + `createMagicMoveMachine`, bureau theme), and the
  runtime ships ONLY `ShikiMagicMovePrecompiled` — verify zero Shiki in the
  bundle (no `oniguruma`/`grammar` strings in dist). The only allowed display
  transform is identifier renaming (`export const StepN` → `const Profile`).
- **Storybook code panel (custom, default)**: a CUSTOM "Code" panel
  (`apps/storybook/.storybook/manager.tsx`) replaces the built-in one and is the
  default selected panel (`addons.setConfig({ selectedPanel })`); Controls/Actions
  are disabled (`parameters.controls/actions: { disable: true }`). Its content is
  highlighted at BUILD TIME by a Vite plugin (`code-panel.plugin.ts`) — same
  zero-runtime-Shiki rule as the landing page — into a virtual module
  (`virtual:insane-code-panel`, typed in `code-panel.d.ts`), keyed file basename →
  story display name → HTML. The preview looks up the current story's HTML and
  sends it to the manager over the channel (`code-panel.shared.ts` constants); the
  manager renders it with `dangerouslySetInnerHTML`. The Docs tab still renders
  source via the `docs.source` transform + `emitTransformCode` decorator.
  - TWO gotchas, both from the manager running its OWN React 18 (separate from the
    workspace React 19): in `manager.tsx` build elements with
    `React.createElement` (NO JSX — JSX compiles to React 19's jsx-runtime, whose
    elements React 18 can't render → "addon has errors"), and use Storybook's
    hooks from `storybook/manager-api` (`useAddonState`/`useChannel`), never
    React's hooks.
  - The plugin slices each story's render body (brace-balanced from the raw file).
    THREE per-file view modes (chosen by marker, see `code-panel.plugin.ts`):
    - default (no marker): the render body verbatim (the composition is the lesson).
    - `@code-panel:field-definition` (the shadcn Widgets): each featured
      `insane.field()` binding's definition (sliced from the real `fields.tsx`) +
      the example schema, with the `return (<form…>)` boilerplate dropped — "how
      the field is built" is the lesson there, not the wrapper. A binding that
      delegates to a named widget const (`widget: DatePickerWidget`) also gets that
      const's body prepended (`extractConstArrow`), so the panel shows the real
      composition, not just the reference.
    - `@code-panel:shell-definition` (the shadcn Shells): the shell(s) the story's
      fields use — found by mapping each field-in-schema to the `shell: X` in its
      binding def, then slicing that `const X: Shell = …` from `fields.tsx` — then
      the render body as a usage example. "What a shell IS + one use." (`extractShellDefs`
      reads source text, so shells need not be exported.)

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

## Direction: no black boxes, no dead ends

North star for the whole displayed-code system: every token that refers to a real
project concept is reachable — shown inline, or hover-doc'd + linked to its
playground page. Only non-lessons may be silently hidden (example data, demo-app
chrome, the `ZodForm` harness). Three treatments: (1) inline-expand our own small
compositions on their own page (e.g. `extractConstArrow` showing `DatePickerWidget`);
(2) reference + hover-link for vendored shadcn primitives / cross-refs to other
insane pages / "field extends field"; (3) silently hide non-lessons. Treatment is
contextual — an identifier is inlined on its OWN page but a link elsewhere.

PILOTED (not yet rolled out): the Storybook code panel marks referenced identifiers
via a `REFERENCES` registry in `code-panel.plugin.ts` (identifier → {doc, href}) that
emits Shiki `code-note` decorations carrying `data-note` + `data-href`; `manager.tsx`
supplies the popover CSS + a click handler that opens `data-href`. Seeded with one
entry (`Checkbox` → shadcn docs). NOT YET DONE for full rollout (see the
[[code-example-no-black-boxes]] memory): link-target policy by origin, deriving the
hover text from a doc-comment at the definition (not hand-authored), a "meaningful
reference" allowlist, and a completeness TEST (every meaningful identifier is shown/
noted/linked) — the teeth that keep the property from rotting.

## Authoring rules

- Biome formats everything (`pnpm run format`); the verbatim pipeline means
  formatting on disk IS the formatting users see. Blank-line segmentation is
  deliberate and load-bearing.
- Stories are written as `render: () => { …schema… return <ZodForm…> }` — the
  panel shows that body verbatim (EXCEPT in `@code-panel:field-definition` files,
  where it shows the binding definition + schema and drops the `return` JSX; see
  the pipeline section). Keep the interesting part inline; hide boring plumbing
  behind one honest import from `apps/storybook/stories/demo.tsx`
  (`demoSubmit`, fixtures, `ProductTable`). NOTE: `ZodForm` is a USERLAND form
  wrapper imported from `@insane-forms/examples/react-hook-form` (an engine binding shown, not
  shipped) — the core publishes no form component. The core surface is the
  schema builders + `<Render schema engine={…}>`; a form library is connected
  by implementing the 3-hook `FieldEngine` and (optionally) `createFormRenderer`.
- Shared chrome (`packages/examples/biomes.css`) is imported by BOTH the landing and
  Storybook so examples render identically in both harnesses.
- New display surface? It must consume one of these mechanisms — never an
  inline string.

## Demo apps (story framing) + theming

- `apps/storybook/stories/demo-shell.tsx` holds THREE fake apps in `DEMO_APPS` (registry:
  variant → `Shell` + `themeClass` + `defaultPage`): `catering` (warm sidebar
  back-office), `dev` (cool violet tabbed console, monospace), `store` (emerald
  top-bar admin). Applied as a DECORATOR (in `apps/storybook/.storybook/preview.tsx`) via
  `parameters.demo`, so chrome NEVER reaches the code panel. Pure chrome — no
  inputs of their own (can't collide with a11y queries), responsive (md:
  breakpoints), nav labels avoid every play's button regexes.
- `parameters.demo` is `{ variant, section, title, description? }` or
  `{ variant: 'none' }` (thin wrapper, stock shadcn — Widgets/Morph/Biomes).
  The `section`/`title`/`description` is a HINT that applies ONLY when the active
  app equals the example's own `variant`; in any OTHER app the shell shows that
  app's `defaultPage`. So an example only authors page chrome for its default app.
- Two toolbar globals (built-in, no addon; defaults in `initialGlobals`):
  `theme` (light/dark → toggles `.dark` on the iframe root) and `demoApp`
  (`auto` = use the story's own variant, or force one). Switching app/theme is
  the user's; each story has a sensible default.
- Theming is token-only (`packages/examples/demo-themes.css`, loaded AFTER globals so the
  equal-specificity `.theme-*` rules win): each app remaps `--primary`/`--accent`/
  `--ring`/`--radius`/`--demo-page` (+ `--app-font`) for light AND dark. The form
  examples read these tokens, so the SAME example restyles per app with ZERO
  code changes. Fonts: `--font-sans` is `var(--app-font)` in globals (indirection
  so a theme can swap it); all self-hosted via Fontsource (dev = JetBrains Mono).
- The a11y gate runs in the default (light) theme — contrast-check custom
  accents there (amber-on-tint bit once; semantic `--primary` avoids it).

## Changing these decisions

These are settled, evidence-backed decisions. If you find clear contradicting
evidence, or the user explicitly asks for behavior that conflicts with this
skill: do NOT silently comply or quietly adapt. State the conflict, get
explicit confirmation via the AskUserQuestion tool, and update this skill in
the same change so it stays the source of truth.
