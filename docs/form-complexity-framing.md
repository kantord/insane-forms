# Understanding form complexity through familiar tasks

Captured from product discovery on 2026-10-25.

A form's complexity is not adequately described by its field count, screen size,
or whether it constitutes most of an application. A small editor can have difficult
behavior; a large form can consist mostly of independent fields.

For designing and evaluating insane-forms, describe the structural challenge,
translate it into a familiar task, and identify the observable failure that support
should prevent. The examples below are design scenarios, not user research or
claims that the library already handles them.

## Individual sources of complexity

| Structural challenge | Familiar example | What becomes difficult |
| --- | --- | --- |
| Repetition | Add travellers to a booking. | Add, delete, and reorder entries while keeping values, errors, and editing state attached to the right person. |
| Recursion | Organize employees into teams containing subteams. | Reuse editing behavior at arbitrary depths without manually constructing paths. |
| Conditional structure | A traveller selects “I need transport.” | Reveal pickup details, require them when applicable, and define their retention and submission behavior when transport is disabled. |
| Dependencies across sections | The selected vehicle must accommodate everyone in the booking. | A change elsewhere can invalidate a previously completed section. |
| Hidden editing surfaces | Traveller details open in dialogs or appear on another tab. | Discover and reveal an invalid field that is currently invisible. |
| Reversible local edits | Edit a team's details, then press Cancel. | Discard that edit without losing changes elsewhere, including nested additions and removals. |
| Asynchronous constraints | Check whether a hotel has enough rooms. | Represent pending checks and reject results made stale by later edits. |
| Different editing and submission states | Type a date or monetary amount. | Allow incomplete input while requiring valid data for submission. |
| Partial persistence | Save one section while continuing to edit another. | Distinguish draft, validated, and saved states without overwriting newer edits. |

## Interactions make stronger stress tests

Supporting each structure separately does not establish that they compose cleanly.
Use combinations to expose coordination that might otherwise become consumer code.

| Combination | Real-life scenario | Observable failure to prevent |
| --- | --- | --- |
| Recursion × conditions | Every team, including a nested subteam, can optionally use its own billing address. | A hidden address still blocks submission, or an address from one team appears under another. |
| Recursion × dependencies | A group's transport capacity must cover travellers in all descendant groups. | Adding a deeply nested traveller leaves the ancestor's capacity status incorrectly valid. |
| Conditions × hidden errors | Changing the destination makes passport details required for travellers whose dialogs are closed. | Submission fails without an actionable route to the missing details. |
| Repetition × asynchronous work | Remove a traveller while their eligibility check is pending. | The result attaches to a different traveller after array indexes shift. |
| Local cancellation × dependencies | A group edit temporarily changes the booking's calculated price, then is cancelled. | Cancel leaves provisional changes behind or undoes unrelated edits. |
| Navigation × validation dependencies | Return to an earlier step and change dates after choosing accommodation. | A later step remains marked complete despite no longer being valid. |
| Partial persistence × concurrent edits | Save a billing section, then edit it again before the response arrives. | The response erases newer input or incorrectly marks it saved. |

These scenarios do not dictate policies. For example, retaining an inactive
address and omitting it from submission may be appropriate, while clearing it may
be appropriate elsewhere. Support should make the chosen behavior explicit and
consistent, rather than leave it as an accidental consequence of mounting.

## A coherent stress-test application

A tour booking editor can combine these challenges without inventing an
unrecognizable domain:

- A booking contains individuals and groups; groups contain further groups or
  individuals.
- Each traveller or group can be edited in a dialog, with explicit save/cancel
  semantics for local edits.
- Transport is optional and reveals required pickup details when enabled.
- Capacity and pricing rules depend on people in descendant groups.
- Availability checks depend on dates and participant counts and run asynchronously.
- Submission can report errors in a closed editor within an inactive section.

Do not implement every feature just to make the example large. Start with
recursive groups, one conditional section, and one rule crossing a segment
boundary. Add interactions to answer specific design questions.

## How to use this framing

For each example or investigation, record:

1. **Task:** what the person is trying to accomplish.
2. **Structures:** which individual challenges and interactions are involved.
3. **Trigger:** the action or sequence that exposes the difficulty.
4. **Expected behavior:** what should happen to values, validity, visible errors,
   navigation, and focus, where relevant.
5. **Consumer burden:** what bookkeeping the developer or coding agent must write.
6. **Evidence:** distinguish API expressibility, inspected example code, passing
   interaction tests, and actual application experience.

For instance, “a large booking form” does not identify a useful test. “Changing
the destination makes a traveller in a closed nested dialog invalid” identifies
a task, an interaction, and a concrete error-recovery requirement.

Evaluate generated code as well as the visible result. An agent can produce a
working screen by duplicating structure, weakening types, or writing manual path
walkers. Those workarounds are evidence about API discoverability and missing
support; a working screen alone does not establish that the abstraction is sound.

The [form-segments backlog](form-segments-backlog.md) records related support gaps,
current evidence, and acceptance scenarios. This framing explains how to select
and communicate examples; that backlog tracks the work they motivate.
