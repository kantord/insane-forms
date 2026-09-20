---
name: landing-page
description: Rules for the apps/docs site — the static landing page (src/pages/index.tsx), the persistent sidebar (src/theme/Root.tsx, src/components/Sidebar.tsx) with its two sections (/docs real written docs, /explore every Storybook page), the from-scratch content-docs theme (src/components/docs/), the Tailwind/webpack gotchas specific to Docusaurus, and the perf-testing setup. Use whenever editing apps/docs/src or apps/docs/plugins, or adding landing/docs/explore sections.
---

# apps/docs (landing page + docs + explore)

**Supersedes the old `scrollytelling-landing` skill** (2026-09-20, explicit
user request): the landing page was rewritten from a standalone Vite
scrollytelling app (`apps/landing`, now deleted) into a plain static page in
the Docusaurus site (`apps/docs`), which now also hosts real written docs
(`/docs`) and a Storybook browser (`/explore`) behind a persistent sidebar.
The landing page's direction changed from "hybrid scrollytelling —
sticky-stepper morph, fullscreen scroll-snap biome deck, Magic Move code
animation, motion toggle, six-font chapter-prioritized loading" to "simple,
bold, static — same content, top-to-bottom flow, no scroll-driven JS." If you
find yourself wanting to reintroduce scroll-snap decks, IntersectionObserver-driven
steppers, or code-morph animation here: that's the OLD decision this one
overrode — don't silently resurrect it, ask first (see "Changing these
decisions" below).

## What the page actually is

One file, plain React, no client-side router tricks: `apps/docs/src/pages/index.tsx`.
Sections run top to bottom in normal document flow — hero, principles grid,
schema-morph (a step SELECTOR, not scroll-linked), a short "part two" intro,
then one contiguous block per biome (bureau/terminal/meadow): an intro
paragraph followed immediately by its live `Showcase` (code pane + operable
demo form), then the footer. No `ScrollyBlock`/`Slide`/`Biome` slide-deck
components exist anymore — `apps/docs/src/components/` only holds `Showcase`,
`CodePane`, `Receipt`, `BiomeDemos` (the three demo state wrappers), and
`SchemaMorph` (the step selector). Keep it that way: a new section is a new
`<section>` in plain flow, not a new slide-deck primitive.

- **SchemaMorph** (`src/components/SchemaMorph.tsx`): four buttons (`step 1..4`),
  each swapping a pre-highlighted code snippet and re-rendering the matching
  schema's live form. No IntersectionObserver, no sticky positioning, no
  animation library — clicking is the only interaction.
- **Showcase** (`src/components/Showcase.tsx`): a biome's code pane + operable
  form, side by side on a CSS grid (stacks on mobile), plus a link into the
  matching Storybook story. This is the ONE piece of layout structure worth
  keeping factored out; don't add more slide-layout abstraction than this.
- No motion toggle, no `prefers-reduced-motion` handling: there is currently no
  JS-driven animation on this page to gate. If you add motion, add the toggle
  back then — don't add it preemptively.

## No theme-classic, ever — it's not prunable, so it's not used at all

`apps/docs/docusaurus.config.ts` registers `@docusaurus/plugin-content-pages`,
`@docusaurus/plugin-sitemap`, and `@docusaurus/plugin-content-docs` directly
— no `preset-classic`, no `@docusaurus/theme-classic`, not even for the real
written docs (`/docs`). This was tried three times before landing here, each
one measured against the Lighthouse LCP budget (quality-gates skill) on the
landing page, since Docusaurus ships ONE global stylesheet for the whole
site — CSS added anywhere is paid for everywhere:

1. `preset-classic` with `docs` enabled: landing-page LCP 2.3s → 2.8s
   (budget: 2.5s). Cause: `theme-classic`'s plugin definition calls
   `getClientModules()` and unconditionally requires
   `infima/dist/css/default/default.css` (~150 KB) as a global client
   module — this runs at the PLUGIN level, not per-component, so it loads
   the instant theme-classic is an active theme, full stop.
2. Swizzling `Layout` to drop `Navbar`/`Footer`/`AnnouncementBar` (still
   useful — we don't want Docusaurus's own navbar anywhere, the persistent
   sidebar replaces it) clawed back only ~2 KB / ~60ms. Confirms (1): Infima's
   own base framework (grid, typography, buttons, admonitions, doc-sidebar
   styles) is ONE monolithic stylesheet, not tree-shaken per component — you
   cannot have theme-classic active "a little bit."
