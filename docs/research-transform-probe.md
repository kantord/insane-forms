# Transform probe: observed rendering, editing, and submission behavior

Probed on 2026-10-25 using installed Zod 4.4.3, React 19.2.7,
React Hook Form 7.77.0, @hookform/resolvers 5.4.0, TypeScript 6.0.3,
and Vitest 4.1.8. These are observations of the current implementation,
not an approved design or a claim of complete transform support.

## Main result

Binding a text widget **after** constructing a string-to-number transform works
at runtime: it edits strings, reports validation errors, and submits parsed
numbers. Opaque introspection does not prevent a pipe from being explicitly
assigned a renderer. However, inline widget inference uses the output type,
which disagrees with editable input values. Transform construction order and
default placement also matter.

## Working minimal example

```tsx
const NumericText = z
  .string()
  .refine(value => /^\d+$/.test(value), 'Digits required')
  .transform(Number)

const TextWidget = (p: insane.FieldProps<string | undefined>) => (
  <input
    value={p.value ?? ''}
    onChange={event => p.onChange(event.target.value)}
  />
)

const FormSchema = insane.group({
  quantity: insane.field({
    schema: NumericText,
    widget: TextWidget,
    initial: '12',
  }),
})

// Existing userland wrapper from packages/examples/react-hook-form.tsx:
<ZodForm schema={FormSchema} onSubmit={data => console.log(data.quantity)}>
  <button type="submit">Save</button>
</ZodForm>
```

Typing `'42'` submits `{ quantity: 42 }`, while the control continues displaying
the raw string. Invalid text such as `'oops'` produces a field error and blocks
the submit handler. A shell rendering `p.error` was included in the probe to
assert the error path. No conversion was added to the core or binding.

## Observed cases

| Case | Result |
| --- | --- |
| `field({ schema: NumericText, widget: TextWidget, initial: '12' })` | Renders; edits strings; submits parsed numbers. |
| Same field with `'oops'` | Refinement error reaches the field shell; submit handler is not called. |
| `field({ schema: z.string(), widget: TextWidget }).transform(Number)` | Renderer is not resolved; warning is emitted and the control is absent. With caller string defaults, the parser still submits a number. |
| Bound string field followed by `.trim()` | Renderer survives; submitted string is trimmed, while the displayed/raw stored input remains untrimmed. |
| Bound string field followed by `.transform(s => s.trim())` | Renderer is not resolved, despite unchanged input/output primitive types. This is about the pipe structure, not changing types. |
| Bound `NumericText` with caller defaults `{ quantity: '17' }` | String initializes the input; successful submission produces number 17. |
| Bound `NumericText` with binding `initial: 17` | Currently compiles; displays 17 but untouched submission fails because the schema expects a string input. |
| Bound `NumericText.default(7)` | Schema alone parses `undefined` to 7, but core initializes the engine with numeric 7. Untouched submission then fails its inner string input check. |
| Bound `NumericText.prefault('7')` | Initializes string input and successfully submits number 7. |
| Inline inferred widget calling `p.value?.toFixed()` with `NumericText` and `initial: '17'` | Compiles; rendering throws because the actual value is a string. |

The output-default case is a concrete initialization mismatch, distinct from the
intentional behavior of a same-type `.default(42)` filling a cleared numeric
field at submission. Here the seeded value is on the wrong side of a
type-changing parser. Ordinary caller defaults are typed as schema input and do
not have that particular type error.

## Types observed

A virtual TypeScript source file compiled using the repository's tsconfig gave:

```ts
type Input = z.input<typeof NumericText>   // string
type Output = z.output<typeof NumericText> // number

insane.field({
  schema: NumericText,
  initial: '17',
  widget: p => {
    // p is inferred as FieldProps<number | undefined>, although the engine
    // receives strings during normal editing.
    p.value?.toFixed() // compiles; runtime probe throws
    return null
  },
})
```

Explicit `FieldProps<string | undefined>` is accepted and supports the working
runtime example. The annotated overload also accepts unrelated
`FieldProps<Date>`: acceptance is not proof of a checked compatibility contract.
`ZodForm` caller defaults correctly accept `{ quantity: '17' }` and reject
`{ quantity: 17 }`; its submit callback correctly exposes `quantity` as a number.

## Metadata and hints

For an input such as `z.string().length(2).default('12').meta(...)` wrapped in a
transform, explicitly binding the outer pipe installs a working renderer.
However, introspection does not reach the pipe's input:

- The input's title, placeholder, fixed string length, and default are not found.
- `resolveInner` returns the pipe itself.
- Title/placeholder metadata explicitly placed on the outer bound pipe is found.
- A renderer bound to the input before `.transform()` is likewise not reached.

This matches the actual traversal rule: follow `innerType`, not pipe input/output.
It does not imply that parsing or explicitly bound pipe rendering is unsupported.

## Relevant implementation

- `packages/core/src/insane.tsx:69`–`:74`: resolver visits the current schema and
  only follows `innerType`; `:82`–`:86` resolves metadata/component through it.
- `packages/core/src/insane.tsx:279`–`:285`: unresolved renderer warns and emits
  no control.
- `packages/core/src/insane.tsx:320`–`:331`: first overload contextually types
  widgets using `DraftOf<S>`; annotated overload decouples schema/widget types.
- `packages/core/src/types.ts:178`–`:189`: `DraftOf` derives from widened
  `z.output<S>`, not the parser input.
- `packages/core/src/insane.tsx:353`–`:360`: default/initial seeds go directly to
  the engine, and engine values go directly to the widget.
- `packages/examples/react-hook-form.tsx:32`–`:35`: adapter forwards RHF's current
  value and onChange without conversion.
- `packages/examples/react-hook-form.tsx:69`–`:70`, `:99`–`:101`: schema resolver
  and input defaults are wired into the existing wrapper.
- `node_modules/@hookform/resolvers/standard-schema/src/standard-schema.ts:111`:
  normal resolver mode returns the parser's result value rather than raw input.

## Reproduction and limits

Commands run:

```sh
node_modules/.bin/vitest run packages/core/tests/transform-probe-temp.test.tsx
node_modules/.bin/tsc --noEmit
```

All nine focused runtime assertions passed, including assertions of the observed
failures; the full repository TypeScript check passed with those probes present.
The temporary test file was removed after recording results. A virtual TypeScript
program separately inspected contextual widget types and verified the caller
default rejection; its only diagnostic was the deliberately supplied numeric
default where a string was required. No implementation files were changed.

This used jsdom and the RHF reference wrapper. Async transforms, reverse mapping
of already-parsed records, TanStack integration, browser-specific text editing,
and all possible pipe combinations were not tested.

The next design question can now be concrete: should field bindings support a
schema whose editable input and submitted output differ? If yes, typing,
initialization and renderer/hint lookup need a consistent input/output rule.
Runtime parsing already demonstrates the basic capability; it does not need to
be described as wholly unsupported or newly invented.
