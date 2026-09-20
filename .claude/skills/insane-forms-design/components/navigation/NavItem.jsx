import React from 'react'

export function NavItem({ href = '#', active = false, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        padding: 'var(--nav-item-pad)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-nav)',
        fontWeight: active ? 700 : 500,
        lineHeight: 1.35,
        textDecoration: 'none',
        color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
        background: active ? 'var(--primary)' : hover ? 'var(--muted)' : 'transparent',
        ...style,
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
