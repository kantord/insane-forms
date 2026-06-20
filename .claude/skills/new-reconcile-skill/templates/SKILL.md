---
name: __NAME__
description: __DESC__
---

# __NAME__

TODO: one paragraph — what drift/gap this detects and why it matters.

## Run it

```bash
bash .claude/skills/__NAME__/detect.sh
```

Writes one task per delta item to `$RECONCILE_TASKS` (default `/tmp/__NAME__/tasks/`),
then cats them. Requires `esto` on PATH.

## What to do with the tasks

TODO: how to resolve each task. For more than a couple, fan out one sub-agent per task
(the task file is its prompt).

## How it works

`esto --once` reconciles current (`--from`) against desired (`--to`); change detection is
plain string equality on the value:
- `from.sh` — TODO: emit `key<TAB>value` for the CURRENT state.
- `to.sh`   — TODO: emit `key<TAB>value` for the DESIRED state.
- `worker.sh` — emits a task per `--update`/`--exit` delta.

Re-run after fixing; resolved items drop off (converges to empty).

## Caveats

- Stable keys (a rename = exit+enter, not update).
- Set reconcile, no ordering — sequenced work doesn't fit.
- Keep the worker idempotent (loop-until-dry assumes re-running is safe).
