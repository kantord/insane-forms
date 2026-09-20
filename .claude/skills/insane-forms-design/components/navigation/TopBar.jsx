import React from 'react'

export function TopBar({ links = [], style }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '28px',
        padding: '22px var(--gutter)',
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--muted-foreground)',
        ...style,
      }}
    >
      {links.map((l) => (
        <a key={l.label} href={l.href} style={{ color: 'inherit', textDecoration: 'none' }}>
          {l.label}
        </a>
      ))}
    </div>
  )
}
