---
name: insane-forms-design
description: Use this skill to generate well-branded interfaces and assets for insane-forms, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## What is here

- `readme.md` — the design guide: sources, voice, visual foundations, accent budget, iconography, caveats. Read this first.
- `styles.css` + `tokens/` — the tokens, as shadcn/ui CSS variable names. Link `styles.css`, or paste the token blocks into the target app's `globals.css`.
- `components/` — 25 React components in six groups. Each has a `.jsx` implementation, a `.d.ts` props contract, and a `.prompt.md` saying when to use it.
- `guidelines/` — specimen cards for colors, type, code highlighting, spacing.
- `ui_kits/docs-site/` — a runnable click-through of the three real surfaces (landing, docs article, live example) in both themes.

## Installing into Claude Code

Drop this folder at `.claude/skills/insane-forms-design/` in the target repo (or `~/.claude/skills/` to have it everywhere), then invoke it by name.

## Working in the target repo

The system assumes Tailwind CSS v4 + shadcn/ui + React 19. Port tokens first, then the three global deltas after `npx shadcn init`: radius scale to `0rem`, borders to `border-[length:var(--rule-w)]`, and `shadow-*` stripped from Button/Input/Card. Build `Field` and `CheckField` before anything else — they are what a schema node's renderer returns.

Do not treat `components/*.jsx` as drop-in source. They are reference implementations written with inline styles so they run without a build step; recreate them with the repo's own component conventions and lift the exact values.
