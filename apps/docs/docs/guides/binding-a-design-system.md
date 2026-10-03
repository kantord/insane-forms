---
sidebar_position: 3
---

# Binding a design system

_Placeholder page — real content goes here: writing your own widgets, wiring
`.meta({ component })` to a component library, and reusing shells across a
whole design system instead of one field at a time._

```tsx
import * as z from 'zod'

const NameField = z.string().min(2).meta({
  component: MyTextInput, // any component that reads/writes a string
})
```

The [shells](/insane-forms/explore?id=integration-examples-shadcn-ui-shells--docs&mode=docs)
and [widgets](/insane-forms/explore?id=integration-examples-shadcn-ui-widgets--docs&mode=docs)
examples show one binding all the way through, from a bare Zod schema to a
themed shadcn/ui component.
