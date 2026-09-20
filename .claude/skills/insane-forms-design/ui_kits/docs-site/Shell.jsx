// Three-column frame + rails, shared by every screen in the kit.
function Eyebrow({ tone, children, style }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-eyebrow)',
        letterSpacing: 'var(--text-eyebrow-ls)',
        textTransform: 'uppercase',
        color: tone === 'accent' ? 'var(--primary)' : 'var(--muted-foreground)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function NavItem({ label, active, onClick, style }) {
  const [hover, setHover] = React.useState(false)
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        onClick && onClick()
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        padding: 'var(--nav-item-pad)',
        fontSize: 'var(--text-nav)',
        fontWeight: active ? 700 : 500,
        textDecoration: 'none',
        lineHeight: 1.35,
        color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
        background: active ? 'var(--primary)' : hover ? 'var(--muted)' : 'transparent',
        ...style,
      }}
    >
      {label}
    </a>
  )
}

function SidebarNav({ route, go, toc }) {
  return (
    <nav
      style={{
        width: 'var(--rail-nav-w)',
        flexShrink: 0,
        boxSizing: 'border-box',
        background: 'var(--rail)',
        borderRight: 'var(--rule-w) solid var(--border)',
        padding: 'var(--rail-pad-y) var(--rail-pad-x)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: '16px',
          letterSpacing: '-.02em',
          padding: '0 8px 20px',
        }}
      >
        insane-forms
      </div>
      <Eyebrow style={{ padding: '0 8px', marginBottom: '8px' }}>On this page</Eyebrow>
      {toc.map((t, i) => (
        <NavItem key={t} label={t} active={i === 0} onClick={() => {}} />
      ))}
      <Eyebrow style={{ padding: '0 8px', margin: '26px 0 8px' }}>Docs</Eyebrow>
      <NavItem label="Getting started" active={route === 'docs'} onClick={() => go('docs')} />
      <NavItem label="Guides" onClick={() => go('docs')} />
      <NavItem label="API reference" onClick={() => go('docs')} />
      <Eyebrow style={{ padding: '0 8px', margin: '26px 0 8px' }}>Examples</Eyebrow>
      <div
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--muted-foreground)',
        }}
      >
        Forms
      </div>
      <div
        style={{
          paddingLeft: '10px',
          marginLeft: '10px',
          borderLeft: 'var(--rule-w) solid var(--rail-border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <NavItem label="Profile" onClick={() => go('example')} />
        <NavItem label="Contacts" active={route === 'example'} onClick={() => go('example')} />
        <NavItem
          label="Categories — recursive schema"
          onClick={() => go('example')}
          style={{ lineHeight: 1.35 }}
        />
      </div>
      <NavItem label="Collections" onClick={() => go('example')} />
      <NavItem label="Editable table" onClick={() => go('example')} />
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '14px',
          borderTop: 'var(--rule-w) solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
        }}
      >
        <span>rev 0.1.0</span>
        <span>mit</span>
      </div>
    </nav>
  )
}

function AsideRail({ children }) {
  return (
    <aside
      style={{
        width: 'var(--rail-aside-w)',
        flexShrink: 0,
        boxSizing: 'border-box',
        background: 'var(--rail)',
        borderLeft: 'var(--rule-w) solid var(--border)',
        padding: 'var(--aside-pad-y) var(--aside-pad-x) 48px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Eyebrow style={{ paddingBottom: '18px', borderBottom: 'var(--rule-w) solid var(--border)' }}>
        Asides
      </Eyebrow>
      {children}
    </aside>
  )
}

function AsideNote({ label, offset, children }) {
  return (
    <div
      style={{
        marginTop: (offset || 36) + 'px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <Eyebrow tone="accent">{label || 'Note'}</Eyebrow>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-aside)',
          lineHeight: 1.65,
          color: 'var(--body)',
          textWrap: 'pretty',
        }}
      >
        {children}
      </p>
    </div>
  )
}

function TopBar({ theme, onToggleTheme }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '28px',
        padding: '22px var(--gutter)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--muted-foreground)',
      }}
    >
      <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
        Storybook
      </a>
      <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
        GitHub
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onToggleTheme()
        }}
        style={{
          color: 'inherit',
          textDecoration: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
        }}
      >
        {theme === 'dark' ? 'light' : 'dark'}
      </a>
    </div>
  )
}

function FooterBar({ note }) {
  return (
    <div
      style={{
        borderTop: 'var(--rule-w) solid var(--border)',
        padding: '22px var(--gutter)',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '24px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-meta)',
        color: 'var(--muted-foreground)',
      }}
    >
      <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
        github.com/kantord/insane-forms
      </a>
      <span>{note}</span>
    </div>
  )
}

function Field({ label, value, onChange, height }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
      <input
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          height: (height || 42) + 'px',
          boxSizing: 'border-box',
          padding: '0 12px',
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: 'var(--rule-w) solid var(--input)',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          outlineColor: 'var(--ring)',
        }}
      />
    </label>
  )
}

function CheckField({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14px' }}>
      <span
        onClick={() => onChange && onChange(!value)}
        style={{
          width: '16px',
          height: '16px',
          boxSizing: 'border-box',
          border: 'var(--rule-w) solid var(--input)',
          background: value ? 'var(--primary)' : 'var(--background)',
          cursor: 'pointer',
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  )
}

function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        alignSelf: 'flex-start',
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        padding: 'var(--control-pad)',
        fontFamily: 'var(--font-sans)',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// duotone code listing: one block element per source line
function Code({ lines, boxed }) {
  const c = {
    n1: 'var(--code-n1)',
    n2: 'var(--code-n2)',
    n3: 'var(--code-n3)',
    a1: 'var(--code-a1)',
    a2: 'var(--code-a2)',
  }
  return (
    <pre
      style={{
        margin: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-code)',
        lineHeight: 'var(--text-code-lh)',
        color: c.n1,
        background: boxed ? 'var(--code-bg)' : 'transparent',
        border: boxed ? 'var(--rule-w) solid var(--border)' : 'none',
        padding: boxed ? '28px 32px' : 0,
        overflow: 'hidden',
      }}
    >
      {lines.map((line, i) =>
        line.length === 0 ? (
          <span key={i} style={{ display: 'block', height: 'var(--code-line-h)' }} />
        ) : (
          <span key={i} style={{ display: 'block' }}>
            {line.map(([step, text], j) => (
              <span key={j} style={{ color: c[step] }}>
                {text}
              </span>
            ))}
          </span>
        ),
      )}
    </pre>
  )
}

window.Kit = {
  Eyebrow,
  NavItem,
  SidebarNav,
  AsideRail,
  AsideNote,
  TopBar,
  FooterBar,
  Field,
  CheckField,
  Button,
  Code,
}
