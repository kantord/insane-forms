---
name: code-panel-coverage
description: The "no black boxes" coverage gate for the Storybook code panel — every symbol shown in displayed code must link to docs or be exempt. Use when adding field bindings/widgets, or when the check:code-panel gate fails.
---

# Code-panel coverage ("no black boxes")

The code panel (`apps/storybook/.storybook/code-panel.plugin.ts`) auto-links symbols shown in
displayed code to their docs: shadcn primitives → Base UI docs (from the vendored registry), and
our own bindings/shells → their Storybook pages (from `code-panel-crossref.json`). This gate
checks that **every** meaningful symbol shown is either linked or deliberately exempt.

## This is a plain build-time check (no esto)

The desired state is a constant — "everything covered" — so it's a single pass, not a reconcile.
The whole thing is `apps/storybook/.storybook/code-panel-coverage.mjs` (TypeScript compiler API),
run as a script:

```bash
pnpm run check:code-panel          # repo root; also part of `pnpm run ci`
node apps/storybook/.storybook/code-panel-coverage.mjs --json   # machine-readable
```

It parses `packages/examples/fields.tsx`, collects every PascalCase identifier + `insane.*` call
shown, classifies each by import source / declaration (shadcn / core / local / external / builtin),
and exits non-zero listing any that are neither linked nor exempt.

> Why not esto? An earlier version wired this through the `esto` reconcile engine. But with a
> constant target the diff degenerates to "filter the uncovered set" and the enter/exit/update
> lifecycle goes unused — plain build-time code is simpler. Reserve esto for drift where both
> sides genuinely vary (see the `shadcn-drift` skill).

## Resolving a failure

The gate lists each black box with its class. Resolve **one** of (both files live in
`apps/storybook/.storybook/`, and are the SAME files the plugin reads — so a symbol is "covered"
iff it actually renders a link):

- `code-panel-crossref.json` — `"Symbol": "<doc or Storybook story URL>"` → it should link.
- `code-panel-exempt.json` — `"Symbol"` → an internal detail not worth documenting.

`external` (react/lucide/zod) and `builtin` (JS/TS globals) are auto-exempt.

## Scope & follow-up

- Covers symbols in `fields.tsx` (the binding/shell/widget definitions the panel shows for the
  widget & shell stories). It does NOT yet scan story render bodies, so symbols used only there
  (e.g. `ZodForm`, `demoSubmit`) are shown in the panel but not gated — a known gap. Extending the
  enumerator to story bodies + their imports is the follow-up that makes the claim fully true.
- We use the `typescript` compiler (already a dep), not `ts-morph`, per the supply-chain policy
  (quality-gates skill). One analysis tool; `ts-morph` is a clean swap-in if deeper resolution is needed.
