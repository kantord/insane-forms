# Docs site kit

A click-through recreation of the three surfaces insane-forms ships: the landing page, a docs article, and a live example page. All three are the same three-column shell — nav rail, content column, aside rail — which is the point of the system.

**What you can do in it**
- Move between surfaces via the sidebar (Getting started / Contacts) and the prev–next links.
- Toggle light and dark from the top bar. Dark is a different palette, not an inversion: thinner rules, warmer ground, amber accent.
- Type in the landing hero's output panel, and on the example page add/remove contacts up to the schema's `.max(3)` bound.

**Files**
- `Shell.jsx` — rails, top bar, footer, form primitives and the duotone `Code` renderer shared by every screen.
- `Landing.jsx` — hero, schema diptych, principles, statement band.
- `DocsArticle.jsx` — "Rendering a schema", with shadcn/ui-based snippets.
- `ExamplePage.jsx` — "Contacts — dynamic list", with working add/remove and a fake `onSubmit` readout.

The kit deliberately mirrors the component library in `components/`; it does not re-invent primitives. Where it inlines a primitive (e.g. `Field`) it is so the kit runs in the browser without a build step.
