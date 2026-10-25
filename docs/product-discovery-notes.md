# Product discovery: value, adoption, and explanation

Notes from the skeptical-discovery conversation, 2026-10-25. These capture user
intent, inspected evidence, and working hypotheses separately. They are not an
approved implementation plan or a finished README pitch.

Related documents:

- [Form complexity framing](form-complexity-framing.md): structural challenges,
  familiar tasks, and combinations that make useful stress tests.
- [Form segments backlog](form-segments-backlog.md): recurring coordination
  problems that currently lack reusable support.
- [Design discussion map](design-discussion-map.md): engineering decisions and
  investigations from the related design discussion.

## Motivation and intended value

The user's original frustrations are:

1. Declaring a data schema and then separately authoring a UI tree that repeats
   much of its structure. The relationship is harder to keep in mind and the two
   descriptions can drift.
2. Reasoning about nested, optional, recursive, and otherwise complex form state
   and composition through low-level form-library APIs.
3. Repeated binding boilerplate and pitfalls despite useful low-level behavior
   supplied by existing engines.

The intended value is present even in small forms: clear boundaries guide code
organization immediately, while the same composition model should scale with
complexity. Reuse across many ordinary forms may matter as much as one difficult
form. “Useful for every scenario” is an aspiration, not demonstrated coverage.

The user wants the simplest apparent implementation path to encourage sound
structure. Examples of mistakes to discourage include placing submission rules
inside widgets, bypassing composition with hacks, introducing unnecessary type
boundaries, and turning a naturally composed address subform into an opaque
monolithic widget. This is not a prohibition on composite-value widgets where
those are appropriate.

## Meaningful composite values and composition-supplied binding

A group does not need multiple consumers to justify existing. An API's nested
`Name` object, containing first and last names, can itself supply a meaningful
boundary that improves form readability and responsibility allocation.

The strongest current conceptual explanation is:

> Compose reusable schema-bound fields and groups; their placement supplies
> their form-state paths.

Inspected core code supports this narrow mechanism: `group()` computes child
paths, and `list()` computes row paths while using engine-provided stable keys.
A reusable bound schema does not need to be authored against a particular root
path. This is distinct from claiming that every segment lifecycle responsibility
already follows from grouping; the segments backlog records missing support.

Specialization is also central: establish a text/string field binding, then
derive a more specific field such as a first-name field through ordinary Zod
chaining. The conversation used “subclass” informally; this is schema derivation,
not evidence of a class-inheritance API.

## Layers and responsibilities

The user's intended explanation separates widget representation and local UI
state, schema validation/conversion and submitted values, engine-managed form
state, and surrounding labels/error presentation. In current terminology the
field chrome is a **shell**; collection chrome uses a collection wrapper.

Do not turn that explanation into a claim of complete enforcement. In inspected
code, schema defaults also seed editable fields, adapters carry integration
policy, and type/initialization guarantees have known gaps documented elsewhere.

The user has not settled how much good UX the library should prescribe. The
established principle is that insane-forms should not itself obstruct a desired
UI/UX design or make it unnecessarily awkward. This is an extensibility goal,
not proof that composability automatically produces good UX.

## Relationship to RHF and lenses

Insane-forms is intended to supplement a state engine such as RHF, rather than
replace it. Core rendering/composition and engine state management are distinct,
although bindings and array operations are areas of interaction.

Avoid these inaccurate or unestablished comparisons:

- RHF cannot model trees or meaningful composite values.
- RHF necessarily stores form values as a shallow map or merely serializes a
  collection of scalar fields on submission.
- Reusable nested form components are unique to insane-forms.
- Lenses are necessarily worse or awkward in every use case.

RHF documents genuinely nested values and an independently installed lenses
package for typed scopes, reusable components, and array composition. Its API
therefore addresses part of the same problem. The proposed distinction is the
authoring model: explicit scope focusing/passing versus deriving bindings from
schema placement, with the latter also connecting schema composition to rendering.

Primary references inspected during discovery:

