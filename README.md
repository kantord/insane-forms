# insane-forms

Schema-driven React forms on plain Zod: the schema **is** the form.

Bind a UI control once, specialize it with Zod, and compose reusable form schemas.
A field or group's position supplies its form-state path, so you do not separately
author a matching tree of input bindings. A meaningful unit such as an address
can be a reusable schema composition rather than a monolithic UI component.

Insane-forms adds rendering and composition to a form-state engine such as React
Hook Form; it does not replace that engine. The core exports `Render` and the
`FieldEngine` contract. The `ZodForm` used below is a repository example wrapper,
not an export of the published package. `TextWidget` and `FieldShell` stand for
your control binding and field chrome.

```tsx
import * as z from 'zod'
import * as insane from 'insane-forms'
// Repository example integration; copy/adapt it for an application:
import { ZodForm } from './packages/examples/react-hook-form'

const TextField = insane.field({ schema: z.string(), widget: TextWidget, shell: FieldShell })
const FirstNameField = TextField.min(2).meta({ title: 'First name' })

const Profile = insane.group(
  <h3>Account</h3>,
  {
    name: FirstNameField,
    email: TextField.email().meta({ title: 'Email' }),
  },
)

<ZodForm schema={Profile} onSubmit={(data) => console.log(data)}>
  <button type="submit">Save</button>
</ZodForm>
```

The resulting values remain Zod schemas. Examples cover ordinary field chaining,
nested groups, lists, and `z.lazy` recursion; JSX decorations do not enter the data.
Widgets handle control presentation, shells handle labels/errors, and collection
wrappers handle list chrome. The core adds no DOM of its own.

The RHF example wrapper parses submissions; widgets may edit incomplete or
submission-invalid values. `z.input` alone is not a validator accepting every
editing state. Rendering continuity under every Zod derivation, initialization,
and binding type enforcement still have known gaps. See the
[design reference](apps/docs/docs/guides/design-reference.md) and
[diagnosis](docs/diagnosis.md) for current behavior and intended guarantees.
An installable shadcn binding set is a planned adoption direction, not a currently
documented package or registry installation path.

## Layout

- `packages/core/` — schema builders, introspection, `Render`, and engine contracts;
  runtime tests and compile-time fixtures live under `tests/`.
- `packages/examples/` — reusable fields, shells, recursive forms, and example
  engine integration, including `ZodForm` and `useZodForm`; interaction tests live
  under `tests/`.
- `packages/ui/` — shared UI components used by the examples.
- `apps/docs/` — documentation and landing page with live examples.
- `apps/storybook/` — component explorer, integration examples, and browser tests.
- `docs/` — product discovery, research, diagnosis, and backlogs. The
  [review plan](docs/review-plan.md) owns investigation sequencing; the
  [product notes](docs/product-discovery-notes.md) record intent and superseded claims.

## Scripts

| script | what |
|---|---|
| `pnpm play` | Docusaurus development server |
| `pnpm storybook` | Component explorer development server |
| `pnpm test` | Root Vitest tests, then Storybook tests |
| `pnpm typecheck` | `tsc --noEmit`, including compile-time fixtures |
| `pnpm lint` | Biome |
| `pnpm build` | Build the core package with tsdown |
| `pnpm build:docs` / `pnpm build:storybook` | Build the website / explorer |
| `pnpm check:package` | publint + arethetypeswrong (ESM-only profile) |
| `pnpm ci` | Lint, types, tests, build, package, code-panel, and documentation/API checks |

## Current package boundaries

- The source entry begins with `'use client'`; backend-safe reuse of UI-bound
  schemas remains future exploration, not a current integration guarantee.
- The core uses named exports and declares `sideEffects: false`. It imports no
  form engine at runtime, but its manifest currently still lists RHF and resolver
  peers. Source independence does not imply an engine-independent install contract.
- The package is ESM-only. Check `packages/core/package.json` for its current
  exports and peer versions, and use `pnpm measure` for bundle measurements.
- A separately published engine adapter and easily installed UI bindings remain
  distribution work to design; no `insane-forms/react-hook-form` export exists today.