3. **What actually worked**: drop theme-classic entirely and supply
   content-docs' required components ourselves — `docsRootComponent`,
   `docVersionRootComponent`, `docRootComponent`, `docItemComponent`,
   `docCategoryGeneratedIndexComponent` in the plugin options
   (`docusaurus.config.ts`), pointed at `src/components/docs/*.tsx`
   (absolute paths via `path.resolve(__dirname, ...)` — the generated
   `.docusaurus/` registry can't resolve paths relative to the config file).
   Result: landing LCP back to 2.3s with full doc pages. These components
   import ONLY `@docusaurus/plugin-content-docs/client` (`useDoc`,
   `useDocRootMetadata`, `DocProvider`, `DocsSidebarProvider`,
   `DocsVersionProvider` — theme-agnostic hooks, safe standalone) and
   `@docusaurus/renderRoutes` — never anything from `@docusaurus/theme-classic`
   or `@theme/*` aliases theme-classic would have provided. `useDoc`/etc.
   need `@docusaurus/theme-common` and `@docusaurus/plugin-content-docs`
   declared as ROOT devDependencies (not just transitive through a preset) —
   `tsc` resolves their types either way, but webpack's runtime resolution
   won't without the explicit dependency.

**If you're tempted to add `preset-classic` back "just for this one thing"**:
don't, without re-measuring. That's exactly attempt (1) above. Any doc
feature that turns out to need theme-classic specifically (versioning,
Algolia search) is a real, explicit trade to make — state it, don't silently
reach for the preset.

## Two sections behind the sidebar: /docs vs /explore

Both routes sit behind the SAME persistent sidebar (below), but solve
different problems and are NOT unified:

- **`/docs`** — real, hand-authored documentation. Markdown/MDX files under
  `apps/docs/docs/`, routed and sidebar-generated by
  `@docusaurus/plugin-content-docs` (autogenerated from folder structure,
  `sidebars.ts`). Rendering is our own minimal theme (previous section) —
  `src/components/docs/DocItem.tsx` renders a title + the compiled MDX with
  plain typographic CSS (`.docs-content` in `custom.css` — Tailwind's
  preflight zeroes out default `<p>`/`<h1>` margins, so writing ANY prose
  content needs this or it renders as one unreadable run-on block).
  `src/components/docs/DocRoot.tsx` renders content-docs' own
  per-doc-page sidebar (`DocSidebarItems.tsx`, a plain recursive renderer
  over `PropSidebarItem[]`) alongside the content — this is a SECOND,
  contextual sidebar for moving between doc pages, nested inside the global
  one's content pane, not a duplicate of it.
- **`/explore`** — every Storybook story/autodocs page, embedded via iframe.
  Nothing here is content-docs; it's a `?id=<storyId>&mode=story|docs` query
  param read by `src/pages/explore.tsx`, rendering
  `<iframe src="<baseUrl>storybook/iframe.html?id=...&viewMode=...">`.
  `src/hooks/useStorybookIndex.ts` fetches `<baseUrl>/storybook/index.json`
  CLIENT-SIDE (Storybook writes this at ITS OWN build time) — the single
  source of truth for "every page in Storybook," so no story-discovery logic
  is duplicated here, and it doesn't matter that `build:docs` runs before
  `build:storybook` (`pnpm run test:e2e`/the Pages workflow): the fetch just
  404s until Storybook's build lands. Fetch failure resolves to an empty
  list, never a crash.
  - `src/components/Sidebar.tsx`'s `buildTree` groups entries by their
    `title` (slash-separated, e.g. `Examples/Forms`) into a plain nested
    `Record<string, TreeNode>` — NOT a `Map`. A `Map`-based version crashed on
    first paint in production (`TypeError: Cannot read properties of
    undefined (reading 'groups')`, reproducible only with real fetched data,
    never isolated further) — switching to plain objects fixed it outright.
    Treat `Map` in this render path as suspect if the crash resurfaces.
  - Don't try to generate content-docs pages FROM Storybook's story data
    (one MDX file per story) to get a "proper" sidebar for this instead —
    considered and rejected: it would require building Storybook BEFORE
    Docusaurus (reversed from today, since Docusaurus would need
    `index.json` at ITS build time) and re-deriving Storybook's title→id
    slugging by hand. More framework-fighting for no gain over the
    client-fetch approach already in place.

## Persistent layout (sidebar on every page, landing included)

`src/theme/Root.tsx` — Docusaurus's documented global-wrapper swizzle point,
rendered around EVERY route — puts `<Sidebar>` in a fixed-height flex row
next to `{children}` (the page). This was an explicit request: the sidebar is
on the landing page too, not just `/docs`/`/explore`. Two consequences if you
touch this:

- `html`/`body`/`#__docusaurus` are pinned to `height: 100%` (`custom.css`) so
  the SIDEBAR and the PAGE each get their own `overflow-y-auto` scroll
  container instead of the whole document scrolling — without this the
  sidebar scrolls away with the page on anything taller than one screen.
- `custom.css` is imported from `Root.tsx`, not from `index.tsx` — it's the
  one place guaranteed to run for every route. There's no `theme.customCss`
  hook to register it through instead (no preset/theme registered at all —
  previous section), so this plain import IS the mechanism. Don't re-import
  it per-page.

## Tailwind under Docusaurus/webpack: two non-obvious gotchas

Both of these caused real, measured Lighthouse regressions during the
migration — don't reintroduce them.

1. **Scope `@source` explicitly, or Tailwind scans the whole monorepo.**
   `apps/storybook` uses `@tailwindcss/vite`, which scopes its automatic
   content detection to Vite's own module graph (precise). `apps/docs` can
   only use the generic `@tailwindcss/postcss` plugin (Docusaurus builds with
   webpack), which has no module graph to scope to — its automatic detection
   walks the whole git-tracked monorepo, generating utilities for every class
   used anywhere (Storybook stories included). `apps/docs/src/css/custom.css`
   opts out with `@import "tailwindcss" source(none);` and lists exactly the
   files this page renders via explicit `@source` lines (the page's own
   `src/pages`/`src/components`, plus the specific `packages/examples/*.tsx`
   files the demos import — not the whole `packages/examples` directory,
   which would pull in the unrelated shadcn `fields.tsx` bindings). Adding a
   new demo or biome means adding its source file to that list.
2. **Fonts get base64-inlined by Docusaurus's default webpack rule — don't
   fight this with a competing `module.rules` entry.** Docusaurus's font rule
   (`@docusaurus/utils`'s `getFileLoaderUtils`) is `url-loader` (inlines any
   font under its size threshold as a `data:` URI, else falls back to
   `file-loader`) as a PLAIN entry in `module.rules` — NOT `oneOf`-wrapped.
   An earlier attempt here added a second top-level rule forcing
   `.woff`/`.woff2`/`.ttf`/`.otf` to `type: 'asset/resource'`, reasoning that
   webpack's `oneOf` semantics would make it win. It doesn't: webpack applies
   EVERY matching rule in a plain (non-`oneOf`) `module.rules` array, so both
   ran, and the file ultimately served at the font's URL was
   `url-loader`'s file-loader-fallback JS module text (`export default
   __webpack_public_path__ + "..."`) instead of the binary — every self-hosted
   font 404's-worth-of-garbage ("OTS parsing error: invalid sfntVersion") in
   the browser console, silently falling back to system fonts. **Don't
   reintroduce a `module.rules` override for fonts.** What actually fixes the
   Lighthouse LCP budget, in order of impact: (a) `static-server.mjs`'s gzip
   (see below) — base64 text compresses fine; (b) importing only the
   `latin-*.css` file where the Fontsource package ships one
   (`@fontsource/instrument-serif/latin-400.css`,
   `@fontsource/ibm-plex-mono/latin-400.css`) instead of the full package
   entrypoint, which pulls EVERY subset (latin-ext, cyrillic, greek,
   vietnamese…) as separate `@font-face` `url()`s that still get inlined at
   build time even though the browser's `unicode-range` matching would never
   fetch them at runtime. The three variable-font families
   (`@fontsource-variable/*`) don't ship a latin-only file — Fontsource bundles
   every subset into one `wght.css` per family — so they're accepted as-is.
   If the budget gets tight again, that's the next lever: extract just the
   `-latin-` `@font-face` block from each `wght.css` (by comment header, e.g.
   `/* jetbrains-mono-latin-wght-normal */`) rather than reaching for a
   webpack rule again.

## Local perf/e2e testing: use `static-server.mjs`, not `docusaurus serve`

`apps/docs/scripts/static-server.mjs` is a small dependency-free static file
server, used by both Playwright (`playwright.config.ts` webServer) and
Lighthouse CI (`.lighthouserc.json` `startServerCommand`) — NOT
`docusaurus serve`. Two reasons, both measured, not theoretical:

- `docusaurus serve` runs everything through `serve-handler`'s `cleanUrls`
  mode, which 301-redirects any `.html` request to its extension-less form
  AND drops the query string in the process. That's fatal for the embedded
  Storybook build's `iframe.html?id=...&viewMode=story` deep links (the
  redirect strips the `?id=...` needed to pick a story) — e2e tests hitting
  those URLs silently land on the wrong page instead of failing loudly.
- It doesn't gzip. GitHub Pages (and any real static host) compresses
  text assets in transit; a local test server that doesn't measures the
  Lighthouse LCP/TBT budget against transfer sizes production will never
  actually see. This was the dominant cause of the LCP regression during the
  migration — bigger than the CSS/font fixes above, once those were in place.

If you touch the static server, keep both properties: no clean-url
redirects, gzip on when the client sends `Accept-Encoding: gzip`.

## Code display

Snippets and the schema-morph steps come from `apps/docs/plugins/snippets-plugin.ts`
(a Docusaurus content plugin) — see the [[code-example-pipeline]] skill for
the actual slicing/highlighting rules. Never hand-write a displayed code
string here.

## Changing these decisions

These are settled, evidence-backed decisions. If you find clear contradicting
evidence, or the user explicitly asks for behavior that conflicts with this
skill: do NOT silently comply or quietly adapt. State the conflict, get
explicit confirmation via the AskUserQuestion tool, and update this skill in
the same change so it stays the source of truth.
