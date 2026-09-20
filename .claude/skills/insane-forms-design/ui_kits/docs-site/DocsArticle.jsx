function DocsArticle({ theme, onToggleTheme, go }) {
  const { SidebarNav, AsideRail, AsideNote, TopBar, FooterBar, Code, Eyebrow } = window.Kit
  const snippet = [
    [
      ['n3', 'import { '],
      ['n1', 'Input'],
      ['n3', ' } from '],
      ['n2', '"@/components/ui/input"'],
    ],
    [
      ['n3', 'import { '],
      ['n1', 'Label'],
      ['n3', ' } from '],
      ['n2', '"@/components/ui/label"'],
    ],
    [],
    [
      ['n3', 'const '],
      ['n1', 'TextField'],
      ['n3', ' = '],
      ['a1', 'z.string'],
      ['n3', '().'],
      ['a1', 'meta'],
      ['n3', '({'],
    ],
    [
      ['n2', '\u00a0\u00a0component:'],
      ['n3', ' ({ '],
      ['n1', 'value, onChange, label'],
      ['n3', ' }) => ('],
    ],
    [
      ['n3', '\u00a0\u00a0\u00a0\u00a0<div className='],
      ['n2', '"grid gap-2"'],
      ['n3', '>'],
    ],
    [
      ['n3', '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0<'],
      ['n1', 'Label'],
      ['n3', '>{'],
      ['n1', 'label'],
      ['n3', '}</'],
      ['n1', 'Label'],
      ['n3', '>'],
    ],
    [
      ['n3', '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0<'],
      ['n1', 'Input'],
      ['n3', ' value={'],
      ['n1', 'value'],
      ['n3', '} onChange={…} />'],
    ],
    [['n3', '\u00a0\u00a0\u00a0\u00a0</div>']],
    [['n3', '\u00a0\u00a0),']],
    [['n3', '})']],
  ]
  const render = [
    [
      ['n3', '<'],
      ['a1', 'InsaneForm'],
      ['n3', ' '],
      ['n2', 'schema='],
      ['n3', '{'],
      ['n1', 'Form'],
      ['n3', '} '],
      ['n2', 'onSubmit='],
      ['n3', '{'],
      ['n1', 'values'],
      ['n3', ' => '],
      ['n1', 'save'],
      ['n3', '('],
      ['n1', 'values'],
      ['n3', ')}>'],
    ],
    [
      ['n3', '\u00a0\u00a0<'],
      ['n1', 'Button'],
      ['n3', ' '],
      ['n2', 'type="submit"'],
      ['n3', '>'],
      ['n1', 'Save'],
      ['n3', '</'],
      ['n1', 'Button'],
      ['n3', '>'],
    ],
    [
      ['n3', '</'],
      ['a1', 'InsaneForm'],
      ['n3', '>'],
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
      <SidebarNav route="docs" go={go} toc={['Install', 'Attach a component', 'Render the form']} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopBar theme={theme} onToggleTheme={onToggleTheme} />
        <div
          style={{
            padding: '56px var(--gutter) 44px',
            borderBottom: 'var(--rule-w) solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          <Eyebrow>Docs · Getting started</Eyebrow>
          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              fontSize: 'var(--text-title)',
              lineHeight: 'var(--text-title-lh)',
              letterSpacing: 'var(--text-title-ls)',
            }}
          >
            Rendering a schema
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '20px',
              lineHeight: 1.55,
              color: 'var(--body)',
              maxWidth: 'var(--measure)',
              textWrap: 'pretty',
            }}
          >
            A schema describes the shape of the data. Attach a component to each node and the same
            schema also describes the interface.
          </p>
        </div>
        <div
          style={{
            padding: '44px var(--gutter) 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--text-h2)',
              fontWeight: 700,
              letterSpacing: '-.02em',
            }}
          >
            Install
          </h2>
          <code
            style={{
              alignSelf: 'flex-start',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              background: 'var(--foreground)',
              color: 'var(--background)',
              padding: '13px 16px',
            }}
          >
            pnpm add insane-forms zod
          </code>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--text-body-lh)',
              color: 'var(--body)',
              maxWidth: 'var(--measure)',
              textWrap: 'pretty',
            }}
          >
            Zod 4 and React 19 are peer dependencies. Nothing else is required — the package ships
            no styles and no components. The examples below use shadcn/ui primitives; any component
            works.
          </p>
        </div>
        <div
          style={{
            padding: '36px var(--gutter)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--text-h2)',
              fontWeight: 700,
              letterSpacing: '-.02em',
            }}
          >
            Attach a component to a node
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--text-body-lh)',
              color: 'var(--body)',
              maxWidth: 'var(--measure)',
              textWrap: 'pretty',
            }}
          >
            A field is a Zod schema with a renderer in its metadata. The renderer receives the
            node's draft value and a setter; everything it paints is yours.
          </p>
          <Code lines={snippet} boxed />
        </div>
        <div
          style={{
            padding: '36px var(--gutter) 48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            borderBottom: 'var(--rule-w) solid var(--border)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--text-h2)',
              fontWeight: 700,
              letterSpacing: '-.02em',
            }}
          >
            Render the form
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--text-body-lh)',
              color: 'var(--body)',
              maxWidth: 'var(--measure)',
              textWrap: 'pretty',
            }}
          >
            The form holds a draft of z.input. On submit it parses once and hands you z.output, so
            the values you receive are the values the schema promises.
          </p>
          <Code lines={render} boxed />
        </div>
        <div
          style={{
            padding: '36px var(--gutter) 48px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          }}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go('landing')
            }}
            style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}
          >
            ← Introduction
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go('example')
            }}
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Guides · nested groups →
          </a>
        </div>
        <FooterBar note="the same example drives the automated suite" />
      </div>
      <AsideRail>
        <AsideNote>
          A schema with no component renders nothing. That is deliberate: the library never picks a
          widget for you.
        </AsideNote>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingTop: '24px',
            marginTop: '28px',
            borderTop: 'var(--rule-w) solid var(--rail-border)',
          }}
        >
          <Eyebrow>See also</Eyebrow>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go('example')
            }}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--foreground)',
              textDecoration: 'none',
            }}
          >
            Field behaviors
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go('example')
            }}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--foreground)',
              textDecoration: 'none',
            }}
          >
            Recursive schemas
          </a>
        </div>
      </AsideRail>
    </div>
  )
}
window.DocsArticle = DocsArticle
