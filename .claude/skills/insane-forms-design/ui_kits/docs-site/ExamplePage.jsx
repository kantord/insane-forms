function ExamplePage({ theme, onToggleTheme, go }) {
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
  const MAX = 3
  const [name, setName] = React.useState('')
  const [contacts, setContacts] = React.useState([{ email: '', primary: true }])
  const [saved, setSaved] = React.useState(null)
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
  const set = (i, patch) => setContacts(contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)))
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
      <SidebarNav route="example" go={go} toc={['Schema', 'Live form', 'What you get']} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopBar theme={theme} onToggleTheme={onToggleTheme} />
        <div
          style={{
            padding: '56px var(--gutter) 40px',
            borderBottom: 'var(--rule-w) solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <Eyebrow>Examples · Forms</Eyebrow>
          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              fontSize: 'var(--text-title-sm)',
              lineHeight: '.96',
              letterSpacing: 'var(--text-title-ls)',
            }}
          >
            Contacts — dynamic list
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--body)',
              maxWidth: '640px',
              textWrap: 'pretty',
            }}
          >
            One group, repeated. The add and remove controls take their bounds from the array's own
            constraints.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: 'var(--rule-w) solid var(--border)',
          }}
        >
          <div
            style={{
              padding: '40px var(--gutter)',
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
              padding: '40px var(--gutter)',
              background: 'var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <Eyebrow tone="accent">Live</Eyebrow>
            <Field label="Name" value={name} onChange={setName} height={40} />
            {contacts.map((c, i) => (
              <div
                key={i}
                style={{
                  border: 'var(--rule-w) solid var(--border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--background)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Eyebrow style={{ whiteSpace: 'nowrap' }}>{'Contact ' + (i + 1)}</Eyebrow>
                  {contacts.length > 1 ? (
                    <span
                      onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        cursor: 'pointer',
                      }}
                    >
                      remove
                    </span>
                  ) : null}
                </div>
                <Field
                  label="Email"
                  value={c.email}
                  onChange={(v) => set(i, { email: v })}
                  height={36}
                />
                <CheckField
                  label="Primary"
                  value={c.primary}
                  onChange={(v) => set(i, { primary: v })}
                />
              </div>
            ))}
            <div
              onClick={() =>
                contacts.length < MAX && setContacts([...contacts, { email: '', primary: false }])
              }
              style={{
                border: 'var(--rule-w) dashed var(--rail-border)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                cursor: contacts.length < MAX ? 'pointer' : 'default',
                opacity: contacts.length < MAX ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                + add contact
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--muted-foreground)',
                  whiteSpace: 'nowrap',
                }}
              >
                {contacts.length + ' of ' + MAX}
              </span>
            </div>
            <Button onClick={() => setSaved({ name, contacts })}>Save</Button>
            {saved ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.7,
                }}
              >
                {'onSubmit → { name: "' +
                  (saved.name || '') +
                  '", contacts: ' +
                  saved.contacts.length +
                  ' }'}
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            padding: '40px var(--gutter) 48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '32px',
          }}
        >
          {[
            ['Draft', 'z.input, edited in place'],
            ['Parsed', 'z.output, handed to onSubmit'],
            ['Bounds', '.min(1).max(3), read once'],
          ].map(([t, b]) => (
            <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <Eyebrow tone="accent">{t}</Eyebrow>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: 'var(--muted-foreground)',
                }}
              >
                {b}
              </p>
            </div>
          ))}
        </div>
        <FooterBar note="the same example drives the automated suite" />
      </div>
      <AsideRail>
        <AsideNote>
          This page is the test fixture. The same schema drives the automated suite, so the example
          cannot drift from the library.
        </AsideNote>
      </AsideRail>
    </div>
  )
}
window.ExamplePage = ExamplePage
