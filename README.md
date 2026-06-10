# insane-forms

Schema-driven React forms on plain Zod: the schema **is** the form.

```tsx
const TextField = insane.field({ schema: z.string(), widget: TextWidget, shell: FieldShell })

const Profile = insane.group(
  <h3>Account</h3>,
  {
    name:  TextField.min(2).meta({ title: 'Name' }),
    email: TextField.email().meta({ title: 'Email' }),
  },
)

<insane.ZodForm schema={Profile} onSubmit={(data) => /* z.output<typeof Profile> */} >
  <button type="submit">Save</button>
</insane.ZodForm>
```

Everything between the bindings is ordinary Zod — `.min`, `.optional`, nesting, arrays,
`z.lazy` recursion. `z.infer` is exact. Decorations are JSX, never enter the data.
The core emits zero DOM; shells and list chrome are yours.

## Layout

- `src/` — the library. `'use client'` first line; one introspection primitive
  (`resolve`), matchless rendering, `field` / `group` / `list` / `wrap` / `hidden`,
  `useZodForm` + `ZodForm`.
- `examples/profile.tsx` — the worked example (widgets, shells, a full form, a
  recursive tree). Imported by both tests and playground.
- `tests/` — Vitest + Testing Library (jsdom):
  - `resolve.test.ts` — the introspection toolkit.
  - `render.test.tsx` — decorations, paths, defaults, composition, build-time
    enforcement, recursion.
  - `interact.test.tsx` — userEvent: add/remove with schema bounds, typing,
    valid submit (typed `z.output`, hidden defaults filled), invalid submit
    (shell-rendered errors, no submit).
  - `types.check.tsx` — compile-only: the `@ts-expect-error` guard suite
    (no-empty widgets must get `.default()` / `initial`; exact inference).
    Enforced by `typecheck`, not run by Vitest.
- `playground/` — Vite dev harness importing `src` directly (`npm run play`).

## Scripts

| script | what |
|---|---|
| `npm run play` | Vite playground with HMR |
| `npm test` | Vitest (jsdom + RTL) |
| `npm run typecheck` | `tsc --noEmit` — includes the compile-time guard suite |
| `npm run lint` | Biome |
| `npm run build` | tsdown → `dist/index.js` (+ `.d.ts`), `'use client'` preserved |
| `npm run check:package` | publint + arethetypeswrong (esm-only profile) |
| `npm run ci` | typecheck → test → build → package checks |

## Publishing invariants (checked by `ci`)

- `'use client'` is the first line of `dist/index.js` — the whole library is a
  client module by design.
- `sideEffects: false` + named exports only: importing just `resolve` bundles to
  ~0.5 kB with zero React Hook Form code.
- `exports` map with `types` first; ESM-only.
- Peer deps: `react >=18`, `zod ^4.4` (the meta-survival behavior the chaining
  style relies on is pinned by the test suite), `react-hook-form ^7.50`,
  `@hookform/resolvers ^5`.
