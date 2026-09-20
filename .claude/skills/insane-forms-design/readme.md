# insane-forms — design system

insane-forms is a React form library: it renders forms straight from plain Zod schemas, with no JSON dialect, no renderer registry and no match statement. Each schema node carries its own component in `.meta()`, and React does the traversal. The library ships behaviour, not looks — so the product surfaces (a landing page, a docs site, example pages) are the only place a visual identity exists, and this system is that identity.

Stack the system targets: **Tailwind CSS v4 + shadcn/ui + React 19**, consuming the tokens in `styles.css` as shadcn's own CSS variables.

## Sources

This system was derived from designs produced in this project, not from an external brand kit:

- `insane-forms Landing v2.dc.html` — the approved landing page (light theme).
- `insane-forms Pages.dc.html` — docs article and example page, in both themes.
- `Design system handoff.dc.html` — the written spec (tokens, atomic inventory, build order) this system implements.
- Repository referenced throughout the designs: `github.com/kantord/insane-forms`.

No Figma file, brand kit, logo files or font binaries were supplied. See **Caveats**.

## Index

| Path | What it holds |
| --- | --- |
| `styles.css` | The entry point: `@import`s every token file. Consumers link this one file. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `layout.css`, `code.css` |
| `components/core/` | Button, Eyebrow, InlineCode, Rule |
| `components/forms/` | Label, Input, Checkbox, Field, CheckField, RepeatCard, AddControl |
| `components/code/` | Token, CodeLine, CodeBlock, InstallCommand |
| `components/navigation/` | NavItem, NavGroup, SidebarNav, PrevNext, TopBar |
| `components/layout/` | DocsShell, AsideRail, AsideNote, Section, StatementBand, FooterBar |
| `components/patterns/` | Hero, SchemaDiptych, PrincipleList, PageHeader |
| `guidelines/` | Foundation specimen cards (Colors, Type, Code, Spacing, Brand) |
| `ui_kits/docs-site/` | Click-through recreation of the landing, docs and example surfaces |
| `SKILL.md` | Agent-skill entry point |

## Content fundamentals

The voice is a library author talking to another engineer. Flat, declarative, faintly dry.

- **Statements, not pitches.** "The schema is the form." "A schema is data." No superlatives, no "powerful", no "effortlessly".
- **Second person for instructions, third for behaviour.** "Attach a component to each node" / "The core never switches on schema type."
- **Sentence case everywhere** except mono eyebrows, which are uppercase with wide tracking (`DOCS · GETTING STARTED`).
- **API names are written as code, inline, unquoted:** `z.input`, `.min(1).max(3)`, `.meta()`. The copy leans on them instead of paraphrasing.
- **Constraints are stated plainly, including the awkward ones.** The landing page says outright that a bare schema renders nothing: "That is the point; the library never guesses." Admitting a limitation is on-brand; hiding it is not.
- **Em dashes and semicolons are used sparingly but deliberately**, usually to attach a consequence: "Shells, list chrome, widgets — all user code."
- **No emoji. No exclamation marks.** Numbers appear only when exact (`~0.7 kB`, `1 of 3`, `rev 0.1.0`).
- Titles are short noun phrases: "Rendering a schema", "Contacts — dynamic list".

## Visual foundations

**Colours.** Light mode is warm paper (`#fbfbf9`) with near-black ink (`#111110`) and one electric blue accent (`#3a35ff`). Dark mode is *not* an inversion: warm charcoal (`#1c1b18`), bone type (`#efece3`), and the accent shifts hue to amber (`#d9a441`) because saturated blue on a dark ground reads cheap. Two grounds per theme at most — content and `--muted` panel — plus a third, darker `--rail` in dark mode so the three columns separate once rules thin out.

**Type.** Two families, two jobs. Archivo (400–900) is the human voice: 900 for display, 700 for headings and UI, 400 for prose. Spline Sans Mono is the machine voice: code, eyebrow labels, counters, meta. A mono label means "this is a name the system uses". Display type is tight (-0.05em, 0.9 leading) and large; prose is generous (1.75) and capped at a 660px measure.

