# Form design boundaries before choosing an API

Status: research and decision map, not an approved design. Companion notes:
`research-zod-drafts.md` and `research-form-practices.md`.

Reconciled with the later discussion: the
[site design reference](../apps/docs/docs/guides/design-reference.md) records the
current UI-owned editing representation and explicit-binding direction. Distinct
editing/submission contracts do not require two runtime schema arguments. The
[current review plan](review-plan.md) owns the investigation sequence.

## What the conversation establishes

The discussion initially proposed a form/draft schema for WIP values separate
from a submission schema. The later direction keeps the contracts distinct while
allowing the UI field's declared value type and private state to describe editing.
Do not equate a strict submission schema with all possible draft states or infer
that a second runtime schema is required.

The user has accepted the engine-independent core as the intended architecture.
The project uses Zod schemas as its rendering structure. Publishing a separate
RHF adapter was suggested, but the package name, exports, migration, and release
are not finalized. The three-day dependency release-age policy was explicitly
requested and is already applied.

The repository's current code is evidence of implementation, not proof of user
preference: automatic `DraftOf` widening, mandatory field defaults, container
initialization behavior, and one-schema wrappers remain revisable.

## Constraints imposed by correctness and platform semantics

1. Widgets must be able to consume values supplied by the engine, and values
   emitted by widgets must be representable in the agreed draft contract. This
   is a bidirectional contract, not just a check of the `value` prop.
2. A successful submission must pass the agreed submission validation/conversion;
   a TypeScript assertion cannot turn an unparsed draft into a validated result.
3. React controlled text controls need a stable non-nullish value and controlled
   checkboxes need a boolean. This applies at the DOM boundary, not necessarily
   to stored application values: a widget can translate an absent value to an
   empty display. Updates also need to preserve normal editing/caret behavior.
   [React input documentation](https://react.dev/reference/react-dom/components/input).
4. RHF's controlled-field API documents restrictions on undefined defaults and
   change values. If the public draft contract permits absence, its adapter must
   deliberately translate or accommodate that restriction, or declare a support
   limit; it cannot assume every engine behaves identically.
   [RHF Controller](https://react-hook-form.com/docs/usecontroller/controller).
5. Zod input/output types do not encode every refinement. For example both sides
   of `z.string().min(1)` are strings, while the parser rejects the empty string.
   Parsing may transform values, apply defaults, or be asynchronous. A schema's
   TypeScript input type is not a schema accepting every unfinished value.
   [Zod API](https://zod.dev/api), [Zod basics](https://zod.dev/basics).

## Three distinct value boundaries

| Boundary | Example | Decision still open |
| --- | --- | --- |
| Display/edit buffer | Text such as `''`, `'-'`, or `'1.'` | UI fields may own private temporary state; define the value they communicate to the engine. |
| Stored draft values | String, number-or-absence, selected option, nested rows | Exact representation, initialization, and whether transformations run before storage |
| Successful submission | Validated number, normalized email, domain object | Where conversion executes and how submission errors map back to draft paths |

If independently validating drafts is required, a draft validator must describe
the values it is asked to validate. That is conditional on that capability being
needed, not a standing requirement for a separate schema covering private UI state.
Touched flags, dirty tracking, errors, and submission status are separate form
metadata; a data schema does not automatically have to encode those.

## Choices that remain within the design

| Choice | Real alternatives | Consequence |
| --- | --- | --- |
| Expressing the two contracts | UI value types plus submission schemas; optional separately validated drafts when needed | Preserve editing freedom without imposing a redundant runtime schema |
| Empty values | `''`, null, undefined, explicit tagged states, different choices by field | Widgets, defaults, optionality, serialization and adapters must agree |
| Stored editable values | Explicit widget value contract connected to schema input; any optional draft validator needs stated semantics | Determines what types and initial values are safe to store |
| Numeric/date editing | Raw text drafts; typed values plus local display buffers | Ease of preserving intermediate text versus simpler typed form state |
| Initialization | Caller form defaults, schema-driven seeds, per-field initial values, or a documented combination | Need explicit precedence and reset behavior; there is no unique meaningful blank for every schema |
| Conversion | Widget boundary, blur, explicit conversion stage, or submission parser | Early normalization can lose editing information; late parsing needs accurate input/output typing |
| Validation feedback | Change, blur, submit, or combinations | Invalid-for-submission states can be allowed drafts while still showing errors |
| Container behavior | Explicit empty/seeded containers and array support policy | Recursive schemas and lists cannot be initialized by blindly parsing absent values |
| Integration support | Common semantics plus adapter translation; documented engine-specific capabilities | Engine independence does not mean engines have identical APIs |

These decisions are related but should not be bundled into one yes/no question
about adding `undefined` to `z.string()`.

## Relevant observed failure classes

- Read/write type mismatch: a widget consumes one type or emits values outside
  its declared editable contract. Current field overloads permit incompatible
  bindings; that is separate from deliberate input/output differences.
- Missing initialization versus fallback masking: UI looks empty while engine
  values remain absent; parsed output defaults are mistaken for draft defaults.
- Lossy normalization: converting empty or partial text to a number too early,
  including treating a blank as zero; normalizing on each keystroke can disturb
  cursor position. These are separate from deciding validation timing.
- Incorrect validated-result typing: reporting submission output types while
  actually delivering raw draft values, or discarding a parser's returned value.
- Reset and lifecycle mismatch: initial values versus current values versus
  dirty baselines; unmount/reorder can remove values or local editing state.
- Inconsistent schema interpretation: deriving required/default/bounds behavior
  from internals while assuming generic validation interfaces expose the same
  introspection information.

The companion primary-source notes give documented examples. Do not describe
these as universally “regretted designs”: several are intentional tradeoffs, and
different libraries choose different semantics. Vee-validate v5 is a concrete
migration example: adopting schema-agnostic validation removed schema-derived
defaults and required metadata because the common interface lacked that data.
[Vee-validate migration](https://vee-validate.logaretm.com/v5/guide/migration/).

## Next design exercise

Compare candidate designs against the same small set of interactions before
choosing API names: blank/cleared text, partial numeric input, unselected enum,
explicit null default, an existing loaded record and reset, adding/removing a
nested row, and a submission transform changing the output type. For each, write
the display value, stored draft value, accepted draft state, submission result,
and error path. This will reveal which choices are actually consequential.