- [RHF getValues](https://react-hook-form.com/docs/useform/getvalues): nested
  objects can be read directly; paths address a nested value structure.
- [RHF lenses](https://react-hook-form.com/docs/uselens): `focus`, `interop`,
  reusable typed scopes, and array operations.
- [RHF form context](https://react-hook-form.com/docs/useformcontext): sharing
  form methods with nested components and options for reusable inputs.

### Proposed comparison case study

The user agreed that comparison with lenses is useful for explaining one aspect
of the library. Implement equivalent examples of a reusable `Address` under:

- `billing`;
- `shipping`;
- each traveller in a repeated collection.

Show the full setup and equivalent behavior in both approaches. Compare binding
code, path/scope passing, type guarantees, changes required when moving or reusing
a group, and freedom to customize presentation. Separate initial binding cost
from repeated usage cost. Do not compare against deliberately weak RHF code.

Hypothesis to test: insane-forms reduces duplicated structural wiring for these
cases. Neither an implementation comparison nor a usability test has been done;
superiority is not established. Lenses may offer useful independent control of
UI and data composition that needs a fair treatment.

## Adoption cost and distribution

The user accepts explicit establishment of reusable widgets, shells, and engine
bindings, either by application developers or shared design-system maintainers.
The argument is that similar wiring already exists in applications, but is often
scattered; insane-forms makes it central and reusable.

There is still an upfront step: identify and bind reusable pieces before composing
the form. That may require solving a more general problem than an individual
screen needs. Adoption is unlikely to be worthwhile where schema validation and
a form abstraction are themselves unnecessary.

The user expects much atomic-field integration work to be mechanical and reusable
across applications and design systems. Common edge cases are a reason to supply
bindings, not to require each team to rediscover them. Some representation and
interaction policies can still vary. “Effectively free,” including with AI,
remains a hypothesis rather than a measured adoption cost.

Direction expressed by the user: an easily installable set of shadcn bindings
should be available, with enough support for many teams and AI application
scaffolding. A registry was suggested; distribution format, maintenance ownership,
and possible upstream inclusion in shadcn are not settled. Upstream inclusion is
a future possibility, not a dependency or commitment.

Making correct code easy for coding agents to produce is an explicit product
goal. Examples and API/type design should discourage duplicated structure,
silently weakened types, and custom bookkeeping, even when those produce a working
screen. The wizard's repeated validation paths illustrate an example-quality and
potential API/discoverability gap, not proof of an unavoidable implementation.

## Existing application evidence

The local `design-token-modeler` repository already contains an insane-forms
palette editor, a copied RHF adapter, and live theme previews driven by watched
values. This is application usage beyond the library's demos.

The user reports no noticeable friction, while noting that the application was
largely built with AI. That is a positive experience report, not proof of
maintainability, full type safety, or difficult-form coverage. The user does not
expect this editor to become dramatically more complex; avoid inventing features
solely to make it a stress test.

The adapter source documents weakening defaults to `object` because bundled group
declarations lost inference, and the application casts watched palette values.
Those are inspected workarounds; the suspected declaration defect has not been
reproduced here against today's library. Do not present it as a newly confirmed
current defect.

## README and website: working explanation hypotheses

The initial reading made the mechanism more apparent than the benefit. The
homepage foregrounds internals such as “matchless rendering,” while recursive
composition and the connection between placement and binding offer more concrete
explanations of value. This is a review hypothesis, not audience research.

The README has stale layout/integration descriptions, and introductory docs are
placeholders. Existing examples are stronger evidence than those prose pages.
The live website was inaccessible through the browsing tool during the initial
review; site observations came from repository source, not a live visual review.

Candidate demonstrations, not selected designs:

- A familiar small form followed by a second form sharing specialized fields,
  then one change affecting both. Keep initial binding work visible.
- A runnable example where changing a schema changes UI and validation.
- The fair lenses comparison described above.

The user does not prioritize explaining the architecture to nonusers. The desired
first encounter should make someone interested enough to try the library;
understanding can deepen through use. No decision establishes whether an embedded
playground, local installation, or agent-mediated workflow best achieves this.
Do not assume a playground is how the intended audience evaluates libraries, or
that AI-assisted building automatically establishes an agent-led discovery path.

## Feedback and success

The user could ask frontend-developer colleagues or their girlfriend for feedback,
but prefers the public release to be the initial audience test. Suggested channels
include Lobsters, Hacker News, and Reddit. This records a preference, not
authorization to publish or contact anyone.

Desired early signals include concrete feedback, people considering use, adoption
soon after release, feature requests, contributions, stars, and positive social
responses. Attention and sustained use are different signals; neither alone
establishes improved form-building practice.

The larger ambition is to improve how forms are organized across the industry,
making classes of implementation and UX bugs less common. A successor inspired by
these concepts could count as success even if this implementation does not prevail.
The user also identifies broad recognition, becoming an industry standard, or an
independent talk explaining the concepts accurately as meaningful success signals.

Readiness is primarily about the quality of the developer experience, not the
size or sophistication of a completed form. An enterprise-dependency readiness
checklist was not established as the release criterion. Concrete experience
criteria and evidence for the broader industry ambition remain open.

## Later clarifications: reuse and the Zod foundation

The user expects context-specific rules to be derived using ordinary Zod
operations: a reusable address can be required at checkout and optional in a
profile. This establishes intended authoring behavior, not verified compatibility
with every schema operation.

The clearest acknowledged cases where adoption may not pay off are a single
isolated trivial form in an application unlikely to become form-heavy, or an
experimental interaction that does not benefit from the usual form model. Do not
require an exhaustive definition of “exotic” interactions or treat every custom
control as outside scope. Judge concrete cases by clarity and work avoided.

Zod is foundational because it supplies a small, versatile schema language and
much of the difficult validation/type machinery. Insane-forms extends that work
into form composition rather than introducing another schema language. Intended
reuse has three aspects:

- Existing schema code, including API contracts where practical.
- Zod's engineering and conceptual work, rather than rebuilding it.
- Developers' and coding agents' familiarity with Zod or related schema/type
  concepts, reducing the learning required for form composition.

The user expects strong familiarity, especially among agents. Treat reduced
learning effort as a hypothesis; universal agent familiarity is not established.
The first-use documentation recommendation of starting with installable bindings
is likewise an agent recommendation to evaluate, not a preference the user was
asked to approve.

## Deferred exploration: shared schemas and a broader resource layer

**Explicitly future exploration, not current scope or a release prerequisite.**
The need has not yet surfaced in actual usage. The user does not want discovery
to dwell on this area now.

A bound insane-forms schema remains a Zod schema; rendering is not required in
order to use its validation behavior. A name such as `UserNameField` could be
meaningful in both an API contract and form code. However, that does not establish
that the current package and all bound widgets are suitable for direct backend
imports: runtime dependencies, module evaluation, client directives, and framework
boundaries need investigation before making that promise.

Potential later work:

- Investigate sharing the same bound schema across frontend and backend without
  eagerly importing its UI dependencies. Lazy widget imports are a candidate,
  not a selected or proven solution. Loading, evaluation, rendering, and framework
  compatibility would need to be assessed separately.
- Explore a higher-level data/resource schema whose metadata includes a form
  mapping as one facet. This would sit above insane-forms rather than silently
  redefining the current library's purpose.
- Consider whether that resource layer could also describe persistence/ORM
  concerns, analogous in ambition to a Django-style integrated system.

These are possible future milestones or end-to-end directions, not an approved
architecture, an ORM implementation request, or evidence that a broader framework
is necessary for today's form composition benefits.

## Important unresolved hypotheses

- Does composing bindings reduce maintenance and cognitive effort enough to
  justify the initial setup compared with well-written RHF/lenses code?
- Which first encounter makes the value apparent enough to prompt a real trial?
- Can maintained bindings make setup predictable for both people and agents?
- Does schema specialization stay clear when the same domain value has different
  editing and validation needs in different contexts?
- Can nested, conditional, and segment behavior compose without consumers
  reconstructing structure or inventing fragile lifecycle code?
- Which observable changes in development practice demonstrate better experience,
  beyond recognition, adoption counts, or a functioning generated screen?
