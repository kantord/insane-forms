---
sidebar_position: 1
---

# Getting started

The core package supplies schema builders, `Render`, and the `FieldEngine`
contract. It does not currently export a ready-made form wrapper or a
`react-hook-form` subpath. For the existing RHF reference integration, install
the core and integration dependencies:

```bash
pnpm add insane-forms zod react-hook-form @hookform/resolvers
```

The examples assume a React application. Inspect or copy/adapt
`packages/examples/react-hook-form.tsx` from the repository for its engine binding,
`useZodForm`, and `ZodForm`; these are reference code rather than a separately
published adapter. Bind your controls as described in
[binding a design system](./binding-a-design-system.md), then compose the bound
schemas. The explorer shows the full example code.

An easily installable shadcn binding set is an intended adoption improvement,
not an installation path provided by this guide today. See the
[design reference](./design-reference.md) for current typing and initialization
limits before relying on those guarantees.
