# Zod semantics relevant to draft and submission design

Research date: 2026-10-25. Primary sources are linked below. Current online
documentation describes Zod 4.6; the project currently installs Zod 4.4.3.
The runtime examples below were also executed against that installed version.
This note documents constraints and choices, not an approved API design.

## Three distinct meanings of a schema's input

1. `.parse(value)` accepts `unknown` at its call boundary.
2. `z.input<S>` describes the static pre-transformation type.
3. The runtime set of inputs that successfully parse can be narrower than that
   TypeScript type.

The distinction between `z.input` and `z.output` is explicit in the [Zod basic
usage documentation](https://zod.dev/basics#inferring-types). Zod's [core check
documentation](https://zod.dev/packages/core#checks) states that checks can
validate or mutate values without changing their inferred type. The [codec
documentation](https://zod.dev/codecs#type-safe-inputs) distinguishes `.parse`'s
unknown parameter from the typed inputs of encode/decode.

For example:

```ts
const RequiredName = z.string().min(1)
type NameInput = z.input<typeof RequiredName> // string
type NameOutput = z.output<typeof RequiredName> // string

const blank: NameInput = '' // TypeScript permits this
RequiredName.safeParse(blank).success // false
```

Consequently, merely typing a draft as `z.input<Submission>` does not mean the
submission schema accepts that draft at runtime. This is an important design
boundary if the requirement is an explicit schema that *successfully validates*
every possible WIP state. A defaulted or transformed output type is also not
automatically the type of values currently held by a form engine.

## Parsing, transformation, and initialization

Zod parsing returns parsed data; asynchronous refinements/transforms require the
async parse methods. A form integration must use the returned value when its
submission contract promises parsed output. Calling validation and subsequently
submitting the original draft loses transformations. [Zod basic usage](https://zod.dev/basics#parsing-data)

In Zod 4, `.default(v)` substitutes an output value for `undefined` and can bypass
inner validation. `.prefault(v)` instead inserts input and continues parsing.
This changed from Zod 3, whose defaults were parsed. Defaults within optional
object properties can also change key presence. These are documented migration
changes, not evidence that either behavior is universally unsuitable.
[Zod 4 migration guide](https://zod.dev/v4/changelog#default-updates)

Local 4.4.3 checks:

```ts
z.string().transform(s => s.length).default(0).parse(undefined) // 0
z.string().transform(s => s.length).prefault('abc').parse(undefined) // 3
z.string().min(1).default('').safeParse(undefined).success // true
z.string().min(1).prefault('').safeParse(undefined).success // false
```

The installed implementation makes this behavior explicit in
`node_modules/zod/src/v4/core/schemas.ts`, `$ZodDefault` and `$ZodPrefault`.
It follows that inspecting a `defaultValue` property is not equivalent to
parsing, and blindly treating both wrappers as the same initialization primitive
can confuse input and output values. Zod itself does not set a React input or
form-engine store; using schema defaults as UI initial values is integration
policy.

## Absence, empty controls, and coercion

`optional` admits `undefined`; `nullable` admits `null`; `nullish` admits both.
Neither means an empty string is absent. Coercion uses JavaScript conversion
functions, with an `unknown` input type by default; preprocess input is also
unknown unless narrowed. Object schemas strip unknown keys by default; strict
objects reject them. Refinements may be skipped after non-continuable type
errors, so an unrelated missing field can prevent a cross-field error from
appearing. [Zod API](https://zod.dev/api)

Verified locally against 4.4.3:

| Schema | `undefined` | `null` | `''` |
| --- | --- | --- | --- |
| `z.string().optional()` | accepts | rejects | accepts |
| `z.string().nullable()` | rejects | accepts | accepts |
| `z.string().nullish()` | accepts | accepts | accepts |

```ts
z.coerce.number().parse('') // 0
z.coerce.boolean().parse('false') // true
```

These are conversion semantics, not exceptional parser bugs. Whether they are
appropriate for blank numeric controls or URL booleans must be decided by the
integration. If the draft includes arbitrary strings such as `'-'` while typing
a number, a numeric submission output alone cannot describe that draft.

## Historical caveat and current support for automatic relaxation

The early v4 migration removed the old schema method `.deepPartial()`, citing
footguns. [Zod 4 migration guide](https://zod.dev/v4/changelog#drops-deeppartial)
Current documentation now exposes a standalone `z.deepPartial(schema)` with
explicit limitations: refined objects throw, and discriminated unions become
ordinary unions when their discriminator is made optional.
[Current Zod API](https://zod.dev/api#zdeeppartial)
Neither form exists in this project's installed Zod 4.4.3. The historical
removal therefore must not be presented as a blanket current prohibition of
automatic derivation. The narrower lesson is to state supported structures and
what happens to refinements and discriminators. Making object keys optional
alone does not model text blanks or numeric intermediate strings; that last
point is a design inference, not a statement made by Zod.

## What this does and does not force in this project

- It forces the design to distinguish editing representation, successful
  validation, and parsed submission data. It does not force every distinction
  into a separate independently authored schema object.
- The user's requirement for a schema covering all WIP states is stronger than
  merely allowing an invalid submission draft to exist in memory.
- Separate draft/submission schemas can be composed or derived. One pipeline
  can encode input-to-output conversion, but its failed inputs are not thereby
  accepted by a standalone draft validator. There is no automatic equivalence
  between these models.
- Codecs provide bidirectional conversion when edit-existing-record flows need
  output-to-input mapping. Ordinary transforms are unidirectional and cannot
  automatically be reversed. Codecs alone do not decide how empty or intermediate
  editor states should be represented. [Zod codecs](https://zod.dev/codecs#transforms)
- Initialization precedence, treatment of missing values, timing of conversion,
  field error timing, and whether submission constraints restrict editing remain
  project decisions. Zod supplies parsing semantics rather than those policies.

Before selecting an API, establish whether “the draft schema models every WIP
state” means a static value type, a runtime validator accepting every WIP state,
or both. An example with a blank string, an unset enum, an incomplete numeric
string, and a partially filled cross-field group will distinguish the choices.
