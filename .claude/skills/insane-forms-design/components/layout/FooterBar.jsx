import React from 'react'

export function FooterBar({ href = '#', label = 'github.com/kantord/insane-forms', note, style }) {
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
        ...style,
      }}
    >
      <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
        {label}
      </a>
      {note ? <span>{note}</span> : null}
    </div>
  )
}