**Backgrounds.** Flat colour only. No images, no illustration, no pattern, no texture, no gradient — anywhere. The landing page's visual interest comes from type scale and the rule grid, not imagery.

**Borders and structure.** The system draws its structure: `--rule-w` is 2px in light and 1px in dark, applied as column dividers, section dividers and field outlines. Borders are the layout. Radius is `0` everywhere, including buttons, inputs and checkboxes.

**Shadows.** None. `--shadow: none` exists so components can reference it explicitly and nobody reintroduces one. Elevation is expressed by a change of ground, never by a shadow. No blur, no transparency, no glass.

**Cards.** There are no cards in the usual sense — no rounded, shadowed, floating containers. The two container patterns are (1) a bordered rectangle with 16px padding (`RepeatCard`, boxed code) and (2) a full-bleed band on a different ground (`SchemaDiptych`'s right half, `StatementBand`).

**Hover states.** Nav items take a `--muted` fill. Links underline with a 2–3px offset; they never change colour on hover. Buttons darken by nothing — they do not animate.

**Press states.** None beyond the browser default. This is a documentation surface, not an app.

**Animation.** Effectively absent. No entrance animation, no scroll effects, no easing curves to document. If a transition is ever added it should be a 120ms opacity or background change and nothing more.

**Layout rules.** One frame: 266px nav rail, flexible content column with 48px gutters, 280px aside rail. Both rails are permanent on every surface, landing included — that continuity is a deliberate corrective to sites whose marketing page and docs feel like different products. Nothing is `position: fixed`. Section padding is 44px vertical, 48px horizontal.

**Accent budget.** The accent marks two things: parts of a schema that become UI, and the single primary action. Per view: at most one accent-filled button and one accent-filled nav item; accent type is allowed on the headline verb, section eyebrows, forward links and duotone code tokens. Never on body prose, never as a border, never as a background wash.

**Code.** Highlighting is duotone: three neutral steps (identifiers / keys and strings / keywords and punctuation) plus two accent steps used only for schema constructors and their constraints. Every step clears 4.5:1 on its own ground. Code lines are rendered as block elements, one per source line, at a fixed 26px line box.

**Imagery.** There is none, by design. If imagery is ever needed, it should be a screenshot of real code or a real form — never stock photography or abstract 3D.

## Iconography

The designs use **no icon set at all** — no icon font, no sprite, no SVG library. Their functions are carried by type instead:

- Disclosure and direction: the characters `←` and `→` in mono, e.g. `← Introduction`.
- "Add" affordances: a literal `+` inside a mono label (`+ add contact`).
- Destructive affordance: the word `remove` in mono 11px, no trash glyph.
- Checked state: a solid accent square, not a tick mark.
- Counters and bounds: mono text (`1 of 3`).

No emoji anywhere. If an icon set becomes necessary, use Lucide at 1.5px stroke and 16px, which matches the type weight of the rail — and record that decision here. Until then, prefer a word.

## Intentional additions

Nothing in the source designs was a named component, so the inventory was derived from the surfaces themselves. Three additions worth flagging:

- **Token / CodeLine** — the duotone scheme in the designs was hand-marked; these make it reusable and enforce the one-block-per-line rule.
- **Section** — extracted because the ruled band with 44/48 padding recurs on every surface.
- **Rule** — extracted so nobody hand-writes `border-top` with a literal colour.

## Caveats

- **No font binaries.** Archivo and Spline Sans Mono are loaded from Google Fonts in `tokens/fonts.css`. If you self-host, replace that import with local `@font-face` rules — the token names do not change.
- **No logo.** None was supplied, so the wordmark is simply "insane-forms" set in Archivo 800 at -0.02em. Nothing was drawn or invented.
- **Light mode is the reference.** Dark mode was designed second; the landing page in dark exists in `insane-forms Pages.dc.html` but has had less scrutiny than the light surfaces.
- **The destructive colour is unspecified.** The designs never show an error or destructive state, so `--destructive` is deliberately absent rather than guessed.
