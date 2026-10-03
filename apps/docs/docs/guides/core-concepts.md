---
sidebar_position: 2
---

# Core concepts

_Placeholder page — proves a third guide slots into the sidebar in the right
order. Real content goes here: matchless rendering, draft vs. submit, and the
`FieldEngine` contract._

- **Matchless rendering** — every schema node carries its own renderer via
  `.meta({ component })`; the core never switches on schema type to decide
  what to draw.
- **Draft vs. submit** — the form edits the `z.input` draft (strings, partial
  values, anything the widgets produce); `onSubmit` receives the fully parsed
  `z.output`, with hidden defaults filled in at parse time.
- **The `FieldEngine` contract** — the small interface any form engine
  (`react-hook-form`, TanStack Form, or your own) implements to drive a
  schema tree; see the [form engines](/insane-forms/explore?id=integration-examples-form-engines--docs&mode=docs)
  examples for both reference implementations.
