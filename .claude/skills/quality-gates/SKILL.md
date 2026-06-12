---
name: quality-gates
description: The verification chain, supply-chain policy, and repo conventions for insane-forms. Use before declaring any change done, when adding dependencies, or when touching CI/tooling config.
---

# Quality gates & conventions

## The gate chain — green before "done"

1. `pnpm run format` then `pnpm run lint` (Biome check: lint + format drift).
2. `pnpm run typecheck` (tsc strict; includes the `@ts-expect-error` guard
   suite in `tests/types.check.tsx`).
3. `pnpm run test` — TWO vitest projects: `unit` (jsdom, `tests/`) and
   `storybook` (browser mode, real Chrome via playwright `chrome` channel —
   no browser downloads). Story tests include the axe gate
   (`a11y: { test: 'error' }`): a11y violations FAIL the run. Green means
   checked — when adding a11y-sensitive chrome, prove the gate fires (canary).
4. `pnpm run ci` additionally builds (tsdown — `"use client"` must be line 1
   of dist) and runs publint + attw (esm-only profile).
5. `pnpm exec playwright test` — e2e against the BUILT artifact
   (`build:docs` + `build:storybook` first; exactly what GitHub Pages serves).
6. Visual/behavioral claims get verified in a real browser (chrome-devtools
   MCP or headless chromium), with measurements, not assumptions.
7. `pnpm run perf` — Lighthouse budget gate on the built landing page
   (LCP ≤ 2.5s error, TBT ≤ 300ms error, CLS ≤ 0.1 error, perf score ≥ 0.9
   warn); runs in the Pages workflow. `pnpm run analyze` produces the bundle
   composition report backing the measure-first islands decision.

## Supply chain (pnpm-workspace.yaml)

- `minimumReleaseAge: 10080` (7 days). When a wanted version is too fresh,
  pin the newest mature version IN THE SAME MAJOR — never date-sort across
  majors, never relax the window.
- Dependency build scripts are blocked by default. Each `allowBuilds` entry is
  reviewed and commented; prefer `false` when the package works script-less
  (esbuild, msw, playwright do).
- The published library keeps ZERO runtime dependencies — everything new goes
  to devDependencies; example/demo stacks (shadcn, nuqs, sonner…) too.

## Conventions

- The user runs `git commit` themselves — suggest a validated message
  (commit-msg skill), stage, stop.
- Library core: `src/insane.tsx`, named exports only, tree-shakeable (the
  resolve-only import stays ~0.7 kB); no DOM in core; new introspection
  helpers are partial applications of `resolve`.
- shadcn bindings are named `<Component>Field` (`InputField`, `CheckboxField`,
  curried `selectField`); shadcn components stay CLI-managed under
  `examples/shadcn/components/ui` (lint-excluded, vendored).
- No external network requests from any shipped page (fonts self-hosted).

## Changing these decisions

These are settled, evidence-backed decisions. If you find clear contradicting
evidence, or the user explicitly asks for behavior that conflicts with this
skill: do NOT silently comply or quietly adapt. State the conflict, get
explicit confirmation via the AskUserQuestion tool, and update this skill in
the same change so it stays the source of truth.
