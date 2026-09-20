function Landing({ theme, onToggleTheme, go, draft, setDraft }) {
  const {
    SidebarNav,
    AsideRail,
    AsideNote,
    TopBar,
    FooterBar,
    Field,
    CheckField,
    Button,
    Code,
    Eyebrow,
  } = window.Kit
  const schema = [
    [
      ['n3', 'const '],
      ['n1', 'Contact'],
      ['n3', ' = '],
      ['a1', 'insane.group'],
      ['n3', '({'],
    ],
    [
      ['n2', '\u00a0\u00a0email:'],
      ['n1', '   TextField'],
      ['a1', '.email'],
      ['n3', '(),'],
    ],
    [
      ['n2', '\u00a0\u00a0primary:'],
      ['n1', ' CheckField'],
      ['n3', ','],
    ],
    [['n3', '})']],
    [],
    [
      ['n3', 'const '],
      ['n1', 'Form'],
      ['n3', ' = '],
      ['a1', 'insane.group'],
      ['n3', '({'],
    ],
    [
      ['n2', '\u00a0\u00a0name:'],
      ['n1', '     TextField'],
      ['n3', ','],
    ],
    [
      ['n2', '\u00a0\u00a0contacts:'],
      ['n1', ' Contact'],
      ['a1', '.array'],
      ['n3', '()'],
    ],
    [
      ['a1', '\u00a0\u00a0\u00a0\u00a0.min'],
      ['n3', '('],
      ['a2', '1'],
      ['n3', ').'],
      ['a1', 'max'],
      ['n3', '('],
      ['a2', '3'],
      ['n3', '),'],
    ],
    [['n3', '})']],
  ]
  const principles = [
    [
      'Matchless rendering',
      'Every node carries its renderer in .meta(). The core never switches on schema type.',
    ],
    [
      'Zero DOM in core',
      'Shells, list chrome, widgets — all user code. The library ships behavior, you ship the looks.',
    ],
    ['Draft vs submit', 'The form edits the z.input draft; onSubmit receives parsed z.output.'],
    [
      'Tree-shakeable',
      'Named exports only. ~0.7 kB for the resolve toolkit alone, zero react-hook-form.',
    ],
  ]
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
        minWidth: '1440px',
      }}
    >
      <SidebarNav
        route="landing"
        go={go}
        toc={['Overview', 'Schema → form', 'Design principles', 'Why it never guesses']}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopBar theme={theme} onToggleTheme={onToggleTheme} />
        <div
          style={{
            padding: '64px var(--gutter) 68px',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            borderBottom: 'var(--rule-w) solid var(--border)',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              fontSize: 'var(--text-display)',
              lineHeight: 'var(--text-display-lh)',
              letterSpacing: 'var(--text-display-ls)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
              The schema <span style={{ color: 'var(--primary)' }}>is</span>
            </span>
            <span style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>the form.</span>
          </h1>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '40px',
              alignItems: 'start',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-lead)',
                lineHeight: 'var(--text-lead-lh)',
                color: 'var(--body)',
                textWrap: 'pretty',
              }}
            >
              insane-forms renders React forms straight from plain Zod schemas. No JSON dialect, no
              renderer registry, no match statement — each schema node carries its own component,
              and React does the traversal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <code
                style={{
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  padding: '13px 16px',
                }}
              >
                pnpm add insane-forms
              </code>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-meta)',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-foreground)',
                }}
              >
                zod 4 · react 19 · mit
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div
            style={{
              padding: 'var(--section-y) var(--gutter)',
              borderRight: 'var(--rule-w) solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <Eyebrow tone="accent">Schema</Eyebrow>
            <Code lines={schema} />
          </div>
          <div
            style={{
              padding: 'var(--section-y) var(--gutter)',
              background: 'var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <Eyebrow tone="accent">Output</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Field
                label="Name"
                value={draft.name}
                onChange={(v) => setDraft({ ...draft, name: v })}
              />
              <Field
                label="Contacts · email"
                value={draft.email}
                onChange={(v) => setDraft({ ...draft, email: v })}
              />
              <CheckField
                label="Primary"
                value={draft.primary}
                onChange={(v) => setDraft({ ...draft, primary: v })}
              />
              <Button onClick={() => go('example')}>Save</Button>
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: 'var(--rule-w) solid var(--border)',
            padding: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '44px 48px',
          }}
        >
          {principles.map(([t, b]) => (
            <div key={t}>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 700,
                  letterSpacing: '-.02em',
                }}
              >
                {t}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-small)',
                  lineHeight: 1.7,
                  color: 'var(--muted-foreground)',
                }}
              >
                {b}
              </p>
            </div>
          ))}
        </div>
        <div
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)',
            padding: 'var(--section-y) var(--gutter)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '28px',
              lineHeight: 1.35,
              fontWeight: 600,
              letterSpacing: '-.02em',
              maxWidth: '900px',
              textWrap: 'pretty',
            }}
          >
            A schema is data. No components, no registry — and honestly: nothing renders. That is
            the point; the library never guesses.
          </p>
        </div>
        <FooterBar note="the same example drives the automated suite" />
      </div>
      <AsideRail>
        <AsideNote offset={520}>
          The add and remove bounds on the contact list are read from the schema's own
          .min(1).max(3). Nothing configures them twice.
        </AsideNote>
      </AsideRail>
    </div>
  )
}
window.Landing = Landing
