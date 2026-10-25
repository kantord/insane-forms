---
sidebar_position: 3
---

# Binding a design system

Bind a UI control to a schema once, then specialize the bound schema using Zod.
The control can use ordinary props; its binding translates engine values and
schema information into those props. A shell handles surrounding labels/errors.

```tsx
import * as z from 'zod'
import { field } from 'insane-forms'

// MyTextInput is an ordinary controlled UI component defined by your app.
const TextField = field({
  schema: z.string(),
  widget: (p) => (
    <MyTextInput value={p.value ?? ''} onChange={p.onChange} onBlur={p.onBlur} />
  ),
  shell: FieldShell,
})

const FirstNameField = TextField.min(2).meta({ title: 'First name' })
```

`MyTextInput` and `FieldShell` above are application-defined components. Do not
attach an arbitrary input directly as `.meta({ component })`: that lower-level
renderer receives `NodeProps`, not ordinary controlled-input props. `field()`
provides the binding between those contracts.

Derivation is schema composition, not class inheritance. A field used at different
places receives its path from placement. The existing implementation has known
typing and derivation limits; consult the [design reference](./design-reference.md).
An easily installable shadcn binding set is intended future distribution work;
the current examples are reference code to inspect and adapt.

The [shells](/insane-forms/explore?id=integration-examples-shadcn-ui-shells--docs&mode=docs)
and [widgets](/insane-forms/explore?id=integration-examples-shadcn-ui-widgets--docs&mode=docs)
examples show one binding all the way through, from a bare Zod schema to a
themed shadcn/ui component.
