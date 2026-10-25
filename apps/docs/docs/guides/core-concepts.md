---
sidebar_position: 2
---

# Core concepts

Insane-forms adds schema-bound rendering and composition to an existing form-state
engine. It does not replace that engine.

The [field values and submission design reference](./design-reference.md)
records the terminology, reasoning, current behavior, and open decisions around
editable values, UI fields, bindings, and initialization.

- **Matchless rendering** — every schema node carries its own renderer via
  `.meta({ component })`; the core never switches on schema type to decide
  what to draw.
- **Composition supplies paths** — a reusable bound field or group does not
  declare its root path. Its placement in a group or list determines that path.
  Deriving specialized fields uses Zod operations; rendering continuity under
  every operation is not yet guaranteed.
- **Editing vs. submission** — widgets declare their editable representation and
  may keep private UI state. The RHF reference wrapper validates and parses the
  submitted values, delivering `z.output`. `z.input` does not itself describe every
  unfinished editing state or mean that the submission schema accepts it. Current
  typing and initialization gaps are described in the design reference.
- **The `FieldEngine` contract** — the small interface any form engine
  (`react-hook-form`, TanStack Form, or your own) implements to drive a
  schema tree; see the [form engines](/insane-forms/explore?id=integration-examples-form-engines--docs&mode=docs)
  examples for both reference implementations.

Shells provide field labels and errors; collection wrappers provide list chrome.
These presentation pieces remain replaceable. Good interaction is not automatic:
the existing multi-step example still coordinates its own validation targets and
navigation, and reusable segment support remains design work.
