---
name: widget-example-coverage
description: Reconcile showcased widgets against realistic examples — every base/derived widget should be exercised in at least one realistic example (Forms/Collections/Table/Multistep/demo app), kept current as its binding evolves. Use to find widgets missing a real-world demo, or stale/orphaned examples.
---

# Widget ⇄ example coverage

Every widget showcased in isolation (the Widgets / Derived widgets groups) should also be
exercised in at least one **realistic** example, and that example should stay current as the
widget's binding evolves. This reconcile tracks that — the first **full enter/update/exit**
esto lifecycle in this repo, and the first driven by a **persisted state file**.

## Run it

```bash
bash .claude/skills/widget-example-coverage/detect.sh
```

`esto --once` diffs **desired** (every showcased widget → a hash of its binding definition) against
**current** (the persisted `state.tsv` of widgets with a verified realistic example):

| event | trigger | task it emits |
|---|---|---|
| **enter** | showcased widget with no realistic example | add a realistic example exercising it |
| **update** | binding hash ≠ the hash recorded when its example was verified | review the example for staleness |
| **exit** | `state.tsv` records a widget that's no longer showcased (removed/renamed) | remove/migrate the orphaned example |

All three are **prompt-emitters** — they write `tasks/<widget>.md` for an agent/human to act on
(esto stays the deterministic planner). For more than a couple, fan out one sub-agent per task.

## Closing the loop (the one non-prompt step)

After resolving a task, stamp the state so it converges (or it re-fires next run):

```bash
.claude/skills/widget-example-coverage/stamp.sh <Widget>            # enter/update done → record current hash
.claude/skills/widget-example-coverage/stamp.sh --remove <Widget>   # exit done → drop the record
```

That state write is what makes `update`/`exit` possible at all — a **persisted** `--from` can hold
a key that's vanished from `--to` (→ `exit`) or whose value drifted (→ `update`); a live-grep `--from`
could only ever do `enter`.

## Files

- `widgets.mjs` — enumerator (TS compiler): widget set = `*Field` bindings used in the showcase
  groups; value = SHA of each binding's definition sliced from `fields.tsx`. `--desired` (all) / `--seed`
  (those already in a realistic example).
- `to.sh` = `widgets.mjs --desired`; `from.sh` = `cat state.tsv`; `worker.sh` = 3-event prompt-emitter;
  `stamp.sh` = state bookkeeping; `state.tsv` = the persisted record (seeded via `widgets.mjs --seed`).

## History

The first run flagged 8 widgets with no realistic example (`DateField`, `NativeSelectField`, `OtpField`,
`RadioField`, `SliderField`, `SwitchField`, `ToggleField`, `ToggleGroupField`). All closed by one coherent
`Examples/Settings` story (`stories/settings.stories.tsx`) — the config widgets live naturally on a settings
page; date = "snooze until", OTP = two-factor setup. State re-seeded; reconcile now converges
(`0 enter, 0 update, 0 exit, 13 unchanged`). This validated the close-the-loop flow end to end.

## Honest scope note

Detection of `enter` alone is a constant-target coverage check (a plain script would do). What earns esto
here is the **persisted-state** design: it adds genuine `update` (example went stale) and `exit` (orphan
cleanup) that a plain "does every widget have an example?" check cannot see.
